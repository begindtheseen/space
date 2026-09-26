---
id: l09-sed
title: sed — substitution and addressing
minutes: 22
covers:
  - sed substitution and addressing; awk fields, patterns, BEGIN/END, arrays
---

Picture a conveyor belt carrying letters past a clerk. Each letter stops in front of her for a moment. She follows a short list of instructions — "if it shows the old address, write the new one" — and sends it on. She never sees the whole pile, and never goes back.

That clerk is **`sed`**, the **[[stream editor|sed-name]]**. It reads its input one line at a time, applies a small program to each line, and prints the result. Keep that model in mind and `sed` stops being a set of memorized spells.

In simulation work, `sed` does three jobs. It edits configuration files by program — a sweep driver writes twenty variants of one `.conf` file with `sed`. It reshapes log lines for a column tool. And it pulls out a slice of an enormous file by line number, which `grep` cannot do.

All output below was produced on a real machine and pasted exactly, with GNU sed 4.9 on Ubuntu 24.04.4. The examples use a small configuration file, `etc/sim.conf`, and a few campaign logs. **GNU sed and BSD sed differ**, most visibly in `-i`, and the lesson says so where it matters.

## The model

For each line of input, `sed` copies the line into a working buffer called the **[[pattern space|pattern-space]]**. It runs your script against that buffer. Then — unless you gave the `-n` option — it prints the buffer and moves on to the next line.

The script is a list of commands that can change the pattern space, delete it, print it early, or stop the program. Each command may have an **address** in front of it that decides which lines it applies to. That is the whole language.

## `s`: substitute

The command you will use most is `s`, for substitute. Here it changes the timestep in the configuration file from 0.002 to 0.001:

```bash
sed 's/0.002/0.001/' etc/sim.conf | head -4
```

```text
# entry burn configuration
vehicle = falcon9-s1
dt      = 0.001
horizon = 18.0
```

The form is `s/pattern/replacement/flags`. Read it as "substitute *pattern* with *replacement*". Notice that `sed` wrote the result to standard output and did **not** touch the file. Nothing is changed unless you ask.

The flags at the end are worth knowing exactly. The same input line, `a a a`, four ways:

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

- No flag: only the **first** match on each line is replaced.
- `g` (for "global"): **every** match on the line.
- A number `N`: only the Nth match.
- `Ng`: the Nth match and every one after it.

`I` makes the match ignore upper and lower case:

```bash
printf "Case OK\ncase ok\n" | sed 's/case/CASE/I'
```

```text
CASE OK
CASE ok
```

::: key sed: `s/x/y/g` versus `s/x/y/`
Without `g` only the first match on each line is replaced; with `g` every match on the line is. Neither touches the file unless you pass `-i`, which edits in place.
:::

### Choosing the delimiter

The slashes are **delimiters** — separators between the parts. They do not have to be `/`. Whatever character follows the `s` becomes the delimiter. That lets you avoid a line full of backslashes when the pattern contains a path:

```bash
sed 's|results/2026-04-02|/srv/out|' etc/sim.conf | tail -1
```

```text
outdir  = /srv/out
```

### Reusing what matched

In the replacement, `&` means "the whole match". `\1` to `\9` mean the parts you wrapped in parentheses, called **capture groups**. With the `-E` option ("extended" regular expressions) you write groups as `(…)`. Without it you must write `\(…\)`, which is why `-E` is worth typing:

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

`[0-9]+\.[0-9]+` means "digits, a real dot, digits"; it matched `4187.0`, and `[&]` bracketed it. The group `([0-9.]+)` caught `0.002`, and `\1` put it back.

::: warning The pattern is a regular expression
The pattern is a **[[regular expression|regex-recap]]**, so `.` matches *any* character and `*` is **greedy** — it grabs as much as it can. Both bite the same way as in lesson 06 of the previous module: by matching too much, and reporting nothing.

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

The second line should not have matched, and it did: the `.` matched the `x`. Write `\.` when you mean a real dot. (Strictly, the very first example in this lesson, `s/0.002/0.001/`, should have been `s/0\.002/0.001/` too. It worked only because no other text in the file fits the pattern.)

Greed is the other half:

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

`.*` ran on to the *last* `>` on the line, not the first — **[[see the picture|greedy-match]]**. The regular expressions `sed` uses have no "lazy" version of `*` — there is no `.*?` — so the fix is to say what may *not* appear in between: `[^>]*`, read "any run of characters that are not `>`". This is also why `sed` should never be pointed at HTML, XML or JSON. Their nesting makes even "everything up to the closing mark" wrong.
:::

## Addresses: which lines

An address in front of a command limits it to certain lines. The forms:

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

Normally `sed` prints every line. With `-n` it prints nothing by itself, and the `p` command prints on purpose. Together they mean "show me just these lines":

```bash
sed -n '2,4p' etc/sim.conf
```

```text
vehicle = falcon9-s1
dt      = 0.002
horizon = 18.0
```

A pattern address works the same way. This one prints from the first line containing `dt` to the next line containing `seed`:

```bash
sed -n '/dt/,/seed/p' etc/sim.conf
```

```text
dt      = 0.002
horizon = 18.0
seed    = 100000
```

A **range between two patterns** is the tool for pulling one run's block out of a combined log — from the line matching `sim start case=0417` to the next one matching `sim end`.

`sed -n '10000,10020p' huge.log` is also the quick way to look at one spot in a very large file. `sed -n '10000,10020p; 10020q' huge.log` is better: `q` (quit) stops reading as soon as line 10020 has been printed, instead of scanning to the end.

::: warning Put `q` after the `p`
The order matters. `sed -n '10020q; 10000,10020p'` looks the same but quits the moment it *reaches* line 10020 — before the `p` gets to print it. It shows lines 10000 to 10019 only. Either quit after printing, as above, or quit one line later: `sed -n '10021q; 10000,10020p'`.
:::

::: example Pulling one run out of a combined campaign log
Five hundred cases write to one log file, and you want the block for case 0417. `grep` cannot give it to you, because some of the lines you need do not contain the case number at all. Here is a small piece of the log:

```text
2026-04-02T08:00:00Z INFO  sim start case=0416 seed=100416
2026-04-02T08:00:10Z INFO  t=  20.0 alt_m=9900.0
2026-04-02T08:00:20Z INFO  sim end case=0416 status=OK
2026-04-02T08:01:00Z INFO  sim start case=0417 seed=100417
2026-04-02T08:01:10Z WARN  solver iteration limit reached
2026-04-02T08:01:20Z ERROR divergence detected, residual=1.8e+03
2026-04-02T08:01:30Z INFO  sim end case=0417 status=DIVERGED
2026-04-02T08:02:00Z INFO  sim start case=0418 seed=100418
```

**Step 1: select the range.**

```bash
sed -n '/sim start case=0417/,/sim end/p' logs/combined.log
```

```text
2026-04-02T08:01:00Z INFO  sim start case=0417 seed=100417
2026-04-02T08:01:10Z WARN  solver iteration limit reached
2026-04-02T08:01:20Z ERROR divergence detected, residual=1.8e+03
2026-04-02T08:01:30Z INFO  sim end case=0417 status=DIVERGED
```

Exactly the four lines of that run (lines 4 to 7 of the sample), including two that never mention a case number. The range **[[switches on|range-switch]]** at the first line matching the opening pattern and off at the next line matching the closing one.

**Step 2, if you want it: leave out the end line.** The closing line *is* included, which is usually what you want, but not always:

```bash
sed -n '/sim start case=0417/,/sim end/{/sim end/q;p}' logs/combined.log
```

```text
2026-04-02T08:01:00Z INFO  sim start case=0417 seed=100417
2026-04-02T08:01:10Z WARN  solver iteration limit reached
2026-04-02T08:01:20Z ERROR divergence detected, residual=1.8e+03
```

The braces `{ }` group two commands under the range: on the end marker, quit; otherwise, print. `q` also stops `sed` reading the file right there, so this stays cheap on a log of ten million lines.

**Step 3: strip the timestamps.** A second `sed` removes the time at the start of each line, which is what you want before comparing two runs:

```bash
sed -n '/sim start case=0417/,/sim end/p' logs/combined.log | sed -E 's/^[0-9T:-]+Z +//'
```

```text
INFO  sim start case=0417 seed=100417
WARN  solver iteration limit reached
ERROR divergence detected, residual=1.8e+03
INFO  sim end case=0417 status=DIVERGED
```

`^` pins the pattern to the line's start, `[0-9T:-]+Z` matches the timestamp, and ` +` the spaces after it. The empty replacement deletes them.

Two runs reduced this way and handed to `diff` show what actually differed, not that every line has a different time. That is how you answer "case 0417 diverged and 0416 did not — what changed?"

One caution: if the closing pattern never matches, the range runs to the end of the file. A log cut short by a crash prints everything from the start marker on — a fact about the data, not a bug in your command.
:::

### Deleting lines

`d` deletes the pattern space, so the line is not printed. It is the opposite of `-n … p`, and the `!` negation lets you write either one:

```bash
sed '/^#/d' etc/sim.conf
sed -n '/^#/!p' etc/sim.conf
```

Both print the file without its comment lines. `sed -E '/^[[:space:]]*(#|$)/d'` is the usual way to say "drop comments and blank lines" — how a script reads a configuration file. `[[:space:]]*` is "any amount of blank space", and `(#|$)` is "then a `#`, or the end of the line".

## The other commands

Beyond `s`, `p` and `d`, a handful more come up. `q` quits:

```bash
sed '2q' etc/sim.conf
```

```text
# entry burn configuration
vehicle = falcon9-s1
```

`sed '2q'` does what `head -2` does. More usefully, `sed '/sim end/q'` stops at the first end marker.

`a` appends a line after, `i` inserts one before, and `c` changes (replaces) the line:

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

`y/abc/xyz/` swaps characters one for one — `a` to `x`, `b` to `y`, `c` to `z` — exactly like the `tr` command. `=` prints the current line number, which is how you find where something is:

```bash
sed -n '/ERROR/=' logs/driver.log
```

```text
13
```

Commands can be grouped in braces under one address, and joined with `;` or given as separate `-e` options. This prints lines 12 to 14 of the log, each with its number above it:

```bash
sed -n '12,14{=;p}' logs/driver.log
```

```text
12
2026-04-02T08:12:30Z WARN  case=012 solver retry 1
13
2026-04-02T08:12:40Z ERROR case=012 status=FAIL dv_ms=nan
14
2026-04-02T08:13:00Z INFO  case=013 status=OK dv_ms=135.02
```

## Editing in place

`-i` makes `sed` write its output back into the file instead of to the screen:

```bash
sed -i 's/0.002/0.001/' run1.conf
```

That changes `run1.conf` and prints nothing. Giving `-i` a suffix keeps a copy of the original under that name:

```bash
sed -i.bak 's/0.002/0.001/' run2.conf; ls run2*
```

```text
run2.conf
run2.conf.bak
```

::: warning Three things about `-i`
**It differs between GNU and BSD.** GNU sed takes an *optional* suffix glued to the flag: `-i` or `-i.bak`. **[[BSD sed|bsd-sed]]**, which macOS ships, *requires* a suffix argument. So on a Mac, `sed -i 's/…/…/' f` takes the script as the suffix and fails confusingly. The Mac spelling for "no backup", `sed -i '' 's/…/…/' f`, in turn fails under GNU. The one spelling both accept is a suffix glued to the flag, `sed -i.bak`, which leaves a backup file behind. A script that must run everywhere without leftovers should write to a temporary file and `mv` it — lesson 07's atomic replace.

**It makes a new file.** GNU sed writes to a temporary file in the same folder, then renames it over the original, so readers never see half. But the result is a *different* file with the same name — a new **[[inode|inode]]** — so a program that had the file open keeps the old contents, and a crash can leave the temporary file behind.

**It has no undo.** `sed -i` with a wrong pattern silently and permanently edits every matching line. Run it without `-i` first and read the output, as with `find -print` before `find -delete`. Under version control the diff is your undo; outside it, use `-i.bak`.
:::

The `w` flag on `s` writes only the lines it changed to a file, which gives you a record of what an edit touched:

```bash
printf "dt = 0.002\n" | sed 's/0.002/0.001/w changed.txt'
cat changed.txt
```

```text
dt = 0.001
```

```text
dt = 0.001
```

The first is `sed`'s normal output; the second is the file, holding the changed line.

::: example Generating a sweep of configuration files
The job: from one template, make one configuration file per timestep, each with its own output folder. Three timesteps, so three files.

```bash
for dt in 0.004 0.002 0.001; do
  tag="dt${dt/./p}"
  sed -E -e "s|^dt .*|dt      = $dt|" \
         -e "s|^outdir .*|outdir  = results/$tag|" \
         etc/sim.conf > "etc/sim_$tag.conf"
done
```

Check one of the results:

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

The `dt` line and the `outdir` line both changed, and nothing else did. Four things in the loop are worth naming:

1. **The anchor.** `^dt ` matches the *setting* — a line that starts with `dt` and a space — not any line containing `dt`, which could also hit a comment.
2. **The delimiter.** `|` keeps the path `results/…` readable.
3. **The quotes.** The `sed` script is in *double* quotes so the shell fills in `$dt` and `$tag`. This is the one case where a `sed` script should not be single-quoted. It also means the variable's text becomes part of the command, so a value containing `&`, `\` or `|` would break it.
4. **The file name.** `${dt/./p}` is bash, not `sed`: it replaces the dot with `p`, turning `0.001` into `0p001`, a name with no stray dots.

For anything more structured, use a templating step in Python, not a cleverer `sed`. `sed` is right here because each edit touches one line.
:::

## When `sed` reports a problem

A file it cannot read:

```bash
sed 's/x/y/' /nosuchfile.conf
```

```text
sed: can't read /nosuchfile.conf: No such file or directory
```

The exit status is 2. A broken script gives a different status:

```bash
printf "a\n" | sed 's/a/b'
```

```text
sed: -e expression #1, char 5: unterminated `s' command
```

The exit status is 1. The message gives the expression number and the character position, which is how you find the missing delimiter in a long chain of `-e` options.

Otherwise `sed` is silent. A pattern that matches nothing is **not** an error, so a substitution that did not fire looks exactly like one that worked. When a `sed` step leaves its input unchanged, test the pattern with `grep`.

::: key
`sed` reads each line into the pattern space, runs your script, and prints unless `-n`. `s/old/new/` replaces the first match per line; `g` all, `N` the Nth, `I` case-insensitively; any character may be the delimiter; `&` is the whole match and `\1` a group, with `-E` for modern group syntax. An address restricts a command: a number, `$`, `a,b`, `/regex/`, `/a/,/b/`, or `!` to negate. `-i` edits in place, differs between GNU and BSD, and has no undo.
:::

## Check yourself

::: check
`sed 's/dt=0.002/dt=0.001/' run.conf` reports no error and changes nothing. Give three possible reasons.
:::

::: answer
**First, the pattern is not in the file.** It may say `dt = 0.002` with spaces, or `DT=0.002`, or `0.0020`. Check with `grep -n 'dt' run.conf` first; `sed` never reports a non-match.

**Second, you looked at the file, and the output went to the screen.** Without `-i`, `sed` is a filter: the file is untouched and the edited text was printed. This is the most common case.

**Third, the shell changed the pattern first.** Inside double quotes, bash handles `$` and backslashes before `sed` sees them, so a pattern containing `$1` or `\.` may not be what you typed. Single-quote `sed` scripts unless you deliberately need a shell variable inside.

A fourth possibility on a file that came from Windows: the line is really `dt=0.002` followed by an invisible **[[carriage return|carriage-return]]**, so a pattern ending in `$` (end of line) will not match. `cat -A` shows it as `^M` at the end of the line.
:::

::: check
Explain why `sed -E 's/<.*>/X/'` on `<a><b>` gives `X` rather than `X<b>`, and give the fix.
:::

::: answer
`*` is greedy: it matches as much as it can while still letting the rest of the pattern match. Starting at the first `<`, `.*` swallows `a><b`, leaving only the final `>` to match the pattern's `>`. The whole line is one match, and it is replaced by `X`.

`sed` has no lazy quantifier; `.*?` comes from Perl. The fix is to describe the inside explicitly: `s/<[^>]*>/X/` says "a `<`, then any run of characters that are not `>`, then a `>`". That cannot run past the first closing bracket. On `<a><b>` it gives `X<b>`.

The general lesson: `.*` in the middle of a pattern is nearly always wrong. Use a "not this character" class naming the delimiter you stop at — and for nested formats like HTML or JSON, a real parser.
:::

::: check
A colleague's script uses `sed -i` and fails on his Mac with `sed: 1: "s/a/b/": invalid command code`. What is going on, and what should the script do instead?
:::

::: answer
BSD `sed`, which macOS ships, requires an argument to `-i`: the backup suffix. Given `sed -i 's/a/b/' file`, BSD sed takes `s/a/b/` as the suffix and then tries to read `file` as the script — hence a complaint about a "command code", naming the wrong string. The Mac-only spelling is `sed -i '' 's/a/b/' file`, and *that* fails under GNU sed, which reads `''` as the script and `s/a/b/` as a file name.

The only `-i` spelling both versions accept is a suffix glued to the flag, `sed -i.bak 's/a/b/' file`, and it always leaves a `.bak` file. A script that must be portable and tidy should skip `-i` altogether. Write to a temporary file in the same folder and rename it, lesson 07's atomic replace:

```bash
tmp="$(mktemp "${f}.XXXXXX")"
sed 's/a/b/' "$f" > "$tmp" && mv -- "$tmp" "$f"
```

That is portable, atomic, and leaves the original alone if `sed` fails. If the script is Linux-only, `sed -i.bak` is fine, and the `.bak` is worth keeping.
:::

::: check
How would you print lines 5000 to 5010 of a 40 GB log, and why is `sed` better than `head` and `tail` here?
:::

::: answer
`sed -n '5000,5010p' huge.log` works. `sed -n '5011q; 5000,5010p' huge.log` is better.

The second form is the point. `sed` reads forward from the start either way — a text file has no index — but `q` makes it stop as soon as it has what you asked for. It reads 5011 lines instead of hundreds of millions. (Quitting at 5011, one past the range, means line 5010 has already been printed.) Without `q` the command is correct, and reads the whole 40 GB.

`head -5010 huge.log | tail -11` gets the same eleven lines (5000 to 5010 is 11 lines) and also stops early: `head` exits after 5010 lines, and **[[SIGPIPE|sigpipe]]** ends anything still writing into the pipe. It is arguably clearer. The reason to reach for `sed` is that it generalizes. The address can be a pattern, not only a number, so `sed -n '/sim start case=0417/,/sim end/p'` pulls one run's block out of a combined log — something `head` and `tail` cannot express at all.

None of them can jump straight to a line. For repeated random access, build an index once — line number to byte position — and use `tail -c +N`.
:::

::: check
When should you stop using `sed` and use `awk` or a real parser instead?
:::

::: answer
Three signs.

**The work is about fields, not text.** "Multiply column 5 by 1000" or "sum column 3 per channel" fits `awk`'s model — split each line on a separator and pick fields by number. Writing it as a regular expression substitution is harder and breaks more easily.

**The data has structure a line cannot hold.** JSON, XML, YAML, HTML, and CSV with quoted commas all have nesting or escaping that a line-by-line regular expression cannot handle correctly. It will work on your sample and fail on a value that contains the delimiter. Use `jq`, a real CSV reader, or Python.

**You need memory across lines.** Counting, adding up, joining two files, remembering the last header: `sed` has a second buffer, the **[[hold space|hold-space]]**, and can do some of this, but the programs are nearly unreadable. `awk` has variables and arrays and reads like code.

`sed` stays right for a substitution in a line-based file, a slice by address, and deleting or extracting lines by pattern. A rule of thumb: a `sed` script longer than about two commands, or one you needed a diagram to write, should have been `awk`.
:::

## Summary

| Form | Meaning | Note |
| --- | --- | --- |
| pattern space | one line at a time; printed unless `-n` | the whole model |
| `s/old/new/` | replace the **first** match on each line | `g` all, `N` the Nth, `Ng` from the Nth, `I` any case |
| `s#a#b#` | any character after `s` is the delimiter | keeps path patterns readable |
| `&`, `\1`…`\9` | whole match, capture groups | `-E` for `(…)` instead of `\(…\)` |
| `.` and `*` | any character; greedy | escape a real dot; use `[^x]*` instead of `.*` |
| addresses | `5`, `$`, `2,4`, `/re/`, `/a/,/b/`, `0~N`, `addr!` | a range between patterns pulls out one run's block |
| `-n` with `p` | print only what you select | `sed -n '2,4p'` |
| `d`, `q`, `a`, `i`, `c`, `y`, `=` | delete, quit, append, insert, change, swap characters, line number | `'/x/q'` stops early on a huge file |
| `p` then `q` | `sed -n '100,120p; 120q'` | `q` before `p` loses the last line |
| `{ ; }` | group commands under one address | `sed -n '12,14{=;p}'` |
| `-e` or `;` | several commands | `-e` is clearer in a script |
| `-i`, `-i.bak` | edit in place, with a backup | GNU and BSD differ; no undo; run it without `-i` first |
| `s/…/…/w file` | write only the changed lines | a record of what an edit touched |
| exit 1 / exit 2 | broken script / unreadable file | a pattern that matches nothing is *not* an error |

Lesson 10 takes the other half of this topic: `awk`, which splits each line into fields and gives you variables, arrays and `BEGIN`/`END` blocks — everything `sed` deliberately does without.

::: context sed-name Where the name comes from
**sed** is short for **s**tream **ed**itor. Lee McMahon wrote it at Bell Labs in the early 1970s, borrowing its commands from `ed`, the line editor Unix users typed into before full-screen editors existed. That is why `s/old/new/` also works inside `vim`: `vim` descends from the same family of editors.

A "stream" here means data that flows past once, start to end, like water in a pipe — so `sed` can edit a file far bigger than the computer's memory.
:::

::: context pattern-space One line at a time
Every line takes the same trip. Only one line sits in the pattern space at any moment, which is why `sed` uses almost no memory even on a huge log.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="30" width="70" height="60" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="43" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">line 1</text>
  <text x="43" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">line 2</text>
  <text x="43" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">line 3</text>
  <text x="43" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">input</text>
  <line x1="78" y1="60" x2="108" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="108,55 116,60 108,65" fill="#1f2a44"/>
  <rect x="118" y="40" width="100" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="168" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">pattern space</text>
  <text x="168" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">(one line)</text>
  <text x="168" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">your script runs here</text>
  <line x1="218" y1="60" x2="248" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="248,55 256,60 248,65" fill="#1f2a44"/>
  <rect x="258" y="40" width="94" height="40" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="305" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">printed</text>
  <text x="305" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">unless -n</text>
</svg>
```
:::

::: context regex-recap A regular expression in one breath
A **regular expression** is a small pattern language for describing text. A few symbols do most of the work: `.` is any one character, `*` means "the thing before, repeated any number of times, even zero", `+` is "one or more" (with `-E`), `[0-9]` is "one digit", `[^>]` is "any character except `>`", `^` is the start of a line and `$` is the end.

Every other character stands for itself, which is why a plain word works as a pattern — and why a dot is the classic surprise.
:::

::: context greedy-match How far .* reaches
On the line `<a><b>`, the pattern `<.*>` could stop at the first `>` or at the second. Greedy matching always takes the longest match that works, so it reaches the second. `<[^>]*>` cannot cross a `>` at all, so it stops at the first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g font-size="16" fill="#1f2a44" text-anchor="middle">
    <text x="130" y="30">&lt;</text><text x="150" y="30">a</text><text x="170" y="30">&gt;</text>
    <text x="190" y="30">&lt;</text><text x="210" y="30">b</text><text x="230" y="30">&gt;</text>
  </g>
  <rect x="120" y="44" width="120" height="16" fill="#f2b880" stroke="#1f2a44"/>
  <text x="112" y="57" font-size="12" text-anchor="end" fill="#1f2a44">&lt;.*&gt;</text>
  <text x="250" y="57" font-size="11" fill="#b4232c">greedy: whole line</text>
  <rect x="120" y="76" width="60" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="112" y="89" font-size="12" text-anchor="end" fill="#1f2a44">&lt;[^&gt;]*&gt;</text>
  <text x="190" y="89" font-size="11" fill="#1d6fd1">stops at first &gt;</text>
</svg>
```
:::

::: context range-switch A range is an on–off switch
Think of a range address as a light switch. `sed` checks each line. When a line matches the opening pattern, the switch turns on, and that line is selected. Every following line is selected too, until one matches the closing pattern; that line is selected and the switch turns off. Then `sed` goes back to watching for the opening pattern, so a range can switch on again later in the file.

That last point is why `/sim start/,/sim end/p`, without a case number, prints *every* run's block, one after another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="250" height="20" fill="#fff" stroke="#6c7a93"/>
  <rect x="10" y="30" width="250" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="10" y="50" width="250" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="10" y="70" width="250" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="10" y="90" width="250" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="10" y="110" width="250" height="20" fill="#fff" stroke="#6c7a93"/>
  <text x="18" y="24" font-size="11" fill="#6c7a93">sim end case=0416</text>
  <text x="18" y="44" font-size="11" fill="#1f2a44">sim start case=0417</text>
  <text x="18" y="64" font-size="11" fill="#1f2a44">WARN solver limit</text>
  <text x="18" y="84" font-size="11" fill="#1f2a44">ERROR divergence</text>
  <text x="18" y="104" font-size="11" fill="#1f2a44">sim end case=0417</text>
  <text x="18" y="124" font-size="11" fill="#6c7a93">sim start case=0418</text>
  <text x="270" y="44" font-size="11" fill="#1d6fd1">switch on</text>
  <text x="270" y="104" font-size="11" fill="#1d6fd1">switch off</text>
  <text x="270" y="74" font-size="11" fill="#1f2a44">selected</text>
  <text x="135" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">shaded lines are printed</text>
</svg>
```
:::

::: context bsd-sed Two families of the same tools
macOS is built on code from BSD, a branch of Unix developed at the University of California, Berkeley. So its `sed`, `find`, `date` and friends are BSD versions. Linux systems almost always use the GNU versions from the Free Software Foundation.

Both follow the POSIX rules for the basics, and each adds its own extras. `-i` is not in POSIX at all, which is why the two families spell it differently. Installing GNU sed on a Mac (it is often named `gsed`) is a common way around it.
:::

::: context inode A name and a file are two things
On Linux, a file's data and settings live in an **inode**, a record identified by a number. A folder only maps names to inode numbers. `ls -i` shows them.

`sed -i` builds a new inode with the edited text, then points the old name at it. The name is the same, but the file is new. Anyone holding the old inode open keeps the old text. A second name for the same file — a **hard link** — keeps pointing at the old inode too, so it silently stops matching.
:::

::: context carriage-return The invisible character from Windows
Windows ends each line of a text file with two characters: a **carriage return** (`\r`) and a line feed (`\n`). Linux uses the line feed alone. So a Windows file read on Linux has an extra `\r` at the end of every line, just before the true end.

To `sed` that `\r` is a real character, and `dt=0.002$` does not match `dt=0.002\r`. `sed -i 's/\r$//' file` (GNU) removes them, as does the `dos2unix` tool.
:::

::: context sigpipe How head stops the whole pipeline
When the reading end of a pipe closes, the kernel sends the writing process a signal, **SIGPIPE**, the next time it writes. By default that ends the writer quietly.

So in `cat huge.log | head -5`, once `head` has its five lines and exits, `cat` is stopped on its next write — it never reads the rest of the 40 GB. Pipelines stop early by themselves, without anyone planning for it.
:::

::: context hold-space sed's second pocket
Besides the pattern space, `sed` has one more buffer, the **hold space**, that survives from line to line. Commands `h` and `H` copy or append the pattern space into it, and `g`, `G` and `x` bring it back or swap the two.

With these you can, for example, reverse a file or join pairs of lines. The scripts work, but they look like `1!G;h;$!d` — which is exactly why this course turns to `awk` instead.
:::
