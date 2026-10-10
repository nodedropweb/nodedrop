// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { WaveConfigViewModel } from "@/app/view/waveconfig/waveconfig-model";
import { useWaveEnv } from "@/app/waveenv/waveenv";
import { base64ToString, stringToBase64 } from "@/util/util";
import * as React from "react";
import { makeMockNodeModel } from "../mock/mock-node-model";
import { useRpcOverride } from "../mock/use-rpc-override";

const PreviewNodeId = "preview-waveaiwizard-node";
const PreviewBlockId = "preview-waveaiwizard-block";

// In-memory stand-in for ~/.config/nodedrop/waveai.json
let mockWaveAiJson = JSON.stringify(
    {
        "ollama@llama3.3": {
            "display:name": "Ollama - Llama 3.3",
            "display:order": 1,
            "display:icon": "microchip",
            "ai:provider": "custom",
            "ai:apitype": "openai-chat",
            "ai:model": "llama3.3:70b",
            "ai:endpoint": "http://localhost:11434/v1/chat/completions",
            "ai:apitoken": "not-needed",
            "ai:capabilities": ["tools"],
        },
    },
    null,
    2
);

export default function WaveAiWizardPreview() {
    const waveEnv = useWaveEnv();
    const [writes, setWrites] = React.useState(0);

    useRpcOverride("FileReadCommand", async () => ({ data64: stringToBase64(mockWaveAiJson) }));
    useRpcOverride("FileWriteCommand", async (_client, data) => {
        mockWaveAiJson = base64ToString(data.data64);
        setWrites((n) => n + 1);
        return null;
    });

    const model = React.useMemo(() => {
        const nodeModel = makeMockNodeModel({
            nodeId: PreviewNodeId,
            blockId: PreviewBlockId,
            innerRect: { width: "960px", height: "640px" },
        });
        return new WaveConfigViewModel({
            blockId: PreviewBlockId,
            nodeModel,
            tabModel: null as any,
            waveEnv,
        } as any);
    }, [waveEnv]);

    return (
        <div className="flex w-full max-w-[1000px] flex-col gap-2 px-6 py-6">
            <div className="text-xs text-muted font-mono">
                Wave AI Modes wizard (mock RPC: file read/write in memory, secrets in memory). File writes: {writes}
            </div>
            <div className="rounded-md border border-border bg-panel">
                <div className="h-[640px]">
                    <model.viewComponent blockId={PreviewBlockId} blockRef={null} contentRef={null} model={model} />
                </div>
            </div>
            <pre className="text-xs font-mono bg-black/30 rounded p-3 overflow-auto max-h-60" data-testid="mock-file">
                {mockWaveAiJson}
            </pre>
        </div>
    );
}
