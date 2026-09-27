---
id: l13-nlp-sparsity
title: "NLP sparsity: the Jacobian and Hessian block pattern"
minutes: 20
covers:
  - "NLP sparsity structure, the Jacobian and Hessian block pattern, and why sparsity decides solve time"
---

Picture a **[[bucket brigade|bucket-brigade]]**: a line of people passing buckets of water from a well to a fire. Each person takes a bucket from the one behind and hands it to the one in front. Nobody ever deals with someone five places away. Now make a big table with one row and one column for every person, and put a check mark wherever two people touch a bucket together. Almost the whole table is empty. The only check marks sit in a narrow stripe along the diagonal.

A collocation problem is a bucket brigade. Lessons 6 and 8 turned a trajectory into a long list of node values, tied together by **defect constraints** — equations that say "the state at the next node must follow from this one by the dynamics". Each defect involves only two neighboring nodes. So the big tables the solver works with are almost entirely zeros, with the numbers crowded into a narrow stripe. That emptiness has a name, **sparsity**: most entries of a matrix are exactly zero. This lesson shows the pattern those zeros make, counts them, and shows why they decide whether a solve takes milliseconds or hours.

## What the solver does over and over

An interior-point or sequential-quadratic-programming solver works in **iterations**: it takes a step, looks at where it landed, and takes a better step. You met both kinds in the optimization module. Under the hood, every iteration does the same expensive thing: it solves one large system of linear equations to find the next step.

That linear system is built from two matrices:

- The **constraint [[Jacobian|jacobian-name]]**: a table of slopes. Each row is one constraint, each column is one unknown, and each entry says how much that constraint changes when that unknown is nudged. In symbols, entry $(i, j)$ is $\partial c_i/\partial z_j$ ("partial c i by partial z j"), where $c_i$ is constraint $i$ and $z_j$ is unknown $j$.
- The **Hessian of the Lagrangian**: a table of curvatures. The **Lagrangian** here is the cost plus each constraint times its multiplier (its "price"), and the Hessian holds its second derivatives, one row and one column per unknown.

Put them together in one block matrix and you get the **[[KKT matrix|kkt-name]]**. Solving a linear system with it — usually by **factoring**, which means breaking it into simpler triangular pieces, the organized form of the elimination you learned in algebra — is the most expensive step of each iteration. A solver repeats it tens to hundreds of times. How long it takes depends enormously on how many entries are nonzero.

## The pattern, from what a defect touches

Use lesson 6's notation. Node $k$ carries the state $\mathbf{x}_k$ and the control $\mathbf{u}_k$. The defect on segment $k$, trapezoidal or Hermite-Simpson, is a function of four things only:

$$
\mathbf{d}_k = \mathbf{d}_k\big(\mathbf{x}_k, \mathbf{u}_k, \mathbf{x}_{k+1}, \mathbf{u}_{k+1}\big).
$$

Nothing else. The defect on segment $k$ does not know node $j$ exists when $j$ is more than one step away. So its derivative with respect to any such node is not small — it is exactly zero.

Stack every defect into the Jacobian, one **row block** (a band of rows) per segment and one **column block** (a band of columns) per node. Row block $k$ has nonzero entries only in column blocks $k$ and $k+1$. Everything else is zero. The result is **block-banded**: the nonzero blocks form a narrow staircase down the diagonal, two blocks wide, with nothing but zeros above and below it.

The boundary conditions add a few rows that touch only the first node block (the fixed start) or the last (the landing conditions). No row in a standard collocation problem ever links a node in the middle to a node far away.

::: key The sparsity pattern, in one line
A defect couples only its own two endpoint nodes; stacked across a mesh, that makes the constraint Jacobian block-banded with a fixed bandwidth (set by the scheme, not by $N$), giving $O(N)$ nonzero entries against $O(N^2)$ total — a fraction that shrinks every time the mesh is refined further.
:::

The notation $O(N)$ is read "order $N$", or **[[big-O|big-o]]** of $N$. It means "grows in proportion to $N$", ignoring the fixed multiplier in front. $O(N^2)$ means "grows like $N$ squared".

::: example Counting the zeros
Take the Mars descent problem from lesson 1: three states (altitude $h$, velocity $v$, mass $m$) and one control (thrust $T$), so four unknowns per node. Use $N$ segments, so $N + 1$ nodes.

**Size of the table.** Unknowns: $4(N+1)$. Defect rows: three per segment, $3N$. So the full Jacobian of the defects has $3N \times 4(N+1)$ entries.

**Nonzero entries.** Each segment's three defect rows can touch the 8 unknowns of its two nodes. That is at most $3 \times 8 = 24$ nonzeros per segment, or $24N$ in all.

**The fraction.** Divide: $\dfrac{24N}{3N \times 4(N+1)} = \dfrac{24N}{12N(N+1)} = \dfrac{2}{N+1}$. Now fill in the table:

| $N$ | unknowns | defect rows | nonzero entries | fraction nonzero |
| --- | --- | --- | --- | --- |
| $20$ | $84$ | $60$ | $480$ | $9.52\,\%$ |
| $50$ | $204$ | $150$ | $1200$ | $3.92\,\%$ |
| $100$ | $404$ | $300$ | $2400$ | $1.98\,\%$ |
| $200$ | $804$ | $600$ | $4800$ | $0.995\,\%$ |
| $400$ | $1604$ | $1200$ | $9600$ | $0.499\,\%$ |

**Read it.** The nonzeros grow **linearly** in $N$: each new segment adds one more defect block, touching two node blocks, however big the rest of the mesh is. The whole table grows roughly as $N^2$. So the fraction falls by very nearly half each time $N$ doubles. At $N = 400$, more than $99.5\,\%$ of the table a dense solver would store and factor is structural zero.

**Sanity check with the real physics.** The count of 24 per segment assumes every defect depends on all 8 unknowns. The descent dynamics are sparser still. The altitude equation is $\dot h = v$, so its trapezoidal defect touches only $h_k, h_{k+1}, v_k, v_{k+1}$: 4 entries. The velocity equation $\dot v = T/m - g$ touches $v$, $T$ and $m$ at both nodes: 6. The mass equation $\dot m = -T/c$ touches $m$ and $T$ at both nodes: 4. That is $14$ per segment, not 24. At $N = 200$ the true count is $2800$ nonzeros, $0.58\,\%$ of the table. The block pattern is the ceiling; real dynamics usually sit below it.
:::

::: note A free final time adds one full column
Lesson 6 noted that $t_f$ becomes one extra unknown when the flight time is free. Every defect contains the segment length $h = (t_f - t_0)/N$, so every defect row depends on $t_f$. That makes one [[dense column|dense-column]] down the whole Jacobian. It costs $3N$ more nonzeros — still $O(N)$ — and good sparse solvers handle one dense column cheaply. The pattern stays "a narrow band, plus a thin border".
:::

## Why the fraction decides solve time, not just memory

Zeros save storage, but the real prize is time. Think about **Gaussian elimination**, the step-by-step method of clearing out a column below the diagonal, then the next, and so on. On a **dense** matrix — one treated as if every entry might be nonzero — with $n$ unknowns, each of the $n$ steps updates a big chunk of the remaining table. The total work is about $\tfrac{2}{3}n^3$ **[[flops|flops]]**, where a flop is one addition or multiplication of decimal numbers. Double $n$ and the work goes up eight times.

Now eliminate a banded matrix. Clearing a column only changes entries inside the band. Elimination can create new nonzeros where zeros were — this is called **fill-in** — but for a banded matrix the fill-in never leaks outside the band. So each step costs a fixed amount set by the band's width. If the band reaches $p$ places on each side of the diagonal (the **half-bandwidth**), the whole factorization costs about $2np^2$ flops. That is $O(n)$ for a fixed $p$. And $p$ is set by the scheme — for trapezoidal collocation, about two node blocks wide — not by $N$.

::: example A factorization that stays fast while the dense one runs away
Take a block-banded system shaped like the descent Jacobian: four unknowns per node, each node coupled only to its neighbors. The half-bandwidth is $p = 2 \times 4 - 1 = 7$.

**At $N = 200$.** The system has $n = 804$ unknowns, the $N = 200$ mesh above.

- Dense: $\tfrac{2}{3} \times 804^3 = 3.46 \times 10^{8}$ flops.
- Banded: $2 \times 804 \times 7^2 = 2 \times 804 \times 49 = 78{,}792$ flops, about $7.9 \times 10^4$.
- Ratio: $3.46 \times 10^8 / 7.9 \times 10^4 \approx 4400$.

**At $N = 3000$.** Now $n = 12{,}004$, an ordinary size for a real vehicle with several flight phases.

- Dense: $\tfrac{2}{3} \times 12{,}004^3 = 1.15 \times 10^{12}$ flops.
- Banded: $2 \times 12{,}004 \times 49 = 1.18 \times 10^6$ flops.
- Ratio: about $980{,}000$.

**The clock.** The program below builds such systems and solves them both ways, on one processor core. The banded solve is a simple forward-then-backward sweep down the blocks. In one run it took $3.3\ \mathrm{ms}$ at $n = 804$ and $48\ \mathrm{ms}$ at $n = 12{,}004$. The dense solve took $16\ \mathrm{ms}$ at $n = 804$ and $520\ \mathrm{ms}$ at $n = 3204$. Scaled up by $n^3$, it would need something like half a minute at $n = 12{,}004$ — for *one* factorization, which the solver repeats every iteration.

**Sanity check.** At small $n$ the clock gap (about $5\times$) is far smaller than the flop gap ($4400\times$). That makes sense: the sweep is a Python loop, and the fixed cost of each loop step swamps the handful of flops it does. As $n$ grows, the flops take over and the gap races toward the flop ratio. Push on to $n = 100{,}000$ and a dense matrix would not even fit in most computers' memory: $100{,}000^2$ entries at 8 bytes each is $80$ gigabytes. The banded one needs about ten megabytes.
:::

Here is the program. It uses only NumPy. Timings depend on the machine, so yours will differ; the agreement between the two answers should not.

```python
import time
import numpy as np

def block_sweep_solve(A, D, C, r):
    """Solve a block-tridiagonal system with one forward and one backward sweep.
    D[k]: diagonal blocks; A[k]: block left of the diagonal in row k;
    C[k]: block right of the diagonal in row k; r[k]: right-hand side."""
    n = len(D)
    Dp, rp = [D[0]], [r[0]]
    for k in range(1, n):                      # forward: clear the block left of the diagonal
        W = A[k] @ np.linalg.inv(Dp[k - 1])
        Dp.append(D[k] - W @ C[k - 1])
        rp.append(r[k] - W @ rp[k - 1])
    x = [None] * n
    x[-1] = np.linalg.solve(Dp[-1], rp[-1])
    for k in range(n - 2, -1, -1):             # backward: substitute up the chain
        x[k] = np.linalg.solve(Dp[k], rp[k] - C[k] @ x[k + 1])
    return np.concatenate(x)

rng = np.random.default_rng(0)
b = 4                                          # unknowns per node
for N in (200, 800, 3000):
    nodes = N + 1
    D = [rng.standard_normal((b, b)) + 8 * np.eye(b) for _ in range(nodes)]
    A = [rng.standard_normal((b, b)) for _ in range(nodes)]
    C = [rng.standard_normal((b, b)) for _ in range(nodes)]
    r = [rng.standard_normal(b) for _ in range(nodes)]
    t0 = time.perf_counter()
    x_band = block_sweep_solve(A, D, C, r)
    line = f"n = {b * nodes:6d}   sweep {1e3 * (time.perf_counter() - t0):7.1f} ms"
    if N <= 800:                               # the same system with its zeros stored
        M = np.zeros((b * nodes, b * nodes))
        for k in range(nodes):
            M[b*k:b*k+b, b*k:b*k+b] = D[k]
            if k > 0:
                M[b*k:b*k+b, b*(k-1):b*k] = A[k]
            if k < nodes - 1:
                M[b*k:b*k+b, b*(k+1):b*(k+2)] = C[k]
        t0 = time.perf_counter()
        x_dense = np.linalg.solve(M, np.concatenate(r))
        line += f"   dense {1e3 * (time.perf_counter() - t0):7.1f} ms"
        line += f"   max difference {np.max(np.abs(x_band - x_dense)):.1e}"
    print(line)
# One run, single core (timings vary by machine):
# n =    804   sweep     3.3 ms   dense    16.2 ms   max difference 1.7e-16
# n =   3204   sweep    12.7 ms   dense   522.4 ms   max difference 2.8e-16
# n =  12004   sweep    47.9 ms
```

Notice the sweep time grows about four times each time $n$ grows four times: linear. The dense time grew about $32$ times for the same step, heading toward the $64$ that $n^3$ predicts.

## The Hessian tells the same story

A second-order solver also needs the Hessian of the Lagrangian. It inherits the same band, for the same reason. Its curvature comes from only two sources:

- **The cost.** In pure Mayer form (lesson 1's trip-meter trick) the cost depends only on the last node. A running cost summed node by node depends on one node at a time. Either way, the cost's second derivatives fill only blocks on the diagonal: a **block-diagonal** piece.
- **The defects.** Each defect, weighted by its multiplier, has second derivatives only among the unknowns of its own two nodes. That fills a diagonal block and its immediate neighbors — the same two-node-wide coupling the Jacobian has.

There is no third source of curvature that could link distant nodes. So the whole KKT matrix, with unknowns and multipliers ordered node by node, is **block-tridiagonal** in shape: nonzero on the diagonal blocks and their nearest neighbors, zero everywhere else.

Special solvers are built for exactly this shape. **[[Riccati-recursion|riccati-bridge]]** KKT solvers — direct descendants of the LQR machinery from the optimal control module — solve the linear system in one sweep backward and one forward along the mesh, the way the program above does, at a cost linear in $N$, without ever forming the dense matrix.

::: warning Sparsity lives in the transcription, but the solver must be told
Write a constraint function in code, hand it to a generic solver, and let it estimate the Jacobian by **[[finite differences|finite-differences]]** — nudge one unknown, re-evaluate every constraint, see what moved — and all of this lesson's structure is thrown away. Nudging each of $n$ unknowns and re-evaluating all $m$ constraints is $O(nm)$ work however sparse the true Jacobian is, and many tools do exactly that unless told otherwise.

There are two ways to get the speed back. First, supply the sparsity pattern, so the solver only works out entries that can be nonzero. With the pattern known, it can nudge many unknowns at once by **[[graph coloring|graph-coloring]]**: two columns that never share a row can be nudged together without their effects mixing. For trapezoidal collocation, node $k$ and node $k+2$ never share a defect, so the columns sort into $2 \times 4 = 8$ groups. That is 8 extra constraint evaluations instead of $804$ at $N = 200$, and still 8 at any $N$. Second, provide exact derivatives that are sparse by construction, which is what the automatic-differentiation tools of lesson 16 do well. A correctly transcribed, truly sparse problem handed to a solver that ignores the sparsity gets none of the speed.
:::

## Why single shooting never had this option

Direct single shooting, from lesson 7, keeps only the controls as unknowns. It integrates the whole trajectory from start to finish and asks how the final state depends on each control. That Jacobian is **dense** by construction. The derivative $\partial\mathbf{x}_N/\partial\mathbf{u}_0$ — how the final state depends on the very first control — is generally not zero, because an early control really does affect the end, passed along through every step of the flight. The same holds for every other control.

There is no empty block to exploit. Single shooting never created the in-between node unknowns, and those unknowns are exactly what cut the long chain of dependence into short, two-node links. It gets worse for **unstable** dynamics — ones where small differences grow over time. There, lesson 7 showed, an early control's effect on the end state grows exponentially with the length of the flight, so the dense Jacobian is also badly balanced, with some columns vastly bigger than others. Newton steps on such a matrix are unreliable.

This is the other side of the trade from lesson 7. Multiple shooting and collocation buy sparsity by adding unknowns. The payoff is the factorization speed this lesson just put numbers on — plus a bonus: because the states are unknowns too, you can start the solver from a sensible guess of the whole trajectory instead of hoping one shot lands nearby.

## Check yourself

::: check
Why does the number of nonzero Jacobian entries grow linearly in $N$, while the dense matrix size grows quadratically?
:::

::: answer
**Nonzeros.** Each extra segment adds exactly one more defect block, and that block touches exactly two node blocks — its own endpoints — no matter how many other segments exist. So every new segment adds the same fixed number of nonzeros (at most 24 for the descent problem). That is linear growth in $N$.

**The whole table.** Its size is (number of constraint rows) times (number of unknowns). Each of those grows linearly in $N$ on its own, so their product grows like $N^2$.

**The fraction.** Nonzeros over total is $O(N)/O(N^2) = O(1/N)$. For the descent problem it is exactly $2/(N+1)$, which roughly halves each time $N$ doubles — the pattern in the table.
:::

::: check
A colleague builds a collocation solver and confirms the true Jacobian is more than $99\,\%$ zeros at their mesh size. The solve is still nearly as slow as a dense one. What is the most likely explanation?
:::

::: answer
The sparsity of the *true* Jacobian does not help if the solver was never told about it. A generic finite-difference estimator that nudges every unknown one at a time and re-evaluates every constraint does $O(nm)$ work to discover a matrix that is $99\,\%$ zero. It pays nearly the full dense cost just to build the Jacobian, and then may store and factor it as dense too. The fix is to supply the sparsity pattern up front (so only possibly-nonzero entries are computed, with coloring to group the nudges), or to use derivatives that are sparse from the start — not to hope that some routine further down will notice the zeros by itself.
:::

::: check
Why does the Hessian of the Lagrangian inherit the same two-node-wide band as the constraint Jacobian, rather than some other pattern?
:::

::: answer
The Hessian is built from second derivatives of two things. The cost depends on one node at a time (a stage cost at each node, or a Mayer cost on the last node only), so it contributes only diagonal blocks. Each defect, weighted by its multiplier, involves only the two nodes it links, so its second derivatives sit in those two nodes' blocks. A standard collocation problem has no third source of curvature that could couple nodes farther apart. Every term traces back to either a one-node cost or a two-node defect, so the sum has exactly the bandwidth of those two sources.
:::

::: check
At $n = 804$ the flop ratio between a dense and a banded factorization was about $4400$. Roughly what would it become at $n = 8040$, ten times larger, if the banded solve stays $O(n)$ and the dense one $O(n^3)$?
:::

::: answer
The dense cost scales as $n^3$, so ten times the unknowns costs about $10^3 = 1000$ times more. The banded cost scales as $n$, so about $10$ times more. The ratio grows by $1000/10 = 100$, from about $4400$ to about $440{,}000$. (Check with the formulas: $\tfrac{2}{3} \times 8040^3 / (2 \times 8040 \times 49) = 4.4 \times 10^5$.) The $n^3$ growth moves a dense factorization from "slow" to "not worth running" much faster than $O(n)$ ever does — and the solver needs a factorization at every iteration.
:::

::: check
Graph coloring lets a finite-difference estimator nudge several unknowns at once. For trapezoidal collocation on the descent problem, why can the unknowns of node 3 and node 5 be nudged together, but not those of node 3 and node 4?
:::

::: answer
Node 3 appears in defects 2 and 3 (the segments on either side of it). Node 5 appears in defects 4 and 5. No defect contains both, so nudging them together changes different rows, and each change can be read off without confusion. Node 4 appears in defects 3 and 4. Defect 3 contains both node 3 and node 4, so nudging them together would mix their effects in that row. Sorting nodes by even and odd, with one of the four unknowns at a time, gives the $8$ groups.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Each iteration | Factor one large KKT system built from the constraint Jacobian and the Hessian of the Lagrangian |
| Jacobian pattern | Block-banded: defect row block $k$ touches only node blocks $k$ and $k+1$; fixed bandwidth, independent of $N$ |
| Nonzero growth | $O(N)$ nonzeros against $O(N^2)$ entries; fraction $2/(N+1)$ for the descent blocks |
| Counted example | $9.52\,\%$ at $N=20$ down to $0.499\,\%$ at $N=400$; true descent physics even sparser ($14$ per segment) |
| Solve cost | Dense: about $\tfrac{2}{3}n^3$ flops. Banded, half-bandwidth $p$: about $2np^2$, which is $O(n)$ |
| Flop example | $n=804$: ratio about $4400$; $n=12{,}004$: about $980{,}000$ |
| Hessian pattern | Same band: block-diagonal cost plus two-node-wide defect curvature; KKT matrix block-tridiagonal |
| Riccati sweep | Solves the block-tridiagonal KKT system in one backward and one forward pass, linear in $N$ |
| Tell the solver | Give it the pattern (with coloring: 8 groups for trapezoidal descent) or sparse exact derivatives |
| Single shooting | No node unknowns, so a dense Jacobian — and badly scaled for unstable dynamics |

Sparsity is a property of how the equations are written. The next lesson turns to a property of the *numbers* inside them — the scaling that decides whether a correctly sparse, correctly structured problem converges at all.

::: context bucket-brigade Only neighbors talk
Draw the nodes of a mesh as dots in a line and each defect as a link. Every link joins two neighbors, and nothing joins distant dots. That chain is the whole reason the matrices in this lesson are sparse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="30" y1="45" x2="80" y2="45"/><line x1="80" y1="45" x2="130" y2="45"/>
    <line x1="130" y1="45" x2="180" y2="45"/><line x1="180" y1="45" x2="230" y2="45"/>
    <line x1="230" y1="45" x2="280" y2="45"/><line x1="280" y1="45" x2="330" y2="45"/>
  </g>
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="2">
    <circle cx="30" cy="45" r="11"/><circle cx="80" cy="45" r="11"/><circle cx="130" cy="45" r="11"/>
    <circle cx="180" cy="45" r="11"/><circle cx="230" cy="45" r="11"/><circle cx="280" cy="45" r="11"/>
    <circle cx="330" cy="45" r="11"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="49">0</text><text x="80" y="49">1</text><text x="130" y="49">2</text><text x="180" y="49">3</text>
    <text x="230" y="49">4</text><text x="280" y="49">5</text><text x="330" y="49">6</text>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="55" y="32">d0</text><text x="105" y="32">d1</text><text x="155" y="32">d2</text>
    <text x="205" y="32">d3</text><text x="255" y="32">d4</text><text x="305" y="32">d5</text>
  </g>
  <text x="180" y="82" font-size="11" text-anchor="middle" fill="#6c7a93">nodes (dots) linked only by the defect between them</text>
</svg>
```
:::

::: context jacobian-name A table of slopes
The Jacobian is named for Carl Gustav Jacobi, a German mathematician of the 1800s. For one equation in one unknown it is the ordinary slope. For many equations in many unknowns it is a table: one row per equation, one column per unknown, each entry the slope of that equation in that unknown with everything else held still. Newton's method uses it to guess how far to move every unknown at once. A zero entry says "this equation does not care about this unknown at all".
:::

::: context kkt-name Karush, Kuhn and Tucker
The KKT conditions are the rules a constrained optimum must satisfy: the cost's slope is balanced by the constraints' slopes times their multipliers, and every constraint holds. They are named for William Karush, who wrote them down in a 1939 master's thesis, and Harold Kuhn and Albert Tucker, who published them in 1951. A solver hunts for a point that satisfies them. Each Newton-style step toward that point needs one solve with the KKT matrix, which is why that solve sets the pace.
:::

::: context big-o Reading big-O
Big-O notation keeps only how fast something grows, not the exact count. $24N$ nonzeros and $14N$ nonzeros are both $O(N)$: double $N$, and both double. $\tfrac{2}{3}n^3$ flops is $O(n^3)$: double $n$, and the work goes up eight times. Engineers use it because the leading growth rate is what decides whether a method survives a bigger problem. A method ten times slower but $O(n)$ eventually beats any $O(n^3)$ method.
:::

::: context dense-column One column that touches everything
Picture the banded staircase with one extra column at the right edge, filled from top to bottom. That is what a free final time does, since every segment's length depends on it. A good sparse solver treats the band and the border separately — eliminate the band as usual, then deal with the single extra unknown at the end — so the cost stays linear in $N$. Trouble starts only when many such global unknowns pile up.
:::

::: context flops Counting arithmetic
A **flop** is one floating-point operation: one addition, subtraction, multiplication or division of decimal numbers the way a computer stores them. Counting flops is a machine-independent way to compare methods. One modern processor core, using its vector instructions on a dense matrix, manages a few tens of billions a second. So $1.15 \times 10^{12}$ flops is tens of seconds of work — and a solver that needs that factorization at each of a hundred iterations would take most of an hour, for a solve the banded method finishes in seconds.
:::

::: context riccati-bridge The same sweep as LQR
In the optimal control module, the LQR gain came from a Riccati equation run backward from the final time, followed by a forward pass that applies the gains. A block-tridiagonal KKT system can be solved the same way: a backward pass passes a small "cost-to-go" matrix from node to node, and a forward pass recovers the step. Fast embedded solvers for model predictive control are built on exactly this. It is also the core of iLQR from lesson 12.
:::

::: context finite-differences Estimating a slope by nudging
To estimate a slope without calculus, nudge the input a tiny amount and see how much the output changes: slope is about change in output over change in input. For a Jacobian, you nudge one unknown and recompute every constraint, which fills one column. Doing that for each of $n$ unknowns costs $n$ full evaluations. It is simple and it always works, which is why generic tools fall back on it, but it knows nothing about which entries must be zero.
:::

::: context graph-coloring Nudging many unknowns at once
Color the columns so that no row touches two columns of the same color. Then nudge every column of one color together: each row still sees at most one nudged unknown, so its change can be credited to the right column. Here node blocks alternate blue and orange; each color group (one of the four unknowns at a time) needs one evaluation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="20" width="280" height="150" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="20" width="40" height="25" fill="#8fb8f0"/><rect x="90" y="20" width="40" height="25" fill="#f2b880"/>
  <rect x="90" y="45" width="40" height="25" fill="#f2b880"/><rect x="130" y="45" width="40" height="25" fill="#8fb8f0"/>
  <rect x="130" y="70" width="40" height="25" fill="#8fb8f0"/><rect x="170" y="70" width="40" height="25" fill="#f2b880"/>
  <rect x="170" y="95" width="40" height="25" fill="#f2b880"/><rect x="210" y="95" width="40" height="25" fill="#8fb8f0"/>
  <rect x="210" y="120" width="40" height="25" fill="#8fb8f0"/><rect x="250" y="120" width="40" height="25" fill="#f2b880"/>
  <rect x="250" y="145" width="40" height="25" fill="#f2b880"/><rect x="290" y="145" width="40" height="25" fill="#8fb8f0"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="90" y1="20" x2="90" y2="170"/><line x1="130" y1="20" x2="130" y2="170"/><line x1="170" y1="20" x2="170" y2="170"/>
    <line x1="210" y1="20" x2="210" y2="170"/><line x1="250" y1="20" x2="250" y2="170"/><line x1="290" y1="20" x2="290" y2="170"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="188">0</text><text x="110" y="188">1</text><text x="150" y="188">2</text><text x="190" y="188">3</text>
    <text x="230" y="188">4</text><text x="270" y="188">5</text><text x="310" y="188">6</text>
  </g>
  <text x="44" y="37" font-size="11" text-anchor="end" fill="#1f2a44">d0</text>
  <text x="44" y="162" font-size="11" text-anchor="end" fill="#1f2a44">d5</text>
  <text x="190" y="13" font-size="11" text-anchor="middle" fill="#1f2a44">node blocks (columns); defect blocks (rows)</text>
</svg>
```

Every row holds one blue block and one orange block, never two of the same color — and that stays true however long the mesh grows.
:::
