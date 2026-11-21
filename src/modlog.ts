import {
    type ContainerBuilder,
    channelMention,
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

/** Something a moderator did through Nexo. */
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
    const channelId = settings.modlogChannel(interaction.guildId);
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
