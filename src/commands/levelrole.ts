import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    roleMention,
    SlashCommandBuilder,
} from "discord.js";
import { card, PRIVATE_CARD } from "../card.ts";
import { icon } from "../icons.ts";
import { commandTexts, en, texts } from "../texts.ts";
import { roleProblem } from "./autorole.ts";
import type { Command } from "./command.ts";
import { commandMention } from "./mention.ts";

/** /levelrole: roles members get from a level on, checked like /autorole's. */
export const levelrole: Command = {
    data: new SlashCommandBuilder()
        .setName("levelrole")
        .setDescription(en.commandDescriptions.levelrole)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand((add) =>
            add
                .setName(commandTexts.addName)
                .setDescription(commandTexts.levelroleAddDescription)
                .addIntegerOption((level) =>
                    level
                        .setName(commandTexts.levelOptionName)
                        .setDescription(commandTexts.levelOptionDescription)
                        .setMinValue(1)
                        .setMaxValue(200)
                        .setRequired(true),
                )
                .addRoleOption((role) =>
                    role
                        .setName(commandTexts.roleOptionName)
                        .setDescription(commandTexts.levelroleRoleDescription)
                        .setRequired(true),
                ),
        )
        .addSubcommand((remove) =>
            remove
                .setName(commandTexts.removeName)
                .setDescription(commandTexts.levelroleRemoveDescription)
                .addRoleOption((role) =>
                    role
                        .setName(commandTexts.roleOptionName)
                        .setDescription(commandTexts.levelroleRoleDescription)
                        .setRequired(true),
                ),
        )
        .addSubcommand((list) =>
            list
                .setName(commandTexts.listName)
                .setDescription(commandTexts.levelroleListDescription),
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
                const problem = roleProblem(interaction, role, t);
                if (problem) return answer(problem);
                const level = interaction.options.getInteger(commandTexts.levelOptionName, true);
                settings.saveLevelRole(guildId, role.id, level);
                return answer(t.levelroleAdded(roleMention(role.id), level));
            }
            case commandTexts.removeName: {
                const role = interaction.options.getRole(commandTexts.roleOptionName, true);
                const mention = roleMention(role.id);
                return answer(
                    settings.removeLevelRole(guildId, role.id)
                        ? t.levelroleRemoved(mention)
                        : t.levelroleNotThere(mention),
                );
            }
            default: {
                // A role deleted from the server can't be picked for remove; the list drops it.
                const rewards = settings.levelRoles(guildId).filter(({ roleId }) => {
                    if (guild.roles.cache.has(roleId)) return true;
                    settings.removeLevelRole(guildId, roleId);
                    return false;
                });
                if (rewards.length === 0) {
                    const add = commandMention("levelrole", commandTexts.addName);
                    return answer(t.levelroleNone(add));
                }
                const list = rewards
                    .map(
                        ({ roleId, level }) =>
                            `**${t.levelName} ${level}** · ${roleMention(roleId)}`,
                    )
                    .join("\n");
                return interaction.reply({
                    components: [card(`${icon("autorole")}${t.levelroleListTitle}`, list)],
                    flags: PRIVATE_CARD,
                });
            }
        }
    },
};
