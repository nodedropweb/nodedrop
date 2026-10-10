// Copyright 2026, nodedropweb
// SPDX-License-Identifier: Apache-2.0

package cmd

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/nodedropweb/nodedrop/pkg/waveobj"
	"github.com/nodedropweb/nodedrop/pkg/wshrpc"
	"github.com/nodedropweb/nodedrop/pkg/wshrpc/wshclient"
	"github.com/spf13/cobra"
)

// SysmonOverrideEnvVar lets the user pick any terminal monitor (full path or command name).
const SysmonOverrideEnvVar = "NODEDROP_SYSMON"

var sysmonNoFallback bool

var sysmonCmd = &cobra.Command{
	Use:   "sysmon",
	Short: "run a terminal system monitor (btop4win / btop) in this block",
	Long: `Runs a terminal system monitor in the current block: btop4win on Windows, btop on macOS and Linux.
The command is looked up in PATH and a few well-known install locations. Set ` + SysmonOverrideEnvVar + ` to use a different program.

If no monitor is installed, the command prints how to install one and switches the block to the built-in system info view
(use --no-fallback to only print the hint).`,
	Args:         cobra.NoArgs,
	RunE:         activityWrap("sysmon", sysmonRun),
	SilenceUsage: true,
}

func init() {
	rootCmd.AddCommand(sysmonCmd)
	sysmonCmd.Flags().BoolVar(&sysmonNoFallback, "no-fallback", false, "do not switch to the built-in system info view when no monitor is found")
}

// sysmonFinder abstracts the environment so the lookup can be tested.
type sysmonFinder struct {
	goos     string
	getenv   func(string) string
	lookPath func(string) (string, error)
	isFile   func(string) bool
}

func defaultSysmonFinder() sysmonFinder {
	return sysmonFinder{
		goos:     runtime.GOOS,
		getenv:   os.Getenv,
		lookPath: exec.LookPath,
		isFile: func(p string) bool {
			st, err := os.Stat(p)
			return err == nil && !st.IsDir()
		},
	}
}

func (f sysmonFinder) candidateNames() []string {
	if f.goos == "windows" {
		return []string{"btop4win", "btop"}
	}
	return []string{"btop"}
}

// extraDirs are install locations that are often missing from PATH of GUI-launched apps.
func (f sysmonFinder) extraDirs() []string {
	home := f.getenv("HOME")
	if f.goos == "windows" {
		home = f.getenv("USERPROFILE")
	}
	var dirs []string
	add := func(parts ...string) {
		if parts[0] != "" {
			dirs = append(dirs, filepath.Join(parts...))
		}
	}
	add(home, ".nodedrop", "tools")
	switch f.goos {
	case "windows":
		add(home, "scoop", "shims")
		add(f.getenv("LOCALAPPDATA"), "Microsoft", "WinGet", "Links")
		add(f.getenv("LOCALAPPDATA"), "Programs", "btop4win")
		add(f.getenv("ProgramFiles"), "btop4win")
	case "darwin":
		dirs = append(dirs, "/opt/homebrew/bin", "/usr/local/bin")
	default:
		add(home, ".local", "bin")
		dirs = append(dirs, "/usr/local/bin", "/usr/bin", "/snap/bin")
	}
	return dirs
}

// find returns the path of the monitor to run, or "" when none is installed.
func (f sysmonFinder) find() string {
	if override := f.getenv(SysmonOverrideEnvVar); override != "" {
		if p, err := f.lookPath(override); err == nil {
			return p
		}
		if f.isFile(override) {
			return override
		}
	}
	for _, name := range f.candidateNames() {
		if p, err := f.lookPath(name); err == nil {
			return p
		}
	}
	for _, dir := range f.extraDirs() {
		for _, name := range f.candidateNames() {
			file := name
			if f.goos == "windows" {
				file += ".exe"
			}
			p := filepath.Join(dir, file)
			if f.isFile(p) {
				return p
			}
		}
	}
	return ""
}

func sysmonInstallHint(goos string) string {
	hint := "NodeDrop system monitor\n=======================\n"
	hint += "No terminal system monitor was found on this machine.\n\nInstall one and open this widget again:\n"
	switch goos {
	case "windows":
		hint += "  scoop install btop     (btop4win, https://github.com/aristocratos/btop4win)\n"
		hint += "  or download a release: https://github.com/aristocratos/btop4win/releases\n"
	case "darwin":
		hint += "  brew install btop\n"
	default:
		hint += "  sudo apt install btop   (or the package manager of your distribution)\n"
	}
	hint += "\nTip: set " + SysmonOverrideEnvVar + " to use a different program.\n"
	return hint
}

func sysmonRun(cmd *cobra.Command, args []string) error {
	finder := defaultSysmonFinder()
	monitor := finder.find()
	if monitor == "" {
		WriteStdout("%s", sysmonInstallHint(finder.goos))
		if sysmonNoFallback {
			return nil
		}
		return sysmonSwitchToBuiltin()
	}
	child := exec.Command(monitor)
	child.Stdin = os.Stdin
	child.Stdout = os.Stdout
	child.Stderr = os.Stderr
	err := child.Run()
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		os.Exit(exitErr.ExitCode())
	}
	if err != nil {
		return fmt.Errorf("running %s: %w", monitor, err)
	}
	return nil
}

// sysmonSwitchToBuiltin turns the current block into the built-in system info view.
func sysmonSwitchToBuiltin() error {
	if err := preRunSetupRpcClient(nil, nil); err != nil {
		// not inside a NodeDrop block (or the block has no access token): the hint above is all we can do
		WriteStdout("\n(could not switch to the built-in system info: %v)\n", err)
		return nil
	}
	// Blocks that run a command (widgets) do not get NODEDROP_BLOCKID, but the access token carries the block id.
	if RpcContext.BlockId == "" {
		WriteStdout("\n(could not switch to the built-in system info: the access token has no block id)\n")
		return nil
	}
	oref := waveobj.MakeORef(waveobj.OType_Block, RpcContext.BlockId)
	meta := map[string]any{
		"view":             "sysinfo",
		"controller":       nil,
		"cmd":              nil,
		"cmd:args":         nil,
		"cmd:shell":        nil,
		"cmd:runonstart":   nil,
		"cmd:runonce":      nil,
		"cmd:clearonstart": nil,
		"cmd:jwt":          nil,
	}
	WriteStdout("\nShowing the built-in system info in 3 seconds ...\n")
	time.Sleep(3 * time.Second)
	return wshclient.SetMetaCommand(RpcClient, wshrpc.CommandSetMetaData{ORef: oref, Meta: meta}, &wshrpc.RpcOpts{Timeout: 2000})
}
