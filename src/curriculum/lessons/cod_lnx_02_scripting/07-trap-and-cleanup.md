---
id: l07-trap-and-cleanup
title: trap, and cleaning up on every exit path
minutes: 14
covers:
  - trap for cleanup on EXIT/INT/TERM
---

A sweep script makes a scratch directory, unpacks a few gigabytes into it, runs the cases, and removes it at the end. That last line is only reached when everything goes right. On the run where a case fails, the disk fills, or somebody presses `Ctrl-C` at hour five, the scratch directory stays — and a month later the build box is full of `tmp.XXXXXXXX` directories nobody can attribute.

`trap` is the fix, and it is one line. It registers a command to run when the shell is about to exit, on every path: falling off the end, an explicit `exit`, a failure under `set -e`, or a signal. The mechanism is small. What repays attention is the three things around it — which signals you can actually catch, when the handler's variables are expanded, and what the handler does to the exit status the caller will see.

It is worth being clear about why this matters more in engineering work than in ordinary scripting. A simulation driver is usually the thing that allocates the expensive resources: a scratch directory sized for a campaign, a licence checkout, a lock file that stops two sweeps writing the same output, a set of child processes each holding a core. All of those are released by the script and by nothing else. A script that leaks them on failure does not merely leave mess: it makes the *next* run fail, for a reason that has nothing to do with the next run, and the person debugging it will be looking at the wrong code.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21, GNU coreutils 9.4, GNU Awk 5.2.1 and util-linux `flock` 2.39.3 on Ubuntu 24.04.4.

## The problem, and the one-line fix

```bash
#!/usr/bin/env bash
set -euo pipefail
tmp=$(mktemp -d)
echo "scratch: $tmp"
head -50 logs/run.log > "$tmp/slice.log"
cp missing_config.yaml "$tmp/cfg.yaml"      # this fails
rm -rf "$tmp"                                # never reached
echo "done"
```

```text
scratch: /tmp/tmp.9YNe2OUimo
cp: cannot stat 'missing_config.yaml': No such file or directory
```

Exit status 1, and afterwards:

```bash
ls -d /tmp/tmp.* | wc -l; ls /tmp/tmp.*/
```

```text
1
slice.log
```

The directory and its contents are still there. `set -e` did exactly what it should — it stopped at the failure — and that is precisely why the cleanup line was skipped. The two features work against each other unless you connect them.

The same script with one line added:

```bash
#!/usr/bin/env bash
set -euo pipefail
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
echo "scratch: $tmp"
head -50 logs/run.log > "$tmp/slice.log"
cp missing_config.yaml "$tmp/cfg.yaml"      # this fails
echo "done"
```

```text
scratch: /tmp/tmp.0LByezLwKq
cp: cannot stat 'missing_config.yaml': No such file or directory
```

Same output, same exit status 1, and:

```bash
ls -d /tmp/tmp.* | wc -l
```

```text
0
```

Nothing left behind. Note that the explicit `rm -rf` at the end is now gone: the trap covers the success path too, so having both would be redundant and would risk them diverging.

`mktemp -d` is the other half of the pattern. It creates a directory with a name nothing else will collide with, in `$TMPDIR` or `/tmp`, with mode 700 — never build a scratch path by hand out of `$$` or a timestamp. A process id is reused within hours on a busy machine and a timestamp at one-second resolution collides the moment two cases start together, and in both failure modes two runs share a directory and quietly corrupt each other's intermediates. `mktemp` asks the kernel to create the name atomically, so there is no window between checking that a name is free and using it.

Three properties of `trap` follow from what it is. It is a property of the **shell**, not of a function or a block, so there is exactly one handler per signal and a later `trap` replaces an earlier one. The handler is a *string* that bash parses and runs when the trap fires, not a closure, so anything it refers to is looked up at that moment. And it runs in the shell that registered it, so it can see that shell's variables and functions — which is why a handler in a subshell cannot clean up something the parent created.

::: warning
Quote the trap command in **single** quotes.

```bash
trap 'rm -rf "$tmp"' EXIT     # $tmp expands when the trap fires
trap "rm -rf \"$tmp\"" EXIT   # $tmp expands NOW, at the trap line
```

With double quotes, the value is baked in when `trap` runs. If `tmp` is assigned afterwards, or reassigned, the handler deletes the wrong thing — or, if `tmp` was empty at that moment, expands to `rm -rf ""`, which does nothing, silently, on the one run where it mattered.

Single quotes defer the expansion to the moment the trap fires, which is what you want in every case but one: if you deliberately want to capture the value as it is *now*, say so with a comment, because every reader will assume it is a bug.

The robust form avoids the question entirely by putting the work in a function:

```bash
cleanup() { rm -rf "${tmp:?}"; }
trap cleanup EXIT
```

`${tmp:?}` additionally refuses to run if `tmp` is unset or empty, so a reordering mistake becomes an error instead of a silent no-op.
:::

## `EXIT` fires on every ordinary path

```bash
#!/usr/bin/env bash
set -euo pipefail
trap 'echo "  [EXIT trap ran, status was $?]"' EXIT
case "${1:-normal}" in
  normal) echo "normal end" ;;
  bad)    echo "about to fail"; false ;;
  quit)   echo "explicit exit 5"; exit 5 ;;
  sleep)  echo "sleeping"; sleep 30 ;;
esac
```

```text
normal end
  [EXIT trap ran, status was 0]
```

```text
about to fail
  [EXIT trap ran, status was 1]
```

```text
explicit exit 5
  [EXIT trap ran, status was 5]
```

Script exit statuses 0, 1 and 5 respectively — the handler does not change them, which is the behaviour you want: cleanup is not a result. `$?` inside the handler is the status the script is exiting with, and reading it on the handler's first line is what lets one handler serve both outcomes:

```bash
trap 'st=$?; (( st == 0 )) || echo "failed with $st" >&2; rm -rf "$tmp"' EXIT
```

And a signal sent to that same script:

```bash
./bin/paths.sh sleep & P=$!; sleep 1; kill -TERM $P; wait $P
```

```text
sleeping
  [EXIT trap ran, status was 0]
```

Exit status **143** — 128 + 15, from the previous module's arithmetic. The `EXIT` trap ran, so the cleanup happened; note that `$?` inside it was 0 rather than 143, because the status is set as the shell exits, after the handler. Do not rely on `$?` in an `EXIT` handler to detect a signal.

The one signal no trap can catch:

```bash
./bin/paths.sh sleep & P=$!; sleep 1; kill -9 $P; wait $P
```

```text
sleeping
bash: line 2: 30437 Killed                  ./bin/paths.sh sleep
```

Exit status **137**, and no trap output at all. `SIGKILL` is delivered by the kernel and cannot be caught, blocked or ignored, so the scratch directory survives. That is the one case a script cannot defend against, and it is the reason a long-running job should also have a way to find and remove its own orphans at start-up — a scratch directory named after the job, checked on the next run.

## Catching `INT` and `TERM` deliberately

An `EXIT` trap alone is usually enough, because a `TERM` that is not otherwise handled still terminates the shell through a path that runs the `EXIT` handler. You want explicit `INT` and `TERM` handlers when the cleanup *differs* from the ordinary one — killing child processes that would otherwise be orphaned, releasing a licence, writing a marker that tells a queue the job was interrupted rather than that it failed.

Child processes are the case that most often justifies it. A driver that has started sixteen simulation cases in the background is, from the scheduler's point of view, one process; killing it leaves sixteen orphans that carry on consuming cores and writing to the output directory of a job everyone believes has stopped. A `TERM` handler that runs `kill 0` — signalling the whole process group — or that kills the pids it recorded in an array, is the difference between a clean abort and a node that has to be drained by hand.

The rule when you write one: **clean up, then re-raise the signal**, so that the exit status still reports how the script died rather than how its handler chose to end.

::: example A handler that cleans up and still reports 143
```bash
#!/usr/bin/env bash
set -euo pipefail
tmp=$(mktemp -d)
cleanup() { rm -rf "$tmp"; }
on_signal() {
  local sig="$1"
  echo "  [caught SIG$sig; cleaning up and re-raising]" >&2
  cleanup
  trap - "$sig"
  kill -s "$sig" "$$"
}
trap cleanup EXIT
trap 'on_signal INT'  INT
trap 'on_signal TERM' TERM
echo "scratch: $tmp ; sleeping"
sleep 30
```

```bash
./bin/sig.sh & P=$!; sleep 1; kill -TERM $P; wait $P
```

```text
scratch: /tmp/tmp.PdfTSyExjZ ; sleeping
  [caught SIGTERM; cleaning up and re-raising]
```

Exit status **143**, and `ls -d /tmp/tmp.* | wc -l` afterwards reports `0`.

The three lines of `on_signal` are the whole idiom. `trap - "$sig"` removes the handler, so the signal is not caught a second time. `kill -s "$sig" "$$"` sends it to this shell again, which now dies from it. The result is 128 + N, which is what a scheduler expects to see for an interrupted job — as opposed to a plain `exit 1`, which would look like a case that failed.

Note that `cleanup` runs here *and* again from the `EXIT` trap. `rm -rf` on a path that is already gone is harmless, which is why an idempotent handler is worth writing; if yours is not idempotent, guard it with a flag.
:::

## Everything else about `trap`

The remaining details are small, and each of them is the answer to a question that comes up once you start using traps in earnest.

- **Several signals, one handler**: `trap cleanup EXIT INT TERM`.
- **Reset to the default**: `trap - EXIT`. **Ignore a signal**: `trap '' INT` — an empty string, which is different from `trap - INT`.
- **List what is set**: `trap -p`, optionally for one signal:

```bash
bash -c 'trap "echo bye" EXIT; trap -p EXIT'
```

```text
trap -- 'echo bye' EXIT
bye
```

- **Traps are not inherited** by subshells, except that `set -E` makes `ERR` traps inherited by functions, command substitutions and subshells (lesson 02), and `set -T` does the same for `DEBUG` and `RETURN`.
- **`ERR`** fires on any command that would trigger `set -e`, and is the place to log where a script died: `trap 'echo "failed at line $LINENO: $BASH_COMMAND" >&2' ERR`.
- **The handler's last command sets the exit status** if the handler itself calls `exit`, and can override the status on an `EXIT` trap in some shells — so end a cleanup handler with something that cannot fail, or with an explicit `exit "$st"` after saving `st=$?` on the first line.

::: warning
An `EXIT` trap is registered on the *shell*, so a trap set inside a function still fires when the whole script exits, not when the function returns. There is a `RETURN` trap for the latter, and it needs `set -T` to work inside functions.

The practical consequence: register the trap immediately after creating the resource, at the top level, and keep one cleanup function that removes everything. A helper function that creates a temporary file and registers its own `EXIT` trap will silently *replace* the trap set by the caller, because there is only one handler per signal. If you need several, have one handler that calls several cleanup functions — or collect the paths in an array and remove them all in one place.
:::

::: example The shape to start a driver script from
Everything from lessons 01, 02, 06 and this one, in the order it should appear.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

readonly EX_USAGE=2
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp=""

cleanup() {
  local st=$?
  [[ -n $tmp ]] && rm -rf "$tmp"
  (( st == 0 )) || echo "${0##*/}: failed with status $st" >&2
  return 0
}
trap cleanup EXIT
trap 'echo "${0##*/}: died at line $LINENO: $BASH_COMMAND" >&2' ERR

main() {
  [[ $# -ge 1 ]] || { echo "usage: ${0##*/} <logfile>" >&2; exit "$EX_USAGE"; }
  tmp="$(mktemp -d)"
  # ... work in "$tmp" ...
}

main "$@"
```

Why it is in this order: `tmp` is declared empty before the trap so that `cleanup` can test it, which means the trap is safe to register before the directory exists. `cleanup` saves `$?` on its first line, because every later command overwrites it. It ends with `return 0` so that a failed `rm` cannot change the script's exit status. `-E` makes the `ERR` trap fire inside `main` as well as at the top level. And `main "$@"` at the bottom means nothing executes while bash is still reading the file — so a truncated download or a half-written edit fails to parse rather than running half a script.
:::

## What else needs cleaning up

A scratch directory is the obvious resource. Three others come up in campaign work and each has a shape worth knowing.

### Child processes

A driver that starts cases in the background owns them. Killing the driver does not kill them: a child whose parent dies is re-parented to pid 1 and carries on, still using cores and still writing into the output directory of a job everybody believes has stopped.

```bash
./bin/children_bad.sh & P=$!
sleep 1; echo "cases running: $(count)"
kill -TERM $P; wait $P; sleep 1
echo "after killing the driver: $(count)"
```

```text
started 3 cases
cases running: 4
after killing the driver: 4
```

Four processes — three background cases plus the driver's own foreground one — and all four are still running after the driver has gone. With a handler that records the pids and kills them:

```bash
cleanup() {
  (( ${#pids[@]} )) || return 0
  echo "  [stopping ${#pids[@]} child cases]" >&2
  kill "${pids[@]}" 2>/dev/null || true
  wait "${pids[@]}" 2>/dev/null || true
  return 0
}
trap cleanup EXIT
for i in 1 2 3; do sleep 1234 & pids+=("$!"); done
```

```text
started 3 cases
cases running: 4
  [stopping 3 child cases]
driver exit=143
after killing the driver: 1
```

Three of the four are gone and the driver exited 143. The one that survived is the driver's own foreground process, which the handler never recorded — a precise illustration of the limit of this approach: it cleans up exactly what you remembered to put in the array. `kill 0`, which signals the entire process group, catches everything including things you did not start yourself, and is the blunter alternative.

`2>/dev/null || true` on the `kill` matters: by the time the handler runs, some children may have finished on their own, and `kill` on a dead pid is an error that would otherwise abort the handler under `set -e`.

### Partial output files

A run that dies halfway through writing `summary.csv` leaves a file that exists, is readable, and is wrong. Anything downstream will load it. The fix is not a trap but the same discipline: write to a temporary name in the same directory and rename at the end, because `rename()` within one filesystem is atomic — the file either has its old contents or its new ones, never half.

```bash
out="out/summary.csv"
tmp="$(mktemp "${out}.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
printf 'chan,mean\n' > "$tmp"
awk -F'[= ]' '{s[$4]+=$6; c[$4]++} END{for (k in c) printf "%s,%.3f\n", k, s[k]/c[k]}' logs/run.log | sort >> "$tmp"
mv -- "$tmp" "$out"
```

```text
wrote out/summary.csv
```

```text
chan,mean
BUS_VOLTS,27.990
GYRO_X_DPS,0.154
TANK_PSI,310.664
WHEEL_RPM,4208.206
```

If the `awk` fails, the trap removes the temporary file and `out/summary.csv` keeps whatever it had — the previous run's results, or nothing at all, both of which are honest. The temporary file is created *beside* the output rather than in `/tmp`, because `mv` across filesystems is a copy-and-delete and is not atomic.

### Locks

Two sweeps writing the same output directory is a class of failure that produces plausible, wrong numbers. `flock` on a file descriptor is the cheap guard, and it needs no cleanup at all: the kernel releases the lock when the process exits, whatever killed it.

```bash
lock=out/.sweep.lock
exec 9>"$lock"
if ! flock -n 9; then
  echo "another sweep already holds $lock" >&2
  exit 75
fi
```

```text
lock acquired by pid 32600
another sweep already holds out/.sweep.lock
second attempt exit=75
releasing
```

The first invocation took the lock and the second, started a second later, was refused and exited 75. `-n` means "do not wait"; without it the second would block until the first finished, which is what you want for a queue and not for an interactive command. Because the lock lives on the open file descriptor rather than on the file's existence, there is no stale lock file to clean up after a crash — which is exactly the failure mode that hand-rolled `if [[ -e lockfile ]]` schemes have.

::: key
`trap 'cmd' EXIT` runs on every exit path the shell controls: the end of the script, an explicit `exit`, and a failure under `set -e` — which is exactly the path a trailing `rm -rf` misses. Single-quote the handler so variables expand when it fires. `SIGKILL` cannot be trapped, so 137 leaves the scratch behind. For `INT` and `TERM`, clean up, `trap - SIG`, then `kill -s SIG "$$"` so the status is still 128 + N.
:::

## Check yourself

::: check
A script ends with `rm -rf "$tmp"` and has `set -euo pipefail` at the top. On which runs does the cleanup happen, and on which does it not?
:::

::: answer
It happens only on the runs where control reaches the last line: a complete, successful execution. It does not happen when `set -e` aborts at a failed command, when the script calls `exit` anywhere earlier, when a `return` from `main` skips it, or when the script is interrupted by `Ctrl-C` or killed by a scheduler.

So the cleanup is skipped on precisely the runs that most need it. A successful run is small and predictable; a failed one has often written a lot of scratch data before it stopped, and an interrupted six-hour Monte Carlo can leave gigabytes.

`trap 'rm -rf "$tmp"' EXIT`, registered immediately after `tmp` is created, covers all of those. The only remaining case is `SIGKILL`, which no trap can catch — for that, have the script check for and remove its own orphaned scratch directories when it starts.
:::

::: check
Explain the difference between `trap 'rm -rf "$tmp"' EXIT` and `trap "rm -rf $tmp" EXIT`, and why the second is a real bug rather than a style preference.
:::

::: answer
Single quotes defer expansion: the handler stores the literal text `rm -rf "$tmp"`, and `$tmp` is expanded when the trap fires, so it always refers to the current value. Double quotes expand immediately: the handler stores `rm -rf /tmp/tmp.ABC123`, fixed at the moment the `trap` line ran.

It is a bug in two concrete ways. If the `trap` line comes *before* `tmp` is assigned — which is the natural order when you want the trap registered early — the stored command is `rm -rf `, with an empty operand, which does nothing and reports nothing, so the cleanup silently never happens. And if `tmp` is reassigned later, perhaps because the script processes several inputs, the handler deletes the first directory and leaks the rest.

It is also a quoting hazard: with double quotes, a value containing a space produces `rm -rf /tmp/my dir`, which removes two wrong paths. The safe form is a named function — `cleanup() { rm -rf "${tmp:?}"; }` and `trap cleanup EXIT` — where `${tmp:?}` turns an empty value into an error instead of a no-op.
:::

::: check
Your job is killed by the scheduler and the scratch directory is gone, but a second job is killed and its scratch directory remains. What distinguishes the two cases?
:::

::: answer
The signal. A scheduler that sends `SIGTERM` gives the process a chance to run its handlers, so the `EXIT` trap fires and the cleanup happens; the exit status is 143. A scheduler that has waited for a grace period and then sends `SIGKILL` — or the kernel's out-of-memory killer, which always uses `SIGKILL` — gives the process nothing: `SIGKILL` cannot be caught, blocked or ignored, the process is removed by the kernel, and no handler runs. The exit status is 137.

So 137 with leftovers and 143 without is the expected pattern, and it tells you which happened. Check `dmesg` for an out-of-memory record and the scheduler's own log for a grace-period expiry.

What a script can do about it: make the scratch path deterministic per job — `/scratch/$JOB_NAME/$JOB_ID` rather than `mktemp -d` — and remove stale siblings at start-up. Or leave the cleanup to a system that outlives the job: `systemd-tmpfiles`, a nightly sweeper, or a scratch filesystem that is wiped between jobs.
:::

::: check
Why should an `INT` handler re-raise the signal rather than calling `exit 1`, and what are the three lines that do it?
:::

::: answer
Because the exit status is the only thing the caller sees, and 1 means "the script decided it had failed" while 130 means "somebody interrupted it". A scheduler will retry the second and page someone about the first; a shell one-liner using `&&` treats them identically but a human reading the log does not. Losing that distinction throws away the only information the signal carried.

The three lines, inside the handler:

```bash
trap - INT              # remove the handler, so we are not caught again
kill -s INT "$$"        # send the same signal to this shell
```

plus, before them, whatever cleanup is needed. The shell now receives `SIGINT` with the default disposition and dies from it, so bash reports 128 + 2 = 130 to the caller.

`exit 130` directly is a common shortcut and is *almost* right: the number is the same, but the process terminates normally rather than by signal, so anything inspecting `WIFSIGNALED` — a supervising program, a test harness, `wait` in a parent shell — sees a different thing. Re-raising costs two lines and is exact.
:::

::: check
A helper function creates its own temporary file and registers `trap 'rm -f "$f"' EXIT`. The caller had already registered a cleanup for its scratch directory. What happens?
:::

::: answer
The caller's trap is silently replaced. There is one handler per signal per shell, and `trap` installs rather than appends, so the second registration discards the first. The script now removes the helper's file and leaks the caller's directory — and nothing reports it, because both `trap` commands succeeded.

Three ways to avoid it. Keep exactly one `EXIT` handler, at the top level, which calls whatever cleanup functions are needed. Or have helpers add their paths to an array that the single handler removes: `cleanup_paths+=("$f")`, and `rm -rf "${cleanup_paths[@]}"` in the one handler — remembering that an empty array expands to nothing, so the command is safe even when nothing was registered. Or have the helper not create the resource at all: pass it a directory that the caller owns and has already arranged to clean.

`trap -p EXIT` prints the currently installed handler, which is how you confirm what a script actually ended up with after sourcing a library that may have registered one of its own.
:::

## Summary

| Form | Does | Note |
| --- | --- | --- |
| `trap 'cmd' EXIT` | run `cmd` on every shell exit path | including `set -e` failures and explicit `exit` |
| single vs double quotes | expand when it fires vs expand now | double quotes bake in the value, often an empty one |
| `trap cleanup EXIT` | named function, the robust form | `${tmp:?}` inside makes an empty value an error |
| `mktemp -d` | collision-free scratch directory, mode 700 | never build one from `$$` or a timestamp |
| `$?` in an `EXIT` handler | the status the script is exiting with | but 0 after a caught signal; save it on line one |
| signal exit status | 128 + N | 130 `INT`, 143 `TERM`, 137 `KILL` |
| `SIGKILL` | cannot be caught | 137 leaves the scratch behind; clean orphans at start-up |
| `trap cleanup EXIT INT TERM` | one handler, several signals | make the handler idempotent |
| `trap - SIG` / `trap '' SIG` | reset to default / ignore | different things |
| `trap - SIG; kill -s SIG "$$"` | re-raise after cleaning up | keeps the 128 + N status exact |
| `trap -p [SIG]` | show the installed handler | confirms what a sourced library did |
| `trap … ERR` with `set -E` | report where the script died | `$LINENO` and `$BASH_COMMAND` |
| one handler per signal | a second `trap` replaces the first | collect paths in an array instead |
| record child pids, `kill "${pids[@]}"` | otherwise they are re-parented to pid 1 and keep running | `kill 0` signals the whole process group |
| write to `mktemp "$out.XXXXXX"`, then `mv` | an atomic replace within one filesystem | a crash leaves the old file, not half a new one |
| `exec 9>lock; flock -n 9` | a lock the kernel releases on exit | nothing stale to clean up after a crash |

Lesson 08 gives the script an interface: `getopts` for flags, the positional arguments behind them, and the difference between `"$@"` and `"$*"` that decides whether those arguments survive being passed on.
