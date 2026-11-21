import type {
    ButtonInteraction,
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { Settings } from "../settings.ts";

/** What every command may use besides the interaction: the servers' saved settings. */
export type Bot = { settings: Settings };

/**
 * A slash command: what Discord shows, what happens when someone uses it and, for commands whose
 * answers carry buttons, what a click does. A button's ID is "command:what", and `button` gets
 * the part after the colon.
 */
export type Command = {
    data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
    run(interaction: ChatInputCommandInteraction, bot: Bot): Promise<unknown>;
    button?(interaction: ButtonInteraction, bot: Bot, what: string): Promise<unknown>;
};
