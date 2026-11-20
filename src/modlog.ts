import {
    type ChatInputCommandInteraction,
    channelMention,
    type EmbedBuilder,
    type EmbedField,
    MessageFlags,
    TimestampStyles,
    time,
    userMention,
} from "discord.js";
import { card } from "./card.ts";
import { post } from "./channel.ts";
import type { Settings } from "./settings.ts";
import { type Texts, texts } from "./texts.ts";

/** Something a moderator did through Nexo. */
export type ModlogAction = keyof Texts["modlogTitles"];

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

/** The mod log's card. The ID stays readable once the member has left and the mention breaks. */
export function modlogCard(t: Texts, entry: ModlogEntry): EmbedBuilder {
    const fields: EmbedField[] = [
        {
            name: t.modlogMember,
            value: `${userMention(entry.userId)} · ${entry.userId}`,
            inline: true,
        },
        { name: t.modlogModerator, value: userMention(entry.moderatorId), inline: true },
    ];
    if (entry.until) {
        const until = time(entry.until, TimestampStyles.LongDateShortTime);
        fields.push({ name: t.modlogUntil, value: until, inline: true });
    }
    if (entry.warning !== undefined) {
        fields.push({ name: t.modlogWarning, value: `#${entry.warning}`, inline: true });
    }
    if (entry.reason) fields.push({ name: t.modlogReason, value: entry.reason, inline: false });
    return card(t.modlogTitles[entry.action]).addFields(fields).setTimestamp();
}

/**
 * Posts the entry in the server's mod log, if it has one, in the moderator's language. Runs after
 * the moderator's answer, so a slow log never costs Discord's three seconds to answer; when the
 * post fails, the moderator gets the reason as a private follow-up.
 */
export async function logModeration(
    interaction: ChatInputCommandInteraction<"cached">,
    settings: Settings,
    entry: Omit<ModlogEntry, "moderatorId">,
): Promise<void> {
    const channelId = settings.modlogChannel(interaction.guildId);
    if (!channelId) return;
    const t = texts(interaction.locale);
    const embed = modlogCard(t, { ...entry, moderatorId: interaction.user.id });
    const result = await post(interaction.guild, channelId, { embeds: [embed] }).catch(
        (error: unknown) => {
            console.error(`Could not post in the mod log of ${interaction.guild.name}:`, error);
            return "failed" as const;
        },
    );
    if (result === "sent") return;
    const problem =
        result === "failed"
            ? t.error
            : result === "no-channel"
              ? t.channelGone(`/modlog ${t.setupName}`)
              : t.cannotPost(
                    channelMention(channelId),
                    result.map((permission) => t.permissionNames[permission]).join(", "),
                );
    await interaction.followUp({
        content: `${t.modlogPrefix} ${problem}`,
        flags: MessageFlags.Ephemeral,
    });
}
