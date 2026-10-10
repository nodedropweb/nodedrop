// Copyright 2025, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"github.com/nodedropweb/nodedrop/cmd/ndsh/cmd"
	"github.com/nodedropweb/nodedrop/pkg/wavebase"
)

// set by main-server.go
var WaveVersion = "0.0.0"
var BuildTime = "0"

func main() {
	wavebase.WaveVersion = WaveVersion
	wavebase.BuildTime = BuildTime
	cmd.Execute()
}
