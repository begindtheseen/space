---
id: l08-futures-and-thread-pools
title: Futures, promises and thread pools
minutes: 19
covers:
  - future, promise, packaged_task, async, and thread pools
---

At a busy burger place, you pay at the counter and get a plastic pager. You sit down. You do not stand at the window asking "is it ready yet?" every ten seconds. When the food is done, the pager buzzes, and you walk up and collect it. If the kitchen drops your order on the floor, the pager still buzzes, and at the window they tell you what went wrong.

C++ has that pager. A **future** is a claim ticket for a result that another thread is still working on. Its partner, the kitchen's end, is a **promise**. Between them they carry one value, or one error, from the thread that makes it to the thread that needs it, with the synchronization done for you.

Last lesson showed how to build a happens-before chain by hand, with release and acquire. This lesson uses tools that build the chain for you: `std::future`, `std::promise`, `std::packaged_task` and `std::async`. Then it puts them together into a **thread pool**: a fixed crew of worker threads that take jobs from a queue. That last idea matters most for flight code, where threads are created once, at start-up, and never again.

## The claim ticket: `std::future<T>`

A **`std::future<T>`**, read "future of T", is an object that will hold a `T` later. The thread that owns it can do three things:

- **`get()`** waits until the result is ready, then returns it. You may call it **once**. It moves the value out, and after that `valid()` returns `false`.
- **`wait()`** waits without taking the value.
- **`wait_for(duration)`** waits at most that long, then tells you which happened: `std::future_status::ready`, `timeout`, or `deferred` (explained below).

Behind every future is a small object both sides can reach, the **[[shared state|shared-state]]**. It holds the result slot, a "ready" flag and whatever the waiting needs. The future is one handle to it. The other handle belongs to whoever will produce the value.

If several threads need the same result, `f.share()` turns the future into a `std::shared_future<T>`, which can be copied and whose `get()` can be called many times.

::: key What a future guarantees
Making the shared state ready (by `set_value`, `set_exception`, or a finished task) synchronizes with the `get()` or `wait()` that sees it ready. So everything the producing thread did before setting the result happens before the consumer's code after `get()`. No extra atomics or mutexes are needed for the handed-over value.
:::

## The kitchen's end: `std::promise<T>`

A **`std::promise<T>`** is the writing end. You create it, take its future with `get_future()` (once), hand the future to whoever will wait, and later call exactly one of:

- **`set_value(v)`**: store the result and wake the waiter.
- **`set_exception(ptr)`**: store an error instead. The waiter's `get()` will throw it.

Here is a sensor thread using a promise to hand back a reading, then a failure, then a `packaged_task`, which the next section explains.

```cpp
#include <cstdio>
#include <future>
#include <stdexcept>
#include <thread>

int main() {
    // promise: the worker fills in the answer by hand.
    std::promise<double> p;
    std::future<double> f = p.get_future();
    std::jthread sensor([&p] {
        p.set_value(101.325);                 // kPa, sea-level pressure
    });
    std::printf("pressure %.3f kPa\n", f.get());

    // promise carrying an error instead of a value.
    std::promise<double> p2;
    std::future<double> f2 = p2.get_future();
    std::jthread bad([&p2] {
        try {
            throw std::runtime_error("checksum mismatch");
        } catch (...) {
            p2.set_exception(std::current_exception());
        }
    });
    try { f2.get(); }
    catch (const std::exception& e) { std::printf("error: %s\n", e.what()); }

    // packaged_task: wraps a function; calling the task fills its future.
    std::packaged_task<int(int, int)> add([](int a, int b) { return a + b; });
    std::future<int> sum = add.get_future();
    std::jthread runner(std::move(add), 40, 2);
    std::printf("sum %d\n", sum.get());

    // A future is one-shot: after get(), it is no longer valid.
    std::printf("sum.valid() after get: %s\n", sum.valid() ? "true" : "false");
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, it prints the same four lines every time, and a ThreadSanitizer build reports nothing:

```text
pressure 101.325 kPa
error: checksum mismatch
sum 42
sum.valid() after get: false
```

`std::current_exception()` captures the exception being handled as a **[[std::exception_ptr|exception-ptr]]**, a pointer-like handle that can travel to another thread. The `get()` in `main` then throws that same exception again, so the `catch` in `main` sees the message the sensor thread wrote.

::: warning A promise that is never kept
If a promise is destroyed before it sets anything, the future is not left waiting forever. Its `get()` throws `std::future_error`, and on this machine `what()` reads `std::future_error: Broken promise`. It is the kitchen telling you your order was lost. Treat it as a bug in the producer: some path returned or threw without calling `set_value`.
:::

## A function with its ticket: `std::packaged_task`

Writing `try`, `catch` and `set_exception` around every job gets old. A **`std::packaged_task<R(Args...)>`**, read "packaged task of R taking Args", wraps a callable together with a promise. `get_future()` hands out the ticket. Calling the task runs the function and stores whatever comes out: the return value, or the exception if it throws.

In the program above, the task `add` was moved into a `jthread` together with its arguments 40 and 2. The thread called it, the lambda returned 42, and the task stored 42 in the shared state, where `sum.get()` found it. A `packaged_task` can be moved but not copied, since there is one promise inside.

That is the building block of a thread pool: turn any job into a `packaged_task`, keep its future for the caller, and put the task in a queue for some worker to run.

## The one-line version: `std::async`

**`std::async(policy, f, args...)`** does all of that in one call. It returns a `std::future` for `f(args...)`. The **launch policy** says how:

- **`std::launch::async`**: start a new thread now, as if with `std::thread`, and run `f` there.
- **`std::launch::deferred`**: do nothing yet. The first `get()` or `wait()` runs `f` right there, **on the calling thread**, like a normal function call.
- **No policy given** means `async | deferred`: the library may pick either. So the function might never run on another thread, and a `wait_for` might return `deferred` forever. Always name the policy.

There is one more rule, and it surprises almost everyone. The future returned by `std::async` with the async policy is special: **its destructor blocks** until the task finishes. Futures from a promise or a `packaged_task` do not do this. They can be dropped at any time.

::: key The blocking destructor of an async future
The last future referring to a result started by `std::async(std::launch::async, ...)` waits in its destructor for the task to finish. Throwing that future away does not make the call "fire and forget": the statement blocks until the work is done.
:::

::: example Timing async, deferred and a discarded future
This program times four uses of `std::async` with a function that sleeps 200 ms, a stand-in for real work.

```cpp
#include <chrono>
#include <cstdio>
#include <future>
#include <stdexcept>
#include <thread>

using namespace std::chrono;
using namespace std::chrono_literals;

double ms_since(steady_clock::time_point t0) {
    return duration<double, std::milli>(steady_clock::now() - t0).count();
}

int slow_square(int x) {
    std::this_thread::sleep_for(200ms);           // stand-in for real work
    return x * x;
}

int main() {
    auto t0 = steady_clock::now();

    // 1. launch::async: a new thread starts now; get() waits for it.
    std::future<int> fa = std::async(std::launch::async, slow_square, 7);
    std::printf("[%6.1f ms] async launched\n", ms_since(t0));
    std::printf("[%6.1f ms] async result %d\n", ms_since(t0), fa.get());

    // 2. launch::deferred: nothing runs until get(), then it runs right here.
    t0 = steady_clock::now();
    std::future<int> fd = std::async(std::launch::deferred, slow_square, 8);
    std::printf("[%6.1f ms] deferred created\n", ms_since(t0));
    std::printf("[%6.1f ms] deferred result %d\n", ms_since(t0), fd.get());
    auto who = std::async(std::launch::deferred, [] { return std::this_thread::get_id(); });
    std::printf("deferred ran on the calling thread: %s\n",
                who.get() == std::this_thread::get_id() ? "yes" : "no");

    // 3. The future from async is thrown away: its destructor blocks.
    t0 = steady_clock::now();
    std::async(std::launch::async, slow_square, 9);   // temporary future dies here
    std::printf("[%6.1f ms] after the discarded async\n", ms_since(t0));

    // 4. An exception travels through the future to get().
    auto fe = std::async(std::launch::async, []() -> int {
        throw std::runtime_error("gyro 2 timeout");
    });
    try {
        fe.get();
    } catch (const std::exception& e) {
        std::printf("caught from worker: %s\n", e.what());
    }
}
```

Compiling with `g++ -std=c++20 -Wall -Wextra -O2` gives one warning, shortened here:

```text
warning: ignoring return value of 'std::future<...> std::async(launch, _Fn&&, _Args&& ...)
[with _Fn = int (&)(int); _Args = {int}; ...]', declared with attribute 'nodiscard' [-Wunused-result]
```

The library marks `std::async` as **[[nodiscard|nodiscard]]**, and the compiler is pointing at section 3. The output, on one machine (4 cores); the times vary by a few tenths of a millisecond between runs:

```text
[   0.1 ms] async launched
[ 200.4 ms] async result 49
[   0.0 ms] deferred created
[ 200.2 ms] deferred result 64
deferred ran on the calling thread: yes
[ 200.4 ms] after the discarded async
caught from worker: gyro 2 timeout
```

Walk through it:

1. **Async.** `std::async` returned after 0.1 ms, so `main` was free while a new thread slept. `get()` waited out the rest of the 200 ms and returned $7 \times 7 = 49$.
2. **Deferred.** Creating the future took no time at all, because nothing ran. The 200 ms were spent inside `get()`, on `main`'s own thread, which the thread-id check confirms. A deferred future is a function call postponed, not concurrency.
3. **Discarded.** The line with no variable looks like "start this and move on". It took 200.4 ms. The temporary future died at the semicolon, and its destructor waited for the whole task. The nodiscard warning was the compiler's hint.
4. **Exception.** The lambda threw on the worker thread. The exception was stored in the shared state and thrown again by `get()` in `main`, message intact.

Sanity check: every waiting line comes out near 200 ms, the sleep length, and nothing near 400 ms, because no two sleeps were ever run back to back in one wait. The 0.0 and 0.1 ms lines are the calls that did not wait.
:::

::: warning Fire and forget does not exist with std::async
`for (auto& job : jobs) std::async(std::launch::async, run, job);` runs the jobs one after another, each line waiting in the temporary future's destructor. Keep the futures in a container if you want them to run together. The lesson generalizes: if you do not keep the ticket, you wait at the counter.
:::

::: note Why the async future blocks
The alternative would be a thread still running after nothing refers to it, possibly touching local variables of a function that has already returned. Blocking in the destructor keeps the rule that no thread outlives the objects it uses, the same reason `std::jthread` joins in its destructor. The price is the surprise above, and it is a well-known **[[trap|meyers]]**.
:::

## A fixed crew: the thread pool

`std::async` with the async policy starts a fresh thread per call. For a ground tool that is fine. For a program that must run for months with a known timing budget, it has three problems: each start costs time, each start can fail, and nothing limits how many threads exist at once.

A **thread pool** fixes all three. Create a fixed number of worker threads once. Give them a shared **task queue**, protected by a mutex, and a condition variable (lesson 05) to sleep on when the queue is empty. To submit work, wrap it in a `packaged_task`, keep its future, and push the task onto the queue. Each worker loops forever: wait for a task, take it, run it outside the lock, repeat.

::: example A four-thread pool with futures and an exception
```cpp
#include <chrono>
#include <condition_variable>
#include <cstddef>
#include <cstdio>
#include <deque>
#include <future>
#include <mutex>
#include <stdexcept>
#include <thread>
#include <utility>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(std::size_t n) {
        workers_.reserve(n);
        for (std::size_t i = 0; i < n; ++i)
            workers_.emplace_back([this] { run(); });
    }

    ~ThreadPool() {
        {
            std::lock_guard lock(m_);
            stopping_ = true;
        }
        cv_.notify_all();
        // workers_ is destroyed next: each jthread joins its worker.
    }

    template <typename F>
    auto submit(F f) -> std::future<decltype(f())> {
        using R = decltype(f());
        std::packaged_task<R()> task(std::move(f));
        std::future<R> result = task.get_future();
        {
            std::lock_guard lock(m_);
            queue_.emplace_back([t = std::move(task)]() mutable { t(); });
        }
        cv_.notify_one();
        return result;
    }

private:
    void run() {
        for (;;) {
            std::packaged_task<void()> job;
            {
                std::unique_lock lock(m_);
                cv_.wait(lock, [this] { return stopping_ || !queue_.empty(); });
                if (queue_.empty()) return;          // stopping, and nothing left
                job = std::move(queue_.front());
                queue_.pop_front();
            }
            job();                                   // run outside the lock
        }
    }

    std::mutex m_;
    std::condition_variable cv_;
    std::deque<std::packaged_task<void()>> queue_;
    bool stopping_ = false;
    std::vector<std::jthread> workers_;              // last: destroyed first
};

int main() {
    using namespace std::chrono;
    const auto t0 = steady_clock::now();
    std::vector<std::future<int>> results;
    {
        ThreadPool pool(4);
        for (int i = 0; i < 8; ++i)
            results.push_back(pool.submit([i] {
                std::this_thread::sleep_for(milliseconds(100));
                return i * i;
            }));
        auto bad = pool.submit([]() -> int { throw std::runtime_error("star tracker lost lock"); });
        for (auto& r : results) std::printf("%d ", r.get());
        std::printf("\n");
        try { bad.get(); }
        catch (const std::exception& e) { std::printf("task failed: %s\n", e.what()); }
    }   // pool destroyed: workers finish and join
    const double ms = duration<double, std::milli>(steady_clock::now() - t0).count();
    std::printf("8 tasks of 100 ms on 4 workers: %.0f ms\n", ms);
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`, on one machine (4 cores), three runs gave 201, 201 and 203 ms on the last line. One run:

```text
0 1 4 9 16 25 36 49 
task failed: star tracker lost lock
8 tasks of 100 ms on 4 workers: 201 ms
```

A build with `-fsanitize=thread` ran clean. Walk through the design:

1. **Workers start once.** The constructor starts four `jthread`s, each running `run()`. Nothing else in the program ever creates a thread.
2. **Submitting.** `submit` wraps the job in a `packaged_task<int()>` and keeps its future. The queue holds `packaged_task<void()>`, so each entry is a small lambda that owns the real task and calls it. Push under the lock, then `notify_one` wakes one sleeping worker.
3. **Waiting.** A worker uses the predicate form of `wait` from lesson 05: it sleeps until there is work or the pool is stopping, and a spurious wakeup only re-checks the predicate.
4. **Running outside the lock.** The worker moves one job out, lets go of the mutex at the closing brace, and only then runs it. Holding the lock while running would let one 100 ms job stop every other worker from taking work.
5. **Shutting down.** The destructor sets `stopping_` under the lock and wakes everyone. A worker returns only when the pool is stopping *and* the queue is empty, so queued work still finishes. Then the members are destroyed in reverse order of declaration: `workers_` first, and each `jthread` joins. That is why `workers_` is declared last.
6. **Results and errors.** Each `get()` returns its task's value in submission order, whatever order the workers ran them in. The throwing task's exception went into its `packaged_task` and came out of `bad.get()`, and the worker thread survived to run more work.

Sanity check: 8 tasks of 100 ms on 4 workers is 2 **[[waves|waves]]** of 4, so about $2 \times 100 = 200$ ms. The measured 201 ms fits. One worker would need about 800 ms; eight workers about 100 ms.
:::

## Why flight code creates its threads at start-up

A measurement makes the point. On one machine (4 cores), creating and joining an empty `std::thread` 2,000 times gave a **median** of about 35 microseconds. The slowest of the 2,000 took between about 0.4 and 2 ms, depending on the run. A 1 kHz control loop has a period of 1,000 microseconds. One unlucky thread start can eat two whole cycles.

Time is only one of the costs. Starting a thread asks the operating system for a **[[stack|thread-stack]]** and a kernel task, and either can fail: `std::thread`'s constructor then throws `std::system_error`, at the worst moment. A thread started mid-flight also has no priority chosen by anyone, and a timing analysis cannot account for work it did not know about.

So flight frameworks do what the pool does, at a larger scale. Every thread (usually called a *task*) is created during initialization, with its priority, stack size and core fixed and reviewed, and then runs a loop for the whole mission. In **[[F Prime|fprime]]**, NASA JPL's open-source flight framework, each "active component" owns one thread and one message queue created at start-up, which is a thread pool of size one per component.

::: key Threads in flight software
Create every thread once, at initialization, with a known priority and stack. Hand work to them through queues. Starting threads in the running system costs unpredictable time (on one machine: about 35 microseconds typical, up to about 2 ms worst seen), can fail, and escapes the timing analysis.
:::

::: warning The pool above still allocates
Each `submit` allocates: the `packaged_task` puts its shared state on the heap, and `std::deque` grows in blocks. That is fine at start-up or on the ground. A real-time version preallocates everything: a fixed-capacity queue of fixed-size job records, often the lock-free ring buffer of the next lesson, and results returned through preallocated slots instead of futures.
:::

## Check yourself

::: check
A function calls `auto f = std::async(compute_orbit, state);` with no policy, then checks `f.wait_for(0ms) == std::future_status::ready` in a loop, doing other work between checks. Why might this loop never end?
:::

::: answer
With no policy, the library may choose `std::launch::deferred`. Then `compute_orbit` does not run at all until someone calls `get()` or `wait()`. `wait_for` on a deferred future does not start it; it returns `std::future_status::deferred` at once. The loop compares against `ready`, which never comes. Fix it by writing `std::launch::async`, or by also handling the `deferred` status.
:::

::: check
A telemetry thread holds a `std::promise<Frame>`. On one error path it returns early without calling `set_value` or `set_exception`, and the promise is destroyed. What does the waiting thread see?
:::

::: answer
Its `get()` does not hang. The promise's destructor stores an error in the shared state, so `get()` throws `std::future_error` with the error code `broken_promise`; on this machine its `what()` is `std::future_error: Broken promise`. The waiting thread can catch it, but the real fix is in the producer: every path must set a value or an exception.
:::

::: check
In the pool, suppose the worker called `job()` while still holding `m_`. The program would still print the right numbers. What would change in the timing line, and why?
:::

::: answer
The eight 100 ms tasks would run one at a time, so the line would read about 800 ms instead of about 200 ms. While one worker holds `m_` during its 100 ms job, every other worker is stuck trying to lock `m_` to take the next task. The lock would turn four workers into one. Worse, `submit` also needs `m_`, so the submitting thread would stall too.
:::

::: check
Why is `std::vector<std::jthread> workers_;` declared after the mutex, condition variable and queue? What could go wrong if it were declared first?
:::

::: answer
Members are destroyed in reverse order of declaration. Declared last, `workers_` is destroyed first, so each `jthread` joins its worker while `m_`, `cv_` and `queue_` still exist. Declared first, it would be destroyed last: the mutex, condition variable and queue would be destroyed while the workers were still running and using them. That is a use-after-destroy, undefined behavior.
:::

::: check
Eight tasks each take 100 ms. Estimate the total time on a pool of 3 workers, and on a pool of 8.
:::

::: answer
With 3 workers the tasks go in waves: 3, then 3, then 2. That is 3 waves, about $3 \times 100 = 300$ ms. With 8 workers all eight run at once: 1 wave, about 100 ms, provided the machine has the cores to run them. These sleeping tasks use no processor, so even this 4-core machine would manage it. Tasks that compute would still be limited by the 4 cores, about 200 ms.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| `std::future<T>` | claim ticket for a later result | `get()` once; waits, then returns or throws |
| Shared state | the slot both ends reach | ready synchronizes with the `get()` that sees it |
| `std::promise<T>` | the writing end | `set_value` or `set_exception`; dropped unset gives "broken promise" |
| `std::packaged_task` | a callable plus its promise | calling it stores the return value or the exception |
| `std::async` | one-call launcher | name the policy; `async` = new thread, `deferred` = runs in `get()` |
| Async future destructor | the one that blocks | waits for the task; discarding it is not fire-and-forget |
| Thread pool | fixed workers plus a task queue | mutex, condition variable, run jobs outside the lock |
| Flight rule | threads made at initialization | thread start: about 35 µs typical, up to about 2 ms seen, on one machine |

Next lesson replaces the mutex-protected queue with something a 1 kHz control task can use without ever waiting: a lock-free single-producer, single-consumer ring buffer for telemetry.

::: context shared-state One small object, two handles
The promise and the future never talk to each other directly. They both point to one heap object that holds the result slot, the ready flag and what is needed to wake a sleeper. Whichever handle is destroyed last frees it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="90" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">promise</text>
  <rect x="130" y="25" width="100" height="66" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="45" font-size="12" text-anchor="middle" fill="#1f2a44">shared state</text>
  <text x="180" y="63" font-size="11" text-anchor="middle" fill="#6c7a93">value or error</text>
  <text x="180" y="80" font-size="11" text-anchor="middle" fill="#6c7a93">ready flag</text>
  <rect x="260" y="40" width="90" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="63" font-size="12" text-anchor="middle" fill="#1f2a44">future</text>
  <line x1="100" y1="58" x2="122" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="130,58 120,53 120,63" fill="#1f2a44"/>
  <line x1="230" y1="58" x2="260" y2="58" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="230,58 240,53 240,63" fill="#1f2a44"/>
  <text x="55" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">producer writes</text>
  <text x="305" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">consumer reads</text>
</svg>
```
:::

::: context exception-ptr An exception you can carry
An exception normally lives only while the stack unwinds in the thread that threw it. `std::exception_ptr`, from C++11, is a shared handle that keeps the exception object alive and can be copied to another thread. `std::current_exception()` makes one inside a `catch`, and `std::rethrow_exception(p)` throws the same object again elsewhere. Futures use exactly this inside.
:::

::: context nodiscard A compiler hint on return values
`[[nodiscard]]` is an attribute, standard since C++17, that asks the compiler to warn when a function's return value is ignored. Library writers put it on functions where ignoring the result is almost always a bug. g++ 13's library puts it on `std::async`, because a discarded async future turns concurrency into a silent wait. The warning is on by default; `-Werror` makes it an error.
:::

::: context meyers A classic warning
Scott Meyers' book *Effective Modern C++* (2014) devotes items to exactly these traps: one advises naming `std::launch::async` when you need real concurrency, and another explains why futures' destructors behave differently depending on where the future came from. Anthony Williams' *C++ Concurrency in Action*, listed in this module's resources, covers the same ground at length.
:::

::: context waves Two waves of four
Four workers take the first four tasks at time 0. Each finishes at about 100 ms and takes the next task from the queue. The second four finish at about 200 ms.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="30" y="34" font-size="12" text-anchor="end" fill="#1f2a44">w0</text>
  <text x="30" y="64" font-size="12" text-anchor="end" fill="#1f2a44">w1</text>
  <text x="30" y="94" font-size="12" text-anchor="end" fill="#1f2a44">w2</text>
  <text x="30" y="124" font-size="12" text-anchor="end" fill="#1f2a44">w3</text>
  <rect x="40" y="20" width="140" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="20" width="140" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="40" y="50" width="140" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="50" width="140" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="40" y="80" width="140" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="80" width="140" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="40" y="110" width="140" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="110" width="140" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <text x="110" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">task 0-3</text>
  <text x="250" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">task 4-7</text>
  <line x1="40" y1="140" x2="320" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="180" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">100 ms</text>
  <text x="320" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">200 ms</text>
</svg>
```
:::

::: context thread-stack Each thread needs its own stack
Every thread has its own stack for its local variables and function calls. On Linux with glibc, a new thread's stack defaults to the `ulimit -s` size, which is 8 MiB on this machine; that is address space reserved, and physical pages are filled in as the stack is touched. On a small real-time operating system, stacks are often a few KiB, sized by hand and sometimes placed in statically allocated memory, so creating a task never touches a heap.
:::

::: context fprime JPL's open-source flight framework
F Prime (F´) is a flight software framework from NASA's Jet Propulsion Laboratory, released as open source and flown on the Ingenuity Mars helicopter. Software is built from components connected by ports. A *passive* component runs on its caller's thread; an *active* component owns a thread and a message queue, and processes messages from its queue in order. All of them are created and connected during start-up. NASA Goddard's cFS follows the same idea: each application runs as a task created when the system starts.
:::
