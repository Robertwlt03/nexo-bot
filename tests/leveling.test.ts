import { describe, expect, it } from "vitest";
import { levelFor, reachedLevel, rollXp, xpCooldowns, xpForNextLevel } from "../src/leveling.ts";

describe("levelFor", () => {
    it("reaches each level exactly at its threshold, not one XP before", () => {
        expect(levelFor(0)).toEqual({ level: 0, xp: 0, needed: 50 });
        expect(levelFor(49)).toEqual({ level: 0, xp: 49, needed: 50 });
        expect(levelFor(50)).toEqual({ level: 1, xp: 0, needed: 105 });
        expect(levelFor(154)).toEqual({ level: 1, xp: 104, needed: 105 });
        expect(levelFor(155)).toEqual({ level: 2, xp: 0, needed: 170 });
    });

    it("follows the formula of Nexo's earlier version", () => {
        expect([0, 1, 2, 10].map(xpForNextLevel)).toEqual([50, 105, 170, 1050]);
    });
});

describe("rollXp", () => {
    it("stays between 15 and 25, both included", () => {
        expect(rollXp(() => 0)).toBe(15);
        expect(rollXp(() => 0.5)).toBe(20);
        expect(rollXp(() => 0.9999)).toBe(25);
    });
});

describe("reachedLevel", () => {
    it("names the new level only when the XP just earned crossed its threshold", () => {
        expect(reachedLevel(50, 20)).toBe(1);
        expect(reachedLevel(49, 20)).toBeUndefined();
        expect(reachedLevel(70, 20)).toBeUndefined();
        expect(reachedLevel(155, 15)).toBe(2);
    });
});

describe("xpCooldowns", () => {
    it("gives XP at most once per 20 seconds per member and server", () => {
        const cooldowns = xpCooldowns();
        expect(cooldowns.take("server:lena", 0)).toBe(true);
        expect(cooldowns.take("server:lena", 19_999)).toBe(false);
        expect(cooldowns.take("server:tom", 19_999)).toBe(true);
        expect(cooldowns.take("server:lena", 20_000)).toBe(true);
    });

    it("forgets members whose cooldown is over once it holds too many", () => {
        const cooldowns = xpCooldowns(2);
        cooldowns.take("a", 0);
        cooldowns.take("b", 0);
        cooldowns.take("c", 30_000); // a and b are long past their cooldown
        expect(cooldowns.size).toBe(1);
    });
});
