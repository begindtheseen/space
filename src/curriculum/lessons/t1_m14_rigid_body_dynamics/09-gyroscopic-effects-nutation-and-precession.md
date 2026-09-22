---
id: l09-gyroscopic-effects-nutation-and-precession
title: Gyroscopic effects, nutation and precession
minutes: 21
covers:
  - gyroscopic effects, nutation, precession
---

Push sideways on the axle of a spinning bicycle wheel and it does not move the way you pushed. It swings at right angles, and it keeps swinging only as long as you keep pushing. That single fact — the response of a spinning body is perpendicular to the torque and proportional to it, rather than being an acceleration along it — is the whole of gyroscopics, and it is why spin is used for stability at all.

A GNC engineer meets it in three guises. A spin-stabilised vehicle uses its own angular momentum as a pointing reference, and the question is how far a disturbance torque walks that reference over a mission. A momentum wheel or a control moment gyro stores angular momentum inside an otherwise ordinary spacecraft, and the same perpendicular response shows up as a cross-coupling torque whenever the vehicle rotates. And any body whose angular velocity is not along a principal axis wobbles, even with no torque at all — the motion lessons 4 and 6 called nutation, whose rate this lesson finally computes.

Those three are easy to run together, so keep them apart from the start. **Nutation** is torque-free and needs no cause: it is what a body does when $\boldsymbol{\omega}$ is not aligned with $\mathbf{H}$. **Forced precession** is a response to an applied torque and stops when the torque stops. **Gyroscopic coupling** is the $\boldsymbol{\omega}\times\mathbf{H}$ term that appears whenever you write momentum balance in a rotating frame. All three come from the same equation, $\dot{\mathbf{H}} = \mathbf{M}$, read in different circumstances.

## Why a spinning body resists

Start from the inertial statement, the whole of rotational dynamics in four symbols:

$$
\frac{d\mathbf{H}}{dt}\bigg|_N = \mathbf{M} .
$$

Suppose the body carries a large angular momentum along a unit vector $\hat{\mathbf{s}}$, so $\mathbf{H} = H\hat{\mathbf{s}}$, and apply a torque $\mathbf{M}$ perpendicular to $\hat{\mathbf{s}}$. Because $\mathbf{M}\cdot\mathbf{H} = 0$ the magnitude $H$ does not change, and the equation becomes a statement about the direction alone:

$$
\dot{\hat{\mathbf{s}}} = \frac{\mathbf{M}}{H} .
$$

The axis moves *in the direction of the torque vector*, at a rate inversely proportional to the stored momentum. Two things follow, and both are counter-intuitive until you have used them.

First, the motion is perpendicular to the push. The torque from a force $\mathbf{F}$ applied at $\mathbf{r}$ is $\mathbf{r}\times\mathbf{F}$, which is at right angles to $\mathbf{F}$; so pushing the axis one way moves it ninety degrees around. Second, a torque produces a *rate*, not an acceleration. Remove the torque and the axis stops immediately, where a non-spinning body would keep turning at whatever rate it had reached. A spinning body behaves, against transverse torques, like a mass in honey rather than a mass in vacuum.

::: key Gyroscopic stiffness
A body with angular momentum $\mathbf{H} = H\hat{\mathbf{s}}$ under a transverse torque $\mathbf{M}$ moves its axis at $\dot{\hat{\mathbf{s}}} = \mathbf{M}/H$: perpendicular to the applied torque, proportional to it, and inversely proportional to the stored momentum. The total angular displacement of the axis after time $t$ is $Mt/H$ for constant $\mathbf{M}$, not $\tfrac{1}{2}(M/I)t^2$.
:::

Spinning a vehicle therefore converts an unbounded quadratic drift into a bounded linear one, and doubling the spin halves the drift. This is the entire engineering case for spin stabilisation, and it is why an upper stage is spun up before a long coast and why a simple planetary probe can hold its antenna on Earth for months with no active control at all.

::: example Gyroscopic stiffness against solar radiation pressure
A drum-shaped spin-stabilised satellite has $I_3 = 800\,\mathrm{kg\,m^2}$ about its spin axis and $I_t = 500\,\mathrm{kg\,m^2}$ transverse, and spins at $60\,\mathrm{rpm}$, so $n = 6.283\,\mathrm{rad/s}$ and $H \approx I_3n = 5027\,\mathrm{N\,m\,s}$. Solar radiation pressure on an asymmetric dish gives it a steady transverse torque of $2\times 10^{-5}\,\mathrm{N\,m}$.

Spinning, the axis walks at $M/H = 2\times 10^{-5}/5027 = 3.98\times 10^{-9}\,\mathrm{rad/s}$, which is $0.0197^\circ$ per day, or $7.2^\circ$ per year. It takes $51$ days to drift one degree, so a station-keeping manoeuvre every few weeks holds the pointing indefinitely.

Not spinning, the same torque gives $\alpha = M/I_t = 4.0\times 10^{-8}\,\mathrm{rad/s^2}$. After one day the vehicle has turned $\tfrac{1}{2}\alpha t^2 = 0.5\times 4.0\times 10^{-8}\times 86400^2 = 149\,\mathrm{rad}$ — almost 24 full revolutions — and is rotating at $3.5\times 10^{-3}\,\mathrm{rad/s}$. That is the difference the spin makes: $0.02^\circ$ a day against 24 revolutions a day, from the same micronewton-metre torque.

Integrating the full equations confirms the linear law. With the same body spun at $6.283\,\mathrm{rad/s}$ and a constant inertial torque of $0.5\,\mathrm{N\,m}$ applied perpendicular to $\mathbf{H}$, after $60\,\mathrm{s}$ both $\mathbf{H}$ and the spin axis have tilted by $0.34195^\circ$ against a prediction $Mt/H = 0.34196^\circ$, and the inertial angular momentum has gained exactly $Mt = 30\,\mathrm{N\,m\,s}$ in the direction of the torque. The transverse body rates never exceed $10^{-6}\,\mathrm{rad/s}$: the axis tracks $\mathbf{H}$ without nutating.
:::

## Steady precession and the relation M = Ω × H

Now run the argument backwards. Suppose you want the momentum vector to sweep steadily about some fixed direction — a spinning top's axis circling the vertical, a spin-stabilised probe whose antenna must follow the Earth around the Sun. If $\mathbf{H}$ rotates rigidly at angular velocity $\boldsymbol{\Omega}$, then its inertial derivative is $\boldsymbol{\Omega}\times\mathbf{H}$, so the torque required is

$$
\mathbf{M} = \boldsymbol{\Omega}\times\mathbf{H} .
$$

That is the working formula for all steady gyroscopic motion. Read left to right it gives the torque needed to force a precession $\boldsymbol{\Omega}$; read right to left, with $\mathbf{M}$ known and $\mathbf{H}$ nearly along the spin axis, it gives

$$
\Omega = \frac{M}{H\sin\alpha},
$$

where $\alpha$ is the angle between the precession axis and $\mathbf{H}$. For a top of mass $m$ whose centre of mass is a distance $l$ from the pivot, leaning at $\alpha$ from the vertical, gravity supplies $M = mgl\sin\alpha$ about a horizontal axis, and the $\sin\alpha$ cancels: the top precesses about the vertical at $\Omega = mgl/H$, independent of its lean. Spin it faster and it precesses more slowly.

::: warning The gyroscopic approximation, and when it breaks
$\mathbf{M} = \boldsymbol{\Omega}\times\mathbf{H}$ is exact only if $\mathbf{H}$ really is the total angular momentum, including the contribution of the precession itself: for an axisymmetric body precessing at $\Omega$ about an axis at $\alpha$ to the spin axis, $\mathbf{H} = I_3\omega_3\hat{\mathbf{b}}_3 + I_t\boldsymbol{\Omega}_\perp$. The familiar $\Omega = M/(H\sin\alpha)$ drops the second term, which is legitimate when the spin dominates, $I_3\omega_3 \gg I_t\Omega$. A slowly spun top does not obey it — it nutates visibly instead — and neither does a spacecraft whose "spin" is only a few times its slew rate.
:::

## Nutation seen from both frames

Torque-free motion needs no external agent to wobble. Lesson 6 solved the axisymmetric case in the body frame: with $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$, the axial rate $\omega_3 = n$ is constant, the transverse rate has constant magnitude $\omega_t$ and rotates about the symmetry axis at

$$
\lambda = n\,\frac{I_3 - I_t}{I_t},
$$

and $\boldsymbol{\omega}$ sweeps the body cone of half-angle $\gamma = \arctan(\omega_t/n)$ about $\hat{\mathbf{b}}_3$. That is what a rate gyro strapped to the vehicle measures: two transverse channels in quadrature at the frequency $|\lambda|$, and a steady third channel.

The inertial picture is different and is what a star tracker sees. Put the inertial $Z$ axis along the fixed $\mathbf{H}$ and describe the attitude with a 3-1-3 Euler sequence: a rotation $\psi$ about $Z$, then $\theta$ about the intermediate $x$ axis, then $\phi$ about the body 3 axis. The body components of the angular velocity are then

$$
\begin{aligned}
\omega_1 &= \dot{\psi}\sin\theta\sin\phi + \dot{\theta}\cos\phi, \\
\omega_2 &= \dot{\psi}\sin\theta\cos\phi - \dot{\theta}\sin\phi, \\
\omega_3 &= \dot{\psi}\cos\theta + \dot{\phi},
\end{aligned}
$$

and, because $\mathbf{H}$ points along $Z$ by construction, its body components are

$$
H_1 = H\sin\theta\sin\phi, \qquad H_2 = H\sin\theta\cos\phi, \qquad H_3 = H\cos\theta .
$$

Now impose $H_1 = I_t\omega_1$ and $H_3 = I_3\omega_3$. Lesson 6 showed $\theta$ is constant, so $\dot{\theta} = 0$, and the first pair gives

$$
I_t\,\dot{\psi}\sin\theta\sin\phi = H\sin\theta\sin\phi
\qquad\Longrightarrow\qquad
\boxed{\ \dot{\psi} = \frac{H}{I_t}\ }
$$

The symmetry axis sweeps a cone about the fixed $\mathbf{H}$ at the constant rate $H/I_t$. This is the **inertial precession rate**, promised in lesson 6 and now derived. Note what it does not contain: no reference to how big the wobble is, and no $I_3$ except through $H$ itself.

The third equation then gives the remaining rate:

$$
\dot{\phi} = \omega_3 - \dot{\psi}\cos\theta = \frac{H\cos\theta}{I_3} - \frac{H\cos\theta}{I_t}
= n\,\frac{I_t - I_3}{I_t} = -\lambda .
$$

So the body spins about its own symmetry axis, *relative to the precessing frame*, at exactly minus the body-frame precession rate. The three rates are one motion described three ways: $\dot{\psi}$ is how fast the axis goes round $\mathbf{H}$ in space, $\dot{\phi}$ is how fast the body turns inside that coning motion, and $\lambda$ is what the vehicle's own gyros report.

::: key Nutation
Nutation is the coning of the angular velocity vector, and of the body's symmetry axis, about the fixed angular momentum vector $\mathbf{H}$, and occurs whenever $\boldsymbol{\omega}$ is not aligned with a principal axis. For an axisymmetric body the nutation angle $\theta$ between the symmetry axis and $\mathbf{H}$ is constant, the axis precesses about $\mathbf{H}$ at $\dot{\psi} = H/I_t$, the body-frame rate is $\lambda = n(I_3 - I_t)/I_t$, and the body cone rolls without slipping on the space cone.
:::

The cone geometry follows from the same components. Dividing $H_t = I_t\omega_t$ by $H_3 = I_3 n$,

$$
\tan\theta = \frac{I_t}{I_3}\tan\gamma ,
$$

so an oblate body ($I_3 > I_t$) has $\theta < \gamma$ and a prolate body ($I_3 < I_t$) has $\theta > \gamma$, which is the sign rule of lesson 6 in one line. The space cone, swept by $\boldsymbol{\omega}$ about $\mathbf{H}$, has half-angle $\beta = |\theta - \gamma|$.

::: example The prolate upper stage seen from inertial space
The spin-stabilised stage of lessons 6 and 8 — $I_3 = 1000$, $I_t = 2000\,\mathrm{kg\,m^2}$, spinning at $60\,\mathrm{rpm}$ with a tip-off transverse rate $\omega_t = 0.10\,\mathrm{rad/s}$ — has $H = 6286.4\,\mathrm{N\,m\,s}$, nutation angle $\theta = 1.823^\circ$ and body-cone angle $\gamma = 0.912^\circ$.

The inertial precession rate is $\dot{\psi} = H/I_t = 6286.4/2000 = 3.1432\,\mathrm{rad/s}$, a period of $1.999\,\mathrm{s}$. The spin relative to that precessing frame is $\dot{\phi} = n(I_t - I_3)/I_t = 6.2832\times 0.5 = 3.1416\,\mathrm{rad/s}$, and the check $\dot{\psi}\cos\theta + \dot{\phi} = 3.1416 + 3.1416 = 6.2832\,\mathrm{rad/s}$ recovers $n$ exactly. The body-frame rate is $\lambda = -3.1416\,\mathrm{rad/s}$, retrograde, period $2.000\,\mathrm{s}$.

Integrating Euler's equations together with the attitude matrix confirms it. Over a four-second run the body 3 axis goes round $\mathbf{H}$ at a measured $3.14318\,\mathrm{rad/s}$ against the predicted $3.14318$; the inertial $\mathbf{H}$ holds at $(200.0, 0.0, 6283.2)\,\mathrm{N\,m\,s}$; and $\theta$ stays at $1.8232^\circ$ to four decimals.

The space cone half-angle is $\beta = |1.823 - 0.912| = 0.911^\circ$, and because the body is prolate the two cones touch externally, the body cone rolling around the outside of the space cone. What an observer on the ground sees is the stage's nose tracing a $1.8^\circ$ circle twice a second while the vehicle spins at once a second — a wobble at roughly twice the spin frequency, which is exactly the signature that makes nutation easy to spot in tracking data.
:::

::: example An oblate drum, and why the rates differ so much
Take the drum of the first example, $I_3 = 800$ and $I_t = 500\,\mathrm{kg\,m^2}$ at $60\,\mathrm{rpm}$, and give it a $1.0^\circ$ nutation angle. Then $H = I_3n/\cos\theta = 5027.3\,\mathrm{N\,m\,s}$, and

$$
\dot{\psi} = \frac{H}{I_t} = \frac{5027.3}{500} = 10.055\,\mathrm{rad/s},
$$

a precession period of $0.625\,\mathrm{s}$ — the axis goes round $\mathbf{H}$ 1.6 times for every turn of the body. The body-frame rate is $\lambda = n(I_3 - I_t)/I_t = 6.2832\times 300/500 = +3.770\,\mathrm{rad/s}$, prograde, period $1.667\,\mathrm{s}$; and $\dot{\phi} = -3.770\,\mathrm{rad/s}$, so the body turns backwards inside its own precession. The consistency check $\dot{\psi}\cos\theta + \dot{\phi} = 10.055\times 0.99985 - 3.770 = 6.283\,\mathrm{rad/s} = n$ holds.

The cone angles: $\gamma = \arctan[(I_3/I_t)\tan\theta] = \arctan(1.6\times 0.017455) = 1.600^\circ$, so $\theta = 1.0^\circ < \gamma$, as an oblate body requires, and $\beta = 0.600^\circ$. The transverse rate is $\omega_t = n\tan\gamma = 0.1755\,\mathrm{rad/s}$ — a rate gyro on the transverse axis would read $\pm 0.175\,\mathrm{rad/s}$ oscillating at $3.77\,\mathrm{rad/s}$, while a star tracker would report a $1^\circ$ cone at $10.06\,\mathrm{rad/s}$. Same motion, three different numbers, and quoting one to a colleague who assumes another is how nutation analyses go wrong.
:::

## Gyroscopic coupling inside the vehicle

The third guise is the one that shows up in control design. Lesson 5 wrote Euler's equations as $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \mathbf{M}$ and called the cross term gyroscopic. The same term appears, much larger, as soon as the vehicle carries a spinning rotor.

Let a wheel store momentum $\mathbf{h}$ in the body frame, so the total is $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \mathbf{h}$. Transporting to the body frame (lesson 5's transport step) gives

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}) = \mathbf{M}_{\mathrm{ext}} .
$$

The new piece is $\boldsymbol{\omega}\times\mathbf{h}$: a torque on the structure, perpendicular to both the body rate and the stored momentum, that appears whenever the vehicle rotates. It is the bicycle wheel again, now with the wheel bolted inside the spacecraft and the spacecraft doing the turning.

::: example The coupling torque from a momentum wheel
A spacecraft carries a wheel storing $\mathbf{h} = (30, 0, 0)\,\mathrm{N\,m\,s}$ along the body $x$ axis and is commanded to slew about $y$ at $\boldsymbol{\omega} = (0, 0.05, 0)\,\mathrm{rad/s}$. The coupling torque is

$$
\boldsymbol{\omega}\times\mathbf{h} = (0, 0.05, 0)\times(30, 0, 0) = (0, 0, -1.5)\,\mathrm{N\,m},
$$

$1.5\,\mathrm{N\,m}$ about $z$ — an axis nobody commanded. Compare that with the torque a small reaction wheel can produce, typically $0.01$ to $0.1\,\mathrm{N\,m}$: the coupling is one to two orders of magnitude larger than the authority available to fight it. A controller that does not feed this term forward will saturate its $z$ actuator during every $y$ slew, and the vehicle will corkscrew.

The remedy is not more authority but better bookkeeping: $\boldsymbol{\omega}$ and $\mathbf{h}$ are both measured quantities, so $\boldsymbol{\omega}\times\mathbf{h}$ is computed and cancelled by command. This is the same feed-forward argument lesson 5 made for $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$, and lesson 11 builds the wheel dynamics on it.
:::

::: note Why a fixed inertial torque does not excite nutation
In the first example a step torque was applied and the body precessed without wobbling, which seems to contradict the idea that any disturbance sets a spinning body nutating. Resolve it in the body frame: a torque that is constant in inertial space appears in the body frame as a vector rotating at the spin rate, so its effect on the transverse rates integrates to nearly zero over each revolution, leaving only the slow secular drift of $\mathbf{H}$. A torque that is constant in the *body* frame — a misaligned thruster, say — does not average away, and it drives the nutation angle up. Which frame a disturbance is fixed in matters more than how big it is.
:::

::: warning Three rates, three names, three instruments
This module uses $\dot{\psi} = H/I_t$ for the inertial precession of the symmetry axis about $\mathbf{H}$, $\lambda = n(I_3 - I_t)/I_t$ for the body-frame rate at which the transverse angular velocity circulates, and $\dot{\phi} = -\lambda$ for the spin of the body within the precessing frame. Other books call $\lambda$ the nutation frequency and reserve "precession" for $\dot{\psi}$; some call $\dot{\psi}$ the nutation rate. Before using a number from a reference, check which vector is rotating about which, and in which frame. A rate gyro sees $\lambda$; a star tracker sees $\dot{\psi}$; the two differ by a factor $I_3/I_t$ times a cosine and can easily disagree by two.
:::

## Check yourself

::: check
A spin-stabilised probe has $H = 400\,\mathrm{N\,m\,s}$ and suffers a constant transverse disturbance torque of $5\times 10^{-6}\,\mathrm{N\,m}$. How far does its spin axis drift in 180 days, and what spin momentum would hold it to $1^\circ$?
:::

::: answer
The drift rate is $M/H = 5\times 10^{-6}/400 = 1.25\times 10^{-8}\,\mathrm{rad/s}$. Over $180$ days, $t = 1.5552\times 10^7\,\mathrm{s}$, the axis moves $1.25\times 10^{-8}\times 1.5552\times 10^7 = 0.1944\,\mathrm{rad} = 11.1^\circ$. To hold $1^\circ = 0.01745\,\mathrm{rad}$ over the same time you need $H = Mt/\Delta = 5\times 10^{-6}\times 1.5552\times 10^7/0.01745 = 4.46\times 10^3\,\mathrm{N\,m\,s}$, eleven times more. Momentum, not torque authority, is the currency of passive pointing.
:::

::: check
An axisymmetric satellite has $I_3 = 1200$ and $I_t = 900\,\mathrm{kg\,m^2}$, spins at $n = 2.0\,\mathrm{rad/s}$, and carries a $3^\circ$ nutation angle. Find $H$, $\dot{\psi}$, $\lambda$ and $\dot{\phi}$, and check them against each other.
:::

::: answer
$H = I_3n/\cos\theta = 1200\times 2.0/\cos 3^\circ = 2400/0.998630 = 2403.3\,\mathrm{N\,m\,s}$. Then $\dot{\psi} = H/I_t = 2403.3/900 = 2.6704\,\mathrm{rad/s}$ (period $2.353\,\mathrm{s}$), $\lambda = n(I_3 - I_t)/I_t = 2.0\times 300/900 = 0.6667\,\mathrm{rad/s}$, and $\dot{\phi} = -\lambda = -0.6667\,\mathrm{rad/s}$. The check is the third kinematic equation: $\dot{\psi}\cos\theta + \dot{\phi} = 2.6704\times 0.998630 - 0.6667 = 2.6667 - 0.6667 = 2.000\,\mathrm{rad/s} = n$. The body is oblate, so $\lambda$ is prograde and the axis precesses faster than the body spins.
:::

::: check
You need a spinning upper stage, $H = 6000\,\mathrm{N\,m\,s}$, to reorient its spin axis by $30^\circ$ in ten minutes using a single thruster mounted to fire transversely. What average torque is needed, and what is wrong with a naive "torque equals inertia times angular acceleration" estimate?
:::

::: answer
Use $\dot{\hat{\mathbf{s}}} = M/H$. The required rate is $\Omega = 30^\circ/600\,\mathrm{s} = 0.5236\,\mathrm{rad}/600\,\mathrm{s} = 8.727\times 10^{-4}\,\mathrm{rad/s}$, so $M = H\Omega = 6000\times 8.727\times 10^{-4} = 5.24\,\mathrm{N\,m}$, held for the whole ten minutes and directed $90^\circ$ from the direction you want the axis to move. The naive estimate would use $M = I_t\ddot{\vartheta}$ with the transverse inertia and a slew profile, giving a number smaller by roughly $I_t\Omega/H$ — for $I_t = 2000\,\mathrm{kg\,m^2}$ that factor is $2000\times 8.727\times 10^{-4}/6000 = 2.9\times 10^{-4}$, so the naive answer is about three thousand times too small, and points the thruster ninety degrees away from where it belongs.
:::

::: check
Why is the nutation angle $\theta$ constant for a torque-free axisymmetric body, and what would have to be true for it to change?
:::

::: answer
$\cos\theta = H_3/H = I_3\omega_3/H$. In torque-free motion $H$ is constant because $\mathbf{H}$ is fixed in space, and $\omega_3$ is constant because the third Euler equation reads $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 = 0$ when $I_1 = I_2$. So $\cos\theta$ is a ratio of two constants. For $\theta$ to change, either an external torque must act — which alters $\mathbf{H}$ — or the body must not be rigid, so that energy can move at fixed $H$ and, as lesson 8 showed, drive $\theta$ toward $0$ or $90^\circ$ depending on whether the body is oblate or prolate. Constant $\theta$ is a statement about rigidity as much as about torque.
:::

::: check
A spacecraft carries two identical momentum wheels, one storing $+25\,\mathrm{N\,m\,s}$ along $+z$ and the other $-25\,\mathrm{N\,m\,s}$ along $+z$. What gyroscopic coupling torque appears during a slew of $0.02\,\mathrm{rad/s}$ about $x$, and what has been gained or lost compared with a single wheel storing $+25$?
:::

::: answer
The stored momenta cancel: $\mathbf{h} = (0, 0, 25) + (0, 0, -25) = \mathbf{0}$, so $\boldsymbol{\omega}\times\mathbf{h} = \mathbf{0}$ and there is no coupling torque at all. With a single wheel the coupling would be $(0.02, 0, 0)\times(0, 0, 25) = (0, 0.5, 0)$, that is $0.5\,\mathrm{N\,m}$ about $y$. What is gained is a vehicle that behaves like a plain rigid body during slews and that can still exert control torques by running the two wheels differentially. What is lost is the gyroscopic stiffness itself: a zero-momentum system has no passive pointing reference, so all attitude stability must now come from the control loop. This trade — momentum bias against zero momentum — is one of the first architectural choices in an attitude control design, and lesson 10 shows the intermediate option.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\dot{\hat{\mathbf{s}}} = \mathbf{M}/H$ | Gyroscopic stiffness: axis drifts perpendicular to the torque at $M/H$, linearly in time |
| $\mathbf{M} = \boldsymbol{\Omega}\times\mathbf{H}$ | Torque required for a steady precession $\boldsymbol{\Omega}$; gives $\Omega = M/(H\sin\alpha)$ |
| $\Omega = mgl/H$ | Precession rate of a fast top, independent of lean angle |
| $\theta$ | Nutation angle between the symmetry axis and $\mathbf{H}$; constant for a torque-free rigid body |
| $\dot{\psi} = H/I_t$ | Inertial precession rate of the symmetry axis about $\mathbf{H}$; what a star tracker sees |
| $\lambda = n(I_3 - I_t)/I_t$ | Body-frame rate of the transverse angular velocity; what a rate gyro sees |
| $\dot{\phi} = -\lambda$ | Spin of the body within the precessing frame; $\dot{\psi}\cos\theta + \dot{\phi} = n$ |
| $\tan\theta = (I_t/I_3)\tan\gamma$, $\beta = \lvert\theta - \gamma\rvert$ | Nutation, body-cone and space-cone angles |
| $\boldsymbol{\omega}\times\mathbf{h}$ | Gyroscopic coupling torque from stored wheel momentum $\mathbf{h}$ |
| Drum at 60 rpm, $I_3 = 800$, $I_t = 500$ | $H = 5027\,\mathrm{N\,m\,s}$; $\dot{\psi} = 10.06$, $\lambda = 3.77\,\mathrm{rad/s}$; $7.2^\circ$/yr under $2\times 10^{-5}\,\mathrm{N\,m}$ |

Gyroscopic stiffness is free pointing, and its price is that the vehicle spins, so nothing mounted on it can stare at anything. The next lesson buys back the pointing without giving up the momentum: a rotor spins while a platform does not, and the resulting dual-spin configuration turns out to change the stability rules of lesson 8 as well.
