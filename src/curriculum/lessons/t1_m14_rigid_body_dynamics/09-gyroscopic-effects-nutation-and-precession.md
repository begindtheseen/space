---
id: l09-gyroscopic-effects-nutation-and-precession
title: Gyroscopic effects, nutation and precession
minutes: 25
covers:
  - gyroscopic effects, nutation, precession
---

Hold a [[bicycle wheel by its axle|bicycle-wheel]], get someone to spin it fast, and try to tilt it. It does not tilt the way you pushed. It swings sideways, at right angles to your push — and it keeps swinging only as long as you keep pushing. Stop pushing and it stops moving. That one fact is the whole of **gyroscopics**, the behavior of spinning things. The response of a spinning body is at right angles to the torque and proportional to it, instead of being a speeding-up along it. It is also the reason spin is used to hold spacecraft steady at all.

A GNC engineer meets it in three forms. First, a spinning vehicle uses its own angular momentum as a pointing reference, and the question is how far a small disturbing torque walks that reference over a mission. Second, a momentum wheel or a control moment gyro stores angular momentum inside an otherwise ordinary spacecraft, and the same sideways response appears as a cross-coupling torque whenever the vehicle turns. Third, any body whose spin is not along a principal axis wobbles, even with no torque at all. Lessons 4 and 6 called that wobble nutation, and this lesson finally works out its rate.

These three are easy to mix up, so keep them apart from the start:

- **Nutation** needs no torque and no cause. It is what a body does when $\boldsymbol{\omega}$ is not lined up with $\mathbf{H}$.
- **Forced precession** is a response to an applied torque, and it stops when the torque stops.
- **Gyroscopic coupling** is the $\boldsymbol{\omega}\times\mathbf{H}$ term that appears whenever you write the momentum balance in a turning frame.

All three come from the same equation, $\dot{\mathbf{H}} = \mathbf{M}$, read in different situations.

## Why a spinning body resists

Start from the inertial law — the whole of rotational dynamics in four symbols:

$$
\frac{d\mathbf{H}}{dt}\bigg|_N = \mathbf{M} .
$$

It says: torque is the rate of change of angular momentum, measured in the inertial frame $N$.

Suppose the body carries a large angular momentum along a unit vector $\hat{\mathbf{s}}$ ("s hat", the spin axis), so $\mathbf{H} = H\hat{\mathbf{s}}$. Apply a torque $\mathbf{M}$ at right angles to $\hat{\mathbf{s}}$. Because $\mathbf{M}\cdot\mathbf{H} = 0$, the torque adds nothing along $\mathbf{H}$, so the size $H$ does not change. All the torque can do is turn the direction:

$$
\dot{\hat{\mathbf{s}}} = \frac{\mathbf{M}}{H} .
$$

In words: the axis moves *in the direction of the torque vector*, at a rate equal to the torque divided by the stored angular momentum. Two things follow, and both feel wrong until you have used them.

**The motion is at right angles to the push.** The torque from a force $\mathbf{F}$ applied at position $\mathbf{r}$ is $\mathbf{r}\times\mathbf{F}$, which is at right angles to $\mathbf{F}$. So pushing the axis one way moves it a quarter turn around from where you pushed.

**A torque makes a rate, not an acceleration.** Take the torque away and the axis stops at once. A body that is not spinning would keep turning at whatever rate it had built up. Against sideways torques, a spinning body behaves like a [[ball in honey|honey]] rather than a ball floating in space.

::: key Gyroscopic stiffness
A body with angular momentum $\mathbf{H} = H\hat{\mathbf{s}}$ under a transverse torque $\mathbf{M}$ moves its axis at $\dot{\hat{\mathbf{s}}} = \mathbf{M}/H$: perpendicular to the applied force, along the torque vector, proportional to the torque, and inversely proportional to the stored momentum. The total angular displacement of the axis after time $t$ is $Mt/H$ for constant $\mathbf{M}$, not $\tfrac{1}{2}(M/I)t^2$.
:::

So spinning a vehicle turns a drift that grows with the *square* of time into one that grows only in *proportion* to time. And doubling the spin halves the drift. That is the whole engineering case for spin stabilization. It is why an upper stage is spun up before a long coast, and why a simple [[planetary probe|pioneer]] can keep its antenna on Earth for months with no active control at all.

::: example Gyroscopic stiffness against sunlight
A drum-shaped spinning satellite has $I_3 = 800\,\mathrm{kg\,m^2}$ about its spin axis and $I_t = 500\,\mathrm{kg\,m^2}$ across it. It spins at $60\,\mathrm{rpm}$, so $n = 2\pi\,\mathrm{rad/s} = 6.283\,\mathrm{rad/s}$, and $H \approx I_3 n = 800\times 6.283 = 5027\,\mathrm{N\,m\,s}$. Sunlight pressing on a lopsided dish — **[[solar radiation pressure|solar-pressure]]** — gives it a steady sideways torque of $2\times 10^{-5}\,\mathrm{N\,m}$.

**Spinning.** The axis walks at

$$
\frac{M}{H} = \frac{2\times 10^{-5}}{5027} = 3.98\times 10^{-9}\,\mathrm{rad/s}.
$$

Multiply by the $86{,}400$ seconds in a day and turn radians into degrees: that is $0.0197^\circ$ per day, or $7.2^\circ$ per year. It takes $51$ days to drift one degree, so a small correction every few weeks holds the pointing indefinitely.

**Not spinning.** The same torque now gives an angular acceleration $\alpha = M/I_t = 2\times 10^{-5}/500 = 4.0\times 10^{-8}\,\mathrm{rad/s^2}$. After one day the vehicle has turned

$$
\tfrac{1}{2}\alpha t^2 = 0.5\times 4.0\times 10^{-8}\times 86{,}400^2 = 149\,\mathrm{rad},
$$

which is $149/(2\pi) = 24$ full turns, and it is now rotating at $\alpha t = 3.5\times 10^{-3}\,\mathrm{rad/s}$. That is the difference the spin makes: $0.02^\circ$ a day against 24 turns a day, from the same tiny torque.

**Check with a full simulation.** Integrating the full equations confirms the straight-line law. With the same body spun at $6.283\,\mathrm{rad/s}$ and a larger, constant inertial torque of $0.5\,\mathrm{N\,m}$ applied at right angles to $\mathbf{H}$, after $60\,\mathrm{s}$ both $\mathbf{H}$ and the spin axis have tilted by $0.34195^\circ$. The prediction is $Mt/H = 0.5\times 60/5027 = 0.005968\,\mathrm{rad} = 0.34196^\circ$. The angular momentum has gained exactly $Mt = 30\,\mathrm{N\,m\,s}$ in the direction of the torque. And the sideways body rates never exceed $10^{-6}\,\mathrm{rad/s}$: the axis follows $\mathbf{H}$ without nutating.
:::

## Steady precession and the relation M = Ω × H

Now turn the question around. Suppose you *want* the angular momentum to sweep steadily around some fixed direction — a [[spinning top's|top]] axis circling the vertical, or a spinning probe whose antenna must follow Earth around the Sun. If $\mathbf{H}$ turns rigidly at angular velocity $\boldsymbol{\Omega}$ ("capital omega"), its inertial rate of change is $\boldsymbol{\Omega}\times\mathbf{H}$ — the rule for any vector carried around by a rotation. So the torque needed is

$$
\mathbf{M} = \boldsymbol{\Omega}\times\mathbf{H} .
$$

That is the working formula for all steady gyroscopic motion. Read it one way and it gives the torque needed to force a precession $\boldsymbol{\Omega}$. Read it the other way, with $\mathbf{M}$ known and $\mathbf{H}$ nearly along the spin axis, and take sizes: the size of a cross product is the product of the sizes times the sine of the angle between them. So

$$
\Omega = \frac{M}{H\sin\alpha},
$$

where $\alpha$ ("alpha") is the angle between the precession axis and $\mathbf{H}$.

**The top.** Take a top of mass $m$ whose center of mass is a distance $l$ from its point, leaning at $\alpha$ from the vertical. Gravity pulls down with force $mg$ at the center of mass. The lever arm about the point is $l\sin\alpha$, so gravity's torque is $M = mgl\sin\alpha$, about a horizontal axis. Put that in, and the $\sin\alpha$ cancels:

$$
\Omega = \frac{mgl\sin\alpha}{H\sin\alpha} = \frac{mgl}{H}.
$$

The top circles the vertical at a rate that does not depend on its lean. And spin it faster — bigger $H$ — and it circles more slowly.

::: warning The gyroscopic approximation, and when it breaks
$\mathbf{M} = \boldsymbol{\Omega}\times\mathbf{H}$ is exact only if $\mathbf{H}$ really is the *total* angular momentum, including the part from the precession itself. For an axisymmetric body precessing at $\Omega$ about an axis at $\alpha$ to its spin axis, $\mathbf{H} = I_3\omega_3\hat{\mathbf{b}}_3 + I_t\boldsymbol{\Omega}_\perp$, where $\hat{\mathbf{b}}_3$ is the body's symmetry axis and $\boldsymbol{\Omega}_\perp$ is the part of $\boldsymbol{\Omega}$ across it. The familiar $\Omega = M/(H\sin\alpha)$ drops the second term. That is fair when the spin dominates, $I_3\omega_3 \gg I_t\Omega$ ("much greater than"). A slowly spun top does not obey it — it nutates visibly instead — and neither does a spacecraft whose "spin" is only a few times its turning rate.
:::

## Nutation seen from both frames

A torque-free body needs nothing outside to make it wobble. Lesson 6 solved the axisymmetric case in the body frame. With $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$, the spin rate $\omega_3 = n$ is constant, and the sideways rate has constant size $\omega_t$ and turns around the symmetry axis at

$$
\lambda = n\,\frac{I_3 - I_t}{I_t}
$$

($\lambda$, "lambda"). Meanwhile $\boldsymbol{\omega}$ sweeps out the **body cone**, of half-angle $\gamma = \arctan(\omega_t/n)$ ("gamma"), around the symmetry axis $\hat{\mathbf{b}}_3$. That is what a **[[rate gyro|tracker-gyro]]** bolted to the vehicle measures: two sideways channels swinging a quarter cycle apart at frequency $|\lambda|$, and a steady third channel.

The view from space is different. It is what a **star tracker**, a camera that measures attitude from the stars, would see.

**Setting up.** Put the inertial $Z$ axis along the fixed $\mathbf{H}$. Describe the attitude with a **[[3-1-3 Euler sequence|euler-313]]**: turn by $\psi$ ("psi") about $Z$, then by $\theta$ about the new $x$ axis, then by $\phi$ ("phi") about the body 3 axis. The body components of the angular velocity are then

$$
\begin{aligned}
\omega_1 &= \dot{\psi}\sin\theta\sin\phi + \dot{\theta}\cos\phi, \\
\omega_2 &= \dot{\psi}\sin\theta\cos\phi - \dot{\theta}\sin\phi, \\
\omega_3 &= \dot{\psi}\cos\theta + \dot{\phi}.
\end{aligned}
$$

Because $\mathbf{H}$ points along $Z$ by construction, its body components come out of the same angles:

$$
H_1 = H\sin\theta\sin\phi, \qquad H_2 = H\sin\theta\cos\phi, \qquad H_3 = H\cos\theta .
$$

**The precession rate.** Now use $H_1 = I_t\omega_1$. Lesson 6 showed that $\theta$ stays constant, so $\dot{\theta} = 0$ and the $\dot{\theta}$ term drops out of $\omega_1$:

$$
I_t\,\dot{\psi}\sin\theta\sin\phi = H\sin\theta\sin\phi .
$$

Divide both sides by $I_t\sin\theta\sin\phi$:

$$
\boxed{\ \dot{\psi} = \frac{H}{I_t}\ }
$$

The symmetry axis sweeps a cone around the fixed $\mathbf{H}$ at the constant rate $H/I_t$. This is the **inertial precession rate**, promised in lesson 6 and now derived. Notice what it leaves out: nothing about how big the wobble is, and no $I_3$ except through $H$ itself.

**The spin inside the precession.** Now use $H_3 = I_3\omega_3$, so $\omega_3 = H\cos\theta/I_3$, and the third kinematic equation:

$$
\dot{\phi} = \omega_3 - \dot{\psi}\cos\theta = \frac{H\cos\theta}{I_3} - \frac{H\cos\theta}{I_t}
= n\,\frac{I_t - I_3}{I_t} = -\lambda .
$$

(The middle step uses $H\cos\theta = H_3 = I_3 n$, so the first fraction is $n$ and the second is $I_3 n/I_t$.) So the body turns about its own symmetry axis, *relative to the precessing frame*, at exactly minus the body-frame rate.

The three rates describe one motion in three ways. $\dot{\psi}$ is how fast the axis goes round $\mathbf{H}$ in space. $\dot{\phi}$ is how fast the body turns inside that coning. $\lambda$ is what the vehicle's own gyros report.

::: key Nutation
Nutation is the coning of the angular velocity vector, and of the body's symmetry axis, about the fixed angular momentum vector $\mathbf{H}$, and occurs whenever $\boldsymbol{\omega}$ is not aligned with a principal axis. For an axisymmetric body the nutation angle $\theta$ between the symmetry axis and $\mathbf{H}$ is constant, the axis precesses about $\mathbf{H}$ at $\dot{\psi} = H/I_t$, the body-frame rate is $\lambda = n(I_3 - I_t)/I_t$, and the body cone rolls without slipping on the space cone.
:::

::: key Precession rate of a torque-free axisymmetric body
The body-frame transverse rate precesses at $\lambda = \omega_3(I_3 - I_t)/I_t$, where $I_t$ is the transverse moment and $\omega_3 = n$ is the spin rate. Oblate ($I_3 > I_t$) and prolate ($I_3 < I_t$) bodies precess in opposite senses: $\lambda > 0$ (with the spin) for oblate, $\lambda < 0$ (against it) for prolate.
:::

**The cone angles.** Divide the sideways part of $\mathbf{H}$, $H_t = I_t\omega_t$, by the axial part, $H_3 = I_3 n$. The first ratio is $\tan\theta$ and $\omega_t/n$ is $\tan\gamma$, so

$$
\tan\theta = \frac{I_t}{I_3}\tan\gamma .
$$

An oblate body ($I_3 > I_t$) has $\theta < \gamma$, and a prolate body ($I_3 < I_t$) has $\theta > \gamma$ — lesson 6's sign rule in one line. The **space cone**, swept by $\boldsymbol{\omega}$ around the fixed $\mathbf{H}$, has half-angle $\beta = |\theta - \gamma|$ ("beta").

::: example The prolate upper stage seen from space
Take the spinning stage of lessons 6 and 8: $I_3 = 1000$ and $I_t = 2000\,\mathrm{kg\,m^2}$, spinning at $60\,\mathrm{rpm}$ ($n = 6.2832\,\mathrm{rad/s}$) with a sideways rate $\omega_t = 0.10\,\mathrm{rad/s}$. It has $H = 6286.4\,\mathrm{N\,m\,s}$, nutation angle $\theta = 1.823^\circ$ and body-cone angle $\gamma = 0.912^\circ$.

**The rates.** The inertial precession rate is $\dot{\psi} = H/I_t = 6286.4/2000 = 3.1432\,\mathrm{rad/s}$, a period of $2\pi/3.1432 = 1.999\,\mathrm{s}$. The spin inside that precession is $\dot{\phi} = n(I_t - I_3)/I_t = 6.2832\times 0.5 = 3.1416\,\mathrm{rad/s}$. The body-frame rate is $\lambda = -3.1416\,\mathrm{rad/s}$ — negative, against the spin — with period $2.000\,\mathrm{s}$.

**Check.** The third kinematic equation says $\dot{\psi}\cos\theta + \dot{\phi} = n$. Here $\dot{\psi}\cos\theta = 3.1432\times 0.99949 = 3.1416$, and $3.1416 + 3.1416 = 6.2832\,\mathrm{rad/s}$. That is $n$ exactly.

**Simulation.** Integrating Euler's equations together with the attitude confirms it. Over a four-second run the body 3 axis goes round $\mathbf{H}$ at a measured $3.14318\,\mathrm{rad/s}$, against the predicted $3.14318$. The inertial $\mathbf{H}$ holds at $(200.0, 0.0, 6283.2)\,\mathrm{N\,m\,s}$, and $\theta$ stays at $1.8232^\circ$ to four decimals.

**The cones.** The space cone's half-angle is $\beta = |1.823 - 0.912| = 0.911^\circ$. Because the body is prolate, the [[two cones touch on the outside|cones]]: the body cone rolls around the outside of the space cone. An observer on the ground sees the stage's nose trace a $1.8^\circ$ circle once every two seconds while the vehicle spins once a second. A wobble at half the spin frequency is the signature that makes this kind of nutation easy to spot in tracking data.
:::

::: example An oblate drum, and why the rates differ so much
Take the drum of the first example, $I_3 = 800$ and $I_t = 500\,\mathrm{kg\,m^2}$ at $60\,\mathrm{rpm}$, and give it a $1.0^\circ$ nutation angle.

**Momentum and precession.** The axial part of $\mathbf{H}$ is $H\cos\theta = I_3 n$, so $H = I_3 n/\cos\theta = 5026.5/0.99985 = 5027.3\,\mathrm{N\,m\,s}$. Then

$$
\dot{\psi} = \frac{H}{I_t} = \frac{5027.3}{500} = 10.055\,\mathrm{rad/s},
$$

a precession period of $2\pi/10.055 = 0.625\,\mathrm{s}$. The axis goes round $\mathbf{H}$ $10.055/6.283 = 1.6$ times for every turn of the body.

**Body rates.** $\lambda = n(I_3 - I_t)/I_t = 6.2832\times 300/500 = +3.770\,\mathrm{rad/s}$, positive (with the spin), period $1.667\,\mathrm{s}$. And $\dot{\phi} = -3.770\,\mathrm{rad/s}$: the body turns *backwards* inside its own precession. Check: $\dot{\psi}\cos\theta + \dot{\phi} = 10.055\times 0.99985 - 3.770 = 6.283\,\mathrm{rad/s} = n$.

**Cones.** $\gamma = \arctan[(I_3/I_t)\tan\theta] = \arctan(1.6\times 0.017455) = 1.600^\circ$. So $\theta = 1.0^\circ$ is less than $\gamma$, as an oblate body requires, and $\beta = 1.600 - 1.0 = 0.600^\circ$. The sideways rate is $\omega_t = n\tan\gamma = 6.2832\times 0.02793 = 0.1755\,\mathrm{rad/s}$.

**Three instruments, three numbers.** A rate gyro on a sideways axis would read $\pm 0.175\,\mathrm{rad/s}$, swinging at $3.77\,\mathrm{rad/s}$. A star tracker would report a $1^\circ$ cone swept at $10.06\,\mathrm{rad/s}$. Same motion, different numbers — and quoting one to a colleague who assumes another is how nutation analyses go wrong.
:::

## Gyroscopic coupling inside the vehicle

The third form is the one that shows up in control design. Lesson 5 wrote Euler's equations as $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \mathbf{M}$ and called the cross term gyroscopic. The same kind of term appears, much larger, as soon as the vehicle carries a spinning wheel.

Let a wheel store angular momentum $\mathbf{h}$ (small h), written in the body frame. The total is then $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \mathbf{h}$. Moving the derivative into the body frame (lesson 5's transport step, which adds $\boldsymbol{\omega}\times$ the vector) gives

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}) = \mathbf{M}_{\mathrm{ext}} .
$$

The new piece is $\boldsymbol{\omega}\times\mathbf{h}$. It is a torque on the structure, at right angles to both the body rate and the stored momentum, and it appears whenever the vehicle turns. It is the bicycle wheel again — now bolted inside the spacecraft, with the spacecraft doing the turning.

::: example The coupling torque from a momentum wheel
A spacecraft carries a wheel storing $\mathbf{h} = (30, 0, 0)\,\mathrm{N\,m\,s}$ along its body $x$ axis. It is commanded to turn about $y$ at $\boldsymbol{\omega} = (0, 0.05, 0)\,\mathrm{rad/s}$. Work out the cross product component by component, $(a_2b_3 - a_3b_2,\ a_3b_1 - a_1b_3,\ a_1b_2 - a_2b_1)$:

$$
\boldsymbol{\omega}\times\mathbf{h} = (0\cdot 0 - 0\cdot 0,\ 0\cdot 30 - 0\cdot 0,\ 0\cdot 0 - 0.05\cdot 30) = (0, 0, -1.5)\,\mathrm{N\,m}.
$$

That is $1.5\,\mathrm{N\,m}$ about $z$ — an axis nobody asked to move. Compare it with the torque a small reaction wheel can produce, typically $0.01$ to $0.1\,\mathrm{N\,m}$. The coupling is 15 to 150 times larger than the authority available to fight it. A controller that does not plan for this term will max out its $z$ actuator during every $y$ turn, and the vehicle will corkscrew.

The fix is not more authority but better bookkeeping. Both $\boldsymbol{\omega}$ and $\mathbf{h}$ are measured, so $\boldsymbol{\omega}\times\mathbf{h}$ can be computed and cancelled in the command — a **[[feed-forward|feed-forward]]**. It is the same argument lesson 5 made for $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$, and lesson 11 builds the wheel dynamics on it.
:::

::: note Why a fixed inertial torque does not set off nutation
In the first example a sudden torque was switched on and the body precessed without wobbling. That seems to clash with the idea that any disturbance sets a spinning body nutating. Look at it from the body. A torque that is fixed in space looks, from the spinning body, like a vector going round at the spin rate. Its push on the sideways rates adds up to almost zero over each turn, leaving only the slow, steady drift of $\mathbf{H}$. A torque fixed in the *body* — a thruster slightly out of line, say — does not average away, and it drives the nutation angle up. Which frame a disturbance is fixed in matters more than how big it is.
:::

::: warning Three rates, three names, three instruments
This module uses $\dot{\psi} = H/I_t$ for the inertial precession of the symmetry axis around $\mathbf{H}$; $\lambda = n(I_3 - I_t)/I_t$ for the body-frame rate at which the sideways angular velocity goes round; and $\dot{\phi} = -\lambda$ for the spin of the body inside the precessing frame. Other books call $\lambda$ the nutation frequency and keep "precession" for $\dot{\psi}$; some call $\dot{\psi}$ the nutation rate. Before using a number from a reference, check which vector turns around which, and in which frame. A rate gyro sees $\lambda$; a star tracker sees $\dot{\psi}$. They are tied together by $\dot{\psi}\cos\theta = n + \lambda$, and they can be far apart: for the drum above, $10.06$ against $3.77\,\mathrm{rad/s}$, almost a factor of three.
:::

## Check yourself

::: check
A spinning probe has $H = 400\,\mathrm{N\,m\,s}$ and feels a constant sideways disturbance torque of $5\times 10^{-6}\,\mathrm{N\,m}$. How far does its spin axis drift in 180 days? What spin momentum would hold the drift to $1^\circ$?
:::

::: answer
The drift rate is $M/H = 5\times 10^{-6}/400 = 1.25\times 10^{-8}\,\mathrm{rad/s}$. In $180$ days, $t = 180\times 86{,}400 = 1.5552\times 10^7\,\mathrm{s}$, the axis moves

$$
1.25\times 10^{-8}\times 1.5552\times 10^7 = 0.1944\,\mathrm{rad} = 11.1^\circ.
$$

To hold it to $1^\circ = 0.01745\,\mathrm{rad}$ over the same time, solve $\Delta = Mt/H$ for $H$:

$$
H = \frac{Mt}{\Delta} = \frac{5\times 10^{-6}\times 1.5552\times 10^7}{0.01745} = 4.46\times 10^3\,\mathrm{N\,m\,s},
$$

about eleven times more — which makes sense, since the drift has to shrink from $11.1^\circ$ to $1^\circ$. Momentum, not torque authority, is the currency of passive pointing.
:::

::: check
An axisymmetric satellite has $I_3 = 1200$ and $I_t = 900\,\mathrm{kg\,m^2}$, spins at $n = 2.0\,\mathrm{rad/s}$, and has a $3^\circ$ nutation angle. Find $H$, $\dot{\psi}$, $\lambda$ and $\dot{\phi}$, and check them against each other.
:::

::: answer
The axial part of $\mathbf{H}$ is $I_3 n$, so $H = I_3n/\cos\theta = 1200\times 2.0/\cos 3^\circ = 2400/0.998630 = 2403.3\,\mathrm{N\,m\,s}$.

Then $\dot{\psi} = H/I_t = 2403.3/900 = 2.6704\,\mathrm{rad/s}$ (period $2.353\,\mathrm{s}$). Next $\lambda = n(I_3 - I_t)/I_t = 2.0\times 300/900 = 0.6667\,\mathrm{rad/s}$, and $\dot{\phi} = -\lambda = -0.6667\,\mathrm{rad/s}$.

Check with the third kinematic equation: $\dot{\psi}\cos\theta + \dot{\phi} = 2.6704\times 0.998630 - 0.6667 = 2.6667 - 0.6667 = 2.000\,\mathrm{rad/s} = n$. The body is oblate, so $\lambda$ is positive (with the spin), and the axis precesses faster than the body spins.
:::

::: check
You need a spinning upper stage, $H = 6000\,\mathrm{N\,m\,s}$, to turn its spin axis by $30^\circ$ in ten minutes, using a thruster that fires sideways. What average torque is needed? What is wrong with a naive "torque equals inertia times angular acceleration" estimate, taking $I_t = 2000\,\mathrm{kg\,m^2}$?
:::

::: answer
Use $\dot{\hat{\mathbf{s}}} = \mathbf{M}/H$. The rate needed is $\Omega = 0.5236\,\mathrm{rad}/600\,\mathrm{s} = 8.727\times 10^{-4}\,\mathrm{rad/s}$, so

$$
M = H\Omega = 6000\times 8.727\times 10^{-4} = 5.24\,\mathrm{N\,m},
$$

kept up for the whole ten minutes. The torque *vector* must point the way you want the axis to go, which means the thruster's push is at right angles to that direction. Because the stage spins, the thruster is fired in short pulses at the same point of every turn, so that its torque always points the same way in space; $5.24\,\mathrm{N\,m}$ is the average of those pulses.

The naive estimate treats the stage as a non-spinning body turned from rest to rest: speed up for half the time, slow down for the other half. That needs $\ddot{\vartheta} = 4\Delta\vartheta/t^2 = 4\times 0.5236/600^2 = 5.82\times 10^{-6}\,\mathrm{rad/s^2}$ ($\vartheta$, "vartheta", is the turn angle) and $M = I_t\ddot{\vartheta} = 2000\times 5.82\times 10^{-6} = 0.0116\,\mathrm{N\,m}$. That is $450$ times too small — and the thrust would be aimed a quarter turn from where it belongs. Spin does not make turning easier; it makes it expensive and sideways.
:::

::: check
Why is the nutation angle $\theta$ constant for a torque-free axisymmetric body? What would have to be true for it to change?
:::

::: answer
$\cos\theta = H_3/H = I_3\omega_3/H$. With no torque, $H$ is constant because $\mathbf{H}$ is fixed in space. And $\omega_3$ is constant because the third Euler equation reads $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 = 0$ when $I_1 = I_2$. So $\cos\theta$ is one constant divided by another.

For $\theta$ to change, either an outside torque must act, which changes $\mathbf{H}$, or the body must not be rigid. Then energy can drain at fixed $H$ and, as lesson 8 showed, drive $\theta$ toward $0$ (oblate) or $90^\circ$ (prolate). A constant $\theta$ is a statement about rigidity as much as about torque.
:::

::: check
A spacecraft carries two identical momentum wheels on the $z$ axis, one storing $+25\,\mathrm{N\,m\,s}$ and the other $-25\,\mathrm{N\,m\,s}$. What gyroscopic coupling torque appears during a turn at $0.02\,\mathrm{rad/s}$ about $x$? What is gained or lost compared with a single wheel storing $+25$?
:::

::: answer
The stored momenta cancel: $\mathbf{h} = (0, 0, 25) + (0, 0, -25) = \mathbf{0}$. So $\boldsymbol{\omega}\times\mathbf{h} = \mathbf{0}$: no coupling torque at all. With a single wheel it would be $(0.02, 0, 0)\times(0, 0, 25) = (0,\ 0\cdot 0 - 0.02\cdot 25,\ 0) = (0, -0.5, 0)$, which is $0.5\,\mathrm{N\,m}$ about $y$.

Gained: a vehicle that turns like a plain rigid body, and that can still make control torques by running the two wheels differently. Lost: the gyroscopic stiffness itself. A zero-momentum vehicle has no passive pointing reference, so all its attitude stability must come from the control loop. This trade — **[[momentum bias against zero momentum|bias-or-zero]]** — is one of the first big choices in an attitude control design, and lesson 10 shows the option in between.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\dot{\hat{\mathbf{s}}} = \mathbf{M}/H$ | Gyroscopic stiffness: axis moves along the torque vector at $M/H$, growing in proportion to time |
| $\mathbf{M} = \boldsymbol{\Omega}\times\mathbf{H}$ | Torque needed for a steady precession $\boldsymbol{\Omega}$; gives $\Omega = M/(H\sin\alpha)$ |
| $\Omega = mgl/H$ | Precession rate of a fast top, independent of its lean |
| $\theta$ | Nutation angle between the symmetry axis and $\mathbf{H}$; constant for a torque-free rigid body |
| $\dot{\psi} = H/I_t$ | Inertial precession rate of the symmetry axis around $\mathbf{H}$; what a star tracker sees |
| $\lambda = n(I_3 - I_t)/I_t$ | Body-frame rate of the sideways angular velocity; what a rate gyro sees; opposite signs for oblate and prolate |
| $\dot{\phi} = -\lambda$ | Spin of the body inside the precessing frame; $\dot{\psi}\cos\theta + \dot{\phi} = n$ |
| $\tan\theta = (I_t/I_3)\tan\gamma$, $\beta = \lvert\theta - \gamma\rvert$ | Nutation, body-cone and space-cone angles |
| $\boldsymbol{\omega}\times\mathbf{h}$ | Gyroscopic coupling torque from stored wheel momentum $\mathbf{h}$ |
| Drum at 60 rpm, $I_3 = 800$, $I_t = 500$ | $H = 5027\,\mathrm{N\,m\,s}$; $\dot{\psi} = 10.06$, $\lambda = 3.77\,\mathrm{rad/s}$; $7.2^\circ$ a year under $2\times 10^{-5}\,\mathrm{N\,m}$ |

Gyroscopic stiffness is free pointing, and its price is that the whole vehicle spins, so nothing on it can stare steadily at anything. The next lesson buys the pointing back without giving up the momentum: a rotor spins while a platform does not. That dual-spin design turns out to change the stability rules of lesson 8 as well.

::: context bicycle-wheel The push, the torque, and the swing
Seen from above: the wheel's angular momentum $\mathbf{H}$ points along its axle. A sideways torque $\mathbf{M}$ (blue), at right angles to $\mathbf{H}$, adds a small piece $\mathbf{M}\,\Delta t$ to it in each short moment $\Delta t$. The sum (grey) points a little further round. So the axle swings *toward the torque vector*, not toward the force that made it — and the more angular momentum there is, the smaller that turn for the same added piece.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="130" r="4" fill="#1f2a44"/>
  <line x1="60" y1="130" x2="282" y2="130" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="296,130 282,124 282,136" fill="#1f2a44"/>
  <text x="170" y="152" font-size="13" fill="#1f2a44">H (along the axle)</text>
  <line x1="296" y1="130" x2="296" y2="62" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="296,50 290,64 302,64" fill="#1d6fd1"/>
  <text x="304" y="92" font-size="13" fill="#1d6fd1">M Δt</text>
  <line x1="60" y1="130" x2="283.8" y2="54.4" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="296,50 283.2,58.6 279.5,47.3" fill="#6c7a93"/>
  <text x="120" y="76" font-size="13" fill="#6c7a93">H + M Δt</text>
  <path d="M 200 130 A 140 140 0 0 0 192.6 85.1" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="206" y="114" font-size="12" fill="#b4232c">swing</text>
</svg>
```
:::

::: context honey A ball in honey
Push a marble floating in space and it keeps going after you let go: force made it *speed up*. Push a marble sunk in honey and it creeps along only while you push, and stops the instant you let go: force made it *move at a speed*. A spinning body answers sideways torques the second way. The torque sets how fast the axis moves, not how fast it speeds up. That is why a spinning spacecraft does not keep drifting after a disturbance ends.
:::

::: context pioneer Probes that simply spun
NASA's Pioneer 10 and 11, launched in 1972 and 1973 to Jupiter and Saturn, were spin-stabilized: the whole spacecraft turned slowly about the axis of its big dish antenna, which pointed back at Earth. The spin kept the dish aimed with no wheels and no active control. Every so often small thrusters fired in short pulses to re-aim the axis as Earth moved around the Sun — exactly the steady-precession problem of this lesson. Pioneer 10 kept talking to Earth until 2003.
:::

::: context solar-pressure Sunlight pushes
Light carries momentum, so sunlight hitting a surface pushes on it. Near Earth the push is tiny — about $4.6$ millionths of a newton on each square meter that absorbs the light, and about twice that on a perfect mirror. If the sunlit areas of a spacecraft are not balanced around its center of mass, that push makes a small, steady torque. It is the largest outside torque on many satellites high above Earth, and it never switches off.
:::

::: context top The leaning top
Gravity (red) pulls down at the center of mass, a distance $l$ up the axis from the point. Its lever arm is $l\sin\alpha$, so its torque is $mgl\sin\alpha$, pointing horizontally (into the page here). The torque swings $\mathbf{H}$ sideways, so the axis circles the vertical at $\Omega = mgl/H$ instead of falling over.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="185" x2="180" y2="15" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="185" x2="255" y2="55.1" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="262,43 252.6,58.7 244.4,54" fill="#1f2a44"/>
  <text x="266" y="42" font-size="13" fill="#1f2a44">H</text>
  <circle cx="225" cy="107.1" r="8" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="225" y1="115" x2="225" y2="160" stroke="#b4232c" stroke-width="3"/>
  <polygon points="225,172 219,158 231,158" fill="#b4232c"/>
  <text x="232" y="160" font-size="13" fill="#b4232c">mg</text>
  <path d="M 180 145 A 40 40 0 0 1 200 150.4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="184" y="140" font-size="12" fill="#1f2a44">α</text>
  <ellipse cx="180" cy="55" rx="75" ry="12" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="40" y="50" font-size="12" fill="#1d6fd1">axis circles</text>
  <text x="40" y="64" font-size="12" fill="#1d6fd1">at Ω = mgl/H</text>
  <text x="200" y="118" font-size="12" fill="#1f2a44">l</text>
</svg>
```
:::

::: context tracker-gyro What the instruments see
A **rate gyro** is a sensor bolted to the vehicle that measures how fast the vehicle is turning about its own axes. It lives in the body frame, so for a nutating spinner it reports the sideways rate going round at $\lambda$. A **star tracker** is a small camera that recognizes star patterns and reports which way the vehicle points in space. It sees the symmetry axis coning around $\mathbf{H}$ at $\dot{\psi}$. Most spacecraft carry both, and flight software blends them.
:::

::: context euler-313 Three turns to any attitude
Any orientation can be reached by three turns in a set order. The 3-1-3 recipe: turn by $\psi$ about the $z$ axis; then by $\theta$ about the new $x$ axis, which tilts the body away from $z$; then by $\phi$ about the body's own $z$ axis. For a spinning top, $\psi$ is the angle around the circle it is precessing on, $\theta$ is its lean, and $\phi$ is how far it has spun about its own axis — which is why this sequence suits nutation so well.
:::

::: context cones Two cones rolling
For a prolate body, seen with $\mathbf{H}$ straight up (angles exaggerated). The space cone (grey) is fixed around $\mathbf{H}$. The body cone (blue) is fixed around the symmetry axis. They touch along $\boldsymbol{\omega}$ (red), and the body cone rolls around the outside of the space cone without slipping. The angles add: $\theta = \beta + \gamma$. For an oblate body the space cone sits *inside* the body cone instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="185" x2="180" y2="20" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="170" y="20" font-size="13" text-anchor="end" fill="#1f2a44">H</text>
  <polygon points="180,185 138.8,31.3 221.2,31.3" fill="#6c7a93" fill-opacity="0.25" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="180,185 221.2,31.3 292.4,72.6" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="185" x2="221.2" y2="31.3" stroke="#b4232c" stroke-width="3"/>
  <text x="206" y="22" font-size="13" fill="#b4232c">ω</text>
  <line x1="180" y1="185" x2="262.5" y2="42.1" stroke="#1d6fd1" stroke-width="2.5" stroke-dasharray="6 4"/>
  <text x="268" y="38" font-size="12" fill="#1d6fd1">symmetry axis</text>
  <text x="60" y="110" font-size="12" fill="#6c7a93">space cone</text>
  <text x="250" y="120" font-size="12" fill="#1d6fd1">body cone</text>
</svg>
```
:::

::: context feed-forward Cancel what you can predict
A **feedback** controller waits for an error to appear, then pushes against it. A **feed-forward** term acts before any error appears, because the controller can already calculate the disturbance. Here, the flight computer knows the body rate from its gyros and the wheel momentum from the wheel's speed sensor, so it can compute $\boldsymbol{\omega}\times\mathbf{h}$ every cycle and command a torque that cancels it. The feedback loop is then left with only the small, unpredictable errors.
:::

::: context bias-or-zero Two ways to fly
A **momentum-bias** spacecraft keeps a large amount of angular momentum stored in a wheel all the time. It gets gyroscopic stiffness on two axes for free, as a spinning satellite does, and many weather and communications satellites have flown this way. A **zero-momentum** spacecraft keeps its wheels' momenta near zero in total. It can point any way at any time, as agile imaging satellites must, but it has no passive stiffness and relies entirely on its control loop.
:::
