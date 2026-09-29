---
id: l05-attaching-and-core-dumps
title: Attaching to a running program, and reading core dumps
minutes: 25
covers:
  - Attaching to a running process; gdb -p
  - 'Core dumps: ulimit -c unlimited, gdb ./bin ./core, thread apply all bt'
---

Imagine two phone calls to a car mechanic. In the first, a friend says: "My car is stuck in the driveway with the engine running, and it will not move. Can you come over?" The mechanic walks up to the car while it is still running, opens the hood, and looks at what is happening right now. In the second call, the friend says: "My car broke down on the highway and was towed away, but the tow driver took a detailed photo of the whole engine at the moment it stopped." The mechanic cannot touch that car any more, but the photo shows every part exactly as it was when things went wrong.

Real bugs arrive in both ways. Until now you started every program inside gdb with `run`. But the programs that matter most were usually started by someone else: a flight software process launched at boot, a six-hour simulation, a frozen ground-station service. Some are still running but stuck. Others have already crashed and are gone.

This lesson covers both. **Attaching** means pointing gdb at a process that is already running, freezing it, and inspecting it without restarting it. A **core dump** is the photo: a file the operating system writes when a program crashes, holding the program's memory and registers at the moment of the crash. You can open that file in gdb hours or weeks later, on another computer, and use `bt`, `frame` and `print` as if the program had just stopped.

## Attaching: walking up to a running program

Every running program on Linux is a **process** with a number, its **[[process ID|pid]]** (PID). To attach, you give gdb the PID:

```text
$ pgrep -a frames
19812 ./frames
$ gdb -p 19812
```

`pgrep -a frames` lists matching processes with their PIDs. `gdb -p 19812` (read "gdb dash p") attaches to process 19812. So do `gdb ./frames 19812` and, inside gdb, `attach 19812`.

When gdb attaches, three things happen.

1. The process **stops**, every thread of it, wherever it happened to be. It is frozen for as long as gdb holds it at the prompt.
2. gdb reads the program file for its debug information: line numbers and names if it was built with `-g`, only addresses and `??` if not.
3. You are at the `(gdb)` prompt with the full toolkit: `bt`, `frame`, `info locals`, `print`, breakpoints.

When you are done, **`detach`** lets go, and the process carries on as if nothing had happened. Typing `quit` also detaches, after asking you to confirm. Detaching does not kill the program, which is the whole point: you looked without disturbing it more than a pause.

::: key
gdb -p PID attaches to a running process and stops it where it is; the full toolkit (bt, frame, info locals, print) works as if you had started it under gdb. detach lets it run on, unchanged.
:::

### Permission to attach

Attaching uses a Linux feature called **[[ptrace|ptrace]]**, which lets one process control another. Because that is powerful, Linux limits it. You can only attach to processes that belong to your own user, unless you are root. Many distributions, Ubuntu among them, go further with a security module called Yama: by default a process may only attach to its own children. Then `gdb -p` fails with a message ending in `ptrace: Operation not permitted.` The usual answers are to run `sudo gdb -p PID`, or to start the program under gdb in the first place. The current rule is in `/proc/sys/kernel/yama/ptrace_scope`, where `0` is the classic "any process of the same user" and `1` is "only descendants".

::: warning Attaching freezes the process
While gdb holds a process at the prompt, it does nothing at all. A control loop that is supposed to run 100 times a second runs zero times. On a test bench that can trip a **[[watchdog|watchdog]]**, starve a motor controller of commands, or make other processes think this one has died. Attach to a real-time process only when stopping it is safe, get what you need quickly, and detach. If you only need a snapshot, the `gcore` command at the end of this lesson takes one in a moment and lets the process run on.
:::

::: example A program that never finishes
A telemetry tool should process 300 frames and exit in about a third of a second. Instead it runs forever. It is not crashing, and it prints nothing. Here is the loop at its heart, lines 13 to 17 of `frames.cpp`:

```cpp
int main(int argc, char** argv) {
    int n_frames = (argc > 1) ? std::atoi(argv[1]) : 300;
    for (std::uint8_t frame = 0; frame < n_frames; frame++) {
        process_frame(frame);
    }
```

With the program already running, attach and look (long library lines trimmed to `...`):

```text
$ gdb -q -p 19812
Attaching to process 19812
0x00007fcd9a0eca7a in __GI___clock_nanosleep (...) at ../sysdeps/unix/sysv/linux/clock_nanosleep.c:78
(gdb) bt
#0  0x00007fcd9a0eca7a in __GI___clock_nanosleep (...)
#1  0x00007fcd9a0f9a27 in __GI___nanosleep (...)
#2  0x00007fcd9a12975c in usleep (useconds=<optimized out>) at ../sysdeps/posix/usleep.c:31
#3  0x00005562240681cb in process_frame (frame=236) at frames.cpp:10
#4  0x0000556224068215 in main (argc=1, argv=0x7ffd23178158) at frames.cpp:16
(gdb) frame 4
#4  0x0000556224068215 in main (argc=1, argv=0x7ffd23178158) at frames.cpp:16
16	        process_frame(frame);
(gdb) info locals
frame = 236 '\354'
n_frames = 300
(gdb) ptype frame
type = unsigned char
(gdb) print n_frames
$1 = 300
(gdb) print checksum
$2 = 177183
(gdb) detach
[Inferior 1 (process 19812) detached]
```

Read it step by step.

The process was caught inside `usleep`, a C library sleep, three frames below our code. A program that sleeps a lot is usually caught sleeping. `frame 4` jumps straight to `main`.

`frame = 236` and `n_frames = 300`. So far that looks healthy. Then `ptype frame` says `unsigned char`: `std::uint8_t` is a one-byte type, which holds only $0$ to $255$. (gdb even shows the byte as a character, `'\354'`, which is 236 written in octal.)

Now the reasoning. When `frame` is $255$ and the loop does `frame++`, the value wraps around to $0$. So `frame < 300` is true for every value `frame` can ever hold, and the loop never ends.

The global `checksum` confirms it. If only 300 frames had run, it could be at most $0.5 \times (0 + 1 + \dots + 299) = 0.5 \times 44{,}850 = 22{,}425$. It reads $177{,}183$, about eight times more. Each full trip through $0$ to $255$ adds $0.5 \times 32{,}640 = 16{,}320$, so the counter has wrapped around about $177{,}183 / 16{,}320 \approx 10.9$ times.

The fix is one word: make `frame` an `int`. And after `detach`, the process was still running, so nothing was lost by looking.
:::

## Many threads: thread apply all bt

A program with several **threads** (several flows of execution sharing one memory) has several call stacks, one per thread. `bt` shows only the current thread's. When a multithreaded program hangs, you need them all.

- **`info threads`** lists every thread, with a gdb number, and marks the current one with `*`.
- **`thread 3`** makes thread 3 current, so `bt`, `frame` and `print` apply to it.
- **`thread apply all bt`** runs `bt` in every thread, one after another. `thread apply all bt 8` limits each backtrace to its 8 innermost frames. You can apply other commands too: `thread apply 2 3 info locals`.

The classic use is a **deadlock**: two or more threads each waiting forever for something another one holds. Nothing crashes. The program stops making progress and the CPU sits idle, and one command shows why.

::: example Finding a deadlock in a hung flight process
A small flight process runs two threads. Navigation locks the IMU data, then the GPS data. Telemetry locks the GPS data, then the IMU data. Each lock is a `std::mutex`, a lock that only one thread can hold at a time.

```cpp
std::mutex imu_lock;     // guards the IMU sample
std::mutex gps_lock;     // guards the GPS fix

void navigation() {
    for (;;) {
        std::lock_guard<std::mutex> a(imu_lock);    // line 11
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
        std::lock_guard<std::mutex> b(gps_lock);    // line 13
    }
}

void telemetry() {
    for (;;) {
        std::lock_guard<std::mutex> a(gps_lock);    // line 19
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
        std::lock_guard<std::mutex> b(imu_lock);    // line 21
    }
}
```

It printed `flight loop running` and then went silent. Attach and ask every thread where it is (trimmed to the frames that matter):

```text
$ gdb -q -p 20210
(gdb) info threads
  Id   Target Id                                    Frame
* 1    Thread 0x7fee4da8c740 (LWP 20210) "deadlock" __futex_abstimed_wait_common64 (...)
  2    Thread 0x7fee4cbfe6c0 (LWP 20213) "deadlock" futex_wait (... <imu_lock>) ...
  3    Thread 0x7fee4d3ff6c0 (LWP 20212) "deadlock" futex_wait (... <gps_lock>) ...
(gdb) thread apply all bt 8

Thread 3 (Thread 0x7fee4d3ff6c0 (LWP 20212) "deadlock"):
#0  futex_wait (private=0, expected=2, futex_word=0x5649b1994080 <gps_lock>) at ...
#3  ___pthread_mutex_lock (mutex=0x5649b1994080 <gps_lock>) at ./nptl/pthread_mutex_lock.c:93
#5  0x00005649b199063a in std::mutex::lock (this=0x5649b1994080 <gps_lock>) at ...
#7  0x00005649b1990362 in navigation () at deadlock.cpp:13

Thread 2 (Thread 0x7fee4cbfe6c0 (LWP 20213) "deadlock"):
#0  futex_wait (private=0, expected=2, futex_word=0x5649b1994040 <imu_lock>) at ...
#3  ___pthread_mutex_lock (mutex=0x5649b1994040 <imu_lock>) at ./nptl/pthread_mutex_lock.c:93
#5  0x00005649b199063a in std::mutex::lock (this=0x5649b1994040 <imu_lock>) at ...
#7  0x00005649b199041c in telemetry () at deadlock.cpp:21

Thread 1 (Thread 0x7fee4da8c740 (LWP 20210) "deadlock"):
#4  0x00007fee4d8ece33 in std::thread::join() () from /lib/x86_64-linux-gnu/libstdc++.so.6
#5  0x00005649b19904cb in main () at deadlock.cpp:29
(gdb) print imu_lock._M_mutex.__data.__owner
$1 = 20212
(gdb) print gps_lock._M_mutex.__data.__owner
$2 = 20213
```

Now read the story out of it, one thread at a time.

Thread 1 is `main`, waiting in `join()` for the other threads to finish. That is expected, and harmless.

Thread 3 is in `navigation()` at line 13, stuck inside `std::mutex::lock` on `gps_lock`. So navigation is waiting for the GPS lock. Since line 13 comes after line 11, it already holds the IMU lock.

Thread 2 is in `telemetry()` at line 21, stuck locking `imu_lock`. It already holds the GPS lock from line 19.

The last two prints confirm it from the locks' side. A Linux mutex records the thread number (the **[[LWP|lwp]]**) of its owner. `imu_lock` is owned by 20212, which is thread 3, navigation. `gps_lock` is owned by 20213, which is thread 2, telemetry.

So navigation holds IMU and waits for GPS, while telemetry holds GPS and waits for IMU. That is a cycle, and neither thread can ever move. The fix is to take both locks in one consistent order everywhere, or to take them together with `std::scoped_lock both(imu_lock, gps_lock);`, which is guaranteed not to deadlock no matter which order other threads name them in.


:::

::: key
thread apply all bt prints the backtrace of every thread. For a hang, it shows what each thread is blocked on; a deadlock appears as a cycle of threads each waiting for a lock another one holds.
:::

## Core dumps: the photograph of a crash

When a program does something forbidden, such as reading memory at address zero, the operating system stops it with a **signal**, a message from the kernel. For a bad memory access that signal is `SIGSEGV`, the **segmentation fault**. Before the process disappears, the kernel can write out a **core dump**, or core file: a copy of the process's memory, all its registers, and the state of every thread, at the exact instant of the fault.

Load the core file into gdb together with the program file, and gdb shows you the dead program as if it had stopped at a breakpoint on the faulting instruction. The name is old: early computers stored memory on tiny magnetic rings called **[[cores|core-memory]]**, and "dumping core" meant printing all of it out.

Two settings decide whether a core file appears.

**The size limit.** Each shell has a limit on how big a core file its programs may write, and on many systems that limit is $0$, meaning "write nothing". The command `ulimit -c` shows it; `ulimit -c unlimited` removes it. The limit belongs to that shell and to the programs it starts from then on, so run it in the same terminal where you will reproduce the crash. It does not change other terminals or programs started earlier. (Programs started by systemd take their limit from the service file instead, through the `LimitCORE=` setting.)

**Where the file goes.** The kernel reads the name for the core file from `/proc/sys/kernel/core_pattern`. If that holds a plain name such as `core`, the file lands in the crashing program's working directory, which must be writable. Patterns can include codes: `%e` for the program name, `%p` for its PID, `%t` for the time, so `core.%e.%p` gives files like `core.sensors.19891`. If the pattern starts with `|`, the kernel hands the core to a **[[collector program|core-collectors]]** instead of writing a file. On many desktop Linux systems that is `systemd-coredump` (you then list crashes with `coredumpctl list` and open one with `coredumpctl debug`), or Ubuntu's `apport`.

::: key
ulimit -c unlimited (and a writable core_pattern), reproduce the crash, then `gdb ./binary ./core`. The process is frozen at the fault, so bt and locals are available with no rerun.
:::

::: example From a core file to the root-cause line
A small program converts raw sensor counts into engineering units by looking the sensor up in a table. It works for `baro` and `imu_x`, but a user reports that it dies on `gps`. Here is the code, with line numbers counted from the `#include` lines:

```cpp
Sensor* find_sensor(const char* name) {                  // line 15
    for (Sensor& s : table) {
        if (std::strcmp(s.name, name) == 0) return &s;
    }
    return nullptr;                      // not found
}

double convert(const char* name, int counts) {           // line 22
    Sensor* s = find_sensor(name);
    return counts * s->scale;            // line 24
}

int main(int argc, char** argv) {
    const char* name = (argc > 1) ? argv[1] : "baro";
    std::printf("%s = %.3f\n", name, convert(name, 400));  // line 29
    return 0;
}
```

**Step 1: turn on core dumps and reproduce.**

```text
$ ulimit -c unlimited
$ ./sensors gps
Segmentation fault (core dumped)
$ ls -l core
-rw------- 1 root root 327680 Sep 27 02:56 core
```

The shell's words `(core dumped)` confirm the file was written: here about $320\,\mathrm{KiB}$, in the working directory.

**Step 2: open it with the matching program file.**

```text
$ gdb -q ./sensors ./core
Reading symbols from ./sensors...
Core was generated by `./sensors gps'.
Program terminated with signal SIGSEGV, Segmentation fault.
#0  0x000055d3fabc020a in convert (name=0x7fffba52f1e0 "gps", counts=400) at sensors.cpp:24
24	    return counts * s->scale;            // line 24
```

Before you type anything, gdb has told you the command line, the signal, the faulting function with its arguments, and the source line.

**Step 3: inspect.**

```text
(gdb) bt
#0  0x000055d3fabc020a in convert (name=0x7fffba52f1e0 "gps", counts=400) at sensors.cpp:24
#1  0x000055d3fabc0254 in main (argc=2, argv=0x7fffba52d4e8) at sensors.cpp:29
(gdb) frame 0
#0  0x000055d3fabc020a in convert (name=0x7fffba52f1e0 "gps", counts=400) at sensors.cpp:24
24	    return counts * s->scale;            // line 24
(gdb) print s
$1 = (Sensor *) 0x0
(gdb) print *s
Cannot access memory at address 0x0
(gdb) print $_siginfo._sifields._sigfault.si_addr
$2 = (void *) 0x8
(gdb) print &((Sensor*)0)->scale
$3 = (double *) 0x8
```

**Step 4: write down the four facts.**

- The faulting frame: frame 0, `convert` at `sensors.cpp:24`.
- The pointer that was dereferenced: `s`, whose value is `0x0`, a null pointer.
- The call path: `main` (line 29) called `convert("gps", 400)`, which called `find_sensor("gps")`. That returned `nullptr`, because `gps` is not in the table. `convert` then used the pointer without checking it.
- The one-line fix: check the pointer before using it. For example `if (s == nullptr) return NAN;` just before line 24, or better, have the caller report "unknown sensor".

The `si_addr` line is a nice cross-check. `$_siginfo` is the signal's own report, saved in the core, and `si_addr` is the address the CPU was refused. It says `0x8`, not `0x0`. Why? `s->scale` does not read address `s`. It reads address `s` plus the offset of `scale` inside a `Sensor`. The struct starts with an 8-byte pointer (`name`), so `scale` sits 8 bytes in. The last print computes exactly that offset. A fault address that is a small number, like `0x8` or `0x10`, almost always means "a field of a null pointer".

No rerun, no print statements, no guessing: the core held everything.
:::

::: warning The core must match the exact binary
A core file holds memory, not code or debug information. gdb takes those from the program file you give it. If you rebuild the program, even from the same source with a different flag, the addresses change, and gdb will show wrong lines or nonsense without always warning you. Keep the exact binary that crashed, and its debug information, next to the core. Also remember that a core holds everything that was in memory, including any keys or passwords, so treat core files from real systems as sensitive.
:::

## When the shipped binary has no symbols

Flight and production builds are usually **stripped**: the debug information is removed to save space, so the file on the vehicle has only machine code. Open a core from such a binary and you get addresses and question marks:

```text
$ gdb -q -batch -ex bt ./sensors ./core
#0  0x0000556d78b320bf in ?? ()
#1  0x00007f96cb62a1ca in __libc_start_call_main (...) at ../sysdeps/nptl/libc_start_call_main.h:58
#2  0x00007f96cb62a28b in __libc_start_main_impl (...) at ../csu/libc-start.c:360
#3  0x0000556d78b32105 in ?? ()
```

The standard answer is to build **once**, with `-g`, and split the result into two files: the stripped program that ships, and a debug file that stays on the ground in the release archive.

```text
$ g++ -g -O2 -o sensors sensors.cpp
$ objcopy --only-keep-debug sensors sensors.debug
$ strip --strip-debug --strip-unneeded sensors
$ objcopy --add-gnu-debuglink=sensors.debug sensors
```

The first `objcopy` copies the debug information out into `sensors.debug`. `strip` removes it from `sensors`. The last line writes a small note into `sensors` saying "my debug information is in a file called `sensors.debug`". Both files carry the same **[[build ID|build-id]]**, a fingerprint of the build, so gdb can tell whether they belong together.

Put the debug file next to the program when you analyze, and the same core file suddenly makes sense:

```text
$ gdb -q -batch -ex bt ./sensors ./core
#0  0x0000557149e9a0bf in convert (counts=<optimized out>, name=<optimized out>) at sensors.cpp:24
#1  main (argc=<optimized out>, argv=<optimized out>) at sensors.cpp:29
```

The words `<optimized out>` are there because this build used `-O2`: the compiler kept those values in registers and reused the registers, so they no longer exist at the moment of the crash. The line numbers, which matter most, survived. In an optimized core, `info registers` and `x/i $pc` from lesson 03 fill the gaps.

This is why a flight software team archives the unstripped binaries or debug files for every release it ships. A core that comes back from a vehicle months later is only readable against the exact build that produced it.

::: key
To debug a process on a flight computer you cannot rebuild: attach with gdbserver over the network, or capture a core dump and analyze it offline against the same build artifacts (unstripped binary and symbol files, archived per release).
:::

## Taking a core without a crash

Sometimes you want the photo of a program that is hung but not dead, so that you can study it at leisure while the real process is restarted. Two ways:

- From the shell, `gcore PID` attaches, writes `core.PID`, and detaches. The process keeps running.
- From inside an attached gdb session, `generate-core-file hang.core` (short `gcore hang.core`) does the same.

```text
(gdb) generate-core-file hang.core
Saved corefile hang.core
(gdb) detach
[Inferior 1 (process 20210) detached]
```

Opening `gdb ./deadlock hang.core` later gives the same `thread apply all bt` picture as the live session. The hang is now a file for the bug report, and the service can be restarted straight away.

## Check yourself

::: check
A ground-station service has used 0 percent CPU for ten minutes and answers no requests. You know its PID is 4417, and it was built with `-g`. Write the commands to find out what every thread is doing, and to leave the service running afterwards.
:::

::: answer
`gdb -p 4417` to attach (this stops it). Then `info threads` to list the threads and `thread apply all bt` to see every thread's call stack. If the threads are all inside lock functions such as `pthread_mutex_lock`, check which locks they wait on and who owns them, looking for a cycle. Optionally `generate-core-file` to keep a copy. Finally `detach`, which releases the process so it runs on exactly as before.
:::

::: check
You type `gdb -p 4417` and get `ptrace: Operation not permitted.` The process belongs to your own user. What is the likely reason, and two ways around it?
:::

::: answer
The Yama security setting is limiting ptrace to a process's own descendants (`/proc/sys/kernel/yama/ptrace_scope` is `1`), and the service is not a child of your gdb. You can attach as root with `sudo gdb -p 4417`, or start the program under gdb yourself (`gdb --args ./service ...` then `run`) so gdb is its parent.
:::

::: check
In a new terminal you run `./sim`, and it crashes with `Segmentation fault`, but without `(core dumped)`, and there is no core file. Name two reasons, and what to check for each.
:::

::: answer
First, the core size limit may be 0: `ulimit -c` prints `0`. Run `ulimit -c unlimited` in that same shell, then reproduce. Second, `core_pattern` may not produce a file where you are looking: `cat /proc/sys/kernel/core_pattern`. If it starts with `|`, a collector such as systemd-coredump took it (`coredumpctl list`). If it is a plain name, the file lands in the program's working directory, which must be writable.
:::

::: check
A core shows `Program terminated with signal SIGSEGV`, frame 0 on the line `return p->velocity[2];`, and `$_siginfo._sifields._sigfault.si_addr` is `0x28`. What is the most likely value of `p`, and why is the fault address not zero?
:::

::: answer
`p` is most likely `nullptr` (confirm with `print p`). The CPU was asked to read `p` plus the offset of `velocity[2]` inside the struct, so with `p` equal to 0 the address it was refused is that offset itself, `0x28` = 40 bytes. For example, if `velocity` is an array of doubles starting 24 bytes into the struct, element 2 is at $24 + 2 \times 8 = 40$. A small fault address almost always means a field of a null pointer.
:::

::: check
Your team's flight build is stripped. A core comes back from a test campaign, and `bt` shows only `??`. What should have been kept at release time, and how does gdb use it?
:::

::: answer
The debug information for that exact build, either the unstripped binary or a separate debug file made with `objcopy --only-keep-debug`, archived with the release. Given the stripped binary with a debuglink, and the debug file beside it (or the unstripped binary itself), gdb matches them by build ID and turns the core's addresses back into function names, source lines and variables. A rebuild later will not do, because its addresses and build ID differ.
:::

## Summary

| Command or idea | What it does | Remember |
|---|---|---|
| `gdb -p PID` | attach to a running process | it stops until you `detach` |
| `detach` | let go; the process runs on | `quit` detaches too |
| `info threads`, `thread N` | list threads, pick one | the current thread has `*` |
| `thread apply all bt` | every thread's call stack | a deadlock shows as a cycle |
| `ulimit -c unlimited` | allow core files in this shell | per shell, from now on |
| `/proc/sys/kernel/core_pattern` | where cores go | a leading pipe sends it to a collector |
| `gdb ./bin ./core` | open a crash photo | same binary, same build |
| `$_siginfo` | the fault's own report | small `si_addr`: field of null |
| `objcopy --only-keep-debug` | split off debug info | archive it for every release |
| `gcore PID` | take a core, keep running | good for hangs |

The next lesson makes gdb more comfortable for everyday work (a screen view of the source, a startup file, and pretty-printers that show `std::vector` and matrices readably), and then reaches further: debugging a program on another computer with gdbserver, and running a program backwards to find who changed a value.

::: context pid A number for every running program
The kernel gives each process a number when it starts, and that number stays the same until the process ends. `pgrep NAME` finds processes by name, `ps aux` lists them all, and `pidof NAME` is another way to look one up. Numbers get reused after a process exits, so look the PID up right before you attach, not from yesterday's notes. The PID also appears in core file names when the pattern contains `%p`.
:::

::: context ptrace The system call behind every debugger
`ptrace` ("process trace") is the Linux system call that lets one process stop another, read and write its memory and registers, and resume it one instruction at a time. gdb, `strace` and many other tools are built on it. Anything that can do that could also steal secrets from the traced process, which is why Linux restricts who may call it on whom. A process can be traced by only one tracer at a time, so if something else, such as `strace`, is already attached, gdb cannot attach as well.
:::

::: context watchdog A timer that must keep being reset
A watchdog is a hardware or software timer that the flight software has to "pet" regularly, for example every 100 ms. If the software ever stops petting it, the watchdog decides the computer has hung and resets it, or switches to a backup. That is a safety feature, and it makes no difference whether the software stopped because of a bug or because you attached a debugger. On benches, teams often disable the watchdog or lengthen its timeout during debugging sessions for exactly this reason, and turn it back on afterwards.
:::

::: context lwp One number per thread
To the Linux kernel, a thread is a "light-weight process", LWP for short, and each one gets its own number from the same pool as PIDs. The main thread's LWP equals the PID of the process (here 20210). gdb shows each thread's LWP, and tools like `top -H` and `ps -L` show the same numbers. That is why the mutex's `__owner` field, which stores the owning thread's LWP, can be matched to a line of `info threads`. The `__owner` field is a detail of the GNU C library on Linux, useful in a pinch but not something your program should rely on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="60" width="110" height="46" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="75" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">navigation</text>
  <text x="75" y="97" font-size="11" fill="#1f2a44" text-anchor="middle">LWP 20212</text>
  <rect x="230" y="60" width="110" height="46" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="285" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">telemetry</text>
  <text x="285" y="97" font-size="11" fill="#1f2a44" text-anchor="middle">LWP 20213</text>
  <rect x="140" y="10" width="80" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">imu_lock</text>
  <rect x="140" y="126" width="80" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="146" font-size="12" fill="#1f2a44" text-anchor="middle">gps_lock</text>
  <line x1="100" y1="60" x2="140" y2="30" stroke="#1d6fd1" stroke-width="2"/>
  <text x="62" y="40" font-size="11" fill="#1d6fd1">holds</text>
  <line x1="220" y1="30" x2="262" y2="60" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="262" y="40" font-size="11" fill="#b4232c">waits</text>
  <line x1="260" y1="106" x2="220" y2="136" stroke="#1d6fd1" stroke-width="2"/>
  <text x="262" y="134" font-size="11" fill="#1d6fd1">holds</text>
  <line x1="140" y1="136" x2="100" y2="106" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="62" y="134" font-size="11" fill="#b4232c">waits</text>
</svg>
```
:::

::: context core-memory Why it is called core
From the 1950s into the 1970s, most computer memory was magnetic core memory: a grid of tiny ferrite rings threaded on wires, each ring storing one bit by the direction it was magnetized. Memory was "core", and printing all of it out after a crash was a "core dump". The rings are long gone, but the name stuck, in the file name `core` and in phrases like "dumped core". The Apollo Guidance Computer used magnetic cores too, both for its erasable memory and, in a different woven form called core rope, for its fixed program.
:::

::: context core-collectors Where cores go on a modern desktop
A core file from a large program can be gigabytes, and a crashing program might be restarted and crash again every second. So desktop Linux systems usually pipe cores to a service instead of dropping files everywhere. `systemd-coredump` stores them compressed, keeps only a limited amount, and logs each crash; `coredumpctl list` shows the crashes and `coredumpctl debug` opens the latest one in gdb. Ubuntu's `apport` collects crash reports for bug reporting. Embedded flight computers usually have neither, and teams decide deliberately where a core goes, how big it may be, and how it gets back to the ground.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="45" width="80" height="30" rx="4" fill="#ffffff" stroke="#b4232c"/>
  <text x="50" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">crash</text>
  <line x1="90" y1="60" x2="120" y2="60" stroke="#1f2a44"/>
  <rect x="120" y="45" width="100" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="64" font-size="11" fill="#1f2a44" text-anchor="middle">core_pattern</text>
  <line x1="220" y1="55" x2="245" y2="30" stroke="#1f2a44"/>
  <line x1="220" y1="65" x2="245" y2="90" stroke="#1f2a44"/>
  <rect x="245" y="15" width="110" height="30" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="300" y="34" font-size="11" fill="#1f2a44" text-anchor="middle">file: core.%e.%p</text>
  <rect x="245" y="75" width="110" height="30" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="300" y="94" font-size="11" fill="#1f2a44" text-anchor="middle">| collector</text>
</svg>
```
:::

::: context build-id A fingerprint for each build
The linker can write a build ID into every executable: a hash (a long hexadecimal number) computed from the program's contents. GCC on most Linux distributions turns it on by default. `readelf -n sensors` prints it; in the build above both files showed `7bcca481ab8b40450e645c4b33e7e432456254e9`. Core files record the build IDs of the program and libraries that were loaded, so gdb and tools like `debuginfod` can find exactly the matching debug files, and refuse ones that do not match. It is the software version of a part's serial number.
:::
