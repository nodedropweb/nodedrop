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


NodeDrop ist ein Open-Source-Terminal mit integrierter KI für macOS, Linux und Windows. Es funktioniert mit jedem KI-Modell: Eigene API-Schlüssel für OpenAI, Claude oder Gemini mitbringen, oder lokale Modelle über Ollama und LM Studio betreiben. Es ist kein Account erforderlich.

NodeDrop unterstützt außerdem dauerhafte SSH-Sitzungen, die Netzwerkunterbrechungen und Neustarts überstehen und sich automatisch wiederverbinden. Entfernte Dateien lassen sich mit einem integrierten grafischen Editor bearbeiten und direkt im Terminal als Vorschau anzeigen.


## Hauptfunktionen

- NodeDrop AI - Kontextbewusster Terminal-Assistent, der die Terminal-Ausgabe liest, Widgets analysiert und Dateioperationen ausführt
- Dauerhafte SSH-Sitzungen - Entfernte Terminal-Sitzungen überstehen Verbindungsabbrüche, Netzwerkwechsel und NodeDrop-Neustarts dank automatischer Wiederverbindung
- Flexible Drag-&-Drop-Oberfläche zum Organisieren von Terminal-Blöcken, Editoren, Web-Browsern und KI-Assistenten
- Integrierter Editor zum Bearbeiten entfernter Dateien mit Syntax-Highlighting und modernen Editor-Funktionen
- Umfangreiches Dateivorschau-System für entfernte Dateien (Markdown, Bilder, Video, PDFs, CSVs, Verzeichnisse)
- Schneller Vollbild-Umschalter für jeden Block - Terminals, Editoren und Vorschauen für bessere Sichtbarkeit vergrößern und sofort wieder zur Mehrblock-Ansicht zurückkehren
- KI-Chat-Widget mit Unterstützung für mehrere Modelle (OpenAI, Claude, Azure, Perplexity, Ollama)
- Command Blocks zum Isolieren und Überwachen einzelner Befehle
- Ein-Klick-Remoteverbindungen mit vollem Terminal- und Dateisystemzugriff
- Sichere Speicherung von Zugangsdaten über native System-Backends - API-Schlüssel und Zugangsdaten lokal speichern und über SSH-Sitzungen hinweg nutzen
- Umfangreiche Anpassungsmöglichkeiten, darunter Tab-Themes, Terminal-Stile und Hintergrundbilder
- Leistungsstarkes `ndsh`-Befehlssystem zur Verwaltung des Workspaces über die CLI und zum Teilen von Daten zwischen Terminal-Sitzungen
- Verbundene Dateiverwaltung mit `ndsh file` - Dateien nahtlos zwischen lokalen und entfernten SSH-Hosts kopieren und synchronisieren

## NodeDrop AI

NodeDrop AI ist der kontextbewusste Terminal-Assistent mit Zugriff auf den gesamten Workspace:

- **Terminal-Kontext**: Liest Terminal-Ausgabe und Scrollback zur Fehlersuche und Analyse
- **Dateioperationen**: Dateien lesen, schreiben und bearbeiten - mit automatischen Backups und Nutzerbestätigung
- **CLI-Integration**: Mit `ndsh ai` Ausgaben per Pipe weiterleiten oder Dateien direkt von der Kommandozeile anhängen
- **BYOK-Unterstützung**: Eigene API-Schlüssel für OpenAI, Claude, Gemini, Azure und weitere Anbieter mitbringen
- **Lokale Modelle**: Lokale Modelle mit Ollama, LM Studio und anderen OpenAI-kompatiblen Anbietern betreiben
- **Kostenlose Beta**: Enthaltenes KI-Guthaben, während die Erfahrung weiter verfeinert wird
- **Demnächst**: Befehlsausführung (mit Bestätigung)

Mehr dazu in der [NodeDrop-AI-Dokumentation](https://docs.waveterm.dev/waveai) und der [NodeDrop-AI-Modi-Dokumentation](https://docs.waveterm.dev/waveai-modes).

## Installation

NodeDrop Terminal läuft auf macOS, Linux und Windows.

Plattformspezifische Installationsanleitungen gibt es [hier](https://docs.waveterm.dev/gettingstarted).

NodeDrop Terminal kann außerdem direkt von hier installiert werden: [www.waveterm.dev/download](https://www.waveterm.dev/download).

### Mindestanforderungen

NodeDrop Terminal läuft auf folgenden Plattformen:

- macOS 11 oder neuer (arm64, x64)
- Windows 10 1809 oder neuer (x64)
- Linux basierend auf glibc-2.28 oder neuer (Debian 10, RHEL 8, Ubuntu 20.04 usw.) (arm64, x64)

Der WSH-Helper läuft auf folgenden Plattformen:

- macOS 11 oder neuer (arm64, x64)
- Windows 10 oder neuer (x64)
- Linux Kernel 2.6.32 oder neuer (x64), Linux Kernel 3.1 oder neuer (arm64)

## Änderungen in diesem Fork

Dieses Repository ist ein Fork von [wavetermdev/waveterm](https://github.com/wavetermdev/waveterm).
Alle Änderungen, die zusätzlich zum Original vorgenommen wurden, sind im [CHANGELOG](./CHANGELOG.md)
dokumentiert.

## Roadmap

NodeDrop wird laufend weiterentwickelt! Die Roadmap wird kontinuierlich mit den Zielen für jedes Release aktualisiert. Sie ist [hier](./ROADMAP.md) zu finden.

Ihr habt Ideen für zukünftige Releases? Eröffnet einen [Feature Request](https://github.com/nodedropweb/nodedrop/issues/new/choose)!

## Links

- Repository &mdash; https://github.com/nodedropweb/nodedrop
- Dokumentation des Originalprojekts (Wave Terminal) &mdash; https://docs.waveterm.dev

## Aus dem Quellcode bauen

Siehe [NodeDrop Terminal bauen](BUILD.md).

## Mitwirken

NodeDrop nutzt GitHub Issues für die Fehler- und Feature-Verfolgung.

Weitere Informationen gibt es im [Leitfaden für Mitwirkende](CONTRIBUTING.md), unter anderem:

- [Möglichkeiten mitzuwirken](CONTRIBUTING.md#contributing-to-wave-terminal)
- [Richtlinien für Beiträge](CONTRIBUTING.md#before-you-start)

## Lizenz und Herkunft

NodeDrop Terminal ist ein Fork von [Wave Terminal](https://github.com/wavetermdev/waveterm) von Command Line Inc. und steht wie das Original unter der Apache-2.0-Lizenz. Die Urheberrechtshinweise des Originalprojekts bleiben erhalten (siehe [LICENSE](./LICENSE) und [NOTICE](./NOTICE)). "Wave" und "Wave Terminal" sind Marken ihrer jeweiligen Inhaber. NodeDrop ist ein eigenstÃ¤ndiges Projekt und nicht mit Command Line Inc. verbunden. Informationen zu den verwendeten AbhÃ¤ngigkeiten gibt es [hier](./ACKNOWLEDGEMENTS.md).
