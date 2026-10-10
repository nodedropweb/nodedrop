// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

// The Go backend sends user-input prompts (ndsh install, SSH auth, known_hosts, ...) as fixed English
// strings and does not know the UI language. This maps the known prompts to translations in the
// frontend; anything that is not recognised is shown unchanged.

type TFn = (key: string, opts?: Record<string, unknown>) => string;

// exact English text from the backend -> key below "userInput.texts"
const KnownTexts: Record<string, string> = {
    "Install NodeDrop Shell Extensions": "installWshTitle",
    "Install ndsh": "installWshOk",
    "No ndsh": "installWshCancel",
    "Automatically install for all connections": "installWshAuto",
    "Publickey Auth + Passphrase": "passphraseTitle",
    "Password Authentication": "passwordTitle",
    "Keyboard Interactive Authentication": "keyboardInteractiveTitle",
    "Known Hosts Key Missing": "knownHostsKeyMissingTitle",
    "Known Hosts File Missing": "knownHostsFileMissingTitle",
};

const InstallWshQuery =
    /^NodeDrop requires NodeDrop Shell Extensions to be\s+installed on "([\s\S]*)"\s+to ensure a seamless experience\.\s+Would you like to install them\?$/;
const PassphraseQuery = /^Enter passphrase for the SSH key: ([\s\S]*)$/;

function translateText(text: string, t: TFn): string {
    if (text == null || text === "") {
        return text;
    }
    const key = KnownTexts[text.trim()];
    if (key != null) {
        return t(`userInput.texts.${key}`);
    }
    const ndsh = InstallWshQuery.exec(text.trim());
    if (ndsh != null) {
        return t("userInput.texts.installWshQuery", { name: ndsh[1] });
    }
    const pass = PassphraseQuery.exec(text.trim());
    if (pass != null) {
        return t("userInput.texts.passphraseQuery", { file: pass[1] });
    }
    return text;
}

export function translateUserInputRequest(req: UserInputRequest, t: TFn): UserInputRequest {
    return {
        ...req,
        title: translateText(req.title, t),
        querytext: translateText(req.querytext, t),
        checkboxmsg: translateText(req.checkboxmsg, t),
        oklabel: translateText(req.oklabel, t),
        cancellabel: translateText(req.cancellabel, t),
    };
}
