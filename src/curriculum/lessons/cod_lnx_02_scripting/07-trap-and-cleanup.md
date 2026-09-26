---
id: l07-trap-and-cleanup
title: trap, and cleaning up on every exit path
minutes: 18
covers:
  - trap for cleanup on EXIT/INT/TERM
---

Think about borrowing a friend's kitchen. You get out bowls, pans and flour, you cook, and at the end you wash up. That plan works on the evening everything goes well. But if the smoke alarm goes off halfway and everyone runs outside, nobody washes up. The mess stays until someone else finds it.

A script has the same problem. A simulation sweep makes a **scratch directory** — a private folder for temporary files — unpacks a few gigabytes into it, runs the cases, and deletes the folder on its last line. That last line only runs when everything goes right. On the run where a case fails, the disk fills, or somebody presses `Ctrl-C` at hour five, the folder stays. A month later the build machine is full of `tmp.XXXXXXXX` folders that nobody can explain.

The fix is one line, the `trap` command. **`trap`** tells the shell: "whatever happens, run this command on the way out." It fires on every exit path — falling off the end, an explicit `exit`, a failure under `set -e`, or a signal. The mechanism is small. What repays your attention is the three things around it: which signals can be caught, *when* the handler's variables are read, and what the handler does to the exit status the caller sees.

This matters a great deal in engineering work. A simulation driver usually holds the expensive things: a scratch folder sized for a whole campaign, a software **license** checked out from a server, a lock that stops two sweeps writing the same output, a set of child processes each using a CPU core. The script releases all of those, and nothing else will. A script that leaks them on failure does not only leave mess. It makes the *next* run fail, for a reason that has nothing to do with the next run, and the person debugging it will be reading the wrong code.

All output below was produced on a real machine and pasted exactly, with GNU bash 5.2.21, GNU coreutils 9.4, GNU Awk 5.2.1 and util-linux `flock` 2.39.3 on Ubuntu 24.04.4.

## The problem, and the one-line fix

Here is a script that makes a scratch folder, copies a slice of a log into it, and then tries to copy a configuration file that does not exist:

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
scratch: /tmp/tmp.vQk9Fm6CZV
cp: cannot stat 'missing_config.yaml': No such file or directory
```

The exit status is 1. Now look for the folder the script printed:

```bash
ls /tmp/tmp.vQk9Fm6CZV
```

```text
slice.log
```

The folder and its contents are still there. `set -e` did exactly its job: it stopped the script at the failed `cp`. And that is precisely why the cleanup line never ran. The two features work against each other until you connect them.

Here is the same script with one line added, right after the folder is made:

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
scratch: /tmp/tmp.JIglaocX9r
cp: cannot stat 'missing_config.yaml': No such file or directory
```

Same message, same exit status 1. But now:

```bash
ls /tmp/tmp.JIglaocX9r
```

```text
ls: cannot access '/tmp/tmp.JIglaocX9r': No such file or directory
```

Nothing was left behind. Read `trap 'rm -rf "$tmp"' EXIT` aloud as "on exit, run `rm -rf "$tmp"`". The part in quotes is the **handler** — the command to run. The word after it, `EXIT`, names *when* to run it.

Notice that the `rm -rf` at the end of the script is gone. The trap covers the success path too. Keeping both would be redundant, and one day the two copies would drift apart.

### `mktemp -d` is the other half

**`mktemp -d`** creates a brand-new folder with a random name that nothing else can collide with. It puts it in `$TMPDIR`, or in **[[/tmp|tmp-folder]]** if that is unset, and gives it **[[mode 700|mode-700]]** — only you can read, write or enter it.

Never build a scratch path by hand from `$$` (read "dollar dollar": the shell's own process id) or from a timestamp. Process ids are **[[reused|pid-reuse]]** on a busy machine, and a timestamp with one-second resolution collides the moment two cases start together. In both cases two runs share one folder and quietly corrupt each other's files. `mktemp` asks the kernel to create the name *atomically* — in one step that cannot be interrupted — so there is no gap between "this name is free" and "this name is mine".

### Three facts about `trap`

Three properties follow from what `trap` is.

1. It belongs to the **shell**, not to a function or a block. There is exactly one handler per signal, and a later `trap` *replaces* an earlier one.
2. The handler is a **string**. Bash stores the text and only parses and runs it when the trap fires. So any variable it mentions is looked up at that moment.
3. It runs in the shell that set it, so it can see that shell's variables and functions. A trap set inside a **subshell** — a copy of the shell made by `( … )` or a pipeline — cannot clean up something the parent made.

::: warning Quote the handler in single quotes
```bash
trap 'rm -rf "$tmp"' EXIT     # $tmp expands when the trap fires
trap "rm -rf \"$tmp\"" EXIT   # $tmp expands NOW, at the trap line
```

With double quotes, the value is baked in when the `trap` line runs. If `tmp` is set *afterwards*, or changed later, the handler deletes the wrong thing. Here is what bash actually stored when the trap came first:

```bash
tmp=""; trap "rm -rf \"$tmp\"" EXIT; tmp=$(mktemp -d); trap -p EXIT
```

```text
trap -- 'rm -rf ""' EXIT
```

`rm -rf ""` does nothing and reports nothing — silently, on the one run where it mattered. (`trap -p` prints the handler that is installed; more on it below.)

Single quotes put off the expansion until the trap fires, which is what you want in every case but one. If you really do want to capture the value as it is *now*, say so in a comment, because every reader will assume it is a bug.

The sturdiest form avoids the question by putting the work in a function:

```bash
cleanup() { rm -rf "${tmp:?}"; }
trap cleanup EXIT
```

`${tmp:?}` (lesson 02) refuses to run if `tmp` is unset or empty. A mistake in the order of lines then becomes a loud error instead of a silent no-op.
:::

## `EXIT` fires on every ordinary path

This test script sets one `EXIT` trap and then leaves in whichever way its first argument asks for. Inside the handler, `$?` — read "dollar question mark", the status of the last command — is the status the script is leaving with.

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

Running it as `./bin/paths.sh normal`, then `bad`, then `quit`:

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

The script's exit statuses were 0, 1 and 5. The handler did not change them, and that is what you want: cleanup is not a result. Because `$?` holds the outgoing status on the handler's first line, one handler can serve both outcomes:

```bash
trap 'st=$?; (( st == 0 )) || echo "failed with $st" >&2; rm -rf "$tmp"' EXIT
```

Read `||` as "or else": if the test `(( st == 0 ))` fails, print the message. `>&2` sends the message to standard error, where diagnostics belong.

Now send a **[[signal|what-a-signal-is]]** to the same script. The line below starts it in the background (`&`), saves its process id from `$!` ("dollar bang"), waits a second, sends `SIGTERM`, and collects its status:

```bash
./bin/paths.sh sleep & P=$!; sleep 1; kill -TERM $P; wait $P
```

```text
sleeping
  [EXIT trap ran, status was 0]
```

The exit status is **143**. That is 128 + 15, the rule from the previous module: a process killed by signal number $N$ reports $128 + N$, and `SIGTERM` is number 15. The `EXIT` trap ran, so the cleanup happened.

Two details are worth noticing. First, `$?` inside the handler said 0, not 143, because the shell sets 143 as it dies, after the handler. So do not use `$?` in an `EXIT` handler to detect a signal. Second, the `sleep 30` that the script was running did *not* die with it. It carried on in the background until its 30 seconds were up. Keep that in mind; it comes back under "Child processes" below.

### The one signal no trap can catch

```bash
./bin/paths.sh sleep & P=$!; sleep 1; kill -9 $P; wait $P
```

```text
sleeping
bash: line 1: 15844 Killed                  ./bin/paths.sh sleep
```

Exit status **137** (128 + 9), and no trap output at all. **`SIGKILL`**, signal 9, is carried out by the kernel itself. It cannot be caught, blocked or ignored, so the scratch folder survives. The kernel's **[[out-of-memory killer|oom-killer]]** uses exactly this signal.

A script cannot defend against `SIGKILL`. That is why a long-running job should also be able to find and remove its *own* leftovers when it starts — for example, a scratch folder named after the job, checked for on the next run.

## Catching `INT` and `TERM` deliberately

An `EXIT` trap alone is usually enough. As you saw, an unhandled `TERM` still ends the shell by a path that runs the `EXIT` handler. The same is true of `INT`, the signal that **[[Ctrl-C|ctrl-c]]** sends.

You want separate `INT` and `TERM` handlers when the cleanup for an interruption is *different* from the ordinary one: stopping child processes that would otherwise be left running, handing back a license, or writing a marker that tells a job queue "interrupted", not "failed".

Child processes are the case that most often needs it. A driver that has started sixteen cases in the background looks like one process to the scheduler. Kill it and sixteen orphans carry on, using cores and writing into the output folder of a job everyone believes has stopped. A `TERM` handler that stops them is the difference between a clean abort and a machine someone has to clear by hand.

The rule when you write one: **clean up, then re-raise the signal**. Re-raising means sending the same signal to yourself again, so that the exit status still says how the script died, not how its handler chose to end.

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
sleep 30 & wait "$!"
```

Start it, and one second later send `SIGTERM`:

```bash
./bin/sig.sh & P=$!; sleep 1; kill -TERM $P; wait $P
```

```text
scratch: /tmp/tmp.WN0HgYi6n3 ; sleeping
  [caught SIGTERM; cleaning up and re-raising]
```

The exit status is **143**, and `ls /tmp/tmp.WN0HgYi6n3` afterwards reports "No such file or directory". Step by step:

1. `SIGTERM` arrives, and bash runs `on_signal TERM`.
2. The handler prints its message and calls `cleanup`, which removes the folder.
3. `trap - "$sig"` removes the `TERM` handler, so the signal will not be caught a second time.
4. `kill -s "$sig" "$$"` sends `SIGTERM` to this same shell. With no handler left, the shell dies from it.
5. The caller sees 128 + 15 = 143, which is what a scheduler expects from an interrupted job. A plain `exit 1` would look like a case that failed.

`cleanup` runs twice here: once from `on_signal` and once from the `EXIT` trap as the shell dies. That is harmless, because `rm -rf` on a folder that is already gone does nothing. A handler that is safe to run twice is called **idempotent**. If yours is not, guard it with a flag.

Why `sleep 30 & wait "$!"` rather than a plain `sleep 30`? See the warning below.
:::

::: warning Bash runs a trap only after the current command finishes
When a signal arrives while bash is waiting for a foreground command, bash notes the signal and runs your handler *after* that command ends. With a plain `sleep 30` as the last line, the example above printed its message only when the 30 seconds were up — the whole run took 30.0 s instead of 1.0 s. A real simulation case might run for an hour first.

The cure is to start the long command in the background and `wait` for it, as the example does. The `wait` builtin *is* interrupted by a caught signal, so the handler runs at once. The child itself is still running at that point — the subject of "Child processes" below.
:::

## Everything else about `trap`

The remaining details are small. Each one answers a question that comes up once you use traps in earnest.

- **Several signals, one handler**: `trap cleanup EXIT INT TERM`.
- **Reset to the default**: `trap - EXIT`. **Ignore a signal**: `trap '' INT` — an empty string. The two are different: `-` puts back normal behavior, `''` makes the shell deaf to that signal.
- **List what is set**: `trap -p`, optionally for one signal:

```bash
bash -c 'trap "echo bye" EXIT; trap -p EXIT'
```

```text
trap -- 'echo bye' EXIT
bye
```

- **Traps are not inherited by subshells.** The exception: `set -E` makes the `ERR` trap inherited by functions, command substitutions and subshells (lesson 02), and `set -T` does the same for the `DEBUG` and `RETURN` traps.
- **`ERR`** fires on any command that would trigger `set -e`. It is the place to log where a script died: `trap 'echo "failed at line $LINENO: $BASH_COMMAND" >&2' ERR`.
- **A failing command inside the handler matters.** In bash, a handler that ends with a failed command does not change the exit status. But under `set -e`, a failed command *inside* the handler stops the handler on the spot — skipping the rest of the cleanup — and the script exits 1, even if it had succeeded. Only an explicit `exit N` in the handler sets the status on purpose. So end a cleanup handler with `return 0`, add `|| true` to steps that may fail, or save `st=$?` on the first line and finish with `exit "$st"`.

That last point is easy to check:

```bash
bash -c 'set -e; trap "rm /nonexistent; echo \"cleanup finished\"" EXIT; true'
```

```text
rm: cannot remove '/nonexistent': No such file or directory
```

The script had succeeded, yet its exit status is 1, and "cleanup finished" never printed.

::: warning One handler per signal, for the whole script
An `EXIT` trap belongs to the *shell*. A trap set inside a function still fires when the whole script exits, not when the function returns. (There is a `RETURN` trap for that, and functions only see it under `set -T`.)

The practical consequence: set the trap right after creating the resource, at the top level, and keep one cleanup function that removes everything. A helper function that makes its own temporary file and sets its own `EXIT` trap will silently *replace* the caller's trap, because there is only one handler per signal. If you need several cleanups, have one handler call several cleanup functions — or collect the paths in an array and remove them all in one place.
:::

::: example The shape to start a driver script from
Everything from lessons 01, 02, 06 and this one, in the order it should appear:

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

To test it, the line `cp -- "$1" "$tmp/"` was added under the comment, and the script run three ways — with no argument, with a missing file, and with a real log:

```text
usage: driver.sh <logfile>
driver.sh: failed with status 2
```

```text
cp: cannot stat 'nosuch.log': No such file or directory
driver.sh: died at line 21: cp -- "$1" "$tmp/"
driver.sh: failed with status 1
```

The third run printed nothing and exited 0. The statuses were 2, 1 and 0.

Why each line sits where it does:

- `tmp` is declared empty *before* the trap, so `cleanup` can test it. That makes the trap safe to set before the folder exists.
- `cleanup` saves `$?` on its first line, because every later command overwrites it.
- It ends with `return 0`, so a failed `rm` cannot change the script's exit status.
- `-E` makes the `ERR` trap fire inside `main` too, which is how the second run named line 21.
- `${0##*/}` is the script's name with its folder stripped off (lesson 04), so messages say `driver.sh`, not `./bin/driver.sh`.
- `main "$@"` at the very bottom means nothing runs while bash is still reading the file. A truncated download or a half-saved edit then fails to parse, rather than running half a script.
:::

## What else needs cleaning up

A scratch folder is the obvious resource. Three others come up in campaign work, and each has a shape worth knowing.

### Child processes

A driver that starts cases in the background owns them. Killing the driver does not kill them. A child whose parent dies is **[[adopted by process 1|orphans]]** and carries on, still using cores and still writing into the output folder.

This driver starts three pretend cases (`sleep 1234 &`) and then runs a fourth in the foreground. The test counts running cases with `pgrep -c`, kills the driver, and counts again:

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

Four processes — three background cases plus the driver's own foreground one — and all four are still running after the driver has gone. Now the same driver with a handler that records each child's process id in an array and stops them:

```bash
cleanup() {
  (( ${#pids[@]} )) || return 0
  echo "  [stopping ${#pids[@]} child cases]" >&2
  kill "${pids[@]}" 2>/dev/null || true
  wait "${pids[@]}" 2>/dev/null || true
  return 0
}
trap cleanup EXIT
for _ in 1 2 3; do sleep 1234 & pids+=("$!"); done
```

```text
started 3 cases
cases running: 4
  [stopping 3 child cases]
driver exit=143
after killing the driver: 1
```

Three of the four are gone, and the driver exited 143. The survivor is the driver's own foreground process, which the handler never recorded. That shows the limit of this approach exactly: it cleans up what you remembered to put in the array, and nothing more. `kill 0` sends the signal to the driver's whole **[[process group|process-group]]**, catching everything it started — the blunter alternative.

The `2>/dev/null || true` after `kill` matters. By the time the handler runs, some children may have finished on their own. `kill` on a finished process is an error, and under `set -e` that error would stop the handler halfway.

### Partial output files

A run that dies halfway through writing `summary.csv` leaves a file that exists, opens fine, and is wrong. Anything downstream will load it.

The fix here is not a trap alone but a habit: write to a temporary name *in the same folder*, and rename it at the end. A rename within one filesystem is **[[atomic|atomic-rename]]**: the file has either its old contents or its new ones, never half of each.

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
BUS_VOLTS,28.028
GYRO_X_DPS,0.183
TANK_PSI,310.200
WHEEL_RPM,4205.970
```

`mktemp "${out}.XXXXXX"` makes a file whose name ends in six random characters in place of the `X`s. (The `awk` line averages each channel; lesson 10 explains it.) If the `awk` fails, the trap removes the temporary file, and `out/summary.csv` keeps what it had — last run's results, or nothing at all. Both are honest.

The temporary file sits *beside* the output rather than in `/tmp` on purpose. `mv` across two filesystems is really a copy followed by a delete, and that is not atomic.

### Locks

Two sweeps writing the same output folder is a failure that produces believable, wrong numbers. **`flock`** puts a lock on an open file, and it needs no cleanup at all: the kernel releases the lock when the process exits, whatever killed it.

```bash
lock=out/.sweep.lock
exec 9>"$lock"
if ! flock -n 9; then
  echo "another sweep already holds $lock" >&2
  exit 75
fi
```

`exec 9>"$lock"` opens the lock file on **[[file descriptor 9|fd-nine]]** for the rest of the script. `flock -n 9` tries to lock it. Here the test script printed a line, held the lock for three seconds, and a second copy was started one second after the first:

```text
lock acquired by pid 16166
another sweep already holds out/.sweep.lock
second attempt exit=75
releasing
```

The first copy took the lock. The second was refused and exited **[[75|exit-75]]**. `-n` means "do not wait". Without it, the second copy would wait until the first finished — right for a queue, wrong for a command someone is typing.

Because the lock lives on the open file descriptor and not on whether the file exists, a crash leaves nothing stale behind. Home-made schemes like `if [[ -e lockfile ]]` fail exactly there: the crashed run's lock file stays, and every later run refuses to start.

::: key
`trap 'cmd' EXIT` runs on every exit path the shell controls: the end of the script, an explicit `exit`, and a failure under `set -e` — which is exactly the path a trailing `rm -rf` misses. Single-quote the handler so variables expand when it fires. `SIGKILL` cannot be trapped, so 137 leaves the scratch behind. For `INT` and `TERM`, clean up, `trap - SIG`, then `kill -s SIG "$$"` so the status is still 128 + N.
:::

::: key What `trap 'rm -rf "$tmp"' EXIT` buys you
Cleanup runs on every exit path, including error exits caused by `set -e` and `Ctrl-C`, so a failed run does not leave gigabytes of scratch data behind. Cleanup of a temporary directory therefore belongs in a trap on `EXIT`, not on the script's last line.
:::

## Check yourself

::: check
A script ends with `rm -rf "$tmp"` and has `set -euo pipefail` at the top. On which runs does the cleanup happen, and on which does it not?
:::

::: answer
It happens only on runs where control reaches the last line — a complete, successful run.

It does not happen when:

- `set -e` stops the script at a failed command;
- the script calls `exit` anywhere earlier;
- a `return` from `main` skips past it;
- someone presses `Ctrl-C`, or a scheduler kills the script.

So the cleanup is skipped on exactly the runs that most need it. A successful run is small and predictable. A failed one has often written a lot of scratch data before it stopped, and an interrupted six-hour Monte Carlo run can leave gigabytes.

`trap 'rm -rf "$tmp"' EXIT`, set right after `tmp` is created, covers every one of those. The only case left is `SIGKILL`, which no trap can catch. For that, have the script look for and remove its own orphaned scratch folders when it starts.
:::

::: check
Explain the difference between `trap 'rm -rf "$tmp"' EXIT` and `trap "rm -rf $tmp" EXIT`, and why the second is a real bug rather than a matter of style.
:::

::: answer
Single quotes put off expansion. The handler stores the literal text `rm -rf "$tmp"`, and `$tmp` is expanded when the trap fires, so it always means the current value. Double quotes expand at once. The handler stores something like `rm -rf /tmp/tmp.ABC123`, frozen at the moment the `trap` line ran.

That is a bug in two concrete ways:

1. If the `trap` line comes *before* `tmp` is set — the natural order when you want the trap in place early — the stored command is `rm -rf ` with nothing after it. It does nothing and says nothing, so the cleanup silently never happens.
2. If `tmp` is changed later, say because the script handles several inputs, the handler deletes the first folder and leaks the rest.

It is also a quoting hazard. With double quotes, a value containing a space produces `rm -rf /tmp/my dir`, which tries to remove two wrong paths.

The safe form is a named function — `cleanup() { rm -rf "${tmp:?}"; }` and `trap cleanup EXIT` — where `${tmp:?}` turns an empty value into an error instead of a no-op.
:::

::: check
The scheduler kills two of your jobs. The first job's scratch folder is gone, but the second job's folder remains. What distinguishes the two cases?
:::

::: answer
The signal.

A scheduler that sends `SIGTERM` gives the process a chance to run its handlers. The `EXIT` trap fires and the cleanup happens. The exit status is 143.

A scheduler that waits out a grace period and then sends `SIGKILL` — or the kernel's out-of-memory killer, which always uses `SIGKILL` — gives the process nothing. `SIGKILL` cannot be caught, blocked or ignored. The kernel removes the process and no handler runs. The exit status is 137.

So "137 with leftovers, 143 without" is the expected pattern, and it tells you which happened. Check `dmesg` for an out-of-memory record, and the scheduler's own log for a grace period running out.

What a script can do about it: make the scratch path fixed for each job — `/scratch/$JOB_NAME/$JOB_ID` rather than `mktemp -d` — and remove stale siblings when it starts. Or hand the cleanup to something that outlives the job: `systemd-tmpfiles`, a nightly sweeper, or a scratch filesystem that is wiped between jobs.
:::

::: check
Why should an `INT` handler re-raise the signal rather than call `exit 1`? Which lines do the re-raising?
:::

::: answer
Because the exit status is the only thing the caller sees. 1 means "the script decided it had failed". 130 (128 + 2) means "somebody interrupted it". A job queue can treat those differently — retry one, report the other — and a human reading the log certainly does. Exiting 1 throws away the only information the signal carried.

The lines, inside the handler, after whatever cleanup is needed:

```bash
trap - INT              # remove the handler, so we are not caught again
kill -s INT "$$"        # send the same signal to this shell
```

The shell now receives `SIGINT` with its default behavior restored and dies from it, so bash reports 128 + 2 = 130 to the caller.

`exit 130` is a common shortcut and is *almost* right. The number is the same, but the process ends normally rather than by a signal. Anything that asks "was this killed by a signal?" — a supervising program, a test harness, `wait` in a parent shell — sees a different answer. Re-raising costs two lines and is exact.
:::

::: check
A helper function creates its own temporary file and sets `trap 'rm -f "$f"' EXIT`. The caller had already set a cleanup for its scratch folder. What happens?
:::

::: answer
The caller's trap is silently replaced. There is one handler per signal per shell, and `trap` *installs* rather than adds, so the second one throws the first away. The script now removes the helper's file and leaks the caller's folder. Nothing reports it, because both `trap` commands succeeded.

Three ways to avoid it:

1. Keep exactly one `EXIT` handler, at the top level, and have it call whatever cleanup functions are needed.
2. Have helpers add their paths to an array that the single handler removes: `cleanup_paths+=("$f")` in the helper, and `rm -rf "${cleanup_paths[@]}"` in the handler. An empty array expands to nothing, so that command is safe even when nothing was added.
3. Have the helper not create the resource at all. Pass it a folder the caller owns and has already arranged to clean.

`trap -p EXIT` prints the handler actually installed. It is how you check what a script ended up with after sourcing a library that may have set one of its own.
:::

## Summary

| Form | Does | Note |
| --- | --- | --- |
| `trap 'cmd' EXIT` | run `cmd` on every shell exit path | including `set -e` failures and explicit `exit` |
| single vs double quotes | expand when it fires vs expand now | double quotes bake in the value, often an empty one |
| `trap cleanup EXIT` | named function, the sturdy form | `${tmp:?}` inside makes an empty value an error |
| `mktemp -d` | collision-free scratch folder, mode 700 | never build one from `$$` or a timestamp |
| `$?` on a handler's first line | the status the script is exiting with | 0 when a signal is killing it; save it first |
| signal exit status | 128 + N | 130 `INT`, 143 `TERM`, 137 `KILL` |
| `SIGKILL` | cannot be caught | 137 leaves the scratch behind; clean orphans at start-up |
| `trap cleanup EXIT INT TERM` | one handler, several signals | make the handler idempotent |
| `trap - SIG` / `trap '' SIG` | reset to default / ignore | different things |
| `trap - SIG; kill -s SIG "$$"` | re-raise after cleaning up | keeps the 128 + N status exact |
| `long_cmd & wait "$!"` | let a caught signal interrupt at once | a foreground command delays the handler |
| `trap -p [SIG]` | show the installed handler | confirms what a sourced library did |
| `trap … ERR` with `set -E` | report where the script died | `$LINENO` and `$BASH_COMMAND` |
| failure inside a handler | under `set -e`, stops it and exits 1 | guard risky steps; end with `return 0` |
| one handler per signal | a second `trap` replaces the first | collect paths in an array instead |
| record child pids, `kill "${pids[@]}"` | otherwise they are adopted by pid 1 and keep running | `kill 0` signals the whole process group |
| write to `mktemp "$out.XXXXXX"`, then `mv` | an atomic replace within one filesystem | a crash leaves the old file, not half a new one |
| `exec 9>lock; flock -n 9` | a lock the kernel releases on exit | nothing stale to clean up after a crash |

Lesson 08 gives the script an interface: `getopts` for flags, the positional arguments behind them, and the difference between `"$@"` and `"$*"` that decides whether those arguments survive being passed on.

::: context tmp-folder The shared scratch room
`/tmp` is a folder every user on the machine can write to, set aside for short-lived files. Its permissions carry the **sticky bit**, so you can delete only your own files there, not a neighbor's.

Many Linux systems empty `/tmp` at every boot, and some also remove files there that nobody has touched for a set number of days. A build server that runs for months without a reboot may keep everything, which is how the pile of `tmp.XXXXXXXX` folders grows. `$TMPDIR` lets a cluster point scratch files at a bigger, faster disk instead.
:::

::: context mode-700 Reading mode 700
Each digit of a mode is three permission bits — read (4), write (2), execute (1) — for the owner, the group, and everyone else. For a folder, "execute" means "may enter". So 700 is 4 + 2 + 1 = 7 for the owner and nothing for anyone else: nobody else can list, create or read files in your scratch folder.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="70" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">owner</text>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">group</text>
  <text x="290" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">others</text>
  <rect x="25" y="32" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="55" y="32" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="85" y="32" width="30" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="135" y="32" width="30" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="165" y="32" width="30" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="195" y="32" width="30" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="245" y="32" width="30" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="275" y="32" width="30" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="305" y="32" width="30" height="30" fill="#fff" stroke="#1f2a44"/>
  <text x="40" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">r</text>
  <text x="70" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">w</text>
  <text x="100" y="52" font-size="13" text-anchor="middle" fill="#1f2a44">x</text>
  <text x="150" y="52" font-size="13" text-anchor="middle" fill="#6c7a93">-</text>
  <text x="180" y="52" font-size="13" text-anchor="middle" fill="#6c7a93">-</text>
  <text x="210" y="52" font-size="13" text-anchor="middle" fill="#6c7a93">-</text>
  <text x="260" y="52" font-size="13" text-anchor="middle" fill="#6c7a93">-</text>
  <text x="290" y="52" font-size="13" text-anchor="middle" fill="#6c7a93">-</text>
  <text x="320" y="52" font-size="13" text-anchor="middle" fill="#6c7a93">-</text>
  <text x="40" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="70" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="100" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="70" y="108" font-size="14" text-anchor="middle" fill="#1d6fd1">7</text>
  <text x="180" y="108" font-size="14" text-anchor="middle" fill="#1d6fd1">0</text>
  <text x="290" y="108" font-size="14" text-anchor="middle" fill="#1d6fd1">0</text>
</svg>
```
:::

::: context pid-reuse Why process ids come round again
The kernel hands out process ids in increasing order up to a ceiling, then wraps around to the smallest free number. The ceiling is in `/proc/sys/kernel/pid_max`: 32,768 on the machine used for this lesson, and 4,194,304 on many newer systems.

A build server that starts thousands of short commands a minute can use up 32,768 numbers within hours. So `$$` is unique only among processes running *right now* — not across a month of runs.
:::

::: context what-a-signal-is A tap on the shoulder
A **signal** is a tiny message the kernel delivers to a process: just a number, no text. Each number has a name and a default effect. The three that matter here:

- `SIGINT` (2), "interrupt" — what `Ctrl-C` sends;
- `SIGTERM` (15), "terminate" — the polite request to stop, sent by `kill` and by schedulers;
- `SIGKILL` (9) — not really a request. The kernel ends the process without asking it.

A process can **catch** most signals by installing a handler, which is exactly what `trap` does for a shell script. The dying process's exit status is 128 plus the signal number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">SIGINT 2</text>
  <text x="10" y="62" font-size="12" fill="#1f2a44">SIGTERM 15</text>
  <text x="10" y="94" font-size="12" fill="#1f2a44">SIGKILL 9</text>
  <text x="112" y="30" font-size="12" fill="#1f2a44">128 + 2 = 130</text>
  <text x="112" y="62" font-size="12" fill="#1f2a44">128 + 15 = 143</text>
  <text x="112" y="94" font-size="12" fill="#1f2a44">128 + 9 = 137</text>
  <rect x="222" y="16" width="128" height="22" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="286" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">trap can catch it</text>
  <rect x="222" y="48" width="128" height="22" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="286" y="63" font-size="11" text-anchor="middle" fill="#1f2a44">trap can catch it</text>
  <rect x="222" y="80" width="128" height="22" rx="4" fill="#fff" stroke="#b4232c"/>
  <text x="286" y="95" font-size="11" text-anchor="middle" fill="#b4232c">never caught</text>
</svg>
```
:::

::: context oom-killer When the machine runs out of memory
If the programs on a Linux machine ask for more memory than it has, the kernel picks a process — usually the biggest — and ends it with `SIGKILL` to save the rest. That is the **out-of-memory (OOM) killer**. It leaves a line in the kernel log, which `dmesg` or `journalctl -k` shows.

So an exit status of 137 from a memory-hungry simulation, with its scratch folder left behind, very often means "ran out of memory", not "someone killed it".
:::

::: context ctrl-c What Ctrl-C really does
Pressing `Ctrl-C` does not type a character your script reads. The terminal driver in the kernel sees the key and sends `SIGINT` to every process in the terminal's foreground **process group** — the script and whatever command it is running at that moment.

That is why an `INT` handler often finds its child already gone: the child received the same `SIGINT` at the same instant. A signal from a scheduler, by contrast, usually goes to one process id only, and the children never hear it.
:::

::: context orphans Who adopts an orphan
Every process on Linux has a parent. When a parent dies before its children, the kernel gives the children a new parent: process 1 (`systemd` on most modern systems), or a nearer ancestor that has asked to act as a "subreaper". The children are not stopped. They keep running and keep writing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="85" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">before</text>
  <text x="275" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">after the driver dies</text>
  <rect x="45" y="26" width="80" height="24" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="85" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">driver.sh</text>
  <line x1="85" y1="50" x2="30" y2="100" stroke="#1f2a44"/>
  <line x1="85" y1="50" x2="85" y2="100" stroke="#1f2a44"/>
  <line x1="85" y1="50" x2="140" y2="100" stroke="#1f2a44"/>
  <rect x="8" y="100" width="44" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="63" y="100" width="44" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="118" y="100" width="44" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="30" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">case</text>
  <text x="85" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">case</text>
  <text x="140" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">case</text>
  <rect x="235" y="26" width="80" height="24" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="275" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">pid 1</text>
  <line x1="275" y1="50" x2="220" y2="100" stroke="#b4232c"/>
  <line x1="275" y1="50" x2="275" y2="100" stroke="#b4232c"/>
  <line x1="275" y1="50" x2="330" y2="100" stroke="#b4232c"/>
  <rect x="198" y="100" width="44" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="253" y="100" width="44" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="308" y="100" width="44" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="220" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">case</text>
  <text x="275" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">case</text>
  <text x="330" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">case</text>
  <text x="275" y="142" font-size="11" text-anchor="middle" fill="#b4232c">still running</text>
</svg>
```
:::

::: context process-group Signalling a whole family
When the shell starts a pipeline or a script, it puts that job's processes into one **process group**, identified by a number. `kill 0` means "send this signal to every process in my own process group", and `kill -TERM -1234` (a minus in front) means "to every process in group 1234".

It is blunt on purpose. It reaches children you forgot to record — and, inside the handler, the script itself — so pair it with `trap - TERM` first, or the handler will catch its own signal.
:::

::: context atomic-rename Why a rename is all or nothing
A folder is really a list of names, each pointing at a file's data. `mv new old` within one filesystem does not copy any data. The kernel changes the name "summary.csv" to point at the new file in one step. A reader opening the file sees either the old data or the new, never a mixture.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="45" width="110" height="28" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="65" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">summary.csv</text>
  <rect x="230" y="12" width="120" height="28" rx="4" fill="#fff" stroke="#6c7a93"/>
  <text x="290" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">old data</text>
  <rect x="230" y="80" width="120" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="290" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">new data, whole</text>
  <line x1="120" y1="55" x2="228" y2="28" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="120" y1="64" x2="228" y2="94" stroke="#1d6fd1" stroke-width="2"/>
  <text x="150" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">before</text>
  <text x="170" y="100" font-size="11" text-anchor="middle" fill="#1d6fd1">after mv</text>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">one pointer switch, no copying</text>
</svg>
```

Across two filesystems there is no single pointer to switch, so `mv` must copy and then delete — and a crash in between leaves a half-written file.
:::

::: context fd-nine Why descriptor 9
A **file descriptor** is a small number the kernel uses for a file a process has open. 0, 1 and 2 are standard input, output and error. `exec 9>file` opens a file on number 9 for the rest of the script without running any command.

Nine is only a habit: low enough to type, high enough to stay clear of 0–2, and below 10, since bash uses descriptors from 10 upward for its own bookkeeping.
:::

::: context exit-75 Where 75 comes from
Old BSD Unix collected a list of exit codes in a header file, `sysexits.h`, which Linux systems still ship. Code 75 there is `EX_TEMPFAIL`: "temporary failure; the user is invited to retry".

That is exactly what "another sweep holds the lock" means, so a scheduler or wrapper that knows the convention can wait and try again, rather than reporting a broken job. Code 2 for "used wrongly" (lesson 06) is a separate shell convention, not from that file.
:::
