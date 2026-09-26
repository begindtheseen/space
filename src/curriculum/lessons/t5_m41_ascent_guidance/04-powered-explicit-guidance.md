---
id: l04-powered-explicit-guidance
title: Powered Explicit Guidance and UPFG
minutes: 26
covers:
  - Powered Explicit Guidance and Unified Powered Flight Guidance; why explicit guidance needs no reference trajectory
---

There are two ways to drive to a friend's house. You can print a list of turns before you leave — perfect, until a road is closed, and then useless, because every turn assumes you are somewhere you are not. Or you can use a phone map that **[[recalculates|gps-recalc]]**. It keeps no stored route. Every few seconds it looks at where you are *now* and where you want to go, and works out the best way from here. Take a wrong turn and it answers the same question again from your new spot.

Rocket guidance faces the same choice, and the phone map won. **Powered Explicit Guidance**, or **PEG**, is the phone map of an ascent. Every few seconds it takes the rocket's measured position, velocity and mass, takes the target orbit, and solves for the steering that joins them.

The last lesson solved an idealized problem exactly: flat Earth, uniform gravity, no air, and the linear tangent law $\tan\beta = A + Bt$. A real ascent is messier. Gravity weakens with height and turns as the Earth curves away. The rocket is never quite where the plan said. An engine can fail. PEG keeps the law's *shape* and re-solves it from the true state again and again. The Space Shuttle flew it, and NASA's Space Launch System flies a descendant today. This lesson builds it, flies it, and shows with numbers why re-solving every cycle is the whole trick.

## Two ways to steer

A **reference-tracking** scheme — one that follows a stored plan — keeps a trajectory worked out before launch: position and velocity as functions of time. In flight it steers to close the gap between where the rocket is and where the plan says it should be. That is the printed list of turns.

An **explicit** scheme — one that computes its answer straight from the goal — stores no trajectory. Every cycle it looks at the rocket's actual state and at the **terminal conditions**, the numbers the rocket must have at engine cutoff (a radius, a speed, a direction of motion). Then it solves a **boundary-value problem** — a problem with one condition at the start and one at the end — for the steering that joins them, from *here* and *now*.

The difference shows when something goes wrong. Suppose an engine fails. The stored plan assumed a thrust that no longer exists, so a reference-tracking scheme is now chasing an impossible plan. An explicit scheme sees a different mass, thrust and state, and solves the *same* problem it always solves. That problem never mentioned a stored trajectory, so there is nothing to fall off of. The engine-out lesson later in this module works this out in full. The robustness is not a feature added to PEG; it comes free with the word "explicit".

::: key What makes PEG explicit
PEG computes steering directly from the current state and the desired terminal conditions each cycle, with no stored reference trajectory anywhere in the loop. That is exactly why it handles engine-out and large **[[dispersions|dispersion-word]]** without special logic — there is no reference to have fallen off of.
:::

## How much burn is left: time-to-go

Before PEG can steer, it needs one number: how many more seconds the engine must run. That is **time-to-go**, written $t_{go}$ and read "t go".

Picture filling a bathtub by bucket, where each trip gets easier. How long it takes depends on how much water is still needed *and* how fast you can work. For a rocket, "how much" is $\Delta v$ ("delta v"), the velocity the engine still has to supply. "How fast" is set by the thrust and the mass.

Two vehicle numbers set the scale:

- $v_e$ ("v sub e"), the **exhaust velocity**: how fast the gas leaves the nozzle. It equals $I_{sp}\,g_0$, the specific impulse times $9.80665\ \mathrm{m/s^2}$.
- $\tau$ ("tau"), the **[[burn-everything time|tau-meaning]]**: how long the engine would take to burn the *entire* current mass at its current flow rate. With $m$ the mass and $\dot m$ ("m dot") the flow in kg/s, $\tau = m/\dot m$.

The rule is

$$
t_{go} = \tau\left(1 - e^{-\Delta v/v_e}\right).
$$

Read it as "the fraction of the rocket you must burn, times the time to burn all of it" — the bracket is that fraction, as the note below shows.

The flashcards write $\tau$ another way. Thrust is $T = \dot m\, v_e$, so the current acceleration is $a_0 = T/m = \dot m\, v_e/m$, and flipping it gives $v_e/a_0 = m/\dot m = \tau$.

::: key Time-to-go from the rocket equation
With exhaust velocity $v_e$, initial acceleration $a_0$ and $\tau = v_e/a_0$ (which equals $m/\dot m$), $t_{go} = \tau\left(1 - e^{-\Delta v_{\text{required}}/v_e}\right)$. This is the standard PEG time-to-go estimate, inverted from the rocket equation.
:::

::: note Why it has to be true
Start from the rocket equation. Burning from mass $m$ down to mass $m_f$ gives $\Delta v = v_e \ln(m/m_f)$.

Undo the logarithm to find the mass left at cutoff: divide by $v_e$ and raise $e$ to both sides, so $m_f = m\,e^{-\Delta v/v_e}$.

The mass burned is $m - m_f = m\left(1 - e^{-\Delta v/v_e}\right)$. The part in brackets is the fraction of the current rocket that must be burned.

At a constant flow $\dot m$, burning that mass takes

$$
t_{go} = \frac{m - m_f}{\dot m} = \frac{m}{\dot m}\left(1 - e^{-\Delta v/v_e}\right) = \tau\left(1 - e^{-\Delta v/v_e}\right).
$$

The one assumption is constant thrust and flow for the rest of the burn. The next lesson meets a burn where that is false.
:::

::: example Time-to-go at stage-2 ignition
This module's stage 2 has one $934\ \mathrm{kN}$ engine with $I_{sp} = 348\ \mathrm{s}$, and weighs $112{,}400\ \mathrm{kg}$ at ignition (stage, propellant and payload together).

**Exhaust velocity:** $v_e = 348 \times 9.80665 = 3412.71\ \mathrm{m/s}$.

**Flow:** $\dot m = T/v_e = 934{,}000 / 3412.71 = 273.68\ \mathrm{kg/s}$.

**Acceleration and $\tau$:** $a_0 = 934{,}000/112{,}400 = 8.310\ \mathrm{m/s^2}$, so $\tau = v_e/a_0 = 3412.71/8.310 = 410.69\ \mathrm{s}$. Check the other way: $m/\dot m = 112{,}400/273.68 = 410.69\ \mathrm{s}$. Same number.

**Time-to-go for $\Delta v = 2000\ \mathrm{m/s}$:**

$$
t_{go} = 410.69\left(1 - e^{-2000/3412.71}\right) = 410.69 \times (1 - 0.5565) = 182.13\ \mathrm{s}.
$$

**Sanity check.** The mass at cutoff is $112{,}400 \times 0.5565 = 62{,}553\ \mathrm{kg}$. Burning the difference, $49{,}847\ \mathrm{kg}$, at $273.68\ \mathrm{kg/s}$ takes $182.1\ \mathrm{s}$. The two routes agree.
:::

How touchy is $t_{go}$ to an error in $\Delta v$? Take the slope of the formula. It comes out beautifully simple:

$$
\frac{d t_{go}}{d\,\Delta v} = \frac{\tau}{v_e}\, e^{-\Delta v/v_e} = \frac{1}{a_f},
$$

where $a_f$ is the thrust acceleration at cutoff. In the example, $a_f = 934{,}000/62{,}553 = 14.93\ \mathrm{m/s^2}$, so each extra $10\ \mathrm{m/s}$ adds $0.67\ \mathrm{s}$. The curve bends *over* as $\Delta v$ grows, because the lighter rocket gains speed faster. Time-to-go does not get twitchier as the tanks empty.

::: note Why the slope is one over the final acceleration
The derivative of $-e^{-\Delta v/v_e}$ is $+\frac{1}{v_e}e^{-\Delta v/v_e}$, so the slope is $\frac{\tau}{v_e}e^{-\Delta v/v_e}$. Use $\tau = m/\dot m$ and $m\,e^{-\Delta v/v_e} = m_f$: the slope is $\frac{m_f}{\dot m\, v_e} = \frac{m_f}{T} = \frac{1}{a_f}$. Without algebra: the last bit of velocity is added at the end of the burn, where the acceleration is $a_f$, and there each metre per second takes $1/a_f$ seconds.
:::

::: warning The Δv in the formula is not only the velocity gap
The gap between the velocity you have and the one you want is too small. The engine must also pay the gravity and steering losses of the last lesson. At stage-2 ignition here, the velocity gap to a 400 km circular orbit is $4210\ \mathrm{m/s}$, but the first PEG cycle below finds the engine must supply about $6763\ \mathrm{m/s}$. Real PEG estimates the losses every cycle. Leave them out and $t_{go}$ comes out $63\ \mathrm{s}$ too short.
:::

## The PEG cycle

Each guidance cycle repeats three steps, always starting from the rocket's actual measured state.

1. **Time-to-go.** Estimate how much longer the burn must run, from the velocity still to be gained, with the formula above.
2. **Steering.** Using that $t_{go}$ and the gravity at the current position, solve last lesson's shooting problem: find $(A, B)$ in $\tan\beta(t) = A + Bt$ that reach the required terminal velocity and radius — starting from whatever state the rocket actually measures.
3. **Command and repeat.** Point the engine at the resulting pitch angle, fly for one guidance cycle, then start again from the new true state.

In the flight below, steps 1 and 2 are solved together: $A$, $B$ and $t_{go}$ are three unknowns, and the terminal speed, radial speed and radius are three conditions. That is the same thing as finding the full $\Delta v$, losses included, and feeding it to the time-to-go formula.

## A real ascent, guided in closed loop

Take this module's two-stage rocket. Stage 1 burns out at $t = 151.5\ \mathrm{s}$ and $60.4\ \mathrm{km}$, moving $758.6\ \mathrm{m/s}$ upward (the **radial** speed, $v_r$) and $3527.5\ \mathrm{m/s}$ sideways (the **tangential** speed, $v_t$). Dynamic pressure is down to about $1.4\ \mathrm{kPa}$, 3% of its peak. Stage 2 lights, and PEG takes over.

The target is a 400 km circular orbit: terminal radius $r_{\text{target}}$ = Earth's radius plus 400 km, terminal tangential speed equal to the circular speed there, $v_{\text{circ}} = \sqrt{\mu/r_{\text{target}}} = 7668.56\ \mathrm{m/s}$, and terminal radial speed zero.

::: example Convergence, cycle by cycle
Run the cycle every $5\ \mathrm{s}$, and every $1\ \mathrm{s}$ once $t_{go}$ drops below $20\ \mathrm{s}$ (the steering changes fastest near the end). Time $t$ is counted from stage-2 ignition, and pitch is measured from the local horizontal.

| $t$ (s) | $A$ | $B$ (1/s) | $t_{go}$ (s) | pitch $\arctan A$ (deg) | mass (kg) |
| --- | --- | --- | --- | --- | --- |
| 0 | 6.4114 | $-0.020979$ | 354.08 | 81.13 | 112,400 |
| 5 | 6.1662 | $-0.020575$ | 348.35 | 80.79 | 111,032 |
| 65 | 3.8271 | $-0.016645$ | 280.79 | 75.36 | 94,611 |
| 200 | 0.7961 | $-0.010311$ | 136.85 | 38.52 | 57,664 |
| 300 | $-0.7241$ | $0.017865$ | 39.57 | $-35.91$ | 30,295 |

**Read the $t_{go}$ column.** It falls by about 5.7 s for every 5 s of flight at first, then close to 5 s per 5 s. It is not a countdown clock; it is the *result* of re-solving from a state a little closer to the target each cycle.

**Cutoff.** At $t = 343.3\ \mathrm{s}$, after 84 cycles, $t_{go}$ reaches zero and the engine shuts down. The rocket is at $400.000\ \mathrm{km}$, $0.30\ \mathrm{m}$ below target. Its tangential speed is $1.43\ \mathrm{m/s}$ above circular, and $2.42\ \mathrm{m/s}$ of radial speed is left over. Those errors are tiny next to a speed of $7.7\ \mathrm{km/s}$ — a few parts in ten thousand.

**Propellant.** It used $93{,}957\ \mathrm{kg}$ of the $98{,}900\ \mathrm{kg}$ loaded, leaving $4943\ \mathrm{kg}$, or $5.0\%$, as reserve.

**Sanity check.** Full tanks could give $v_e\ln(112{,}400/13{,}500) = 7233\ \mathrm{m/s}$ in $361.4\ \mathrm{s}$. The flight took $343.3\ \mathrm{s}$, about 95% of that, matching the 5% reserve.
:::

Notice the [[pitch column|steep-then-down]]. The rocket starts pointing $81^\circ$ up and by $315\ \mathrm{s}$ points $39^\circ$ *below* the horizon. At first its thrust is only $0.85$ of its weight and it has $340\ \mathrm{km}$ to climb, so it must aim high. Later it is climbing fast and must arrive with zero radial speed, so it points below the horizon to brake the climb while the forward part of the push keeps adding orbital speed.

That 5% reserve is the margin this module draws on whenever something goes wrong.

## Why re-solving works

Each cycle's steering solve uses a *local* model: flat ground, gravity constant in size and direction, over the whole remaining $t_{go}$. That model gets worse the longer and higher the arc it must cover, so early in the burn, with $t_{go} = 354\ \mathrm{s}$, it is at its worst. But PEG trusts it only for the next five seconds. Then it throws the rest away and builds a fresh local model around the rocket's *actual* new position, velocity and gravity. As $t_{go}$ shrinks, the arc the model must describe shrinks, so the model's error shrinks too. Engineers call this a **[[receding horizon|receding-horizon]]**: plan to the end, act on the first step, plan again.

::: example What happens if you do not close the loop
Take the first cycle's solution, $(A, B, t_{go}) = (6.4114,\ -0.020979,\ 354.08\ \mathrm{s})$, and fly it **open loop** — never re-solving. Point the thrust exactly as the flat model planned, in the fixed axes it laid down at ignition, for all $354\ \mathrm{s}$.

**What the flat model predicts.** Its own equations say the rocket arrives exactly on target. The solver's leftover error is below $10^{-9}$ in relative terms — nothing but rounding.

**What really happens.** Integrate the true equations — gravity that weakens with height and always points at Earth's center — under that same steering. The rocket ends $194.8\ \mathrm{km}$ too high, $546\ \mathrm{m/s}$ short of the circular speed, and still climbing at $1841\ \mathrm{m/s}$. That is nowhere near an orbit.

**Why so far off?** Over $354\ \mathrm{s}$ the rocket travels thousands of kilometres downrange. The Earth curves away beneath it, so "straight ahead" in the fixed axes slowly turns into "upward", and gravity weakens with height. The flat model knows about neither. It was not wrong about itself; it was wrong about how long its assumptions stay true. PEG never asks it to be right for 354 seconds — only for the next five.
:::

::: key How PEG converges
PEG converges because each cycle re-linearizes about the updated state and updated local gravity, so the predicted terminal error shrinks as $t_{go}$ shrinks — not because any single cycle's solution is trustworthy over the whole remaining burn.
:::

Real PEG improves on this stripped-down version: it averages gravity over the remaining arc and includes the "falling around the Earth" effect of the curved path, so each cycle's model is better. Flight software also lets it run a few cycles before using its commands, and checks that $t_{go}$ and the steering have settled — it is monitored for convergence before it is trusted.

## Dispersed starts and unreachable targets

Nothing in the cycle assumes the starting state matches a plan, so PEG works just as well from a state stage 1 was never meant to hand over.

::: example Dispersed handoff states
Change the stage-1 burnout state by $\pm 5\%$ in speed (about $\pm 180\ \mathrm{m/s}$) and $\pm 10\ \mathrm{km}$ in altitude, and fly the same cycle to the same 400 km target:

| dispersion | cycles | radius error | tangential speed error | radial speed left | reserve |
| --- | --- | --- | --- | --- | --- |
| none | 84 | $-0.30$ m | $+1.43$ m/s | $2.42$ m/s | 5.0% |
| $+5\%$ speed, $+10$ km | 81 | $0.93$ m | $-1.38$ m/s | $-3.93$ m/s | 7.1% |
| $-5\%$ speed, $-10$ km | 87 | $1.32$ m | $-1.78$ m/s | $13.55$ m/s | 3.0% |
| $+5\%$ speed, $-10$ km | 85 | $1.04$ m | $-3.66$ m/s | $5.77$ m/s | 5.8% |
| $-5\%$ speed, $+10$ km | 87 | $-0.51$ m | $+5.66$ m/s | $1.56$ m/s | 4.2% |

**Accuracy.** Every case reaches the orbit within about a metre and a half of radius and within about $14\ \mathrm{m/s}$ of speed. The dispersions in were about $180\ \mathrm{m/s}$ and $10{,}000\ \mathrm{m}$. The errors out are one to four orders of magnitude smaller.

**Reserve.** The reserve is where the dispersions show. Starting slower and lower costs the most: only 3.0% is left. Starting faster and higher saves propellant: 7.1% is left.
:::

Some dispersions cannot be paid for. Each cycle PEG compares $t_{go}$ with the burn time the remaining propellant can actually supply, $(m - m_{\text{dry}})/\dot m$. If the target needs more, the check fails on the very cycle it becomes true. Load 5% less usable propellant in the flight above: the burn time available is $0.95 \times 98{,}900/273.68 = 343.3\ \mathrm{s}$, while the first cycle asks for $354.1\ \mathrm{s}$. The check trips at cycle zero, before the burn begins — no slow, silent drift toward an answer that never comes. What guidance does next — [[drop to a lower orbit it can reach|fallback-bridge]] — is a later lesson of this module.

## UPFG: the generalization

PEG as built here handles one engine, one target and one continuous burn. Real missions are messier: a burn split by a coast, a staging event in the middle of one guided climb, a target that is an elliptical transfer orbit rather than a circle.

**Unified Powered Flight Guidance**, **UPFG**, is PEG grown up to handle all of that. It was the Space Shuttle's ascent guidance, developed by Tim Brand and colleagues at [[Draper Laboratory|draper-lab]]. It keeps the same core — time-to-go from the rocket equation, a local linear-tangent solve, a fresh solve every cycle — and adds the bookkeeping to carry it across powered phases and stage separations, plus a richer set of terminal targets. "Unified" names the design choice: one formulation for every burn, restarted at each phase boundary with the terminal conditions that phase needs. Its contribution is the architecture, not a new derivation.

::: key UPFG
Unified Powered Flight Guidance, the Space Shuttle ascent algorithm (Tim Brand, Draper Laboratory): PEG generalized to multiple phases, staging, and a variety of terminal targets.
:::

::: warning Explicit does not mean "solved once and remembered"
Every cycle re-derives $(A, B, t_{go})$ from scratch. Nothing from an earlier cycle survives except as the [[starting guess|warm-start]] that helps the solver finish quickly. If a cycle is skipped or late, the next one still gives a correct answer for the state it sees; nothing was being built up, so there is no built-up error to fix.
:::

## Check yourself

::: check
In one or two sentences, explain why an engine failure is not a special case that PEG's algorithm must detect and handle separately.
:::

::: answer
PEG derives the steering every cycle from the rocket's current mass, thrust and state, never from a stored trajectory that assumed a particular thrust. An engine failure changes the inputs the next cycle sees, and the same unchanged algorithm gives a correct answer for the rocket it now has — a longer $t_{go}$ and a re-solved $(A, B)$ — with no failure-detection logic in the guidance law.
:::

::: check
Differentiate $t_{go} = \tau(1 - e^{-\Delta v/v_e})$ with respect to $\Delta v$. Does an error in the required $\Delta v$ cause a *larger* time-to-go error late in a burn than early? If not, what about running low on propellant does guidance still need to notice quickly? Use a stage with $m_{\text{dry}} = 10{,}000\ \mathrm{kg}$, $\dot m = 250\ \mathrm{kg/s}$ and $v_e = 3400\ \mathrm{m/s}$.
:::

::: answer
The slope is $\partial t_{go}/\partial\Delta v = (\tau/v_e)\,e^{-\Delta v/v_e} = 1/a_f$, one over the acceleration at cutoff. It *falls* as $\Delta v$ grows — the opposite of the hunch that everything gets twitchier late in a burn.

Push it one step further. Suppose the requirement exactly uses up what is left, $\Delta v = v_e\ln(m/m_{\text{dry}})$. Then $e^{-\Delta v/v_e} = m_{\text{dry}}/m$ and $\tau = m/\dot m$, and the two $m$'s cancel:

$$
\left.\frac{\partial t_{go}}{\partial\Delta v}\right|_{\Delta v = \Delta v_{\max}} = \frac{m_{\text{dry}}}{\dot m\,v_e} = \frac{10{,}000}{250 \times 3400} = 0.0118\ \mathrm{s\ per\ m/s}.
$$

That is a constant: the same one second into the burn as with five seconds of propellant left. Time-to-go is not the touchy quantity.

What grows is how much of your margin the error eats. Measure the burn as the fraction of the remaining propellant it uses. With $y = m_{\text{dry}}/m$, that fraction is $(1 - e^{-\Delta v/v_e})/(1 - y)$, and its slope at the same all-used-up point is $y/\big(v_e(1-y)\big)$. At $m = 100{,}000\ \mathrm{kg}$, $y = 0.1$ and the slope is $3.3 \times 10^{-5}$ per m/s. With $1250\ \mathrm{kg}$ of propellant left ($m = 11{,}250\ \mathrm{kg}$, $y = 0.889$) it is $2.4 \times 10^{-3}$ per m/s — 72 times larger. The same error costs the same few seconds throughout, but those seconds become a growing share of what is left. Watch the shrinking room to absorb the error, not the estimate.
:::

::: check
In the open-loop test, the flat model predicted it would hit the target to better than one part in a billion, yet the rocket ended $194.8\ \mathrm{km}$ too high. Explain how both can be true.
:::

::: answer
The flat model is self-consistent: given flat ground and gravity fixed at its starting value, its own equations really do reach the target. The $194.8\ \mathrm{km}$ error appears only when the *same steering* meets the *true* dynamics, where gravity weakens with height and turns to keep pointing at Earth's center, and the Earth curves away over thousands of kilometres. The model is an exact solver of the wrong problem over that long an arc — not wrong about its mathematics, only wrong to be trusted for 354 seconds.
:::

::: check
In the dispersed-handoff table, the insertion errors stay within a few metres and about $14\ \mathrm{m/s}$, but the reserve ranges from 3.0% to 7.1%. Why do dispersions show up much more in the reserve than in the insertion accuracy?
:::

::: answer
Insertion accuracy is what PEG drives to zero every cycle, so it stays small in every case almost by construction. Reserve is not controlled at all: it is whatever propellant is left once the terminal conditions are met, and that depends on how much *extra* work the dispersion created. Slower and lower needs more speed and more climb (3.0% left); faster and higher needs less (7.1% left). The orbit comes out the same; the bill is different.
:::

::: check
A colleague says UPFG must be a fundamentally different algorithm from PEG, because it handles several stages and coast phases that the PEG in this lesson does not. Is that right?
:::

::: answer
It overstates the difference. UPFG's cycle — a rocket-equation time-to-go, a local linear-tangent solve, a fresh solve from the true state every cycle — is the one this lesson built. UPFG adds the bookkeeping to carry it across stage separations and coasts, and a richer menu of terminal targets, restarting the same solve at each phase boundary instead of switching algorithms. It generalizes PEG rather than replacing it — which is what "Unified" points at.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| Explicit guidance | steer from the current state to the terminal target, every cycle | no stored reference trajectory |
| Reference tracking | follow a stored plan | useless once the plan becomes impossible |
| $\tau$ | burn-everything time | $\tau = m/\dot m = v_e/a_0$ |
| $t_{go}$ | time-to-go | $t_{go} = \tau(1 - e^{-\Delta v/v_e})$ |
| Sensitivity | extra seconds per extra m/s | $d t_{go}/d\Delta v = 1/a_f$ |
| PEG cycle | estimate $t_{go}$, solve $(A, B)$, fly one cycle, repeat | from the measured state each time |
| Convergence | receding horizon | local-model error shrinks as $t_{go}$ shrinks |
| Worked insertion | 84 cycles, cutoff at 343.3 s | $-0.30$ m, $+1.43$ m/s, $2.42$ m/s radial, 5.0% reserve |
| Open loop, same first solve | never re-solved | 194.8 km high, 546 m/s slow, 1841 m/s still climbing |
| Unreachable check | $t_{go}$ against $(m - m_{\text{dry}})/\dot m$ | trips on the first cycle it is true |
| UPFG | Shuttle ascent guidance (Tim Brand, Draper Laboratory) | PEG across phases, staging and many targets |

The next lesson takes the piece this one left open on purpose: what the throttle does while PEG steers. The flight above ended at more than 5 g, and real rockets are not allowed to do that. After it, lesson 6 shows how Saturn V's Iterative Guidance Mode solved this same problem with 1960s computers.

::: context gps-recalc A navigator with no stored route
A phone map app that says "recalculating" is doing explicit guidance. It does not try to steer you back onto the old route; it throws that route away and plans a new one from where you are. That is why a wrong turn costs you a minute, not the whole trip. A printed list of turns is reference tracking: perfect when everything goes to plan, and worthless after the first surprise. Rockets meet surprises — winds, a slightly weak engine, a failed engine — so ascent guidance above the atmosphere is built the phone-map way.
:::

::: context dispersion-word What a dispersion is
A **dispersion** is how far a real flight ends up from the planned one, because of all the small things nobody can control: a few percent more or less thrust, a slightly different wind, propellant loaded a little short. Engineers run thousands of simulated flights with random dispersions — a Monte Carlo analysis — and the cloud of results must stay inside the limits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">speed at staging</text>
  <text x="14" y="80" font-size="11" fill="#1f2a44" transform="rotate(-90 14 80)" text-anchor="middle">altitude</text>
  <ellipse cx="190" cy="78" rx="95" ry="45" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <g fill="#6c7a93">
    <circle cx="150" cy="70" r="3"/><circle cx="210" cy="95" r="3"/><circle cx="175" cy="60" r="3"/>
    <circle cx="230" cy="70" r="3"/><circle cx="160" cy="100" r="3"/><circle cx="205" cy="55" r="3"/>
    <circle cx="125" cy="85" r="3"/><circle cx="250" cy="88" r="3"/><circle cx="185" cy="105" r="3"/>
  </g>
  <circle cx="190" cy="78" r="5" fill="#b4232c"/>
  <text x="198" y="82" font-size="11" fill="#b4232c">plan</text>
  <text x="290" y="30" font-size="11" text-anchor="end" fill="#1d6fd1">spread of real flights</text>
</svg>
```
:::

::: context tau-meaning The time to burn the whole rocket
$\tau$ is not a real event — no rocket burns its own structure. It is a yardstick: the time the engine would take to swallow the entire current mass at today's flow rate. Time-to-go can approach it but never reach it, because reaching it would need infinite $\Delta v$. The curve below is $t_{go}$ against $\Delta v$ for this module's stage 2 ($\tau = 410.7\ \mathrm{s}$, $v_e = 3413\ \mathrm{m/s}$). It bends over: each extra metre per second costs fewer seconds than the last.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="336" y="24" font-size="11" text-anchor="end" fill="#6c7a93">τ = 410.7 s</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,150 86,120 122,97 158,80 194,67 230,58 266,51 302,45 338,42"/>
  <circle cx="122" cy="97" r="4" fill="#b4232c"/>
  <text x="130" y="112" font-size="11" fill="#b4232c">2000 m/s → 182 s</text>
  <text x="195" y="170" font-size="11" text-anchor="middle" fill="#1f2a44">Δv (0 to 8000 m/s)</text>
  <text x="44" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="58" y="45" font-size="11" fill="#1f2a44">t go</text>
</svg>
```
:::

::: context steep-then-down Why stage 2 climbs steeply, then points down
Stage 2 starts with thrust smaller than its weight (0.85 g), 340 km below its target. If it pointed along the horizon it would sink. So it aims high. By the middle of the burn it is climbing at about $1400\ \mathrm{m/s}$ with the engine still pushing ever harder, so late in the burn it points below the horizon to brake the climb, while the forward part of its push keeps adding orbital speed. The pitch history of the worked flight:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="45" y1="15" x2="45" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="42" y1="22" x2="48" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="42" y1="139" x2="48" y2="139" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="104" font-size="11" text-anchor="end" fill="#1f2a44">0°</text>
  <text x="40" y="26" font-size="11" text-anchor="end" fill="#1f2a44">90°</text>
  <text x="40" y="143" font-size="11" text-anchor="end" fill="#1f2a44">−45°</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="45,30 66,31 87,33 108,36 129,39 150,43 171,48 192,56 214,67 235,81 256,99 277,118 298,131 310,134 319,130 323,126 327,116 330,106 332,96 333,78"/>
  <circle cx="310" cy="134" r="4" fill="#b4232c"/>
  <text x="192" y="170" font-size="11" text-anchor="middle" fill="#1f2a44">time since stage-2 ignition (0 to 350 s)</text>
  <text x="80" y="22" font-size="11" fill="#1d6fd1">81° at ignition</text>
  <text x="300" y="146" font-size="11" text-anchor="end" fill="#b4232c">−39° at 315 s</text>
</svg>
```

The last few seconds swing back up as the solve fine-tunes the arrival.
:::

::: context receding-horizon Plan to the end, act on the first step
"Receding horizon" means the planning window always reaches the end of the problem, but only its first slice is used before planning again. A chess player does the same: think several moves ahead, play one, think again after the reply. In control engineering the general method is called **model predictive control**, and it now runs chemical plants, power grids and many robots. PEG is one of its oldest flying examples. The idea returns later in this course whenever a controller must respect limits it can see coming.
:::

::: context fallback-bridge When the orbit cannot be reached
An unreachable target does not mean the flight is lost. The flight software carries a menu of lower-energy fallback targets — a lower or more elliptical orbit that the payload can later fix with its own engine — and, for crewed flights, abort modes. Which one to pick depends on how much performance is left and when the problem happened. The engine-out lesson (lesson 8) builds that decision logic, and the abort-modes lesson (lesson 12) gives the Shuttle's named options.
:::

::: context draper-lab Where UPFG came from
The MIT Instrumentation Laboratory, founded by Charles Stark Draper, designed the Apollo guidance computer and its software. In 1973 it became the independent Charles Stark Draper Laboratory. Its engineers, Tim Brand among them, wrote the Shuttle's powered-flight guidance, which steered Shuttle ascents until the last launch in 2011. The same family of ideas lives on: NASA's Space Launch System uses a modified PEG for its ascent.
:::

::: context warm-start Why the old answer still helps
Newton's method needs a first guess, and a good guess makes it finish in two or three passes instead of ten. Five seconds after the last solve, the right $(A, B, t_{go})$ are almost the same as before — $t_{go}$ is about five seconds smaller. So the last answer is an excellent starting guess. That is the only thing carried from cycle to cycle. If it were lost, the solve would take a little longer but reach the same answer, because the answer depends only on the present state and the target.
:::
