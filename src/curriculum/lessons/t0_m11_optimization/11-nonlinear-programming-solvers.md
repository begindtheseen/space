---
id: l11-nonlinear-programming-solvers
title: Nonlinear programming solvers: IPOPT and SNOPT
minutes: 28
covers:
  - nonlinear programming solvers (IPOPT, SNOPT)
---

You will almost certainly never write an SQP or an interior-point code for production use. You will call one. Two codes dominate aerospace trajectory work – **IPOPT** and **SNOPT** – and between them they are behind most of the optimal trajectories published in the last twenty years: launch ascent profiles, interplanetary low-thrust transfers, entry guidance references, and the nominal descents that an onboard convex solver is later asked to track. Knowing what they are, what they demand of you, and where they fail is a practical skill, not trivia.

Both solve the same problem class, the general nonlinear program, and they descend from the two algorithms of the last two lessons: IPOPT is an interior-point method with a filter line search, SNOPT is an active-set SQP with a limited-memory quasi-Newton Hessian. Their differences in behaviour follow directly from that difference in algorithm, and once you can predict which one suits a problem you have understood both lessons.

The other half of this lesson is about what goes *into* a solver. The single most common cause of a trajectory optimisation that will not converge is not the solver; it is a wrong derivative, a badly scaled variable, or a discretisation that made the problem harder than the physics required. The numbers below make those failure modes concrete.

## What a general NLP solver asks for

Both codes take the problem in essentially the same shape:

$$
\text{minimise } f(\mathbf{x}) \quad \text{subject to} \quad \mathbf{g}_L \le \mathbf{g}(\mathbf{x}) \le \mathbf{g}_U, \qquad \mathbf{x}_L \le \mathbf{x} \le \mathbf{x}_U,
$$

with $\mathbf{x} \in \mathbb{R}^n$ and $\mathbf{g}: \mathbb{R}^n \to \mathbb{R}^m$. Equality constraints are the case $g_{L,i} = g_{U,i}$; one-sided constraints use infinite bounds. What you must supply:

1. **Function values** $f(\mathbf{x})$ and $\mathbf{g}(\mathbf{x})$.
2. **First derivatives**: the gradient $\nabla f$ and the Jacobian $\nabla\mathbf{g}$, the latter in **sparse** form – a list of the row and column indices that can ever be nonzero, fixed once at the start, plus the values at each iterate.
3. **Second derivatives**, optionally: the sparsity and values of $\nabla^2_{\mathbf{xx}}\mathcal{L}$. IPOPT will use an exact Hessian if you give it one and fall back to limited-memory BFGS otherwise. SNOPT never asks for one; it always builds a quasi-Newton approximation.
4. **An initial guess** $\mathbf{x}_0$, and for SNOPT optionally an initial active set or basis, which is what makes its warm starts effective.
5. **Scaling**, implicitly: both codes assume a unit change in any variable or constraint is roughly comparably significant. It is your job to make that true.

The sparsity requirement is not a formality. A trajectory NLP's Jacobian is more than $98\,\%$ zeros, and the whole tractability of the method rests on never storing or factorising those zeros.

::: example Sizing a direct-collocation ascent problem
Transcribe a three-degree-of-freedom ascent into an NLP by **direct collocation**: pick $N = 100$ intervals, carry the state $(\mathbf{r}, \mathbf{v}, m)$ – seven numbers – and the control (a thrust direction, three numbers) at each of the $101$ nodes, and add the final time as one more unknown. That is

$$
n = 101 \times 7 + 101 \times 3 + 1 = 1011 \text{ variables}.
$$

The dynamics become **defect constraints**: for each interval, the difference between the integrated state and the next node's state must vanish. With a trapezoidal rule that is $7$ equations per interval, $700$ in all. Add a unit-norm constraint on the thrust direction at each node ($101$), a dynamic-pressure limit at each node ($101$), and $13$ boundary conditions, giving $m = 915$ constraints.

Now count the Jacobian. Dense, it would have $915 \times 1011 = 925{,}065$ entries. But a defect row for interval $k$ involves only the states and controls at nodes $k$ and $k+1$ and the final time: at most $2\times(7+3) + 1 = 21$ nonzeros. A unit-norm row touches three variables, a dynamic-pressure row touches seven, a boundary row one. Total:

$$
700 \times 21 + 101 \times 3 + 101 \times 7 + 13 = 15{,}723 \text{ nonzeros},
$$

a density of $1.70\,\%$. The KKT matrix the solver factorises at each iteration has dimension $n + m = 1926$. Factorising it densely costs about $M^3/3 = 2.4\times10^9$ operations; exploiting the block-banded structure, with a half-bandwidth of about $27$ after ordering by time node, costs about $Mb^2 = 1.4\times10^6$ – a factor of $1{,}700$. That factor is the difference between a solve that takes a minute and one that takes a day, and it is why the sparsity pattern is an input rather than something the solver discovers.
:::

## IPOPT

IPOPT (Interior Point OPTimizer) is the algorithm of lesson 9 generalised to nonconvex problems, and it is open source under a permissive licence, which is why it is everywhere.

- **Barrier on the bounds.** Every bound $x_i \ge x_{L,i}$ is replaced by a logarithmic barrier term with parameter $\mu$, and $\mu$ is driven down as the iterates converge – adaptively, not on a fixed schedule.
- **Newton on the perturbed KKT system**, giving a symmetric indefinite linear system at each iteration, solved by a sparse $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorisation from an external library (MA27, MA57, HSL MA97, MUMPS or Pardiso, depending on the build).
- **Inertia correction.** For the step to be a descent direction the KKT matrix must have exactly $n$ positive and $m$ negative eigenvalues. When the factorisation reports the wrong inertia – which happens whenever the Lagrangian Hessian is insufficiently positive on the constraint null space – IPOPT adds $\delta\mathbf{I}$ to the Hessian block and refactorises, increasing $\delta$ until the inertia is right. This is the nonconvex analogue of the regularisation in lesson 10, done automatically and reported in the solver log.
- **Filter line search.** Steps are accepted if they improve either the objective or the constraint violation with respect to every entry in the filter, avoiding the merit-function penalty parameter entirely.
- **Restoration phase.** When the line search cannot find an acceptable step, IPOPT temporarily abandons the objective and minimises constraint violation alone, then resumes. Seeing "restoration" repeatedly in a log usually means bad scaling or an infeasible formulation, not a solver problem.
- **Hessian**: exact if supplied, otherwise limited-memory BFGS.

IPOPT is at its best on problems with many degrees of freedom – many more variables than active constraints – which is the usual shape of a finely discretised trajectory. Its per-iteration cost is one sparse factorisation, so it scales well to hundreds of thousands of variables.

## SNOPT

SNOPT (Sparse Nonlinear OPTimizer) is the active-set SQP of lesson 10, engineered for sparse problems. It is commercial software from Stanford, which is a real consideration when choosing a toolchain.

- **Sparse SQP.** Each major iteration solves a sparse QP subproblem with linearised constraints; each minor iteration of that QP adds or drops one constraint from the active set.
- **Limited-memory quasi-Newton.** SNOPT never forms a second derivative. It maintains a limited-memory BFGS approximation, typically over the last ten to twenty steps, with Powell damping to keep it positive definite.
- **Augmented-Lagrangian merit function** for the line search, rather than a filter.
- **Elastic mode.** When the linearised constraints of a QP subproblem are inconsistent, SNOPT relaxes them with penalised elastic variables so a step always exists, and the size of the elastic penalty tells you how infeasible the linearisation was. This is what lets it make progress on problems where a plain SQP would stop.
- **Warm starts.** Supplying the previous solution's active set lets a re-solve of a slightly changed problem finish in a handful of major iterations, which is why SNOPT is favoured in design loops that sweep a parameter.

SNOPT suits problems with **few degrees of freedom** – many constraints, nearly all active, so the active-set machinery has little to search – and problems where each function evaluation is expensive, because it takes comparatively few of them. A shooting-style transcription with a modest number of shooting variables is its natural habitat; a hundred-thousand-variable collocation mesh is not.

::: key Choosing between them
IPOPT: interior point, filter line search, exact or limited-memory Hessian, sparse indefinite factorisation per iteration, open source. Best with many degrees of freedom and a fine mesh. SNOPT: active-set SQP, limited-memory quasi-Newton, elastic mode, excellent warm starts, commercial. Best with few degrees of freedom, expensive function evaluations, and repeated solves of a slowly changing problem. Neither returns a certificate of global optimality; both find a point satisfying the first-order conditions, if they converge at all.
:::

## Derivatives are the whole game

Both codes converge at the rate their derivatives allow, and inaccurate derivatives are indistinguishable from a hard problem. There are four ways to get them.

**Hand-coded analytic derivatives** are fastest and most error-prone. Always verify them against finite differences before trusting a single run.

**Finite differences** are the fallback, and they carry an unavoidable accuracy floor. A forward difference has truncation error $O(h)$ and round-off error $O(\epsilon_{\text{mach}}/h)$; balancing the two gives an optimal step $h \approx \sqrt{\epsilon_{\text{mach}}} \approx 1.5\times10^{-8}$ and a best-case relative error of about $10^{-8}$. A central difference balances $O(h^2)$ against $O(\epsilon_{\text{mach}}/h)$ at $h \approx \epsilon_{\text{mach}}^{1/3} \approx 6\times10^{-6}$ for a best case near $10^{-11}$. Here is the trade, measured:

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

The U-shape is the point: making $h$ smaller helps until round-off takes over, and past that it gets rapidly worse. The forward difference bottoms out at $5\times10^{-8}$ near $h = 10^{-8}$; the central difference reaches $3\times10^{-11}$ near $10^{-6}$; below $10^{-10}$ both are garbage.

**The complex-step derivative** takes $f'(x) \approx \operatorname{Im} f(x + ih)/h$, which has no subtraction of nearly equal numbers and therefore no round-off cancellation at all: with $h = 10^{-20}$ it reproduces the analytic derivative to the last bit, as the last line shows. It costs one complex function evaluation and requires that the code be analytic – no absolute values, no comparisons on the real part, no transposes written as conjugate transposes. When it applies, it is the cheapest way to verify a hand-coded Jacobian.

**Algorithmic differentiation** is what production trajectory work uses. A tool such as CasADi, ADOL-C or JAX builds the derivative code from the function's own computational graph, exact to machine precision, and reverse mode computes a full gradient at a cost of about three function evaluations regardless of $n$. For the $1011$-variable problem above, a dense forward-difference gradient costs $1011$ extra evaluations per iteration; at $1\,\mathrm{ms}$ each that is $1.0\,\mathrm{s}$ per iteration and about $100\,\mathrm{s}$ over a hundred iterations, against roughly $0.3\,\mathrm{s}$ for algorithmic differentiation.

::: note Sparse finite differencing with colouring
There is a middle road worth knowing. If the Jacobian is sparse, variables whose columns have disjoint nonzero rows can be perturbed *simultaneously* – one extra evaluation recovers all of their derivative entries at once. Grouping the columns is a graph-colouring problem, and for a banded pattern with half-bandwidth $b$ the answer is $2b+1$ colours. The ascent problem's Jacobian has at most $21$ variables touching any one constraint row, and colouring brings the gradient cost from $1011$ evaluations down to about $43$ – a factor of $24$, for nothing but bookkeeping the solver interface already has, since you supplied the sparsity pattern anyway. This is what IPOPT and SNOPT do internally when you decline to provide derivatives.
:::

::: example What the solver interface looks like
The code below is illustrative only – CasADi and IPOPT are not installed in this environment, so no output is claimed for it. It shows the shape of a collocation problem handed to IPOPT through CasADi, which is the usual route in GNC work.

```python
import casadi as ca

N, dt = 100, 0.5
x = ca.MX.sym("x", 7, N + 1)      # r (3), v (3), m
u = ca.MX.sym("u", 3, N)          # thrust direction times magnitude
tf = ca.MX.sym("tf")

g, lbg, ubg = [], [], []
for k in range(N):                # trapezoidal defects
    fk = dynamics(x[:, k], u[:, k])
    fk1 = dynamics(x[:, k + 1], u[:, k])
    g.append(x[:, k + 1] - x[:, k] - 0.5 * dt * (fk + fk1))
    lbg += [0.0] * 7
    ubg += [0.0] * 7

nlp = {"x": ca.vertcat(ca.vec(x), ca.vec(u), tf),
       "f": -x[6, -1],            # maximise final mass
       "g": ca.vertcat(*g)}
solver = ca.nlpsol("solver", "ipopt", nlp,
                   {"ipopt.tol": 1e-8, "ipopt.max_iter": 500})
sol = solver(x0=guess, lbg=lbg, ubg=ubg, lbx=lbx, ubx=ubx)
```

Three things are worth noticing. The dynamics are written once, symbolically, and CasADi produces exact sparse first and second derivatives from that expression – you never write a Jacobian. The sparsity pattern is discovered from the graph, not declared. And `max_iter` is a number you must choose: the solver has no idea how long it will take, which is the honest admission at the centre of this lesson.
:::

## Why neither of these flies

Everything above is design-time software. The reasons are structural, not a matter of tuning.

- **No iteration bound.** The algorithms are locally convergent; the number of iterations depends on the data and the initial guess. A code that takes $30$ iterations on the nominal case and $400$ on a dispersed one cannot be given a $100\,\mathrm{ms}$ budget.
- **Dynamic memory.** Sparse factorisation with numerical pivoting decides its fill-in at runtime, so the working memory a solve needs is not known before it runs. Flight software generally forbids allocation after initialisation.
- **No certificate.** As lesson 10 stressed, a converged NLP satisfies the first-order conditions to a tolerance. It is not a proof of optimality, and an "infeasible" report from a nonconvex solver is a statement about the solver's search, not about the problem.
- **Dependence on the initial guess.** Reproducibility across flights and across dispersion cases is a certification requirement, and a method whose answer depends on where it started makes that argument much harder.
- **Verification burden.** IPOPT pulls in a third-party sparse linear algebra library of tens of thousands of lines. Qualifying that to flight standards is a project in itself, and SNOPT's licence terms make source-level qualification a commercial negotiation.

What they are for is the work before flight: generating the reference trajectories a controller tracks; sizing a vehicle by re-solving the ascent problem over a design sweep; and – the use that matters most for this module – quantifying how much a convex formulation gives away. Solve the honest nonconvex landing problem with IPOPT on the ground, solve the convexified version of lesson 6, compare the propellant, and you have the number that justifies flying the convex one.

::: warning "The solver failed" is usually not the solver
When an NLP will not converge, the order of suspicion should be: derivatives first, scaling second, formulation third, solver last. Check the Jacobian against a central difference at a few iterates. Then look at the variable magnitudes – a problem carrying positions in metres ($10^6$), velocities in metres per second ($10^3$), a mass in kilograms ($10^4$) and a quaternion component ($10^0$) has a Jacobian whose entries span twelve orders of magnitude, and both codes will struggle; non-dimensionalise, or set scale factors. Then ask whether the formulation is feasible at all, and whether the discretisation is too coarse for the dynamics (a defect constraint that cannot be satisfied to tolerance with the mesh you chose will look exactly like an infeasible problem). Only then consider swapping solvers. In practice the great majority of "IPOPT cannot solve my trajectory" reports are one of the first two.
:::

## Check yourself

::: check
A collocation problem has $2{,}000$ variables and $1{,}800$ constraints, of which $1{,}790$ are active at the solution. Which of the two solvers would you reach for, and why?
:::

::: answer
SNOPT. The number of degrees of freedom at the solution – variables minus active constraints – is $2000 - 1790 = 210$, which is small. An active-set method's cost is dominated by how much searching it must do over active sets, and a problem that is nearly fully constrained gives it little room to search; each QP subproblem is close to a single equality-constrained solve. An interior-point method, by contrast, pays for every constraint through its barrier whether or not it is active, and gains nothing from the fact that almost all of them are. The picture reverses for a fine mesh with thousands of free control variables and only the dynamics binding: there IPOPT's fixed cost per iteration wins. This heuristic – count the degrees of freedom – is the single most useful rule for choosing.
:::

::: check
You must supply a Jacobian for a constraint function you did not write and cannot differentiate by hand. What sequence of options would you try, and what accuracy would you expect from each?
:::

::: answer
First, algorithmic differentiation: if the function can be re-expressed in a framework such as CasADi or JAX, the derivatives are exact to machine precision and reverse mode costs about three function evaluations per gradient regardless of dimension. Second, the complex-step derivative, if the code is analytic and can run on complex inputs: also exact, at one complex evaluation per variable, and it is the ideal way to check an existing Jacobian. Third, sparse finite differencing with colouring: about $10^{-8}$ relative accuracy for forward differences, $10^{-11}$ for central, at a cost of one evaluation per colour – roughly $2b+1$ for a banded pattern, $43$ rather than $1011$ in the ascent example. Last, dense finite differences, same accuracy and one evaluation per variable. The accuracy floor matters directly: a solver asked for a KKT tolerance of $10^{-10}$ with forward-difference derivatives is being asked for something the derivatives cannot support, and it will stall.
:::

::: check
An IPOPT log shows the regularisation parameter $\delta$ rising through $10^{-4}$, $10^{-2}$, $1$, $100$ over successive iterations, and the algorithm entering restoration twice. What is happening?
:::

::: answer
The inertia of the KKT matrix keeps coming out wrong, so IPOPT is adding larger and larger multiples of the identity to the Hessian block to force it right. Mathematically that means the Lagrangian Hessian is strongly indefinite on the null space of the active constraints at these iterates – the model has directions of negative curvature that the constraints do not remove. As $\delta$ grows the step degenerates toward a short steepest-descent step, progress stalls, the filter rejects it, and restoration takes over to chase feasibility alone. Common causes, in order: the supplied Hessian is wrong (check it); the problem is badly scaled, which manufactures artificial curvature; the discretisation is too coarse so the defect constraints are nearly inconsistent; or the formulation really is nonconvex in a nasty way at that point, in which case a better initial guess or a homotopy from an easier problem is the practical fix.
:::

::: check
Estimate the arithmetic cost per iteration of the ascent NLP above if the solver ignored sparsity, and say what that implies about supplying the sparsity pattern correctly.
:::

::: answer
The KKT matrix has dimension $n + m = 1011 + 915 = 1926$. A dense symmetric indefinite factorisation costs about $M^3/3 = 2.4\times10^9$ operations, against about $M b^2 \approx 1.4\times10^6$ for the banded structure with half-bandwidth $27$ – a factor of roughly $1{,}700$. Storage tells the same story: $1926^2$ doubles is $30\,\mathrm{MB}$ against $15{,}723$ Jacobian nonzeros, a few hundred kilobytes. The implication for the sparsity pattern is that declaring *extra* entries is not free – every spurious nonzero widens the bandwidth and can cost dearly in fill-in – while declaring *too few* is a correctness bug that produces silently wrong derivatives, since the solver never asks about the entries you omitted. Both mistakes are common; the second is much worse, and a dense finite-difference check of the whole Jacobian on a small instance of the problem is the standard way to catch it.
:::

::: check
Why can a nonlinear programming solver not return the infeasibility certificate of lesson 7?
:::

::: answer
The certificate of lesson 7 is a dual object whose existence proves that no feasible point exists, and it rests on strong duality, which holds for convex problems satisfying a constraint qualification. For a nonconvex problem the dual generally has a positive gap, so a dual point proves nothing beyond a bound – and the bound may be far from tight. What an NLP solver can report is that *its* attempt to reduce constraint violation converged to a point of locally minimal infeasibility: IPOPT's restoration phase converging to a nonzero violation, or SNOPT's elastic mode terminating with elastic variables still positive. Both are statements about a local search. A different starting point may well find a feasible trajectory. That asymmetry – "feasible" is provable by exhibiting a point, "infeasible" is not – is one more reason flight guidance is formulated convexly, where both directions come with proofs.
:::

## Summary

| Object | Statement |
| --- | --- |
| NLP form | minimise $f(\mathbf{x})$ s.t. $\mathbf{g}_L \le \mathbf{g}(\mathbf{x}) \le \mathbf{g}_U$, $\mathbf{x}_L \le \mathbf{x} \le \mathbf{x}_U$ |
| Solver inputs | Values, sparse first derivatives, optional sparse Hessian, initial guess, scaling |
| IPOPT | Interior point; adaptive barrier $\mu$; filter line search; inertia correction $\delta\mathbf{I}$; restoration phase; exact or L-BFGS Hessian; open source |
| SNOPT | Active-set sparse SQP; limited-memory quasi-Newton; augmented-Lagrangian merit; elastic mode; strong warm starts; commercial |
| Choosing | Many degrees of freedom and a fine mesh $\to$ IPOPT; few degrees of freedom, costly evaluations, repeated solves $\to$ SNOPT |
| Collocation sizing | $N = 100$, $7$ states, $3$ controls: $1011$ variables, $915$ constraints, $15{,}723$ Jacobian nonzeros, $1.70\,\%$ dense |
| Sparsity payoff | KKT size $1926$: dense $2.4\times10^9$ flops, banded ($b \approx 27$) $1.4\times10^6$ – a factor of $1{,}700$ |
| Finite differences | Forward: $h \approx \sqrt{\epsilon} \approx 1.5\times10^{-8}$, floor $\approx 5\times10^{-8}$. Central: $h \approx \epsilon^{1/3} \approx 6\times10^{-6}$, floor $\approx 3\times10^{-11}$ |
| Complex step | $f'(x) \approx \operatorname{Im}f(x+ih)/h$; exact to machine precision at $h = 10^{-20}$; needs analytic code |
| Algorithmic differentiation | Exact; reverse mode gives a full gradient for about $3$ function evaluations; $0.3\,\mathrm{s}$ vs $100\,\mathrm{s}$ over $100$ iterations on the example |
| Colouring | Sparse finite differencing needs $2b+1$ evaluations; $43$ instead of $1011$ here |
| Why they do not fly | No iteration bound, dynamic memory, no certificate, dependence on the initial guess, verification burden |
| What they are for | Reference trajectories, design sweeps, and measuring how much a convex formulation gives away |

The next lesson returns to the convex world and to the software you would actually put in a guidance loop: the modelling language that turns a written problem into cone data, and the four solvers that consume it.
