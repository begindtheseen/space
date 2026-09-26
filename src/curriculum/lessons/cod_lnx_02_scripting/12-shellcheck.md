---
id: l12-shellcheck
title: shellcheck as a mandatory linter
minutes: 20
covers:
  - shellcheck as a mandatory linter
---

A spell checker does not write your essay. It reads what you wrote and underlines the words that are probably wrong, so you can fix them before anyone else sees. You still decide. But you would never hand in an essay with red underlines all over it.

**`shellcheck`** is that for shell scripts. It is a **[[linter|lint-name]]** — a program that reads code without running it and points out mistakes. It reads your script, works out which shell it is written for from the shebang, and reports each problem with a line, a column, an explanation and usually a suggested fix. Every bug in the last ten lessons — the unquoted expansion that split a path, the `for f in $(ls)`, the `local n=$(cmd)` that swallowed a failure, the `cd` that silently did not happen — it finds automatically.

It is not a style checker. Most of what it flags behaves differently from what you meant on *some* input. Even the ones that look like style — backticks, testing `$?` — are patterns whose failures are common enough to have names. Treat a clean `shellcheck` run as part of "the script is finished", the way a C++ build with no compiler warnings is part of "the code is finished". This module's own objective says it: pass `shellcheck` with zero warnings.

All output below is real, from **[[ShellCheck|shellcheck-origin]]** 0.11.0 and jq 1.7 on Ubuntu 24.04.

## A script, and what the linter sees

Here is a believable first draft. It does something useful, it runs, and on a tidy directory it gives the right answer.

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

Here is `shellcheck` on it, using the **[[`gcc` output format|gcc-format]]**, one finding per line, so the whole report fits on one screen:

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

Read one line aloud: "file `bin/bad.sh`, line 5, column 1: a warning — use `cd … || exit` in case `cd` fails — code **[[SC2164|sc-code-ranges]]**". Every finding has a code like that, and each code has its own page on the ShellCheck wiki explaining it.

Sixteen findings in nineteen lines, and every one is a real defect this module has already explained:

| Code | Finding | Lesson |
| --- | --- | --- |
| SC2086 | unquoted expansion: word splitting and globbing | 03 |
| SC2164 | `cd` that may fail and be ignored | this one |
| SC2006 | legacy backticks instead of `$( )` | 04 |
| SC2045, SC2012 | looping over and counting `ls` output | 03 |
| SC2035 | a glob that can produce a leading dash | 03 |
| SC2168 | `local` outside a function | 06 |
| SC2155 | `local x=$(cmd)` masks the command's status | 02, 06 |
| SC2181 | `$?` tested indirectly instead of `if ! cmd` | 06 |

The default output format is longer and better for fixing one file at a time. It prints each offending line with **carets** (`^`) under the problem and, where it can, a `Did you mean:` block with the corrected line. Use `-f gcc` for editors and for CI logs (CI is the set of automatic checks run on every change), and `-f json` for other programs.

::: warning Severity measures certainty, not damage
`shellcheck` grades each finding `error`, `warning`, `info` or `style`. In `-f gcc` output, `info` and `style` both appear as `note`. The `-S` option hides everything below a level:

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

For more information:
  https://www.shellcheck.net/wiki/SC2045 -- Iterating over ls output is fragi...
  https://www.shellcheck.net/wiki/SC2168 -- 'local' is only valid in functions.
```

Two findings instead of **[[sixteen|severity-picture]]**. It is tempting to use `-S error` in CI to get a green build. It is the wrong trade. The single most damaging kind of shell bug, SC2086, is only `info`, because on most inputs an unquoted variable works. Severity says how *sure* `shellcheck` is that the line is wrong — not how bad it is when it is.

The exit status is 1 when anything is reported at or above the level, and 0 when nothing is, so `shellcheck script.sh` works directly as a test.
:::

::: example One finding, and what it actually costs
Take the smallest possible offender:

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

For more information:
  https://www.shellcheck.net/wiki/SC2164 -- Use 'cd ... || exit' or 'cd ... |...
  https://www.shellcheck.net/wiki/SC2086 -- Double quote to prevent globbing ...
```

Two findings on one line. The carets show which stretch of text each applies to: the whole command for SC2164, only `$OUTDIR` for SC2086. Then comes a corrected line. `|| exit` reads "or else exit": if `cd` fails, stop.

Now watch what SC2164 is really about. Run the script from `/tmp/work`, with a folder that does not exist:

```bash
./bin/one.sh /nosuchdir; echo "exit=$?"
```

```text
./bin/one.sh: line 3: cd: /nosuchdir: No such file or directory
in /tmp/work
exit=0
```

The `cd` failed. The script carried on **[[in the wrong directory|wrong-directory-picture]]**, and reported success. Here that is an odd message. On a script whose next line is `rm -rf ./*`, it is a disaster — the exact scenario SC2164 exists for.

The corrected version:

```bash
#!/usr/bin/env bash
set -euo pipefail
outdir="${1:?usage: clean1.sh OUTDIR}"
cd -- "$outdir"
echo "in $PWD"
```

`shellcheck` reports nothing and exits 0. The script itself now has three different behaviors. A missing folder:

```text
./bin/clean1.sh: line 4: cd: /nosuchdir: No such file or directory
```

Exit 1. The `cd` failure stops the script, because `set -e` covers it — and `shellcheck` sees the `set -e` and accepts it as the guard. No argument at all:

```text
./bin/clean1.sh: line 3: 1: usage: clean1.sh OUTDIR
```

Exit 1. `${1:?…}` (lesson 02's "abort with a message" expansion) catches the missing argument at the point of use, before it can become an empty path. The happy path, `./bin/clean1.sh /tmp`:

```text
in /tmp
```

Exit 0. Four lines changed, three failure modes closed, and the linter pointed at each one.
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
  if (( ${#logs[@]} == 0 )); then
    echo "no logs in $outdir" >&2
    exit 1
  fi

  local f n
  for f in "${logs[@]}"; do
    n=$(grep -c MISS -- "$f" || true)
    if (( n > 0 )); then
      printf '%s has %d\n' "$f" "$n"
    fi
  done

  if ! grep MISS -- "${logs[@]}" > summary.txt; then
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
./bin/good.sh camp
```

```text
found 2 logs
./case_0001.log has 1
```

Every change traces to a finding:

- `set -euo pipefail` and `${1:?…}` replace the silent `$1`.
- `cd -- "$outdir"` is quoted and guarded against a leading dash. Under `set -e` a failure ends the script, so `|| exit` is not needed.
- The glob goes into an **array**, which replaces both `ls` calls. `${#logs[@]}` (read "the number of elements in logs") is the count, and `"${logs[@]}"` is the list to loop over. Neither can be confused by a space or a newline in a name.
- `local f n` is separate from the assignment, so `grep`'s status stays visible. `|| true` says "no matches is fine here".
- `(( n > 0 ))` is arithmetic, not a string test.
- `if ! grep …` tests the command directly instead of consulting `$?`.

Note `./*.log` rather than `*.log`. That is SC2035: no expansion can ever produce a word starting with `-`. It changes the printed names to `./case_0001.log`, a small cosmetic cost for removing a whole family of accidents.

One change came from testing, not from the linter. With **[[`nullglob`|nullglob-trap]]** on, a folder with no logs makes `./*.log` expand to nothing at all. An earlier draft of this script ended with `grep MISS -- ./*.log`, and on an empty folder that became `grep MISS --` with no file named — so `grep` sat waiting to read the keyboard, forever. `shellcheck` passed that draft. The zero-logs check is what fixed it:

```text
found 0 logs
no logs in empty
```

Exit 1. A clean lint is necessary, not sufficient: you still have to run the unusual cases.

::: example Making it part of the workflow
A linter that runs now and then finds nothing, because the code was written without it. Attach it in three places.

**An editor.** `shellcheck` has plugins for every common editor. Findings appear as you type, and the habit forms without effort.

**A `Makefile` target**, so `make lint` is one word, and CI and humans run the same thing:

```make
SCRIPTS := $(wildcard bin/*.sh)

lint:
	shellcheck $(SCRIPTS)

.PHONY: lint
```

`$(wildcard bin/*.sh)` is `make`'s own glob, and `.PHONY` says `lint` is a task name, not a file to build. The recipe line must start with a literal **[[tab character|make-tab]]**, as every `Makefile` recipe does.

```bash
make lint; echo "make exit=$?"
```

```text
shellcheck bin/clean1.sh bin/good.sh
make exit=0
```

`make` prints each command before running it. Drop the old `one.sh` into `bin/` and the target fails:

```text
make: *** [Makefile:4: lint] Error 1
make exit=2
```

`shellcheck` exited 1, so `make` stopped and exited with its own failure code, 2. Any non-zero exit fails the build, which is all CI needs.

**CI** — the **[[automatic checks run on every change|ci-meaning]]** — can use the machine-readable format when you want the findings as data:

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

The output is a JSON array with one object per finding — sixteen for `bad.sh`. Each object has `file`, `line`, `endLine`, `column`, `endColumn`, `level`, `code`, `message` and a `fix`. That lets a CI system mark up a pull request line by line instead of dumping a log.

One rule makes the whole thing work: **fix the findings in the commit that introduces them.** A backlog of two hundred warnings is the same as no linter at all, because nobody reads the new ones. When adding `shellcheck` to old code, fix one script per commit, and gate only the scripts that are already clean.
:::

## Suppressing a finding

Now and then `shellcheck` misreads your intent — most often when you *want* the glob expansion it warns about. A **directive**, a specially shaped comment, records that decision, with the code and, by convention, a reason:

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

A `# shellcheck disable=` comment covers the next command. If that command is an `if` or a loop, it covers the whole block. Placed before the first command in the file, it covers the whole file. Several codes can be listed with commas. On the command line, `-e SC2086,SC2035` turns codes off for a whole run — for exploring an old script, never for committing.

::: warning A suppression is a claim
Writing one says "I understand this finding and it does not apply". Two tests first. Can you say, in the comment, what would go wrong without it? And is there a form of the line that does not need it — an array instead of an unquoted glob, `find -exec` instead of `ls`? There almost always is, and it is almost always better.

One code comes up constantly for a good reason: **SC1091**, "Not following", which appears when a script `source`s a library:

```text
In bin/uses.sh line 4:
source "$here/lib.sh"
       ^------------^ SC1091 (info): Not following: ./lib.sh was not specified as input (see shellcheck -x).
```

`-x` lets `shellcheck` follow `source` into the other file. But `$here` is only known when the script runs, so on its own `-x` looks for `lib.sh` in the *current* directory. Add `-P SCRIPTDIR` to look next to the script instead, and the finding goes away:

```bash
shellcheck -x -P SCRIPTDIR bin/uses.sh
```

```text
In bin/uses.sh line 5:
unused_var=1
^--------^ SC2034 (warning): unused_var appears unused. Verify use (or export if used externally).

For more information:
  https://www.shellcheck.net/wiki/SC2034 -- unused_var appears unused. Verify...
```

The SC1091 is gone and the other finding remains: **SC2034**, "appears unused". It is right far more often than people expect. A variable that is set and never read is usually a renamed variable whose old name survived, or a typo where it is used. Check before dismissing it.
:::

## What it knows about the shell

`shellcheck` reads the shebang and checks against that shell's rules. Under `#!/bin/sh` it reports features that only bash has — lesson 01's **[[portability problem|posix-sh]]**, detected automatically:

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

Did you mean:
echo "${x[0]}"

For more information:
  https://www.shellcheck.net/wiki/SC3030 -- In POSIX sh, arrays are undefined.
  https://www.shellcheck.net/wiki/SC3054 -- In POSIX sh, array references are...
  https://www.shellcheck.net/wiki/SC2086 -- Double quote to prevent globbing ...
```

The SC3xxx codes mean exactly "this is not POSIX", and they appear only when the shebang says `sh`. With no shebang at all, `shellcheck` cannot tell which rules apply, and says so:

```text
In bin/nosh.sh line 1:
# no shebang
^-- SC2148 (error): Tips depend on target shell and yours is unknown. Add a shebang or a 'shell' directive.
```

A file that is `source`d rather than run correctly has no shebang. For that file, `# shellcheck shell=bash` as the first line gives the answer, and it checks clean.

::: key
`shellcheck script.sh` exits 1 if it finds anything and 0 if it does not, so it is directly usable as a test. Its findings are behavioral, not stylistic: SC2086 unquoted expansion, SC2155 `local x=$(cmd)`, SC2045 iterating `ls`, SC2164 unguarded `cd`, SC2181 testing `$?`, SC3xxx bashisms under `#!/bin/sh`. Do not filter by severity — SC2086 is only `info`. Suppress with a `# shellcheck disable=SCnnnn` comment and a reason, and prefer rewriting the line.
:::

## Check yourself

::: check
A colleague proposes running `shellcheck -S error` in CI so the build passes. Argue for or against.
:::

::: answer
Against, because of what the levels mean. They grade how *sure* `shellcheck` is that a line is wrong in general, not how serious the result is. SC2086, an unquoted expansion, is only `info`, because on most inputs an unquoted variable behaves exactly like a quoted one. It is also the most common cause of real data loss in shell scripts, because the input that differs is a path with a space or a value containing `*`.

On this lesson's draft script, `-S error` cuts sixteen findings to two. The fourteen it drops include every unquoted expansion, the masked return value and the unguarded `cd`. A build that passes on that basis has a gate that tests nothing you care about.

The sensible middle ground, when adding the tool to existing code, is to narrow the *scope*, not the severity: lint a list of files that are already clean, and add files as they are fixed. Then the gate means something for everything it covers, and what it covers only grows.
:::

::: check
`shellcheck` reports SC2086 on `rsync -a $SRC/ $DST/`. The paths have never contained a space. Should you fix it?
:::

::: answer
Yes, and not for a made-up reason. "Never contained a space" describes today's data, not the code. The paths come from variables, and those values come from somewhere — an argument, a config file, a `find`, a folder a colleague made in a file manager. The day one contains a space, `rsync` receives extra arguments and treats the last one as the destination. It copies into the wrong place instead of failing.

Globbing is the half people forget. Unquoted, `$SRC` is also matched against the filesystem, so a value containing `*`, `?` or `[` turns into whatever happens to be in the current directory. That needs no odd filename, only a config value with a wildcard in it.

The fix is two characters per variable: `rsync -a -- "$SRC/" "$DST/"`, with `--` guarding against a leading dash too. It costs nothing in speed or readability. Leaving the warning also has a second cost: it trains everyone to skim past `shellcheck` output, which is how the really interesting findings get missed.
:::

::: check
What does `# shellcheck disable=SC2086` do, where does it apply, and what should go with it?
:::

::: answer
It turns off that one code for the **next command**. Before the first command in the file, it applies to the whole file. Before an `if`, a loop or a function, it covers that whole block. Otherwise it covers one line. Several codes can be listed with commas: `# shellcheck disable=SC2086,SC2035`.

It should come with a comment saying *why* — what the code warns about and why that does not apply here. The honest case for SC2086 is that you really want the value split or glob-expanded, which is rare and worth saying: "the pattern really is meant to be glob-expanded here".

Before writing one, ask whether the line can be rewritten so the finding never comes up. An unquoted glob becomes an array; `ls` output becomes a glob; `$?` becomes `if ! cmd`. Nearly always the rewrite is shorter and removes the risk instead of documenting it.

`-e SC2086` on the command line disables a code for the whole run. That is for sorting through an old script, not for committing, because it silently covers lines nobody has looked at.
:::

::: check
A sourced library file has no shebang, and `shellcheck` reports SC2148 plus a stream of irrelevant findings. What is the fix?
:::

::: answer
Add `# shellcheck shell=bash` as the first line. Without a shebang, `shellcheck` does not know which shell's rules to apply. It says so with SC2148, an `error`, and falls back to guessing, which produces findings that may not apply.

A shebang is the wrong fix. A file that is only ever `source`d is never run by itself, so a shebang would mislead. And if the file also had the execute bit, someone might run it, which would define its functions in a throwaway shell and then do nothing.

The directive is also where you record the dialect on purpose. A library meant to be sourced by both `bash` and `dash` should say `# shellcheck shell=sh`. It will then be checked against POSIX and told about every bash-only feature — exactly what lesson 01's `/bin/sh` problem needs.

While you are there, run `shellcheck -x -P SCRIPTDIR` on the scripts that source the library, so its definitions are followed and SC1091 goes away.
:::

::: check
Why is `for f in $(ls *.log)` an `error`, while an unquoted `$var` is only `info`?
:::

::: answer
Because the levels express certainty, not severity. There is no input for which `for f in $(ls *.log)` beats `for f in *.log`. The command substitution turns filenames into text, splits it on `IFS` and glob-expands the pieces, which can only lose information compared with the glob. The tool can be sure, so it says `error`.

An unquoted `$var` is different. For most values it behaves exactly like the quoted form, and in a few cases the splitting is what the author wanted. `shellcheck` cannot know which, so it grades it `info` and suggests quotes.

The practical lesson is the one from the first question: `info` does not mean "safe to ignore". SC2086 prevents more bugs per fix than any other finding, and it is graded below the ones that are merely certain. Read the message, not the level.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `shellcheck f.sh` | lint; exit 1 if anything is reported | usable directly as a test |
| severity `error`/`warning`/`info`/`style` | how *certain*, not how serious | SC2086 is only `info` |
| `-S error` | filter by severity | a weak CI gate; narrow the file list instead |
| `-f gcc` / `-f json` | one line per finding / structured | gcc for logs and editors, json for tooling |
| `-e SC2086,…` | disable codes for the run | triage only, never committed |
| `# shellcheck disable=SCnnnn` | suppress for the next command or block | needs a reason; prefer a rewrite |
| `# shellcheck shell=bash` | dialect for a file with no shebang | for sourced libraries |
| `-x`, `-P SCRIPTDIR` | follow `source`, looking beside the script | clears SC1091 |
| SC2086 | unquoted expansion | word splitting and globbing |
| SC2155 | `local x=$(cmd)` masks the status | declare and assign separately |
| SC2045 / SC2012 | looping over / counting `ls` output | use a glob or an array |
| SC2164 | unguarded `cd` | `cd … \|\| exit`, or `set -e` |
| SC2181 | `if [ $? -ne 0 ]` | `if ! cmd; then` |
| SC2035 | a glob that could produce a leading dash | `./*.log` or `-- *.log` |
| SC2034 | set and never used | usually a renamed variable or a typo where it is used |
| SC2148 | no shebang, dialect unknown | add one, or a `shell=` directive |
| SC3xxx | not POSIX, under `#!/bin/sh` | lesson 01's portability problem, automated |

Lesson 13 takes the scripts you can now write and check, and puts them on a schedule: `cron`, and the `systemd` timers that are replacing it.

::: context lint-name Why it is called a linter
The first famous one was **Lint**, a checker for C programs written by Stephen C. Johnson at Bell Labs in the late 1970s. It was named after the bits of fluff that collect on clothes: small, easy to miss, and worth picking off.

Lint looked for code the compiler would accept but that was probably a mistake. Every "linter" since — for Python, JavaScript, shell — does the same job, and the name stuck.
:::

::: context shellcheck-origin Who writes ShellCheck
ShellCheck was created by Vidar Holen and is free, open-source software, written in the Haskell programming language. You can paste a script into the website shellcheck.net and get the same report without installing anything.

Each code has a wiki page — SC2086, SC2164 and so on — explaining the problem, showing broken and fixed examples, and listing the rare cases where the warning does not apply. When a finding surprises you, read its page before you suppress it.
:::

::: context gcc-format Why the format is named after a compiler
GCC, the GNU Compiler Collection, prints its errors as `file:line:column: severity: message`. So many tools copied that shape that editors learned to read it: click a line in the output and the editor jumps to that spot in the file.

`shellcheck -f gcc` borrows the same shape, so any editor or CI system that understands compiler errors understands `shellcheck` too, with no extra setup.
:::

::: context sc-code-ranges What the SC numbers mean
The first digit of a code tells you what kind of finding it is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="30" width="110" height="36" fill="#f2b880"/>
    <rect x="125" y="30" width="110" height="36" fill="#8fb8f0"/>
    <rect x="240" y="30" width="110" height="36" fill="#fff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="22">SC1xxx</text>
    <text x="180" y="22">SC2xxx</text>
    <text x="295" y="22">SC3xxx</text>
    <text x="65" y="53">parsing</text>
    <text x="180" y="53">behavior</text>
    <text x="295" y="53">portability</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="65" y="86">SC1091</text>
    <text x="180" y="86">SC2086, SC2164</text>
    <text x="295" y="86">SC3030, SC3054</text>
  </g>
</svg>
```

SC1xxx is about reading the script: syntax, and files it could not follow. SC2xxx is the big family of "this runs, but not how you meant". SC3xxx appears under `#!/bin/sh` and means "not in POSIX".
:::

::: context severity-picture What -S error throws away
The sixteen findings on the draft script, grouped by level. `-S error` keeps only the red bar.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="30">error</text>
    <text x="10" y="58">warning</text>
    <text x="10" y="86">info</text>
    <text x="10" y="114">style</text>
  </g>
  <rect x="80" y="18" width="40" height="18" fill="#b4232c"/>
  <rect x="80" y="46" width="40" height="18" fill="#6c7a93"/>
  <rect x="80" y="74" width="200" height="18" fill="#6c7a93"/>
  <rect x="80" y="102" width="40" height="18" fill="#6c7a93"/>
  <g font-size="12" fill="#1f2a44">
    <text x="128" y="31">2</text>
    <text x="128" y="59">2 (SC2164, SC2155)</text>
    <text x="288" y="87">10</text>
    <text x="128" y="115">2</text>
  </g>
</svg>
```

Each unit of bar length is one finding. The ten `info` findings include all six unquoted expansions (SC2086) — the ones most likely to destroy data.
:::

::: context wrong-directory-picture Where the script really was
The script meant to work inside `/nosuchdir`. The `cd` failed, so every later command ran wherever the script was started.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="24">/</text>
    <text x="44" y="50">tmp/</text>
    <text x="68" y="76">work/</text>
    <text x="92" y="102">bin/  camp/  …</text>
    <text x="44" y="128" fill="#6c7a93">nosuchdir/ (does not exist)</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="26" y1="30" x2="26" y2="124"/><line x1="26" y1="46" x2="40" y2="46"/><line x1="26" y1="124" x2="40" y2="124"/>
    <line x1="50" y1="56" x2="50" y2="72"/><line x1="50" y1="72" x2="64" y2="72"/>
    <line x1="74" y1="82" x2="74" y2="98"/><line x1="74" y1="98" x2="88" y2="98"/>
  </g>
  <text x="220" y="62" font-size="12" fill="#b4232c">script ran here</text>
  <line x1="216" y1="66" x2="118" y2="74" stroke="#b4232c" stroke-width="1.5"/>
  <text x="220" y="118" font-size="12" fill="#1d6fd1">meant to run here</text>
  <line x1="216" y1="122" x2="200" y2="124" stroke="#1d6fd1" stroke-width="1.5"/>
</svg>
```

With `rm -rf ./*` as the next line, the files deleted would be the ones in `/tmp/work` — the project itself.
:::

::: context nullglob-trap What nullglob changes
Normally, a glob that matches nothing stays as itself: `./*.log` in an empty folder is passed along as the literal text `./*.log`, and a command then complains "No such file". With `shopt -s nullglob`, it vanishes instead, leaving zero words.

For an array that is perfect — `logs=(./*.log)` becomes an empty array with count 0. For a command it can be a trap. Many tools, `grep` among them, read standard input when given no file names, so `grep MISS --` with nothing after it waits for you to type.
:::

::: context make-tab Why make insists on a tab
`make` was written by Stuart Feldman at Bell Labs in 1976. In a `Makefile`, the lines that say *what to run* must begin with a tab character; spaces that look identical are an error, reported as "missing separator".

The rule is widely regretted, but it could not be changed once people depended on it. Most editors can be set to show tabs, which saves a confusing afternoon.
:::

::: context ci-meaning What CI means
**Continuous integration** is the practice of running automatic checks on every change before it is merged — building the code, running the tests, and running linters. Services such as GitHub Actions or GitLab CI start a fresh machine for each pull request, run the steps, and mark the change green or red.

A step fails when its command exits non-zero. That is why a tool's exit status matters so much: it is the only thing the CI system actually reads.
:::

::: context posix-sh What POSIX sh is
**POSIX** is a standard that says what every Unix-like system must provide, including a basic shell language. `/bin/sh` promises only that language. On Ubuntu, `/bin/sh` is `dash`, a small, fast shell that has no arrays, no `[[ ]]` and no `$'…'` strings.

So a script that says `#!/bin/sh` but uses bash features works on a machine where `sh` happens to be bash, and breaks on Ubuntu. `shellcheck` catches that before it ships.
:::
