import {
    type ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    RESTJSONErrorCodes,
    SlashCommandBuilder,
    TimestampStyles,
    time,
    userMention,
} from "discord.js";
import { factsFor, moderationProblem } from "../moderation.ts";
import { logModeration } from "../modlog.ts";
import { commandTexts, en, texts } from "../texts.ts";
import type { Command } from "./command.ts";
import {
    auditReason,
    checkedMember,
    problemText,
    reasonOption,
    targetMember,
    targetUser,
} from "./moderation-options.ts";

const MINUTE = 60_000;

/** A private answer to the moderator; the member is not told. */
function answer(interaction: ChatInputCommandInteraction, content: string) {
    return interaction.reply({ content, flags: MessageFlags.Ephemeral });
}

/** The parts every moderation command shares: name, description, server only, who sees it. */
function moderationCommand(name: string, description: string, permission: bigint) {
    return new SlashCommandBuilder()
        .setName(name)
        .setDescription(description)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(permission);
}

export const timeout: Command = {
    data: moderationCommand(
        "timeout",
        en.commandDescriptions.timeout,
        PermissionFlagsBits.ModerateMembers,
    )
        .addUserOption(targetMember)
        .addIntegerOption((duration) =>
            duration
                .setName(commandTexts.durationName)
                .setDescription(commandTexts.durationDescription)
                .setRequired(true)
                .addChoices(
                    commandTexts.durations.map(({ name, minutes }) => ({
                        name,
                        value: minutes,
                    })),
                ),
        )
        .addStringOption(reasonOption(false)),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const target = checkedMember(interaction, "timeout", t);
        if (typeof target === "string") return answer(interaction, target);
        const minutes = interaction.options.getInteger(commandTexts.durationName, true);
        const reason = interaction.options.getString(commandTexts.reasonName);
        await target.timeout(minutes * MINUTE, auditReason(interaction.member, reason));
        const until = new Date(Date.now() + minutes * MINUTE);
        const shown = time(until, TimestampStyles.LongDateShortTime);
        await answer(interaction, t.timedOut(userMention(target.id), shown));
        const entry = { action: "timeout", userId: target.id, reason, until } as const;
        return logModeration(interaction, settings, entry);
    },
};

export const untimeout: Command = {
    data: moderationCommand(
        "untimeout",
        en.commandDescriptions.untimeout,
        PermissionFlagsBits.ModerateMembers,
    )
        .addUserOption(targetMember)
        .addStringOption(reasonOption(false)),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const target = checkedMember(interaction, "timeout", t);
        if (typeof target === "string") return answer(interaction, target);
        if (!target.isCommunicationDisabled()) {
            return answer(interaction, t.notTimedOut(userMention(target.id)));
        }
        const reason = interaction.options.getString(commandTexts.reasonName);
        await target.timeout(null, auditReason(interaction.member, reason));
        await answer(interaction, t.untimedOut(userMention(target.id)));
        const entry = { action: "untimeout", userId: target.id, reason } as const;
        return logModeration(interaction, settings, entry);
    },
};

export const kick: Command = {
    data: moderationCommand("kick", en.commandDescriptions.kick, PermissionFlagsBits.KickMembers)
        .addUserOption(targetMember)
        .addStringOption(reasonOption(false)),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const target = checkedMember(interaction, "kick", t);
        if (typeof target === "string") return answer(interaction, target);
        const reason = interaction.options.getString(commandTexts.reasonName);
        await target.kick(auditReason(interaction.member, reason));
        await answer(interaction, t.kicked(userMention(target.id)));
        const entry = { action: "kick", userId: target.id, reason } as const;
        return logModeration(interaction, settings, entry);
    },
};

export const ban: Command = {
    data: moderationCommand("ban", en.commandDescriptions.ban, PermissionFlagsBits.BanMembers)
        .addUserOption(targetUser(commandTexts.moderationMemberDescription))
        .addStringOption(reasonOption(false)),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const { guild, member: moderator } = interaction;
        const user = interaction.options.getUser(commandTexts.userName, true);
        const target = interaction.options.getMember(commandTexts.userName);
        // Someone who is not on the server can be banned too, so they can't join; then only
        // the checks that need no member apply.
        const facts = target
            ? factsFor("ban", target, moderator)
            : {
                  targetId: user.id,
                  moderatorId: moderator.id,
                  nexoId: interaction.client.user.id,
                  ownerId: guild.ownerId,
                  moderatorAboveTarget: true,
                  targetIsAdmin: false,
                  nexoHasPermission:
                      guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers) ?? false,
                  nexoAboveTarget: true,
              };
        const problem = moderationProblem("ban", facts);
        if (problem)
            return answer(interaction, problemText(t, problem, "ban", userMention(user.id)));
        const reason = interaction.options.getString(commandTexts.reasonName);
        await guild.members.ban(user, { reason: auditReason(moderator, reason) });
        await answer(interaction, t.banned(userMention(user.id)));
        const entry = { action: "ban", userId: user.id, reason } as const;
        return logModeration(interaction, settings, entry);
    },
};

export const unban: Command = {
    data: moderationCommand("unban", en.commandDescriptions.unban, PermissionFlagsBits.BanMembers)
        .addUserOption(targetUser(commandTexts.unbanUserDescription))
        .addStringOption(reasonOption(false)),

    async run(interaction, { settings }) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const { guild } = interaction;
        if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
            return answer(interaction, t.problemNoPermission(t.moderationPermissionNames.ban));
        }
        const user = interaction.options.getUser(commandTexts.userName, true);
        // Discord answers "unknown ban" for someone who is not banned; anything else is an error.
        const existing = await guild.bans.fetch(user).catch((error: { code?: unknown }) => {
            if (error.code === RESTJSONErrorCodes.UnknownBan) return null;
            throw error;
        });
        if (!existing) return answer(interaction, t.notBanned(userMention(user.id)));
        const reason = interaction.options.getString(commandTexts.reasonName);
        await guild.bans.remove(user, auditReason(interaction.member, reason));
        await answer(interaction, t.unbanned(userMention(user.id)));
        const entry = { action: "unban", userId: user.id, reason } as const;
        return logModeration(interaction, settings, entry);
    },
};
