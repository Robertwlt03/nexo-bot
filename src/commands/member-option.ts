import type {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandUserOption,
    User,
} from "discord.js";
import { en } from "../texts.ts";
import { de } from "../translations/de.ts";

const NAME = "member";

/** The optional "member" option of /userinfo and /avatar; left out, it means whoever asks. */
export function memberOption(option: SlashCommandUserOption): SlashCommandUserOption {
    return option
        .setName(NAME)
        .setNameLocalizations({ de: de.memberOptionName })
        .setDescription(en.memberOptionDescription)
        .setDescriptionLocalizations({ de: de.memberOptionDescription });
}

/** The chosen person; `member` is null when they are not on this server (anymore). */
export function chosenPerson(interaction: ChatInputCommandInteraction<"cached">): {
    user: User;
    member: GuildMember | null;
} {
    const user = interaction.options.getUser(NAME);
    if (!user) return { user: interaction.user, member: interaction.member };
    return { user, member: interaction.options.getMember(NAME) };
}
