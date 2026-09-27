---
id: l08-thrust-vector-control-gimbal-dynamics
title: Thrust vector control — gimbal dynamics for launch vehicles
minutes: 23
covers:
  - thrust vector control gimbal dynamics for launch vehicles
---

Balance a broom upright on your palm. It keeps trying to fall, and you keep it up by moving your hand underneath it. A rocket climbing through the air is that broom. It has no real wings and no reaction wheels, and its shape tries to flip it around. What it does have is meganewtons of thrust coming out of the back, and actuators that can point that thrust a few degrees off the centerline. Swinging the engine to steer is called **thrust vector control** (TVC). The engine sits on a **[[gimbal|gimbal-word]]** — a pivot that lets it tilt in two directions. On almost every orbital launch vehicle, TVC is the main attitude actuator from liftoff to stage separation.

The core physics is one line: tilt the thrust by a small angle, and the long lever arm to the center of mass turns it into a huge torque. What makes TVC interesting is everything around that line. The tilt is limited to a handful of degrees by the engine mounting and plumbing. The *speed* of tilting is limited by the actuator, and that speed limit, not the angle limit, usually caps how fast the control loop can be. The vehicle is unstable on its own, doubling its error every few seconds, so the loop cannot be slow. And the swinging engine has mass of its own, which pushes back.

This lesson works through the torque the gimbal can make, the instability it has to beat, and what the two gimbal limits do to a control loop.

## The control torque

Push a shopping cart from behind, slightly off to one side, and it turns. TVC is the same trick. Let $F$ be the thrust, $L$ the distance from the gimbal pivot to the vehicle's center of mass, and $\delta$ ("delta") the gimbal's tilt from the centerline. Split the thrust into two parts: $F\cos\delta$ along the vehicle's axis and $F\sin\delta$ **[[sideways|thrust-split]]**. The sideways part acts at distance $L$ from the center of mass, so it makes the **control torque**

$$
T_c = F\,L\sin\delta \approx F\,L\,\delta .
$$

Read $T_c$ as "T sub c", the control torque. (Earlier lessons wrote torque as $M$; it is the same quantity. Some books write the thrust itself as $T$, so you will also meet this as $T L\sin\delta$.) The $\approx$ uses the small-angle rule $\sin\delta \approx \delta$ for $\delta$ in radians.

::: key Gimbal control torque
$T_c = F L\sin\delta \approx F L\delta$, with $L$ the gimbal-to-center-of-mass distance and $\delta$ the deflection. Gimbal deflection and gimbal rate limits cap both the achievable torque and the loop bandwidth.
:::

The small-angle form is excellent over the whole range a gimbal can move. At $6^\circ$, $\sin\delta = 0.10453$ while $\delta = 0.10472\,\mathrm{rad}$ — an error of $0.18\,\%$.

Tilting the thrust has two side effects. Both show up in the trajectory rather than the attitude.

**Axial thrust loss.** Only $F\cos\delta$ still pushes along the axis, so the loss is $F(1 - \cos\delta)$. At $6^\circ$ that is $1 - 0.99452 = 0.55\,\%$ of the thrust. The loss grows like $\delta^2/2$, so it is negligible for small corrections. It matters if the vehicle sits at a large tilt for a long time — one reason to fix a center-of-mass offset with ballast rather than hold a standing gimbal angle.

**Lateral force.** $F\sin\delta$ shoves the whole vehicle sideways. On a $400\,\mathrm{t}$ stage, a $6^\circ$ tilt of $5\,\mathrm{MN}$ gives $5\times 10^6 \times 0.10453 = 5.23\times 10^5\,\mathrm{N}$, and dividing by $4\times 10^5\,\mathrm{kg}$ gives $1.31\,\mathrm{m/s^2}$ sideways. Mind the direction. To pitch the nose *up*, the tail must swing *down*, so the engine pushes the tail down. For a moment the whole vehicle is pushed down — the wrong way — before the rotation takes over and the tilted thrust carries it up. A response that starts off the wrong way is called **[[non-minimum-phase|wrong-way-first]]**, and it limits how hard guidance can command sideways corrections.

::: example Control authority of a first stage
A first stage makes $F = 5.0\,\mathrm{MN}$. Its gimbal pivot sits $L = 18\,\mathrm{m}$ behind the center of mass. Its pitch inertia is $I = 1.5\times 10^8\,\mathrm{kg\,m^2}$. The gimbal travels $\pm 6^\circ$ at up to $8\,^\circ/\mathrm{s}$.

**Maximum torque.** Multiply thrust, arm and the sine of the largest tilt:

$$
T_{max} = 5.0\times 10^6 \times 18 \times \sin 6^\circ = 9.0\times 10^7 \times 0.10453 = 9.41\times 10^6\,\mathrm{N\,m}.
$$

**Maximum angular acceleration.** Divide by the inertia: $9.41\times 10^6/1.5\times 10^8 = 6.27\times 10^{-2}\,\mathrm{rad/s^2}$. Times $180/\pi$, that is $3.59\,^\circ/\mathrm{s^2}$. A four-hundred-tonne vehicle can be spun up at three and a half degrees per second, every second — sluggish next to an airplane, plenty for a slow pitch-over.

**Run it backward**, which is how the formula is used in practice. A pitch acceleration of $0.3\,^\circ/\mathrm{s^2} = 5.24\times 10^{-3}\,\mathrm{rad/s^2}$ needs torque $I\ddot{\theta} = 1.5\times 10^8 \times 5.24\times 10^{-3} = 7.85\times 10^5\,\mathrm{N\,m}$ ($\ddot{\theta}$, "theta double-dot", is the angular acceleration). That takes

$$
\delta = \arcsin\frac{7.85\times 10^5}{5.0\times 10^6 \times 18} = \arcsin(8.73\times 10^{-3}) = 0.500^\circ .
$$

Half a degree for the nominal pitch program. The other five and a half degrees are reserve: for wind, for a thrust misalignment, for a center-of-mass offset, and for an engine-out, where the remaining engines must steer and also cancel the lopsided thrust of the missing one.
:::

## What it is fighting: aerodynamic instability

A dart flies straight because its feathers sit at the back. Air pushing on the tail swings it back into line. A rocket is a tube with a pointed nose and nothing at the back — a dart thrown backward. The point where the air's sideways push effectively acts, the **[[center of pressure|cp-cm]]**, sits ahead of the center of mass for most of the climb. So a small **angle of attack** $\alpha$ ("alpha", the angle between the vehicle's axis and the oncoming air) makes a sideways force that pushes the nose *farther* off. The vehicle is **statically unstable**: left alone, any small error grows.

Model that sideways (normal) force as

$$
N = \bar{q}\,S\,C_{N\alpha}\,\alpha .
$$

Here $\bar{q} = \tfrac{1}{2}\rho v^2$ ("q-bar") is the **[[dynamic pressure|max-q]]**, from air density $\rho$ and speed $v$. $S$ is a reference area, usually the body's cross-section. $C_{N\alpha}$ ("C N alpha") is the normal-force coefficient slope — how much force per radian of $\alpha$ — about $2$ per radian for a slender body. If the center of pressure is a distance $d$ ahead of the center of mass, the upsetting torque is $T_a = N d = \bar{q}SC_{N\alpha}d\,\alpha$. Newton's law for rotation then gives

$$
I\ddot{\alpha} = \bar{q}\,S\,C_{N\alpha}\,d\,\alpha \quad\Longrightarrow\quad \ddot{\alpha} = k\alpha, \qquad k = \frac{\bar{q}SC_{N\alpha}d}{I} > 0 .
$$

"The angular acceleration is a positive number times the angle" means the bigger the error, the harder it is pushed to grow. That is exponential growth: $\alpha$ grows like $e^{\sqrt{k}\,t} = e^{t/\tau}$, with **time constant** $\tau = 1/\sqrt{k}$ ("tau"). It doubles every $\tau\ln 2$ seconds. That doubling time is the most important number for the ascent controller: the loop must react far faster than the vehicle can double its angle of attack.

::: note Why it has to be true
Try $\alpha = e^{st}$ in $\ddot{\alpha} = k\alpha$. Each time derivative brings down a factor $s$, so $s^2 e^{st} = k e^{st}$, and $s^2 = k$, giving $s = +\sqrt{k}$ or $s = -\sqrt{k}$. The general motion is $\alpha = A e^{\sqrt{k}\,t} + B e^{-\sqrt{k}\,t}$. The second part dies away and the first grows, so after a moment only growth is left. A vehicle released at rest with angle $\alpha_0$ follows $\alpha = \alpha_0\cosh(t/\tau)$ — a slightly slower start (it doubles in $1.32\tau$ rather than $0.69\tau$), then the same runaway.
:::

::: example Max-Q authority margin and divergence time
The same stage is $3.7\,\mathrm{m}$ across, so $S = \pi(1.85)^2 = 10.75\,\mathrm{m^2}$. At **max-Q**, the moment of highest dynamic pressure, $\bar{q} = 33\,\mathrm{kPa}$. The center of pressure is $d = 12\,\mathrm{m}$ ahead of the center of mass, and $C_{N\alpha} = 2.0$ per radian.

**At $2^\circ$ angle of attack** ($0.0349\,\mathrm{rad}$): $N = 33\,000 \times 10.75 \times 2.0 \times 0.0349 = 2.48\times 10^4\,\mathrm{N}$. Times $d = 12\,\mathrm{m}$: $T_a = 2.97\times 10^5\,\mathrm{N\,m}$. The **authority margin** — available control torque over the torque to beat — is $9.41\times 10^6/2.97\times 10^5 = 31.6$. Holding it takes only $\arcsin(2.97\times 10^5/9.0\times 10^7) = 0.19^\circ$ of gimbal.

**At $5^\circ$** — what a $30\,\mathrm{m/s}$ crosswind makes at $400\,\mathrm{m/s}$, since $\arctan(30/400) = 4.3^\circ$, plus the vehicle's own pointing error — the torque is $2.5$ times larger, $7.43\times 10^5\,\mathrm{N\,m}$. The margin falls to $12.7$ and the trim tilt is $0.47^\circ$.

**Divergence.** $k = 33\,000 \times 10.75 \times 2.0 \times 12/1.5\times 10^8 = 5.68\times 10^{-2}\,\mathrm{s^{-2}}$. So $\tau = 1/\sqrt{0.0568} = 4.20\,\mathrm{s}$, and the doubling time is $4.20 \times 0.693 = 2.91\,\mathrm{s}$. Once the growing mode takes over, an uncontrolled vehicle at $2^\circ$ reaches $4^\circ$ in about three seconds and $16^\circ$ (three doublings) in under nine — far beyond the loads the structure is built for at max-Q. The loop needs a bandwidth many times $1/\tau = 0.24\,\mathrm{rad/s}$. In practice the rigid-body **crossover** (roughly, the frequency where the loop stops responding strongly) sits around $1$ to $3\,\mathrm{rad/s}$. That is why bending modes and propellant **[[slosh|slosh-word]]**, which live not far above, become the binding limits on the design.

**Sanity check.** A margin of $12$ to $30$ looks comfortable, and it is not the whole story. The same gimbal must fly the pitch program, trim a thrust misalignment, counter a center-of-mass offset and hold a load-relief angle, all at once. The margin against the air alone is necessary, not the design case.
:::

## The gimbal as a dynamic system

The gimbal is not an instant, perfect gain. A command $\delta_{cmd}$ becomes an actual tilt $\delta$ through an actuator — hydraulic or electric. It behaves like a spring-and-damper system (a second-order system) with two hard limits bolted on:

$$
\ddot{\delta} + 2\zeta_a\omega_a\dot{\delta} + \omega_a^2\delta = \omega_a^2\,\delta_{cmd},
\qquad \lvert\delta\rvert \le \delta_{max},\qquad \lvert\dot{\delta}\rvert \le \dot{\delta}_{max} .
$$

$\omega_a$ ("omega sub a") is the actuator's natural frequency and $\zeta_a$ ("zeta sub a") its damping. Typical $\omega_a$ is 2 to 5 Hz, with $\zeta_a$ around $0.5$ to $0.7$. That puts the actuator above the rigid-body crossover, but not far above. At a crossover of $1\,\mathrm{rad/s}$, a 2 Hz actuator already adds about $6^\circ$ of **[[phase lag|phase-lag]]** (it answers a little late), and a 5 Hz one about $2.5^\circ$. Small — but it stacks with sensor lag, filter lag and computer delay, and together they eat the phase margin that the unstable vehicle makes so precious.

### The deflection limit

$\lvert\delta\rvert \le \delta_{max}$ caps the torque at $FL\sin\delta_{max}$. When a maneuver asks for more, the loop is effectively cut. The requested torque never reaches the vehicle, the error keeps growing, and any integrator in the controller winds up. That is the next lesson's subject.

### The rate limit, and why it decides the bandwidth

$\lvert\dot{\delta}\rvert \le \dot{\delta}_{max}$ ("delta-dot max", the fastest the gimbal can swing) is the more interesting limit, because it depends on the size of the motion. Wave your hand side to side: small waves can be fast, big sweeps must be slow. Ask the gimbal to follow $\delta(t) = A\sin\omega t$. Its rate is $A\omega\cos\omega t$, which peaks at $A\omega$. So the command can be followed only while

$$
A\,\omega \le \dot{\delta}_{max} \quad\Longrightarrow\quad \omega \le \frac{\dot{\delta}_{max}}{A}.
$$

There is no single "gimbal bandwidth". There is a **[[hyperbola|rate-hyperbola]]** of amplitude against frequency, and the actuator lives under it.

::: example What $8\,^\circ/\mathrm{s}$ buys
For the stage above, $\dot{\delta}_{max} = 8\,^\circ/\mathrm{s} = 0.1396\,\mathrm{rad/s}$. Divide by each amplitude (degrees over degrees, so the answer is in $\mathrm{rad/s}$); divide by $2\pi$ for hertz:

| Deflection amplitude | Highest trackable frequency |
| --- | --- |
| $0.5^\circ$ | $16.0\,\mathrm{rad/s}$ ($2.55\,\mathrm{Hz}$) |
| $1^\circ$ | $8.0\,\mathrm{rad/s}$ ($1.27\,\mathrm{Hz}$) |
| $3^\circ$ | $2.67\,\mathrm{rad/s}$ ($0.42\,\mathrm{Hz}$) |
| $6^\circ$ | $1.33\,\mathrm{rad/s}$ ($0.21\,\mathrm{Hz}$) |

Check one row: $8/0.5 = 16$. So the vehicle can make small fast corrections or large slow ones, never large fast ones. A loop crossing over at $2\,\mathrm{rad/s}$ is fine while the gimbal amplitude there stays under $8/2 = 4^\circ$. A gust demanding $6^\circ$ at $2\,\mathrm{rad/s}$ cannot be flown: the actuator will rate-saturate.

Rate saturation is worse than it sounds. A rate-limited actuator does not only give a smaller output — it gives a *late* one. A sine command it can only follow as a **[[triangle wave|triangle-wave]]** comes out lagging, and that lag grows toward $90^\circ$ as the saturation deepens. On a vehicle that is already unstable and depends on phase margin, tens of degrees of extra lag is how a divergent oscillation starts — the pilot-induced-oscillation mechanism, with the autopilot in the pilot's seat. So ascent autopilots keep the gimbal amplitude at crossover well inside the rate-limit hyperbola, and load-relief logic exists partly to keep gust responses out of it.
:::

## Two complications worth knowing

**The engine has mass.** Swinging a two-tonne engine about its gimbal with angular acceleration $\ddot{\delta}$ pushes back on the vehicle with a reaction torque of roughly $-J_e\ddot{\delta}$ ($J_e$ is the engine's inertia about the pivot), plus a sideways force at the mount. For a sine motion, $\ddot{\delta}$ grows like $\omega^2$, while the thrust torque does not depend on $\omega$ at all. So the reaction is negligible at low frequency and grows fast. Near the first bending modes it is no longer small, and it acts with the *opposite* sign to the thrust torque. Above a certain frequency the vehicle first rotates the wrong way. Engineers call it **[[tail wags dog|tail-wags-dog]]**. In control terms it puts a pair of zeros into the response from gimbal command to rate gyro, at the frequency where the two torques cancel, and that sets a hard ceiling on bandwidth that no amount of gain can lift.

**A centerline engine cannot roll the vehicle.** A single engine whose thrust line passes through the roll axis makes pitch and yaw torque, and exactly zero roll torque, because its arm about the roll axis is zero. Vehicles solve this by gimbaling several engines differently — tilting them sideways around the circle so their side forces form a couple about the centerline — or by carrying separate roll thrusters, or angled fixed vernier engines. It is a standard interview question, and a standard surprise when a single-engine upper stage needs a cold-gas system for roll alone.

::: warning The lever arm changes during the burn
$L$ is the distance from the gimbal to the center of mass, and the center of mass moves forward as propellant drains — on a first stage, by many meters over a two-and-a-half-minute burn. So $T_c = FL\sin\delta$ has a gain that changes with time. So does the instability $k$, which depends on $d$ (also moving) and on $\bar{q}$ (rising to max-Q, then falling). The inertia $I$ falls by a large factor too. An ascent autopilot is therefore **gain-scheduled** — its settings change with flight time or a measured quantity — and every margin in this lesson is quoted at one instant of one trajectory.
:::

::: warning Do not confuse the thrust loss with the steering
$F\cos\delta$ is what remains along the axis, and $F\sin\delta$ does the steering — but not by pushing the vehicle sideways. Over a normal ascent the net sideways impulse from gimbaling is small, because the tilt wobbles around a trim value. The steering comes from *rotating* the vehicle so the whole thrust vector points somewhere new. Sizing a trajectory correction from the sideways part alone underestimates the vehicle's authority by orders of magnitude.
:::

::: note Grid fins, and what replaces the gimbal
Once the engines shut down, the gimbal stops being an actuator. A returning booster coasting through the upper atmosphere has no thrust to point. It controls itself with cold-gas thrusters, then with aerodynamic surfaces — grid fins — as dynamic pressure builds, then with the gimbal again during the landing burn. Each handover changes the plant model, the authority and the bandwidth, and the autopilot must stay stable across all of them and through the switches.
:::

## Check yourself

::: check
An upper stage has $F = 800\,\mathrm{kN}$, $L = 6\,\mathrm{m}$, pitch inertia $2.0\times 10^6\,\mathrm{kg\,m^2}$ and a $\pm 4^\circ$ gimbal. Find the maximum control torque and angular acceleration, and the tilt needed to hold a $0.2\,\mathrm{MN\,m}$ disturbance torque.
:::

::: answer
Maximum torque: $T_{max} = 8.0\times 10^5 \times 6 \times \sin 4^\circ = 4.8\times 10^6 \times 0.069756 = 3.35\times 10^5\,\mathrm{N\,m}$.

Maximum angular acceleration: $3.35\times 10^5/2.0\times 10^6 = 0.167\,\mathrm{rad/s^2} = 9.59\,^\circ/\mathrm{s^2}$. Far nimbler than the first stage: a shorter arm and less thrust, but far less inertia.

The disturbance: $2.0\times 10^5\,\mathrm{N\,m}$ needs $\delta = \arcsin\bigl(2.0\times 10^5/4.8\times 10^6\bigr) = \arcsin(0.04167) = 2.39^\circ$. That uses $60\,\%$ of the travel for trim alone, leaving $1.6^\circ$ for control — uncomfortably little. In practice you would attack a disturbance this large at its source, by aligning the engine better or moving ballast, rather than soak it up with the gimbal.
:::

::: check
The same first stage is at max-Q with $\tau = 4.2\,\mathrm{s}$. A software change adds $40\,\mathrm{ms}$ of computer delay to a loop that crosses over at $2\,\mathrm{rad/s}$. How much phase margin does that cost, and why does it matter more here than on a stable vehicle?
:::

::: answer
A pure delay $T_d$ adds phase lag $\omega T_d$ radians. At $\omega = 2\,\mathrm{rad/s}$ and $T_d = 0.040\,\mathrm{s}$: $2 \times 0.040 = 0.08\,\mathrm{rad} = 4.6^\circ$. Small on its own.

It matters more on an unstable vehicle for two reasons. First, the loop *must* hold it up — there is no gentle failure where control is merely sloppy. Losing stability means losing the vehicle within a few time constants, here a few seconds. Second, an unstable vehicle sets a *lower* limit on bandwidth, on top of the usual upper limit from bending and slosh. The designer is squeezed from both sides and typically has only $30^\circ$ to $40^\circ$ of phase margin to spend. Giving $4.6^\circ$ of it to a software delay, on top of actuator, sensor and filter lag, is a real fraction of the budget — and delays add up, and are easy to add by accident.
:::

::: check
A gust needs the gimbal to swing $\pm 2^\circ$ at $3\,\mathrm{rad/s}$. With $\dot{\delta}_{max} = 8\,^\circ/\mathrm{s}$, can the actuator follow? What would you change if it could not?
:::

::: answer
The peak rate needed is $A\omega = 2^\circ \times 3 = 6\,^\circ/\mathrm{s}$, inside the $8\,^\circ/\mathrm{s}$ limit — so yes, with $25\,\%$ margin. At $2^\circ$ amplitude the limiting frequency is $8/2 = 4\,\mathrm{rad/s}$.

At $\pm 3^\circ$ and $3\,\mathrm{rad/s}$ the demand would be $9\,^\circ/\mathrm{s}$. The actuator would rate-saturate, adding phase lag and risking a divergent oscillation on an already unstable vehicle. Options, roughly in order of preference: cut the *demand* with load-relief logic, which lets the vehicle turn slightly into the gust instead of fighting it; lower the controller gain at that frequency with a filter, accepting more attitude error; or buy a faster actuator, which costs hydraulic power, mass and money, and has to be decided years earlier.
:::

::: check
Why does a launch vehicle's gimbal authority margin look enormous — 10 or 30 times the aerodynamic torque — while engineers still call ascent control tight?
:::

::: answer
Because the aerodynamic torque at a nominal angle of attack is not the design case. At the same time the gimbal must supply: the nominal pitch-program torque; trim against a thrust line off by a fraction of a degree; trim against a sideways center-of-mass offset from manufacturing and propellant distribution; the response to the worst-case wind, which can give far more than a couple of degrees of angle of attack; and, on a multi-engine stage, the large lopsided torque of an engine-out. Stack those and the nominal 30-to-1 becomes a few to one.

And torque is not the only currency. The *bandwidth* margin is separately tight, squeezed between the unstable pole below and the first bending and slosh frequencies above. A vehicle can have plenty of torque and still be hard to control — the usual situation.
:::

::: check
Show that for small $\delta$ the fractional axial thrust loss is about $\delta^2/2$, and evaluate it for a $2^\circ$ trim held for a whole $150\,\mathrm{s}$ first-stage burn.
:::

::: answer
The axial part is $F\cos\delta$, so the fractional loss is $1 - \cos\delta$. Expanding, $\cos\delta = 1 - \delta^2/2 + \delta^4/24 - \cdots$, so $1 - \cos\delta \approx \delta^2/2$ for small $\delta$ in radians.

At $\delta = 2^\circ = 0.034907\,\mathrm{rad}$: $\delta^2/2 = 0.034907^2/2 = 6.09\times 10^{-4}$, or $0.061\,\%$. Held for $150\,\mathrm{s}$, it costs that fraction of the stage's axial impulse — like losing $150 \times 6.09\times 10^{-4} = 0.09\,\mathrm{s}$ of burn, tens of kilograms of performance on a large booster. Small, but worth removing. A standing trim is paid for every second of every flight, while a tilt wobbling about zero costs almost nothing: the loss goes with the *square*, so it averages to the mean square of a small wobble rather than the square of a standing offset.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $T_c = FL\sin\delta \approx FL\delta$ | Gimbal control torque; $L$ is gimbal to center of mass |
| $F(1 - \cos\delta) \approx F\delta^2/2$ | Axial thrust loss; $0.55\,\%$ at $6^\circ$ |
| $F\sin\delta$ | Lateral force; pushes the vehicle the "wrong" way before it rotates |
| First-stage example | $5\,\mathrm{MN}$, $L = 18\,\mathrm{m}$, $\pm 6^\circ$: $9.41\times 10^6\,\mathrm{N\,m}$, $3.59\,^\circ/\mathrm{s^2}$ |
| $T_a = \bar{q}SC_{N\alpha}d\,\alpha$ | Upsetting aerodynamic torque; $C_{N\alpha} \approx 2$ per radian for a slender body |
| $\ddot{\alpha} = k\alpha$, $k = \bar{q}SC_{N\alpha}d/I$ | Open-loop divergence; $\tau = 1/\sqrt{k} = 4.2\,\mathrm{s}$, doubling in $2.9\,\mathrm{s}$ at max-Q |
| Authority margin | $31.6$ at $2^\circ$ angle of attack, $12.7$ at $5^\circ$ — before wind, trim and engine-out |
| $\ddot{\delta} + 2\zeta_a\omega_a\dot{\delta} + \omega_a^2\delta = \omega_a^2\delta_{cmd}$ | Actuator model, 2–5 Hz, plus angle and rate limits |
| $\omega \le \dot{\delta}_{max}/A$ | Rate-limit hyperbola: small and fast, or large and slow, never both |
| Rate saturation | Adds phase lag toward $90^\circ$; the usual route to a divergent ascent oscillation |
| Tail wags dog | Engine inertia reaction grows as $\omega^2$ and adds zeros that cap bandwidth |

The next lesson takes the two limits met here — an angle limit and a rate limit — and treats saturation as a subject of its own: what it does to a feedback loop, why an integrator makes it much worse, and the standard ways to keep a controller sane when its actuator has run out of travel.

::: context gimbal-word Where "gimbal" comes from
A gimbal is a pivot mount that lets something tilt freely. The word comes from an old English "gimmal", a ring made of linked hoops, from the Latin for "twins". Ships' compasses have sat in gimbals for centuries so they stay level as the ship rolls. A rocket engine's gimbal is usually a ball-like joint at the top of the engine, pushed by two actuators set at right angles — one for pitch, one for yaw.
:::

::: context thrust-split Splitting the thrust into two parts
Tilt the thrust arrow by $\delta$ and it becomes the long side of a right triangle. The part along the rocket is $F\cos\delta$ and the part across it is $F\sin\delta$. Only the across part makes torque about the center of mass, with arm $L$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="80" width="220" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="40,80 10,95 40,110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="120" cy="95" r="5" fill="#1f2a44"/>
  <text x="120" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">center of mass</text>
  <circle cx="260" cy="95" r="4" fill="#b4232c"/>
  <text x="262" y="75" font-size="11" fill="#b4232c">gimbal</text>
  <line x1="125" y1="125" x2="260" y2="125" stroke="#6c7a93" stroke-width="1"/>
  <text x="192" y="140" font-size="12" text-anchor="middle" fill="#6c7a93">L</text>
  <line x1="340" y1="95" x2="270" y2="95" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="340" y1="160" x2="266" y2="98" stroke="#b4232c" stroke-width="3"/>
  <polygon points="262,95 275,97 268,105" fill="#b4232c"/>
  <line x1="340" y1="160" x2="340" y2="95" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="300" y="150" font-size="12" fill="#b4232c">F</text>
  <text x="356" y="178" font-size="11" text-anchor="end" fill="#1d6fd1">F sin δ</text>
  <text x="305" y="88" font-size="11" text-anchor="middle" fill="#1d6fd1">F cos δ</text>
  <path d="M290,95 A30,30 0 0 1 283,114" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="292" y="114" font-size="11" fill="#1f2a44">δ</text>
</svg>
```

The picture exaggerates $\delta$; real gimbals tilt only a few degrees.
:::

::: context wrong-way-first Why "non-minimum-phase" means "wrong way first"
Back a car with a trailer and you will have met this. To swing the trailer left, the car first has to go right. Systems that start by moving the wrong way are called non-minimum-phase. A controller cannot fix this by reacting harder: react too hard and the wrong-way start gets bigger. It has to be patient, which limits how fast the loop can be. The same idea returns in the control-theory modules as a zero in the right half of the complex plane.
:::

::: context cp-cm A dart thrown backward
An arrow is stable because its feathers put the center of pressure behind the center of mass: when it turns, the air pushes the tail back into line. A rocket's pointed nose and bare tail put the center of pressure ahead of the center of mass, so the air pushes it further off line. Early rockets and some small ones add fins to move the center of pressure back; big launch vehicles skip them and steer with the engine instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <polygon points="30,65 70,50 300,50 300,80 70,80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="120" cy="65" r="6" fill="#b4232c"/>
  <text x="120" y="38" font-size="11" text-anchor="middle" fill="#b4232c">center of pressure</text>
  <circle cx="200" cy="65" r="6" fill="#1f2a44"/>
  <text x="200" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">center of mass</text>
  <line x1="126" y1="112" x2="194" y2="112" stroke="#6c7a93" stroke-width="1"/>
  <text x="160" y="125" font-size="11" text-anchor="middle" fill="#6c7a93">d</text>
  <line x1="120" y1="110" x2="120" y2="84" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="120,80 115,90 125,90" fill="#b4232c"/>
  <text x="300" y="30" font-size="11" text-anchor="end" fill="#1f2a44">nose pushed further off line</text>
</svg>
```
:::

::: context max-q The hardest moment of the climb
Dynamic pressure $\tfrac{1}{2}\rho v^2$ measures how hard the air hits the vehicle. Low down, the air is thick but the rocket is slow. High up, it is fast but the air is thin. In between is a peak, **max-Q**, typically about a minute after liftoff, where air loads are greatest. Launch commentators call it out; vehicles often throttle down through it to limit the loads.
:::

::: context slosh-word Propellant sloshing
Carry a full bowl of soup and it sloshes. The hundreds of tonnes of liquid in a rocket's tanks do the same, rocking at a natural frequency of around a hertz or less. That moving mass pushes on the vehicle, and if the autopilot happens to push at the same frequency it can pump the slosh up. Tanks carry baffles (internal rings) to damp it, and the control filters are shaped to stay away from it.
:::

::: context phase-lag Answering late
If you are asked to wave in step with a metronome and you always move a little late, you are lagging in phase. Measured as a fraction of one full back-and-forth, that lateness is the phase lag in degrees: a quarter-cycle late is $90^\circ$. A feedback loop needs to stay well away from being half a cycle ($180^\circ$) late at crossover, or its corrections arrive at exactly the wrong moment and feed the error. The distance from $180^\circ$ is the **phase margin**.
:::

::: context rate-hyperbola Small and fast, or big and slow
Every point under the curve $A\omega = \dot{\delta}_{max}$ is a swing the gimbal can follow. Points above it are too big for how fast they are. Doubling the amplitude halves the fastest frequency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M60,170 L60,40 L83,40 L94,83 L112,112 L129,127 L164,141 L198,148 L267,156 L336,159 L336,170 Z" fill="#8fb8f0" opacity="0.6"/>
  <polyline points="83,40 94,83 112,112 129,127 164,141 198,148 267,156 336,159" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="20" x2="60" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">frequency ω (rad/s)</text>
  <text x="20" y="100" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 20 100)">amplitude A (deg)</text>
  <g font-size="11" fill="#1f2a44">
    <text x="56" y="44" text-anchor="end">6</text><text x="56" y="152" text-anchor="end">1</text>
    <text x="83" y="184" text-anchor="middle">1.33</text><text x="198" y="184" text-anchor="middle">8</text><text x="336" y="184" text-anchor="middle">16</text>
  </g>
  <text x="240" y="90" font-size="12" fill="#b4232c" text-anchor="middle">rate-saturated</text>
  <text x="100" y="162" font-size="12" fill="#1f2a44">trackable</text>
</svg>
```

Axes are drawn to scale for the $8\,^\circ/\mathrm{s}$ gimbal: $A$ from $0$ to $6^\circ$ (up), $\omega$ from $0$ to $16\,\mathrm{rad/s}$ (across).
:::

::: context triangle-wave Why rate limiting makes the output late
Ask a rate-limited gimbal for a big, fast sine wave. It swings at its top speed toward the command, but never catches it. It reverses only when the command has already turned around and crossed back past it. The result is a triangle wave that is smaller than the command and peaks later. The deeper the saturation, the smaller and later the triangle, until it is nearly a quarter-cycle ($90^\circ$) behind.
:::

::: context tail-wags-dog Tail wags dog
The name says it: the thing that should be moved (the tail, the engine) moves the thing it is attached to (the dog, the rocket). A big engine is several tonnes. Swing it fast, and the push-back from accelerating that mass can outweigh the steering torque from its thrust, so the rocket twitches the wrong way first. Designers check where this crossover frequency sits and keep the autopilot's bandwidth well below it.
:::
