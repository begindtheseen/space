---
id: l04-processes-signals-and-job-control
title: Processes, signals and job control
minutes: 22
covers:
  - 'Processes: ps, top/htop, kill, SIGTERM vs SIGKILL, job control, nohup'
---

A six-hour Monte Carlo is a process. So is the editor you left open on the login node, the stuck `rsync` that is holding the network, and the runaway solver that has taken all sixteen cores. Everything you do about any of them — look at it, slow it down, ask it to stop, make it stop, or keep it alive when your laptop sleeps — is done through the same small set of ideas: a process has a number, a parent, a state and a controlling terminal, and you talk to it by sending it a signal.

The part that matters most for your work is the difference between asking and forcing. A simulation that is killed politely writes its output; the same simulation killed with `-9` loses whatever was in its buffers. Engineers learn `kill -9` first because it always works, and then spend a year losing runs with it.

Every transcript below was produced on this machine — Ubuntu 24.04.4, kernel 6.18.44, procps-ng 4.0.4 (`ps`, `top`, `kill`, `pgrep`), htop 3.3.0, tmux 3.4, GNU bash 5.2.21. The process listings were taken inside a private PID namespace so that only the demonstration's own processes appear; on your machine `ps` will show hundreds of lines and the PIDs will be five-digit numbers rather than the small ones here. The PID numbers, the elapsed times and the load averages are all specific to the moment of capture.

## `ps`: what is running

`ps` with no arguments lists the processes attached to your terminal. It is the smallest useful question you can ask:

```bash
ps
```

```text
    PID TTY          TIME CMD
      1 ?        00:00:00 bash
      8 ?        00:00:00 python3
     10 ?        00:00:00 ps
```

Four columns: the process id, the controlling terminal (`?` when there is none, as here), the CPU time consumed, and the command. Note that `ps` lists itself — it was running when it looked.

Two full-system forms exist because `ps` inherited two incompatible option syntaxes, BSD and System V. Both are in daily use:

- `ps aux` — the BSD form, no dash. Columns: `USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND`.
- `ps -ef` — the System V form. Columns: `UID PID PPID C STIME TTY TIME CMD`.

Learn one and recognise the other. What you should really learn is `-o`, which lets you ask for exactly the columns you want:

```bash
ps -o pid,ppid,stat,%cpu,%mem,rss,args -p 6
```

```text
    PID    PPID STAT %CPU %MEM   RSS COMMAND
      6       1 R    98.3  0.0  7780 python3 sim_plain.py
```

`PPID` is the parent's pid; every process has one, and a process whose parent dies is re-parented to pid 1. `RSS` is resident set size in kilobytes — the physical memory actually held — which is the number to watch when you are worried about the out-of-memory killer. `VSZ`, by contrast, is address space and is routinely enormous and meaningless.

`pgrep` finds processes by name and `pkill` signals them:

```bash
pgrep -a python3
```

```text
8 python3 sim.py
```

`-a` prints the command line with the pid. Always run `pgrep` before `pkill` with the same pattern: the list you get back is exactly the list `pkill` would signal, and it is the only cheap way to discover that your pattern also matches the editor you have the job script open in.

::: note
Every field `ps` prints comes from `/proc/<pid>/`, and you can read it directly. `/proc/6/cmdline` is the argument vector with NUL separators, `/proc/6/cwd` is a symlink to the working directory, and `/proc/6/exe` is a symlink to the binary:

```bash
ls -l /proc/6/cwd /proc/6/exe
```

```text
lrwxrwxrwx 1 root root 0 Sep 22 20:25 /proc/6/cwd -> /home/eng
lrwxrwxrwx 1 root root 0 Sep 22 20:25 /proc/6/exe -> /usr/bin/python3.11
```

That is how you answer "which directory is this job writing into?" without asking the person who started it. It is also how you discover that a running process is executing a binary you have since replaced — `/proc/<pid>/exe` then shows the path with ` (deleted)` appended.
:::

### The STAT column

The letter in `STAT` is the process state, and it is genuinely diagnostic:

| Letter | State | What it means for you |
| --- | --- | --- |
| `R` | running or runnable | using CPU, or waiting for a core |
| `S` | interruptible sleep | waiting for something and can be woken by a signal — most processes, most of the time |
| `D` | uninterruptible sleep | inside a kernel call that cannot be interrupted, almost always disk or network I/O |
| `T` | stopped | suspended by `SIGSTOP` or `Ctrl-Z`, not scheduled at all |
| `Z` | zombie | exited, but its parent has not collected the exit status |

`D` is the one that alarms people, because a process in `D` does not respond even to `SIGKILL` until the kernel call returns. It is not stuck in your code; it is waiting on hardware, a full disk queue, or an NFS server that has gone away. Killing it harder does nothing. Find out what it is waiting on instead.

A zombie is not a running process at all — it is a few bytes of bookkeeping:

```bash
ps -o pid,ppid,stat,args -p 37,39
```

```text
    PID    PPID STAT COMMAND
     37       1 S    python3 -
     39      37 Z    [python3] <defunct>
```

Process 39 has exited. Its exit status is being held for its parent, 37, which has not called `wait()`. Zombies consume no CPU and no memory; they consume a pid. Thousands of them means a parent with a bug, and the cure is to fix or restart the *parent* — you cannot kill something that has already exited.

## `top` and `htop`

`top` is the live view. In batch mode it prints one frame and exits, which is the form you can paste into a log or a lesson:

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

Read the header before the process list. `us` is time in user code, `sy` in the kernel, `id` idle, and `wa` waiting for I/O. A machine at 90% `wa` is not computing, it is queueing for a disk, and adding threads will make it worse. `avail Mem` is the honest "how much could a new process get" figure; `free` is not, because the kernel deliberately spends free memory on cache.

Interactively, the keys worth knowing are `P` to sort by CPU, `M` by memory, `1` to expand the per-core lines, `k` to signal a process and `q` to quit. `htop` (3.3.0 here) is the same idea with colour, per-core bars, a searchable and scrollable process tree on `F5`, and `F9` to send a signal by name from a menu. Neither shows you anything `ps` cannot; they show it repeatedly, which is the point.

### Load average

```bash
nproc
uptime
```

```text
4
 20:25:52 up 10:44,  0 user,  load average: 0.94, 0.89, 1.02
```

The three numbers are exponentially weighted averages over one, five and fifteen minutes of the number of tasks that were *runnable or in uninterruptible sleep*. That second clause is a Linux peculiarity: a machine blocked on a dead NFS mount shows a huge load average while using no CPU at all.

A load average only means something against the core count, which is what `nproc` printed. On this four-core machine a load of 0.94 is about a quarter committed. A load of 4.0 would be fully committed; 8.0 would mean, on average, four tasks waiting for a core at every instant. The rising or falling trend across the three numbers usually tells you more than any one of them: `8.0, 4.0, 1.0` is a machine that just got busy, and `1.0, 4.0, 8.0` is one that is recovering.

## Signals

A signal is a small integer the kernel delivers to a process, interrupting whatever it was doing. `kill -l` lists them; the ones you need are few:

| Signal | Number | Default action | Catchable |
| --- | --- | --- | --- |
| `SIGHUP` | 1 | terminate | yes — daemons often reload config instead |
| `SIGINT` | 2 | terminate | yes — this is `Ctrl-C` |
| `SIGKILL` | 9 | terminate | **no** |
| `SIGTERM` | 15 | terminate | yes — the default for `kill` |
| `SIGSTOP` | 19 | stop | **no** |
| `SIGTSTP` | 20 | stop | yes — this is `Ctrl-Z` |
| `SIGCONT` | 18 | continue | yes |

`kill <pid>` sends `SIGTERM`. Despite the name, `kill` is "send a signal"; `kill -STOP` does not kill anything.

::: example SIGTERM lets the job save its work; SIGKILL does not
The program below is the shape every long simulation should have: it installs a handler for `SIGTERM` that flushes buffers and closes files before exiting.

```python
import signal, sys, time
def on_term(signum, frame):
    print("SIGTERM: flushing 412 MB of telemetry, closing files", flush=True)
    sys.exit(0)
signal.signal(signal.SIGTERM, on_term)
# ... run the simulation ...
```

Start it, let it run, and ask it to stop:

```bash
kill 8
cat a.out
```

```text
sim_entry_burn running, pid 8
SIGTERM: flushing 412 MB of telemetry, closing files
```

The shell reports its exit status as **0**: the process chose how to die, and chose to die successfully.

Now the same program, same run, killed with `-9`:

```bash
kill -9 12
cat b.out
```

```text
sim_entry_burn running, pid 12
```

Nothing after the start line. The handler never ran, because `SIGKILL` is delivered by the kernel and the process is never given control again. The shell reports **137**. Whatever was in the output buffer is gone, and on a real campaign that is the last several minutes of telemetry.

Finally, a program with no handler at all, sent `SIGTERM`:

```bash
kill -TERM 15
```

The shell reports **143**. That is the convention: a process killed by signal *N* is reported as **128 + N**, so 143 is 128+15 (`SIGTERM`) and 137 is 128+9 (`SIGKILL`). Seeing 137 in a CI log or a batch scheduler's report is the classic signature of the out-of-memory killer, which uses `SIGKILL`.

The order to use, always: `kill` first, wait ten or twenty seconds, and only then `kill -9`. If the process is in state `D`, neither will work until its I/O completes.
:::

Stopping and continuing are a separate axis from killing:

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

`T` is stopped: the process still exists, still holds its memory and its open files, and is simply not scheduled. `SIGCONT` resumes it exactly where it was. This is genuinely useful — a memory-hungry analysis can be parked with `SIGSTOP` while a more urgent job runs, then resumed — but note that stopping a process does not release its RAM.

## Job control

Job control is the shell's layer on top of all this. A *job* is a pipeline the shell started; the shell numbers them and lets you refer to them as `%1`, `%2`.

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

`&` starts the pipeline in the background. `[1] 17` is the job number and the pid. `jobs` lists them, with `+` marking the one that `fg` and `bg` will act on by default and `-` the next in line. `kill %1` signals a job by number rather than by pid.

`Ctrl-Z` suspends the foreground job — it sends `SIGTSTP` — and `bg` and `fg` move it between background and foreground:

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

That sequence is the everyday one: you start something in the foreground, realise it will take a while, press `Ctrl-Z` then type `bg`, and get your prompt back with the job still running. `fg` brings it back so you can watch it or interrupt it with `Ctrl-C`.

::: warning
`Ctrl-Z` does not put a job in the background. It **stops** it — state `T`, consuming no CPU and making no progress. Pressing `Ctrl-Z` on a simulation and then closing the laptop leaves you with a job that has been frozen for six hours. `bg` is the other half of the manoeuvre and it is not optional.
:::

## Surviving the disconnect

Here is the failure that costs the most time. A job started with `&` is still a member of your terminal's process group. When the terminal goes away — the SSH connection drops, the window closes, the laptop sleeps until the server gives up — the kernel sends `SIGHUP` to that group, and the default action for `SIGHUP` is to terminate.

::: example What survives a hangup, and what does not
Three jobs started from the same interactive shell: one plain, one under `nohup`, one under `setsid`.

```text
$ python3 sim_plain.py > plain.out 2>&1 &
[1] 47
$ nohup python3 sim_plain.py > nohup_demo.out 2>&1 &
[2] 50
$ setsid python3 sim_plain.py > setsid.out 2>&1 &
[3] 53
```

Before the terminal is destroyed, all three are running:

```text
    PID    PPID STAT COMMAND
     47      40 S    python3 sim_plain.py
     50      40 S    python3 sim_plain.py
     55       1 Ss   python3 sim_plain.py
```

The terminal is then killed, exactly as a dropped connection would kill it. Afterwards:

```text
    PID    PPID STAT COMMAND
     50       1 S    python3 sim_plain.py
     55       1 Ss   python3 sim_plain.py
```

Pid 47 — the plain `&` — is gone. The other two survived and have been re-parented to pid 1. Note their parent was 40, the shell, and is now 1.

`nohup` works by making the process ignore `SIGHUP` before it starts. It also redirects output, and says so, because a background process writing to a terminal that may vanish is a problem in its own right:

```text
$ nohup python3 sim_plain.py &
[1] 18
$ nohup: ignoring input and appending output to 'nohup.out'
```

If you redirect the output yourself, as in the first transcript, the message shortens to `nohup: ignoring input`. `setsid` takes a different route: it puts the process in a brand-new session with no controlling terminal at all, which is why its state shows `Ss` — the `s` means session leader.

`disown` is the retrofit for the job you already started and forgot to protect. `disown %2` removes the job from the shell's table, so the shell does not forward `SIGHUP` to it on exit:

```text
$ python3 sim_plain.py > two.out 2>&1 &
[2] 24
$ disown %2
$ jobs
[1]+  Running                 nohup python3 sim_plain.py &
```

Job 2 has vanished from `jobs` — and it survived the hangup, re-parented to pid 1 like the others. The cost is that you can no longer refer to it as `%2`; from then on it is a pid like any other.
:::

None of these three is the right answer for a six-hour Monte Carlo, because none of them gives you the scrollback back. For that you want `tmux`, which lesson 09 covers: the job runs inside a session owned by the tmux server, your terminal merely views it, and disconnecting is a non-event.

::: key
`SIGTERM` (15) is a request the process can catch, so it can flush buffers and close files. `SIGKILL` (9) is delivered by the kernel and cannot be caught, blocked or ignored, so buffered output is lost. Always `kill` first and `kill -9` only after waiting. A process killed by signal *N* reports exit status 128 + *N*: 143 for `SIGTERM`, 137 for `SIGKILL`.
:::

## Check yourself

::: check
Your batch scheduler reports that a simulation exited with status 137. What killed it, what is the single most likely cause, and where would you look to confirm?
:::

::: answer
137 = 128 + 9, so the process was killed by `SIGKILL`. Since `SIGKILL` cannot be caught, the process had no say in it, which rules out any self-inflicted exit.

The most likely cause by far is the kernel's out-of-memory killer, which uses `SIGKILL`. Confirm in `dmesg`, where the OOM killer logs a block naming the process it chose and the memory it was using — `dmesg -T | grep -i -e oom -e "killed process"`. The other candidates are a scheduler enforcing a wall-clock or memory limit, and a human who typed `kill -9`. If it was OOM, `ps -o rss` on the next run, or the scheduler's own peak-memory report, will show the job approaching the limit.
:::

::: check
A colleague says a process is "unkillable" — `kill -9` returns without error, and the process is still in `ps` a minute later, at state `D`, using no CPU. Explain, and say what you would actually do.
:::

::: answer
`D` is uninterruptible sleep: the process is blocked inside a kernel call that has been entered in a way that cannot be aborted, and signals — including `SIGKILL`, which is otherwise undeniable — are only delivered when it returns to user space. So the kill is queued, not ignored; nothing has failed, and the process will die the instant the call completes.

What is holding it is I/O. The usual culprits are an NFS or network filesystem whose server has gone away, a failing disk retrying reads, or a device driver waiting on hardware. Find out which: `cat /proc/<pid>/stack` if you are root, `cat /proc/<pid>/wchan` for the kernel function it is sleeping in, and `ls -l /proc/<pid>/cwd` and `/proc/<pid>/fd/` for what it has open. Then fix the I/O — remount the share, clear the queue. Rebooting the machine is the last resort and is sometimes genuinely the only one.
:::

::: check
You start `./run_campaign.sh &` over SSH, see the job number, and close the laptop. Six hours later you reconnect and the job is gone, with a partial output directory. Explain the mechanism precisely, and give two fixes — one you could have used at the time and one for next time.
:::

::: answer
`&` put the job in the background of your *terminal's* process group; it did not detach it from the terminal. When the SSH connection dropped, the server tore down the pseudo-terminal, and the kernel sent `SIGHUP` to the foreground process group and to the session; bash also forwards `SIGHUP` to its jobs on exit. The default action for `SIGHUP` is terminate, so the campaign died mid-write — hence the partial directory.

At the time: `nohup ./run_campaign.sh &`, which makes the process ignore `SIGHUP` and redirects its output to `nohup.out`; or `setsid`, which puts it in a new session with no controlling terminal; or, if it was already running, `disown %1`, which takes it out of the shell's job table so the shell does not signal it.

For next time: run it inside `tmux`. The job's parent is then the tmux server, which is not tied to your connection, so disconnecting changes nothing — and, unlike `nohup`, you get the scrollback and an interactive terminal back when you reattach.
:::

::: check
Why does `kill` default to `SIGTERM` rather than `SIGKILL`, given that `SIGKILL` always works?
:::

::: answer
Because "always works" is only a virtue if you do not care about the process's output. `SIGTERM` can be caught, so a well-written program uses it as a request: stop the integration at the next step boundary, flush the telemetry buffer to disk, close the output files so they are valid, remove the lock file, and exit. All of that is skipped under `SIGKILL`, which hands control to the kernel and never returns to the process.

The practical consequences of `-9` are a truncated final record, an output file with no footer that your loader then rejects, a stale lock file that blocks the next run, and — with something like a database or a checkpointing solver — a half-written file on disk. `SIGKILL` is the tool for a process that has already been asked and has not complied, not the first thing to reach for.
:::

::: check
`jobs` shows `[1]+  Stopped   python3 fit_drag.py`. The job has made no progress for an hour and is using no CPU. What happened, and what are the two ways to get it moving again?
:::

::: answer
Somebody pressed `Ctrl-Z`, which sends `SIGTSTP` and puts the job in state `T`. A stopped process is not scheduled at all: it keeps its memory, its open files and its place in the computation, and does nothing. That is why it shows no CPU and no progress, and why `ps` would show `T` rather than `R` or `S`.

Two ways to resume it. `fg %1` brings it to the foreground and resumes it, which is what you want if you need to watch it or interrupt it. `bg %1` resumes it in the background and gives you your prompt back, which is what you want for a long job — and is the step people forget after `Ctrl-Z`. Underneath, both send `SIGCONT`; `kill -CONT %1` does the same thing without changing which job is in the foreground.
:::

## Summary

| Thing | Meaning | Note |
| --- | --- | --- |
| `ps -o pid,ppid,stat,%cpu,rss,args` | pick your own columns | `RSS` is real memory; `VSZ` is address space and is not |
| `ps aux` / `ps -ef` | the two full-system forms | BSD and System V syntax, both survive |
| `pgrep -a pat`, `pkill pat` | find / signal by name | run `pgrep` first, always |
| `STAT` `R S D T Z` | runnable, sleeping, uninterruptible I/O, stopped, zombie | `D` ignores even `SIGKILL` until the I/O returns |
| `top -b -n 1` | one frame, pasteable | read `wa` and `avail Mem` before the process list |
| load average vs `nproc` | runnable + uninterruptible tasks, averaged | only meaningful against the core count |
| `SIGTERM` (15) | polite request, catchable | the default for `kill`; lets the job flush |
| `SIGKILL` (9) | kernel-delivered, uncatchable | buffered output is lost |
| exit status 128 + N | killed by signal N | 143 = SIGTERM, 137 = SIGKILL, often the OOM killer |
| `Ctrl-Z`, `bg`, `fg`, `jobs`, `%1` | job control | `Ctrl-Z` *stops*; `bg` is the other half |
| `nohup`, `setsid`, `disown` | survive `SIGHUP` | ignore the signal / new session / leave the job table |
| `/proc/<pid>/cwd`, `/exe`, `/cmdline` | where it runs, what it runs, how it was invoked | answers you cannot get from `ps` alone |

Lesson 05 takes the other half of the shell's power: redirection and pipes — `|`, `>`, `2>&1`, here-documents, `tee` and `xargs` — which is how these small tools become a tool for the question you actually have.
