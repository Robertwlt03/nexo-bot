import {
    ChannelType,
    channelMention,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import { missingPermissions, sendWelcome } from "../welcome.ts";
import type { Command } from "./command.ts";

export const welcome: Command = {
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription(en.welcomeDescription)
        .setDescriptionLocalizations({ de: de.welcomeDescription })
        .setContexts(InteractionContextType.Guild)
        // Only people who may manage the server see it;
        // admins can widen this in the server settings.
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) =>
            setup
                .setName(en.welcomeSetupName)
                .setNameLocalizations({ de: de.welcomeSetupName })
                .setDescription(en.welcomeSetupDescription)
                .setDescriptionLocalizations({ de: de.welcomeSetupDescription })
                .addChannelOption((channel) =>
                    channel
                        .setName(en.welcomeChannelName)
                        .setNameLocalizations({ de: de.welcomeChannelName })
                        .setDescription(en.welcomeChannelDescription)
                        .setDescriptionLocalizations({ de: de.welcomeChannelDescription })
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true),
                )
                .addStringOption((message) =>
                    message
                        .setName(en.welcomeMessageName)
                        .setNameLocalizations({ de: de.welcomeMessageName })
                        .setDescription(en.welcomeMessageDescription)
                        .setDescriptionLocalizations({ de: de.welcomeMessageDescription })
                        .setMaxLength(1000),
                )
                .addBooleanOption((ping) =>
                    ping
                        .setName(en.welcomePingName)
                        .setNameLocalizations({ de: de.welcomePingName })
                        .setDescription(en.welcomePingDescription)
                        .setDescriptionLocalizations({ de: de.welcomePingDescription }),
                ),
        )
        .addSubcommand((test) =>
            test
                .setName(en.welcomeTestName)
                .setNameLocalizations({ de: de.welcomeTestName })
                .setDescription(en.welcomeTestDescription)
                .setDescriptionLocalizations({ de: de.welcomeTestDescription }),
        )
        .addSubcommand((off) =>
            off
                .setName(en.welcomeOffName)
                .setNameLocalizations({ de: de.welcomeOffName })
                .setDescription(en.welcomeOffDescription)
                .setDescriptionLocalizations({ de: de.welcomeOffDescription }),
        ),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);
        const guildId = interaction.guildId;

        switch (interaction.options.getSubcommand()) {
            case en.welcomeSetupName: {
                const channel = interaction.options.getChannel(en.welcomeChannelName, true);
                const missing = missingPermissions(channel);
                if (missing.length > 0) {
                    const names = missing.map((permission) => t.permissionNames[permission]);
                    return answer(
                        t.welcomeCannotPost(channelMention(channel.id), names.join(", ")),
                    );
                }
                const saved = settings.welcome(guildId);
                // What is left out keeps its saved value, or starts with the default.
                settings.saveWelcome(guildId, {
                    channelId: channel.id,
                    message:
                        interaction.options.getString(en.welcomeMessageName) ??
                        saved?.message ??
                        t.defaultWelcome,
                    ping:
                        interaction.options.getBoolean(en.welcomePingName) ?? saved?.ping ?? false,
                });
                return answer(t.welcomeSaved(channelMention(channel.id)));
            }
            case en.welcomeTestName: {
                const saved = settings.welcome(guildId);
                if (!saved) return answer(t.welcomeNotSetUp);
                const result = await sendWelcome(interaction.member, saved);
                const channel = channelMention(saved.channelId);
                if (result === "no-channel") return answer(t.welcomeChannelGone);
                if (result === "no-permission") {
                    const names = Object.values(t.permissionNames).join(", ");
                    return answer(t.welcomeCannotPost(channel, names));
                }
                return answer(t.welcomeTestSent(channel));
            }
            case en.welcomeOffName:
                settings.removeWelcome(guildId);
                return answer(t.welcomeOff);
            default:
                return answer(t.unknownCommand);
        }
    },
};
