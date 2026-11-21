import type { Guild } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { post } from "../src/channel.ts";

/** A server whose channel "here" grants Nexo everything but the given permissions. */
function serverLacking(lacking: string[]) {
    const send = vi.fn();
    const here = {
        isSendable: () => true,
        guild: { members: { me: {} } },
        permissionsFor: () => ({
            missing: (needed: string[]) => needed.filter((name) => lacking.includes(name)),
        }),
        send,
    };
    const guild = { channels: { cache: new Map([["here", here]]) } } as unknown as Guild;
    return { send, guild };
}

describe("post", () => {
    it("needs Attach Files only for a card that carries a picture", async () => {
        const { send, guild } = serverLacking(["AttachFiles"]);
        expect(await post(guild, "here", { content: "card" })).toBe("sent");
        expect(await post(guild, "here", { files: [Buffer.from("png")] })).toEqual(["AttachFiles"]);
        expect(send).toHaveBeenCalledOnce();
    });
});
