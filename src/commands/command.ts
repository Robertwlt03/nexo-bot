import type {
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

/** A slash command: what Discord shows, and what happens when someone uses it. */
export type Command = {
    data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
    run(interaction: ChatInputCommandInteraction): Promise<unknown>;
};
