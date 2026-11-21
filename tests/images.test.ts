import { describe, expect, it } from "vitest";
import { iconPng } from "../src/icons.ts";
import { greetingImage, rankImage } from "../src/images.ts";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("Nexo's pictures", () => {
    it("draws a welcome, a goodbye and a rank card, also for names with markup in them", () => {
        const name = "<b>&\"'";
        const pictures = [
            greetingImage({ avatar: undefined, name, server: "A & B", number: 3 }),
            greetingImage({ avatar: undefined, name, server: "A & B" }),
            rankImage({
                avatar: undefined,
                name,
                level: 2,
                place: 1,
                totalXp: 156,
                xp: 1,
                needed: 165,
            }),
        ];
        for (const picture of pictures) expect(picture.subarray(0, 4)).toEqual(PNG);
    });

    it("draws every icon in amber as a PNG", () => {
        expect(iconPng("leaderboard").subarray(0, 4)).toEqual(PNG);
    });
});
