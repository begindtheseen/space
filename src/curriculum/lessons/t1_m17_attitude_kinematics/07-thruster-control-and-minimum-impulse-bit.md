---
id: l07-thruster-control-and-minimum-impulse-bit
title: Thruster attitude control and the minimum impulse bit
minutes: 21
covers:
  - 'thruster attitude control and minimum impulse bit'
---

A reaction wheel moves momentum around inside a spacecraft. A thruster puts momentum in or takes it out, which makes it the only attitude actuator that can null what the environment has accumulated. Every wheel-controlled spacecraft therefore carries thrusters or magnetorquers as well, and many vehicles — launch vehicle upper stages, landers, capsules during entry and docking — use thrusters for attitude control from start to finish.

Thrusters come with a property no other actuator has: they are **quantised**. A wheel motor can be commanded to any torque within its range, including one millionth of its maximum. A thruster is a valve. It is open or shut, and it cannot be open for less than the time the valve takes to move — five to twenty milliseconds on a typical solenoid. The smallest impulse it can deliver is a hard floor, called the **minimum impulse bit**, and everything about thruster attitude control follows from that floor: the achievable pointing accuracy, the characteristic limit-cycle behaviour, and the propellant bill.

This lesson works out what that quantisation costs. The headline result to keep is that propellant consumption in a limit cycle is proportional to the minimum impulse bit and inversely proportional to the pointing deadband, so a tighter requirement costs fuel in direct proportion — and that is why a spacecraft that must point to arcseconds uses wheels.

## Making torque with thrusters

A thruster produces a force $\mathbf{F}$ at a position $\mathbf{r}$ relative to the centre of mass, so it produces both a torque and an acceleration:

$$
\mathbf{M} = \mathbf{r}\times\mathbf{F}, \qquad \mathbf{a} = \frac{\mathbf{F}}{m}.
$$

Fire one thruster and the vehicle rotates *and* translates. To rotate without translating, fire two thrusters with equal and opposite forces on opposite sides of the centre of mass — a **couple**. Its torque is $2FL$ for two thrusters of thrust $F$ at moment arm $L$, and its net force is zero. A reaction control system laid out in couples keeps attitude control from perturbing the orbit, which matters during a rendezvous and matters enormously on a vehicle with a delicate trajectory.

Real systems rarely achieve pure couples on every axis. Thrusters are canted to keep plumes off solar arrays and radiators, the centre of mass moves as propellant drains, and a failed thruster forces the remaining ones into asymmetric combinations. So the general problem is allocation: given a desired torque $\mathbf{M}_{des}$, find on-times $t_j \ge 0$ for each thruster such that

$$
\sum_j (\mathbf{r}_j\times\mathbf{F}_j)\,t_j \approx \mathbf{M}_{des}\,\Delta t ,
$$

subject to the non-negativity of on-times, the minimum on-time of each valve, and usually a preference for minimum propellant. The non-negativity is what makes it different from wheel allocation: you cannot pull with a thruster, only push, so you need at least twice as many as you have axes.

## The minimum impulse bit

A command to fire for time $t$ delivers an impulse $\int F\,dt$. That integral is not $Ft$: the valve opens over a few milliseconds, the chamber pressure builds, and at shutdown there is a tail-off as the residual propellant burns. For long firings the ends are a small correction. For short ones they are the whole event.

The **minimum impulse bit** $I_{bit}$ is the smallest impulse the thruster can deliver repeatably, set by the shortest on-time the valve and the controller can command:

$$
I_{bit} = F\,t_{min} \quad\text{(approximately; the real value is measured, not computed)} .
$$

A $1\,\mathrm{N}$ monopropellant hydrazine thruster with a $20\,\mathrm{ms}$ minimum on-time has $I_{bit} \approx 0.02\,\mathrm{N\,s}$. A $400\,\mathrm{N}$ bipropellant thruster at the same on-time has $8\,\mathrm{N\,s}$. A Space Shuttle primary RCS jet, $3870\,\mathrm{N}$ with an $80\,\mathrm{ms}$ minimum, had over $300\,\mathrm{N\,s}$ — which is why the Shuttle also carried much smaller vernier jets for fine pointing.

Two properties matter as much as the value. **Repeatability**: if the delivered impulse varies by $\pm 20\,\%$ from pulse to pulse, the controller cannot predict the rate change it is commanding, and the effective quantum is the uncertainty, not the mean. **Linearity**: below some on-time the impulse stops being proportional to the command at all, which sets a floor no software can work below.

::: key Minimum impulse bit
The smallest impulse a thruster can deliver repeatably, $I_{bit} \approx F t_{min}$, set by valve opening and closing time. It fixes the finest attitude and rate increment available, $\Delta\omega = I_{bit}L/I$ for a single thruster at moment arm $L$ or twice that for a couple, so it puts a floor under pointing deadband and produces limit-cycle rather than settling behaviour in thruster-only control.
:::

Turning it into an attitude quantum: a couple of two thrusters at moment arm $L$ delivers angular impulse $2I_{bit}L$, so one minimum pulse changes the body rate by

$$
\Delta\omega = \frac{2I_{bit}L}{I}.
$$

That is the finest rate change available. Nothing in the control law can produce a smaller one.

## The limit cycle

Because the rate can only be changed in steps of $\Delta\omega$, a thruster-controlled vehicle cannot settle. It oscillates inside its deadband forever, and the shape of that oscillation is the defining behaviour of thruster attitude control.

With no disturbance torque, the cycle is symmetric. The vehicle coasts across the deadband at constant rate, reaches the edge at $+\theta_{db}$, receives one minimum pulse that reverses its rate, coasts back to $-\theta_{db}$, and receives another. For the cycle to close, the pulse must take the rate from $-\Delta\omega/2$ to $+\Delta\omega/2$, so the coast rate is $\Delta\omega/2$ and each traverse of the full deadband width $2\theta_{db}$ takes

$$
t_{coast} = \frac{2\theta_{db}}{\Delta\omega/2} = \frac{4\theta_{db}}{\Delta\omega} .
$$

The full cycle is two traverses and two pulses, so the period is $T = 8\theta_{db}/\Delta\omega$ and the pulse rate is

$$
f_{pulse} = \frac{2}{T} = \frac{\Delta\omega}{4\theta_{db}} = \frac{I_{bit}L}{2 I\,\theta_{db}} .
$$

::: key The limit-cycle fuel law
Pulse rate $= \Delta\omega/(4\theta_{db})$, so propellant consumption is proportional to the minimum impulse bit and inversely proportional to the deadband. Halving the pointing requirement doubles the fuel; halving the impulse bit halves it. The vehicle never settles — it cycles.
:::

::: example A hydrazine RCS holding a tenth of a degree
A $900\,\mathrm{kg\,m^2}$ spacecraft axis is controlled by couples of $1\,\mathrm{N}$ hydrazine thrusters at $L = 1.2\,\mathrm{m}$ moment arm, specific impulse $I_{sp} = 220\,\mathrm{s}$, minimum on-time $20\,\mathrm{ms}$, so $I_{bit} = 0.02\,\mathrm{N\,s}$.

One minimum pulse of the couple delivers $2I_{bit}L = 0.048\,\mathrm{N\,m\,s}$ of angular impulse, changing the rate by

$$
\Delta\omega = \frac{0.048}{900} = 5.33\times 10^{-5}\,\mathrm{rad/s} = 3.06\times 10^{-3}\,{}^\circ/\mathrm{s}.
$$

With a deadband of $\pm 0.1^\circ$, the coast rate is $\Delta\omega/2 = 1.53\times 10^{-3}\,{}^\circ/\mathrm{s}$, each traverse takes $4\theta_{db}/\Delta\omega = 131\,\mathrm{s}$, and the limit-cycle period is $262\,\mathrm{s}$ — a little over four minutes to drift from one side of the deadband to the other and back. That is $27.5$ pulses per hour.

Propellant: each thruster firing consumes $I_{bit}/(g_0 I_{sp}) = 0.02/(9.80665\times 220) = 9.27\times 10^{-6}\,\mathrm{kg}$, and a couple fires two. Two pulses per $262\,\mathrm{s}$ gives $1.42\times 10^{-7}\,\mathrm{kg/s}$, which is $12.2\,\mathrm{g}$ per day for one axis and about $4.5\,\mathrm{kg}$ per year. Across three axes: **$13.4\,\mathrm{kg}$ of hydrazine a year, to do nothing but hold still.**

Tighten the deadband to $\pm 0.05^\circ$ and the period halves to $131\,\mathrm{s}$, the pulse rate doubles, and the bill becomes $26.8\,\mathrm{kg}$ a year. Relax it to $\pm 0.5^\circ$ and it falls to $2.7\,\mathrm{kg}$. This is the single strongest argument for reaction wheels, which hold the same attitude to a thousandth of a degree for the cost of the electrical power.
:::

### The one-sided limit cycle

Add a constant external disturbance and the picture changes shape. The disturbance pushes the vehicle steadily toward one side of the deadband; the thrusters only ever have to fire in one direction, and the cycle becomes one-sided. Now the pulse rate is set by the momentum balance rather than by the geometry: each pulse must remove the angular momentum the disturbance has delivered since the last one, so

$$
f_{pulse} = \frac{M_{dist}}{2I_{bit}L}.
$$

::: example One-sided cycling against a gravity-gradient torque
Take the same spacecraft and the gravity-gradient disturbance of the earlier lesson, $M_{dist} = 2\times 10^{-4}\,\mathrm{N\,m}$ acting secularly. Each minimum pulse of the couple removes $0.048\,\mathrm{N\,m\,s}$, so a pulse is needed every

$$
\frac{0.048}{2\times 10^{-4}} = 240\,\mathrm{s},
$$

that is 360 pulses a day, consuming $6.7\,\mathrm{g}$ a day for that axis. Note what this does *not* depend on: the deadband. In a disturbance-dominated one-sided cycle the fuel is set entirely by the momentum that has to be removed, and tightening the pointing requirement costs nothing extra in propellant — it only makes the cycle faster, with a smaller excursion each time.

That gives a clean design rule. Compare $M_{dist}$ with the torque the symmetric cycle would imply, $2I_{bit}L\,f_{pulse} = \Delta\omega I \cdot \Delta\omega/(4\theta_{db})$. If the disturbance dominates, the fuel is fixed by the environment and you should open the deadband only for margin. If the quantisation dominates, opening the deadband directly buys propellant.
:::

## Modulating a valve into a torque

A control law wants a continuous torque; the hardware provides pulses. Two standard bridges.

**Schmitt trigger (bang–bang with hysteresis).** Fire when the error exceeds an on-threshold, stop when it falls below a smaller off-threshold. The hysteresis gap is what prevents chattering at the switching point and is what sets the deadband in the analysis above. Simple, robust, and the source of the limit cycle.

**Pulse-width pulse-frequency modulation (PWPF).** Feed the torque command through a first-order lag into a Schmitt trigger, and feed the trigger output back. The result is a stream of pulses whose *average* tracks the commanded torque almost linearly over a wide range, with the pulse width growing and the gaps shrinking as the command grows. PWPF lets a thruster system behave, on average, like a proportional actuator, which is what makes thruster control of a flexible vehicle tractable: a bang–bang controller excites structural modes with its sharp edges, while PWPF can be tuned to keep its pulse train away from them.

Neither modulator evades the minimum impulse bit. Both produce pulses of at least $t_{min}$; PWPF lowers the achievable *average* torque by spacing them out, not by making them smaller.

::: warning Quantisation is not noise
It is tempting to model the minimum impulse bit as a small random disturbance and move on. It is not random. The pulses are correlated with the error signal, which is what produces a stable limit cycle rather than a random walk, and the resulting motion has a definite amplitude and period you can compute in advance — as above. Treating it as noise predicts a settling response that never happens, and hides the fact that the vehicle is consuming propellant at a fixed rate forever.
:::

::: example Dumping wheel momentum with thrusters
A reaction wheel has accumulated $1\,\mathrm{N\,m\,s}$ and must be unloaded. Using the same $1\,\mathrm{N}$ couple at $1.2\,\mathrm{m}$, the vehicle needs $1\,\mathrm{N\,m\,s}$ of external angular impulse in the opposite sense, which is $1/(2\times 1\times 1.2) = 0.417\,\mathrm{s}$ of continuous firing, or 21 minimum pulses if done in bits. The propellant is $2\times 1\times 0.417/(9.80665\times 220) = 3.9\times 10^{-4}\,\mathrm{kg}$ — less than half a gram.

That is the comparison that decides the architecture. The gravity-gradient disturbance of the earlier lesson delivers $17.3\,\mathrm{N\,m\,s}$ a day about one axis. Removing it entirely through wheel dumps costs $17.3/(L\,g_0 I_{sp}) = 17.3/2589 = 6.7\,\mathrm{g}$ a day — the irreducible price of that momentum — while holding the same axis by thruster limit cycling in the quantisation-dominated regime costs $12.2\,\mathrm{g}$ a day and points a thousand times worse. In low orbit magnetorquers remove the same momentum for no propellant at all, which is why they are standard there and why thrusters are kept for GEO, for large slews, and for the cases where the wheels have failed.
:::

::: warning Attitude thrusters move the orbit
Unless every firing is a perfect couple, thruster attitude control imparts $\Delta v$. A $1\,\mathrm{N}$ thruster firing $20\,\mathrm{ms}$ on a $500\,\mathrm{kg}$ vehicle gives $4\times 10^{-5}\,\mathrm{m/s}$; at 360 pulses a day that is $1.4\times 10^{-2}\,\mathrm{m/s}$ a day, about $5\,\mathrm{m/s}$ a year, and if the geometry biases it in one direction it is a real orbital perturbation that navigation has to model. On a rendezvous this is not a nuisance but the main event: attitude pulses show up directly in the relative trajectory, and the guidance has to account for them.
:::

::: note Where thrusters are the only answer
Cold gas, monopropellant and bipropellant thrusters dominate attitude control wherever the torque required is large, the duration short, or the momentum must actually leave the vehicle: detumbling after separation, the first minutes of a spinning upper stage's coast, roll control on a launch vehicle whose gimbals cannot produce roll torque, attitude hold during a main-engine burn when the disturbance is thousands of newton-metres, entry and landing where aerodynamic torques swamp any wheel, and every momentum dump above the reach of a magnetorquer. The limit-cycle economics above assume a long, quiet mission phase; none of those cases is one.
:::

## Check yourself

::: check
A $2000\,\mathrm{kg\,m^2}$ axis is controlled by couples of $5\,\mathrm{N}$ thrusters at $1.5\,\mathrm{m}$ with a $10\,\mathrm{ms}$ minimum on-time. Compute the rate quantum and the limit-cycle period for a $\pm 0.25^\circ$ deadband.
:::

::: answer
$I_{bit} = 5 \times 0.010 = 0.05\,\mathrm{N\,s}$. The couple delivers $2I_{bit}L = 2 \times 0.05 \times 1.5 = 0.15\,\mathrm{N\,m\,s}$ per pulse, so

$$
\Delta\omega = \frac{0.15}{2000} = 7.5\times 10^{-5}\,\mathrm{rad/s} = 4.30\times 10^{-3}\,{}^\circ/\mathrm{s}.
$$

The deadband is $\theta_{db} = 0.25^\circ = 4.363\times 10^{-3}\,\mathrm{rad}$. Each traverse takes $4\theta_{db}/\Delta\omega = 4(4.363\times 10^{-3})/7.5\times 10^{-5} = 233\,\mathrm{s}$, so the limit-cycle period is $465\,\mathrm{s}$ — nearly eight minutes — with two pulses per period, or $15.5$ pulses per hour. The coast rate is $\Delta\omega/2 = 2.15\times 10^{-3}\,{}^\circ/\mathrm{s}$.
:::

::: check
Your customer asks for the pointing deadband to be halved. By how much does the limit-cycle propellant change, in the quantisation-dominated case and in the disturbance-dominated case?
:::

::: answer
Quantisation-dominated (symmetric cycle, no significant disturbance): the pulse rate is $\Delta\omega/(4\theta_{db})$, inversely proportional to the deadband, so halving $\theta_{db}$ doubles the pulse rate and doubles the propellant. The cycle period halves, the excursion halves, and the fuel bill doubles.

Disturbance-dominated (one-sided cycle): the pulse rate is $M_{dist}/(2I_{bit}L)$, which contains no $\theta_{db}$ at all. Halving the deadband changes the propellant not at all; it only makes the cycle run faster with smaller excursions. The momentum that must be removed is set by the environment, and no amount of deadband tuning changes it.

The practical answer is therefore "it depends on which regime you are in", and the first thing to do is compute both rates and compare them.
:::

::: check
Why does a thruster-controlled vehicle need at least six thrusters for three-axis control, when three reaction wheels suffice?
:::

::: answer
A wheel motor is bidirectional: it can apply torque about its axis in either sense, so three independent axes give full three-dimensional control.

A thruster is unidirectional. It can only push, so it produces torque about its own torque axis in one sense only. To command an arbitrary torque you need, for each of three independent directions, a thruster (or combination) for the positive sense and one for the negative sense: six at a minimum, and in practice ten to sixteen to give pure couples, to keep plumes clear, and to tolerate a failed-on or failed-off valve.

The same asymmetry appears in the allocation problem. Wheel allocation is an unconstrained least-squares solve; thruster allocation is a non-negative least-squares or linear program, because on-times cannot be negative.
:::

::: check
A vehicle in a disturbance-dominated one-sided limit cycle uses $6.7\,\mathrm{g}$ per day of hydrazine. The team proposes halving the thrusters' minimum on-time. What happens to the propellant use, and what improves?
:::

::: answer
The propellant use does not change. In the one-sided cycle the angular momentum to be removed per day is $M_{dist}\times 86400$, fixed by the environment, and the propellant needed to remove it is that momentum divided by $L\,g_0 I_{sp}$ — no $I_{bit}$ appears. Halving $I_{bit}$ halves the momentum removed per pulse and doubles the number of pulses, exactly cancelling.

What improves is the pointing. Each pulse now changes the rate by half as much, so the excursion inside the deadband halves and the residual rate error halves. You also double the valve cycle count, which is a life-limited quantity on a solenoid — typically hundreds of thousands to a few million cycles — so the improvement is bought with hardware life, not propellant.
:::

::: check
Explain why PWPF modulation is preferred over a plain Schmitt trigger on a vehicle with a lightly damped structural mode at $2\,\mathrm{Hz}$.
:::

::: answer
A Schmitt-trigger controller produces a small number of long, hard pulses whose timing is set by the rigid-body error crossing a threshold. The step edges are broadband in frequency, so they deposit energy across the spectrum, including at the structural resonance, and the limit-cycle repetition rate itself may land near it. With light damping the mode rings, the ringing feeds back into the rate sensor, and the controller responds to a signal that is not rigid-body motion — the classic control–structure interaction.

PWPF produces a higher-rate stream of shorter pulses whose average follows the command nearly linearly. Two things help: the average torque is smoother, so the rigid-body loop sees something close to the continuous actuator it was designed for; and the pulse repetition frequency is a design parameter that can be placed well away from the structural mode, typically above it, where the structure's response rolls off. The cost is more valve cycles and some sensitivity in tuning the lag and the hysteresis.

Neither approach removes the minimum impulse bit. PWPF lowers the achievable average torque by spacing pulses out, not by shrinking them.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{M} = \mathbf{r}\times\mathbf{F}$ | Thruster torque; a single thruster also accelerates the vehicle |
| Couple | Two opposed thrusters; torque $2FL$, net force zero |
| $I_{bit} \approx F t_{min}$ | Minimum impulse bit, set by valve open and close time; measured, not computed |
| $\Delta\omega = 2I_{bit}L/I$ | Rate quantum from one minimum pulse of a couple |
| $t_{coast} = 4\theta_{db}/\Delta\omega$, $T = 8\theta_{db}/\Delta\omega$ | Symmetric limit-cycle traverse and period |
| $f_{pulse} = \Delta\omega/(4\theta_{db})$ | Quantisation-dominated pulse rate; fuel $\propto I_{bit}/\theta_{db}$ |
| $f_{pulse} = M_{dist}/(2I_{bit}L)$ | Disturbance-dominated one-sided cycle; independent of deadband |
| Worked RCS | $1\,\mathrm{N}$ at $1.2\,\mathrm{m}$, $I_{bit} = 0.02\,\mathrm{N\,s}$: $\Delta\omega = 3.06\times 10^{-3}\,{}^\circ/\mathrm{s}$, $262\,\mathrm{s}$ cycle at $\pm 0.1^\circ$ |
| Propellant | $12.2\,\mathrm{g/day}$ per axis, $13.4\,\mathrm{kg/year}$ for three — against grams per day for wheel dumping |
| Schmitt trigger / PWPF | Hysteresis bang–bang, or a lag-plus-trigger that linearises the average torque |

The next lesson moves to the actuator that flies a rocket: a gimballed main engine, whose torque is the thrust times a lever arm times the sine of a deflection angle, and whose gimbal has both an angle limit and a rate limit that together cap the control bandwidth.
