import type { GuildMember, MessageCreateOptions, PartialGuildMember } from "discord.js";
import { CARD, card, drawn } from "./card.ts";
import { post } from "./channel.ts";
import { avatarData, greetingImage } from "./images.ts";
import type { GreetingKind, GreetingSettings } from "./settings.ts";

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

/**
 * The greeting card for a member: Nexo's picture of them on top (name, server and, for a
 * welcome, their member number), the server's message below. With ping on, the mention in the
 * message notifies them.
 */
export async function greetingMessage(
    kind: GreetingKind,
    member: Member,
    settings: GreetingSettings,
): Promise<MessageCreateOptions> {
    const text = fillGreeting(settings.message, {
        id: member.id,
        username: member.user.username,
        server: member.guild.name,
        count: member.guild.memberCount,
    });
    const avatar = await avatarData(
        member.displayAvatarURL({ extension: "png", size: 256, forceStatic: true }),
    );
    const picture = drawn(
        `${kind}.png`,
        greetingImage({
            avatar,
            name: member.displayName,
            server: member.guild.name,
            number: kind === "welcome" ? member.guild.memberCount : undefined,
        }),
    );
    return {
        components: [card(null, text, { top: picture.url })],
        files: [picture.file],
        flags: CARD,
        allowedMentions: { users: settings.ping ? [member.id] : [] },
    };
}

/** Posts the greeting card, or says why it could not, as `post` does. */
export async function sendGreeting(kind: GreetingKind, member: Member, settings: GreetingSettings) {
    return post(member.guild, settings.channelId, await greetingMessage(kind, member, settings));
}
