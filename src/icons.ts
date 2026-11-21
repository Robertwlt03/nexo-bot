import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Resvg } from "@resvg/resvg-js";
import type { ButtonBuilder, ClientApplication } from "discord.js";
import { NEXO_AMBER } from "./card.ts";

/** Nexo's icons, all from Heroicons (outline, 24 px), by what they stand for. */
const ICONS = {
    general: "squares-2x2",
    server: "server-stack",
    members: "users",
    user: "user",
    picture: "photo",
    rank: "chart-bar",
    leaderboard: "trophy",
    levelup: "sparkles",
    welcome: "hand-raised",
    leave: "arrow-right-start-on-rectangle",
    autorole: "tag",
    setup: "cog-6-tooth",
    modlog: "clipboard-document-list",
    moderation: "shield-check",
    warn: "exclamation-triangle",
    timeout: "clock",
    ban: "no-symbol",
    undo: "check-circle",
    ticket: "ticket",
    closed: "lock-closed",
    bot: "cpu-chip",
    send: "paper-airplane",
    add: "plus-circle",
} as const;
export type IconName = keyof typeof ICONS;

// ponytail: an emoji is uploaded once by name, so a changed drawing needs a new name (or the old
// emoji deleted in the Developer Portal) to reach Discord.
const PREFIX = "nexo_";
const ids = new Map<IconName, string>();
const require = createRequire(import.meta.url);

/** A Heroicon in Nexo's amber as a 128 px PNG, the size Discord shows emojis sharpest at. */
export function iconPng(name: IconName): Buffer {
    const svg = readFileSync(require.resolve(`heroicons/24/outline/${ICONS[name]}.svg`), "utf8");
    const amber = `#${NEXO_AMBER.toString(16).padStart(6, "0")}`;
    const drawn = new Resvg(svg.replaceAll("currentColor", amber), {
        fitTo: { mode: "width", value: 128 },
    });
    return drawn.render().asPng();
}

/** Uploads the icons the app doesn't have yet as its own emojis, and keeps every icon's ID. */
export async function syncIcons(application: ClientApplication): Promise<void> {
    const existing = await application.emojis.fetch();
    for (const name of Object.keys(ICONS) as IconName[]) {
        const found = existing.find((emoji) => emoji.name === `${PREFIX}${name}`);
        const emoji =
            found ??
            (await application.emojis.create({
                attachment: iconPng(name),
                name: `${PREFIX}${name}`,
            }));
        ids.set(name, emoji.id);
    }
}

/** A button with an icon in front of its label; before the icons are synced, the label alone. */
export function iconButton(button: ButtonBuilder, name: IconName): ButtonBuilder {
    const id = ids.get(name);
    return id ? button.setEmoji({ id, name: `${PREFIX}${name}` }) : button;
}

/** An icon to put in front of a text; nothing before the icons are synced. */
export function icon(name: IconName): string {
    const id = ids.get(name);
    return id ? `<:${PREFIX}${name}:${id}> ` : "";
}
