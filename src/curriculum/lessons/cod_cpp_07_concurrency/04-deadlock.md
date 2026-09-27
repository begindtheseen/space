---
id: l04-deadlock
title: Deadlock, and how to make it impossible
minutes: 24
covers:
  - "Deadlock: the four conditions, lock ordering, std::lock and scoped_lock"
---

Picture a narrow one-lane bridge with a car driving onto each end at the same moment. They meet in the middle. Neither driver will back up. Each one is waiting for the other to move, and the other is waiting too. Nobody crashed and nothing is broken, yet both cars will sit there until someone outside the situation steps in.

Last lesson gave you the mutex: a lock that lets only one thread at a time into a piece of shared data. One mutex on its own is safe. The trouble starts when a thread needs *two* of them at once. Then the bridge story can happen inside your program: thread 1 holds lock A and waits for lock B, while thread 2 holds lock B and waits for lock A. That standstill is a **deadlock** — a set of threads each waiting for something another thread in the set holds, so none of them can ever continue.

On a spacecraft this is not a slow program; it is a silent one: a navigation task that stops publishing, and eventually a **[[watchdog|watchdog-timer]]** that resets the computer because nothing is answering. This lesson shows a real deadlock, how to read its fingerprints, the four conditions behind it, and the tools that make it impossible by design: a global lock order, `std::lock`, and `std::scoped_lock`.

## A real deadlock, on purpose

Two tasks from a small flight program each need both the navigation state and the telemetry frame. The only difference is the order in which they lock them. The `sleep_for` calls hold each first lock for 50 ms, so the bad timing happens every run instead of once a week.

::: example Two threads, two mutexes, one standstill
```cpp
#include <atomic>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <mutex>
#include <thread>

std::mutex nav_mutex;   // guards the navigation state
std::mutex tlm_mutex;   // guards the telemetry frame
std::atomic<int> finished{0};

void navigation_task() {
    std::lock_guard<std::mutex> a(nav_mutex);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> b(tlm_mutex);   // waits for telemetry_task
    finished.fetch_add(1);
}

void telemetry_task() {
    std::lock_guard<std::mutex> b(tlm_mutex);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> a(nav_mutex);   // waits for navigation_task
    finished.fetch_add(1);
}

int main() {
    std::thread t1(navigation_task);
    std::thread t2(telemetry_task);

    // Watchdog: give the two tasks one second to finish.
    const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(1);
    while (finished.load() < 2 && std::chrono::steady_clock::now() < deadline) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
    if (finished.load() < 2) {
        std::printf("watchdog: %d of 2 tasks finished after 1 s -- deadlock\n", finished.load());
        std::fflush(stdout);
        std::abort();   // stop here so a debugger can look
    }
    t1.join();
    t2.join();
    std::printf("both tasks finished\n");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2 -pthread deadlock.cpp` and run, it prints one line after one second and then aborts (exit status 134):

```text
watchdog: 0 of 2 tasks finished after 1 s -- deadlock
```

Step by step, on the timeline:

1. At $t = 0$ the navigation thread locks `nav_mutex` and the telemetry thread locks `tlm_mutex`. Both succeed, because each mutex was free.
2. Both sleep for 50 ms, each still holding its first lock.
3. At $t \approx 50$ ms the navigation thread asks for `tlm_mutex`, which the telemetry thread holds, so it sleeps inside `lock()`. The telemetry thread asks for `nav_mutex` and sleeps too.
4. Each waits for the other to release. Neither will ever reach its release. `finished` stays at 0.
5. `main` plays **watchdog**: it checks `finished` every 10 ms, and after 1 s it gives up and calls `std::abort()`. It cannot call `join()`, because joining a thread that never ends would hang `main` too.

Sanity check: the watchdog reports 0 of 2 finished, not 1 of 2. That fits: neither task reached its `fetch_add`, because each is stuck on its *second* lock.
:::

The `std::atomic<int>` counter is a preview of lesson 6. For now, read `finished.fetch_add(1)` as "add one to `finished`, safely, from any thread".

### Reading the fingerprints

In the field you get a hung process and a debugger. The skill is to recognise a deadlock from a set of thread **[[backtraces|backtrace-word]]** — the list of function calls each thread is in the middle of.

Rebuild the same program with `-O1 -g` (so the debugger can see names and line numbers), run it under `gdb`, and when the watchdog aborts, ask for every thread's state. Trimmed to the lines that matter, this is the real output:

```text
  Id   Target Id                              Frame
* 1    Thread ... (LWP 15008) "deadlock" __pthread_kill_implementation (...)
  2    Thread ... (LWP 15011) "deadlock" futex_wait (..., futex_word=0x555555558060 <tlm_mutex>)
  3    Thread ... (LWP 15012) "deadlock" futex_wait (..., futex_word=0x5555555580a0 <nav_mutex>)

Thread 2 (LWP 15011):
#7  navigation_task () at deadlock.cpp:15
Thread 3 (LWP 15012):
#7  telemetry_task () at deadlock.cpp:22

(gdb) p nav_mutex._M_mutex.__data.__owner
$1 = 15011
(gdb) p tlm_mutex._M_mutex.__data.__owner
$2 = 15012
```

Read it like a detective:

- Thread 2 is asleep in `futex_wait`, a **[[futex wait|futex-word]]**, on `tlm_mutex`, called from line 15 of `navigation_task`. It wants `tlm_mutex`.
- Thread 3 is asleep in `futex_wait` on `nav_mutex`, from line 22 of `telemetry_task`. It wants `nav_mutex`.
- The last two lines ask glibc which thread owns each mutex (the owner is stored inside the `pthread_mutex_t` that `std::mutex` wraps). `nav_mutex` is owned by thread 15011, which is thread 2. `tlm_mutex` is owned by 15012, thread 3.

Thread 2 waits for a lock held by thread 3, and thread 3 waits for a lock held by thread 2. That closed loop is a **[[wait-for cycle|wait-for-graph]]**, the signature of a deadlock. Two threads asleep on mutexes is normal; asleep on mutexes *each owned by the other* is a deadlock.

::: key
A deadlock shows up in backtraces as threads blocked inside `lock()` (on Linux, in `futex_wait`) where each waits for a mutex another blocked thread owns. Follow "waits for, owned by" arrows; if they close into a cycle, it is a deadlock.
:::

## The four conditions

In 1971 three computer scientists wrote down exactly what has to be true for a deadlock to occur. They are now called the **[[Coffman conditions|coffman-name]]**. All four must hold at the same time:

1. **Mutual exclusion.** A resource can be held by only one thread at a time. A mutex is exactly this.
2. **Hold and wait.** A thread holds one resource while waiting to get another. Our navigation task held `nav_mutex` while waiting for `tlm_mutex`.
3. **No preemption.** Nobody can take a resource away from the thread that holds it. The operating system will never yank a mutex out of a thread's hands.
4. **Circular wait.** There is a cycle: thread 1 waits for thread 2, which waits for … which waits for thread 1.

The power of the list is its "all four". Break any one, and deadlock cannot happen. So the design question is always "which condition am I going to break?".

::: key The four conditions for deadlock
Mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one prevents deadlock; the practical tool is a global lock ordering, or `std::scoped_lock` to take several locks atomically.
:::

### Breaking each one

**Mutual exclusion.** Share nothing, or share without a lock: give each thread its own copy, pass messages through a queue (lesson 5), or use atomics (lesson 6). No lock, nothing to deadlock on.

**Hold and wait.** Never hold one lock while asking for another: take every lock you need in one all-or-nothing step (`std::lock` and `std::scoped_lock`, below), or release before asking for more.

**No preemption.** Let a thread give up what it holds when it cannot get the next thing. With `try_lock` a thread can say "if B is busy, I will let go of A and try again later". That breaks the condition, at the cost of possible retries. Databases go further and abort a whole **[[transaction|preempt-transaction]]** to break a deadlock.

**Circular wait.** Make a cycle impossible by making everyone take locks in the same order. This is the workhorse of real systems, and the next section is about it.

## Lock ordering: one global rank

If every car drove onto the bridge from the north end only, the standoff could never happen. Lock ordering is that rule for mutexes.

Give every mutex in the program a **rank** — a number that says where it sits in the order. The rule: *a thread may only lock a mutex whose rank is lower than every mutex it already holds.* In words: always go down the ladder, never up.

Why does that kill circular wait? Walk along any chain of "waits for" arrows and the ranks go strictly down at every step. To close a cycle you would have to climb back to where you started, and strictly falling numbers never do. No cycle, no deadlock.

::: note Why ranking is enough, stated carefully
Suppose threads $T_1, \dots, T_k$ form a cycle: $T_1$ waits for a mutex held by $T_2$, $T_2$ waits for one held by $T_3$, and so on, until $T_k$ waits for one held by $T_1$. Let $h_i$ be the lowest rank $T_i$ currently holds, and $w_i$ the rank it is waiting for. The ranking rule says $w_i < h_i$. The mutex $T_i$ waits for is held by $T_{i+1}$, so $h_{i+1} \le w_i$. Put the two together: $h_{i+1} \le w_i < h_i$, so $h_{i+1} < h_i$. Going around the whole cycle gives $h_1 > h_2 > \dots > h_k > h_1$, which says $h_1 > h_1$. That is impossible, so no such cycle exists.
:::

You can make the program check the rule for you. A **ranked mutex** is an ordinary `std::mutex` that knows its rank and refuses to be locked out of order. It works with `std::lock_guard`, because the lock wrappers only need a type with `lock()` and `unlock()`.

::: example A mutex that enforces the order
```cpp
#include <cstdio>
#include <cstdlib>
#include <mutex>

// A mutex with a rank. A thread may only lock a mutex whose rank is
// lower than every rank it already holds.
class RankedMutex {
public:
    explicit RankedMutex(int rank) : rank_(rank) {}

    void lock() {
        if (rank_ >= held_rank_) {
            std::printf("lock-order violation: rank %d while holding rank %d\n",
                        rank_, held_rank_);
            std::fflush(stdout);
            std::abort();
        }
        m_.lock();
        previous_ = held_rank_;
        held_rank_ = rank_;
    }
    void unlock() {
        held_rank_ = previous_;
        m_.unlock();
    }

private:
    std::mutex m_;
    const int rank_;
    int previous_ = 0;                        // only touched while m_ is held
    static thread_local int held_rank_;       // one per thread
};
thread_local int RankedMutex::held_rank_ = 1'000'000;   // "holding nothing"

RankedMutex nav_mutex(200);   // taken first
RankedMutex tlm_mutex(100);   // taken second

int main() {
    {
        std::lock_guard<RankedMutex> a(nav_mutex);   // 200, then
        std::lock_guard<RankedMutex> b(tlm_mutex);   // 100: allowed
        std::printf("nav then tlm: fine\n");
    }
    {
        std::lock_guard<RankedMutex> b(tlm_mutex);   // 100, then
        std::lock_guard<RankedMutex> a(nav_mutex);   // 200: refused
        std::printf("never printed\n");
    }
}
```

Output (then the program aborts, exit status 134):

```text
nav then tlm: fine
lock-order violation: rank 200 while holding rank 100
```

What happens, step by step:

1. `held_rank_` is `thread_local`, a **[[per-thread variable|thread-local-word]]**: each thread has its own copy. It starts at 1,000,000, meaning "I hold nothing", so any first lock is allowed.
2. First block: locking `nav_mutex` (200) checks $200 < 1{,}000{,}000$, passes, and sets this thread's held rank to 200. Locking `tlm_mutex` (100) checks $100 < 200$ and passes. The line prints.
3. Leaving the block, the guards unlock in reverse order, and each `unlock()` restores the previous rank, back to 1,000,000.
4. Second block: `tlm_mutex` (100) is allowed, held rank becomes 100. Now `nav_mutex` asks for 200, and $200 \ge 100$, so the check fires *before* the thread would have blocked. The program stops with a message naming the two ranks.

Sanity check: this caught the bug on one thread, in a test that could not deadlock. The check fires on the *order*, not the timing.
:::

On a real team the ranks live in one reviewed table, so new code that needs two locks looks them up instead of guessing.

::: warning Ordering by address is fragile in general code
"Always lock the lower address first" works only inside one function that has both mutexes in hand. Locks taken in different functions, at different times, need a written rank.
:::

## Taking several locks at once: std::lock and std::scoped_lock

Sometimes you cannot pick an order in advance. Last lesson's tank transfer was one: one thread moves propellant from `left` to `right` while another moves it back. Each call locks "from" then "to", so the two threads ask in opposite orders. Here is a variant that counts whole grams, with one thread running `transfer(fwd, aft, 3)` and another `transfer(aft, fwd, 2)`, a million times each. With two plain `lock_guard`s it hangs; run under `timeout 5` on one machine it never finished and was killed after 5 s.

The standard library's answer is `std::lock(a, b, ...)`. It locks all the mutexes you give it, and it promises not to deadlock *among themselves*, whatever order you list them in and whatever order other `std::lock` calls use. The standard does not say how. libstdc++ (the GCC library) locks one, then *tries* the others; if any is busy it releases everything it took and starts again, this time waiting first on the one that was busy. That is breaking hold-and-wait: it never sleeps on one lock while holding another.

C++17 wrapped it in a guard, **`std::scoped_lock`**. Given several mutexes it calls the same deadlock-avoiding algorithm in its constructor and unlocks all of them in its destructor:

```cpp
void transfer(Tank& from, Tank& to, long grams) {
    std::scoped_lock lock(from.m, to.m);   // both, or neither
    from.grams -= grams;
    to.grams   += grams;
}
```

Read it as "lock both of these for the rest of this block". Class template argument deduction works out `std::scoped_lock<std::mutex, std::mutex>` for you.

With that line, a million transfers each way finish, and ThreadSanitizer reports nothing. Starting from 2,000,000 g per tank, the result is `fwd = 1000000 g, aft = 3000000 g, total = 4000000 g`: 3 g out and 2 g back a million times is 1,000,000 g moved, total unchanged.

Older code writes the same thing in two steps:

```cpp
std::lock(from.m, to.m);                                  // lock both, deadlock-free
std::lock_guard<std::mutex> g1(from.m, std::adopt_lock);  // take ownership of the
std::lock_guard<std::mutex> g2(to.m,   std::adopt_lock);  // locks already held
```

or, when you need `unique_lock`'s flexibility:

```cpp
std::unique_lock<std::mutex> l1(from.m, std::defer_lock);  // not locked yet
std::unique_lock<std::mutex> l2(to.m,   std::defer_lock);
std::lock(l1, l2);                                         // lock both now
```

`std::adopt_lock` means "already locked; you only unlock it". `std::defer_lock` means "do not lock it yet".

::: key
`std::lock(m1, m2, ...)` locks several mutexes without deadlocking among them, whatever order callers list them in. `std::scoped_lock lock(m1, m2);` (C++17) does the same in its constructor and unlocks all of them in its destructor. With one mutex it behaves like `lock_guard`.
:::

::: warning The unnamed lock
`std::scoped_lock{a, b};` with no variable name compiles without a warning under `-Wall -Wextra`. It creates a temporary that locks both mutexes and unlocks them again at the semicolon, so the next line runs unprotected. Always give the lock a name: `std::scoped_lock lock{a, b};`. (The parenthesised form `std::scoped_lock(a);` is worse: it declares a new, empty lock *called* `a`. g++ warns about the "unnecessary parentheses"; clang refuses to compile it.)
:::

### What does not fix it

- **A recursive mutex.** `std::recursive_mutex` lets the *same* thread lock it again. Our deadlock is two *different* threads. Recursion does nothing for it.
- **A sleep between the two locks.** It changes the odds, not the cycle. A deadlock that strikes once in ten thousand flights is worse than one that strikes every test, because you will not see it until it matters.
- **Spinning on `try_lock` with no back-off.** Next section.

## try_lock, and its trap: livelock

`m.try_lock()` asks for a mutex and returns at once: `true` if it got it, `false` if someone else holds it. It never sleeps. For several mutexes there is `std::try_lock(a, b, ...)`, which tries each in turn and returns `-1` if it got them all. If one was busy, it unlocks the ones it already took and returns the zero-based position of the busy one.

```cpp
#include <cstdio>
#include <mutex>
std::mutex a, b;
int main() {
    b.lock();                          // someone else holds b
    int failed = std::try_lock(a, b);  // -1 means "got them all"
    std::printf("try_lock returned %d; a is free again: %s\n",
                failed, a.try_lock() ? "yes" : "no");
}
```

This prints `try_lock returned 1; a is free again: yes`: position 1 (`b`) was busy, and `a` was released on the way out.

`try_lock` breaks "no preemption": a thread that cannot get its second lock gives up the first. But two threads doing this in perfect step can fail forever: both grab their first lock, both fail on the second, both release, both retry. That is a **[[livelock|livelock-hallway]]** — threads busy using CPU and making no progress.

The cure is to break the rhythm with a short, *different* back-off, or better, use `std::lock`. Keep hand-written `try_lock` for when you want to do something else if the lock is busy, such as a 1 kHz control loop that must never wait: "frame locked this cycle? skip the copy, try next cycle".

::: key
`m.try_lock()` returns at once, `true` if it got the lock. `std::try_lock(a, b, ...)` returns `-1` on success, or the index of the first busy mutex after unlocking the rest. A retry loop without back-off can livelock: busy threads, no progress.
:::

## Letting a tool find the cycle: TSan

Without the 50 ms sleeps the first deadlock might strike once in a million runs, so waiting for the hang is hopeless. ThreadSanitizer, which lesson 2 used for data races, also watches lock order. Every time a thread takes a mutex while holding another, TSan draws an arrow "held → taken" in a **lock-order graph**. If the arrows ever form a cycle, it reports a potential deadlock, even if the run itself never hung.

::: example TSan reports the inversion without the hang
The same two tasks, without the sleeps, and run one after the other so this run *cannot* deadlock:

```cpp
#include <cstdio>
#include <mutex>
#include <thread>

std::mutex nav_mutex;
std::mutex tlm_mutex;

void navigation_task() {
    std::lock_guard<std::mutex> a(nav_mutex);
    std::lock_guard<std::mutex> b(tlm_mutex);
}

void telemetry_task() {
    std::lock_guard<std::mutex> b(tlm_mutex);
    std::lock_guard<std::mutex> a(nav_mutex);
}

int main() {
    std::thread t1(navigation_task);
    t1.join();                       // t1 is finished before t2 starts,
    std::thread t2(telemetry_task);  // so this run cannot deadlock
    t2.join();
    std::printf("finished without deadlock\n");
}
```

Built with `g++ -std=c++20 -O1 -g -fsanitize=thread lock_order.cpp`, the program runs to the end, and TSan prints (stack frames trimmed to the useful one, paths shortened):

```text
WARNING: ThreadSanitizer: lock-order-inversion (potential deadlock)
  Cycle in lock order graph: M0 (0x559089ed3080) => M1 (0x559089ed3040) => M0

  Mutex M1 acquired here while holding mutex M0 in thread T1:
    #4 navigation_task() lock_order.cpp:10

  Mutex M0 acquired here while holding mutex M1 in thread T2:
    #4 telemetry_task() lock_order.cpp:15

SUMMARY: ThreadSanitizer: lock-order-inversion (potential deadlock)
finished without deadlock
ThreadSanitizer: reported 1 warnings
```

and the exit status is 66, TSan's way of failing a test.

Reading it:

1. `M0 => M1` means "someone took M1 while holding M0".
2. Line 10 took `tlm_mutex` while holding `nav_mutex`, so M0 is `nav_mutex` and M1 is `tlm_mutex`.
3. Line 15 took them the other way: the arrow back, `M1 => M0`. The two arrows close a cycle, a circular wait waiting to happen.

Sanity check: `finished without deadlock` printed. The report came from the order, not from a hang.
:::

Switch the tasks to `std::scoped_lock lock(nav_mutex, tlm_mutex);` and `std::scoped_lock lock(tlm_mutex, nav_mutex);` (opposite orders on purpose) and the report disappears. The library only *tries* the second mutex, and a try cannot block, so TSan draws no waiting arrow for it.

::: warning TSan only sees paths you ran
TSan draws arrows only for locks your test actually took. An order hidden in a fault branch the test never reached is invisible to it. Pair TSan with a ranked-mutex check and tests that cover the fault paths.
:::

## Check yourself

::: check
Name the four conditions for deadlock, and say which one a global lock ordering breaks.
:::

::: answer
Mutual exclusion (only one holder at a time), hold and wait (holding one resource while waiting for another), no preemption (nobody can take a held resource away), and circular wait (a cycle of threads each waiting for the next). A global lock order breaks **circular wait**: every chain of waits goes strictly down the ranks, so it can never come back around to where it started.
:::

::: check
A hung process shows three threads in `futex_wait`. Thread A waits on mutex X, owned by thread B. B waits on Y, owned by C. C waits on Z, owned by a fourth thread D, which is running, not blocked. Is this a deadlock?
:::

::: answer
Not from the lock picture. Follow the arrows: A → B → C → D, and D is running. The chain ends at a thread that can make progress, so there is no cycle. When D releases Z, C continues and releases Y, then B, then A. D might be stuck in an endless loop, which is a different bug, but a deadlock needs the arrows to close into a loop.
:::

::: check
Mutexes are ranked: `mode_mutex` 300, `nav_mutex` 200, `tlm_mutex` 100. A function holds `nav_mutex` and now needs `mode_mutex`. What must it do under the ranking rule?
:::

::: answer
It may not lock 300 while holding 200, because ranks must go down. It must release `nav_mutex`, lock `mode_mutex`, then lock `nav_mutex` again. Anything it read under `nav_mutex` before must be re-read, because another thread may have changed it in the gap. Often the better design takes both from the start, in rank order.
:::

::: check
Why does `std::scoped_lock lock(from.m, to.m);` stay safe even when another thread calls `transfer(to, from, ...)` with the arguments swapped?
:::

::: answer
Because `scoped_lock` does not lock "first argument, then second". It hands both mutexes to the `std::lock` algorithm, which never sleeps on one mutex while holding another: in libstdc++ it locks one, only *tries* the other, and on failure releases what it holds and starts again. Since no thread ever waits while holding, the hold-and-wait condition is broken, and no cycle can form, whatever order the arguments come in.
:::

::: check
Thread 1 locks A, then tries B. Thread 2 locks B, then tries A. On failure, each unlocks what it holds and immediately starts again, never sleeping. What can go wrong, and how do you fix it?
:::

::: answer
Livelock. If they run in step, both take their first lock, both fail on the other's, both release, both retry, forever: busy CPUs, no progress. There is no deadlock, since nobody sleeps while holding, but nothing gets done. Fix it with a short, randomised or thread-specific back-off before retrying, or replace the whole loop with `std::scoped_lock lock(A, B);`.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Deadlock | Threads each waiting for a resource another holds | In backtraces: blocked in `lock()`/`futex_wait`, owners form a cycle |
| Four conditions | Mutual exclusion, hold and wait, no preemption, circular wait | All four needed; break any one and deadlock cannot happen |
| Lock ordering | Every mutex has a rank; only lock down the ranks | Breaks circular wait; can be enforced at run time |
| `std::lock(a, b)` | Lock several mutexes deadlock-free | Library retries without holding while blocked |
| `std::scoped_lock` | C++17 guard for one or many mutexes | `std::scoped_lock lock(a, b);` — always name it |
| `try_lock` | Take a lock only if it is free, never wait | `std::try_lock` returns `-1` on success, else the busy index |
| Livelock | Busy retrying, no progress | Back off, or use `std::lock` |
| TSan lock-order-inversion | Cycle in the "held → taken" graph | Reported even when the run did not hang |

A mutex makes other threads wait for a lock; next lesson is about waiting for a *condition* — "wait until there is a sample in the queue" — without burning a core, and without missing the wake-up: `std::condition_variable`.

::: context watchdog-timer The flight computer's dead-man switch
A watchdog is a hardware timer that counts down on its own. Healthy software "kicks" it, resetting the count, every cycle. If the software hangs, for example in a deadlock, the kicks stop, the timer runs out, and the watchdog resets the processor. It cannot tell a deadlock from an infinite loop; it only knows nobody kicked it. In lesson 12 you will meet a Mars lander whose watchdog kept resetting it for a locking reason, and the real-time module covers watchdogs in depth.
:::

::: context backtrace-word What a backtrace is
Every running thread has a stack of function calls: `main` called `f`, which called `g`, which is running now. A backtrace lists that stack from the innermost call outward, one numbered frame per function. `#0` is where the thread is right now, often deep inside the C library; your own code usually appears a few frames up. In `gdb`, `thread apply all bt` prints one for every thread, which is the first thing to ask for when a process hangs.
:::

::: context futex-word Where a blocked thread sleeps
On Linux, `std::mutex` is built on a **futex**, short for "fast userspace mutex". Taking a free mutex is a single atomic instruction with no help from the operating system. Only when the mutex is busy does the thread call into the kernel with `futex_wait`, which puts it to sleep until the holder's unlock wakes it. So `futex_wait` at the top of a backtrace means "this thread is asleep waiting for a lock", and uses no CPU while it waits.
:::

::: context wait-for-graph Drawing the cycle
Draw each thread as a box and each mutex as a circle. An arrow from a mutex to a thread means "held by"; an arrow from a thread to a mutex means "waiting for". Our deadlock is the loop below. Any loop in such a picture is a deadlock; no loop, no deadlock.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="60" width="90" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">navigation</text>
  <text x="65" y="93" font-size="11" text-anchor="middle" fill="#1f2a44">thread 2</text>
  <rect x="250" y="60" width="90" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">telemetry</text>
  <text x="295" y="93" font-size="11" text-anchor="middle" fill="#1f2a44">thread 3</text>
  <circle cx="180" cy="30" r="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">tlm</text>
  <circle cx="180" cy="135" r="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="139" font-size="11" text-anchor="middle" fill="#1f2a44">nav</text>
  <line x1="110" y1="68" x2="152" y2="40" stroke="#b4232c" stroke-width="2"/>
  <polygon points="158,36 147,38 152,46" fill="#b4232c"/>
  <text x="112" y="46" font-size="11" fill="#b4232c">waits</text>
  <line x1="202" y1="38" x2="244" y2="64" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="250,68 239,66 244,58" fill="#1d6fd1"/>
  <text x="232" y="44" font-size="11" fill="#1d6fd1">held by</text>
  <line x1="250" y1="94" x2="208" y2="125" stroke="#b4232c" stroke-width="2"/>
  <polygon points="202,129 208,119 213,127" fill="#b4232c"/>
  <text x="236" y="126" font-size="11" fill="#b4232c">waits</text>
  <line x1="158" y1="126" x2="116" y2="96" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="110,92 121,94 116,102" fill="#1d6fd1"/>
  <text x="84" y="128" font-size="11" fill="#1d6fd1">held by</text>
</svg>
```
:::

::: context coffman-name Who wrote the list down
The four conditions are named after Edward G. Coffman Jr., first author, with Michael Elphick and Arie Shoshani, of a 1971 paper called "System Deadlocks" in the journal ACM Computing Surveys. They were writing about operating systems sharing devices and memory among programs, long before multicore processors. The same four conditions apply unchanged to threads and mutexes.
:::

::: context preempt-transaction How databases break a deadlock
A database cannot tell its users "always lock tables in this order", because users write arbitrary queries. So many databases let deadlocks happen, detect the cycle, and pick one transaction as the victim: they abort it, undo its changes, release its locks, and report an error so the program can retry. That is breaking "no preemption" by force. Flight software almost never does this, because undoing an action on real hardware is usually impossible.
:::

::: context thread-local-word One copy per thread
A normal global variable has one copy shared by every thread. A `thread_local` variable has a separate copy for each thread, created when the thread starts. That is exactly right for "which ranks do I hold?", because the answer is different for every thread, and no thread needs to see another's. Since each thread only touches its own copy, reading and writing it needs no lock.
:::

::: context livelock-hallway The hallway dance
Two people meet in a corridor, A walking up the page and B walking down. Both step toward the same wall to let the other pass, so they are face to face again. Both switch to the other wall. And again. Each is being polite and moving, yet neither gets by. That is livelock: activity without progress. It ends when one of them waits a moment longer than the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">step 1: both go left</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">step 2: both go right</text>
  <rect x="20" y="26" width="140" height="110" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="26" width="140" height="110" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="26" x2="90" y2="136" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="270" y1="26" x2="270" y2="136" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="55" cy="112" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="55" cy="50" r="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="235" cy="112" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="235" cy="50" r="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="55" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">B</text>
  <text x="235" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="235" y="54" font-size="11" text-anchor="middle" fill="#1f2a44">B</text>
  <text x="120" y="86" font-size="11" text-anchor="middle" fill="#b4232c">blocked</text>
  <text x="300" y="86" font-size="11" text-anchor="middle" fill="#b4232c">blocked</text>
</svg>
```
:::
