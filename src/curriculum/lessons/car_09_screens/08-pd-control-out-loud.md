---
id: l08-pd-control-out-loud
title: "PD control, out loud"
minutes: 22
covers:
  - reported topics: PD control, orbit determination, frequency-domain analysis
---

Look at the top of a screen door. There is often a little arm with a cylinder in it, a door closer. A spring pulls the door shut — the further open, the harder it pulls. A damper, a piston pushing oil through a hole, resists *speed* — the faster the door moves, the harder it pushes back. Without the damper the door slams and bounces. Without the spring it never shuts. You need one term for *where* the door is and one for *how fast* it moves.

That is PD control, and it is the first of three topics this module's source material reports coming up on GNC phone screens. The other two are frequency-domain analysis (next lesson) and orbit determination (the one after).

Here the standard changes. So far this module has been about how to say things, careful to flag where this curriculum cannot know how an employer behaves. No such caution now. Where are the closed-loop poles of a PD-controlled double integrator? There is a right answer, and the assessment is whether you produce it accurately, out loud, in minutes.

::: key
Reported phone-screen GNC topics: PD control, orbit determination and frequency-domain analysis. Expect the interviewer to go three questions deep on whichever one you answer best.
:::

PD comes first because it is the most natural fundamentals question in the subject, and its answer holds three things easy to half-know: why proportional control alone never settles, where the closed-loop poles actually sit, and why the derivative term is never built as a true derivative.

## The plant, and why it is a double integrator

Picture a spacecraft turning about one axis. Nothing pulls it back toward any angle — no air, no spring. Twist it and it keeps turning until you twist it back.

Newton's second law for turning says

$$J\ddot{\theta} = u$$

Read it aloud as "J times theta double-dot equals u". Here:

- $\theta$ ("theta") is the angle, in radians;
- $\ddot{\theta}$ ("theta double-dot") is the **angular acceleration**, how fast the turning rate is changing; one dot, $\dot{\theta}$, is the turning rate itself;
- $J$ is the **moment of inertia** about that axis, in $\mathrm{kg\,m^2}$ — how hard the body is to spin up, the turning version of mass;
- $u$ is the **torque** you apply, in $\mathrm{N\,m}$ — a twisting push, from thrusters or a **[[reaction wheel|reaction-wheel]]**.

Torque sets acceleration. Add up acceleration over time and you get rate; add up rate and you get angle. Two "adding up" steps — two integrations — so this is a **double integrator**.

Control engineers usually write the plant as a **transfer function**: the ratio of output to input after a **[[Laplace transform|laplace-s]]**, a tool that turns "take a derivative" into "multiply by $s$". Each dot becomes a factor of $s$:

$$G(s) = \frac{\theta(s)}{u(s)} = \frac{1}{Js^2}$$

The values of $s$ that make the bottom of a transfer function zero are its **[[poles|s-plane]]**. They describe how the system naturally moves: where they sit tells you whether it settles, rings or runs away. Here $Js^2 = 0$ gives two poles at the origin, $s = 0$.

It is not a toy. A reaction-wheel loop, a thruster pointing loop, and the rigid-body part of a launch vehicle's pitch loop all reduce to it once smaller effects are stripped away.

Say these assumptions out loud when you use it:

- rigid body;
- one axis, so the coupling terms between axes (in Euler's equations) drop out;
- small angles, so the geometry stays linear;
- no restoring moment — nothing pulling it back;
- an actuator fast enough that its own delay can be ignored.

Each is where a real design departs from the model. Naming them is the difference between using the model and believing it.

## Why proportional control alone fails

Take the target angle as zero, so $\theta$ is the error. The simplest controller pushes back in proportion to it: $u = -k_p\theta$. The **proportional gain** $k_p$ ("k sub p") says how hard. Put that into $J\ddot{\theta} = u$, move everything to one side, and swap each dot for an $s$. The result is the **characteristic equation**, whose roots are the closed-loop poles:

$$Js^2 + k_p = 0 \;\Rightarrow\; s = \pm j\sqrt{k_p/J}$$

($j$ is engineers' $\sqrt{-1}$.) Both poles sit on the imaginary axis for every positive $k_p$. The loop is **marginally stable**: nudge it and it oscillates forever at $\sqrt{k_p/J}$ radians per second, neither growing nor dying away.

Have this ready, because the follow-up is always *can't you turn up the gain?* Raising $k_p$ slides the poles further along the imaginary axis, so the oscillation gets faster. They never move left, the direction that means "dies away".

Why not? Proportional feedback is a **[[spring|spring-damper]]**: a push that grows with position. The plant has no friction of its own. A mass on a spring with nothing to slow it bounces forever, however stiff the spring. To damp it you need a push that grows with *speed*.

::: key
A double integrator under pure proportional control has closed-loop poles at $s = \pm j\sqrt{k_p/J}$: purely imaginary for every gain, so the response is an undamped oscillation at $\sqrt{k_p/J}$ rad/s. No choice of proportional gain stabilizes it, because damping requires a term in the rate.
:::

## Adding derivative action

Add the door closer's damper: a term in the rate, with **derivative gain** $k_d$. Take $u = -k_p\theta - k_d\dot{\theta}$. Substituting into $J\ddot{\theta} = u$ and moving everything to the left:

$$J\ddot{\theta} + k_d\dot{\theta} + k_p\theta = 0 \;\Rightarrow\; Js^2 + k_d s + k_p = 0$$

Every second-order system fits one standard form, described by two numbers:

$$s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$$

- $\omega_n$ ("omega sub n") is the **natural frequency**, in rad/s — how fast it would ring with no damping.
- $\zeta$ ("zeta") is the **[[damping ratio|damping-ratio]]**, with no units — $0$ means rings forever, $1$ means the edge of overshooting.

Divide our equation by $J$ and match the two forms term by term: $\omega_n^2 = k_p/J$ and $2\zeta\omega_n = k_d/J$. Solve each:

$$\omega_n = \sqrt{\frac{k_p}{J}}, \qquad \zeta = \frac{k_d}{2\sqrt{k_p J}}$$

Read the other way — which is how you actually design, starting from the behavior you want —

$$k_p = J\omega_n^2, \qquad k_d = 2\zeta\omega_n J$$

The quadratic formula puts the poles at

$$s = -\zeta\omega_n \pm j\,\omega_n\sqrt{1-\zeta^2}$$

for $\zeta < 1$. The real part, $-\zeta\omega_n$, is negative, so the motion dies away: the derivative moved the poles left, which $k_p$ alone never could.

**Units.** $k_p$ is torque per angle, $\mathrm{N\,m/rad}$; $k_d$ is torque per angular rate, $\mathrm{N\,m\,s/rad}$. Checking them catches a misplaced $J$ at once.

Two more facts worth carrying:

- The two-percent **settling time** — until the motion stays within 2% of its final value — is about $4/(\zeta\omega_n)$. That is [[four time constants|four-time-constants]] of the shrinking envelope.
- $\zeta = 1/\sqrt{2} \approx 0.707$ is a common choice for a reason. The standard second-order system's frequency response has a **resonant peak** — a frequency where it overreacts — at $\omega_n\sqrt{1-2\zeta^2}$. That is a real frequency only when $\zeta < 1/\sqrt{2}$. At or above that damping, there is no peak at all.

::: key
With $u = -k_p\theta - k_d\dot{\theta}$ the closed loop is $Js^2 + k_d s + k_p = 0$, giving $\omega_n = \sqrt{k_p/J}$ and $\zeta = k_d/(2\sqrt{k_p J})$. Designing from a specification: $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$, with poles at $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2}$ and a two-percent settling time of about $4/(\zeta\omega_n)$.
:::

## The zero nobody mentions

This trap catches candidates who memorized the second-order results without deriving them.

Suppose you build the controller with both terms acting on the **error**, command minus measurement: $u = k_p(\theta_c - \theta) - k_d\frac{d}{dt}(\theta_c - \theta)$, where $\theta_c$ is the commanded angle. Then the transfer function from command to output is

$$\frac{\theta(s)}{\theta_c(s)} = \frac{k_d s + k_p}{Js^2 + k_d s + k_p}$$

The top now has a root too. A value of $s$ that makes the *top* zero is called a **zero**, and this one is at $s = -k_p/k_d$.

The standard **overshoot** formula — how far the response swings past its target, as a fraction —

$$M_p = e^{-\zeta\pi/\sqrt{1-\zeta^2}}$$

describes a system with those poles and *no zero*. A zero near the poles adds overshoot, often a lot. So quoting the textbook overshoot after giving the poles is quietly wrong — about the thing an interviewer can check fastest by simulating.

The fix has a name worth knowing: put the proportional term on the error and the derivative term on the **measurement only**,

$$u = k_p(\theta_c - \theta) - k_d\dot{\theta}.$$

The loop itself is unchanged, so every stability margin is unchanged. But command-to-output becomes $k_p/(Js^2 + k_d s + k_p)$ — no zero — and the overshoot matches the formula again.

Bonus: it removes **[[derivative kick|derivative-kick]]**, the spike a differentiated command step sends into the actuator.

::: example Designing the loop, with numbers
**Interviewer:** Sketch me a PD controller for a double integrator and tell me where the closed-loop poles end up.

**A strong answer, narrated:**

"I will set up the plant, say why proportional alone will not do, then design from a specification and put numbers on it. Assumptions: rigid body, single axis, vacuum so there is no restoring moment, small angles, and an actuator fast enough to ignore.

Plant: $J\ddot{\theta} = u$, so $G(s) = 1/(Js^2)$. Take a spacecraft controlled by reaction wheels, $J = 120\,\mathrm{kg\,m^2}$ about this axis.

Proportional only gives $Js^2 + k_p = 0$, poles at $\pm j\sqrt{k_p/J}$ — on the imaginary axis for any gain, so it rings forever. Raising the gain only raises the ringing frequency.

So PD. Say I want $\omega_n = 0.5\,\mathrm{rad/s}$ — a settling time of order ten seconds, reasonable for a wheel-controlled spacecraft turning and settling — and $\zeta = 0.7$.

$k_p = J\omega_n^2 = 120 \times 0.25 = 30\,\mathrm{N\,m/rad}$.

$k_d = 2\zeta\omega_n J = 2 \times 0.7 \times 0.5 \times 120 = 84\,\mathrm{N\,m\,s/rad}$.

Poles at $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2} = -0.35 \pm j\,0.357\,\mathrm{rad/s}$.

Checks. Units: $k_p$ is newton meters per radian, $k_d$ newton meters per radian per second — both right. Settling time $4/(\zeta\omega_n) = 4/0.35$, about 11 seconds, matching what I asked for. The undamped version would ring at $0.5\,\mathrm{rad/s}$, a period of $2\pi/0.5 \approx 12.6$ seconds, so settling in about one ring period is the right order.

One flag: if both terms act on the error, command-to-output has a zero at $-k_p/k_d = -30/84 \approx -0.357\,\mathrm{rad/s}$, right on top of the poles' real part. That adds a lot of overshoot beyond the four and a half percent the formula gives for $\zeta = 0.7$; simulated, it comes out around twenty percent. If overshoot matters, I would put the derivative on the measurement only, which removes the zero from the command path and leaves every margin untouched."

**Why this is strong.** Under four minutes, it states assumptions before any algebra, derives the marginal-stability result, designs from a specification, carries units through, and closes with three checks. The last paragraph lifts it above a textbook answer: the candidate noticed a clash between two things they know — the pole locations and the overshoot formula — and resolved it. Interviewers look for exactly that and rarely find it.
:::

## Steady-state error, and when you need the integral

PD is not PID. The natural follow-up is when the missing I — **integral** — term matters.

Suppose a small constant **disturbance torque** $T_d$ keeps twisting the spacecraft: a slightly misaligned thruster, sunlight pressing harder on one side, a center of mass a little off-center. With the loop trying to hold zero angle:

$$J\ddot{\theta} = -k_p\theta - k_d\dot{\theta} + T_d$$

Wait until everything settles. In **steady state** nothing is moving or speeding up, so $\ddot{\theta} = \dot{\theta} = 0$. What is left is $0 = -k_p\theta_{ss} + T_d$, so

$$\theta_{ss} = \frac{T_d}{k_p}$$

A constant push gives a constant leftover tilt, like a spring stretched by a hanging weight. The derivative gain drops out: in steady state there is no rate to act on.

With the gains above and $T_d = 0.02\,\mathrm{N\,m}$, the offset is $\theta_{ss} = 0.02/30 = 6.67 \times 10^{-4}\,\mathrm{rad}$, about $0.038$ degrees. Is that acceptable? That is a requirements question, and saying so is the correct answer: *it depends on the pointing budget.*

If not, integral action — adding up the error over time and pushing until it is gone — drives it to zero. The cost: **phase lag** (delay in the loop's reaction) near the crossover frequency of the next lesson, which eats stability margin, and **[[integrator windup|windup]]** whenever the actuator saturates, which needs an **anti-windup** scheme.

::: warning Do not reach for PID by default
The reflex "you would use a PID controller" is weaker than it sounds. The integral buys one thing — zero steady-state error against a constant disturbance — and costs phase margin and windup handling. Many spacecraft attitude loops are PD because the disturbances are small, the pointing budget tolerates a small offset, and the margin is worth more. Say what the integral is for before adding it.
:::

## Why derivative action is filtered

This is on this module's drill list. The full answer has four parts; most candidates give one.

**It cannot be built.** The ideal derivative, $k_d s$, has a gain that grows without limit as frequency rises. A transfer function like that is called **improper**. No physical system behaves that way, so it can only be approximated.

**It amplifies noise.** Its gain rises with frequency, so a differentiator passes the fastest-wiggling part of the measurement most strongly — and for a real sensor, that is noise. Suppose you estimate rate by differencing two position readings, each rounded to a step $q$ (the **[[quantization|quantization]]** step), a sample period $T$ apart. The rounding alone can put an error of order $q/T$ into the rate. Sample faster and the derivative gets noisier, not better.

**The fix.** Replace $k_d s$ with a **filtered derivative**,

$$\frac{k_d s}{\tau s + 1}$$

It acts as a differentiator below the frequency $1/\tau$ and [[levels off|filtered-derivative]] to a fixed gain of $k_d/\tau$ above it. The **time constant** $\tau$ ("tau") is chosen so the filter only starts rolling off well above the closed-loop bandwidth. Filter too early and it eats the phase lead the derivative was added to provide. That trade — phase lead against noise — is the whole design decision.

**The better fix, where available.** A spacecraft or launch vehicle usually has a **[[rate gyro|rate-gyro]]** that measures turning rate directly. Feed back the measured rate and you get the damping term with no differentiating and no noise amplification. Interviewers are most pleased to hear this, because it is what is actually done — you differentiate only when the rate is not measured.

::: example "Why is derivative action filtered?"
**Weak answer:** "Because the derivative amplifies noise. If your sensor is noisy, taking the derivative makes it much worse, so you put a low-pass filter on it to smooth it out."

**Strong answer:**

"Three reasons, and then what I would actually do instead.

First, a pure derivative is improper — its gain rises without limit with frequency, so it cannot be built. Any implementation is an approximation whether you meant one or not.

Second, that rising gain amplifies the highest-frequency content most, which is sensor noise. Differencing a quantized position, the rate error is of order the quantization step over the sample period — worse as you sample faster, the opposite of what you would expect.

Third, if the derivative acts on the error, a step in the command differentiates to a spike into the actuator. That is derivative kick, a separate problem from noise.

The standard fix for the first two is a filtered derivative, $k_ds/(\tau s + 1)$: it differentiates below $1/\tau$ and flattens to a gain of $k_d/\tau$ above it, so the high-frequency gain is bounded. Choosing $\tau$ is a trade — filter too early and you lose the phase lead near crossover; too late and you have barely filtered. The fix for the third is to differentiate the measurement only, never the command.

But on a vehicle with a rate gyro I would not differentiate at all. Feed back the measured rate and you get the damping term directly. The only reason to differentiate a position signal is that you have no rate measurement."

**What makes the difference.** The weak answer says one true thing and stops: no mechanism, no filter form, no trade, nothing on realizability or kick. Worst, it misses the engineering answer — on these vehicles the rate is usually measured, not derived. The strong answer announces its count, sizes the noise, names the trade, and ends somewhere the interviewer can push further.

**Sanity check:** halve $T$ with the same $q$ and $q/T$ doubles — faster sampling really does make the differenced rate noisier.
:::

::: note One sentence about running on a computer
What changes when this runs on a computer at a fixed rate? Holding each output constant for a sample period $T$ — a **[[zero-order hold|zero-order-hold]]** — acts roughly like a pure delay of $T/2$. A delay adds phase lag that grows with frequency, about $\omega T/2$ radians at frequency $\omega$, which eats stability margin near the crossover frequency. That is the bridge to the next lesson, where phase margin gets defined properly and this delay becomes a number.
:::

## Check yourself

::: check
State the closed-loop poles of a double integrator under pure proportional feedback, and explain in physical terms why no choice of gain stabilizes it.
:::

::: answer
The characteristic equation is $Js^2 + k_p = 0$, so the poles are at $s = \pm j\sqrt{k_p/J}$ — purely imaginary for every positive gain, giving an undamped oscillation at $\sqrt{k_p/J}$ rad/s.

Physically, proportional feedback is a spring: torque in step with the position error. The plant, a free rigid body, has no damping of its own, and a mass on a spring with no damper oscillates forever. Raising $k_p$ only stiffens the spring, moving the poles along the imaginary axis, not left. Damping needs a torque in step with the rate.
:::

::: check
A rigid body has $J = 200\,\mathrm{kg\,m^2}$ about the axis of interest, and you want $\omega_n = 0.4\,\mathrm{rad/s}$ with $\zeta = 0.7$. Give the gains with units, the pole locations, and one sanity check.
:::

::: answer
$k_p = J\omega_n^2 = 200 \times 0.16 = 32\,\mathrm{N\,m/rad}$.

$k_d = 2\zeta\omega_n J = 2 \times 0.7 \times 0.4 \times 200 = 112\,\mathrm{N\,m\,s/rad}$.

Poles: $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2} = -0.28 \pm j\,0.286\,\mathrm{rad/s}$.

Check: the two-percent settling time is about $4/(\zeta\omega_n) = 4/0.28 \approx 14$ seconds. The undamped period is $2\pi/0.4 \approx 15.7$ seconds, so the loop settles in about one natural period — the same pattern as the worked example, so the right order. The units check too: $k_p$ is a torque per angle and $k_d$ a torque per angular rate.
:::

::: check
Why does an answer that reports the pole locations and then quotes $M_p = e^{-\zeta\pi/\sqrt{1-\zeta^2}}$ for the overshoot risk being wrong, and what implementation change makes it right?
:::

::: answer
That formula is for a system with the given pole pair and no zero. A PD controller acting on the error puts a zero at $s = -k_p/k_d$ into the command-to-output transfer function, $(k_ds + k_p)/(Js^2 + k_ds + k_p)$. A zero near the poles adds overshoot, sometimes several times what the formula predicts.

The fix: proportional term on the error, derivative term on the measurement only. The loop transfer function — and so every stability margin — is unchanged, but command-to-output becomes $k_p/(Js^2 + k_ds + k_p)$, with no zero, so the formula applies again. It also removes derivative kick.
:::

::: check
Derive the steady-state angular error of a PD-controlled double integrator subject to a constant disturbance torque, and say what the derivative gain contributes to it.
:::

::: answer
With the loop holding zero and a constant disturbance torque $T_d$ at the plant input, $J\ddot{\theta} = -k_p\theta - k_d\dot{\theta} + T_d$. In steady state $\ddot{\theta} = \dot{\theta} = 0$, leaving $0 = -k_p\theta_{ss} + T_d$, so $\theta_{ss} = T_d/k_p$.

The derivative gain contributes nothing: in steady state there is no rate to act on, so damping changes how the error is approached, not where it settles. To shrink the offset, raise $k_p$ (which also raises the bandwidth) or add integral action, at the cost of phase lag near crossover and anti-windup.
:::

::: check
Give the four distinct reasons derivative action is filtered or avoided, and identify which one an interviewer is most pleased to hear on a spacecraft question.
:::

::: answer
1. An ideal derivative is improper, with unlimited gain at high frequency, so it cannot be built.
2. That rising gain amplifies noise. Differencing a quantized position, the rate error is of order quantization step over sample period, so faster sampling makes it worse.
3. Differentiating the error turns a command step into a spike at the actuator — derivative kick.
4. The one an interviewer most wants: with a rate gyro you do not differentiate at all. Feeding back the measured rate gives the damping term directly; the problem only arises without a rate measurement.
:::

::: check
An interviewer asks why you would not use a PID controller by default for every attitude loop. Give the answer.
:::

::: answer
Because the integral term buys exactly one thing — zero steady-state error against a constant disturbance — and it is not free. It adds phase lag near the crossover frequency, costing stability margin on a plant that has none of its own to spare. And it winds up whenever the actuator saturates, which needs an explicit anti-windup scheme.

Many spacecraft loops are PD because the offset $T_d/k_p$ fits the pointing budget and the margin is worth more. So: say what the integral is for, check whether the offset breaks a requirement, and add it only if it does.
:::

## Summary

| Quantity | Expression | Units |
| --- | --- | --- |
| Plant (rigid body, one axis) | $G(s) = 1/(Js^2)$ | $\mathrm{rad/(N\,m)}$ |
| Proportional-only poles | $s = \pm j\sqrt{k_p/J}$ | $\mathrm{rad/s}$ |
| PD characteristic equation | $Js^2 + k_ds + k_p = 0$ | — |
| Natural frequency, damping | $\omega_n = \sqrt{k_p/J}$, $\zeta = k_d/(2\sqrt{k_pJ})$ | $\mathrm{rad/s}$, — |
| Gains from a specification | $k_p = J\omega_n^2$, $k_d = 2\zeta\omega_nJ$ | $\mathrm{N\,m/rad}$, $\mathrm{N\,m\,s/rad}$ |
| Closed-loop poles | $-\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2}$ | $\mathrm{rad/s}$ |
| Settling time (2%) | $\approx 4/(\zeta\omega_n)$ | $\mathrm{s}$ |
| Command-path zero (D on error) | $s = -k_p/k_d$ | $\mathrm{rad/s}$ |
| Steady-state error to constant torque | $\theta_{ss} = T_d/k_p$ | $\mathrm{rad}$ |
| Filtered derivative | $k_ds/(\tau s + 1)$, high-frequency gain $k_d/\tau$ | — |

The next lesson takes the same loop into the frequency domain and defines the quantity an interviewer is most likely to ask you to explain physically: phase margin — what it means in seconds of delay you can tolerate, and how it connects to the damping ratio you designed for.

::: context reaction-wheel Turning by spinning a wheel
A **reaction wheel** is a heavy flywheel inside a spacecraft, driven by an electric motor. Speed the wheel up one way and the spacecraft turns the other way — the same reason a person on a spinning office chair twists when they swing their arms. No propellant is used, so wheels are the standard way to point telescopes and Earth-watching satellites precisely. The catch: a wheel can only spin so fast, so thrusters or magnetic torquers are used now and then to slow it down again.
:::

::: context laplace-s What the letter s is doing
The **Laplace transform** is a mathematical translation, named after the French mathematician Pierre-Simon Laplace. It turns a differential equation — full of dots meaning "rate of change" — into ordinary algebra. Each derivative becomes a multiplication by $s$, so $J\ddot{\theta}$ becomes $Js^2\theta(s)$. That is why control engineers can find how a system moves by solving a quadratic instead of a differential equation. You meet it properly in the control part of this course; for an interview, "each dot becomes an $s$" carries you a long way.
:::

::: context s-plane A map of how a system moves
Plot each pole as a point: real part across, imaginary part up. Left of the vertical axis means motion that dies away; on it means ringing forever; right of it means growing without limit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="220" y1="15" x2="220" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="334" y="116" font-size="11" text-anchor="end" fill="#1f2a44">real</text>
  <text x="228" y="24" font-size="11" fill="#1f2a44">imaginary</text>
  <rect x="20" y="15" width="200" height="170" fill="#8fb8f0" opacity="0.25"/>
  <text x="40" y="34" font-size="11" fill="#1d6fd1">left half: dies away</text>
  <text x="258" y="60" font-size="11" fill="#b4232c">right: grows</text>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="214" y1="44" x2="226" y2="56"/><line x1="226" y1="44" x2="214" y2="56"/>
    <line x1="214" y1="144" x2="226" y2="156"/><line x1="226" y1="144" x2="214" y2="156"/>
  </g>
  <text x="232" y="152" font-size="11" fill="#b4232c">P only: on the axis</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="179" y1="58" x2="191" y2="70"/><line x1="191" y1="58" x2="179" y2="70"/>
    <line x1="179" y1="130" x2="191" y2="142"/><line x1="191" y1="130" x2="179" y2="142"/>
  </g>
  <text x="80" y="140" font-size="11" fill="#1d6fd1">PD: moved left</text>
</svg>
```

The PD poles are drawn at $-0.35 \pm j\,0.357$ and the P-only poles at $\pm j\,0.5$, the numbers from the worked example, to the same scale.
:::

::: context spring-damper Springs, dampers and the two gains
A mass on a spring bounces forever if nothing takes energy out. A **damper** — like the shock absorber on a car wheel — pushes back against speed and soaks up the bounce.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="12" height="110" fill="#6c7a93"/>
  <polyline points="32,50 50,50 60,38 75,62 90,38 105,62 120,38 135,62 145,50 200,50" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="32" y1="100" x2="100" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <rect x="100" y="88" width="50" height="24" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="125" y1="100" x2="200" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="125" y1="92" x2="125" y2="108" stroke="#1f2a44" stroke-width="2"/>
  <rect x="200" y="35" width="70" height="80" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="235" y="80" font-size="13" text-anchor="middle" fill="#1f2a44">J</text>
  <text x="90" y="28" font-size="11" text-anchor="middle" fill="#1d6fd1">spring: k_p</text>
  <text x="125" y="130" font-size="11" text-anchor="middle" fill="#1d6fd1">damper: k_d</text>
  <text x="280" y="50" font-size="11" fill="#1f2a44">P pushes</text>
  <text x="280" y="64" font-size="11" fill="#1f2a44">with position</text>
  <text x="280" y="92" font-size="11" fill="#1f2a44">D pushes</text>
  <text x="280" y="106" font-size="11" fill="#1f2a44">with speed</text>
</svg>
```

A PD controller builds this spring and damper out of software and actuators, because the spacecraft has neither of its own.
:::

::: context damping-ratio Reading the damping ratio
Think of pressing down on a car's corner and letting go. With worn-out shock absorbers ($\zeta$ near $0$) it bounces many times. With good ones it dips, swings back a little, and settles. With $\zeta = 1$, **critical damping**, it comes back as fast as it can without passing its resting point. Above $1$ it creeps back slowly. The overshoot formula turns $\zeta = 0.7$ into about $4.6\%$ overshoot.
:::

::: context four-time-constants Why the 4 in 4/(ζωₙ)
The ringing sits inside an envelope that shrinks like $e^{-\zeta\omega_n t}$. The time it takes to shrink by a factor of $e$ is one **time constant**, $1/(\zeta\omega_n)$. After four of them the envelope is $e^{-4} \approx 0.018$ of where it started — a little under $2\%$. That is where the rule "settling time $\approx 4/(\zeta\omega_n)$" comes from. For a $5\%$ band people use $3$ instead, since $e^{-3} \approx 0.05$.
:::

::: context derivative-kick A spike from a step
A **step** command is a sudden jump — "point 10 degrees left, now". The rate of change of a jump is enormous for an instant. If the derivative term looks at the error, it sees that instant and slams the actuator with a huge, brief push: **derivative kick**. It wears out hardware and can saturate the actuator. Putting the derivative on the measurement only means the controller sees the vehicle's real, smooth motion, never the jump in the command.
:::

::: context windup When the running total runs away
An integrator keeps adding up error. If the actuator is already at full push (saturated), the error cannot shrink fast, so the running total keeps climbing. When the vehicle finally reaches its target, the huge stored total keeps pushing and it overshoots badly — **integrator windup**. An **anti-windup** scheme stops or bleeds off the total while the actuator is saturated. Real flight software always includes one if it has an integrator.
:::

::: context quantization Numbers rounded to steps
A digital sensor cannot report any value; it reports in fixed steps, the way a ruler marked in millimeters cannot show half a millimeter. That rounding is **quantization**. If an angle sensor has a step $q$ and you difference two readings $T$ seconds apart, a single-step rounding flip looks like a rate of $q/T$ even when nothing moved. Make $T$ ten times smaller and that false rate gets ten times bigger.
:::

::: context filtered-derivative Rising, then flat
Plotted against frequency, a pure derivative's gain climbs forever. The filtered version climbs the same way at low frequency, then levels off at $k_d/\tau$ above the corner frequency $1/\tau$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="336" y="158" font-size="11" text-anchor="end" fill="#1f2a44">frequency (log scale)</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">gain (log)</text>
  <line x1="40" y1="130" x2="300" y2="30" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M40,130 L180,76.2 Q200,70 220,69 L330,69" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="200" y1="140" x2="200" y2="62" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="200" y="154" font-size="11" text-anchor="middle" fill="#6c7a93">1/τ</text>
  <text x="258" y="40" font-size="11" fill="#b4232c">pure: k_d s</text>
  <text x="250" y="88" font-size="11" fill="#1d6fd1">filtered: flat at k_d/τ</text>
</svg>
```
:::

::: context rate-gyro Measuring the turning rate directly
A **rate gyro** is a sensor that measures how fast the vehicle is turning, in degrees or radians per second. Old ones used a spinning wheel; modern ones use a vibrating piece of silicon, a ring of optical fiber, or laser light going round a loop. Every launch vehicle and nearly every spacecraft carries them, usually inside the inertial measurement unit. So the "D" in a flight PD loop is usually a gyro reading, not a calculated derivative.
:::

::: context zero-order-hold A staircase, and its delay
A computer updates its command once every sample period $T$ and holds it flat in between: a **zero-order hold**. The staircase it makes lags the smooth signal it is copying by about half a step on average.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="130" x2="20" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="120" x2="320" y2="30" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="20,120 70,120 70,105 120,105 120,90 170,90 170,75 220,75 220,60 270,60 270,45 320,45" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="70" y1="140" x2="120" y2="140" stroke="#1f2a44" stroke-width="1"/>
  <text x="95" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">T</text>
  <text x="200" y="40" font-size="11" fill="#1d6fd1">smooth signal</text>
  <text x="236" y="98" font-size="11" fill="#b4232c">held samples</text>
  <text x="236" y="112" font-size="11" fill="#b4232c">(lag about T/2)</text>
</svg>
```
:::
