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
    serverOnly: "This command only works on a server.",
    serverinfoDescription: "Shows this server: members, channels, boosts and its age",
    owner: "Owner",
    members: "Members",
    channels: "Channels",
    roles: "Roles",
    boosts: "Boosts",
    level: "Level",
    created: "Created",
    memberOptionName: "member",
    memberOptionDescription: "Who to show; leave it out for yourself",
    userinfoDescription: "Shows a member: account age, joining date and roles",
    account: "Account",
    joined: "Joined",
    notOnServer: "Not on this server (anymore)",
    avatarDescription: "Shows a member's profile picture in full size",
    avatarTitle: (name: string) => `Profile picture of ${name}`,
    fullSize: "Open in full size",
    accountPicture: "Account picture",
};

export type Texts = typeof en;

/** The texts for a Discord client's language: German for German clients, English for the rest. */
export function texts(locale: Locale): Texts {
    return locale.startsWith("de") ? de : en;
}
