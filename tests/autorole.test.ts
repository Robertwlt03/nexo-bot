import { describe, expect, it } from "vitest";
import { autoroleProblem } from "../src/autorole.ts";

const role = { id: "role", managed: false, editable: true };

describe("autoroleProblem", () => {
    it("accepts a normal role below Nexo's own", () => {
        expect(autoroleProblem(role, "server", true)).toBeUndefined();
    });

    it("names what Discord would refuse, most basic reason first", () => {
        expect(autoroleProblem({ ...role, id: "server" }, "server", true)).toBe("everyone");
        expect(autoroleProblem({ ...role, managed: true, editable: false }, "server", true)).toBe(
            "managed",
        );
        expect(autoroleProblem({ ...role, editable: false }, "server", false)).toBe(
            "no-permission",
        );
        expect(autoroleProblem({ ...role, editable: false }, "server", true)).toBe("too-high");
    });
});
