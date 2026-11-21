import {
    ChannelType,
    channelMention,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { missingPermissions } from "../channel.ts";
import { commandTexts, en, texts } from "../texts.ts";
import type { Command } from "./command.ts";

export const modlog: Command = {
    data: new SlashCommandBuilder()
        .setName("modlog")
        .setDescription(en.commandDescriptions.modlog)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) =>
            setup
                .setName(commandTexts.setupName)
                .setDescription(commandTexts.modlogSetupDescription)
                .addChannelOption((channel) =>
                    channel
                        .setName(commandTexts.channelName)
                        .setDescription(commandTexts.modlogChannelDescription)
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true),
                ),
        )
        .addSubcommand((off) =>
            off.setName(commandTexts.offName).setDescription(commandTexts.modlogOffDescription),
        ),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);

        if (interaction.options.getSubcommand() === commandTexts.offName) {
            settings.removeModlog(interaction.guildId);
            return answer(t.modlogOff);
        }
        const channel = interaction.options.getChannel(commandTexts.channelName, true);
        const missing = missingPermissions(channel);
        if (missing.length > 0) {
            const names = missing.map((permission) => t.permissionNames[permission]).join(", ");
            return answer(t.cannotPost(channelMention(channel.id), names));
        }
        settings.saveModlog(interaction.guildId, channel.id, interaction.locale);
        const everyone = interaction.guild.roles.everyone;
        const isPublic = channel.permissionsFor(everyone).has(PermissionFlagsBits.ViewChannel);
        const seesAuditLog = interaction.guild.members.me?.permissions.has(
            PermissionFlagsBits.ViewAuditLog,
        );
        const notes = [
            t.modlogSaved(channelMention(channel.id)),
            ...(seesAuditLog ? [] : [t.modlogNoAuditLog]),
            ...(isPublic ? [t.modlogPublic] : []),
        ];
        return answer(notes.join(" "));
    },
};
