---
id: l08-thrust-vector-control-gimbal-dynamics
title: Thrust vector control — gimbal dynamics for launch vehicles
minutes: 22
covers:
  - thrust vector control gimbal dynamics for launch vehicles
---

A launch vehicle has no wings worth speaking of, no reaction wheels, and — during the atmospheric ascent when it matters most — an aerodynamic shape that actively tries to turn it around. What it does have is several meganewtons of thrust coming out of the back, and a set of actuators that can point that thrust a few degrees off the centreline. Swivelling the engine is called **thrust vector control**, and on almost every orbital launch vehicle flying it is the primary attitude actuator from liftoff to stage separation.

The physics is uncomplicated: deflect the thrust by an angle and the long lever arm to the centre of mass turns it into an enormous torque. What makes thrust vector control interesting is everything around that equation. The deflection is limited to a handful of degrees by the engine mounting and the plumbing. The *rate* of deflection is limited by the actuator, and that rate limit, not the angle limit, is usually what caps the control bandwidth. The vehicle being controlled is open-loop unstable with a divergence time of a few seconds, so the loop cannot be slow. And the engine being swung has mass of its own, which pushes back.

This lesson works through the authority calculation, the instability it has to beat, and what the two gimbal limits do to a control loop.

## The control torque

Let $F$ be the thrust, $L$ the distance from the gimbal pivot to the vehicle's centre of mass, and $\delta$ the gimbal deflection from the centreline. Resolve the thrust into a component along the vehicle axis and one perpendicular to it. The perpendicular component $F\sin\delta$ acts at distance $L$ from the centre of mass, so

$$
M_c = F\,L\sin\delta \approx F\,L\,\delta .
$$

::: key Gimbal control torque
$M_c = F L\sin\delta \approx F L\delta$, with $L$ the gimbal-to-centre-of-mass distance and $\delta$ the deflection. Gimbal deflection and gimbal rate limits cap both the achievable torque and the loop bandwidth.
:::

The small-angle form is excellent over the whole range a gimbal can move: at $6^\circ$, $\sin\delta = 0.10453$ against $\delta = 0.10472\,\mathrm{rad}$, an error of $0.18\,\%$.

Two side effects of deflecting the thrust deserve their own lines, because both show up in the trajectory rather than the attitude.

The **axial thrust loss** is $F(1 - \cos\delta)$. At $6^\circ$ that is $0.55\,\%$ of the thrust, and the loss goes as $\delta^2/2$, so it is negligible for small steering corrections and non-negligible if the vehicle sits at a large deflection for a long time — one reason to trim the centre of mass rather than hold a standing gimbal angle.

The **lateral force** is $F\sin\delta$, which accelerates the whole vehicle sideways. On a $400\,\mathrm{t}$ stage a $6^\circ$ deflection of $5\,\mathrm{MN}$ gives $5.23\times 10^5\,\mathrm{N}$, or $1.31\,\mathrm{m/s^2}$ of lateral acceleration. Notice the sign: to pitch the nose *up*, the engine deflects so as to push the tail *up*, which momentarily pushes the whole vehicle in the wrong direction before the rotation takes effect. That is a non-minimum-phase response, and it is a real constraint on how aggressively the guidance can command lateral corrections.

::: example Control authority of a first stage
A first stage produces $F = 5.0\,\mathrm{MN}$, its gimbal pivot sits $L = 18\,\mathrm{m}$ behind the centre of mass, its pitch inertia is $I = 1.5\times 10^8\,\mathrm{kg\,m^2}$, and the gimbal travels $\pm 6^\circ$ at up to $8\,^\circ/\mathrm{s}$.

Maximum control torque:

$$
M_{max} = 5.0\times 10^6 \times 18 \times \sin 6^\circ = 9.41\times 10^6\,\mathrm{N\,m}.
$$

Maximum angular acceleration: $M_{max}/I = 9.41\times 10^6/1.5\times 10^8 = 6.27\times 10^{-2}\,\mathrm{rad/s^2} = 3.59\,^\circ/\mathrm{s^2}$. A four-hundred-tonne vehicle can be angularly accelerated at three and a half degrees per second squared — sluggish by aircraft standards and ample for a pitch program.

Run it the other way, which is how you actually use the formula. To command a pitch acceleration of $0.3\,^\circ/\mathrm{s^2} = 5.24\times 10^{-3}\,\mathrm{rad/s^2}$ takes $M = I\ddot{\theta} = 7.85\times 10^5\,\mathrm{N\,m}$, which needs

$$
\delta = \arcsin\frac{7.85\times 10^5}{5.0\times 10^6 \times 18} = 8.73\times 10^{-3}\,\mathrm{rad} = 0.500^\circ .
$$

Half a degree of gimbal for the nominal pitch program. The other five and a half degrees are reserve: for wind, for a thrust misalignment, for a centre-of-mass offset, and for an engine-out case where the remaining engines must both steer and cancel the asymmetric thrust of the missing one.
:::

## What it is fighting: aerodynamic instability

A rocket is a tube with a pointed nose and nothing at the back. Its aerodynamic centre of pressure sits well forward — typically ahead of the centre of mass for most of the ascent — so a small angle of attack produces a normal force that pushes the nose *further* off. The vehicle is statically unstable, and without control it diverges.

Model the normal force as $N = \bar{q}\,S\,C_{N\alpha}\,\alpha$, with $\bar{q} = \tfrac{1}{2}\rho v^2$ the dynamic pressure, $S$ a reference area (usually the body cross-section), $C_{N\alpha}$ the normal-force coefficient slope — about $2$ per radian for a slender body — and $\alpha$ the angle of attack. If the centre of pressure is a distance $d$ ahead of the centre of mass, the destabilising moment is $M_a = \bar{q}SC_{N\alpha}d\,\alpha$ and

$$
I\ddot{\alpha} = \bar{q}\,S\,C_{N\alpha}\,d\,\alpha \quad\Longrightarrow\quad \ddot{\alpha} = k\alpha, \qquad k = \frac{\bar{q}SC_{N\alpha}d}{I} > 0 .
$$

A positive coefficient on the right-hand side means exponential growth, $\alpha \propto e^{\sqrt{k}\,t}$, with time constant $\tau = 1/\sqrt{k}$ and doubling time $\tau\ln 2$. That number is the single most important one for the ascent controller: the loop has to react far faster than the vehicle can double its angle of attack.

::: example Max-Q authority margin and divergence time
The same stage is $3.7\,\mathrm{m}$ in diameter, so $S = \pi(1.85)^2 = 10.75\,\mathrm{m^2}$. At max-Q, $\bar{q} = 33\,\mathrm{kPa}$, the centre of pressure is $d = 12\,\mathrm{m}$ ahead of the centre of mass, and $C_{N\alpha} = 2.0$ per radian.

**At $2^\circ$ angle of attack** ($0.0349\,\mathrm{rad}$): $N = 33000 \times 10.75 \times 2.0 \times 0.0349 = 2.48\times 10^4\,\mathrm{N}$, giving $M_a = 2.97\times 10^5\,\mathrm{N\,m}$. Against $9.41\times 10^6\,\mathrm{N\,m}$ of gimbal authority that is a margin of $31.6$, and holding it takes only $0.19^\circ$ of gimbal.

**At $5^\circ$**, which a $30\,\mathrm{m/s}$ crosswind produces at a vehicle speed of $400\,\mathrm{m/s}$ — $\arctan(30/400) = 4.3^\circ$, plus the vehicle's own attitude error — the moment is $7.43\times 10^5\,\mathrm{N\,m}$, the margin falls to $12.7$, and the trim deflection is $0.47^\circ$.

**Divergence.** $k = 33000 \times 10.75 \times 2.0 \times 12/1.5\times 10^8 = 5.68\times 10^{-2}\,\mathrm{s^{-2}}$, so $\tau = 1/\sqrt{k} = 4.20\,\mathrm{s}$ and the doubling time is $2.91\,\mathrm{s}$. An uncontrolled vehicle at $2^\circ$ reaches $4^\circ$ in under three seconds and $16^\circ$ in under nine, at which point the structure fails. The control loop needs a bandwidth many times $1/\tau = 0.24\,\mathrm{rad/s}$ — in practice a rigid-body crossover around $1$ to $3\,\mathrm{rad/s}$, which is why bending modes and slosh, which live not far above that, become the binding constraint on the design.

The margin of 12 to 30 is comfortable on paper and is not the whole story: the same gimbal must simultaneously fly the pitch program, trim a thrust misalignment, counter a centre-of-mass offset, and hold a load-relief angle. The margin against aerodynamics alone is a necessary condition, not the design case.
:::

## The gimbal as a dynamic system

The gimbal is not an algebraic gain. Commanding $\delta_{cmd}$ produces $\delta$ through an actuator — hydraulic or electromechanical — that is usefully modelled as second order with two hard nonlinearities bolted on:

$$
\ddot{\delta} + 2\zeta_a\omega_a\dot{\delta} + \omega_a^2\delta = \omega_a^2\,\delta_{cmd},
\qquad \lvert\delta\rvert \le \delta_{max},\qquad \lvert\dot{\delta}\rvert \le \dot{\delta}_{max} .
$$

Typical actuator natural frequencies $\omega_a$ correspond to 2 to 5 Hz, with damping $\zeta_a$ around $0.5$ to $0.7$. That places the actuator's own dynamics above the rigid-body crossover but not far above: at a crossover of $1\,\mathrm{rad/s}$ a 2 Hz actuator already contributes about $6^\circ$ of phase lag, and a 5 Hz one about $2.5^\circ$. Small, and it stacks with the sensor lag, the filter lag and the computational delay, all of which eat the phase margin that the unstable plant makes so precious.

### The deflection limit

$\lvert\delta\rvert \le \delta_{max}$ caps the torque at $FL\sin\delta_{max}$. When a manoeuvre demands more, the loop opens: the commanded torque no longer reaches the plant, the error keeps growing, and any integrator in the controller winds up. That is the subject of the next lesson.

### The rate limit, and why it decides the bandwidth

$\lvert\dot{\delta}\rvert \le \dot{\delta}_{max}$ is the more interesting constraint because it is **amplitude-dependent**. Ask the gimbal to track $\delta(t) = A\sin\omega t$ and the required rate is $A\omega\cos\omega t$, peaking at $A\omega$. The command is trackable only while

$$
A\,\omega \le \dot{\delta}_{max} \quad\Longrightarrow\quad \omega \le \frac{\dot{\delta}_{max}}{A}.
$$

There is no single "gimbal bandwidth". There is a hyperbola of amplitude against frequency, and the actuator lives under it.

::: example What $8\,^\circ/\mathrm{s}$ buys
For the stage above, $\dot{\delta}_{max} = 8\,^\circ/\mathrm{s} = 0.1396\,\mathrm{rad/s}$:

| Deflection amplitude | Highest trackable frequency |
| --- | --- |
| $0.5^\circ$ | $16.0\,\mathrm{rad/s}$ ($2.55\,\mathrm{Hz}$) |
| $1^\circ$ | $8.0\,\mathrm{rad/s}$ ($1.27\,\mathrm{Hz}$) |
| $3^\circ$ | $2.67\,\mathrm{rad/s}$ ($0.42\,\mathrm{Hz}$) |
| $6^\circ$ | $1.33\,\mathrm{rad/s}$ ($0.21\,\mathrm{Hz}$) |

So the vehicle can make small fast corrections or large slow ones, and nothing in between. A rigid-body loop crossing over at $2\,\mathrm{rad/s}$ is fine as long as the gimbal amplitude there stays under about $4^\circ$; a gust that demands $6^\circ$ at $2\,\mathrm{rad/s}$ cannot be flown, and the actuator will rate-saturate.

Rate saturation is worse than it sounds, because a rate-limited actuator does not merely produce a smaller output — it produces a *delayed* one. A sine command that the actuator can only follow as a triangle wave comes out lagging, and the describing function of a rate limiter adds phase lag that grows toward $90^\circ$ as the saturation deepens. On a plant that is already unstable and depends on phase margin for its stability, adding tens of degrees of lag is how a vehicle gets into a divergent oscillation: the classic pilot-induced-oscillation mechanism, with the autopilot in the pilot's seat. Ascent autopilots are therefore designed to keep the commanded gimbal amplitude at crossover well inside the rate-limit hyperbola, and load-relief logic exists partly to keep gust responses out of it.
:::

## Two complications worth knowing

**The engine has mass.** Swinging a two-tonne engine about its gimbal at angular acceleration $\ddot{\delta}$ applies a reaction torque of roughly $-J_e\ddot{\delta}$ to the vehicle and a lateral force at the gimbal mount. Because $\ddot{\delta}$ scales as $\omega^2$ for a sinusoid while the thrust torque scales as $\omega^0$, the reaction is negligible at low frequency and grows quadratically. At the frequencies of the first bending modes it is no longer negligible, and it enters the transfer function from gimbal command to the rate gyro with the *opposite* sign to the thrust torque — the vehicle initially rotates the wrong way. Engineers call it "tail wags dog"; control theory calls it a right-half-plane zero, and it puts a hard ceiling on achievable bandwidth that no amount of gain can lift.

**A centreline engine cannot roll the vehicle.** Gimballing a single engine whose thrust line passes through the roll axis produces pitch and yaw torque and exactly zero roll torque, because the moment arm about the roll axis is zero. Vehicles solve this by gimballing several engines differentially — deflecting them tangentially so their side forces form a couple about the centreline — or by carrying separate roll thrusters, or by canting fixed vernier engines. It is a standard interview question and a standard source of surprise when a single-engine upper stage needs a cold-gas system for roll alone.

::: warning The lever arm changes during the burn
$L$ is the distance from the gimbal to the centre of mass, and the centre of mass moves forward as propellant drains — on a first stage by many metres over a two-and-a-half-minute burn. So $M_c = FL\sin\delta$ has a time-varying gain, and so does the aerodynamic instability coefficient $k$, which depends on $d$ (also moving) and on $\bar{q}$ (rising to max-Q and falling away). The inertia $I$ falls by a large factor as well. An ascent autopilot is therefore gain-scheduled on flight time or on a measured quantity, and every margin quoted in this lesson is quoted at one instant of one trajectory.
:::

::: warning Do not confuse the thrust loss with the steering
$F\cos\delta$ is what remains along the vehicle axis, and $F\sin\delta$ is what does the steering — but not by pushing the vehicle sideways. Over a normal ascent the net lateral impulse from gimballing is small, because the deflection oscillates around a trim value; the steering comes from *rotating* the vehicle so that the whole thrust vector points somewhere new. Sizing a trajectory correction from the lateral component alone underestimates the vehicle's authority by orders of magnitude.
:::

::: note Grid fins, and what replaces the gimbal
Once the engines shut down, the gimbal stops being an actuator. A returning booster coasting through the upper atmosphere has no thrust to vector and controls itself with cold-gas thrusters, then with aerodynamic surfaces — grid fins — as the dynamic pressure builds, then with the gimbal again during the landing burn. Each handover is a change of plant model, of authority and of bandwidth, and the autopilot has to be stable across all of them and through the transitions.
:::

## Check yourself

::: check
An upper stage has $F = 800\,\mathrm{kN}$, $L = 6\,\mathrm{m}$, pitch inertia $2.0\times 10^6\,\mathrm{kg\,m^2}$ and a $\pm 4^\circ$ gimbal. Compute the maximum control torque and angular acceleration, and the deflection needed to hold a $0.2\,\mathrm{MN\,m}$ disturbance torque.
:::

::: answer
Maximum torque: $M_{max} = 8.0\times 10^5 \times 6 \times \sin 4^\circ = 8.0\times 10^5 \times 6 \times 0.069756 = 3.35\times 10^5\,\mathrm{N\,m}$.

Maximum angular acceleration: $3.35\times 10^5/2.0\times 10^6 = 0.167\,\mathrm{rad/s^2} = 9.59\,^\circ/\mathrm{s^2}$. Much more agile than a first stage, as you would expect from a lighter vehicle with a shorter lever arm but far less inertia.

The disturbance: $0.2\,\mathrm{MN\,m} = 2.0\times 10^5\,\mathrm{N\,m}$ needs $\delta = \arcsin\bigl(2.0\times 10^5/(8.0\times 10^5\times 6)\bigr) = \arcsin(0.04167) = 2.39^\circ$. That consumes 60 per cent of the available travel for trim alone, leaving $1.6^\circ$ for control — uncomfortably little. In practice a disturbance this large would be attacked first, by aligning the engine better or by moving ballast, rather than absorbed by the gimbal.
:::

::: check
The same first stage is at max-Q with $\tau = 4.2\,\mathrm{s}$. A software change adds $40\,\mathrm{ms}$ of computational delay to the control loop, which crosses over at $2\,\mathrm{rad/s}$. How much phase margin does that cost, and why does it matter more here than on a stable vehicle?
:::

::: answer
A pure delay $T_d$ contributes phase lag $\omega T_d$ in radians: at $\omega = 2\,\mathrm{rad/s}$ and $T_d = 0.040\,\mathrm{s}$ that is $0.08\,\mathrm{rad} = 4.6^\circ$. Small in isolation.

It matters more on an unstable plant for two reasons. First, an unstable plant *must* be closed-loop stabilised — there is no benign failure mode where the loop is merely sloppy; losing stability means losing the vehicle inside a few divergence time constants, which here is a few seconds. Second, stabilising an unstable pole imposes a lower bound on bandwidth as well as the usual upper bound from bending and slosh, so the designer is squeezed from both sides and typically has only $30^\circ$ to $40^\circ$ of phase margin to give away. Spending $4.6^\circ$ of it on a software delay, on top of actuator lag, sensor lag and bending filters, is a meaningful fraction of the budget — and delays are cumulative and easy to add by accident.
:::

::: check
A gust requires the gimbal to oscillate at $\pm 2^\circ$ and $3\,\mathrm{rad/s}$. With $\dot{\delta}_{max} = 8\,^\circ/\mathrm{s}$, can the actuator follow it? What would you change?
:::

::: answer
The required peak rate is $A\omega = 2^\circ \times 3 = 6\,^\circ/\mathrm{s}$, which is inside the $8\,^\circ/\mathrm{s}$ limit — so yes, with $25\,\%$ margin. The limiting frequency at $2^\circ$ amplitude is $\dot{\delta}_{max}/A = 8/2 = 4\,\mathrm{rad/s}$.

If the requirement grew to $\pm 3^\circ$ at $3\,\mathrm{rad/s}$, the demand would be $9\,^\circ/\mathrm{s}$ and the actuator would rate-saturate, adding phase lag and risking a divergent oscillation on an already unstable plant. The options, roughly in order of preference: reduce the *demand* with load-relief logic, which lets the vehicle weathervane slightly into the gust instead of fighting it; reduce the controller gain at that frequency with a filter, accepting more attitude error; or specify a faster actuator, which costs hydraulic power, mass and money and has to be decided years earlier.
:::

::: check
Why does a launch vehicle's gimbal authority margin look enormous — a factor of 10 or 30 against the aerodynamic moment — while engineers still describe ascent control as tight?
:::

::: answer
Because the aerodynamic moment at a nominal angle of attack is not the design case. The gimbal has to supply, at the same time: the nominal pitch-program torque; the trim against a thrust vector misaligned by a fraction of a degree; the trim against a lateral centre-of-mass offset from manufacturing and propellant distribution; the response to the worst-case wind profile, which can produce far more than a couple of degrees of angle of attack; and, on a multi-engine stage, the large asymmetric torque of an engine-out. Stack those and the nominal 30-to-1 margin becomes a few to one.

And authority is not the only currency. The *bandwidth* margin is separately tight, squeezed between the unstable pole below and the first bending mode and slosh frequencies above. A vehicle can have plenty of torque available and still be difficult to control, which is the usual situation.
:::

::: check
Show that for small $\delta$ the fractional axial thrust loss is about $\delta^2/2$, and evaluate it for a $2^\circ$ trim held for the whole first-stage burn of $150\,\mathrm{s}$.
:::

::: answer
The axial component is $F\cos\delta$, so the fractional loss is $1 - \cos\delta$. Expanding, $\cos\delta = 1 - \delta^2/2 + \delta^4/24 - \cdots$, so $1 - \cos\delta \approx \delta^2/2$ for small $\delta$ in radians.

At $\delta = 2^\circ = 0.034907\,\mathrm{rad}$: $\delta^2/2 = 6.09\times 10^{-4}$, that is $0.061\,\%$. Held for $150\,\mathrm{s}$ it costs the same fraction of the stage's axial impulse, equivalent to losing about $0.09\,\mathrm{s}$ of burn time — tens of kilograms of performance on a large booster. Small, and worth eliminating: the reason vehicles are ballasted and engines aligned carefully is that a standing trim deflection is paid for on every second of every flight, whereas an oscillating deflection about zero costs almost nothing, since the loss is quadratic and averages to the mean square rather than the mean.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $M_c = FL\sin\delta \approx FL\delta$ | Gimbal control torque; $L$ is gimbal to centre of mass |
| $F(1 - \cos\delta) \approx F\delta^2/2$ | Axial thrust loss; $0.55\,\%$ at $6^\circ$ |
| $F\sin\delta$ | Lateral force; pushes the vehicle the "wrong" way before it rotates |
| First-stage example | $5\,\mathrm{MN}$, $L = 18\,\mathrm{m}$, $\pm 6^\circ$: $9.41\times 10^6\,\mathrm{N\,m}$, $3.59\,^\circ/\mathrm{s^2}$ |
| $M_a = \bar{q}SC_{N\alpha}d\,\alpha$ | Destabilising aerodynamic moment; $C_{N\alpha} \approx 2$ per radian for a slender body |
| $\ddot{\alpha} = k\alpha$, $k = \bar{q}SC_{N\alpha}d/I$ | Open-loop divergence; $\tau = 1/\sqrt{k} = 4.2\,\mathrm{s}$, doubling in $2.9\,\mathrm{s}$ at max-Q |
| Authority margin | $31.6$ at $2^\circ$ angle of attack, $12.7$ at $5^\circ$ — before wind, trim and engine-out |
| $\ddot{\delta} + 2\zeta_a\omega_a\dot{\delta} + \omega_a^2\delta = \omega_a^2\delta_{cmd}$ | Actuator model, 2–5 Hz, plus position and rate limits |
| $\omega \le \dot{\delta}_{max}/A$ | Rate-limit hyperbola: small and fast, or large and slow, never both |
| Rate saturation | Adds phase lag toward $90^\circ$; the usual route to a divergent ascent oscillation |
| Tail wags dog | Engine inertia reaction grows as $\omega^2$ and adds a right-half-plane zero |

The next lesson takes the two limits that appeared here — a deflection limit and a rate limit — and treats saturation as a subject in its own right: what it does to a feedback loop, why an integrator makes it much worse, and the standard ways to keep a controller sane when its actuator has run out of travel.
