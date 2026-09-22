---
id: l05-sun-synchronous-orbits
title: Designing a sun-synchronous orbit
minutes: 15
covers:
  - sun-synchronous orbits
---

Most Earth-imaging satellites you can name — Landsat, Sentinel-2, most weather satellites, most reconnaissance satellites — fly at an inclination close to $98^\circ$, a few degrees past polar, at altitudes between about $400$ and $800\,\mathrm{km}$. That specific, slightly-retrograde tilt is not a coincidence or a convenience; it is the unique inclination, at each altitude, that makes the previous lesson's nodal regression rate exactly cancel Earth's own motion around the Sun. The result is an orbit whose node tracks the Sun all year, so the satellite crosses the equator at the same local solar time on every single pass — the same lighting, the same shadow lengths, the same sun angle in every image, whether it is taken in January or July.

This lesson turns the nodal-regression formula from the previous lesson around: instead of asking how fast a given orbit's node drifts, it asks what inclination makes that drift equal a chosen target, and checks the answer both analytically and against a full numerical integration.

## What sun-synchronous means, and the target rate

Earth orbits the Sun once per year, so the Sun's apparent position against the stars — and, more usefully here, the direction from Earth to the Sun — sweeps through $360^\circ$ in one tropical year, $365.2421897$ days. A sun-synchronous orbit is one whose ascending node keeps pace with that sweep: the node rotates eastward (the same direction the Sun appears to move) at exactly

$$
\dot\Omega_{\text{target}} = \frac{360^\circ}{365.2421897\ \text{days}} = \frac{2\pi}{365.2421897\times86\,400\,\mathrm{s}} = 1.991\,064\times10^{-7}\,\mathrm{rad/s} = 0.985\,647^\circ/\mathrm{day} .
$$

Because the orbital plane keeps a fixed angle to the Earth–Sun line, the local mean solar time at which the satellite crosses the equator — its local time of the ascending node, LTAN — stays constant throughout the year, drifting only as slowly as third-body and other perturbations (not $J_2$) push it, which later lessons quantify. A mission can choose any LTAN it wants at launch — a $10{:}30$ morning-crossing orbit for well-shadowed optical imagery, a dawn–dusk ($6{:}00$/$18{:}00$) orbit that never enters eclipse — but every sun-synchronous orbit, whatever its LTAN, shares the same $\dot\Omega_{\text{target}}$.

## Solving for the inclination

Set the previous lesson's secular nodal rate equal to the target and solve for $\cos i$:

$$
-\frac{3}{2}nJ_2\left(\frac{R_E}{a}\right)^2\frac{\cos i}{(1-e^2)^2} = \dot\Omega_{\text{target}} \quad\Longrightarrow\quad
\cos i = -\frac{2\,\dot\Omega_{\text{target}}\,(1-e^2)^2}{3nJ_2(R_E/a)^2} .
$$

For a near-circular orbit ($e\approx0$, as almost every operational sun-synchronous mission flies), this simplifies to $\cos i = -2\dot\Omega_{\text{target}}a^{7/2}/(3J_2R_E^2\sqrt{\mu})$ after substituting $n=\sqrt{\mu/a^3}$ — a formula with $a$ as the only free variable once $\dot\Omega_{\text{target}}$, $J_2$, $R_E$, $\mu$ are fixed, which is exactly why sun-synchronous design is usually phrased as "choose an altitude, look up (or compute) the required inclination."

The right-hand side is negative for every physically sensible altitude, which forces $\cos i<0$, i.e. $i>90^\circ$ — **every sun-synchronous orbit is retrograde.** This is not a design choice; it is forced by the sign structure of $J_2$'s nodal formula. A prograde orbit's node can only regress ($\dot\Omega<0$), and the target rate is a positive (eastward) drift, so only a retrograde orbit, which advances its node, can possibly match it.

::: example Required inclination at four common altitudes
Using $\mu=398\,600.4418\,\mathrm{km^3/s^2}$, $J_2=1.082\,626\,68\times10^{-3}$, $R_E=6378.137\,\mathrm{km}$, $e=0$:

| Altitude | $a$ (km) | $\cos i$ | $i$ |
| --- | --- | --- | --- |
| $400\,\mathrm{km}$ | $6778.137$ | $-0.12239$ | $97.030^\circ$ |
| $550\,\mathrm{km}$ | $6928.137$ | $-0.13214$ | $97.593^\circ$ |
| $700\,\mathrm{km}$ | $7078.137$ | $-0.14242$ | $98.188^\circ$ |
| $800\,\mathrm{km}$ | $7178.137$ | $-0.14959$ | $98.603^\circ$ |

Each of these, substituted back into the nodal-rate formula, reproduces $\dot\Omega_{\text{target}}=0.985\,647^\circ/\mathrm{day}$ to at least five significant figures — by construction, since that is exactly the equation that was solved. The inclination increases (moves further past polar) as altitude increases, because both $n$ and $(R_E/a)^2$ shrink with $a$, weakening $J_2$'s lever on the node; matching the same fixed target rate at a weaker lever requires tilting further from polar to compensate.
:::

## Numerical verification

::: example Confirming the 550 km design by direct integration
Take the $550\,\mathrm{km}$, $i=97.593^\circ$ circular orbit from the table above and integrate the exact $J_2$-perturbed Cartesian equations of motion for $150$ orbits, exactly as the previous lesson's confirmation did. The fitted nodal rate comes out at $0.9902^\circ/\mathrm{day}$ against the target (and the epoch-osculating analytic prediction, which match each other to five digits by construction) of $0.9856^\circ/\mathrm{day}$ — a $0.45\%$ excess, stable across integrator tolerance from $\texttt{rtol}=10^{-9}$ to $10^{-12}$. This is the same osculating-versus-mean-element residual the previous lesson explained in full: the orbit's mean semi-major axis, averaged over one revolution, sits at about $6918.8\,\mathrm{km}$ rather than the epoch-osculating $6928.137\,\mathrm{km}$, and re-evaluating the analytic rate at that mean element brings the prediction to $0.9910^\circ/\mathrm{day}$, within $0.08\%$ of the numerical fit. A mission that needs the drift right to the last digit designs against mean elements, or iterates the launch inclination slightly against a mission-specific propagator; a mission-design first pass, like the table above, uses the direct osculating formula and expects an error at this level.
:::

::: warning Sun-synchronous is not the same as polar
Every sun-synchronous orbit in practical use is close to polar — within about $15^\circ$ of it, for altitudes below $1500\,\mathrm{km}$ — but "sun-synchronous" and "polar" are different design conditions that happen to overlap numerically at low altitude. A polar orbit ($i=90^\circ$ exactly) has *zero* nodal regression (the previous lesson's $\cos i$ factor vanishes), so a purely polar orbit is the one inclination that is guaranteed *not* to be sun-synchronous. Conversely, the table above shows the required inclination climbing well past $100^\circ$ at altitudes above about $1500\,\mathrm{km}$; solving the exact expression shows no real solution exists above roughly $5970\,\mathrm{km}$ altitude at all, since $\cos i$ would need to exceed $1$ in magnitude — sun-synchronous orbits are, in this sense, a low-orbit phenomenon, bounded by $J_2$'s own $(R_E/a)^2$ fall-off.
:::

## LTAN, mission design, and what J2 does not control

The inclination formula fixes how *fast* the node drifts; it says nothing about *where* the node starts. That starting value — equivalently, the LTAN at launch — is a separate mission-design choice, set by choosing the launch time and the target right ascension of the ascending node. Two satellites can share an identical altitude and inclination, both perfectly sun-synchronous by the criterion above, and cross the equator at completely different local times: one at $10{:}30$ for optical imaging with long shadows and good contrast, one at dawn–dusk for a satellite that wants to stay almost permanently in sunlight and never point its solar arrays through a deep eclipse. A constellation that needs multiple looks per day at the same LTAN, or a formation that needs to fly in the same orbital plane, is really a statement about matching both the inclination (drift rate) and the node (drift phase) simultaneously.

$J_2$'s nodal formula only ever gives the *secular* rate; it says nothing about the short-period wobble in the osculating node (a topic in its own right, two lessons ahead) and nothing about the slow additional drift that third-body and other higher-order perturbations impose over a multi-year mission. Real sun-synchronous missions budget propellant for periodic inclination trims precisely because $J_2$ is the dominant but not the only term acting on the node.

## Check yourself

::: check
Explain, using only the sign of $\dot\Omega_{\text{target}}$ and the sign structure of the nodal-rate formula, why no prograde orbit can ever be sun-synchronous.
:::

::: answer
$\dot\Omega_{\text{target}}$ is positive (the node must advance eastward, matching the Sun's apparent yearly motion). The nodal-rate formula is $\dot\Omega=-\tfrac32nJ_2(R_E/a)^2\cos i/(1-e^2)^2$, where every factor in front of $\cos i$ is positive; the overall sign of $\dot\Omega$ is therefore the opposite sign of $\cos i$. A prograde orbit has $i<90^\circ$, so $\cos i>0$, forcing $\dot\Omega<0$ — the node can only regress, never advance. Matching a positive target rate requires $\cos i<0$, i.e. $i>90^\circ$, retrograde.
:::

::: check
Two sun-synchronous missions fly at $400\,\mathrm{km}$ and $800\,\mathrm{km}$. Without recomputing, say which one requires the larger departure from a purely polar inclination, and why.
:::

::: answer
The $800\,\mathrm{km}$ mission requires the larger departure from polar ($98.603^\circ$, versus $97.030^\circ$ at $400\,\mathrm{km}$). Both $n$ (mean motion) and $(R_E/a)^2$ shrink as altitude increases, weakening $J_2$'s nodal lever; to still produce the same fixed target drift rate with a weaker lever, the design must lean on the $\cos i$ factor more heavily, which means tilting further from $90^\circ$.
:::

::: check
A numerical integration of a sun-synchronous design shows a fitted nodal rate $0.45\%$ higher in magnitude than the analytic target. Is this evidence the orbit was designed with the wrong inclination?
:::

::: answer
No. The previous lesson showed this exact size and sign of discrepancy arises from comparing a mean-element secular-rate formula against a rate measured from osculating elements at one specific epoch, and demonstrated it is step-size and tolerance independent — a real, explainable bookkeeping effect, not a design error. Re-evaluating the analytic rate using the orbit's time-averaged (mean) elements instead of the epoch-osculating ones closes most of the gap, confirming the inclination itself is correct.
:::

::: check
A mission wants two satellites in the same sun-synchronous orbital plane, $180^\circ$ apart in true anomaly, to double the revisit rate over any given point. Does the inclination formula in this lesson need to change for the second satellite?
:::

::: answer
No. The nodal-rate formula depends on $a$, $e$, $i$ alone — not on where in the orbit the spacecraft currently is (true anomaly does not appear). Both satellites, sharing the same $a$, $e$, $i$, have identical $\dot\Omega$ regardless of their phase separation; placing them $180^\circ$ apart is a separate choice about phasing within the shared plane; it does not require, or permit, a different inclination.
:::

::: check
Using the retrograde requirement and the trend from the worked example, sketch (in words) what happens to the required inclination as altitude approaches the roughly $5970\,\mathrm{km}$ limit mentioned in the warning above.
:::

::: answer
As altitude increases toward that limit, $\cos i$ must become more and more negative to compensate the shrinking $nJ_2(R_E/a)^2$ prefactor, so $i$ climbs well past $98$–$100^\circ$ toward $180^\circ$ — a fully retrograde equatorial orbit, at which point $\cos i=-1$ is the most negative value possible and no higher altitude can be accommodated at all. In practice, no mission flies anywhere near this limit; every operational sun-synchronous satellite sits in the $97^\circ$–$102^\circ$ range, at altitudes well under $1500\,\mathrm{km}$, where the design trade is thermal, resolution, and drag lifetime, not the mathematical existence of a solution.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot\Omega_{\text{target}} = 2\pi/(365.2421897\times86\,400\,\mathrm{s}) = 0.985\,647^\circ/\mathrm{day}$ | Required nodal rate; matches Earth's motion around the Sun |
| $\cos i = -2\dot\Omega_{\text{target}}(1-e^2)^2/\big[3nJ_2(R_E/a)^2\big]$ | Sun-synchronous inclination, solved from the $J_2$ nodal-rate formula |
| Every sun-synchronous orbit is retrograde | Forced by the positive target rate against the formula's $-\cos i$ dependence |
| $97.03^\circ$, $97.59^\circ$, $98.19^\circ$, $98.60^\circ$ | Required inclination at $400$, $550$, $700$, $800\,\mathrm{km}$ altitude, circular |
| LTAN | Local solar time of the ascending node; set by launch node choice, not by the inclination |
| No solution above $\approx5970\,\mathrm{km}$ altitude | $\cos i$ would need to exceed unity in magnitude |
| Numerical check | $150$-orbit integration reproduces the target rate to $0.45\%$ on osculating elements, $0.08\%$ on mean elements |

The next lesson makes precise the mean-versus-osculating distinction this lesson and the last one both leaned on, quantifying exactly how large the short-period wobble is and why a trend line, not a single state vector, is what a secular rate is measured against.
