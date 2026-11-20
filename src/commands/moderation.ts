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
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
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

/** The parts every moderation command shares: name, descriptions, server only, who sees it. */
function moderationCommand(name: string, descriptions: [string, string], permission: bigint) {
    return new SlashCommandBuilder()
        .setName(name)
        .setDescription(descriptions[0])
        .setDescriptionLocalizations({ de: descriptions[1] })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(permission);
}

export const timeout: Command = {
    data: moderationCommand(
        "timeout",
        [en.timeoutDescription, de.timeoutDescription],
        PermissionFlagsBits.ModerateMembers,
    )
        .addUserOption(targetMember)
        .addIntegerOption((duration) =>
            duration
                .setName(en.durationName)
                .setNameLocalizations({ de: de.durationName })
                .setDescription(en.durationDescription)
                .setDescriptionLocalizations({ de: de.durationDescription })
                .setRequired(true)
                .addChoices(
                    en.durations.map(({ name, minutes }, index) => ({
                        name,
                        name_localizations: { de: de.durations[index]?.name ?? name },
                        value: minutes,
                    })),
                ),
        )
        .addStringOption(reasonOption(false)),

    async run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const target = checkedMember(interaction, "timeout", t);
        if (typeof target === "string") return answer(interaction, target);
        const minutes = interaction.options.getInteger(en.durationName, true);
        const reason = interaction.options.getString(en.reasonName);
        await target.timeout(minutes * MINUTE, auditReason(interaction.member, reason));
        const until = new Date(Date.now() + minutes * MINUTE);
        return answer(
            interaction,
            t.timedOut(userMention(target.id), time(until, TimestampStyles.LongDateShortTime)),
        );
    },
};

export const untimeout: Command = {
    data: moderationCommand(
        "untimeout",
        [en.untimeoutDescription, de.untimeoutDescription],
        PermissionFlagsBits.ModerateMembers,
    )
        .addUserOption(targetMember)
        .addStringOption(reasonOption(false)),

    async run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const target = checkedMember(interaction, "timeout", t);
        if (typeof target === "string") return answer(interaction, target);
        if (!target.isCommunicationDisabled()) {
            return answer(interaction, t.notTimedOut(userMention(target.id)));
        }
        const reason = interaction.options.getString(en.reasonName);
        await target.timeout(null, auditReason(interaction.member, reason));
        return answer(interaction, t.untimedOut(userMention(target.id)));
    },
};

export const kick: Command = {
    data: moderationCommand(
        "kick",
        [en.kickDescription, de.kickDescription],
        PermissionFlagsBits.KickMembers,
    )
        .addUserOption(targetMember)
        .addStringOption(reasonOption(false)),

    async run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const target = checkedMember(interaction, "kick", t);
        if (typeof target === "string") return answer(interaction, target);
        const reason = interaction.options.getString(en.reasonName);
        await target.kick(auditReason(interaction.member, reason));
        return answer(interaction, t.kicked(userMention(target.id)));
    },
};

export const ban: Command = {
    data: moderationCommand(
        "ban",
        [en.banDescription, de.banDescription],
        PermissionFlagsBits.BanMembers,
    )
        .addUserOption(targetUser([en.moderationMemberDescription, de.moderationMemberDescription]))
        .addStringOption(reasonOption(false)),

    async run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const { guild, member: moderator } = interaction;
        const user = interaction.options.getUser(en.userName, true);
        const target = interaction.options.getMember(en.userName);
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
        const reason = interaction.options.getString(en.reasonName);
        await guild.members.ban(user, { reason: auditReason(moderator, reason) });
        return answer(interaction, t.banned(userMention(user.id)));
    },
};

export const unban: Command = {
    data: moderationCommand(
        "unban",
        [en.unbanDescription, de.unbanDescription],
        PermissionFlagsBits.BanMembers,
    )
        .addUserOption(targetUser([en.unbanUserDescription, de.unbanUserDescription]))
        .addStringOption(reasonOption(false)),

    async run(interaction) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) return answer(interaction, t.serverOnly);
        const { guild } = interaction;
        if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
            return answer(interaction, t.problemNoPermission(t.moderationPermissionNames.ban));
        }
        const user = interaction.options.getUser(en.userName, true);
        // Discord answers "unknown ban" for someone who is not banned; anything else is an error.
        const existing = await guild.bans.fetch(user).catch((error: { code?: unknown }) => {
            if (error.code === RESTJSONErrorCodes.UnknownBan) return null;
            throw error;
        });
        if (!existing) return answer(interaction, t.notBanned(userMention(user.id)));
        const reason = interaction.options.getString(en.reasonName);
        await guild.bans.remove(user, auditReason(interaction.member, reason));
        return answer(interaction, t.unbanned(userMention(user.id)));
    },
};
