---
id: l03-response-time-analysis
title: Exact schedulability by response-time analysis
minutes: 17
covers:
  - Exact schedulability by response-time analysis, and why the utilisation bound is only sufficient
---

You sit down to read for $20$ minutes. But every $10$ minutes your little brother needs $3$ minutes of help with his puzzle, and he always comes first. When will you finish?

A first guess: $20$ minutes of reading, and in $20$ minutes he interrupts twice, so $20 + 2 \times 3 = 26$. But wait — in $26$ minutes he interrupts *three* times (at $0$, $10$ and $20$). So it is $20 + 3 \times 3 = 29$. In $29$ minutes he still interrupts three times. So $29$ minutes it is. Your guess settled down to a number that agrees with itself.

That little loop of guessing and re-checking is this whole lesson. It is called **response-time analysis**, and it answers exactly — yes or no, with no "unknown" left over — whether a fixed-priority task set meets every deadline.

The last lesson's Liu-Layland bound is a one-way door. Pass it and you are done. Fail it and you know nothing. A team that redesigns, splits a task onto a second processor, or halves a loop rate because a set failed the bound may throw away perfectly safe margin for no reason. Response-time analysis is **[[necessary and sufficient|necessary-sufficient]]**: it settles every case, both ways.

It also catches the opposite mistake. A set can pass the loosest check — total utilisation under $100\%$ — and still miss a deadline, because *how* the work is packed in time matters as much as *how much* there is. By the end you will have run the exact arithmetic on one set the bound rejects and watched it pass, and on one that looks safe by simple addition and watched it fail.

## The critical instant

Start with a question. For task $i$, what is the longest it could ever take, from its release to its finish, given everything of higher priority that could delay it? The **response time** is exactly that: the time from release to finish.

The answer depends on *when* the higher-priority tasks are released compared with task $i$. If they arrive late, after task $i$ is nearly done, they cost it little. If they all arrive at the same moment task $i$ does, they cost it the most.

That worst moment has a name: the **critical instant**. It is the moment when task $i$ and every higher-priority task are released together.

Here is why. A higher-priority task $j$ delays task $i$ once for each of its releases that lands before task $i$ finishes. For a window of any length, the most releases fit when the first one sits right at the window's start. That is true for each higher-priority task separately. So the single moment that gives the most delay from *all* of them at once is the moment they all release together with task $i$.

This saves a huge amount of work. A real mission could produce endless combinations of release times. You only ever need to check one: everything released at $t = 0$.

## The response-time equation

Some notation first.

- $\mathrm{hp}(i)$, read "h p of i", is the set of tasks with **h**igher **p**riority than task $i$.
- $R_i$, read "R sub i", is task $i$'s worst-case response time.
- $\lceil x \rceil$, read "the **ceiling** of x", means round $x$ *up* to the next whole number: $\lceil 2.1 \rceil = 3$, $\lceil 3 \rceil = 3$.

At the critical instant, task $i$ needs its own $C_i$ of processor time, plus the time stolen by every higher-priority job that arrives before it finishes. In a window of length $R_i$, task $j$ is released $\lceil R_i / T_j \rceil$ times — a partly covered period still counts as a whole release, which is why we round up. Each release costs $C_j$. Adding everything up gives the equation this module uses throughout:

$$
R_i = C_i + \sum_{j \,\in\, \mathrm{hp}(i)} \left\lceil \frac{R_i}{T_j} \right\rceil C_j.
$$

Read it as: "response time equals my own work, plus, for each higher-priority task, how many times it arrives in my window times how long it runs."

$R_i$ is on both sides, trapped inside a ceiling, so you cannot solve it with algebra. Instead you do what you did with the reading and the puzzle: a **[[fixed-point iteration|fixed-point]]**.

1. Start with the smallest possible answer, $R^{(0)} = C_i$. (Read $R^{(k)}$ as "R, guess number k".)
2. Put the guess into the right-hand side. The result is the next guess, $R^{(1)}$.
3. Repeat until the guess stops changing: $R^{(k+1)} = R^{(k)}$. That value is the worst-case response time.
4. If a guess ever goes past the deadline $D_i$, stop. The task misses, and more rounds cannot bring it back.

Do this once per task, from the highest priority down. Task $i$ is **schedulable** — sure to meet every deadline — if and only if $R_i \le D_i$. This is not a rule of thumb. It is necessary and sufficient: there is no gap left over, the way there is with the utilisation bound.

::: key
**Exact response-time analysis**: $R_i = C_i + \sum_{j\in\mathrm{hp}(i)} \lceil R_i/T_j\rceil\,C_j$, iterated from $R_i = C_i$ to a fixed point, evaluated at the critical instant (all tasks released together). Schedulable when $R_i \le D_i$. Necessary and sufficient for fixed-priority scheduling — unlike the utilisation bound, it settles every task set, in both directions.
:::

## Failing the bound, passing exactly

::: example Every task meets its deadline, and the bound could not say so
Three tasks, times in milliseconds, with rate-monotonic priorities (shortest period highest):

| Task | $C_i$ | $T_i = D_i$ |
| --- | --- | --- |
| 1 (highest) | $1$ | $3$ |
| 2 | $2$ | $8$ |
| 3 (lowest) | $3$ | $12$ |

**Step 1: the bound.** $U = \frac{1}{3} + \frac{2}{8} + \frac{3}{12} = 0.3333 + 0.25 + 0.25 = 0.8333$. The three-task bound is $3(2^{1/3} - 1) = 0.7798$. Since $0.8333 > 0.7798$, the bound declines this set — not "unschedulable", only "cannot say".

**Step 2: task 1.** Nothing is above it, so $R_1 = C_1 = 1$. Against $D_1 = 3$: meets.

**Step 3: task 2.** Only task 1 is above it, so $R = 2 + \lceil R/3 \rceil \cdot 1$.

| Guess | Calculation | Result |
| --- | --- | --- |
| $R^{(0)}$ | start at $C_2$ | $2$ |
| $R^{(1)}$ | $2 + \lceil 2/3 \rceil \cdot 1 = 2 + 1$ | $3$ |
| $R^{(2)}$ | $2 + \lceil 3/3 \rceil \cdot 1 = 2 + 1$ | $3$, stopped changing |

$R_2 = 3$ against $D_2 = 8$: meets.

**Step 4: task 3.** Both tasks above it interfere: $R = 3 + \lceil R/3 \rceil \cdot 1 + \lceil R/8 \rceil \cdot 2$.

| Guess | Calculation | Result |
| --- | --- | --- |
| $R^{(0)}$ | start at $C_3$ | $3$ |
| $R^{(1)}$ | $3 + \lceil 3/3 \rceil \cdot 1 + \lceil 3/8 \rceil \cdot 2 = 3 + 1 + 2$ | $6$ |
| $R^{(2)}$ | $3 + \lceil 6/3 \rceil \cdot 1 + \lceil 6/8 \rceil \cdot 2 = 3 + 2 + 2$ | $7$ |
| $R^{(3)}$ | $3 + \lceil 7/3 \rceil \cdot 1 + \lceil 7/8 \rceil \cdot 2 = 3 + 3 + 2$ | $8$ |
| $R^{(4)}$ | $3 + \lceil 8/3 \rceil \cdot 1 + \lceil 8/8 \rceil \cdot 2 = 3 + 3 + 2$ | $8$, stopped changing |

$R_3 = 8$ against $D_3 = 12$: meets, with $4\,\mathrm{ms}$ of **slack** — spare time before the deadline.

**Answer:** all three meet their deadlines ($1 \le 3$, $3 \le 8$, $8 \le 12$) at $83.3\%$ utilisation, well above the $78.0\%$ the bound guarantees. You can check it on a **[[timeline|demo1-timeline]]**, too.

**Sanity check:** the guesses only went up, and they **[[stopped at the first place the staircase met the line|staircase]]**. Task 3's answer, $8$, is more than its own $3\,\mathrm{ms}$ of work, as it must be with two tasks cutting in.
:::

This was not a lucky edge case. It is the usual situation. The bound is built from the single worst relationship between periods that three tasks could have at this utilisation. The periods $3$, $8$ and $12$ are not that worst case: $12$ is a whole multiple of $3$, and $12/8 = 1.5$ is tame. A failed bound tells you that *somewhere* among all possible periods at this utilisation there is an unsafe set. It does not tell you *your* set is the unsafe one. Response-time analysis finds out.

## Passing a naive check, missing exactly

::: example A miss the utilisation sum could never see
Two tasks, times in milliseconds:

| Task | $C_i$ | $T_i = D_i$ |
| --- | --- | --- |
| 1 (highest) | $5$ | $8$ |
| 2 (lowest) | $4$ | $11$ |

**Step 1: the naive check.** $U = \frac{5}{8} + \frac{4}{11} = 0.625 + 0.3636 = 0.9886$. That is under $1$: the processor is not asked for more than it has, with a little over $1\%$ to spare. (It is well above the two-task Liu-Layland bound of $0.828$, so that test is silent.) Someone who only checked "are we under $100\%$?" would sign off.

**Step 2: task 1.** $R_1 = C_1 = 5 \le 8$. Meets.

**Step 3: task 2.** $R = 4 + \lceil R/8 \rceil \cdot 5$.

| Guess | Calculation | Result |
| --- | --- | --- |
| $R^{(0)}$ | start at $C_2$ | $4$ |
| $R^{(1)}$ | $4 + \lceil 4/8 \rceil \cdot 5 = 4 + 5$ | $9$ |
| $R^{(2)}$ | $4 + \lceil 9/8 \rceil \cdot 5 = 4 + 10$ | $14$ |

$14 > 11$, so we could stop here: task 2 misses. (One more round gives $4 + \lceil 14/8 \rceil \cdot 5 = 14$ again, so $14$ is the true response time.) It is $3\,\mathrm{ms}$ late.

**Step 4: check it on a timeline.** Both tasks release at $t = 0$. Task 1 runs from $0$ to $5$. Task 2 starts at $5$ and would finish at $9$ — but task 1 is released again at $t = 8$ and cuts in. By then task 2 has done $3$ of its $4\,\mathrm{ms}$. Task 1 runs from $8$ to $13$. Task 2 finishes its last millisecond from $13$ to $14$ — exactly the $R_2 = 14$ the iteration found. Its deadline was $t = 11$. See the **[[timeline for this set|demo2-timeline]]**.
:::

What went wrong? The period ratio. $8$ and $11$ do not divide into each other, so inside task 2's $11\,\mathrm{ms}$ window, task 1 manages *two* releases, not one. The interference term jumped from $\lceil 4/8 \rceil = 1$ to $\lceil 9/8 \rceil = 2$ the moment the window crossed $8$. Total utilisation measures the *amount* of work. It cannot see that one task's deadline falls in a window where a faster task squeezes in one extra run. That step jump, not the amount of work, is what exact analysis catches.

## Harmonic periods: the friendliest case

The opposite of the $8$-and-$11$ trouble is a set of **[[harmonic|harmonic]]** periods: each period divides evenly into every longer one, like $2$, $4$ and $8$. Then higher-priority releases always line up neatly with the lower task's window, and no extra release ever sneaks in. With harmonic periods, rate-monotonic is schedulable right up to $U = 1$.

Try $C = 1, 1, 2$ with $T = 2, 4, 8$. Then $U = \frac{1}{2} + \frac{1}{4} + \frac{2}{8} = 1$ exactly — far above the three-task bound of $0.780$. For task 3, $R = 2 + \lceil R/2 \rceil \cdot 1 + \lceil R/4 \rceil \cdot 1$ goes $2 \to 4 \to 5 \to 7 \to 8 \to 8$. And $8 \le 8$: it meets its deadline with not a microsecond to spare. Flight software designers often choose harmonic rates such as $400$, $200$, $100$ and $50\,\mathrm{Hz}$ for exactly this reason.

## Why the tests disagree

Both demonstrations have the same root. Total utilisation says *how much* processor time is claimed. Schedulability asks *whether that time can be arranged*, with these periods, so that nothing is needed in two places at once.

- The **Liu-Layland bound** handles the arrangement by assuming the worst one possible for $n$ tasks. So it is safe to trust when it passes, and needlessly gloomy for the many sets whose real periods are friendlier.
- The **bare sum** $U \le 1$ ignores the arrangement entirely. So it can pass a set whose particular periods force one task into an extra, deadline-breaking release of another.
- **Response-time analysis** is the only one of the three that looks at the actual periods and asks the actual question: at the one moment that matters, does the work fit before the deadline?

That is what "necessary and sufficient" buys, and it is why a real schedulability argument is built on response-time analysis, not on the bound.

::: warning
A failed Liu-Layland bound is not a design flaw to fix by redesign. It is an open question to close by calculation. Cutting a loop rate, moving a task to another core, or redesigning a controller for a slower rate — on the strength of a failed bound alone — can throw away margin that a five-line iteration would have proven safe. Run the exact test before you change anything the bound merely declined to approve.
:::

## Check yourself

::: check
A three-task set fails the Liu-Layland bound. A reviewer says, "Then it is not schedulable under rate-monotonic priorities." Is the reviewer right? What one calculation settles it?
:::

::: answer
The reviewer is not entitled to that conclusion. The bound is sufficient, not necessary, so failing it means the test cannot say either way — not that the set fails.

The calculation that settles it is response-time analysis. Compute $R_i$ for each task, from highest priority down, with the fixed-point iteration, and compare each with its deadline. If every $R_i \le D_i$, the set is schedulable despite the failed bound, as in this lesson's first demonstration. Only if some $R_i > D_i$ is "not schedulable" a conclusion the evidence supports.
:::

::: check
Why must the response-time iteration either settle down or pass the deadline? Why can it never bounce back and forth, or creep upward forever?
:::

::: answer
The right-hand side, $C_i + \sum_j \lceil R/T_j \rceil C_j$, never goes down when $R$ goes up: a bigger $R$ can only keep each ceiling the same or raise it. The first guess is the smallest possible, so each new guess is at least as big as the one before. The guesses never go down, so they cannot bounce.

They also cannot creep upward by tiny amounts forever. Each time a guess grows, some ceiling went up by at least one, so the guess grows by at least one whole $C_j$ — at least the smallest higher-priority execution time. Growing in steps of at least that size, the guesses either stop (a fixed point) or pass $D_i$ after a limited number of steps, and then you stop.
:::

::: check
A task has one higher-priority task above it, with $C_1 = 3$ and $T_1 = 10$. The task itself has $C_2 = 6$. Run the iteration by hand and say whether it meets $D_2 = 16$.
:::

::: answer
Start at $R^{(0)} = C_2 = 6$.

Next: $R^{(1)} = 6 + \lceil 6/10 \rceil \cdot 3 = 6 + 1 \cdot 3 = 9$.

Next: $R^{(2)} = 6 + \lceil 9/10 \rceil \cdot 3 = 6 + 3 = 9$. It stopped changing, so $R_2 = 9$.

Since $9 \le 16$, the task is schedulable, with $7\,\mathrm{ms}$ of slack.
:::

::: check
In the second demonstration, change task 2's period (and deadline) from $11$ to $16$, keeping $C_2 = 4$ and task 1 the same. Recompute $U$ and $R_2$. Does this change alone fix the miss?
:::

::: answer
$U = \frac{5}{8} + \frac{4}{16} = 0.625 + 0.25 = 0.875$ — still under $1$, and still above the two-task bound of $0.828$, so the bound is still silent.

For $R_2$: start at $4$. Then $4 + \lceil 4/8 \rceil \cdot 5 = 9$. Then $4 + \lceil 9/8 \rceil \cdot 5 = 14$. Then $4 + \lceil 14/8 \rceil \cdot 5 = 14$. So $R_2 = 14$.

Against the new deadline of $16$, $14 \le 16$: the miss is fixed. But notice how. $R_2$ is exactly the same as before, because task 1 and task 2's own work did not change. The fix came from giving task 2 a later deadline, not from making anything faster. Sometimes a miss is cured by more room rather than less work, and the iteration tells you exactly how much room is enough.
:::

::: check
Why does the critical-instant argument let you check only one release pattern, instead of every combination of release times a real mission could produce?
:::

::: answer
Releasing task $i$ together with every higher-priority task gives the most possible interference to that job of task $i$. Any other timing gives each higher-priority task the same number of releases inside the window or fewer, so the delay is the same or less.

Since the critical instant is the worst case, the response time found there is an upper limit on the response time for every other timing the tasks could ever show in flight. Proving the deadline is met there proves it for all timings, without having to list the endless possible offsets one by one.
:::

## Summary

| Item | Statement |
| --- | --- |
| Response time $R_i$ | Longest time from a task's release to its finish |
| Critical instant | Task $i$ and every higher-priority task released together: the worst case |
| Ceiling $\lceil x \rceil$ | Round up to the next whole number |
| Response-time equation | $R_i = C_i + \sum_{j\in\mathrm{hp}(i)}\lceil R_i/T_j\rceil C_j$ |
| How to solve it | Iterate from $R = C_i$; stop when it stops changing, or once it passes $D_i$ |
| Schedulable | Exactly when $R_i \le D_i$ for every task; necessary and sufficient |
| Demo 1 | $(1,3), (2,8), (3,12)$: $U = 0.833$ fails the $0.780$ bound, yet $R = 1, 3, 8$ all meet |
| Demo 2 | $(5,8), (4,11)$: $U = 0.989 \le 1$, yet $R_2 = 14 > 11$ misses |
| Harmonic periods | Each period divides the longer ones; RM is schedulable up to $U = 1$ |
| Why tests disagree | The bound assumes the worst alignment; the bare sum ignores alignment; only RTA checks the real periods |

You now have an exact answer for any fixed-priority task set whose tasks never wait for each other. The next lesson shows a deadline missed even when every $C_i$ and $T_i$ is exactly as analysed here: a high-priority task stuck behind a **[[lock|blocking-bridge]]** held by a task with no business delaying it.

::: context necessary-sufficient Two words from logic
A test is **sufficient** if passing it is enough to be sure: "if it passes, the set is safe". It is **necessary** if every safe set passes it: "if it fails, the set is not safe". The Liu-Layland bound is sufficient only — a pass proves safety, a fail proves nothing. A test that is both gives a clean yes or no. Everyday version: being in Paris is sufficient for being in France, but not necessary — you could be in Lyon.
:::

::: context fixed-point Guesses that agree with themselves
A **fixed point** of a rule is a value the rule sends back to itself. Try it on a calculator in radian mode: type any number and press the cosine key again and again. The display settles on $0.739085\ldots$, because $\cos(0.739085) = 0.739085$. Response-time iteration works the same way. Its rule is "response time = my work plus the interference in that much time", and the answer is the first value the rule gives back unchanged.
:::

::: context demo1-timeline The first demonstration, drawn out
Each row is one task, from time $0$ to $12\,\mathrm{ms}$, all released together at $0$. Task 1 (blue) runs at $0$, $3$, $6$ and $9$. Task 2 (orange) runs its two milliseconds at $1$–$3$ and, after its second release at $8$, again at $8$–$9$ and $10$–$11$. Task 3 (grey) gets only the gaps: $4$–$6$ and $7$–$8$. It finishes at $8$, well before its deadline of $12$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="end">
    <text x="52" y="36">task 1</text><text x="52" y="72">task 2</text><text x="52" y="108">task 3</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="20" width="24" height="22" fill="#8fb8f0"/><rect x="132" y="20" width="24" height="22" fill="#8fb8f0"/>
    <rect x="204" y="20" width="24" height="22" fill="#8fb8f0"/><rect x="276" y="20" width="24" height="22" fill="#8fb8f0"/>
    <rect x="84" y="56" width="48" height="22" fill="#f2b880"/><rect x="252" y="56" width="24" height="22" fill="#f2b880"/>
    <rect x="300" y="56" width="24" height="22" fill="#f2b880"/>
    <rect x="156" y="92" width="48" height="22" fill="#6c7a93"/><rect x="228" y="92" width="24" height="22" fill="#6c7a93"/>
  </g>
  <line x1="252" y1="88" x2="252" y2="120" stroke="#b4232c" stroke-width="2"/>
  <text x="252" y="132" font-size="11" fill="#b4232c" text-anchor="middle">done at 8</text>
  <line x1="60" y1="140" x2="348" y2="140" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="154">0</text><text x="132" y="154">3</text><text x="204" y="154">6</text>
    <text x="252" y="154">8</text><text x="348" y="154">12</text>
  </g>
</svg>
```
:::

::: context staircase The staircase and the line
For task 3 of the first demonstration, the blue staircase is the right-hand side, $3 + \lceil R/3\rceil \cdot 1 + \lceil R/8\rceil \cdot 2$, which jumps whenever $R$ passes a multiple of $3$ or $8$. The grey line is $R$ itself. The guesses $3 \to 6 \to 7 \to 8$ (red dots) climb until the staircase meets the line, at $R = 8$. Starting from the smallest guess means you always find the *first* meeting point, which is the true response time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="330" y2="50" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="316" y="72" font-size="11" fill="#6c7a93">R</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="50" y1="106" x2="134" y2="106"/><line x1="134" y1="92" x2="218" y2="92"/>
    <line x1="218" y1="78" x2="274" y2="78"/><line x1="274" y1="50" x2="302" y2="50"/>
    <line x1="302" y1="36" x2="330" y2="36"/>
  </g>
  <g fill="#b4232c">
    <circle cx="134" cy="106" r="4"/><circle cx="218" cy="92" r="4"/><circle cx="246" cy="78" r="4"/><circle cx="274" cy="78" r="5"/>
  </g>
  <text x="274" y="100" font-size="11" fill="#b4232c" text-anchor="middle">R = 8</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="205">0</text><text x="134" y="205">3</text><text x="218" y="205">6</text>
    <text x="274" y="205">8</text><text x="330" y="205">10</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="194">0</text><text x="44" y="110">6</text><text x="44" y="82">8</text><text x="44" y="54">10</text>
  </g>
</svg>
```
:::

::: context demo2-timeline The second demonstration, drawn out
Task 1 (blue) runs $0$–$5$ and again $8$–$13$. Task 2 (orange) gets $5$–$8$, is cut off by task 1's second release, and finishes its last millisecond at $13$–$14$ (red) — after its deadline at $11$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="end">
    <text x="52" y="40">task 1</text><text x="52" y="78">task 2</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="24" width="100" height="24" fill="#8fb8f0"/><rect x="220" y="24" width="100" height="24" fill="#8fb8f0"/>
    <rect x="160" y="62" width="60" height="24" fill="#f2b880"/><rect x="320" y="62" width="20" height="24" fill="#b4232c"/>
  </g>
  <line x1="280" y1="14" x2="280" y2="96" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="280" y="11" font-size="11" fill="#1f2a44" text-anchor="middle">task 2 deadline</text>
  <line x1="60" y1="104" x2="340" y2="104" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="120">0</text><text x="160" y="120">5</text><text x="220" y="120">8</text>
    <text x="280" y="120">11</text><text x="340" y="120">14</text>
  </g>
</svg>
```
:::

::: context harmonic Where "harmonic" comes from
The word is borrowed from music. A guitar string vibrates at a base frequency and also at two, three, four times it — its harmonics — and those tones blend smoothly because their cycles line up. Task periods of $2$, $4$ and $8$ line up the same way: every long period is an exact whole number of short ones, so their releases always fall on shared beats and never catch each other at an awkward moment.
:::

::: context blocking-bridge What a lock does to the equation
A **lock** (or mutex) lets only one task at a time touch some shared data. If a high-priority task finds the lock taken by a low-priority task, it must wait — something the equation here never counted, since its sum runs only over higher-priority tasks. Lesson four adds a **blocking term** $B_i$ to the equation, $R_i = C_i + B_i + \sum \lceil R_i/T_j \rceil C_j$, and shows how to keep $B_i$ bounded. On Mars Pathfinder it was not bounded, and the spacecraft kept resetting.
:::
