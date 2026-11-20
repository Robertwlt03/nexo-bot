import { describe, expect, it } from "vitest";
import { de } from "../src/translations/de.ts";
import { fillWelcome } from "../src/welcome.ts";

const lena = { id: "42", username: "lena", server: "Nexo Club", count: 128 };

describe("fillWelcome", () => {
    it("fills every placeholder, each time it appears", () => {
        expect(fillWelcome("{user} {username} {server} {membercount} {user}", lena)).toBe(
            "<@42> lena Nexo Club 128 <@42>",
        );
    });

    it("leaves a text without placeholders as it is", () => {
        expect(fillWelcome("Hallo!", lena)).toBe("Hallo!");
    });

    it("turns the German default into a finished sentence", () => {
        expect(fillWelcome(de.defaultWelcome, lena)).toBe(
            "Willkommen auf **Nexo Club**, <@42>! Du bist unser 128. Mitglied.",
        );
    });
});
