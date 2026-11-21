import {
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    subtext,
    userMention,
} from "discord.js";
import { CARD, card, facts } from "../card.ts";
import { dateWithAge } from "../format.ts";
import { en, texts } from "../texts.ts";
import type { Command } from "./command.ts";

export const serverinfo: Command = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription(en.commandDescriptions.serverinfo)
        .setContexts(InteractionContextType.Guild),

    run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        // The member count stays current: Nexo hears of every join and leave (GuildMembers).
        const { guild } = interaction;
        const roles = guild.roles.cache.size - 1; // without @everyone, which every server has
        // Threads, tickets among them, are not channels of their own.
        const channels = guild.channels.cache.filter((channel) => !channel.isThread()).size;
        // The counts in one row, each number bold before what it counts.
        const counts = [
            [guild.memberCount, t.members],
            [channels, t.channels],
            [roles, t.roles],
            [
                guild.premiumSubscriptionCount ?? 0,
                `${t.boosts} (${t.boostTier} ${guild.premiumTier})`,
            ],
        ]
            .map(([count, label]) => `**${count}** ${label}`)
            .join("  ·  ");
        const text = [
            facts([[t.owner, userMention(guild.ownerId)]]),
            counts,
            subtext(`${t.created} ${dateWithAge(guild.createdAt)}`),
        ].join("\n");
        const picture = guild.iconURL({ size: 256 }) ?? undefined;
        return interaction.reply({
            components: [card(guild.name, text, { picture })],
            flags: CARD,
        });
    },
};
