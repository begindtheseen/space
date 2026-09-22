---
id: l16-tooling
title: "Tooling: automatic differentiation and the trajectory-optimisation stack"
minutes: 17
covers:
  - "Tooling: CasADi with IPOPT, GPOPS-II, PSOPT, Dymos/OpenMDAO, PyOMO, ACADO, trajax"
---

Every Jacobian in this module so far was built one of two ways: worked out by hand from the defect formulas, or approximated by finite differences in a few lines of Python. Neither scales to a real vehicle problem with dozens of states and a fine mesh — a hand derivation is a standing invitation to a sign error, and finite differences, this lesson shows concretely, are neither fast nor even as accurate as they look. The software this field actually runs on exists to solve exactly that problem, and understanding what it automates — rather than treating it as a black box — is what turns "I know the theory" into "I can set up a real problem and read its failure messages."

## Why finite differences are not good enough

A finite-difference derivative trades two competing errors against a single knob, the step size $\varepsilon$: too large, and the approximation's own truncation error dominates; too small, and floating-point round-off in the subtraction dominates instead. There is no $\varepsilon$ that eliminates both.

::: example The error a finite difference can never fully escape
Differentiating $g(x) = x^3\sin x + e^{2x}/(x+1)$ at $x=1.7$ by hand gives the exact derivative $26.050049$. A central finite difference at several step sizes:

| $\varepsilon$ | derivative | error |
| --- | --- | --- |
| $10^{-2}$ | $26.050569$ | $5.20\times10^{-4}$ |
| $10^{-4}$ | $26.050049$ | $5.20\times10^{-8}$ |
| $10^{-6}$ | $26.050049$ | $2.59\times10^{-9}$ |
| $10^{-8}$ | $26.050049$ | $8.52\times10^{-8}$ |
| $10^{-10}$ | $26.050060$ | $1.11\times10^{-5}$ |
| $10^{-12}$ | $26.052938$ | $2.89\times10^{-3}$ |

The error falls, bottoms out somewhere around $\varepsilon\sim10^{-6}$, and then rises again as $\varepsilon$ shrinks further — a floor no choice of step size gets under, set by the sixteen or so significant digits double-precision arithmetic carries. Every Jacobian built by finite differences anywhere in this module inherited exactly this floor, silently.
:::

## Automatic differentiation: exact, not approximate

**Automatic differentiation** (AD) computes derivatives that are exact to machine precision, by propagating derivative information through the same sequence of elementary operations — additions, products, sines, exponentials — that computes the function's value, rather than approximating a slope from two nearby function evaluations. The simplest version, **forward-mode** AD, extends ordinary numbers to **dual numbers** $a+b\varepsilon$ with the rule $\varepsilon^2=0$, and defines arithmetic on them so that the $\varepsilon$-coefficient tracks the derivative automatically:

$$
(a+b\varepsilon)+(c+d\varepsilon) = (a+c)+(b+d)\varepsilon, \qquad (a+b\varepsilon)(c+d\varepsilon) = ac + (ad+bc)\varepsilon
$$

(the $bd\varepsilon^2$ term vanishes by the defining rule). Seeding $x = x_0 + 1\cdot\varepsilon$ and evaluating $g(x)$ using these rules, the $\varepsilon$-coefficient of the result is exactly $g'(x_0)$ — not an approximation of it. Evaluating $g(x)=x^3\sin x + e^{2x}/(x+1)$ at $x_0=1.7$ this way, with a small dual-number class implementing exactly the rules above plus $\sin(a+b\varepsilon)=\sin a + b\cos a\,\varepsilon$ and $\exp(a+b\varepsilon)=e^a+be^a\varepsilon$ (the chain rule, applied once per elementary function), gives derivative $26.05004878112112$ against the hand-computed exact value $26.05004878112112$ — agreement to every one of the sixteen digits Python's floating point carries, not merely to the best a finite difference could manage. There is no step size to tune, because there is no approximation to tune it against.

::: key Why this changes what "build the Jacobian" means
A hand-derived or finite-differenced Jacobian is a source of either labour or error, and both scale badly as state and control dimensions grow. Automatic differentiation, applied to the same defect and cost functions this module wrote by hand, produces exact derivatives automatically, at a cost comparable to a small constant multiple of evaluating the function itself — which is the specific technical advance that makes transcribing a fifteen-state, multi-phase vehicle problem a routine afternoon's work rather than a week of algebra.
:::

**Reverse-mode** AD (the technique behind backpropagation in machine learning, and the natural choice when a function has many inputs and few outputs — exactly the shape of an NLP's scalar objective with respect to thousands of decision variables) computes the same exact gradients by propagating derivative information backward through the computational graph instead of forward, at a cost independent of the number of inputs. The mechanics are a separate, larger topic; the result that matters here is the same exactness forward-mode AD demonstrated above, at a cost profile better suited to the wide, thin computational graphs a large trajectory NLP actually has.

::: example The same dual numbers, differentiating this module's own dynamics
Apply the identical dual-number machinery to the Mars descent dynamics used throughout this module, $\dot v = T/m - g$, $\dot m=-T/c$, at a representative point ($m=950\,\mathrm{kg}$, $T=6000\,\mathrm{N}$, $c=2206.50\,\mathrm{m/s}$): seeding $m=950+1\cdot\varepsilon$ and evaluating gives $\partial\dot v/\partial m = -0.0066482$, matching the hand-derived analytic partial $-T/m^2=-0.0066482$ exactly; seeding $T=6000+1\cdot\varepsilon$ gives $\partial\dot v/\partial T=0.0010526$ and $\partial\dot m/\partial T=-0.00045321$, matching $1/m$ and $-1/c$ exactly. Every entry of the $\mathbf{f}_k$ Jacobian block that a defect constraint's derivative needs — the block this module has been computing by hand or by finite difference in every worked example — is obtainable this way, one seed direction at a time for forward mode, with the exactness demonstrated above and none of the sign-error risk of deriving it on paper.
:::

## The stack this module's theory turns into

**CasADi**, paired with the interior-point solver **IPOPT**, is the field's most common combination: a symbolic framework in which the dynamics, cost and constraints are written once, differentiated automatically (forward- or reverse-mode, chosen automatically per operation for efficiency) and handed to IPOPT already knowing the exact sparsity pattern the earlier lesson on Jacobian structure described — the sparsity is detected from the symbolic graph, not guessed or configured by hand. **GPOPS-II** and **PSOPT** are pseudospectral-focused: hp-adaptive Legendre-Gauss-Radau meshing, automating the node-placement and refine-where-needed logic of the pseudospectral and mesh-refinement lessons rather than leaving it to a hand-written loop. **Dymos**, built on NASA's OpenMDAO, integrates trajectory optimisation into a larger multidisciplinary design loop — letting a vehicle's mass, aerodynamics and trajectory be optimised together rather than trajectory-only, at the cost of a larger, more general framework to learn. **PyOMO** is a general algebraic modelling language, not aerospace-specific at all — it can pose a trajectory NLP the same way it poses a supply-chain or an energy-systems optimisation, useful when a trajectory problem needs to interoperate with a broader modelling and solver ecosystem rather than a purpose-built tool. **ACADO** targets real-time and embedded use specifically — code generation for a fixed-structure NLP that can run inside a flight computer's control loop, the natural continuation of the real-time iLQR discussion two lessons back. **trajax**, built on JAX, exposes the same automatic-differentiation machinery through a framework built for GPU execution and differentiable programming more broadly, a natural fit for iLQR- and DDP-style algorithms that need derivatives of an entire rollout and increasingly for workflows that mix classical trajectory optimisation with learned dynamics models.

::: warning None of this tooling replaces understanding what it is doing
A symbolic AD framework computes an exact Jacobian; it does not know whether the problem it was handed is well scaled, whether the mesh resolves a bang-bang switch, or whether a reported "successful" solve found the true global structure or a spurious local one. IPOPT, handed the unscaled orbit-transfer problem from the scaling lesson, fails for the identical reason the hand-written SLSQP solve did — automatic differentiation fixes the derivative-accuracy problem completely, and contributes nothing to the conditioning problem, which is a property of the units chosen, not of how the derivatives were computed. Every diagnostic skill this module has built — reading a switching function, checking a covector-mapped costate, refining a mesh from an interpolated-defect estimate, recognising a badly scaled problem — is exactly as necessary with professional tooling as it was with the from-scratch code this module used to teach it.
:::

## Check yourself

::: check
Why does a finite-difference derivative's error *increase* again for very small $\varepsilon$, rather than continuing to improve as the step shrinks?
:::

::: answer
A finite difference computes $[g(x+\varepsilon)-g(x-\varepsilon)]/(2\varepsilon)$, and floating-point arithmetic represents $g(x+\varepsilon)$ and $g(x-\varepsilon)$ to only about sixteen significant digits; once $\varepsilon$ is small enough that $g(x+\varepsilon)$ and $g(x-\varepsilon)$ agree in most of those digits, their difference is dominated by round-off noise in the last few digits rather than by the true, tiny change in $g$, and dividing that noise by an even smaller $2\varepsilon$ amplifies it further. The measured table shows exactly this: truncation error shrinks steadily from $\varepsilon=10^{-2}$ to about $10^{-6}$, and round-off error then grows as $\varepsilon$ continues to shrink past that point, with no step size escaping both simultaneously.
:::

::: check
A dual number $a+b\varepsilon$ with $\varepsilon^2=0$ is used to compute a derivative by seeding $b=1$. Why does seeding $b=1$ specifically (rather than, say, $b=2$) give the derivative directly, without needing to divide by anything afterward?
:::

::: answer
Propagating $x=x_0+1\cdot\varepsilon$ through the dual-number arithmetic rules computes the exact first-order Taylor expansion of $g$ about $x_0$: $g(x_0+\varepsilon) = g(x_0) + g'(x_0)\varepsilon + O(\varepsilon^2)$, and since $\varepsilon^2=0$ is enforced exactly by the dual-number rules (not merely small), the $\varepsilon$-coefficient the arithmetic produces is exactly $g'(x_0)\cdot1$, the derivative itself. Seeding $b=2$ would instead track $g(x_0+2\varepsilon)$'s linear term, whose $\varepsilon$-coefficient is $2g'(x_0)$ — recoverable by dividing by $2$, but with no advantage over seeding $b=1$ and reading the derivative off directly, which is why every practical AD implementation seeds with $1$.
:::

::: check
GPOPS-II and PSOPT automate the pseudospectral node placement and mesh refinement this module built by hand in earlier lessons. Does that mean the earlier lessons' content is unnecessary once one of these tools is available?
:::

::: answer
No — it means the *labour* of implementing node generation and refinement loops is unnecessary, not the judgement needed to use the tool well. Choosing between a trapezoidal, Hermite-Simpson or pseudospectral transcription for a given problem, recognising when a solution's apparent convergence is hiding a mesh too coarse to see a switch, interpreting why a refinement loop is not converging, and diagnosing whether a failure is a scaling problem or a genuine structural one are all judgement calls the tool's output has to be read through, not decisions the tool makes for you — exactly the warning this lesson closes on, and the entire justification for building these methods by hand once before ever handing them to software that does it faster.
:::

::: check
Why would ACADO's code-generation approach be a poor fit for the pseudospectral, hp-adaptive mesh refinement GPOPS-II specialises in, even though both are optimal-control software?
:::

::: answer
Code generation for a real-time embedded solver needs a *fixed*, known-in-advance problem structure — a fixed number of states, controls and mesh points — so that the generated code has a bounded, predictable execution time and memory footprint suitable for a flight computer, exactly the certification-relevant property the real-time discussion two lessons back cared about. hp-adaptive mesh refinement, by its nature, changes the number of mesh points and their placement from one solve to the next based on where the error estimate says resolution is needed — a structure that varies at runtime is precisely what a fixed, generated-in-advance embedded solver cannot accommodate, which is why the two tools specialise in opposite ends of the same field: one for the best possible offline answer, one for a bounded, repeatable answer computed fast enough to fly with.
:::

## Summary

| Object | Statement |
| --- | --- |
| Finite-difference floor | Error bottoms out (here, $\varepsilon\approx10^{-6}$, error $2.6\times10^{-9}$) and worsens on both sides — no step size is exact |
| Automatic differentiation | Exact to machine precision; forward-mode via dual numbers $a+b\varepsilon$, $\varepsilon^2=0$ |
| Verified example | AD derivative matches the hand-computed exact value to all sixteen digits; best finite difference is $2.6\times10^{-9}$ off |
| Reverse-mode | Same exactness, cost independent of input count — the shape a large NLP's objective actually has |
| CasADi + IPOPT | Symbolic AD, automatic sparsity detection, sparse interior-point solve |
| GPOPS-II / PSOPT | hp-adaptive pseudospectral meshing, automated |
| Dymos | OpenMDAO-integrated, trajectory coupled to a larger multidisciplinary design problem |
| PyOMO | General algebraic modelling language, not aerospace-specific |
| ACADO | Real-time / embedded code generation, fixed problem structure |
| trajax | JAX-based, GPU-capable, natural fit for iLQR/DDP and learned-dynamics workflows |
| What tooling does not replace | Scaling judgement, mesh interpretation, and diagnosing whether "converged" means "correct" |

The last lesson in this module puts every diagnostic built so far to work at once — a catalogue of ways a trajectory optimisation looks fine and is not, and the checks that catch each one before it reaches a vehicle.
