---
id: l08-getopts-and-arguments
title: A script's interface — getopts, arguments and here-docs
minutes: 21
covers:
  - 'getopts for flags, positional args, "$@" vs "$*"'
  - Here-docs and here-strings
---

Think of a microwave. It has buttons — a time, a power level, a start — so anyone can use it without opening the case. A script with its inputs typed into the code is a microwave with no buttons: it cooks one dish, for the person who wired it.

A script with an **interface** — `-c` to pick a channel, `-v` for more detail, a list of files at the end — gets used by other people, called from other scripts, and put on a schedule. That costs about fifteen lines, and bash has a builtin for it, `getopts`.

Two more subjects belong here. The first is one line long and causes a whole family of bugs: `"$@"` passes a script's arguments on unchanged, and `"$*"` does not. Every **wrapper script** you write — a small script whose job is to run another program, such as a simulator, a solver or a container — depends on getting that right. One wrong character turns `--out "entry burn 01"` into three arguments and a file called `entry`.

The second is the fixed text a script *contains* rather than receives. Usage messages, generated configuration files and small `awk` or Python programs inside a script arrive through **here-documents**, and one rule — whether you quoted the end marker — decides whether they work.

All output below was produced on a real machine and pasted exactly, with GNU bash 5.2.21, ShellCheck 0.11.0, GNU Awk 5.2.1, Python 3.11.15 and util-linux `getopt` 2.39.3 on Ubuntu 24.04.4.

## Positional parameters

When you run `./report.sh -v logs/run.log`, the words after the script's name arrive as a numbered **[[list of strings|argv-list]]**. Bash calls them **positional parameters**, because each one is known by its position:

- `$1`, `$2`, … are the first argument, the second, and so on;
- `$#` (read "dollar hash") is how many there are;
- `$0` is the script's own name, as it was typed.

**`shift`** throws away `$1` and moves everything down one place: the old `$2` becomes `$1`, and `$#` drops by one. `shift n` throws away `n` of them at once.

Bash also has two ways to say "all the arguments together": `"$@"` (read "dollar at") and `"$*"` (read "dollar star"). They look alike and they are not interchangeable. This test script prints what a function receives from each form. The function `show` prints its argument count, then each argument inside `< >` so you can see exactly where each one starts and ends:

```bash
#!/usr/bin/env bash
show() { printf 'argc=%d\n' "$#"; local i=0; for a in "$@"; do i=$((i+1)); printf '  [%d] <%s>\n' "$i" "$a"; done; }
echo '--- "$@"'; show "$@"
echo '--- "$*"'; show "$*"
echo '--- $@ (unquoted)'; show $@
echo '--- "$*" with IFS=|'; (IFS='|'; show "$*")
```

Run it with three arguments, the middle one containing a space — `./bin/args.sh alpha "two words" gamma`:

```text
--- "$@"
argc=3
  [1] <alpha>
  [2] <two words>
  [3] <gamma>
--- "$*"
argc=1
  [1] <alpha two words gamma>
--- $@ (unquoted)
argc=4
  [1] <alpha>
  [2] <two>
  [3] <words>
  [4] <gamma>
--- "$*" with IFS=|
argc=1
  [1] <alpha|two words|gamma>
```

Read the four results slowly:

- `"$@"` gives **one word per argument**, with the boundaries intact. Three in, three out.
- `"$*"` glues everything into **one word**, with the first character of **[[IFS|ifs]]** between the pieces. IFS is the shell's list of separator characters, and it starts with a space.
- Changing `IFS` to `|` changes the glue: `alpha|two words|gamma`. So `"$*"` suits a message to print, never arguments to pass on.
- Unquoted `$@` hands over each argument and then **word-splits** it — chops it at spaces — which is how three arguments became four.

A **[[side-by-side picture|at-versus-star]]** shows all three. This is the same distinction as `"${arr[@]}"` versus `"${arr[*]}"` from lesson 04, and for the same reason: to bash, the positional parameters are a list, just as an array is.

::: key "$@" vs "$*"
`"$@"` expands to one shell word per argument, preserving argument boundaries. `"$*"` joins all arguments into a single word separated by the first character of `IFS`. Forwarding arguments always uses `"$@"`.
:::

::: example A wrapper that forwards its arguments
Wrapping a simulator to add a common flag, or to run it under a profiler, is the most common kind of script in an engineering repository. It is also where `$*` does its damage. This wrapper passes its arguments to a stand-in function `inner` twice — once correctly, once not:

```bash
#!/usr/bin/env bash
set -euo pipefail
inner() { printf 'inner argc=%d\n' "$#"; local i=0; for a in "$@"; do i=$((i+1)); printf '  [%d] <%s>\n' "$i" "$a"; done; }
echo 'forwarding with "$@":'; inner "$@"
echo 'forwarding with $*:';  inner $*
```

```bash
./bin/forward.sh --out "entry burn 01" --seed 42
```

```text
forwarding with "$@":
inner argc=4
  [1] <--out>
  [2] <entry burn 01>
  [3] <--seed>
  [4] <42>
forwarding with $*:
inner argc=6
  [1] <--out>
  [2] <entry>
  [3] <burn>
  [4] <01>
  [5] <--seed>
  [6] <42>
```

Count them. The user typed four arguments. `"$@"` delivered four. `$*` delivered six, because the output name was cut at its spaces.

A real simulator given the second list would write to a file called `entry`, then complain about two unknown arguments, `burn` and `01` — a message that sends you reading the simulator's code, the wrong place.

**Forwarding arguments is always `"$@"`.** There is no case where `$*` or unquoted `$@` is right for this, and `shellcheck` flags both.
:::

## `getopts`

An **option** (or **flag**) is an argument that starts with a dash and changes how the script behaves: `-v`, `-c WHEEL_RPM`. An **operand** is the thing the script works on, like a file name. `getopts` is the bash builtin that reads short, one-letter options for you. You call it in a `while` loop, and each time round it hands you the next option:

```bash
while getopts ":c:t:v" opt; do
  case "$opt" in
    c) channel="$OPTARG" ;;
    t) threshold="$OPTARG" ;;
    v) verbose=1 ;;
    :)  echo "report.sh: option -$OPTARG requires an argument" >&2; usage ;;
    \?) echo "report.sh: unknown option -$OPTARG" >&2; usage ;;
  esac
done
shift $((OPTIND - 1))
```

Here is what each piece does.

- The **option string** `":c:t:v"` lists the letters the script accepts. A colon *after* a letter means that option takes a value: `-c` and `-t` do, `-v` does not.
- A colon at the **start** of the string turns on **silent error reporting**. `getopts` then prints nothing itself, which lets you write your own messages.
- `$opt` is the letter found this time round. `$OPTARG` is that option's value, if it takes one.
- With silent reporting on, a missing value sets `opt` to `:` and puts the letter in `OPTARG`. An unknown option sets `opt` to `?`, again with the letter in `OPTARG`. In the `case`, `?` is written `\?`, because a bare `?` is a pattern meaning "any one character" and would match everything.
- Without the leading colon, `getopts` prints its own short message and you lose the chance to print a usage summary.
- **`OPTIND`** is the position of the next argument `getopts` will look at. After the loop, **`shift $((OPTIND - 1))`** throws away everything `getopts` used, so `$1`, `"$@"` and `$#` afterwards mean the operands only. **[[Watching OPTIND move|optind-walk]]** makes the `- 1` clear.

::: example A complete option parser
Here is the loop inside a whole script, with a usage message and a check that at least one file was given:

```bash
#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage: report.sh [-c CHANNEL] [-t THRESHOLD] [-v] [--] LOGFILE...
  -c CHANNEL    only this channel (default: all)
  -t THRESHOLD  flag values above this (default: none)
  -v            verbose
USAGE
  exit 2
}

channel=""; threshold=""; verbose=0

while getopts ":c:t:v" opt; do
  case "$opt" in
    c) channel="$OPTARG" ;;
    t) threshold="$OPTARG" ;;
    v) verbose=1 ;;
    :)  echo "report.sh: option -$OPTARG requires an argument" >&2; usage ;;
    \?) echo "report.sh: unknown option -$OPTARG" >&2; usage ;;
  esac
done
shift $((OPTIND - 1))

(( $# >= 1 )) || usage

echo "channel=[$channel] threshold=[$threshold] verbose=$verbose"
echo "remaining arguments: $#"
i=0; for f in "$@"; do i=$((i+1)); printf '  [%d] <%s>\n' "$i" "$f"; done
```

Ordinary use:

```bash
./bin/report.sh -v -c WHEEL_RPM -t 5000 logs/run.log logs/driver.log
```

```text
channel=[WHEEL_RPM] threshold=[5000] verbose=1
remaining arguments: 2
  [1] <logs/run.log>
  [2] <logs/driver.log>
```

Five words were options or option values (`-v`, `-c`, `WHEEL_RPM`, `-t`, `5000`), so `OPTIND` ended at 6, the shift removed 5, and two file names were left. That matches "remaining arguments: 2".

Flags may be bundled into one word, `-vc`. A value may follow as the next word or be glued to its letter — `-vc WHEEL_RPM` and `-vcWHEEL_RPM` give the same result:

```bash
./bin/report.sh -vc WHEEL_RPM logs/run.log
```

```text
channel=[WHEEL_RPM] threshold=[] verbose=1
remaining arguments: 1
  [1] <logs/run.log>
```

The two error paths both exit with status 2:

```bash
./bin/report.sh -t
```

```text
report.sh: option -t requires an argument
usage: report.sh [-c CHANNEL] [-t THRESHOLD] [-v] [--] LOGFILE...
  ...
```

```bash
./bin/report.sh -z logs/run.log
```

```text
report.sh: unknown option -z
usage: report.sh [-c CHANNEL] [-t THRESHOLD] [-v] [--] LOGFILE...
  ...
```

Finally, `--` (read "dash dash") means "end of options". Anything after it is an operand, even if it starts with a dash:

```bash
./bin/report.sh -v -- -weird.log
```

```text
channel=[] threshold=[] verbose=1
remaining arguments: 1
  [1] <-weird.log>
```

The script passes `shellcheck` with no warnings. `usage` writes to standard error and exits 2, the convention from lesson 06: 2 tells a caller "you called me wrongly", not "the work failed".
:::

::: warning `getopts` stops at the first operand
`getopts` stops at the first argument that is not an option, and it does **not** reorder anything:

```bash
./bin/report.sh logs/run.log -v
```

```text
channel=[] threshold=[] verbose=0
remaining arguments: 2
  [1] <logs/run.log>
  [2] <-v>
```

`-v` was never read as an option. It is sitting in `"$@"` as an operand, and the script will try to open a file called `-v`.

Many GNU tools **permute** — shuffle options to the front — so `grep pattern file -i` works, and that habit makes this surprising. The **[[POSIX|posix]]** standard does not require it and `getopts` does not do it. So: **options come before operands**, and the usage message should say so. If you really need options anywhere, you have outgrown `getopts`.

One more trap: `OPTIND` is an ordinary shell variable and it keeps its value. If you parse options twice in one shell — in a function called more than once, or after resetting the positional parameters with `set --` — set `OPTIND=1` first, or the second parse starts in the middle.
:::

## Long options

`getopts` handles single letters only. There is no `--verbose`. You have three ways forward, in order of how often each is the right answer.

**Do without them.** Short options are enough for most in-house tools.

**Parse them by hand** with a `while` loop and a `case` over `"$@"`, as most real scripts do. The loop looks at `$1`, acts on it, and shifts it away, until nothing is left:

```bash
while (( $# )); do
  case "$1" in
    --help)  echo "  saw --help"; shift ;;
    --out)   echo "  saw --out with value <${2:?--out needs a value}>"; shift 2 ;;
    --)      shift; break ;;
    -*)      echo "  unknown long option $1" >&2; exit 2 ;;
    *)       break ;;
  esac
done
```

`(( $# ))` is true while any arguments remain. The test script prints the count before and the operands after:

```bash
./bin/shifting.sh --help --out "entry burn 01" -- logs/run.log
```

```text
start: $#=5 $1=--help
  saw --help
  saw --out with value <entry burn 01>
after parsing: $#=1
  operand [1] <logs/run.log>
```

Five arguments at the start. `shift` removed `--help`, `shift 2` removed `--out` and its value, and the `--` case removed one more: 5 − 1 − 2 − 1 = 1 left, as printed.

`${2:?message}` from lesson 02 turns a missing value into an error in your own words:

```bash
./bin/shifting.sh --out
```

```text
start: $#=1 $1=--out
./bin/shifting.sh: line 7: 2: --out needs a value
```

The `*) break` case stops at the first operand, like `getopts`, and `--` ends the options on request.

**Use `getopt(1)`** — the separate program, not the builtin. It does support long options and reordering. The version installed here is `getopt from util-linux 2.39.3`. The **[[BSD getopt|getopt-history]]** on macOS is a different and much weaker program, so a script that uses it is not portable. Most projects decide the hand-written loop is less trouble.

## Here-documents

A **here-document** feeds lines of text, written right there in the script, to a command's standard input. You start it with `<<` and a marker word of your choice, and it ends at a line holding only that word. The usage function above is the most common use. The second most common is generating a file:

```bash
cat > etc/gen.conf <<EOF
# generated by $0 at $(date -u +%FT%TZ)
vehicle = falcon9-s1
dt      = $dt
EOF
```

**How you write the marker decides whether the body is expanded.** Written plain, as `<<EOF`, the body behaves like a double-quoted string: `$var`, `$(cmd)` and backslashes all do their usual work.

```bash
dt=0.001; cat <<EOF
generated for dt=$dt
EOF
```

```text
generated for dt=0.001
```

Written quoted, as `<<'EOF'`, nothing is expanded. The text arrives exactly as typed:

```bash
dt=0.001; cat <<'EOF'
literal $dt and $(date)
EOF
```

```text
literal $dt and $(date)
```

That is the whole rule. A generated configuration wants the plain form, so values are filled in. A program in another language wants the quoted form, because `$1`, `$4` and `\1` belong to `awk` or `sed`, and bash would otherwise swallow them first:

```bash
awk -f /dev/stdin logs/run.log <<'AWKPROG'
{ n[$0]++ }
END { printf "%d distinct lines\n", length(n) }
AWKPROG
```

```text
400 distinct lines
```

The log has 400 lines and every one is different, so the count is right. The same trick runs a few lines of Python, here converting a **[[reaction wheel|reaction-wheel]]** speed from revolutions per minute to revolutions per second:

```bash
python3 - 4187.0 <<'PYPROG'
import sys
v = float(sys.argv[1])
print(f'{v:.2f} rpm = {v/60:.3f} rev/s')
PYPROG
```

```text
4187.00 rpm = 69.783 rev/s
```

Check: 4187 ÷ 60 = 69.783, as printed. Notice `python3 -` and `awk -f /dev/stdin`. Both mean "read the program from **[[standard input|dash-means-stdin]]**", which is exactly what the here-document supplies. Arguments after that reach the program as usual, which is how `4187.0` became `sys.argv[1]`.

::: warning The end marker must stand alone at the start of its line
The closing marker must be at the very **start of its line**, with nothing after it — not even a space. Inside an indented function that looks ugly. `<<-` is the fix: it strips leading **tabs** (not spaces) from each body line and from the marker line. Here is a usage message written that way, shown with `cat -A`, where `^I` is a tab and `$` marks the end of each line:

```text
^Icat >&2 <<-USAGE$
^I^Iusage: report.sh [-v] LOGFILE$
^I^I  -v  verbose$
^IUSAGE$
```

```text
usage: report.sh [-v] LOGFILE
  -v  verbose
```

The two-space indent inside the text survives, because only tabs are stripped. An editor set to turn tabs into spaces silently breaks this, which is why many people avoid `<<-` and keep the marker at the left edge.

Get the marker wrong and bash reads to the end of the file looking for it:

```text
bin/unterm.sh: line 3: warning: here-document at line 2 delimited by end-of-file (wanted `EOF')
line one
```

An indented marker without `<<-` gives the same warning and then a real syntax error, because the rest of the script was swallowed into the here-document:

```text
bin/ind2.sh: line 7: warning: here-document at line 3 delimited by end-of-file (wanted `USAGE')
bin/ind2.sh: line 8: syntax error: unexpected end of file
```

`shellcheck` catches these before you ever run the script: SC1044 "Couldn't find end token `EOF' in the here document", and for the indented case SC1039 "Remove indentation before end token (or use <<- and indent with tabs)".
:::

## Here-strings

**`<<<`** (read "here-string") is the one-line form. It feeds a single string to a command's standard input, adding a newline at the end:

```bash
grep -o "chan=[A-Z_]*" <<< "t=0.5 chan=WHEEL_RPM val=4187.0"
```

```text
chan=WHEEL_RPM
```

It replaces `echo "$x" | cmd`, with one real advantage: **no subshell**. The `while read` loop from lesson 05 loses its variables on the right of a pipe; with a here-string or a `<` redirect it keeps them. The same goes for `mapfile`, which reads lines into an array:

```bash
mapfile -t lines <<< "$(printf 'a\nb\n')"; declare -p lines
```

```text
declare -a lines=([0]="a" [1]="b")
```

`read` with `-d ''` reads input separated by NUL bytes — the zero byte that can never appear in a file name. It is the safe partner for `find -print0` from the previous module:

```bash
printf 'a\0b\0' | while IFS= read -r -d '' x; do echo "<$x>"; done
```

```text
<a>
<b>
```

::: warning `read` never complains about the wrong number of fields
A here-string is **one string**, and `read` splits it on `IFS` — which may not be where you meant to split it. The first line of the log is `t=0.5 chan=WHEEL_RPM val=4187.0`. Turn each `=` into a space and read three variables:

```bash
read -r t chan val <<< "$(head -1 logs/run.log | tr '=' ' ')"
echo "t=$t chan=$chan val=$val"
```

```text
t=t chan=0.5 val=chan WHEEL_RPM val 4187.0
```

Replacing `=` with spaces made six words for three variables. `read` gave the first word to `t`, the second to `chan`, and put **everything left over** into the last one. That is documented behavior, and almost never what the author meant.

Either name all six fields, using `_` (a throwaway name, lesson 05) for the ones you do not want, or set `IFS` to the real separators for that one `read`:

```bash
IFS='= ' read -r _ t _ chan _ val <<< "$line"
```

With `line` holding that first log line, this gives `t=0.5 chan=WHEEL_RPM val=4187.0`.

The general lesson: `read` quietly overfills or underfills, so a change in the input's shape gives wrong values rather than an error.
:::

::: key
`"$@"` is one word per argument and is the only correct way to forward them; `"$*"` joins them into one word using `IFS`'s first character. `getopts ":c:t:v" opt` parses short options — a trailing colon means the option takes a value, a leading colon enables your own error messages via the `:` and `\?` cases — and `shift $((OPTIND - 1))` afterwards leaves the operands in `"$@"`. Options must come before operands, and `--` ends them.
:::

## Check yourself

::: check
A wrapper script ends with `exec ./sim $*` and works until someone passes `--out "run 01"`. Explain what the simulator receives, and give the fix.
:::

::: answer
`$*` joins all the arguments into one string with spaces between. Because it is unquoted, that string is then word-split on `IFS`, and each piece is glob-expanded. So the two arguments `--out` and `run 01` become three words: `--out`, `run`, `01`. The simulator gets an output path of `run`, then an argument it does not recognize.

Worse, glob expansion replaces a value containing `*` with matching file names, so the wrapper behaves differently depending on the folder it runs in.

The fix is `exec ./sim "$@"`. That gives exactly the arguments the wrapper received, one word each, with no splitting and no globbing — including empty-string arguments, which `$*` also loses. (`exec` replaces the wrapper with the simulator; see the note on **[[exec|exec-replaces]]**.)

If the wrapper needs to add flags of its own, build them as an array and expand both: `extra=(--profile entry); exec ./sim "${extra[@]}" "$@"`.
:::

::: check
Why does the option string `":c:t:v"` begin with a colon, and what changes if you remove it?
:::

::: answer
A leading colon turns on **silent error reporting**. `getopts` then prints nothing of its own and reports problems through the loop variable instead:

- a missing option value sets the variable to `:` and puts the letter in `OPTARG`;
- an unknown option sets it to `?` and also puts the letter in `OPTARG`.

The script can then print its own message and usage summary, and pick its own exit code.

Without the leading colon, `getopts` prints a short message itself — something like `illegal option` or `option requires an argument` — and sets the variable to `?` in *both* cases, with `OPTARG` unset. You can no longer tell the two errors apart or choose the wording, and the user gets no usage summary.

The colons *after* letters are a separate thing: they mark options that take a value. So `":c:t:v"` means silent reporting; `-c` takes a value; `-t` takes a value; `-v` does not.
:::

::: check
`./report.sh logs/run.log -v` silently ignores `-v`. Explain, and give two ways to handle it.
:::

::: answer
`getopts` works left to right and stops at the first argument that is not an option. `logs/run.log` is not an option, so parsing ends there. `-v` is never examined and stays in the positional parameters as an operand. After `shift $((OPTIND - 1))` the script sees two operands, one of them `-v`, and will probably try to open it as a file.

This is standard POSIX behavior. Many GNU programs shuffle their arguments so options may appear anywhere, which is why it surprises people.

Two ways to handle it:

1. **Document it.** Write `[options] FILE...` in the usage message, and check the operands, rejecting any that start with `-` unless they came after `--`. That is honest and costs nothing.
2. **Parse by hand** with a `while`/`case` loop over `"$@"`, which lets you accept options after operands if you really want to — at the price of writing the reordering yourself.

A third route, `getopt(1)` from util-linux, does reorder. It does not exist in the same form on macOS, so a script that uses it is not portable.
:::

::: check
What does `shift $((OPTIND - 1))` do, and what breaks if you leave it out?
:::

::: answer
After the loop, `OPTIND` is the position of the next argument `getopts` would look at — one past the last option or option value it used. Shifting by `OPTIND - 1` throws away exactly those words. Then `$1` is the first operand and `$#` is the number of operands.

Leave it out, and `"$@"` still holds all the flags:

- `$#` is the total argument count, not the operand count, so a check like `(( $# >= 1 ))` passes even when no file was given;
- a `for f in "$@"` loop tries to open `-v` and `WHEEL_RPM` as files;
- passing `"$@"` on to another program hands it the script's own flags.

None of that crashes. The script runs and works on the wrong things. And remember to set `OPTIND=1` before a second parse in the same shell, since it keeps its value.
:::

::: check
When should a script use `"$*"` rather than `"$@"`?
:::

::: answer
When you want the arguments as one string for a person to read, not as a list for a program to receive.

Logging is the main case: `echo "running: $0 $*"` makes one readable line.

The second case is when you want a joined value with a separator you choose, which `IFS` controls: `(IFS=','; echo "${channels[*]}")` turns an array into a comma-separated list. The parentheses run it in a subshell, so `IFS` goes back to normal afterwards.

It is never right for passing arguments on, for building a command line, or for looping. `for a in "$*"` runs exactly once, with everything glued together — a silent and confusing bug.

One caution about logging: `"$*"` loses the argument boundaries, so if an argument contained a space, you cannot copy the logged line and re-run it. `printf '%q ' "$@"` prints each argument shell-quoted — `a "b c"` comes out as `a b\ c` — which can be pasted back, and is the better choice when the log must be reproducible.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `$1 $2 … $# $0` | arguments, count, script name | `$0` is the path as typed |
| `shift`, `shift n` | drop and renumber arguments | `shift 2` for a flag and its value |
| `"$@"` | one word per argument | the only correct way to forward |
| `"$*"` | one word, joined by `IFS`'s first character | for log messages, never for arguments |
| `$@` unquoted | per argument, then split and globbed | never correct |
| `getopts ":c:t:v" opt` | parse short options in a loop | trailing colon = takes a value |
| leading `:` in the option string | silent errors, handled by you | `:` case = missing value, `\?` case = unknown option |
| `$OPTARG` | the option's value, or the offending letter | depends on which case fired |
| `shift $((OPTIND - 1))` | remove the parsed options | without it, `"$@"` still holds the flags |
| `OPTIND=1` | reset before a second parse | it keeps its value |
| options before operands | `getopts` stops at the first operand | no reordering; say so in the usage |
| `--` | end of options | lets an operand start with a dash |
| long options | not supported by `getopts` | hand-written `while`/`case`, or `getopt(1)` |
| `usage() { … >&2; exit 2; }` | diagnostics to stderr, code 2 | tells misuse apart from failure |
| `printf '%q ' "$@"` | shell-quoted arguments for a log | can be pasted back and re-run |
| `<<EOF` | here-doc, body expanded like a double-quoted string | for generated configuration |
| `<<'EOF'` | here-doc, nothing expanded | for embedded awk, sed, Python |
| `<<-EOF` | strips leading **tabs** from body and marker | breaks if the editor turns tabs into spaces |
| unterminated here-doc | `delimited by end-of-file (wanted 'EOF')` | shellcheck SC1044 catches it first |
| `cmd <<< "$s"` | here-string: one line of input, no subshell | `mapfile` and `read` keep their variables |
| `read -r -d ''` | NUL-separated input | pairs with `find -print0` |
| `read` field count | silently overfills or underfills | set `IFS`, or name every field |

Lesson 09 leaves the shell's own syntax and starts on the text tools a script spends most of its time running, beginning with `sed`.

::: context argv-list How arguments reach a program
The shell does the splitting and quoting *before* your script starts. Then it asks the kernel to run the script with a finished list of separate strings. Your script never sees the quotes you typed. It sees only where each string begins and ends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">typed: ./report.sh -v "my log.txt"</text>
  <rect x="10" y="36" width="100" height="30" fill="#fff" stroke="#1f2a44"/>
  <rect x="110" y="36" width="60" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="170" y="36" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">./report.sh</text>
  <text x="140" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">-v</text>
  <text x="230" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">my log.txt</text>
  <text x="60" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">$0</text>
  <text x="140" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">$1</text>
  <text x="230" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">$2</text>
  <text x="325" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">$# = 2</text>
</svg>
```

`$0` is in the list but is not counted by `$#`.
:::

::: context ifs The separator list
**IFS** stands for "internal field separator". It is an ordinary shell variable holding the characters bash splits words on. By default it holds three: a space, a tab and a newline, in that order.

Because the space comes first, `"$*"` normally glues arguments together with spaces. Put a comma first and it glues with commas. Word splitting of unquoted expansions uses the same variable, which is why changing `IFS` for a whole script has such wide side effects — keep the change inside a subshell or a single `read`.
:::

::: context at-versus-star Three ways to hand on a list
The same three arguments passed on three ways. Each box is one word the receiving command gets.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="12" fill="#1f2a44">"$@"</text>
  <rect x="80" y="14" width="60" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="146" y="14" width="90" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="242" y="14" width="60" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="110" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">alpha</text>
  <text x="191" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">two words</text>
  <text x="272" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">gamma</text>
  <text x="330" y="30" font-size="11" fill="#1d6fd1">3</text>
  <text x="10" y="72" font-size="12" fill="#1f2a44">"$*"</text>
  <rect x="80" y="56" width="222" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="191" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">alpha two words gamma</text>
  <text x="330" y="72" font-size="11" fill="#1d6fd1">1</text>
  <text x="10" y="114" font-size="12" fill="#1f2a44">$@</text>
  <rect x="80" y="98" width="52" height="24" fill="#fff" stroke="#b4232c"/>
  <rect x="138" y="98" width="46" height="24" fill="#fff" stroke="#b4232c"/>
  <rect x="190" y="98" width="52" height="24" fill="#fff" stroke="#b4232c"/>
  <rect x="248" y="98" width="54" height="24" fill="#fff" stroke="#b4232c"/>
  <text x="106" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">alpha</text>
  <text x="161" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">two</text>
  <text x="216" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">words</text>
  <text x="275" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">gamma</text>
  <text x="330" y="114" font-size="11" fill="#b4232c">4</text>
</svg>
```
:::

::: context optind-walk Watching OPTIND move
Take `report.sh -v -c WHEEL_RPM run.log`. `OPTIND` starts at 1. `-v` is used, so it moves to 2. `-c` and its value use two words, so it moves to 4. Word 4 is `run.log`, not an option, so the loop ends with `OPTIND` = 4.

Three words were options, and $4 - 1 = 3$ is exactly how many `shift` must remove.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="60" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="80" y="30" width="60" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="140" y="30" width="100" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="240" y="30" width="90" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">-v</text>
  <text x="110" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">-c</text>
  <text x="190" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">WHEEL_RPM</text>
  <text x="285" y="49" font-size="12" text-anchor="middle" fill="#1f2a44">run.log</text>
  <text x="50" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">1</text>
  <text x="110" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">2</text>
  <text x="190" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">3</text>
  <text x="285" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">4</text>
  <line x1="285" y1="92" x2="285" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <text x="285" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">OPTIND = 4</text>
  <text x="130" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">shift 3 removes these</text>
</svg>
```
:::

::: context posix The common rulebook
**POSIX** is a set of standards, first published by the IEEE in 1988, that says what a Unix-like system must provide: which commands exist, which options they take, and how the shell behaves. Code that sticks to POSIX runs on Linux, macOS and the BSDs alike.

GNU tools follow POSIX and then add extras, such as reordering arguments. Those extras are handy, but a script that relies on them may break on another system.
:::

::: context getopt-history Two programs called getopt
The old `getopt` program, still the one on macOS, cannot cope with arguments that contain spaces or are empty: it splits or drops them. The util-linux version on Linux is an "enhanced" rewrite that adds long options, reordering and safe quoting of its output.

A script can ask which one it has: `getopt --test` exits with status 4 on the enhanced version.
:::

::: context reaction-wheel The number in the example
A **reaction wheel** is a heavy flywheel inside a satellite. Spinning it faster one way turns the spacecraft the other way, which is how many satellites point their cameras and antennas without using fuel. Wheels typically run at a few thousand revolutions per minute.

Dividing by 60 turns a per-minute rate into a per-second one: $4187 / 60 \approx 69.8$ turns every second.
:::

::: context dash-means-stdin A dash for "read from the pipe"
Many programs accept a single `-` in place of a file name to mean "read standard input instead". `python3 -` reads its program from standard input, and so does `cat -`.

`/dev/stdin` is the same idea written as a path: on Linux it is a name that always leads to the current process's standard input. It helps with programs like `awk -f` that expect a real file name.
:::

::: context exec-replaces What exec does to a wrapper
`exec ./sim "$@"` does not start the simulator as a child. It *replaces* the running wrapper with it, keeping the same process id.

That has two quiet benefits. A signal sent to the wrapper's process id reaches the simulator directly, with no shell in between. And the simulator's exit status becomes the wrapper's, with nothing left afterwards to change it. The price: any line after `exec` never runs, and an `EXIT` trap in the wrapper does not fire.
:::
