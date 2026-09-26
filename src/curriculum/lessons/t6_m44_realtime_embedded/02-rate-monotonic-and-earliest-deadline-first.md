---
id: l02-rate-monotonic-and-edf
title: Fixed-priority scheduling and earliest-deadline-first
minutes: 22
covers:
  - "Fixed-priority scheduling: rate-monotonic priority assignment and the Liu-Layland utilisation bound"
  - Earliest-deadline-first and why it achieves higher utilisation but degrades worse on overload
---

Imagine you have homework in three subjects. Math is due every day. Science is due every three days. A book report is due every two weeks. You can only work on one at a time. Which do you pick up first when two are waiting?

You might set a fixed rule once: "whatever is due most often comes first." Or you might decide fresh every evening: "whatever is due soonest comes first." Both are sensible. They behave differently when the week gets crowded — and very differently when something goes wrong, like a science assignment that takes twice as long as usual.

A flight computer faces exactly this choice. One processor runs several repeating control tasks, and it needs a rule for which runs when two are ready at once. A bad rule makes a task set miss deadlines it could easily have met. A good rule, with the right test, lets you prove in one line of arithmetic that every deadline is safe, however the tasks happen to line up. This lesson gives you the two main rules — **fixed priority** and **earliest-deadline-first** — and the test that goes with each.

## The task model

Every result in this lesson uses the same simple picture of the work. There is a set of **periodic tasks** — jobs that repeat on a fixed beat — and they do not depend on each other. For task number $i$:

- $C_i$ ("C sub i") is its worst-case execution time, the WCET from lesson one.
- $T_i$ ("T sub i") is its **period**: it is released — becomes ready to run — once every $T_i$.
- $D_i$ ("D sub i") is its **relative deadline**: each job must finish within $D_i$ of its release. For now, $D_i = T_i$ — each job must finish before the next one is released.

The fraction of the processor that task $i$ uses is $C_i / T_i$. A task needing $2\,\mathrm{ms}$ every $10\,\mathrm{ms}$ uses $0.2$ of the processor. Add these up for all the tasks and you get the total **utilisation**:

$$
U = \sum_{i=1}^{n} \frac{C_i}{T_i}.
$$

The big $\Sigma$ ("sigma") means "add up, for $i$ from $1$ to $n$", where $n$ is the number of tasks. If $U$ is above $1$, the tasks ask for more than $100\%$ of the processor, and no rule can save them.

We also assume the scheduler can **[[preempt|preempt]]**: when a more urgent task becomes ready, it interrupts the running one on the spot, and the interrupted task picks up later where it left off.

## Rate-monotonic priority assignment

**Rate-monotonic** priority assignment, **RM** for short, is the rule: the shorter the period, the higher the priority. The ranking is fixed for the life of the task. It is decided once at design time, not worked out again while the system runs. A $5\,\mathrm{ms}$ attitude-rate loop outranks a $50\,\mathrm{ms}$ guidance update, which outranks a $1\,\mathrm{s}$ health check. That order never changes in flight.

("Rate" because a shorter period is a higher rate. "Monotonic" because priority only ever goes one way as rate goes up.)

Why this rule and not some other fixed order? In **[[1973, Liu and Layland proved|liu-layland]]** that RM is **optimal among fixed-priority assignments** for this task model. That means: if *any* fixed ranking can schedule a task set, rate-monotonic can too. You never have to search through all the possible orderings. Shortest-period-first already finds a working one whenever one exists.

When a deadline is shorter than its period, $D_i < T_i$, the rule grows up into **deadline-monotonic**: rank by shortest *deadline* instead of shortest period. The same optimality result carries over. In this lesson $D_i = T_i$, so the two rules agree.

::: key
**Rate-monotonic priority assignment**: shorter period gets higher priority. Optimal among fixed-priority assignments for independent periodic tasks with deadlines equal to periods. Deadline-monotonic generalises it when deadlines are shorter than periods.
:::

## The Liu-Layland utilisation bound

Fixing the ranking still leaves a question: how much of the processor may the tasks claim? Liu and Layland answered that too. For $n$ tasks under rate-monotonic priorities,

$$
U = \sum_{i=1}^{n} \frac{C_i}{T_i} \;\le\; n\left(2^{1/n} - 1\right)
$$

is **sufficient** for schedulability. Read $2^{1/n}$ as "two to the one over n", the $n$-th root of $2$. In words: if the total utilisation is at or below this number, every task meets every deadline, guaranteed, whatever the individual $C_i$ and $T_i$ are.

Here is the bound for a few task counts:

| $n$ | 1 | 2 | 3 | 4 | 5 | 10 | very large |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bound | $1.000$ | $0.828$ | $0.780$ | $0.757$ | $0.743$ | $0.718$ | $\ln 2 = 0.693$ |

One task can use the whole processor. Two tasks are guaranteed safe up to $82.8\%$. As $n$ grows, the bound keeps falling, and it **[[levels off at ln 2|bound-curve]]** — about $0.693$. So a large task set is guaranteed schedulable by this test only below about $69\%$ utilisation.

Now the most important word in this section: **sufficient**. It works in one direction only.

- **Pass** the bound, and schedulability is proven. Done.
- **Fail** the bound, and you have proven *nothing*. The set might be fine. This test cannot tell.

Think of a sign at a bridge: "trucks under 10 tonnes: always safe." A 12-tonne truck is not told it will fall in — only that the sign cannot vouch for it. The bound is built from the worst possible relationship between periods that could ever occur at that utilisation, and most real task sets are nowhere near that worst case. The next lesson builds the exact test that settles what the bound leaves open. For now: a pass is a free proof; a fail means "unknown — go compute".

::: note Why the bound is 0.828 for two tasks, and why it levels off at ln 2
Take two tasks with $T_1 < T_2 \le 2T_1$, so task 1 has the higher priority. Build the tightest possible set: release both at $t = 0$ and choose the times so that the processor is busy every instant from $0$ to $T_2$, with task 2 finishing exactly on its deadline.

Task 1 runs at $t = 0$ and again at $t = T_1$. Let its second job fill the gap up to $T_2$ exactly, so $C_1 = T_2 - T_1$. Task 2 gets everything left over in $[0, T_2]$, which is $C_2 = T_2 - 2C_1$. Make either $C$ any bigger and task 2 misses.

Call the period ratio $r = T_2/T_1$. Then

$$
\frac{C_1}{T_1} = \frac{T_2 - T_1}{T_1} = r - 1, \qquad \frac{C_2}{T_2} = \frac{T_2 - 2T_2 + 2T_1}{T_2} = \frac{2}{r} - 1,
$$

so $U = r + \frac{2}{r} - 2$. The worst period ratio is the one that makes this *smallest*. Setting the slope $1 - 2/r^2$ to zero gives $r = \sqrt{2}$, and then $U = 2\sqrt{2} - 2 = 2(\sqrt{2} - 1) \approx 0.828$. Any set below that cannot be packed this badly, so it fits. Liu and Layland did the same for $n$ tasks and got $n(2^{1/n} - 1)$.

For the limit, write $x = 1/n$, so the bound is $\frac{2^x - 1}{x}$. For tiny $x$, $2^x \approx 1 + x \ln 2$, so the bound approaches $\frac{x \ln 2}{x} = \ln 2$.
:::

::: example A task set the bound clears outright
Two tasks: $C_1 = 1\,\mathrm{ms}$, $T_1 = 4\,\mathrm{ms}$, and $C_2 = 1\,\mathrm{ms}$, $T_2 = 6\,\mathrm{ms}$. Rate-monotonic priorities put task 1 first, since its period is shorter.

**Step 1: add up the utilisation.** Put both fractions over $12$:

$$
U = \frac{1}{4} + \frac{1}{6} = \frac{3}{12} + \frac{2}{12} = \frac{5}{12} \approx 0.417.
$$

**Step 2: find the bound for $n = 2$.** $2(2^{1/2} - 1) = 2(\sqrt2 - 1) \approx 0.828$.

**Step 3: compare.** $0.417 \le 0.828$, so both tasks meet every deadline, guaranteed.

**Sanity check:** the processor is less than half busy, and the two-task bound allows over $80\%$. No simulation and no iteration were needed. That is the whole value of the bound: for a set comfortably below it, the question closes in one line.
:::

::: key
**Liu-Layland utilisation bound**: $U \le n(2^{1/n}-1)$ is SUFFICIENT for rate-monotonic schedulability. $n = 2$ gives $0.828$, $n = 3$ gives $0.780$, and it decreases to $\ln 2 = 0.693$. Failing it proves nothing — run exact analysis.
:::

## Earliest-deadline-first

The second rule is the "decide fresh every evening" homework plan. **Earliest-deadline-first**, or **EDF**, gives up fixed ranks. At every moment it runs whichever ready task has the nearest **absolute deadline** — the clock time by which its current job must finish, equal to that job's release time plus $D_i$. The choice is made again every time a job arrives or finishes. A task's urgency is not a rank; it changes from job to job.

The reward for giving up fixed ranks is a much cleaner test. For the same task model, EDF meets every deadline **if and only if**

$$
U = \sum_{i=1}^{n} \frac{C_i}{T_i} \;\le\; 1.
$$

"If and only if" means the test works both ways. Pass it and the set is schedulable. Fail it and the set is not. There is no slide down to $\ln 2$, and it does not matter how the periods relate.

EDF is also optimal among *all* preemptive scheduling rules for this task model on one processor: if any rule of any kind can schedule a task set, EDF can too. Where rate-monotonic is guaranteed only up to about $69$–$83\%$, depending on the number of tasks, EDF is guaranteed right up to $100\%$ — on paper.

::: note Why U ≤ 1 is enough for EDF
If $U > 1$, the tasks ask for more time than exists, so something must miss. That is the easy half.

For the other half, suppose $U \le 1$ and yet some job misses its deadline at time $t$. Go back to the last moment $t_0$ before $t$ when the processor was either idle or running a job whose deadline is *after* $t$. At that moment no job with a deadline at or before $t$ was waiting — EDF would have been running it. So every job worked on between $t_0$ and $t$ has a deadline at or before $t$ and was released after $t_0$, and the processor never rests in between. The missed job means that work did not fit in the window. But task $i$ can release at most $\frac{t - t_0}{T_i}$ jobs with deadlines inside the window. So their total work is at most

$$
\sum_i \frac{t - t_0}{T_i} C_i = (t - t_0)\,U \le t - t_0.
$$

So the work does fit after all — a contradiction. The assumed miss cannot happen.
:::

::: example A set rate-monotonic cannot schedule but EDF can
Two tasks: $C_1 = 2\,\mathrm{ms}$, $T_1 = 5\,\mathrm{ms}$, and $C_2 = 4\,\mathrm{ms}$, $T_2 = 7\,\mathrm{ms}$.

**Step 1: utilisation.**

$$
U = \frac{2}{5} + \frac{4}{7} = 0.4 + 0.5714 = 0.9714.
$$

This is above the two-task bound of $0.828$, so the RM bound is silent.

**Step 2: rate-monotonic.** Task 1 has the shorter period, so it goes first. Release both at $t = 0$. Task 1 runs from $0$ to $2$. Task 2 runs from $2$ to $5$ — three of its four milliseconds done. At $t = 5$ task 1 is released again and preempts it, running from $5$ to $7$. Task 2's deadline is $t = 7$, and it still has $1\,\mathrm{ms}$ to go. It finishes at $t = 8$: a miss. (The next lesson's iteration gives the same number: $R \leftarrow 4 + \lceil R/5 \rceil \cdot 2$ goes $4 \to 6 \to 8$, and $8 > 7$.) Since RM is optimal among fixed-priority rules, *no* fixed ranking can schedule this pair.

**Step 3: EDF.** At $t = 5$, task 1's new job has deadline $10$, but task 2's job has deadline $7$ — nearer. So EDF lets task 2 keep running, and it finishes at $t = 6$, on time. Carry on the same way over one **[[hyperperiod|edf-rm-picture]]** — the $35\,\mathrm{ms}$ after which the pattern repeats, the least common multiple of $5$ and $7$ — and all seven jobs of task 1 and all five of task 2 finish on time. That matches the test: $0.9714 \le 1$.

**Sanity check:** the processor sits idle for $1\,\mathrm{ms}$ in those $35\,\mathrm{ms}$, and $1/35 \approx 0.029 = 1 - 0.9714$. The idle time is exactly the unused utilisation. EDF put a $97\%$ load to work that no fixed ranking can carry.
:::

::: key
**EDF**: run whichever ready task has the nearest absolute deadline, reassessed continuously. Schedulable if and only if $U \le 1$ — exact, with no loss to $\ln 2$, and optimal among all preemptive single-processor scheduling algorithms for this task model.
:::

## Why EDF degrades worse on overload

So EDF wins on paper. The story changes when the processor is asked for more than it has — a task runs past its WCET, or a design error slips past every check. This is **overload**, and here fixed priority's stiffness becomes a strength.

**Under fixed priority**, a task's rank never changes. If task $i$ runs long, the damage stays with task $i$ and the tasks ranked below it. Every higher-ranked task still preempts $i$ exactly as before, and is untouched. The top task is protected from every other task's misbehaviour. That is not an extra feature someone added; it follows from the ranks being fixed.

**Under EDF**, nobody holds a permanent rank. A task's urgency depends only on how near its own next deadline is. A task that was the least urgent thing in the system a moment ago becomes the most urgent as its deadline approaches. So when one task overruns and creates a backlog, there is no fixed list of who can be hurt. Whichever task's deadline happens to be nearest while the backlog lasts takes the hit — and because urgency is reshuffled every period, that can in the end be *any* task. This is the **[[domino effect|domino-picture]]**: one overrun can topple a task that had nothing to do with it.

::: example One overrun, and who pays for it
Two tasks exactly fill a processor: $C_A = 4\,\mathrm{ms}$, $C_B = 6\,\mathrm{ms}$, both with $T = 10\,\mathrm{ms}$. Then $U = 0.4 + 0.6 = 1.0$ exactly. Normally, in either order, both finish by $t = 10$.

Now task A overruns once — $6\,\mathrm{ms}$ instead of $4$, say because of a cold cache.

**Under EDF.** Both jobs have the same deadline, $t = 10$, so a **[[tie-break|tie-break]]** decides, and it picks A. A runs from $0$ to $6$ and meets its own deadline. B then runs its $6\,\mathrm{ms}$ from $6$ to $12$ — $2\,\mathrm{ms}$ past its deadline. B did nothing wrong. It is late only because A ran long.

**Under fixed priority, with B ranked higher.** B always runs first and finishes at $t = 6$, whatever A does. A runs from $6$ to $12$ and misses — but A is the task that overran. Its own deadline is the only one at risk.

**Sanity check:** in both cases the processor was asked for $12\,\mathrm{ms}$ of work in a $10\,\mathrm{ms}$ window, so someone had to be $2\,\mathrm{ms}$ late. The overrun is the same. Who absorbs it is not.
:::

This is a serious, practical argument against EDF as the scheduler for a safety-critical control system, even though its bound is better. Fixed priority gives you a task you can point to and say: "this one is protected, whatever else fails." EDF gives you no such task. That is why fixed-priority scheduling — rate-monotonic or deadline-monotonic — dominates flight practice.

When EDF does appear on a real system, such as Linux's **[[SCHED_DEADLINE|sched-deadline]]** policy in lesson six, it is normally used for a limited set of reservations that must pass an admission check, sitting alongside a fixed-priority scheme that protects the tasks that must never be second-guessed.

::: warning
"EDF is schedulable up to $U = 1$" and "rate-monotonic is guaranteed up to the Liu-Layland bound" are not the same kind of statement with different numbers. EDF's test is exact: $U \le 1$ settles the question both ways. The Liu-Layland bound works one way only: a pass is a proof, a fail is silence. Do not read a failed Liu-Layland check as "this task set needs EDF". It may be perfectly schedulable under rate-monotonic, as the next lesson's exact test will show.
:::

## Check yourself

::: check
A four-task set under rate-monotonic priorities has total utilisation $U = 0.74$. What exactly can you conclude? Do you need anything more before writing "this task set is safe"?
:::

::: answer
The four-task bound is $4(2^{1/4} - 1)$. First, $2^{1/4} \approx 1.1892$. Subtract one: $0.1892$. Times four: about $0.757$. Since $0.74 \le 0.757$, the bound is passed, and the set is guaranteed schedulable under rate-monotonic priorities. Nothing more is needed. Passing a sufficient test is already a proof.
:::

::: check
Without the formula, explain why the Liu-Layland bound falls as the number of tasks grows, and why it levels off instead of dropping to zero.
:::

::: answer
With more tasks, each low-priority task can be interrupted by a longer chain of higher-priority tasks, and their periods can line up against it in more bad ways. The bound has to cover the worst of those line-ups, so the guaranteed-safe utilisation goes down.

It levels off because the extra pessimism from each new task shrinks. Liu and Layland showed the worst-case loss from bad alignment tends to a limit as $n$ grows, landing the bound at $\ln 2 \approx 0.693$. So there is always a slice — about $69\%$ of the processor — that any rate-monotonic task set fits inside, however badly its periods line up.
:::

::: check
A colleague argues for EDF on a safety-critical flight computer "because it can use $100\%$ of the processor and RM only guarantees $69\%$". What is missing from that argument?
:::

::: answer
It compares only the nominal bounds and ignores what happens on overload, which matters more for a safety-critical scheduler. Under EDF no task has a protected rank, so one task's overrun can, over time, make an unrelated task late — whoever's deadline is nearest while the backlog lasts. Under rate-monotonic, an overrun can only delay tasks of equal or lower rank; the top task is protected by construction.

A real flight schedule rarely runs at a utilisation where the extra headroom matters. But over a long mission, some task somewhere will overrun, and what that overrun does is the fact that should decide the choice.
:::

::: check
An engineer ranks three tasks by hand, giving the highest priority to the task with the shortest *deadline*. One task has $D_i$ well below $T_i$; the other two have $D_i = T_i$. Is this rate-monotonic? Is it the right choice?
:::

::: answer
It is not rate-monotonic in the strict sense, which ranks by period. It is **deadline-monotonic**, which ranks by deadline, and it becomes rate-monotonic when every deadline equals its period.

It is the right choice. Deadline-monotonic is the extension of the same optimality result to sets where some deadlines are shorter than their periods. Ranking by period here would place the tight-deadline task by its possibly long period, and could miss that task's deadline even when a working fixed ranking exists.
:::

::: check
Redo the overrun example with B overrunning instead — $8\,\mathrm{ms}$ instead of $6\,\mathrm{ms}$ — under EDF with the tie-break still picking A first. Who misses, by how much, and how is this different from the original example?
:::

::: answer
A runs first for its normal $4\,\mathrm{ms}$ and finishes at $t = 4$, well inside its deadline. B then runs its $8\,\mathrm{ms}$ from $4$ to $12$, which is $2\,\mathrm{ms}$ past its deadline of $10$.

The miss is the same size, but the cause is different. Here B misses because of B's *own* overrun: an ordinary WCET-margin failure, fixed by fixing B. In the original, B missed because *A* overran — the domino effect — and nothing in B's own code could have prevented it.
:::

## Summary

| Term | Statement |
| --- | --- |
| Task model | Independent periodic tasks: WCET $C_i$, period $T_i$, deadline $D_i = T_i$ |
| Utilisation | $U = \sum C_i/T_i$, the fraction of the processor the tasks claim |
| Rate-monotonic (RM) | Shorter period gets higher priority, fixed; optimal among fixed-priority assignments when $D_i = T_i$ |
| Deadline-monotonic | Shorter deadline gets higher priority; generalises RM when $D_i < T_i$ |
| Liu-Layland bound | $U \le n(2^{1/n}-1)$ is sufficient for RM; $0.828$ at $n = 2$, $0.780$ at $n = 3$, down to $\ln 2 = 0.693$ |
| Sufficient, not necessary | Passing the bound proves schedulability; failing it proves nothing |
| EDF | Run the ready task with the nearest absolute deadline, re-decided continuously |
| EDF exact test | Schedulable if and only if $U \le 1$; optimal on one processor |
| Overload under RM | An overrun delays only equal-or-lower priority tasks; the top task is protected |
| Overload under EDF | No protected task; one overrun can make any task late (the domino effect) |

The first example closed with the bound alone. The next lesson takes a task set the bound cannot clear and proves exactly whether it is still safe — which is where "sufficient but not necessary" stops being a warning and becomes the whole point.

::: context preempt What preempting means
To **preempt** is to cut in. When a more urgent task becomes ready, the scheduler stops the running task mid-step, saves where it was (its registers and place in the code), and starts the urgent one. Later the interrupted task resumes exactly where it stopped, none the wiser. The word comes from an old legal term for the right to buy something before others can. Almost every result in this module assumes preemption; without it, a long low-priority job could hold the processor while an urgent one waits.
:::

::: context liu-layland The paper behind the bound
C. L. Liu and James Layland published "Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment" in the Journal of the ACM in 1973. In a few pages it proved that rate-monotonic is the best fixed ranking, gave the utilisation bound, and showed that deadline-driven scheduling — what we now call EDF — can use the whole processor. It is still one of the most cited papers in computer science, and nearly every scheduling result in this module grows out of it.
:::

::: context bound-curve The bound, task by task
Each dot is $n(2^{1/n} - 1)$ for $n = 1$ to $10$. The drop is steep at first and then flattens toward the dashed line at $\ln 2 \approx 0.693$, which it never goes below. $\ln 2$ is the natural logarithm of $2$: the power you must raise the number $e \approx 2.718$ to in order to get $2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="335" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3">
    <line x1="50" y1="20" x2="335" y2="20"/><line x1="50" y1="60" x2="335" y2="60"/>
    <line x1="50" y1="100" x2="335" y2="100"/><line x1="50" y1="140" x2="335" y2="140"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="24">1.0</text><text x="44" y="64">0.9</text><text x="44" y="104">0.8</text>
    <text x="44" y="144">0.7</text><text x="44" y="184">0.6</text>
  </g>
  <line x1="50" y1="142.7" x2="335" y2="142.7" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="332" y="157" font-size="11" fill="#b4232c" text-anchor="end">ln 2 = 0.693</text>
  <polyline points="50,20 80,88.6 110,108.1 140,117.3 170,122.6 200,126.1 230,128.5 260,130.4 290,131.8 320,132.9" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <circle cx="50" cy="20" r="4"/><circle cx="80" cy="88.6" r="4"/><circle cx="110" cy="108.1" r="4"/>
    <circle cx="140" cy="117.3" r="4"/><circle cx="170" cy="122.6" r="4"/><circle cx="200" cy="126.1" r="4"/>
    <circle cx="230" cy="128.5" r="4"/><circle cx="260" cy="130.4" r="4"/><circle cx="290" cy="131.8" r="4"/>
    <circle cx="320" cy="132.9" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="196">1</text><text x="80" y="196">2</text><text x="110" y="196">3</text><text x="140" y="196">4</text>
    <text x="170" y="196">5</text><text x="200" y="196">6</text><text x="230" y="196">7</text><text x="260" y="196">8</text>
    <text x="290" y="196">9</text><text x="320" y="196">10</text>
  </g>
  <text x="192" y="208" font-size="11" fill="#6c7a93" text-anchor="middle">number of tasks n</text>
</svg>
```
:::

::: context edf-rm-picture The same two tasks, two rules
The first $14\,\mathrm{ms}$ for $C_1 = 2, T_1 = 5$ (blue) and $C_2 = 4, T_2 = 7$ (orange). Under rate-monotonic, task 1 cuts in at $t = 5$ and task 2's first job runs past its deadline at $7$ (red). Under EDF, task 2 keeps the processor at $t = 5$ because its deadline is nearer, and every job is on time. The whole pattern repeats every $35\,\mathrm{ms}$, the **hyperperiod**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="52" y="44" font-size="12" fill="#1f2a44" text-anchor="end">RM</text>
  <text x="52" y="94" font-size="12" fill="#1f2a44" text-anchor="end">EDF</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="28" width="40" height="24" fill="#8fb8f0"/>
    <rect x="100" y="28" width="60" height="24" fill="#f2b880"/>
    <rect x="160" y="28" width="40" height="24" fill="#8fb8f0"/>
    <rect x="200" y="28" width="20" height="24" fill="#b4232c"/>
    <rect x="220" y="28" width="40" height="24" fill="#f2b880"/>
    <rect x="260" y="28" width="40" height="24" fill="#8fb8f0"/>
    <rect x="300" y="28" width="40" height="24" fill="#f2b880"/>
    <rect x="60" y="78" width="40" height="24" fill="#8fb8f0"/>
    <rect x="100" y="78" width="80" height="24" fill="#f2b880"/>
    <rect x="180" y="78" width="40" height="24" fill="#8fb8f0"/>
    <rect x="220" y="78" width="80" height="24" fill="#f2b880"/>
    <rect x="300" y="78" width="40" height="24" fill="#8fb8f0"/>
  </g>
  <line x1="200" y1="18" x2="200" y2="110" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="200" y="14" font-size="11" fill="#b4232c" text-anchor="middle">task 2 deadline</text>
  <line x1="60" y1="118" x2="340" y2="118" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="134">0</text><text x="160" y="134">5</text><text x="200" y="134">7</text>
    <text x="260" y="134">10</text><text x="340" y="134">14 ms</text>
  </g>
</svg>
```
:::

::: context domino-picture Why it is called the domino effect
Push one domino and it knocks down the next, which knocks down the next. Under EDF on overload, one late task makes the next-deadline task late, which can make the one after it late, and the lateness travels through the schedule. Studies of EDF under heavy overload have shown it can end up missing nearly every deadline, while fixed priority keeps its top tasks running. The picture shows the example: the same overrun by A (red), absorbed by B under EDF, but by A itself under fixed priority.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="62" y="44" font-size="12" fill="#1f2a44" text-anchor="end">EDF</text>
  <text x="62" y="94" font-size="12" fill="#1f2a44" text-anchor="end">fixed</text>
  <g stroke="#1f2a44" stroke-width="1" font-size="12">
    <rect x="70" y="28" width="88" height="24" fill="#8fb8f0"/>
    <rect x="158" y="28" width="44" height="24" fill="#b4232c"/>
    <rect x="202" y="28" width="132" height="24" fill="#f2b880"/>
    <rect x="70" y="78" width="132" height="24" fill="#f2b880"/>
    <rect x="202" y="78" width="88" height="24" fill="#8fb8f0"/>
    <rect x="290" y="78" width="44" height="24" fill="#b4232c"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="114" y="45">A</text><text x="268" y="45">B late</text>
    <text x="136" y="95">B</text><text x="246" y="95">A late</text>
  </g>
  <line x1="290" y1="18" x2="290" y2="110" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="290" y="14" font-size="11" fill="#1f2a44" text-anchor="middle">deadline</text>
  <line x1="70" y1="118" x2="334" y2="118" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="134">0</text><text x="158" y="134">4</text><text x="202" y="134">6</text>
    <text x="290" y="134">10</text><text x="334" y="134">12 ms</text>
  </g>
</svg>
```
:::

::: context tie-break Breaking ties
When two ready jobs have exactly the same deadline, EDF's rule does not say which goes first, so the scheduler needs a second rule — the lower task number, the one that arrived first, or whatever the code happens to do. The choice does not change whether a schedulable set is schedulable. It does change who gets hurt on overload, as the example shows, which is one more sign that EDF's overload behaviour is hard to predict.
:::

::: context sched-deadline EDF inside Linux
Linux has offered an EDF scheduling policy called `SCHED_DEADLINE` since 2014. A task asks for a budget: "I need up to this much runtime in every period of this length." The kernel admits the task only if the total fits, and then enforces the budget — a task that tries to run longer is paused until its next period. That enforcement is what tames EDF's domino effect: an overrunning task cannot steal another's time. Lesson six sets it beside `SCHED_FIFO`, the fixed-priority policy real-time Linux loops more often use.
:::
