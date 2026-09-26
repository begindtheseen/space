---
id: l05-control-flow-and-tests
title: Control flow, and the two kinds of bracket
minutes: 21
covers:
  - if / for / while / case, test [[ ]] vs [ ]
---

In most languages, `if` looks at a true-or-false value. Bash has no true-or-false values at all. Its `if` runs a **command** and looks at how that command finished: its **exit status**, a small number where 0 means success. Success counts as true. Anything else counts as false.

Hold on to that one fact and every strange thing about shell conditions turns ordinary. `[` turns out to be a *program*. `[[` turns out to be part of bash's own grammar, a **keyword**. The difference between them is the difference between a program that receives words already chopped up by the shell and a construct that bash reads for itself.

This lesson covers the four control structures — `if`, `for`, `while` and `case` — and both kinds of bracket. It spends most of its time on how `[` fails, because that failure is nasty: a syntax error inside a test, at run time, on a value you did not expect. On a ground-station server, that means on the night the test campaign runs unattended.

Every output below is real, from GNU bash 5.2.21 and GNU coreutils 9.4 on Ubuntu 24.04, using the same `logs/` and `runs/` folders as lesson 04. `logs/driver.log` holds one line containing `ERROR`.

## `if` runs a command

```bash
if grep -q ERROR logs/driver.log; then echo "found errors"; else echo "clean"; fi
```

```text
found errors
```

```bash
if grep -q NOTHING logs/driver.log; then echo "found"; else echo "clean, grep exited $?"; fi
```

```text
clean, grep exited 1
```

There is no comparison anywhere here. `grep` ran, and `if` chose a branch from its status. `grep -q` ("quiet") prints nothing and only reports, through its status, whether it found a match.

That is why `grep -q`, `test`, `[[ ]]` and your own functions can all sit after `if`: each is a command that returns a status. It is also why `set -e` does not fire on a failing condition (lesson 02). A non-zero status in that spot is an answer, not a failure.

`elif` ("else if") adds another test, `else` catches everything left, and `fi` — `if` backwards — closes the block. All of it can go on one line, with semicolons between the parts.

## `[` is a program

This surprises nearly everyone:

```bash
ls -l /usr/bin/[ /usr/bin/test
type [; type [[
```

```text
-rwxr-xr-x 1 root root 55744 Jun 22  2025 /usr/bin/[
-rwxr-xr-x 1 root root 47552 Jun 22  2025 /usr/bin/test
[ is a shell builtin
[[ is a shell keyword
```

There really is a **[[program called `[`|bracket-program]]** in `/usr/bin`, and the closing `]` is only its last argument. Bash has a built-in copy for speed, but it behaves like the program: `[` gets a list of words, exactly as `grep` would, and every expansion has already happened before it sees them.

That is the whole reason it is fragile. If a variable expands to nothing, its word vanishes before `[` runs:

```bash
x=""; if [ $x = "abc" ]; then echo yes; fi
```

```text
bash: [: =: unary operator expected
```

`[` received three words — `=`, `abc`, `]` — and could not make sense of `=` in first place, where it expected a **[[unary operator|unary-operator]]** like `-f`. If a variable expands to two words, `[` gets too many:

```bash
x="a b"; if [ $x = "a b" ]; then echo yes; fi
```

```text
bash: [: too many arguments
```

Quoting fixes both, because quoting is what stops the splitting — an empty value arrives as an **[[empty word, not no word|bracket-args]]**:

```bash
x=""; if [ "$x" = "abc" ]; then echo yes; else echo "no (quoted [ is fine)"; fi
```

```text
no (quoted [ is fine)
```

::: warning A test that says yes to nothing
An unquoted empty variable does not always cause an error. Sometimes it gives a wrong answer without a word. `[ -n $x ]` is meant to ask "is `x` non-empty?". With `x` empty it becomes `[ -n ]`, and `[` with one word between the brackets only asks whether that word is non-empty. `-n` is a non-empty word, so the test says **true**:

```bash
x=""; [ -n $x ] && echo "bash [ says non-empty"
x=""; [[ -n $x ]] || echo "[[ says empty"
```

```text
bash [ says non-empty
[[ says empty
```

Quote it — `[ -n "$x" ]` — or use `[[ ]]`.
:::

## `[[ ]]` is read by bash itself

`[[` is a keyword, so bash reads the whole construct itself and never word-splits or glob-expands the values inside it. The same two tests need no quotes at all:

```bash
x=""; if [[ $x = "abc" ]]; then echo yes; else echo "no (unquoted [[ is fine)"; fi
x="a b"; if [[ $x = "a b" ]]; then echo "yes (no splitting inside [[ )"; fi
```

```text
no (unquoted [[ is fine)
yes (no splitting inside [[ )
```

It also understands operators that `[` cannot, because outside double brackets `&&` and `<` already mean something else to the shell ("and then" and "read from"):

```bash
f=logs/run.log
if [ -f $f ] && [ -s $f ]; then echo "POSIX form: file exists and is non-empty"; fi
if [[ -f $f && -s $f ]];   then echo "bash form: same test, one bracket"; fi
```

```text
POSIX form: file exists and is non-empty
bash form: same test, one bracket
```

The old form `[ -f $f -a -s $f ]`, with `-a` for "and" and `-o` for "or", still works, but POSIX — the standard that defines portable shells — has marked it **[[obsolescent|obsolescent]]**. Do not write new code with `-a` or `-o`.

**Use `[[ ]]` in every bash script.** Use `[ ]` only when the shebang is `#!/bin/sh` and the script must run under **[[dash|dash-shell]]**, where `[[` does not exist (lesson 01). Quote inside `[[ ]]` anyway, for the usual reason: a habit with exceptions is not a habit.

::: key
`[` is the POSIX test builtin: it needs quoting everywhere and does not know about `&&` or pattern matching. `[[` is a bash keyword: no word splitting inside, supports `&&` `||` `<` `>`, `=~` regex and glob matching. Prefer `[[` in bash scripts.
:::

### The tests themselves

| Kind | Operators |
| --- | --- |
| file | `-e` exists, `-f` regular file, `-d` directory, `-L` symlink, `-s` non-empty, `-r` `-w` `-x` readable/writable/executable, `-nt` `-ot` newer/older than |
| string | `-z` empty, `-n` non-empty, `=` or `==` equal, `!=` not equal, `<` `>` dictionary order |
| number | `-eq -ne -lt -le -gt -ge` |
| logic | `!` not, `&&` and, `||` or, parentheses to group |

Read `-lt` as "less than", `-le` "less than or equal", `-eq` "equal", `-ne` "not equal", and so on.

Here is the catch. The **word-shaped** operators are the numeric ones, and the **symbol-shaped** ones compare text. That is backwards from nearly every other language, and it causes real bugs:

```bash
a=9; b=100
[[ $a < $b ]] && echo "string: 9 < 100" || echo "string: 9 is NOT < 100"
(( a < b )) && echo "arithmetic: 9 < 100"
```

```text
string: 9 is NOT < 100
arithmetic: 9 < 100
```

`<` inside `[[ ]]` compares strings in **[[dictionary order|dictionary-order]]**, one character at a time. `"9"` sorts after `"100"` because the character `9` comes after the character `1`. For numbers use `-lt` inside `[[ ]]` — or better, `(( ))` from lesson 04, where everything is arithmetic and `<` means what it looks like.

### Pattern and regex matching

`==` inside `[[ ]]` does **glob matching** — the same `*` and `?` wildcards as file names — when the right-hand side is unquoted:

```bash
name="case_0417.log"
[[ $name == *.log ]] && echo "glob match"
[[ $name == "*.log" ]] || echo "quoted RHS is a literal, so no match"
```

```text
glob match
quoted RHS is a literal, so no match
```

`=~` does **[[regular expression|regex]]** matching, with the captured pieces in the array `BASH_REMATCH`:

```bash
[[ $name =~ ^case_([0-9]{4})\.log$ ]] && echo "regex match, id=${BASH_REMATCH[1]}"
```

```text
regex match, id=0417
```

Read the pattern piece by piece: `^` is the start, `case_` is literal text, `([0-9]{4})` captures four digits, `\.` is a real dot, `log` is literal, `$` is the end. The part in parentheses lands in `BASH_REMATCH[1]`.

::: warning Quoting the right side turns the pattern off
On the right of `==` and `=~`, quoting works the opposite way from everywhere else: **quoting makes it a literal.**

```bash
[[ $name =~ "^case_" ]] && echo matched || echo "quoted regex is a literal: no match"
```

```text
quoted regex is a literal: no match
```

The pattern was compared as the six plain characters `^case_`, which no file name contains. A *variable* on the right, left unquoted, works — and that is the recommended form for anything non-trivial, because it keeps the regex away from bash's own parser:

```bash
re="^case_([0-9]{4})\.log$"
[[ $name =~ $re ]] && echo "unquoted var RHS works: ${BASH_REMATCH[1]}"
```

```text
unquoted var RHS works: 0417
```

So: the left side quoted as usual, the right side a bare pattern or a bare variable. `shellcheck` knows this rule and will tell you when you have it backwards.
:::

## `for`

A `for` loop runs the same commands once for each word in a list. The list can be written out, a **brace range**, a glob, or the script's own arguments:

```bash
for i in {1..5}; do printf "case_%03d " "$i"; done; echo
for i in {1..10..3}; do printf "%d " "$i"; done; echo
```

```text
case_001 case_002 case_003 case_004 case_005
1 4 7 10
```

`{1..5}` means 1 through 5. `{1..10..3}` counts from 1 to 10 in steps of 3: 1, 4, 7, 10.

Brace expansion happens **[[before variables are filled in|expansion-order]]**, so `{1..$n}` does not work:

```bash
n=4; for i in {1..$n}; do printf "%s " "$i"; done; echo
```

```text
{1..4}
```

One word, printed as-is. Use `seq`, or the C-style loop from lesson 04:

```bash
n=4; for i in $(seq 1 "$n"); do printf "%d " "$i"; done; echo
```

```text
1 2 3 4
```

A glob ending in `/` matches only directories. And `"$@"` loops over arguments:

```bash
for d in runs/*/; do echo "<$d>"; done
```

```text
<runs/baseline/>
<runs/entry burn 01/>
```

```bash
set -- "first arg" second; for a in "$@"; do echo "<$a>"; done
```

```text
<first arg>
<second>
```

(`set --` replaces the current arguments, which lets you try this at a prompt.) `"$@"` is the only correct way to loop over a script's arguments, for the same reason lesson 04 gave for `"${a[@]}"`.

## `while`, `until`, and reading input

`while` repeats as long as its command succeeds. `until` repeats as long as its command fails.

```bash
i=0; while (( i < 3 )); do echo "i=$i"; i=$((i+1)); done
i=3; until (( i == 0 )); do echo "i=$i"; i=$((i-1)); done
```

```text
i=0
i=1
i=2
i=3
i=2
i=1
```

The loop you will write most is reading a file line by line, and it has a fixed recipe:

```bash
while IFS= read -r line; do echo "line: <$line>"; done < <(head -3 logs/run.log)
```

```text
line: <t=0.5 chan=WHEEL_RPM val=4187.0>
line: <t=1.0 chan=BUS_VOLTS val=27.9>
line: <t=1.5 chan=GYRO_X_DPS val=-0.1>
```

`read` returns success while there is a line to read and failure at the end of the input, which is what stops the loop. `IFS=`, set only for this one command, stops spaces at the start and end being trimmed. `-r` stops backslashes being treated as special. Write both, every time.

`read` can also split a line into several variables, using the characters in `IFS` as separators. By habit, `_` is the name for a piece you are throwing away:

```bash
while IFS="= " read -r _ t _ chan _ val; do echo "t=$t chan=$chan val=$val"; done < <(head -3 logs/run.log)
```

```text
t=0.5 chan=WHEEL_RPM val=4187.0
t=1.0 chan=BUS_VOLTS val=27.9
t=1.5 chan=GYRO_X_DPS val=-0.1
```

With `=` and space as separators, `t=0.5 chan=WHEEL_RPM val=4187.0` splits into six pieces: `t`, `0.5`, `chan`, `WHEEL_RPM`, `val`, `4187.0`. The odd ones go to `_`. `read` gives everything left over to the *last* variable, so putting a field that may contain spaces last is deliberate.

::: example The pipe that eats your variables
This is the single most confusing thing in shell scripting, and it comes down to a couple of characters.

```bash
#!/usr/bin/env bash
count=0
head -3 logs/run.log | while IFS= read -r _; do count=$((count+1)); done
echo "after the pipe:     count=$count"
while IFS= read -r _; do count=$((count+1)); done < <(head -3 logs/run.log)
echo "after the redirect: count=$count"
```

```text
after the pipe:     count=0
after the redirect: count=3
```

Both loops ran three times. Yet after the first one, `count` is still zero.

Here is why. Each stage of a pipeline runs in its own **[[subshell|subshell-picture]]** — a copy of the shell, with copies of its variables. The `while` on the right of the `|` got a copy of `count`, added to the copy three times, and the copy was thrown away when the pipeline ended. The parent's `count` was never touched.

Nothing warns you at run time. The loop body really did run, and any file it wrote is really written; only the variables are lost. (`shellcheck` does spot it, and reports it as SC2030 and SC2031.)

There are three ways around it:

1. Redirect instead of piping: `done < <(command)`, process substitution, as in the second loop — or `done < file` when the input is a file.
2. Put the whole loop, *and* the code that uses its result, inside the same subshell.
3. In bash, `shopt -s lastpipe` makes the last stage of a pipeline run in the current shell — but only when job control is off, so it does nothing at an interactive prompt and quietly behaves differently between contexts.

The redirect form is the one to learn. `done < <(cmd)` looks odd, and it is worth the five minutes it takes to stop looking odd. Sanity check on the output: the second loop started from the parent's `count`, which was 0, and added 3. Three, as printed.
:::

## `case`

`case` is a sorting machine. It takes one value, compares it against a list of glob patterns in order, and runs the branch of the first pattern that fits.

::: example Dispatching on a filename
```bash
classify() {
  case "$1" in
    *.log)          echo "$1: log" ;;
    *.csv|*.tsv)    echo "$1: table" ;;
    case_[0-9][0-9][0-9][0-9]) echo "$1: case directory" ;;
    -*)             echo "$1: looks like an option" ;;
    "")             echo "(empty): nothing to classify" ;;
    *)              echo "$1: unknown" ;;
  esac
}
for a in run.log data.csv case_0417 --verbose "" mystery; do classify "$a"; done
```

```text
run.log: log
data.csv: table
case_0417: case directory
--verbose: looks like an option
(empty): nothing to classify
mystery: unknown
```

Follow one value through. `case_0417` does not end in `.log`, `.csv` or `.tsv`. It does fit `case_[0-9][0-9][0-9][0-9]`: the text `case_` and then exactly four characters, each a digit. So the third branch runs, and the rest are skipped. (`esac` — `case` backwards — closes the block.)

Five things in this shape are worth copying:

- Patterns are globs, not regexes: `*`, `?`, `[…]`, and `|` between alternatives. There are no anchors, because the pattern must always match the whole value.
- **[[`;;`|case-terminators]]** ends a branch, and is easy to forget.
- A final `*)` is the default. Always include it, even if it only reports an unexpected value.
- `"")` matches the empty string on purpose, which is usually a different situation from "unknown".
- The value is quoted and the patterns are not — the same rule as `[[ $x == pattern ]]`.

`case` is what `getopts` (lesson 08) uses to handle each option. Whenever you compare one value against several shapes, it is far clearer than a chain of `elif [[ ]]` tests.
:::

`break` leaves the innermost loop, and `continue` jumps to its next round. Both take a number to act on an outer loop — `break 2` leaves two loops at once.

```bash
for i in 1 2 3 4 5 6; do
  if (( i % 2 == 0 )); then continue; fi
  if (( i > 4 )); then break; fi
  echo "odd: $i"
done
```

```text
odd: 1
odd: 3
```

Trace it: 1 is odd and not above 4, so it prints. 2 is even, so `continue` skips it. 3 prints. 4 is skipped. 5 is odd but above 4, so `break` ends the loop, and 6 is never reached.

::: key
`if` branches on a command's exit status, where 0 is true. `[` is a program whose arguments are already expanded, so an unquoted empty or multi-word variable becomes a run-time error — "unary operator expected" or "too many arguments". `[[ ]]` is a bash keyword: no splitting, no globbing, and it supports `&&`, `||`, glob matching with `==` and regex with `=~`. Use `[[ ]]` in bash, `[ ]` only under `#!/bin/sh`. A `while read` loop on the right of a pipe runs in a subshell and loses its variables — use `done < <(cmd)`.
:::

## Check yourself

::: check
`if [ $status = "OK" ]` works for months, then one night fails with `[: =: unary operator expected`. What happened? Give two fixes.
:::

::: answer
That night, `status` was empty or unset. `[` is a command whose arguments are expanded before it runs, so with an empty `status` the test becomes `[ = OK ]`. That is three words where `[` expected a different shape, and it read `=` as a unary operator, which it is not.

Fix one: quote the expansion, `[ "$status" = "OK" ]`. The empty value now arrives as an empty *argument* instead of no argument at all, and the comparison is false — which is what you meant.

Fix two, better in a bash script: `[[ $status == "OK" ]]`. `[[` is read by bash itself, so an empty value cannot change the number of words, and the test is false.

Why did it work for months? Because the failure depends on the data, not the code. Something upstream — a `grep` that found nothing, a field that moved, a truncated log — started producing an empty value, and the test turned into an error instead of returning false. `set -u` (lesson 02) catches the unset case earlier, at the moment of expansion, with a clearer message.
:::

::: check
Explain why `count` is zero after `grep ERROR log | while read -r line; do count=$((count+1)); done`, even though the loop body ran.
:::

::: answer
Every stage of a pipeline runs in its own subshell — a copy of the shell with copies of its variables. The `while` loop is the right-hand stage, so it added to *its copy* of `count`. When the pipeline finished, that subshell exited and its variables went with it. The parent shell's `count` was never touched.

Only variables are affected. Anything the loop wrote to a file, printed, or sent to another program really happened — which is what makes the bug so confusing: the work was done, and the result is missing.

The fix is to stop putting the loop on the right of a pipe. `while read -r line; do …; done < <(grep ERROR log)` uses process substitution, so the loop runs in the current shell and `count` survives. `done < file` does the same when the input is a file. `shopt -s lastpipe` also works, but only when job control is off, so it acts differently in a script and at a prompt — a poor thing to rely on.

If you only need the count, `count=$(grep -c ERROR log || true)` skips the loop entirely. A loop that could have been one command usually should have been.
:::

::: check
What is the difference between `[[ $f == *.log ]]`, `[[ $f == "*.log" ]]` and `[[ $f =~ .*\.log ]]`?
:::

::: answer
The first is a glob match. The unquoted right side of `==` inside `[[ ]]` is a pattern, so `*` means "any characters", and the test is true for any name ending in `.log`.

The second is a plain comparison. Quoting the right side switches pattern matching off, so it is true only for a file literally named `*.log`, starting with an asterisk. This is the one quoting rule in bash that runs opposite to all the others.

The third is a regular-expression match. `.*\.log` is a regex, and because `=~` is not anchored, it is true for any name *containing* `.log` anywhere — including `notes.log.bak`. To match the end you need `\.log$`, and to match the whole value `^.*\.log$`.

For a suffix test, prefer the glob: it always matches the whole string, with no surprises. Keep `=~` for when you need to pull out a part through `BASH_REMATCH`, and put the pattern in a variable — `[[ $f =~ $re ]]` — so bash's parser never sees the regex.
:::

::: check
Why is `[[ "9" < "100" ]]` false, and what should you write instead?
:::

::: answer
Because `<` inside `[[ ]]` compares *strings*, in the dictionary order of the current locale. It goes character by character: `9` against `1`. The character `9` sorts after `1`, so the comparison is decided at the first character and the rest is never looked at. That the values are numbers plays no part.

Write `[[ 9 -lt 100 ]]`, the numeric less-than, or `(( 9 < 100 ))`, which puts the whole expression in arithmetic where `<` means what it looks like. The second reads better when there is more than one comparison: `(( a < b && b < c ))` reads normally, and the `[[ ]]` version does not.

Take care here, because the operators are laid out backwards from other languages: inside `[[ ]]`, the word-shaped ones (`-lt`, `-gt`) are numeric, and the symbol-shaped ones (`<`, `>`) compare strings. Numbers read from a log arrive as text — case ids, counts, exit codes — and a comparison that is right from 1 to 9 and wrong from 10 on will pass every small test.
:::

::: check
When is `[ ]` the right choice over `[[ ]]`, and what must you do differently when you use it?
:::

::: answer
When the script must run under a shell that has no `[[` — that is, when the shebang is `#!/bin/sh` and the script may be run by `dash`, which is `/bin/sh` on Debian and Ubuntu (lesson 01). The same goes for a `Makefile` recipe, or a `systemd` `ExecStart` line that goes through `sh -c`.

Under `dash`, `[[` is not a syntax error you would see before the run. `dash` treats it as the name of a command, fails to find it, and the `if` quietly takes its `else` branch:

```text
dash: 1: [[: not found
```

What changes when you use `[ ]`: quote every expansion inside the brackets, without exception, because `[` receives words already split — an unquoted empty value removes an argument, an unquoted multi-word value adds one, and both break the test at run time. Never use `-a` and `-o`; chain with `] && [` instead. There is no `==` (use `=`), no `=~` and no glob matching, so pattern tests move to `case`, which is POSIX and does everything `[[ $x == pattern ]]` does.

Everywhere else, use `[[ ]]`. `shellcheck` reads the shebang and checks the right dialect.
:::

## Summary

| Construct | Meaning | Note |
| --- | --- | --- |
| `if cmd; then … fi` | branches on exit status, 0 is true | no true/false values anywhere in bash |
| `[` / `test` | a program; `]` is its last argument | arguments are expanded before it runs |
| `[: =: unary operator expected` | an unquoted empty variable | quote it, or use `[[ ]]` |
| `[: too many arguments` | an unquoted multi-word variable | same two fixes |
| `[ -n $x ]` with `x` empty | true — the one-word test | quote it: `[ -n "$x" ]` |
| `[[ ]]` | a bash keyword: no splitting, no globbing | supports `&&`, `\|\|`, `<`, `==`, `=~` |
| `-e -f -d -L -s -r -w -x -nt` | file tests | `-s` is "exists and is non-empty" |
| `-z -n = != < >` | string tests | `<` and `>` are *string* comparisons |
| `-eq -ne -lt -le -gt -ge` | numeric tests | or use `(( ))`, where `<` is arithmetic |
| `[[ $f == *.log ]]` | glob match | quoting the right side makes it a literal |
| `[[ $f =~ $re ]]` | regex, captures in `BASH_REMATCH` | keep the regex in a variable, unquoted |
| `for x in {1..5}` / `runs/*/` / `"$@"` | range, directories, arguments | `{1..$n}` does not work; use `seq` |
| `while (( i < n ))` / `until` | loops on a condition | `(( ))` is the natural numeric test |
| `while IFS= read -r line; do … done < <(cmd)` | read a stream line by line | `IFS=` and `-r` every time |
| `cmd \| while read …` | the loop runs in a subshell | variables set inside are lost |
| `case "$x" in pat) … ;; *) … ;; esac` | glob patterns, first match wins | always include `*)`; `;;` ends a branch |
| `break` / `continue` | leave / skip; take a level count | `break 2` leaves two loops |

Next, lesson 06 wraps these into functions: how a function hands back a value, what its exit status means, and the exit-code habits that let whatever runs your script tell what happened.

::: context bracket-program Why there is a program called [
The command that does tests was first called `test`, and scripts wrote `if test -f file`. Unix also got a second name for the same program, `[`, so that the line could read `if [ -f file ]` and look like a condition in other languages. The price of the disguise is that `[` insists its last argument is `]`, and it checks that like any other argument. Forget the space in `[ -f file]` and `[` sees a last word `file]`, and complains "missing `]`".
:::

::: context unary-operator One side or two
A **unary** operator works on one thing: `-f file` asks about one file, and the minus in `-5` works on one number. A **binary** operator sits between two things: `a = b`, `3 -lt 4`. `[` decides which kind of test you mean by counting its words. With two words it expects a unary test like `-f file`, and with three it expects a binary test like `a = b`. An empty variable changes the count, so `[` reads your test as the wrong kind.
:::

::: context bracket-args What [ actually receives
Here are the words `[` is handed for `[ $x = "abc" ]`, with `x` empty, unquoted and quoted. Unquoted, the empty value disappears and `=` slides into first place.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="12" fill="#1f2a44">[ $x = "abc" ]</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="12" y="30" width="44" height="28"/>
    <rect x="62" y="30" width="44" height="28"/>
    <rect x="112" y="30" width="36" height="28"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="49">=</text><text x="84" y="49">abc</text><text x="130" y="49">]</text>
  </g>
  <text x="348" y="49" font-size="12" fill="#b4232c" text-anchor="end">3 words: error</text>
  <text x="12" y="84" font-size="12" fill="#1f2a44">[ "$x" = "abc" ]</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#8fb8f0">
    <rect x="12" y="94" width="44" height="28"/>
    <rect x="62" y="94" width="44" height="28"/>
    <rect x="112" y="94" width="44" height="28"/>
    <rect x="162" y="94" width="36" height="28"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="34" y="113">""</text><text x="84" y="113">=</text><text x="134" y="113">abc</text><text x="180" y="113">]</text>
  </g>
  <text x="348" y="113" font-size="12" fill="#1d6fd1" text-anchor="end">4 words: false</text>
</svg>
```
:::

::: context obsolescent Why -a and -o were retired
"Obsolescent" means "still allowed, but on its way out". The trouble with `-a` and `-o` is that a long `[` expression can be read more than one way. If a variable happens to hold `!` or `(` or `-f`, `[` may take it for an operator instead of a value. Joining separate tests with `&&` and `||` gives each `[` a short, unambiguous list of words.
:::

::: context dash-shell The small, fast /bin/sh
`dash`, the Debian Almquist shell, is a small shell that follows the POSIX standard closely and starts faster than bash. Ubuntu made it `/bin/sh` in 2006, and Debian followed, so system scripts that begin `#!/bin/sh` boot faster. It has no `[[`, no arrays and no `(( ))` command. A script with a `#!/bin/sh` shebang that quietly uses bash features works on a machine where `/bin/sh` is bash and breaks on Ubuntu.
:::

::: context dictionary-order How strings are compared
Dictionary order compares the first characters; only if they are equal does it move on to the second, and so on. That is why "apple" comes before "banana" whatever their lengths. For digits, the character `1` comes before `9`, so the string `"100"` sorts before `"9"`. It is also why logs are often numbered `case_0009`, `case_0100`: padded to the same width with zeros, text order and number order agree.
:::

::: context regex Regular expressions in one paragraph
A **regular expression**, or regex, is a small language for describing text patterns. `.` means any one character, `*` means "the thing before, repeated any number of times", `[0-9]` means one digit, `{4}` means exactly four of the thing before, `^` and `$` pin the start and end, and a backslash makes a special character plain, so `\.` is a real dot. Bash's `=~` uses the "extended" flavor, the same as `grep -E`. `BASH_REMATCH[0]` holds the whole match, and `BASH_REMATCH[1]` the first parenthesized group.
:::

::: context expansion-order Bash expands in a fixed order
Bash processes a line in a fixed order: brace expansion first, then `~`, then variables, command substitutions and arithmetic, then word splitting, then globs. When brace expansion looks at `{1..$n}`, the `$n` is still just the characters `$` and `n`, not a number, so it is not a valid range and is left alone. By the time `$n` becomes `4`, brace expansion has already had its turn.
:::

::: context subshell-picture The copy that is thrown away
The parent shell starts the pipeline. The `while` loop runs in a copy with its own `count`, which reaches 3. When the pipeline ends, the copy is discarded, and the parent's `count` is still 0.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="44" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="22" y="30" font-size="12" fill="#1f2a44">parent shell</text>
  <text x="22" y="46" font-size="12" fill="#1d6fd1">count = 0</text>
  <text x="338" y="38" font-size="12" fill="#1f2a44" text-anchor="end">still 0 afterwards</text>
  <rect x="10" y="90" width="120" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="116" font-size="12" fill="#1f2a44" text-anchor="middle">head -3 run.log</text>
  <line x1="130" y1="112" x2="166" y2="112" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="174,112 164,107 164,117" fill="#1f2a44"/>
  <text x="152" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">|</text>
  <rect x="176" y="90" width="174" height="44" fill="#f2b880" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="188" y="108" font-size="12" fill="#1f2a44">while loop (a copy)</text>
  <text x="188" y="125" font-size="12" fill="#1f2a44">count = 1, 2, 3</text>
  <line x1="70" y1="54" x2="70" y2="88" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="262" y1="54" x2="262" y2="88" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="263" y="156" font-size="12" fill="#b4232c" text-anchor="middle">discarded at the end</text>
</svg>
```
:::

::: context case-terminators Other ways to end a branch
`;;` means "done — leave the `case`". Bash 4 added two more endings. `;&` falls through and runs the next branch's commands as well, without testing its pattern. `;;&` goes on testing the remaining patterns and runs any others that also match. They are rare, and a reader may not know them, so reach for them only when they make the code clearly simpler.
:::
