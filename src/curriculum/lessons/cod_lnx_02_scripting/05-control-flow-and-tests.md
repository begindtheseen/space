---
id: l05-control-flow-and-tests
title: Control flow, and the two kinds of bracket
minutes: 18
covers:
  - if / for / while / case, test [[ ]] vs [ ]
---

Bash has no booleans. `if` does not evaluate a condition — it runs a command and looks at its exit status, where zero means true. Once you hold that one fact, every strange thing about shell conditionals becomes ordinary: `[` is a *program*, `[[` is a *keyword*, and the difference between them is the difference between a program that receives already-split arguments and a construct bash parses itself.

This lesson covers the four control structures and both kinds of bracket, and spends most of its attention on when `[` fails. That failure is a syntax error inside a test, at run time, on a value you did not anticipate — which is to say, on the night the campaign runs unattended.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21 and GNU coreutils 9.4 on Ubuntu 24.04.4.

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

There is no expression here at all — `grep` ran, and `if` branched on its status. That is why `grep -q`, `test`, `[[ ]]` and your own functions are all usable as conditions: they are commands that return a status. It is also why `set -e` does not fire on a failing condition (lesson 02): a non-zero status in that position is the answer, not a failure.

`elif` chains, `else` ends, and the whole thing may be written on one line with semicolons.

## `[` is a program

```bash
ls -l /usr/bin/[ /usr/bin/test
type [; type [[
```

```text
-rwxr-xr-x 1 root root 55744 Jun 22  2025 /usr/bin/[
-rwxr-xr-x 1 root root 47552 Jun 22  2025 /usr/bin/test
```

```text
[ is a shell builtin
[[ is a shell keyword
```

There really is an executable called `[` in `/usr/bin`, and `]` is just its last argument. Modern shells provide a builtin, but the *semantics* are the program's: `[` receives a list of words, exactly as `grep` would, and every expansion has already happened by the time it sees them.

That is the whole source of its fragility. If a variable expands to nothing, the word disappears before `[` runs:

```bash
x=""; if [ $x = "abc" ]; then echo yes; fi
```

```text
bash: [: =: unary operator expected
```

`[` was called with three arguments — `=`, `abc`, `]` — and complained about the first. If a variable expands to two words, it gets too many:

```bash
x="a b"; if [ $x = "a b" ]; then echo yes; fi
```

```text
bash: [: too many arguments
```

Quoting fixes both, because quoting is what stops the splitting:

```bash
x=""; if [ "$x" = "abc" ]; then echo yes; else echo "no (quoted [ is fine)"; fi
```

```text
no (quoted [ is fine)
```

## `[[ ]]` is parsed by bash

`[[` is a keyword, so bash parses the whole construct itself and never performs word splitting or globbing on the values inside it. The same two tests need no quotes at all:

```bash
x=""; if [[ $x = "abc" ]]; then echo yes; else echo "no (unquoted [[ is fine)"; fi
x="a b"; if [[ $x = "a b" ]]; then echo "yes (no splitting inside [[ )"; fi
```

```text
no (unquoted [[ is fine)
```

```text
yes (no splitting inside [[ )
```

It also understands operators that `[` cannot, because `&&` and `<` would be shell syntax outside brackets:

```bash
f=logs/run.log
if [ -f $f ] && [ -s $f ]; then echo "POSIX form: file exists and is non-empty"; fi
if [[ -f $f && -s $f ]];   then echo "bash form: same test, one bracket"; fi
```

```text
POSIX form: file exists and is non-empty
bash form: same test, one bracket
```

The old `[ -f $f -a -s $f ]` form still works and is marked obsolescent in POSIX; do not write new code with `-a` or `-o`.

**Use `[[ ]]` in every bash script.** Use `[ ]` only when the script's shebang is `#!/bin/sh` and it must run under `dash`, where `[[` does not exist (lesson 01). Quote inside `[[ ]]` anyway, for the same reason as always: a habit with an exception is not a habit.

### The tests themselves

| Category | Operators |
| --- | --- |
| file | `-e` exists, `-f` regular file, `-d` directory, `-L` symlink, `-s` non-empty, `-r` `-w` `-x` readable/writable/executable, `-nt` `-ot` newer/older than |
| string | `-z` empty, `-n` non-empty, `=` or `==` equal, `!=` unequal, `<` `>` lexicographic |
| numeric | `-eq -ne -lt -le -gt -ge` |
| logic | `!`, `&&`, `||`, parentheses |

The numeric operators are the string-looking ones and the comparison operators are the numeric-looking ones, which is exactly backwards from every other language and is a real source of bugs:

```bash
a=9; b=100
[[ $a < $b ]] && echo "string: 9 < 100" || echo "string: 9 is NOT < 100"
(( a < b )) && echo "arithmetic: 9 < 100"
```

```text
string: 9 is NOT < 100
arithmetic: 9 < 100
```

`<` inside `[[ ]]` compares strings, and `"9"` sorts after `"100"` because `9` is a later character than `1`. For numbers use `-lt` inside `[[ ]]`, or — better — use `(( ))`, where everything is arithmetic and the operators mean what they look like.

### Pattern and regex matching

`==` inside `[[ ]]` does **glob matching** when the right-hand side is unquoted:

```bash
name="case_0417.log"
[[ $name == *.log ]] && echo "glob match"
[[ $name == "*.log" ]] || echo "quoted RHS is a literal, so no match"
```

```text
glob match
quoted RHS is a literal, so no match
```

`=~` does **regular expression matching**, with the captures in `BASH_REMATCH`:

```bash
[[ $name =~ ^case_([0-9]{4})\.log$ ]] && echo "regex match, id=${BASH_REMATCH[1]}"
```

```text
regex match, id=0417
```

::: warning
The quoting rule on the right of `==` and `=~` is the reverse of everywhere else: **quoting makes it a literal.**

```bash
[[ $name =~ "^case_" ]] && echo matched || echo "quoted regex is a literal: no match"
```

```text
quoted regex is a literal: no match
```

The pattern was compared as the six literal characters `^case_`, which no filename contains. A variable on the right is *not* quoted and still works, which is the recommended form for anything non-trivial because it keeps the regex out of bash's parser:

```bash
re="^case_([0-9]{4})\.log$"
[[ $name =~ $re ]] && echo "unquoted var RHS works: ${BASH_REMATCH[1]}"
```

```text
unquoted var RHS works: 0417
```

So: left side quoted as usual, right side a bare pattern or a bare variable. `shellcheck` knows this rule and will tell you when you have it backwards.
:::

## `for`

Over a literal list, a brace range, a glob, or the script's own arguments:

```bash
for i in {1..5}; do printf "case_%03d " "$i"; done; echo
for i in {1..10..3}; do printf "%d " "$i"; done; echo
```

```text
case_001 case_002 case_003 case_004 case_005
```

```text
1 4 7 10
```

Brace expansion happens *before* parameter expansion, so `{1..$n}` does not work — that is what `seq` or the C-style form is for:

```bash
n=4; for i in $(seq 1 "$n"); do printf "%d " "$i"; done; echo
```

```text
1 2 3 4
```

Over directories, with a trailing slash to select only directories, and over arguments:

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

`"$@"` is the only correct way to loop over a script's arguments, for the reason lesson 04 gave for `"${a[@]}"`.

## `while`, `until`, and reading input

```bash
i=0; while (( i < 3 )); do echo "i=$i"; i=$((i+1)); done
i=3; until (( i == 0 )); do echo "i=$i"; i=$((i-1)); done
```

```text
i=0
i=1
i=2
```

```text
i=3
i=2
i=1
```

The form you will use most is reading a file line by line, and it has a fixed incantation:

```bash
while IFS= read -r line; do echo "line: <$line>"; done < <(head -3 logs/run.log)
```

```text
line: <t=0.5 chan=WHEEL_RPM val=4187.0>
line: <t=1.0 chan=BUS_VOLTS val=27.9>
line: <t=1.5 chan=GYRO_X_DPS val=-0.1>
```

`IFS=` for that one command stops leading and trailing whitespace being trimmed; `-r` stops backslashes being interpreted. Write both every time.

`read` can also split a line into several variables, using `IFS` — with `_` as the conventional name for a field you are discarding:

```bash
while IFS="= " read -r _ t _ chan _ val; do echo "t=$t chan=$chan val=$val"; done < <(head -3 logs/run.log)
```

```text
t=0.5 chan=WHEEL_RPM val=4187.0
t=1.0 chan=BUS_VOLTS val=27.9
t=1.5 chan=GYRO_X_DPS val=-0.1
```

Note that `read` assigns everything left over to the *last* variable, so putting the field that may contain spaces last is deliberate.

::: example The pipe that eats your variables
The single most confusing thing in shell scripting, and it is two characters' difference.

```bash
#!/usr/bin/env bash
count=0
head -3 logs/run.log | while IFS= read -r _; do count=$((count+1)); done
echo "after the pipe:   count=$count"
while IFS= read -r _; do count=$((count+1)); done < <(head -3 logs/run.log)
echo "after the redirect: count=$count"
```

```text
after the pipe:   count=0
after the redirect: count=3
```

Both loops ran three times. The first one's `count` is zero afterwards.

Each stage of a pipeline runs in its own **subshell**, so the `while` on the right of the `|` got a copy of `count`, incremented the copy, and the copy was discarded when the subshell exited. Nothing warns you; the loop body genuinely executed, and any file it wrote is really written. Only variables are lost.

Three ways to avoid it. Redirect instead of piping — `done < <(command)`, process substitution, as above, or `done < file` when the input is a file. Or put the whole loop, and the code that uses the result, inside the subshell. Or, in bash, `shopt -s lastpipe` makes the last stage of a pipeline run in the current shell — but only when job control is off, so it does nothing in an interactive session and quietly changes behaviour between contexts.

The redirect form is the one to learn. `done < <(cmd)` looks odd and is worth the five minutes it takes to stop looking odd.
:::

## `case`

`case` matches a value against glob patterns, in order, and runs the first branch that matches.

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

Five things in that shape are worth copying. Patterns are globs, not regexes — `*`, `?`, `[…]` and `|` for alternatives, with no anchors because the match is always against the whole value. `;;` ends a branch and is easy to forget. A final `*)` is the default and should always be present, even if it only reports an unexpected value. `"")` matches the empty string explicitly, which is usually a different case from "unknown". And the value is quoted while the patterns are not, which is the same rule as `[[ $x == pattern ]]`.

`case` is what `getopts` (lesson 08) dispatches with, and it is far clearer than a chain of `elif [[ ]]` tests whenever you are comparing one value against several shapes.
:::

`break` leaves the innermost loop and `continue` starts its next iteration; both take a number to act on an outer loop:

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

::: key
`if` branches on a command's exit status, where 0 is true. `[` is a program whose arguments are already expanded, so an unquoted empty or multi-word variable becomes a syntax error — "unary operator expected" or "too many arguments". `[[ ]]` is a bash keyword: no splitting, no globbing, and it supports `&&`, `||`, glob matching with `==` and regex with `=~`. Use `[[ ]]` in bash, `[ ]` only under `#!/bin/sh`. A `while read` loop on the right of a pipe runs in a subshell and loses its variables — use `done < <(cmd)`.
:::

## Check yourself

::: check
`if [ $status = "OK" ]` works for months and then fails with `[: =: unary operator expected`. What happened, and give two fixes.
:::

::: answer
`status` was empty or unset on that run. `[` is a command whose arguments are expanded before it runs, so `[ $status = "OK" ]` with an empty `status` becomes `[ = OK ]` — three arguments where `[` expected either two (a unary test) or four. It read `=` as a unary operator, which it is not, and said so.

Fix one: quote the expansion, `[ "$status" = "OK" ]`. The empty value then arrives as an empty *argument* rather than as no argument at all, and the comparison is false, which is what you meant.

Fix two, and better in a bash script: use `[[ $status == "OK" ]]`. `[[` is parsed by bash, so an empty value cannot change the number of words and the test simply evaluates to false.

The reason it worked for months is worth naming: the failure depends on the data, not the code. Something upstream — a `grep` that found nothing, a field that moved, a log that was truncated — started producing an empty value, and the test turned into a syntax error rather than returning false. `set -u` (lesson 02) catches the unset case at the point of expansion, which is earlier and clearer.
:::

::: check
Explain why `count` is zero after `grep ERROR log | while read -r line; do count=$((count+1)); done`, even though the loop body ran.
:::

::: answer
Every stage of a pipeline runs in its own subshell — a forked copy of the shell with a copy of its variables. The `while` loop is the right-hand stage, so it incremented *its copy* of `count`. When the pipeline finished, that subshell exited and its variables went with it. The parent shell's `count` was never touched.

Only variables are affected. Anything the loop wrote to a file, or printed, or sent to another program, really happened — which is what makes the bug so confusing: the work was done and the result is missing.

The fix is to stop putting the loop on the right of a pipe. `while read -r line; do …; done < <(grep ERROR log)` uses process substitution, so the loop runs in the current shell and `count` survives. `done < file` does the same when the input is a file. Bash's `shopt -s lastpipe` also works but only when job control is off, so it behaves differently in a script and at an interactive prompt, which makes it a poor thing to rely on.

If you only need the count, `count=$(grep -c ERROR log || true)` avoids the loop entirely — and a loop that could have been one command usually should have been.
:::

::: check
What is the difference between `[[ $f == *.log ]]`, `[[ $f == "*.log" ]]` and `[[ $f =~ .*\.log ]]`?
:::

::: answer
The first is a glob match: the unquoted right-hand side of `==` inside `[[ ]]` is a pattern, so `*` means "any characters" and the test is true for any name ending `.log`.

The second is a literal comparison. Quoting the right-hand side turns off pattern matching, so it is true only for a file actually named `*.log` — six characters beginning with an asterisk. This reversal is the one quoting rule in bash that runs opposite to all the others.

The third is a regular expression match. `.*\.log` is an ERE, and because `=~` is not anchored it is true for any name *containing* `.log` anywhere — including `notes.log.bak`. To match the end you need `\.log$`, and to match the whole value `^.*\.log$`.

For a suffix test, prefer the glob form: it is anchored to the whole string by definition, and it has no metacharacter surprises. Keep `=~` for cases where you need to extract a part, via `BASH_REMATCH`, and put the pattern in a variable — `[[ $f =~ $re ]]` — so bash's parser never sees the regex.
:::

::: check
Why does `[[ "9" < "100" ]]` evaluate false, and what should you write instead?
:::

::: answer
Because `<` inside `[[ ]]` is a *string* comparison, using the current locale's collation. It compares character by character: `9` against `1`, and `9` sorts after `1`, so the comparison is false at the first character and the rest is never examined. Nothing about the values being numeric enters into it.

Write `[[ 9 -lt 100 ]]`, which is the numeric less-than, or `(( 9 < 100 ))`, which puts the whole expression in an arithmetic context where `<` means what it looks like. The second is clearer for anything with more than one comparison, since `(( a < b && b < c ))` reads normally while the `[[ ]]` equivalent does not.

This is worth care because the operators are laid out backwards from every other language: inside `[[ ]]`, the word-shaped operators (`-lt`, `-gt`) are the numeric ones and the symbol-shaped ones (`<`, `>`) are the string ones. Numbers coming from a log as text — case ids, counts, exit codes — are exactly the values people compare, and a comparison that is right for 1 to 9 and wrong from 10 onward will pass every small test.
:::

::: check
When is `[ ]` the right choice over `[[ ]]`, and what must you do differently when you use it?
:::

::: answer
When the script must run under a shell that does not have `[[` — that is, when the shebang is `#!/bin/sh` and the script may be executed by `dash`, which is `/bin/sh` on Debian and Ubuntu (lesson 01). `[[` is a bash keyword, so under `dash` it is not even a syntax error at parse time in the way you might hope; it fails when reached. The same applies to a `Makefile` recipe or a `systemd` `ExecStart` that invokes `sh -c`.

What you must do differently: quote every expansion inside the brackets, without exception, because `[` receives already-split words — an unquoted empty value removes an argument and an unquoted multi-word value adds one, and both are run-time syntax errors. Use `-a` and `-o` never; chain with `] && [` instead, since those are obsolescent and parse ambiguously. There is no `==` (use `=`), no `=~`, and no glob matching, so pattern tests move to `case` — which is POSIX and does everything `[[ $x == pattern ]]` does.

In every other situation use `[[ ]]`. `shellcheck` will tell you which dialect it is checking, because it reads the shebang.
:::

## Summary

| Construct | Meaning | Note |
| --- | --- | --- |
| `if cmd; then … fi` | branches on exit status, 0 is true | no booleans anywhere in bash |
| `[` / `test` | a program; `]` is its last argument | arguments are expanded before it runs |
| `[: =: unary operator expected` | an unquoted empty variable | quote it, or use `[[ ]]` |
| `[: too many arguments` | an unquoted multi-word variable | same two fixes |
| `[[ ]]` | a bash keyword: no splitting, no globbing | supports `&&`, `\|\|`, `<`, `==`, `=~` |
| `-e -f -d -L -s -r -w -x -nt` | file tests | `-s` is "exists and is non-empty" |
| `-z -n = != < >` | string tests | `<` and `>` are *string* comparisons |
| `-eq -ne -lt -le -gt -ge` | numeric tests | or use `(( ))`, where `<` is arithmetic |
| `[[ $f == *.log ]]` | glob match | quoting the RHS makes it a literal |
| `[[ $f =~ $re ]]` | regex, captures in `BASH_REMATCH` | keep the regex in a variable, unquoted |
| `for x in {1..5}` / `runs/*/` / `"$@"` | range, directories, arguments | `{1..$n}` does not work; use `seq` |
| `while (( i < n ))` / `until` | arithmetic loops | `(( ))` is the natural numeric test |
| `while IFS= read -r line; do … done < <(cmd)` | read a stream line by line | `IFS=` and `-r` every time |
| `cmd \| while read …` | the loop runs in a subshell | variables set inside are lost |
| `case "$x" in pat) … ;; *) … ;; esac` | glob patterns, first match wins | always include `*)`; `;;` ends a branch |
| `break` / `continue` | leave / skip; take a level count | `break 2` leaves two loops |

Lesson 06 wraps these into functions: how a function returns a value, what its exit status means, and the exit-code conventions a script should follow so that the thing running it can tell what happened.
