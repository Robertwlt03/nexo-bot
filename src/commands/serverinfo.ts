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
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";

export const serverinfo: Command = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription(en.serverinfoDescription)
        .setDescriptionLocalizations({ de: de.serverinfoDescription })
        .setContexts(InteractionContextType.Guild),

    async run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        // The member count the bot keeps is the one from its start: Discord only reports joins to
        // bots with the privileged members intent. Asking Discord gives today's count instead.
        const guild = await interaction.client.guilds.fetch({
            guild: interaction.guild,
            withCounts: true,
            force: true,
        });
        const roles = guild.roles.cache.size - 1; // without @everyone, which every server has
        // The counts in one row, each number bold before what it counts.
        const counts = [
            [guild.approximateMemberCount ?? guild.memberCount, t.members],
            [guild.channels.cache.size, t.channels],
            [roles, t.roles],
            [guild.premiumSubscriptionCount ?? 0, `${t.boosts} (${t.level} ${guild.premiumTier})`],
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
