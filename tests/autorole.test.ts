import { describe, expect, it } from "vitest";
import { autoroleProblem } from "../src/autorole.ts";

const role = { id: "role", managed: false, editable: true };
const allowed = { askerAboveRole: true, canManageRoles: true };

describe("autoroleProblem", () => {
    it("accepts a normal role below the asker's and Nexo's own", () => {
        expect(autoroleProblem(role, "server", allowed)).toBeUndefined();
    });

    it("names what Discord would refuse, most basic reason first", () => {
        expect(autoroleProblem({ ...role, id: "server" }, "server", allowed)).toBe("everyone");
        const managed = { ...role, managed: true, editable: false };
        expect(autoroleProblem(managed, "server", allowed)).toBe("managed");
        const noPermission = { ...allowed, canManageRoles: false };
        expect(autoroleProblem({ ...role, editable: false }, "server", noPermission)).toBe(
            "no-permission",
        );
        expect(autoroleProblem({ ...role, editable: false }, "server", allowed)).toBe("too-high");
    });

    it("refuses a role that is not below the asker's own, even when Nexo could give it", () => {
        const asker = { ...allowed, askerAboveRole: false };
        expect(autoroleProblem(role, "server", asker)).toBe("above-you");
    });
});
