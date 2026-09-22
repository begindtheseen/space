---
id: l06-unstable-booster-and-tvc
title: The aerodynamically unstable booster and its TVC loop
minutes: 19
covers:
  - aerodynamic instability of a boosting rocket
---

The last lesson ended with a moment that grows with angle of attack. This one turns that moment into motion. Divide by the vehicle's moment of inertia and you have an angular acceleration proportional to the angle itself — the equation of an inverted pendulum, whose solution is an exponential with a time-to-double of order a second. That exponential is the plant a launch-vehicle control engineer is handed. The only actuator that can hold it is the engine gimbal, and the thrust-vector control loop that closes around it is the most safety-critical loop on the vehicle: if it opens for more than a few seconds during the high-dynamic-pressure part of ascent, the vehicle breaks up.

This lesson derives the rigid-body pitch dynamics of a boosting rocket with thrust vector control, finds the unstable pole and its time constant, and works out what the instability demands of the controller: that the loop be closed always, that its gain exceed a minimum as well as stay below a maximum, that its bandwidth sit comfortably above the unstable pole, and that the actuator have the authority to hold it. It then designs a proportional-derivative attitude loop for a representative booster, checks its margins, and shows how the plant changes along the trajectory. The bending-notch exercise starts from exactly this plant.

## The pitch-plane equations of motion

Work in the pitch plane with small perturbations about the nominal gravity-turn trajectory. Let $\theta$ be the pitch attitude error (body axis relative to the commanded attitude), $\alpha$ the angle of attack, $\delta$ the gimbal angle of the thrust vector, $I$ the pitch moment of inertia about the centre of gravity, $m$ the mass, $T$ the thrust, $\ell_T$ the distance from the gimbal pivot to the centre of gravity, and $\ell_\alpha = x_{cg} - x_{cp}$ the distance from the centre of pressure forward to the centre of gravity (positive for the unstable arrangement). From the last lesson the aerodynamic moment is $N_\alpha \ell_\alpha \alpha$ with $N_\alpha = \bar{q} S C_{N\alpha}$.

Define $\delta$ positive in the sense that produces a positive (nose-up, $\alpha$-increasing) moment. Swinging the nozzle so the exhaust leaves at angle $\delta$ produces a lateral thrust component $T\sin\delta \approx T\delta$ at the tail, and its moment about the centre of gravity is $T \ell_T \delta$. The rotational equation of motion is

$$
I\,\ddot{\theta} = N_\alpha\,\ell_\alpha\,\alpha + T\,\ell_T\,\delta .
$$

Note that the lateral force from the gimbal points the *opposite* way to the normal force it is trimming: pushing the tail one way rotates the nose the other way. The lateral (translational) equation is therefore $m\ddot{z} = N_\alpha \alpha - T\delta$, with $z$ measured in the direction the normal force acts; the next lesson uses it.

The angle of attack is $\alpha = \theta + \alpha_w - \dot{z}/V$: the attitude error, plus the wind-induced angle $\alpha_w = w_\perp/V$, minus the rotation of the relative velocity caused by lateral drift. Over the seconds that matter for stability the velocity vector turns far more slowly than the attitude, so the **short-period approximation** drops the drift term and sets $\alpha \approx \theta + \alpha_w$. Dividing by $I$ and collecting constants,

$$
\ddot{\theta} = \mu_\alpha\,\theta + \mu_\delta\,\delta + \mu_\alpha\,\alpha_w,
\qquad
\mu_\alpha = \frac{N_\alpha\,\ell_\alpha}{I} = \frac{\bar{q} S C_{N\alpha}(x_{cg} - x_{cp})}{I},
\qquad
\mu_\delta = \frac{T\,\ell_T}{I}.
$$

$\mu_\alpha$ is the **aerodynamic moment coefficient** in units of $\mathrm{s^{-2}}$ — angular acceleration per radian of angle of attack — and $\mu_\delta$ is the **control moment coefficient**, angular acceleration per radian of gimbal. Both are positive for a launch vehicle. The wind enters as a disturbance through the same coefficient as the attitude, which is the origin of everything in the load-relief lesson.

## The unstable pole

With no wind and the gimbal fixed at zero, $\ddot\theta = \mu_\alpha\theta$. Try $\theta = e^{st}$: $s^2 = \mu_\alpha$, so $s = \pm\sqrt{\mu_\alpha}$. The transfer function from gimbal to attitude is

$$
G(s) = \frac{\theta(s)}{\delta(s)} = \frac{\mu_\delta}{s^2 - \mu_\alpha},
$$

with one stable pole at $-\sqrt{\mu_\alpha}$ and one **unstable pole** at $+\sqrt{\mu_\alpha}$. Any attitude error, however small, grows as $e^{\sqrt{\mu_\alpha}\,t}$, doubling every

$$
t_{\text{double}} = \frac{\ln 2}{\sqrt{\mu_\alpha}} .
$$

Compare a statically stable finned rocket, for which $\ell_\alpha < 0$ and $\mu_\alpha < 0$: then $s^2 = -|\mu_\alpha|$, the poles are $\pm j\sqrt{|\mu_\alpha|}$, and the rocket oscillates about the wind direction at its weathercock frequency instead of diverging. The sign of the static margin is the sign of $\mu_\alpha$, and it decides between an oscillator and an exponential.

::: example The unstable pole of a booster at max-Q
Take the vehicle of the previous lesson in the max-Q window: $\bar{q} = 31.3\ \mathrm{kPa}$, $S = 10.52\ \mathrm{m^2}$, $C_{N\alpha} = 4.0$ per radian, $x_{cg} - x_{cp} = 26\ \mathrm{m}$, mass 380 t, and a pitch inertia $I = 1.5 \times 10^8\ \mathrm{kg\cdot m^2}$ (a uniform 70 m rod of that mass would have $mL^2/12 = 1.6 \times 10^8$). Then

$$
N_\alpha = 31\,300 \times 10.52 \times 4.0 = 1.317 \times 10^6\ \mathrm{N/rad},
\qquad
\mu_\alpha = \frac{1.317 \times 10^6 \times 26}{1.5 \times 10^8} = 0.228\ \mathrm{s^{-2}} .
$$

The unstable pole is at $\sqrt{0.228} = 0.478\ \mathrm{rad/s}$ and the time to double is $\ln 2/0.478 = 1.45\ \mathrm{s}$. With $T = 7.6\ \mathrm{MN}$ and $\ell_T = 26\ \mathrm{m}$ the control coefficient is $\mu_\delta = 7.6 \times 10^6 \times 26/(1.5 \times 10^8) = 1.32\ \mathrm{s^{-2}}$: each radian of gimbal produces 1.32 rad/s² of pitch acceleration, or 0.023 rad/s² per degree. Trimming one radian of angle of attack takes $\mu_\alpha/\mu_\delta = 0.173$ radians of gimbal — the same $0.35^\circ$ per $2^\circ$ found last lesson from the moments directly.
:::

## What instability demands of the controller

**The loop must be closed, always.** An open-loop pitch program that worked for a stable vehicle would be fatal here: with the gimbal frozen, a 2° attitude error becomes 2.2° after one second, 3.0° after two, 4.4° after three and 6.9° after four, with the rate growing to 3°/s. At 31.3 kPa the load indicator $\bar{q}\alpha$ passes 140 kPa·deg by the third second, beyond most vehicles' structural certification. The vehicle does not tumble first; it breaks. A control outage of a few seconds in the high-$\bar{q}$ window is unrecoverable, which is why the TVC hydraulics, the flight computers and the gyros are redundant and why loss of gimbal authority is a loss-of-vehicle event rather than a degraded mode.

**There is a minimum gain.** Suppose the attitude loop is $\delta = -K_p\theta$. The closed-loop equation is $\ddot\theta = (\mu_\alpha - K_p\mu_\delta)\theta$, which is still unstable unless

$$
K_p > \frac{\mu_\alpha}{\mu_\delta} .
$$

Below that gain the gimbal cannot even produce the aerodynamic moment it is fighting. A stable aircraft has a gain margin only from above (too much gain oscillates); an unstable booster has a gain margin from *below* as well, and the low-gain margin $20\log_{10}(K_p\mu_\delta/\mu_\alpha)$ is a number you report alongside the usual one.

**The bandwidth must sit well above the unstable pole.** A rule of thumb from the Nyquist criterion, and from decades of launch vehicles, is that the loop's crossover frequency should be at least three to five times $\sqrt{\mu_\alpha}$: below that the phase margin collapses, and the response to a gust is too slow to keep $\alpha$ small. The unstable pole is not something you attenuate — it is something you must be faster than.

**Damping needs rate.** Proportional feedback alone gives $\ddot\theta + (K_p\mu_\delta - \mu_\alpha)\theta = 0$, an undamped oscillator. A rate term $K_d\dot\theta$ from the gyros supplies the damping; the launch-vehicle loop is fundamentally proportional-derivative, with an integral term added only for slow trim errors.

**The actuator must have the authority and the speed.** Gimbal angles of $\pm 5^\circ$ or so and rates of tens of degrees per second are typical; trim takes a fraction of a degree, gusts take a degree or two more, and the remainder is margin. Actuator lag adds phase loss at crossover, which is why actuator bandwidth must be several times the loop bandwidth.

::: key
A launch vehicle's centre of pressure is forward of its centre of mass, so any $\alpha$ produces a divergent moment: the pitch plant is $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$ with an unstable pole at $\sqrt{\mu_\alpha}$ and a time-to-double of order a second. The TVC loop must have bandwidth comfortably above the unstable pole and gain above $\mu_\alpha/\mu_\delta$, and a control outage of even a few seconds in the high-$\bar{q}$ window is unrecoverable.
:::

## Designing the PD attitude loop

Command the gimbal with attitude and rate feedback,

$$
\delta = -K_p\,\theta - K_d\,\dot\theta ,
$$

the signs chosen so that a positive attitude error produces a negative (nose-down) moment. Substituting into $\ddot\theta = \mu_\alpha\theta + \mu_\delta\delta$ gives the closed-loop characteristic equation

$$
s^2 + K_d\,\mu_\delta\, s + (K_p\,\mu_\delta - \mu_\alpha) = 0 .
$$

Match it to a standard second-order form $s^2 + 2\zeta\omega_n s + \omega_n^2$:

$$
K_p = \frac{\omega_n^2 + \mu_\alpha}{\mu_\delta}, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta} .
$$

The aerodynamic term appears as an addition to $\omega_n^2$ in $K_p$: part of the proportional gain is spent cancelling the instability before any of it produces stiffness.

::: example PD gains and margins for the booster
Choose a closed-loop natural frequency $\omega_n = 1.5\ \mathrm{rad/s}$ (about three times the unstable pole) and damping $\zeta = 0.7$. With $\mu_\alpha = 0.228$ and $\mu_\delta = 1.317$,

$$
K_p = \frac{1.5^2 + 0.228}{1.317} = 1.88\ \mathrm{rad/rad}, \qquad
K_d = \frac{2 \times 0.7 \times 1.5}{1.317} = 1.59\ \mathrm{s} .
$$

A one-degree attitude error commands 1.88° of gimbal; a rate of 1°/s commands 1.59°. The minimum gain is $\mu_\alpha/\mu_\delta = 0.173$, so the low-gain margin is $20\log_{10}(1.88/0.173) = 20.7\ \mathrm{dB}$. Add a second-order gimbal actuator with a 4 Hz natural frequency and 0.7 damping and evaluate the loop gain $L(j\omega) = (K_p + jK_d\omega)\,A(j\omega)\,\mu_\delta/(-\omega^2 - \mu_\alpha)$ numerically: the gain crossover is at 2.27 rad/s (0.36 Hz), the phase margin is 55°, and the gain can be raised by 23.8 dB before the actuator's phase lag destabilises the loop. Both gain margins exceed the traditional 6 dB requirement and the phase margin exceeds 30° with room to spare. Without the actuator model the phase margin would read 62°; the 7° difference is the actuator's lag at crossover, and it is why actuator dynamics are never left out of a launch-vehicle stability analysis.
:::

The Nyquist picture is worth carrying in your head. Because the plant has one right-half-plane pole, a stable closed loop requires the Nyquist plot of $L$ to encircle $-1$ exactly once counter-clockwise. At zero frequency $L(0) = -K_p\mu_\delta/\mu_\alpha = -10.9$: the plot *starts* on the negative real axis to the left of $-1$, then sweeps around it as frequency rises. Reduce the gain until $L(0)$ reaches $-1$ and you have lost the low-gain margin; add phase lag until the high-frequency part of the sweep crosses inside $-1$ and you have lost the high-gain margin. Any Bode plot of an unstable-plant loop must be read with this in mind: the phase at low frequency sits at $-180^\circ$ *by design*.

```python
import numpy as np

mu_a, mu_d = 0.228, 1.317            # s^-2
Kp, Kd = 1.88, 1.59                  # rad/rad, s
wa, za = 2*np.pi*4.0, 0.7            # gimbal actuator

w = np.logspace(-2, 3, 20000)
s = 1j*w
A = wa**2 / (s**2 + 2*za*wa*s + wa**2)
L = (Kp + Kd*s) * A * mu_d / (s**2 - mu_a)
mag_db = 20*np.log10(abs(L))
i = np.argmin(abs(mag_db))           # gain crossover
print(w[i], np.degrees(np.angle(L[i])) + 180)   # -> 2.27 rad/s, PM ~ 55 deg
```

## The plant changes along the trajectory

Neither coefficient is constant. $\mu_\alpha$ is proportional to $\bar{q}$, so it is zero at lift-off, peaks near max-Q and vanishes again above about 60 km; it also carries the Mach-dependence of $C_{N\alpha}$ and $x_{cp}$, both of which shift fastest through the transonic band. $\mu_\delta$ grows through the burn as the mass and inertia fall while thrust rises toward its vacuum value. The controller's gains are therefore **scheduled** against time or Mach number so that the closed-loop $\omega_n$ and $\zeta$ stay where the designer wants them: high enough near max-Q to beat the unstable pole, lower late in the burn when the plant has become a nearly pure double integrator $\mu_\delta/s^2$ and the bending modes, not aerodynamics, set the limits.

Uncertainty rides on top. The wind-tunnel database for $C_{N\alpha}$ and $x_{cp}$ is good to perhaps 10–20 % in the transonic range; the inertia is known well but the centre of gravity drifts with propellant slosh and loading; the actuator's dynamics vary with load. A controller designed for the nominal $\mu_\alpha$ must remain stable, with margins, across the dispersed values — which is why the low-gain margin of 20 dB in the example is not extravagant. Halve the assumed inertia or double the assumed $C_{N\alpha}$ and $\mu_\alpha$ doubles; the design must survive that.

::: example Time to double along the flight
Early in flight, at 20 s ($\bar{q} = 5.2\ \mathrm{kPa}$), the aerodynamic coefficient is $\mu_\alpha \approx 0.228 \times 5.2/31.3 = 0.038\ \mathrm{s^{-2}}$ (ignoring the Mach dependence), the pole is at 0.19 rad/s and the time to double is 3.6 s — slow enough that a modest loop copes easily. At max-Q it is 1.45 s. At 100 s ($\bar{q} = 5.4\ \mathrm{kPa}$, but the inertia has fallen to perhaps $1.0 \times 10^8$) it is back near 3 s, and by 130 s ($\bar{q} < 1\ \mathrm{kPa}$) the divergence is so slow that the plant is effectively a double integrator. The controller has to be fastest exactly when the loads are largest.
:::

::: warning
$\mu_\alpha$ is not the pole. The pole is $\sqrt{\mu_\alpha}$, and the time constant is $1/\sqrt{\mu_\alpha}$. Doubling the aerodynamic moment slope makes the divergence $\sqrt{2}$ times faster, not twice as fast; conversely, a vehicle with four times the inertia of another at the same $\bar{q}$ and geometry has a pole only half as fast.
:::

::: warning
The short-period approximation $\alpha \approx \theta$ is fine for stability analysis over a few seconds but not for load or trajectory analysis over a minute. The drift term $\dot z/V$ and the wind term $\alpha_w$ change the angle of attack the airframe actually sees; the next lesson keeps them.
:::

## Check yourself

::: check
A small launcher has $\bar{q} = 40\ \mathrm{kPa}$, $S = 1.5\ \mathrm{m^2}$, $C_{N\alpha} = 3$ per radian, $x_{cg} - x_{cp} = 6\ \mathrm{m}$ and $I = 2 \times 10^6\ \mathrm{kg\cdot m^2}$. Find $\mu_\alpha$, the unstable pole and the time to double.
:::

::: answer
$N_\alpha = 40\,000 \times 1.5 \times 3 = 1.8 \times 10^5\ \mathrm{N/rad}$, so $\mu_\alpha = 1.8 \times 10^5 \times 6 / (2 \times 10^6) = 0.54\ \mathrm{s^{-2}}$. The pole is at $\sqrt{0.54} = 0.735\ \mathrm{rad/s}$ and the time to double is $\ln 2/0.735 = 0.94\ \mathrm{s}$. Small vehicles have small inertias, and their instability is correspondingly quicker; this one needs a loop with crossover around 2–4 rad/s.
:::

::: check
For that same vehicle, thrust is 600 kN with the gimbal 7 m behind the centre of gravity. What is $\mu_\delta$, what is the minimum proportional gain, and what gains give $\omega_n = 3\ \mathrm{rad/s}$ with $\zeta = 0.7$?
:::

::: answer
$\mu_\delta = 6 \times 10^5 \times 7/(2 \times 10^6) = 2.1\ \mathrm{s^{-2}}$. The minimum gain is $\mu_\alpha/\mu_\delta = 0.54/2.1 = 0.257$. For the target dynamics, $K_p = (9 + 0.54)/2.1 = 4.54$ and $K_d = 2 \times 0.7 \times 3/2.1 = 2.0\ \mathrm{s}$. The low-gain margin is $20\log_{10}(4.54/0.257) = 24.9\ \mathrm{dB}$.
:::

::: check
Explain, using the closed-loop characteristic equation, why a purely proportional attitude controller on an unstable booster is never acceptable even when its gain exceeds the minimum.
:::

::: answer
With $\delta = -K_p\theta$ the closed loop is $\ddot\theta + (K_p\mu_\delta - \mu_\alpha)\theta = 0$. Above the minimum gain the coefficient is positive and the poles are $\pm j\sqrt{K_p\mu_\delta - \mu_\alpha}$: purely imaginary. The vehicle no longer diverges, but it oscillates at that frequency with zero damping, so every gust adds energy that never decays and the gimbal works continuously. Rate feedback $-K_d\dot\theta$ supplies the $2\zeta\omega_n s$ term that moves the poles into the left half-plane.
:::

::: check
The booster's TVC hydraulics fail for 3 s at max-Q while the vehicle carries a 1.5° attitude error and zero rate. Estimate the angle of attack and the pitch rate when authority returns, and the load indicator at that moment.
:::

::: answer
With the gimbal frozen, $\theta(t) = \theta_0\cosh(pt)$ and $\dot\theta = \theta_0 p\sinh(pt)$ with $p = 0.478\ \mathrm{rad/s}$. At $t = 3\ \mathrm{s}$, $pt = 1.43$, $\cosh = 2.22$, $\sinh = 1.98$: the angle is $1.5 \times 2.22 = 3.3^\circ$ and the rate is $1.5 \times 0.478 \times 1.98 = 1.4^\circ/\mathrm{s}$. The load indicator is $31.3 \times 3.3 = 104\ \mathrm{kPa\cdot deg}$ and still rising at the moment control returns; the recovery will overshoot further before the loop can arrest the rate. Whether the vehicle survives depends on its certified envelope, and three seconds is already marginal.
:::

::: check
Why does the Bode phase of the loop gain of a stabilised unstable booster sit at $-180^\circ$ at low frequency, and why is that not a sign of trouble?
:::

::: answer
At low frequency $L(0) = -K_p\mu_\delta/\mu_\alpha$ is a negative real number, because the plant $\mu_\delta/(s^2 - \mu_\alpha)$ has a negative DC gain — a steady gimbal deflection produces a steady attitude *of the opposite sign* once the aerodynamic moment balances it. The Nyquist criterion for a plant with one right-half-plane pole requires one counter-clockwise encirclement of $-1$, which is exactly what a plot starting on the real axis to the left of $-1$ and sweeping around it provides. The condition for stability is $|L(0)| > 1$ (the low-gain margin), not that the phase avoid $-180^\circ$ there.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $I\ddot\theta = N_\alpha\ell_\alpha\alpha + T\ell_T\delta$ | pitch equation with aerodynamic and TVC moments |
| $\mu_\alpha = \bar{q} S C_{N\alpha}(x_{cg} - x_{cp})/I$ | aerodynamic moment coefficient, $\mathrm{s^{-2}}$; positive = unstable |
| $\mu_\delta = T\ell_T/I$ | control moment coefficient, $\mathrm{s^{-2}}$ per radian of gimbal |
| $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$ | rigid pitch plant; unstable pole at $\sqrt{\mu_\alpha}$ |
| $t_{\text{double}} = \ln 2/\sqrt{\mu_\alpha}$ | 1.45 s for the example booster at max-Q |
| $K_p > \mu_\alpha/\mu_\delta$ | minimum gain; low-gain margin $20\log_{10}(K_p\mu_\delta/\mu_\alpha)$ |
| $K_p = (\omega_n^2 + \mu_\alpha)/\mu_\delta$, $K_d = 2\zeta\omega_n/\mu_\delta$ | PD gains for chosen $\omega_n$, $\zeta$ |
| Example loop | $K_p = 1.88$, $K_d = 1.59\ \mathrm{s}$; crossover 0.36 Hz, PM 55°, GM 24 dB up / 21 dB down |
| Requirements | typically ≥ 6 dB gain margin (both sides) and ≥ 30° phase margin; gains scheduled with $\bar{q}$, Mach, mass |

The next lesson uses this plant with the drift and wind terms restored to ask the structures team's question: how large is $\bar{q}\alpha$ in a wind, and what does it cost to reduce it?
