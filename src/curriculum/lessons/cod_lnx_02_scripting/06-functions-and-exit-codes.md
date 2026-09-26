---
id: l06-functions-and-exit-codes
title: Functions, return values and exit codes
minutes: 19
covers:
  - Functions, return values, exit codes, $?
---

In most languages, a function is like a vending machine: you put something in, and a value drops out of the slot. A bash function is different. Its "slot" only ever holds a **status** — one small number where 0 means success. If you want real data out of it, the function *prints* the data and the caller *captures* what was printed.

That one difference explains most of what feels odd about shell functions. Once it is straight, the rest is routine.

The second half of this lesson is about the number your whole script hands back when it ends. Picture a sweep driver that always exits 0. Whatever started it — a scheduler, a CI job, a colleague's `./sweep.sh && ./analyse.sh` — cannot tell a finished sweep from one that produced nothing. Exit codes are the only way a program can report to whatever started it, so they are worth designing.

Every output below is real, from GNU bash 5.2.21 and ShellCheck 0.11.0 on Ubuntu 24.04, using the `logs/` folder from lessons 04 and 05. `logs/driver.log` contains one `ERROR` line and `logs/run.log` contains none.

## Defining and calling

```bash
name() { commands; }
```

The parentheses are always empty — you never list parameters. Inside the function, `$1`, `$2`, `$@` and `$#` are the *function's* arguments, and they hide the script's own for as long as the function runs. `$0` is still the script's name:

```bash
#!/usr/bin/env bash
f() { echo "inside: \$#=$# \$1=$1 \$0=$0"; }
f alpha beta
```

```text
inside: $#=2 $1=alpha $0=./bin/fnargs.sh
```

(`\$` prints a plain dollar sign, so the labels show up literally.) You call a function by name, with its arguments after it separated by spaces, exactly like a command. As far as the shell is concerned it *is* a command — and bash looks for functions before it searches `PATH`. So a function quietly **[[shadows|shadowing]]** a program with the same name:

```bash
grep(){ echo "shadowed grep called with: $*"; }
grep -c x file
command grep --version | head -1
type grep | head -1
```

```text
shadowed grep called with: -c x file
grep (GNU grep) 3.11
grep is a function
```

`command grep` skips the function and runs the real program. That is how a wrapper function calls the thing it wraps. `type name` says what a name means right now, and `declare -f name` prints a function's definition. Both are the first things to try when a command behaves strangely.

### `local`

Variables in bash are **global** — visible everywhere in the script — by default, even ones first set inside a function:

```bash
f(){ local x=1; }; f; echo "x after: [${x:-<unset>}]"
g(){ y=1; };       g; echo "y after: [${y:-<unset>}]"
```

```text
x after: [<unset>]
y after: [1]
```

`x` was declared `local`, so it vanished when `f` returned. `y` was not, so it leaked out of `g`.

Declare every variable a function uses with `local`, without exception. A function that sets `i` or `tmp` or `count` globally will one day be called from inside a loop that uses the same name, and that loop will never end.

One oddity: `local` is **[[dynamically scoped|dynamic-scope]]**. A function called *from* another function can see its caller's locals. It is unusual, and it rarely matters in practice.

And from lesson 02: keep the declaration apart from an assignment that captures a command, or the command's failure is hidden. Write `local n` and then `n=$(…)` — never `local n=$(…)`. The Check yourself section shows why.

## Returning a status

`return N` ends the function with status `N`. That status is **[[one unsigned byte|status-byte]]** — a whole number from 0 to 255:

```bash
f(){ return 300; }; f; echo "return 300 gives \$? = $?"
f(){ return -1;  }; f; echo "return -1 gives \$? = $?"
```

```text
return 300 gives $? = 44
return -1 gives $? = 255
```

300 wrapped around to 44, because 300 − 256 = 44. And −1 became 255, because −1 + 256 = 255. `$?` — read it as "dollar question", the status of the last command — can therefore carry a small code from a short list and nothing else. Never a count, never an index, never a measurement.

With no `return` at all, a function's status is that of its **last command**. That is a common accident. A function whose last line is a `[[ ]]` test returns that test's answer. A function ending in `echo` always returns 0, however badly everything before it went.

## Returning a value

Print the value, and let the caller capture it with `$( )`:

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

`grep -c` counts matching lines. It exits 1 when the count is 0, which is a normal answer here, so `|| true` stops that from being treated as a failure.

Two habits to build. First, print a value with `printf '%s\n'`, not **[[`echo`|echo-vs-printf]]**, because `echo` mangles values that start with `-` and, in some shells, treats backslashes as special. Second, write *only* the value to standard output. Progress messages, warnings and anything else go to **standard error**, with `>&2` (read it "to stream 2"). Otherwise they end up **[[inside the caller's variable|two-streams]]**.

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
  local dir="$1" f newest=""
  [[ -d $dir ]] || return 2
  for f in "$dir"/*.log; do
    [[ -e $f ]] || continue
    if [[ -z $newest || $f -nt $newest ]]; then newest=$f; fi
  done
  [[ -n $newest ]] || return 1
  printf '%s\n' "$newest"
}

if have_errors logs/driver.log; then echo "driver.log has errors"; fi
if ! have_errors logs/run.log;   then echo "run.log has none"; fi

n=$(count_errors logs/driver.log); echo "count=$n"

if f=$(newest_case logs);      then echo "newest: $f"; else echo "newest_case failed with $?"; fi
if f=$(newest_case nosuchdir); then echo "newest: $f"; else echo "newest_case failed with $?"; fi
if f=$(newest_case emptydir);  then echo "newest: $f"; else echo "newest_case failed with $?"; fi
```

```text
driver.log has errors
run.log has none
count=1
newest: logs/driver.log
newest_case failed with 2
newest_case failed with 1
```

The first shape is a **[[predicate|predicate]]**: it returns a status only, and you use it straight after `if`. `have_errors` is a one-line wrapper around `grep -q`, and it reads better where it is called than the bare `grep` would.

The second is a **producer**: it prints one value and nothing else.

The third does both. `newest_case` walks through the `.log` files, keeping whichever is newer (`-nt`, "newer than", from lesson 05). It prints a path when it finds one, and it uses different non-zero statuses for different problems: 2 for "that is not a directory", 1 for "no logs in it". The `[[ -e $f ]] || continue` line handles an empty folder, where the glob `"$dir"/*.log` matches nothing and stays as the literal text.

Check each line of output against the code. `nosuchdir` does not exist, so status 2. `emptydir` exists with no logs in it, so status 1. That is exactly what the caller needs to tell the two apart.

Notice the call form `if f=$(newest_case logs); then`. It captures the value *and* branches on the status in one line, because an assignment's status is its substitution's status (lesson 04). And `$?` inside the `else` is still the status of the condition, which is what you want. The script passes `shellcheck` with no warnings.
:::

## `$?` is overwritten by the next command

`$?` is like a sticky note that each command rewrites as it finishes:

```bash
false; echo "captured once: $?"; echo "and again: $?"
```

```text
captured once: 1
and again: 0
```

The second `$?` is the status of the first `echo`, which succeeded. If you need the value more than once, save it immediately:

```bash
false; st=$?; echo "saved: $st"; echo "still: $st"
```

```text
saved: 1
still: 1
```

The same goes for `PIPESTATUS` (lesson 02) and `BASH_REMATCH` (lesson 05): read them on the very next line.

## `return` versus `exit`

`return` leaves the function. `exit` leaves the **shell** — which means the whole script, unless the call is running inside a subshell:

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

The script's exit status is **7**. Count the lines: five `echo` commands could have printed, and only four lines appeared. Here is where each went.

1. `check` printed `checking` and returned 1, so `if` took the `else` branch.
2. `$(bail)` ran `bail` in a subshell. The word `bailing` went into `out` instead of to the screen, and `exit 7` ended only *the subshell*. The 7 came back as the assignment's status.
3. Called directly, `bail` printed `bailing` and ended the whole script with 7.
4. So `echo "not reached"` never ran.

This is why a library of helper functions should use `return` and let the caller decide. Only a top-level "give up now" function, often named `die`, should call `exit`.

## Exit codes a caller can use

Your script's exit code is its one-number report to whatever ran it. The rule everyone follows:

::: key
0 means success and any non-zero means failure; reserve 2 for usage errors and pick distinct small codes for distinct failure modes so CI can branch on them. Never exit 0 on a failed run just to keep a pipeline green.
:::

A few numbers are already taken:

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | general failure |
| 2 | by convention, a usage error — wrong or missing arguments |
| 3–63 | yours to define |
| 126 | command found but not executable |
| 127 | command not found |
| 128 + N | killed by **[[signal|signals]]** N — 130 is `Ctrl-C`, 137 `SIGKILL`, 143 `SIGTERM` |
| 255 | out of range, or a `return`/`exit` of a negative number |

The shell itself produces 126, 127 and 128 + N, so keep your own codes at 125 or below — in practice, small numbers.

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

Four runs — no argument, a missing file, a log with an error, and a clean log:

```text
$ ./bin/sweepdrv.sh; echo "exit=$?"
usage: ./bin/sweepdrv.sh <logfile>
exit=2
$ ./bin/sweepdrv.sh nosuch.log; echo "exit=$?"
sweepdrv.sh: cannot read nosuch.log
exit=3
$ ./bin/sweepdrv.sh logs/driver.log; echo "exit=$?"
sweepdrv.sh: at least one case failed
exit=4
$ ./bin/sweepdrv.sh logs/run.log; echo "exit=$?"
all cases OK
exit=0
```

Each run ends with a different code, and each code matches its cause. Now a scheduler can retry on 3 (the input was not there yet) and alert a person on 4 (a case really failed), without reading any text. That is the whole point.

Five details worth copying:

- The codes are **[[named constants|sysexits]]**, made `readonly` so nothing can change them. The `exit` lines read as intentions, not as mystery numbers.
- Every message goes to standard error with `>&2`, leaving standard output for results.
- `${0##*/}` is the script's name without its folder: remove the longest match of "anything ending in `/`" from the front. It is a parameter expansion, so no `basename` program is started.
- `usage` prints to standard error and exits 2, as a caller expects.
- `main "$@"` at the bottom hands all the script's arguments to `main`, so the whole script reads top to bottom. It passes `shellcheck` with no warnings.
:::

::: warning Two habits that make a script useless to automation
**Exiting 0 on failure.** `some_check || echo "warning: check failed"` leaves the status at 0, because `echo` succeeded. The **[[CI job|ci]]** shows green, and the failure is a line in a log nobody reads. If something is worth a warning, decide whether it should change the exit status — and if not, say why in a comment.

**Reporting failure only in text.** `echo "ERROR: 3 cases failed"` followed by a normal ending forces the caller to search your output for words — and it will break the day you reword the message. Print the message *and* exit non-zero.

There is also a trap in the other direction. Under `set -e`, if a command fails inside a `trap … EXIT` handler (lesson 07), the handler stops there and the script exits with status 1 — even if it was about to exit 0, or 4. Make every command in an exit handler one that cannot fail.
:::

::: key
A function returns a status, not a value: `return N` is one unsigned byte, so 300 becomes 44 and −1 becomes 255. Data comes out on standard output and is captured with `$( )`; messages go to `>&2`. `$?` holds only the previous command's status — save it immediately. `return` leaves a function, `exit` leaves the shell, and inside `$( )` that shell is a subshell.
:::

## Check yourself

::: check
`is_ready()` ends with `echo "checked $n cases"`, and callers write `if is_ready; then`. The branch is always taken. Why?
:::

::: answer
A function with no `return` exits with the status of its last command. The last command is `echo`, which succeeds whenever it can write, so the function always returns 0 and `if` always takes the true branch. Whatever checking happened earlier is thrown away.

Two fixes. End the function with the test itself, so its status is the answer: make the last line `[[ $failures -eq 0 ]]`. Or return explicitly — `if (( failures > 0 )); then return 1; fi; return 0` — which is longer but clearer in a long function.

The message should move too. A predicate that prints to standard output pollutes anything that captures it, and here the message is not a value at all. Send it to standard error with `>&2`, or drop it.

Look for this in any script that has just gained `set -e`: functions that always return 0 go unnoticed until something starts relying on their status.
:::

::: check
Explain why `local n=$(grep -c ERROR "$f")` and `local n; n=$(grep -c ERROR "$f")` behave differently under `set -e`.
:::

::: answer
`local` is a builtin command. When the assignment is written as an argument to it, the status of the whole line is `local`'s own status — and `local` succeeds, because it did declare the variable. The substitution's failure is used to fill the variable and then thrown away before `set -e` sees it.

Split into two lines, the second is a plain assignment, and a plain assignment's status *is* the status of its command substitution. A failing `grep` fails the line, and `set -e` acts. You can see the difference directly:

```bash
bash -c 'set -e; f(){ local n=$(false); echo "masked"; }; f'; echo $?
bash -c 'set -e; f(){ local n; n=$(false); echo "not masked"; }; f'; echo $?
```

```text
masked
0
1
```

Because `grep` exits 1 for "no matches" — a normal answer — the correct line usually wants both halves: `local n; n=$(grep -c ERROR "$f" || true)`. The same hiding happens with `declare`, `export`, `readonly` and `typeset`. `shellcheck` reports it as SC2155.
:::

::: check
A campaign driver prints "ERROR: 3 of 500 cases failed" and exits 0. Name two things this breaks, and the smallest correct change.
:::

::: answer
It breaks anything that branches on the status. `./driver.sh && ./analyse.sh` runs the analysis on an incomplete set. A CI job or batch scheduler reports the run as a success, so nobody is told, the results are published, and the failure surfaces weeks later as a number nobody can reproduce. `set -e` in a calling script does nothing either.

It also makes *noticing* the failure depend on text. A caller that searches for `ERROR` is tied to the exact wording, breaks when the message is reworded, and also matches a case whose name happens to contain the word.

The smallest correct change is to exit non-zero when any case failed — with a code that means something, so "some cases failed" differs from "the input was missing" and from "the driver itself crashed". Keep the message and add `exit 4`. Sending the message to standard error is the natural companion change, so a caller capturing results does not have to filter it out.
:::

::: check
Why does `out=$(bail)` not end a script when `bail` calls `exit 7`, and what does the caller see?
:::

::: answer
Command substitution runs its command in a **subshell** — a copy of the shell. `exit 7` ends that copy, not the parent. The script carries on at the next line.

The caller sees two things. `out` holds whatever `bail` printed before exiting, and `$?` right afterwards is 7, because the assignment's status is the substitution's status, which is the subshell's exit status. So the information is not lost: it arrives as a status instead of as the end of the script.

The same is true of every subshell: a pipeline stage, an explicit `( … )`, a background job. That is why a `die` function must be called directly, never inside `$( )`, and why a `while read` loop on the right of a pipe cannot end the script (lesson 05).

If you want a failure inside a substitution to stop the script, check at the call site — `out=$(bail) || exit $?` — or turn on **[[`shopt -s inherit_errexit`|inherit-errexit]]** so that `set -e` also applies inside command substitutions.
:::

::: check
A script exits 130 when a colleague runs it and 0 when you do. What is 130, and what should the script do about it?
:::

::: answer
130 is 128 + 2, and signal 2 is `SIGINT` — your colleague pressed `Ctrl-C`. The 128 + N rule means "ended by signal N". The other two you will meet are 143 (128 + 15, `SIGTERM`, sent by a scheduler or `kill`) and 137 (128 + 9, `SIGKILL`, often the out-of-memory killer).

The script should clean up, not suppress. An interrupted run has probably left a temporary folder, a half-written output file, maybe a lock file. Lesson 07's `trap … EXIT INT TERM` is exactly the tool for removing them on every way out, this one included. The script should *not* catch `INT` and ignore it: someone who presses `Ctrl-C` means it, and a script that refuses to stop is worse than one that leaves a temporary file.

It is also worth passing the reason on. A handler that catches `INT`, cleans up and then exits 130 tells the caller the run was interrupted rather than failed, and a scheduler can treat those differently.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `name() { …; }` | define; call it like a command | found before `PATH`, so it hides programs |
| `command name` | skip a function of the same name | how a wrapper calls the real thing |
| `declare -f name`, `type name` | show the definition; show what a name means | the first check for odd behavior |
| `$1 $@ $#` inside a function | the *function's* arguments | `$0` is still the script |
| `local x` | variable that belongs to the function | declare every one; split `local` from a capture |
| `return N` | status only, one unsigned byte | 300 → 44, −1 → 255 |
| no `return` | the status of the last command | a trailing `echo` always returns 0 |
| value on stdout, captured with `$( )` | how a function hands back data | `printf '%s\n'`, and messages to `>&2` |
| `if f=$(fn args); then` | capture the value and branch on the status | the assignment's status is the substitution's |
| `$?` | the previous command's status only | save it on the very next line |
| `return` vs `exit` | leave the function vs leave the shell | inside `$( )` that shell is a subshell |
| 0 / 1 / 2 | success / general failure / usage error | name your codes as `readonly` constants |
| 126 / 127 / 128+N | not executable / not found / killed by signal N | keep your own codes small |
| `exit 0` after a failure | invisible to every caller | print the message *and* fail |

Next, lesson 07 covers the other half of behaving well when things go wrong: `trap`, and how to make a script clean up after itself on every way out — including the ones you did not plan.

::: context shadowing How bash finds a command
When you type a name, bash checks in a fixed order: first aliases (at an interactive prompt), then functions, then its own builtins such as `cd` and `echo`, and only then the folders listed in `PATH`. A function named `grep` is found before the real `/usr/bin/grep` is ever looked for. That is handy for a wrapper and a nasty surprise by accident — a function named `test` or `ls` in a sourced file can change how an unrelated script behaves.
:::

::: context dynamic-scope Seeing your caller's variables
In most languages a function sees only its own variables and the globals — that is **lexical** scope, decided by where code is written. Bash uses **dynamic** scope, decided by who called whom while the script runs. With `outer(){ local v=outer; inner; }` and `inner(){ echo "inner sees v=$v"; }`, calling `outer` prints `inner sees v=outer`, although `inner` never declared `v`. It is one more reason to declare every variable `local` and pass values as arguments.
:::

::: context status-byte Why 300 comes back as 44
A status is stored in eight bits, so only the eight lowest bits of the number survive. 300 needs nine bits; the 256 bit is dropped, leaving 32 + 8 + 4 = 44. And −1 is stored as eight ones, which read back as 255.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="84" y="20">256</text><text x="114" y="20">128</text><text x="144" y="20">64</text>
    <text x="174" y="20">32</text><text x="204" y="20">16</text><text x="234" y="20">8</text>
    <text x="264" y="20">4</text><text x="294" y="20">2</text><text x="324" y="20">1</text>
  </g>
  <text x="12" y="47" font-size="13" fill="#1f2a44">300</text>
  <rect x="70" y="28" width="28" height="28" fill="#ffffff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="100" y="28" width="28" height="28" fill="#ffffff"/>
    <rect x="130" y="28" width="28" height="28" fill="#ffffff"/>
    <rect x="160" y="28" width="28" height="28" fill="#8fb8f0"/>
    <rect x="190" y="28" width="28" height="28" fill="#ffffff"/>
    <rect x="220" y="28" width="28" height="28" fill="#8fb8f0"/>
    <rect x="250" y="28" width="28" height="28" fill="#8fb8f0"/>
    <rect x="280" y="28" width="28" height="28" fill="#ffffff"/>
    <rect x="310" y="28" width="28" height="28" fill="#ffffff"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="84" y="47" fill="#b4232c">1</text><text x="114" y="47">0</text><text x="144" y="47">0</text>
    <text x="174" y="47">1</text><text x="204" y="47">0</text><text x="234" y="47">1</text>
    <text x="264" y="47">1</text><text x="294" y="47">0</text><text x="324" y="47">0</text>
  </g>
  <text x="100" y="74" font-size="12" fill="#1f2a44">256 bit dropped: 32 + 8 + 4 = 44</text>
  <text x="12" y="109" font-size="13" fill="#1f2a44">−1</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="100" y="90" width="28" height="28"/><rect x="130" y="90" width="28" height="28"/>
    <rect x="160" y="90" width="28" height="28"/><rect x="190" y="90" width="28" height="28"/>
    <rect x="220" y="90" width="28" height="28"/><rect x="250" y="90" width="28" height="28"/>
    <rect x="280" y="90" width="28" height="28"/><rect x="310" y="90" width="28" height="28"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="114" y="109">1</text><text x="144" y="109">1</text><text x="174" y="109">1</text><text x="204" y="109">1</text>
    <text x="234" y="109">1</text><text x="264" y="109">1</text><text x="294" y="109">1</text><text x="324" y="109">1</text>
  </g>
  <text x="100" y="138" font-size="12" fill="#1f2a44">all eight bits set: 255</text>
</svg>
```
:::

::: context echo-vs-printf What echo does to some values
`echo` reads a leading `-n` or `-e` as its own option. So if a value is exactly `-n`, `echo "$v"` prints nothing at all, while `printf '%s\n' "$v"` prints `-n`. Shells also disagree about backslashes: bash's `echo` prints `a\tb` as it is, but `dash`'s `echo` turns `\t` into a tab. `printf` with a `%s` format prints the value exactly, everywhere, which is what you want for data.
:::

::: context two-streams Two exits from one function
Standard output (stream 1) is what `$( )` captures. Standard error (stream 2) goes past it, straight to the terminal or the log. Send the answer down the first, and everything you want a person to read down the second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="20" width="110" height="44" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="67" y="46" font-size="12" fill="#1f2a44" text-anchor="middle">count_errors</text>
  <line x1="122" y1="42" x2="222" y2="42" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="230,42 220,37 220,47" fill="#1d6fd1"/>
  <text x="176" y="34" font-size="11" fill="#1d6fd1" text-anchor="middle">stdout (1)</text>
  <rect x="232" y="20" width="116" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="38" font-size="12" fill="#1f2a44" text-anchor="middle">n=$( … )</text>
  <text x="290" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">value: 1</text>
  <line x1="67" y1="64" x2="67" y2="100" stroke="#b4232c" stroke-width="2"/>
  <polygon points="67,108 62,98 72,98" fill="#b4232c"/>
  <text x="76" y="88" font-size="11" fill="#b4232c">stderr (2), with &gt;&amp;2</text>
  <rect x="12" y="110" width="110" height="32" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="67" y="131" font-size="12" fill="#1f2a44" text-anchor="middle">terminal / log</text>
</svg>
```
:::

::: context predicate Where "predicate" comes from
In grammar, the predicate is the part of a sentence that says something about the subject: in "the log has errors", it is "has errors". Logic borrowed the word for a statement that is either true or false about something. In programming, a predicate is a function that answers a yes-or-no question. Naming one like a question — `have_errors`, `is_ready`, `file_exists` — makes `if have_errors "$log"` read like English.
:::

::: context signals Signals, and why 128 is added
A **signal** is a short message the operating system delivers to a running program: "stop", "you were interrupted", "the terminal closed". Each has a number — `SIGINT` is 2, `SIGKILL` 9, `SIGTERM` 15. When a program is ended by a signal, the shell reports 128 plus that number, so the code cannot be confused with an ordinary exit code below 128. On Linux, when the machine runs out of memory, the kernel's out-of-memory killer ends a process with `SIGKILL` — which is why 137 in a batch job's log so often means "used too much memory".
:::

::: context sysexits Borrowed names
The names `EX_USAGE` and `EX_NOINPUT` come from `sysexits.h`, a header file from BSD Unix that gave standard names to exit codes. It uses larger numbers — `EX_USAGE` is 64 and `EX_NOINPUT` is 66 — and a few programs, such as mail servers, still follow it. This script borrows the names for readability and keeps the more common small numbers, with 2 for usage. Whichever scheme you choose, write it down in the script's usage text.
:::

::: context ci Continuous integration
**Continuous integration**, CI, is a service that builds and tests the code automatically every time someone pushes a change — GitHub Actions and GitLab CI are two common ones. A CI job is a list of commands, and by default the job fails as soon as a command exits non-zero. That exit code is the only thing CI looks at. A test script that prints "FAILED" and exits 0 turns the whole job green, and the broken change is merged.
:::

::: context inherit-errexit Letting set -e reach inside $( )
By default bash switches `set -e` off inside a command substitution. So with `f(){ false; echo after-false; }`, running `out=$(f)` fills `out` with `after-false`: the `false` did not stop `f`. Since bash 4.4, `shopt -s inherit_errexit` keeps `set -e` on inside substitutions. Then `false` ends the subshell, the assignment fails, and the script stops — the behavior most people expected in the first place.
:::
