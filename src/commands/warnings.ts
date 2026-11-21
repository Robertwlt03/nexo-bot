import {
    ButtonBuilder,
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
import { logModeration } from "../modlog.ts";
import type { Settings } from "../settings.ts";
import { en, type Texts, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { checkedMember, reasonOption, targetMember } from "./moderation-options.ts";

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
        .setDescription(en.warnDescription)
        .setDescriptionLocalizations({ de: de.warnDescription })
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

        const reason = interaction.options.getString(en.reasonName, true);
        const warning = settings.addWarning(
            interaction.guildId,
            target.id,
            interaction.user.id,
            reason,
        );
        const count = settings.warnings(interaction.guildId, target.id).length;
        await answer(t.warned(userMention(target.id), count));
        const entry = { action: "warn", userId: target.id, reason, warning } as const;
        return logModeration(interaction, settings, entry);
    },
};

export const warnings: Command = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription(en.warningsDescription)
        .setDescriptionLocalizations({ de: de.warningsDescription })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(targetMember),

    run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const user = interaction.options.getUser(en.moderationMemberName, true);
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

    // ponytail: the list is private, so only the moderator who opened it can click; it trusts
    // them with /unwarn too. Check the permission here if a server gives the two commands apart.
    async button(interaction, { settings }, what) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        const id = Number(what);
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

export const unwarn: Command = {
    data: new SlashCommandBuilder()
        .setName("unwarn")
        .setDescription(en.unwarnDescription)
        .setDescriptionLocalizations({ de: de.unwarnDescription })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption((number) =>
            number
                .setName(en.numberName)
                .setNameLocalizations({ de: de.numberName })
                .setDescription(en.numberDescription)
                .setDescriptionLocalizations({ de: de.numberDescription })
                .setMinValue(1)
                .setRequired(true),
        ),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);
        const id = interaction.options.getInteger(en.numberName, true);
        const userId = settings.removeWarning(interaction.guildId, id);
        if (!userId) return answer(t.unwarnNotFound(id));
        await answer(t.unwarned(id));
        const entry = { action: "unwarn", userId, reason: null, warning: id } as const;
        return logModeration(interaction, settings, entry);
    },
};
