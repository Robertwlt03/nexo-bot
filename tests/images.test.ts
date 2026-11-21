import { describe, expect, it } from "vitest";
import { iconPng } from "../src/icons.ts";
import { drawableName, greetingImage, rankImage } from "../src/images.ts";

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

describe("drawableName", () => {
    it("leaves out emoji and makes fancy letters plain", () => {
        expect(drawableName("🔥 Max", "max")).toBe("Max");
        expect(drawableName("𝓜𝓪𝔁 ✨", "max")).toBe("Max");
        expect(drawableName("Ｌｅａ", "lea")).toBe("Lea");
        expect(drawableName("Дмитрий", "dima")).toBe("Дмитрий");
    });

    it("falls back, such as to the username, when only emoji are left", () => {
        expect(drawableName("👨‍👩‍👧 🇩🇪", "lea")).toBe("lea");
    });
});

describe("the fonts", () => {
    it("have a letter for every character of names members really use", () => {
        const drawn = (name: string) =>
            greetingImage({ avatar: undefined, name, server: "S", number: 1 });
        // A character no font has draws as the same box as any other missing one.
        const box = drawn("\u{10FFFD}");
        for (const letter of [..."ʟᴇᴏɴДмитрийΩğŁœ"]) {
            expect(drawn(letter).equals(box), letter).toBe(false);
        }
    });
});
