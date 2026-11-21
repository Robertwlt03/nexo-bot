import { describe, expect, it } from "vitest";
import { card } from "../src/card.ts";

describe("card", () => {
    it("can be only a picture, with no text block, which Discord would refuse empty", () => {
        const only = card(null, undefined, { top: "attachment://rank.png" }).toJSON();
        expect(only.components.map(({ type }) => type)).toEqual([12]); // a media gallery
    });
});
