import { describe, expect, it } from "vitest";
import { openSettings } from "../src/settings.ts";

describe("welcome settings", () => {
    it("are kept per server, replaced on save and gone after removing", () => {
        const settings = openSettings(":memory:");
        expect(settings.welcome("server")).toBeUndefined();

        settings.saveWelcome("server", { channelId: "1", message: "Hi {user}", ping: true });
        settings.saveWelcome("other", { channelId: "9", message: "Hey", ping: false });
        settings.saveWelcome("server", { channelId: "2", message: "Hello {user}", ping: false });

        expect(settings.welcome("server")).toEqual({
            channelId: "2",
            message: "Hello {user}",
            ping: false,
        });
        expect(settings.welcome("other")).toEqual({ channelId: "9", message: "Hey", ping: false });
        settings.removeWelcome("server");
        expect(settings.welcome("server")).toBeUndefined();
        expect(settings.welcome("other")).toBeDefined();
    });
});
