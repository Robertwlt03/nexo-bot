import { describe, expect, it } from "vitest";
import { fillGreeting } from "../src/greeting.ts";
import { en } from "../src/texts.ts";
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

    it("fills every placeholder of the default messages, in both languages", () => {
        // The picture above shows the name, the server and the member number, so the text doesn't.
        for (const t of [en, de]) {
            expect(fillGreeting(t.welcome.defaultMessage, lena)).toContain("<@42>");
            expect(fillGreeting(t.goodbye.defaultMessage, lena)).toContain("128");
            for (const kind of ["welcome", "goodbye"] as const) {
                expect(fillGreeting(t[kind].defaultMessage, lena)).not.toMatch(/[{}]/);
            }
        }
    });
});
