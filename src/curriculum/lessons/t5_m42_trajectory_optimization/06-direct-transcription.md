---
id: l06-direct-transcription
title: "Direct transcription: from a continuous problem to a finite NLP"
minutes: 20
covers:
  - "Direct transcription: converting an infinite-dimensional problem into a finite NLP"
---

Your phone's map app records a bike ride. The ride itself was smooth: at every instant you had a position and a speed. But the phone does not store "every instant". It stores a dot every second — a long list of numbers — and draws lines between the dots. For almost any purpose, the list of dots *is* the ride.

A computer has the same limit. A trajectory $\mathbf{x}(t)$ is a function: it has a value at every one of infinitely many instants. That is what "**[[infinite-dimensional|infinite-dimensional]]**" means here — infinitely many numbers to pin down. No computer can hold that. It can hold a list.

**Direct transcription** is the step of replacing the continuous problem with a list-of-numbers problem *before* deriving any optimality condition at all. It is the biggest fork in this whole module. The last five lessons walked down one road. From here to the end, the module walks down the other.

## Two roads to the same trajectory

Both roads end with numbers in a computer. They differ in *when* you chop time into pieces.

- **Indirect** (lessons two to five): first derive the necessary conditions — the Hamiltonian, the costate equations, the minimum principle — and *then* chop that boundary value problem into steps to solve it, for example by shooting. **Optimize, then discretize.**
- **Direct** (from here on): first chop the *problem itself* into a finite list of numbers, and *then* hand that list to a general-purpose optimizer. **Discretize, then optimize.** ("Discretize" means turn something smooth into separate pieces — discrete ones.)

::: key Direct vs indirect methods in one line
Indirect: derive the optimality conditions, then discretize (optimise-then-discretise). Direct: discretize the problem, then optimize the resulting NLP (discretise-then-optimise). The two branches transcribe different objects.
:::

An **NLP**, or **[[nonlinear program|nlp-word]]**, is a finite optimization problem: choose a list of numbers to make one number (the cost) as small as possible, while some equations and inequalities hold. The optimization module built the tools for exactly this, including interior-point solvers.

## Building the finite stand-in

### The mesh and the decision vector

Pick a **[[mesh|mesh]]** of times $t_0 < t_1 < \cdots < t_N = t_f$ — the moments where the phone drops a dot. They may be equally spaced or not; choosing them well is lesson eleven's subject. The gap $h = t_{k+1}-t_k$ is the **step**.

Instead of the functions, keep only their values at the mesh points: $\mathbf{x}_k \approx \mathbf{x}(t_k)$ and $\mathbf{u}_k \approx \mathbf{u}(t_k)$ for $k=0,\dots,N$ (read $\mathbf{x}_k$ as "x sub k"). Add $t_f$ if the final time is free. These numbers, and nothing else, are what the optimizer may change. They form the **decision vector**:

$$
\mathbf{z} = \big(\mathbf{x}_0,\dots,\mathbf{x}_N,\ \mathbf{u}_0,\dots,\mathbf{u}_N,\ [t_f]\big) \in \mathbb{R}^{n_z}.
$$

The square brackets mean "only if it is free". $\mathbb{R}^{n_z}$ says $\mathbf{z}$ is a list of $n_z$ real numbers.

### The defect: the dynamics become equations

A list of dots says nothing yet about the physics. Nothing forces the dots to obey $\dot{\mathbf{x}}=\mathbf{f}(\mathbf{x},\mathbf{u},t)$. Without that, the optimizer could put the lander on the ground at $t_1$ for free.

The fix is one equation per segment $[t_k,t_{k+1}]$. The change in the state across the segment, $\mathbf{x}_{k+1}-\mathbf{x}_k$, must equal what the dynamics say it should be: the rate $\mathbf{f}$, added up over the segment by some **quadrature rule** (a recipe for adding up a rate, like "rate at the start times the step"). The leftover is the **[[defect|defect]]**:

$$
\mathbf{d}_k\big(\mathbf{x}_k,\mathbf{x}_{k+1},\mathbf{u}_k,\mathbf{u}_{k+1}\big) = \mathbf{0}, \qquad k=0,\dots,N-1.
$$

A **defect constraint** demands that leftover be zero. When every defect is zero, the dots are a trajectory that obeys the dynamics — as accurately as the quadrature rule allows. That is the whole reason "solve the differential equation" and "drive every defect to zero" can be treated as the same job.

Exactly how $\mathbf{d}_k$ is built — trapezoidal or Hermite-Simpson, the two forms the flashcards name — is the subject of lesson eight. What matters now is the shape of the idea.

### Everything else becomes constraints too

- **Boundary conditions** such as a fixed $\mathbf{x}_0$ or a target $\boldsymbol\psi(\mathbf{x}_N,t_f)=\mathbf{0}$ become ordinary equations on the first and last blocks of $\mathbf{z}$. No different in kind from the defects.
- **Path constraints** such as $\mathbf{u}_k\in\mathcal{U}$ or $\mathbf{x}_k\in\mathcal{X}$ ("the state stays in the allowed set") become bounds or inequalities, imposed node by node.
- **The cost.** Fold the Bolza cost into pure Mayer form with lesson one's extra state. Then the cost is a function of the last node alone, $\tilde\phi$ ("phi tilde"), and the running cost is added up by the very same defects as every other state.

Put together:

$$
\text{minimize } \tilde\phi(\mathbf{z}) \quad\text{subject to}\quad \mathbf{d}_k(\mathbf{z})=\mathbf{0},\ \ \boldsymbol\psi(\mathbf{z})=\mathbf{0},\ \ \mathbf{u}_k\in\mathcal{U},\ \ \mathbf{x}_k\in\mathcal{X}.
$$

That is the standard form of a nonlinear program: a finite objective, finite equalities, finite bounds and inequalities.

Nothing here is assumed **convex** (bowl-shaped, with a single lowest point). A trajectory NLP is exactly as curved and twisted as the dynamics behind it. Everything the optimization module said about local minima and **[[KKT points|kkt]]** on a nonconvex problem applies unchanged.

::: key Defect constraint
One equality constraint per segment per state says that $\mathbf{x}_{k+1}-\mathbf{x}_k$ equals a quadrature of $\mathbf{f}$ over that segment. A feasible point of the NLP — every defect zero — is, to the order of the quadrature rule, a solution of the differential equation. The dynamics are enforced as constraints rather than by marching forward in time.
:::

::: example Sizing the NLP for the Mars descent
The descent of lessons one and five has three states $(h,v,m)$ and one control $T$. Transcribe it on an evenly spaced mesh of $N=40$ segments, which means $41$ nodes.

**Unknowns.** Each node carries $3$ states and $1$ control: $41\times(3+1) = 164$. Add $1$ for the free $t_f$: $165$ unknowns.

**Defects.** Each of the $40$ segments has one defect per state: $40\times3=120$ equations.

**Boundary conditions.** Three at the start ($h_0$, $v_0$, $m_0$ all fixed) and two at the end ($h=0$, $v=0$). The final mass is left free, because maximizing it is the whole point. That is $5$ more equations, for $125$ equalities in all.

**Bounds.** $0\le T_k\le T_{\max}$ at each of $41$ nodes: $82$ simple bounds.

**Refine it.** At $N=200$, every count grows about five times — and not one line of physics changed. The mesh is an accuracy knob, not a modeling choice. That is why lesson eleven teaches how to turn it without wasting computation.

**A second problem, same template.** The orbit transfer of lesson four has three states $(r,v_r,v_t)$ (the angle drops out), one control (the steering angle $\beta$) and a free $t_f$. It transcribes the same way. Only $\mathbf{f}$, the boundary conditions and the bounds differ. This sameness is what lets one software tool (lesson sixteen surveys them) solve both without being told anything about rockets or orbits.
:::

## A whole transcription, start to finish

Seeing the full pipeline on a problem small enough to check by hand makes it concrete.

A spacecraft must slide $D = 10\,\mathrm{m}$ along a docking axis in $T = 100\,\mathrm{s}$, starting and ending at rest. Its thrusters give an acceleration $u$. Minimize the effort $J = \int_0^{T} u^2\,dt$ (a common stand-in for propellant when thrust is small). The exact best answer is known: $u(t) = \frac{6D}{T^2}\big(1-\frac{2t}{T}\big)$, a steady push that shrinks, crosses zero halfway and becomes a steady brake, with

$$
J^\star = \frac{12D^2}{T^3} = \frac{12\times10^2}{100^3} = 1.2\times10^{-3}\,\mathrm{m^2/s^3}.
$$

Now forget that and transcribe. States position $x$ and speed $v$, control $u$. Use the simplest defect there is — "rate at the start of the segment times the step" — for both states:

$$
x_{k+1}-x_k-h\,v_k = 0, \qquad v_{k+1}-v_k-h\,u_k = 0.
$$

Add the four boundary conditions $x_0=0$, $v_0=0$, $x_N=10$, $v_N=0$, and add up the cost the same way, $J\approx\sum_k h\,u_k^2$. Every constraint is a straight-line equation and the cost is a bowl, so this NLP is simple enough for one call to a linear solver: the optimality (KKT) conditions of such a problem are a single system of linear equations.

```python
import numpy as np

def transcribe_and_solve(N, D=10.0, T=100.0):
    """Minimum-effort move of D metres in T seconds, rest to rest."""
    h = T / N
    nx = N + 1                          # nodes for position and for speed
    nz = 2 * nx + N                     # z = (x_0..x_N, v_0..v_N, u_0..u_{N-1})
    X, V, U = 0, nx, 2 * nx             # where each block starts inside z
    rows, rhs = [], []
    for k in range(N):                  # two defects per segment
        r = np.zeros(nz); r[X + k + 1] = 1; r[X + k] = -1; r[V + k] = -h
        rows.append(r); rhs.append(0.0)     # x_{k+1} - x_k - h v_k = 0
        r = np.zeros(nz); r[V + k + 1] = 1; r[V + k] = -1; r[U + k] = -h
        rows.append(r); rhs.append(0.0)     # v_{k+1} - v_k - h u_k = 0
    for i, val in [(X, 0.0), (V, 0.0), (X + N, D), (V + N, 0.0)]:
        r = np.zeros(nz); r[i] = 1
        rows.append(r); rhs.append(val)     # the four boundary conditions
    A, b = np.array(rows), np.array(rhs)
    Q = np.zeros((nz, nz))
    Q[U:, U:] = 2 * h * np.eye(N)       # cost = sum of h u_k^2 = z^T Q z / 2
    K = np.block([[Q, A.T], [A, np.zeros((len(b), len(b)))]])
    z = np.linalg.solve(K, np.concatenate([np.zeros(nz), b]))[:nz]
    return nz, len(b), h * np.sum(z[U:] ** 2)

for N in [10, 40, 160]:
    nz, ne, J = transcribe_and_solve(N)
    print(f"N={N:3d}  unknowns={nz:3d}  equalities={ne:3d}  J={J:.5e}")
print(f"exact  J={12 * 10.0**2 / 100.0**3:.5e}")
# N= 10  unknowns= 32  equalities= 24  J=1.21212e-03
# N= 40  unknowns=122  equalities= 84  J=1.20075e-03
# N=160  unknowns=482  equalities=324  J=1.20005e-03
# exact  J=1.20000e-03
```

::: example Reading the docking results
**Step 1: count, for $N = 10$.** Positions and speeds at $11$ nodes each, plus $10$ controls (one per segment): $11+11+10 = 32$ unknowns. Two defects per segment, $2\times10 = 20$, plus $4$ boundary conditions: $24$ equalities. The printout agrees.

**Step 2: compare with the exact answer.** With $10$ segments the cost is $1.21212\times10^{-3}$, which is $1.01\,\%$ above the true $1.2\times10^{-3}$. With $40$ segments it is $0.0625\,\%$ high, and with $160$ segments $0.0042\,\%$ high.

**Step 3: read the trend.** Each time $N$ grows $4$ times, the error shrinks about $16$ times: $1.01/0.0625 = 16.2$ and $0.0625/0.00417 = 15.0$. Since $16 = 4^2$, the error falls like $h^2$.

**Sanity check.** The discrete answer is always a little *above* the exact one, never below. That makes sense: the exact $u(t)$ is the cheapest way to make the move, so any approximate plan should cost a bit more. Nobody told the solver about Hamiltonians or costates; it found the best move from the list of numbers alone.
:::

::: note Why it has to be true: the exact docking answer
This is a job for lesson two's machinery. $H = u^2 + \lambda_x v + \lambda_v u$. Then $\dot\lambda_x = 0$, so $\lambda_x$ is constant, and $\dot\lambda_v = -\lambda_x$, so $\lambda_v$ is a straight line in time. Setting $\partial H/\partial u = 2u + \lambda_v = 0$ gives $u = -\lambda_v/2$: also a straight line, $u = a + bt$. Integrating twice from rest, $v = at + bt^2/2$ and $x = at^2/2 + bt^3/6$. Arriving at rest needs $aT + bT^2/2 = 0$, so $b = -2a/T$. Arriving at $D$ needs $aT^2/2 - aT^2/3 = D$, so $a = 6D/T^2$. Then $J = \int_0^T a^2(1-2t/T)^2dt = a^2T/3 = 12D^2/T^3$.
:::

## Why a feasible point is close to a real trajectory

For a finite mesh, "every defect is zero" does not make the dots *exactly* a solution of the differential equation. It becomes exact as $N\to\infty$, and for finite $N$ it is accurate to a definite **order** — a power of $h$ that the next lessons pin down for the trapezoidal and Hermite-Simpson schemes.

What can be said in general now is this. Suppose the quadrature rule is **consistent**: it gives the exact answer when $\mathbf{f}$ is simple enough, for example constant across the segment. Then as the mesh is refined so every segment shrinks, the dots converge to a true solution of $\dot{\mathbf{x}}=\mathbf{f}$, and the discrete optimum converges to the continuous optimum. So for a fine enough mesh the two problems agree to within a tolerance you control by adding nodes — and "fine enough" is a question with a numerical answer.

::: example The simplest defect, shrinking on cue
Test the simplest defect, $d_k = x_{k+1}-x_k-h\,f(x_k)$, on $\dot x=-x$ with $x(0)=1$. The exact solution is $x(t) = e^{-t}$. Put the *exact* values at the nodes of an even mesh on $[0,1]$ and compute every defect. If the rule is good, they should be small.

**Step 1: the first entry by hand.** With $N=4$, $h=0.25$, the largest defect is the first one:

$$
d_0 = e^{-0.25} - 1 + 0.25 \times 1 = 0.77880 - 1 + 0.25 = 0.02880.
$$

**Step 2: refine.**

| $N$ | $h$ | $\max_k\lvert d_k\rvert$ | ratio to previous |
| --- | --- | --- | --- |
| $4$ | $0.25$ | $2.880\times10^{-2}$ | — |
| $8$ | $0.125$ | $7.497\times10^{-3}$ | $3.84$ |
| $16$ | $0.0625$ | $1.913\times10^{-3}$ | $3.92$ |
| $32$ | $0.03125$ | $4.832\times10^{-4}$ | $3.96$ |
| $64$ | $0.015625$ | $1.214\times10^{-4}$ | $3.98$ |

**Step 3: read it.** Halving $h$ shrinks the largest defect by a factor approaching $4 = 2^2$. So the exact solution misses this equation by an amount of order $h^2$ per segment — its **[[local truncation error|log-log]]**.

**Sanity check.** Where does $h^2$ come from? Over one step, $e^{-h} \approx 1 - h + h^2/2$, so $d_0 \approx h^2/2$: at $h=0.25$ that is $0.03125$, close to the true $0.02880$. The ratio creeps *up toward* $4$ without reaching it, because the higher-order terms the estimate drops still matter at coarse meshes. Keep that caution in mind when the next lessons claim [[much better orders|order-bridge]] for the schemes used in practice.
:::

::: warning A converged NLP solves the discretized problem, not necessarily the continuous one
"Converged" means the solver's stopping test passed on $\mathbf{z}$: every defect and boundary residual below tolerance, the KKT conditions of the *finite* program met. It does not say the mesh was fine enough to represent the true solution. A control that swings wildly within a single segment, a state that changes sharply where the mesh is coarse, or a cost that keeps moving as $N$ grows are all signs that the NLP converged, accurately, to the *wrong*, too-coarse problem. The only honest check is to re-solve on a finer mesh and see whether the answer moves — the question lesson eleven turns into a stopping rule.
:::

## Check yourself

::: check
A colleague says: "Direct transcription turns the problem into a nonlinear program, so it throws away the Hamiltonian and the costate for good." Is that right?
:::

::: answer
Not quite. It drops *deriving* the Hamiltonian and costate as a step you must do before solving: the NLP is built and solved without ever writing $H$ down. But those objects do not vanish. The NLP has its own Lagrange multipliers on the defect and boundary constraints, from the optimization module's finite-dimensional theory, and lesson ten shows exactly how they relate to the continuous costate. So the costate is recoverable *afterward*, as a check, instead of being *required beforehand*, as it is for shooting.
:::

::: check
Why does folding a Bolza cost into pure Mayer form (lesson one) matter more for direct transcription than for writing the problem on paper?
:::

::: answer
On paper, $\phi + \int L\,dt$ and an augmented $\tilde\phi$ are two ways of writing the same number, and nothing forces a choice. Inside a transcription, the running cost must be *computed* by some rule. If it is not folded into a state, it needs a separate quadrature scheme bolted on, with its own weights and its own accuracy questions, next to the scheme already built into the defects. Folded into a state, the objective is $\tilde\phi(\mathbf{x}_N)$, a plain function of the last node, added up by exactly the same defects as every other state. One scheme, nothing to keep consistent — a practical payoff for what looked like bookkeeping in lesson one.
:::

::: check
The descent transcription with $N=40$ has $165$ unknowns but only $125$ equality constraints. Does having more unknowns than equations make the NLP broken, and if not, what fills the gap?
:::

::: answer
It is not broken. An NLP is not a square system to be solved by elimination; it is an optimization. With $165$ unknowns and $125$ independent equalities, a $40$-dimensional family of dot-lists satisfies them all (before the thrust bounds trim it), and the cost chooses the best member of that family. Compare shooting on the same problem in lesson five: four unknowns, four equations, because shooting is root-finding, where the counts must match. A transcription is a bigger, differently shaped object, and "more unknowns than equalities" is the normal state of any NLP that leaves room for the cost to do its job. The docking example shows the same thing: $32$ unknowns, $24$ equalities, and a unique best answer.
:::

::: check
Two engineers transcribe the same orbit transfer, one with $N=20$ segments and one with $N=200$. Both report "converged, defects below $10^{-10}$". What does that establish, and what does it not?
:::

::: answer
It establishes that each solved *their own* discretized problem well: the dots satisfy their defect equations as written, and neither solve was sloppy. It does not establish that $N=20$ is fine enough. The defect residual measures self-consistency of the discrete solution, not closeness to the true continuous optimum. If the two reported flight times, costs or control histories differ by more than the application can accept, the coarse one converged precisely to an accurate answer for a transcription that was itself too coarse. Only comparing the two, or refining further until the answer stops moving, tells the difference.
:::

::: check
In the docking example, how many unknowns and equality constraints does $N=40$ give, and by what factor would you expect the cost error to shrink going from $N=40$ to $N=160$?
:::

::: answer
Positions and speeds at $41$ nodes each, plus $40$ controls: $41+41+40 = 122$ unknowns. Two defects per segment, $80$, plus $4$ boundary conditions: $84$ equalities. Both match the printout.

The error falls like $h^2$, and $N=160$ has a step $4$ times smaller, so expect the error to shrink about $4^2 = 16$ times. The printout gives $0.0625\,\%$ down to $0.0042\,\%$, a factor of $15$, close to $16$ as expected.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Direct vs indirect | Discretize-then-optimize versus optimize-then-discretize |
| Decision vector | $\mathbf{z}=(\mathbf{x}_0,\dots,\mathbf{x}_N,\mathbf{u}_0,\dots,\mathbf{u}_N,[t_f])$: finitely many numbers |
| Defect constraint | $\mathbf{d}_k(\mathbf{x}_k,\mathbf{x}_{k+1},\mathbf{u}_k,\mathbf{u}_{k+1})=\mathbf{0}$: state change equals a quadrature of $\mathbf{f}$ |
| The NLP | $\min\tilde\phi(\mathbf{z})$ subject to defects, boundary conditions and path bounds |
| Convexity | Not assumed; as nonconvex as the dynamics |
| Descent NLP, $N=40$ | $165$ unknowns, $125$ equalities, $82$ bounds |
| Docking NLP | $N=10$: $32$ unknowns, $24$ equalities, $J = 1.21212\times10^{-3}$ versus exact $1.2\times10^{-3}\,\mathrm{m^2/s^3}$; error falls like $h^2$ |
| Simplest defect | Exact solution misses it by about $h^2/2$ per segment; halving $h$ divides the defect by nearly $4$ |
| Converged is not accurate | A tight KKT residual certifies the discrete problem was solved, not that the mesh was fine enough |

The next lesson compares two ways of building the finite problem that keep the flavor of shooting — direct single and multiple shooting — and shows why their conditioning differs so much. Lesson eight then builds the trapezoidal and Hermite-Simpson defects that most people mean by "direct collocation".

::: context infinite-dimensional What "infinite-dimensional" means
A point on a map needs two numbers; its space is two-dimensional. A list of $165$ numbers lives in a $165$-dimensional space. A whole function $x(t)$ on an interval needs a number for every instant, and there are infinitely many instants, so the set of all possible trajectories is infinite-dimensional. Optimizing over it exactly is what the calculus of variations does on paper. A computer must first cut it down to a finite list.
:::

::: context nlp-word Why it is called a "program"
In the 1940s the word "program" meant a plan or schedule, as in a military logistics program. George Dantzig and his colleagues called their method for finding the best plan "linear programming", and the name stuck to the whole family: linear, quadratic, nonlinear programming. It has nothing to do with writing computer code, though today you solve these programs with code.
:::

::: context mesh Dots on a curve
The mesh is the set of times where the transcription keeps values. Between the dots, the defects make sure neighbors agree with the dynamics.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,100 C100,90 140,30 200,40 C260,50 290,80 320,60" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="40" cy="100" r="4.5"/><circle cx="80" cy="86" r="4.5"/><circle cx="120" cy="62.5" r="4.5"/>
    <circle cx="160" cy="43.1" r="4.5"/><circle cx="200" cy="40" r="4.5"/><circle cx="240" cy="50.2" r="4.5"/>
    <circle cx="280" cy="63.9" r="4.5"/><circle cx="320" cy="60" r="4.5"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="115" x2="40" y2="125"/><line x1="80" y1="115" x2="80" y2="125"/><line x1="120" y1="115" x2="120" y2="125"/>
    <line x1="160" y1="115" x2="160" y2="125"/><line x1="200" y1="115" x2="200" y2="125"/><line x1="240" y1="115" x2="240" y2="125"/>
    <line x1="280" y1="115" x2="280" y2="125"/><line x1="320" y1="115" x2="320" y2="125"/>
  </g>
  <text x="40" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">t0</text>
  <text x="320" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">tN</text>
  <line x1="200" y1="132" x2="240" y2="132" stroke="#b4232c" stroke-width="2"/>
  <text x="220" y="146" font-size="11" text-anchor="middle" fill="#b4232c">h</text>
  <text x="250" y="30" font-size="11" fill="#1d6fd1">x_k at each node</text>
</svg>
```

The pale curve is the true trajectory; the optimizer only ever sees the dark dots.
:::

::: context defect Why "defect"
A defect is a flaw — here, a gap. Start at $\mathbf{x}_k$, follow what the dynamics say for one step, and you predict a place to land. The next dot $\mathbf{x}_{k+1}$ may sit somewhere else. The gap between the two is the defect. Early in a solve the gaps are large; the optimizer is allowed to violate the physics while it searches, and it closes every gap by the end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="110" r="6" fill="#1d6fd1"/>
  <text x="70" y="136" font-size="12" text-anchor="middle" fill="#1d6fd1">x_k</text>
  <line x1="70" y1="110" x2="272" y2="60" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="280" cy="58" r="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">predicted by f</text>
  <circle cx="280" cy="115" r="6" fill="#1d6fd1"/>
  <text x="298" y="119" font-size="12" fill="#1d6fd1">x_k+1</text>
  <line x1="280" y1="66" x2="280" y2="107" stroke="#b4232c" stroke-width="2.5"/>
  <text x="290" y="92" font-size="12" fill="#b4232c">defect d_k</text>
</svg>
```
:::

::: context kkt KKT points
The **Karush-Kuhn-Tucker** conditions are the constrained version of "the slope is zero at a minimum". William Karush wrote them down in a 1939 master's thesis; Harold Kuhn and Albert Tucker published them in 1951. A point that satisfies them is a candidate minimum, not a guaranteed one. On a nonconvex problem there can be many KKT points, which is why the starting guess still matters for direct methods, just much less than for shooting.
:::

::: context log-log The defect table on a log-log plot
On logarithmic axes, a power law $d \propto h^2$ becomes a straight line with slope $2$: each doubling of $h$ (one step right) multiplies the defect by about $4$ (one fixed step up). The five points of the lesson's table, to scale:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="15" x2="40" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="175" x2="330" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="60,165.1 120,130.5 180,96.1 240,61.8 300,28.1" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="60" cy="165.1" r="4.5"/><circle cx="120" cy="130.5" r="4.5"/><circle cx="180" cy="96.1" r="4.5"/>
    <circle cx="240" cy="61.8" r="4.5"/><circle cx="300" cy="28.1" r="4.5"/>
  </g>
  <text x="34" y="58" font-size="11" text-anchor="end" fill="#1f2a44">1e-2</text>
  <text x="34" y="116" font-size="11" text-anchor="end" fill="#1f2a44">1e-3</text>
  <text x="34" y="173" font-size="11" text-anchor="end" fill="#1f2a44">1e-4</text>
  <text x="60" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">1/64</text>
  <text x="180" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">1/16</text>
  <text x="300" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">1/4</text>
  <text x="325" y="170" font-size="11" text-anchor="end" fill="#1f2a44">step h</text>
  <text x="200" y="130" font-size="12" fill="#1d6fd1">slope 2</text>
</svg>
```

The exercise for this module asks you to make this plot for the trapezoidal and Hermite-Simpson defects, where the slopes come out $3$ and $5$.
:::

::: context order-bridge What comes next for the defect
Lesson eight replaces "rate at the start times the step" with better recipes: the trapezoid rule, which averages the rates at both ends, and Hermite-Simpson, which also uses a midpoint. Better recipes shrink the defect much faster as $h$ shrinks, so far fewer nodes reach the same accuracy — the main reason the crude rule in this lesson is used only for teaching.
:::
