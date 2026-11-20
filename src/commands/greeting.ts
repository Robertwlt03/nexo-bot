import {
    ChannelType,
    channelMention,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { missingPermissions, sendGreeting } from "../greeting.ts";
import type { GreetingKind } from "../settings.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { localized } from "./localized.ts";

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
                [en.greetingSetupName, de.greetingSetupName],
                [en[kind].setupDescription, de[kind].setupDescription],
            )
                .addChannelOption((channel) =>
                    channel
                        .setName(en.greetingChannelName)
                        .setNameLocalizations({ de: de.greetingChannelName })
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
                [en.greetingOffName, de.greetingOffName],
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
            const setupCommand = `/${kind} ${t.greetingSetupName}`;

            switch (interaction.options.getSubcommand()) {
                case en.greetingSetupName: {
                    const channel = interaction.options.getChannel(en.greetingChannelName, true);
                    const missing = missingPermissions(channel);
                    if (missing.length > 0) {
                        const names = missing.map((permission) => t.permissionNames[permission]);
                        return answer(
                            t.greetingCannotPost(channelMention(channel.id), names.join(", ")),
                        );
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
                    const test = `/${kind} ${t.greetingTestName}`;
                    return answer(
                        `${t[kind].saved(channelMention(channel.id))} ${t.greetingTryIt(test)}`,
                    );
                }
                case en.greetingTestName: {
                    const saved = settings.greeting(kind, guildId);
                    if (!saved) return answer(t.greetingNotSetUp(setupCommand));
                    const result = await sendGreeting(interaction.member, saved);
                    const channel = channelMention(saved.channelId);
                    if (result === "no-channel") return answer(t.greetingChannelGone(setupCommand));
                    if (result === "no-permission") {
                        const names = Object.values(t.permissionNames).join(", ");
                        return answer(t.greetingCannotPost(channel, names));
                    }
                    return answer(t.greetingTestSent(channel));
                }
                case en.greetingOffName:
                    settings.removeGreeting(kind, guildId);
                    return answer(t[kind].off);
                default:
                    return answer(t.unknownCommand);
            }
        },
    };
}

export const welcome = greetingCommand("welcome");
export const goodbye = greetingCommand("goodbye");
