import {
    AuditLogEvent,
    type ContainerBuilder,
    channelMention,
    type Guild,
    type GuildAuditLogsEntry,
    MessageFlags,
    type RepliableInteraction,
    TimestampStyles,
    time,
    userMention,
} from "discord.js";
import { CARD, card, facts } from "./card.ts";
import { post } from "./channel.ts";
import { commandMention } from "./commands/mention.ts";
import { type IconName, icon } from "./icons.ts";
import type { Settings } from "./settings.ts";
import { en, type Texts, texts } from "./texts.ts";

/** Something a moderator did, through Nexo or in Discord itself. */
export type ModlogAction = keyof Texts["modlogTitles"];

/** Each action's icon; taking an action back shares one. */
const ICONS: Record<ModlogAction, IconName> = {
    warn: "warn",
    timeout: "timeout",
    kick: "leave",
    ban: "ban",
    unwarn: "undo",
    untimeout: "undo",
    unban: "undo",
};

export type ModlogEntry = {
    action: ModlogAction;
    userId: string;
    moderatorId: string;
    reason: string | null;
    /** When a timeout ends. */
    until?: Date;
    /** The number of the warning given or removed. */
    warning?: number;
};

/**
 * The mod log's card. The ID stays readable once the member has left and the mention breaks.
 * Discord shows when it was posted, so the card doesn't.
 */
export function modlogCard(t: Texts, entry: ModlogEntry): ContainerBuilder {
    const text = facts([
        [t.modlogMember, `${userMention(entry.userId)} · ${entry.userId}`],
        [t.modlogModerator, userMention(entry.moderatorId)],
        [t.modlogUntil, entry.until && time(entry.until, TimestampStyles.LongDateShortTime)],
        [t.modlogWarning, entry.warning === undefined ? undefined : `#${entry.warning}`],
        [t.modlogReason, entry.reason ?? undefined],
    ]);
    return card(`${icon(ICONS[entry.action])}${t.modlogTitles[entry.action]}`, text);
}

/**
 * Posts the entry in the server's mod log, if it has one, in the moderator's language. Runs after
 * the moderator's answer, so a slow log never costs Discord's three seconds to answer; when the
 * post fails, the moderator gets the reason as a private follow-up.
 */
export async function logModeration(
    interaction: RepliableInteraction<"cached">,
    settings: Settings,
    entry: Omit<ModlogEntry, "moderatorId">,
): Promise<void> {
    const channelId = settings.modlog(interaction.guildId)?.channelId;
    if (!channelId) return;
    const t = texts(interaction.locale);
    const logged = modlogCard(t, { ...entry, moderatorId: interaction.user.id });
    const result = await post(interaction.guild, channelId, {
        components: [logged],
        flags: CARD,
    }).catch((error: unknown) => {
        console.error(`Could not post in the mod log of ${interaction.guild.name}:`, error);
        return "failed" as const;
    });
    if (result === "sent") return;
    const problem =
        result === "failed"
            ? t.error
            : result === "no-channel"
              ? t.channelGone(commandMention("modlog", en.setupName))
              : t.cannotPost(
                    channelMention(channelId),
                    result.map((permission) => t.permissionNames[permission]).join(", "),
                );
    await interaction.followUp({
        content: `${t.modlogPrefix} ${problem}`,
        flags: MessageFlags.Ephemeral,
    });
}

/**
 * What an entry of Discord's audit log means for the mod log: a kick, a ban, a lifted ban, or a
 * timeout given or ended. Undefined for everything else, such as a nickname change.
 */
export function auditModlogEntry(entry: GuildAuditLogsEntry): ModlogEntry | undefined {
    const { targetId: userId, executorId: moderatorId, reason } = entry;
    if (!userId || !moderatorId) return undefined;
    // What every logged entry has; the action and a timeout's end are added below.
    const shared = { userId, moderatorId, reason };
    switch (entry.action) {
        case AuditLogEvent.MemberKick:
            return { ...shared, action: "kick" };
        case AuditLogEvent.MemberBanAdd:
            return { ...shared, action: "ban" };
        case AuditLogEvent.MemberBanRemove:
            return { ...shared, action: "unban" };
        case AuditLogEvent.MemberUpdate: {
            const timeout = entry.changes.find(
                (change) => change.key === "communication_disabled_until",
            );
            if (!timeout) return undefined;
            return timeout.new
                ? { ...shared, action: "timeout", until: new Date(timeout.new) }
                : { ...shared, action: "untimeout" };
        }
        default:
            return undefined;
    }
}

/**
 * Logs what a moderator did in Discord itself, from the server's audit log, in the language of
 * whoever set up the mod log. What Nexo did is skipped: its commands log themselves, with the
 * moderator who used them. Nobody waits for an answer, so a failed post only goes to the console.
 */
export async function logAuditEntry(
    entry: GuildAuditLogsEntry,
    guild: Guild,
    settings: Settings,
): Promise<void> {
    const modlog = settings.modlog(guild.id);
    if (!modlog || entry.executorId === guild.client.user.id) return;
    const logged = auditModlogEntry(entry);
    if (!logged) return;
    const card = modlogCard(texts(modlog.locale), logged);
    const result = await post(guild, modlog.channelId, { components: [card], flags: CARD });
    if (result !== "sent") console.error(`Could not post in the mod log of ${guild.name}:`, result);
}
