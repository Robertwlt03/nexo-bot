import {
    type ChatInputCommandInteraction,
    type GuildMember,
    type SlashCommandStringOption,
    type SlashCommandUserOption,
    userMention,
} from "discord.js";
import {
    factsFor,
    type ModerationAction,
    type ModerationProblem,
    moderationProblem,
} from "../moderation.ts";
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
