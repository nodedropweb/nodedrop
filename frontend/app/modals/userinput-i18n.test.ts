// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import de from "../../util/i18n/locales/de.json";
import en from "../../util/i18n/locales/en.json";
import { translateUserInputRequest } from "./userinput-i18n";

function makeT(dict: any) {
    return (key: string, opts?: Record<string, unknown>) => {
        let v: any = key.split(".").reduce((o, p) => o?.[p], dict) ?? key;
        for (const [k, val] of Object.entries(opts ?? {})) v = String(v).split(`{{${k}}}`).join(String(val));
        return v;
    };
}

const wshRequest = {
    requestid: "1",
    responsetype: "confirm",
    title: "Install Wave Shell Extensions",
    querytext:
        'Wave requires Wave Shell Extensions to be\ninstalled on "joachim@drupaltutorials (joachim@49.12.86.22)"\nto ensure a seamless experience.\n\nWould you like to install them?',
    markdown: true,
    checkboxmsg: "Automatically install for all connections",
    oklabel: "Install ndsh",
    cancellabel: "No ndsh",
} as UserInputRequest;

describe("translateUserInputRequest", () => {
    it("translates the ndsh install prompt into German incl. the connection name", () => {
        const r = translateUserInputRequest(wshRequest, makeT(de));
        expect(r.title).toBe("Wave-Shell-Erweiterungen installieren");
        expect(r.oklabel).toBe("ndsh installieren");
        expect(r.cancellabel).toBe("Kein ndsh");
        expect(r.checkboxmsg).toBe("Automatisch für alle Verbindungen installieren");
        expect(r.querytext).toContain('"joachim@drupaltutorials (joachim@49.12.86.22)"');
        expect(r.querytext).toContain("Möchtest du sie installieren?");
    });

    it("keeps the English wording in English", () => {
        const r = translateUserInputRequest(wshRequest, makeT(en));
        expect(r.title).toBe("Install Wave Shell Extensions");
        expect(r.oklabel).toBe("Install ndsh");
        expect(r.querytext).toContain("Would you like to install them?");
    });

    it("leaves unknown texts untouched", () => {
        const req = { ...wshRequest, title: "Something new", querytext: "Free text", oklabel: "", checkboxmsg: "" } as UserInputRequest;
        const r = translateUserInputRequest(req, makeT(de));
        expect(r.title).toBe("Something new");
        expect(r.querytext).toBe("Free text");
        expect(r.oklabel).toBe("");
    });

    it("translates the passphrase prompt", () => {
        const req = { ...wshRequest, title: "Publickey Auth + Passphrase", querytext: "Enter passphrase for the SSH key: /home/a/.ssh/id" } as UserInputRequest;
        const r = translateUserInputRequest(req, makeT(de));
        expect(r.querytext).toBe("Passphrase für den SSH-Schlüssel eingeben: /home/a/.ssh/id");
    });
});
