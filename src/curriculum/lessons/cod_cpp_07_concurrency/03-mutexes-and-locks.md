---
id: l03-mutexes-and-locks
title: Mutexes and lock guards
minutes: 28
covers:
  - mutex, lock_guard, unique_lock, scoped_lock, shared_mutex, recursive_mutex
---

Some gas stations have one restroom and one key, chained to a big wooden paddle. If the key is on the hook, you take it, go in, and bring it back when you are done. If someone else has it, you wait. Nobody opens the door on somebody else, because there is only one key.

That paddle is a **mutex**, short for **mutual exclusion**: an object that at most one thread can hold at a time. A thread **locks** it before touching shared data and **unlocks** it afterwards. A second thread that tries to lock it while it is held waits until it is free. Everything between the lock and the unlock is called a **[[critical section|critical-section]]**: code only one thread can be in at once.

Last lesson ended with two broken programs — a counter that lost counts and a power budget that went to −40 W — and promised that the mutex fixes both. On a vehicle, mutexes guard the data several tasks share: the navigation state, a command queue, a log buffer. This lesson covers the six names in the standard library's locking toolbox, what each is for, and what locking costs, measured on one machine.

## std::mutex, the key on the hook

`std::mutex` lives in `<mutex>`. Its three member functions:

- `lock()`: take the mutex, waiting as long as necessary.
- `unlock()`: give it back. Only the thread that locked it may unlock it.
- `try_lock()`: take it if it is free right now and return `true`; otherwise return `false` at once, without waiting.

A `std::mutex` is 40 bytes on this Linux machine. It cannot be copied or moved — a copy of the key would defeat the point — so it usually lives as a member next to the data it protects, or as a global.

The rule that makes a mutex work is a promise *you* keep: **every access to the shared data, reads as well as writes, happens while holding the same mutex**. The mutex does not know which data it guards, so keep the data and its mutex together, in one class with the data private.

It buys two things. **Mutual exclusion**: no two threads are in the critical section together, so load-add-store sequences can no longer interleave. And **ordering**: unlocking a mutex *happens before* the next lock of that same mutex, so what one thread wrote inside is visible to the next thread inside. That is the synchronisation last lesson said was missing: no data race, defined behaviour again.

::: key
Unlocking a mutex happens before the next lock of the same mutex, so every write made while holding it is visible to the next thread that locks it. Every access to the protected data, reads included, must hold the same mutex.
:::

You could call `lock()` and `unlock()` by hand. You should not. Here is why:

```cpp
void add_sample(double x) {
    g_mutex.lock();
    if (x != x) return;              // NaN check: returns with the mutex still locked
    g_sum += x;
    g_mutex.unlock();
}
```

(`x != x` is true only for a NaN, "not a number".) The early `return` skips the `unlock()`. The mutex stays locked forever, and the next thread that calls `add_sample` waits forever. An exception thrown between the two calls does the same. You met this exact trap in the RAII module.

## lock_guard: RAII for a mutex

In the RAII module you wrote `MutexLock`: a class whose constructor calls `lock()` and whose destructor calls `unlock()`, so the mutex is released on every way out of the scope. The standard library ships the same class as **`std::lock_guard`**. Read `std::lock_guard<std::mutex> lock(m);` aloud as "a lock guard of mutex, named lock, on m".

- It locks in the constructor and unlocks in the destructor, and does nothing else.
- It cannot be copied or moved, and it cannot unlock early.
- It holds one reference to the mutex: 8 bytes, and after optimisation, no cost beyond the `lock()` and `unlock()` it calls.

Since C++17 the compiler can work out the template argument from the constructor, so `std::lock_guard lock(m);` means the same thing. That feature is **[[class template argument deduction|ctad]]**.

::: example Fixing the counter
```cpp
#include <cstdio>
#include <mutex>
#include <thread>

long g_frames = 0;
std::mutex g_frames_mutex;            // guards g_frames

void count_frames(int n) {
    for (int i = 0; i < n; ++i) {
        std::lock_guard<std::mutex> lock(g_frames_mutex);   // lock
        ++g_frames;
    }                                                        // unlock
}

int main() {
    std::thread a(count_frames, 1'000'000);
    std::thread b(count_frames, 1'000'000);
    a.join();
    b.join();
    std::printf("frames = %ld (expected 2000000)\n", g_frames);
}
```

Three runs at `-O2` each printed `frames = 2000000 (expected 2000000)`, and so did a build with `-fsanitize=thread`, which exited with status 0 and no report.

Step by step: each pass creates `lock`, which locks `g_frames_mutex`. `++g_frames` runs with the mutex held, so the other thread cannot be between its load and its store. At the closing brace `lock` is destroyed and unlocks. Two million increments, none lost.

Sanity check: the right answer now comes from the rules, not from timing luck — and TSan agrees.
:::

The same tool fixes last lesson's power budget, where every access was locked but "check, then act" was two separate locked steps. The fix is to put the whole decision under one lock:

```cpp
bool try_take(int w) {                  // check AND act under one lock
    std::lock_guard<std::mutex> lock(m_);
    if (watts_ < w) return false;
    watts_ -= w;
    return true;
}
```

With `switch_on` calling `try_take`, six runs printed `heater on (80 W)`, `radio refused`, `budget left: 20 W`. If the radio thread had won the race to the lock, it would have been `radio on (60 W)`, `heater refused`, 40 W left. Either way, the budget never goes negative.

::: warning The lock protects code, not data
A guard protects only what happens inside its scope. It leaks two ways: a function that returns a pointer or reference to the protected data hands out access that outlives the lock; and a guard with no name, `std::lock_guard<std::mutex>{m};`, is a temporary that unlocks at the semicolon, as the RAII module showed. Return copies, and always name the guard.
:::

::: warning Keep critical sections short
While one thread holds a mutex, every thread that wants it waits. So copy the shared data out, unlock, then compute with the copy. Never do I/O, sleep or wait for another thread while holding a lock that a control task needs.
:::

## unique_lock: the flexible one

**`std::unique_lock`** is a lock guard with more controls. It still unlocks in its destructor if it owns the lock. But it also keeps a flag saying whether it currently owns the lock, and so it can:

- **lock later**: construct with `std::defer_lock` and it takes nothing until you call `lock()`;
- **lock only if free**: construct with `std::try_to_lock`, then ask `owns_lock()`;
- **wait with a limit**: with a `std::timed_mutex`, a variant of mutex that can give up, pass a duration and it tries for at most that long;
- **unlock early** with `unlock()`, and lock again with `lock()`;
- **move**: ownership of a held lock can be handed to another `std::unique_lock`, for instance returned from a function.

The flag and a pointer make it 16 bytes against the lock guard's 8. The extra freedom is extra room for mistakes, so use `std::lock_guard` unless you need one of these powers.

::: example Four things a unique_lock can do
```cpp
#include <chrono>
#include <cstdio>
#include <mutex>
#include <thread>

using namespace std::chrono_literals;

std::timed_mutex g_bus;     // a mutex that can also wait with a time limit

std::unique_lock<std::timed_mutex> claim_bus() {
    std::unique_lock<std::timed_mutex> lk(g_bus);   // locks now
    std::puts("bus claimed");
    return lk;                                      // ownership moves out
}

int main() {
    // 1. Movable: the lock taken inside claim_bus() is still held here.
    std::unique_lock<std::timed_mutex> held = claim_bus();
    std::printf("main owns the lock: %d\n", held.owns_lock());

    // 2. Timed: another thread gives up after 20 ms instead of waiting forever.
    std::thread other([] {
        std::unique_lock<std::timed_mutex> lk(g_bus, 20ms);  // try_lock_for
        std::printf("other thread got the bus within 20 ms: %d\n", lk.owns_lock());
    });
    other.join();

    // 3. Unlock early, before the end of the scope.
    held.unlock();
    std::printf("after unlock(), owns: %d\n", held.owns_lock());

    // 4. Deferred: make the lock object now, lock it later.
    std::unique_lock<std::timed_mutex> later(g_bus, std::defer_lock);
    std::printf("deferred, owns: %d\n", later.owns_lock());
    later.lock();
    std::printf("after lock(), owns: %d\n", later.owns_lock());
}   // 'later' unlocks here; 'held' owns nothing, so it does nothing
```

It printed:

```text
bus claimed
main owns the lock: 1
other thread got the bus within 20 ms: 0
after unlock(), owns: 0
deferred, owns: 0
after lock(), owns: 1
```

Walk through it. `claim_bus` locks `g_bus` and returns the `std::unique_lock` by value; ownership moves into `held`, so the mutex stays locked across the return — impossible with a lock guard. The other thread tries for up to 20 ms, fails because `main` holds the bus, and reports `0` instead of hanging. `held.unlock()` releases early. `later` is built unlocked, locked by hand, and unlocks itself at the closing brace; `held` owns nothing by then.

Sanity check: the one failure, the timed attempt, happened exactly while `main` held the lock, and a TSan build ran clean.
:::

The biggest reason `std::unique_lock` exists is not in that list. A **condition variable**, the tool for "sleep until another thread says the data is ready", must unlock the mutex while it sleeps and relock it when it wakes, so it takes a `std::unique_lock`. That is lesson 05.

::: key
`std::lock_guard`: locks for exactly one scope, cannot unlock early or move. `std::unique_lock`: can defer, try, time out, unlock early and move; it is the lock a condition variable requires.
:::

## scoped_lock: several mutexes at once

Sometimes one operation needs two locks. Moving propellant between two tank records must change both, and each tank has its own mutex. Locking them one after the other opens the door to **deadlock**: one thread holds tank A's mutex and waits for B's, while another holds B's and waits for A's, and both wait forever. Lesson 04 takes deadlock apart.

C++17's **`std::scoped_lock`** takes any number of mutexes and locks them all, using a **[[deadlock-avoidance algorithm|try-and-back-off]]**, so it never ends up holding some while waiting forever for the rest. It unlocks them all in its destructor.

::: example Two tanks, two threads, opposite directions
```cpp
#include <cstdio>
#include <mutex>
#include <thread>

struct Tank {
    std::mutex m;
    double kg;
};

// Move propellant from one tank's account to another's.
void transfer(Tank& from, Tank& to, double kg) {
    std::scoped_lock lock(from.m, to.m);   // both mutexes, or neither
    from.kg -= kg;
    to.kg += kg;
}

int main() {
    Tank left{{}, 1000.0}, right{{}, 1000.0};
    std::thread a([&] { for (int i = 0; i < 100'000; ++i) transfer(left, right, 0.001); });
    std::thread b([&] { for (int i = 0; i < 100'000; ++i) transfer(right, left, 0.001); });
    a.join();
    b.join();
    std::printf("left %.1f kg, right %.1f kg, total %.1f kg\n",
                left.kg, right.kg, left.kg + right.kg);
}
```

Every run printed:

```text
left 1000.0 kg, right 1000.0 kg, total 2000.0 kg
```

Thread `a` moves $100{,}000 \times 0.001 = 100$ kg from left to right and thread `b` moves 100 kg back, so each tank ends where it began. The two threads lock the same pair in opposite orders — the classic recipe for deadlock — and it never hung, because `std::scoped_lock` takes the pair as one step. A TSan build ran clean.

Sanity check: the total must be conserved whatever the interleaving, because each transfer subtracts and adds the same amount under both locks.
:::

With a single mutex, `std::scoped_lock lock(m);` behaves exactly like a `std::lock_guard`, which is why some teams use `std::scoped_lock` everywhere. One trap: `std::scoped_lock lock;` with no mutex compiles and locks **nothing**. g++'s only hint was `warning: unused variable 'lock' [-Wunused-variable]`.

## shared_mutex: many readers, one writer

Think of an airport departures board. Hundreds of people can read it at once. But while someone updates it, nobody should read a half-changed line. Readers can share; a writer needs the board alone.

That is the **[[readers–writer lock|readers-writers]]**, and in C++17 it is **`std::shared_mutex`**, from `<shared_mutex>`. It has two ways to be held:

- **shared**, through `std::shared_lock`: any number of threads at once, as long as nobody holds it exclusively;
- **exclusive**, through `std::unique_lock` or `std::lock_guard`: one thread, with no readers inside.

A navigation state is the textbook case: written by the estimator 100 times a second, read by guidance, control, telemetry and fault monitoring.

::: example Readers in parallel
```cpp
#include <chrono>
#include <cstdio>
#include <mutex>
#include <shared_mutex>
#include <thread>
#include <vector>

using namespace std::chrono_literals;
using Clock = std::chrono::steady_clock;

struct NavState { double lat_deg, lon_deg, alt_m; };

NavState g_nav{28.5729, -80.6490, 0.0};
std::shared_mutex g_nav_mutex;

NavState read_nav() {
    std::shared_lock<std::shared_mutex> lock(g_nav_mutex);  // shared: readers together
    std::this_thread::sleep_for(50ms);                      // pretend reading takes 50 ms
    return g_nav;
}

void write_nav(const NavState& s) {
    std::unique_lock<std::shared_mutex> lock(g_nav_mutex);  // exclusive: writer alone
    g_nav = s;
}

int main() {
    auto t0 = Clock::now();
    std::vector<std::thread> readers;
    for (int i = 0; i < 4; ++i) readers.emplace_back([] { read_nav(); });
    for (auto& t : readers) t.join();
    auto ms = std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
    std::printf("4 readers, 50 ms each, took %.0f ms in total\n", ms);

    write_nav({28.5729, -80.6490, 1200.0});
    std::printf("altitude after write: %.1f m\n", read_nav().alt_m);
}
```

It printed:

```text
4 readers, 50 ms each, took 50 ms in total
altitude after write: 1200.0 m
```

Then the one word `std::shared_lock` in `read_nav` was changed to `std::unique_lock`, making every reader exclusive. Twice it printed `took 201 ms in total`.

The four readers held the lock together, so four 50 ms reads took 50 ms. Made exclusive, they queued: $4 \times 50 = 200$ ms, plus about a millisecond of start-up. The write then took the lock alone, and the next read saw 1,200 m.

Sanity check: 50 ms is the best possible, all four at once; 200 ms is exactly one after another.
:::

A `std::shared_mutex` is not free. On the same machine, an uncontended shared lock-and-unlock took about 22 ns and an exclusive one about 30 ns, against about 19 ns for a plain `std::mutex`. It pays off only when reads are long or readers many; for a 24-byte `NavState` copied in a few nanoseconds, a plain mutex usually wins. The standard also leaves open whether a waiting writer goes ahead of newly arriving readers, so a design with a flood of readers must make sure it can **[[never starve its writer|writer-starvation]]**.

## recursive_mutex, and why it is usually a smell

What happens if a thread locks a `std::mutex` it already holds? The standard says undefined behaviour. In practice it waits for itself forever. This event log, whose `add_pair` holds the lock and then calls `add`, which locks again:

```cpp
void add(int code) {
    std::lock_guard<std::mutex> lock(m_);
    std::printf("event %d\n", code);
    ++count_;
}
void add_pair(int a, int b) {
    std::lock_guard<std::mutex> lock(m_);   // locked here...
    add(a);                                 // ...and add() locks m_ again
    add(b);
}
```

printed `event 1`, then `calling add_pair`, and then nothing until `timeout` killed it after 3 seconds. A thread deadlocked with itself.

**`std::recursive_mutex`** allows it. It remembers which thread owns it and counts: the owner can lock it again, each `lock()` adds one, each `unlock()` subtracts one, and other threads get in only when the count is back to zero. With it, the event log printed all three events and `done`.

So why not use it everywhere? Because needing it is a sign of a design problem. A mutex protects an **[[invariant|invariant]]** — a promise about the data, such as "`count_` equals the number of events printed" — that may be half-broken inside a critical section and must hold again at the unlock. A function that locks expects to find the invariant true. With a recursive mutex, `add` can be entered from the middle of `add_pair`, perhaps while the state is half-updated, and nothing warns you. It also hides who really holds the lock, and for how long.

The usual cure is to split each operation in two: a public function that locks, and a private one that assumes the lock is held.

```cpp
void add(int code) {
    std::lock_guard<std::mutex> lock(m_);
    add_locked(code);
}
void add_pair(int a, int b) {
    std::lock_guard<std::mutex> lock(m_);   // one lock for the whole pair
    add_locked(a);
    add_locked(b);
}
void add_locked(int code) {                 // private; caller must hold m_
    std::printf("event %d\n", code);
    ++count_;
}
```

It printed `event 1`, `calling add_pair`, `event 2`, `event 3`, `done`, with a plain `std::mutex`, and the pair is still logged under one lock, so no other thread's event can land between 2 and 3.

::: warning A recursive mutex does not prevent deadlock between threads
Re-locking is allowed only for the thread that already owns the mutex. Two *different* threads that each hold one recursive mutex and want the other's are exactly as stuck as with plain mutexes. The cure for that is a consistent lock order or `std::scoped_lock`, which is next lesson.
:::

::: key
`std::shared_mutex`: many readers share (`std::shared_lock`), one writer excludes (`std::unique_lock`). `std::recursive_mutex`: the owning thread may lock again, counted; needing it usually means a function that locks is being called from inside a locked region — split it into a locking public function and a private `_locked` helper.
:::

## What a lock really costs

"Locks are slow" is often said. Here is a measurement.

::: example Timing a lock, honestly
```cpp
#include <chrono>
#include <cstdio>
#include <mutex>
#include <thread>
#include <vector>

std::mutex m;
volatile long sink = 0;   // volatile: stops the compiler deleting the loop

template <class F>
double ns_per_call(F body, long n) {
    auto t0 = std::chrono::steady_clock::now();
    for (long i = 0; i < n; ++i) body();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration<double, std::nano>(t1 - t0).count() / n;
}

void locked_add() { std::lock_guard<std::mutex> lock(m); sink = sink + 1; }

int main() {
    const long n = 20'000'000;
    std::printf("1. no lock:                   %5.1f ns\n",
                ns_per_call([] { sink = sink + 1; }, n));
    std::printf("2. lock, one-thread process:  %5.1f ns\n", ns_per_call(locked_add, n));

    std::thread([] {}).join();          // now the process has had a second thread
    std::printf("3. lock, uncontended:         %5.1f ns\n", ns_per_call(locked_add, n));

    std::vector<std::thread> ts;        // 4. four threads fight over m
    auto t0 = std::chrono::steady_clock::now();
    for (int k = 0; k < 4; ++k)
        ts.emplace_back([n] { for (long i = 0; i < n / 4; ++i) locked_add(); });
    for (auto& t : ts) t.join();
    auto t1 = std::chrono::steady_clock::now();
    std::printf("4. lock, 4 threads contending: %5.1f ns\n",
                std::chrono::duration<double, std::nano>(t1 - t0).count() / n);
}
```

On one machine (4 cores, `nproc` prints 4, g++ 13 at `-O2`), one run printed:

```text
1. no lock:                     2.3 ns
2. lock, one-thread process:    7.2 ns
3. lock, uncontended:          19.0 ns
4. lock, 4 threads contending:  72.1 ns
```

Five runs agreed within about 10 percent; yours will differ.

Line 1 is the baseline: the volatile read and write alone. Line 3 is the honest **uncontended** cost — no other thread wants the lock — in a program that has threads: $19.0 - 2.3 = 16.7$ ns for one lock-and-unlock pair.

Line 2 is the trap. It is measured before any second thread existed, and glibc, the C library, skips the expensive **[[atomic instruction|atomic-instruction]]** a lock needs while the process has only ever had one thread. A benchmark with no threads flatters the mutex by a factor of about three.

Line 4 is **contended**: four threads that each want the lock constantly. Each increment costs about 72 ns of elapsed time, $72.1 / 19.0 \approx 3.8$ times slower than one thread doing all the work alone, because the threads spend their time handing the lock between cores and sleeping and waking.

Sanity check: 16.7 ns at the processor's rated 2.1 GHz is about 35 clock cycles, the right size for a couple of atomic instructions and a function call or two.
:::

What does that mean for a control task? A 1 kHz loop has 1,000,000 ns per cycle. A hundred uncontended lock pairs cost about $100 \times 16.7 = 1670$ ns, about 0.17 percent of it. An **uncontended** mutex is cheap enough for flight code. The danger is **waiting**: a control task that finds the lock held waits as long as the holder keeps it, and if the holder is a low-priority task that gets pre-empted, that can be a very long time. That is **[[priority inversion|pathfinder-bridge]]**, the bug that kept resetting Mars Pathfinder, and it has a lesson of its own later in this module.

::: key
On one machine, an uncontended `std::mutex` lock-and-unlock cost about 17 ns; contended, the same work was about four times slower than one thread alone. The cost that matters for a control task is not the lock instruction but the waiting: keep critical sections short and keep low-priority work out of locks a control task needs.
:::

## Check yourself

::: check
A telemetry thread reads `g_nav.alt_m` without locking, "because it only reads", while the estimator writes `g_nav` under `g_nav_mutex`. Is that safe? Explain in terms of last lesson's definition.
:::

::: answer
No. Same memory location, one access a write, and the reader holds no lock, so nothing orders them: a data race, undefined behaviour. A mutex only orders threads that lock it. The reader must lock the same mutex — a `std::lock_guard`, or a `std::shared_lock` if `g_nav_mutex` is a `std::shared_mutex` — and ideally copy the state out and unlock at once.
:::

::: check
Which lock type fits each job? (a) Protect a counter for one statement. (b) Lock two queues' mutexes to move a message between them. (c) Hold a lock that a condition variable will release while waiting. (d) Try to get a bus for at most 5 ms and report a fault if not. (e) Let four monitoring tasks read the navigation state together while the estimator writes it now and then.
:::

::: answer
(a) `std::lock_guard` (or `std::scoped_lock` with one mutex): lock for one scope, nothing more. (b) `std::scoped_lock lock(q1.m, q2.m);`: takes both as one step, avoiding deadlock. (c) `std::unique_lock`: the condition variable must be able to unlock and relock it. (d) `std::timed_mutex` with `std::unique_lock<std::timed_mutex> lk(bus, 5ms);` then check `lk.owns_lock()`. (e) `std::shared_mutex`, with `std::shared_lock` for the four readers and `std::unique_lock` for the estimator.
:::

::: check
`void log(const char* s) { g_m.lock(); if (!s) throw std::invalid_argument("null"); write(s); g_m.unlock(); }` What goes wrong on a null pointer, and how does `std::lock_guard` fix it?
:::

::: answer
The `throw` skips `g_m.unlock()`, so the mutex stays locked and every later call to `log` waits forever. With `std::lock_guard<std::mutex> lock(g_m);` in place of the manual `lock()`, the guard's destructor runs during stack unwinding and unlocks the mutex on the exception path too — the same guarantee as the RAII module's `MutexLock`.
:::

::: check
A class method `update()` locks the class's `std::mutex` and calls `validate()`, which also locks it. The program hangs. A colleague proposes `std::recursive_mutex`. What is the better fix, and why?
:::

::: answer
The thread is waiting for a mutex it already holds. `std::recursive_mutex` would stop the hang, but would let `validate()` run while `update()` may have the data half-changed. Better: move the body of `validate()` into a private `validate_locked()` that assumes the mutex is held; the public `validate()` locks and calls it, and `update()` calls `validate_locked()` directly under its own lock. Each public entry point then locks exactly once.
:::

::: check
Someone benchmarks `std::mutex` in a single-threaded test program and reports 5 ns per lock-and-unlock, so "locking is nearly free". What did the measurement miss, and what should they measure?
:::

::: answer
In a process that has never had a second thread, glibc skips the atomic instruction a lock needs, so the number is too low: on one machine, about 7 ns in a one-thread process but 19 ns once a second thread had existed. Measure in a program with real threads, measure contention separately (four threads on one mutex were about 3.8 times slower in total than one alone), and for a control task measure the worst-case wait, not the average.
:::

## Summary

| Idea | Meaning | Rule or fact |
| --- | --- | --- |
| `std::mutex` | at most one holder at a time | `lock`, `unlock`, `try_lock`; not copyable; relocking by the owner is undefined |
| Happens-before | unlock, then the next lock of the same mutex | writes made under the lock are visible to the next holder |
| `std::lock_guard` | the standard `MutexLock` | locks for one scope; 8 bytes; cannot unlock early or move |
| `std::unique_lock` | a lock guard with an ownership flag | defer, try, timed, unlock early, movable; used by condition variables |
| `std::scoped_lock` | C++17, any number of mutexes | locks all with deadlock avoidance; `std::scoped_lock lock;` locks nothing |
| `std::shared_mutex` | readers share, writer excludes | `std::shared_lock` to read, `std::unique_lock` to write |
| `std::recursive_mutex` | owner may lock again, counted | usually a design smell; split into public and `_locked` functions |
| Lock cost | measured on one 4-core machine | about 17 ns uncontended; about 3.8 times slower in total under 4-way contention |

Every lock type here holds at most the mutexes you name, and `std::scoped_lock` was the only one that took several safely. Next lesson shows what happens when threads take several mutexes one at a time: deadlock, its four conditions, and the lock-ordering discipline that rules it out.

::: context critical-section Where the phrase comes from
"Critical section" and "mutual exclusion" come from the early days of operating systems in the 1960s. Edsger Dijkstra's 1965 paper on the problem asked how several processes could share data so that only one at a time was inside the part of its program that touched it — its critical section — using nothing but ordinary reads and writes. His solution was intricate, which is exactly why every modern processor now provides special atomic instructions and every operating system provides a mutex built on them: nobody should have to solve that puzzle again in application code.
:::

::: context ctad Letting the compiler fill in the angle brackets
Before C++17, a class template's arguments had to be written out: `std::lock_guard<std::mutex>`. Function templates never needed that, because the compiler deduced their arguments from the call. C++17 extended the same deduction to constructors of class templates, so `std::lock_guard lock(m);` works out `std::mutex` from the type of `m`. It is called class template argument deduction, and it is what makes `std::scoped_lock lock(a, b);` pleasant to write — and what makes `std::scoped_lock lock;` deduce an empty list of mutexes without complaint.
:::

::: context try-and-back-off How several locks are taken safely
The standard says only that `std::scoped_lock` and `std::lock` use "a deadlock avoidance algorithm", and names try-and-back-off as one. It works like this: lock the first mutex, waiting if needed, then `try_lock` each of the others. If any is taken, unlock everything already held, and start again — often beginning with the mutex that was busy. A thread never sits waiting while holding one lock and wanting another, which is exactly the situation deadlock needs. Lesson 04 names that situation "hold and wait" and shows the other ways to break it.
:::

::: context readers-writers An old problem with a famous name
The readers–writers problem was posed in a 1971 paper, "Concurrent control with 'readers' and 'writers'", by P. J. Courtois, F. Heymans and D. L. Parnas. They gave two solutions, one favouring readers and one favouring writers, and the question of whom to favour has never gone away. The same idea lives on in databases (shared and exclusive locks), in file systems, and in operating-system kernels, which often use a variant called read-copy-update so that readers take no lock at all.
:::

::: context writer-starvation When the writer never gets a turn
Picture readers arriving continuously, each overlapping the one before. A reader–writer lock that always admits new readers while any reader is inside never reaches a moment with zero readers, so a waiting writer waits forever. That is **writer starvation**. Some implementations stop admitting new readers once a writer is waiting, which fixes it but can delay readers. The C++ standard does not say which policy `std::shared_mutex` uses. On a spacecraft, a navigation state that stops being updated because the readers never pause is as bad as one that is never read, so a design with many readers checks its implementation, or avoids the lock with double buffering.
:::

::: context invariant The promise a lock keeps
An **invariant** is a statement about the data that is true whenever no thread is inside the critical section. In the event log it is "`count_` equals the number of events printed". Between printing and `++count_` it is briefly false, and that is allowed, because the lock hides the moment:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="100" y="36" width="160" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <text x="180" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">inside the lock</text>
  <text x="60" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">invariant true</text>
  <text x="300" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">invariant true</text>
  <text x="180" y="84" font-size="11" text-anchor="middle" fill="#b4232c">may be broken here</text>
  <line x1="100" y1="70" x2="100" y2="96" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="260" y1="70" x2="260" y2="96" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <text x="100" y="106" font-size="11" text-anchor="middle" fill="#6c7a93">lock</text>
  <text x="260" y="106" font-size="11" text-anchor="middle" fill="#6c7a93">unlock</text>
</svg>
```

A recursive lock lets a function that expects the invariant true start inside the orange stretch, where it may not be.
:::

::: context atomic-instruction How a mutex is built on Linux
Locking an uncontended mutex does not involve the operating system at all. The mutex is a word in memory. `lock()` uses one **atomic compare-and-exchange** instruction — "if the word is 0, make it 1, and tell me whether it worked" — which the processor performs as one indivisible step, even with other cores watching. Only if the word was already 1 does the thread ask the kernel to put it to sleep, with a system call named `futex`, short for "fast user-space mutex":

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="14" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="33" font-size="11" text-anchor="middle" fill="#1f2a44">lock(): CAS 0 to 1</text>
  <line x1="150" y1="44" x2="80" y2="84" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="210" y1="44" x2="280" y2="84" stroke="#b4232c" stroke-width="2"/>
  <text x="95" y="62" font-size="11" text-anchor="middle" fill="#1d6fd1">was 0</text>
  <text x="268" y="62" font-size="11" text-anchor="middle" fill="#b4232c">was taken</text>
  <rect x="20" y="86" width="120" height="44" fill="#fff" stroke="#1d6fd1"/>
  <text x="80" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">got it: stay in</text>
  <text x="80" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">user space, ~17 ns</text>
  <rect x="220" y="86" width="120" height="44" fill="#fff" stroke="#b4232c"/>
  <text x="280" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">futex call: sleep</text>
  <text x="280" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">until unlock wakes</text>
</svg>
```

In glibc 2.39 on this machine, `pthread_mutex_lock` first tests a flag named `__libc_single_threaded` and, while the process has only ever had one thread, uses a plain store instead of the atomic instruction — which is line 2 of the benchmark.
:::

::: context pathfinder-bridge When the lock holder is the least important task
Priority inversion needs three tasks: a high-priority one waiting for a mutex, a low-priority one holding it, and a medium-priority one that pre-empts the holder and so, indirectly, keeps the high-priority task waiting. The mutex itself works perfectly; the scheduling around it is what fails. Real-time operating systems offer mutexes with **priority inheritance**, which lend the holder the waiter's priority for as long as it holds the lock. On Linux that is a mutex attribute, `PTHREAD_PRIO_INHERIT`, which a plain `std::mutex` does not set; the lessons on priority inversion and real-time Linux show how flight code gets it.
:::
