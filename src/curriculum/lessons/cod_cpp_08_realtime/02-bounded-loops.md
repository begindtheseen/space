---
id: l02-bounded-loops
title: Bounded loops
minutes: 22
covers:
  - Bounded loops and why every loop needs a provable upper bound
---

A recipe says "stir until the sauce thickens". A good cook adds a second rule without thinking about it: if it has not thickened after twenty minutes, stop stirring, because something is wrong — the heat is off, or you forgot the flour. Without that second rule you could stand at the stove forever.

Flight code is full of "stir until" loops. Repeat a calculation until the answer stops changing. Wait until a sensor says its data is ready. Walk a list until you reach the end. Each one stops only when the world cooperates. This lesson is about the cook's second rule: every loop gets a hard maximum number of passes, written into the code, so that nothing the world does can keep it spinning.

In the last lesson you saw that a timing budget needs every task's **worst-case execution time** (WCET). A loop's worst case is its maximum number of passes times the worst time of one pass. If there is no maximum, there is no WCET, and the frame has no guarantee. That is why the NASA/JPL coding rules make loop bounds their second rule, right after banning the kinds of control flow that make programs impossible to follow.

## The first two rules

In 2006, Gerard Holzmann of NASA's Jet Propulsion Laboratory published ten short rules for safety-critical code, known as the **[[Power of Ten|power-of-ten]]**. Lesson 11 goes through all ten. The first two are about control flow — the paths a program can take.

**Rule 1: simple control flow.** No `goto`, no `setjmp`/`longjmp`, and no recursion.

- **`goto`** jumps to a label anywhere in the function. Used freely, it makes a tangle of paths that is hard for a human to follow and hard for a tool to analyze. It has a **[[famous history|goto-letter]]**.
- **[[setjmp and longjmp|setjmp-longjmp]]** are a pair of C library functions that jump from deep inside one function straight back to an earlier point in a *different* function, skipping everything in between. In C++ that can skip destructors — the cleanup code that RAII depends on — and the language says the behavior is undefined when it does.
- **Recursion** — a function calling itself, directly or through others — puts a cycle in the **call graph**, the map of which function calls which. A cycle has no longest path, so neither the stack depth nor the time can be bounded without extra knowledge. Lesson 3 takes this apart.

**Rule 2: every loop has a fixed upper bound.** It must be possible for a checking tool to prove, without running the program, that the loop cannot exceed some number of passes. If the tool cannot prove it, the rule counts as broken — even if the loop happens to be fine.

::: key
Power of Ten rules 1 and 2: restrict all code to simple control flow — no goto, setjmp/longjmp, or recursion. Give every loop a fixed, statically provable upper bound. Together they make the call graph and the execution time analysable.
:::

Two words in rule 2 do the work. **Fixed** means the bound is a number known when the code is compiled — a constant — not something that arrives at run time. **Statically provable** means a tool reading the code can see it, without running anything. "Statically" is the opposite of "at run time". It is not enough that the loop *does* stop in every test you ran. It must be *obvious from the text* that it stops.

::: note Why a tool cannot just figure it out
Why not let a clever tool work out whether any loop stops? Because no tool can do that for every program. In 1936 Alan Turing proved that no general procedure can decide, for every program and input, whether it eventually stops — the **[[halting problem|halting-problem]]**. So tools only prove termination for loops written in simple, recognizable shapes. Rule 2 asks you to write every loop in such a shape. You give up nothing real: any loop with a genuine maximum can be written that way.
:::

## Loops that are already bounded

Many loops already obey rule 2 because their shape proves it.

- A counting loop with a constant limit: `for (int i = 0; i < 64; ++i)`. The counter starts at a known value, moves by a known step, is not changed inside the body, and stops at a constant. The bound is 64.
- A range-based `for` over a `std::array<double, 6>`: the size is part of the type, so the bound is 6.
- A loop over a fixed-size container whose capacity is a compile-time constant, like the pools in lesson 4.

A checker recognizes these instantly. The trouble starts with loops whose exit depends on data.

## Loops that stop when the world says so

There are three common kinds.

1. **Converge-until-small.** Repeat an improvement step until the change is tiny. Solving equations with Newton's method, iterating a filter, refining an estimate.
2. **Wait-until-ready.** Keep reading a hardware status bit until a device says it is done. This is **polling**.
3. **Walk-until-end.** Follow `next` pointers until one is `nullptr`.

Each is correct *if* the world behaves: the math converges, the device answers, the list ends. The rule says: do not bet the vehicle on that. Add a counter with a constant maximum, and decide in advance what happens if the maximum is reached. Reaching it is not "the loop ended". It is a **fault** — a sign that something is broken — and the code must report it so the rest of the system can respond.

The pattern is always the same:

1. Pick a constant maximum from the physics, the data sheet or the data structure's capacity, with some room.
2. Turn the loop into a counting loop up to that maximum.
3. Keep the natural exit test inside, and leave as soon as it is met.
4. After the loop, if the natural exit never happened, return a fault status.

::: example Kepler's equation with a bounded Newton loop
Orbit software constantly solves **[[Kepler's equation|kepler-equation]]**, $M = E - e \sin E$. Here $M$ (the "mean anomaly") tells you how far along the orbit the spacecraft is in *time*, $e$ is the orbit's eccentricity (how stretched the ellipse is, from 0 for a circle toward 1), and $E$ (the "eccentric anomaly") is the angle you want. There is no formula that gives $E$ directly, so you guess and improve it with **[[Newton's method|newton-picture]]**:

$$
E_{\text{new}} = E - \frac{E - e \sin E - M}{1 - e \cos E}.
$$

Read the fraction as "how wrong we are, divided by how fast the wrongness changes". Each pass usually roughly doubles the number of correct digits. Here is a bounded version:

```cpp
#include <cmath>
#include <cstdio>

// Solve Kepler's equation  M = E - e*sin(E)  for E, by Newton's method.
// The loop has a fixed, compile-time upper bound. Running out of
// iterations is reported, not ignored.
constexpr int    kMaxIter = 12;
constexpr double kTol     = 1e-12;

struct KeplerResult {
    double E;          // eccentric anomaly, rad
    int    iters;      // Newton steps used
    bool   converged;  // false means: treat as a fault
};

KeplerResult solve_kepler(double M, double e) {
    double E = (e < 0.8) ? M : 3.141592653589793;     // standard starting guess
    for (int k = 1; k <= kMaxIter; ++k) {             // bound: at most 12 passes
        double f  = E - e * std::sin(E) - M;          // how far off we are
        double fp = 1.0 - e * std::cos(E);            // slope of f
        double dE = f / fp;
        E -= dE;
        if (std::fabs(dE) < kTol) return {E, k, true};
    }
    return {E, kMaxIter, false};                      // bound reached: fault path
}

int main() {
    const double cases[][2] = {{1.0, 0.0167}, {1.0, 0.5}, {0.2, 0.9}, {0.05, 0.99}};
    for (const auto& c : cases) {
        KeplerResult r = solve_kepler(c[0], c[1]);
        std::printf("M = %.2f  e = %.4f  ->  E = %.9f  in %2d steps  %s\n",
                    c[0], c[1], r.E, r.iters, r.converged ? "ok" : "FAULT");
    }
    KeplerResult bad = solve_kepler(1.0, std::nan(""));   // corrupted input
    std::printf("M = 1.00  e = nan     ->  E = %f  in %2d steps  %s\n",
                bad.E, bad.iters, bad.converged ? "ok" : "FAULT");
    return 0;
}
```

Built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
M = 1.00  e = 0.0167  ->  E = 1.014179087  in  3 steps  ok
M = 1.00  e = 0.5000  ->  E = 1.498701134  in  5 steps  ok
M = 0.20  e = 0.9000  ->  E = 0.911235005  in  7 steps  ok
M = 0.05  e = 0.9900  ->  E = 0.645891457  in  8 steps  ok
M = 1.00  e = nan     ->  E = nan  in 12 steps  FAULT
```

**Step 1: read the healthy rows.** Earth's orbit ($e = 0.0167$, nearly a circle) needs 3 passes. A very stretched orbit ($e = 0.99$) needs 8. Harder problems take more passes, but all finish well under 12.

**Step 2: check an answer.** For the first row, put $E = 1.014179087$ back in: $1.014179087 - 0.0167 \times \sin(1.014179087) = 1.014179087 - 0.0167 \times 0.849047 \approx 1.000000$, which is $M$. Correct.

**Step 3: read the last row.** A corrupted eccentricity arrived as NaN, "not a number". Every calculation with NaN gives NaN, and every comparison with NaN is false, so `fabs(dE) < kTol` is never true. The loop ran its 12 passes and returned `converged = false`. The caller now knows the answer is garbage and can use the last good value or raise a fault.

**Step 4: the WCET.** If one pass takes at most $0.4\,\mu\mathrm{s}$ on the flight processor, the whole solve takes at most $12 \times 0.4 = 4.8\,\mu\mathrm{s}$. That number exists only because the loop has a bound.

**Sanity check.** Why 12 and not 8? The worst healthy case needed 8, and the bound needs room for inputs near the edges that were not tested. Twelve costs almost nothing in the budget and still stops a runaway quickly.
:::

Now remove the bound and see what the same NaN does.

```cpp laptop
#include <cmath>
#include <cstdio>

// The same solver with no bound: it stops only when the step gets small.
double solve_kepler_unbounded(double M, double e) {
    double E = M;
    for (;;) {
        double dE = (E - e * std::sin(E) - M) / (1.0 - e * std::cos(E));
        E -= dE;
        if (std::fabs(dE) < 1e-12) return E;   // NaN < 1e-12 is always false
    }
}

int main() {
    std::printf("good input: E = %.9f\n", solve_kepler_unbounded(1.0, 0.5));
    std::fflush(stdout);
    std::printf("bad input:  E = %.9f\n", solve_kepler_unbounded(1.0, std::nan("")));
    return 0;
}
```

Run under `timeout 3`, which kills a program after three seconds, followed by `echo "exit status $?"` to print how it ended:

```text
good input: E = 1.498701134
exit status 124
```

The good input works. The bad input never returns — status 124 is `timeout` reporting that it had to kill the program. On a flight computer there is no `timeout` command. The task would hang, the frame would never finish, and the only thing left to save the vehicle would be the watchdog of lesson 6.

::: warning
A convergence loop can fail to stop even with good numbers. If the tolerance is smaller than the spacing between neighboring `double` values near the answer, the step may never get that small: the estimate bounces between two neighbors forever. A tolerance of `1e-12` on an angle of about 1 radian is fine; a tolerance of `1e-17` would ask for more precision than a `double` has. The bound catches this case too.
:::

## Waiting for hardware, with a limit

Hardware talks to software through **[[status registers|status-register]]** — special memory addresses whose bits the device sets. A driver that needs a fresh sample from an **ADC** (analog-to-digital converter, the chip that turns a voltage into a number) starts a conversion and then waits for the "ready" bit. The natural loop is "while not ready, check again". If the ADC has failed, that loop never ends.

::: example A bounded wait on a device that might be dead
The data sheet says the ADC is ready within 40 checks. We allow 100 and treat anything more as a fault. The `FakeAdc` stands in for the real register so the code runs on a desktop.

```cpp
#include <cstdint>
#include <cstdio>

// A stand-in for a hardware status register. On a real board this would be
// a volatile read of a fixed address; here it becomes ready after some polls.
struct FakeAdc {
    int polls_until_ready;                 // -1 means: broken, never ready
    bool ready() {
        if (polls_until_ready < 0) return false;
        if (polls_until_ready == 0) return true;
        --polls_until_ready;
        return false;
    }
    std::uint16_t sample() const { return 2048; }
};

enum class Status { Ok, Timeout };

constexpr int kMaxPolls = 100;             // from the data sheet: ready within 40 polls

Status read_adc(FakeAdc& adc, std::uint16_t& out, int& polls_used) {
    for (int n = 1; n <= kMaxPolls; ++n) { // bounded wait
        if (adc.ready()) {
            out = adc.sample();
            polls_used = n;
            return Status::Ok;
        }
    }
    polls_used = kMaxPolls;
    return Status::Timeout;                // the caller raises a fault
}

int main() {
    FakeAdc healthy{23};
    FakeAdc stuck{-1};
    std::uint16_t value = 0;
    int polls = 0;

    Status s1 = read_adc(healthy, value, polls);
    std::printf("healthy: %s after %d polls, value %u\n",
                s1 == Status::Ok ? "Ok" : "Timeout", polls, static_cast<unsigned>(value));

    Status s2 = read_adc(stuck, value, polls);
    std::printf("stuck:   %s after %d polls\n",
                s2 == Status::Ok ? "Ok" : "Timeout", polls);
    return 0;
}
```

```text
healthy: Ok after 24 polls, value 2048
stuck:   Timeout after 100 polls
```

**Step 1.** The healthy ADC needed 23 "not yet" answers, so it was ready on check 24 — inside the data sheet's 40.

**Step 2.** The stuck ADC never answered. The loop stopped at exactly 100 checks and returned `Timeout`.

**Step 3: the worst case.** If one check takes $0.05\,\mu\mathrm{s}$, the longest this function can ever wait is $100 \times 0.05 = 5\,\mu\mathrm{s}$, healthy or dead. That goes in the frame budget.

**Sanity check.** The bound, 100, is 2.5 times the data sheet's 40. Too tight a bound would raise false faults on a slow-but-healthy part; too loose a bound would waste frame time before noticing a dead one. Engineers pick it from the specification, not from how long their test board happened to take.
:::

The same shape handles any "wait while" loop that depends on the outside world: wait while a valve is still moving, while a radio is still sending, while a memory chip is still busy writing. Count, cap, and turn the cap into a fault the rest of the system can see.

## Walking a list, with a limit

A linked list ends when a `next` pointer is `nullptr`. If one pointer is corrupted — by a bug, or by a **[[radiation-flipped bit|bit-flip-bridge]]** — it can point back into the list, and a walk to the end never ends. The bound comes from the data structure itself: a list built from a pool of 16 nodes can never hold more than 16.

```cpp
#include <cstddef>
#include <cstdio>

struct Node { int id; Node* next; };

constexpr std::size_t kMaxNodes = 16;          // the pool never holds more than this
Node pool[kMaxNodes];

// Returns the number of nodes, or -1 if the list is longer than the pool
// could ever hold, which can only mean it is corrupted (a loop in the links).
int count_nodes(const Node* head) {
    std::size_t n = 0;
    for (const Node* p = head; p != nullptr; p = p->next) {
        if (++n > kMaxNodes) return -1;       // bound: kMaxNodes passes at most
    }
    return static_cast<int>(n);
}

int main() {
    for (std::size_t i = 0; i < 5; ++i) pool[i] = {static_cast<int>(i), &pool[i + 1]};
    pool[4].next = nullptr;
    std::printf("healthy list: %d nodes\n", count_nodes(&pool[0]));
    pool[4].next = &pool[1];                   // a flipped pointer makes a cycle
    std::printf("corrupt list: %d\n", count_nodes(&pool[0]));
    return 0;
}
```

```text
healthy list: 5 nodes
corrupt list: -1
```

Notice that the bound does double duty. It guarantees the time, *and* it detects corruption: a count above the capacity is impossible in a healthy system, so it is proof something is wrong.

## Loops that look bounded but are not

The counter pattern only works if the counter can actually reach the limit. Two classic slips defeat it, and both compile. Here they are with the warnings g++ gives at `-Wall -Wextra`:

```cpp
#include <cstdint>

double sum_samples(const double* x) {
    double s = 0.0;
    for (std::uint8_t i = 0; i < 300; ++i) {   // meant: 300 samples
        s += x[i];
    }
    return s;
}

void clear_backwards(double* x, unsigned n) {
    for (unsigned i = n - 1; i >= 0; --i) {    // meant: n-1 down to 0
        x[i] = 0.0;
    }
}
```

```text
wrap.cpp: In function 'double sum_samples(const double*)':
wrap.cpp:5:32: warning: comparison is always true due to limited range of data type [-Wtype-limits]
    5 |     for (std::uint8_t i = 0; i < 300; ++i) {   // meant: 300 samples
      |                              ~~^~~~~
wrap.cpp: In function 'void clear_backwards(double*, unsigned int)':
wrap.cpp:12:32: warning: comparison of unsigned expression in '>= 0' is always true [-Wtype-limits]
   12 |     for (unsigned i = n - 1; i >= 0; --i) {    // meant: n-1 down to 0
      |                              ~~^~~~
```

The first counter is a `std::uint8_t`, which holds 0 to 255. After 255 it **[[wraps around|wraparound]]** to 0, so it is always less than 300 and the loop never ends. The second counter is `unsigned`, which can never be negative, so `i >= 0` is always true; after 0 it wraps to about 4.29 billion.

::: warning
Rule 2 is about what can be *proved*, so anything that muddies the proof breaks it: changing the counter inside the loop body, a limit read from a variable that can change (an uplinked command, a configuration file), or a counter type too small for the limit. If the limit must come from outside, check it against a constant maximum *before* the loop and reject anything larger. Then the constant is the bound.
:::

## The one loop that must never end

A flight computer's main loop — "wait for the frame tick, run the tasks, repeat" — is supposed to run forever. Holzmann's rule 2 covers this case in reverse: for a loop meant *not* to stop, it should be provable that it *cannot* stop. Write it as `for (;;)` with no `break` or `return` inside, so a reader and a tool can both see that the only way out is a reset. Every loop inside the tasks it calls is still bounded.

::: example Timing a frame that contains bounded loops
One 1 kHz frame runs the Kepler solver for 3 satellites in a formation and reads 6 ADC channels. Use the worst cases from the two examples: $4.8\,\mu\mathrm{s}$ per Kepler solve and $5\,\mu\mathrm{s}$ per ADC read.

**Step 1.** Kepler: $3 \times 4.8 = 14.4\,\mu\mathrm{s}$.

**Step 2.** ADC: $6 \times 5 = 30\,\mu\mathrm{s}$.

**Step 3.** Total worst case: $14.4 + 30 = 44.4\,\mu\mathrm{s}$, and $44.4 / 1000 = 0.0444$ — just 4.44 percent of a 1 ms frame.

**Sanity check.** Even if every ADC is dead and every solve gets NaN in the same frame, these loops cannot use more than 44.4 µs. Without bounds, one dead ADC would use the whole frame, and the next one, and every one after.
:::

## Check yourself

::: check
Which of these loops satisfy rule 2 as written? (a) `for (int i = 0; i < 8; ++i)` over a gyro array; (b) `while (!flash_write_done())`; (c) `for (int i = 0; i < cmd.count; ++i)` where `cmd` came from the ground; (d) a range `for` over `std::array<float, 32>`.
:::

::: answer
(a) and (d) satisfy it: the limit is a constant (8) or part of the type (32), the counter is not changed inside, and a tool can read the bound off the text. (b) does not: it stops only if the flash chip says so, and a failed chip never does. Fix it with a counter up to a constant from the data sheet and a fault return. (c) does not: `cmd.count` can be any `int`, up to about 2.1 billion. Fix it by checking `cmd.count <= kMaxCount` before the loop and rejecting the command otherwise; then `kMaxCount` is the bound.
:::

::: check
A bounded loop has a limit of 50 passes and each pass takes at most 2 µs. What is its WCET, and what does the code do on pass 51?
:::

::: answer
The WCET is $50 \times 2 = 100\,\mu\mathrm{s}$. There is no pass 51: the loop stops after pass 50 whether or not its natural exit happened. If it did not, the code reports a fault status — such as `Timeout` or `converged = false` — so the caller can react, for example by using the last good value, switching to a backup sensor, or asking the fault-management software to act.
:::

::: check
Why is `setjmp`/`longjmp` especially dangerous in C++, beyond making control flow hard to follow?
:::

::: answer
`longjmp` jumps back to where `setjmp` was called, possibly several function calls up, without running the normal returns in between. In C++ those returns are where destructors run: a lock guard releases its mutex, a pool handle returns its slot. Skipping them leaks resources or leaves locks held, and when a skipped destructor would have done real work the C++ standard says the behavior is undefined. So it breaks both analyzability (a jump the call graph does not show) and RAII.
:::

::: check
A loop is written `for (std::uint16_t i = 0; i < 70000; ++i)`. Is it bounded? What would g++ at `-Wall -Wextra` say?
:::

::: answer
It is not bounded. A `std::uint16_t` holds 0 to 65,535. After 65,535 it wraps to 0, so `i < 70000` is always true and the loop runs forever. g++ warns "comparison is always true due to limited range of data type" (`-Wtype-limits`, turned on by `-Wextra`). The fix is a counter type that can hold the limit, such as `std::uint32_t` or `int`.
:::

::: check
Your teammate says: "The Newton loop always converges in under 10 passes in our tests, so a bound is pointless." Give two reasons they are wrong.
:::

::: answer
First, tests only show the inputs that were tried. A corrupted input such as NaN, or a tolerance smaller than `double` precision allows, can stop convergence entirely — the unbounded version in this lesson hung forever on NaN. Second, rule 2 is about what can be *proved*: without a constant bound, no tool can compute a WCET, so the frame budget has no guarantee even if the loop is fine in practice. The bound costs a counter and a comparison; the test results tell you what number to choose, not whether to have one.
:::

## Summary

| Idea | Meaning | Fact to remember |
| --- | --- | --- |
| Rule 1 | simple control flow | no goto, setjmp/longjmp, or recursion |
| Rule 2 | every loop has a fixed, statically provable bound | a constant a tool can read, not a run-time value |
| Loop WCET | worst time of the whole loop | bound × worst time per pass |
| Bounded pattern | count to a constant, keep the natural exit inside | reaching the bound is a fault, reported to the caller |
| Choosing the bound | from physics, data sheet or capacity, with room | Kepler: 8 needed, 12 allowed; ADC: 40 specified, 100 allowed |
| Bound as detector | a count above capacity means corruption | list of a 16-node pool that counts 17 is broken |
| Hidden unbounded loops | counter too small, unsigned `>= 0`, counter changed in body | `-Wtype-limits` in `-Wextra` catches the first two |
| Main loop | meant never to end | `for (;;)` with no way out except reset |

Rule 1 also bans recursion, because a cycle in the call graph has no deepest point. Next, in *Stack depth and no recursion*, you will add up a call graph's stack use, see what breaks the sum, and measure the real high-water mark on a running task.

::: context power-of-ten Ten rules on four pages
Gerard Holzmann led the Laboratory for Reliable Software at NASA's Jet Propulsion Laboratory. His paper "The Power of Ten — Rules for Developing Safety-Critical Code" appeared in the magazine IEEE Computer in 2006. It is short on purpose: ten rules that a tool can check, instead of hundreds that people forget. It was written for C, but its ideas carry straight into C++ flight code, and JPL built its own institutional coding standard around them.
:::

::: context goto-letter A letter that changed programming
In 1968 the Dutch computer scientist Edsger Dijkstra published a short letter in the journal *Communications of the ACM* under the title "Go To Statement Considered Harmful". His point: a program is easier to understand when its text shows its paths — blocks, loops, function calls — than when control can leap anywhere. The phrase "considered harmful" became a running joke in computing, used in hundreds of later paper titles.
:::

::: context setjmp-longjmp A bookmark you can jump back to
`setjmp` saves a snapshot of where the program is — which instruction, where the stack top is — into a buffer, and returns 0. Later, possibly several calls deeper, `longjmp` with that buffer throws the program back to the snapshot, and `setjmp` appears to return a second time, now with a nonzero value. C programmers used it as a crude form of error handling. C++ has exceptions for that job, and flight code often disables those too, preferring plain status returns.
:::

::: context halting-problem The question no program can answer
Turing imagined a program that could look at any other program and say "this one halts" or "this one runs forever". He showed that such a checker leads to a contradiction: build a program that asks the checker about itself and then does the opposite. So no general checker exists. What *does* exist are checkers for restricted shapes, such as "a counter from 0 up to a constant, changed only by `++`". Rule 2 keeps every loop inside a shape the checkers can handle.
:::

::: context kepler-equation Where the spacecraft is on its ellipse
Johannes Kepler found this equation in the early 1600s. Time along an orbit is easy to track: the mean anomaly $M$ grows at a steady rate. But the spacecraft does not move at a steady rate — it speeds up near the planet and slows down far away. The equation links the steady "clock" $M$ to the angle $E$ that tells you the actual position. You will solve it for real in the orbital mechanics modules; flight software solves it every time it predicts where a satellite will be.
:::

::: context newton-picture Sliding down the tangent
Newton's method replaces the curve with its straight tangent line at your current guess and asks where that line hits zero. That point is the next guess. Near the answer, each step roughly doubles the number of correct digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="350" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40.0,180.0 55.0,179.6 70.0,178.4 85.0,176.4 100.0,173.6 115.0,170.0 130.0,165.6 145.0,160.4 160.0,154.4 175.0,147.6 190.0,140.0 205.0,131.6 220.0,122.4 235.0,112.4 250.0,101.6 265.0,90.0 280.0,77.6 295.0,64.4 310.0,50.4 325.0,35.6 340.0,20.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="325" y1="36" x2="206.25" y2="150" stroke="#f2b880" stroke-width="2"/>
  <line x1="310" y1="50.4" x2="310" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="310" cy="50.4" r="4" fill="#1f2a44"/>
  <circle cx="206.25" cy="150" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="169.9" cy="150" r="4" fill="#b4232c"/>
  <text x="310" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">guess</text>
  <text x="214" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">next guess</text>
  <text x="150" y="140" font-size="11" text-anchor="middle" fill="#b4232c">answer</text>
  <text x="300" y="20" font-size="11" text-anchor="end" fill="#1d6fd1">f(E)</text>
</svg>
```

The orange tangent lands much closer to the red answer than the first guess was. Repeat from there.
:::

::: context status-register Bits a device sets for you
A status register is a small word of bits at a fixed address. Each bit means something the data sheet defines — "conversion done", "error", "busy". Software reads the word and tests one bit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="35" width="40" height="36" fill="#ffffff"/><rect x="60" y="35" width="40" height="36" fill="#ffffff"/>
    <rect x="100" y="35" width="40" height="36" fill="#ffffff"/><rect x="140" y="35" width="40" height="36" fill="#ffffff"/>
    <rect x="180" y="35" width="40" height="36" fill="#ffffff"/><rect x="220" y="35" width="40" height="36" fill="#f2b880"/>
    <rect x="260" y="35" width="40" height="36" fill="#ffffff"/><rect x="300" y="35" width="40" height="36" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="28">7</text><text x="80" y="28">6</text><text x="120" y="28">5</text><text x="160" y="28">4</text>
    <text x="200" y="28">3</text><text x="240" y="28">2</text><text x="280" y="28">1</text><text x="320" y="28">0</text>
    <text x="240" y="58">1</text><text x="320" y="58">1</text>
  </g>
  <text x="320" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">READY</text>
  <text x="240" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">ERROR</text>
</svg>
```

Because the device, not the program, changes these bits, C++ code reads them through a `volatile` pointer so the compiler does not assume the value stays the same between reads.
:::

::: context bit-flip-bridge When a bit changes by itself
In space, a charged particle passing through a memory chip can flip one bit — a **single-event upset**. If that bit is in a pointer, the pointer suddenly points somewhere else, possibly back into its own list. Bounded loops turn that into a detectable fault instead of a hang. Lesson 8 covers radiation effects and the other software defenses against them.
:::

::: context wraparound Counting on a clock face
An unsigned counter behaves like a clock: after the largest value it goes back to 0. An 8-bit counter's "clock" has 256 marks, 0 to 255, so it can never reach 300.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="300" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="80">0</text><text x="120" y="80">100</text><text x="210" y="80">200</text><text x="285" y="80">255</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="54" x2="30" y2="66"/><line x1="120" y1="54" x2="120" y2="66"/><line x1="210" y1="54" x2="210" y2="66"/><line x1="285" y1="54" x2="285" y2="66"/>
  </g>
  <path d="M285,50 C285,15 30,15 30,50" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="30,52 25,42 35,42" fill="#b4232c"/>
  <text x="158" y="28" font-size="11" text-anchor="middle" fill="#b4232c">255 + 1 wraps to 0</text>
  <line x1="330" y1="45" x2="330" y2="75" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="330" y="96" font-size="11" text-anchor="middle" fill="#6c7a93">300</text>
  <text x="180" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">the counter never gets past 255</text>
</svg>
```
:::
