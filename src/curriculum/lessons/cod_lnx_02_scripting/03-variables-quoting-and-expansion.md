---
id: l03-variables-quoting-and-expansion
title: Variables, quoting, word splitting and globs
minutes: 18
covers:
  - Variables, quoting, word splitting, glob expansion
---

This is the lesson that decides whether your scripts are correct. Quoting is not a style question in bash; it changes how many arguments a command receives. A directory named `entry burn 01` is one path to you and three arguments to `wc` unless you quoted it, and nothing warns you — the command runs, half of it succeeds, and the output looks almost right.

The mechanism is simple once you have seen it. Between the moment bash finishes reading your line and the moment the program starts, the line goes through a fixed sequence of expansions, and two of them — **word splitting** and **pathname expansion** — can change the number of arguments. Quoting is how you switch those two off.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21 on Ubuntu 24.04.4, running as an ordinary user. The helper `bin/args.sh` used throughout is four lines and prints exactly what arguments it received:

```bash
#!/usr/bin/env bash
printf 'argc=%d\n' "$#"
i=0; for a in "$@"; do i=$((i+1)); printf '  [%d] <%s>\n' "$i" "$a"; done
```

Printing the arguments inside angle brackets is the technique, not just for this lesson. When a command behaves oddly, put `echo` or a script like this in front of it and look at what it was actually given.

## Assignment

`name=value`, and **no spaces around the `=`**. A space turns the line into a command:

```bash
assignment_with_space = 1
```

```text
bash: assignment_with_space: command not found
```

Exit status 127. Bash read `assignment_with_space` as a command name and `=` and `1` as its arguments. The same happens after a successful assignment, which makes the error even more confusing — `x=1; x = 1` prints `bash: x: command not found`.

The right-hand side of an assignment is one of the few places where quoting is *not* needed, because no word splitting happens there:

```bash
v="two words"; declare -p v; w=$v; declare -p w
```

```text
declare -- v="two words"
declare -- w="two words"
```

`w=$v` is safe even unquoted. `declare -p` prints a variable the way you would have to type it, which makes it the right tool for "what is actually in this variable" — better than `echo`, which throws away the distinction between an empty value and an unset one.

Quote anyway. It costs nothing, it is right everywhere else, and a habit with an exception is not a habit.

## The expansion sequence

In order, bash performs: brace expansion (`{1..5}`), tilde expansion (`~`), parameter expansion (`$var`), command substitution (`$(…)`) and arithmetic expansion (`$((…))`) — all at once, left to right — then **word splitting**, then **pathname expansion** (globbing), then quote removal.

The two that matter are the last two, because they are the only ones that change the *number* of words.

### Word splitting

After `$var` is replaced by its value, bash splits the result on the characters in `IFS` — by default space, tab and newline:

```bash
echo "IFS is [$IFS]" | cat -A
```

```text
IFS is [ ^I$
]$
```

A space, a tab (`^I`), and a newline. So:

```bash
dir="entry burn 01"; ./bin/args.sh $dir
```

```text
argc=3
  [1] <entry>
  [2] <burn>
  [3] <01>
```

Three arguments. The variable holds one string; the command got three words. Quote it:

```bash
dir="entry burn 01"; ./bin/args.sh "$dir"
```

```text
argc=1
  [1] <entry burn 01>
```

`IFS` really is a variable, and changing it changes the split:

```bash
v="a:b c:d"; IFS=:; ./bin/args.sh $v; unset IFS
```

```text
argc=3
  [1] <a>
  [2] <b c>
  [3] <d>
```

With `IFS=:` the space is no longer a separator and the colon is. That is occasionally useful — splitting a `PATH`, reading a colon-delimited record — and is otherwise a good way to break every other command in the script, so set it locally and put it back.

Newlines split too, which is why the output of a command containing a filename with a newline in it cannot be safely iterated:

```bash
v="one
two"; ./bin/args.sh $v
```

```text
argc=2
  [1] <one>
  [2] <two>
```

### Pathname expansion

After splitting, any word containing `*`, `?` or `[…]` is matched against the filesystem. **This happens to the value of a variable, not only to what you typed.** Whether it changes anything depends on the directory you are in:

```bash
pattern="*.log"; ./bin/args.sh $pattern
```

```text
argc=1
  [1] <*.log>
```

```bash
cd logs && pattern="*.log"; ./../bin/args.sh $pattern
```

```text
argc=2
  [1] <driver.log>
  [2] <run.log>
```

The same script, the same variable, two different results, because one directory contains matching files and the other does not. A value that arrives from a configuration file, a command's output or a user's argument can contain a `*`, and then the command receives a list of filenames instead of the string you meant. Quoting stops it: `"$pattern"` is one argument, `*.log`, in both directories.

::: warning
Unquoted `$var` therefore has a failure mode that depends on the data *and* on the working directory. A script tested with `case_01` behaves differently the day someone names a run `entry burn 01`, and again the day a value contains a `*`. Neither shows up in testing and both produce partial results rather than errors.

`shellcheck` flags every unquoted expansion as **SC2086, "Double quote to prevent globbing and word splitting"**, which is the most common warning it emits and the one never to suppress. Lesson 12 makes it part of the workflow.
:::

::: example One loop, four ways, three of them wrong
A directory of run outputs where one name contains spaces — which is what you get from anything exported by a GUI:

```bash
ls runs
```

```text
baseline
entry burn 01
entry burn 02
```

The form people reach for first:

```bash
for d in $(ls runs); do echo "got <$d>"; done
```

```text
got <baseline>
got <entry>
got <burn>
got <01>
got <entry>
got <burn>
got <02>
```

Seven iterations for three directories. `ls` printed names separated by newlines, the command substitution's output was word-split on `IFS`, and the pieces were then glob-expanded for good measure. This is why `for f in $(ls)` is wrong, and why quoting the substitution does not fix it either — `"$(ls runs)"` is one argument containing newlines, so the loop runs once.

Use the glob directly; bash hands the loop one word per match, however many spaces the names contain:

```bash
for d in runs/*; do echo "got <$d>"; done
```

```text
got <runs/baseline>
got <runs/entry burn 01>
got <runs/entry burn 02>
```

Three iterations, correct names. But the loop *body* must quote too:

```bash
for d in runs/*; do wc -l $d/case.log; done
```

```text
1 runs/baseline/case.log
wc: runs/entry: No such file or directory
wc: burn: No such file or directory
wc: 01/case.log: No such file or directory
0 total
```

The variable was split again at the point of use. The correct version differs by two characters:

```bash
for d in runs/*; do wc -l "$d/case.log"; done
```

```text
1 runs/baseline/case.log
1 runs/entry burn 01/case.log
1 runs/entry burn 02/case.log
```

Note the shape of the wrong output: it *worked* for the well-behaved directory and produced errors for the others, while still exiting with a total. On a campaign of 500 runs where two have awkward names, that is 498 correct lines and a summary that is quietly short.
:::

## Single quotes, double quotes, and none

| Form | Parameter and command expansion | Word splitting and globbing |
| --- | --- | --- |
| `$var` | yes | **yes** |
| `"$var"` | yes | no |
| `'$var'` | **no** | no |

```bash
echo "single: ${HOME} \$HOME $(echo sub)"
```

```text
single: /home/eng $HOME sub
```

```bash
echo 'single: ${HOME} $HOME $(echo sub)'
```

```text
single: ${HOME} $HOME $(echo sub)
```

Inside double quotes, `$`, backtick and backslash still mean something, and `\$` is how you get a literal dollar. Inside single quotes *nothing* is special, which is why a single-quoted string cannot contain a single quote — you must close, escape and reopen: `'it'\''s'`.

The rule that follows: **single-quote anything that belongs to another language.** An `awk` program, a `sed` expression, a regular expression, a `jq` filter, a `find -name` pattern — all of them use `$`, `*` and backslashes for their own purposes, and double quotes would let bash eat them first.

## When a glob matches nothing

By default an unmatched pattern is left alone, as literal text:

```bash
for f in logs/*.nope; do echo "got <$f>"; done
```

```text
got <logs/*.nope>
```

One iteration, with a filename that does not exist. Every loop over a glob has this bug unless you handle it. Two shell options do:

```bash
shopt -s nullglob
for f in logs/*.nope; do echo "got <$f>"; done
echo "(loop body ran zero times)"
```

```text
(loop body ran zero times)
```

```bash
shopt -s failglob
for f in logs/*.nope; do echo "got <$f>"; done
```

```text
bash: no match: logs/*.nope
```

`nullglob` makes an unmatched pattern expand to nothing, so the loop runs zero times — right for "process whatever is there". `failglob` makes it an error, exit status 1 — right for "these files must exist". Without either, guard inside the loop with `[[ -e "$f" ]] || continue`.

Note that `nullglob` has its own hazard: a command like `cp *.log dest/` with no matching files becomes `cp dest/`, which fails differently. Set it around the loop that needs it rather than globally.

::: example Filenames that start with a dash
A glob or a variable can produce a name beginning with `-`, and every program then reads it as an option.

```bash
mkdir -p -- "-d"
cd -- "-d" && pwd
```

```text
/home/eng/work/-d
```

Without the `--`:

```bash
cd "-d"
```

```text
bash: cd: -d: invalid option
cd: usage: cd [-L|[-P [-e]] [-@]] [dir]
```

Exit status 2. The quoting was perfect and it made no difference, because the problem is not word splitting — it is that `cd` parses its arguments and `-d` looks like a flag. `--` tells almost every Unix program "no more options; everything after this is an operand", and it is the fix for `rm`, `cp`, `mv`, `ls`, `grep`, `cd` and the rest.

The other fix is to make the path not start with a dash: `./-d` names the same directory and is unambiguous. Use `--` for values from a variable, and `./` for globs — `rm -- "$file"`, `rm ./*.log`.

This matters more than it sounds. A file called `-rf` in a directory, plus a script that runs `rm *`, is a classic way to lose a tree, because the shell hands `rm` a `-rf` it treats as flags.
:::

::: key
Unquoted `$var` is word-split on `IFS` and then glob-expanded against the current directory; `"$var"` is neither; `'$var'` is not even expanded. Assignments take no spaces around `=` and need no quoting on the right, but quote anyway. Iterate over a glob, never over `$(ls)`, and quote the variable inside the loop as well. An unmatched glob stays literal unless `nullglob` or `failglob` is set, and `--` stops a leading dash being read as an option.
:::

## Check yourself

::: check
`cp $src $dst` works in testing and one day copies the wrong files. Give two distinct mechanisms, and write the corrected line.
:::

::: answer
First, word splitting. If `src` holds `entry burn 01/case.log`, the unquoted expansion becomes three arguments, so `cp` is called with four or five operands and treats the last as a destination directory — copying `burn` and `01/case.log` into `$dst` if they happen to exist, or failing partway with the destination half-written.

Second, pathname expansion. If either value contains `*`, `?` or `[`, bash matches it against the current directory *after* substituting. `src="*.log"` copies every log in the working directory, which is not the file the variable named. And because matching depends on where the script was run from, the same script does different things in different directories.

The corrected line is `cp -- "$src" "$dst"`. The quotes stop both expansions; the `--` stops a value beginning with a dash from being read as an option. If `src` is genuinely meant to be a pattern, expand it deliberately into an array (lesson 04) rather than relying on an unquoted expansion.
:::

::: check
Why is `for f in $(ls *.log)` wrong even when no filename contains a space, and what should you write instead?
:::

::: answer
Three reasons, only one of which is about spaces. The output of `ls` is split on all of `IFS`, which includes newline — so a filename containing a newline, which is legal, becomes two iterations. The split pieces are then glob-expanded, so a filename containing `*` or `[` is replaced by whatever it matches, or silently mangled. And `ls` is a display program: it formats for terminals, may colourise, and has no obligation to emit one name per line in a machine-readable way.

Write `for f in *.log`. Bash expands the glob itself into one word per match, with no text stage in between, so no character in a filename can ever change the number of iterations. Quote at the point of use — `wc -l "$f"` — because the variable is still subject to splitting when you expand it.

Add `shopt -s nullglob` if zero matches should mean zero iterations, since the default leaves the unmatched pattern as literal text and the loop runs once with a filename that does not exist. For a recursive walk, `find … -print0 | while IFS= read -r -d '' f` or `find … -exec … +` from the previous module, both of which use NUL and are safe against every filename.
:::

::: check
When should you use single quotes rather than double quotes, and what cannot appear inside a single-quoted string?
:::

::: answer
Use single quotes whenever the text belongs to another language and must reach it untouched. An `awk` program uses `$1` for its own fields; a `sed` expression uses `\1` and `&`; a regular expression uses `*`, `?` and `[`; a `jq` filter uses `$` and `|`. In double quotes bash would expand `$1` to its own positional parameter — usually to nothing — before the tool ever saw it.

Use double quotes whenever you *want* the value of a variable but not splitting or globbing, which is every ordinary `"$var"`.

A single-quoted string cannot contain a single quote: there is no escape inside them, because nothing at all is special. The idiom is to close, escape and reopen — `'it'\''s'` is the four pieces `it`, an escaped quote, and `s`, concatenated into `it's`. For an `awk` program that must contain a quote, it is usually cleaner to put the program in a file and use `awk -f prog.awk`, or to pass the value in with `-v` rather than embedding it.
:::

::: check
A script does `rm *.tmp` in a directory that contains no `.tmp` files. What happens by default, with `nullglob`, and with `failglob`?
:::

::: answer
By default the pattern does not match, so bash leaves it as literal text and runs `rm *.tmp`. `rm` then reports `cannot remove '*.tmp': No such file or directory` and exits 1 — which under `set -e` stops the script, on a condition that is not an error.

With `shopt -s nullglob` the pattern expands to nothing, so the command becomes bare `rm` with no operands:

```text
rm: missing operand
Try 'rm --help' for more information.
```

Exit status 1 again — a different failure, and one whose message does not mention the pattern at all. This is the hazard of `nullglob`: it is right for loops and wrong for commands that need at least one operand.

With `shopt -s failglob` bash itself refuses before running anything: `bash: no match: *.tmp`, exit status 1, and `rm` is never invoked. That is the safest of the three when the files are expected to exist.

The form that handles all cases is `rm -f -- *.tmp` with default globbing, which exits 0 and prints nothing because `-f` makes a missing file a non-error — or, when you need to know whether anything was there, a loop with `shopt -s nullglob` and a count afterwards.
:::

::: check
`ls -weird.log` fails with `ls: invalid line width: 'eird.log'`. Explain, and give two ways to make it work.
:::

::: answer
`ls` parsed the argument as options: `-w` is its line-width flag, which takes a value, so it read the rest of the word — `eird.log` — as that value and rejected it as a number. Nothing about quoting helps, because the shell delivered exactly one argument, `-weird.log`; the interpretation happens inside `ls`.

Two fixes. `ls -- -weird.log` uses the conventional end-of-options marker, after which every argument is an operand. Or name the file with a path that does not start with a dash: `ls ./-weird.log`.

The general rule for scripts: use `--` before operands that come from variables, globs or user input, on every program that accepts it — `rm -- "$f"`, `grep -- "$pattern" "$file"`, `cp -- "$src" "$dst"`. Prefix globs with `./` so that no expansion can ever produce a leading dash in the first place. Both cost two characters and remove a whole class of failure, including the classic one where a file named `-rf` turns `rm *` into a recursive delete.
:::

## Summary

| Form | Behaviour | Note |
| --- | --- | --- |
| `name=value` | no spaces around `=` | a space makes it a command: "command not found" |
| `w=$v` | no splitting on the right of an assignment | quote anyway, out of habit |
| `declare -p v` | print a variable as you would have to type it | distinguishes empty from unset |
| expansion order | brace, tilde, parameter/command/arithmetic, **word splitting**, **globbing**, quote removal | only the last two change the word count |
| `IFS` | space, tab, newline by default | set it locally and restore it |
| `$var` | split, then glob-expanded | depends on the data *and* the current directory |
| `"$var"` | expanded, not split, not globbed | the default choice |
| `'text'` | nothing is expanded | for awk, sed, regexes, jq; cannot contain `'` |
| SC2086 | shellcheck's unquoted-expansion warning | the most common, never suppress it |
| `for f in $(ls)` | splits on newline, then globs | use `for f in *` |
| unmatched glob | left as literal text | `nullglob` → nothing, `failglob` → error |
| `cmd -- "$x"` | end of options | for `rm`, `cp`, `mv`, `ls`, `grep`, `cd` |
| `./*` | a glob that cannot produce a leading dash | `rm ./*.log` |

Lesson 04 adds the three constructs that let a script compute rather than merely repeat: command substitution `$( )`, arithmetic `$(( ))`, and arrays — where quoting has one more rule that matters.
