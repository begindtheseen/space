---
id: l04-the-machine-the-deadline-and-the-forbidden-list
title: "The machine, the deadline, and why the loop forbids the heap"
minutes: 22
covers:
  - "flight computers: embedded Linux, a roughly 3.2 series kernel with real-time patches, on Dragon, Falcon and Starship primary flight computers"
  - determinism, fixed-step integration and bounded execution time in a flight control loop
  - why dynamic allocation, unbounded loops and exceptions are avoided in the control path
---

Every constraint in this lesson traces back to one sentence: a flight control loop must finish its work inside a fixed time budget, every single cycle, with no exceptions for a hard case. Not on average — every time. That single requirement, taken seriously, rules out a surprisingly long list of techniques that are completely ordinary everywhere else in software, and this lesson is about why each one falls, starting from the physical machine the code actually runs on and working up to the specific things the control path forbids.

This is also the point where "deployment," the fourth verb from the first lesson in this module, stops being abstract. Code does not deploy to a friendly, forgiving operating system that will happily let a process run a little long this cycle and catch up the next. It deploys to a real machine, with a real scheduler, running a control loop that a physical vehicle depends on meeting its deadline.

## The machine: a general-purpose computer, made to behave like a real-time one

A flight computer is not, in most modern practice, a tiny bare-metal microcontroller running nothing but your control loop. It is often a genuinely capable general-purpose processor, running a general-purpose operating system — commonly a build of Linux — because a full operating system buys real advantages: a standard toolchain, standard drivers, networking and file systems for logging and telemetry, and a huge existing base of tested, debugged infrastructure that a from-scratch bare-metal environment would have to rebuild.

The problem is that a stock general-purpose kernel is not built to guarantee hard real-time behavior. It is built to be fair and efficient across many competing processes, and in pursuit of that goal, ordinary Linux has code paths — certain locks, certain interrupt-handling sections — that are not preemptible, meaning a lower-priority task can, in principle, hold the processor for longer than a higher-priority task can afford to wait. For everyday computing that is an acceptable trade. For a control loop with a hard deadline, an unbounded worst-case delay of even a few milliseconds can mean a missed cycle.

The general industry answer to this is real-time patching: a set of changes to the kernel — the best-known public example is the PREEMPT_RT patch line — that make nearly all of the kernel preemptible, turn ordinary spinlocks into sleeping locks that respect task priority, and bound the worst-case latency between an event occurring and a high-priority task actually getting to run in response to it. The result is a general-purpose operating system that has been made to behave, for scheduling purposes, close enough to a dedicated real-time operating system to trust it with a hard-deadline control loop, while keeping the rest of what a full OS provides.

You will sometimes encounter specific claims about exactly which kernel line, patched in exactly which way, runs on a specific set of named vehicles. Treat any such specific version number as a snapshot of a moment, not a fact worth memorizing — kernels get upgraded, hardware gets replaced across vehicle generations, and specifics like that are the kind of detail you confirm with a specific employer when it is actually relevant, not something a self-study curriculum can respons­ibly hand you as settled fact. What is durable, and what this lesson actually wants you to carry forward, is the pattern itself and why it exists: real-time patching is a genuine, general technique — used across aerospace, robotics and industrial control, not confined to any one organization — for getting bounded, trustworthy scheduling latency out of a general-purpose operating system. It is also not the only valid answer: some flight computers instead run a dedicated real-time operating system with no general-purpose kernel underneath at all, and which approach a given employer or vehicle uses is exactly the kind of thing that varies and is worth asking about directly rather than assuming.

::: key
A hard real-time control loop needs bounded worst-case scheduling latency, which a stock general-purpose kernel does not guarantee by default. Real-time patching (the PREEMPT_RT line is the well-known public example) is one genuine, widely used way to get that guarantee out of a general-purpose operating system such as Linux; a dedicated real-time operating system is the other. Which one a specific employer uses varies, and specific kernel version numbers are not durable facts to memorize.
:::

## Determinism and the deadline

A control loop is deterministic when the same inputs always produce the same outputs, and — this second half is the one people forget — always within the same bounded amount of time. Correctness alone is not enough; a control law that computes the exactly right answer, occasionally, forty milliseconds late, is not a working control law, because the vehicle has moved and the physical situation the answer was computed for no longer exists.

A loop running at 1 kHz has a period of 1 millisecond: sample the sensors, compute the control law, issue the actuator commands, and be ready to do it again, one thousand times every second, with the entire cycle fitting inside that one millisecond every time, including the worst case that might only happen once in ten million cycles. Meeting that requirement is why flight code integrates its own internal dynamics — where the control law itself needs to propagate a state forward — with a **fixed step size**, decided once, at design time, rather than with an **adaptive** step size chosen automatically at runtime based on how the current trajectory behaves.

::: example An adaptive integrator's runtime depends on the data; a fixed-step one does not
`scipy.integrate.solve_ivp` with an adaptive method chooses its own step size at every point, based on an estimate of local error — which means the number of steps it takes to cover a fixed time span depends on the trajectory itself:

```python
from scipy.integrate import solve_ivp

def vdp(t, y, mu):
    x, xd = y
    return [xd, mu*(1 - x**2)*xd - x]

for y0 in ([2.0, 0.0], [0.5, 0.0], [3.5, 1.0]):
    sol = solve_ivp(vdp, [0, 20], y0, args=(1.5,), method="RK45", rtol=1e-6, atol=1e-9)
    print(y0, "-> steps:", len(sol.t))
# [2.0, 0.0] -> steps: 210
# [0.5, 0.0] -> steps: 209
# [3.5, 1.0] -> steps: 221
```

Three different starting conditions for the same system take three different numbers of steps — 210, 209 and 221 — because the adaptive method is reacting to how quickly the solution changes along each particular trajectory. That is exactly the right behavior for an analysis tool, where the goal is an accurate answer at the lowest computational cost, and exactly the wrong behavior for a flight control loop, where a data-dependent number of steps means a data-dependent, unpredictable amount of computation time.

A fixed-step RK4 integrator run over the same 20-second span, by contrast, takes precisely the same number of steps regardless of the trajectory, because the step size was chosen in advance rather than computed from the data:

```python
def rk4_fixed(f, y0, t0, t1, dt, *args):
    n = int(round((t1 - t0) / dt))
    y = list(y0)
    # ... four derivative evaluations per step, exactly n times ...
    return n

for y0 in ([2.0, 0.0], [0.5, 0.0], [3.5, 1.0]):
    print(y0, "-> steps:", rk4_fixed(vdp, y0, 0.0, 20.0, 0.001, 1.5))
# [2.0, 0.0]  -> steps: 20000
# [0.5, 0.0]  -> steps: 20000
# [3.5, 1.0]  -> steps: 20000
```

Every starting condition produces exactly 20,000 steps, because the number of steps was fixed by `dt` and the duration, not derived from the solution. That is the property a control loop actually needs: the amount of work per cycle can be bounded once, by inspection, and holds for every possible input, not only the inputs someone happened to test.
:::

## Why the control path forbids dynamic allocation and unbounded loops

Both of these turn out to be the same underlying problem: work whose amount depends on a value that is only known at runtime has no fixed worst case you can bound in advance, no matter how fast it usually is.

A loop whose bound is a fixed, compile-time constant — `for i in range(64)` — always does exactly 64 iterations' worth of work, and you can compute exactly how long that takes and prove it will never take longer. A loop whose bound depends on runtime data — "keep going until converged," or a bound taken from a sensor reading — might finish quickly nearly every time, and then, on some input nobody happened to test, take far longer, because nothing in the code limits how long it can run.

Dynamic memory allocation has exactly the same shape of problem, for a slightly different reason: how long an allocation takes depends on the current state of the heap, which depends on the entire history of allocations and frees that came before it, which is not something you can determine by reading the function in isolation. On top of that timing problem, allocation is one of very few operations in ordinary code that can fail outright at runtime — returning a null pointer or throwing, depending on the language and configuration — and a control loop has no acceptable response to "there was no more memory this cycle." And because a flight computer runs for the length of an entire mission rather than restarting every few minutes, a slow, gradual fragmentation of the heap can make the worst case measurably worse hours into a flight than it was in the first minute of testing, which is a failure mode that a short test run will never show you.

::: example Why "we timed it and it was fast" does not establish a worst case
A function whose work scales with a runtime-supplied count `n` has no fixed worst-case time, however fast it looked on the inputs you tried:

```python
def process_unbounded(n):
    buf = []
    for i in range(n):
        buf.append(i * 1.0001)
    return sum(buf)
```

Timed across several values of `n`, the cost grows essentially in proportion to `n`, with no ceiling in sight:

```text
n           unbounded (ms)
10          0.006
1,000       0.056
100,000     6.114
2,000,000   121.363
8,000,000   503.912
```

From 0.006 ms to 503.9 ms — roughly an 80,000-fold range — purely because `n` grew. If `n` is ever derived from live data rather than a test file you chose yourself, nothing in this function limits how large it can get, and therefore nothing bounds how long the function can take.

A version built around a fixed-capacity buffer, in contrast, always does the same amount of work regardless of what is asked of it:

```python
import numpy as np
CAP = 1000

def process_bounded(n):
    buf = np.zeros(CAP)
    m = min(n, CAP)               # extra input beyond the cap is rejected, not absorbed
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

The timings stay in a narrow band regardless of `n` — because the function does exactly `CAP` units of work every time, full stop, and declines to process input beyond that cap rather than growing to meet it. That is what "bounded by construction" means in practice: not that the function is fast, but that its worst case is knowable in advance and does not depend on what data eventually shows up. The equivalent idea in C++ looks like this:

```cpp
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

`bounded_mean` never allocates — the buffer is supplied by the caller, fixed in size — and its loop runs exactly `kMaxSamples` times no matter what `n` is, so its worst-case execution time can be stated once and trusted forever.
:::

Unbounded recursion is the same problem again in a different shape: if a recursive function's depth is not provably bounded at compile time, its worst-case stack usage is not bounded either, which is exactly why it belongs on the same forbidden list as an unbounded loop and an unbounded allocation, for exactly the same underlying reason.

## Why the control path avoids exceptions

An exception is a control-flow mechanism for saying "something went wrong here, and I do not know how to handle it — someone further up the call chain will." In most software, that is a reasonable division of labor: let the error propagate to a layer that has enough context to decide what to do. A flight control loop does not have a further-up layer with more time to think; it has, at most, the remainder of the current millisecond, and then it is expected to issue a command regardless.

The specific problems this creates are, first, that unwinding the stack after an exception is thrown often does not have a tightly bounded cost either — how much cleanup work happens depends on how many stack frames are unwound and what each one's destructor does — which reintroduces exactly the unbounded-worst-case problem the rest of this lesson has been building toward. Second, and more fundamentally, "propagate the error upward and let someone else handle it" is the wrong response inside a loop where there is no time to do anything with the propagated error except decide what to command right now anyway. The discipline that replaces exceptions in this setting is handling every error condition explicitly, at the point where it can occur, with a defined fallback — command a known-safe default, flag the condition for the fault-management layer the next lesson covers — rather than throwing and hoping a handler exists somewhere above.

::: warning None of this is a style preference
It is tempting to read a rule like "no heap allocation in the control loop" as a matter of taste, the kind of thing reasonable engineers could disagree about. It is not: every rule in this lesson traces back to the single, non-negotiable requirement that the loop meets its deadline every cycle, provably, in the worst case as well as the typical case. A technique that cannot be bounded in advance is excluded regardless of how fast it usually runs, because "usually" is not the standard a flight control loop has to meet.
:::

## Check yourself

::: check
Explain what real-time patching does to a general-purpose kernel, and why a stock, unpatched kernel does not by itself satisfy a hard real-time requirement.
:::

::: answer
A stock general-purpose kernel is optimized for fairness and throughput across many processes and contains code paths — certain locks and interrupt-handling sections — that are not preemptible, so a lower-priority task can in principle delay a higher-priority one by an unbounded amount. Real-time patching (PREEMPT_RT is the well-known public example) restructures the kernel to make nearly everything preemptible and gives locks priority-aware, bounded-latency behavior, so the worst-case delay between an event and the response to it becomes small and provable rather than open-ended.
:::

::: check
Using the adaptive-versus-fixed-step integration example, explain why a flight control loop's internal integration uses a fixed step size rather than an adaptive one.
:::

::: answer
The adaptive integrator took a different number of steps — 210, 209 and 221 — for three different starting conditions of the same system, because it chooses its step size at runtime based on the trajectory's local behavior; that means the time it takes is data-dependent and cannot be bounded in advance. The fixed-step integrator took exactly 20,000 steps regardless of starting condition, because the step size and therefore the amount of work per run was fixed at design time. A control loop needs the fixed-step property specifically because its worst-case execution time has to be provable before the code ever runs, not measured afterward on whatever inputs happened to occur.
:::

::: check
The `process_unbounded` timing data shows the function ran in well under a millisecond for every value of `n` up to 100,000. Explain why this does not establish that the function has a safe worst-case execution time.
:::

::: answer
The timings show the function's cost grows in proportion to `n`, from 0.006 ms at `n=10` to 503.9 ms at `n=8,000,000` — there is no ceiling in the data, only a range that was tried. If `n` is ever set by a runtime value rather than chosen by whoever ran the test, nothing in the function limits how large `n` can become, so no finite worst-case time can be stated with confidence; a value of `n` larger than any tried would take proportionally longer still, with no bound derivable from the timing data alone.
:::

::: check
Name two distinct problems with dynamic memory allocation in a flight control loop beyond "it can be slow," and explain why a long-duration mission makes one of them worse over time.
:::

::: answer
Beyond timing, allocation can fail outright at runtime — returning a null pointer or throwing — which a control loop has no acceptable response to; and its cost depends on the heap's current state, which depends on the entire history of prior allocations and frees, not on the function alone. The mission-length problem is fragmentation: as a program allocates and frees memory over many hours, the heap can become fragmented in ways that make a later allocation slower or more likely to fail than the identical allocation would have been in the first minute of flight, a failure mode invisible to a short test run.
:::

::: check
Explain why a flight control loop avoids throwing exceptions, and what replaces "throw and let a caller handle it" as the error-handling strategy.
:::

::: answer
Throwing an exception assumes a layer further up the call chain has more context or more time to decide what to do, which a control loop does not have — it has, at most, the rest of the current cycle, and still has to issue a command regardless. Stack unwinding after a throw also does not have a tightly bounded cost in general, reintroducing an unbounded-worst-case problem. The replacement is handling every error condition explicitly at the point it can occur, with a defined fallback such as commanding a known-safe default or flagging the condition for a fault-management layer, rather than propagating it upward.
:::

## Summary

| Concept | What it means |
| --- | --- |
| Real-time patching | Kernel changes bounding worst-case scheduling latency on a general-purpose OS |
| Determinism | Same inputs give same outputs, always within the same bounded time |
| Fixed-step integration | Step size chosen at design time, so work per cycle never depends on the trajectory |
| Bounded (worst-case) execution time | A provable ceiling on how long code can take, independent of the specific input |
| Unbounded loop / allocation / recursion | Work whose amount depends on runtime data, with no provable ceiling |
| Exceptions in the control path | Avoided because unwinding is not reliably bounded and no layer above has time to help |

The next lesson takes the same physical flight computer and asks what happens when it — or a sensor, or an actuator — fails outright, and how redundancy and voting are designed to keep the vehicle flying anyway.
