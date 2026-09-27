---
id: l04-the-machine-the-deadline-and-the-forbidden-list
title: "The machine, the deadline, and why the loop forbids the heap"
minutes: 22
covers:
  - "flight computers: embedded Linux, a roughly 3.2 series kernel with real-time patches, on Dragon, Falcon and Starship primary flight computers"
  - determinism, fixed-step integration and bounded execution time in a flight control loop
  - why dynamic allocation, unbounded loops and exceptions are avoided in the control path
---

Picture a drummer keeping time for a band. It does not matter how good one beat sounds if it lands late. A drummer who is right on time 999 beats out of 1,000, and then freezes for half a second, has wrecked the song.

A flight control loop is that drummer. Every constraint in this lesson traces back to one sentence: **the loop must finish its work inside a fixed time budget, every single cycle, with no exception for a hard case.** Not on average. Every time. Taken seriously, that one rule knocks out a surprisingly long list of techniques that are ordinary in other software. This lesson starts with the machine the code runs on and works up to what the control path forbids.

This is also where **deployment** — the fourth verb in the job description from the first lesson of this module — stops being abstract. Flight code does not land on a relaxed, forgiving computer that lets a program run a little long this cycle and catch up next time. It lands on a real machine, with a real scheduler, running a loop that a real vehicle depends on.

## The machine: an ordinary computer, taught to keep time

A **flight computer** is the computer on board that runs guidance, navigation and control. You might imagine a tiny, bare chip running nothing but your control loop. In most modern practice it is not. It is often a capable, general-purpose processor running a general-purpose **operating system** — the layer of software that shares the processor, memory and devices among programs. Commonly that operating system is a build of **Linux**.

Why carry a full operating system into the sky? Because it brings a lot for free: standard tools for building code, standard drivers for hardware, networking, file systems for logging and telemetry, and a huge base of already-tested software. A bare-metal system would have to rebuild all of that from scratch.

The catch lives in the **[[kernel|kernel-word]]** — the core of the operating system that decides which program runs when. A stock Linux kernel is built to be fair and efficient across many programs at once. To get there, it has some stretches of code — certain locks, certain parts of interrupt handling — that are not **preemptible**: once they start, nothing can interrupt them, not even a more urgent task. So a low-priority task can, in principle, hold the processor longer than a high-priority task can afford to wait.

For a laptop, that is a fine trade. For a control loop with a hard deadline, an open-ended delay of even a few milliseconds can mean a missed cycle.

### Real-time patching

The general industry answer is **real-time patching**: a set of changes to the kernel that make it keep time. The best-known public example is the **[[PREEMPT_RT|preempt-rt]]** patch line (said "pre-empt R T"). It does three things:

1. It makes nearly all of the kernel preemptible, so an urgent task can cut in almost anywhere.
2. It turns ordinary spinning locks into sleeping locks that respect task priority.
3. Together, these put a bound — a known ceiling — on the delay between an event happening and a high-priority task getting to respond.

The result is a general-purpose operating system that behaves, for scheduling purposes, close enough to a dedicated **real-time operating system** (an RTOS, said "R-toss") to trust with a hard-deadline loop.

### What is reported about SpaceX flight computers

Public reporting says the primary flight computers on **Dragon, Falcon and Starship** run **embedded Linux** — Linux trimmed and built into a dedicated device — on a **[[3.2 series kernel|kernel-3-2]]** with real-time patches, with the flight software written in C++. The module's cards ask you to know this, so here it is plainly:

::: key
What runs on the flight computers? Embedded Linux, reported as a 3.2 series kernel with real-time patches, on Dragon, Falcon and Starship primary flight computers, with flight software in C++.
:::

Hold the version number loosely. It is a snapshot of a moment, not a law. Kernels get upgraded, and hardware changes between vehicle generations. A detail like that is something you confirm with an employer when it matters, not something a self-study course can hand you as settled fact.

What lasts is the pattern and the reason for it. Real-time patching is a genuine, general technique. Aerospace, robotics and factory control all use it. It is also not the only answer. Some flight computers run a dedicated RTOS with no general-purpose kernel underneath at all. Which approach a given employer or vehicle uses varies, and it is worth asking about directly.

::: key
A hard real-time control loop needs bounded worst-case scheduling latency, which a stock general-purpose kernel does not guarantee by default. Real-time patching (the PREEMPT_RT line is the well-known public example) is one genuine, widely used way to get that guarantee out of a general-purpose operating system such as Linux; a dedicated real-time operating system is the other. Which one a specific employer uses varies, and specific kernel version numbers are not durable facts to memorize.
:::

## Determinism and the deadline

A loop is **deterministic** when two things are true:

- the same inputs always produce the same outputs, and
- they always do so within the same bounded amount of time.

People forget the second half. A control law that computes exactly the right answer, forty milliseconds late, is not a working control law. The vehicle has moved on. The situation the answer was computed for no longer exists — like a goalkeeper who dives perfectly to where the ball *was*.

Now put numbers on it. A loop running at **[[1 kHz|one-khz-frame]]** (said "one kilohertz" — one thousand times per second) has a **period** of $1/1000\,\mathrm{s} = 1\,\mathrm{ms}$. Each cycle it must:

1. sample the sensors,
2. compute the control law,
3. send commands to the actuators,
4. be ready to do it all again.

All four have to fit inside that one millisecond, every time. That includes the worst case, even if it only shows up once in ten million cycles.

### Fixed step versus adaptive step

Sometimes the control law has to push a state forward in time inside the loop — to predict where the vehicle will be a moment from now. That calls for an **integrator**: a routine that steps a set of equations forward in small time slices. There are two families.

- A **fixed-step** integrator uses one step size, $\Delta t$ (said "delta t"), chosen once at design time. Covering a span $T$ always takes $T/\Delta t$ steps.
- An **adaptive** integrator chooses its step size while it runs. It takes big steps where the solution is smooth and small ones where it changes fast, based on an estimate of its own error.

Adaptive stepping is clever, but look at what it means for timing: the number of steps, and so the amount of computing, depends on the data. Flight control needs the opposite.

::: key
Fixed-step versus adaptive integration in flight: flight control runs at a fixed rate because the schedule must be deterministic. Adaptive step-size integrators have data-dependent runtime and are used in analysis and simulation, not in the flight loop.
:::

::: example An adaptive integrator's runtime depends on the data; a fixed-step one does not
Take one system — a **[[Van der Pol oscillator|van-der-pol]]**, a classic test equation that swings back and forth with fast and slow stretches — and start it from three different places. First, SciPy's adaptive `solve_ivp`:

```python
from scipy.integrate import solve_ivp

def vdp(t, y, mu):
    x, xd = y
    return [xd, mu*(1 - x**2)*xd - x]

for y0 in ([2.0, 0.0], [0.5, 0.0], [3.5, 1.0]):
    sol = solve_ivp(vdp, [0, 20], y0, args=(1.5,), method="RK45", rtol=1e-6, atol=1e-9)
    print(y0, "-> steps:", sol.t.size - 1, " derivative calls:", sol.nfev)
# [2.0, 0.0] -> steps: 209  derivative calls: 1628
# [0.5, 0.0] -> steps: 208  derivative calls: 1634
# [3.5, 1.0] -> steps: 220  derivative calls: 1592
```

Same equation, same 20-second span, three different amounts of work. (`sol.t` lists every time point including the start, so the number of steps is its size minus one.) The step counts differ, and so do the derivative calls — the real cost — because rejected-and-retried steps count too. Notice that the run with the fewest steps did not do the least work. You cannot even predict the cost from the step count.

Now a **[[fixed-step RK4|rk4-steps]]** integrator (said "R K four") over the same span with $\Delta t = 0.001\,\mathrm{s}$:

```python
def rk4_fixed(f, y0, t0, t1, dt, *args):
    n = int(round((t1 - t0) / dt))      # step count fixed by dt and the span
    y, t = list(y0), t0
    for _ in range(n):
        k1 = f(t, y, *args)
        k2 = f(t + dt/2, [a + dt/2*b for a, b in zip(y, k1)], *args)
        k3 = f(t + dt/2, [a + dt/2*b for a, b in zip(y, k2)], *args)
        k4 = f(t + dt, [a + dt*b for a, b in zip(y, k3)], *args)
        y = [a + dt/6*(b1 + 2*b2 + 2*b3 + b4)
             for a, b1, b2, b3, b4 in zip(y, k1, k2, k3, k4)]
        t += dt
    return n, y

for y0 in ([2.0, 0.0], [0.5, 0.0], [3.5, 1.0]):
    n, _ = rk4_fixed(vdp, y0, 0.0, 20.0, 0.001, 1.5)
    print(y0, "-> steps:", n)
# [2.0, 0.0] -> steps: 20000
# [0.5, 0.0] -> steps: 20000
# [3.5, 1.0] -> steps: 20000
```

Sanity check: $20\,\mathrm{s} / 0.001\,\mathrm{s} = 20{,}000$ steps, and at four derivative calls per step that is exactly $80{,}000$ calls, whatever the starting point. The work was set by $\Delta t$ and the span, not by the solution.

The adaptive method is right for an analysis tool, where you want an accurate answer at the lowest cost. The fixed-step method is right for flight, where the work per cycle must be bounded once, by inspection, for every possible input — not only the inputs someone happened to test.
:::

## Why the control path forbids dynamic allocation and unbounded loops

These two turn out to be one problem in two costumes. **If the amount of work depends on a value only known at runtime, there is no fixed worst case you can bound in advance** — no matter how fast it usually is.

### Unbounded loops

A loop with a fixed, compile-time bound — `for i in range(64)` — always does exactly 64 rounds of work. You can work out how long that takes and prove it never takes longer.

A loop whose bound comes from runtime data — "keep going until it converges," or a count read from a sensor — may finish quickly nearly every time. Then, on some input nobody tested, it runs far longer, because nothing in the code limits it. That is an **unbounded loop**.

### Dynamic allocation

**Dynamic allocation** means asking for memory while the program runs, from a shared pool called the **[[heap|heap-fragmentation]]**. (In C++ that is `new`, or a container like `std::vector` growing.) It has the same shape of problem, plus two more:

1. **Unbounded time.** How long an allocation takes depends on the heap's current state. That state depends on every allocation and free that came before. You cannot tell by reading the function in isolation.
2. **It can fail.** Allocation is one of very few ordinary operations that can fail outright at runtime — returning a null pointer or throwing, depending on the language. A control loop has no acceptable response to "there was no memory this cycle."
3. **It gets worse over a long mission.** A flight computer runs for a whole mission, not a few minutes. Over hours of allocating and freeing, the heap **fragments**: free memory breaks into scattered small pieces. The worst case can be measurably worse hours into flight than in the first minute of testing — a failure a short test run will never show you.

::: key
Why avoid dynamic allocation in a control loop? Allocation has unbounded worst-case execution time, can fail at runtime, and fragments the heap over a long mission. A control loop must complete within a fixed deadline every cycle, so anything without a bounded worst case is a defect.
:::

::: example Why "we timed it and it was fast" does not establish a worst case
Here is a function whose work grows with a runtime count `n`. It also grows a list, which means allocating:

```python
def process_unbounded(n):
    buf = []
    for i in range(n):
        buf.append(i * 1.0001)
    return sum(buf)
```

Timed on one laptop for several values of `n` (your machine's numbers will differ, but not their shape):

```text
n           unbounded (ms)
10          0.006
1,000       0.056
100,000     6.114
2,000,000   121.363
8,000,000   503.912
```

Read the table from top to bottom. The time climbs roughly in step with `n` — from $0.006$ ms to $503.9$ ms, about an $80{,}000$-fold range ($503.912 / 0.006 \approx 84{,}000$) — and nothing in it suggests a ceiling. If `n` is ever set by live data rather than a test file you picked, nothing limits how large it gets, so nothing bounds the time.

Now a version built around a fixed-size buffer:

```python
import numpy as np
CAP = 1000

def process_bounded(n):
    buf = np.zeros(CAP)
    m = min(n, CAP)               # input beyond the cap is rejected, not absorbed
    for i in range(CAP):
        buf[i] = (i * 1.0001) if i < m else 0.0
    return float(buf.sum())
```

```text
n           bounded, cap=1000 (ms)
10          0.105
1,000       0.072
100,000     0.113
2,000,000   0.181
8,000,000   0.179
```

The times stay in a narrow band whatever `n` is. The function does exactly `CAP` units of work every time, and declines input beyond the cap instead of growing to swallow it. That is what **bounded by construction** means: not that the code is fast, but that its worst case is known in advance and does not depend on what data shows up. (This Python version still creates its buffer on each call, to keep the demonstration short. Flight code would create it once, before the loop starts, as the C++ below does.)

The same idea in C++:

```cpp
#include <array>

constexpr int kMaxSamples = 64;

// Always touches exactly kMaxSamples slots. Never allocates. The worst case
// is the same as the average case, by construction.
double bounded_mean(const std::array<double, kMaxSamples>& buf, int n) {
    int m = n < kMaxSamples ? n : kMaxSamples;
    double sum = 0.0;
    for (int i = 0; i < kMaxSamples; ++i) {
        if (i < m) sum += buf[i];
    }
    return m > 0 ? sum / m : 0.0;
}
```

`bounded_mean` never allocates: the caller supplies a buffer of fixed size. Its loop runs exactly `kMaxSamples` times whatever `n` is. Sanity check with the buffer holding $0, 1, 2, \ldots, 63$: `n = 4` gives $(0+1+2+3)/4 = 1.5$; `n = 1000` is capped at 64 and gives $(0 + 63)/2 = 31.5$; `n = 0` returns $0$ instead of dividing by zero. Its **[[worst-case execution time|wcet]]** can be stated once and trusted forever.
:::

### Unbounded recursion

**Recursion** is a function calling itself. Each call takes another slice of the **stack** — the memory where a function keeps its local variables. If the depth of recursion is not provably bounded at compile time, the worst-case stack use is not bounded either. So unbounded recursion joins the forbidden list for exactly the same reason as the unbounded loop and the unbounded allocation.

## Why the control path avoids exceptions

An **[[exception|exceptions-banned]]** is a way for code to say: "Something went wrong here, and I don't know how to handle it — someone further up will." The error jumps upward through the chain of function calls until some caller catches it. In most software that is a sensible division of labor.

A flight control loop has no such layer with more time to think. It has, at most, the rest of the current millisecond. Then it must send a command regardless. That causes two problems:

1. **Unwinding is not tightly bounded.** After a throw, the program "unwinds the stack," cleaning up each function it leaves. How much cleanup happens depends on how many functions are unwound and what each one's cleanup code does. That brings back the unbounded-worst-case problem the rest of this lesson has been removing.
2. **Passing the buck is the wrong response.** Sending the error upward helps only if someone upstairs has time to act on it. In a loop with a hard deadline, nobody does.

What replaces exceptions is plain discipline: **handle every error explicitly, at the point where it can happen, with a defined fallback.** Command a known-safe default. Flag the condition for the fault-management layer the next lesson covers. Never throw and hope a handler exists somewhere above.

::: warning None of this is a style preference
It is tempting to read "no heap allocation in the control loop" as a matter of taste — something reasonable engineers could argue about. It is not. Every rule in this lesson traces back to one non-negotiable requirement: the loop meets its deadline every cycle, provably, in the worst case as well as the typical case. A technique that cannot be bounded in advance is out, however fast it usually runs, because "usually" is not the standard a flight control loop has to meet.
:::

## Check yourself

::: check
Explain what real-time patching does to a general-purpose kernel, and why a stock, unpatched kernel does not by itself satisfy a hard real-time requirement.
:::

::: answer
A stock general-purpose kernel is tuned for fairness and throughput across many programs. It contains stretches of code — certain locks and interrupt-handling sections — that are not preemptible, so a low-priority task can, in principle, delay a high-priority one by an unbounded amount. Real-time patching (PREEMPT_RT is the well-known public example) makes nearly all of the kernel preemptible and turns locks into priority-aware sleeping locks. The worst-case delay between an event and the response to it becomes small and provable instead of open-ended.
:::

::: check
Using the adaptive-versus-fixed-step example, explain why a flight control loop's internal integration uses a fixed step size rather than an adaptive one.
:::

::: answer
The adaptive integrator took a different amount of work for each of three starting conditions of the same system — 209, 208 and 220 steps, and 1,628, 1,634 and 1,592 derivative calls — because it picks its step size at runtime from the trajectory's behavior. Its running time is data-dependent, so it cannot be bounded in advance. The fixed-step integrator took exactly 20,000 steps (80,000 derivative calls) every time, because the step size, and so the work, was fixed at design time. A control loop needs that property: its worst-case execution time has to be provable before the code runs, not measured afterward on whatever inputs happened to occur.
:::

::: check
The `process_unbounded` timing data shows the function ran in well under 10 milliseconds for every value of `n` up to 100,000. Explain why this does not establish that the function has a safe worst-case execution time.
:::

::: answer
The timings show the cost growing roughly in proportion to `n`, from 0.006 ms at `n = 10` to 503.9 ms at `n = 8,000,000`. The data show no ceiling — only the range that happened to be tried. If `n` is ever set by a runtime value rather than chosen by the tester, nothing in the function limits how large it can become. A value larger than any tried would take proportionally longer still, and no finite worst case can be derived from the timing data alone.
:::

::: check
Name two distinct problems with dynamic memory allocation in a flight control loop beyond "it can be slow," and explain why a long mission makes one of them worse over time.
:::

::: answer
First, allocation can fail outright at runtime — returning a null pointer or throwing — and a control loop has no acceptable response to that. Second, its cost depends on the heap's current state, which depends on the entire history of earlier allocations and frees, not on the function alone. The mission-length problem is fragmentation: after hours of allocating and freeing, free memory is broken into scattered pieces, so a later allocation can be slower, or more likely to fail, than the identical request in the first minute of flight. A short test run never shows this.
:::

::: check
Explain why a flight control loop avoids throwing exceptions, and what replaces "throw and let a caller handle it" as the error-handling strategy.
:::

::: answer
Throwing assumes some caller further up has more context or more time to decide what to do. A control loop has neither: it has at most the rest of the current cycle and must issue a command regardless. Unwinding the stack after a throw also has no tightly bounded cost in general, which brings back an unbounded worst case. The replacement is handling every error condition explicitly where it can occur, with a defined fallback — command a known-safe default, or flag the condition for the fault-management layer — instead of sending it upward.
:::

## Summary

| Concept | What it means |
| --- | --- |
| Flight computers | Embedded Linux, reported as a 3.2 series kernel with real-time patches, on Dragon, Falcon and Starship; flight software in C++ |
| Real-time patching | Kernel changes (PREEMPT_RT) that bound worst-case scheduling latency on a general-purpose OS; a dedicated RTOS is the alternative |
| Determinism | Same inputs give the same outputs, always within the same bounded time |
| 1 kHz loop | Period $1\,\mathrm{ms}$: sense, compute, command, repeat — worst case included |
| Fixed-step integration | $\Delta t$ chosen at design time, so work per cycle never depends on the trajectory; adaptive steppers belong in analysis |
| Bounded (worst-case) execution time | A provable ceiling on how long code can take, whatever the input |
| Unbounded loop / allocation / recursion | Work, memory or stack depth that depends on runtime data, with no provable ceiling |
| Exceptions in the control path | Avoided: unwinding is not reliably bounded and no layer above has time to help; handle errors in place |

The next lesson takes the same flight computer and asks what happens when it — or a sensor, or an actuator — fails outright, and how redundancy and voting keep the vehicle flying anyway.

::: context kernel-word Why it is called the kernel
A kernel is the seed inside a nut — the small, central part everything else grows around. The core of an operating system got the same name. It is the one program that is always running, and it decides which other program gets the processor next, hands out memory, and talks to the hardware. Your web browser, your editor and a flight control loop all ask the kernel for permission to run. That is why a kernel that sometimes makes an urgent task wait is a problem you cannot fix from inside your own program.
:::

::: context preempt-rt A patch that took about twenty years to land
To **preempt** is to interrupt something in order to go first — the way an ambulance siren preempts ordinary traffic. PREEMPT_RT began in the mid-2000s as a set of changes kept outside the main Linux source code. Companies building robots, factory machines and audio gear applied it to their own kernels for years. Piece by piece, its ideas were folded into mainline Linux, and the last major parts were merged in Linux 6.12, released in late 2024. So for most of its life, "real-time Linux" meant "Linux plus this patch set" — which is why job postings and reports still talk about "real-time patches."
:::

::: context kernel-3-2 An old kernel is not a sign of neglect
Linux 3.2 was released in January 2012 and was maintained for years afterward as a long-term support line, receiving fixes long after newer versions appeared. On a laptop, running a kernel that old would look careless. On a flight vehicle it can be the opposite. Every kernel change means re-testing timing, drivers and the whole flight stack, so teams often settle on one well-understood version, patch it for real-time behavior, and change it only when there is a strong reason. The 3.2 figure comes from public reporting rather than an official specification, and it may well have changed since — which is why this course asks you to learn the pattern, not the number.
:::

::: context one-khz-frame A millisecond, drawn out
Think of time as a row of boxes, each one millisecond wide. Every box must hold the whole cycle: read sensors, compute, send commands, with some spare room left over. The spare room is called **margin**. A cycle that spills over its box is an **overrun**, and the next cycle starts late.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="20" y="40" width="80" height="40"/>
    <rect x="100" y="40" width="80" height="40"/>
    <rect x="180" y="40" width="80" height="40"/>
    <rect x="260" y="40" width="80" height="40"/>
  </g>
  <g>
    <rect x="22" y="50" width="12" height="20" fill="#8fb8f0"/><rect x="34" y="50" width="30" height="20" fill="#1d6fd1"/><rect x="64" y="50" width="10" height="20" fill="#f2b880"/>
    <rect x="102" y="50" width="12" height="20" fill="#8fb8f0"/><rect x="114" y="50" width="32" height="20" fill="#1d6fd1"/><rect x="146" y="50" width="10" height="20" fill="#f2b880"/>
    <rect x="182" y="50" width="12" height="20" fill="#8fb8f0"/><rect x="194" y="50" width="30" height="20" fill="#1d6fd1"/><rect x="224" y="50" width="10" height="20" fill="#f2b880"/>
    <rect x="262" y="50" width="12" height="20" fill="#8fb8f0"/><rect x="274" y="50" width="80" height="20" fill="#b4232c"/>
  </g>
  <line x1="20" y1="28" x2="100" y2="28" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="23" x2="20" y2="33" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="23" x2="100" y2="33" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">1 ms</text>
  <text x="300" y="100" font-size="12" text-anchor="middle" fill="#b4232c">overrun</text>
  <text x="20" y="125" font-size="11" fill="#1d6fd1">light: sense · dark: compute</text>
  <text x="20" y="142" font-size="11" fill="#1f2a44">orange: command · white space: margin</text>
</svg>
```

Three cycles fit with margin to spare. The fourth runs past its box. At 1 kHz there are a thousand boxes every second, and a flight lasts many minutes — so "rarely" still happens.
:::

::: context van-der-pol A test equation with fast and slow stretches
The Van der Pol oscillator was studied by the Dutch physicist Balthasar van der Pol in the 1920s, while working on electronic circuits. It swings back and forth, but not smoothly like a pendulum: it creeps slowly for a while, then snaps quickly to the other side. That mix of slow and fast is exactly what makes an adaptive integrator change its step size a lot, which is why numerical-methods courses use it as a standard test. The $\mu$ in the code (said "mew") sets how sharp the snaps are.
:::

::: context rk4-steps What RK4 does inside one step
**RK4** is the fourth-order Runge–Kutta method, named after the German mathematicians Carl Runge and Wilhelm Kutta. Inside each step it measures the slope four times — at the start, twice at the midpoint, and at the end — and takes a weighted average ($1, 2, 2, 1$, divided by $6$). Four measurements per step, every step, is what makes its cost perfectly predictable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">fixed step: equal slices</text>
  <line x1="20" y1="40" x2="340" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="20" y1="32" x2="20" y2="48"/><line x1="60" y1="32" x2="60" y2="48"/><line x1="100" y1="32" x2="100" y2="48"/><line x1="140" y1="32" x2="140" y2="48"/><line x1="180" y1="32" x2="180" y2="48"/><line x1="220" y1="32" x2="220" y2="48"/><line x1="260" y1="32" x2="260" y2="48"/><line x1="300" y1="32" x2="300" y2="48"/><line x1="340" y1="32" x2="340" y2="48"/>
  </g>
  <text x="20" y="78" font-size="12" fill="#1f2a44">adaptive step: sizes chosen at runtime</text>
  <line x1="20" y1="96" x2="340" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="20" y1="88" x2="20" y2="104"/><line x1="90" y1="88" x2="90" y2="104"/><line x1="150" y1="88" x2="150" y2="104"/><line x1="170" y1="88" x2="170" y2="104"/><line x1="182" y1="88" x2="182" y2="104"/><line x1="192" y1="88" x2="192" y2="104"/><line x1="210" y1="88" x2="210" y2="104"/><line x1="270" y1="88" x2="270" y2="104"/><line x1="340" y1="88" x2="340" y2="104"/>
  </g>
</svg>
```

You will build exactly this integrator, for a full six-degree-of-freedom rigid body, in this module's first exercise.
:::

::: context heap-fragmentation How a heap fragments
Picture the heap as a long shelf of equal boxes. Programs take runs of boxes and later give them back. After hours of this, the free boxes are scattered in small gaps. There can be plenty of free space in total and still no single gap big enough for the next request.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="30" width="20" height="30" fill="#1d6fd1"/><rect x="40" y="30" width="20" height="30" fill="#1d6fd1"/>
    <rect x="60" y="30" width="20" height="30" fill="#ffffff"/><rect x="80" y="30" width="20" height="30" fill="#ffffff"/>
    <rect x="100" y="30" width="20" height="30" fill="#1d6fd1"/>
    <rect x="120" y="30" width="20" height="30" fill="#ffffff"/><rect x="140" y="30" width="20" height="30" fill="#ffffff"/>
    <rect x="160" y="30" width="20" height="30" fill="#1d6fd1"/><rect x="180" y="30" width="20" height="30" fill="#1d6fd1"/>
    <rect x="200" y="30" width="20" height="30" fill="#ffffff"/><rect x="220" y="30" width="20" height="30" fill="#ffffff"/>
    <rect x="240" y="30" width="20" height="30" fill="#1d6fd1"/>
    <rect x="260" y="30" width="20" height="30" fill="#ffffff"/><rect x="280" y="30" width="20" height="30" fill="#ffffff"/>
    <rect x="300" y="30" width="20" height="30" fill="#1d6fd1"/><rect x="320" y="30" width="20" height="30" fill="#1d6fd1"/>
  </g>
  <text x="20" y="20" font-size="12" fill="#1f2a44">heap: 16 boxes, 8 in use (blue), 8 free (white)</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#f2b880">
    <rect x="20" y="80" width="20" height="24"/><rect x="40" y="80" width="20" height="24"/><rect x="60" y="80" width="20" height="24"/><rect x="80" y="80" width="20" height="24"/>
  </g>
  <text x="110" y="97" font-size="12" fill="#b4232c">request: 4 in a row — no gap fits</text>
  <text x="20" y="122" font-size="11" fill="#1f2a44">largest free gap is 2 boxes</text>
</svg>
```

Half the shelf is free, yet the request fails. Real allocators work hard to limit this, but they cannot promise it never happens — and on a mission lasting hours, it has time to build up.
:::

::: context wcet Worst-case execution time is a job
**Worst-case execution time**, often written WCET (said "W-C-E-T"), is the longest a piece of code can ever take on a given processor. In safety-critical work it is not guessed. Engineers combine careful measurement — millions of timed runs, deliberately stressed — with analysis of the code's paths, and then keep a margin on top. Code written the way this lesson recommends, with fixed loop bounds and no allocation, is far easier to analyze, because every path's length can be read straight off the source.
:::

::: context exceptions-banned Real coding standards that ban these
You are not the first to reach these rules. NASA JPL's "Power of Ten" rules for safety-critical code, published by Gerard Holzmann in 2006, include: no recursion, a fixed upper bound on every loop, and no dynamic memory allocation after start-up. The coding standard written for the F-35 fighter's C++ software (the JSF AV rules, said "J-S-F A-V") says outright that C++ exceptions shall not be used. Many embedded C++ projects compile with exceptions switched off entirely. This module's reading exercise asks you to work through the JPL rules and argue with the two you find hardest to accept.
:::
