<p align="center">
  <a href="https://www.waveterm.dev">
	<picture>
		<source media="(prefers-color-scheme: dark)" srcset="./assets/nodedrop-dark.png">
		<source media="(prefers-color-scheme: light)" srcset="./assets/nodedrop-light.png">
		<img alt="NodeDrop Terminal Logo" src="./assets/nodedrop-light.png" width="240">
	</picture>
  </a>
  <br/>
</p>

# NodeDrop Terminal

<div align="center">

[Deutsch](README.md) | [English](README.en.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

</div>


NodeDrop is an open-source, AI-integrated terminal for macOS, Linux, and Windows. It works with any AI model. Bring your own API keys for OpenAI, Claude, or Gemini, or run local models via Ollama and LM Studio. No accounts required.

NodeDrop also supports durable SSH sessions that survive network interruptions and restarts, with automatic reconnection. Edit remote files with a built-in graphical editor and preview files inline without leaving the terminal.


## Key Features

- NodeDrop AI - Context-aware terminal assistant that reads your terminal output, analyzes widgets, and performs file operations
- Durable SSH Sessions - Remote terminal sessions survive connection interruptions, network changes, and NodeDrop restarts with automatic reconnection
- Flexible drag & drop interface to organize terminal blocks, editors, web browsers, and AI assistants
- Built-in editor for editing remote files with syntax highlighting and modern editor features
- Rich file preview system for remote files (markdown, images, video, PDFs, CSVs, directories)
- Quick full-screen toggle for any block - expand terminals, editors, and previews for better visibility, then instantly return to multi-block view
- AI chat widget with support for multiple models (OpenAI, Claude, Azure, Perplexity, Ollama)
- Command Blocks for isolating and monitoring individual commands
- One-click remote connections with full terminal and file system access
- Secure secret storage using native system backends - store API keys and credentials locally, access them across SSH sessions
- Rich customization including tab themes, terminal styles, and background images
- Powerful `ndsh` command system for managing your workspace from the CLI and sharing data between terminal sessions
- Connected file management with `ndsh file` - seamlessly copy and sync files between local and remote SSH hosts

## NodeDrop AI

NodeDrop AI is your context-aware terminal assistant with access to your workspace:

- **Terminal Context**: Reads terminal output and scrollback for debugging and analysis
- **File Operations**: Read, write, and edit files with automatic backups and user approval
- **CLI Integration**: Use `ndsh ai` to pipe output or attach files directly from the command line
- **BYOK Support**: Bring your own API keys for OpenAI, Claude, Gemini, Azure, and other providers
- **Local Models**: Run local models with Ollama, LM Studio, and other OpenAI-compatible providers
- **Free Beta**: Included AI credits while we refine the experience
- **Coming Soon**: Command execution (with approval)

Learn more in our [NodeDrop AI documentation](https://docs.waveterm.dev/waveai) and [NodeDrop AI Modes documentation](https://docs.waveterm.dev/waveai-modes).

## Installation

NodeDrop Terminal works on macOS, Linux, and Windows.

Platform-specific installation instructions can be found [here](https://docs.waveterm.dev/gettingstarted).

You can also install NodeDrop Terminal directly from: [www.waveterm.dev/download](https://www.waveterm.dev/download).

### Minimum requirements

NodeDrop Terminal runs on the following platforms:

- macOS 11 or later (arm64, x64)
- Windows 10 1809 or later (x64)
- Linux based on glibc-2.28 or later (Debian 10, RHEL 8, Ubuntu 20.04, etc.) (arm64, x64)

The WSH helper runs on the following platforms:

- macOS 11 or later (arm64, x64)
- Windows 10 or later (x64)
- Linux Kernel 2.6.32 or later (x64), Linux Kernel 3.1 or later (arm64)

## Changes in this fork

This repository is a fork of [wavetermdev/waveterm](https://github.com/wavetermdev/waveterm).
All changes made on top of the original are documented in the [CHANGELOG](./CHANGELOG.en.md).

## Roadmap

NodeDrop is constantly improving! Our roadmap will be continuously updated with our goals for each release. You can find it [here](./ROADMAP.md).

Want to provide input to our future releases? Open a [Feature Request](https://github.com/nodedropweb/nodedrop/issues/new/choose)!

## Links

- Repository &mdash; https://github.com/nodedropweb/nodedrop
- Documentation of the original project (Wave Terminal) &mdash; https://docs.waveterm.dev

## Building from Source

See [Building NodeDrop Terminal](BUILD.md).

## Contributing

NodeDrop uses GitHub Issues for issue tracking.

Find more information in our [Contributions Guide](CONTRIBUTING.md), which includes:

- [Ways to contribute](CONTRIBUTING.md#contributing-to-wave-terminal)
- [Contribution guidelines](CONTRIBUTING.md#before-you-start)

## License and origin

NodeDrop Terminal is a fork of [Wave Terminal](https://github.com/wavetermdev/waveterm) by Command Line Inc. and, like the original, is licensed under Apache-2.0. The copyright notices of the original project are retained (see [LICENSE](./LICENSE) and [NOTICE](./NOTICE)). "Wave" and "Wave Terminal" are trademarks of their respective owners. NodeDrop is an independent project and is not affiliated with Command Line Inc. Information about the dependencies used is available [here](./ACKNOWLEDGEMENTS.md).
