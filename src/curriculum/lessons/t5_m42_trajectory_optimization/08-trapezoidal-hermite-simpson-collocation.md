---
id: l08-trapezoidal-hermite-simpson-collocation
title: "Direct collocation: trapezoidal and Hermite-Simpson defects"
minutes: 16
covers:
  - "Direct collocation: trapezoidal and Hermite-Simpson defect constraints"
---

A defect constraint, two lessons ago, was left as an abstract placeholder: some algebraic function of a segment's endpoints, built from a quadrature rule, that vanishes when the segment is consistent with the dynamics. This lesson builds the two placeholders that matter most in practice, derives each from the quadrature rule underneath it rather than stating a formula to memorise, and then solves the orbit transfer that the shooting lessons struggled with — from a straight line and nothing else.

## Trapezoidal collocation

The state change across a segment is, exactly, $\mathbf{x}_{k+1}-\mathbf{x}_k = \int_{t_k}^{t_{k+1}}\mathbf{f}\big(\mathbf{x}(t),\mathbf{u}(t),t\big)\,dt$. Approximate that integral with the simplest quadrature rule that uses both endpoints — the trapezoidal rule, $\int_{t_k}^{t_{k+1}}g\,dt \approx \tfrac{h}{2}\big(g(t_k)+g(t_{k+1})\big)$ — applied to $g=\mathbf{f}$, and rearrange into a residual that should vanish:

$$
\mathbf{d}_k = \mathbf{x}_{k+1}-\mathbf{x}_k - \frac{h}{2}\big(\mathbf{f}_k+\mathbf{f}_{k+1}\big), \qquad \mathbf{f}_k \equiv \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k,t_k).
$$

The control is implicitly assumed piecewise linear between $\mathbf{u}_k$ and $\mathbf{u}_{k+1}$ (consistent with evaluating $\mathbf{f}$ only at the two node values), which is the coarsest control representation this module uses and the reason trapezoidal collocation is the cheapest scheme to set up and the least accurate per node.

## Hermite-Simpson collocation

Do better by fitting a cubic through the segment's endpoint *values and derivatives* — a Hermite interpolant, using $\mathbf{f}_k,\mathbf{f}_{k+1}$ as the derivatives $\dot{\mathbf{x}}$ at the two ends, which is available for free since the dynamics supply it. In the local variable $\tau=(t-t_k)/h\in[0,1]$, the cubic Hermite basis functions are $H_{00}=2\tau^3-3\tau^2+1$, $H_{10}=\tau^3-2\tau^2+\tau$, $H_{01}=-2\tau^3+3\tau^2$, $H_{11}=\tau^3-\tau^2$, and the interpolant is $\mathbf{p}(\tau) = \mathbf{x}_kH_{00}+h\mathbf{f}_kH_{10}+\mathbf{x}_{k+1}H_{01}+h\mathbf{f}_{k+1}H_{11}$. Evaluated at the midpoint $\tau=\tfrac12$, where $H_{00}=H_{01}=\tfrac12$ and $H_{10}=-H_{11}=\tfrac18$,

$$
\mathbf{x}_{\text{mid}} = \mathbf{p}(\tfrac12) = \frac{\mathbf{x}_k+\mathbf{x}_{k+1}}{2} + \frac{h}{8}\big(\mathbf{f}_k-\mathbf{f}_{k+1}\big),
$$

exactly the compressed Hermite-Simpson midpoint formula. Take the control at the midpoint by the simplest consistent choice, linear interpolation $\mathbf{u}_{\text{mid}} = \tfrac12(\mathbf{u}_k+\mathbf{u}_{k+1})$, evaluate $\mathbf{f}_{\text{mid}} = \mathbf{f}(\mathbf{x}_{\text{mid}},\mathbf{u}_{\text{mid}},t_{\text{mid}})$, and apply **Simpson's rule** — $\int_{t_k}^{t_{k+1}}g\,dt \approx \tfrac{h}{6}\big(g(t_k)+4g(t_{\text{mid}})+g(t_{k+1})\big)$, exact for any cubic — to the same integral as before:

$$
\mathbf{d}_k = \mathbf{x}_{k+1}-\mathbf{x}_k - \frac{h}{6}\big(\mathbf{f}_k+4\mathbf{f}_{\text{mid}}+\mathbf{f}_{k+1}\big).
$$

Two more function evaluations than trapezoidal per segment ($\mathbf{f}_{\text{mid}}$, built from an $\mathbf{x}_{\text{mid}}$ that was itself free), for an accuracy gain the next section quantifies rather than asserts.

::: key The two defects this module works with
Trapezoidal: $\mathbf{d}_k = \mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{2}(\mathbf{f}_k+\mathbf{f}_{k+1})$. Hermite-Simpson: $\mathbf{x}_{\text{mid}}=\frac{\mathbf{x}_k+\mathbf{x}_{k+1}}{2}+\frac{h}{8}(\mathbf{f}_k-\mathbf{f}_{k+1})$, $\mathbf{d}_k=\mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{6}(\mathbf{f}_k+4\mathbf{f}_{\text{mid}}+\mathbf{f}_{k+1})$. Both are exact quadratures of $\int\mathbf{f}\,dt$ applied to a polynomial model of the segment — degree one (piecewise-linear control, exact for constant $\mathbf{f}$) versus degree three (exact for cubic $\mathbf{x}(t)$).
:::

::: example Measuring the order, not assuming it
Sample the exact solution $x(t)=e^{-t}$ of $\dot x=-x$ on a uniform mesh over $[0,2]$ and evaluate each defect — a converged NLP will drive these to zero, so measuring how close the *exact* trajectory already comes is a direct probe of the scheme's accuracy, independent of any solver.

| $h$ | trapezoidal $\max\lvert d_k\rvert$ | Hermite-Simpson $\max\lvert d_k\rvert$ |
| --- | --- | --- |
| $0.400$ | $4.384\times10^{-3}$ | $1.168\times10^{-5}$ |
| $0.200$ | $6.038\times10^{-4}$ | $4.024\times10^{-7}$ |
| $0.100$ | $7.929\times10^{-5}$ | $1.321\times10^{-8}$ |
| $0.050$ | $1.016\times10^{-5}$ | $4.233\times10^{-10}$ |
| $0.025$ | $1.286\times10^{-6}$ | $1.340\times10^{-11}$ |

A log-log fit of these five points gives a local order of $2.94$ for trapezoidal and $4.94$ for Hermite-Simpson — close enough to the theoretical $3$ and $5$ that the gap is the fit's own asymptotic-regime error, not a mistake in the scheme. The ratio between successive rows climbs toward $2^3=8$ (trapezoidal) and $2^5=32$ (Hermite-Simpson) as $h$ shrinks: at the finest pair here, $7.90$ and $31.6$ respectively. A **local** defect order of $p$ corresponds to a **global** trajectory error of order $p-1$ once the defects are actually driven to zero across a whole mesh — the standard one-order loss between a one-step truncation error and the accumulated error of marching across many steps — giving the second and fourth order the flashcards for this module state directly. Halving the mesh spacing is worth roughly $4\times$ for trapezoidal and $16\times$ for Hermite-Simpson, which is why doubling a Hermite-Simpson mesh is usually cheaper than switching to a much finer trapezoidal one for the same accuracy target.
:::

## Closing the loop: the orbit transfer, this time without a costate

::: example The same minimum-time transfer, solved from a straight line
The shooting lesson's orbit transfer — $r_0=7000\,\mathrm{km}\to r_1=9000\,\mathrm{km}$, $T_{\max}=100\,\mathrm{N}$, $I_{sp}=1800\,\mathrm{s}$, minimum time — needed a converged costate to even define the problem, and only $5$ of $25$ random costate guesses produced an answer at all. Transcribe the identical physical problem with Hermite-Simpson defects instead: three states $(r,v_r,v_t)$, one control (the steering angle $\beta$), free final time as an extra decision variable, $N$ segments.

The initial guess needs no costate, no primer vector, no insight into the necessary conditions at all — a straight-line interpolation of $r$ and $v_t$ between their known endpoints, $v_r\equiv0$, and $\beta\equiv0$ (thrust pointed purely tangentially, the simplest guess a person would write without thinking about it). Handed to a general-purpose constrained optimiser (sequential quadratic programming, the same family the optimization module covers), this converges — reliably, from that one naive guess, no retries — to $t_f = 12.372090$ (nondimensional units) at $N=20$ segments in under two seconds, and $t_f=12.370385$ at $N=40$, both agreeing with the shooting lesson's indirectly-computed $t_f=12.370316$ to four or five significant figures, tightening as the mesh refines exactly as the order analysis above predicts.

Nothing about the collocation formulation ever asked what a costate was. The optimiser's own Lagrange multipliers on the defect constraints exist — every NLP solved this way has them — and a later lesson shows precisely how those multipliers reconstruct the costate history the indirect approach had to guess its way toward, as a diagnostic available *after* solving rather than a prerequisite for solving at all.
:::

::: warning A converged collocation solve can still be lying about the control between nodes
The defect constraints only see $\mathbf{u}_k$ and $\mathbf{u}_{k+1}$ (trapezoidal) or those two plus an interpolated midpoint (Hermite-Simpson) — nothing constrains what the *true* optimal control does strictly between mesh points beyond what those interpolants assume. If the real optimal control has structure finer than the mesh can represent — a bang-bang switch that happens inside a segment rather than at a node, a singular arc thinner than $h$ — the defects can be satisfied to tight tolerance by a smoothed-out approximation that never actually visits the true control history. A converged solve with a smooth-looking control where physical intuition says there should be a sharp corner is a mesh-resolution question, taken up directly in a later lesson, not a reason to trust the smooth answer.
:::

## Check yourself

::: check
Derive, from the Hermite basis functions given in the text, why $H_{10}(1/2) = -H_{11}(1/2)$ — the reason the midpoint formula has $\mathbf{f}_k-\mathbf{f}_{k+1}$ rather than $\mathbf{f}_k+\mathbf{f}_{k+1}$.
:::

::: answer
$H_{10}(\tau)=\tau^3-2\tau^2+\tau$ at $\tau=\tfrac12$ gives $\tfrac18-\tfrac12+\tfrac12=\tfrac18$. $H_{11}(\tau)=\tau^3-\tau^2$ at $\tau=\tfrac12$ gives $\tfrac18-\tfrac14=-\tfrac18$. So $H_{10}(\tfrac12)=-H_{11}(\tfrac12)=\tfrac18$ exactly, and the midpoint value $h\mathbf{f}_kH_{10}(\tfrac12)+h\mathbf{f}_{k+1}H_{11}(\tfrac12) = \tfrac{h}{8}\mathbf{f}_k-\tfrac{h}{8}\mathbf{f}_{k+1} = \tfrac{h}{8}(\mathbf{f}_k-\mathbf{f}_{k+1})$ follows directly from substituting those two numbers — the minus sign is a property of where the midpoint sits relative to the two derivative-weighting basis functions, not a separate assumption.
:::

::: check
Why does measuring the defect of the *exact* solution, as the order-verification example does, establish the scheme's convergence order without ever solving an NLP?
:::

::: answer
The defect is, by construction, a measure of how well a candidate trajectory satisfies the discretised dynamics; evaluating it on the exact continuous solution isolates the *quadrature's* error from any error the optimiser might separately introduce while searching for a feasible point. If the exact solution already drives the defect to near zero at a rate of $h^p$, then a converged NLP — which drives the defect to numerical zero regardless of scheme — is implicitly interpolating a trajectory that has to be within $O(h^p)$ of the true one, because the true one is the trajectory the defect was measuring the deviation from in the first place. Solving the NLP tells you the scheme found *a* feasible, optimal-looking trajectory; measuring the exact solution's defect tells you how good that trajectory can possibly be for a given $h$, independent of solver behaviour.
:::

::: check
The orbit-transfer collocation example converged from $\beta\equiv0$ — thrust pointed purely tangentially the whole way, clearly not the true steering law. Why did such a crude guess work here when the shooting lesson's plausible-looking costate guesses mostly failed?
:::

::: answer
The guess only had to be dynamically *plausible*, not close to optimal, because collocation does not propagate a small error through an entire horizon the way single shooting does — every node's state is its own free variable, corrected locally by the solver rather than inherited by compounding an early mistake forward. A poor control guess produces large *initial* defect violations, which a Newton-type NLP solver is built to reduce iteratively from a badly infeasible starting point; a poor costate guess in indirect shooting produces a trajectory that may not even resemble anything physical by the time it reaches $t_f$, because there was no mechanism correcting it along the way. The comparison is exactly the point of transcribing the same physical problem twice: the direct method's tolerance for a bad initial guess is a structural property of having many local unknowns instead of few global ones, not a coincidence of this particular transfer.
:::

::: check
A Hermite-Simpson mesh with $N=40$ segments gives a trajectory error roughly $16\times$ smaller than $N=20$. Estimate how many segments a trapezoidal scheme would need to match the $N=40$ Hermite-Simpson accuracy, given trapezoidal's global error falls as $h^2$.
:::

::: answer
Hermite-Simpson at $N=40$ has roughly $16\times$ smaller error than at $N=20$ (global order $4$: halving $h$ buys $2^4=16$). Trapezoidal's global error falls as $h^2$, so matching a further $16\times$ reduction beyond some trapezoidal baseline needs $h$ smaller by a factor of $\sqrt{16}=4$, i.e., $4\times$ as many segments for every further halving Hermite-Simpson enjoys "for free" from its extra order. Concretely: to go from whatever accuracy $N=20$ (either scheme) already has down to Hermite-Simpson's $N=40$ level, trapezoidal needs multiple doublings of $N$ where Hermite-Simpson needed one — the node count grows the NLP linearly, so this is exactly why the earlier order-verification example calls doubling a Hermite-Simpson mesh usually cheaper than chasing the same accuracy with a finer trapezoidal one.
:::

## Summary

| Object | Statement |
| --- | --- |
| Trapezoidal defect | $\mathbf{d}_k=\mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{2}(\mathbf{f}_k+\mathbf{f}_{k+1})$; piecewise-linear control; local $O(h^3)$, global $O(h^2)$ |
| Hermite-Simpson midpoint | $\mathbf{x}_{\text{mid}}=\frac{\mathbf{x}_k+\mathbf{x}_{k+1}}{2}+\frac{h}{8}(\mathbf{f}_k-\mathbf{f}_{k+1})$, from the cubic Hermite interpolant at $\tau=\tfrac12$ |
| Hermite-Simpson defect | $\mathbf{d}_k=\mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{6}(\mathbf{f}_k+4\mathbf{f}_{\text{mid}}+\mathbf{f}_{k+1})$; local $O(h^5)$, global $O(h^4)$ |
| Measured local order | Trapezoidal $2.94$, Hermite-Simpson $4.94$ (fit against theory's $3$ and $5$) |
| Refinement ratios | Trapezoidal $\to8\times$, Hermite-Simpson $\to32\times$ per halving of $h$, as $h\to0$ |
| Orbit transfer, direct | Converges from $\beta\equiv0$, straight-line $r,v_t$: $t_f=12.372090$ ($N=20$), $12.370385$ ($N=40$), vs. shooting's $12.370316$ |
| Why the naive guess works | Every node is a locally-correctable free variable; error does not compound across the whole horizon the way single shooting's does |
| Mesh caveat | Control structure finer than $h$ (a switch, a thin singular arc) can be invisible to a converged, tight-tolerance solve |

Trapezoidal and Hermite-Simpson are both fixed-degree, local schemes — add nodes, and accuracy improves at a fixed polynomial rate. The next two lessons take the opposite strategy: fit one high-degree polynomial to the whole mesh at once, and see accuracy improve at a rate no fixed polynomial order can match, as long as the solution stays smooth enough to deserve it.
