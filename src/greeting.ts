import type { GuildMember, MessageCreateOptions, PartialGuildMember } from "discord.js";
import { card } from "./card.ts";
import { post } from "./channel.ts";
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

/** Posts the greeting card, or says why it could not, as `post` does. */
export function sendGreeting(member: Member, settings: GreetingSettings) {
    return post(member.guild, settings.channelId, greetingMessage(member, settings));
}
