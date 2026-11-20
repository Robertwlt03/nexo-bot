import { EmbedBuilder } from "discord.js";

/** Nexo's amber, the color of every answer card. */
export const NEXO_AMBER = 0xe8a33d;

export function card(title: string): EmbedBuilder {
    return new EmbedBuilder().setColor(NEXO_AMBER).setTitle(title);
}
