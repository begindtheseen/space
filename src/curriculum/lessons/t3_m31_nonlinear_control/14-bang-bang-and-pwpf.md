---
id: l14-bang-bang-and-pwpf
title: 'Bang-bang and on-off thruster control: Schmitt trigger and PWPF'
minutes: 24
covers:
  - 'Bang-bang and on-off thruster control: Schmitt trigger and pulse-width pulse-frequency modulation'
---

A light switch has two settings. A dimmer has every setting in between. Every control law in this module assumed a dimmer: a continuous torque $\mathbf{u}$ you can set to any value. Reaction wheels come close. Thrusters do not. A **[[thruster valve|thruster-valve]]** is open or it is shut, so the vehicle gets $+M$, $-M$ or nothing — full push one way, full push the other way, or no push. This lesson is where that hardware fact, quietly assumed away everywhere else, becomes the thing you design around.

It splits into two different problems.

The first: a large turn is needed, and on-off is all you have. The answer is not a compromise. It is provably the *fastest possible* maneuver, built straight from the phase-plane tools at the start of this module.

The second is harder in practice. A valve has a minimum time it can stay open. So how do you make it follow a small, slowly changing command — the kind a fine-pointing loop produces — without ever asking for a pulse shorter than the valve can deliver? The answer is **pulse-width pulse-frequency modulation**, and understanding it reaches back to the describing functions of two lessons ago.

## Bang-bang: optimal when your only choice is on or off

Picture reaching a stop sign as fast as possible in a car with only two pedal positions: floored, or brakes slammed. Floor it, then slam the brakes at exactly the moment that stops you on the line. Brake early and you crawl the last bit; brake late and you overshoot. The whole design is choosing that one switch moment. Control that slams between its two limits like this is called **[[bang-bang|bang-bang-name]]** control.

Now the vehicle version. Take a single axis,

$$
J\ddot{\theta}=u, \qquad |u|\le U_{\max} .
$$

Here $\theta$ ("theta") is the attitude angle, $\ddot\theta$ ("theta double-dot") its angular acceleration, $J$ the moment of inertia, and $U_{\max}$ ("U max") the largest torque the thrusters give. The question: what is the fastest way to go from rest at $\theta_0$ to rest at $0$?

### The parabolas of constant torque

Use the phase plane from early in this module: plot the angle $\theta$ across and the rate $\dot\theta$ up. With constant torque $u=+U_{\max}$, the acceleration is the constant $a=U_{\max}/J$. To get the shape of the path, use the chain rule to write $\ddot\theta = \frac{d\dot\theta}{dt} = \frac{d\dot\theta}{d\theta}\,\frac{d\theta}{dt}$, so

$$
\ddot\theta\,d\theta=\dot\theta\,d\dot\theta .
$$

Put in $\ddot\theta=U_{\max}/J$ and integrate both sides:

$$
\tfrac12\dot\theta^2 = \frac{U_{\max}}{J}\,\theta + C .
$$

That is a family of **parabolas** lying on their side, opening toward increasing $\theta$; the constant $C$ picks which one. Constant $u=-U_{\max}$ gives the mirror family, opening toward decreasing $\theta$.

### The switching curve

The **switching curve** is made of the one member of each family that passes through the origin. It is the unique full-torque arc that brakes the vehicle to a stop exactly at $\theta=0$:

$$
\theta_{\text{sw}}(\dot\theta) = -\,\mathrm{sign}(\dot\theta)\,\frac{J\dot\theta^2}{2U_{\max}} .
$$

Read $\theta_{\text{sw}}$ as "theta switch". The $\mathrm{sign}(\dot\theta)$ picks the branch: moving in the plus direction, you brake from negative $\theta$ up to zero.

The time-optimal law pushes toward this curve, then rides it home:

$$
u=-U_{\max}\,\mathrm{sign}\big(\theta-\theta_{\text{sw}}(\dot\theta)\big) .
$$

Full torque one way until the state reaches the curve. Then full torque the other way, along the curve, to the origin.

### The minimum time

Take the simplest case: start from rest and turn through an angle $\Delta\theta$ ("delta theta"). By symmetry, the speed-up half and the braking half are mirror images, so the switch comes halfway, after the vehicle has turned $\Delta\theta/2$ in some time $t_1$. Starting from rest with constant acceleration $a$, the angle covered is $\tfrac12 a t_1^2$. Set that equal to half the turn:

$$
\tfrac12\,\frac{U_{\max}}{J}\,t_1^2 = \frac{\Delta\theta}{2}
\quad\Longrightarrow\quad
\Delta\theta = \frac{U_{\max}}{J}\,t_1^2 .
$$

Solve for $t_1$, and double it for the braking half:

$$
t_1 = \sqrt{\frac{J\Delta\theta}{U_{\max}}}, \qquad T_{\min} = 2t_1 = 2\sqrt{\frac{J\Delta\theta}{U_{\max}}} .
$$

Drawn in the phase plane, the **[[switching curve|switching-curve-picture]]** is two half-parabolas meeting at the origin: one in the upper left (moving in the plus direction, braking toward zero) and one in the lower right (the mirror image).

::: example A rest-to-rest slew, timed and checked
**The numbers.** $J=40\,\mathrm{kg\,m^2}$, $U_{\max}=8\,\mathrm{N\,m}$, $\Delta\theta=0.6\,\mathrm{rad}$ ($\approx34.4^\circ$).

$$
t_1=\sqrt{\frac{40\times0.6}{8}}=\sqrt{3}=1.732051\,\mathrm{s},\qquad T_{\min}=2t_1=3.464102\,\mathrm{s}.
$$

**Checking by simulation.** Full torque forward for $t_1$, then backward for $t_1$, at $\Delta t=10\,\mu\mathrm{s}$: the vehicle ends at $\theta=0.600000\,\mathrm{rad}$ with a leftover rate below $10^{-16}\,\mathrm{rad/s}$ — rounding error.

**Checking the switch point.** At the switch, $\theta_1=0.300000\,\mathrm{rad}$ — half the turn — and the rate is $\dot\theta_1=a\,t_1=0.2\times1.732051=0.346410\,\mathrm{rad/s}$. The braking distance from that rate is $J\dot\theta_1^2/(2U_{\max}) = 40\times0.12/16 = 0.300000\,\mathrm{rad}$. It matches the $0.3\,\mathrm{rad}$ still to go, to six figures.

**Now from an awkward start:** $\theta_0=-0.9\,\mathrm{rad}$, $\dot\theta_0=0.25\,\mathrm{rad/s}$ — already moving, and below the curve, so the rest-to-rest arithmetic does not apply. First work out what the best open-loop plan *should* take. Speed up at $a=U_{\max}/J=0.2\,\mathrm{rad/s^2}$ to a peak rate $\dot\theta_1$, then brake to the origin. The speed-up parabola through the start point and the braking parabola through the origin meet where

$$
\dot\theta_1=\sqrt{\frac{\dot\theta_0^2}{2}-a\theta_0}=\sqrt{0.03125+0.18}=0.459619\,\mathrm{rad/s}.
$$

Reaching it takes $(\dot\theta_1-\dot\theta_0)/a=(0.459619-0.25)/0.2=1.048095\,\mathrm{s}$. Braking from it takes $\dot\theta_1/a=2.298097\,\mathrm{s}$. Total: $3.346192\,\mathrm{s}$.

The feedback law, given only the current state, simulated at $\Delta t=10\,\mu\mathrm{s}$, brings $\lvert\theta\rvert$ and $\lvert\dot\theta\rvert$ both below $10^{-4}$ in $3.3457\,\mathrm{s}$, using **one** torque reversal. That matches the plan. (It is a hair early because "done" means within $10^{-4}$.)

**Does it make sense?** One reversal is right: for a double integrator with bounded torque, the time-optimal control has at most one switch, so a correct switching-curve law reproduces the open-loop optimum without computing it. More reversals are a finding, not a feature. At $\Delta t=1\,\mathrm{ms}$ this same law overshoots the curve, crosses back, and takes $3.478\,\mathrm{s}$ with two reversals. That extra switch is the integration step talking — and on a vehicle it would be a real valve cycle.
:::

::: note Why it has to be true: one switch is enough
Every point in the phase plane lies on exactly one $+U_{\max}$ parabola and exactly one $-U_{\max}$ parabola. Only one of each ends at the origin: those two arcs are the switching curve. So from any start, follow your own full-torque parabola until it meets the curve, then ride the curve home. Along a full-torque parabola the rate changes steadily in one direction, so the path meets the braking branch ahead of it once. Pontryagin's maximum principle supplies the other half: for this plant the fastest control always sits at a limit, so nothing gentler can beat it.
:::

::: key The switching curve
$\theta_{\text{sw}}(\dot\theta) = -\mathrm{sign}(\dot\theta)\,J\dot\theta^2/(2U_{\max})$. The time-optimal rest-to-rest law is full torque toward the curve, then full torque along it. Minimum time for a simple rest-to-rest slew of $\Delta\theta$:
$$
T_{\min}=2\sqrt{J\Delta\theta/U_{\max}} .
$$
This is not an approximation to the best a continuous actuator could do. For pure on-off authority, it *is* the best possible, with exactly one switch in the simplest case.
:::

::: warning A perfect relay on the curve chatters
An ideal relay riding this curve, with no lag and no minimum pulse, is the degenerate case the describing-function lesson warned about. A relay on a bare double integrator has no finite predicted chattering frequency, because $L(j\omega)=1/(J(j\omega)^2)=-1/(J\omega^2)$ sits on the negative real axis at every frequency.

In simulation that is infinitely fast switching at the curve; on hardware, the fastest chatter the valve can manage. Avoiding it is what the rest of this lesson is for.
:::

## The hardware will not switch like that

A valve takes time to open and close, so it has a **[[minimum impulse bit|minimum-impulse-bit]]** — the smallest push it can reliably deliver. (An **impulse** is force, or torque, multiplied by the time it acts; here it is torque times on-time, in $\mathrm{N\,m\,s}$.) Ask for less and you get an unpredictable fraction of it, or nothing.

A fine-pointing loop needs exactly the small, slowly changing corrections a valve is worst at. What you want is a translator that turns a smooth command into pulses that

- never ask for less than the valve can give, and
- on average, behave like the smooth torque every earlier control law assumed it was commanding.

**Pulse-width pulse-frequency (PWPF) modulation** is the standard translator. Its pulses get both *wider* and more *frequent* as the command grows — hence the name.

## PWPF: a filter, a Schmitt trigger, and feedback of its own output

### The Schmitt trigger: a switch with memory

A home thermostat set to $20^\circ\mathrm{C}$ does not click the heater on at $19.99^\circ$ and off at $20.01^\circ$, over and over. It turns on at, say, $19^\circ$ and off at $21^\circ$. The gap stops the rattling.

A switch that turns on at one level and off at a lower one is a **[[Schmitt trigger|schmitt-trigger]]**. It has **hysteresis** — its output depends on which way it was last driven, not only on the input right now. In other words, it has memory.

### The three pieces

1. A smooth command $e(t)$ — a torque request from an outer attitude or rate loop, in $\mathrm{N\,m}$.
2. A first-order **lag filter**,
   $$
   T_m\dot{x}+x=K_me-U ,
   $$
   with time constant $T_m$ ("T sub m") and gain $K_m$. Here $U\in\{-M,0,+M\}$ is the modulator's *own current pulse output*, fed back with a minus sign. So the filter's real input is the gap between what was asked for and what is being delivered.
3. A **Schmitt trigger** reading the filter output $x$. The output $U$ switches to $+M$ once $x$ reaches an upper threshold $\delta_{\text{on}}$ ("delta on"). It stays at $+M$ until $x$ falls back to a lower threshold $\delta_{\text{off}}$ ("delta off"), with $\delta_{\text{off}}\lt\delta_{\text{on}}$. Negative commands work the same way in mirror image. The gap
   $$
   h=\delta_{\text{on}}-\delta_{\text{off}}
   $$
   is the **hysteresis band**.

The feedback is what makes this a modulator. Without it, the trigger fires once and stays fired. With the output subtracted back in, firing *removes* the drive that caused it, so $x$ heads back down and the trigger lets go. A fixed threshold on a raw command becomes a **[[self-timed pulse train|pwpf-trace]]**, whose width and spacing depend on how far $e$ sits above the threshold.

### The describing function of a hysteretic relay

The ideal relay's describing function was $N(A)=4M/(\pi A)$. Hysteresis changes it. Take the simplest relay with hysteresis: output $\pm M$, switching up when the input rises through $+\varepsilon$ and down when it falls through $-\varepsilon$ ("epsilon", the half-width of its band).

Drive it with $A\sin\theta$, where $\theta$ here is the angle around one cycle of the wave, not an attitude. It does not switch high at $\theta=0$; it waits until the input clears $+\varepsilon$, at

$$
\theta_1=\arcsin(\varepsilon/A) .
$$

So the output is the ideal relay's square wave, **delayed** by $\theta_1$: same fundamental size $b_1=4M/\pi$, shifted. A shift of $\theta_1$ turns $b_1\sin\theta$ into

$$
b_1\sin(\theta-\theta_1)=b_1\cos\theta_1\,\sin\theta - b_1\sin\theta_1\,\cos\theta .
$$

The $\sin\theta$ part is in phase with the input and the $\cos\theta$ part is a quarter-cycle behind. Using $\cos\theta_1=\sqrt{1-(\varepsilon/A)^2}$ and $\sin\theta_1=\varepsilon/A$, and dividing by $A$:

$$
N(A) = \frac{4M}{\pi A}\left[\sqrt{1-\left(\frac{\varepsilon}{A}\right)^2} \ -\ j\,\frac{\varepsilon}{A}\right], \qquad A \ge \varepsilon .
$$

It is **complex**, unlike every $N(A)$ in the describing-function lesson. Hysteresis is memory, and **[[memory costs phase|memory-costs-phase]]**. Now $-1/N(A)$ leaves the real axis, so predicting a limit cycle means finding where the *full* complex curve $-1/N(A)$ meets $L(j\omega)$ — the same picture as before, with one more dimension to search.

### Pulse timing in closed form

Hold $e$ constant. Between switches, the lag filter slides $x$ exponentially toward its input.

- **While off** ($U=0$): $x$ starts at $\delta_{\text{off}}$ and heads toward $K_me$. The pulse fires when it reaches $\delta_{\text{on}}$.
- **While on** ($U=M$): $x$ starts at $\delta_{\text{on}}$ and heads toward $K_me-M$. The pulse ends when it falls to $\delta_{\text{off}}$.

Heading toward a target $x_\infty$, the gap shrinks as $x(t)-x_\infty=(x(0)-x_\infty)\,e^{-t/T_m}$. Solving for the time to reach each threshold:

$$
t_{\text{off}} = T_m\ln\!\left(\frac{K_me-\delta_{\text{off}}}{K_me-\delta_{\text{on}}}\right), \qquad
t_{\text{on}} = T_m\ln\!\left(\frac{M-K_me+\delta_{\text{on}}}{M-K_me+\delta_{\text{off}}}\right) .
$$

In the off leg, the gap starts at $K_me-\delta_{\text{off}}$ and must shrink to $K_me-\delta_{\text{on}}$: the time is $T_m$ times the log of their ratio. The on leg is the same with target $K_me-M$.

The **duty cycle** — the fraction of time the thruster is on — is $t_{\text{on}}/(t_{\text{on}}+t_{\text{off}})$. The **pulse rate** is $1/(t_{\text{on}}+t_{\text{off}})$.

::: example Duty cycle, pulse rate, and the price of a finer hysteresis band
**The settings.** $K_m=1$, $T_m=0.1\,\mathrm{s}$, $\delta_{\text{on}}=0.6$, $\delta_{\text{off}}=0.4$ (so $h=0.2$), $M=2\,\mathrm{N\,m}$.

**One row by hand**, at $e=0.65$:

$$
t_{\text{off}}=0.1\ln\frac{0.65-0.4}{0.65-0.6}=0.1\ln\frac{0.25}{0.05}=0.1\ln5=0.160944\,\mathrm{s},
$$

$$
t_{\text{on}}=0.1\ln\frac{2-0.65+0.6}{2-0.65+0.4}=0.1\ln\frac{1.95}{1.75}=0.010821\,\mathrm{s}.
$$

The duty cycle is $0.010821/0.171765=6.30\%$ and the pulse rate is $1/0.171765=5.82\,\mathrm{Hz}$. The rest of the table is the same arithmetic:

| $e$ | $t_{\text{on}}$ | $t_{\text{off}}$ | duty | pulse rate |
| --- | --- | --- | --- | --- |
| $0.65$ | $0.010821\,\mathrm{s}$ | $0.160944\,\mathrm{s}$ | $6.30\%$ | $5.82\,\mathrm{Hz}$ |
| $0.70$ | $0.011123\,\mathrm{s}$ | $0.109861\,\mathrm{s}$ | $9.19\%$ | $8.27\,\mathrm{Hz}$ |
| $0.80$ | $0.011778\,\mathrm{s}$ | $0.069315\,\mathrm{s}$ | $14.52\%$ | $12.33\,\mathrm{Hz}$ |
| $0.90$ | $0.012516\,\mathrm{s}$ | $0.051083\,\mathrm{s}$ | $19.68\%$ | $15.72\,\mathrm{Hz}$ |

**Checking by simulation.** Integrating the filter-and-trigger equations directly, run until the pulse pattern settles, reproduces $t_{\text{on}}$ and $t_{\text{off}}$ at $e=0.65$ and $e=0.8$ to five figures. The closed form is not an approximation of the modulator. Once the start-up transient has died away, it *is* the modulator.

**Reading the table.** Pulses get wider *and* more frequent as $e$ grows, and the duty cycle rises smoothly — the averaged, nearly linear behavior a control law upstream needs.

**Now sweep the band.** Fix $e=0.8$, hold $\delta_{\text{on}}=0.6$, and move $\delta_{\text{off}}$ up toward it so $h$ shrinks:

| $h$ | $t_{\text{on}}$ | pulse rate | impulse per pulse $=Mt_{\text{on}}$ |
| --- | --- | --- | --- |
| $0.20$ | $0.011778\,\mathrm{s}$ | $12.33\,\mathrm{Hz}$ | $0.023557\,\mathrm{N\,m\,s}$ |
| $0.10$ | $0.005716\,\mathrm{s}$ | $21.62\,\mathrm{Hz}$ | $0.011432\,\mathrm{N\,m\,s}$ |
| $0.05$ | $0.002817\,\mathrm{s}$ | $39.79\,\mathrm{Hz}$ | $0.005634\,\mathrm{N\,m\,s}$ |
| $0.02$ | $0.001117\,\mathrm{s}$ | $93.91\,\mathrm{Hz}$ | $0.002235\,\mathrm{N\,m\,s}$ |

Halving $h$ roughly halves the on-time and the impulse of each pulse, and nearly doubles how often a pulse fires. The duty cycle — and so the average torque — barely moves: $14.5\%$ at $h=0.2$ and $10.5\%$ at $h=0.02$, across a tenfold change in $h$.

**Does it make sense?** Yes. A narrower band changes not *how hard* the modulator pushes on average, but *how finely chopped* the push is — the sliding-mode boundary-layer trade again, where a thinner layer $\phi$ bought a smaller error $\phi/\Lambda$ at the cost of more switching.
:::

## The limit cycle the hysteresis band leaves behind

Put PWPF in a real attitude loop and it never quite sits still. Picture holding a shopping cart on a gentle slope with only sharp taps: it rolls, you tap it back, it rolls again. The vehicle drifts, a pulse kicks it back, it drifts again — a steady back-and-forth called a **limit cycle**. The hysteresis band decides how big it is.

### The smallest pulse

The shortest pulse happens when the command sits right at the threshold, $K_me=\delta_{\text{on}}$. Put that into the $t_{\text{on}}$ formula:

$$
t_{\text{on,min}}=T_m\ln\!\left(\frac{M-\delta_{\text{on}}+\delta_{\text{on}}}{M-\delta_{\text{on}}+\delta_{\text{off}}}\right)=T_m\ln\!\left(\frac{M}{M-h}\right)\approx T_m\,\frac{h}{M}\quad (h\ll M),
$$

using $\ln\frac{1}{1-z}\approx z$ for small $z$. Multiply by $M$ to get the smallest impulse:

$$
I_{\min}=M\,t_{\text{on,min}}\approx T_m\,h .
$$

The band times the filter time constant sets the smallest push the modulator ever gives. Size $h$ to keep it above the valve's minimum impulse bit.

### How big the swing is

Say a steady disturbance torque $d$ (from sunlight, or a leak) pushes the vehicle, giving an angular acceleration $a_d=d/J$. Each pulse changes the rate by $\Delta\omega=I_{\min}/J$ the other way. In the steady cycle the pulse flips the rate from $+\Delta\omega/2$ to $-\Delta\omega/2$. The disturbance then slows the vehicle to a stop and brings it back — like a ball tossed up and falling back — reaching a distance

$$
\text{swing}\approx\frac{(\Delta\omega/2)^2}{2a_d}=\frac{\Delta\omega^2}{8a_d} .
$$

Since $\Delta\omega$ grows in proportion to $h$, the swing grows like $h^2$.

::: example A pointing loop holding against a steady disturbance
**The setup.** $J=40\,\mathrm{kg\,m^2}$, thruster torque $M=2\,\mathrm{N\,m}$, the same modulator ($K_m=1$, $T_m=0.1\,\mathrm{s}$, $\delta_{\text{on}}=0.6$). The outer loop commands $e=-(20\,\theta+100\,\dot\theta)$ in $\mathrm{N\,m}$. A steady disturbance $d=0.002\,\mathrm{N\,m}$ pushes on the vehicle, so $a_d=0.002/40=5\times10^{-5}\,\mathrm{rad/s^2}$. Simulate for $600\,\mathrm{s}$ and measure over the last $300\,\mathrm{s}$.

**One row by hand**, at $h=0.2$: $I_{\min}=2\times0.1\ln(2/1.8)=0.02107\,\mathrm{N\,m\,s}$, so $\Delta\omega=0.02107/40=5.27\times10^{-4}\,\mathrm{rad/s}$, and

$$
\text{swing}\approx\frac{(5.27\times10^{-4})^2}{8\times5\times10^{-5}}=\frac{2.78\times10^{-7}}{4\times10^{-4}}=6.9\times10^{-4}\,\mathrm{rad}=0.69\,\mathrm{mrad}.
$$

| $h$ | impulse per pulse (sim) | pulses per minute | swing (sim) | swing (formula) |
| --- | --- | --- | --- | --- |
| $0.40$ | $0.0434\,\mathrm{N\,m\,s}$ | $2.8$ | $2.94\,\mathrm{mrad}$ | $3.11\,\mathrm{mrad}$ |
| $0.20$ | $0.0208\,\mathrm{N\,m\,s}$ | $5.8$ | $0.675\,\mathrm{mrad}$ | $0.694\,\mathrm{mrad}$ |
| $0.10$ | $0.0102\,\mathrm{N\,m\,s}$ | $11.8$ | $0.162\,\mathrm{mrad}$ | $0.164\,\mathrm{mrad}$ |
| $0.05$ | $0.0052\,\mathrm{N\,m\,s}$ | $23.2$ | $0.042\,\mathrm{mrad}$ | $0.040\,\mathrm{mrad}$ |

(One mrad, a milliradian, is a thousandth of a radian — about $0.057^\circ$.)

**Reading the table.** The formula tracks the simulation within about $5\%$. The vehicle leans against the disturbance near $\theta\approx0.03\,\mathrm{rad}$, the dead-band edge $\delta_{\text{on}}/(K_m\times20)$.

**Does it make sense? Check the fuel.** Each minute the disturbance adds $0.002\times60=0.12\,\mathrm{N\,m\,s}$, which the thrusters must remove. At $h=0.4$: $2.8\times0.0434=0.12$. At $h=0.05$: $23.2\times0.0052=0.12$. A narrower band costs no propellant. It costs [[valve cycles|limit-cycle-valves]] — eight times as many at $h=0.05$ as at $h=0.4$ — in exchange for a swing about seventy times smaller.
:::

::: key PWPF
Pulse-width pulse-frequency modulation converts a continuous torque command into on-off thruster pulses using a lag filter and a Schmitt trigger. It approximates linear behavior on average while respecting the minimum impulse bit, and its hysteresis band sets the limit-cycle amplitude.

The filter $T_m\dot x+x=K_me-U$ feeds back the modulator's own output. The smallest impulse is $I_{\min}\approx T_m h$, so a narrower band $h$ gives finer, more frequent pulses and a tighter limit cycle — the chattering-versus-accuracy trade a boundary layer makes for a sliding surface.
:::

::: warning The dead-band is real
If a command never drives $K_me$ above $\delta_{\text{on}}$, the filter settles below the threshold and the modulator never fires at all. That is a genuine dead-band, not an approximation of one.

It is a feature when the outer loop's noise sits below it, and a bug when the mission must respond to a disturbance smaller than $\delta_{\text{on}}/K_m$. Sizing the threshold against the smallest disturbance to reject is as much part of the design as sizing $h$ against the minimum impulse bit.
:::

## Check yourself

::: check
Why is a single torque reversal enough for the simplest bang-bang slew? And what did it mean when the awkward-start example showed two reversals at $\Delta t=1\,\mathrm{ms}$?
:::

::: answer
Starting from rest, the speed-up and braking halves are mirror images. The state meets the switching curve once, at the midpoint, and the braking arc runs straight to the origin. In fact a double integrator with bounded torque never needs more than one switch from *any* start — follow your full-torque parabola to the curve, then ride it — which is why the awkward start, simulated finely, also used one.

The second reversal at $\Delta t=1\,\mathrm{ms}$ is numerical: the coarse step carried the state past the curve, so the law switched back. Each crossing of $\theta-\theta_{\text{sw}}(\dot\theta)=0$ is a sign change in the control; extra crossings come from the step size, and on hardware each would be a wasted valve cycle.
:::

::: check
A colleague sets a Schmitt trigger's hysteresis $h$ to zero, reasoning "less hysteresis is always better, since it tightens the limit cycle." What breaks?
:::

::: answer
As $h\to0$, the tables show $t_{\text{on}}\to0$ and the pulse rate growing without limit: vanishingly narrow, endlessly frequent pulses, the ideal-relay chattering the bang-bang section warned about. No valve can deliver that. $h$ must keep the smallest commanded pulse, $I_{\min}\approx T_m h$, above the valve's minimum impulse bit; below that, the hardware silently fails to deliver what the modulator asks.
:::

::: check
Use the filter equation $T_m\dot x+x=K_me-U$ to explain why the pulses get both wider *and* more frequent as $e$ increases, rather than only one of the two.
:::

::: answer
A larger $e$ raises the off-phase target $K_me$ further above $\delta_{\text{on}}$, so $x$ climbs to the threshold faster: $t_{\text{off}}$ shrinks, and pulses come more often. The same $e$ raises the on-phase target $K_me-M$ closer to $\delta_{\text{off}}$, so $x$ falls back more slowly: $t_{\text{on}}$ grows, and pulses get wider. One command shifts both targets at once — hence both words in the name.
:::

::: check
Why does the hysteretic relay's describing function have a nonzero imaginary part, while the plain relay and saturation describing functions from the earlier lesson did not?
:::

::: answer
A nonzero imaginary part means the output's fundamental is shifted in phase from the input. That needs memory — a record of *which way* the nonlinearity was last driven, so the same input can give different outputs. A plain relay or saturation reads only the current input, so its fundamental is exactly in phase and $N(A)$ is real. Hysteresis is memory, and the lag $\theta_1=\arcsin(\varepsilon/A)$ is its price.
:::

::: check
A mission wants to respond to a disturbance torque smaller than the modulator's threshold $\delta_{\text{on}}/K_m$, without changing the valve hardware. Which two parameters can change, and what does each cost?
:::

::: answer
**Raise $K_m$.** That lowers the command level $\delta_{\text{on}}/K_m$ needed to fire, so smaller disturbances get a response. Cost: a higher gain also turns small noise on $e$ into real pulses.

**Lower $\delta_{\text{on}}$.** Same effect, more directly. Cost: a thinner margin between "definitely off" and "definitely on," so noise near the threshold fires the trigger more easily.

Both trade noise rejection against disturbance rejection — the whole game with one threshold and one filter time constant.
:::

::: check
In the pointing-loop example, you cut $h$ from $0.2$ to $0.1$. Predict what happens to the swing, the pulses per minute, and the propellant used, before looking at the table.
:::

::: answer
The smallest impulse is about $T_mh$, so it halves: $\Delta\omega$ halves. The swing goes as $\Delta\omega^2$, so it drops to about a quarter: $0.69/4\approx0.17\,\mathrm{mrad}$ (the table says $0.162$ simulated, $0.164$ by formula).

The thrusters must still remove the $0.12\,\mathrm{N\,m\,s}$ per minute the disturbance adds, so half-size pulses must come twice as often: about $11.8$ per minute instead of $5.8$. Propellant is unchanged, because it depends on the total impulse, not how it is chopped. The price of the tighter swing is valve wear.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\theta_{\text{sw}}(\dot\theta)=-\mathrm{sign}(\dot\theta)J\dot\theta^2/(2U_{\max})$ | Time-optimal switching curve for $J\ddot\theta=u$, $\lvert u\rvert\le U_{\max}$ |
| $T_{\min}=2\sqrt{J\Delta\theta/U_{\max}}$ | Minimum time, simple rest-to-rest slew |
| $J=40$, $U_{\max}=8$, $\Delta\theta=0.6$ | $T_{\min}=3.464\,\mathrm s$; simulation lands at rest to rounding error |
| One switch | Enough for a double integrator from any start; extra switches are numerical |
| Relay on a bare $1/(Js^2)$ | Degenerate: no finite chatter frequency |
| Minimum impulse bit | Smallest pulse a real valve delivers reliably |
| PWPF filter | $T_m\dot x+x=K_me-U$; own output fed back |
| Schmitt trigger | Switches on at $\delta_{\text{on}}$, off at $\delta_{\text{off}}$; $h=\delta_{\text{on}}-\delta_{\text{off}}$ |
| $N(A)=\tfrac{4M}{\pi A}\!\left[\sqrt{1-(\varepsilon/A)^2}-j\,\varepsilon/A\right]$ | Hysteretic relay (switching at $\pm\varepsilon$); complex, unlike a memoryless nonlinearity's |
| $t_{\text{off}}=T_m\ln\frac{K_me-\delta_{\text{off}}}{K_me-\delta_{\text{on}}}$, $t_{\text{on}}=T_m\ln\frac{M-K_me+\delta_{\text{on}}}{M-K_me+\delta_{\text{off}}}$ | Closed-form pulse timing; matches direct simulation to 5 figures |
| $h:0.20\to0.02$ | Impulse per pulse $0.0236\to0.0022\,\mathrm{N\,m\,s}$; duty cycle nearly unchanged |
| $I_{\min}\approx T_mh$ | Smallest impulse the modulator gives |
| Swing $\approx\Delta\omega^2/(8a_d)$ | Limit-cycle size against a steady disturbance; grows like $h^2$ |
| Dead-band | No firing at all while $K_me\le\delta_{\text{on}}$ — by design, not by approximation |

The module opened by asking whether an equilibrium is stable. It closes by asking whether the actuator can physically deliver the torque the proof assumed. Every law along the way — quaternion feedback, sliding mode, backstepping, passivity, tracking — produces the kind of smooth command this lesson turns into something a valve can fire.

::: context thruster-valve What a thruster valve is
A small attitude thruster is a nozzle fed through an electrically operated valve. Send current to the valve's coil and a magnet pulls it open; cut the current and a spring snaps it shut. Propellant flows only while it is open.

Opening and closing are fast, but not instant — they take a few milliseconds. That is why a thruster is an on-off device: there is no useful "half open." It is also why very short pulses are unreliable. If the valve is told to close before it has fully opened, the push you get is some unpredictable fraction of what you asked for.
:::

::: context bang-bang-name Why "bang-bang"
The name describes what you would hear from a mechanical actuator driven this way: it slams against one stop — bang — then slams against the other — bang. There is no gentle middle.

The deeper point was proved in the 1950s by Lev Pontryagin and his colleagues in their maximum principle. For many systems with bounded inputs, the *fastest* possible control always sits at one limit or the other. So bang-bang is not a crude approximation of good control. For minimum-time problems, it often *is* the best control, and the only design question is when to switch.
:::

::: context switching-curve-picture The switching curve, drawn
The picture shows the phase plane for $J=40\,\mathrm{kg\,m^2}$, $U_{\max}=8\,\mathrm{N\,m}$. The red curve is the switching curve: the upper-left branch brakes a vehicle moving in the plus direction to a stop at the origin, and the lower-right branch does the same for one moving the other way.

The blue path is a rest-to-rest slew from $\theta=-0.6\,\mathrm{rad}$. It rides a full-torque parabola up to the switch point at $(-0.3,\ 0.346)$, then follows the curve down to the origin. Exactly one switch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <text x="340" y="115" font-size="12" fill="#1f2a44" text-anchor="end">θ</text>
  <text x="186" y="20" font-size="12" fill="#1f2a44">rate</text>
  <polyline points="180.0,100.0 179.8,96.8 179.1,93.6 178.0,90.4 176.5,87.2 174.5,84.0 172.1,80.8 169.2,77.6 165.9,74.4 162.2,71.2 158.0,68.0 153.4,64.8 148.3,61.6 142.8,58.4 136.9,55.2 130.5,52.0 123.7,48.8 116.4,45.6 108.7,42.4 100.6,39.2 92.0,36.0 83.0,32.8 73.5,29.6 63.6,26.4 53.3,23.2 42.5,20.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="180.0,100.0 180.2,103.2 180.9,106.4 182.0,109.6 183.5,112.8 185.5,116.0 187.9,119.2 190.8,122.4 194.1,125.6 197.8,128.8 202.0,132.0 206.6,135.2 211.7,138.4 217.2,141.6 223.1,144.8 229.5,148.0 236.3,151.2 243.6,154.4 251.3,157.6 259.4,160.8 268.0,164.0 277.0,167.2 286.5,170.4 296.4,173.6 306.7,176.8 317.5,180.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="48.0,100.0 52.4,85.7 56.8,79.8 61.2,75.2 65.6,71.4 70.0,68.0 74.4,64.9 78.8,62.1 83.2,59.5 87.6,57.1 92.0,54.7 96.4,52.5 100.8,50.4 105.2,48.4 109.6,46.5 114.0,44.6" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="114.0,44.6 125.5,49.6 135.8,54.7 145.1,59.7 153.3,64.7 160.4,69.8 166.4,74.8 171.3,79.8 175.1,84.9 177.8,89.9 179.5,95.0 180.0,100.0" fill="none" stroke="#1d6fd1" stroke-width="3" stroke-dasharray="7,4"/>
  <circle cx="48" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="114" cy="44.6" r="4.5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="48" y="118" font-size="11" fill="#1d6fd1" text-anchor="middle">start −0.6</text>
  <text x="110" y="34" font-size="11" fill="#1f2a44" text-anchor="end">switch</text>
  <text x="250" y="138" font-size="11" fill="#b4232c">switching curve</text>
  <text x="80" y="160" font-size="11" fill="#1d6fd1">solid: +U max</text>
  <text x="80" y="176" font-size="11" fill="#1d6fd1">dashed: −U max</text>
</svg>
```
:::

::: context minimum-impulse-bit Why tiny pulses are hard
A thruster's push during a pulse is not a clean rectangle. After the valve is told to open, pressure takes a moment to build in the chamber, and after it is told to close, propellant already past the valve still flows out. For a long burn those ragged edges hardly matter. For a very short pulse they *are* the pulse, and they vary from one firing to the next with temperature and wear.

So each thruster has a smallest impulse it can repeat reliably — its minimum impulse bit. Attitude control software is written to never command less.
:::

::: context schmitt-trigger A switch borrowed from a nerve
The Schmitt trigger is named after Otto Schmitt, an American scientist who invented the circuit in the 1930s as a graduate student while studying how impulses travel along squid nerves. He wanted an electronic device that, like a nerve, fired cleanly once a threshold was crossed and did not flicker on noise.

It is now everywhere: in thermostats, in the input pins of computer chips, and in thruster modulators. The picture shows the rule. Output goes to $+M$ when the input rises past $\delta_{\text{on}}$ and drops to $0$ only when it falls back below $\delta_{\text{off}}$; the negative side is the mirror image.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <line x1="90" y1="100" x2="270" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="270" y1="100" x2="270" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="270,50 264,62 276,62" fill="#1d6fd1"/>
  <line x1="240" y1="40" x2="335" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="240" y1="40" x2="240" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="240,90 234,78 246,78" fill="#1d6fd1"/>
  <line x1="90" y1="100" x2="90" y2="160" stroke="#8fb8f0" stroke-width="3"/>
  <line x1="25" y1="160" x2="120" y2="160" stroke="#8fb8f0" stroke-width="3"/>
  <line x1="120" y1="160" x2="120" y2="100" stroke="#8fb8f0" stroke-width="3"/>
  <text x="270" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">δ on</text>
  <text x="236" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">δ off</text>
  <text x="186" y="36" font-size="12" fill="#1f2a44">+M</text>
  <text x="186" y="172" font-size="12" fill="#1f2a44">−M</text>
  <text x="340" y="92" font-size="12" fill="#1f2a44" text-anchor="end">x</text>
  <text x="300" y="30" font-size="11" fill="#1d6fd1" text-anchor="middle">on</text>
  <text x="255" y="140" font-size="11" fill="#b4232c" text-anchor="middle">band h</text>
  <line x1="240" y1="128" x2="270" y2="128" stroke="#b4232c" stroke-width="2"/>
</svg>
```
:::

::: context pwpf-trace The pulse train, drawn
Here is what the modulator does over time for a steady command $e=0.8$, with the settings of the duty-cycle example. The filter output $x$ (top) climbs toward $K_me=0.8$. When it reaches $\delta_{\text{on}}=0.6$ the pulse fires (bottom). With the output fed back, $x$ now heads toward $K_me-M=-1.2$, so it falls quickly, and the pulse ends at $\delta_{\text{off}}=0.4$. Then the climb starts again.

The first climb from zero is longer. After that, every cycle is identical: $11.8\,\mathrm{ms}$ on, $69.3\,\mathrm{ms}$ off.
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="345" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="41.4" x2="345" y2="41.4" stroke="#b4232c" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="40" y1="64.3" x2="345" y2="64.3" stroke="#b4232c" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="36" y="45" font-size="11" fill="#b4232c" text-anchor="end">δ on</text>
  <text x="36" y="68" font-size="11" fill="#b4232c" text-anchor="end">δ off</text>
  <text x="36" y="114" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <polyline points="40.0,110.0 44.0,104.7 48.0,99.6 52.1,94.9 56.1,90.4 60.1,86.2 64.1,82.3 68.1,78.5 72.1,75.0 76.2,71.7 80.2,68.6 84.2,65.7 88.2,62.9 92.2,60.3 96.3,57.9 100.3,55.6 104.3,53.4 108.3,51.4 112.3,49.5 116.3,47.7 120.4,46.0 124.4,44.4 128.4,42.8 132.4,41.4 140.3,64.3 144.5,61.5 148.7,58.9 152.9,56.4 157.1,54.1 161.3,51.9 165.5,49.9 169.7,48.0 173.9,46.2 178.1,44.5 182.3,42.9 186.5,41.4 194.3,64.3 198.5,61.5 202.7,58.9 206.9,56.4 211.1,54.1 215.3,51.9 219.5,49.9 223.7,48.0 227.9,46.2 232.1,44.5 236.3,42.9 240.5,41.4 248.4,64.3 252.6,61.5 256.8,58.9 261.0,56.4 265.2,54.1 269.4,51.9 273.6,49.9 277.8,48.0 282.0,46.2 286.2,44.5 290.4,42.9 294.6,41.4 302.5,64.3 306.6,61.5 310.8,58.9 315.0,56.5 319.1,54.2 323.3,52.0 327.5,50.0 331.7,48.1 335.8,46.3 340.0,44.6" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="40.0,170 132.4,170 132.4,145 140.3,145 140.3,170 186.5,170 186.5,145 194.3,145 194.3,170 240.5,170 240.5,145 248.4,145 248.4,170 294.6,170 294.6,145 302.5,145 302.5,170 340.0,170" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="345" y="28" font-size="11" fill="#1d6fd1" text-anchor="end">filter output x</text>
  <text x="36" y="160" font-size="11" fill="#1f2a44" text-anchor="end">U</text>
  <text x="190" y="192" font-size="11" fill="#1f2a44" text-anchor="middle">0 to 0.45 s: pulses 11.8 ms on, 69.3 ms off</text>
</svg>
```
:::

::: context memory-costs-phase Why memory means lag
Think of the thermostat again. As the room warms and cools in a slow wave, the heater does not switch at the middle of the wave. It switches on a little *after* the room passes the set point on the way down, and off a little after it passes on the way up. Its on-off pattern is the same shape as a switch with no gap, shifted later in time.

A delay in a repeating signal is a phase lag. That is all the $-j\,\varepsilon/A$ term in $N(A)$ says: the band makes the relay answer late by the angle $\theta_1=\arcsin(\varepsilon/A)$. And a lag inside a feedback loop eats into phase margin, which is why a hysteretic relay can ring in a loop where a plain one would not.
:::

::: context limit-cycle-valves Valves wear out
The pointing-loop example showed that a narrower hysteresis band costs no extra propellant, only more pulses. That is not free. Every valve is qualified for a limited number of open-close cycles over its life, and a spacecraft holding attitude for years with thrusters can run up a very large count.

So thruster-controlled missions set the modulator's band with a cycle budget in mind: tight enough to meet the pointing requirement, loose enough that the valves last the mission. The $h^2$ law for the swing and the $1/h$ law for the pulse rate are exactly the two numbers that trade.
:::
