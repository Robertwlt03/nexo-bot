import {
    type APIApplicationCommandOption,
    type ChatInputCommandInteraction,
    type EmbedBuilder,
    Locale,
} from "discord.js";
import { describe, expect, it } from "vitest";
import { commands } from "../src/commands/index.ts";
import { openSettings } from "../src/settings.ts";
import { en, texts } from "../src/texts.ts";
import { de } from "../src/translations/de.ts";

describe("commands", () => {
    const definitions = commands.map(({ data }) => data.toJSON());

    it("have unique names and a German description beside the English one", () => {
        expect(new Set(definitions.map(({ name }) => name)).size).toBe(definitions.length);
        for (const { name, description, description_localizations } of definitions) {
            expect(name).toMatch(/^[a-z]+$/);
            expect(description).not.toBe("");
            expect(
                description_localizations?.de,
                `/${name} has no German description`,
            ).toBeTruthy();
        }
    });

    it("name and describe every option in German too", () => {
        // Subcommands are options too, and their own options sit inside them.
        const nested = (
            list: readonly APIApplicationCommandOption[],
        ): APIApplicationCommandOption[] =>
            list.flatMap((option) => [
                option,
                ...nested("options" in option ? (option.options ?? []) : []),
            ]);
        const options = nested(definitions.flatMap((definition) => definition.options ?? []));
        expect(options.length).toBeGreaterThan(0);
        for (const option of options) {
            expect(option.name_localizations?.de, `${option.name} has no German name`).toBeTruthy();
            expect(
                option.description_localizations?.de,
                `${option.name}: no German text`,
            ).toBeTruthy();
        }
    });

    it("are all listed by /help, in the asker's language", async () => {
        const help = commands.find(({ data }) => data.name === "help");
        const replies: { embeds: EmbedBuilder[] }[] = [];
        const interaction = {
            locale: Locale.German,
            reply: async (answer: { embeds: EmbedBuilder[] }) => replies.push(answer),
        } as unknown as ChatInputCommandInteraction;

        await help?.run(interaction, { settings: openSettings(":memory:") });

        const listing = replies[0]?.embeds[0]?.data.description ?? "";
        for (const { name, description_localizations } of definitions) {
            expect(listing).toContain(`/${name}\` ${description_localizations?.de}`);
        }
    });
});

describe("texts", () => {
    it("answers German clients in German and everyone else in English", () => {
        expect(texts(Locale.German)).toBe(de);
        expect(texts(Locale.EnglishUS)).toBe(en);
        expect(texts(Locale.French)).toBe(en);
    });
});
