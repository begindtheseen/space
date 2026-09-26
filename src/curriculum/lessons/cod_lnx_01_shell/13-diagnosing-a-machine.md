---
id: l13-diagnosing-a-machine
title: Diagnosing a machine — disk, network, syscalls, kernel
minutes: 22
covers:
  - df du lsblk ip ss curl strace lsof dmesg
---

A good doctor does not guess. She takes your temperature, listens to your chest, looks in your throat. Each instrument answers one question.

This lesson gives you the instruments for a sick Linux machine. The Monte Carlo campaign stopped at case 312. The license server is "unreachable". A simulation binary that worked yesterday exits at once and prints nothing. The engineer who sorts it out in ten minutes knows nine commands:

- **Is there room?** — `df`, `du`, `lsblk`.
- **Is the network the problem?** — `ip`, `ss`, `curl`.
- **What is the program actually doing?** — `strace`, `lsof`.
- **What did the kernel notice?** — `dmesg`.

We break things on purpose, in small sandboxes, so every failure and every output below is real (Ubuntu 24.04.4, kernel 6.18.44).

## Is there room? `df`, `du`, `lsblk`

Picture a parking garage. You can ask the office, which keeps a counter of free spaces, or walk every row counting cars. Usually the answers agree. When they do not, the difference is a clue.

`df` ("disk free") asks the office. It reports free space **per filesystem** — per separate storage area, each with its own counter. `-h` gives human-readable units, and a path asks about the filesystem that path lives on. The `.` means "the folder I am in":

```bash
df -h .
```

```text
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           7.9G  2.0M  7.9G   1% /home
```

This folder is on a **[[tmpfs|tmpfs]]**, a filesystem in memory. `df -h` with no path lists every filesystem, and "Mounted on" shows where each is attached. That is how you discover that `/home` and `/` are separate — so cleaning `/tmp` does nothing for a full home folder.

`du` ("disk usage") walks the rows. It adds up the space **used by files**, going down into every subfolder:

```bash
du -sh runs telemetry configs
```

```text
2.0M	runs
24K	telemetry
8.0K	configs
```

`-s` gives one total per argument. To find what is eating the disk, go one level at a time and sort. Read `|` aloud as "pipe": it feeds the left command's output to the right one.

```bash
du -h --max-depth=1 . | sort -h
```

```text
8.0K	./configs
24K	./telemetry
2.0M	.
2.0M	./runs
```

`sort -h` understands `K`, `M` and `G` (lesson 06), so the biggest lands last. `cd` into it and repeat.

::: warning Three sizes that disagree
**Bytes versus blocks.** Space is handed out in fixed chunks called **[[blocks|blocks]]**, usually 4 KiB, and a tiny file still takes a whole one. `du` counts blocks; `du -b` (`--bytes`, which implies `--apparent-size`) counts bytes written, as `ls -l` does:

```bash
du -sh . ; du -sb .
```

```text
2.0M	.
337551	.
```

The 500 log files in `runs` hold a few hundred bytes each, but each sits in its own 4 KiB block: 2.0 MB of blocks for 338 kB of content, a factor of $2\,097\,152 / 337\,551 \approx 6.2$.

**`du` versus `df`.** Both count blocks, so normally they roughly agree. When `df` shows far more used than `du` finds, suspect: a deleted file still open (next); files hidden under a **mount point**, written into a folder before a filesystem was attached over it; folders `du` skipped with `Permission denied`; and the few percent ext4 reserves for root, which is why `Used` plus `Avail` is less than `Size`.
:::

### The deleted file that still holds its space

A file's name is only a label on its data. The data is freed only when no labels are left *and* no program has the file open. Here a program holds a 6 MB log open on an 8 MB filesystem, and the file is deleted (read `;` as "then"):

```bash
rm /mnt/small/telemetry.log
df -h /mnt/small; du -sh /mnt/small
```

```text
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           8.0M  6.0M  2.0M  75% /mnt/small
0	/mnt/small
```

`du` walks names, and the name is gone. `df` asks the filesystem, and the blocks are still taken. Both are right. This is the classic "disk full, nothing on it": nearly always a log deleted while a service was writing it.

`lsof +L1` lists every open file whose **[[link count|inode]]** — the number of names pointing at it — is below one. That is every deleted-but-open file on the machine:

```text
COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NLINK NODE NAME
python3   16660     root    3w   REG   0,63  6291456     0    2 /mnt/small/telemetry.log (deleted)
```

There is the culprit: process number (PID) 16660, 6 MB, `NLINK` 0. Restart it, or ask it to reopen its log, and the space returns at once. `ls -l /proc/16660/fd` shows it from the process's side.

### Devices and inodes

`lsblk` ("list block devices") shows the devices below the filesystems:

```bash
lsblk
```

```text
NAME  MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
zram0 253:0    0     0B  0 disk
vda   254:0    0   256G  0 disk /
vdb   254:16   0   9.6M  1 disk /opt/rclone
vdc   254:32   0 250.4M  1 disk /opt/claude-code
```

`RO` is 1 for read-only. `TYPE` tells a `disk` from a `part` (partition) or `lvm` volume. An empty `MOUNTPOINTS` means the device exists but is not attached — the answer when a data disk "disappeared". `lsblk -f` adds type, label and fullness.

One failure hides from `df -h`: **running out of inodes**. An **inode** is the record card kept for each file — owner, permissions, where its blocks are. Filesystems such as ext4 print a fixed number of cards when created. When they run out, no file can be made even with gigabytes free, and you get the same "no space" error. `-i` counts cards:

```bash
df -i /mnt/small
```

```text
Filesystem      Inodes IUsed   IFree IUse% Mounted on
tmpfs          2060247     1 2060246    1% /mnt/small
```

Run `df -i` whenever "No space left on device" appears and `df -h` looks fine. A campaign writing several small files per case runs out of inodes first.

::: example What a full filesystem looks like
A job that dies at 3 a.m. leaves you only this. Here it is on a one-megabyte tmpfs. `dd` copies data in blocks; this asks for 32 blocks of 64 KiB, 2 MiB in all:

```bash
dd if=/dev/zero of=big.bin bs=64k count=32
```

```text
dd: error writing 'big.bin': No space left on device
17+0 records in
16+0 records out
1048576 bytes (1.0 MB, 1.0 MiB) copied, 0.000500892 s, 2.1 GB/s
```

It wrote 16 blocks and the 17th failed. Check: $16 \times 65\,536 = 1\,048\,576$ bytes, exactly the 1 MiB filesystem. `df -h` now shows `100%`, and the next write fails at once:

```bash
dd if=/dev/zero of=big2.bin bs=64k count=64
ls -l
```

```text
dd: error writing 'big2.bin': No space left on device
1+0 records in
0+0 records out
0 bytes copied, 6.3783e-05 s, 0.0 kB/s
total 1024
-rw-r--r-- 1 root root 1048576 Sep 26 18:06 big.bin
-rw-r--r-- 1 root root       0 Sep 26 18:06 big2.bin
```

"No space left on device" is the **`ENOSPC`** error. Python raises `OSError`, a C++ `ofstream` quietly sets its `badbit`, a solver writes a cut-off file and carries on. And `big2.bin` exists with size 0: "the output file is there" does not prove the run worked.

Then check, in order: `df -h`, `df -i`, `lsof +L1`.
:::

## Is it the network? `ip`, `ss`, `curl`

Think of phoning an office. Is your phone plugged in? Is anyone at the extension? Do they understand you? Three commands check those three things. `ip` (which replaced `ifconfig` and `route`) answers the first:

```bash
ip -br a
```

```text
lo               UNKNOWN        127.0.0.1/8
ifb0             DOWN
ifb1             DOWN
eth0             UP             192.0.2.2/24
docker0          DOWN           172.17.0.1/16
```

`-br` (brief) prints one line per **interface** — a network connection, real or virtual — with state and address. `ip a` gives full detail; `ip a show eth0` narrows it. `DOWN` on the interface you meant to use ends the investigation.

```bash
ip r
```

```text
default via 192.0.2.1 dev eth0
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown
192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.2
```

That is the **routing table**: where to send traffic for each range of addresses. `default via ...` names the **gateway**, where everything else goes. With no default route, only the local network is reachable — which looks like broken DNS.

`ss` ("socket statistics", replacing `netstat`) answers the second: what is listening, and who is connected.

```bash
ss -ltnp | grep -E "2222|8899"
```

```text
LISTEN 0      128        127.0.0.1:2222       0.0.0.0:*    users:(("sshd",pid=25014,fd=4))
LISTEN 0      5          127.0.0.1:8899       0.0.0.0:*    users:(("python3",pid=24049,fd=3))
```

`-l` listening, `-t` TCP, `-n` numeric (no name lookups, so it cannot hang on slow DNS), `-p` the owning process — which needs root for other users' processes.

Read the **Local Address** column. `127.0.0.1:8899` means the service listens on **[[loopback|loopback]]** only: reachable *only from this machine*. `0.0.0.0:8899` would mean every interface. A service you cannot reach from your laptop, but that works once you SSH in, is almost always on `127.0.0.1` — and lesson 08's `ssh -L` tunnel is the answer. `ss -tn state established` lists connections; `ss -s` counts sockets by state.

`curl` answers the third. It talks to a web (HTTP) service, and how it fails tells you where things broke:

```bash
curl -s -o /dev/null -w "http=%{http_code} time=%{time_total}s size=%{size_download}\n" http://127.0.0.1:8899/
```

```text
http=200 time=0.002176s size=40
```

`-o /dev/null` discards the page and `-w` prints only the fields you name — a health check. Now three failures:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8899/nosuchpage
```

```text
404
```

```bash
curl -sS --max-time 3 http://127.0.0.1:9999/
```

```text
curl: (7) Failed to connect to 127.0.0.1 port 9999 after 0 ms: Couldn't connect to server
```

```bash
curl -sS --max-time 3 http://no-such-host.invalid/
```

```text
curl: (6) Could not resolve host: no-such-host.invalid
```

Three layers, three answers:

- **404** — the network is fine and the server answered. Your address (URL) is wrong.
- **Exit status 7** — the connection was refused: nothing listens on that port, or a firewall rejected it. A firewall that silently drops packets gives a timeout instead (exit 28 with `--max-time`).
- **Exit status 6** — **[[DNS|dns]]**, which turns names into addresses, failed. Nothing was attempted.

::: warning A 404 is still exit status 0
`curl` counts any answer as success, so that 404 exited 0, and a script testing only `$?` ("dollar question mark", the last exit status) calls a missing page healthy. With `-f` (`--fail`), any HTTP status of 400 or more becomes exit status 22:

```text
curl: (22) The requested URL returned error: 404
```
:::

In scripts use `-sS`: `-s` hides the progress meter, `-S` keeps error messages. `-I` fetches headers; `-v` shows everything.

## What is the program doing? `strace`, `lsof`

A program cannot touch a file, the network or the screen itself. It asks the kernel, and each request is a **[[system call|system-call]]**. `strace` prints every system call with its answer, turning "it fails and says nothing" into a written record:

```bash
strace -e trace=openat cat nosuchfile.yaml
```

```text
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
openat(AT_FDCWD, "nosuchfile.yaml", O_RDONLY) = -1 ENOENT (No such file or directory)
cat: nosuchfile.yaml: No such file or directory
+++ exited with 1 +++
```

Read each line as *call(arguments) = result*. `openat` opens a file; a result of 3 is a file number, success. A negative result is an error, and `strace` names it. The **[[error names|errno-names]]** to know: `ENOENT` no such file, `EACCES` permission denied, `ENOSPC` no space, `ECONNREFUSED` nothing listening. When a program fails without saying *which* file it wanted — configuration, license, shared library — the failing `openat` names it.

The flags that matter:

- `-e trace=openat`, or a class such as `trace=file`, `trace=network`, `trace=process`, to cut the noise;
- `-f` to follow child processes — without it you see nothing from a program started by a wrapper script;
- `-p PID` to attach to a running program; `-o FILE` to save the long record;
- `-c` for a count instead of a record:

```bash
strace -c ls configs
```

```text
  0.00    0.000000           0         7           openat
------ ----------- ----------- --------- --------- ----------------
100.00    0.000000           0        75         4 total
```

Seventy-five calls to list one folder, four failed — the `errors` column. Look there when a program is slow because it searches thirty folders for a missing file.

`strace` slows a program greatly, so it is for diagnosis only. Attaching with `-p` to another user's process needs root. On Ubuntu, so does attaching to your *own* running process, unless `kernel.yama.ptrace_scope` is 0; starting a program under `strace` always works.

`lsof` ("list open files") shows what a program has open — sockets, pipes and devices too, since Unix opens them all like files:

```bash
lsof -p 16660 | grep -E 'COMMAND|telemetry'
```

```text
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
python3 16660 root    3w   REG   0,63  6291456      2 /mnt/small/telemetry.log (deleted)
```

Four forms: `lsof -p PID`, one process; `lsof +D /dir`, everyone using a folder (what blocks `umount`); `lsof -i :8899`, who holds a port; `lsof +L1`, deleted-but-open files. Without root you see only your own processes.

## What did the kernel see? `dmesg`

Some deaths leave no note, because the program is not alive to write one. The kernel keeps a diary anyway, in a **[[ring buffer|ring-buffer]]**: hardware and driver events, filesystem errors, and the kills a program cannot report. `dmesg` reads it:

```bash
dmesg --level=err,warn | tail -5
```

```text
[    0.923833] software IO TLB: No low mem
[    2.638677] EXT4-fs (vda): warning: mounting unchecked fs, running e2fsck is recommended
[37451.234140] systemd[1]: Failed to create symlink /sys/fs/cgroup/cpu: File exists
[37451.235891] systemd[1]: Failed to create symlink /sys/fs/cgroup/cpuacct: File exists
[37451.292625] systemd[1]: Binding to IPv6 address not available since kernel does not support IPv6.
```

The bracketed number is seconds since boot; `dmesg -T` shows time of day instead. `--level=err,warn` keeps errors and warnings. Without root you may get `dmesg: read kernel buffer failed: Operation not permitted` — a security setting (`kernel.dmesg_restrict`), not a broken machine.

### The exit status tells you who ended it

Lesson 04 showed that a program killed by signal N gets exit status **[[128 + N|exit-128]]**. So a **small status** (1, 2, …) means the program ended *itself*. **128 + N** means something *outside* ended it, and the program could write nothing.

::: example The two kills only `dmesg` can explain
**A segmentation fault.** A small C program, `sim_crash`, compiled with `gcc -g` so it carries debugging information, prints a line and then writes through a **null pointer** — address zero, which no program may touch:

```bash
./sim_crash; echo "exit=$?"
```

```text
about to dereference
Segmentation fault
exit=139
```

$139 = 128 + 11$, and signal 11 is `SIGSEGV`. The last two words came from the shell, and are all anyone saw of the crash. The kernel wrote more:

```bash
dmesg -T | grep sim_crash | tail -2
```

```text
[Sat Sep 26 18:06:33 2026] sim_crash[14360]: segfault at 0 ip 000055e7014df19f sp 00007ffcfcfe3840 error 6 in sim_crash[119f,55e7014df000+1000] likely on CPU 0 (core 0, socket 0)
```

`segfault at 0` is the address touched: a null pointer. `ip` is the **instruction pointer**, the address of the guilty instruction. The bracket gives the same spot as an offset in the file. Check: $\texttt{0x55e7014df19f} - \texttt{0x55e7014df000} = \texttt{0x19f}$, and this piece of the program starts at file offset `0x1000`, so the offset is $\texttt{0x1000} + \texttt{0x19f} = \texttt{0x119f}$. `addr2line` turns that into a function and a source line (`-f` asks for the function, `-s` drops the folder from the path):

```bash
addr2line -s -e sim_crash -f 0x119f
```

```text
main
crash.c:6
```

Line 6 of `crash.c` is `*p = 42;`. For a solver that dies once in three hundred cases, that line is often the whole diagnosis. An address of `0`, or a small one like `0x18` (a field read through a null pointer), means null; a random-looking one usually means a garbage or freed pointer.

**The out-of-memory killer.** A Python sweep, run as a service capped at 64 MiB by its control group, asks for more:

```bash
systemctl status sim-hog --no-pager | head -6
```

```text
× sim-hog.service - Sweep that asks for more memory than it is allowed
     Loaded: loaded (/run/systemd/system/sim-hog.service; static)
     Active: failed (Result: signal) since Tue 2026-09-22 21:08:27 UTC; 3s ago
   Duration: 66ms
    Process: 722 ExecStart=/usr/bin/python3 /run/sim_hog.py (code=killed, signal=KILL)
   Main PID: 722 (code=killed, signal=KILL)
```

`code=killed, signal=KILL`: no chance to log anything. The reason is in the kernel's diary:

```bash
dmesg -T | grep -i -e "out of memory" -e "Killed process" | tail -4
```

```text
[Tue Sep 22 21:08:28 2026] Memory cgroup out of memory: Killed process 16914 (python3) total-vm:80648kB, anon-rss:65224kB, file-rss:5308kB, shmem-rss:0kB, UID:0 pgtables:192kB oom_score_adj:0
```

`anon-rss:65224kB` is the program's own data: $65\,224 / 1024 \approx 63.7$ MiB, at the 64 MiB ceiling once mapped files are added. "Memory cgroup out of memory" means a *limit* was hit; without "cgroup", the whole machine ran out and the kernel chose a victim. So "exited with 137 and wrote nothing" means $128 + 9$, `SIGKILL`, and only `dmesg` records why.
:::

### Core files

A **[[core file|core-file]]** is a snapshot of a crashed program's memory, which the debugger `gdb` can open. `ulimit -c` prints the largest core this shell allows; `0`, the usual default, means none, and `ulimit -c unlimited` turns them on. `/proc/sys/kernel/core_pattern` says where cores go; if it starts with `|`, a collector takes them, such as `systemd-coredump` (see `coredumpctl`) or Ubuntu's `apport`.

::: key Where to look when a simulation binary silently exits on a remote box
Exit status (`$?`), then the process stderr, then `dmesg` (the OOM killer logs there), then `journalctl -u <unit>` if it was a service, then check `ulimit -c` and look for a core file.
:::

::: key
`df` asks the filesystem, `du` walks names; a big gap means a deleted-but-open file (`lsof +L1`). `df -i` catches inode exhaustion. In `ss -ltnp`, `127.0.0.1` is loopback only, `0.0.0.0` every interface. `curl` exit 6 is DNS, 7 a refused connection; a 404 means the network was fine. `strace -f -e trace=openat` names the file a silent program wanted. `dmesg` alone records a segfault (exit 139) or an OOM kill (exit 137).
:::

## Check yourself

::: check
`df -h /data` says 100% used. `du -sh /data` says 40 GB on a 500 GB filesystem. Explain both numbers and give the command that finds the cause.
:::

::: answer
Most likely a process holds a deleted file open. Removing a name lowers the inode's link count, but blocks are freed only when the count is zero *and* no process has the file open. `du` walks names, so a nameless file is invisible to it; `df` asks the filesystem, where the blocks are still taken.

`lsof +L1` lists open files with link count below one: PID, size, and path marked `(deleted)`. Restart the process holding the big one on `/data`, or signal it to reopen its log, and the space returns instantly. The usual culprit is a log removed by a cleanup script while a service still wrote to it — what `logrotate` with `copytruncate`, or following by name with `tail -F` (lesson 02), avoids.

Also rule out the other ways `du` misses space: run it as root so nothing is skipped, and check nothing was written into `/data` before the disk was mounted over it. (`du -sb` versus `du -sh` does not explain this gap; `du` and `df` both count blocks.)
:::

::: check
A campaign fails with "No space left on device" but `df -h` shows 60% free on the output filesystem. What else do you check, and why does the workload make it likely?
:::

::: answer
`df -i` on the same filesystem. On ext4 the number of inodes is fixed when the filesystem is made, and every file uses one whatever its size. Running out gives `ENOSPC`, the same error as a full disk, while `df -h` shows free blocks.

A Monte Carlo campaign is the classic cause: huge numbers of small files. Five hundred cases is nothing, but a fifty-thousand-case sweep writing four files per case needs $50\,000 \times 4 = 200\,000$ inodes, and a filesystem made for a few large datasets may have fewer.

Fix the layout: fewer, larger files (one HDF5 file or tar archive per batch), archive finished batches with `tar` and delete the originals, or recreate the filesystem with more inodes per gigabyte — an existing ext4 filesystem's inode density cannot be changed.
:::

::: check
A colleague cannot reach a dashboard on `sim01:8080` from her laptop, but `curl http://localhost:8080/` works when she is logged in to `sim01`. Give the command that confirms the cause in one line, and the two possible fixes.
:::

::: answer
`ss -ltnp | grep 8080` on `sim01`. A Local Address of `127.0.0.1:8080` means the service is bound to loopback and, by design, accepts nothing from outside the machine; no firewall is involved and nothing is broken. `0.0.0.0:8080` or `*:8080` would mean it listens everywhere and the problem is elsewhere — a firewall, a route, the wrong address.

Fix one, right for a dashboard with no login: tunnel with `ssh -L 8080:127.0.0.1:8080 sim01`, then browse to `http://localhost:8080` on the laptop. Fix two: rebind the service to `0.0.0.0`, which exposes it to everything that can reach the machine and so needs a firewall rule and thought.

If `ss` shows nothing on 8080, the service is not running — go to `systemctl status`.
:::

::: check
A solver prints nothing and exits immediately with status 1. You `strace` it and see `openat(AT_FDCWD, "/opt/sim/etc/vehicle.yaml", O_RDONLY) = -1 ENOENT`. What do you now know, and what do you check next?
:::

::: answer
You know exactly which file it wanted and that it is not at that path — which the program never said. `AT_FDCWD` means a relative path would start from the working folder; this path is absolute, so that does not matter here.

Next, in order. Does the file exist — `ls -l /opt/sim/etc/vehicle.yaml` — or was the software installed under another prefix (lesson 11)? If you can see it but the trace says `ENOENT`, check each step with `namei -l /opt/sim/etc/vehicle.yaml`: a missing execute bit on a parent gives `EACCES`, but a broken symbolic link partway along gives `ENOENT`. Then check where it was told to look: a variable such as `SIM_ROOT`, set in your interactive shell but not in the batch environment (lesson 10), causes exactly this.

If a wrapper script starts the solver, add `-f`, or you trace only the wrapper.
:::

::: check
Distinguish exit status 137, 139 and 1 for a simulation binary, and say where you would look for the reason in each case.
:::

::: answer
**137** is $128 + 9$, `SIGKILL`: no handler ran, and the log stops mid-sentence. Look in `dmesg` for the OOM killer ("Out of memory: Killed process" for the machine, "Memory cgroup out of memory" for a limit), and in the scheduler's or container's records for a memory or time limit. Or someone typed `kill -9`.

**139** is $128 + 11$, `SIGSEGV`: the program touched memory it may not. Look in `dmesg` for `segfault at ADDRESS ip ADDRESS` (`at 0` is a null pointer), and for a core file if `ulimit -c` allowed one, which `gdb` can open. This is a bug in the program, not the machine.

**1** is a *chosen* status: the program decided it had failed. Trust its own output — stderr, its log file, or `journalctl -u` for a service. `dmesg` has nothing, because to the kernel nothing went wrong. The rule: 128 + N means the kernel is the witness; a small status means the program's own output is.
:::

## Summary

| Command | Answers |
| --- | --- |
| `df -h PATH`, `df -i PATH` | free space, free inodes |
| `du -h --max-depth=1 \| sort -h` | what uses the space |
| `du -sb` vs `du -sh` | bytes vs blocks |
| `lsof +L1` | deleted-but-open files |
| `lsblk -f` | devices and mount points |
| `ip -br a`, `ip r` | interfaces, routes |
| `ss -ltnp` | who listens where |
| `curl -fsS -w '%{http_code}'` | health check: exit 6 DNS, 7 refused, 22 HTTP error |
| `strace -f -e trace=openat`, `-c` | which file it wanted; call counts |
| `lsof -p`, `+D`, `-i :PORT` | open files, unmount blockers, ports |
| `dmesg -T` | the kernel's record |
| exit 139, `segfault at 0` | null pointer; `addr2line` finds the line |
| exit 137, `Killed process` | the OOM killer |
| `ulimit -c`, `coredumpctl` | core files |

Lesson 14 is the last piece of survival kit: enough `vim` to edit a configuration file on a machine with nothing else — and to get back out.

::: context tmpfs A filesystem made of memory
A **tmpfs** keeps its files in RAM instead of on a disk. It is fast, and it starts empty at every boot, which is why Linux uses it for `/run` and often for `/tmp`. Anything saved there is gone when the power goes. If `df` shows your working folder is on a tmpfs, results you mean to keep belong somewhere else. Its size is also a limit on memory: a tmpfs that fills up is eating RAM that your simulation could have used.
:::

::: context blocks Why small files waste space
A filesystem hands out space in whole blocks, like a parking garage that only rents full spaces. A 650-byte log still takes a whole 4096-byte block, so most of the block sits empty.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="12" fill="#1f2a44">three small files, one 4 KiB block each</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="12" y="32" width="100" height="40" fill="#fff"/>
    <rect x="130" y="32" width="100" height="40" fill="#fff"/>
    <rect x="248" y="32" width="100" height="40" fill="#fff"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="13" y="33" width="16" height="38"/>
    <rect x="131" y="33" width="16" height="38"/>
    <rect x="249" y="33" width="16" height="38"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="70" y="56">empty</text><text x="188" y="56">empty</text><text x="306" y="56">empty</text>
  </g>
  <text x="12" y="96" font-size="12" fill="#1d6fd1">blue: 650 bytes of data (du -b counts this)</text>
  <text x="12" y="116" font-size="12" fill="#1f2a44">whole box: 4096 bytes allocated (du counts this)</text>
</svg>
```

The blue strip is drawn to scale: $650 / 4096 \approx 0.16$ of the block.
:::

::: context inode Names, inodes and blocks
A file has three layers. The **name** lives in a folder and points to an **inode**, the file's record card. The inode lists owner, permissions, size and where the data **blocks** are. The link count on the card says how many names point at it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="100" height="36" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="53" font-size="12" text-anchor="middle" fill="#1f2a44">telemetry.log</text>
  <text x="60" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">name (in a folder)</text>
  <line x1="110" y1="48" x2="146" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="150,48 140,43 140,53" fill="#1f2a44"/>
  <rect x="150" y="30" width="90" height="56" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">inode 2</text>
  <text x="195" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">links: 1</text>
  <text x="195" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">record card</text>
  <line x1="240" y1="58" x2="266" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="270,58 260,53 260,63" fill="#1f2a44"/>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="270" y="40" width="24" height="36"/><rect x="298" y="40" width="24" height="36"/><rect x="326" y="40" width="24" height="36"/>
  </g>
  <text x="310" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">data blocks</text>
  <text x="10" y="112" font-size="12" fill="#b4232c">rm removes the name: links drop to 0</text>
  <text x="10" y="132" font-size="12" fill="#1f2a44">blocks are freed only once no process has it open</text>
</svg>
```
:::

::: context loopback Loopback and "any address"
**127.0.0.1** is the **loopback** address: a pretend network that never leaves the machine. Every Linux computer calls itself 127.0.0.1, so a service listening there can only be reached from the same computer. **0.0.0.0** in a listening socket means "every address this machine has", including its real network card.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="14" width="200" height="122" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="250" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">sim01</text>
  <rect x="236" y="48" width="104" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="288" y="67" font-size="11" text-anchor="middle" fill="#1f2a44">127.0.0.1:8080</text>
  <rect x="164" y="92" width="56" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="192" y="111" font-size="11" text-anchor="middle" fill="#1f2a44">curl</text>
  <line x1="220" y1="100" x2="250" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <text x="290" y="112" font-size="11" text-anchor="middle" fill="#1d6fd1">works</text>
  <rect x="10" y="48" width="70" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="67" font-size="11" text-anchor="middle" fill="#1f2a44">laptop</text>
  <line x1="80" y1="63" x2="146" y2="63" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,4"/>
  <text x="113" y="54" font-size="16" text-anchor="middle" fill="#b4232c">×</text>
  <text x="45" y="100" font-size="11" text-anchor="middle" fill="#b4232c">refused</text>
</svg>
```

An SSH tunnel works because the SSH server itself sits on sim01 and connects to 127.0.0.1 from inside.
:::

::: context dns Names into numbers
Computers connect using numeric addresses such as `192.0.2.2`. **DNS**, the Domain Name System, is the internet's phone book: it turns a name like `sim01.example.com` into a number. If the lookup fails, `curl` has no number to dial, so it stops with exit status 6 before sending anything. The name `no-such-host.invalid` in the lesson is safe to use in tests: the ending `.invalid` is reserved by an internet standard (RFC 2606) so that it can never belong to a real machine.
:::

::: context system-call Asking the kernel
A running program lives inside a fence. It can do arithmetic on its own memory, but to open a file, send a network packet, start another program or even print to the screen, it must ask the **kernel** — the core of the operating system, which owns the hardware. Each request is a **system call**, and Linux has a few hundred kinds. Because *every* contact with the outside world passes through this one gate, watching the gate with `strace` shows everything a program does to the machine.
:::

::: context errno-names Where names like ENOENT come from
When a system call fails, the kernel returns a small error number, and the C library stores it in a variable called `errno`. Each number has a short name starting with **E** for "error": `ENOENT` is "error, no entry" (no such file or folder entry), `EACCES` is "access denied", `ENOSPC` is "no space". The same names turn up in Python's `OSError`, in C++ and in `strace`, so learning them once pays off everywhere. `man errno` lists them all.
:::

::: context ring-buffer A diary that overwrites itself
The kernel's log is a **ring buffer**: a fixed amount of memory where, once it is full, each new message overwrites the oldest one, like a loop of tape. On a busy machine, a message from days ago may already be gone. On systemd machines the kernel's messages are also copied into the journal, so `journalctl -k` shows them too — and if the journal is kept on disk, `journalctl -k -b -1` shows the previous boot's, which `dmesg` never can.
:::

::: context exit-128 How the shell reports a killed program
A program that finishes by itself returns a number from 0 to 255 — 0 for success. A program killed by a signal returns nothing, so the shell makes up a status: 128 plus the signal number.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="42" x2="20" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="40" x2="180" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="340" y1="42" x2="340" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <rect x="20" y="28" width="160" height="14" fill="#8fb8f0"/>
  <rect x="180" y="28" width="160" height="14" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="74">0</text><text x="180" y="74">128</text><text x="340" y="74">255</text>
  </g>
  <text x="100" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">program chose it</text>
  <text x="260" y="22" font-size="11" text-anchor="middle" fill="#b4232c">killed by signal N</text>
  <text x="260" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">137 = 128 + 9 · 139 = 128 + 11</text>
</svg>
```

The line is drawn roughly half and half, because 128 is about half of 255.
:::

::: context core-file Why it is called a core dump
In the 1950s and 1960s, computer memory was made of **magnetic cores** — tiny rings of magnetic material threaded on wires, each holding one bit. Memory was simply called "core", and printing it all out after a crash was "dumping core". The hardware is long gone, but the name stuck: a **core file** is still a copy of a program's memory at the moment it died, and `gdb program core` lets you walk around inside it.
:::
