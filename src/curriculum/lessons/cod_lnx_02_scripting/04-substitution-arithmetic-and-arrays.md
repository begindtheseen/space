---
id: l04-substitution-arithmetic-and-arrays
title: Command substitution, arithmetic and arrays
minutes: 22
covers:
  - Command substitution $( ), arithmetic $(( )), arrays
---

A script that only runs fixed commands is a to-do list: it does the same thing whatever it finds. This lesson gives it three new powers.

- **Asking a question and keeping the answer.** `$( )` runs a command and hands you what it printed, so you can store it in a variable.
- **Counting.** `$(( ))` does whole-number arithmetic: case numbers, loop counters, how many runs failed.
- **Keeping a list.** An **array** holds several values in numbered slots, and it keeps each value whole even when it has spaces in it.

Arrays are the part most people skip, and that is why so many scripts glue a command line together as one long string and then break on the first path with a space in it. An array is the only way bash has of saying "these are four separate arguments" and keeping that true. In ground-station work, that is the difference between a sweep driver that runs the case you asked for and one that quietly writes its results to a file called `entry`.

Every output below is real, pasted from a run with GNU bash 5.2.21 on Ubuntu 24.04, awk (mawk 1.3.4), bc 1.07.1 and Python 3.11. The file `logs/run.log` is a small telemetry log: 400 lines, four channels interleaved, one reading per line. The helper `bin/args.sh` is the argument printer from lesson 03 — it shows how many arguments it received and puts each one in angle brackets.

## Command substitution: `$( )`

Think of asking a colleague "how many lines are in that log?" and writing their answer into your notebook. **Command substitution** does exactly that. `$(command)` — read it aloud as "dollar paren" — runs the command and is replaced by whatever the command wrote to standard output.

```bash
n=$(wc -l < logs/run.log); echo "n=[$n]"
```

```text
n=[400]
```

`wc -l` counted the lines, and its answer became the value of `n`. The square brackets in the `echo` are there only so you can see exactly where the value starts and stops.

There is an older spelling with **[[backticks|backtick-history]]**, `` n=`wc -l < logs/run.log` ``, and it gives the same result. Use `$( )` anyway. It nests — one substitution inside another — with no extra escaping:

```bash
echo "parent: $(basename "$(dirname "$(readlink -f logs/run.log)")")"
```

```text
parent: logs
```

Read it from the inside out: `readlink -f` made a full path, `dirname` cut off the file name, `basename` kept the last directory name. Three substitutions, each with its own quotes, and not one backslash. With backticks, every inner level needs escaping as `` \` ``, which is hard to read at two levels and worse at three.

Two properties of `$( )` matter every day.

### Trailing newlines are removed — all of them

```bash
out=$(printf "a\nb\n\n\n"); printf '%s' "$out" | od -c
```

```text
0000000   a  \n   b
0000003
```

The command printed six bytes: `a`, newline, `b`, and three more newlines. The substitution kept the newline in the middle and threw away **[[every newline at the end|trailing-newlines]]**. (`od -c` prints each byte as a character, and `\n` is how it shows a newline; the numbers on the left count bytes, in octal.)

This is almost always what you want: `n=$(wc -l < f)` gives `400`, not `400` and a newline. When trailing blank lines in the data do mean something, add a marker character after the output and trim it off afterwards:

```bash
out=$(printf "a\nb\n\n\n"; echo x); out=${out%x}; printf '%s' "$out" | od -c
```

```text
0000000   a  \n   b  \n  \n  \n
0000006
```

All six bytes survived. The newlines were no longer at the end — the `x` was — so nothing was stripped. Then `${out%x}` (from lesson 03: remove the shortest match of `x` from the end) took the marker away.

### The result still gets split unless you quote it

This is lesson 03's rule again, and it bites hardest here, because command output is full of spaces and newlines:

```bash
files=$(ls logs); echo $files; echo "---"; echo "$files"
```

```text
driver.log run.log
---
driver.log
run.log
```

Unquoted, the newline between the two names became an argument separator, and `echo` joined the two arguments with a space. Quoted, the value arrived exactly as `ls` wrote it. So the habit is: always `"$(…)"`.

### The assignment carries the command's status

One more fact from lesson 02 belongs here. When a line is only an assignment, its **exit status** — the success-or-failure number, 0 for success — is the status of the substitution inside it. So under `set -e` this line ends the script when `grep` finds nothing, because `grep` exits 1 for "no match":

```bash
bash -c 'set -e; c=$(grep -c NOPE logs/run.log); echo "reached c=$c"'; echo "exit=$?"
```

```text
exit=1
```

Put the same capture on a `local` line inside a function and the failure disappears, because the line's status becomes `local`'s own, which is 0:

```bash
bash -c 'set -e; f(){ local c=$(grep -c NOPE logs/run.log); echo "reached c=$c"; }; f'
```

```text
reached c=0
```

Lesson 06 comes back to this and shows the fix.

## Arithmetic: `$(( ))`

Picture a calculator with no decimal-point key. It adds, subtracts, multiplies and divides, but only in whole numbers. That is bash arithmetic.

`$((expression))` — "dollar double paren" — works out an **[[integer|bash-integers]]** (whole-number) expression and puts the result in its place. Inside it, variables do not need a `$`.

```bash
echo "$((7/2))  $((7%2))  $((2**10))  $(( (3+4)*2 ))"
```

```text
3  1  1024  14
```

Seven divided by two is 3, remainder thrown away. `%` is the remainder, "modulo": 7 is 3 twos plus 1. `**` is a power. Parentheses group, as in ordinary math.

The operators are the ones from the C language: `+ - * / %`, `**` for power, `<< >>` for shifting bits, `& | ^ ~` for bitwise work, `&& || !` for logic, comparisons, `? :` for "if-then-else" in one expression, and the update forms `+=`, `++`, `--`. A comparison gives 1 for true and 0 for false:

```bash
i=5; echo "$((i+1))  $(( i > 3 ))  $(( i > 9 ))"
```

```text
6  1  0
```

### The command form `(( ))` and its trap

Without the leading `$`, `(( expression ))` is a **command**. It does the arithmetic for its side effects — changing a variable — and returns an exit status. That status follows C's rule, where **[[zero means false|zero-is-false]]**: status 0 (success) when the value is non-zero, status 1 (failure) when the value is zero. That is where the trap lives.

::: warning A counter that starts at zero
**`(( ))` returns exit status 1 when the expression's value is zero.** Under `set -e` that ends the script. The commonest way to hit it is a counter starting at zero:

```bash
i=0; (( i++ )); echo "i=$i status=$?"
```

```text
i=1 status=1
```

`i++` is **post-increment**: add one to `i`, but give back the *old* value. The old value was 0, so the status is 1 — even though `i` really did become 1. Inside a script:

```bash
bash -c 'set -e; i=0; (( i++ )); echo reached i=$i'; echo "exit=$?"
```

```text
exit=1
```

The `echo` is never reached. Three ways out, best first:

```bash
i=$((i+1))          # an assignment: status is 0
(( ++i ))           # pre-increment: value is the new i, so 1, so status 0
(( i++ )) || true   # say explicitly that you do not care
```

Reach for the first by default: it has no surprising status at all. The second works only while the new value is non-zero; a counter counting *down* to zero fails the same way.
:::

### There is no floating point

```bash
echo "$((10/3)) is not 3.333"
```

```text
3 is not 3.333
```

Integer division throws away everything after the decimal point. It cuts toward zero rather than rounding: `$(( -7/2 ))` is `-3`, not `-4`. Bash has no decimal type at all. For anything with a decimal point, hand the sum to a program that has one:

```bash
awk 'BEGIN{printf "%.4f\n", 10/3}'
echo "scale=4; 10/3" | bc
python3 -c "print(f'{10/3:.4f}')"
```

```text
3.3333
3.3333
3.3333
```

`awk` is usually the right choice inside a pipeline, because it is already there. `bc` needs **[[scale|bc-scale]]** set, or it cuts off the decimals too: `echo "10/3" | bc` prints `3`. `python3` is the one to use when the sum is more than one expression — and when you find yourself reaching for it again and again, lesson 14 argues the script should have been Python from the start.

The C-style `for` loop uses the same arithmetic world:

```bash
for ((i=1; i<=3; i++)); do printf "case_%03d " "$i"; done; echo
```

```text
case_001 case_002 case_003
```

Read it as "start `i` at 1; keep going while `i` is at most 3; add one each time". The `i++` here is safe, because it is part of the loop header, not a command whose status is checked. `%03d` pads the number to three digits with zeros.

## Arrays

Picture a row of numbered mailboxes. Each box holds one thing, and you find it by its number. That row is an **array**. In bash the numbers — the **indices** — start at 0, not 1.

You make an array with parentheses. Each word inside is one element, and quotes keep a value with spaces together:

```bash
cases=(alpha "two words" gamma); declare -p cases
```

```text
declare -a cases=([0]="alpha" [1]="two words" [2]="gamma")
```

`declare -p` prints a variable exactly as bash holds it. Three elements, and the middle one kept its space.

```bash
echo "${cases[0]} | ${cases[1]} | ${cases[2]}"
```

```text
alpha | two words | gamma
```

The curly braces are compulsory. Without them, bash reads `$cases` and then the plain text `[1]`, and `$cases` on its own means element 0:

```bash
echo "$cases[1]"
```

```text
alpha[1]
```

Three more questions you can ask an array:

```bash
echo "count=${#cases[@]}  length-of-element-1=${#cases[1]}"
echo "indices: ${!cases[@]}"
```

```text
count=3  length-of-element-1=9
indices: 0 1 2
```

`${#cases[@]}` is the number of elements. `${#cases[1]}` is the *length of element 1* — "two words" is nine characters. The same `#` asks two different questions depending on what is in the brackets. `${!cases[@]}` — the `!` reads as "the names of" — lists the indices.

You need the indices because bash arrays can have **[[holes|sparse-array]]** in them:

```bash
cases+=(delta); declare -p cases
echo "slice: ${cases[*]:1:2}"
unset "cases[1]"; declare -p cases; echo "count=${#cases[@]}"
```

```text
declare -a cases=([0]="alpha" [1]="two words" [2]="gamma" [3]="delta")
slice: two words gamma
declare -a cases=([0]="alpha" [2]="gamma" [3]="delta")
count=3
```

`+=( )` appends. `${cases[*]:1:2}` is a **slice**: from element 1, take 2. `unset` removes one element and leaves a hole: the indices are now 0, 2 and 3, and the count is 3.

So a loop like `for ((i=0; i<${#a[@]}; i++))` is **wrong** for an array that has had elements removed: it visits index 1, which is empty, and never reaches index 3. Loop over the values with `for x in "${a[@]}"`, and if you need the indices, loop over `"${!a[@]}"`.

### `"${arr[@]}"` versus `"${arr[*]}"`

This is the rule to learn by heart. The argument printer makes it concrete, with `cases` reset to `(alpha "two words" gamma)`:

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

Three spellings, [[three different answers|three-expansions]]:

- `"${arr[@]}"` — "at", quoted — gives **one word per element**, boundaries kept. This is the form for passing arguments.
- `"${arr[*]}"` — "star", quoted — **joins everything into one word**, with the first character of `IFS` — lesson 03's list of separator characters — between elements. That is a space unless you changed `IFS`. Good for a message to print; wrong for arguments.
- `${arr[@]}` unquoted gives one word per element and then word-splits each one, which is how three elements turned into four arguments. There is no situation where you want this.

A script's own arguments, `"$@"` and `"$*"`, behave exactly the same way. Lesson 08 takes that up.

::: example Building an argument list that survives a space
Suppose a sweep driver needs to hand `./sim` four arguments, and the output path has spaces in it. The tempting way is to build one string:

```bash
flags="--seed 42 --out entry burn 01/case.csv"
./bin/args.sh $flags
```

```text
argc=6
  [1] <--seed>
  [2] <42>
  [3] <--out>
  [4] <entry>
  [5] <burn>
  [6] <01/case.csv>
```

Six arguments, not four. A real simulator would take `entry` as the output file and then choke on `burn`. Quoting `"$flags"` does not help either — that makes one argument, which is also wrong.

The right way is an array, where each element is one argument by construction:

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

Four arguments, and the fourth kept both of its spaces. Count them against what you meant: `--seed`, `42`, `--out`, the path. Four. That checks out.

This is also the pattern for building a command line bit by bit, adding a flag only when it applies:

```bash
args=(--config "$cfg")
[[ -n "${VERBOSE:-}" ]] && args+=(--verbose)
[[ -n "${SEED:-}" ]]    && args+=(--seed "$SEED")
./sim "${args[@]}"
```

An empty array is safe too, even under **[[set -u|empty-array-set-u]]**. `"${empty[@]}"` turns into zero words rather than an error:

```bash
bash -c 'set -u; empty=(); ./bin/args.sh "${empty[@]}"'
```

```text
argc=0
```

A command with no optional flags then gets no optional flags, which is exactly right.
:::

### Filling an array from data

There are three ways, and which one you pick depends on where the values come from.

**From a glob** — one element per matching path, spaces and all:

```bash
dirs=(runs/*); declare -p dirs
```

```text
declare -a dirs=([0]="runs/baseline" [1]="runs/entry burn 01")
```

**From a command's output, one element per line** — use `mapfile` (also spelled `readarray`), with `-t` to trim the newline off each line:

```bash
mapfile -t chans < <(awk -F'[= ]' '{print $4}' logs/run.log | sort -u); declare -p chans
```

```text
declare -a chans=([0]="BUS_VOLTS" [1]="GYRO_X_DPS" [2]="TANK_PSI" [3]="WHEEL_RPM")
```

Those are the four telemetry channel names in the log, one per element, with no word splitting anywhere. The `< <(…)` is process substitution, from the previous module: it lets `mapfile` read the pipeline's output while `mapfile` itself stays in the current shell. Piping into it instead does not work, because the right-hand side of a pipe runs in a **[[subshell|mapfile-subshell]]** — a copy of the shell that vanishes when the pipe finishes:

```bash
awk -F'[= ]' '{print $4}' logs/run.log | mapfile -t lost; declare -p lost
```

```text
bash: declare: lost: not found
```

The array was filled, inside the copy, and then thrown away with it.

**From one line, split on `IFS`** — use `read -a`:

```bash
read -r -a fields <<< "t=0.5 chan=WHEEL_RPM val=4187.0"; declare -p fields
```

```text
declare -a fields=([0]="t=0.5" [1]="chan=WHEEL_RPM" [2]="val=4187.0")
```

`<<<` feeds a string to the command's input (a here-string). `-r` stops `read` from treating backslashes as special, and it belongs on every `read` you ever write.

### Associative arrays

An ordinary array is numbered mailboxes. An **associative array** is a row of labeled mailboxes: the labels, called **keys**, are strings. You make one with `declare -A`. It needs bash 4 or later, which rules out the **[[bash 3.2 that ships with macOS|macos-bash]]**.

```bash
declare -A seen
seen[WHEEL_RPM]=3; seen[TANK_PSI]=7
for k in "${!seen[@]}"; do echo "$k -> ${seen[$k]}"; done
```

```text
TANK_PSI -> 7
WHEEL_RPM -> 3
```

The keys come out in **[[hash order|hash-order]]**, not the order you added them. Pipe through `sort` when you need a steady order.

To ask "is this key there?" without creating it, use the `+` form from lesson 03 — `${var+word}` gives `word` only if `var` is set:

```bash
declare -A seen; seen[a]=1
echo "has a? ${seen[a]+yes}"
echo "has z? ${seen[z]+yes}"
```

```text
has a? yes
has z?
```

Counting how often each value appears is the everyday use. Watch the arithmetic trap again: `(( count[$chan]++ ))` has value 0 the first time each key is counted, so under `set -e` it ends the script on the very first line of input. Use the assignment form.

::: example Per-channel statistics with two associative arrays
The log interleaves four channels:

```text
t=0.5 chan=WHEEL_RPM val=4187.0
t=1.0 chan=BUS_VOLTS val=27.9
t=1.5 chan=GYRO_X_DPS val=-0.1
t=2.0 chan=TANK_PSI val=314.2
```

You want, for each channel, how many readings there are and their average. That needs a map from channel name to a running count, and another from channel name to a running sum. Bash has the maps. It does not have decimals, so each addition is handed to `awk`:

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
  printf '%-12s n=%-4d mean=%s\n' "$chan" "$n" "$mean"
done | sort
```

```text
BUS_VOLTS    n=100  mean=28.017
GYRO_X_DPS   n=100  mean=0.164
TANK_PSI     n=100  mean=310.332
WHEEL_RPM    n=100  mean=4208.751
```

Walk through one line of input, `t=1.0 chan=BUS_VOLTS val=27.9`:

1. `IFS= read -r line` reads the whole line untouched. `IFS=` stops spaces at the start and end being trimmed; `-r` stops backslashes being eaten.
2. `${line#*chan=}` cuts everything up to and including `chan=`, leaving `BUS_VOLTS val=27.9`. Then `${chan%% *}` cuts from the first space to the end, leaving `BUS_VOLTS`.
3. `${line##*val=}` cuts everything up to the last `val=`, leaving `27.9`.
4. `${count[$chan]:-0}` gives 0 for a channel seen for the first time, which keeps `set -u` happy. Add 1.
5. `awk` adds `27.9` to the running sum and prints it with three decimals.

Sanity check: 400 lines over 4 channels is 100 readings each, and every count says `n=100`. A 28-volt bus averaging 28.017 V looks like the data. The script also passes `shellcheck` with no warnings.

It is, honestly, at the edge of what bash should do. Four hundred input lines means four hundred `awk` processes, one per addition; a single `awk` program would make one pass in one process, as lesson 10 shows. Use bash to decide *which* programs run, and a language with real arithmetic to do the arithmetic.
:::

::: key
`$(cmd)` substitutes the command's stdout with all trailing newlines stripped, and must be quoted: `"$(cmd)"`. `$((expr))` is integer-only. `(( expr ))` as a command returns status 1 when the expression is zero, which kills `i=0; (( i++ ))` under `set -e` — write `i=$((i+1))`. `"${arr[@]}"` is one word per element; `"${arr[*]}"` is a single joined word; unquoted is neither. Fill arrays with a glob, `mapfile -t arr < <(cmd)` or `read -r -a arr`.
:::

## Check yourself

::: check
`count=$(wc -l < "$f")` followed by `if [[ $count -gt 100 ]]` works. But `count=$(wc -l "$f")` followed by the same test fails with a syntax error. Why?
:::

::: answer
With `wc -l < "$f"`, the shell feeds the file into `wc`'s standard input. `wc` never learns the file's name, so it prints only the number: `400`.

With `wc -l "$f"`, the file name is an argument, and `wc` prints the count *and the name*: `400 logs/run.log`. So `count` now holds two words.

Inside `[[ ]]` there is no word splitting, so `-gt` receives the whole string `400 logs/run.log` and tries to read it as an arithmetic expression. It cannot, and bash says so:

```text
bash: [[: 400 logs/run.log: syntax error in expression (error token is "logs/run.log")
```

The fix is the redirect form, which is the standard idiom exactly because it avoids the name. Many tools change their output when given a file name instead of a stream — `wc`, `grep -c` with several files, `md5sum` — so a capture that works one way breaks the other.
:::

::: check
Why does `i=0; (( i++ ))` end a script that has `set -e`? Give three safe ways to write the increment.
:::

::: answer
`(( ))` is a command, and its exit status is 0 when the expression's value is non-zero and 1 when the value is zero — C's rule that zero is false. `i++` is post-increment, so the expression's value is the *old* `i`, which is 0. The variable does become 1, but the command reports status 1, and `set -e` ends the script.

Three safe forms:

1. `i=$((i+1))` — an assignment, whose status is 0 whatever the value. The default choice.
2. `(( ++i ))` — pre-increment, so the value is the *new* `i`, here 1. This only helps while the result is non-zero; a counter decremented to zero fails again.
3. `(( i++ )) || true` — says outright that the status does not matter.

The same trap catches `(( count[$k]++ ))` in a counting loop, on the first appearance of every key.
:::

::: check
For `a=(alpha "two words" gamma)`, explain what a command receives from `"${a[@]}"`, from `"${a[*]}"` and from `${a[@]}`.
:::

::: answer
`"${a[@]}"` gives one word per element, inner spaces kept: three arguments, `alpha`, `two words`, `gamma`. Bash treats this quoted form specially — the quotes protect each element separately.

`"${a[*]}"` joins all the elements into one string, with the first character of `IFS` (a space by default) between them: one argument, `alpha two words gamma`. Fine for building a message; wrong for passing arguments, because the boundaries are gone.

`${a[@]}` unquoted gives one word per element and then word-splits and glob-expands each one: four arguments, because `two words` splits in two. It is never what you want.

A script's own arguments work the same way as `"$@"`, `"$*"` and `$@`. Forwarding arguments is always `"$@"`.
:::

::: check
You need an array of every case id that reported a failure in a log. Compare `ids=$(grep FAIL log | cut -d= -f2)` with `mapfile -t ids < <(grep FAIL log | cut -d= -f2)`.
:::

::: answer
The first makes a *string* with newlines in it, not an array. Used as `"$ids"`, it is one multi-line value. Used as `$ids`, it is word-split and glob-expanded — right for tidy ids, silently wrong for any value containing a space, a `*` or a `[`. And `${#ids}` counts characters, not items.

`mapfile -t ids < <(…)` makes a real array: one element per line of output, with `-t` trimming each line's newline. Then `"${ids[@]}"` is one argument per id, `${#ids[@]}` is the count, and `"${ids[0]}"` is the first — all correct whatever the values contain.

Two details. The `< <(…)` is needed because `… | mapfile -t ids` runs `mapfile` in a subshell, and the array is gone afterwards. And `mapfile` splits only on newlines, so a value that itself contains a newline would still split; `mapfile -d ''` reading NUL-separated input handles even that.
:::

::: check
A script computes a mean with `mean=$(( total / n ))` and reports 3 when the right answer is 3.75. What happened, and what are two fixes?
:::

::: answer
`$(( ))` is integer arithmetic, and bash has no decimal type at all. With `total=15` and `n=4`, `15 / 4` is 3: the fraction is cut off, not rounded. For positive values the error is always downward, and it can be large compared with the answer when the answer is small.

Fix one: do the sum in a program that has decimals.

```bash
awk "BEGIN{printf \"%.3f\n\", $total/$n}"    # 3.750
```

Or `echo "scale=3; $total/$n" | bc` — remembering that `bc` also cuts off unless `scale` is set — or `python3 -c` for anything longer than one expression.

Fix two: scale up and stay in whole numbers. Multiply by 100 first, then split the result into the part before and after the point:

```bash
printf '%d.%02d\n' $((total*100/n/100)) $((total*100/n%100))    # 3.75
```

Here `total*100/n` is `1500/4 = 375`; `375/100 = 3` and `375%100 = 75`. It is fiddly, and worth it only where you cannot rely on `awk`.

The deeper answer is lesson 14's: arithmetic on measurements is a sign the logic belongs in Python.
:::

## Summary

| Construct | Meaning | Note |
| --- | --- | --- |
| `$(cmd)` | substitute the command's stdout | nests cleanly; prefer it to backticks |
| trailing newlines | all stripped by the substitution | `out=$(cmd; echo x); out=${out%x}` keeps them |
| `"$(cmd)"` | quote it, always | unquoted output is split and globbed |
| `v=$(cmd)` | the line's status is `cmd`'s status | `local v=$(cmd)` hides it |
| `$((expr))` | integer arithmetic; no `$` needed inside | division cuts toward zero, no decimals |
| `(( expr ))` | arithmetic as a command | **status 1 when the value is 0** |
| `i=$((i+1))` | the safe increment | `(( i++ ))` under `set -e` kills the script |
| `for ((i=1; i<=n; i++))` | C-style loop | the same arithmetic context |
| `awk`, `bc`, `python3` | decimal arithmetic | `bc` needs `scale=`; `awk` is already in the pipeline |
| `a=(x "y z")`, `a+=(w)` | create, append | `${a[0]}` is also plain `$a` |
| `${#a[@]}` vs `${#a[1]}` | element count vs length of element 1 | same `#`, different question |
| `${!a[@]}` | the indices | arrays have holes after `unset` |
| `"${a[@]}"` | one word per element | the form for passing arguments |
| `"${a[*]}"` | one word, joined by the first character of `IFS` | for printing, not for arguments |
| `a=(runs/*)` | one element per glob match | spaces and all |
| `mapfile -t a < <(cmd)` | one element per output line | a pipe would put `mapfile` in a subshell |
| `read -r -a f <<< "$line"` | split one line into an array | `-r` on every `read` |
| `declare -A m` | associative array, bash 4+ | `${m[k]+yes}` tests membership |

Next, lesson 05 puts these to work in control flow — `if`, `for`, `while` and `case` — and explains the difference between `[ ]` and `[[ ]]`, which decides whether your tests need quoting.

::: context backtick-history Two ways to write the same thing
The backtick form is the original. It comes from the Bourne shell, the Unix shell of the late 1970s that bash is named after — "Bourne-again shell". The `$( )` form came later, from the KornShell, and the POSIX standard for shells adopted it. Bash accepts both, so old scripts keep working. New code uses `$( )` because it nests, and because a backtick is easy to confuse with a single quote on a screen or a printout.
:::

::: context trailing-newlines Where the newlines go
Here are the six bytes the command printed. The substitution keeps everything up to the last byte that is not a newline, and drops every newline after it. The newline between `a` and `b` is in the middle, so it stays.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="22" font-size="12" fill="#1f2a44">printed by the command</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="32" width="40" height="30" fill="#ffffff"/>
    <rect x="86" y="32" width="40" height="30" fill="#ffffff"/>
    <rect x="132" y="32" width="40" height="30" fill="#ffffff"/>
    <rect x="178" y="32" width="40" height="30" fill="#f2b880"/>
    <rect x="224" y="32" width="40" height="30" fill="#f2b880"/>
    <rect x="270" y="32" width="40" height="30" fill="#f2b880"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="52">a</text><text x="106" y="52">\n</text><text x="152" y="52">b</text>
    <text x="198" y="52">\n</text><text x="244" y="52">\n</text><text x="290" y="52">\n</text>
  </g>
  <path d="M178 68 v6 h132 v-6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="244" y="90" font-size="12" fill="#b4232c" text-anchor="middle">stripped</text>
  <text x="12" y="104" font-size="12" fill="#1f2a44">what the variable holds</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="114" width="40" height="30" fill="#8fb8f0"/>
    <rect x="86" y="114" width="40" height="30" fill="#8fb8f0"/>
    <rect x="132" y="114" width="40" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="134">a</text><text x="106" y="134">\n</text><text x="152" y="134">b</text>
  </g>
</svg>
```
:::

::: context bash-integers How big a bash integer can be
Bash stores every number as a 64-bit signed integer. The largest is 9223372036854775807, about 9.2 × 10¹⁸. Go one past it and the number wraps around to the most negative value with no warning: `$((2**63))` prints -9223372036854775808. Dividing by zero is caught — bash prints "division by 0" and the command fails. For counting cases and seconds you will never get near the limit, but it is why bash is the wrong place for anything that could overflow quietly.
:::

::: context zero-is-false Two opposite conventions meeting
In C, and inside `(( ))`, the number 0 means false and anything else means true. For exit statuses the shell uses the opposite convention: 0 means success, which `if` treats as true. `(( ))` is where the two meet. It works out the value in C's world, then reports it in the shell's world: a true (non-zero) value becomes status 0, and a false (zero) value becomes status 1. So `(( 5 > 3 ))` succeeds and `(( 0 ))` fails.
:::

::: context bc-scale What scale means to bc
`bc` stands for "basic calculator" and has been part of Unix since the 1970s. Its variable `scale` is the number of digits kept after the decimal point, and it starts at 0 — which is why plain `bc` cuts `10/3` to `3`. Running `bc -l` loads its math library and sets `scale` to 20, so `echo "10/3" | bc -l` prints `3.33333333333333333333`.
:::

::: context sparse-array An array with a hole
After `unset "cases[1]"`, slot 1 is not empty — it is gone. The array has three elements at indices 0, 2 and 3. A loop counting `i` from 0 to 2 would ask for the missing slot 1 and never reach slot 3.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#6c7a93" text-anchor="middle">
    <text x="60" y="22">0</text><text x="140" y="22">1</text><text x="220" y="22">2</text><text x="300" y="22">3</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="24" y="30" width="72" height="36" fill="#8fb8f0"/>
    <rect x="184" y="30" width="72" height="36" fill="#8fb8f0"/>
    <rect x="264" y="30" width="72" height="36" fill="#8fb8f0"/>
  </g>
  <rect x="104" y="30" width="72" height="36" fill="#ffffff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="53">alpha</text><text x="220" y="53">gamma</text><text x="300" y="53">delta</text>
  </g>
  <text x="140" y="53" font-size="12" fill="#b4232c" text-anchor="middle">no index 1</text>
  <text x="180" y="94" font-size="12" fill="#1f2a44" text-anchor="middle">indices: 0 2 3</text>
  <text x="180" y="114" font-size="12" fill="#1f2a44" text-anchor="middle">count: 3</text>
</svg>
```
:::

::: context three-expansions Three spellings, three argument lists
The same array, `a=(alpha "two words" gamma)`, handed to a command three ways. Each box is one argument the command receives.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="8" y="36">"${a[@]}"</text>
    <text x="8" y="82">"${a[*]}"</text>
    <text x="8" y="128">${a[@]}</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="86" y="18" width="44" height="28"/>
    <rect x="136" y="18" width="72" height="28"/>
    <rect x="214" y="18" width="52" height="28"/>
    <rect x="86" y="64" width="180" height="28"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="86" y="110" width="44" height="28"/>
    <rect x="136" y="110" width="34" height="28"/>
    <rect x="176" y="110" width="48" height="28"/>
    <rect x="230" y="110" width="52" height="28"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="108" y="36">alpha</text><text x="172" y="36">two words</text><text x="240" y="36">gamma</text>
    <text x="176" y="82">alpha two words gamma</text>
    <text x="108" y="128">alpha</text><text x="153" y="128">two</text><text x="200" y="128">words</text><text x="256" y="128">gamma</text>
  </g>
  <g font-size="12" text-anchor="end">
    <text x="352" y="36" fill="#1d6fd1">3 args</text>
    <text x="352" y="82" fill="#1d6fd1">1 arg</text>
    <text x="352" y="128" fill="#b4232c">4 args</text>
  </g>
</svg>
```
:::

::: context empty-array-set-u Why the empty array used to bite
In bash before version 4.4, `"${empty[@]}"` under `set -u` was treated as a use of an unset variable, and the script stopped with "unbound variable". That is why older scripts are full of workarounds like `${arr[@]+"${arr[@]}"}`. Since bash 4.4 an empty array expands to nothing, quietly. If your script may run on an old system — including the bash 3.2 on a Mac — the workaround is still needed there.
:::

::: context mapfile-subshell Why the pipe loses the array
A pipe connects two running programs, so both sides must run at the same time. Bash does this by starting each part of a pipeline as a separate process — a **subshell**, a copy of the shell with copies of its variables. `mapfile` on the right of the pipe fills the copy's array. When the pipeline ends, the copy exits and its variables go with it. Process substitution flips the arrangement: the producer runs in the copy, and `mapfile` stays at home. Lesson 05 shows the same trap with a `while` loop.
:::

::: context macos-bash The old bash on a Mac
Apple still ships bash 3.2, a version first released in 2006, as `/bin/bash`. Later versions of bash are released under the GPL version 3 licence, which Apple does not ship, and since macOS Catalina (2019) the default login shell has been zsh instead. So `declare -A`, `mapfile` and `${var,,}` fail on a stock Mac. If your ground tools must run on laptops as well as Linux servers, install a newer bash there (with Homebrew, for example) and point the shebang at `/usr/bin/env bash`.
:::

::: context hash-order Why the keys come out shuffled
Bash keeps an associative array in a **hash table**. Each key is turned into a number by a scrambling formula, and that number picks the slot where the value lives. Finding a key is then fast, because bash goes straight to its slot. The price is that walking through the table visits slots in slot order, which has nothing to do with the order you added keys or with the alphabet. Keys `z`, `a`, `q`, `b` came back here as `z q b a`.
:::
