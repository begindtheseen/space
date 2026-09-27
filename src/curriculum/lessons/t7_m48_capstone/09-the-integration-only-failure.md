---
id: l09-the-integration-only-failure
title: The failure that only appears integrated
minutes: 20
covers:
  - A multiplicative extended Kalman filter on IMU, GNSS and radar altimeter, with error-state formulation and attitude error as a three-parameter local perturbation
  - 'TVC attitude control with bending-mode and slosh notch or roll-off filtering, and gain scheduling against dynamic pressure and mass'
---

Push a child on a swing. Push at a random moment each time and the swing barely moves. Push once, hard, and it swings a little and settles. But push gently, at exactly the swing's own rhythm, and it climbs higher and higher. The size of your push never changed. What changed was its *timing*, and whether that timing matched something the swing likes to do on its own.

This lesson is about that effect inside a rocket. The navigation-meets-guidance lesson showed a correlated navigation error costing touchdown accuracy once guidance used it. That failure had a clear address: it showed up in miss distance, guidance's own output. This lesson builds a harder case, on purpose, because it is what the whole module has been building toward. Two components — navigation and control — each pass their own test exactly as specified. Yet the closed loop performs measurably worse than either test predicted. Neither test is wrong. The failure lives in neither test's field of view, and it only appears once the two components run together.

## The two components, as built

Before the failure, recall what each piece is. Both were built earlier in this module and in their prerequisite modules.

**Navigation** is a **[[multiplicative extended Kalman filter|mekf]]** (MEKF) on the IMU, GNSS and radar altimeter. Instead of estimating the attitude quaternion directly, it keeps a *reference* quaternion and estimates a small three-number attitude error on top of it.

::: key Why the attitude filter is multiplicative
A unit quaternion carries three degrees of freedom in four components, so a direct covariance is singular and additive updates break the norm. Estimate a three-parameter error applied multiplicatively to a reference quaternion, then fold it in and reset.
:::

**Control** is thrust-vector control (TVC): the engine swivels to steer. Its gains are scheduled as the vehicle changes, and filters keep it from shaking the structure.

::: key What a launch-vehicle TVC controller is scheduled on
Dynamic pressure and mass, primarily — they set aerodynamic stability and control effectiveness. The schedule is verified by frozen-time margin plots across the dispersed envelope, not at the nominal point.
:::

::: key Flex and slosh in the control loop
Bending modes are handled by notch or roll-off filtering with attention to the sensor location relative to the mode shape (a node on the wrong side inverts the sign). Slosh is handled by bandwidth separation and by not exciting it, because notching a mode whose frequency migrates with fill level is fragile.
:::

## Two tests, both passing

Take the same kind of correlated navigation error the earlier lesson built: an attitude-estimate error with a fixed one-sigma size of $0.08^\circ$, and a **[[correlation time|correlation-time]]** $\tau$ (read "tau") that changes from run to run. The correlation time says how long the error "remembers" its own value. A short $\tau$ means it jitters quickly. A long $\tau$ means it wanders slowly, almost like a fixed offset.

Now run two checks against it, separately, the way a real verification program would.

**Navigation's own test** checks the filter's reported accuracy against its specification: is the one-sigma attitude uncertainty at or below the required figure? It is. And it is *exactly* $0.08^\circ$ for every $\tau$. The reason is the same one the earlier lesson found for position: the covariance a filter reports comes from the noise model it was built with, and that model has no parameter for correlation time. It cannot see $\tau$ at all.

**Control's own test** checks the loop's classical margins — gain, phase and delay margin — against requirement, with the frozen-time method from the control-meets-vehicle lesson. Those margins belong to the open-loop transfer function $L(s)=C(s)G(s)$ alone: controller $C$ times vehicle $G$. You compute them by breaking the loop and sweeping frequency with the reference held at zero. No particular disturbance appears anywhere in that calculation. So the same $54.79^\circ$ phase margin holds no matter what is actually driving the loop.

::: key Why both tests are blind to what is about to go wrong
A specification test on a component checks it against a fixed threshold, using only quantities that component itself produces or is defined against. Navigation's check has no notion of "control's sensitivity peak." Control's margin calculation has no notion of "the correlation time of a particular disturbance." The failure in this lesson lives exactly in that gap. It is invisible to both tests by construction, not by oversight.
:::

## What the closed loop actually does

How does an attitude-estimate error reach the vehicle? The controller cannot tell a wrong estimate from a real attitude error. If navigation says "you are tilted $0.08^\circ$ left" when you are not, the controller tilts the vehicle $0.08^\circ$ right to "fix" it. So an estimate error enters the loop as a **[[measurement disturbance|measurement-disturbance]]**.

How much of it reaches the real attitude depends on frequency. That is described by the loop's **[[complementary sensitivity|complementary-sensitivity]]**:

$$
T(s)=\frac{L(s)}{1+L(s)}.
$$

It is the same transfer function that describes how well the loop follows a command. Here it describes how much of a measurement disturbance gets through to the output. Read $\lvert T(j\omega)\rvert$ as "the size of T at frequency omega." Where $\lvert T\rvert = 1$ the disturbance passes straight through. Where it is below $1$ the loop filters it out. Where it is above $1$, the loop makes it *bigger* — that is the swing being pushed at its own rhythm.

::: example Where the loop actually amplifies, computed directly
**Sweep.** Compute $\lvert T(j\omega)\rvert$ across frequency for the reference vehicle's gain-scheduled, notch-filtered attitude loop.

**Low frequency.** At very low frequency, $\lvert T\rvert \to 1$. A slow error is followed almost exactly.

**The peak.** $\lvert T\rvert$ rises to about $1.35$, which is $20\log_{10}(1.35) \approx +2.6\,\mathrm{dB}$, near $\omega\approx2.69\,\mathrm{rad/s}$. Divide by $2\pi$ to get hertz: $2.69/(2\pi) \approx 0.43\,\mathrm{Hz}$.

**Where the peak sits.** That is *below* the loop's $4.59\,\mathrm{rad/s}$ ($0.73\,\mathrm{Hz}$) crossover, not on top of it. It is a real, checkable feature of this particular loop's shape, not an assumption.

**What it means.** A disturbance with a lot of energy near $0.43\,\mathrm{Hz}$ is not merely passed through. It is *amplified*, by about $35\%$, because that is where $1+L(j\omega)$ comes closest to zero.

**High frequency.** Well above crossover, $\lvert T\rvert$ falls far below $1$. Fast jitter is filtered out.
:::

Now describe the navigation error by where its energy sits in frequency. Model it as an **[[Ornstein–Uhlenbeck process|ou-process]]** — the standard model of a random error that drifts but is pulled back toward zero — with a fixed one-sigma size $\sigma$ and a chosen $\tau$. Its **[[power spectral density|psd]]** (PSD), which says how much of the error's energy sits at each frequency, is

$$
S(\omega)=\frac{2\sigma^2\tau}{1+\omega^2\tau^2}.
$$

It is flat at low frequency and falls off above a **corner frequency** of $1/\tau$ radians per second, which is $1/(2\pi\tau)$ hertz. Three cases follow:

- **Short $\tau$.** The corner is high. Most of the energy sits well above the loop's peak, where $\lvert T\rvert$ has rolled off, so the loop filters most of it out.
- **Very long $\tau$.** The energy piles up near zero frequency, where $\lvert T\rvert\to1$. The loop follows it almost exactly, like a fixed bias. The output error ends up about the same size as the input error.
- **In between.** Some $\tau$ puts a lot of energy in the band around and below the peak. That is the dangerous case.

The output jitter comes from multiplying the two curves and adding up over frequency:

$$
\sigma_{\text{out}}^2=\frac{1}{2\pi}\int_{-\infty}^{\infty}\lvert T(j\omega)\rvert^2\,S(\omega)\,d\omega .
$$

In words: at each frequency, the loop scales the error's energy by $\lvert T\rvert^2$; add those pieces up and take the square root to get the RMS jitter.

::: example Closed-loop attitude jitter, swept across correlation time
Evaluate that integral for eight correlation times, all with the same $\sigma = 0.08^\circ$ input:

| Correlation time $\tau$ | RMS attitude jitter |
| --- | --- |
| $0.05\,\mathrm s$ (near-white) | $0.045^\circ$ |
| $0.3\,\mathrm s$ | $0.080^\circ$ |
| $0.6\,\mathrm s$ | $0.085^\circ$ |
| $1.0\,\mathrm s$ | $0.085^\circ$ |
| $2.0\,\mathrm s$ | $0.084^\circ$ |
| $4.0\,\mathrm s$ | $0.082^\circ$ |
| $8.0\,\mathrm s$ | $0.081^\circ$ |
| $16.0\,\mathrm s$ (near-constant bias) | $0.081^\circ$ |

**Read the table.** Every row has the identical $0.08^\circ$ input that passes navigation's check identically. Every row runs through the identical loop with the identical $54.79^\circ$ phase margin. Yet the output varies by **[[nearly a factor of two|factor-two]]**: $0.085 / 0.045 \approx 1.9$.

**The shape.** Smallest at the fast end, where the loop filters. Largest, about $0.085^\circ$, near $\tau\approx1\,\mathrm s$ (the true peak of the sweep is at $\tau \approx 0.9\,\mathrm s$). Then it eases back down toward $0.08^\circ$ as $\tau$ grows, because a very slow error behaves like a bias that the loop follows one-for-one.

**Sanity check.** For $\tau\to\infty$ the whole error sits at zero frequency where $\lvert T\rvert = 1$, so the output must equal the input, $0.080^\circ$. The long-$\tau$ rows approach exactly that — and never drop below it, because this loop's $\lvert T\rvert$ is never below $1$ at low frequency.

**How it was checked.** The integral was evaluated numerically and confirmed two ways: on a four-times finer frequency grid, and over a wider frequency range reaching down toward zero. Both checks matter; see the last Check-yourself question.

Neither the navigation test nor the control test, each passing without qualification in every row, has any way to report this difference, because neither computes it.
:::

::: warning Refining the grid does not check the range
Suppose the integral is started at $0.01\,\mathrm{rad/s}$ instead of near zero. A four-times finer grid then agrees with it to six decimal places — and it is still wrong for long $\tau$, reading $0.081^\circ$, $0.079^\circ$ and $0.077^\circ$ for the $4$, $8$ and $16\,\mathrm s$ rows. A long-$\tau$ error keeps much of its energy below $0.01\,\mathrm{rad/s}$, and a finer grid over the same range never sees it. The giveaway is the physics: an output *below* the $0.08^\circ$ input is impossible when $\lvert T\rvert\ge1$ at low frequency. Always check a numerical integral against both a finer step *and* a wider range, and against a limit you know in closed form.
:::

## The diagnosis: overlay the two spectra, not either test alone

To find this failure before a flight anomaly does, you need a different calculation from either component's own verification. Plot the disturbance's PSD and the loop's $\lvert T(j\omega)\rvert$ on the *same* frequency axis, and look for where they **[[overlap|overlay]]**.

That overlay is not a by-product of either test. Navigation's verification never computes a control transfer function. Control's margin sweep never looks at a particular sensor error's correlation time. The calculation exists only once someone deliberately asks the integration question — which is a different question from "does each piece meet its own spec?"

::: key The diagnosis, stated as a procedure
Compute the disturbance's power spectral density from its own characterized correlation time. Compute the closed loop's complementary sensitivity $\lvert T(j\omega)\rvert$ from the control design alone. Overlay them on one frequency axis. A disturbance whose energy sits near the loop's own sensitivity peak costs more than the same disturbance's total power would suggest from either curve read separately — and no threshold check on either curve in isolation reveals that the overlap is the actual problem.
:::

Failures like this are also why the stack is assembled one piece at a time. If navigation and control are joined in the same step as guidance and fault management, a jitter increase could come from anywhere. Joined one at a time, it can only come from the piece just added.

::: key GNC integration order
Controller with perfect state feedback, then real navigation, then real guidance, then fault management — one subsystem at a time, so every new failure is attributable to the element just added. FDIR goes last because it masks problems during debugging.
:::

Here the controller first flies on perfect state feedback: no estimate error, no jitter from navigation. Swapping in the real filter is the single change that adds the jitter, which points straight at the navigation–control join.

::: warning A margin passing at every frozen point does not bound every possible disturbance
It is tempting to read a healthy phase margin as a blanket guarantee against anything the loop might see. A margin says how far the loop is from *instability*. It says nothing about how much a *particular*, bounded, stable disturbance gets amplified on the way through. A loop can be robustly stable and still amplify a well-timed disturbance by a real factor, because "stable" and "does not amplify some inputs" are different properties of the same transfer function.
:::

::: warning An error budget built from the wrong end of this table understates its own risk
Suppose the control part of the error budget assumed navigation error was white noise — the $0.045^\circ$ end of this table, the easiest case — while the real navigation error sits near the $0.085^\circ$ peak. Then the budget understates the real jitter by nearly a factor of two, quietly spending margin nobody budgeted for. The error-budgeting lesson early in this module allocated one-sigma numbers assuming **[[independence|independence]]**. This lesson is a concrete way that assumption — and an unstated choice of *which* noise description was used — can each quietly cost real margin.
:::

## Check yourself

::: check
Without using any specific number from this lesson, explain why a navigation accuracy test and a control margin test can each pass without qualification while the closed loop's real performance still varies by a factor of two.
:::

::: answer
Each test is scoped to one component and uses only quantities that component defines. Navigation's test checks reported accuracy against a threshold. Control's test checks classical margins of the open-loop transfer function with the reference held at zero. Neither test's inputs include the *other* component's character. Navigation's test has no model of the control loop's sensitivity peak; control's test has no model of a particular disturbance's spectral shape. A quantity that depends on both together — here, the closed-loop jitter — cannot be computed by either test alone, so neither can bound it.
:::

::: check
The complementary sensitivity peaks at $0.43\,\mathrm{Hz}$, below the loop's $0.73\,\mathrm{Hz}$ ($4.59\,\mathrm{rad/s}$) crossover rather than at it. Why is checking behavior only *at* crossover not enough to catch this failure?
:::

::: answer
Gain and phase margin are each defined at one frequency tied to the open loop — where its gain is exactly one, or where its phase reaches $-180^\circ$. Neither reports where the *closed loop* amplifies disturbances most, and for this loop's shape that is a different frequency from crossover. A check that only ever samples the loop at crossover would never notice that the peak this failure depends on sits somewhere else on the same frequency axis.
:::

::: check
The near-white case ($\tau=0.05\,\mathrm s$) gives the *smallest* jitter, not the largest, even though you might expect "more random" noise to be worse. Explain why the near-white case is the most benign.
:::

::: answer
A near-white process spreads its energy over a very wide range of frequencies. Its corner is at $1/0.05 = 20\,\mathrm{rad/s}$, so most of its energy sits well above the $2.69\,\mathrm{rad/s}$ peak, where $\lvert T(j\omega)\rvert$ has rolled off and the loop shrinks the disturbance instead of amplifying it. Only the small share of its energy near the peak gets boosted. So, on average, it passes through the loop more filtered than a process whose energy is concentrated closer to where the loop amplifies.
:::

::: check
A colleague proposes fixing this by tightening the navigation accuracy requirement alone, so even the worst row falls under some fixed limit. Evaluate this fix against what the diagnosis found.
:::

::: answer
Tightening navigation's requirement shrinks the error's *size* equally at every correlation time, so every row of the table shrinks in proportion. But it leaves the *mechanism* untouched: the overlap between the error's spectrum and the loop's sensitivity peak still sits at the same $\tau\approx1\,\mathrm s$, and still amplifies whatever error remains by the same relative factor. A **[[control-side fix|waterbed]]** — reshaping the loop so its peak sits away from the correlation times the real navigation error shows — addresses the mechanism directly. Tightening navigation alone is a more expensive way to buy the same margin, without ever finding out why that particular $\tau$ was the dangerous one.
:::

::: check
The model behind the jitter table — an OU process through a linear filter — has a closed mathematical form. Why is it still necessary to check the numerical integral, and why was a finer grid alone not a good enough check?
:::

::: answer
The table's claims rest on specific *computed* numbers, and any numerical integral can depend on how it was evaluated: the step size, and the range of frequencies it covers. A finer grid tests the step size — whether a sharp feature like the sensitivity peak is resolved. It cannot test the range. If the integral stops at $0.01\,\mathrm{rad/s}$, a four-times finer grid agrees to six decimals, yet the long-$\tau$ rows come out too low, because those errors keep much of their energy below $0.01\,\mathrm{rad/s}$. The closed form supplies the missing check: as $\tau\to\infty$ the output must approach the input, $0.08^\circ$, and the truncated result falls below that. So the right habit is to vary the step, widen the range, and compare against a known limit before quoting a number.
:::

## Summary

| Item | Statement |
| --- | --- |
| Navigation's own test | Reported one-sigma accuracy, $0.08^\circ$ — identical for every correlation time tested |
| Control's own test | Classical margins of $L(s)$ alone — PM $54.79^\circ$, identical whatever the disturbance |
| Complementary sensitivity | $T=L/(1+L)$: how much of a measurement disturbance reaches the output |
| Loop's sensitivity peak | $\lvert T(j\omega)\rvert\approx1.35$ near $0.43\,\mathrm{Hz}$ ($2.69\,\mathrm{rad/s}$), below the $0.73\,\mathrm{Hz}$ crossover |
| OU error spectrum | $S(\omega)=2\sigma^2\tau/(1+\omega^2\tau^2)$, corner at $1/\tau$ rad/s |
| Closed-loop jitter | $0.045^\circ$ ($\tau=0.05\,\mathrm s$) up to $0.085^\circ$ ($\tau\approx1\,\mathrm s$), easing to $0.081^\circ$ at $16\,\mathrm s$ — a factor of $1.9$ from one input size |
| The diagnosis | Overlay the disturbance PSD and $\lvert T(j\omega)\rvert$ on one frequency axis — a calculation neither component's own test performs |
| Why component tests miss it | Each uses only quantities its own component defines; the overlap is a joint property neither computes |
| Numerical check | Finer step *and* wider range *and* a known limit; a finer grid alone missed a truncated range |

This is the failure the module was built to make visible: two passing tests, a real closed-loop cost, and a diagnosis that exists only once the two components run together. The next two lessons turn from finding failures to proving the whole system: how the algorithms reach flight as one shared implementation, and then the dispersed campaign and written report that turn every claim in this module into evidence someone else can audit.

::: context mekf Why "multiplicative"
Rotations do not add like ordinary numbers; they *compose* — do one, then the other. In quaternion arithmetic, composing is multiplying. So the filter writes the attitude as "big reference rotation, multiplied by a small error rotation." The small error needs only three numbers, which keeps its covariance a healthy $3\times3$ block. After each update the error is folded into the reference and reset to zero, so the filter is always working near zero error, where its straight-line approximations are best.
:::

::: context correlation-time How long an error remembers
Think of the temperature outside. If it is warm now, it will probably still be warm in ten minutes — it is correlated over a few hours. The roll of a die has no memory at all; one roll says nothing about the next. The **correlation time** $\tau$ measures that memory. For the model here, the correlation between the error now and the error a time $t$ later is $e^{-t/\tau}$: after one $\tau$ it has faded to about $37\%$.
:::

::: context measurement-disturbance The controller believes the navigator
A controller never sees the real attitude. It sees only what navigation tells it. So if navigation says "tilted $0.08^\circ$ left," the controller works to tilt the vehicle $0.08^\circ$ right — even if the vehicle was perfectly straight. A good controller follows its measurement faithfully, which is exactly why it copies measurement errors into the real motion so faithfully.
:::

::: context complementary-sensitivity Why "complementary"
Control engineers pair $T$ with the **sensitivity** $S_\mathrm{e}=1/(1+L)$, which says how much of a disturbance at the output survives the loop. Add them: $\frac{1}{1+L}+\frac{L}{1+L}=1$. The two always sum to one, so they "complement" each other. Where the loop follows commands well ($T\approx1$), it also passes sensor errors straight through. No loop can both follow the measurement and ignore errors in it at the same frequency. Below, both magnitudes for this lesson's loop: $\lvert T\rvert$ (dark) is near $1$ at low frequency and small at high; $\lvert S_\mathrm{e}\rvert$ (blue) does the opposite. Near crossover both rise above $1$ — their *complex* sum is still exactly $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="70" x2="345" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="34" y="74" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="34" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40.0,70.0 100.0,70.0 130.0,69.8 145.0,69.4 160.0,68.6 175.0,66.6 182.5,64.7 190.0,61.9 197.5,57.9 205.0,52.5 212.5,46.6 216.2,44.0 220.0,42.3 223.8,42.2 227.5,44.0 231.3,47.9 235.0,53.9 238.8,61.2 242.5,69.1 246.2,77.3 250.0,85.1 253.8,92.4 257.5,99.0 261.2,105.1 265.0,110.6 268.8,115.7 272.5,120.4 276.2,124.9 280.0,129.4 283.8,134.1 287.5,139.2 291.2,144.4 295.0,147.7 298.8,145.8 302.5,144.0 306.2,143.2 310.0,143.1 313.8,143.3 317.5,143.7 321.2,144.2 325.0,144.7 328.8,145.2 332.5,145.7 336.2,146.1 340.0,146.6"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,150.0 100.0,150.0 130.0,149.8 145.0,149.4 160.0,148.6 167.5,147.8 175.0,146.5 182.5,144.4 190.0,141.1 197.5,136.0 205.0,128.1 212.5,116.5 220.0,100.9 227.5,83.6 235.0,69.2 242.5,60.4 250.0,56.1 257.5,54.3 265.0,53.6 272.5,53.8 280.0,55.2 287.5,60.3 295.0,69.0 302.5,71.3 310.0,69.3 317.5,67.5 325.0,66.6 332.5,66.4 340.0,66.6"/>
  <text x="70" y="62" font-size="11" fill="#1f2a44">|T|: follows</text>
  <text x="70" y="142" font-size="11" fill="#1d6fd1">|Se|: rejects</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="115" y="165">0.1</text><text x="190" y="165">1</text><text x="265" y="165">10</text>
  </g>
  <text x="340" y="178" font-size="11" fill="#1f2a44" text-anchor="end">ω, rad/s (log scale)</text>
</svg>
```
:::

::: context ou-process A random walk on a spring
A plain random walk wanders off forever. An **Ornstein–Uhlenbeck process** is a random walk tied to zero by a spring: each moment it gets a random kick, and it is also pulled back toward zero, harder the farther it strays. The pull sets the correlation time. It is named after Leonard Ornstein and George Uhlenbeck, who used it in 1930 to describe a particle jostled by molecules. Engineers use it for sensor biases that drift but do not run away.
:::

::: context psd An equalizer for errors
A music app's equalizer shows bars for bass, middle and treble — how much sound energy sits at each pitch. A **power spectral density** is the same display for any signal, including an error. A slow-wandering error has tall bars at low frequency. A fast-jittering one spreads its bars across the whole range. Once an error is drawn this way, you can ask a loop "how much do you amplify each bar?" and add up the answer.
:::

::: context factor-two One input, eight outputs
The jitter table drawn to scale. Every bar had the same $0.08^\circ$ input (dashed line); only the correlation time changed. The short bar on the left is the error the loop filters out; the tall ones near $\tau = 1\,\mathrm s$ are the ones it amplifies; the long-$\tau$ bars settle toward the input, never below it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="48" x2="350" y2="48" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="348" y="42" font-size="11" fill="#b4232c" text-anchor="end">input 0.08°</text>
  <g fill="#1d6fd1">
    <rect x="50" y="96.7" width="26" height="63.3"/>
    <rect x="88" y="48.6" width="26" height="111.4"/>
    <rect x="126" y="41.3" width="26" height="118.7"/>
    <rect x="164" y="40.6" width="26" height="119.4"/>
    <rect x="202" y="42.4" width="26" height="117.6"/>
    <rect x="240" y="44.5" width="26" height="115.5"/>
    <rect x="278" y="46.0" width="26" height="114.0"/>
    <rect x="316" y="47.0" width="26" height="113.0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="63" y="175">0.05</text><text x="101" y="175">0.3</text><text x="139" y="175">0.6</text><text x="177" y="175">1</text>
    <text x="215" y="175">2</text><text x="253" y="175">4</text><text x="291" y="175">8</text><text x="329" y="175">16</text>
  </g>
  <text x="195" y="188" font-size="11" fill="#6c7a93" text-anchor="middle">correlation time τ, s</text>
  <text x="63" y="90" font-size="11" fill="#1f2a44" text-anchor="middle">0.045°</text>
  <text x="177" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">0.085°</text>
</svg>
```
:::

::: context overlay The overlay, drawn
The dark curve is the loop's $\lvert T\rvert$, on a log frequency axis; the dashed line marks $\lvert T\rvert=1$. The shaded curves show where each error's energy sits (energy per decade, peaked at the corner $1/\tau$). The $\tau=1\,\mathrm s$ error puts its energy right next to the peak. The $\tau=0.05\,\mathrm s$ error sits out where $\lvert T\rvert$ has fallen away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="70" x2="345" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="34" y="74" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2.5" points="40.0,148.8 47.5,148.5 55.0,148.1 62.5,147.6 70.0,147.0 77.5,146.2 85.0,145.2 92.5,144.0 100.0,142.5 107.5,140.5 115.0,138.1 122.5,135.1 130.0,131.4 137.5,127.0 145.0,121.6 152.5,115.5 160.0,108.8 167.5,101.9 175.0,95.8 182.5,91.6 190.0,90.0 197.5,91.6 205.0,95.8 212.5,101.9 220.0,108.8 227.5,115.5 235.0,121.6 242.5,127.0 250.0,131.4 257.5,135.1 265.0,138.1 272.5,140.5 280.0,142.5 287.5,144.0 295.0,145.2 302.5,146.2 310.0,147.0 317.5,147.6 325.0,148.1 332.5,148.5 340.0,148.8"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,149.9 55.0,149.9 70.0,149.8 85.0,149.8 100.0,149.6 115.0,149.4 130.0,149.0 145.0,148.5 160.0,147.6 175.0,146.2 190.0,144.0 205.0,140.5 220.0,135.2 235.0,127.0 250.0,115.6 257.5,108.8 265.0,102.0 272.5,95.9 280.0,91.6 287.5,90.0 295.0,91.5 302.5,95.8 310.0,101.9 317.5,108.7 325.0,115.4 332.5,121.6 340.0,126.9"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40.0,70.0 100.0,70.0 130.0,69.8 145.0,69.4 160.0,68.6 175.0,66.6 182.5,64.7 190.0,61.9 197.5,57.9 205.0,52.5 212.5,46.6 216.2,44.0 220.0,42.3 223.8,42.2 227.5,44.0 231.3,47.9 235.0,53.9 238.8,61.2 242.5,69.1 246.2,77.3 250.0,85.1 253.8,92.4 257.5,99.0 261.2,105.1 265.0,110.6 268.8,115.7 272.5,120.4 276.2,124.9 280.0,129.4 283.8,134.1 287.5,139.2 291.2,144.4 295.0,147.7 298.8,145.8 302.5,144.0 306.2,143.2 310.0,143.1 313.8,143.3 317.5,143.7 321.2,144.2 325.0,144.7 328.8,145.2 332.5,145.7 336.2,146.1 340.0,146.6"/>
  <text x="228" y="36" font-size="11" fill="#1f2a44">|T| peak 1.35</text>
  <text x="176" y="86" font-size="11" fill="#1d6fd1">τ = 1 s</text>
  <text x="300" y="84" font-size="11" fill="#1f2a44">τ = 0.05 s</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="115" y="165">0.1</text><text x="190" y="165">1</text><text x="265" y="165">10</text>
  </g>
  <text x="330" y="180" font-size="11" fill="#1f2a44" text-anchor="end">ω, rad/s (log scale)</text>
</svg>
```

The dip near $25\,\mathrm{rad/s}$ in $\lvert T\rvert$ is the bending-mode notch.
:::

::: context independence When "independent" is not true
Root-sum-square adding assumes errors are independent — that knowing one tells you nothing about another. Here the navigation error and the control error are not independent at all: the controller *copies* part of the navigation error into the real attitude, and even amplifies it at some frequencies. The final lesson's Monte Carlo campaign is where a shared cause like this shows up, because it runs every piece together instead of adding separate numbers on paper.

:::

::: context waterbed Pushing down a waterbed
Press down on one spot of a waterbed and it bulges up somewhere else. Feedback loops behave the same way. A result called Bode's sensitivity integral says that, for loops like this one, making disturbances smaller in one frequency band forces them to grow in another. So a control-side fix does not delete the peak; it *moves* it — ideally to frequencies where the real navigation error has little energy. That is why the overlay, not either curve alone, is what guides the redesign.
:::
