---
id: l08-getopts-and-arguments
title: A script's interface — getopts, arguments and here-docs
minutes: 18
covers:
  - 'getopts for flags, positional args, "$@" vs "$*"'
  - Here-docs and here-strings
---

A script that hard-codes its inputs is used once. A script with an interface — `-c` for the channel, `-v` for verbose, a list of files at the end — is used by other people, called from other scripts, and put in a scheduler. The cost of that interface is about fifteen lines, and bash has a builtin for it.

Two more subjects belong with it. The first is one line long and accounts for a whole class of bug: `"$@"` forwards a script's arguments unchanged and `"$*"` does not. Every wrapper script you write — around a simulator, a solver, a container run — hinges on getting that right, because a single wrong character turns `--out "entry burn 01"` into three arguments and a file called `entry`.

The second is the other half of a script's interface: the literal text a script *contains* rather than receives. Usage messages, generated configuration files and embedded `awk` or Python programs all arrive through here-documents, and one rule — whether you quoted the delimiter — decides whether they work.

All output below was produced on this machine and pasted verbatim, with GNU bash 5.2.21, ShellCheck 0.9.0, GNU Awk 5.2.1, Python 3.11.15 and util-linux `getopt` 2.39.3 on Ubuntu 24.04.4.

## Positional parameters

A script's arguments are `$1`, `$2`, … ; `$#` is how many there are; `$0` is the script as invoked. `shift` discards `$1` and renumbers the rest, and `shift n` discards `n`.

Two collective forms exist and they are not interchangeable.

```bash
#!/usr/bin/env bash
show() { printf 'argc=%d\n' "$#"; local i=0; for a in "$@"; do i=$((i+1)); printf '  [%d] <%s>\n' "$i" "$a"; done; }
echo '--- "$@"'; show "$@"
echo '--- "$*"'; show "$*"
echo '--- $@ (unquoted)'; show $@
echo '--- "$*" with IFS=|'; (IFS='|'; show "$*")
```

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

`"$@"` expands to **one word per argument**, boundaries intact. `"$*"` joins everything into **one word**, separated by the first character of `IFS` — which is why changing `IFS` changes the separator, and why `"$*"` is the right choice when you want a message to print and never when you want arguments to pass on. Unquoted `$@` expands per argument and then word-splits each one, which is how three arguments became four.

This is the same distinction as `"${arr[@]}"` versus `"${arr[*]}"` from lesson 04, and for the same reason: both are special expansions that bash treats as lists.

::: example A wrapper that forwards its arguments
Wrapping a simulator to add a common flag, or to run it under a profiler, is the commonest kind of script in an engineering repository. It is also where `$*` does its damage.

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

Four arguments became six. The simulator would have written to a file called `entry` and then complained about two unknown arguments, `burn` and `01` — a message that mentions neither the wrapper nor the quoting, and sends you looking at the simulator's option parser.

**Forwarding arguments is always `"$@"`.** There is no case where `$*` or unquoted `$@` is correct for this, and `shellcheck` flags both.
:::

## `getopts`

`getopts` is a bash builtin that parses short options. It is called in a loop and sets two variables per iteration.

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

The pieces:

- The **option string** `":c:t:v"` lists the letters. A colon *after* a letter means that option takes a value; a colon at the **start** turns on silent error reporting, which is what lets you write your own messages.
- `$opt` is the letter found this iteration; `$OPTARG` is its value, if it takes one.
- With silent reporting, a missing value gives `opt` the value `:` and puts the offending letter in `OPTARG`; an unknown option gives `opt` the value `?` — written `\?` in the `case` because `?` is a glob pattern — again with the letter in `OPTARG`. Without the leading colon, `getopts` prints its own terse message to stderr and you lose the chance to print a usage summary.
- `OPTIND` is the index of the next argument to process. **`shift $((OPTIND - 1))` after the loop** removes everything `getopts` consumed, so that `$1`, `$@` and `$#` afterwards are the operands only.

::: example A complete option parser
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

Flags may be bundled, and a value may follow in the same word:

```bash
./bin/report.sh -vc WHEEL_RPM logs/run.log
```

```text
channel=[WHEEL_RPM] threshold=[] verbose=1
remaining arguments: 1
  [1] <logs/run.log>
```

The two error paths, both exiting 2:

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

And `--` ends the options, so an operand starting with a dash is delivered intact:

```bash
./bin/report.sh -v -- -weird.log
```

```text
channel=[] threshold=[] verbose=1
remaining arguments: 1
  [1] <-weird.log>
```

The script passes `shellcheck` with no warnings. Note that `usage` writes to standard error and exits 2, which is the convention from lesson 06: the usage message is a diagnostic, not a result, and 2 distinguishes "you called me wrongly" from "the work failed".
:::

::: warning
`getopts` stops at the first non-option argument, and does **not** reorder:

```bash
./bin/report.sh logs/run.log -v
```

```text
channel=[] threshold=[] verbose=0
remaining arguments: 2
  [1] <logs/run.log>
  [2] <-v>
```

`-v` was not parsed. It is sitting in `$@` as an operand, and the script will try to open a file called `-v`.

GNU tools permute their arguments — `grep file -i` works — and that habit makes this surprising. POSIX does not require it and `getopts` does not do it, so **options come before operands**. Say so in the usage message. If you genuinely need permutation, you are past what `getopts` offers.

The other consequence: `OPTIND` is a *shell* variable that persists. If you parse options twice in one shell — in a function called more than once, or after re-`set`ting the positional parameters — reset it first with `OPTIND=1`, or the second parse starts in the middle.
:::

## Long options

`getopts` handles single letters only. There is no `--verbose`. Three ways forward, in order of how often they are the right answer.

**Do without them.** Short options are enough for most internal tools, and a script with four flags does not need `--output-directory`.

**Parse them by hand** with a `while`/`case` loop over `"$@"`, which is perfectly readable and is what most real scripts do:

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

`shift 2` consumes the flag and its value together; `${2:?message}` from lesson 02 turns a missing value into an error with your wording:

```bash
./bin/shifting.sh --out
```

```text
./bin/shifting.sh: line 7: 2: --out needs a value
```

The `*) break` case stops at the first operand, matching `getopts`'s behaviour, and `--` explicitly ends the options.

**Use `getopt(1)`** — the external program, not the builtin — which does support long options and permutation. `getopt from util-linux 2.39.3` is what is installed here; the BSD version on macOS is a different and much weaker program, so a script using it is not portable. Most projects decide the hand-written loop is less trouble.

## Here-documents

A here-document feeds literal text to a command's standard input, ending at the word you name. The usage function above is the commonest use; the second commonest is generating a file:

```bash
cat > etc/gen.conf <<EOF
# generated by $0 at $(date -u +%FT%TZ)
vehicle = falcon9-s1
dt      = $dt
EOF
```

**The delimiter decides whether the body is expanded.** Unquoted, the body behaves like a double-quoted string — `$var`, `$(cmd)` and backslashes all act:

```bash
dt=0.001; cat <<EOF
generated for dt=$dt
EOF
```

```text
generated for dt=0.001
```

Quoted — `<<'EOF'` — nothing is expanded and the text arrives exactly as written:

```bash
dt=0.001; cat <<'EOF'
literal $dt and $(date)
EOF
```

```text
literal $dt and $(date)
```

That distinction is the whole of it. A generated configuration wants the unquoted form so values are substituted; an embedded program in another language wants the quoted form, because `$1`, `$4` and `\1` belong to `awk` or `sed` and bash would consume them first:

```bash
awk -f /dev/stdin logs/run.log <<'AWKPROG'
{ n[$0]++ }
END { printf "%d distinct lines\n", length(n) }
AWKPROG
```

```text
400 distinct lines
```

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

Note `python3 -` and `awk -f /dev/stdin`: both mean "read the program from standard input", which is what the here-document supplies, and arguments after that reach the program as usual.

::: warning
The terminating delimiter must be at the **start of its line**, with nothing after it. Inside an indented function that is ugly, and `<<-` is the fix — it strips leading **tabs** (not spaces) from the body and from the delimiter:

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

That is `cat -A` output, so `^I` is a tab and `$` is end of line. The two-space indent inside the usage text survives, because only tabs are stripped. An editor configured to expand tabs to spaces silently breaks this, which is why many people avoid `<<-` and keep the delimiter at column 0.

Get the delimiter wrong and bash reads to the end of the file:

```text
bin/unterm.sh: line 3: warning: here-document at line 2 delimited by end-of-file (wanted `EOF')
line one
```

An indented delimiter without `<<-` gives the same warning followed by a real syntax error, because the rest of the script was swallowed into the here-document:

```text
bin/ind2.sh: line 7: warning: here-document at line 3 delimited by end-of-file (wanted `USAGE')
bin/ind2.sh: line 8: syntax error: unexpected end of file
```

`shellcheck` catches it before you ever run it, as SC1044 "Couldn't find end token `EOF` in the here document".
:::

## Here-strings

`<<<` is the one-line form: it feeds a single string to a command's standard input, with a trailing newline added.

```bash
grep -o "chan=[A-Z_]*" <<< "t=0.5 chan=WHEEL_RPM val=4187.0"
```

```text
chan=WHEEL_RPM
```

It exists mainly to replace `echo "$x" | cmd`, and it has one concrete advantage beyond brevity: **no subshell**. The `while read` loop from lesson 05 loses its variables on the right of a pipe; with a here-string or a redirect it does not. The same applies to `mapfile`:

```bash
mapfile -t lines <<< "$(printf 'a\nb\n')"; declare -p lines
```

```text
declare -a lines=([0]="a" [1]="b")
```

`read` with `-d ''` reads NUL-delimited input, which is the safe pairing with `find -print0` from the previous module:

```bash
printf 'a\0b\0' | while IFS= read -r -d '' x; do echo "<$x>"; done
```

```text
<a>
<b>
```

::: warning
A here-string is **one string**, and `read` splits it on `IFS` — which is not the same as splitting on a delimiter you chose:

```bash
read -r t chan val <<< "$(head -1 logs/run.log | tr '=' ' ')"
echo "t=$t chan=$chan val=$val"
```

```text
t=t chan=0.5 val=chan WHEEL_RPM val 4187.0
```

The line was `t=0.5 chan=WHEEL_RPM val=4187.0`, and replacing `=` with a space gave six words for three variables. `read` assigned the first two and put **everything remaining** in the last — documented behaviour, and almost never what the author intended.

Either name all six variables, discarding the ones you do not want with `_` (lesson 05), or set `IFS` to the real delimiter for that one `read`:

```bash
IFS='= ' read -r _ t _ chan _ val <<< "$line"
```

The general lesson: `read` never fails for having the wrong number of fields. It silently over- or under-fills, so a change in the input's shape produces wrong values rather than an error.
:::

::: key
`"$@"` is one word per argument and is the only correct way to forward them; `"$*"` joins them into one word using `IFS`'s first character. `getopts ":c:t:v" opt` parses short options — a trailing colon means the option takes a value, a leading colon enables your own error messages via the `:` and `\?` cases — and `shift $((OPTIND - 1))` afterwards leaves the operands in `"$@"`. Options must come before operands, and `--` ends them.
:::

## Check yourself

::: check
A wrapper script ends with `exec ./sim $*` and works until someone passes `--out "run 01"`. Explain what the simulator receives and give the fix.
:::

::: answer
`$*` joins all the arguments into a single string with spaces, and then — because it is unquoted — that string is word-split on `IFS` and each piece is glob-expanded. So `--out` and `run 01` become three words: `--out`, `run`, `01`. The simulator is given an output path of `run`, and then two arguments it does not recognise.

Worse, the glob expansion means a value containing `*` is replaced by matching filenames in the current directory, so the wrapper's behaviour depends on where it was run from.

The fix is `exec ./sim "$@"`. That expands to exactly the arguments the wrapper received, one word each, with no splitting and no globbing — including arguments that are empty strings, which `$*` also loses.

If the wrapper needs to add its own flags, build them as an array and expand both: `extra=(--profile entry); exec ./sim "${extra[@]}" "$@"`.
:::

::: check
Why does the option string `":c:t:v"` begin with a colon, and what changes if you remove it?
:::

::: answer
A leading colon turns on **silent error reporting**. With it, `getopts` does not print anything of its own; instead it signals problems through the loop variable. A missing option-argument sets the variable to `:` and puts the offending letter in `OPTARG`; an unrecognised option sets it to `?` and likewise puts the letter in `OPTARG`. That lets the script print its own message and its own usage summary, and choose its own exit code.

Without the leading colon, `getopts` prints a short message to standard error itself — something of the form `illegal option` or `option requires an argument` — and sets the variable to `?` in both cases, with `OPTARG` unset. You can no longer tell the two errors apart, you cannot control the wording, and the message does not include a usage summary, which is what the user actually needs.

The colons *after* letters are unrelated: they mark options that take a value. So `":c:t:v"` means silent reporting, `-c` takes a value, `-t` takes a value, `-v` does not.
:::

::: check
`./report.sh logs/run.log -v` silently ignores `-v`. Explain, and give two ways to handle it.
:::

::: answer
`getopts` processes arguments left to right and stops at the first one that is not an option. `logs/run.log` is not an option, so parsing ends there; `-v` is never examined and remains in the positional parameters as an operand. After `shift $((OPTIND - 1))` the script sees two operands, one of which is `-v`, and will probably try to open it as a file.

This is POSIX behaviour. GNU programs commonly permute their arguments so that options may appear anywhere, which is why the restriction is surprising — but it is the programs doing that, not the shell.

Two ways to handle it. Document it: put `[options] FILE...` in the usage message and validate the operands, rejecting any that begin with `-` unless they follow a `--`. That is honest and costs nothing. Or parse by hand with a `while`/`case` loop over `"$@"`, which lets you accept options after operands if you really want to — at the cost of writing the permutation logic yourself.

The third option, `getopt(1)` from util-linux, does permute; it is not available in the same form on macOS, so a script using it is not portable.
:::

::: check
What does `shift $((OPTIND - 1))` do, and what breaks if you leave it out?
:::

::: answer
`OPTIND` is the index of the next argument `getopts` would look at, so after the loop it is one past the last argument that was consumed as an option or an option-value. Shifting by `OPTIND - 1` discards exactly those, leaving `$1` as the first operand and `$#` as the number of operands.

Without it, `$@` still contains all the flags. `$#` is then the total argument count rather than the operand count, so a check like `(( $# >= 1 ))` passes when no file was given at all; a `for f in "$@"` loop tries to open `-v` and `WHEEL_RPM` as files; and any forwarding of `"$@"` passes the script's own flags to the program it calls.

The failure is not a crash — it is a script that appears to run and processes the wrong things, which is why the line is easy to forget and expensive to omit. Remember also to set `OPTIND=1` before a second parse in the same shell, since it persists.
:::

::: check
When should a script use `"$*"` rather than `"$@"`?
:::

::: answer
When you want the arguments as one string for a human to read, not as a list for a program to receive. Logging is the main case: `echo "running: $0 $*"` produces one readable line, whereas `"$@"` in that position would produce the same text but through a different mechanism and with no advantage.

The second case is when you deliberately want a joined value with a chosen separator, which `IFS` controls: `(IFS=','; echo "${channels[*]}")` turns an array into a comma-separated list. Note the subshell, so that `IFS` is restored afterwards.

It is never right for passing arguments on, for building a command line, or for iterating — `for a in "$*"` runs exactly once, with everything glued together, which is a silent and confusing bug.

One caveat about the logging case: `"$*"` loses the argument boundaries, so a log line cannot be copied and re-run reliably when an argument contained spaces. `printf '%q ' "$@"` prints the arguments shell-quoted, which can be pasted back, and is the better choice when the log is meant to be reproducible.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `$1 $2 … $# $0` | arguments, count, script name | `$0` is the path as invoked |
| `shift`, `shift n` | drop and renumber arguments | `shift 2` for a flag and its value |
| `"$@"` | one word per argument | the only correct way to forward |
| `"$*"` | one word, joined by `IFS`'s first character | for log messages, never for arguments |
| `$@` unquoted | per argument, then split and globbed | never correct |
| `getopts ":c:t:v" opt` | parse short options in a loop | trailing colon = takes a value |
| leading `:` in the option string | silent errors, handled by you | `:` case = missing value, `\?` case = unknown option |
| `$OPTARG` | the option's value, or the offending letter | depends on which case fired |
| `shift $((OPTIND - 1))` | remove the parsed options | without it, `$@` still holds the flags |
| `OPTIND=1` | reset before a second parse | it is a persistent shell variable |
| options before operands | `getopts` stops at the first operand | no permutation; say so in the usage |
| `--` | end of options | lets an operand start with a dash |
| long options | not supported by `getopts` | hand-written `while`/`case`, or `getopt(1)` |
| `usage() { … >&2; exit 2; }` | diagnostics to stderr, code 2 | distinguishes misuse from failure |
| `printf '%q ' "$@"` | shell-quoted arguments for a log | can be pasted back and re-run |
| `<<EOF` | here-doc, body expanded like a double-quoted string | for generated configuration |
| `<<'EOF'` | here-doc, nothing expanded | for embedded awk, sed, Python |
| `<<-EOF` | strips leading **tabs** from body and delimiter | breaks if the editor expands tabs |
| unterminated here-doc | `delimited by end-of-file (wanted 'EOF')` | shellcheck SC1044 catches it first |
| `cmd <<< "$s"` | here-string: one line of input, no subshell | `mapfile` and `read` keep their variables |
| `read -r -d ''` | NUL-delimited input | pairs with `find -print0` |
| `read` field count | silently over- or under-fills | set `IFS`, or name every field |

Lesson 09 leaves the shell's own syntax and starts on the text tools a script spends most of its time invoking, beginning with `sed`.
