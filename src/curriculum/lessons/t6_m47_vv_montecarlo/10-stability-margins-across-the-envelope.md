---
id: l10-stability-margins-across-the-envelope
title: Stability margins across the envelope
minutes: 20
covers:
  - 'Stability margin verification across the envelope: frozen-time linearisation, gain, phase and delay margin against flight time'
---

Push a full shopping cart and it rolls off gently. Push an empty one exactly as hard and it shoots away, maybe into a shelf. You did not change; the cart did. The same shove that was perfect for a heavy cart is too much for a light one.

A rocket's steering computer has the same problem, all flight long. As propellant burns, the vehicle gets lighter and easier to turn. The air pushes on it hardest partway up, at a moment called **[[max-Q|max-q]]**, then almost not at all. The engine's steering power changes too. So the thing the controller is steering is a slightly different machine every second. How close that loop is to wobbling out of control — its **stability margin** — is therefore not one number. It is a curve against flight time.

This lesson shows how engineers check that curve against a requirement without having to solve the full, ever-changing problem in one go. The method is called **frozen-time linearization**. You will see what it assumes, how to test that assumption with numbers, and a worked case where the margin collapses late in the burn for a reason worth understanding exactly.

## A snapshot of a moving vehicle

Picture taking a photo of a runner every second. Each photo is frozen, but a stack of them tells you how the race went — as long as the runner does not do anything sudden between two photos.

Frozen-time analysis does the same with the vehicle. Pick a flight time $t^*$ (read "t star"). Treat every slowly changing quantity as fixed at its value at that moment: the mass, the **[[moment of inertia|inertia-word]]** (how hard the vehicle is to spin), the dynamic pressure, and the control gains that the gain schedule picks at that point. The result is an ordinary **linear time-invariant** system — one whose behavior does not change with time. Its open-loop transfer function is $G(s)$, the usual description of how the loop responds to each frequency.

Now compute the classical margins at that one instant. Both come from sweeping frequency $\omega$ (read "omega", in radians per second) and looking at the loop's size and timing at each frequency.

- The **gain crossover frequency** $\omega_{gc}$ ("omega g c") is where the loop's size is exactly one: $|G(j\omega_{gc})| = 1$. The **phase margin** is how far the phase sits above $-180^\circ$ there:

$$
\mathrm{PM} = 180^\circ + \angle G(j\omega_{gc}).
$$

- The **phase crossover frequency** $\omega_{pc}$ is where the phase reaches $-180^\circ$: $\angle G(j\omega_{pc}) = -180^\circ$. The **gain margin** is how far the size sits below one there, in **[[decibels|decibels]]**:

$$
\mathrm{GM} = -20\log_{10}|G(j\omega_{pc})|.
$$

In words, phase margin says how much extra lag the loop can take before it oscillates, and gain margin says how much extra gain. The [[picture|crossovers]] shows both on one plot. These are the same margins from the classical control material this module assumes you know. Here the only new thing is that we compute them again and again, at many instants.

### Does a stack of snapshots prove anything?

Not automatically. Here is the surprise. Take two systems that are each perfectly stable. Switch back and forth between them at the wrong rhythm, and the switched system can blow up. Every frozen instant looks fine, yet the real, moving system is not. You met this in the gain-scheduling material of the control curriculum; the [[swing|switching-swing]] shows how it happens.

What rescues frozen-time analysis is a **slow-variation condition**. The vehicle's parameters must change slowly compared with how fast the loop itself reacts. Then, in the time the loop takes to respond to a bump, the plant it is responding to has barely moved from where you froze it. This is a rule of thumb, not a proven bound. So do not assert it. Put a number on it, which the worked example below does.

And frozen-time analysis is never the only check. The dispersed nonlinear 6-DOF runs from earlier in this module fly the vehicle continuously through time, saturations and all. They are the cross-check that catches what the snapshots assume away.

::: key
Frozen-time margin verification: linearize at closely spaced flight times over the dispersed cases (not only the nominal trajectory), compute gain, phase and **delay** margin at each, and plot the worst case against flight time against the requirement. Include flex and slosh modes in the plant — the binding margin is usually there, not at the rigid-body crossover. It is valid only while the plant's parameters vary slowly relative to the closed loop's own response time — a condition to check with numbers, not to assume — and it is paired with nonlinear time-domain simulation.
:::

## Delay margin, and why it gets its own line

Think of a shower with a long pipe. You turn the knob toward hot. Nothing happens, so you turn it more. Then the hot water arrives all at once, too hot, so you swing back toward cold — and overshoot again. The lag between your hand and the water is what made you swing. Nothing else was wrong.

Every digital control loop has that lag. The sensors are sampled, the computer takes time to calculate, the actuator takes time to move. Together they make a **transport delay** $\tau$ (read "tau"), in seconds. A pure delay passes every frequency at full size but late. Its frequency response is $e^{-j\omega\tau}$: size one, phase $-\omega\tau$ radians. So a fixed delay costs more phase at higher frequencies — the [[wave picture|delay-phase]] shows why.

The phase margin is exactly the phase the loop can lose before it goes unstable. So the extra delay the loop can take before that budget is used up is

$$
\tau_{\mathrm{margin}} = \frac{\mathrm{PM}_{\mathrm{rad}}}{\omega_{gc}}.
$$

This is the **delay margin**. $\mathrm{PM}_{\mathrm{rad}}$ is the phase margin written in radians, not degrees; multiply degrees by $\pi/180$ to convert.

Why give it its own line in a report, when it comes straight from phase margin? Because the same phase margin in degrees means very different delay budgets, depending on where the crossover sits. A slow loop can absorb a given delay easily. A fast loop, with the very same phase margin in degrees, may not, because the delay costs more phase at its higher frequency. And latency is the error source that most often wrecks a design late, when software grows and nobody re-checks the timing.

::: note Why it has to be true
At the gain crossover the loop's size is exactly one, and its phase is $-180^\circ + \mathrm{PM}$. Add a pure delay $\tau$. It leaves the size alone, so the crossover frequency does not move. It subtracts $\omega_{gc}\tau$ radians of phase at that frequency. The loop stays stable as long as the phase has not reached $-180^\circ$, that is, while

$$
\omega_{gc}\tau \leq \mathrm{PM}_{\mathrm{rad}}.
$$

Divide both sides by the positive number $\omega_{gc}$ and the largest safe delay is $\tau = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$. At that delay, the phase lost to the delay exactly equals the margin you had.
:::

::: example The same phase margin, two very different delay budgets
Two loops both have a phase margin of $45^\circ$. On paper they look equally healthy.

**Convert to radians.** $45^\circ \times \pi/180 = 0.7854\,\mathrm{rad}$.

**Loop one** crosses over at $\omega_{gc} = 5\,\mathrm{rad/s}$. Its delay margin is $0.7854/5 = 0.1571\,\mathrm{s}$, or $157.1\,\mathrm{ms}$.

**Loop two** crosses over ten times faster, at $\omega_{gc} = 50\,\mathrm{rad/s}$. Its delay margin is $0.7854/50 = 0.01571\,\mathrm{s}$, or $15.7\,\mathrm{ms}$.

Same phase margin in degrees, ten times less room for delay. The only difference is that the same radian budget is divided by a crossover ten times larger.

**Sanity check.** A report that quotes phase margin alone would show these two loops as equally healthy. Loop two has an order of magnitude less room for the sensor, computing and actuator lag every real digital controller carries. $15.7\,\mathrm{ms}$ is less than one sample at $50\,\mathrm{Hz}$ ($20\,\mathrm{ms}$), so one slow computer frame could use it all up. That is why delay margin is plotted as its own line, not assumed to follow phase margin.
:::

::: warning Degrees in, nonsense out
The formula needs the phase margin in **radians**. Put $45$ in instead of $0.7854$ and loop one "tolerates" $9\,\mathrm{s}$ of delay — a number so large it should stop you cold. Convert first, and check the result against the loop period $2\pi/\omega_{gc}$: a delay margin is always a fraction of it.
:::

## Sweeping flight time

Now put it together on a vehicle whose inertia falls as it burns.

::: example A fixed computing delay, three frozen flight times
A rigid-body attitude loop uses a **[[proportional-derivative|pd-control]]** controller. Its gains are $k_p = 5.2\times10^5$ (newton-meters per radian of attitude error) and $k_d = 3.6\times10^5$ (newton-meters per radian-per-second of rate error). The plant is a rigid body, $1/(Is^2)$, where $I$ is the moment of inertia in kg·m². The loop closes through a fixed computing-plus-actuator delay of $T_d = 30\,\mathrm{ms}$ — one and a half sample periods for a $50\,\mathrm{Hz}$ controller, a typical figure. The open-loop transfer function is

$$
G(s) = \frac{k_d s + k_p}{I s^2}\,e^{-sT_d}.
$$

A pure delay has no ordinary fraction-of-polynomials transfer function. So a Bode-plot tool that assumes one will get it wrong. Instead, evaluate $|G(j\omega)|$ and $\angle G(j\omega)$ directly at many frequencies and find the crossings numerically. Doing that at three flight times, with inertia falling as propellant burns:

| Flight time | $I$ (kg·m²) | $\omega_{gc}$ (rad/s) | PM | $\omega_{pc}$ (rad/s) | GM | Delay margin |
| --- | --- | --- | --- | --- | --- | --- |
| $t=0\,\mathrm{s}$ (liftoff) | $48{,}000$ | $7.633$ | $66.2^\circ$ | $51.42$ | $16.7\,\mathrm{dB}$ | $151\,\mathrm{ms}$ |
| $t=75\,\mathrm{s}$ (max-Q) | $39{,}000$ | $9.341$ | $65.2^\circ$ | $51.42$ | $14.9\,\mathrm{dB}$ | $122\,\mathrm{ms}$ |
| $t=150\,\mathrm{s}$ (near MECO) | $9{,}000$ | $40.03$ | $19.1^\circ$ | $51.42$ | $2.2\,\mathrm{dB}$ | $8.3\,\mathrm{ms}$ |

(MECO is main engine cutoff, the end of the first-stage burn.)

**Read the table column by column.** The phase crossover $\omega_{pc}$ does not move at all. It is set only by the gains and the delay, and neither changed. Inertia divides the loop's *size*; it never touches its phase. What moves is the gain crossover. As $I$ falls, the loop's size rises, and it reaches one at a higher frequency: $7.6$, then $9.3$, then $40\,\mathrm{rad/s}$.

**The collapse.** By $t=150\,\mathrm{s}$, $\omega_{gc}$ has climbed to within a factor of $51.42/40.03 = 1.28$ of the fixed $\omega_{pc}$. The margins fall with it. Phase margin drops from a comfortable $66^\circ$ to a thin $19^\circ$. Gain margin drops from $16.7$ to $2.2\,\mathrm{dB}$. Delay margin drops from $151\,\mathrm{ms}$ to $8.3\,\mathrm{ms}$ — about eighteen times smaller ($151/8.3 = 18.1$), for a delay that has not changed at all. This is the empty shopping cart: the same gains are now far too strong.

A margin requirement checked only at liftoff, or only at the nominal design point, would have missed this completely. It shows up only when you sweep flight time.

**Is the sweep trustworthy?** Back to the slow-variation condition. For the check, take a steady burn at the average rate between the endpoints: $(48{,}000 - 9{,}000)/150 = 260\,\mathrm{kg\,m^2/s}$. Divide that by the inertia at each point to get the fraction lost per second. Then multiply by the loop period $2\pi/\omega_{gc}$ to get the fraction lost while the loop completes one cycle:

| Flight time | $|dI/dt|/I$ | Loop period | Relative change per loop period |
| --- | --- | --- | --- |
| $t=0\,\mathrm{s}$ | $0.542\%/\mathrm{s}$ | $823\,\mathrm{ms}$ | $0.446\%$ |
| $t=75\,\mathrm{s}$ | $0.667\%/\mathrm{s}$ | $673\,\mathrm{ms}$ | $0.448\%$ |
| $t=150\,\mathrm{s}$ | $2.889\%/\mathrm{s}$ | $157\,\mathrm{ms}$ | $0.453\%$ |

The inertia changes by almost the same tiny fraction, about $0.45\%$, per loop period at every point. The reason: as inertia falls, the crossover speeds up in step, so the loop gets quicker exactly as the vehicle changes faster. Even using the steeper late-burn rate from the table, $(39{,}000-9{,}000)/75 = 400\,\mathrm{kg\,m^2/s}$, the change near MECO is only $0.70\%$ per loop period. The frozen picture holds. The thin margin at $t=150\,\mathrm{s}$ is a real property of the vehicle, not an artifact of the method.

**Now contrast staging.** At stage separation a big chunk of inertia goes away in a fraction of a second. Say $25\%$ in $0.3\,\mathrm{s}$ near $t=150\,\mathrm{s}$. That is a rate of $25/0.3 = 83\%/\mathrm{s}$, and over one $157\,\mathrm{ms}$ loop period a change of $13\%$ — about thirty times larger than anywhere in the smooth burn. Here the snapshots on either side of the event say nothing reliable about what happens during it. Staging needs its own transient analysis across the jump, not one more dot on a smooth curve.
:::

::: warning The rigid-body crossover is rarely the binding margin on a real vehicle
The example uses a rigid body to keep the mechanism easy to see. On a real vehicle, the margin that fails first is usually at a structural **[[bending mode|bending-mode]]** — the whole rocket flexing like a ruler — or a propellant **[[slosh mode|slosh]]**, not at the rigid-body crossover. The procedure is the same: at each flight time, put the flex and slosh dynamics into the plant model and sweep gain, phase and delay margin as above. A package that stops at the rigid-body loop has not verified the margin most likely to be the real limit.
:::

## Worst case, not average case

One more step turns a sweep into verification. Mass, inertia and aerodynamic properties are dispersed quantities, from the dispersion-set lessons earlier in this module. Shift them and the crossover and the margins shift too. So you repeat the whole frozen-time sweep over the dispersed cases, and at each flight time you keep the *smallest* margin. That lower edge becomes one curve, plotted against flight time, against the requirement.

A margin plotted only for the nominal case — with dispersions checked separately or not at all — is the gap the flight-qualification material in the control curriculum warns about. A **[[review board|review-question]]** finds it with one question: is this the worst case, or the average one?

## Check yourself

::: check
Derive the delay margin formula $\tau_{\mathrm{margin}} = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ from the fact that a pure delay $\tau$ adds phase $-\omega\tau$ at frequency $\omega$.
:::

::: answer
Phase margin is the extra phase lag the loop can absorb at the gain crossover frequency before its phase reaches $-180^\circ$ and it loses stability. A pure delay $\tau$ does not change the loop's size, so the crossover stays at $\omega_{gc}$, and there it adds exactly $-\omega_{gc}\tau$ radians of phase. The loop stays stable while $\omega_{gc}\tau \leq \mathrm{PM}_{\mathrm{rad}}$, the phase margin in radians. Dividing by $\omega_{gc}$, the largest tolerable delay is $\tau_{\mathrm{margin}} = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$: the delay whose phase loss exactly uses up the available margin.
:::

::: check
In the worked example, why does the phase crossover frequency stay fixed at $51.42\,\mathrm{rad/s}$ at all three flight times, while the gain crossover rises sharply?
:::

::: answer
Inertia $I$ appears in $G(j\omega)$ only as a real, positive number dividing the whole thing, so $|G(j\omega)| \propto 1/I$. Dividing a complex number by a positive real number shrinks or stretches it without turning it, so the phase does not depend on $I$ at all. The phase crossover is defined only by where the phase reaches $-180^\circ$, which is set by the PD gains and the delay — unchanged in all three cases. The gain crossover is where the size reaches one; as $I$ falls, the size rises at every frequency, so that point moves out to higher frequency.
:::

::: check
A frozen-time sweep at three flight times shows comfortable margins at all three. A colleague concludes the vehicle is verified stable throughout flight. What extra check does this lesson say you need before accepting that?
:::

::: answer
A check, with numbers, that the vehicle's parameters vary slowly compared with the closed loop's own response time. For instance, compare each swept parameter's fractional change per second with the loop period at each flight time, as the worked example did for inertia. Frozen-time analysis assumes slow variation; it does not prove it. Three good snapshots also cannot rule out a fast event between or near them — a staging event, an abrupt mode switch — which needs its own transient analysis. (The dispersed nonlinear simulation, flown continuously through time, is the cross-check on both.)
:::

::: check
Using the worked numbers, explain why the eighteenfold drop in delay margin between liftoff and near-MECO is a real finding about the vehicle, not a sign that the frozen-time analysis broke down.
:::

::: answer
The slow-variation check showed inertia changes by only about $0.45\%$ per loop period at every flight time examined, including near MECO (and about $0.7\%$ even at the steeper late-burn rate). That is slow compared with the loop, so the frozen-time assumption holds at all three points and each margin is trustworthy. The collapse is instead a real physical effect: as inertia falls, the loop's size rises, the gain crossover climbs from $7.6$ to $40\,\mathrm{rad/s}$, and it closes in on the fixed phase crossover at $51.4\,\mathrm{rad/s}$ set by the gains and the delay. The method measured a real narrowing of the stability boundary; it did not create one.
:::

::: check
A loop has a phase margin of $30^\circ$ at a gain crossover of $12\,\mathrm{rad/s}$. The flight computer runs at $100\,\mathrm{Hz}$. How many whole extra frames of delay could the loop absorb?
:::

::: answer
Convert the phase margin to radians: $30 \times \pi/180 = 0.5236\,\mathrm{rad}$. The delay margin is $0.5236/12 = 0.04363\,\mathrm{s}$, about $43.6\,\mathrm{ms}$. One frame at $100\,\mathrm{Hz}$ is $10\,\mathrm{ms}$, so the loop could absorb $4$ whole extra frames ($43.6/10 = 4.36$) before the fifth pushed it past the margin. Sanity check: the loop period is $2\pi/12 = 524\,\mathrm{ms}$, and the delay margin is a small fraction of it, as it should be.
:::

::: check
Why is a margin sweep run only along the nominal trajectory, with no dispersions, not enough for verification?
:::

::: answer
Mass, inertia and aerodynamic properties are dispersed quantities, and the margin at a given flight time moves as they move away from nominal. A nominal-only sweep reports the margin for one average case, not the worst case a real, dispersed vehicle might present. Verification repeats the frozen-time sweep across the dispersed cases at each flight time and reports the worst margin — the same idea as a Monte Carlo reliability claim, which is about the tail, not the average.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathrm{PM} = 180^\circ + \angle G(j\omega_{gc})$, $|G(j\omega_{gc})|=1$ | Phase margin, at the gain crossover frequency |
| $\mathrm{GM} = -20\log_{10}|G(j\omega_{pc})|$, $\angle G(j\omega_{pc})=-180^\circ$ | Gain margin, at the phase crossover frequency |
| $\tau_{\mathrm{margin}} = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ | Delay margin: the added pure delay that exactly uses up the phase margin |
| Frozen-time validity | Parameters must vary slowly compared with the loop's response time — check the change per loop period with numbers |
| Worked collapse | PM $66^\circ\to19^\circ$, delay margin $151\,\mathrm{ms}\to8.3\,\mathrm{ms}$ from liftoff to near-MECO, with the slow-variation check passing throughout |
| Staging | A fast jump in parameters; needs its own transient analysis |
| What a complete sweep reports | The worst margin over the dispersed cases, against flight time, against the requirement — never the nominal case alone |
| Common binding constraint | Often a flex or slosh mode, not the rigid-body crossover; include them in the swept plant |

Margins across the envelope are an analysis result. The next two lessons turn to the other half of verification: the flight and simulation code itself, starting with what it really means to test that code thoroughly rather than merely run it.

::: context max-q The moment the air pushes hardest
**Dynamic pressure**, $q = \tfrac{1}{2}\rho v^2$, measures how hard the oncoming air presses on the vehicle ($\rho$ is air density, $v$ is speed). Low down the rocket is slow; high up the air is thin. Somewhere between — often around a minute into flight at roughly $10$ to $13\,\mathrm{km}$ altitude — the product peaks. That peak is **max-Q**, when the structure and the aerodynamic torques are most severe. Many rockets throttle down through it.
:::

::: context inertia-word How hard something is to spin
Mass says how hard something is to push in a straight line. **Moment of inertia** says how hard it is to spin, and it depends on where the mass sits: mass far from the turning point counts much more. That is why a figure skater spins faster when she pulls her arms in. A rocket full of propellant has tonnes of liquid far from its center, so its inertia is huge at liftoff and shrinks a lot as the tanks drain — from $48{,}000$ to $9{,}000\,\mathrm{kg\,m^2}$ in this lesson's example.
:::

::: context decibels Why margins are quoted in decibels
A **decibel** measures a ratio on a logarithmic scale: for a gain, $20\log_{10}$ of the ratio. Every factor of $10$ is $20\,\mathrm{dB}$, and a factor of $2$ is about $6\,\mathrm{dB}$ ($20\log_{10} 2 = 6.02$). So a gain margin of $16.7\,\mathrm{dB}$ means the loop gain could grow by a factor of $10^{16.7/20} \approx 6.8$ before instability, while $2.2\,\mathrm{dB}$ means only about $1.29$ — a $29\%$ rise. The log scale is handy because gains that multiply in a loop add in decibels.
:::

::: context crossovers The two crossings on one plot
This is the liftoff loop from the worked example, drawn over $1$ to $100\,\mathrm{rad/s}$ on a log scale. The size (top) crosses $0\,\mathrm{dB}$ at $\omega_{gc} = 7.63$; the phase there sits $66^\circ$ above the $-180^\circ$ line. The phase (bottom) crosses $-180^\circ$ at $\omega_{pc} = 51.4$, where the size is $16.7\,\mathrm{dB}$ below zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="60" x2="330" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="36" y="64" font-size="11" fill="#6c7a93" text-anchor="end">0 dB</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,30.1 60,36.2 80,41.7 100,46.6 120,51.1 140,55.3 160,59.3 180,63.2 200,67.1 220,70.9 240,74.7 260,78.6 280,82.4 300,86.2 320,90"/>
  <text x="60" y="24" font-size="11" fill="#1d6fd1">size |G|</text>
  <line x1="40" y1="160" x2="330" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="36" y="164" font-size="11" fill="#6c7a93" text-anchor="end">−180°</text>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40,145.3 60,141.6 80,137.8 100,134.6 120,132.3 140,130.9 160,130.5 180,131.3 200,133.3 220,136.7 240,141.9 260,149.5 280,160.3 300,175.5 320,196.8"/>
  <text x="60" y="126" font-size="11" fill="#1f2a44">phase</text>
  <line x1="163.6" y1="60" x2="163.6" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="279.6" y1="60" x2="279.6" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="163.6" y1="158" x2="163.6" y2="133" stroke="#b4232c" stroke-width="3"/>
  <polygon points="163.6,130.6 159.6,138 167.6,138" fill="#b4232c"/>
  <text x="170" y="152" font-size="11" fill="#b4232c">PM 66°</text>
  <line x1="279.6" y1="62" x2="279.6" y2="80" stroke="#b4232c" stroke-width="3"/>
  <polygon points="279.6,82.3 275.6,75 283.6,75" fill="#b4232c"/>
  <text x="286" y="76" font-size="11" fill="#b4232c">GM 16.7 dB</text>
  <text x="163.6" y="208" font-size="11" fill="#1f2a44" text-anchor="middle">ω_gc 7.63</text>
  <text x="279.6" y="208" font-size="11" fill="#1f2a44" text-anchor="middle">ω_pc 51.4</text>
</svg>
```
:::

::: context switching-swing Pumping a swing
A child on a swing is a stable system: stop pumping and the swing settles. But a child who shifts her weight at just the right moments in each cycle makes it go higher and higher. Nothing about her body is unstable; the *timing* of the changes feeds energy in. Switching between two stable controllers can do the same thing. That is why frozen-time stability says nothing on its own about a system whose parameters change fast — it only speaks when the changes are too slow to pump the loop.
:::

::: context delay-phase Why a fixed delay costs more phase at high frequency
Phase is timing measured as a fraction of one cycle. A delay of $\tau$ seconds is a small slice of a slow wave's cycle but a big slice of a fast wave's cycle. Measured in radians, the lost phase is $\omega\tau$, growing in step with frequency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20,75 C45,15 75,15 100,75 S155,135 180,75 S235,15 260,75 S315,135 340,75" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M60,75 C85,15 115,15 140,75 S195,135 220,75 S275,15 300,75" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <line x1="20" y1="140" x2="60" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="134" x2="20" y2="146" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="134" x2="60" y2="146" stroke="#1f2a44" stroke-width="2"/>
  <text x="68" y="144" font-size="11" fill="#1f2a44">delay τ = a quarter of this cycle</text>
  <text x="250" y="22" font-size="11" fill="#1d6fd1">signal sent</text>
  <text x="250" y="130" font-size="11" fill="#b4232c">arrives τ later</text>
</svg>
```

Here $\tau$ is a quarter of the period, so the phase lost is $90^\circ$. Double the frequency and the same $\tau$ costs $180^\circ$ — enough, on its own, to turn a push into a pull.
:::

::: context pd-control Push back on the error and on its rate
A **proportional-derivative** (PD) controller makes a torque from two parts. The proportional part, $k_p$ times the attitude error, pushes back harder the further off you are, like a spring. The derivative part, $k_d$ times the rate of change of the error, pushes against motion, like a shock absorber. Together they turn a vehicle toward its target and stop it there without much overshoot. It is the backbone of most rocket attitude loops, usually with filters added.
:::


::: context bending-mode A rocket bends like a ruler
A launch vehicle is long and thin, so it flexes. In its first free-free **bending mode** the middle swings one way while both ends swing the other, with two still points, called nodes, about $22\%$ and $78\%$ of the way along.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="60" x2="320" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="40,35 63.3,44.7 86.7,54 110,62.5 133.3,69.3 156.7,73.7 180,75.2 203.3,73.7 226.7,69.3 250,62.5 273.3,54 296.7,44.7 320,35"/>
  <circle cx="102.8" cy="60" r="4" fill="#b4232c"/>
  <circle cx="257.2" cy="60" r="4" fill="#b4232c"/>
  <text x="102.8" y="98" font-size="11" fill="#b4232c" text-anchor="middle">node 22%</text>
  <text x="257.2" y="98" font-size="11" fill="#b4232c" text-anchor="middle">node 78%</text>
  <text x="40" y="22" font-size="11" fill="#1f2a44">engine end</text>
  <text x="320" y="22" font-size="11" fill="#1f2a44" text-anchor="end">nose</text>
</svg>
```

A rate gyro mounted away from a node feels this flexing as if the whole vehicle were turning. The controller then tries to "correct" the bend and can pump it up. That is why the plant model must include these modes, and why filters are placed to keep the loop from feeding them.
:::

::: context slosh Propellant that sloshes
Carry a half-full bowl of soup across a room and it rocks back and forth. Liquid propellant in a big tank does the same, at a frequency set by the tank size and the acceleration. The moving liquid pushes on the tank walls and on the vehicle's attitude. Tanks carry baffles — rings inside the walls — to damp it, and the control loop is designed so it does not excite it.
:::

::: context review-question The question reviewers always ask
Design and flight readiness reviews are where the evidence is inspected by people who did not produce it. Asking "is this the worst case over the dispersions?" is one of the most common questions at them, because a nominal-only plot looks just as confident as a worst-case one. In the capstone module you will produce exactly this kind of worst-case margin plot, including flex and slosh, for the whole dispersed flight.
:::
