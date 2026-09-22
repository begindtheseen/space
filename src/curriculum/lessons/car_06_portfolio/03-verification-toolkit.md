---
id: l03-verification-toolkit
title: "How you know the result is right: the verification toolkit"
minutes: 21
covers:
  - "stating how you know the result is right: analytic cases, conservation checks, convergence, cross-comparison"
---

"It ran, and the plot looked right" is the sentence that separates a hobbyist project from an engineering one, and the previous lesson named the section where that sentence has to be replaced with something specific. This lesson supplies what replaces it: four techniques — an analytic case, a conservation check, a convergence study, a cross-comparison — that together turn "I believe this is correct" into "here is what I checked, and here is the number it produced." None of the four is sufficient alone, because each one is built to catch a different class of bug, and a defect that survives one of them routinely fails a different one. A strong verification section uses at least two.

Every number in this lesson was computed, not estimated, the same discipline the write-up itself should follow: run the check, read the actual output, and report exactly that. The examples use rigid-body rotation and two-body orbital motion, both developed in earlier parts of this curriculum — this lesson does not re-derive that physics, it shows what you do with it once you have code that claims to implement it.

## Analytic cases: not every closed-form check is equally strong

An analytic case is a special instance of your general problem with a known, closed-form answer — you run your general-purpose code on that special instance and compare. The technique is simple; the part worth real attention is that not every analytic case is equally good at catching bugs, and the difference comes down to whether the case actually exercises the terms most likely to contain an error.

Take torque-free rigid-body rotation, governed by Euler's equations, $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3$ and its two cyclic permutations, as the rigid-body dynamics module derives. Starting a simulation with $\boldsymbol\omega$ pointed exactly along a single principal axis is a valid analytic case — the coupling terms on the right-hand side all vanish because two of the three components are zero, so $\boldsymbol\omega$ stays exactly constant for all time, and any code that does not reproduce that has a real bug. But this case is weaker than it looks: a sign error in the coupling term $(I_2-I_3)\omega_2\omega_3$ would still vanish under this initial condition, since the product $\omega_2\omega_3$ is zero regardless of the sign in front of it. The check passes even with the bug present.

A stronger analytic case is the axisymmetric body, $I_1=I_2=I_t \ne I_3$, started with a nonzero transverse rate. As the rigid-body module shows, the transverse components trace an exact circle in body axes, $\omega_1(t)=\omega_{t}\cos(\lambda t)$, $\omega_2(t)=\omega_t\sin(\lambda t)$, at the body-frame precession rate $\lambda = n(I_3-I_t)/I_t$ — and this solution only holds if the coupling terms carry their correct signs, because it is exactly those terms that produce the precession.

::: example An axisymmetric-precession analytic case, run against a from-scratch RK4 integrator
$I_t=0.024\,\mathrm{kg\,m^2}$, $I_3=0.036\,\mathrm{kg\,m^2}$, $\omega_t=0.10\,\mathrm{rad/s}$, $n=0.15\,\mathrm{rad/s}$, giving a predicted body-frame precession rate $\lambda=n(I_3-I_t)/I_t=0.075\,\mathrm{rad/s}$. Integrating Euler's equations from this initial condition with a from-scratch RK4 integrator at a $0.0125\,\mathrm{s}$ step and comparing $\omega_1(t)$, $\omega_2(t)$ against the closed form $\omega_t\cos(\lambda t)$, $\omega_t\sin(\lambda t)$ over a $60\,\mathrm{s}$ integration (4800 steps) gives a maximum absolute error of $4.0\times10^{-14}$ on a signal of order $0.1\,\mathrm{rad/s}$ — agreement to about thirteen significant figures, and specifically an agreement that could not happen by coincidence if either coupling term's sign were wrong, since a sign error would change the precession's direction or rate outright rather than leaving a small residual.
:::

::: key
A good analytic case exercises the same terms that are actually likely to contain a bug. A case where the suspect terms happen to vanish (like a single-axis fixed point under torque-free rotation) still catches gross errors but passes silently past a sign error in the coupling; a case that depends on those terms having the right sign and the right magnitude, like the axisymmetric precession rate, is the stronger check.
:::

## Conservation checks: an invariant the equations guarantee

Where a full closed-form trajectory is not available, a conserved quantity often still is — a quantity the governing equations guarantee stays constant, algebraically, regardless of the specific trajectory. Torque-free rigid-body rotation conserves rotational kinetic energy and the magnitude of angular momentum, as the rigid-body module derives; two-body orbital motion conserves specific orbital energy, $\varepsilon = v^2/2 - \mu/r = -\mu/2a$. Either one gives a check that works for the actual case you care about, not only a special one — you do not need a torque-free axisymmetric body or a perfect two-body Keplerian orbit for the technique to apply, since the invariant holds for any trajectory the equations produce, at any eccentricity or any triaxial inertia ratio.

The two-body example from this module's first lesson is exactly this technique in practice: propagating a $7000\,\mathrm{km}$, $e=0.01$ orbit for twenty periods with a from-scratch RK4 integrator held specific energy to a maximum relative deviation of $3.9\times10^{-14}$ from the initial $\varepsilon = -\mu/2a = -28.4715\,\mathrm{km^2/s^2}$. A conservation check like this one is cheap to run — it costs nothing beyond the propagation you were already doing — and it is sensitive to exactly the class of bug most dangerous in numerical code: a small, consistent error that would otherwise look like reasonable, physically plausible drift.

::: warning
A conservation check tells you the equations were solved consistently with themselves. It does not tell you the equations are the right ones — a two-body propagator with the wrong value of $\mu$ hard-coded will still conserve energy perfectly, only the wrong amount of it. Pair a conservation check with an analytic case wherever you can; the analytic case checks the number, the conservation check watches it stay right over a long integration.
:::

## Convergence studies: does the error shrink the way the method promises

Every numerical integration method has a theoretical order: a fourth-order method like RK4 has local behavior such that halving the step size should shrink the error roughly by a factor of $2^4=16$, until the error reaches the level where floating-point roundoff itself dominates. A convergence study runs the same problem at several step sizes and checks that the error actually behaves this way — and it is one of the few verification techniques that catches an implementation which produces a *plausible* but *wrong-order* answer, a subtler defect than a sign error because the output can look entirely reasonable at any single step size.

Running the general triaxial rigid-body case above (no axisymmetry, $I=\mathrm{diag}(0.020,0.028,0.036)\,\mathrm{kg\,m^2}$) at five step sizes from $0.2\,\mathrm{s}$ down to $0.0125\,\mathrm{s}$, halving each time, and tracking the maximum relative deviation in kinetic energy over a $60\,\mathrm{s}$ integration gives successive error ratios of $15.8$, $15.9$, $15.5$, and finally $5.8$ — the first three match the theoretical factor of $16$ closely, and the last one falls short because the absolute error, at $10^{-14}$, has reached the floor where double-precision roundoff itself is the limiting factor rather than the method's own truncation error. That flattening is not a failure of the check; it is exactly what a correctly-implemented fourth-order method should do once truncation error drops below machine precision, and recognizing it is part of reading a convergence study honestly rather than expecting the factor of sixteen to continue forever.

The method matters enormously here, not only its step size. Integrating the same $7000\,\mathrm{km}$ two-body orbit for two periods at a fixed $1\,\mathrm{s}$ step with forward Euler — a first-order method — gives a maximum relative energy deviation of $2.57\times10^{-2}$, more than two percent. RK4 at the identical step size holds the same integration to $9.1\times10^{-15}$, roughly twelve orders of magnitude tighter. Both methods "ran." Both produced a trajectory that, glanced at, looks like an orbit. Only the convergence behavior — and, in this case, comparing methods at a fixed step — reveals that one of them is not fit for the job.

::: example A convergence study and a cross-comparison, run together
Integrating the triaxial rigid-body case with an independent, adaptive solver — `scipy.integrate.solve_ivp` at `method='DOP853'`, a different algorithm entirely from a hand-written fixed-step RK4 — and comparing the state at $t=60\,\mathrm{s}$ against the hand-written integrator's result at its smallest tested step gives a maximum absolute difference of $1.0\times10^{-14}$ across all three angular velocity components, each of order $0.1$–$0.2\,\mathrm{rad/s}$. Two independently implemented methods, built on different algorithms, agreeing to thirteen significant figures is strong evidence that neither has a coding defect large enough to matter, because the two implementations do not share bugs — an error in one would show up as a disagreement, not as a shared wrong answer.
:::

::: key
Convergence: a method of theoretical order $p$ should show its error shrink by roughly $2^p$ under step-halving, until floating-point roundoff sets a floor — RK4 ($p=4$) showed ratios near $16$ across three halvings here, then flattened at the $10^{-14}$ noise floor. Cross-comparison: two independently implemented methods that do not share an algorithm, agreeing to many significant figures, is evidence neither carries a coding defect large enough to matter, since an error in one would show up as disagreement rather than as a shared wrong answer.
:::

## Cross-comparison, more broadly

The scipy comparison above is the cleanest version of cross-comparison — a different algorithm, in a well-tested library, checked against your own from-scratch implementation — but the technique is broader than "run someone else's solver." A published numerical example from a textbook, a second implementation you write using a different formulation of the same physics (Cartesian state versus orbital elements, for instance), or a colleague's independent code all serve the same purpose: an independent path to the same answer that does not share your mistakes. The value scales with how independent the second path really is. Two implementations that both call the same underlying library function are not an independent check on that library function; a hand-derived analytic case and a library solver are more independent than two library calls, because a defect in the analytic derivation and a defect in the library's algorithm are very unlikely to agree by coincidence.

## Check yourself

::: check
Explain why torque-free rotation started exactly along a single principal axis is a weaker analytic case than the axisymmetric precession case, even though both give an exact closed-form answer.
:::

::: answer
Starting along a single principal axis makes the coupling terms in Euler's equations vanish because the products of the other two components are zero — $\omega_2\omega_3=0$ regardless of any sign in front of that term — so a sign error in the coupling coefficient would still pass this check undetected. The axisymmetric precession case depends on those same coupling terms having the correct sign and magnitude to produce the predicted rotation rate $\lambda=n(I_3-I_t)/I_t$; a sign error there changes the precession's sense or rate, so the check would fail. A strong analytic case is one where the terms most likely to contain a bug are actually exercised by the chosen initial condition, not merely present in the equations.
:::

::: check
A student argues that since their two-body propagator conserves specific orbital energy to $10^{-13}$ over many orbits, the propagator must be using the correct value of $\mu$. Is this reasoning sound?
:::

::: answer
No. Energy conservation is a property of the equations being solved self-consistently — it holds for any correct value of $\mu$ used consistently throughout the propagation, and it would hold equally well for a wrong value of $\mu$ used consistently, since $\varepsilon=-\mu/2a$ would still stay constant along the (now-wrong) trajectory. Conservation checks catch inconsistency between how a quantity is computed and how the trajectory evolves; they do not catch a wrong constant applied uniformly. Catching that requires an analytic case with a known numerical answer — comparing a propagated period against $T=2\pi\sqrt{a^3/\mu}$ with the correct $\mu$, for instance — or a cross-comparison against an independent source that used the right value.
:::

::: check
A convergence study on a claimed fourth-order integrator shows error ratios of $15.6$, $15.9$, $16.1$, and then $2.1$ as the step size is halved four times in a row. Is the flattening at the last step evidence of a bug?
:::

::: answer
Not necessarily — it depends on the absolute error level at that point. If the error has fallen to somewhere near double-precision roundoff (roughly $10^{-15}$ to $10^{-14}$ relative), a flattening ratio is the expected signature of hitting the floating-point noise floor, exactly as this lesson's own rigid-body study showed a ratio drop from about sixteen to about six once the error reached $10^{-14}$. A ratio of $2.1$ specifically — much closer to $2$, the ratio expected of a first-order method — occurring at an error level still well above machine precision would instead suggest the implementation is not actually achieving fourth order, and is worth investigating rather than dismissing. The absolute error level at which the flattening occurs is what distinguishes a healthy convergence study from a suspicious one.
:::

::: check
Why is a comparison between your hand-written RK4 integrator and `scipy.integrate.solve_ivp` a stronger cross-comparison than comparing your RK4 integrator against a second copy of the same RK4 code you wrote, run at the same step size?
:::

::: answer
A second copy of the same code, run the same way, will reproduce any bug in the original exactly, because both copies share the identical algorithm and the identical mistake if one exists — agreement between them proves nothing beyond that you copied the file correctly. `solve_ivp` with an adaptive, high-order method like DOP853 is a different algorithm entirely, developed and tested independently of your code, so a coding error in your RK4 implementation has no reason to be reproduced there. Agreement between genuinely independent implementations is evidence against a shared class of error; agreement between two copies of the same implementation is not independent evidence of anything.
:::

::: check
Rank the following as weak, moderate, or strong verification evidence for a rigid-body simulation, and justify each: (a) "the animation looked physically plausible," (b) rotational kinetic energy conserved to $10^{-12}$ over a long integration with a hard-coded, unverified inertia tensor, (c) the axisymmetric precession rate matched to $4\times10^{-14}$ against the closed-form $\lambda$.
:::

::: answer
(a) is weak: plausibility is consistent with a range of undetected bugs, including sign errors that a human eye reading an animation would not notice. (b) is moderate: it is real, quantitative evidence the equations are being integrated self-consistently, but as the earlier check question showed, conservation alone cannot catch a wrong constant — here, an unverified inertia tensor — applied consistently throughout, so it needs to be paired with an independent check on the inertia values themselves. (c) is strong: it is a quantitative match, to many significant figures, against a case specifically chosen because it depends on the coupling terms having the correct sign and magnitude, which is exactly where a rigid-body implementation is most likely to have a defect.
:::

## Summary

| Technique | What it catches | Example from this lesson |
| --- | --- | --- |
| Analytic case | Wrong equations or wrong-signed terms, if the case exercises them | Axisymmetric precession matched to $4\times10^{-14}$ |
| Conservation check | Inconsistency between a quantity's computation and the trajectory | Two-body energy held to $3.9\times10^{-14}$ over 20 orbits |
| Convergence study | Wrong method order, or a bug that only appears at large error | RK4 ratios near 16 per halving; Euler ($2.6\times10^{-2}$) vs RK4 ($9\times10^{-15}$) at equal step |
| Cross-comparison | A defect not shared by an independently built second path | Hand-written RK4 vs `solve_ivp`/DOP853: agreement to $10^{-14}$ |

Statistical consistency testing — the same idea of "prove it, do not only report it" applied to an estimator's reported uncertainty rather than a simulation's trajectory — gets its own full treatment later in this module, in the lesson built around the quaternion estimator anchor project. The next lesson turns to that anchor project's neighbor: the first of the five anchor projects themselves, the 6-DOF launch vehicle simulation.
