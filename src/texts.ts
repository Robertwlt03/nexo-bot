import type { Locale } from "discord.js";
import { de } from "./translations/de.ts";

/** Every text Nexo shows, in English; `translations/` holds the other languages. */
export const en = {
    error: "Something went wrong. Please try again in a moment.",
    unknownCommand: "Nexo doesn't have this command (anymore).",
    pingDescription: "Shows how fast Nexo answers",
    roundTrip: "Round trip",
    infoDescription: "Shows what Nexo is and how it is doing",
    tagline: "One bot. Every feature.",
    onlineSince: "Online since",
    runsOn: "Runs on",
    helpDescription: "Lists everything Nexo can do",
    helpTitle: "What Nexo can do",
};

export type Texts = typeof en;

/** The texts for a Discord client's language: German for German clients, English for the rest. */
export function texts(locale: Locale): Texts {
    return locale.startsWith("de") ? de : en;
}
