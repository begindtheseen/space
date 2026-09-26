---
id: l02-set-euo-pipefail
title: set -euo pipefail, and what each flag protects against
minutes: 21
covers:
  - set -euo pipefail and what each flag actually does
---

Imagine following a cake recipe. Step 2 says "crack three eggs", and you discover there are no eggs. A sensible cook stops. A robot cook that ignores problems carries on, bakes an eggless cake, and proudly announces "done". Bash, out of the box, is that robot. Its **[[defaults were designed for typing by hand|interactive-defaults]]**, where you watch each command and notice when one fails. In a script nobody is watching. A command fails, prints an error nobody reads, and the script carries on with a file that does not exist. The run "succeeds" and hands back output that is *wrong* rather than *missing* — far worse, because nothing further down the line will notice.

One line near the top of a script changes three of those defaults: `set -euo pipefail` (read "set dash e u o pipefail"). This lesson shows each flag failing and each flag saving you, with the script's **exit status** — the number it hands back, where 0 means success and anything else means failure — printed every time. It also spends half its length on the other half of the subject: the places where `set -e` does *not* fire. Those gaps are on purpose, and an author who does not know them believes a script is protected when it is not.

On a real campaign — say, five hundred trajectory simulations running overnight on a cluster — this line is the difference between a job that stops at case 37 and says why, and a job that reports success on a folder of half-empty files.

All output below was produced on a real machine and pasted exactly, with GNU bash 5.2.21 on Ubuntu 24.04.4, as an ordinary user in a small campaign directory. Line numbers in bash's messages refer to the scripts as shown.

## `-e`: stop at the first failure

Without it, a script runs every line no matter what the lines before it did:

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

Exit status **0**. Think about what that means. The `cp` failed, so `/tmp/cfg.yaml` is either missing or a stale copy left over from a previous run. Step 2 announced that it is using it. Step 3 declared success. A scheduler reading the exit status sees a green run, and the campaign's results came from whatever settings happened to be lying around.

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

Exit status **1**. The script stopped at the failure and passed the failing command's status up to whoever ran it. That is the whole of `-e`: **exit immediately if a command returns non-zero**, with that command's status.

## `-u`: an unset variable is an error

A variable that was never given a value is called **unset**. By default, bash quietly replaces an unset variable with nothing at all — an empty string:

```bash
#!/usr/bin/env bash
OUT="results"
echo "would run: rm -rf /srv/campaign/$OUTDIR"
```

```text
would run: rm -rf /srv/campaign/
```

The variable is named `OUT`; the next line asks for `OUTDIR`. One typo, and the folder the script was about to delete is the *parent* of everything, not one folder inside it. This script only prints the command, but a real one would have run it. With `-u`:

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

Exit status **1**, and the message names the file, the line and the **[[unbound|unbound-word]]** variable. `-u` turns "a value I forgot to provide" from an empty string into an error. That is the difference between a typo that destroys data and a typo that stops the script.

### Making `-u` livable: default expansions

Think of a form with a few optional boxes. A blank optional box should get a sensible default; a blank *required* box should stop the clerk. Bash has four forms for this, and they are worth knowing exactly. Read `${var:-default}` as "var, colon-dash, default".

| Form | If `var` is unset or empty | Side effect |
| --- | --- | --- |
| `${var:-default}` | expands to `default` | none |
| `${var:=default}` | expands to `default` | **assigns** it to `var` |
| `${var:?message}` | prints `message` and exits | aborts the script |
| `${var:+alt}` | expands to nothing | the *opposite*: `alt` only if var is set |

Leave out the colon — `${var-default}` — and the test becomes "unset" only, so a value that was deliberately set to empty is kept.

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

Run it with nothing set:

```text
cases   = 10
outdir  = results
outdir is now results
verbose =
about to require SIM_ROOT
./bin/defaults.sh: line 8: SIM_ROOT: set SIM_ROOT to the campaign directory
```

Exit status **1**. Walk through it line by line:

1. `CASES` was unset, so it fell back to `10` — without being assigned.
2. `OUTDIR` fell back to `results` *and* was assigned. That is why line 5 can use `$OUTDIR` on its own.
3. `VERBOSE` expanded to nothing. `${VERBOSE:-}` is the idiom for "this may be unset, and that is fine". Without it, `-u` would kill the script over a variable you never meant to require.
4. `SIM_ROOT` is required, so `${SIM_ROOT:?…}` stopped the script with *your* message instead of bash's.

The `:` at the start of line 8 is the **[[null command|colon-command]]**: it does nothing and ignores its arguments. The line exists only for the side effect of the expansion. That is the standard way to write a required-parameter check.

Now supply the variables. Writing `NAME=value` in front of a command sets that variable for that one command:

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

Exit status 0. One more reassurance: `"$@"` (all the arguments) and `$#` (how many there are) are always safe under `-u`, even with no arguments. An empty argument list is not an unset variable. A script printing `$#` and `${1:-<none>}` with no arguments gives:

```text
count=0
first=<none>
```
:::

::: key Default value expansions
`${var:-default}` (colon-dash) gives a default if `var` is unset or empty. `${var:=default}` (colon-equals) gives the default *and assigns it*. `${var:?message}` (colon-question) aborts the script with a message. These are how you keep `-u` from killing scripts with optional parameters.
:::

## `-o pipefail`: a pipeline is as strong as its weakest stage

A **pipeline** joins commands with `|` (read "pipe"), so the output of one becomes the input of the next — like an assembly line. By default, only the **last** worker on the line reports whether things went well. Everything before it can fail unnoticed:

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

(`$?`, read "dollar question mark", is the exit status of the most recent command.) Here is **[[what happened|pipe-statuses]]**, stage by stage:

1. `grep` searched for `DIVERGED`, found nothing, and exited 1.
2. `wc -l` counted the empty input, printed `0`, and exited 0.
3. The pipeline reported `wc`'s 0, so `set -e` had nothing to act on.

The count of zero means "no matches" — but it would look exactly the same if the log had been unreadable. Add the third flag:

```bash
#!/usr/bin/env bash
set -eo pipefail
grep DIVERGED logs/driver.log | wc -l
echo "not reached"
```

```text
0
```

Exit status **1**. `pipefail` makes the pipeline return the status of the rightmost stage that failed, so `grep`'s 1 comes through and `-e` fires.

To see every stage's status, read the array `PIPESTATUS`, which has one entry per stage. Read it on the very next command, because the next command replaces it:

```bash
grep DIVERGED logs/driver.log | wc -l; echo "PIPESTATUS = ${PIPESTATUS[*]}"
```

```text
0
PIPESTATUS = 1 0
```

::: key What each flag does
`set -e` exits on the first command that returns non-zero. `set -u` makes an unset variable an error instead of an empty string. `set -o pipefail` makes a pipeline fail when any stage fails — it returns the rightmost non-zero status — instead of returning only the last command's status.
:::

::: warning `grep` and `head` under pipefail
`pipefail` makes `grep` and `head` newly dangerous, because both exit non-zero for perfectly ordinary reasons. `grep` returns 1 when a pattern honestly does not match. And a command feeding into `head` is stopped by a **[[SIGPIPE|sigpipe]]** signal once `head` has read enough. With `pipefail`, both become script-killing failures.

The fix is to say so where it is true, not to remove the flag. Add `|| true` (read "or-or true": "if that failed, run `true`, which always succeeds") to a command whose failure is acceptable:

```bash
count=$(grep -c DIVERGED logs/driver.log || true)
```

If you need to tell "no matches" apart from "could not read the file", test the status yourself: `grep` returns 1 for the first and 2 for the second.
:::

## What `set -e` does not catch

This is the half that matters. `set -e` is switched off wherever bash is **[[testing a command's status|errexit-decision]]** rather than relying on it. In those places a non-zero status is an answer to a question, not a failure.

::: example Seven failures, and the script survives them all
Each line prints a label, then runs a command that fails:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "A: inside if";      if false; then echo unreachable; fi
echo "B: after &&";       false && echo unreachable
echo "C: after ||";       false || echo "the || branch ran"
echo "D: negated";        ! false
echo "E: in a while condition"; while false; do :; done
echo "F: inside a command substitution"; out="$(false; echo ok)"
echo "G: still alive, out=$out"
```

```text
A: inside if
B: after &&
C: after ||
the || branch ran
D: negated
E: in a while condition
F: inside a command substitution
G: still alive, out=ok
```

Exit status **0**. Every one of those lines ran a failing command (`false` always fails), and the script reached the end. Go through them:

- **A** and **E**: `if` and `while` exist to ask "did this succeed?", so failure is a legitimate answer.
- **B** and **C**: in `a && b` (read "and-and": run `b` only if `a` succeeded) or `a || b` (run `b` only if `a` failed), the left side is being tested.
- **D**: `!` (read "not") flips a status, so the original status is being used.
- **F**: a command substitution runs in a **[[subshell|subshell]]**, which does not inherit `-e`; see `inherit_errexit` below.

The rule behind A to E: `-e` does not apply to a command whose status is being used — the condition of `if`, `while` or `until`, any command in a `&&` or `||` chain except the last, a command after `!`, and anything inside a construct sitting in one of those positions. That last clause catches people. A **function** called from an `if` runs with `-e` effectively off for its whole body. A helper that is safe when you call it directly is not safe when you call it as a test.

Look at B again. `false && echo unreachable` fails, and the script carries on. So the popular habit of writing `cmd1 && cmd2` on one line quietly **[[opts that line out of -e|and-chain]]**. Write them on separate lines.
:::

::: warning The `local` trap
The single most common way to lose `set -e` in real scripts is `local`, the keyword that makes a variable private to a function:

```bash
local_demo() { local n="$(grep -c DIVERGED logs/driver.log)"; echo "  local n=[$n] and we are still here"; }
plain_demo() { n="$(grep -c DIVERGED logs/driver.log)"; echo "  plain n=[$n] -- not reached"; }
echo "about to assign with local"
local_demo
plain_demo
```

```text
about to assign with local
  local n=[0] and we are still here
```

Exit status **1** — from `plain_demo`, not from `local_demo`. The two lines look the same and behave differently. `local` is itself a *command*, and the status of `local n="$(...)"` is the status of `local`, which succeeded in creating the variable. The failure of the `grep` inside is thrown away. The same happens with `declare`, `export` and `readonly`.

The fix is to split the line in two:

```bash
local n
n="$(grep -c DIVERGED logs/driver.log)"
```

Now the assignment is its own command, and its status is the `grep`'s. `shellcheck` (lesson 12) flags the one-line form as SC2155, for exactly this reason.
:::

### `inherit_errexit`

Line F above showed it: a command substitution runs in a subshell, and by default that subshell does not inherit `-e`.

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

The `false` was ignored inside the subshell, and the assignment picked up the later output. A shell option, switched on with `shopt -s`, changes this:

```bash
set -euo pipefail
shopt -s inherit_errexit
out="$(false; echo "subshell kept going")"
echo "out=[$out]  status=$?"
echo "end"
```

This version prints nothing at all and exits **1**. The subshell now stops at `false`, so the substitution fails, so `-e` fires in the main script. `shopt inherit_errexit` reports `off` by default. Add it to any script whose command substitutions contain more than one command.

### A trap that tells you where it died

`set -e` stops the script but does not say where. An **`ERR` trap** — a command bash runs whenever a command fails — fixes that. The `-E` flag makes the trap work inside functions too:

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

Exit status **1**, and now the log names the line and the command. `$BASH_COMMAND` is the command that was running when the trap fired, and `$LINENO` is its line. `>&2` sends the message to the error stream. Without `-E`, the `ERR` trap is not passed on to functions, subshells or command substitutions, and this script would have died with no `FAILED` line. **[[Lesson 07|trap-bridge]]** covers `trap` properly; this is the one use of it that belongs next to `set -e`.

::: key Why set -e is not a complete safety net
`-e` is suppressed inside conditions (`if`, `while`, `until`), in `&&` and `||` chains, after `!`, for any command whose status is tested, and for functions called in those positions. It also cannot see a failure hidden mid-pipeline unless `pipefail` is on, and it is masked by `local x="$(cmd)"`, where the status is `local`'s. Check critical statuses explicitly.
:::

## Check yourself

::: check
A nightly campaign script begins `set -euo pipefail` and ends with a tarball missing three of its ten cases, while the job reported success. Give two ways that can happen despite the flags.
:::

::: answer
First, the failing command sat where `-e` is switched off. If the loop body is `run_case "$i" && record "$i"`, or the case runs inside an `if` — `if ! run_case "$i"; then log_warning; fi` — a non-zero status is an answer, not a failure, and the loop carries on. Writing `cmd1 && cmd2` on one line is the most common form of this, because it looks like "do this, then that" but is really a tested chain.

Second, an assignment hid the failure. `local out="$(run_case "$i")"` returns `local`'s status, which is 0, so a case that crashed leaves `out` empty and the script moves on. The same goes for `declare`, `export` and `readonly`, and for a command substitution holding several commands unless `shopt -s inherit_errexit` is on.

A third possibility is worth checking: the case program itself exited 0 while failing, so `-e` had nothing to see. Check the output, not only the status — count the result files and compare them with the case list before declaring success. A `trap ... ERR` using `$LINENO` and `$BASH_COMMAND` turns the first two causes into a log line naming the culprit.
:::

::: check
Why does `count=$(grep -c ERROR run.log)` stop a script under `set -e` when the log contains no errors, and what are two correct ways to write it?
:::

::: answer
Because `grep` exits 1 to mean "no lines matched" — a normal result, not an error. The assignment's exit status is the status of the command substitution, so the assignment fails and `-e` ends the script. It dies on the happy path, when everything is fine.

The first fix absorbs the failure on purpose: `count=$(grep -c ERROR run.log || true)`. The second tests the status when you need to tell outcomes apart:

```bash
if count=$(grep -c ERROR run.log); then
  echo "$count errors"
else
  echo "no errors"
  count=0
fi
```

The second is better whenever "no matches" and "could not read the file" should be handled differently. `grep` returns 1 for the first and 2 for the second, and `|| true` swallows both. Note that `grep -c` prints `0` and exits 1, so the value is usable either way; only the status is in the way.
:::

::: check
Explain exactly why `local n="$(cmd)"` behaves differently from `local n` followed by `n="$(cmd)"` under `set -e`.
:::

::: answer
`local` is a built-in *command*. When a command does an assignment as part of its arguments, its exit status is the command's own, not that of the expansions inside its arguments. So `local n="$(cmd)"` runs `cmd`, captures its output, hands the result to `local`, and `local` succeeds with status 0. `cmd`'s status is thrown away before `-e` ever looks at it.

Split into two statements, the second is a plain assignment. A plain assignment's exit status *is* the status of the last command substitution in it. So `n="$(cmd)"` fails when `cmd` fails, and `-e` fires.

The same trap applies to `declare`, `export`, `readonly` and `typeset`. `shellcheck` reports it as SC2155, "Declare and assign separately to avoid masking return values", and it is one of the warnings most worth never silencing. The one-line form is fine only when you truly do not care whether the command succeeded — and then `|| true` makes that intention visible.
:::

::: check
What does `${OUTDIR:=results}` do that `${OUTDIR:-results}` does not, and when would you want each?
:::

::: answer
`:-` puts in a default for this one use and leaves the variable alone. `:=` puts in the default *and assigns it*, so the variable holds that value from then on.

Use `:-` when you want a fallback at one spot and nothing else — `${VERBOSE:-}` to keep `set -u` quiet, or `${CASES:-10}` in a single command. Use `:=` when the value will be used many times and you want one authoritative copy: set it once near the top, and every later `$OUTDIR` is right, including inside functions and in anything the script exports.

Two details. Both treat unset and empty alike; drop the colon (`${OUTDIR-results}`, `${OUTDIR=results}`) to tell them apart, so a deliberately empty value is respected. And `:=` cannot assign to a numbered argument: `${1:=default}` fails with `$1: cannot assign in this way`. A default for an argument is written `arg="${1:-default}"`.
:::

::: check
Your script has `set -euo pipefail`, and a colleague adds `2>/dev/null` to a noisy command. The script now completes but produces no output. What should you suspect, and what is a better change?
:::

::: answer
Suspect that the command was failing all along, and that its error message — now thrown away — was the only evidence. `2>/dev/null` hides the message but not the exit status. So if the script now *completes*, something else must also have changed: most likely the same edit added `|| true`, or moved the command into an `if` or a `&&` chain, where `-e` stops applying. A command that only had its error stream redirected would still stop the script under `-e`.

The better change is to send the noise somewhere you can read it instead of `/dev/null`: `2>>run-errors.log`, or `2>&1 | tee -a run.log` to keep it mixed in with the normal output. The noise is exactly what becomes the diagnosis on the one day it matters, and a campaign that silently produced nothing is that day.

If the noise really is harmless — a tool warning about an outdated flag — filter it by content rather than by stream: `2> >(grep -v 'deprecated' >&2)`. Or fix the flag.
:::

## Summary

| Flag or form | Does | Note |
| --- | --- | --- |
| `set -e` | exit on the first non-zero status | passes that command's status up |
| `set -u` | an unset variable is a fatal error | "unbound variable", with file and line |
| `set -o pipefail` | a pipeline returns the rightmost non-zero status | otherwise only the last stage counts |
| `${PIPESTATUS[*]}` | one status per pipeline stage | read it on the very next command |
| `set -x` / `set +x` | trace commands after expansion | `bash -x script.sh` without editing |
| `set -E` | `ERR` traps are inherited by functions and subshells | needed for a useful `trap … ERR` |
| `shopt -s inherit_errexit` | command substitutions inherit `-e` | off by default |
| `${var:-d}` / `${var:=d}` / `${var:?msg}` / `${var:+alt}` | default / assign default / require / only-if-set | drop the colon to test "unset" only |
| `: "${VAR:?msg}"` | a required-parameter check | `:` is the null command |
| `${VERBOSE:-}` | "may be unset, and that is fine" | keeps `-u` from killing optional settings |
| `-e` suppressed in | `if`/`while`/`until` conditions, `&&`/`\|\|` chains, after `!`, and inside functions called there | `cmd1 && cmd2` opts that line out |
| `local n="$(cmd)"` | status is `local`'s, so the failure is lost | split declaration and assignment (SC2155) |
| `count=$(grep -c X f \|\| true)` | absorb a legitimate non-match | `grep` returns 1 for no match, 2 for a real error |
| `trap '… $LINENO $BASH_COMMAND' ERR` | say where the script died | with `-E`, works inside functions too |

Lesson 03 turns to the other big source of silent bugs: what happens to a variable between the moment you write `$x` and the moment the command sees it — word splitting, glob expansion, and the quoting that stops both.

::: context interactive-defaults Why the defaults are so forgiving
The first Unix shells were built for people sitting at a terminal. If you type a command and it fails, you see the error and decide what to do next; a shell that quit on every mistake would log you out constantly. Scripts inherited those same rules, so every script starts in "keep going no matter what" mode. The `-e` and `-u` options date back to the early Bourne shell; `pipefail` came much later, from the Korn shell, and bash added it in version 3.0.
:::

::: context unbound-word Unbound means "has no value"
"Bound" here means "tied to a value". A variable that has been given a value — even an empty one — is bound. A variable that has never been assigned, or was removed with `unset`, is unbound. That is why `-u` complains about `OUTDIR` but not about `VERBOSE=""`: an empty value is still a value. The `:-` forms treat both cases alike; the forms without a colon tell them apart.
:::

::: context colon-command The command that does nothing
`:` is a real built-in command. It ignores its arguments and always succeeds, like `true`. That sounds useless, but bash still *expands* the arguments before throwing them away — so `: "${SIM_ROOT:?message}"` runs the check and discards the result. You will also see it as an empty loop body, `while false; do :; done`, because bash does not allow a completely empty body.
:::

::: context pipe-statuses Each stage has its own status
Every command in a pipeline runs at the same time as the others, and each one finishes with its own exit status. Bash has to pick one number to stand for the whole line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="130" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">grep DIVERGED</text>
  <text x="175" y="42" font-size="16" text-anchor="middle" fill="#1f2a44">|</text>
  <rect x="200" y="20" width="130" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="265" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">wc -l</text>
  <text x="85" y="72" font-size="12" text-anchor="middle" fill="#b4232c">status 1</text>
  <text x="265" y="72" font-size="12" text-anchor="middle" fill="#1d6fd1">status 0</text>
  <text x="20" y="104" font-size="12" fill="#1f2a44">default: last stage only</text>
  <text x="330" y="104" font-size="12" text-anchor="end" fill="#1d6fd1">0</text>
  <text x="20" y="130" font-size="12" fill="#1f2a44">pipefail: rightmost failure</text>
  <text x="330" y="130" font-size="12" text-anchor="end" fill="#b4232c">1</text>
</svg>
```

`PIPESTATUS` keeps all of them — here `1 0` — so you can inspect each stage yourself.
:::

::: context sigpipe When the reader hangs up
`yes | head -1` prints one `y`. `head` then exits, and `yes` — which would print forever — is stopped the next time it tries to write into the now-closed pipe. The kernel sends it the signal SIGPIPE, number 13, and a program killed by signal n reports status 128 + n. So `yes` ends with 141 even though nothing went wrong. Under `pipefail`, that 141 becomes the pipeline's status, and `-e` stops the script.
:::

::: context errexit-decision How bash decides whether to stop
When a command returns non-zero, `-e` asks one question: was anyone checking this status?

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="10" width="160" height="30" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">command returns non-zero</text>
  <line x1="180" y1="40" x2="180" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="180,64 175,56 185,56" fill="#1f2a44"/>
  <rect x="60" y="64" width="240" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="81" font-size="12" text-anchor="middle" fill="#1f2a44">status being tested? (if, while,</text>
  <text x="180" y="96" font-size="12" text-anchor="middle" fill="#1f2a44">left of &amp;&amp; or ||, after !)</text>
  <line x1="110" y1="104" x2="80" y2="132" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="104" x2="280" y2="132" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="78" y="122" font-size="11" text-anchor="end" fill="#1f2a44">yes</text>
  <text x="284" y="122" font-size="11" fill="#1f2a44">no</text>
  <rect x="20" y="134" width="120" height="28" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="80" y="152" font-size="12" text-anchor="middle" fill="#1d6fd1">keep going</text>
  <rect x="206" y="134" width="148" height="28" rx="6" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="280" y="152" font-size="12" text-anchor="middle" fill="#b4232c">exit with that status</text>
</svg>
```

If someone is checking, the non-zero status is an answer to their question, so bash hands it to them instead of stopping.
:::

::: context subshell A subshell is a copy of the shell
A **subshell** is a separate copy of the running shell, started to do some work and then thrown away. `$( … )`, a pipeline stage and `( … )` in parentheses all run in subshells. The copy gets your variables, but anything it changes vanishes when it ends — which is why a variable set inside `$( … )` is not visible afterwards.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="110" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="22" y="30" font-size="12" fill="#1f2a44">your script: set -e is on</text>
  <text x="22" y="48" font-size="11" fill="#6c7a93">out="$( … )"</text>
  <rect x="120" y="40" width="218" height="68" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="229" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">subshell (a copy)</text>
  <text x="229" y="80" font-size="12" text-anchor="middle" fill="#b4232c">-e dropped by default</text>
  <text x="229" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">kept with inherit_errexit</text>
</svg>
```

In bash's normal mode, a command substitution's copy drops the `-e` setting; that is what `inherit_errexit` restores.
:::

::: context and-chain The and-and chain at the end of a function
There is one twist. If `false && echo x` is the *last* line of a function, the function returns that line's status, 1. The line itself did not stop anything, but the function call now fails, and `-e` fires at the caller. So the same line is harmless in the middle of a function and fatal at its end. Behavior that depends on position like this is exactly why writing each command on its own line is the safer habit.
:::

::: context trap-bridge Where traps come back
The `ERR` trap here is for diagnosis. Lesson 07 introduces its more important sibling, the `EXIT` trap, which runs cleanup — deleting temporary folders, releasing locks — however the script ends: success, a failure caught by `set -e`, or Ctrl-C. Together, `set -Eeuo pipefail`, an `ERR` trap and an `EXIT` trap form the standard opening of a robust script.
:::
