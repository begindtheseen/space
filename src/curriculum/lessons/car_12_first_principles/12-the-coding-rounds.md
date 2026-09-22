---
id: l12-the-coding-rounds
title: "The coding rounds, narrated"
minutes: 23
covers:
  - the coding rounds: 2 to 3 problems at medium to hard difficulty, C++ for avionics and embedded
  - coding round discipline: clarify, state the approach and complexity, write it, test the edges
  - thinking aloud as an explicitly evaluated skill
---

Two rounds sit alongside the whiteboard round and are graded on the same axis. This lesson covers the first of them: the coding rounds, typically two to three problems at medium to hard difficulty, in C++ where the role is avionics or embedded.

It belongs in this module rather than in a separate one because the thing being assessed is identical. Nobody is checking whether you have memorised a data structure. They are watching whether you decompose a problem before attacking it, state what you are about to do, carry it through without drift, and test the result — the same four behaviours the first-principles round looks for, applied to code instead of physics. The module states the discipline explicitly: **clarify, state the approach and complexity, write it, test the edges.**

The one thing that genuinely differs is the language and what it implies. A coding round conducted in C++ for a flight-software or avionics role is asking a narrower question than a general algorithms interview, and knowing which question it is changes the answer you give.

## What "C++ for avionics and embedded" changes

Flight software runs on a processor with a fixed budget, in a loop that must finish on time every time. That constrains the solution space in ways worth naming out loud, because naming them is most of the signal in this round.

- **Deterministic timing matters more than average speed.** A structure with amortised constant-time operations and occasional reallocation is worse than one that is always a little slower and never surprises you. Say which you are choosing and why.
- **Dynamic allocation in the control loop is usually forbidden.** Allocate once at initialisation, or use fixed-size storage. `std::vector` is fine if you `reserve` up front and never grow it; growing it inside a 1 kHz loop is not.
- **Integer overflow is a real failure mode, not a puzzle.** Sensor counts, tick counters and index arithmetic all overflow, and signed overflow in C++ is undefined behaviour, which means the compiler may assume it cannot happen and optimise accordingly.
- **Exceptions are often disabled**, so error reporting is by return value or status code. Say so rather than writing a `throw` and hoping.
- **Memory layout affects timing.** A structure-of-arrays traversal that touches contiguous memory is measurably faster than chasing pointers, and on a small processor with a small cache the difference can be the whole budget.

None of this means you must write embedded code in the interview. It means that when you choose a data structure, the sentence justifying the choice should mention one of these, because that is what distinguishes a candidate who has written flight software from one who has solved a lot of puzzles.

::: key
Coding round discipline: restate the problem, ask clarifying questions, state the approach and its time and space complexity before writing, write it, then test the edge cases — empty, single element, duplicates, overflow, and the boundary of every loop. Silence while thinking is fine if you say that is what you are doing.
:::

## The five steps, with timings

A forty-minute problem, allocated.

1. **Restate** (30 seconds). One sentence back, in your own words. It catches misreadings before they cost ten minutes.
2. **Clarify** (1–2 minutes). Only the questions whose answers change the solution: input size and range, whether the data is sorted, whether duplicates occur, what to return on empty input, whether you may modify the input, whether memory or latency is the binding constraint. Three or four questions, not ten.
3. **State the approach and its complexity** (2–3 minutes). The algorithm in two sentences, then time and space in big-O, *before* writing any code. If you can name a simpler approach you are rejecting, name it and say why.
4. **Write it** (15–20 minutes), narrating as you go. Not a monologue on every token: a sentence per block about what that block is for.
5. **Test the edges** (5–8 minutes), out loud, walking real values through the code. This is the step most often skipped and the one that most often finds a bug.

The reason to state complexity before writing is not ceremony. It commits you to a target, so that if the code you are producing is drifting towards a nested loop you notice it yourself. It also lets the interviewer redirect you in ten seconds if your target is not the one they wanted — which is worth a great deal when the alternative is finding out at minute thirty.

::: warning Do not start typing during the clarifying questions
The commonest way to lose this round is to hear the problem, recognise something similar, and begin writing while still talking. The code that results is the code for the similar problem, and the differences surface in testing, with ten minutes left. Keep your hands off the keyboard until step 3 is finished and you have said the complexity out loud.
:::

## The edge-case checklist

Memorise this list. Going through it aloud at the end takes ninety seconds and it is scored.

- **Empty input.** What does the function return? Is that documented?
- **One element.** Many loop bodies are wrong for $n = 1$.
- **All elements equal**, and **duplicates generally** — the classic killer of comparison logic that uses strict inequality where it needs non-strict.
- **Already sorted, and reverse sorted**, for anything order-dependent.
- **The boundary of every loop.** Does the last iteration read one past the end? Is the comparison `<` or `<=`?
- **Overflow.** Index arithmetic, sums, products, and anything multiplied by a sample count.
- **The maximum input size**, checked against the timing budget rather than against intuition.

::: example A sliding-window maximum, narrated
**The problem.** Given a stream of $n$ sensor samples and a window length $k$, produce the maximum over every window of length $k$.

**Restate.** *"For each position from $k-1$ to $n-1$, I want the largest value in the last $k$ samples. Output length is $n - k + 1$."*

**Clarify.** *"Can $k$ exceed $n$? What should I return then — empty, or an error? Are the samples floating point? Is this running inside a control loop, so allocation matters? And is $n$ known at initialisation?"* Assume: return empty if $k > n$ or $k = 0$; `double` samples; yes, it runs in a loop, so allocate once.

**State the approach and complexity.** *"The obvious approach is to scan each window, which is $O(nk)$ — for $n = 2000$ and $k = 50$ that is $10^5$ comparisons, which is fine, but it degrades badly as $k$ grows. Instead I will keep a double-ended queue of indices whose values are strictly decreasing. The front is always the current window's maximum. Each index is pushed once and popped at most once, so the total work is $O(n)$ time and $O(k)$ space."*

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

**Two choices to narrate as you write them.** Storing *indices* rather than values, because expiry is a question about position, not about magnitude. And `<=` rather than `<` in the domination test, so that equal values are removed — without it, duplicates accumulate in the queue and the space bound is no longer $O(k)$.

**Test the edges, out loud.** With `v = {3,1,4,1,5,9,2,6}` and `k = 3` the output is `{4,4,5,9,9,9}`, which is correct by inspection of each window. `k = 1` returns all eight inputs unchanged. `k = 8` returns a single element, 9. `k = 9` returns empty, as documented. An empty input returns empty. And `{2,2,2,2}` with `k = 2` returns `{2,2,2}`, which is the duplicate case the `<=` was for.

**Close on the embedded point.** *"The `std::deque` allocates in blocks. In flight code I would replace it with a fixed-size ring buffer of capacity $k$, which is provably enough because the queue never holds more than $k$ indices, and then the whole function is allocation-free after the one `reserve`."* That sentence is worth as much as the algorithm.
:::

::: example A table lookup, and the bug that is always in it
**The problem.** An aerodynamic coefficient table is stored as a sorted array of breakpoints. Given a query $x$, find the largest index $i$ with `table[i] <= x`, so the caller can interpolate between $i$ and $i+1$.

**Clarify.** *"What happens if $x$ is below the first breakpoint — clamp or error? Above the last? Can the table be empty? Are duplicate breakpoints possible?"* Assume: below the first is an error, above the last clamps to the last index, no duplicates.

**Approach and complexity.** *"Binary search, $O(\log n)$ time, $O(1)$ space. For a 2000-row table that is about 11 comparisons. A linear scan would be 2000, which at roughly a nanosecond each is about 2 microseconds — still inside a 1 kHz budget of 1000 microseconds, but 200 times more than it needs to be, and I would rather spend that elsewhere."*

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

**The bug that is always in it.** Writing the midpoint as `(lo + hi) / 2` is the standard form and it overflows. With 32-bit signed indices, $2^{31} - 1 = 2147483647$, so `lo = 2000000000` and `hi = 2100000000` sum to $2.0\times 10^9 + 2.1\times 10^9 = 4.1\times 10^9$, which does not fit — and in C++ signed overflow is undefined behaviour, so the result is not merely wrong, it is unconstrained. `lo + (hi - lo + 1) / 2` cannot overflow because the difference is bounded by the array size. Say this as you write it; it is a small thing that reads as experience.

**The second bug that is always in it.** The `+ 1` in the midpoint. Without it, when `hi == lo + 1` and the test sends `lo = mid`, the interval never shrinks and the loop runs forever. Choosing the upper midpoint whenever the update is `lo = mid` is the rule, and stating the rule is better than stating the fix.

**Test the edges.** With `table = {0.0, 0.5, 1.0, 1.5, 2.0}`: $x = -0.1$ returns `npos`; $x = 0.0$ returns 0, the boundary case; $x = 0.7$ returns 1; $x = 1.5$ returns 3, exactly on a breakpoint, which is where a strict-inequality version would return 2 and break the interpolation; $x = 9.9$ returns 4, clamped as documented. An empty table returns `npos`. Six cases, ninety seconds, and two of them exercise the comparison that is easiest to get wrong.
:::

## Narrating under the clock

Everything lesson 1 said about thinking aloud applies here, with two additions specific to code.

**Narrate intent, not syntax.** *"Now the expiry check: anything whose index has fallen out of the window comes off the front"* is useful. *"Now I type while, open paren, exclamation mark"* is not. One sentence per block.

**Label silences, as always.** Writing code needs longer quiet stretches than deriving does, and that is fine as long as they are announced. *"I am going to write the loop body now — give me two minutes and then I will walk you through it."* Then do exactly that.

There is a third habit that matters most when things go wrong. If, part way through, you realise your approach will not work — it is too slow, it cannot handle a case, the data structure is wrong — the recovery is to **say what you have realised, say why the approach fails, propose the replacement with its complexity, and continue from there.** The failure mode to avoid is the silent one: continuing to type in the hope it works out, or wiping the board and starting again without narration. Both remove the interviewer's ability to follow you, and following you is what they are there to do.

::: example Changing approach out loud, at minute twelve
**The problem.** Given $n$ vehicle-state samples, report every pair closer than a threshold in both position and time.

**Twelve minutes in**, the candidate has a doubly nested loop half written and stops.

*"Let me pause — I want to check this against the timing budget before I finish it. This is $O(n^2)$. The problem said $n$ can be 2000, so that is $2000^2 = 4\times 10^6$ pair tests. At roughly a nanosecond each that is $4\times 10^6 \times 10^{-9} = 4\times 10^{-3}$ seconds — four milliseconds. If this has to run inside a 1 kHz loop, the budget is 1000 microseconds and I am four times over it. So this approach does not fit and I should change it now rather than finish it.*

*The replacement: sort by time, which is $O(n\log n)$ — about $2000 \times 11 = 22000$ operations, call it 22 microseconds — then sweep with a moving window containing only the samples within the time threshold. Each sample enters and leaves the window once, so the sweep is linear in $n$ plus the number of pairs actually reported. If the threshold is tight, that is close to $O(n\log n)$ overall and fits the budget with room to spare.*

*The assumption I am making is that the time threshold is small enough that the window stays short. If the data can be dense enough that most pairs qualify, no algorithm beats $O(n^2)$, because the output itself is that large — and in that case I would ask whether we actually need every pair or only a count."*

**What that ninety seconds demonstrated.** A budget was checked against a stated input size; a specific numerical failure was identified; a replacement was proposed with its complexity; the assumption the replacement rests on was named; and the case where no algorithm can help was distinguished from the case where this one can. None of it required knowing anything clever.
:::

## Check yourself

::: check
Name the four clarifying questions you would ask before writing any code, and say why each one can change the solution.
:::

::: answer
**Input size and range.** It decides whether $O(n^2)$ is acceptable and whether index arithmetic can overflow. It is the only question whose answer can invalidate an otherwise correct solution.

**Are duplicates possible, and is the input sorted?** Both change comparison logic — strict against non-strict inequality — and sortedness can change the algorithm entirely.

**What should happen on degenerate input: empty, or a parameter out of range?** This is a specification question, not an implementation one, and answering it up front means the edge-case test at the end confirms documented behaviour instead of discovering it.

**What is the binding constraint — latency, memory, or determinism?** In an embedded context this decides between structures that are otherwise equivalent: a heap with amortised bounds against a fixed ring buffer with hard bounds.

Four is about right. Ten reads as stalling, and none reads as someone who will implement the wrong thing confidently.
:::

::: check
Why is `lo + (hi - lo) / 2` preferred over `(lo + hi) / 2`, and why is the C++ answer stronger than the general one?
:::

::: answer
Because `lo + hi` can exceed the range of the index type while `hi - lo` cannot: the difference is bounded by the size of the container, which is necessarily representable.

The C++-specific point is that signed integer overflow is **undefined behaviour**, not wraparound. A compiler is entitled to assume it never happens and to optimise on that assumption, so the consequence is not a predictably wrong index — it can be a loop that never terminates or a bounds check that is eliminated. On unsigned types the arithmetic wraps rather than being undefined, which is defined but still wrong.

Saying "undefined behaviour, so the compiler may do anything, including deleting the check I wrote" is a noticeably stronger answer than "it overflows".
:::

::: check
A candidate finishes a correct solution with eight minutes left and says "that's it". What have they left on the table?
:::

::: answer
The whole of step 5, which is a scored step.

With eight minutes they could walk real values through the code for empty input, a single element, duplicates, and the loop boundary; check the maximum input size against a stated timing budget; state the complexity they actually achieved against the complexity they predicted; and name one thing they would change for flight code — a fixed-size buffer instead of a growing one, or removing an allocation.

Announcing completion without testing also carries a signal beyond the missing coverage: the candidate treats "it compiles and looks right" as done. In flight software that is the disposition that ships bugs, and an interviewer for an avionics role is specifically watching for it.
:::

::: check
For the sliding-window maximum, why store indices in the queue rather than values, and what breaks if you store values?
:::

::: answer
Because the expiry test is a question about **position**: an entry must be removed when it has fallen out of the window, and "has it fallen out" can only be answered from its index. With values alone there is no way to know whether the front entry is still inside the window.

Storing values with a counter does not fix it either, because the entries that were popped as dominated are gone, so the counter no longer tracks the right positions.

The cost of storing indices is one extra indirection per comparison, `v[idx.back()]` instead of a stored value — which is worth mentioning in an embedded context, because that indirection is a second memory access and on a cache-poor processor it is not free. The clean resolution is to store both the index and the value in a small struct, trading a little space for locality. Offering that trade-off unprompted is a strong close.
:::

::: check
How should you practise for this round, given that the module's exercise asks for forty problems in C++ under a forty-minute clock with narration?
:::

::: answer
The problems are the smaller half of it. Three things make the practice match the round.

**Narrate out loud every time, alone, with nobody listening.** Narration under observation is a physical skill and it degrades under pressure exactly when you need it. Practising silently and narrating only in the interview means the first time you try it is the time it counts.

**Record the sessions and review where the narration stopped.** The exercise asks for five recordings for this reason. Silence clusters around the hard part of the problem, which is precisely where the interviewer most wants to hear you, and you will not notice the pattern without the recording.

**Keep the clock honest, including the testing step.** A forty-minute problem where you spend thirty-eight minutes coding and two testing has trained the wrong allocation. Stop coding at the thirty-minute mark whatever state the solution is in, and spend the rest testing — that is closer to how the round is actually scored, and finishing a tested partial solution beats an untested complete one.
:::

## Summary

| Item | Statement |
| --- | --- |
| Format | Two to three problems, medium to hard, C++ where the role is avionics or embedded |
| The discipline | Clarify, state the approach and complexity, write it, test the edges |
| Clarify | Size and range, sortedness and duplicates, degenerate input, binding constraint |
| Complexity first | Commits you to a target and lets the interviewer redirect you early |
| Edge cases | Empty, one element, duplicates, all equal, sorted and reverse sorted, loop boundaries, overflow, maximum size |
| Embedded flavour | Deterministic timing, no allocation in the loop, overflow is undefined behaviour, exceptions often disabled, memory layout matters |
| Midpoint | `lo + (hi - lo) / 2`; `(lo + hi) / 2` overflows, and signed overflow is undefined |
| Timing anchor | 1 kHz means a 1000 microsecond budget; $2000^2$ pair tests at a nanosecond each is 4 ms |
| Recovery | Say what you realised, why the approach fails, the replacement and its complexity, then continue |

The last lesson of the module covers the systems and architecture round: real-time behaviour, embedded constraints, redundancy and voting, fault detection and isolation, sensor fusion architecture, and the timing budget that ties them together.
