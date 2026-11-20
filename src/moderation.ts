import { type GuildMember, PermissionFlagsBits } from "discord.js";

/** What a moderator can do to a member through Nexo. */
export type ModerationAction = "warn" | "timeout" | "kick" | "ban";

/** Why Nexo refuses an action, most basic reason first. */
export type ModerationProblem =
    | "self"
    | "nexo"
    | "owner"
    | "above-you"
    | "admin"
    | "no-permission"
    | "above-nexo";

/** What the checks need to know, gathered from Discord by {@link factsFor}. */
export type ModerationFacts = {
    targetId: string;
    moderatorId: string;
    nexoId: string;
    ownerId: string;
    moderatorAboveTarget: boolean;
    targetIsAdmin: boolean;
    nexoHasPermission: boolean;
    nexoAboveTarget: boolean;
};

/**
 * Whether a moderator may do an action to a member. Discord checks only that the moderator has
 * the permission, not the role order, so Nexo checks that the target ranks below the moderator,
 * or someone could use Nexo against a member above them.
 */
export function moderationProblem(
    action: ModerationAction,
    facts: ModerationFacts,
): ModerationProblem | undefined {
    if (facts.targetId === facts.moderatorId) return "self";
    if (facts.targetId === facts.nexoId) return "nexo";
    if (facts.targetId === facts.ownerId) return "owner";
    if (facts.moderatorId !== facts.ownerId && !facts.moderatorAboveTarget) return "above-you";
    if (action === "warn") return undefined; // a warning stays with Nexo; Discord does nothing
    if (action === "timeout" && facts.targetIsAdmin) return "admin"; // Discord can't mute them
    if (!facts.nexoHasPermission) return "no-permission";
    if (!facts.nexoAboveTarget) return "above-nexo";
    return undefined;
}

/** The permission Nexo needs for an action that Discord carries out. */
export const NEXO_PERMISSION = {
    timeout: PermissionFlagsBits.ModerateMembers,
    kick: PermissionFlagsBits.KickMembers,
    ban: PermissionFlagsBits.BanMembers,
} as const;

/** The facts about a target, a moderator and Nexo on their server. */
export function factsFor(
    action: ModerationAction,
    target: GuildMember,
    moderator: GuildMember,
): ModerationFacts {
    const { guild } = target;
    const me = guild.members.me;
    return {
        targetId: target.id,
        moderatorId: moderator.id,
        nexoId: target.client.user.id,
        ownerId: guild.ownerId,
        moderatorAboveTarget: moderator.roles.highest.comparePositionTo(target.roles.highest) > 0,
        targetIsAdmin: target.permissions.has(PermissionFlagsBits.Administrator),
        nexoHasPermission:
            action !== "warn" && (me?.permissions.has(NEXO_PERMISSION[action]) ?? false),
        nexoAboveTarget: target.manageable,
    };
}
