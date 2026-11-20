import { SlashCommandBuilder } from "discord.js";
import { card } from "../card.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription(en.pingDescription)
        .setDescriptionLocalizations({ de: de.pingDescription }),

    async run(interaction) {
        const t = texts(interaction.locale);
        const response = await interaction.reply({ content: "🏓", withResponse: true });
        const answeredAt = response.resource?.message?.createdTimestamp ?? Date.now();
        const gateway = interaction.client.ws.ping; // -1 until the first heartbeat
        return interaction.editReply({
            content: "",
            embeds: [
                card("🏓 Pong!").addFields(
                    {
                        name: t.roundTrip,
                        value: `${answeredAt - interaction.createdTimestamp} ms`,
                        inline: true,
                    },
                    { name: "Gateway", value: gateway < 0 ? "–" : `${gateway} ms`, inline: true },
                ),
            ],
        });
    },
};
