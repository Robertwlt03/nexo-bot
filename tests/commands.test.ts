import {
    type APIApplicationCommandOption,
    type ChatInputCommandInteraction,
    type ContainerBuilder,
    Locale,
    MessageFlags,
    PermissionsBitField,
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

    /** /help's private answer for someone with the given permissions, as JSON. */
    async function helpFor(permissions: PermissionsBitField) {
        const help = commands.find(({ data }) => data.name === "help");
        const replies: { components: ContainerBuilder[]; flags: number }[] = [];
        const interaction = {
            locale: Locale.German,
            memberPermissions: permissions,
            reply: async (answer: (typeof replies)[number]) => replies.push(answer),
        } as unknown as ChatInputCommandInteraction;
        await help?.run(interaction, { settings: openSettings(":memory:") });
        const [answer] = replies;
        return { listing: JSON.stringify(answer?.components[0]?.toJSON()), flags: answer?.flags };
    }

    it("are all listed by /help for an admin, in the asker's language", async () => {
        const { listing } = await helpFor(new PermissionsBitField(PermissionsBitField.All));
        for (const { name } of definitions) {
            // Before Discord gives the IDs, a command shows as code instead of a clickable mention.
            expect(listing).toContain(`/${name}`);
            const said = de.commandDescriptions[name as keyof typeof de.commandDescriptions];
            expect(listing).toContain(`\` ${said}`);
        }
    });

    it("are listed for a member only as far as they may use them, privately", async () => {
        const { listing, flags } = await helpFor(new PermissionsBitField());
        expect(listing).toContain("/rank");
        expect(listing).not.toContain("/warn");
        expect(listing).not.toContain("/ticket");
        expect(Number(flags) & MessageFlags.Ephemeral).toBeTruthy();
    });
});

describe("texts", () => {
    it("answers German clients in German and everyone else in English", () => {
        expect(texts(Locale.German)).toBe(de);
        expect(texts(Locale.EnglishUS)).toBe(en);
        expect(texts(Locale.French)).toBe(en);
    });
});
