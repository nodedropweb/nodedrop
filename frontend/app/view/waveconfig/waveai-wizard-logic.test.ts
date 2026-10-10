// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
    buildModeConfig,
    endpointLooksLikeBaseUrl,
    generateModeKey,
    makeInitialState,
    mergeModeConfig,
    ModeKeyRegex,
    nextDisplayOrder,
    parseModes,
    secretNameFor,
    stateFromMode,
    validateWizardState,
} from "./waveai-wizard-logic";

describe("buildModeConfig", () => {
    it("openai: writes only what the backend cannot derive", () => {
        const s = makeInitialState("openai");
        s.name = "GPT-4o";
        s.model = "gpt-4o";
        expect(buildModeConfig(s)).toEqual({
            "display:name": "GPT-4o",
            "ai:provider": "openai",
            "ai:model": "gpt-4o",
        });
    });

    it("openrouter: writes capabilities (not auto-detected)", () => {
        const s = makeInitialState("openrouter");
        s.name = "Qwen";
        s.model = "qwen/qwen-2.5-coder-32b-instruct";
        s.capabilities = ["tools"];
        expect(buildModeConfig(s)["ai:capabilities"]).toEqual(["tools"]);
        expect(buildModeConfig(s)["ai:provider"]).toBe("openrouter");
    });

    it("local: custom provider, full endpoint, dummy token, chat api type", () => {
        const s = makeInitialState("local");
        s.name = "Llama";
        s.model = "llama3.3:70b";
        expect(buildModeConfig(s)).toMatchObject({
            "ai:provider": "custom",
            "ai:apitype": "openai-chat",
            "ai:endpoint": "http://localhost:11434/v1/chat/completions",
            "ai:apitoken": "not-needed",
        });
    });

    it("custom: uses the user's secret name and selected api type", () => {
        const s = makeInitialState("custom");
        s.name = "Grok";
        s.model = "grok-4-1-fast-reasoning";
        s.endpoint = " https://api.x.ai/v1/chat/completions ";
        s.secretName = "XAI_KEY";
        s.apiType = "openai-responses";
        const cfg = buildModeConfig(s);
        expect(cfg["ai:endpoint"]).toBe("https://api.x.ai/v1/chat/completions");
        expect(cfg["ai:apitokensecretname"]).toBe("XAI_KEY");
        expect(cfg["ai:apitype"]).toBe("openai-responses");
    });

    it("azure-legacy: resource + deployment, no model required", () => {
        const s = makeInitialState("azure-legacy");
        s.name = "Azure";
        s.azureResourceName = "my-res";
        s.azureDeployment = "dep1";
        const cfg = buildModeConfig(s);
        expect(cfg["ai:azureresourcename"]).toBe("my-res");
        expect(cfg["ai:azuredeployment"]).toBe("dep1");
        expect(cfg["ai:model"]).toBeUndefined();
        expect(validateWizardState(s, "details", false)).toEqual({});
    });
});

describe("validateWizardState", () => {
    it("requires name and model", () => {
        const s = makeInitialState("openai");
        expect(validateWizardState(s, "details", false)).toEqual({ name: "required", model: "required" });
    });

    it("rejects non-http endpoints and bad azure resource names", () => {
        const c = makeInitialState("custom");
        c.name = "x";
        c.model = "m";
        c.endpoint = "localhost:1234";
        expect(validateWizardState(c, "details", false).endpoint).toBe("badUrl");
        const a = makeInitialState("azure");
        a.name = "x";
        a.model = "m";
        a.azureResourceName = "My_Res";
        expect(validateWizardState(a, "details", false).azureResourceName).toBe("badAzureResource");
    });

    it("api key is only required if no secret exists yet", () => {
        const s = makeInitialState("openai");
        expect(validateWizardState(s, "key", false).apiKey).toBe("required");
        expect(validateWizardState(s, "key", true)).toEqual({});
    });

    it("custom provider needs a valid secret name", () => {
        const s = makeInitialState("custom");
        s.apiKey = "k";
        expect(validateWizardState(s, "key", false).secretName).toBe("required");
        s.secretName = "1bad name";
        expect(validateWizardState(s, "key", false).secretName).toBe("badSecretName");
        s.secretName = "GOOD_NAME";
        expect(validateWizardState(s, "key", false)).toEqual({});
    });

    it("local needs no key", () => {
        const s = makeInitialState("local");
        expect(validateWizardState(s, "key", false)).toEqual({});
    });
});

describe("helpers", () => {
    it("detects base urls without the api path", () => {
        expect(endpointLooksLikeBaseUrl("https://api.x.ai/v1")).toBe(true);
        expect(endpointLooksLikeBaseUrl("https://api.x.ai/v1/chat/completions")).toBe(false);
        expect(endpointLooksLikeBaseUrl("https://x/v1/responses")).toBe(false);
    });

    it("generates unique, schema-valid mode keys", () => {
        const s = makeInitialState("openrouter");
        s.model = "Qwen/Qwen 2.5 Coder:32B";
        const k1 = generateModeKey(s, []);
        expect(k1).toBe("openrouter@qwen-qwen-2.5-coder-32b");
        expect(ModeKeyRegex.test(k1)).toBe(true);
        expect(generateModeKey(s, [k1])).toBe(`${k1}-2`);
        const l = makeInitialState("local");
        l.model = "llama3.3:70b";
        expect(generateModeKey(l, [])).toBe("ollama@llama3.3-70b");
    });

    it("secretNameFor prefers the provider default", () => {
        expect(secretNameFor(makeInitialState("openai"))).toBe("OPENAI_KEY");
        const c = makeInitialState("custom");
        c.secretName = " MY_KEY ";
        expect(secretNameFor(c)).toBe("MY_KEY");
    });

    it("nextDisplayOrder ignores negative built-in orders", () => {
        expect(nextDisplayOrder({ a: { "display:order": -3 }, b: { "display:order": 4 }, c: {} })).toBe(5);
        expect(nextDisplayOrder({})).toBe(1);
    });

    it("mergeModeConfig keeps foreign keys and order, drops stale managed keys", () => {
        const existing = {
            "display:name": "Old",
            "display:order": 7,
            "display:icon": "star",
            "ai:proxyurl": "http://proxy",
            "ai:thinkinglevel": "high",
        };
        const merged = mergeModeConfig(existing, { "display:name": "New", "ai:model": "m" });
        expect(merged).toEqual({
            "display:name": "New",
            "display:order": 7,
            "display:icon": "star",
            "ai:proxyurl": "http://proxy",
            "ai:model": "m",
        });
    });

    it("stateFromMode round-trips an openai mode and recognises local endpoints", () => {
        const s = stateFromMode({ "display:name": "A", "ai:provider": "openai", "ai:model": "gpt-4o" });
        expect(s.providerId).toBe("openai");
        expect(s.model).toBe("gpt-4o");
        const l = stateFromMode({
            "display:name": "L",
            "ai:model": "x",
            "ai:endpoint": "http://localhost:1234/v1/chat/completions",
        });
        expect(l.providerId).toBe("local");
        expect(l.localPreset).toBe("lmstudio");
    });

    it("parseModes tolerates empty files and rejects invalid json", () => {
        expect(parseModes("")).toEqual({});
        expect(parseModes("{\n\n}")).toEqual({});
        expect(parseModes("{oops")).toBeNull();
        expect(parseModes("[]")).toBeNull();
    });
});
