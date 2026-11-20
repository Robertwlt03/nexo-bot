import { InteractionContextType, MessageFlags, roleMention, SlashCommandBuilder } from "discord.js";
import { card } from "../card.ts";
import { dateWithAge, firstWithRest } from "../format.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { chosenPerson, memberOption } from "./member-option.ts";

const ROLES_SHOWN = 15; // a card field holds 1024 characters; fifteen role mentions stay well below

export const userinfo: Command = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription(en.userinfoDescription)
        .setDescriptionLocalizations({ de: de.userinfoDescription })
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
        return interaction.reply({
            embeds: [
                card(member?.displayName ?? user.displayName)
                    .setThumbnail((member ?? user).displayAvatarURL({ size: 256 }))
                    .addFields(
                        { name: t.account, value: `${user.username}${user.bot ? " 🤖" : ""}` },
                        { name: t.created, value: dateWithAge(user.createdAt) },
                        {
                            name: t.joined,
                            value: member?.joinedAt ? dateWithAge(member.joinedAt) : t.notOnServer,
                        },
                        {
                            name: `${t.roles} (${roles.length})`,
                            value: roles.length > 0 ? firstWithRest(roles, ROLES_SHOWN) : "–",
                        },
                    ),
            ],
        });
    },
};
