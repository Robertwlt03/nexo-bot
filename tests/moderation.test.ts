import { describe, expect, it } from "vitest";
import { type ModerationFacts, moderationProblem } from "../src/moderation.ts";

/** A moderator acting on an ordinary member, with everything allowed. */
const allowed: ModerationFacts = {
    targetId: "member",
    moderatorId: "moderator",
    nexoId: "nexo",
    ownerId: "owner",
    moderatorAboveTarget: true,
    targetIsAdmin: false,
    nexoHasPermission: true,
    nexoAboveTarget: true,
};

describe("moderationProblem", () => {
    it("lets a moderator act on a member below them", () => {
        for (const action of ["warn", "timeout", "kick", "ban"] as const) {
            expect(moderationProblem(action, allowed)).toBeUndefined();
        }
    });

    it("never acts on yourself, on Nexo or on the server's owner", () => {
        expect(moderationProblem("ban", { ...allowed, targetId: "moderator" })).toBe("self");
        expect(moderationProblem("ban", { ...allowed, targetId: "nexo" })).toBe("nexo");
        expect(moderationProblem("ban", { ...allowed, targetId: "owner" })).toBe("owner");
    });

    it("refuses a member who ranks as high as the moderator or higher", () => {
        const higher = { ...allowed, moderatorAboveTarget: false };
        for (const action of ["warn", "timeout", "kick", "ban"] as const) {
            expect(moderationProblem(action, higher)).toBe("above-you");
        }
    });

    it("lets the owner act on anyone, whatever the role order says", () => {
        const owner = { ...allowed, moderatorId: "owner", moderatorAboveTarget: false };
        expect(moderationProblem("kick", owner)).toBeUndefined();
    });

    it("can't mute an administrator, though it can kick or ban one", () => {
        const admin = { ...allowed, targetIsAdmin: true };
        expect(moderationProblem("timeout", admin)).toBe("admin");
        expect(moderationProblem("kick", admin)).toBeUndefined();
    });

    it("names what Nexo lacks on Discord, but needs nothing for a warning", () => {
        const noPermission = { ...allowed, nexoHasPermission: false };
        expect(moderationProblem("kick", noPermission)).toBe("no-permission");
        expect(moderationProblem("warn", noPermission)).toBeUndefined();
        const belowTarget = { ...allowed, nexoAboveTarget: false };
        expect(moderationProblem("ban", belowTarget)).toBe("above-nexo");
        expect(moderationProblem("warn", belowTarget)).toBeUndefined();
    });
});
