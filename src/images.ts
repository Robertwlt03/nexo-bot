import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

// Nexo Wood, like the logo and the profile banner: walnut with fireflies, cream for names, a warm
// gray for labels, amber for what counts. The pictures hold names, numbers and their units only,
// so they suit every language.
const AMBER = "#E8A33D";
const DARK_WOOD = "#16110C";
const TRACK = "#4A3426";
const CREAM = "#F2E2C7";
const MUTED = "#AE9E87";
const WIDTH = 1100;

/** Walnut, from Nexo's earlier dashboard (Unsplash License, see assets/wood/CREDITS.md). */
const WALNUT = `data:image/jpeg;base64,${readFileSync(
    fileURLToPath(new URL("../assets/wood/walnut.jpg", import.meta.url)),
).toString("base64")}`;

/** Where the fireflies glow, as shares of the width and height; the same in every picture. */
const FIREFLIES = [
    [0.44, 0.18, 5],
    [0.55, 0.72, 4],
    [0.63, 0.3, 6],
    [0.71, 0.82, 4],
    [0.78, 0.12, 5],
    [0.84, 0.55, 6],
    [0.9, 0.28, 4],
    [0.95, 0.78, 5],
] as const;

// Geist draws Latin, Greek and Cyrillic; Noto Sans fills in what it lacks, such as small capitals
// (ʟᴇᴏɴ) and rarer accents.
const FONTS = [
    "Geist-Medium.ttf",
    "Geist-SemiBold.ttf",
    "Geist-Black.ttf",
    "NotoSans-SemiBold.ttf",
    "NotoSans-Black.ttf",
].map((file) => fileURLToPath(new URL(`../assets/fonts/${file}`, import.meta.url)));

function xml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Emoji, and what joins, colors or tags them: the fonts Nexo loads have none. */
const EMOJI = /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}/gu;
const JOINERS = /[\u200d\ufe0e\ufe0f\u20e3]|[\u{e0020}-\u{e007f}]/gu;

/**
 * A name as Nexo can draw it: fancy letters made plain (𝓜𝓪𝔁 is Max), emoji left out, and the
 * fallback, such as the username, when nothing is left.
 */
export function drawableName(name: string, fallback: string): string {
    const plain = name.normalize("NFKC").replace(EMOJI, "").replace(JOINERS, "");
    return plain.replace(/\s+/g, " ").trim() || fallback;
}

/** A text's characters as people see them, so an accent stays with its letter. */
function graphemes(text: string): string[] {
    return [...new Intl.Segmenter().segment(text)].map(({ segment }) => segment);
}

/** A name that fits the picture: long ones end in an ellipsis. */
function fitted(name: string, max = 18): string {
    const letters = graphemes(name);
    return xml(letters.length > max ? `${letters.slice(0, max - 1).join("")}…` : name);
}

/** A member's picture as a data URL the renderer can embed; undefined if Discord won't send it. */
export async function avatarData(url: string): Promise<string | undefined> {
    try {
        // A picture that doesn't come within five seconds is left out; the initial stands in.
        const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
        if (!response.ok) return undefined;
        const bytes = Buffer.from(await response.arrayBuffer());
        return `data:image/png;base64,${bytes.toString("base64")}`;
    } catch {
        return undefined;
    }
}

// ponytail: emoji are left out of names (drawableName); Chinese, Japanese and Korean still show
// as boxes. Add Noto Sans CJK (about 16 MB) to FONTS if members ask.
function png(svg: string): Buffer {
    const rendered = new Resvg(svg, {
        font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Geist" },
    });
    return rendered.render().asPng();
}

/**
 * The background every picture shares: walnut, darkened toward the text so it stays readable, a
 * warm glow behind the member and fireflies to the right; a goodbye has no fireflies and gray wood.
 */
function backdrop(height: number, glowX: number, leaving = false): string {
    const fireflies = leaving
        ? ""
        : FIREFLIES.map(
              ([x, y, r]) => `<circle cx="${x * WIDTH}" cy="${y * height}" r="${r * 3}"
                  fill="url(#firefly)"/><circle cx="${x * WIDTH}" cy="${y * height}" r="${r / 2}"
                  fill="#FFF3C4"/>`,
          ).join("");
    return `<defs>
        <linearGradient id="shade" x1="0" x2="1">
            <stop offset="0" stop-color="${DARK_WOOD}" stop-opacity=".35"/>
            <stop offset=".45" stop-color="${DARK_WOOD}" stop-opacity=".7"/>
            <stop offset="1" stop-color="${DARK_WOOD}" stop-opacity=".45"/></linearGradient>
        <radialGradient id="glow" cx="${glowX}" cy=".5" r=".5">
            <stop offset="0" stop-color="${AMBER}" stop-opacity="${leaving ? 0 : 0.25}"/>
            <stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>
        <radialGradient id="firefly">
            <stop offset="0" stop-color="#F7D774" stop-opacity=".55"/>
            <stop offset="1" stop-color="#F7D774" stop-opacity="0"/></radialGradient>
        <filter id="gray"><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <image href="${WALNUT}" width="${WIDTH}" height="${height}" preserveAspectRatio="xMidYMid slice"
        ${leaving ? `filter="url(#gray)"` : ""}/>
    <rect width="${WIDTH}" height="${height}" fill="url(#shade)"/>
    <rect width="${WIDTH}" height="${height}" fill="url(#glow)"/>
    ${fireflies}`;
}

/** A name or a number: heavy type. */
function value(x: number, y: number, size: number, color: string, content: string) {
    const at = `x="${x}" y="${y}" font-size="${size}"`;
    return `<text ${at} font-weight="900" fill="${color}">${content}</text>`;
}

/** A label: lighter type, spaced out. */
function label(x: number, y: number, size: number, color: string, content: string) {
    const at = `x="${x}" y="${y}" font-size="${size}" letter-spacing="${size / 5}"`;
    return `<text ${at} font-weight="600" fill="${color}">${content}</text>`;
}

/** A ring around (x, y); `share` draws only that part of it, from the top, clockwise. */
function ring(x: number, y: number, r: number, color: string, width: number, share = 1) {
    const length = 2 * Math.PI * r;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}"
        stroke-width="${width}" stroke-linecap="round" transform="rotate(-90 ${x} ${y})"
        stroke-dasharray="${share * length} ${length}"/>`;
}

/** The member's picture in a circle, or their initial when there is none. */
function portrait(
    x: number,
    y: number,
    r: number,
    avatar: string | undefined,
    name: string,
    gray = false,
) {
    const box = `x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}"`;
    const initial = xml(name.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "?");
    const inside = avatar
        ? `<image href="${avatar}" ${box}${gray ? ` filter="url(#gray)"` : ""}/>`
        : `<rect ${box} fill="${TRACK}"${gray ? ` filter="url(#gray)"` : ""}/><text x="${x}" y="${y + r * 0.35}"
            text-anchor="middle" font-size="${r}" font-weight="900"
            fill="${gray ? MUTED : AMBER}">${initial}</text>`;
    return `<clipPath id="face"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath>
        <g clip-path="url(#face)">${inside}</g>`;
}

/**
 * The picture on top of a welcome or a goodbye: the member's picture in an amber ring, the server
 * as a small label, the name large; a welcome adds the member's number, a goodbye turns gray.
 */
export function greetingImage(options: {
    avatar: string | undefined;
    name: string;
    server: string;
    number?: number;
}): Buffer {
    const { avatar, name, server, number } = options;
    const leaving = number === undefined;
    const accent = leaving ? TRACK : AMBER;
    const big = leaving
        ? ""
        : `<text x="1050" y="310" text-anchor="end" font-size="120" font-weight="900"
            fill="${AMBER}">#${number}</text>`;
    return png(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="360">
        ${backdrop(360, 0.22, leaving)}
        <g opacity=".3">${ring(240, 180, 128, accent, 2)}</g>
        ${ring(240, 180, 112, accent, 5)}
        ${portrait(240, 180, 100, avatar, name, leaving)}
        ${label(420, 130, 36, MUTED, fitted(drawableName(server, "").toUpperCase(), 20))}
        ${value(418, 208, 62, leaving ? MUTED : CREAM, fitted(name))}
        <rect x="420" y="236" width="64" height="5" rx="2.5" fill="${accent}"/>
        ${big}
    </svg>`);
}

/**
 * The /rank picture: the ring around the member's picture fills toward the next level; the place
 * on the leaderboard stands large on the right, as the member number does on a welcome. "Level"
 * and "XP" read the same in every language Nexo speaks, so they are the only words.
 */
export function rankImage(options: {
    avatar: string | undefined;
    name: string;
    level: number;
    place: number;
    totalXp: number;
    xp: number;
    needed: number;
}): Buffer {
    const { avatar, name, level, place, totalXp, xp, needed } = options;
    const stat = (x: number, name: string, shown: string, color: string) =>
        label(x, 214, 36, MUTED, name) + value(x, 280, 52, color, shown);
    return png(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="320">
        ${backdrop(320, 0.14)}
        ${ring(160, 160, 104, TRACK, 12)}
        ${ring(160, 160, 104, AMBER, 12, Math.min(1, xp / needed))}
        ${portrait(160, 160, 84, avatar, name)}
        ${value(320, 92, 50, CREAM, fitted(name))}
        ${label(322, 144, 36, MUTED, `${xp} / ${needed} XP`)}
        ${stat(322, "LEVEL", String(level), AMBER)}
        ${stat(580, "XP", String(totalXp), CREAM)}
        <text x="1050" y="280" text-anchor="end" font-size="110" font-weight="900"
            fill="${CREAM}">#${place}</text>
    </svg>`);
}
