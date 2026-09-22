---
id: l01-lti-systems-and-superposition
title: LTI systems, linearity, time invariance and superposition
minutes: 18
covers:
  - "LTI systems: linearity, time invariance, and why they buy you superposition"
---

Nothing that flies is linear. A nozzle actuator saturates at its stops, aerodynamic force grows faster than angle of attack once the flow separates, a thruster cannot fire for less than its minimum impulse bit, and a first stage throws away four fifths of its mass on the way up. Yet every control law in this tier is designed on a linear, time-invariant model. This is not laziness. It is the single modelling decision that turns an intractable problem into one with a complete, exact theory — one in which you can state, before any simulation runs, what the vehicle will do to any input at all.

The bargain is worth understanding precisely, because you sign it on every project. You give up global validity: the model is honest only near one operating point, for small excursions, over a stretch of flight short enough that the vehicle does not change underneath you. In exchange you get **superposition**, and superposition is what makes the rest of this module possible. It is the reason one experiment — the response to an impulse — determines the response to every input. It is the reason a signal can be decomposed into sinusoids and put back together afterwards. It is the reason a block diagram can be collapsed by algebra. Take superposition away and none of those survive.

This lesson defines linearity and time invariance sharply, shows what each one buys, proves the property that the whole frequency-domain picture rests on — that exponentials pass through an LTI system unchanged in shape — and then works through how a real vehicle is beaten into LTI form and how far that form can be trusted.

## Signals and systems

A **signal** is a function of time carrying a physical quantity: a commanded nozzle angle $\delta(t)$ in radians, a measured pitch rate $q(t)$ in $\mathrm{rad/s}$, a wind gust velocity in $\mathrm{m/s}$. A **system** is a rule that maps an input signal to an output signal. Write it as an operator,

$$
y(t) = \mathcal{S}\{u(\cdot)\}(t),
$$

where $u$ is the input, $y$ the output, and the notation $u(\cdot)$ is a reminder that the output at time $t$ may depend on the whole input history, not only on $u(t)$. For a launch vehicle's pitch axis, $u$ is the gimbal command and $y$ the pitch rate reported by the rate gyro; everything between them — actuator, structure, rigid-body dynamics, sensor — is the system.

Two structural properties of $\mathcal{S}$ matter, and they are independent of each other.

### Linearity

$\mathcal{S}$ is **linear** if it satisfies two conditions for all inputs and all scalars $a$:

- **Additivity**: $\mathcal{S}\{u_1 + u_2\} = \mathcal{S}\{u_1\} + \mathcal{S}\{u_2\}$.
- **Homogeneity**: $\mathcal{S}\{a\,u\} = a\,\mathcal{S}\{u\}$.

Together they give **superposition**: for any inputs and any scalars,

$$
\mathcal{S}\{a_1u_1 + a_2u_2\} = a_1\mathcal{S}\{u_1\} + a_2\mathcal{S}\{u_2\}.
$$

A consequence worth keeping in front of you: homogeneity with $a = 0$ forces $\mathcal{S}\{0\} = 0$. A linear system at rest, given no input, produces no output. This is why a linear model is always written in **perturbation variables** measured from an operating point, never in absolute ones. The relation $y = 3u + 2$ is not linear, because zero in gives two out; the relation $\Delta y = 3\Delta u$ between departures from the point $(u_0, y_0) = (0, 2)$ is. A model that is linear only after this shift is called *affine*, and control engineers work with the shifted version without comment.

Some quick tests, all of which you will meet on a vehicle:

| Relation | Linear? | Why |
| --- | --- | --- |
| $y = K u$ | yes | a gain |
| $y = \dot{u}$, $y = \int_0^t u$ | yes | differentiation and integration are linear operators |
| $y(t) = u(t - T)$ | yes | delaying a sum delays each term |
| $D = \tfrac{1}{2}\rho V^2 S C_D$ as a map $V \mapsto D$ | no | quadratic: double $V$ and $D$ quadruples |
| $y = \mathrm{sat}(u)$, an actuator against its stops | no | additivity fails past the stop |
| $y(t) = u(t)\cos\omega t$ | yes | multiplying by a known function of time is linear |

The last row shows that linearity says nothing about time invariance. That is the second property.

### Time invariance

$\mathcal{S}$ is **time invariant** if delaying the input delays the output by the same amount and changes nothing else: if $y(t) = \mathcal{S}\{u(\cdot)\}(t)$, then for every $T$,

$$
\mathcal{S}\{u(\cdot - T)\}(t) = y(t - T).
$$

The system does not care what the clock says. In terms of the governing equation, a time-invariant system has **constant coefficients**: $\ddot{\theta} + 2\zeta\omega_n\dot{\theta} + \omega_n^2\theta = \omega_n^2\delta$ with fixed $\zeta$ and $\omega_n$ is time invariant; the same equation with $\omega_n(t)$ falling as propellant burns is not. Both can be perfectly linear.

A system that is both is **LTI**, and LTI is the entire subject of this module.

::: key
A system is **linear** if superposition holds: $\mathcal{S}\{a_1u_1 + a_2u_2\} = a_1\mathcal{S}\{u_1\} + a_2\mathcal{S}\{u_2\}$. It is **time invariant** if $\mathcal{S}\{u(\cdot - T)\}(t) = y(t - T)$ for every delay $T$ — constant coefficients. LTI means both. Linearity forces $\mathcal{S}\{0\} = 0$, so linear models are always written in perturbations from an operating point.
:::

## What superposition buys

Three consequences, and the whole module comes out of them.

**One experiment characterises the system.** Any input can be written as a superposition of shifted, scaled impulses. Linearity says the output is the corresponding superposition of responses to those impulses; time invariance says all of those responses are the *same* function, slid along in time. So the response to one impulse determines the response to everything — that is the convolution integral of the next lesson. Without time invariance you would need a different impulse response for every instant of application; without linearity you could not add them.

**Sinusoids stay sinusoids.** Feed an LTI system a sine at frequency $\omega$ and, after the transient dies, the output is a sine at *the same frequency*, changed only in amplitude and phase. No new frequencies appear. That is a very strong statement and it is false for nonlinear systems, which generate harmonics. It is what makes a Bode plot a complete description rather than a summary, and it is the foundation of lessons 9 and 12.

**Zero-input and zero-state responses add.** The response from a nonzero initial state with no input, plus the response to the input from rest, is the response to both. Transfer functions describe only the second part; the first part has the same poles and can be added afterwards.

### Exponentials are the eigenfunctions

Here is the fact that makes the Laplace and frequency domains work. Let the system be LTI with impulse response $h(t)$, so that $y(t) = \int_0^\infty h(\tau)u(t - \tau)\,d\tau$. Drive it with the complex exponential $u(t) = e^{st}$, where $s$ is any complex number, applied since the distant past so that all transients have died:

$$
y(t) = \int_0^\infty h(\tau)\,e^{s(t - \tau)}\,d\tau = e^{st}\int_0^\infty h(\tau)e^{-s\tau}\,d\tau = G(s)\,e^{st}.
$$

The input comes out multiplied by a complex number $G(s)$ that does not depend on $t$. The *shape* $e^{st}$ passes through untouched. In linear-algebra language, $e^{st}$ is an eigenfunction of every LTI system and $G(s)$ — the Laplace transform of the impulse response, which lesson 3 names the transfer function — is the eigenvalue. Setting $s = j\omega$ gives the frequency response $G(j\omega)$, whose magnitude is the gain and whose angle is the phase shift at that frequency.

No other class of systems has a single family of eigenfunctions that works for all of its members. That is the technical content of "LTI is special".

::: example Superposition tested against a nonlinear spacecraft
A small satellite with pitch inertia $J = 4000\,\mathrm{kg\,m^2}$ hangs in a gravity-gradient field that produces a restoring torque $-J\omega_0^2\sin\theta$ with $\omega_0 = 0.02\,\mathrm{rad/s}$ (a $314\,\mathrm{s}$ period). Its exact equation is $\ddot{\theta} + \omega_0^2\sin\theta = u/J$; the linear model replaces $\sin\theta$ by $\theta$.

Fire two thruster pulses: pulse A, $0.25\,\mathrm{N\,m}$ for $5\,\mathrm{s}$ starting at $t = 0$; pulse B, $0.40\,\mathrm{N\,m}$ for $5\,\mathrm{s}$ starting at $t = 20\,\mathrm{s}$. Integrating the exact equation over $400\,\mathrm{s}$ with a fourth-order Runge–Kutta step of $5\,\mathrm{ms}$: A alone peaks at $1.044^\circ$, B alone at $1.671^\circ$, and both together at $2.646^\circ$. The superposition residual $\max_t|y_{A+B}(t) - (y_A(t) + y_B(t))|$ is $0.0021^\circ$, which is 0.08% of the peak. The linear model's residual is $3 \times 10^{-14}\,^\circ$ — numerical noise, as it must be.

Now scale both pulses by twenty: $5\,\mathrm{N\,m}$ and $8\,\mathrm{N\,m}$. A alone peaks at $20.998^\circ$, B alone at $33.911^\circ$, both together at $54.997^\circ$ — but the superposition residual is now $15.77^\circ$, **28.7% of the peak**. Adding the individual responses no longer predicts the joint response anywhere. The linear model still superposes exactly and still predicts $52.907^\circ$, an error of 3.8% in the peak, because $\sin\theta$ has fallen 8% below $\theta$ at $55^\circ$.

Read the two cases together: superposition is not approximately true at large amplitude, it is wrong, and the amplitude at which it breaks is a property of the plant, not of the tool.
:::

## How a vehicle is made LTI

Three operations, applied in this order, turn a flight-dynamics model into something this module can handle.

**Trim, then perturb.** Choose an operating point: a Mach number, a dynamic pressure, a mass, a nominal angle of attack and gimbal angle that balance. Define every variable as a departure from that point. The nonlinear relation $\mathbf{f}(\mathbf{x}, \mathbf{u})$ becomes, to first order,

$$
\Delta\dot{\mathbf{x}} = \frac{\partial\mathbf{f}}{\partial\mathbf{x}}\bigg|_0\Delta\mathbf{x} + \frac{\partial\mathbf{f}}{\partial\mathbf{u}}\bigg|_0\Delta\mathbf{u} = \mathbf{A}\,\Delta\mathbf{x} + \mathbf{B}\,\Delta\mathbf{u},
$$

with the Jacobians evaluated at the trim point. The neglected terms are second order in the perturbation, which is the precise meaning of "valid for small excursions".

**Freeze time.** The vehicle's mass, inertia, dynamic pressure and thrust all change during flight, so $\mathbf{A}$ and $\mathbf{B}$ are functions of $t$. Evaluate them at one instant and hold them fixed. The result is time invariant and is analysed as such; the design is then repeated at a grid of instants and the gains interpolated between them, which is **gain scheduling**. Freezing is justified when the vehicle's parameters drift slowly compared with the closed loop's response time — the usual rule is a factor of five or more in time scale.

**Keep the actuator off its limits.** Saturation, rate limiting and thruster deadbands are hard nonlinearities that no linearisation reaches. The linear design is made to command less than the available authority, and the nonlinear simulation exists to confirm that it does.

::: example Linearising a launch vehicle's pitch axis at max q
Take a two-stage vehicle at maximum dynamic pressure: thrust $T = 7.6\,\mathrm{MN}$, mass $m = 3.2 \times 10^5\,\mathrm{kg}$, length $70\,\mathrm{m}$, so a uniform-rod estimate of pitch inertia gives $I = mL^2/12 = 1.31 \times 10^8\,\mathrm{kg\,m^2}$. The gimbal is $l_g = 30\,\mathrm{m}$ behind the centre of mass; the centre of pressure is $l_{cp} = 5\,\mathrm{m}$ ahead of it. Dynamic pressure $\bar{q} = 33\,\mathrm{kPa}$, reference area $S = \pi(3.66/2)^2 = 10.52\,\mathrm{m^2}$, normal-force slope $C_{N\alpha} = 2.0$ per radian.

The exact control moment from a gimbal deflection $\delta$ is $T\,l_g\sin\delta$. Linearising, $\sin\delta \to \delta$, which costs 0.005% at $1^\circ$, 0.127% at $5^\circ$ and 1.15% at $15^\circ$ — negligible over any deflection the loop will command. Dividing by $I$ gives the control effectiveness

$$
\mu_\delta = \frac{T\,l_g}{I} = \frac{7.6\times10^6 \times 30}{1.31\times10^8} = 1.74\,\mathrm{s^{-2}}\ \text{per radian}.
$$

The aerodynamic moment for a centre of pressure *ahead* of the centre of mass is destabilising, $+\bar{q}SC_{N\alpha}l_{cp}\,\alpha$, giving

$$
\mu_\alpha = \frac{\bar{q}SC_{N\alpha}l_{cp}}{I} = \frac{33000 \times 10.52 \times 2.0 \times 5}{1.31\times10^8} = 0.0266\,\mathrm{s^{-2}}\ \text{per radian}.
$$

So the frozen linear pitch model is $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$ with no control applied, whose roots are $\pm\sqrt{\mu_\alpha} = \pm 0.163\,\mathrm{rad/s}$: an open-loop pole in the right half plane, an attitude error that doubles every $\ln 2/0.163 = 4.25\,\mathrm{s}$. Trimming a steady $3^\circ$ of angle of attack needs only $\delta = (\mu_\alpha/\mu_\delta) \times 3^\circ = 0.046^\circ$ of gimbal, which tells you that almost all of the actuator's authority is there for transients and thrust misalignment, not for aerodynamic trim.

How long does the frozen model last? The engines swallow $\dot{m} = T/(I_{sp}g_0) = 7.6\times10^6/(282 \times 9.80665) = 2748\,\mathrm{kg/s}$, so over one second the mass changes by 0.86%, over ten seconds by 8.6%, and over a hundred seconds by 86%. A closed loop that settles in a second or two sees a vehicle that is effectively frozen; the gain schedule must be re-evaluated every few seconds.
:::

::: warning
"Linear" and "time invariant" are separate properties and failing either one costs you something different. A linear but time-varying system still superposes, so you may add responses, but it has no transfer function and no Bode plot, because its response to a sinusoid is not a sinusoid of the same amplitude forever. A nonlinear but time-invariant system has neither superposition nor a transfer function, though describing-function methods recover a frequency-domain picture for special cases. Do not use "linear" loosely to mean "well behaved".
:::

::: note
The word *signal* in this module means a scalar function of continuous time. Sampled signals — what a flight computer actually sees — are dealt with in the digital-control module of this tier; until then, treat a sampled loop as continuous with an added delay of roughly half a sample period, which lesson 8 quantifies.
:::

## Check yourself

::: check
Decide whether each of these is linear, time invariant, both or neither, and say why: (a) $y(t) = 5\dot{u}(t) + 3u(t - 0.1)$; (b) $y(t) = u(t)^2$; (c) $\ddot{\theta} + \frac{c(t)}{J}\dot{\theta} = \frac{1}{J}u$ with $c(t) = c_0e^{-t/\tau}$; (d) $y(t) = 2u(t) + 1$.
:::

::: answer
(a) Both. Differentiation, scaling and a fixed delay are each linear, and their coefficients are constants, so a delayed input produces a delayed output. (b) Time invariant but not linear: $(u_1 + u_2)^2 \ne u_1^2 + u_2^2$, and doubling the input quadruples the output. (c) Linear but not time invariant: every term is first degree in $\theta$ and $u$, so superposition holds, but the coefficient $c(t)$ means the response to a pulse at $t = 0$ differs from the response to the same pulse at $t = 10\,\mathrm{s}$. (d) Neither linear (zero input gives $y = 1$) nor, by itself, a dynamic system; it is affine, and becomes linear in the perturbation variables $\Delta y = 2\Delta u$ about any operating point.
:::

::: check
A thruster on a spacecraft produces $0.5\,\mathrm{N}$ but cannot fire for less than $20\,\mathrm{ms}$, so its smallest impulse is $0.01\,\mathrm{N\,s}$. Commands of $0.004\,\mathrm{N\,s}$ and $0.007\,\mathrm{N\,s}$ therefore both produce nothing, while their sum produces one $0.01\,\mathrm{N\,s}$ pulse. Which property fails, and what does that cost you?
:::

::: answer
Additivity fails: $\mathcal{S}\{u_1\} + \mathcal{S}\{u_2\} = 0$ but $\mathcal{S}\{u_1 + u_2\} \ne 0$. The system is not linear, so it has no impulse response that characterises it, no transfer function, and no Bode plot — its "gain" depends on the size of the command. In practice the loop is designed on a linear model that ignores the minimum impulse bit, and the nonlinearity shows up as a limit cycle in attitude whose amplitude is set by the impulse bit divided by the inertia. Predicting that limit cycle needs nonlinear analysis, not this module.
:::

::: check
Show from the eigenfunction property that an LTI system driven by $u(t) = A\cos\omega t$ in steady state produces $y(t) = A|G(j\omega)|\cos(\omega t + \angle G(j\omega))$.
:::

::: answer
Write $A\cos\omega t = \tfrac{A}{2}e^{j\omega t} + \tfrac{A}{2}e^{-j\omega t}$. Each exponential is an eigenfunction, so the outputs are $\tfrac{A}{2}G(j\omega)e^{j\omega t}$ and $\tfrac{A}{2}G(-j\omega)e^{-j\omega t}$, and by linearity the total is their sum. For a system with real coefficients $h(t)$ is real, so $G(-j\omega) = \overline{G(j\omega)}$ and the two terms are complex conjugates. Writing $G(j\omega) = |G|e^{j\phi}$, the sum is $\tfrac{A}{2}|G|\left(e^{j(\omega t + \phi)} + e^{-j(\omega t + \phi)}\right) = A|G|\cos(\omega t + \phi)$. Same frequency, magnitude scaled by $|G(j\omega)|$, phase shifted by $\angle G(j\omega)$.
:::

::: check
The launch vehicle of the second worked example is re-analysed $30\,\mathrm{s}$ later, when $\bar{q}$ has fallen to $12\,\mathrm{kPa}$ and the mass to $2.38\times10^5\,\mathrm{kg}$ (take the length and the two moment arms as unchanged). What are $\mu_\alpha$ and $\mu_\delta$ now, and what has happened to the open-loop instability?
:::

::: answer
Inertia scales with mass for a fixed geometry: $I = 2.38\times10^5 \times 70^2/12 = 9.72\times10^7\,\mathrm{kg\,m^2}$. Then $\mu_\delta = 7.6\times10^6 \times 30/9.72\times10^7 = 2.35\,\mathrm{s^{-2}}$, up 35% because the same thrust now turns a lighter vehicle. And $\mu_\alpha = 12000 \times 10.52 \times 2.0 \times 5/9.72\times10^7 = 0.0130\,\mathrm{s^{-2}}$, half its earlier value, so the unstable root has moved from $0.163$ to $\sqrt{0.0130} = 0.114\,\mathrm{rad/s}$ and the doubling time has stretched from $4.25\,\mathrm{s}$ to $6.1\,\mathrm{s}$. Both gains have changed by tens of percent in half a minute, which is exactly why the controller is scheduled on flight time or on measured dynamic pressure rather than fixed.
:::

::: check
Why can a linear time-*varying* system not be given a transfer function, even though superposition still holds for it?
:::

::: answer
A transfer function is defined by $Y(s) = G(s)U(s)$ with $G$ independent of the input and of time — equivalently by the fact that one impulse response $h(\tau)$ describes the system. For a time-varying system the response to an impulse applied at time $t_0$ is a function $h(t, t_0)$ of two arguments, not of the difference $t - t_0$ alone, so the convolution integral does not collapse to a product of transforms. Superposition still lets you add responses, which is why linear time-varying analysis exists, but the exponential $e^{st}$ is no longer an eigenfunction: the integral $\int h(t, t_0)e^{-s(t - t_0)}\,dt_0$ depends on $t$, so no single complex gain exists at a given frequency.
:::

## Summary

| Item | Statement |
| --- | --- |
| Linearity | $\mathcal{S}\{a_1u_1 + a_2u_2\} = a_1\mathcal{S}\{u_1\} + a_2\mathcal{S}\{u_2\}$; forces $\mathcal{S}\{0\} = 0$ |
| Time invariance | $\mathcal{S}\{u(\cdot - T)\}(t) = y(t - T)$; constant coefficients |
| LTI | both; the only class with a transfer function and a Bode plot |
| Superposition buys | one impulse response describes everything; sinusoid in, same-frequency sinusoid out; zero-input plus zero-state |
| Eigenfunction property | $u = e^{st} \Rightarrow y = G(s)e^{st}$ with $G(s) = \int_0^\infty h(\tau)e^{-s\tau}d\tau$ |
| Linearisation | $\Delta\dot{\mathbf{x}} = \mathbf{A}\Delta\mathbf{x} + \mathbf{B}\Delta\mathbf{u}$, Jacobians at trim; perturbation variables |
| Frozen-time model | evaluate $\mathbf{A}$, $\mathbf{B}$ at one instant; re-design on a grid and schedule the gains |
| Launch vehicle pitch | $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$, $\mu_\delta = Tl_g/I$, $\mu_\alpha = \bar{q}SC_{N\alpha}l_{cp}/I$ |

The next lesson cashes in the first consequence of superposition: because one impulse response determines the response to any input, the convolution integral, together with the step response that a flight-test engineer can actually measure, is a complete description of an LTI system in the time domain.
