---
id: l04-powered-explicit-guidance
title: Powered Explicit Guidance and UPFG
minutes: 21
covers:
  - Powered Explicit Guidance and Unified Powered Flight Guidance; why explicit guidance needs no reference trajectory
---

The previous lesson solved an idealized problem exactly: flat Earth, uniform gravity, no drag, a prescribed thrust profile, and a target velocity known in advance. A real ascent has none of those luxuries fixed in place — gravity varies with altitude, the vehicle's actual state at any moment is never quite what a preflight plan assumed, and an engine can fail. Powered Explicit Guidance, PEG, is what a real flight computer runs instead: it takes the linear tangent law's *structure* and turns it into an algorithm that re-derives its own answer from scratch, from the vehicle's actual measured state, every few seconds, for as long as the burn continues. This lesson builds that algorithm, runs it on a real two-stage ascent to orbit, and shows — with numbers, not just an argument — why re-converging every cycle is what makes it work at all.

## What "explicit" means, and what it buys

Two philosophies exist for powered-flight guidance. A **reference-tracking** scheme stores a precomputed trajectory — position and velocity as functions of time, built offline — and steers to null the difference between where the vehicle is and where the stored trajectory says it should be. An **explicit** scheme stores no trajectory at all. Every cycle, it looks at the vehicle's actual current state, looks at the terminal conditions it is trying to reach, and solves a boundary-value problem — closed form or nearly so — for the steering that connects the two, from *here*, *now*, however "here" and "now" turn out to differ from any plan.

The difference sounds abstract until something goes wrong. A reference-tracking scheme, after an engine failure, has nothing sensible left to track: the stored trajectory assumed a thrust history that no longer exists, and the position/velocity error it is nulling is now measuring the gap to a plan that is no longer achievable, not the gap to a good decision. An explicit scheme does not notice anything happened, in one specific and valuable sense — it sees a different mass, a different thrust, a different current state, and it re-solves the *same* boundary-value problem it always solves, because that problem never referenced a stored trajectory in the first place. This module returns to engine-out behavior in full once the algorithm is built; the point to take now is that the robustness is not a special case bolted onto PEG — it falls straight out of what "explicit" means.

::: key
What makes PEG explicit: it computes steering directly from the current state and the desired terminal conditions each cycle, with no stored reference trajectory anywhere in the loop. That is exactly why it handles engine-out and large dispersions without special-case logic — there is no reference to have fallen off of.
:::

## The PEG cycle

Each guidance cycle repeats three steps, using the vehicle's actual measured state at the start of the cycle.

**Time-to-go.** Estimate how much longer the burn needs to run from the velocity still required. With $\tau = m/\dot m$ the time it would take to burn the entire remaining vehicle at the current mass-flow rate, and $\Delta v$ the magnitude of velocity-to-be-gained, the rocket equation inverts to

$$
t_{go} = \tau\left(1 - e^{-\Delta v/v_e}\right).
$$

This is the standard PEG time-to-go estimate, and its shape matters: for small $\Delta v/v_e$ it is nearly linear in $\Delta v$, but as $\Delta v$ approaches what the remaining propellant can deliver, $t_{go}$ grows steeply — the estimate is naturally insensitive when tanks are nearly full and highly sensitive when they are nearly dry, which is exactly the regime where sensitivity is wanted.

**Steering.** Using that $t_{go}$ and the local gravitational acceleration at the current position, solve the previous lesson's two-parameter linear tangent problem — $\tan\beta(t) = A + Bt$ — for the $(A,B)$ that reach the required terminal velocity from the current state, exactly as before, only now "the current state" is whatever the vehicle actually measures, not a stored value.

**Command and repeat.** Command the resulting pitch angle, hold it for one guidance cycle, then repeat the whole process from the new true state.

::: key
Time-to-go: with $\tau = m/\dot m$, $t_{go} = \tau\left(1 - e^{-\Delta v_{\text{required}}/v_e}\right)$ — the standard PEG estimate, inverted from the rocket equation.
:::

## A real ascent, guided in closed loop

Take the two-stage vehicle from the first lesson of this module through staging: stage 1's gravity turn ends at $t = 151.5\ \mathrm{s}$, $h = 60.4\ \mathrm{km}$, with velocity components $v_r = 758.6\ \mathrm{m/s}$ (radial) and $v_t = 3527.5\ \mathrm{m/s}$ (tangential) — comfortably past max-Q, dynamic pressure already down to about a thousandth of a kilopascal. From here stage 2 ignites — a single 934 kN, 348 s $I_{sp}$ engine on 112.4 t of stage and payload — and PEG takes over, targeting a 400 km circular orbit: terminal radius $r_{\text{target}}$, terminal tangential speed $v_{\text{circ}}(r_{\text{target}}) = 7668.56\ \mathrm{m/s}$, terminal radial rate zero.

::: example Convergence, cycle by cycle
Running the cycle above every 5 seconds, the steering coefficients and time-to-go evolve as:

| $t$ (s) | $A$ | $B$ | $t_{go}$ (s) | pitch (deg) | vehicle mass (kg) |
| --- | --- | --- | --- | --- | --- |
| 0 | 6.4124 | $-0.020982$ | 354.09 | 81.14 | 112,400 |
| 5 | 6.1671 | $-0.020578$ | 348.36 | 80.79 | 111,032 |
| 65 | 3.8277 | $-0.016647$ | 280.80 | 75.36 | 94,611 |
| 200 | (steering continues to evolve smoothly through the middle of the burn) | | | | |
| 300 | $-0.7240$ | $0.017853$ | 39.58 | $-35.90$ | 30,295 |

$t_{go}$ falls steadily and close to linearly with elapsed time — it is not a fixed countdown timer, but the *outcome* of re-solving the same problem from a state that is, each cycle, a little closer to the target. By $t = 343.3\ \mathrm{s}$ the cycle reports $t_{go}$ effectively zero and cuts the engine off. The vehicle arrives at $400.000\ \mathrm{km}$ altitude (0.25 m off target), with a tangential speed 0.36 m/s from the exact circular value and a residual radial rate of 2.40 m/s — insertion errors small enough to be well within any real orbit-determination noise floor — having used 93,943 kg of the 98,900 kg of stage-2 propellant loaded, leaving 4957 kg, about 5.0%, as reserve.
:::

That reserve is not incidental — it is the margin this module draws on repeatedly from here on, whenever something about the flight goes wrong.

## Why it converges

The mechanism is worth stating precisely, because "it keeps trying until it works" undersells it. Each cycle's steering solve uses a *local* approximation — constant gravity, flat space, over the remaining $t_{go}$ — exactly the assumption the previous lesson showed is exact only for uniform gravity and drops in accuracy as the arc it is applied over gets longer or higher. Early in the burn, $t_{go}$ is large (354 s) and the local approximation is at its worst; but the algorithm does not commit to that approximation for the whole burn, only for the next few seconds of it, after which it re-linearizes about the vehicle's *actual* new position, velocity and local gravity. The approximation error shrinks with $t_{go}$ because the arc it is being asked to be accurate over shrinks with $t_{go}$.

::: example What happens if you do not close the loop
Take the very first cycle's solved steering — $(A,B,t_{go}) = (6.4124,\, -0.020982,\, 354.09\ \mathrm{s})$ — and fly it open loop: commit to that pitch history for the entire burn, never re-solving. The local flat-gravity model that produced these numbers believes it will hit the target almost exactly, because that is what it was solved to do: tangential speed within 0.007 m/s, radial rate within 0.05 m/s, altitude gain within 1.6 km. Integrate the *true* nonlinear, curved-gravity equations of motion under that same fixed steering law for the same 354 s, and the vehicle actually arrives 163.8 km too high, 343.7 m/s short on tangential speed, and with 1238.7 m/s of residual radial velocity — nowhere near a circular orbit. The local model was not wrong about *itself*; it was wrong about how long its own assumptions stay valid. PEG never asks it to be right for 354 seconds. It asks it to be right for the next 5, discards the rest, and asks again.
:::

::: key
PEG converges because each cycle re-linearizes about the updated state and updated local gravity, so the predicted terminal error shrinks as $t_{go}$ shrinks — not because any single cycle's solution is trustworthy over the whole remaining burn.
:::

## Robustness to a dispersed start

Because nothing about the cycle above assumes the starting state matches a plan, PEG converges just as cleanly from a state stage 1 was never designed to hand off.

::: example Dispersed handoff states
Perturbing the stage-1 burnout state used above by $\pm 5\%$ in speed and $\pm 10\ \mathrm{km}$ in altitude, independently, and re-running the same cycle to the same 400 km target:

| dispersion | cycles | insertion error (radius) | insertion error (tangential speed) |
| --- | --- | --- | --- |
| none (nominal) | 83 | 0.25 m | $-0.36$ m/s |
| $+5\%$ speed, $+10\ \mathrm{km}$ | 81 | 0.87 m | $+4.23$ m/s |
| $-5\%$ speed, $-10\ \mathrm{km}$ | 84 | 0.09 m | $+5.24$ m/s |
| $+5\%$ speed, $-10\ \mathrm{km}$ | 83 | 2.19 m | $+5.38$ m/s |
| $-5\%$ speed, $+10\ \mathrm{km}$ | 84 | 0.08 m | $+4.65$ m/s |

Every case reaches the same orbit to within a few metres of radius and a few metres per second of speed — dispersions two orders of magnitude larger than the insertion error they produce — because each one re-solves from wherever it actually starts, not from where it was supposed to. Nothing about the algorithm needed to know a dispersion had occurred.
:::

A real dispersion is not always affordable, and the algorithm is honest about that too: each cycle also checks $t_{go}$ against how much burn time the remaining propellant can actually supply. If a shortfall makes the target genuinely unreachable, the check fails on the very first cycle it becomes true, cleanly and immediately — reducing usable stage-2 propellant by 5% in the case above turns the 400 km target unreachable at cycle zero, before a single second of the burn, rather than producing a slow, undetected drift toward an answer that never arrives. What guidance does next — degrade to a lower, reachable target rather than diverge — is this module's next major subject, once the vehicle-level contingency logic around it has been built.

## UPFG: the generalization

PEG as derived above handles one engine, one target, one continuous burn. Real missions are rarely that simple — a burn interrupted by a coast, a staging event partway through what is conceptually a single guided maneuver, a target that is not a circular parking orbit but an elliptical transfer with a specific flight-path angle at cutoff. **Unified Powered Flight Guidance**, developed by Tim Brand at the MIT Instrumentation (later Draper) Laboratory for the Space Shuttle, is PEG generalized to exactly this: the same underlying linear-tangent, re-converging structure, extended to carry state through multiple powered phases and stage separations, and to accept a broader terminal-constraint set than a single circular orbit's radius and speed. "Unified" names the design choice directly — rather than one algorithm for the atmospheric-adjacent phase and a different one for orbital insertion, or a different solver bolted on for each burn of a multi-burn mission, UPFG is a single formulation carried across all of them, re-initialized at each phase boundary with the terminal conditions that phase needs. The cycle-by-cycle mechanism — time-to-go from the rocket equation, a local linear-tangent solve, re-convergence every cycle — is the same mechanism this lesson just built; UPFG's contribution is architectural, not a different derivation.

::: warning
Do not read "explicit" as "solved once and remembered." Every cycle re-derives $(A,B,t_{go})$ from scratch from the current state; nothing from a previous cycle survives except as the starting guess that helps the numerical solve converge quickly. If a cycle is skipped or delayed, the next one that runs still produces a correct answer for the state it actually sees — there is no accumulated error from the missed cycle to correct for, because nothing was being accumulated.
:::

## Check yourself

::: check
Explain, in one or two sentences, why an engine failure is not a special case PEG's algorithm needs to detect and handle separately.
:::

::: answer
PEG's steering solve takes the vehicle's current mass, thrust and state as inputs every cycle and re-derives the steering from them; it never compares against a stored trajectory that assumed a particular thrust history. An engine failure changes the thrust and mass-flow inputs the very next cycle sees, and the same unmodified algorithm produces a correct answer for the vehicle it now has — longer $t_{go}$, a re-solved $(A,B)$ — without any dedicated failure-detection logic in the guidance law itself.
:::

::: check
Why does the time-to-go formula $t_{go} = \tau(1 - e^{-\Delta v/v_e})$ become very sensitive to $\Delta v$ specifically when propellant is nearly exhausted, rather than uniformly sensitive throughout the burn?
:::

::: answer
As $\Delta v$ approaches the vehicle's remaining ideal delta-v capability ($v_e \ln(m/m_{\text{dry}})$), the exponential $e^{-\Delta v/v_e}$ falls toward the value corresponding to burning essentially all remaining propellant, and $\tau = m/\dot m$ is itself shrinking as mass depletes. Small changes in the required $\Delta v$ near that limit correspond to a large fractional change in how much of the dwindling propellant supply is needed, so $t_{go}$'s sensitivity grows sharply — which is exactly the regime (close to running out) where a guidance system most needs to notice a shortfall quickly.
:::

::: check
The open-loop demonstration in this lesson showed a 163.8 km altitude error after flying the first cycle's steering law for the whole burn without re-solving. The local flat-gravity model that produced that steering law predicted an altitude gain accurate to under 2 km. Reconcile these two facts.
:::

::: answer
The local model's own prediction is self-consistent — given its assumptions (flat space, constant gravity equal to the value at the starting point), it correctly computes what its own equations of motion produce, and that computation is accurate to a couple of kilometres out of roughly 340 km of altitude gain. The 163.8 km error appears only when the *same steering law* is applied to the *true* dynamics, where gravity is not constant (it weakens with altitude, exactly the effect a flat-gravity model cannot represent) and space is not flat. The model is an accurate solver of the wrong problem over that long an arc; it is not wrong about its own mathematics.
:::

::: check
In the dispersed-handoff table, the $+5\%$ speed / $-10\ \mathrm{km}$ altitude case shows the largest radius insertion error (2.19 m) of the four cases, still tiny in absolute terms. Why would you expect a bigger reserve-consumption difference between the dispersed cases than a difference in final insertion accuracy?
:::

::: answer
Insertion accuracy is what PEG is explicitly solving for every cycle — it is the thing being driven to zero, so it stays small and comparable across dispersions almost by construction, down to numerical-solver tolerance. Reserve is not a controlled quantity in the same sense: it is whatever propellant happens to be left once the terminal conditions are met, and how much that is depends on how much *extra* work (climbing further, or building more speed) the dispersion created for guidance to do. A dispersion toward "needs more energy" (faster and lower, or slower and higher, depending on which costs more given the specific trajectory geometry) consumes more of the margin even while the insertion itself still comes out accurate to a few metres.
:::

::: check
A colleague argues UPFG must be a fundamentally different algorithm from PEG because it handles multiple stages and coast phases that PEG, as derived in this lesson, does not. Evaluate that claim.
:::

::: answer
The claim overstates the difference. UPFG's cycle-by-cycle mechanism — a rocket-equation time-to-go estimate, a local linear-tangent steering solve, re-convergence from the true state every cycle — is the same mechanism this lesson derived for PEG. What UPFG adds is the bookkeeping to carry that mechanism across stage separations and coast arcs and to accept a richer terminal-constraint set, re-initializing the same underlying solve at each phase boundary rather than switching to a different algorithm. It is a generalization of PEG's structure, not a replacement for it — which is exactly what "Unified" in the name is pointing at.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Explicit guidance | steering computed from current state and terminal target each cycle; no stored reference trajectory |
| $t_{go} = \tau(1 - e^{-\Delta v/v_e})$, $\tau = m/\dot m$ | PEG's rocket-equation time-to-go estimate |
| PEG cycle | (1) estimate $t_{go}$, (2) solve local linear-tangent $(A,B)$, (3) command, hold one cycle, repeat |
| Convergence mechanism | re-linearization every cycle about the true state; error shrinks as $t_{go}$ shrinks |
| Worked nominal insertion | 83 cycles, 0.25 m radius error, $-0.36$ m/s tangential error, 5.0% propellant reserve |
| Dispersed handoff ($\pm5\%v$, $\pm10$ km) | all four cases insert within a few metres and a few m/s, in 81–84 cycles |
| Open-loop-for-the-whole-burn failure mode | same first-cycle steering, flown without re-solving: 163.8 km, 343.7 m/s, 1238.7 m/s off target |
| Unreachable-target check | $t_{go}$ compared against remaining-propellant burn time every cycle; a shortfall is caught immediately |
| UPFG | PEG generalized across multiple powered phases, staging and a broader terminal-constraint set (Tim Brand, Draper Laboratory, Space Shuttle) |

The next two lessons take the pieces this lesson left open on purpose: what the throttle is doing while PEG steers, and how the very first flown explicit guidance — Saturn V's Iterative Guidance Mode — solved this same problem a decade earlier.
