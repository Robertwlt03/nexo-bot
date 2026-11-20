import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openSettings } from "../src/settings.ts";

describe("greetings", () => {
    it("are kept per server and per kind, replaced on save and gone after removing", () => {
        const settings = openSettings(":memory:");
        expect(settings.greeting("welcome", "server")).toBeUndefined();

        settings.saveGreeting("welcome", "server", { channelId: "1", message: "Hi", ping: true });
        settings.saveGreeting("goodbye", "server", { channelId: "3", message: "Bye", ping: false });
        settings.saveGreeting("welcome", "other", { channelId: "9", message: "Hey", ping: false });
        settings.saveGreeting("welcome", "server", {
            channelId: "2",
            message: "Hello",
            ping: false,
        });

        expect(settings.greeting("welcome", "server")).toEqual({
            channelId: "2",
            message: "Hello",
            ping: false,
        });
        expect(settings.greeting("goodbye", "server")?.message).toBe("Bye");
        settings.removeGreeting("welcome", "server");
        expect(settings.greeting("welcome", "server")).toBeUndefined();
        expect(settings.greeting("goodbye", "server")).toBeDefined();
        expect(settings.greeting("welcome", "other")).toBeDefined();
    });

    it("are still there after the bot starts again", () => {
        const folder = mkdtempSync(join(tmpdir(), "nexo-"));
        try {
            const path = join(folder, "data", "nexo.sqlite");
            openSettings(path).saveGreeting("welcome", "server", {
                channelId: "1",
                message: "Hi",
                ping: false,
            });
            expect(openSettings(path).greeting("welcome", "server")?.message).toBe("Hi");
        } finally {
            rmSync(folder, { recursive: true, force: true });
        }
    });
});

describe("automatic roles", () => {
    it("are kept per server, each role once, and can be taken out again", () => {
        const settings = openSettings(":memory:");
        expect(settings.autoroles("server")).toEqual([]);

        expect(settings.addAutorole("server", "a")).toBe(true);
        expect(settings.addAutorole("server", "b")).toBe(true);
        expect(settings.addAutorole("server", "a")).toBe(false);
        expect(settings.addAutorole("other", "c")).toBe(true);
        expect(settings.autoroles("server").sort()).toEqual(["a", "b"]);

        expect(settings.removeAutorole("server", "a")).toBe(true);
        expect(settings.removeAutorole("server", "a")).toBe(false);
        expect(settings.autoroles("server")).toEqual(["b"]);
        expect(settings.autoroles("other")).toEqual(["c"]);
    });
});

describe("warnings", () => {
    it("are kept per server and member, newest first, and removed by number", () => {
        const settings = openSettings(":memory:");
        const first = settings.addWarning("server", "lena", "mod", "spam");
        const second = settings.addWarning("server", "lena", "mod", "insults");
        settings.addWarning("other", "lena", "mod", "elsewhere");

        expect(settings.warnings("server", "lena").map((w) => w.reason)).toEqual([
            "insults",
            "spam",
        ]);
        expect(settings.warnings("server", "lena")[0]).toMatchObject({
            id: second,
            moderatorId: "mod",
        });
        expect(settings.warnings("server", "nobody")).toEqual([]);

        expect(settings.removeWarning("other", first)).toBe(false); // a number from another server
        expect(settings.removeWarning("server", first)).toBe(true);
        expect(settings.removeWarning("server", first)).toBe(false);
        expect(settings.warnings("server", "lena").map((w) => w.id)).toEqual([second]);
    });
});

describe("XP", () => {
    it("adds up per server and member, and ranks members by their total", () => {
        const settings = openSettings(":memory:");
        expect(settings.totalXp("server", "lena")).toBe(0);
        expect(settings.addXp("server", "lena", 20)).toBe(20);
        expect(settings.addXp("server", "lena", 15)).toBe(35);
        settings.addXp("server", "tom", 50);
        settings.addXp("server", "mia", 35);
        settings.addXp("other", "lena", 999);

        expect(settings.totalXp("server", "lena")).toBe(35);
        expect(settings.rank("server", "tom")).toBe(1);
        expect(settings.rank("server", "lena")).toBe(2);
        expect(settings.rank("server", "mia")).toBe(2); // the same XP shares the place
        expect(settings.leaderboard("server", 2)).toEqual([
            { userId: "tom", totalXp: 50 },
            { userId: "lena", totalXp: 35 },
        ]);
    });
});
