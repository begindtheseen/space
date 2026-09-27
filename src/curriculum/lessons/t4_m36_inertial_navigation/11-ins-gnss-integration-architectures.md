---
id: l11-ins-gnss-integration-architectures
title: INS/GNSS integration architectures
minutes: 20
covers:
  - "INS/GNSS integration architectures: loosely, tightly, and ultra-tightly (deeply) coupled"
---

Picture walking through a dark house with your eyes shut, counting steps and turns. For a little while you know exactly where you are. But every step is a tiny bit off, and after a few rooms you are lost. Now a friend outside starts calling to you through the windows. Each voice tells you something about where you are. The question is how you use those voices. Do you wait until your friend has worked out your exact spot and shouts it? Do you listen to each voice yourself and judge the distance? Or do you use your own step-counting to help you pick out faint voices you would otherwise miss?

That is this lesson. The step-counting is the inertial navigation system (INS). The voices are satellites. The free-inertial lesson put a number on how lost the walker gets: this module's tactical gyro, left alone for an hour, produced a $405\,\mathrm{km}$ position error. **GNSS** — global navigation satellite systems such as GPS — is what corrects it. The next module covers GNSS itself. This lesson answers the one question GNSS raises for an INS designer that GNSS cannot answer on its own: *how are the two wired together?*

Three **integration architectures** answer it differently: **loosely coupled**, **tightly coupled** and **ultra-tightly** (or **deeply**) **coupled**. The difference is not a matter of taste. It decides what happens the moment satellites become scarce — which is exactly when an aided system most needs to keep working.

## What a receiver measures

A satellite sends out a signal stamped with the time it left. The receiver notes when it arrives. Travel time times the speed of light gives a distance. But the receiver's clock is a cheap one, and it is off by some unknown amount. So every distance comes out wrong by the same amount: the clock error times the speed of light, about $300\,\mathrm m$ for each microsecond. That flawed distance is called a **[[pseudorange|pseudo-why]]** — a "false range", true distance plus a shared clock term.

The receiver can also track how the signal's wave, the **carrier**, shifts as the satellite and receiver move apart or together. That gives a **deltarange**: the change in range over a short interval, which measures the range *rate* and so constrains velocity.

To turn pseudoranges into a position, the receiver has four unknowns: three position coordinates and its own **clock bias**. Four unknowns need at least four equations, so a stand-alone fix needs at least **four satellites**. Hold on to that number. It drives everything below.

## Loosely coupled: two solutions, fused afterward

The simplest architecture lets the GNSS receiver do its whole job on its own. It picks satellites, solves for position and velocity, smooths the answer with its own internal filter, and hands the **finished fix** to the INS integration filter. The filter treats that fix as a direct measurement of the INS's position and velocity error. It is the zero-velocity update of the alignment lesson again, with a moving reference in place of zero.

Loose coupling is modular. The receiver and the inertial filter can be built, tested and replaced separately, by different teams or companies. The interface between them is a handful of numbers already documented on the receiver's datasheet. That is a real engineering advantage.

Its cost appears at the edges of satellite coverage. The instant fewer than four satellites are visible, the receiver has no fix to hand over at all. The loosely coupled INS falls back to fully free-inertial navigation, piling up error by exactly the laws the free-inertial lesson derived. From a loosely coupled filter's point of view, three satellites visible under a **[[highway overpass|overpass-canyon]]** are no better than none.

::: warning Feeding a filter a filtered fix
The receiver's internal filter smooths its answer over time. So its errors at one moment are strongly tied to its errors a moment later, often for tens of seconds. If the outer INS filter models each fix as a fresh measurement with independent (**white**) noise, it counts the same information again and again. Its covariance shrinks below the true error. The filter becomes **overconfident**: it trusts its own position too much and starts rejecting inertial data that was correct. Nothing blows up loudly — the numbers just look better than the navigation really is. This is the **[[cascaded-filter problem|cascaded-filters]]**, and every loosely coupled design has to handle it, by slowing the update rate or by modeling the correlation.
:::

## Tightly coupled: raw measurements, one filter

**Tight coupling** skips the receiver's own solution. It feeds the receiver's raw pseudoranges and deltaranges straight into a single filter alongside the inertial states. That filter also carries the receiver clock bias and clock drift as states of its own. The four-unknown problem is now solved *together* with attitude, velocity and position, instead of separately.

The payoff comes exactly where loose coupling fails. Each satellite gives its own measurement. So a single visible satellite still gives one scalar measurement — and one measurement is not nothing.

::: example What one satellite is worth
After some time without aiding, a vehicle's horizontal position uncertainty is $50\,\mathrm m$ in every direction (both axes, uncorrelated). One satellite is visible. Its **[[line of sight|los-ellipse]]** is $30^\circ$ north of east, and its pseudorange noise is $3\,\mathrm m$. Update the $2\times2$ position covariance with that single range:

```python
import numpy as np

P0 = np.diag([50.0**2, 50.0**2])           # m^2
theta = np.radians(30.0)
los = np.array([np.cos(theta), np.sin(theta)])
H = los.reshape(1, 2)
R = np.array([[3.0**2]])

S = H @ P0 @ H.T + R
K = P0 @ H.T @ np.linalg.inv(S)
P1 = (np.eye(2) - K @ H) @ P0

perp = np.array([-los[1], los[0]])
print("variance along the line of sight:", los @ P0 @ los, "->", los @ P1 @ los)
print("variance perpendicular to it:    ", perp @ P0 @ perp, "->", perp @ P1 @ perp)
# variance along the line of sight: 2500.0 -> 8.967716221602295
# variance perpendicular to it:     2500.0 -> 2500.0
```

Along the line of sight, the variance falls from $2500\,\mathrm{m^2}$ to $8.97\,\mathrm{m^2}$. Take the square root to get back to meters: the uncertainty drops from $50\,\mathrm m$ to about $3.0\,\mathrm m$, almost down to the measurement noise itself.

*Perpendicular* to the line of sight, nothing changes: still $50\,\mathrm m$. A single scalar measurement can only pin down the one direction it measures.

Sanity check: the answer along the line of sight should be a bit better than the measurement ($3\,\mathrm m$) alone, because the $50\,\mathrm m$ prior adds a sliver of information. $2.99\,\mathrm m$ is exactly that.

This is the whole case for tight coupling in one picture. A loosely coupled filter gets nothing from this satellite, because one satellite cannot make a stand-alone fix. A tightly coupled filter gets real, useful information along one direction, and waits for geometry or more satellites to fill in the rest.
:::

::: note Why it has to be true
Look only along the line of sight. There the problem is one-dimensional: a prior with variance $\sigma^2$ and a measurement with variance $R$. The Kalman update combines two independent estimates of one number, and for such a combination the *information* (one over the variance) adds:

$$
\frac{1}{\sigma_{\text{new}}^2} = \frac{1}{\sigma^2} + \frac{1}{R}, \qquad \sigma_{\text{new}}^2 = \frac{\sigma^2 R}{\sigma^2 + R}.
$$

With $\sigma^2 = 2500$ and $R = 9$:

$$
\frac{2500\times 9}{2500 + 9} = 8.97, \qquad \sqrt{8.97} \approx 3.0 .
$$

In the perpendicular direction, the measurement matrix $H$ has no component at all. So it carries zero information there, and the variance stays at $2500$. Because the prior was the same in every direction and uncorrelated, the two directions do not mix.
:::

Tight coupling earns this at a cost. The filter is built around the receiver's raw measurements instead of a finished fix. That ties its design much more closely to the receiver's internals than the loose interface does. And every pseudorange it accepts needs its own **[[integrity check|innovation-gate]]**, because one bad measurement — from a signal bouncing off a building, or a satellite broadcasting a wrong orbit — now enters the same filter that carries attitude and position, instead of being averaged away inside the receiver first. The good news is that the check is *per satellite*: the filter can reject one bad range and keep the others, which a loosely coupled filter, handed one opaque fix, cannot do.

Many tightly coupled systems also send help back the other way. The INS velocity, turned into a predicted Doppler shift for each satellite, is fed to the receiver so its tracking loops can follow the signal more easily when the vehicle moves hard or the signal is weak or jammed. That is a first step toward the third architecture.

::: key INS/GNSS coupling architectures
Loose: fuse the receiver position/velocity solution; it needs four or more satellites for any update and gets nothing from fewer. Tight: fuse raw pseudoranges and deltaranges in one filter that also estimates the receiver clock, so fewer than four satellites still helps, and outliers are gated per satellite instead of trusted as part of an opaque fix. Ultra-tight/deep: the inertial solution aids the receiver tracking loops, holding lock under jamming and high dynamics.
:::

::: example The outage this module has already priced
Recall the free-inertial lesson's numbers for this module's tactical IMU after $60\,\mathrm s$ with no aiding. The biggest terms were the initial velocity error, $6.00\,\mathrm m$; angle random walk, $5.33\,\mathrm m$; and gyro bias, $5.13\,\mathrm m$. With the accelerometer bias ($0.88\,\mathrm m$) and velocity random walk ($0.26\,\mathrm m$), combined as independent errors (root-sum-square):

$$
\sqrt{6.00^2 + 5.33^2 + 5.13^2 + 0.88^2 + 0.26^2} \approx 9.6 ,
$$

about $10\,\mathrm m$. And by an hour the gyro bias term alone reaches $405\,\mathrm{km}$.

Now a loosely coupled system loses its four-satellite fix for a $60\,\mathrm s$ stretch under a large overpass. It comes out the other side with that $10\,\mathrm m$-class error, grown with nothing to hold it back.

A tightly coupled system that keeps even one or two satellites through the same stretch — realistic under a partial overpass, less so in a full tunnel — holds down part of that growth exactly as the covariance example showed. It comes out with a smaller error for the filter to work down when the full sky returns.

Sanity check: neither architecture makes the free-inertial laws untrue. With zero satellites, both are pure INS. Tight coupling just keeps using partial information instead of throwing it away while it waits for a complete fix.
:::

## Ultra-tight, or deep, coupling

Both architectures so far assume the receiver can **track** its satellites well enough to produce pseudoranges at all. Inside a receiver, each satellite has its own set of **[[tracking loops|tracking-loop]]**: small feedback loops that keep a copy of the signal lined up with the incoming one. A **delay lock loop** (DLL) follows the code timing, which gives the pseudorange. A **phase lock loop** (PLL) follows the carrier wave, which gives the deltarange.

Each loop has a **bandwidth**: how quickly it reacts. That creates a hard trade-off, like tuning a radio in a noisy room:

- A **narrow** loop listens to only a thin slice of the signal, so it lets in little noise or jamming. But it reacts slowly, so if the vehicle suddenly accelerates, the signal runs away from it and the loop **loses lock**.
- A **wide** loop reacts fast enough to follow hard maneuvers, but lets in much more noise and jamming.

Under heavy jamming, violent maneuvers or a deep urban canyon, no single bandwidth works. The signal strength is described by the **carrier-to-noise density ratio**, $C/N_0$ ("C over N-zero"): how strong the signal is compared with the background noise. When $C/N_0$ drops or the dynamics rise too far, an independent loop drops the satellite.

**Ultra-tight** or **deep coupling** breaks the trade-off. The INS's own velocity and acceleration are fed *into* the tracking loops. The inertial solution now predicts almost all of the signal's motion, so the loop only has to follow the small leftover — and it can use a much narrower bandwidth. In the fullest form, called **[[vector tracking|vector-tracking]]**, the navigation filter itself closes the tracking loops for all satellites together. The result: the receiver holds lock at lower $C/N_0$ and higher dynamics than independent loops could survive.

The price is depth. Deep coupling needs access to the receiver's tracking-loop internals, not only its pseudorange output. So it cannot be built on a commercial receiver treated as a sealed box, the way loose and often tight coupling can. It is the architecture of choice exactly where the other two are weakest: heavy jamming, or high dynamics such as a launch vehicle's ascent or a guided munition's final approach. It is the only one of the three that helps the receiver *keep* its lock, instead of only making good use of whatever lock the receiver manages on its own.

::: warning Tight and deep are two different decisions
People mix up "tightly coupled" and "deeply coupled" in conversation. In writing, keep them straight. Tight coupling is about *what* is fused: raw ranges instead of a finished fix. It can be built entirely in the navigation filter, above an unmodified receiver. Deep coupling is about *where* the inertial aiding acts: inside the tracking loops themselves. It cannot be added to a receiver that does not expose them. A Doppler-aiding feed, as in many tight systems, is a light version of the second decision; full vector tracking is the heavy version. They are not rungs of one ladder so much as two separate design choices that the most demanding systems often make together.
:::

## Check yourself

::: check
Why does a loosely coupled INS/GNSS system gain nothing from three visible satellites, while a tightly coupled system gains something from even one?
:::

::: answer
A stand-alone fix has four unknowns — three position coordinates and the receiver clock bias — so it needs at least four independent pseudoranges. With three satellites the receiver has no complete fix to compute, and a loosely coupled filter only ever accepts a complete fix, so it receives nothing. A tightly coupled filter takes each pseudorange on its own, as one scalar measurement of a combination of its states (position along the line of sight, plus clock bias). A set of equations does not need to be complete before one of its equations is useful: one measurement pins down one direction, exactly as the covariance example showed.
:::

::: check
A vehicle must operate through heavy jamming that sometimes drops $C/N_0$ low enough to threaten loss of lock. Its receiver is a sealed commercial unit with no access to its tracking loops, but it does output raw pseudoranges and deltaranges. Which architecture is ruled out, and which is the best available fallback?
:::

::: answer
Deep coupling is ruled out, because it needs the inertial aiding to reach inside the tracking loops, and a sealed receiver does not expose them. Tight coupling is the best fallback, since the receiver outputs raw measurements. It suits jamming well: jamming usually knocks out *some* satellites at a time rather than all of them at once, and that partial sky is exactly what tight coupling can use and loose coupling cannot. If the receiver accepts an external velocity input, a Doppler-aiding feed would help its loops a little too.
:::

::: check
Using the covariance example, explain why a second satellite at a very different line-of-sight angle is worth far more than a second satellite along nearly the same line of sight as the first.
:::

::: answer
One satellite constrains only the direction along its own line of sight; the perpendicular direction stayed at $50\,\mathrm m$. A second satellite at a very different angle constrains a *different* direction, so the two together shrink the uncertainty both ways. Running the same update with a second satellite at $120^\circ$ (square to the first) gives about $3.0\,\mathrm m$ in both directions. A second satellite at $40^\circ$, only $10^\circ$ away from the first, mostly re-measures the direction already pinned down: the worst direction only improves from $50\,\mathrm m$ to about $22\,\mathrm m$. The spread of the satellites, not only their count, decides how much the uncertainty shrinks — the idea the GNSS module turns into dilution of precision.
:::

::: check
A loosely coupled filter receives a fix every second from a receiver with its own internal Kalman filter, and models each fix as having independent white noise. What goes wrong, and why does tight coupling largely escape it?
:::

::: answer
The receiver's filter smooths its answer, so successive fixes have strongly correlated errors, often over tens of seconds. Treating them as independent, the outer filter counts the same information many times and keeps shrinking its covariance. Its reported uncertainty drops below the true error: it becomes overconfident, its innovations (the gaps between prediction and measurement) look too small to it, and it starts rejecting correct inertial data. This is the cascaded-filter problem. It is a failure of the error model, not of the arithmetic, which is why it is hard to spot: nothing diverges; the covariance simply looks better than the navigation is. Tight coupling mostly escapes it because a raw pseudorange from one channel has had no smoothing across time, so it is much closer to white noise. Not completely: multipath and leftover ionospheric delay are themselves correlated in time, and a careful filter models them as extra correlated states instead of pretending they are white.
:::

::: check
A satellite's pseudorange arrives $40\,\mathrm m$ away from what the tightly coupled filter predicted, while the filter's predicted uncertainty for that measurement is $5\,\mathrm m$. What should the filter do, and why is this easier than in loose coupling?
:::

::: answer
The gap is $40/5 = 8$ standard deviations. A healthy measurement almost never lands that far out, so the filter should reject this one range — most likely multipath or a satellite fault — and keep using the others. In tight coupling that decision is made per satellite. In loose coupling the bad range is already mixed inside the receiver's finished fix, so the outer filter can only accept or reject the whole fix, and may not notice the problem at all.
:::

## Summary

| Architecture | Fuses | Needs at minimum | Fails how |
| --- | --- | --- | --- |
| Loosely coupled | Finished position/velocity fix | Four or more satellites for any update | All-or-nothing: reverts to fully free-inertial below four; cascaded-filter overconfidence |
| Tightly coupled | Raw pseudoranges, deltaranges, clock states | One satellite for a partial update | Degrades gracefully; needs per-satellite integrity gating |
| Ultra-tight / deep | Inertial aiding inside the receiver's tracking loops | Access to tracking-loop internals | Not available on a sealed, unmodified receiver |

Every architecture here still needs a filter to carry out the fusion, and every one must know exactly what "the inertial states" and "the measurement model" mean in error terms. That is the next lesson: the error-state formulation, in its 15-state and 21-state forms, that all three architectures are built on.

::: context pseudo-why Why "pseudo"
"Pseudo" is Greek for "false". A pseudorange is not the true distance to the satellite: every one from the same receiver at the same instant carries the same extra length, the receiver's clock error times the speed of light. Light travels about $300\,\mathrm m$ in a microsecond, and a cheap quartz clock can easily be off by far more than that. Rather than buy an atomic clock, the receiver treats its clock error as a fourth unknown and solves for it.
:::

::: context overpass-canyon Why a street can hide the sky
A receiver needs a clear straight line to each satellite. Under an overpass, most of the sky is blocked. Between tall buildings — an **urban canyon** — only a strip of sky straight overhead is open, and signals from low satellites either vanish or arrive after bouncing off walls. Four satellites in view can quickly become two or three.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="40" width="90" height="130" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="30" width="90" height="140" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="162" r="6" fill="#b4232c"/>
  <text x="180" y="186" font-size="11" text-anchor="middle" fill="#b4232c">receiver</text>
  <line x1="180" y1="156" x2="200" y2="10" stroke="#1d6fd1" stroke-width="2"/>
  <text x="206" y="18" font-size="11" fill="#1d6fd1">in view</text>
  <line x1="180" y1="156" x2="130" y2="110" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="130" y1="110" x2="80" y2="64" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="2 4"/>
  <text x="85" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">blocked</text>
  <line x1="180" y1="156" x2="230" y2="100" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="230" y1="100" x2="275" y2="50" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="2 4"/>
  <text x="275" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">blocked</text>
</svg>
```
:::

::: context cascaded-filters Hearing one rumor from many mouths
Suppose one friend tells you a rumor, and then repeats it every minute. If you count each repeat as a new witness, you soon feel certain — but you have really heard it once. A smoothed receiver fix is like that: each new fix is mostly the old one, lightly updated. An outer filter that treats every fix as independent grows falsely sure of itself. The fix is to know which "witnesses" are really repeats.
:::

::: context los-ellipse The circle becomes a sliver
Draw the $50\,\mathrm m$ uncertainty as a circle. One range measurement squeezes it only along the satellite's direction, down to about $3\,\mathrm m$, and leaves the other direction alone. The circle becomes a long, thin ellipse lying across the line of sight. A second satellite from a different direction squeezes the long axis too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g transform="translate(150,95)">
    <circle r="70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
    <ellipse rx="4.2" ry="70" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2" transform="rotate(-30)"/>
    <line x1="0" y1="0" x2="103.9" y2="-60" stroke="#b4232c" stroke-width="2"/>
    <polygon points="110,-63.5 96.9,-62.4 102.9,-52" fill="#b4232c"/>
    <line x1="-85" y1="0" x2="85" y2="0" stroke="#1f2a44" stroke-width="1"/>
    <line x1="0" y1="85" x2="0" y2="-85" stroke="#1f2a44" stroke-width="1"/>
    <text x="88" y="4" font-size="11" fill="#1f2a44">E</text>
    <text x="4" y="-78" font-size="11" fill="#1f2a44">N</text>
  </g>
  <text x="252" y="112" font-size="11" fill="#b4232c">to satellite,</text>
  <text x="252" y="126" font-size="11" fill="#b4232c">30° north of east</text>
  <text x="252" y="146" font-size="11" fill="#6c7a93">before: 50 m circle</text>
  <text x="252" y="160" font-size="11" fill="#1d6fd1">after: 3 m × 50 m</text>
</svg>
```
:::

::: context innovation-gate How a filter spots a bad measurement
Before using a measurement, the filter predicts it. The gap between prediction and measurement is the **innovation**, and the filter also knows how big that gap should typically be. If a pseudorange lands many standard deviations away — a common rule is more than about three to five — it is probably corrupted, and the filter throws it out. The GNSS module's integrity monitoring (RAIM) builds a full system on this idea.
:::

::: context tracking-loop A loop that keeps a copy lined up
The receiver makes its own copy of each satellite's signal and keeps sliding it to stay lined up with the real one. The error between them drives a correction, like steering a car to stay in a lane. Deep coupling adds a second input: the INS says how the vehicle is moving, so the loop can steer ahead of the curve instead of reacting late.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="46" font-size="12" fill="#1f2a44">signal</text>
  <line x1="52" y1="42" x2="78" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="84,42 76,38 76,46" fill="#1f2a44"/>
  <rect x="86" y="26" width="84" height="32" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="128" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">compare</text>
  <line x1="170" y1="42" x2="196" y2="42" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="202,42 194,38 194,46" fill="#1f2a44"/>
  <rect x="204" y="26" width="84" height="32" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="246" y="46" font-size="12" text-anchor="middle" fill="#1f2a44">loop filter</text>
  <line x1="246" y1="58" x2="246" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="98" width="112" height="32" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="246" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">signal copy</text>
  <line x1="190" y1="114" x2="128" y2="114" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="128" y1="114" x2="128" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="128,60 124,68 132,68" fill="#1f2a44"/>
  <text x="330" y="80" font-size="12" text-anchor="middle" fill="#b4232c">INS</text>
  <line x1="330" y1="86" x2="330" y2="114" stroke="#b4232c" stroke-width="2"/>
  <line x1="330" y1="114" x2="310" y2="114" stroke="#b4232c" stroke-width="2"/>
  <polygon points="303,114 312,109 312,119" fill="#b4232c"/>
</svg>
```
:::

::: context vector-tracking Where deep coupling comes back
In ordinary receivers each satellite's loops run on their own. In **vector tracking**, one navigation filter predicts every satellite's signal from a single estimate of position, velocity and clock, so a strong satellite helps hold a weak one. The GNSS module returns to vector tracking and deep coupling, together with the bandwidth-versus-dynamics trade of the DLL, PLL and FLL, in its lessons on receiver tracking.
:::
