import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { card } from "../card.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { chosenPerson, memberOption } from "./member-option.ts";

const SIZE = 1024;

export const avatar: Command = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription(en.avatarDescription)
        .setDescriptionLocalizations({ de: de.avatarDescription })
        .setContexts(InteractionContextType.Guild)
        .addUserOption(memberOption),

    run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const { user, member } = chosenPerson(interaction);
        // A member can have a picture just for this server: that one is shown,
        // and the account's own picture is linked beside it.
        const shown = (member ?? user).displayAvatarURL({ size: SIZE });
        const account = user.displayAvatarURL({ size: SIZE });
        const links = [`[${t.fullSize}](${shown})`];
        if (account !== shown) links.push(`[${t.accountPicture}](${account})`);
        return interaction.reply({
            embeds: [
                card(t.avatarTitle(member?.displayName ?? user.displayName))
                    .setDescription(links.join(" · "))
                    .setImage(shown),
            ],
        });
    },
};
