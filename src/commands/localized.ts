import type { SlashCommandSubcommandBuilder } from "discord.js";

/** Gives a subcommand its name and description in English and German. */
export function localized(
    builder: SlashCommandSubcommandBuilder,
    [name, germanName]: [string, string],
    [description, germanDescription]: [string, string],
): SlashCommandSubcommandBuilder {
    return builder
        .setName(name)
        .setNameLocalizations({ de: germanName })
        .setDescription(description)
        .setDescriptionLocalizations({ de: germanDescription });
}
