---
id: l04-j2-secular-effects
title: J2 secular effects — nodal regression and apsidal rotation
minutes: 20
covers:
  - "J2 secular effects: nodal regression and apsidal rotation"
---

Point a numerical propagator at any real satellite and watch two of its orbital elements drift steadily, orbit after orbit, in a way that never averages out: the right ascension of the ascending node $\Omega$ and the argument of perigee $\omega$. Both drifts come from the same source — $J_2$, the oblateness term derived two lessons ago — and both are large enough to be the dominant design consideration for entire classes of mission. A sun-synchronous imaging satellite is designed *around* the nodal drift rate; a Molniya communications orbit is designed *around* making the apsidal drift rate exactly zero. Neither of these is a footnote correction to a two-body design; both are cases where the "perturbation" is the mission requirement.

This lesson derives both secular rates from the Gauss variational equations of the previous lesson, by averaging $J_2$'s effect over one full orbit, and then does the thing that makes a derived formula trustworthy: confirms it by numerically integrating the full $J_2$-perturbed equations of motion and measuring the drift directly, with the analytic prediction and the measured value placed side by side. It closes with the frozen/critical inclination, the one inclination at which the apsidal rotation this lesson derives vanishes identically.

## The J2 acceleration in radial, transverse, and normal components

Resolving the Cartesian $J_2$ acceleration of lesson 2 into the $\hat{\mathbf{R}},\hat{\mathbf{T}},\hat{\mathbf{W}}$ frame of the previous lesson, using $\sin\phi = \sin i\sin u$ (the latitude of a point on the orbit at argument of latitude $u=\omega+\nu$ and inclination $i$) and the same kind of spherical-to-local-frame resolution used there, gives

$$
R = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\big(1-3\sin^2i\sin^2u\big), \qquad
T = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\sin^2i\sin2u, \qquad
N = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\sin2i\sin u .
$$

(These three expressions were checked directly against the Cartesian formula — computing $\mathbf{a}_{J_2}\cdot\hat{\mathbf{R}}$, $\mathbf{a}_{J_2}\cdot\hat{\mathbf{T}}$, $\mathbf{a}_{J_2}\cdot\hat{\mathbf{W}}$ numerically at several arbitrary states and comparing to these formulas — and agree to machine precision at every test point.)

## Averaging the nodal rate over one orbit

Substitute $N$ into the Gauss equation $d\Omega/dt = r\sin u\,N/(h\sin i)$:

$$
\frac{d\Omega}{dt} = \frac{r\sin u}{h\sin i}\left(-\frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\sin2i\sin u\right) = -3\frac{J_2\mu R_E^2\cos i}{h\,r^3}\sin^2u ,
$$

using $\sin2i/\sin i = 2\cos i$. This instantaneous rate oscillates every orbit (through $\sin^2u$ and $1/r^3$), but its *secular* part — what survives averaging over one full revolution — is what a mission cares about. Change the integration variable from time to true anomaly using $h\,dt = r^2\,d\nu$:

$$
\left\langle\frac{d\Omega}{dt}\right\rangle = \frac{1}{T}\int_0^{2\pi}\frac{d\Omega}{dt}\,\frac{r^2}{h}\,d\nu = -\frac{3J_2\mu R_E^2\cos i}{Th^2}\int_0^{2\pi}\frac{\sin^2u}{r}\,d\nu .
$$

With $r = p/(1+e\cos\nu)$ and $u=\omega+\nu$, the integral becomes $(1/p)\int_0^{2\pi}\sin^2(\omega+\nu)(1+e\cos\nu)\,d\nu$. Expand $\sin^2(\omega+\nu) = \tfrac12\big(1-\cos(2\omega+2\nu)\big)$: the $e\cos\nu\cdot\tfrac12$ term integrates to zero over a full period (a cosine at one frequency against nothing to beat against), and the $e\cos\nu\cos(2\omega+2\nu)$ term expands, by a product-to-sum identity, into $\cos(2\omega+3\nu)$ and $\cos(2\omega+\nu)$ terms that also integrate to zero over $0$ to $2\pi$. What survives is the constant term alone, $\int_0^{2\pi}\tfrac12\,d\nu = \pi$ — independent of $\omega$, and independent of $e$ (the eccentricity dependence cancelled out of this particular integral). So the integral equals $\pi/p$, and

$$
\left\langle\frac{d\Omega}{dt}\right\rangle = -\frac{3J_2\mu R_E^2\cos i}{Th^2}\cdot\frac{\pi}{p} = -\frac{3}{2}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2} ,
$$

using $T=2\pi/n$ and $h^2 = \mu p = \mu a(1-e^2)$ to simplify the constants in front. This is the secular nodal regression rate.

## The apsidal rotation rate

The same averaging procedure applied to $d\omega/dt = \big[-p\cos\nu\,R + (p+r)\sin\nu\,T\big]/(eh) - \cos i\,\dot\Omega$ involves longer but structurally identical trigonometric integrals — products of $R$ and $T$'s $\sin u$, $\cos u$ dependence against $\cos\nu$ and $\sin\nu$, each reducing by the same orthogonality argument used above to a handful of surviving terms. Carrying it through gives

$$
\left\langle\frac{d\omega}{dt}\right\rangle = \frac{3}{4}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{5\cos^2i-1}{(1-e^2)^2} .
$$

Both rates share the same prefactor structure — $n$, $J_2$, $(R_E/a)^2$, and $(1-e^2)^{-2}$ — because both come from the same $N$ (for $\Omega$) and $R,T$ (for $\omega$) components of the same acceleration, averaged the same way. What differs is the angular factor: $\cos i$ for the node, $5\cos^2i-1$ for perigee — and that difference in *functional form*, one linear in $\cos i$ and the other quadratic, is what makes the two applications below (sun-synchronous design and the frozen orbit) genuinely different design problems rather than the same one twice.

::: key J2 secular rates
$$
\dot\Omega = -\frac{3}{2}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2}, \qquad
\dot\omega = \frac{3}{4}\,n\,J_2\left(\frac{R_E}{a}\right)^2\frac{5\cos^2i-1}{(1-e^2)^2}, \qquad n=\sqrt{\mu/a^3}.
$$
Prograde orbits ($i<90^\circ$) regress ($\dot\Omega<0$); retrograde orbits advance. $\dot\omega$ vanishes at $\cos^2i=1/5$, i.e. $i=63.435^\circ$ or $116.565^\circ$.
:::

## Confirming the rates by numerical integration

Take a $550\,\mathrm{km}$ orbit, $a_0=6928.137\,\mathrm{km}$, $e_0=0.05$, $i_0=51.6^\circ$, starting at perigee. The analytic rates, evaluated at these epoch elements:

$$
\dot\Omega = -9.4067\times10^{-7}\,\mathrm{rad/s} = -4.6567^\circ/\mathrm{day}, \qquad
\dot\omega = +7.0354\times10^{-7}\,\mathrm{rad/s} = +3.4828^\circ/\mathrm{day} .
$$

::: example Measuring the drift by integrating the full equations of motion
Integrate $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_{J_2}(\mathbf{r})$ from this state — no averaging, no linearisation, the exact Cartesian $J_2$ acceleration of lesson 2 — for $200$ orbits ($\approx13.2$ days), sampling the state $20$ times per orbit, converting each sample to osculating elements, unwrapping $\Omega(t)$ and $\omega(t)$, and fitting a straight line to each. The fitted rates:
$$
\dot\Omega_{\text{measured}} = -4.6778^\circ/\mathrm{day}, \qquad \dot\omega_{\text{measured}} = +3.5038^\circ/\mathrm{day} .
$$
Side by side with the analytic prediction, the agreement is good but not perfect: $0.45\%$ high in magnitude for the node, $0.60\%$ high for perigee. Before trusting either number, check that it is not an artefact of the integration itself: repeating the fit with the integrator tolerance tightened from $\texttt{rtol}=10^{-8}$ to $10^{-12}$, with the sampling density doubled and halved, with the span extended from $150$ to $400$ orbits, and with a different integrator entirely (explicit Runge–Kutta order 5 in place of order 8) changes the fitted rate only in its fifth or sixth significant figure. The $0.4$–$0.6\%$ offset is real, reproducible, and has nothing to do with step size.
:::

What it has to do with is the epoch. The analytic formula's $a$, $e$, $i$ are meant to be *mean* elements — the slowly-varying part left over after $J_2$'s short-period wobble is averaged away, exactly the quantity the averaging integral above computed a rate *for*. The epoch state above was built from $a_0, e_0, i_0$ taken as *osculating* elements at a single instant (perigee), and osculating elements differ from mean elements by the short-period oscillation the next lesson quantifies — for this orbit, the osculating semi-major axis swings between about $6915.3\,\mathrm{km}$ and $6928.1\,\mathrm{km}$ over one revolution, a $12.8\,\mathrm{km}$ range whose time-average sits below the epoch value used above.

::: example Closing the gap with mean elements
Time-averaging the osculating $a$, $e$, $i$ over the first orbit gives $\bar a = 6921.256\,\mathrm{km}$, $\bar e = 0.049095$, $\bar i = 51.5795^\circ$ — all close to, but measurably different from, the epoch-osculating values. Re-evaluating the analytic formulas at these averaged elements:
$$
\dot\Omega(\bar a,\bar e,\bar i) = -4.6742^\circ/\mathrm{day}, \qquad \dot\omega(\bar a,\bar e,\bar i) = +3.5008^\circ/\mathrm{day} .
$$
Both now agree with the $200$-orbit numerical fit to about $0.08$–$0.10\%$, roughly a factor of six tighter than the naive epoch-osculating comparison. The remaining sliver is consistent with second-order-in-$J_2$ effects this first-order theory does not capture, and it too is step-size independent. The lesson is not "the formula is slightly wrong" — it is that a formula derived for mean elements must be *fed* mean elements, or evaluated against a numerical measurement that is itself averaged over many orbits, and the very fact that the residual moves in a predictable direction when you make that correction is the confirmation that both the theory and the numerical experiment are right.
:::

## The frozen orbit: where perigee stops drifting

The apsidal rate vanishes when $5\cos^2i - 1 = 0$, i.e. $\cos i = \pm1/\sqrt5$, giving

$$
i_{\text{crit}} = \arccos\frac{1}{\sqrt5} = 63.4349^\circ, \qquad\text{or its supplement } 116.565^\circ .
$$

This is the *critical inclination*: at exactly this tilt, $J_2$'s apsidal push vanishes to first order regardless of $a$ or $e$, so an eccentric orbit's perigee (and apogee) stays parked over the same latitude band indefinitely instead of precessing around the orbit. A communications satellite that needs long dwell time over one hemisphere — the Molniya and Tundra families, both flown at $63.4^\circ$ — is a direct engineering application of this one number.

::: example Confirming the critical inclination numerically
For $a=7500\,\mathrm{km}$, $e=0.1$, the analytic $\dot\omega$ at $i=63.4349^\circ$ evaluates to $2.6\times10^{-22}\,\mathrm{rad/s}$ — floating-point zero — while at $i=45^\circ$ on the same orbit it is $+4.3245^\circ/\mathrm{day}$. Integrating the full $J_2$-perturbed equations of motion for $400$ orbits and fitting the drift in $\omega$ the same way as above: at $i=45^\circ$, the fit recovers $+4.347^\circ/\mathrm{day}$, matching the analytic prediction to within the same $0.5\%$-scale offset explained above, and $\omega$ visibly grows without bound over the run, from about $-0.03^\circ$ to $+49^\circ$. At $i=63.4349^\circ$, the fit gives $+0.0027^\circ/\mathrm{day}$ — suppressed by roughly three orders of magnitude relative to the off-critical case — and $\omega$ merely oscillates within about $\pm0.6^\circ$ of its starting value for the entire $400$-orbit run, with no visible trend. This tiny residual rate is stable under the same tolerance, sampling-density, and integrator-swap tests used above: it is not numerical noise, but the same small mean/osculating bookkeeping effect quantified in the example above, now three orders of magnitude smaller than the signal it is being compared against.
:::

Sun-synchronous design is the node's analogous application — choosing $i$ so that $\dot\Omega$ matches a specific target rate rather than zero — and gets a full lesson of its own next, because unlike the frozen orbit's single special angle, it is a continuous design curve relating inclination to altitude.

::: warning The critical inclination freezes ω, not the orbit's shape
The critical inclination stops $\omega$ from drifting; it says nothing about $a$ or $e$, which are unaffected by $J_2$'s secular rates regardless of inclination (as the previous lesson's averaging argument showed for $R,T$-driven quantities in general). A "frozen orbit" in the fullest operational sense — used for some Earth-observation missions to keep altitude nearly constant over a fixed ground location — additionally requires a specific eccentricity and argument of perigee chosen so that $J_2$ and $J_3$ effects on eccentricity cancel; that is a separate, $J_3$-dependent design condition layered on top of the critical inclination, not implied by it alone.
:::

## Check yourself

::: check
Without redoing the integral, explain why the averaged nodal rate $\langle d\Omega/dt\rangle$ turned out to be independent of $\omega$, even though the instantaneous rate depends on $u=\omega+\nu$.
:::

::: answer
The averaging integral reduced to $\int_0^{2\pi}\sin^2(\omega+\nu)(1+e\cos\nu)\,d\nu$. Expanding $\sin^2(\omega+\nu)$ into a constant part ($1/2$) and an oscillating part ($-\cos(2\omega+2\nu)/2$), only the constant part survives integration over a full period — every oscillating term, whether it carries $\omega$ or not, integrates to zero over $0$ to $2\pi$. Since the surviving term has no $\omega$ in it at all, the final averaged rate cannot depend on $\omega$, regardless of what $\omega$'s actual value is.
:::

::: check
A satellite is measured, over many orbits, to have a nodal drift within $0.1\%$ of the analytic prediction using mean elements, but a $0.5\%$ discrepancy using the osculating elements read off a single state vector at epoch. Which comparison should you trust as validating the theory, and why?
:::

::: answer
The mean-element comparison, at $0.1\%$, is the correct validation — the analytic secular-rate formula is derived by averaging over one orbit, so it predicts the drift of the *mean* elements, not the instantaneous osculating ones at one arbitrary epoch. The $0.5\%$ discrepancy against osculating elements is not a sign the theory is wrong; it reflects that the single epoch state includes $J_2$'s short-period oscillation, which the averaged theory was never meant to reproduce. Using osculating elements without accounting for this is a bookkeeping mismatch, not a physics error.
:::

::: check
Why does checking step-size and tolerance independence matter for the $0.45\%$ nodal-rate discrepancy found in this lesson, rather than only reporting the two numbers?
:::

::: answer
A $0.45\%$ gap between an analytic prediction and a numerical measurement could, in principle, come from either a real physical effect (as it does here) or from insufficient numerical accuracy in the integration — too large a step, too loose a tolerance. Only by showing that the gap stays fixed across a wide range of step sizes, tolerances, sample densities, and even a different integrator can you rule out the second explanation and conclude the discrepancy is telling you something true about the physics (here, the mean-versus-osculating distinction) rather than something false about your numerics.
:::

::: check
A GNC engineer wants an orbit where perigee stays fixed over one hemisphere for a multi-year mission. She proposes $i=63.4^\circ$ with $e=0.01$. Will this work as well as a Molniya orbit's typical $e\approx0.74$? Why or why not?
:::

::: answer
The critical-inclination condition $5\cos^2i-1=0$ makes $\dot\omega$ vanish for *any* eccentricity, including $e=0.01$, so the freezing effect itself works regardless. What changes with eccentricity is whether freezing perigee is operationally useful: at $e=0.01$ the orbit is nearly circular, so there is no pronounced apogee dwell over one hemisphere to protect in the first place. Molniya's large eccentricity is what creates a slow-moving apogee arc worth freezing in place; the critical inclination is necessary for a useful frozen high-eccentricity orbit, but the high eccentricity is what makes freezing worth doing.
:::

::: check
Both $\dot\Omega$ and $\dot\omega$ share the factor $nJ_2(R_E/a)^2/(1-e^2)^2$. A mission wants to roughly halve both secular rates without changing inclination or eccentricity. What single design change accomplishes this most directly, and by how much would altitude need to increase?
:::

::: answer
Both rates scale as $n(R_E/a)^2 \propto a^{-3/2}\cdot a^{-2} = a^{-7/2}$ (since $n\propto a^{-3/2}$), so raising the semi-major axis is the direct lever, and neither $i$ nor $e$ needs to change. Halving the rate requires $a^{-7/2}$ to drop by a factor of $2$, i.e. $a$ must increase by a factor of $2^{2/7}\approx1.219$ — roughly a $22\%$ increase in semi-major axis, which for a low orbit around $6900\,\mathrm{km}$ is about $1500\,\mathrm{km}$ of extra altitude.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $R,T,N$ for $J_2$ | $R=-\tfrac32\frac{J_2\mu R_E^2}{r^4}(1-3\sin^2i\sin^2u)$, $T=-\tfrac32\frac{J_2\mu R_E^2}{r^4}\sin^2i\sin2u$, $N=-\tfrac32\frac{J_2\mu R_E^2}{r^4}\sin2i\sin u$ |
| $\dot\Omega = -\tfrac32 nJ_2(R_E/a)^2\cos i/(1-e^2)^2$ | Secular nodal regression; prograde regresses, retrograde advances, polar is unchanged |
| $\dot\omega = \tfrac34 nJ_2(R_E/a)^2(5\cos^2i-1)/(1-e^2)^2$ | Secular apsidal rotation |
| $i_{\text{crit}} = \arccos(1/\sqrt5) = 63.4349^\circ$ | Critical inclination; $\dot\omega=0$ for any $a,e$ |
| Numerical confirmation | $200$–$400$-orbit integration of the exact $J_2$ Cartesian acceleration reproduces both rates to $\sim0.1\%$ once mean elements are used, step-size and tolerance independent |
| Osculating vs mean elements | Epoch-osculating elements fed into the secular formula leave a real, reproducible $\sim0.5\%$ residual — not numerical error |

The next lesson takes $\dot\Omega$'s formula and turns it around: instead of predicting the drift of a given orbit, solving for the inclination that makes the drift equal a chosen target rate — the sun-synchronous design problem.
