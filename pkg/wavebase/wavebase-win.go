// Copyright 2025, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

//go:build windows

package wavebase

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/alexflint/go-filemutex"
)

func AcquireWaveLock() (FDLock, error) {
	dataHomeDir := GetWaveDataDir()
	lockFileName := filepath.Join(dataHomeDir, WaveLockFile)
	log.Printf("[base] acquiring lock on %s\n", lockFileName)
	m, err := filemutex.New(lockFileName)
	if err != nil {
		return nil, fmt.Errorf("filemutex new error: %w", err)
	}
	err = m.TryLock()
	if err != nil {
		return nil, fmt.Errorf("filemutex trylock error: %w", err)
	}
	return m, nil
}

// windowsSocketDir is where the local domain socket lives on Windows: a private sub folder of %TEMP%.
//
// Two Windows quirks drive this choice:
//  1. A force-killed process (or a crash) leaves its AF_UNIX socket file behind in a state that can
//     neither be deleted nor bound again ("invalid argument"). Every process therefore uses a unique
//     file name, so a stale file can never block startup.
//  2. On some Windows installations connecting to a socket below %LOCALAPPDATA% (outside of Temp) fails
//     with "An invalid argument was supplied", while the same socket in %TEMP% works. ndsh could then
//     not talk to the app at all.
func windowsSocketDir() string {
	return filepath.Join(os.TempDir(), "nodedrop-sockets")
}

func domainSocketPath() string {
	dir := windowsSocketDir()
	os.MkdirAll(dir, 0700)
	return filepath.Join(dir, fmt.Sprintf("nodedrop-%d.sock", os.Getpid()))
}

// CleanStaleDomainSockets removes socket files left behind by earlier processes (best effort,
// errors are ignored because such files may not be deletable).
func CleanStaleDomainSockets() {
	own := domainSocketPath()
	dirs := []string{windowsSocketDir(), GetWaveDataDir()}
	patterns := []string{"nodedrop-*.sock", DomainSocketBaseName, "wave.sock"}
	for _, dir := range dirs {
		for _, pattern := range patterns {
			matches, _ := filepath.Glob(filepath.Join(dir, pattern))
			for _, m := range matches {
				if m == own {
					continue
				}
				os.Remove(m)
			}
		}
	}
}
