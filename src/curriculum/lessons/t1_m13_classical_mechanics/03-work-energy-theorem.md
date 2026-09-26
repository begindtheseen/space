---
id: l03-work-energy-theorem
title: Work, kinetic energy and power
minutes: 23
covers:
  - the work-energy theorem
---

Push a stalled car along a flat road. The harder you push, and the farther you push it, the faster it is rolling at the end. Push for twice the distance with the same force and you have given it twice the "oomph". That oomph is energy, and the push-times-distance that delivers it is work.

Lesson 2 added up Newton's second law over *time* and got impulse and momentum. This lesson adds it up over *distance* and gets work and kinetic energy. The two tools answer different questions. Momentum tells you what happens when things collide, separate or push each other, without caring what happens in between. Energy tells you how much a force achieved along a path, whether a maneuver is affordable, and — for a rocket — why the same burn buys thirty times more kinetic energy at orbital speed than on the pad.

For a GNC engineer the work-energy theorem is mostly a check and a shortcut. A check, because a simulation that breaks it has a bug: an orbit program whose energy drifts is integrating badly, and an ascent model that gains energy faster than the engines supply it has a sign error. A shortcut, because it links speed directly to position, so you can answer "how fast at the bottom?" or "how much thrust to stop in three kilometers?" without integrating anything. Everything here is for a particle, or a body whose overall motion is what you care about. Lesson 5 extends it to systems of particles, and lesson 4 covers the special forces — gravity among them — whose work depends only on where you start and finish.

## Work done by a force

Pull a wagon by its handle. If the handle points straight along the road, all of your pull helps. If you pull up at a steep angle, part of your effort just lifts the handle and does nothing for the wagon's speed. And if you carry a heavy backpack across a flat room at steady speed, your upward hold on it does nothing to move it across the room.

So what counts is the part of the force *along the motion*, times the distance moved. When a force $\mathbf{F}$ acts on a particle while it moves through a tiny displacement $d\mathbf{r}$, the **work** done by the force is the number

$$
dW = \mathbf{F} \cdot d\mathbf{r} = F\,|d\mathbf{r}|\cos\theta,
$$

where $\theta$ is the angle between the force and the displacement. The dot, read "F dot d r", is the **[[dot product|dot-product]]**: it multiplies the size of one vector by the part of the other that lies along it. Over a whole path $C$ from point $A$ to point $B$, add up the little pieces. That sum is a **line integral**:

$$
W_{AB} = \int_C \mathbf{F} \cdot d\mathbf{r} = \int_{t_A}^{t_B} \mathbf{F} \cdot \mathbf{v}\,dt.
$$

The second form uses $d\mathbf{r} = \mathbf{v}\,dt$ (the distance moved in a moment is velocity times that moment). It is how you compute work inside a simulation: add up $\mathbf{F} \cdot \mathbf{v}$ times the time step, step after step. The unit is the **[[joule|joule]]**: $1\,\mathrm{J} = 1\,\mathrm{N\,m} = 1\,\mathrm{kg\,m^2/s^2}$.

Three features of this definition do a lot of work later.

- **Work is a plain number (a scalar).** It has a sign but no direction. A force does positive work when it has a part along the motion, negative work when it opposes the motion, and zero work when it is perpendicular.
- **Work belongs to one force, on one body, along one path.** "The work" without those three is meaningless. In general the value depends on the path, not only on its ends. Lesson 4 is about the forces for which it does not.
- **A force always perpendicular to the velocity does no work.** The pull of a string whirling a ball in a circle, the push of a smooth track, the magnetic force on a moving charge, and — crucially — gravity on a body in a *[[circular orbit|circle-no-work]]* all belong here. Their work is zero because $\mathbf{F} \cdot \mathbf{v} = 0$ at every instant, not because they are small.

## The work-energy theorem

Now the main result. The derivation takes four lines, and each is worth seeing.

Take a particle of constant mass $m$ under net force $\mathbf{F}$ in an inertial frame, so $\mathbf{F} = m\,d\mathbf{v}/dt$. Dot both sides with $\mathbf{v}$:

$$
\mathbf{F} \cdot \mathbf{v} = m\,\mathbf{v} \cdot \frac{d\mathbf{v}}{dt} = \frac{d}{dt}\left(\tfrac{1}{2} m\,\mathbf{v} \cdot \mathbf{v}\right) = \frac{d}{dt}\left(\tfrac{1}{2} m v^2\right).
$$

The middle step is the [[product rule run backward|product-rule-dot]]: $\frac{d}{dt}(\mathbf{v} \cdot \mathbf{v}) = 2\,\mathbf{v} \cdot \dot{\mathbf{v}}$, so half of it is $\mathbf{v} \cdot \dot{\mathbf{v}}$. The last step uses $\mathbf{v} \cdot \mathbf{v} = v^2$, the speed squared. The quantity that appeared is the **kinetic energy** — the energy of motion:

$$
K = \tfrac{1}{2} m v^2 = \frac{p^2}{2m},
$$

in joules. (The second form uses $p = mv$.) Now add up both sides from time $t_1$ to $t_2$. Adding up a rate of change gives the total change, so the right side becomes $K_2 - K_1$, and the left side is the work done by the net force:

$$
W_{\mathrm{net}} = \int_{t_1}^{t_2} \mathbf{F} \cdot \mathbf{v}\,dt = K_2 - K_1 = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2.
$$

This is the **work-energy theorem**: the work done by the net force on a particle equals the change in its kinetic energy. The net force is the sum of all the separate forces, and the dot product spreads over a sum. So $W_{\mathrm{net}}$ is also the sum of the works done by each force on its own. You may work out gravity's work, thrust's work and drag's work one at a time, then add.

What the theorem is, and is not: it follows exactly from the second law, so it is never "extra physics". Anything it tells you, integrating $\mathbf{F} = m\mathbf{a}$ would too. What it offers is a link between speed and position that skips time entirely. And only *speed* appears. Kinetic energy knows nothing about direction, so the theorem alone cannot tell you which way the particle is heading — only how fast.

::: key
The work-energy theorem: $W_{\mathrm{net}} = \Delta KE = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$, where $W_{\mathrm{net}} = \int \mathbf{F}_{\mathrm{net}} \cdot d\mathbf{r}$ is the work done by the net force along the path actually followed, and $KE$ (written $K$ in this lesson) is $\tfrac{1}{2} m v^2$. It is Newton's second law integrated over distance, and it holds in any inertial frame.
:::

::: example A landing burn, by energy
A 30 t first stage is falling straight down at $250\,\mathrm{m/s}$ when it is $3.0\,\mathrm{km}$ above the pad. It must arrive at rest. Take $g = 9.81\,\mathrm{m/s^2}$, ignore drag, and treat the mass as constant (the propellant burned is a few percent of the total). What average thrust is needed?

**The energy that must go.** Two forces act: gravity and thrust. The kinetic energy must fall from $\tfrac{1}{2} \times 30{,}000 \times 250^2 = 9.375 \times 10^{8}\,\mathrm{J}$ to zero. So $W_{\mathrm{net}} = -9.375 \times 10^{8}\,\mathrm{J}$.

**Gravity's work.** Gravity points down and the stage moves down, so gravity does *positive* work: $W_g = m g h = 30{,}000 \times 9.81 \times 3000 = 8.829 \times 10^{8}\,\mathrm{J}$. Gravity is adding energy that the thrust must also remove.

**Thrust's work.** The works add to $W_{\mathrm{net}}$, so $W_T = W_{\mathrm{net}} - W_g = -9.375 \times 10^{8} - 8.829 \times 10^{8} = -1.820 \times 10^{9}\,\mathrm{J}$. Thrust points up while the stage moves down, so its work is negative, as it should be. Spread over the $3000\,\mathrm{m}$ path, the average thrust is

$$
\bar{T} = \frac{|W_T|}{h} = \frac{1.820 \times 10^{9}}{3000} \approx 6.07 \times 10^{5}\,\mathrm{N},
$$

about 72 % of one Merlin 1D's sea-level thrust.

**Sanity check, by another route.** A steady slowdown from $250\,\mathrm{m/s}$ to zero over $3000\,\mathrm{m}$ needs deceleration $a = v^2/(2h) = 250^2/6000 \approx 10.4\,\mathrm{m/s^2}$. Thrust must supply that plus hold up the weight: $T = m(a + g) = 30{,}000 \times (10.42 + 9.81) \approx 6.07 \times 10^{5}\,\mathrm{N}$. Same answer — but the energy route never needed the deceleration or the time.
:::

## Power

Two people carry the same box up the same stairs. One strolls, one sprints. They do the same work; the sprinter does it faster. How fast work gets done is **power**:

$$
P = \frac{dW}{dt} = \mathbf{F} \cdot \mathbf{v},
$$

in watts, $1\,\mathrm{W} = 1\,\mathrm{J/s}$. The work-energy theorem in rate form is $P_{\mathrm{net}} = dK/dt$: the net power delivered to a particle is the rate its kinetic energy grows.

Power is where force and energy part ways for a rocket. Thrust is set by the engine — mass flow times effective exhaust velocity, $T = \dot{m} v_e$ from lesson 2 — and does not depend on how fast the vehicle is going. But the *power* thrust delivers to the vehicle is $T v$, which grows with speed. On the pad, with $v = 0$, the engines give enormous force and zero power to the vehicle. At orbital speed the same thrust delivers $T \times 7700\,\mathrm{m/s}$.

Where does the energy go on the pad, when the vehicle gets none? Into the exhaust. The exhaust leaves at speed $v_e$ relative to the vehicle, and the kinetic energy it carries off each second — the **jet power** — is

$$
P_{\mathrm{jet}} = \tfrac{1}{2}\,\dot{m}\,v_e^2.
$$

This is essentially the rate at which the engine turns chemical energy into motion, and it is fixed by the engine. How it is split between vehicle and exhaust depends on the vehicle's speed. Follow the bookkeeping for a short time $dt$ in an inertial frame where the vehicle moves at speed $v$:

- **The vehicle** gains kinetic energy at rate $T v = \dot{m} v_e v$.
- **The exhaust.** A parcel of mass $\dot{m}\,dt$ was riding along at $v$. Now it moves at $v - v_e$. Its kinetic energy changed by $\tfrac{1}{2}\dot{m}\,dt\,[(v - v_e)^2 - v^2] = \dot{m}\,dt\,(\tfrac{1}{2} v_e^2 - v v_e)$. (Expand the square: $v^2 - 2 v v_e + v_e^2 - v^2$, then halve.)

Add the two rates:

$$
\dot{m} v_e v + \dot{m}\left(\tfrac{1}{2} v_e^2 - v v_e\right) = \tfrac{1}{2}\dot{m} v_e^2.
$$

The $v v_e$ terms cancel, and the total is $P_{\mathrm{jet}}$ in every inertial frame, as it must be. But the vehicle's share is $\dot{m} v_e v \div \tfrac{1}{2}\dot{m} v_e^2 = 2v/v_e$ of the total, and it grows without limit. At $v = v_e/2$ the share is exactly 1: the exhaust leaves as fast backward as it was moving forward, its kinetic energy is unchanged, and *all* the released energy goes to the vehicle. Faster than that, the vehicle gains *more* than the engine releases. The extra is kinetic energy the propellant already had, which the exhaust gives up because it is left behind moving slower than it was. At $v = v_e$ the exhaust is left at rest and has given up all of it. This is the **[[Oberth effect|oberth]]**, and it is why a burn is worth most where the vehicle moves fastest — at perigee, not apogee.

::: example One Merlin's power budget
A Merlin 1D at sea level makes $T = 845\,\mathrm{kN}$ with $v_e \approx 2766\,\mathrm{m/s}$ and $\dot{m} \approx 306\,\mathrm{kg/s}$ (lesson 2). Find its jet power, and the power it gives the vehicle at liftoff and at $2000\,\mathrm{m/s}$.

**Jet power.** $P_{\mathrm{jet}} = \tfrac{1}{2} \times 306 \times 2766^2 \approx 1.17 \times 10^{9}\,\mathrm{W}$ — about $1.17\,\mathrm{GW}$ (gigawatts, billions of watts) per engine. Nine engines make about $10.5\,\mathrm{GW}$, the output of [[several large power stations|gigawatts]].

**At liftoff,** $v = 0$, so the power to the vehicle is $T v = 0$. Every joule goes into the exhaust.

**At $2000\,\mathrm{m/s}$,** the power to the vehicle is $T v = 8.45 \times 10^{5} \times 2000 = 1.69 \times 10^{9}\,\mathrm{W}$. That is $2v/v_e = 2 \times 2000 / 2766 \approx 1.45$ times the jet power.

**Sanity check.** Is it OK for the vehicle to gain more than the engine releases? Yes — $2000\,\mathrm{m/s}$ is above $v_e/2 \approx 1383\,\mathrm{m/s}$. The exhaust ends up moving at $2000 - 2766 = -766\,\mathrm{m/s}$, slower in the inertial frame than the $2000\,\mathrm{m/s}$ it had while it was still propellant on board. The kinetic energy it lost is the extra the vehicle gained.
:::

## Kinetic energy depends on the frame; the theorem does not

Toss a tennis ball forward on a moving train. To you it moves gently. To someone on the platform it flies past at train speed plus your toss. Same ball, two different kinetic energies. One kilogram of payload in a 400 km orbit has $\tfrac{1}{2} \times 7700^2 \approx 2.96 \times 10^{7}\,\mathrm{J}$ of kinetic energy in ECI, and nearly zero in the frame of a servicing vehicle drifting beside it. Neither number is wrong; they answer different questions.

What survives a change of inertial frame is the *theorem*. In every inertial frame, the work done by the net force equals the change in kinetic energy measured in that frame. Both sides change together: when the frame moves at $\mathbf{u}$, each $d\mathbf{r}$ changes by $\mathbf{u}\,dt$, and the velocity inside $K$ changes by $\mathbf{u}$. One result to remember: the work done by a force, unlike the force itself, depends on the frame. So "the work done by thrust" only means something once you say which frame. Lesson 5 shows that for a system of particles one frame makes the bookkeeping cleanest — the center-of-mass frame.

## Work in one dimension and the speed-position shortcut

For motion along a line, with the net force known as a function of position, $F(x)$, the theorem reads

$$
\tfrac{1}{2} m v^2(x) = \tfrac{1}{2} m v_0^2 + \int_{x_0}^{x} F(x')\,dx'.
$$

It gives the speed at any position without ever solving for time. (The prime on $x'$ just names the variable being added up, so it does not clash with the end point $x$.)

For gravity from a round body, $F(r) = -\mu m / r^2$ along the radius — the minus sign means "toward the center". A body moving straight in or out from $r_0$ to $r$ has gravity do this much work on it:

$$
\int_{r_0}^{r} \left(-\frac{\mu m}{r'^2}\right) dr' = \mu m \left(\frac{1}{r} - \frac{1}{r_0}\right).
$$

(The step: the integral of $-1/r'^2$ is $+1/r'$, evaluated from $r_0$ to $r$.) The uniform-gravity version, $-m g h$ for a climb of height $h$, is its simple approximation. It is good to about 6 % for a 400 km climb, as the next example shows.

Lesson 4 names this quantity: gravity's work is minus the change in a **potential energy** $U$. For forces like that — called **conservative** — $W = -\Delta U$, and the theorem turns into a conservation law.

::: key
For conservative forces $W = -\Delta U$, so the work-energy theorem gives conservation of $E = KE + U$, the total mechanical energy (lesson 4).
:::

::: example Lifting a payload to orbit height
How much work does gravity do on a $1000\,\mathrm{kg}$ payload raised from the surface ($r_0 = 6378\,\mathrm{km}$) to 400 km up ($r = 6778\,\mathrm{km}$)? How does that compare with the payload's kinetic energy once it is in circular orbit there?

**The exact climb.** Put the numbers into the radial formula:

$$
W_g = \mu m \left(\frac{1}{r} - \frac{1}{r_0}\right) = 3.986 \times 10^{14} \times 1000 \times \left(\frac{1}{6.778 \times 10^{6}} - \frac{1}{6.378 \times 10^{6}}\right) \approx -3.69 \times 10^{9}\,\mathrm{J}.
$$

Negative, because gravity opposes the climb. Something — a rocket — must do $+3.69\,\mathrm{GJ}$ of work against gravity.

**The simple estimate.** $-m g_0 h = -1000 \times 9.80665 \times 4 \times 10^{5} \approx -3.92 \times 10^{9}\,\mathrm{J}$. That overstates the size by about 6 %, because $g$ weakens with height.

**The orbital speed.** Circular orbital speed at 400 km is $\sqrt{\mu / r} \approx 7669\,\mathrm{m/s}$. So the kinetic energy is $\tfrac{1}{2} \times 1000 \times 7669^2 \approx 2.94 \times 10^{10}\,\mathrm{J}$.

**Compare.** $2.94 \times 10^{10} / 3.69 \times 10^{9} \approx 8$. The speed costs eight times the height. Getting to orbit is mostly about going fast sideways, not going up — the energy version of a fact you will meet again in lesson 7.
:::

## Forces that waste energy

Rub your hands together fast. They get warm. The work your muscles did went into heat, and you cannot get it back as motion.

Drag always points against the velocity relative to the air, so its work is always negative: $\mathbf{D} \cdot \mathbf{v} = -D v$ when the air is still. Kinetic energy taken by drag does not come back — it [[heats the air and the vehicle|reentry-heat]]. Friction behaves the same way. Forces like these are called **dissipative** ("scattering away"), and they are why kinetic energy is not conserved even when nothing is thrusting.

Remember the docking example of lesson 2. The two vehicles lost 95 % of their kinetic energy on contact, while momentum was exactly conserved. The latches did negative work on the pair — internal, dissipative work — and momentum bookkeeping never saw it. Energy bookkeeping does. If a simulation shows kinetic energy *increasing* through a contact or a drag pass, look for a sign error. If it shows kinetic energy conserved through a crunching impact, the impact model is wrong.

::: warning
The work-energy theorem is about the *net* work and the *kinetic* energy of the body you apply it to. Two slips are common. First, forgetting a force that does work — gravity during a descent, thrust during a maneuver — and then wondering where the energy went. Second, using $W = F \times \text{distance}$ with a force that is not along the motion. The definition is $\mathbf{F} \cdot d\mathbf{r}$, and a force perpendicular to the motion does no work however large it is. A satellite in circular orbit feels $8.7\,\mathrm{m/s^2}$ of gravity and gains no kinetic energy from it.
:::

::: note
So far, kinetic energy and the theorem apply to a particle of *constant* mass. A rocket loses mass, and $\tfrac{1}{2} m v^2$ with a shrinking $m$ does not obey $dK/dt = T v$ unless you include the exhaust term worked out above. That bookkeeping — the vehicle plus the matter it has thrown out — is the same discipline lesson 6 applies to momentum, and it is the only honest way to do energy for a rocket.
:::

## Check yourself

::: check
A $2000\,\mathrm{kg}$ spacecraft in a circular orbit at $r = 7000\,\mathrm{km}$ completes one lap. How much work does Earth's gravity do on it during that lap, and why?
:::

::: answer
Zero. In a circular orbit the velocity is always along the circle and gravity always points to the center, so $\mathbf{F}_g \cdot \mathbf{v} = 0$ at every instant and the work adds up to nothing. That fits: the speed, and so the kinetic energy, is constant around a circular orbit.

The force itself is not small: $2000 \times 3.986 \times 10^{14} / (7 \times 10^{6})^2 \approx 1.63 \times 10^{4}\,\mathrm{N}$. It does no work because of its direction, not its size.
:::

::: check
A $30\,\mathrm{t}$ stage flying at $1300\,\mathrm{m/s}$ starts an entry burn that slows it to $700\,\mathrm{m/s}$. Ignoring gravity and drag and treating the mass as constant, how much work did the thrust do? If the thrust was a steady $2.5\,\mathrm{MN}$ pointing opposite to the velocity, over what distance did the burn act?
:::

::: answer
Work equals the change in kinetic energy: $W_T = \tfrac{1}{2} \times 30{,}000 \times (700^2 - 1300^2) = 15{,}000 \times (490{,}000 - 1{,}690{,}000) = -1.80 \times 10^{10}\,\mathrm{J}$. Negative, because thrust opposed the motion.

With the force pointing straight against the motion, $W_T = -T s$, so $s = 1.80 \times 10^{10} / 2.5 \times 10^{6} = 7200\,\mathrm{m}$, about $7.2\,\mathrm{km}$ of path. (Really, about a tonne of propellant burns and gravity also acts; both change the answer by a few percent.)
:::

::: check
A $1\,\mathrm{kg}$ test mass makes two identical burns of $\Delta v = 100\,\mathrm{m/s}$: one while moving at $200\,\mathrm{m/s}$, the other while moving at $7700\,\mathrm{m/s}$ (both in ECI). How much kinetic energy does each burn add? Where does the extra energy in the second case come from?
:::

::: answer
Per kilogram, $\Delta K = \tfrac{1}{2}(v + \Delta v)^2 - \tfrac{1}{2}v^2 = v\,\Delta v + \tfrac{1}{2}\Delta v^2$ (expand the square; the $\tfrac{1}{2}v^2$ cancels).

At $200\,\mathrm{m/s}$: $200 \times 100 + \tfrac{1}{2} \times 100^2 = 20{,}000 + 5000 = 25{,}000\,\mathrm{J}$.

At $7700\,\mathrm{m/s}$: $770{,}000 + 5000 = 775{,}000\,\mathrm{J}$ — 31 times more.

The engine released the same chemical energy both times. In the fast case the exhaust was left behind at a much lower inertial speed than it had on board, so it *lost* kinetic energy, and that went to the vehicle. This is the Oberth effect: a burn at high speed turns propellant energy into vehicle energy more efficiently.
:::

::: check
An orbit program logs a satellite's kinetic energy under two-body gravity and shows it rising and falling once per orbit. A colleague calls it a bug. Is it?
:::

::: answer
No. On an elliptical orbit, gravity has a part along the velocity everywhere except the two apsides. It does positive work from apogee to perigee and negative work from perigee to apogee, so the kinetic energy really does rise and fall once per orbit.

What must stay constant is not $K$ but the sum $K + U$, with $U$ the gravitational potential energy of lesson 4. The bug would be that total drifting.
:::

::: check
State the work-energy theorem, list when it holds, and say in one sentence why it cannot tell you which way a particle is moving.
:::

::: answer
$W_{\mathrm{net}} = \Delta K = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$: the work done by the net force along the actual path equals the change in kinetic energy. It needs an inertial frame, a particle of constant mass, and *all* forces included in the net force.

It says nothing about direction because kinetic energy depends on $v^2 = \mathbf{v} \cdot \mathbf{v}$, which throws the direction away; the theorem is one number-equation, while the second law is three.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $dW = \mathbf{F} \cdot d\mathbf{r}$, $W = \int_C \mathbf{F} \cdot d\mathbf{r} = \int \mathbf{F} \cdot \mathbf{v}\,dt$ | work done by a force along a path; a scalar in joules; zero for a force perpendicular to the velocity |
| $K = \tfrac{1}{2} m v^2 = p^2/2m$ | kinetic energy of a particle; depends on the frame |
| $W_{\mathrm{net}} = \Delta K = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$ | the work-energy theorem, valid in any inertial frame for constant mass; works of separate forces add |
| $W = -\Delta U$, $E = KE + U$ | for conservative forces; total mechanical energy is conserved (lesson 4) |
| $P = \mathbf{F} \cdot \mathbf{v} = dW/dt$ | power, in watts; $P_{\mathrm{net}} = dK/dt$ |
| $P_{\mathrm{jet}} = \tfrac{1}{2}\dot{m} v_e^2$ | jet power of a rocket engine, the same in every frame; the vehicle receives $T v$, a fraction $2v/v_e$ of it (Oberth effect) |
| $\mu m (1/r - 1/r_0)$ | work done by gravity on a radial move from $r_0$ to $r$; $-mgh$ is its uniform-gravity approximation |
| dissipative force | always does negative work (drag, friction); kinetic energy lost to heat does not return |

The next lesson asks which forces do work that depends only on the ends of a path. For those — gravity above all — the work can be worked out once and for all as a potential energy, and the work-energy theorem becomes conservation of total mechanical energy: the most useful single check on an orbit simulation.

::: context dot-product Only the part along the motion counts
Pull a wagon with force $F$ at angle $\theta$ above the road. Split the pull into two parts: $F\cos\theta$ along the road and $F\sin\theta$ straight up. Only the part along the road moves the wagon forward, so only it does work: $F\cos\theta$ times the distance. That is all the dot product is. At $\theta = 0$ you get the full $F$; at $90^\circ$, nothing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="80" cy="110" r="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="80" y1="110" x2="225.6" y2="26" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="236,20 228.6,31.2 222.6,20.8" fill="#1d6fd1"/>
  <text x="170" y="42" font-size="12" fill="#1d6fd1">F</text>
  <line x1="80" y1="110" x2="224" y2="110" stroke="#b4232c" stroke-width="3"/>
  <polygon points="236,110 224,104 224,116" fill="#b4232c"/>
  <text x="250" y="114" font-size="12" fill="#b4232c">F cos θ (does work)</text>
  <line x1="236" y1="110" x2="236" y2="20" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="242" y="70" font-size="11" fill="#6c7a93">F sin θ</text>
  <path d="M 120 110 A 40 40 0 0 0 114.6 90" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="124" y="100" font-size="12" fill="#1f2a44">θ</text>
  <text x="180" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">direction of motion →</text>
</svg>
```
:::

::: context joule An apple, lifted
The joule is named after James Prescott Joule, the English brewer-scientist who showed in the 1840s that work and heat are two forms of the same thing — he warmed water by stirring it with a paddle turned by falling weights. One joule is about the work to lift an apple (about one newton) up one meter. A rocket's kinetic energy is counted in billions of them.
:::

::: context circle-no-work Pulled sideways, never faster
In a circular orbit, gravity always points at Earth's center while the satellite always moves along the circle. The two arrows stay at right angles, so gravity only bends the path; it never speeds the satellite up or slows it down. That is why the speed is constant around a circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="90" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="180" cy="90" r="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="250" cy="90" r="5" fill="#1f2a44"/>
  <line x1="250" y1="90" x2="250" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="250,22 244,34 256,34" fill="#1d6fd1"/>
  <text x="258" y="36" font-size="12" fill="#1d6fd1">velocity</text>
  <line x1="250" y1="90" x2="212" y2="90" stroke="#b4232c" stroke-width="3"/>
  <polygon points="205,90 217,84 217,96" fill="#b4232c"/>
  <text x="258" y="108" font-size="12" fill="#b4232c">gravity (toward center)</text>
  <polyline points="250,80 240,80 240,90" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="180" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">always 90° apart, so F · v = 0</text>
</svg>
```
:::

::: context product-rule-dot Why the derivative of v · v is 2 v · v̇
Write the velocity in parts, $\mathbf{v} = (v_x, v_y, v_z)$. Then $\mathbf{v} \cdot \mathbf{v} = v_x^2 + v_y^2 + v_z^2$. The rate of change of $v_x^2$ is $2 v_x \dot{v}_x$, by the ordinary chain rule, and the same for the other two. Adding gives $2(v_x \dot{v}_x + v_y \dot{v}_y + v_z \dot{v}_z)$, which is exactly $2\,\mathbf{v} \cdot \dot{\mathbf{v}}$.
:::

::: context oberth Hermann Oberth and the fast burn
Hermann Oberth, one of the founders of rocketry, described this effect in his 1929 book *Ways to Spaceflight*. The graph shows the vehicle's share of the engine's jet power, $2v/v_e$, against its speed. Below $v_e/2$ some energy is left in the exhaust; above it the vehicle gets more than the engine releases, because the propellant's own kinetic energy joins in. Missions exploit this by burning deep in a planet's gravity well, where speed is highest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="140" x2="300" y2="20" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="40" y1="110" x2="300" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="105" y1="140" x2="105" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="170" y1="140" x2="170" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="105" cy="110" r="4" fill="#b4232c"/>
  <circle cx="170" cy="80" r="4" fill="#b4232c"/>
  <text x="34" y="114" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="34" y="84" font-size="11" fill="#1f2a44" text-anchor="end">2</text>
  <text x="34" y="144" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="105" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">vₑ/2</text>
  <text x="170" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">vₑ</text>
  <text x="325" y="156" font-size="11" fill="#1f2a44" text-anchor="end">speed v</text>
  <text x="48" y="22" font-size="11" fill="#1f2a44">vehicle share 2v/vₑ</text>
  <line x1="40" y1="80" x2="170" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
</svg>
```
:::

::: context gigawatts How big is a gigawatt?
A large nuclear power station puts out roughly one gigawatt of electricity. Nine Merlins at liftoff release about ten of those, all poured into a column of hot exhaust for a couple of minutes. On the pad none of it moves the rocket faster; by the end of the burn, far more than that is flowing into the vehicle.
:::

::: context reentry-heat Where the energy goes on the way down
A spacecraft coming home from orbit carries about 30 million joules of kinetic energy per kilogram. Almost all of it has to disappear before landing, and drag turns it into heat — in the air around the vehicle and in its heat shield. That is why capsules glow and why heat shields are built to char and flake away, carrying heat with them.
:::
