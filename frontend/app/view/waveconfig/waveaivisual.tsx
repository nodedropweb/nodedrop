// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { globalStore } from "@/app/store/jotaiStore";
import { TabRpcClient } from "@/app/store/wshrpcutil";
import {
    buildModeConfig,
    endpointLooksLikeBaseUrl,
    generateModeKey,
    getProvider,
    isBuiltInModeKey,
    LocalPresets,
    makeInitialState,
    mergeModeConfig,
    nextDisplayOrder,
    parseModes,
    Providers,
    secretNameFor,
    stateFromMode,
    validateWizardState,
    type Capability,
    type StepId,
    type ThinkingLevel,
    type WizardErrors,
    type WizardProviderId,
    type WizardState,
} from "@/app/view/waveconfig/waveai-wizard-logic";
import type { WaveConfigViewModel } from "@/app/view/waveconfig/waveconfig-model";
import { cn } from "@/util/util";
import { useAtomValue } from "jotai";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Step = "intro" | "provider" | "details" | "key" | "summary";

const inputClass =
    "px-3 py-2 bg-zinc-800 border rounded focus:outline-none w-full disabled:opacity-60 border-zinc-600 focus:border-accent-500";
const primaryBtn =
    "px-4 py-2 bg-accent-600 hover:bg-accent-500 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";
const secondaryBtn = "px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded cursor-pointer disabled:opacity-50";

function needsKeyStep(state: WizardState): boolean {
    return getProvider(state.providerId).needsApiKey;
}

function nextStep(step: Step, state: WizardState): Step {
    if (step === "intro") return "provider";
    if (step === "provider") return "details";
    if (step === "details") return needsKeyStep(state) ? "key" : "summary";
    return "summary";
}

function prevStep(step: Step, state: WizardState): Step | null {
    if (step === "provider") return "intro";
    if (step === "details") return "provider";
    if (step === "key") return "details";
    if (step === "summary") return needsKeyStep(state) ? "key" : "details";
    return null;
}

const FieldRow = memo(
    ({
        label,
        hint,
        error,
        warning,
        children,
    }: {
        label: string;
        hint?: string;
        error?: string;
        warning?: string;
        children: React.ReactNode;
    }) => (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {error ? (
                <div className="text-xs text-red-400">{error}</div>
            ) : warning ? (
                <div className="text-xs text-yellow-400">{warning}</div>
            ) : hint ? (
                <div className="text-xs text-zinc-400">{hint}</div>
            ) : null}
        </div>
    )
);
FieldRow.displayName = "FieldRow";

const StepIndicator = memo(({ step, hasKeyStep, editing }: { step: Step; hasKeyStep: boolean; editing: boolean }) => {
    const { t } = useTranslation();
    const all = ([
        { id: "intro", label: t("waveConfig.wizard.stepIntro") },
        { id: "provider", label: t("waveConfig.wizard.stepProvider") },
        { id: "details", label: t("waveConfig.wizard.stepDetails") },
        ...(hasKeyStep ? [{ id: "key", label: t("waveConfig.wizard.stepKey") }] : []),
        { id: "summary", label: t("waveConfig.wizard.stepSummary") },
    ] as { id: Step; label: string }[]).filter(
        (s) => !(editing && (s.id === "intro" || s.id === "provider"))
    );
    const idx = all.findIndex((s) => s.id === step);
    return (
        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
            {all.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded-full",
                            i === idx && "bg-accent-600 text-white",
                            i < idx && "bg-zinc-700 text-zinc-200"
                        )}
                    >
                        {i + 1}. {s.label}
                    </span>
                    {i < all.length - 1 && <i className="fa-sharp fa-solid fa-chevron-right text-[10px]" />}
                </div>
            ))}
        </div>
    );
});
StepIndicator.displayName = "StepIndicator";

interface WizardProps {
    model: WaveConfigViewModel;
    editKey: string | null;
    initial: WizardState | null;
    existingKeys: string[];
    onClose: () => void;
}

const Wizard = memo(({ model, editKey, initial, existingKeys, onClose }: WizardProps) => {
    const { t } = useTranslation();
    const editing = editKey != null;
    const [step, setStep] = useState<Step>(editing ? "details" : "intro");
    const [state, setState] = useState<WizardState>(initial ?? makeInitialState("openai"));
    const [errors, setErrors] = useState<WizardErrors>({});
    const [secretNames, setSecretNames] = useState<string[]>([]);
    const [showKey, setShowKey] = useState(false);
    const [busy, setBusy] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const provider = getProvider(state.providerId);
    const secretName = secretNameFor(state);
    const keyExists = secretNames.includes(secretName);

    const update = useCallback((patch: Partial<WizardState>) => {
        setState((s) => ({ ...s, ...patch }));
    }, []);

    useEffect(() => {
        let cancelled = false;
        model.env.rpc
            .GetSecretsNamesCommand(TabRpcClient)
            .then((names) => {
                if (!cancelled) setSecretNames(names ?? []);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [model]);

    const errText = (key?: string) => (key ? t(`waveConfig.wizard.err.${key}`) : undefined);

    const modeKey = editKey ?? generateModeKey(state, existingKeys);
    const built = useMemo(() => buildModeConfig(state), [state]);

    const chooseProvider = (id: WizardProviderId) => {
        const fresh = makeInitialState(id);
        // keep what the user already typed when they come back and switch provider
        setState({ ...fresh, name: state.name, model: "" });
        setErrors({});
        setStep("details");
    };

    const goNext = () => {
        if (step === "details" || step === "key") {
            const errs = validateWizardState(state, step as StepId, keyExists);
            setErrors(errs);
            if (Object.keys(errs).length > 0) return;
        }
        setErrors({});
        setStep(nextStep(step, state));
    };

    const goBack = () => {
        const p = prevStep(step, state);
        if (editing && (p == null || p === "provider" || p === "intro")) {
            onClose();
            return;
        }
        if (p == null) onClose();
        else {
            setErrors({});
            setStep(p);
        }
    };

    const save = async () => {
        setBusy(true);
        setSaveError(null);
        try {
            const modes = parseModes(globalStore.get(model.fileContentAtom));
            if (modes == null) {
                setSaveError(t("waveConfig.wizard.invalidJson"));
                return;
            }
            if (provider.needsApiKey && state.apiKey.trim() !== "") {
                try {
                    await model.env.rpc.SetSecretsCommand(TabRpcClient, { [secretName]: state.apiKey.trim() });
                } catch (e) {
                    setSaveError(t("waveConfig.wizard.err.keyFailed", { error: e?.message ?? String(e) }));
                    return;
                }
            }
            const existing = modes[modeKey];
            const merged = mergeModeConfig(existing, built);
            if (!("display:order" in merged)) merged["display:order"] = nextDisplayOrder(modes);
            modes[modeKey] = merged;
            globalStore.set(model.fileContentAtom, JSON.stringify(modes, null, 2));
            model.markAsEdited();
            await model.saveFile();
            if (globalStore.get(model.hasEditedAtom)) {
                // saveFile reports its own error banner (validation / write failure)
                const msg =
                    globalStore.get(model.validationErrorAtom) ??
                    globalStore.get(model.errorMessageAtom) ??
                    t("waveConfig.wizard.err.saveFailed", { error: "" });
                model.discardChanges();
                setSaveError(msg);
                return;
            }
            if (state.setAsDefault) {
                await model.env.rpc.SetConfigCommand(TabRpcClient, { "waveai:defaultmode": modeKey });
            }
            setDone(true);
        } catch (e) {
            setSaveError(t("waveConfig.wizard.err.saveFailed", { error: e?.message ?? String(e) }));
        } finally {
            setBusy(false);
        }
    };

    const renderIntro = () => (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">{t("waveConfig.wizard.introTitle")}</h3>
            <p className="text-zinc-300">{t("waveConfig.wizard.introBody")}</p>
            <ul className="flex flex-col gap-3">
                {(["introCloud", "introLocal", "introCustom", "introKeys", "introNoTypos"] as const).map((k, i) => (
                    <li key={k} className="flex gap-3 items-start">
                        <i
                            className={cn(
                                "fa-sharp fa-solid mt-1 w-4 text-accent-500",
                                ["fa-cloud", "fa-server", "fa-plug", "fa-key", "fa-wand-magic-sparkles"][i]
                            )}
                        />
                        <span className="text-zinc-300">{t(`waveConfig.wizard.${k}`)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderProvider = () => (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">{t("waveConfig.wizard.chooseProvider")}</h3>
            <div className="grid grid-cols-1 @w600:grid-cols-2 gap-3">
                {Providers.map((p) => (
                    <button
                        key={p.id}
                        className={cn(
                            "flex gap-3 items-start text-left p-4 rounded-lg border cursor-pointer transition-colors",
                            state.providerId === p.id
                                ? "border-accent-500 bg-zinc-700/60"
                                : "border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/50"
                        )}
                        onClick={() => chooseProvider(p.id)}
                    >
                        <i className={cn("fa-sharp fa-solid mt-1 text-accent-500 w-5", `fa-${p.icon}`)} />
                        <span className="flex flex-col gap-0.5">
                            <span className="font-medium">{t(`waveConfig.wizard.providers.${p.id}.name`)}</span>
                            <span className="text-xs text-zinc-400">{t(`waveConfig.wizard.providers.${p.id}.desc`)}</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    const toggleCap = (cap: Capability) => {
        const has = state.capabilities.includes(cap);
        update({ capabilities: has ? state.capabilities.filter((c) => c !== cap) : [...state.capabilities, cap] });
    };

    const localPreset = LocalPresets.find((p) => p.id === state.localPreset) ?? LocalPresets[0];
    const modelExample =
        state.providerId === "local" ? localPreset.modelPlaceholder : provider.modelPlaceholder;

    const renderDetails = () => (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
                <i className={cn("fa-sharp fa-solid text-accent-500", `fa-${provider.icon}`)} />
                {t(`waveConfig.wizard.providers.${provider.id}.name`)}
            </h3>
            {state.providerId === "local" && (
                <FieldRow label={t("waveConfig.wizard.localServer")}>
                    <div className="flex gap-2 flex-wrap">
                        {LocalPresets.map((p) => (
                            <button
                                key={p.id}
                                className={cn(
                                    "px-3 py-1.5 rounded border cursor-pointer text-sm",
                                    state.localPreset === p.id
                                        ? "border-accent-500 bg-zinc-700"
                                        : "border-zinc-600 hover:bg-zinc-700/50"
                                )}
                                onClick={() =>
                                    update({
                                        localPreset: p.id,
                                        endpoint: p.id === "other" ? "" : p.endpoint,
                                    })
                                }
                            >
                                {p.id === "other" ? t("waveConfig.wizard.localOther") : p.label}
                            </button>
                        ))}
                    </div>
                </FieldRow>
            )}
            <FieldRow
                label={t("waveConfig.wizard.name")}
                hint={t("waveConfig.wizard.nameHint")}
                error={errText(errors.name)}
            >
                <input
                    className={inputClass}
                    value={state.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder={t("waveConfig.wizard.namePlaceholder")}
                    autoFocus
                />
            </FieldRow>
            {provider.needsAzure && (
                <FieldRow
                    label={t("waveConfig.wizard.azureResource")}
                    hint={t("waveConfig.wizard.azureResourceHint")}
                    error={errText(errors.azureResourceName)}
                >
                    <input
                        className={inputClass}
                        value={state.azureResourceName}
                        onChange={(e) => update({ azureResourceName: e.target.value })}
                        placeholder="my-resource"
                    />
                </FieldRow>
            )}
            {provider.needsDeployment && (
                <FieldRow label={t("waveConfig.wizard.azureDeployment")} error={errText(errors.azureDeployment)}>
                    <input
                        className={inputClass}
                        value={state.azureDeployment}
                        onChange={(e) => update({ azureDeployment: e.target.value })}
                        placeholder="my-deployment"
                    />
                </FieldRow>
            )}
            <FieldRow
                label={t("waveConfig.wizard.model")}
                hint={t("waveConfig.wizard.modelHint", { example: modelExample })}
                error={errText(errors.model)}
            >
                <input
                    className={inputClass}
                    value={state.model}
                    onChange={(e) => update({ model: e.target.value })}
                    placeholder={modelExample}
                />
            </FieldRow>
            {provider.needsEndpoint && (
                <FieldRow
                    label={t("waveConfig.wizard.endpoint")}
                    hint={t("waveConfig.wizard.endpointHint")}
                    error={errText(errors.endpoint)}
                    warning={
                        endpointLooksLikeBaseUrl(state.endpoint) ? t("waveConfig.wizard.endpointBaseWarn") : undefined
                    }
                >
                    <input
                        className={cn(inputClass, "font-mono text-sm")}
                        value={state.endpoint}
                        onChange={(e) => update({ endpoint: e.target.value })}
                        placeholder="https://api.example.com/v1/chat/completions"
                    />
                </FieldRow>
            )}
            {state.providerId === "custom" && (
                <FieldRow label={t("waveConfig.wizard.apiType")}>
                    <select
                        className={inputClass}
                        value={state.apiType}
                        onChange={(e) => update({ apiType: e.target.value as WizardState["apiType"] })}
                    >
                        <option value="openai-chat">{t("waveConfig.wizard.apiTypeChat")}</option>
                        <option value="openai-responses">{t("waveConfig.wizard.apiTypeResponses")}</option>
                    </select>
                </FieldRow>
            )}
            <FieldRow label={t("waveConfig.wizard.thinking")} hint={t("waveConfig.wizard.thinkingHint")}>
                <select
                    className={inputClass}
                    value={state.thinkingLevel}
                    onChange={(e) => update({ thinkingLevel: e.target.value as ThinkingLevel })}
                >
                    <option value="">{t("waveConfig.wizard.thinkingNone")}</option>
                    <option value="low">{t("waveConfig.wizard.thinkingLow")}</option>
                    <option value="medium">{t("waveConfig.wizard.thinkingMedium")}</option>
                    <option value="high">{t("waveConfig.wizard.thinkingHigh")}</option>
                </select>
            </FieldRow>
            <FieldRow
                label={t("waveConfig.wizard.capabilities")}
                hint={provider.autoCapabilities ? t("waveConfig.wizard.capsAuto") : t("waveConfig.wizard.capsHint")}
            >
                {!provider.autoCapabilities && (
                    <div className="flex flex-col gap-1.5">
                        {(["tools", "images", "pdfs"] as Capability[]).map((cap) => (
                            <label key={cap} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={state.capabilities.includes(cap)}
                                    onChange={() => toggleCap(cap)}
                                />
                                <span>{t(`waveConfig.wizard.cap_${cap}`)}</span>
                            </label>
                        ))}
                    </div>
                )}
            </FieldRow>
        </div>
    );

    const renderKey = () => (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">{t("waveConfig.wizard.keyTitle")}</h3>
            <p className="text-zinc-300">{t("waveConfig.wizard.keyBody")}</p>
            {state.providerId === "custom" ? (
                <FieldRow
                    label={t("waveConfig.wizard.secretName")}
                    hint={t("waveConfig.wizard.secretNameCustomHint")}
                    error={errText(errors.secretName)}
                >
                    <input
                        className={cn(inputClass, "font-mono")}
                        value={state.secretName}
                        onChange={(e) => update({ secretName: e.target.value })}
                        placeholder="MY_API_KEY"
                    />
                </FieldRow>
            ) : (
                <FieldRow label={t("waveConfig.wizard.secretName")} hint={t("waveConfig.wizard.secretNameFixedHint")}>
                    <input className={cn(inputClass, "font-mono")} value={secretName} disabled />
                </FieldRow>
            )}
            <div
                className={cn(
                    "flex items-center gap-2 text-sm",
                    keyExists ? "text-green-400" : "text-yellow-400"
                )}
            >
                <i className={cn("fa-sharp fa-solid", keyExists ? "fa-circle-check" : "fa-triangle-exclamation")} />
                {keyExists ? t("waveConfig.wizard.keyExists") : t("waveConfig.wizard.keyMissing")}
            </div>
            <FieldRow label={t("waveConfig.wizard.keyValue")} error={errText(errors.apiKey)}>
                <div className="flex gap-2">
                    <input
                        className={cn(inputClass, "font-mono")}
                        type={showKey ? "text" : "password"}
                        value={state.apiKey}
                        onChange={(e) => update({ apiKey: e.target.value })}
                        placeholder={keyExists ? t("waveConfig.wizard.keyKeepPlaceholder") : "sk-..."}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button className={secondaryBtn} onClick={() => setShowKey((v) => !v)} type="button">
                        <i className={cn("fa-sharp fa-solid", showKey ? "fa-eye-slash" : "fa-eye")} />
                    </button>
                </div>
            </FieldRow>
            {provider.keyUrl && (
                <a
                    href={provider.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent-500 underline hover:text-accent-400 w-fit"
                >
                    {t("waveConfig.wizard.getKey")}
                </a>
            )}
        </div>
    );

    const renderSummary = () => (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">{t("waveConfig.wizard.summaryTitle")}</h3>
            <p className="text-zinc-300">{t("waveConfig.wizard.summaryBody", { key: modeKey })}</p>
            <pre className="font-mono text-xs bg-black/30 rounded p-3 overflow-auto max-h-64">
                {JSON.stringify({ [modeKey]: built }, null, 2)}
            </pre>
            {provider.needsApiKey && (
                <div className="text-sm text-zinc-400">
                    <i className="fa-sharp fa-solid fa-key mr-2" />
                    {state.apiKey.trim() !== ""
                        ? t("waveConfig.wizard.summaryKeyWillBeStored", { name: secretName })
                        : t("waveConfig.wizard.summaryKeyKept", { name: secretName })}
                </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={state.setAsDefault}
                    onChange={(e) => update({ setAsDefault: e.target.checked })}
                />
                <span>{t("waveConfig.wizard.setDefault")}</span>
            </label>
            {saveError && (
                <div className="flex items-start gap-2 p-3 border rounded-lg bg-red-500/10 border-red-500/20 text-red-400">
                    <i className="fa-sharp fa-solid fa-circle-exclamation mt-0.5" />
                    <span>{saveError}</span>
                </div>
            )}
        </div>
    );

    if (done) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 h-full p-8 text-center">
                <i className="fa-sharp fa-solid fa-circle-check text-4xl text-green-400" />
                <div className="text-lg font-semibold">{t("waveConfig.wizard.saved")}</div>
                <div className="text-zinc-400 max-w-md">{t("waveConfig.wizard.savedHint")}</div>
                <button className={primaryBtn} onClick={onClose}>
                    {t("waveConfig.wizard.done")}
                </button>
            </div>
        );
    }

    return (
        <div className="@container flex flex-col h-full">
            <div className="px-6 py-3 border-b border-border">
                <StepIndicator step={step} hasKeyStep={needsKeyStep(state)} editing={editing} />
            </div>
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl">
                    {step === "intro" && renderIntro()}
                    {step === "provider" && renderProvider()}
                    {step === "details" && renderDetails()}
                    {step === "key" && renderKey()}
                    {step === "summary" && renderSummary()}
                </div>
            </div>
            <div className="flex justify-between gap-2 px-6 py-3 border-t border-border">
                <button className={secondaryBtn} onClick={onClose} disabled={busy}>
                    {t("modal.cancel")}
                </button>
                <div className="flex gap-2">
                    {prevStep(step, state) != null && !(editing && step === "details") && (
                        <button className={secondaryBtn} onClick={goBack} disabled={busy}>
                            {t("waveConfig.wizard.back")}
                        </button>
                    )}
                    {step === "summary" ? (
                        <button className={primaryBtn} onClick={save} disabled={busy}>
                            {busy && <i className="fa-sharp fa-solid fa-spinner fa-spin" />}
                            {busy ? t("waveConfig.saving") : t("waveConfig.wizard.saveModel")}
                        </button>
                    ) : step !== "provider" ? (
                        <button className={primaryBtn} onClick={goNext}>
                            {step === "intro" ? t("waveConfig.wizard.start") : t("waveConfig.wizard.next")}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
});
Wizard.displayName = "Wizard";

interface WaveAIVisualContentProps {
    model: WaveConfigViewModel;
}

export const WaveAIVisualContent = memo(({ model }: WaveAIVisualContentProps) => {
    const { t } = useTranslation();
    const fileContent = useAtomValue(model.fileContentAtom);
    const fullConfig = useAtomValue(model.env.atoms.fullConfigAtom);
    const defaultMode = fullConfig?.settings?.["waveai:defaultmode"];
    const [wizard, setWizard] = useState<{ editKey: string | null; initial: WizardState | null } | null>(null);
    const [listError, setListError] = useState<string | null>(null);

    const modes = useMemo(() => parseModes(fileContent), [fileContent]);
    const customKeys = useMemo(() => {
        if (modes == null) return [];
        return Object.keys(modes)
            .filter((k) => !isBuiltInModeKey(k))
            .sort((a, b) => (modes[a]?.["display:order"] ?? 0) - (modes[b]?.["display:order"] ?? 0));
    }, [modes]);

    const deleteMode = useCallback(
        async (key: string) => {
            if (modes == null) return;
            if (!window.confirm(t("waveConfig.wizard.deleteConfirm", { name: modes[key]?.["display:name"] ?? key })))
                return;
            const next = { ...modes };
            delete next[key];
            globalStore.set(model.fileContentAtom, JSON.stringify(next, null, 2));
            model.markAsEdited();
            await model.saveFile();
        },
        [modes, model, t]
    );

    const makeDefault = useCallback(
        async (key: string) => {
            setListError(null);
            try {
                await model.env.rpc.SetConfigCommand(TabRpcClient, { "waveai:defaultmode": key });
            } catch (e) {
                setListError(t("waveConfig.wizard.err.saveFailed", { error: e?.message ?? String(e) }));
            }
        },
        [model, t]
    );

    if (modes == null) {
        return (
            <div className="p-6 flex items-start gap-2 text-red-400">
                <i className="fa-sharp fa-solid fa-circle-exclamation mt-1" />
                <span>{t("waveConfig.wizard.invalidJson")}</span>
            </div>
        );
    }

    if (wizard != null) {
        return (
            <Wizard
                model={model}
                editKey={wizard.editKey}
                initial={wizard.initial}
                existingKeys={Object.keys(modes)}
                onClose={() => setWizard(null)}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 p-6 h-full overflow-auto">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-lg font-semibold">{t("waveConfig.wizard.yourModels")}</div>
                <button className={primaryBtn} onClick={() => setWizard({ editKey: null, initial: null })}>
                    <i className="fa-sharp fa-solid fa-wand-magic-sparkles" />
                    {t("waveConfig.wizard.addButton")}
                </button>
            </div>
            {listError && <div className="text-red-400 text-sm">{listError}</div>}
            {customKeys.length === 0 ? (
                <div className="flex flex-col gap-3 p-6 bg-zinc-800/50 rounded-lg">
                    <div className="font-medium">{t("waveConfig.wizard.noModels")}</div>
                    <div className="text-zinc-400 text-sm">{t("waveConfig.wizard.introBody")}</div>
                </div>
            ) : (
                <div className="flex flex-col divide-y divide-zinc-700 border border-zinc-700 rounded-lg">
                    {customKeys.map((key) => {
                        const m = modes[key];
                        return (
                            <div key={key} className="flex items-center gap-3 p-4">
                                <i className={cn("fa-sharp fa-solid text-accent-500 w-5", `fa-${m["display:icon"] || "sparkles"}`)} />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="font-medium truncate">
                                        {m["display:name"] ?? key}
                                        {defaultMode === key && (
                                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-accent-600/30 text-accent-500">
                                                {t("waveConfig.wizard.defaultBadge")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-400 truncate">
                                        {[m["ai:provider"], m["ai:model"]].filter(Boolean).join(" · ")} · {key}
                                    </div>
                                </div>
                                {defaultMode !== key && (
                                    <button
                                        className="text-sm text-zinc-300 hover:text-white cursor-pointer"
                                        onClick={() => makeDefault(key)}
                                    >
                                        {t("waveConfig.wizard.makeDefault")}
                                    </button>
                                )}
                                <button
                                    className="text-sm text-zinc-300 hover:text-white cursor-pointer"
                                    onClick={() => setWizard({ editKey: key, initial: stateFromMode(m) })}
                                >
                                    {t("waveConfig.wizard.edit")}
                                </button>
                                <button
                                    className="text-sm text-red-400 hover:text-red-300 cursor-pointer"
                                    onClick={() => deleteMode(key)}
                                >
                                    {t("builderFiles.delete")}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="text-xs text-zinc-500">{t("waveConfig.wizard.builtinNote")}</div>
        </div>
    );
});

WaveAIVisualContent.displayName = "WaveAIVisualContent";
