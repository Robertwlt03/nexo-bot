import type {
    GuildBasedChannel,
    GuildMember,
    MessageCreateOptions,
    PartialGuildMember,
} from "discord.js";
import { card } from "./card.ts";
import type { GreetingSettings } from "./settings.ts";

/** Someone who joins or, for a goodbye, has just left; then Discord may send only part of them. */
type Member = GuildMember | PartialGuildMember;

/** The placeholders a greeting may use, the same as in Nexo's earlier version. */
export function fillGreeting(
    template: string,
    member: { id: string; username: string; server: string; count: number },
): string {
    return template
        .replaceAll("{user}", `<@${member.id}>`)
        .replaceAll("{username}", member.username)
        .replaceAll("{server}", member.server)
        .replaceAll("{membercount}", String(member.count));
}

/** The greeting card for a member; with ping on, the mention above it notifies them. */
export function greetingMessage(member: Member, settings: GreetingSettings): MessageCreateOptions {
    const text = fillGreeting(settings.message, {
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

/** What Nexo needs in a greeting's channel to post its card. */
export const GREETING_PERMISSIONS = ["ViewChannel", "SendMessages", "EmbedLinks"] as const;
export type GreetingPermission = (typeof GREETING_PERMISSIONS)[number];

/** The permissions Nexo still lacks in a channel; none means it can post its cards there. */
export function missingPermissions(channel: GuildBasedChannel): GreetingPermission[] {
    const me = channel.guild.members.me;
    if (!me) return [...GREETING_PERMISSIONS];
    return channel.permissionsFor(me).missing([...GREETING_PERMISSIONS]) as GreetingPermission[];
}

/** Posts the greeting card, or says why it could not: the channel is gone or Nexo may not post. */
export async function sendGreeting(
    member: Member,
    settings: GreetingSettings,
): Promise<"sent" | "no-channel" | "no-permission"> {
    const channel = member.guild.channels.cache.get(settings.channelId);
    if (!channel?.isSendable()) return "no-channel";
    if (missingPermissions(channel).length > 0) return "no-permission";
    await channel.send(greetingMessage(member, settings));
    return "sent";
}
