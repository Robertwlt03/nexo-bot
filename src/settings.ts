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
    const removeWarning = database.prepare("DELETE FROM warning WHERE guild_id = ? AND id = ?");

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
        /** False when the server has no warning with this number. */
        removeWarning(guildId: string, id: number): boolean {
            return removeWarning.run(guildId, id).changes > 0;
        },
    };
}

export type Settings = ReturnType<typeof openSettings>;
