---
id: l07-thruster-control-and-minimum-impulse-bit
title: Thruster attitude control and the minimum impulse bit
minutes: 24
covers:
  - 'thruster attitude control and minimum impulse bit'
---

Picture yourself on an office chair holding a heavy ball. Spin the ball and the chair turns the other way — but the total spin of you plus ball never changes. That is a reaction wheel: it only moves spin around inside the spacecraft. Now throw the ball away. Its momentum is gone for good. That is a thruster: the gas it shoves out carries momentum away.

So thrusters are the only attitude actuator that can get rid of momentum the environment has piled up. Every wheel-controlled spacecraft also carries thrusters or **[[magnetorquers|magnetorquers]]** — coils that push against Earth's magnetic field. Upper stages, landers and capsules use thrusters for attitude from start to finish.

Thrusters have one property no other actuator has. They come in **quantized** amounts — whole steps, like coins, with nothing in between. A wheel motor can give any torque in its range. A thruster is a valve. It is open or shut, and it cannot be open for less time than the valve takes to move: five to twenty milliseconds on a typical **[[solenoid valve|solenoid-valve]]**. So there is a smallest push it can give, called the **minimum impulse bit**. Everything here follows from that floor: how finely you can point, the endless wobble called a limit cycle, and the propellant bill.

The headline result: holding still on thrusters costs propellant in proportion to the minimum impulse bit, divided by the pointing band. That is why a spacecraft that must point to arcseconds uses wheels.

## Making torque with thrusters

Push on the edge of a door and it swings; push at the hinge and nothing turns. A thruster works the same way. It makes a force $\mathbf{F}$ at a position $\mathbf{r}$ measured from the center of mass. So it makes both a torque and an acceleration:

$$
\mathbf{M} = \mathbf{r}\times\mathbf{F}, \qquad \mathbf{a} = \frac{\mathbf{F}}{m}.
$$

Here $\mathbf{M}$ is the torque (as in earlier lessons), "$\mathbf{r}$ cross $\mathbf{F}$", and $m$ is the vehicle's mass.

Fire one thruster and the vehicle rotates *and* drifts sideways. To rotate without drifting, fire two thrusters with equal and opposite forces on opposite sides of the center of mass. That pair is a **[[couple|couple-picture]]** — two equal, opposite, offset pushes that twist without shoving. Two thrusters of thrust $F$, each at a **moment arm** $L$ (the sideways distance from the center of mass to the line of the push), give a torque

$$
M = FL + FL = 2FL,
$$

and a net force of zero. A reaction control system laid out in couples keeps attitude control from nudging the orbit — which matters enormously during a rendezvous.

Real systems rarely get pure couples. Thrusters are tilted (**canted**) to keep plumes off solar arrays, the center of mass moves as propellant drains, and a failed thruster forces lopsided combinations. So the general job is **allocation**: given a desired torque $\mathbf{M}_{des}$ ("M sub des") over a control step $\Delta t$, find an on-time $t_j \ge 0$ for each thruster $j$ so that

$$
\sum_j (\mathbf{r}_j\times\mathbf{F}_j)\,t_j \approx \mathbf{M}_{des}\,\Delta t .
$$

Read the left side as "add up, over every thruster, its torque times how long it fires". Each valve also has a minimum on-time, and you usually want the least propellant.

The "zero or positive" part is what makes this different from wheels. A thruster can only push, never pull, so you need at least twice as many thrusters as axes.

## The minimum impulse bit

**Impulse** is force times the time it acts — the total shove, measured in newton-seconds, $\mathrm{N\,s}$. A command to fire for time $t$ delivers the impulse $\int F\,dt$ (read "the integral of $F$ d-t": add up force over every instant). That is not exactly $Ft$. The valve takes a few milliseconds to open. The chamber pressure takes time to build. At shutdown there is a tail-off while leftover propellant burns. For a short firing, those ends are the whole event.

The **minimum impulse bit** $I_{bit}$ ("I sub bit") is the smallest impulse a thruster can deliver reliably, again and again. It is set by the valve's open and close time, through the shortest on-time $t_{min}$ that the valve and controller can command:

$$
I_{bit} = F\,t_{min} \quad\text{(approximately; the real value is measured on a test stand, not computed)} .
$$

Some sizes, with each step shown:

- A $1\,\mathrm{N}$ **[[monopropellant hydrazine|hydrazine]]** thruster with a $20\,\mathrm{ms}$ minimum: $1 \times 0.020 = 0.02\,\mathrm{N\,s}$.
- A $400\,\mathrm{N}$ bipropellant thruster at the same on-time: $400 \times 0.020 = 8\,\mathrm{N\,s}$.
- A Space Shuttle primary RCS jet, $3870\,\mathrm{N}$ with an $80\,\mathrm{ms}$ minimum: $3870 \times 0.080 \approx 310\,\mathrm{N\,s}$. That is why the Shuttle also carried much smaller **[[vernier jets|shuttle-verniers]]** for fine pointing.

Two properties matter as much as the value.

**Repeatability.** If the impulse varies by $\pm 20\,\%$ from pulse to pulse, the controller cannot predict the rate change it asks for. The real step size is then the uncertainty, not the average.

**Linearity.** Below some on-time, the impulse stops being proportional to the command at all. No software can work below that floor.

### From impulse to a step in spin rate

A couple at moment arm $L$ turns each thruster's impulse into an **angular impulse** — a spin shove — of $I_{bit}L$ per thruster, so $2I_{bit}L$ for the pair. Angular impulse divided by the moment of inertia $I$ is the change in spin rate. So one minimum pulse changes the body rate by

$$
\Delta\omega = \frac{2I_{bit}L}{I}.
$$

Read $\Delta\omega$ as "delta omega", the rate step. (Careful: $I$ alone is the moment of inertia; $I_{bit}$ is the impulse bit. Different things.) A single thruster, not a couple, gives half that: $I_{bit}L/I$. This is the finest rate change available. Nothing in the control law can make a smaller one.

::: key Minimum impulse bit
The smallest impulse a thruster can deliver reliably (repeatably), $I_{bit} \approx F t_{min}$, set by valve open and close time. It fixes the finest attitude and rate increment available, $\Delta\omega = I_{bit}L/I$ for a single thruster at moment arm $L$ or twice that for a couple, so it puts a floor under the pointing deadband and produces limit-cycle rather than settling behavior in thruster-only control.
:::

## The limit cycle

A home thermostat never holds exactly $20\,^\circ\mathrm{C}$. It lets the room cool to $19.5$, heats it to $20.5$, and repeats forever. The band it tolerates is its **[[deadband|deadband-word]]** — the range of error in which the controller does nothing.

A thruster-controlled spacecraft does this with its pointing. The deadband is $\pm\theta_{db}$ ("plus or minus theta sub d-b"): the controller fires only when the pointing error reaches an edge. Because the rate can only change in steps of $\Delta\omega$, the vehicle cannot settle to zero error and zero rate. It rocks back and forth inside the deadband forever. That endless, repeating motion is a **[[limit cycle|limit-cycle-picture]]**, and it is the signature behavior of thruster attitude control.

### The symmetric cycle

Start with no disturbance torque. The vehicle drifts across the deadband at a steady rate, gets one minimum pulse at the edge $+\theta_{db}$ that reverses it, drifts back to $-\theta_{db}$, gets another pulse, and so on.

For the cycle to close, each pulse must swap the rate from $-\Delta\omega/2$ to $+\Delta\omega/2$ (or back). A swap of size $\Delta\omega$ from one to the other means the drift rate is half a step, $\Delta\omega/2$. Crossing the full width $2\theta_{db}$ at that rate takes

$$
t_{coast} = \frac{2\theta_{db}}{\Delta\omega/2} = \frac{4\theta_{db}}{\Delta\omega} .
$$

One full cycle is two crossings and two pulses. So the period is $T = 2t_{coast} = 8\theta_{db}/\Delta\omega$. Two pulses per period gives a pulse rate of

$$
f_{pulse} = \frac{2}{T} = \frac{\Delta\omega}{4\theta_{db}} = \frac{I_{bit}L}{2 I\,\theta_{db}} .
$$

(The last step put in $\Delta\omega = 2I_{bit}L/I$ and cancelled the $2$.)

Every pulse burns the same propellant, so fuel per day is proportional to $f_{pulse}$.

::: key The limit-cycle fuel law
Pulse rate $= \Delta\omega/(4\theta_{db})$, so propellant consumption is proportional to the minimum impulse bit and inversely proportional to the deadband. Halving the pointing requirement doubles the fuel; halving the impulse bit halves it. The vehicle never settles — it cycles.
:::

To turn impulse into propellant mass you need the thruster's **[[specific impulse|specific-impulse]]** $I_{sp}$, in seconds. The exhaust leaves at speed $g_0 I_{sp}$, with $g_0 = 9.80665\,\mathrm{m/s^2}$. Each kilogram thrown out at that speed carries $g_0 I_{sp}$ newton-seconds of momentum. So an impulse $J$ costs a propellant mass of $J/(g_0 I_{sp})$.

::: example A hydrazine RCS holding a tenth of a degree
A spacecraft axis has inertia $I = 900\,\mathrm{kg\,m^2}$. It is controlled by couples of $1\,\mathrm{N}$ hydrazine thrusters at moment arm $L = 1.2\,\mathrm{m}$, with $I_{sp} = 220\,\mathrm{s}$ and a minimum on-time of $20\,\mathrm{ms}$, so $I_{bit} = 0.02\,\mathrm{N\,s}$.

**Rate step.** One minimum pulse of the couple gives angular impulse $2I_{bit}L = 2 \times 0.02 \times 1.2 = 0.048\,\mathrm{N\,m\,s}$. Divide by the inertia:

$$
\Delta\omega = \frac{0.048}{900} = 5.33\times 10^{-5}\,\mathrm{rad/s} = 3.06\times 10^{-3}\,{}^\circ/\mathrm{s}.
$$

**Timing.** Take a deadband of $\pm 0.1^\circ$, which is $\theta_{db} = 1.745\times 10^{-3}\,\mathrm{rad}$. The drift rate is $\Delta\omega/2 = 1.53\times 10^{-3}\,{}^\circ/\mathrm{s}$. Each crossing takes $4\theta_{db}/\Delta\omega = 4 \times 1.745\times 10^{-3} / 5.33\times 10^{-5} = 131\,\mathrm{s}$. The full period is $2 \times 131 = 262\,\mathrm{s}$ — a little over four minutes to drift to one side and back. Two pulses per $262\,\mathrm{s}$ is $3600 \times 2/262 = 27.5$ pulses per hour.

**Propellant.** One thruster firing uses $I_{bit}/(g_0 I_{sp}) = 0.02/(9.80665 \times 220) = 9.27\times 10^{-6}\,\mathrm{kg}$. A couple fires two, so each pulse costs $1.85\times 10^{-5}\,\mathrm{kg}$. Two pulses per $262\,\mathrm{s}$ is $2 \times 1.85\times 10^{-5}/262 = 1.42\times 10^{-7}\,\mathrm{kg/s}$. Times $86\,400$ seconds in a day: $12.2\,\mathrm{g}$ per day for one axis. Times $365$: about $4.5\,\mathrm{kg}$ per year. Across three axes: **$13.4\,\mathrm{kg}$ of hydrazine a year, to do nothing but hold still.**

**Sanity check with the fuel law.** Tighten the deadband to $\pm 0.05^\circ$ (half) and the period halves to $131\,\mathrm{s}$, the pulse rate doubles, and the bill doubles to $26.8\,\mathrm{kg}$ a year. Relax it to $\pm 0.5^\circ$ (five times wider) and the bill falls five-fold to $2.7\,\mathrm{kg}$. That is the strongest argument for reaction wheels, which hold a thousandth of a degree for some electrical power.
:::

### The one-sided limit cycle

Now add a steady outside torque, $M_{dist}$ ("M sub dist", the disturbance). Think of a ball rolled up a gentle slope: it slows, stops and rolls back on its own. The disturbance keeps pushing the vehicle toward one edge. The thrusters fire there and send it back into the band; the disturbance slows it, stops it, and brings it back to the same edge. The thrusters fire in one direction only, and the far edge is never touched. This is the **[[one-sided limit cycle|one-sided-picture]]**.

Now the pulse rate is set by bookkeeping: each pulse removes the angular momentum the disturbance delivered since the last one. The disturbance delivers $M_{dist}$ newton-meter-seconds each second, and each pulse removes $2I_{bit}L$. So

$$
f_{pulse} = \frac{M_{dist}}{2I_{bit}L}.
$$

No $\theta_{db}$ appears: the environment, not the pointing requirement, sets the fuel.

How far does the vehicle swing into the band? It leaves the edge at speed $v = \Delta\omega/2$ and the disturbance slows it at the angular acceleration $a = M_{dist}/I$. Stopping from speed $v$ at a steady slow-down $a$ takes a distance $v^2/(2a)$, the same rule as braking a car. So the swing is

$$
\theta_{swing} = \frac{(\Delta\omega/2)^2}{2a} = \frac{\Delta\omega^2}{8a}.
$$

The cycle stays one-sided as long as the swing fits inside the deadband width, $\theta_{swing} < 2\theta_{db}$. Rearranged, that is

$$
\frac{M_{dist}}{I} > \frac{\Delta\omega^2}{16\,\theta_{db}} .
$$

That is the regime test. A weaker disturbance cannot turn the vehicle around in time, so thrusters fire on both sides — the quantization-dominated case of the fuel law.

::: example One-sided cycling against a gravity-gradient torque
Take the same spacecraft and the gravity-gradient disturbance of lesson 5, $M_{dist} = 2\times 10^{-4}\,\mathrm{N\,m}$, always pushing the same way.

**Which regime?** The disturbance acceleration is $a = 2\times 10^{-4}/900 = 2.22\times 10^{-7}\,\mathrm{rad/s^2}$. The threshold is $\Delta\omega^2/(16\theta_{db}) = (5.33\times 10^{-5})^2/(16 \times 1.745\times 10^{-3}) = 1.02\times 10^{-7}\,\mathrm{rad/s^2}$. The disturbance is about twice the threshold, so the cycle is one-sided.

**Pulse rate.** Each pulse of the couple removes $0.048\,\mathrm{N\,m\,s}$. At $2\times 10^{-4}\,\mathrm{N\,m}$, the disturbance delivers that much in

$$
\frac{0.048}{2\times 10^{-4}} = 240\,\mathrm{s}.
$$

So one pulse every $240\,\mathrm{s}$: $86\,400/240 = 360$ pulses a day. At $1.85\times 10^{-5}\,\mathrm{kg}$ per pulse that is $6.7\,\mathrm{g}$ a day for that axis.

**Swing.** $\theta_{swing} = (5.33\times 10^{-5})^2/(8 \times 2.22\times 10^{-7}) = 1.6\times 10^{-3}\,\mathrm{rad}$, about $0.09^\circ$. It fits inside the $0.2^\circ$ width with room to spare, which agrees with the regime test.

Notice what did *not* appear: the deadband. Shrinking it costs no extra propellant — pulse rate and swing stay the same — until the deadband gets narrower than the swing. Then the far edge gets hit too, the thrusters fight each other, and fuel is wasted.
:::

Oddly, the disturbed vehicle uses less fuel ($6.7\,\mathrm{g}$ a day) than the undisturbed one ($12.2\,\mathrm{g}$). That is right: the disturbance does the turning-around on one side for free.

## Turning a valve into a smooth torque

A control law wants a smooth, continuous torque. The hardware gives on-off pulses. Two standard bridges connect them.

**Schmitt trigger (bang–bang with hysteresis).** "Bang–bang" means full on or full off, nothing in between. The trigger fires when the error rises past an *on* threshold and stops when it falls below a smaller *off* threshold. That gap is **[[hysteresis|hysteresis-word]]** — a deliberate lag between switching on and switching off. It stops the valve chattering on and off at one switching point, and it is what sets the deadband in the analysis above. Simple, robust, and the source of the limit cycle.

**Pulse-width pulse-frequency modulation (PWPF).** Pass the torque command through a first-order lag (a smoothing filter that responds gradually, like a cup filling through a narrow funnel) into a Schmitt trigger, and feed the trigger's output back. Out comes a stream of pulses whose *average* follows the commanded torque almost in straight-line proportion over a wide range. As the command grows, pulses get wider and the gaps shorter. So on average the thrusters act like a proportional actuator. That makes thruster control of a flexible vehicle workable: a bang–bang controller shakes structural modes with its sharp edges, while PWPF can be tuned to keep its pulse train away from them.

Neither escapes the minimum impulse bit. PWPF gets a smaller *average* torque by spacing pulses farther apart, not by making them smaller.

::: warning Quantization is not noise
It is tempting to model the minimum impulse bit as small random noise. It is not random. The pulses are tied to the error signal, so they make a steady limit cycle with a size and period you can compute ahead of time, not a random walk. Treating it as noise predicts a settling that never happens, and hides a propellant burn that goes on forever.
:::

::: example Dumping wheel momentum with thrusters
A reaction wheel has soaked up $1\,\mathrm{N\,m\,s}$ of momentum and must be unloaded. Use the same $1\,\mathrm{N}$ couple at $1.2\,\mathrm{m}$. The vehicle needs $1\,\mathrm{N\,m\,s}$ of outside angular impulse in the opposite sense.

**Firing time.** The couple gives $2FL = 2 \times 1 \times 1.2 = 2.4\,\mathrm{N\,m}$. So it must fire for $1/2.4 = 0.417\,\mathrm{s}$ continuously — or, done in minimum pulses, $1/0.048 = 20.8$, so $21$ pulses.

**Propellant.** Two thrusters each give an impulse of $1 \times 0.417\,\mathrm{N\,s}$. The mass is $2 \times 1 \times 0.417/(9.80665 \times 220) = 3.9\times 10^{-4}\,\mathrm{kg}$ — less than half a gram.

**The bigger comparison.** The gravity-gradient torque of lesson 5 delivers $2\times 10^{-4} \times 86\,400 = 17.3\,\mathrm{N\,m\,s}$ a day about one axis. Removing all of it through wheel dumps costs momentum divided by $L g_0 I_{sp}$: $17.3/(1.2 \times 9.80665 \times 220) = 17.3/2589 = 6.7\,\mathrm{g}$ a day. That is the unavoidable price of that momentum — the same as the one-sided cycle, since the same momentum leaves either way — but the wheels point a thousand times better meanwhile. In low orbit, magnetorquers do it with no propellant at all. So thrusters are kept for high orbits like GEO, large slews, and failed wheels.
:::

::: warning Attitude thrusters move the orbit
Unless every firing is a perfect couple, attitude control also changes the vehicle's speed, $\Delta v$. A $1\,\mathrm{N}$ thruster firing $20\,\mathrm{ms}$ on a $500\,\mathrm{kg}$ vehicle gives $1 \times 0.02/500 = 4\times 10^{-5}\,\mathrm{m/s}$. At 360 pulses a day that is $1.4\times 10^{-2}\,\mathrm{m/s}$ a day, about $5\,\mathrm{m/s}$ a year. If the geometry biases it one way, navigation has to model it. On a rendezvous, attitude pulses show up directly in the relative trajectory, and guidance must account for them.
:::

::: note Where thrusters are the only answer
Thrusters rule wherever the torque needed is large, the time short, or the momentum must leave the vehicle: detumbling after separation; roll control on a launch vehicle whose engine gimbals cannot make roll torque (lesson 8); attitude hold during a main-engine burn, against thousands of newton-meters; entry and landing, where air forces swamp any wheel; and every momentum dump beyond a magnetorquer's reach. The limit-cycle economics above assume a long, quiet mission phase. None of those cases is one.
:::

## Check yourself

::: check
A $2000\,\mathrm{kg\,m^2}$ axis is controlled by couples of $5\,\mathrm{N}$ thrusters at $1.5\,\mathrm{m}$ with a $10\,\mathrm{ms}$ minimum on-time. Compute the rate step and the limit-cycle period for a $\pm 0.25^\circ$ deadband, assuming no disturbance.
:::

::: answer
The impulse bit is $I_{bit} = 5 \times 0.010 = 0.05\,\mathrm{N\,s}$. The couple delivers $2I_{bit}L = 2 \times 0.05 \times 1.5 = 0.15\,\mathrm{N\,m\,s}$ per pulse, so

$$
\Delta\omega = \frac{0.15}{2000} = 7.5\times 10^{-5}\,\mathrm{rad/s} = 4.30\times 10^{-3}\,{}^\circ/\mathrm{s}.
$$

The deadband is $\theta_{db} = 0.25^\circ = 4.363\times 10^{-3}\,\mathrm{rad}$. Each crossing takes $4\theta_{db}/\Delta\omega = 4 \times 4.363\times 10^{-3}/7.5\times 10^{-5} = 233\,\mathrm{s}$. The period is twice that, $465\,\mathrm{s}$ — nearly eight minutes — with two pulses per period, or $15.5$ pulses per hour. The drift rate is $\Delta\omega/2 = 2.15\times 10^{-3}\,{}^\circ/\mathrm{s}$.
:::

::: check
Your customer asks for the pointing deadband to be halved. How does the limit-cycle propellant change in the quantization-dominated case, and in the disturbance-dominated case?
:::

::: answer
Quantization-dominated (symmetric cycle, no significant disturbance): the pulse rate is $\Delta\omega/(4\theta_{db})$, inversely proportional to the deadband. Halving $\theta_{db}$ doubles the pulse rate and doubles the propellant. The period halves too.

Disturbance-dominated (one-sided cycle): the pulse rate is $M_{dist}/(2I_{bit}L)$, which has no $\theta_{db}$ in it. Halving the deadband does not change the propellant at all. The cycle keeps the same swing and period and hugs the same edge. The momentum to be removed is set by the environment, and no deadband tuning changes it. The one catch: if the new deadband width is smaller than the swing $\Delta\omega^2/(8a)$, the cycle turns two-sided and fuel use jumps.

So it depends on the regime: first run the test, $M_{dist}/I$ against $\Delta\omega^2/(16\theta_{db})$, for the new deadband.
:::

::: check
Why does a thruster-controlled vehicle need at least six thrusters for three-axis control, when three reaction wheels are enough?
:::

::: answer
A wheel motor works both ways: it can apply torque about its axis in either sense. So three wheels on independent axes give full three-dimensional control.

A thruster works one way. It can only push, so it makes torque about its torque axis in one sense only. To command any torque you need, for each of three independent directions, a thruster (or combination) for the plus sense and one for the minus sense: six at the very least. In practice there are ten to sixteen, for pure couples, clear plumes, and surviving a stuck valve.

It shows in allocation too: wheels need an ordinary least-squares solve, thrusters a non-negative least-squares problem or linear program, since on-times cannot be negative.
:::

::: check
A vehicle in a disturbance-dominated one-sided limit cycle uses $6.7\,\mathrm{g}$ of hydrazine a day. The team proposes halving the thrusters' minimum on-time. What happens to propellant use, and what improves?
:::

::: answer
Propellant use does not change. The angular momentum to remove each day is $M_{dist} \times 86\,400$, fixed by the environment. The propellant to remove it is that momentum divided by $L g_0 I_{sp}$ — no $I_{bit}$ appears. Halving $I_{bit}$ halves the momentum removed per pulse and doubles the number of pulses. The two exactly cancel.

What improves is the pointing. The swing into the deadband is $\Delta\omega^2/(8a)$, so halving $\Delta\omega$ cuts the swing to a quarter, and the leftover rate error halves. The price is double the valve cycles. A valve's life is counted in cycles (hundreds of thousands to a few million), so better pointing is bought with hardware life, not propellant.
:::

::: check
Explain why PWPF modulation is preferred over a plain Schmitt trigger on a vehicle with a lightly damped structural mode at $2\,\mathrm{Hz}$.
:::

::: answer
A Schmitt trigger makes a few long, hard pulses, timed by the rigid-body error crossing a threshold. Sharp edges carry energy at every frequency, including the structure's resonance, and the limit-cycle repeat rate may land near it too. The lightly damped mode rings, the ringing reaches the rate sensor, and the controller reacts to motion that is not rigid-body at all — the classic control–structure interaction.

PWPF makes a faster stream of shorter pulses whose average follows the command nearly in proportion. That helps twice. The rigid-body loop sees something close to the smooth actuator it was designed for. And the pulse repetition frequency is a design choice, placed well away from the mode — usually above it, where the structure responds less. The cost is more valve cycles and fussier tuning of the lag and hysteresis.

Neither removes the minimum impulse bit. PWPF lowers the average torque by spacing pulses out, not by shrinking them.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{M} = \mathbf{r}\times\mathbf{F}$ | Thruster torque; a single thruster also accelerates the vehicle |
| Couple | Two opposed thrusters; torque $2FL$, net force zero |
| $I_{bit} \approx F t_{min}$ | Minimum impulse bit, set by valve open and close time; measured, not computed |
| $\Delta\omega = 2I_{bit}L/I$ | Rate step from one minimum pulse of a couple |
| $t_{coast} = 4\theta_{db}/\Delta\omega$, $T = 8\theta_{db}/\Delta\omega$ | Symmetric limit-cycle crossing time and period |
| $f_{pulse} = \Delta\omega/(4\theta_{db})$ | Quantization-dominated pulse rate; fuel $\propto I_{bit}/\theta_{db}$ |
| $f_{pulse} = M_{dist}/(2I_{bit}L)$ | Disturbance-dominated one-sided cycle; independent of deadband |
| $\theta_{swing} = \Delta\omega^2/(8a)$, $a = M_{dist}/I$ | One-sided swing; one-sided while $a > \Delta\omega^2/(16\theta_{db})$ |
| Propellant | impulse $/(g_0 I_{sp})$; worked RCS: $12.2\,\mathrm{g/day}$ per axis, $13.4\,\mathrm{kg/year}$ for three |
| Schmitt trigger / PWPF | Bang–bang with hysteresis, or a lag-plus-trigger whose average torque is nearly proportional |

The next lesson moves to the actuator that flies a rocket: a gimbaled main engine. Its torque is the thrust times a lever arm times the sine of a swing angle, and its gimbal has both an angle limit and a rate limit that together cap the control bandwidth.

::: context magnetorquers Steering with Earth's magnetic field
A magnetorquer is a coil of wire, often wound around a metal rod. Run current through it and it becomes an electromagnet. Earth's magnetic field then twists it, the way it twists a compass needle. That twist is an outside torque, so it can drain momentum out of the wheels without spending any propellant. The catch, from lesson 5: the torque is always at right angles to the local field, and the field is weak far from Earth. So magnetorquers work well in low orbit and poorly at GEO.
:::

::: context solenoid-valve Why the valve sets the floor
A solenoid valve is a small metal plunger inside a wire coil. Current through the coil pulls the plunger back and propellant flows. Cut the current and a spring slams it shut. The plunger has mass, so opening and closing each take a few milliseconds. A command shorter than that never fully opens the valve, and what comes out is unpredictable. That physical travel time is where the minimum on-time $t_{min}$ comes from.
:::

::: context couple-picture Twist without shove
Two equal thrusts pointing opposite ways, on opposite sides of the center of mass. The pushes cancel, so the vehicle does not drift. The twists add, so it turns. Each thrust $F$ acts at arm $L$, giving a total torque of $2FL$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="62" width="240" height="26" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="75" r="5" fill="#1f2a44"/>
  <text x="180" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">center of mass</text>
  <line x1="70" y1="62" x2="70" y2="18" stroke="#b4232c" stroke-width="3"/>
  <polygon points="70,12 64,24 76,24" fill="#b4232c"/>
  <text x="80" y="24" font-size="12" fill="#b4232c">F</text>
  <line x1="290" y1="88" x2="290" y2="132" stroke="#b4232c" stroke-width="3"/>
  <polygon points="290,138 284,126 296,126" fill="#b4232c"/>
  <text x="300" y="134" font-size="12" fill="#b4232c">F</text>
  <line x1="75" y1="50" x2="175" y2="50" stroke="#6c7a93" stroke-width="1"/>
  <text x="125" y="45" font-size="12" text-anchor="middle" fill="#6c7a93">L</text>
  <line x1="185" y1="100" x2="285" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <text x="235" y="96" font-size="12" text-anchor="middle" fill="#6c7a93">L</text>
  <text x="330" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">torque</text>
  <text x="330" y="55" font-size="12" text-anchor="middle" fill="#1d6fd1">2FL</text>
</svg>
```
:::

::: context hydrazine The workhorse attitude propellant
Hydrazine is a liquid that breaks apart on its own when it touches a hot catalyst bed, giving off hot gas. No second liquid and no igniter are needed — one tank, one valve per thruster. That simplicity is why most satellites use $1$ to $20\,\mathrm{N}$ hydrazine thrusters for attitude control. It is also toxic, so fueling a satellite is done in protective suits, and newer "green" propellants are slowly replacing it.
:::

::: context shuttle-verniers Big jets, small jets
The Space Shuttle orbiter had 38 primary RCS jets of about $3870\,\mathrm{N}$ each, plus 6 vernier jets of only about $110\,\mathrm{N}$. The primaries were for big moves: docking approaches, fast rotations, backing up the main engines. For holding a steady attitude for hours, their large impulse bit would have meant a coarse, fuel-hungry limit cycle. The verniers, with about one thirty-fifth of the thrust ($3870/110 \approx 35$) and so a far smaller impulse bit, held attitude far more finely and far more cheaply.
:::

::: context deadband-word A zone of "do nothing"
A deadband is a range of error the controller deliberately ignores. Your home thermostat has one; so does a car's steering wheel, which can wiggle a little before the wheels turn. For a thruster, the deadband is a design choice. Too narrow and the thrusters fire constantly, wasting fuel. Too wide and the pointing is sloppy. The fuel law in this lesson is exactly the price list for that choice.
:::

::: context limit-cycle-picture What a symmetric limit cycle looks like
Plot pointing angle against time. The angle drifts in a straight line from one edge of the deadband to the other, a pulse at the edge flips the slope, and it drifts back. The result is a zigzag that repeats forever with period $T = 8\theta_{db}/\Delta\omega$. Each corner is one pulse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="80" x2="345" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="35" x2="345" y2="35" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="125" x2="345" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="39" font-size="11" text-anchor="end" fill="#1f2a44">+θdb</text>
  <text x="34" y="129" font-size="11" text-anchor="end" fill="#1f2a44">−θdb</text>
  <polyline points="40,80 70,35 130,125 190,35 250,125 310,35 332,68" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="70" cy="35" r="4"/><circle cx="130" cy="125" r="4"/><circle cx="190" cy="35" r="4"/><circle cx="250" cy="125" r="4"/><circle cx="310" cy="35" r="4"/></g>
  <line x1="70" y1="20" x2="190" y2="20" stroke="#1f2a44" stroke-width="1"/>
  <text x="130" y="15" font-size="11" text-anchor="middle" fill="#1f2a44">period T</text>
  <text x="340" y="96" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <text x="200" y="152" font-size="11" text-anchor="middle" fill="#b4232c">red dots: one minimum pulse each</text>
</svg>
```
:::

::: context specific-impulse What specific impulse measures
Specific impulse, $I_{sp}$, says how hard a thruster kicks per kilogram of propellant. Oddly, it is quoted in seconds. Multiply by $g_0 = 9.80665\,\mathrm{m/s^2}$ and you get the exhaust speed: $220\,\mathrm{s}$ means gas leaving at about $2160\,\mathrm{m/s}$. Hydrazine thrusters sit around $220$ to $230\,\mathrm{s}$, cold nitrogen gas around $70\,\mathrm{s}$, and bipropellant thrusters around $300\,\mathrm{s}$. Higher is better: the same impulse for less propellant.
:::

::: context one-sided-picture Hugging one edge
With a steady disturbance, the angle traces a row of arches that all touch the same edge. At the edge a pulse sends the vehicle into the band; the disturbance slows it, stops it and brings it back, like a ball rolled up a slope. The far edge is never reached. The arches are parabolas of depth $\Delta\omega^2/(8a)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="135" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="345" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="125" x2="345" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">+θdb</text>
  <text x="34" y="129" font-size="11" text-anchor="end" fill="#1f2a44">−θdb</text>
  <path d="M60,30 Q100,110 140,30 Q180,110 220,30 Q260,110 300,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="60" cy="30" r="4"/><circle cx="140" cy="30" r="4"/><circle cx="220" cy="30" r="4"/><circle cx="300" cy="30" r="4"/></g>
  <line x1="320" y1="30" x2="320" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <text x="326" y="54" font-size="11" fill="#1f2a44">swing</text>
  <text x="190" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">far edge never touched</text>
  <text x="190" y="146" font-size="11" text-anchor="middle" fill="#b4232c">pulses at one edge only</text>
</svg>
```
:::

::: context hysteresis-word Why a gap between on and off
If a heater switched on below $20\,^\circ\mathrm{C}$ and off above $20\,^\circ\mathrm{C}$, it would flick on and off many times a second right at $20$, wearing out the switch. Giving it separate on and off points — on at $19.5$, off at $20.5$ — makes it switch cleanly and rarely. That gap is hysteresis, from the Greek for "lagging behind". A thruster valve has a limited number of cycles in its life, so the same trick protects it.
:::
