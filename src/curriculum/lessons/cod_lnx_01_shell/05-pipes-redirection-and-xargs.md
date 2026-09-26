---
id: l05-pipes-redirection-and-xargs
title: Pipes, redirection and xargs
minutes: 21
covers:
  - 'Pipes and redirection: | > >> 2> 2>&1 /dev/null, here-docs, tee, xargs'
---

Think of a program as a machine on a workbench with three hoses. One hose brings material in. One carries the finished product out. The third carries the scraps and complaints. The program does not know or care where the hoses lead. You, the shell, decide: into a file, onto the screen, into the bin, or straight into the next machine.

Those hoses are the three **standard streams**. **Standard input** (stdin) comes in; **standard output** (stdout) goes out; **standard error** (stderr) carries error messages. Each has a number, called a **[[file descriptor|file-descriptor]]** (fd): stdin is 0, stdout is 1, stderr is 2. The shell connects them *before the program starts*, without asking the program.

This is the part of the shell that turns twenty small tools into one tool for today's question. "Which of these 500 runs diverged?" is not a program anybody wrote. It is `grep`, `sort` and `head` joined end to end. The joining is this lesson.

The transcripts are real, from Ubuntu 24.04 with GNU bash 5.2.21, coreutils 9.4, findutils 4.9.0 (`xargs`), grep 3.11 and mawk 1.3.4, on a four-core machine. The example data is a campaign of 500 simulated entry-burn logs in `runs/`.

## The three streams

Three **redirection** operators cover the ordinary cases. Read `>` aloud as "into", `>>` as "append to", and `<` as "from":

- `> file` sends stdout into `file`, **emptying the file first**;
- `>> file` adds to the end of `file` instead;
- `< file` feeds `file` to stdin.

```bash
echo "one" > r.txt; cat r.txt
echo "two" > r.txt; cat r.txt
echo "three" >> r.txt; cat r.txt
```

```text
one
two
two
three
```

The second `>` destroyed the first line without a word. This is the easiest destructive mistake in the shell. The shell empties the file *before* the command on the left even starts. So `sort results.txt > results.txt` produces an empty file: the truncation happens first, and `sort` then reads nothing. There is no undo:

```bash
printf "c\nb\na\n" > res.txt; wc -c res.txt
sort res.txt > res.txt; wc -c res.txt
```

```text
6 res.txt
0 res.txt
```

Six bytes became zero. `set -o noclobber` makes `>` refuse to overwrite an existing file, and `>|` overrides it when you really mean it:

```text
bash: nc.txt: cannot overwrite existing file
```

The exit status is 1 and the old contents are intact.

Standard error is a separate hose, and that separation is the point:

```bash
ls runs/case_0001.log nosuch.log
```

```text
ls: cannot access 'nosuch.log': No such file or directory
runs/case_0001.log
```

Two streams, mixed on your screen because both point at it. Send only fd 1 to a file and the error still reaches you. `2>` (read "two into") redirects fd 2:

```bash
ls runs/case_0001.log nosuch.log > out.txt 2> err.txt
```

```text
--stdout--
runs/case_0001.log
--stderr--
ls: cannot access 'nosuch.log': No such file or directory
```

That is why a long job's `progress.log` can be clean while its problems go somewhere else, and why `cmd > log.txt` on a failing job gives an empty log and an error on your screen.

### `2>&1`, and why the order matters

`2>&1` is read "two into wherever one goes". Precisely, it means **make fd 2 a copy of wherever fd 1 points right now**. The shell applies redirections **left to right**, so where you put `2>&1` decides everything:

```bash
ls runs/case_0001.log nosuch.log > both.txt 2>&1
cat both.txt
```

```text
ls: cannot access 'nosuch.log': No such file or directory
runs/case_0001.log
```

Both streams landed in the file. Now swap the two:

```bash
ls runs/case_0001.log nosuch.log 2>&1 > both2.txt
```

```text
ls: cannot access 'nosuch.log': No such file or directory
--file--
runs/case_0001.log
```

The error came to the screen, and only stdout reached the file. Walk through it **[[step by step|redirection-order]]**. When the shell handled `2>&1`, fd 1 still pointed at the screen, so fd 2 was pointed at the screen too. *Then* `> both2.txt` moved fd 1 to the file. Fd 2 stayed where it had been put. Bash also has `&> file`, a shorthand for the correct order; it is handy but does not work in plain `sh`.

`/dev/null` is a **[[device that throws away|dev-null]]** everything written to it and reads as empty. `2>/dev/null` silences errors you have decided are noise. `>/dev/null` throws away output you only wanted for its exit status:

```bash
ls nosuch.log 2>/dev/null; echo "exit was $?"
```

```text
exit was 2
```

(`$?`, read "dollar question mark", holds the exit status of the last command.) The message is gone; the exit status is not. That is exactly the right thing to discard and the wrong thing to ignore.

::: warning Do not throw away the errors you are collecting
`2>/dev/null` on a command whose output you are gathering is how a campaign quietly produces half the runs it was asked for — the errors were the part telling you a case failed. Send them to a file, `2> errors.log`, and read it. And never write `cmd > out.txt 2> out.txt`. Two separate redirections to one file give two independent write positions, and the streams overwrite each other. `cmd > out.txt 2>&1` is right, because fd 2 then shares fd 1's position.
:::

::: key Redirection order
`2>&1` makes fd 2 (stderr) a duplicate of wherever fd 1 currently points. Redirections are applied left to right, so `cmd > out 2>&1` sends both streams to the file, while `cmd 2>&1 > out` sends stderr to the original terminal and only stdout to the file. `>` truncates before the command runs; `>>` appends; `/dev/null` discards.
:::

## Pipes

A **pipe**, written `|` and read "pipe", is a hose from one program straight into the next. `a | b` connects a's stdout to b's stdin through a **[[small kernel buffer|pipe-buffer]]**, and runs both *at the same time*. They are not one-after-the-other. `b` starts at once and eats what `a` produces as it appears. That is why a pipeline over a huge file uses almost no memory, and why `head` can stop a long producer early.

```bash
grep -h MISS_DISTANCE_M runs/*.log | awk '{print $4}' | sort -g | tail -3
```

```text
784.1
1904.3
4812.6
```

Read it like a **[[sentence|pipeline-picture]]**. `grep -h` pulls the miss-distance line out of all 500 logs (`-h` hides the filename). `awk '{print $4}'` keeps the fourth space-separated field, the number. `sort -g` sorts by numeric value, so `4812.6` lands after `784.1` instead of before it as text would. `tail -3` keeps the largest three. Three of the 500 cases missed by more than 700 m — the worst by 4,812.6 m, more than six times the third — and you have not written a line of Python.

### The exit status of a pipeline

By default a pipeline's exit status is that of its **last** command only. This hides failures:

```bash
grep NOTHING runs/case_0001.log | wc -l; echo "exit=$?"
```

```text
0
exit=0
```

`grep` found nothing and exited 1, but `wc` succeeded, so the pipeline reports success. In a script run with **[[`set -e`|set-e]]** — "stop at the first failure" — this pipeline stops nothing. There are two fixes. The first is the bash array `PIPESTATUS`, which holds every stage's status:

```bash
grep NOTHING runs/case_0001.log | wc -l; echo "pipeline status ${PIPESTATUS[*]}"
```

```text
0
pipeline status 1 0
```

Read it *immediately*; the next command replaces it. The second is an option that makes the pipeline fail if any stage fails:

```bash
set -o pipefail
grep NOTHING runs/case_0001.log | wc -l; echo "exit=$?"
```

```text
0
exit=1
```

`set -euo pipefail` at the top of a batch script is the standard opening line. `pipefail` is the part people leave out and regret.

## `tee`: a branch in the pipe

A plumber's T-fitting splits one flow into two. `tee` does that for data: it writes its input to a file *and* passes it along, so you can save a middle stage without breaking the pipeline:

```bash
grep -h MISS_DISTANCE_M runs/*.log | awk '{print $4}' | sort -g | tail -3 | tee worst.txt
```

```text
784.1
1904.3
4812.6
```

The numbers appeared on screen and are also in `worst.txt`. `tee -a` appends instead of emptying the file first. In the middle of a pipe, both halves keep working:

```bash
head -3 runs/case_0417.log | tee t1.txt | wc -l
```

```text
3
```

`wc` counted three lines, and `t1.txt` holds them. The other standard use is from lesson 03: `command | sudo tee /etc/something` lets the *privileged* program open the file, because your own shell cannot.

## Here-documents and here-strings

A **here-document** feeds a block of literal text to a command's stdin, ending at a **[[marker word|eof-marker]]** you choose. `<<` is read "here-doc":

```bash
cat <<EOF > sweep.yaml
vehicle: falcon9-s1
cases: 500
dt: 0.002
EOF
```

That is how a script writes a configuration file without an editor. By default the body is expanded like a double-quoted string — `$NAME` becomes the variable's value:

```bash
cat <<EOF
expanded $HOME
EOF
```

```text
expanded /home/eng
```

Quote the marker and nothing is expanded. Use this form whenever the body holds `$`, backticks or backslashes that belong to another language:

```bash
cat <<"EOF"
literal $HOME and $(date)
EOF
```

```text
literal $HOME and $(date)
```

The difference is not cosmetic: a here-document holding a Python or awk program gets mangled unless the marker is quoted. `<<-EOF` also strips leading *tabs* (not spaces) from each line, so you can indent the body inside a function.

Any program that reads stdin can be driven this way. This one computes a rocket's speed change from its engine efficiency and **[[mass ratio|rocket-equation]]**:

```bash
python3 <<EOF
import math
print("dv =", round(9.80665*311*math.log(1/0.4), 1), "m/s")
EOF
```

```text
dv = 2794.6 m/s
```

A **here-string**, `<<<`, is the one-line version. It feeds a single string to a tool that wants a stream:

```bash
grep -c INFO <<< "2026-03-14T09:00:00Z INFO sim start"
```

```text
1
```

## `xargs`: turning a stream into arguments

A pipe connects stdout to stdin. But many commands do not read filenames from stdin — `rm`, `ls`, `cp`, your simulator. They take them as **arguments**, the words typed after the command name. `xargs` is the adapter. It reads items from stdin and builds command lines out of them.

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

`-n 1` means one item per command; without it, `xargs` packs in as many as fit. `-I{}` puts each item wherever `{}` appears, for when the item is not the last argument:

```bash
printf "a\nb\nc\n" | xargs -I{} echo "case {} done"
```

```text
case a done
case b done
case c done
```

`-r` (long form `--no-run-if-empty`) prevents a quiet accident: GNU `xargs` otherwise runs the command once even with no input at all. Watch:

```bash
grep -l NOTHING runs/*.log | xargs wc -l
```

```text
0
```

`grep` matched nothing, so `xargs` ran a bare `wc -l`, which read from *its own* stdin and reported zero. Harmless here. But many commands treat "no arguments" as "the current directory" or "read the keyboard" — `ls`, `du`, `find`, `wc` — so an empty list silently turns your question into a different one. Add `-r` and nothing runs:

```bash
grep -l NOTHING runs/*.log | xargs -r wc -l; echo "exit=$?"
```

```text
exit=0
```

::: example Filenames with spaces, and the only safe pairing
Two log files with spaces in their names, as you get the moment data comes from a Windows machine or an instrument's export dialog:

```bash
find sp -name "*.log" | xargs ls -l
```

```text
ls: cannot access 'sp/entry': No such file or directory
ls: cannot access 'burn': No such file or directory
ls: cannot access '01.log': No such file or directory
ls: cannot access 'sp/entry': No such file or directory
ls: cannot access 'burn': No such file or directory
ls: cannot access '02.log': No such file or directory
```

Exit status 123, `xargs`'s way of saying a command failed. `xargs` splits its input on spaces and newlines, so `entry burn 01.log` became three arguments. Had the command been `rm`, it would have tried to delete a file called `burn` — and on a bad day succeeded.

The **[[NUL byte|nul-byte]]** — the byte with value zero — is the only byte that cannot appear in a filename, so it is the only safe separator. `find -print0` ends each name with it, and `xargs -0` splits on it:

```bash
find sp -name "*.log" -print0 | xargs -0 ls -l
```

```text
-rw-r--r-- 1 root root 0 Sep 26 17:52 sp/entry burn 01.log
-rw-r--r-- 1 root root 0 Sep 26 17:52 sp/entry burn 02.log
```

`find` can also skip the pipe entirely, which has no quoting hazard at all:

```bash
find sp -name "*.log" -exec ls -l {} +
```

```text
-rw-r--r-- 1 root root 0 Sep 26 17:52 sp/entry burn 01.log
-rw-r--r-- 1 root root 0 Sep 26 17:52 sp/entry burn 02.log
```

The `+` at the end packs the matches into as few commands as possible, as `xargs` does; `\;` there would run `ls` once per file. Prefer `-exec ... +` when `find` is already in play, and `-print0 | xargs -0` when you need `xargs` options such as `-P`.
:::

### Why `xargs` exists: `Argument list too long`

The kernel limits the total size of a command's arguments plus its environment. On this machine:

```bash
getconf ARG_MAX
```

```text
2097152
```

That is **[[2 MiB|arg-max]]** ($2 \times 1024 \times 1024 = 2{,}097{,}152$ bytes). There is also a separate cap on any *single* argument. Go over either and the program never starts:

```bash
/bin/echo $(python3 -c "print('x'*132000)")
```

```text
/bin/echo: Argument list too long
```

Testing lengths pins the single-argument cap down exactly. 131,071 characters work; 131,072 fail. Each argument is stored with one extra zero byte at its end, so the cap is $131{,}071 + 1 = 131{,}072$ bytes — exactly 128 KiB, or 32 pages of 4,096 bytes ($32 \times 4096 = 131{,}072$).

This is what happens with `rm *.log` in a directory of 200,000 run logs. The shell expands the pattern into one enormous argument list, and the kernel refuses to start `rm`. Nothing is deleted, and nothing is wrong with your command. `xargs` exists for exactly this. It knows the limit and splits the work into as many command lines as it takes, which is why `find . -name '*.log' -print0 | xargs -0 rm` works where `rm *.log` cannot.

::: key What xargs is for
`xargs` converts data on stdin into command-line arguments. Use `-0` with `find -print0` so filenames containing spaces or newlines survive, `-n` to set the batch size and `-P` to run batches in parallel. Add `-r` so empty input runs nothing.
:::

::: example Driving a batch of simulations across your cores
`xargs -P N` runs up to N commands at once. Take a stand-in `run_case.sh` that needs one second per case, and a file of eight case numbers. One at a time:

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

real	0m8.040s
user	0m0.027s
sys	0m0.012s
```

Eight cases at one second each: about 8 seconds, as expected. Now four at a time:

```bash
time xargs -n 1 -P 4 ./run_case.sh < cases.txt
```

```text
case 0002 done
case 0003 done
case 0001 done
case 0004 done
case 0005 done
case 0006 done
case 0008 done
case 0007 done

real	0m2.017s
user	0m0.031s
sys	0m0.010s
```

Four lanes: $8 \div 4 = 2$ rounds of one second, and the clock agrees — about 2 seconds, on this four-core machine (`nproc` reports 4). That is parallel Monte Carlo on one box: a file of case ids, a script that runs one case, and `-P $(nproc)`.

Look at the order, though: 2, 3, 1, 4 … 8, 7. Parallel jobs finish when they finish. That leads to two cautions for real work. First, outputs interleave. Each case here printed one short line, but two processes writing many lines to the same stream produce shuffled text — give each case its own output file. Second, for CPU-heavy work, more jobs than cores makes things slower, and `-P 0` means "as many as possible": 500 simultaneous simulations and a machine that stops responding. Use `$(nproc)` and measure.
:::

::: note Process substitution: a command posing as a file
`<(command)` is **process substitution**. Bash runs the command and hands the other program a filename that reads its output, so tools that insist on files can be fed pipelines:

```bash
diff <(head -3 runs/case_0001.log) <(head -3 runs/case_0002.log)
```

```text
1,3c1,3
< 2026-03-14T09:00:00Z INFO  sim start case=0001 seed=439563
< 2026-03-14T09:00:00Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
< 2026-03-14T09:00:01Z INFO  guidance mode=PDG horizon_s=18.0
---
> 2026-03-14T09:00:31Z INFO  sim start case=0002 seed=150631
> 2026-03-14T09:00:31Z INFO  vehicle=falcon9-s1 profile=entry-burn dt=0.002
> 2026-03-14T09:00:32Z INFO  guidance mode=PDG horizon_s=18.0
```

Comparing two commands' output without making two temporary files is worth the odd syntax.
:::

## Check yourself

::: check
`./run_sweep.sh > sweep.log 2>&1` runs overnight. `sweep.log` is empty, yet the output directory holds 500 files. What is the likeliest explanation?
:::

::: answer
The script's output went somewhere else. Two usual cases. First, the script redirects internally — a line like `exec > /var/log/sweep/run.log`, or a `> case.log` for each case inside the loop — so nothing is left for the outer redirection to catch. Second, the program writes straight to the terminal device, `/dev/tty`, which bypasses fd 1 and fd 2 entirely; some progress bars do this on purpose.

Rule out a third possibility first: the output is only *buffered*. A program writing to a file or pipe saves output up in blocks instead of line by line, so nothing appears until 4 or 8 KB have piled up or the program exits. If the job is still running, a 0 in `ls -l sweep.log` may only mean the first block is not full yet. `stdbuf -oL ./run_sweep.sh` forces line-by-line output.
:::

::: check
Explain, in terms of file descriptors, why `cmd 2>&1 > out.txt` does not put both streams in the file, and give the correct form.
:::

::: answer
The shell handles redirections strictly left to right, and `2>&1` copies *where fd 1 points at that moment* into fd 2. When it is handled, fd 1 has not been touched, so it still points at the terminal — and fd 2 becomes a second pointer to the terminal. Only then does `> out.txt` move fd 1 to the file. Fd 2 does not follow, because it was pointed at the terminal itself, not at "whatever fd 1 is".

The correct form is `cmd > out.txt 2>&1`: fd 1 moves to the file first, then fd 2 copies it, so both share the file *and its write position*. Bash's `&> out.txt` is shorthand for this. Note that `cmd > out.txt 2> out.txt` is different: two separate opens give two independent positions, and the streams overwrite each other.
:::

::: check
You run `find . -name '*.log' | xargs rm` in a directory where one file is named `entry burn 01.log`. What does `rm` actually receive, and what could go wrong? Give two safe rewrites.
:::

::: answer
`xargs` splits on spaces and newlines by default, so the one path `./entry burn 01.log` arrives as three arguments: `./entry`, `burn` and `01.log`. Two of them produce "No such file or directory". But if a file named `burn` happens to exist in the current directory, it is deleted — a file nobody asked to remove, whose name appears nowhere in the command.

Safe rewrite one: `find . -name '*.log' -print0 | xargs -0 rm`, which separates names with NUL, the one byte a filename cannot contain. Safe rewrite two: drop `xargs` and use `find . -name '*.log' -exec rm {} +`, where `find` hands the paths to `rm` directly, with no text splitting in between. Add `-r` to any `xargs` so that an empty match list runs nothing.
:::

::: check
A campaign script ends with `grep -c DIVERGED runs/*.log | wc -l`, and its `set -e` never triggers, even on days when `grep` fails. Why, and what are two ways to fix it?
:::

::: answer
A pipeline's exit status is its last command's only. `wc` succeeds whatever `grep` did, so the pipeline reports 0 and `set -e` has nothing to act on. `grep` exiting 1 for "no matches" — normal, documented behavior, not an error — is invisible.

Fix one: `set -o pipefail`, which makes the pipeline return the status of the rightmost stage that failed. As `set -euo pipefail` it is the standard header for a script that must stop at a failure. Fix two: check `${PIPESTATUS[@]}` right after the pipeline. It is a bash array with one status per stage, so `${PIPESTATUS[0]}` is `grep`'s. Read it on the very next line, because any other command overwrites it.
:::

::: check
`grep PATTERN hugefile.log | head -3` returns instantly on a 40 GB file. Why does it not wait for `grep` to read the whole file?
:::

::: answer
Because the two run at the same time and the pipe's buffer is small. `grep` writes into the pipe; `head` reads three lines, prints them and exits. That closes the pipe's reading end, so the next time `grep` writes, the kernel sends it `SIGPIPE` ("broken pipe", signal 13), whose default action is to terminate. `grep` dies partway through the file and never reads the rest. Its exit status shows it: `${PIPESTATUS[0]}` is 141, which is $128 + 13$.

That explains two things you will meet. It is why `| head` is cheap on enormous inputs. And it is why a program that *ignores* `SIGPIPE` reports a failed write instead. Python ignores it, so the write raises an exception and the interpreter prints a traceback on stderr ending

```text
BrokenPipeError: [Errno 32] Broken pipe
```

That is not a bug in your script. It is the expected result of `head` having seen enough.
:::

## Summary

| Construct | Meaning | Remember |
| --- | --- | --- |
| `> f` / `>> f` / `< f` | stdout into f (emptying it) / appended to f / stdin from f | `>` empties the file before the command runs |
| `2> f` | stderr into f | `cmd > log` alone leaves errors on the screen |
| `cmd > f 2>&1` | both streams into f | order matters; `2>&1 > f` does not do this |
| `&> f` | bash shorthand for the correct order | not in plain `sh` |
| `/dev/null` | throws writes away, reads as empty | discarding stderr hides failed cases |
| `a \| b` | a's stdout into b's stdin, both running at once | `head` exiting early sends `SIGPIPE` to a |
| `${PIPESTATUS[@]}`, `set -o pipefail` | every stage's status; fail if any stage fails | otherwise only the last stage counts |
| `tee f`, `tee -a f` | copy the stream into f and pass it on | `\| sudo tee f` writes with privilege |
| `<<EOF` / `<<"EOF"` / `<<<` | here-doc expanded / literal / here-string | quote the marker around another language's `$` |
| `xargs`, `-n`, `-I{}`, `-r` | stream to arguments; batch size; placeholder; skip if empty | `-r` stops a bare command running on empty input |
| `find -print0 \| xargs -0` | the only whitespace-safe pairing | or `find -exec cmd {} +` |
| `xargs -P N` | N commands at once | `-P $(nproc)`; `-P 0` is unlimited |
| `Argument list too long` | a glob exceeded `ARG_MAX` | 2 MiB here; `xargs` splits the work |
| `<(cmd)` | process substitution: a command as a filename | `diff <(a) <(b)` |

Next lesson fills in the tools that go *inside* these pipelines: `grep` and the regular expressions it understands, then `cut`, `sort`, `uniq -c`, `tr` and `find`.

::: context file-descriptor Numbered slots
Each process has a small table of open "things" — files, the terminal, pipes — and a file descriptor is only a row number in that table. Programs never write "to the screen"; they write "to slot 1" and let the table decide where that goes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="130" height="100" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">process</text>
  <g font-size="12" fill="#1f2a44">
    <rect x="35" y="42" width="100" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="57">0 stdin</text>
    <rect x="35" y="64" width="100" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="79">1 stdout</text>
    <rect x="35" y="86" width="100" height="20" fill="#f2b880" stroke="#1f2a44"/><text x="45" y="101">2 stderr</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="220" y1="52" x2="135" y2="52"/><polygon points="135,52 145,47 145,57" fill="#1f2a44"/>
    <line x1="135" y1="74" x2="210" y2="74"/><polygon points="220,74 210,69 210,79" fill="#1f2a44"/>
    <line x1="135" y1="96" x2="210" y2="96"/><polygon points="220,96 210,91 210,101" fill="#1f2a44"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="226" y="56">keyboard</text><text x="226" y="78">screen</text><text x="226" y="100">screen</text>
  </g>
</svg>
```

Redirection only rewrites the right-hand column. The program never knows.
:::

::: context redirection-order Watching the table change
Follow the slots through each command. In `> f 2>&1`, slot 1 moves to the file first, then slot 2 copies it. In `2>&1 > f`, slot 2 copies the screen, then slot 1 moves.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">cmd &gt; f 2&gt;&amp;1</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">cmd 2&gt;&amp;1 &gt; f</text>
  <line x1="180" y1="6" x2="180" y2="146" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="12" y="44">after &gt; f:</text>
    <text x="94" y="38">1 → f</text><text x="94" y="54">2 → screen</text>
    <text x="12" y="94">after 2&gt;&amp;1:</text>
    <text x="94" y="88" fill="#1d6fd1">1 → f</text><text x="94" y="104" fill="#1d6fd1">2 → f</text>
    <text x="192" y="44">after 2&gt;&amp;1:</text>
    <text x="278" y="38">1 → screen</text><text x="278" y="54">2 → screen</text>
    <text x="192" y="94">after &gt; f:</text>
    <text x="278" y="88" fill="#1d6fd1">1 → f</text><text x="278" y="104" fill="#b4232c">2 → screen</text>
  </g>
  <text x="90" y="136" font-size="11" text-anchor="middle" fill="#1d6fd1">both in the file</text>
  <text x="270" y="136" font-size="11" text-anchor="middle" fill="#b4232c">errors still on screen</text>
</svg>
```

`2>&1` copies a destination at one instant. It does not create a lasting link to fd 1.
:::

::: context dev-null The bit bucket
`/dev/null` is not a file on a disk. It is a **device file**: a name in `/dev` that the kernel answers itself. Writing to it always succeeds and the data vanishes; reading from it returns "end of file" straight away. Programmers call it the bit bucket.

Its neighbors are as handy. `/dev/zero` reads as endless zero bytes, and `/dev/urandom` as endless random bytes.
:::

::: context pipe-buffer How big the pipe is
On Linux a pipe holds 65,536 bytes (64 KiB) by default. If the reader falls behind and the buffer fills, the writer is paused until there is room. If the buffer is empty, the reader waits.

That automatic pause is called **backpressure**, and it is why a fast `grep` cannot flood a slow `sort` or eat all your memory. Each stage runs at the pace of the slowest one.
:::

::: context pipeline-picture The pipeline as a production line
Each program is a station on a conveyor belt. Data flows left to right, and all stations work at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="30" width="62" height="30" rx="5" fill="#8fb8f0"/>
    <rect x="96" y="30" width="62" height="30" rx="5" fill="#8fb8f0"/>
    <rect x="184" y="30" width="62" height="30" rx="5" fill="#8fb8f0"/>
    <rect x="272" y="30" width="62" height="30" rx="5" fill="#8fb8f0"/>
    <line x1="70" y1="45" x2="90" y2="45"/><polygon points="96,45 88,41 88,49" fill="#1f2a44"/>
    <line x1="158" y1="45" x2="178" y2="45"/><polygon points="184,45 176,41 176,49" fill="#1f2a44"/>
    <line x1="246" y1="45" x2="266" y2="45"/><polygon points="272,45 264,41 264,49" fill="#1f2a44"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="39" y="50">grep</text><text x="127" y="50">awk</text><text x="215" y="50">sort -g</text><text x="303" y="50">tail -3</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="39" y="80">500 lines</text><text x="127" y="80">500 numbers</text><text x="215" y="80">in order</text><text x="303" y="80">3 largest</text>
  </g>
</svg>
```

`sort` is the one station that must see *everything* before it can pass anything on — the largest value might be the last line.
:::

::: context set-e What set -e and friends do
`set -e` tells bash to stop the script as soon as a command fails (exits non-zero), instead of carrying on with broken data. `set -u` treats a misspelled or unset variable as an error rather than quietly using an empty string. `set -o pipefail` makes a pipeline count as failed if any stage failed.

Together, `set -euo pipefail` turns many silent problems into loud ones, which is what you want in a script that runs overnight with nobody watching.
:::

::: context eof-marker The marker word
`EOF` stands for "end of file", and it is only a habit. Any word works — `END`, `YAML`, `PY` — as long as it appears alone on the closing line, with nothing else on that line.

Choosing a word that describes the body, like `<<'PY'` for a Python snippet, makes a long script easier to read.
:::

::: context rocket-equation The number the snippet computed
The snippet evaluates the rocket equation, $\Delta v = g_0 \, I_{sp} \ln(m_0/m_f)$, with $g_0 = 9.80665\,\mathrm{m/s^2}$, a specific impulse of $311\,\mathrm{s}$, and a final mass that is $0.4$ of the starting mass, so $m_0/m_f = 2.5$:

$$
\Delta v = 9.80665 \times 311 \times \ln 2.5 \approx 2795\,\mathrm{m/s}.
$$

The math modules derive this equation. Here the point is only that a here-doc let the shell hand a whole Python program to `python3` without a separate file.
:::

::: context nul-byte Why NUL is the safe separator
Linux stores names as C strings, which end at the first zero byte. So a filename cannot contain a NUL — the kernel would read the name as ending there. Spaces, tabs, quotes, even newlines *are* allowed in names.

That makes NUL the one separator that can never be confused with part of a name, which is why `find -print0`, `xargs -0`, `sort -z` and `grep -z` all speak it.
:::

::: context arg-max Where the 2 MiB comes from
On Linux, the space for a new program's arguments and environment is carved from its stack, and the kernel allows a quarter of the stack size limit. The default stack limit is 8 MiB (`ulimit -s` prints 8192, in KiB), and a quarter of that is 2 MiB — the `2097152` that `getconf ARG_MAX` printed.

Raising the stack limit raises `ARG_MAX` too, but `xargs` is the portable fix.
:::
