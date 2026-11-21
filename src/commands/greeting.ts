import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    channelMention,
    type GuildMember,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { missingPermissions } from "../channel.ts";
import { sendGreeting } from "../greeting.ts";
import type { GreetingKind, Settings } from "../settings.ts";
import { commandTexts, en, type Texts, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import { commandMention } from "./mention.ts";

/** Sends a greeting for the member who asks, to try it, and says how that went. */
async function tryGreeting(
    kind: GreetingKind,
    member: GuildMember,
    settings: Settings,
    t: Texts,
): Promise<string> {
    const setup = commandMention(kind, commandTexts.setupName);
    const saved = settings.greeting(kind, member.guild.id);
    if (!saved) return t.greetingNotSetUp(setup);
    const result = await sendGreeting(kind, member, saved);
    const channel = channelMention(saved.channelId);
    if (result === "no-channel") return t.channelGone(setup);
    if (Array.isArray(result)) {
        const names = result.map((permission) => t.permissionNames[permission]);
        return t.cannotPost(channel, names.join(", "));
    }
    return t.greetingTestSent(channel);
}

/** /welcome or /goodbye: set up, test and turn off one of a server's greetings. */
export function greetingCommand(kind: GreetingKind): Command {
    const data = new SlashCommandBuilder()
        .setName(kind)
        .setDescription(en.commandDescriptions[kind])
        .setContexts(InteractionContextType.Guild)
        // Only people who may manage the server see it;
        // admins can widen this in the server settings.
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) => {
            setup
                .setName(commandTexts.setupName)
                .setDescription(commandTexts[kind].setupDescription)
                .addChannelOption((channel) =>
                    channel
                        .setName(commandTexts.channelName)
                        .setDescription(commandTexts[kind].channelDescription)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true),
                )
                .addStringOption((message) =>
                    message
                        .setName(commandTexts.greetingMessageName)
                        .setDescription(commandTexts.greetingMessageDescription)
                        .setMaxLength(1000),
                );
            // Someone who has left gets no notification, so only the welcome can mention.
            if (kind === "welcome") {
                setup.addBooleanOption((ping) =>
                    ping
                        .setName(commandTexts.greetingPingName)
                        .setDescription(commandTexts.greetingPingDescription),
                );
            }
            return setup;
        })
        .addSubcommand((test) =>
            test
                .setName(commandTexts.greetingTestName)
                .setDescription(commandTexts[kind].testDescription),
        )
        .addSubcommand((off) =>
            off.setName(commandTexts.offName).setDescription(commandTexts[kind].offDescription),
        );

    return {
        data,
        async run(interaction, { settings }) {
            const t = texts(interaction.locale);
            const answer = (content: string) =>
                interaction.reply({ content, flags: MessageFlags.Ephemeral });
            if (!interaction.inCachedGuild()) return answer(t.serverOnly);
            const guildId = interaction.guildId;

            switch (interaction.options.getSubcommand()) {
                case commandTexts.setupName: {
                    const channel = interaction.options.getChannel(commandTexts.channelName, true);
                    const missing = missingPermissions(channel);
                    if (missing.length > 0) {
                        const names = missing.map((permission) => t.permissionNames[permission]);
                        return answer(t.cannotPost(channelMention(channel.id), names.join(", ")));
                    }
                    const saved = settings.greeting(kind, guildId);
                    // What is left out keeps its saved value, or starts with the default.
                    settings.saveGreeting(kind, guildId, {
                        channelId: channel.id,
                        message:
                            interaction.options.getString(commandTexts.greetingMessageName) ??
                            saved?.message ??
                            t[kind].defaultMessage,
                        ping:
                            interaction.options.getBoolean(commandTexts.greetingPingName) ??
                            saved?.ping ??
                            false,
                    });
                    const test = new ButtonBuilder()
                        .setCustomId(`${kind}:test`)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel(t.testButton);
                    return interaction.reply({
                        content: t[kind].saved(channelMention(channel.id)),
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(test)],
                        flags: MessageFlags.Ephemeral,
                    });
                }
                case commandTexts.greetingTestName:
                    return answer(await tryGreeting(kind, interaction.member, settings, t));
                case commandTexts.offName:
                    settings.removeGreeting(kind, guildId);
                    return answer(t[kind].off);
                default:
                    return answer(t.unknownCommand);
            }
        },
        // The test button under the setup's answer, which only the admin who set it up sees.
        async button(interaction, { settings }) {
            const t = texts(interaction.locale);
            if (!interaction.inCachedGuild()) {
                return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
            }
            const content = await tryGreeting(kind, interaction.member, settings, t);
            return interaction.reply({ content, flags: MessageFlags.Ephemeral });
        },
    };
}

export const welcome = greetingCommand("welcome");
export const goodbye = greetingCommand("goodbye");
