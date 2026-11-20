import {
    ChannelType,
    channelMention,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { missingPermissions } from "../channel.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { localized } from "./localized.ts";

export const modlog: Command = {
    data: new SlashCommandBuilder()
        .setName("modlog")
        .setDescription(en.modlogDescription)
        .setDescriptionLocalizations({ de: de.modlogDescription })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) =>
            localized(
                setup,
                [en.setupName, de.setupName],
                [en.modlogSetupDescription, de.modlogSetupDescription],
            ).addChannelOption((channel) =>
                channel
                    .setName(en.channelName)
                    .setNameLocalizations({ de: de.channelName })
                    .setDescription(en.modlogChannelDescription)
                    .setDescriptionLocalizations({ de: de.modlogChannelDescription })
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true),
            ),
        )
        .addSubcommand((off) =>
            localized(
                off,
                [en.offName, de.offName],
                [en.modlogOffDescription, de.modlogOffDescription],
            ),
        ),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);

        if (interaction.options.getSubcommand() === en.offName) {
            settings.removeModlogChannel(interaction.guildId);
            return answer(t.modlogOff);
        }
        const channel = interaction.options.getChannel(en.channelName, true);
        const missing = missingPermissions(channel);
        if (missing.length > 0) {
            const names = missing.map((permission) => t.permissionNames[permission]).join(", ");
            return answer(t.cannotPost(channelMention(channel.id), names));
        }
        settings.saveModlogChannel(interaction.guildId, channel.id);
        const everyone = interaction.guild.roles.everyone;
        const isPublic = channel.permissionsFor(everyone).has(PermissionFlagsBits.ViewChannel);
        const saved = t.modlogSaved(channelMention(channel.id));
        return answer(isPublic ? `${saved} ${t.modlogPublic}` : saved);
    },
};
