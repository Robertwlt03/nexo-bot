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
    greetingSetupName: "setup",
    greetingTestName: "test",
    greetingOffName: "off",
    greetingChannelName: "channel",
    greetingMessageName: "message",
    greetingMessageDescription: "Placeholders: {user} {username} {server} {membercount}",
    greetingPingName: "ping",
    greetingPingDescription: "Mention the new member above the card, so they get a notification",
    greetingTryIt: (test: string) => `Try it with \`${test}\`.`,
    greetingTestSent: (channel: string) => `Sent to ${channel}.`,
    greetingNotSetUp: (setup: string) => `This is not set up yet: use \`${setup}\`.`,
    greetingChannelGone: (setup: string) =>
        `Its channel is gone. Choose a new one with \`${setup}\`.`,
    greetingCannotPost: (channel: string, missing: string) =>
        `Nexo can't post in ${channel} yet. Give it these permissions there: ${missing}.`,
    permissionNames: {
        ViewChannel: "View Channel",
        SendMessages: "Send Messages",
        EmbedLinks: "Embed Links",
    },
    welcome: {
        description: "Greets new members in a channel",
        setupDescription: "Sets the channel and the message for new members",
        channelDescription: "Where Nexo greets new members",
        testDescription: "Sends the welcome for you, to try it",
        offDescription: "Turns the welcome off",
        defaultMessage: "Welcome to **{server}**, {user}! You are member number {membercount}.",
        saved: (channel: string) => `New members are now greeted in ${channel}.`,
        off: "The welcome is off.",
    },
    goodbye: {
        description: "Says goodbye in a channel when someone leaves",
        setupDescription: "Sets the channel and the message for members who leave",
        channelDescription: "Where Nexo says goodbye",
        testDescription: "Sends the goodbye for you, to try it",
        offDescription: "Turns the goodbye off",
        defaultMessage: "**{username}** has left the server. We are {membercount} members now.",
        saved: (channel: string) => `Members who leave now get a goodbye in ${channel}.`,
        off: "The goodbye is off.",
    },
    autoroleDescription: "Gives new members roles automatically",
    autoroleAddName: "add",
    autoroleAddDescription: "Adds a role that new members get",
    autoroleRemoveName: "remove",
    autoroleRemoveDescription: "Takes a role out of the automatic ones",
    autoroleListName: "list",
    autoroleListDescription: "Shows the roles new members get",
    roleOptionName: "role",
    roleOptionDescription: "The role",
    autoroleAdded: (role: string) => `New members now get ${role}.`,
    autoroleAlready: (role: string) => `New members get ${role} already.`,
    autoroleRemoved: (role: string) => `New members no longer get ${role}.`,
    autoroleNotThere: (role: string) => `${role} is not one of the automatic roles.`,
    autoroleNone: "New members get no roles yet. Add one with `/autorole add`.",
    autoroleListTitle: "Roles for new members",
    autoroleEveryone: "Every member has @everyone already.",
    autoroleManaged: (role: string) =>
        `${role} belongs to an integration, such as a bot or server boosts; Discord gives it ` +
        `itself.`,
    autoroleNoPermission:
        "Nexo needs the permission Manage Roles for this: give it to Nexo's role in the server " +
        "settings.",
    autoroleTooHigh: (role: string) =>
        `${role} is above Nexo's highest role. In the server settings under Roles, drag Nexo's ` +
        `role above it.`,
};

export type Texts = typeof en;

/** The texts for a Discord client's language: German for German clients, English for the rest. */
export function texts(locale: Locale): Texts {
    return locale.startsWith("de") ? de : en;
}
