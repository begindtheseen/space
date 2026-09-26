---
id: l03-variables-quoting-and-expansion
title: Variables, quoting, word splitting and globs
minutes: 20
covers:
  - Variables, quoting, word splitting, glob expansion
---

This is the lesson that decides whether your scripts are correct. In bash, quoting is not a matter of style. It changes *how many arguments* a command receives.

Picture a mail room with a sorting machine that cuts every label at the spaces. You hand it one parcel addressed to `entry burn 01`, and it delivers three parcels, to `entry`, `burn` and `01`. Nothing warns you. The command runs, part of it succeeds, and the output looks almost right. Quotes are the tape that tells the machine "this is one parcel — do not cut".

The mechanism is simple once you have seen it. Between the moment bash reads your line and the moment the program starts, the line goes through a fixed series of **expansions** — steps where bash replaces something you wrote with something else. Two of them, **word splitting** and **pathname expansion**, can change the number of arguments. Quoting is how you switch those two off. On a test campaign where five hundred run folders get processed overnight, this is the difference between five hundred results and four hundred ninety-eight results plus a summary that is quietly short.

All output below was produced on a real machine and pasted exactly, with GNU bash 5.2.21 on Ubuntu 24.04.4, as an ordinary user. The helper `bin/args.sh` used throughout prints exactly what arguments it received, one per line, inside angle brackets:

```bash
#!/usr/bin/env bash
printf 'argc=%d\n' "$#"
i=0; for a in "$@"; do i=$((i+1)); printf '  [%d] <%s>\n' "$i" "$a"; done
```

`argc` is the argument count. Printing arguments inside `< >` is a technique worth keeping for life. When a command behaves oddly, put `echo` or a script like this in front of it and look at what it was actually given.

## Assignment

A **variable** is a named box holding a piece of text. You fill it with `name=value`, and there must be **no spaces around the `=`**. A space turns the line into a command:

```bash
assignment_with_space = 1
```

```text
bash: assignment_with_space: command not found
```

Exit status 127. Bash read `assignment_with_space` as the name of a program to run, and `=` and `1` as its arguments. The same thing happens even after the variable exists, which makes it more confusing: `x=1; x = 1` prints `bash: x: command not found`.

The right-hand side of an assignment is one of the few places where quotes are *not* needed, because no word splitting happens there:

```bash
v="two words"; declare -p v; w=$v; declare -p w
```

```text
declare -- v="two words"
declare -- w="two words"
```

`w=$v` is safe even without quotes. `declare -p` prints a variable the way you would have to type it. That makes it the right tool for "what is really in this box?" — better than `echo`, which cannot show the difference between an empty value and an unset one.

Quote anyway. It costs nothing, it is right everywhere else, and a habit with exceptions is not a habit.

## The expansion sequence

Bash does its expansions in a **[[fixed order|expansion-order]]**:

1. **Brace expansion**: `{1..5}` becomes `1 2 3 4 5`.
2. In one left-to-right pass: **tilde expansion** (`~`, read "tilde", becomes your home folder), **parameter expansion** (`$var` becomes its value), **command substitution** (`$(…)` becomes a command's output) and **arithmetic expansion** (`$((…))` becomes a number).
3. **Word splitting** — cutting the result into separate words.
4. **Pathname expansion**, also called **globbing** — turning patterns like `*.log` into matching filenames.
5. **Quote removal** — the quote marks themselves are taken away.

Steps 3 and 4 matter most, because they are the only ones that change the *number* of words. And they act only on the results of *unquoted* expansions — never on text inside quotes.

### Word splitting

After `$var` is replaced by its value, bash cuts the result at every character listed in a special variable called **[[IFS|ifs-name]]**. By default that is space, tab and newline. You can see them with `cat -A`, which shows a tab as `^I` and a line end as `$`:

```bash
echo "IFS is [$IFS]" | cat -A
```

```text
IFS is [ ^I$
]$
```

A space, a tab (`^I`), and a newline. So watch what happens to a folder name with **[[spaces in it|split-picture]]**:

```bash
dir="entry burn 01"; ./bin/args.sh $dir
```

```text
argc=3
  [1] <entry>
  [2] <burn>
  [3] <01>
```

Three arguments. The variable holds one string; the command got three words. Now with double quotes:

```bash
dir="entry burn 01"; ./bin/args.sh "$dir"
```

```text
argc=1
  [1] <entry burn 01>
```

One argument, exactly as intended.

The same rule has a mirror image. An **empty** value, unquoted, does not become an empty argument — it vanishes completely:

```bash
e=""; ./bin/args.sh $e; ./bin/args.sh "$e"
```

```text
argc=0
argc=1
  [1] <>
```

So an unquoted empty variable leaves a command with one argument fewer than you wrote, and many programs quietly fall back to a default when an argument is missing.

`IFS` really is a variable, and changing it changes the cuts:

```bash
v="a:b c:d"; IFS=:; ./bin/args.sh $v; unset IFS
```

```text
argc=3
  [1] <a>
  [2] <b c>
  [3] <d>
```

With `IFS=:` the space is no longer a separator and the colon is. That is occasionally useful — splitting a `PATH`, or a colon-separated record — and otherwise a good way to break every other command in the script. Change it only for the line that needs it, and put it back (`unset IFS` restores the default).

Newlines split too. So a filename containing a newline — legal on Linux — can never be looped over safely from a command's text output:

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

After splitting, any word containing `*` (read "star": any run of characters), `?` (any one character) or `[…]` (any one of the listed characters) is treated as a **[[glob|glob-word]]** — a wildcard pattern — and matched against the files in the current folder. **This happens to the value of a variable too, not only to what you typed.** Whether it changes anything depends on which folder you are in:

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

Same variable, two different results. The first folder had no `.log` files, so the pattern was left alone; the second folder had two. A value that comes from a settings file, a command's output or a user's argument can contain a `*`, and then the command receives a list of filenames instead of the text you meant. Quotes stop it: `"$pattern"` is one argument, `*.log`, in both folders.

::: key Why you must write "$var" and not $var
Unquoted expansion undergoes word splitting on `IFS` and then glob expansion. A path containing a space becomes two arguments, and a value containing `*` expands against the directory. Quoting suppresses both.
:::

::: warning Bugs that depend on the data and the folder
Unquoted `$var` fails in ways that depend on the data *and* on the current folder. A script tested with `case_01` behaves differently the day someone names a run `entry burn 01`, and differently again the day a value contains a `*`. Neither shows up in testing, and both produce partial results instead of errors.

`shellcheck` flags every unquoted expansion as **[[SC2086|sc2086]]**, "Double quote to prevent globbing and word splitting". It is the warning it gives most often, and the one never to silence. Lesson 12 builds it into your workflow.
:::

::: example One loop, four ways, three of them wrong
A folder of run outputs where some names contain spaces — what you get from anything exported by a graphical program:

```bash
ls runs
```

```text
baseline
entry burn 01
entry burn 02
```

**Wrong way 1.** The form people reach for first. `for d in …; do …; done` runs the body once for each word in the list:

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

Seven loops for three folders. Step by step: `ls` **[[printed|ls-output]]** the names separated by newlines; the command substitution's output was word-split on `IFS`, cutting at every space too; and each piece was then glob-expanded for good measure.

**Wrong way 2.** Quoting the substitution does not fix it. `"$(ls runs)"` is one single word that contains newlines, so the loop runs once, with all three names glued together.

**Right way.** Use the glob directly. Bash hands the loop one word per matching name, however many spaces the names contain:

```bash
for d in runs/*; do echo "got <$d>"; done
```

```text
got <runs/baseline>
got <runs/entry burn 01>
got <runs/entry burn 02>
```

Three loops, correct names. Sanity check: three folders, three lines. **Wrong way 3** is to stop there — the loop *body* must quote too:

```bash
for d in runs/*; do wc -l $d/case.log; done
```

```text
1 runs/baseline/case.log
wc: runs/entry: No such file or directory
wc: burn: No such file or directory
wc: 01/case.log: No such file or directory
0 total
wc: runs/entry: No such file or directory
wc: burn: No such file or directory
wc: 02/case.log: No such file or directory
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

Notice the shape of the wrong output: it *worked* for the well-behaved folder and failed for the others. On a campaign of 500 runs where two have awkward names, that is 498 correct lines and a summary that is quietly short.
:::

::: key Why for f in $(ls) breaks
`ls` output is split on whitespace, so filenames with spaces become multiple words, and the output is also glob-expanded. Use a glob directly — `for f in ./*` — and quote `"$f"` wherever you use it.
:::

## Single quotes, double quotes, and none

| Form | Parameter and command expansion | Word splitting and globbing |
| --- | --- | --- |
| `$var` | yes | **yes** |
| `"$var"` | yes | no |
| `'$var'` | **no** | no |

Double quotes still let `$` do its job:

```bash
echo "double: ${HOME} \$HOME $(echo sub)"
```

```text
double: /home/eng $HOME sub
```

Single quotes switch everything off:

```bash
echo 'single: ${HOME} $HOME $(echo sub)'
```

```text
single: ${HOME} $HOME $(echo sub)
```

Inside double quotes, three characters keep a special meaning: `$`, the backtick, and the backslash `\`. So `\$` is how you get a literal dollar sign. Inside single quotes *nothing* is special. That is why a single-quoted string cannot contain a single quote. You must close the quotes, add an escaped quote, and reopen: `'it'\''s'` gives `it's`, **[[three pieces joined|quote-pieces]]** into one word.

The rule that follows: **single-quote anything that belongs to another language.** An `awk` program, a `sed` command, a regular expression, a `jq` filter, a `find -name` pattern — all of them use `$`, `*` and backslashes for their own purposes, and double quotes would let bash grab those characters first.

## When a glob matches nothing

By default, a pattern that matches nothing is left alone, as plain text:

```bash
for f in logs/*.nope; do echo "got <$f>"; done
```

```text
got <logs/*.nope>
```

One loop, with a filename that does not exist. Every loop over a glob has this bug unless you deal with it. Two shell options, switched on with `shopt -s`, do:

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

`nullglob` makes an unmatched pattern expand to nothing, so the loop runs zero times — right for "process whatever is there". `failglob` makes it an error with exit status 1 — right for "these files must exist". Without either, guard inside the loop with `[[ -e "$f" ]] || continue`, which skips any name that does not exist.

`nullglob` has its own hazard. A command like `cp *.log dest/` with no matching files becomes `cp dest/`, which fails in a different way. Switch it on around the loop that needs it, not for the whole script.

::: example Filenames that start with a dash
A glob or a variable can produce a name beginning with `-`, and programs then read it as an option. Make a folder called `-d` and enter it. The `--` (read "dash dash") means "no more options after this":

```bash
mkdir -p -- "-d"
cd -- "-d" && pwd
```

```text
/home/eng/work/-d
```

Now try it without the `--`:

```bash
cd "-d"
```

```text
bash: cd: -d: invalid option
cd: usage: cd [-L|[-P [-e]] [-@]] [dir]
```

Exit status 2. The quoting was perfect, and it made no difference. The problem is not word splitting: `cd` received exactly one argument, `-d`, and read it as a flag. The **[[end-of-options marker|double-dash]]** `--` tells almost every Unix program "everything after this is a name, not an option". It is the fix for `rm`, `cp`, `mv`, `ls`, `grep`, `cd` and the rest.

The other fix is to make the path not start with a dash: `./-d` names the same folder and cannot be mistaken for a flag. Use `--` for values from a variable, and `./` for globs: `rm -- "$file"`, `rm ./*.log`.

This matters more than it sounds. A file called `-rf` in a folder, plus a script that runs `rm *`, is a classic way to lose a whole directory tree. The glob puts `-rf` into `rm`'s argument list, and `rm` reads it as "recursive, force".
:::

::: key Quoting summary
Unquoted `$var` is word-split on `IFS` and then glob-expanded against the current directory; `"$var"` is neither; `'$var'` is not even expanded. Assignments take no spaces around `=`. Iterate over a glob, never over `$(ls)`, and quote the variable inside the loop as well. An unmatched glob stays literal unless `nullglob` or `failglob` is set, and `--` stops a leading dash from being read as an option.
:::

## Check yourself

::: check
`cp $src $dst` works in testing and one day copies the wrong files. Give two different mechanisms, and write the corrected line.
:::

::: answer
First, word splitting. If `src` holds `entry burn 01/case.log`, the unquoted expansion becomes three arguments. `cp` is then called with four or more names and treats the last one as a destination folder — copying `burn` and `01/case.log` into `$dst` if they happen to exist, or failing partway through.

Second, pathname expansion. If either value contains `*`, `?` or `[`, bash matches it against the current folder *after* filling in the value. `src="*.log"` copies every log in the working directory, which is not the file the variable named. And because the matching depends on where the script was run from, the same script does different things in different folders.

The corrected line is `cp -- "$src" "$dst"`. The quotes stop both expansions; the `--` stops a value starting with a dash from being read as an option. If `src` really is meant to be a pattern, expand it on purpose into an array (lesson 04) instead of relying on an unquoted expansion.
:::

::: check
Why is `for f in $(ls *.log)` wrong even when no filename contains a space, and what should you write instead?
:::

::: answer
Three reasons, and only one is about spaces.

1. The output of `ls` is split on everything in `IFS`, including newline. A filename containing a newline, which is legal, becomes two loops.
2. The split pieces are then glob-expanded, so a filename containing `*` or `[` is replaced by whatever it matches, or mangled.
3. `ls` is a display program. It formats for people and has no promise to print one clean name per line for a machine to read.

Write `for f in *.log`. Bash expands the glob itself into one word per match, with no text step in between, so no character in a filename can ever change the number of loops. Quote at the point of use — `wc -l "$f"` — because the variable is still split when you expand it.

Add `shopt -s nullglob` if zero matches should mean zero loops; by default the unmatched pattern stays as text and the loop runs once with a name that does not exist. For a walk through subfolders, use `find … -print0 | while IFS= read -r -d '' f` or `find … -exec … +` from the previous module. Both separate names with the NUL byte, the one character a filename cannot contain.
:::

::: check
When should you use single quotes instead of double quotes, and what cannot appear inside a single-quoted string?
:::

::: answer
Use single quotes whenever the text belongs to another language and must reach it untouched. An `awk` program uses `$1` for its own first field; a `sed` command uses `\1` and `&`; a regular expression uses `*`, `?` and `[`; a `jq` filter uses `$` and `|`. Inside double quotes, bash would replace `$1` with its *own* first argument — usually nothing — before the tool ever saw it.

Use double quotes whenever you *want* a variable's value but not splitting or globbing, which is every ordinary `"$var"`.

A single-quoted string cannot contain a single quote, because nothing inside single quotes is special — not even a backslash. The idiom is close, escape, reopen: `'it'\''s'` is the pieces `it`, an escaped quote, and `s`, joined into `it's`. For an `awk` program that needs a quote, it is often cleaner to put the program in a file and run `awk -f prog.awk`, or to pass the value in with `-v` instead of pasting it into the program.
:::

::: check
A script runs `rm *.tmp` in a folder that contains no `.tmp` files. What happens by default, with `nullglob`, and with `failglob`?
:::

::: answer
**By default** the pattern matches nothing, so bash leaves it as plain text and runs `rm` on a file literally named `*.tmp`. `rm` reports `cannot remove '*.tmp': No such file or directory` and exits 1. Under `set -e` that stops the script, over something that is not an error.

**With `shopt -s nullglob`** the pattern expands to nothing, so the command becomes a bare `rm` with no names:

```text
rm: missing operand
Try 'rm --help' for more information.
```

Exit status 1 again — a different failure, and its message does not even mention the pattern. That is the hazard of `nullglob`: right for loops, wrong for commands that need at least one name.

**With `shopt -s failglob`** bash refuses before running anything: `bash: no match: *.tmp`, exit status 1, and `rm` never starts. That is the safest of the three when the files are expected to exist.

The form that handles every case is `rm -f -- *.tmp` with default globbing. It exits 0 and prints nothing, because `-f` makes a missing file a non-error. If you need to know whether anything was there, use a loop with `shopt -s nullglob` and count.
:::

::: check
`ls -weird.log` fails with `ls: invalid line width: 'eird.log'`. Explain, and give two ways to make it work.
:::

::: answer
`ls` read the argument as options. `-w` is its line-width option, which takes a value, so it read the rest of the word — `eird.log` — as that value and rejected it as not a number. Quoting cannot help, because the shell delivered exactly one argument, `-weird.log`. The misreading happens inside `ls`.

Two fixes. `ls -- -weird.log` uses the end-of-options marker, after which every argument is a name. Or write a path that does not start with a dash: `ls ./-weird.log`.

The general rule for scripts: put `--` before names that come from variables, globs or user input, on every program that accepts it — `rm -- "$f"`, `grep -- "$pattern" "$file"`, `cp -- "$src" "$dst"`. Start globs with `./` so no expansion can ever produce a leading dash. Both cost two characters and remove a whole family of failures, including the classic one where a file named `-rf` turns `rm *` into a recursive delete.
:::

## Summary

| Form | Behavior | Note |
| --- | --- | --- |
| `name=value` | no spaces around `=` | a space makes it a command: "command not found" |
| `w=$v` | no splitting on the right of an assignment | quote anyway, out of habit |
| `declare -p v` | print a variable as you would have to type it | tells empty from unset |
| expansion order | brace, then tilde/parameter/command/arithmetic, **word splitting**, **globbing**, quote removal | only the two in bold change the word count |
| `IFS` | space, tab, newline by default | change it for one line and restore it |
| `$var` | split, then glob-expanded | depends on the data *and* the current folder |
| `$var` when empty | vanishes: zero arguments | `"$var"` gives one empty argument |
| `"$var"` | expanded, not split, not globbed | the default choice |
| `'text'` | nothing is expanded | for awk, sed, regexes, jq; cannot contain `'` |
| SC2086 | shellcheck's unquoted-expansion warning | the most common; never silence it |
| `for f in $(ls)` | splits on whitespace, then globs | use `for f in ./*` |
| unmatched glob | left as plain text | `nullglob` gives nothing, `failglob` an error |
| `cmd -- "$x"` | end of options | for `rm`, `cp`, `mv`, `ls`, `grep`, `cd` |
| `./*` | a glob that cannot produce a leading dash | `rm ./*.log` |

Lesson 04 adds the three tools that let a script compute instead of only repeat: command substitution `$( )`, arithmetic `$(( ))`, and arrays — where quoting has one more rule that matters.

::: context expansion-order The assembly line inside bash
Every line you type passes through the same stations, in the same order. Only two of them can change how many words there are.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="6" y="20" width="64" height="44" rx="6" fill="#fff" stroke="#1f2a44"/>
    <text x="38" y="39">brace</text><text x="38" y="54">{1..3}</text>
    <rect x="76" y="20" width="76" height="44" rx="6" fill="#fff" stroke="#1f2a44"/>
    <text x="114" y="39">~  $var</text><text x="114" y="54">$( )  $(( ))</text>
    <rect x="158" y="20" width="64" height="44" rx="6" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
    <text x="190" y="39">word</text><text x="190" y="54">splitting</text>
    <rect x="228" y="20" width="64" height="44" rx="6" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
    <text x="260" y="39">globbing</text><text x="260" y="54">* ? [ ]</text>
    <rect x="298" y="20" width="56" height="44" rx="6" fill="#fff" stroke="#1f2a44"/>
    <text x="326" y="39">quote</text><text x="326" y="54">removal</text>
  </g>
  <text x="225" y="88" font-size="12" text-anchor="middle" fill="#b4232c">can change the number of words</text>
  <text x="225" y="104" font-size="12" text-anchor="middle" fill="#b4232c">skipped inside double quotes</text>
  <text x="180" y="134" font-size="12" text-anchor="middle" fill="#6c7a93">left to right: what you type → what the program receives</text>
</svg>
```

Quote removal comes last, which is why a program never sees your quote marks — only the words they protected.
:::

::: context ifs-name What IFS stands for
**IFS** means "Internal Field Separator". A *field* is one piece of a line, the way a spreadsheet row has one field per column. The same variable controls how the built-in `read` command cuts a line into pieces, which is why you will see `IFS= read -r line`: setting `IFS` to empty for that one command stops `read` from trimming spaces off the ends of the line.
:::

::: context split-picture One string, three arguments
The variable holds one piece of text. Unquoted, the space inside it becomes a cut line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">dir holds:</text>
  <rect x="90" y="6" width="130" height="22" fill="#fff" stroke="#1f2a44"/>
  <text x="155" y="21" font-size="12" text-anchor="middle" fill="#1f2a44">entry burn 01</text>
  <text x="10" y="64" font-size="12" fill="#1f2a44">$dir</text>
  <rect x="90" y="50" width="56" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="118" y="65" font-size="12" text-anchor="middle" fill="#1f2a44">entry</text>
  <rect x="154" y="50" width="50" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="179" y="65" font-size="12" text-anchor="middle" fill="#1f2a44">burn</text>
  <rect x="212" y="50" width="34" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="229" y="65" font-size="12" text-anchor="middle" fill="#1f2a44">01</text>
  <text x="262" y="65" font-size="12" fill="#b4232c">3 arguments</text>
  <text x="10" y="108" font-size="12" fill="#1f2a44">"$dir"</text>
  <rect x="90" y="94" width="130" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="155" y="109" font-size="12" text-anchor="middle" fill="#1f2a44">entry burn 01</text>
  <text x="262" y="109" font-size="12" fill="#1d6fd1">1 argument</text>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">each box is one argument the program receives</text>
</svg>
```
:::

::: context glob-word Why it is called a glob
In the earliest versions of Unix, the shell did not expand wildcards itself. It handed any command containing `*`, `?` or `[` to a separate little program named `glob` — short for "global" — which replaced the patterns with the matching filenames and then ran the command. The job later moved inside the shell, but the name stuck: a wildcard pattern is still called a glob, and expanding it is still "globbing".
:::

::: context sc2086 The warning you will see most
`shellcheck` is a program that reads a script without running it and points out likely bugs, each with a code like SC2086. Unquoted variables are so common, and so often harmless in testing, that SC2086 is the warning most people meet first. The right response is almost always to add the quotes. When you truly want splitting — rare — lesson 04 shows how to use an array instead, which keeps the intent visible.
:::

::: context ls-output ls is written for people
`ls` changes its output depending on where it is going. Printing to your terminal, GNU `ls` puts quotes around awkward names, so you see `'entry burn 01'`. Printing into a pipe or a command substitution, it prints the raw names, one per line, with nothing to mark where a name with a space or a newline begins and ends. Either way, it is a report for humans to read, not a list for a program to parse.
:::

::: context quote-pieces Building it's out of three pieces
Bash glues together quoted pieces that touch each other with no space between. That lets you switch quoting styles in the middle of one word.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <rect x="40" y="16" width="70" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="75" y="36">'it'</text>
    <rect x="116" y="16" width="60" height="30" fill="#f2b880" stroke="#1f2a44"/><text x="146" y="36">\'</text>
    <rect x="182" y="16" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/><text x="212" y="36">'s'</text>
    <text x="290" y="36">→ it's</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="75" y="66">quoted text</text>
    <text x="146" y="66">escaped quote</text>
    <text x="212" y="66">quoted text</text>
  </g>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">no spaces between the pieces, so bash joins them into one word</text>
</svg>
```
:::

::: context double-dash Where the -- rule comes from
The POSIX standard includes a set of guidelines for how command-line programs should read their arguments. One of them says that the first `--` which is not itself the value of an option marks the end of the options: everything after it is an ordinary argument, even if it starts with a dash. Nearly every standard Unix tool follows it, and so does bash's own `getopts`, which you will meet in lesson 08.
:::
