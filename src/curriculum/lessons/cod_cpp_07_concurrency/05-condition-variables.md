---
id: l05-condition-variables
title: Waiting for something to happen: condition variables
minutes: 23
covers:
  - "condition_variable and spurious wakeups; the predicate form of wait"
---

You order food at a busy counter and get a plastic pager. You could stand at the counter and ask "is it ready?" every five seconds. That wears you out and annoys the cook. Instead you sit down, and when the food is ready the pager buzzes. You walk up, check that the tray really has your order on it, and take it.

Threads need the same thing. A navigation task has nothing to do until the IMU driver delivers the next sample. A telemetry downlink task has nothing to send until a frame is built. A mutex protects the shared queue, but it does not tell anyone *when* there is something in it. Asking over and over wastes a whole processor core; sleeping a fixed time between asks adds delay.

The C++ tool for "sleep until another thread tells me something changed" is the **[[condition variable|monitor-origin]]**, `std::condition_variable`. It is the pager. This lesson shows how it works, why it has two famous traps — the **lost wakeup** and the **spurious wakeup** — and the one way of using it that avoids both. Along the way you build a real producer/consumer queue for sensor samples, add a deadline so a dead sensor cannot hang the reader, and see how C++20 lets a stop request wake a sleeping thread.

## Polling, and why it is not good enough

Here is the first thing people write when one thread must wait for another:

```cpp
std::mutex m;
bool frame_ready = false;   // guarded by m

void wait_for_frame() {
    while (true) {
        std::lock_guard<std::mutex> lock(m);
        if (frame_ready) break;
    }   // unlock, and immediately try again
}
```

It is correct, in that it does not race: every read of `frame_ready` happens under the mutex. But it is **busy-waiting**, also called spinning: the thread runs flat out, locking and unlocking millions of times per second, doing nothing useful. On a flight computer with four cores, that is a quarter of the machine gone. Worse, it keeps grabbing the very mutex the producer needs in order to set the flag.

Adding `std::this_thread::sleep_for(1ms)` inside the loop saves the core but adds up to a millisecond of **latency** — delay between the event and the reaction — which on a 1 kHz loop is a whole cycle. You want both: zero CPU while waiting, and a wake-up the moment the data arrives.

## The condition variable: a doorbell, not a mailbox

A `std::condition_variable` has three operations you need:

- `cv.wait(lock)` — put this thread to sleep until another thread notifies the condition variable.
- `cv.notify_one()` — wake one sleeping waiter, if there is any.
- `cv.notify_all()` — wake every sleeping waiter.

The most important fact about it is what it does *not* have: memory. It is a **[[doorbell, not a mailbox|doorbell-mailbox]]**. If you ring a doorbell while nobody is home, nothing is recorded; the person who comes home later never learns you rang. A `notify_one()` with nobody waiting does exactly nothing.

So the *news* — "a frame is ready", "the queue has three samples" — must live somewhere else: in ordinary shared variables protected by a mutex. The condition variable only says "the news may have changed; go and look". That split, state in variables, wake-up in the condition variable, is the whole design.

Here is the pattern, with every piece in place:

```cpp
std::mutex m;
std::condition_variable cv;
bool frame_ready = false;            // the state, guarded by m

// Producer
{
    std::lock_guard<std::mutex> lock(m);
    frame_ready = true;              // 1. change the state under the lock
}
cv.notify_one();                     // 2. ring the bell

// Consumer
std::unique_lock<std::mutex> lock(m);
cv.wait(lock, [] { return frame_ready; });   // 3. sleep until the state says go
// here: m is locked and frame_ready is true
```

Read the consumer line aloud as "wait on `cv`, holding `lock`, until `frame_ready` is true". The part in braces is a lambda, the **predicate** — a small function that returns `true` when the thing you are waiting for has happened. The rest of this lesson is about why that predicate is not optional.

### Why wait needs a unique_lock

Look at what `wait` must do. The consumer holds the mutex, because it had to read `frame_ready` safely. Now it wants to sleep. But if it sleeps *holding* the mutex, the producer can never lock it to set the flag, and both are stuck. So `wait` has to:

1. unlock the mutex,
2. go to sleep,
3. when woken, lock the mutex again before returning.

Steps 1 and 2 happen as one **[[atomic step|atomic-unlock-sleep]]**: no other thread can slip in between "unlocked" and "asleep". That is the whole reason a condition variable exists instead of "unlock, then sleep" written by hand.

To unlock and relock, `wait` needs a lock object it is allowed to unlock. `std::lock_guard` cannot be unlocked before its destructor; `std::unique_lock` can (last lesson). So `std::condition_variable::wait` takes a `std::unique_lock<std::mutex>&`, and only that type. When `wait` returns, the lock is held again, and the rest of your block runs under the mutex as if you had never let go.

::: key
`cv.wait(lock)` atomically unlocks the mutex and sleeps, and locks it again before returning. That is why it takes a `std::unique_lock<std::mutex>`: a `lock_guard` cannot be unlocked. A notify with no waiter is lost: the condition variable remembers nothing, so the state must live in variables guarded by the mutex.
:::

## Two ways a bare wait goes wrong

`wait(lock)` without a predicate is legal. It is also almost always a bug, for two separate reasons.

### The lost wakeup

The producer can finish before the consumer starts waiting. It sets the flag, rings the bell, and leaves. Then the consumer arrives and calls `wait`. Nobody will ring again. The consumer sleeps forever, even though the frame it wanted has been sitting there the whole time. This is the **lost wakeup**.

It is not rare. Threads start in whatever order the scheduler picks, and on a busy system a producer can easily run first.

::: example A notify that nobody heard
Here the order is forced: the producer's notify happens first, on purpose. Then two consumers wait for the same frame, each with a 200 ms deadline so the program cannot hang. The first waits without a predicate, the second with one.

```cpp
#include <chrono>
#include <condition_variable>
#include <cstdio>
#include <mutex>

using namespace std::chrono;

std::mutex m;
std::condition_variable cv;
bool frame_ready = false;

int main() {
    // The "producer" finishes first: it sets the flag and notifies
    // while nobody is waiting yet.
    {
        std::lock_guard<std::mutex> lock(m);
        frame_ready = true;
    }
    cv.notify_one();

    // Consumer 1: waits without a predicate, with a 200 ms deadline.
    {
        std::unique_lock<std::mutex> lock(m);
        const auto start = steady_clock::now();
        const auto deadline = start + milliseconds(200);
        std::cv_status st = cv.wait_until(lock, deadline);
        const auto waited = duration_cast<milliseconds>(steady_clock::now() - start);
        std::printf("no predicate:   %s, waited at least 200 ms: %s\n",
                    st == std::cv_status::timeout ? "timeout" : "woken",
                    waited >= milliseconds(200) ? "yes" : "no");
    }

    // Consumer 2: same deadline, with a predicate.
    {
        std::unique_lock<std::mutex> lock(m);
        const auto start = steady_clock::now();
        const auto deadline = start + milliseconds(200);
        bool ok = cv.wait_until(lock, deadline, [] { return frame_ready; });
        const auto waited = duration_cast<milliseconds>(steady_clock::now() - start);
        std::printf("with predicate: returned %s, waited %lld ms\n",
                    ok ? "true" : "false", static_cast<long long>(waited.count()));
    }
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` and run, it prints:

```text
no predicate:   timeout, waited at least 200 ms: yes
with predicate: returned true, waited 0 ms
```

Step by step:

1. `frame_ready` becomes `true` under the lock, and `notify_one()` rings the bell. No thread is waiting, so the ring vanishes.
2. Consumer 1 calls `wait_until` with no predicate. It never looks at `frame_ready`. It goes straight to sleep, and nothing will ever wake it. Only the deadline saves it: after 200 ms it returns `std::cv_status::timeout`.
3. Consumer 2 calls `wait_until` with a predicate. The very first thing the predicate form does is check `frame_ready`, under the lock. It is already `true`, so it returns at once without sleeping: `true`, 0 ms.

Sanity check: without the deadline, consumer 1 would still be asleep now, with the frame it wanted ready and waiting. That is a hang in flight, and it is exactly the bug the predicate removes.
:::

### The spurious wakeup

The second trap runs the other way: `wait` may return when *nobody* notified. The standard explicitly allows this. It is called a **[[spurious wakeup|spurious-why]]**, and it exists because letting `wait` occasionally return early makes condition variables simpler and faster to build on real operating systems. You cannot reliably make one happen in a test, which is what makes it dangerous: code that assumes "I woke up, so the data must be there" passes every test and fails in the field.

A close cousin is the **stolen wakeup**. Two consumers wait on one queue. The producer pushes one sample and calls `notify_one()`. Consumer A wakes up. But before A can lock the mutex again, consumer B, which was not waiting at all but arrived on its own, takes the lock, sees the sample, and removes it. When A finally gets the lock, the queue is empty again. A was woken for real, and the thing it was woken for is gone.

In both cases the fix is the same: after waking, *look again* at the state, under the lock, and if it is not what you need, go back to sleep.

## The predicate form, and why it fixes both

That "look, and if not ready, sleep, and look again" loop is so important that the standard gives it to you as an overload:

```cpp
cv.wait(lock, pred);
```

behaves exactly like

```cpp
while (!pred()) {
    cv.wait(lock);
}
```

Walk through what that loop does against each trap:

- **Lost wakeup.** The loop checks `pred()` *before* the first sleep. If the producer already made the state true, the thread never sleeps at all.
- **Spurious or stolen wakeup.** After any return from `wait`, the loop checks `pred()` again. If the wake-up was spurious, or someone else took the data, `pred()` is false and the thread goes back to sleep.
- **Safety of the check.** Every call to `pred()` happens while holding the mutex, because `wait` relocks before returning. So the check reads the shared state safely.

When `cv.wait(lock, pred)` returns, two things are guaranteed: you hold the lock, and `pred()` is true. That is the only state in which it makes sense to go on.

::: key Why wait takes a predicate
Spurious wakeups are permitted, and another thread may consume the condition first. The predicate form `cv.wait(lock, pred)`, which is `while (!pred()) cv.wait(lock);`, re-checks under the lock and goes back to waiting. It also checks before the first sleep, so a notify that came early is not lost. It is the only correct usage.
:::

::: warning `if` is not `while`
Writing `if (!ready) cv.wait(lock);` looks like the predicate form and is not. It checks once before sleeping, which stops the lost wakeup, but after a spurious or stolen wakeup it carries on with `ready` still false. Use the predicate overload, and the question never comes up.
:::

::: warning Change the state under the mutex, even if it is atomic
It is tempting to make `ready` a `std::atomic<bool>` and set it without locking. Then this can happen: the consumer locks, checks `ready` (false), and is about to sleep; the producer sets `ready = true` and notifies in that tiny gap; the notify finds nobody asleep; the consumer sleeps forever. The mutex is what closes the gap between the consumer's check and its sleep. The producer must change the state while holding the same mutex, even if only for that one line.
:::

## Deadlines: wait_for and wait_until

A flight task must never wait forever. If the IMU stops sending, the navigation task should notice within a few milliseconds, mark the sensor stale, and switch to its backup, not sleep until the watchdog resets the computer.

Condition variables come with timed versions:

- `cv.wait_for(lock, 5ms, pred)` — wait at most 5 ms from now.
- `cv.wait_until(lock, deadline, pred)` — wait at most until the time point `deadline`.

With a predicate, both return a `bool`: `true` if `pred()` became true, `false` if the time ran out with `pred()` still false. Without a predicate, they return `std::cv_status::timeout` or `std::cv_status::no_timeout`, and you face both traps again, so use the predicate versions.

When a thread waits several times in a loop for one overall deadline, compute the deadline *once* and use `wait_until`. Calling `wait_for(5ms)` in a loop restarts the 5 ms each time around, so a stream of spurious wakeups could stretch the wait without limit.

Use `std::chrono::steady_clock` for deadlines. It is a **[[monotonic clock|steady-clock]]**: it never jumps backwards and is not corrected by time synchronization. `system_clock`, the wall-clock time, can be stepped by seconds when the computer syncs its clock, which could make a 5 ms wait end instantly or last far too long.

```cpp
const auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(5);
std::unique_lock<std::mutex> lock(m);
if (!cv.wait_until(lock, deadline, [] { return !samples.empty(); })) {
    imu_stale = true;   // no sample within 5 ms: switch to the backup IMU
}
```

::: key
`cv.wait_for(lock, dt, pred)` and `cv.wait_until(lock, t, pred)` return `pred()`'s value when they stop: `true` if the condition came true, `false` on timeout. Build deadlines on `std::chrono::steady_clock`, which never jumps. For one overall deadline across several waits, compute it once and use `wait_until`.
:::

## A producer/consumer queue for sensor samples

Now put the pieces together into the object you will write again and again in flight software: a **bounded queue** between a sensor driver (the producer) and a processing task (the consumer). "Bounded" means it has a fixed capacity. When it is full, the producer waits; this is called **[[backpressure|backpressure-word]]**, and it keeps a fast producer from eating all the memory.

It needs two conditions, so it has two condition variables:

- `not_empty_` — consumers wait on it for "there is at least one sample, or the queue is closed".
- `not_full_` — producers wait on it for "there is room for one more".

It also needs a way to shut down. A consumer asleep on an empty queue must be told "no more samples are coming", or it would never return. That is `close()`, and it uses `notify_all()`, because *every* waiting consumer needs the news, not only one.

::: example A bounded sample queue, end to end
```cpp laptop
#include <condition_variable>
#include <cstdio>
#include <deque>
#include <mutex>
#include <optional>
#include <thread>

struct Sample {
    int seq;           // sequence number from the sensor
    double accel_z;    // m/s^2
};

class SampleQueue {
public:
    explicit SampleQueue(std::size_t capacity) : capacity_(capacity) {}

    void push(const Sample& s) {
        std::unique_lock<std::mutex> lock(m_);
        not_full_.wait(lock, [&] { return q_.size() < capacity_; });
        q_.push_back(s);
        lock.unlock();              // wake the consumer after unlocking
        not_empty_.notify_one();
    }

    // Returns an empty optional once the queue is closed and drained.
    std::optional<Sample> pop() {
        std::unique_lock<std::mutex> lock(m_);
        not_empty_.wait(lock, [&] { return !q_.empty() || closed_; });
        if (q_.empty()) return std::nullopt;   // closed and nothing left
        Sample s = q_.front();
        q_.pop_front();
        lock.unlock();
        not_full_.notify_one();
        return s;
    }

    void close() {
        {
            std::lock_guard<std::mutex> lock(m_);
            closed_ = true;
        }
        not_empty_.notify_all();    // every waiting consumer must see it
    }

private:
    std::mutex m_;
    std::condition_variable not_empty_;
    std::condition_variable not_full_;
    std::deque<Sample> q_;
    const std::size_t capacity_;
    bool closed_ = false;
};

int main() {
    SampleQueue queue(8);

    std::thread imu([&] {                       // producer: the sensor driver
        for (int i = 1; i <= 100'000; ++i) queue.push({i, 9.81});
        queue.close();
    });

    long count = 0;
    long long seq_sum = 0;
    int last = 0;
    bool in_order = true;
    while (auto s = queue.pop()) {              // consumer: the navigation task
        ++count;
        seq_sum += s->seq;
        if (s->seq != last + 1) in_order = false;
        last = s->seq;
    }
    imu.join();
    std::printf("received %ld samples, sequence sum %lld, in order: %s\n",
                count, seq_sum, in_order ? "yes" : "no");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2` it prints, and the same program built with `-fsanitize=thread` prints the same line with no ThreadSanitizer report:

```text
received 100000 samples, sequence sum 5000050000, in order: yes
```

How it works, one piece at a time:

1. **`push`** locks, then waits on `not_full_` until `q_.size() < capacity_`. With a capacity of 8 and a fast producer, it spends most of its time here, which is the backpressure doing its job. Once there is room, it appends the sample.
2. It then unlocks *before* calling `notify_one()`. Notifying while still holding the lock is also correct; unlocking first saves the woken consumer from waking up only to find the mutex still taken.
3. **`pop`** waits on `not_empty_` for "not empty *or* closed". Both are part of the predicate, because both are reasons to stop waiting.
4. After waking, `pop` checks which reason it was. If the queue is empty, it must have been `close()`, so it returns an empty `std::optional`, read "no value". Otherwise it takes the front sample and notifies `not_full_`, since it has made room.
5. **`close`** sets `closed_` under the lock and then `notify_all()`s. The consumer's loop `while (auto s = queue.pop())` ends when `pop` returns the empty optional.
6. `main` joins the producer thread after the loop, so nothing is left running.

Sanity check: the samples were numbered 1 to 100,000, so their sum should be $100{,}000 \times 100{,}001 / 2 = 5{,}000{,}050{,}000$. It is. Every sample arrived exactly once, and `in_order: yes` says none were reordered.
:::

::: warning notify_one when one waiter can use it, notify_all when all must know
One sample can satisfy only one consumer, so `push` wakes one. Closing concerns every consumer, so `close` wakes all. Using `notify_one` in `close` with two consumers asleep would leave one of them asleep forever. Using `notify_all` everywhere is always *correct* with predicates, since extra wakers go back to sleep, but it wakes every thread to [[fight over one item|thundering-herd]], which costs time.
:::

## Stopping a wait: condition_variable_any and stop_token

In lesson 1 you met `std::jthread`, which on destruction asks its thread to stop through a `std::stop_token` and then joins it. A worker asleep in `cv.wait` cannot see that request, because the request does not notify its condition variable.

C++20 closed that gap with **`std::condition_variable_any`**. "Any" means it works with any lock type, not only `std::unique_lock<std::mutex>` (a `std::shared_lock`, or a lock on your own ranked mutex from lesson 4). It is a little heavier than `std::condition_variable`, and it adds wait overloads that take a stop token:

```cpp laptop
#include <chrono>
#include <condition_variable>
#include <cstdio>
#include <deque>
#include <mutex>
#include <stop_token>
#include <thread>

std::mutex m;
std::condition_variable_any cv;
std::deque<int> commands;

int main() {
    std::jthread worker([](std::stop_token st) {
        int handled = 0;
        while (true) {
            std::unique_lock<std::mutex> lock(m);
            // Wakes for a command OR for a stop request.
            if (!cv.wait(lock, st, [] { return !commands.empty(); })) break;
            commands.pop_front();
            ++handled;
        }
        std::printf("worker: stop requested, handled %d commands\n", handled);
    });

    for (int i = 0; i < 3; ++i) {
        { std::lock_guard<std::mutex> lock(m); commands.push_back(i); }
        cv.notify_one();
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    // Leaving main: ~jthread calls request_stop() and then join().
}
```

It prints `worker: stop requested, handled 3 commands`. `cv.wait(lock, st, pred)` returns when `pred()` is true, or when a stop has been requested; it returns `pred()`'s value, so `false` means "woken by the stop, with no command waiting". When `main` ends, the `jthread` destructor requests the stop, the stop wakes the worker, the worker breaks out of its loop, and the destructor's join completes. No flag, no extra notify, no hang on shutdown.

::: key
`std::condition_variable_any` works with any lockable type and, from C++20, has `wait(lock, stop_token, pred)`: it returns when `pred()` is true or a stop is requested, and returns `pred()`. Paired with `std::jthread`, a stop request wakes a sleeping worker.
:::

## Check yourself

::: check
A colleague writes `std::lock_guard<std::mutex> lock(m); cv.wait(lock);`. Why does this not compile, and what would go wrong if `wait` could sleep while holding the mutex?
:::

::: answer
`std::condition_variable::wait` takes a `std::unique_lock<std::mutex>&`, and a `lock_guard` is a different type that cannot be unlocked before it is destroyed. `wait` needs to unlock the mutex while asleep and relock it on waking. If it slept holding the mutex, the producer could never lock the mutex to change the state and notify, so the consumer would sleep forever: a deadlock between the two.
:::

::: check
A driver thread calls `notify_one()` once per sample, and a consumer calls `cv.wait(lock)` (no predicate) once per sample. The driver starts first and delivers two samples before the consumer runs. How many samples does the consumer process, and why?
:::

::: answer
Possibly none. Both notifies happened with no waiter, so both were lost; a condition variable stores nothing. When the consumer then calls `wait(lock)` without looking at the queue, it sleeps until the *third* notify, although two samples are already waiting. With `cv.wait(lock, [&]{ return !q.empty(); })`, the consumer checks first, sees two samples, and does not sleep at all.
:::

::: check
Write out, as a plain `while` loop, what `cv.wait(lock, [&] { return !q.empty() || closed; })` does, and say which line protects against a spurious wakeup.
:::

::: answer
```cpp
while (!(!q.empty() || closed)) {
    cv.wait(lock);
}
```

The condition is checked before the first sleep (so an early notify is not lost) and again after every return from `cv.wait(lock)`. That re-check at the top of the loop, after a return, is what protects against a spurious or stolen wakeup: if nothing really changed, the loop sends the thread back to sleep.
:::

::: check
A navigation task must detect a dead IMU within 2 ms. It loops: `cv.wait_for(lock, 2ms)` (no predicate), then checks the queue, and if the queue is still empty and the wait did not time out, it loops again. What is wrong, and what should it use?
:::

::: answer
Each call to `wait_for` starts a fresh 2 ms from *now*. Every spurious wakeup, or every notify that leaves the queue empty, restarts the clock, so the total wait can grow past 2 ms with no limit. Compute `const auto deadline = std::chrono::steady_clock::now() + 2ms;` once and call `cv.wait_until(lock, deadline, [&]{ return !q.empty(); })`. The predicate handles the spurious wakeups, and the fixed deadline caps the total wait however many times the thread wakes. `steady_clock` keeps a clock correction from moving the deadline.
:::

::: check
In the `SampleQueue`, `close()` uses `notify_all()` but `push()` uses `notify_one()`. Would swapping them be wrong, slow, or fine?
:::

::: answer
`notify_all()` in `push()` would be correct but slow: all waiting consumers wake up, one takes the sample, and the others find the queue empty and go back to sleep, thanks to the predicate. `notify_one()` in `close()` would be wrong with several consumers: only one would wake, see `closed_`, and return. The others would sleep forever, since nothing else will ever notify them. Closing must reach everyone.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| `std::condition_variable` | Sleep until another thread says the state may have changed | State lives in variables guarded by a mutex; the CV only wakes |
| `wait(lock)` | Atomically unlock and sleep; relock before returning | Takes `std::unique_lock<std::mutex>` |
| `notify_one` / `notify_all` | Wake one waiter / all waiters | A notify with no waiter is lost |
| Lost wakeup | Notify happened before the wait | Fixed by checking the predicate before sleeping |
| Spurious / stolen wakeup | Woken with nothing to do | Fixed by re-checking the predicate after waking |
| `wait(lock, pred)` | `while (!pred()) wait(lock);` | The only correct usage |
| `wait_for` / `wait_until` | Wait with a time limit | Return `pred()`; use `steady_clock`; one deadline via `wait_until` |
| Bounded queue | Two CVs: not empty, not full; `close()` with `notify_all` | Backpressure stops a fast producer |
| `condition_variable_any` | Any lock type; C++20 stop-token waits | A `jthread` stop request wakes the waiter |

Everything here still used a mutex. Next lesson removes it for the smallest shared values: `std::atomic`, and the memory orderings — relaxed, acquire/release and sequentially consistent — that say what other threads are allowed to see.

::: context monitor-origin Where the name comes from
Condition variables come from the **monitor**, an idea from the early 1970s developed by Per Brinch Hansen and Tony Hoare; Hoare's 1974 paper "Monitors: An Operating System Structuring Concept" gave the classic description. A monitor bundles shared data with a lock, plus named *conditions* that threads can wait on inside it. C++ hands you the parts separately: a mutex, some variables, and a `std::condition_variable` for each condition, which is why you must hold them together yourself.
:::

::: context doorbell-mailbox What the notify leaves behind: nothing
A mailbox keeps a letter until you come home. A doorbell rings only for whoever is inside at that moment. A condition variable is the doorbell. The timeline shows the lost wakeup: the notify at the red mark finds no one asleep, and the consumer who arrives later sleeps through everything after it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="38" font-size="12" fill="#1f2a44">producer</text>
  <text x="10" y="98" font-size="12" fill="#1f2a44">consumer</text>
  <line x1="80" y1="34" x2="340" y2="34" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="80" y1="94" x2="340" y2="94" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="90" y="24" width="50" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="115" y="38" font-size="11" text-anchor="middle" fill="#1f2a44">set flag</text>
  <line x1="160" y1="20" x2="160" y2="50" stroke="#b4232c" stroke-width="2.5"/>
  <text x="160" y="64" font-size="11" text-anchor="middle" fill="#b4232c">notify: nobody home</text>
  <rect x="210" y="84" width="130" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="275" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">wait(lock): asleep</text>
  <text x="275" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <polygon points="340,94 332,90 332,98" fill="#6c7a93"/>
</svg>
```
:::

::: context atomic-unlock-sleep The gap that must not exist
Imagine `wait` were written as two separate steps: `m.unlock(); sleep_until_notified();`. Between those two lines, the producer could lock, set the flag, notify, and unlock. The notify would find no sleeper, because the consumer had not quite fallen asleep yet. Then the consumer sleeps, having missed it. By joining "unlock" and "start sleeping" into one indivisible step, `wait` guarantees a notify sent after the unlock is always heard.
:::

::: context spurious-why Why the standard allows spurious wakeups
On Linux, `std::condition_variable` sits on top of POSIX threads, and the POSIX standard itself says a wait may return without a signal. Two practical reasons: a thread's sleep can be interrupted by a Unix signal and restarted, and on some multiprocessor designs, ruling out every spurious return would force slower code on every wait. Since correct code needs a loop anyway, for stolen wakeups, the designers chose the faster rule and left the loop to you.
:::

::: context steady-clock Two clocks in every computer
`std::chrono::system_clock` is the wall clock, the time and date you would read to a person. The operating system may step it forward or back when it syncs with a time server or when someone sets it. `std::chrono::steady_clock` counts from an arbitrary start, typically boot, and only ever moves forward at a steady rate. For "how long has it been?" and "wake me in 5 ms", only a steady clock gives a right answer every time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">real time passing</text>
  <text x="34" y="20" font-size="11" text-anchor="end" fill="#1f2a44">reading</text>
  <line x1="40" y1="110" x2="330" y2="30" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="240" y="44" font-size="11" fill="#1d6fd1">steady_clock</text>
  <polyline points="40,100 180,62 180,92 330,50" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="186" y="106" font-size="11" fill="#b4232c">system_clock stepped back</text>
</svg>
```
:::

::: context backpressure-word Letting the slow end set the pace
Backpressure means the consumer's speed limits the producer's. Without it, a sensor producing 1,000 samples a second into a queue drained at 900 a second grows the queue by 100 samples every second until memory runs out. With a bound, the producer waits when the queue is full. In flight code the choice is sharper: a sensor driver usually must not block, so the full-queue policy is often "overwrite the oldest sample" or "drop and count", decided on purpose. Lesson 9's lock-free ring buffer never blocks: its `push` returns `false` when full and leaves the policy to the caller.
:::

::: context thundering-herd The thundering herd
When one event wakes many sleepers but only one can use it, all of them wake, all compete for the same mutex, one wins, and the rest go back to sleep. Engineers call this the thundering herd. Each unnecessary wake-up costs a trip through the kernel and a context switch, and on a busy flight computer those microseconds come out of some other task's time budget.
:::
