---
id: l06-functions-and-exit-codes
title: Functions, return values and exit codes
minutes: 17
covers:
  - Functions, return values, exit codes, $?
---

A bash function does not return a value. It returns a *status* — one byte, where zero means success — and if you want data out of it, the function prints and the caller captures. That one difference from every other language you know accounts for most of what feels strange about shell functions, and getting it straight makes the rest routine.

The second half of this lesson is about the number your whole script hands back. A campaign driver that always exits 0 is invisible to whatever is running it: no scheduler, no CI job, no `&&` in a colleague's one-liner can tell a completed sweep from one that produced nothing. Exit codes are the only interface a program has to the thing that started it, and they are worth designing.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21 and ShellCheck 0.9.0 on Ubuntu 24.04.4.

## Defining and calling

```bash
name() { commands; }
```

The parentheses are always empty — arguments are not declared. Inside the function, `$1`, `$2`, `$@` and `$#` are the *function's* arguments, shadowing the script's; `$0` is still the script:

```bash
f(){ echo "inside: \$#=$# \$1=$1 \$0=$0"; }; f alpha beta
```

```text
inside: $#=2 $1=alpha $0=/home/eng/.transcript.sh
```

Call it by name with space-separated arguments, exactly like a command — because as far as the shell is concerned it *is* one, found before `PATH` is searched. That also means a function silently replaces a program of the same name:

```bash
grep(){ echo "shadowed grep called with: $*"; }
grep -c x file
command grep --version | head -1
```

```text
shadowed grep called with: -c x file
```

```text
grep (GNU grep) 3.11
```

`command grep` bypasses the function and runs the real program, which is how a wrapper calls the thing it wraps. `declare -f name` prints a function's definition and `type name` says what a name currently resolves to; both are how you find out why a command is behaving unexpectedly.

### `local`

Variables in bash are global by default, including ones first assigned inside a function:

```bash
f(){ local x=1; }; f; echo "x after: [${x:-<unset>}]"
g(){ y=1; };       g; echo "y after: [${y:-<unset>}]"
```

```text
x after: [<unset>]
```

```text
y after: [1]
```

Declare every variable a function uses with `local`, without exception. A function that assigns `i` or `tmp` or `count` globally will one day be called from inside a loop that uses the same name, and the loop will not terminate. Note `local` is dynamically scoped — a function called from another function can see its caller's locals — which is unusual but rarely matters in practice.

And from lesson 02: split the declaration from an assignment that captures a command, or the command's failure is masked. `local n` then `n=$(…)`, never `local n=$(…)`.

## Returning a status

`return N` ends the function with status `N`. The status is a **single unsigned byte**:

```bash
f(){ return 300; }; f; echo "return 300 gives \$? = $?"
f(){ return -1;  }; f; echo "return -1 gives \$? = $?"
```

```text
return 300 gives $? = 44
```

```text
return -1 gives $? = 255
```

300 wrapped to 44 (300 − 256) and −1 became 255. So a status can carry a small enumerated result and nothing else — never a count, never an index, never a measurement.

With no `return` at all, a function's status is that of its **last command**, which is a frequent accident: a function whose last line is a `[[ ]]` test returns that test's result, and a function ending in `echo` always returns 0 however badly the rest went.

## Returning a value

Print it, and let the caller capture it:

```bash
count_errors() {
  local file="$1" n
  n=$(grep -c ERROR "$file" || true)
  printf '%s\n' "$n"
}
n=$(count_errors logs/driver.log)
echo "count=$n"
```

```text
count=1
```

Two habits to build. Use `printf '%s\n'` rather than `echo` for a value, because `echo` mangles arguments beginning with `-` and, in some shells, interprets backslashes. And write *only* the value to standard output — progress messages, warnings and diagnostics go to standard error with `>&2`, or they end up inside the variable the caller was capturing.

::: example Three shapes of function, and when each is right
```bash
#!/usr/bin/env bash
set -euo pipefail

# status only
have_errors() { grep -q ERROR "$1"; }

# value on stdout
count_errors() {
  local file="$1" n
  n=$(grep -c ERROR "$file" || true)
  printf '%s\n' "$n"
}

# both: a value, and a status that distinguishes failures
newest_case() {
  local dir="$1"
  [[ -d $dir ]] || return 2
  local f
  f=$(ls -t "$dir"/*.log 2>/dev/null | head -1) || return 1
  [[ -n $f ]] || return 1
  printf '%s\n' "$f"
}

if have_errors logs/driver.log; then echo "driver.log has errors"; fi
if ! have_errors logs/run.log;   then echo "run.log has none"; fi

n=$(count_errors logs/driver.log); echo "count=$n"

if f=$(newest_case logs);      then echo "newest: $f"; else echo "newest_case failed with $?"; fi
if f=$(newest_case nosuchdir); then echo "newest: $f"; else echo "newest_case failed with $?"; fi
```

```text
driver.log has errors
run.log has none
count=1
newest: logs/driver.log
newest_case failed with 2
```

A **predicate** returns status only and is used directly as a condition — `have_errors` is a one-line wrapper around `grep -q` and reads better at the call site than the `grep` would. A **producer** prints one value and says nothing else. The **third shape** does both: it prints a path when it has one and uses distinct non-zero statuses — 2 for "that is not a directory", 1 for "no logs in it" — so the caller can tell the difference.

Note the call form: `if f=$(newest_case logs); then` captures the value *and* branches on the status in one line, because an assignment's status is the substitution's status. And note that `$?` inside the `else` is the status of the `if` condition, which is what you want.
:::

## `$?` is clobbered by the next command

```bash
false; echo "captured once: $?"; echo "and again: $?"
```

```text
captured once: 1
and again: 0
```

The second `$?` is the status of the first `echo`. Save it immediately if you need it more than once:

```bash
false; st=$?; echo "saved: $st"; echo "still: $st"
```

```text
saved: 1
still: 1
```

The same applies to `PIPESTATUS` (lesson 02) and to `BASH_REMATCH` (lesson 05): read them on the very next line.

## `return` versus `exit`

`return` leaves the function. `exit` leaves the **shell** — which is the script, unless the call is inside a subshell:

```bash
#!/usr/bin/env bash
check() { echo "checking"; return 1; }
bail()  { echo "bailing";  exit 7; }
if check; then echo unreachable; else echo "check returned 1, script continues"; fi
out=$(bail); echo "subshell exit did NOT end the script; out=[$out] status=$?"
bail
echo "not reached"
```

```text
checking
check returned 1, script continues
subshell exit did NOT end the script; out=[bailing] status=7
bailing
```

Script exit status **7**. Four lines for five `echo`s, which is the tell: `$(bail)` ran `bail` in a subshell, so the word `bailing` went into `out` instead of to the terminal, and the `exit 7` ended *the subshell* rather than the script. The status came back through the substitution. Called directly on the next line, the same function printed and ended everything — and `echo "not reached"` was, indeed, not reached.

This is why a library of helper functions should use `return` and let the caller decide, and why only a top-level `die`-style function should call `exit`.

## Exit codes a caller can use

By convention: **0 is success and every non-zero value is a failure**. Beyond that the choice is yours, and a few slots are already spoken for.

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | general failure |
| 2 | conventionally, a usage error — wrong or missing arguments |
| 3–63 | yours to define |
| 126 | found but not executable |
| 127 | command not found |
| 128 + N | killed by signal N — 130 is `Ctrl-C`, 137 `SIGKILL`, 143 `SIGTERM` |
| 255 | out of range, or a `return`/`exit` of a negative number |

Because 126, 127 and 128+N are produced by the shell itself, avoid defining your own codes above 125.

::: example A driver whose exit code says what happened
```bash
#!/usr/bin/env bash
set -euo pipefail

readonly EX_OK=0 EX_USAGE=2 EX_NOINPUT=3 EX_CASE_FAILED=4

usage() { printf 'usage: %s <logfile>\n' "$0" >&2; exit "$EX_USAGE"; }
die()   { printf '%s: %s\n' "${0##*/}" "$1" >&2; exit "$2"; }

main() {
  [[ $# -eq 1 ]] || usage
  local log="$1"
  [[ -r $log ]] || die "cannot read $log" "$EX_NOINPUT"
  if grep -q ERROR "$log"; then
    die "at least one case failed" "$EX_CASE_FAILED"
  fi
  echo "all cases OK"
  exit "$EX_OK"
}

main "$@"
```

```text
usage: ./bin/sweepdrv.sh <logfile>
```

```text
sweepdrv.sh: cannot read nosuch.log
```

```text
sweepdrv.sh: at least one case failed
```

```text
all cases OK
```

The four runs exit **2**, **3**, **4** and **0** respectively. Now a scheduler can retry on 3 (the input was not there yet) and page someone on 4 (a case genuinely failed) without parsing any text — which is the whole point.

Five details worth copying. The codes are `readonly` constants with names, so the `exit` sites read as intentions rather than as magic numbers. Every diagnostic goes to standard error with `>&2`, leaving standard output for results. `${0##*/}` is the script's basename, done with a parameter expansion rather than by calling `basename`. `usage` prints to stderr and exits 2, which is what a caller piping the output expects. And the script passes `shellcheck` with no warnings.
:::

::: warning
Two anti-patterns that make a script useless to automation.

**Exiting 0 on failure.** `some_check || echo "warning: check failed"` leaves the status at zero, because `echo` succeeded. A CI job reports green, and the failure is a line in a log nobody reads. If it is worth printing a warning about, decide whether it should change the exit status, and if not, say so in a comment.

**Reporting failure only in text.** `echo "ERROR: 3 cases failed"` followed by a normal end means the caller has to grep your output — and will get it wrong when you reword the message. Print the message *and* exit non-zero.

The reverse mistake also exists: a `trap … EXIT` handler (lesson 07) that ends with a command returning non-zero changes the script's exit status. Make the last statement of an exit handler unconditionally successful.
:::

::: key
A function returns a status, not a value: `return N` is one unsigned byte, so 300 becomes 44 and −1 becomes 255. Data comes out on standard output and is captured with `$( )`; diagnostics go to `>&2`. `$?` holds only the previous command's status — save it immediately. `return` leaves a function, `exit` leaves the shell, and inside `$( )` that shell is a subshell. Use 0 for success, 2 for usage errors, and distinct small codes for distinct failures.
:::

## Check yourself

::: check
`is_ready()` ends with `echo "checked $n cases"` and callers write `if is_ready; then`. The branch is always taken. Why?
:::

::: answer
A function with no explicit `return` exits with the status of its last command. The last command is `echo`, which succeeds whenever it can write to its output, so the function always returns 0 and `if` always takes the true branch. Whatever checking happened earlier in the body is discarded.

Two fixes. End the function with the test itself, so its status is the result: the last line becomes `[[ $failures -eq 0 ]]`. Or return explicitly — `if (( failures > 0 )); then return 1; fi; return 0` — which is more verbose and clearer when the body is long.

The diagnostic line should also move: printing to standard output from a predicate pollutes anything that captures it, and here it is not a value at all. Send it to standard error with `>&2`, or drop it.

This is worth checking for in any code base that has just gained `set -e`, because functions that always return 0 are invisible until something starts relying on their status.
:::

::: check
Explain why `local n=$(grep -c ERROR "$f")` and `local n; n=$(grep -c ERROR "$f")` behave differently under `set -e`.
:::

::: answer
`local` is a builtin command. When an assignment is written as an argument to it, the exit status of the whole statement is `local`'s own status — and `local` succeeds, because it successfully declared the variable. The command substitution's failure is computed, used to fill the variable, and then thrown away before `set -e` sees anything.

Split into two statements, the second is a plain assignment. A plain assignment's status *is* the status of its last command substitution, so a failing `grep` fails the assignment and `set -e` fires.

Since `grep` exits 1 for "no matches" — a normal result — the correct version of this line usually wants both: `local n; n=$(grep -c ERROR "$f" || true)`. The same masking applies to `declare`, `export`, `readonly` and `typeset`. `shellcheck` reports it as SC2155.
:::

::: check
A campaign driver prints "ERROR: 3 of 500 cases failed" and exits 0. Give two things this breaks, and the smallest correct change.
:::

::: answer
It breaks anything that branches on the status. `./driver.sh && ./analyse.sh` runs the analysis on an incomplete set. A CI job or a batch scheduler reports the run as successful, so nobody is notified, the artefacts are published, and the failure surfaces weeks later as a statistic that does not reproduce. `set -e` in a calling script does nothing either.

It also makes the failure's *detection* depend on text. A caller that greps for `ERROR` is coupled to the exact wording, breaks when the message is reworded or translated, and matches a case name that happens to contain the word.

The smallest correct change is to exit non-zero when any case failed — and to choose a code that means something, so that "some cases failed" is distinguishable from "the input was missing" and from "the driver itself crashed". Keep the message; add `exit 4`. Printing to standard error rather than standard output is the natural companion change, so that a caller capturing results does not have to filter diagnostics out of them.
:::

::: check
Why does `out=$(bail)` not end a script when `bail` calls `exit 7`, and what does the caller see?
:::

::: answer
Command substitution runs its command in a **subshell** — a forked copy of the shell. `exit 7` ends that copy, not the parent. The parent's script carries on at the next statement.

The caller sees two things. `out` contains whatever `bail` printed to standard output before exiting, and `$?` immediately afterwards is 7, because the assignment's status is the substitution's status, which is the subshell's exit status. So the information is not lost — it arrives as a status rather than as a termination.

The same applies to any subshell: a pipeline stage, an explicit `( … )`, and a background job. It is the reason a `die` helper must be called directly rather than inside a substitution, and the reason a `while read` loop on the right of a pipe cannot end the script (lesson 05).

If you want a failure inside a substitution to stop the script, either check the status at the call site — `out=$(bail) || exit $?` — or turn on `shopt -s inherit_errexit` so that `set -e` applies inside command substitutions too.
:::

::: check
A script exits 130 when a colleague runs it and 0 when you do. What is 130, and what should the script do about it?
:::

::: answer
130 is 128 + 2, and signal 2 is `SIGINT` — your colleague pressed `Ctrl-C`. The 128 + N convention means "terminated by signal N", and the other two you will see are 143 (128 + 15, `SIGTERM`, a scheduler or `kill`) and 137 (128 + 9, `SIGKILL`, usually the out-of-memory killer).

What the script should do is clean up rather than suppress. An interrupted run has probably left a temporary directory, a partial output file and possibly a lock; the next lesson's `trap … EXIT INT TERM` is exactly the mechanism for removing them on every exit path, including this one. The script should *not* trap `INT` and ignore it — a user who presses `Ctrl-C` means it, and a script that refuses to stop is worse than one that leaves a temporary file.

It is also worth propagating the reason. A handler that catches `INT`, cleans up and then exits 130 tells the caller the run was interrupted rather than that it failed, which a scheduler can treat differently from a genuine error.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `name() { …; }` | define; call it like a command | found before `PATH`, so it shadows programs |
| `command name` | bypass a function of the same name | how a wrapper calls the real thing |
| `declare -f name`, `type name` | show the definition; show what a name resolves to | the first thing to check for odd behaviour |
| `$1 $@ $#` inside a function | the *function's* arguments | `$0` is still the script |
| `local x` | function-scoped variable | declare every one; split `local` from a capture |
| `return N` | status only, one unsigned byte | 300 → 44, −1 → 255 |
| no `return` | the status of the last command | a trailing `echo` always returns 0 |
| value on stdout, captured with `$( )` | how a function returns data | `printf '%s\n'`, and diagnostics to `>&2` |
| `if f=$(fn args); then` | capture the value and branch on the status | the assignment's status is the substitution's |
| `$?` | the previous command's status only | save it on the very next line |
| `return` vs `exit` | leave the function vs leave the shell | inside `$( )` that shell is a subshell |
| 0 / 1 / 2 | success / general failure / usage error | name your codes as `readonly` constants |
| 126 / 127 / 128+N | not executable / not found / killed by signal N | keep your own codes below 126 |
| `exit 0` after a failure | invisible to every caller | print the message *and* fail |

Lesson 07 covers the other half of behaving well when something goes wrong: `trap`, and how to make a script clean up after itself on every exit path — including the ones you did not plan.
