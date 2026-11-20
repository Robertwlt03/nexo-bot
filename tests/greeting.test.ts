import { describe, expect, it } from "vitest";
import { fillGreeting } from "../src/greeting.ts";
import { de } from "../src/translations/de.ts";

const lena = { id: "42", username: "lena", server: "Nexo Club", count: 128 };

describe("fillGreeting", () => {
    it("fills every placeholder, each time it appears", () => {
        expect(fillGreeting("{user} {username} {server} {membercount} {user}", lena)).toBe(
            "<@42> lena Nexo Club 128 <@42>",
        );
    });

    it("leaves a text without placeholders as it is", () => {
        expect(fillGreeting("Hallo!", lena)).toBe("Hallo!");
    });

    it("turns the German defaults into finished sentences", () => {
        expect(fillGreeting(de.welcome.defaultMessage, lena)).toBe(
            "Willkommen auf **Nexo Club**, <@42>! Du bist unser 128. Mitglied.",
        );
        expect(fillGreeting(de.goodbye.defaultMessage, lena)).toBe(
            "**lena** hat den Server verlassen. Wir sind jetzt 128 Mitglieder.",
        );
    });
});
