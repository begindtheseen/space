---
id: l04-substitution-arithmetic-and-arrays
title: Command substitution, arithmetic and arrays
minutes: 17
covers:
  - Command substitution $( ), arithmetic $(( )), arrays
---

A script that only runs fixed commands is a list. The three constructs in this lesson are what let it compute: `$( )` captures what a command printed, `$(( ))` does integer arithmetic, and arrays hold a list of values that survives having spaces in it.

Arrays are the part most people skip, and skipping them is why so many scripts build a command line by concatenating strings and then break on the first path with a space in it. An array is the only way bash has of saying "these are four separate arguments" and keeping that true through every later expansion.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21 on Ubuntu 24.04.4, mawk 1.3.4, bc 1.07.1 and Python 3.11.15. The helper `bin/args.sh` is the same four-line argument printer as the previous lesson.

## Command substitution: `$( )`

`$(command)` runs the command and replaces itself with what the command wrote to standard output.

```bash
n=$(wc -l < logs/run.log); echo "n=[$n]"
```

```text
n=[400]
```

The older spelling is backticks, `` n=`wc -l < logs/run.log` ``, and it produces the same result. Use `$( )`: it nests without escaping, and the difference is visible in a real line:

```bash
echo "nested: $(dirname "$(readlink -f logs/run.log)")"
```

```text
nested: /home/eng/work/logs
```

Two substitutions, each with its own quotes, and no backslashes. The backtick form would need `\`` inside `\``, which is unreadable at two levels and impossible at three.

Two properties matter.

**Trailing newlines are stripped — all of them.**

```bash
out=$(printf "a\nb\n\n\n"); echo "$out" | od -c | tail -2
```

```text
0000000   a  \n   b  \n
0000004
```

The command produced four newlines; the substitution kept the interior one and discarded the trailing three. That is usually what you want — `n=$(wc -l < f)` gives `400`, not `400\n` — and it is occasionally a problem, when you are capturing data whose trailing blank lines are meaningful. The idiom to preserve them is to append a sentinel and strip it: `out=$(cmd; echo x); out=${out%x}`.

**The result is still subject to word splitting unless you quote it.** This is the previous lesson's rule, and it bites hardest here because command output so often contains spaces and newlines:

```bash
files=$(ls logs); echo $files; echo "---"; echo "$files"
```

```text
driver.log run.log
---
driver.log
run.log
```

Unquoted, the newlines became argument separators and `echo` joined them with spaces. Quoted, the value arrives intact. Always `"$(…)"`.

And from lesson 02: the exit status of an assignment is the substitution's status, so `count=$(grep -c X f)` aborts under `set -e` when `grep` finds nothing — unless it is written `local`-style, in which case the status is silently lost.

## Arithmetic: `$(( ))`

`$((expression))` evaluates an **integer** expression and substitutes the result. Variables inside need no `$`.

```bash
echo "$((7/2))  $((7%2))  $((2**10))  $(( (3+4)*2 ))"
```

```text
3  1  1024  14
```

The operators are C's: `+ - * / %`, `**` for power, `<< >>`, `& | ^ ~`, `&& || !`, comparisons, `? :`, and the assignment forms `+=`, `++`, `--`. Comparisons yield 1 or 0:

```bash
i=5; echo "$((i+1))  $(( i > 3 ))  $(( i > 9 ))"
```

```text
6  1  0
```

`(( expression ))` is the *command* form. It evaluates the expression for its side effects and its exit status, which is where the trap is.

::: warning
**`(( ))` returns exit status 1 when the expression evaluates to zero**, because zero is false in C. Under `set -e` that kills the script, and the commonest way to hit it is a counter starting at zero:

```bash
i=0; (( i++ )); echo "i=$i status=$?"
```

```text
i=1 status=1
```

`i++` is post-increment: its *value* is the old `i`, which was 0, so the status is 1 — even though the variable was correctly incremented to 1. In a script:

```bash
bash -c 'set -e; i=0; (( i++ )); echo reached i=$i'
```

prints nothing and exits **1**. The `echo` is never reached.

Three ways out, in order of preference:

```bash
i=$((i+1))          # an assignment: status is 0
(( ++i ))           # pre-increment: value is the new i, so 1, so status 0
(( i++ )) || true   # say explicitly that you do not care
```

The first is the one to reach for by default, because it has no surprising status at all. Note that `(( ++i ))` only works because the new value happens to be non-zero — a counter decremented to zero would fail the same way.
:::

### There is no floating point

```bash
echo "$((10/3)) is not 3.333"
```

```text
3 is not 3.333
```

Integer division truncates, and bash has no float type at all. For anything with a decimal point, hand it to a program that has one:

```bash
awk 'BEGIN{printf "%.4f\n", 10/3}'
echo "scale=4; 10/3" | bc
python3 -c "print(f'{10/3:.4f}')"
```

```text
3.3333
```

```text
3.3333
```

```text
3.3333
```

`awk` is usually the right choice inside a pipeline, since it is already there; `bc` needs `scale` set or it truncates too; `python3` is the one to use when the arithmetic is more than one expression — and when you find yourself reaching for it repeatedly, lesson 14 argues that the script should have been Python in the first place.

C-style `for` uses the same arithmetic context:

```bash
for ((i=1; i<=3; i++)); do printf "case_%03d " "$i"; done; echo
```

```text
case_001 case_002 case_003
```

## Arrays

An array is created with parentheses and indexed from zero.

```bash
cases=(alpha "two words" gamma); declare -p cases
```

```text
declare -a cases=([0]="alpha" [1]="two words" [2]="gamma")
```

```bash
echo "${cases[0]} | ${cases[1]} | ${cases[2]}"
```

```text
alpha | two words | gamma
```

The braces are compulsory: `$cases[1]` is the string `$cases` followed by `[1]`, and `$cases` alone is element 0.

```bash
echo "count=${#cases[@]}  length-of-element-1=${#cases[1]}"
echo "indices: ${!cases[@]}"
```

```text
count=3  length-of-element-1=9
indices: 0 1 2
```

`${#arr[@]}` is the number of elements; `${#arr[1]}` is the *length of element 1* — the same syntax means two things depending on the subscript. `${!arr[@]}` gives the indices, which matters because bash arrays are sparse: deleting an element leaves a hole.

```bash
cases+=(delta); declare -p cases
echo "slice: ${cases[*]:1:2}"
unset "cases[1]"; declare -p cases; echo "count=${#cases[@]}"
```

```text
declare -a cases=([0]="alpha" [1]="two words" [2]="gamma" [3]="delta")
```

```text
slice: two words gamma
```

```text
declare -a cases=([0]="alpha" [2]="gamma" [3]="delta")
count=3
```

After `unset` the indices are 0, 2, 3 — there is no index 1 — while the count is 3. So `for ((i=0; i<${#a[@]}; i++))` is **wrong** on a sparse array and `for x in "${a[@]}"` is right; if you need indices, iterate over `"${!a[@]}"`.

### `"${arr[@]}"` versus `"${arr[*]}"`

This is the rule to memorise, and the argument printer makes it concrete.

```bash
./bin/args.sh "${cases[@]}"
```

```text
argc=3
  [1] <alpha>
  [2] <two words>
  [3] <gamma>
```

```bash
./bin/args.sh "${cases[*]}"
```

```text
argc=1
  [1] <alpha two words gamma>
```

```bash
./bin/args.sh ${cases[@]}
```

```text
argc=4
  [1] <alpha>
  [2] <two>
  [3] <words>
  [4] <gamma>
```

**`"${arr[@]}"` expands to one word per element, boundaries preserved.** `"${arr[*]}"` joins everything into a single word separated by the first character of `IFS`. Unquoted `${arr[@]}` expands per element and then word-splits each one, which is how three elements became four arguments.

`"$@"` and `"$*"` behave exactly the same way for a script's own arguments, which lesson 08 takes up.

::: example Building an argument list that survives a space
The wrong way is to build a string:

```bash
flags="--seed 42 --out entry burn 01/case.csv"
./sim $flags
```

which delivers six arguments and a program that writes to a file called `entry`. The right way is an array, where each element is one argument by construction:

```bash
flags=(--seed 42 --out "entry burn 01/case.csv")
./bin/args.sh "${flags[@]}"
```

```text
argc=4
  [1] <--seed>
  [2] <42>
  [3] <--out>
  [4] <entry burn 01/case.csv>
```

Four arguments, the fourth containing two spaces, delivered intact. This is the pattern for building a command line conditionally:

```bash
args=(--config "$cfg")
[[ -n "${VERBOSE:-}" ]] && args+=(--verbose)
[[ -n "${SEED:-}" ]]    && args+=(--seed "$SEED")
./sim "${args[@]}"
```

An empty array is safe too, even under `set -u`: `"${empty[@]}"` expands to zero words rather than to an error, so a command with no optional flags is simply a command with no optional flags.

```text
argc=0
```
:::

### Filling an array from data

Three ways, and the choice depends on where the data comes from.

**From a glob** — one element per match, spaces and all:

```bash
dirs=(runs/*); declare -p dirs
```

```text
declare -a dirs=([0]="runs/baseline" [1]="runs/entry burn 01")
```

**From a command's output, one element per line** — `mapfile` (also spelled `readarray`), with `-t` to strip the newlines:

```bash
mapfile -t chans < <(awk -F'[= ]' '{print $4}' logs/run.log | sort -u); declare -p chans
```

```text
declare -a chans=([0]="BUS_VOLTS" [1]="GYRO_X_DPS" [2]="TANK_PSI" [3]="WHEEL_RPM")
```

The four telemetry channel names in the log, one per element, with no word splitting anywhere. Note `< <(…)` — process substitution from the previous module, used here because `cmd | mapfile` would run `mapfile` in a subshell and lose the array.

**From one line, split on `IFS`** — `read -a`:

```bash
read -r -a fields <<< "t=0.5 chan=WHEEL_RPM val=4187.0"; declare -p fields
```

```text
declare -a fields=([0]="t=0.5" [1]="chan=WHEEL_RPM" [2]="val=4187.0")
```

`-r` stops backslashes being interpreted and belongs on every `read` you ever write.

### Associative arrays

`declare -A` gives a map with string keys — bash 4 and later, which excludes the bash 3.2 that ships with macOS.

```bash
declare -A seen
seen[WHEEL_RPM]=3; seen[TANK_PSI]=7
for k in "${!seen[@]}"; do echo "$k -> ${seen[$k]}"; done
```

```text
TANK_PSI -> 7
WHEEL_RPM -> 3
```

The order is the hash order, not insertion order — pipe through `sort` if you need it deterministic. To test membership without adding the key, use the `+` form from lesson 02:

```bash
declare -A seen; seen[a]=1
echo "has a? ${seen[a]+yes}"
echo "has z? ${seen[z]+yes}"
```

```text
has a? yes
has z?
```

Counting occurrences is the common use — and note that `(( count[$chan]++ ))` would return 1 the first time each counter goes from zero, so the arithmetic-assignment form is safer.

::: example Per-channel statistics with two associative arrays
A telemetry log of interleaved channels:

```text
t=0.5 chan=WHEEL_RPM val=4187.0
t=1.0 chan=BUS_VOLTS val=27.9
t=1.5 chan=GYRO_X_DPS val=-0.1
t=2.0 chan=TANK_PSI val=314.2
```

Counting and averaging per channel needs a map from channel name to a running count and a running sum. Bash has the map; it does not have the floating point, so the addition is handed to `awk`:

```bash
#!/usr/bin/env bash
set -euo pipefail

declare -A count sum

while IFS= read -r line; do
  chan=${line#*chan=}; chan=${chan%% *}
  val=${line##*val=}
  count[$chan]=$(( ${count[$chan]:-0} + 1 ))
  sum[$chan]=$(awk -v a="${sum[$chan]:-0}" -v b="$val" 'BEGIN{printf "%.3f", a+b}')
done < "$1"

for chan in "${!count[@]}"; do
  n=${count[$chan]}
  mean=$(awk -v s="${sum[$chan]}" -v n="$n" 'BEGIN{printf "%.3f", s/n}')
  printf '%-12s n=%-4d mean=%s
' "$chan" "$n" "$mean"
done | sort
```

```text
BUS_VOLTS    n=100  mean=27.990
GYRO_X_DPS   n=100  mean=0.154
TANK_PSI     n=100  mean=310.664
WHEEL_RPM    n=100  mean=4208.206
```

Four things in it are worth naming. `IFS= read -r line` reads a whole line untouched — `IFS=` stops leading and trailing whitespace being stripped, `-r` stops backslashes being eaten. `${line#*chan=}` and `${chan%% *}` are parameter expansions that trim a prefix and a suffix, which is faster than calling `cut` four hundred times. `${count[$chan]:-0}` supplies a zero for a key seen for the first time, which is what keeps `set -u` happy. And the whole thing passes `shellcheck` with no warnings.

It is also, honestly, at the edge of what bash should be doing. Four hundred lines means four hundred `awk` processes for the sums; the same job as a single `awk` program is one process and about four lines, which lesson 10 writes. Use bash to decide *which* programs run, and a real language to do arithmetic in a loop.
:::

::: key
`$(cmd)` substitutes the command's stdout with all trailing newlines stripped, and must be quoted. `$((expr))` is integer-only; `(( expr ))` as a command returns status 1 when the expression is zero, which kills `i=0; (( i++ ))` under `set -e` — write `i=$((i+1))`. `"${arr[@]}"` is one word per element; `"${arr[*]}"` is a single joined word; unquoted is neither. Fill arrays with a glob, `mapfile -t < <(cmd)` or `read -r -a`.
:::

## Check yourself

::: check
`count=$(wc -l < "$f")` then `if [[ $count -gt 100 ]]` works, but `count=$(wc -l "$f")` then the same test fails with a syntax error. Why?
:::

::: answer
`wc -l < "$f"` redirects the file into `wc`'s standard input, so `wc` has no filename to print and its output is just the number: `400`. `wc -l "$f"` passes the filename as an argument, and `wc` then prints the count *and the name*: `400 logs/run.log`.

So in the second case `count` holds two words. `[[ $count -gt 100 ]]` — with `$count` unquoted inside `[[ ]]`, where word splitting does not occur but the arithmetic comparison still parses the whole string — sees `400 logs/run.log` where it expected an integer, and reports a syntax error in the expression.

The fix is either the redirect form, or to take only the first field: `count=$(wc -l < "$f")` is the idiom precisely because it avoids the filename. The general lesson is that many tools change their output format when given a filename rather than a stream — `wc`, `grep -c`, `md5sum` — so a capture that works on one file breaks on several.
:::

::: check
Why does `i=0; (( i++ ))` end a script that has `set -e`, and give three ways to write the increment safely?
:::

::: answer
`(( ))` is a command, and its exit status is 0 when the expression evaluates to a non-zero value and 1 when it evaluates to zero — following C's convention that zero is false. `i++` is *post*-increment, so the expression's value is the old `i`, which is 0. The variable is correctly incremented to 1, and the command still reports status 1, and `set -e` ends the script.

Three safe forms. `i=$((i+1))` is an assignment, whose status is 0 regardless of the value — the default choice. `(( ++i ))` uses pre-increment so the expression's value is the *new* `i`, which is 1 here; note this only helps while the result is non-zero, so a decrement reaching zero would fail again. And `(( i++ )) || true` states explicitly that the status is not meaningful.

The same trap catches `(( count[$k]++ ))` in a counting loop, which fails on the first occurrence of every key. It is worth grepping a codebase for `(( ` after adding `set -e` to a script that did not have it.
:::

::: check
Explain the three results of passing `"${a[@]}"`, `"${a[*]}"` and `${a[@]}` to a command, for `a=(alpha "two words" gamma)`.
:::

::: answer
`"${a[@]}"` expands to one word per element, with each element's internal spaces preserved: three arguments, `alpha`, `two words`, `gamma`. The quotes are inside the expansion's semantics, not around the whole thing — bash treats this form specially.

`"${a[*]}"` joins all elements into a single string, separated by the first character of `IFS` (a space by default): one argument, `alpha two words gamma`. Useful for building a message to print; wrong for passing arguments, because the boundaries are gone.

`${a[@]}` unquoted expands per element and then subjects each result to word splitting and globbing: four arguments, because `two words` splits. It combines the worst of both, and there is no situation where it is what you want.

The same three forms apply to a script's own arguments as `"$@"`, `"$*"` and `$@`. Forwarding arguments is always `"$@"`.
:::

::: check
You need an array of every case id that reported a failure, taken from a log. Compare `ids=$(grep FAIL log | cut -d= -f2)` with `mapfile -t ids < <(grep FAIL log | cut -d= -f2)`.
:::

::: answer
The first produces a *string* containing newlines, not an array. Using it as `"$ids"` gives one multi-line value; using it as `$ids` word-splits on `IFS` and then glob-expands, which happens to produce the right list for well-behaved ids and silently breaks on any value containing a space, a `*` or a `[`. `${#ids}` would give the string's character count, not a number of items.

`mapfile -t ids < <(…)` produces a real array: one element per line of output, `-t` stripping the trailing newline from each. `"${ids[@]}"` then expands to one argument per id, `${#ids[@]}` is the count, and `"${ids[0]}"` is the first — all correct whatever the values contain.

Two details. The process substitution `< <(…)` is needed because `cmd | mapfile -t ids` runs `mapfile` in a subshell, so the array exists only inside the pipeline and is empty afterwards — a genuinely confusing failure. And `mapfile` splits on newlines only, so a value containing a newline would still split; `mapfile -d ''` with a NUL-separated producer handles even that.
:::

::: check
A script computes a mean with `mean=$(( total / n ))` and reports 3 where the answer is 3.75. What happened, and what are two fixes?
:::

::: answer
`$(( ))` is integer arithmetic. There is no float type in bash at all, so `15 / 4` is 3 — truncated toward zero, not rounded, so the error is always downward for positive values and can be arbitrarily large in relative terms when `n` is close to `total`.

Fix one: do the arithmetic in a program that has floats. `awk "BEGIN{printf \"%.3f\n\", $total/$n}"` inside a pipeline, `echo "scale=3; $total/$n" | bc` — remembering that `bc` also truncates unless `scale` is set — or `python3 -c` for anything longer than one expression.

Fix two: scale up and stay in integers, which is right when you want a fixed number of decimal places and no dependency: `printf '%d.%02d\n' $((total*100/n/100)) $((total*100/n%100))`. It is fiddly, and worth it only in a context where you cannot rely on `awk`.

The deeper answer is the one lesson 14 makes: arithmetic on measurements is a signal that the logic belongs in Python. Bash should be deciding which programs to run, not computing statistics.
:::

## Summary

| Construct | Meaning | Note |
| --- | --- | --- |
| `$(cmd)` | substitute the command's stdout | nests cleanly; prefer to backticks |
| trailing newlines | all stripped by the substitution | `out=$(cmd; echo x); out=${out%x}` preserves them |
| `"$(cmd)"` | quote it, always | unquoted output is split and globbed |
| `$((expr))` | integer arithmetic; no `$` needed inside | truncating division, no floats |
| `(( expr ))` | arithmetic as a command | **status 1 when the value is 0** |
| `i=$((i+1))` | the safe increment | `(( i++ ))` under `set -e` kills the script |
| `for ((i=1; i<=n; i++))` | C-style loop | the same arithmetic context |
| `awk`, `bc`, `python3` | floating point | `bc` needs `scale=`; `awk` is already in the pipeline |
| `a=(x "y z")`, `a+=(w)` | create, append | `${a[0]}` is also plain `$a` |
| `${#a[@]}` vs `${#a[1]}` | element count vs length of element 1 | same syntax, different question |
| `${!a[@]}` | the indices | arrays are sparse after `unset` |
| `"${a[@]}"` | one word per element | the form for passing arguments |
| `"${a[*]}"` | one word, joined by `$IFS`'s first character | for printing, not for arguments |
| `a=(runs/*)` | one element per glob match | spaces and all |
| `mapfile -t a < <(cmd)` | one element per output line | a pipe would put `mapfile` in a subshell |
| `read -r -a f <<< "$line"` | split one line into an array | `-r` on every `read` |
| `declare -A m` | associative array, bash 4+ | `${m[k]+yes}` tests membership |

Lesson 05 puts these to work in control flow: `if`, `for`, `while` and `case`, and the difference between `[ ]` and `[[ ]]` that decides whether your tests need quoting.
