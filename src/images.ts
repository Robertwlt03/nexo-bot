import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

// Nexo Mono: one amber on Discord's own graphite, white and gray for text, an amber dot grid as
// the signature. The pictures hold names and numbers only, so they suit every language.
const AMBER = "#E8A33D";
const GRAPHITE = "#1E1F22";
const TRACK = "#3F4147";
const WHITE = "#F2F3F5";
const GRAY = "#949BA4";
const WIDTH = 1100;

const FONTS = ["Geist-Medium.ttf", "Geist-SemiBold.ttf", "Geist-Black.ttf"].map((file) =>
    fileURLToPath(new URL(`../assets/fonts/${file}`, import.meta.url)),
);

function xml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** A name that fits the picture: long ones end in an ellipsis. */
function fitted(name: string, max = 18): string {
    return xml([...name].length > max ? `${[...name].slice(0, max - 1).join("")}…` : name);
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

// ponytail: only Geist is loaded, which has no emoji and no Chinese, Japanese or Korean; such
// characters in a name show as boxes. Add a fallback font to FONTS if members ask for them.
function png(svg: string): Buffer {
    const rendered = new Resvg(svg, {
        font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Geist" },
    });
    return rendered.render().asPng();
}

/** The background every picture shares: graphite, the amber dot grid fading out to the right. */
function backdrop(height: number, glowX: number): string {
    return `<defs>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="${AMBER}" fill-opacity=".16"/></pattern>
        <linearGradient id="fade" x1="0" x2="1">
            <stop offset=".35" stop-color="${GRAPHITE}" stop-opacity="0"/>
            <stop offset="1" stop-color="${GRAPHITE}"/></linearGradient>
        <radialGradient id="glow" cx="${glowX}" cy=".5" r=".5">
            <stop offset="0" stop-color="${AMBER}" stop-opacity=".22"/>
            <stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>
        <filter id="gray"><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <rect width="${WIDTH}" height="${height}" fill="${GRAPHITE}"/>
    <rect width="${WIDTH}" height="${height}" fill="url(#dots)"/>
    <rect width="${WIDTH}" height="${height}" fill="url(#fade)"/>
    <rect width="${WIDTH}" height="${height}" fill="url(#glow)"/>`;
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
    const initial = xml([...name][0]?.toUpperCase() ?? "?");
    const inside = avatar
        ? `<image href="${avatar}" ${box}${gray ? ` filter="url(#gray)"` : ""}/>`
        : `<rect ${box} fill="#4A3A28"/><text x="${x}" y="${y + r * 0.35}"
            text-anchor="middle" font-size="${r}" font-weight="900"
            fill="${gray ? GRAY : AMBER}">${initial}</text>`;
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
        ${backdrop(360, 0.22)}
        <g opacity=".3">${ring(240, 180, 128, accent, 2)}</g>
        ${ring(240, 180, 112, accent, 5)}
        ${portrait(240, 180, 100, avatar, name, leaving)}
        ${label(420, 138, 22, GRAY, fitted(server.toUpperCase(), 30))}
        ${value(418, 208, 62, leaving ? GRAY : WHITE, fitted(name))}
        <rect x="420" y="236" width="64" height="5" rx="2.5" fill="${accent}"/>
        ${big}
    </svg>`);
}

/** The /rank picture: the ring around the member's picture fills toward the next level. */
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
        label(x, 226, 17, GRAY, name) + value(x, 280, 52, color, shown);
    return png(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="320">
        ${backdrop(320, 0.14)}
        ${ring(160, 160, 104, TRACK, 12)}
        ${ring(160, 160, 104, AMBER, 12, Math.min(1, xp / needed))}
        ${portrait(160, 160, 84, avatar, name)}
        ${value(320, 104, 50, WHITE, fitted(name))}
        ${label(322, 146, 20, GRAY, `${xp} / ${needed} XP`)}
        ${stat(322, "LEVEL", String(level), AMBER)}
        ${stat(512, "RANK", `#${place}`, WHITE)}
        ${stat(702, "XP", String(totalXp), WHITE)}
    </svg>`);
}
