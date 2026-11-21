import {
    ChannelType,
    channelMention,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    userMention,
} from "discord.js";
import { CARD, card, drawn } from "../card.ts";
import { missingPermissions } from "../channel.ts";
import { icon } from "../icons.ts";
import { avatarData, drawableName, rankImage } from "../images.ts";
import { levelFor } from "../leveling.ts";
import { commandTexts, en, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import { chosenPerson, memberOption } from "./member-option.ts";

const LEADERBOARD_SIZE = 10;

export const rank: Command = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription(en.commandDescriptions.rank)
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
                name: drawableName(person.displayName, user.username),
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
        .setDescription(en.commandDescriptions.leaderboard)
        .setContexts(InteractionContextType.Guild),

    async run(interaction, { settings }) {
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
        const title = `${icon("leaderboard")}${t.leaderboardTitle}`;
        await interaction.reply({ components: [card(title, lines.join("\n"))], flags: CARD });
        // The asker's own place, for them alone, when the list doesn't show them.
        if (top.some(({ userId }) => userId === user.id)) return;
        const totalXp = settings.totalXp(guildId, user.id);
        const own =
            totalXp === 0
                ? t.leaderboardNoXp
                : t.leaderboardYou(
                      settings.rank(guildId, user.id),
                      levelFor(totalXp).level,
                      totalXp,
                  );
        return interaction.followUp({ content: own, flags: MessageFlags.Ephemeral });
    },
};

/** /levels: where level-up cards appear, or none; and taking a member off the leaderboard. */
export const levels: Command = {
    data: new SlashCommandBuilder()
        .setName("levels")
        .setDescription(en.commandDescriptions.levels)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) =>
            setup
                .setName(commandTexts.setupName)
                .setDescription(commandTexts.levelsSetupDescription)
                .addChannelOption((channel) =>
                    channel
                        .setName(commandTexts.channelName)
                        .setDescription(commandTexts.levelsChannelDescription)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
                ),
        )
        .addSubcommand((off) =>
            off.setName(commandTexts.offName).setDescription(commandTexts.levelsOffDescription),
        )
        .addSubcommand((reset) =>
            reset
                .setName(commandTexts.resetName)
                .setDescription(commandTexts.levelsResetDescription)
                .addUserOption((member) =>
                    member
                        .setName(commandTexts.moderationMemberName)
                        .setDescription(commandTexts.levelsResetMemberDescription)
                        .setRequired(true),
                ),
        ),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);
        const { guildId } = interaction;
        switch (interaction.options.getSubcommand()) {
            case commandTexts.offName:
                settings.saveLevelUpChannel(guildId, null);
                return answer(t.levelUpsOff);
            case commandTexts.resetName: {
                // Also for someone banned, who would otherwise stay on the leaderboard.
                const user = interaction.options.getUser(commandTexts.moderationMemberName, true);
                settings.resetXp(guildId, user.id);
                return answer(t.levelsReset(userMention(user.id)));
            }
            default: {
                const channel = interaction.options.getChannel(commandTexts.channelName);
                if (!channel) {
                    settings.saveLevelUpChannel(guildId, undefined);
                    return answer(t.levelUpsHere);
                }
                const missing = missingPermissions(channel);
                if (missing.length > 0) {
                    const names = missing.map((name) => t.permissionNames[name]).join(", ");
                    return answer(t.cannotPost(channelMention(channel.id), names));
                }
                settings.saveLevelUpChannel(guildId, channel.id);
                return answer(t.levelUpsIn(channelMention(channel.id)));
            }
        }
    },
};
