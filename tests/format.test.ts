import { describe, expect, it } from "vitest";
import { dateWithAge, firstWithRest } from "../src/format.ts";

describe("firstWithRest", () => {
    it("lists everything up to the limit and counts the rest", () => {
        expect(firstWithRest([], 2)).toBe("");
        expect(firstWithRest(["a", "b"], 2)).toBe("a b");
        expect(firstWithRest(["a", "b", "c"], 2)).toBe("a b +1");
    });
});

describe("dateWithAge", () => {
    it("lets Discord show the day and how long ago, in each member's time zone", () => {
        const date = new Date("2020-05-17T12:00:00Z");
        expect(dateWithAge(date)).toBe("<t:1589716800:D> · <t:1589716800:R>");
    });
});
