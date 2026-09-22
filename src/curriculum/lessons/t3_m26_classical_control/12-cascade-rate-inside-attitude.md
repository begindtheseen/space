---
id: l12-cascade-rate-inside-attitude
title: Cascade control — a fast rate loop inside a slower attitude loop
minutes: 22
covers:
  - 'Cascade architecture: a fast rate loop inside a slower attitude loop'
---

Almost every vehicle that points at something flies two nested loops rather than one. The inner loop takes a rate command and makes the body rate follow it, using gyros and the actuator. The outer loop takes an attitude command, compares it with the measured attitude, and issues a rate command to the inner loop. Launch vehicles do this, spacecraft do this, aircraft autopilots do this, and so do quadrotors and gimballed cameras.

The architecture is worth understanding as a set of engineering decisions rather than as a diagram. The inner loop exists because a torque disturbance is much cheaper to cancel before it has been integrated twice into an attitude error; because a rate command is a physical quantity you can limit; because gyros are fast and attitude references are slow; and because the plant the outer loop sees — a kinematic integrator from rate to angle — is exact, unchanging, and free of every uncertain parameter the vehicle has.

This lesson builds the outer loop on top of the rate loop of the earlier lessons, derives the bandwidth-separation rule from the numbers, shows the equivalent single-loop controller, and then makes the point that matters most in a design review: which loop you break decides which margins you get.

## The architecture and the outer plant

Write $C_{\text{in}}$ for the inner rate controller, $G_\omega$ for the torque-to-rate plant, and $K_\theta$ for the outer attitude controller. The inner closed loop is

$$
T_{\text{in}}(s) = \frac{C_{\text{in}}G_\omega}{1 + C_{\text{in}}G_\omega},
$$

and since attitude is the integral of rate, the plant the outer loop sees is

$$
P_{\text{out}}(s) = \frac{T_{\text{in}}(s)}{s}.
$$

If $T_{\text{in}} \approx 1$ across the outer loop's bandwidth, the outer designer faces a pure integrator — the easiest plant in control — and a proportional gain $K_\theta$ gives $L_{\text{out}} = K_\theta/s$, crossover at $K_\theta$ and $90^\circ$ of phase margin. That is the whole appeal, and the condition $T_{\text{in}} \approx 1$ is what bandwidth separation buys.

Take the rate loop of the earlier lessons: $J = 1200\ \mathrm{kg\,m^2}$, $\tau = 0.02\ \mathrm{s}$, $C_{\text{in}} = 12\,000 + 24\,000/s$, giving $\omega_{gc,\text{in}} = 10\ \mathrm{rad/s}$ and $T_{\text{in}}(s) = 500(s+2)/(s^3 + 50s^2 + 500s + 1000)$. How close to 1 is it?

| $\omega$ (rad/s) | 0.5 | 1 | 2 | 3 | 5 | 10 |
| --- | --- | --- | --- | --- | --- | --- |
| $\lvert T_{\text{in}}\rvert$ | 1.012 | 1.042 | 1.110 | 1.147 | 1.128 | 0.901 |
| $\angle T_{\text{in}}$ | −0.2° | −1.2° | −6.1° | −13.2° | −27.8° | −56.3° |

At a tenth of the inner crossover the inner loop is a wire. At a fifth it costs $6^\circ$ of phase. At half it costs $28^\circ$, which is most of a design's margin.

::: example Choosing the attitude gain
Close the outer loop with a proportional gain and compute the real margins, using the actual $T_{\text{in}}$ rather than the assumption that it is 1:

| $K_\theta$ | $\omega_{gc,\text{out}}$ | separation | phase margin | gain margin | modulus margin |
| --- | --- | --- | --- | --- | --- |
| 1 | 1.05 rad/s | 9.6× | 88.7° | 31.7 dB | 0.909 |
| 2 | 2.25 rad/s | 4.5× | 82.3° | 25.7 dB | 0.836 |
| 3 | 3.45 rad/s | 2.9× | 73.4° | 22.2 dB | 0.774 |
| 5 | 5.55 rad/s | 1.8× | 58.5° | 17.7 dB | 0.670 |
| 8 | 8.00 rad/s | 1.3× | 43.7° | 13.7 dB | 0.550 |

An outer designer who assumed $T_{\text{in}} = 1$ would predict $90^\circ$ of phase margin and infinite gain margin for every row. The reality is a steady erosion, and by a separation of 1.3 the phase margin is $43.7^\circ$ and the modulus margin has fallen to 0.55. Nothing in the *inner* loop's own margins — crossover 10 rad/s, phase margin $67.4^\circ$ — changed at all.

The conventional rule comes straight out of the table: with a separation of 3 to 10 the outer loop keeps most of the $90^\circ$ the pure integrator promises, and below about 3 the two designs begin to interact. Choosing $K_\theta = 2$, a separation of 4.5, leaves $82.3^\circ$.
:::

::: key
Cascade (inner-outer) loop rule of thumb. Inner rate loop 3–10× the bandwidth of the outer attitude loop. The outer loop then sees the inner loop as $\approx 1$ and only the kinematic integrator remains. The inner loop also kills torque disturbances before they become attitude error.
:::

## Why the inner loop earns its place

Write the cascade out as one controller and something instructive appears. With $u = C_{\text{in}}(\omega_{\text{cmd}} - \omega)$, $\omega_{\text{cmd}} = K_\theta(\theta_{\text{cmd}} - \theta)$ and $\omega = s\theta$,

$$
u = C_{\text{in}}K_\theta\,\theta_{\text{cmd}} - C_{\text{in}}\bigl(s + K_\theta\bigr)\theta .
$$

The feedback path is a single attitude controller $C_{\text{eq}}(s) = C_{\text{in}}(s)(s + K_\theta)$. For a PI inner loop that expands to

$$
C_{\text{eq}}(s) = \frac{k_ps + k_i}{s}(s + K_\theta)
= \underbrace{k_p}_{k_{d,\theta}}\,s + \underbrace{\bigl(k_i + k_pK_\theta\bigr)}_{k_{p,\theta}} + \underbrace{\frac{k_iK_\theta}{s}}_{\text{integral}},
$$

a PID on attitude — and the derivative gain is exactly the inner proportional gain. With $k_p = 12\,000$, $k_i = 24\,000$ and $K_\theta = 2$ the equivalent attitude PID is $k_{p,\theta} = 48\,000$, $k_{i,\theta} = 48\,000$, $k_{d,\theta} = 12\,000$, with the derivative acting on the measurement only — setpoint weighting $c = 0$, which falls out of the structure rather than being chosen.

So the cascade is not producing a transfer function you could not have written down directly. What it produces is a *way of arriving at it*, and five practical things that matter more than the algebra, beginning with the one the architecture is named for.

::: example Disturbance rejection: fast inner loop against slow single loop
A torque disturbance is caught by a 10 rad/s loop rather than a 2 rad/s one. Simulate a $50\ \mathrm{N\,m}$ step torque disturbance on the cascade with $K_\theta = 2$. The transfer function from disturbance torque to attitude works out to $s/\bigl(24\,[\,s\,\Delta(s) + K_\theta N_T(s)]\bigr)$ with $\Delta$ and $N_T$ the denominator and numerator of $T_{\text{in}}$; integrating it, the attitude error peaks at $9.16\times10^{-4}\ \mathrm{rad} = 0.0525^\circ$ at $t = 0.53\ \mathrm{s}$ and returns to zero.

Now a single attitude PID designed "naturally" for the same bandwidth: $k_p = 4800$, $k_i = 4800$, $k_d = 3360$ with $N = 20$, acting directly on $1/\bigl(Js^2(\tau s+1)\bigr)$. It crosses over at $2.88\ \mathrm{rad/s}$ with $48.4^\circ$ of phase margin — a respectable design by every measure of the margins lesson — and its attitude error to the same disturbance peaks at $0.458^\circ$, nearly nine times worse.

The reason is visible in the equivalence above: this controller's derivative gain is 3360 rather than 12 000, which is another way of saying its rate loop is slow. The cascade did not find a loophole; it made the fast rate loop the thing you design first, so that its speed is a decision rather than an accident of how the attitude gains came out.

Degrading the separation degrades the rejection in step. Holding the outer gain at $K_\theta = 2$ and slowing the inner loop, the same 50 N·m step gives a peak attitude error of $0.0525^\circ$ at a separation of 4.5, $0.118^\circ$ at 2.1, $0.152^\circ$ at 1.7 and $0.258^\circ$ at 1.2 — the last of which also has only $37^\circ$ of outer phase margin.
:::

**The inner loop can be tested by itself.** On a test stand or in a hardware-in-the-loop rig you close the rate loop, leave the attitude loop open, inject a rate command and measure the response. That is a real measurement of a real transfer function, and it validates the actuator model, the gyro path, the latency and the anti-windup independently of any guidance logic.

**Limits belong on the rate command.** A vehicle usually has a maximum body rate it may not exceed — for sensor validity, for gimbal rate, for load. In a cascade that is a saturation on one scalar signal between the two controllers, with the outer loop's anti-windup attached to it. In a single-loop design there is no such signal.

**The two loops need different sensors.** The inner loop wants a rate gyro: fast, low latency, excellent short-term noise, poor bias stability. The outer loop wants an attitude reference: a star tracker, a horizon sensor, an integrated navigation solution — accurate, slow, and often updating at a fraction of the inner loop's rate. The cascade lets each loop run at the rate of its own sensor.

**Only the inner loop needs scheduling.** $T_{\text{in}} \approx 1$ is the statement that the inner loop has absorbed the inertia, the actuator effectiveness and their variation. The outer plant, $1/s$, is kinematics: it contains no vehicle parameter at all and never needs a gain table. On a launch vehicle whose inertia falls by a factor of five over a burn, that is the difference between scheduling two gains and scheduling five.

## Which loop did you break?

The same cascade has more than one set of margins, and the numbers are genuinely different. For the design above:

| Break point | $\omega_{gc}$ | phase margin | gain margin |
| --- | --- | --- | --- |
| Inner loop at the actuator, attitude feedback open | 10.0 rad/s | 67.4° | infinite |
| Outer loop at the attitude sensor, rate loop closed | 2.25 rad/s | 82.3° | 25.7 dB |
| Both loops closed, broken at the actuator | 10.18 rad/s | 56.3° | 19.3 dB **downward** |

The third row is the one most likely to be omitted and the one an actuator failure actually probes. Its loop transfer function is $C_{\text{eq}}G_\theta = 500(s+2)^2/\bigl(s^3(s+50)\bigr)$: three integrators, so the phase starts at $-270^\circ$ and climbs through $-180^\circ$ at $2.085\ \mathrm{rad/s}$, where $|L| = 9.2$. That is a **conditionally stable** loop — it is stable because the gain there is *high*, and reducing the loop gain by more than $19.3\ \mathrm{dB}$ destabilises it, exactly as for the unstable-plant loops of the Nyquist lesson. The upward gain margin is infinite and the downward one is 19.3 dB, and a report that quotes only "gain margin" has said nothing useful.

Its modulus margin is $0.840$ and the closed-loop poles are $-38.3$, $-5.14 \pm 3.09j$ and $-1.45$, so the design is healthy. The point is not that this loop is bad; it is that three break points give three answers and the specification has to say which one it means.

::: warning
Any attitude loop with an integrator, closed around a rigid body, is conditionally stable. The plant contributes two integrators and the controller a third, so the phase at low frequency is $-270^\circ$ and the Nyquist curve must come up through $-180^\circ$ from a magnitude greater than one. This is why a launch vehicle's autopilot has a minimum gain as well as a maximum, why the gain schedule's low side is checked as carefully as its high side, and why a saturating actuator — which reduces effective gain, as the nonlinearity lesson showed — is a stability question and not only a performance question.
:::

::: warning
Bandwidth separation is not free. Every factor of ten you give the inner loop is a factor of ten more actuator bandwidth, more noise-driven actuator motion and less room between crossover and the first structural mode. A separation of 10 is comfortable on a small, stiff vehicle and impossible on a large one whose first bending mode sits at three times the desired rate-loop crossover. Three is the usual floor and five is a common choice.
:::

::: note
The same structure nests further. A launch vehicle typically runs a gimbal servo loop inside the rate loop inside the attitude loop inside a guidance loop that commands attitude, each roughly an order of magnitude slower than the one inside it. The reasoning at every level is the one in this lesson: the inner loop is fast enough that the outer one can treat it as a gain of one.
:::

## Check yourself

::: check
An inner rate loop crosses over at $30\ \mathrm{rad/s}$. What outer attitude bandwidth would you choose, and what would you check before accepting it?
:::

::: answer
A separation of 3 to 10 puts the outer crossover between $3$ and $10\ \mathrm{rad/s}$; choosing the middle of the range, about $5\ \mathrm{rad/s}$, gives a separation of 6. Before accepting it, evaluate $T_{\text{in}}$ at the proposed outer crossover: if $|T_{\text{in}}|$ is within a decibel or so of 1 and its phase lag is under about $10^\circ$, the pure-integrator design will hold up. Then recompute the outer loop's margins with the real $T_{\text{in}}$ rather than with 1, and separately compute the margins of the full loop broken at the actuator with both loops closed. Also check that the attitude sensor's update rate and latency can support $5\ \mathrm{rad/s}$ — an outer loop cannot be faster than its reference.
:::

::: check
Why is the plant seen by the outer loop free of the vehicle's uncertain parameters, and what does that do to the gain-scheduling problem?
:::

::: answer
The outer plant is $T_{\text{in}}(s)/s$. The $1/s$ is kinematics — the exact relationship between body rate and attitude angle — and contains no inertia, no control effectiveness, no aerodynamic derivative. The $T_{\text{in}}$ factor does contain those parameters, but it is a closed-loop transfer function that is close to 1 wherever the inner loop is much faster than the outer, and a feedback loop's closed-loop response is far less sensitive to plant error than the plant is, by the factor $S$ from the first lesson. So all the scheduling can live in the inner loop's gains, and the outer loop's single gain can be fixed for the whole flight. This is the practical reason the architecture is universal on launch vehicles, whose inertia and control effectiveness both change by large factors during a burn.
:::

::: check
A torque disturbance of $50\ \mathrm{N\,m}$ hits a vehicle with $J = 1200\ \mathrm{kg\,m^2}$. Estimate the attitude error after 0.5 s with no control at all, and compare with the cascade's measured peak of $0.0525^\circ$.
:::

::: answer
Open loop, $\ddot\theta = 50/1200 = 0.04167\ \mathrm{rad/s^2}$, so $\theta(0.5) = \tfrac12(0.04167)(0.25) = 5.21\times10^{-3}\ \mathrm{rad} = 0.298^\circ$ and still accelerating. The cascade holds the peak to $0.0525^\circ$, about 5.7 times smaller at that instant and — unlike the open-loop case — bounded and returning to zero. Most of that rejection is done by the inner loop, which sees the disturbance as a rate error within a few tens of milliseconds, long before the double integration has had time to build an attitude error.
:::

::: check
Show that the cascade with a proportional outer loop and a PI inner loop is equivalent to a PID on attitude, and say what is different about the command path.
:::

::: answer
With $\omega_{\text{cmd}} = K_\theta(\theta_{\text{cmd}} - \theta)$ and $\omega = s\theta$, the inner controller produces $u = C_{\text{in}}\bigl(K_\theta\theta_{\text{cmd}} - K_\theta\theta - s\theta\bigr) = C_{\text{in}}K_\theta\theta_{\text{cmd}} - C_{\text{in}}(s + K_\theta)\theta$. The feedback controller is therefore $C_{\text{eq}} = C_{\text{in}}(s + K_\theta)$, and for $C_{\text{in}} = (k_ps + k_i)/s$ this is $k_ps + (k_i + k_pK_\theta) + k_iK_\theta/s$: a PID with $k_{d,\theta} = k_p$, $k_{p,\theta} = k_i + k_pK_\theta$ and $k_{i,\theta} = k_iK_\theta$. The command path is different: $\theta_{\text{cmd}}$ passes through $C_{\text{in}}K_\theta$ and not through the $(s + K_\theta)$ factor, so the derivative term never acts on the command. In the language of the windup lesson that is setpoint weighting with $c = 0$, obtained for free from the structure — and it is why a cascade does not exhibit derivative kick.
:::

::: check
A colleague reports "gain margin 25.7 dB, phase margin 82.3°" for a cascaded attitude loop. What question would you ask?
:::

::: answer
Where the loop was broken. Those numbers are the outer loop's, measured at the attitude sensor with the rate loop closed, and they describe what happens to a perturbation entering the attitude path. They say nothing about a perturbation at the actuator with both loops closed, which for this design gives $56.3^\circ$ of phase margin and, more importantly, a *downward* gain margin of $19.3\ \mathrm{dB}$ with no upward limit at all, because that loop is conditionally stable. An actuator that comes out weak, or that saturates, or a scheduled gain applied at the wrong flight time, all move the loop the way the 19.3 dB figure measures and the 25.7 dB figure does not. The right report gives all three break points.
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
| Equivalent controller | $C_{\text{eq}} = C_{\text{in}}(s + K_\theta)$; a PID with $k_{d,\theta} = k_p$, $k_{i,\theta} = k_iK_\theta$ |
| Disturbance rejection | 50 N·m step: cascade peaks at $0.0525^\circ$; a same-bandwidth single PID at $0.458^\circ$ |
| Full loop at the actuator | $500(s+2)^2/\bigl(s^3(s+50)\bigr)$: PM $56.3^\circ$, **downward** GM 19.3 dB |
| Conditional stability | three integrators means the phase comes up through $-180^\circ$; there is a minimum gain |
| What the inner loop buys | fast disturbance rejection, independent testing, a place to limit rate, separate sensors, scheduling confined to one loop |

The last lesson adds the two things the cascade does not provide: a path for the command that does not go through the feedback loop at all, and a way to carry a design across a flight in which the vehicle stops resembling the one it was designed for.
