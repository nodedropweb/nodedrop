// Copyright 2026, nodedropweb
// SPDX-License-Identifier: Apache-2.0

package shellutil

import (
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"github.com/nodedropweb/nodedrop/pkg/util/utilfn"
	"github.com/nodedropweb/nodedrop/pkg/wavebase"
)

// BundledToolsDir is the folder name for third-party tools that ship with NodeDrop (for example btop4win).
// In the installed app they live in <app>/tools; at startup they are copied to <data dir>/tools, next to the
// <data dir>/bin folder that holds ndsh, so that ndsh can find them relative to its own location.
const BundledToolsDir = "tools"

// InstallBundledTools copies the tools that ship with the app into the data dir (best effort, never fatal).
func InstallBundledTools(dataDir string) {
	srcRoot := filepath.Join(wavebase.GetWaveAppPath(), BundledToolsDir)
	if st, err := os.Stat(srcRoot); err != nil || !st.IsDir() {
		return // this build ships no bundled tools
	}
	dstRoot := filepath.Join(dataDir, BundledToolsDir)
	if err := copyDirIfChanged(srcRoot, dstRoot); err != nil {
		log.Printf("error (non-fatal), could not install bundled tools: %v\n", err)
		return
	}
	log.Printf("bundled tools installed to %q\n", dstRoot)
}

// copyDirIfChanged mirrors src into dst. A file is skipped when a file of the same size already exists
// (the shipped tools are pinned by version, so a new version differs in size).
func copyDirIfChanged(src string, dst string) error {
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		srcInfo, err := d.Info()
		if err != nil {
			return err
		}
		if dstInfo, err := os.Stat(target); err == nil && dstInfo.Size() == srcInfo.Size() {
			return nil
		}
		if err := utilfn.AtomicRenameCopy(target, path, 0755); err != nil {
			return fmt.Errorf("copying %q: %w", path, err)
		}
		return nil
	})
}
