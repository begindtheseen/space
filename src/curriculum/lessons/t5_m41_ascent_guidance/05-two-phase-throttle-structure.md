---
id: l05-two-phase-throttle-structure
title: The two-phase throttle structure
minutes: 18
covers:
  - "The two-phase throttle structure: constant thrust to a g-limit, then throttled constant acceleration"
---

Push a shopping cart full of heavy bags across a parking lot, pushing just as hard the whole way. Now imagine a friend lifting a bag out every few steps. You push no harder, yet the cart speeds up faster and faster, because there is less and less to move. By the end, the same push would send an empty cart flying.

A rocket is that cart. Its engine pushes with nearly the same force for the whole burn, while it throws away most of its own mass as exhaust. So its acceleration keeps climbing — and near the end it would climb to levels that crush astronauts and break satellites. The fix is to ease off the engine, the way you would ease off the cart. The rule for *when* and *how much* is the **two-phase throttle structure**: full thrust until the acceleration reaches a set limit, then throttle down just enough to hold it there.

The last two lessons dealt with where to point the thrust: the linear tangent law, and PEG re-solving it every few seconds. Both took the thrust's *size* as given. This lesson fills in that missing piece, and shows why PEG has to know which of the two phases it is in.

## Acceleration climbs as the rocket gets lighter

Hold the thrust $T$ fixed and let the engine burn propellant at a steady **mass flow rate** $\dot m$ ("m dot"), in kilograms per second. The mass falls in a straight line:

$$
m(t) = m_0 - \dot m\, t,
$$

where $m_0$ ("m nought") is the mass at ignition. By Newton's second law the thrust acceleration is

$$
a(t) = \frac{T}{m(t)}.
$$

The top stays the same and the bottom shrinks, so $a(t)$ keeps growing. It grows slowly at first and then faster and faster, because dividing by a small number gives a big answer. If the engine could burn every last kilogram at full thrust, the acceleration would end at $T/m_{\text{dry}}$ — thrust over the empty mass — which for a good stage is huge.

Engineers measure acceleration in **[[g's|g-load]]**: the acceleration divided by $g_0 = 9.80665\ \mathrm{m/s^2}$. "4 g" means four times the pull of gravity at Earth's surface — you would feel four times your weight pressing you into your seat.

::: example How steep the climb is
This module's stage 2 ignites at $112{,}400\ \mathrm{kg}$ with a $934\ \mathrm{kN}$ engine.

**At ignition:** $a_0 = 934{,}000/112{,}400 = 8.31\ \mathrm{m/s^2}$. Divide by $g_0$: $8.31/9.80665 = 0.85\ \mathrm{g}$. That is gentle.

**At burnout, if thrust never changed:** the stage empties down to its $13{,}500\ \mathrm{kg}$ of dry mass plus payload, so $a = 934{,}000/13{,}500 = 69.2\ \mathrm{m/s^2}$, or $7.05\ \mathrm{g}$.

**Sanity check.** The mass fell by a factor of $112{,}400/13{,}500 = 8.3$, and the acceleration rose by the same factor, $69.2/8.31 = 8.3$. Same push, one eighth of the mass, eight times the acceleration.

No crew could take seven g for long, and few payloads are built for it. And nothing dramatic marks the moment it goes from fine to too much: it creeps up smoothly.
:::

## The g-limit

Real vehicles set a hard ceiling on acceleration, the **g-limit**, written $a_{\lim}$ ("a lim"). It is set by the weakest link: what the crew can safely take, [[what the payload was built for|payload-limits]], or what the rocket's own structure can carry. Values from 3 to 6 g are typical. Crewed vehicles often use about 3 g; the Space Shuttle held its crew to 3 g.

Below the limit, full thrust is the best choice. It delivers the needed velocity in the least time. Less time spent climbing means less time for gravity to pull speed away, so the [[gravity loss|gravity-loss-short]] from the first lesson of this module is smallest. Above the limit, full thrust is not "a bit worse". It is simply not allowed.

## Two phases, one burn

That gives a throttle plan with exactly two parts.

**Phase one: full thrust.** From ignition, run the engine flat out. Acceleration climbs. This uses the propellant as fast as is safe.

**Phase two: hold the limit.** At the instant $a(t)$ reaches $a_{\lim}$, start to **throttle** — turn the engine's thrust down — by exactly enough to keep the acceleration *at* $a_{\lim}$, no more and no less, until cutoff.

To hold $a = a_{\lim}$ you need $T/m = a_{\lim}$, which means

$$
T(t) = a_{\lim}\, m(t).
$$

In words: the thrust must shrink in step with the mass. Half the mass, half the thrust.

This changes how the mass falls. For a rocket engine [[the flow is thrust divided by exhaust velocity|flow-rule]], $\dot m = T/v_e$, where $v_e$ ("v sub e") is how fast the exhaust leaves the nozzle. Put the throttle rule in:

$$
\frac{dm}{dt} = -\frac{T}{v_e} = -\frac{a_{\lim}}{v_e}\, m.
$$

The minus sign says mass goes down. The rate at which it goes down is proportional to how much mass there is. That is the signature of **[[exponential decay|exp-decay]]** — the same shape as a cooling cup of cocoa or a bouncing ball that loses a fixed fraction of its height each bounce. The solution is

$$
m(t) = m_{\lim}\, \exp\!\left[-\frac{a_{\lim}}{v_e}(t - t_{\lim})\right], \qquad \tau_{\text{throttle}} \equiv \frac{v_e}{a_{\lim}},
$$

where $t_{\lim}$ is the moment the limit is first reached and $m_{\lim}$ is the mass at that moment. Read $\tau_{\text{throttle}}$ as "tau throttle": the **time constant** of the decay, the time for the mass (and the thrust with it) to fall to $e^{-1} \approx 36.8\%$ of its starting value. The symbol $\equiv$ means "is defined as".

So in phase one the mass falls in a straight line; in phase two it falls along a curve that flattens out, because a lighter rocket needs less thrust and so burns propellant more slowly.

::: note Why it has to be true
Check that the formula solves the equation. Let $k = a_{\lim}/v_e$ and $m(t) = m_{\lim} e^{-k(t - t_{\lim})}$.

Differentiate. The chain rule brings down the factor $-k$: $\dot m = -k\, m_{\lim} e^{-k(t - t_{\lim})} = -k\, m(t)$. That is exactly $dm/dt = -(a_{\lim}/v_e)\,m$.

Check the starting value. At $t = t_{\lim}$ the exponent is zero and $e^0 = 1$, so $m = m_{\lim}$. Both conditions hold, so this is the solution.

The thrust follows the mass: $T(t) = a_{\lim} m(t)$ decays with the same time constant. One more handy fact: since $v_e = I_{sp}\, g_0$, a limit of $n$ g gives $\tau_{\text{throttle}} = I_{sp}\,g_0/(n g_0) = I_{sp}/n$. A $348\ \mathrm{s}$ engine under a 4 g limit has $\tau_{\text{throttle}} = 87\ \mathrm{s}$.
:::

::: key The two-phase throttle structure
Constant (full) thrust until the acceleration limit $a_{\lim}$ is reached — often 3 g for crew or structure — then throttle to hold constant acceleration $a_{\lim}$ for the rest of the burn. In the throttled phase the mass decays exponentially, $m(t) = m_{\lim} e^{-(t - t_{\lim})/\tau_{\text{throttle}}}$ with $\tau_{\text{throttle}} = v_e/a_{\lim}$. Guidance must know which phase it is in, because $t_{go}$ depends on the thrust profile.
:::

::: example Where a 4 g limit bites
Give stage 2 a limit of 4 g: $a_{\lim} = 4 \times 9.80665 = 39.2266\ \mathrm{m/s^2}$. Its engine has $v_e = 3412.71\ \mathrm{m/s}$ and flow $\dot m = 934{,}000/3412.71 = 273.68\ \mathrm{kg/s}$.

**When is the limit reached?** At full thrust, $a = T/m$ equals $a_{\lim}$ when $m = T/a_{\lim}$:

$$
m_{\lim} = \frac{934{,}000}{39.2266} = 23{,}810.4\ \mathrm{kg}.
$$

The mass falls steadily from $112{,}400\ \mathrm{kg}$, so it gets there at

$$
t_{\lim} = \frac{112{,}400 - 23{,}810.4}{273.68} = 323.69\ \mathrm{s}.
$$

**The time constant:** $\tau_{\text{throttle}} = 3412.71/39.2266 = 87.00\ \mathrm{s}$.

**How long does phase two last,** burning the rest down to $13{,}500\ \mathrm{kg}$? Solve $m_f = m_{\lim} e^{-t/\tau_{\text{throttle}}}$ for $t$: take the logarithm of both sides.

$$
t_{\text{throttle}} = \tau_{\text{throttle}} \ln\!\left(\frac{m_{\lim}}{m_f}\right) = 87.00 \times \ln\!\left(\frac{23{,}810.4}{13{,}500}\right) = 87.00 \times 0.5674 = 49.37\ \mathrm{s}.
$$

**The throttle setting along the way,** $T = T_{\max} e^{-t/87.00}$:

| time into phase two | thrust | percent of full |
| --- | --- | --- |
| 0 s | 934.0 kN | 100% |
| 10 s | 832.6 kN | 89.1% |
| 25 s | 700.7 kN | 75.0% |
| 49.4 s (cutoff) | 529.6 kN | 56.7% |

**Sanity check.** At cutoff, $T = a_{\lim} m_f = 39.2266 \times 13{,}500 = 529.6\ \mathrm{kN}$ — the same number the table reached by the exponential. Two routes, one answer.

The limit only bites in the last $49\ \mathrm{s}$ of a burn more than six minutes long. Yet those are the seconds in which the orbit is actually set.
:::

Whether the engine *can* throttle to 57% is a real design question. Every engine has a **[[minimum throttle|minimum-throttle]]** below which it cannot run smoothly, and a vehicle whose limit phase would need less must do something else — such as shutting down one of several engines.

## Why guidance must know which phase it is in

The time-to-go formula from the last lesson,

$$
t_{go} = \tau\left(1 - e^{-\Delta v/v_e}\right), \qquad \tau = m/\dot m,
$$

was built on one assumption: constant thrust and constant flow for the rest of the burn. That is phase one exactly — and it is false in phase two.

In phase two the *acceleration* is the fixed quantity. Velocity gained is acceleration times time, so the time needed is plain division:

$$
t_{go} = \frac{\Delta v_{\text{required}}}{a_{\lim}}.
$$

A burn that is still in phase one but will reach the limit before cutoff needs both pieces. First, full thrust down to $m_{\lim}$ gives $\Delta v_1 = v_e \ln(m/m_{\lim})$ in $(m - m_{\lim})/\dot m$ seconds. Then the rest, $\Delta v - \Delta v_1$, comes at $a_{\lim}$:

$$
t_{go} = \frac{m - m_{\lim}}{\dot m} + \frac{\Delta v - v_e\ln(m/m_{\lim})}{a_{\lim}} \qquad (\text{when } \Delta v > \Delta v_1).
$$

::: example The wrong formula, measured
**In phase two.** The 4 g limit has just been reached ($m = 23{,}810.4\ \mathrm{kg}$) and $500\ \mathrm{m/s}$ is still needed.

The right answer, at constant acceleration: $t_{go} = 500/39.2266 = 12.746\ \mathrm{s}$.

The constant-thrust formula, as if the engine were about to run unthrottled: $\tau = 23{,}810.4/273.68 = 87.00\ \mathrm{s}$, so $t_{go} = 87.00 \times (1 - e^{-500/3412.71}) = 11.857\ \mathrm{s}$.

That is $0.89\ \mathrm{s}$ short, a 7.0% error. At 4 g, $0.89\ \mathrm{s}$ of burn is about $35\ \mathrm{m/s}$.

**For a whole burn.** At stage-2 ignition, the first PEG cycle of the last lesson asked for about $6763\ \mathrm{m/s}$. Unthrottled, that is $354.08\ \mathrm{s}$. With the 4 g limit, phase one delivers $\Delta v_1 = 3412.71 \times \ln(112{,}400/23{,}810.4) = 5296\ \mathrm{m/s}$ in $323.69\ \mathrm{s}$, and the remaining $1466\ \mathrm{m/s}$ takes $1466/39.2266 = 37.38\ \mathrm{s}$. Total: $361.07\ \mathrm{s}$ — seven seconds longer.

**Sanity check.** Throttling can only slow the burn down, never speed it up, so the limited burn must take longer. It does.
:::

A guidance cycle using the constant-thrust formula in phase two would misjudge the remaining burn every single cycle. It would also steer using the wrong picture of how the last velocity arrives: it expects the acceleration to keep climbing past 4 g, when in truth it stays flat. The error shrinks as $\Delta v$ shrinks, but it never has to be there at all, because the right formula is no harder to evaluate. So a real implementation tracks the phase and switches formulas at the boundary, exactly as it tracks [[which stage is burning|engine-out-bridge]]. The Shuttle's [[UPFG|upfg-modes]] did exactly this.

::: warning The g-limit is not a steering rule
Throttling changes only the size of the thrust, $|T(t)|$. The linear tangent law still sets its *direction* in both phases — the derivation of lesson 3 never needed the thrust size to be constant. A throttled engine still steers. What does change is the numbers: the best $A$ and $B$ depend on the thrust history, so PEG must feed the true two-phase profile into its solve.
:::

## Check yourself

::: check
Below the acceleration limit, why is full thrust the best choice? And why, once the limit is reached, is full thrust not merely a worse choice but not a choice at all?
:::

::: answer
Below the limit, full thrust delivers the needed velocity in the least time. Less time climbing means less gravity loss, and nothing else is being traded away, so there is no reason to throttle. At the limit, the acceleration is a hard structural, crew or payload constraint. Staying at full thrust would push $a(t) = T/m(t)$ past it as the mass keeps falling. That is not inefficient — it is forbidden. The limit is a ceiling the vehicle may not cross, not a preference to be balanced against something else.
:::

::: check
Starting from $T(t) = a_{\lim} m(t)$ and $\dot m = -T/v_e$, show why the mass falls exponentially, not in a straight line, during the throttled phase.
:::

::: answer
Put the throttle rule into the flow equation: $\dot m = -a_{\lim} m / v_e = -(a_{\lim}/v_e)\,m$. The rate of loss is proportional to the mass itself. The solution is $m(t) = m_{\lim} e^{-(a_{\lim}/v_e)(t - t_{\lim})}$, exponential decay with rate $a_{\lim}/v_e$. In the constant-thrust phase, $\dot m$ is a fixed number, so the mass falls in a straight line. In the throttled phase the thrust — and so the flow — is proportional to the *current* mass. As the rocket gets lighter it burns more slowly, and that slowing-down is exactly what exponential decay looks like.
:::

::: check
A vehicle enters its throttled phase at $30{,}000\ \mathrm{kg}$ with $v_e = 3400\ \mathrm{m/s}$ and a 3.5 g limit. Find $\tau_{\text{throttle}}$, and the throttle setting (as a fraction of its value at entry) after one $\tau_{\text{throttle}}$.
:::

::: answer
The limit is $a_{\lim} = 3.5 \times 9.80665 = 34.323\ \mathrm{m/s^2}$, so $\tau_{\text{throttle}} = v_e/a_{\lim} = 3400/34.323 = 99.06\ \mathrm{s}$.

After one time constant, $m = m_{\lim} e^{-1} = 0.3679\, m_{\lim}$. Thrust is proportional to mass in this phase, so the throttle setting is also $e^{-1} \approx 36.8\%$ of its value at entry. That is a deep throttle-down in one time constant — one reason the throttled phase is normally the short, final part of a burn rather than a long, gentle taper.
:::

::: check
Why is the constant-thrust time-to-go formula *wrong* during throttle-hold, rather than only a little less accurate?
:::

::: answer
Its derivation assumes $\dot m$ stays constant for the rest of the burn. That is the defining feature of phase one, and it is false by construction in phase two, where $\dot m$ is proportional to the shrinking mass and keeps falling. A formula built on an assumption the vehicle is actively breaking does not lose a little precision; it answers a different question — "how long would the burn take at today's flow, held fixed?" — instead of the one guidance needs: "how long will the burn take under the throttle law actually in force?"
:::

::: check
The worked example's throttled phase lasts only $49.4\ \mathrm{s}$ of a burn more than six minutes long. Does that make the throttle structure a detail guidance can safely ignore?
:::

::: answer
No. The throttled phase is short, but it is the *last* part of the burn — the part where insertion accuracy is set and no later cycles remain to clean up a mistake. Using the constant-thrust formula there misjudges $t_{go}$ by about 7% when $500\ \mathrm{m/s}$ remains, which at 4 g is roughly $35\ \mathrm{m/s}$ of velocity, and it feeds the steering solve a wrong picture of how the final velocity will arrive. Over a whole burn the limit adds about seven seconds. An error of that kind, in exactly that window, is not worth accepting when the correct formula costs nothing extra.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| $a(t)$ | thrust acceleration at constant thrust | $a = T/m(t)$, climbs as the mass falls |
| g's | acceleration measured in units of $g_0$ | 4 g $= 39.2266\ \mathrm{m/s^2}$ |
| $a_{\lim}$ | g-limit set by crew, payload or structure | typically 3–6 g; often 3 g for crew |
| Phase one | full, constant thrust | until $a(t) = a_{\lim}$ |
| Phase two | throttle to hold $a_{\lim}$ | $T(t) = a_{\lim}\, m(t)$ |
| Throttled mass | exponential decay | $m(t) = m_{\lim} e^{-(t - t_{\lim})/\tau_{\text{throttle}}}$ |
| $\tau_{\text{throttle}}$ | time constant | $v_e/a_{\lim} = I_{sp}/n$ for an $n$-g limit |
| $t_{go}$ in phase two | constant acceleration | $\Delta v/a_{\lim}$ |
| $t_{go}$ across the switch | phase one, then phase two | $\frac{m - m_{\lim}}{\dot m} + \frac{\Delta v - v_e\ln(m/m_{\lim})}{a_{\lim}}$ |
| Worked 4 g example | stage 2 | limit at $23{,}810$ kg and $323.7$ s; phase two lasts $49.4$ s, ends at $56.7\%$ thrust |

The next lesson goes back in time. Saturn V flew this same steering problem in the 1960s, with a computer far too slow for the shooting method, using closed-form algebra instead — the Iterative Guidance Mode.

::: context g-load What "4 g" feels like
One g is the pull you feel standing still: your normal weight. Under an acceleration of $n$ g, your seat pushes on you $n$ times as hard, so you feel $n$ times as heavy. A big roller coaster may reach about 4 g for a moment. Astronauts on the Space Shuttle felt 3 g for the last minute or so of the climb — like having two more people lying on top of them. Lying on your back helps: the load goes through your chest front to back, which the body tolerates far better than head-to-foot, where blood drains from the brain.

The curve below is this lesson's stage 2: acceleration in g against time. Blue: full thrust all the way, climbing to 7 g. Red: the 4 g limit, flat from 323.7 s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 165" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="37" y1="124" x2="43" y2="124" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="37" y1="76" x2="43" y2="76" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="37" y1="28" x2="43" y2="28" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="128" font-size="11" text-anchor="end" fill="#1f2a44">1 g</text>
  <text x="34" y="80" font-size="11" text-anchor="end" fill="#1f2a44">4 g</text>
  <text x="34" y="32" font-size="11" text-anchor="end" fill="#1f2a44">7 g</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,126 72,125 104,123 136,121 169,118 201,114 233,107 257,100 281,90 300,76 313,61 321,48 325,40 331,27"/>
  <line x1="300" y1="76" x2="340" y2="76" stroke="#b4232c" stroke-width="2.5"/>
  <text x="190" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">time since stage-2 ignition (0 to 373 s)</text>
  <text x="250" y="70" font-size="11" text-anchor="end" fill="#b4232c">capped at 4 g</text>
</svg>
```
:::

::: context payload-limits Satellites have a g-limit too
A satellite is built to survive its ride, and no more — every extra kilogram of stiffening is a kilogram of fuel or instruments it cannot carry. So each launch vehicle publishes a payload user's guide listing the steady accelerations and vibrations a payload will see, and satellite makers design to those numbers. A rocket that exceeded its published g-limit would break its promise to every customer who designed to it.
:::

::: context gravity-loss-short Why slow burns waste propellant
Picture a helicopter hovering: its engine burns fuel every second and it goes nowhere, because all the lift just cancels its weight. A rocket climbing with low acceleration is partly in the same trap — every second of burn, gravity takes back about $9.8\ \mathrm{m/s}$ of the vertical speed. Finish the burn sooner and gravity has fewer seconds to take its share. That is why full thrust is best whenever it is allowed, and why throttling to meet the g-limit costs a little performance: the burn gets longer.
:::

::: context flow-rule Why flow is thrust over exhaust velocity
Thrust is the push you get from throwing mass out of the back. Each second the engine throws $\dot m$ kilograms of gas backward at speed $v_e$, which gives the gas $\dot m\, v_e$ of momentum per second. By Newton's third law the rocket gets the same push forward, so $T = \dot m\, v_e$. Turn it around and $\dot m = T/v_e$: at a fixed exhaust velocity, throttle the thrust down by half and the flow halves too. Throttling changes $v_e$ a little in a real engine, but treating it as fixed is the standard guidance model.
:::

::: context exp-decay Exponential decay you already know
A hot drink cools fast at first and then more and more slowly, because the rate of cooling depends on how much hotter it is than the room. Any quantity whose rate of change is proportional to its own size decays this way. After one time constant it is down to 36.8% of where it started; after two, 13.5%; after three, 5.0%. The throttled rocket's mass and thrust follow exactly this rule.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,30 70,58 100,79 130,93 160,104 190,111 220,116 250,120 280,123 310,125 340,126"/>
  <line x1="130" y1="93" x2="130" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="220" y1="116" x2="220" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
  <text x="136" y="90" font-size="11" fill="#1f2a44">36.8%</text>
  <text x="226" y="110" font-size="11" fill="#1f2a44">13.5%</text>
  <text x="130" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">1 τ</text>
  <text x="220" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">2 τ</text>
  <text x="310" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">3 τ</text>
</svg>
```
:::

::: context minimum-throttle Engines cannot throttle all the way down
Turning down a rocket engine is harder than turning down a stove. At low thrust the pressure in the combustion chamber drops, the propellant can burn unevenly, and the engine can start to shake itself or stall. So every engine has a minimum setting. When a vehicle cannot throttle deep enough, it can shut engines off instead: Saturn V's first stage switched off its center engine early, partly to keep the acceleration down. Multi-engine stages have that option; single-engine upper stages must be designed so the limit phase never asks for less than the engine can give.
:::

::: context engine-out-bridge When the phase boundary moves
The switch time $t_{\lim}$ is not fixed before launch. It is where the thrust over the mass reaches the limit, so anything that changes thrust or mass moves it. Lose one engine of several and the acceleration is lower all the way up — the limit is reached later, or never. A guidance system that had the switch time stored as a number would plan wrongly; one that recomputes $m_{\lim} = T/a_{\lim}$ from the thrust it actually has gets it right. Lesson 8, on engine-out, builds on this.
:::

::: context upfg-modes How UPFG handles the two phases
UPFG, the Shuttle's guidance from the last lesson, was built for exactly this. It models each remaining burn phase as either constant thrust or constant acceleration, predicts when the switch will happen, and adds up the time and velocity of each piece — the same arithmetic as the two-part $t_{go}$ formula in this lesson. The thrust profile below is what it plans for:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="296" y2="30" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="296,30 304,42 312,52 319,62 327,70 335,78"/>
  <line x1="296" y1="25" x2="296" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
  <text x="34" y="82" font-size="11" text-anchor="end" fill="#1f2a44">57%</text>
  <line x1="37" y1="78" x2="43" y2="78" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">phase one: full thrust</text>
  <text x="290" y="110" font-size="11" text-anchor="end" fill="#b4232c">phase two: hold 4 g</text>
  <text x="296" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">323.7 s</text>
  <text x="340" y="156" font-size="11" text-anchor="end" fill="#1f2a44">373 s</text>
  <text x="40" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
</svg>
```

Thrust (as a percent of full) against time for this lesson's stage 2 burned to empty: flat for 323.7 s, then an exponential slide to 56.7% at 373.1 s.
:::
