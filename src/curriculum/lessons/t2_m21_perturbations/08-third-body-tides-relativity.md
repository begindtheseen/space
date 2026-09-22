---
id: l08-third-body-tides-relativity
title: Third-body attraction, tides, and relativistic corrections
minutes: 17
covers:
  - third-body lunar and solar perturbations
  - tides and relativistic corrections
---

$J_2$ and drag are both, in a sense, local effects — they come from Earth's own mass and atmosphere, and both fall off sharply with distance. The Moon and Sun are not local: every spacecraft orbiting Earth, from a $300\,\mathrm{km}$ technology demonstrator to a geostationary communications satellite, feels their gravity directly, and unlike $J_2$ this pull *grows* relative to two-body gravity as altitude increases rather than shrinking. This lesson derives that perturbation from first principles, sizes it at low and geostationary altitude, and then covers two smaller effects that round out the force model: the tidal deformation of Earth itself, and the general-relativistic correction that — while utterly negligible for where a spacecraft's orbit points — turns out to be operationally essential for how well its clock keeps time.

## Deriving the third-body perturbing acceleration

Work in an inertial frame with Earth at position $\mathbf{R}_E$, the spacecraft at $\mathbf{R}_{\text{sat}}$, and the perturbing body (Moon or Sun) at $\mathbf{R}_3$. Newton's law of gravitation gives the inertial acceleration of each of the first two, including the pull of the third body on both:

$$
\ddot{\mathbf{R}}_{\text{sat}} = -\frac{\mu_E(\mathbf{R}_{\text{sat}}-\mathbf{R}_E)}{\lVert\mathbf{R}_{\text{sat}}-\mathbf{R}_E\rVert^3} - \frac{\mu_3(\mathbf{R}_{\text{sat}}-\mathbf{R}_3)}{\lVert\mathbf{R}_{\text{sat}}-\mathbf{R}_3\rVert^3}, \qquad
\ddot{\mathbf{R}}_E = -\frac{\mu_3(\mathbf{R}_E-\mathbf{R}_3)}{\lVert\mathbf{R}_E-\mathbf{R}_3\rVert^3} .
$$

The geocentric position $\mathbf{r}=\mathbf{R}_{\text{sat}}-\mathbf{R}_E$ is what every propagator in this module actually integrates, so subtract: $\ddot{\mathbf{r}} = \ddot{\mathbf{R}}_{\text{sat}}-\ddot{\mathbf{R}}_E$. Writing $\mathbf{d}=\mathbf{R}_3-\mathbf{R}_E$ for the geocentric position of the third body, $\mathbf{R}_{\text{sat}}-\mathbf{R}_3 = \mathbf{r}-\mathbf{d}$ and $\mathbf{R}_E-\mathbf{R}_3=-\mathbf{d}$, and the substitution gives, after collecting terms,

$$
\ddot{\mathbf{r}} = -\frac{\mu_E\mathbf{r}}{r^3} + \mu_3\left[\frac{\mathbf{d}-\mathbf{r}}{\lVert\mathbf{d}-\mathbf{r}\rVert^3} - \frac{\mathbf{d}}{d^3}\right] .
$$

The perturbing term, $\mathbf{a}_{3} = \mu_3\big[(\mathbf{d}-\mathbf{r})/\lVert\mathbf{d}-\mathbf{r}\rVert^3 - \mathbf{d}/d^3\big]$, is a **difference** of two accelerations: the third body's direct pull on the spacecraft, minus its pull on Earth. This is the mechanism, made explicit — a geocentric frame is not inertial, because Earth itself accelerates toward the Moon and Sun, and $\mathbf{a}_3$ is exactly the part of the third body's pull on the spacecraft that Earth's own acceleration does *not* already cancel out. This is also why it is often called a *tidal* or *differential* perturbation: it is not "how hard the Moon pulls," which would be enormous, but "how much harder or softer the Moon pulls on the spacecraft than it pulls on Earth," which is much smaller.

## The small-body expansion

Since the spacecraft is always far closer to Earth than to the Moon or Sun ($r\ll d$), expand $(\mathbf{d}-\mathbf{r})/\lVert\mathbf{d}-\mathbf{r}\rVert^3$ to first order in $r/d$. With $\hat{\mathbf{d}}=\mathbf{d}/d$, $\lVert\mathbf{d}-\mathbf{r}\rVert^2 = d^2(1-2\hat{\mathbf{d}}\cdot\mathbf{r}/d+r^2/d^2)$, so $\lVert\mathbf{d}-\mathbf{r}\rVert^{-3}\approx d^{-3}(1+3\hat{\mathbf{d}}\cdot\mathbf{r}/d)$ to this order, and

$$
\mathbf{a}_3 \approx \frac{\mu_3}{d^3}\Big[3(\hat{\mathbf{d}}\cdot\mathbf{r})\hat{\mathbf{d}} - \mathbf{r}\Big] .
$$

This is small but not symmetric: for $\mathbf{r}$ aligned with $\hat{\mathbf{d}}$ (the spacecraft on the Earth–Moon or Earth–Sun line), $\hat{\mathbf{d}}\cdot\mathbf{r}=r$, and the bracket gives $3r\hat{\mathbf{d}}-r\hat{\mathbf{d}}=2r\hat{\mathbf{d}}$, so $\lVert\mathbf{a}_3\rVert\approx2\mu_3r/d^3$; for $\mathbf{r}$ perpendicular to $\hat{\mathbf{d}}$, $\hat{\mathbf{d}}\cdot\mathbf{r}=0$ and $\lVert\mathbf{a}_3\rVert\approx\mu_3r/d^3$, half as large. This factor-of-two directional dependence is the same structure a tidal bulge has (which is exactly what it is): stretching along the line to the perturbing body, compressing across it.

::: example Lunar and solar perturbation at LEO and GEO
With $\mu_{\text{Moon}}=4902.800\,\mathrm{km^3/s^2}$ at mean distance $d_{\text{Moon}}=384\,400\,\mathrm{km}$, and $\mu_{\text{Sun}}=1.327\,124\,4\times10^{11}\,\mathrm{km^3/s^2}$ at $d_{\text{Sun}}=1\,\mathrm{AU}=1.495\,978\,707\times10^{8}\,\mathrm{km}$, evaluating the exact (unexpanded) formula for a spacecraft aligned with each body:

| | LEO, $r=6778.137\,\mathrm{km}$ | GEO, $r=42\,164.137\,\mathrm{km}$ |
| --- | --- | --- |
| Lunar | $1.20\times10^{-6}\,\mathrm{m/s^2}$ | $8.68\times10^{-6}\,\mathrm{m/s^2}$ |
| Solar | $5.37\times10^{-7}\,\mathrm{m/s^2}$ | $3.34\times10^{-6}\,\mathrm{m/s^2}$ |

Despite the Sun's gravitational parameter exceeding the Moon's by a factor of about $27$ million, the Moon's perturbation is larger at both altitudes, by roughly a factor of $2$ to $2.6$: what matters is $\mu_3/d^3$, and the Moon's proximity ($d^3$ smaller by a factor of about $6\times10^{7}$) more than compensates for its far smaller mass. Both terms grow with the spacecraft's own distance $r$ — a factor of about $6.2$ between LEO and GEO, close to the $r$ ratio itself (the leading-order formula's linear-in-$r$ scaling), the opposite direction from $J_2$'s $r^{-4}$ fall-off, and exactly why lunisolar perturbation is comparable to $J_2$ at geostationary altitude even though it is three orders of magnitude smaller in low orbit.
:::

## Tides: when Earth's shape itself responds

$\mathbf{a}_3$ is the Moon and Sun pulling directly on the spacecraft. There is a second, smaller effect: the same tidal forcing that raises ocean tides also deforms the solid Earth and its oceans, which very slightly redistributes Earth's mass and, through the geopotential of an earlier lesson, changes the $J_2$ and higher coefficients themselves by a small, time-varying amount. The scale of this is set by how much the tidal bulge itself moves Earth's mass compared to how much the permanent equatorial bulge already does: the solid-Earth tide raises the surface by a matter of tens of centimetres, against $J_2$'s permanent equatorial bulge of order $21\,\mathrm{km}$ — a ratio of roughly $1$ part in $70\,000$. Scaling $J_2$ itself down by that same ratio gives a tidal perturbation to the geopotential coefficients of order $10^{-8}$, translating to an acceleration at LEO on the order of $10^{-7}\,\mathrm{m/s^2}$ — smaller than direct lunisolar attraction, comparable to or somewhat below solar radiation pressure, and generally the smallest entry in a complete force-model budget outside of precision geodesy. Real tidal models parametrise this with frequency-dependent Love numbers ($k_2\approx0.3$ for Earth's dominant solid-body response), which this module does not derive; the order-of-magnitude estimate above is what matters for deciding whether a given mission's force model needs to include tides at all.

::: key Third-body perturbation
$$
\mathbf{a}_3 = \mu_3\left[\frac{\mathbf{d}-\mathbf{r}}{\lVert\mathbf{d}-\mathbf{r}\rVert^3} - \frac{\mathbf{d}}{d^3}\right] \approx \frac{\mu_3}{d^3}\big[3(\hat{\mathbf{d}}\cdot\mathbf{r})\hat{\mathbf{d}}-\mathbf{r}\big] .
$$
A differential (tidal) effect: the third body's pull on the spacecraft minus its pull on Earth. Grows roughly linearly with the spacecraft's own distance $r$; the Moon dominates the Sun by proximity despite its far smaller mass. Solid-Earth tides perturb the geopotential itself, at roughly two orders of magnitude below direct lunisolar attraction.
:::

## Relativistic corrections: negligible for the orbit, essential for the clock

General relativity modifies Newtonian gravity with a correction, at the order this module needs, equivalent to a small additional apsidal precession — the Schwarzschild precession, the same effect Einstein famously used to explain the anomalous advance of Mercury's perihelion:

$$
\dot\omega_{\text{GR}} = \frac{3n\mu}{c^2a(1-e^2)} , \qquad c = 299\,792.458\,\mathrm{km/s} .
$$

::: example Calibrating against Mercury before trusting the formula on a satellite
Before applying an unfamiliar formula to a spacecraft, check it against the case history already settled it. For Mercury, $a=57\,909\,050\,\mathrm{km}$, $e=0.205\,630$, orbiting the Sun ($\mu_{\text{Sun}}=1.327\,124\,4\times10^{11}\,\mathrm{km^3/s^2}$), $n=8.2668\times10^{-7}\,\mathrm{rad/s}$ (an $87.969$-day period, matching the accepted value): the formula gives $\dot\omega_{\text{GR}}=42.981$ arcseconds per century — against the historically measured, famously anomalous $42.98$ arcsec/century that general relativity was built to explain. With the formula validated on the case it was designed for, apply it to the $550\,\mathrm{km}$, $e=0.05$, $i=51.6^\circ$ orbit used throughout this module's $J_2$ derivations: $n=1.0948\times10^{-3}\,\mathrm{rad/s}$, giving
$$
\dot\omega_{\text{GR}} = \frac{3(1.0876\times10^{-3})(398\,600.4418)}{(299\,792.458)^2(6928.137)(1-0.05^2)} = 2.108\times10^{-12}\,\mathrm{rad/s} = 1372\ \text{arcsec/century} .
$$
That sounds large next to Mercury's $43$ arcsec/century — a low satellite orbits far more often per century than Mercury does — but compared to this same orbit's $J_2$ apsidal rate of $3.483\times10^{-7}\,\mathrm{rad/s}$ (from the $J_2$-secular-rates lesson), the ratio is $\dot\omega_{\text{GR}}/\dot\omega_{J_2}\approx3.0\times10^{-6}$: general relativity moves this orbit's perigee about three-hundred-thousand times more slowly than $J_2$ does. For anything this module's propagators are used for — mission design, station-keeping budgets, conjunction screening — relativistic orbit-shape corrections are safely ignored.
:::

Orbit shape is not where relativity earns its keep in operational GNC; timing is. A clock's rate depends on both its velocity (special-relativistic time dilation, which slows a moving clock) and its position in a gravitational potential (general-relativistic time dilation, which speeds up a clock higher in a weaker field). For a GPS satellite at $a\approx26\,562\,\mathrm{km}$ against a clock at Earth's equatorial surface, the two effects are comparable in size and opposite in sign:

$$
\left(\frac{\Delta f}{f}\right)_{\text{GR}} \approx \frac{\mu}{c^2}\left(\frac{1}{R_E}-\frac{1}{a}\right) = +45.65\ \mu\text{s/day (satellite clock runs fast)},
$$
$$
\left(\frac{\Delta f}{f}\right)_{\text{SR}} \approx -\frac{v_{\text{sat}}^2-v_{\text{surface}}^2}{2c^2} = -7.11\ \mu\text{s/day (satellite clock runs slow)},
$$

for a net rate of $+38.5\ \mu\text{s/day}$ — the satellite clock, left uncorrected, gains almost $39\ \mu\mathrm{s}$ per day relative to a ground clock, which at the speed of light corresponds to a position error growing by about $11.6\,\mathrm{km}$ per day if left uncorrected. GPS satellite clocks are deliberately manufactured to tick slightly slow on the ground (offset by very close to this same $38.5\ \mu\mathrm{s}$/day, applied as a fixed pre-launch frequency offset) specifically so that once in orbit, relativity brings them back to the correct rate. This is the module's clearest example of a perturbation whose effect on trajectory shape is utterly negligible while its effect on an entirely different subsystem — precision timing — is mission-critical.

::: warning "Negligible for the orbit" is not "negligible for the mission"
It is tempting to read the $3\times10^{-6}$ ratio above and conclude relativity is unimportant in this module's context. That conclusion is correct for orbit propagation and wrong for anything involving precise time transfer — GPS, laser ranging, or any system that infers range from a light-travel-time measurement. The right question is never "is this perturbation small", but "small compared to what, for what purpose" — exactly the theme the module opened with.
:::

## Check yourself

::: check
Explain, in one sentence, why $\mathbf{a}_3$ is written as a *difference* of two terms rather than only the Moon's direct gravitational pull on the spacecraft.
:::

::: answer
Because the geocentric frame the spacecraft's motion is described in is itself accelerating (Earth is falling toward the Moon and Sun too), so the perturbation that actually shows up in the *relative* equation of motion is the third body's pull on the spacecraft minus its pull on Earth — the part of the attraction Earth's own acceleration does not already account for.
:::

::: check
Why does the Moon perturb a satellite's orbit more than the Sun does, despite the Sun's much larger mass?
:::

::: answer
The leading-order perturbation scales as $\mu_3/d^3$, not $\mu_3$ alone. The Sun's gravitational parameter exceeds the Moon's by a factor of about $27$ million, but the Sun is about $389$ times farther away, and distance enters cubed: $389^3\approx5.9\times10^7$, which outweighs the mass ratio and leaves the Moon's $\mu_3/d^3$ larger, so its perturbing effect on a satellite is larger despite its far smaller mass.
:::

::: check
A mission at geostationary altitude budgets far more propellant for inclination (north–south) station-keeping than for the equivalent nodal correction at $400\,\mathrm{km}$. Using this lesson's scaling, explain why.
:::

::: answer
Lunisolar (third-body) perturbation, which drives out-of-plane drift at geostationary altitude, grows roughly linearly with the spacecraft's own distance from Earth, while $J_2$ falls off as $r^{-4}$. At $400\,\mathrm{km}$, $J_2$ dominates lunisolar attraction by roughly three orders of magnitude, so orientation drift there is almost entirely a $J_2$ story; at geostationary altitude the two are comparable, so lunisolar attraction is no longer a small correction to a $J_2$-dominated picture but a leading driver in its own right, which is why geostationary inclination station-keeping (fighting lunisolar attraction) is a major, ongoing propellant cost that has no equivalent-sized counterpart in low orbit.
:::

::: check
Why is the Mercury calculation included before applying the relativistic precession formula to a satellite, rather than just quoting the satellite result directly?
:::

::: answer
Mercury's perihelion advance is one of the most precisely measured, historically significant confirmations of general relativity, so reproducing its accepted value ($42.98$ arcsec/century) from the same formula this lesson then applies to a satellite is an independent check that the formula, its constants, and its unit conversions are all correct, before trusting it on a case with no independent, famous reference value to check against.
:::

::: check
A precision-timing engineer says "relativistic effects are negligible in this module's force model, so I can ignore them in my GPS receiver design." Is this reasoning sound?
:::

::: answer
No — it conflates two different questions. This module's force-model comparisons concern how much a perturbation moves a spacecraft's *trajectory*, where relativistic corrections are indeed negligible next to $J_2$ (a ratio of about three parts in a million). A GPS receiver's accuracy depends on *time transfer*, where the same relativistic effects amount to tens of microseconds per day — enough to produce kilometres of position error if uncorrected. "Negligible for trajectory shape" and "negligible for timing" are separate claims with separate answers.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}_3 = \mu_3\big[(\mathbf{d}-\mathbf{r})/\lVert\mathbf{d}-\mathbf{r}\rVert^3-\mathbf{d}/d^3\big]$ | Exact third-body (tidal/differential) perturbation |
| $\mathbf{a}_3 \approx (\mu_3/d^3)\big[3(\hat{\mathbf{d}}\cdot\mathbf{r})\hat{\mathbf{d}}-\mathbf{r}\big]$ | Leading-order form; factor of $2$ between aligned and perpendicular geometry |
| Lunar $\approx1.2\times10^{-6}$, solar $\approx5.4\times10^{-7}\,\mathrm{m/s^2}$ | At LEO; both roughly $7\times$ larger by GEO |
| Third body grows with $r$; $J_2$ falls with $r^{-4}$ | Why lunisolar rivals $J_2$ at GEO despite being $1000\times$ smaller at LEO |
| Solid-Earth tides | Perturb the geopotential coefficients themselves, order $10^{-7}\,\mathrm{m/s^2}$ at LEO — smaller than direct third-body attraction |
| $\dot\omega_{\text{GR}} = 3n\mu/[c^2a(1-e^2)]$ | Schwarzschild apsidal precession; validated against Mercury's $42.98$ arcsec/century |
| GPS clock relativity | $+45.65\,\mu\text{s/day}$ (GR) $-7.11\,\mu\text{s/day}$ (SR) $=+38.5\,\mu\text{s/day}$ net — negligible for trajectory, essential for timing |

The next lesson returns to a perturbation with the opposite character from gravity: solar radiation pressure, which switches on and off as the spacecraft enters and leaves Earth's shadow.
