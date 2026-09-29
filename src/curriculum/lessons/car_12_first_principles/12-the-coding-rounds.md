---
id: l12-the-coding-rounds
title: "The coding rounds, narrated"
minutes: 24
covers:
  - the coding rounds: 2 to 3 problems at medium to hard difficulty, C++ for avionics and embedded
  - coding round discipline: clarify, state the approach and complexity, write it, test the edges
  - thinking aloud as an explicitly evaluated skill
---

Think about a cooking show. The judges taste the dish, but they also watch the cook. Did she read the recipe first? Did she taste before serving? A good dish made in silence, by luck, scores worse than one whose cook showed how she got there.

A **coding round** is an interview where you solve programming problems while someone watches. It is graded the same way as the whiteboard round. Usually you get **two to three problems at medium to hard difficulty**. If the job is in **[[avionics or embedded|avionics-embedded]]** software, you write them in **C++** (said "see plus plus"), a language widely used for flight software.

Nobody checks whether you memorized a clever trick. They watch the four things you met in the physics rounds: break the problem down, say what you will do, carry it through without drifting, test the result. For code, the discipline fits in one line: **clarify, state the approach and complexity, write it, test the edges.**

What really differs is the language. A C++ round for a flight-software job asks a narrower question than a general programming interview, and knowing that changes your answers.

## What "C++ for avionics and embedded" changes

Picture a juggler who must catch every ball on the beat, forever. Being fast on average does not help if one catch in a thousand is late. That is flight software. It runs on a small processor inside a **loop** — the same code run over and over, often a thousand times a second — that must finish on time *every* time. Naming the constraints this brings, out loud, is most of the signal in this round.

- **Steady timing beats fast average timing.** A data structure that is usually quick but sometimes stops to reorganize itself loses to one that is always a little slower and never surprises you. Say which you chose and why.
- **No grabbing new memory inside the control loop.** Asking for memory while running — **dynamic allocation** — takes unpredictable time and can fail. Get it all once at startup, or use fixed-size storage. A `std::vector` (C++'s growable list) is fine if you `reserve` its full size up front and never grow it. Growing it inside a 1 kHz loop is not.
- **Integer overflow is a real failure, not a puzzle.** An integer type holds only so many digits, and counters and index arithmetic can run past the top. In C++, overflow of a **signed** integer (one that can be negative) is **[[undefined behavior|undefined-behavior]]**: the language makes no promise at all about what happens. The **compiler** — the program that turns your code into machine instructions — may assume it never happens and rearrange your code on that assumption.
- **Exceptions are often switched off.** An **exception** is C++'s way of jumping out of a function when something goes wrong. Many flight projects disable them, so errors come back as status codes. Say so rather than writing a `throw` and hoping.
- **Memory layout affects timing.** Reading memory in order, in one block, is much faster than hopping around. On a small processor with a small **cache** (a tiny, fast memory next to the processor), that difference can be the whole budget.

You need not write embedded code in the interview. But the sentence justifying your data structure should mention one of these. That sentence separates someone who has written flight software from someone who has solved a lot of puzzles.

::: key
Coding round discipline: restate the problem, ask clarifying questions, state the approach and its time and space complexity before writing, write it, then test the edge cases — empty, single element, duplicates, overflow, and the boundary of every loop. Silence while thinking is fine if you say that is what you are doing.
:::

## The five steps, with timings

Here is a forty-minute problem with the clock shared out. The steps leave a cushion on purpose, for whatever goes wrong.

1. **Restate** (30 seconds). Say the problem back in one sentence of your own. It catches a misreading before it costs ten minutes.
2. **Clarify** (1–2 minutes). Ask only the questions whose answers change the solution: how big the input is and what range its values take, whether it is sorted, whether duplicates happen, what to return on empty input, whether you may change the input, and whether memory or speed is the tighter limit. Three or four questions, not ten.
3. **State the approach and its complexity** (2–3 minutes). Give the method in two sentences. Then give its **complexity** — how the work and memory grow as the input grows — in **[[big-O notation|big-o]]** (said "big oh"), *before* writing any code. $O(n)$, read "order n", means the work grows in step with the input size $n$. $O(n^2)$, "order n squared", means doubling the input makes four times the work. Name any simpler approach you are turning down, and why.
4. **Write it** (15–20 minutes), narrating as you go. One sentence per block about what it is for.
5. **Test the edges** (5–8 minutes), out loud, walking real values through the code. It is the step most often skipped and the one that most often finds a bug.

Stating the complexity first is not ceremony. It commits you to a target, so if your code drifts toward a loop inside a loop, you notice. It also lets the interviewer redirect you in ten seconds, instead of at minute thirty.

::: warning Do not start typing during the clarifying questions
The most common way to lose this round: you recognize something similar and start writing while still talking. You produce code for the *similar* problem. The differences surface in testing, with ten minutes left. Keep your hands off the keyboard until step 3 is done and you have said the complexity out loud.
:::

## The edge-case checklist

An **edge case** is an input at the extreme end of what is allowed, where code most often breaks. Memorize this list. Saying it aloud at the end takes ninety seconds, and it is scored.

- **Empty input.** What is returned? Did you say so?
- **One element.** Many loop bodies are wrong when $n = 1$.
- **All elements equal**, and **duplicates generally**. This is the classic killer of comparisons that use strict "less than" (`<`) where they needed "less than or equal" (`<=`).
- **Already sorted, and reverse sorted**, for anything that depends on order.
- **The boundary of every loop.** Does the last pass read one past the end? Should the test be `<` or `<=`?
- **Overflow.** Index arithmetic, sums, products, and anything multiplied by a sample count.
- **The maximum input size**, checked against the timing budget, not against a gut feeling.

::: example A sliding-window maximum, narrated
**The problem.** Given a stream of $n$ sensor samples and a window length $k$, produce the largest value in every run of $k$ samples in a row.

**Restate.** *"For each position from $k-1$ to $n-1$, I want the largest value in the last $k$ samples. The output has $n - k + 1$ values."*

**Clarify.** *"Can $k$ exceed $n$, and what do I return then? Are the samples decimals? Is this inside a control loop, so allocation matters? Is $n$ known at startup?"* Assume: return empty if $k > n$ or $k = 0$; the samples are `double` (C++'s decimal number type); yes, it runs in a loop, so allocate once.

**State the approach and complexity.** *"The obvious approach scans each window, which is $O(nk)$. For $n = 2000$ and $k = 50$ that is about $2000 \times 50 = 10^5$ comparisons — fine, but it gets bad as $k$ grows. Instead I will keep a [[double-ended queue|deque]] of positions whose values are strictly decreasing from front to back. The front is always the current window's maximum. Each position is pushed once and popped at most once, so the total work is $O(n)$ time and $O(k)$ space."*

**Write it.**

```cpp
#include <cstddef>
#include <deque>
#include <vector>

// Maximum over every window of length k. O(n) time, O(k) space.
std::vector<double> window_max(const std::vector<double>& v, std::size_t k)
{
    std::vector<double> out;
    if (k == 0 || v.size() < k) return out;   // documented: empty on bad k
    out.reserve(v.size() - k + 1);            // one allocation, up front

    std::deque<std::size_t> idx;              // indices; values decreasing
    for (std::size_t i = 0; i < v.size(); ++i) {
        while (!idx.empty() && idx.front() + k <= i) idx.pop_front();  // expired
        while (!idx.empty() && v[idx.back()] <= v[i]) idx.pop_back();  // dominated
        idx.push_back(i);
        if (i + 1 >= k) out.push_back(v[idx.front()]);
    }
    return out;
}
```

**Two choices to narrate as you write them.** First, the queue stores *indices* (positions), not values, because "has this one left the window?" is a question about position, not size. Second, the "dominated" test uses `<=`, not `<`, so equal values are removed too. A newer tie makes the older one useless, since the newer stays in the window longer.

**Test the edges, out loud.** With `v = {3,1,4,1,5,9,2,6}` and `k = 3`, the windows are $\{3,1,4\}$, $\{1,4,1\}$, $\{4,1,5\}$, $\{1,5,9\}$, $\{5,9,2\}$, $\{9,2,6\}$, so the output should be `{4,4,5,9,9,9}` — and it is. `k = 1` returns all eight inputs unchanged. `k = 8` returns one value, 9. `k = 9` returns empty, as promised. Empty input returns empty. And `{2,2,2,2}` with `k = 2` returns `{2,2,2}`: three windows, the duplicate case the `<=` was for.

**Close on the embedded point.** *"`std::deque` grabs memory in chunks as it grows. In flight code I would replace it with a fixed-size [[ring buffer|ring-buffer]] of capacity $k$. That is always enough, because the queue never holds more than $k$ indices, and then nothing is allocated after the one `reserve`."* That sentence is worth as much as the algorithm.
:::

::: example A table lookup, and the bug that is always in it
**The problem.** An [[aerodynamic coefficient table|lookup-tables]] is stored as a sorted list of **breakpoints** — the input values where the table has entries. Given a query $x$, find the largest index $i$ with `table[i] <= x`, so the caller can **interpolate** (estimate in between) using rows $i$ and $i+1$.

**Clarify.** *"What if $x$ is below the first breakpoint — clamp to the first row, or report an error? Above the last? Can the table be empty? Can two breakpoints be equal?"* Assume: below the first is an error, above the last clamps to the last index, no duplicates.

**Approach and complexity.** *"Binary search: $O(\log n)$ time, $O(1)$ space."* **Binary search** is how you find a word in a dictionary: open to the middle, see which half the word is in, and repeat on that half. *"For a 2000-row table that is about 11 comparisons, since halving 2000 about 11 times gets you down to 1 ($\log_2 2000 \approx 11$). A scan from the start would be up to 2000. At roughly a nanosecond (a billionth of a second) each, that is about 2 microseconds (millionths of a second) — still inside a 1 kHz budget of 1000 microseconds, but about 180 times more work than needed."*

**Write it.**

```cpp
#include <cstddef>
#include <limits>
#include <vector>

constexpr std::size_t npos = std::numeric_limits<std::size_t>::max();

// Largest i with table[i] <= x; npos if x is below table[0].
std::size_t lower_bracket(const std::vector<double>& table, double x)
{
    if (table.empty() || x < table.front()) return npos;

    std::size_t lo = 0, hi = table.size() - 1;
    while (lo < hi) {
        std::size_t mid = lo + (hi - lo + 1) / 2;   // upper midpoint, no overflow
        if (table[mid] <= x) lo = mid;
        else                 hi = mid - 1;
    }
    return lo;                                      // invariant: table[lo] <= x
}
```

`npos` ("n-pos", for "no position") means "not found".

**The bug that is always in it.** The textbook midpoint, `(lo + hi) / 2`, [[can overflow|binary-search-bug]]. A 32-bit signed integer tops out at $2^{31} - 1 = 2{,}147{,}483{,}647$. If `lo = 2000000000` and `hi = 2100000000`, their sum is $2.0\times 10^9 + 2.1\times 10^9 = 4.1\times 10^9$, which does not fit. In C++, signed overflow is undefined behavior, so the result is not merely wrong — it is unconstrained. (With unsigned `std::size_t`, as in our code, the sum wraps around instead: defined, but still wrong.) `lo + (hi - lo + 1) / 2` cannot overflow, because the gap `hi - lo` is never bigger than the table. Say this as you write it; it reads as experience.

**The second bug that is always in it.** The `+ 1` in the midpoint. Without it, suppose `hi == lo + 1` and the test sends `lo = mid`. Then `mid` equals `lo`, nothing changes, and the loop runs forever. The rule: whenever the update is `lo = mid`, round the midpoint *up*. State the rule, not only the fix.

**Test the edges.** With `table = {0.0, 0.5, 1.0, 1.5, 2.0}`:

- $x = -0.1$ returns `npos`, below the table.
- $x = 0.0$ returns 0 — the boundary case.
- $x = 0.7$ returns 1, since $0.5 \le 0.7 < 1.0$.
- $x = 1.5$ returns 3 — exactly on a breakpoint. A version with strict `<` would return 2 here and break the interpolation.
- $x = 9.9$ returns 4, clamped as promised.
- An empty table returns `npos`.

Six cases, ninety seconds, and two test the comparison easiest to get wrong.
:::

## Narrating under the clock

Everything lesson 1 said about thinking aloud applies: it is an explicitly evaluated skill, scored, not a courtesy. Code adds two habits.

**Narrate intent, not syntax.** *"Now the expiry check: anything whose index has fallen out of the window comes off the front"* is useful. *"Now I type while, open bracket, exclamation mark"* is not. One sentence per block.

**Label your silences.** Code needs longer quiet stretches than a derivation. Announce them: *"I am going to write the loop body now — give me two minutes and then I will walk you through it."* Then do it.

A third habit matters when things go wrong. If you realize part way through that your approach will not work, the recovery is to **say what you have realized, say why the approach fails, propose the replacement with its complexity, and continue from there.** Avoid the silent versions — typing on in hope, or wiping the board without a word. Both stop the interviewer following you, which is what they are there to do.

::: example Changing approach out loud, at minute twelve
**The problem.** Given $n$ vehicle-state samples, report every pair that is closer than a threshold in both position and time.

**Twelve minutes in**, with a loop inside a loop half written, the candidate stops.

*"Let me pause — I want to check this against the timing budget before I finish it. This is $O(n^2)$. The problem said $n$ can be 2000, so that is $2000^2 = 4\times 10^6$ pair tests. At roughly a nanosecond each, that is $4\times 10^6 \times 10^{-9} = 4\times 10^{-3}$ seconds — four milliseconds. If this runs inside a [[1 kHz loop|frame-budget]], the budget is 1000 microseconds, and I am four times over. So this approach does not fit, and I should change it now rather than finish it.*

*The replacement: sort by time, which is $O(n\log n)$ — about $2000 \times 11 = 22{,}000$ operations, call it 22 microseconds. Then sweep with a moving window holding only samples within the time threshold. Each sample enters and leaves once, so the sweep costs time in step with $n$, plus the pairs reported. With a tight threshold that is close to $O(n\log n)$ overall, well inside the budget.*

*I am assuming the threshold keeps the window short. If most pairs qualify, no algorithm beats $O(n^2)$, because the answer itself has that many pairs. Then I would ask whether we need every pair, or only a count."*

**Sanity check.** 4 ms against a 1 ms frame is four times over; 22 µs is about 2 percent of the frame.

**What those ninety seconds showed.** A budget checked against a stated input size; a specific numerical failure; a replacement with its complexity; the assumption behind it; and the case where no algorithm helps, separated from the case where this one does. None of it needed anything clever.
:::

## Check yourself

::: check
Name the four clarifying questions you would ask before writing any code, and say why each one can change the solution.
:::

::: answer
**Input size and range.** It decides whether $O(n^2)$ is acceptable and whether index arithmetic can overflow. It alone can sink an otherwise correct solution.

**Are duplicates possible, and is the input sorted?** Both change comparison logic — strict against non-strict inequality — and sortedness can change the algorithm entirely.

**What should happen on degenerate input — empty, or a parameter out of range?** ("Degenerate" means the trivial or broken case.) It is about the specification, not the code; settle it first and the final edge-case test confirms agreed behavior instead of discovering it.

**What is the binding constraint — speed, memory, or steady timing?** In embedded work this decides between structures that are otherwise equal: one with good average bounds against a fixed ring buffer with hard bounds.

Four is about right. Ten reads as stalling. None reads as someone who will build the wrong thing confidently.
:::

::: check
Why is `lo + (hi - lo) / 2` preferred over `(lo + hi) / 2`, and why is the C++ answer stronger than the general one?
:::

::: answer
Because `lo + hi` can exceed the largest value the index type can hold, while `hi - lo` cannot: the gap is never bigger than the container, and the container's size must fit.

The C++ point is that signed integer overflow is **undefined behavior**, not wraparound. The compiler may assume it never happens and optimize on that, so the result is not a predictably wrong index — it can be an endless loop or a deleted bounds check. Unsigned types wrap around instead: defined, but still wrong.

Saying "undefined behavior, so the compiler may do anything, including deleting the check I wrote" is a noticeably stronger answer than "it overflows".
:::

::: check
A candidate finishes a correct solution with eight minutes left and says "that's it". What have they left on the table?
:::

::: answer
All of step 5, which is a scored step.

In eight minutes they could walk empty input, a single element, duplicates and the loop boundary through the code; check the maximum size against a timing budget; compare achieved and predicted complexity; and name one change for flight code, such as a fixed-size buffer instead of a growing one.

Announcing "done" untested also signals that "it compiles and looks right" counts as finished. In flight software that attitude ships bugs, and an avionics interviewer is watching for it.
:::

::: check
For the sliding-window maximum, why store indices in the queue rather than values, and what goes wrong if you store values?
:::

::: answer
Because expiry is a question about **position**: "has this entry slid out of the window?" is answered from its index. The code as written, which removes equal values as dominated, cannot tell from a value alone whether the front entry is still inside.

A values-only version can work, but only with a different rule: keep equal values (strict `<` in the dominated test), and when a sample leaves the window, pop the front if it equals that sample. It is more fragile, and the kept duplicates cost space.

The cost of indices is one extra lookup per comparison — `v[idx.back()]` instead of a stored value — and on a processor with a poor cache that second memory access is not free. Storing index and value together in a small struct trades a little memory for locality. Offering that unprompted is a strong close.
:::

::: check
How should you practice for this round, given that the module's exercise asks for forty problems in C++ under a forty-minute clock with narration?
:::

::: answer
The problems are the smaller half. Three things make practice match the real round.

**Narrate out loud every time, even alone.** Talking while solving is a physical skill that falls apart under pressure. Practice silently, and the first time you narrate is the time it counts.

**Record sessions and review where the narration stopped.** That is why the exercise asks for five recordings. Silence clusters around the hard part — exactly where the interviewer most wants to hear you — and only a recording shows it.

**Keep the clock honest, including testing.** Thirty-eight minutes coding and two testing trains the wrong split. Stop coding at minute thirty, whatever the state, and test for the rest. A tested partial solution beats an untested complete one.
:::

## Summary

| Item | Statement |
| --- | --- |
| Format | Two to three problems, medium to hard, C++ where the role is avionics or embedded |
| The discipline | Clarify, state the approach and complexity, write it, test the edges |
| Clarify | Size and range, sortedness and duplicates, degenerate input, binding constraint |
| Complexity first | Commits you to a target and lets the interviewer redirect you early |
| Edge cases | Empty, one element, duplicates, all equal, sorted and reverse sorted, loop boundaries, overflow, maximum size |
| Embedded flavor | Steady timing, no allocation in the loop, signed overflow is undefined behavior, exceptions often disabled, memory layout matters |
| Midpoint | `lo + (hi - lo) / 2`; `(lo + hi) / 2` overflows, and signed overflow is undefined |
| Timing anchor | 1 kHz means a 1000 microsecond budget; $2000^2$ pair tests at a nanosecond each is 4 ms |
| Recovery | Say what you realized, why the approach fails, the replacement and its complexity, then continue |

The last lesson of the module covers the systems and architecture round: real-time behavior, embedded constraints, redundancy and voting, fault detection, sensor fusion, and the timing budget that ties them together.

::: context avionics-embedded Avionics and embedded, in plain words
**Avionics** is a blend of "aviation" and "electronics": the computers, sensors and radios on board an aircraft or spacecraft. **Embedded** software runs inside a device that is not a general-purpose computer — a car's brake controller, a microwave, a rocket's flight computer. Nobody installs apps on it. It does one job, on hardware chosen for that job, often with far less memory and speed than your phone. That is why the interview cares so much about memory and timing: on these machines, both are counted.
:::

::: context undefined-behavior When the rules say nothing
Most languages promise what happens when a number gets too big — it wraps around, or the program stops with an error. For signed integers, C++ makes no promise at all. The standard calls this **undefined behavior**.

That sounds harmless, but compilers use it. If overflow "cannot happen", then a check like "if `i + 1 < i`, something went wrong" can be judged always false and deleted. Your safety check silently vanishes in the fast build. This is why flight-software coding rules spend so many pages on integer arithmetic, and why tools that flag possible overflow are run on flight code.
:::

::: context big-o How fast the work grows
Big-O ignores small details and asks one question: when the input gets bigger, how fast does the work grow? Here is the work for $n = 2000$ items, drawn on a scale where each step right is ten times more:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="8" y="31">O(log n)</text>
    <text x="8" y="61">O(n)</text>
    <text x="8" y="91">O(n log n)</text>
    <text x="8" y="121">O(n²)</text>
  </g>
  <rect x="80" y="20" width="41.6" height="16" fill="#8fb8f0"/>
  <rect x="80" y="50" width="132" height="16" fill="#1d6fd1"/>
  <rect x="80" y="80" width="173.6" height="16" fill="#f2b880"/>
  <rect x="80" y="110" width="264" height="16" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="126" y="32">11</text>
    <text x="217" y="62">2,000</text>
    <text x="258" y="92">22,000</text>
    <text x="236" y="146" text-anchor="middle">4,000,000</text>
  </g>
  <line x1="80" y1="14" x2="80" y2="132" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="120" y1="128" x2="120" y2="134"/><line x1="160" y1="128" x2="160" y2="134"/><line x1="200" y1="128" x2="200" y2="134"/>
    <line x1="240" y1="128" x2="240" y2="134"/><line x1="280" y1="128" x2="280" y2="134"/><line x1="320" y1="128" x2="320" y2="134"/>
  </g>
  <line x1="80" y1="131" x2="344" y2="131" stroke="#6c7a93" stroke-width="1"/>
  <text x="80" y="162" font-size="11" fill="#6c7a93">each grey tick = ten times more work</text>
</svg>
```

Going from $O(n^2)$ to $O(n \log n)$ at this size cuts the work by a factor of about 180. No faster computer gives you that.
:::

::: context deque A queue open at both ends
A **deque** — short for "double-ended queue" and said "deck" — is a line you can join or leave at either end. A normal queue, like a line at a shop, lets you join at the back and leave at the front only. The sliding-window trick needs both: old positions leave from the front when they expire, and small values are thrown out from the back when a bigger one arrives. C++ provides one ready-made as `std::deque`.
:::

::: context ring-buffer A queue that goes round in a circle
A **ring buffer** is a fixed row of slots used as if its ends were joined in a circle. Two markers, a head and a tail, chase each other around it. Adding an item moves the tail one slot on; removing moves the head. When a marker passes the last slot it wraps to slot 0.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g transform="translate(120,85)" stroke="#1f2a44" stroke-width="1.5">
    <path d="M0,-70 A70,70 0 0,1 49.5,-49.5 L24.7,-24.7 A35,35 0 0,0 0,-35 Z" fill="#8fb8f0"/>
    <path d="M49.5,-49.5 A70,70 0 0,1 70,0 L35,0 A35,35 0 0,0 24.7,-24.7 Z" fill="#8fb8f0"/>
    <path d="M70,0 A70,70 0 0,1 49.5,49.5 L24.7,24.7 A35,35 0 0,0 35,0 Z" fill="#8fb8f0"/>
    <path d="M49.5,49.5 A70,70 0 0,1 0,70 L0,35 A35,35 0 0,0 24.7,24.7 Z" fill="#fff"/>
    <path d="M0,70 A70,70 0 0,1 -49.5,49.5 L-24.7,24.7 A35,35 0 0,0 0,35 Z" fill="#fff"/>
    <path d="M-49.5,49.5 A70,70 0 0,1 -70,0 L-35,0 A35,35 0 0,0 -24.7,24.7 Z" fill="#fff"/>
    <path d="M-70,0 A70,70 0 0,1 -49.5,-49.5 L-24.7,-24.7 A35,35 0 0,0 -35,0 Z" fill="#fff"/>
    <path d="M-49.5,-49.5 A70,70 0 0,1 0,-70 L0,-35 A35,35 0 0,0 -24.7,-24.7 Z" fill="#fff"/>
  </g>
  <text x="120" y="90" font-size="12" text-anchor="middle" fill="#1f2a44">8 slots</text>
  <line x1="120" y1="8" x2="120" y2="24" stroke="#1d6fd1" stroke-width="2"/>
  <text x="128" y="16" font-size="12" fill="#1d6fd1">head</text>
  <line x1="178" y1="143" x2="165" y2="130" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="158" font-size="12" fill="#b4232c">tail</text>
  <text x="220" y="70" font-size="12" fill="#1f2a44">blue: 3 items stored</text>
  <text x="220" y="90" font-size="12" fill="#1f2a44">white: 5 free slots</text>
  <text x="220" y="110" font-size="12" fill="#6c7a93">no memory ever added</text>
</svg>
```

The memory is set aside once and never grows, which is exactly what a control loop wants.
:::

::: context lookup-tables Why rockets carry tables
How much drag or lift a vehicle feels depends on its speed and angle in complicated ways. Instead of solving the airflow on board, engineers measure or compute the answers ahead of time — in wind tunnels and simulations — and store them as a table of numbers. In flight, the computer looks up the two nearest rows and draws a straight line between them to estimate the value in between. That in-between step is **interpolation**. Finding the right pair of rows, fast and without error, is the job of the function in this example.
:::

::: context binary-search-bug A bug that hid for years
This is not a made-up trap. In 2006 Joshua Bloch, then at Google, wrote that the binary search in Java's standard library had exactly this bug: `(low + high) / 2` overflowed once arrays grew past about a billion elements. The same line appears in Jon Bentley's classic book *Programming Pearls*. For years nobody hit it, because nobody had arrays that big. Then people did. The lesson interviewers want you to know: code that has "always worked" may only have never met a large enough input.
:::

::: context frame-budget The one-millisecond frame
"1 kHz" (said "one kilohertz") means one thousand times per second, so each pass of the loop gets $1/1000$ of a second: 1 millisecond, or 1000 microseconds. Everything — reading sensors, estimating, steering — must fit inside. A 4 ms job does not fit, however you slice it:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="20" y="30" width="80" height="26"/>
    <rect x="100" y="30" width="80" height="26"/>
    <rect x="180" y="30" width="80" height="26"/>
    <rect x="260" y="30" width="80" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="47">frame 1</text>
    <text x="140" y="47">frame 2</text>
    <text x="220" y="47">frame 3</text>
    <text x="300" y="47">frame 4</text>
    <text x="60" y="22">1 ms</text>
  </g>
  <rect x="20" y="66" width="320" height="18" fill="#b4232c"/>
  <text x="180" y="79" font-size="11" fill="#fff" text-anchor="middle">O(n²) pair check: 4 ms</text>
  <rect x="20" y="92" width="1.8" height="18" fill="#1d6fd1"/>
  <text x="28" y="105" font-size="11" fill="#1d6fd1">sort + sweep: about 22 µs (a sliver of frame 1)</text>
</svg>
```

Missing the frame is not "a bit slow": the controller has no fresh command to send.
:::
