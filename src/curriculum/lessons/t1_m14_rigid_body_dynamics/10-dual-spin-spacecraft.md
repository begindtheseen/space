---
id: l10-dual-spin-spacecraft
title: Dual-spin spacecraft
minutes: 24
covers:
  - dual-spin spacecraft
---

Think of a lighthouse. The lamp goes round and round, but the tower stands still, and the keeper's window always faces the same way. Now turn that idea upside down: a spacecraft whose heavy lower half spins like a top, while the upper half, sitting on a bearing, stays still and keeps an antenna aimed at Earth.

That is a **[[dual-spin spacecraft|dual-spin-layout]]**. Lesson 9 showed why spin is so useful: a vehicle with a few thousand newton-meter-seconds of angular momentum holds its axis to about a degree for months without a single command. The catch is that everything bolted to a spinner spins too. An antenna that must stare at one ground station, or a camera that must track a moon, cannot do its job on a body turning once a second. The dual-spin design splits the vehicle in two so that one part supplies the spin and the other part does the pointing.

This design — also called a **[[gyrostat|gyrostat-word]]**, meaning a body with a spinning wheel built into it — carried most of the **[[geostationary communications fleet|geo-comsats]]** of the 1970s and 1980s. Galileo flew it to Jupiter, with a spinning section for the fields-and-particles instruments and a still section for the cameras.

There is a second, less obvious payoff. Lesson 8's **major-axis rule** says a body that loses energy must end up spinning about its axis of largest inertia. That rules out tall, thin shapes — exactly the shapes that fit inside a rocket's nose cone. A dual-spin vehicle can break the rule. If the energy loss happens on the *still* side, a tall, thin vehicle can spin stably. That discovery is what made tall, thin communications satellites possible.

## Two bodies on one axle

Here are the two parts and their names:

- the **rotor** — the part that spins continuously about the momentum axis and provides the gyroscopic stiffness;
- the **platform** — the part held still by a motor in the bearing between the two, carrying everything that has to point.

A platform that does not turn at all is called **despun**. From outside, the whole vehicle has the passive stability of a spinner and the pointing of a satellite steered on all three axes.

::: key Dual-spin spacecraft
A dual-spin spacecraft is a spinning rotor plus a despun platform. The rotor supplies gyroscopic stiffness while the platform points continuously, and — by Iorillo's energy-sink result — damping on the despun section can stabilize a configuration that would otherwise violate the major-axis rule.
:::

### The angular momentum

Model the vehicle as two round (axisymmetric) bodies sharing a spin axis $\hat{\mathbf{b}}_3$ (read "b-hat three", the unit vector along the axle). Fix the body frame in the platform. The symbols:

- $I_t$ — the **total transverse moment of inertia**, platform plus rotor, about the center of mass, for rotation sideways to the axle;
- $I_{Pa}$ and $I_{Ra}$ — the **axial** moments (about the axle) of the platform and of the rotor separately, with $I_a = I_{Pa} + I_{Ra}$ for the whole vehicle;
- $\boldsymbol{\omega} = (\omega_1, \omega_2, \omega_3)$ — the platform's angular velocity;
- $\Omega$ (capital omega) — the rotor's spin *relative to the platform*, so the rotor's true axial rate is $\omega_3 + \Omega$.

The rotor turns relative to the platform only about the axle. So its sideways rates are the platform's. Add up the two bodies' angular momentum in platform components:

$$
\mathbf{H} = \big(I_t\omega_1,\ I_t\omega_2,\ I_a\omega_3 + h_s\big),
\qquad h_s \equiv I_{Ra}\Omega .
$$

The new quantity $h_s$ ("h sub s") is the **stored momentum**: the extra angular momentum the rotor carries because it turns faster than the platform. Written compactly, $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3$. That is the same shape lesson 9 found for a spacecraft carrying a wheel.

### The equations of motion

Lesson 5's transport step says the rate of change of $\mathbf{H}$ seen from the platform, plus $\boldsymbol{\omega}\times\mathbf{H}$, equals the external torque:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{h}_s\hat{\mathbf{b}}_3 + \boldsymbol{\omega}\times\left(\mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3\right) = \mathbf{M}_{\mathrm{ext}} .
$$

These are Euler's equations with two new terms. Now take no external torque, and let the bearing motor hold $h_s$ constant. Work out the cross product component by component. Its first component is $\omega_2 H_3 - \omega_3 H_2 = \omega_2(I_a\omega_3 + h_s) - \omega_3 I_t\omega_2$, and it moves to the right-hand side with a minus sign. The three equations are

$$
\begin{aligned}
I_t\dot{\omega}_1 &= (I_t - I_a)\omega_2\omega_3 - h_s\omega_2, \\
I_t\dot{\omega}_2 &= (I_a - I_t)\omega_3\omega_1 + h_s\omega_1, \\
I_a\dot{\omega}_3 &= 0 .
\end{aligned}
$$

The last line says the platform's axial rate stays put; call it $n$. Now suppose the sideways rates are small, and keep only terms with one small factor. Both sideways equations carry the same coefficient,

$$
\sigma = (I_a - I_t)\,n + h_s ,
$$

and they become $I_t\dot{\omega}_1 = -\sigma\omega_2$ and $I_t\dot{\omega}_2 = +\sigma\omega_1$. Differentiate the first and substitute the second: $\ddot{\omega}_1 = -(\sigma/I_t)^2\,\omega_1$.

That is a spring whose "stiffness" $(\sigma/I_t)^2$ is a perfect square, so it can never be negative. The sideways rates always oscillate, at the **gyrostat nutation frequency** $|\sigma|/I_t$, whatever the inertias are. A rigid, round gyrostat has no instability at all — like a rigid, round single body, and for the same reason. Everything interesting will come from energy loss, as it did in lesson 8.

::: key The gyrostat
A dual-spin vehicle is a rotor and a platform sharing a spin axis, with total momentum $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3$, where $h_s = I_{Ra}\Omega$ is the momentum stored by the rotor's relative spin $\Omega$. Its equations of motion are Euler's with the extra terms $\dot{h}_s\hat{\mathbf{b}}_3 + \boldsymbol{\omega}\times h_s\hat{\mathbf{b}}_3$, and its nutation frequency is $|\sigma|/I_t$ with $\sigma = (I_a - I_t)n + h_s$. For a fully despun platform, $n = 0$ and the nutation frequency is $h_s/I_t = H/I_t$.
:::

## Who carries the momentum

Gyroscopic stiffness depends only on the *total* $H$: a disturbance torque $\mathbf{M}$ walks the momentum axis at the rate $M/H$ whichever part holds the momentum.

What matters for stability is how the momentum is *shared*. Define the **momentum fraction** of each body — the share of the total it carries:

$$
\mu_R = \frac{h_R}{H}, \qquad \mu_P = \frac{h_P}{H}, \qquad
h_R = I_{Ra}(\omega_3 + \Omega), \quad h_P = I_{Pa}\omega_3 .
$$

($\mu$ is the Greek letter "mu".) Here $h_R$ and $h_P$ are the axial momenta of rotor and platform. They add to the axial part of $\mathbf{H}$, which is $H\cos\theta$, where $\theta$ ("theta") is the **nutation angle** between the axle and $\mathbf{H}$. For a small wobble $\cos\theta \approx 1$, so $\mu_P + \mu_R \approx 1$, like two slices of one pie.

Three cases show the range:

- **Fully despun platform.** $\omega_3 = 0$, so $\mu_P = 0$ and $\mu_R = 1$: the rotor carries everything.
- **Locked vehicle.** Rotor and platform turn together, so the momentum splits in proportion to axial inertia: $\mu_P = I_{Pa}/I_a$.
- **Momentum-bias spacecraft.** One small wheel in an otherwise three-axis-steered vehicle: $\mu_R$ small.

One more fact makes the analysis possible. Suppose the bearing has no friction and its motor applies no torque along the axle. Then each body's axial momentum is separately conserved. The reason: for a round body, the axial line of Euler's equation reads $I_a\dot{\omega}_3 = M_3$, so with no axial torque on that body its axial momentum cannot change. So a damper mounted on one body can change *that* body's axial momentum, but not the other's.

## Where you put the damper decides

Energy runs downhill. A **damper** — anything that turns motion into heat, from sloshing fuel to a flexing antenna — is a one-way leak: it lets energy out and never puts any in. So the nutation angle drifts in whichever direction lowers the energy, like a ball rolling in a landscape. The question is whether $\theta = 0$, a clean spin, is the [[bottom of a valley or the top of a hill|energy-landscape]].

For a single body, lesson 8 answered that with the inertias alone. For two bodies, the landscape depends on *which body carries the damper*, because only that body can trade axial momentum with the wobble.

### The energy landscape

Put the damper on body $X$, with axial moment $I_{Xa}$. The other body, $Y$, keeps its axial momentum $h_Y$ fixed. At nutation angle $\theta$ the sideways rate and body $X$'s axial rate are

$$
\omega_t = \frac{H\sin\theta}{I_t}, \qquad
\omega_{X3} = \frac{H\cos\theta - h_Y}{I_{Xa}} .
$$

The first says the sideways part of $\mathbf{H}$ is $H\sin\theta$; the second, that body $X$ holds whatever axial momentum body $Y$ does not. The kinetic energy has one piece per kind of motion, and at fixed $H$ and $h_Y$ it depends on $\theta$ alone:

$$
T(\theta) = \frac{H^2\sin^2\theta}{2I_t} + \frac{(H\cos\theta - h_Y)^2}{2I_{Xa}} + \frac{h_Y^2}{2I_{Ya}} .
$$

Now find the slope of the landscape. Differentiate each term with respect to $\theta$; the third is constant and drops out. Using $\frac{d}{d\theta}\sin^2\theta = 2\sin\theta\cos\theta$ and the chain rule on the second term, then pulling out the common factor $H\sin\theta$:

$$
\frac{dT}{d\theta} = H\sin\theta\,D, \qquad
D = H\cos\theta\left(\frac{1}{I_t} - \frac{1}{I_{Xa}}\right) + \frac{h_Y}{I_{Xa}} .
$$

If $dT/d\theta > 0$, energy rises as the wobble grows, so losing energy shrinks the wobble. If it is negative, losing energy grows it. For a small wobble, put $\cos\theta \approx 1$ and $h_Y = H - h_X$:

$$
D_0 = \frac{H}{I_t} - \frac{H}{I_{Xa}} + \frac{H - h_X}{I_{Xa}} = \frac{H}{I_t} - \frac{h_X}{I_{Xa}} .
$$

The damper removes nutation when $D_0 > 0$, that is $H/I_t > h_X/I_{Xa}$. Divide both sides by $H$ and multiply by $I_{Xa}$:

$$
\mu_X < \frac{I_{Xa}}{I_t} .
$$

::: key The dual-spin (Iorillo) stability criterion
Energy dissipation on a body $X$ of a gyrostat damps nutation if and only if the momentum fraction that body carries is smaller than its share of inertia: $\mu_X = h_X/H < I_{Xa}/I_t$. A fully despun platform has $\mu_P = 0$, so a platform damper is *always* stabilizing — even for a **[[prolate|prolate-oblate]]** vehicle (axial inertia smaller than transverse) that a single spinning body could not hold. A damper on the rotor, which carries $\mu_R \approx 1$, is stabilizing only if $I_{Ra} > I_t$.
:::

Here is a check that this is the right rule. Lock the two bodies together, so both spin at $\omega_3$. Then $\mu_X = I_{Xa}/I_a$, and the criterion becomes $I_{Xa}/I_a < I_{Xa}/I_t$. Cancel $I_{Xa}$ and flip both sides: $I_a > I_t$. That is lesson 8's major-axis rule, recovered exactly, for a damper anywhere in the vehicle. Spin the platform alone with $h_s = 0$ and it reduces the same way.

So the dual-spin result does not cancel the major-axis rule. It swaps the vehicle's total axial inertia for the *damped body's* axial inertia, and that swap buys the freedom.

### How fast

Use lesson 8's sign convention: the nutation angle obeys $\dot{\theta} = \theta/\tau$, so a negative $\tau$ ("tau") means the wobble decays and a positive one means it grows. With lesson 8's energy-sink model on body $X$, the answer is

$$
\tau = \frac{1}{k\left(\dfrac{\mu_X}{I_{Xa}} - \dfrac{1}{I_t}\right)} ,
$$

where $k$ is the damper's loss coefficient in $\mathrm{N\,m\,s}$. At the boundary $\mu_X = I_{Xa}/I_t$ the bracket is zero, $\tau$ is infinite, and the damper does nothing to the nutation at all. Lock the bodies ($\mu_X = I_{Xa}/I_a$) and it becomes $I_aI_t/[k(I_t - I_a)]$, lesson 8's formula.

::: note Why it has to be true: the time constant
Lesson 8's sink removes energy at the rate $\dot{T} = -k\,\omega_\perp^2$, where $\omega_\perp$ is the part of body $X$'s angular velocity perpendicular to $\mathbf{H}$. That part is $\omega_t\cos\theta - \omega_{X3}\sin\theta$. Substituting the two rates above and factoring gives $\sin\theta\,D$, so $\dot{T} = -k\sin^2\theta\,D^2$.

The chain rule says $\dot{T} = (dT/d\theta)\,\dot{\theta}$, so

$$
\dot{\theta} = \frac{\dot{T}}{dT/d\theta} = \frac{-k\sin^2\theta\,D^2}{H\sin\theta\,D} = -\frac{k}{H}\sin\theta\,D .
$$

For small $\theta$, $\sin\theta \approx \theta$ and $D \approx D_0$, so $\dot{\theta} = \theta/\tau$ with $\tau = -H/(kD_0)$. Put in $D_0 = H/I_t - h_X/I_{Xa}$ and divide top and bottom by $H$ to get the formula above.
:::

::: example A prolate dual-spin bus that is nevertheless stable
A communications bus has $I_t = 800$, $I_{Pa} = 150$ and $I_{Ra} = 400\,\mathrm{kg\,m^2}$, so $I_a = 150 + 400 = 550\,\mathrm{kg\,m^2}$.

**As a single spinner.** $I_a < I_t$, so the vehicle is prolate: a minor-axis spinner. With a loss coefficient $k = 20\,\mathrm{N\,m\,s}$, lesson 8 gives $\tau = I_aI_t/[k(I_t - I_a)] = 550\times 800/(20\times 250) = 440\,000/5000 = +88\,\mathrm{s}$. Positive, so the wobble grows: a flat spin within minutes.

**As a gyrostat.** The rotor turns at $60\,\mathrm{rpm}$ relative to a fully despun platform. That is one turn per second, $\Omega = 2\pi = 6.283\,\mathrm{rad/s}$. So $h_s = h_R = 400\times 6.283 = 2513\,\mathrm{N\,m\,s}$, which is all of $H$. The nutation frequency is $h_s/I_t = 2513/800 = 3.142\,\mathrm{rad/s}$, a period of $2\pi/3.142 = 2.000\,\mathrm{s}$. Integrating the gyrostat equations from a small sideways rate, the rate crosses zero every $1.000\,\mathrm{s}$ — half a period — as it should.

**Damper on the platform.** Now $\mu_P = 0$, and the limit is $I_{Pa}/I_t = 150/800 = 0.1875$. Since $0 < 0.1875$, the criterion holds. The time constant is $\tau = 1/[20\times(0 - 1/800)] = -800/20 = -40\,\mathrm{s}$: the wobble shrinks by a factor $e$ every $40\,\mathrm{s}$.

A simulation from $4^\circ$ of nutation gives $1.4845^\circ$ at $40\,\mathrm{s}$ (the prediction $4e^{-1}$ is $1.4715^\circ$), $0.2061^\circ$ at $120\,\mathrm{s}$ (predicted $0.1991^\circ$) and $0.0286^\circ$ at $200\,\mathrm{s}$. The small gap is the small-angle approximation. $\lVert\mathbf{H}\rVert$ stays constant to about $4$ parts in $10^{15}$ throughout. A vehicle the major-axis rule forbids is pulled back to a clean spin by a damper on the still side.

**Stiffness comes along unchanged.** At $H = 2513\,\mathrm{N\,m\,s}$, a solar-pressure torque of $2\times 10^{-5}\,\mathrm{N\,m}$ walks the momentum axis at $2\times 10^{-5}/2513 = 7.96\times 10^{-9}\,\mathrm{rad/s}$. That is $0.039^\circ$ per day, or $14.4^\circ$ per year.
:::

::: example The same vehicle with the damper on the wrong side
Keep every number and move the damper to the rotor. Now $X = R$ and $\mu_R = 1$, but the criterion demands $\mu_R < I_{Ra}/I_t = 400/800 = 0.5$. It fails by a factor of two. The same hardware that steadied the vehicle from the platform now shakes it apart from the rotor:

$$
\tau = \frac{1}{k\left(\frac{\mu_R}{I_{Ra}} - \frac{1}{I_t}\right)}
= \frac{1}{20\left(\frac{1}{400} - \frac{1}{800}\right)} = \frac{1}{20\times 0.00125} = +40\,\mathrm{s},
$$

a growth with the same $40\,\mathrm{s}$ scale. A simulation started at $0.5^\circ$ reaches $1.36^\circ$ at $40\,\mathrm{s}$ (predicted $0.5e = 1.36^\circ$), $9.94^\circ$ at $120\,\mathrm{s}$ (predicted $10.04^\circ$) and $52.3^\circ$ at $200\,\mathrm{s}$. By then the energy has fallen to $0.687$ of its starting value and the vehicle is on its way to a flat spin. Angular momentum holds to a few parts in $10^{13}$ the whole way. As in lesson 8, the instability is not a failure of conservation.

This is not a made-up mistake. A real rotor holds the propellant tanks, the bearing lubricant and the drum of solar cells — all lossy — while the platform may be a stiff frame of electronics. A design that does nothing deliberate about damping tends to end up with its losses on the rotor, the destabilizing side. That is why dual-spin vehicles carry a purpose-built **[[nutation damper on the platform|nutation-damper]]**, usually a partly filled tube of thick fluid tuned near the nutation frequency, sized so that it out-dissipates everything in the rotor.
:::

::: example How much momentum the platform may carry
The criterion is about momentum fractions, not about despinning. So a platform that turns slowly is a fair design point too.

For the same bus, the platform damper stops helping when $\mu_P$ reaches $I_{Pa}/I_t = 0.1875$. That is $h_P = 0.1875\times 2513 = 471\,\mathrm{N\,m\,s}$, a platform rate of $471/150 = 3.14\,\mathrm{rad/s}$ — exactly $30\,\mathrm{rpm}$.

Check the trend at $H = 2500\,\mathrm{N\,m\,s}$ and $k = 20\,\mathrm{N\,m\,s}$, starting from $2^\circ$:

- $h_P = 300\,\mathrm{N\,m\,s}$, so $\mu_P = 300/2500 = 0.12$. Then $\tau = 1/[20\times(0.12/150 - 1/800)] = 1/[20\times(0.0008 - 0.00125)] = -111\,\mathrm{s}$. After $120\,\mathrm{s}$ the simulation has $0.684^\circ$ against a prediction of $0.679^\circ$. Still stable, but nearly three times slower than the despun case, because the platform is closer to the boundary.
- $h_P = 700\,\mathrm{N\,m\,s}$, so $\mu_P = 0.28$, past the limit. Then $\tau = 1/[20\times(0.28/150 - 1/800)] = +81\,\mathrm{s}$, and the simulation grows to $8.45^\circ$ in the same $120\,\mathrm{s}$.

As the platform takes on more of the momentum, its damper first weakens, then stops working, then does harm. The vehicle's shape never changed.
:::

## The bearing, the motor and the failure mode

The mechanical heart of a dual-spin vehicle is the bearing and power transfer assembly: two bearings, a despin motor, an angle sensor, and **[[slip rings|slip-rings]]** that carry power and signals across the turning joint. The motor has a pointing job, not a torque job: it holds the platform at a commanded angle, using the angle sensor and an Earth or Sun sensor, and needs only enough torque to cancel bearing friction.

The power is small too. Power is torque times rate: a friction torque of $0.05\,\mathrm{N\,m}$ at a relative rate of $6.283\,\mathrm{rad/s}$ costs $0.05\times 6.283 = 0.31\,\mathrm{W}$, next to nothing.

But friction also links the two bodies, and that makes the failure mode interesting. Suppose the despin loop fails and the motor coasts. Friction drags the platform up to the rotor's speed. Angular momentum is conserved, so the locked vehicle spins at $\omega = H/I_a = 2513/550 = 4.57\,\mathrm{rad/s}$, about $43.6\,\mathrm{rpm}$. Now it is a single prolate body with damping, and lesson 8 says it must go into a flat spin. It settles at $H/I_t = 2513/800 = 3.14\,\mathrm{rad/s}$, $30\,\mathrm{rpm}$, tumbling end over end with its antenna sweeping the sky. A dual-spin vehicle depends on its bearing in a way a simple spinner does not.

::: warning The criterion is about the damped body, not the vehicle
$\mu_X < I_{Xa}/I_t$ names one body $X$ — the one that loses energy. Two dampers on two bodies give two conditions. If they disagree, whichever dissipates faster wins, and only the hardware can settle that. "The vehicle is prolate, so it is unstable" is lesson 8's rigid-body statement and is wrong for a gyrostat. "The vehicle is a gyrostat, so it is stable" is equally wrong. Name the damper, compute its $\mu_X$, then decide.
:::

::: warning What the energy-sink derivation assumes
It assumes three things. The angle $\theta$ changes slowly compared with the nutation period, so that $T(\theta)$ means something. The damper's own angular momentum is small next to $H$. And the bearing carries no axial torque, which is what holds $h_Y$ fixed. All three hold for a well-designed vehicle, and all three can break. A damper tuned to resonate at the nutation frequency moves neither slightly nor slowly, and a stiff despin control loop applies exactly the axial torque the derivation leaves out. When margins are thin, the energy-sink criterion tells you which way to look; a full multi-body simulation tells you whether you are safe.
:::

The stability argument was worked out in the mid-1960s by **[[Anthony Iorillo|iorillo-history]]** at Hughes Aircraft. The dual-spin design has since largely given way to three-axis control with reaction wheels, the subject of the next lesson, but the argument remains one of the cleanest uses of energy methods in the field.

## Check yourself

::: check
A gyrostat has $I_t = 1000$, $I_{Pa} = 200$ and $I_{Ra} = 300\,\mathrm{kg\,m^2}$, and $H = 2000\,\mathrm{N\,m\,s}$ with a fully despun platform. Is a platform damper stabilizing? Is a rotor damper? Give the time constants for $k = 10\,\mathrm{N\,m\,s}$.
:::

::: answer
**Platform damper.** The platform carries $h_P = 0$, so $\mu_P = 0$, below the limit $I_{Pa}/I_t = 200/1000 = 0.200$. It is stabilizing, with

$$
\tau = \frac{1}{10\times(0 - 1/1000)} = \frac{1}{-0.01} = -100\,\mathrm{s},
$$

a decay.

**Rotor damper.** The rotor carries everything, $\mu_R = 1$, against a limit $I_{Ra}/I_t = 0.300$. It is destabilizing:

$$
\tau = \frac{1}{10\times(1/300 - 1/1000)} = \frac{1}{10\times 0.002333} = +42.9\,\mathrm{s},
$$

a growth. Notice the vehicle is prolate — $I_a = 500 < I_t = 1000$ — and it is stable anyway, provided the loss is on the right side.
:::

::: check
The same vehicle is run with its platform spun up so that it carries $h_P = 400\,\mathrm{N\,m\,s}$. What happens to the platform damper?
:::

::: answer
Now $\mu_P = 400/2000 = 0.200$, exactly equal to $I_{Pa}/I_t = 200/1000 = 0.200$. The vehicle sits on the stability boundary: $D_0 = H/I_t - h_P/I_{Pa} = 2000/1000 - 400/200 = 2.0 - 2.0 = 0$. The time constant is infinite, and to this order the platform damper neither removes nutation nor adds it. Any further spin-up of the platform makes it destabilizing. The practical lesson: the margin in a dual-spin design is a *momentum* margin, and it shrinks as soon as the platform is allowed to rotate.
:::

::: check
Why does the gyrostat nutation frequency $|\sigma|/I_t$ reduce to $H/I_t$ for a despun platform, and what does a star tracker or a rate gyro on the platform actually see at that frequency?
:::

::: answer
With the platform despun, $n = \omega_3 = 0$, so $\sigma = (I_a - I_t)\times 0 + h_s = h_s$. The rotor then carries all the momentum, so $h_s = H$ and $|\sigma|/I_t = H/I_t$.

That is exactly lesson 9's inertial precession rate $\dot{\psi}$, and it is no coincidence. In the nominal state the platform frame does not turn, so its "body-frame" nutation rate and the rate seen from the stars are the same number.

A star tracker on the platform sees the whole platform coning about $\mathbf{H}$ at that rate, with angle $\theta$. A rate gyro sees two sideways rates of size $H\sin\theta/I_t$, a quarter-cycle apart, at the same frequency. For the bus in the examples that is a $2.0\,\mathrm{s}$ period — slow enough that a pointing controller sees it as a pointing error to correct, not as fast noise to ignore.
:::

::: check
Show that the dual-spin criterion reduces to the major-axis rule when the rotor is locked to the platform.
:::

::: answer
Locked means both bodies turn at the same $\omega_3$. So $h_X = I_{Xa}\omega_3$, and for a small wobble $H \approx I_a\omega_3$. Dividing, $\mu_X = I_{Xa}/I_a$ for either body.

The criterion $\mu_X < I_{Xa}/I_t$ becomes $I_{Xa}/I_a < I_{Xa}/I_t$. Cancel the positive $I_{Xa}$ to get $1/I_a < 1/I_t$, that is $I_a > I_t$: the vehicle must spin about its axis of largest inertia. The condition no longer mentions which body carries the damper, exactly as it should for a single rigid body. It is lesson 8's rule.
:::

::: check
A designer proposes to meet the criterion by making the rotor's axial inertia larger than the total transverse inertia, $I_{Ra} > I_t$, so that a damper anywhere is safe. What does that imply about the vehicle, and why is it usually not done?
:::

::: answer
It implies $I_a = I_{Pa} + I_{Ra} > I_{Ra} > I_t$. So the vehicle is oblate overall and would be stable as a plain rigid spinner in the first place — the dual-spin argument buys nothing.

An oblate vehicle is short and wide: its diameter must be more than roughly its length. Inside a given nose cone that means a short stack, little room for tanks and antennas along the axis, and wasted space. The whole point of dual-spin is to let a vehicle be tall and thin and still hold its attitude. A design that gets stability by going oblate has given away the reason to be dual-spin. It may still be chosen for the pointing, but damper placement no longer drives the design.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Dual-spin (gyrostat) | Rotor plus despun platform on one axis; rotor gives stiffness, platform points |
| $h_s = I_{Ra}\Omega$ | Momentum stored by the rotor's relative spin $\Omega$ |
| $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3$ | Total angular momentum in platform components |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{h}_s\hat{\mathbf{b}}_3 + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + h_s\hat{\mathbf{b}}_3) = \mathbf{M}$ | Gyrostat equations of motion |
| $\sigma = (I_a - I_t)n + h_s$ | Nutation frequency is $\lvert\sigma\rvert/I_t$; a rigid round gyrostat always oscillates |
| $\mu_X = h_X/H$ | Momentum fraction carried by body $X$; despun platform has $\mu_P = 0$ |
| $\mu_X < I_{Xa}/I_t$ | Iorillo criterion: a damper on body $X$ removes nutation |
| $\tau = 1/[k(\mu_X/I_{Xa} - 1/I_t)]$ | Nutation time constant, $\dot{\theta} = \theta/\tau$: negative decays, positive grows |
| Locked limit $\mu_X = I_{Xa}/I_a$ | Criterion reduces to $I_a > I_t$, the major-axis rule of lesson 8 |
| Example bus $I_t = 800$, $I_{Pa} = 150$, $I_{Ra} = 400$ | Prolate; platform damper $\tau = -40\,\mathrm{s}$ (decay), rotor damper $\tau = +40\,\mathrm{s}$ (growth) |

A dual-spin vehicle stores its momentum in a dedicated spinning part and points with the rest. Shrink the rotor to a small flywheel, let a computer command its speed, and add two more on the other axes, and the same momentum bookkeeping becomes reaction wheel control. That, together with control moment gyros and the awkward geometry they bring, is the next lesson.

::: context dual-spin-layout What a dual-spin vehicle looks like
The heavy drum at the bottom spins, often covered in solar cells so every side takes a turn in the Sun. On top, a bearing with a motor inside holds the platform still, so its antenna stays aimed at Earth. The angular momentum $\mathbf{H}$ points along the shared axle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="30" x2="180" y2="196" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="56" x2="180" y2="18" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="180,8 174,20 186,20" fill="#1d6fd1"/>
  <text x="190" y="20" font-size="13" fill="#1d6fd1" font-weight="700">H</text>
  <rect x="150" y="58" width="60" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 214 56 Q 240 71 214 86 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="71" x2="222" y2="71" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="165" y="84" width="30" height="8" fill="#1f2a44"/>
  <rect x="120" y="92" width="120" height="88" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 134 146 Q 180 170 222 148" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="228,144 216,145 222,154" fill="#b4232c"/>
  <text x="20" y="75" font-size="12" fill="#1f2a44">platform: still</text>
  <text x="20" y="140" font-size="12" fill="#1f2a44">rotor: spins</text>
  <text x="248" y="68" font-size="12" fill="#1f2a44">antenna</text>
  <text x="248" y="100" font-size="12" fill="#1f2a44">bearing + motor</text>
</svg>
```
:::

::: context gyrostat-word A word from Lord Kelvin
"Gyrostat" was coined in the 1870s by William Thomson, later Lord Kelvin, for a toy-like demonstration: a fast flywheel sealed inside a case. The case could be set on its edge and balanced in ways a still object never could, because the hidden wheel's angular momentum resisted every tip. Engineers kept the word for any body with a spinning wheel inside it — which is exactly what a dual-spin spacecraft is, and, with smaller wheels, what almost every modern satellite is.
:::

::: context geo-comsats Why a TV satellite needs a still antenna
A geostationary satellite sits about $35\,786\,\mathrm{km}$ above the equator and goes round once a day, so it seems to hang over one spot. To be useful, its dish must keep pointing at that one patch of Earth. Early satellites such as Syncom only spun, with antennas that beamed in all directions and wasted most of the power into space. Putting the antenna on a despun platform let the whole beam land on the service area. Hughes built whole families this way; the Intelsat IV satellites of the early 1970s carried transoceanic phone calls from a spinning drum with a despun antenna farm on top.
:::

::: context energy-landscape A ball in a landscape of energy
Picture the energy $T$ as the height of a landscape and the nutation angle $\theta$ as where a ball sits. A damper only ever lowers the ball. Left: the damper on a despun platform makes $\theta = 0$ the bottom of a valley, so the ball settles there. Right: the damper on the rotor makes $\theta = 0$ a hilltop, so any nudge rolls it away toward a flat spin. The curves are drawn to scale for this lesson's bus, each panel with its own height scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="160" x2="165" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="210" y1="160" x2="345" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30.0,150.0 44.4,149.5 58.9,147.8 73.3,144.5 87.8,138.9 102.2,130.0 116.7,117.1 131.1,99.6 145.6,77.2 160.0,50.0" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <polyline points="210.0,40.0 224.4,43.0 238.9,51.7 253.3,65.0 267.8,81.3 282.2,98.7 296.7,115.0 311.1,128.3 325.6,137.0 340.0,140.0" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="32" cy="141" r="8" fill="#1d6fd1"/>
  <circle cx="224" cy="34" r="8" fill="#b4232c"/>
  <path d="M 236 30 L 258 46" stroke="#b4232c" stroke-width="2"/>
  <polygon points="262,50 250,47 256,40" fill="#b4232c"/>
  <text x="30" y="176" font-size="11" fill="#1f2a44">0°</text>
  <text x="152" y="176" font-size="11" fill="#1f2a44">90°</text>
  <text x="210" y="176" font-size="11" fill="#1f2a44">0°</text>
  <text x="332" y="176" font-size="11" fill="#1f2a44">90°</text>
  <text x="97" y="194" font-size="12" text-anchor="middle" fill="#1d6fd1">platform damper: valley</text>
  <text x="277" y="194" font-size="12" text-anchor="middle" fill="#b4232c">rotor damper: hilltop</text>
  <text x="60" y="30" font-size="12" fill="#1f2a44">energy T</text>
  <text x="270" y="30" font-size="12" fill="#1f2a44">energy T</text>
</svg>
```
:::

::: context prolate-oblate Pencils and coins
A **prolate** body is stretched along its spin axis, like a pencil or a tall can: its axial inertia is smaller than its transverse inertia. An **oblate** body is squashed along the axis, like a coin or a tuna can: axial inertia is larger. For a solid cylinder the crossover comes when the length is $\sqrt{3} \approx 1.73$ times the radius. A rocket's nose cone is tall and narrow, so the satellites that fit best are prolate — the very shape lesson 8 says cannot spin stably on its own.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M 50 170 L 50 70 Q 50 20 90 12 Q 130 20 130 70 L 130 170" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <rect x="68" y="44" width="44" height="120" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="30" x2="90" y2="178" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <rect x="200" y="110" width="130" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="265" y1="92" x2="265" y2="158" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="140" y="60" font-size="12" fill="#1f2a44">prolate</text>
  <text x="140" y="76" font-size="11" fill="#1f2a44">axial I &lt; transverse I</text>
  <text x="200" y="172" font-size="12" fill="#1f2a44">oblate</text>
  <text x="200" y="186" font-size="11" fill="#1f2a44">axial I &gt; transverse I</text>
  <text x="20" y="186" font-size="11" fill="#6c7a93">nose cone</text>
  <text x="250" y="24" font-size="11" fill="#6c7a93">spin axes dashed</text>
</svg>
```
:::

::: context nutation-damper A tube of honey that stops a wobble
A common nutation damper is a closed tube or ring, partly filled with a thick liquid such as silicone oil or mercury, mounted off the spin axis. When the vehicle wobbles, the liquid is pushed back and forth once per nutation cycle. Friction in the liquid turns that motion into a little heat. Tuning the tube's size so the liquid sloshes most readily at the nutation frequency makes it remove energy fastest — as long as it sits on the body where losing energy helps.
:::

::: context slip-rings Wires across a spinning joint
You cannot run ordinary wires between two parts that turn relative to each other forever — they would twist and snap. A **slip ring** solves this: a metal ring on one part, with a springy brush on the other part rubbing against it. Current flows through the sliding contact. A stack of rings carries power from the solar cells on the rotor to the platform, and signals the other way. Wind turbines and radar dishes use the same trick.
:::

::: context iorillo-history From a Hughes notebook to orbit
Anthony Iorillo, at Hughes Aircraft, showed in the mid-1960s that damping placed on a despun section can stabilize a vehicle that breaks the major-axis rule. Peter Likins and others soon put the energy-sink argument on firmer ground. TACSAT 1, a military communications satellite launched in 1969, was the first large vehicle built on the result, and the Intelsat IV series followed. Galileo, launched in 1989, carried the design all the way to Jupiter.
:::
