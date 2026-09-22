---
id: l08-schuler-oscillation
title: The Schuler oscillation
minutes: 18
covers:
  - "The Schuler oscillation and why it bounds unaided INS horizontal error"
---

The mechanization lesson's worked example left a loose thread on purpose. A $1^\circ/\mathrm h$ gyro bias, uncorrected, grew the velocity error $36$-fold over a six-fold increase in time — matching a clean $t^2$ law almost exactly — and then, pushing on to ten minutes, grew only $95.6$-fold over a further ten-fold increase in time, short of the $100$-fold the same law predicts. Something was already bending that curve away from runaway growth, within the first ten minutes of a perfectly ordinary bias. This lesson names the mechanism, derives its frequency from the same equations the mechanization lesson already built, and shows exactly what it does and does not bound.

The mechanism is a hundred years old. Maximilian Schuler noticed in 1923 that a pendulum whose length equals the Earth's radius has a curious property: swing its support sideways, however violently, and the bob keeps pointing at the Earth's center throughout, undisturbed. No INS has ever been built with a six-thousand-kilometre pendulum in it, but every local-level strapdown mechanization behaves as though it does, and this lesson shows why that is not a coincidence but a direct consequence of navigating on a curved Earth with the equations already on the page.

## The pendulum that points at the center

Picture an ordinary pendulum of length $L$, bob mass irrelevant, hanging from a support that can be shoved sideways. Tilted by a small angle $\theta$ from vertical, gravity's restoring torque gives the familiar equation $\ddot\theta = -(g/L)\theta$, simple harmonic motion at frequency $\sqrt{g/L}$. Now let the support accelerate horizontally instead of being shoved once — say the pendulum's mount is itself moving along the Earth's surface. A short pendulum's bob has no way to know the surface is curving out from under it; it just swings, indifferent to the support's motion beyond the usual pendulum dynamics. A pendulum whose length happens to equal the Earth's radius $R$ is different: geometrically, a string of length $R$ from a point on the surface reaches all the way to the planet's center, so the bob's equilibrium direction — straight down the string — is *always* the true local vertical, wherever the support has moved to, because "straight down" and "toward the Earth's center" are the same direction everywhere on a sphere. Such a pendulum does not need to sense the support's motion at all; the geometry does the tracking for it. Its natural frequency, from the ordinary pendulum formula with $L=R$, is

$$
\omega_s = \sqrt{g/R}.
$$

An inertial navigator is not a pendulum, but its horizontal error loop turns out to obey exactly the same equation, for a reason this section makes precise rather than analogical: the mechanization's own position update, $\dot\varphi=v_N/(R_M+h)$, already ties "how fast the computed local vertical should be tipping" to "how fast the vehicle is moving over the curved surface" — the same geometric fact that makes the long pendulum special.

## Deriving the loop from the mechanization already built

Work with one horizontal channel at a time — north velocity error paired with an east-axis tilt error, the pairing this module's second and sixth lessons have already used. Let $\varepsilon_E$ be a small, uncorrected rotation of the computed platform away from true level about the east axis, and $\delta v_N$ the resulting north velocity error, both starting at zero.

**Tilt leaks gravity into velocity.** A platform tilted by $\varepsilon_E$ resolves the accelerometer's true vertical reading partly into the horizontal channel: the velocity update's own $\mathbf C_b^n\mathbf f^b$ term, linearized about level attitude, gives $\dot{\delta v}_N = -g\,\varepsilon_E$ (the sign found by direct linearization of the mechanization's own equations; the numerical value is $g$ to full precision, since at $\varepsilon_E=0$ nothing else in the velocity equation depends on this tilt at first order). This is the same "bias-tilt equivalence" the error-model lesson used for accelerometers, now running the other way: a platform tilt behaves exactly like an accelerometer bias of size $g\varepsilon_E$.

**Velocity error mistilts the platform.** The mechanization subtracts a *computed* transport rate $\boldsymbol\omega_{en}^n$ from the gyro before integrating attitude, and that computed rate uses the computed (erroneous) velocity, not the truth. Differentiating the transport-rate formula from the frames lesson, $\partial\omega_{en,E}^n/\partial v_N = -1/R_M$, so a north velocity error makes the computed platform tip at the wrong rate by $\dot\varepsilon_E = +\delta v_N/R_M$ relative to what would keep it level.

Two first-order equations, one feeding the other:

$$
\dot{\delta v}_N = -g\,\varepsilon_E, \qquad \dot\varepsilon_E = \frac{\delta v_N}{R_M}.
$$

Differentiate the first and substitute the second: $\ddot{\delta v}_N = -g\dot\varepsilon_E = -\dfrac{g}{R_M}\delta v_N$ — simple harmonic motion, at exactly the pendulum frequency with $L=R_M$. The east-tilt/north-velocity pair oscillates at $\sqrt{g/R_M}$; the analogous north-tilt/east-velocity pair, worked the same way, oscillates at $\sqrt{g/R_N}$, the transverse radius taking the meridian radius's place because east-west motion is governed by the transverse curvature. Using a spherical Earth of mean radius $R=6\,371\,000\,\mathrm m$ collapses the small difference between the two:

$$
\omega_s = \sqrt{g/R} = 1.2417\times10^{-3}\,\mathrm{rad/s}, \qquad T_s = \frac{2\pi}{\omega_s} = 5064.3\,\mathrm s = 84.4\,\mathrm{minutes}.
$$

::: key The Schuler frequency
$\omega_s=\sqrt{g/R}$, period $84.4$ minutes, identical in form to a pendulum of length equal to the Earth's radius and to the orbital period of a satellite skimming the surface — all three share the same $\sqrt{g/R}$ because all three are governed by the same fact: how fast gravity's direction changes as you move a given distance over a sphere of radius $R$ under gravitational acceleration $g$. The frequency depends on $g$ and $R$ alone — not on the gyro, not on the accelerometer, not on the vehicle. Every local-level unaided INS on Earth oscillates at the same $84.4$ minutes; only the amplitude depends on how good the sensors are.
:::

## What a constant gyro bias actually does

A real error is not a bare initial condition; it is driven continuously. Add a constant gyro bias $b$ about the north axis, exactly the error the mechanization lesson's worked example carried, and the loop becomes driven rather than free: $\dot\varepsilon_N = b - \delta v_E/R_N$, $\dot{\delta v}_E = g\,\varepsilon_N$ (the north-tilt/east-velocity pair this time, matching that worked example directly). Solving from rest, $\varepsilon_N(0)=\delta v_E(0)=0$, gives an exact closed form:

$$
\delta v_E(t) = bR_N\big(1-\cos\omega_s t\big), \qquad \varepsilon_N(t) = \frac{b}{\omega_s}\sin\omega_s t .
$$

::: example Closing the loop on the mechanization lesson's own numbers

For $b=1^\circ/\mathrm h = 4.848\times10^{-6}\,\mathrm{rad/s}$ at $28.5^\circ$ latitude ($R_N=6\,383\,003\,\mathrm m$, $g=9.7921\,\mathrm{m/s^2}$, $\omega_s=1.2386\times10^{-3}\,\mathrm{rad/s}$, $T_s=84.5\,\mathrm{min}=5067\,\mathrm s$):

```python
import numpy as np
from scipy.integrate import solve_ivp

Rn, g = 6383003.276878938, 9.792092465091237
b = np.radians(1.0)/3600.0
ws = np.sqrt(g/Rn)

def rhs(t, y):
    eps, dv = y
    return [b - dv/Rn, g*eps]

T = 4.5*2*np.pi/ws
sol = solve_ivp(rhs, [0, T], [0.0, 0.0], method='RK45',
                 rtol=1e-11, atol=1e-14, dense_output=True)
for t in [10, 60, 600, 5067, 5067*2, 5067*4]:
    eps, dv = sol.sol(t)
    print(f"t={t:6d} s  closed-form dv_E={b*Rn*(1-np.cos(ws*t)): .6f}  RK45 dv_E={dv: .6f}")
print("max |dv_E| over 4.5 periods:", np.max(np.abs(sol.y[1])), " vs 2*b*Rn =", 2*b*Rn)
# t=    10 s  closed-form dv_E= 0.002374  RK45 dv_E= 0.002374
# t=    60 s  closed-form dv_E= 0.085413  RK45 dv_E= 0.085413
# t=   600 s  closed-form dv_E= 8.159108  RK45 dv_E= 8.159108
# t=  5067 s  closed-form dv_E= 0.000821  RK45 dv_E= 0.000821
# t= 10134 s  closed-form dv_E= 0.003283  RK45 dv_E= 0.003283
# t= 20268 s  closed-form dv_E= 0.013133  RK45 dv_E= 0.013133
# max |dv_E| over 4.5 periods: 61.891346302... vs 2*b*Rn = 61.891346303...
```

At $t=10\,\mathrm s$ and $t=60\,\mathrm s$ the closed form reproduces the mechanization lesson's full nonlinear simulation, $0.00237$ and $0.0854\,\mathrm{m/s}$, to three figures — confirmation that the linearization above is not a separate model but the small-error limit of the same equations. At $t=600\,\mathrm s$ it gives $8.159\,\mathrm{m/s}$, matching that lesson's $8.157\,\mathrm{m/s}$ to within the nonlinear correction the nearly-quarter-of-a-radian tilt has by then accumulated. And now the full story: by $t=5067\,\mathrm s$, one full Schuler period, $\delta v_E$ has returned to within $0.001\,\mathrm{m/s}$ of zero — the velocity error the bias built up over the first ten minutes has completely unwound itself — and over four and a half further periods it never again exceeds the $61.89\,\mathrm{m/s}$ peak reached in the very first cycle, matching $2bR_N=61.891\,\mathrm{m/s}$ exactly. A bias that a naive $t^2$ law would have driven to enormous velocity errors within an hour instead settles into a bounded, exactly periodic oscillation, forever, unless something else changes.
:::

::: warning
"Bounded" describes the *velocity* error precisely and the *position* error only partly. Integrating $\delta v_E(t)=bR_N(1-\cos\omega_s t)$ gives $\delta x(t) = bR_N\!\left(t - \dfrac{\sin\omega_s t}{\omega_s}\right)$: a bounded oscillation of amplitude $bR_N/\omega_s$ riding on top of a **secular term that grows linearly with time**, at rate $bR_N$. The Schuler loop converts the bias's cubic position-error growth into something far gentler — a constant drift rate instead of an ever-accelerating one — but it does not stop position error from growing altogether, because the bias itself never stops driving the loop. Only removing or estimating the bias does that; the next lesson of this module puts exact numbers on this residual drift alongside every other error source.
:::

## A constant accelerometer bias behaves differently

Repeat the exercise with a constant accelerometer bias $a$ instead of a gyro bias — it enters the velocity equation directly rather than through the tilt-rate equation: $\dot{\delta v}_N=a-g\varepsilon_E$, $\dot\varepsilon_E=\delta v_N/R_M$. Solving from rest gives

$$
\varepsilon_E(t) = \frac{a}{g}(1-\cos\omega_s t), \qquad \delta v_N(t) = \frac{a}{\omega_s}\sin\omega_s t, \qquad \delta x(t) = \frac{a}{\omega_s^2}(1-\cos\omega_s t) = \frac{aR_M}{g}(1-\cos\omega_s t).
$$

::: example The asymmetry between the two bias types

For a navigation-grade accelerometer bias $a=50\,\mu g=4.905\times10^{-4}\,\mathrm{m/s^2}$ at $28.5^\circ$ ($R_M=6\,349\,951\,\mathrm m$, $\omega_s=1.2418\times10^{-3}\,\mathrm{rad/s}$, $1/\omega_s=805\,\mathrm s$), a Runge-Kutta integration of the exact two-state system matches the closed form at every checkpoint to six figures. At $t=600\,\mathrm s$, $\delta v_N=0.2677\,\mathrm{m/s}$ and $\delta x=84.3\,\mathrm m$ — already below the short-time estimate $\tfrac12at^2=88.3\,\mathrm m$, because $600\,\mathrm s$ is more than half of $1/\omega_s$ and the oscillation is starting to curve the growth over, exactly as the gyro-bias case did by the same point. The position amplitude here is $aR_M/g=2a/\omega_s^2=635.9\,\mathrm m$ at its largest — and, unlike the gyro-bias case, **position from a pure accelerometer bias has no secular term at all**: $\delta x(t)$ is purely periodic, oscillating forever between $0$ and $635.9\,\mathrm m$ rather than drifting. The two bias types, though both Schuler-bounded, leave measurably different signatures — one with a residual drift rate, one without — which is exactly the kind of distinction a filter estimating both states separately needs to exploit.
:::

## Why the same period bounds every unaided INS

Nothing in the derivation above referred to a gyro's bias instability, an accelerometer's noise density, or any grade from the module's tables. $\omega_s$ depends only on $g$ and $R$ — the same two numbers for a strategic-grade ring laser system and a tactical MEMS unit sitting on the same latitude. What differs between them is the *amplitude* the loop settles into, because that amplitude is set by the size of the driving error: $2bR$ for a gyro bias, $2a/\omega_s^2$ for an accelerometer bias, and correspondingly larger figures for the noise processes the random-walk lesson characterized. A better IMU does not change the tempo of the oscillation a coasting vehicle will show; it shrinks how far that oscillation swings. Reading an unaided INS's error record and seeing an $84$-minute ripple is not a fault to chase down — it is the loop working exactly as the geometry of a curved, gravitating Earth requires, and the number worth extracting from that ripple is its amplitude, not its existence.

## Check yourself

::: check
A hypothetical INS operates on a small moon with the same surface gravity as Earth but half the radius. What is its Schuler period, and why?
:::

::: answer
$\omega_s=\sqrt{g/R}$, so halving $R$ at fixed $g$ multiplies $\omega_s$ by $\sqrt2$ and divides the period by $\sqrt2$: $84.4/\sqrt2=59.7$ minutes. A smaller body curves away faster per unit distance travelled, so the local vertical changes direction more quickly for the same horizontal speed, which is exactly the geometric fact that sets the tilt-rate feedback $\dot\varepsilon=\delta v/R$ — a smaller $R$ makes that feedback stronger and the loop oscillate faster.
:::

::: check
Explain physically why the Schuler loop needs *both* of its two equations — the tilt-leaks-gravity equation and the velocity-mistilts-attitude equation — and what would happen to a system with only the first.
:::

::: answer
The first equation alone, $\dot{\delta v}=-g\varepsilon$ with $\varepsilon$ held fixed or externally driven, just integrates a tilt into an ever-growing velocity error with no feedback at all — exactly the ungoverned $t$-then-$t^2$-then-cubic growth this module warned about before this lesson. The second equation is what closes the loop: it is the mechanization's own recognition, baked into the transport-rate term, that the platform must itself keep tipping as the (erroneous) computed position moves, and it is precisely this self-referential correction — using the very velocity error the first equation produced — that turns an open integrator into an oscillator. Remove it, and there is nothing to convert growth into oscillation.
:::

::: check
A gyro bias and an accelerometer bias of the same numeric axis produce different long-term position signatures — one has a secular drift term, the other does not. Which is which, and in one sentence, where does the difference come from mathematically?
:::

::: answer
The gyro bias drives the tilt-rate equation directly ($\dot\varepsilon = b - \delta v/R$), so its particular (steady-state) solution has $\delta v$ sitting at a nonzero constant $bR$ that integrates into a linearly growing position; the accelerometer bias drives the velocity equation directly ($\dot{\delta v}=a-g\varepsilon$), whose particular solution has $\delta v$ sitting at zero and only $\varepsilon$ offset, so $\delta v(t)$ is purely oscillatory with no constant part and its integral, position, has no secular term.
:::

::: check
Someone claims that because the Schuler oscillation returns velocity error to zero every $84.4$ minutes, an unaided INS is "fine" as long as a flight is timed to land near a multiple of that period. What is wrong with this plan?
:::

::: answer
The velocity error returning to zero at $t=T_s,2T_s,\ldots$ is a feature of this lesson's idealized, single-bias, linearized model; a real vehicle carries angle and velocity random walk, several correlated biases, initial alignment error and eventually large-angle effects the linearization drops, none of which share a common period or return to zero on this schedule. Worse, even in the idealized single-bias case this lesson derived, *position* error does not return to zero at all for a gyro bias — it carries a secular drift the velocity's zero crossings say nothing about — so timing a landing to a velocity null would still land far from the true position. Exploiting the oscillation's zero crossings is not a substitute for aiding.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\omega_s=\sqrt{g/R}$, $T_s=2\pi/\omega_s\approx84.4\,\mathrm{min}$ | Schuler frequency and period; depends only on $g$ and $R$ |
| $\dot{\delta v}=-g\varepsilon$, $\dot\varepsilon=\delta v/R$ | The linearized horizontal error loop, tilt and velocity feeding each other |
| $\delta v(t)=bR(1-\cos\omega_st)$ | Gyro bias $b$: bounded, periodic velocity error, amplitude $2bR$ |
| $\delta x(t)=bR(t-\sin(\omega_st)/\omega_s)$ | Gyro bias: position carries a secular drift at rate $bR$ under the bounded oscillation |
| $\delta v(t)=(a/\omega_s)\sin\omega_st$, $\delta x(t)=(a/\omega_s^2)(1-\cos\omega_st)$ | Accelerometer bias $a$: velocity and position both purely bounded, no secular term |
| Pendulum of length $R$ | The historical intuition: a string reaching the Earth's center always points at true vertical |

The Schuler loop is now derived from first principles, on this module's own equations, for the two bias types this module has emphasized. The next lesson puts every error source this module has built — angle and velocity random walk, bias instability, rate random walk, gyro and accelerometer bias — into one free-inertial error budget, checked against real arithmetic at ten seconds, one minute, and one hour, with the Schuler bound from this lesson governing where that arithmetic is allowed to stop growing unchecked.
