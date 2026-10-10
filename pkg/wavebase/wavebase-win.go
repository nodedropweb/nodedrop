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

// domainSocketFileName returns a per-process socket file name.
//
// On Windows a force-killed process (or a crash) leaves its AF_UNIX socket file behind in a state
// that can neither be deleted nor bound again ("invalid argument"), which would stop the app from
// ever starting again. A unique name per process makes sure a stale file can never block startup.
func domainSocketFileName() string {
	return fmt.Sprintf("nodedrop-%d.sock", os.Getpid())
}

// CleanStaleDomainSockets removes socket files left behind by earlier processes (best effort,
// errors are ignored because such files may not be deletable).
func CleanStaleDomainSockets() {
	own := domainSocketFileName()
	patterns := []string{"nodedrop-*.sock", DomainSocketBaseName, "wave.sock"}
	for _, pattern := range patterns {
		matches, _ := filepath.Glob(filepath.Join(GetWaveDataDir(), pattern))
		for _, m := range matches {
			if filepath.Base(m) == own {
				continue
			}
			os.Remove(m)
		}
	}
}
