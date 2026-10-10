// Copyright 2026, nodedropweb
// SPDX-License-Identifier: Apache-2.0

package cmd

import (
	"errors"
	"path/filepath"
	"strings"
	"testing"
)

func testFinder(goos string, env map[string]string, onPath map[string]string, files ...string) sysmonFinder {
	fileSet := map[string]bool{}
	for _, f := range files {
		fileSet[f] = true
	}
	return sysmonFinder{
		goos:   goos,
		getenv: func(k string) string { return env[k] },
		lookPath: func(name string) (string, error) {
			if p, ok := onPath[name]; ok {
				return p, nil
			}
			return "", errors.New("not found")
		},
		isFile: func(p string) bool { return fileSet[p] },
	}
}

func TestSysmonPrefersBtop4winOnWindows(t *testing.T) {
	f := testFinder("windows", nil, map[string]string{"btop4win": `C:\tools\btop4win.exe`, "btop": `C:\tools\btop.exe`})
	if got := f.find(); got != `C:\tools\btop4win.exe` {
		t.Fatalf("got %q", got)
	}
}

func TestSysmonUsesBtopOnUnix(t *testing.T) {
	f := testFinder("linux", nil, map[string]string{"btop": "/usr/bin/btop", "btop4win": "/x/btop4win"})
	if got := f.find(); got != "/usr/bin/btop" {
		t.Fatalf("got %q", got)
	}
}

func TestSysmonOverrideWins(t *testing.T) {
	f := testFinder("linux", map[string]string{SysmonOverrideEnvVar: "htop"}, map[string]string{"htop": "/usr/bin/htop", "btop": "/usr/bin/btop"})
	if got := f.find(); got != "/usr/bin/htop" {
		t.Fatalf("got %q", got)
	}
}

func TestSysmonFindsScoopShimOutsidePath(t *testing.T) {
	shim := filepath.Join(`C:\Users\me`, "scoop", "shims", "btop.exe")
	f := testFinder("windows", map[string]string{"USERPROFILE": `C:\Users\me`}, nil, shim)
	if got := f.find(); got != shim {
		t.Fatalf("got %q, want %q", got, shim)
	}
}

func TestSysmonNoneFound(t *testing.T) {
	f := testFinder("darwin", map[string]string{"HOME": "/Users/me"}, nil)
	if got := f.find(); got != "" {
		t.Fatalf("expected no monitor, got %q", got)
	}
}

func TestSysmonInstallHintMentionsPlatformInstaller(t *testing.T) {
	cases := map[string]string{"windows": "scoop install btop", "darwin": "brew install btop", "linux": "apt install btop"}
	for goos, want := range cases {
		if hint := sysmonInstallHint(goos); !strings.Contains(hint, want) {
			t.Errorf("%s hint lacks %q:\n%s", goos, want, hint)
		}
	}
}

func TestSysmonPrefersBundledMonitorOnWindows(t *testing.T) {
	exe := filepath.Join("C:", "Users", "me", "AppData", "Local", "nodedrop", "Data", "bin", "ndsh.exe")
	bundled := filepath.Join("C:", "Users", "me", "AppData", "Local", "nodedrop", "Data", "tools", "btop4win", "btop4win.exe")
	f := testFinder("windows", nil, map[string]string{"btop": `C:\scoop\btop.exe`}, bundled)
	f.exePath = func() (string, error) { return exe, nil }
	if got := f.find(); got != bundled {
		t.Fatalf("got %q, want the bundled %q", got, bundled)
	}
}

func TestSysmonOverrideBeatsBundledMonitor(t *testing.T) {
	exe := filepath.Join("C:", "data", "bin", "ndsh.exe")
	bundled := filepath.Join("C:", "data", "tools", "btop4win", "btop4win.exe")
	f := testFinder("windows", map[string]string{SysmonOverrideEnvVar: "htop"}, map[string]string{"htop": `C:\tools\htop.exe`}, bundled)
	f.exePath = func() (string, error) { return exe, nil }
	if got := f.find(); got != `C:\tools\htop.exe` {
		t.Fatalf("got %q", got)
	}
}

func TestSysmonIgnoresBundledMonitorOutsideWindows(t *testing.T) {
	f := testFinder("linux", nil, nil, "/data/tools/btop4win/btop4win.exe")
	f.exePath = func() (string, error) { return "/data/bin/ndsh", nil }
	if got := f.find(); got != "" {
		t.Fatalf("expected no monitor, got %q", got)
	}
}
