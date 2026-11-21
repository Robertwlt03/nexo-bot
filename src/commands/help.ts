import { ApplicationCommandOptionType, SlashCommandBuilder, subtext } from "discord.js";
import { CARD, card } from "../card.ts";
import { icon } from "../icons.ts";
import { en, type Texts, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { commandMention } from "./mention.ts";

/** Which commands /help shows under which heading; a new command needs a place here. */
const SECTIONS: Record<keyof Texts["helpSections"], readonly string[]> = {
    general: ["help", "ping", "info"],
    members: ["serverinfo", "userinfo", "avatar", "rank", "leaderboard"],
    setup: ["welcome", "goodbye", "autorole", "modlog", "ticket"],
    moderation: ["warn", "warnings", "unwarn", "timeout", "untimeout", "kick", "ban", "unban"],
};

/**
 * Lists the given commands, read when someone asks, so it always matches what the bot has. Each
 * one can be clicked, which puts it into the message box.
 */
export function help(commands: readonly Command[]): Command {
    return {
        data: new SlashCommandBuilder()
            .setName("help")
            .setDescription(en.helpDescription)
            .setDescriptionLocalizations({ de: de.helpDescription }),

        run(interaction) {
            const t = texts(interaction.locale);
            const line = ({ data }: Command) => {
                const { name, description, description_localizations, options } = data.toJSON();
                // Discord keys a command's translations by language, like interaction.locale.
                const shown = description_localizations?.[interaction.locale] ?? description;
                // Discord makes only a whole command clickable, so one with subcommands is
                // listed as each of them.
                const subcommands = (options ?? []).filter(
                    (option) => option.type === ApplicationCommandOptionType.Subcommand,
                );
                const mentions = subcommands.length
                    ? subcommands.map((subcommand) => commandMention(name, subcommand.name))
                    : [commandMention(name)];
                return `${mentions.join(" ")} ${shown}`;
            };
            // ponytail: one card holds 4000 characters, about 40 commands at today's length;
            // split it into several cards beyond that.
            const shown = card(t.helpTitle, subtext(t.helpHint));
            for (const [section, names] of Object.entries(SECTIONS)) {
                const lines = commands.filter(({ data }) => names.includes(data.name)).map(line);
                const name = section as keyof typeof SECTIONS;
                const heading = `${icon(name)}${t.helpSections[name]}`;
                shown
                    .addSeparatorComponents((divider) => divider)
                    .addTextDisplayComponents((text) =>
                        text.setContent(`### ${heading}\n${lines.join("\n")}`),
                    );
            }
            return interaction.reply({ components: [shown], flags: CARD });
        },
    };
}
