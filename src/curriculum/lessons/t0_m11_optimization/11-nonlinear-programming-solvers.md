---
id: l11-nonlinear-programming-solvers
title: "Nonlinear programming solvers: IPOPT and SNOPT"
minutes: 22
covers:
  - nonlinear programming solvers (IPOPT, SNOPT)
---

Most drivers never build an engine. They pick a car that suits the trip, put in the right fuel, and learn which warning lights mean "pull over". Knowing the machine that well is a real skill, even though you did not build it.

Nonlinear programming is the same. You will almost never write an SQP or interior-point code for real use; you will call one. Two codes dominate aerospace trajectory work: **IPOPT** and **SNOPT**. Between them they sit behind most optimal trajectories published in the last twenty years — launch ascent profiles, low-thrust interplanetary transfers, entry guidance references, and the nominal descents that an onboard convex solver is later asked to track.

Both solve the general nonlinear program (NLP). IPOPT is lesson 9's interior-point method with a filter line search. SNOPT is lesson 10's SQP, with an active set and a limited-memory quasi-Newton Hessian. Their different behavior follows straight from that difference.

The other half of this lesson is what goes *into* a solver — the fuel. When a trajectory optimization will not converge, the cause is usually not the solver but a wrong derivative, a badly scaled variable, or a discretization that made the problem harder than the physics needed.

## What a general NLP solver asks for

Both codes take the problem in nearly the same shape:

$$
\text{minimize } f(\mathbf{x}) \quad \text{subject to} \quad \mathbf{g}_L \le \mathbf{g}(\mathbf{x}) \le \mathbf{g}_U, \qquad \mathbf{x}_L \le \mathbf{x} \le \mathbf{x}_U .
$$

Here $\mathbf{x} \in \mathbb{R}^n$ holds the $n$ unknowns and $\mathbf{g}: \mathbb{R}^n \to \mathbb{R}^m$ the $m$ constraint functions; $L$ and $U$ mark lower and upper bounds. An equality is the case $g_{L,i} = g_{U,i}$ — floor and ceiling the same. A one-sided constraint uses an infinite bound.

What you must hand over:

1. **Function values**: $f(\mathbf{x})$ and $\mathbf{g}(\mathbf{x})$.
2. **First derivatives**: the gradient $\nabla f$ and the Jacobian $\nabla\mathbf{g}$. The Jacobian goes in **sparse** form — a list of the row and column positions that can *ever* be nonzero, fixed once at the start, plus their values at each iterate.
3. **Second derivatives**, optionally: the sparsity pattern and values of $\nabla^2_{\mathbf{xx}}\mathcal{L}$. IPOPT uses an exact Hessian if you give it one, and falls back to limited-memory BFGS otherwise. SNOPT never asks for one; it always builds a quasi-Newton approximation.
4. **A starting guess** $\mathbf{x}_0$. For SNOPT you may also pass a starting active set, or **basis**, which is what makes its warm starts so effective.
5. **Scaling**, unstated but assumed: both codes expect that a change of one unit in any variable or constraint matters about as much as in any other. It is your job to make that true.

The sparsity pattern is not paperwork. A trajectory NLP's **[[Jacobian is more than 98 % zeros|sparsity-picture]]**, and the whole method stays tractable only by never storing or factorizing those zeros.

::: example Sizing a direct-collocation ascent problem
Turn a three-degree-of-freedom ascent into an NLP by **[[direct collocation|collocation-word]]**: chop the flight into $N = 100$ intervals, and at each of the $101$ nodes make the state (position, velocity, mass — seven numbers) and the control (a thrust direction — three numbers) unknowns. The final time is one more. So

$$
n = 101 \times 7 + 101 \times 3 + 1 = 1011 \text{ variables}.
$$

**Constraints.** The dynamics become **defect constraints**: on each interval, the gap between the integrated state and the next node's state must be zero. With the trapezoidal rule that is $7$ equations per interval, $700$ in all. Add a unit-length rule for the thrust direction at each node ($101$), a dynamic-pressure limit (a cap on aerodynamic load) at each node ($101$), and $13$ boundary conditions:

$$
m = 700 + 101 + 101 + 13 = 915 \text{ constraints}.
$$

**Dense count.** Stored in full, the Jacobian would have $915 \times 1011 = 925{,}065$ entries.

**Sparse count.** A defect row for interval $k$ touches only the states and controls at nodes $k$ and $k+1$, plus the final time: at most $2 \times (7 + 3) + 1 = 21$ nonzeros. A unit-length row touches $3$ variables, a dynamic-pressure row $7$, a boundary row $1$. Adding up,

$$
700 \times 21 + 101 \times 3 + 101 \times 7 + 13 = 15{,}723 \text{ nonzeros},
$$

a density of $15{,}723 / 925{,}065 = 1.70\,\%$.

**What it buys.** The KKT matrix the solver factorizes each iteration has size $M = n + m = 1926$. Factorizing it densely costs about $M^3/3 = 2.4 \times 10^9$ operations. Ordered by time node, it is **banded** — nonzeros only near the diagonal — with a half-bandwidth $b$ of about $27$, and a banded factorization costs about $M b^2 = 1.4 \times 10^6$. That is a factor of about $1{,}700$.

**Sanity check.** A factor of $1{,}700$ turns a one-minute solve into more than a day, which is why the sparsity pattern is an input, not something the solver discovers.
:::

## IPOPT

**IPOPT** (Interior Point OPTimizer) is lesson 9's algorithm stretched to cover nonconvex problems. It is **[[open source|ipopt-snopt-history]]**, which is a big reason it is everywhere.

- **Barrier on the bounds.** Every bound such as $x_i \ge x_{L,i}$ is replaced by a **[[logarithmic barrier|barrier-picture]]** term with weight $\mu$ ("mu"). It is a wall rising to infinity at the bound, so iterates stay strictly inside. IPOPT drives $\mu$ toward zero adaptively, not on a fixed schedule.
- **Newton on the perturbed KKT system.** Each iteration solves one symmetric indefinite linear system with a sparse $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization — Gaussian elimination for a symmetric matrix, with $\mathbf{L}$ lower-triangular and $\mathbf{D}$ block-diagonal — from an outside library (MA27, MA57, HSL MA97, MUMPS or Pardiso, depending on the build).
- **Inertia correction.** The **[[inertia|inertia-word]]** of a matrix is its count of positive, negative and zero eigenvalues. For the step to point downhill, the KKT matrix must have exactly $n$ positive and $m$ negative eigenvalues. When the factorization reports anything else — the Lagrangian Hessian is not positive enough on the directions the constraints allow — IPOPT adds $\delta\mathbf{I}$ ("delta" times the identity) to the Hessian block and factorizes again, raising $\delta$ until the count is right. This is lesson 10's $\mathbf{W} + \sigma\mathbf{I}$ fix, done automatically and reported in the log.
- **Filter line search.** A step is accepted if it improves the objective or the constraint violation against every filter entry — no penalty weight to tune.
- **Restoration phase.** When the line search finds no acceptable step, IPOPT sets the objective aside, minimizes the constraint violation alone for a while, then resumes. "Restoration" again and again in a log usually means bad scaling or an infeasible formulation, not a solver bug.
- **Hessian:** exact if you supply it, limited-memory BFGS otherwise.

IPOPT is at its best with many **degrees of freedom** — many more variables than active constraints, the usual shape of a finely discretized trajectory. Its cost per iteration is one sparse factorization, so it scales to hundreds of thousands of variables.

## SNOPT

**SNOPT** (Sparse Nonlinear OPTimizer) is lesson 10's active-set SQP, engineered for sparse problems. It is commercial software from Stanford — a real factor when choosing a toolchain.

- **Sparse SQP.** Each **major iteration** solves a sparse QP with linearized constraints; each **minor iteration** inside it adds or drops one active constraint.
- **Limited-memory quasi-Newton.** SNOPT never forms a second derivative. It keeps a limited-memory BFGS approximation built from roughly the last ten to twenty steps, with Powell damping to keep it positive definite.
- **Augmented-Lagrangian merit function** for the line search, rather than a filter.
- **Elastic mode.** When a QP's linearized constraints contradict each other, SNOPT relaxes them with penalized elastic variables so a step always exists, and the penalty's size says how infeasible the linearization was. It keeps going where a plain SQP would stop.
- **Warm starts.** Hand it the previous solution's active set, and a re-solve of a slightly changed problem finishes in a handful of major iterations.

SNOPT suits **few degrees of freedom** — many constraints, nearly all active, so the active-set search has little to explore — and expensive function evaluations, because it needs comparatively few. Its natural home is a shooting-style transcription with modest numbers of unknowns, not a hundred-thousand-variable collocation mesh.

::: key Choosing between them
IPOPT: interior point, filter line search, exact or limited-memory Hessian, sparse indefinite factorization per iteration, open source. Best with many degrees of freedom and a fine mesh. SNOPT: active-set SQP, limited-memory quasi-Newton, elastic mode, excellent warm starts, commercial. Best with few degrees of freedom, expensive function evaluations, and repeated solves of a slowly changing problem. Neither returns a certificate of global optimality; both find a point satisfying the first-order conditions, if they converge at all.
:::

A quick rule: count the degrees of freedom at the answer, variables minus active constraints. Many favors IPOPT; few favors SNOPT.

## Derivatives are the whole game

Both codes converge only as well as their derivatives allow, and a wrong derivative looks exactly like a hard problem. There are four ways to get them.

**Hand-coded analytic derivatives** are the fastest to run and the easiest to get wrong. Always check them against finite differences before trusting a single run.

**Finite differences** are the fallback: nudge $x$ by a small step $h$ and see how much $f$ moves. They have an unbeatable accuracy floor. A **forward difference** $\big(f(x+h) - f(x)\big)/h$ has a truncation error that shrinks like $h$, written $O(h)$ ("order $h$"). But it also has a **[[round-off|roundoff-picture]]** error of order $\epsilon_{\text{mach}}/h$, where $\epsilon_{\text{mach}} \approx 2.2 \times 10^{-16}$ ("machine epsilon") is the smallest relative gap between two double-precision numbers. Shrinking $h$ cuts the first error and grows the second. They balance at $h \approx \sqrt{\epsilon_{\text{mach}}} \approx 1.5 \times 10^{-8}$, for a best relative error of about $10^{-8}$.

A **central difference** $\big(f(x+h) - f(x-h)\big)/(2h)$ has truncation error $O(h^2)$. Balanced against the same round-off, the best step is $h \approx \epsilon_{\text{mach}}^{1/3} \approx 6 \times 10^{-6}$, for a best case near $10^{-11}$. Here is the trade, measured:

```python
from cmath import exp as cexp, sin as csin
from math import exp, sin, cos

f = lambda x: exp(sin(x))
x0, exact = 1.5, exp(sin(1.5)) * cos(1.5)

for k in (2, 4, 6, 8, 10, 12):
    h = 10.0**-k
    fwd = (f(x0 + h) - f(x0)) / h
    ctr = (f(x0 + h) - f(x0 - h)) / (2 * h)
    print(f"h=1e-{k:<2d}  forward {abs(fwd - exact):.1e}   central {abs(ctr - exact):.1e}")

cs = cexp(csin(complex(x0, 1e-20))).imag / 1e-20
print(f"complex step   error {abs(cs - exact):.1e}")

# h=1e-2   forward 1.3e-02   central 1.3e-05
# h=1e-4   forward 1.3e-04   central 1.3e-09
# h=1e-6   forward 1.3e-06   central 3.1e-11
# h=1e-8   forward 5.0e-08   central 5.7e-09
# h=1e-10  forward 4.5e-07   central 1.8e-06
# h=1e-12  forward 4.4e-05   central 4.4e-05
# complex step   error 0.0e+00
```

Read the errors as a U: smaller $h$ helps until round-off takes over, then it gets worse fast. The forward difference bottoms out at $5 \times 10^{-8}$ near $h = 10^{-8}$. The central difference reaches $3 \times 10^{-11}$ near $10^{-6}$. Below $10^{-10}$ both are garbage.

**The [[complex-step derivative|complex-step-history]]** uses $f'(x) \approx \operatorname{Im} f(x + ih)/h$: evaluate $f$ at a complex number with a tiny imaginary part $h$, and read the derivative off the imaginary part of the answer. There is no subtraction of nearly equal numbers, so there is no round-off cancellation at all. With $h = 10^{-20}$ it matches the analytic derivative to the last bit, as the code's last line shows. It costs one complex evaluation per variable, and the code must be analytic: no absolute values, no comparisons on the real part, no transposes written as conjugate transposes. When it applies, it is the cheapest way to check a hand-coded Jacobian.

**Algorithmic differentiation** is what production trajectory work uses. A tool such as CasADi, ADOL-C or JAX builds derivative code from the function's own chain of operations, exact to machine precision. Its **[[reverse mode|reverse-mode-word]]** computes a full gradient for about three function evaluations, whatever $n$ is. For the $1011$-variable ascent, a dense forward-difference gradient costs $1011$ extra evaluations per iteration. At $1\,\mathrm{ms}$ each, that is $1.0\,\mathrm{s}$ per iteration, about $100\,\mathrm{s}$ over a hundred iterations — against roughly $0.3\,\mathrm{s}$ for algorithmic differentiation.

A middle road is sparse finite differencing with **[[graph coloring|colouring-note]]**: variables that never share a constraint row are nudged together, so the ascent Jacobian costs $21$ evaluations instead of $1011$ — about $48$ times fewer.

::: example Handing a landing problem to IPOPT
Lesson 10's vertical landing — $1000\,\mathrm{m}$ up at $-50\,\mathrm{m/s}$, thrust acceleration $0$ to $30\,\mathrm{m/s^2}$, free final time — goes to IPOPT through CasADi, the usual route in GNC work. It needs `pip install casadi`, which bundles IPOPT; the output is from CasADi 3.8.1.

```python
import casadi as ca

g0, h0, v0, a_max = 9.80665, 1000.0, -50.0, 30.0

def landing(N):
    X = ca.MX.sym("X", 2, N + 1)      # height h and velocity v at each node
    a = ca.MX.sym("a", N)             # thrust acceleration on each interval
    tf = ca.MX.sym("tf")              # the final time is an unknown too
    dt = tf / N

    g = []                            # trapezoidal defects: all must be zero
    for k in range(N):
        f_k = ca.vertcat(X[1, k], a[k] - g0)
        f_k1 = ca.vertcat(X[1, k + 1], a[k] - g0)
        g.append(X[:, k + 1] - X[:, k] - 0.5 * dt * (f_k + f_k1))
    g.append(X[:, 0] - ca.DM([h0, v0]))    # start where we are
    g.append(X[:, N])                      # land: h = 0 and v = 0

    nlp = {"x": ca.vertcat(ca.vec(X), a, tf), "f": ca.sum1(a) * dt,
           "g": ca.vertcat(*g)}
    opts = {"ipopt.tol": 1e-10, "ipopt.max_iter": 500, "ipopt.sb": "yes",
            "ipopt.print_level": 0, "print_time": False}
    solver = ca.nlpsol("s", "ipopt", nlp, opts)

    inf = ca.inf
    lbx = [0.0, -inf] * (N + 1) + [0.0] * N + [1.0]     # h >= 0, a >= 0, tf >= 1 s
    ubx = [inf, inf] * (N + 1) + [a_max] * N + [60.0]
    guess = [h0, v0] * (N + 1) + [g0] * N + [20.0]
    sol = solver(x0=guess, lbx=lbx, ubx=ubx, lbg=0, ubg=0)
    return float(sol["f"]), float(sol["x"][-1]), solver.stats()["iter_count"]

for N in (2, 10, 100):
    J, tf, it = landing(N)
    print(f"N={N:<4d} impulse {J:.2f} m/s   tf {tf:.3f} s   {it} iterations")

# N=2    impulse 186.78 m/s   tf 13.948 s   11 iterations
# N=10   impulse 181.80 m/s   tf 13.439 s   21 iterations
# N=100  impulse 181.25 m/s   tf 13.384 s   33 iterations
```

**Check against lesson 10.** With $N = 2$, IPOPT lands on $186.78\,\mathrm{m/s}$ and $13.948\,\mathrm{s}$ — the same answer our hand-built SQP found. The trapezoidal rule is exact here, because the thrust is constant on each interval and the velocity changes linearly.

**Watch the discretization error shrink.** $N = 10$ gives $181.80\,\mathrm{m/s}$; $N = 100$ gives $181.25\,\mathrm{m/s}$ and $t_f = 13.384\,\mathrm{s}$ — lesson 5's continuous answer to every printed digit. The iteration count grows with size, but slowly.

Three things are worth noticing:

- The dynamics are written once, symbolically. CasADi produces exact sparse first and second derivatives from that expression. You never write a Jacobian.
- The sparsity pattern is found from the expression graph, not declared by hand.
- You must choose `max_iter`. The solver has no idea how long it will take — the honest admission at the center of this lesson.
:::

## Why neither of these flies

Everything above is design-time software, for reasons built into the algorithms, not tuning.

- **No iteration bound.** The methods converge locally, and the iteration count depends on the data and the starting guess. A code that takes $30$ iterations on the nominal case and $400$ on a dispersed one cannot be given a $100\,\mathrm{ms}$ budget.
- **[[Dynamic memory|flight-memory-rules]].** A sparse factorization with numerical pivoting decides its fill-in — the extra nonzeros created while factorizing — at run time. So the memory a solve needs is not known before it runs. Flight software generally forbids allocating memory after start-up.
- **No certificate.** As lesson 10 stressed, a converged NLP satisfies the first-order conditions to a tolerance. That is not a proof of optimality. And an "infeasible" report from a nonconvex solver is a statement about the solver's search, not about the problem.
- **Dependence on the starting guess.** Certification needs reproducible answers across flights and dispersion cases, which is much harder when the answer depends on where the search started.
- **Verification burden.** IPOPT pulls in a third-party sparse linear algebra library of tens of thousands of lines. Qualifying that to flight standards is a project in itself, and SNOPT's license terms make source-level qualification a commercial negotiation.

IPOPT and SNOPT are for the work before flight: reference trajectories for a controller to track; vehicle sizing by re-solving the ascent over a design sweep; and — most important here — measuring how much a convex formulation gives away. Solve the honest nonconvex landing with IPOPT on the ground, solve lesson 6's convexified version, compare the propellant, and you have the number that justifies flying the convex one.

::: warning "The solver failed" is usually not the solver
When an NLP will not converge, suspect derivatives first, scaling second, formulation third, solver last. Check the Jacobian against a central difference at a few iterates. Then look at the variable sizes. A problem carrying positions in meters ($10^6$), velocities in meters per second ($10^3$), a mass in kilograms ($10^4$) and a quaternion component ($10^0$) has Jacobian entries spanning twelve orders of magnitude, and both codes will struggle — **[[non-dimensionalise|scaling-units]]**, or set scale factors. Then ask whether the formulation is feasible, and whether the mesh is too coarse: a defect constraint that cannot be met on your mesh looks exactly like an infeasible problem. Only then try another solver. Most "IPOPT cannot solve my trajectory" reports are one of the first two.
:::

## Check yourself

::: check
A collocation problem has $2{,}000$ variables and $1{,}800$ constraints, of which $1{,}790$ are active at the solution. Which of the two solvers would you reach for, and why?
:::

::: answer
SNOPT. The degrees of freedom at the solution — variables minus active constraints — are $2000 - 1790 = 210$, which is small. An active-set method's cost is mostly the search over active sets, and a nearly fully constrained problem leaves little to search; each QP is close to one equality-constrained solve. An interior-point method pays for every constraint through its barrier, active or not, and gains nothing from almost all being active.

The picture reverses for a fine mesh with thousands of free controls and only the dynamics binding; there IPOPT's fixed cost per iteration wins.
:::

::: check
You must supply a Jacobian for a constraint function you did not write and cannot differentiate by hand. What sequence of options would you try, and what accuracy would you expect from each?
:::

::: answer
1. **Algorithmic differentiation**, if the function can be rewritten in a framework such as CasADi or JAX. Exact to machine precision; reverse mode costs about three function evaluations per gradient, whatever the dimension.
2. **Complex step**, if the code is analytic and can run on complex inputs. Also exact, at one complex evaluation per variable — the ideal way to check an existing Jacobian.
3. **Sparse finite differences with coloring.** About $10^{-8}$ relative accuracy for forward differences and $10^{-11}$ for central, at one evaluation per color (per color and direction for central) — $21$ rather than $1011$ in the ascent example.
4. **Dense finite differences.** Same accuracy, one evaluation per variable.

The accuracy floor matters: a solver asked for a KKT tolerance of $10^{-10}$ with forward-difference derivatives is asked for something they cannot support, and it will stall.
:::

::: check
An IPOPT log shows the regularization $\delta$ rising through $10^{-4}$, $10^{-2}$, $1$, $100$ over successive iterations, and the algorithm entering restoration twice. What is happening?
:::

::: answer
The inertia of the KKT matrix keeps coming out wrong, so IPOPT adds larger and larger multiples of the identity to the Hessian block to force it right. That means the Lagrangian Hessian is strongly indefinite on the directions the active constraints allow: the model has downhill-curving directions the constraints do not remove.

As $\delta$ grows, the step shrinks toward a short steepest-descent step; progress stalls, the filter rejects it, and restoration takes over to chase feasibility alone.

Common causes, in order: the supplied Hessian is wrong (check it); the problem is badly scaled, which manufactures artificial curvature; the mesh is too coarse, so the defect constraints are nearly inconsistent; or the formulation really is nastily nonconvex there. In the last case the practical fix is a better starting guess, or a homotopy — solving a sequence of problems that morph from an easy one into the real one.
:::

::: check
Estimate the arithmetic per iteration of the ascent NLP above if the solver ignored sparsity, and say what that implies about supplying the sparsity pattern correctly.
:::

::: answer
The KKT matrix has size $M = n + m = 1011 + 915 = 1926$. A dense symmetric indefinite factorization costs about $M^3/3 = 2.4 \times 10^9$ operations, against about $M b^2 = 1926 \times 27^2 \approx 1.4 \times 10^6$ for the banded structure — a factor of about $1{,}700$. Storage tells the same story: $1926^2$ doubles at $8$ bytes each is about $30\,\mathrm{MB}$, against $15{,}723$ Jacobian nonzeros, a few hundred kilobytes.

For the pattern: declaring *extra* entries is not free, because every spurious nonzero can widen the band and add fill-in. Declaring *too few* is a correctness bug: the solver never asks about entries you left out, so its derivatives are silently wrong. Both mistakes are common; the second is much worse. The standard catch is a dense finite-difference check of the whole Jacobian on a small instance of the problem.
:::

::: check
Why can a nonlinear programming solver not return lesson 7's infeasibility certificate?
:::

::: answer
Lesson 7's certificate is a dual object whose existence proves that no feasible point exists. It rests on strong duality, which holds for convex problems that satisfy a constraint qualification. For a nonconvex problem the dual generally has a gap, so a dual point proves only a bound, and the bound may be far from tight.

An NLP solver can only report that *its* attempt to reduce the violation got stuck at a locally smallest infeasibility: IPOPT's restoration converging to a nonzero violation, or SNOPT's elastic mode ending with elastic variables still positive. Both describe a local search; a different start may find a feasible trajectory.

That asymmetry — "feasible" is proved by showing a point, "infeasible" is not — is one more reason flight guidance is formulated convexly, where both directions come with proofs.
:::

## Summary

| Idea | In one line |
| --- | --- |
| NLP form | minimize $f(\mathbf{x})$ s.t. $\mathbf{g}_L \le \mathbf{g}(\mathbf{x}) \le \mathbf{g}_U$, $\mathbf{x}_L \le \mathbf{x} \le \mathbf{x}_U$ |
| Solver inputs | Values, sparse first derivatives, optional sparse Hessian, starting guess, scaling |
| IPOPT | Interior point, barrier $\mu$, filter, inertia correction $\delta\mathbf{I}$, restoration, exact or L-BFGS Hessian, open source |
| SNOPT | Active-set sparse SQP, L-BFGS, augmented-Lagrangian merit, elastic mode, warm starts, commercial |
| Choosing | Many degrees of freedom $\to$ IPOPT; few, costly evaluations, repeated solves $\to$ SNOPT |
| Collocation sizing | $N = 100$, $7$ states, $3$ controls: $1011$ variables, $915$ constraints, $15{,}723$ nonzeros, $1.70\,\%$ dense |
| Sparsity payoff | KKT size $1926$: dense $2.4 \times 10^9$ operations, banded ($b \approx 27$) $1.4 \times 10^6$ — about $1{,}700$ times less |
| Finite differences | Forward: $h \approx \sqrt{\epsilon} \approx 1.5 \times 10^{-8}$, floor $\approx 5 \times 10^{-8}$. Central: $h \approx \epsilon^{1/3} \approx 6 \times 10^{-6}$, floor $\approx 3 \times 10^{-11}$ |
| Complex step | $f'(x) \approx \operatorname{Im}f(x+ih)/h$; exact at $h = 10^{-20}$; needs analytic code |
| Algorithmic differentiation | Exact; reverse-mode gradient for about $3$ evaluations |
| Coloring | At least the most nonzeros in a row, at most $2b+1$; $21$ evaluations instead of $1011$ here |
| IPOPT on the landing | $N = 2$: $186.78\,\mathrm{m/s}$ (matches lesson 10); $N = 100$: $181.25\,\mathrm{m/s}$, $13.384\,\mathrm{s}$ (matches lesson 5) |
| Why they do not fly | No iteration bound, dynamic memory, no certificate, start dependence, verification burden |
| What they are for | Reference trajectories, design sweeps, pricing a convex formulation |

The next lesson returns to the convex world and the software you would put in a guidance loop: a modeling language that turns a written problem into cone data, and the solvers that consume it.

::: context sparsity-picture What a collocation Jacobian looks like
Each defect constraint links one interval's two end nodes, plus the final time, which stretches every interval. So the nonzeros form a staircase of blocks down the diagonal and one full column at the right. Here is the pattern for four intervals. With $100$ intervals the blue blocks are the same size and the white space is enormous — that white space is the $98\,\%$ the solver never touches.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="80" y="34" width="236" height="96" fill="white" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="81" y="35" width="42" height="22" fill="#1d6fd1"/>
  <rect x="125" y="35" width="42" height="22" fill="#1d6fd1"/>
  <rect x="303" y="35" width="10" height="22" fill="#1d6fd1"/>
  <text x="74" y="50" font-size="11" fill="#1f2a44" text-anchor="end">interval 1</text>
  <rect x="125" y="59" width="42" height="22" fill="#1d6fd1"/>
  <rect x="169" y="59" width="42" height="22" fill="#1d6fd1"/>
  <rect x="303" y="59" width="10" height="22" fill="#1d6fd1"/>
  <text x="74" y="74" font-size="11" fill="#1f2a44" text-anchor="end">interval 2</text>
  <rect x="169" y="83" width="42" height="22" fill="#1d6fd1"/>
  <rect x="213" y="83" width="42" height="22" fill="#1d6fd1"/>
  <rect x="303" y="83" width="10" height="22" fill="#1d6fd1"/>
  <text x="74" y="98" font-size="11" fill="#1f2a44" text-anchor="end">interval 3</text>
  <rect x="213" y="107" width="42" height="22" fill="#1d6fd1"/>
  <rect x="257" y="107" width="42" height="22" fill="#1d6fd1"/>
  <rect x="303" y="107" width="10" height="22" fill="#1d6fd1"/>
  <text x="74" y="122" font-size="11" fill="#1f2a44" text-anchor="end">interval 4</text>
  <text x="102" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">node 0</text>
  <text x="146" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">node 1</text>
  <line x1="124" y1="34" x2="124" y2="130" stroke="#6c7a93" stroke-width="0.8"/>
  <text x="190" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">node 2</text>
  <line x1="168" y1="34" x2="168" y2="130" stroke="#6c7a93" stroke-width="0.8"/>
  <text x="234" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">node 3</text>
  <line x1="212" y1="34" x2="212" y2="130" stroke="#6c7a93" stroke-width="0.8"/>
  <text x="278" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">node 4</text>
  <line x1="256" y1="34" x2="256" y2="130" stroke="#6c7a93" stroke-width="0.8"/>
  <line x1="300" y1="34" x2="300" y2="130" stroke="#6c7a93" stroke-width="0.8"/>
  <text x="308" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">tf</text>
  <text x="180" y="152" font-size="11" fill="#1f2a44" text-anchor="middle">blue: entries that can be nonzero; white: always zero</text>
  <text x="180" y="168" font-size="11" fill="#6c7a93" text-anchor="middle">rows: defect constraints; columns: variables</text>
</svg>
```
:::

::: context collocation-word Turning a flight into a list of numbers
A trajectory is a smooth curve in time, but a solver can only handle a finite list of unknowns. **Direct collocation** picks moments in time — the nodes — and makes the state and control at each one an unknown. The physics becomes a set of equations tying each node to the next: integrate the dynamics across the interval, and the result must match the next node. "Collocation" means "placing together": the dynamics are enforced at chosen points. The trajectory modules later in the course build collocation problems like this one at full size.
:::

::: context ipopt-snopt-history Who built them
IPOPT was written by Andreas Wächter and Lorenz Biegler at Carnegie Mellon; their 2006 paper describing its filter line-search interior-point method is one of the most cited in optimization. It is maintained by the COIN-OR open-source project under the Eclipse Public License. SNOPT comes from Philip Gill (UC San Diego) and Walter Murray and Michael Saunders (Stanford), who described it in 2002. Trajectory tools such as GPOPS-II and many university codes let you plug in either one.
:::

::: context barrier-picture A wall that softens
To keep $x \ge 0$ while minimizing the cost $x$, add $-\mu \ln x$. The logarithm runs to infinity at $x = 0$, so the minimum always sits strictly inside. The minimum of $x - \mu\ln x$ is where its slope $1 - \mu/x$ is zero, at $x = \mu$. As $\mu$ shrinks, the wall hugs the bound and the minimum slides toward the true answer, $x = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="15" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="40" y1="180" x2="340" y2="60" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline points="42.0,22.7 47.0,70.9 52.0,90.4 57.0,102.4 62.0,110.7 67.0,116.9 72.1,121.7 77.1,125.5 82.1,128.5 87.1,131.0 92.1,133.1 97.1,134.7 102.1,136.1 107.1,137.2 112.1,138.1 117.1,138.8 122.1,139.3 127.1,139.6 132.2,139.9 137.2,140.0 142.2,140.0 147.2,139.9 152.2,139.7 157.2,139.5 162.2,139.1 167.2,138.7 172.2,138.3 177.2,137.8 182.2,137.2 187.2,136.6 192.3,135.9 197.3,135.2 202.3,134.5 207.3,133.7 212.3,132.8 217.3,132.0 222.3,131.1 227.3,130.2 232.3,129.2 237.3,128.3 242.3,127.3 247.3,126.2 252.4,125.2 257.4,124.1 262.4,123.0 267.4,121.9 272.4,120.8 277.4,119.6 282.4,118.5 287.4,117.3 292.4,116.1 297.4,114.9 302.4,113.6 307.4,112.4 312.5,111.1 317.5,109.8 322.5,108.5 327.5,107.2 332.5,105.9 337.5,104.6 340.0,103.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="40.4,113.6 45.4,142.9 50.5,148.7 55.5,151.4 60.5,152.8 65.6,153.4 70.6,153.5 75.6,153.4 80.7,152.9 85.7,152.3 90.8,151.6 95.8,150.7 100.8,149.7 105.9,148.6 110.9,147.5 115.9,146.3 121.0,145.1 126.0,143.8 131.0,142.5 136.1,141.1 141.1,139.7 146.1,138.3 151.2,136.8 156.2,135.3 161.2,133.8 166.3,132.3 171.3,130.7 176.4,129.2 181.4,127.6 186.4,126.0 191.5,124.4 196.5,122.8 201.5,121.1 206.6,119.5 211.6,117.8 216.6,116.2 221.7,114.5 226.7,112.8 231.7,111.1 236.8,109.4 241.8,107.7 246.8,106.0 251.9,104.3 256.9,102.5 262.0,100.8 267.0,99.0 272.0,97.3 277.1,95.5 282.1,93.8 287.1,92.0 292.2,90.2 297.2,88.5 302.2,86.7 307.3,84.9 312.3,83.1 317.3,81.3 322.4,79.5 327.4,77.7 332.4,75.9 337.5,74.1 340.0,73.2" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="40.4,157.8 45.4,166.2 50.5,166.8 55.5,166.3 60.5,165.5 65.6,164.3 70.6,163.0 75.6,161.6 80.7,160.1 85.7,158.6 90.8,157.0 95.8,155.4 100.8,153.7 105.9,152.0 110.9,150.3 115.9,148.5 121.0,146.8 126.0,145.0 131.0,143.2 136.1,141.4 141.1,139.6 146.1,137.8 151.2,136.0 156.2,134.1 161.2,132.3 166.3,130.4 171.3,128.6 176.4,126.7 181.4,124.8 186.4,123.0 191.5,121.1 196.5,119.2 201.5,117.3 206.6,115.4 211.6,113.5 216.6,111.6 221.7,109.7 226.7,107.8 231.7,105.9 236.8,104.0 241.8,102.1 246.8,100.2 251.9,98.3 256.9,96.3 262.0,94.4 267.0,92.5 272.0,90.6 277.1,88.6 282.1,86.7 287.1,84.8 292.2,82.8 297.2,80.9 302.2,79.0 307.3,77.0 312.3,75.1 317.3,73.1 322.4,71.2 327.4,69.3 332.4,67.3 337.5,65.4 340.0,64.4" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <circle cx="140" cy="140" r="4" fill="#1d6fd1"/>
  <circle cx="70" cy="153.6" r="4" fill="#b4232c"/>
  <circle cx="50" cy="166.8" r="4" fill="#f2b880"/>
  <line x1="220" y1="24" x2="240" y2="24" stroke="#1d6fd1" stroke-width="2"/>
  <text x="246" y="28" font-size="11" fill="#1f2a44">μ = 1</text>
  <line x1="220" y1="40" x2="240" y2="40" stroke="#b4232c" stroke-width="2"/>
  <text x="246" y="44" font-size="11" fill="#1f2a44">μ = 0.3</text>
  <line x1="220" y1="56" x2="240" y2="56" stroke="#f2b880" stroke-width="2.5"/>
  <text x="246" y="60" font-size="11" fill="#1f2a44">μ = 0.1</text>
  <text x="290" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">dashed: cost x alone</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">wall at x = 0</text>
  <text x="190" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">x (0 to 3); dots mark each minimum, at x = μ</text>
</svg>
```
:::

::: context inertia-word Counting the signs
**Inertia** here has nothing to do with Newton's first law. It is the triple of numbers (positive, negative, zero) counting a symmetric matrix's eigenvalues by sign. Sylvester's law of inertia says those counts survive the $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization, so the solver can read them straight off the diagonal blocks of $\mathbf{D}$ at no extra cost. The right count — $n$ positive, $m$ negative — is how IPOPT knows its model curves upward along every direction the constraints allow.
:::

::: context roundoff-picture The U-shaped error curve
Here are the errors from the code, at many more step sizes. To the right, a big step makes the curve-versus-straight-line error dominate, and the error falls as $h$ shrinks — by a factor of $10$ per decade for forward differences and $100$ for central. To the left, round-off dominates: subtracting two nearly equal numbers throws away digits, and dividing by a tiny $h$ magnifies what is left. The jagged part is round-off noise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="185" x2="340" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="185" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="50.0,79.9 52.6,69.3 55.3,72.8 57.9,71.9 60.5,72.3 63.2,82.3 65.8,79.4 68.5,78.5 71.1,90.2 73.7,80.5 76.4,79.8 79.0,88.2 81.6,93.2 84.3,88.8 86.9,86.2 89.5,101.1 92.2,95.5 94.8,96.1 97.5,103.9 100.1,105.0 102.7,107.3 105.4,107.8 108.0,98.5 110.6,101.0 113.3,101.9 115.9,99.9 118.5,102.5 121.2,111.0 123.8,117.5 126.5,116.6 129.1,133.3 131.7,119.6 134.4,132.2 137.0,112.7 139.6,120.2 142.3,114.7 144.9,129.5 147.5,118.8 150.2,129.2 152.8,121.9 155.5,120.4 158.1,125.5 160.7,125.5 163.4,124.4 166.0,120.2 168.6,120.9 171.3,119.7 173.9,118.0 176.5,117.0 179.2,115.9 181.8,114.5 184.5,113.1 187.1,111.7 189.7,110.3 192.4,109.0 195.0,107.6 197.6,106.2 200.3,104.8 202.9,103.5 205.5,102.1 208.2,100.7 210.8,99.4 213.5,98.0 216.1,96.6 218.7,95.2 221.4,93.9 224.0,92.5 226.6,91.1 229.3,89.7 231.9,88.4 234.5,87.0 237.2,85.6 239.8,84.2 242.5,82.9 245.1,81.5 247.7,80.1 250.4,78.7 253.0,77.4 255.6,76.0 258.3,74.6 260.9,73.2 263.5,71.9 266.2,70.5 268.8,69.1 271.5,67.7 274.1,66.4 276.7,65.0 279.4,63.6 282.0,62.2 284.6,60.9 287.3,59.5 289.9,58.1 292.5,56.7 295.2,55.4 297.8,54.0 300.5,52.6 303.1,51.2 305.7,49.8 308.4,48.5 311.0,47.1 313.6,45.7 316.3,44.3 318.9,43.0 321.5,41.6 324.2,40.2 326.8,38.8 329.5,37.5 332.1,36.1 334.7,34.7 337.4,33.3 340.0,31.9" fill="none" stroke="#1d6fd1" stroke-width="1.8"/>
  <polyline points="50.0,79.9 52.6,76.2 55.3,93.2 57.9,78.4 60.5,77.3 63.2,82.3 65.8,90.1 68.5,87.8 71.1,90.2 73.7,87.7 76.4,107.3 79.0,88.2 81.6,93.2 84.3,88.8 86.9,91.4 89.5,101.1 92.2,95.5 94.8,100.0 97.5,103.9 100.1,105.0 102.7,99.1 105.4,100.7 108.0,106.0 110.6,112.7 113.3,111.3 115.9,114.7 118.5,107.5 121.2,112.1 123.8,110.3 126.5,112.6 129.1,133.3 131.7,119.6 134.4,132.2 137.0,118.4 139.6,122.3 142.3,129.7 144.9,129.5 147.5,125.5 150.2,124.8 152.8,129.6 155.5,133.3 158.1,135.9 160.7,132.2 163.4,136.6 166.0,131.5 168.6,136.3 171.3,152.2 173.9,136.4 176.5,144.8 179.2,148.4 181.8,144.3 184.5,153.5 187.1,160.6 189.7,143.2 192.4,155.0 195.0,160.9 197.6,150.6 200.3,156.7 202.9,153.0 205.5,157.6 208.2,164.6 210.8,166.9 213.5,158.8 216.1,166.4 218.7,166.0 221.4,169.5 224.0,167.4 226.6,167.4 229.3,180.9 231.9,169.8 234.5,163.6 237.2,166.9 239.8,164.5 242.5,162.4 245.1,159.0 247.7,156.1 250.4,153.3 253.0,150.5 255.6,147.8 258.3,145.0 260.9,142.3 263.5,139.6 266.2,136.8 268.8,134.1 271.5,131.3 274.1,128.6 276.7,125.8 279.4,123.1 282.0,120.3 284.6,117.6 287.3,114.8 289.9,112.1 292.5,109.3 295.2,106.6 297.8,103.8 300.5,101.1 303.1,98.3 305.7,95.6 308.4,92.8 311.0,90.1 313.6,87.3 316.3,84.6 318.9,81.8 321.5,79.1 324.2,76.3 326.8,73.6 329.5,70.8 332.1,68.1 334.7,65.3 337.4,62.6 340.0,59.8" fill="none" stroke="#b4232c" stroke-width="1.8"/>
  <g stroke="#1f2a44"><line x1="50" y1="185" x2="50" y2="189"/><line x1="102.7" y1="185" x2="102.7" y2="189"/><line x1="155.5" y1="185" x2="155.5" y2="189"/><line x1="208.2" y1="185" x2="208.2" y2="189"/><line x1="260.9" y1="185" x2="260.9" y2="189"/><line x1="313.6" y1="185" x2="313.6" y2="189"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="50" y="200">1e-12</text><text x="102.7" y="200">1e-10</text><text x="155.5" y="200">1e-8</text><text x="208.2" y="200">1e-6</text><text x="260.9" y="200">1e-4</text><text x="313.6" y="200">1e-2</text></g>
  <g stroke="#1f2a44"><line x1="46" y1="20" x2="50" y2="20"/><line x1="46" y1="75" x2="50" y2="75"/><line x1="46" y1="130" x2="50" y2="130"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="44" y="24">1</text><text x="44" y="79">1e-4</text><text x="44" y="134">1e-8</text><text x="44" y="189">1e-12</text></g>
  <text x="300" y="26" font-size="11" fill="#1d6fd1" text-anchor="middle">forward</text>
  <text x="300" y="112" font-size="11" fill="#b4232c" text-anchor="middle">central</text>
  <text x="195" y="213" font-size="11" fill="#6c7a93" text-anchor="middle">step h (log scale); up = bigger error</text>
</svg>
```
:::

::: context complex-step-history An old trick rediscovered
The idea goes back to James Lyness and Cleve Moler in 1967. William Squire and George Trapp revived it in 1998, and aerospace engineers — notably Joaquim Martins and colleagues, working on aircraft wing design — made it a standard way to verify derivatives. Why it works: for an analytic function, $f(x + ih) = f(x) + ih f'(x) - h^2 f''(x)/2 + \dots$, so the imaginary part is $h f'(x)$ plus a term of order $h^3$. No subtraction happens, so $h$ can be absurdly small.
:::

::: context reverse-mode-word Running the chain rule backward
Forward-mode differentiation pushes derivatives through the calculation in the same order as the values, one input direction at a time — so a gradient with $n$ inputs costs about $n$ passes. **Reverse mode** records the calculation, then runs the chain rule backward from the single output, collecting how much every input contributed in one sweep. The cost is a small constant multiple of one evaluation, however many inputs there are. Machine learning calls exactly this backpropagation.
:::

::: context colouring-note Nudging many variables at once
If the Jacobian is sparse, variables whose columns never share a nonzero row can be nudged *at the same time*: one extra evaluation recovers all their entries, because no row mixes them. Grouping the columns is a **graph-coloring** problem. You need at least as many colors as the most nonzeros in any one row, and for a banded pattern with half-bandwidth $b$, $2b + 1$ colors always suffice. In the ascent problem each defect row touches $21$ variables, so at least $21$ colors are needed — and $21$ are enough: colors 1 to 10 for the ten variables at even-numbered nodes, 11 to 20 for odd-numbered nodes, and color 21 for the final time. A Jacobian then costs $21$ evaluations instead of $1011$, about $48$ times fewer, for pure bookkeeping on the sparsity pattern you supplied anyway. Solver interfaces do this when you decline to provide derivatives.
:::

::: context flight-memory-rules Why flight code will not allocate memory
Memory requested while the program runs can fail, fragment, or take an unpredictable time to find. NASA's Jet Propulsion Laboratory made "no dynamic memory allocation after initialization" one of its ten rules for safety-critical code, written by Gerard Holzmann in 2006. Embedded convex solvers — the subject of the last lesson — are designed around this rule: every array is sized before launch.
:::

::: context scaling-units Choosing units that fit the problem
**Non-dimensionalising** means measuring each quantity in a unit natural to the problem, so that the numbers come out near one. For an orbit, lengths might be in Earth radii ($6378\,\mathrm{km}$), speeds in circular orbit speed at that radius (about $7.9\,\mathrm{km/s}$), and mass as a fraction of liftoff mass. The physics is unchanged, but now a step of $0.01$ means "a little" for every variable, which is what both solvers quietly assume.
:::
