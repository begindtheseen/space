---
id: l10-spectral-convergence-covector-mapping
title: Spectral convergence and the covector mapping theorem
minutes: 22
covers:
  - "Spectral convergence, the covector mapping theorem, and what pseudospectral costates buy you"
---

Picture tracing the edge of a hill with a long, bendy ruler. You pin the ruler at a few points on the outline and let it bend smoothly between them. For a gently rounded hill, a handful of pins already gives a near-perfect trace, and each extra pin makes it dramatically better. Now try the same thing on a roof with a sharp ridge. The ruler cannot make a sharp corner. However many pins you add, it rounds the ridge off, and the traced shape improves only slowly.

That is this lesson's first idea. A pseudospectral method is the bendy ruler: one smooth polynomial across the whole flight. On a smooth trajectory it becomes accurate astonishingly fast. On a trajectory with a sharp corner — an engine switching on, a stage dropping away — it loses almost all of its advantage. Knowing which case you are in decides whether the method is worth its cost.

The second idea is a free gift. When a solver finishes a direct transcription, it hands back more than the trajectory: it also hands back a set of **multipliers**, one price tag per constraint. The **covector mapping theorem** says those price tags are, after the right rescaling, the costates of the early lessons. So you can check a direct answer against Pontryagin's theory without ever having guessed a costate.

## How fast is fast?

Take the simplest test problem there is: $\dot x = -x$ with $x(0) = 1$, on the time interval $[0, 2]$. The exact answer is $x(t) = e^{-t}$. Solve it with the machinery of the last lesson: place $N+1$ Legendre-Gauss-Lobatto nodes on the interval, ask the interpolating polynomial's derivative (the differentiation matrix $\mathbf{D}$) to match the dynamics at every node, and replace the first row with the known starting value. Here $N$ is the polynomial's **degree**, the highest power of $t$ it contains.

::: example Fourteen nodes to machine precision
Here is the whole solve in a few lines of NumPy. Each row of the linear system says "derivative plus value equals zero" at one node, except the first row, which says $x(0) = 1$.

```python
import numpy as np
from numpy.polynomial import legendre as L

def lgl_nodes(N):
    # Legendre-Gauss-Lobatto: both ends plus the roots of P_N'
    inner = np.sort(L.Legendre.basis(N).deriv().roots().real)
    return np.concatenate(([-1.0], inner, [1.0]))

def diff_matrix(x):
    # derivative of the interpolating polynomial, read off at the nodes
    w = np.array([1 / np.prod(xi - np.delete(x, i)) for i, xi in enumerate(x)])
    D = (w[None, :] / w[:, None]) / (x[:, None] - x[None, :] + np.eye(len(x)))
    np.fill_diagonal(D, 0.0)
    np.fill_diagonal(D, -D.sum(axis=1))
    return D

for N in [3, 5, 7, 9, 11, 13]:
    tau = lgl_nodes(N)
    t = tau + 1.0                    # maps [-1, 1] onto [0, 2]
    A = diff_matrix(tau) + np.eye(N + 1)   # rows say: x' + x = 0
    b = np.zeros(N + 1)
    A[0, :] = 0.0; A[0, 0] = 1.0; b[0] = 1.0   # first row: x(0) = 1
    x = np.linalg.solve(A, b)
    print(N, f"{np.max(np.abs(x - np.exp(-t))):.3e}")
# 3 1.180e-02
# 5 1.564e-04
# 7 8.861e-07
# 9 2.874e-09
# 11 6.103e-12
# 13 8.660e-15
```

(The map from $[-1,1]$ to $[0,2]$ is $t = \tau + 1$, which stretches nothing, so $d/dt = d/d\tau$ and $\mathbf{D}$ needs no rescaling.)

Read the output as a table of worst errors across the nodes:

| degree $N$ | nodes | max error |
| --- | --- | --- |
| $3$ | $4$ | $1.180\times10^{-2}$ |
| $5$ | $6$ | $1.564\times10^{-4}$ |
| $7$ | $8$ | $8.861\times10^{-7}$ |
| $9$ | $10$ | $2.874\times10^{-9}$ |
| $11$ | $12$ | $6.103\times10^{-12}$ |
| $13$ | $14$ | $8.7\times10^{-15}$ |

**Step 1: look at the ratios.** From $N=3$ to $N=5$ the error falls by a factor of about $75$. From $N=5$ to $N=7$, about $180$. From $N=7$ to $N=9$, about $310$. Each extra pair of nodes buys a *bigger* factor than the last one did.

**Step 2: compare with the fixed-order schemes.** Fourteen nodes reach the error floor of ordinary computer arithmetic, **[[machine precision|machine-precision]]**. Suppose trapezoidal collocation had error about $1/N^2$. Reaching $10^{-13}$ would need $N^2 \approx 10^{13}$, so about $\sqrt{10^{13}} \approx 3\times10^{6}$ nodes. Hermite-Simpson, with error about $1/N^4$, would need $\sqrt[4]{10^{13}} \approx 1800$. These are rough counts (each scheme's error has its own constant in front), but the gap is real: fourteen against thousands or millions.

**Sanity check.** At $N = 3$ the error is about $1\,\%$ of $x(0)$. A cubic through four points ought to be roughly right but visibly off, so that is believable.
:::

The pattern in Step 1 has a name. Fixed-order schemes show **algebraic convergence**: the error falls like $C/N^p$ ("C over N to the p") for a fixed power $p$ — every doubling of $N$ buys the same factor $2^p$. A global polynomial on a smooth problem shows **spectral convergence**: the error falls faster than $C/N^p$ for *every* power $p$, typically like $\rho^{-N}$ for some number $\rho > 1$ (read "rho to the minus N"). Each extra node multiplies the accuracy instead of adding to it. You can see the difference on a picture of [[error against N|error-plot]].

The fuel for spectral convergence is smoothness of a strong kind. A function is **analytic** on an interval when, around every point of it, the function equals its own Taylor series — the infinite polynomial $f(a) + f'(a)(t-a) + \tfrac12 f''(a)(t-a)^2 + \dots$ — on some small neighborhood. Every analytic function is infinitely differentiable, and more: its derivatives do not grow too wildly. The exponential $e^{-t}$ is analytic everywhere (mathematicians call such a function **entire**), so nothing slows the polynomial down.

::: key Spectral convergence and its precondition
Error decays faster than any power of $1/N$ — but only for a **smooth (analytic)** solution. A switch, a constraint activation or a staging event drops it to algebraic, which is why hp-adaptive meshes break at junctions. Trapezoid stays $O(h^2)$ and Hermite-Simpson $O(h^4)$ regardless: their rates are fixed powers of the mesh spacing $h$ and never speed up to spectral, however smooth the solution is.
:::

::: note Why it has to be true
Write a function on $[-1,1]$ as a sum of Chebyshev polynomials, $f(x) = \sum_n a_n T_n(x)$. (Chebyshev polynomials are close cousins of the Legendre polynomials that set our nodes, and they make the argument cleanest.) Each $T_n$ stays between $-1$ and $1$ on the interval. So if you keep the first $N+1$ terms, the error is at most the sum of the sizes of the coefficients you threw away, $\sum_{n > N} |a_n|$.

Everything therefore depends on how fast the coefficients $a_n$ shrink.

- **Analytic $f$.** A classical theorem of Bernstein says the coefficients shrink geometrically: $|a_n| \le C\rho^{-n}$ for some $\rho > 1$. The number $\rho$ is larger the farther the function's nearest trouble spot (a point where it blows up, in the complex plane) sits from the interval. Summing a geometric tail gives an error of about $\rho^{-N}$ — faster than any power of $1/N$.
- **A kink.** For $|x|$ the series is known exactly: $|x| = \tfrac{2}{\pi} - \tfrac{4}{\pi}\sum_{k\ge1} \frac{(-1)^k}{4k^2-1}T_{2k}(x)$. The coefficients shrink only like $1/k^2$, and a tail of $1/k^2$ terms adds up to about $1/N$. That is algebraic convergence of order one, no better.

Interpolating at good nodes (Legendre or Chebyshev clustered points) does almost as well as the best truncated series: the extra factor, called the Lebesgue constant, grows only like $\log N$. So the node solution inherits these two rates.
:::

## Breaking it on purpose

The precondition is doing all the work, so test it. Take two functions on $[-1,1]$:

- a smooth one, $g(x) = 1/(1+16x^2)$, which is analytic on the interval (its trouble spots sit off the real line, at $x = \pm i/4$);
- a merely continuous one, $|x|$ ("the absolute value of x"), whose slope jumps from $-1$ to $+1$ at the origin. That sudden change of slope is a **kink**.

::: example Smooth against kinked, fitted honestly
Interpolate each function at the $N+1$ Legendre-Gauss-Lobatto nodes, then measure the worst error against the true function on a fine grid of $20\,001$ points.

| $N$ | smooth $g$, max error | $\lvert x\rvert$, max error |
| --- | --- | --- |
| $4$ | $0.3490$ | $0.1349$ |
| $12$ | $0.04054$ | $0.04787$ |
| $20$ | $0.006089$ | $0.02914$ |
| $32$ | $0.0003126$ | $0.01837$ |

**Step 1: the raw factors.** From $N=4$ to $N=32$, the smooth function's error falls by $0.3490/0.0003126 \approx 1120$. The kinked one falls by $0.1349/0.01837 \approx 7.3$. Same nodes, same effort, a factor of $150$ apart in payoff.

**Step 2: fit both models.** Spectral convergence, error $\approx C\rho^{-N}$, becomes a straight line if you plot $\log(\text{error})$ against $N$. Algebraic convergence, error $\approx C N^{-p}$, becomes a straight line if you plot $\log(\text{error})$ against $\log N$. Fit a line both ways and score each fit with **[[R squared|r-squared]]** ($R^2$, a number from $0$ to $1$; $1$ means the points sit exactly on the line):

| | exponential fit, $R^2$ | power-law fit, $R^2$ |
| --- | --- | --- |
| smooth $g$ | $0.9995$ | $0.921$ |
| $\lvert x\rvert$ | $0.916$ | $0.9999$ |

**Step 3: read the slope.** The power-law fit for $|x|$ has slope $-0.96$: the error falls like $N^{-0.96}$, almost exactly the $1/N$ the note above predicts for a kink.

**Sanity check.** Both columns go down, so a casual glance says "it's converging". Only the fit shows that one of them is earning its keep and the other has quietly stopped.
:::

::: warning A switch, a constraint turning on, or a staging event is a kink
Every sudden change on a real trajectory is exactly this kind of kink: thrust switching on or off, a path constraint becoming active, a stage separating. At each of them some derivative of the state or control jumps. Stretch one global polynomial across such a point and you pay for a dense, high-degree differentiation matrix but collect only algebraic convergence — plus **[[Gibbs-style ringing|gibbs]]**, wiggles on both sides of the jump.

The fix is **[[hp-adaptive|hp-adaptive]]** meshing. Find the discontinuity, put a mesh break exactly there, and run a separate high-degree polynomial on each smooth piece. Each piece is smooth again, so each piece converges spectrally again. Ascent trajectories with staging and throttle limits are planned this way: breakpoints at the known or suspected junctions, never one polynomial pretending they are not there.
:::

## The covector mapping theorem

Now the gift. Think back to the shadow price of lesson two: the costate $\boldsymbol\lambda(t)$ is a price tag. It says how much the best possible cost would change if you nudged the state at time $t$. Indirect methods have to guess these price tags before they can even start.

A direct method never asks for them. But the solver that finds the best decision vector $\mathbf{z}^\star$ of the nonlinear program (NLP) computes price tags anyway. To satisfy the **[[KKT conditions|kkt]]** of any constrained optimization — the optimization module's first-order optimality test — it attaches a **Lagrange multiplier** to every constraint: one on each defect, one on each boundary condition. A multiplier is the NLP's own shadow price. It says how much the NLP's best cost would change if that constraint were loosened a little.

So there are two families of price tags. One comes from calculus of variations (the costate). One comes from finite-dimensional algebra on a mesh (the NLP multipliers). The **covector mapping theorem** says they agree.

::: key Covector mapping theorem
The KKT multipliers of the discretized problem map, under the right node set and scaling, to the costates of the continuous problem. It lets a direct solution be verified against the Minimum Principle.
:::

"Map" matters here. The multiplier is not simply equal to the costate. In the Gauss and Radau pseudospectral methods, for example, the costate at a node comes out as that node's defect multiplier divided by the node's **[[quadrature weight|quadrature-weight]]** (and by a constant time-scaling factor), with a sign that depends on how you wrote the defect. The word **[[covector|covector]]** is the mathematician's name for this kind of price-tag object.

::: note Why it is a theorem and not a definition
The two objects are born in different worlds. An NLP multiplier is defined by the KKT equations of one particular mesh: a finite list of numbers, with no idea that any continuous problem exists. The costate is defined by the Euler-Lagrange argument of lesson two: a function of time, the multiplier on a differential equation that must hold at every instant.

Nothing forces two such different objects to line up. That they do — for the right node families, under an explicit scaling, converging as the mesh is refined — is a real claim about how Gauss-type quadrature and differentiation matrices fit together. Some choices even fail: the plain Lobatto version needs extra "closure" conditions before its multipliers map cleanly, which is one reason Gauss and Radau nodes became the favorites. That is why the result carries a name and a proof.
:::

::: example Checking a collocation solve against the shooting costate
Take the minimum-time orbit transfer of lesson four ($r_0 = 7000\,\mathrm{km}$ to $r_1 = 9000\,\mathrm{km}$, $100\,\mathrm{N}$ of thrust on a $1200\,\mathrm{kg}$ spacecraft). Indirect shooting found the starting radial costate $\lambda_r(0) = -76.722$, in nondimensional units where length is measured in units of $7000\,\mathrm{km}$ and time in units of $927.64\,\mathrm{s}$.

Lesson eight solved the same transfer by Hermite-Simpson collocation, never mentioning a costate. That NLP has a constraint $r(0) = r_0$ pinning the starting radius, and so it has a multiplier on that constraint.

**Step 1: read the multiplier.** On a $20$-segment mesh, the solver's multiplier on the $r(0)$ constraint has size $76.914$.

**Step 2: measure the same thing from outside.** NLP sensitivity theory says that multiplier equals $\partial t_f^\star/\partial r_0$, the rate at which the best flight time changes when the starting radius moves. Check that directly: re-solve the whole NLP with $r_0$ nudged up and down by $10^{-4}$ and take the central difference,

$$
\frac{t_f^\star(r_0 + 10^{-4}) - t_f^\star(r_0 - 10^{-4})}{2\times10^{-4}} = -76.914 .
$$

The size matches Step 1. The sign is fixed by how the constraint was written.

**Step 3: compare with the costate.** $-76.914$ against the shooting value $-76.722$: they differ by $0.25\,\%$. The two calculations share no code, no formulas and no intermediate variables.

**Step 4: refine the mesh.** On a $40$-segment mesh the multiplier becomes $76.7221$, matching the costate to within three parts per million. The multiplier is converging to the costate as the mesh is refined — the covector mapping theorem, watched happening.

**Sanity check in real units.** $\lambda_r(0) = -76.72$ means one extra nondimensional unit of starting radius saves $76.72$ time units. One kilometer is $1/7000$ of a length unit, so it saves $76.72 \times (1/7000) \times 927.64 \approx 10.2\,\mathrm{s}$ of a flight lasting $11\,475\,\mathrm{s}$ — starting $1\,\mathrm{km}$ higher (at the same speed) saves about ten seconds. A small, sensible trade.
:::

What does this buy you in practice? A free consistency check on any direct solution. Map the multipliers into a costate history, then test it against the necessary conditions of lessons two and three:

- the Hamiltonian built from the reconstructed costate should be constant along the flight, for a time-invariant problem;
- it should be zero at $t_f$ when the final time is free;
- the switching function built from it should change sign exactly where the solution's control switches.

A mismatch usually means one of two things: the mesh is too coarse (the kink trouble from the warning above), or the problem is so badly scaled that the multipliers are numerically corrupted — the subject of a later lesson. Real mission designers use exactly this kind of check; pseudospectral tools have been trusted with [[flight operations|zpm]] partly because their costates can be inspected.

::: warning Compare shapes and signs with care
Multipliers from two different tools can differ in sign (constraint written as $a - b$ or $b - a$) and in scale (quadrature weights, time scaling, cost scaling). Before declaring a mismatch, check that you applied the right mapping for *your* transcription. A costate that is off by a constant factor everywhere is almost always a scaling convention, not a wrong answer.
:::

## Check yourself

::: check
Both $e^{-t}$ and $|t|$ are continuous, bounded, and never blow up on $[-1,1]$. Why does a high-degree polynomial fit converge spectrally for the first and only algebraically for the second?
:::

::: answer
Spectral convergence needs more than continuity: it needs the function to be analytic, equal to a convergent power series around every point. Then its Chebyshev or Legendre coefficients shrink geometrically, and throwing away everything past degree $N$ costs only about $\rho^{-N}$. The function $|t|$ has a kink at $0$: its slope jumps, so no single power series can describe it across that point. Its coefficients shrink only like $1/k^2$, the tail adds up to about $1/N$, and however high the degree, part of the polynomial's effort is spent fighting the corner. The fit confirmed it: error falling like $N^{-0.96}$.
:::

::: check
The orbit check used a nudge of $10^{-4}$ in $r_0$. A colleague tries $10^{-8}$, hoping for a sharper answer. What is likely to happen, and why?
:::

::: answer
It will probably get worse, not better. Each NLP is solved only to a finite tolerance (here roughly $10^{-12}$ in the constraint residuals). With a nudge of $10^{-8}$, the true change in $t_f^\star$ is only about $77\times10^{-8} \approx 8\times10^{-7}$, and the solver noise from re-solving twice becomes a large share of that. The difference quotient then measures noise. This is the usual finite-difference trade-off from the optimization module: too large a step and truncation error dominates, too small and rounding or solver noise dominates. A step in between, like $10^{-4}$, gets both errors small.
:::

::: check
A team solves an ascent with one high-degree pseudospectral polynomial across a staging event. The solver reports convergence, but the reconstructed switching function oscillates wildly near the staging time. Diagnose it with this lesson's ideas.
:::

::: answer
Staging is a genuine discontinuity: mass jumps, and usually the available thrust does too. The trajectory is not analytic across that instant, so one global polynomial is fighting a kink. Spectral convergence has collapsed to algebraic right there, and the differentiation matrix, built for one smooth polynomial, produces Gibbs-style ringing in the states and in the multipliers mapped from them. The fix is to split the mesh at the known staging time into two pseudospectral segments, one per stage, each smooth and each free to converge spectrally. Adding more nodes to the single polynomial would not remove the ringing near the jump.
:::

::: check
Why does "the multiplier converges to the costate" need a proof? Isn't a multiplier a multiplier?
:::

::: answer
They are defined in different settings. The NLP multipliers come from the KKT equations of one specific discretization: algebra on a mesh that makes no reference to a continuous problem. The costate comes from the calculus-of-variations argument: a function of time multiplying a differential constraint that holds at every instant. Showing that these two independently defined objects correspond, under an explicit scaling involving the quadrature weights, and converge as the mesh is refined, is a nontrivial fact about Gauss-type quadrature and differentiation matrices. Some node choices even need extra conditions before the mapping works, which is proof enough that it is not automatic.
:::

::: check
Using $\lambda_r(0) = -76.72$ (length unit $7000\,\mathrm{km}$, time unit $927.64\,\mathrm{s}$), estimate how much flight time the orbit transfer saves if it starts $2\,\mathrm{km}$ higher at the same speed.
:::

::: answer
Convert $2\,\mathrm{km}$ to length units: $2/7000 = 2.857\times10^{-4}$. Multiply by the price: $\Delta t_f \approx -76.72\times2.857\times10^{-4} = -0.02192$ time units. Convert to seconds: $0.02192\times927.64 \approx 20.3\,\mathrm{s}$ saved. Twice the one-kilometer answer, as a linear estimate should be for a small nudge.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Algebraic convergence | Error $\approx C/N^p$ for a fixed $p$; trapezoid $O(h^2)$, Hermite-Simpson $O(h^4)$ |
| Spectral convergence | Error falls faster than any $C/N^p$, typically like $\rho^{-N}$; needs an analytic solution |
| Measured | $\dot x=-x$ with LGL nodes: $1.18\times10^{-2}$ at $N=3$ down to $8.7\times10^{-15}$ at $N=13$ |
| Smooth vs kinked | $1/(1+16x^2)$: error falls $1120\times$ from $N=4$ to $32$, exponential fit $R^2=0.9995$; $\lvert x\rvert$: only $7.3\times$, power-law fit $R^2=0.9999$ with slope $-0.96$ |
| Kinks on vehicles | Switches, constraint activations, staging; fix with hp-adaptive breaks at the junctions |
| Covector mapping theorem | NLP multipliers, correctly scaled (quadrature weights, signs), converge to the costates |
| Orbit check | $20$ segments: multiplier $76.914$, re-solve $-76.914$, costate $-76.722$ ($0.25\,\%$); $40$ segments: $76.7221$ |
| Free checks | Reconstructed costate should make $H$ constant, $H(t_f)=0$ if $t_f$ is free, and switch where the control switches |

So far the mesh — where the nodes sit — has been handed to you. The next lesson turns it into a decision with its own rule: measure where the mesh is failing, refine there, and stop when the measurement says it is good enough.

::: context machine-precision The floor of computer arithmetic
Ordinary computer numbers ("double precision") carry about 16 significant digits. The gap between $1$ and the next number the computer can store is about $2.2\times10^{-16}$. Any calculation with many steps collects rounding errors of roughly this size, so errors near $10^{-14}$ or $10^{-15}$ mean "as good as this computer can do". Past that point, more nodes cannot help; they only add rounding.
:::

::: context error-plot Straight lines on the right axes
The two error columns from the smooth-versus-kinked example, plotted with the error on a logarithmic scale (each gridline is ten times smaller than the one above). Spectral convergence falls along a straight, steep line. Algebraic convergence bends and flattens out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="15" x2="50" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="165" x2="340" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="50" y1="20" x2="340" y2="20"/><line x1="50" y1="55" x2="340" y2="55"/>
    <line x1="50" y1="90" x2="340" y2="90"/><line x1="50" y1="125" x2="340" y2="125"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="24">1</text><text x="45" y="59">0.1</text><text x="45" y="94">0.01</text>
    <text x="45" y="129">0.001</text><text x="45" y="164">0.0001</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="132" y="180">10</text><text x="215" y="180">20</text><text x="297" y="180">30</text>
    <text x="195" y="196">degree N</text>
  </g>
  <polyline points="82.9,36.0 148.8,68.7 214.7,97.5 313.5,142.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="82.9,50.4 148.8,66.2 214.7,73.7 313.5,80.8" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g fill="#1d6fd1"><circle cx="82.9" cy="36.0" r="3.5"/><circle cx="148.8" cy="68.7" r="3.5"/><circle cx="214.7" cy="97.5" r="3.5"/><circle cx="313.5" cy="142.7" r="3.5"/></g>
  <g fill="#b4232c"><circle cx="82.9" cy="50.4" r="3.5"/><circle cx="148.8" cy="66.2" r="3.5"/><circle cx="214.7" cy="73.7" r="3.5"/><circle cx="313.5" cy="80.8" r="3.5"/></g>
  <text x="250" y="140" font-size="12" fill="#1d6fd1" text-anchor="end">smooth: spectral</text>
  <text x="330" y="70" font-size="12" fill="#b4232c" text-anchor="end">kink |x|: algebraic</text>
</svg>
```
:::

::: context r-squared Scoring a straight-line fit
$R^2$ ("R squared") measures how much of the up-and-down in your data a fitted line explains. Take the spread of the data around its own average, then the spread left over around the line. $R^2 = 1 - \text{leftover}/\text{original}$. A perfect fit leaves nothing over, so $R^2 = 1$. With four points almost any trend fits somewhat, which is why the lesson compares two fits side by side: $0.9999$ against $0.92$ is a clear verdict, even when $0.92$ alone sounds decent.
:::

::: context gibbs Ringing around a jump
Force one smooth polynomial through a sudden jump and it overshoots on both sides, then wiggles. This is the degree-$20$ polynomial through the $21$ Legendre-Gauss-Lobatto samples of a step from $-1$ to $+1$, drawn to scale. It peaks near $1.28$ where the truth is $1$. More nodes squeeze the wiggles closer to the jump but do not make the overshoot go away. The effect is named after J. Willard Gibbs, who described its Fourier-series version in 1899.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="330" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <path d="M30,160 L180,160 L180,40 L330,40" fill="none" stroke="#1f2a44" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M30,160.0 L34,160.9 L38,160.8 L41,158.5 L45,158.4 L49,160.4 L52,162.1 L56,162.1 L60,160.3 L64,158.3 L68,157.2 L71,157.6 L75,159.5 L79,161.7 L83,163.3 L86,163.5 L90,162.2 L94,159.9 L98,157.5 L101,155.8 L105,155.5 L109,156.8 L112,159.3 L116,162.3 L120,164.8 L124,166.1 L128,165.6 L131,163.3 L135,159.7 L139,155.7 L142,152.5 L146,150.9 L150,151.8 L154,155.2 L158,160.7 L161,167.1 L165,172.9 L169,176.5 L172,176.2 L176,170.8 L180,160.0 L184,144.0 L188,123.9 L191,101.5 L195,78.9 L199,58.3 L203,41.6 L206,30.0 L210,24.1 L214,23.4 L218,26.9 L221,32.9 L225,39.5 L229,45.1 L232,48.4 L236,49.0 L240,47.0 L244,43.2 L248,39.0 L251,35.6 L255,34.0 L259,34.4 L262,36.7 L266,39.9 L270,42.8 L274,44.4 L278,44.1 L281,42.1 L285,39.3 L289,37.1 L292,36.5 L296,37.9 L300,40.4 L304,42.5 L308,42.5 L311,40.5 L315,38.1 L319,38.3 L322,40.9 L326,41.0 L330,40.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="34" y="190" font-size="11" fill="#1f2a44">−1</text>
  <text x="180" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="326" y="190" font-size="11" text-anchor="end" fill="#1f2a44">+1</text>
  <text x="218" y="18" font-size="11" fill="#b4232c">overshoot to 1.28</text>
  <text x="40" y="140" font-size="11" fill="#1f2a44">true step (dashed)</text>
</svg>
```
:::

::: context hp-adaptive What h and p stand for
In mesh language, $h$ is the length of a segment and $p$ is the degree of the polynomial on it. An **h-method** improves accuracy by cutting segments shorter (trapezoid and Hermite-Simpson work this way). A **p-method** keeps one segment and raises the degree (pure pseudospectral). An **hp-method** does both: short segments where the solution has corners, high degree where it is smooth. Here a switch splits the flight into two pieces, each with its own cluster of Lobatto nodes, so no polynomial has to cross the corner.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="35" x2="110" y2="85" stroke="#b4232c" stroke-width="2.5"/>
  <text x="110" y="28" font-size="12" text-anchor="middle" fill="#b4232c">switch: mesh break</text>
  <g fill="#1d6fd1">
    <circle cx="20" cy="60" r="4"/><circle cx="27.6" cy="60" r="4"/><circle cx="43.9" cy="60" r="4"/><circle cx="65" cy="60" r="4"/>
    <circle cx="86.1" cy="60" r="4"/><circle cx="102.4" cy="60" r="4"/><circle cx="110" cy="60" r="4"/>
    <circle cx="129.5" cy="60" r="4"/><circle cx="171.1" cy="60" r="4"/><circle cx="225" cy="60" r="4"/>
    <circle cx="278.9" cy="60" r="4"/><circle cx="320.5" cy="60" r="4"/><circle cx="340" cy="60" r="4"/>
  </g>
  <text x="65" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">coast piece</text>
  <text x="225" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">burn piece</text>
</svg>
```

GPOPS-II, the commercial MATLAB tool from this module's reading list, is built around exactly this idea with Radau nodes.
:::

::: context kkt The KKT conditions in one breath
From the optimization module: at a best point of "minimize $f(\mathbf{z})$ subject to $\mathbf{c}(\mathbf{z}) = \mathbf{0}$", the slope of the cost is balanced by the slopes of the constraints, $\nabla f + \nabla\mathbf{c}^\top\boldsymbol\mu = \mathbf{0}$, for some vector of multipliers $\boldsymbol\mu$ (read "mu"). Inequality constraints add sign rules and "complementarity": a multiplier is zero unless its constraint is pressing. The names are Karush, Kuhn and Tucker. Every NLP solver in this module, IPOPT included, returns $\boldsymbol\mu$ alongside $\mathbf{z}^\star$.
:::

::: context quadrature-weight Weights on the nodes
A quadrature rule approximates an integral by a weighted sum of samples: $\int_{-1}^{1} g(\tau)\,d\tau \approx \sum_k w_k\, g(\tau_k)$. Each node $\tau_k$ gets its own weight $w_k$, roughly the length of interval that node "stands for". Clustered nodes near the ends get small weights; lonely nodes in the middle get large ones. Since a defect multiplier prices a constraint that covers a stretch of time about $w_k$ long, dividing by $w_k$ turns "price for this chunk" into "price per unit time" — which is what a costate is.
:::

::: context covector Vectors and covectors
A vector is a change of state: "move $3\,\mathrm{m}$ up and $1\,\mathrm{m/s}$ faster". A covector is a machine that eats such a change and returns a number: "that change costs $0.05\,\mathrm{kg}$ of propellant". Written out, a covector is a row of prices and the result is the dot product $\boldsymbol\lambda^\top\delta\mathbf{x}$. Costates and multipliers are both covectors in this sense, which is where the theorem gets its name. I. Michael Ross and Fariba Fahroo at the Naval Postgraduate School developed the result for Legendre pseudospectral methods in the early 2000s.
:::

::: context zpm Pseudospectral answers in orbit
In November 2006 and March 2007 the International Space Station was rotated through large angles using only its momentum-storing gyroscopes, with no thruster propellant — the "zero-propellant maneuver". The attitude path was designed by pseudospectral optimal control, using the DIDO software associated with Ross. Part of why engineers trusted a numerically computed path on a real station was that its costates could be checked against the Minimum Principle, as this lesson describes.
:::
