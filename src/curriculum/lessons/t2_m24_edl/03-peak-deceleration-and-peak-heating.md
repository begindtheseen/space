---
id: l03-peak-deceleration-and-peak-heating
title: Peak deceleration and peak heating, derived and then measured
minutes: 18
covers:
  - peak deceleration and peak heating relations
---

The previous lesson produced a striking, exact result: the peak deceleration of a ballistic entry depends only on entry speed and entry angle, never on the vehicle. That is a strong claim to hang a heat-shield or a structural margin on, and it rests on assumptions — a frozen flight-path angle, gravity too small to matter against drag — that this lesson has not yet tested against anything. An engineer who ships a number without checking the assumptions it came from is trusting arithmetic more than physics deserves.

This lesson builds a numerically integrated entry that keeps the two pieces of physics Allen-Eggers drops, compares it point by point against the closed form across a range of entry angles, and identifies precisely which assumption fails first as the entry gets shallower. It then extends the same machinery to peak *heating*, deriving where the heating maximum sits relative to the deceleration maximum and showing that — unlike peak deceleration — peak heating rate is not independent of the vehicle at all.

## Building the numerical truth model

Allen-Eggers drops two things from the exact equations of motion: gravity's direct contribution to deceleration along the flight path, and any change in the flight-path angle itself. Restore both. The standard planar, point-mass equations of motion for entry over a spherical, non-rotating planet — used throughout the entry-dynamics literature, and the natural next step up in fidelity from the flat, gravity-free model of the previous lesson — are, with $r = R_\oplus + h$ the radial distance and $g(r) = \mu/r^2$:

$$
\dot v = -\frac{\rho(h)\,v^2}{2\beta} - g(r)\sin\gamma, \qquad
\dot\gamma = \cos\gamma\left(\frac{v}{r} - \frac{g(r)}{v}\right), \qquad
\dot r = v\sin\gamma.
$$

The drag term is unchanged from lesson 2. The new $-g\sin\gamma$ term in $\dot v$ is gravity's component along the velocity — negative $\sin\gamma$ during descent makes this term positive, gravity accelerating the fall exactly as it should. The $\dot\gamma$ equation says the flight path steepens under gravity (the $-g/v$ piece, present even for a stationary atmosphere) but is relieved by the vehicle's own speed around the planet's curvature (the $+v/r$ piece) — the same centrifugal relief that lets a fast-enough, shallow-enough entry skip back out of the atmosphere instead of diving in, a mechanism lesson 6 depends on directly. No lift, no planetary rotation: this keeps every assumption of lesson 2 except the two under test.

Integrated with an explicit Runge-Kutta method (this module uses `scipy.integrate.solve_ivp` with the eighth-order `DOP853` method) from the $120\ \mathrm{km}$ entry interface, this system has no closed-form solution — that is the entire point — so its peak deceleration and peak heating are found by direct search over the numerical trajectory. Before trusting any number out of it, check that the number does not depend on how hard the integrator is asked to work: tightening the relative tolerance from $10^{-8}$ to $10^{-11}$, or switching from `DOP853` to the unrelated `RK45` method, changes a computed peak deceleration of $19.445013\,g_0$ by less than $2\times10^{-6}\,g_0$ and the peak altitude by less than a millimetre. The numbers that follow are step-size independent to at least six significant figures — this is a converged solution of the equations above, not an artefact of one particular solver call.

## Where the closed form holds up

Take $v_E = 7800\ \mathrm{m/s}$, $\beta = 200\ \mathrm{kg/m^2}$, and sweep the entry angle:

| $\gamma_E$ | $a_{\max}$, closed form ($g_0$) | $a_{\max}$, numerical ($g_0$) | error |
| --- | --- | --- | --- |
| $-90^\circ$ | $158.5$ | $163.6$ | $3.2\%$ |
| $-45^\circ$ | $112.1$ | $115.7$ | $3.2\%$ |
| $-20^\circ$ | $54.2$ | $56.1$ | $3.5\%$ |
| $-6.5^\circ$ | $17.9$ | $19.4$ | $8.4\%$ |
| $-1^\circ$ | $2.8$ | $25.4$ | $820\%$ |

For steep entries the closed form is genuinely good: a few percent, and — notice the trend from $-90^\circ$ to $-20^\circ$ — the error barely moves as the angle shallows, sitting at a nearly constant floor around $3$ percent. This is the regime Allen and Eggers had in mind: a warhead or a probe descending at $20^\circ$ or steeper loses so little to gravity compared to what drag removes that ignoring gravity costs only a few percent, and the trajectory really is close enough to a straight line that freezing $\gamma$ barely matters.

Between $-20^\circ$ and $-6.5^\circ$ the error more than doubles, and by $-1^\circ$ the closed form is not merely inaccurate, it has become useless: it predicts a peak of under $3\,g_0$ where the real number is over $25\,g_0$, wrong by a factor of nine. Something has changed character, not just degree, and the next section isolates exactly what.

## Which assumption fails first

Two assumptions were dropped in building the closed form: gravity's direct pull along the flight path, and any change in $\gamma$ itself. To see which one is responsible for the blow-up, test them one at a time — restore gravity in $\dot v$ while still freezing $\gamma$, and separately, drop gravity from $\dot v$ but let $\gamma$ evolve under its own (full, curvature-including) equation — and compare each partial model's peak deceleration to the same closed form.

| $\gamma_E$ | error, gravity-in-$\dot v$ alone | error, flight-path curvature alone |
| --- | --- | --- |
| $-90^\circ$ | $3.22\%$ | $0.00\%$ |
| $-45^\circ$ | $3.14\%$ | $0.09\%$ |
| $-20^\circ$ | $2.98\%$ | $0.65\%$ |
| $-10^\circ$ | $2.82\%$ | $2.72\%$ |
| $-6.5^\circ$ | $2.73\%$ | $6.46\%$ |
| $-2^\circ$ | $2.46\%$ | $64.6\%$ |
| $-1^\circ$ | $2.31\%$ | $197.3\%$ |

The gravity-in-$\dot v$ column is nearly flat: about $2.3$ to $3.2$ percent at every angle, rising only slowly as the entry steepens. That is the "always there, small" contribution — it is exactly what remains of the total error at $-90^\circ$, where the flight path cannot curve at all ($\cos(-90^\circ)=0$ kills the curvature equation identically, so $\gamma$ truly never changes and the flat-planet closed form's only remaining sin is neglecting gravity's pull along a purely vertical drop).

The curvature column tells the real story. At $-90^\circ$ it contributes nothing, because there is no curvature to speak of. It grows slowly at first, crosses the gravity term's contribution somewhere between $-10^\circ$ and $-6.5^\circ$, and then explodes: $65\ \mathrm{percent}$ at $-2^\circ$, nearly $200\ \mathrm{percent}$ at $-1^\circ$. This is the assumption that fails first, and it fails by a widening margin as the entry gets shallower. Physically, a shallow entry spends a very long time at high altitude, where the atmosphere is thin and drag is weak — long enough for gravity to keep steepening the flight path (or, near the entry corridor's edge, for the vehicle's own speed to relieve that steepening and let it skim rather than dive) by an amount that is no longer small next to $\gamma_E$ itself. Freezing $\gamma$ at its entry value stops being a reasonable approximation and starts being simply wrong.

::: key Which assumption fails first
Across every entry angle tested, neglecting gravity's direct contribution to deceleration costs a small, nearly constant $2$–$3$ percent. Freezing the flight-path angle costs nothing at all for a vertical entry and *hundreds of percent* for a shallow one. The constant-$\gamma$ assumption is what breaks the Allen-Eggers closed form, and it breaks first — and worst — exactly in the shallow-entry regime where the entry corridor (lesson 6) and skip trajectories (lesson 7) live.
:::

::: example Reading the error budget at a real entry angle
A capsule enters at $\gamma_E = -6.5^\circ$, roughly the angle later lessons use for a lunar-return corridor case, with $v_E = 7800\ \mathrm{m/s}$ and $\beta = 200\ \mathrm{kg/m^2}$. The closed form gives $a_{\max} = 17.9\,g_0$; the converged numerical integration gives $19.4\,g_0$, an $8.4\ \mathrm{percent}$ error. The ablation table shows this splits as roughly $2.7\ \mathrm{percent}$ from neglected gravity and $6.5\ \mathrm{percent}$ from the frozen flight path — comparable in size, with curvature already the larger piece even at an angle most engineers would not call "shallow." A margin built by simply adding, say, $10\ \mathrm{percent}$ to the closed-form peak-g as a blanket safety factor happens to cover this case, but the error table above shows that margin would be badly wrong — too generous at $-45^\circ$, not nearly enough at $-2^\circ$ — anywhere else on the same entry-angle axis.
:::

## Peak heating: a related but different maximum

Deceleration is not the only quantity that peaks during entry. Convective heating rate at a vehicle's stagnation point follows a different, steeper scaling — the next lesson derives the full Sutton-Graves correlation, but its essential shape, motivated by stagnation-point boundary-layer theory, is

$$
\dot q \propto \sqrt{\rho}\; v^3,
$$

density to the one-half power, velocity cubed, rather than deceleration's $\rho v^2$. That extra power of velocity, and the weaker dependence on density, moves the heating peak to a different place in the trajectory. Repeat the maximisation of lesson 2, now on $f(\rho) = \sqrt\rho\, e^{-3c\rho}$ (the $v^3$ inside the Allen-Eggers exponential contributes three times the exponent that $v^2$ did), with $c = H/(\beta s)$ as before:

$$
\frac{df}{d\rho} \propto \rho^{-1/2}\left(\tfrac{1}{2} - 3c\rho\right) e^{-3c\rho} = 0 \quad\Longrightarrow\quad \rho^*_q = \frac{1}{6c} = \frac{\beta s}{3H}.
$$

Compare this to lesson 2's peak-deceleration density, $\rho^*_a = \beta s/H$: the heating maximum occurs at exactly **one-third** the density of the deceleration maximum, for every $\beta$, every $\gamma_E$, every $v_E$. Because density falls monotonically with altitude, a lower required density means a higher altitude, and the difference is a fixed number of scale heights:

$$
h^*_a - h^*_q = H\ln\frac{\rho^*_a}{\rho^*_q} = H\ln 3 = 7200 \times 1.0986 = 7910\ \mathrm{m}.
$$

Peak heating occurs $7.91\ \mathrm{km}$ *above* peak deceleration — always, regardless of vehicle or entry geometry, within this model. Since the vehicle is still descending and slowing at that point, it is also *earlier* in time and at *higher* speed: peak heating comes before peak deceleration, exactly matching the informal rule of thumb that a heat shield's worst moment arrives before the crew or payload feels the worst g.

::: key Peak heating happens higher, and earlier, than peak deceleration
$$
\rho^*_q = \frac{\beta\,|\sin\gamma_E|}{3H}, \qquad h^*_a - h^*_q = H\ln 3 = 7.91\ \mathrm{km}\ \text{(Earth, this module's }H\text{)}.
$$
The altitude gap is exact and independent of $\beta$, $\gamma_E$, and $v_E$ within the Allen-Eggers model. Peak heating always precedes peak deceleration in time.
:::

Now substitute $\rho^*_q$ back into the heating expression to see what survives for the *magnitude* of the peak — and here the story is the opposite of peak deceleration's. Carrying through the constants (done in full in the next lesson, with the real Sutton-Graves correlation in place of the bare proportionality), the peak heating rate scales as

$$
\dot q_{\max} \propto \sqrt{\beta}\,,
$$

*not* independent of $\beta$. Peak deceleration cancels $\beta$ exactly because a $1/\beta$ prefactor meets a $\beta$ buried in $\rho^*_a$ raised to the first power; peak heating's prefactor is $v^3$ with no explicit $\beta$ at all, so the $\sqrt{\rho^*_q} \propto \sqrt\beta$ from the substitution survives untouched. A heavier or more slender vehicle (higher $\beta$) meets a *higher* peak heat rate than a lighter, blunter one at the identical entry speed and angle — the asymmetry between these two "peak" results is one of the more important, least obvious facts in entry design, and lesson 4 puts real numbers behind it.

::: example Verifying the altitude offset numerically
At $v_E = 7800\ \mathrm{m/s}$, $\gamma_E = -20^\circ$, $\beta = 200\ \mathrm{kg/m^2}$, the numerically integrated trajectory (same truth model as above, now tracking $\sqrt\rho\,v^3$ instead of $\rho v^2$) places peak deceleration at $h = 34.21\ \mathrm{km}$, $t = 31.9\ \mathrm{s}$ after entry, and peak heating shape at $h = 42.20\ \mathrm{km}$, $t = 28.2\ \mathrm{s}$ — an altitude gap of $7.99\ \mathrm{km}$, within $1\ \mathrm{percent}$ of the closed form's exact $7.91\ \mathrm{km}$, and confirmed earlier in time as predicted. At the shallower $\gamma_E = -6.5^\circ$, where the closed form's peak-deceleration prediction was already off by $8.4\ \mathrm{percent}$, the numerical altitude gap widens to $8.34\ \mathrm{km}$ — a small but real drift, tracking the same constant-$\gamma$ breakdown identified above, since both peaks are computed from the same flight path.
:::

::: warning The $H\ln 3$ offset is a property of the $\sqrt\rho\,v^3$ scaling, not a universal constant
Change the assumed heating law's exponents — a different correlation, a different flow regime — and the factor of three, and the $\ln 3$ that follows from it, changes with it. What carries over conceptually to any power-law heating correlation is the method: write the peak-quantity's density-dependence as $\rho^p e^{-qc\rho}$ for whatever powers $p, q$ the correlation uses, maximise the same way, and read off a new, still-exact, still-$\beta$-independent altitude offset from peak deceleration.
:::

## Check yourself

::: check
For entries steeper than about $-20^\circ$, the error between the Allen-Eggers closed form and the numerically integrated peak deceleration stays close to $3$ percent regardless of how much steeper the entry gets. What single dropped term is responsible for essentially all of that residual error, and why does it stop growing?
:::

::: answer
Gravity's direct contribution to deceleration along the flight path, $-g\sin\gamma$, dropped when Allen-Eggers assumes drag alone. Its ablation-isolated error sits at $2.3$–$3.2$ percent across every angle tested and reaches its floor value near $-90^\circ$, where the flight path is vertical and the *other* dropped assumption — a changing $\gamma$ — contributes exactly zero, because $\cos(-90^\circ) = 0$ removes the curvature equation identically. With no more curvature error to add, the gravity term alone sets the residual, and it stays roughly constant because $g\sin\gamma$ compared to the peak drag deceleration (tens to hundreds of $g_0$) is a similarly small fraction across all these steep angles.
:::

::: check
Explain, physically, why the flight-path-angle-frozen assumption fails so much worse for a shallow entry than for a steep one.
:::

::: answer
A shallow entry spends far longer near the top of the atmosphere, where density and drag are both small, before drag becomes strong enough to matter. During that long, weakly-decelerated stretch, gravity (and, near the entry corridor's edge, the vehicle's own orbital speed working against gravity through the centrifugal-relief term) has time to change the flight-path angle by an amount that is no longer small compared to the shallow $\gamma_E$ itself. A steep entry reaches significant drag almost immediately, leaving no time for $\gamma$ to drift before the trajectory is essentially decided.
:::

::: check
Why is it possible to trust a peak-deceleration number computed by two different numerical methods (say, `DOP853` and `RK45`) agreeing to six significant figures, when neither method gives an exact answer?
:::

::: answer
Two independent numerical methods with different error characteristics, run at tight tolerance, are very unlikely to agree to six significant figures by coincidence if either has a significant, uncorrected truncation error; agreement to that precision is strong evidence that both have converged to the same underlying (numerically exact, if not closed-form) solution of the equations of motion. This is the standard way to build confidence in a number that has no independent closed-form check: not proving it exact, but showing it is insensitive to the details of how it was computed.
:::

::: check
Derive the density ratio $\rho^*_q/\rho^*_a$ at which peak heating (scaling as $\sqrt\rho\,v^3$) occurs relative to peak deceleration (scaling as $\rho v^2$), and state the resulting altitude gap in terms of $H$.
:::

::: answer
Peak deceleration maximises $\rho\,e^{-c\rho}$, giving $\rho^*_a = 1/c$. Peak heating maximises $\sqrt\rho\,e^{-3c\rho}$ (the extra power of $v$ inside the same exponential triples the effective decay rate), giving $\rho^*_q = 1/(6c) = \rho^*_a/3$. The altitude gap follows from $\rho = \rho_0 e^{-h/H}$: $h^*_a - h^*_q = H\ln(\rho^*_a/\rho^*_q) = H\ln 3$, which is $7.91\ \mathrm{km}$ for this module's $H = 7200\ \mathrm{m}$, independent of $\beta$, $\gamma_E$, or $v_E$.
:::

::: check
A colleague argues that because peak deceleration does not depend on $\beta$, peak heating rate must not either, "by the same logic." Is this correct?
:::

::: answer
No. The two peaks cancel $\beta$ for different, specific reasons tied to their different velocity exponents. Peak deceleration's prefactor is $1/\beta$, which exactly meets a $\beta^1$ inside $\rho^*_a$ once you substitute the maximising density back in, cancelling completely. Peak heating's prefactor has no $\beta$ at all ($\dot q \propto \sqrt\rho\,v^3$ carries no explicit mass or area), so the $\sqrt{\rho^*_q} \propto \sqrt\beta$ that comes from substituting its own maximising density survives untouched — peak heating rate scales as $\sqrt\beta$, rising (not staying fixed) as the vehicle's ballistic coefficient rises.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Truth model | Spherical, non-rotating planet, no lift: $\dot v = -\rho v^2/(2\beta) - g\sin\gamma$, $\dot\gamma = \cos\gamma(v/r - g/v)$, $\dot r = v\sin\gamma$ |
| Closed-form error, steep ($\lvert\gamma_E\rvert \gtrsim 20^\circ$) | $3$–$4$ percent, dominated by the neglected gravity term in $\dot v$ |
| Closed-form error, shallow ($\lvert\gamma_E\rvert \lesssim 6^\circ$) | Tens to hundreds of percent, dominated by the frozen-$\gamma$ assumption |
| Which assumption fails first | Constant flight-path angle — small contribution at $-90^\circ$, dominant and explosive by $-1^\circ$ |
| $\dot q \propto \sqrt\rho\,v^3$ | Convective heating rate scaling (Sutton-Graves motivation; full correlation in lesson 4) |
| $\rho^*_q = \beta s/(3H)$ | Density at peak heating — one-third the peak-deceleration density |
| $h^*_a - h^*_q = H\ln 3 = 7.91\ \mathrm{km}$ | Peak heating occurs this far above, and earlier than, peak deceleration — exact, $\beta$-independent |
| $\dot q_{\max} \propto \sqrt\beta$ | Peak heating rate rises with ballistic coefficient, unlike peak deceleration |

The next lesson puts real units and a real constant behind $\dot q \propto \sqrt\rho\,v^3$ — the Sutton-Graves correlation — and works out what peak heat rate and total integrated heat load actually cost a thermal protection system, for vehicles at several ballistic coefficients.
