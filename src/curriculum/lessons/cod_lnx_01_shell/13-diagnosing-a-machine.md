---
id: l13-diagnosing-a-machine
title: Diagnosing a machine — disk, network, syscalls, kernel
minutes: 23
covers:
  - df du lsblk ip ss curl strace lsof dmesg
---

Something has gone wrong on a machine you do not administer. The campaign stopped at case 312, or the licence server is "unreachable", or a binary that worked yesterday now exits immediately with no message. The person who can answer those in ten minutes is not cleverer than the person who cannot; she has nine commands and knows which one to reach for.

They divide by the question they answer. *Is there room?* — `df`, `du`, `lsblk`. *Is the network the problem?* — `ip`, `ss`, `curl`. *What is the program actually doing?* — `strace`, `lsof`. *What did the kernel notice?* — `dmesg`. This lesson takes them in that order, with real failures triggered on purpose.

All output below was produced on this machine and pasted verbatim: Ubuntu 24.04.4 with kernel 6.18.44, GNU coreutils 9.4 (`df`, `du`), util-linux `lsblk`, iproute2 6.1.0 (`ip`, `ss`), curl 8.5.0, strace 6.8, lsof 4.95.0. Sizes, addresses, PIDs and timestamps are specific to this machine. The disk-full and out-of-memory failures were produced inside small, deliberately created containers — a one-megabyte tmpfs and a 64-megabyte memory limit — so that they are real failures that could not damage anything.

## Is there room? `df`, `du`, `lsblk`

`df` reports free space **per filesystem**. `-h` makes it readable, and giving it a path tells you about the filesystem that path is on, which is what you almost always want:

```bash
df -h .
```

```text
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           7.9G  2.0M  7.9G   1% /home
```

Note what that just told you: the current directory is on a **tmpfs**, which lives in RAM and does not survive a reboot. `df -h` on its own lists everything, and reading the "Mounted on" column is how you discover that `/home` and `/` are different devices — so cleaning up `/tmp` does nothing for a full home directory.

`du` reports space **used by files**, recursively:

```bash
du -sh runs telemetry configs
```

```text
2.0M	runs
24K	telemetry
8.0K	configs
```

`-s` summarises rather than listing every subdirectory, `-h` is human units. The idiom for "what is eating the disk" is one level at a time, sorted:

```bash
du -h --max-depth=1 . | sort -h
```

```text
8.0K	./configs
24K	./telemetry
2.0M	.
2.0M	./runs
```

`sort -h` understands `K`, `M` and `G` (lesson 06). Run it, `cd` into the biggest entry, run it again; three or four rounds find any runaway directory on any machine.

::: warning
`du` and `df` measure different things and disagree for two distinct reasons, and confusing them wastes hours.

**Blocks versus bytes.** `du` counts allocated blocks by default, and a file smaller than a block still occupies one:

```bash
du -sh . ; du -sb .
```

```text
2.0M	.
337551	.
```

Two megabytes allocated for 338 kilobytes of content — because 500 log files of about 630 bytes each occupy a 4 KiB block apiece. `du -sb` (`--bytes`, which implies `--apparent-size`) gives the content size. On a directory of many small files the two differ by a factor of six, as here.

**Deleted files that are still open.** A file whose last name is removed keeps its blocks until every process that has it open closes it. Here a writer holds a 6 MB file on an 8 MB filesystem, and the file is then deleted:

```bash
rm /mnt/small/telemetry.log
df -h /mnt/small; du -sh /mnt/small
```

```text
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           8.0M  6.0M  2.0M  75% /mnt/small
0	/mnt/small
```

`du` says the directory is empty. `df` says 6 MB are in use. Both are right: `du` walks names, `df` asks the filesystem. This is the single most common "the disk is full and there is nothing on it" situation, and it is invariably a log file that was deleted while a service still had it open.

`lsof +L1` lists every open file with a link count below one — that is, every deleted-but-open file on the machine:

```text
python3   16660     root    3w   REG   0,63  6291456     0       2 /mnt/small/telemetry.log (deleted)
```

There is the culprit, with its PID and its size. Restarting that process — or asking it to reopen its log — releases the space immediately; there is nothing to delete, because it is already deleted. `ls -l /proc/16660/fd` shows the same thing from the other side, as a symlink marked `(deleted)`.
:::

`lsblk` shows the block devices themselves, which is the layer below filesystems:

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

`RO` marks read-only devices, `TYPE` distinguishes `disk`, `part` and `lvm`, and an empty `MOUNTPOINTS` means the device is there and not mounted — which is the answer when a data disk "disappeared". `lsblk -f` adds the filesystem type, label and how full each one is.

One more failure mode `df -h` will not show you: **running out of inodes**. A filesystem with free space but no free inodes refuses to create files, with the same `ENOSPC` error.

```bash
df -i /mnt/small
```

```text
Filesystem      Inodes IUsed   IFree IUse% Mounted on
tmpfs          2060247     1 2060246    1% /mnt/small
```

Check `df -i` whenever "No space left on device" appears and `df -h` looks fine. A campaign that writes several small files per case is exactly the workload that exhausts inodes first.

::: example What a full filesystem actually looks like
An eight-hour job that fails at 3 a.m. leaves you this, and nothing else. Here, deliberately, on a one-megabyte tmpfs created for the purpose:

```bash
dd if=/dev/zero of=big.bin bs=64k count=32
```

```text
17+0 records in
16+0 records out
1048576 bytes (1.0 MB, 1.0 MiB) copied, 0.000536503 s, 2.0 GB/s
```

The filesystem is now exactly full — `df -h` reports `1.0M 1.0M 0 100%`. The next write fails:

```bash
dd if=/dev/zero of=big2.bin bs=64k count=64
```

```text
dd: error writing 'big2.bin': No space left on device
1+0 records in
0+0 records out
0 bytes copied, 4.5599e-05 s, 0.0 kB/s
```

"No space left on device" is the `ENOSPC` error, and you will see it from every program — Python's `OSError`, a C++ `ofstream` that silently sets `badbit`, a solver that writes a truncated output file and carries on. Note the last line of `ls -l`: `big2.bin` exists, with size 0. A failed write usually leaves a partial or empty file behind, so "the output file is there" is not evidence that the run succeeded.

Three things to check, in order, when you see it: `df -h <the directory>` for space, `df -i <the directory>` for inodes, and `lsof +L1` for deleted-but-open files holding the space that `du` says is free.
:::

## Is it the network? `ip`, `ss`, `curl`

`ip` replaced `ifconfig` and `route`. Three forms cover everyday use:

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

`-br` is brief: interface, state, address. `ip a` without it gives the full detail, and `ip a show eth0` narrows it. The state word is the first thing to read — `DOWN` on the interface you expected to use ends the investigation.

```bash
ip r
```

```text
default via 192.0.2.1 dev eth0
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown
192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.2
```

The routing table. `default via ...` is the gateway — where anything not covered by a more specific route goes. No default route means the machine can reach its own subnet and nothing else, which presents as "DNS is broken" and is not.

`ss` replaced `netstat` and answers "what is listening, and who is connected":

```bash
ss -ltnp | grep -E "2222|8899"
```

```text
LISTEN 0      128        127.0.0.1:2222       0.0.0.0:*    users:(("sshd",pid=25014,fd=4))
LISTEN 0      5          127.0.0.1:8899       0.0.0.0:*    users:(("python3",pid=24049,fd=3))
```

The flags: `-l` listening, `-t` TCP, `-n` numeric (do not resolve names, which is much faster and avoids a DNS hang), `-p` the owning process — which needs root to see other users' processes.

Read the **Local Address** column carefully, because it answers the commonest networking question there is. `127.0.0.1:8899` means the service is bound to loopback and is reachable *only from this machine*; `0.0.0.0:2025` means it accepts connections from anywhere. A service you cannot reach from your laptop, that works fine over SSH, is almost always bound to `127.0.0.1` — and lesson 08's `ssh -L` is the answer.

`ss -tn state established` lists current connections, and `ss -s` gives a one-screen summary of how many sockets exist in each state.

`curl` tests an HTTP service from the command line, and its exit statuses are precise:

```bash
curl -s -o /dev/null -w "http=%{http_code} time=%{time_total}s size=%{size_download}\n" http://127.0.0.1:8899/
```

```text
http=200 time=0.002176s size=40
```

`-o /dev/null` throws the body away and `-w` prints exactly the fields you asked for — the form to use in a health check. Compare the three ways it fails:

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

Three different layers, three different answers. **404** — the network is fine, the server answered, your URL is wrong. **Exit 7** — the name resolved and the machine is reachable, but nothing is listening on that port (or a firewall dropped it). **Exit 6** — DNS failed; nothing was even attempted. Use `-sS` in scripts: `-s` silences the progress meter, `-S` keeps error messages, and without the pair you get either a broken progress bar in your log or no diagnosis at all. `-I` fetches only the headers, and `-v` shows the whole exchange including TLS negotiation.

## What is the program doing? `strace`, `lsof`

`strace` prints every system call a process makes. It turns "it does not work and says nothing" into a transcript.

```bash
strace -e trace=openat cat nosuchfile.yaml
```

```text
openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
openat(AT_FDCWD, "nosuchfile.yaml", O_RDONLY) = -1 ENOENT (No such file or directory)
cat: nosuchfile.yaml: No such file or directory
+++ exited with 1 +++
```

Read a line as *call(arguments) = result*. A negative result is an error and `strace` names it: `ENOENT` no such file, `EACCES` permission denied, `ENOSPC` no space, `ECONNREFUSED` nothing listening. This is the tool for a program that fails without telling you *which* file it wanted — a configuration file, a licence file, a shared library — because the failing `openat` names it exactly.

The flags that matter: `-e trace=openat` (or `file`, `network`, `process`) to cut the noise; `-f` to follow forked children, without which you see nothing from a wrapper script; `-p PID` to attach to something already running; `-o FILE` to write the trace to a file, because it is voluminous; and `-c` for a summary instead of a transcript:

```bash
strace -c ls configs
```

```text
  0.00    0.000000           0         7           openat
------ ----------- ----------- --------- --------- ----------------
100.00    0.000000           0        75         4 total
```

Seventy-five system calls to list a directory, four of which returned errors — and those four are in the "errors" column, which is where you look when a program is slow because it is searching thirty directories for a file that is not there.

`strace` slows the traced process down by a large factor, so it is a diagnostic, not a monitor. Attaching to another user's process needs root, or a relaxed `ptrace_scope`.

`lsof` lists open files — and on Unix that includes sockets, pipes, devices and the program's own binary.

```bash
lsof -p 16660 | grep -E 'COMMAND|telemetry'
```

```text
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
python3 16660 root    3w   REG   0,63  6291456      2 /mnt/small/telemetry.log (deleted)
```

The forms worth remembering: `lsof -p PID` what one process has open; `lsof +D /dir` every process using anything under a directory — which is how you find what is stopping `umount`; `lsof -i :8899` who is using a port; and `lsof +L1` the deleted-but-open files from earlier. Without root you see only your own processes.

## What did the kernel see? `dmesg`

The kernel's ring buffer holds hardware events, driver messages, filesystem errors, and the two kills that a program cannot report itself, because it is not alive afterwards.

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

The bracketed number is seconds since boot, which is useless for correlating with a job's timestamps; `dmesg -T` converts it to wall-clock time. `--level=err,warn` filters by severity. Without root, `dmesg` may be refused outright — `dmesg: read kernel buffer failed: Operation not permitted` — which is a hardening setting, not a broken machine.

::: example The two kills only `dmesg` can explain
**A segmentation fault.** A C program that dereferences a null pointer:

```bash
./sim_crash; echo "exit=$?"
```

```text
about to dereference
Segmentation fault
exit=139
```

139 is 128 + 11, and signal 11 is `SIGSEGV` — lesson 04's arithmetic. The program's own `printf` reached the terminal; the two words after it came from the shell, and are all anyone got about the failure itself. The kernel recorded more:

```bash
dmesg -T | grep sim_crash | tail -2
```

```text
[Tue Sep 22 21:08:28 2026] sim_crash[16870]: segfault at 0 ip 000055815be53170 sp 00007ffe0463dff0 error 6 in sim_crash[1170,55815be53000+1000] likely on CPU 1 (core 1, socket 0)
```

`segfault at 0` is the address the program touched — zero, so a null pointer — and `ip` is the instruction pointer, which `addr2line` can turn into a source line if the binary has symbols. For a solver that dies once in three hundred Monte Carlo cases, that address is often the whole diagnosis: `at 0` is a null pointer, a huge address is usually an uninitialised or overrun pointer.

**The out-of-memory killer.** A Python process allowed 64 MB and asking for more, run as a service so the limit is enforced by its cgroup:

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

`code=killed, signal=KILL` — and the process, killed by `SIGKILL`, had no opportunity to log anything. The reason is in the kernel log:

```bash
dmesg -T | grep -i -e "out of memory" -e "Killed process" | tail -4
```

```text
[Tue Sep 22 21:08:28 2026] Memory cgroup out of memory: Killed process 16914 (python3) total-vm:80648kB, anon-rss:65224kB, file-rss:5308kB, shmem-rss:0kB, UID:0 pgtables:192kB oom_score_adj:0
```

It names the process, and `anon-rss:65224kB` is how much it was actually holding when it died — 65 MB against a 64 MB limit. "Memory cgroup out of memory" means a *limit* was hit, so the machine itself was fine; without "cgroup", the whole machine ran out and the kernel chose a victim.

This is the answer to "my job exited with 137 and wrote nothing". 137 is 128 + 9, `SIGKILL`, and `dmesg` is the only place the reason is recorded.
:::

::: key
`df` asks the filesystem, `du` walks names — they disagree over block allocation and over deleted-but-open files, which `lsof +L1` finds. `df -i` catches inode exhaustion when `df -h` looks fine. `ss -ltnp`'s Local Address column distinguishes `127.0.0.1` (loopback only) from `0.0.0.0` (anywhere). `curl` exit 6 is DNS, 7 is nothing listening, and a 404 means the network was fine. `strace -f -e trace=openat` names the file a silent program could not find. `dmesg` is the only record of a segfault (exit 139) or an OOM kill (exit 137).
:::

## Check yourself

::: check
`df -h /data` says 100% used. `du -sh /data` says 40 GB on a 500 GB filesystem. Explain both numbers and give the command that finds the cause.
:::

::: answer
A process is holding a deleted file open. Removing a name decrements the inode's link count, but the blocks are released only when the count reaches zero *and* no process still has the file open. `du` walks directory entries, so a file with no name is invisible to it; `df` asks the filesystem how many blocks are allocated, and they still are. Hence 40 GB of visible files and a full disk.

`lsof +L1` lists every open file whose link count is below one, with the owning PID, the size and the path marked `(deleted)`. Look for a large one on that filesystem. Restarting the process that holds it, or sending it whatever signal makes it reopen its log, frees the space instantly — there is nothing to delete.

The usual culprit is a log file removed by a cleanup script while a long-running service was still writing to it, which is exactly the situation `logrotate` with `copytruncate` (or a `-F`-aware reader, lesson 02) exists to avoid. Rule out the other cause first: `du -sb` versus `du -sh` distinguishes a block-allocation discrepancy from this one.
:::

::: check
A campaign fails with "No space left on device" but `df -h` shows 60% free on the output filesystem. What else do you check, and why does the workload make it likely?
:::

::: answer
`df -i` on the same filesystem. Inodes are allocated when the filesystem is created, in a fixed number, and each file consumes one regardless of size. Exhausting them produces `ENOSPC` — the same error as a full disk — while `df -h` reports plenty of free blocks.

A Monte Carlo campaign is exactly the workload that hits it: hundreds of thousands of small files, one or several per case, each consuming an inode while using a fraction of a block. Five hundred cases is nothing; a fifty-thousand-case sweep writing four files per case is 200,000 inodes, and a filesystem sized for a handful of large datasets may have been created with fewer.

The fixes are structural rather than clever: write fewer, larger files (one HDF5 or one tar per batch rather than a file per case), archive completed batches with `tar` and delete the originals, or have the filesystem recreated with a higher inode density. Note that you cannot add inodes to an existing ext4 filesystem — it has to be remade.
:::

::: check
A colleague cannot reach a dashboard on `sim01:8080` from her laptop, but `curl http://localhost:8080/` works when she is logged in to `sim01`. Give the command that confirms the cause in one line, and the two possible fixes.
:::

::: answer
`ss -ltnp | grep 8080` on `sim01`. If the Local Address is `127.0.0.1:8080` the service is bound to the loopback interface and, by design, accepts no connection from outside the machine. That is why it works locally and cannot work remotely; no firewall is involved and nothing is broken. A `0.0.0.0:8080` or `*:8080` there would mean it is listening on all interfaces and the problem is elsewhere — a firewall, a route, or the wrong address.

Fix one, and the right one for a dashboard with no authentication: leave it on loopback and tunnel, `ssh -L 8080:127.0.0.1:8080 sim01`, then browse `http://localhost:8080` on the laptop. Fix two: reconfigure the service to bind `0.0.0.0`, which exposes it to everything that can route to the machine and therefore needs a firewall rule and some thought about who may read it.

If `ss` shows nothing at all on 8080, the service is not running — go to `systemctl status` instead.
:::

::: check
A solver prints nothing and exits immediately with status 1. `strace` it and you see `openat(AT_FDCWD, "/opt/sim/etc/vehicle.yaml", O_RDONLY) = -1 ENOENT`. What do you now know, and what do you check next?
:::

::: answer
You know exactly which file it wanted and that it does not exist at that path — which the program itself failed to tell you. `AT_FDCWD` means the path was resolved relative to the current working directory, and since this one is absolute that makes no difference; had it been relative, the working directory would be the next thing to check.

What to check next, in order. Does the file exist at all — `ls -l /opt/sim/etc/vehicle.yaml` — and if not, is it somewhere else because the installation used a different prefix (lesson 11)? If it exists but the trace still says `ENOENT`, look at the whole path with `namei -l /opt/sim/etc/vehicle.yaml`: a missing execute bit on a parent directory produces `EACCES` rather than `ENOENT`, but a broken symlink in the middle of the path produces `ENOENT` for a file you can plainly see. And check whether the program is looking somewhere it was configured to look — an environment variable such as `SIM_ROOT` that is set in your interactive shell and not in the batch environment (lesson 10) is a very common cause of exactly this.

Add `-f` to the `strace` if the solver is started by a wrapper script; without it you trace only the wrapper and see nothing.
:::

::: check
Distinguish exit status 137, 139 and 1 for a simulation binary, and say where you would look for the reason in each case.
:::

::: answer
**137** is 128 + 9, killed by `SIGKILL`. The process had no chance to run any handler or write anything, so its own log ends mid-sentence. Look in `dmesg` for the out-of-memory killer — "Out of memory: Killed process" for the whole machine, "Memory cgroup out of memory" for a limit — and in the scheduler's or container's records for a memory or wall-clock limit. The third possibility is a person who typed `kill -9`.

**139** is 128 + 11, `SIGSEGV`: the program touched memory it may not. Look in `dmesg` for the `segfault at ADDRESS ip ADDRESS` line, which gives the faulting address — `at 0` is a null pointer — and for a core file if `ulimit -c` allowed one, which `gdb` can then read. This is a bug in the program, not in the machine.

**1** is a *chosen* exit status: the program ran, decided it had failed, and returned. Its own output is therefore the authoritative source — stderr, its log file, or `journalctl -u` if it ran as a service. `dmesg` will have nothing to say, because from the kernel's point of view nothing went wrong.

The shape of the rule: 128 + N means something outside the program ended it and the kernel is the witness; a small status means the program ended itself and its own output is the witness.
:::

## Summary

| Command | Answers | Note |
| --- | --- | --- |
| `df -h PATH` | free space on that filesystem | read "Mounted on"; `/home` may not be `/` |
| `df -i PATH` | free inodes | `ENOSPC` with free blocks means this |
| `du -sh`, `du -h --max-depth=1 \| sort -h` | what is using the space | walk down one level at a time |
| `du -sb` vs `du -sh` | apparent bytes vs allocated blocks | many small files differ by a large factor |
| `lsof +L1` | deleted-but-open files | the cause of "full disk, nothing on it" |
| `lsblk`, `lsblk -f` | devices, types, mountpoints, filling | an empty mountpoint means it is not mounted |
| `No space left on device` | `ENOSPC` | a zero-length output file is often left behind |
| `ip -br a`, `ip a show DEV`, `ip r` | interfaces, addresses, routes | no default route looks like broken DNS |
| `ss -ltnp` | what is listening and whose it is | `127.0.0.1` is loopback only, `0.0.0.0` is everywhere |
| `curl -sS -o /dev/null -w '%{http_code}'` | a scriptable health check | `-s` hides progress, `-S` keeps errors |
| curl exit 6 / 7 / a 404 | DNS failed / nothing listening / the URL is wrong | three different layers |
| `strace -f -e trace=openat -p PID` | which file it wanted | the result is the error name: `ENOENT`, `EACCES` |
| `strace -c` | syscall counts and errors | the errors column finds a search that is failing |
| `lsof -p PID`, `+D dir`, `-i :PORT` | open files, who blocks an unmount, who holds a port | sockets are files too |
| `dmesg -T`, `--level=err,warn` | the kernel's record | `-T` for wall-clock; needs root on hardened systems |
| `segfault at 0 ... ip ...` | a null-pointer dereference | pairs with exit 139 |
| `Memory cgroup out of memory: Killed process` | the OOM killer | pairs with exit 137, `code=killed, signal=KILL` |

Lesson 14 is the last piece of survival equipment: enough `vim` to edit a configuration file on a machine that has nothing else, and to get out again.
