---
id: l02-reading-files-without-an-editor
title: Reading files without an editor
minutes: 20
covers:
  - cat less head tail -f wc
---

A simulation campaign makes a lot of text: 500 run logs, a telemetry table per case, a solver report per case. Your first instinct may be to open them in an editor. Resist it. There are too many to open one by one, some are too big to load, and the one you most want to read — the log of the job running *right now* — is still growing while you look.

Think of the difference between downloading a whole movie before you can watch it and streaming it. Streaming shows you the part you are looking at and never holds the whole film. The shell has a handful of tiny programs that **stream** a file past you in the same way, instead of loading it.

Five of them do most of the work: `cat`, `less`, `head`, `tail` and `wc`. Learn what each one does to a stream and you will stop reaching for an editor. That matters on a build server, where the editor may not be installed and the file may be forty gigabytes.

Everything below was really run and pasted exactly (GNU coreutils 9.4, `less` 590, bash 5.2.21 on Ubuntu 24.04.4). The logs come from a practice campaign of 500 entry-burn cases. Timestamps and counts belong to that practice set; what matters is the shape of the output.

## `cat`: join files, and print by accident

`cat` is short for **[[concatenate|concatenate]]**, which means "join end to end". Its job is to take one or more files and write them, in order, to **[[standard output|standard-output]]** — the stream a program writes its results to, which is your screen unless you send it somewhere else. Printing one file to the screen is the simplest case, and it gave `cat` its everyday use:

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

With two files it does the joining it is named for. The `>` (read "into") sends the output into a file instead of the screen:

```bash
cat configs/entry_burn.yaml configs/entry_burn_v2.yaml > /tmp/both.yaml
wc -l /tmp/both.yaml
```

```text
11 /tmp/both.yaml
```

Five lines plus six lines makes eleven — the answer checks out. `cat` inserts nothing between the files: no separator, no extra line break. So if the first file's last line has no line break at its end, the two files' lines get glued into one. That is a real source of broken CSV files.

Two flags repay learning. `-n` numbers the lines. That is how you find out that the parse error "at line 4" is the `horizon_s` line:

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

`-A` ("all") shows *everything*, including bytes you cannot see. It is the tool for "the program says this file is broken, and it looks fine to me":

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

(`printf` prints text; `\r` and `\n` inside it are ways of typing two invisible characters.) In the `cat -A` view, `$` marks the end of each line, and `^M` (read "control-M") is a **[[carriage return|carriage-return]]** — the byte 0x0D, the extra end-of-line mark Windows uses. So the value on that line is not `1200`. It is `1200` followed by an invisible byte. Shell arithmetic rejects it as an "invalid arithmetic operator", a string comparison with `"1200"` says no, and any strict number parser refuses it. Anyone who moves data between a Windows laptop and a Linux cluster meets this, usually twice.

::: warning Look before you `cat`
Never `cat` a file you have not identified. A program file, or any binary data, holds byte patterns that your terminal reads as **[[control codes|control-codes]]**. Some of them switch the character set, and afterwards your prompt is a row of line-drawing symbols until you type `reset`. Check the file's type first, and look at bytes rather than letters:

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

`file` names the type — here an **[[ELF|elf]]** program. `cat -v` shows control bytes in caret notation (`^@`, `^B`, …) instead of sending them to the terminal. The BuildID belongs to this build of `ls`; yours will differ.
:::

## `less`: the pager you should be using

`less` is a **pager**: it shows a file one screen at a time. The key point is that it does not read the whole file first. Open a 40 GB trajectory dump and the first screen appears instantly, because `less` has read one screen's worth.

It is interactive, so there is no output to paste. The keys worth memorizing:

- `space` and `b` — forward and back one screen. `j` and `k` — one line.
- `g` and `G` — the very top and the very bottom. `G` gets you to the end of a two-million-line log in one keystroke.
- `/pattern` searches forward, `?pattern` searches backward, and `n` and `N` repeat the search forward and back. The pattern is a regular expression (lesson 06).
- Typing `-N` inside `less` toggles line numbers. Typing `-S` toggles line wrapping, which turns a wide CSV from a jumble into neat rows you scroll sideways.
- `F` starts following the file as it grows, like `tail -f` below. `Ctrl-C` stops following and leaves you in the pager — something `tail -f` cannot do.
- `q` quits.

The manual reader, `man`, shows its pages through `less`, so every key above works while you read a manual. If `/` and `n` are the only two you remember, you are already ahead. The keys have not changed in decades — and the name **[[is a joke|less-is-more]]**.

## `head` and `tail`: the two ends

`head` prints the first lines of a file, `tail` the last. Both print 10 unless told otherwise. `-3` below means "three lines":

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

Those six lines are the first thing to read in any run log. The head says what the job *thought* it was doing; the tail says how it ended. Here the run **diverged** — its control loop went unstable — and yet it still printed a miss distance. If you had only collected the `MISS_DISTANCE_M` numbers into a plot, you would have plotted a garbage value without noticing.

Three variants earn their keep:

- `head -c N` takes N **bytes** rather than lines. `head -c 48 runs/case_0417.log` gives `2026-03-14T12:34:56Z INFO  sim start case=0417 s` — cut mid-word, because bytes know nothing about words.
- `tail -n +N` starts *at* line N instead of N lines from the end. `tail -n +2 file.csv` is the standard way to drop a CSV's header line.
- Given several files, both print a banner before each one:

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

`-q` ("quiet") drops the banners. You want that when the output is going into another program rather than onto your screen.

::: warning Write `tail -n 2`, not `tail -2`
The short form `tail -3` works on one file. With several files, GNU `tail` refuses it:

```bash
tail -2 runs/case_0001.log runs/case_0417.log
```

```text
tail: option used in invalid context -- 2
```

Exit status 1. The short `-N` form is an old spelling that `tail` accepts only when it cannot be misread. (`head -2 a b` happens to work, but do not rely on the difference.) Write `-n 2` every time and the problem never comes up.
:::

## `tail -f`: watching a job that is still running

Picture watching a news ticker: new lines appear at the bottom as they happen. `tail -f` ("follow") turns a log into that ticker. It prints the end of the file, then keeps the file open and prints each new line the moment it is written. It is how you watch a simulation without touching it.

Below, a small writer program added one line per second to `run.log` while `tail -f` watched. The capture was stopped after five seconds by `timeout 5`; at a real keyboard you press `Ctrl-C`.

```bash
timeout 5 tail -f run.log
```

```text
2026-03-14T12:31:00Z INFO  t=20.0 alt_m=9900.0
2026-03-14T12:32:00Z INFO  t=40.0 alt_m=8100.0
2026-03-14T12:33:00Z INFO  t=60.0 alt_m=6500.0
2026-03-14T12:34:00Z INFO  t=80.0 alt_m=5100.0
2026-03-14T12:35:00Z INFO  t=100.0 alt_m=3900.0
2026-03-14T12:36:00Z INFO  t=120.0 alt_m=2900.0
```

The first two lines appeared at once. The other four arrived one per second. `timeout` then exited with status **[[124|timeout-124]]**, meaning "I had to stop it".

That is the whole reason `tail -f` exists, and it is what `cat` cannot do: `cat` prints what is there and quits.

Now a subtlety that bites in real work. `tail -f` follows the **file it opened**, not the *name*. Once it has the file open, it holds a **[[file descriptor|file-descriptor]]** — a handle on that one inode — and keeps reading it even if the name is later moved away. Services **[[rotate|log-rotation]]** their logs: rename the full one, start a fresh one with the same name. After that, `tail -f` sits watching the old file, which nobody writes to any more, while the job happily fills the new one.

::: example `-f` goes quiet, `-F` keeps up
Two identical setups. Each starts with six lines in `run2.log`. Two seconds in, the file is renamed to `run2.log.1` and a new `run2.log` is created with one line in it — exactly what a log rotation does.

First with `-f`:

```bash
timeout 5 tail -f run2.log
```

```text
2026-03-14T12:31:00Z INFO  t=20.0 alt_m=9900.0
2026-03-14T12:32:00Z INFO  t=40.0 alt_m=8100.0
2026-03-14T12:33:00Z INFO  t=60.0 alt_m=6500.0
2026-03-14T12:34:00Z INFO  t=80.0 alt_m=5100.0
2026-03-14T12:35:00Z INFO  t=100.0 alt_m=3900.0
2026-03-14T12:36:00Z INFO  t=120.0 alt_m=2900.0
```

Those six lines were in the file when `tail` started. The line written into the *new* `run2.log` never appears. `tail` is still holding the old inode, now called `run2.log.1`, and nothing more will ever be written there.

Now the same thing with `-F`:

```bash
timeout 5 tail -F run2.log
```

```text
2026-03-14T12:31:00Z INFO  t=20.0 alt_m=9900.0
2026-03-14T12:32:00Z INFO  t=40.0 alt_m=8100.0
2026-03-14T12:33:00Z INFO  t=60.0 alt_m=6500.0
2026-03-14T12:34:00Z INFO  t=80.0 alt_m=5100.0
2026-03-14T12:35:00Z INFO  t=100.0 alt_m=3900.0
2026-03-14T12:36:00Z INFO  t=120.0 alt_m=2900.0
tail: 'run2.log' has become inaccessible: No such file or directory
tail: 'run2.log' has appeared;  following new file
2026-03-14T12:40:00Z INFO  rotated, new file
```

Step by step: `-F` printed the same six lines. When the name vanished, it said so. When the name came back, it said so again, reopened it, and printed the new line. Seven data lines in all — six old plus one new — which is exactly what was written.

`-F` follows the **name**. On anything that gets rotated — a service log, a long campaign that starts a new file each hour — `-F` is the right flag, and `-f` is a way to be quietly misinformed.
:::

::: key What `tail -f` does that `cat` cannot
`tail -f` keeps the file open and prints new bytes as they are appended, so you can watch a running job. `tail -F` additionally re-opens the file if it is rotated or replaced. In short: `-f` follows a descriptor, `-F` follows a name.
:::

## `wc`: counting, and what it counts

`wc` ("word count") reports lines, words and bytes. With no flags it prints all three:

```bash
wc runs/case_0417.log
```

```text
 12  70 716 runs/case_0417.log
```

Twelve lines, 70 words (runs of characters separated by spaces), 716 bytes. `-l`, `-w` and `-c` pick one of the three.

Given several files, it adds a total line — the cheap way to size a whole campaign. The `*` in `runs/*.log` (read "star") is a **wildcard**: the shell replaces it with every matching name.

```bash
wc -l runs/*.log | tail -1
```

```text
  5004 total
```

5004 lines across 500 logs. And `ls runs | wc -l` prints `500`: it counts *files* by counting the lines `ls` printed, one name per line. That is safe here only because no name contains a line break. A filename with a line break inside it would be counted twice, and `find runs -type f | wc -l` has the same weakness. The robust form prints one dot per file and counts the dots: `find runs -type f -printf . | wc -c` (lesson 06 covers `find`).

::: warning `wc -l` counts line breaks, not lines
`wc -l` counts newline characters — the invisible byte at the end of each line. A last line with no newline after it is not counted:

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

(`echo` adds a newline; `printf` adds only what you ask for.) One byte of content, zero lines. So a data file that ends without a final newline is under-counted by one — and worse, adding to the end of it glues the new line onto the old last line. `tail -c 1 file | od -c` shows the file's last byte: `\n` if the newline is there, the last data character if it is not.
:::

`-m` counts **characters** instead of bytes. The two differ only for letters outside plain English text, and which answer you get depends on the **[[locale|locale]]** — a setting of your session, not of the file:

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

The file holds `α = 2.4 deg` and a newline. The Greek letter alpha takes **[[two bytes in UTF-8|utf-8]]**, so the file is 13 bytes but 12 characters. The session that made this had no locale set at all, so `wc -m` fell back to counting bytes and agreed with `-c`. Writing `LC_ALL=C.UTF-8` in front of the command forced a UTF-8 locale for that one run, and it counted characters. Expect this difference between your laptop and a bare-bones cluster node.

::: example How big is this campaign, and did anything end badly?
Before writing any analysis code, three commands:

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

Read them in order:

1. 500 log files — one per case, as planned.
2. 5004 log lines. If every log had 10 lines the total would be $500 \times 10 = 5000$. There are 4 extra lines, so a few runs printed something the others did not. That is worth a look.
3. Telemetry exists for three cases, 202 lines each: 201 data rows plus a header. Check: $3 \times 202 = 606$, matching the total.

Now the endings. Each log's last line holds its status:

```bash
tail -q -n 1 runs/case_0001.log runs/case_0417.log
```

```text
2026-03-14T09:01:21Z INFO  sim end status=OK wall_s=235.2
2026-03-14T12:36:17Z INFO  sim end status=DIVERGED wall_s=156.0
```

So `tail -q -n 1 runs/*.log` gives you 500 status lines with no banners, ready to be counted by the tools in lessons 05 and 06. That is the whole method: shrink each file to the one line that matters, then count.
:::

::: key The five tools
`cat` joins and prints a whole stream; `less` pages it without loading it; `head` and `tail` take the two ends; `tail -f` follows a descriptor and `tail -F` follows a name; `wc -l` counts newline characters. Write `-n N` rather than `-N` whenever more than one file is involved.
:::

## Check yourself

::: check
A colleague says her monitoring has "gone dead". `tail -f /var/log/sim/campaign.log` has printed nothing for two hours, but the job is still running and busy. What happened, and what should she have typed?
:::

::: answer
The log was almost certainly rotated. `tail -f` follows the file it opened, so it is still reading the inode that was called `campaign.log` when it started. The rotation renamed that inode to `campaign.log.1` and created a fresh `campaign.log`, which the job now writes to. Her `tail` is watching a file nobody adds to any more — so it is silent, not hung.

`tail -F` follows the *name*: it notices the file disappear, says so, reopens it when the name comes back, and carries on. On any rotated log, `-F` is the right flag.
:::

::: check
`wc -l data.csv` says 4999. Your loader says it read 5000 rows, including the header. Both are right. How?
:::

::: answer
`wc -l` counts newline characters. If the file's last line has no newline after it, that line adds content but no newline, so `wc -l` reports one fewer than a person would count: 5000 lines, 4999 newlines.

It matters because adding to such a file glues the new first line onto the old last line. Check the final byte directly:

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

The first file ends in a newline; the second ends in the character `2`. `od -c` shows the actual byte, where `cat -A` would show nothing unusual for the second case.
:::

::: check
You have a 4 GB solver trace on a machine with 2 GB of free memory. You need the fiftieth line, the last twenty lines, and every line containing `NaN`. Which tool for each, and would an editor cope?
:::

::: answer
- The fiftieth line: `head -n 50 trace.log | tail -n 1` (take the first fifty, then the last of those), or `sed -n '50p' trace.log`.
- The last twenty: `tail -n 20 trace.log`. `tail` jumps straight to the end of the file instead of reading forward, so the file's size does not matter.
- Every `NaN` line: `grep NaN trace.log`, which streams (lesson 06).

All three stream, so each uses a small, fixed amount of memory. An editor that loads the whole file would need more than 4 GB and would either crawl or be killed for using too much memory. That is why these tools exist in this form: they read a window, not the whole file.
:::

::: check
`cat -A` on a settings file that your program rejects shows `dt: 0.002 $`. What is wrong, and why did it look fine on screen?
:::

::: answer
There is a space between `0.002` and the `$` that marks the end of the line: **trailing whitespace**. A trailing space is invisible on screen, so the line looked identical to a clean one.

A program that splits on `:` and converts the rest with Python's `float()` may cope, because `float(" 0.002 ")` ignores surrounding spaces. A program that compares strings, or splits on single spaces and takes the second field, will not. `cat -A` is the tool because it shows what is really there: `$` for end of line, `^M` for a carriage return, `^I` for a tab.
:::

::: check
Why is `cat file | grep PATTERN` slightly worse than `grep PATTERN file`, beyond style?
:::

::: answer
It starts an extra program and copies every byte through a pipe, which is slower on big files. The bigger loss is information. Given a filename, `grep` can report it — `grep -H` puts the name in front of each match, and with several files it does so by default. Reading from a pipe, all it can say is "standard input". It also cannot use options that need real files, such as `grep -r` (search a whole directory) or `--include`.

`cat` earns its place when you really are joining several files, or the input really is a stream. Otherwise, give the filename to the tool.
:::

## Summary

| Command | What it does | Note |
| --- | --- | --- |
| `cat a b > c` | join in order, nothing inserted | a missing final newline glues two lines |
| `cat -n` / `cat -A` / `cat -v` | number lines / show `$`, `^M`, `^I` / show control bytes safely | `-A` is for "the program disagrees with my eyes" |
| `file x` | name a file's type | check before you `cat` anything unknown |
| `less` | page without loading; `/` `n` `G` `F` `-S` `q` | `F` follows; `Ctrl-C` returns to the pager |
| `head -n N`, `head -c N` | first N lines, or bytes | `-c` cuts mid-word |
| `tail -n N`, `tail -n +N` | last N lines, or from line N on | `-n +2` drops a CSV header |
| `tail -f` vs `tail -F` | follow the descriptor vs follow the name | `-F` survives rotation and says so |
| `tail -q` | no `==> file <==` banners | use when feeding another program |
| `tail -2 a b` | refused: `option used in invalid context` | always write `-n 2` |
| `wc -l` / `-w` / `-c` / `-m` | newlines / words / bytes / characters | `-m` depends on the locale, `-c` does not |
| `timeout 5 cmd` | stop after 5 seconds, exit 124 | how these `tail -f` captures ended |

Lesson 03 moves from reading files to being *allowed* to: the permission letters in that `-rw-r--r--` column, `chmod` in both notations, `chown`, and the `umask` that decides what a brand-new file gets.

::: context concatenate A word about chains
"Concatenate" comes from the Latin *catena*, a chain: to concatenate is to link things into a chain, one after another. Programmers use it for joining any two sequences end to end — two files, two strings, two lists.

`cat` was one of the first Unix programs, and its manual still describes it as concatenating files and printing them on standard output. Using it to show a single file is a side effect people liked so much it became the main use.
:::

::: context standard-output Where a program's output goes
Every program on Linux starts with three open streams, numbered 0, 1 and 2. Stream 0, **standard input**, is where it reads from. Stream 1, **standard output**, is where it writes results. Stream 2, **standard error**, is where it writes complaints.

By default all three are connected to your terminal, which is why output appears on screen. The shell can reconnect them before a program starts: `>` sends standard output into a file, and `|` connects one program's standard output to the next program's standard input. Lesson 05 is built on these three streams.
:::

::: context carriage-return Two bytes where one was expected
Old teleprinters needed two separate commands at the end of a line: **carriage return** moved the print head back to the left edge, and **line feed** rolled the paper up one line. Windows kept both, so its lines end in the bytes 0x0D 0x0A. Linux uses only the line feed, 0x0A. Here is what `printf "alt_m=1200\r\n"` wrote:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2" fill="#fff">
    <rect x="12" y="30" width="28" height="30"/><rect x="40" y="30" width="28" height="30"/><rect x="68" y="30" width="28" height="30"/>
    <rect x="96" y="30" width="28" height="30"/><rect x="124" y="30" width="28" height="30"/><rect x="152" y="30" width="28" height="30"/>
    <rect x="180" y="30" width="28" height="30"/><rect x="208" y="30" width="28" height="30"/><rect x="236" y="30" width="28" height="30"/>
    <rect x="264" y="30" width="28" height="30"/>
    <rect x="292" y="30" width="28" height="30" fill="#f2b880"/><rect x="320" y="30" width="28" height="30" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="26" y="50">a</text><text x="54" y="50">l</text><text x="82" y="50">t</text><text x="110" y="50">_</text>
    <text x="138" y="50">m</text><text x="166" y="50">=</text><text x="194" y="50">1</text><text x="222" y="50">2</text>
    <text x="250" y="50">0</text><text x="278" y="50">0</text><text x="306" y="50">\r</text><text x="334" y="50">\n</text>
  </g>
  <text x="306" y="82" font-size="11" text-anchor="middle" fill="#b4232c">0x0D</text>
  <text x="334" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">0x0A</text>
  <text x="138" y="82" font-size="11" text-anchor="middle" fill="#6c7a93">12 bytes; the screen shows only the first 10</text>
</svg>
```

A Linux program reading this line keeps everything before the 0x0A — including the 0x0D.
:::

::: context control-codes Bytes your terminal obeys
A terminal does not only draw letters. Certain bytes are instructions to it: move the cursor, change color, clear the screen, switch to a different character set. Programs like `less` and `vim` use these on purpose to draw their screens.

A binary file is full of arbitrary bytes, so `cat`ing one sends the terminal a random stream of instructions. If one of them switches the character set, ordinary letters come out as line-drawing symbols. Typing `reset` (even if you cannot read what you type) tells the terminal to return to its normal state.
:::

::: context elf The first bytes of every Linux program
Linux programs are stored in a format called **ELF**, the Executable and Linkable Format. Every ELF file begins with the same four bytes: 0x7F, then the letters `E`, `L`, `F`. That opening is a "magic number" — a fixed signature that lets a tool like `file` recognize the format from the first few bytes, whatever the file's name.

In the `cat -v` output, byte 0x7F appears as `^?` and the next three bytes as `ELF`. The `^@` marks that follow are zero bytes, which are common in binary data and never appear in ordinary text.
:::

::: context less-is-more Why it is called less
The older pager was called `more`, because it showed a screen and then waited for you to ask for more. It could only go forward. When a more capable pager that could also scroll back was written in the 1980s, it was named `less`, after the saying "less is more".

On Ubuntu, `more` is still a separate, simpler program from util-linux; on some other systems, typing `more` actually runs `less`. Either way, reach for `less`.
:::

::: context timeout-124 Telling "stopped" from "finished"
`timeout 5 cmd` runs `cmd` and, if it is still going after five seconds, stops it. Its own exit status then tells you which happened: 124 means "time ran out and I stopped it"; otherwise it passes on `cmd`'s own exit status.

That matters in scripts. A test that ends with status 0 passed, one that ends with 124 hung, and one that ends with 1 failed on its own. Watching a log with `tail -f` never finishes by itself, so under `timeout` it always ends with 124.
:::

::: context file-descriptor A handle on the file, not its name
When a program opens a file, the kernel gives it a small number called a **file descriptor**. From then on the program reads through that number, which is tied to the inode it opened — not to the name it used to find it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 156" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="20" width="84" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="54" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">tail -f</text>
  <rect x="12" y="96" width="84" height="34" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="54" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">tail -F</text>
  <rect x="236" y="20" width="112" height="34" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="292" y="36" font-size="11" text-anchor="middle" fill="#fff">old inode</text>
  <text x="292" y="49" font-size="11" text-anchor="middle" fill="#fff">run2.log.1</text>
  <rect x="236" y="96" width="112" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="292" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">new inode</text>
  <text x="292" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">run2.log</text>
  <path d="M96,37 L234,37" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="165" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">holds descriptor</text>
  <path d="M96,113 L234,113" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="165" y="107" font-size="11" text-anchor="middle" fill="#1d6fd1">reopens by name</text>
  <text x="292" y="146" font-size="11" text-anchor="middle" fill="#b4232c">the job now writes here</text>
</svg>
```

After rotation the job writes to the new inode. `tail -f` is still attached to the old one; `tail -F` notices and switches.
:::

::: context log-rotation Why logs get renamed at midnight
A service that runs for months would fill the disk if its log only ever grew. So a tool called `logrotate`, usually run once a day, renames `app.log` to `app.log.1`, shifts older ones along (`app.log.1` becomes `app.log.2`, and so on), compresses or deletes the oldest, and lets the service start a fresh `app.log`.

The systemd journal (lesson 12) manages its own size in a similar way. Anything that watches a log file over hours has to survive this — which is exactly what `tail -F` is for.
:::

::: context locale Your session's language settings
The **locale** tells programs which language and character encoding you use: how to sort words, how to print dates and numbers, and how to split bytes into characters. It lives in environment variables such as `LANG` and `LC_ALL` (lesson 10).

When none is set, programs use the plain "C" or "POSIX" locale, where every byte counts as one character. A freshly installed server or a container often has no locale set, while your laptop uses UTF-8. That is why `wc -m`, `sort` and `grep` can give different answers on two machines for the same file.
:::

::: context utf-8 One letter, two bytes
**UTF-8** stores the 128 plain-English characters in one byte each, and everything else — accented letters, Greek, emoji — in two to four bytes. Greek alpha, α, is the two bytes 0xCE 0xB1. So `α = 2.4 deg` plus a newline is 12 characters but 13 bytes:

$$
1 \times 2 + 11 \times 1 = 13 \text{ bytes}
$$

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="12" y="30" width="52" height="30" fill="#f2b880"/>
    <rect x="64" y="30" width="26" height="30" fill="#fff"/><rect x="90" y="30" width="26" height="30" fill="#fff"/><rect x="116" y="30" width="26" height="30" fill="#fff"/><rect x="142" y="30" width="26" height="30" fill="#fff"/><rect x="168" y="30" width="26" height="30" fill="#fff"/><rect x="194" y="30" width="26" height="30" fill="#fff"/><rect x="220" y="30" width="26" height="30" fill="#fff"/><rect x="246" y="30" width="26" height="30" fill="#fff"/><rect x="272" y="30" width="26" height="30" fill="#fff"/><rect x="298" y="30" width="26" height="30" fill="#fff"/><rect x="324" y="30" width="26" height="30" fill="#8fb8f0"/>
    <line x1="38" y1="30" x2="38" y2="60" stroke-dasharray="3 2"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="25" y="50">CE</text><text x="51" y="50">B1</text>
    <text x="103" y="50">=</text><text x="155" y="50">2</text><text x="181" y="50">.</text><text x="207" y="50">4</text><text x="259" y="50">d</text><text x="285" y="50">e</text><text x="311" y="50">g</text><text x="337" y="50">\n</text>
  </g>
  <text x="38" y="22" font-size="11" text-anchor="middle" fill="#b4232c">α: 2 bytes</text>
  <text x="180" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">13 boxes = 13 bytes; the blank boxes are spaces</text>
</svg>
```

In a UTF-8 locale, `wc -m` reads 0xCE 0xB1 as one character. In the plain C locale it counts each byte separately.
:::
