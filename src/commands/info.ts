import { ButtonBuilder, ButtonStyle, SlashCommandBuilder, TimestampStyles, time } from "discord.js";
import { CARD, card, facts } from "../card.ts";
import { iconButton } from "../icons.ts";
import { en, texts } from "../texts.ts";
import type { Command } from "./command.ts";

export const info: Command = {
    data: new SlashCommandBuilder().setName("info").setDescription(en.commandDescriptions.info),

    run(interaction) {
        const { client } = interaction;
        const t = texts(interaction.locale);
        const onlineSince = new Date(Date.now() - (client.uptime ?? 0));
        const ping = client.ws.ping; // -1 until the first heartbeat
        const numbers = facts([
            [t.connection, ping < 0 ? undefined : `${ping} ms`],
            [t.onlineSince, time(onlineSince, TimestampStyles.RelativeTime)],
        ]);
        // Discord's own install link: the scopes and permissions are set in the Developer Portal.
        // ponytail: buttons for the support server, privacy page and GitHub come once they exist.
        const add = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}`)
            .setLabel(t.infoAddButton);
        const shown = card("Nexo", t.tagline, { picture: client.user.displayAvatarURL() })
            .addSeparatorComponents((line) => line)
            .addTextDisplayComponents((text) => text.setContent(numbers))
            .addActionRowComponents((row) => row.addComponents(iconButton(add, "add")));
        return interaction.reply({ components: [shown], flags: CARD });
    },
};
