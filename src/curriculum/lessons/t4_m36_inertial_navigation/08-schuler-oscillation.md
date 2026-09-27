---
id: l08-schuler-oscillation
title: The Schuler oscillation
minutes: 20
covers:
  - "The Schuler oscillation and why it bounds unaided INS horizontal error"
---

Drop a marble into a salad bowl, a little off center. It rolls down, overshoots, climbs the far side, stops, and rolls back. It never runs away. The curved bowl turns every push away from the bottom into a push back toward it, so the marble rocks back and forth forever (or until friction stops it).

An inertial navigator on the curved Earth has its own hidden bowl. The mechanization lesson's worked example left a loose thread on purpose. A $1^\circ/\mathrm h$ gyro bias, uncorrected, grew the velocity error $36$-fold over a six-fold increase in time — almost exactly the $6^2=36$ of a $t^2$ law. But pushing on to ten minutes, a further ten-fold increase in time grew the error only $95.6$-fold, short of the $100$-fold the same law predicts. Something was already **[[bending the curve|bending-curve]]** away from runaway growth, within ten minutes of an ordinary bias.

That something is the **Schuler oscillation**: a slow rocking of the horizontal errors with a period of about $84$ minutes. This lesson names the mechanism, derives its frequency from equations the mechanization lesson already built, and shows exactly what it does and does not hold in check.

The idea is a hundred years old. **[[Max Schuler|schuler-history]]** noticed in 1923 that a pendulum as long as the Earth's radius has a strange property: shove its support sideways, however hard, and the bob keeps pointing at the Earth's center. Nobody has built an INS with a six-thousand-kilometer pendulum in it. Yet every local-level strapdown mechanization behaves as though it had one — and that is no coincidence.

## The pendulum that points at the center

Start with an ordinary pendulum of length $L$ hanging from a support. Tip it by a small angle $\theta$ from straight down. Gravity pulls it back, and the angle obeys

$$
\ddot\theta = -\frac{g}{L}\,\theta ,
$$

read "theta double-dot equals minus g over L times theta". The minus sign means "the farther it tips, the harder it is pulled back" — the bowl again. The solution swings back and forth at the angular frequency $\sqrt{g/L}$.

Now let the support move sideways along the Earth's surface. A short pendulum has no idea the ground curves away beneath it. When its support speeds up, the bob lags behind and starts to swing.

A pendulum whose length equals the Earth's radius $R$ is different. A string that long, hung from any point on the surface, reaches exactly to the planet's center. So its resting direction — straight along the string — always points at the center. And on a sphere, "toward the center" is the **[[local vertical|local-vertical]]** everywhere. Wherever the support goes, the bob's resting direction is already the true vertical. It never needs to be dragged into line, so it never starts swinging. The geometry does the tracking. Its natural frequency comes from the ordinary pendulum formula with $L=R$:

$$
\omega_s = \sqrt{g/R}.
$$

Read $\omega_s$ as "omega sub s", the **Schuler frequency**.

An inertial navigator is not a pendulum. But its horizontal error loop obeys exactly the same equation, for a precise reason. The mechanization's own position update, $\dot\varphi=v_N/(R_M+h)$, already ties "how fast the computed vertical must tip" to "how fast the vehicle moves over the curved surface". That is the same geometric fact that makes the long pendulum special.

## Deriving the loop from the mechanization already built

Work with one horizontal channel at a time. Pair the north velocity error with a tilt about the east axis — the natural NED pairing this module has used since the mechanization lessons. Let $\varepsilon_E$ ("epsilon sub E") be a small, uncorrected tilt of the computed platform away from true level, about the east axis. Let $\delta v_N$ ("delta v north") be the resulting north velocity error. Both start at zero.

**Step 1: tilt leaks gravity into velocity.** The accelerometers on a level vehicle at rest feel the ground pushing up, about $g$. If the computer thinks the platform is tipped by $\varepsilon_E$, it resolves part of that big vertical reading into the horizontal channel. Linearize the velocity update's $\mathbf C_b^n\mathbf f^b$ term about level and you get

$$
\dot{\delta v}_N = -g\,\varepsilon_E .
$$

The sign comes from working the linearization through carefully. The size is exactly $g$, because at $\varepsilon_E=0$ nothing else in the velocity equation depends on this tilt to first order. This is the **[[bias-tilt equivalence|bias-tilt]]** from the error-model lesson, running the other way: a platform tilt acts exactly like an accelerometer bias of size $g\varepsilon_E$.

**Step 2: velocity error tips the platform.** To keep its platform level as the vehicle moves over the curved Earth, the mechanization subtracts a computed **[[transport rate|transport-rate]]** $\boldsymbol\omega_{en}^n$ from the gyro before integrating attitude. That rate is computed from the *computed* velocity, errors and all. From the frames lesson, the east part of the transport rate changes with north velocity as $\partial\omega_{en,E}^n/\partial v_N = -1/R_M$. So a north velocity error makes the computed platform tip at the wrong rate:

$$
\dot\varepsilon_E = \frac{\delta v_N}{R_M}.
$$

**Step 3: close the loop.** Two first-order equations, each feeding the other:

$$
\dot{\delta v}_N = -g\,\varepsilon_E, \qquad \dot\varepsilon_E = \frac{\delta v_N}{R_M}.
$$

Differentiate the first equation once more, then substitute the second into it:

$$
\ddot{\delta v}_N = -g\,\dot\varepsilon_E = -\frac{g}{R_M}\,\delta v_N .
$$

That is the pendulum equation again, with $L=R_M$. The north-velocity/east-tilt pair oscillates at $\sqrt{g/R_M}$. The east-velocity/north-tilt pair, worked the same way, oscillates at $\sqrt{g/R_N}$. The transverse radius $R_N$ takes the meridian radius's place because east-west motion follows the east-west curvature. For a round Earth of mean radius $R=6\,371\,000\,\mathrm m$ and $g=9.80665\,\mathrm{m/s^2}$, the small difference disappears:

$$
\omega_s = \sqrt{g/R} = 1.2407\times10^{-3}\,\mathrm{rad/s}, \qquad T_s = \frac{2\pi}{\omega_s} = 5064\,\mathrm s = 84.4\,\mathrm{minutes}.
$$

::: key The Schuler frequency
$\omega_s=\sqrt{g/R}$, period $2\pi/\omega_s=84.4$ minutes. A correctly mechanized local-level INS oscillates at this frequency instead of diverging. It is the same as the frequency of a pendulum as long as the Earth's radius, and the same as the orbit of a satellite **[[skimming the surface|skimming-orbit]]**. All three share $\sqrt{g/R}$ because all three are set by one fact: how fast gravity's direction turns as you move over a sphere of radius $R$. The frequency depends on $g$ and $R$ alone — not on the gyro, the accelerometer or the vehicle. Only the size of the swing depends on how good the sensors are.
:::

::: note Why the loop has to rock, not run away
Look at the signs. A positive tilt makes the velocity error *fall* ($\dot{\delta v}_N=-g\varepsilon_E$). A positive velocity error makes the tilt *grow* ($\dot\varepsilon_E=+\delta v_N/R_M$). So each quantity pushes the other in the direction that eventually reverses it — the marble climbing the far side of the bowl. If both signs were the same, the loop would feed itself and grow exponentially, like a microphone held to its own speaker. The opposite signs are what make the second-order equation $\ddot{\delta v}_N=-\omega_s^2\,\delta v_N$ have sines and cosines as its solutions instead of growing exponentials. Any solution is $\delta v_N(t)=C_1\cos\omega_s t+C_2\sin\omega_s t$, which stays between fixed limits forever.
:::

::: example The Schuler period, by hand
Take $g=9.80665\,\mathrm{m/s^2}$ and $R=6\,371\,000\,\mathrm m$.

1. Divide: $g/R = 9.80665/6\,371\,000 = 1.5393\times10^{-6}\,\mathrm{s^{-2}}$.
2. Square root: $\omega_s=\sqrt{1.5393\times10^{-6}}=1.2407\times10^{-3}\,\mathrm{rad/s}$.
3. Period: $T_s=2\pi/\omega_s=6.2832/(1.2407\times10^{-3})=5064\,\mathrm s$.
4. In minutes: $5064/60=84.4\,\mathrm{min}$.

Sanity check with the orbit: a satellite skimming the surface needs $v=\sqrt{gR}=\sqrt{9.80665\times6\,371\,000}\approx7904\,\mathrm{m/s}$. One lap is $2\pi R\approx40\,030\,\mathrm{km}$, and $40\,030\,000/7904\approx5065\,\mathrm s$ — the same $84.4$ minutes.
:::

## What a constant gyro bias actually does

A real error is not a one-time kick. It pushes all the time. Add a constant gyro bias $b$ about the north axis — exactly the error the mechanization lesson's worked example carried. Use the east-velocity/north-tilt pair this time, to match that example directly. The loop is now driven:

$$
\dot\varepsilon_N = b - \frac{\delta v_E}{R_N}, \qquad \dot{\delta v}_E = g\,\varepsilon_N .
$$

The bias keeps adding tilt rate $b$. The velocity error it causes feeds back through the transport rate and fights it. Start from rest, $\varepsilon_N(0)=\delta v_E(0)=0$, and the exact solution is

$$
\delta v_E(t) = bR_N\big(1-\cos\omega_s t\big), \qquad \varepsilon_N(t) = \frac{b}{\omega_s}\sin\omega_s t .
$$

The velocity error rises from zero, peaks at $2bR_N$ half a period later, and comes back to zero after one full period. Then it does the same again, forever.

::: note Checking the solution
Differentiate the proposed $\delta v_E$: $\dot{\delta v}_E=bR_N\omega_s\sin\omega_s t$. The second equation wants $g\varepsilon_N=g\,(b/\omega_s)\sin\omega_s t$. These match if $R_N\omega_s=g/\omega_s$, that is $\omega_s^2=g/R_N$ — true by definition. Now the first equation: $\dot\varepsilon_N=b\cos\omega_s t$, and $b-\delta v_E/R_N=b-b(1-\cos\omega_s t)=b\cos\omega_s t$. It matches too. Both start at zero at $t=0$. So this is the solution.
:::

::: example Closing the loop on the mechanization lesson's own numbers
Take $b=1^\circ/\mathrm h = 4.848\times10^{-6}\,\mathrm{rad/s}$ at $28.5^\circ$ latitude, where $R_N=6\,383\,003\,\mathrm m$ and $g=9.7921\,\mathrm{m/s^2}$. Then $\omega_s=1.2386\times10^{-3}\,\mathrm{rad/s}$ and $T_s=5073\,\mathrm s=84.55\,\mathrm{min}$. Integrate the two-state loop numerically and compare it with the formula.

```python
import numpy as np
from scipy.integrate import solve_ivp

Rn, g = 6383003.28, 9.79209               # transverse radius and gravity at 28.5 deg
b = np.radians(1.0)/3600.0                # 1 deg/h in rad/s
ws = np.sqrt(g/Rn)
Ts = 2*np.pi/ws

def rhs(t, y):                            # y = [tilt eps_N, velocity error dv_E]
    eps, dv = y
    return [b - dv/Rn, g*eps]

sol = solve_ivp(rhs, [0, 4.5*Ts], [0.0, 0.0], method='RK45',
                rtol=1e-11, atol=1e-14, dense_output=True)
print(f"Ts = {Ts:.1f} s = {Ts/60:.2f} min")
for t in [10, 60, 600, Ts, 2*Ts, 4*Ts]:
    eps, dv = sol.sol(t)
    print(f"t={t:7.0f} s  formula={b*Rn*(1-np.cos(ws*t)):9.5f}  RK45={dv:9.5f} m/s")
print(f"peak |dv_E| = {np.max(np.abs(sol.y[1])):.3f}  vs 2*b*Rn = {2*b*Rn:.3f} m/s")
# Ts = 5072.9 s = 84.55 min
# t=     10 s  formula=  0.00237  RK45=  0.00237 m/s
# t=     60 s  formula=  0.08541  RK45=  0.08541 m/s
# t=    600 s  formula=  8.15911  RK45=  8.15911 m/s
# t=   5073 s  formula=  0.00000  RK45=  0.00000 m/s
# t=  10146 s  formula=  0.00000  RK45=  0.00000 m/s
# t=  20292 s  formula=  0.00000  RK45=  0.00000 m/s
# peak |dv_E| = 61.891  vs 2*b*Rn = 61.891 m/s
```

Read it in three stages.

- **Early on.** At $10\,\mathrm s$ and $60\,\mathrm s$ the formula gives $0.00237$ and $0.0854\,\mathrm{m/s}$. The mechanization lesson's full nonlinear simulation got $0.00236$ and $0.0853\,\mathrm{m/s}$ — within about half a percent. So the two-equation loop is not a separate model; it is the small-error limit of the same equations.
- **Ten minutes.** At $600\,\mathrm s$ the formula gives $8.159\,\mathrm{m/s}$, against that lesson's $8.157\,\mathrm{m/s}$. The bending away from $t^2$ that puzzled us is simply the start of the cosine curving over.
- **The full story.** After one Schuler period, $5073\,\mathrm s$, the velocity error is back to zero. Everything the bias built up has unwound itself. Over four and a half periods it never goes above the $61.89\,\mathrm{m/s}$ peak of the first cycle, which matches $2bR_N=61.891\,\mathrm{m/s}$.

A $t^2$ law would have driven this error to hundreds of meters per second within an hour. Instead it settles into a bounded, exactly repeating swing.
:::

::: warning Bounded velocity is not bounded position
"Bounded" describes the *velocity* error exactly and the *position* error only partly. Integrate $\delta v_E(t)=bR_N(1-\cos\omega_s t)$ once more:

$$
\delta x(t) = bR_N\!\left(t - \frac{\sin\omega_s t}{\omega_s}\right).
$$

That is a bounded wobble of size $bR_N/\omega_s$ riding on a **[[secular term|secular]]** that grows in a straight line, at rate $bR_N$. The velocity error never goes negative, so its average, $bR_N$, never cancels. For the $1^\circ/\mathrm h$ example, $bR_N=30.9\,\mathrm{m/s}$ — about $111\,\mathrm{km}$ of drift every hour.

So the Schuler loop turns the bias's cubic position growth into something far gentler: a steady drift instead of an ever-faster one. But it does not stop position error from growing, because the bias never stops pushing. Only removing or estimating the bias does that. The next lesson puts numbers on this drift next to every other error source.
:::

## A constant accelerometer bias behaves differently

Now use a constant accelerometer bias $a$ instead. It enters the velocity equation directly, not the tilt equation:

$$
\dot{\delta v}_N=a-g\varepsilon_E, \qquad \dot\varepsilon_E=\frac{\delta v_N}{R_M}.
$$

Starting from rest, the solution is

$$
\varepsilon_E(t) = \frac{a}{g}(1-\cos\omega_s t), \qquad \delta v_N(t) = \frac{a}{\omega_s}\sin\omega_s t, \qquad \delta x(t) = \frac{a}{\omega_s^2}(1-\cos\omega_s t) = \frac{aR_M}{g}(1-\cos\omega_s t).
$$

Here the *tilt* settles around $a/g$ — the loop tips the platform just enough that the leaked gravity, $g\times a/g=a$, cancels the bias on average. The velocity error swings evenly above and below zero, so position has no steady drift.

::: example The asymmetry between the two bias types
Take a navigation-grade accelerometer bias $a=50\,\mu g=4.903\times10^{-4}\,\mathrm{m/s^2}$ at $28.5^\circ$, where $R_M=6\,349\,951\,\mathrm m$. Then $\omega_s=1.2418\times10^{-3}\,\mathrm{rad/s}$ and $1/\omega_s=805\,\mathrm s$. A Runge-Kutta integration of the two-state loop matches the formulas at every checkpoint to six figures.

**At ten minutes.** With $t=600\,\mathrm s$, $\omega_s t=0.745\,\mathrm{rad}$. The velocity error is $\delta v_N=(a/\omega_s)\sin0.745=0.2677\,\mathrm{m/s}$. The position error is $\delta x=84.3\,\mathrm m$. The short-time estimate $\tfrac12at^2$ gives $88.3\,\mathrm m$, so the loop is already curving the growth over — $600\,\mathrm s$ is three quarters of $1/\omega_s$, the same point where the gyro-bias case started to bend.

**The largest swing.** The position error peaks when $\cos\omega_s t=-1$, at

$$
\delta x_{\max}=\frac{2aR_M}{g}=\frac{2a}{\omega_s^2}=635.9\,\mathrm m .
$$

Then it comes back to zero, and repeats.

**The difference.** Position from a pure accelerometer bias has **no secular term at all**. It rocks forever between $0$ and $635.9\,\mathrm m$ instead of drifting. The gyro bias leaves a steady drift; the accelerometer bias does not. That different signature is exactly what a filter estimating both biases separately can use to tell them apart.
:::

## Why the same period bounds every unaided INS

Nothing in these derivations mentioned a gyro's bias instability, an accelerometer's noise density, or any grade from the module's tables. $\omega_s$ depends only on $g$ and $R$. Those are the same two numbers for a strategic-grade ring laser system and a tactical MEMS unit at the same latitude.

What differs is the *size* of the swing, because that is set by how hard the error pushes: $2bR$ in velocity for a gyro bias, $2a/\omega_s^2$ in position for an accelerometer bias, and larger figures for the noise processes the random-walk lesson described. A better IMU does not change the tempo of the oscillation. It shrinks how far the oscillation swings.

So if you look at an unaided INS's error record and see an $84$-minute ripple, that is not a fault to chase. It is the loop working exactly as the geometry of a curved, gravitating Earth requires. The number worth reading from the ripple is its size, not its existence.

## Check yourself

::: check
An imaginary INS works on a small moon with the same surface gravity as Earth but half the radius. What is its Schuler period, and why?
:::

::: answer
$\omega_s=\sqrt{g/R}$. Halving $R$ with $g$ fixed multiplies $\omega_s$ by $\sqrt2$, so it divides the period by $\sqrt2$: $84.4/\sqrt2=59.7$ minutes. A smaller body curves away faster for each meter you travel, so the local vertical turns more quickly for the same horizontal speed. That is exactly the fact behind the tilt-rate feedback $\dot\varepsilon=\delta v/R$: a smaller $R$ makes the feedback stronger, and the loop rocks faster.
:::

::: check
Explain physically why the Schuler loop needs *both* of its equations — tilt leaks gravity, and velocity error tips the platform — and what would happen with only the first.
:::

::: answer
The first equation alone, $\dot{\delta v}=-g\varepsilon$ with $\varepsilon$ held fixed or driven from outside, turns a tilt into an ever-growing velocity error with no feedback at all: the unchecked growth — linear, then quadratic, then cubic in position — this module warned about before this lesson. The second equation closes the loop. It is the mechanization's own built-in rule, through the transport rate, that the platform must keep tipping as the computed position moves over the curved Earth. Because it uses the very velocity error the first equation produced, it pushes back against it, and that turns an open-ended integrator into an oscillator. Remove it and nothing converts growth into rocking.
:::

::: check
A gyro bias and an accelerometer bias produce different long-term position signatures: one has a secular drift, the other does not. Which is which, and where does the difference come from mathematically?
:::

::: answer
The gyro bias has the drift. It drives the tilt equation ($\dot\varepsilon = b - \delta v/R$), so the loop can only balance it by holding $\delta v$ at an average of $bR$ — a nonzero constant that integrates into position growing in a straight line. The accelerometer bias drives the velocity equation ($\dot{\delta v}=a-g\varepsilon$), which the loop balances by holding the *tilt* at an average of $a/g$ while $\delta v$ averages zero. A purely oscillating velocity integrates to a purely oscillating position, with no secular term.
:::

::: check
Someone says: because the Schuler oscillation brings the velocity error back to zero every $84.4$ minutes, an unaided INS is "fine" if you time the flight to land near a multiple of that period. What is wrong with this plan?
:::

::: answer
The velocity error returning to zero at $t=T_s,2T_s,\ldots$ belongs to this lesson's idealized model: one constant bias, small errors, linearized. A real vehicle also carries angle and velocity random walk, several biases, initial alignment error, and eventually large-angle effects the linearization drops. None of them share one schedule of zero crossings. Worse, even in the idealized single-bias case, the *position* error from a gyro bias does not return to zero at all — it carries a secular drift that the velocity's zero crossings say nothing about. So the vehicle would still land far from where it thinks it is. Using the oscillation's zero crossings is no substitute for aiding.
:::

::: check
Mars has surface gravity $g=3.71\,\mathrm{m/s^2}$ and mean radius $R=3\,389.5\,\mathrm{km}$. What is the Schuler period for an INS on a Mars rover?
:::

::: answer
First $g/R=3.71/3\,389\,500=1.0946\times10^{-6}\,\mathrm{s^{-2}}$. Then $\omega_s=\sqrt{1.0946\times10^{-6}}=1.0462\times10^{-3}\,\mathrm{rad/s}$. The period is $T_s=2\pi/\omega_s=6006\,\mathrm s$, or about $100$ minutes. It is longer than Earth's $84.4$ minutes because Mars's weaker gravity more than makes up for its smaller radius: $g$ is $0.378$ of Earth's while $R$ is $0.532$ of Earth's, and the period goes as $\sqrt{R/g}$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\omega_s=\sqrt{g/R}$, $T_s=2\pi/\omega_s\approx84.4\,\mathrm{min}$ | Schuler frequency and period; depend only on $g$ and $R$ |
| $\dot{\delta v}=-g\varepsilon$, $\dot\varepsilon=\delta v/R$ | The linearized horizontal error loop: tilt and velocity error feeding each other |
| $\delta v(t)=bR(1-\cos\omega_st)$ | Gyro bias $b$: bounded, repeating velocity error, peak $2bR$ |
| $\delta x(t)=bR(t-\sin(\omega_st)/\omega_s)$ | Gyro bias: position has a secular drift at rate $bR$ under the bounded wobble |
| $\delta v(t)=(a/\omega_s)\sin\omega_st$, $\delta x(t)=(a/\omega_s^2)(1-\cos\omega_st)$ | Accelerometer bias $a$: velocity and position both bounded, no secular term |
| Pendulum of length $R$ | The picture: a string reaching the Earth's center always hangs along the true vertical |

The Schuler loop is now derived on this module's own equations for the two bias types that matter most. The next lesson puts every error source this module has built — angle and velocity random walk, gyro and accelerometer bias, initial velocity error — into one free-inertial error budget, checked at ten seconds, one minute and one hour, with the Schuler loop deciding where the short-time growth laws stop applying.

::: context bending-curve The curve that bends over
The blue curve is the east velocity error from a $1^\circ/\mathrm h$ gyro bias over two Schuler periods, drawn from the formula this lesson derives. The orange curve is the short-time law $\tfrac12gbt^2$ that fits it perfectly for the first few minutes. By ten minutes the two have started to part, and by twenty the orange curve has left the chart while the blue one turns around.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="46.2" x2="340" y2="46.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,170.0 41.8,169.8 43.5,169.3 45.3,168.5 47.0,167.3 48.8,165.8 50.5,164.0 52.3,161.8 54.0,159.3 55.8,156.5 57.5,153.4 59.3,149.9 61.0,146.0 62.8,141.9 64.5,137.4 66.3,132.5 68.0,127.4 69.8,121.9 71.5,116.1 73.3,109.9 75.0,103.4 76.8,96.6 78.5,89.4 80.3,81.9 82.0,74.1 83.8,66.0 85.5,57.5 87.3,48.6 89.0,39.5 90.8,30.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 43.0,169.5 46.0,168.1 49.0,165.7 52.0,162.3 55.0,158.2 58.0,153.2 61.0,147.6 64.0,141.3 67.0,134.5 70.0,127.2 73.0,119.7 76.0,112.0 79.0,104.2 82.0,96.5 85.0,89.0 88.0,81.8 91.0,74.9 94.0,68.7 97.0,63.0 100.0,58.0 103.0,53.9 106.0,50.6 109.0,48.2 112.0,46.7 115.0,46.2 118.0,46.7 121.0,48.2 124.0,50.6 127.0,53.9 130.0,58.0 133.0,63.0 136.0,68.7 139.0,74.9 142.0,81.8 145.0,89.0 148.0,96.5 151.0,104.2 154.0,112.0 157.0,119.7 160.0,127.2 163.0,134.5 166.0,141.3 169.0,147.6 172.0,153.2 175.0,158.2 178.0,162.3 181.0,165.7 184.0,168.1 187.0,169.5 190.0,170.0 193.0,169.5 196.0,168.1 199.0,165.7 202.0,162.3 205.0,158.2 208.0,153.2 211.0,147.6 214.0,141.3 217.0,134.5 220.0,127.2 223.0,119.7 226.0,112.0 229.0,104.2 232.0,96.5 235.0,89.0 238.0,81.8 241.0,74.9 244.0,68.7 247.0,63.0 250.0,58.0 253.0,53.9 256.0,50.6 259.0,48.2 262.0,46.7 265.0,46.2 268.0,46.7 271.0,48.2 274.0,50.6 277.0,53.9 280.0,58.0 283.0,63.0 286.0,68.7 289.0,74.9 292.0,81.8 295.0,89.0 298.0,96.5 301.0,104.2 304.0,112.0 307.0,119.7 310.0,127.2 313.0,134.5 316.0,141.3 319.0,147.6 322.0,153.2 325.0,158.2 328.0,162.3 331.0,165.7 334.0,168.1 337.0,169.5 340.0,170.0"/>
  <text x="44" y="40" font-size="11" fill="#6c7a93">peak 2bR = 61.9 m/s</text>
  <text x="96" y="30" font-size="11" fill="#f2b880">t² law</text>
  <text x="190" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">84.5 min</text>
  <text x="340" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">169 min</text>
  <text x="200" y="120" font-size="12" fill="#1d6fd1">Schuler loop</text>
</svg>
```
:::

::: context schuler-history A gyrocompass problem, solved on paper
Max Schuler was a German engineer working on gyrocompasses for ships in the early twentieth century. A ship's gyrocompass kept being thrown off whenever the ship sped up, slowed down or turned, because those accelerations tipped the compass like a short pendulum. In his 1923 paper Schuler showed that a device tuned to swing with an $84$-minute period would not be disturbed by the vehicle's accelerations at all. For decades this was a design target that was hard to build. Inertial navigation made it automatic: the mechanization's equations are Schuler-tuned by construction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="125" r="85" fill="#8fb8f0" fill-opacity="0.3" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="40" x2="180" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="245.1" y1="70.4" x2="180" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="172" y="32" width="16" height="8" fill="#6c7a93"/>
  <rect x="237" y="62" width="16" height="8" fill="#6c7a93" transform="rotate(50 245.1 66.4)"/>
  <circle cx="180" cy="125" r="6" fill="#b4232c"/>
  <text x="190" y="140" font-size="12" fill="#b4232c">bob at the center</text>
  <text x="120" y="24" font-size="12" fill="#1f2a44">support here...</text>
  <text x="258" y="60" font-size="12" fill="#1f2a44">...or moved here</text>
  <text x="20" y="212" font-size="12" fill="#1f2a44">string length R: it always hangs along the local vertical</text>
</svg>
```
:::

::: context local-vertical Which way is down?
The **local vertical** is the direction a plumb line hangs where you are standing. On a perfect sphere it points at the center. Move a few hundred kilometers and it points a few degrees differently: every $111\,\mathrm{km}$ of travel over the Earth turns the vertical by about $1^\circ$. A navigation computer keeping a level platform has to turn that platform by exactly this amount as it moves — which is why its own velocity estimate ends up steering its idea of "level".
:::

::: context bias-tilt Why a tilt looks like an accelerometer bias
An accelerometer at rest feels about $9.8\,\mathrm{m/s^2}$ pushing up. Tip it by a tiny angle $\varepsilon$ and a slice of that reading, $g\sin\varepsilon\approx g\varepsilon$, now lies along a horizontal axis. The accelerometer cannot tell that slice from a real horizontal acceleration or from a bias. A tilt of $1\,\mathrm{mrad}$ (about $0.06^\circ$) makes a false horizontal acceleration of about $0.0098\,\mathrm{m/s^2}$ — about $1\,\mathrm{mg}$, twenty times a $50\,\mu g$ navigation-grade bias.
:::

::: context transport-rate Turning the platform to stay level
The **transport rate** is how fast the local north-east-down frame must turn, relative to the Earth, to stay level as the vehicle moves. Drive north at $v_N$ and the frame must pitch about the east axis at $v_N/R_M$, or it would end up tilted relative to the new local vertical. The computer only knows $v_N$ through its own estimate. So any error in that estimate becomes an error in how fast it turns the platform — which is the whole of Step 2.
:::

::: context skimming-orbit The orbit with the same period
Imagine a satellite orbiting just above the ground, with no air and no mountains. Gravity must supply exactly the pull that keeps it on its circle: $g=v^2/R$, so $v=\sqrt{gR}\approx7.9\,\mathrm{km/s}$. One lap takes $2\pi R/v=2\pi\sqrt{R/g}$ — the Schuler period. This is no accident. An object in that orbit is always "falling" straight toward the center, just as the long pendulum's bob always hangs toward it. Real low orbits are a little higher, so their periods are a bit longer: the International Space Station takes about $92$ minutes.
:::

::: context secular Where "secular" comes from
**Secular** comes from the Latin *saeculum*, "an age" or "a long span of time". Astronomers used it for slow, steady changes in planetary orbits that keep going one way century after century, as opposed to the periodic wobbles that come and go. In error analysis a secular term is the part that keeps growing, however long you wait.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="340" y2="44.4" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6,4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 43.0,170.0 46.0,170.0 49.0,169.9 52.0,169.8 55.0,169.6 58.0,169.3 61.0,168.9 64.0,168.4 67.0,167.7 70.0,166.9 73.0,166.0 76.0,164.9 79.0,163.6 82.0,162.2 85.0,160.7 88.0,158.9 91.0,157.1 94.0,155.1 97.0,153.0 100.0,150.8 103.0,148.4 106.0,146.0 109.0,143.6 112.0,141.1 115.0,138.6 118.0,136.1 121.0,133.6 124.0,131.2 127.0,128.8 130.0,126.4 133.0,124.2 136.0,122.1 139.0,120.1 142.0,118.3 145.0,116.5 148.0,115.0 151.0,113.6 154.0,112.3 157.0,111.2 160.0,110.3 163.0,109.5 166.0,108.8 169.0,108.3 172.0,107.9 175.0,107.6 178.0,107.4 181.0,107.3 184.0,107.2 187.0,107.2 190.0,107.2 193.0,107.2 196.0,107.2 199.0,107.1 202.0,107.0 205.0,106.8 208.0,106.5 211.0,106.1 214.0,105.6 217.0,104.9 220.0,104.2 223.0,103.2 226.0,102.1 229.0,100.9 232.0,99.4 235.0,97.9 238.0,96.2 241.0,94.3 244.0,92.3 247.0,90.2 250.0,88.0 253.0,85.6 256.0,83.3 259.0,80.8 262.0,78.3 265.0,75.8 268.0,73.3 271.0,70.8 274.0,68.4 277.0,66.0 280.0,63.7 283.0,61.4 286.0,59.3 289.0,57.3 292.0,55.5 295.0,53.7 298.0,52.2 301.0,50.8 304.0,49.5 307.0,48.4 310.0,47.5 313.0,46.7 316.0,46.0 319.0,45.5 322.0,45.1 325.0,44.8 328.0,44.6 331.0,44.5 334.0,44.4 337.0,44.4 340.0,44.4"/>
  <line x1="190" y1="170" x2="190" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="340" y1="170" x2="340" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">one period</text>
  <text x="330" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">two</text>
  <text x="200" y="68" font-size="12" fill="#b4232c">secular drift bR·t</text>
  <text x="50" y="44" font-size="12" fill="#1d6fd1">position error, 1 deg/h gyro bias</text>
  <text x="46" y="160" font-size="11" fill="#1f2a44">0</text>
</svg>
```

The blue curve (position error from a $1^\circ/\mathrm h$ gyro bias over two Schuler periods, about $314\,\mathrm{km}$ at the end) wobbles around the red straight line but never leaves it behind.
:::
