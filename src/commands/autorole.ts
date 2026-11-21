import {
    type ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    type Role,
    roleMention,
    SlashCommandBuilder,
    type SlashCommandSubcommandBuilder,
} from "discord.js";
import { autoroleProblem } from "../autorole.ts";
import { card, PRIVATE_CARD } from "../card.ts";
import { icon } from "../icons.ts";
import { commandTexts, en, type Texts, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import { commandMention } from "./mention.ts";

/** The role option of /autorole add and remove. */
function withRole(subcommand: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder {
    return subcommand.addRoleOption((role) =>
        role
            .setName(commandTexts.roleOptionName)
            .setDescription(commandTexts.roleOptionDescription)
            .setRequired(true),
    );
}

/**
 * Why Nexo won't hand out a role for the asker, in their language, or undefined when it will: the
 * checks /autorole and /levelrole share.
 */
export function roleProblem(
    interaction: ChatInputCommandInteraction<"cached">,
    role: Role,
    t: Texts,
): string | undefined {
    const { guild, member: asker } = interaction;
    const mention = roleMention(role.id);
    switch (
        autoroleProblem(role, guild.id, {
            askerAboveRole:
                asker.id === guild.ownerId || asker.roles.highest.comparePositionTo(role) > 0,
            canManageRoles:
                guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles) ?? false,
        })
    ) {
        case "everyone":
            return t.autoroleEveryone;
        case "managed":
            return t.autoroleManaged(mention);
        case "above-you":
            return t.autoroleAboveYou(mention);
        case "no-permission":
            return t.autoroleNoPermission;
        case "too-high":
            return t.autoroleTooHigh(mention);
        default:
            return undefined;
    }
}

export const autorole: Command = {
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription(en.commandDescriptions.autorole)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand((add) =>
            withRole(
                add
                    .setName(commandTexts.addName)
                    .setDescription(commandTexts.autoroleAddDescription),
            ),
        )
        .addSubcommand((remove) =>
            withRole(
                remove
                    .setName(commandTexts.removeName)
                    .setDescription(commandTexts.autoroleRemoveDescription),
            ),
        )
        .addSubcommand((list) =>
            list
                .setName(commandTexts.listName)
                .setDescription(commandTexts.autoroleListDescription),
        ),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);
        const { guild, guildId } = interaction;

        switch (interaction.options.getSubcommand()) {
            case commandTexts.addName: {
                const role = interaction.options.getRole(commandTexts.roleOptionName, true);
                const mention = roleMention(role.id);
                const problem = roleProblem(interaction, role, t);
                if (problem) return answer(problem);
                return answer(
                    settings.addAutorole(guildId, role.id)
                        ? t.autoroleAdded(mention)
                        : t.autoroleAlready(mention),
                );
            }
            case commandTexts.removeName: {
                const role = interaction.options.getRole(commandTexts.roleOptionName, true);
                const mention = roleMention(role.id);
                return answer(
                    settings.removeAutorole(guildId, role.id)
                        ? t.autoroleRemoved(mention)
                        : t.autoroleNotThere(mention),
                );
            }
            case commandTexts.listName: {
                // A role deleted from the server can't be picked for remove; the list drops it.
                const ids = settings.autoroles(guildId).filter((id) => {
                    if (guild.roles.cache.has(id)) return true;
                    settings.removeAutorole(guildId, id);
                    return false;
                });
                if (ids.length === 0) {
                    return answer(t.autoroleNone(commandMention("autorole", commandTexts.addName)));
                }
                const list = ids.map(roleMention).join("\n");
                return interaction.reply({
                    components: [card(`${icon("autorole")}${t.autoroleListTitle}`, list)],
                    flags: PRIVATE_CARD,
                });
            }
            default:
                return answer(t.unknownCommand);
        }
    },
};
