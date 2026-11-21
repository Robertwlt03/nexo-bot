import {
    type APIApplicationCommandOption,
    type ChatInputCommandInteraction,
    type ContainerBuilder,
    Locale,
} from "discord.js";
import { describe, expect, it } from "vitest";
import { commands } from "../src/commands/index.ts";
import { openSettings } from "../src/settings.ts";
import { en, texts } from "../src/texts.ts";
import { de } from "../src/translations/de.ts";

describe("commands", () => {
    const definitions = commands.map(({ data }) => data.toJSON());

    it("have unique names and say what they do in every language", () => {
        expect(new Set(definitions.map(({ name }) => name)).size).toBe(definitions.length);
        for (const { name, description } of definitions) {
            expect(name).toMatch(/^[a-z]+$/);
            expect(description).toBe(
                en.commandDescriptions[name as keyof typeof en.commandDescriptions],
            );
            expect(Object.keys(de.commandDescriptions), `/${name} has no German text`).toContain(
                name,
            );
        }
    });

    it("show Discord the same English names and descriptions for everyone", () => {
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
        for (const item of [...definitions, ...options]) {
            expect(item.name_localizations, `${item.name} has a translated name`).toBeUndefined();
            expect(item.description_localizations, `${item.name}: translated`).toBeUndefined();
        }
    });

    it("are all listed by /help, in the asker's language", async () => {
        const help = commands.find(({ data }) => data.name === "help");
        const replies: { components: ContainerBuilder[] }[] = [];
        const interaction = {
            locale: Locale.German,
            reply: async (answer: { components: ContainerBuilder[] }) => replies.push(answer),
        } as unknown as ChatInputCommandInteraction;

        await help?.run(interaction, { settings: openSettings(":memory:") });

        const listing = JSON.stringify(replies[0]?.components[0]?.toJSON());
        for (const { name } of definitions) {
            // Before Discord gives the IDs, a command shows as code instead of a clickable mention.
            expect(listing).toContain(`/${name}`);
            const said = de.commandDescriptions[name as keyof typeof de.commandDescriptions];
            expect(listing).toContain(`\` ${said}`);
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
