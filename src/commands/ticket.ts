import {
    type APIContainerComponent,
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ComponentType,
    ContainerBuilder,
    channelMention,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    roleMention,
    SlashCommandBuilder,
    subtext,
    type TextChannel,
    ThreadAutoArchiveDuration,
    userMention,
} from "discord.js";
import { CARD, card, facts } from "../card.ts";
import { type ChannelPermission, missingPermissions, TICKET_PERMISSIONS } from "../channel.ts";
import { icon } from "../icons.ts";
import type { Settings } from "../settings.ts";
import { en, type Texts, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";
import { localized } from "./localized.ts";

/** The first message of a ticket: whom it is for, who answers, and the button that closes it. */
export function ticketCard(t: Texts, userId: string, teamId?: string): ContainerBuilder {
    const team = teamId ? `\n${facts([[t.ticketTeam, roleMention(teamId)]])}` : "";
    return card(
        `${icon("ticket")}${t.ticketTitle}`,
        `${userMention(userId)} ${t.ticketHello}${team}`,
    ).addActionRowComponents((row) =>
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("ticket:close")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(t.ticketCloseButton),
        ),
    );
}

/**
 * The ticket card once it is closed: the same card without its button, and who closed it below.
 */
export function closedCard(shown: APIContainerComponent, t: Texts, closerId: string) {
    const components = shown.components.filter(({ type }) => type !== ComponentType.ActionRow);
    return new ContainerBuilder({ ...shown, components }).addTextDisplayComponents((text) =>
        text.setContent(subtext(`${icon("closed")}${t.ticketClosedBy(userMention(closerId))}`)),
    );
}

/** Members whose ticket is being opened, as "server:member": a double click opens one. */
const opening = new Set<string>();

/**
 * Opens a ticket for the member who clicked the panel's button: a private thread in the panel's
 * channel that only they, the team and those who may manage threads see. A member with an open
 * ticket is pointed to it instead.
 */
async function openTicket(
    interaction: ButtonInteraction<"cached">,
    settings: Settings,
    t: Texts,
    teamId: string | undefined,
) {
    const channel = interaction.channel;
    if (channel?.type !== ChannelType.GuildText)
        throw new Error("A ticket panel outside a text channel");
    const { guildId, user } = interaction;
    const key = `${guildId}:${user.id}`;
    if (opening.has(key)) return interaction.deferUpdate();
    opening.add(key);
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        return await createTicket(interaction, channel, settings, t, teamId);
    } finally {
        opening.delete(key);
    }
}

/** The thread of an open ticket, or a new one; closing locks it, so unlocked means open. */
async function createTicket(
    interaction: ButtonInteraction<"cached">,
    channel: TextChannel,
    settings: Settings,
    t: Texts,
    teamId: string | undefined,
) {
    const { guildId, user } = interaction;
    const openId = settings.ticket(guildId, user.id);
    const open = openId && (await channel.threads.fetch(openId).catch(() => null));
    if (open && !open.locked) {
        // Discord archives a thread nobody wrote in for a week; the ticket is still open.
        if (open.archived) await open.setArchived(false);
        // A member who left their ticket's thread no longer sees it; this lets them back in.
        await open.members.add(user.id);
        return interaction.editReply(t.ticketAlreadyOpen(channelMention(open.id)));
    }
    const thread = await channel.threads.create({
        name: interaction.member.displayName,
        type: ChannelType.PrivateThread,
        invitable: false,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
    settings.saveTicket(guildId, user.id, thread.id);
    await thread.members.add(user.id);
    // Mentioning the team's role in a private thread adds its members, as long as the role has
    // fewer than 100 (a Discord limit).
    await thread.send({
        components: [ticketCard(t, user.id, teamId)],
        flags: CARD,
        allowedMentions: { users: [user.id], roles: teamId ? [teamId] : [] },
    });
    return interaction.editReply(t.ticketOpened(channelMention(thread.id)));
}

/** /ticket: posts the button members open a private ticket with. */
export const ticket: Command = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription(en.ticketDescription)
        .setDescriptionLocalizations({ de: de.ticketDescription })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((setup) =>
            localized(
                setup,
                [en.setupName, de.setupName],
                [en.ticketSetupDescription, de.ticketSetupDescription],
            )
                .addChannelOption((channel) =>
                    channel
                        .setName(en.channelName)
                        .setNameLocalizations({ de: de.channelName })
                        .setDescription(en.ticketChannelDescription)
                        .setDescriptionLocalizations({ de: de.ticketChannelDescription })
                        // Only a text channel can hold private threads.
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true),
                )
                .addRoleOption((team) =>
                    team
                        .setName(en.ticketTeamName)
                        .setNameLocalizations({ de: de.ticketTeamName })
                        .setDescription(en.ticketTeamDescription)
                        .setDescriptionLocalizations({ de: de.ticketTeamDescription }),
                )
                .addStringOption((message) =>
                    message
                        .setName(en.greetingMessageName)
                        .setNameLocalizations({ de: de.greetingMessageName })
                        .setDescription(en.ticketMessageDescription)
                        .setDescriptionLocalizations({ de: de.ticketMessageDescription })
                        .setMaxLength(1000),
                ),
        ),

    async run(interaction) {
        const t = texts(interaction.locale);
        const answer = (content: string) =>
            interaction.reply({ content, flags: MessageFlags.Ephemeral });
        if (!interaction.inCachedGuild()) return answer(t.serverOnly);

        const channel = interaction.options.getChannel(en.channelName, true, [
            ChannelType.GuildText,
        ]);
        const team = interaction.options.getRole(en.ticketTeamName);
        // Nexo mentions the team in every ticket, so only for someone who could mention it too.
        if (
            team &&
            !team.mentionable &&
            !interaction.memberPermissions.has(PermissionFlagsBits.MentionEveryone)
        ) {
            return answer(t.ticketTeamNotMentionable(roleMention(team.id)));
        }
        // Nexo can mention a role that isn't mentionable only with this permission.
        const needed: ChannelPermission[] =
            team && !team.mentionable
                ? [...TICKET_PERMISSIONS, "MentionEveryone"]
                : [...TICKET_PERMISSIONS];
        const missing = missingPermissions(channel, needed);
        if (missing.length > 0) {
            const names = missing.map((permission) => t.permissionNames[permission]).join(", ");
            return answer(t.ticketCannotRun(channelMention(channel.id), names));
        }
        const text = interaction.options.getString(en.greetingMessageName) ?? t.ticketPanelText;
        const panel = card(`${icon("ticket")}${t.ticketPanelTitle}`, text).addActionRowComponents(
            (row) =>
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(team ? `ticket:open:${team.id}` : "ticket:open")
                        .setStyle(ButtonStyle.Primary)
                        .setLabel(t.ticketOpenButton),
                ),
        );
        await channel.send({ components: [panel], flags: CARD });
        return answer(t.ticketSetUp(channelMention(channel.id)));
    },

    async button(interaction, { settings }, what) {
        const t = texts(interaction.locale);
        if (!interaction.inCachedGuild()) {
            return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
        }
        // The panel's button is "open" or, with a team, "open:<role ID>".
        const [action, teamId] = what.split(":");
        if (action === "open") return openTicket(interaction, settings, t, teamId);
        // Close: only the member, the team and those who may manage threads are in the thread,
        // so whoever can click may close it.
        const thread = interaction.channel;
        if (!thread?.isThread()) throw new Error("A ticket's close button outside a thread");
        // Locked first: if that fails, the ticket stays open as it was.
        await thread.setLocked(true);
        settings.closeTicket(thread.id);
        const shown = interaction.message.components[0]?.toJSON() as APIContainerComponent;
        await interaction.update({ components: [closedCard(shown, t, interaction.user.id)] });
        return thread.setArchived(true);
    },
};
