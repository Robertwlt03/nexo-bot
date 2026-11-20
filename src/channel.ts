import type { Guild, GuildBasedChannel, MessageCreateOptions } from "discord.js";

/** What Nexo needs in a channel to post its cards. */
export const POST_PERMISSIONS = ["ViewChannel", "SendMessages", "EmbedLinks"] as const;
export type PostPermission = (typeof POST_PERMISSIONS)[number];

/** The permissions Nexo still lacks in a channel; none means it can post its cards there. */
export function missingPermissions(channel: GuildBasedChannel): PostPermission[] {
    const me = channel.guild.members.me;
    if (!me) return [...POST_PERMISSIONS];
    return channel.permissionsFor(me).missing([...POST_PERMISSIONS]) as PostPermission[];
}

/**
 * Posts in a server's channel, or says why it could not: the channel is gone, or the permissions
 * Nexo lacks there.
 */
export async function post(
    guild: Guild,
    channelId: string,
    message: MessageCreateOptions,
): Promise<"sent" | "no-channel" | PostPermission[]> {
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isSendable()) return "no-channel";
    const missing = missingPermissions(channel);
    if (missing.length > 0) return missing;
    await channel.send(message);
    return "sent";
}
