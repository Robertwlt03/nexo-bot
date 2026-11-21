import type { Guild, GuildBasedChannel, MessageCreateOptions } from "discord.js";

/** What Nexo needs in a channel to post its cards. */
export const POST_PERMISSIONS = ["ViewChannel", "SendMessages", "EmbedLinks"] as const;
/** What Nexo needs in a channel to run tickets there as private threads. */
export const TICKET_PERMISSIONS = [
    ...POST_PERMISSIONS,
    "CreatePrivateThreads",
    "SendMessagesInThreads",
    "ManageThreads",
] as const;
/** Every channel permission Nexo checks, the names `texts.permissionNames` translates. */
export type ChannelPermission = (typeof TICKET_PERMISSIONS)[number] | "MentionEveryone";

/** The permissions Nexo still lacks in a channel; by default, those it needs to post cards. */
export function missingPermissions(
    channel: GuildBasedChannel,
    needed: readonly ChannelPermission[] = POST_PERMISSIONS,
): ChannelPermission[] {
    const me = channel.guild.members.me;
    if (!me) return [...needed];
    return channel.permissionsFor(me).missing([...needed]) as ChannelPermission[];
}

/**
 * Posts in a server's channel, or says why it could not: the channel is gone, or the permissions
 * Nexo lacks there.
 */
export async function post(
    guild: Guild,
    channelId: string,
    message: MessageCreateOptions,
): Promise<"sent" | "no-channel" | ChannelPermission[]> {
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isSendable()) return "no-channel";
    const missing = missingPermissions(channel);
    if (missing.length > 0) return missing;
    await channel.send(message);
    return "sent";
}
