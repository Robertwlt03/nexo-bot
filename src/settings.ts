import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
// Node 26.11 renamed DatabaseSync to Database (DEP0210, documentation only), and @types/node
// 26.6.6 knows only the old name; DatabaseSync also runs on Node 26.0 to 26.10. Switch to
// Database once the types have it.
import { DatabaseSync } from "node:sqlite";

/** How a server greets its new members. */
export type WelcomeSettings = { channelId: string; message: string; ping: boolean };

type WelcomeRow = { channel_id: string; message: string; ping: number };

/** Each server's settings, kept in one SQLite file; ":memory:" keeps them only while running. */
export function openSettings(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    const database = new DatabaseSync(path);
    database.exec(`CREATE TABLE IF NOT EXISTS welcome (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message TEXT NOT NULL,
        ping INTEGER NOT NULL
    )`);
    const select = database.prepare(
        "SELECT channel_id, message, ping FROM welcome WHERE guild_id = ?",
    );
    const save = database.prepare(`INSERT INTO welcome VALUES (?, ?, ?, ?) ON CONFLICT (guild_id)
        DO UPDATE SET
            channel_id = excluded.channel_id, message = excluded.message, ping = excluded.ping`);
    const remove = database.prepare("DELETE FROM welcome WHERE guild_id = ?");

    return {
        welcome(guildId: string): WelcomeSettings | undefined {
            const row = select.get(guildId) as WelcomeRow | undefined;
            return row && { channelId: row.channel_id, message: row.message, ping: row.ping === 1 };
        },
        saveWelcome(guildId: string, { channelId, message, ping }: WelcomeSettings): void {
            save.run(guildId, channelId, message, ping ? 1 : 0);
        },
        removeWelcome(guildId: string): void {
            remove.run(guildId);
        },
    };
}

export type Settings = ReturnType<typeof openSettings>;
