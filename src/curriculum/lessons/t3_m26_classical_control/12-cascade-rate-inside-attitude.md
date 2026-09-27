---
id: l12-cascade-rate-inside-attitude
title: Cascade control — a fast rate loop inside a slower attitude loop
minutes: 21
covers:
  - 'Cascade architecture: a fast rate loop inside a slower attitude loop'
---

Picture a big ship. The captain watches the compass and decides where the bow should point. But the captain does not touch the wheel. She calls out a turn rate — "come left at two degrees per second" — and the helmsman at the wheel makes the ship turn at exactly that rate, fighting every wave that shoves the bow sideways. The captain is slow and thinks about *where*. The helmsman is quick and thinks about *how fast*.

Almost every vehicle that points at something is built the same way, as **[[two nested loops|nested-loops]]**. The **inner loop** — the helmsman — takes a rate command and makes the body's turning rate follow it, using gyros and the actuator. The **outer loop** — the captain — takes an attitude command (which way to point), compares it with the measured attitude, and hands the inner loop a rate command. Launch vehicles do this. So do spacecraft, aircraft autopilots, quadcopters and gimballed cameras. The arrangement is called **cascade control**: one loop feeding the next, like water falling from one pool into the pool below.

It is worth understanding as a set of engineering decisions rather than as a drawing. The inner loop earns its place for four reasons. A torque disturbance is far cheaper to cancel before it has been integrated twice into an attitude error. A rate command is a physical quantity you can put a limit on. Gyros are fast, while attitude sensors are slow. And the plant the outer loop sees — a pure integrator from rate to angle — is exact, never changes, and contains none of the vehicle's uncertain numbers.

This lesson builds an outer loop on top of the rate loop from earlier lessons. It finds the bandwidth-separation rule from real numbers, shows that the whole cascade is secretly one PID, and ends with the point that matters most in a design review: *where you break the loop decides which margins you get*.

## The architecture and the outer plant

Start with names. $C_{\text{in}}$ ("C in") is the inner rate controller. $G_\omega$ ("G omega") is the plant from torque to body rate. $K_\theta$ ("K theta") is the outer attitude controller, here a plain gain.

The inner loop, once closed, is a box that takes a rate command and produces a rate. Its **closed-loop transfer function** — how much of the command comes out the other side, at each frequency — is

$$
T_{\text{in}}(s) = \frac{C_{\text{in}}G_\omega}{1 + C_{\text{in}}G_\omega}.
$$

Now the key step. Attitude is the running total of rate: turn at $1^\circ$ per second for 5 seconds and you have turned $5^\circ$. In Laplace language, "running total" is dividing by $s$. So the plant the outer loop sees is the inner closed loop followed by a **[[kinematic integrator|kinematic-integrator]]** — "kinematic" because it comes from the geometry of motion, not from any force or mass:

$$
P_{\text{out}}(s) = \frac{T_{\text{in}}(s)}{s}.
$$

If the inner loop is good, $T_{\text{in}} \approx 1$ across the frequencies the outer loop cares about. Then the outer designer faces a pure integrator, $1/s$ — the easiest plant in control. A proportional gain gives the loop $L_{\text{out}} = K_\theta/s$. Its size is $K_\theta/\omega$, which equals one at $\omega = K_\theta$, so it crosses over at $K_\theta$. Its phase is $-90^\circ$ at every frequency, so the phase margin is $90^\circ$. That is the whole appeal. The condition "$T_{\text{in}} \approx 1$" is what bandwidth separation buys.

Here **bandwidth** means, roughly, the fastest wiggle a loop can still follow; for these loops it sits close to the gain crossover frequency $\omega_{gc}$. The **separation** is the ratio of the inner crossover to the outer crossover.

### How close to one is the inner loop?

Take the rate loop from earlier lessons: inertia $J = 1200\ \mathrm{kg\,m^2}$, actuator lag $\tau = 0.02\ \mathrm{s}$, and the PI controller $C_{\text{in}} = 12\,000 + 24\,000/s$. It crosses over at $\omega_{gc,\text{in}} = 10\ \mathrm{rad/s}$, and

$$
T_{\text{in}}(s) = \frac{500(s+2)}{s^3 + 50s^2 + 500s + 1000}.
$$

Plug in $s = j\omega$ at a few frequencies and read off the size and the phase lag:

| $\omega$ (rad/s) | 0.5 | 1 | 2 | 3 | 5 | 10 |
| --- | --- | --- | --- | --- | --- | --- |
| $\lvert T_{\text{in}}\rvert$ | 1.012 | 1.042 | 1.110 | 1.147 | 1.128 | 0.901 |
| $\angle T_{\text{in}}$ | −0.2° | −1.1° | −6.1° | −13.2° | −27.8° | −56.3° |

Read it like this. At a tenth of the inner crossover (1 rad/s), the inner loop is a wire: what goes in comes out. At a fifth (2 rad/s), it costs $6^\circ$ of phase. At half (5 rad/s), it costs $28^\circ$ — most of a design's margin.

::: example Choosing the attitude gain
Close the outer loop with a proportional gain $K_\theta$ and compute the real margins, using the actual $T_{\text{in}}$ instead of pretending it is 1. The separation is $10$ divided by the outer crossover.

| $K_\theta$ | $\omega_{gc,\text{out}}$ | separation | phase margin | gain margin | modulus margin |
| --- | --- | --- | --- | --- | --- |
| 1 | 1.05 rad/s | 9.6× | 88.7° | 31.7 dB | 0.909 |
| 2 | 2.25 rad/s | 4.5× | 82.3° | 25.7 dB | 0.836 |
| 3 | 3.45 rad/s | 2.9× | 73.4° | 22.2 dB | 0.774 |
| 5 | 5.55 rad/s | 1.8× | 58.5° | 17.7 dB | 0.670 |
| 8 | 8.00 rad/s | 1.3× | 43.7° | 13.6 dB | 0.550 |

**Step 1: what the idealist predicts.** A designer who assumed $T_{\text{in}} = 1$ would predict $90^\circ$ of phase margin and infinite gain margin in every row.

**Step 2: what really happens.** The margins wear away steadily as the loops get closer. At a separation of 1.3 the phase margin is down to $43.7^\circ$ and the modulus margin to 0.55. Yet nothing in the *inner* loop's own margins changed at all: it still crosses at 10 rad/s with $67.4^\circ$ of phase margin.

**Step 3: read off the rule.** With a separation of 3 to 10, the outer loop keeps most of the $90^\circ$ the pure integrator promises. Below about 3, the two designs start to interfere. Choosing $K_\theta = 2$, a separation of 4.5, leaves $82.3^\circ$.

**Sanity check.** At $K_\theta = 2$ the outer crossover (2.25 rad/s) sits near 2 rad/s, where the table above shows $T_{\text{in}}$ lagging about $6^\circ$ to $7^\circ$. And $90^\circ - 82.3^\circ = 7.7^\circ$. The lost margin is the inner loop's lag, as it should be.
:::

::: key
Cascade (inner-outer) loop rule of thumb. Inner rate loop 3–10× the bandwidth of the outer attitude loop. The outer loop then sees the inner loop as $\approx 1$ and only the kinematic integrator remains. The inner loop also kills torque disturbances before they become attitude error.
:::

## The cascade is secretly one PID

Write the whole cascade out as one controller and something useful appears. There are three equations. The inner controller turns rate error into torque command: $u = C_{\text{in}}(\omega_{\text{cmd}} - \omega)$. The outer controller turns attitude error into rate command: $\omega_{\text{cmd}} = K_\theta(\theta_{\text{cmd}} - \theta)$. And rate is the derivative of angle: $\omega = s\theta$. Substitute the second and third into the first:

$$
u = C_{\text{in}}\bigl(K_\theta\theta_{\text{cmd}} - K_\theta\theta - s\theta\bigr) = C_{\text{in}}K_\theta\,\theta_{\text{cmd}} - C_{\text{in}}\bigl(s + K_\theta\bigr)\theta .
$$

The part acting on the measured angle is one attitude controller, $C_{\text{eq}}(s) = C_{\text{in}}(s)(s + K_\theta)$ ("C equivalent"). For a PI inner loop, multiply it out term by term:

$$
C_{\text{eq}}(s) = \frac{k_ps + k_i}{s}(s + K_\theta)
= \underbrace{k_p}_{k_{d,\theta}}\,s + \underbrace{\bigl(k_i + k_pK_\theta\bigr)}_{k_{p,\theta}} + \underbrace{\frac{k_iK_\theta}{s}}_{\text{integral}}.
$$

That is a **[[PID on attitude|rate-is-derivative]]** — and its derivative gain is exactly the inner proportional gain. With $k_p = 12\,000$, $k_i = 24\,000$ and $K_\theta = 2$:

- derivative gain $k_{d,\theta} = 12\,000$;
- proportional gain $k_{p,\theta} = 24\,000 + 12\,000 \times 2 = 48\,000$;
- integral gain $k_{i,\theta} = 24\,000 \times 2 = 48\,000$.

Now look at the command path, $C_{\text{in}}K_\theta\,\theta_{\text{cmd}} = K_\theta k_p\,\theta_{\text{cmd}} + K_\theta k_i\,\theta_{\text{cmd}}/s$. It has no $s$ term, so the derivative never acts on the command: setpoint weighting $c = 0$, which falls out of the structure instead of being chosen. Its proportional part is $K_\theta k_p = 24\,000$ against $48\,000$ on the measurement, so the proportional weight is $b = 0.5$ as well.

So the cascade does not produce a controller you could not have written down directly. What it produces is a *way of arriving at it* — and five practical things that matter more than the algebra, starting with the one the architecture is named for.

::: example Disturbance rejection: fast inner loop against slow single loop
**The cascade.** Hit the vehicle with a $50\ \mathrm{N\,m}$ step of disturbance torque, with $K_\theta = 2$. Write $\Delta(s) = s^3 + 50s^2 + 500s + 1000$ and $N_T(s) = 500(s+2)$ for the bottom and top of $T_{\text{in}}$. The transfer function from disturbance torque to attitude works out to

$$
\frac{\theta}{d} = \frac{s}{24\,\bigl[\,s\,\Delta(s) + K_\theta N_T(s)\bigr]}.
$$

(The 24 is $J\tau = 1200 \times 0.02$.) Simulating it, the attitude error peaks at $9.16\times10^{-4}\ \mathrm{rad}$, which is $0.0525^\circ$, at $t = 0.53\ \mathrm{s}$, and then returns to zero.

**A single loop.** Now try a single attitude PID designed "naturally" for about the same bandwidth: $k_p = 4800$, $k_i = 4800$, $k_d = 3360$ with derivative filter $N = 20$, acting directly on $1/\bigl(Js^2(\tau s+1)\bigr)$. It crosses over at $2.88\ \mathrm{rad/s}$ with $48.4^\circ$ of phase margin — a respectable design by every measure of the margins lessons. Its attitude error to the same disturbance peaks at $0.458^\circ$, [[nearly nine times worse|disturbance-picture]].

**Why.** Look back at the equivalence. This controller's derivative gain is 3360, not 12 000 — which is another way of saying its hidden rate loop is slow. The cascade did not find a loophole. It made the fast rate loop the thing you design first, so its speed is a decision rather than an accident of how the attitude gains came out.

**Squeeze the separation and the rejection gets worse in step.** Keep $K_\theta = 2$ and slow the inner loop down. The same 50 N·m step then gives a peak attitude error of $0.0525^\circ$ at a separation of 4.5, $0.118^\circ$ at 2.1, $0.152^\circ$ at 1.7 and $0.258^\circ$ at 1.2. That last design also has only $37^\circ$ of outer phase margin.

**Sanity check.** A slower helmsman lets the bow swing further before catching it, so the error should grow as the separation shrinks. It does, at every step.
:::

The other four things the inner loop buys:

**The inner loop can be tested by itself.** On a test stand or in a **[[hardware-in-the-loop|hil]]** rig you close the rate loop, leave the attitude loop open, inject a rate command and measure the response. That is a real measurement of a real transfer function. It checks the actuator model, the gyro path, the time delay and the anti-windup, all without any guidance software in the way.

**Limits belong on the rate command.** A vehicle usually has a **[[maximum body rate|rate-limit]]** it must not exceed — for sensor validity, for gimbal speed, for structural load. In a cascade that limit is a saturation on one number passed between the two controllers, with the outer loop's anti-windup attached to it. A single-loop design has no such signal to limit.

**The two loops want different sensors.** The inner loop wants a **[[rate gyro|gyro-vs-tracker]]**: fast, little delay, very low short-term noise, but a slowly drifting zero (poor bias stability). The outer loop wants an attitude reference — a star tracker, a horizon sensor, or a navigation solution. Those are accurate but slow, and often update at a fraction of the inner loop's rate. The cascade lets each loop run at the speed of its own sensor.

**Only the inner loop needs scheduling.** "$T_{\text{in}} \approx 1$" is the statement that the inner loop has soaked up the inertia, the actuator strength and all their variation. The outer plant, $1/s$, is geometry. It contains no vehicle number at all, so it never needs a gain table. On a launch vehicle whose inertia falls by a factor of five over a burn, that is the difference between scheduling two gains and scheduling five.

## Which loop did you break?

A margin is measured by cutting the loop at one point, sending a signal once around, and seeing what comes back. A cascade has more than one place to cut, and the answers are genuinely different. For the design above:

| Break point | $\omega_{gc}$ | phase margin | gain margin |
| --- | --- | --- | --- |
| Inner loop at the actuator, attitude feedback open | 10.0 rad/s | 67.4° | infinite |
| Outer loop at the attitude sensor, rate loop closed | 2.25 rad/s | 82.3° | 25.7 dB |
| Both loops closed, broken at the actuator | 10.18 rad/s | 56.3° | 19.3 dB **downward** |

The third row is the one most often left out — and it is the one an actuator fault actually tests. Its loop transfer function is

$$
C_{\text{eq}}G_\theta = \frac{500(s+2)^2}{s^3(s+50)},
$$

where $G_\theta = 1/\bigl(Js^2(\tau s + 1)\bigr)$ is the plant from torque to angle. Count the integrators: three $s$ factors on the bottom. Each costs $90^\circ$, so the phase starts at $-270^\circ$ at low frequency. It then climbs up through $-180^\circ$ at $2.085\ \mathrm{rad/s}$, where the loop's size is $|L| = 9.2$.

That makes it **[[conditionally stable|conditional-picture]]**: stable *because* the gain is high where the phase crosses $-180^\circ$. Cut the loop gain by more than a factor of 9.2 — that is, $19.3\ \mathrm{dB}$ — and the loop goes unstable. It is the same story as the unstable-plant loops of the Nyquist lesson. The upward gain margin is infinite and the downward one is 19.3 dB, so a report that quotes only "gain margin" has said nothing useful.

This design is healthy all the same. Its modulus margin is $0.840$, and its closed-loop poles are $-38.3$, $-5.14 \pm 3.09j$ and $-1.45$ — all safely in the left half plane. The point is not that this loop is bad. It is that three break points give three answers, and the specification has to say which one it means.

::: warning Rigid-body attitude loops with an integrator have a minimum gain
Any attitude loop with an integrator, closed around a rigid body, is conditionally stable. The plant brings two integrators and the controller a third, so the phase at low frequency is $-270^\circ$, and the Nyquist curve must come up through $-180^\circ$ where its size is greater than one. That is why a launch vehicle's autopilot has a minimum gain as well as a maximum. It is why the low side of a gain schedule is checked as carefully as the high side. And it is why a saturating actuator — which lowers the effective gain, as the describing function in the lesson on why margins can lie showed — is a stability question, not only a performance question.
:::

::: warning Separation is not free
Every factor of ten you give the inner loop is a factor of ten more actuator bandwidth, more noise-driven actuator motion, and less room between crossover and the first structural bending mode. A separation of 10 is comfortable on a small, stiff vehicle and impossible on a large one whose first bending mode sits at three times the rate-loop crossover you want. Three is the usual floor, and five is a common choice.
:::

::: note Loops all the way out
The same structure nests further. A launch vehicle typically runs a **[[gimbal servo loop|nesting]]** inside the rate loop, inside the attitude loop, inside a guidance loop that commands attitude — each roughly an order of magnitude slower than the one inside it. The reasoning at every level is this lesson's: the inner loop is fast enough that the outer one can treat it as a gain of one.
:::

## Check yourself

::: check
An inner rate loop crosses over at $30\ \mathrm{rad/s}$. What outer attitude bandwidth would you choose, and what would you check before accepting it?
:::

::: answer
A separation of 3 to 10 puts the outer crossover between $30/10 = 3$ and $30/3 = 10\ \mathrm{rad/s}$. The middle of that range, about $5\ \mathrm{rad/s}$, gives a separation of 6.

Before accepting it:

1. Evaluate $T_{\text{in}}$ at the proposed outer crossover. If $|T_{\text{in}}|$ is within a decibel or so of 1 and its phase lag is under about $10^\circ$, the pure-integrator design will hold up.
2. Recompute the outer loop's margins with the real $T_{\text{in}}$, not with 1.
3. Separately compute the margins of the full loop broken at the actuator with both loops closed.
4. Check that the attitude sensor's update rate and delay can support $5\ \mathrm{rad/s}$. An outer loop cannot be faster than its reference.
:::

::: check
Why is the plant seen by the outer loop free of the vehicle's uncertain parameters, and what does that do to the gain-scheduling problem?
:::

::: answer
The outer plant is $T_{\text{in}}(s)/s$. The $1/s$ is kinematics — the exact link between body rate and attitude angle. It contains no inertia, no control effectiveness, no aerodynamic coefficient.

The $T_{\text{in}}$ factor does contain those parameters. But it is a closed-loop transfer function, close to 1 wherever the inner loop is much faster than the outer. And a feedback loop's closed-loop response is far less sensitive to plant error than the plant itself is — by the factor $S$ from the first lesson.

So all the scheduling can live in the inner loop's gains, and the outer loop's single gain can stay fixed for the whole flight. That is the practical reason the architecture is universal on launch vehicles, whose inertia and control effectiveness both change by large factors during a burn.
:::

::: check
A torque disturbance of $50\ \mathrm{N\,m}$ hits a vehicle with $J = 1200\ \mathrm{kg\,m^2}$. Estimate the attitude error after 0.5 s with no control at all, and compare it with the cascade's peak of $0.0525^\circ$.
:::

::: answer
With no control, torque over inertia gives the angular acceleration: $\ddot\theta = 50/1200 = 0.04167\ \mathrm{rad/s^2}$.

Starting from rest, the angle after time $t$ is $\tfrac12\ddot\theta t^2$, so $\theta(0.5) = \tfrac12(0.04167)(0.25) = 5.21\times10^{-3}\ \mathrm{rad}$. Converting, that is $0.298^\circ$ — and still speeding up.

The cascade holds the peak to $0.0525^\circ$. That is about $0.298/0.0525 \approx 5.7$ times smaller at that instant, and — unlike the uncontrolled case — it stays bounded and returns to zero. Most of that work is done by the inner loop. It sees the disturbance as a rate error within a few tens of milliseconds, long before the double integration has had time to build an attitude error.
:::

::: check
Show that the cascade with a proportional outer loop and a PI inner loop is equivalent to a PID on attitude, and say what is different about the command path.
:::

::: answer
Substitute $\omega_{\text{cmd}} = K_\theta(\theta_{\text{cmd}} - \theta)$ and $\omega = s\theta$ into $u = C_{\text{in}}(\omega_{\text{cmd}} - \omega)$:

$$
u = C_{\text{in}}\bigl(K_\theta\theta_{\text{cmd}} - K_\theta\theta - s\theta\bigr) = C_{\text{in}}K_\theta\theta_{\text{cmd}} - C_{\text{in}}(s + K_\theta)\theta.
$$

The feedback controller is therefore $C_{\text{eq}} = C_{\text{in}}(s + K_\theta)$. For $C_{\text{in}} = (k_ps + k_i)/s$ this multiplies out to $k_ps + (k_i + k_pK_\theta) + k_iK_\theta/s$: a PID with $k_{d,\theta} = k_p$, $k_{p,\theta} = k_i + k_pK_\theta$ and $k_{i,\theta} = k_iK_\theta$.

The command path is different. $\theta_{\text{cmd}}$ passes through $C_{\text{in}}K_\theta$ and not through the $(s + K_\theta)$ factor, so the derivative term never acts on the command. In the language of the windup lesson, that is setpoint weighting with $c = 0$, obtained for free from the structure. It is why a cascade shows no derivative kick.
:::

::: check
A colleague reports "gain margin 25.7 dB, phase margin 82.3°" for a cascaded attitude loop. What question would you ask?
:::

::: answer
Where was the loop broken? Those numbers are the outer loop's, measured at the attitude sensor with the rate loop closed. They describe what happens to a disturbance entering the attitude path.

They say nothing about a disturbance at the actuator with both loops closed. For this design that break point gives $56.3^\circ$ of phase margin and, more importantly, a *downward* gain margin of $19.3\ \mathrm{dB}$ with no upward limit at all, because that loop is conditionally stable. An actuator that comes out weak, or saturates, or a scheduled gain applied at the wrong flight time, all push the loop in the direction the 19.3 dB figure measures — and the 25.7 dB figure does not. The right report gives all three break points.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Inner closed loop | $T_{\text{in}} = C_{\text{in}}G_\omega/(1 + C_{\text{in}}G_\omega)$ |
| Outer plant | $P_{\text{out}} = T_{\text{in}}/s$; $\approx 1/s$ when the inner loop is much faster |
| Separation rule | inner 3–10× the outer bandwidth |
| Example inner loop | $\omega_{gc} = 10\ \mathrm{rad/s}$, PM $67.4^\circ$; $\angle T_{\text{in}} = -6.1^\circ$ at 2 rad/s |
| Example outer loop | $K_\theta = 2$: $\omega_{gc} = 2.25\ \mathrm{rad/s}$, PM $82.3^\circ$, GM 25.7 dB, MM 0.836 |
| Separation 1.3× | PM falls to $43.7^\circ$, MM to 0.550, with the inner loop unchanged |
| Equivalent controller | $C_{\text{eq}} = C_{\text{in}}(s + K_\theta)$; a PID with $k_{d,\theta} = k_p$, $k_{i,\theta} = k_iK_\theta$; command path has $c = 0$, $b = 0.5$ here |
| Disturbance rejection | 50 N·m step: cascade peaks at $0.0525^\circ$; a same-bandwidth single PID at $0.458^\circ$ |
| Full loop at the actuator | $500(s+2)^2/\bigl(s^3(s+50)\bigr)$: PM $56.3^\circ$, **downward** GM 19.3 dB |
| Conditional stability | three integrators means the phase comes up through $-180^\circ$; there is a minimum gain |
| What the inner loop buys | fast disturbance rejection, independent testing, a place to limit rate, separate sensors, scheduling confined to one loop |

The last lesson adds two things the cascade does not give you: a path for the command that skips the feedback loop entirely, and a way to carry one design across a flight in which the vehicle stops resembling the one it was designed for.

::: context nested-loops The two loops, drawn
The outer loop compares where you point with where you want to point and asks for a turning rate. The inner loop compares that rate with the gyro's reading and asks the actuator for torque. The vehicle turns that torque into rate, and rate adds up into angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="4" y="52" font-size="11" fill="#1f2a44">θ_cmd</text>
  <line x1="38" y1="56" x2="52" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="58" cy="56" r="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="64" y1="56" x2="76" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="76" y="42" width="34" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="93" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">K_θ</text>
  <line x1="110" y1="56" x2="130" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="112" y="48" font-size="11" fill="#1f2a44">ω_cmd</text>
  <circle cx="136" cy="56" r="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="142" y1="56" x2="154" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="154" y="42" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="172" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">C_in</text>
  <line x1="190" y1="56" x2="206" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="192" y="48" font-size="11" fill="#1f2a44">u</text>
  <rect x="206" y="42" width="40" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="226" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">G_ω</text>
  <line x1="246" y1="56" x2="280" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="254" y="48" font-size="11" fill="#1f2a44">ω</text>
  <rect x="280" y="42" width="30" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">1/s</text>
  <line x1="310" y1="56" x2="350" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="336" y="48" font-size="11" fill="#1f2a44">θ</text>
  <polyline points="264,56 264,96 136,96 136,62" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="200" y="112" font-size="11" text-anchor="middle" fill="#1d6fd1">fast inner loop (gyro)</text>
  <polyline points="330,56 330,136 58,136 58,62" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="194" y="154" font-size="11" text-anchor="middle" fill="#b4232c">slow outer loop (attitude sensor)</text>
  <text x="128" y="80" font-size="11" fill="#1f2a44">−</text>
  <text x="50" y="80" font-size="11" fill="#1f2a44">−</text>
</svg>
```

Everything inside the blue loop is what $T_{\text{in}}$ describes. The outer loop sees that box followed by $1/s$.
:::

::: context kinematic-integrator Why angle is the running total of rate
A car's odometer adds up speed over time to give distance. Attitude works the same way: the gyro reads how fast you are turning, and adding that up second by second gives how far you have turned. Adding up over time is integrating, and in the Laplace picture integrating is dividing by $s$.

Nothing about the vehicle enters this step. A heavy booster and a small drone obey the same rule: $5^\circ$ per second for 2 seconds is $10^\circ$. That is why the outer loop's plant is so trustworthy. (For tumbling in three dimensions at once the bookkeeping gets more involved, but for turning about one fixed axis it is exactly $1/s$.)
:::

::: context rate-is-derivative Rate feedback is derivative feedback
A PID's derivative term pushes back against how fast the error is changing. For a vehicle holding a fixed attitude, how fast the angle error is changing *is* the body rate. So a rate gyro feeding a gain is a derivative term measured directly, with no numerical differencing and far less noise.

That is why the inner loop's proportional gain turns into the attitude PID's derivative gain. A fast inner loop and a strong derivative term are the same thing seen from two sides.
:::

::: context disturbance-picture The same push, two controllers
Both curves are the attitude error after a $50\ \mathrm{N\,m}$ step of disturbance torque, drawn to scale over five seconds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="15" x2="50" y2="195" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="46" y1="48" x2="340" y2="48" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="46" y1="104" x2="340" y2="104" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="44" y="52" font-size="11" text-anchor="end" fill="#1f2a44">0.4°</text>
  <text x="44" y="108" font-size="11" text-anchor="end" fill="#1f2a44">0.2°</text>
  <text x="44" y="164" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="108" y="210" font-size="11" text-anchor="middle" fill="#1f2a44">1 s</text>
  <text x="224" y="210" font-size="11" text-anchor="middle" fill="#1f2a44">3 s</text>
  <text x="340" y="210" font-size="11" text-anchor="middle" fill="#1f2a44">5 s</text>
  <path d="M50.0,160.0 L52.9,159.6 L55.8,157.8 L58.7,154.4 L61.6,149.8 L64.5,144.0 L67.4,137.4 L70.3,130.1 L73.2,122.4 L76.1,114.4 L79.0,106.3 L81.9,98.3 L84.8,90.3 L87.7,82.7 L90.6,75.3 L93.5,68.5 L96.4,62.1 L99.3,56.2 L102.2,50.9 L105.1,46.3 L108.0,42.3 L110.9,38.9 L113.8,36.2 L116.7,34.2 L119.6,32.8 L122.5,32.0 L125.4,31.9 L128.3,32.4 L131.2,33.4 L134.1,35.0 L137.0,37.1 L139.9,39.7 L142.8,42.8 L145.7,46.3 L148.6,50.1 L151.5,54.3 L154.4,58.8 L157.3,63.5 L160.2,68.5 L163.1,73.7 L166.0,79.0 L168.9,84.4 L171.8,89.9 L174.7,95.5 L177.6,101.1 L180.5,106.6 L183.4,112.2 L186.3,117.6 L189.2,123.0 L192.1,128.2 L195.0,133.3 L197.9,138.3 L200.8,143.1 L203.7,147.6 L206.6,152.0 L209.5,156.2 L212.4,160.1 L215.3,163.8 L218.2,167.3 L221.1,170.5 L224.0,173.5 L226.9,176.2 L229.8,178.6 L232.7,180.8 L235.6,182.8 L238.5,184.5 L241.4,186.0 L244.3,187.3 L247.2,188.3 L250.1,189.1 L253.0,189.7 L255.9,190.1 L258.8,190.3 L261.7,190.3 L264.6,190.2 L267.5,189.8 L270.4,189.4 L273.3,188.8 L276.2,188.1 L279.1,187.2 L282.0,186.3 L284.9,185.3 L287.8,184.1 L290.7,183.0 L293.6,181.7 L296.5,180.4 L299.4,179.1 L302.3,177.7 L305.2,176.4 L308.1,175.0 L311.0,173.6 L313.9,172.2 L316.8,170.8 L319.7,169.5 L322.6,168.1 L325.5,166.9 L328.4,165.6 L331.3,164.4 L334.2,163.2 L337.1,162.1 L340.0,161.0" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <path d="M50.0,160.0 L52.9,159.6 L55.8,158.1 L58.7,155.8 L61.6,153.4 L64.5,151.1 L67.4,149.1 L70.3,147.5 L73.2,146.4 L76.1,145.7 L79.0,145.4 L81.9,145.3 L84.8,145.5 L87.7,145.9 L90.6,146.5 L93.5,147.1 L96.4,147.8 L99.3,148.5 L102.2,149.2 L105.1,149.9 L108.0,150.6 L110.9,151.3 L113.8,151.9 L116.7,152.5 L119.6,153.0 L122.5,153.5 L125.4,154.0 L128.3,154.4 L131.2,154.8 L134.1,155.2 L137.0,155.5 L139.9,155.9 L142.8,156.2 L145.7,156.4 L148.6,156.7 L151.5,156.9 L154.4,157.1 L157.3,157.3 L160.2,157.5 L163.1,157.7 L166.0,157.9 L171.8,158.1 L177.6,158.4 L183.4,158.6 L189.2,158.8 L195.0,159.0 L206.6,159.2 L218.2,159.4 L229.8,159.6 L241.4,159.7 L264.6,159.8 L290.7,159.9 L340.0,160.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="148" y="26" font-size="11" fill="#b4232c">single PID: peak 0.458° at 1.29 s</text>
  <text x="58" y="182" font-size="11" fill="#1d6fd1">cascade: peak 0.0525°</text>
</svg>
```

The cascade's blue curve barely lifts off zero: its fast rate loop catches the push within a fraction of a second. The single loop lets the error build for over a second and then swings past zero on the way back.
:::

::: context hil Hardware-in-the-loop
In a **hardware-in-the-loop** test, the real flight computer and often the real actuators sit on a bench, wired to a computer that simulates the vehicle and its sensors in real time. The flight software cannot tell the difference: it reads simulated gyros, sends real commands, and sees the simulated vehicle respond.

It lets engineers test the actual code, timing and hardware against thousands of flights before any of them are real. A rate loop that can be closed on its own makes those tests clean, because a problem shows up in one small loop instead of somewhere in the whole stack.
:::

::: context rate-limit Why a vehicle has a speed limit for turning
Several things break if a vehicle turns too fast. A star tracker takes pictures of stars; spin too quickly and the stars smear into streaks it cannot match. An engine gimbal can only swing so fast. And a long, thin rocket turning quickly while flying through the air feels large sideways loads.

So attitude systems cap the commanded body rate. In a cascade that cap is a single clamp on $\omega_{\text{cmd}}$ — easy to state, easy to test.
:::

::: context gyro-vs-tracker Fast but drifting, slow but true
A gyro measures turning rate directly and can be read hundreds of times a second. Its weakness is **bias**: a small false reading that slowly wanders, so an angle built by adding up gyro rates drifts further and further off.

A star tracker compares a picture of the sky with a star catalog and gives an attitude that does not drift — but it often updates only a few to about ten times per second and needs processing time. The two are partners: the gyro covers the fast motion, and the tracker keeps correcting the slow drift. That split maps straight onto the inner and outer loops.
:::

::: context conditional-picture Watching the phase climb through −180°
Here is the phase of $L = 500(s+2)^2/\bigl(s^3(s+50)\bigr)$, the full loop broken at the actuator, on a log frequency axis from 0.1 to 100 rad/s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="100" x2="340" y2="100" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="5 3"/>
  <text x="44" y="24" font-size="11" text-anchor="end" fill="#1f2a44">−90°</text>
  <text x="44" y="104" font-size="11" text-anchor="end" fill="#b4232c">−180°</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">−270°</text>
  <text x="50" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text>
  <text x="146.7" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="243.3" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="340" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <path d="M50.0,175.0 L54.8,174.4 L59.7,173.7 L64.5,173.0 L69.3,172.1 L74.2,171.1 L79.0,170.1 L83.8,168.9 L88.7,167.5 L93.5,166.0 L98.3,164.3 L103.2,162.5 L108.0,160.4 L112.8,158.1 L117.7,155.5 L122.5,152.7 L127.3,149.5 L132.2,146.1 L137.0,142.3 L141.8,138.2 L146.7,133.8 L151.5,129.1 L156.3,124.1 L161.2,118.8 L166.0,113.4 L170.8,107.8 L175.7,102.2 L180.5,96.5 L185.3,91.0 L190.2,85.7 L195.0,80.7 L199.8,75.9 L204.7,71.5 L209.5,67.4 L214.3,63.8 L219.2,60.5 L224.0,57.7 L228.8,55.2 L233.7,53.1 L238.5,51.5 L243.3,50.2 L248.2,49.2 L253.0,48.6 L257.8,48.3 L262.7,48.4 L267.5,48.8 L272.3,49.5 L277.2,50.5 L282.0,51.8 L286.8,53.4 L291.7,55.2 L296.5,57.2 L301.3,59.4 L306.2,61.7 L311.0,64.1 L315.8,66.6 L320.7,69.1 L325.5,71.6 L330.3,74.0 L335.2,76.2 L340.0,78.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="177.5" cy="100" r="4.5" fill="#b4232c"/>
  <text x="188" y="124" font-size="11" fill="#b4232c">2.085 rad/s, |L| = 9.2</text>
  <circle cx="244.1" cy="50" r="4.5" fill="#1d6fd1"/>
  <line x1="244.1" y1="50" x2="244.1" y2="100" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="250" y="88" font-size="11" fill="#1d6fd1">PM 56.3°</text>
  <text x="218" y="36" font-size="11" fill="#1d6fd1">|L| = 1 at 10.18</text>
</svg>
```

Where the curve crosses the red line, the loop is 9.2 times too strong to reach $-1$. Shrink it by that factor and it lands on $-1$: there is a floor under the gain, not a ceiling.
:::

::: context nesting Four loops deep
The innermost loop on a launch vehicle is usually the **gimbal servo**: the small loop inside each engine actuator that drives the nozzle to the commanded angle, often with a bandwidth of tens of rad/s. Around it sits the rate loop, then the attitude loop, then guidance, which updates the attitude command every second or so and plans over minutes.

You will meet the outer end of this chain in the guidance modules, and the inner end — the servo and its sample rate — when these designs move into flight software.
:::
