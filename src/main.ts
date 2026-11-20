import {
    Client,
    Events,
    GatewayIntentBits,
    type InteractionReplyOptions,
    MessageFlags,
} from "discord.js";
import { commands } from "./commands/index.ts";
import { readConfig } from "./config.ts";
import { texts } from "./texts.ts";

const config = readConfig(process.env);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
            ? command.run(interaction)
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

await client.login(config.token);
