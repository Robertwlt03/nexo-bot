import { chatInputApplicationCommandMention, inlineCode } from "discord.js";

const ids = new Map<string, string>();

/** Keeps the IDs Discord gave the commands when they were registered. */
export function rememberCommandIds(registered: Iterable<{ name: string; id: string }>): void {
    for (const { name, id } of registered) ids.set(name, id);
}

/**
 * A command as members can click it, which puts it into their message box; before Discord has
 * given the IDs, it is shown as plain code.
 */
export function commandMention(name: string, subcommand?: string): string {
    const id = ids.get(name);
    if (!id) return inlineCode(subcommand ? `/${name} ${subcommand}` : `/${name}`);
    return subcommand
        ? chatInputApplicationCommandMention(name, subcommand, id)
        : chatInputApplicationCommandMention(name, id);
}
