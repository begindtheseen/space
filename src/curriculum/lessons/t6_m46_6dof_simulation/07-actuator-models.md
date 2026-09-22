---
id: l07-actuator-models
title: Actuator models
minutes: 24
covers:
  - "Actuator models: thrust curves and start-up transients, TVC gimbal dynamics and rate limits, reaction wheel friction, thruster minimum impulse bit, valve delay"
---

The Actuators box turns a GNC command into the force and torque the plant actually feels, and every one of the five lessons before this one has already shown, once, what happens when that box is skipped or idealised: a saturated wheel that needs two minutes instead of two seconds, a phase margin quietly eaten by an unmodelled delay. This lesson works through the actuator error terms directly — gimbal dynamics and rate limits, thrust curves and their transients, reaction wheel friction, a thruster's minimum impulse bit, and valve delay — with the same standard this whole module holds to: real numbers, honestly computed, not asserted.

## TVC gimbal dynamics, and the rate limit nobody's linear analysis sees

A thrust-vector-control gimbal tracking a commanded deflection behaves, to good approximation, like a servo with its own bandwidth: fast compared with the vehicle's rigid-body attitude loop, but not infinitely fast, and — critically — not linear. Two limits matter. A **deflection limit** caps how far the gimbal can swing, a hard bound that is easy to include and easy to reason about. A **rate limit** caps how *fast* it can move, and it is far more dangerous, because a linear frequency-domain analysis — a Bode plot, a phase margin computed the way the control tier taught you — treats the actuator as a linear transfer function and never sees the rate limit at all. The margin such an analysis reports is real only for commands small enough, or slow enough, that the limit never engages; nothing in the analysis itself tells you where that boundary is.

The tool for pricing a rate limit is the describing function: replace the nonlinearity, driven by a sinusoidal command, with the linear gain and phase that best reproduce the nonlinearity's *fundamental* output harmonic. For a rate limiter tracking a command $A\sin(\omega t)$ with rate limit $R$, define $\rho = R/(A\omega)$ — the rate limit relative to the peak rate the command actually demands. When $\rho \ge 1$ the limit never engages and the tracker is exactly linear. When $\rho < 1$, the output can no longer follow the steep part of the sinusoid near its zero crossings; it ramps at the constant rate $R$ instead, catching back up to the command only near the peaks, and that distorted, flattened waveform's fundamental harmonic has both reduced gain and an added phase lag relative to the command.

::: example Pricing a rate limit the way you would price a delay
Simulate a rate-limited tracker driven by a unit-amplitude sinusoidal command, run it to a periodic steady state, and extract the fundamental harmonic's gain and phase numerically:

```python
import numpy as np

def rate_limited_tracker(rho, n_periods=40, n_per_period=20000):
    # x(t) = sin(t): a normalised sinusoidal command, amplitude 1, rate 1 at t=0.
    # rho = R / (A*omega): rate limit relative to the peak rate the command needs.
    dt = 2*np.pi / n_per_period
    y = 0.0
    ys = np.empty(n_periods * n_per_period)
    for i in range(len(ys)):
        t = i * dt
        rate = np.clip((np.sin(t) - y) / dt, -rho, rho)
        y = y + dt * rate
        ys[i] = y
    last = ys[-n_per_period:]
    t_last = np.arange(n_per_period) * dt
    c = (2.0 / n_per_period) * np.sum(last * np.exp(-1j * t_last))   # fundamental harmonic
    return np.abs(c), np.degrees(np.angle(c))

baseline = -90.0   # phase of an UNLIMITED tracker relative to this projection's reference
for rho in [1.0, 0.6, 0.4]:
    mag, phase = rate_limited_tracker(rho)
    print(f"rho={rho:.2f}  |N|={mag:.4f}  extra phase lag={phase - baseline:.2f} deg")
# rho=1.00  |N|=1.0000  extra phase lag=-0.00 deg
# rho=0.60  |N|=0.7626  extra phase lag=-23.26 deg
# rho=0.40  |N|=0.5093  extra phase lag=-51.07 deg
```

A gimbal rated at $R = 6^\circ/\mathrm{s}$ asked to produce a $3^\circ$ correction at $\omega = 5\,\mathrm{rad/s}$ — a plausible frequency for rejecting a fast disturbance — needs a peak rate of $3^\circ \times 5\,\mathrm{rad/s} = 15^\circ/\mathrm{s}$, giving $\rho = 6/15 = 0.4$. The gimbal delivers only $51\%$ of the commanded deflection amplitude at that frequency, and — the part a linear analysis has no way to report — an extra $51.07^\circ$ of phase lag on top of whatever the linear model already budgeted. A loop designed with $45^\circ$ of phase margin has none left the moment a command this size and this fast is actually asked of it, and the loop's own linear Bode plot, evaluated at any signal level, will keep insisting the margin is fine, because a Bode plot has no amplitude in it at all.
:::

This is exactly why rate-limit-induced oscillation is the disturbance "nobody predicted": it is invisible to every small-signal tool, appears only once a large enough or fast enough command is actually demanded, and a design can fly for years of nominal, gentle manoeuvres before an aggressive abort or a large disturbance finally asks the actuator to do something its rate limit cannot deliver.

## Thrust curves and start-up transients

A thruster does not switch instantly from zero thrust to full thrust. Solid motors have an ignition transient set by propellant grain geometry, burning to a shape-determined curve over the burn; liquid engines have a start-up transient set by valve opening, ignition sequencing and chamber pressure build-up, typically tens to a few hundred milliseconds before reaching rated thrust, and a comparable tail-off at shutdown as residual propellant burns down. A simulation that switches thrust on and off as a step function gets staging events and abort timing wrong by exactly the duration of that transient, and gets the *loads* wrong more severely still, because the transient's shape — not just its duration — determines the peak rate of change of thrust the structure and the control loop actually see. The right source for this curve is measured hot-fire data, not an assumed shape; where no data exists yet, a smooth transition (a raised-cosine or a first-order lag with a measured or bounded time constant) is a defensible placeholder, clearly labelled as one, rather than a silent step.

## Reaction wheel friction and the small-command dead zone

A reaction wheel's bearings resist motion with both a roughly rate-independent **Coulomb** component and a rate-proportional **viscous** component: $\tau_{\text{actual}} = \tau_{\text{cmd}} - \tau_{\text{coulomb}}\,\mathrm{sign}(\omega_{\text{wheel}}) - b_{\text{visc}}\,\omega_{\text{wheel}}$. The Coulomb term matters most for small commands: a wheel with $\tau_{\text{coulomb}} = 1.0\,\mathrm{mN\,m}$ commanded to produce $0.5\,\mathrm{mN\,m}$ — half the friction floor — delivers no net change in wheel speed at all until the command exceeds the floor, because static friction simply holds against anything smaller. A fine-pointing controller issuing a stream of small corrections below this threshold is not gently trimming the attitude; it is doing nothing, silently, every single tick, and the attitude error it thinks it is correcting persists unchanged until a large enough command — or an external disturbance — breaks the wheel loose.

::: example A thruster that cannot deliver the correction it is asked for
A small monopropellant thruster rated at $22\,\mathrm{N}$ has a minimum controllable valve-open time of $20\,\mathrm{ms}$ — shorter pulses are not reliably repeatable, so the minimum impulse bit is

$$
\text{MIB} = 22\,\mathrm{N} \times 0.020\,\mathrm{s} = 0.44\,\mathrm{N\,s} .
$$

```python
thrust, t_min = 22.0, 0.020          # N, s
MIB = thrust * t_min
L, I = 1.0, 800.0                     # m, kg m^2 -- moment arm and axis inertia
dw_min = MIB * L / I
print(MIB, dw_min, dw_min * 180 / 3.14159265)
# 0.44 0.00055 0.03151267876820377
```

Mounted at a $1\,\mathrm{m}$ moment arm on a vehicle axis with $I = 800\,\mathrm{kg\,m^2}$, the smallest possible correction this thruster can deliver in one pulse is $\Delta\omega_{\min} = 0.44/800 = 5.5\times10^{-4}\,\mathrm{rad/s} = 0.0315^\circ/\mathrm{s}$. Any commanded correction smaller than this either fires the full MIB anyway — overshooting the intended correction — or does not fire at all, and a control law that assumes continuously variable thrust will systematically either over- or under-correct by up to half an MIB on every pulse, a quantisation floor on attitude control precision with exactly the same character as the ADC quantisation on the sensor side, now sitting on the output instead of the input.
:::

## Valve delay

A valve does not open the instant it is commanded — solenoid response time, hydraulic line dynamics, or a digital-to-analogue conversion and driver stage all add a transport delay between command and actuator response, typically single-digit to a few tens of milliseconds. This delay adds directly to whatever sensor latency the previous lesson already priced: the two sit in series around the same loop, and the delay-margin analysis from that lesson — $\tau_{\text{crit}}$ for a simple loop, or the phase cost $-\omega\tau$ at crossover for a general one — applies to their *sum*, not to either one alone. A design that budgets its entire delay margin against sensor latency and treats actuator delay as negligible has, in effect, only checked half the loop's transport delay against the whole margin.

::: key What an actuator model has to carry
Gimbal bandwidth and damping, a deflection limit, and — separately, and more dangerously — a rate limit, whose cost is invisible to any linear, small-signal analysis and must be priced with a describing function or a direct large-signal simulation. Thrust start-up and shutdown transients, sized from test data rather than assumed as a step. Reaction wheel friction, dominant at small commands, which can silently zero out fine control action below its Coulomb floor. A thruster's minimum impulse bit, a quantisation floor on the output side of the loop. Valve or gimbal transport delay, which adds to sensor latency in the same loop's total delay budget.
:::

::: warning Checking a rate limit only against the design's nominal commands
A rate limit that never engages during nominal, gentle manoeuvres can still engage — and cost tens of degrees of phase — the first time the vehicle sees a large disturbance, an aggressive retargeting, or an abort. Checking a rate limit only against the commands a nominal trajectory produces confirms nothing about the commands an off-nominal one will, and the describing-function cost above shows exactly how much margin can be hiding behind that gap.
:::

::: warning Modelling minimum impulse bit as if thrust were continuously variable below it
Letting a thruster's simulated output be any commanded value, however small, silently deletes the MIB floor and makes fine-pointing precision look better in simulation than any real thruster can deliver. The flight software's own pulse-modulation logic — however it chooses when to fire a thruster that cannot produce less than one MIB — needs to be exercised against a model that actually enforces the floor, or that logic is untested.
:::

## Check yourself

::: check
Why does a rate limit escape detection by a standard linear frequency-domain stability analysis, while a deflection limit is comparatively easy to reason about?
:::

::: answer
A deflection limit is a fixed bound independent of how fast anything is moving, so its effect — the command simply cannot exceed it — is easy to state and check directly. A rate limit's effect depends on both the amplitude and the frequency of the command through it, and a linear transfer function has no amplitude dependence at all: the same Bode plot and phase margin apply regardless of signal size. The rate limit is invisible to that analysis specifically because the analysis has no concept of "how big" a signal is, only "what frequency."
:::

::: check
In the worked example, a $3^\circ$, $5\,\mathrm{rad/s}$ command against a $6^\circ/\mathrm{s}$ rate limit gave $\rho = 0.4$, an output amplitude of only $51\%$ of the command, and $51.07^\circ$ of extra phase lag. What happens to $\rho$, and therefore to the severity of the distortion, if the same gimbal is instead asked for a $1^\circ$ correction at the same frequency?
:::

::: answer
$\rho = R/(A\omega)$, and halving — here, thirding — the amplitude $A$ triples $\rho$: from $0.4$ to $1.2$. Since $\rho > 1$ means the rate limit never engages at all, the smaller command is tracked exactly, with no distortion and no extra phase lag. This is exactly why the effect is invisible during nominal, small-amplitude operation and appears only once a large enough command is demanded.
:::

::: check
A reaction wheel has a Coulomb friction floor of $1.0\,\mathrm{mN\,m}$. A fine-pointing controller issues a steady stream of $0.3\,\mathrm{mN\,m}$ corrections. What does the wheel actually do, and why is this worse than the controller simply being "a bit slow" to correct the error?
:::

::: answer
The wheel does nothing: $0.3\,\mathrm{mN\,m}$ is below the $1.0\,\mathrm{mN\,m}$ static friction floor, so no net torque is delivered and the wheel's speed does not change. This is not slowness — a slow but nonzero response still eventually corrects the error. Here the error simply persists, unchanged, for as long as the commanded correction stays below the floor, which a controller unaware of the dead zone has no way to detect from its own commanded value alone.
:::

::: check
Why does a thruster's minimum impulse bit constitute a "quantisation floor on the output side," structurally similar to a sensor's ADC quantisation, rather than just being a slightly less precise actuator?
:::

::: answer
ADC quantisation rounds a continuous true value to the nearest representable step on the input side of the loop; the MIB rounds a continuous desired impulse to either zero or a multiple of one discrete pulse on the output side. Both impose a fixed, non-shrinking granularity on a quantity the loop would otherwise treat as continuous, and both produce a bounded, deterministic error per instance rather than a random one — the defining character of quantisation, whichever side of the loop it sits on.
:::

::: check
A design budgets its entire delay margin against sensor latency and treats gimbal valve delay as negligible. What is wrong with this budgeting, given the delay-margin analysis from the previous lesson?
:::

::: answer
The delay-margin analysis treats the total transport delay around the loop, and sensor latency and actuator (valve) delay both sit in that same loop in series — their phase costs, $-\omega\tau$ each, add directly at any given frequency. Treating actuator delay as negligible without justifying that assumption means the true total delay is understated, and a design that appears to have adequate margin against sensor latency alone may have little or none left once the actuator's own delay is added in.
:::

::: check
A colleague argues that since the rate-limit describing function shows reduced gain as well as added phase, the "instability" risk is overstated — after all, a smaller output should mean a *less* aggressive, safer response. What is wrong with this argument?
:::

::: answer
Reduced gain does lower the loop's forward gain at that frequency, which on its own would tend to help stability margin — but the phase lag is the dangerous part, because a loop's stability boundary in the Nyquist sense depends on gain *and* phase together: a large phase lag can bring the loop close to the $-1$ point even at reduced gain, and the two effects are coupled, not independent knobs one of which can be trusted to cancel the other. The describing function's gain reduction changes where on the Nyquist plot the operating point sits; the phase lag changes how close that point is to instability, and a large enough phase lag can dominate regardless of the accompanying gain drop.
:::

## Summary

| Actuator error | Model | Consequence |
| --- | --- | --- |
| Gimbal bandwidth, damping | Second-order tracking of the commanded deflection | Sets the linear phase/gain budget the loop is designed against |
| Deflection limit | Hard bound on gimbal angle | Easy to check directly, no amplitude-dependence issue |
| Rate limit | Hard bound on gimbal rate; priced with a describing function, $\rho = R/(A\omega)$ | Invisible to linear analysis; measured $51.07^\circ$ extra phase lag at $\rho = 0.4$ |
| Thrust start-up/shutdown | Measured hot-fire transient, not a step | Loads and event timing both depend on its shape, not only its duration |
| Reaction wheel friction | Coulomb floor plus viscous term | Commands below the Coulomb floor deliver zero net torque |
| Minimum impulse bit | $\text{MIB} = F \times t_{\min}$ | Output-side quantisation; $5.5\times10^{-4}\,\mathrm{rad/s}$ floor in the worked example |
| Valve/gimbal delay | Transport delay, adds to sensor latency | Shares the same total delay-margin budget as the previous lesson's sensor case |

Sensors and actuators are the two boundaries of the loop; the next lesson turns to something that changes continuously underneath both of them — the vehicle's own mass properties, falling and shifting as propellant burns, which neither box has needed to account for until now.
