import {
    AuditLogEvent,
    type ChatInputCommandInteraction,
    type Guild,
    type GuildAuditLogsEntry,
    Locale,
} from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { NEXO_AMBER } from "../src/card.ts";
import { auditModlogEntry, logAuditEntry, logModeration, modlogCard } from "../src/modlog.ts";
import { openSettings } from "../src/settings.ts";
import { en } from "../src/texts.ts";
import { de } from "../src/translations/de.ts";
import { textOf } from "./text-of.ts";

describe("modlogCard", () => {
    it("names the action, the member with their ID, the moderator and the reason", () => {
        const card = modlogCard(en, {
            action: "kick",
            userId: "42",
            moderatorId: "7",
            reason: "spam",
        });
        expect(textOf(card)).toBe(
            "## Kick\n-# MEMBER\n<@42> · 42\n-# MODERATOR\n<@7>\n-# REASON\nspam",
        );
    });

    it("adds a timeout's end and a warning's number, and no reason when none was given", () => {
        const until = new Date(1_700_000_000_000);
        const timeout = modlogCard(de, {
            action: "timeout",
            userId: "42",
            moderatorId: "7",
            reason: null,
            until,
        });
        expect(textOf(timeout).split("\n").slice(5)).toEqual(["-# BIS", "<t:1700000000:f>"]);
        const unwarn = modlogCard(de, {
            action: "unwarn",
            userId: "42",
            moderatorId: "7",
            reason: null,
            warning: 3,
        });
        expect(textOf(unwarn).split("\n").slice(5)).toEqual(["-# VERWARNUNG", "#3"]);
    });
    it("keeps Nexo's amber edge for every action; the icon tells them apart", () => {
        const entry = { userId: "42", moderatorId: "7", reason: null };
        for (const action of ["ban", "unban"] as const) {
            expect(modlogCard(en, { ...entry, action }).toJSON().accent_color).toBe(NEXO_AMBER);
        }
    });
});

/** A server with a channel "log" where Nexo lacks the given permissions. */
function serverWithLog(missing: string[] = []) {
    const send = vi.fn();
    const log = {
        isSendable: () => true,
        guild: { members: { me: {} } },
        permissionsFor: () => ({ missing: () => missing }),
        send,
    };
    const guild = {
        id: "server",
        name: "Nexo Club",
        client: { user: { id: "99" } }, // Nexo itself
        channels: { cache: new Map([["log", log]]) },
    } as unknown as Guild;
    return { send, guild };
}

/** A moderator's interaction on a server whose channel "log" lacks the given permissions. */
function moderatorOn(missing: string[], locale = "en-US") {
    const { send, guild } = serverWithLog(missing);
    const interaction = {
        guildId: "server",
        locale,
        user: { id: "7" },
        guild,
        followUp: vi.fn(),
    };
    return {
        send,
        followUp: interaction.followUp,
        interaction: interaction as unknown as ChatInputCommandInteraction<"cached">,
    };
}

describe("logModeration", () => {
    const entry = { action: "kick", userId: "42", reason: null } as const;

    it("posts nothing on a server without a mod log", async () => {
        const { interaction, send, followUp } = moderatorOn([]);
        await logModeration(interaction, openSettings(":memory:"), entry);
        expect(send).not.toHaveBeenCalled();
        expect(followUp).not.toHaveBeenCalled();
    });

    it("posts the card in the log's language and tells the moderator nothing more", async () => {
        const { interaction, send, followUp } = moderatorOn([]);
        const settings = openSettings(":memory:");
        settings.saveModlog("server", "log", Locale.German);
        // The moderator's Discord is English; the log was set up in German.
        await logModeration(interaction, settings, entry);
        expect(send).toHaveBeenCalledOnce();
        expect(textOf(send.mock.calls[0]?.[0].components[0])).toContain(de.modlogTitles.kick);
        expect(followUp).not.toHaveBeenCalled();
    });

    it("tells the moderator when the channel is gone or which permissions Nexo lacks", async () => {
        const settings = openSettings(":memory:");
        settings.saveModlog("server", "gone", Locale.German);
        const gone = moderatorOn([]);
        await logModeration(gone.interaction, settings, entry);
        expect(gone.followUp.mock.calls[0]?.[0].content).toBe(
            `${en.modlogPrefix} ${en.channelGone("`/modlog setup`")}`,
        );

        settings.saveModlog("server", "log", Locale.German);
        const locked = moderatorOn(["EmbedLinks"], "de");
        await logModeration(locked.interaction, settings, entry);
        expect(locked.send).not.toHaveBeenCalled();
        // Only the missing permission is named, in the moderator's language.
        expect(locked.followUp.mock.calls[0]?.[0].content).toBe(
            `${de.modlogPrefix} ${de.cannotPost("<#log>", de.permissionNames.EmbedLinks)}`,
        );
    });
});

/** An audit log entry as Discord sends it, by moderator 7 about member 42. */
function auditEntry(action: AuditLogEvent, changes: object[] = [], executorId = "7") {
    return { action, changes, executorId, targetId: "42", reason: "spam" } as GuildAuditLogsEntry;
}

describe("auditModlogEntry", () => {
    it("reads kicks, bans and lifted bans", () => {
        const known = { userId: "42", moderatorId: "7", reason: "spam" };
        expect(auditModlogEntry(auditEntry(AuditLogEvent.MemberKick))).toEqual({
            ...known,
            action: "kick",
        });
        expect(auditModlogEntry(auditEntry(AuditLogEvent.MemberBanAdd))?.action).toBe("ban");
        expect(auditModlogEntry(auditEntry(AuditLogEvent.MemberBanRemove))?.action).toBe("unban");
    });

    it("reads a timeout with its end, and its end, from a member update", () => {
        const key = "communication_disabled_until";
        const until = "2026-11-22T08:00:00.000Z";
        const given = auditModlogEntry(
            auditEntry(AuditLogEvent.MemberUpdate, [{ key, new: until }]),
        );
        expect(given).toMatchObject({ action: "timeout", until: new Date(until) });
        const ended = auditModlogEntry(
            auditEntry(AuditLogEvent.MemberUpdate, [{ key, old: until }]),
        );
        expect(ended?.action).toBe("untimeout");
    });

    it("skips what the mod log doesn't show, and entries without a member or moderator", () => {
        const nick = [{ key: "nick", new: "Lena" }];
        expect(auditModlogEntry(auditEntry(AuditLogEvent.MemberUpdate, nick))).toBeUndefined();
        expect(auditModlogEntry(auditEntry(AuditLogEvent.ChannelCreate))).toBeUndefined();
        const noTarget = { ...auditEntry(AuditLogEvent.MemberKick), targetId: null };
        expect(auditModlogEntry(noTarget as GuildAuditLogsEntry)).toBeUndefined();
    });
});

describe("logAuditEntry", () => {
    /** A server whose mod log is the channel "log", set up in German. */
    function server() {
        const { send, guild } = serverWithLog();
        const settings = openSettings(":memory:");
        settings.saveModlog("server", "log", Locale.German);
        return { send, guild, settings };
    }

    it("posts a kick made in Discord in the language the mod log was set up in", async () => {
        const { send, guild, settings } = server();
        await logAuditEntry(auditEntry(AuditLogEvent.MemberKick), guild, settings);
        const [message] = send.mock.calls[0] ?? [];
        expect(textOf(message.components[0])).toContain(`## ${de.modlogTitles.kick}`);
    });

    it("posts nothing on a server without a mod log", async () => {
        const { send, guild } = server();
        const entry = auditEntry(AuditLogEvent.MemberKick);
        await logAuditEntry(entry, guild, openSettings(":memory:"));
        expect(send).not.toHaveBeenCalled();
    });

    it("skips what Nexo did itself, which its command logged already", async () => {
        const { send, guild, settings } = server();
        await logAuditEntry(auditEntry(AuditLogEvent.MemberKick, [], "99"), guild, settings);
        expect(send).not.toHaveBeenCalled();
    });
});
