import { ApplicationCommandOptionType, SlashCommandBuilder, subtext } from "discord.js";
import { card, PRIVATE_CARD } from "../card.ts";
import { icon } from "../icons.ts";
import { en, type Texts, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import { commandMention } from "./mention.ts";

/** Which commands /help shows under which heading; a new command needs a place here. */
const SECTIONS: Record<keyof Texts["helpSections"], readonly string[]> = {
    general: ["help", "info"],
    members: ["serverinfo", "userinfo", "avatar", "rank", "leaderboard"],
    setup: ["welcome", "goodbye", "autorole", "levels", "levelrole", "modlog", "ticket"],
    moderation: ["warn", "warnings", "timeout", "untimeout", "kick", "ban", "unban"],
};

/**
 * Lists the given commands the asker may use, read when someone asks, so it always matches what
 * the bot has. Each one can be clicked, which puts it into the message box.
 */
export function help(commands: readonly Command[]): Command {
    return {
        data: new SlashCommandBuilder().setName("help").setDescription(en.commandDescriptions.help),

        run(interaction) {
            const t = texts(interaction.locale);
            const line = ({ data }: Command) => {
                const { name, options } = data.toJSON();
                // Discord shows commands in English; /help says what they do in the asker's
                // language.
                const said = t.commandDescriptions[name as keyof Texts["commandDescriptions"]];
                // Discord makes only a whole command clickable, so one with subcommands is
                // listed as each of them.
                const subcommands = (options ?? []).filter(
                    (option) => option.type === ApplicationCommandOptionType.Subcommand,
                );
                const mentions = subcommands.length
                    ? subcommands.map((subcommand) => commandMention(name, subcommand.name))
                    : [commandMention(name)];
                return `${mentions.join(" ")} ${said}`;
            };
            // ponytail: one card holds 4000 characters, about 40 commands at today's length;
            // split it into several cards beyond that.
            const shown = card(t.helpTitle, subtext(t.helpHint));
            // ponytail: reads each command's default permissions, not the overrides an admin can
            // set under Server Settings > Integrations; fetch those if a server needs it.
            const allowed = ({ data }: Command) => {
                const needed = data.toJSON().default_member_permissions;
                return !needed || (interaction.memberPermissions?.has(BigInt(needed)) ?? false);
            };
            for (const [section, names] of Object.entries(SECTIONS)) {
                const lines = commands
                    .filter(({ data }) => names.includes(data.name))
                    .filter(allowed)
                    .map(line);
                if (lines.length === 0) continue;
                const name = section as keyof typeof SECTIONS;
                const heading = `${icon(name)}${t.helpSections[name]}`;
                shown
                    .addSeparatorComponents((divider) => divider)
                    .addTextDisplayComponents((text) =>
                        text.setContent(`### ${heading}\n${lines.join("\n")}`),
                    );
            }
            // Only for the asker: it lists what they may use, and it is long.
            return interaction.reply({ components: [shown], flags: PRIVATE_CARD });
        },
    };
}
