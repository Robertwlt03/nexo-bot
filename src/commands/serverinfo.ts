import { InteractionContextType, MessageFlags, SlashCommandBuilder, userMention } from "discord.js";
import { card } from "../card.ts";
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
        const members = guild.approximateMemberCount ?? guild.memberCount;
        const roles = guild.roles.cache.size - 1; // without @everyone, which every server has
        const boosts = `${guild.premiumSubscriptionCount ?? 0} · ${t.level} ${guild.premiumTier}`;
        return interaction.reply({
            embeds: [
                card(guild.name)
                    .setThumbnail(guild.iconURL({ size: 256 }))
                    .addFields(
                        { name: t.owner, value: userMention(guild.ownerId), inline: true },
                        { name: t.members, value: String(members), inline: true },
                        {
                            name: t.boosts,
                            value: boosts,
                            inline: true,
                        },
                        {
                            name: t.channels,
                            value: String(guild.channels.cache.size),
                            inline: true,
                        },
                        { name: t.roles, value: String(roles), inline: true },
                        { name: t.created, value: dateWithAge(guild.createdAt) },
                    ),
            ],
        });
    },
};
