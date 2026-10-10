// Copyright 2026, nodedropweb
// SPDX-License-Identifier: Apache-2.0

package shellutil

import (
	"os"
	"testing"
)

func TestPrependToPathEnv(t *testing.T) {
	sep := string(os.PathListSeparator)
	cases := []struct {
		name string
		env  []string
		want []string
	}{
		{"upper case PATH", []string{"A=1", "PATH=/usr/bin"}, []string{"A=1", "PATH=/bin" + sep + "/usr/bin"}},
		{"Windows style Path", []string{"Path=C:/Windows"}, []string{"Path=/bin" + sep + "C:/Windows"}},
		{"empty PATH", []string{"PATH="}, []string{"PATH=/bin"}},
		{"no PATH at all", []string{"A=1"}, []string{"A=1", "PATH=/bin"}},
	}
	for _, c := range cases {
		got := prependToPathEnv(append([]string{}, c.env...), "/bin")
		if len(got) != len(c.want) {
			t.Fatalf("%s: got %v, want %v", c.name, got, c.want)
		}
		for i := range got {
			if got[i] != c.want[i] {
				t.Errorf("%s: entry %d = %q, want %q", c.name, i, got[i], c.want[i])
			}
		}
	}
}
