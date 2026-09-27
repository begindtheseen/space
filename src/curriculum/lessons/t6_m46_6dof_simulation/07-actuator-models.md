---
id: l07-actuator-models
title: Actuator models
minutes: 27
covers:
  - "Actuator models: thrust curves and start-up transients, TVC gimbal dynamics and rate limits, reaction wheel friction, thruster minimum impulse bit, valve delay"
---

Turn a shower handle. The handle only turns so far, and only so fast. The pipe takes a moment to bring the new water to you. Nudge the handle a tiny bit and often nothing happens, because the valve is sticky. Your brain copes without thinking. A flight computer has to cope on purpose.

A rocket has the same problem with every part that moves. Those parts are its **actuators** — the pieces that turn a command into a push or a twist: a swiveling engine, a spinning wheel, a small thruster, a valve. In the five-box simulation, the **Actuators box** sits between GNC and the Plant. It takes the command GNC sent and hands the Plant the force and torque it would really get.

Earlier lessons showed what a perfect Actuators box hides: a saturated wheel that needed two minutes for a two-second job, an unmodeled delay eating a loop's phase margin. This lesson takes the actuator errors one at a time — gimbal dynamics and rate limits, thrust transients, wheel friction, minimum impulse bit, valve delay — with every number computed.

## The gimbal is a servo with its own speed

Most launch vehicles steer by tilting the engine. This is **[[thrust-vector control|tvc]]** (TVC): the engine bell swings on a joint called a **gimbal**, and **actuator rams** push it to the angle the flight computer asks for.

The bell cannot jump to a new angle. It behaves like a **servo** — a machine that chases a commanded position — with its own speed and its own bounce. The standard model is second order:

$$
\ddot\delta = \omega_g^2\,(\delta_{\text{cmd}} - \delta) - 2\zeta_g\,\omega_g\,\dot\delta .
$$

Read $\delta$ as "delta", the actual gimbal angle; $\delta_{\text{cmd}}$ is the commanded angle, $\dot\delta$ ("delta dot") the swing rate and $\ddot\delta$ ("delta double-dot") its acceleration. The **gimbal bandwidth** $\omega_g$ ("omega sub g", rad/s) says how fast it follows; the **damping ratio** $\zeta_g$ ("zeta sub g") how much it overshoots. The first term pulls the bell toward the command, like a spring; the second resists motion, like a shock absorber. Even a fast servo lags the command a little at every frequency, and the loop pays for that lag in phase.

::: example What a good gimbal costs at crossover
A TVC gimbal has $\omega_g = 50\,\mathrm{rad/s}$ (about $7.96\,\mathrm{Hz}$) and $\zeta_g = 0.7$. The attitude loop crosses over at $\omega = 6\,\mathrm{rad/s}$. How much phase does the gimbal eat there?

For a second-order servo, the phase lag at frequency $\omega$ is

$$
\phi = \arctan\!\left(\frac{2\zeta_g\,\omega/\omega_g}{1 - (\omega/\omega_g)^2}\right) .
$$

Step 1: the frequency ratio is $\omega/\omega_g = 6/50 = 0.12$.

Step 2: the top is $2 \times 0.7 \times 0.12 = 0.168$. The bottom is $1 - 0.12^2 = 1 - 0.0144 = 0.9856$.

Step 3: $\phi = \arctan(0.168/0.9856) = \arctan(0.1705) = 9.67^\circ$.

The gain there is $1.0002$, so the magnitude plot shows almost nothing. As a delay, the lag is $0.1688\,\mathrm{rad} / 6\,\mathrm{rad/s} = 28\,\mathrm{ms}$.

Sanity check: the gimbal is eight times faster than crossover, so a small lag makes sense. But $10^\circ$ is almost a quarter of a $45^\circ$ phase margin.
:::

Three more limits sit on top of these dynamics.

- A **deflection limit** caps how far the bell can swing, say $\pm 6^\circ$: a fixed wall, easy to reason about.
- A **rate limit** caps how *fast* it can swing, say $6^\circ/\mathrm{s}$. It sounds equally harmless. It is not.
- **[[Backlash|backlash]]** is free play in the linkage: when the motion reverses, the ram moves but the bell does not until the slack is taken up.

## The rate limit a linear analysis cannot see

Try to copy a friend's waving hand. Slow waves, you keep up. Fast, wide waves, and your hand moves at its top speed, turning around late at each end. Your motion is smaller than hers, and it lags. That is a rate limit.

Here is the trouble. Bode plots and phase margins treat the actuator as **linear**: doubling the input doubles the output, and the lag never depends on signal size. A Bode plot has no amplitude axis. So its margin holds only for commands small or slow enough that the limit never engages, and nothing in it says where that boundary is.

### A rate limit in code, one step at a time

In a fixed-step simulation, a rate limit $R$ with step $\Delta t$ ("delta t") means the output may change by at most $R\,\Delta t$ per step, up or down. Each step:

1. Work out the change the command asks for: $\text{cmd} - \text{prev}$, where prev is the output from the step before.
2. Cut that change to the range $-R\,\Delta t$ to $+R\,\Delta t$. This is called **clipping**.
3. The new output is prev plus the clipped change.

Take $R = 6^\circ/\mathrm{s}$ and $\Delta t = 0.01\,\mathrm{s}$, so the most the gimbal can move in one step is $6 \times 0.01 = 0.06^\circ$. From rest at $0^\circ$, a command of $2^\circ$ gives $0.06^\circ$ after one step, $0.12^\circ$ after two, and reaches $2^\circ$ only after $2/0.06 \approx 33$ steps. A command of $0.04^\circ$ passes through untouched. A command of $-2^\circ$ is limited the same way downward: the limit is symmetric.

In code this is a tiny function, often written `rate_limit(cmd, prev, max_rate, dt)`, that returns the new output. The caller feeds each output back in as the next step's `prev`. With prev $= 0$, a limit of $5^\circ/\mathrm{s}$ and $\Delta t = 0.1\,\mathrm{s}$, the biggest move is $0.5^\circ$: a command of $10^\circ$ gives $0.5^\circ$, $-10^\circ$ gives $-0.5^\circ$, and $0.2^\circ$ passes untouched.

To price a rate limit, engineers use a **[[describing function|describing-function]]**. Drive the nonlinear part with a sine wave. Keep only the part of its output that repeats at the input's frequency — the **fundamental harmonic** — and ask what gain and phase lag a linear part would need to produce it. That gain and phase stand in for the nonlinearity, and they depend on amplitude.

For a rate limiter with limit $R$, driven by the command $A\sin(\omega t)$, the command's fastest rate is $A\omega$ (at its zero crossings). Define

$$
\rho = \frac{R}{A\omega} .
$$

Read $\rho$ as "rho". It is the rate limit compared with the peak rate the command demands.

- If $\rho \ge 1$, the limit never engages. The tracker follows exactly, and it is perfectly linear.
- If $\rho < 1$, the output cannot follow the steep middle of the sine. It ramps at the constant rate $R$ instead and only catches the command near the peaks. The flattened, [[triangle-shaped output|rate-limit-triangle]] has a fundamental that is both smaller and later than the command.

::: example Pricing a rate limit the way you would price a delay
Simulate a rate-limited tracker driven by a unit sine, let it settle into a steady repeating pattern, and pull out the fundamental harmonic's gain and phase numerically:

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

Each step moves the output toward the command, never faster than $\rho$. After 40 periods the start-up is long gone. The last line of the function multiplies the final period by $e^{-jt}$ and averages: that picks out the part of the output that repeats exactly once per period, the fundamental, as a single complex number whose size is the gain $|N|$ and whose angle is its phase. A plain $\sin t$ comes out of that recipe with an angle of $-90^\circ$, which is why the code measures the extra lag from a `baseline` of $-90^\circ$.

Now put in real numbers. A gimbal rated at $R = 6^\circ/\mathrm{s}$ is asked for a $3^\circ$ correction at $\omega = 5\,\mathrm{rad/s}$, a plausible frequency for fighting a fast disturbance.

Step 1: the command's peak rate is $A\omega = 3^\circ \times 5\,\mathrm{rad/s} = 15^\circ/\mathrm{s}$.

Step 2: $\rho = 6/15 = 0.4$.

Step 3: read the table. The gimbal delivers only $51\%$ of the commanded amplitude, and adds $51.07^\circ$ of phase lag on top of everything the linear model counted.

A loop designed with $45^\circ$ of phase margin has none left the moment a command this big and fast is asked of it — while its Bode plot keeps saying the margin is fine.
:::

::: note Why it has to be true
For small $\rho$ both numbers come out with a pencil. Use the code's units: command $\sin t$, rate limit $\rho$. The output is a pure triangle wave, ramping at $+\rho$ until it meets the falling command, then at $-\rho$. Each ramp lasts half a period, $\pi$, so the triangle climbs $\rho\pi$ from bottom to top. Its peak is $P = \rho\pi/2$.

A triangle wave of peak $P$ has a fundamental of amplitude $8P/\pi^2$ (a standard Fourier-series result). So the gain is

$$
|N| = \frac{8}{\pi^2}\cdot\frac{\rho\pi}{2} = \frac{4\rho}{\pi} .
$$

The triangle peaks where it meets the command on the command's way down: $\sin t_p = P$, so $t_p = \pi - \arcsin(\rho\pi/2)$. The command peaks at $\pi/2$. The lag is $t_p - \pi/2 = \pi/2 - \arcsin(\rho\pi/2)$.

For $\rho = 0.4$: $|N| = 1.6/\pi = 0.5093$, and the lag is $90^\circ - \arcsin(0.6283) = 90^\circ - 38.93^\circ = 51.07^\circ$. Both match the simulation exactly.

The pure triangle needs the command to fall away faster than $\rho$ after they meet, which works out to $\rho < 1/\sqrt{1 + \pi^2/4} = 0.537$. At $\rho = 0.6$ the formula's $0.764$ is close to, but not exactly, the simulated $0.7626$.
:::

::: key What an actuator model has to carry
Gimbal bandwidth and damping, deflection limit, RATE limit, backlash, transport delay, thrust start-up and shutdown transients, and minimum impulse bit on a thruster. Rate limit is the one that produces limit cycles nobody predicted.
:::

::: warning Checking a rate limit only against the design's nominal commands
This is why rate-limit oscillation is the disturbance "nobody predicted". Every small-signal tool is blind to it, so a design can fly for years of gentle maneuvers and then lose tens of degrees of phase at its first big gust, aggressive retarget or abort. Checking the limit against nominal commands says nothing about off-nominal ones, and the describing-function numbers show how much margin can hide in that gap.
:::

## Thrust curves and start-up transients

A hair dryer does not blow full force the instant you flip the switch, or stop dead when you turn it off. Nor does a rocket engine, and the shape of its ramp matters.

A **thrust curve** is thrust against time. The **start-up transient** is the ramp up to full thrust; the **tail-off** is the ramp down at shutdown. A **solid motor** has an ignition transient, then a curve set by the changing shape of its burning propellant grain. A **liquid engine**'s start-up is set by valve opening, ignition sequencing and chamber-pressure build-up, typically tens to a few hundred milliseconds, with a comparable tail-off as leftover propellant burns down.

A simulation that switches thrust as a **step** — zero, then instantly full — gets the *timing* of staging and aborts wrong by about the length of the transient. It gets the *loads* more wrong still, because the ramp's shape sets the peak rate of change of thrust the structure and control loop feel.

The right source for the curve is measured **[[hot-fire|hot-fire]]** data. Before that data exists, a smooth ramp is a defensible placeholder, as long as it is labeled as one. A raised-cosine ramp or a **first-order lag**, $F(t) = F_{\text{rated}}\left(1 - e^{-t/\tau}\right)$, both work. Here $\tau$ ("tau") is the **time constant**, measured or bounded from similar engines.

::: example The impulse a step pretends you have
A stage of mass $29{,}000\,\mathrm{kg}$ has an $800\,\mathrm{kN}$ engine that starts as a first-order lag with $\tau = 0.1\,\mathrm{s}$. How long until it reaches $90\%$ thrust, and how much impulse does the ramp lose compared with a step?

Step 1: $90\%$ thrust means $1 - e^{-t/\tau} = 0.9$, so $e^{-t/\tau} = 0.1$. Take logs: $t = \tau\ln 10 = 0.1 \times 2.303 = 0.230\,\mathrm{s}$.

Step 2: the impulse the ramp is missing is the gap between the step and the curve, added up over time:

$$
\int_0^\infty \left[F - F\left(1 - e^{-t/\tau}\right)\right] dt = F\int_0^\infty e^{-t/\tau}\,dt = F\tau .
$$

That is $800{,}000 \times 0.1 = 80{,}000\,\mathrm{N\,s}$, the same as a tenth of a second of full thrust.

Step 3: as a velocity, that is $80{,}000 / 29{,}000 = 2.76\,\mathrm{m/s}$.

Sanity check: the ramp behaves as though the engine lit a time $\tau$ late, so the step model puts the stage ahead by $\tau$ seconds of full thrust. A few meters per second at every engine start is exactly the kind of offset that shows up as an unexplained [[miss in a staging study|missing-impulse]].
:::

## Reaction wheel friction and the small-command dead zone

Push a heavy box. A gentle push does nothing; push harder and it breaks loose. Once it slides, the floor pulls back with a roughly steady force, however fast you go. That is **[[Coulomb friction|coulomb]]**: a friction force of constant size that always opposes the motion.

A reaction wheel's bearings have it too, plus **viscous friction** that grows with speed, like stirring honey. The torque that really changes the wheel's speed is

$$
\tau_{\text{actual}} = \tau_{\text{cmd}} - \tau_{\text{coulomb}}\,\mathrm{sign}(\omega_{\text{wheel}}) - b_{\text{visc}}\,\omega_{\text{wheel}} .
$$

Here $\tau$ ("tau") is a torque in N m, $\omega_{\text{wheel}}$ the wheel's spin rate, $\mathrm{sign}(\cdot)$ "plus one if positive, minus one if negative", and $b_{\text{visc}}$ the viscous coefficient. The spacecraft feels the reaction to $\tau_{\text{actual}}$, not to $\tau_{\text{cmd}}$. The Coulomb term bites small commands in two ways.

- **A wheel at rest, or crossing zero speed.** Take $\tau_{\text{coulomb}} = 1.0\,\mathrm{mN\,m}$ and command $0.5\,\mathrm{mN\,m}$, half the friction floor. Static friction holds the wheel. Its speed does not change, so the spacecraft gets no torque at all, until the command exceeds the floor. That band of ignored commands is a **dead zone**.
- **A spinning wheel with no friction compensation.** Say the wheel spins at $1000\,\mathrm{rpm}$ ($104.7\,\mathrm{rad/s}$) with $b_{\text{visc}} = 2\times10^{-6}\,\mathrm{N\,m\,s}$. The viscous drag is $0.21\,\mathrm{mN\,m}$. Command $+0.5\,\mathrm{mN\,m}$ and the wheel feels $0.5 - 1.0 - 0.21 = -0.71\,\mathrm{mN\,m}$. It slows down. The spacecraft gets a torque in the *opposite* direction to the one GNC asked for.

Flight software fights this with a **friction feedforward** — adding its own friction estimate to each command — and by keeping wheels away from zero speed. Neither is tested unless the simulated wheel has friction.

## Minimum impulse bit

A salt shaker has a smallest amount one shake delivers; you cannot add "a third of a shake". A thruster's valve cannot open for as short a time as you like either: below some **minimum on-time**, pulses stop being repeatable. The smallest reliable push is the **minimum impulse bit** (MIB), thrust times minimum on-time.

::: example A thruster that cannot deliver the correction it is asked for
A small **[[monopropellant|monopropellant]]** thruster rated at $22\,\mathrm{N}$ has a minimum on-time of $20\,\mathrm{ms}$, so the minimum impulse bit is

$$
\text{MIB} = 22\,\mathrm{N} \times 0.020\,\mathrm{s} = 0.44\,\mathrm{N\,s} .
$$

It is mounted at a $1\,\mathrm{m}$ moment arm on a vehicle axis with $I = 800\,\mathrm{kg\,m^2}$. What is the smallest change in spin rate one pulse can make?

```python
thrust, t_min = 22.0, 0.020          # N, s
MIB = thrust * t_min
L, I = 1.0, 800.0                     # m, kg m^2 -- moment arm and axis inertia
dw_min = MIB * L / I
print(MIB, dw_min, dw_min * 180 / 3.14159265)
# 0.44 0.00055 0.03151267876820377
```

Step 1: the angular impulse is MIB times the arm: $0.44 \times 1 = 0.44\,\mathrm{N\,m\,s}$.

Step 2: divide by inertia: $\Delta\omega_{\min} = 0.44/800 = 5.5\times10^{-4}\,\mathrm{rad/s}$.

Step 3: in degrees, $5.5\times10^{-4} \times 180/\pi = 0.0315^\circ/\mathrm{s}$.

A smaller correction either fires the full MIB anyway, overshooting, or does not fire at all, so a control law that assumes smooth thrust over- or under-corrects by up to half an MIB per pulse. That is a **quantization** floor — the same kind of error as the sensor's ADC quantization, now on the loop's output instead of its input. It is also why thruster-controlled spacecraft settle into a gentle back-and-forth [[limit cycle|limit-cycle]] instead of sitting perfectly still.
:::

::: warning Modeling minimum impulse bit as if thrust were continuously variable below it
If the simulated thruster delivers any impulse, however small, the MIB floor disappears and fine pointing looks better than any real thruster can manage. The flight software's pulse-modulation logic — which decides when to fire a thruster that cannot deliver less than one MIB — is untested unless the model enforces the floor.
:::

## Valve delay

Turn on the hot tap in an old house and you wait for hot water. That wait is a **transport delay**: the output is the input, shifted later in time. A valve has one too. The **[[solenoid|solenoid]]** takes time to pull in, fluid in the lines takes time to move, and the digital-to-analog converter and driver add their own — usually a few to a few tens of milliseconds in all.

In a fixed-step simulation, a delay of $\tau$ seconds is $n = \tau/\Delta t$ steps, modeled with a **delay line**: a queue of recent commands, like buckets passed down a line of people. Each step the newest command goes in at the back and the output comes from the front — the command from $n$ steps ago. In code it is often `transport_delay(buffer, sample, n_delay)`, which adds the sample to the buffer (a Python list works) and returns the delayed output with the updated buffer, for the caller to pass in again next step.

With $\Delta t = 5\,\mathrm{ms}$, a $15\,\mathrm{ms}$ valve delay is $n = 3$ steps. Feed in $10, 20, 30, 40, 50$ and the fifth output is $20$, the command from three steps earlier. Before the line fills there is no such command yet. The usual choice is to output the oldest one held, so the first output is $10$, and the five outputs in order are $10, 10, 10, 10, 20$. Whatever the start-up choice, write it down: it decides what the actuator does in the first milliseconds of every run. And if $\tau/\Delta t$ is not a whole number, the step or the delay must change, and the configuration should say which.

This delay sits in series with the sensor latency the previous lesson priced, around the same loop. So that lesson's delay-margin tools — $\tau_{\text{crit}}$ for a simple loop, or the phase cost $-\omega\tau$ at crossover for a general one — apply to their **sum**.

For example, with $20\,\mathrm{ms}$ of sensor latency and $15\,\mathrm{ms}$ of valve delay, at a $6\,\mathrm{rad/s}$ crossover:

- the sensor alone costs $6 \times 0.020 = 0.12\,\mathrm{rad} = 6.9^\circ$;
- both together cost $6 \times 0.035 = 0.21\,\mathrm{rad} = 12.0^\circ$.

A design that spends its whole delay margin on sensor latency has checked only half the loop's delay against it.

## Check yourself

::: check
Why does a rate limit escape a standard linear frequency-domain stability analysis, while a deflection limit is comparatively easy to reason about?
:::

::: answer
A deflection limit is a fixed bound that does not care how fast anything moves, so its effect is easy to state and check directly.

A rate limit's effect depends on both the amplitude and the frequency of the command, through $\rho = R/(A\omega)$. A linear transfer function has no amplitude dependence: the same Bode plot applies to any signal size. The analysis knows "what frequency" but not "how big", so it cannot see the rate limit.
:::

::: check
In the worked example, a $3^\circ$, $5\,\mathrm{rad/s}$ command against a $6^\circ/\mathrm{s}$ rate limit gave $\rho = 0.4$. What happens to $\rho$, and to the distortion, for a $1^\circ$ correction at the same frequency?
:::

::: answer
$\rho = R/(A\omega)$, so cutting the amplitude $A$ to a third multiplies $\rho$ by three: from $0.4$ to $1.2$. Check: the peak rate demanded is $1^\circ \times 5 = 5^\circ/\mathrm{s}$, below the $6^\circ/\mathrm{s}$ limit.

Since $\rho > 1$, the limit never engages: the small command is tracked exactly, with no extra lag. That is why the effect hides during gentle flying and appears only for large commands.
:::

::: check
A reaction wheel sitting at zero speed has a Coulomb friction floor of $1.0\,\mathrm{mN\,m}$. A fine-pointing controller sends a steady stream of $0.3\,\mathrm{mN\,m}$ corrections. What does the wheel do, and why is this worse than the controller being "a bit slow"?
:::

::: answer
The wheel does nothing. $0.3\,\mathrm{mN\,m}$ is below the $1.0\,\mathrm{mN\,m}$ static friction floor, so the wheel does not start turning and the spacecraft gets no torque.

This is not slowness. A slow response still fixes the error eventually. Here the error stays put, silently, every tick, for as long as the command stays under the floor — and a controller that does not know about the dead zone cannot tell from its own command that nothing is happening.
:::

::: check
Why is a thruster's minimum impulse bit a "quantization floor on the output side", like a sensor's ADC quantization, rather than a slightly less precise actuator?
:::

::: answer
ADC quantization rounds a smooth true value to the nearest step on the input side of the loop. The MIB rounds a smooth desired impulse to zero or a whole number of pulses on the output side.

Both put a fixed step size on a quantity the loop treats as smooth, and both give an error per instance that is bounded and set by the rounding, not random. That is what makes something quantization, on either side of the loop.
:::

::: check
A design budgets its whole delay margin against sensor latency and treats gimbal valve delay as negligible. What is wrong with this, given the delay-margin analysis of the previous lesson?
:::

::: answer
The delay margin applies to the total transport delay around the loop. Sensor latency and valve delay sit in the same loop, in series, so their phase costs, $-\omega\tau$ each, add at every frequency.

Calling actuator delay negligible without showing it understates the total. Enough margin against sensor latency alone may be none once the actuator's delay is added.
:::

::: check
A colleague says the rate limit's describing function shows reduced gain as well as added phase, so a smaller output should mean a gentler, safer response. What is wrong with this?
:::

::: answer
Lower gain alone does tend to help stability at that frequency. But stability depends on gain *and* phase together — in the Nyquist picture, on how close the loop's curve comes to the $-1$ point. A large phase lag can swing the loop toward $-1$ even at reduced gain. The two effects arrive together, neither can be trusted to cancel the other, and a big enough lag wins regardless of the gain drop.
:::

## Summary

| Actuator error | Model | Consequence |
| --- | --- | --- |
| Gimbal bandwidth, damping | $\ddot\delta = \omega_g^2(\delta_{\text{cmd}} - \delta) - 2\zeta_g\omega_g\dot\delta$ | Linear lag at crossover; $9.67^\circ$ at $6\,\mathrm{rad/s}$ for $\omega_g = 50\,\mathrm{rad/s}$, $\zeta_g = 0.7$ |
| Deflection limit | Hard bound on gimbal angle | Easy to check directly; no amplitude dependence |
| Rate limit | Hard bound on gimbal rate; describing function with $\rho = R/(A\omega)$ | Invisible to linear analysis; $51.07^\circ$ extra lag and $51\%$ gain at $\rho = 0.4$ |
| Backlash | Free play in the linkage | Nothing happens on reversal until the slack is taken up |
| Thrust start-up and shutdown | Measured hot-fire transient, not a step | First-order lag loses $F\tau$ of impulse; $2.76\,\mathrm{m/s}$ in the example |
| Reaction wheel friction | Coulomb floor plus viscous term | Commands under the floor give no torque at rest, or the wrong-sign torque when spinning uncompensated |
| Minimum impulse bit | $\text{MIB} = F \times t_{\min}$ | Output-side quantization; $5.5\times10^{-4}\,\mathrm{rad/s}$ floor in the example |
| Valve or gimbal delay | Transport delay, phase $-\omega\tau$ | Adds to sensor latency in the same delay budget |

Sensors and actuators are the two edges of the loop. The next lesson turns to something changing underneath both of them: the vehicle's own mass, center of mass and inertia, falling and shifting as the propellant burns.

::: context tvc Steering by tilting the engine
A rocket in space has no air to push fins against, and even in the lower atmosphere fins do little at liftoff, when the rocket is slow. So most rockets steer by swinging the engine. Tilt the bell by a small angle $\delta$ and the thrust gains a sideways part $F\sin\delta \approx F\delta$. Because the engine sits far below the center of mass, that sideways push twists the whole vehicle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="10" width="60" height="86" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="100" x2="180" y2="192" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="180" y1="100" x2="156.71" y2="186.93" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <polygon points="172,100 188,100 205,160 155,160" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2" transform="rotate(15 180 100)"/>
  <circle cx="180" cy="100" r="4" fill="#1f2a44"/>
  <path d="M180,145 A45,45 0 0,1 168.35,143.47" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="163" y="186" font-size="12" fill="#1f2a44">δ</text>
  <line x1="218" y1="104" x2="262" y2="104" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="262,99 272,104 262,109" fill="#b4232c"/>
  <text x="222" y="124" font-size="12" fill="#b4232c">side push F sin δ</text>
  <text x="222" y="92" font-size="12" fill="#1f2a44">gimbal pivot</text>
  <text x="84" y="56" font-size="12" fill="#1f2a44">vehicle</text>
</svg>
```

The pivot is the gimbal; the dashed lines are the vehicle axis and the tilted engine axis.
:::

::: context backlash Slack in the linkage
Pull a toy train with a loose string. When you reverse direction, the string goes slack and the train does not move until you have taken up the slack the other way. Gears and linkages have the same free play, called **backlash**. In a control loop it acts like a small dead zone that appears every time the motion reverses. The loop keeps pushing, nothing happens, then the slack closes all at once and the output jumps. That stop-then-jump pattern can drive a small, steady oscillation. Designers shrink it with preloaded gears and stiff linkages, and the simulation should include whatever is left.
:::

::: context describing-function A linear stand-in for something that is not
A describing function asks a narrow question: if I push a sine wave in, what single sine wave best matches what comes out? The answer is a gain and a phase, like a linear block, except that both change with the input's amplitude. Control engineers developed the method in the 1940s and 1950s to analyze relays and other on-off devices. It is an approximation: it ignores the higher harmonics, trusting the rest of the loop to filter them out. It is best at spotting **limit cycles** — steady oscillations of a fixed size — which you will meet again in the nonlinear-control material.
:::

::: context rate-limit-triangle What a rate limit does to a sine
The blue curve is the command, $\sin t$. The red curve is the output of a rate limiter with $\rho = 0.4$, one full period after it has settled. The output can only climb or fall at slope $0.4$, so it becomes a triangle. It peaks at $0.4\pi/2 = 0.628$, not $1$, and it turns around late, only when it meets the falling command.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="325" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="25" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,80.0 45.8,73.5 51.7,67.1 57.5,60.9 63.3,55.0 69.2,49.6 75.0,44.7 80.8,40.3 86.7,36.7 92.5,33.8 98.3,31.7 104.2,30.4 110.0,30.0 115.8,30.4 121.7,31.7 127.5,33.8 133.3,36.7 139.1,40.3 145.0,44.6 150.8,49.6 156.6,55.0 162.5,60.9 168.3,67.0 174.1,73.5 180.0,80.0 185.8,86.5 191.6,92.9 197.5,99.1 203.3,105.0 209.1,110.4 215.0,115.3 220.8,119.7 226.6,123.3 232.5,126.2 238.3,128.3 244.1,129.6 250.0,130.0 255.8,129.6 261.6,128.3 267.5,126.2 273.3,123.3 279.1,119.7 285.0,115.4 290.8,110.5 296.6,105.0 302.5,99.1 308.3,93.0 314.1,86.5 320.0,80.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,97.8 57.5,90.0 75.0,82.1 92.5,74.3 110.0,66.4 127.5,58.6 145.0,50.7 149.7,48.6 162.5,54.3 180.0,62.2 197.5,70.0 215.0,77.9 232.5,85.7 250.0,93.6 267.5,101.4 285.0,109.3 289.7,111.4 302.5,105.7 320.0,97.8"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="84" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="134" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="200" y="36" font-size="12" fill="#1d6fd1">command</text>
  <text x="164" y="44" font-size="12" fill="#b4232c">output</text>
  <text x="300" y="152" font-size="11" fill="#1f2a44">one period</text>
</svg>
```

The fundamental of that triangle is $51\%$ of the command and $51^\circ$ late.
:::

::: context hot-fire Firing the engine on the ground
A **hot-fire test** runs a real engine while it is bolted to a test stand, with load cells measuring its thrust hundreds or thousands of times a second. Engine makers fire every new design many times, and often fire each flight engine before it ships. The measured start-up and shutdown curves from those tests are what a good simulation's thrust model is built from. Until they exist, any curve in the simulation is a guess, and the configuration should say so.
:::

::: context missing-impulse The impulse a step pretends to deliver
The blue step is what a naive simulation delivers: full thrust at $t = 0$. The red curve is a first-order lag with $\tau = 0.1\,\mathrm{s}$. The orange area between them is impulse the step invents. Its size is exactly $F\tau$, as if the real engine had lit $\tau$ late. The dashed line marks $90\%$ thrust, reached at $0.23\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="40,150 40,40 320,40 320,40.7 308.8,40.9 297.6,41.1 286.4,41.4 275.2,41.6 264.0,42.0 252.8,42.5 241.6,43.0 230.4,43.7 219.2,44.5 208.0,45.5 196.8,46.7 185.6,48.2 174.4,50.0 163.2,52.2 152.0,54.9 140.8,58.2 129.6,62.2 118.4,67.1 107.2,73.1 96.0,80.5 84.8,89.4 73.6,100.4 62.4,113.7 51.2,130.1" fill="#f2b880"/>
  <line x1="40" y1="150" x2="325" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,150 40,40 320,40"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,150.0 51.2,130.1 62.4,113.7 73.6,100.4 84.8,89.4 96.0,80.5 107.2,73.1 118.4,67.1 129.6,62.2 140.8,58.2 152.0,54.9 163.2,52.2 174.4,50.0 185.6,48.2 196.8,46.7 208.0,45.5 219.2,44.5 230.4,43.7 241.6,43.0 252.8,42.5 264.0,42.0 275.2,41.6 286.4,41.4 297.6,41.1 308.8,40.9 320.0,40.7"/>
  <line x1="169" y1="51" x2="169" y2="150" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">F</text>
  <text x="40" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="169" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0.23 s</text>
  <text x="320" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0.5 s</text>
  <text x="200" y="100" font-size="12" fill="#b4232c">real start-up</text>
  <text x="200" y="30" font-size="12" fill="#1d6fd1">step model</text>
</svg>
```
:::

::: context coulomb The man behind the friction law
Charles-Augustin de Coulomb was a French military engineer. In 1781 he won a prize from the Paris Academy of Sciences for a study of friction in machines. He showed that sliding friction is roughly proportional to the load pressing the surfaces together and roughly independent of the sliding speed. That is why "Coulomb friction" means a constant-size force opposing motion. The same Coulomb later measured the force between electric charges, which is why the unit of charge carries his name.
:::

::: context monopropellant One liquid, no igniter
A **monopropellant** thruster burns a single liquid instead of a fuel and an oxidizer. The usual one is hydrazine. It flows over a hot catalyst bed, which breaks it down into hot gas that rushes out of the nozzle. There is no ignition system and only one valve, which makes these thrusters simple and reliable. Satellites and upper stages use them by the dozen for small attitude and orbit corrections, in sizes from about $1$ to a few hundred newtons.
:::

::: context limit-cycle Never quite still
A thruster-controlled spacecraft cannot hold perfectly still. When the pointing error drifts past a set **deadband**, a thruster fires one or more minimum impulse bits. That pushes the craft back across the deadband, drifting slowly the other way, until the opposite thruster fires. The result is a slow, steady back-and-forth called a **limit cycle**. Its size and period are set by the MIB, the deadband and the inertia, and its propellant cost is often a big part of a mission's attitude-control budget. Only a simulation that enforces the MIB can predict it.
:::

::: context solenoid How a valve is opened
A **solenoid** is a coil of wire. When current flows, it becomes a magnet and pulls a small iron plunger, which lifts the valve off its seat. The current takes time to build up in the coil, and the plunger takes time to move, so there are a few milliseconds between "open" and open. Closing has its own delay as the magnetic field dies away. Real valves are characterized on a bench, and those measured opening and closing times go straight into the actuator model.
:::
