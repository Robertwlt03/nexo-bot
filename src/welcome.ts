import type { GuildBasedChannel, GuildMember, MessageCreateOptions } from "discord.js";
import { card } from "./card.ts";
import type { WelcomeSettings } from "./settings.ts";

/** The placeholders a welcome message may use, the same as in Nexo's earlier version. */
export function fillWelcome(
    template: string,
    member: { id: string; username: string; server: string; count: number },
): string {
    return template
        .replaceAll("{user}", `<@${member.id}>`)
        .replaceAll("{username}", member.username)
        .replaceAll("{server}", member.server)
        .replaceAll("{membercount}", String(member.count));
}

/** The welcome card for a member; with ping on, the mention above it notifies them. */
export function welcomeMessage(
    member: GuildMember,
    settings: WelcomeSettings,
): MessageCreateOptions {
    const text = fillWelcome(settings.message, {
        id: member.id,
        username: member.user.username,
        server: member.guild.name,
        count: member.guild.memberCount,
    });
    return {
        content: settings.ping ? `<@${member.id}>` : undefined,
        allowedMentions: { users: settings.ping ? [member.id] : [] },
        embeds: [
            card(member.guild.name)
                .setDescription(text)
                .setThumbnail(member.displayAvatarURL({ size: 256 })),
        ],
    };
}

/** What Nexo needs in the welcome channel to post its card. */
export const WELCOME_PERMISSIONS = ["ViewChannel", "SendMessages", "EmbedLinks"] as const;
export type WelcomePermission = (typeof WELCOME_PERMISSIONS)[number];

/** The permissions Nexo still lacks in a channel; none means it can post the welcome there. */
export function missingPermissions(channel: GuildBasedChannel): WelcomePermission[] {
    const me = channel.guild.members.me;
    if (!me) return [...WELCOME_PERMISSIONS];
    return channel.permissionsFor(me).missing([...WELCOME_PERMISSIONS]) as WelcomePermission[];
}

/** Posts the welcome card, or says why it could not: the channel is gone or Nexo may not post. */
export async function sendWelcome(
    member: GuildMember,
    settings: WelcomeSettings,
): Promise<"sent" | "no-channel" | "no-permission"> {
    const channel = member.guild.channels.cache.get(settings.channelId);
    if (!channel?.isSendable()) return "no-channel";
    if (missingPermissions(channel).length > 0) return "no-permission";
    await channel.send(welcomeMessage(member, settings));
    return "sent";
}
