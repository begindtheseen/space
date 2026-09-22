---
id: l02-reading-files-without-an-editor
title: Reading files without an editor
minutes: 18
covers:
  - cat less head tail -f wc
---

A simulation campaign produces text: 500 run logs, a telemetry CSV per case, a solver report per case. Opening any of it in an editor is the wrong reflex. The files are too many to open one at a time, several are too large to load, and the one you most want to read — the log of the job that is running right now — is still growing. The shell's answer is a handful of tiny programs that stream a file past you instead of loading it.

Five of them carry most of the weight: `cat`, `less`, `head`, `tail` and `wc`. Learn what each does to a stream and you will stop reaching for an editor, which matters on a build box where the editor may not be installed and the file may be forty gigabytes.

Everything below ran on this machine and is pasted verbatim: GNU coreutils 9.4, `less` 590, GNU bash 5.2.21 on Ubuntu 24.04.4. The log files are a fixture campaign of 500 entry-burn cases; line counts and timestamps are of course specific to it, and the point is the shape of the output, not the numbers.

## `cat`: concatenate, and print by accident

`cat` is short for concatenate. Its job is to take one or more files and write them, in order, to standard output. Printing one file to the terminal is the degenerate case that gave it its everyday name.

```bash
cat configs/entry_burn.yaml
```

```text
vehicle: falcon9-s1
profile: entry-burn
dt: 0.002
horizon_s: 18.0
seed_base: 100000
```

With two files it does the thing it is named for:

```bash
cat configs/entry_burn.yaml configs/entry_burn_v2.yaml > /tmp/both.yaml
wc -l /tmp/both.yaml
```

```text
11 /tmp/both.yaml
```

Five lines plus six lines, joined end to end. Nothing is inserted between them — no separator, no newline of its own — so concatenating two files whose last line lacks a trailing newline will glue two lines together. That is a real source of corrupt CSVs.

Two flags repay learning. `-n` numbers the output lines, which is how you find out that the parse error "at line 4" is the `horizon_s` line:

```bash
cat -n configs/entry_burn_v2.yaml
```

```text
     1	vehicle: falcon9-s1
     2	profile: entry-burn
     3	dt: 0.001
     4	horizon_s: 22.0
     5	seed_base: 100000
     6	margin_m: 25.0
```

`-A` shows everything, including the bytes you cannot see. This is the tool for "the parser says this file is malformed and it looks fine to me":

```bash
printf "alt_m=1200\r\n" > /tmp/crlf.txt
cat /tmp/crlf.txt
```

```text
alt_m=1200
```

```bash
cat -A /tmp/crlf.txt
```

```text
alt_m=1200^M$
```

`$` marks the end of each line and `^M` is a carriage return — byte 0x0D, the Windows line ending. The value your parser read was not `1200` but `1200\r`, which is why `float()` threw. Every engineer who moves data between a Windows laptop and a Linux cluster meets this, usually twice.

::: warning
Never `cat` a file you have not identified. A binary file contains byte sequences that your terminal reads as control codes; among them are the ones that switch the character set, and after that your prompt is line-drawing characters until you run `reset`. Check first, and look at bytes rather than glyphs:

```bash
file /usr/bin/ls
```

```text
/usr/bin/ls: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=05dad2c279f7651722809fa75adba6bf9ab1c209, for GNU/Linux 3.2.0, stripped
```

```bash
head -c 32 /usr/bin/ls | cat -v
```

```text
^?ELF^B^A^A^@^@^@^@^@^@^@^@^@^C^@>^@^A^@^@^@0m^@^@^@^@^@^@
```

`cat -v` renders control bytes as caret notation instead of sending them to the terminal. The BuildID above is specific to this build of coreutils; yours will differ.
:::

## `less`: the pager you should be using

`less` shows a file one screen at a time and, crucially, does not read the whole thing first. Open a 40 GB trajectory dump and the first screen appears instantly, because `less` has read one screen.

It is interactive, so there is no transcript to paste. The keys worth memorising:

- `space` and `b` — forward and back one screen; `j` and `k` — one line.
- `g` and `G` — the very top and the very bottom. `G` on a growing log is how you get to the end of a 2-million-line file in one keystroke.
- `/pattern` searches forward, `?pattern` backward, `n` and `N` repeat forward and back. The pattern is a regular expression.
- `-N` (or `:` then `N`) toggles line numbers; `-S` toggles line wrapping, which turns a wide CSV from unreadable into scrollable.
- `F` starts following the file as it grows, exactly like `tail -f`; `Ctrl-C` stops following and leaves you in the pager, which `tail -f` cannot do.
- `q` quits.

This is `less 590 (GNU regular expressions)` here; the keys have been stable for decades. `man` uses `less` as its pager, so every key above works while you are reading a manual page. If `/` and `n` are the only two you remember, you are already ahead.

::: note
`more` is the older program that only went forward, and `less` is the pun. On most distributions `more` is now `less` in disguise. Use `less` deliberately.
:::

## `head` and `tail`: the two ends

`head` prints the first lines, `tail` the last. The default is 10 for both.

```bash
head -3 runs/case_0417.log
```

```text
2026-03-14T12:34:56Z INFO  sim start case=0417 seed=105273
2026-03-14T12:34:56Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
2026-03-14T12:34:57Z INFO  guidance mode=PDG horizon_s=18.0
```

```bash
tail -3 runs/case_0417.log
```

```text
2026-03-14T12:36:10Z ERROR divergence detected in attitude loop, residual=1.8e+03
2026-03-14T12:36:16Z INFO  MISS_DISTANCE_M 4812.6
2026-03-14T12:36:17Z INFO  sim end status=DIVERGED wall_s=156.0
```

Those six lines are the first thing to look at in any run log: the head tells you what the job thought it was doing, the tail tells you how it ended. Here the run diverged and still printed a miss distance — a number you would have plotted without noticing, had you only read the column and not the log.

Three variants earn their keep:

- `head -c N` takes bytes rather than lines. `head -c 48 runs/case_0417.log` gives `2026-03-14T12:34:56Z INFO  sim start case=0417 s` — cut mid-word, because bytes do not respect fields.
- `tail -n +N` starts *at* line N rather than N lines from the end. `tail -n +2 file.csv` is the standard way to drop a CSV header.
- With several files, both print a banner:

```bash
tail -n 2 runs/case_0001.log runs/case_0417.log
```

```text
==> runs/case_0001.log <==
2026-03-14T09:01:20Z INFO  MISS_DISTANCE_M 307.6
2026-03-14T09:01:21Z INFO  sim end status=OK wall_s=235.2

==> runs/case_0417.log <==
2026-03-14T12:36:16Z INFO  MISS_DISTANCE_M 4812.6
2026-03-14T12:36:17Z INFO  sim end status=DIVERGED wall_s=156.0
```

`-q` suppresses the banners, which is what you want when the output is going into another program rather than onto your screen.

::: warning
The shorthand `tail -3` works for one file and fails for several:

```bash
tail -2 runs/case_0001.log runs/case_0417.log
```

```text
tail: option used in invalid context -- 2
```

Exit status 1. The obsolete `-N` form is only accepted when it is unambiguous; with multiple operands GNU `tail` refuses rather than guess. Write `tail -n 2` and the problem never arises. `head` has the same rule.
:::

## `tail -f`: watching a job that is still running

`tail -f` prints the end of the file and then keeps the file open, printing new bytes as they arrive. It is how you watch a simulation without touching it.

Below, a writer appended one line per second to `run.log` while `tail -f` watched. The capture was stopped with `timeout 5`; at a real terminal you press `Ctrl-C`.

```bash
timeout 5 tail -f run.log
```

```text
2026-03-14T12:31:00Z INFO  t=20.0 alt_m=9900.0
2026-03-14T12:32:00Z INFO  t=40.0 alt_m=7800.0
2026-03-14T12:33:00Z INFO  t=60.0 alt_m=5700.0
2026-03-14T12:34:00Z INFO  t=80.0 alt_m=3600.0
2026-03-14T12:35:00Z INFO  t=100.0 alt_m=1500.0
2026-03-14T12:36:00Z INFO  t=120.0 alt_m=-600.0
```

The first lines appeared at once and the rest arrived one per second. `timeout` exits with status 124 when it has to kill its child, which is how a script can tell "I stopped it" from "it finished".

The distinction between `-f` and `-F` matters as soon as logs are rotated. `-f` follows the *file descriptor*: whatever inode it opened, it keeps reading, even after the name has been moved out from under it. That is how you watch a log file silently stop updating while the job is perfectly healthy and writing to a new one.

::: example `-f` goes quiet, `-F` keeps up
Two identical setups. Two seconds in, the file is renamed and a new one is created with the same name — what `logrotate` does at midnight.

```bash
timeout 5 tail -f run2.log
```

```text
2026-03-14T12:31:00Z INFO  t=20.0 alt_m=9900.0
2026-03-14T12:32:00Z INFO  t=40.0 alt_m=7800.0
2026-03-14T12:33:00Z INFO  t=60.0 alt_m=5700.0
2026-03-14T12:34:00Z INFO  t=80.0 alt_m=3600.0
2026-03-14T12:35:00Z INFO  t=100.0 alt_m=1500.0
2026-03-14T12:36:00Z INFO  t=120.0 alt_m=-600.0
2026-03-14T12:37:00Z INFO  t=140.0 alt_m=-2700.0
2026-03-14T12:38:00Z INFO  t=160.0 alt_m=-4800.0
```

Those eight lines are the contents at the moment `tail` started. The line written into the new `run2.log` after the rotation never appears — `tail` is still holding the old inode, which nobody is writing to any more.

Now the same thing with `-F`:

```bash
timeout 5 tail -F run2.log
```

```text
2026-03-14T12:40:00Z INFO  rotated, new file
tail: 'run2.log' has become inaccessible: No such file or directory
tail: 'run2.log' has appeared;  following new file
2026-03-14T12:41:00Z INFO  second rotation, new file
```

`-F` follows the *name*. It notices the file has gone, says so on stderr, waits, reopens when the name comes back, and carries on. On anything rotated — a service log, a long campaign that starts a new file per hour — `-F` is the correct flag and `-f` is a way to be quietly misinformed.
:::

## `wc`: counting, and what it counts

`wc` reports lines, words and bytes. With no flags it prints all three:

```bash
wc runs/case_0417.log
```

```text
 12  75 811 runs/case_0417.log
```

Twelve lines, 75 whitespace-separated words, 811 bytes. `-l`, `-w` and `-c` select one.

Over several files it adds a total, which is the cheap way to size a campaign:

```bash
wc -l runs/*.log | tail -1
```

```text
  5004 total
```

Five thousand and four lines across 500 logs. Note that `ls runs | wc -l` gives `500` — counting *files* by counting the lines `ls` printed. It is a safe idiom only because these names contain no newlines; a filename with a newline in it would be counted twice. `find runs -type f | wc -l` has the same weakness, and the robust form, `find runs -type f -printf . | wc -c`, appears in the lesson on `find`.

::: warning
`wc -l` counts newline *characters*, not lines in the way a human means. A final line with no newline is not counted:

```bash
echo "x" | wc -l
printf "x" | wc -l
printf "x" | wc -c
```

```text
1
0
1
```

One byte of content, zero lines. So a data file that ends without a trailing newline is under-counted by one, and — worse — appending to it produces a glued line. `tail -c 1 file | od -c` tells you whether the newline is there: `\n` if it is, the last data byte if it is not.
:::

`-m` counts characters rather than bytes, and the two differ only outside ASCII. Which answer you get depends on the locale, which is a property of the environment and not of the file:

```bash
wc -c /tmp/alpha.txt
wc -m /tmp/alpha.txt
LC_ALL=C.UTF-8 wc -m /tmp/alpha.txt
```

```text
13 /tmp/alpha.txt
13 /tmp/alpha.txt
12 /tmp/alpha.txt
```

The file is `α = 2.4 deg` plus a newline. The Greek alpha is two bytes in UTF-8, so the file is 13 bytes and 12 characters. The shell that produced this transcript had `LANG` unset — `locale` reported `POSIX` for everything — so `wc -m` fell back to counting bytes and agreed with `-c`. Force a UTF-8 locale and it counts characters. Expect this difference between your laptop and a stripped-down cluster node.

::: example How big is this campaign, and did anything end badly?
Three commands, before writing any analysis code at all.

```bash
ls runs | wc -l
wc -l runs/*.log | tail -1
wc -l telemetry/*.csv
```

```text
500
  5004 total
  202 telemetry/case_0001.csv
  202 telemetry/case_0002.csv
  202 telemetry/case_0417.csv
  606 total
```

500 logs, 5004 log lines, and telemetry for three of the cases at 202 lines each — 201 samples plus a header. A campaign of 500 cases where most logs are 10 lines and a couple are 12 is already telling you that a few runs printed something the others did not.

```bash
tail -q -n 1 runs/case_0001.log runs/case_0417.log
```

```text
2026-03-14T09:01:21Z INFO  sim end status=OK wall_s=235.2
2026-03-14T12:36:17Z INFO  sim end status=DIVERGED wall_s=156.0
```

The last line of each log carries the status, so `tail -q -n 1 runs/*.log` gives you 500 status lines with no banners, ready to be counted by the tools in the next lessons. That is the whole method: reduce each file to the line that matters, then count.
:::

::: key
`cat` concatenates a whole stream; `less` pages it without loading it; `head`/`tail` take the ends; `tail -f` follows a descriptor and `tail -F` follows a name; `wc -l` counts newline characters. Use `-n N` rather than `-N` whenever more than one file is involved.
:::

## Check yourself

::: check
A colleague says her monitoring has "gone dead" — `tail -f /var/log/sim/campaign.log` printed nothing for two hours, but the job is still running and using CPU. What happened, and what should she have typed?
:::

::: answer
The log was almost certainly rotated. `tail -f` follows the open file descriptor, so it is still reading the inode that was called `campaign.log` when it started. The rotation renamed that inode to `campaign.log.1` and created a fresh `campaign.log`, which the job is now writing to. Her `tail` is watching a file nobody appends to any more — hence silence, not a hung job.

`tail -F` follows the *name*: it notices the file became inaccessible, prints a line saying so, reopens when the name reappears, and continues. On any log that is rotated, `-F` is the right flag.
:::

::: check
`wc -l data.csv` says 4999. Your loader says it read 5000 rows including the header. Both are right. Explain.
:::

::: answer
`wc -l` counts newline characters. If the file's last line has no terminating newline, that line contributes content but no newline, so `wc -l` returns one fewer than the number of lines a human would count. 5000 lines with 4999 newlines is exactly that case.

It is worth caring about, because appending to such a file concatenates the new first line onto the old last line rather than starting a new record. Check the last byte directly:

```bash
tail -c 1 ok.csv | od -c
tail -c 1 bad.csv | od -c
```

```text
0000000  \n
0000001
0000000   2
0000001
```

The first file ends in a newline; the second ends in the character `2`. `od -c` shows the byte, where `cat -A` would show you nothing at all for the second case.
:::

::: check
You have a 4 GB solver trace on a machine with 2 GB of free memory. You need the fiftieth line, the last twenty lines, and every line containing `NaN`. Which tool for each, and which of the three would an editor survive?
:::

::: answer
The fiftieth line: `head -n 50 trace.log | tail -n 1`, or `sed -n '50p' trace.log`. The last twenty: `tail -n 20 trace.log` — `tail` seeks to the end of the file rather than reading forward, so file size is irrelevant. Every `NaN` line: `grep NaN trace.log`, which streams.

All three stream, so all three work in constant memory. An editor that loads the whole buffer would need 4 GB plus overhead and would either thrash or be killed by the out-of-memory killer. That is the reason these tools exist in this form: they read a window, not a file.
:::

::: check
`cat -A` on a config file that your parser rejects shows `dt: 0.002 $`. What is wrong, and why did it look fine on screen?
:::

::: answer
There is a space between `0.002` and the `$` that marks end of line — trailing whitespace. On screen a trailing space is invisible, so the line looked identical to a clean one. A parser that splits on `:` and calls `float()` on the remainder may cope, since `float(" 0.002 ")` is tolerant of surrounding space, but one that compares strings, or splits on a single space and takes field 2, will not.

`cat -A` is the tool precisely because it renders what is there: `$` for end of line, `^M` for a carriage return, `^I` for a tab. When a file "looks fine" and the machine disagrees, look at the bytes.
:::

::: check
Why is `cat file | grep PATTERN` slightly worse than `grep PATTERN file`, beyond style?
:::

::: answer
It starts a second process and copies every byte through a pipe, so it is measurably slower on large inputs, but the substantive loss is information. Given the filename, `grep` can report it — `grep -H` prefixes matches with the name, and with several files it does so by default — and it can seek and use the file's size. Reading from a pipe it can only say "standard input". It also cannot use `grep -r`, `--include`, or the memory-mapping fast path.

`cat` earns its place the moment there is genuinely more than one file, or the input really is a stream. Otherwise, hand the filename to the tool.
:::

## Summary

| Command | What it does | Note |
| --- | --- | --- |
| `cat a b > c` | concatenate in order, nothing inserted | a missing final newline glues two lines |
| `cat -n` / `cat -A` / `cat -v` | number lines / show `$`, `^M`, `^I` / caret-escape control bytes | `-A` is the tool for "the parser disagrees with my eyes" |
| `less` | page without loading; `/` `n` `G` `F` `-S` `q` | `F` follows like `tail -f` but `Ctrl-C` returns to the pager |
| `head -n N`, `head -c N` | first N lines, or bytes | `-c` cuts mid-word |
| `tail -n N`, `tail -n +N` | last N lines, or from line N onward | `-n +2` drops a CSV header |
| `tail -f` vs `tail -F` | follow the descriptor vs follow the name | `-F` survives rotation and says so on stderr |
| `tail -q` | suppress the `==> file <==` banners | use when piping onward |
| `tail -2 a b` | refused: `option used in invalid context` | always write `-n 2` |
| `wc -l` / `-w` / `-c` / `-m` | newlines / words / bytes / characters | `-m` depends on the locale, `-c` does not |
| `timeout 5 cmd` | kill after 5 seconds, exit 124 | how these `tail -f` captures were bounded |
| `file x` | identify a file before reading it | check before `cat`ing anything unknown |

Lesson 03 turns from reading files to being allowed to: the permission bits in that `-rw-r--r--` column, `chmod` in both notations, `chown`, and the `umask` that decides what a new file gets.
