---
id: l02-set-euo-pipefail
title: set -euo pipefail, and what each flag protects against
minutes: 18
covers:
  - set -euo pipefail and what each flag actually does
---

Bash's defaults were designed for an interactive session, where a failed command is obvious because you are watching. In a script those defaults are dangerous: a command fails, the script prints an error nobody reads, and then carries on doing the next thing with a file that does not exist. The run "succeeds", exits 0, and produces output that is wrong rather than missing — which is far worse, because nothing downstream will notice.

`set -euo pipefail` at the top of a script changes three of those defaults. This lesson shows each one failing and each one saving you, with the script's exit status printed every time. It also spends half its length on the other half of the subject: the places where `set -e` does *not* fire. Those holes are not bugs, they are deliberate, and a script author who does not know them will believe the script is protected when it is not.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21 on Ubuntu 24.04.4, running as an ordinary user in a small campaign directory. Line numbers in bash's messages refer to the scripts as shown.

## `-e`: stop at the first failure

Without it, a script runs every line regardless of what the previous ones did:

```bash
#!/usr/bin/env bash
echo "step 1: preparing"
cp missing_config.yaml /tmp/cfg.yaml
echo "step 2: running the sweep with /tmp/cfg.yaml"
echo "step 3: done"
```

```text
step 1: preparing
cp: cannot stat 'missing_config.yaml': No such file or directory
step 2: running the sweep with /tmp/cfg.yaml
step 3: done
```

Exit status **0**. Look at what that means in practice. The `cp` failed, so `/tmp/cfg.yaml` is either absent or a stale copy from a previous run. Step 2 announced that it is using it. Step 3 declared success. A scheduler reading the exit status sees a green run, and the campaign's results were computed from whatever configuration happened to be lying around.

Add one line:

```bash
#!/usr/bin/env bash
set -e
echo "step 1: preparing"
cp missing_config.yaml /tmp/cfg.yaml
echo "step 2: running the sweep with /tmp/cfg.yaml"
echo "step 3: done"
```

```text
step 1: preparing
cp: cannot stat 'missing_config.yaml': No such file or directory
```

Exit status **1**. The script stopped at the failure and passed the failing command's status up. That is the whole of `-e`: **exit immediately if a command returns non-zero**, with that command's status.

## `-u`: an unset variable is an error

By default, expanding a variable that was never set yields the empty string, silently:

```bash
#!/usr/bin/env bash
OUT="results"
echo "would run: rm -rf /srv/campaign/$OUTDIR"
```

```text
would run: rm -rf /srv/campaign/
```

The variable is `OUT`; the script says `OUTDIR`. One typo, and the path the script was about to act on is the *parent* of everything, not one directory inside it. (This one only prints the command; the point is what the expansion became.) With `-u`:

```bash
#!/usr/bin/env bash
set -u
OUT="results"
echo "would run: rm -rf /srv/campaign/$OUTDIR"
echo "not reached"
```

```text
./bin/withu.sh: line 4: OUTDIR: unbound variable
```

Exit status **1**, and the message names the file, the line and the variable. `-u` turns "a value I forgot to provide" from an empty string into an error, which is the difference between a typo that destroys data and a typo that stops the script.

### Making `-u` liveable: default expansions

A script with optional parameters needs a way to say "use this if it is unset", or `-u` kills it. Bash has four forms, and they are worth knowing exactly:

| Form | If `var` is unset or empty | Side effect |
| --- | --- | --- |
| `${var:-default}` | expands to `default` | none |
| `${var:=default}` | expands to `default` | **assigns** it to `var` |
| `${var:?message}` | prints `message` and exits | aborts the script |
| `${var:+alt}` | expands to nothing | the *opposite*: `alt` only if var is set |

(Omit the colon — `${var-default}` — and the test becomes "unset" only, so an explicitly empty value is kept.)

::: example The four forms, with the exit status each produces
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "cases   = ${CASES:-10}"
echo "outdir  = ${OUTDIR:=results}"
echo "outdir is now $OUTDIR"
echo "verbose = ${VERBOSE:-}"
echo "about to require SIM_ROOT"
: "${SIM_ROOT:?set SIM_ROOT to the campaign directory}"
echo "not reached"
```

Run with nothing set:

```text
cases   = 10
outdir  = results
outdir is now results
verbose =
about to require SIM_ROOT
./bin/defaults.sh: line 8: SIM_ROOT: set SIM_ROOT to the campaign directory
```

Exit status **1**. `CASES` fell back to 10 without being assigned; `OUTDIR` fell back *and* was assigned, which is why the next line can use `$OUTDIR` bare; `VERBOSE` is deliberately empty, and `${VERBOSE:-}` is the idiom for "I know this may be unset and that is fine" — without it `-u` would kill the script on a variable you never intended to require. And `SIM_ROOT` is mandatory, so `${SIM_ROOT:?…}` aborts with your message rather than bash's.

The `:` in front of `"${SIM_ROOT:?…}"` is the null command — it does nothing and ignores its arguments, so the line exists purely for the expansion's side effect. That is the standard way to write a required-parameter check.

Supply the variable and the script completes:

```bash
CASES=500 SIM_ROOT=/srv ./bin/defaults.sh
```

```text
cases   = 500
outdir  = results
outdir is now results
verbose =
about to require SIM_ROOT
not reached
```

Exit status 0. Note that `"$@"` and `$#` are always safe under `-u` even with no arguments — an empty argument list is not an unset variable:

```text
count=0
first=<none>
```
:::

## `-o pipefail`: a pipeline is as strong as its weakest stage

A pipeline's exit status is, by default, the status of the **last** command only. Everything before it can fail unnoticed:

```bash
#!/usr/bin/env bash
set -e
grep DIVERGED logs/driver.log | wc -l
echo "reached the end, exit status of the pipeline was $?"
```

```text
0
reached the end, exit status of the pipeline was 0
```

`grep` found nothing and exited 1. `wc` counted the nothing and exited 0. The pipeline reported 0, `set -e` had nothing to act on, and the script reached its end — printing a count of zero that means "no matches" but could equally have meant "the log file was unreadable". Add the third flag:

```bash
#!/usr/bin/env bash
set -eo pipefail
grep DIVERGED logs/driver.log | wc -l
echo "not reached"
```

```text
0
```

Exit status **1**. `pipefail` makes the pipeline return the rightmost non-zero status, so `grep`'s 1 propagates and `-e` fires.

The array that shows you the whole picture is `PIPESTATUS`, one entry per stage, and it must be read on the very next line because the next command replaces it:

```bash
grep DIVERGED logs/driver.log | wc -l; echo "PIPESTATUS = ${PIPESTATUS[*]}"
```

```text
0
PIPESTATUS = 1 0
```

::: warning
`pipefail` makes `grep` and `head` newly dangerous, because both exit non-zero for perfectly ordinary reasons. `grep` returns 1 when a pattern legitimately does not match, and a producer piped into `head` is killed by `SIGPIPE` once `head` has enough. With `pipefail` those become script-killing failures.

The fix is to say so where it is true, not to remove the flag: append `|| true` to a pipeline whose failure is acceptable, or capture the status and test it:

```bash
count=$(grep -c DIVERGED logs/driver.log || true)
```

If you need to distinguish "no matches" from "could not read the file", test the status explicitly — `grep` returns 1 for the first and 2 for the second.
:::

## What `set -e` does not catch

This is the half that matters. `set -e` is suppressed wherever bash is *testing* a command's status rather than relying on it, because in those places a non-zero status is data, not a failure.

::: example Eight lines that all fail, under `set -euo pipefail`
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "A: inside if";      if false; then echo unreachable; fi
echo "B: after &&";       false && echo unreachable
echo "C: after ||";       false || echo "the || branch ran"
echo "D: negated";        ! false
echo "E: in a while condition"; while false; do :; done
echo "F: assignment from a failing command substitution"; out="$(false || true)"
echo "G: still alive"
```

```text
A: inside if
B: after &&
C: after ||
the || branch ran
D: negated
E: in a while condition
F: assignment from a failing command substitution
G: still alive
```

Exit status **0**. Every one of those commands failed and the script ran to the end.

The rule behind all of them: `-e` does not apply to a command whose status is being consumed — the condition of `if`, `while` or `until`, any command in a `&&` or `||` chain except the last, a command preceded by `!`, and anything inside a construct that is itself in one of those positions. That last clause is the one that catches people: a *function* called from an `if` runs with `-e` effectively disabled for its whole body, so a helper that is safe when called directly is not when called as a test.

Note `B` in particular. `false && echo unreachable` fails, and the script continues — so the popular habit of writing `cmd1 && cmd2` on one line silently opts that line out of `-e`. Write them on separate lines.
:::

::: warning
The single most common way to lose `set -e` in real scripts is `local`:

```bash
local_demo() { local n="$(grep -c DIVERGED logs/driver.log)"; echo "  local n=[$n] and we are still here"; }
plain_demo() { n="$(grep -c DIVERGED logs/driver.log)"; echo "  plain n=[$n] -- not reached"; }
local_demo
plain_demo
```

```text
about to assign with local
  local n=[0] and we are still here
```

Exit status **1** — from `plain_demo`, not from `local_demo`. The two lines look identical and behave differently, because `local` is itself a *command*, and the exit status of `local n="$(...)"` is the status of `local` — which succeeded in declaring the variable. The command substitution's failure is thrown away. Exactly the same applies to `declare`, `export` and `readonly`.

The fix is to split the line:

```bash
local n
n="$(grep -c DIVERGED logs/driver.log)"
```

Now the assignment is its own command and its status is the substitution's. `shellcheck` (lesson 12) flags the one-line form as SC2155, and this is why.
:::

### `inherit_errexit`

A command substitution runs in a subshell, and by default that subshell does not inherit `-e`:

```bash
set -euo pipefail
out="$(false; echo "subshell kept going")"
echo "out=[$out]  status=$?"
echo "end"
```

```text
out=[subshell kept going]  status=0
end
```

The `false` was ignored inside the subshell and the assignment picked up the later output. Turning on the shell option changes it:

```bash
set -euo pipefail
shopt -s inherit_errexit
out="$(false; echo "subshell kept going")"
echo "out=[$out]  status=$?"
echo "end"
```

That script prints nothing at all and exits **1**: the subshell now aborts at `false`, the substitution fails, and `-e` fires in the parent. `shopt inherit_errexit` reports `off` by default. It is worth adding to any script whose command substitutions contain more than one command.

### A trap that tells you where it died

`set -e` stops the script but says nothing about where. An `ERR` trap fixes that, and `-E` makes the trap apply inside functions as well:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "FAILED at line $LINENO running: $BASH_COMMAND" >&2' ERR
work() { cp missing_config.yaml /tmp/x.yaml; }
echo "starting"
work
echo "not reached"
```

```text
starting
cp: cannot stat 'missing_config.yaml': No such file or directory
FAILED at line 4 running: cp missing_config.yaml /tmp/x.yaml
```

Exit status **1**, and now the log says which line and which command. `$BASH_COMMAND` is the command being executed when the trap fired and `$LINENO` its line. Without `-E`, the `ERR` trap is not inherited by functions, subshells or command substitutions, and this script would have died silently. Lesson 07 covers `trap` properly; this is the one use of it that belongs next to `set -e`.

::: key
`-e` exits on the first command that returns non-zero. `-u` makes an unset variable an error instead of an empty string. `-o pipefail` makes a pipeline return the first non-zero status instead of only the last command's. `-e` is suppressed inside `if`, `while` and `until` conditions, in `&&`/`||` chains, after `!`, and throughout any function called in one of those positions — and it is masked by `local x="$(cmd)"`, where the status is `local`'s. Check statuses explicitly where it matters.
:::

## Check yourself

::: check
A nightly campaign script begins `set -euo pipefail` and ends with a tarball that is missing three of its ten cases, while the job reported success. Give two mechanisms by which that can happen despite the flags.
:::

::: answer
First, the failing command was in a position where `-e` is suppressed. If the loop body is `run_case "$i" && record "$i"`, or the case is run inside an `if` — `if ! run_case "$i"; then log_warning; fi` — a non-zero status is data, not a failure, and the loop continues. Writing `cmd1 && cmd2` on one line is the commonest form of this, because it looks like sequencing and is actually a tested chain.

Second, the failure was masked by an assignment. `local out="$(run_case "$i")"` returns `local`'s status, which is zero, so a case that crashed leaves `out` empty and the script proceeds. The same applies to `declare`, `export` and `readonly`, and to a command substitution containing several commands unless `shopt -s inherit_errexit` is on.

There is a third possibility worth checking: the case program itself exited 0 while failing, so there was nothing for `-e` to see. Verify the output, not the status — count the files and compare against the case list before the script declares success. A `trap ... ERR` with `$LINENO` and `$BASH_COMMAND` turns the first two into a log line that names the culprit.
:::

::: check
Why does `count=$(grep -c ERROR run.log)` abort a script under `set -e` when the log contains no errors, and what are two correct ways to write it?
:::

::: answer
Because `grep` exits 1 to mean "no lines matched", which is a normal result and not an error. The assignment's exit status is the command substitution's status, so the assignment fails, and `-e` ends the script — on the happy path, when everything is fine.

Two correct forms. Append `|| true` so the failure is absorbed deliberately: `count=$(grep -c ERROR run.log || true)`. Or test the status explicitly when you need to distinguish outcomes:

```bash
if count=$(grep -c ERROR run.log); then
  echo "$count errors"
else
  echo "no errors"
  count=0
fi
```

The second is better whenever "no matches" and "could not read the file" should be treated differently, because `grep` returns 1 for the first and 2 for the second, and `|| true` swallows both. Note that `grep -c` prints `0` and exits 1, so the value is usable either way — it is only the status that is in the way.
:::

::: check
Explain precisely why `local n="$(cmd)"` behaves differently from `local n` followed by `n="$(cmd)"` under `set -e`.
:::

::: answer
`local` is a builtin *command*, and the exit status of a command that performs an assignment as part of its arguments is the status of the command, not of the expansions in its arguments. So `local n="$(cmd)"` runs `cmd`, captures its output, hands the result to `local`, and `local` succeeds — status 0. `cmd`'s status is discarded before `-e` ever looks at it.

Split into two statements, the second is a plain assignment. A plain assignment's exit status *is* the status of the last command substitution in it, so `n="$(cmd)"` fails when `cmd` fails, and `-e` fires.

The same trap applies to `declare`, `export`, `readonly` and `typeset`. `shellcheck` reports it as SC2155, "Declare and assign separately to avoid masking return values", and it is one of the warnings most worth never suppressing. The one case where the single-line form is fine is when you genuinely do not care whether the command succeeded — and then `|| true` makes that intention visible.
:::

::: check
What does `${OUTDIR:=results}` do that `${OUTDIR:-results}` does not, and when would you want each?
:::

::: answer
`:-` substitutes a default for this one expansion and leaves the variable alone. `:=` substitutes the default *and assigns it*, so the variable holds the value from then on.

Use `:-` when you want a fallback at the point of use and nothing else — reading `${VERBOSE:-}` to keep `set -u` quiet, or `${CASES:-10}` in a single command. Use `:=` when the value will be referenced repeatedly and you want one authoritative copy: set it once near the top and every later `$OUTDIR` is correct, including inside functions and in anything the script exports.

Two details. Both treat unset and empty alike; drop the colon (`${OUTDIR-results}`, `${OUTDIR=results}`) to distinguish them, so that an explicitly empty value is respected. And `:=` cannot be used on positional parameters: `${1:=default}` fails with `bash: $1: cannot assign in this way`, so a default for an argument has to be written `arg="${1:-default}"`.
:::

::: check
Your script has `set -euo pipefail`, and a colleague adds `2>/dev/null` to a noisy command. The script now completes but produces no output. What should you suspect, and what is the better change?
:::

::: answer
Suspect that the command was failing all along, and that its error message — now discarded — was the only evidence. `2>/dev/null` hides the diagnosis but not the exit status, so if the script now *completes*, something else must also have changed: most likely the same edit added `|| true`, or moved the command into an `if` or a `&&` chain, which is where `-e` stops applying. A command that merely had its stderr redirected would still abort the script under `-e`.

The better change is to send the noise somewhere you can read it rather than to `/dev/null`: `2>>run-errors.log`, or `2>&1 | tee -a run.log` if you want it interleaved. Noise is the thing that becomes the diagnosis the one time it matters, and a campaign that silently produced no output is precisely that time.

If the noise really is harmless — a tool warning about a deprecated flag — filter it by content rather than by stream: `2> >(grep -v 'deprecated' >&2)`, or fix the flag.
:::

## Summary

| Flag or form | Does | Note |
| --- | --- | --- |
| `set -e` | exit on the first non-zero status | propagates that command's status |
| `set -u` | an unset variable is a fatal error | "unbound variable", with file and line |
| `set -o pipefail` | a pipeline returns the rightmost non-zero status | otherwise only the last stage counts |
| `${PIPESTATUS[*]}` | one status per pipeline stage | read it on the very next line |
| `set -x` / `set +x` | trace commands after expansion | `bash -x script.sh` without editing |
| `set -E` | `ERR` traps are inherited by functions and subshells | needed for a useful `trap … ERR` |
| `shopt -s inherit_errexit` | command substitutions inherit `-e` | off by default |
| `${var:-d}` / `${var:=d}` / `${var:?msg}` / `${var:+alt}` | default / assign default / require / only-if-set | drop the colon to test "unset" only |
| `: "${VAR:?msg}"` | a required-parameter check | `:` is the null command |
| `${VERBOSE:-}` | "may be unset, and that is fine" | what keeps `-u` from killing optional flags |
| `-e` suppressed in | `if`/`while`/`until` conditions, `&&`/`||` chains, after `!`, and inside functions called there | `cmd1 && cmd2` opts that line out |
| `local n="$(cmd)"` | status is `local`'s, so the failure is lost | split the declaration and the assignment (SC2155) |
| `count=$(grep -c X f \|\| true)` | absorb a legitimate non-match | `grep` returns 1 for no match, 2 for a real error |
| `trap '… $LINENO $BASH_COMMAND' ERR` | say where the script died | with `-E`, works inside functions too |

Lesson 03 turns to the other large source of silent bugs: what happens to a variable between the moment you write `$x` and the moment the command sees it — word splitting, glob expansion, and the quoting that stops both.
