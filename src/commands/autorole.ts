import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    roleMention,
    SlashCommandBuilder,
    type SlashCommandSubcommandBuilder,
} from "discord.js";
import { autoroleProblem } from "../autorole.ts";
import { card, PRIVATE_CARD } from "../card.ts";
import { icon } from "../icons.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { localized } from "./localized.ts";
import { commandMention } from "./mention.ts";

/** The role option of /autorole add and remove. */
function withRole(subcommand: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder {
    return subcommand.addRoleOption((role) =>
        role
            .setName(en.roleOptionName)
            .setNameLocalizations({ de: de.roleOptionName })
            .setDescription(en.roleOptionDescription)
            .setDescriptionLocalizations({ de: de.roleOptionDescription })
            .setRequired(true),
    );
}

export const autorole: Command = {
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription(en.autoroleDescription)
        .setDescriptionLocalizations({ de: de.autoroleDescription })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand((add) =>
            withRole(
                localized(
                    add,
                    [en.autoroleAddName, de.autoroleAddName],
                    [en.autoroleAddDescription, de.autoroleAddDescription],
                ),
            ),
        )
        .addSubcommand((remove) =>
            withRole(
                localized(
                    remove,
                    [en.autoroleRemoveName, de.autoroleRemoveName],
                    [en.autoroleRemoveDescription, de.autoroleRemoveDescription],
                ),
            ),
        )
        .addSubcommand((list) =>
            localized(
                list,
                [en.autoroleListName, de.autoroleListName],
                [en.autoroleListDescription, de.autoroleListDescription],
            ),
        ),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);
        const { guild, guildId } = interaction;

        switch (interaction.options.getSubcommand()) {
            case en.autoroleAddName: {
                const role = interaction.options.getRole(en.roleOptionName, true);
                const mention = roleMention(role.id);
                const asker = interaction.member;
                switch (
                    autoroleProblem(role, guildId, {
                        askerAboveRole:
                            asker.id === guild.ownerId ||
                            asker.roles.highest.comparePositionTo(role) > 0,
                        canManageRoles:
                            guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles) ??
                            false,
                    })
                ) {
                    case "everyone":
                        return answer(t.autoroleEveryone);
                    case "managed":
                        return answer(t.autoroleManaged(mention));
                    case "above-you":
                        return answer(t.autoroleAboveYou(mention));
                    case "no-permission":
                        return answer(t.autoroleNoPermission);
                    case "too-high":
                        return answer(t.autoroleTooHigh(mention));
                }
                return answer(
                    settings.addAutorole(guildId, role.id)
                        ? t.autoroleAdded(mention)
                        : t.autoroleAlready(mention),
                );
            }
            case en.autoroleRemoveName: {
                const role = interaction.options.getRole(en.roleOptionName, true);
                const mention = roleMention(role.id);
                return answer(
                    settings.removeAutorole(guildId, role.id)
                        ? t.autoroleRemoved(mention)
                        : t.autoroleNotThere(mention),
                );
            }
            case en.autoroleListName: {
                // A role deleted from the server can't be picked for remove; the list drops it.
                const ids = settings.autoroles(guildId).filter((id) => {
                    if (guild.roles.cache.has(id)) return true;
                    settings.removeAutorole(guildId, id);
                    return false;
                });
                if (ids.length === 0) {
                    return answer(t.autoroleNone(commandMention("autorole", en.autoroleAddName)));
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
