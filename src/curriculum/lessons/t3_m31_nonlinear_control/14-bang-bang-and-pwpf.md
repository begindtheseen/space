---
id: l14-bang-bang-and-pwpf
title: 'Bang-bang and on-off thruster control: Schmitt trigger and PWPF'
minutes: 26
covers:
  - 'Bang-bang and on-off thruster control: Schmitt trigger and pulse-width pulse-frequency modulation'
---

Every control law in this module has been written in terms of a continuous $\mathbf{u}$ — a torque you can dial to any value you like. Reaction wheels come close to that. Thrusters do not: a valve is open or it is shut, and the vehicle gets $+M$, $-M$, or nothing, with nothing in between. This lesson is where that hardware fact, quietly assumed away everywhere else, becomes the thing being designed around.

It splits into two genuinely different problems. The first is what to do when a large reorientation is needed and on-off is the only authority you have — and the answer is not a compromise forced by the hardware, it is provably the *fastest* possible manoeuvre, built directly on the phase-plane tools from early in this module. The second is the harder practical problem: a thruster valve has a minimum time it can stay open at all, so how do you make it track a small, slowly varying, continuous-looking command — the kind a fine-pointing loop or a disturbance-rejection loop produces — without ever asking for a pulse narrower than the hardware can deliver? The answer, pulse-width pulse-frequency modulation, reaches back for the describing-function toolkit from two lessons ago to understand its own behaviour.

By the end, every controller this module has built — Lyapunov-proved, sliding-mode, backstepped, passivity-shaped, tracking a moving target — has a path to the one actuator most vehicles actually carry.

## Bang-bang: optimal when your only choice is on or off

Take a single axis, $J\ddot{\theta}=u$, $|u|\le U_{\max}$, and ask for the fastest way to go from rest at $\theta_0$ to rest at $0$. Constant $u=+U_{\max}$ traces a curve in the phase plane — the same $(\theta,\dot\theta)$ plane the phase-plane lesson used to classify equilibria — found by writing $\ddot\theta\,d\theta=\dot\theta\,d\dot\theta$ and integrating: $\tfrac12\dot\theta^2 = (U_{\max}/J)\theta + C$, a family of parabolas opening toward increasing $\theta$. Constant $u=-U_{\max}$ gives the mirror family, opening toward decreasing $\theta$.

The **switching curve** is the one member of each family that passes through the origin — the unique constant-torque arc that brakes a trajectory to an exact stop exactly at $\theta=0$:

$$
\theta_{\text{sw}}(\dot\theta) = -\,\mathrm{sign}(\dot\theta)\,\frac{J\dot\theta^2}{2U_{\max}} .
$$

The time-optimal law brakes toward this curve and rides it home: apply $u=-U_{\max}\,\mathrm{sign}\big(\theta-\theta_{\text{sw}}(\dot\theta)\big)$, full torque one way until the state reaches the curve, then (if not already there) the other way along it. For the simplest case — starting from rest, so the whole manoeuvre is one accelerate phase and one symmetric brake phase — the accelerate phase covers half the total angle $\Delta\theta$ in some time $t_1$, satisfying $\Delta\theta = (U_{\max}/J)t_1^2$ from the parabola above, so

$$
t_1 = \sqrt{\frac{J\Delta\theta}{U_{\max}}}, \qquad T_{\min} = 2t_1 = 2\sqrt{\frac{J\Delta\theta}{U_{\max}}} .
$$

::: example A rest-to-rest slew, timed and checked
$J=40\,\mathrm{kg\,m^2}$, $U_{\max}=8\,\mathrm{N\,m}$, $\Delta\theta=0.6\,\mathrm{rad}$ ($34.377^\circ$): $t_1=\sqrt{40(0.6)/8}=1.732051\,\mathrm{s}$, $T_{\min}=3.464102\,\mathrm{s}$. Integrating full-throttle for $t_1$, then full reverse for $t_1$, at $\Delta t=10\,\mu\mathrm{s}$: final $\theta=0.599999\,\mathrm{rad}$ (target $0.6$), final $\dot\theta=-4.7\times10^{-17}\,\mathrm{rad/s}$ (target $0$) — the closed-form time lands the vehicle at rest, essentially exactly. The switch point itself checks against the curve formula: $\theta_1=0.300000\,\mathrm{rad}$, $\dot\theta_1=0.346410\,\mathrm{rad/s}$, and $J\dot\theta_1^2/(2U_{\max})=0.300000$ — matches to six figures.

The general switching-curve law, not only this symmetric case, was tested from an arbitrary state, $\theta_0=-0.9\,\mathrm{rad}$, $\dot\theta_0=0.25\,\mathrm{rad/s}$ — already moving, and below the curve rather than on it, so nothing about the symmetric rest-to-rest arithmetic applies. Work out what the open-loop optimum *should* be first. Accelerating at $a=U_{\max}/J=0.2\,\mathrm{rad/s^2}$ to a peak rate $\dot\theta_1$ and then decelerating to the origin requires $\dot\theta_1=\sqrt{\dot\theta_0^2/2-a\theta_0}=\sqrt{0.03125+0.18}=0.459619\,\mathrm{rad/s}$, reached after $(\dot\theta_1-\dot\theta_0)/a=1.048095\,\mathrm{s}$ and bled off over a further $\dot\theta_1/a=2.298097\,\mathrm{s}$: $3.346192\,\mathrm{s}$ in total. The feedback law $u=-U_{\max}\,\mathrm{sign}(\theta-\theta_{\text{sw}})$, given no plan and only the current state, drives it to $\lvert\theta\rvert,\lvert\dot\theta\rvert\lt10^{-4}$ in $3.3457\,\mathrm{s}$ using **one** torque reversal. One is the right answer and it is worth knowing why: a double integrator under bounded torque has a time-optimal control with at most a single switch, so a correctly implemented switching-curve law reproduces the open-loop optimum without ever computing it. If your implementation shows more than one reversal, that is a finding, not a feature — at $\Delta t=1\,\mathrm{ms}$ this same law overshoots the curve, crosses back, and takes $3.478\,\mathrm{s}$ with two reversals. The extra switches are the integrator step talking, not the control law, and on a vehicle each one of them is a real valve cycle.
:::

::: key The switching curve
$\theta_{\text{sw}}(\dot\theta) = -\mathrm{sign}(\dot\theta)\,J\dot\theta^2/(2U_{\max})$; the time-optimal rest-to-rest law is full torque toward the curve, then full torque along it. Minimum time for a simple rest-to-rest slew of $\Delta\theta$: $T_{\min}=2\sqrt{J\Delta\theta/U_{\max}}$. This is not an approximation to the best a continuous actuator could do — for pure on-off authority, it *is* the best possible, with exactly one switch for the simplest case.
:::

::: warning
An idealized relay riding exactly on this switching curve, with no actuator lag and no minimum pulse width, is the same degenerate case the describing-function lesson warned about: a relay on a bare double integrator has no finite predicted chattering frequency, because $L(j\omega)=1/(Js^2)$ sits on the negative real axis at every frequency. In simulation that shows up as infinitely fast switching right at the curve; on real hardware it shows up as the fastest chatter the valve can physically manage, which is exactly the problem the rest of this lesson exists to avoid inflicting on the actuator.
:::

## The hardware won't switch like that

A thruster valve has a **minimum impulse bit** — the smallest reliable pulse it can deliver, set by how fast the valve can open and close. Command it a pulse narrower than that and you get an unpredictable fraction of the intended impulse, or none. A fine-pointing loop, or a loop holding against a small steady disturbance, needs exactly the kind of small, slowly-varying corrections a minimum-impulse-bit-limited valve is worst at delivering directly. **Pulse-width pulse-frequency (PWPF) modulation** is the standard answer: convert a continuous command into a train of pulses whose *width* and *frequency* both vary with the command, in a way that never asks for less than the valve can give, while still averaging to something close to the linear response every earlier lesson's control law assumed it was commanding.

## PWPF: a filter, a Schmitt trigger, and feedback of its own output

The modulator has three pieces. A continuous command $e(t)$ (a torque request from an outer attitude or rate loop) drives a first-order **filter**, $T_m\dot{x}+x=K_me-U$, where $U\in\{-M,0,+M\}$ is the modulator's *own current pulse output*, fed back with a minus sign — the filter's real input is the error between what was asked for and what has been delivered so far. The filter output $x$ drives a **Schmitt trigger**: $U$ switches to $+M$ once $x$ reaches an upper threshold $\delta_{\text{on}}$, and stays there until $x$ falls back to a lower threshold $\delta_{\text{off}}\lt\delta_{\text{on}}$ (mirrored for negative commands). The gap $h=\delta_{\text{on}}-\delta_{\text{off}}$ is the **hysteresis band**.

The feedback through the filter is what makes this a modulator rather than a plain switch: without it, a Schmitt trigger fires once and stays fired as soon as $e$ clears the threshold. With the filter's own output subtracted back in, firing *removes* the drive that caused the firing, so $x$ heads back down and the trigger releases — turning a fixed threshold on a raw command into a self-timed pulse train whose width and spacing depend on how far $e$ sits above threshold.

**The Schmitt trigger's describing function** extends the ideal relay's from the earlier lesson. Driven by $A\sin\theta$, the trigger switches high not at $\theta=0$ but once the input first clears $+h$, at $\theta_1=\arcsin(h/A)$ — the whole waveform is the ideal relay's square wave, delayed by $\theta_1$. A phase shift of $\theta_1$ in a pure sinusoid turns $b_1\sin\theta$ into $b_1\sin(\theta-\theta_1)=b_1\cos\theta_1\sin\theta - b_1\sin\theta_1\cos\theta$, so

$$
N(A) = \frac{4M}{\pi A}\left[\sqrt{1-\left(\frac{h}{A}\right)^2} \ -\ j\,\frac{h}{A}\right], \qquad A \ge h .
$$

Complex, unlike every $N(A)$ in the earlier lesson — hysteresis is memory, and memory costs phase. $-1/N(A)$ no longer sits on the real axis, so predicting a limit cycle for a Schmitt trigger wrapped around a plant means hunting for where the *full* complex locus $-1/N(A)$ meets $L(j\omega)$, the same picture as before with one more dimension to search.

**The duty cycle, in closed form.** Hold $e$ constant. While off, $x$ charges toward $K_me$ from $\delta_{\text{off}}$; while on, it charges toward $K_me-M$ from $\delta_{\text{on}}$. Both legs are a single first-order exponential, so both switching times solve in closed form:

$$
t_{\text{off}} = T_m\ln\!\left(\frac{K_me-\delta_{\text{off}}}{K_me-\delta_{\text{on}}}\right), \qquad
t_{\text{on}} = T_m\ln\!\left(\frac{M-K_me+\delta_{\text{on}}}{M-K_me+\delta_{\text{off}}}\right) .
$$

::: example Duty cycle, pulse rate, and the price of a finer hysteresis band
$K_m=1$, $T_m=0.1\,\mathrm{s}$, $\delta_{\text{on}}=0.6$, $\delta_{\text{off}}=0.4$ ($h=0.2$), $M=2\,\mathrm{N\,m}$. For constant commands:

| $e$ | $t_{\text{on}}$ | $t_{\text{off}}$ | duty | pulse rate |
| --- | --- | --- | --- | --- |
| $0.65$ | $0.010821\,\mathrm{s}$ | $0.160944\,\mathrm{s}$ | $6.30\%$ | $5.82\,\mathrm{Hz}$ |
| $0.70$ | $0.011123\,\mathrm{s}$ | $0.109861\,\mathrm{s}$ | $9.19\%$ | $8.27\,\mathrm{Hz}$ |
| $0.80$ | $0.011778\,\mathrm{s}$ | $0.069315\,\mathrm{s}$ | $14.52\%$ | $12.33\,\mathrm{Hz}$ |
| $0.90$ | $0.012516\,\mathrm{s}$ | $0.051083\,\mathrm{s}$ | $19.68\%$ | $15.72\,\mathrm{Hz}$ |

A direct numerical simulation of the filter-and-trigger ODE, run to its steady pulse pattern, reproduces $t_{\text{on}}$ and $t_{\text{off}}$ at $e=0.65$ and $e=0.8$ to five figures — the closed form is not an approximation of the modulator, it *is* the modulator, once the transient has died out. Duty cycle rises smoothly with $e$: this is the "pulse-width" and "pulse-frequency" the method is named for, both increasing together as the command grows, exactly the averaged-linear behaviour a downstream control law needs.

Now fix $e=0.8$ and sweep the hysteresis band instead, holding $\delta_{\text{on}}=0.6$ fixed and shrinking $\delta_{\text{off}}$ toward it:

| $h$ | $t_{\text{on}}$ | pulse rate | impulse per pulse $=Mt_{\text{on}}$ |
| --- | --- | --- | --- |
| $0.20$ | $0.011778\,\mathrm{s}$ | $12.33\,\mathrm{Hz}$ | $0.023557\,\mathrm{N\,m\,s}$ |
| $0.10$ | $0.005716\,\mathrm{s}$ | $21.62\,\mathrm{Hz}$ | $0.011432\,\mathrm{N\,m\,s}$ |
| $0.05$ | $0.002817\,\mathrm{s}$ | $39.79\,\mathrm{Hz}$ | $0.005634\,\mathrm{N\,m\,s}$ |
| $0.02$ | $0.001117\,\mathrm{s}$ | $93.91\,\mathrm{Hz}$ | $0.002235\,\mathrm{N\,m\,s}$ |

Halving $h$ roughly halves both the on-time and the impulse delivered by each individual pulse, while roughly doubling how often a pulse fires — the duty cycle, and so the average torque, barely moves ($14.5\%\to10.5\%$ across a tenfold change in $h$). A narrower hysteresis band does not change *how hard* the modulator pushes on average; it changes *how finely chopped* that push is. That finer chopping is the mechanism — the same trade the sliding-mode lesson's boundary layer made explicit with a clean $\phi/\Lambda$ formula — by which a smaller $h$ buys a tighter closed-loop dead-band at the cost of a switch count the valve has to survive.
:::

::: key PWPF
A first-order filter with the modulator's own output fed back, driving a Schmitt trigger, converts a continuous command into on-off pulses whose width and frequency both grow with the command — an averaged linear response built entirely from switches. The hysteresis band $h$ sets the swing of the filter's own internal state, and through it, the size of the smallest impulse the modulator ever delivers: a narrower band means finer, more frequent corrections and a tighter achievable dead-band, exactly the chattering-versus-accuracy trade a boundary layer makes for a sliding surface.
:::

::: warning
If a command never drives $K_me$ above $\delta_{\text{on}}$, the filter asymptotes below threshold and the modulator never fires at all — a genuine dead-band, not an approximation of one. This is a feature when the outer loop's own noise floor sits below it, and a bug when a mission requirement needs a response to a disturbance smaller than $\delta_{\text{on}}/K_m$; sizing the threshold against the smallest disturbance torque the mission must reject is as much a part of the design as sizing $h$ against the valve's minimum impulse bit.
:::

## Check yourself

::: check
Why is a single torque reversal enough for the simplest bang-bang slew, and why did the general-initial-condition example need three?
:::

::: answer
Starting from rest, the accelerate phase and the brake phase are mirror images of each other and the state reaches the switching curve exactly once, at the manoeuvre's midpoint — one reversal. Starting already in motion the "wrong way" relative to the curve, the state may need an initial phase to first get onto a branch that leads home, then a reversal to follow the curve, then whatever correction is needed once numerical overshoot carries it slightly past — each crossing of $\theta-\theta_{\text{sw}}(\dot\theta)=0$ is one more sign change in the control law, and the number of crossings depends on where the trajectory starts relative to the curve, not on the law itself.
:::

::: check
A colleague sizes a Schmitt trigger's hysteresis $h$ to zero, reasoning "less hysteresis is always better since it tightens the dead-band." What breaks?
:::

::: answer
As $h\to0$ the table above shows $t_{\text{on}}\to0$ and the pulse rate diverges — the modulator asks for infinitely narrow, infinitely frequent pulses, exactly the ideal-relay chattering the bang-bang section warned about, and no real valve can deliver a vanishing impulse bit at an unbounded rate. $h$ has to be sized no smaller than what keeps the commanded $t_{\text{on}}$ above the valve's actual minimum impulse bit; below that, the modulator is asking for something the hardware silently fails to provide.
:::

::: check
Explain, using the filter equation $T_m\dot x+x=K_me-U$, why the modulator's pulses get both wider *and* more frequent as $e$ increases, rather than one or the other.
:::

::: answer
A larger $e$ raises the OFF-phase asymptote $K_me$ further above $\delta_{\text{on}}$, so $x$ charges toward threshold faster and $t_{\text{off}}$ shrinks — more frequent pulses. The same larger $e$ also raises the ON-phase asymptote $K_me-M$ closer to (or, near saturation, above) $\delta_{\text{off}}$, so $x$ takes longer to fall back down and $t_{\text{on}}$ grows — wider pulses. Both effects come from the same single command $e$ shifting both asymptotes at once, which is why the name carries both words.
:::

::: check
Why does the Schmitt trigger's describing function have a nonzero imaginary part while the plain relay and saturation describing functions from the earlier lesson did not?
:::

::: answer
A nonzero imaginary part in $N(A)$ means the fundamental of the output is phase-shifted relative to the input, and that requires the nonlinearity to have memory — some notion of *which way* it was last driven, so the same instantaneous input can produce different outputs. A plain relay or a saturation curve reads only the current input value, output determined afresh at every instant, so their response is either exactly in phase or exactly out of phase with the input — real, never complex. Hysteresis is memory by definition, and the phase lag it introduces is the price of that memory.
:::

::: check
A mission wants to reject a disturbance torque smaller than the PWPF modulator's threshold $\delta_{\text{on}}/K_m$ without touching the valve hardware. What two parameters can be changed, and what does each cost?
:::

::: answer
Raise $K_m$, which lowers the effective command level $\delta_{\text{on}}/K_m$ needed to reach threshold at a given physical $e$, letting smaller disturbances trigger a response — at the cost of the modulator becoming more sensitive to noise on $e$, since a higher gain turns smaller fluctuations into real pulses too. Or lower $\delta_{\text{on}}$ itself directly, which does the same thing more directly but shrinks the margin between "definitely off" and "definitely on," making the trigger point more sensitive to measurement noise sitting near threshold. Neither is free; both trade noise rejection against disturbance rejection, which is the entire game with a device built out of one threshold and one filter time constant.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\theta_{\text{sw}}(\dot\theta)=-\mathrm{sign}(\dot\theta)J\dot\theta^2/(2U_{\max})$ | Time-optimal switching curve for $J\ddot\theta=u$, $\lvert u\rvert\le U_{\max}$ |
| $T_{\min}=2\sqrt{J\Delta\theta/U_{\max}}$ | Minimum time, simple rest-to-rest slew |
| $J=40$, $U_{\max}=8$, $\Delta\theta=0.6$ | $T_{\min}=3.464\,\mathrm s$; simulated to $4.7\times10^{-17}\,\mathrm{rad/s}$ residual |
| Relay on a bare $1/(Js^2)$ | Degenerate, no finite chatter frequency (from the describing-function lesson) |
| Minimum impulse bit | Smallest pulse a real valve delivers reliably |
| PWPF filter | $T_m\dot x+x=K_me-U$; own output fed back |
| Schmitt trigger | Switches at $\delta_{\text{on}}$, releases at $\delta_{\text{off}}$; $h=\delta_{\text{on}}-\delta_{\text{off}}$ |
| $N(A)=\tfrac{4M}{\pi A}\!\left[\sqrt{1-(h/A)^2}-j\,h/A\right]$ | Hysteretic-relay describing function; complex, unlike a memoryless nonlinearity's |
| $t_{\text{off}}=T_m\ln\frac{K_me-\delta_{\text{off}}}{K_me-\delta_{\text{on}}}$, $t_{\text{on}}=T_m\ln\frac{M-K_me+\delta_{\text{on}}}{M-K_me+\delta_{\text{off}}}$ | Closed-form pulse timing; matched direct simulation to 5 figures |
| $h:0.20\to0.02$ | Impulse per pulse $0.0236\to0.0022\,\mathrm{N\,m\,s}$; duty cycle nearly unchanged |
| Dead-band | No firing at all while $K_me\le\delta_{\text{on}}$ — by design, not by approximation |

The module opened by asking whether an equilibrium is stable and closes by asking whether the actuator that is supposed to hold it there can physically deliver the torque a proof assumed. Every law derived along the way — the quaternion feedback and its sign fix, the sliding surface and its boundary layer, the backstepped and passivity-shaped attitude controllers, the tracking law built from them — produces exactly the kind of continuous command this lesson has spent its length turning into something a valve can fire.
