---
id: l10-spectral-convergence-covector-mapping
title: Spectral convergence and the covector mapping theorem
minutes: 16
covers:
  - "Spectral convergence, the covector mapping theorem, and what pseudospectral costates buy you"
---

The previous lesson built the machinery — node families that avoid the Runge phenomenon, a differentiation matrix that reproduces a polynomial's derivative exactly. This lesson cashes it in: how fast a pseudospectral solve actually converges as $N$ grows, the one precondition that determines whether that rate is spectacular or merely respectable, and a genuinely useful by-product that has nothing to do with accuracy at all — a way to check a direct solution against the Pontryagin theory of the early lessons without ever having guessed a costate.

## Spectral convergence, measured

Solve $\dot x=-x$, $x(0)=1$, on $[0,2]$ by Legendre-Gauss-Lobatto pseudospectral collocation — the differentiation-matrix equation of the previous lesson, with the known initial value replacing one collocation row — and compare the result to the exact $x(t)=e^{-t}$ at every node:

| $N$ | max error |
| --- | --- |
| $3$ | $1.180\times10^{-2}$ |
| $5$ | $1.564\times10^{-4}$ |
| $7$ | $8.861\times10^{-7}$ |
| $9$ | $2.874\times10^{-9}$ |
| $11$ | $6.102\times10^{-12}$ |
| $13$ | $9.326\times10^{-15}$ |

Thirteen nodes reach double-precision machine epsilon. No fixed-order scheme in this module gets anywhere close: trapezoidal would need roughly $\sqrt{10^{13}}\approx3\times10^6$ nodes for the same accuracy (error falling as $h^2$), Hermite-Simpson around $\sqrt[4]{10^{13}}\approx600$. This is **spectral convergence** — error falling faster than *any* fixed power of $1/N$ — and it comes from a genuine mathematical fact about approximating smooth functions by global polynomials: the error of the best degree-$N$ polynomial approximation to an **analytic** function (one equal to its own Taylor series in a neighbourhood of the interval) shrinks geometrically in $N$, not merely polynomially. $e^{-t}$ is entire — analytic everywhere — so nothing stands in the way.

::: key Spectral convergence, and its one precondition
Error decays faster than $O(N^{-p})$ for every $p$ — but only when the function being represented is smooth (analytic) on the interval. The precondition is doing all the work; break it, and the guarantee is gone.
:::

## Breaking it on purpose

::: example Smooth against kinked, fitted honestly
Interpolate two functions at Legendre-Gauss-Lobatto nodes of increasing degree on $[-1,1]$: a smooth one, $g(x)=1/(1+16x^2)$, analytic on the interval, and a merely continuous one, $\lvert x\rvert$, whose derivative jumps at the origin. Measuring the worst-case interpolation error against each function's true values:

| $N$ | smooth, max error | $\lvert x\rvert$, max error |
| --- | --- | --- |
| $4$ | $0.3490$ | $0.1349$ |
| $12$ | $0.04054$ | $0.04787$ |
| $20$ | $0.006089$ | $0.02914$ |
| $32$ | $0.0003125$ | $0.01837$ |

The smooth function's error falls by a factor of over $1100$ from $N=4$ to $N=32$; the kinked function's falls by only a factor of about $7.3$ over the identical range. Fitting each dataset against both an exponential-in-$N$ model (the signature of spectral convergence) and a power-law-in-$N$ model (algebraic convergence) makes the qualitative difference precise: the smooth function's error fits the exponential model with $R^2=0.9997$ against only $R^2=0.927$ for the power law, while the kinked function fits the power law with $R^2=0.9999$ against $R^2=0.924$ for the exponential — and the fitted power-law exponent for $\lvert x\rvert$ is $-0.96$, matching the classical $O(1/N)$ rate for interpolating a merely Lipschitz function almost exactly. Both curves look roughly like "error goes down" on a casual glance; only the fit distinguishes a scheme that is earning its keep from one that has quietly stopped.
:::

::: warning A bang-bang switch, a constraint activation, or a staging event is exactly this kind of kink
Every non-smooth feature a real trajectory can have — a thrust switching on or off, a path constraint turning active, a stage separating — is a point where some derivative of the state or control is discontinuous, precisely the condition that collapses spectral convergence to merely algebraic. A pseudospectral mesh applied across such a point without acknowledging it there is spending enormous algebraic effort (a dense, high-degree differentiation matrix) for the convergence rate of a scheme with none of pseudospectral's advantages. The fix is **hp-adaptive** meshing: locate the discontinuity, put a break in the mesh exactly there, and run a separate high-degree polynomial on each smooth piece — spectral convergence resumes on each piece individually, because each piece is smooth again. A vehicle trajectory with staging and throttle bounds is planned around exactly this: mesh breakpoints at the known or suspected discontinuities, not a single polynomial pretending they are not there.
:::

## The covector mapping theorem

A direct transcription's Lagrange multipliers are not decoration — the optimizer computing $\mathbf{z}^\star$ produces them as a side effect of satisfying the KKT conditions of the NLP, the same finite-dimensional theory the optimization module covers for any constrained problem. Multipliers exist on the defect constraints, the boundary constraints, everything. The **covector mapping theorem** says that, for the right node family and with the right scaling, those multipliers converge to the continuous costate, sampled at the corresponding nodes — turning them from an implementation detail into a check against the whole Pontryagin apparatus of the early lessons, computed *after* a direct solve rather than guessed *before* an indirect one. The mapping is not simply "the multiplier is the costate" — the precise scaling involves the quadrature weights associated with the node family, which is exactly why the theorem needed a proof rather than being definitional — but the practical content is that the two objects, derived from completely different theories, land on the same numbers.

::: example Checking a direct solve against a shooting-derived costate
The minimum-time orbit transfer solved by Hermite-Simpson collocation two lessons ago has, on the NLP, a multiplier on its initial-condition constraint $r_0 = 7000\,\mathrm{km}$ — and standard nonlinear-programming sensitivity theory says that multiplier equals $\partial J^\star_{\text{NLP}}/\partial r_0$, the rate at which the optimal cost changes if the boundary data itself moves, exactly the shadow-price relationship derived by hand for the costate in an earlier lesson. Rather than dig the multiplier out of the solver's internals, compute that sensitivity the direct way: re-solve the identical collocation NLP with $r_0$ perturbed by $\pm10^{-4}$ (nondimensional units) and take the central difference of the optimal flight time,

$$
\frac{\Delta t_f^\star}{\Delta r_0} = -76.914 \qquad\text{(nondimensional)},
$$

against the indirectly-shot $\lambda_r(0) = -76.722$ from three lessons ago — agreement to within $0.25\,\%$, two calculations that share no code, no formulas and no intermediate variables, landing on the same number because they are measuring the same underlying quantity from opposite directions. This is the covector mapping theorem's content made concrete: the direct method's multiplier structure is not a numerical curiosity sitting next to the real answer, it *is* the costate, recoverable without ever having guessed one.
:::

The practical payoff is a free consistency check on any direct solution, independent of the transcription used to get it: map the multipliers, then verify that the reconstructed costate makes the Hamiltonian constant along the trajectory (autonomous problems), zero at $t_f$ (free final time), and that the switching structure it implies — where the reconstructed switching function changes sign — matches what the solution's control history actually does. Any mismatch is usually the mesh being too coarse, exactly the failure the earlier warning describes, or the scaling of the problem being poor enough to corrupt the multipliers numerically, the subject of a later lesson.

## Check yourself

::: check
Why does an entire, analytic function like $e^{-t}$ guarantee spectral convergence, while a merely continuous function like $\lvert t\rvert$ does not, even though both are perfectly well-defined, bounded functions with no singularities?
:::

::: answer
Spectral convergence for polynomial approximation is a statement about how well a function can be matched by its Taylor-like polynomial structure, and that depends on smoothness far beyond continuity or even differentiability once — an analytic function equals a convergent power series in a neighbourhood of every point, so a high-degree polynomial fit can track that series to increasingly many terms as $N$ grows, with error shrinking geometrically. $\lvert t\rvert$ is continuous and has no singularity in the sense of blowing up, but its derivative jumps at the origin, which means no single power series can represent it across that point — no matter how high a degree $N$ is used, the polynomial has to "spend" some of its representational power fighting the kink, and that spending only ever buys the algebraic rate the fit confirmed, not the geometric one.
:::

::: check
The covector mapping theorem's worked example found agreement to within $0.25\,\%$ using a central difference with $\varepsilon=10^{-4}$ on $r_0$. If a colleague used $\varepsilon=10^{-8}$ instead, hoping for tighter agreement, what would likely happen and why?
:::

::: answer
Too small an $\varepsilon$ runs into the same floor every finite-difference sensitivity does: the NLP itself is only solved to a finite tolerance (here roughly $10^{-12}$ in the constraint residuals), so the *change* in $t_f^\star$ between two solves separated by $10^{-8}$ in $r_0$ can be comparable to or smaller than the noise floor of re-solving the same NLP twice, and the finite difference becomes dominated by solver noise rather than the true sensitivity — the ratio would likely get *worse*, not better, past some point, exactly the same "loosen $\varepsilon$ too far and you learn nothing, tighten it too far and you learn only noise" trade-off that governs every finite-difference gradient check in the optimization module's treatment of numerical differentiation.
:::

::: check
A team solves an ascent trajectory with a pseudospectral method on a single high-degree polynomial spanning a staging event partway through, and finds the reconstructed switching function oscillating wildly near the staging time even though the solver reports a converged solution. Diagnose it using this lesson's content specifically.
:::

::: answer
A staging event is a genuine discontinuity — mass, and usually the achievable thrust, jump at that instant — so the trajectory is not analytic across it, and a single global polynomial covering both sides is fighting exactly the kind of kink the worked example measured: spectral convergence has collapsed to algebraic right at that point, and the differentiation matrix, built assuming one smooth polynomial for the whole interval, produces large, oscillatory (Gibbs-phenomenon-like) errors trying to represent the jump. The fix named in the warning is to split the mesh at the known staging time into two separate pseudospectral segments, one per stage, each smooth on its own and each free to converge spectrally again — not to add more nodes to the single polynomial, which would only make the oscillation near the discontinuity worse, mirroring the Runge-phenomenon behaviour of the previous lesson.
:::

::: check
Why is "the multiplier converges to the costate" not simply true by definition, but a theorem that needed proving?
:::

::: answer
The NLP's multipliers are defined by the finite-dimensional KKT conditions of a specific discretisation — an object built from algebra on a mesh, with no a priori reference to the continuous costate at all. The continuous costate is defined by an entirely separate piece of theory, the calculus-of-variations argument of an earlier lesson, as a Lagrange multiplier on a differential (not algebraic) constraint holding at every instant. That two independently-defined objects, from two different mathematical settings, turn out to correspond under an explicit scaling — and not merely resemble each other loosely — is a nontrivial claim about the specific structure of Gauss-type quadrature and differentiation matrices, which is exactly why it carries a name and a proof rather than being an immediate consequence of terminology.
:::

## Summary

| Object | Statement |
| --- | --- |
| Spectral convergence | Error decays faster than any $O(N^{-p})$, for a function analytic on the interval |
| Measured example | $\dot x=-x$ via LGL: error $1.18\times10^{-2}$ at $N=3$ to $9.3\times10^{-15}$ at $N=13$ |
| Precondition | Smoothness (analyticity); breaks at any kink — a switch, a constraint activation, staging |
| Smooth vs. kinked fit | Smooth: $R^2=0.9997$ exponential fit. $\lvert x\rvert$: $R^2=0.9999$ algebraic fit, rate $\approx N^{-0.96}$ |
| hp-adaptive fix | Break the mesh exactly at known or detected discontinuities; each smooth piece converges spectrally again |
| Covector mapping theorem | NLP multipliers on the defects, correctly scaled, converge to the continuous costate at the same nodes |
| Verified example | NLP sensitivity $\Delta t_f^\star/\Delta r_0=-76.914$ vs. shooting's $\lambda_r(0)=-76.722$: agreement to $0.25\,\%$ |
| Practical use | A free consistency check: reconstructed costate should make $H$ constant, $H(t_f)=0$ if free, switching structure matching the solution |

Every method so far has assumed the mesh — where the nodes sit — is given. The next lesson makes that a decision with its own rule: refine where the defects say the mesh is failing, and stop where they say it is not.
