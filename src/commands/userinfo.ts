import {
    InteractionContextType,
    MessageFlags,
    roleMention,
    SlashCommandBuilder,
    subtext,
} from "discord.js";
import { CARD, card, facts } from "../card.ts";
import { dateWithAge, firstWithRest } from "../format.ts";
import { en, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import { chosenPerson, memberOption } from "./member-option.ts";

const ROLES_SHOWN = 15; // a card holds 4000 characters; fifteen role mentions stay well below

export const userinfo: Command = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription(en.commandDescriptions.userinfo)
        .setContexts(InteractionContextType.Guild)
        .addUserOption(memberOption),

    run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const { user, member } = chosenPerson(interaction);
        // @everyone, which every member has, shares the server's ID.
        const roles = member
            ? member.roles.cache
                  .filter((role) => role.id !== interaction.guild.id)
                  .sort((a, b) => b.position - a.position)
                  .map((role) => roleMention(role.id))
            : [];
        const name = member?.displayName ?? user.displayName;
        const text = [
            // The handle under the name, unless the name only capitalizes it.
            ...(name.toLowerCase() === user.username ? [] : [subtext(`@${user.username}`)]),
            facts([
                [t.created, dateWithAge(user.createdAt)],
                [t.joined, member?.joinedAt ? dateWithAge(member.joinedAt) : t.notOnServer],
                [
                    `${t.roles} (${roles.length})`,
                    roles.length > 0 ? firstWithRest(roles, ROLES_SHOWN) : undefined,
                ],
            ]),
        ].join("\n");
        const picture = (member ?? user).displayAvatarURL({ size: 256 });
        const title = user.bot ? `${name} 🤖` : name;
        return interaction.reply({ components: [card(title, text, { picture })], flags: CARD });
    },
};
