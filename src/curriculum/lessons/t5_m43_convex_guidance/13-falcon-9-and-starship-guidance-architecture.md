---
id: l13-falcon9-starship-architecture
title: Where this flies — Falcon 9 and Starship
minutes: 23
covers:
  - How all of this maps onto a Falcon 9 entry burn / aero phase / landing burn architecture, and onto Starship landing
---

Think about getting home from a city far away. You take a plane, then a train, then you ride a bike the last kilometer. Each leg is a different problem. On the plane you choose nothing. On the train you only pick the right stop. On the bike you steer every meter, dodge every pothole, and brake to stop exactly at your door. Nobody would plan the whole trip with bike-riding skills, or the last kilometer with an airline timetable.

A rocket booster flying itself home is the same kind of trip, cut into legs. Each leg is a different guidance problem, and only some of them are the problem this module solved.

Twelve lessons built one continuous argument. State the non-convex powered-descent problem honestly. Remove every non-convexity that can be removed *exactly*. Handle what is left with an iterative method that is honest about its limits. And never claim a number the module could not compute. This closing lesson lays that architecture over two real vehicles, a Falcon 9 booster and a Starship, and says plainly which parts are **public record**, which are this module's own **inference** (a reasoned conclusion, not a documented fact), and which are not known outside the company that flies them.

## A Falcon 9 booster's return, leg by leg

After **stage separation** — the moment the first stage lets go of the second stage and its payload — a returning Falcon 9 first stage flies a sequence of distinct phases. The sequence is public: SpaceX shows it, phase by phase, on its launch webcasts. What is not public is the detailed guidance algorithm behind each phase.

- **Boostback burn** (optional). Some of the engines relight to reverse much of the stage's downrange speed. It is used when the booster flies back to a landing zone near the launch site. When it lands instead on a **[[drone ship|drone-ship]]** far out at sea, it can skip this burn.
- **Entry burn.** Three engines relight high in the atmosphere — around $70\,\mathrm{km}$ on typical missions, by public accounts — to shed speed before the thick air. This cuts the peak heating and the peak **[[dynamic pressure|dynamic-pressure]]** (the air's push, $\tfrac12\rho_{\text{air}} v^2$) that the stage would otherwise meet.
- **Aerodynamic phase.** The engines are off. Four **[[grid fins|grid-fins]]**, unfolded during the coast after stage separation, steer the falling stage, trimming its path against wind and scatter the way a glider's control surfaces would.
- **Landing burn.** In the last tens of seconds, usually the single center engine relights and brings the stage to a soft touchdown. Some missions use three engines for part of it.

::: key The phases of a Falcon-class booster return
Boostback (optional, for return to the launch site), an entry burn to cut the peak heating and dynamic pressure, an unpowered aerodynamic phase steered by grid fins, then the landing burn under optimization-based guidance. Different phases, different guidance problems.
:::

### Which leg is this module's problem

Read the module backward onto that list. One leg matches it almost exactly; the others belong to neighboring modules.

The **landing burn** is powered. Aerodynamic force is small compared with thrust. There is a definite target and a real minimum-fuel or minimum-miss objective. The engine cannot throttle to zero. That is the problem lesson 1 opened with, and the one lessons 2 to 6 solved: lossless convexification of the thrust bound, the change of variables, the mass bounds, glideslope and pointing cones, and G-FOLD's two-stage law.

The **entry burn** is also powered and thrust-bounded, but it adds heating and aerodynamic-load constraints this module never modeled. That puts it closer to the general transcription machinery of the trajectory optimization module and the entry work of the EDL module.

The **aerodynamic phase** is not a thrust-bounded problem at all. No engine is burning. It belongs to atmospheric flight and entry, descent and landing, not to anything derived here.

::: example Why the landing burn, specifically, is this module's problem
Take the landing burn at face value: a vehicle high above the pad, touchdown at zero altitude and zero speed, an engine that burns propellant and cannot throttle below a floor, gravity, and a target. Write down what the guidance must choose and what limits it.

**Unknowns:** the thrust vector at each moment.

**Limits:** a thrust size between $\rho_{\min}$ and $\rho_{\max}$ (read "rho min" and "rho max"); mass falling as propellant burns; position and velocity fixed at both ends.

**Objective:** least propellant, or least miss distance.

That is, without qualification, the minimum-fuel powered-descent problem of lesson 1, which lesson 2's slack variable $\Gamma$ turned convex.

**Contrast.** In the aerodynamic phase just before, the grid fins make force from airspeed and attitude, not from propellant. There is no thrust bound to relax, no mass to deplete, and nothing for the central theorem to say. The boundary between "this module's territory" and "someone else's" is not an altitude. It is whether an engine burning propellant against a hard minimum-throttle floor is the thing being optimized.
:::

::: example How late the landing burn can start
Here is why the thrust floor matters so much on a booster. The numbers are round assumptions, not SpaceX data. One Merlin engine gives about $845\,\mathrm{kN}$ at sea level (a ninth of the $7607\,\mathrm{kN}$ SpaceX lists for the whole first stage). Take the returning stage at $30\,000\,\mathrm{kg}$, falling at $250\,\mathrm{m/s}$.

**Net deceleration at full thrust.** Thrust over mass, minus gravity:

$$
a = \frac{845\,000\,\mathrm{N}}{30\,000\,\mathrm{kg}} - 9.81\,\mathrm{m/s^2} = 28.2 - 9.81 \approx 18.4\,\mathrm{m/s^2}.
$$

**Stopping distance.** From $v^2 = 2ad$, the height needed to stop is

$$
d = \frac{v^2}{2a} = \frac{250^2}{2 \times 18.4} \approx 1700\,\mathrm{m}.
$$

**Burn time.** $t = v/a = 250/18.4 \approx 13.6\,\mathrm{s}$.

**Sanity check.** With a mass of $25\,000$ to $35\,000\,\mathrm{kg}$ instead, the stopping height runs from about $1.3$ to $2.2\,\mathrm{km}$: a burn that starts a kilometer or two up and lasts well under half a minute. And because a nearly empty stage is light, even one engine throttled down pushes harder than the stage weighs — the booster has been widely described as unable to **[[hover|hoverslam]]**. So the thrust magnitude can never drop toward zero, the lower bound $\rho_{\min}$ is always in play, and the timing of ignition is part of the optimization. That is exactly the annulus of lesson 2.
:::

### What is public about the algorithm

In a 2016 article, Lars Blackmore, who led SpaceX's rocket-landing work, wrote that SpaceX uses **[[CVXGEN|cvxgen]]** — a Stanford tool that writes custom C code for solving small convex optimization problems — to generate flight code for very fast onboard convex optimization during Falcon 9 landings. Stanford Electrical Engineering reported in 2021 that CVXGEN helps guide Falcon 9 landings. So "the landing burn runs onboard convex optimization" is public record.

What is *not* public is the problem itself: its variables, constraints, costs, how often it is re-solved, and how it hands off to the attitude controller. CVXGEN produces solvers for **quadratic programs**, a class narrower than the SOCPs of this module. So the problem that flies is presumably posed differently in its details from the SOCP derived here. That last sentence is inference, and it is labeled as such.

## Starship: where the second half of this module earns its keep

A Falcon 9 landing burn is close to upright the whole way down. That is why this module's first half — the exactly convex 3-DoF formulation — maps onto it so directly. Starship's return does not offer that convenience.

The upper stage falls most of the way in a **[[belly-flop|belly-flop]]**: engines off, lying broadside to the airflow. Picture a skydiver falling flat, arms out, versus diving head-first. Flat is much slower, because far more body meets the air. Starship does the same, trading a controlled, high-drag attitude for propellant saved later. Four flaps, two near the nose and two near the tail, steer it.

Then, low over the pad, engines relight and the vehicle performs the **[[flip|flip]]**: it swings from lying flat to standing on its engines, using engine gimbal and the flaps together, and lands on a short burn. On the 2020–2021 high-altitude prototype flights (SN8 to SN15), the relight came at roughly $500\,\mathrm{m}$ altitude, by public accounts; SN15 landed intact in May 2021. Later full-scale flight tests have repeated the flip and landing burn over the ocean.

::: example The angle, not the altitude, is what changes the mathematics
Lesson 10's landing began tilted $6°$ and ended upright. A belly-flop-to-vertical flip swings through about $90°$ — fifteen times the angle ($90/6 = 15$).

Now use lesson 10's own model of the thrust direction, linearized about upright: with thrust acceleration $\sigma = 5.0\,\mathrm{m/s^2}$ and tilt $\theta$, the true thrust arrow is $(\sigma\sin\theta,\ \sigma\cos\theta)$ and the linear model gives $(2\sigma\sin\tfrac{\theta}{2},\ \sigma)$ (sideways part first, upward part second).

**At $6°$:** true $(0.523, 4.973)$, linear $(0.523, 5.000)$. Error about $0.027\,\mathrm{m/s^2}$.

**At $90°$:** true $(5.000, 0.000)$ — all sideways, no lift at all. Linear $(7.071, 5.000)$. The error is

$$
\sqrt{(7.071 - 5.000)^2 + (5.000 - 0.000)^2} = \sqrt{2.071^2 + 5.000^2} \approx 5.41\,\mathrm{m/s^2}.
$$

**Compare.** $5.41 / 0.027 \approx 200$ times the $6°$ error — and larger than the whole thrust acceleration $\sigma$. The square law from lesson 7 would have predicted $15^2 = 225$ times; far from the reference even that stops being exact, but the verdict is the same.

**Sanity check.** A single linearization about upright is useless across a flip; it even claims the engine still holds the vehicle up when it points sideways. Only a loop that re-linearizes about each new reference and trusts small steps — successive convexification — can cross that span. The altitude where the flip happens is a detail. The angle it spans is why the flip is successive convexification's problem and not lossless convexification's.
:::

In this module's vocabulary, the flip is the regime SCvx exists for. A rotation matrix couples thrust direction to attitude over a wide range of angles. The quaternion kinematics are bilinear everywhere, not only near a reference. And no exact convex rewrite is on offer the way the thrust bound had one. Lesson 10's solve — a modest tilt and rate, with a trust region that had to shrink before a step was trusted — was a small, honestly scaled version of the same kind of problem a flip poses at much larger angles and with much less margin for the loop to be slow.

::: key Which half of this module answers which phase
A near-vertical, powered, thrust-bounded descent to a target — a Falcon 9 landing burn, or a Starship's final approach after its flip — is 3-DoF convex territory: lossless convexification, exact and checkable, no outer iteration. A large-angle reorientation with thrust direction coupled to attitude — a Starship flip, or any powered phase where the vehicle cannot be treated as pointing roughly where it is going — is successive-convexification territory: iterative, not globally certified, and only as trustworthy as the virtual-control, trust-region and true-dynamics checks built lesson by lesson.
:::

::: warning Keep three kinds of statement apart
**Public record:** the phase sequence and its rough altitudes and engine counts (from SpaceX webcasts and presentations, and reporting on them); Blackmore's statement that Falcon 9 landings use onboard convex optimization with CVXGEN-generated code; the published academic lineage — Açıkmeşe and Ploen's lossless convexification, G-FOLD and its onboard flights on Xombie in 2013, and the SCvx papers with free final time and state-triggered constraints.

**This module's inference:** the mapping of phases onto mathematics — that a near-vertical powered descent is the kind of problem lossless convexification solves exactly, and a large-angle reorientation the kind successive convexification was built for. That is a claim about the *mathematics* of each phase, defensible from its physics.

**Not public:** the actual formulation flying on Falcon 9, and anything about the guidance algorithm Starship flies. Nobody should read this lesson as saying "Starship uses SCvx". Blackmore, a co-author of G-FOLD, went on to lead landing work at SpaceX, and the phases line up cleanly with the mathematics. That is the strongest honest statement available, and it stops there.
:::

## The module, looked back on

Four honesty checks ran through every lesson of this module.

- **Every relaxation carried a proof of when it loses nothing,** not an assertion — the thrust bound's tightness theorem, checked to solver precision on a real trajectory, and the pointing constraint's extension of the same argument, checked with a cone that really binds.
- **Every approximation carried a measured error** — the mass-bound Taylor expansions, checked node by node against the exact exponential on a solved burn.
- **Every iterative method carried an explicit account of what it does not guarantee** — no global-optimality certificate for SCvx, convergence proofs (SCvx's and GuSTO's) that reach only a stationary point with no bound on passes, and a real 6-DoF run that rejected two bad steps and exposed a large true-dynamics error behind a step with near-zero virtual control.
- **Every timing claim was computed, not assumed** — flop counts, KKT sizes, and the teaching solver's real, very uneven wall-clock times, reported as they were instead of replaced with a flight number nobody here measured.

That is what a landing-guidance design review, or an interview for one, is really testing. Not a collection of impressive facts about rockets, but the ability to say of any guidance claim how much of it is proven, how much is measured, and how much is still open — and never to let the three quietly swap places.

## Check yourself

::: check
A colleague argues that because Starship's flip is dramatic and Falcon 9's landing burn is comparatively gentle, the flip must need "more advanced" mathematics. Restate the claim in terms this module actually supports.
:::

::: answer
"More advanced" is the wrong axis. The defensible version is narrower: the flip needs successive convexification because it is a large-angle reorientation with thrust direction coupled to attitude through a nonlinear rotation, which this module showed has no exact convex rewrite the way the thrust annulus did.

A Falcon 9 landing burn is not simpler in some vague sense. It is *exactly* convex, solvable with a global-optimality certificate no iterative method provides. By lesson 1's certification argument, that makes it the *more* trustworthy of the two to fly. The axis this module established is "does or does not admit an exact convex reformulation".
:::

::: check
Why does this lesson insist that the phase-by-phase mapping is "this module's own inference", instead of presenting it as fact?
:::

::: answer
Because the mapping is a claim about which kind of mathematics *fits* each publicly observed phase, argued from its physics — powered or unpowered, small angle or large angle. It is not a claim about what any vehicle's flight software computes. Those two statements have different evidence behind them.

The certification argument throughout this module depended on keeping that kind of distinction visible, instead of letting a plausible inference harden into an asserted fact that nobody has checked. Keeping it costs nothing, and it stops the lesson from claiming knowledge it does not have.
:::

::: check
Someone reads only this lesson and concludes: "The module showed that Falcon 9 and Starship use lossless convexification and SCvx." Point to the overreach.
:::

::: answer
Two overreaches, stacked.

First, it reports specific flight software as settled fact. What is public is narrower: Falcon 9 landings use onboard convex optimization with CVXGEN-generated code, and the formulation is not published. For Starship, nothing about the algorithm is public. The accurate claim is that the published mathematics this module derived maps cleanly onto the phases these vehicles are *observed* to fly.

Second, it lumps the two vehicles into one claim. The whole point of the mapping is that their hardest regimes differ: Falcon 9's landing burn sits in exactly convex territory, while Starship's flip sits in iterative territory. Even the careful version of the claim is not the same sentence for both vehicles.
:::

::: check
Using the landing-burn estimate's method, suppose a booster of $30\,000\,\mathrm{kg}$ lights three engines of $845\,\mathrm{kN}$ each, falling at $250\,\mathrm{m/s}$. Roughly how high must the burn start, and why might a vehicle choose this over a single engine?
:::

::: answer
Net deceleration: $3 \times 845\,000 / 30\,000 - 9.81 = 84.5 - 9.81 \approx 74.7\,\mathrm{m/s^2}$, about $7.6$ times Earth's gravity. Stopping height: $250^2 / (2 \times 74.7) \approx 418\,\mathrm{m}$. Burn time: $250 / 74.7 \approx 3.3\,\mathrm{s}$.

The burn is much shorter, so less propellant goes into holding the vehicle up against gravity (the gravity loss of lesson 6). The price is harsher deceleration and far less time to correct errors, because the floor on thrust is now three times higher. In this module's terms, $\rho_{\min}$ went up, the annulus got thicker, and the set of reachable landings from a given state shrank. That is a trade the guidance has to live inside, not a free lunch.
:::

::: check
Which leg of a Falcon 9 return would you hand to G-FOLD's two-stage solve, and what would you do in the aerodynamic phase instead?
:::

::: answer
The landing burn. It is powered, thrust-bounded between $\rho_{\min}$ and $\rho_{\max}$, close to upright, and aimed at a target — exactly the problem G-FOLD's minimum-landing-error stage and minimum-fuel stage solve, both as SOCPs.

The aerodynamic phase has no thrust at all, so there is no thrust bound to convexify and no propellant to minimize. Its guidance steers with grid fins using aerodynamic force, which depends on airspeed, air density and attitude. That is a different model and a different problem, handled by the entry and atmospheric-flight methods of other modules, not by lossless convexification.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Falcon 9 phases | Boostback (optional) $\to$ entry burn (three engines, around $70\,\mathrm{km}$ by public accounts) $\to$ aerodynamic phase (grid fins, unpowered) $\to$ landing burn (usually the center engine, the last tens of seconds) |
| This module's territory | The landing burn: powered, thrust-bounded, near-vertical — lossless convexification's exact regime |
| Not this module's territory | Entry-burn heating and loads (trajectory optimization and EDL); the unpowered aero phase (no thrust bound at all) |
| Landing-burn estimate | Stopping height $d = v^2/2a$; about $1.7\,\mathrm{km}$ and $14\,\mathrm{s}$ for assumed round numbers; the booster cannot hover, so $\rho_{\min}$ always matters |
| Starship's descent | Belly-flop (unpowered, broadside, flaps) $\to$ flip (engines relight; about $500\,\mathrm{m}$ on the 2020–2021 prototype flights) $\to$ short powered vertical landing |
| Why the flip needs SCvx | A $90°$ swing: the upright linearization's error is about $200$ times its $6°$ value and larger than $\sigma$ itself |
| Public | Phase sequence and rough numbers; onboard convex optimization with CVXGEN code on Falcon 9 landings; the academic lineage and the Xombie flights |
| Not public | The formulation flying on Falcon 9; anything about Starship's guidance algorithm |
| Four honesty checks | Relaxations proved tight; approximations measured; iterative methods' limits stated; timing computed |

This module began by asking why a convex reformulation of powered descent is worth the trouble. Thirteen lessons of exact theorems, measured approximations, a real 6-DoF solve and its honest failures later, the answer is the one lesson 1 promised: convex optimization is the one formulation of this problem a flight computer can be certified against before it ever sees the ground it has to land on. That also closes this tier's guidance sequence. Tier 6 opens with [[Real-Time & Embedded Systems|tier-six]], which picks up exactly where lesson 12's solve-time budget stopped: how to measure a worst-case execution time and prove a task meets its deadline every single cycle.

::: context drone-ship A landing pad that floats
SpaceX calls its ocean landing platforms **autonomous spaceport drone ships**. They are barges roughly the size of a football field, held on station hundreds of kilometers downrange by their own thrusters. A booster that does not carry enough spare propellant to fly all the way back lands on one instead. Skipping the boostback burn saves that propellant, which is why the heaviest payloads almost always mean a drone-ship landing. The ships carry names from Iain M. Banks's science-fiction novels, such as *Of Course I Still Love You*.
:::

::: context dynamic-pressure The push of the air
Dynamic pressure is $q = \tfrac12\rho_{\text{air}} v^2$: half the air density times the speed squared, in pascals. It sets how hard the air pushes on the vehicle and scales the aerodynamic forces and loads. Because speed is squared, halving the speed quarters it. That is why a burn that removes a large part of the stage's speed *before* the air gets thick cuts the peak load and heating so sharply. (The subscript on $\rho_{\text{air}}$ keeps it apart from the thrust bounds $\rho_{\min}$ and $\rho_{\max}$.)
:::

::: context grid-fins Steering a falling tube
A grid fin is a frame filled with a lattice of small open cells, like a waffle or a window screen, instead of one flat plate. Air flows through the cells, so the fin gives strong control force at high speed while staying small and folding flat against the stage on the way up. Falcon 9 carries four near its top. Rotating them tilts the aerodynamic force and steers the falling stage.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="120" height="100" fill="#ffffff" stroke="#1f2a44" stroke-width="3"/>
  <line x1="70" y1="20" x2="70" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="20" x2="100" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="130" y1="20" x2="130" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="45" x2="160" y2="45" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="70" x2="160" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="95" x2="160" y2="95" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="85" y="120" width="30" height="14" fill="#6c7a93"/>
  <text x="180" y="50" font-size="12" fill="#1f2a44">outer frame</text>
  <text x="180" y="75" font-size="12" fill="#1d6fd1">lattice: air flows</text>
  <text x="180" y="92" font-size="12" fill="#1d6fd1">through the cells</text>
  <text x="180" y="130" font-size="12" fill="#6c7a93">hinge to the stage</text>
</svg>
```
:::

::: context hoverslam Why a light booster cannot hover
To hover, thrust must equal weight. A nearly empty Falcon 9 stage is so light that even one engine at its lowest setting pushes harder than the stage weighs, so any lit engine makes it slow down and eventually climb. The landing burn therefore has to be timed so the speed reaches zero at the same moment the height does — a maneuver enthusiasts nicknamed the "hoverslam" or "suicide burn". Too early and it stops in mid-air with nowhere to go but up; too late and it hits hard. The thrust floor $\rho_{\min}$ is the whole reason.
:::

::: context cvxgen A solver written by a program
CVXGEN was built by Jacob Mattingley and Stephen Boyd at Stanford and published in 2012. You describe a family of small convex quadratic programs once, in a high-level language; it writes a flat, fixed-size C solver for that family, with no memory requests at run time and a predictable number of operations — the qualities lesson 12 listed for flight code. Its speed comes from knowing the problem's shape in advance, so only the numbers change between solves.
:::

::: context belly-flop Falling flat on purpose
Starship's upper stage is about $9\,\mathrm{m}$ across and about $50\,\mathrm{m}$ long. Broadside, it shows the air about $9 \times 50 = 450\,\mathrm{m^2}$; nose-first or tail-first, only its circular end, about $\pi \times 4.5^2 \approx 64\,\mathrm{m^2}$ — roughly a seventh as much. More area means more drag at the same speed, so the terminal speed falling flat is much lower, and less propellant is needed to stop at the bottom. The flaps keep it stable and steer it while it falls.
:::

::: context flip From lying down to standing up
The flip swings the vehicle through about a right angle in a few seconds, low over the pad, while the relit engines take over from the air as the main source of force. Its guidance couples attitude, thrust direction and position all at once, which is the 6-DoF problem of lesson 10 at its widest angles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="90" height="18" rx="9" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="20" y="20" font-size="11" fill="#1f2a44">belly-flop: flat, engines off</text>
  <rect x="150" y="45" width="70" height="18" rx="9" fill="#8fb8f0" stroke="#1f2a44" transform="rotate(-45 185 54)"/>
  <text x="150" y="105" font-size="11" fill="#1f2a44">flip</text>
  <rect x="283" y="40" width="18" height="90" rx="9" fill="#8fb8f0" stroke="#1f2a44"/>
  <path d="M 286 130 L 292 150 L 298 130 Z" fill="#f2b880"/>
  <text x="250" y="165" font-size="11" fill="#1f2a44">upright, landing burn</text>
  <path d="M 115 40 Q 150 30 160 70" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M 225 60 Q 260 60 275 85" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="115" y="140" font-size="11" fill="#6c7a93">about 90 degrees in all</text>
</svg>
```
:::

::: context tier-six What comes next, and why
Lesson 12 ended with a budget: a solve that must finish, worst case, inside a re-plan cycle. Tier 6 turns that into a discipline. Real-Time & Embedded Systems teaches how to measure worst-case execution time rather than average time, how schedulers decide which task runs, and why flight code bans dynamic memory and unbounded loops. Later Tier 6 modules build the 6-DoF simulation and the Monte Carlo verification campaigns this module kept pointing to as the evidence behind an iteration cap.
:::
