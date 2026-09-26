---
id: l08-third-body-tides-relativity
title: Third-body attraction, tides, and relativistic corrections
minutes: 18
covers:
  - third-body lunar and solar perturbations
  - tides and relativistic corrections
---

$J_2$ and drag are both local effects. They come from Earth's own shape and Earth's own air, and both fade fast as you climb. The Moon and the Sun are different. Every satellite around Earth feels their pull, from a $300\,\mathrm{km}$ test satellite to a geostationary relay. And unlike $J_2$, their nudge *grows* compared with Earth's pull the higher you go.

This lesson derives that nudge, called **third-body attraction** — the first two bodies being Earth and the spacecraft, the third being the Moon or the Sun. It sizes the nudge in low orbit and at geostationary height. Then it covers two smaller effects that finish the list of forces: the tides that the Moon and Sun raise in Earth itself, and the correction from Einstein's relativity. Relativity turns out to be almost nothing for where an orbit goes, and absolutely essential for how a satellite's clock keeps time.

## Everyone falls toward the Moon

Picture two skydivers who jump together. From the ground, both plunge at great speed. But from one skydiver's point of view, the other hardly moves. They are falling together. What one sees the other do is only the *difference* in how they fall.

Earth and a satellite are those two skydivers, and the Moon is what they fall toward. The Moon pulls hard on both. But **[[Earth is falling toward the Moon too|falling-together]]**, so the satellite's orbit *around Earth* only feels the difference between the two pulls.

### The derivation

Let us make that exact. Work in a frame that is not accelerating (an **inertial frame**, fixed against the stars). Name three positions in it:

- $\mathbf{R}_E$, Earth's center;
- $\mathbf{R}_{\text{sat}}$, the spacecraft;
- $\mathbf{R}_3$, the third body — the Moon or the Sun.

Write $\mu_E$ for Earth's gravitational parameter and $\mu_3$ for the third body's. Newton's law of gravity gives each body's acceleration. The spacecraft feels Earth and the third body:

$$
\ddot{\mathbf{R}}_{\text{sat}} = -\frac{\mu_E(\mathbf{R}_{\text{sat}}-\mathbf{R}_E)}{\lVert\mathbf{R}_{\text{sat}}-\mathbf{R}_E\rVert^3} - \frac{\mu_3(\mathbf{R}_{\text{sat}}-\mathbf{R}_3)}{\lVert\mathbf{R}_{\text{sat}}-\mathbf{R}_3\rVert^3} .
$$

Earth feels the third body (the spacecraft's pull on Earth is far too small to matter):

$$
\ddot{\mathbf{R}}_E = -\frac{\mu_3(\mathbf{R}_E-\mathbf{R}_3)}{\lVert\mathbf{R}_E-\mathbf{R}_3\rVert^3} .
$$

Every propagator in this module works with the **geocentric** position $\mathbf{r} = \mathbf{R}_{\text{sat}} - \mathbf{R}_E$, the spacecraft measured from Earth's center. Its acceleration is the difference of the two above: $\ddot{\mathbf{r}} = \ddot{\mathbf{R}}_{\text{sat}} - \ddot{\mathbf{R}}_E$.

To tidy up, write $\mathbf{d} = \mathbf{R}_3 - \mathbf{R}_E$ for the third body's position measured from Earth, with length $d$. Then two of the differences above become

$$
\mathbf{R}_{\text{sat}} - \mathbf{R}_3 = \mathbf{r} - \mathbf{d}, \qquad \mathbf{R}_E - \mathbf{R}_3 = -\mathbf{d} .
$$

Substitute these, subtract, and flip the signs inside the third-body terms (a minus outside times $\mathbf{r} - \mathbf{d}$ is the same as a plus times $\mathbf{d} - \mathbf{r}$):

$$
\ddot{\mathbf{r}} = -\frac{\mu_E\mathbf{r}}{r^3} + \mu_3\left[\frac{\mathbf{d}-\mathbf{r}}{\lVert\mathbf{d}-\mathbf{r}\rVert^3} - \frac{\mathbf{d}}{d^3}\right] .
$$

The first term is the familiar two-body pull. The second is the **third-body perturbation**:

$$
\mathbf{a}_3 = \mu_3\left[\frac{\mathbf{d}-\mathbf{r}}{\lVert\mathbf{d}-\mathbf{r}\rVert^3} - \frac{\mathbf{d}}{d^3}\right] .
$$

Read the bracket as two arrows. The first is the third body's pull on the spacecraft (per unit $\mu_3$). The second is its pull on Earth. $\mathbf{a}_3$ is their **difference**, exactly the skydiver picture.

This is also why it is called a **tidal** or **differential** perturbation. It is not "how hard the Moon pulls", which is large. It is "how much harder or softer the Moon pulls on the spacecraft than on Earth", which is small. The ocean tides come from exactly this difference, as you will see below.

## When the spacecraft is close to Earth

A spacecraft is always much closer to Earth than to the Moon or Sun: $r \ll d$ (read "r much less than d"). That lets us replace the exact bracket with a simpler, very accurate approximation, the **leading-order** form.

Write $\hat{\mathbf{d}} = \mathbf{d}/d$ for the unit vector pointing from Earth toward the third body.

**Step 1: the squared distance.** Expand $\lVert\mathbf{d}-\mathbf{r}\rVert^2 = (\mathbf{d}-\mathbf{r})\cdot(\mathbf{d}-\mathbf{r})$ and pull out $d^2$:
$$
\lVert\mathbf{d}-\mathbf{r}\rVert^2 = d^2 - 2\,\mathbf{d}\cdot\mathbf{r} + r^2 = d^2\left(1 - \frac{2\,\hat{\mathbf{d}}\cdot\mathbf{r}}{d} + \frac{r^2}{d^2}\right) .
$$

**Step 2: raise to the power $-3/2$.** We need $\lVert\mathbf{d}-\mathbf{r}\rVert^{-3}$, which is the squared distance to the power $-3/2$. The small part in the parentheses is about $-2\,\hat{\mathbf{d}}\cdot\mathbf{r}/d$; the $r^2/d^2$ part is smaller still, so drop it. Using the **[[binomial approximation|binomial]]** $(1+x)^{-3/2} \approx 1 - \tfrac32 x$ for small $x$:
$$
\lVert\mathbf{d}-\mathbf{r}\rVert^{-3} \approx \frac{1}{d^3}\left(1 + \frac{3\,\hat{\mathbf{d}}\cdot\mathbf{r}}{d}\right) .
$$

**Step 3: multiply out.** Multiply by $(\mathbf{d} - \mathbf{r})$ and keep only terms of first order in $r/d$:
$$
\frac{\mathbf{d}-\mathbf{r}}{\lVert\mathbf{d}-\mathbf{r}\rVert^3} \approx \frac{1}{d^3}\Big[\mathbf{d} - \mathbf{r} + 3(\hat{\mathbf{d}}\cdot\mathbf{r})\,\hat{\mathbf{d}}\Big] .
$$
(The piece $-\mathbf{r}\cdot 3\,\hat{\mathbf{d}}\cdot\mathbf{r}/d$ is second order, so it goes.)

**Step 4: subtract the pull on Earth.** The $\mathbf{d}/d^3$ cancels the $\mathbf{d}/d^3$ inside the bracket, leaving

$$
\mathbf{a}_3 \approx \frac{\mu_3}{d^3}\Big[3(\hat{\mathbf{d}}\cdot\mathbf{r})\,\hat{\mathbf{d}} - \mathbf{r}\Big] .
$$

That cancellation is the whole story in one line. The huge pull $\mu_3/d^2$ that Earth and spacecraft share drops out. What is left is smaller by a factor of about $r/d$.

### A stretch along the line, a squeeze across it

Try two positions.

- **On the Earth–Moon line.** Then $\hat{\mathbf{d}}\cdot\mathbf{r} = r$ and $\mathbf{r} = r\hat{\mathbf{d}}$, so the bracket is $3r\hat{\mathbf{d}} - r\hat{\mathbf{d}} = 2r\hat{\mathbf{d}}$. The size is $2\mu_3 r/d^3$, pointing *away from Earth*, toward the third body on the near side and away from it on the far side.
- **Across the line** (at right angles to it). Then $\hat{\mathbf{d}}\cdot\mathbf{r} = 0$, the bracket is $-\mathbf{r}$, and the size is $\mu_3 r/d^3$, pointing *toward Earth*.

So the perturbation stretches along the line to the third body and squeezes across it, and the stretch is twice the squeeze. That is the shape of a **[[tidal bulge|tidal-stretch]]**, because it *is* one: the same pattern pulls Earth's oceans into two bulges, one facing the Moon and one facing away.

Notice also that $\mathbf{a}_3$ grows in proportion to $r$. Double the spacecraft's distance from Earth and the nudge roughly doubles. Compare $J_2$, which falls as $1/r^4$.

::: key Third-body perturbation
$$
\mathbf{a}_3 = \mu_3\left[\frac{\mathbf{d}-\mathbf{r}}{\lVert\mathbf{d}-\mathbf{r}\rVert^3} - \frac{\mathbf{d}}{d^3}\right] \approx \frac{\mu_3}{d^3}\big[3(\hat{\mathbf{d}}\cdot\mathbf{r})\hat{\mathbf{d}}-\mathbf{r}\big] .
$$
A differential (tidal) effect: the third body's pull on the spacecraft minus its pull on Earth. It grows roughly linearly with the spacecraft's own distance $r$. The Moon beats the Sun because of its closeness, despite its far smaller mass.
:::

::: example Lunar and solar nudges in LEO and at GEO
Use $\mu_{\text{Moon}} = 4902.800\,\mathrm{km^3/s^2}$ at mean distance $d_{\text{Moon}} = 384\,400\,\mathrm{km}$, and $\mu_{\text{Sun}} = 1.327\,124\,4\times10^{11}\,\mathrm{km^3/s^2}$ at $d_{\text{Sun}} = 1\,\mathrm{AU} = 1.495\,978\,707\times10^{8}\,\mathrm{km}$. Put the spacecraft on the line toward each body, on the near side, and use the exact formula.

**Moon, LEO** ($r = 6778.137\,\mathrm{km}$). Leading order first, as a check: $2\mu_3 r/d^3 = 2(4902.8)(6778.137)/(384\,400)^3 \approx 1.17\times10^{-9}\,\mathrm{km/s^2}$. The exact formula gives $1.20\times10^{-9}\,\mathrm{km/s^2}$. In $\mathrm{m/s^2}$ (multiply by $1000$):

| | LEO, $r = 6778.137\,\mathrm{km}$ | GEO, $r = 42\,164.137\,\mathrm{km}$ |
| --- | --- | --- |
| Lunar | $1.20\times10^{-6}\,\mathrm{m/s^2}$ | $8.68\times10^{-6}\,\mathrm{m/s^2}$ |
| Solar | $5.37\times10^{-7}\,\mathrm{m/s^2}$ | $3.34\times10^{-6}\,\mathrm{m/s^2}$ |

**Moon beats Sun.** The Sun's $\mu$ is about $27$ million times the Moon's. But the Sun is about $389$ times farther away, and distance enters *cubed*: $389^3 \approx 5.9\times10^{7}$. So $\mu_3/d^3$ is about $2.2$ times larger for the Moon, and the table shows the Moon ahead by $2.2$ in LEO and $2.6$ at GEO.

**Growth with height.** From LEO to GEO, $r$ grows by a factor of $6.22$. The solar nudge grows by $6.2$, exactly as the linear formula says. The lunar nudge grows by $7.2$. Why more? At GEO, $r/d_{\text{Moon}} \approx 0.11$, no longer tiny, so the dropped second-order terms start to show: the leading-order formula gives $7.28\times10^{-6}$ there, $16\%$ below the exact near-side value. For the Sun, $r/d$ is under $0.0003$ even at GEO, so the approximation is essentially perfect.

**Against $J_2$.** In LEO the $J_2$ acceleration is about $1.2\times10^{-2}\,\mathrm{m/s^2}$, some $10\,000$ times the lunar nudge — four orders of magnitude. At GEO, $J_2$ has fallen to about $8\times10^{-6}\,\mathrm{m/s^2}$, right alongside the lunar value. That is why the Moon and Sun, negligible next to $J_2$ in low orbit, are a leading force on a **[[geostationary satellite|geo-inclination]]**.

**Sanity check.** All four numbers sit where lesson 1's table put them: about $10^{-6}$ and $5\times10^{-7}$ in LEO, about $7\times10^{-6}$ and $3\times10^{-6}$ at GEO.
:::

## Tides: Earth's shape answers back

$\mathbf{a}_3$ is the Moon and Sun pulling directly on the spacecraft. There is a second, smaller effect. The same tidal stretch that raises ocean tides also flexes the solid Earth, by a few tens of centimeters. That slightly moves Earth's mass around, which slightly changes Earth's gravity field — the $J_2$ and higher coefficients of the geopotential lesson now wobble a little in time.

How big is that? Compare bulges. The solid-Earth tide raises the ground by a few tens of centimeters. The permanent equatorial bulge behind $J_2$ is about $21\,\mathrm{km}$ (the equator's radius minus the pole's). The ratio is roughly

$$
\frac{0.3\,\mathrm{m}}{21\,000\,\mathrm{m}} \approx \frac{1}{70\,000} .
$$

Scale $J_2 = 1.08\times10^{-3}$ down by that ratio and the tidal change in the coefficients is about $1.5\times10^{-8}$. Scale the $J_2$ acceleration in LEO, about $1.2\times10^{-2}\,\mathrm{m/s^2}$, the same way, and the tidal acceleration comes out near $2\times10^{-7}\,\mathrm{m/s^2}$ — on the order of $10^{-7}$.

That is roughly an order of magnitude below direct lunar attraction in LEO, comparable to solar radiation pressure, and usually the smallest entry in a full force budget outside precision **geodesy** (the science of measuring Earth's shape and gravity). Real tide models describe how much the Earth gives with a set of **[[Love numbers|love-number]]**; the main one for the solid Earth is $k_2 \approx 0.3$. This module does not derive them. The rough estimate above is what you need to decide whether a mission's force model must include tides at all.

::: key Tides
Solid-Earth tides perturb the geopotential coefficients themselves, by about $10^{-8}$, giving accelerations of order $10^{-7}\,\mathrm{m/s^2}$ in LEO — roughly an order of magnitude below direct lunisolar attraction.
:::

## Relativity, part one: a tiny turn of the perigee

Einstein's general relativity corrects Newton's gravity very slightly. For an orbit, the main effect of the correction is a slow extra turning of the perigee — an extra **apsidal precession**, like the $J_2$ turning of $\omega$ from lesson 4. This one is called the **Schwarzschild precession**. It is the same effect Einstein used in 1915 to explain a famous puzzle in **[[Mercury's orbit|mercury-history]]**: its **perihelion**, the point closest to the Sun, turns slightly faster than Newton's gravity allows. Its rate is

$$
\dot\omega_{\text{GR}} = \frac{3n\mu}{c^2a(1-e^2)} , \qquad c = 299\,792.458\,\mathrm{km/s} .
$$

Read it as "omega dot GR equals three n mu over c squared a times one minus e squared". Here $c$ is the speed of light, and the $c^2$ in the bottom is what makes it so small.

::: example Test the formula on Mercury, then use it on a satellite
Before trusting an unfamiliar formula, check it on the case that made it famous.

**Mercury.** $a = 57\,909\,050\,\mathrm{km}$, $e = 0.205\,630$, orbiting the Sun with $\mu_{\text{Sun}} = 1.327\,124\,4\times10^{11}\,\mathrm{km^3/s^2}$. First the mean motion: $n = \sqrt{\mu/a^3} = 8.2668\times10^{-7}\,\mathrm{rad/s}$, which is an $87.969$-day period, matching Mercury's known year. Then the formula gives $\dot\omega_{\text{GR}}$ in radians per second; multiplying by the seconds in a century and converting radians to **[[arcseconds|arcsecond]]** gives $42.98$ arcseconds per century. The measured, famously unexplained excess was $42.98$ arcseconds per century. The formula passes.

**A satellite.** Now the $550\,\mathrm{km}$, $e = 0.05$, $i = 51.6^\circ$ orbit from the $J_2$ lessons. There $a = 6928.137\,\mathrm{km}$ and $n = \sqrt{398\,600.4418/6928.137^3} = 1.0948\times10^{-3}\,\mathrm{rad/s}$. So
$$
\dot\omega_{\text{GR}} = \frac{3(1.0948\times10^{-3})(398\,600.4418)}{(299\,792.458)^2(6928.137)(1-0.05^2)} = 2.108\times10^{-12}\,\mathrm{rad/s} ,
$$
which is $1372$ arcseconds per century.

**Compare.** That is far more than Mercury's $43$, because a low satellite goes around more than a thousand times as often as Mercury. But compare it with the same orbit's $J_2$ perigee rate, $\dot\omega_{J_2} = 7.035\times10^{-7}\,\mathrm{rad/s}$ (about $3.48^\circ$ per day, from lesson 4):
$$
\frac{\dot\omega_{\text{GR}}}{\dot\omega_{J_2}} = \frac{2.108\times10^{-12}}{7.035\times10^{-7}} \approx 3.0\times10^{-6} .
$$
Relativity turns this perigee about $330\,000$ times more slowly than $J_2$ does — about $0.004^\circ$ per year.

**Sanity check.** A factor of $c^2$ in the bottom should make relativity tiny for anything moving at a few km/s, and it does. For mission design, station-keeping budgets and collision screening, relativistic corrections to the orbit's shape can be safely left out.
:::

## Relativity, part two: the clock

Orbit shape is not where relativity earns its keep. Timing is.

A clock's rate depends on two things, from the **[[two theories of relativity|two-relativities]]**:

- **its speed** — special relativity says a moving clock runs *slow*;
- **its height in gravity** — general relativity says a clock higher up, where gravity is weaker, runs *fast*.

For a GPS satellite at $a \approx 26\,562\,\mathrm{km}$, compared with a clock on Earth's equator, the two effects are of similar size and opposite sign.

**Gravity (general relativity).** The fractional rate difference is the difference in gravitational potential divided by $c^2$:
$$
\left(\frac{\Delta f}{f}\right)_{\text{GR}} \approx \frac{\mu}{c^2}\left(\frac{1}{R_E}-\frac{1}{a}\right) .
$$
Times the $86\,400$ seconds in a day, this is $+45.65\ \mu\text{s/day}$: the satellite clock runs fast.

**Speed (special relativity).** The satellite moves at $v_{\text{sat}} = \sqrt{\mu/a} \approx 3.874\,\mathrm{km/s}$; the ground clock moves with Earth's spin at $v_{\text{surface}} \approx 0.465\,\mathrm{km/s}$:
$$
\left(\frac{\Delta f}{f}\right)_{\text{SR}} \approx -\frac{v_{\text{sat}}^2-v_{\text{surface}}^2}{2c^2} ,
$$
which is $-7.11\ \mu\text{s/day}$: the satellite clock runs slow.

**Net.** $45.65 - 7.11 = +38.5\ \mu\text{s/day}$. Left alone, the satellite clock would gain about $38.5$ microseconds every day. GPS turns time into distance at the speed of light, so that is $38.5\times10^{-6}\,\mathrm{s} \times 299\,792\,\mathrm{km/s} \approx 11.5\,\mathrm{km}$ of range error, growing every day.

So GPS satellite clocks are **[[set to tick slightly slow|gps-offset]]** before launch, by very nearly this same $38.5\ \mu\text{s/day}$. Once in orbit, relativity speeds them up to the right rate. This is the module's clearest example of a perturbation that is negligible for one job (the trajectory) and mission-critical for another (the timing).

::: key Relativity: negligible for the orbit, essential for the clock
$$
\dot\omega_{\text{GR}} = \frac{3n\mu}{c^2a(1-e^2)}
$$
reproduces Mercury's $42.98$ arcseconds per century, and is about $3\times10^{-6}$ of the $J_2$ rate for a $550\,\mathrm{km}$ orbit. A GPS clock gains $+45.65\ \mu\text{s/day}$ (gravity) and loses $7.11\ \mu\text{s/day}$ (speed), net $+38.5\ \mu\text{s/day}$ — about $11.5\,\mathrm{km}$ of range per day if uncorrected.
:::

::: warning "Negligible for the orbit" is not "negligible for the mission"
It is tempting to read the $3\times10^{-6}$ ratio and file relativity under "unimportant". That is right for orbit propagation and wrong for anything that uses precise time: GPS, laser ranging, or any system that measures distance by timing light. The right question is never "is this perturbation small?" but "small compared with what, for what purpose?" — the question this module opened with.
:::

## Check yourself

::: check
Explain in one or two sentences why $\mathbf{a}_3$ is written as a *difference* of two terms, not only the Moon's direct pull on the spacecraft.
:::

::: answer
The geocentric frame is itself accelerating: Earth is falling toward the Moon and Sun too. So what shows up in the spacecraft's motion *relative to Earth* is the third body's pull on the spacecraft minus its pull on Earth — the part of the attraction that Earth's own fall does not already share.
:::

::: check
Why does the Moon perturb a satellite's orbit more than the Sun does, despite the Sun's much larger mass?
:::

::: answer
The leading-order perturbation goes as $\mu_3/d^3$, not $\mu_3$ alone. The Sun's gravitational parameter is about $27$ million times the Moon's, but the Sun is about $389$ times farther away, and distance enters cubed: $389^3 \approx 5.9\times10^{7}$. That outweighs the mass ratio, leaving the Moon's $\mu_3/d^3$ about $2.2$ times larger. So its effect on a satellite is larger.
:::

::: check
A geostationary mission budgets far more propellant for north–south (inclination) station-keeping than a $400\,\mathrm{km}$ mission spends on anything comparable. Use this lesson's scaling to explain why.
:::

::: answer
Lunisolar attraction, which tips a geostationary orbit's plane, grows roughly in proportion to the spacecraft's distance $r$ from Earth, while $J_2$ falls as $1/r^4$.

At $400\,\mathrm{km}$, $J_2$ is about four orders of magnitude larger than the lunisolar nudge, so the orbit plane's drift there is almost entirely a $J_2$ story — a steady, predictable turning of the node that missions usually design around rather than fight. At geostationary height the two are comparable. Lunisolar attraction is no longer a small correction but a leading driver, and it steadily tilts the orbit plane. Holding a geostationary satellite over the equator means fighting that tilt with a burn every few weeks, year after year, which is a large propellant cost with no equal in low orbit.
:::

::: check
Why does the lesson test the relativistic precession formula on Mercury before applying it to a satellite, rather than quoting the satellite result directly?
:::

::: answer
Mercury's perihelion advance is one of the most precisely measured, historically important confirmations of general relativity. Reproducing its accepted $42.98$ arcseconds per century from the same formula is an independent check that the formula, its constants and its unit conversions are all right. Only then is it safe to trust the formula on a satellite, where there is no famous reference value to compare against.
:::

::: check
A timing engineer says: "Relativistic effects are negligible in this module's force model, so I can ignore them in my GPS receiver design." Is that reasoning sound?
:::

::: answer
No. It mixes up two questions.

This module's force comparisons ask how much a perturbation moves a spacecraft's *trajectory*. There, relativity is indeed negligible — about three parts in a million of the $J_2$ perigee rate. A GPS receiver depends on *time transfer*, where the same physics amounts to tens of microseconds per day, enough for kilometers of position error if uncorrected. "Negligible for trajectory shape" and "negligible for timing" are separate claims with separate answers.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}_3 = \mu_3\big[(\mathbf{d}-\mathbf{r})/\lVert\mathbf{d}-\mathbf{r}\rVert^3-\mathbf{d}/d^3\big]$ | Exact third-body (tidal, differential) perturbation |
| $\mathbf{a}_3 \approx (\mu_3/d^3)\big[3(\hat{\mathbf{d}}\cdot\mathbf{r})\hat{\mathbf{d}}-\mathbf{r}\big]$ | Leading-order form; stretch along the line is twice the squeeze across it |
| Lunar $1.20\times10^{-6}$, solar $5.37\times10^{-7}\,\mathrm{m/s^2}$ | In LEO; about $7\times$ and $6\times$ larger at GEO |
| Moon beats Sun | $\mu_3/d^3$ is about $2.2$ times larger for the Moon |
| Third body grows with $r$; $J_2$ falls as $r^{-4}$ | Lunisolar rivals $J_2$ at GEO, though $10^4$ times smaller in LEO |
| Solid-Earth tides | Change the geopotential coefficients by about $10^{-8}$; order $10^{-7}\,\mathrm{m/s^2}$ in LEO |
| $\dot\omega_{\text{GR}} = 3n\mu/[c^2a(1-e^2)]$ | Schwarzschild precession; Mercury's $42.98''$ per century; $3\times10^{-6}$ of $J_2$ in LEO |
| GPS clock | $+45.65$ (gravity) $-\,7.11$ (speed) $= +38.5\ \mu\text{s/day}$; negligible for the orbit, essential for timing |

The next lesson turns to a nudge that pushes rather than pulls: solar radiation pressure, the push of sunlight, which switches off each time the spacecraft passes into Earth's shadow.

::: context falling-together Why Earth's frame is not "fixed"
It is easy to think of Earth as the fixed center that everything moves around. But Earth is itself in free fall — around the Sun once a year, and around the Earth–Moon balance point once a month.

Anything measured from Earth's center is measured from a falling platform. Newton's laws in their plain form only hold in a frame that is not accelerating. So when we switch from the star-fixed frame to Earth's frame, we must subtract Earth's own acceleration. That subtraction is the $-\mathbf{d}/d^3$ term. Leave it out and your simulated satellite would be yanked toward the Moon as if Earth stayed behind.
:::

::: context binomial The binomial shortcut
For a small number $x$, $(1+x)^p \approx 1 + px$, for any power $p$. It is the first step of the binomial series, and it is how physicists turn awkward powers into straight lines.

Try it with $p = -\tfrac32$ and $x = 0.01$: the calculator gives $1.01^{-1.5} = 0.98518$, and the shortcut gives $1 - 1.5 \times 0.01 = 0.985$. The error is about $0.0002$, roughly $x^2$ in size — which is exactly the kind of "second-order" term the derivation throws away. For the Moon at GEO, $x$ is about $0.2$, which is why the shortcut is visibly off there.
:::

::: context tidal-stretch The shape of a tide
These arrows show the leading-order third-body nudge at twelve points around a circle about Earth, with the Moon far off to the right. On the line to the Moon, on *both* sides, the arrows point outward. Across the line they point inward, half as long.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<circle cx="150" cy="105" r="66" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
<circle cx="150" cy="105" r="38" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
<text x="150" y="109" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
<line x1="216.0" y1="105.0" x2="254.0" y2="105.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="260.0,105.0 254.0,108.5 254.0,101.5" fill="#b4232c"/>
<circle cx="216.0" cy="105.0" r="2" fill="#1f2a44"/>
<line x1="207.2" y1="72.0" x2="239.5" y2="81.3" stroke="#b4232c" stroke-width="2"/>
<polygon points="245.3,83.0 238.5,84.7 240.5,78.0" fill="#b4232c"/>
<circle cx="207.2" cy="72.0" r="2" fill="#1f2a44"/>
<line x1="183.0" y1="47.8" x2="200.5" y2="63.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="205.0,66.9 198.2,65.6 202.8,60.3" fill="#b4232c"/>
<circle cx="183.0" cy="47.8" r="2" fill="#1f2a44"/>
<line x1="150.0" y1="39.0" x2="150.0" y2="55.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="150.0,61.0 146.5,55.0 153.5,55.0" fill="#b4232c"/>
<circle cx="150.0" cy="39.0" r="2" fill="#1f2a44"/>
<line x1="117.0" y1="47.8" x2="99.5" y2="63.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="95.0,66.9 97.2,60.3 101.8,65.6" fill="#b4232c"/>
<circle cx="117.0" cy="47.8" r="2" fill="#1f2a44"/>
<line x1="92.8" y1="72.0" x2="60.5" y2="81.3" stroke="#b4232c" stroke-width="2"/>
<polygon points="54.7,83.0 59.5,78.0 61.5,84.7" fill="#b4232c"/>
<circle cx="92.8" cy="72.0" r="2" fill="#1f2a44"/>
<line x1="84.0" y1="105.0" x2="46.0" y2="105.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="40.0,105.0 46.0,101.5 46.0,108.5" fill="#b4232c"/>
<circle cx="84.0" cy="105.0" r="2" fill="#1f2a44"/>
<line x1="92.8" y1="138.0" x2="60.5" y2="128.7" stroke="#b4232c" stroke-width="2"/>
<polygon points="54.7,127.0 61.5,125.3 59.5,132.0" fill="#b4232c"/>
<circle cx="92.8" cy="138.0" r="2" fill="#1f2a44"/>
<line x1="117.0" y1="162.2" x2="99.5" y2="147.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="95.0,143.1 101.8,144.4 97.2,149.7" fill="#b4232c"/>
<circle cx="117.0" cy="162.2" r="2" fill="#1f2a44"/>
<line x1="150.0" y1="171.0" x2="150.0" y2="155.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="150.0,149.0 153.5,155.0 146.5,155.0" fill="#b4232c"/>
<circle cx="150.0" cy="171.0" r="2" fill="#1f2a44"/>
<line x1="183.0" y1="162.2" x2="200.5" y2="147.0" stroke="#b4232c" stroke-width="2"/>
<polygon points="205.0,143.1 202.8,149.7 198.2,144.4" fill="#b4232c"/>
<circle cx="183.0" cy="162.2" r="2" fill="#1f2a44"/>
<line x1="207.2" y1="138.0" x2="239.5" y2="128.7" stroke="#b4232c" stroke-width="2"/>
<polygon points="245.3,127.0 240.5,132.0 238.5,125.3" fill="#b4232c"/>
<circle cx="207.2" cy="138.0" r="2" fill="#1f2a44"/>
<line x1="262" y1="105" x2="330" y2="105" stroke="#1f2a44" stroke-width="1.5"/><polygon points="340,105 330,100 330,110" fill="#1f2a44"/>
<text x="300" y="95" font-size="12" fill="#1f2a44" text-anchor="middle">to the Moon</text>
<text x="180" y="202" font-size="11" fill="#6c7a93" text-anchor="middle">along the line: 2 units · across it: 1 unit, inward</text>
</svg>
```

The same pattern acts on Earth's oceans. Water is pulled out along the Earth–Moon line and in across it, so there are two bulges, one facing the Moon and one facing away. Earth turns under both each day, which is why most coasts see two high tides a day.
:::

::: context geo-inclination The slow tilt of a geostationary orbit
Left alone, the Moon and Sun tip a geostationary satellite's orbit plane by roughly $0.75^\circ$ to $0.95^\circ$ per year. The amount changes over an $18.6$-year cycle, because the tilt of the Moon's own orbit against Earth's equator goes up and down with that period.

A tilted geostationary satellite traces a figure-eight in the sky each day instead of sitting still, and ground antennas pointed at a fixed spot start to lose it. So operators fire thrusters every few weeks to take the tilt back out. That north–south station-keeping costs about $50\,\mathrm{m/s}$ of $\Delta v$ per year, and it is often the biggest propellant item in a geostationary satellite's budget.
:::

::: context love-number Love numbers
The name is not romantic. The numbers are named after the British mathematician Augustus Love, who studied how an elastic Earth deforms, early in the twentieth century.

A Love number says how strongly a body answers a tidal pull. The one called $k_2$ compares the extra gravity from the tidal bulge with the tidal pull that raised it. A perfectly rigid Earth would have $k_2 = 0$; a fluid Earth would give far more. Earth's measured $k_2 \approx 0.3$ says it is stiff but not rigid — it flexes by tens of centimeters twice a day.
:::

::: context mercury-history The planet that would not behave
By 1859 the French astronomer Urbain Le Verrier had noticed that Mercury's perihelion — its closest point to the Sun — turned slightly faster than the pulls of all the known planets could explain. The excess was about $43$ arcseconds per century.

Le Verrier had already found Neptune by explaining an oddity in Uranus's orbit, so he suggested an unseen planet near the Sun. Astronomers named it Vulcan and searched for decades. It does not exist. In November 1915 Einstein showed that his new general relativity produces the missing $43$ arcseconds with no new planet at all. It was one of the first great tests the theory passed.
:::

::: context arcsecond How small is an arcsecond?
Divide a degree into $60$ arcminutes, and each arcminute into $60$ arcseconds. So an arcsecond is $1/3600$ of a degree.

A coin about $2\,\mathrm{cm}$ across, seen from $4\,\mathrm{km}$ away, is about one arcsecond wide. Mercury's relativistic $43$ arcseconds per century is a turn of about $0.012^\circ$ in a hundred years — measured with telescopes, long before spacecraft.
:::

::: context two-relativities Two relativities, two effects
Einstein published **special relativity** in 1905. It is about speed: a clock moving past you ticks slower than yours. **General relativity**, from 1915, is about gravity: a clock deeper in a gravity field ticks slower than one higher up.

A GPS satellite is fast, which slows its clock, and high, which speeds it up. At GPS height the height effect wins by a wide margin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
<line x1="150" y1="15" x2="150" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
<rect x="150.0" y="25" width="182.6" height="20" fill="#1d6fd1"/>
<text x="10" y="40" font-size="12" fill="#1f2a44">gravity (general)</text>
<text x="326.6" y="40" font-size="12" fill="#fff" text-anchor="end">+45.65 μs/day</text>
<rect x="121.6" y="60" width="28.4" height="20" fill="#b4232c"/>
<text x="10" y="75" font-size="12" fill="#1f2a44">speed (special)</text>
<text x="156" y="75" font-size="12" fill="#1f2a44">−7.11 μs/day</text>
<rect x="150.0" y="95" width="154.2" height="20" fill="#1f2a44"/>
<text x="10" y="110" font-size="12" fill="#1f2a44">net</text>
<text x="298.2" y="110" font-size="12" fill="#fff" text-anchor="end">+38.54 μs/day</text>
<text x="180" y="143" font-size="11" fill="#6c7a93" text-anchor="middle">GPS satellite clock vs a clock on the equator</text>
</svg>
```

A clock in low orbit is the other way round. It is not much higher than the ground but moves twice as fast as a GPS satellite, so the speed effect wins and its clock runs slow.
:::

::: context gps-offset A clock built to be wrong on the ground
The atomic clocks on GPS satellites drive a reference signal whose nominal frequency is $10.23\,\mathrm{MHz}$. Before launch it is set to $10.229\,999\,995\,43\,\mathrm{MHz}$ instead — slow by about $4.5$ parts in $10^{10}$, which is $38.6$ microseconds per day.

In orbit, relativity speeds the clock up by that amount, and it ticks at $10.23\,\mathrm{MHz}$ as seen from the ground. The small extra effect of a slightly oval orbit, which comes and goes each revolution, is corrected in the user's receiver with a formula in the GPS signal specification.
:::
