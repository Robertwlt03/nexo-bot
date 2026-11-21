import type { Locale } from "discord.js";
import { de } from "./translations/de.ts";

/** Every text Nexo shows, in English; `translations/` holds the other languages. */
export const en = {
    error: "Something went wrong. Please try again in a moment.",
    unknownCommand: "Nexo doesn't have this command (anymore).",
    /** What each command does, as /help shows it. */
    commandDescriptions: {
        ping: "Shows how fast Nexo answers",
        info: "Shows what Nexo is and how it is doing",
        help: "Lists everything Nexo can do",
        serverinfo: "Shows this server: members, channels, boosts and its age",
        userinfo: "Shows a member: account age, joining date and roles",
        avatar: "Shows a member's profile picture in full size",
        welcome: "Greets new members in a channel",
        goodbye: "Says goodbye in a channel when someone leaves",
        autorole: "Gives new members roles automatically",
        warn: "Warns a member; Nexo keeps the warning",
        warnings: "Shows a member's warnings",
        unwarn: "Removes a warning",
        timeout: "Mutes a member for a while",
        untimeout: "Ends a member's timeout early",
        kick: "Removes a member from the server; they can join again",
        ban: "Bans someone from the server",
        unban: "Lifts a ban",
        modlog: "Logs in a channel what moderators do, through Nexo or Discord",
        rank: "Shows a member's level and XP",
        leaderboard: "Shows who has the most XP",
        ticket: "Lets members open a private ticket with the team",
    },
    roundTrip: "Round trip",
    tagline: "One bot. Every feature.",
    onlineSince: "Online since",
    runsOn: "Runs on",
    helpTitle: "What Nexo can do",
    helpHint: "Click a command to use it.",
    helpSections: {
        general: "General",
        members: "Members and levels",
        setup: "Server setup",
        moderation: "Moderation",
    },
    serverOnly: "This command only works on a server.",
    owner: "Owner",
    members: "Members",
    channels: "Channels",
    roles: "Roles",
    boosts: "Boosts",
    level: "Level",
    created: "Created",
    account: "Account",
    joined: "Joined",
    notOnServer: "Not on this server (anymore)",
    avatarTitle: (name: string) => `Profile picture of ${name}`,
    accountPicture: "Account picture",
    testButton: "Send a test",
    greetingTestSent: (channel: string) => `Sent to ${channel}.`,
    greetingNotSetUp: (setup: string) => `This is not set up yet: use ${setup}.`,
    channelGone: (setup: string) => `Its channel is gone. Choose a new one with ${setup}.`,
    cannotPost: (channel: string, missing: string) =>
        `Nexo can't post in ${channel} yet. Give it these permissions there: ${missing}.`,
    permissionNames: {
        ViewChannel: "View Channel",
        SendMessages: "Send Messages",
        EmbedLinks: "Embed Links",
        CreatePrivateThreads: "Create Private Threads",
        SendMessagesInThreads: "Send Messages in Threads",
        ManageThreads: "Manage Threads and Posts",
        MentionEveryone: "Mention @everyone, @here, and All Roles",
    },
    welcome: {
        defaultMessage: "Welcome, {user}! Glad you're here.",
        saved: (channel: string) => `New members are now greeted in ${channel}.`,
        off: "The welcome is off.",
    },
    goodbye: {
        defaultMessage: "See you! We are {membercount} members now.",
        saved: (channel: string) => `Members who leave now get a goodbye in ${channel}.`,
        off: "The goodbye is off.",
    },
    autoroleAdded: (role: string) => `New members now get ${role}.`,
    autoroleAlready: (role: string) => `New members get ${role} already.`,
    autoroleRemoved: (role: string) => `New members no longer get ${role}.`,
    autoroleNotThere: (role: string) => `${role} is not one of the automatic roles.`,
    autoroleNone: (add: string) => `New members get no roles yet. Add one with ${add}.`,
    autoroleListTitle: "Roles for new members",
    autoroleEveryone: "Every member has @everyone already.",
    autoroleManaged: (role: string) =>
        `${role} belongs to an integration, such as a bot or server boosts; Discord gives it ` +
        `itself.`,
    autoroleNoPermission:
        "Nexo needs the permission Manage Roles for this: give it to Nexo's role in the server " +
        "settings.",
    autoroleAboveYou: (role: string) =>
        `${role} is not below your highest role, so you can't hand it out.`,
    autoroleTooHigh: (role: string) =>
        `${role} is above Nexo's highest role. In the server settings under Roles, drag Nexo's ` +
        `role above it.`,
    warned: (member: string, count: number) => `${member} is warned. Warnings so far: ${count}.`,
    warningsNone: (member: string) => `${member} has no warnings.`,
    warningsNoneLeft: "No warnings left.",
    warningsTitle: (name: string) => `Warnings of ${name}`,
    warningBy: "by",
    removeButton: "Remove",
    unwarned: (id: number) => `Warning #${id} is removed.`,
    unwarnNotFound: (id: number) => `This server has no warning #${id}.`,
    timedOut: (member: string, until: string) => `${member} is muted until ${until}.`,
    untimedOut: (member: string) => `${member} can write again.`,
    notTimedOut: (member: string) => `${member} is not muted.`,
    kicked: (member: string) => `${member} is removed from the server.`,
    banned: (user: string) => `${user} is banned.`,
    unbanned: (user: string) => `The ban on ${user} is lifted.`,
    notBanned: (user: string) => `${user} is not banned.`,
    notMember: (user: string) => `${user} is not on this server.`,
    problemSelf: "You can't do this to yourself.",
    problemNexo: "Nexo won't do this to itself.",
    problemOwner: "Nobody can do this to the server's owner.",
    problemAboveYou: (member: string) => `${member}'s highest role is not below yours.`,
    problemAdmin: (member: string) =>
        `${member} is an administrator, and Discord can't mute those.`,
    problemNoPermission: (permission: string) =>
        `Nexo needs the permission ${permission} for this.`,
    problemAboveNexo: (member: string) =>
        `${member}'s highest role is not below Nexo's. In the server settings under Roles, ` +
        "drag Nexo's role above it.",
    moderationPermissionNames: {
        timeout: "Timeout Members",
        kick: "Kick, Approve, and Reject Members",
        ban: "Ban Members",
    },
    modlogSaved: (channel: string) => `Moderation on this server is now logged in ${channel}.`,
    modlogNoAuditLog:
        "Kicks, bans and timeouts made in Discord itself appear there once Nexo may View Audit " +
        "Log; until then, only Nexo's commands do.",
    modlogOff: "The mod log is off.",
    modlogPublic: "Note: every member can read that channel, reasons included.",
    modlogPrefix: "Mod log:",
    modlogTitles: {
        warn: "Warning",
        unwarn: "Warning removed",
        timeout: "Timeout",
        untimeout: "Timeout ended",
        kick: "Kick",
        ban: "Ban",
        unban: "Ban lifted",
    },
    modlogMember: "Member",
    modlogModerator: "Moderator",
    modlogUntil: "Until",
    modlogWarning: "Warning",
    modlogReason: "Reason",
    levelName: "Level",
    leaderboardTitle: "Leaderboard",
    leaderboardEmpty: "Nobody has XP yet. Members earn it by writing messages.",
    leaderboardYou: (place: number) => `You: rank ${place}`,
    ticketPanelTitle: "Support",
    ticketPanelText:
        "Need help from the team? Open a ticket: a private thread only you and the team see.",
    ticketOpenButton: "Open a ticket",
    ticketCannotRun: (channel: string, missing: string) =>
        `Nexo can't run tickets in ${channel} yet. Give it these permissions there: ${missing}.`,
    ticketSetUp: (channel: string) =>
        `The ticket button is in ${channel}. To stop tickets, delete the card with the button.`,
    ticketTeamNotMentionable: (role: string) =>
        `Nexo mentions the team in every ticket, and you may not mention ${role}. Make the role ` +
        "mentionable, or ask someone who may mention every role.",
    ticketTitle: "Ticket",
    ticketHello: "Tell us what it's about; the team answers here.",
    ticketTeam: "Team",
    ticketCloseButton: "Close ticket",
    ticketClosedBy: (member: string) => `Closed by ${member}.`,
    ticketOpened: (thread: string) => `Your ticket: ${thread}`,
    ticketAlreadyOpen: (thread: string) => `You already have a ticket open: ${thread}`,
};

/**
 * What Discord's command picker shows: command, subcommand and option names, their
 * descriptions and choices. Always English, so every member sees the same commands; what
 * Nexo answers is in each member's language (`en` and `translations/`).
 */
export const commandTexts = {
    memberOptionName: "member",
    memberOptionDescription: "Who to show; leave it out for yourself",
    setupName: "setup",
    greetingTestName: "test",
    offName: "off",
    channelName: "channel",
    greetingMessageName: "message",
    greetingMessageDescription: "Placeholders: {user} {username} {server} {membercount}",
    greetingPingName: "ping",
    greetingPingDescription: "Notify the new member, whom {user} mentions in the message",
    autoroleAddName: "add",
    autoroleAddDescription: "Adds a role that new members get",
    autoroleRemoveName: "remove",
    autoroleRemoveDescription: "Takes a role out of the automatic ones",
    autoroleListName: "list",
    autoroleListDescription: "Shows the roles new members get",
    roleOptionName: "role",
    roleOptionDescription: "The role",
    moderationMemberName: "member",
    moderationMemberDescription: "The member",
    reasonName: "reason",
    reasonDescription: "Why; it also goes into the server's audit log",
    durationName: "duration",
    durationDescription: "How long",
    durations: [
        { name: "5 minutes", minutes: 5 },
        { name: "10 minutes", minutes: 10 },
        { name: "30 minutes", minutes: 30 },
        { name: "1 hour", minutes: 60 },
        { name: "6 hours", minutes: 360 },
        { name: "1 day", minutes: 1440 },
        { name: "1 week", minutes: 10080 },
    ],
    numberName: "number",
    numberDescription: "The number /warnings shows",
    userName: "user",
    unbanUserDescription: "The banned user; paste the ID if they don't show up",
    modlogSetupDescription: "Sets the channel for the mod log",
    modlogChannelDescription: "Where Nexo logs warnings, timeouts, kicks and bans",
    modlogOffDescription: "Turns the mod log off",
    ticketSetupDescription: "Posts the button members open a ticket with",
    ticketChannelDescription: "Where the button goes; each ticket is a private thread there",
    ticketTeamName: "team",
    ticketTeamDescription: "Who answers tickets; without it, those who may manage threads",
    ticketMessageDescription: "The text above the button; leave it out for the default",
    welcome: {
        setupDescription: "Sets the channel and the message for new members",
        channelDescription: "Where Nexo greets new members",
        testDescription: "Sends the welcome for you, to try it",
        offDescription: "Turns the welcome off",
    },
    goodbye: {
        setupDescription: "Sets the channel and the message for members who leave",
        channelDescription: "Where Nexo says goodbye",
        testDescription: "Sends the goodbye for you, to try it",
        offDescription: "Turns the goodbye off",
    },
};

export type Texts = typeof en;

/** The texts for a Discord client's language: German for German clients, English for the rest. */
export function texts(locale: Locale): Texts {
    return locale.startsWith("de") ? de : en;
}
