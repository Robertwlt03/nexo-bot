import type { GuildMember, Role } from "discord.js";

/** Why Nexo cannot give a role to new members, or nothing when it can. */
export type AutoroleProblem = "everyone" | "managed" | "above-you" | "no-permission" | "too-high";

/**
 * Checks a role the way Discord will when Nexo gives it: @everyone and the roles of integrations
 * (bots, server boosts) cannot be given, and Nexo needs Manage Roles and a higher role of its own.
 * Discord lets anyone with Manage Roles use /autorole, whatever their rank, so the role must also
 * sit below the asker's highest role, as Discord's own role settings demand; otherwise someone
 * could have Nexo hand out a role above their own, to an account of theirs that joins.
 */
export function autoroleProblem(
    role: Pick<Role, "id" | "managed" | "editable">,
    guildId: string,
    { askerAboveRole, canManageRoles }: { askerAboveRole: boolean; canManageRoles: boolean },
): AutoroleProblem | undefined {
    if (role.id === guildId) return "everyone"; // @everyone shares the server's ID
    if (role.managed) return "managed";
    if (!askerAboveRole) return "above-you";
    if (!canManageRoles) return "no-permission";
    if (!role.editable) return "too-high";
    return undefined;
}

/**
 * Gives a member those of the roles they lack and Nexo can still give; Discord is asked only
 * then, so calling it often costs nothing.
 */
export async function giveRoles(member: GuildMember, ids: string[], reason: string): Promise<void> {
    const roles = ids
        .map((id) => member.guild.roles.cache.get(id))
        .filter(
            (role): role is Role => role?.editable === true && !member.roles.cache.has(role.id),
        );
    if (roles.length > 0) await member.roles.add(roles, reason);
}
