import { type ButtonInteraction, ChannelType, ComponentType, Locale } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { closedCard, ticket, ticketCard } from "../src/commands/ticket.ts";
import { openSettings } from "../src/settings.ts";
import { en } from "../src/texts.ts";
import { de } from "../src/translations/de.ts";
import { textOf } from "./text-of.ts";

describe("ticketCard", () => {
    it("greets the member, names the team and closes with a button", () => {
        const card = ticketCard(en, "42", "7");
        expect(textOf(card)).toBe(`## Ticket\n${en.ticketHello("<@42>")}\n-# TEAM\n<@&7>`);
        const button = card.toJSON().components.at(-1);
        expect(button?.type).toBe(ComponentType.ActionRow);
    });

    it("leaves the team out when the server named none", () => {
        expect(textOf(ticketCard(de, "42"))).toBe(`## Ticket\n${de.ticketHello("<@42>")}`);
    });

    it("loses its button once closed and says who closed it", () => {
        const closed = closedCard(ticketCard(en, "42").toJSON(), de, "9");
        const types = closed.toJSON().components.map(({ type }) => type);
        expect(types).not.toContain(ComponentType.ActionRow);
        expect(textOf(closed).split("\n").at(-1)).toBe(`-# ${de.ticketClosedBy("<@9>")}`);
    });
});

/** A member clicking "Open a ticket" in a channel where posting the card does what `send` does. */
function openingTicket(send: () => Promise<unknown>, lacking: string[] = []) {
    const thread = {
        id: "t1",
        members: { add: vi.fn(async () => undefined) },
        send: vi.fn(send),
        delete: vi.fn(async () => undefined),
    };
    const channel = {
        type: ChannelType.GuildText,
        guild: { members: { me: {} } },
        permissionsFor: () => ({
            missing: (needed: string[]) => needed.filter((name) => lacking.includes(name)),
        }),
        threads: { create: vi.fn(async () => thread), fetch: vi.fn() },
    };
    const interaction = {
        inCachedGuild: () => true,
        locale: Locale.EnglishUS,
        channel,
        guildId: "g",
        user: { id: "u" },
        member: { displayName: "Lea" },
        deferReply: vi.fn(),
        editReply: vi.fn(),
    } as unknown as ButtonInteraction;
    return { thread, channel, interaction };
}

describe("opening a ticket", () => {
    it("keeps the ticket once its card is posted", async () => {
        const settings = openSettings(":memory:");
        const { interaction } = openingTicket(async () => undefined);
        await ticket.button?.(interaction, { settings }, "open");
        expect(settings.ticket("g", "u")).toBe("t1");
    });

    it("deletes a ticket whose card could not be posted and keeps no record of it", async () => {
        const settings = openSettings(":memory:");
        const { thread, interaction } = openingTicket(() => Promise.reject(new Error("50013")));
        await expect(ticket.button?.(interaction, { settings }, "open")).rejects.toThrow();
        expect(thread.delete).toHaveBeenCalled();
        expect(settings.ticket("g", "u")).toBeUndefined();
    });

    it("tells the member when Nexo lost its permissions, and opens nothing", async () => {
        const settings = openSettings(":memory:");
        const { channel, interaction } = openingTicket(async () => undefined, ["ManageThreads"]);
        await ticket.button?.(interaction, { settings }, "open");
        expect(channel.threads.create).not.toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith(en.ticketUnavailable);
    });
});
