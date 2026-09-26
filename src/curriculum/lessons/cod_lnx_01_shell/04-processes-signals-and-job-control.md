---
id: l04-processes-signals-and-job-control
title: Processes, signals and job control
minutes: 22
covers:
  - 'Processes: ps, top/htop, kill, SIGTERM vs SIGKILL, job control, nohup'
---

Think of a busy kitchen. Every cook has a numbered name tag, a boss who hired them, and a state — chopping, waiting for the oven, on a break. To stop a cook you can say "please finish up", or you can drag them out by the collar. Only the first leaves the soup in the pot.

A running program on Linux is a **process**, and it lives like that cook: a number, a parent, a state, a terminal it belongs to. You talk to it by sending a **signal** — a tiny numbered message the operating system delivers. A six-hour Monte Carlo is a process; so is a runaway solver on all sixteen cores. Looking at them, pausing them, stopping them, keeping them alive when your laptop sleeps — it all uses the few ideas in this lesson.

The one that matters most is *asking* versus *forcing*. A simulation asked to stop writes out its results. The same simulation forced with `kill -9` loses whatever it had not saved. Engineers learn `kill -9` first because it always works, then spend a year losing runs with it.

The transcripts come from Ubuntu 24.04 (procps-ng 4.0.4, bash 5.2.21), captured in a private sandbox, so only the demonstration's processes appear and their numbers are small. A full listing on your machine runs to hundreds of lines.

## `ps`: what is running

`ps` ("process status") with no arguments lists the processes attached to your terminal:

```bash
ps
```

```text
    PID TTY          TIME CMD
      1 ?        00:00:00 bash
      8 ?        00:00:00 python3
     10 ?        00:00:00 ps
```

`PID` is the **[[process id|pid]]**, the number on the name tag. `TTY` is the **controlling terminal**, the terminal the process belongs to (`?` means none). `TIME` is CPU time used, and `CMD` the command. `ps` even lists itself.

To see every process there are two forms, because `ps` inherited **[[two option styles|bsd-and-system-v]]**:

- `ps aux` — the BSD form, no dash. Columns: `USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND`.
- `ps -ef` — the System V form. Columns: `UID PID PPID C STIME TTY TIME CMD`.

Learn one and recognize the other. Better still, learn `-o` ("output"), which picks exactly the columns you want:

```bash
ps -o pid,ppid,stat,%cpu,%mem,rss,args -p 6
```

```text
    PID    PPID STAT %CPU %MEM   RSS COMMAND
      6       1 R    98.3  0.0  7780 python3 sim_plain.py
```

`PPID` is the **parent's** pid — the process that started this one — so processes form a **[[family tree|process-tree]]**. A process whose parent dies is adopted by pid 1, the first process the system starts.

`RSS`, the **resident set size**, is the physical memory the process really holds, in kilobytes: the number to watch when memory runs short. `VSZ`, the virtual size, counts address space reserved but maybe never touched. It is routinely enormous and tells you almost nothing.

`pgrep` finds processes by name, and `pkill` sends them a signal:

```bash
pgrep -a python3
```

```text
8 python3 sim.py
```

`-a` adds the full command line. Always run `pgrep` before `pkill` with the same pattern: its list is exactly what `pkill` would signal, and the cheap way to discover that your pattern also matches the editor holding your job script.

::: note Reading a process's details straight from /proc
Everything `ps` prints comes from the folder `/proc/<pid>/`, which you can read yourself. `/proc/6/cmdline` holds the arguments, separated by zero bytes; `/proc/6/cwd` links to the working directory; `/proc/6/exe` links to the program file:

```bash
ls -l /proc/6/cwd /proc/6/exe
```

```text
lrwxrwxrwx 1 root root 0 Sep 22 20:25 /proc/6/cwd -> /home/eng
lrwxrwxrwx 1 root root 0 Sep 22 20:25 /proc/6/exe -> /usr/bin/python3.11
```

That answers "which directory is this job writing into?" without asking anyone. If you have since replaced the program file, `/proc/<pid>/exe` ends in ` (deleted)`.
:::

### The STAT column

The letter in `STAT` is the process **state**, and it is genuinely diagnostic:

| Letter | State | What it means for you |
| --- | --- | --- |
| `R` | running or runnable | using a CPU, or waiting in line for one |
| `S` | interruptible sleep | waiting for something, and a signal can wake it — most processes, most of the time |
| `D` | uninterruptible sleep | inside a kernel call that cannot be interrupted, almost always disk or network I/O |
| `T` | stopped | paused by `SIGSTOP` or `Ctrl-Z`; not scheduled at all |
| `Z` | zombie | finished, but its parent has not collected its exit status yet |

(**I/O**, "input/output", is reading or writing a disk, network or device. The **kernel** is the core of the operating system, which runs the hardware and hands out CPU time.)

`D` is the one that alarms people. A process in **[[D|uninterruptible]]** holds *every* signal, even `SIGKILL`, unacted on until its kernel call returns. It is not stuck in your code; it is waiting on hardware, a jammed disk queue, or a network file server that has vanished. Killing it harder does nothing. Find out what it is waiting for.

A **zombie** is not running at all. It is leftover bookkeeping:

```bash
ps -o pid,ppid,stat,args -p 37,39
```

```text
    PID    PPID STAT COMMAND
     37       1 S    python3 -
     39      37 Z    [python3] <defunct>
```

Process 39 has finished. The kernel holds its exit status until its parent, 37, asks for it by calling `wait()`. Zombies use no CPU and almost no memory, only a pid. Thousands of them means a buggy parent. You cannot kill what has already exited, so fix or restart the *parent*.

## `top` and `htop`

`ps` is a photograph; `top` is live video. In batch mode (`-b`) it prints one frame, which you can paste into a log:

```bash
top -b -n 1 | head -8
```

```text
top - 20:25:53 up 10:44,  0 user,  load average: 0.94, 0.89, 1.02
Tasks:   4 total,   2 running,   2 sleeping,   0 stopped,   0 zombie
%Cpu(s): 42.9 us, 11.9 sy,  0.0 ni, 40.5 id,  0.0 wa,  0.0 hi,  4.8 si,  0.0 st 
MiB Mem :  16095.7 total,  12359.3 free,   1421.9 used,   2649.0 buff/cache     
MiB Swap:      0.0 total,      0.0 free,      0.0 used.  14673.8 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
      6 root      20   0   13924   7780   5016 R 100.0   0.0   0:01.20 python3
```

Read the header first. `us` is time in user programs, `sy` in the kernel, `id` idle, `wa` waiting for I/O. A machine at 90% `wa` is not computing, it is queueing for a disk, and more threads make it worse. `avail Mem` honestly answers "how much could a new process get?"; `free` does not, because the kernel fills spare memory with a cache of recently read files and hands it back on demand.

The `NI` column is the **nice** value, from $-20$ to $19$; higher means the process lets others go first. `nice -n 19 ./job` starts a job at the lowest priority and `renice` changes it later. Niceness changes *who gets the CPU*, nothing else — it does not protect a job from being killed.

In `top`, press `P` to sort by CPU, `M` by memory, `1` for per-core lines, `k` to signal a process, `q` to quit. `htop` adds color, per-core bars, a searchable tree on `F5` and a signal menu on `F9`. They show what `ps` shows, over and over.

### Load average

```bash
nproc
uptime
```

```text
4
 20:25:52 up 10:44,  0 user,  load average: 0.94, 0.89, 1.02
```

Picture a store's checkout lanes: the **load average** counts shoppers being served plus shoppers waiting. Precisely, it is the number of tasks that were *runnable or in uninterruptible sleep*, averaged over one, five and fifteen minutes with a **[[smoothing formula|smoothed-average]]** that favors recent moments.

The "uninterruptible sleep" part is a Linux quirk: a machine stuck on a dead network drive can show a huge load while using no CPU, because every process waiting on the drive sits in `D` and counts.

Load means something only next to the core count that `nproc` printed. On these four cores, 0.94 is about a quarter busy, 4.0 is fully committed, and 8.0 means four tasks waiting for a core at every instant, on average. The trend often says more than any one number: `8.0, 4.0, 1.0` has recently got busy; `1.0, 4.0, 8.0` is calming down.

::: key Load average
A load average of 8.0 on an 8-core machine means that on average eight tasks were runnable or in uninterruptible sleep — roughly fully committed, but not necessarily oversubscribed. Compare it against the core count (`nproc`), and check whether the tasks are CPU-bound or blocked on I/O (`wa` in `top`, state `D` in `ps`) before concluding anything.
:::

## Signals

A signal is a numbered tap on the shoulder: the kernel interrupts the process to deliver it. `kill -l` lists them all; you need a few:

| Signal | Number | Default action | Can the program catch it? |
| --- | --- | --- | --- |
| `SIGHUP` | 1 | terminate | yes — background services often reload their settings instead |
| `SIGINT` | 2 | terminate | yes — this is `Ctrl-C` |
| `SIGKILL` | 9 | terminate | **no** |
| `SIGTERM` | 15 | terminate | yes — the default for `kill` |
| `SIGSTOP` | 19 | stop | **no** |
| `SIGTSTP` | 20 | stop | yes — this is `Ctrl-Z` |
| `SIGCONT` | 18 | continue | yes |

To **catch** a signal, a program installs a **handler** — its own function that runs instead of the default action. `SIGKILL` and `SIGSTOP` alone can never be caught, blocked or ignored; the kernel carries them out itself.

`kill <pid>` sends `SIGTERM`. Despite the name, `kill` means "send a signal"; `kill -STOP` kills nothing.

::: example SIGTERM lets the job save its work; SIGKILL does not
Every long simulation should have a `SIGTERM` handler that **flushes** — writes out the data it has been saving up in memory, its **buffer** — and closes its files before exiting.

```python
import signal, sys, time
def on_term(signum, frame):
    print("SIGTERM: flushing 412 MB of telemetry, closing files", flush=True)
    sys.exit(0)
signal.signal(signal.SIGTERM, on_term)
# ... run the simulation ...
```

Start it (output going to the file `a.out`), then ask it to stop:

```bash
kill 8
cat a.out
```

```text
sim_entry_burn running, pid 8
SIGTERM: flushing 412 MB of telemetry, closing files
```

The shell reports its **exit status** — the number every process hands back when it ends — as **0**, success. The process chose how to end, and ended cleanly.

Now the same program, same run, killed with `-9`:

```bash
kill -9 12
cat b.out
```

```text
sim_entry_burn running, pid 12
```

Nothing after the start line. The handler never ran: the kernel carried out `SIGKILL` and never gave the process control back. The shell reports **137**. Whatever sat in the output buffer is gone — on a real campaign, minutes of telemetry.

Last, a program with no handler, sent `SIGTERM`:

```bash
kill -TERM 15
```

The shell reports **143**. The rule: killed by signal $N$ means exit status $128 + N$. Check: $128 + 15 = 143$ for `SIGTERM`, $128 + 9 = 137$ for `SIGKILL`. **[[137|exit-status-bits]]** in a scheduler's report is the classic sign of the **[[out-of-memory killer|oom-killer]]**, which uses `SIGKILL`.

The order, always: `kill`, wait ten or twenty seconds, only then `kill -9`. In state `D`, neither works until the I/O finishes.
:::

::: key SIGTERM vs SIGKILL
`SIGTERM` (15) is a polite request the process can catch and handle, so it can flush buffers and close files. `SIGKILL` (9) is delivered by the kernel and cannot be caught, blocked or ignored, so buffered output is lost. Always try `SIGTERM` first. A process killed by signal $N$ reports exit status $128 + N$: 143 for `SIGTERM`, 137 for `SIGKILL`.
:::

### Pausing is not killing

Stopping is a separate dial from killing. `SIGSTOP` is a pause button:

```bash
kill -STOP 18
ps -o pid,stat,args -p 18
```

```text
    PID STAT COMMAND
     18 T    python3 sim_plain.py
```

```bash
kill -CONT 18
ps -o pid,stat,args -p 18
```

```text
    PID STAT COMMAND
     18 S    python3 sim_plain.py
```

`T` means stopped: the process keeps its memory and open files but gets no CPU. `SIGCONT` resumes it exactly where it was. You can park a big analysis while an urgent job runs — but a stopped process does not give back its memory.

## Job control

**Job control** is the shell's layer on top. A **job** is a command or pipeline the shell started for you, numbered so you can say `%1`, `%2` ("job one", "job two"). A trailing `&` (read "ampersand") starts it in the **background**: it runs, and your prompt comes straight back.

```text
$ sleep 300 &
[1] 17
$ jobs
[1]+  Running                 sleep 300 &
$ sleep 200 &
[2] 22
$ jobs
[1]-  Running                 sleep 300 &
[2]+  Running                 sleep 200 &
$ kill %1
$ jobs
[1]-  Terminated              sleep 300
[2]+  Running                 sleep 200 &
```

`[1] 17` means job 1, pid 17. In `jobs`, `+` marks the job `fg` and `bg` act on by default and `-` the next in line. `kill %1` signals by job number.

`Ctrl-Z` pauses the **foreground** job — the one that owns your keyboard — by sending `SIGTSTP`. `bg` resumes it in the background; `fg` brings it forward:

```text
$ sleep 300
^Z
[1]+  Stopped                 sleep 300
$ jobs
[1]+  Stopped                 sleep 300
$ bg %1
[1]+ sleep 300 &
$ jobs
[1]+  Running                 sleep 300 &
$ fg %1
sleep 300
^C
$ jobs
```

The everyday sequence: start something, realize it is slow, press `Ctrl-Z`, type `bg`, and carry on while it runs. `fg` brings it back to watch or to stop with `Ctrl-C`.

::: warning Ctrl-Z pauses; it does not move to the background
`Ctrl-Z` **stops** a job — state `T`, no CPU, no progress. Press it on a simulation, close the laptop, and six hours later the job has been frozen the whole time. `bg` is the other half of the move, and it is not optional.
:::

## Surviving the disconnect

This failure costs the most time. A job started with `&` is still tied to your terminal: it is in the terminal's **session** and on the shell's job list. When the terminal goes away — SSH drops, the window closes — the kernel sends **[[SIGHUP|hang-up]]** ("hang up") to the shell and the foreground job, and the shell passes it on to every job it started, background ones included. The default action for `SIGHUP` is to terminate.

::: example What survives a hang-up, and what does not
Three jobs started from the same interactive shell: one plain, one under `nohup`, one under `setsid`.

```text
$ python3 sim_plain.py > plain.out 2>&1 &
[1] 47
$ nohup python3 sim_plain.py > nohup_demo.out 2>&1 &
[2] 50
$ setsid python3 sim_plain.py > setsid.out 2>&1 &
[3] 53
```

(`> plain.out 2>&1` sends the output to a file; next lesson explains it.) Before the terminal is destroyed, all three run:

```text
    PID    PPID STAT COMMAND
     47      40 S    python3 sim_plain.py
     50      40 S    python3 sim_plain.py
     55       1 Ss   python3 sim_plain.py
```

Then the terminal is killed, as a dropped connection would. Afterwards:

```text
    PID    PPID STAT COMMAND
     50       1 S    python3 sim_plain.py
     55       1 Ss   python3 sim_plain.py
```

Pid 47, the plain `&` job, is gone. The other two survived; their parent changed from 40, the dead shell, to 1.

`nohup` ("no hang-up") makes the process ignore `SIGHUP` before it starts. It also moves the output to a file, and says so, since a terminal that may vanish is a bad place to write:

```text
$ nohup python3 sim_plain.py &
[1] 18
$ nohup: ignoring input and appending output to 'nohup.out'
```

If you redirect the output yourself, the message shortens to `nohup: ignoring input` and lands at the top of your own file.

`setsid` ("set session id") puts the process in a brand-new session with no controlling terminal, so no hang-up can reach it. Its state shows `Ss`; the small `s` means **session leader**. Its pid is 55, not the announced 53, because `setsid` started a fresh copy of itself to get the new session, and that copy was adopted by pid 1.

`disown` fixes a job you already started and forgot to protect. `disown %2` removes it from the shell's job list, so the shell never passes `SIGHUP` on to it:

```text
$ python3 sim_plain.py > two.out 2>&1 &
[2] 24
$ disown %2
$ jobs
[1]+  Running                 nohup python3 sim_plain.py &
```

Job 2 vanished from `jobs` and survived the hang-up, adopted by pid 1. The price: it is no longer `%2`, only a pid.
:::

None of these gives you your screen back, so none is right for a six-hour Monte Carlo. For that you want **[[tmux|tmux-bridge]]** (lesson 09): the job runs in a session owned by the tmux server, your terminal only looks at it, and disconnecting changes nothing.

::: key Why an & job still dies when the terminal closes
Closing the terminal sends `SIGHUP` to the foreground process group (and to the shell, which passes it on to its jobs), and the default action of `SIGHUP` is to terminate. `nohup` (ignore `SIGHUP`), `disown` (leave the shell's job list), `setsid` (new session, no terminal) or, best, running inside tmux detaches the job from that terminal's lifecycle. `Ctrl-Z` only stops a job; `nice` only changes its priority.
:::

## Check yourself

::: check
Your batch scheduler reports that a simulation exited with status 137. What killed it, what is the single most likely cause, and where would you look to confirm?
:::

::: answer
Subtract 128: $137 - 128 = 9$, so signal 9, `SIGKILL`, killed it. `SIGKILL` cannot be caught, so the program had no say — it did not exit on its own.

The likeliest cause by far is the out-of-memory killer, which uses `SIGKILL`. Confirm in `dmesg`, the kernel's message log, where it names the process it chose and its memory use: `dmesg -T | grep -i -e oom -e "killed process"`. Other candidates: a scheduler enforcing a time or memory limit, or a human typing `kill -9`. If it was OOM, `ps -o rss` on the next run, or the scheduler's peak-memory report, shows the job climbing toward the limit.
:::

::: check
A colleague says a process is "unkillable". `kill -9` returns without an error, but a minute later the process is still in `ps`, in state `D`, using no CPU. Explain, and say what you would actually do.
:::

::: answer
`D` is uninterruptible sleep: the process is inside a kernel call that cannot be aborted, and signals — even `SIGKILL` — are acted on only when it returns. The kill is queued, not ignored; the process dies the instant the call completes.

What holds it is I/O: a network filesystem (NFS) whose server vanished, a failing disk retrying reads, a driver waiting on hardware. Find which: `cat /proc/<pid>/wchan` names the kernel function it sleeps in, `cat /proc/<pid>/stack` shows more as root, and `ls -l /proc/<pid>/cwd` and `/proc/<pid>/fd/` show what it has open. Then fix the I/O — remount the share, clear the queue. Rebooting is the last resort, sometimes the only one.
:::

::: check
You start `./run_campaign.sh &` over SSH, see the job number, and close the laptop. Six hours later you reconnect and the job is gone, leaving a partly filled output directory. Explain exactly what happened, and give two fixes — one you could have used at the time and one for next time.
:::

::: answer
`&` put the job in the background without cutting it loose from the terminal. When SSH dropped, the server tore down the terminal; the kernel sent `SIGHUP` to the shell and foreground job, and bash, exiting, passed `SIGHUP` to all its jobs. `SIGHUP`'s default is to terminate, so the campaign died mid-write — hence the half-filled directory.

At the time: `nohup ./run_campaign.sh &` (ignore `SIGHUP`, output to `nohup.out`); or `setsid` (new session, no terminal); or, once running, `disown %1` (off the job list, so the shell never signals it).

Next time: run it inside `tmux`. Its parent is then the tmux server, which does not depend on your connection. Unlike `nohup`, you also get the scrollback and a live terminal back when you reattach.
:::

::: check
Why does `kill` default to `SIGTERM` rather than `SIGKILL`, when `SIGKILL` always works?
:::

::: answer
"Always works" is only good if you do not care about the output. `SIGTERM` can be caught, so a well-written program treats it as a request: finish the integration step, flush telemetry to disk, close output files so they are valid, remove its lock file, exit. `SIGKILL` skips all that; the kernel never hands control back.

The damage from `-9`: a cut-off final record, an output file missing its ending that your loader rejects, a stale lock file blocking the next run, and — for a database or checkpointing solver — a half-written file. `SIGKILL` is for a process that was asked and did not listen, not the first thing to reach for.
:::

::: check
`jobs` shows `[1]+  Stopped   python3 fit_drag.py`. The job has made no progress for an hour and uses no CPU. What happened, and what are the two ways to get it moving again?
:::

::: answer
Somebody pressed `Ctrl-Z`, which sent `SIGTSTP` and put the job in state `T`. A stopped process gets no CPU; it keeps its memory, files and place in the calculation, and does nothing. Hence no CPU, no progress, and `T` in `ps`.

Two ways to resume. `fg %1` resumes it in the foreground, to watch or interrupt it. `bg %1` resumes it in the background and returns your prompt — right for a long job, and the step people forget. Both send `SIGCONT` underneath; `kill -CONT %1` does the same without changing the foreground job.
:::

## Summary

| Thing | Meaning | Remember |
| --- | --- | --- |
| `ps -o pid,ppid,stat,%cpu,rss,args` | pick your own columns | `RSS` is real memory; `VSZ` is reserved address space |
| `ps aux` / `ps -ef` | the two full-system forms | BSD and System V styles, both still used |
| `pgrep -a pat`, `pkill pat` | find / signal by name | run `pgrep` first, always |
| `STAT` `R S D T Z` | runnable, sleeping, stuck in I/O, stopped, zombie | `D` ignores even `SIGKILL` until the I/O returns |
| `top -b -n 1` | one frame, pasteable | read `wa` and `avail Mem` before the process list |
| `nice`, `renice`, `NI` | scheduling priority | changes who gets the CPU, nothing else |
| load average vs `nproc` | runnable + uninterruptible tasks, averaged | only meaningful next to the core count |
| `SIGTERM` (15) | polite request, catchable | the default for `kill`; lets the job save its work |
| `SIGKILL` (9) | carried out by the kernel, uncatchable | buffered output is lost |
| exit status $128 + N$ | killed by signal $N$ | 143 = `SIGTERM`, 137 = `SIGKILL`, often the OOM killer |
| `Ctrl-Z`, `bg`, `fg`, `jobs`, `%1` | job control | `Ctrl-Z` *stops*; `bg` is the other half |
| `nohup`, `setsid`, `disown` | survive `SIGHUP` | ignore it / new session / leave the job list |
| `/proc/<pid>/cwd`, `/exe`, `/cmdline` | where it runs, what it runs, how it was started | answers `ps` alone cannot give |

Next lesson: the other half of the shell's power. Redirection and pipes — `|`, `>`, `2>&1`, here-documents, `tee` and `xargs` — are how these small tools join up into one tool for the question you actually have.

::: context pid Numbers on the name tags
The kernel gives each new process the next free number, counting up, and wraps around at a limit stored in `/proc/sys/kernel/pid_max` — 32,768 on the machine used here, 4,194,304 on many modern servers. So a pid is only unique *while the process is alive*. Once it exits, its number can later be handed to a completely different process.

That is why scripts that save a pid in a file and kill it hours later sometimes hit the wrong target. Check with `ps -p <pid> -o args` that the number still means what you think before you signal it.
:::

::: context bsd-and-system-v Why ps has two dialects
In the 1980s Unix split into two big families: BSD, developed at the University of California, Berkeley, and System V, sold by AT&T. Each grew its own `ps` with its own flags. Linux's `ps` accepts both, and tells them apart by the dash: `ps aux` (no dash) is read the BSD way, `ps -ef` the System V way.

So `ps aux` and `ps -aux` are, strictly, different requests — one more reason to prefer the explicit `ps -o`.
:::

::: context process-tree A family tree of processes
Every process except the very first has a parent. Your login shell starts `python3`; `python3` might start helpers of its own. `ps -ef --forest` or `pstree` draws the tree.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="28" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="29" font-size="12" text-anchor="middle" fill="#1f2a44">pid 1 (init)</text>
  <line x1="180" y1="38" x2="90" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="38" x2="270" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="70" width="100" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">sshd</text>
  <rect x="220" y="70" width="100" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">python3 (55)</text>
  <line x1="90" y1="98" x2="90" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="125" width="100" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="144" font-size="12" text-anchor="middle" fill="#1f2a44">bash (40)</text>
  <line x1="140" y1="139" x2="220" y2="139" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="270" y="143" font-size="11" text-anchor="middle" fill="#b4232c">parent died:</text>
  <text x="270" y="158" font-size="11" text-anchor="middle" fill="#b4232c">adopted by pid 1</text>
</svg>
```

When a parent exits first, the orphaned child is adopted by pid 1 — exactly what happened to the survivors of the hang-up example.
:::

::: context uninterruptible How a process moves between states
A process spends its life hopping between a few states. The arrows below are the usual moves.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="180" y1="95" x2="60" y2="45"/>
    <line x1="180" y1="95" x2="60" y2="145"/>
    <line x1="180" y1="95" x2="300" y2="45"/>
    <line x1="180" y1="95" x2="300" y2="145"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="180" cy="95" r="24" fill="#8fb8f0"/>
    <circle cx="60" cy="45" r="22" fill="#fff"/>
    <circle cx="60" cy="145" r="22" fill="#f2b880"/>
    <circle cx="300" cy="45" r="22" fill="#fff"/>
    <circle cx="300" cy="145" r="22" fill="#fff"/>
  </g>
  <g font-size="15" font-weight="700" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="100">R</text><text x="60" y="50">S</text><text x="60" y="150">D</text><text x="300" y="50">T</text><text x="300" y="150">Z</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="180" y="135">running</text>
    <text x="14" y="15" text-anchor="start">sleeping: a signal wakes it</text>
    <text x="14" y="183" text-anchor="start">stuck in I/O: signals wait</text>
    <text x="300" y="15">stopped</text>
    <text x="300" y="183">zombie: exited</text>
  </g>
  <text x="180" y="208" font-size="11" text-anchor="middle" fill="#6c7a93">Ctrl-Z or SIGSTOP: R to T · SIGCONT: T to R · exit: R to Z</text>
</svg>
```

From `S`, `D` and `T` a process returns to `R`; from `Z` it never does. Some newer kernel waits are "killable", so a fatal signal can end them early, but an ordinary `D` sleep holds every signal until the I/O returns.
:::

::: context smoothed-average How the load average is smoothed
The kernel does not keep a list of the last fifteen minutes. Every five seconds it takes the current count of runnable and `D`-state tasks and nudges each average a little toward it: new average = old average × $d$ + current count × $(1 - d)$. The factor $d$ is different for the 1-, 5- and 15-minute figures, so the first reacts quickly and the last slowly.

This is an **exponentially weighted** average: a moment's count fades gradually instead of dropping off a cliff after exactly fifteen minutes. The same trick smooths noisy sensor readings in flight software.
:::

::: context exit-status-bits Reading 137 as bits
An exit status is one byte, 0 to 255. By convention the shell reports a death by signal as 128 plus the signal number, so the top bit (128) says "killed by a signal" and the seven bits below it hold the signal's number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="40" height="34" fill="#f2b880"/>
    <rect x="60" y="30" width="40" height="34" fill="#8fb8f0"/>
    <rect x="100" y="30" width="40" height="34" fill="#8fb8f0"/>
    <rect x="140" y="30" width="40" height="34" fill="#8fb8f0"/>
    <rect x="180" y="30" width="40" height="34" fill="#8fb8f0"/>
    <rect x="220" y="30" width="40" height="34" fill="#8fb8f0"/>
    <rect x="260" y="30" width="40" height="34" fill="#8fb8f0"/>
    <rect x="300" y="30" width="40" height="34" fill="#8fb8f0"/>
  </g>
  <g font-size="14" text-anchor="middle" fill="#1f2a44">
    <text x="40" y="52">1</text><text x="80" y="52">0</text><text x="120" y="52">0</text><text x="160" y="52">0</text>
    <text x="200" y="52">1</text><text x="240" y="52">0</text><text x="280" y="52">0</text><text x="320" y="52">1</text>
  </g>
  <g font-size="11" text-anchor="middle" fill="#6c7a93">
    <text x="40" y="22">128</text><text x="80" y="22">64</text><text x="120" y="22">32</text><text x="160" y="22">16</text>
    <text x="200" y="22">8</text><text x="240" y="22">4</text><text x="280" y="22">2</text><text x="320" y="22">1</text>
  </g>
  <text x="40" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">killed</text>
  <text x="200" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">signal number: 8 + 1 = 9 (SIGKILL)</text>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">128 + 9 = 137</text>
</svg>
```

Likewise 143 is 128 + 15 (`SIGTERM`) and 130 is 128 + 2, what you see after `Ctrl-C`.
:::

::: context oom-killer The out-of-memory killer
When the machine runs out of memory and nothing more can be freed, the Linux kernel picks a process — usually the one using the most memory — and ends it with `SIGKILL` so the rest of the system can keep going. This is the **OOM killer** ("out of memory").

It logs what it did to the kernel message log, which you read with `dmesg`. Because it uses `SIGKILL`, the victim gets no chance to save anything, and the job reports 137. Big Monte Carlo sweeps that each load a large table are its favorite target.
:::

::: context hang-up Why it is called "hang up"
Early Unix users typed on terminals connected through telephone lines and modems. When the phone line dropped — the modem "hung up" — the system sent the programs on that line signal 1, `SIGHUP`, so they would not keep running for a user who was gone.

A dropped SSH connection is today's version of the same event, which is why the old name stuck. Many background services, which have no terminal to lose, reuse `SIGHUP` to mean "reload your settings".
:::

::: context tmux-bridge Where tmux comes in
In lesson 09 you will start a long job inside `tmux`, press `Ctrl-b` then `d` to detach, close the laptop, and later reattach with everything still there — output, scrollback, the half-typed command.

It works because the tmux server, not your SSH session, owns the terminal the job runs in. When your connection drops, only the viewer disappears. No `SIGHUP` reaches the job, because the terminal it belongs to never went away.
:::
