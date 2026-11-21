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
import { en, type Texts, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { localized } from "./localized.ts";
import { commandMention } from "./mention.ts";

/** Sends a greeting for the member who asks, to try it, and says how that went. */
async function tryGreeting(
    kind: GreetingKind,
    member: GuildMember,
    settings: Settings,
    t: Texts,
): Promise<string> {
    const setup = commandMention(kind, en.setupName);
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
        .setDescription(en[kind].description)
        .setDescriptionLocalizations({ de: de[kind].description })
        .setContexts(InteractionContextType.Guild)
        // Only people who may manage the server see it;
        // admins can widen this in the server settings.
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) => {
            localized(
                setup,
                [en.setupName, de.setupName],
                [en[kind].setupDescription, de[kind].setupDescription],
            )
                .addChannelOption((channel) =>
                    channel
                        .setName(en.channelName)
                        .setNameLocalizations({ de: de.channelName })
                        .setDescription(en[kind].channelDescription)
                        .setDescriptionLocalizations({ de: de[kind].channelDescription })
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true),
                )
                .addStringOption((message) =>
                    message
                        .setName(en.greetingMessageName)
                        .setNameLocalizations({ de: de.greetingMessageName })
                        .setDescription(en.greetingMessageDescription)
                        .setDescriptionLocalizations({ de: de.greetingMessageDescription })
                        .setMaxLength(1000),
                );
            // Someone who has left gets no notification, so only the welcome can mention.
            if (kind === "welcome") {
                setup.addBooleanOption((ping) =>
                    ping
                        .setName(en.greetingPingName)
                        .setNameLocalizations({ de: de.greetingPingName })
                        .setDescription(en.greetingPingDescription)
                        .setDescriptionLocalizations({ de: de.greetingPingDescription }),
                );
            }
            return setup;
        })
        .addSubcommand((test) =>
            localized(
                test,
                [en.greetingTestName, de.greetingTestName],
                [en[kind].testDescription, de[kind].testDescription],
            ),
        )
        .addSubcommand((off) =>
            localized(
                off,
                [en.offName, de.offName],
                [en[kind].offDescription, de[kind].offDescription],
            ),
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
                case en.setupName: {
                    const channel = interaction.options.getChannel(en.channelName, true);
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
                            interaction.options.getString(en.greetingMessageName) ??
                            saved?.message ??
                            t[kind].defaultMessage,
                        ping:
                            interaction.options.getBoolean(en.greetingPingName) ??
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
                case en.greetingTestName:
                    return answer(await tryGreeting(kind, interaction.member, settings, t));
                case en.offName:
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
