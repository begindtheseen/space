---
id: l10-time-of-flight
title: Time of flight and analytic propagation
minutes: 23
covers:
  - time of flight
---

Think about a Ferris wheel. It turns at a steady rate, so if a full turn takes ten minutes, a quarter turn takes two and a half. Now imagine a strange Ferris wheel whose cars race through the bottom and crawl over the top. A quarter turn near the bottom might take thirty seconds; a quarter turn over the top might take four minutes. To know how long any stretch takes, you need something better than "fraction of the circle".

An orbit is that strange wheel. This lesson answers two questions. The first is **time of flight** — how long a spacecraft takes to get from one point on its orbit to another. The second is **propagation** — where the spacecraft will be at a given time. They are the same machinery run in opposite directions, and both come straight out of the anomalies and Kepler's equation from the last two lessons.

Times of flight show up all over spacecraft operations. The coast between the two burns of a transfer. The time from a de-orbit burn to **[[entry interface|entry-interface]]**. The window while a satellite is above a **[[ground station's|ground-station-pass]]** horizon. The wait while one spacecraft catches up with another before a docking. On the vehicle, the propagator is what the navigation software uses to carry the state forward between measurements, and what an onboard planner uses to look ahead. Getting these times right to the second matters; getting them right to the millisecond is routine.

The lesson has three parts. First, the time-of-flight recipe for every kind of conic, with care about "wrapping". Second, the same recipe turned around into an exact propagator. Third, a test that pits that exact propagator against a numerical integrator and shows the two agree to millionths of a metre.

## The recipe

### The clock inside the orbit

Of the three anomalies, only one ticks at a steady rate: the **mean anomaly** $M$, which grows by the same amount every second. That makes it a **[[clock hidden inside the orbit|mean-anomaly-clock]]**. The true anomaly $\nu$ (the Greek letter "nu") is the real angle you could point at, but it speeds up near periapsis and slows down far away. So to measure time between two points you do not compare their true anomalies. You translate each one into the steady clock, and then subtract.

The rate of the clock is the **mean motion**, $n = \sqrt{\mu/a^3}$, in radians per second. Here $\mu$ ("mu") is the gravitational parameter of the planet and $a$ is the semi-major axis. One full turn of the clock, $2\pi$ radians, is one period, $T = 2\pi/n$.

### Ellipse, step by step

For an ellipse, going from true anomaly $\nu_1$ to true anomaly $\nu_2$:

1. Turn each true anomaly into an eccentric anomaly, using atan2 so the quadrant comes out right:
$$
E_k = \operatorname{atan2}\!\big(\sqrt{1 - e^2}\,\sin\nu_k,\; e + \cos\nu_k\big), \quad \text{put into } [0, 2\pi).
$$
2. Turn each eccentric anomaly into a mean anomaly with Kepler's equation, $M_k = E_k - e\sin E_k$.
3. Subtract and divide by the clock rate:
$$
\Delta t = \frac{M_2 - M_1}{n} + kT, \qquad n = \sqrt{\frac{\mu}{a^3}}, \quad T = \frac{2\pi}{n}.
$$

Two details in step 3 matter.

The difference $M_2 - M_1$ is taken "modulo $2\pi$" — you add $2\pi$ if needed so that it comes out positive. Why would it be negative? If the path from $\nu_1$ to $\nu_2$ passes through periapsis, the clock has **[[wrapped around|wrap-through-periapsis]]** from $2\pi$ back to $0$ along the way, the way a wall clock goes from 11 to 1 through 12. Then $M_2$ is numerically smaller than $M_1$, and adding $2\pi$ puts the lost turn back.

The whole number $k$ counts extra complete revolutions, if the question asks for them. Usually $k = 0$.

### The other conics

A **circle** is the easy case: $M = E = \nu$, and the recipe collapses to $\Delta t = \Delta\nu/n$. This is the only case where a fraction of the angle is the same fraction of the period.

A **hyperbola** uses the hyperbolic anomaly $H$ instead of $E$:

$$
\tanh\frac{H}{2} = \sqrt{\frac{e - 1}{e + 1}}\,\tan\frac{\nu}{2}, \qquad M_h = e\sinh H - H, \qquad n_h = \sqrt{\frac{\mu}{\lvert a \rvert^3}} .
$$

($\tanh$, $\sinh$ and $\cosh$ are the hyperbolic functions from the anomalies lesson.) Then $\Delta t = (M_{h2} - M_{h1})/n_h$. There is no wrapping and no $k$, because a spacecraft on a hyperbola passes periapsis once and never comes back.

A **parabola** uses **[[Barker's|barker]]** function of $\tau = \tan(\nu/2)$:

$$
B(\nu) = \tfrac{1}{2}\tan\frac{\nu}{2} + \tfrac{1}{6}\tan^3\frac{\nu}{2}, \qquad \Delta t = \big(B(\nu_2) - B(\nu_1)\big)\sqrt{\frac{p^3}{\mu}},
$$

where $p$ is the semi-latus rectum (for a parabola, $p = 2r_p$).

### When the question gives a radius

Often the question is "how long until the spacecraft reaches radius $r$?" rather than a true anomaly. Then turn the radius into an anomaly first. Either invert the orbit equation for the true anomaly,

$$
\cos\nu = \frac{p/r - 1}{e},
$$

or go straight to the other anomaly: $\cos E = (1 - r/a)/e$ for an ellipse and $\cosh H = (1 - r/a)/e$ for a hyperbola (remember that $a < 0$ on a hyperbola, so $-r/a$ is positive there).

Each of these has two answers, $+E$ and $-E$. The spacecraft crosses each radius twice per orbit: once going out (outbound, $+E$) and once coming back (inbound, $-E$). You must choose by hand. More on this below.

::: key Time of flight on any conic
Ellipse: $\Delta t = \big[(M_2 - M_1) \bmod 2\pi\big]/n + kT$ with $M = E - e\sin E$, $n = \sqrt{\mu/a^3}$. Hyperbola: $\Delta t = (M_{h2} - M_{h1})/n_h$ with $M_h = e\sinh H - H$, $n_h = \sqrt{\mu/\lvert a \rvert^3}$. Parabola: $\Delta t = \sqrt{p^3/\mu}\,\big[B(\nu_2) - B(\nu_1)\big]$ with $B = \tfrac{1}{2}\tan\frac{\nu}{2} + \tfrac{1}{6}\tan^3\frac{\nu}{2}$. Circle: $\Delta t = \Delta\nu/n$.
:::

::: example Time of flight around a GTO, both ways round
The GTO from earlier lessons has $a = 24\,396.14\,\mathrm{km}$ and $e = 0.72831$, so $n = 1.65687 \times 10^{-4}\,\mathrm{rad/s}$ and $T = 37\,922\,\mathrm{s}$.

**The far half.** Go from $\nu_1 = 90^\circ$ to $\nu_2 = 270^\circ$, the half of the orbit (by angle) that contains apogee. The anomalies lesson found $E_1 = 0.75494$ and $M_1 = 0.25587\,\mathrm{rad}$. The point at $270^\circ$ is the mirror image of the point at $90^\circ$, so $E_2 = 2\pi - E_1$ and $M_2 = 2\pi - M_1$. Subtract:

$$
M_2 - M_1 = (2\pi - 0.25587) - 0.25587 = 5.77145\,\mathrm{rad}.
$$

It is already positive, so no wrapping. Divide by $n$:

$$
\Delta t = \frac{5.77145}{1.65687 \times 10^{-4}} = 34\,834\,\mathrm{s} = 9.68\,\mathrm{h}.
$$

That is $91.9\,\%$ of the period, spent on what is only half the orbit by angle.

**The near half.** Now go the other way, from $270^\circ$ through perigee to $90^\circ$. Now $M_1 = 2\pi - 0.25587$ and $M_2 = 0.25587$, so

$$
M_2 - M_1 = 0.25587 - (2\pi - 0.25587) = -5.77145 .
$$

Negative — the clock wrapped through perigee. Add $2\pi$ to get $0.51174\,\mathrm{rad}$, and

$$
\Delta t = \frac{0.51174}{1.65687 \times 10^{-4}} = 3089\,\mathrm{s} = 51.5\,\mathrm{min}.
$$

**Check.** The two trips together make one lap: $34\,834 + 3089 = 37\,923\,\mathrm{s}$, one period to rounding. As it must be.
:::

::: example The ISS through perigee, and how good the circular approximation is
Take the ISS-like orbit: $a = 6791\,\mathrm{km}$, $e = 0.0006$, $n = 1.12815 \times 10^{-3}\,\mathrm{rad/s}$. Go from $\nu_1 = 350^\circ$ to $\nu_2 = 10^\circ$, a $20^\circ$ arc through perigee.

**Anomalies.** At $\nu_1 = 350^\circ$: $E_1 = 350.006^\circ$, then $M_1 = 350.012^\circ$. At $\nu_2 = 10^\circ$: $E_2 = 9.994^\circ$, then $M_2 = 9.988^\circ$. At this tiny eccentricity each step moves the angle by only about $0.006^\circ$.

**Subtract and wrap.** $M_2 - M_1 = 9.988^\circ - 350.012^\circ = -340.024^\circ$. Negative, because the arc passes perigee, so add $360^\circ$: $19.976^\circ = 0.34865\,\mathrm{rad}$.

**Divide.** $\Delta t = 0.34865 / (1.12815 \times 10^{-3}) = 309.0\,\mathrm{s}$.

**Compare with the circle shortcut.** Pretending the orbit is circular gives $\Delta\nu/n = 0.34907 / (1.12815 \times 10^{-3}) = 309.4\,\mathrm{s}$. The difference is $0.4\,\mathrm{s}$, about a tenth of a percent. That matches the small-$e$ estimate from the anomalies lesson, $\nu - M \approx 2e\sin M$: at each end it is $2 \times 0.0006 \times \sin 10^\circ \approx 0.0002\,\mathrm{rad}$, so the arc in $M$ is about $0.0004\,\mathrm{rad}$ shorter than the arc in $\nu$.

Good enough for a contact schedule. Not good enough for a docking.
:::

::: example Time to reach ten Earth radii on a hyperbola
A hyperbola has periapsis radius $r_p = 6678.137\,\mathrm{km}$ and $e = 1.5$.

**Orbit numbers.** $a = r_p/(1 - e) = 6678.137 / (-0.5) = -13\,356.27\,\mathrm{km}$ (negative, as for every hyperbola). $p = r_p(1 + e) = 16\,695.3\,\mathrm{km}$. And $n_h = \sqrt{\mu/\lvert a \rvert^3} = 4.0902 \times 10^{-4}\,\mathrm{s^{-1}}$.

**Anomaly from radius.** Ten Earth radii is $r = 10R = 63\,781.4\,\mathrm{km}$. Outbound, so take the positive root:

$$
\cosh H = \frac{1 - r/a}{e} = \frac{1 + 63\,781.4/13\,356.27}{1.5} = 3.8503, \qquad H = 2.0240 .
$$

**Mean anomaly and time.** $\sinh(2.0240) = 3.7181$, so

$$
M_h = 1.5 \times 3.7181 - 2.0240 = 3.5532, \qquad \Delta t = \frac{3.5532}{4.0902 \times 10^{-4}} = 8687\,\mathrm{s} = 2.41\,\mathrm{h}.
$$

**Where is it?** The true anomaly there is $\cos\nu = (p/r - 1)/e = -0.4922$, so $\nu = 119.5^\circ$. The hyperbola can never pass its **[[asymptote|asymptote]]** direction, $\nu_\infty = \arccos(-1/e) = \arccos(-1/1.5) = 131.8^\circ$. At $119.5^\circ$ it is well on the way. Sensible: after two and a half hours it is far out and heading nearly straight away.
:::

::: warning Wrap the mean-anomaly difference, not the true-anomaly difference
The time of flight comes from $M_2 - M_1$, wrapped into $[0, 2\pi)$. Do not wrap $\nu_2 - \nu_1$ and convert that *difference* into a mean anomaly. The map from $\nu$ to $M$ is not a straight line, so a difference in $\nu$ does not turn into a difference in $M$. Convert each endpoint on its own, then subtract, then wrap.
:::

::: warning Fractions of a period are for circles only
On a GTO the arc from $\nu = 90^\circ$ to $270^\circ$ is half the orbit by angle but $92\,\%$ of it by time. Writing $\Delta t = (\Delta\nu/2\pi)\,T$ is right only when $e = 0$. At $e = 0.0006$ it is off by a tenth of a percent; at $e = 0.73$ it is off by nearly a factor of two on this arc.
:::

## Analytic propagation

Run the recipe backwards and you have a **propagator**: give it a state now and a time step, and it hands back the state later. You have a position $\mathbf{r}_0$ and velocity $\mathbf{v}_0$ (bold letters are vectors) at time $t_0$, and a time step $\Delta t$ ("delta t"):

1. Convert the state to elements $(a, e, i, \Omega, \omega, \nu_0)$.
2. Go $\nu_0 \to E_0 \to M_0 = E_0 - e\sin E_0$.
3. Advance the clock: $M = M_0 + n\,\Delta t$, wrapped to $[0, 2\pi)$.
4. Solve Kepler's equation for $E$ (the last lesson's solver), then convert $E \to \nu$.
5. Convert $(a, e, i, \Omega, \omega, \nu)$ back to $\mathbf{r}, \mathbf{v}$.

Five of the six elements never change: in pure two-body motion the orbit itself is frozen, and only the spacecraft's place on it moves. Step 3 is the only place time enters.

It is called **analytic** because every step is a formula, not a long chain of small steps. Only step 4 iterates, and it converges to the last digit the computer can hold. The result is the exact two-body state at $t_0 + \Delta t$, limited only by round-off — about $10^{-12}$ relative, or around a micrometre on a $7000\,\mathrm{km}$ orbit.

### Backwards, forwards and far ahead

Nothing in the recipe needs $\Delta t > 0$. A negative time step subtracts from $M$, and the same five steps return the state at an earlier time. That is useful for tracing an observed object back to a maneuver or a launch.

Nor is there a limit on how far ahead you may look, and the error does not grow with the distance. Propagating a year ahead costs the same, and is as accurate, as propagating a minute ahead. One detail needs care when $\Delta t$ is large.

After ten years an ISS-like satellite has made about $57\,000$ revolutions, and $n\,\Delta t$ is about $3.6 \times 10^{5}\,\mathrm{rad}$. In **[[double precision|double-precision]]** a number that size is stored to about $6 \times 10^{-11}\,\mathrm{rad}$, which is less than half a millimetre along the orbit. So one multiplication and one wrap are harmless. Getting the same number by adding $n\,\delta t$ a million times is not: the rounding error of every addition piles up into metres. So compute $M$ from the elapsed time in one step, and keep the starting mean anomaly $M_0$ and the elapsed time as separate numbers until the last moment.

### Picking the branch when you start from a radius

When the question is time to a given *radius*, the sign of the anomaly is yours to choose. $\cos E = (1 - r/a)/e$ has two solutions, $\pm E$. A spacecraft that is falling back toward periapsis is at $-E$ (the same as $2\pi - E$). Its time until the next periapsis is $(2\pi - M)/n$ counted forward; the time since the last periapsis is $M/n$ counted backward. Pick the wrong branch and the answer is wrong by exactly the time spent above that radius — a believable number, which is what makes the mistake dangerous.

::: example Propagating the ISS-like state by one hour
**Start.** $\mathbf{r}_0 = (-2267.240, -3989.573, 5001.268)\,\mathrm{km}$ and $\mathbf{v}_0 = (5.0098, -5.4258, -2.0540)\,\mathrm{km/s}$.

**Step 1, elements.** The state-to-elements conversion gives $a = 6790.985\,\mathrm{km}$, $e = 0.000598$, $i = 51.640^\circ$, $\Omega = 120.000^\circ$, $\omega = 79.896^\circ$, $\nu_0 = 30.104^\circ$, and so $n = 1.128157 \times 10^{-3}\,\mathrm{rad/s}$.

**Step 2, into the clock.** $E_0 = 30.086^\circ$ and $M_0 = 30.069^\circ$.

**Step 3, advance.** In $3600\,\mathrm{s}$ the clock moves $n\,\Delta t = 4.06137\,\mathrm{rad} = 232.699^\circ$. So $M = 30.069^\circ + 232.699^\circ = 262.768^\circ$.

**Step 4, back out of the clock.** Kepler's equation gives $E = 262.734^\circ$, and then $\nu = 262.700^\circ$.

**Step 5, back to a state.** The elements-to-state conversion returns

$$
\mathbf{r} = (-2148.598,\; 6242.669,\; -1592.817)\,\mathrm{km}, \qquad \mathbf{v} = (-5.073044,\; -0.288197,\; 5.733046)\,\mathrm{km/s}.
$$

**Check.** The radius is $6791.50\,\mathrm{km}$ and the speed $7.6608\,\mathrm{km/s}$ — both sensible for a near-circular orbit of $a \approx 6791\,\mathrm{km}$. The specific energy $v^2/2 - \mu/r = -29.348\,\mathrm{km^2/s^2}$ matches the starting value to $10^{-14}$, as it must for an exact solution.
:::

## Numerical propagation, and showing the two agree

The other way to propagate is to integrate the equation of motion numerically, one small step at a time, as the ODE and numerical-methods modules taught. The state is $\mathbf{x} = (\mathbf{r}, \mathbf{v})$ and its rate of change is

$$
\dot{\mathbf{x}} = \left(\mathbf{v},\; -\frac{\mu\,\mathbf{r}}{r^3}\right).
$$

For pure two-body motion this is strictly worse than the analytic solution: slower and less accurate. But it is the only option once you add anything else — Earth's bulge, drag, the Moon. And the analytic solution is how you *prove* the integrator is right before you trust it with those extras.

The test is plain: start both from the same state, run both for the same $\Delta t$, and take the difference. Here is the result with an eighth-order adaptive-step integrator, **[[DOP853|dop853]]** in SciPy, on the ISS-like state. "Relative tolerance" is how much error per step the integrator is told to accept; "function evaluations" counts how many times it had to compute the acceleration.

| $\Delta t$ | Relative tolerance | Position difference | Velocity difference | Function evaluations |
| --- | --- | --- | --- | --- |
| 1 h | $10^{-6}$ | $11.5\,\mathrm{m}$ | $12\,\mathrm{mm/s}$ | 122 |
| 1 h | $10^{-9}$ | $11\,\mathrm{mm}$ | $0.011\,\mathrm{mm/s}$ | 206 |
| 1 h | $10^{-13}$ | $1.1\,\mathrm{\mu m}$ | $10^{-6}\,\mathrm{mm/s}$ | 566 |
| 24 h | $10^{-9}$ | $123\,\mathrm{mm}$ | $0.14\,\mathrm{mm/s}$ | 3890 |
| 24 h | $10^{-13}$ | $4.7\,\mathrm{\mu m}$ | $5 \times 10^{-6}\,\mathrm{mm/s}$ | 12 338 |
| 7 d | $10^{-13}$ | $0.63\,\mathrm{mm}$ | $7 \times 10^{-4}\,\mathrm{mm/s}$ | 86 018 |

Read the table two ways.

**Down the tolerance column.** At tight tolerance the two agree to micrometres over a day and to under a millimetre over a week. That is far below any real force the model leaves out, so it checks *both* codes at once. A wrong $\mu$, a sign error, a mixed-up `atan2`, or a quadrant slip in either one would show up as metres or kilometres, not micrometres.

**Across the rows.** The difference shrinks when the tolerance is tightened and grows with elapsed time, exactly as integration error should. That tells you the leftover difference belongs to the integrator, not to the analytic solution.

A plain fixed-step **[[RK4|rk4-scaling]]** tells the same story with cruder numbers. After one orbit ($5569\,\mathrm{s}$) its position error is $28\,\mathrm{m}$ with a $60\,\mathrm{s}$ step, $17\,\mathrm{mm}$ with a $10\,\mathrm{s}$ step, and about $2\,\mathrm{\mu m}$ with a $1\,\mathrm{s}$ step. A fourth-order method's error should scale as $h^4$ (the step size to the fourth power). Going from $60\,\mathrm{s}$ to $10\,\mathrm{s}$ is a factor of $6$, and $6^4 = 1296$; the observed ratio is about $1700$. Close enough to confirm the method is doing what it claims.

Here is the comparison in code. It uses `rv2coe`, `coe2rv` and `solve_kepler` from the conversions and solver lessons.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 398600.4418

def propagate_kepler(r0, v0, dt):
    a, e, i, raan, argp, nu0 = rv2coe(r0, v0)          # from the conversions lesson
    n = np.sqrt(MU / a**3)
    E0 = np.arctan2(np.sqrt(1 - e**2) * np.sin(nu0), e + np.cos(nu0))
    M = (E0 - e * np.sin(E0) + n * dt) % (2 * np.pi)
    E = solve_kepler(M, e)                              # from the solver lesson
    nu = np.arctan2(np.sqrt(1 - e**2) * np.sin(E), np.cos(E) - e)
    return coe2rv(a, e, i, raan, argp, nu)

def two_body(t, x):
    r = x[:3]
    return np.concatenate([x[3:], -MU * r / np.linalg.norm(r)**3])

r0 = np.array([-2267.240, -3989.573, 5001.268])
v0 = np.array([5.0098, -5.4258, -2.0540])
dt = 86400.0
rk, vk = propagate_kepler(r0, v0, dt)
sol = solve_ivp(two_body, (0, dt), np.r_[r0, v0], method="DOP853", rtol=1e-13, atol=1e-16)
print(np.linalg.norm(sol.y[:3, -1] - rk) * 1e9, "micrometres")   # about 5 (km to micrometres is 1e9)
```

Keep this test in your toolbox for good. Every time you add a force to the integrator, switch it off and re-run the comparison. Every time you change the conversion routines, re-run it. It is the cheapest **[[regression test|regression-test]]** in astrodynamics.

## Check yourself

::: check
A satellite in an orbit with $a = 8000\,\mathrm{km}$ and $e = 0.2$ is at $\nu = 300^\circ$. How long until it next reaches $\nu = 60^\circ$?
:::

::: answer
**Clock rate.** $n = \sqrt{398\,600.4418/8000^3} = 8.8234 \times 10^{-4}\,\mathrm{rad/s}$, so the period is $2\pi/n = 7121\,\mathrm{s}$.

**Start point, $\nu_1 = 300^\circ$.** $\sqrt{1 - e^2} = \sqrt{0.96}$, so $E_1 = \operatorname{atan2}(\sqrt{0.96}\sin 300^\circ,\ 0.2 + \cos 300^\circ) = \operatorname{atan2}(-0.8485,\ 0.7) = -50.48^\circ$, which is $309.52^\circ = 5.4022\,\mathrm{rad}$. Then $M_1 = 5.4022 - 0.2\sin(309.52^\circ) = 5.4022 + 0.1543 = 5.5564\,\mathrm{rad}$.

**End point, $\nu_2 = 60^\circ$.** $E_2 = \operatorname{atan2}(0.8485,\ 0.7) = 50.48^\circ = 0.8810\,\mathrm{rad}$. Then $M_2 = 0.8810 - 0.1543 = 0.7267\,\mathrm{rad}$.

**Subtract and wrap.** $M_2 - M_1 = -4.8297$. Negative, because the path crosses perigee, so add $2\pi$: $1.4535\,\mathrm{rad}$.

**Time.** $\Delta t = 1.4535 / (8.8234 \times 10^{-4}) = 1647\,\mathrm{s} = 27.5\,\mathrm{min}$. The $120^\circ$ arc through perigee takes only $23\,\%$ of the period — less than the $33\,\%$ its angle suggests, as it should be near perigee where the spacecraft is fast.
:::

::: check
Why does analytic propagation of a two-body orbit not pile up error with time, while numerical integration does?
:::

::: answer
The analytic solution evaluates a formula at the target time. Its only errors are round-off in a fixed number of arithmetic operations and the Kepler solver's tolerance, which is at machine precision. Neither depends on how far ahead you look.

A numerical integrator builds the answer step by step. Each step makes a small truncation error, and that error is carried forward and amplified by the dynamics in every later step. So the error grows with the number of steps, and therefore with $\Delta t$. The table shows it: even at $10^{-13}$ tolerance, micrometres after a day become most of a millimetre after a week.
:::

::: check
Your numerical integrator and your analytic propagator disagree by $3\,\mathrm{km}$ after one orbit, and the disagreement grows steadily with time along the direction of motion. What is the most likely bug?
:::

::: answer
A small error in $\mu$ (or, the same thing, in $a$) in one of the two codes.

A wrong $\mu$ changes the period. The two spacecraft then run around the same-looking orbit at slightly different speeds, and one steadily falls behind the other along the track. An along-track error growing in a straight line with time is the fingerprint of a period mismatch.

The other suspects look different. A sign error or a frame error would give a large disagreement right away, not a slow drift. Integrator tolerance would give a disagreement that shrinks when you tighten the tolerance.
:::

::: check
On a parabolic orbit with $p = 13\,356.27\,\mathrm{km}$, how long does the spacecraft take to go from $\nu = -90^\circ$ to $\nu = +90^\circ$?
:::

::: answer
At $\nu = 90^\circ$, $\tan 45^\circ = 1$, so $B(90^\circ) = \tfrac{1}{2} + \tfrac{1}{6} = 0.66667$. At $\nu = -90^\circ$ the tangent is $-1$, so $B(-90^\circ) = -0.66667$. The difference is $\Delta B = 1.33333$.

The time scale is $\sqrt{p^3/\mu} = 1/(4.0902 \times 10^{-4}) = 2444.9\,\mathrm{s}$. So $\Delta t = 1.33333 \times 2444.9 = 3260\,\mathrm{s} = 54.3\,\mathrm{min}$.

Check: that is exactly twice the $27.2\,\mathrm{min}$ from periapsis to $90^\circ$ found in the anomalies lesson, as the mirror symmetry of the parabola demands.
:::

::: check
How would you use the analytic propagator to find the length of a ground-station pass, if the station sees the satellite whenever its position satisfies some geometric condition?
:::

::: answer
**Coarse search.** Propagate analytically at a coarse step, say every $10\,\mathrm{s}$, across the time window. At each sample, test the visibility condition. Look for the places where the answer flips from "not visible" to "visible" (rise) and back (set).

**Refine.** Home in on each flip with a root-finder on time — bisection or Brent's method — calling the analytic propagator inside it. Because the propagator is exact and cheap, reaching millisecond precision costs only a few dozen calls per crossing.

No integration is involved, so the coarse sampling adds no propagation error. Its only risk is missing a pass shorter than the step.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $M$, $n = \sqrt{\mu/a^3}$ | Mean anomaly, the steady clock; mean motion, its rate |
| $\Delta t = [(M_2 - M_1) \bmod 2\pi]/n + kT$ | Elliptic time of flight; convert each $\nu$ to $E$ to $M$ separately |
| $\cos E = (1 - r/a)/e$, $\cosh H = (1 - r/a)/e$ | Anomaly from radius; sign from outbound or inbound |
| $\Delta t = (M_{h2} - M_{h1})/n_h$ | Hyperbolic; $n_h = \sqrt{\mu/\lvert a \rvert^3}$, no wrapping |
| $\Delta t = \sqrt{p^3/\mu}\,[B(\nu_2) - B(\nu_1)]$ | Parabolic, with Barker's $B(\nu)$ |
| $\Delta t = \Delta\nu/n$ | Circle only |
| GTO $90^\circ \to 270^\circ$ | $9.68\,\mathrm{h}$, $92\,\%$ of the period |
| Analytic propagator | State to elements, advance $M$ by $n\,\Delta t$, solve Kepler, elements to state |
| Agreement test | DOP853 at $10^{-13}$: $1\,\mathrm{\mu m}$ in 1 h, $5\,\mathrm{\mu m}$ in 24 h, $0.6\,\mathrm{mm}$ in 7 d |
| Error signatures | Along-track linear drift means a period ($\mu$ or $a$) mismatch; immediate large error means sign or frame |

Next lesson: the three separate anomalies — $E$, $H$ and $\tan(\nu/2)$ — get replaced by one **universal variable** that handles every conic in the same code path. The lesson after that writes the propagated state as a mix of the starting position and velocity, through the Lagrange coefficients.

::: context entry-interface Where space ends, for a returning capsule
"Entry interface" is the altitude where a returning spacecraft is said to start meeting the atmosphere in earnest. For NASA's crewed vehicles it was set at $400\,000$ feet, about $122\,\mathrm{km}$. Above it, the capsule is coasting on a plain two-body orbit. Below it, drag takes over.

So the time from the de-orbit burn to entry interface is a pure time-of-flight problem: from the burn point to the radius $R + 122\,\mathrm{km}$ on the new orbit, taking the inbound branch.
:::

::: context ground-station-pass What a "pass" is
A ground station is a big dish antenna on Earth that talks to satellites. It can only talk to one that is above its horizon. A satellite in low orbit rises over the horizon, crosses the sky and sets again in something like five to fifteen minutes. That stretch is a **pass**.

Operators plan every command upload and data download around pass times, so predicting when each pass begins and ends is one of the most common time-of-flight jobs there is. The last Check yourself question shows how.
:::

::: context mean-anomaly-clock Why a made-up angle makes a good clock
Kepler's second law says the line from the planet to the spacecraft sweeps out equal areas in equal times. So the *area* swept since periapsis grows steadily, like the hand of a clock, even though the *angle* does not.

The mean anomaly is that swept area, rescaled so that one full orbit counts as $2\pi$. It is not the angle to anything you could point a telescope at. It is a clock face painted onto the orbit. The dots below are equally spaced on that clock — equal steps of $M$, equal steps of time — and see how unevenly they land on the real orbit:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <ellipse cx="175" cy="95" rx="125" ry="85.66" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <circle cx="266.0" cy="95" r="4" fill="#1f2a44"/>
  <text x="258" y="99" font-size="11" text-anchor="end" fill="#1f2a44">Earth</text>
  <g fill="#b4232c">
    <circle cx="300.0" cy="95.0" r="3.5"/>
    <circle cx="219.9" cy="15.1" r="3.5"/>
    <circle cx="151.2" cy="10.9" r="3.5"/>
    <circle cx="104.3" cy="24.3" r="3.5"/>
    <circle cx="73.4" cy="45.1" r="3.5"/>
    <circle cx="55.8" cy="69.3" r="3.5"/>
    <circle cx="50.0" cy="95.0" r="3.5"/>
    <circle cx="55.8" cy="120.7" r="3.5"/>
    <circle cx="73.4" cy="144.9" r="3.5"/>
    <circle cx="104.3" cy="165.7" r="3.5"/>
    <circle cx="151.2" cy="179.1" r="3.5"/>
    <circle cx="219.9" cy="174.9" r="3.5"/>
  </g>
  <text x="306" y="99" font-size="11" fill="#1f2a44">perigee</text>
  <text x="175" y="200" font-size="11" text-anchor="middle" fill="#1f2a44">GTO to scale: one dot every twelfth of a period</text>
</svg>
```

The time between two points is the difference of their mean anomalies divided by the clock rate $n$ — that is the whole recipe.
:::

::: context wrap-through-periapsis The GTO, split by time
The two halves of the GTO by angle are wildly unequal by time. The blue arc, through apogee, takes $34\,834\,\mathrm{s}$; the red arc, through perigee, takes $3089\,\mathrm{s}$. The orbit below is drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M266.0,41.3 A125,85.66 0 1,0 266.0,158.7" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M266.0,158.7 A125,85.66 0 0,0 266.0,41.3" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="266.0" cy="100" r="4" fill="#1f2a44"/>
  <line x1="266.0" y1="41.3" x2="266.0" y2="158.7" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="266.0" cy="41.3" r="3.5" fill="#1f2a44"/>
  <circle cx="266.0" cy="158.7" r="3.5" fill="#1f2a44"/>
  <text x="276" y="36" font-size="11" fill="#1f2a44">ν = 90°</text>
  <text x="276" y="172" font-size="11" fill="#1f2a44">ν = 270°</text>
  <text x="252" y="104" font-size="11" text-anchor="end" fill="#1f2a44">Earth</text>
  <text x="306" y="104" font-size="11" fill="#b4232c">perigee</text>
  <text x="56" y="104" font-size="11" fill="#1d6fd1">apogee</text>
  <text x="150" y="104" font-size="12" text-anchor="middle" fill="#1d6fd1">34 834 s (92%)</text>
  <text x="335" y="60" font-size="12" text-anchor="middle" fill="#b4232c">3089 s</text>
</svg>
```

Going from $270^\circ$ to $90^\circ$ the red way, the clock passes $2\pi$ at perigee and starts again from $0$. That is why the raw difference comes out negative and needs $2\pi$ added.
:::

::: context barker An eighteenth-century comet table
Thomas Barker, an English country gentleman with a taste for astronomy, published in 1757 a table for finding where a comet on a parabolic path would be at a given time. The cubic in $\tan(\nu/2)$ behind that table has carried his name ever since.

Comets are why the parabola mattered so much then: a comet falling in from far beyond the planets has an orbit so stretched that near the Sun it is almost exactly a parabola.
:::

::: context asymptote The direction a hyperbola heads off in
Far from the planet a hyperbolic path becomes nearly a straight line. The direction of that line is the asymptote, and the true anomaly can approach $\nu_\infty = \arccos(-1/e)$ but never reach it. Drawn to scale for $e = 1.5$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <path d="M290.7,195.0 L290.7,193.9 L290.7,192.8 L290.6,191.8 L290.5,190.7 L290.4,189.6 L290.3,188.4 L290.1,187.3 L290.0,186.2 L289.7,185.0 L289.5,183.8 L289.2,182.6 L288.9,181.3 L288.6,180.0 L288.2,178.7 L287.8,177.3 L287.3,175.9 L286.8,174.4 L286.2,172.9 L285.6,171.2 L284.9,169.5 L284.1,167.7 L283.2,165.8 L282.2,163.8 L281.1,161.6 L279.8,159.3 L278.4,156.7 L276.8,153.9 L274.9,150.9 L272.8,147.5 L270.3,143.8 L267.5,139.5 L264.1,134.7 L260.1,129.1 L255.2,122.5 L249.1,114.6 L241.5,105.0 L231.7,92.8 L218.6,76.8 L200.2,55.0 L172.7,22.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="270" y1="195" x2="143.3" y2="53.4" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="270" y1="195" x2="172.7" y2="22.9" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="270" y1="195" x2="320" y2="195" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="270" cy="195" r="4" fill="#1f2a44"/>
  <circle cx="172.7" cy="22.9" r="3.5" fill="#b4232c"/>
  <text x="182" y="16" font-size="11" fill="#b4232c">r = 10 R, ν = 119.5°</text>
  <text x="190" y="31" font-size="11" fill="#b4232c">t = 2.41 h</text>
  <text x="136" y="70" font-size="11" text-anchor="end" fill="#6c7a93">asymptote direction</text>
  <text x="136" y="84" font-size="11" text-anchor="end" fill="#6c7a93">ν∞ = 131.8°</text>
  <text x="262" y="210" font-size="11" text-anchor="end" fill="#1f2a44">Earth</text>
  <text x="297" y="190" font-size="11" fill="#1d6fd1">periapsis</text>
</svg>
```
:::

::: context double-precision How many digits a computer keeps
Most scientific code stores numbers in **double precision**: about 16 significant decimal digits. The gap between neighboring numbers it can store grows with the size of the number. Near $1$ the gap is about $2 \times 10^{-16}$; near $3.6 \times 10^5$ it is about $6 \times 10^{-11}$.

That is why one big multiplication is fine, but a million small additions are not. Each addition rounds its result to the nearest storable number, and a million tiny roundings can add up.
:::

::: context dop853 An integrator that picks its own step
DOP853 is an eighth-order Runge–Kutta method designed by Dormand and Prince and programmed by Hairer and Wanner. "Eighth order" means that halving the step cuts the overall error by about $2^8 = 256$ times.

It is adaptive: at every step it makes two estimates of different order, compares them, and shrinks or grows the next step to keep the difference within the tolerance you asked for. That is why the evaluation count in the table rises as the tolerance tightens.
:::

::: context rk4-scaling Shrinking the step, on a log scale
The classical fourth-order Runge–Kutta method (RK4) has an error that falls like the step size to the fourth power. Here is its position error after one ISS-like orbit, on a scale where each grid line is a factor of $1000$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="57.8" x2="340" y2="57.8" stroke="#8fb8f0" stroke-width="1"/>
  <line x1="70" y1="114.5" x2="340" y2="114.5" stroke="#8fb8f0" stroke-width="1"/>
  <line x1="70" y1="171.2" x2="340" y2="171.2" stroke="#8fb8f0" stroke-width="1"/>
  <text x="64" y="61.8" font-size="11" text-anchor="end" fill="#1f2a44">1 m</text>
  <text x="64" y="118.5" font-size="11" text-anchor="end" fill="#1f2a44">1 mm</text>
  <text x="64" y="175.2" font-size="11" text-anchor="end" fill="#1f2a44">1 μm</text>
  <rect x="95" y="30.4" width="50" height="159.6" fill="#b4232c"/>
  <rect x="180" y="91.3" width="50" height="98.7" fill="#f2b880"/>
  <rect x="265" y="165.5" width="50" height="24.5" fill="#1d6fd1"/>
  <line x1="70" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="25" font-size="11" text-anchor="middle" fill="#1f2a44">28 m</text>
  <text x="205" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">17 mm</text>
  <text x="290" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">2 μm</text>
  <text x="120" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">step 60 s</text>
  <text x="205" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">step 10 s</text>
  <text x="290" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">step 1 s</text>
</svg>
```

Ten times smaller steps should give $10^4$ times less error. From $10\,\mathrm{s}$ to $1\,\mathrm{s}$ it gives about $8400$ — close to the rule.
:::

::: context regression-test Tests that catch what you broke later
A **regression test** is a check you run again every time the code changes, to catch a "regression" — something that used to work and quietly stopped. The analytic-versus-numerical comparison is a perfect one: it is cheap, it needs no outside data, and almost any bug in either propagator makes it fail loudly.

Flight software teams run thousands of tests like this automatically on every change.
:::
