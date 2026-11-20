import {
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TimestampStyles,
    time,
    userMention,
} from "discord.js";
import { card } from "../card.ts";
import { firstWithRest } from "../format.ts";
import { logModeration } from "../modlog.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { checkedMember, reasonOption, targetMember } from "./moderation-options.ts";

const WARNINGS_SHOWN = 10; // a card holds 4096 characters; ten warnings with long reasons fit

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
        const list = settings.warnings(interaction.guildId, user.id);
        if (list.length === 0) {
            return interaction.reply({
                content: t.warningsNone(userMention(user.id)),
                flags: MessageFlags.Ephemeral,
            });
        }
        const lines = list.map(
            (warning) =>
                `**#${warning.id}** · ${time(warning.createdAt, TimestampStyles.ShortDate)} · ` +
                `${warning.reason} · ${t.warningBy} ${userMention(warning.moderatorId)}`,
        );
        return interaction.reply({
            embeds: [
                card(`${t.warningsTitle(user.displayName)} (${list.length})`).setDescription(
                    firstWithRest(lines, WARNINGS_SHOWN, "\n"),
                ),
            ],
            flags: MessageFlags.Ephemeral,
        });
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
