---
id: l10-coning-motion-and-coning-correction
title: Coning motion and coning correction
minutes: 20
covers:
  - coning motion and coning correction
---

The first lesson of this module made a claim and postponed the evidence: there is no vector whose time derivative is the angular velocity, so integrating $\boldsymbol{\omega}$ component by component is not a way to get attitude. This lesson is the evidence, and it is not an abstract objection. The error has a name, a formula, a magnitude that competes with navigation-grade gyro bias, and a standard fix that every strapdown inertial navigation system implements.

The name is **coning**. It appears whenever the angular velocity vector itself rotates — when the body is not turning steadily about one fixed axis but sweeping that axis around. A spin-stabilised satellite nutating, a launch vehicle vibrating at a structural mode, a missile rolling while pitching, a helicopter rotor hub: all cone. And because finite rotations do not commute, an algorithm that accumulates $\boldsymbol{\omega}\,\Delta t$ and treats the sum as a rotation misses part of the motion. The miss does not average away over a cycle. It accumulates, one way, forever.

The reason this matters in practice rather than in principle is vibration. A gyro on a launch vehicle sees structural motion at tens of hertz with amplitudes of hundredths of a degree — far too small to see on a plot, and quite enough to produce tenths of a degree per hour of attitude drift if the attitude algorithm is naive. The fix costs a cross product per sample.

## What coning is

Take a body whose $z$ axis sweeps a cone of half-angle $\beta$ about a fixed inertial direction, going round at rate $\Omega$. The attitude is a rotation by $\beta$ about an axis that itself rotates:

$$
\mathbf{q}(t) = \Bigl[\cos\tfrac{\beta}{2},\ \ \hat{\mathbf{n}}(t)\sin\tfrac{\beta}{2}\Bigr],
\qquad \hat{\mathbf{n}}(t) = (\cos\Omega t,\ \sin\Omega t,\ 0).
$$

Differentiate and solve $\dot{\mathbf{q}} = \tfrac{1}{2}\mathbf{q}\otimes[0,\boldsymbol{\omega}]$ for the body rate. Writing $c = \cos(\beta/2)$, $s = \sin(\beta/2)$ and $\hat{\mathbf{m}} = (-\sin\Omega t, \cos\Omega t, 0)$, the algebra gives

$$
\boldsymbol{\omega}(t) = \Omega\sin\beta\;\hat{\mathbf{m}}(t) \;-\; \Omega\,(1 - \cos\beta)\,\hat{\mathbf{z}} .
$$

Read that carefully, because everything follows from it. The rate has **constant magnitude** $\lVert\boldsymbol{\omega}\rVert = 2\Omega\sin(\beta/2)$, a transverse part that rotates steadily in the body frame at rate $\Omega$, and — the crucial term — a **constant component along the cone axis**, $-\Omega(1 - \cos\beta)$.

Now notice the contradiction. The attitude $\mathbf{q}(t)$ is periodic with period $T = 2\pi/\Omega$: after one cone revolution the body is back exactly where it started. But the integral of the body rate over that period is not zero:

$$
\int_0^{T}\boldsymbol{\omega}\,dt = \bigl(0,\ 0,\ -2\pi(1 - \cos\beta)\bigr).
$$

The transverse part integrates to zero, and the axial part does not. A gyro triad reports a steady $-\Omega(1-\cos\beta)$ about $z$ for as long as the coning lasts, and the vehicle does not rotate about $z$ at all.

::: key Coning motion
When the angular velocity vector itself rotates, finite rotations do not commute, so summing $\boldsymbol{\omega}\Delta t$ under-reports the true rotation by the coning term and leaves a **secular** attitude error — one that accumulates rather than averaging away. Strapdown algorithms add multi-sample coning-correction terms to recover it.
:::

## Why the sum is wrong: Bortz's equation

The correct relationship between the body rate and the rotation vector $\boldsymbol{\phi}$ that accumulates over an interval is not $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$. It is Bortz's equation:

$$
\dot{\boldsymbol{\phi}} = \boldsymbol{\omega} + \tfrac{1}{2}\,\boldsymbol{\phi}\times\boldsymbol{\omega} + \frac{1}{\phi^2}\left[1 - \frac{\phi\sin\phi}{2(1 - \cos\phi)}\right]\boldsymbol{\phi}\times(\boldsymbol{\phi}\times\boldsymbol{\omega}),
$$

with $\phi = \lVert\boldsymbol{\phi}\rVert$. The first term is the naive answer. The second, $\tfrac{1}{2}\boldsymbol{\phi}\times\boldsymbol{\omega}$, is the **coning term** and is the leading correction; the third is third order in $\phi$ and negligible over a short update interval. The bracket tends to $1/12$ as $\phi\to 0$, so the third term is $O(\phi^2\omega)$ against the second's $O(\phi\omega)$.

The structure says exactly when the naive sum is right. If $\boldsymbol{\omega}$ keeps a fixed direction, then $\boldsymbol{\phi}$ is parallel to it, every cross product vanishes, and $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$ exactly — which is why a single-axis rotation integrates perfectly at any step size. The error appears only when $\boldsymbol{\omega}$ *changes direction*, and it is proportional to how fast it does so. That is the whole phenomenon.

::: example One second of cone, and what the sum reports
Take $\beta = 1^\circ$ and $\Omega = 2\pi\,\mathrm{rad/s}$, a one-degree cone going round once a second — a plausible nutation on a spinning stage. Then

$$
\lVert\boldsymbol{\omega}\rVert = 2\Omega\sin(\beta/2) = 0.1097\,\mathrm{rad/s} = 6.28^\circ/\mathrm{s},
$$

a very ordinary rate. The axial component is $-\Omega(1 - \cos 1^\circ) = -9.570\times 10^{-4}\,\mathrm{rad/s} = -0.0548^\circ/\mathrm{s}$, which is $-197^\circ$ per hour: a gyro output that looks like a large, steady, real rotation.

Over one cone revolution the attitude returns exactly to its starting value, while $\int\boldsymbol{\omega}\,dt$ reports $0.0548^\circ$ of rotation about the cone axis. Summed naively for an hour, that is $197^\circ$ of attitude error from a motion that never went anywhere.

Compare the rotation vector over a short interval with the plain integral, to see the miss directly. Over $\Delta t = 0.1\,\mathrm{s}$ starting at $t = 0$, the exact rotation vector from the true attitudes is $(-3.33313\times 10^{-3},\ 1.02583\times 10^{-2},\ -8.9523\times 10^{-5})\,\mathrm{rad}$, while $\int\boldsymbol{\omega}\,dt = (-3.33311\times 10^{-3},\ 1.02583\times 10^{-2},\ -9.5696\times 10^{-5})$. The transverse components agree to five figures. The axial components differ by $6.17\times 10^{-6}\,\mathrm{rad}$ — seven per cent of that component, all of it in the coning term the sum left out.
:::

## Measuring the error, and killing it

A real strapdown algorithm does better than summing over an hour. It takes the gyro's integrated increment $\Delta\boldsymbol{\theta}_k$ over each sample interval and composes an exponential update, $\mathbf{q} \leftarrow \mathbf{q}\otimes\exp(\Delta\boldsymbol{\theta}_k/2)$, which captures most of the non-commutativity because the intervals are short. Most, not all: what is left is second order in the sample interval and still secular.

The standard fix is a **multi-sample coning correction**. With two gyro samples $\Delta\boldsymbol{\theta}_1$ and $\Delta\boldsymbol{\theta}_2$ inside one attitude update interval, use

$$
\boldsymbol{\phi} = \Delta\boldsymbol{\theta}_1 + \Delta\boldsymbol{\theta}_2 + \tfrac{2}{3}\,\Delta\boldsymbol{\theta}_1\times\Delta\boldsymbol{\theta}_2 ,
$$

the cross product being a discrete estimate of $\tfrac{1}{2}\int\boldsymbol{\phi}\times\boldsymbol{\omega}\,dt$. Three- and four-sample versions exist with more coefficients and higher order; the two-sample form is the workhorse.

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

**The single-sample error is second order in the sample interval.** Halving the interval quarters the error: $1.4418\times 10^{-2} \to 3.6067\times 10^{-3} \to 9.018\times 10^{-4} \to 2.2546\times 10^{-4}$ degrees, ratios of exactly $4.000$. To buy a factor of a hundred you must sample ten times faster.

**The two-sample error is fourth order.** $2.846\times 10^{-6} \to 1.780\times 10^{-7} \to 1.112\times 10^{-8} \to 7.772\times 10^{-10}$, ratios of $16.0$. The same factor of a hundred costs a factor of $3.2$ in rate.

**The improvement at a fixed rate is enormous.** At $100\,\mathrm{Hz}$ the correction reduces the error by a factor of $20\,000$, for the cost of one cross product per update. At $400\,\mathrm{Hz}$ it is a factor of $290\,000$.

The error is also purely secular. Running the single-sample algorithm at $100\,\mathrm{Hz}$ for $10$, $20$, $50$, $100$ and $200$ seconds gives $3.607\times 10^{-4}$, $7.213\times 10^{-4}$, $1.803\times 10^{-3}$, $3.607\times 10^{-3}$ and $7.213\times 10^{-3}$ degrees — exactly linear in time, a constant drift rate of $0.1298^\circ$ per hour. It is a bias, not a noise, and no amount of averaging removes it.
:::

## The drift formula

For the coning motion above, the drift rate of a single-sample algorithm with sample interval $T_s$ has a closed form:

$$
\dot{\varepsilon} = \Omega\,(1 - \cos\beta)\left[1 - \frac{\sin\Omega T_s}{\Omega T_s}\right] \;\approx\; \frac{\Omega^3\beta^2 T_s^2}{12},
$$

the approximation holding for $\Omega T_s \ll 1$ and small $\beta$. Check it against the measurement: with $\Omega = 2\pi$, $\beta = 1^\circ$ and $T_s = 0.01\,\mathrm{s}$, the exact expression gives $6.295\times 10^{-7}\,\mathrm{rad/s} = 0.1298^\circ/\mathrm{h}$, matching the simulation to four figures, and the approximation gives $0.1299^\circ/\mathrm{h}$.

Three scalings to remember: the drift goes as the **square** of the cone half-angle, as the **cube** of the cone frequency, and as the **square** of the sample interval. High-frequency, small-amplitude coning is therefore far worse than the amplitude suggests — which is exactly what vibration is.

::: example Vibration-induced coning on a launch vehicle
An inertial measurement unit is mounted on a structure that vibrates, coupling two rotational axes so that the case cones at $20\,\mathrm{Hz}$ with a half-angle of $0.05^\circ$. That is $\Omega = 125.7\,\mathrm{rad/s}$ and $\beta = 8.73\times 10^{-4}\,\mathrm{rad}$, and the resulting body rate has magnitude $2\Omega\sin(\beta/2) = 0.110\,\mathrm{rad/s} = 6.3^\circ/\mathrm{s}$ — visible on a gyro trace but entirely unremarkable.

Sampled at $400\,\mathrm{Hz}$, so $T_s = 2.5\,\mathrm{ms}$ and $\Omega T_s = 0.314$, the exact formula gives

$$
\dot{\varepsilon} = 125.7 \times 3.808\times 10^{-7} \times \left[1 - \frac{\sin 0.3142}{0.3142}\right] = 7.832\times 10^{-7}\,\mathrm{rad/s} = 0.161^\circ/\mathrm{h}.
$$

Put that against the instrument. A navigation-grade ring laser gyro has a bias stability of $0.001$ to $0.01^\circ/\mathrm{h}$; a tactical-grade unit $1$ to $10^\circ/\mathrm{h}$. So on a navigation-grade unit the coning error from a vibration you can barely see is between sixteen and a hundred and sixty times the gyro's own bias — it would completely dominate the error budget, and it would be blamed on the gyro.

Two responses, and you need both. Add the two-sample coning correction, which at these parameters removes the great majority of it. And sample faster: since the drift goes as $T_s^2$, doubling to $800\,\mathrm{Hz}$ would cut the uncorrected drift by four on its own. This is why strapdown units run their coning accumulation at a high rate — often 1 to 10 kHz — and update the attitude quaternion at a much lower one. The expensive part is the quaternion update; the cross product is cheap, so you do the cheap thing often and the expensive thing rarely.
:::

::: warning Coning is not an integrator accuracy problem
The instinctive fix — a higher-order integrator, a smaller step — helps, at second order, and it is the wrong lever. The error is not truncation of a smooth function; it is a structural consequence of treating a non-commutative composition as a vector sum. A fourth-order Runge–Kutta applied to $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$ is still integrating the wrong equation. The right lever is the algorithm: use the exponential update, and add the coning term. Then, if you still need more, sample faster.
:::

::: note Sculling, and its relatives
Rotation has coning; velocity has **sculling**. When a vehicle's specific force and its attitude oscillate together — a vibrating structure again — the naive integral of body-frame acceleration misses a rectification term, and the result is a secular *velocity* error. The correction has the same shape: a cross product between the integrated acceleration increment and the integrated angular increment, accumulated at high rate. The position channel has a third relative called scrolling. All three come from the same source, all three are secular, and all three are standard content in a strapdown navigation algorithm. The rotational one is the one that shows up in attitude kinematics, which is why it is here.
:::

::: warning An algorithm cannot fix what the gyro did not measure
Coning corrections assume the gyro reports the true integrated angular increment $\int\boldsymbol{\omega}\,dt$ over each sample interval. Real instruments have bandwidth, and if the coning frequency approaches or exceeds the gyro's own bandwidth, the transverse motion is attenuated and phase-shifted before the algorithm ever sees it. No amount of software then recovers the truth. That is why the mechanical design — mounting stiffness, isolation, the placement of the unit relative to structural antinodes — is part of the attitude accuracy problem, not separate from it.
:::

## Check yourself

::: check
A body cones at $\beta = 2^\circ$ half-angle and $\Omega = 5\,\mathrm{rad/s}$. What steady gyro output appears along the cone axis, and what is the true rotation about that axis after ten cone revolutions?
:::

::: answer
The axial component of the body rate is $-\Omega(1 - \cos\beta) = -5(1 - \cos 2^\circ) = -5(6.0917\times 10^{-4}) = -3.046\times 10^{-3}\,\mathrm{rad/s}$, which is $-0.1745^\circ/\mathrm{s}$ or $-628^\circ$ per hour. A gyro on that axis reports a steady, substantial rate.

The true rotation about the cone axis after ten revolutions is **zero**. The attitude is periodic with period $2\pi/\Omega$, so after any whole number of revolutions the body is exactly back where it started. Integrating the gyro output instead would report $10 \times 2\pi(1 - \cos 2^\circ) = 3.827\times 10^{-2}\,\mathrm{rad} = 2.19^\circ$ of rotation that did not happen.

This is the cleanest statement of why $\int\boldsymbol{\omega}\,dt$ is not an attitude: the body rate is honest, the integral is honest arithmetic, and the answer is wrong because rotations do not add like vectors.
:::

::: check
Explain, from Bortz's equation, why a vehicle rotating steadily about a single fixed body axis has no coning error at any sample rate.
:::

::: answer
Bortz's equation is

$$
\dot{\boldsymbol{\phi}} = \boldsymbol{\omega} + \tfrac{1}{2}\boldsymbol{\phi}\times\boldsymbol{\omega} + \frac{1}{\phi^2}\left[1 - \frac{\phi\sin\phi}{2(1-\cos\phi)}\right]\boldsymbol{\phi}\times(\boldsymbol{\phi}\times\boldsymbol{\omega}).
$$

If $\boldsymbol{\omega}$ has a constant direction $\hat{\mathbf{u}}$, start from $\boldsymbol{\phi}(0) = \mathbf{0}$ and note that the right-hand side is then parallel to $\hat{\mathbf{u}}$ at $t = 0$. So $\boldsymbol{\phi}$ grows along $\hat{\mathbf{u}}$, and once $\boldsymbol{\phi} \parallel \boldsymbol{\omega}$ both cross-product terms vanish identically for all later time. The equation collapses to $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega}$, and the plain integral is exact.

Practically: a vehicle spinning about a body-fixed axis, however fast, needs no coning correction. A vehicle turning slowly but changing the *direction* of its turn does. Coning error is driven by the rate of change of the rate vector's direction, not by the rate magnitude.
:::

::: check
At $100\,\mathrm{Hz}$ a single-sample algorithm has $3.607\times 10^{-3}$ degrees of error after 100 s of a given coning motion. Estimate the error at $25\,\mathrm{Hz}$ and at $1\,\mathrm{kHz}$, and say what the two-sample algorithm would give at $25\,\mathrm{Hz}$.
:::

::: answer
The single-sample error scales as $T_s^2$. Going from $100\,\mathrm{Hz}$ to $25\,\mathrm{Hz}$ multiplies $T_s$ by 4, so the error grows by $16$: $5.77\times 10^{-2}$ degrees. Going to $1\,\mathrm{kHz}$ divides $T_s$ by 10, so the error falls by $100$: $3.61\times 10^{-5}$ degrees.

The two-sample algorithm scales as $T_s^4$. From the measured $1.780\times 10^{-7}$ degrees at $100\,\mathrm{Hz}$, dropping to $25\,\mathrm{Hz}$ multiplies by $4^4 = 256$, giving about $4.6\times 10^{-5}$ degrees.

Worth noting where that leaves the trade: the two-sample algorithm at $25\,\mathrm{Hz}$ is about as accurate as the single-sample algorithm at $1\,\mathrm{kHz}$, for a fortieth of the update rate. Trading processor cycles for a cross product is the whole point of coning corrections. Note also that the $T_s^2$ and $T_s^4$ laws are asymptotic and start to bend once $\Omega T_s$ approaches one, so the $25\,\mathrm{Hz}$ estimates for a $1\,\mathrm{Hz}$ cone are safe while the same extrapolation for a $20\,\mathrm{Hz}$ cone would not be.
:::

::: check
An IMU shows an unexplained attitude drift of $0.2^\circ/\mathrm{h}$ about one axis, only when the vehicle's engines are running. What would you check first, and what measurements would settle it?
:::

::: answer
Engine-correlated drift about a single axis is the signature of vibration-induced coning. Combustion and turbopump vibration excites structural modes; if two rotational axes of the sensor mount move at the same frequency with a phase difference, the case cones, and the attitude algorithm builds up a secular error along the cone axis. The magnitude fits: $0.2^\circ/\mathrm{h}$ is in the range a tens-of-hertz, hundredths-of-a-degree cone produces.

To settle it: record the raw gyro output at full rate during a burn and look for a pair of transverse channels oscillating at the same frequency in quadrature — that is a cone, and the axis it is about is the axis showing the drift. Then compute the predicted drift from $\Omega(1-\cos\beta)[1 - \sin(\Omega T_s)/(\Omega T_s)]$ using the measured $\Omega$ and $\beta$ and compare with the observed rate. If they match, the fix is a coning correction, a higher sample rate, or both. Test it by reprocessing the same recorded gyro data through the corrected algorithm — the drift should largely disappear, which is a far stronger result than a gyro swap that happens to coincide with a quieter engine run.

The alternatives are worth ruling out but fit less well: a real gyro scale-factor error under vibration would depend on the rate magnitude rather than accumulating steadily, and a g-sensitive bias would correlate with thrust level rather than with vibration spectrum.
:::

::: check
Why do strapdown systems accumulate coning increments at a high rate but update the attitude quaternion at a lower one?
:::

::: answer
Because the two operations have very different costs and very different accuracy requirements.

The coning increment accumulation is arithmetically trivial — an integration of the gyro output and one cross product per sample — and its accuracy improves as $T_s^2$ or better, so running it fast is cheap and effective. The attitude update is the expensive part: it involves a transcendental function for the exponential map, a quaternion product, a re-normalisation, and in a full navigator the associated coordinate transformations for the velocity and position channels.

So the architecture splits them. A high-rate loop, often 1 to 10 kHz, integrates the gyro and maintains the accumulated rotation vector with its coning correction. A lower-rate loop, perhaps 100 to 400 Hz, takes that accumulated vector, converts it into a quaternion update, applies it and re-normalises. The result has the non-commutativity accuracy of the high rate and the computational cost of the low one, which is the same trade the two-sample correction makes, taken one step further.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Coning | The angular velocity vector rotates; the rate direction changes, not necessarily its magnitude |
| $\boldsymbol{\omega} = \Omega\sin\beta\,\hat{\mathbf{m}} - \Omega(1-\cos\beta)\hat{\mathbf{z}}$ | Body rate for a cone of half-angle $\beta$ at rate $\Omega$ |
| $\lVert\boldsymbol{\omega}\rVert = 2\Omega\sin(\beta/2)$ | Constant magnitude; the direction is what rotates |
| $\int_0^T\boldsymbol{\omega}\,dt = (0,0,-2\pi(1-\cos\beta))$ | Non-zero over a full cone revolution, though the attitude is periodic |
| $\dot{\boldsymbol{\phi}} = \boldsymbol{\omega} + \tfrac{1}{2}\boldsymbol{\phi}\times\boldsymbol{\omega} + \cdots$ | Bortz's equation; the cross term is the coning term |
| $\boldsymbol{\phi} = \Delta\boldsymbol{\theta}_1 + \Delta\boldsymbol{\theta}_2 + \tfrac{2}{3}\Delta\boldsymbol{\theta}_1\times\Delta\boldsymbol{\theta}_2$ | Two-sample coning correction |
| $\dot{\varepsilon} = \Omega(1-\cos\beta)\bigl[1 - \sin(\Omega T_s)/(\Omega T_s)\bigr] \approx \Omega^3\beta^2T_s^2/12$ | Single-sample drift rate |
| Scaling | Single-sample error $\propto T_s^2$; two-sample $\propto T_s^4$; drift $\propto \beta^2\Omega^3$ |
| Worked cone | $1^\circ$ at $1\,\mathrm{Hz}$, $100\,\mathrm{Hz}$ sampling: $0.1298^\circ/\mathrm{h}$, cut $20\,000\times$ by two-sample |
| Vibration case | $0.05^\circ$ at $20\,\mathrm{Hz}$, $400\,\mathrm{Hz}$ sampling: $0.161^\circ/\mathrm{h}$, above navigation-grade gyro bias |
| Sculling | The velocity-channel analogue; same origin, same cure |

That closes the module. You began with four kinematic differential equations, coupled them to Euler's dynamics into a rotational 6-state, learned which conserved quantity actually tests the coupling, loaded the right-hand side with the four environmental torques and the three families of actuator, and finished with the error that remains after every actuator and integrator has done its job correctly. The exercises now ask you to build the propagator, add wheels and audit the momentum, and size a launch vehicle's gimbal against the atmosphere.
