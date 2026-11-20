import type { GuildMember, Role } from "discord.js";
import type { Settings } from "./settings.ts";

/** Why Nexo cannot give a role to new members, or nothing when it can. */
export type AutoroleProblem = "everyone" | "managed" | "no-permission" | "too-high";

/**
 * Checks a role the way Discord will when Nexo gives it: @everyone and the roles of integrations
 * (bots, server boosts) cannot be given, and Nexo needs Manage Roles and a higher role of its own.
 */
export function autoroleProblem(
    role: Pick<Role, "id" | "managed" | "editable">,
    guildId: string,
    canManageRoles: boolean,
): AutoroleProblem | undefined {
    if (role.id === guildId) return "everyone"; // @everyone shares the server's ID
    if (role.managed) return "managed";
    if (!canManageRoles) return "no-permission";
    if (!role.editable) return "too-high";
    return undefined;
}

/** Gives a new member the server's automatic roles that Nexo can still give. */
export async function giveAutoroles(member: GuildMember, settings: Settings): Promise<void> {
    const roles = settings
        .autoroles(member.guild.id)
        .map((id) => member.guild.roles.cache.get(id))
        .filter((role): role is Role => role?.editable === true);
    if (roles.length > 0) await member.roles.add(roles, "Nexo: automatic role for new members");
}
