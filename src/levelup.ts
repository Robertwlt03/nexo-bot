import {
    ChannelType,
    type Message,
    type MessageCreateOptions,
    roleMention,
    subtext,
    userMention,
} from "discord.js";
import { giveRoles } from "./autorole.ts";
import { CARD, card } from "./card.ts";
import { missingPermissions, POST_PERMISSIONS, post } from "./channel.ts";
import { icon } from "./icons.ts";
import { announced, levelFor, reachedLevel, rollXp, type xpCooldowns } from "./leveling.ts";
import type { Settings } from "./settings.ts";

/**
 * The level-up card: one quiet line with the level and the member, and the roles this level gives.
 * It holds no words, so it needs no language, and it notifies nobody.
 */
export function levelUpCard(level: number, userId: string, roleIds: string[] = []) {
    const roles = roleIds.length
        ? `\n${subtext(`${icon("autorole")}${roleIds.map(roleMention).join(" ")}`)}`
        : "";
    return card(null, `${icon("levelup")}**Level ${level}** · ${userMention(userId)}${roles}`);
}

/**
 * Gives XP for a message, the level roles it reaches, and posts the level-up card where the server
 * wants it. Roles are checked on every message that earns XP, so a role added later, or a member
 * who comes back, catches up by itself.
 */
export async function earnXp(
    message: Message<true>,
    settings: Settings,
    cooldowns: ReturnType<typeof xpCooldowns>,
): Promise<void> {
    // Tickets and other private threads are talks with the team, not activity.
    if (message.channel.type === ChannelType.PrivateThread) return;
    if (!cooldowns.take(`${message.guildId}:${message.author.id}`, Date.now())) return;
    const earned = rollXp();
    const total = settings.addXp(message.guildId, message.author.id, earned);
    const levelRoles = settings.levelRoles(message.guildId);
    const reached = levelRoles.filter((reward) => reward.level <= levelFor(total).level);
    if (message.member) {
        const ids = reached.map(({ roleId }) => roleId);
        // A role Nexo can't give only costs this message's roles, never its XP or card.
        await giveRoles(message.member, ids, "Nexo: level role").catch((error: unknown) =>
            console.error(`Could not give level roles to ${message.author.tag}:`, error),
        );
    }
    const level = reachedLevel(total, earned);
    if (level === undefined) return;
    // Only roles Nexo could give: the card names what the member got.
    const rewards = reached
        .filter((reward) => reward.level === level)
        .map(({ roleId }) => roleId)
        .filter((id) => message.guild.roles.cache.get(id)?.editable);
    // A level that gives a role is always worth a card.
    if (!announced(level) && rewards.length === 0) return;
    const channelId = settings.levelUpChannel(message.guildId);
    if (channelId === null) return;
    const shown: MessageCreateOptions = {
        components: [levelUpCard(level, message.author.id, rewards)],
        flags: CARD,
    };
    if (channelId) {
        const result = await post(message.guild, channelId, shown);
        if (result !== "sent") console.error(`No level-up card on ${message.guild.name}:`, result);
        return;
    }
    // Every refused post counts toward Discord's limit on invalid requests.
    const needed = message.channel.isThread()
        ? (["ViewChannel", "SendMessagesInThreads"] as const)
        : POST_PERMISSIONS;
    if (missingPermissions(message.channel, needed).length === 0) await message.channel.send(shown);
}
