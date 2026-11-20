import {
    Client,
    Events,
    GatewayIntentBits,
    type GuildMember,
    type InteractionReplyOptions,
    MessageFlags,
    type PartialGuildMember,
    Partials,
} from "discord.js";
import { giveAutoroles } from "./autorole.ts";
import { commands } from "./commands/index.ts";
import { readConfig } from "./config.ts";
import { sendGreeting } from "./greeting.ts";
import { type GreetingKind, openSettings } from "./settings.ts";
import { texts } from "./texts.ts";

const config = readConfig(process.env);
const settings = openSettings(config.databasePath);
const client = new Client({
    // GuildMembers is a privileged intent: it tells the bot when someone joins or leaves.
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    // Without it, Discord.js reports only leavers it happens to have seen since the bot started.
    partials: [Partials.GuildMember],
});

client.once(Events.ClientReady, async (ready) => {
    const definitions = commands.map((command) => command.data.toJSON());
    const where = config.guildId ? `test server ${config.guildId}` : "every server";
    try {
        await (config.guildId
            ? ready.application.commands.set(definitions, config.guildId)
            : ready.application.commands.set(definitions));
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
    if (!interaction.isChatInputCommand()) return;
    const command = commands.find(({ data }) => data.name === interaction.commandName);
    try {
        // A command Discord still lists from an older version of the bot gets an answer,
        // not silence.
        await (command
            ? command.run(interaction, { settings })
            : interaction.reply({
                  content: texts(interaction.locale).unknownCommand,
                  flags: MessageFlags.Ephemeral,
              }));
    } catch (error) {
        console.error(`/${interaction.commandName} failed:`, error);
        const reply: InteractionReplyOptions = {
            content: texts(interaction.locale).error,
            flags: MessageFlags.Ephemeral,
        };
        // The answer can fail too, such as after Discord's three seconds to answer;
        // that must not end the bot.
        await (interaction.replied || interaction.deferred
            ? interaction.followUp(reply)
            : interaction.reply(reply)
        ).catch((replyError) => console.error("The error answer failed too:", replyError));
    }
});

/** Posts a server's welcome or goodbye for a member, if it has one, and logs what went wrong. */
async function greet(kind: GreetingKind, member: GuildMember | PartialGuildMember): Promise<void> {
    const greeting = settings.greeting(kind, member.guild.id);
    if (!greeting) return;
    const result = await sendGreeting(member, greeting).catch((error: unknown) => error);
    if (result !== "sent") {
        console.error(
            `Could not post the ${kind} for ${member.user.tag} on ${member.guild.name}:`,
            result,
        );
    }
}

// A bot someone adds or removes is not a member to greet or to give roles.
client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot) return;
    await Promise.all([
        greet("welcome", member),
        giveAutoroles(member, settings).catch((error: unknown) =>
            console.error(`Could not give the automatic roles to ${member.user.tag}:`, error),
        ),
    ]);
});

client.on(Events.GuildMemberRemove, async (member) => {
    if (member.user.bot) return;
    await greet("goodbye", member);
});

await client.login(config.token);
