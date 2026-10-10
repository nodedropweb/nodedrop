// Copyright 2026, nodedropweb
// SPDX-License-Identifier: Apache-2.0

package shellutil

import (
	"os"
	"path/filepath"
	"testing"
)

func writeFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestCopyDirIfChanged(t *testing.T) {
	src := t.TempDir()
	dst := filepath.Join(t.TempDir(), "tools")
	writeFile(t, filepath.Join(src, "btop4win", "btop4win.exe"), "binary-v1")
	writeFile(t, filepath.Join(src, "btop4win", "themes", "nord.theme"), "theme")

	if err := copyDirIfChanged(src, dst); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(filepath.Join(dst, "btop4win", "btop4win.exe"))
	if err != nil || string(got) != "binary-v1" {
		t.Fatalf("exe not copied: %q %v", got, err)
	}
	if _, err := os.Stat(filepath.Join(dst, "btop4win", "themes", "nord.theme")); err != nil {
		t.Fatalf("nested file not copied: %v", err)
	}

	// a new version with a different size replaces the old file
	writeFile(t, filepath.Join(src, "btop4win", "btop4win.exe"), "binary-v2-longer")
	if err := copyDirIfChanged(src, dst); err != nil {
		t.Fatal(err)
	}
	got, _ = os.ReadFile(filepath.Join(dst, "btop4win", "btop4win.exe"))
	if string(got) != "binary-v2-longer" {
		t.Fatalf("exe not updated: %q", got)
	}
}

func TestCopyDirIfChangedSkipsSameSize(t *testing.T) {
	src := t.TempDir()
	dst := t.TempDir()
	writeFile(t, filepath.Join(src, "a.bin"), "AAAA")
	writeFile(t, filepath.Join(dst, "a.bin"), "BBBB") // same size: treated as up to date
	if err := copyDirIfChanged(src, dst); err != nil {
		t.Fatal(err)
	}
	got, _ := os.ReadFile(filepath.Join(dst, "a.bin"))
	if string(got) != "BBBB" {
		t.Fatalf("same-size file should be left alone, got %q", got)
	}
}
