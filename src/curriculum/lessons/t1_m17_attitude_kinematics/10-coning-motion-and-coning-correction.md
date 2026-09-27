---
id: l10-coning-motion-and-coning-correction
title: Coning motion and coning correction
minutes: 23
covers:
  - coning motion and coning correction
---

Point a flashlight at the ceiling and draw a slow circle with the beam. Your wrist tilts one way, then another, then another. The flashlight never twists about its own long axis — the switch stays on top the whole time. Yet if you had three tiny rotation sensors glued to that flashlight, they would report a small, steady twist about its long axis, circle after circle. Add up what they report and you would conclude the flashlight had turned right around. It did not.

That is **coning**: motion in which the axis a body turns about itself keeps turning, so the body's axis sweeps out a cone. Lesson 1 of this module claimed that there is no three-number attitude whose rate of change is the angular velocity $\boldsymbol{\omega}$ ("omega"), because **[[finite rotations do not commute|non-commuting]]**. So adding up $\boldsymbol{\omega}$ component by component is not a way to get attitude. This lesson is the evidence. The error has a name, a formula, a size that competes with the best gyros, and a standard fix built into every **[[strapdown|strapdown-word]]** navigation system — one whose gyros are bolted straight to the vehicle.

It matters in practice because of vibration. A gyro on a launch vehicle sees structural shaking at tens of hertz, with amplitudes of hundredths of a degree. That is far too small to see on a plot, and quite enough to produce tenths of a degree per hour of attitude drift if the attitude algorithm is naive. A spinning satellite that wobbles, a missile that rolls while it pitches, a helicopter rotor hub: all of them cone. The fix costs one cross product per sample.

## What coning is

Picture the body's $z$ axis tracing a **[[cone|cone-picture]]** around a fixed direction in space. The **half-angle** $\beta$ ("beta") is how far the axis leans from the center line. The **cone rate** $\Omega$ ("capital omega") is how fast the axis goes around, in radians per second.

In quaternion form, the attitude is a tilt by $\beta$ about an axis that itself turns:

$$
\mathbf{q}(t) = \Bigl[\cos\tfrac{\beta}{2},\ \ \hat{\mathbf{n}}(t)\sin\tfrac{\beta}{2}\Bigr],
\qquad \hat{\mathbf{n}}(t) = (\cos\Omega t,\ \sin\Omega t,\ 0).
$$

Here $\hat{\mathbf{n}}$ ("n hat") is the tilt axis. It lies flat in the $x$–$y$ plane and goes around once every $2\pi/\Omega$ seconds.

What would gyros strapped to this body measure? Differentiate $\mathbf{q}$ and solve the quaternion kinematic equation $\dot{\mathbf{q}} = \tfrac{1}{2}\mathbf{q}\otimes[0,\boldsymbol{\omega}]$ for the body rate. Write $\hat{\mathbf{m}} = (-\sin\Omega t, \cos\Omega t, 0)$ for the direction a quarter-turn ahead of $\hat{\mathbf{n}}$. The result is

$$
\boldsymbol{\omega}(t) = \Omega\sin\beta\;\hat{\mathbf{m}}(t) \;-\; \Omega\,(1 - \cos\beta)\,\hat{\mathbf{z}} .
$$

Read it slowly, because everything follows from it. The rate has three features:

- a **constant size**, $\lVert\boldsymbol{\omega}\rVert = 2\Omega\sin(\beta/2)$ — only its direction moves;
- a **transverse part** (sideways, in the $x$–$y$ plane) that goes round and round at rate $\Omega$;
- and, the crucial term, a **[[constant component along the cone axis|rate-components]]**, $-\Omega(1 - \cos\beta)$.

::: note Why it has to be true
The rate comes from $\boldsymbol{\omega} = 2\,\mathbf{q}^*\otimes\dot{\mathbf{q}}$, the kinematic equation turned around ($\mathbf{q}^*$ is the conjugate: flip the sign of the vector part). Write $c = \cos(\beta/2)$ and $s = \sin(\beta/2)$, so $\mathbf{q} = [c,\ s\hat{\mathbf{n}}]$. Only $\hat{\mathbf{n}}$ changes, and its rate is $\dot{\hat{\mathbf{n}}} = \Omega\hat{\mathbf{m}}$, so $\dot{\mathbf{q}} = [0,\ s\Omega\hat{\mathbf{m}}]$.

Multiply $[c,\ -s\hat{\mathbf{n}}]\otimes[0,\ s\Omega\hat{\mathbf{m}}]$ with the quaternion product rule. The scalar part is $-(-s\hat{\mathbf{n}})\cdot(s\Omega\hat{\mathbf{m}}) = s^2\Omega\,(\hat{\mathbf{n}}\cdot\hat{\mathbf{m}}) = 0$, because the two directions are at right angles. The vector part is $cs\Omega\hat{\mathbf{m}} - s^2\Omega\,(\hat{\mathbf{n}}\times\hat{\mathbf{m}})$, and $\hat{\mathbf{n}}\times\hat{\mathbf{m}} = \hat{\mathbf{z}}$.

Doubling, and using $2cs = \sin\beta$ and $2s^2 = 1 - \cos\beta$:

$$
\boldsymbol{\omega} = \Omega\sin\beta\,\hat{\mathbf{m}} - \Omega(1 - \cos\beta)\,\hat{\mathbf{z}}.
$$

Its size is $\Omega\sqrt{\sin^2\beta + (1 - \cos\beta)^2} = \Omega\sqrt{2 - 2\cos\beta} = 2\Omega\sin(\beta/2)$.
:::

### The contradiction

The attitude $\mathbf{q}(t)$ repeats with period $T = 2\pi/\Omega$. After one trip around the cone, the body is back exactly where it started. But add up the body rate over that period:

$$
\int_0^{T}\boldsymbol{\omega}\,dt = \bigl(0,\ 0,\ -2\pi(1 - \cos\beta)\bigr).
$$

The transverse part goes round in a full circle, so it adds up to zero. The axial part never changes, so it adds up to $-\Omega(1 - \cos\beta)$ times $T = 2\pi/\Omega$, which is $-2\pi(1-\cos\beta)$.

So a gyro triad reports a steady $-\Omega(1-\cos\beta)$ about $z$ for as long as the coning lasts — and the vehicle does not rotate about $z$ at all. The gyros are not lying. Each tiny rotation really happens. But tiny rotations about *different* axes do not add up like arrows, and the leftover is exactly this axial term.

::: key Coning motion
When the angular velocity vector itself rotates, finite rotations do not commute, so summing $\boldsymbol{\omega}\Delta t$ misses part of the net rotation — the coning term — and leaves a **[[secular|secular-word]]** attitude error, one that accumulates instead of averaging away. Strapdown algorithms add multi-sample coning-correction terms to recover it.
:::

## Why the sum is wrong: Bortz's equation

To describe how much a body has turned since some starting moment, use the **[[rotation vector|rotation-vector]]** $\boldsymbol{\phi}$ ("phi"): an arrow along the axis of the net turn, as long as the angle turned in radians. If adding rates were right, its rate of change would be $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$. It is not. The correct law is **[[Bortz's equation|bortz-history]]**:

$$
\dot{\boldsymbol{\phi}} = \boldsymbol{\omega} + \tfrac{1}{2}\,\boldsymbol{\phi}\times\boldsymbol{\omega} + \frac{1}{\phi^2}\left[1 - \frac{\phi\sin\phi}{2(1 - \cos\phi)}\right]\boldsymbol{\phi}\times(\boldsymbol{\phi}\times\boldsymbol{\omega}),
$$

with $\phi = \lVert\boldsymbol{\phi}\rVert$, the angle turned so far. Take the three terms in order:

- $\boldsymbol{\omega}$ is the naive answer.
- $\tfrac{1}{2}\boldsymbol{\phi}\times\boldsymbol{\omega}$ is the **coning term**, the leading correction.
- The last term is smaller still. The bracket tends to $1/12$ as $\phi \to 0$, so this term is of size $\phi^2\omega$ against the coning term's $\phi\omega$. Over a short update interval, where $\phi$ is tiny, it is negligible.

The equation tells you exactly when the naive sum is right. If $\boldsymbol{\omega}$ keeps a fixed direction, then $\boldsymbol{\phi}$ grows along that same direction. A cross product of two parallel arrows is zero, so both correction terms vanish and $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$ exactly. That is why a turn about a single axis integrates perfectly at any step size. The error appears only when $\boldsymbol{\omega}$ *changes direction*, and it grows with how fast it does so. That is the whole phenomenon.

::: example One second of cone, and what the sum reports
**The motion.** Take $\beta = 1^\circ$ and $\Omega = 2\pi\,\mathrm{rad/s}$: a one-degree cone, once around every second — a plausible wobble (**nutation**) on a spinning stage.

**The rate size.** One degree is $0.017453\,\mathrm{rad}$, so

$$
\lVert\boldsymbol{\omega}\rVert = 2\Omega\sin(\beta/2) = 2 \times 6.2832 \times \sin(0.5^\circ) = 0.1097\,\mathrm{rad/s} = 6.28^\circ/\mathrm{s},
$$

a very ordinary rate.

**The axial part.** $1 - \cos 1^\circ = 1.5230\times 10^{-4}$, so the axial component is $-\Omega(1 - \cos 1^\circ) = -6.2832 \times 1.5230\times 10^{-4} = -9.570\times 10^{-4}\,\mathrm{rad/s}$. In degrees that is $-0.0548^\circ/\mathrm{s}$, and times $3600$ seconds it is $-197^\circ$ per hour. The gyro output looks like a large, steady, real rotation.

**Over one revolution** the attitude returns exactly to where it began, while $\int\boldsymbol{\omega}\,dt$ reports $0.0548^\circ$ of rotation about the cone axis. Summed naively for an hour: $197^\circ$ of attitude error from a motion that never went anywhere.

**Over a short interval.** Compare the true rotation vector over $\Delta t = 0.1\,\mathrm{s}$ (from $t = 0$) with the plain integral:

| | $x$ (rad) | $y$ (rad) | $z$ (rad) |
| --- | --- | --- | --- |
| True $\boldsymbol{\phi}$ | $-3.33313\times 10^{-3}$ | $1.02583\times 10^{-2}$ | $-8.9523\times 10^{-5}$ |
| $\int\boldsymbol{\omega}\,dt$ | $-3.33311\times 10^{-3}$ | $1.02583\times 10^{-2}$ | $-9.5696\times 10^{-5}$ |

The sideways components agree to five figures. The axial ones differ by $9.5696\times 10^{-5} - 8.9523\times 10^{-5} = 6.17\times 10^{-6}\,\mathrm{rad}$ — about seven percent of that component, all of it the coning term the sum left out.

**Sanity check.** Over one full second the sum was off by the entire axial integral, while over a tenth of a second it was off by only seven percent of it. That fits: the true axial rotation wobbles back to zero each revolution, while the summed one only ever grows.
:::

## Measuring the error, and removing it

A real strapdown algorithm is smarter than one big sum. Each gyro sample gives an **angular increment** $\Delta\boldsymbol{\theta}_k$ ("delta theta sub k") — the integral of the rate over that short sample interval. The algorithm turns each increment into a small rotation and composes it onto the attitude: $\mathbf{q} \leftarrow \mathbf{q}\otimes\exp(\Delta\boldsymbol{\theta}_k/2)$. Here $\exp(\cdot/2)$ is the exponential map, which turns a rotation vector into the matching unit quaternion.

Because the intervals are short, that captures most of the non-commuting effect. Most, not all. What is left shrinks with the square of the sample interval, and it is still secular.

The standard fix is a **multi-sample coning correction**. Take two gyro increments, $\Delta\boldsymbol{\theta}_1$ and $\Delta\boldsymbol{\theta}_2$, inside one attitude update, and combine them as

$$
\boldsymbol{\phi} = \Delta\boldsymbol{\theta}_1 + \Delta\boldsymbol{\theta}_2 + \tfrac{2}{3}\,\Delta\boldsymbol{\theta}_1\times\Delta\boldsymbol{\theta}_2 .
$$

The first two terms are the plain sum. The cross product is a cheap estimate of the missing coning part, $\tfrac{1}{2}\int\boldsymbol{\phi}\times\boldsymbol{\omega}\,dt$, built from the samples you already have. If the two increments point the same way, their cross product is zero and nothing changes — just as Bortz's equation says. Three- and four-sample versions exist with more terms and higher accuracy; the two-sample form is the workhorse.

The code below propagates the $1^\circ$, $1\,\mathrm{Hz}$ cone for $100\,\mathrm{s}$ at several sample rates, with and without the correction, and compares with the true attitude.

```python
import numpy as np

BETA = np.radians(1.0)          # cone half-angle
OMEGA = 2.0 * np.pi             # cone rate, rad/s (one revolution per second)

def qmul(a, b):
    return np.concatenate([[a[0] * b[0] - a[1:] @ b[1:]],
                           a[0] * b[1:] + b[0] * a[1:] + np.cross(a[1:], b[1:])])

def qexp_half(v):
    phi = np.linalg.norm(v)
    if phi < 1e-12:
        return np.array([1.0, 0.0, 0.0, 0.0])
    return np.concatenate([[np.cos(phi / 2)], np.sin(phi / 2) * v / phi])

def q_true(t):
    """Body z axis sweeps a cone of half-angle BETA about inertial z at rate OMEGA."""
    n = np.array([np.cos(OMEGA * t), np.sin(OMEGA * t), 0.0])
    return np.concatenate([[np.cos(BETA / 2)], np.sin(BETA / 2) * n])

def delta_theta(t1, t2):
    """Exact integral of the body rate over [t1, t2] -- what a gyro reports."""
    v = np.sin(BETA) * np.array([np.cos(OMEGA * t2) - np.cos(OMEGA * t1),
                                 np.sin(OMEGA * t2) - np.sin(OMEGA * t1), 0.0])
    v[2] = -OMEGA * (1.0 - np.cos(BETA)) * (t2 - t1)
    return v

def error_deg(qa, qb):
    d = qmul(qa / np.linalg.norm(qa), np.concatenate([[qb[0]], -qb[1:]]))
    return np.degrees(2 * np.arctan2(np.linalg.norm(d[1:]), abs(d[0])))

def propagate(t_end, ts, two_sample):
    q, t = q_true(0.0), 0.0
    for _ in range(int(round(t_end / ts))):
        if two_sample:
            a = delta_theta(t, t + ts / 2)
            b = delta_theta(t + ts / 2, t + ts)
            phi = a + b + (2.0 / 3.0) * np.cross(a, b)
        else:
            phi = delta_theta(t, t + ts)
        q = qmul(q, qexp_half(phi))
        q /= np.linalg.norm(q)
        t += ts
    return error_deg(q, q_true(t_end))

print("  rate      single-sample      two-sample")
for ts in (0.02, 0.01, 0.005, 0.0025):
    one = propagate(100.0, ts, False)
    two = propagate(100.0, ts, True)
    print(f"{1/ts:6.0f} Hz   {one:.4e} deg   {two:.4e} deg")
#   rate      single-sample      two-sample
#     50 Hz   1.4418e-02 deg   2.8464e-06 deg
#    100 Hz   3.6067e-03 deg   1.7796e-07 deg
#    200 Hz   9.0180e-04 deg   1.1124e-08 deg
#    400 Hz   2.2546e-04 deg   7.7724e-10 deg
```

::: example Reading the table
Three things are in those numbers, and each is a design decision.

**Single-sample error is second order in the sample interval.** Halving the interval quarters the error: $1.4418\times 10^{-2} \to 3.6067\times 10^{-3} \to 9.018\times 10^{-4} \to 2.2546\times 10^{-4}$ degrees. Each ratio is $4.000$. To gain a factor of a hundred you must sample ten times faster, since $10^2 = 100$.

**Two-sample error is [[fourth order|order-plot]].** $2.846\times 10^{-6} \to 1.780\times 10^{-7} \to 1.112\times 10^{-8} \to 7.772\times 10^{-10}$ degrees, ratios of $16.0$. The same factor of a hundred costs only a factor of $3.2$ in rate, since $3.2^4 \approx 100$.

**The gain at a fixed rate is enormous.** At $100\,\mathrm{Hz}$ the correction cuts the error by $3.6067\times 10^{-3} / 1.7796\times 10^{-7} \approx 20\,000$ times, for one cross product per update. At $400\,\mathrm{Hz}$ the factor is about $290\,000$.

**The error is purely secular.** Running the single-sample algorithm at $100\,\mathrm{Hz}$ for $10$, $20$, $50$, $100$ and $200$ seconds gives $3.607\times 10^{-4}$, $7.213\times 10^{-4}$, $1.803\times 10^{-3}$, $3.607\times 10^{-3}$ and $7.213\times 10^{-3}$ degrees. Double the time, double the error — exactly linear. That is a constant drift rate: $3.607\times 10^{-3}$ degrees per $100\,\mathrm{s}$, times $36$, is $0.1298^\circ$ per hour. It is a bias, not noise, and no amount of averaging removes it.
:::

## The drift formula

For this coning motion, the drift rate $\dot{\varepsilon}$ ("epsilon dot") of a single-sample algorithm with sample interval $T_s$ has a closed form:

$$
\dot{\varepsilon} = \Omega\,(1 - \cos\beta)\left[1 - \frac{\sin\Omega T_s}{\Omega T_s}\right] \;\approx\; \frac{\Omega^3\beta^2 T_s^2}{12}.
$$

The approximation holds when $\Omega T_s \ll 1$ and $\beta$ is small. It comes from two small-angle facts: $1 - \cos\beta \approx \beta^2/2$, and $1 - \sin x/x \approx x^2/6$. Multiply $\Omega \cdot \tfrac{\beta^2}{2} \cdot \tfrac{\Omega^2 T_s^2}{6}$ and you get $\Omega^3\beta^2T_s^2/12$.

Check it against the simulation. With $\Omega = 2\pi$, $\beta = 1^\circ$ and $T_s = 0.01\,\mathrm{s}$, the exact expression gives $6.295\times 10^{-7}\,\mathrm{rad/s}$. Times $3600$ and converted to degrees, that is $0.1298^\circ/\mathrm{h}$ — matching the simulation to four figures. The approximation gives $0.1299^\circ/\mathrm{h}$.

Three scalings to remember. The drift grows as the **square** of the cone half-angle, the **cube** of the cone frequency, and the **square** of the sample interval. So fast, small coning is far worse than its size suggests — and fast, small motion is exactly what vibration is.

::: example Vibration-induced coning on a launch vehicle
**The motion.** An inertial measurement unit sits on a vibrating structure that couples two rotation axes, so the unit's case cones at $20\,\mathrm{Hz}$ with a half-angle of $0.05^\circ$. In radians: $\Omega = 2\pi \times 20 = 125.7\,\mathrm{rad/s}$ and $\beta = 0.05 \times \pi/180 = 8.73\times 10^{-4}\,\mathrm{rad}$. The body rate has size $2\Omega\sin(\beta/2) = 0.110\,\mathrm{rad/s} = 6.3^\circ/\mathrm{s}$ — visible on a gyro trace, and entirely unremarkable.

**The drift.** Sampled at $400\,\mathrm{Hz}$, $T_s = 2.5\,\mathrm{ms}$, so $\Omega T_s = 125.7 \times 0.0025 = 0.314$. Also $1 - \cos\beta = 3.808\times 10^{-7}$. Then

$$
\dot{\varepsilon} = 125.7 \times 3.808\times 10^{-7} \times \left[1 - \frac{\sin 0.3142}{0.3142}\right] = 7.832\times 10^{-7}\,\mathrm{rad/s} = 0.161^\circ/\mathrm{h}.
$$

**Against the instrument.** A navigation-grade ring laser gyro has a **[[bias stability|gyro-grades]]** of $0.001$ to $0.01^\circ/\mathrm{h}$; a tactical-grade unit, $1$ to $10^\circ/\mathrm{h}$. Divide: $0.161/0.01 = 16$ and $0.161/0.001 = 161$. On a navigation-grade unit, coning from a vibration you can barely see is sixteen to a hundred and sixty times the gyro's own bias. It would dominate the error budget, and it would be blamed on the gyro.

**Two responses, and you need both.** Add the two-sample coning correction, which at these numbers removes the great majority of it. And sample faster: because the drift goes as $T_s^2$, doubling to $800\,\mathrm{Hz}$ alone cuts the uncorrected drift by four, to about $0.04^\circ/\mathrm{h}$. This is why strapdown units run their coning sums at a high rate — often $1$ to $10\,\mathrm{kHz}$ — and update the attitude quaternion much less often. The quaternion update is the expensive part and the cross product is cheap, so you do the cheap thing often and the expensive thing rarely.
:::

::: warning Coning is not an integrator accuracy problem
The instinctive fix — a higher-order integrator, a smaller step — helps a little, and it is the wrong lever. The error is not the usual truncation error of a smooth curve. It comes from treating a non-commuting composition of rotations as a vector sum. A fourth-order Runge–Kutta applied to $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$ is still integrating the wrong equation. The right lever is the algorithm: use the exponential update, add the coning term, and only then, if you need more, sample faster.
:::

::: note Sculling, and its relatives
Rotation has coning; velocity has **sculling**. When a vehicle's acceleration and its attitude wobble together — a vibrating structure again — the naive integral of body-frame acceleration misses a small one-way term, and the result is a secular *velocity* error. The correction has the same shape: a cross product between the integrated acceleration increment and the angular increment, summed at a high rate. The position channel has a third relative called scrolling. All three have the same source, all three are secular, and all three are standard parts of a strapdown navigation algorithm. The rotational one belongs to attitude kinematics, which is why it is here.
:::

::: warning An algorithm cannot fix what the gyro did not measure
Coning corrections assume the gyro reports the true increment $\int\boldsymbol{\omega}\,dt$ over each sample. Real instruments have limited bandwidth. If the coning frequency approaches or passes the gyro's own bandwidth, the sideways motion is shrunk and delayed before the algorithm ever sees it, and no software can recover the truth. That is why mechanical design — mounting stiffness, vibration isolation, keeping the unit away from the points of a structure that shake most — is part of the attitude accuracy problem, not separate from it.
:::

## Check yourself

::: check
A body cones at half-angle $\beta = 2^\circ$ and $\Omega = 5\,\mathrm{rad/s}$. What steady gyro output appears along the cone axis? What is the true rotation about that axis after ten cone revolutions?
:::

::: answer
The axial component of the body rate is $-\Omega(1 - \cos\beta)$. With $1 - \cos 2^\circ = 6.0917\times 10^{-4}$:

$$
-5 \times 6.0917\times 10^{-4} = -3.046\times 10^{-3}\,\mathrm{rad/s},
$$

which is $-0.1745^\circ/\mathrm{s}$, or about $-628^\circ$ per hour. A gyro on that axis reports a steady, sizable rate.

The true rotation about the cone axis after ten revolutions is **zero**. The attitude repeats every $2\pi/\Omega$, so after any whole number of revolutions the body is exactly back where it started. Integrating the gyro would instead report $10 \times 2\pi(1 - \cos 2^\circ) = 3.827\times 10^{-2}\,\mathrm{rad} = 2.19^\circ$ of rotation that never happened.

This is the cleanest statement of why $\int\boldsymbol{\omega}\,dt$ is not an attitude. The rate is honest, the adding-up is honest arithmetic, and the answer is still wrong, because rotations do not add like vectors.
:::

::: check
Using Bortz's equation, explain why a vehicle turning steadily about one fixed body axis has no coning error at any sample rate.
:::

::: answer
Bortz's equation is

$$
\dot{\boldsymbol{\phi}} = \boldsymbol{\omega} + \tfrac{1}{2}\boldsymbol{\phi}\times\boldsymbol{\omega} + \frac{1}{\phi^2}\left[1 - \frac{\phi\sin\phi}{2(1-\cos\phi)}\right]\boldsymbol{\phi}\times(\boldsymbol{\phi}\times\boldsymbol{\omega}).
$$

Let $\boldsymbol{\omega}$ keep a constant direction $\hat{\mathbf{u}}$, and start from $\boldsymbol{\phi}(0) = \mathbf{0}$. At the start the cross products are zero, so $\dot{\boldsymbol{\phi}}$ points along $\hat{\mathbf{u}}$ and $\boldsymbol{\phi}$ grows along $\hat{\mathbf{u}}$. Once $\boldsymbol{\phi}$ is parallel to $\boldsymbol{\omega}$, both cross-product terms are zero for all later time. The equation collapses to $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$, and the plain integral is exact.

In practice: a vehicle spinning about a body-fixed axis, however fast, needs no coning correction. A vehicle turning slowly but changing the *direction* of its turn does. Coning error is driven by how fast the rate vector changes direction, not by how big the rate is.
:::

::: check
At $100\,\mathrm{Hz}$, a single-sample algorithm has $3.607\times 10^{-3}$ degrees of error after $100\,\mathrm{s}$ of some coning motion. Estimate the error at $25\,\mathrm{Hz}$ and at $1\,\mathrm{kHz}$. What would the two-sample algorithm give at $25\,\mathrm{Hz}$, given it has $1.780\times 10^{-7}$ degrees at $100\,\mathrm{Hz}$?
:::

::: answer
Single-sample error scales as $T_s^2$. Going from $100\,\mathrm{Hz}$ to $25\,\mathrm{Hz}$ makes $T_s$ four times longer, so the error grows by $4^2 = 16$: $3.607\times 10^{-3} \times 16 = 5.77\times 10^{-2}$ degrees. Going to $1\,\mathrm{kHz}$ makes $T_s$ ten times shorter, so the error falls by $10^2 = 100$: $3.61\times 10^{-5}$ degrees.

Two-sample error scales as $T_s^4$. Dropping to $25\,\mathrm{Hz}$ multiplies it by $4^4 = 256$: $1.780\times 10^{-7} \times 256 \approx 4.6\times 10^{-5}$ degrees.

So the two-sample algorithm at $25\,\mathrm{Hz}$ is about as accurate as the single-sample one at $1\,\mathrm{kHz}$, at a fortieth of the rate. Trading processor time for a cross product is the whole point of coning corrections.

One caution: the $T_s^2$ and $T_s^4$ laws hold only while $\Omega T_s$ is small. For a $1\,\mathrm{Hz}$ cone, $25\,\mathrm{Hz}$ sampling is still safe; the same extrapolation for a $20\,\mathrm{Hz}$ cone would not be.
:::

::: check
An IMU shows an unexplained attitude drift of $0.2^\circ/\mathrm{h}$ about one axis, but only while the engines are running. What would you check first, and what measurements would settle it?
:::

::: answer
Engine-linked drift about one axis is the signature of vibration-induced coning. Combustion and turbopump vibration shakes structural modes. If two rotation axes of the sensor mount move at the same frequency, out of step with each other, the case cones, and the attitude algorithm builds up a secular error along the cone axis. The size fits: $0.2^\circ/\mathrm{h}$ is what a tens-of-hertz, hundredths-of-a-degree cone produces.

To settle it:

- Record the raw gyro output at full rate during a burn. Look for two sideways channels oscillating at the same frequency, a quarter-cycle apart. That is a cone, and the axis it circles is the axis showing the drift.
- Compute the predicted drift from $\Omega(1-\cos\beta)[1 - \sin(\Omega T_s)/(\Omega T_s)]$ with the measured $\Omega$ and $\beta$, and compare with the observed rate.
- If they match, the fix is a coning correction, a higher sample rate, or both. Test it by reprocessing the *same* recorded data through the corrected algorithm. The drift should mostly vanish — far stronger evidence than a gyro swap that happens to coincide with a quieter engine run.

The alternatives fit less well. A gyro scale-factor error under vibration would depend on the rate size rather than build steadily, and a bias that depends on acceleration would track thrust level rather than the vibration spectrum.
:::

::: check
Why do strapdown systems sum coning increments at a high rate but update the attitude quaternion at a lower one?
:::

::: answer
Because the two jobs have very different costs and very different accuracy needs.

Summing the increments is cheap: add up the gyro output and do one cross product per sample. Its accuracy improves as $T_s^2$ or better, so running it fast is cheap and effective. The attitude update is the expensive part: an exponential map with sines and cosines, a quaternion product, a renormalization, and in a full navigator the matching frame changes for velocity and position.

So the design splits them. A fast loop, often $1$ to $10\,\mathrm{kHz}$, integrates the gyro and keeps the running rotation vector with its coning correction. A slower loop, perhaps $100$ to $400\,\mathrm{Hz}$, turns that vector into a quaternion update, applies it and renormalizes. You get the non-commuting accuracy of the fast rate at the computing cost of the slow one — the same trade the two-sample correction makes, taken one step further.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Coning | The angular velocity vector rotates; its direction changes, not necessarily its size |
| $\boldsymbol{\omega} = \Omega\sin\beta\,\hat{\mathbf{m}} - \Omega(1-\cos\beta)\hat{\mathbf{z}}$ | Body rate for a cone of half-angle $\beta$ at rate $\Omega$ |
| $\lVert\boldsymbol{\omega}\rVert = 2\Omega\sin(\beta/2)$ | Constant size; the direction is what rotates |
| $\int_0^T\boldsymbol{\omega}\,dt = (0,0,-2\pi(1-\cos\beta))$ | Nonzero over a full revolution, though the attitude repeats |
| $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega} + \tfrac{1}{2}\boldsymbol{\phi}\times\boldsymbol{\omega} + \cdots$ | Bortz's equation; the cross term is the coning term |
| $\boldsymbol{\phi} = \Delta\boldsymbol{\theta}_1 + \Delta\boldsymbol{\theta}_2 + \tfrac{2}{3}\Delta\boldsymbol{\theta}_1\times\Delta\boldsymbol{\theta}_2$ | Two-sample coning correction |
| $\dot{\varepsilon} = \Omega(1-\cos\beta)\bigl[1 - \sin(\Omega T_s)/(\Omega T_s)\bigr] \approx \Omega^3\beta^2T_s^2/12$ | Single-sample drift rate |
| Scaling | Single-sample error $\propto T_s^2$; two-sample $\propto T_s^4$; drift $\propto \beta^2\Omega^3$ |
| Worked cone | $1^\circ$ at $1\,\mathrm{Hz}$, $100\,\mathrm{Hz}$ sampling: $0.1298^\circ/\mathrm{h}$, cut $20\,000\times$ by two-sample |
| Vibration case | $0.05^\circ$ at $20\,\mathrm{Hz}$, $400\,\mathrm{Hz}$ sampling: $0.161^\circ/\mathrm{h}$, above navigation-grade gyro bias |
| Sculling | The velocity-channel relative; same origin, same cure |

That closes the module. You began with four kinematic differential equations, joined them to Euler's dynamics into a rotational six-state system, learned which conserved quantity really tests that joint, added the four environmental torques and the three families of actuator, and finished with the error that remains after every actuator and integrator has done its job correctly. The exercises now ask you to build the propagator, add wheels and audit the momentum, and size a launch vehicle's gimbal against the atmosphere.

::: context non-commuting Order matters for turns
Hold a book flat, face up. Tip it $90^\circ$ toward you, then turn it $90^\circ$ to the right. Start again, and do the same two turns in the other order. The book ends up in two different positions. For big turns, order matters — mathematicians say rotations do not **commute**. For tiny turns the difference is tiny, but it is never exactly zero, and a gyro makes hundreds of tiny turns a second. Coning is what those tiny differences add up to when the turns keep changing direction.
:::

::: context strapdown-word Bolted down instead of floating
Older inertial navigators kept their gyros on a platform inside a set of gimbals, held level while the vehicle rotated around it — the Apollo guidance system worked this way. A **strapdown** system bolts the gyros straight to the vehicle and does the bookkeeping in software instead. It is smaller, cheaper and more reliable, and it is what almost every modern rocket, aircraft and phone uses. The price is that the software must add up rotations correctly — which is what this lesson is about.
:::

::: context cone-picture The shape the axis traces
The body's $z$ axis (blue) leans at the half-angle $\beta$ from a fixed center line — the angle between the center line and the cone's edge — and circles it at rate $\Omega$. The tip traces the rim of a cone. The angle here is drawn much larger than the $1^\circ$ in the examples so you can see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="160" x2="180" y2="15" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="180" y1="160" x2="120" y2="45" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="160" x2="240" y2="45" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="45" rx="60" ry="14" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="160" x2="222.4" y2="54.9" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="222.4,54.9 222.5,67.9 213.3,64.1" fill="#1d6fd1"/>
  <path d="M 180 120 A 40 40 0 0 1 198.5 124.5" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="190" y="112" font-size="12" fill="#b4232c">β</text>
  <polygon points="155.9,32.1 146.5,37.4 145.5,29.4" fill="#1f2a44"/>
  <text x="130" y="22" font-size="12" fill="#1f2a44">Ω (goes around)</text>
  <text x="186" y="14" font-size="11" fill="#6c7a93">fixed center line</text>
  <text x="232" y="92" font-size="12" fill="#1d6fd1">body z axis</text>
</svg>
```

A wobbling spinning top does the same thing with its handle.
:::

::: context rate-components What the three gyros see
For a cone, the two sideways gyro channels trace equal waves a quarter-cycle apart (blue and orange), while the axial channel (red) sits at a small, constant negative value. The red line is exaggerated here: for a $1^\circ$ cone it is about $0.0087$ times the wave height.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="70" x2="345" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="40.0,70.0 50.0,80.8 60.0,90.6 70.0,98.3 80.0,103.3 90.0,105.0 100.0,103.3 110.0,98.3 120.0,90.6 130.0,80.8 140.0,70.0 150.0,59.2 160.0,49.4 170.0,41.7 180.0,36.7 190.0,35.0 200.0,36.7 210.0,41.7 220.0,49.4 230.0,59.2 240.0,70.0 250.0,80.8 260.0,90.6 270.0,98.3 280.0,103.3 290.0,105.0 300.0,103.3 310.0,98.3 320.0,90.6 330.0,80.8 340.0,70.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="40.0,35.0 50.0,36.7 60.0,41.7 70.0,49.4 80.0,59.2 90.0,70.0 100.0,80.8 110.0,90.6 120.0,98.3 130.0,103.3 140.0,105.0 150.0,103.3 160.0,98.3 170.0,90.6 180.0,80.8 190.0,70.0 200.0,59.2 210.0,49.4 220.0,41.7 230.0,36.7 240.0,35.0 250.0,36.7 260.0,41.7 270.0,49.4 280.0,59.2 290.0,70.0 300.0,80.8 310.0,90.6 320.0,98.3 330.0,103.3 340.0,105.0" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="40" y1="80" x2="340" y2="80" stroke="#b4232c" stroke-width="2.5"/>
  <text x="44" y="20" font-size="12" fill="#1f2a44">ωx (blue), ωy (orange), ωz (red)</text>
  <text x="344" y="130" font-size="11" fill="#1f2a44" text-anchor="end">time: 1.5 cone revolutions</text>
</svg>
```

Averaged over a revolution, the waves give zero and the red line does not. That leftover is the phantom rotation.
:::

::: context secular-word A word from astronomy
**Secular** comes from the Latin *saeculum*, "an age" or "a lifetime". Astronomers used it for slow changes in orbits that keep going the same way for centuries, as opposed to *periodic* changes that swing back and forth. In navigation it means an error that grows steadily with time. A periodic error you can often average away; a secular one only gets worse the longer you fly.
:::

::: context rotation-vector An arrow for a whole turn
Any change of orientation, however complicated the path, can be matched by a single turn about one fixed axis. The rotation vector packs that turn into one arrow: it points along the axis, and its length is the angle in radians. So a quarter-turn about the vertical is an arrow pointing up, $\pi/2 \approx 1.57$ long. It is the natural thing to build up over a short update interval, and the exponential map turns it into a quaternion.
:::

::: context bortz-history Where the equation comes from
John Bortz published this equation in 1971, in a paper in the *IEEE Transactions on Aerospace and Electronic Systems* on a new way to formulate strapdown navigation. His idea was to split the job: integrate the rotation vector quickly with its correction terms, and update the attitude itself more slowly. Nearly every strapdown algorithm since, including the coning corrections in this lesson, is built on that split. Paul Savage's two-volume *Strapdown Analytics* treats the whole family at length.
:::

::: context order-plot Second order against fourth order
On a log-log plot, error against sample rate is a straight line, and its steepness is the order. The single-sample line (red) falls two decades for every decade of rate; the two-sample line (blue) falls four. These are the points from the table.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="15" x2="50" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="155" x2="345" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="34">10⁻²</text><text x="45" y="64">10⁻⁴</text><text x="45" y="94">10⁻⁶</text><text x="45" y="124">10⁻⁸</text>
  </g>
  <g stroke="#6c7a93" stroke-width="0.5">
    <line x1="50" y1="30" x2="345" y2="30"/><line x1="50" y1="60" x2="345" y2="60"/><line x1="50" y1="90" x2="345" y2="90"/><line x1="50" y1="120" x2="345" y2="120"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="170">50 Hz</text><text x="150" y="170">100</text><text x="240" y="170">200</text><text x="330" y="170">400</text>
  </g>
  <polyline points="60,27.6 150,36.6 240,45.7 330,54.7" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="60,83.2 150,101.2 240,119.3 330,136.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="60" cy="27.6" r="3"/><circle cx="150" cy="36.6" r="3"/><circle cx="240" cy="45.7" r="3"/><circle cx="330" cy="54.7" r="3"/></g>
  <g fill="#1d6fd1"><circle cx="60" cy="83.2" r="3"/><circle cx="150" cy="101.2" r="3"/><circle cx="240" cy="119.3" r="3"/><circle cx="330" cy="136.6" r="3"/></g>
  <text x="200" y="28" font-size="11" fill="#b4232c">single-sample: ÷4 per doubling</text>
  <text x="150" y="80" font-size="11" fill="#1d6fd1">two-sample: ÷16 per doubling</text>
</svg>
```

Error is in degrees after $100\,\mathrm{s}$; each step right doubles the rate.
:::

::: context gyro-grades How good is a good gyro?
A gyro's **bias** is the small rate it reports when the vehicle is not turning at all; **bias stability** is how steady that false rate stays. Roughly: navigation-grade units, used in airliners and launch vehicles, hold $0.001$ to $0.01^\circ/\mathrm{h}$. Tactical-grade units, used in missiles and drones, hold $1$ to $10^\circ/\mathrm{h}$. The cheap gyro in a phone can drift by tens of degrees per hour or more. A navigation-grade gyro at $0.01^\circ/\mathrm{h}$ would take more than four years to drift a full turn — which is why a software error of $0.16^\circ/\mathrm{h}$ is a disaster for it.
:::
