---
id: l09-sed
title: sed — substitution and addressing
minutes: 16
covers:
  - sed substitution and addressing; awk fields, patterns, BEGIN/END, arrays
---

`sed` is a stream editor: it reads its input one line at a time, applies a small program to each line, and prints the result. That is the entire model, and holding it explicitly is what turns `sed` from a collection of remembered incantations into a tool you can reason about.

In simulation work it does three jobs. It edits configuration files programmatically — the sweep driver that writes twenty variants of one `.conf` does it with `sed`, not by hand. It reshapes log lines into something a column tool can read. And it extracts a slice of an enormous file by line number, which is the one thing `grep` cannot do.

All output below was produced on this machine and pasted verbatim, with GNU sed 4.9 on Ubuntu 24.04.4. The fixture is a small configuration file and a campaign log. **GNU sed and BSD sed differ**, most visibly in `-i`, and this lesson says so where it matters.

## The model

For each line of input, `sed` copies it into a buffer called the **pattern space**, runs your script against it, and — unless `-n` was given — prints the pattern space. Commands can change it, delete it, print it early, or stop the whole program.

The script is a sequence of commands, each optionally prefixed by an **address** that decides which lines it applies to. That is all there is to the language, plus a handful of commands.

## `s`: substitute

```bash
sed 's/0.002/0.001/' etc/sim.conf | head -4
```

```text
# entry burn configuration
vehicle = falcon9-s1
dt      = 0.001
horizon = 18.0
```

The form is `s/pattern/replacement/flags`. Note that `sed` wrote to standard output and did not touch the file — nothing is modified unless you ask.

The flags are the part worth knowing exactly:

```bash
printf "a a a\n" | sed 's/a/X/'
printf "a a a\n" | sed 's/a/X/g'
printf "a a a\n" | sed 's/a/X/2'
printf "a a a\n" | sed 's/a/X/2g'
```

```text
X a a
```

```text
X X X
```

```text
a X a
```

```text
a X X
```

Without `g`, only the **first** match on each line is replaced. With `g`, every match. A number `N` replaces only the Nth, and `Ng` replaces from the Nth onward. `I` makes the match case-insensitive:

```bash
printf "Case OK\ncase ok\n" | sed 's/case/CASE/I'
```

```text
CASE OK
CASE ok
```

The delimiter does not have to be `/`. Any character works, which is how you avoid a line full of backslashes when the pattern contains paths:

```bash
sed 's|results/2026-04-02|/srv/out|' etc/sim.conf | tail -1
```

```text
outdir  = /srv/out
```

In the replacement, `&` is the whole match and `\1`…`\9` are capture groups. With `-E` the groups are written `(…)`; without it they are `\(…\)`, which is why `-E` is worth typing:

```bash
printf "val=4187.0\n" | sed -E 's/[0-9]+\.[0-9]+/[&]/'
printf "dt=0.002\n"   | sed -E 's/dt=([0-9.]+)/timestep is \1 s/'
```

```text
val=[4187.0]
```

```text
timestep is 0.002 s
```

::: warning
The pattern is a regular expression, so `.` matches any character and `*` is greedy. Both bite in the same way as in lesson 06 of the previous module — by matching too much and reporting nothing:

```bash
printf "a.b\n" | sed 's/a.b/X/'
printf "axb\n" | sed 's/a.b/X/'
printf "axb\n" | sed 's/a\.b/X/'
```

```text
X
```

```text
X
```

```text
axb
```

The second line should not have matched and did. Escape the dot when you mean a literal one.

Greediness is the other half:

```bash
printf "<a><b>\n" | sed -E 's/<.*>/[&]/'
printf "<a><b>\n" | sed -E 's/<[^>]*>/[&]/'
```

```text
[<a><b>]
```

```text
[<a>]<b>
```

`.*` ran to the *last* `>` on the line, not the first. POSIX regular expressions have no lazy quantifier — there is no `.*?` — so the fix is to say what may not appear in between: `[^>]*`. This is the reason `sed` should never be pointed at HTML, XML or JSON, where the nesting makes "everything except the closing delimiter" wrong as well.
:::

## Addresses: which lines

An address before a command restricts it. The forms:

| Address | Selects |
| --- | --- |
| `5` | line 5 |
| `$` | the last line |
| `2,4` | lines 2 to 4 |
| `/regex/` | every line matching |
| `/a/,/b/` | from the first line matching `a` to the next matching `b` |
| `2,$` | line 2 to the end |
| `0~100` | every 100th line (GNU extension) |
| `addr!` | every line the address does *not* select |

With `-n`, `sed` prints nothing by itself, and `p` prints explicitly — the pairing that gives you "just these lines":

```bash
sed -n '2,4p' etc/sim.conf
```

```text
vehicle = falcon9-s1
dt      = 0.002
horizon = 18.0
```

```bash
sed -n '/dt/,/seed/p' etc/sim.conf
```

```text
dt      = 0.002
horizon = 18.0
seed    = 100000
```

A range between two patterns is the tool for pulling one run's block out of a combined log — from the line matching `sim start case=0417` to the next matching `sim end`.

`sed -n '10000,10020p' huge.log` is also the fast way to look at a specific place in a very large file, and `sed -n '10020q; 10000,10020p'` stops reading once it has what it needs rather than scanning to the end.

Deleting is the complement, and the negation `!` lets you write either:

```bash
sed '/^#/d' etc/sim.conf
sed -n '/^#/!p' etc/sim.conf
```

Both print the file without its comment lines. `sed -E '/^[[:space:]]*(#|$)/d'` is the idiom for "strip comments and blank lines", which is how a script reads a configuration file.

## The other commands

Beyond `s`, `p` and `d`, five come up:

```bash
sed '2q' etc/sim.conf
```

```text
# entry burn configuration
vehicle = falcon9-s1
```

`q` quits — `sed '2q'` is `head -2` and, more usefully, `sed '/sim end/q'` stops at the first end marker.

```bash
sed '2a inserted-after-line-2'  etc/sim.conf | head -4
sed '2i inserted-before-line-2' etc/sim.conf | head -3
sed '2c replaced-line-2'        etc/sim.conf | head -3
```

```text
# entry burn configuration
vehicle = falcon9-s1
inserted-after-line-2
dt      = 0.002
```

```text
# entry burn configuration
inserted-before-line-2
vehicle = falcon9-s1
```

```text
# entry burn configuration
replaced-line-2
dt      = 0.002
```

`a` appends after, `i` inserts before, `c` changes the line. `y/abc/xyz/` transliterates characters, exactly like `tr`. `=` prints the current line number, which is how you find where something is:

```bash
sed -n '/ERROR/=' logs/driver.log
```

```text
13
```

Commands can be grouped with braces under one address, and combined with `-e` or with `;`:

```bash
sed -n '12,14{=;p}' logs/driver.log
```

```text
12
2026-04-02T08:12:30Z WARN  case=012 solver retry 1
13
2026-04-02T08:12:40Z ERROR case=012 status=FAIL dv_ms=nan
14
2026-04-02T08:12:00Z INFO  case=012 status=OK dv_ms=135.02
```

## Editing in place

```bash
sed -i 's/0.002/0.001/' /tmp/c1.conf
```

changes the file and prints nothing. `-i` with a suffix keeps the original:

```bash
sed -i.bak 's/0.002/0.001/' /tmp/c2.conf; ls /tmp/c2*
```

```text
/tmp/c2.conf
/tmp/c2.conf.bak
```

::: warning
Three things about `-i`.

**It is not portable.** GNU sed takes an optional suffix attached to the flag — `-i`, or `-i.bak`. BSD sed, which is what macOS ships, *requires* an argument, so `sed -i 's/…/…/' f` there consumes the script as the suffix and fails confusingly, and the portable spelling is `sed -i '' 's/…/…/' f` — which in turn fails under GNU. There is no form that works on both. A script that must run on both should write to a temporary file and `mv`, which is lesson 07's atomic-replace pattern anyway.

**It is not atomic.** GNU sed writes a temporary file and renames it, so the file is replaced rather than rewritten, but a crash part-way leaves the temporary behind, and a `-i` on a file another process has open gives that process the *old* inode.

**It has no undo.** `sed -i` on a wrong pattern is a silent, immediate, irreversible edit of every matching line. Run it without `-i` first and read the output — the same discipline as `find -print` before `find -delete`. Under version control the diff is your undo; outside it, use `-i.bak`.
:::

The `w` flag on `s` writes only the changed lines to a file, which is how you get a record of what an edit touched:

```bash
printf "dt = 0.002\n" | sed 's/0.002/0.001/w /tmp/changed.txt'
cat /tmp/changed.txt
```

```text
dt = 0.001
```

```text
dt = 0.001
```

::: example Generating a sweep of configuration files
The job: from one template, produce one configuration per timestep, each with its own output directory.

```bash
for dt in 0.004 0.002 0.001; do
  tag="dt${dt/./p}"
  sed -E -e "s|^dt .*|dt      = $dt|" \
         -e "s|^outdir .*|outdir  = results/$tag|" \
         etc/sim.conf > "etc/sim_$tag.conf"
done
```

```bash
head -3 etc/sim_dt0p001.conf; tail -1 etc/sim_dt0p001.conf
```

```text
# entry burn configuration
vehicle = falcon9-s1
dt      = 0.001
```

```text
outdir  = results/dt0p001
```

Four things in it are worth naming. The anchor `^dt ` makes the pattern match the *setting* rather than any line containing `dt`, which would also hit a comment. `|` as the delimiter keeps the paths readable. The replacement is inside double quotes so that `$dt` is expanded by the shell — which is the one case where a `sed` script should not be single-quoted, and it means the variable's content becomes part of the regular expression, so a value containing `&`, `\` or the delimiter would break it. And `${dt/./p}` is a bash parameter expansion, not `sed`, turning `0.001` into `0p001` so the name is filesystem-friendly.

The alternative for anything more structured is not a cleverer `sed`: it is a templating step in Python, or a configuration format with an include mechanism. `sed` is right here because the file is line-oriented and the edit is one line.
:::

## When `sed` reports a problem

```bash
sed 's/x/y/' /nosuchfile.conf
```

```text
sed: can't read /nosuchfile.conf: No such file or directory
```

Exit status 2. A malformed script is a different status:

```bash
printf "a\n" | sed 's/a/b'
```

```text
sed: -e expression #1, char 5: unterminated `s' command
```

Exit status 1, and the message gives the expression number and the character offset — which is how you find the missing delimiter in a long `-e` chain. Otherwise `sed` is silent: a pattern that matches nothing is not an error, it simply changes nothing, so a substitution that quietly did not fire looks exactly like a successful one. When a `sed` step in a pipeline produces unchanged output, check the pattern with `grep` first.

::: key
`sed` reads each line into the pattern space, runs your script, and prints unless `-n`. `s/old/new/` replaces the first match per line; `g` all, `N` the Nth, `I` case-insensitively; any character may be the delimiter; `&` is the whole match and `\1` a group, with `-E` for modern group syntax. An address restricts a command: a number, `$`, `a,b`, `/regex/`, `/a/,/b/`, or `!` to negate. `-i` edits in place, is not portable between GNU and BSD, and has no undo.
:::

## Check yourself

::: check
`sed 's/dt=0.002/dt=0.001/' run.conf` reports no error and changes nothing. Give three possible reasons.
:::

::: answer
First, the pattern genuinely does not occur — the file may write `dt = 0.002` with spaces, or `DT=0.002`, or the value may be `0.0020`. Check with `grep -n 'dt' run.conf` before writing the substitution; `sed` never reports a non-match, so "no error" tells you nothing.

Second, the output went to standard output and you looked at the file. Without `-i`, `sed` is a filter: the file is untouched and the edited text was printed. This is the most common version of the confusion and is a feature, not a bug.

Third, the shell got to the pattern first. In double quotes, `$` and backslashes are interpreted by bash before `sed` sees them, so a pattern containing `$1` or `\.` may not be what you typed. Single-quote `sed` scripts unless you deliberately need a shell variable inside.

A fourth possibility worth ruling out on a file that came from Windows: the line is `dt=0.002\r`, and a pattern anchored with `$` will not match. `cat -A` shows it.
:::

::: check
Explain why `sed -E 's/<.*>/X/'` on `<a><b>` gives `X` rather than `X<b>`, and give the fix.
:::

::: answer
`*` is greedy: it matches as much as it can while still allowing the rest of the pattern to match. Starting at the first `<`, `.*` consumes `a><b`, leaving the final `>` to match the pattern's `>`. The whole line is therefore one match and is replaced by `X`.

POSIX regular expressions, which `sed` uses, have no lazy quantifier — `.*?` is a Perl extension and `sed` does not support it. The fix is to describe the content explicitly: `s/<[^>]*>/X/` says "a `<`, then any run of characters that are not `>`, then a `>`", which cannot run past the first closing bracket. On `<a><b>` that gives `X<b>`.

The general lesson is that `.*` is almost always wrong in the middle of a pattern. Replace it with a negated character class naming the delimiter you are stopping at. And when the structure is nested — HTML, XML, JSON — even that is not enough, because the closing delimiter is ambiguous; use a parser.
:::

::: check
A colleague's script uses `sed -i` and it fails on his Mac with `sed: 1: "s/a/b/": invalid command code`. What is going on and what should the script do instead?
:::

::: answer
BSD `sed`, which macOS ships, requires an argument to `-i` giving the backup suffix. Written as `sed -i 's/a/b/' file`, BSD sed takes `s/a/b/` as the suffix and then tries to interpret `file` as the script — hence a complaint about a command code, naming the wrong string. The portable-looking spelling for BSD is `sed -i '' 's/a/b/' file`, and *that* fails under GNU sed, which reads `''` as the script and `s/a/b/` as a filename.

There is no single `-i` invocation that works on both. A script that must be portable should not use `-i` at all. Write to a temporary file in the same directory and rename, which is lesson 07's atomic replace:

```bash
tmp="$(mktemp "${f}.XXXXXX")"
sed 's/a/b/' "$f" > "$tmp" && mv -- "$tmp" "$f"
```

That is portable, atomic, and leaves the original intact if `sed` fails. If the script is Linux-only, `sed -i.bak` is fine and the `.bak` is worth keeping.
:::

::: check
How would you print lines 5000 to 5010 of a 40 GB log, and why is `sed` better than `head`/`tail` here?
:::

::: answer
`sed -n '5000,5010p' huge.log`, and better still `sed -n '5011q; 5000,5010p' huge.log`.

The second form is the point. `sed` reads forward from the beginning either way — there is no index — but `q` makes it stop as soon as it has what you asked for, so it reads 5011 lines rather than four hundred million. Without `q` the command is correct and reads the entire file.

`head -5010 huge.log | tail -11` gets the same lines and also stops early, because `head` exits after 5010 lines and the `SIGPIPE` ends any producer. It is arguably clearer. The reason to reach for `sed` is that it generalises: the address can be a pattern rather than a number, so `sed -n '/sim start case=0417/,/sim end/p'` extracts one run's block from a combined log, which the `head`/`tail` pair cannot express at all.

What none of them can do is seek. For repeated random access into a huge file, build an index once — line number to byte offset — and use `tail -c +N`, or store the data in something that is not a text file.
:::

::: check
When should you stop using `sed` and use `awk` or a real parser instead?
:::

::: answer
Three signals. **When the work is about fields rather than about text.** "Multiply column 5 by 1000" or "sum column 3 per channel" is awk's model — split on a separator, index by number — and expressing it as a regular expression substitution is both harder and more fragile.

**When the data has structure that a line does not capture.** JSON, XML, YAML, HTML and CSV-with-quoted-commas all have nesting or escaping that a line-oriented regular expression cannot represent correctly. It will work on your sample and fail on a value that contains the delimiter. Use `jq`, a real CSV reader, or Python.

**When you need state across lines.** Counting, accumulating, joining two files, remembering the last header: `sed` has a hold space and can do some of this, but the programs are write-only. awk has variables and arrays and reads like code.

`sed` remains the right tool for exactly what it is good at: a substitution on a line-oriented file, a slice by address, and deleting or extracting lines by pattern. A useful rule of thumb is that a `sed` script longer than about two commands, or one that needed a diagram to write, should have been awk.
:::

## Summary

| Form | Meaning | Note |
| --- | --- | --- |
| pattern space | one line at a time; printed unless `-n` | the whole model |
| `s/old/new/` | replace the **first** match on each line | `g` all, `N` the Nth, `Ng` from the Nth, `I` case-insensitive |
| `s|a|b|` | any delimiter | keeps path patterns readable |
| `&`, `\1`…`\9` | whole match, capture groups | `-E` for `(…)` instead of `\(…\)` |
| `.` and `*` | any character; greedy | escape a literal dot; use `[^x]*` instead of `.*` |
| addresses | `5`, `$`, `2,4`, `/re/`, `/a/,/b/`, `0~N`, `addr!` | a range between patterns extracts one run's block |
| `-n` with `p` | print only what you select | `sed -n '2,4p'` |
| `d`, `q`, `a`, `i`, `c`, `y`, `=` | delete, quit, append, insert, change, transliterate, line number | `'/x/q'` stops early on a huge file |
| `{ ; }` | group commands under one address | `sed -n '12,14{=;p}'` |
| `-e` or `;` | several commands | `-e` is clearer in a script |
| `-i`, `-i.bak` | edit in place, with a backup | **GNU only**; no undo; run it without `-i` first |
| `s/…/…/w file` | write only the changed lines | a record of what an edit touched |
| exit 1 / exit 2 | malformed script / unreadable file | a non-matching pattern is *not* an error |

Lesson 10 takes the other half of this topic: `awk`, which splits each line into fields and gives you variables, arrays and `BEGIN`/`END` blocks — everything `sed` deliberately does not have.
