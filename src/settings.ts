import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
// Node 26.11 renamed DatabaseSync to Database (DEP0210, documentation only), and @types/node
// 26.6.6 knows only the old name; DatabaseSync also runs on Node 26.0 to 26.10. Switch to
// Database once the types have it.
import { DatabaseSync } from "node:sqlite";

/** The two messages a server can post when someone joins or leaves. */
export type GreetingKind = "welcome" | "goodbye";
export const GREETING_KINDS: readonly GreetingKind[] = ["welcome", "goodbye"];

/** Where and how a server posts one of its greetings. */
export type GreetingSettings = { channelId: string; message: string; ping: boolean };

type GreetingRow = { channel_id: string; message: string; ping: number };

/** A warning a moderator gave, kept until someone removes it. */
export type Warning = { id: number; moderatorId: string; reason: string; createdAt: Date };

type WarningRow = { id: number; moderator_id: string; reason: string; created_at: number };

/** Each server's settings, kept in one SQLite file; ":memory:" keeps them only while running. */
export function openSettings(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    const database = new DatabaseSync(path);
    // One table per greeting; the names come from GREETING_KINDS, never from what someone typed.
    for (const kind of GREETING_KINDS) {
        database.exec(`CREATE TABLE IF NOT EXISTS ${kind} (
            guild_id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            message TEXT NOT NULL,
            ping INTEGER NOT NULL
        )`);
    }
    database.exec(`CREATE TABLE IF NOT EXISTS warning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )`);
    database.exec(`CREATE TABLE IF NOT EXISTS xp (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        total_xp INTEGER NOT NULL,
        PRIMARY KEY (guild_id, user_id)
    )`);
    database.exec(`CREATE TABLE IF NOT EXISTS modlog (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL
    )`);
    // A member's open ticket: one per member and server, so a second click finds the first one.
    database.exec(`CREATE TABLE IF NOT EXISTS ticket (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, user_id)
    )`);
    database.exec(`CREATE TABLE IF NOT EXISTS autorole (
        guild_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, role_id)
    )`);

    const greetings = Object.fromEntries(
        GREETING_KINDS.map((kind) => [
            kind,
            {
                select: database.prepare(
                    `SELECT channel_id, message, ping FROM ${kind} WHERE guild_id = ?`,
                ),
                save: database.prepare(`INSERT INTO ${kind} VALUES (?, ?, ?, ?)
                    ON CONFLICT (guild_id)
                    DO UPDATE SET channel_id = excluded.channel_id, message = excluded.message,
                    ping = excluded.ping`),
                remove: database.prepare(`DELETE FROM ${kind} WHERE guild_id = ?`),
            },
        ]),
    ) as Record<
        GreetingKind,
        Record<"select" | "save" | "remove", ReturnType<DatabaseSync["prepare"]>>
    >;
    const selectRoles = database.prepare("SELECT role_id FROM autorole WHERE guild_id = ?");
    const addRole = database.prepare("INSERT OR IGNORE INTO autorole VALUES (?, ?)");
    const removeRole = database.prepare("DELETE FROM autorole WHERE guild_id = ? AND role_id = ?");
    const addWarning = database.prepare(
        `INSERT INTO warning (guild_id, user_id, moderator_id, reason, created_at)
            VALUES (?, ?, ?, ?, ?)`,
    );
    const selectWarnings =
        database.prepare(`SELECT id, moderator_id, reason, created_at FROM warning
        WHERE guild_id = ? AND user_id = ? ORDER BY id DESC`);
    const removeWarning = database.prepare(
        "DELETE FROM warning WHERE guild_id = ? AND id = ? RETURNING user_id",
    );
    const selectModlog = database.prepare("SELECT channel_id FROM modlog WHERE guild_id = ?");
    const saveModlog = database.prepare(`INSERT INTO modlog VALUES (?, ?)
        ON CONFLICT (guild_id) DO UPDATE SET channel_id = excluded.channel_id`);
    const removeModlog = database.prepare("DELETE FROM modlog WHERE guild_id = ?");
    const addXp = database.prepare(`INSERT INTO xp VALUES (?, ?, ?)
        ON CONFLICT (guild_id, user_id) DO UPDATE SET total_xp = total_xp + excluded.total_xp
        RETURNING total_xp`);
    const selectXp = database.prepare("SELECT total_xp FROM xp WHERE guild_id = ? AND user_id = ?");
    const selectRank = database.prepare(
        "SELECT COUNT(*) AS above FROM xp WHERE guild_id = ? AND total_xp > ?",
    );
    const totalXp = (guildId: string, userId: string): number =>
        (selectXp.get(guildId, userId) as { total_xp: number } | undefined)?.total_xp ?? 0;
    const selectTicket = database.prepare(
        "SELECT thread_id FROM ticket WHERE guild_id = ? AND user_id = ?",
    );
    const saveTicket = database.prepare(`INSERT INTO ticket VALUES (?, ?, ?)
        ON CONFLICT (guild_id, user_id) DO UPDATE SET thread_id = excluded.thread_id`);
    const closeTicket = database.prepare("DELETE FROM ticket WHERE thread_id = ?");
    const selectTop = database.prepare(
        `SELECT user_id, total_xp FROM xp WHERE guild_id = ?
            ORDER BY total_xp DESC, user_id LIMIT ?`,
    );

    return {
        greeting(kind: GreetingKind, guildId: string): GreetingSettings | undefined {
            const row = greetings[kind].select.get(guildId) as GreetingRow | undefined;
            return row && { channelId: row.channel_id, message: row.message, ping: row.ping === 1 };
        },
        saveGreeting(kind: GreetingKind, guildId: string, settings: GreetingSettings): void {
            const { channelId, message, ping } = settings;
            greetings[kind].save.run(guildId, channelId, message, ping ? 1 : 0);
        },
        removeGreeting(kind: GreetingKind, guildId: string): void {
            greetings[kind].remove.run(guildId);
        },
        /** The roles new members get, by ID; deleted roles stay until someone removes them. */
        autoroles(guildId: string): string[] {
            return (selectRoles.all(guildId) as { role_id: string }[]).map((row) => row.role_id);
        },
        /** False when the role was in the list already. */
        addAutorole(guildId: string, roleId: string): boolean {
            return addRole.run(guildId, roleId).changes > 0;
        },
        /** False when the role was not in the list. */
        removeAutorole(guildId: string, roleId: string): boolean {
            return removeRole.run(guildId, roleId).changes > 0;
        },
        /** Keeps a warning and gives back its number, which /unwarn takes. */
        addWarning(guildId: string, userId: string, moderatorId: string, reason: string): number {
            return Number(
                addWarning.run(guildId, userId, moderatorId, reason, Date.now()).lastInsertRowid,
            );
        },
        /** A member's warnings on a server, newest first. */
        warnings(guildId: string, userId: string): Warning[] {
            return (selectWarnings.all(guildId, userId) as WarningRow[]).map((row) => ({
                id: row.id,
                moderatorId: row.moderator_id,
                reason: row.reason,
                createdAt: new Date(row.created_at),
            }));
        },
        /** Whom the removed warning was for; undefined when the server has no such number. */
        removeWarning(guildId: string, id: number): string | undefined {
            return (removeWarning.get(guildId, id) as { user_id: string } | undefined)?.user_id;
        },
        /** The channel where Nexo logs what moderators do; undefined when it logs nothing. */
        modlogChannel(guildId: string): string | undefined {
            return (selectModlog.get(guildId) as { channel_id: string } | undefined)?.channel_id;
        },
        saveModlogChannel(guildId: string, channelId: string): void {
            saveModlog.run(guildId, channelId);
        },
        removeModlogChannel(guildId: string): void {
            removeModlog.run(guildId);
        },
        /** The thread of a member's open ticket; undefined when they have none. */
        ticket(guildId: string, userId: string): string | undefined {
            const row = selectTicket.get(guildId, userId) as { thread_id: string } | undefined;
            return row?.thread_id;
        },
        /** Keeps a member's new ticket; an older one of theirs is forgotten. */
        saveTicket(guildId: string, userId: string, threadId: string): void {
            saveTicket.run(guildId, userId, threadId);
        },
        closeTicket(threadId: string): void {
            closeTicket.run(threadId);
        },
        /** Adds XP to a member and gives back their new total. */
        addXp(guildId: string, userId: string, amount: number): number {
            return (addXp.get(guildId, userId, amount) as { total_xp: number }).total_xp;
        },
        /** A member's total XP on a server; 0 before their first message. */
        totalXp,
        /** A member's place on the leaderboard: 1 for the most XP; shared XP shares the place. */
        rank(guildId: string, userId: string): number {
            const above = selectRank.get(guildId, totalXp(guildId, userId)) as { above: number };
            return above.above + 1;
        },
        /** The members with the most XP on a server, most first. */
        leaderboard(guildId: string, limit: number): { userId: string; totalXp: number }[] {
            return (selectTop.all(guildId, limit) as { user_id: string; total_xp: number }[]).map(
                (row) => ({ userId: row.user_id, totalXp: row.total_xp }),
            );
        },
    };
}

export type Settings = ReturnType<typeof openSettings>;
