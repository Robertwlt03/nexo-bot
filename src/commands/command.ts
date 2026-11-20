import type {
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { Settings } from "../settings.ts";

/** What every command may use besides the interaction: the servers' saved settings. */
export type Bot = { settings: Settings };

/** A slash command: what Discord shows, and what happens when someone uses it. */
export type Command = {
    data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
    run(interaction: ChatInputCommandInteraction, bot: Bot): Promise<unknown>;
};
