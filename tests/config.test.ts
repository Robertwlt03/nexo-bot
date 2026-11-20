import { describe, expect, it } from "vitest";
import { readConfig } from "../src/config.ts";

describe("readConfig", () => {
    it("needs a token", () => {
        expect(() => readConfig({})).toThrow(/DISCORD_TOKEN/);
        expect(() => readConfig({ DISCORD_TOKEN: "  " })).toThrow(/DISCORD_TOKEN/);
    });

    it("treats an empty test server as none", () => {
        expect(readConfig({ DISCORD_TOKEN: "token", GUILD_ID: "" })).toEqual({ token: "token" });
        expect(readConfig({ DISCORD_TOKEN: " token ", GUILD_ID: " 42 " })).toEqual({
            token: "token",
            guildId: "42",
        });
    });
});
