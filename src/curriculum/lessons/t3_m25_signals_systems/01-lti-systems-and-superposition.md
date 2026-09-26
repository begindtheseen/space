---
id: l01-lti-systems-and-superposition
title: LTI systems, linearity, time invariance and superposition
minutes: 21
covers:
  - "LTI systems: linearity, time invariance, and why they buy you superposition"
---

Think about a playground swing. Give it a small push and it swings a little. Push twice as hard and it swings about twice as far. Push it at noon or at three o'clock and it does the same swing, only three hours apart. Give it two small pushes and the swing you get is the two swings added together. That well-behaved swing is the whole subject of this lesson — and so is the moment it stops being well behaved, when you push so hard it flies up over the bar.

Nothing that flies is perfectly well behaved. A nozzle actuator hits its stops. Air drag grows with the *square* of speed. A thruster cannot fire for less than a few milliseconds. A first stage burns most of its own mass on the way up, so it is a different vehicle every second. Yet every control law in this tier is designed on a model that behaves like the small-push swing: a **linear, time-invariant** model. That is not laziness. It is the one modelling choice that turns an impossible problem into one with a complete, exact theory — one that tells you, before any simulation runs, what the vehicle will do with *any* input at all.

It is a bargain, and you sign it on every project, so it pays to know exactly what is in it. You give up truth far from home: the model is honest only near one operating point, for small motions, over a stretch of flight short enough that the vehicle does not change underneath you. In return you get **superposition** — the right to add responses together. Superposition is why one experiment (the response to a sharp kick) tells you the response to every input. It is why a signal can be split into sine waves and put back together. It is why a block diagram can be collapsed with algebra. Take superposition away and none of the rest of this module survives.

## Signals and systems

A **signal** is a quantity that changes with time. The angle a nozzle is told to swing to, $\delta(t)$ in radians ("delta of t"). The pitch rate a gyro measures, $q(t)$ in $\mathrm{rad/s}$. The speed of a wind gust in $\mathrm{m/s}$.

A **system** is a rule that turns one signal, the input, into another, the output. Picture a box with a wire going in and a wire coming out. We write it like this:

$$
y(t) = \mathcal{S}\{u(\cdot)\}(t).
$$

Read it as "y of t is script S acting on u". Here $u$ is the input, $y$ is the output, and $\mathcal{S}$ is the rule. The dot in $u(\cdot)$ is a reminder that the output *now* may depend on the whole history of the input, not only on its value at this instant. A swing's position now depends on every push it got in the last minute.

For a launch vehicle's pitch axis, $u$ is the gimbal command and $y$ is the pitch rate the gyro reports. Everything in between — actuator, structure, the vehicle's motion, the sensor — is the system.

Two properties of $\mathcal{S}$ matter. They are separate: a system can have either one without the other.

### Linearity

Think of a grocery checkout with no special deals. Buy one apple and one loaf of bread, and the bill is the apple's price plus the bread's price. Buy three apples, and you pay three times the price of one. A "buy one, get one free" deal breaks both rules — and that is exactly what a nonlinear system does.

In symbols, $\mathcal{S}$ is **linear** — obeys the checkout rules — if, for every pair of inputs and every number $a$:

- **Additivity**: $\mathcal{S}\{u_1 + u_2\} = \mathcal{S}\{u_1\} + \mathcal{S}\{u_2\}$. The response to two inputs together is the sum of the responses to each.
- **Homogeneity**: $\mathcal{S}\{a\,u\} = a\,\mathcal{S}\{u\}$. Scale the input and the output scales by the same amount.

Put the two together and you get **[[superposition|superposition-word]]**: for any inputs and any numbers,

$$
\mathcal{S}\{a_1u_1 + a_2u_2\} = a_1\mathcal{S}\{u_1\} + a_2\mathcal{S}\{u_2\}.
$$

One consequence is worth keeping in front of you. Take $a = 0$ in homogeneity: then $\mathcal{S}\{0\} = 0$. A linear system at rest, given no input, gives no output.

That is why a linear model is always written in **perturbation variables** — each one measured as a departure from a chosen operating point, never as an absolute value. The rule $y = 3u + 2$ is *not* linear, because zero in gives two out. But measure both from the point $(u_0, y_0) = (0, 2)$ and write $\Delta y = 3\Delta u$ ("delta y", the change in $y$), and it is. A rule that is linear only after this shift is called **[[affine|affine-shift]]**, and control engineers make the shift without comment.

Some quick tests you will meet on a vehicle:

| Relation | Linear? | Why |
| --- | --- | --- |
| $y = K u$ | yes | a gain |
| $y = \dot{u}$, $y = \int_0^t u$ | yes | differentiating and integrating are linear |
| $y(t) = u(t - T)$ | yes | delaying a sum delays each term |
| $D = \tfrac{1}{2}\rho V^2 S C_D$ as a map $V \mapsto D$ | no | quadratic: double $V$ and $D$ quadruples |
| $y = \mathrm{sat}(u)$, an actuator against its stops | no | additivity fails past the stop |
| $y(t) = u(t)\cos\omega t$ | yes | multiplying by a known function of time is linear |

The last row is a surprise at first: the rule changes with time, yet it is still linear. So linearity says nothing about whether the clock matters. That is the second property.

### Time invariance

Press a piano key at eight in the evening, then press it again at nine. You get the same note both times, one hour apart. The piano does not care what the clock says.

A system is **time invariant** if delaying the input delays the output by the same amount and changes nothing else. In symbols: if $y(t) = \mathcal{S}\{u(\cdot)\}(t)$, then for every delay $T$,

$$
\mathcal{S}\{u(\cdot - T)\}(t) = y(t - T).
$$

The picture is in the note on [[sliding a response along|time-shift]].

In a governing equation, time invariance means **constant coefficients**. The pitch equation $\ddot{\theta} + 2\zeta\omega_n\dot{\theta} + \omega_n^2\theta = \omega_n^2\delta$ with fixed $\zeta$ ("zeta", the damping) and $\omega_n$ ("omega n", the natural frequency) is time invariant. The same equation with $\omega_n(t)$ drifting as propellant burns is not. Both are perfectly linear.

A system that is both linear and time invariant is called **LTI**. LTI is the whole subject of this module.

::: key
A system is **linear** if superposition holds: $\mathcal{S}\{a_1u_1 + a_2u_2\} = a_1\mathcal{S}\{u_1\} + a_2\mathcal{S}\{u_2\}$. It is **time invariant** if $\mathcal{S}\{u(\cdot - T)\}(t) = y(t - T)$ for every delay $T$ — constant coefficients. LTI means both. Linearity forces $\mathcal{S}\{0\} = 0$, so linear models are always written in perturbations from an operating point.
:::

## What superposition buys

Three consequences. The whole module grows out of them.

**One experiment describes the system.** Any input can be chopped into a row of thin spikes, each scaled to the input's height at that moment. Linearity says the output is the sum of the responses to those spikes. Time invariance says every one of those responses is the *same* shape, slid along in time. So the response to one spike, the impulse response, gives you the response to everything. That is the convolution integral of the next lesson. Without time invariance you would need a different spike response for every instant. Without linearity you could not add them.

**Sine waves stay sine waves.** Feed an LTI system a sine wave at frequency $\omega$. Once the start-up wobble dies away, the output is a sine wave at *the same frequency*. Only its size and its timing (its phase) have changed. No new frequencies appear. Nonlinear systems break this: they create **[[harmonics|harmonics]]**, new frequencies at multiples of the input's. This fact is what makes a Bode plot a complete description rather than a summary, and it is the foundation of lessons 9 and 12.

**Starting state and input add.** The response from a nonzero starting state with no input (the **zero-input response**), plus the response to the input starting from rest (the **zero-state response**), equals the response to both. Transfer functions describe only the second part. The first part is built from the same natural motions of the system (lesson 3 calls them poles) and can be added afterwards.

### Exponentials pass through unchanged

Here is the fact that makes the Laplace and frequency domains work.

Feed an LTI system the signal $e^{st}$ — "e to the s t" — where $s$ is any complex number, and let it run long enough that start-up effects are gone. What comes out is the very same $e^{st}$, multiplied by one complex number that does not depend on time. Call that number $G(s)$:

$$
u(t) = e^{st} \quad\Longrightarrow\quad y(t) = G(s)\,e^{st}.
$$

The *shape* goes through untouched; only its size and phase change. A signal with this property is called an **[[eigenfunction|eigen-word]]** of the system, and $G(s)$ is its **eigenvalue**. Every LTI system, whatever it is made of, has the same eigenfunctions. That is the precise meaning of "LTI is special".

Put $s = j\omega$ (engineers write $j$ for $\sqrt{-1}$) and $e^{j\omega t}$ is a spinning arrow whose shadow is a sine wave. Then $G(j\omega)$ is the **frequency response**: its size $|G(j\omega)|$ is the gain at that frequency and its angle $\angle G(j\omega)$ is the phase shift. Lesson 3 names $G(s)$ the transfer function.

::: note Why it has to be true
The next lesson shows that an LTI system's output is $y(t) = \int_0^\infty h(\tau)\,u(t - \tau)\,d\tau$, where $h$ is its impulse response — how much weight it still gives to input from $\tau$ ("tau") seconds ago. Put $u(t) = e^{st}$ in, applied since the distant past, and use $e^{s(t - \tau)} = e^{st}e^{-s\tau}$:

$$
y(t) = \int_0^\infty h(\tau)\,e^{s(t - \tau)}\,d\tau = e^{st}\int_0^\infty h(\tau)e^{-s\tau}\,d\tau = G(s)\,e^{st}.
$$

The factor $e^{st}$ does not depend on $\tau$, so it comes out of the integral. What is left, $G(s) = \int_0^\infty h(\tau)e^{-s\tau}\,d\tau$, depends on $s$ but not on $t$. That integral is the Laplace transform of $h$.
:::

::: example Superposition tested on a nonlinear spacecraft
A small satellite with pitch inertia $J = 4000\,\mathrm{kg\,m^2}$ sits in a **[[gravity-gradient|gravity-gradient]]** field. It pulls the satellite back toward its resting attitude with a torque $-J\omega_0^2\sin\theta$, where $\omega_0 = 0.02\,\mathrm{rad/s}$ (a swing period of $2\pi/0.02 = 314\,\mathrm{s}$). The exact equation is $\ddot{\theta} + \omega_0^2\sin\theta = u/J$. The linear model [[swaps the sine for the angle|sin-vs-theta]]: it replaces $\sin\theta$ by $\theta$.

Fire two thruster pulses. Pulse A is $0.25\,\mathrm{N\,m}$ for $5\,\mathrm{s}$, starting at $t = 0$. Pulse B is $0.40\,\mathrm{N\,m}$ for $5\,\mathrm{s}$, starting at $t = 20\,\mathrm{s}$. Integrate the exact equation for $400\,\mathrm{s}$ (fourth-order Runge–Kutta, step $5\,\mathrm{ms}$), three times: A alone, B alone, both together.

- A alone peaks at $0.895^\circ$. (Sanity check: the pulse leaves a rate of $0.25 \times 5/4000 = 3.13 \times 10^{-4}\,\mathrm{rad/s}$, and a swing with that top speed at $\omega_0 = 0.02$ reaches $3.13\times10^{-4}/0.02 = 0.0156\,\mathrm{rad} = 0.895^\circ$.)
- B alone peaks at $1.432^\circ$.
- Both together peak at $2.284^\circ$.

Now test superposition: take the largest gap, over the whole run, between "both together" and "A alone plus B alone". It is $0.0010^\circ$ — about 0.04% of the peak. For the linear model the same gap is $5 \times 10^{-14}\,^\circ$, pure rounding noise, as it must be.

Now scale both pulses up twenty times: $5\,\mathrm{N\,m}$ and $8\,\mathrm{N\,m}$. A alone peaks at $17.97^\circ$, B alone at $28.95^\circ$, both together at $46.97^\circ$. But the superposition gap is now $8.94^\circ$ — **19% of the peak**. Adding the separate responses no longer predicts the joint one. The linear model still superposes perfectly and predicts a peak of $45.67^\circ$, 2.8% low, because at $47^\circ$ the real restoring torque, $\sin\theta$, is 11% weaker than the model's $\theta$.

Read the two cases together. At large amplitude superposition is not "roughly true" — it is wrong. And the size at which it breaks is a property of the plant, not of the mathematics.
:::

## How a vehicle is made LTI

Stand in a field and the Earth looks flat. It is round, but up close a curve looks like a straight line. Linearizing is the same trick done on purpose. Three steps, in this order, turn a flight-dynamics model into something this module can handle.

**1. Trim, then perturb.** Pick an operating point — a Mach number (speed compared with the speed of sound), a dynamic pressure ($\tfrac{1}{2}\rho V^2$, how hard the oncoming air presses), a mass, and an angle of attack (the angle between the vehicle's nose and the oncoming air) and gimbal angle that balance each other. That balance is called **trim**. Measure every variable as a departure from it. The nonlinear rule $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ (state $\mathbf{x}$, input $\mathbf{u}$) becomes, to first order,

$$
\Delta\dot{\mathbf{x}} = \frac{\partial\mathbf{f}}{\partial\mathbf{x}}\bigg|_0\Delta\mathbf{x} + \frac{\partial\mathbf{f}}{\partial\mathbf{u}}\bigg|_0\Delta\mathbf{u} = \mathbf{A}\,\Delta\mathbf{x} + \mathbf{B}\,\Delta\mathbf{u}.
$$

The matrices $\mathbf{A}$ and $\mathbf{B}$ are **[[Jacobians|jacobian]]** — tables of slopes — worked out at the trim point (the "$|_0$"). The terms thrown away are second order in the perturbation: squares and products of small numbers. That is the exact meaning of "valid for small motions".

**2. Freeze time.** Mass, inertia, dynamic pressure and thrust all change during flight, so $\mathbf{A}$ and $\mathbf{B}$ really depend on $t$. Work them out at one instant and hold them fixed. The frozen model is time invariant. Then repeat the design at a grid of instants and blend the gains between them. That is **[[gain scheduling|gain-scheduling]]**. Freezing is fair when the vehicle changes slowly compared with how fast the closed loop responds — the usual rule is a factor of five or more.

**3. Keep the actuator off its limits.** Saturation, rate limits and thruster dead zones are sharp nonlinearities that no linearization can reach. The linear design is made to ask for less than the actuator can give, and the nonlinear simulation exists to confirm that it does.

::: example Linearizing a launch vehicle's pitch axis at max q
Take a two-stage vehicle at maximum dynamic pressure ("max q"): thrust $T = 7.6\,\mathrm{MN}$, mass $m = 3.2 \times 10^5\,\mathrm{kg}$, length $L = 70\,\mathrm{m}$. Treat it as a uniform rod, so its pitch inertia is

$$
I = \frac{mL^2}{12} = \frac{3.2\times10^5 \times 70^2}{12} = 1.31 \times 10^8\,\mathrm{kg\,m^2}.
$$

The gimbal is $l_g = 30\,\mathrm{m}$ behind the center of mass. The **[[center of pressure is ahead|cp-ahead]]** of the center of mass by $l_{cp} = 5\,\mathrm{m}$. Dynamic pressure is $\bar{q} = 33\,\mathrm{kPa}$ ("q bar"). The reference area is $S = \pi(3.66/2)^2 = 10.52\,\mathrm{m^2}$. The normal-force slope is $C_{N\alpha} = 2.0$ per radian ("C N alpha": how fast side force grows with angle of attack).

**Control moment.** Tilting the nozzle by $\delta$ gives a turning moment $T\,l_g\sin\delta$. Linearize: $\sin\delta \to \delta$. That costs 0.005% at $1^\circ$, 0.127% at $5^\circ$ and 1.15% at $15^\circ$ — nothing, over any angle the loop will ask for. Divide by $I$ to get the **control effectiveness**, the angular acceleration per radian of nozzle:

$$
\mu_\delta = \frac{T\,l_g}{I} = \frac{7.6\times10^6 \times 30}{1.31\times10^8} = 1.74\,\mathrm{s^{-2}}\ \text{per radian}.
$$

**Aerodynamic moment.** With the center of pressure *ahead* of the center of mass, the air pushes the nose further the way it is already pointing: $+\bar{q}SC_{N\alpha}l_{cp}\,\alpha$. Divide by $I$:

$$
\mu_\alpha = \frac{\bar{q}SC_{N\alpha}l_{cp}}{I} = \frac{33000 \times 10.52 \times 2.0 \times 5}{1.31\times10^8} = 0.0266\,\mathrm{s^{-2}}\ \text{per radian}.
$$

**The frozen model.** Put the two together: $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$. With no control, the solutions grow or shrink like $e^{\pm\sqrt{\mu_\alpha}\,t}$, with $\sqrt{\mu_\alpha} = 0.163\,\mathrm{rad/s}$. The plus sign is a growing solution — in lesson 3's language, an open-loop pole in the right half plane. It means an attitude error that doubles every $\ln 2/0.163 = 4.25\,\mathrm{s}$.

**Trim.** Holding a steady $3^\circ$ angle of attack needs only $\delta = (\mu_\alpha/\mu_\delta) \times 3^\circ = (0.0266/1.74) \times 3^\circ = 0.046^\circ$ of nozzle. So almost all of the actuator's range is there for transients and thrust misalignment, not for aerodynamic trim.

**How long does the frozen model last?** The engines burn $\dot{m} = T/(I_{sp}g_0) = 7.6\times10^6/(282 \times 9.80665) = 2748\,\mathrm{kg/s}$, where $I_{sp}$ is the **[[specific impulse|specific-impulse]]**. So the mass falls by 0.86% of its max-q value per second — 8.6% in ten seconds. A closed loop that settles in a second or two sees a vehicle that is, in effect, frozen. But the gain schedule must be updated every few seconds.
:::

::: warning Linear and time invariant are two different promises
Breaking either one costs you something different. A linear but time-varying system still superposes, so you may add responses. But it has no transfer function and no Bode plot, because its response to a sine wave does not stay a sine wave of fixed size and phase. A nonlinear but time-invariant system has neither superposition nor a transfer function (describing-function methods recover a frequency picture in special cases). Do not use "linear" loosely to mean "well behaved".
:::

::: note Continuous time for now
In this module a signal is a single number that varies smoothly in time. A flight computer really sees samples, taken at fixed intervals. Sampled signals come in the digital-control module of this tier. Until then, treat a sampled loop as continuous with an extra delay of about half a sample period, which lesson 8 works out.
:::

## Check yourself

::: check
Decide whether each is linear, time invariant, both or neither, and say why: (a) $y(t) = 5\dot{u}(t) + 3u(t - 0.1)$; (b) $y(t) = u(t)^2$; (c) $\ddot{\theta} + \frac{c(t)}{J}\dot{\theta} = \frac{1}{J}u$ with $c(t) = c_0e^{-t/\tau}$; (d) $y(t) = 2u(t) + 1$.
:::

::: answer
(a) Both. Differentiating, scaling and a fixed delay are each linear. The coefficients are constants, so a delayed input gives a delayed output.

(b) Time invariant but not linear. $(u_1 + u_2)^2 \ne u_1^2 + u_2^2$, and doubling the input quadruples the output.

(c) Linear but not time invariant. Every term is first power in $\theta$ or $u$, so superposition holds. But the coefficient $c(t)$ changes with time, so a pulse at $t = 0$ gets a different response from the same pulse at $t = 10\,\mathrm{s}$.

(d) Not linear — zero input gives $y = 1$ — and not really a dynamic system at all. It is affine. It becomes linear in perturbation variables, $\Delta y = 2\Delta u$, about any operating point.
:::

::: check
A spacecraft thruster makes $0.5\,\mathrm{N}$ but cannot fire for less than $20\,\mathrm{ms}$, so its smallest impulse is $0.01\,\mathrm{N\,s}$. Commands of $0.004\,\mathrm{N\,s}$ and $0.007\,\mathrm{N\,s}$ each produce nothing, but their sum produces one $0.01\,\mathrm{N\,s}$ pulse. Which property fails, and what does that cost you?
:::

::: answer
Additivity fails. $\mathcal{S}\{u_1\} + \mathcal{S}\{u_2\} = 0 + 0 = 0$, but $\mathcal{S}\{u_1 + u_2\} \ne 0$. The system is not linear. So it has no impulse response that describes it, no transfer function and no Bode plot — its "gain" depends on how big the command is. In practice the loop is designed on a linear model that ignores this minimum impulse bit. The nonlinearity then shows up as a **limit cycle**: a steady back-and-forth wobble in attitude whose size is set by the impulse bit divided by the inertia. Predicting that wobble needs nonlinear analysis, not this module.
:::

::: check
Use the eigenfunction property to show that an LTI system driven by $u(t) = A\cos\omega t$ settles to $y(t) = A|G(j\omega)|\cos(\omega t + \angle G(j\omega))$.
:::

::: answer
Write the cosine as two spinning arrows: $A\cos\omega t = \tfrac{A}{2}e^{j\omega t} + \tfrac{A}{2}e^{-j\omega t}$.

Each exponential is an eigenfunction, so each comes out multiplied by its own gain: $\tfrac{A}{2}G(j\omega)e^{j\omega t}$ and $\tfrac{A}{2}G(-j\omega)e^{-j\omega t}$. By linearity the output is their sum.

For a system with real coefficients, $h(t)$ is real, so $G(-j\omega) = \overline{G(j\omega)}$ (the bar means complex conjugate, the mirror image). The two terms are mirror images of each other. Write $G(j\omega) = |G|e^{j\phi}$. Then the sum is

$$
\tfrac{A}{2}|G|\left(e^{j(\omega t + \phi)} + e^{-j(\omega t + \phi)}\right) = A|G|\cos(\omega t + \phi).
$$

Same frequency. Size multiplied by $|G(j\omega)|$. Phase shifted by $\angle G(j\omega)$.
:::

::: check
The launch vehicle of the second worked example is re-analyzed $30\,\mathrm{s}$ later. Now $\bar{q} = 12\,\mathrm{kPa}$ and the mass is $2.38\times10^5\,\mathrm{kg}$. Take the length and both moment arms as unchanged. What are $\mu_\alpha$ and $\mu_\delta$ now, and what has happened to the open-loop instability?
:::

::: answer
For a fixed shape, inertia scales with mass: $I = 2.38\times10^5 \times 70^2/12 = 9.72\times10^7\,\mathrm{kg\,m^2}$.

Control effectiveness: $\mu_\delta = 7.6\times10^6 \times 30/(9.72\times10^7) = 2.35\,\mathrm{s^{-2}}$. That is up 34%, because the same thrust now turns a lighter vehicle.

Aerodynamic term: $\mu_\alpha = 12000 \times 10.52 \times 2.0 \times 5/(9.72\times10^7) = 0.0130\,\mathrm{s^{-2}}$, about half its earlier value.

The unstable root moves from $0.163$ to $\sqrt{0.0130} = 0.114\,\mathrm{rad/s}$, and the doubling time stretches from $4.25\,\mathrm{s}$ to $\ln 2/0.114 = 6.1\,\mathrm{s}$. Both numbers changed by tens of percent in half a minute. That is why the controller is scheduled on flight time or measured dynamic pressure rather than fixed. (Sanity check on the mass: $3.2\times10^5 - 30 \times 2748 = 2.38\times10^5\,\mathrm{kg}$.)
:::

::: check
Why can a linear time-*varying* system not have a transfer function, even though superposition still holds for it?
:::

::: answer
A transfer function means $Y(s) = G(s)U(s)$, with $G$ the same for every input and every moment. Equivalently, one impulse response $h(\tau)$ describes the system. For a time-varying system, the response to an impulse at time $t_0$ is a function $h(t, t_0)$ of two separate times, not of the gap $t - t_0$ alone. So the convolution integral does not turn into a product of transforms. Superposition still lets you add responses, which is why time-varying linear analysis exists. But $e^{st}$ is no longer an eigenfunction: $\int h(t, t_0)e^{-s(t - t_0)}\,dt_0$ depends on $t$, so there is no single complex gain at a given $s$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Linearity | $\mathcal{S}\{a_1u_1 + a_2u_2\} = a_1\mathcal{S}\{u_1\} + a_2\mathcal{S}\{u_2\}$; forces $\mathcal{S}\{0\} = 0$ |
| Time invariance | $\mathcal{S}\{u(\cdot - T)\}(t) = y(t - T)$; constant coefficients |
| LTI | both; the class that has a transfer function and a Bode plot |
| Superposition buys | one impulse response describes everything; sine in, same-frequency sine out; starting-state response plus input response |
| Eigenfunction property | $u = e^{st} \Rightarrow y = G(s)e^{st}$ with $G(s) = \int_0^\infty h(\tau)e^{-s\tau}d\tau$ |
| Linearization | $\Delta\dot{\mathbf{x}} = \mathbf{A}\Delta\mathbf{x} + \mathbf{B}\Delta\mathbf{u}$, Jacobians at trim; perturbation variables |
| Frozen-time model | work out $\mathbf{A}$, $\mathbf{B}$ at one instant; redesign on a grid and schedule the gains |
| Launch vehicle pitch | $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$, $\mu_\delta = Tl_g/I$, $\mu_\alpha = \bar{q}SC_{N\alpha}l_{cp}/I$ |

The next lesson cashes in the first gift of superposition. Because one impulse response fixes the response to any input, the convolution integral — together with the step response a test engineer can actually measure — is a complete time-domain description of an LTI system.

::: context superposition-word Placing things on top of each other
"Superposition" is from Latin: *super*, on top, and *ponere*, to place. You lay one response on top of another and add them, point by point. Physicists use the same word for waves on a pond: two ripples pass through each other, and where they overlap the water height is the sum of the two. Water waves of small height are close to linear, which is why they can cross without wrecking each other. Big breaking waves are not.
:::

::: context affine-shift A line that misses the origin
A straight line through the origin, like $y = 3u$, is linear. A straight line that misses it, like $y = 3u + 2$, is called affine. It is still a straight line, but zero in does not give zero out. Move your origin to any point on the line — measure from $(0, 2)$ instead of $(0, 0)$ — and in the new measurements the line passes through the origin again. That move is all that "perturbation variables" means. Every linear vehicle model in this course has been shifted this way, even when nobody says so.
:::

::: context time-shift Same push, same swing, later
A time-invariant system answers a push the same way whenever the push comes. Shift the input later, and the whole output slides later by exactly the same amount, with no change of shape.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="345" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="165" x2="345" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="35" width="8" height="25" fill="#1d6fd1"/>
  <path d="M50.0,165.0 L57.7,143.4 L65.4,129.4 L73.1,121.0 L80.8,116.6 L88.5,115.0 L96.2,115.5 L103.8,117.4 L111.5,120.1 L119.2,123.3 L126.9,126.8 L134.6,130.3 L142.3,133.8 L150.0,137.1 L157.7,140.2 L165.4,143.1 L173.1,145.7 L180.8,148.1 L188.5,150.2 L196.2,152.1 L203.8,153.8 L211.5,155.3 L219.2,156.6 L226.9,157.8 L234.6,158.8 L242.3,159.7 L250.0,160.4 L257.7,161.1 L265.4,161.6 L273.1,162.1 L280.8,162.6 L288.5,162.9 L296.2,163.2 L303.8,163.5 L311.5,163.7 L319.2,163.9 L326.9,164.1 L334.6,164.2 L342.3,164.3 L350.0,164.4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="190" y="35" width="8" height="25" fill="#b4232c"/>
  <path d="M190.0,165.0 L194.1,152.4 L198.2,142.3 L202.3,134.3 L206.4,128.0 L210.5,123.3 L214.6,119.8 L218.7,117.4 L222.8,115.9 L226.9,115.2 L231.0,115.0 L235.1,115.4 L239.2,116.1 L243.3,117.2 L247.4,118.6 L251.5,120.1 L255.6,121.8 L259.7,123.6 L263.8,125.4 L267.9,127.3 L272.1,129.2 L276.2,131.0 L280.3,132.9 L284.4,134.7 L288.5,136.5 L292.6,138.2 L296.7,139.8 L300.8,141.4 L304.9,142.9 L309.0,144.4 L313.1,145.7 L317.2,147.0 L321.3,148.2 L325.4,149.4 L329.5,150.5 L333.6,151.5 L337.7,152.5 L341.8,153.4 L345.9,154.2 L350.0,155.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="34" y="22" font-size="12" fill="#1f2a44" text-anchor="start">input: the same pulse, pushed at two times</text>
  <text x="34" y="92" font-size="12" fill="#1f2a44" text-anchor="start">output: the same response, slid along</text>
  <text x="338" y="182" font-size="11" fill="#6c7a93" text-anchor="end">time</text>
</svg>
```

A vehicle burning propellant fails this test slowly: the same nozzle kick gives a slightly bigger swing a minute later, because the vehicle is lighter.
:::

::: context harmonics New notes that were not in the input
A **harmonic** is a frequency that is a whole-number multiple of another: $2\omega$, $3\omega$, and so on. Feed a pure sine wave into an actuator that hits its stops, and the tops get flattened off. The flattened wave is still repeating at $\omega$, but it is no longer a pure sine — it now contains $3\omega$, $5\omega$ and higher pieces too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 135" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="65" x2="345" y2="65" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="41" x2="345" y2="41" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="30" y1="89" x2="345" y2="89" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M30.0,65.0 L35.2,56.7 L40.3,48.7 L45.5,41.5 L50.7,35.3 L55.8,30.4 L61.0,27.0 L66.2,25.2 L71.3,25.2 L76.5,27.0 L81.7,30.4 L86.8,35.3 L92.0,41.5 L97.2,48.7 L102.3,56.7 L107.5,65.0 L112.7,73.3 L117.8,81.3 L123.0,88.5 L128.2,94.7 L133.3,99.6 L138.5,103.0 L143.7,104.8 L148.8,104.8 L154.0,103.0 L159.2,99.6 L164.3,94.7 L169.5,88.5 L174.7,81.3 L179.8,73.3 L185.0,65.0 L190.2,56.7 L195.3,48.7 L200.5,41.5 L205.7,35.3 L210.8,30.4 L216.0,27.0 L221.2,25.2 L226.3,25.2 L231.5,27.0 L236.7,30.4 L241.8,35.3 L247.0,41.5 L252.2,48.7 L257.3,56.7 L262.5,65.0 L267.7,73.3 L272.8,81.3 L278.0,88.5 L283.2,94.7 L288.3,99.6 L293.5,103.0 L298.7,104.8 L303.8,104.8 L309.0,103.0 L314.2,99.6 L319.3,94.7 L324.5,88.5 L329.7,81.3 L334.8,73.3 L340.0,65.0" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <path d="M30.0,65.0 L35.2,56.7 L40.3,48.7 L45.5,41.5 L50.7,41.0 L55.8,41.0 L61.0,41.0 L66.2,41.0 L71.3,41.0 L76.5,41.0 L81.7,41.0 L86.8,41.0 L92.0,41.5 L97.2,48.7 L102.3,56.7 L107.5,65.0 L112.7,73.3 L117.8,81.3 L123.0,88.5 L128.2,89.0 L133.3,89.0 L138.5,89.0 L143.7,89.0 L148.8,89.0 L154.0,89.0 L159.2,89.0 L164.3,89.0 L169.5,88.5 L174.7,81.3 L179.8,73.3 L185.0,65.0 L190.2,56.7 L195.3,48.7 L200.5,41.5 L205.7,41.0 L210.8,41.0 L216.0,41.0 L221.2,41.0 L226.3,41.0 L231.5,41.0 L236.7,41.0 L241.8,41.0 L247.0,41.5 L252.2,48.7 L257.3,56.7 L262.5,65.0 L267.7,73.3 L272.8,81.3 L278.0,88.5 L283.2,89.0 L288.3,89.0 L293.5,89.0 L298.7,89.0 L303.8,89.0 L309.0,89.0 L314.2,89.0 L319.3,89.0 L324.5,88.5 L329.7,81.3 L334.8,73.3 L340.0,65.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="30" y="125" font-size="12" fill="#1d6fd1" text-anchor="start">blue: sine going in</text>
  <text x="345" y="125" font-size="12" fill="#b4232c" text-anchor="end">red: after hitting the stops</text>
  <text x="348" y="38" font-size="11" fill="#6c7a93" text-anchor="end">stop</text>
</svg>
```

An LTI system can never do this. That is why a clipping actuator can shake a structural mode at three times the frequency you were commanding.
:::

::: context eigen-word What "eigen" means
*Eigen* is German for "own", as in "its own". An eigenvector of a matrix $\mathbf{A}$ is a direction the matrix only stretches, never turns: $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$. An eigenfunction of a system is the same idea for signals. The system hands it back with the same shape, only multiplied by a number. For every LTI system, the exponentials $e^{st}$ are such signals, and the multiplier $G(s)$ plays the role of $\lambda$. That is why one function $G(s)$ can describe the system completely.
:::

::: context gravity-gradient Why a long satellite hangs downward
Gravity gets weaker with height. So the end of a long satellite that is nearer Earth is pulled slightly harder than the far end. The difference is tiny, but it makes a torque that swings the long axis to point at Earth, like a pendulum. The Moon is held by the same kind of effect, which is why it keeps one face toward us. Engineers use it on purpose: a long boom with a weight on the end can keep a cheap satellite pointed down without any fuel.
:::

::: context sin-vs-theta Where the straight line leaves the curve
For small angles in radians, $\sin\theta$ and $\theta$ are almost the same number. Plotted together, they lie on top of each other at first, then separate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="320" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40.0,180.0 L49.0,174.8 L58.0,169.5 L67.0,164.3 L76.0,159.1 L85.0,153.8 L94.0,148.6 L103.0,143.3 L112.0,138.1 L121.0,132.9 L130.0,127.6 L139.0,122.4 L148.0,117.2 L157.0,111.9 L166.0,106.7 L175.0,101.5 L184.0,96.2 L193.0,91.0 L202.0,85.8 L211.0,80.5 L220.0,75.3 L229.0,70.0 L238.0,64.8 L247.0,59.6 L256.0,54.3 L265.0,49.1 L274.0,43.9 L283.0,38.6 L292.0,33.4 L301.0,28.2 L310.0,22.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M40.0,180.0 L49.0,174.8 L58.0,169.5 L67.0,164.4 L76.0,159.2 L85.0,154.1 L94.0,149.1 L103.0,144.2 L112.0,139.3 L121.0,134.6 L130.0,130.0 L139.0,125.5 L148.0,121.2 L157.0,117.1 L166.0,113.1 L175.0,109.3 L184.0,105.7 L193.0,102.3 L202.0,99.1 L211.0,96.1 L220.0,93.4 L229.0,90.9 L238.0,88.6 L247.0,86.6 L256.0,84.9 L265.0,83.4 L274.0,82.2 L283.0,81.2 L292.0,80.5 L301.0,80.1 L310.0,80.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="181" y1="98.0" x2="181" y2="106.9" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 2"/>
  <line x1="181" y1="176" x2="181" y2="184" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">0°</text>
  <line x1="130" y1="180" x2="130" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">30°</text>
  <line x1="220" y1="180" x2="220" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">60°</text>
  <line x1="310" y1="180" x2="310" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">90°</text>
  <text x="187" y="123.86462983808295" font-size="11" fill="#1f2a44" text-anchor="start">gap 11%</text>
  <text x="282" y="24" font-size="13" fill="#1d6fd1" text-anchor="end">θ</text>
  <text x="318" y="102" font-size="13" fill="#b4232c" text-anchor="end">sin θ</text>
  <text x="181" y="214" font-size="11" fill="#1f2a44" text-anchor="middle">47°</text>
  <text x="110" y="165" font-size="11" fill="#1f2a44" text-anchor="start">nearly equal below about 15°</text>
</svg>
```

At $10^\circ$ the gap is 0.5%. At $47^\circ$, the peak of the big-pulse run, $\sin\theta$ is about 11% smaller than $\theta$. So the real restoring torque is weaker than the linear model thinks, and the real satellite swings further than the model predicts.
:::

::: context jacobian A table of slopes
A Jacobian is the grown-up version of "the slope of a curve". When $\mathbf{f}$ has many outputs and many inputs, you need a slope for each pair: how much does output $i$ change when input $j$ is nudged? Arrange those slopes in a grid and you have the Jacobian matrix. The name honors Carl Gustav Jacob Jacobi, a nineteenth-century German mathematician. In practice, flight-dynamics engineers often compute it numerically: nudge each variable a little in a simulation and record how everything else moves.
:::

::: context gain-scheduling One design per moment of flight
A rocket at liftoff, at max q and near burnout behaves like three different vehicles. So engineers design a controller for each of a list of flight moments and store the gains in a table. In flight, the computer looks up where it is — by time since liftoff, or by measured dynamic pressure or Mach number — and blends the gains between the nearest table entries. This lesson's rule, that the vehicle must change slowly compared with the loop, is what makes that blending safe.
:::

::: context cp-ahead An arrow flying backwards
An arrow flies straight because its feathers put the **center of pressure** — the point where the air's side force acts — *behind* the **center of mass**. If the arrow turns a little, the air pushes the tail back into line. Throw an arrow feathers-first and it flips around. A rocket at max q is often like the backwards arrow: its center of pressure is ahead of its center of mass, so any tilt makes the air tilt it further. Only the swiveling engine keeps it pointed.
:::

::: context specific-impulse How good an engine is
**Specific impulse**, $I_{sp}$, measures how much push an engine gets out of its propellant. It is quoted in seconds. Multiply it by $g_0 = 9.80665\,\mathrm{m/s^2}$ and you get the effective exhaust speed: $282 \times 9.80665 = 2765\,\mathrm{m/s}$ here. Thrust is exhaust speed times mass flow, so the mass flow is thrust divided by exhaust speed. A value near $282\,\mathrm{s}$ is typical of a kerosene–oxygen engine at sea level.
:::
