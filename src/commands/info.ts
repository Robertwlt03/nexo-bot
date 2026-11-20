import {
    version as discordJsVersion,
    SlashCommandBuilder,
    TimestampStyles,
    time,
} from "discord.js";
import packageJson from "../../package.json" with { type: "json" };
import { card } from "../card.ts";
import { en, texts } from "../texts.ts";
import { de } from "../translations/de.ts";
import type { Command } from "./command.ts";

export const info: Command = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription(en.infoDescription)
        .setDescriptionLocalizations({ de: de.infoDescription }),

    run(interaction) {
        const { client } = interaction;
        const t = texts(interaction.locale);
        const onlineSince = new Date(Date.now() - (client.uptime ?? 0));
        const runtime = `Node ${process.versions.node} · discord.js ${discordJsVersion}`;
        return interaction.reply({
            embeds: [
                card(`Nexo ${packageJson.version}`)
                    .setDescription(t.tagline)
                    .setThumbnail(client.user.displayAvatarURL())
                    .addFields(
                        { name: "Server", value: String(client.guilds.cache.size), inline: true },
                        {
                            name: t.onlineSince,
                            value: time(onlineSince, TimestampStyles.RelativeTime),
                            inline: true,
                        },
                        {
                            name: t.runsOn,
                            value: runtime,
                        },
                    ),
            ],
        });
    },
};
