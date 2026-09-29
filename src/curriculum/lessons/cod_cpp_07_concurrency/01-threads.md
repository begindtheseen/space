---
id: l01-threads
title: Processes and threads
minutes: 27
covers:
  - Processes vs threads; std::thread and jthread; join and detach
---

Picture a restaurant kitchen at dinner time. There is one kitchen: one fridge, one set of counters, one rack of knives. Four cooks work in it at once. Each cook follows their own recipe card and is at their own step, but they all reach into the same fridge. If one cook puts the butter back, the others see it. If two cooks grab the same pan at the same moment, there is trouble.

Now picture the restaurant across the street. It has its own kitchen. Nothing its cooks do changes a thing in yours. To pass them a message you have to walk over and hand it through the door.

That is the whole difference between the two ideas of this lesson. The restaurant is a **process**; each cook is a **thread**. A flight computer runs several threads inside one process all the time: a control loop that runs 1,000 times a second, a thread that packs telemetry for the radio, a thread that writes the log, a thread that talks to the star tracker. They share memory, which makes them fast to coordinate, and that sharing is also where every hard bug in this module comes from.

In the last module you met `std::thread` as one line in the C++11 list, with a warning attached: flight software creates its threads once, at start-up, and keeps `std::thread` out of its control tasks. This lesson does threads properly: what one is, how to start it, how to pass it data, how to finish with it, and the C++20 version that cleans up after itself.

## Processes and threads

A **process** is a running program with its own private memory. When you type `./fork` in a terminal, the operating system creates a process. It gets its own **[[address space|address-space]]** — the whole range of memory addresses the program can use, mapped by the operating system onto real memory chips so that no other process can see into it. It also gets its own open files and its own ID number.

A **thread** is one line of execution inside a process: one "where am I in the code right now" and the scratch space to go with it. Every process starts with one thread, the one that runs `main`. It can start more.

What does each thread own, and what do they share?

| Belongs to | Item | Why |
| --- | --- | --- |
| each thread | its own stack | local variables and function calls of that thread |
| each thread | its own registers and instruction pointer | where it is in the code, what it is computing |
| the whole process | global and static variables | one copy, visible to every thread |
| the whole process | the heap | memory from `new` is reachable from any thread holding the pointer |
| the whole process | the code, open files, the ID | one program, one set of resources |

So two threads in the same process can both read and write the same global variable. Two processes cannot: each has its own copy, and any change stays inside.

The operating system's **[[scheduler|scheduler]]** decides which thread runs on which processor core, and for how long. On four cores, up to four threads truly run at the same instant; with more threads than cores, they take turns. Either way, you do not control the order in which instructions from two threads happen. That one fact drives the rest of this module.

::: key
A process has its own address space; threads inside one process share it. Each thread has its own stack and registers, but globals, the heap, code and open files are shared by every thread in the process.
:::

::: example One global, a thread and a process
This program changes one global variable twice: once from a second thread, once from a second process. `fork()` is the Linux call that copies the running process into a new child process; it returns `0` in the child and the child's ID in the parent. `waitpid` makes the parent wait for the child.

```cpp laptop
#include <cstdio>
#include <sys/wait.h>
#include <thread>
#include <unistd.h>

int g_mode = 0;   // one global variable: "flight mode"

int main() {
    // A second THREAD writes the global.
    std::thread t([] { g_mode = 1; });
    t.join();
    std::printf("after thread:  g_mode = %d\n", g_mode);

    // A second PROCESS writes the global.
    std::fflush(stdout);            // empty the output buffer first (see note)
    pid_t pid = fork();
    if (pid == 0) {                 // this branch runs in the child process
        g_mode = 2;
        std::printf("in child:      g_mode = %d\n", g_mode);
        return 0;
    }
    waitpid(pid, nullptr, 0);       // parent waits for the child to finish
    std::printf("after process: g_mode = %d\n", g_mode);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` and run, it printed:

```text
after thread:  g_mode = 1
in child:      g_mode = 2
after process: g_mode = 1
```

Walk through it. The lambda `[] { g_mode = 1; }` runs on a new thread and writes the global. `t.join()` waits for it to finish. The main thread then sees `1`, because both threads share one `g_mode`.

Then `fork()` makes a child process with a **copy** of everything, including its own `g_mode`. The child sets its copy to `2` and prints it. The parent waits, reads its own `g_mode`, and still sees `1`. The child's write never reached it.

Sanity check: the thread's write showed up and the process's did not, which is exactly the table above. The **[[flush before fork|fork-buffer]]** line matters too: without it, this program printed "after thread" twice when its output went to a file.
:::

Threads are cheaper to start than processes, and much cheaper to talk between, because talking is reading and writing shared memory. That is why flight software is mostly built from threads inside one or a few processes.

## Starting a thread with std::thread

`std::thread` lives in the header `<thread>`. You give its constructor something callable — a function, a lambda, an object with `operator()` — followed by the arguments to call it with:

```cpp
std::thread t(count_samples, 500, std::ref(total));
```

Read it aloud as "a std thread `t`, running `count_samples` with 500 and a reference to `total`". The new thread starts running immediately; there is no separate "start" call. By the time the constructor returns, the new thread may already have finished, or it may not have begun. The scheduler decides.

### Arguments are copied

Here is the rule people trip over. **The constructor copies every argument into storage that belongs to the new thread**, and then calls the function with those copies. It does this even when the function's parameter is a reference.

Why? The new thread may run long after the line that created it. If it held references to the caller's locals and the caller returned, it would be reading dead memory. Copying by default makes the safe thing the easy thing.

When you really do want the thread to use your variable, you say so with **`std::ref`**, from `<functional>`. `std::ref(total)` wraps a reference in a small object that is copied instead, and the wrapped reference comes out the other side still pointing at your `total`. There is also `std::cref` for a `const` reference.

::: example Copying, sharing, and the error when you forget
```cpp laptop
#include <cstdio>
#include <functional>   // std::ref
#include <string>
#include <thread>

void count_samples(int n, int& total) {       // writes through a reference
    for (int i = 0; i < n; ++i) total += 1;
}

void label(std::string name) { std::printf("worker %s\n", name.c_str()); }

int main() {
    int total = 0;
    std::thread a(count_samples, 500, std::ref(total));  // share 'total'
    a.join();
    std::printf("total = %d\n", total);

    std::string who = "imu";
    std::thread b(label, who);   // 'who' is copied into the thread
    who = "changed";             // does not affect the copy b already holds
    b.join();
}
```

It printed:

```text
total = 500
worker imu
```

Step by step. Thread `a` gets a copy of `500` and a reference wrapper around `total`. It adds one 500 times through the reference, so after `join`, `main` sees `total = 500`. Thread `b` gets its own copy of the string `"imu"`, made inside the constructor, before `main` moves on. So `who = "changed"` changes only `main`'s string, and the thread prints `imu`.

Now delete the `std::ref` and write `std::thread a(count_samples, 500, total);`. g++ 13 refuses, and the first error line is:

```text
/usr/include/c++/13/bits/std_thread.h:157:72: error: static assertion failed: std::thread arguments must be invocable after conversion to rvalues
```

Decoded: the thread stored a *copy* of `total` and passes it on as a temporary value (an "rvalue"), and an `int&` parameter cannot bind to a temporary. So the library stops you at compile time, rather than letting your thread count into a copy nobody reads. Sanity check: the error is about exactly the argument whose parameter is a non-`const` reference.
:::

::: warning std::ref hands over a promise
`std::ref(total)` tells the thread "use my variable". You are now promising that `total` stays alive until the thread is done with it, and that no other thread touches `total` at the same time without protection. The second promise is the subject of the next two lessons. The first is easy to break: pass `std::ref` to a local, return from the function, and the thread writes into a stack frame that belongs to someone else now.
:::

A pointer or a lambda capture by reference (`[&]`) makes the same promise with even less typing, so it deserves the same care.

## Join and detach

Once a `std::thread` object is running a thread, you owe a decision about it, and there are exactly two.

- **`join()`**, read "join": wait here until that thread finishes. After `join` returns, everything the thread wrote is visible to you. That is why `main` could safely read `total` and `g_mode` above: the join put the thread's work firmly in the past.
- **`detach()`**, read "detach": cut the thread loose. It keeps running on its own, and the `std::thread` object no longer refers to it. You can never join it again. When `main` returns, the whole process ends, and a detached thread still running is stopped wherever it happens to be.

**`joinable()`** says whether you still owe the decision. It is `true` for a `std::thread` that was started with a function and has not yet been joined or detached. It is `false` after `join()`, after `detach()`, for a default-constructed `std::thread` that never ran anything, and for one whose thread was moved away to another `std::thread` object. Calling `join()` on a thread that is not joinable throws `std::system_error`.

### The rule with teeth

If a `std::thread` is **still joinable when it is destroyed**, its destructor calls **`std::terminate`**, which ends the program at once. The same happens if you assign a new thread into a `std::thread` that is still joinable.

::: example Forgetting to join
```cpp laptop
#include <cstdio>
#include <thread>

void downlink() { std::puts("downlink running"); }

void start_downlink() {
    std::thread t(downlink);
    // forgot t.join() -- t is destroyed at this closing brace
}

int main() {
    start_downlink();
    std::puts("back in main");   // never printed
}
```

It compiles without a warning. Run, it printed:

```text
terminate called without an active exception
```

and then the shell reported `Aborted` and **[[exit status 134|exit-134]]**. Six runs in a row did the same.

Step by step: `start_downlink` creates `t`, which starts the thread. The function reaches its closing brace. `t` is destroyed while still joinable. The destructor calls `std::terminate`; libstdc++'s handler prints the first line (the "without an active exception" part means no exception was in flight — nothing was thrown, the program was ended on purpose). `std::terminate` calls `std::abort`, which kills the process with a signal, and the shell reports `Aborted`. "back in main" never appears.

Did "downlink running" print? Not in these six runs: the process was gone before the new thread reached its `puts`. Elsewhere it might print. Sanity check: that uncertainty is the lesson — whether a thread has run yet is never something to count on.
:::

Why is the rule so harsh? The standard committee had two gentler choices, and **[[both were worse|why-terminate]]**. Terminating makes the mistake impossible to miss on the first test run.

::: key
A `std::thread` must be joined or detached before it is destroyed; destroying a joinable `std::thread` calls `std::terminate`. `join()` waits for the thread and makes its work visible; `detach()` lets it run on alone and can never be undone.
:::

::: example What detach really means
```cpp laptop
#include <chrono>
#include <cstdio>
#include <thread>

using namespace std::chrono_literals;

void logger() {
    for (int i = 1; i <= 10; ++i) {
        std::printf("log line %d\n", i);
        std::this_thread::sleep_for(10ms);
    }
    std::puts("logger finished");   // is this ever printed?
}

int main() {
    std::thread t(logger);
    t.detach();                               // let it run on its own
    std::printf("joinable after detach: %d\n", t.joinable());
    std::this_thread::sleep_for(35ms);
    std::puts("main returns");
}
```

`10ms` is a C++14 **duration literal**, ten milliseconds, from `std::chrono_literals`. Three runs each printed:

```text
joinable after detach: 0
log line 1
log line 2
log line 3
log line 4
main returns
```

The logger prints a line at about 0, 10, 20 and 30 ms. `main` sleeps 35 ms and returns. Returning from `main` ends the process, and the logger is stopped between line 4 and line 5 — it never finishes, never prints "logger finished", and if it had been halfway through writing a file, the file would be left half-written.

Sanity check: one line per 10 ms from 0 to 30 ms makes four lines. The first two output lines could also come out the other way round, since the two threads race to print first.
:::

::: warning Detach is almost never what you want
A detached thread has no owner. Nobody can wait for it, so nobody knows when it is done, and it can keep using globals while the program shuts down and destroys them. Flight code usually has none: every thread is created at start-up and accounted for.
:::

## std::jthread: a thread that cleans up after itself

Adding `t.join()` fixes the terminate example — until something between creating `t` and that line throws or returns early, skipping the join. You met this in the RAII module: a resource released by hand is released only on the paths you remembered. The answer then was a destructor, and it is again.

C++20 added **`std::jthread`**, read "j thread" (the "j" is for joining). It is a `std::thread` with two extras.

1. **Its destructor joins.** If it is still joinable when destroyed, it first asks the thread to stop, then waits for it. No `std::terminate`.
2. **It carries a stop request.** Each `std::jthread` owns a **stop source**, a small shared flag that someone can set to say "please finish". The thread reads it through a **`std::stop_token`**, a read-only view of that flag, from the header `<stop_token>`.

If the function you give a `std::jthread` takes a `std::stop_token` as its *first* parameter, the `std::jthread` passes one in for you. The thread checks `st.stop_requested()` ("st, stop requested?") whenever it is convenient, and returns when the answer is yes. You can ask from outside with `request_stop()`, and the destructor asks for you.

::: example A heartbeat that stops itself
```cpp laptop
#include <chrono>
#include <cstdio>
#include <stop_token>
#include <thread>

using namespace std::chrono_literals;

void heartbeat(std::stop_token st, int period_ms) {
    int beats = 0;
    while (!st.stop_requested()) {
        ++beats;
        std::this_thread::sleep_for(std::chrono::milliseconds(period_ms));
    }
    std::printf("heartbeat stopped after %d beats\n", beats);
}

int main() {
    std::printf("hardware threads: %u\n", std::thread::hardware_concurrency());
    {
        std::jthread hb(heartbeat, 10);     // the stop_token is passed in for us
        std::this_thread::sleep_for(105ms);
        std::puts("leaving scope");
    }   // ~jthread: request_stop(), then join()
    std::puts("joined, back in main");
}
```

Three runs each printed:

```text
hardware threads: 4
leaving scope
heartbeat stopped after 11 beats
joined, back in main
```

Follow the clock. The thread beats at 0, 10, 20, … 100 ms — 11 beats — and sleeps until about 110 ms. Meanwhile `main` wakes at 105 ms, prints "leaving scope", and reaches the closing brace. The `std::jthread` destructor calls `request_stop()` and then `join()`, so `main` waits. At about 110 ms the heartbeat wakes, sees the stop request, prints its count, and returns. The join completes and `main` goes on.

Sanity check: beats every 10 ms from 0 to 100 make 11. If sleeps ran long on a busy machine, 10 is possible; either way the thread finished before "joined" printed.
:::

The stop request is **[[cooperative|cooperative-stop]]**: it sets a flag and nothing more. A thread that never checks its token will never stop, and the destructor's `join()` will wait forever. So a loop that must be stoppable checks its token once per cycle, which for a control loop is once per period.

`std::jthread` is the default choice in new C++20 code. It still offers `join()` and `detach()` by hand; you can no longer forget.

::: key
`std::jthread` (C++20) joins automatically in its destructor, after calling `request_stop()`. A function whose first parameter is a `std::stop_token` receives one, and must check `stop_requested()` itself: stopping is cooperative.
:::

## How many threads?

`std::thread::hardware_concurrency()` returns how many threads the hardware can run truly at the same time — the number of **[[hardware threads|hardware-threads]]**. The standard calls it a hint, and it may return `0` if it cannot tell. On the machine used for this module, a cloud virtual machine with 4 cores, it printed `4`, and the Linux command `nproc` also prints `4`.

Using it well means remembering what extra threads cost. On that same machine, creating an empty thread and joining it took about 40 µs each, averaged over 10,000 tries; it will be different on yours. Forty microseconds is 4 percent of a 1 ms control period, spent before any useful work happens, and its worst case is far longer than its average. That is why flight software [[makes all its threads at initialization|flight-threads]], fixes their number and priorities, and never creates one inside a control cycle.

More threads than cores does not make a program faster: past the core count, threads take turns, and every switch costs time. A ground tool might start `hardware_concurrency()` workers. A flight computer runs exactly as many threads as the design names, and a later lesson shows how to prove they all meet their deadlines.

## Check yourself

::: check
A star-tracker driver thread and the attitude-control thread run in the same process. The driver writes the latest quaternion into a global array. Could the attitude thread read that array directly? What if the driver were moved into a separate process?
:::

::: answer
In the same process, yes: globals live in the shared address space, so both threads see the one array (next lesson shows why they need protection when they do it at the same time). In a separate process, no: the driver would write its own private copy, exactly as the child's `g_mode = 2` never reached the parent. Processes need an explicit channel — a pipe, a socket, a shared-memory region set up on purpose.
:::

::: check
`void scale(std::vector<double>& v, double k);` is started as `std::thread t(scale, samples, 2.0);`. What happens, and what is the fix? What promise does the fix make?
:::

::: answer
It fails to compile: the thread stores a copy of `samples`, the copy is passed as a temporary (an rvalue), and a non-`const` `std::vector<double>&` cannot bind to a temporary, so g++ reports "std::thread arguments must be invocable after conversion to rvalues". The fix is `std::thread t(scale, std::ref(samples), 2.0);`. That promises that `samples` outlives the thread's use of it, and that nothing else touches `samples` while the thread is scaling it unless the access is protected.
:::

::: check
For each `std::thread x`, say whether `x.joinable()` is true: (a) `std::thread x;` (b) `std::thread x(f);` (c) the same after `x.join();` (d) `std::thread x(f); std::thread y = std::move(x);` asked of `x`.
:::

::: answer
(a) false: a default-constructed thread runs nothing. (b) true: it is running (or has run) `f` and has not been joined or detached. (c) false: joined. (d) false for `x`: the running thread moved to `y`, so `x` no longer refers to any thread, and `y.joinable()` is now true. Only `y` must be joined before it is destroyed.
:::

::: check
A function creates `std::thread worker(process_frames);`, then calls `parse_config()`, which throws, and only after that calls `worker.join();`. What happens, and what one-word change fixes it?
:::

::: answer
The exception skips `worker.join()`. As the exception leaves the function, stack unwinding destroys `worker` while it is still joinable, and its destructor calls `std::terminate`: the program aborts instead of reaching the `catch`. Changing `std::thread` to `std::jthread` fixes it, because the `std::jthread` destructor calls `request_stop()` and `join()` during unwinding. (`process_frames` should then take a `std::stop_token` and check it, or the join could wait a long time.)
:::

::: check
A `std::jthread` runs `void telemetry(std::stop_token st)` whose loop is `while (true) { send_frame(); sleep_for(20ms); }`. The program hangs when the `std::jthread` goes out of scope. Why, and what is the fix?
:::

::: answer
The destructor calls `request_stop()` and then `join()`. The request only sets a flag; the loop never reads `st`, so it never ends, and `join()` waits forever. Stopping is cooperative. The fix is to test the token every cycle: `while (!st.stop_requested()) { send_frame(); sleep_for(20ms); }`. The thread then ends within one 20 ms cycle of the request.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| Process | a running program with its own address space | processes see none of each other's memory |
| Thread | one line of execution inside a process | own stack and registers; shares globals, heap, code, files |
| `std::thread t(f, args...)` | start `f(args...)` on a new thread now | arguments are copied into the thread |
| `std::ref(x)`, `std::cref(x)` | pass a reference through the copy | you promise `x` outlives the thread's use |
| `join()` | wait for the thread to finish | afterwards its writes are visible to you |
| `detach()` | let the thread run on alone | cannot be joined again; killed when the process ends |
| `joinable()` | do you still owe join or detach? | destroying a joinable `std::thread` calls `std::terminate` |
| `std::jthread` | C++20 thread that joins itself | destructor: `request_stop()`, then `join()` |
| `std::stop_token` | read-only view of a stop request | cooperative: the thread must check `stop_requested()` |
| `hardware_concurrency()` | how many threads can truly run at once | a hint, may be `0`; printed 4 on a 4-core machine |

Threads share memory, and so far every example was careful to read shared data only after a `join`. Next lesson removes that care, and shows why two threads touching the same variable at the same time is not merely a wrong answer but undefined behavior.

::: context address-space Every process gets its own map of memory
Each process sees addresses from zero up to a huge number, as if it had the machine to itself. The operating system and the processor's memory-management unit translate each of those virtual addresses into a real location in the memory chips, using a separate table per process. Two processes can both use address `0x4010` and mean different bytes. Inside one process, all threads use the same table:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="16" width="200" height="176" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="120" y="12" font-size="11" text-anchor="middle" fill="#1f2a44">one process's address space</text>
  <rect x="30" y="26" width="180" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">code (shared)</text>
  <rect x="30" y="56" width="180" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="73" font-size="11" text-anchor="middle" fill="#1f2a44">globals: g_mode (shared)</text>
  <rect x="30" y="86" width="180" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">heap (shared)</text>
  <rect x="30" y="128" width="85" height="56" fill="#f2b880" stroke="#1f2a44"/>
  <text x="72" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">stack T1</text>
  <rect x="125" y="128" width="85" height="56" fill="#f2b880" stroke="#1f2a44"/>
  <text x="167" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">stack T2</text>
  <text x="235" y="70" font-size="11" fill="#1d6fd1">blue: every thread</text>
  <text x="235" y="86" font-size="11" fill="#1d6fd1">reads and writes it</text>
  <text x="235" y="150" font-size="11" fill="#1f2a44">orange: one per</text>
  <text x="235" y="166" font-size="11" fill="#1f2a44">thread (8 MiB each</text>
  <text x="235" y="182" font-size="11" fill="#1f2a44">here, by default)</text>
</svg>
```

A thread's stack is private by convention, not by lock: a pointer to a local can still be handed to another thread.
:::

::: context scheduler The part of the operating system that hands out cores
The scheduler keeps a list of threads that are ready to run. Many times a second, and whenever a thread blocks or wakes, it picks which ready thread gets each core. On a desktop the aim is fairness: everyone gets a turn. On a real-time system the aim is different: the most urgent thread must run the moment it is ready. The later lessons on real-time scheduling, `SCHED_FIFO` and priority inversion are all about taking control of this choice, because a control loop cannot wait its turn behind a log writer.
:::

::: context fork-buffer Why the line was printed twice
`std::printf` does not write each line straight to the screen. It collects text in a buffer inside the process and writes it out in chunks. When the output goes to a terminal, the buffer is emptied at each newline. When it goes to a file or a pipe, it is emptied only when full or at exit. `fork()` copies the whole process, **including that buffer**, so "after thread" existed in both parent and child, and each one wrote it out when it exited. The `std::fflush(stdout)` empties the buffer before the copy is made. It is a small, vivid proof that a child process gets a copy of everything.
:::

::: context exit-134 Reading an exit status of 134
When a program is killed by a signal, the shell reports its exit status as 128 plus the signal's number. `std::abort` raises `SIGABRT`, which is signal 6 on Linux, so the status is $128 + 6 = 134$. You will meet other members of the family: 139 is 128 + 11, `SIGSEGV`, a segmentation fault, and 137 is 128 + 9, `SIGKILL`, the signal a watchdog or the out-of-memory killer uses. Reading the number tells you how a program died before you read a single log line.
:::

::: context why-terminate Why not join or detach automatically?
When the standard was written, the destructor had two gentler options, and both hide bugs. **Join automatically**: if the thread is waiting for something that will never happen now — the function that would have told it to stop has just thrown — the destructor hangs forever, and a hang is harder to diagnose than a crash. **Detach automatically**: the thread keeps running while the scope that started it has ended, often still using that scope's local variables, which are now dead memory. `std::terminate` turns the mistake into a loud, immediate stop. C++20's `std::jthread` later chose automatic join, but made it safe by adding the stop request first.
:::

::: context cooperative-stop Why a thread cannot be killed from outside
It might seem simpler to let one thread kill another on the spot. Standard C++ offers no way to, on purpose. A thread stopped at an arbitrary instruction might be holding a lock, halfway through updating a data structure, or in the middle of writing a telemetry frame. Killing it leaves the lock held forever and the data half-written. Asking politely and letting the thread stop at a safe point — the top of its loop, between frames — is the only way to guarantee everything is left in a consistent state:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="11" fill="#1f2a44">main</text>
  <line x1="60" y1="26" x2="200" y2="26" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="200" cy="26" r="5" fill="#b4232c"/>
  <text x="200" y="14" font-size="11" text-anchor="middle" fill="#b4232c">request_stop</text>
  <line x1="200" y1="26" x2="270" y2="26" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="235" y="42" font-size="11" text-anchor="middle" fill="#6c7a93">join waits</text>
  <text x="10" y="80" font-size="11" fill="#1f2a44">worker</text>
  <rect x="60" y="70" width="60" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="130" y="70" width="60" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="200" y="70" width="60" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="265" y1="62" x2="265" y2="94" stroke="#1d6fd1" stroke-width="3"/>
  <text x="265" y="110" font-size="11" text-anchor="middle" fill="#1d6fd1">checks token, returns</text>
  <line x1="270" y1="26" x2="340" y2="26" stroke="#1f2a44" stroke-width="2"/>
</svg>
```

The cycle in progress when the request arrives finishes; the next check ends the loop.
:::

::: context hardware-threads Cores and hardware threads
A **core** is one complete processor that runs instructions. Some processors let each core keep two threads loaded at once and interleave them to fill idle moments; Intel calls this Hyper-Threading, and the general name is simultaneous multithreading. Then one core counts as two **hardware threads**. The machine used here has 4 cores and 1 thread per core, so both numbers are 4. Flight processors are often simpler, with a few cores and no multithreading, and real-time designs frequently turn multithreading off because two hardware threads sharing one core slow each other down unpredictably.
:::

::: context flight-threads How flight frameworks organize threads
NASA's open-source flight frameworks both fix their threads at start-up. In the core Flight System (cFS), used on many NASA missions, each application runs as its own task — a thread with a set priority — created when the system boots. In JPL's F Prime, which flew on the Ingenuity Mars helicopter, an **active component** owns a thread and a message queue, and other components talk to it by putting messages on that queue instead of touching its data. Both designs keep the number of threads known and small, which is what makes the timing analysis of later lessons possible.
:::
