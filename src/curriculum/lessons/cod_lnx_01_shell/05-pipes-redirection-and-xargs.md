---
id: l05-pipes-redirection-and-xargs
title: Pipes, redirection and xargs
minutes: 21
covers:
  - 'Pipes and redirection: | > >> 2> 2>&1 /dev/null, here-docs, tee, xargs'
---

Every program you have met so far reads from one stream and writes to two. That is the whole design: **standard input** (file descriptor 0), **standard output** (fd 1) and **standard error** (fd 2). None of them is a file until the shell makes it one, and the shell will attach any of them to a file, to a terminal, to `/dev/null`, or to another program — before the program starts and without the program's knowledge or consent.

This is the part of the shell that turns twenty small tools into one tool for whatever question you have today. "Which of these 500 runs diverged" is not a program anybody wrote; it is `grep` and `sort` and `head` connected end to end. The connecting is what this lesson is about.

All transcripts were produced on this machine and pasted verbatim: Ubuntu 24.04.4, GNU bash 5.2.21, GNU coreutils 9.4, GNU findutils 4.9.0 (`xargs`), GNU grep 3.11, mawk 1.3.4. The fixture is a campaign of 500 entry-burn logs; timings depend on the machine, which has four cores.

## The three streams

Three redirection operators cover the ordinary cases:

- `> file` sends standard output to `file`, **truncating it to zero length first**;
- `>> file` appends instead;
- `< file` feeds `file` to standard input.

```bash
echo "one" > /tmp/r.txt; cat /tmp/r.txt
echo "two" > /tmp/r.txt; cat /tmp/r.txt
echo "three" >> /tmp/r.txt; cat /tmp/r.txt
```

```text
one
two
two
three
```

The second `>` destroyed the first line without a word. This is the most easily made destructive operation in the shell: `>` truncates before the command on the left has run at all, so `sort results.txt > results.txt` produces an empty file — the truncation happens first, and `sort` then reads nothing. There is no undo:

```bash
printf "c\nb\na\n" > res.txt; wc -c res.txt
sort res.txt > res.txt; wc -c res.txt
```

```text
6 res.txt
0 res.txt
```

`set -o noclobber` makes `>` refuse to overwrite an existing file, and `>|` overrides it when you mean it:

```text
bash: nc.txt: cannot overwrite existing file
```

Exit status 1, and the original contents intact.

Standard error is separate, and that separation is the point:

```bash
ls runs/case_0001.log nosuch.log
```

```text
ls: cannot access 'nosuch.log': No such file or directory
runs/case_0001.log
```

Two streams, interleaved on your terminal because both are pointed at it. Send only fd 1 to a file and the error still reaches you:

```bash
ls runs/case_0001.log nosuch.log > /tmp/out.txt 2>/tmp/err.txt
```

```text
--stdout--
runs/case_0001.log
--stderr--
ls: cannot access 'nosuch.log': No such file or directory
```

`2>` redirects fd 2. That is why a long job's `progress.log` can be clean while its problems go somewhere else entirely, and why `cmd > log.txt` on a failing job produces an empty log and an error on your screen.

### `2>&1`, and why the order matters

`2>&1` does not mean "send stderr to stdout". It means **make fd 2 a duplicate of whatever fd 1 points at right now**. Redirections are applied left to right, so the position of `2>&1` decides everything:

```bash
ls runs/case_0001.log nosuch.log > /tmp/both.txt 2>&1
cat /tmp/both.txt
```

```text
ls: cannot access 'nosuch.log': No such file or directory
runs/case_0001.log
```

Both streams in the file. Now swap the two:

```bash
ls runs/case_0001.log nosuch.log 2>&1 > /tmp/both2.txt
```

```text
ls: cannot access 'nosuch.log': No such file or directory
--file--
runs/case_0001.log
```

The error came to the terminal and only stdout reached the file. When `2>&1` was processed, fd 1 still pointed at the terminal, so fd 2 was bound to the terminal; *then* fd 1 was moved to the file, and fd 2 stayed where it had been put. Bash also offers `&> file` as a shorthand for the correct order, which is convenient and not portable to `sh`.

`/dev/null` is a device that discards everything written to it and returns end-of-file when read. `2>/dev/null` is how you silence the errors you have decided are noise, and `>/dev/null` is how you throw away output you only wanted for its exit status:

```bash
ls nosuch.log 2>/dev/null; echo "exit was $?"
```

```text
exit was 2
```

The message is gone; the exit status is not. That is exactly the right thing to discard and the wrong thing to ignore.

::: warning
`2>/dev/null` on a command whose output you are collecting is how a campaign quietly produces half the runs it was asked for. The errors are the part that tells you a case failed. Redirect them to a file — `2>errors.log` — and look at that file; do not discard them. And never write `cmd >out.txt 2>out.txt`: two independent redirections to the same file give you two independent file offsets, and the streams overwrite each other. `cmd >out.txt 2>&1` is the correct form, because fd 2 then shares fd 1's offset.
:::

::: key
Redirections are applied left to right. `cmd > f 2>&1` sends both streams to `f`; `cmd 2>&1 > f` sends stderr to the original terminal and only stdout to `f`. `>` truncates before the command runs; `>>` appends; `/dev/null` discards.
:::

## Pipes

`a | b` connects a's standard output to b's standard input through a kernel buffer, and runs both at once. They are not sequential: `b` starts immediately and consumes what `a` produces as it appears, which is why a pipeline over a huge file uses almost no memory and why `head` can stop a long-running producer early.

```bash
grep -h MISS_DISTANCE_M runs/*.log | awk '{print $4}' | sort -g | tail -3
```

```text
784.1
1904.3
4812.6
```

Read it as a sentence. `grep -h` pulls the miss-distance line out of all 500 logs (`-h` suppresses the filename prefix). `awk '{print $4}'` keeps the fourth whitespace-separated field, the number. `sort -g` sorts numerically in the general sense, so `4812.6` beats `784.1` rather than losing to it alphabetically. `tail -3` takes the largest three. Three of your 500 cases are above 700 m, one of them by a factor of six — and you have not written a line of Python.

### The exit status of a pipeline

By default a pipeline's exit status is that of the **last** command only. This hides failures:

```bash
grep NOTHING runs/case_0001.log | wc -l; echo "exit=$?"
```

```text
0
exit=0
```

`grep` found nothing and exited 1; `wc` succeeded, so the pipeline reports success. In a script with `set -e` this pipeline will not stop anything. Two fixes:

```bash
grep NOTHING runs/case_0001.log | wc -l; echo "pipeline status ${PIPESTATUS[*]}"
```

```text
0
pipeline status 1 0
```

`PIPESTATUS` is a bash array holding every stage's status — read it *immediately*, because the next command replaces it. Or set the option that makes the pipeline fail if any stage does:

```bash
set -o pipefail
grep NOTHING runs/case_0001.log | wc -l; echo "exit=$?"
```

```text
0
exit=1
```

`set -euo pipefail` at the top of a batch script is the standard incantation, and `pipefail` is the member of it that people leave out and regret.

## `tee`: a branch in the pipe

`tee` writes its input to a file *and* passes it on, so you can capture an intermediate stage without breaking the pipeline:

```bash
grep -h MISS_DISTANCE_M runs/*.log | awk '{print $4}' | sort -g | tail -3 | tee /tmp/worst.txt
```

```text
784.1
1904.3
4812.6
```

The numbers appeared on screen and are also in the file. `tee -a` appends rather than truncating. Put `tee` in the middle and both halves work:

```bash
head -3 runs/case_0417.log | tee /tmp/t1.txt | wc -l
```

```text
3
```

`wc` saw the three lines, and `/tmp/t1.txt` now holds them. The other standard use is the one from lesson 03: `command | sudo tee /etc/something` makes the *privileged* program the one that opens the file, because your own shell cannot.

## Here-documents and here-strings

A here-document feeds literal text to a command's standard input, ending at the word you name:

```bash
cat <<EOF > sweep.yaml
vehicle: falcon9-s1
cases: 500
dt: 0.002
EOF
```

That is how a script writes a configuration file without an editor and without quoting a multi-line string. The body is expanded like a double-quoted string by default:

```bash
cat <<EOF
expanded $HOME
EOF
```

```text
expanded /home/eng
```

Quote the delimiter and nothing is expanded — this is the form to use whenever the body contains `$`, backticks or backslashes that belong to another language:

```bash
cat <<"EOF"
literal $HOME and $(date)
EOF
```

```text
literal $HOME and $(date)
```

The difference is not cosmetic. A here-document holding a Python or awk program will be mangled by the shell unless the delimiter is quoted. `<<-EOF` additionally strips leading *tabs* (not spaces) from each line, which lets you indent the body inside a function.

Any program that reads standard input can be driven this way:

```bash
python3 <<EOF
import math
print("dv =", round(9.80665*311*math.log(1/0.4), 1), "m/s")
EOF
```

```text
dv = 2794.6 m/s
```

A here-*string*, `<<<`, is the one-line version, useful for feeding a single variable to a tool that insists on a file or a stream:

```bash
grep -c INFO <<< "2026-03-14T09:00:00Z INFO sim start"
```

```text
1
```

## `xargs`: turning a stream into arguments

A pipe connects stdout to stdin. But most commands do not read filenames from stdin — `rm`, `ls`, `cp`, your simulator — they take them as *arguments*. `xargs` is the adapter: it reads items from standard input and builds command lines out of them.

```bash
printf "case_0417\ncase_0288\n" | xargs echo running
```

```text
running case_0417 case_0288
```

```bash
printf "case_0417\ncase_0288\n" | xargs -n 1 echo running
```

```text
running case_0417
running case_0288
```

`-n 1` means one item per command line; without it `xargs` packs as many as will fit. `-I{}` puts each item at a named position instead of at the end, which is what you need when the item is not the last argument:

```bash
printf "a\nb\nc\n" | xargs -I{} echo "case {} done"
```

```text
case a done
case b done
case c done
```

Two flags prevent real accidents. `-r` (`--no-run-if-empty`) stops `xargs` running the command at all when the input is empty. Watch what happens without it:

```bash
grep -l NOTHING runs/*.log | xargs wc -l
```

```text
0
```

`grep` matched nothing, so `xargs` ran bare `wc -l`, which read from *its* standard input — the terminal — and reported zero. Harmless here. With `rm` in place of `wc`, a command with no arguments is harmless too; with `rm -rf .` built by a script, it is not. Add `-r` and nothing runs:

```bash
grep -l NOTHING runs/*.log | xargs -r wc -l; echo "exit=$?"
```

```text
exit=0
```

::: example Filenames with spaces, and the only safe pairing
Two log files whose names contain spaces, which is what you get the moment data comes from a Windows machine or an instrument's export dialogue.

```bash
find /tmp/sp -name "*.log" | xargs ls -l
```

```text
ls: cannot access '/tmp/sp/entry': No such file or directory
ls: cannot access 'burn': No such file or directory
ls: cannot access '01.log': No such file or directory
ls: cannot access '/tmp/sp/entry': No such file or directory
ls: cannot access 'burn': No such file or directory
ls: cannot access '02.log': No such file or directory
```

Exit status 123. `xargs` splits its input on whitespace, so `entry burn 01.log` became three arguments. Had the command been `rm`, it would have tried to delete a file called `burn` — and on a bad day succeeded.

NUL is the only byte that cannot appear in a filename, so it is the only safe separator. `find -print0` emits it and `xargs -0` expects it:

```bash
find /tmp/sp -name "*.log" -print0 | xargs -0 ls -l
```

```text
-rw-r--r-- 1 root root 0 Sep 22 20:28 /tmp/sp/entry burn 01.log
-rw-r--r-- 1 root root 0 Sep 22 20:28 /tmp/sp/entry burn 02.log
```

`find` can also skip the pipe entirely, and this form has no quoting hazard at all:

```bash
find /tmp/sp -name "*.log" -exec ls -l {} +
```

```text
-rw-r--r-- 1 root root 0 Sep 22 20:28 /tmp/sp/entry burn 01.log
-rw-r--r-- 1 root root 0 Sep 22 20:28 /tmp/sp/entry burn 02.log
```

The `+` at the end batches the matches into as few command lines as possible, exactly as `xargs` does; a `\;` there would run `ls` once per file. Prefer `-exec ... +` when `find` is already in the pipeline, and `-print0 | xargs -0` when you need `xargs` flags such as `-P`.
:::

### Why `xargs` exists at all: `Argument list too long`

The kernel caps the total size of a command's arguments and environment. On this machine:

```bash
getconf ARG_MAX
```

```text
2097152
```

Two megabytes, and there is a separate cap of 128 KiB on any *single* argument. Exceed either and the `exec` fails before the program runs a single instruction:

```bash
/bin/echo $(python3 -c "print('x'*132000)")
```

```text
/bin/echo: Argument list too long
```

The same line with 130,000 characters succeeds, which pins the limit at 131,072 bytes — 32 pages — for one argument.

This is what `rm *.log` does in a directory of 200,000 run logs: the shell expands the glob into one enormous argument list, and the kernel refuses the `exec`. Nothing is deleted and nothing is wrong with your command. `xargs` exists precisely for this — it measures the limit and splits the work into as many command lines as it takes, which is why `find . -name '*.log' -print0 | xargs -0 rm` works where `rm *.log` cannot.

::: example Driving a batch of simulations across the cores you have
`xargs -P N` runs up to N command lines at once. With a stand-in `run_case.sh` that takes one second per case, and eight cases:

```bash
time xargs -n 1 ./run_case.sh < cases.txt
```

```text
case 0001 done
case 0002 done
case 0003 done
case 0004 done
case 0005 done
case 0006 done
case 0007 done
case 0008 done

real	0m8.039s
user	0m0.027s
sys	0m0.011s
```

```bash
time xargs -n 1 -P 4 ./run_case.sh < cases.txt
```

```text
case 0001 done
case 0002 done
case 0003 done
case 0004 done
case 0005 done
case 0006 done
case 0007 done
case 0008 done

real	0m2.012s
user	0m0.025s
sys	0m0.007s
```

Eight seconds becomes two on this four-core machine (`nproc` reports 4). That is the whole of parallel Monte Carlo on one box: a file of case ids, a script that runs one case, and `-P $(nproc)`.

Two cautions that matter as soon as the cases do real work. First, the outputs interleave — here each case printed one atomic line, but two processes writing multi-line output to the same stream will produce shuffled text. Give each case its own output file. Second, `-P` with more jobs than cores makes things slower for CPU-bound work, and `-P 0` means "as many as possible", which on a 500-case list means 500 simultaneous simulations and a machine that stops responding. Set it to `$(nproc)` and measure.
:::

::: note
`<(command)` is *process substitution*: bash runs the command and hands its output to the other program as a filename, so tools that demand files can be fed pipelines.

```bash
diff <(head -3 runs/case_0001.log) <(head -3 runs/case_0002.log)
```

```text
1,3c1,3
< 2026-03-14T09:00:00Z INFO  sim start case=0001 seed=545923
< 2026-03-14T09:00:00Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
< 2026-03-14T09:00:01Z INFO  guidance mode=PDG horizon_s=18.0
---
> 2026-03-14T09:00:31Z INFO  sim start case=0002 seed=952054
> 2026-03-14T09:00:31Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
> 2026-03-14T09:00:32Z INFO  guidance mode=PDG horizon_s=18.0
```

Comparing the output of two commands without creating two temporary files is worth the syntax on its own.
:::

## Check yourself

::: check
`./run_sweep.sh > sweep.log 2>&1` runs overnight and `sweep.log` is empty, yet the output directory has 500 files in it. What is the likeliest explanation?
:::

::: answer
The script's own output went somewhere else. The two usual cases. First, it redirected internally — a line like `exec > /var/log/sweep/run.log` or a per-case `> case.log` inside the loop — so nothing was left for the outer redirection to capture. Second, the program writes to the terminal device directly, `/dev/tty`, which bypasses fd 1 and fd 2 entirely; some progress bars do this deliberately so they are not captured.

There is a third possibility worth ruling out first: the file is not empty, it is buffered. A program writing to a pipe or a file uses block buffering rather than line buffering, so nothing appears until 4 or 8 KB have accumulated or the program exits. If the job is still running, `ls -l sweep.log` showing 0 may simply mean it has not filled a block yet. `stdbuf -oL ./run_sweep.sh` forces line buffering.
:::

::: check
Explain, in terms of file descriptors, why `cmd 2>&1 > out.txt` does not put both streams in the file — and give the correct form.
:::

::: answer
The shell processes redirections strictly left to right, and `2>&1` copies *where fd 1 currently points* into fd 2. At the moment it is processed, fd 1 has not been touched yet, so it still refers to the terminal; fd 2 is therefore made a second reference to the terminal. Only then does `> out.txt` move fd 1 to the file. Fd 2 is unaffected by that later move, because it is bound to the terminal itself, not to "whatever fd 1 is".

The correct form is `cmd > out.txt 2>&1`: fd 1 is moved to the file first, then fd 2 is made a duplicate of it, so both share the file *and its offset*. Bash's `&> out.txt` is shorthand for the correct order. Note that `cmd > out.txt 2> out.txt` is not equivalent — two separate opens give two independent offsets, and the streams clobber each other.
:::

::: check
`find . -name '*.log' | xargs rm` on a directory where one file is named `entry burn 01.log`. What does `rm` actually receive, and what is the exposure? Give two safe rewrites.
:::

::: answer
`xargs` splits its input on whitespace and newlines by default, so the single path `./entry burn 01.log` arrives as three arguments: `./entry`, `burn`, `01.log`. `rm` is handed all three. Two produce "No such file or directory"; but if a file called `burn` happens to exist in the current directory, it is deleted — a file nobody asked to remove and whose name appears nowhere in the command.

Two safe rewrites. `find . -name '*.log' -print0 | xargs -0 rm` uses NUL as the separator, which is the one byte that cannot occur in a filename. Or drop `xargs` entirely: `find . -name '*.log' -exec rm {} +`, where `find` passes the paths to `rm` directly with no text parsing in between. Add `-r` to any `xargs` invocation so an empty match list does not run the command at all.
:::

::: check
A campaign script ends with `grep -c DIVERGED runs/*.log | wc -l` and the surrounding `set -e` never triggers, even on days when `grep` fails. Why, and what are the two ways to fix it?
:::

::: answer
A pipeline's exit status is the status of its last command only. `wc` succeeds whatever `grep` did, so the pipeline reports 0 and `set -e` has nothing to act on. `grep` exiting 1 for "no matches" — which is its normal, documented behaviour, not an error — is invisible.

Fix one: `set -o pipefail`, which makes the pipeline return the status of the rightmost command that failed. Combined as `set -euo pipefail` it is the standard header for a script that must not continue past a failure. Fix two: inspect `${PIPESTATUS[@]}` immediately after the pipeline, which is a bash array holding one status per stage — `${PIPESTATUS[0]}` is `grep`'s. It must be read on the very next line, because any other command overwrites it.
:::

::: check
Why can `head -3 hugefile.log` return instantly on a 40 GB file when it is on the right-hand side of a pipe — `grep PATTERN hugefile.log | head -3` — rather than having to wait for `grep` to finish?
:::

::: answer
Because the two run concurrently and the pipe has a finite buffer. `grep` writes into the pipe; `head` reads three lines, prints them and exits. The pipe's read end is then closed, so the next time `grep` writes, the kernel sends it `SIGPIPE`, whose default action is to terminate. `grep` dies part-way through the file and never reads the rest.

That is the mechanism behind two things you will meet. It is why `| head` is cheap on enormous inputs. And it is why a program that ignores `SIGPIPE` reports the failed write instead. Python sets it to be ignored, so the write raises an exception and the interpreter prints, on stderr, a traceback ending

```text
BrokenPipeError: [Errno 32] Broken pipe
```

That is not a bug in your generator script; it is the expected consequence of `head` having seen enough.
:::

## Summary

| Construct | Meaning | Note |
| --- | --- | --- |
| `> f` / `>> f` / `< f` | stdout to f, truncating / appending / stdin from f | `>` truncates before the command runs |
| `2> f` | stderr to f | `cmd > log` alone leaves errors on the terminal |
| `cmd > f 2>&1` | both streams to f | order matters; `2>&1 > f` does not do this |
| `&> f` | bash shorthand for the correct order | not portable to `sh` |
| `/dev/null` | discards writes, reads as EOF | discarding stderr hides failed cases |
| `a \| b` | a's stdout to b's stdin, both running at once | `head` closing early sends `SIGPIPE` to a |
| `${PIPESTATUS[@]}`, `set -o pipefail` | every stage's status; fail if any stage fails | a pipeline otherwise reports only the last stage |
| `tee f`, `tee -a f` | copy the stream to f and pass it on | `\| sudo tee f` writes with privilege |
| `<<EOF` / `<<"EOF"` / `<<<` | here-doc expanded / literal / here-string | quote the delimiter around another language's `$` |
| `xargs`, `-n`, `-I{}`, `-r` | stream to arguments; batch size; placeholder; skip if empty | `-r` stops a bare command running on empty input |
| `find -print0 \| xargs -0` | the only whitespace-safe pairing | or `find -exec cmd {} +` |
| `xargs -P N` | N command lines at once | `-P $(nproc)`; `-P 0` is unbounded |
| `Argument list too long` | `ARG_MAX` exceeded by a glob | 2 MiB here; `xargs` splits the work |
| `<(cmd)` | process substitution: a command as a filename | `diff <(a) <(b)` |

Lesson 06 fills in the tools that go *inside* these pipelines: `grep` and the regular expressions it takes, then `cut`, `sort`, `uniq -c`, `tr` and `find`.
