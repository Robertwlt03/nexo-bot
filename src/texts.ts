import type { Locale } from "discord.js";
import { de } from "./translations/de.ts";

/** Every text Nexo shows, in English; `translations/` holds the other languages. */
export const en = {
    error: "Something went wrong. Please try again in a moment.",
    unknownCommand: "Nexo doesn't have this command (anymore).",
    /** What each command does, as /help shows it. */
    commandDescriptions: {
        info: "Shows what Nexo is and how it is doing",
        help: "Lists the commands you can use",
        serverinfo: "Shows this server: members, channels, boosts and its age",
        userinfo: "Shows a member: account age, joining date and roles",
        avatar: "Shows a member's profile picture in full size",
        welcome: "Greets new members in a channel",
        goodbye: "Says goodbye in a channel when someone leaves",
        autorole: "Gives new members roles automatically",
        warn: "Warns a member by direct message; Nexo keeps the warning",
        warnings: "Shows a member's warnings",
        timeout: "Times a member out for a while",
        untimeout: "Ends a member's timeout early",
        kick: "Removes a member from the server; they can join again",
        ban: "Bans someone from the server",
        unban: "Lifts a ban",
        modlog: "Logs in a channel what moderators do, through Nexo or Discord",
        rank: "Shows a member's level and XP",
        leaderboard: "Shows who has the most XP",
        ticket: "Lets members open a private ticket with the team",
        levels: "Sets where level-ups appear, or turns them off",
        levelrole: "Gives members roles when they reach a level",
    },
    connection: "Connection to Discord",
    tagline: "The quiet community bot.",
    infoAddButton: "Add to server",
    onlineSince: "Online since",
    helpTitle: "What you can do with Nexo",
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
    boostTier: "Level",
    created: "Created",
    account: "Account",
    joined: "Joined",
    notOnServer: "Not on this server (anymore)",
    avatarTitle: (name: string) => `Profile picture of ${name}`,
    accountPicture: "Account picture",
    testButton: "Send a test",
    greetingTestSent: (channel: string) => `Sent to ${channel}.`,
    greetingNotSetUp: (setup: string) => `This is not set up yet. Set it up with ${setup}.`,
    channelGone: (setup: string) => `Its channel is gone. Choose a new one with ${setup}.`,
    cannotPost: (channel: string, missing: string) =>
        `Nexo can't post in ${channel} yet. Give it these permissions there: ${missing}.`,
    permissionNames: {
        AttachFiles: "Attach Files",
        ViewChannel: "View Channel",
        SendMessages: "Send Messages",
        EmbedLinks: "Embed Links",
        CreatePrivateThreads: "Create Private Threads",
        SendMessagesInThreads: "Send Messages in Threads",
        ManageThreads: "Manage Threads and Posts",
        ReadMessageHistory: "Read Message History",
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
    unwarnNotFound: (id: number) => `This server has no warning #${id}.`,
    timedOut: (member: string, until: string) => `${member} is timed out until ${until}.`,
    untimedOut: (member: string) => `${member} can write again.`,
    notTimedOut: (member: string) => `${member} is not timed out.`,
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
        `${member} is an administrator, and Discord can't time out administrators.`,
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
    modlogPublic: "Careful: every member can read that channel, reasons included.",
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
    leaderboardYou: (place: number, level: number, xp: number) =>
        `Your place: **${place}** · Level ${level} · ${xp} XP`,
    leaderboardNoXp: "You have no XP yet. You earn it by writing messages.",
    ticketPanelTitle: "Support",
    ticketPanelText:
        "Need help from the team? Open a ticket: a private thread only you and the team see.",
    ticketOpenButton: "Open a ticket",
    ticketCannotRun: (channel: string, missing: string) =>
        `Nexo can't run tickets in ${channel} yet. Give it these permissions there: ${missing}.`,
    ticketSetUp: (channel: string) =>
        `The ticket button is in ${channel}. To stop new tickets, delete the message with the ` +
        "button; open tickets stay.",
    ticketTeamNotMentionable: (role: string) =>
        `Nexo mentions the team in every ticket, and you may not mention ${role}. Make the role ` +
        "mentionable, or ask someone who may mention every role.",
    ticketUnavailable: "Nexo can't open tickets here right now. Please tell the team another way.",
    ticketWarnEveryone: (channel: string) =>
        `Careful: @everyone may not Send Messages in Threads in ${channel}, so members can't ` +
        "write in their ticket. Allow it there; the channel itself can stay read-only.",
    ticketWarnTeamSize: (role: string, channel: string) =>
        `Careful: ${role} has 100 members or more, so Discord doesn't add them to new tickets. ` +
        `Choose a smaller role, or give the team Manage Threads and Posts in ${channel} so it ` +
        "sees every ticket.",
    levelUpsHere:
        "Level-ups now appear where the member writes: every level up to 10, after that every " +
        "fifth, and every level that gives a role.",
    levelUpsIn: (channel: string) =>
        `Level-ups now appear in ${channel}: every level up to 10, after that every fifth, and ` +
        "every level that gives a role.",
    levelUpsOff: "Level-ups are off. Members still earn XP and get their level roles.",
    levelsReset: (member: string) => `${member}'s XP starts again at 0.`,
    levelroleAdded: (role: string, level: number) =>
        `Members get ${role} from level ${level} on. Those already past it get it with their ` +
        "next message.",
    levelroleRemoved: (role: string) => `${role} is no longer a level role.`,
    levelroleNotThere: (role: string) => `${role} is not a level role.`,
    levelroleNone: (add: string) => `No level roles yet. Add one with ${add}.`,
    levelroleListTitle: "Level roles",
    dmTitles: {
        warn: (server: string) => `Warning on ${server}`,
        timeout: (server: string) => `Timeout on ${server}`,
        kick: (server: string) => `Removed from ${server}`,
        ban: (server: string) => `Banned from ${server}`,
    },
    dmWarnings: "Warnings so far",
    dmKickNote: "You can join again with a new invite.",
    dmNoReply: "Replies here don't reach the team.",
    dmNotDelivered:
        "The member didn't get a direct message: they don't accept any from this server.",
    ticketTitle: "Ticket",
    ticketHello: (member: string) => `${member}, tell us what it's about. The team answers here.`,
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
    greetingPingDescription: "Ping the new member (needs {user} in the message)",
    addName: "add",
    autoroleAddDescription: "Adds a role that new members get",
    removeName: "remove",
    autoroleRemoveDescription: "Takes a role out of the automatic ones",
    listName: "list",
    autoroleListDescription: "Shows the roles new members get",
    roleOptionName: "role",
    roleOptionDescription: "The role new members get",
    moderationMemberName: "member",
    moderationMemberDescription: "The member to act on",
    reasonName: "reason",
    reasonDescription: "Why; the member is told, and it goes into the audit log",
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
    levelsSetupDescription: "Sets where level-ups appear",
    levelsChannelDescription: "One channel for all level-ups; leave it out for where members write",
    levelsOffDescription: "Turns level-up messages off; XP and level roles stay",
    resetName: "reset",
    levelsResetDescription: "Sets a member's XP back to 0, such as a spammer's",
    levelsResetMemberDescription: "The member whose XP starts again",
    levelOptionName: "level",
    levelOptionDescription: "The level that gives the role",
    levelroleAddDescription: "Gives members a role from a level on",
    levelroleRoleDescription: "The role members get at that level",
    levelroleRemoveDescription: "Stops giving a role for a level; members keep it",
    levelroleListDescription: "Shows the level roles",
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
