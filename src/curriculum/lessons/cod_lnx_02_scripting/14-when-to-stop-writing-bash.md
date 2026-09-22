---
id: l14-when-to-stop-writing-bash
title: When to stop writing bash
minutes: 20
covers:
  - When to stop writing bash and switch to Python
---

Every script in this module has been bash, and bash has been the right answer: run these programs, in this order, with these arguments, and stop if one fails. That is what a shell is for, and nothing replaces it.

But shell scripts grow. The sweep driver acquires a retry, then a summary, then a check that the summary is within tolerance, then a comparison against last week's baseline, and at some point it stopped being a list of commands and became a program — written in a language with no data structures, no floating point, no exceptions and no tests. This lesson is about noticing that moment, because noticing it late is expensive and noticing it early costs nothing.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21, Python 3.11.15, GNU Awk 5.2.1 and ShellCheck 0.9.0 on Ubuntu 24.04.4.

## What bash is genuinely good at

Be clear about this first, because the conclusion is not "use Python for everything".

- **Starting programs and wiring them together.** `a | b > c`, `&`, `wait`, exit statuses, signals. Nothing expresses this as compactly, and Python's `subprocess` is verbose by comparison.
- **Being there.** Every Linux machine, every container, every rescue shell. A bash script has no dependencies to install.
- **File plumbing.** Globs, redirections, `mktemp`, `trap`, moving and renaming, running a thing per file.
- **One-liners and glue.** Fifty lines that call five tools and check their statuses is bash at its best.

The test is not the line count by itself: it is what the lines *do*. Fifty lines that are all `cmd && cmd || die` is healthy bash. Fifteen lines that compute something are not.

## The five signals

**1. Arithmetic on measurements.** Bash has no floating point (lesson 04), so every calculation becomes a call to `awk`, `bc` or `python3` — once per value.

**2. Data structures beyond a flat list.** Bash has indexed arrays and, since version 4, string-keyed associative arrays. There is nothing else: no nesting, no arrays of arrays, no records. The moment you find yourself encoding structure into a key — `data["$chan,$field"]` — you are simulating a language feature.

**3. Error handling that needs context.** `set -e` stops the script; it cannot say which case, at which line of input, with which value. Any handling more nuanced than "stop" requires explicit status checks at every call site.

**4. Anything that must be tested.** A bash function that reads files and prints is hard to test in isolation. A Python function that takes data and returns data is trivial to test, and tests are what let you change a campaign's analysis six months later without re-verifying it by eye.

**5. Parsing structured data.** JSON, XML, CSV with quoted fields, anything nested. Lesson 11's `jq` handles JSON in a pipeline; past that, use a parser.

::: example The same job, twice
Per-channel sample count and mean from a telemetry log. The bash version, which passes `shellcheck` cleanly:

```bash
#!/usr/bin/env bash
set -euo pipefail
declare -A n sum
while IFS= read -r line; do
  chan=${line#*chan=}; chan=${chan%% *}
  val=${line##*val=}
  n[$chan]=$(( ${n[$chan]:-0} + 1 ))
  sum[$chan]=$(awk -v a="${sum[$chan]:-0}" -v b="$val" 'BEGIN{printf "%.6f", a+b}')
done < "$1"
for c in "${!n[@]}"; do
  awk -v c="$c" -v s="${sum[$c]}" -v k="${n[$c]}" 'BEGIN{printf "%-12s %4d %10.3f\n", c, k, s/k}'
done | sort
```

and the Python one:

```python
#!/usr/bin/env python3
"""Per-channel sample count and mean from a telemetry log."""
import re
import sys
from collections import defaultdict

LINE = re.compile(r"chan=(?P<chan>\S+)\s+val=(?P<val>-?[\d.eE+]+)")

def summarise(path):
    n, total = defaultdict(int), defaultdict(float)
    with open(path) as fh:
        for lineno, line in enumerate(fh, 1):
            m = LINE.search(line)
            if not m:
                print(f"{path}:{lineno}: unparsed: {line.rstrip()}", file=sys.stderr)
                continue
            n[m["chan"]] += 1
            total[m["chan"]] += float(m["val"])
    return {c: (n[c], total[c] / n[c]) for c in sorted(n)}
```

Both produce the same numbers on 400 records:

```text
BUS_VOLTS     100     27.990
GYRO_X_DPS    100      0.154
TANK_PSI      100    310.664
WHEEL_RPM     100   4208.206
```

Now the three differences that matter.

**Speed**, on the same 400-line file:

```text
real	0m1.009s     ./bin/stats.sh
real	0m0.020s     ./bin/stats.py
real	0m0.003s     awk -F'[= ]+' '{n[$4]++; s[$4]+=$6} END{...}' | sort
```

Fifty times slower than Python and three hundred times slower than `awk`, because the bash version starts an `awk` process **per input line** to do one addition. On a 4-million-line telemetry dump that is two and a half hours against fifteen seconds.

**Error reporting.** Feed both a line whose value is not a number:

```text
t=1.0 chan=BAD val=oops
t=2.0 chan=WHEEL_RPM val=4200.0
```

```text
/tmp/mixed.log:1: unparsed: t=1.0 chan=BAD val=oops
WHEEL_RPM       1   4200.000
```

```text
BAD             1      0.000
WHEEL_RPM       1   4200.000
```

The Python version names the file, the line number and the content, and leaves the bad record out. The bash version invents a channel called `BAD` with a mean of exactly zero — because `awk` converts a non-numeric field to 0 (lesson 10) — and exits 0. That number would go into a report.

**Testability.** Split the pure part out and it is three lines of test:

```python
class TestSummarise(unittest.TestCase):
    def test_single_channel(self):
        out = summarise_lines(["t=0.5 chan=A val=1.0", "t=1.0 chan=A val=3.0"])
        self.assertEqual(out, {"A": (2, 2.0)})

    def test_ignores_unparsed(self):
        out = summarise_lines(["t=0.5 chan=A val=1.0", "garbage"])
        self.assertEqual(out["A"], (1, 1.0))

    def test_negative_values(self):
        out = summarise_lines(["t=0.5 chan=G val=-1.5", "t=1.0 chan=G val=0.5"])
        self.assertAlmostEqual(out["G"][1], -0.5)
```

```bash
python3 -m unittest -v test_stats.py
```

```text
test_ignores_unparsed (test_stats.TestSummarise.test_ignores_unparsed) ... ok
test_negative_values (test_stats.TestSummarise.test_negative_values) ... ok
test_single_channel (test_stats.TestSummarise.test_single_channel) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.000s

OK
```

`unittest` is in the standard library, so this needs nothing installed; `pytest` is nicer and is a dependency. There is no comparable way to test the bash version's arithmetic without running the whole script against fixture files.

Note the third alternative in the timing table. For *this* job — one pass, columns in, summary out — `awk` beats both, in one line. The choice is not binary: bash for orchestration, `awk` for a single columnar pass, Python when there is logic.
:::

## What Python gives you in exchange

Three standard-library pieces cover most of what a migrated script needs.

**`subprocess`** replaces the shell's process handling, with `check=True` doing what `set -e` did:

```python
proc = subprocess.run(
    ["awk", "-v", f"s={seed}", "BEGIN{...}"],
    capture_output=True, text=True, check=True,
)
```

A list of arguments, not a string, so there is no quoting, no word splitting and no shell injection — the thing lesson 03 spent its length on stops being a category of bug. `check=True` raises on a non-zero status, and the exception carries the detail:

```text
case failed: awk exited 7
  stderr:
```

from a handler that caught `subprocess.CalledProcessError` and returned 4. A missing program raises a different exception entirely:

```text
FileNotFoundError: [Errno 2] No such file or directory: 'awk-does-not-exist'
```

which is `bash: cmd: command not found` with a type you can catch separately.

**`pathlib`** replaces string concatenation of paths: `outdir / f"case_{seed:04d}.csv"`, `path.write_text(...)`, `path.exists()`, `outdir.mkdir(parents=True, exist_ok=True)` — which is `mkdir -p` with the same idempotence.

**`argparse`** replaces `getopts` and gives long options, types, defaults, required arguments and a generated `--help` for free.

Beyond the standard library: `logging` instead of `echo >&2`, `pytest` for tests, and for anything numerical `numpy` and `pandas`, which turn "mean per channel over four million rows" into a line that runs in a second.

::: warning
Migrating badly produces something worse than the script you started with.

**Do not write bash in Python.** `subprocess.run("grep -c ERROR " + path + " | wc -l", shell=True)` reintroduces every quoting bug, adds a shell to the dependency list, and is slower than either original. If you are calling `grep`, `cut` and `sort` from Python on a file Python has already opened, use `re`, slicing and `sorted`.

**Do not rewrite it all at once.** The shell script works and is in production. Move the *logic* out first — the part that computes — into a Python module with tests, and have the existing script call it. The shell keeps doing what it is good at, and the part that was hard to get right is now the part that is tested.

**Do not lose the exit codes.** Lesson 06's conventions still apply: `sys.exit(2)` for usage, distinct small codes for distinct failures, and never `sys.exit(0)` after printing an error. A Python script that raises an uncaught exception exits 1 with a traceback, which is acceptable for an internal tool and not for something a scheduler retries — catch at the top and return a code you chose.
:::

## The heuristics

Not rules, but they are right more often than not.

- **More than about 100 lines** that are not straight-line command invocations. The exact number matters less than the trend: if it grew past 100 by accumulating logic rather than steps, it will keep growing.
- **Any loop with arithmetic inside it.** That is the speed cliff from the example: a process per iteration.
- **Any nested data.** A second dimension in an array key is the signal.
- **Any `if` with more than three branches on parsed content.** That is a state machine, and `case` is not one.
- **Anything a second person will maintain.** Bash's failure modes are invisible to a reader: an unquoted variable, a masked return, a subshell that eats a result. Python's are not.
- **Anything whose output feeds a decision.** If a number from this script is going into a report, a review or a go/no-go, it should be produced by code with tests.

And the counter-heuristic, which matters as much: **if it is a list of commands with statuses checked, leave it in bash**. Rewriting a working 40-line driver in Python buys nothing and costs a dependency.

::: example A sweep driver that keeps the shell where it belongs
The shape to aim for, rather than one language or the other.

```bash
#!/usr/bin/env bash
# run_campaign.sh — orchestrate a sweep; the analysis lives in Python.
set -Eeuo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp=""
cleanup() {
  local st=$?
  [[ -n $tmp ]] && rm -rf "$tmp"
  (( st == 0 )) || echo "${0##*/}: failed with status $st" >&2
  return 0
}
trap cleanup EXIT

main() {
  local cases=10 outdir="results"
  while getopts ":n:o:" opt; do
    case "$opt" in
      n) cases="$OPTARG" ;;
      o) outdir="$OPTARG" ;;
      *) echo "usage: ${0##*/} [-n cases] [-o outdir]" >&2; exit 2 ;;
    esac
  done
  shift $((OPTIND - 1))

  tmp="$(mktemp -d)"
  mkdir -p -- "$outdir"

  seq 1 "$cases" | xargs -n 1 -P "$(nproc)" "$here/run_case.sh" -o "$outdir"

  "$here/analyse.py" --indir "$outdir" --report "$outdir/report.json"
}

main "$@"
```

Bash does what bash is good at: options, a temporary directory with a trap, `mkdir -p`, parallel dispatch with `xargs -P` (lesson 05 of the previous module), and stopping on the first failure. It does no arithmetic, holds no structured data, and parses nothing.

`analyse.py` does what Python is good at: reads the case outputs, computes the statistics in floating point, validates them against tolerances, writes a JSON report, and has a test suite that runs in a second without a simulator.

Both scripts pass `shellcheck` with no warnings, and the whole thing works:

```bash
./bin/run_campaign.sh -n 5 -o /tmp/camp2
cat /tmp/camp2/report.json
```

```text
5 cases, mean 4.500
```

```text
{
  "n": 5,
  "mean": 4.5,
  "max": 7.5
}
```

A failure in one case propagates, the trap still cleans up, and the status says which layer failed:

```bash
./bin/run_campaign.sh -n 0 -o /tmp/camp3; echo "exit=$?"
```

```text
/home/eng/work/bin/run_case.sh: line 6: 1: case id required
run_campaign.sh: failed with status 123
exit=123
```

123 is `xargs`'s "at least one invocation exited 1–125", and `ls -d /tmp/tmp.*` afterwards reports `0` — the scratch directory is gone.

The interface between the two halves is a directory of files and an exit status, which means either can be rewritten without touching the other, and either can be run by hand.

This is also the migration path for a script that has grown too large: identify the part that computes, move it to a Python module with tests, and leave the orchestration where it is.
:::

::: key
Bash is for starting programs, wiring them together and checking their statuses. Move to Python when there is arithmetic on measurements, nested data, error handling that needs context, anything that should be tested, or structured input to parse. The usual signal is a loop with a process started inside it — fifty to three hundred times slower than the alternatives. Migrate the logic, not the orchestration, and keep lesson 06's exit-code conventions on the other side.
:::

## Check yourself

::: check
A 60-line bash script starts `awk` inside a loop over a log. It is correct and it takes forty minutes. What is happening, and what are the two ways to fix it?
:::

::: answer
Each iteration is a `fork` and an `exec`: a new process, a new address space, dynamic linking, and the interpreter's own start-up, for a few microseconds of actual work. That fixed cost — on the order of a millisecond — is paid per line, so the run time is proportional to the number of lines and almost independent of what the computation is. In the measurement in this lesson, 400 lines took 1.009 s in that shape against 0.020 s in Python and 0.003 s in one `awk` program.

Fix one, if the job is a single columnar pass: move the whole loop into `awk`. One process reads the file once, accumulates in arrays and prints in `END`. This is usually a three-line program and is the fastest of the three.

Fix two, if there is real logic: move it to Python. You lose `awk`'s terseness and gain structure, error reporting and tests, at about seven times `awk`'s run time — which is irrelevant next to the fifty-times gain over the shell loop.

The general rule: **never start a process per record.** If a loop body contains a command substitution or a pipe, that is a process per iteration, and the loop is the problem.
:::

::: check
Your driver must retry a failed case up to three times with exponential backoff, record which cases were retried, and report the distribution of attempt counts at the end. Bash or Python?
:::

::: answer
Python. Count what is being asked for: state per case that outlives the loop iteration (attempt counts), arithmetic on the backoff (which is multiplicative, and bash has no floating point), a structured record of what happened, and a summary computed from that record.

Bash can do each piece — an associative array keyed by case id, `sleep $((2 ** attempt))` for integer backoff, a counter array for the distribution — but the result encodes structure into string keys, has no way to attach the reason a case failed to the case, and cannot be tested except end to end against a real simulator.

The shape that keeps both languages honest: Python runs the retry loop and calls the case runner through `subprocess.run(..., check=True)`, catching `CalledProcessError` to decide whether to retry and recording the attempt. The case runner itself stays a shell script if that is what it is. The driver writes a JSON report, which lesson 11's `jq` can query from the command line afterwards.

If the retry really is "try three times, then give up, and I do not need to know which" — `for i in 1 2 3; do cmd && break; sleep $((i*5)); done` — that is four lines of bash and should stay there.
:::

::: check
Why is `subprocess.run(["grep", "-c", "ERROR", path], check=True)` safer than `subprocess.run(f"grep -c ERROR {path}", shell=True)`?
:::

::: answer
Because the list form does not involve a shell. The arguments are passed to `execve` exactly as given, so a path containing a space is one argument, a path containing `*` is a literal path, and a path containing `;` or `$(...)` is a path rather than a command. Every failure mode from lesson 03 — word splitting, glob expansion, quoting — is structurally absent, along with the injection risk when the path comes from user input or from a filename on disk.

The `shell=True` form builds a command *string* and hands it to `/bin/sh`, which then parses it. It is slower (an extra process), it depends on a shell being present, and its behaviour depends on the value of `path`.

`check=True` is the other half: without it, `subprocess.run` returns quietly whatever the command's status was, exactly like a pipeline without `set -e`. With it, a non-zero status raises `CalledProcessError`, which carries `returncode`, `cmd`, `stdout` and `stderr` — so the handler can report *which* command failed and *why*, which is more than `set -e` could ever say.

The exception for `shell=True` is when you genuinely want shell features — a pipeline, a redirection — and even then, building the pipeline with `subprocess` objects or doing the work in Python is usually clearer.
:::

::: check
A colleague proposes rewriting a working 400-line bash campaign driver in Python "properly", in one change. What would you suggest instead?
:::

::: answer
An incremental migration, because the 400 lines are not homogeneous. Most of them are probably orchestration — parse options, make directories, dispatch cases, check statuses — which bash does well and which a rewrite would make longer without making it better. A minority are logic, and those are where the bugs are.

The order that works. First, find the part that computes and give it a boundary: a function that takes the case outputs and returns numbers. Move that to a Python module, with tests, and have the bash script call it as a subprocess with a documented interface — arguments in, a JSON file or an exit code out. Now the risky part is tested and the script still runs.

Then, if the orchestration itself has grown complicated — retries, dependencies between stages, a scheduler — move the driver too, keeping the per-case runner as a shell script. At each step the thing works and can be reverted.

The arguments against the big-bang rewrite are the usual ones and they apply with force here: the existing script encodes years of small corrections that are not in anyone's head, nobody can review 400 lines of new code against 400 lines of old in two languages, and there is no point at which you can stop. The arguments for doing *something* are that the 400 lines are untestable as they stand — so aim the effort at the part where that costs the most.
:::

::: check
Name two things bash does better than Python, and say why they are not worth giving up.
:::

::: answer
**Wiring processes together.** `a | b | c > out 2>err` is five characters of syntax for three concurrent processes, two pipes and two redirections; the `subprocess` equivalent is a dozen lines of `Popen` objects and file handles. A shell pipeline also streams — constant memory over an arbitrarily large input — without you arranging anything. For any job that is genuinely "run these programs and connect them", the shell version is shorter, clearer and easier to verify by eye.

**Being present.** Bash is on every Linux machine, in every container, in a rescue shell and on the far side of an SSH connection to a node you have never seen. A bash script has no dependencies, no virtual environment and no version negotiation. A recovery or bootstrap script that needs Python is a script that cannot run when Python is what is broken.

They are not worth giving up because the two languages are not competing for the same work. The recommendation in this lesson is not "use Python", it is "use each for what it is": bash as the entry point and the orchestrator, Python for the logic, `awk` for a single columnar pass. A campaign driver that is 40 lines of bash calling a tested Python module is better than either language alone.
:::

## Summary

| Signal | Why bash is wrong for it | Where to go |
| --- | --- | --- |
| arithmetic on measurements | no floating point; a process per calculation | `awk` for one pass, Python for logic |
| a loop that starts a process per record | ~1 ms fixed cost per iteration | 1.009 s vs 0.020 s vs 0.003 s on 400 lines |
| nested or structured data | flat arrays only; keys like `"$a,$b"` | Python dicts, dataclasses |
| error handling with context | `set -e` can only stop | exceptions carrying `returncode`, `cmd`, `stderr` |
| anything that must be tested | functions read files and print | a pure function plus `unittest`/`pytest` |
| JSON, XML, quoted CSV | line-oriented tools cannot parse nesting | `jq` in a pipeline, else a real parser |
| **stays in bash** | orchestration, statuses, globs, `trap`, `xargs -P` | the entry point and the plumbing |
| `subprocess.run([...], check=True)` | list form: no shell, no quoting, no injection | `CalledProcessError` has the detail |
| `pathlib`, `argparse`, `logging` | replace path strings, `getopts`, `echo >&2` | standard library |
| migration order | logic first, orchestration later | each step works and is revertible |
| exit codes | still lesson 06's rules | `sys.exit(2)` for usage; catch at the top |

That is the module. You can now write a shell script that fails loudly, quotes correctly, cleans up after itself, takes options, passes a linter, runs on a schedule — and you can tell when the next thing you are about to add should not be written in bash at all.
