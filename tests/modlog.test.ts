import type { ChatInputCommandInteraction } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { logModeration, modlogCard } from "../src/modlog.ts";
import { openSettings } from "../src/settings.ts";
import { en } from "../src/texts.ts";
import { de } from "../src/translations/de.ts";

const fieldsOf = (card: ReturnType<typeof modlogCard>) =>
    card.toJSON().fields?.map(({ name, value }) => [name, value]);

describe("modlogCard", () => {
    it("names the action, the member with their ID, the moderator and the reason", () => {
        const card = modlogCard(en, {
            action: "kick",
            userId: "42",
            moderatorId: "7",
            reason: "spam",
        });
        expect(card.toJSON().title).toBe("👢 Kick");
        expect(fieldsOf(card)).toEqual([
            ["Member", "<@42> · 42"],
            ["Moderator", "<@7>"],
            ["Reason", "spam"],
        ]);
    });

    it("adds a timeout's end and a warning's number, and no reason when none was given", () => {
        const until = new Date(1_700_000_000_000);
        const timeout = modlogCard(de, {
            action: "timeout",
            userId: "42",
            moderatorId: "7",
            reason: null,
            until,
        });
        expect(timeout.toJSON().title).toBe("🔇 Timeout");
        expect(fieldsOf(timeout)?.slice(2)).toEqual([["Bis", "<t:1700000000:f>"]]);
        const unwarn = modlogCard(de, {
            action: "unwarn",
            userId: "42",
            moderatorId: "7",
            reason: null,
            warning: 3,
        });
        expect(fieldsOf(unwarn)?.slice(2)).toEqual([["Verwarnung", "#3"]]);
    });
});

/** A moderator's interaction on a server whose channel "log" lacks the given permissions. */
function moderatorOn(missing: string[], locale = "en-US") {
    const send = vi.fn();
    const log = {
        isSendable: () => true,
        guild: { members: { me: {} } },
        permissionsFor: () => ({ missing: () => missing }),
        send,
    };
    const interaction = {
        guildId: "server",
        locale,
        user: { id: "7" },
        guild: { name: "Nexo Club", channels: { cache: new Map([["log", log]]) } },
        followUp: vi.fn(),
    };
    return {
        send,
        followUp: interaction.followUp,
        interaction: interaction as unknown as ChatInputCommandInteraction<"cached">,
    };
}

describe("logModeration", () => {
    const entry = { action: "kick", userId: "42", reason: null } as const;

    it("posts nothing on a server without a mod log", async () => {
        const { interaction, send, followUp } = moderatorOn([]);
        await logModeration(interaction, openSettings(":memory:"), entry);
        expect(send).not.toHaveBeenCalled();
        expect(followUp).not.toHaveBeenCalled();
    });

    it("posts the card and tells the moderator nothing more", async () => {
        const { interaction, send, followUp } = moderatorOn([]);
        const settings = openSettings(":memory:");
        settings.saveModlogChannel("server", "log");
        await logModeration(interaction, settings, entry);
        expect(send).toHaveBeenCalledOnce();
        expect(followUp).not.toHaveBeenCalled();
    });

    it("tells the moderator when the channel is gone or which permissions Nexo lacks", async () => {
        const settings = openSettings(":memory:");
        settings.saveModlogChannel("server", "gone");
        const gone = moderatorOn([]);
        await logModeration(gone.interaction, settings, entry);
        expect(gone.followUp.mock.calls[0]?.[0].content).toBe(
            `${en.modlogPrefix} ${en.channelGone("/modlog setup")}`,
        );

        settings.saveModlogChannel("server", "log");
        const locked = moderatorOn(["EmbedLinks"], "de");
        await logModeration(locked.interaction, settings, entry);
        expect(locked.send).not.toHaveBeenCalled();
        // Only the missing permission is named, in the moderator's language.
        expect(locked.followUp.mock.calls[0]?.[0].content).toBe(
            `${de.modlogPrefix} ${de.cannotPost("<#log>", de.permissionNames.EmbedLinks)}`,
        );
    });
});
