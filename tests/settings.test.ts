import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Locale } from "discord.js";
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

        expect(settings.warningUser("server", first)).toBe("lena");
        expect(settings.warningUser("other", first)).toBeUndefined();
        // a number from another server
        expect(settings.removeWarning("other", first)).toBeUndefined();
        expect(settings.removeWarning("server", first)).toBe("lena");
        expect(settings.removeWarning("server", first)).toBeUndefined();
        expect(settings.warnings("server", "lena").map((w) => w.id)).toEqual([second]);
    });
});

describe("mod log", () => {
    it("keeps one channel and language per server until it is turned off", () => {
        const settings = openSettings(":memory:");
        expect(settings.modlog("server")).toBeUndefined();
        settings.saveModlog("server", "a", Locale.German);
        settings.saveModlog("server", "b", Locale.EnglishUS);
        settings.saveModlog("other", "c", Locale.German);
        expect(settings.modlog("server")).toEqual({ channelId: "b", locale: Locale.EnglishUS });
        settings.removeModlog("server");
        expect(settings.modlog("server")).toBeUndefined();
        expect(settings.modlog("other")?.channelId).toBe("c");
    });

    it("gives a mod log from before its language English", () => {
        const folder = mkdtempSync(join(tmpdir(), "nexo-"));
        try {
            const path = join(folder, "nexo.sqlite");
            const old = new DatabaseSync(path);
            old.exec("CREATE TABLE modlog (guild_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL)");
            old.exec("INSERT INTO modlog VALUES ('server', 'log')");
            old.close();
            const settings = openSettings(path);
            expect(settings.modlog("server")).toEqual({ channelId: "log", locale: "en-US" });
        } finally {
            rmSync(folder, { recursive: true, force: true });
        }
    });
});

describe("tickets", () => {
    it("keep one open ticket per server and member until its thread is closed", () => {
        const settings = openSettings(":memory:");
        expect(settings.ticket("server", "lena")).toBeUndefined();
        settings.saveTicket("server", "lena", "a");
        settings.saveTicket("server", "lena", "b");
        settings.saveTicket("other", "lena", "c");
        expect(settings.ticket("server", "lena")).toBe("b");
        settings.closeTicket("b");
        expect(settings.ticket("server", "lena")).toBeUndefined();
        expect(settings.ticket("other", "lena")).toBe("c");
    });

    it("remember one panel per channel, replaced when it is posted again", () => {
        const settings = openSettings(":memory:");
        expect(settings.ticketPanel("server", "support")).toBeUndefined();
        settings.saveTicketPanel("server", "support", "first");
        settings.saveTicketPanel("server", "support", "second");
        settings.saveTicketPanel("server", "help", "third");
        expect(settings.ticketPanel("server", "support")).toBe("second");
        expect(settings.ticketPanel("server", "help")).toBe("third");
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

describe("levels", () => {
    it("keep where level-ups go: the default, a channel, or nowhere", () => {
        const settings = openSettings(":memory:");
        expect(settings.levelUpChannel("server")).toBeUndefined();
        settings.saveLevelUpChannel("server", "c");
        expect(settings.levelUpChannel("server")).toBe("c");
        settings.saveLevelUpChannel("server", null);
        expect(settings.levelUpChannel("server")).toBeNull();
        settings.saveLevelUpChannel("server", undefined);
        expect(settings.levelUpChannel("server")).toBeUndefined();
    });

    it("keep level roles lowest first, move a role saved again, and remove it once", () => {
        const settings = openSettings(":memory:");
        settings.saveLevelRole("server", "veteran", 20);
        settings.saveLevelRole("server", "regular", 5);
        settings.saveLevelRole("server", "veteran", 10);
        expect(settings.levelRoles("server")).toEqual([
            { roleId: "regular", level: 5 },
            { roleId: "veteran", level: 10 },
        ]);
        expect(settings.removeLevelRole("server", "regular")).toBe(true);
        expect(settings.removeLevelRole("server", "regular")).toBe(false);
    });

    it("can take a member's XP back to 0", () => {
        const settings = openSettings(":memory:");
        settings.addXp("server", "spammer", 500);
        settings.resetXp("server", "spammer");
        expect(settings.totalXp("server", "spammer")).toBe(0);
    });
});

describe("forgetting a server", () => {
    it("deletes every row of that server and keeps the others", () => {
        const settings = openSettings(":memory:");
        for (const server of ["gone", "kept"]) {
            settings.saveGreeting("welcome", server, {
                channelId: "c",
                message: "Hi",
                ping: false,
            });
            settings.addWarning(server, "lena", "mod", "spam");
            settings.addXp(server, "lena", 50);
            settings.saveModlog(server, "log", Locale.German);
            settings.saveTicket(server, "lena", "thread");
            settings.addAutorole(server, "role");
            settings.saveLevelRole(server, "role", 5);
        }
        settings.forgetServer("gone");
        expect(settings.greeting("welcome", "gone")).toBeUndefined();
        expect(settings.warnings("gone", "lena")).toEqual([]);
        expect(settings.totalXp("gone", "lena")).toBe(0);
        expect(settings.modlog("gone")).toBeUndefined();
        expect(settings.ticket("gone", "lena")).toBeUndefined();
        expect(settings.autoroles("gone")).toEqual([]);
        expect(settings.levelRoles("gone")).toEqual([]);
        expect(settings.totalXp("kept", "lena")).toBe(50);
        expect(settings.warnings("kept", "lena")).toHaveLength(1);
    });
});
