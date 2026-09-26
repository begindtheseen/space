---
id: l14-when-to-stop-writing-bash
title: When to stop writing bash
minutes: 22
covers:
  - When to stop writing bash and switch to Python
---

Look inside a rocket and you find two very different kinds of hardware. The **wiring harness** — bundles of cables — connects the boxes: power here, a sensor signal there, a command out to a valve. The **flight computer** is the box that thinks: it takes the sensor numbers, does the math, and decides. Nobody asks the harness to do arithmetic, and nobody builds the harness out of flight computers.

Bash is the wiring harness. Every script in this module has been bash, and rightly: run these programs, in this order, with these arguments, and stop if one fails. That is what a shell is for.

But shell scripts grow. The sweep driver gets a retry, then a summary, then a tolerance check, then a comparison with last week. At some point it stopped being a list of commands and became a program — written in a language with no nested data, no floating point, no exceptions and no tests. This lesson is about noticing that moment. Noticing it late is expensive. Noticing it early costs nothing.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21, Python 3.11.15, GNU Awk 5.2.1 and ShellCheck 0.9.0 on Ubuntu 24.04.4.

## What bash is genuinely good at

Start here: the conclusion is not "use Python for everything".

- **Starting programs and wiring them together.** `a | b > c`, `&`, `wait`, exit statuses, signals. Nothing says this more compactly.
- **Being there.** Every Linux machine, every container, every rescue shell has it. A bash script has nothing to install.
- **File plumbing.** Globs, redirections, `mktemp`, `trap`, moving and renaming, running a command once per file.
- **One-liners and glue.** Fifty lines that call five tools and check their statuses is bash at its best.

The test is what the lines *do*, not how many there are. Fifty lines that are all `cmd && cmd || die` — read "run cmd, and if it worked run the next, or else die" — is healthy bash. Fifteen lines that compute something are not.

## The five signals

**1. Arithmetic on measurements.** Bash does whole numbers only; there is **[[no floating point|bash-integers]]** (lesson 04). A voltage of 27.99 cannot be added in bash itself, so every calculation becomes a call to `awk`, `bc` or `python3` — once per value.

**2. Data structures beyond a flat list.** Bash has indexed arrays and, since version 4, **associative arrays** — lists looked up by a string name instead of a number. That is all. There is no nesting, no array of arrays, no record with named parts. The moment you catch yourself **[[packing structure into a key|flat-keys]]** — `data["$chan,$field"]` — you are faking a feature the language does not have.

**3. Error handling that needs context.** `set -e` stops the script, but cannot say which case failed, on which input line, with which value.

**4. Anything that must be tested.** A bash function that reads files and prints is hard to test alone; a Python function that takes data and returns data is easy. Tests let you change an analysis six months later without rechecking every number by eye.

**5. Parsing structured data.** JSON, XML, CSV with quoted fields — anything nested. Lesson 11's `jq` handles JSON inside a pipeline. Past that, use a real parser.

::: key When to stop writing bash
When you need data structures beyond flat arrays, floating-point arithmetic, error handling with context, or tests. Bash is glue for invoking programs; anything with real logic belongs in Python.
:::

::: example The same job, twice
The job: from a telemetry log with lines like `t=0.5 chan=BUS_VOLTS val=28.258`, print each channel's sample count and mean.

**The bash version.** It passes `shellcheck` cleanly.

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

Line by line: read each line; cut out the text between `chan=` and the next space; cut out everything after `val=`; add one to that channel's count; then — because bash cannot add 28.258 to anything — start an `awk` to do one addition. At the end, one more `awk` per channel divides.

**The Python version.** The pure part, `summarise_lines`, takes lines and returns a result, so it can be tested without any file:

```python
#!/usr/bin/env python3
"""Per-channel sample count and mean from a telemetry log."""
import re
import sys
from collections import defaultdict

LINE = re.compile(r"chan=(?P<chan>\S+)\s+val=(?P<val>-?[\d.eE+]+)")


def summarise_lines(lines, name="-"):
    n, total = defaultdict(int), defaultdict(float)
    for lineno, line in enumerate(lines, 1):
        m = LINE.search(line)
        if not m:
            print(f"{name}:{lineno}: unparsed: {line.rstrip()}", file=sys.stderr)
            continue
        n[m["chan"]] += 1
        total[m["chan"]] += float(m["val"])
    return {c: (n[c], total[c] / n[c]) for c in sorted(n)}


def summarise(path):
    with open(path) as fh:
        return summarise_lines(fh, path)


if __name__ == "__main__":
    for chan, (k, mean) in summarise(sys.argv[1]).items():
        print(f"{chan:<12s} {k:4d} {mean:10.3f}")
```

`LINE` is a **[[regular expression|named-groups]]** that finds `chan=` and `val=` and names the two pieces. `defaultdict(int)` is a dictionary where a missing key starts at 0, which replaces bash's `${n[$chan]:-0}`.

On a 400-line log, both print the same numbers:

```text
BUS_VOLTS     100     28.029
GYRO_X_DPS    100      0.153
TANK_PSI      100    310.810
WHEEL_RPM     100   4208.376
```

Sanity check: 4 channels times 100 samples is 400 lines. Now the three differences that matter.

**1. Speed**, on the same 400-line file:

```text
real	0m1.268s     ./bin/stats.sh
real	0m0.023s     ./bin/stats.py
real	0m0.004s     awk -F'[= ]+' '{n[$4]++; s[$4]+=$6} END{...}' | sort
```

The bash version is about 55 times slower than Python ($1.268 / 0.023 \approx 55$) and about 300 times slower than `awk` ($1.268 / 0.004 \approx 317$). The reason: it **[[starts a new process for every input line|process-per-line]]** to do one addition. That costs about $1.268\,\mathrm{s} / 400 \approx 3.2\,\mathrm{ms}$ per line, and it grows in step with the file — 4,000 lines took 12.9 s. A 4-million-line telemetry dump would take about $4 \times 10^6 \times 3.2\,\mathrm{ms} \approx 12{,}700\,\mathrm{s}$, three and a half hours. Python and `awk` each read a 400,000-line copy in under half a second (0.38 s and 0.45 s), so 4 million lines is a few seconds for either.

**2. Error reporting.** Feed both a file with one bad value:

```text
t=1.0 chan=BAD val=oops
t=2.0 chan=WHEEL_RPM val=4200.0
```

Python:

```text
mixed.log:1: unparsed: t=1.0 chan=BAD val=oops
WHEEL_RPM       1   4200.000
```

Bash:

```text
BAD             1      0.000
WHEEL_RPM       1   4200.000
```

Python names the file, line and text, and skips the bad record. Bash invents a channel `BAD` with a mean of exactly zero — because **[[awk turns non-numbers into 0|awk-zero]]** (lesson 10) — and exits 0. That zero would go into a report.

**3. Testability.** Three short tests of the pure function:

```python
import unittest
from stats import summarise_lines


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
test_ignores_unparsed (test_stats.TestSummarise.test_ignores_unparsed) ... -:2: unparsed: garbage
ok
test_negative_values (test_stats.TestSummarise.test_negative_values) ... ok
test_single_channel (test_stats.TestSummarise.test_single_channel) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.000s

OK
```

The `-:2: unparsed: garbage` line is the function's own warning, printed during the second test — as expected. `unittest` comes with Python. **[[pytest|pytest-vs-unittest]]** is nicer and is an extra install. There is no comparable way to test the bash version's arithmetic without running the whole script against sample files.

Note the third timing row. For *this* job — one pass, columns in, summary out — `awk` beats both in one line. So the choice is not bash-or-Python: bash for orchestration, `awk` for a single pass over columns, Python when there is logic.
:::

## What Python gives you in exchange

Three pieces of Python's standard library — the modules that come with it — cover most of what a migrated script needs.

**`subprocess`** replaces the shell's way of running programs. With `check=True` it does what `set -e` did:

```python
proc = subprocess.run(
    ["awk", "-v", f"s={seed}", "BEGIN{...}"],
    capture_output=True, text=True, check=True,
)
```

The command is a **[[list of arguments, not a string|argv-list]]**. No shell reads it, so there is no quoting, no word splitting and no **[[shell injection|shell-injection]]** — lesson 03's whole bug family is gone. On a non-zero status, `check=True` raises an **exception** — a Python error object carrying the details. A handler that caught `subprocess.CalledProcessError` and returned 4 printed:

```text
case failed: awk exited 7
  stderr:
```

A program that does not exist raises a different exception:

```text
FileNotFoundError: [Errno 2] No such file or directory: 'awk-does-not-exist'
```

That is bash's `command not found`, as a separate type you can catch.

**`pathlib`** replaces gluing paths together as strings: `outdir / f"case_{seed:04d}.csv"` (the `/` joins path pieces), `path.write_text(...)`, `path.exists()`, and `outdir.mkdir(parents=True, exist_ok=True)` — which is `mkdir -p`, just as safe to run twice.

**`argparse`** replaces `getopts`, adding long options, types, defaults and a generated `--help`.

Beyond those: `logging` instead of `echo >&2`, `pytest` for tests, and `numpy` and `pandas` for number-crunching over millions of rows.

::: warning A bad migration is worse than the script you started with
**Do not write bash in Python.** `subprocess.run("grep -c ERROR " + path + " | wc -l", shell=True)` brings back every quoting bug and is slower than either original. Instead of calling `grep`, `cut` and `sort` from Python, use `re`, slicing and `sorted`.

**Do not rewrite it all at once.** The shell script works and is in use. Move the *logic* — the part that computes — into a Python module with tests, and have the existing script call it.

**Do not lose the exit codes.** Lesson 06's rules still hold: `sys.exit(2)` for a usage error, different small codes for different failures, and never `sys.exit(0)` after printing an error. An uncaught Python exception exits with status 1 and a traceback (the chain of calls that led to the error) — fine for an internal tool, not for something a scheduler retries. Catch errors at the top and exit with a code you chose.
:::

## The heuristics

A **heuristic** is a rule of thumb: not always right, but right more often than not.

- **More than about 100 lines** that are not straight command calls. The trend matters more than the number: if it grew by gaining logic rather than steps, it will keep growing.
- **Any loop with arithmetic inside.** That is the speed cliff from the example: one process per trip round the loop.
- **Any nested data.** A second dimension in an array key is the signal.
- **Any `if` with more than three branches on parsed content.** That is a state machine — a program that remembers what it has seen and changes behavior because of it — and `case` is not one.
- **Anything a second person will maintain.** Bash's failure modes — an unquoted variable, a hidden status, a subshell that swallows a result — are invisible to a reader.
- **Anything whose output feeds a decision.** A number bound for a report or a go/no-go call should come from tested code.

And the counter-rule, which matters as much: **if it is a list of commands with their statuses checked, leave it in bash.** Rewriting a working 40-line driver in Python buys nothing and adds a dependency.

::: example A sweep driver that keeps the shell where it belongs
The shape to aim for is not one language or the other. It is each doing its own job.

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

**Bash** reads options, makes a scratch folder with a trap to remove it, runs the cases in parallel with `xargs -P` (lesson 05 of the previous module), and stops on the first failure. It does no arithmetic and parses nothing.

**`analyse.py`** reads the case outputs, computes the statistics in floating point and writes a JSON report. Its tests can run in a second without a simulator.

Both shell scripts pass `shellcheck` with no warnings. Run the driver for five cases, where the stand-in case runner writes $1.5 \times$ its case number:

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

Sanity check: the cases wrote 1.5, 3.0, 4.5, 6.0 and 7.5. They add to 22.5, and $22.5 / 5 = 4.5$. The largest is 7.5. The report agrees.

Now a failure. Ask for zero cases:

```bash
./bin/run_campaign.sh -n 0 -o /tmp/camp3; echo "exit=$?"
```

```text
/home/eng/work/bin/run_case.sh: line 6: 1: case id required
run_campaign.sh: failed with status 123
exit=123
```

Step by step: `seq 1 0` prints nothing. GNU `xargs` still runs its command once when it gets no input (unless you pass `-r`), so `run_case.sh` starts with no case number and refuses. `xargs` then exits **[[123|xargs-status]]**, which means "at least one run exited with a status from 1 to 125". `pipefail` passes that up, `set -e` stops the script, and the trap reports it. Afterwards `ls -d /tmp/tmp.*` finds nothing: the scratch folder is gone.

The two halves talk through a folder of files and an exit status, so either can be rewritten without touching the other, and either can be run by hand. This is also how to migrate a script that has grown too big: move the part that computes into a tested Python module, and leave the orchestration where it is.
:::

::: key Bash for wiring, Python for logic
Bash is for starting programs, wiring them together and checking their statuses. Move to Python when there is arithmetic on measurements, nested data, error handling that needs context, anything that should be tested, or structured input to parse. The usual warning sign is a loop that starts a process every time round — here 55 times slower than Python and about 300 times slower than one `awk`. Migrate the logic, not the orchestration, and keep lesson 06's exit-code rules on the other side.
:::

## Check yourself

::: check
A 60-line bash script starts `awk` inside a loop over a log. It is correct, and it takes forty minutes. What is happening, and what are the two ways to fix it?
:::

::: answer
**What is happening.** Every trip round the loop starts a new process: the kernel copies the shell, loads `awk`, links its libraries and starts it — for a few microseconds of real work. That fixed cost, about 3 ms here, is paid per line, so run time grows with the line count whatever the calculation. In this lesson's measurement, 400 lines took 1.268 s in that shape, against 0.023 s in Python and 0.004 s in one `awk` program.

**Fix one**, if the job is a single pass over columns: move the whole loop into `awk`. One process reads the file once, adds up in arrays, and prints in `END`. This is usually a three-line program.

**Fix two**, if there is real logic: move it to Python. You lose `awk`'s shortness and gain structure, error reports and tests. On large files the two run at about the same speed — 0.38 s for Python and 0.45 s for `awk` on 400,000 lines here — and either is hundreds of times faster than the shell loop.

The general rule: **never start a process per record.** If a loop body contains a command substitution `$( )` or a pipe, that is at least one new process every time round, and the loop is the problem.
:::

::: check
Your driver must retry a failed case up to three times with exponential backoff (a wait that doubles each time), record which cases were retried, and report how many attempts cases needed at the end. Bash or Python?
:::

::: answer
Python. Count what is being asked for:

- information about each case that lives longer than one trip round the loop (its attempt count);
- arithmetic on the waits;
- a structured record of what happened, including why each case failed;
- a summary computed from that record.

Bash could do each piece — an associative array per case, `sleep $((2 ** attempt))`, another array for the tally — but it packs structure into string keys, has nowhere to attach a failure reason, and can only be tested end to end against a real simulator.

The shape that keeps both languages honest: Python runs the retry loop and calls the case runner through `subprocess.run(..., check=True)`, catching `CalledProcessError` to decide whether to retry and to record the attempt. The case runner stays a shell script if that is what it is. The driver writes a JSON report, which lesson 11's `jq` can query afterwards.

If the retry really is "try three times, then give up, and I do not care which" — `for i in 1 2 3; do cmd && break; sleep $((i*5)); done` — that is one line of bash and should stay there.
:::

::: check
Why is `subprocess.run(["grep", "-c", "ERROR", path], check=True)` safer than `subprocess.run(f"grep -c ERROR {path}", shell=True)`?
:::

::: answer
**The list form involves no shell.** The arguments go to the kernel's `execve` exactly as given. A path with a space stays one argument. A path with `*` is a literal name. A path with `;` or `$(...)` is still a path, not a command. Every failure from lesson 03 — word splitting, glob expansion, quoting — cannot happen, and neither can injection when the path comes from a user or from a file name on disk.

**The `shell=True` form hands one string to `/bin/sh`** to parse. It is slower (an extra process), and what it does depends on what is inside `path`.

**`check=True` is the other half.** Without it, a failure passes quietly, like a script without `set -e`. With it, a non-zero status raises `CalledProcessError`, carrying `returncode`, `cmd`, `stdout` and `stderr` — so a handler can say *which* command failed and *why*.

Use `shell=True` only when you truly want shell features like a pipeline — and even then, doing the work in Python is usually clearer.
:::

::: check
A colleague proposes rewriting a working 400-line bash campaign driver in Python "properly", in one change. What would you suggest instead?
:::

::: answer
**Migrate a piece at a time**, because the 400 lines are not all alike. Most are probably orchestration — read options, make folders, dispatch cases, check statuses. Bash does that well, and a rewrite would make it longer without making it better. A minority are logic, and that is where the bugs live.

The order that works:

1. Find the part that computes and give it a clear boundary: case outputs in, numbers out.
2. Move that into a Python module with tests, called by the bash script as a separate program — arguments in, a JSON file or an exit code out. Now the risky part is tested, and the script still runs.
3. Only if the orchestration itself has grown complicated — retries, stages that depend on each other, scheduling — move the driver too, keeping the per-case runner as a shell script.

Every step works and can be undone.

The case against **[[the big rewrite|big-rewrite]]** is strong here. The old script holds years of small fixes that are in nobody's head, nobody can review 400 new lines against 400 old ones in two languages, and there is no halfway point to stop at. The case for doing *something* is that the 400 lines cannot be tested as they stand — so aim the effort where that costs most.
:::

::: check
Name two things bash does better than Python, and say why they are not worth giving up.
:::

::: answer
**Wiring processes together.** `a | b | c > out 2>err` is a few characters for three programs running at once, two pipes and two redirects; the `subprocess` version is a dozen lines. A pipeline also streams — data flows through in small pieces, so memory stays flat however big the input. For "run these programs and connect them", the shell is shorter and easier to check by eye.

**Being present.** Bash is on every Linux machine, in every container, in a rescue shell, and at the far end of an SSH connection to a computer you have never seen. A bash script needs no installed packages and no virtual environment. A recovery or setup script that needs Python cannot run when Python is the thing that is broken.

They are not worth giving up because the two languages are not competing for the same work. The advice is not "use Python" but "use each for what it is good at". A campaign driver that is 40 lines of bash calling a tested Python module is better than either language alone.
:::

## Summary

| Signal | Why bash is wrong for it | Where to go |
| --- | --- | --- |
| arithmetic on measurements | no floating point; a process per calculation | `awk` for one pass, Python for logic |
| a loop that starts a process per record | about 3 ms fixed cost per trip round the loop | 1.268 s vs 0.023 s vs 0.004 s on 400 lines |
| nested or structured data | flat arrays only; keys like `"$a,$b"` | Python dicts, dataclasses |
| error handling with context | `set -e` can only stop | exceptions carrying `returncode`, `cmd`, `stderr` |
| anything that must be tested | functions read files and print | a pure function plus `unittest`/`pytest` |
| JSON, XML, quoted CSV | line-based tools cannot parse nesting | `jq` in a pipeline, else a real parser |
| **stays in bash** | orchestration, statuses, globs, `trap`, `xargs -P` | the entry point and the plumbing |
| `subprocess.run([...], check=True)` | list form: no shell, no quoting, no injection | `CalledProcessError` has the details |
| `pathlib`, `argparse`, `logging` | replace path strings, `getopts`, `echo >&2` | standard library |
| migration order | logic first, orchestration later | each step works and can be undone |
| exit codes | still lesson 06's rules | `sys.exit(2)` for usage; catch at the top |

That is the module. You can now write a shell script that fails loudly, quotes correctly, cleans up after itself, takes options, passes a linter and runs on a schedule — and you can tell when the next thing you are about to add should not be written in bash at all.

::: context bash-integers Bash counts in whole numbers
Bash's `$(( ))` arithmetic works only with whole numbers. Division throws away the remainder, and a decimal point is a syntax error:

```bash
echo $((7 / 2))    # 3
echo $((1.5 + 1))  # error: 1.5 + 1: syntax error: invalid arithmetic operator (error token is ".5 + 1")
```

The first line prints 3, not 3.5. That is fine for counting cases or files. It is useless for sensor readings, where nearly every value has digits after the point. So bash scripts hand every such calculation to another program — which is exactly where the slowness in this lesson comes from.
:::

::: context flat-keys Faking a table with string keys
Suppose you want, for each channel, both a count and a sum. Python can hold that shape directly: a dictionary of channels, each holding its own small record. Bash has only one flat level, so you glue the two names together into one key.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">Python: nested</text>
  <rect x="20" y="28" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">GYRO</text>
  <rect x="100" y="28" width="70" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="135" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">n: 100</text>
  <rect x="100" y="54" width="70" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="135" y="71" font-size="11" text-anchor="middle" fill="#1f2a44">sum: 15.3</text>
  <line x1="80" y1="41" x2="100" y2="41" stroke="#1f2a44"/>
  <rect x="20" y="96" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="113" font-size="11" text-anchor="middle" fill="#1f2a44">TANK</text>
  <rect x="100" y="96" width="70" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="135" y="113" font-size="11" text-anchor="middle" fill="#1f2a44">n: 100</text>
  <rect x="100" y="122" width="70" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="135" y="139" font-size="11" text-anchor="middle" fill="#1f2a44">sum: 31081</text>
  <line x1="80" y1="109" x2="100" y2="109" stroke="#1f2a44"/>
  <text x="275" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">bash: one flat level</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="200" y="28" width="150" height="26" fill="#f2b880" stroke="#1f2a44"/><text x="208" y="45">"GYRO,n" → 100</text>
    <rect x="200" y="54" width="150" height="26" fill="#f2b880" stroke="#1f2a44"/><text x="208" y="71">"GYRO,sum" → 15.3</text>
    <rect x="200" y="96" width="150" height="26" fill="#f2b880" stroke="#1f2a44"/><text x="208" y="113">"TANK,n" → 100</text>
    <rect x="200" y="122" width="150" height="26" fill="#f2b880" stroke="#1f2a44"/><text x="208" y="139">"TANK,sum" → 31081</text>
  </g>
</svg>
```

It works until a channel name contains a comma, or you need a third level, or you want "all fields of GYRO" — then you are writing string-splitting code to undo your own glue.
:::

::: context named-groups Reading the pattern
`chan=(?P<chan>\S+)\s+val=(?P<val>-?[\d.eE+]+)` reads, piece by piece:

- `chan=` — those exact letters;
- `(?P<chan>\S+)` — one or more characters that are not spaces, saved under the name `chan`;
- `\s+` — one or more spaces;
- `val=` — those exact letters;
- `(?P<val>-?[\d.eE+]+)` — an optional minus sign, then digits, dots, `e`, `E` or `+`, saved as `val`.

The `r` before the quotes makes it a "raw" string, so Python leaves the backslashes for the pattern. `m["chan"]` then pulls out the saved piece by name. A line that does not fit the pattern gives no match, and that is how the bad line gets caught.
:::

::: context process-per-line A new process every time round
Starting a program is like calling a taxi: the ride may be ten seconds, but you still wait for the car to arrive. The bash loop calls a new taxi for every line of the log. `awk` and Python call one taxi and ride it through the whole file.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">bash loop: one awk per line</text>
  <g fill="#f2b880" stroke="#1f2a44">
    <rect x="10" y="30" width="36" height="22"/><rect x="54" y="30" width="36" height="22"/><rect x="98" y="30" width="36" height="22"/><rect x="142" y="30" width="36" height="22"/><rect x="186" y="30" width="36" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="28" y="45">awk</text><text x="72" y="45">awk</text><text x="116" y="45">awk</text><text x="160" y="45">awk</text><text x="204" y="45">awk</text>
  </g>
  <text x="290" y="45" font-size="11" text-anchor="middle" fill="#b4232c">… 400 starts</text>
  <text x="10" y="90" font-size="12" fill="#1f2a44">awk or Python: one process</text>
  <rect x="10" y="100" width="212" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="116" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">reads all 400 lines</text>
  <text x="290" y="115" font-size="11" text-anchor="middle" fill="#1d6fd1">1 start</text>
</svg>
```

That is also why, on the tiny 400-line file, Python's 0.023 s is mostly Python starting up. On 400,000 lines it took 0.38 s — a thousand times the data for about seventeen times the time.
:::

::: context awk-zero Why "oops" became 0
When `awk` needs a number and finds text, it reads as many digits as it can from the front and stops. `"oops"` has no digits at the front, so it counts as 0. There is no error and no warning. In `awk` this is a documented feature, handy for quick sums. Inside a summary report it is a silent wrong answer — a channel with a mean of exactly 0.000, which looks like a real measurement.
:::

::: context pytest-vs-unittest Two ways to write the same test
`unittest` comes with Python and follows an older style: tests are methods in a class, checked with calls like `self.assertEqual(a, b)`. **pytest** is a separate package. It lets a test be a plain function using a plain `assert a == b`, and when a check fails it prints the values on both sides. It also runs `unittest` tests unchanged, so starting with `unittest` locks you into nothing.
:::

::: context argv-list A list goes straight to the program
A program receives its arguments as a numbered list of separate strings. With the list form, Python builds that list itself. With `shell=True`, Python hands one long string to `/bin/sh`, and the shell decides where one argument ends and the next begins.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">list form, path = "run 1.log"</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="10" y="30" width="60" height="26"/><rect x="70" y="30" width="40" height="26"/><rect x="110" y="30" width="70" height="26"/><rect x="180" y="30" width="80" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="47">grep</text><text x="90" y="47">-c</text><text x="145" y="47">ERROR</text><text x="220" y="47">run 1.log</text>
  </g>
  <text x="300" y="47" font-size="11" fill="#1d6fd1">4 args</text>
  <text x="10" y="90" font-size="12" fill="#1f2a44">shell=True, the shell splits the string</text>
  <g stroke="#1f2a44" fill="#f2b880">
    <rect x="10" y="100" width="60" height="26"/><rect x="70" y="100" width="40" height="26"/><rect x="110" y="100" width="70" height="26"/><rect x="180" y="100" width="45" height="26"/><rect x="225" y="100" width="45" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="117">grep</text><text x="90" y="117">-c</text><text x="145" y="117">ERROR</text><text x="202" y="117">run</text><text x="247" y="117">1.log</text>
  </g>
  <text x="300" y="117" font-size="11" fill="#b4232c">5 args</text>
</svg>
```

The space in the file name split it in two. That is lesson 03's word splitting, back again the moment a shell is involved.
:::

::: context shell-injection When a file name becomes a command
**Shell injection** means text you meant as data gets run as a command. Imagine a file on disk named `x; rm -rf ~`. The line `subprocess.run(f"grep -c ERROR {path}", shell=True)` hands the shell `grep -c ERROR x; rm -rf ~`. The shell sees the `;`, reads it as "then run this next", and deletes your home folder.

The list form passes the same name as one argument. `grep` looks for a file with that strange name, fails to find it, and nothing else happens. File names come from the outside world — uploads, other people's tools, a mistyped command — so treat them as data, always.
:::

::: context xargs-status What xargs's exit codes mean
GNU `xargs` sums up many runs in one status, so a script can tell what kind of trouble happened:

- 0 — every run succeeded;
- 123 — at least one run exited with a status from 1 to 125;
- 124 — a run exited with status 255, and `xargs` stopped;
- 125 — a run was killed by a signal;
- 126 — the command was found but could not be run;
- 127 — the command was not found.

So 123 says "some case failed", but not which. That is one more reason the per-case runner should write its own log.
:::

::: context big-rewrite The rewrite that sank a browser
In 2000 the programmer Joel Spolsky wrote a well-known essay, "Things You Should Never Do, Part I". His example was Netscape, whose team threw away their working web-browser code to start again from scratch, and spent years shipping no new major version while competitors moved on.

His point applies to a 400-line driver too. Old, ugly code is ugly partly because it is full of fixes for real problems somebody hit. A fresh rewrite forgets them all, and then has to rediscover them the hard way.
:::
