# Code Signing Policy

NodeDrop Terminal is an open-source project. This page describes how its Windows release binaries are
signed.

## Free code signing

> Free code signing provided by [SignPath.io](https://signpath.io), certificate by
> [SignPath Foundation](https://signpath.org).

*(This section applies once the project has been accepted by SignPath Foundation. Until then, release
binaries are unsigned.)*

## What is signed

Only binaries that were built from the source code in this repository by the automated build described
below are submitted for signing:

- the NodeDrop Terminal installer (`NodeDrop-win32-x64-<version>.exe`)
- the executables it contains (`NodeDrop.exe`, `nodedropsrv`, `ndsh`)

Third-party libraries are signed only if they were built in this pipeline. Binaries that were not built
from this repository are never submitted.

## Build and signing process

1. A release is built by the GitHub Actions workflow
   [`build-windows.yml`](.github/workflows/build-windows.yml) from a tagged commit of this repository.
2. The workflow uploads the unsigned artifacts; the signing request is submitted from the same workflow
   run, so the signed binary is traceable to the exact source revision.
3. A project member approves each signing request manually before the signature is applied.

## Team roles

| Role | Member |
|---|---|
| Author (writes the code) | [nodedropweb](https://github.com/nodedropweb) and contributors |
| Reviewer (reviews contributions) | [nodedropweb](https://github.com/nodedropweb) |
| Approver (approves signing requests) | [nodedropweb](https://github.com/nodedropweb) |

All members are required to use multi-factor authentication on their GitHub account.

## Privacy

NodeDrop Terminal does not transmit usage data to the developers. Telemetry and automatic updates are
disabled by default, and no Wave cloud service is contacted. Network traffic is limited to what the user
configures (for example SSH connections and the AI providers the user adds with their own API keys). API
keys are stored in the operating system's credential store.

## Origin of the code

NodeDrop Terminal is a fork of [Wave Terminal](https://github.com/wavetermdev/waveterm) and, like the
original, is licensed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
