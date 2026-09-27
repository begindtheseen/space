---
id: l08-tvc-allocation-and-engine-out
title: Thrust vector control allocation and engine-out contingency
minutes: 27
covers:
  - Thrust vector control allocation and engine-out contingency
---

Picture a rowing boat with four rowers, two on each side. Halfway across the lake, one rower on the left drops an oar. Two things happen, on two very different clocks.

The first happens *right now*. The right side is suddenly pulling harder than the left, so the boat starts to swing. Within a stroke or two, the others must change how they pull to keep the boat straight. The second problem is slower. With one rower gone, the boat is weaker, so the crossing will take longer. Somebody has to ask: at this pace, do we still reach the far dock before we are exhausted? Or should we head for a closer one?

A rocket with several engines faces exactly these two problems when one engine fails. Within a fraction of a second, the lost push at one spot on the tail creates a twist that nothing was making a moment ago. The **attitude control system** — the fast loop that swivels the engines to hold the rocket's orientation — has to cancel it using the engines that are still running. That is an **allocation** problem: sharing one job among several actuators. Over the next seconds to minutes, the rocket has less push than the mission was planned around. Guidance, and the **flight rules** behind it (the decisions written down before launch), must decide what that costs and whether the planned orbit is still reachable.

This lesson takes both in turn. It also finally puts numbers on the engine-out argument the PEG lesson made: explicit guidance needs no special case for a failure.

## The twist a missing engine creates

Take a first stage like the Falcon 9's: nine engines, **[[eight spaced evenly around a ring|ring-layout]]** of radius $R$ and one in the middle. For now, let every engine push straight back along the rocket's axis.

With all nine running, every ring engine has a partner directly across the ring. Each one's pull to one side cancels its partner's pull to the other. The net **moment** — the turning effect of a force, equal to force times its sideways distance from the pivot — is zero. The rocket goes straight. That is what this module has quietly assumed every time it wrote "the thrust" as one arrow along the rocket.

Now one ring engine dies. Its partner across the ring has nobody to balance it, and the rocket starts to swing.

Here is a neat way to find the size of the swing. The broken pattern is exactly the same as "all nine engines still firing" *plus* a pretend force at the dead engine's spot, equal to its thrust, pointing the opposite way (forward). Add that pretend force to the full pattern and the dead engine's thrust is cancelled — which is what really happened. The full pattern makes no moment. So the whole moment comes from the pretend force: size $T_{\text{eng}}$, at sideways distance $R$ from the centerline.

$$
M_{\text{fail}} = T_{\text{eng}}\, R .
$$

Read it "M fail equals T eng times R": the lost engine's thrust times its distance from the centerline. The unit is newton-metres, $\mathrm{N\cdot m}$. It is a pitch or yaw moment — the kind that swings the nose sideways — and it does not depend on how far the engines are from the **[[center of mass|center-of-mass]]** along the rocket, because the pretend force points along the axis.

::: key
A single missing engine on a symmetric ring produces a residual moment $M_{\text{fail}} = T_{\text{eng}} R$. It equals the moment of a pretend thrust the size of the lost engine's, placed at its old position and pointing the opposite way, because that is exactly what the loss removes from an otherwise self-cancelling pattern.
:::

::: example The size of the imbalance
Nine engines each give $845.2\ \mathrm{kN}$ at sea level, $7607\ \mathrm{kN}$ in all. The ring radius is $R = 1.5\ \mathrm{m}$. One outboard engine fails.

$$
M_{\text{fail}} = 845{,}200\ \mathrm{N} \times 1.5\ \mathrm{m} = 1{,}267{,}800\ \mathrm{N\cdot m} = 1267.8\ \mathrm{kN\cdot m}.
$$

It appears the instant the engine drops out, with nothing yet fighting it.

**Sanity check.** That is like a car's weight (about $13\ \mathrm{kN}$) hanging on the end of a $100\ \mathrm{m}$ pole. Enormous — but the remaining engines are enormous too, as the next section shows.
:::

## Cancelling it: tilting the engines

The engines that are still running cancel the twist by **[[gimbaling|gimbal]]** — tilting on a pivot so that their thrust points slightly off the rocket's axis. A tilted thrust has a small *sideways* part, $T_{\text{eng}}\sin\delta$, where $\delta$ (read "delta") is the tilt angle.

That sideways push acts at the tail, at the engine's pivot. Here is the crucial point: its lever arm is *not* the ring radius $R$. A sideways push at the tail turns the rocket about its center of mass, and the lever arm is the long distance $L$ from the center of mass down to the engines' pivot plane. For a launch vehicle, $L$ is tens of metres, while $R$ is a metre or two. That mismatch is what makes the fix cheap.

Spread the correction over $N$ engines, each tilted by the same $\delta$. Their combined moment is $N\,T_{\text{eng}}\sin\delta\,L$. Set it equal to the failure moment, $T_{\text{eng}}R$. The engine thrust cancels from both sides:

$$
N\,T_{\text{eng}}\sin\delta\,L = T_{\text{eng}}R
\quad\Longrightarrow\quad
\sin\delta = \frac{R}{N L}.
$$

Every engine you share the job with makes each tilt smaller.

A tilted engine also pushes a little less along the axis: $T_{\text{eng}}\cos\delta$ instead of $T_{\text{eng}}$. The fraction lost is $1 - \cos\delta$, the **cosine loss**.

::: example Concentrated correction versus spread correction
Take $R = 1.5\ \mathrm{m}$ and an illustrative $L = 25\ \mathrm{m}$. (In a real rocket $L$ changes through the flight as propellant burns and the center of mass moves, and the flight software tracks it.)

**One engine does all the work** ($N = 1$, the one across the ring from the failure): $\sin\delta = 1.5/25 = 0.06$, so $\delta = 3.44^\circ$.

**Two engines share it:** $\sin\delta = 1.5/50 = 0.03$, so $\delta = 1.72^\circ$.

**All seven remaining ring engines share it:** $\sin\delta = 1.5/175 = 0.00857$, so $\delta = 0.49^\circ$.

| engines used for correction | $\delta$ (gimbal angle) | axial thrust lost to $\cos\delta$ |
| --- | --- | --- |
| $N=1$ | $3.44^\circ$ | $0.180\%$ |
| $N=2$ | $1.72^\circ$ | $0.045\%$ |
| $N=7$ | $0.49^\circ$ | $0.0037\%$ |

One engine can manage $3.44^\circ$ comfortably, at a small but real cost in push. But that engine is left with less tilt to spare for everything else it is doing at the same time: steering, reacting to wind, damping sloshing propellant and the bending of the airframe. Seven engines need barely half a degree each, and each keeps almost all its margin.

**Sanity check.** Doubling $N$ halves the angle, and the cosine loss drops about four times ($0.180\% \to 0.045\%$), because for small angles $1 - \cos\delta \approx \delta^2/2$.

Real **[[control allocation|control-allocation]]** logic spreads the correction by default. It leans harder on one engine only when others have run out of tilt.
:::

One geometric point is worth making explicit. The center engine sits *on* the centerline, so $R = 0$ for it. Firing straight back, it makes no moment at all — its mere presence cannot balance a missing ring engine. But it gimbals like any other engine, and a sideways push at the tail works through the lever arm $L$, whether the engine is on the centerline or off it. Keep the two mechanisms apart: a *static* imbalance comes from *where* thrust acts (lever arm $R$); an *active* correction comes from *which way* thrust points (lever arm $L$).

::: warning
Do not treat allocation as solved once the moment is cancelled. Every degree of tilt spent on engine-out compensation is a degree not available a moment later for ordinary steering and load relief. A design that leaves too little margin after one failure has swapped one problem for a smaller, delayed version of the same problem — due the next time a gust arrives.
:::

Some vehicles take a blunter route: when one engine fails, they also shut down its partner across the ring, so the pattern stays balanced. The Soviet **[[N1 rocket|n1-kord]]** was designed that way. It trades more lost thrust for no steady imbalance at all.

## What the failure costs guidance

The control loop's job is done once the rocket is steady again, within a second or two. Guidance's problem comes after. Fewer engines means less thrust for the same mass, so the **thrust-to-weight ratio** is lower. Lesson 1 showed what that means: the rocket spends longer fighting gravity, and **gravity loss** — the speed gravity steals, $\int g\sin\gamma\,dt$ — grows.

Because PEG is explicit, nothing special has to happen in the guidance algorithm. Each cycle it reads the rocket's *actual* mass, thrust and mass flow. After a failure it sees smaller numbers, gets a longer time-to-go, and re-solves the same problem it always solves.

Recall the PEG time-to-go formula. Here $\tau$ (read "tau") is the time it would take to burn the *entire* current mass at the current flow rate:

$$
\tau = \frac{m}{\dot m} = \frac{v_e}{a_0}, \qquad t_{go} = \tau\left(1 - e^{-\Delta v/v_e}\right).
$$

Read $\dot m$ as "m dot", the mass flow in kilograms per second; $v_e$ is the exhaust speed and $a_0 = T/m$ is the current acceleration. The two forms of $\tau$ agree because thrust is $T = \dot m\,v_e$.

::: example What guidance sees after the failure
Imagine a guided stage with four identical engines. At some cycle it weighs $m = 85{,}000\ \mathrm{kg}$ and still needs $\Delta v = 5000\ \mathrm{m/s}$. Its exhaust speed is $v_e = 3412.7\ \mathrm{m/s}$ and all four engines together burn $\dot m = 273.7\ \mathrm{kg/s}$.

**Before the failure.** $\tau = 85{,}000/273.68 = 310.6\ \mathrm{s}$. The bracket is $1 - e^{-5000/3412.7} = 1 - e^{-1.465} = 0.769$. So $t_{go} = 310.6 \times 0.769 = 238.8\ \mathrm{s}$.

**One engine fails.** The mass flow drops to three quarters, $\dot m = 205.3\ \mathrm{kg/s}$. The exhaust speed is unchanged. Now $\tau = 85{,}000/205.26 = 414.1\ \mathrm{s}$, and $t_{go} = 414.1 \times 0.769 = 318.4\ \mathrm{s}$.

**What guidance does.** It burns about $80\ \mathrm{s}$ longer, on a gentler, flatter acceleration profile — speed builds more slowly, so the speed-versus-time line is less steep. And it re-solves its steering for the new time-to-go. No flag, no special branch: new inputs, same solve.

**Sanity check.** Three quarters of the flow means four thirds of the time: $238.8 \times 4/3 = 318.4\ \mathrm{s}$. The propellant is $273.68 \times 238.8 = 205.26 \times 318.4 = 65{,}360\ \mathrm{kg}$ either way.
:::

That last line is not a coincidence, and it is the heart of the matter.

::: note Why it has to be true
Multiply the time-to-go by the flow rate to get the propellant burned:

$$
\dot m\,t_{go} = \dot m \cdot \frac{m}{\dot m}\left(1 - e^{-\Delta v/v_e}\right) = m\left(1 - e^{-\Delta v/v_e}\right).
$$

The flow rate cancels. That is the rocket equation: the propellant needed for a given $\Delta v$ depends only on the mass and the exhaust speed, not on how fast you burn it. So losing an engine does not, by itself, cost propellant. What costs propellant is that a longer burn at lower thrust-to-weight lets gravity steal more along the way, which raises the $\Delta v$ actually needed. The price of a failure is paid in losses, and losses grow with time spent weak.
:::

::: key Engine-out behavior of explicit guidance
Recompute $t_{go}$ with the reduced thrust and mass flow, re-solve the steering, burn longer on a flatter profile. No special case in the algorithm — the work is in the reserve and fallback-target decision logic.
:::

::: example How much reserve a failure actually consumes
Now the real thing. Take the module's two-stage vehicle, whose first stage burns out at $t = 151.5\ \mathrm{s}$. Fail one of its nine first-stage engines at three different times. Stage 1 keeps flying its stored pitch program on eight engines, so it reaches staging later, lower and slower than planned. Then stage 2 is flown to the 400 km target by exactly the PEG cycle from lesson 4, unmodified. The nominal flight ends with $4956.8\ \mathrm{kg}$ of stage-2 **[[reserve|reserve]]** — propellant left over at insertion.

| engine-out time | fraction of stage-1 burn | stage-2 reserve remaining at insertion | reserve consumed vs. nominal |
| --- | --- | --- | --- |
| $t=90.9\ \mathrm{s}$ | 60% | 3876.4 kg | 1080.4 kg |
| $t=120.0\ \mathrm{s}$ | 79% | 4704.6 kg | 252.2 kg |
| $t=136.3\ \mathrm{s}$ | 90% | 4903.0 kg | 53.8 kg |

**Read the fractions.** $90.9/151.5 = 0.60$, $120.0/151.5 = 0.79$, $136.3/151.5 = 0.90$.

**Read the cost.** Reserve consumed is nominal minus remaining: $4956.8 - 3876.4 = 1080.4\ \mathrm{kg}$, and so on down the column.

**Compare.** $1080.4/53.8 \approx 20$. The same single-engine loss costs twenty times more at 60% of the burn than at 90%.

Insertion accuracy barely moves in any case — the radius error stays under a metre — because guidance closes the gap regardless. Reserve is what pays. An early failure leaves the rocket flying underpowered for much longer, fighting gravity with less push. Time spent degraded is the expensive part, not the failure itself.
:::

## When the reserve is not enough

A big enough problem eats more than the reserve can cover. Here explicit guidance earns its keep in the clearest way. Every cycle it knows how much burn time the target needs, and it can compare that with how much burn time the propellant still in the tanks can supply. A real shortfall shows up as soon as it exists — not as a surprise when the tanks run dry short of orbit.

::: example A shortfall that makes the planned orbit unreachable
The nominal flight to 400 km burns $93{,}943\ \mathrm{kg}$ of stage 2's $98{,}900\ \mathrm{kg}$, a burn of $93{,}943/273.68 = 343.3\ \mathrm{s}$.

**The fault.** Suppose a stuck valve leaves $7\%$ of the loaded propellant **[[unusable|unusable-propellant]]** — still in the tank as dead weight, but impossible to burn. That is $0.07 \times 98{,}900 = 6923\ \mathrm{kg}$.

**What is left.** Usable propellant is $98{,}900 - 6923 = 91{,}977\ \mathrm{kg}$. At $273.68\ \mathrm{kg/s}$ that is $336.1\ \mathrm{s}$ of burning.

**The verdict.** The target needs $343.3\ \mathrm{s}$; the tanks can give $336.1\ \mathrm{s}$. Short by $1966\ \mathrm{kg}$, about $7.2\ \mathrm{s}$. The 400 km orbit is unreachable, and guidance can say so before the burn even starts.

**What *is* reachable?** Runs of the same vehicle to lower circular targets show the burn shrinks by about $0.197\ \mathrm{s}$ — about $54\ \mathrm{kg}$ — for every kilometre lower. To save $1966\ \mathrm{kg}$ the target must drop by $1966/53.9 \approx 36\ \mathrm{km}$. So about $364\ \mathrm{km}$ is the edge.

**Pick a fallback with margin.** A $350\ \mathrm{km}$ target needs about $50 \times 53.9 = 2694\ \mathrm{kg}$ less than the nominal, so $93{,}943 - 2694 = 91{,}249\ \mathrm{kg}$. That leaves $91{,}977 - 91{,}249 = 728\ \mathrm{kg}$, about $2.7\ \mathrm{s}$ of burn, as a new reserve. Retargeted there, guidance converges exactly as cleanly as in every nominal case.

**Sanity check.** A 7% loss is bigger than the 5% nominal reserve ($4957/98{,}900 = 5.0\%$), so the planned orbit *should* fail — by about 2% of the load, which is the $1966\ \mathrm{kg}$ found above.
:::

::: warning
Trust the unreachable test more as the burn goes on. PEG's first-cycle estimate for the nominal flight was $t_{go} = 354.1\ \mathrm{s}$, while the burn actually took $343.3\ \mathrm{s}$ — the early estimate uses a flat-gravity picture over a very long arc and runs about 3% high. A shortfall far bigger than that is safe to call at once. A marginal one — say the tanks can supply $345\ \mathrm{s}$ against an early $354\ \mathrm{s}$ estimate — should be judged with care, because the estimate firms up as $t_{go}$ shrinks. Real flight software compares against margins set before launch, not against a single raw number.
:::

This is the decision real contingency logic makes, just outside the guidance algorithm:

1. Is the planned orbit still reachable with the reserve left? If yes, fly on.
2. If not, which **fallback orbit** — a lower, lower-energy target chosen before launch — is reachable with margin?
3. Is that fallback acceptable at all: for the payload, for crew safety, for the rest of the mission? If not, the answer is not a new target but an **abort**, the subject of lesson 12.

Real flights have lived through every branch of this list — including a **[[Falcon 9 flight in 2012|crs-1]]** that lost an engine and still delivered its main cargo. The guidance property that makes graceful degradation possible is the one this lesson has shown working end to end: explicit, re-converging every cycle, and honest about what it can no longer deliver the moment that becomes true.

## Check yourself

::: check
A vehicle has 12 outboard engines instead of 8, each producing 620 kN, on a ring of radius 1.8 m. One fails. Find the resulting moment.
:::

::: answer
$M_{\text{fail}} = T_{\text{eng}} R = 620{,}000 \times 1.8 = 1{,}116{,}000\ \mathrm{N\cdot m} = 1116\ \mathrm{kN\cdot m}$. The number of *other* engines does not appear: the moment depends only on the failed engine's own thrust and its distance from the centerline.
:::

::: check
Explain why a centerline engine's gimbal can still help cancel an engine-out moment, even though the centerline engine makes no moment when it fires straight back.
:::

::: answer
The two mechanisms use different lever arms. An untilted engine's share of a *static* ring imbalance depends on its sideways mounting offset $R$, which is zero on the centerline — so the center engine's presence alone does nothing for that imbalance. But a *gimbaled* engine's sideways thrust makes a moment through the distance $L$ from the center of mass to the gimbal plane, which is large and has nothing to do with $R$. So the center engine gimbals and helps with attitude control exactly like any other engine — through $L$, not through $R$.
:::

::: check
Using $\sin\delta = R/(NL)$, find the gimbal angle needed with $N = 4$ engines, $R = 1.5\ \mathrm{m}$ and $L = 25\ \mathrm{m}$. Compare its cosine loss with the $N = 7$ case in the lesson.
:::

::: answer
$\sin\delta = 1.5/(4 \times 25) = 0.015$, so $\delta = 0.8594^\circ$. The axial thrust lost is $1 - \cos\delta = 1 - 0.999888 = 0.0112\%$.

That is more than the $N = 7$ case's $0.0037\%$ — fewer engines share the job, so each tilts further. It is far less than the $N = 1$ case's $0.180\%$. This fits the small-angle rule: cosine loss falls roughly as $1/N^2$.
:::

::: check
Two engine-out cases lose the same single engine, one at 60% of the way through stage 1 and one at 90%. Insertion accuracy is nearly identical. Explain, using gravity loss, why reserve consumption is not.
:::

::: answer
Guidance is explicit, so it closes the gap to the target however it got into the degraded state. That is why insertion accuracy stays about the same.

Reserve consumption tracks how long the rocket flew with reduced thrust-to-weight. A failure at 60% leaves far more of the ascent to fly underpowered than a failure at 90%. Every extra second at lower thrust-to-weight is another second of $g\sin\gamma$ gravity loss, the loss lesson 1 measured. That loss is paid from the same propellant that would otherwise have become reserve. So the earlier failure costs much more — about twenty times more in the worked table — even when the final orbit looks identical.
:::

::: check
A guidance cycle reports that the targeted orbit is unreachable. What two questions must the contingency logic still answer before it retargets?
:::

::: answer
**First:** does a *lower* stable orbit exist that the remaining propellant can reach? Guidance's "unreachable" flag says the current target cannot be met, not that nothing can be. Searching lower targets, as the worked example did, is a separate step.

**Second:** is that lower orbit acceptable for the mission at all? Payload needs, crew safety or the vehicle's survival may rule out an orbit that is reachable. In that case the decision is not a new guidance target but an abort — the subject of lesson 12.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $M_{\text{fail}} = T_{\text{eng}} R$ | moment from one missing ring engine; 1267.8 kN·m for 845.2 kN at $R = 1.5$ m |
| $\sin\delta = R/(NL)$ | gimbal angle to cancel $M_{\text{fail}}$ using $N$ engines, lever arm $L$ from the center of mass |
| Center engine | $R = 0$: no static moment when firing straight back, but gimbals normally through $L$ |
| Concentrated vs. spread | $N=1$: $3.44^\circ$, 0.180% axial loss; $N=7$: $0.49^\circ$, 0.0037% |
| $\tau = m/\dot m = v_e/a_0$, $t_{go} = \tau(1 - e^{-\Delta v/v_e})$ | time-to-go; losing a quarter of the flow stretches it by 4/3 |
| Explicit guidance's role | no special case; re-solves from actual thrust and mass every cycle, burns longer |
| Reserve cost of engine-out | about 1080 kg at 60% of the stage-1 burn vs. 54 kg at 90% — time spent weak is what costs |
| Unreachable-target check | burn time needed vs. burn time the usable propellant can give; 7% unusable makes 400 km unreachable, about 350 km is a safe fallback |

The next lesson turns to a disturbance guidance never sees directly: the load-relief control law that runs through max-Q. It asks what that law leaves behind, and what it costs the exoatmospheric guidance that inherits it.

::: context ring-layout Nine engines seen from below
Looking up at the tail, the eight ring engines sit $45^\circ$ apart, each with a partner directly across the ring, and the ninth sits on the centerline. Knock out one ring engine and its partner is left unbalanced.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="85" r="68" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="90" cy="85" r="13" fill="#1d6fd1"/>
  <circle cx="140" cy="85" r="13" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="131" y1="76" x2="149" y2="94" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="149" y1="76" x2="131" y2="94" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="125.4" cy="120.4" r="13" fill="#1d6fd1"/>
  <circle cx="90" cy="135" r="13" fill="#1d6fd1"/>
  <circle cx="54.6" cy="120.4" r="13" fill="#1d6fd1"/>
  <circle cx="40" cy="85" r="13" fill="#1d6fd1"/>
  <circle cx="54.6" cy="49.6" r="13" fill="#1d6fd1"/>
  <circle cx="90" cy="35" r="13" fill="#1d6fd1"/>
  <circle cx="125.4" cy="49.6" r="13" fill="#1d6fd1"/>
  <line x1="90" y1="85" x2="140" y2="85" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="112" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">R</text>
  <text x="180" y="60" font-size="12" fill="#1f2a44">8 on a ring + 1 center</text>
  <text x="180" y="82" font-size="12" fill="#b4232c">one ring engine out:</text>
  <text x="180" y="100" font-size="12" fill="#b4232c">moment T·R until</text>
  <text x="180" y="118" font-size="12" fill="#b4232c">the others gimbal</text>
</svg>
```

The dashed line is the ring radius $R$ from the centerline to the failed engine.
:::

::: context center-of-mass The balance point
The center of mass is the point where the rocket would balance on a fingertip. Any force whose line passes through it pushes the rocket along without turning it. A force whose line misses it also turns the rocket, and the turning effect is the force times how far the line misses. As a rocket burns propellant from its tanks, this balance point slides along the body, so every lever arm measured from it changes during flight.
:::

::: context gimbal How a rocket engine steers
A rocket engine is mounted on a gimbal, a pivot that lets the whole engine tilt a few degrees, pushed by hydraulic or electric actuators. Tilting by $\delta$ splits the thrust into a big part along the rocket, $T\cos\delta$, and a small sideways part, $T\sin\delta$, which turns the rocket about its center of mass through the lever arm $L$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="80" width="230" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="290,80 330,98 290,116" fill="#1f2a44"/>
  <circle cx="200" cy="98" r="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">center of mass</text>
  <line x1="60" y1="98" x2="200" y2="98" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="130" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">L</text>
  <circle cx="60" cy="98" r="3" fill="#1f2a44"/>
  <line x1="60" y1="98" x2="160" y2="136" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="160,136 147,137 151,127" fill="#b4232c"/>
  <text x="168" y="148" font-size="12" fill="#b4232c">thrust T</text>
  <line x1="60" y1="140" x2="160" y2="140" stroke="#1d6fd1" stroke-width="2"/>
  <text x="80" y="156" font-size="11" fill="#1d6fd1">T cos δ (along)</text>
  <line x1="44" y1="98" x2="44" y2="136" stroke="#1d6fd1" stroke-width="2"/>
  <text x="8" y="176" font-size="11" fill="#1d6fd1">T sin δ (sideways)</text>
  <path d="M 100 98 A 40 40 0 0 1 97.4 112.2" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="104" y="114" font-size="12" fill="#1f2a44">δ</text>
</svg>
```

The picture exaggerates $\delta$ (about $21^\circ$) so the parts are visible; real engine-out corrections are a degree or less.
:::

::: context control-allocation Sharing one job among many hands
Control allocation is the step between "I need this much turning moment" and "tilt engine 3 by this much, engine 5 by that much". With more actuators than jobs, there are endless ways to share the work. A common rule is to minimize the sum of squared deflections, which spreads the load evenly — exactly the "use all seven engines" answer — and to shift work away from any actuator that is near its limit. Aircraft do the same with their many control surfaces.
:::

::: context n1-kord Shutting down the partner
The Soviet N1 moon rocket had 30 engines on its first stage. Its engine-control system, called KORD, was designed to shut down the engine directly opposite any engine that failed, keeping the thrust pattern balanced instead of fighting an imbalance with steering. The approach costs twice the thrust per failure, but it only works if the rocket has thrust to spare. All four N1 launches failed, for a mix of reasons that included problems in that very engine-control system.
:::

::: context reserve Propellant kept back on purpose
A launch vehicle never plans to burn its tanks dry. The planned leftover — the performance reserve — covers everything that might go a little wrong: an engine slightly weaker than rated, winds, a heavier-than-planned payload, and failures like the ones in this lesson. It is usually a few percent of the stage's propellant. In the module's worked flight it is $4957\ \mathrm{kg}$, about 5% — and because it sits at the very end of the burn, when the rocket is lightest, each kilogram of it buys a lot of speed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">reserve used by one engine-out, by when it happens</text>
  <line x1="90" y1="30" x2="90" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="40" width="240" height="22" fill="#b4232c"/>
  <rect x="90" y="72" width="56" height="22" fill="#f2b880"/>
  <rect x="90" y="104" width="12" height="22" fill="#8fb8f0"/>
  <g font-size="12" fill="#1f2a44" text-anchor="end">
    <text x="84" y="56">60% of burn</text><text x="84" y="88">79%</text><text x="84" y="120">90%</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="322" y="56" text-anchor="end" fill="#fff">1080 kg</text><text x="152" y="88">252 kg</text><text x="108" y="120">54 kg</text>
  </g>
</svg>
```

Bar lengths are to scale: the earliest failure eats twenty times what the latest one does.
:::

::: context unusable-propellant Propellant that cannot be burned
Not every kilogram in a tank can reach the engine. Some clings to walls and fills pipes; some stays behind because the pumps need a minimum level to avoid sucking in gas. Engineers budget these **residuals** in advance. A fault — a stuck valve, a leak, a sensor that reads wrong — can leave far more than planned, and that extra mass rides along as dead weight while giving no push.
:::

::: context crs-1 An engine-out in real flight
In October 2012, on a Falcon 9 carrying a Dragon cargo capsule to the space station, one of the nine first-stage engines shut down about 79 seconds after liftoff. The other eight burned longer and the flight software re-planned the ascent, and Dragon reached its planned orbit. A small secondary satellite on the same rocket needed a second upper-stage burn to reach its own orbit. Flight rules protecting the space station did not allow it with the propellant margin left, so the satellite was left in a lower orbit and re-entered within days — a fallback decided by exactly the kind of logic in this lesson. (That early Falcon 9 had its nine engines in a three-by-three grid; the ring-plus-center layout came the next year.)

:::
