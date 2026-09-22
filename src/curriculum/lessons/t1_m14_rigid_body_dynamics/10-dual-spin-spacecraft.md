---
id: l10-dual-spin-spacecraft
title: Dual-spin spacecraft
minutes: 22
covers:
  - dual-spin spacecraft
---

Spin stabilisation, as lesson 9 showed, is almost free: an upper stage or a probe with a few thousand newton-metre-seconds of angular momentum holds its axis to a degree for months without a single command. The catch is that everything bolted to it spins too. An antenna that must stare at one ground station, a camera that must track a moon, a radiator that must face deep space — none of them can do their job on a body turning once a second.

The **dual-spin** spacecraft resolves this by splitting the vehicle in two. A **rotor** spins continuously about the momentum axis and supplies the gyroscopic stiffness; a **platform** is held stationary in inertial space by a motor in the bearing between them, and carries everything that has to point. From outside, the vehicle has the passive stability of a spinner and the pointing of a three-axis-stabilised satellite. This configuration — also called a **gyrostat** — carried most of the geostationary communications fleet of the 1970s and 1980s, and Galileo flew it to Jupiter with a spinning section for the fields-and-particles instruments and a despun section for the cameras.

There is a second, less obvious payoff, and it is the reason this lesson sits where it does. Lesson 8's major-axis rule says a dissipating body must spin about its axis of maximum inertia, which rules out the long slender shapes that fit inside a launch vehicle fairing. A dual-spin vehicle can break that rule. If the energy dissipation is concentrated on the *despun* side, a vehicle whose total axial inertia is smaller than its transverse inertia — a prolate vehicle, forbidden to a simple spinner — is nutationally stable. That result, worked out at Hughes Aircraft by Anthony Iorillo in the mid-1960s and confirmed in flight from TACSAT 1 in 1969 onward, is what made tall, thin communications satellites possible.

## The gyrostat and its equations of motion

Model the vehicle as two axisymmetric bodies sharing a spin axis $\hat{\mathbf{b}}_3$. Write the body frame in the platform, and let

- $I_t$ be the **total** transverse moment of inertia, platform plus rotor, about the system centre of mass;
- $I_{Pa}$ and $I_{Ra}$ be the axial moments of the platform and rotor separately, with $I_a = I_{Pa} + I_{Ra}$;
- $\boldsymbol{\omega} = (\omega_1, \omega_2, \omega_3)$ be the platform's angular velocity;
- $\Omega$ be the rotor's spin *relative to the platform*, so the rotor's inertial axial rate is $\omega_3 + \Omega$.

The rotor's transverse angular velocity is the platform's, since the relative motion is a rotation about $\hat{\mathbf{b}}_3$ only. Adding the two bodies' contributions gives the total angular momentum in platform components,

$$
\mathbf{H} = \big(I_t\omega_1,\ I_t\omega_2,\ I_a\omega_3 + h_s\big),
\qquad h_s \equiv I_{Ra}\Omega ,
$$

where $h_s$ is the **stored momentum**: the extra angular momentum the rotor carries because it turns faster than the platform. Compactly, $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3$, which is the form lesson 9 met for a spacecraft carrying a wheel. Applying the transport theorem as in lesson 5,

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{h}_s\hat{\mathbf{b}}_3 + \boldsymbol{\omega}\times\left(\mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3\right) = \mathbf{M}_{\mathrm{ext}} .
$$

With no external torque and $h_s$ held constant by the bearing motor, the components are

$$
\begin{aligned}
I_t\dot{\omega}_1 &= (I_t - I_a)\omega_2\omega_3 - h_s\omega_2, \\
I_t\dot{\omega}_2 &= (I_a - I_t)\omega_3\omega_1 + h_s\omega_1, \\
I_a\dot{\omega}_3 &= 0 .
\end{aligned}
$$

Linearise about a steady platform rate $\omega_3 = n$ with small transverse rates. Both equations carry the same coefficient,

$$
\sigma = (I_a - I_t)\,n + h_s ,
$$

giving $I_t\dot{\omega}_1 = -\sigma\omega_2$ and $I_t\dot{\omega}_2 = +\sigma\omega_1$, hence $\ddot{\omega}_1 = -(\sigma/I_t)^2\omega_1$. The transverse rates always oscillate, at the **gyrostat nutation frequency** $|\sigma|/I_t$, whatever the inertias are. A rigid axisymmetric gyrostat has no instability at all — exactly as a rigid axisymmetric body has none, and for the same reason: the stiffness is a perfect square. Everything interesting therefore comes from energy dissipation, as it did in lesson 8.

::: key The gyrostat
A dual-spin vehicle is a rotor and a platform sharing a spin axis, with total momentum $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3$, where $h_s = I_{Ra}\Omega$ is the momentum stored by the rotor's relative spin $\Omega$. Its equations of motion are Euler's with the extra terms $\dot{h}_s\hat{\mathbf{b}}_3 + \boldsymbol{\omega}\times h_s\hat{\mathbf{b}}_3$, and its nutation frequency is $|\sigma|/I_t$ with $\sigma = (I_a - I_t)n + h_s$. For a fully despun platform, $n = 0$ and the nutation frequency is $h_s/I_t = H/I_t$.
:::

## Who carries the momentum

The gyroscopic stiffness of lesson 9 depends only on the *total* $H$, not on which body holds it: a disturbance torque $\mathbf{M}$ walks the momentum axis at $M/H$ whether the momentum is in a spinning bus or in a rotor inside a stationary one. What does matter, for stability, is the **momentum fraction** each body carries. Define

$$
\mu_R = \frac{h_R}{H}, \qquad \mu_P = \frac{h_P}{H}, \qquad
h_R = I_{Ra}(\omega_3 + \Omega), \quad h_P = I_{Pa}\omega_3 ,
$$

so that $h_P + h_R = H_3 = H\cos\theta$ and $\mu_P + \mu_R \approx 1$ for small nutation angle $\theta$. A fully despun platform has $\omega_3 = 0$, so $\mu_P = 0$ and $\mu_R = 1$: the rotor carries everything. A locked vehicle, rotor and platform turning together, splits the momentum in proportion to the axial inertias, $\mu_P = I_{Pa}/I_a$. Real designs sit anywhere in between, and a **momentum-bias** spacecraft — one small wheel in an otherwise three-axis vehicle — is the limit $\mu_R$ small.

One more property makes the analysis tractable. If the bearing is frictionless and its motor exerts no axial torque, then each body's axial momentum is separately conserved: for an axisymmetric body the $\hat{\mathbf{b}}_3$ component of Euler's equation reads $I_{a}\dot{\omega}_{3} = M_3$, so with $M_3 = 0$ the quantity $h$ for that body is constant. A damper mounted on one body can therefore change that body's axial momentum but not the other's.

## Where you put the damper decides

Now repeat lesson 8's energy-sink argument, with one change: the vehicle is two bodies, and only the body carrying the damper can exchange axial momentum with the rest of the motion. Suppose the damper sits on body $X$, with axial moment $I_{Xa}$, and body $Y$ therefore holds its axial momentum $h_Y$ fixed. Then at nutation angle $\theta$,

$$
\omega_t = \frac{H\sin\theta}{I_t}, \qquad
\omega_{X3} = \frac{H\cos\theta - h_Y}{I_{Xa}},
$$

and the kinetic energy, at fixed $H$ and fixed $h_Y$, is a function of $\theta$ alone:

$$
T(\theta) = \frac{H^2\sin^2\theta}{2I_t} + \frac{(H\cos\theta - h_Y)^2}{2I_{Xa}} + \frac{h_Y^2}{2I_{Ya}} .
$$

Differentiate, and the third term is constant:

$$
\frac{dT}{d\theta} = H\sin\theta\,D, \qquad
D = H\cos\theta\left(\frac{1}{I_t} - \frac{1}{I_{Xa}}\right) + \frac{h_Y}{I_{Xa}} .
$$

Dissipation forces $T$ down, so $\theta$ moves toward smaller $T$: the nutation decays when $dT/d\theta > 0$ and grows when it is negative. For small $\theta$ substitute $h_Y = H - h_X$ and $\cos\theta \approx 1$:

$$
D_0 = \frac{H}{I_t} - \frac{h_X}{I_{Xa}} ,
$$

so the condition for a damper on body $X$ to *remove* nutation is $H/I_t > h_X/I_{Xa}$, that is

$$
\mu_X < \frac{I_{Xa}}{I_t} .
$$

::: key The dual-spin (Iorillo) stability criterion
Energy dissipation on a body $X$ of a gyrostat damps nutation if and only if the momentum fraction that body carries is smaller than its share of inertia: $\mu_X = h_X/H < I_{Xa}/I_t$. A fully despun platform has $\mu_P = 0$, so a platform damper is *always* stabilising — even for a prolate vehicle that a single spinning body could not hold. A damper on the rotor, which carries $\mu_R \approx 1$, is stabilising only if $I_{Ra} > I_t$.
:::

Two checks confirm that this is the right generalisation. Lock the two bodies together, so both spin at $\omega_3$ and $\mu_X = I_{Xa}/I_a$; the criterion becomes $I_{Xa}/I_a < I_{Xa}/I_t$, that is $I_a > I_t$ — lesson 8's major-axis rule, recovered exactly, for a damper anywhere in the vehicle. And set $h_s = 0$ with the platform spinning alone and it reduces the same way. The dual-spin result does not repeal the major-axis rule; it replaces the vehicle's total axial inertia with the *damped body's* axial inertia, and that substitution is what buys the freedom.

The same algebra gives the time constant. Since $\dot{T} = -k\,(\omega_t\cos\theta - \omega_{X3}\sin\theta)^2 = -k\sin^2\theta\,D^2$ for the energy-sink model of lesson 8 applied to body $X$,

$$
\dot{\theta} = \frac{\dot{T}}{dT/d\theta} = -\frac{k}{H}\sin\theta\,D
\qquad\Longrightarrow\qquad
\tau = \frac{H}{k\,D_0} = \frac{1}{k\left(\dfrac{1}{I_t} - \dfrac{\mu_X}{I_{Xa}}\right)} .
$$

A positive $\tau$ is a decay time, a negative one a divergence time, and $\tau\to\infty$ at the stability boundary $\mu_X = I_{Xa}/I_t$, where the damper does nothing to the nutation at all.

::: example A prolate dual-spin bus that is nevertheless stable
Take a communications bus with $I_t = 800$, $I_{Pa} = 150$ and $I_{Ra} = 400\,\mathrm{kg\,m^2}$, so $I_a = 550\,\mathrm{kg\,m^2}$. Since $I_a < I_t$ the vehicle is **prolate**: as a single rigid spinner it would be a minor-axis spinner, and lesson 8 gives it a divergence time constant of $I_aI_t/[k(I_t - I_a)] = 550\times 800/(20\times 250) = 88\,\mathrm{s}$ for $k = 20\,\mathrm{N\,m\,s}$. It would flat-spin within minutes.

Build it instead as a gyrostat. The rotor turns at $60\,\mathrm{rpm}$ relative to a fully despun platform, so $\Omega = 6.283\,\mathrm{rad/s}$ and $h_s = h_R = 400\times 6.283 = 2513\,\mathrm{N\,m\,s}$, which is the whole of $H$. The nutation frequency is $h_s/I_t = 2513/800 = 3.142\,\mathrm{rad/s}$, a period of $2.000\,\mathrm{s}$; integrating the gyrostat equations from a small transverse rate gives zero crossings at $0.5001$, $2.5001$ and $4.5001\,\mathrm{s}$ — a measured period of $2.0000\,\mathrm{s}$.

Put the damper on the platform, $k = 20\,\mathrm{N\,m\,s}$. Then $\mu_P = 0 < I_{Pa}/I_t = 0.1875$, so the criterion is satisfied and $\tau = I_t/k = 40\,\mathrm{s}$. Simulation from a $4^\circ$ initial nutation gives $1.4845^\circ$ at $40\,\mathrm{s}$ (predicted $1.4715^\circ$), $0.2061^\circ$ at $120\,\mathrm{s}$ (predicted $0.1991^\circ$) and $0.0286^\circ$ at $200\,\mathrm{s}$, with $\lVert\mathbf{H}\rVert$ constant to $6\times 10^{-14}$ throughout. A vehicle the major-axis rule forbids is being actively pulled back to a clean spin, by nothing but a viscous damper and the fact that the damper is on the stationary side.

Gyroscopic stiffness comes along unchanged: at $H = 2513\,\mathrm{N\,m\,s}$, a $2\times 10^{-5}\,\mathrm{N\,m}$ solar-pressure torque walks the momentum axis at $7.96\times 10^{-9}\,\mathrm{rad/s}$, which is $0.039^\circ$ per day or $14.4^\circ$ per year.
:::

::: example The same vehicle with the damper on the wrong side
Keep every number and move the damper to the rotor. Now $X = R$, $\mu_R = 1$, and the criterion demands $\mu_R < I_{Ra}/I_t = 400/800 = 0.5$. It fails by a factor of two, so the same hardware that stabilised the vehicle from the platform destabilises it from the rotor. The time constant is

$$
\tau = \frac{1}{k\left(\frac{1}{I_t} - \frac{\mu_R}{I_{Ra}}\right)}
= \frac{1}{20\left(\frac{1}{800} - \frac{1}{400}\right)} = -40\,\mathrm{s},
$$

a divergence with the same $40\,\mathrm{s}$ scale. Simulation started at $0.5^\circ$ reaches $1.36^\circ$ at $40\,\mathrm{s}$, $9.94^\circ$ at $120\,\mathrm{s}$ (the exponential prediction is $10.04^\circ$) and $52.3^\circ$ at $200\,\mathrm{s}$, by which point the energy has fallen to $0.687$ of its initial value and the vehicle is on its way to a flat spin. Angular momentum is conserved to four parts in $10^{12}$ the whole way: as in lesson 8, the instability is not a conservation failure.

This is not a hypothetical filing error. The rotor of a real dual-spin vehicle contains the propellant tanks, the bearing lubricant and the solar-cell drum — all of them lossy — while the platform may be a stiff truss with electronics bolted to it. A design that does nothing deliberate about damping tends to end up with the loss on the rotor, which is precisely the destabilising side. Dual-spin vehicles therefore carry a purpose-built **nutation damper on the platform**, usually a partly filled tube of viscous fluid tuned near the nutation frequency, sized so that its dissipation dominates everything happening in the rotor.
:::

::: example How much momentum the platform may carry
The criterion is not a statement about despinning; it is a statement about momentum fractions, so a partly spun platform is a legitimate design point that can be evaluated directly. For the same bus, the platform damper stops helping when $\mu_P$ reaches $I_{Pa}/I_t = 0.1875$, that is when $h_P = 0.1875\times 2513 = 471\,\mathrm{N\,m\,s}$, a platform rate of $471/150 = 3.14\,\mathrm{rad/s}$ — exactly $30\,\mathrm{rpm}$.

Check the trend by simulation at $H = 2500\,\mathrm{N\,m\,s}$, $k = 20\,\mathrm{N\,m\,s}$, starting from $2^\circ$ of nutation. With $h_P = 300\,\mathrm{N\,m\,s}$ ($\mu_P = 0.12$) the formula gives $\tau = +111\,\mathrm{s}$, and after $120\,\mathrm{s}$ the nutation has fallen to $0.677^\circ$ against a prediction of $0.679^\circ$ — still stable, but nearly three times slower than the fully despun case, because the platform is closer to the boundary. With $h_P = 700\,\mathrm{N\,m\,s}$ ($\mu_P = 0.28$, past the limit) the formula gives $\tau = -81\,\mathrm{s}$ and the simulation grows to $8.37^\circ$ in the same $120\,\mathrm{s}$.

Read across the three cases: as the platform takes up more of the momentum, its damper first weakens, then stops working, then turns destructive. Nothing about the vehicle's shape changed.
:::

## The bearing, the motor and the failure mode

The mechanical heart of a dual-spin vehicle is the bearing and power transfer assembly: a pair of bearings, a despin motor, an angle encoder, and slip rings carrying power and signals across the rotating joint. The motor's job is a pointing job, not a torque job. It runs a control loop that holds the platform at a commanded inertial angle, using the encoder and an Earth or sun sensor, and the torque it needs is only what is required to cancel bearing friction.

That torque is small, and so is the power. A friction torque of $0.05\,\mathrm{N\,m}$ at a relative rate of $6.283\,\mathrm{rad/s}$ costs $M\Omega = 0.31\,\mathrm{W}$ — negligible beside the payload. But the friction is also the coupling that makes the failure mode interesting. If the despin loop fails and the motor free-wheels, friction drags the platform up to the rotor's speed. Angular momentum is conserved, so the locked vehicle ends up spinning at $\omega = H/I_a = 2513/550 = 4.57\,\mathrm{rad/s}$, about $43.6\,\mathrm{rpm}$ — and it is now a single prolate body with damping, which lesson 8 says must flat-spin. It will settle at $H/I_t = 3.14\,\mathrm{rad/s}$, $30\,\mathrm{rpm}$, tumbling end over end with its antenna sweeping the sky. A dual-spin vehicle depends on its bearing in a way a simple spinner does not.

::: warning The criterion is about the damped body, not the vehicle
$\mu_X < I_{Xa}/I_t$ names a specific body $X$ — the one that dissipates. Two dampers on two bodies give two conditions, and if they disagree the outcome depends on which dissipates faster, which is a quantitative question about the actual hardware and not something the inertia ratios alone can settle. "The vehicle is prolate, therefore unstable" is the rigid-body statement of lesson 8 and is wrong for a gyrostat; "the vehicle is a gyrostat, therefore stable" is equally wrong. Name the damper, compute its $\mu_X$, then decide.
:::

::: warning What the energy-sink derivation assumes
The derivation treats $\theta$ as varying slowly compared with the nutation period, so that $T(\theta)$ is meaningful; it assumes the damper's own angular momentum is small compared with $H$; and it assumes the bearing carries no axial torque, which is what holds $h_Y$ fixed. All three are good for a well-designed vehicle and all three can break. A damper deliberately tuned to resonate at the nutation frequency has neither a small motion nor a slow one, and a stiff despin control loop applies exactly the axial torque the derivation assumes away. When the margins are thin, the energy-sink criterion tells you which way to look; a full multi-body simulation tells you whether you are safe.
:::

::: note Where the idea came from
The stability of dual-spin vehicles was worked out at Hughes Aircraft in the mid-1960s by Anthony Iorillo, who showed that damping concentrated on the despun section stabilises configurations that violate the major-axis rule; Peter Likins and others put the energy-sink argument on a firmer footing shortly afterwards. TACSAT 1, launched in 1969, was the first large vehicle built on the result, and the Intelsat IV series that followed used a despun antenna platform on a spinning drum to serve the first generation of transoceanic satellite telephony. Galileo, launched in 1989, carried the architecture to Jupiter. The configuration has largely given way to three-axis control with reaction wheels, which is the subject of the next lesson, but the stability argument remains one of the cleanest applications of energy methods in the field.
:::

## Check yourself

::: check
A gyrostat has $I_t = 1000$, $I_{Pa} = 200$ and $I_{Ra} = 300\,\mathrm{kg\,m^2}$, and $H = 2000\,\mathrm{N\,m\,s}$ with a fully despun platform. Is a platform damper stabilising? Is a rotor damper? Give the time constants for $k = 10\,\mathrm{N\,m\,s}$.
:::

::: answer
The platform carries $h_P = 0$, so $\mu_P = 0 < I_{Pa}/I_t = 0.200$ and a platform damper is stabilising, with $\tau = 1/[k(1/I_t - \mu_P/I_{Pa})] = 1/[10\times(0.001 - 0)] = 100\,\mathrm{s}$ of decay. The rotor carries everything, $\mu_R = 1$, against a limit $I_{Ra}/I_t = 0.300$, so a rotor damper is destabilising: $\tau = 1/[10\times(1/1000 - 1/300)] = 1/[10\times(-0.002333)] = -42.9\,\mathrm{s}$. Note that the vehicle is prolate — $I_a = 500 < I_t = 1000$ — and it is stable anyway, provided the loss is on the right side.
:::

::: check
The same vehicle is operated with its platform spun up so that it carries $h_P = 400\,\mathrm{N\,m\,s}$. What happens to the platform damper?
:::

::: answer
Now $\mu_P = 400/2000 = 0.200$, exactly equal to $I_{Pa}/I_t = 200/1000 = 0.200$. The vehicle is on the stability boundary: $D_0 = H/I_t - h_P/I_{Pa} = 2.0 - 2.0 = 0$, the time constant is infinite, and to this order the platform damper neither removes nutation nor adds it. Any further spin-up of the platform makes it destabilising. The practical reading is that the margin in a dual-spin design is a *momentum* margin, and it shrinks as soon as the platform is allowed to rotate.
:::

::: check
Why does the gyrostat nutation frequency $|\sigma|/I_t$ reduce to $H/I_t$ for a despun platform, and what does an accelerometer or a star tracker on the platform actually see at that frequency?
:::

::: answer
With the platform despun, $n = \omega_3 = 0$, so $\sigma = (I_a - I_t)\times 0 + h_s = h_s$; and since the rotor then carries all the momentum, $h_s = H$, giving $|\sigma|/I_t = H/I_t$. That is exactly the inertial precession rate $\dot{\psi}$ derived in lesson 9, which is no coincidence: the platform frame is inertially fixed in the nominal state, so its "body-frame" nutation rate and the inertial precession rate are the same number. A star tracker on the platform sees the whole platform coning about $\mathbf{H}$ at that rate, with amplitude $\theta$; a rate gyro sees transverse rates of amplitude $H\sin\theta/I_t$ in quadrature at the same frequency. For the bus in the examples that is a $2.0\,\mathrm{s}$ period, slow enough to be well inside a pointing control loop's bandwidth and therefore visible as a pointing error rather than as noise.
:::

::: check
Show that the dual-spin criterion reduces to the major-axis rule when the rotor is locked to the platform.
:::

::: answer
Locked means both bodies turn at the same $\omega_3$, so $h_X = I_{Xa}\omega_3$ and $H \approx I_a\omega_3$ for small $\theta$, giving $\mu_X = I_{Xa}/I_a$ for either body. The criterion $\mu_X < I_{Xa}/I_t$ becomes $I_{Xa}/I_a < I_{Xa}/I_t$, and cancelling the positive $I_{Xa}$ leaves $1/I_a < 1/I_t$, that is $I_a > I_t$: the vehicle must spin about its axis of maximum inertia. The condition no longer mentions which body carries the damper, exactly as it should for a single rigid body, and it is lesson 8's rule.
:::

::: check
A designer proposes to satisfy the criterion by making the rotor's axial inertia larger than the total transverse inertia, $I_{Ra} > I_t$, so that a damper anywhere is safe. What does that imply about the vehicle, and why is it usually not done?
:::

::: answer
It implies $I_a = I_{Pa} + I_{Ra} > I_{Ra} > I_t$, so the vehicle is oblate overall and would be stable as a simple rigid spinner in the first place — the dual-spin stability argument buys nothing. An oblate vehicle is short and wide: its diameter must exceed roughly its length, which for a given fairing means a short stack, little room for tanks and antennas along the axis, and a poor packing factor. The whole point of the dual-spin configuration is to let a vehicle be tall and thin — prolate — and still hold its attitude, so a design that achieves stability by going oblate has given away the reason to be dual-spin at all. It may still be chosen for the continuous pointing, but then the damper placement is no longer the driving constraint.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Gyrostat | Rotor plus platform on a common spin axis; rotor gives stiffness, platform points |
| $h_s = I_{Ra}\Omega$ | Momentum stored by the rotor's relative spin $\Omega$ |
| $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3$ | Total angular momentum in platform components |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{h}_s\hat{\mathbf{b}}_3 + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3) = \mathbf{M}$ | Gyrostat equations of motion |
| $\sigma = (I_a - I_t)n + h_s$ | Nutation frequency is $\lvert\sigma\rvert/I_t$; a rigid axisymmetric gyrostat is always oscillatory |
| $\mu_X = h_X/H$ | Momentum fraction carried by body $X$; despun platform has $\mu_P = 0$ |
| $\mu_X < I_{Xa}/I_t$ | Iorillo criterion: a damper on body $X$ removes nutation |
| $\tau = 1/[k(1/I_t - \mu_X/I_{Xa})]$ | Nutation time constant; positive is decay, negative divergence |
| Locked limit $\mu_X = I_{Xa}/I_a$ | Criterion reduces to $I_a > I_t$, the major-axis rule of lesson 8 |
| Example bus $I_t = 800$, $I_{Pa} = 150$, $I_{Ra} = 400$ | Prolate; platform damper $\tau = +40\,\mathrm{s}$, rotor damper $\tau = -40\,\mathrm{s}$ |

A dual-spin vehicle stores its momentum in a dedicated spinning part and points with the rest. Shrink the rotor until it is a small flywheel in a bearing, let its speed be commanded rather than fixed, and add two more of them on the other axes, and the same momentum bookkeeping becomes reaction wheel control — which, with control moment gyros and the awkward geometry they bring, is the next lesson.
