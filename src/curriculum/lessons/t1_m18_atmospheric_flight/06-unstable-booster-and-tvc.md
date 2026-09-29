---
id: l06-unstable-booster-and-tvc
title: The aerodynamically unstable booster and its TVC loop
minutes: 25
covers:
  - aerodynamic instability of a boosting rocket
---

Try balancing a broom upright on the palm of your hand. You can do it — but only by watching it the whole time and moving your hand under it. The moment it starts to lean, you slide your hand the same way. Stop moving for even a second and it falls, faster and faster.

Now hang the same broom from your fingers by its tip. It swings a little and settles down, hanging straight. You do not have to do anything.

Those are the two kinds of balance. The hanging broom is **stable**: disturb it and it comes back. The balanced broom is **unstable**: disturb it and it runs away, and only constant correction keeps it up. That balanced broom is called an **[[inverted pendulum|inverted-pendulum]]**.

The last lesson showed that a launch vehicle in thick air is like the balanced broom. Its center of pressure is ahead of its center of mass, so any angle of attack makes a moment that tips it further. This lesson turns that moment into motion. The motion turns out to be an exponential runaway that doubles about every second and a half. That runaway is the **plant** — the thing to be controlled — that a launch-vehicle control engineer is handed.

The only "hand" that can hold it is the engine gimbal. The **thrust vector control** (TVC) loop that closes around it is the most safety-critical loop on the vehicle. If it stops for more than a few seconds during the high-dynamic-pressure part of the climb, the vehicle breaks up.

We will write the pitch equations, find the runaway rate, work out what that runaway demands of the controller, design a proportional-derivative controller for a real-sized booster and check its safety margins, and see how the plant changes during the flight. The bending-notch exercise starts from exactly this plant.

## The pitch-plane equations of motion

Look at the rocket from the side, in its pitch plane. We only care about small wobbles about the planned gravity-turn path. Here are the players:

- $\theta$ ("theta"): the pitch attitude error — how far the body axis is from the commanded attitude;
- $\alpha$: the angle of attack;
- $\delta$ ("delta"): the gimbal angle, the tilt of the engine's thrust;
- $I$: the pitch **moment of inertia** about the center of gravity — how hard the vehicle is to spin, the turning version of mass;
- $m$: the mass, and $T$: the thrust;
- $\ell_T$ ("ell sub T"): the distance from the gimbal pivot to the center of gravity;
- $\ell_\alpha = x_{cg} - x_{cp}$: how far the center of pressure sits *in front of* the center of gravity. It is positive for the unstable layout.

From the last lesson, the aerodynamic moment is $N_\alpha \ell_\alpha \alpha$, with $N_\alpha = \bar{q} S C_{N\alpha}$.

### Turning: the moment balance

Choose $\delta$ positive in the direction that makes a positive moment — nose up, increasing $\alpha$. Tilting the nozzle by $\delta$ gives a sideways thrust $T\sin\delta \approx T\delta$ at the tail. Its moment about the center of gravity is $T \ell_T \delta$.

Newton's law for turning says moment of inertia times angular acceleration equals total moment:

$$
I\,\ddot{\theta} = N_\alpha\,\ell_\alpha\,\alpha + T\,\ell_T\,\delta .
$$

Read $\ddot\theta$ as "theta double-dot": the second derivative of $\theta$ with time, the angular acceleration. One dot, $\dot\theta$, is the pitch rate.

Notice something about the gimbal. To trim the nose, it pushes the *tail* sideways — in the *opposite* direction to the normal force it is fighting. Push the tail one way and the nose swings the other. So the sideways (translation) equation is $m\ddot{z} = N_\alpha \alpha - T\delta$, with $z$ measured in the direction the normal force acts. The next lesson uses it.

### What the angle of attack is made of

Three things set the angle of attack:

$$
\alpha = \theta + \alpha_w - \frac{\dot{z}}{V}.
$$

The attitude error $\theta$ tilts the body. The wind adds $\alpha_w = w_\perp/V$, as in Lesson 4. And sideways drift $\dot z$ tilts the velocity, which *removes* $\dot z/V$.

Over the few seconds that matter for stability, the velocity direction turns far more slowly than the body does. So the **[[short-period approximation|short-period]]** drops the drift term and sets $\alpha \approx \theta + \alpha_w$. Put that into the moment balance and divide by $I$:

$$
\ddot{\theta} = \mu_\alpha\,\theta + \mu_\delta\,\delta + \mu_\alpha\,\alpha_w,
\qquad
\mu_\alpha = \frac{N_\alpha\,\ell_\alpha}{I} = \frac{\bar{q} S C_{N\alpha}(x_{cg} - x_{cp})}{I},
\qquad
\mu_\delta = \frac{T\,\ell_T}{I}.
$$

Read $\mu$ as "mew". These two numbers sum up the whole vehicle:

- $\mu_\alpha$ is the **aerodynamic moment coefficient**: the angular acceleration per radian of angle of attack, in $\mathrm{s^{-2}}$.
- $\mu_\delta$ is the **control moment coefficient**: the angular acceleration per radian of gimbal, also in $\mathrm{s^{-2}}$.

Both are positive for a launch vehicle. Notice that the wind enters through the *same* coefficient as the attitude. A gust is felt exactly like an attitude error. That fact is the seed of the whole load-relief lesson.

## The unstable pole

Freeze the gimbal at zero and remove the wind. Then

$$
\ddot\theta = \mu_\alpha\theta .
$$

In words: the angular acceleration is proportional to the angle itself, with a *positive* sign. The more it leans, the harder it is pushed to lean more. That is the balanced broom.

To solve it, guess an exponential, $\theta = e^{st}$. Each time derivative brings down a factor $s$, so $\ddot\theta = s^2 e^{st}$. Put both into the equation and cancel $e^{st}$:

$$
s^2 = \mu_\alpha, \qquad s = \pm\sqrt{\mu_\alpha}.
$$

The same information, written as a **transfer function** from gimbal angle to attitude, is

$$
G(s) = \frac{\theta(s)}{\delta(s)} = \frac{\mu_\delta}{s^2 - \mu_\alpha}.
$$

The values of $s$ that make the bottom zero are the **[[poles|poles]]**: the natural growth or decay rates of the system. Here there is one stable pole at $-\sqrt{\mu_\alpha}$, which dies away, and one **unstable pole** at $+\sqrt{\mu_\alpha}$, which grows. Any attitude error, however tiny, grows like $e^{\sqrt{\mu_\alpha}\,t}$. It doubles every

$$
t_{\text{double}} = \frac{\ln 2}{\sqrt{\mu_\alpha}} .
$$

(That comes from setting $e^{\sqrt{\mu_\alpha}\,t} = 2$ and taking the natural log of both sides.)

**Compare a finned rocket.** For a statically stable rocket, $\ell_\alpha < 0$, so $\mu_\alpha < 0$. Then $s^2 = -|\mu_\alpha|$, the poles are $\pm j\sqrt{|\mu_\alpha|}$ ($j$ is the imaginary unit, $\sqrt{-1}$), and imaginary poles mean a steady swing back and forth. The rocket oscillates about the wind direction at its **weathercock frequency** instead of running away — the hanging broom. So the sign of the static margin is the sign of $\mu_\alpha$, and it decides between an oscillation and an exponential.

::: example The unstable pole of a booster at max-Q
Take the booster of the last lesson in the max-Q window: $\bar{q} = 31.3\ \mathrm{kPa}$, $S = 10.52\ \mathrm{m^2}$, $C_{N\alpha} = 4.0$ per radian, $x_{cg} - x_{cp} = 26\ \mathrm{m}$, mass 380 t, and pitch inertia $I = 1.5 \times 10^8\ \mathrm{kg\cdot m^2}$.

**Is that inertia sensible?** A uniform 70 m rod of the same mass has $mL^2/12 = 380\,000 \times 70^2/12 = 1.6 \times 10^8\ \mathrm{kg\cdot m^2}$. Close — good.

**The aerodynamic coefficient.**

$$
N_\alpha = 31\,300 \times 10.52 \times 4.0 = 1.317 \times 10^6\ \mathrm{N/rad},
\qquad
\mu_\alpha = \frac{1.317 \times 10^6 \times 26}{1.5 \times 10^8} = 0.228\ \mathrm{s^{-2}} .
$$

**The pole and doubling time.** The unstable pole is at $\sqrt{0.228} = 0.478\ \mathrm{rad/s}$. The time to double is $\ln 2/0.478 = 0.693/0.478 = 1.45\ \mathrm{s}$.

**The control coefficient.** With $T = 7.6\ \mathrm{MN}$ and $\ell_T = 26\ \mathrm{m}$,

$$
\mu_\delta = \frac{7.6 \times 10^6 \times 26}{1.5 \times 10^8} = 1.32\ \mathrm{s^{-2}}.
$$

Each radian of gimbal gives 1.32 rad/s² of pitch acceleration, or $1.32 \times 0.01745 = 0.023$ rad/s² per degree.

**Sanity check.** To hold one radian of angle of attack steady, the gimbal must cancel the aerodynamic push: $\mu_\delta \delta = \mu_\alpha \alpha$, so $\delta/\alpha = \mu_\alpha/\mu_\delta = 0.228/1.317 = 0.173$. For $2^\circ$ that is $0.35^\circ$ of gimbal — the same answer the last lesson got from the moments directly.
:::

## What instability demands of the controller

The runaway sets five hard rules.

**1. The loop must be closed, always.** A pre-planned pitch program with no feedback would work for a stable vehicle. Here it would be fatal. With the gimbal frozen and no rate to start, the error grows like $\theta_0\cosh(\sqrt{\mu_\alpha}\,t)$ (a **[[hyperbolic cosine|cosh-growth]]**). A $2^\circ$ attitude error becomes $2.2^\circ$ after one second, $3.0^\circ$ after two, $4.4^\circ$ after three and $6.9^\circ$ after four, with the rate climbing past $3^\circ/\mathrm{s}$. At 31.3 kPa the load measure $\bar{q}\alpha$ reaches about 140 kPa·deg by the third second — beyond most vehicles' structural limits. The vehicle does not tumble first. It breaks. So a control outage of a few seconds in the high-$\bar{q}$ window cannot be recovered from. That is why the TVC hydraulics, the flight computers and the gyros are all **[[redundant|redundancy]]**, and why losing gimbal authority means losing the vehicle, not merely flying worse.

**2. There is a minimum gain.** Suppose the controller tilts the gimbal in proportion to the error: $\delta = -K_p\theta$, with **proportional gain** $K_p$. The closed loop becomes $\ddot\theta = (\mu_\alpha - K_p\mu_\delta)\theta$. That is still a runaway unless the bracket is negative:

$$
K_p > \frac{\mu_\alpha}{\mu_\delta} .
$$

Below that gain, the gimbal cannot even match the aerodynamic moment it is fighting. A stable aircraft only has a gain limit from above (too much gain makes it oscillate). An unstable booster has a limit from *below* too. The **low-gain margin**, $20\log_{10}(K_p\mu_\delta/\mu_\alpha)$ in **[[decibels|decibels]]**, is a number you report next to the usual one.

**3. The bandwidth must sit well above the unstable pole.** The **[[crossover frequency|crossover]]** is roughly how fast the loop reacts. A rule of thumb, backed by the Nyquist criterion and by decades of launch vehicles, is that it should be at least three to five times $\sqrt{\mu_\alpha}$. Slower than that, the phase margin collapses and the loop is too slow to keep $\alpha$ small in a gust. You cannot filter out an unstable pole. You have to be faster than it.

**4. Damping needs rate.** Proportional feedback alone gives $\ddot\theta + (K_p\mu_\delta - \mu_\alpha)\theta = 0$: a swing that never dies down. A term $K_d\dot\theta$ fed by the **[[rate gyros|rate-gyros]]** supplies the damping. So the launch-vehicle loop is basically proportional-derivative (PD), with an integral term added only for slow trim errors.

**5. The actuator must be strong and quick.** Gimbal limits of about $\pm 5^\circ$ and rates of tens of degrees per second are typical. Trim takes a fraction of a degree, gusts a degree or two more, and the rest is margin. A slow actuator adds phase lag at crossover, so its own bandwidth must be several times the loop's.

::: key
With its center of pressure forward of its center of mass, a launch vehicle turns every $\alpha$ into a divergent moment. Its rigid pitch plant is $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$: an unstable pole at $\sqrt{\mu_\alpha}$, doubling in about a second. The loop needs gain above $\mu_\alpha/\mu_\delta$ and a bandwidth several times the unstable pole, and it can never be opened in the high-$\bar{q}$ window: an outage of a few seconds is not recoverable.
:::

## Designing the PD attitude loop

Command the gimbal with both attitude and rate feedback:

$$
\delta = -K_p\,\theta - K_d\,\dot\theta .
$$

The minus signs mean a positive attitude error makes a negative, nose-down moment. Put this into $\ddot\theta = \mu_\alpha\theta + \mu_\delta\delta$ and move everything to one side:

$$
\ddot\theta + K_d\mu_\delta\,\dot\theta + (K_p\mu_\delta - \mu_\alpha)\,\theta = 0 .
$$

Trying $e^{st}$ again gives the **closed-loop characteristic equation**:

$$
s^2 + K_d\,\mu_\delta\, s + (K_p\,\mu_\delta - \mu_\alpha) = 0 .
$$

Match it term by term to the standard form $s^2 + 2\zeta\omega_n s + \omega_n^2$, where $\omega_n$ ("omega n") is the natural frequency you want and $\zeta$ ("zeta") the damping ratio. The $s$ terms give $K_d\mu_\delta = 2\zeta\omega_n$. The constant terms give $K_p\mu_\delta - \mu_\alpha = \omega_n^2$. Solve each for the gain:

$$
K_p = \frac{\omega_n^2 + \mu_\alpha}{\mu_\delta}, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta} .
$$

Look at $K_p$. The aerodynamic term *adds* to $\omega_n^2$. Part of the proportional gain is spent canceling the instability before any of it buys stiffness.

::: example PD gains and margins for the booster
Choose a closed-loop natural frequency $\omega_n = 1.5\ \mathrm{rad/s}$ (about three times the unstable pole of 0.478) and damping $\zeta = 0.7$. Use $\mu_\alpha = 0.228$ and $\mu_\delta = 1.317$.

**Gains.**

$$
K_p = \frac{1.5^2 + 0.228}{1.317} = \frac{2.478}{1.317} = 1.88\ \mathrm{rad/rad}, \qquad
K_d = \frac{2 \times 0.7 \times 1.5}{1.317} = \frac{2.1}{1.317} = 1.59\ \mathrm{s} .
$$

So a one-degree attitude error commands $1.88^\circ$ of gimbal, and a rate of $1^\circ/\mathrm{s}$ commands $1.59^\circ$.

**Low-gain margin.** The minimum gain is $\mu_\alpha/\mu_\delta = 0.173$. So the margin is $20\log_{10}(1.88/0.173) = 20\log_{10}(10.9) = 20.7\ \mathrm{dB}$.

**Adding the actuator.** Now include a gimbal actuator that behaves like a second-order system with a 4 Hz natural frequency and 0.7 damping, $A(s)$. The **loop gain** — the signal's trip once round the loop — is

$$
L(j\omega) = (K_p + jK_d\omega)\,A(j\omega)\,\frac{\mu_\delta}{-\omega^2 - \mu_\alpha}.
$$

Evaluate it numerically (the code below does this). The gain crosses 1 (0 dB) at 2.27 rad/s, which is 0.36 Hz. The phase margin there is 55°. And the gain can be raised by 23.8 dB before the actuator's lag makes the loop unstable.

**Verdict.** Both gain margins beat the traditional 6 dB requirement, and the phase margin beats 30° with room to spare.

**Why the actuator matters.** Without the actuator model the phase margin reads 62°. The 7° difference is the actuator's lag at crossover. That is why actuator dynamics are never left out of a launch-vehicle stability analysis.
:::

### The Nyquist picture

The **Nyquist plot** draws $L(j\omega)$ as a curve in the complex plane as $\omega$ sweeps from zero upward. It is worth carrying in your head for an unstable plant.

Because the plant has one pole in the right half-plane, the **[[Nyquist criterion|nyquist]]** says the closed loop is stable only if the plot circles the point $-1$ exactly once counter-clockwise. At zero frequency,

$$
L(0) = -\frac{K_p\mu_\delta}{\mu_\alpha} = -10.9 .
$$

So the plot *starts* on the negative real axis, far to the left of $-1$, then sweeps around $-1$ as the frequency rises. Two ways to lose stability follow:

- lower the gain until $L(0)$ reaches $-1$, and you have used up the low-gain margin;
- add phase lag until the high-frequency part of the sweep crosses inside $-1$, and you have used up the high-gain margin.

So when you read a Bode plot for this loop, the phase at low frequency sits at $-180^\circ$ *on purpose*. That is not a warning sign here.

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
print(w[i], np.degrees(np.angle(L[i])) + 180)   # -> about 2.26 rad/s and 55 deg of phase margin
```

## The plant changes along the trajectory

Neither coefficient stays put.

$\mu_\alpha$ is proportional to $\bar{q}$. So it is zero at lift-off, peaks near max-Q, and fades to nothing above about 60 km. It also carries the Mach dependence of $C_{N\alpha}$ and $x_{cp}$, which shift fastest through the transonic band.

$\mu_\delta$ grows through the burn, because the mass and inertia fall while the thrust rises toward its vacuum value.

So the controller's gains are **[[scheduled|gain-scheduling]]**: looked up against time or Mach number, so that the closed-loop $\omega_n$ and $\zeta$ stay where the designer wants them. They are high near max-Q to beat the unstable pole. They are lower late in the burn, when the plant has become almost a pure **double integrator** $\mu_\delta/s^2$ (gimbal sets angular acceleration, nothing else pushes back) and the bending modes, not the aerodynamics, set the limits.

Uncertainty rides on top. The wind-tunnel values of $C_{N\alpha}$ and $x_{cp}$ may be off by 10–20 % in the transonic range. The inertia is known well, but the center of gravity drifts with propellant slosh and loading. The actuator's behavior changes with load. A controller designed for the nominal $\mu_\alpha$ must stay stable, with margins, across all these spreads. That is why a 20 dB low-gain margin is not extravagant. Halve the assumed inertia, or double the assumed $C_{N\alpha}$, and $\mu_\alpha$ doubles. The design must survive that.

::: example Time to double along the flight
**Early: 20 s after lift-off**, $\bar{q} = 5.2\ \mathrm{kPa}$. Ignoring Mach effects, $\mu_\alpha$ scales with $\bar{q}$:

$$
\mu_\alpha \approx 0.228 \times \frac{5.2}{31.3} = 0.038\ \mathrm{s^{-2}}.
$$

The pole is at $\sqrt{0.038} = 0.19$ rad/s, and the time to double is $0.693/0.19 = 3.6\ \mathrm{s}$. Slow enough that a modest loop copes easily.

**Max-Q:** 1.45 s, from the first example.

**Late: 100 s**, $\bar{q} = 5.4\ \mathrm{kPa}$, but the inertia has fallen to perhaps $1.0 \times 10^8\ \mathrm{kg\cdot m^2}$. Then $\mu_\alpha \approx 0.228 \times (5.4/31.3) \times (1.5/1.0) = 0.059\ \mathrm{s^{-2}}$, and the doubling time is $0.693/\sqrt{0.059} = 2.9\ \mathrm{s}$ — back near 3 s.

**By 130 s**, $\bar{q} < 1\ \mathrm{kPa}$ and the runaway is so slow that the plant is effectively a double integrator.

**Sanity check.** The fastest runaway sits exactly at max-Q. The controller has to be quickest exactly when the loads are largest.
:::

::: warning $\mu_\alpha$ is not the pole
The pole is $\sqrt{\mu_\alpha}$, and the time constant is $1/\sqrt{\mu_\alpha}$. Double the aerodynamic moment slope and the runaway gets $\sqrt{2} = 1.41$ times faster, not twice as fast. The other way round: a vehicle with four times the inertia of another, at the same $\bar{q}$ and shape, has a pole only half as fast.
:::

::: warning The short-period shortcut has limits
Setting $\alpha \approx \theta$ is fine for stability over a few seconds, but not for loads or trajectory over a minute. The drift term $\dot z/V$ and the wind term $\alpha_w$ change the angle of attack the airframe actually feels. The next lesson keeps them.
:::

## Check yourself

::: check
A small launcher has $\bar{q} = 40\ \mathrm{kPa}$, $S = 1.5\ \mathrm{m^2}$, $C_{N\alpha} = 3$ per radian, $x_{cg} - x_{cp} = 6\ \mathrm{m}$ and $I = 2 \times 10^6\ \mathrm{kg\cdot m^2}$. Find $\mu_\alpha$, the unstable pole and the time to double.
:::

::: answer
**Normal-force slope.** $N_\alpha = 40\,000 \times 1.5 \times 3 = 1.8 \times 10^5\ \mathrm{N/rad}$.

**Aerodynamic coefficient.** $\mu_\alpha = 1.8 \times 10^5 \times 6 / (2 \times 10^6) = 0.54\ \mathrm{s^{-2}}$.

**Pole and doubling time.** The pole is at $\sqrt{0.54} = 0.735\ \mathrm{rad/s}$, and the time to double is $\ln 2/0.735 = 0.94\ \mathrm{s}$.

Small vehicles have small inertias, so their runaway is quicker. This one needs a loop with crossover around 2–4 rad/s (three to five times 0.735).
:::

::: check
For that same vehicle, the thrust is 600 kN with the gimbal 7 m behind the center of gravity. What is $\mu_\delta$, what is the minimum proportional gain, and what gains give $\omega_n = 3\ \mathrm{rad/s}$ with $\zeta = 0.7$?
:::

::: answer
**Control coefficient.** $\mu_\delta = 6 \times 10^5 \times 7/(2 \times 10^6) = 2.1\ \mathrm{s^{-2}}$.

**Minimum gain.** $\mu_\alpha/\mu_\delta = 0.54/2.1 = 0.257$.

**Gains.** $K_p = (3^2 + 0.54)/2.1 = 9.54/2.1 = 4.54$, and $K_d = 2 \times 0.7 \times 3/2.1 = 4.2/2.1 = 2.0\ \mathrm{s}$.

**Low-gain margin.** $20\log_{10}(4.54/0.257) = 20\log_{10}(17.7) = 24.9\ \mathrm{dB}$.
:::

::: check
Use the closed-loop characteristic equation to explain why a purely proportional attitude controller on an unstable booster is never acceptable, even when its gain is above the minimum.
:::

::: answer
With $\delta = -K_p\theta$ the closed loop is $\ddot\theta + (K_p\mu_\delta - \mu_\alpha)\theta = 0$. Above the minimum gain the bracket is positive, so the poles are $\pm j\sqrt{K_p\mu_\delta - \mu_\alpha}$: purely imaginary.

The vehicle no longer runs away, but it swings back and forth at that frequency with zero damping. Every gust adds energy that never dies out, and the gimbal works nonstop. Rate feedback $-K_d\dot\theta$ supplies the $2\zeta\omega_n s$ term, which moves the poles into the left half-plane so the swings decay.
:::

::: check
The booster's TVC hydraulics fail for 3 s at max-Q while the vehicle carries a $1.5^\circ$ attitude error and zero rate. Estimate the angle of attack and the pitch rate when control returns, and the load measure $\bar{q}\alpha$ at that moment.
:::

::: answer
**The runaway.** With the gimbal frozen and zero starting rate, $\theta(t) = \theta_0\cosh(pt)$ and $\dot\theta = \theta_0 p\sinh(pt)$, with $p = 0.478\ \mathrm{rad/s}$.

**At 3 s.** $pt = 0.478 \times 3 = 1.43$, so $\cosh 1.43 = 2.22$ and $\sinh 1.43 = 1.98$.

- Angle: $1.5 \times 2.22 = 3.3^\circ$.
- Rate: $1.5 \times 0.478 \times 1.98 = 1.4^\circ/\mathrm{s}$.

**Load.** $31.3 \times 3.3 = 104\ \mathrm{kPa\cdot deg}$, and still rising as control returns. The recovery will overshoot further before the loop can stop the rate. Whether the vehicle survives depends on its certified envelope, and three seconds is already marginal.
:::

::: check
Why does the Bode phase of the loop gain for a stabilized unstable booster sit at $-180^\circ$ at low frequency, and why is that not a sign of trouble?
:::

::: answer
At low frequency $L(0) = -K_p\mu_\delta/\mu_\alpha$, a negative real number. That is because the plant $\mu_\delta/(s^2 - \mu_\alpha)$ has a negative gain at zero frequency: a steady gimbal tilt balances the aerodynamic moment only at an attitude of the *opposite* sign.

For a plant with one right-half-plane pole, the Nyquist criterion needs one counter-clockwise loop around $-1$. A plot that starts on the real axis to the left of $-1$ and sweeps around it gives exactly that. So the condition for stability is $|L(0)| > 1$ — the low-gain margin — not that the phase stay away from $-180^\circ$ at low frequency.
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

The next lesson puts the drift and wind terms back into this plant to answer the structures team's question: how big does $\bar{q}\alpha$ get in a wind, and what does it cost to make it smaller?

::: context inverted-pendulum The broom on your hand
A hanging pendulum (left) is pulled back toward the bottom whenever it swings away. A balanced one (right) is pushed further away whenever it leans: gravity's twist grows with the lean. The equations have the same shape — only the sign differs — which is exactly the difference between a finned rocket and a finless booster.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ip-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
    <marker id="ip-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <line x1="50" y1="20" x2="130" y2="20" stroke="#1f2a44" stroke-width="3"/>
  <line x1="90" y1="20" x2="120" y2="122" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="120" cy="122" r="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="20" x2="90" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <path d="M112,146 A60,60 0 0,1 94,146" fill="none" stroke="#1d6fd1" stroke-width="2" marker-end="url(#ip-b)"/>
  <text x="90" y="170" font-size="12" fill="#1d6fd1" text-anchor="middle">stable: swings back</text>
  <line x1="230" y1="150" x2="310" y2="150" stroke="#1f2a44" stroke-width="3"/>
  <line x1="270" y1="150" x2="300" y2="48" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="300" cy="48" r="11" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="270" y1="150" x2="270" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <path d="M308,30 A60,60 0 0,1 326,40" fill="none" stroke="#b4232c" stroke-width="2" marker-end="url(#ip-r)"/>
  <text x="270" y="170" font-size="12" fill="#b4232c" text-anchor="middle">unstable: falls further</text>
</svg>
```
:::

::: context short-period Where "short period" comes from
Aircraft engineers found that a disturbed airplane's pitch motion splits into two separate wobbles. The **short-period mode** is a quick nodding of the nose, over a few seconds, while the flight path barely changes. The **phugoid** is a slow swap of height for speed over tens of seconds.

A launch vehicle borrows the idea: for the quick stability question, the body turns fast and the velocity direction is treated as fixed. The slow drift of the flight path is handled separately, when loads and trajectory are the question.
:::

::: context poles What a pole tells you
A **pole** of a system is one of its natural rates: a number $s$ such that $e^{st}$ is a motion the system can make all by itself. A negative real pole is a motion that dies away. A positive real pole is one that grows. A pair of imaginary poles is a steady swing, and a complex pair with negative real part is a swing that dies away.

So "one pole in the right half-plane" is a compact way of saying "left alone, this thing runs away". The whole job of the controller is to move that pole into the left half.
:::

::: context cosh-growth Why cosh, not a plain exponential
The frozen-gimbal motion is a mix of both poles: $\theta = \tfrac{\theta_0}{2}\left(e^{pt} + e^{-pt}\right) = \theta_0\cosh(pt)$, with $p = \sqrt{\mu_\alpha}$. The mix is set by the starting rate of zero. At first the dying part cancels some of the growth, so the error creeps; soon the growing part takes over. Here a $2^\circ$ error at max-Q grows (blue) and crosses the $140$ kPa·deg load line (red) at about 3 s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="120" y="186">1</text><text x="190" y="186">2</text><text x="260" y="186">3</text><text x="330" y="186">4 s</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0°</text><text x="44" y="136">2°</text><text x="44" y="99">4°</text><text x="44" y="61">6°</text><text x="44" y="24">8°</text>
  </g>
  <line x1="50" y1="86.1" x2="340" y2="86.1" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="60" y="80" font-size="11" fill="#b4232c">q̄α = 140 kPa·deg</text>
  <polyline points="50,132.5 85,131.4 120,128.1 155,122.4 190,114.0 225,102.4 260,86.9 295,66.6 330,40.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1"><circle cx="120" cy="128.1" r="3.5"/><circle cx="190" cy="114.0" r="3.5"/><circle cx="260" cy="86.9" r="3.5"/><circle cx="330" cy="40.5" r="3.5"/></g>
</svg>
```
:::

::: context redundancy Two of everything, or three
**Redundancy** means carrying spare copies of a part so the job continues when one fails. Launch vehicles typically fly three flight computers that vote on every command, several gyro units, and TVC actuators with backup hydraulic or electric power.

The reason is this lesson's arithmetic. A part that may fail for a few seconds is survivable on a stable airplane. On an unstable booster at max-Q it is not, so the design assumes a failure *will* happen and makes sure another unit is already doing the job.
:::

::: context decibels Measuring ratios in decibels
A **decibel** (dB) turns a ratio into a friendlier number. For a gain ratio $r$, the size in decibels is $20\log_{10} r$. So a ratio of 2 is about 6 dB, 10 is 20 dB, and 100 is 40 dB. Multiplying ratios becomes adding decibels.

The classic "6 dB gain margin" therefore means the loop gain could double before the loop goes unstable. The booster's 20.7 dB low-gain margin means its gain could fall to about one-eleventh ($1/10.9$) before it lost control.
:::

::: context crossover How fast the loop reacts
Picture the loop's gain as a function of how fast the error wiggles. Slow wiggles get amplified a lot; fast ones barely at all. The **crossover frequency** is where the gain falls to exactly one — the fastest wiggle the loop can still push against at full strength.

It is a good measure of the loop's **bandwidth**, its speed of reaction. The **phase margin** is how much extra delay the loop could take at crossover before going unstable. These ideas come back in the bending-mode lesson, where a mode far above crossover can be filtered out, but one near it cannot.
:::

::: context rate-gyros Measuring how fast it turns
A **rate gyro** measures angular velocity — how many degrees per second the vehicle is turning — rather than the angle itself. Modern ones are ring-laser or fiber-optic gyros with no spinning parts, or tiny vibrating chips.

Rate is exactly the signal the $K_d\dot\theta$ term needs, so it comes straight from the sensor instead of being computed by differencing noisy angles. One catch, taken up in the bending-mode lesson: a gyro measures the turning of the spot where it is bolted, and a flexing rocket turns differently at different spots.
:::

::: context nyquist Going once around −1
The blue curve is this lesson's loop gain for rising positive frequency; the gray dashed curve is its mirror image, for negative frequency. Together they start far left at $-10.9$, swing around the red point $-1$ once counter-clockwise, and shrink into the origin. One right-half-plane pole needs exactly that one loop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ny-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <line x1="20" y1="90" x2="350" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="330" y1="20" x2="330" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="58.5,90.0 58.6,92.1 58.7,92.9 58.9,93.9 59.2,95.3 59.8,97.1 60.9,99.5 62.8,102.8 66.2,107.1 72.2,112.5 76.6,115.7 82.4,119.2 89.8,122.9 99.1,126.7 110.6,130.5 124.4,134.1 140.4,137.1 158.4,139.5 177.9,140.9 198.0,141.1 217.9,140.3 236.7,138.4 253.7,135.6 268.6,132.2 281.2,128.5 291.6,124.6 299.9,120.8 306.4,117.2 311.5,113.9 315.4,110.8 318.3,108.1 320.6,105.6 322.3,103.5 323.5,101.5 324.5,99.9 325.2,98.4 325.7,97.1 326.1,95.9 326.4,94.9 326.8,93.1 327.3,91.6 328.0,90.4 328.9,89.7 329.6,89.7 330.0,90.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="58.5,90.0 58.6,87.9 58.7,87.1 58.9,86.1 59.2,84.7 59.8,82.9 60.9,80.5 62.8,77.2 66.2,72.9 72.2,67.5 76.6,64.3 82.4,60.8 89.8,57.1 99.1,53.3 110.6,49.5 124.4,45.9 140.4,42.9 158.4,40.5 177.9,39.1 198.0,38.9 217.9,39.7 236.7,41.6 253.7,44.4 268.6,47.8 281.2,51.5 291.6,55.4 299.9,59.2 306.4,62.8 311.5,66.1 315.4,69.2 318.3,71.9 320.6,74.4 322.3,76.5 323.5,78.5 324.5,80.1 325.2,81.6 325.7,82.9 326.1,84.1 326.4,85.1 326.8,86.9 327.3,88.4 328.0,89.6 328.9,90.3 329.6,90.3 330.0,90.0" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="198" y1="141.1" x2="218" y2="140.3" stroke="#1d6fd1" stroke-width="2" marker-end="url(#ny-b)"/>
  <line x1="300" y1="85" x2="310" y2="95" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="300" y1="95" x2="310" y2="85" stroke="#b4232c" stroke-width="2.5"/>
  <text x="296" y="78" font-size="12" fill="#b4232c" text-anchor="end">−1</text>
  <text x="68" y="95" font-size="12" fill="#1f2a44">−10.9 at zero frequency</text>
  <text x="336" y="104" font-size="11" fill="#1f2a44">0</text>
  <text x="200" y="162" font-size="12" fill="#1d6fd1" text-anchor="middle">ω rising</text>
</svg>
```
:::

::: context gain-scheduling A different controller for every moment
**Gain scheduling** means the controller carries a table of gains and picks the row for the current flight condition — usually time since lift-off, Mach number or dynamic pressure. Each row is designed as if the vehicle were frozen at that moment, which works because the plant changes slowly compared with the loop's reaction time.

It is the standard way launch vehicles, airliners and missiles handle plants that change during flight. Checking the transitions between rows, and every row against the spread of possible vehicles, is a large part of flight-control verification.
:::
