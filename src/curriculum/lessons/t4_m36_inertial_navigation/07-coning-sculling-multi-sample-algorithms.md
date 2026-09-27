---
id: l07-coning-sculling-multi-sample-algorithms
title: Coning and sculling corrections
minutes: 23
covers:
  - "Coning and sculling corrections and multi-sample algorithms"
---

Hold a book flat on a table, cover up. Tip it forward a quarter turn, then spin it a quarter turn to the left. Note where the cover ends up. Now start again and do the same two turns in the other order: spin first, then tip. The book ends up facing a different way. Two turns about different axes give a different answer depending on which comes first. Mathematicians say finite rotations **do not commute** — the order matters.

Now picture a pencil standing on its point, and move the top end in a small circle while the point stays put. The pencil sweeps out a cone. Nothing about that motion looks like a spin about the pencil's own length. Yet if you follow it closely, after each full circle the pencil has turned a tiny bit about its own axis. That leftover turn comes straight from the order-matters effect, and it adds up circle after circle.

This lesson is about what that does to a navigation computer. The attitude update of the previous lesson added up one small rotation per step, $\Delta\boldsymbol\theta=\boldsymbol\omega_{nb}^b\,\Delta t$, as though the turning rate were constant across each step. Under vibration that is wrong in a specific, unforgiving way. The true attitude picks up the pencil's leftover turn, which a plain sum of gyro samples cannot see. The velocity update has the same illness one level down. These errors are **systematic**: they push the same way every cycle, so they never average out. They are invisible on a quiet test bench. And they are why every real strapdown system reads its gyros and accelerometers several times faster than it updates attitude and velocity, combining the extra samples with a small correction first.

We will derive both corrections from one starting point — the exact rule for how a rotation grows — and put real numbers on each, so that "the correction matters" becomes an arithmetic fact you can check.

## Why the order of turns matters

A **[[rotation vector|rotation-vector]]** describes a turn with one arrow: it points along the axis of the turn, and its length is the angle in radians. Read $\boldsymbol\phi$ as "phi". A small turn of $0.002\,\mathrm{rad}$ about the body $x$-axis is $\boldsymbol\phi=(0.002,0,0)$.

A gyro does not report attitude. It reports how far the body turned since the last sample. Real navigation gyros deliver these as **[[angle increments|delta-theta]]**: the integral of the body rate over each sample period, written $\Delta\boldsymbol\theta$ ("delta theta"). The navigation computer must build the attitude from a string of these increments.

The tempting move is to add them: two increments in a row make a turn of $\Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2$. That is exactly right when both turns are about the same axis — spin a wheel $10^\circ$, then $20^\circ$, and it has turned $30^\circ$. It is slightly wrong when the axes differ, because the book trick showed the order matters, and a plain sum has no idea which increment came first. The size of the mistake is set by the **[[cross product|cross-product]]** of the two increments, $\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2$. That cross product is zero for parallel turns and largest for turns at right angles.

## Coning: a drift that never averages out

**Coning motion** is the pencil's circle: rotation about two perpendicular body axes, each wobbling like a sine wave, a quarter cycle apart. One body axis then sweeps out a cone. On a rocket, engine and structure vibration shakes the IMU in exactly this way, many times a second.

To see what the plain sum misses, we need the exact rule for how the rotation vector grows. Let $\boldsymbol\phi(t)$ be the rotation of the body since the start of the current compute interval, so $\boldsymbol\phi(0)=\mathbf 0$. Let $\boldsymbol\omega$ ("omega") be the body rate the gyro senses. The exact rule, found by John Bortz and called the **[[Bortz equation|bortz]]**, is

$$
\dot{\boldsymbol\phi} = \boldsymbol\omega + \tfrac12\boldsymbol\phi\times\boldsymbol\omega + \left[\text{terms of order }\phi^2\right]\boldsymbol\phi\times(\boldsymbol\phi\times\boldsymbol\omega).
$$

Read $\dot{\boldsymbol\phi}$ as "phi dot", the rate of change of $\boldsymbol\phi$. The first term, $\boldsymbol\omega$, is the plain sum: if it were alone, $\boldsymbol\phi$ would be $\int_0^t\boldsymbol\omega\,ds$ and adding increments would be exact. The second term is the order-matters correction. The last term is smaller than the second by another factor of $\phi^2$. Over one compute interval $\phi$ is a few thousandths of a radian, so $\phi^2$ is a few millionths, and we can drop it:

$$
\dot{\boldsymbol\phi}\approx\boldsymbol\omega+\tfrac12\boldsymbol\phi\times\boldsymbol\omega .
$$

That second term is the whole of coning error. For rotation about one fixed axis, $\boldsymbol\phi$ stays parallel to $\boldsymbol\omega$, their cross product is zero, and the term vanishes. Under rotation about two axes at once it does not vanish. Integrating only $\boldsymbol\omega$ — what naive rate integration does — silently throws it away.

::: key Coning error
Because finite rotations do not commute, integrating raw angular rate under two-axis quadrature motion accumulates a systematic drift about the third axis. It scales with the square of the cone angle times the frequency, and is invisible in static tests.
:::

### The two-sample correction

We cannot integrate the Bortz term exactly, because we only see the gyro through its increments. So we make the simplest honest guess about what happened between samples. Split the compute interval into two equal sub-intervals of length $\Delta t$. The gyro gives the two increments $\Delta\boldsymbol\theta_1$ and $\Delta\boldsymbol\theta_2$. Assume the rate changed in a straight line across the whole interval, $\boldsymbol\omega(t)=\mathbf a+\mathbf b t$. That is a constant angular acceleration, the natural two-number fit to two samples. Integrate the Bortz correction for this profile, then write $\mathbf a$ and $\mathbf b$ in terms of the two increments. Almost everything cancels, and what is left is

$$
\boldsymbol\theta_{2\Delta t} \approx \Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2 + \tfrac23\,\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2 .
$$

The rotation for the whole interval is the plain sum plus two thirds of the cross product of the two increments. The navigation computer feeds this corrected rotation vector to the attitude update of the previous lesson, once per compute interval.

::: key The two-sample coning correction
$\boldsymbol\theta = \Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2+\tfrac23(\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2)$. The cross-product term is the whole algorithm. It is exactly zero when the two increments are parallel (pure single-axis rotation, no coning to correct) and largest when they are at right angles.
:::

::: note Why it has to be two thirds
Put $t=0$ at the start of the interval, so it ends at $t=2\Delta t$. With $\boldsymbol\omega(t)=\mathbf a+\mathbf b t$, the two increments are

$$
\Delta\boldsymbol\theta_1=\int_0^{\Delta t}\boldsymbol\omega\,dt=\mathbf a\Delta t+\tfrac12\mathbf b\Delta t^2,\qquad \Delta\boldsymbol\theta_2=\int_{\Delta t}^{2\Delta t}\boldsymbol\omega\,dt=\mathbf a\Delta t+\tfrac32\mathbf b\Delta t^2 .
$$

Solving these two equations for the two unknowns gives $\mathbf a=(3\Delta\boldsymbol\theta_1-\Delta\boldsymbol\theta_2)/2\Delta t$ and $\mathbf b=(\Delta\boldsymbol\theta_2-\Delta\boldsymbol\theta_1)/\Delta t^2$.

Inside the small correction term, $\boldsymbol\phi$ can be replaced by its first approximation, $\boldsymbol\phi(t)\approx\mathbf a t+\tfrac12\mathbf b t^2$. Then

$$
\boldsymbol\phi\times\boldsymbol\omega=(\mathbf a t+\tfrac12\mathbf b t^2)\times(\mathbf a+\mathbf b t)=\tfrac12 t^2\,\mathbf a\times\mathbf b ,
$$

because $\mathbf a\times\mathbf a=\mathbf 0$, $\mathbf b\times\mathbf b=\mathbf 0$ and $\tfrac12 t^2\,\mathbf b\times\mathbf a=-\tfrac12 t^2\,\mathbf a\times\mathbf b$. Integrating $\tfrac12$ of this from $0$ to $2\Delta t$ gives $\tfrac14\cdot\tfrac{8\Delta t^3}{3}\,\mathbf a\times\mathbf b=\tfrac23\Delta t^3\,\mathbf a\times\mathbf b$.

Now the other side: $\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2=(\mathbf a\Delta t+\tfrac12\mathbf b\Delta t^2)\times(\mathbf a\Delta t+\tfrac32\mathbf b\Delta t^2)=(\tfrac32-\tfrac12)\Delta t^3\,\mathbf a\times\mathbf b=\Delta t^3\,\mathbf a\times\mathbf b$. So the correction is exactly $\tfrac23\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2$ for this straight-line rate model. A symbolic check in Python confirms it with every other term cancelling.
:::

::: example Naive against corrected, and how much the correction buys
Drive a simulated gyro with the classic coning motion: sine-wave rotation about the body $x$- and $y$-axes, $90^\circ$ apart in phase, amplitude $\alpha=1^\circ$ ("alpha", the cone's half-angle), frequency $20\,\mathrm{Hz}$. So the coning angular frequency is $\Omega=2\pi\times20\,\mathrm{rad/s}$ ("capital omega"). Sample at $200\,\mathrm{Hz}$, which is ten samples per coning cycle, and process them in pairs. Integrate attitude for $200$ cycles ($10\,\mathrm s$) both ways. The gyro model delivers true angle increments, as a real navigation gyro does.

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

alpha, Omega = np.deg2rad(1.0), 2*np.pi*20.0     # cone half-angle, coning frequency

def angle(t):
    """Integral of the body rates (alpha*Omega*cos, alpha*Omega*sin, 0) from 0 to t."""
    return np.array([alpha*np.sin(Omega*t), alpha*(1 - np.cos(Omega*t)), 0.0])

def rotvec_to_dcm(theta):
    return R.from_rotvec(theta).as_matrix()

dt = 1/200.0                                     # gyro sample period
C_naive, C_corr, t = np.eye(3), np.eye(3), 0.0
for _ in range(1000):                            # 1000 pairs = 10 s = 200 coning cycles
    d1 = angle(t + dt) - angle(t)                # the gyro's two angle increments
    d2 = angle(t + 2*dt) - angle(t + dt)
    C_naive = C_naive @ rotvec_to_dcm(d1 + d2)
    C_corr  = C_corr  @ rotvec_to_dcm(d1 + d2 + (2/3)*np.cross(d1, d2))
    t += 2*dt

truth = 0.5*alpha**2*Omega
naive = R.from_matrix(C_naive).as_rotvec()[2]/t
corr  = R.from_matrix(C_corr).as_rotvec()[2]/t
print(f"{truth:.5e} {naive:.5e} {corr:.5e}")
print(f"{(naive-truth)/truth:+.4f} {(corr-truth)/truth:+.4f}")
# 1.91397e-02 1.44824e-02 1.90405e-02
# -0.2433 -0.0052
```

Read the three numbers as turn rates about the body $z$-axis, the axis neither wobble touches.

- **Truth**, from the formula the next section derives: $1.914\times10^{-2}\,\mathrm{rad/s}$.
- **Naive** (plain sum of each pair): $1.448\times10^{-2}\,\mathrm{rad/s}$, which is $24.3\%$ low.
- **Corrected** (two-sample coning term): $1.904\times10^{-2}\,\mathrm{rad/s}$, which is $0.52\%$ low.

The correction cuts the error from $24.3\%$ to $0.52\%$, a factor of about $47$. Doubling the sample rate to $400\,\mathrm{Hz}$ in the same code shrinks the corrected error to about $0.05\%$ — the straight-line fit gets better fast as the samples crowd closer together.

Sanity check: $1.914\times10^{-2}\,\mathrm{rad/s}$ is about $3950^\circ/\mathrm h$. A $1^\circ$ wobble is tiny, but at $20\,\mathrm{Hz}$ it produces a turn rate hundreds of times larger than Earth's $15^\circ/\mathrm h$. That is why coning cannot be ignored.
:::

## How large the drift really is

The "true coning rate" is how fast the missing rotation piles up. It comes from averaging the Bortz correction term over a cycle. For this motion, $\boldsymbol\phi(t)\approx\alpha(\sin\Omega t,\,1-\cos\Omega t,\,0)$ to first order. The $z$-part of $\tfrac12\boldsymbol\phi\times\boldsymbol\omega$ works out to $\tfrac12\alpha^2\Omega(1-\cos\Omega t)$. The cosine averages to zero over a cycle, leaving

$$
\dot\theta_{\text{coning}} = \frac{\alpha^2\Omega}{2}.
$$

Read $\dot\theta_{\text{coning}}$ as "theta dot coning", the drift rate about the third axis.

Two independent checks confirm the factor of one half. First, a high-precision integration of the exact attitude equations (no Bortz shortcut at all) gives $1.9135\times10^{-2}\,\mathrm{rad/s}$ for $\alpha=1^\circ$ and $\Omega=2\pi\times20\,\mathrm{rad/s}$. The formula gives $1.9140\times10^{-2}\,\mathrm{rad/s}$. They agree to four figures; the tiny gap is there because $1^\circ$ is small but not zero.

Second, there is a purely geometric route. The body axis traces a cone of half-angle $\alpha$. Carrying anything around a closed loop like this leaves it turned by an amount equal to the **[[solid angle|solid-angle]]** the loop encloses — the same effect that makes a Foucault pendulum's swing turn through the day. A cone of half-angle $\alpha$ encloses a solid angle of $2\pi(1-\cos\alpha)$, which is close to $\pi\alpha^2$ for small $\alpha$. One cycle takes $2\pi/\Omega$ seconds. Divide the angle by the time and you get $\alpha^2\Omega/2$ again.

::: example Why halving the cone angle beats halving the frequency
The drift rate goes as $\alpha^2\Omega$. Doubling the frequency doubles the drift. Doubling the amplitude quadruples it.

- $2^\circ$ at $20\,\mathrm{Hz}$ drifts $\left(2^\circ/1^\circ\right)^2=4$ times faster than $1^\circ$ at $20\,\mathrm{Hz}$.
- $1^\circ$ at $40\,\mathrm{Hz}$ drifts only $40/20=2$ times faster than $1^\circ$ at $20\,\mathrm{Hz}$.

With numbers: $1^\circ$ at $20\,\mathrm{Hz}$ gives $1.914\times10^{-2}\,\mathrm{rad/s}$, so $2^\circ$ at $20\,\mathrm{Hz}$ gives $7.656\times10^{-2}\,\mathrm{rad/s}$, while $1^\circ$ at $40\,\mathrm{Hz}$ gives $3.828\times10^{-2}\,\mathrm{rad/s}$.

On a launch vehicle, the vibration amplitude follows how strongly the structure resonates, and the frequency follows what is shaking it. This lopsided scaling is why an IMU mount that halves the vibration *amplitude* is worth far more than one that merely shifts the main *frequency*.
:::

## Sculling: the same trouble in the velocity

Think of **[[sculling|sculling-word]]** a boat: one oar at the back, swept side to side while the blade twists back and forth. Each stroke on its own pushes left or right, and the pushes seem to cancel. But the twist is timed with the sweep, so a little forward push survives every stroke, and the boat moves ahead. Two wiggles that are each zero on average, timed together, give a steady push.

An IMU under vibration does the same thing to itself. If the body rocks back and forth *and* shakes sideways, in step with each other, the accelerometer's readings are being turned by the rocking at just the moment they are large. Added up naively, in body axes, the result misses a steady push. That is **sculling error**.

To write it down, the true velocity change over the interval must account for the body turning while the specific force (the push the accelerometer measures) is being collected:

$$
\Delta\mathbf v = \int_0^{2\Delta t}\mathbf C_b(t)\,\mathbf f^b(t)\,dt ,
$$

where $\mathbf f^b$ is specific force in body axes and $\mathbf C_b(t)\approx\mathbf I+[\boldsymbol\theta(t)\times]$ is the rotation of the body since the start of the interval. (Read $[\boldsymbol\theta\times]$ as "theta cross": the matrix that takes the cross product with $\boldsymbol\theta$.) Multiplying out gives $\Delta\mathbf v \approx \Delta\mathbf v_{sf} + \boldsymbol\nu$. Here $\Delta\mathbf v_{sf}=\int\mathbf f^b\,dt=\Delta\mathbf v_1+\Delta\mathbf v_2$ is the plain sum of the two accelerometer increments, and

$$
\boldsymbol\nu=\int_0^{2\Delta t}\boldsymbol\theta(t)\times\mathbf f^b(t)\,dt
$$

is the whole correction ($\boldsymbol\nu$ is the Greek letter "nu"). There is no extra one-half in front here. That one-half belonged to the Bortz equation for the rotation vector; this is a first-order rotation of an ordinary vector.

Fit the same straight-line model to both the rate and the specific force, and write $\boldsymbol\nu$ in terms of the two gyro increments ($\Delta\boldsymbol\theta_1,\Delta\boldsymbol\theta_2$) and the two accelerometer increments ($\Delta\mathbf v_1,\Delta\mathbf v_2$). It splits cleanly in two:

$$
\boldsymbol\nu \approx \underbrace{\tfrac12(\Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2)\times(\Delta\mathbf v_1+\Delta\mathbf v_2)}_{\text{rotate by the mid-interval attitude}} + \underbrace{\tfrac23\big(\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2\big)}_{\text{sculling correction}} .
$$

A symbolic check confirms this exactly for the straight-line model.

- The **first term** is bookkeeping. It says: rotate the summed specific force by half of the interval's total rotation, not by none — the natural halfway choice. Any sensible mechanization already includes it.
- The **second term** is the true **sculling correction**. Its shape explains sculling's defining property at a glance. Under steady rotation and steady specific force, $\Delta\boldsymbol\theta_1\approx\Delta\boldsymbol\theta_2$ and $\Delta\mathbf v_1\approx\Delta\mathbf v_2$. Call them $\mathbf d$ and $\mathbf e$. The term becomes $\tfrac23(\mathbf d\times\mathbf e+\mathbf e\times\mathbf d)=\mathbf 0$, because swapping the order of a cross product flips its sign.

So sculling is exactly zero under smooth motion. It exists only when the two halves of the interval disagree — which is what vibration that couples rocking and shaking does, and what a quiet bench test never can.

::: key Sculling error
The velocity-channel analogue of coning: correlated angular and linear vibration produces a systematic velocity error when specific force is integrated naively. It is corrected with multi-sample sculling algorithms; the two-sample version adds $\tfrac23(\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2)$ to the specific-force sum after that sum has been rotated by half the interval's total rotation. Like coning, it vanishes under steady motion and is invisible in a static test.
:::

::: warning Keep the two coefficients straight
Coning carries a $\tfrac12$ inside the Bortz equation and a $\tfrac23$ in its two-sample formula. The sculling integral has no $\tfrac12$ in front, its rotation bookkeeping term carries a $\tfrac12$, and its two-sample correction carries a $\tfrac23$. Mixing these up gives an algorithm that compiles, runs, and removes only part of the error. Test any implementation against a case whose answer you know, like the resonance below.
:::

::: example Rectification from a resonance, quantified
Take rocking about the body $x$-axis, $\omega_x(t)=\alpha\Omega\cos\Omega t$, with $\alpha=1^\circ$. So the rocking angle is $\theta_x(t)=\alpha\sin\Omega t$. A resonance couples it to shaking along $y$, a quarter cycle behind the rate: $f_y(t)=A\Omega\sin\Omega t$ with $A=0.5\,\mathrm{m/s}$ and the same $\Omega=2\pi\times20\,\mathrm{rad/s}$.

The $z$-part of $\boldsymbol\theta\times\mathbf f$ is $\theta_x f_y=\alpha A\Omega\sin^2\Omega t$. A sine squared is never negative, and it averages to one half. So the average push is

$$
\dot v_{\text{scull}}=\tfrac12\alpha A\Omega .
$$

Put in the numbers: $\alpha=0.017453\,\mathrm{rad}$, so $\tfrac12\times0.017453\times0.5\times125.66 = 0.5483\,\mathrm{m/s^2}$.

A high-precision integration of the exact, uncorrected equations shows the $z$-velocity growing at a steady $0.5483\,\mathrm{m/s}$ every second. It is not wobbling around zero; it is piling up, and it matches the formula to four figures.

Run for one minute uncorrected and this single vibration mode injects $0.5483\times60=32.9\,\mathrm{m/s}$ of false velocity. That is about fifty times the $0.69\,\mathrm{m/s}$ that accelerometer bias instability produced over a whole hour in the random-walk lesson. And a static calibration would never reveal it: set $A=0$ or $\alpha=0$ and the rectification collapses to exactly zero.
:::

## Multi-sample algorithms

Two samples per compute interval fit the rate and the specific force with a straight line — a constant plus a ramp. That captures the leading error. But if the vibration is fast compared with the compute interval, the true signal curves a lot inside one interval, a straight line fits it badly, and the leftover error grows.

The general fix samples the gyro and accelerometer $N$ times per interval and fits a higher-order curve through the sub-samples. The coning and sculling coefficients are then no longer the single $\tfrac23$ of the two-sample case. They become small tables of numbers, one set for each $N$, derived by the same Bortz-equation route with a higher-order fit. Paul Savage's work tabulates them up to $N=8$ and beyond, and his *Strapdown Analytics* is still the standard reference.

The engineering trade is between **sample rate** — which costs sensor bandwidth and processing — and **how fast a vibration** the mechanization can absorb without leaving a coning or sculling bias. A launch vehicle's structural modes run into the hundreds of hertz. That environment is what makes this trade a real one rather than a refinement.

::: warning The correction cannot fix aliasing
Coning and sculling corrections fix a *modelling* error in how samples are combined. They cannot fix **[[aliasing|aliasing]]**, where the vibration approaches or passes half the sample rate, so the samples themselves no longer describe it. If the coning frequency in the first example rose to $95\,\mathrm{Hz}$ with the same $200\,\mathrm{Hz}$ sampling, there would be barely two samples per cycle. No coefficient rescues that. The fix is a faster sensor, not a better formula.
:::

## Check yourself

::: check
A gyro reports two consecutive increments $\Delta\boldsymbol\theta_1=(2,0,0)\times10^{-3}\,\mathrm{rad}$ and $\Delta\boldsymbol\theta_2=(0,3,0)\times10^{-3}\,\mathrm{rad}$. Compute the coning-corrected rotation vector and say which axis the correction acts on.
:::

::: answer
The cross product, component by component:

$$
\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2 = (0\cdot0-0\cdot3,\;0\cdot0-2\cdot0,\;2\cdot3-0\cdot0)\times10^{-6}=(0,0,6)\times10^{-6}\,\mathrm{rad}.
$$

Two thirds of that is $\tfrac23\times6\times10^{-6}=4\times10^{-6}\,\mathrm{rad}$ about $z$. So $\boldsymbol\theta=(2.000,\,3.000,\,0.004)\times10^{-3}\,\mathrm{rad}$. The correction acts entirely on the axis neither raw increment touches — the third axis — because a cross product is always perpendicular to both of its inputs.
:::

::: check
Why does the coning correction vanish when $\Delta\boldsymbol\theta_1$ and $\Delta\boldsymbol\theta_2$ are parallel, and what physical motion does that describe?
:::

::: answer
The cross product of two parallel vectors is zero, so $\tfrac23\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2=\mathbf 0$ whenever the two increments point the same way. Physically this is rotation about one fixed axis: the body may turn faster or slower from one sub-interval to the next, but it never sweeps a cone. Turns about one fixed axis commute exactly — $10^\circ$ then $20^\circ$ is the same as $20^\circ$ then $10^\circ$ — so there is nothing for a correction to fix.
:::

::: check
A sculling test shows zero rectified velocity, even though a spectrum analyzer shows both the gyro and the accelerometer oscillating at the same frequency. What must be true of the two signals, and name one way that could happen physically.
:::

::: answer
The rectified push comes from the average of $\boldsymbol\theta\times\mathbf f$ over a cycle. In the worked example, the rocking *angle* and the shaking force were in step (both $\propto\sin\Omega t$), so their product $\sin^2\Omega t$ never went negative and averaged to one half. If instead the angle and the force are a quarter cycle apart — for example angle $\propto\sin\Omega t$ and force $\propto\cos\Omega t$ — the product is $\sin\Omega t\cos\Omega t=\tfrac12\sin2\Omega t$, which averages to zero. Equivalently, the gyro's *rate* signal is then in phase or in anti-phase ($0^\circ$ or $180^\circ$) with the accelerometer signal, instead of a quarter cycle apart as in the example, which was chosen to give the largest effect. Physically this happens when one vibration mode drives the rocking and the shaking through a path with no quarter-cycle lag between the rocking *rate* and the push — for instance a mode that rocks the IMU mount fastest at the very instants it is shoved hardest sideways.
:::

::: check
Explain why a two-sample coning algorithm running at $200\,\mathrm{Hz}$ handles a $20\,\mathrm{Hz}$ vibration far better than a $90\,\mathrm{Hz}$ one on the same hardware. Use the derivation, not just "higher frequency is worse".
:::

::: answer
The $\tfrac23$ was derived by assuming the rate changes in a straight line across the compute interval. That fit is only as good as the assumption that the true rate barely curves inside one interval. At $20\,\mathrm{Hz}$ sampled at $200\,\mathrm{Hz}$, each compute interval (two $5\,\mathrm{ms}$ samples, so $10\,\mathrm{ms}$) covers a fifth of a vibration cycle, where a sine wave is close to straight. At $90\,\mathrm{Hz}$ the same $10\,\mathrm{ms}$ covers $0.9$ of a cycle, where the sine wave bends right over and back. The derivation's own assumption fails — the problem is not just that the number is bigger — and no two-sample coefficient can fix a broken assumption.
:::

::: check
A $0.5^\circ$ coning motion at $50\,\mathrm{Hz}$ shakes an IMU. What is the true coning drift rate, in $\mathrm{rad/s}$ and in $^\circ/\mathrm h$, and how does it compare with the $1^\circ$, $20\,\mathrm{Hz}$ case?
:::

::: answer
$\alpha=0.5^\circ=8.727\times10^{-3}\,\mathrm{rad}$ and $\Omega=2\pi\times50=314.16\,\mathrm{rad/s}$. So

$$
\dot\theta_{\text{coning}}=\tfrac12\alpha^2\Omega=\tfrac12\times(8.727\times10^{-3})^2\times314.16=1.196\times10^{-2}\,\mathrm{rad/s},
$$

about $2470^\circ/\mathrm h$. Compared with $1^\circ$ at $20\,\mathrm{Hz}$: halving the angle divides by $4$, and going from $20$ to $50\,\mathrm{Hz}$ multiplies by $2.5$, so the ratio is $2.5/4=0.625$. Check: $0.625\times1.914\times10^{-2}=1.196\times10^{-2}\,\mathrm{rad/s}$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{\boldsymbol\phi}\approx\boldsymbol\omega+\tfrac12\boldsymbol\phi\times\boldsymbol\omega$ | Bortz equation, kept to the order where coning first appears |
| $\boldsymbol\theta=\Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2+\tfrac23\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2$ | Two-sample coning correction |
| $\dot\theta_{\text{coning}}=\alpha^2\Omega/2$ | True coning drift rate; solid angle $2\pi(1-\cos\alpha)$ per cycle |
| $\Delta\mathbf v\approx\Delta\mathbf v_1+\Delta\mathbf v_2+\tfrac12\Delta\boldsymbol\theta_{\text{tot}}\times(\Delta\mathbf v_1+\Delta\mathbf v_2)+\tfrac23(\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2)$ | Velocity increment with rotation bookkeeping and sculling correction |
| $\dot v_{\text{scull}}=\tfrac12\alpha A\Omega$ | Rectified velocity rate from in-step rocking and shaking |
| Both vanish for smooth motion | Coning needs two-axis rotation; sculling needs correlated rocking and shaking |
| $N$-sample algorithms | Higher-order fit through more sub-samples; trades sensor bandwidth for tolerance of faster vibration |

The mechanization loop is now complete and handles vibration correctly. The next two lessons ask what happens when it runs unaided for a long time: first the Schuler oscillation, the feedback that keeps horizontal errors from growing without limit, and then the full free-inertial error budget that it shapes.

::: context rotation-vector One arrow for any turn
Any change of orientation, however complicated the path, can be done as a single turn about one fixed axis — a result due to Leonhard Euler. So one arrow is enough to describe it: point it along that axis and make its length the angle in radians. The direction follows the right-hand rule: curl your right fingers the way the body turned, and your thumb points along the arrow. For the small turns in one compute interval, the three components of the arrow are almost the same as three small angles about the three body axes.
:::

::: context delta-theta Why gyros report increments
A navigation gyro does not usually report "the rate right now". It reports how far it turned since the last sample, with the integration done inside the sensor. A ring laser gyro does this naturally: it counts fringes, and each count is a fixed small angle. Integrating inside the sensor means no motion between samples is lost, even motion faster than the sample rate. That is why the algorithms in this lesson are written in terms of $\Delta\boldsymbol\theta$ and $\Delta\mathbf v$, not rates.
:::

::: context cross-product A quick cross-product refresher
For $\mathbf u=(u_1,u_2,u_3)$ and $\mathbf w=(w_1,w_2,w_3)$,

$$
\mathbf u\times\mathbf w=(u_2w_3-u_3w_2,\;u_3w_1-u_1w_3,\;u_1w_2-u_2w_1).
$$

The result is perpendicular to both inputs, and its length is $|\mathbf u||\mathbf w|\sin\gamma$, where $\gamma$ is the angle between them. So it is zero for parallel vectors and largest for perpendicular ones. Swapping the order flips the sign: $\mathbf w\times\mathbf u=-\mathbf u\times\mathbf w$. Coning lives in exactly this sign flip — "$x$ then $y$" and "$y$ then $x$" differ by a turn about $z$.
:::

::: context bortz Where the equation comes from
John Bortz published the rotation-vector differential equation in a 1971 paper on strapdown inertial navigation. Its value is that it describes the rotation vector directly, so a computer can build one rotation per compute interval from many gyro samples and apply it once. Almost every modern coning algorithm, including Savage's multi-sample families, starts from it. The $\tfrac12\boldsymbol\phi\times\boldsymbol\omega$ term is the first sign of non-commutativity; the long bracketed term only matters for turns of many degrees per interval.
:::

::: context solid-angle Solid angle and the turn you get for free
A **solid angle** is the 3D version of an ordinary angle: how much of the sky a shape covers, as seen from a point. It is measured in steradians, and the whole sky is $4\pi$. A cone of half-angle $\alpha$ covers $2\pi(1-\cos\alpha)$ steradians. The surprising fact is geometric: carry a direction around a closed loop on a sphere without ever twisting it, and it comes back turned by the solid angle the loop encloses. A Foucault pendulum at latitude $\varphi$ is carried around a loop each day and turns by $2\pi\sin\varphi$ — the same effect, on a slower clock.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="185" x2="180" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="180" y1="185" x2="120" y2="50" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="180" y1="185" x2="240" y2="50" stroke="#1f2a44" stroke-width="1.2"/>
  <ellipse cx="180" cy="50" rx="60" ry="14" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="185" x2="218.6" y2="60.7" stroke="#b4232c" stroke-width="3"/>
  <circle cx="218.6" cy="60.7" r="4" fill="#b4232c"/>
  <path d="M180,145 A40,40 0 0,1 191.9,146.8" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="196" y="140" font-size="13" fill="#1f2a44">α</text>
  <path d="M244,58 L252,48 L240,46" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="256" y="42" font-size="12" fill="#1d6fd1">tip circles</text>
  <text x="228" y="100" font-size="12" fill="#b4232c">body axis</text>
  <text x="20" y="120" font-size="12" fill="#1f2a44">each loop leaves a</text>
  <text x="20" y="136" font-size="12" fill="#1f2a44">small net turn about</text>
  <text x="20" y="152" font-size="12" fill="#1f2a44">the body axis itself</text>
  <text x="186" y="26" font-size="11" fill="#6c7a93">cone axis</text>
</svg>
```

The red body axis sweeps the blue cone (the angle $\alpha$ is drawn far larger than a real $1^\circ$). The loop encloses a solid angle of $2\pi(1-\cos\alpha)$, and that is the net turn about the body's own axis each cycle.
:::

::: context sculling-word The rowing picture
To scull is to drive a boat with one oar over the stern, sweeping it side to side and twisting the blade on each stroke. The twist and the sweep are timed together, so every stroke leaves a small forward push even though the side-to-side motion cancels. The IMU version is the same: rocking and shaking, timed together, leave a steady push.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="45" x2="340" y2="45" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,45.0 45,40.8 50,36.9 55,33.2 60,30.1 65,27.7 70,26.0 75,25.1 80,25.1 85,26.0 90,27.7 95,30.1 100,33.2 105,36.9 110,40.8 115,45.0 120,49.2 125,53.1 130,56.8 135,59.9 140,62.3 145,64.0 150,64.9 155,64.9 160,64.0 165,62.3 170,59.9 175,56.8 180,53.1 185,49.2 190,45.0 195,40.8 200,36.9 205,33.2 210,30.1 215,27.7 220,26.0 225,25.1 230,25.1 235,26.0 240,27.7 245,30.1 250,33.2 255,36.9 260,40.8 265,45.0 270,49.2 275,53.1 280,56.8 285,59.9 290,62.3 295,64.0 300,64.9 305,64.9 310,64.0 315,62.3 320,59.9 325,56.8 330,53.1 335,49.2 340,45.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" stroke-dasharray="6,3" points="40,45.0 45,42.5 50,40.1 55,37.9 60,36.1 65,34.6 70,33.6 75,33.1 80,33.1 85,33.6 90,34.6 95,36.1 100,37.9 105,40.1 110,42.5 115,45.0 120,47.5 125,49.9 130,52.1 135,53.9 140,55.4 145,56.4 150,56.9 155,56.9 160,56.4 165,55.4 170,53.9 175,52.1 180,49.9 185,47.5 190,45.0 195,42.5 200,40.1 205,37.9 210,36.1 215,34.6 220,33.6 225,33.1 230,33.1 235,33.6 240,34.6 245,36.1 250,37.9 255,40.1 260,42.5 265,45.0 270,47.5 275,49.9 280,52.1 285,53.9 290,55.4 295,56.4 300,56.9 305,56.9 310,56.4 315,55.4 320,53.9 325,52.1 330,49.9 335,47.5 340,45.0"/>
  <text x="40" y="16" font-size="12" fill="#1d6fd1">rocking angle</text>
  <text x="150" y="16" font-size="12" fill="#1f2a44">and sideways push, in step</text>
  <line x1="40" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="130" x2="340" y2="130" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4,3"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40,150.0 45,148.3 50,143.4 55,136.2 60,127.9 65,120.0 70,113.8 75,110.4 80,110.4 85,113.8 90,120.0 95,127.9 100,136.2 105,143.4 110,148.3 115,150.0 120,148.3 125,143.4 130,136.2 135,127.9 140,120.0 145,113.8 150,110.4 155,110.4 160,113.8 165,120.0 170,127.9 175,136.2 180,143.4 185,148.3 190,150.0 195,148.3 200,143.4 205,136.2 210,127.9 215,120.0 220,113.8 225,110.4 230,110.4 235,113.8 240,120.0 245,127.9 250,136.2 255,143.4 260,148.3 265,150.0 270,148.3 275,143.4 280,136.2 285,127.9 290,120.0 295,113.8 300,110.4 305,110.4 310,113.8 315,120.0 320,127.9 325,136.2 330,143.4 335,148.3 340,150.0"/>
  <text x="40" y="98" font-size="12" fill="#1f2a44">their product: never below zero</text>
  <text x="250" y="172" font-size="11" fill="#b4232c">average = half the peak</text>
</svg>
```
:::

::: context aliasing Too few samples per wiggle
**Aliasing** is what happens when a signal changes faster than you sample it: the samples trace out a different, slower pattern that is not really there. The rule of thumb, from Harry Nyquist and Claude Shannon, is that you need more than two samples per cycle to capture a wave at all, and many more to capture its shape.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" points="30.0,70.0 31.9,64.4 33.9,59.1 35.8,54.1 37.8,49.6 39.7,45.9 41.6,43.0 43.6,41.0 45.5,40.1 47.4,40.2 49.4,41.3 51.3,43.4 53.2,46.4 55.2,50.3 57.1,54.8 59.1,59.9 61.0,65.3 62.9,70.9 64.9,76.4 66.8,81.8 68.8,86.7 70.7,91.0 72.6,94.6 74.6,97.4 76.5,99.2 78.4,100.0 80.4,99.7 82.3,98.4 84.2,96.2 86.2,93.0 88.1,89.0 90.1,84.4 92.0,79.3 93.9,73.8 95.9,68.2 97.8,62.7 99.7,57.4 101.7,52.6 103.6,48.4 105.6,44.9 107.5,42.3 109.4,40.6 111.4,40.0 113.3,40.4 115.2,41.9 117.2,44.3 119.1,47.6 121.1,51.7 123.0,56.4 124.9,61.6 126.9,67.1 128.8,72.6 130.8,78.1 132.7,83.4 134.6,88.1 136.6,92.2 138.5,95.6 140.4,98.0 142.4,99.5 144.3,100.0 146.2,99.4 148.2,97.8 150.1,95.3 152.1,91.8 154.0,87.6 155.9,82.8 157.9,77.6 159.8,72.1 161.8,66.5 163.7,61.0 165.6,55.9 167.6,51.2 169.5,47.2 171.4,44.0 173.4,41.7 175.3,40.3 177.2,40.0 179.2,40.8 181.1,42.5 183.1,45.2 185.0,48.8 186.9,53.1 188.9,58.0 190.8,63.3 192.7,68.8 194.7,74.4 196.6,79.8 198.6,84.9 200.5,89.5 202.4,93.4 204.4,96.5 206.3,98.6 208.2,99.8 210.2,99.9 212.1,99.0 214.1,97.1 216.0,94.3 217.9,90.6 219.9,86.2 221.8,81.2 223.8,75.9 225.7,70.3 227.6,64.7 229.6,59.3 231.5,54.3 233.4,49.9 235.4,46.1 237.3,43.1 239.2,41.1 241.2,40.1 243.1,40.1 245.1,41.2 247.0,43.3 248.9,46.3 250.9,50.1 252.8,54.6 254.7,59.6 256.7,65.0 258.6,70.6 260.6,76.1 262.5,81.5 264.4,86.4 266.4,90.8 268.3,94.4 270.2,97.2 272.2,99.1 274.1,99.9 276.1,99.8 278.0,98.5 279.9,96.3 281.9,93.2 283.8,89.3 285.8,84.7 287.7,79.6 289.6,74.1 291.6,68.5 293.5,63.0 295.4,57.7 297.4,52.8 299.3,48.6 301.2,45.1 303.2,42.4 305.1,40.7 307.1,40.0 309.0,40.4 310.9,41.8 312.9,44.1 314.8,47.4 316.8,51.4 318.7,56.1 320.6,61.3 322.6,66.8 324.5,72.4 326.4,77.9 328.4,83.1 330.3,87.9 332.2,92.0 334.2,95.4 336.1,97.9 338.1,99.5 340.0,100.0"/>
  <circle cx="30.0" cy="70.0" r="3.5" fill="#b4232c"/>
  <circle cx="61.0" cy="65.3" r="3.5" fill="#b4232c"/>
  <circle cx="92.0" cy="79.3" r="3.5" fill="#b4232c"/>
  <circle cx="123.0" cy="56.4" r="3.5" fill="#b4232c"/>
  <circle cx="154.0" cy="87.6" r="3.5" fill="#b4232c"/>
  <circle cx="185.0" cy="48.8" r="3.5" fill="#b4232c"/>
  <circle cx="216.0" cy="94.3" r="3.5" fill="#b4232c"/>
  <circle cx="247.0" cy="43.3" r="3.5" fill="#b4232c"/>
  <circle cx="278.0" cy="98.5" r="3.5" fill="#b4232c"/>
  <circle cx="309.0" cy="40.4" r="3.5" fill="#b4232c"/>
  <circle cx="340.0" cy="100.0" r="3.5" fill="#b4232c"/>
  <text x="30" y="20" font-size="12" fill="#1f2a44">95 Hz vibration, 200 Hz samples (red), 50 ms shown</text>
  <text x="30" y="122" font-size="11" fill="#1f2a44">barely two samples per wiggle: the dots cannot show its shape</text>
</svg>
```
:::
