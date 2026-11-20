import { InteractionContextType, MessageFlags, SlashCommandBuilder, userMention } from "discord.js";
import { card } from "../card.ts";
import { levelFor, progressBar } from "../leveling.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { chosenPerson, memberOption } from "./member-option.ts";

const LEADERBOARD_SIZE = 10;
const MEDALS = ["🥇", "🥈", "🥉"];

export const rank: Command = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription(en.rankDescription)
        .setDescriptionLocalizations({ de: de.rankDescription })
        .setContexts(InteractionContextType.Guild)
        .addUserOption(memberOption),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const { user, member } = chosenPerson(interaction);
        const total = settings.totalXp(interaction.guildId, user.id);
        const { level, xp, needed } = levelFor(total);
        return interaction.reply({
            embeds: [
                card(member?.displayName ?? user.displayName)
                    .setThumbnail((member ?? user).displayAvatarURL({ size: 256 }))
                    .addFields(
                        { name: t.levelName, value: String(level), inline: true },
                        {
                            name: t.rankPlace,
                            value: `#${settings.rank(interaction.guildId, user.id)}`,
                            inline: true,
                        },
                        { name: t.totalXp, value: String(total), inline: true },
                        {
                            name: t.nextLevel,
                            value: `${progressBar(xp, needed)} ${xp} / ${needed} XP`,
                        },
                    ),
            ],
        });
    },
};

export const leaderboard: Command = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription(en.leaderboardDescription)
        .setDescriptionLocalizations({ de: de.leaderboardDescription })
        .setContexts(InteractionContextType.Guild),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const { guild, guildId, user } = interaction;
        const top = settings.leaderboard(guildId, LEADERBOARD_SIZE);
        if (top.length === 0) {
            return interaction.reply({
                content: t.leaderboardEmpty,
                flags: MessageFlags.Ephemeral,
            });
        }
        const lines = top.map(({ userId, totalXp }) => {
            // Members with the same XP share a place, as /rank counts it: one plus those above.
            const place = 1 + top.filter((other) => other.totalXp > totalXp).length;
            const marker = MEDALS[place - 1] ?? `**${place}.**`;
            const { level } = levelFor(totalXp);
            return `${marker} ${userMention(userId)} · ${t.levelName} ${level} · ${totalXp} XP`;
        });
        return interaction.reply({
            embeds: [
                card(t.leaderboardTitle(guild.name))
                    .setDescription(lines.join("\n"))
                    .setFooter({ text: t.leaderboardYou(settings.rank(guildId, user.id)) }),
            ],
        });
    },
};
