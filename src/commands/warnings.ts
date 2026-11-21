import {
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    type ContainerBuilder,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SectionBuilder,
    SlashCommandBuilder,
    subtext,
    TimestampStyles,
    time,
    type User,
    userMention,
} from "discord.js";
import { card, PRIVATE_CARD } from "../card.ts";
import { icon } from "../icons.ts";
import { factsFor, moderationProblem } from "../moderation.ts";
import { logModeration } from "../modlog.ts";
import type { Settings } from "../settings.ts";
import { commandTexts, en, type Texts, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import {
    checkedMember,
    problemText,
    reasonOption,
    targetMember,
    tellMember,
    untold,
} from "./moderation-options.ts";

/**
 * Why the asker may not remove this warning, or undefined when they may: the same rank checks as
 * for giving one, so nobody removes their own warnings or those of someone above them. Someone who
 * has left ranks above nobody.
 */
async function unwarnProblem(
    interaction: ButtonInteraction<"cached">,
    settings: Settings,
    id: number,
    t: Texts,
): Promise<string | undefined> {
    const userId = settings.warningUser(interaction.guildId, id);
    if (!userId) return t.unwarnNotFound(id);
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return undefined;
    const problem = moderationProblem("warn", factsFor("warn", member, interaction.member));
    return problem && problemText(t, problem, "warn", userMention(userId));
}

// A card holds 4000 characters of text and 40 components. A warning takes up to about 470
// characters (a 400-character reason, its number, date and moderator) and three components
// (section, text, button): eight fit both.
const WARNINGS_SHOWN = 8;

/** A member's warnings, newest first, each with a button that removes it. */
function warningsCard(t: Texts, settings: Settings, guildId: string, user: User): ContainerBuilder {
    const list = settings.warnings(guildId, user.id);
    const title = `${icon("warn")}${t.warningsTitle(user.displayName)}`;
    if (list.length === 0) return card(title, t.warningsNoneLeft);
    const container = card(`${title} (${list.length})`);
    for (const warning of list.slice(0, WARNINGS_SHOWN)) {
        const date = time(warning.createdAt, TimestampStyles.ShortDate);
        const by = subtext(`${t.warningBy} ${userMention(warning.moderatorId)}`);
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents((text) =>
                    text.setContent(`**#${warning.id}** · ${date} · ${warning.reason}\n${by}`),
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId(`warnings:${warning.id}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel(t.removeButton),
                ),
        );
    }
    const rest = list.length - WARNINGS_SHOWN;
    if (rest > 0)
        container.addTextDisplayComponents((text) => text.setContent(subtext(`+${rest}`)));
    return container;
}

export const warn: Command = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription(en.commandDescriptions.warn)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(targetMember)
        .addStringOption(reasonOption(true)),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);
        const target = checkedMember(interaction, "warn", t);
        if (typeof target === "string") return answer(target);

        const reason = interaction.options.getString(commandTexts.reasonName, true);
        const warning = settings.addWarning(
            interaction.guildId,
            target.id,
            interaction.user.id,
            reason,
        );
        const count = settings.warnings(interaction.guildId, target.id).length;
        // Telling the member can outlast Discord's three seconds.
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const notice = {
            action: "warn",
            guild: interaction.guild,
            reason,
            warnings: count,
        } as const;
        const told = await tellMember(target.user, t, notice);
        await interaction.editReply(t.warned(userMention(target.id), count) + untold(t, told));
        const entry = { action: "warn", userId: target.id, reason, warning } as const;
        return logModeration(interaction, settings, entry);
    },
};

export const warnings: Command = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription(en.commandDescriptions.warnings)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(targetMember),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const user = interaction.options.getUser(commandTexts.moderationMemberName, true);
        if (settings.warnings(interaction.guildId, user.id).length === 0) {
            return interaction.reply({
                content: t.warningsNone(userMention(user.id)),
                flags: MessageFlags.Ephemeral,
            });
        }
        return interaction.reply({
            components: [warningsCard(t, settings, interaction.guildId, user)],
            flags: PRIVATE_CARD,
        });
    },

    // The list is private, so only the moderator who opened it, who may moderate members, can
    // click; the rank checks still apply.
    async button(interaction, { settings }, what) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const id = Number(what);
        const problem = await unwarnProblem(interaction, settings, id, t);
        if (problem) return interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });
        const userId = settings.removeWarning(interaction.guildId, id);
        if (!userId) {
            return interaction.reply({
                content: t.unwarnNotFound(id),
                flags: MessageFlags.Ephemeral,
            });
        }
        const user = await interaction.client.users.fetch(userId);
        await interaction.update({
            components: [warningsCard(t, settings, interaction.guildId, user)],
        });
        const entry = { action: "unwarn", userId, reason: null, warning: id } as const;
        return logModeration(interaction, settings, entry);
    },
};
