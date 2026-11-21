import {
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    subtext,
    userMention,
} from "discord.js";
import { CARD, card, drawn } from "../card.ts";
import { icon } from "../icons.ts";
import { avatarData, rankImage } from "../images.ts";
import { levelFor } from "../leveling.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { chosenPerson, memberOption } from "./member-option.ts";

const LEADERBOARD_SIZE = 10;

export const rank: Command = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription(en.rankDescription)
        .setDescriptionLocalizations({ de: de.rankDescription })
        .setContexts(InteractionContextType.Guild)
        .addUserOption(memberOption),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        // Fetching the member's picture and drawing can take longer than Discord's three seconds.
        await interaction.deferReply();
        const { user, member } = chosenPerson(interaction);
        const totalXp = settings.totalXp(interaction.guildId, user.id);
        const person = member ?? user;
        const picture = drawn(
            "rank.png",
            rankImage({
                avatar: await avatarData(
                    person.displayAvatarURL({ extension: "png", size: 256, forceStatic: true }),
                ),
                name: person.displayName,
                place: settings.rank(interaction.guildId, user.id),
                totalXp,
                ...levelFor(totalXp),
            }),
        );
        return interaction.editReply({
            components: [card(null, undefined, { top: picture.url })],
            files: [picture.file],
            flags: CARD,
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
        const { guildId, user } = interaction;
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
            const { level } = levelFor(totalXp);
            const number = String(place).padStart(2, "0");
            const stats = `${t.levelName} ${level} · ${totalXp} XP`;
            return `**${number}**  ${userMention(userId)}  ·  ${stats}`;
        });
        // The asker's own place only when the list doesn't show them already.
        if (!top.some(({ userId }) => userId === user.id)) {
            lines.push(subtext(t.leaderboardYou(settings.rank(guildId, user.id))));
        }
        const title = `${icon("leaderboard")}${t.leaderboardTitle}`;
        return interaction.reply({ components: [card(title, lines.join("\n"))], flags: CARD });
    },
};
