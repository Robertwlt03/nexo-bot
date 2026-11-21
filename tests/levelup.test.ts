import { ChannelType, type Message } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { giveRoles } from "../src/autorole.ts";
import { announced, xpCooldowns } from "../src/leveling.ts";
import { earnXp } from "../src/levelup.ts";
import { openSettings } from "../src/settings.ts";

/** A channel Nexo may write in. */
function channel(type = ChannelType.GuildText) {
    return {
        type,
        isThread: () => type !== ChannelType.GuildText,
        isSendable: () => true,
        guild: { members: { me: {} } },
        permissionsFor: () => ({ missing: () => [] }),
        send: vi.fn(),
    };
}

/** A message by Lena, who is one message short of level 1, in a server with a channel "log". */
function message(type = ChannelType.GuildText) {
    const here = channel(type);
    const log = channel();
    const roles = new Map([["regular", { id: "regular", editable: true }]]);
    const member = {
        guild: { id: "server", roles: { cache: roles } },
        roles: { cache: new Map(), add: vi.fn() },
        user: { tag: "lena" },
    };
    const sent = {
        guildId: "server",
        guild: {
            name: "Nexo Club",
            channels: { cache: new Map([["log", log]]) },
            roles: { cache: roles },
        },
        author: { id: "lena", tag: "lena" },
        member,
        channel: here,
    } as unknown as Message<true>;
    const settings = openSettings(":memory:");
    settings.addXp("server", "lena", 49); // any message's 15 to 25 XP reach level 1 at 50
    return { sent, here, log, member, settings };
}

describe("earning XP", () => {
    it("posts the level-up card where the member wrote, by default", async () => {
        const { sent, here, settings } = message();
        await earnXp(sent, settings, xpCooldowns());
        expect(here.send).toHaveBeenCalledOnce();
    });

    it("posts only in the server's level-up channel, and nowhere when off", async () => {
        const inLog = message();
        inLog.settings.saveLevelUpChannel("server", "log");
        await earnXp(inLog.sent, inLog.settings, xpCooldowns());
        expect(inLog.log.send).toHaveBeenCalledOnce();
        expect(inLog.here.send).not.toHaveBeenCalled();

        const off = message();
        off.settings.saveLevelUpChannel("server", null);
        await earnXp(off.sent, off.settings, xpCooldowns());
        expect(off.here.send).not.toHaveBeenCalled();
    });

    it("gives no XP in private threads, such as tickets", async () => {
        const { sent, settings } = message(ChannelType.PrivateThread);
        await earnXp(sent, settings, xpCooldowns());
        expect(settings.totalXp("server", "lena")).toBe(49);
    });

    it("gives the level roles reached, also with level-ups off", async () => {
        const { sent, member, settings } = message();
        settings.saveLevelUpChannel("server", null);
        settings.saveLevelRole("server", "regular", 1);
        await earnXp(sent, settings, xpCooldowns());
        expect(member.roles.add).toHaveBeenCalledWith(
            [{ id: "regular", editable: true }],
            expect.any(String),
        );
    });
});

describe("announced", () => {
    it("is every level up to 10, then every fifth", () => {
        for (const level of [1, 7, 10, 15, 20]) expect(announced(level), String(level)).toBe(true);
        for (const level of [11, 14, 23]) expect(announced(level), String(level)).toBe(false);
    });
});

describe("giveRoles", () => {
    it("asks Discord only for missing roles Nexo can give, else not at all", async () => {
        const roles = new Map([
            ["a", { id: "a", editable: true }],
            ["b", { id: "b", editable: false }],
            ["c", { id: "c", editable: true }],
        ]);
        const add = vi.fn();
        const member = {
            guild: { roles: { cache: roles } },
            roles: { cache: new Map([["c", roles.get("c")]]), add },
        } as unknown as Parameters<typeof giveRoles>[0];
        await giveRoles(member, ["a", "b", "c", "gone"], "test");
        expect(add).toHaveBeenCalledWith([roles.get("a")], "test");
        add.mockClear();
        await giveRoles(member, ["b", "c"], "test");
        expect(add).not.toHaveBeenCalled();
    });
});
