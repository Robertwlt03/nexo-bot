import { SlashCommandBuilder } from "discord.js";
import { card } from "../card.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";

/** Lists the given commands, read when someone asks, so it always matches what the bot has. */
export function help(commands: readonly Command[]): Command {
    return {
        data: new SlashCommandBuilder()
            .setName("help")
            .setDescription(en.helpDescription)
            .setDescriptionLocalizations({ de: de.helpDescription }),

        run(interaction) {
            const lines = commands.map(({ data }) => {
                const { name, description, description_localizations } = data.toJSON();
                // Discord keys a command's translations by language, like interaction.locale.
                const shown = description_localizations?.[interaction.locale] ?? description;
                return `\`/${name}\` ${shown}`;
            });
            return interaction.reply({
                embeds: [
                    card(texts(interaction.locale).helpTitle).setDescription(lines.join("\n")),
                ],
            });
        },
    };
}
