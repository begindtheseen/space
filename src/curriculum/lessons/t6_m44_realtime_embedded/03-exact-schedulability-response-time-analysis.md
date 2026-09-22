---
id: l03-response-time-analysis
title: Exact schedulability by response-time analysis
minutes: 18
covers:
  - Exact schedulability by response-time analysis, and why the utilisation bound is only sufficient
---

The Liu-Layland bound is a one-way door. Clear it and you are done; fail it and you know nothing at all — not that the task set is unsafe, only that this particular test declines to say. A design that fails the bound and gets redesigned, split across two processors, or has a task rate cut in half on that basis alone may have thrown away perfectly good, perfectly safe margin for no reason beyond a test that was never built to catch it. This lesson gives you the tool that actually closes the question: exact schedulability by response-time analysis, which is necessary and sufficient for a fixed-priority task set, in either direction, every time.

It will also do the opposite job. A task set can pass the loosest check anyone runs on it — total utilisation under $100\%$, the processor is not even fully booked — and still miss a deadline, because *how* the work is packed in time matters as much as how much of it there is. By the end of this lesson you will have run the exact arithmetic on a task set the utilisation bound rejects and watched it pass, and on a task set that looks safe by simple addition and watched it fail. Both numbers are worth trusting more than any rule of thumb, because you will have derived them, not looked them up.

## The critical instant

Response-time analysis starts from a question: for task $i$, what is the longest time it could ever take, from release to completion, given everything of higher priority that could possibly delay it? The answer depends on *when* the higher-priority tasks happen to release relative to task $i$ — release late and they cost nothing; release right at the start and they cost the most.

The worst case, called the **critical instant**, is when task $i$ and every higher-priority task release simultaneously. The argument is short: each higher-priority task $j$ interferes with task $i$ once per release of $j$ that falls inside the window before task $i$ finishes, and the number of such releases is maximised, for a window of any given length, by placing $j$'s first release as early as possible in that window — at its very start. This is true independently for every higher-priority task, so the single instant that maximises interference from *all* of them at once is the instant where they all release together with task $i$. Response-time analysis therefore only ever needs to examine one moment in the whole schedule: everything releasing at $t=0$.

## The response-time equation

Let $\mathrm{hp}(i)$ be the set of tasks with higher priority than task $i$. At the critical instant, task $i$'s completion time $R_i$ — its **response time** — has to account for its own execution, $C_i$, plus every interruption a higher-priority task causes within that span. In an interval of length $R_i$, task $j \in \mathrm{hp}(i)$ releases $\lceil R_i / T_j \rceil$ times, each costing $C_j$ of the processor. That gives the equation used throughout this module:

$$
R_i = C_i + \sum_{j \,\in\, \mathrm{hp}(i)} \left\lceil \frac{R_i}{T_j} \right\rceil C_j.
$$

$R_i$ appears on both sides, inside a ceiling, so there is no algebraic solution — but the equation is solved by a **fixed-point iteration**: start at $R^{(0)} = C_i$, substitute into the right-hand side to get $R^{(1)}$, substitute that back in for $R^{(2)}$, and so on, until $R^{(k+1)} = R^{(k)}$. The right-hand side is non-decreasing in $R$, so the sequence never decreases; it either converges to a fixed point at or below $D_i$, in which case that fixed point is the true worst-case response time, or it exceeds $D_i$ at some step, in which case you stop immediately — the task cannot meet its deadline and no further iteration will change that. Doing this once per task, from highest priority to lowest (a task's own equation only ever needs the tasks above it), decides the entire task set. This is not a heuristic: it is **necessary and sufficient**. There is no gap left over the way there is with the utilisation bound.

## Demonstration: failing the bound, passing exactly

Three tasks, rate-monotonic priorities (shortest period highest):

| Task | $C_i$ | $T_i = D_i$ |
| --- | --- | --- |
| 1 (highest) | $1$ | $3$ |
| 2 | $2$ | $8$ |
| 3 (lowest) | $3$ | $12$ |

Total utilisation: $U = \tfrac{1}{3} + \tfrac{2}{8} + \tfrac{3}{12} = 0.3333 + 0.25 + 0.25 = 0.8333$. The three-task Liu-Layland bound, from the last lesson, is $3(2^{1/3}-1) = 0.7798$. Since $0.8333 > 0.7798$, the sufficient test declines this task set outright — not "unschedulable," only refused. Run the exact analysis instead.

**Task 1** has no higher-priority tasks, so $R_1 = C_1 = 1\,\mathrm{ms}$ with nothing to iterate. Against $D_1 = 3$: meets, with room to spare.

**Task 2** has one higher-priority task above it (task 1):

| $k$ | $R^{(k)}$ | $C_2 + \lceil R^{(k)}/T_1\rceil C_1$ |
| --- | --- | --- |
| 0 | $2$ | — |
| 1 | $2 + \lceil 2/3\rceil\cdot1 = 3$ | |
| 2 | $2 + \lceil 3/3\rceil\cdot1 = 3$ | converged |

$R_2 = 3\,\mathrm{ms}$ against $D_2 = 8$: meets.

**Task 3**, the lowest priority, sees interference from both tasks above it:

| $k$ | $R^{(k)}$ | $C_3 + \lceil R^{(k)}/T_1\rceil C_1 + \lceil R^{(k)}/T_2\rceil C_2$ |
| --- | --- | --- |
| 0 | $3$ | — |
| 1 | $3+\lceil3/3\rceil\cdot1+\lceil3/8\rceil\cdot2 = 3+1+2=6$ | |
| 2 | $3+\lceil6/3\rceil\cdot1+\lceil6/8\rceil\cdot2 = 3+2+2=7$ | |
| 3 | $3+\lceil7/3\rceil\cdot1+\lceil7/8\rceil\cdot2 = 3+3+2=8$ | |
| 4 | $3+\lceil8/3\rceil\cdot1+\lceil8/8\rceil\cdot2 = 3+3+2=8$ | converged |

$R_3 = 8\,\mathrm{ms}$ against $D_3 = 12$: meets, with four milliseconds of slack.

::: example Every task meets its deadline, and the bound said nothing useful
All three tasks are schedulable — $1 \le 3$, $3 \le 8$, $8 \le 12$ — despite a total utilisation of $83.3\%$, well above the $78.0\%$ this task count is guaranteed safe under. This was not a cherry-picked edge case; it is the ordinary situation. The Liu-Layland bound is derived from the single worst possible relationship between periods that could exist for three tasks at a given utilisation, and the periods $3, 8, 12$ do not happen to realise that relationship — the ratios are close enough to harmonic ($8/3 = 2.67$, $12/8=1.5$) that the interference pattern stays mild. A rejected bound tells you the worst case *somewhere in the space of all period combinations* at this utilisation is unsafe. It does not tell you that *your* combination is that worst case, and response-time analysis is what finds out.
:::

## Demonstration: passing a naive check, missing exactly

Now the opposite failure. Two tasks:

| Task | $C_i$ | $T_i = D_i$ |
| --- | --- | --- |
| 1 (highest) | $5$ | $8$ |
| 2 (lowest) | $4$ | $11$ |

Total utilisation: $U = \tfrac{5}{8} + \tfrac{4}{11} = 0.625 + 0.3636 = 0.9886$. This clears the one check every scheduling policy needs as a bare minimum — the processor is not asked for more than it has, with over a percent to spare. It is not the Liu-Layland bound (which for two tasks is $0.8284$, and $0.9886$ is nowhere near it) — only the plain fact that $U < 1$. An engineer who checked no more than "are we under $100\%$" would sign off on this task set.

**Task 1**, highest priority: $R_1 = C_1 = 5\,\mathrm{ms} \le D_1 = 8$. Meets.

**Task 2**:

| $k$ | $R^{(k)}$ | $C_2 + \lceil R^{(k)}/T_1\rceil C_1$ |
| --- | --- | --- |
| 0 | $4$ | — |
| 1 | $4+\lceil4/8\rceil\cdot5 = 4+5=9$ | |
| 2 | $4+\lceil9/8\rceil\cdot5 = 4+10=14$ | |
| 3 | $4+\lceil14/8\rceil\cdot5 = 4+10=14$ | converged |

$R_2 = 14\,\mathrm{ms}$ against $D_2 = 11\,\mathrm{ms}$: **misses**, by three milliseconds.

::: example A miss the utilisation sum could never see
Walk the same scenario as a timeline and the miss is not an artefact of the formula. Both tasks release at $t=0$. Task 1, higher priority, runs first: $[0,5)$. Task 2 starts at $t=5$, needs $4\,\mathrm{ms}$, and would finish at $t=9$ if left alone — but task 1 releases its second job at $t=8$, before task 2 is done, and preempts it. Task 2 has completed $3$ of its $4\,\mathrm{ms}$ (from $t=5$ to $t=8$); one millisecond remains. Task 1's second job runs $[8,13)$. Task 2 resumes at $t=13$, finishes its last millisecond at $t=14$ — exactly the $R_2 = 14$ the iteration found. Its deadline, relative to its release at $t=0$, was $t=11$. It is three milliseconds late.

The mechanism is the period ratio. $T_1 = 8$ and $T_2 = 11$ do not divide one another, so within task 2's own $11\,\mathrm{ms}$ window, task 1 manages *two* releases rather than the one a naive utilisation sum implicitly assumes — the interference term jumped from $\lceil 4/8\rceil=1$ to $\lceil 14/8\rceil=2$ as the response time crossed the second multiple of $8$. Total utilisation adds up capacity; it has no way to see that a task's own deadline can fall inside a window where a faster task manages one extra release it would not have managed with a slightly different period. That stepwise jump, not the amount of work, is what the exact analysis catches and the sum cannot.
:::

## Why the two tests disagree

Both demonstrations come from the same root cause: total utilisation is a statement about *how much* processor time is claimed, and schedulability is a statement about *whether that time can be arranged*, in the given periods, without ever asking for two things at once. The Liu-Layland bound handles the arrangement question by assuming the worst arrangement that could exist for $n$ tasks at that utilisation — which makes it safe to trust when it passes, and needlessly pessimistic for the many task sets whose actual periods are friendlier than the worst case. The bare utilisation sum $U \le 1$ does not consider arrangement at all — which is exactly why it can pass a task set whose particular period ratio forces one task into an extra, deadline-breaking release of another. Response-time analysis is the only one of the three that looks at the actual periods of the actual tasks and asks the actual question: at the one instant that matters, does the work fit before the deadline. That is what "necessary and sufficient" buys you, and it is why it is the test a real schedulability argument is built on, not the bound.

::: key
**Exact response-time analysis**: $R_i = C_i + \sum_{j\in\mathrm{hp}(i)} \lceil R_i/T_j\rceil\,C_j$, iterated from $R_i^{(0)}=C_i$ to a fixed point, evaluated at the critical instant (all tasks releasing together). Task $i$ is schedulable iff $R_i \le D_i$. Necessary and sufficient for fixed-priority scheduling — unlike the utilisation bound, it resolves every task set, in both directions.
:::

::: warning
A failed Liu-Layland bound is not a design defect to fix by construction — it is an open question to close by calculation. Cutting a rate, moving a task to another core, or re-deriving a controller for a slower loop, on the strength of a failed bound alone, can throw away schedulable margin that a five-line iteration would have proven was already safe. Run the exact test before you change anything the bound merely declined to bless.
:::

## Check yourself

::: check
A task set of three tasks fails the Liu-Layland bound. A reviewer says "then it is not schedulable under rate-monotonic priorities." Is the reviewer correct, and what is the one calculation that settles the question?
:::

::: answer
The reviewer is not entitled to that conclusion from a failed bound alone — the bound is sufficient, not necessary, so failing it means the test declines to say either way, not that the task set is unschedulable. The calculation that settles it is response-time analysis: compute $R_i$ for each task from highest priority to lowest using the fixed-point iteration, and compare each to its deadline. If every $R_i \le D_i$, the set is schedulable despite the failed bound, exactly as in this lesson's first demonstration; if some $R_i > D_i$, only then is "not schedulable under rate-monotonic priorities" a conclusion the evidence supports.
:::

::: check
Explain why the response-time iteration is guaranteed to either converge or exceed the deadline, rather than oscillating or running forever.
:::

::: answer
The right-hand side, $C_i + \sum_j \lceil R/T_j\rceil C_j$, is a non-decreasing function of $R$ — increasing $R$ can only keep each ceiling term the same or push it up, never down — so the sequence $R^{(0)}, R^{(1)}, R^{(2)}, \dots$ generated by substituting each output back in is non-decreasing itself. A non-decreasing sequence of values drawn from a discrete set (sums of $C_i$ and integer multiples of the $C_j$) either stops increasing, at which point it has reached a fixed point, or it keeps climbing — and once it climbs past $D_i$, the task cannot meet its deadline no matter what a further iteration would produce, so the calculation stops there rather than continuing forever.
:::

::: check
A task has one higher-priority task above it, with $C_1=3, T_1=10$, and the task itself has $C_2=6$. Run the response-time iteration by hand to convergence, and state whether it is schedulable against $D_2=16$.
:::

::: answer
$R^{(0)} = C_2 = 6$. $R^{(1)} = 6 + \lceil 6/10\rceil\cdot3 = 6+3=9$. $R^{(2)} = 6+\lceil9/10\rceil\cdot3=6+3=9$, converged at $R_2=9$. Since $9 \le 16$, the task is schedulable, with seven milliseconds of slack against its deadline.
:::

::: check
In the "passing a naive check" demonstration, suppose task 2's period were changed from $T_2=11$ to $T_2=16$ instead, with $C_2=4$ unchanged and task 1 unchanged. Recompute $U$ and $R_2$, and say whether this period change alone fixes the miss.
:::

::: answer
$U = 5/8 + 4/16 = 0.625+0.25=0.875$, still under $1$ and in fact now closer to (though still above) the two-task Liu-Layland bound of $0.8284$. For $R_2$: $R^{(0)}=4$, $R^{(1)}=4+\lceil4/8\rceil\cdot5=4+5=9$, $R^{(2)}=4+\lceil9/8\rceil\cdot5=4+10=14$, $R^{(3)}=4+\lceil14/8\rceil\cdot5=4+10=14$, converged at $R_2=14$. Against the new $D_2=16$, $14\le16$: this change fixes the miss, but notice it did so by loosening the *deadline*, not by reducing the interference — $R_2=14$ is identical to before, because task 1's behaviour and task 2's own execution time never changed. The lesson is that a deadline miss can sometimes be resolved by giving a task more room rather than by making anything run faster, and the iteration tells you exactly how much room is enough.
:::

::: check
Why does the critical-instant argument only need to check one release of each task, rather than checking every possible combination of release times a real mission could ever produce?
:::

::: answer
The critical-instant theorem shows that simultaneous release of task $i$ with every higher-priority task produces the maximum possible interference for task $i$'s first job — any other relative phasing gives each higher-priority task fewer or later releases inside the window, hence less or equal interference. Since it is provably the worst case, a response time computed at the critical instant is an upper bound on the response time under any other phasing the tasks could ever actually exhibit in flight, so proving schedulability there proves it for every phasing without needing to enumerate the (infinite) space of possible offsets separately.
:::

## Summary

| Item | Statement |
| --- | --- |
| Critical instant | Task $i$ and every higher-priority task release simultaneously — the phasing that maximises interference |
| Response-time equation | $R_i = C_i + \sum_{j\in\mathrm{hp}(i)}\lceil R_i/T_j\rceil C_j$ |
| Solution method | Fixed-point iteration from $R^{(0)}=C_i$; stop at convergence or once $R^{(k)}>D_i$ |
| Schedulability | Task $i$ meets its deadline iff $R_i \le D_i$; necessary and sufficient |
| Demo 1 | $(1,3),(2,8),(3,12)$: $U=0.833$ fails the $n{=}3$ bound ($0.780$), but $R=1,3,8$ all meet their deadlines |
| Demo 2 | $(5,8),(4,11)$: $U=0.989\le1$ passes the bare capacity check, but $R_2=14>11$ misses |
| Why they disagree | The bound assumes worst-case period alignment; the bare sum ignores alignment entirely; only RTA checks the actual periods |

You now have an exact answer for any fixed-priority task set. The next lesson turns to a different way a deadline gets missed even when every $C_i$ and $T_i$ is exactly as analysed here: a high-priority task blocked, not by arithmetic, but by a lock held by a task with no business delaying it at all.
