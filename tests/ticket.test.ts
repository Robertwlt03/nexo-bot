import { ComponentType } from "discord.js";
import { describe, expect, it } from "vitest";
import { closedCard, ticketCard } from "../src/commands/ticket.ts";
import { en } from "../src/texts.ts";
import { de } from "../src/translations/de.ts";
import { textOf } from "./text-of.ts";

describe("ticketCard", () => {
    it("greets the member, names the team and closes with a button", () => {
        const card = ticketCard(en, "42", "7");
        expect(textOf(card)).toBe(`## Ticket\n<@42> ${en.ticketHello}\n-# TEAM\n<@&7>`);
        const button = card.toJSON().components.at(-1);
        expect(button?.type).toBe(ComponentType.ActionRow);
    });

    it("leaves the team out when the server named none", () => {
        expect(textOf(ticketCard(de, "42"))).toBe(`## Ticket\n<@42> ${de.ticketHello}`);
    });

    it("loses its button once closed and says who closed it", () => {
        const closed = closedCard(ticketCard(en, "42").toJSON(), de, "9");
        const types = closed.toJSON().components.map(({ type }) => type);
        expect(types).not.toContain(ComponentType.ActionRow);
        expect(textOf(closed).split("\n").at(-1)).toBe(`-# ${de.ticketClosedBy("<@9>")}`);
    });
});
