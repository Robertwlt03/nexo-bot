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
        // "Nexo is thinking…" first, then the card: the first edit of a deferred answer completes
        // it, so Discord marks nothing as edited, unlike a written answer replaced afterwards.
        await interaction.deferReply();
        // Discord sends no message back for a deferred answer, so it is fetched: both times then
        // come from Discord's clock, and this computer's clock cannot skew the round trip.
        const thinking = await interaction.fetchReply();
        const roundTrip = thinking.createdTimestamp - interaction.createdTimestamp;
        const gateway = interaction.client.ws.ping; // -1 until the first heartbeat
        return interaction.editReply({
            embeds: [
                card("🏓 Pong!").addFields(
                    { name: t.roundTrip, value: `${roundTrip} ms`, inline: true },
                    { name: "Gateway", value: gateway < 0 ? "–" : `${gateway} ms`, inline: true },
                ),
            ],
        });
    },
};
