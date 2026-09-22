---
id: l02-rate-monotonic-and-edf
title: Fixed-priority scheduling and earliest-deadline-first
minutes: 20
covers:
  - "Fixed-priority scheduling: rate-monotonic priority assignment and the Liu-Layland utilisation bound"
  - Earliest-deadline-first and why it achieves higher utilisation but degrades worse on overload
---

A processor running several periodic control tasks needs a rule for deciding which one runs when two are ready at once. Get the rule wrong and a task set that could easily meet every deadline misses one; get it right and you can sometimes state, from a single line of arithmetic, that every deadline is safe no matter how the tasks happen to line up. This lesson gives you the two dominant rules — fixed priority, assigned once by period, and earliest-deadline-first, reassigned continuously — and the sufficient test that goes with each.

Both rules assume the same task model for now, the one nearly every real-time scheduling result is built on: a set of independent, periodic tasks, task $i$ needing at most $C_i$ of CPU time every period $T_i$, with its deadline equal to its period, $D_i = T_i$. Real flight schedules are not always this tidy — a later lesson touches deadlines shorter than periods — but this model already carries the two ideas that matter most: how to assign priority, and what fraction of the processor you are allowed to use.

## Rate-monotonic priority assignment

**Rate-monotonic (RM)** priority assignment is the rule: shorter period gets higher priority, fixed for the life of the task, decided once at design time rather than recomputed while the system runs. A $5\,\mathrm{ms}$ attitude-rate loop outranks a $50\,\mathrm{ms}$ guidance update, which outranks a $1\,\mathrm{s}$ health-check task, and that ranking never changes while the vehicle flies.

The reason this particular rule and not some other fixed assignment is the one worth knowing: Liu and Layland proved in 1973 that RM is **optimal among fixed-priority assignments** for this task model — if any fixed-priority ordering can schedule a given task set, then rate-monotonic can schedule it too. You never have to search over priority orderings; the shortest-period-first rule already finds a working one whenever a working one exists. When a deadline is shorter than its period, $D_i < T_i$, the generalisation is **deadline-monotonic**: assign priority by shortest deadline instead of shortest period, and the same optimality result carries over. This lesson keeps $D_i = T_i$ throughout, so rate-monotonic and deadline-monotonic agree, but it is worth knowing the name for the case where they do not.

## The Liu-Layland utilisation bound

Fixing the priority rule still leaves the question of how much of the processor a task set is allowed to claim. Liu and Layland's answer is the **utilisation bound**: for $n$ tasks under rate-monotonic priorities,

$$
U = \sum_{i=1}^{n} \frac{C_i}{T_i} \;\le\; n\left(2^{1/n} - 1\right)
$$

is **sufficient** for schedulability. If the total utilisation clears this bound, every task meets every deadline, guaranteed, for any values of $C_i$ and $T_i$ that produce that utilisation. The bound falls as $n$ grows:

| $n$ | 1 | 2 | 3 | 4 | 5 | 10 | $\to\infty$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bound | $1.000$ | $0.828$ | $0.780$ | $0.757$ | $0.743$ | $0.718$ | $\ln 2 = 0.693$ |

One task can use the whole processor, trivially. Two tasks are guaranteed safe up to $82.8\%$. The bound decreases monotonically and converges to $\ln 2 \approx 0.693$ as $n \to \infty$ — a large task set is only *guaranteed* schedulable, by this test, below about $69\%$ utilisation, however the individual periods happen to fall.

The word **sufficient** is carrying real weight and it is worth being precise about what it does and does not license. Clearing the bound proves schedulability outright. Failing it proves *nothing* — not that the task set is unschedulable, only that this particular test cannot tell you either way. The bound is derived from the worst possible relationship between the periods that could ever occur for a given utilisation, and most real task sets are nowhere near that worst case. The next lesson builds the exact test that resolves what the bound leaves open; for now, treat a passing bound as a free pass and a failing one as "unknown, go compute."

::: example A task set the bound clears outright
Two tasks: $C_1 = 1\,\mathrm{ms}$, $T_1 = 4\,\mathrm{ms}$ and $C_2 = 1\,\mathrm{ms}$, $T_2 = 6\,\mathrm{ms}$, both under rate-monotonic priorities (task 1 higher, shorter period). Total utilisation:

$$
U = \frac{1}{4} + \frac{1}{6} = \frac{3}{12} + \frac{2}{12} = \frac{5}{12} = 0.4167.
$$

The two-task bound is $2(\sqrt2 - 1) = 0.8284$. Since $0.4167 \le 0.8284$, both tasks are guaranteed to meet every deadline, for any $C_i, T_i$ producing this utilisation, without running a single simulation or writing the response-time iteration the next lesson introduces. This is the entire value of the bound: for a task set comfortably below it, the question is closed in one line.
:::

::: key
**Liu-Layland bound**: $U \le n(2^{1/n}-1)$ is sufficient for rate-monotonic schedulability. $n=2$ gives $0.828$, $n=3$ gives $0.780$, and it falls to $\ln 2 = 0.693$ as $n$ grows. Clearing it proves schedulability. Failing it proves nothing — you must run the exact test.
:::

## Earliest-deadline-first

**Earliest-deadline-first (EDF)** abandons fixed priority altogether. At every instant, EDF runs whichever ready task has the nearest *absolute* deadline — the release time of its current job plus $D_i$ — recomputed continuously as jobs arrive and finish. A task's urgency is not a fixed rank decided at design time; it changes from one job to the next and even within a job's own lifetime relative to other tasks' releases.

The reward for giving up a fixed rank is a much cleaner bound. For this same task model, EDF is schedulable **if and only if**

$$
U = \sum_{i=1}^{n} \frac{C_i}{T_i} \;\le\; 1,
$$

exactly, with no asymptotic loss to $\ln 2$ and no dependence on how the periods happen to relate. EDF is provably optimal among *all* scheduling algorithms for this task model on one processor: if any algorithm, of any kind, can schedule a task set, EDF can too. Where rate-monotonic guarantees safety only up to roughly $69$–$83\%$ depending on task count, EDF is guaranteed up to $100\%$ — every last percent of the processor is usable, on paper.

::: example A set rate-monotonic cannot schedule but EDF can
Two tasks: $C_1 = 2\,\mathrm{ms}$, $T_1 = 5\,\mathrm{ms}$ and $C_2 = 4\,\mathrm{ms}$, $T_2 = 7\,\mathrm{ms}$. Total utilisation:

$$
U = \frac{2}{5} + \frac{4}{7} = 0.4 + 0.5714 = 0.9714.
$$

Under rate-monotonic priorities (task 1 higher, period 5), task 1 trivially meets its deadline: $R_1 = C_1 = 2\,\mathrm{ms} \le 5\,\mathrm{ms}$. Task 2's response time, by the fixed-point iteration the next lesson develops in full, converges to $R_2 = 8\,\mathrm{ms}$ against a $7\,\mathrm{ms}$ deadline — a miss. (Briefly: $R \leftarrow 4 + \lceil R/5\rceil\cdot 2$ starting from $R=4$ gives $4 \to 6 \to 8 \to 8$, converged at $8 > 7$.) Rate-monotonic cannot schedule this pair, and since RM is optimal among fixed-priority assignments, *no* fixed-priority assignment can.

EDF can. Simulated minute-by-minute over one full hyperperiod ($\mathrm{lcm}(5,7) = 35\,\mathrm{ms}$, six releases of task 1 and five of task 2), every job of both tasks finishes at or before its deadline — zero misses, confirmed by direct simulation of the schedule rather than by the bound alone, because $U = 0.9714 \le 1$ is already an exact guarantee for EDF. The two rules, given the identical numbers, reach opposite verdicts: one is a real, usable $2.86\%$ of processor time that fixed priority leaves permanently on the table for this pair of periods.
:::

::: key
**EDF**: run whichever ready task has the nearest absolute deadline, reassessed continuously. Schedulable if and only if $U \le 1$ — exact, with no loss to $\ln 2$, and optimal among all single-processor scheduling algorithms for this task model.
:::

## Why EDF degrades worse on overload

A cleaner bound is not the only thing that changes when priority becomes dynamic. What happens when the processor is asked for more than it has — a task overruns its WCET, or a design error slips past every check — is where fixed priority's rigidity turns into an advantage.

Under fixed priority, a task's rank never changes. If task $i$ overruns, the damage is contained to tasks of priority $i$ or lower — every task with a *higher* fixed priority than $i$ still preempts it exactly as before and is completely unaffected, forever, by construction. The highest-priority task in the system is permanently protected from every other task's misbehaviour; it is a mathematical consequence of priority being fixed, not a design choice made separately.

Under EDF, no task holds a permanent rank. A task's urgency depends only on how close its own next deadline is, so a task that was the least urgent thing in the system a moment ago becomes the most urgent the instant its own deadline approaches — and at that moment it competes for the processor on exactly equal footing with whatever else is nearby in deadline, with no memory of which task in the system is "important" in any sense beyond timing. An overrun by one task therefore does not have a fixed, bounded set of victims the way it does under fixed priority. Whichever task's deadline happens to be nearest when the backlog created by the overrun has not yet cleared is the one that inherits it — and because urgency reassigns every period, that can eventually be *any* task in the system, not a fixed subset chosen in advance. This is the **domino effect**: on overload, EDF has no built-in notion of which task matters most, so a single overrun can propagate to a task that had nothing to do with it and no priority relationship to the one that misbehaved.

::: example One overrun, and who pays for it
Two tasks share a processor exactly fully: $C_A = 4\,\mathrm{ms}$, $C_B = 6\,\mathrm{ms}$, both $T = 10\,\mathrm{ms}$, so $U = 1.0$ precisely. Nominally, in either order, both finish comfortably within $10\,\mathrm{ms}$.

Now task $A$ overruns once, to $6\,\mathrm{ms}$ instead of $4\,\mathrm{ms}$ — a cache-cold path, say. Under EDF, both jobs share the same deadline at $t=10$, so a tie-break runs $A$ first: $A$ finishes at $t=6$ (inside its own deadline, no problem for $A$), then $B$ runs its full $6\,\mathrm{ms}$ from $t=6$ to $t=12$ — two milliseconds **past** its $10\,\mathrm{ms}$ deadline. $B$ did nothing wrong. It is delayed purely because $A$, a task with no priority relationship to it beyond sharing a deadline that instant, ran long.

Run the identical scenario under fixed priority with $B$ as the *higher*-priority task. $B$ always runs first, finishing at $t=6$ regardless of anything $A$ does; $A$'s overrun delays only $A$, whose own deadline is the only one at risk. The overrun is the same event in both cases. Who absorbs it is not.
:::

This is a serious, practical argument against EDF as the scheduler for a safety-critical control system, even though its utilisation bound is strictly better on paper: fixed priority gives you a task you can point to and say "this one is protected no matter what else in the system fails," and EDF gives you no such guarantee at all. It is why fixed-priority scheduling — rate-monotonic or deadline-monotonic — dominates flight practice, and why, when EDF does appear on a real system (Linux's `SCHED_DEADLINE`, covered in lesson six), it is normally used for a bounded set of admission-controlled reservations layered underneath a fixed-priority scheme for the tasks that must never be second-guessed, rather than as the scheduler for every safety-critical task at once.

::: warning
"EDF is schedulable up to $U=1$" and "rate-monotonic is guaranteed schedulable up to the Liu-Layland bound" are not the same kind of statement answering the same question with a different number. EDF's test is exact — $U \le 1$ decides the question completely, in either direction. The Liu-Layland bound is one-directional: passing it is a proof, failing it is silence. Do not read a failed Liu-Layland check as "this task set needs EDF" — it may be perfectly schedulable under rate-monotonic too, which the next lesson's exact test will show.
:::

## Check yourself

::: check
A four-task set under rate-monotonic priorities has total utilisation $U = 0.74$. State exactly what you can conclude, and say what additional fact — if any — you would need before writing a report that says "this task set is safe."
:::

::: answer
The four-task Liu-Layland bound is $4(2^{1/4}-1) = 0.7568$. Since $0.74 \le 0.7568$, the bound is cleared and the task set is guaranteed schedulable under rate-monotonic priorities — nothing further is needed. This is a case where the bound itself is the complete answer; no additional fact, simulation, or exact analysis is required, because clearing the sufficient test already proves the claim outright.
:::

::: check
Explain, without appealing to the formula, why the Liu-Layland bound falls as the number of tasks grows, and why it approaches a limit rather than falling to zero.
:::

::: answer
With more tasks at a fixed total utilisation, each task's own slice shrinks, and low-priority tasks face interference from a longer chain of higher-priority tasks whose periods can misalign against them in more ways — more opportunities for the worst-case phasing the bound has to guard against, which pushes the guaranteed-safe utilisation down. It approaches a limit rather than vanishing because the pessimism built into the bound is bounded in a precise sense — Liu and Layland showed the worst-case penalty from period misalignment converges as $n\to\infty$, landing at $\ln 2$, so there remains a non-trivial slice of the processor ($69.3\%$) that any rate-monotonic task set, however large, is guaranteed to fit inside regardless of how badly its periods align.
:::

::: check
A safety-critical flight computer is choosing between rate-monotonic and EDF for its control tasks, and a colleague argues for EDF purely on the grounds that "it can use up to 100% of the processor and RM can only guarantee 69%." What is missing from that argument?
:::

::: answer
It compares only the nominal utilisation bound and ignores overload behaviour, which is the more operationally important property for a safety-critical scheduler. Under EDF, no task has a permanently protected priority — urgency is reassigned by deadline proximity every period — so a single task's overrun can, over time, delay a task with no relationship to the one that misbehaved, because whichever task's deadline is nearest when the backlog exists inherits it. Under rate-monotonic, an overrun can only ever delay tasks of equal or lower fixed priority; the highest-priority task is protected by construction, forever. A real flight schedule rarely runs at the utilisation where the extra $30$ percentage points of theoretical headroom matters, but it always eventually experiences an overrun somewhere, and the consequence of that overrun is the more decision-relevant fact.
:::

::: check
Three tasks are assigned priorities by hand: the engineer gives the shortest-*deadline* task the highest priority, where one task has $D_i$ noticeably shorter than $T_i$ and the other two have $D_i = T_i$. Is this rate-monotonic, and is it still the right choice?
:::

::: answer
It is not rate-monotonic in the strict sense — rate-monotonic ranks by period — it is **deadline-monotonic**, which ranks by deadline and reduces to rate-monotonic exactly when every deadline equals its period. It is the right choice: deadline-monotonic is the generalisation of the same optimality result to the case where some deadlines are shorter than their periods, and it remains optimal among fixed-priority assignments for that more general model. Assigning by period alone here would rank the tight-deadline task by its (possibly long) period rather than its (short) deadline and could easily produce an assignment that misses that task's deadline even when a working fixed-priority assignment exists.
:::

::: check
In the two-task overrun example, redo the arithmetic with $B$ overrunning instead of $A$ (to $8\,\mathrm{ms}$ instead of $6\,\mathrm{ms}$), everything else unchanged, under EDF with $A$ tie-broken first. Who misses, and by how much?
:::

::: answer
With $A$ still running first (nominal $4\,\mathrm{ms}$, unaffected — it did not overrun), $A$ finishes at $t=4$, comfortably inside its $10\,\mathrm{ms}$ deadline. $B$ then runs its overrun $8\,\mathrm{ms}$ from $t=4$ to $t=12$, two milliseconds past its own $10\,\mathrm{ms}$ deadline — a $2\,\mathrm{ms}$ miss, but this time $B$ misses its *own* deadline because of its *own* overrun, which is a fundamentally different situation from the original example, where $B$ met none of its own behaviour with a fault and still missed because of $A$. The distinction matters: a task missing its own deadline after its own overrun is an ordinary WCET-margin failure to go fix; a task missing its deadline because an unrelated task overran is the domino effect, and no amount of correctness in $B$'s own code would have prevented it.
:::

## Summary

| Term | Statement |
| --- | --- |
| Rate-monotonic (RM) | Shorter period → higher priority, fixed for the task's life; optimal among fixed-priority assignments when $D_i=T_i$ |
| Deadline-monotonic (DM) | Shorter deadline → higher priority; generalises RM when $D_i < T_i$ |
| Liu-Layland bound | $U \le n(2^{1/n}-1)$, sufficient for RM schedulability; $0.828$ at $n=2$, falling to $\ln2=0.693$ |
| Sufficient, not necessary | Clearing the bound proves schedulability; failing it proves nothing |
| EDF | Run the ready task with the nearest absolute deadline, reassessed continuously |
| EDF exact test | Schedulable iff $U \le 1$; optimal among all algorithms for this task model, one processor |
| Overload under RM | Bounded: an overrun delays only equal-or-lower fixed-priority tasks; the top task is always protected |
| Overload under EDF | Unbounded in principle: no permanently protected task; the domino effect |

The Liu-Layland bound closed the question for the easy cases in this lesson's first example. The next lesson takes a task set the bound cannot clear and proves, exactly, whether it is still safe — which is where "sufficient but not necessary" stops being an abstract warning and becomes the whole point.
