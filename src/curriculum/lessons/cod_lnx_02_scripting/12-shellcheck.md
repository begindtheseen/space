---
id: l12-shellcheck
title: shellcheck as a mandatory linter
minutes: 18
covers:
  - shellcheck as a mandatory linter
---

Every bug in the last ten lessons — the unquoted expansion that split a path, the `for f in $(ls)`, the `local n=$(cmd)` that swallowed a failure, the `cd` that silently did not happen — is detected automatically by one program. `shellcheck` reads a shell script, knows the shell from its shebang, and reports the defects with line, column, an explanation and usually a suggested fix.

It is not a style checker. Most of what it flags is a real behavioural difference on some input, and the ones that look like style — backticks, `$?` — are patterns whose failure modes it has seen enough of to name. Treat a clean `shellcheck` run as part of "the script is finished", in the same way a compiler warning-free build is part of "the code is finished".

All output below was produced on this machine and pasted verbatim, with ShellCheck 0.9.0 and jq 1.7 on Ubuntu 24.04.4.

## A script, and what the linter sees

Here is a plausible first draft. It does something useful, it runs, and on a well-behaved directory it produces the right answer.

```bash
#!/bin/bash
# Collect the miss distance from every run in a campaign.

OUTDIR=$1
cd $OUTDIR

count=`ls *.log | wc -l`
echo "found $count logs"

for f in $(ls *.log); do
  local n=$(grep -c MISS $f)
  if [ $n -gt 0 ]; then
    echo $f has $n
  fi
done

grep MISS *.log > $OUTDIR/summary.txt
if [ $? -ne 0 ]; then
  echo "no matches" >&2
fi
```

`shellcheck` on it, in the `gcc` output format so that the whole report fits on one screen:

```bash
shellcheck -f gcc bin/bad.sh
```

```text
bin/bad.sh:5:1: warning: Use 'cd ... || exit' or 'cd ... || return' in case cd fails. [SC2164]
bin/bad.sh:5:4: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/bad.sh:7:7: note: Use $(...) notation instead of legacy backticks `...`. [SC2006]
bin/bad.sh:7:8: note: Use find instead of ls to better handle non-alphanumeric filenames. [SC2012]
bin/bad.sh:7:11: note: Use ./*glob* or -- *glob* so names with dashes won't become options. [SC2035]
bin/bad.sh:10:10: error: Iterating over ls output is fragile. Use globs. [SC2045]
bin/bad.sh:10:15: note: Use ./*glob* or -- *glob* so names with dashes won't become options. [SC2035]
bin/bad.sh:11:3: error: 'local' is only valid in functions. [SC2168]
bin/bad.sh:11:9: warning: Declare and assign separately to avoid masking return values. [SC2155]
bin/bad.sh:11:26: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/bad.sh:12:8: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/bad.sh:13:10: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/bad.sh:13:17: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/bad.sh:17:11: note: Use ./*glob* or -- *glob* so names with dashes won't become options. [SC2035]
bin/bad.sh:17:19: note: Double quote to prevent globbing and word splitting. [SC2086]
bin/bad.sh:18:6: note: Check exit code directly with e.g. 'if ! mycmd;', not indirectly with $?. [SC2181]

```

Sixteen findings in nineteen lines, and every one of them is a real defect this module has already explained:

| Code | Finding | Lesson |
| --- | --- | --- |
| SC2086 | unquoted expansion: word splitting and globbing | 03 |
| SC2164 | `cd` that may fail and be ignored | 06 |
| SC2006 | legacy backticks instead of `$( )` | 04 |
| SC2045, SC2012 | iterating and counting `ls` output | 03 |
| SC2035 | a glob that can produce a leading dash | 03 |
| SC2168 | `local` outside a function | 06 |
| SC2155 | `local x=$(cmd)` masks the command's status | 02, 06 |
| SC2181 | `$?` tested indirectly instead of `if ! cmd` | 06 |

The default output format is more verbose and better for fixing one file at a time: it prints each offending line with carets under the problem and, where it can, a `Did you mean:` block with the corrected line. `-f gcc` is the format for CI logs and editors; `-f json` is for tooling.

::: warning
Read `-f gcc`'s severity words, not just the codes. `shellcheck` grades findings as `error`, `warning`, `info` and `style`, and `-S` filters:

```bash
shellcheck -S error bin/bad.sh
```

```text
In bin/bad.sh line 10:
for f in $(ls *.log); do
         ^---------^ SC2045 (error): Iterating over ls output is fragile. Use globs.


In bin/bad.sh line 11:
  local n=$(grep -c MISS $f)
  ^---^ SC2168 (error): 'local' is only valid in functions.
```

Two findings instead of sixteen. It is tempting to adopt `-S error` in CI to get a green build, and it is the wrong trade: the single most damaging class of shell bug, SC2086, is only `info`, because on most inputs an unquoted variable works. Severity here is about how *certain* `shellcheck` is that the line is wrong, not about how bad it is when it is.

The exit status is 1 when anything is reported at or above the severity threshold and 0 when nothing is, so `shellcheck script.sh` is directly usable as a test.
:::

::: example One finding, and what it actually costs
The default output format is the one to use while fixing. Take the smallest possible offender:

```bash
#!/bin/bash
OUTDIR=$1
cd $OUTDIR
echo "in $PWD"
```

```bash
shellcheck bin/one.sh
```

```text
In bin/one.sh line 3:
cd $OUTDIR
^--------^ SC2164 (warning): Use 'cd ... || exit' or 'cd ... || return' in case cd fails.
   ^-----^ SC2086 (info): Double quote to prevent globbing and word splitting.

Did you mean:
cd "$OUTDIR" || exit
```

Two findings on one line, with carets showing which span each applies to, and a corrected line. Now watch what the SC2164 one is really about:

```bash
./bin/one.sh /nosuchdir; echo "exit=$?"
```

```text
./bin/one.sh: line 3: cd: /nosuchdir: No such file or directory
in /home/eng/work
exit=0
```

The `cd` failed, the script carried on **in the wrong directory**, and reported success. On this four-line script that is an odd message; on a script whose next line is `rm -rf ./*` it is a catastrophe, and it is the exact scenario SC2164 exists for.

The corrected version:

```bash
#!/usr/bin/env bash
set -euo pipefail
outdir="${1:?usage: clean1.sh OUTDIR}"
cd -- "$outdir"
echo "in $PWD"
```

```text
exit=0
```

from `shellcheck`, and three different behaviours from the script itself:

```text
./bin/clean1.sh: line 4: cd: /nosuchdir: No such file or directory
```

exit 1 — the `cd` failure now stops the script, because `set -e` covers it and `shellcheck` accepts that as the guard.

```text
./bin/clean1.sh: line 3: 1: usage: clean1.sh OUTDIR
```

exit 1 — a missing argument is caught at the point of use rather than becoming an empty path.

```text
in /tmp
```

exit 0 on the happy path. Four lines of change, three failure modes closed, and the linter told you where all three were.
:::

## The same script, clean

```bash
#!/usr/bin/env bash
# Collect the miss distance from every run in a campaign.
set -euo pipefail
shopt -s nullglob

main() {
  local outdir="${1:?usage: good.sh OUTDIR}"
  cd -- "$outdir"

  local logs=(./*.log)
  printf 'found %d logs\n' "${#logs[@]}"

  local f n
  for f in "${logs[@]}"; do
    n=$(grep -c MISS -- "$f" || true)
    if (( n > 0 )); then
      printf '%s has %d\n' "$f" "$n"
    fi
  done

  if ! grep MISS -- ./*.log > summary.txt; then
    echo "no matches" >&2
  fi
}

main "$@"
```

```bash
shellcheck bin/good.sh; echo "exit=$?"
```

```text
exit=0
```

```bash
./bin/good.sh /tmp/camp
```

```text
found 2 logs
./case_0001.log has 1
```

Every change traces to a finding. `set -euo pipefail` and `${1:?…}` replace the silent `$1`. `cd -- "$outdir"` is quoted, guarded against a leading dash, and under `set -e` a failure ends the script — so `|| exit` is unnecessary and `shellcheck` accepts it. The glob goes into an **array**, which replaces both `ls` calls: `${#logs[@]}` is the count and `"${logs[@]}"` is the loop, neither of which can be confused by a space or a newline in a name. `local f n` is separate from the assignment, so `grep`'s status is visible — and `|| true` says that "no matches" is expected. `(( n > 0 ))` is arithmetic rather than a string test. And the final `if ! grep …` tests the command directly instead of consulting `$?`.

Note `./*.log` rather than `*.log`: that is SC2035, and it means no expansion can ever produce a word starting with `-`. It also changes the printed names to `./case_0001.log`, which is a small cosmetic cost for removing a whole class of accident.

::: example Making it part of the workflow
A linter that is run occasionally finds nothing, because the code was written without it. Three places to attach it.

**An editor.** `shellcheck` has plugins for every editor worth using; the findings appear as you type, and the habit forms without effort.

**A `Makefile` target**, so that `make lint` is one word and CI and humans run the same thing:

```make
SCRIPTS := $(wildcard bin/*.sh)

lint:
	shellcheck $(SCRIPTS)

.PHONY: lint
```

```bash
make lint; echo "make exit=$?"
```

```text
shellcheck bin/clean1.sh
make exit=0
```

`make` propagates `shellcheck`'s exit status, so the target fails the build when anything is reported — and the recipe line must start with a literal tab, as every `Makefile` recipe does.

**CI**, with the machine-readable format when you want the findings as data:

```bash
shellcheck -f json bin/bad.sh | jq -r '.[0] | {line,level,code,message}'
```

```text
{
  "line": 5,
  "level": "warning",
  "code": 2164,
  "message": "Use 'cd ... || exit' or 'cd ... || return' in case cd fails."
}
```

Each finding is an object with `file`, `line`, `column`, `level`, `code`, `message` and a `fix`, which is what lets a CI system annotate a pull request line by line rather than dumping a log.

One rule that makes the whole thing work: **fix the findings in the commit that introduces them.** A backlog of two hundred warnings is indistinguishable from no linter at all, because nobody reads the new ones. If you are adding `shellcheck` to an existing code base, fix one script per commit and gate only the scripts that are already clean.
:::

## Suppressing a finding

Occasionally `shellcheck` is wrong about your intent — most often when you *want* the glob expansion it is warning about. The directive form documents that, with the code and, by convention, a reason:

```bash
#!/usr/bin/env bash
set -euo pipefail
pattern='*.log'
# The pattern really is meant to be glob-expanded here.
# shellcheck disable=SC2086
ls $pattern
```

```bash
shellcheck bin/disable.sh; echo "exit=$?"
```

```text
exit=0
```

A `# shellcheck disable=` comment applies to the next command, or to the whole file if it appears before the first one, and several codes may be listed comma-separated. `-e SC2086,SC2035` disables codes for a whole run, which is for exploring a legacy script and not for committing.

::: warning
A suppression is a claim that you understand the finding and it does not apply. Two tests before writing one: can you say, in the comment, what would go wrong without it? And is there a form of the line that does not need it — an array instead of an unquoted glob, `find -exec` instead of `ls` — which is almost always the better answer?

The one code that is routinely disabled for good reason is **SC1091**, "Not following: … was not specified as input", which appears whenever a script sources a library:

```text
In bin/uses.sh line 4:
source "$here/lib.sh"
       ^------------^ SC1091 (info): Not following: ./lib.sh was not specified as input (see shellcheck -x).
```

`shellcheck -x` makes it follow `source` directives relative to the script, which is usually what you want; where the path is genuinely dynamic there is nothing to follow and the finding is noise.

The other one worth knowing is **SC2034**, "appears unused":

```text
In bin/uses.sh line 5:
unused_var=1
^--------^ SC2034 (warning): unused_var appears unused. Verify use (or export if used externally).
```

It is right far more often than people expect — a variable assigned and never read is usually a renamed variable whose old name survived, or a typo at the *use* site. Check before dismissing it.
:::

## What it knows about the shell

`shellcheck` reads the shebang and checks against that dialect. Under `#!/bin/sh` it reports bash-only constructs, which is lesson 01's portability problem detected automatically:

```bash
printf '#!/bin/sh\nx=(a b)\necho ${x[0]}\n' > bin/posix.sh; shellcheck bin/posix.sh
```

```text
In bin/posix.sh line 2:
x=(a b)
  ^---^ SC3030 (warning): In POSIX sh, arrays are undefined.


In bin/posix.sh line 3:
echo ${x[0]}
     ^-----^ SC3054 (warning): In POSIX sh, array references are undefined.
     ^-----^ SC2086 (info): Double quote to prevent globbing and word splitting.
```

The SC3xxx codes are exactly "this is not POSIX", and they appear only when the shebang says `sh`. With no shebang at all it cannot tell, and says so:

```text
In bin/nosh.sh line 1:
# no shebang
^-- SC2148 (error): Tips depend on target shell and yours is unknown. Add a shebang or a 'shell' directive.
```

For a file that is sourced rather than executed, and therefore correctly has no shebang, `# shellcheck shell=bash` as the first line supplies the answer and the file checks clean.

::: key
`shellcheck script.sh` exits 1 if it finds anything and 0 if it does not, so it is directly usable as a test. Its findings are behavioural, not stylistic: SC2086 unquoted expansion, SC2155 `local x=$(cmd)`, SC2045 iterating `ls`, SC2164 unguarded `cd`, SC2181 testing `$?`, SC3xxx bashisms under `#!/bin/sh`. Do not filter by severity — SC2086 is only `info`. Suppress with a `# shellcheck disable=SCnnnn` comment and a reason, and prefer rewriting the line.
:::

## Check yourself

::: check
A colleague proposes running `shellcheck -S error` in CI so the build passes. Argue for or against.
:::

::: answer
Against, and the reason is what the severity levels mean. They grade how *confident* `shellcheck` is that a line is wrong in the general case, not how serious the consequence is. SC2086 — an unquoted expansion — is only `info`, because on most inputs an unquoted variable behaves identically to a quoted one; and it is simultaneously the most common cause of real data loss in shell scripts, because the input that differs is a path with a space or a value containing `*`.

`-S error` on the draft script in this lesson reduces sixteen findings to two, and the fourteen it drops include every unquoted expansion, the masked return value and the unguarded `cd`. A build that passes on that basis is a build whose gate does not test anything you care about.

The defensible middle ground, when adding the tool to an existing code base, is not to lower the severity but to narrow the *scope*: lint a list of files that are already clean, and add files to the list as they are fixed. That way the gate is meaningful for everything it covers, and the covered set only grows.
:::

::: check
`shellcheck` reports SC2086 on `rsync -a $SRC/ $DST/`. The paths have never contained a space. Should you fix it?
:::

::: answer
Yes, and the argument is not hypothetical. "Never contained a space" is a property of today's data, not of the code: the paths come from a variable, and a variable's value comes from somewhere — an argument, a configuration file, a `find`, a directory a colleague created from a GUI. The day one does contain a space, `rsync` receives extra operands and treats the last as the destination, which means it copies into the wrong place rather than failing.

Globbing is the half people forget. `$SRC` is also matched against the filesystem, so a value containing `*`, `?` or `[` expands to whatever happens to be in the current directory. That failure does not need anyone to create an unusual filename; it needs a configuration value with a wildcard in it, which is common.

The fix is two characters each: `rsync -a -- "$SRC/" "$DST/"`, with `--` guarding against a leading dash as well. There is no performance or readability cost, and leaving the warning in place has a second consequence — it trains everyone reading the file to skim past `shellcheck` output, which is how the genuinely interesting findings get missed.
:::

::: check
What does `# shellcheck disable=SC2086` do, where does it apply, and what should accompany it?
:::

::: answer
It suppresses that code for the **next command**. Placed before the first command in the file, it applies to the whole file; inside a function, before a specific line, it applies to that line only. Several codes can be listed comma-separated, and the directive form is `# shellcheck disable=SC2086,SC2035`.

It should be accompanied by a comment saying *why* — what the code is warning about and why it does not apply here. The legitimate case for SC2086 is that you genuinely want the expansion to be split or glob-expanded, which is rare and worth stating: "the pattern really is meant to be glob-expanded here".

Before writing one, ask whether the line can be rewritten so the finding does not arise. An unquoted glob becomes an array; `ls` output becomes a glob; `$?` becomes `if ! cmd`. In almost every case the rewrite is shorter and removes the risk rather than documenting it.

The other option, `-e SC2086` on the command line, disables a code for the entire run. That is a tool for triaging a legacy script, not something to commit, because it silently covers lines nobody has looked at.
:::

::: check
A sourced library file has no shebang, and `shellcheck` reports SC2148 plus a stream of irrelevant findings. What is the fix?
:::

::: answer
Add `# shellcheck shell=bash` as the first line. Without a shebang, `shellcheck` does not know which dialect to check against, so it says so with SC2148 (an `error`) and falls back to guessing, which produces findings that may not apply.

A shebang is the wrong fix here, because a file that is only ever `source`d is not executed and should not have one: it would be misleading, and if the file also has the execute bit it invites someone to run it, which would execute its definitions in a throwaway shell and do nothing.

The directive is also the place to record the dialect deliberately. A library intended to be sourced by both `bash` and `dash` should say `# shellcheck shell=sh`, and will then be checked against POSIX and told about every bashism — which is exactly what you want and what lesson 01's `/bin/sh` problem needs.

While you are there: use `shellcheck -x` on the scripts that source the library, so the definitions are followed and SC1091 goes away.
:::

::: check
Why is `for f in $(ls *.log)` an `error` while an unquoted `$var` is only `info`?
:::

::: answer
Because `shellcheck`'s levels express certainty rather than severity. There is no input for which `for f in $(ls *.log)` is more correct than `for f in *.log` — the command substitution converts filenames to text, splits them on `IFS`, and glob-expands the pieces, which can only lose information relative to the glob. The tool can be sure, so it says `error`.

An unquoted `$var` is different: for most values it behaves exactly like the quoted form, and there is a small set of cases where the splitting is what the author wanted. `shellcheck` cannot know which, so it grades it `info` and suggests the quoted form.

The practical consequence is the one from the first question: `info` does not mean "safe to ignore". SC2086 is the highest-value finding in the tool's catalogue in terms of bugs prevented per fix, and it is graded below the ones that are merely certain. Read the message, not the level.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `shellcheck f.sh` | lint; exit 1 if anything is reported | usable directly as a test |
| severity `error`/`warning`/`info`/`style` | how *certain*, not how serious | SC2086 is only `info` |
| `-S error` | filter by severity | a weak CI gate; narrow the file list instead |
| `-f gcc` / `-f json` | one line per finding / structured | gcc for logs and editors, json for tooling |
| `-e SC2086,…` | disable codes for the run | triage only, never committed |
| `# shellcheck disable=SCnnnn` | suppress for the next command | needs a reason; prefer a rewrite |
| `# shellcheck shell=bash` | dialect for a file with no shebang | for sourced libraries |
| `-x` | follow `source` directives | clears SC1091 |
| SC2086 | unquoted expansion | word splitting and globbing |
| SC2155 | `local x=$(cmd)` masks the status | declare and assign separately |
| SC2045 / SC2012 | iterating / counting `ls` output | use a glob or an array |
| SC2164 | unguarded `cd` | `cd … \|\| exit`, or `set -e` |
| SC2181 | `if [ $? -ne 0 ]` | `if ! cmd; then` |
| SC2035 | a glob that could produce a leading dash | `./*.log` or `-- *.log` |
| SC2034 | assigned and never used | usually a renamed variable or a typo at the use site |
| SC2148 | no shebang, dialect unknown | add one, or a `shell=` directive |
| SC3xxx | not POSIX, under `#!/bin/sh` | lesson 01's portability problem, automated |

Lesson 13 takes the scripts you can now write and puts them on a schedule: `cron`, and the `systemd` timers that are replacing it.
