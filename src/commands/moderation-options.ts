import {
    type ChatInputCommandInteraction,
    escapeMarkdown,
    type Guild,
    type GuildMember,
    type SlashCommandStringOption,
    type SlashCommandUserOption,
    subtext,
    TimestampStyles,
    time,
    type User,
    userMention,
} from "discord.js";
import { CARD, card, facts } from "../card.ts";
import { icon } from "../icons.ts";
import {
    factsFor,
    type ModerationAction,
    type ModerationProblem,
    moderationProblem,
} from "../moderation.ts";
import { ICONS } from "../modlog.ts";
import { commandTexts, type Texts } from "../texts.ts";

/** The member a moderation command acts on. */
export function targetMember(option: SlashCommandUserOption): SlashCommandUserOption {
    return option
        .setName(commandTexts.moderationMemberName)
        .setDescription(commandTexts.moderationMemberDescription)
        .setRequired(true);
}

/** A user who may not be on the server (anymore), for /ban and /unban. */
export function targetUser(description: string) {
    return (option: SlashCommandUserOption): SlashCommandUserOption =>
        option.setName(commandTexts.userName).setDescription(description).setRequired(true);
}

/** The member to act on, or the refusal to show instead; all checks run before Discord is asked. */
export function checkedMember(
    interaction: ChatInputCommandInteraction<"cached">,
    action: ModerationAction,
    t: Texts,
): GuildMember | string {
    const user = interaction.options.getUser(commandTexts.moderationMemberName, true);
    const target = interaction.options.getMember(commandTexts.moderationMemberName);
    if (!target) return t.notMember(userMention(user.id));
    const problem = moderationProblem(action, factsFor(action, target, interaction.member));
    return problem ? problemText(t, problem, action, userMention(target.id)) : target;
}

/** The reason, written into the server's audit log too; only /warn needs one. */
export function reasonOption(required: boolean) {
    return (option: SlashCommandStringOption): SlashCommandStringOption =>
        option
            .setName(commandTexts.reasonName)
            .setDescription(commandTexts.reasonDescription)
            .setMaxLength(400)
            .setRequired(required);
}

/**
 * The reason for Discord's audit log, which names Nexo as the one who acted: the moderator's
 * name goes in front, so the log still says who did it.
 */
export function auditReason(moderator: GuildMember, reason: string | null): string {
    return reason ? `${moderator.user.username}: ${reason}` : moderator.user.username;
}

/** Explains a refusal in the asker's language. */
export function problemText(
    t: Texts,
    problem: ModerationProblem,
    action: ModerationAction,
    member: string,
): string {
    switch (problem) {
        case "self":
            return t.problemSelf;
        case "nexo":
            return t.problemNexo;
        case "owner":
            return t.problemOwner;
        case "above-you":
            return t.problemAboveYou(member);
        case "admin":
            return t.problemAdmin(member);
        case "no-permission": {
            // Never for a warning: Nexo only keeps it, so it needs no permission on Discord.
            const name = t.moderationPermissionNames[action as Exclude<ModerationAction, "warn">];
            return t.problemNoPermission(name);
        }
        case "above-nexo":
            return t.problemAboveNexo(member);
    }
}

/** What a member is told about a moderator's action: where, why, until when, how many warnings. */
export type MemberNotice = {
    action: ModerationAction;
    guild: Guild;
    reason: string | null;
    until?: Date;
    warnings?: number;
};

/**
 * The private card a member gets: calm, without the moderator's name, which protects them, and
 * saying that replies reach nobody.
 */
export function noticeCard(t: Texts, notice: MemberNotice) {
    const { action, guild, reason, until, warnings } = notice;
    const text = [
        facts([
            [t.modlogReason, reason ?? undefined],
            [t.modlogUntil, until && time(until, TimestampStyles.LongDateShortTime)],
            [t.dmWarnings, warnings === undefined ? undefined : String(warnings)],
        ]),
        ...(action === "kick" ? [subtext(t.dmKickNote)] : []),
        subtext(t.dmNoReply),
    ]
        .filter(Boolean)
        .join("\n");
    const title = `${icon(ICONS[action])}${t.dmTitles[action](escapeMarkdown(guild.name))}`;
    return card(title, text, { picture: guild.iconURL({ size: 256 }) ?? undefined });
}

/**
 * Tells the member privately what a moderator did, in the moderator's language: Nexo doesn't know
 * the member's. False when it didn't arrive (direct messages closed, Nexo blocked, no shared
 * server); that never stops the action.
 */
export function tellMember(user: User, t: Texts, notice: MemberNotice): Promise<boolean> {
    return user.send({ components: [noticeCard(t, notice)], flags: CARD }).then(
        () => true,
        () => false,
    );
}

/** The line the moderator's answer gets when the member could not be told. */
export function untold(t: Texts, told: boolean): string {
    return told ? "" : `\n${subtext(t.dmNotDelivered)}`;
}
