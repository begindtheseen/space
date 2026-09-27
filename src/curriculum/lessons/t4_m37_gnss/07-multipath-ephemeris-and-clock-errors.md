---
id: l07-multipath-ephemeris-and-clock-errors
title: Multipath, ephemeris and clock errors
minutes: 23
covers:
  - Multipath; ephemeris and satellite clock errors
---

Shout in an empty gym and you hear yourself twice: once straight from your mouth, then a split second later off the far wall. Now think of a friend giving you directions to a party from yesterday's bus timetable. The buses mostly run to plan, but not exactly. And think of the kitchen clock you set right every morning. By evening it is a little off, and not by an amount you could have guessed.

Those three everyday annoyances are the last three entries in the pseudorange error budget from lesson 2. **Multipath** is the echo: a second copy of the satellite's signal that bounced off something and arrives late. **Ephemeris error** is the timetable problem: the satellite's broadcast position is a forecast, and forecasts are wrong by a little. **Satellite clock error** is the kitchen clock: the part of the satellite clock's wandering that the broadcast correction could not predict.

The previous lesson removed the ionosphere with two frequencies and modeled the troposphere. Neither trick touches these three. They are why, even after a perfect atmosphere correction, the budget still carried the better part of a meter. This lesson works out how big each one is and why. The multipath bias comes from the way a receiver lines up its code. The ephemeris error depends on which direction the orbit is wrong. The clock error grows with the time since the last correction. Where a number is measured rather than derived, the lesson says so.

## Multipath: the signal's echo

A GPS signal can reach the antenna by two roads. The **direct path** runs straight from the satellite. A **reflected path** bounces off the ground, a building, or the vehicle's own body first, so it is a little longer. That extra road length is the path difference $\Delta d$. The echo that travels it is the **[[multipath|multipath-geometry]]** signal.

Two numbers describe the echo:

- the **delay** $\Delta$ (read "delta"), the extra path measured in **[[chips|chip]]** of the ranging code — one chip of C/A code is $293.05\,\mathrm{m}$, so $\Delta = \Delta d / 293.05\,\mathrm{m}$;
- the **amplitude ratio** $\alpha$ (read "alpha"), how strong the echo is compared with the direct signal. It is less than $1$. A flat metal surface at a shallow angle can push $\alpha$ close to $1$. A rough or absorbing surface keeps it small.

### How the receiver times the code

To measure a pseudorange, the receiver slides its own copy of the code along the incoming signal until the two line up best. How well they match at each offset is the **autocorrelation**. For an ideal code it is a triangle:

$$
R(x) = \max(1 - |x|,\ 0),
$$

where $x$ is the offset in chips. Perfectly lined up ($x = 0$) gives $1$. One chip or more out gives $0$.

Finding the exact top of a triangle is hard. Finding where two sides are equally high is easy. So the receiver measures the match at two points, one a little **early** and one a little **late**, spaced $d$ chips apart. It moves its copy until the early and late readings are equal. This is the **[[early-minus-late discriminator|early-late]]**, and $d$ is the **correlator spacing**. Call the receiver's timing offset $\tau$ (read "tau"). With an echo present, the early reading minus the late reading is

$$
D(\tau) = \big[R(\tau-\tfrac{d}{2}) + \alpha R(\tau-\Delta-\tfrac{d}{2})\big] - \big[R(\tau+\tfrac{d}{2}) + \alpha R(\tau-\Delta+\tfrac{d}{2})\big].
$$

The receiver locks where $D(\tau) = 0$. With no echo ($\alpha = 0$) that is exactly $\tau = 0$, because the triangle is symmetric. The echo adds a smaller, later triangle. The sum leans to the late side, so the lock point slides late. Solving $D(\tau) = 0$ for a short delay gives the **multipath bias**

$$
\tau_e = \frac{\alpha\,\Delta}{1+\alpha}\ \ \text{(chips)}.
$$

Check it with $\alpha = 0.5$ and $\Delta = 0.20$ chip: $\tau_e = 0.5 \times 0.20/1.5 = 0.0667$ chip. A computer solving $D(\tau) = 0$ directly gets the same $0.0667$. On C/A code that is $0.0667 \times 293.05 = 19.5\,\mathrm{m}$ of range error from one echo.

Look at what is missing from the formula: the correlator spacing $d$. For a short delay, the bias depends only on the echo's strength and delay. A tighter correlator does not change it.

::: note Why it has to be true
Each $R$ in $D(\tau)$ is a straight-line piece of the triangle near $\tau = 0$, sloping up on the left side and down on the right. So $D$ is a straight line in $\tau$ there, and one step of algebra finds its zero.

At $\tau = 0$, the direct terms cancel ($R$ is symmetric). The echo terms give $\alpha[(1-\Delta-\tfrac{d}{2}) - (1-\tfrac{d}{2}+\Delta)] = -2\alpha\Delta$. So $D(0) = -2\alpha\Delta$.

The slope of each piece is $\pm 1$. All four terms rise as $\tau$ grows, so $D'(0) = 2 + 2\alpha = 2(1+\alpha)$.

A straight line crosses zero at $\tau_e = -D(0)/D'(0) = \alpha\Delta/(1+\alpha)$.

The formula holds as long as the late echo gate stays on the falling side of the echo's triangle, $\tau_e \ge \Delta - \tfrac{d}{2}$. Put in $\tau_e$ and rearrange: $\Delta \le (1+\alpha)\tfrac{d}{2}$. At that edge the bias is $\alpha\Delta/(1+\alpha) = \alpha d/2$, the largest it gets.
:::

::: example The multipath envelope, and what a narrow correlator buys
Take $\alpha = 0.5$ and slide the echo's delay $\Delta$ from $0$ outward. The curve of bias against delay is the **multipath error envelope**.

**Standard correlator, $d = 1$ chip.** The bias follows $\alpha\Delta/(1+\alpha)$ up to $\Delta = (1+\alpha)d/2 = 0.75$ chip. There it peaks at $\alpha d/2 = 0.25$ chip. After that it falls, reaching zero at $\Delta = 1 + d/2 = 1.5$ chip, where the echo's triangle no longer touches either gate. The peak on C/A code is $0.25 \times 293.05 = 73.3\,\mathrm{m}$.

**Narrow correlator, $d = 0.1$ chip**, standard on modern receivers. The same formula climbs until $\Delta = 1.5 \times 0.05 = 0.075$ chip, where it reaches $\alpha d/2 = 0.025$ chip. It stays flat at that value out to about $\Delta = 0.95$ chip, then drops to zero by $\Delta = 1.05$ chip. The peak is $0.025 \times 293.05 = 7.33\,\mathrm{m}$ — ten times smaller, exactly in proportion to the ten-times-smaller $d$.

**The limit.** An echo delayed by only $0.02$ chip (about $6\,\mathrm{m}$ of extra path, from a reflector a few meters away) sits inside the short-delay zone for both correlators. Its bias is $0.5 \times 0.02/1.5 = 0.00667$ chip either way, which is $0.00667 \times 293.05 = 1.95\,\mathrm{m}$.

Sanity check: both peaks are $\alpha d/2$, a quarter of $d$ when $\alpha = 0.5$, and both envelopes die out a little past one chip, where the triangles stop overlapping. Narrow correlators buy a lot against a reflector tens of meters away. They buy nothing against one bolted to the vehicle.
:::

### Multipath on the carrier

The carrier wave under the code gets an echo too, but the damage is tiny. Picture each wave as an arrow spinning around a clock face — a **[[phasor|phasor]]**. The direct wave is an arrow of length $1$. The echo is an arrow of length $\alpha$, turned by some angle $\phi$ (read "phi") because of its longer path. The receiver's carrier loop tracks the direction of the sum of the two arrows, which is off by

$$
\theta(\phi) = \arctan\left(\frac{\alpha\sin\phi}{1+\alpha\cos\phi}\right).
$$

A carrier wavelength is only centimeters, so a meter of geometry turns $\phi$ through many full circles. Treat $\phi$ as anything at all. The worst case over every $\phi$ has a clean answer: $\max_\phi |\theta| = \arcsin(\alpha)$. For $\alpha = 0.5$ a computer search finds $30.000^\circ$, and $\arcsin(0.5) = 30^\circ$ exactly.

A full turn of phase is one wavelength $\lambda$ (read "lambda") of range, so the range error is $\delta\rho = (\theta/2\pi)\lambda$. The **carrier multipath** error is therefore bounded by

$$
\delta\rho_{\max} = \frac{\lambda}{2\pi}\arcsin(\alpha) \ \xrightarrow{\ \alpha\to1\ }\ \frac{\lambda}{4}.
$$

On L1, $\lambda = 19.03\,\mathrm{cm}$. At $\alpha = 0.99$, an echo nearly as strong as the direct signal, the bound is $0.0433\,\mathrm{m}$. It can never pass $\lambda/4 = 0.0476\,\mathrm{m}$. However strong the echo, carrier multipath stays under a quarter wavelength — a few centimeters on any GNSS carrier. Code multipath reaches tens of meters. That gap of about a thousand is the reason carrier-based positioning, the next two lessons, is so precise.

::: key
Code multipath bias (short delay): $\tau_e = \alpha\Delta/(1+\alpha)$ chips, independent of correlator spacing $d$. The envelope peaks at $\alpha d/2$ and vanishes past $\Delta = 1 + d/2$, so narrow correlators cut the peak in proportion to $d$. Carrier multipath is bounded by $\delta\rho_{\max} = (\lambda/2\pi)\arcsin(\alpha) \le \lambda/4$: centimeters, never meters.
:::

### Fighting multipath

The fixes follow from the mechanism. Narrow correlators shrink the envelope for distant reflectors. A **[[choke-ring antenna|choke-ring]]** blocks signals arriving from low angles and from below, where ground echoes come from. Careful siting keeps big flat reflectors away. None of these help against echoes from the vehicle's own structure. That is why antenna placement on a rocket or spacecraft is worked out at the same table by the structures, radio and navigation engineers.

::: warning Smoothing does not remove multipath
**Carrier smoothing** averages the noisy code range while using the much smoother carrier to follow its trend. It crushes random noise. It does not crush multipath the same way. An echo from a fixed reflector changes slowly — over tens of seconds to minutes, as the satellite creeps across the sky — so it survives any shorter averaging almost untouched. A receiver on a fixed mast can even see the same multipath error every day, repeating with the **[[daily repeat of the satellite geometry|sidereal-repeat]]**.
:::

## Ephemeris error: the position is a forecast

The **[[ephemeris|ephemeris-word]]** in the navigation message is the satellite's position, as a formula the receiver can evaluate at any moment. It is not a measurement. Ground monitor stations track each satellite. The control segment fits its current position and velocity, then runs a model of the forces on it forward in time, and uploads the result. The broadcast set is refreshed every couple of hours and is good for a few hours either side of its reference time.

Any forecast drifts. The force model misses small, changing pushes like **[[solar radiation pressure|sunlight-push]]**, and the starting state was never perfect. The result is a position error $\delta\mathbf{s}$ at the satellite, a small arrow from where the ephemeris says the satellite is to where it really is.

Split that arrow into three directions, the way you would describe a car on a racetrack:

- **radial**: up or down, toward or away from Earth's center;
- **along-track**: forward or backward along the orbit;
- **cross-track**: sideways, out of the orbit's plane.

### How much of the error reaches the range

Only the part of $\delta\mathbf{s}$ along the line of sight changes the range. So the question is the angle between the line of sight and each of those three directions.

From a GPS satellite, Earth fills a cone of half-angle $13.9^\circ$ around straight down (lesson 1). Every receiver on the ground sits inside that cone. So the line of sight $\mathbf{e}_i$ always tilts from the satellite's radial direction $\hat{\mathbf{s}}$ by the **nadir angle** $\eta$ (read "eta"), and $\eta$ is at most $13.9^\circ$. The fraction of a radial error that reaches the range is $\cos\eta$. For a direction $\hat{\mathbf{t}}$ at right angles to $\hat{\mathbf{s}}$ (along-track or cross-track) it is at most $\sin\eta$:

$$
|\mathbf{e}_i\cdot\hat{\mathbf{s}}| \ge \cos(13.9^\circ) = 0.971, \qquad |\mathbf{e}_i\cdot\hat{\mathbf{t}}| \le \sin(13.9^\circ) = 0.240.
$$

A radial error reaches the range at $97\%$ strength or more. A sideways error of the same size reaches it at $24\%$ or less, and usually much less, depending on which way the along-track direction points compared with the line of sight.

::: note Why it has to be true
Draw the triangle made by Earth's center, the receiver and the satellite. The side from center to receiver is $R_E$. The side from center to satellite is $a$. The angle at the receiver, between straight up and the line to the satellite, is $90^\circ$ plus the elevation $\varepsilon$ (read "epsilon").

The law of sines says each side over the sine of the angle opposite it is the same number:

$$
\frac{\sin\eta}{R_E} = \frac{\sin(90^\circ + \varepsilon)}{a} \quad\Longrightarrow\quad \sin\eta = \frac{R_E\cos\varepsilon}{a}.
$$

The biggest $\eta$ comes at elevation $0$, on the horizon: $\sin\eta = R_E/a$, which is the $13.9^\circ$ cone. The dot product of two unit arrows is the cosine of the angle between them, which gives $\cos\eta$ for the radial part and at most $\sin\eta$ for any perpendicular direction.
:::

::: example Radial against along-track for one satellite
Take the satellite at azimuth $135^\circ$, elevation $60^\circ$ from Cape Canaveral, used in lessons 4 and 5. Its nadir angle comes from the formula in the note, with $\cos 60^\circ = 0.5$:

$$
\sin\eta = \frac{6378 \times 0.5}{26560} = 0.120, \qquad \eta = 6.9^\circ.
$$

That is well inside the $13.9^\circ$ limit, as it should be for a satellite high in the sky.

**Radial.** A $3.0\,\mathrm{m}$ radial error gives $3.0 \times 0.993 = 2.98\,\mathrm{m}$ of range error, since $\cos 6.9^\circ = 0.993$. Almost all of it gets through.

**Along-track.** Suppose, for this pass, the along-track direction projects onto the line of sight at $0.093$ (below the limit $\sin 6.9^\circ = 0.120$). A $3.0\,\mathrm{m}$ along-track error gives $3.0 \times 0.093 = 0.28\,\mathrm{m}$.

Same size of error, about a tenth of the damage. Meter for meter, radial orbit error is the dangerous kind. That is why orbit-determination systems are built to be best in the radial direction and can live with looser along-track knowledge.
:::

Published accuracy figures use exactly this. The **signal-in-space range error** that the control segment and independent monitors report weights the radial part nearly in full and the along-track and cross-track parts by a much smaller factor, fitted from data averaged over whole passes. Modern GPS broadcast ephemerides put about $0.6\,\mathrm{m}$ of error along the line of sight, the entry in lesson 2's budget. In the 1990s it was about $2\,\mathrm{m}$. More monitor stations and better force models closed the gap.

::: warning A weak projection is not a small error
Along-track error is usually several times bigger than radial error, because a satellite's position along its orbit is harder to predict than its distance from Earth's center. So even at ten or twenty percent strength, along-track error still matters. The projection factor tells you how efficiently an error turns into range error, not whether the error itself is small.
:::

## Satellite clock error: what the correction could not see

Lesson 3 described the satellite clock correction broadcast in the navigation message. It is a short polynomial — a formula with a constant, a straight-line term and a curve term:

$$
\delta t_{sat} = a_{f0} + a_{f1}(t - t_{oc}) + a_{f2}(t - t_{oc})^2.
$$

Read $a_{f0}$ as "a f zero": the clock's offset at the reference time $t_{oc}$ ("t o c", time of clock). $a_{f1}$ is its drift rate and $a_{f2}$ how that rate is changing. The control segment fits it to measurements and refreshes it about every two hours.

Like any fitted curve, it captures the smooth, predictable part: the steady drift and slow aging. It cannot capture the random wander. That wander is measured by the clock's **[[stability|allan]]** $\sigma_y$ (read "sigma y"), a fractional frequency error. Lesson 3 found how much range error a clock of stability $\sigma_y$ collects over an interval $\Delta t$ with nothing to correct it:

$$
c\,\sigma_y\,\Delta t.
$$

The same law applies to a satellite clock between fits. A satellite-class atomic clock has $\sigma_y$ of about $10^{-13}$:

$$
c\,\sigma_y\,\Delta t = 299{,}792{,}458 \times 10^{-13} \times \Delta t.
$$

That gives $0.054\,\mathrm{m}$ thirty minutes ($1800\,\mathrm{s}$) after a fit, $0.108\,\mathrm{m}$ at one hour, and $0.216\,\mathrm{m}$ at two hours. This is a real, physical piece of the $0.6\,\mathrm{m}$ that lesson 2's budget left for satellite clocks after the correction.

It is only a piece. The rest comes from imperfect modeling of the predictable parts:

- the relativity correction is itself an approximation;
- the **group delay** $T_{GD}$, a calibrated number for the delay through the satellite's own electronics, changes a little with temperature and age;
- each new upload starts a fresh polynomial, which leaves a small jump.

None of these is under the receiver's control. In an error budget, "after correction" means "after the best correction available", never "corrected away".

::: example Rubidium, caesium, and why Galileo carries masers
Most GPS satellites fly rubidium clocks, and some carry a caesium clock too, at the $10^{-13}$-class stability used above. Europe's Galileo satellites also carry passive **[[hydrogen masers|maser]]**, about ten times steadier over the hours that matter for a two-hour fit.

At $\sigma_y = 10^{-14}$, the two-hour growth becomes

$$
299{,}792{,}458 \times 10^{-14} \times 7200 = 0.0216\,\mathrm{m},
$$

a tenth of the $0.216\,\mathrm{m}$ a rubidium clock gives. Sanity check: ten times the stability, one tenth of the error, since the law is a straight line in $\sigma_y$. A receiver that tracks Galileo as well as GPS gets the benefit.

The gain is not free. A maser is heavier, hungrier for power and more expensive than a rubidium clock. Choosing one is an ordinary satellite-design trade against the mass and power budget.
:::

::: key
Ephemeris error projects onto range by $\cos(\text{nadir angle})$ for the radial component (at least $0.971$) and by at most $\sin(\text{nadir angle}) \le 0.240$ for tangential (along- or cross-track) components — radial error is far more dangerous per meter. Satellite clock residual after the broadcast polynomial grows with time since the fit as $c\,\sigma_y\,\Delta t$, the same clock-coasting law as a receiver's oscillator, with $\sigma_y \sim 10^{-13}$ (rubidium or caesium) to $10^{-14}$ (hydrogen maser).
:::

## Check yourself

::: check
An echo on L5 ($\lambda = 25.48\,\mathrm{cm}$) has amplitude ratio $\alpha = 0.4$. What is the largest carrier-tracking range error it can cause?
:::

::: answer
The largest phase error is $\arcsin(0.4) = 23.58^\circ$. As a fraction of a full turn that is $23.58/360 = 0.0655$ cycle. One cycle is one wavelength of range, so the error is $0.0655 \times 0.2548 = 0.0167\,\mathrm{m}$ — under two centimeters, even for a fairly strong echo.
:::

::: check
A receiver with $0.5$-chip correlator spacing sees an echo with $\alpha = 0.4$ and delay $0.15$ chip. Find the code bias in chips and in meters on C/A code.
:::

::: answer
First check the short-delay formula applies: it holds up to $\Delta = (1+\alpha)d/2 = 1.4 \times 0.25 = 0.35$ chip, and $0.15$ is well inside. Then

$$
\tau_e = \frac{\alpha\Delta}{1+\alpha} = \frac{0.4 \times 0.15}{1.4} = 0.0429\ \text{chip}.
$$

On C/A code, at $293.05\,\mathrm{m}$ per chip, that is $0.0429 \times 293.05 = 12.6\,\mathrm{m}$.
:::

::: check
Why does narrowing the correlator spacing shrink the *peak* code multipath error but leave the short-delay bias $\alpha\Delta/(1+\alpha)$ unchanged?
:::

::: answer
In the short-delay zone, the echo's triangle sits under both gates on the same straight sides as the direct triangle, so the balance point depends only on how strong and how late the echo is. The spacing $d$ never enters. What $d$ does set is where that zone ends: at $\Delta = (1+\alpha)d/2$. There the bias reaches its peak, $\alpha d/2$. Shrink $d$ and the zone ends sooner, so the bias stops climbing at a smaller value, and the whole envelope shrinks in proportion to $d$. But an echo delayed less than that — a reflector very close to the antenna — gives the same $\alpha\Delta/(1+\alpha)$ whatever $d$ is.
:::

::: check
An ephemeris error has a $1.0\,\mathrm{m}$ radial part and a $4.0\,\mathrm{m}$ along-track part. The satellite's nadir angle is $12.0^\circ$, and for this geometry the along-track part projects at $0.020$. What does each part add to the range error?
:::

::: answer
Radial: $1.0 \times 0.978 = 0.978\,\mathrm{m}$, since $\cos 12.0^\circ = 0.978$. Along-track: $4.0 \times 0.020 = 0.080\,\mathrm{m}$. The along-track error is four times bigger but does about a twelfth of the damage. Its projection here is far below even the worst-case bound $\sin 12.0^\circ = 0.208$, because the along-track direction happens to point nearly across the line of sight.
:::

::: check
A satellite's clock polynomial is refreshed every two hours. With a caesium-class stability of $\sigma_y = 10^{-13}$, how much random clock error has built up thirty minutes after a fresh upload? Is that the whole satellite-clock entry in the error budget?
:::

::: answer
$c\,\sigma_y\,\Delta t = 299{,}792{,}458 \times 10^{-13} \times 1800 = 0.054\,\mathrm{m}$. It is not the whole entry. It is only the random part. The rest comes from imperfect modeling of the predictable terms — the relativity correction, the group-delay calibration, and the small jump at each upload. Those do not grow and shrink with time since the fit the way this term does.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Multipath | An echo of the signal, delay $\Delta$ chips, strength $\alpha < 1$ | One C/A chip is $293.05\,\mathrm{m}$ |
| Code multipath, short delay | Lock point slides late | $\tau_e = \alpha\Delta/(1+\alpha)$ chips, no $d$ in it, for $\Delta \le (1+\alpha)d/2$ |
| Code multipath envelope | Bias against delay | Peak $\alpha d/2$; zero past $\Delta = 1 + d/2$; $10\times$ narrower $d$ gives $10\times$ smaller peak |
| Carrier multipath | Echo turns the phase | $\delta\rho_{\max} = (\lambda/2\pi)\arcsin(\alpha) \le \lambda/4$: centimeters |
| Ephemeris projection | Radial versus sideways orbit error | Radial $\ge \cos(13.9^\circ) = 0.971$; tangential $\le \sin(13.9^\circ) = 0.240$ |
| Ephemeris budget | Line-of-sight error today | About $0.6\,\mathrm{m}$; about $2\,\mathrm{m}$ in the 1990s |
| Satellite clock residual | Random wander since the fit | $c\,\sigma_y\,\Delta t$; $0.05$ to $0.22\,\mathrm{m}$ over two hours at $10^{-13}$ |

Every entry in lesson 2's error budget now has a reason behind its size: clock, ionosphere, troposphere, multipath, ephemeris. The next lesson changes the measurement itself, from the code's meter-scale ruler to the carrier's millimeter one, and faces the whole-number puzzle every carrier-phase receiver has to solve.

::: context multipath-geometry Two roads to one antenna
The echo off the ground behaves like a reflection in a mirror. It arrives at the same angle it left the ground, so it looks as if it came from an image antenna buried below the surface. For an antenna at height $h$ and a satellite at elevation $\varepsilon$, the extra road is $2h\sin\varepsilon$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="150" x2="350" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <text x="20" y="168" font-size="11" fill="#6c7a93">ground</text>
  <line x1="250" y1="72" x2="250" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="250" cy="70" r="5" fill="#1f2a44"/>
  <text x="260" y="66" font-size="12" fill="#1f2a44">antenna</text>
  <line x1="146.1" y1="10" x2="250" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="120" y="40" font-size="12" fill="#1d6fd1">direct</text>
  <line x1="33.5" y1="105" x2="111.4" y2="150" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="111.4" y1="150" x2="250" y2="70" stroke="#f2b880" stroke-width="2.5"/>
  <text x="140" y="168" font-size="12" fill="#b4232c">reflected: longer, weaker</text>
  <text x="258" y="115" font-size="12" fill="#1f2a44">h</text>
</svg>
```

Both rays arrive from $30^\circ$ elevation here; the orange one bounces once.
:::

::: context chip What a chip is
A **chip** is one step of the ranging code: one plus-or-minus flip. It is called a chip, not a bit, because it carries no message; it only marks time. The C/A code runs at $1.023$ million chips per second, so one chip lasts about $977.5$ nanoseconds. Light covers $293.05\,\mathrm{m}$ in that time, which is why a chip is also a length. Measuring delays in chips lets one formula work for every code, and you convert to meters at the end.
:::

::: context early-late Balancing two readings on a triangle
The receiver never looks for the top of the correlation triangle directly. It keeps one reading a little early and one a little late, and nudges its timing until they match. An echo adds a smaller, later triangle and tips the balance point late.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="80,150 180,50 280,150" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="110,150 210,100 310,150" fill="none" stroke="#f2b880" stroke-width="2.5" stroke-dasharray="6 4"/>
  <line x1="130" y1="100" x2="130" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="230" y1="100" x2="230" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="130" cy="100" r="4" fill="#1f2a44"/>
  <circle cx="230" cy="100" r="4" fill="#1f2a44"/>
  <text x="130" y="168" font-size="12" text-anchor="middle" fill="#1f2a44">early</text>
  <text x="230" y="168" font-size="12" text-anchor="middle" fill="#1f2a44">late</text>
  <text x="180" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">direct, height 1</text>
  <text x="295" y="85" font-size="12" text-anchor="middle" fill="#b4232c">echo 0.5, late 0.3</text>
</svg>
```

Gates one chip apart ($d = 1$) sit at equal heights on the blue triangle. The dashed echo raises the late side more, so the receiver slides late to rebalance.
:::

::: context phasor Why the worst angle is arcsin of alpha
Draw the direct wave as an arrow of length $1$. The echo is an arrow of length $\alpha$ added to its tip, pointing any direction, so its tip can land anywhere on a circle of radius $\alpha$. The sum tilts most when the line from the start touches that circle at one point, and then $\sin\theta_{\max} = \alpha/1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="220" cy="110" r="80" fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="60" y1="110" x2="220" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="220" y1="110" x2="180" y2="40.72" stroke="#f2b880" stroke-width="3"/>
  <line x1="60" y1="110" x2="180" y2="40.72" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="60" cy="110" r="3" fill="#1f2a44"/>
  <path d="M100,110 A40,40 0 0,0 94.64,90" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="104" y="100" font-size="12" fill="#1f2a44">30°</text>
  <text x="140" y="128" font-size="12" fill="#1d6fd1">direct, 1</text>
  <text x="206" y="68" font-size="12" fill="#1f2a44">echo, 0.5</text>
  <text x="70" y="62" font-size="12" fill="#b4232c">sum</text>
</svg>
```

With $\alpha = 0.5$ the steepest tilt is $30^\circ$. As $\alpha$ nears $1$ it nears $90^\circ$, a quarter turn — the $\lambda/4$ limit.
:::

::: context choke-ring A cake pan that swallows echoes
A **choke-ring antenna** sits in the middle of several deep, circular metal grooves, like a round cake pan with rings inside. Each groove is about a quarter of a wavelength deep. Signals sliding in from low angles or bouncing up from the ground set up currents in the grooves that cancel themselves. The direct signal from high in the sky is barely touched. Survey and reference stations use them. They are heavy and wide, far too bulky for most flight vehicles, which is why flight antennas rely on placement instead.
:::

::: context sidereal-repeat Why multipath comes back every day
GPS satellites go around twice for every turn of Earth relative to the stars, a sidereal day of about $23\,\mathrm{h}\,56\,\mathrm{min}$. So each satellite traces the same path across a fixed antenna's sky every day, about four minutes earlier than the day before. Same satellite path, same reflector, same echo. Survey engineers use this: they subtract yesterday's residuals, shifted by four minutes, to cancel today's multipath. It is called sidereal filtering.
:::

::: context ephemeris-word A word from the astronomers
**Ephemeris** comes from the Greek for "daily". For centuries an ephemeris was a printed book of tables giving where the Sun, Moon and planets would be on each day of the year. Sailors used them to navigate by the stars. A GPS ephemeris does the same job for one satellite over a few hours, in the form of a dozen or so numbers the receiver turns into a position. The plural is **ephemerides**.
:::

::: context sunlight-push Sunlight pushes
Light carries momentum, so sunlight pushes on anything it hits. At Earth's distance from the Sun the push is about $4.6$ millionths of a newton on each square meter that absorbs it, twice that for a perfect mirror. On a GPS satellite with big solar panels it is tiny, but it never stops. Over hours it shifts the orbit by meters. It also changes as the satellite turns, as it passes into Earth's shadow, and as its surfaces age, which makes it the hardest force to model well.
:::

::: context allan How steady a clock is
$\sigma_y$ is the clock's **Allan deviation**, named after the physicist David Allan who defined it in the 1960s. It is the typical fractional error in the clock's rate over a chosen averaging time. $\sigma_y = 10^{-13}$ means the clock's rate is typically off by one part in ten trillion. Multiply by the elapsed time to get a time error, and by $c$ to get meters. Real clocks have a different $\sigma_y$ at each averaging time; lesson 3 used one value per clock as a fair simplification.
:::

::: context maser Microwave cousin of the laser
**Maser** stands for microwave amplification by stimulated emission of radiation. It came before the laser and works the same way, but with microwaves. A hydrogen maser keeps time with the hydrogen atom's natural microwave frequency, near $1420\,\mathrm{MHz}$ — the same line radio astronomers use to map hydrogen in the galaxy. A passive maser, like Galileo's, uses the atoms as a reference to steer a quartz oscillator instead of letting them oscillate on their own.
:::
