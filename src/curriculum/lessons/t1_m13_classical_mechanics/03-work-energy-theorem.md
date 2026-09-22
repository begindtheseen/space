---
id: l03-work-energy-theorem
title: Work, kinetic energy and power
minutes: 21
covers:
  - the work-energy theorem
---

Lesson 2 integrated Newton's second law over *time* and got impulse and momentum. This lesson integrates it over *distance* and gets work and kinetic energy. The two bookkeeping tools answer different questions. Momentum tells you what happens when things collide, separate or push each other; it does not care what happens in between. Energy tells you how much a force accomplished along a path, whether a manoeuvre is affordable, and — for a rocket — why the same burn buys thirty times more kinetic energy at orbital speed than it does on the pad.

For a GNC engineer the work-energy theorem is mostly a check and a shortcut. It is a check because a simulation that violates it has a bug: an orbit propagator whose specific energy drifts is integrating badly, and an ascent model that gains kinetic energy faster than the engines can supply it has a sign error. It is a shortcut because it turns a second-order ODE into an algebraic relation between speed and position, which lets you answer "how fast at the bottom" or "how much thrust to stop in three kilometres" without integrating anything.

Everything here is for a particle, or for a body whose translation is what you care about. Lesson 5 extends it to systems of particles, and lesson 4 introduces the special forces — gravity among them — whose work depends only on where you start and finish.

## Work done by a force

Start with the intuition. Pushing something moves it; how much you accomplished depends on how hard you pushed *and* on how far it moved in the direction you were pushing. Push perpendicular to the motion and you accomplished nothing, however hard you pushed.

The precise statement: when a force $\mathbf{F}$ acts on a particle while it moves through a displacement $d\mathbf{r}$, the **work** done by the force is the scalar

$$
dW = \mathbf{F} \cdot d\mathbf{r} = F\,|d\mathbf{r}|\cos\theta,
$$

where $\theta$ is the angle between the force and the displacement. Over a finite path $C$ from point $A$ to point $B$ the work is the line integral

$$
W_{AB} = \int_C \mathbf{F} \cdot d\mathbf{r} = \int_{t_A}^{t_B} \mathbf{F} \cdot \mathbf{v}\,dt.
$$

The second form uses $d\mathbf{r} = \mathbf{v}\,dt$ and is how you would compute work inside a simulation: accumulate $\mathbf{F} \cdot \mathbf{v}$ over each time step. The SI unit is the joule, $1\,\mathrm{J} = 1\,\mathrm{N\,m} = 1\,\mathrm{kg\,m^2/s^2}$.

Three features of the definition do a lot of work later.

- Work is a scalar. It has a sign but no direction. A force does positive work when it has a component along the motion, negative work when it opposes the motion, and zero work when it is perpendicular.
- Work is done *by a specific force* on *a specific body* along *a specific path*. "The work" without those three qualifiers is meaningless. In general the value depends on the path, not only on its endpoints; lesson 4 is about the forces for which it does not.
- A force that is always perpendicular to the velocity does no work. The tension in a string swinging a mass in a circle, the normal force from a frictionless track, the magnetic force on a charge, and — crucially — gravity on a body in a *circular* orbit all fall in this class. Their work is zero because $\mathbf{F} \cdot \mathbf{v} = 0$ at every instant, not because they are small.

## The work-energy theorem

Now the derivation, which takes four lines. Take a particle of constant mass $m$ under net force $\mathbf{F}$ in an inertial frame, so $\mathbf{F} = m\,d\mathbf{v}/dt$. Dot both sides with $\mathbf{v}$:

$$
\mathbf{F} \cdot \mathbf{v} = m\,\mathbf{v} \cdot \frac{d\mathbf{v}}{dt} = \frac{d}{dt}\left(\tfrac{1}{2} m\,\mathbf{v} \cdot \mathbf{v}\right) = \frac{d}{dt}\left(\tfrac{1}{2} m v^2\right).
$$

The middle step is the product rule run backwards: $\frac{d}{dt}(\mathbf{v} \cdot \mathbf{v}) = 2\,\mathbf{v} \cdot \dot{\mathbf{v}}$. The quantity that appeared is the **kinetic energy**,

$$
K = \tfrac{1}{2} m v^2 = \frac{p^2}{2m},
$$

in joules. Integrate from $t_1$ to $t_2$ and the left side is the work done by the net force:

$$
W_{\mathrm{net}} = \int_{t_1}^{t_2} \mathbf{F} \cdot \mathbf{v}\,dt = K_2 - K_1 = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2.
$$

This is the **work-energy theorem**: the work done by the net force on a particle equals the change in its kinetic energy. Since the net force is the sum of the individual forces and the dot product distributes over the sum, $W_{\mathrm{net}}$ is also the sum of the works done by each force separately. You may compute the work of gravity, thrust and drag one at a time and add them.

Notice what the theorem is and is not. It is an exact consequence of the second law, so it is never "extra physics" — anything it tells you, integrating $\mathbf{F} = m\mathbf{a}$ would also tell you. What it offers is a relation between speed and position that skips the time variable entirely. Notice too that only the *speed* appears. Kinetic energy knows nothing about direction, so the theorem alone cannot tell you where the particle is heading, only how fast.

::: key
The work-energy theorem: $W_{\mathrm{net}} = \Delta K = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$, where $W_{\mathrm{net}} = \int \mathbf{F}_{\mathrm{net}} \cdot d\mathbf{r}$ is the work done by the net force along the path actually followed. It is Newton's second law integrated over distance, and it holds in any inertial frame.
:::

::: example A landing burn, by energy
A 30 t first stage is descending vertically at $250\,\mathrm{m/s}$ when it is $3.0\,\mathrm{km}$ above the pad, and must arrive at the pad at rest. Take $g = 9.81\,\mathrm{m/s^2}$, ignore drag, and treat the mass as constant (the propellant burned is a few percent of the total). What average thrust is required?

Two forces act: gravity and thrust. The kinetic energy must go from $\tfrac{1}{2} \times 30{,}000 \times 250^2 = 9.375 \times 10^{8}\,\mathrm{J}$ to zero, so $W_{\mathrm{net}} = -9.375 \times 10^{8}\,\mathrm{J}$.

Gravity points down and the stage moves down, so gravity does *positive* work: $W_g = m g h = 30{,}000 \times 9.81 \times 3000 = 8.829 \times 10^{8}\,\mathrm{J}$. That energy also has to be removed.

Thrust must therefore do $W_T = W_{\mathrm{net}} - W_g = -9.375 \times 10^{8} - 8.829 \times 10^{8} = -1.820 \times 10^{9}\,\mathrm{J}$. Thrust points up while the stage moves down, so the work is negative, as it should be. Over a $3000\,\mathrm{m}$ path the average thrust is

$$
\bar{T} = \frac{|W_T|}{h} = \frac{1.820 \times 10^{9}}{3000} \approx 6.07 \times 10^{5}\,\mathrm{N},
$$

about 72 % of one Merlin 1D's sea-level thrust. Cross-check by kinematics: constant deceleration $a = v^2/(2h) = 250^2/6000 \approx 10.4\,\mathrm{m/s^2}$ and $T = m(a + g) = 30{,}000 \times (10.42 + 9.81) \approx 6.07 \times 10^{5}\,\mathrm{N}$. Same answer, but the energy route never needed the deceleration or the time.
:::

## Power

The rate at which a force does work is its **power**,

$$
P = \frac{dW}{dt} = \mathbf{F} \cdot \mathbf{v},
$$

in watts, $1\,\mathrm{W} = 1\,\mathrm{J/s}$. The work-energy theorem in rate form is $P_{\mathrm{net}} = dK/dt$: the net power delivered to a particle is the rate at which its kinetic energy grows.

Power is where the difference between force and energy becomes visible for a rocket. Thrust is set by the engine — mass flow times effective exhaust velocity, $T = \dot{m} v_e$ from lesson 2 — and does not depend on how fast the vehicle is going. But the *power* thrust delivers to the vehicle is $T v$, and that grows with speed. On the pad, with $v = 0$, the engines deliver enormous force and zero power to the vehicle. At orbital speed the same thrust delivers $T \times 7700\,\mathrm{m/s}$.

Where does the energy come from on the pad, when the vehicle gets none of it? It goes into the exhaust. The exhaust leaves at speed $v_e$ relative to the vehicle, and the kinetic energy it carries away per second — the **jet power** — is

$$
P_{\mathrm{jet}} = \tfrac{1}{2}\,\dot{m}\,v_e^2.
$$

This is essentially the rate at which chemical energy is being converted, and it is fixed by the engine. How that power is split between vehicle and exhaust depends on the vehicle's speed. Follow the accounting for an instant $dt$ in an inertial frame in which the vehicle moves at speed $v$. The vehicle's kinetic energy grows at rate $T v = \dot{m} v_e v$. A parcel of mass $\dot{m}\,dt$ that was moving with the vehicle at $v$ is now moving at $v - v_e$, so its kinetic energy changed by $\tfrac{1}{2}\dot{m}\,dt\,[(v - v_e)^2 - v^2] = \dot{m}\,dt\,(\tfrac{1}{2} v_e^2 - v v_e)$. Add the two rates:

$$
\dot{m} v_e v + \dot{m}\left(\tfrac{1}{2} v_e^2 - v v_e\right) = \tfrac{1}{2}\dot{m} v_e^2.
$$

The total is $P_{\mathrm{jet}}$ in every inertial frame, as it must be. But the vehicle's share, $2v/v_e$ of the total, grows without limit. When $v = v_e$ the exhaust is left at rest in the inertial frame and *all* the released energy goes to the vehicle; for $v$ larger still, the exhaust is still moving forward and losing kinetic energy, and the vehicle gains more than the engine releases. This is the **Oberth effect**, and it is why a burn is most valuable where the vehicle is moving fastest — at perigee, not apogee.

::: example One Merlin's power budget
A Merlin 1D at sea level produces $T = 845\,\mathrm{kN}$ with $v_e \approx 2766\,\mathrm{m/s}$ and $\dot{m} \approx 306\,\mathrm{kg/s}$ (lesson 2). Compute its jet power, and the power it delivers to the vehicle at liftoff and at $2000\,\mathrm{m/s}$.

Jet power: $P_{\mathrm{jet}} = \tfrac{1}{2} \times 306 \times 2766^2 \approx 1.17 \times 10^{9}\,\mathrm{W}$, about $1.17\,\mathrm{GW}$ per engine — roughly $10.5\,\mathrm{GW}$ for nine, the output of several large power stations, all of it going into the exhaust plume at the moment of liftoff.

At liftoff, $v = 0$ so the power to the vehicle is $T v = 0$. Every joule goes into the exhaust.

At $v = 2000\,\mathrm{m/s}$ the power to the vehicle is $T v = 8.45 \times 10^{5} \times 2000 = 1.69 \times 10^{9}\,\mathrm{W}$, which is $2v/v_e \approx 1.45$ times the jet power. The vehicle is gaining kinetic energy faster than the engine releases chemical energy; the difference is kinetic energy the exhaust is giving up, because it is being left behind at $2000 - 2766 = -766\,\mathrm{m/s}$, slower in the inertial frame than the $2000\,\mathrm{m/s}$ it had while it was still propellant on board.
:::

## Kinetic energy is frame-dependent; the theorem is not

Speed depends on the observer, so kinetic energy does too. One kilogram of payload in a 400 km orbit has $\tfrac{1}{2} \times 7700^2 \approx 2.96 \times 10^{7}\,\mathrm{J}$ of kinetic energy in ECI and nearly zero in the frame of a servicing vehicle drifting alongside it. Neither number is wrong; they answer different questions.

What survives a change of inertial frame is the *theorem*: in every inertial frame, the work done by the net force equals the change in kinetic energy measured in that frame. Both sides change together, because $d\mathbf{r}$ changes by $\mathbf{u}\,dt$ when the frame moves at $\mathbf{u}$, and so does the velocity inside $K$. A useful corollary: the work done by a force, unlike the force itself, is frame-dependent, so "the work done by thrust" only means something once you have said which frame. Lesson 5 shows that for a system of particles there is one frame in which the bookkeeping is cleanest — the centre-of-mass frame.

## Work in one dimension and the speed-position shortcut

For motion along a line, with the net force known as a function of position $F(x)$, the theorem reads

$$
\tfrac{1}{2} m v^2(x) = \tfrac{1}{2} m v_0^2 + \int_{x_0}^{x} F(x')\,dx',
$$

which gives the speed at any position without ever solving for time. For gravity from a spherical body, $F(r) = -\mu m / r^2$ along the radius, and a body falling straight in from $r_0$ to $r$ gains

$$
\int_{r_0}^{r} \left(-\frac{\mu m}{r'^2}\right) dr' = \mu m \left(\frac{1}{r} - \frac{1}{r_0}\right).
$$

Lesson 4 will name this quantity minus the change in potential energy; for now it is simply the work gravity does along a radial path. The uniform-gravity approximation $m g h$ is its first-order version and is good to about 6 % for a 400 km climb — check the Oberth example's cousin below.

::: example Lifting a payload to orbit altitude
How much work does gravity do on a $1000\,\mathrm{kg}$ payload raised from the surface ($r_0 = 6378\,\mathrm{km}$) to 400 km altitude ($r = 6778\,\mathrm{km}$), and how does that compare with the payload's kinetic energy once it is in circular orbit there?

Radial climb, exact:

$$
W_g = \mu m \left(\frac{1}{r} - \frac{1}{r_0}\right) = 3.986 \times 10^{14} \times 1000 \times \left(\frac{1}{6.778 \times 10^{6}} - \frac{1}{6.378 \times 10^{6}}\right) \approx -3.69 \times 10^{9}\,\mathrm{J}.
$$

Negative, because gravity opposes the climb. The uniform-gravity estimate $-m g_0 h = -1000 \times 9.80665 \times 4 \times 10^{5} \approx -3.92 \times 10^{9}\,\mathrm{J}$ overstates the magnitude by about 6 %, because $g$ weakens with altitude. Something — a rocket — has to do $+3.69\,\mathrm{GJ}$ of work against gravity to make the climb.

Circular orbital speed at 400 km is $\sqrt{\mu / r} \approx 7669\,\mathrm{m/s}$, so the payload's kinetic energy is $\tfrac{1}{2} \times 1000 \times 7669^2 \approx 2.94 \times 10^{10}\,\mathrm{J}$ — eight times the work against gravity. Getting to orbit is mostly about speed, not height. This is the energy version of a fact you will meet again in lesson 7: a LEO ascent spends most of its $\Delta v$ going sideways.
:::

## Non-conservative forces and dissipation

Drag always points against the velocity relative to the air, so its work is always negative: $\mathbf{D} \cdot \mathbf{v} = -D v$ when the air is still. Kinetic energy removed by drag does not come back — it heats the air and the vehicle. Friction behaves the same way. Forces like these are called **dissipative**, and they are the reason kinetic energy alone is not conserved even when nothing is thrusting.

Contrast the docking example of lesson 2: the two vehicles lost 95 % of their kinetic energy on contact, while momentum was exactly conserved. The latches did negative work on the pair — internal, dissipative work — and momentum bookkeeping never saw it. Energy bookkeeping does. When a simulation shows kinetic energy *increasing* through a contact or a drag pass, look for a sign error; when it shows kinetic energy conserved through a plastic impact, the impact model is wrong.

::: warning
The work-energy theorem is about the *net* work and the *kinetic* energy of the body it is applied to. Two slips are common. First, forgetting a force that does work — gravity during a descent, or thrust during a manoeuvre — and then wondering where the energy went. Second, applying $W = F \times \mathrm{distance}$ with a force that is not along the displacement; the definition is $\mathbf{F} \cdot d\mathbf{r}$, and a force perpendicular to the motion does no work no matter how large it is. A satellite in circular orbit feels $8.7\,\mathrm{m/s^2}$ of gravity and gains no kinetic energy from it.
:::

::: note
Kinetic energy and the work-energy theorem apply, so far, to a particle of *constant* mass. A rocket loses mass, and $\tfrac{1}{2} m v^2$ with a shrinking $m$ does not obey $dK/dt = T v$ without the exhaust term worked out above. That accounting — the vehicle plus the matter it has expelled — is the same discipline lesson 6 applies to momentum, and it is the only honest way to do energy for a rocket.
:::

## Check yourself

::: check
A $2000\,\mathrm{kg}$ spacecraft in a circular orbit at $r = 7000\,\mathrm{km}$ completes one revolution. How much work does Earth's gravity do on it over that orbit, and why?
:::

::: answer
Zero. In a circular orbit the velocity is always tangential and gravity is always radial, so $\mathbf{F}_g \cdot \mathbf{v} = 0$ at every instant and the work integral vanishes identically. Consistent with this, the speed — and hence the kinetic energy — is constant around a circular orbit. The force is about $2000 \times 3.986 \times 10^{14} / (7 \times 10^{6})^2 \approx 1.63 \times 10^{4}\,\mathrm{N}$, not small; it does no work because of its direction, not its size.
:::

::: check
A stage of mass $30\,\mathrm{t}$ is flying at $1300\,\mathrm{m/s}$ when it starts an entry burn that slows it to $700\,\mathrm{m/s}$. Ignoring gravity and drag and treating the mass as constant, how much work did the thrust do? If the thrust was a constant $2.5\,\mathrm{MN}$ directed opposite to the velocity, over what distance did the burn act?
:::

::: answer
$W_T = \Delta K = \tfrac{1}{2} \times 30{,}000 \times (700^2 - 1300^2) = -1.80 \times 10^{10}\,\mathrm{J}$. Negative: thrust opposed the motion. With the force antiparallel to the displacement, $W_T = -T s$, so $s = 1.80 \times 10^{10} / 2.5 \times 10^{6} = 7200\,\mathrm{m}$, about $7.2\,\mathrm{km}$ of path. (In reality mass falls by roughly a tonne during such a burn and gravity contributes as well; both change the answer at the few-percent level.)
:::

::: check
Two identical burns of $\Delta v = 100\,\mathrm{m/s}$ are made by a $1\,\mathrm{kg}$ test mass: one when it is moving at $200\,\mathrm{m/s}$, the other when it is moving at $7700\,\mathrm{m/s}$ (both measured in ECI). Compute the kinetic energy each burn adds. Where does the extra energy in the second case come from?
:::

::: answer
$\Delta K = \tfrac{1}{2}(v + \Delta v)^2 - \tfrac{1}{2}v^2 = v\,\Delta v + \tfrac{1}{2}\Delta v^2$ per kilogram. At $200\,\mathrm{m/s}$ that is $20{,}000 + 5000 = 25{,}000\,\mathrm{J}$; at $7700\,\mathrm{m/s}$ it is $770{,}000 + 5000 = 775{,}000\,\mathrm{J}$, 31 times more. The engine released the same chemical energy both times. In the fast case the exhaust was left behind at a much lower inertial speed than it had on board, so it *lost* kinetic energy, and that loss went to the vehicle. This is the Oberth effect: a burn at high speed converts propellant energy to vehicle energy more efficiently.
:::

::: check
An orbit propagator logs the kinetic energy of a satellite under two-body gravity and shows it rising and falling once per orbit. A colleague flags this as a bug. Is it?
:::

::: answer
No. On an elliptical orbit gravity has a component along the velocity except at the two apsides: it does positive work from apogee to perigee and negative work from perigee to apogee, so the kinetic energy genuinely oscillates once per orbit. What must stay constant is not $K$ but the sum $K + U$ with $U$ the gravitational potential energy, introduced in lesson 4. The bug would be if that total drifted.
:::

::: check
State the work-energy theorem, list the conditions under which it holds, and explain in one sentence why it cannot tell you the direction a particle is moving.
:::

::: answer
$W_{\mathrm{net}} = \Delta K = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$, the work done by the net force along the actual path equals the change in kinetic energy. It requires an inertial frame, a particle of constant mass, and *all* forces included in the net force. It says nothing about direction because kinetic energy depends on $v^2 = \mathbf{v} \cdot \mathbf{v}$, which discards the direction of $\mathbf{v}$; the theorem is one scalar equation, whereas the second law is three.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $dW = \mathbf{F} \cdot d\mathbf{r}$, $W = \int_C \mathbf{F} \cdot d\mathbf{r} = \int \mathbf{F} \cdot \mathbf{v}\,dt$ | work done by a force along a path; a scalar in joules; zero for a force perpendicular to the velocity |
| $K = \tfrac{1}{2} m v^2 = p^2/2m$ | kinetic energy of a particle; frame-dependent |
| $W_{\mathrm{net}} = \Delta K = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$ | the work-energy theorem, valid in any inertial frame for constant mass; works of individual forces add |
| $P = \mathbf{F} \cdot \mathbf{v} = dW/dt$ | power, in watts; $P_{\mathrm{net}} = dK/dt$ |
| $P_{\mathrm{jet}} = \tfrac{1}{2}\dot{m} v_e^2$ | jet power of a rocket engine, frame-independent; the vehicle receives $T v$, a fraction $2v/v_e$ of it (Oberth effect) |
| $\mu m (1/r - 1/r_0)$ | work done by gravity on a radial move from $r_0$ to $r$; $-mgh$ is its uniform-gravity approximation |
| dissipative force | always does negative work (drag, friction); kinetic energy lost to heat does not return |

The next lesson asks which forces do work that depends only on the endpoints of a path. For those — gravity above all — the work integral can be evaluated once and for all as a potential energy, and the work-energy theorem becomes conservation of total mechanical energy, the single most useful sanity check on an orbit simulation.
