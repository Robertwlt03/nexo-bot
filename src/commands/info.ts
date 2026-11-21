import {
    version as discordJsVersion,
    SlashCommandBuilder,
    subtext,
    TimestampStyles,
    time,
} from "discord.js";
import packageJson from "../../package.json" with { type: "json" };
import { CARD, card, facts } from "../card.ts";
import { en, texts } from "../texts.ts";
import type { Command } from "./command.ts";

export const info: Command = {
    data: new SlashCommandBuilder().setName("info").setDescription(en.commandDescriptions.info),

    run(interaction) {
        const { client } = interaction;
        const t = texts(interaction.locale);
        const onlineSince = new Date(Date.now() - (client.uptime ?? 0));
        const numbers = [
            facts([
                ["Server", String(client.guilds.cache.size)],
                [t.onlineSince, time(onlineSince, TimestampStyles.RelativeTime)],
            ]),
            subtext(`${t.runsOn} Node ${process.versions.node} · discord.js ${discordJsVersion}`),
        ].join("\n");
        const shown = card(`Nexo ${packageJson.version}`, t.tagline, {
            picture: client.user.displayAvatarURL(),
        })
            .addSeparatorComponents((line) => line)
            .addTextDisplayComponents((text) => text.setContent(numbers));
        return interaction.reply({ components: [shown], flags: CARD });
    },
};
