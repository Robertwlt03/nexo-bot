import {
    Client,
    Events,
    GatewayIntentBits,
    type GuildMember,
    type InteractionReplyOptions,
    MessageFlags,
    Options,
    type PartialGuildMember,
    Partials,
} from "discord.js";
import { giveRoles } from "./autorole.ts";
import { commands } from "./commands/index.ts";
import { rememberCommandIds } from "./commands/mention.ts";
import { readConfig } from "./config.ts";
import { sendGreeting } from "./greeting.ts";
import { syncIcons } from "./icons.ts";
import { xpCooldowns } from "./leveling.ts";
import { earnXp } from "./levelup.ts";
import { logAuditEntry } from "./modlog.ts";
import { type GreetingKind, openSettings } from "./settings.ts";
import { texts } from "./texts.ts";

const config = readConfig(process.env);
const settings = openSettings(config.databasePath);
const client = new Client({
    // GuildMembers is a privileged intent: it tells the bot when someone joins or leaves.
    // GuildMessages only says that someone wrote, for XP; reading what they wrote would need
    // the privileged MessageContent intent, which Nexo does without. GuildModeration brings new
    // audit log entries, for the mod log, where Nexo may view the audit log.
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
    ],
    // Without it, Discord.js reports only leavers it happens to have seen since the bot started.
    partials: [Partials.GuildMember],
    // Discord.js would keep 200 messages per channel; Nexo never reads them, it only counts XP.
    makeCache: Options.cacheWithLimits({ ...Options.DefaultMakeCacheSettings, MessageManager: 0 }),
    // Cards mention people and roles to name them; only a message meant to notify says whom.
    allowedMentions: { parse: [] },
});

client.once(Events.ClientReady, async (ready) => {
    // Without its icons Nexo still works: icon() then gives nothing.
    syncIcons(ready.application).catch((error: unknown) =>
        console.error("Could not upload Nexo's icons as app emojis:", error),
    );
    const definitions = commands.map((command) => command.data.toJSON());
    const where = config.guildId ? `test server ${config.guildId}` : "every server";
    try {
        const registered = await (config.guildId
            ? ready.application.commands.set(definitions, config.guildId)
            : ready.application.commands.set(definitions));
        rememberCommandIds(registered.values());
        console.log(`${ready.user.tag} is online with ${definitions.length} commands in ${where}`);
    } catch (error) {
        console.error(
            `Could not register the commands in ${where}. Is the bot on that server, and is ` +
                "GUILD_ID the server's ID (Developer Mode, right-click the server, " +
                "Copy Server ID)?",
            error,
        );
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;
    // A button's ID is "command:what"; what may hold colons of its own.
    const [name, ...what] = interaction.isButton()
        ? interaction.customId.split(":")
        : [interaction.commandName];
    const command = commands.find(({ data }) => data.name === name);
    try {
        // A command or button from an older version of the bot gets an answer, not silence.
        if (interaction.isButton() && command?.button) {
            await command.button(interaction, { settings }, what.join(":"));
        } else if (interaction.isChatInputCommand() && command) {
            await command.run(interaction, { settings });
        } else {
            await interaction.reply({
                content: texts(interaction.locale).unknownCommand,
                flags: MessageFlags.Ephemeral,
            });
        }
    } catch (error) {
        console.error(
            `${interaction.isButton() ? interaction.customId : `/${name}`} failed:`,
            error,
        );
        const reply: InteractionReplyOptions = {
            content: texts(interaction.locale).error,
            flags: MessageFlags.Ephemeral,
        };
        // A deferred command waits for its answer; a deferred button would have its own card
        // edited instead, so it gets a new message. The answer can fail too, such as after
        // Discord's three seconds to answer, and that must not end the bot.
        const fillIn = interaction.deferred && !interaction.replied && !interaction.isButton();
        await (fillIn
            ? interaction.editReply({ content: reply.content })
            : interaction.replied || interaction.deferred
              ? interaction.followUp(reply)
              : interaction.reply(reply)
        ).catch((replyError) => console.error("The error answer failed too:", replyError));
    }
});

/** Posts a server's welcome or goodbye for a member, if it has one, and logs what went wrong. */
async function greet(kind: GreetingKind, member: GuildMember | PartialGuildMember): Promise<void> {
    const greeting = settings.greeting(kind, member.guild.id);
    if (!greeting) return;
    const result = await sendGreeting(kind, member, greeting).catch((error: unknown) => error);
    if (result !== "sent") {
        console.error(
            `Could not post the ${kind} for ${member.user.tag} on ${member.guild.name}:`,
            result,
        );
    }
}

/** Gives a member the server's automatic roles, and logs what went wrong. */
async function autoroles(member: GuildMember): Promise<void> {
    const ids = settings.autoroles(member.guild.id);
    await giveRoles(member, ids, "Nexo: automatic role for new members").catch((error: unknown) =>
        console.error(`Could not give the automatic roles to ${member.user.tag}:`, error),
    );
}

// A bot someone adds or removes is not a member to greet or to give roles.
client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot) return;
    // On a server with Discord's rules screening, a role given before the member accepts the
    // rules lets them skip it; they get their roles once they accept (below).
    await Promise.all([greet("welcome", member), member.pending ? undefined : autoroles(member)]);
});

// ponytail: a member who accepts the rules after Nexo restarted comes uncached, without the
// earlier `pending`, and gets no roles; check `before.partial` too only with a way to tell
// roles an admin took away.
client.on(Events.GuildMemberUpdate, async (before, after) => {
    if (before.pending && !after.pending && !after.user.bot) await autoroles(after);
});

const cooldowns = xpCooldowns();

client.on(Events.MessageCreate, async (message) => {
    if (!message.inGuild() || message.author.bot || message.webhookId || message.system) return;
    // A failed write or card costs one message's XP, never the bot.
    await earnXp(message, settings, cooldowns).catch((error: unknown) =>
        console.error(`Could not give XP to ${message.author.tag}:`, error),
    );
});

client.on(Events.GuildAuditLogEntryCreate, (entry, guild) =>
    logAuditEntry(entry, guild, settings).catch((error: unknown) =>
        console.error(`Could not log an audit log entry of ${guild.name}:`, error),
    ),
);

client.on(Events.GuildMemberRemove, async (member) => {
    if (member.user.bot || !settings.greeting("goodbye", member.guild.id)) return;
    // A banned member gets no goodbye: in a raid it would post a picture of every raider.
    // Without Ban Members Nexo can't tell, and says goodbye.
    // ponytail: a kick still gets one; tell it apart through the audit log if servers mind.
    const banned = await member.guild.bans.fetch(member.id).then(
        () => true,
        () => false,
    );
    if (!banned) await greet("goodbye", member);
});

// Removed from a server, Nexo forgets it: its settings, warnings, XP and tickets. Discord reports
// a server that is only out of reach for a while differently (GuildUnavailable).
client.on(Events.GuildDelete, (guild) => {
    try {
        settings.forgetServer(guild.id);
    } catch (error) {
        console.error(`Could not forget the server ${guild.name}:`, error);
    }
});

await client.login(config.token);
