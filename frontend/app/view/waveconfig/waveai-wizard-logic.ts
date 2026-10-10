// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

// Pure logic for the Wave AI "bring your own key" wizard (no React, no RPC).
// The provider defaults mirror pkg/aiusechat/usechat-mode.go (applyProviderDefaults):
// for the hosted providers the backend fills in endpoint, API type and secret name itself,
// so the wizard only writes the fields the user actually has to decide.

export type WizardProviderId =
    | "openai"
    | "openrouter"
    | "groq"
    | "nanogpt"
    | "google"
    | "azure"
    | "azure-legacy"
    | "local"
    | "custom";

export type LocalPresetId = "ollama" | "lmstudio" | "vllm" | "other";
export type ThinkingLevel = "" | "low" | "medium" | "high";
export type ApiType = "openai-chat" | "openai-responses";
export type Capability = "tools" | "images" | "pdfs";

export const SecretNameRegex = /^[A-Za-z][A-Za-z0-9_]*$/;
export const ModeKeyRegex = /^[a-zA-Z0-9_@.-]+$/;
export const AzureResourceNameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export type ProviderInfo = {
    id: WizardProviderId;
    // value written to "ai:provider" ("local" is only a wizard shortcut for "custom")
    configProvider: string;
    icon: string;
    // secret name the backend uses automatically (empty = user chooses / none)
    defaultSecretName: string;
    needsApiKey: boolean;
    // backend derives capabilities from the model, so we don't have to ask
    autoCapabilities: boolean;
    needsEndpoint: boolean;
    needsAzure: boolean;
    needsDeployment: boolean;
    modelPlaceholder: string;
    keyUrl?: string;
};

export const Providers: ProviderInfo[] = [
    {
        id: "openai",
        configProvider: "openai",
        icon: "bolt",
        defaultSecretName: "OPENAI_KEY",
        needsApiKey: true,
        autoCapabilities: true,
        needsEndpoint: false,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "gpt-4o",
        keyUrl: "https://platform.openai.com/api-keys",
    },
    {
        id: "openrouter",
        configProvider: "openrouter",
        icon: "route",
        defaultSecretName: "OPENROUTER_KEY",
        needsApiKey: true,
        autoCapabilities: false,
        needsEndpoint: false,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "qwen/qwen-2.5-coder-32b-instruct",
        keyUrl: "https://openrouter.ai/keys",
    },
    {
        id: "groq",
        configProvider: "groq",
        icon: "gauge-high",
        defaultSecretName: "GROQ_KEY",
        needsApiKey: true,
        autoCapabilities: false,
        needsEndpoint: false,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "moonshotai/kimi-k2-instruct",
        keyUrl: "https://console.groq.com/keys",
    },
    {
        id: "nanogpt",
        configProvider: "nanogpt",
        icon: "microchip",
        defaultSecretName: "NANOGPT_KEY",
        needsApiKey: true,
        autoCapabilities: false,
        needsEndpoint: false,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "zai-org/glm-4.7",
    },
    {
        id: "google",
        configProvider: "google",
        icon: "star",
        defaultSecretName: "GOOGLE_AI_KEY",
        needsApiKey: true,
        autoCapabilities: true,
        needsEndpoint: false,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "gemini-3.5-flash",
        keyUrl: "https://aistudio.google.com/apikey",
    },
    {
        id: "azure",
        configProvider: "azure",
        icon: "cloud",
        defaultSecretName: "AZURE_OPENAI_KEY",
        needsApiKey: true,
        autoCapabilities: false,
        needsEndpoint: false,
        needsAzure: true,
        needsDeployment: false,
        modelPlaceholder: "gpt-4.1",
    },
    {
        id: "azure-legacy",
        configProvider: "azure-legacy",
        icon: "cloud",
        defaultSecretName: "AZURE_OPENAI_KEY",
        needsApiKey: true,
        autoCapabilities: false,
        needsEndpoint: false,
        needsAzure: true,
        needsDeployment: true,
        modelPlaceholder: "gpt-4",
    },
    {
        id: "local",
        configProvider: "custom",
        icon: "server",
        defaultSecretName: "",
        needsApiKey: false,
        autoCapabilities: false,
        needsEndpoint: true,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "llama3.3:70b",
    },
    {
        id: "custom",
        configProvider: "custom",
        icon: "plug",
        defaultSecretName: "",
        needsApiKey: true,
        autoCapabilities: false,
        needsEndpoint: true,
        needsAzure: false,
        needsDeployment: false,
        modelPlaceholder: "grok-4-1-fast-reasoning",
    },
];

export function getProvider(id: WizardProviderId): ProviderInfo {
    return Providers.find((p) => p.id === id) ?? Providers[Providers.length - 1];
}

export const LocalPresets: { id: LocalPresetId; label: string; endpoint: string; modelPlaceholder: string }[] = [
    { id: "ollama", label: "Ollama", endpoint: "http://localhost:11434/v1/chat/completions", modelPlaceholder: "llama3.3:70b" },
    { id: "lmstudio", label: "LM Studio", endpoint: "http://localhost:1234/v1/chat/completions", modelPlaceholder: "qwen/qwen-2.5-coder-32b-instruct" },
    { id: "vllm", label: "vLLM", endpoint: "http://localhost:8000/v1/chat/completions", modelPlaceholder: "your-model-name" },
    { id: "other", label: "", endpoint: "", modelPlaceholder: "model-name" },
];

// Local servers ignore the token, but Wave requires one to be present.
export const LocalDummyToken = "not-needed";

export type WizardState = {
    providerId: WizardProviderId;
    localPreset: LocalPresetId;
    name: string;
    model: string;
    endpoint: string;
    apiType: ApiType;
    azureResourceName: string;
    azureDeployment: string;
    thinkingLevel: ThinkingLevel;
    capabilities: Capability[];
    secretName: string;
    apiKey: string;
    setAsDefault: boolean;
};

export function makeInitialState(providerId: WizardProviderId): WizardState {
    const provider = getProvider(providerId);
    const preset = LocalPresets[0];
    return {
        providerId,
        localPreset: "ollama",
        name: "",
        model: "",
        endpoint: providerId === "local" ? preset.endpoint : "",
        apiType: "openai-chat",
        azureResourceName: "",
        azureDeployment: "",
        thinkingLevel: "",
        capabilities: provider.autoCapabilities ? [] : ["tools"],
        secretName: provider.defaultSecretName,
        apiKey: "",
        setAsDefault: false,
    };
}

// Field names used for validation messages. Messages are i18n keys below "waveConfig.wizard.err".
export type WizardErrors = Partial<
    Record<
        "name" | "model" | "endpoint" | "azureResourceName" | "azureDeployment" | "secretName" | "apiKey",
        string
    >
>;

export type StepId = "details" | "key";

function isHttpUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

// keyExists: a secret with the chosen name is already stored, so an empty key field is fine.
export function validateWizardState(state: WizardState, step: StepId, keyExists: boolean): WizardErrors {
    const provider = getProvider(state.providerId);
    const errs: WizardErrors = {};
    if (step === "details") {
        if (state.name.trim() === "") errs.name = "required";
        if (state.model.trim() === "" && state.providerId !== "azure-legacy") errs.model = "required";
        if (provider.needsEndpoint) {
            const ep = state.endpoint.trim();
            if (ep === "") errs.endpoint = "required";
            else if (!isHttpUrl(ep)) errs.endpoint = "badUrl";
        }
        if (provider.needsAzure) {
            const res = state.azureResourceName.trim();
            if (res === "") errs.azureResourceName = "required";
            else if (res.length > 63 || !AzureResourceNameRegex.test(res)) errs.azureResourceName = "badAzureResource";
        }
        if (provider.needsDeployment && state.azureDeployment.trim() === "") errs.azureDeployment = "required";
    } else if (provider.needsApiKey) {
        if (state.providerId === "custom") {
            if (state.secretName.trim() === "") errs.secretName = "required";
            else if (!SecretNameRegex.test(state.secretName.trim())) errs.secretName = "badSecretName";
        }
        if (state.apiKey.trim() === "" && !keyExists) errs.apiKey = "required";
    }
    return errs;
}

// Soft hint (not an error): Wave expects the FULL endpoint, not just a base URL.
export function endpointLooksLikeBaseUrl(endpoint: string): boolean {
    const ep = endpoint.trim();
    if (!isHttpUrl(ep)) return false;
    const path = new URL(ep).pathname.toLowerCase();
    return !(path.includes("chat/completions") || path.includes("/responses"));
}

export function secretNameFor(state: WizardState): string {
    const provider = getProvider(state.providerId);
    return provider.defaultSecretName !== "" ? provider.defaultSecretName : state.secretName.trim();
}

export function sanitizeForKey(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function generateModeKey(state: WizardState, existingKeys: string[]): string {
    let prefix: string = state.providerId;
    if (state.providerId === "local") prefix = state.localPreset === "other" ? "local" : state.localPreset;
    const part = sanitizeForKey(state.model || state.azureDeployment || state.name) || "mode";
    const base = `${prefix}@${part}`;
    if (!existingKeys.includes(base)) return base;
    for (let i = 2; i < 1000; i++) {
        const candidate = `${base}-${i}`;
        if (!existingKeys.includes(candidate)) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
}

// Keys the wizard owns. Everything else in an existing mode (icon, proxyurl, ...) is preserved on edit.
export const ManagedKeys = [
    "display:name",
    "ai:provider",
    "ai:apitype",
    "ai:model",
    "ai:thinkinglevel",
    "ai:endpoint",
    "ai:apitoken",
    "ai:apitokensecretname",
    "ai:azureresourcename",
    "ai:azuredeployment",
    "ai:capabilities",
] as const;

export function buildModeConfig(state: WizardState): Record<string, any> {
    const provider = getProvider(state.providerId);
    const cfg: Record<string, any> = {};
    cfg["display:name"] = state.name.trim();
    cfg["ai:provider"] = provider.configProvider;
    if (state.model.trim() !== "") cfg["ai:model"] = state.model.trim();
    if (state.thinkingLevel !== "") cfg["ai:thinkinglevel"] = state.thinkingLevel;
    if (provider.needsEndpoint) {
        cfg["ai:endpoint"] = state.endpoint.trim();
        cfg["ai:apitype"] = state.providerId === "local" ? "openai-chat" : state.apiType;
    }
    if (provider.needsAzure) cfg["ai:azureresourcename"] = state.azureResourceName.trim();
    if (provider.needsDeployment) cfg["ai:azuredeployment"] = state.azureDeployment.trim();
    if (!provider.autoCapabilities && state.capabilities.length > 0) cfg["ai:capabilities"] = state.capabilities;
    if (state.providerId === "local") cfg["ai:apitoken"] = LocalDummyToken;
    else if (state.providerId === "custom") cfg["ai:apitokensecretname"] = state.secretName.trim();
    return cfg;
}

// Merge a freshly built config into an existing mode (edit) without losing foreign keys.
export function mergeModeConfig(existing: Record<string, any> | undefined, built: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = { ...(existing ?? {}) };
    for (const k of ManagedKeys) {
        if (!(k in built)) delete out[k];
    }
    return { ...out, ...built };
}

export function nextDisplayOrder(modes: Record<string, any>): number {
    let max = 0;
    for (const m of Object.values(modes)) {
        const o = m?.["display:order"];
        if (typeof o === "number" && o > max) max = o;
    }
    return max + 1;
}

export function isBuiltInModeKey(key: string): boolean {
    return key.startsWith("waveai@");
}

// Best-effort reverse mapping so existing modes can be opened in the wizard.
export function stateFromMode(mode: Record<string, any>): WizardState {
    const rawProvider = mode["ai:provider"] as string | undefined;
    let providerId: WizardProviderId = "custom";
    if (rawProvider != null && rawProvider !== "custom" && Providers.some((p) => p.id === rawProvider)) {
        providerId = rawProvider as WizardProviderId;
    } else {
        const ep = String(mode["ai:endpoint"] ?? "");
        if (LocalPresets.some((p) => p.endpoint !== "" && p.endpoint === ep) || /\/\/(localhost|127\.0\.0\.1)/.test(ep)) {
            providerId = "local";
        }
    }
    const state = makeInitialState(providerId);
    state.name = mode["display:name"] ?? "";
    state.model = mode["ai:model"] ?? "";
    state.endpoint = mode["ai:endpoint"] ?? state.endpoint;
    state.apiType = mode["ai:apitype"] === "openai-responses" ? "openai-responses" : "openai-chat";
    state.azureResourceName = mode["ai:azureresourcename"] ?? "";
    state.azureDeployment = mode["ai:azuredeployment"] ?? "";
    state.thinkingLevel = (mode["ai:thinkinglevel"] as ThinkingLevel) ?? "";
    if (Array.isArray(mode["ai:capabilities"])) state.capabilities = mode["ai:capabilities"];
    if (providerId === "custom" && mode["ai:apitokensecretname"]) state.secretName = mode["ai:apitokensecretname"];
    if (providerId === "local") {
        state.localPreset = LocalPresets.find((p) => p.endpoint !== "" && p.endpoint === state.endpoint)?.id ?? "other";
    }
    return state;
}

export function parseModes(json: string): Record<string, any> | null {
    const text = json.trim() === "" ? "{}" : json;
    try {
        const parsed = JSON.parse(text);
        if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
        return parsed;
    } catch {
        return null;
    }
}
