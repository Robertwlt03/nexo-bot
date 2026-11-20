import type { ChatInputCommandInteraction, GuildMember, User } from "discord.js";
import { describe, expect, it } from "vitest";
import { chosenPerson } from "../src/commands/member-option.ts";

const asker = { id: "1" } as User;
const askingMember = { id: "1" } as GuildMember;
const other = { id: "2" } as User;
const otherMember = { id: "2" } as GuildMember;

function asking(chosen: User | null, chosenMember: GuildMember | null) {
    return {
        user: asker,
        member: askingMember,
        options: { getUser: () => chosen, getMember: () => chosenMember },
    } as unknown as ChatInputCommandInteraction<"cached">;
}

describe("chosenPerson", () => {
    it("is whoever asks when no member is chosen", () => {
        expect(chosenPerson(asking(null, null))).toEqual({ user: asker, member: askingMember });
    });

    it("is the chosen member", () => {
        expect(chosenPerson(asking(other, otherMember))).toEqual({
            user: other,
            member: otherMember,
        });
    });

    it("has no member for someone who has left the server", () => {
        expect(chosenPerson(asking(other, null))).toEqual({ user: other, member: null });
    });
});
