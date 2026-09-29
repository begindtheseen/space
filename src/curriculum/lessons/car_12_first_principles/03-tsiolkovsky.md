---
id: l03-tsiolkovsky
title: "Deriving Tsiolkovsky, and what it hides"
minutes: 21
covers:
  - deriving Tsiolkovsky from the variable-mass equation
---

Imagine planning a long hike with no shops along the way. You need food for every day. But food is heavy, so a longer trip means a heavier pack, and a heavier pack burns more energy, which means you need even more food, which makes the pack heavier still. Doubling the food does not double how far you can go. Every extra bag of trail mix has to carry itself, and carry the bags after it.

A rocket lives with exactly this problem, and one short equation captures it: the **rocket equation**, usually named after **[[Konstantin Tsiolkovsky|tsiolkovsky]]**. It tells you how much a rocket can change its speed — its **$\Delta v$**, read "delta v", meaning "change in velocity" — from how fast its exhaust leaves and how much of its starting mass is propellant.

It is the most-asked derivation in the whiteboard round, and not because it is hard. It takes three lines. What it tests is whether you know what those three lines *cost*. The equation is an idealization that overstates a real first stage's speed gain by very roughly a kilometer and a half per second. A candidate who writes it down as though it answered "how much velocity does this stage give me?" has revealed something.

So this lesson does two things. It derives $\Delta v = c\ln(m_0/m_f)$ from the momentum balance of the previous lesson, which is quick. Then it spends most of its length on the assumptions the integration hides, one at a time, with a number attached to each. "It assumes no gravity" is a memorized phrase. "Gravity costs a first stage about 1.2 kilometers per second, and here is the integral" is an answer.

Tsiolkovsky published the equation in 1903. Others derived it independently, both before and after him. The name is worth knowing because interviewers use it.

## The derivation

Start from the previous lesson's result with the external forces set to zero:

$$
m\frac{dv}{dt} = -c\,\frac{dm}{dt}.
$$

Here $c$ is the effective exhaust velocity in meters per second, $m(t)$ the vehicle's mass in kilograms, and $v(t)$ its speed. Writing $c$ instead of $v_e$ folds the pressure term in, which is the form you want for trajectory work.

**Assumptions, said before the algebra.** $c$ is constant. There are no external forces at all — no gravity, no drag, no changing air pressure outside the nozzle. The motion is one-dimensional, along the thrust direction. Thrust and velocity point the same way the whole time.

**Step 1 — separate the variables.** Multiply both sides by $dt$ and divide both sides by $m$. That puts everything about speed on the left and everything about mass on the right:

$$
dv = -c\,\frac{dm}{m}.
$$

**Step 2 — integrate.** Add up all the tiny changes, from the starting mass $m_0$ ("m naught") at ignition to the final mass $m_f$ at engine cutoff, and from starting speed $v_0$ to final speed $v_f$. Because $c$ is constant, it comes outside the integral. The integral of $1/m$ is the **[[natural logarithm|natural-log]]**, $\ln m$:

$$
\int_{v_0}^{v_f} dv = -c\int_{m_0}^{m_f}\frac{dm}{m}
\quad\Longrightarrow\quad
v_f - v_0 = -c\left(\ln m_f - \ln m_0\right).
$$

**Step 3 — tidy up.** Call $v_f - v_0$ the change $\Delta v$. Use the log rule $\ln a - \ln b = \ln(a/b)$, and absorb the minus sign by flipping the fraction:

$$
\Delta v = c\ln\frac{m_0}{m_f}.
$$

Three lines. The sign comes out positive because $m_f < m_0$, so $m_0/m_f > 1$ and its logarithm is positive. The fraction $m_0/m_f$ is the **mass ratio** — starting mass over final mass.

::: key
The Tsiolkovsky rocket equation: $\Delta v = v_e\ln(m_0/m_f) = c\ln(m_0/m_f) = I_{sp}g_0\ln(m_0/m_f)$, with $m_0$ the mass at ignition, $m_f$ the mass at cutoff, and $c$ the effective exhaust velocity (equal to $v_e$ when the pressure term is zero). It assumes constant exhaust velocity, no gravity, no drag and no external forces of any kind, so it is an **[[upper bound|upper-bound]]** on what a real stage delivers.
:::

Two facts about its shape are worth saying out loud as you write it, because they are what the equation is really for:

- The speed gain depends on the **ratio** of masses, not their difference. Doubling every mass in the vehicle changes nothing.
- The dependence is **[[logarithmic|log-curve]]**, so buying more $\Delta v$ by adding propellant gives sharply shrinking returns — the hiker's problem. Buying it by raising $c$ pays off in direct proportion. That imbalance is the whole argument for staging and for high-$I_{sp}$ upper stages.

::: example A stage, and why dry mass hurts so much
**Assumptions.** A stage with ignition mass $m_0 = 500\,\mathrm{t}$ and cutoff mass $m_f = 125\,\mathrm{t}$ (a tonne, t, is $1000\,\mathrm{kg}$). Its average effective exhaust velocity matches $I_{sp} = 300\,\mathrm{s}$.

**Exhaust velocity.** $c = I_{sp}g_0 = 300 \times 9.80665 \approx 2942\,\mathrm{m/s}$.

**Mass ratio.** $500/125 = 4.0$, and $\ln 4 \approx 1.3863$.

**Ideal $\Delta v$.** $2942 \times 1.3863 \approx 4078.5\,\mathrm{m/s}$, about $4.08\,\mathrm{km/s}$.

**Now make the structure heavier.** Suppose the structure comes in ten percent heavy, so $m_f = 137.5\,\mathrm{t}$ instead of $125\,\mathrm{t}$, with everything else unchanged. The mass ratio drops to $500/137.5 \approx 3.636$, and $\ln 3.636 \approx 1.2910$. The ideal $\Delta v$ becomes $2942 \times 1.2910 \approx 3798\,\mathrm{m/s}$.

**The cost.** $4078.5 - 3798 \approx 280\,\mathrm{m/s}$ lost for $12.5$ tonnes of extra structure. A ten percent mass error has cost about seven percent of the $\Delta v$ ($280/4078.5 \approx 0.069$). Near the end of a climb to orbit, that is the difference between getting there and not.

**Sanity check.** Units: meters per second times a logarithm, which has no units, gives meters per second. Size: a first stage delivering about $4\,\mathrm{km/s}$ of the roughly $9.4\,\mathrm{km/s}$ a climb to low Earth orbit needs is the right share for a two-stage vehicle.
:::

## What the three lines assumed

Each of these is a line an interviewer can ask you to defend. For each: what was assumed, what really happens, and how big it is for a first stage.

Notice first what kind of list this is. Every item is about forces and exhaust acting along one line. The derivation never needed to know how the mass is arranged inside the vehicle or how it turns. Those questions belong to rotation, which is lesson 6.

**Constant effective exhaust velocity.** In the previous lesson's example, $c$ rose eleven percent between the pad and vacuum, because the pressure term $(p_e - p_a)A_e$ grows as the outside pressure falls. Using the sea-level value throughout underpredicts; using the vacuum value overpredicts by a similar amount. In practice you integrate with $c$ changing over time, or use a flight-averaged value. For a first stage this is worth something like 100 to 200 m/s either way — a few percent — and it is the one assumption on this list whose error can go either way.

**No changing outside pressure.** The same physical cause, listed separately because it is a separate modeling choice: the derivation treated the nozzle as if the air outside it never changed. It is the *reason* the previous item is not exact, not an extra error on top.

**No gravity.** By far the biggest, and the subject of the next section. Roughly 1.0 to 1.5 km/s for a climb to low Earth orbit, most of it spent during the first stage.

**No drag.** The vehicle pushes through the atmosphere for its first ninety seconds or so. The drag loss scales with $C_D S/m$ — the drag coefficient $C_D$ (a number for how streamlined the shape is) times the frontal area $S$, divided by the mass. So it depends strongly on vehicle size. For a large launcher it is small, of order 20 to 50 m/s. For a small launcher with similar frontal area per tonne it can be 100 to 150 m/s.

**Thrust along the velocity — no steering loss.** The derivation is one-dimensional. A real vehicle points a little away from its direction of travel in order to steer, by an angle $\alpha$ (the **[[angle of attack|angle-of-attack]]**). Only the part of the thrust along the velocity, $T\cos\alpha$, adds speed. The loss is $\int (1 - \cos\alpha)\,T/m\,dt$ over the flight — typically tens of m/s, up to around 100 m/s.

**No thrust misalignment.** A gimbaled engine — one that swivels to steer — tilted by an angle $\delta$ ("delta") pushes with only $T\cos\delta$ along the body. At $\delta = 2^\circ$, $\cos 2^\circ \approx 0.99939$, so the loss is about six parts in ten thousand of the push. Even if the engine sat at $2^\circ$ for the entire burn of the stage above, that would be $0.00061 \times 4078.5 \approx 2.5\,\mathrm{m/s}$, and real deflections are usually smaller and briefer. Name it, then say it is negligible for $\Delta v$ and matters only for control. Being able to say *which* of your neglected terms are truly small is worth as much as listing them.

::: warning "It assumes no gravity" is only half an answer
Every candidate says it. What sets an answer apart is the follow-through: gravity loss is $\int g\sin\gamma\,dt$, it is large, and it is the reason a vehicle starts tipping over within seconds of clearing the tower instead of climbing straight up. If you say "no gravity" and stop, expect the interviewer to ask *how much* — and have a number ready.
:::

## Gravity loss, with the integral

Here is the picture first. Imagine a rocket that only hovers, thrust exactly balancing its weight. The engine burns propellant furiously, and the rocket gains no speed at all. Every bit of that burn is wasted fighting gravity. A real climb wastes part of its burn the same way.

Now put gravity back into the momentum balance, for motion in a vertical plane. Let $\gamma$ ("gamma") be the **[[flight path angle|flight-path-angle]]** — the angle of the velocity above the horizontal. Gravity pulls straight down. The part of it along the direction of travel is $g\sin\gamma$, pulling backward. So

$$
\frac{dv}{dt} = \frac{T}{m} - g\sin\gamma.
$$

Integrate over the burn time $t_b$. The $T/m$ part gives back the Tsiolkovsky $\Delta v$, and the gravity part subtracts a deficit:

$$
\Delta v_{\text{actual}} = c\ln\frac{m_0}{m_f} - \underbrace{\int_0^{t_b} g\sin\gamma\,dt}_{\text{gravity loss}}.
$$

The thing being integrated is largest at $\gamma = 90^\circ$ — flying straight up, where $\sin\gamma = 1$ — and zero at $\gamma = 0$, flying level. That one observation is the whole case for the gravity turn, which the next two lessons develop. The vehicle tries to get horizontal as early as its structure and the air allow, because every second spent pointing straight up costs about $9.8\,\mathrm{m/s}$ of speed it will never get back.

::: key
Gravity loss is $\int_0^{t_b} g\sin\gamma\,dt$ and drag loss is $\int (D/m)\,dt$. Both are subtracted from the Tsiolkovsky $\Delta v$. That is why the $\Delta v$ actually spent to reach orbit — about 9.3 to 9.5 km/s to low Earth orbit — exceeds the roughly 7.7 km/s of **[[orbital speed|delta-v-budget]]** you end up with.
:::

::: example Gravity loss for a 160-second first stage
**Assumptions.** Burn time $t_b = 160\,\mathrm{s}$. The flight path angle falls in a straight line over time, from $90^\circ$ at liftoff to $20^\circ$ at staging. That is crude, but it captures the shape and you can defend it in thirty seconds. Take $g = 9.80665\,\mathrm{m/s^2}$ as constant; it is about three percent weaker at $100\,\mathrm{km}$ up, which we ignore.

**The integral.** With $\gamma$ changing linearly in time from $\gamma_0$ to $\gamma_1$, the integral of $\sin\gamma$ works out to

$$
\int_0^{t_b}\sin\gamma\,dt = \frac{t_b}{\gamma_0-\gamma_1}\left(\cos\gamma_1 - \cos\gamma_0\right),
$$

with the angles in **[[radians|radians]]**. Here $\gamma_0 - \gamma_1 = 70^\circ \approx 1.2217\,\mathrm{rad}$, $\cos 20^\circ \approx 0.9397$ and $\cos 90^\circ = 0$. So the integral is $(160/1.2217) \times 0.9397 \approx 131.0 \times 0.9397 \approx 123.1\,\mathrm{s}$.

**Gravity loss.** Multiply by $g$: $9.80665 \times 123.1 \approx 1207\,\mathrm{m/s}$.

**Compare with flying straight up the whole way.** Then $\sin\gamma = 1$ throughout, and the loss would be $9.80665 \times 160 \approx 1569\,\mathrm{m/s}$ — $362\,\mathrm{m/s}$ worse. Tipping over buys that back.

**Sanity check.** Published gravity losses for climbs to low Earth orbit are usually quoted between about 1.0 and 1.5 km/s, so 1.2 km/s from a two-line model is in the right place. Had it come out at 100 m/s or 10 km/s, the model would be wrong, not the atmosphere.

**Uncertainty.** The biggest factor is the pitch profile, not $g$. Ending at $10^\circ$ instead of $20^\circ$ lowers the loss to about $1107\,\mathrm{m/s}$, roughly eight percent less, and the straight-line-in-time assumption is worth at least that much. Say so.
:::

::: note Why the integral has that form
If $\gamma$ changes at a steady rate $k = (\gamma_1 - \gamma_0)/t_b$, then $\gamma = \gamma_0 + kt$, so $dt = d\gamma/k$. The integral becomes $\frac{1}{k}\int_{\gamma_0}^{\gamma_1}\sin\gamma\,d\gamma = \frac{1}{k}\left(\cos\gamma_0 - \cos\gamma_1\right)$. Since $k$ is negative here (the angle is falling), $\frac{1}{k} = -\frac{t_b}{\gamma_0 - \gamma_1}$, and the minus sign flips the bracket to give $\frac{t_b}{\gamma_0-\gamma_1}(\cos\gamma_1 - \cos\gamma_0)$. The angles must be in radians because the rule "the integral of $\sin$ is $-\cos$" only holds in radians.
:::

::: example Why nobody flies single stage to orbit
**The question.** Take $9.4\,\mathrm{km/s}$ as the ideal $\Delta v$ needed for low Earth orbit, losses included. What fraction of a single stage's mass must be propellant?

**Rearrange.** Divide both sides of the rocket equation by $c$ and undo the logarithm with the exponential: $m_0/m_f = e^{\Delta v/c}$. The propellant fraction is what burns away, $1 - m_f/m_0$.

**Work one row.** At $I_{sp} = 300\,\mathrm{s}$, $c \approx 2942\,\mathrm{m/s}$, so $\Delta v/c = 9400/2942 \approx 3.195$ and $m_0/m_f = e^{3.195} \approx 24.4$. Then $m_f/m_0 \approx 1/24.4 \approx 0.041$, and the propellant fraction is $1 - 0.041 = 0.959$.

| $I_{sp}$ | $c$ (m/s) | $m_0/m_f$ | Propellant fraction |
| --- | --- | --- | --- |
| 300 s (kerosene–oxygen) | 2942 | 24.4 | 95.9 % |
| 350 s (good kerosene–oxygen, vacuum) | 3432 | 15.5 | 93.5 % |
| 450 s (hydrogen–oxygen, vacuum) | 4413 | 8.42 | 88.1 % |

**Read it.** At $I_{sp} = 300\,\mathrm{s}$ the vehicle must be 95.9 percent propellant. That leaves 4.1 percent for tanks, engines, electronics, structure *and payload*. Empty aluminum tanks alone weigh a few percent of the propellant they hold. Hydrogen improves the exponent, but its tanks are bulky, and it still leaves under twelve percent for everything that is not propellant.

**The conclusion, said out loud.** [[Staging|staging]] works because it throws away structure that has already done its job. The exponential is then applied twice, to two smaller numbers, instead of once to a huge one. This table is the fastest way to show that at a whiteboard.
:::

## Check yourself

::: check
Derive the rocket equation from the variable-mass momentum balance in three lines, stating the assumption that each line uses.
:::

::: answer
Line one, from the momentum balance with $F_{\text{ext}} = 0$ — that is the no-gravity, no-drag assumption:

$$
m\frac{dv}{dt} = -c\frac{dm}{dt}.
$$

Line two: cancel $dt$ and separate. This uses the assumption that $c$ is constant, so it can come outside the integral in the next line, and that the motion is one-dimensional, so $v$ is a single number:

$$
dv = -c\frac{dm}{m}.
$$

Line three: integrate from ignition to cutoff:

$$
\Delta v = c\ln\frac{m_0}{m_f}.
$$

Say each assumption as you use it, not as a list at the end. That is what makes it a derivation instead of a recollection.
:::

::: check
An interviewer asks: "Which assumption in the rocket equation costs you the most, and how do you know?" Answer in two sentences, with a number.
:::

::: answer
Gravity, by roughly ten times anything else on the list. The gravity loss $\int g\sin\gamma\,dt$ for a first stage burning about 160 seconds with a realistic pitch profile comes to roughly 1.2 km/s, against perhaps 100–200 m/s for the changing exhaust velocity, 20–150 m/s for drag, tens of m/s for steering and a few m/s at most for gimbal misalignment.

You know because it is the only neglected term that is comparable to $g$ times the burn time. For a 160-second burn, $g t_b = 9.80665 \times 160 \approx 1569\,\mathrm{m/s}$ — an upper limit on the gravity loss, and already a sixth of the whole $9.4\,\mathrm{km/s}$ ascent budget.
:::

::: check
A stage has $I_{sp} = 340\,\mathrm{s}$, ignition mass 120 t and 95 t of propellant. What is its ideal $\Delta v$? If you then learn that it flies at an average flight path angle of $30^\circ$ for its 300-second burn, what does it actually deliver?
:::

::: answer
The cutoff mass is what is left when the propellant is gone: $120 - 95 = 25\,\mathrm{t}$. The mass ratio is $120/25 = 4.8$, and $\ln 4.8 \approx 1.5686$.

$c = 340 \times 9.80665 \approx 3334\,\mathrm{m/s}$, so the ideal $\Delta v$ is $3334 \times 1.5686 \approx 5230\,\mathrm{m/s}$.

Gravity loss with a constant $\gamma = 30^\circ$: $\sin 30^\circ = 0.5$, so the loss is $9.80665 \times 0.5 \times 300 \approx 1471\,\mathrm{m/s}$.

Delivered: $5230 - 1471 = 3759\,\mathrm{m/s}$, about $3.76\,\mathrm{km/s}$ — twenty-eight percent less than the ideal figure. Drag and steering are both small next to this; say that you neglected them rather than leaving it silent.
:::

::: check
Why is the rocket equation an upper bound rather than an approximation that could be wrong in either direction?
:::

::: answer
Because every neglected effect pushes the same way. Gravity removes speed along the velocity. Drag removes speed along the velocity. Steering means only $T\cos\alpha$ counts instead of $T$. Gimbal deflection gives $T\cos\delta$ instead of $T$. None of them can add velocity.

The one real exception is the exhaust velocity assumption, which can err either way depending on whether you used a sea-level or a vacuum value for $c$. If you quote the sea-level $I_{sp}$ for a first stage, the equation underpredicts the engine's contribution while still overpredicting the delivered $\Delta v$ — two errors of opposite sign that do not reliably cancel. That is why flight-averaged values exist.
:::

::: check
Two vehicles have the same mass ratio. One has an effective exhaust velocity twice the other's. Compare their $\Delta v$. Then compare what happens if instead you double each vehicle's mass ratio.
:::

::: answer
Doubling $c$ doubles $\Delta v$ exactly, because $c$ multiplies the logarithm.

Doubling the mass ratio adds $c\ln 2 \approx 0.693c$, whatever the mass ratio was, because $\ln(2x) = \ln 2 + \ln x$. Start from a ratio of 4 at $c = 2942\,\mathrm{m/s}$: $\Delta v$ goes from $2942 \times 1.3863 \approx 4078.5\,\mathrm{m/s}$ to $2942 \times \ln 8 = 2942 \times 2.0794 \approx 6118\,\mathrm{m/s}$. That is a gain of about $2039\,\mathrm{m/s}$ for a huge increase in propellant. Doubling $c$ instead would have gained $4078.5\,\mathrm{m/s}$ with no extra propellant at all.

That imbalance — in direct proportion to $c$, only logarithmic in mass ratio — is why propulsion research chases specific impulse, and why an upper stage often uses a different, more expensive propellant than the booster beneath it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\Delta v = c\ln(m_0/m_f)$ | Tsiolkovsky rocket equation; $c = I_{sp}g_0$ |
| $m_0$, $m_f$ | Mass at ignition and at cutoff, kilograms |
| Hidden assumptions | Constant $c$; no gravity; no drag; no ambient pressure change; one-dimensional; thrust along velocity; no gimbal misalignment |
| Gravity loss | $\int_0^{t_b} g\sin\gamma\,dt$; about 1.0–1.5 km/s to low Earth orbit |
| Drag loss | $\int (D/m)\,dt$; 20–50 m/s for a large vehicle, 100–150 m/s for a small one |
| Steering and gimbal losses | Steering tens of m/s; gimbal misalignment a few m/s at most at $\delta = 2^\circ$ |
| Ascent budget | About 9.3–9.5 km/s of ideal $\Delta v$ for roughly 7.7 km/s of orbital speed |
| Worked stage | Mass ratio 4 at $I_{sp} = 300\,\mathrm{s}$ gives 4078.5 m/s ideal |

The next lesson stops treating the trajectory as one-dimensional. It splits the forces along and across the velocity and produces the planar powered-flight equations — the set you will be asked to derive at a board in under ten minutes.

::: context tsiolkovsky A schoolteacher who worked out spaceflight
Konstantin Tsiolkovsky (1857–1935) was a Russian schoolteacher in the town of Kaluga. An illness in childhood left him largely deaf, and he taught himself much of his science from books. In a 1903 article on exploring space with rocket devices, he wrote down the relation between exhaust speed, mass ratio and speed gained, and argued for liquid propellants. Later writings of his described multi-stage "rocket trains". Almost nobody could build such things in his lifetime; his work became famous later, as rockets caught up with it.
:::

::: context natural-log The natural logarithm in one paragraph
The natural logarithm, $\ln x$, answers the question "what power do I raise $e \approx 2.718$ to, to get $x$?" So $\ln e = 1$, $\ln 1 = 0$, and $\ln 4 \approx 1.386$. It turns multiplying into adding: $\ln(ab) = \ln a + \ln b$. It appears here because it is the function whose rate of change is $1/m$ — so adding up lots of tiny $dm/m$ pieces gives a logarithm. Each small bit of propellant changes speed in proportion to what fraction of the *current* mass it is, which is the hiker's problem in math form.
:::

::: context upper-bound A ceiling, not a guess
An upper bound is a value the true answer cannot exceed. The rocket equation is one because everything it leaves out — gravity, drag, steering — can only take speed away. That makes it useful in a different way from an estimate: if the ideal $\Delta v$ of a proposed stage is already too small for the job, you can reject the design without doing anything harder. Engineers love bounds for exactly this reason.
:::

::: context log-curve Each doubling adds the same amount
Plot $\Delta v/c = \ln(m_0/m_f)$ against the mass ratio. Going from 4 to 8 adds $0.693$; going from 8 to 16 adds the same $0.693$, though it takes twice as much extra mass. The curve keeps rising but keeps flattening.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 46.2,152.8 52.5,140.6 58.8,131.1 65.0,123.4 71.2,116.9 77.5,111.2 83.8,106.2 90.0,101.8 96.2,97.7 102.5,94.0 108.8,90.6 115.0,87.5 121.2,84.6 127.5,81.8 133.8,79.3 140.0,76.8 146.2,74.5 152.5,72.4 158.8,70.3 165.0,68.3 171.2,66.4 177.5,64.6 183.8,62.9 190.0,61.2 196.2,59.6 202.5,58.1 208.8,56.6 215.0,55.2 221.2,53.8 227.5,52.4 233.8,51.1 240.0,49.9 246.2,48.6 252.5,47.4 258.8,46.3 265.0,45.2 271.2,44.1 277.5,43.0 283.8,41.9 290.0,40.9 296.2,39.9 302.5,38.9 308.8,38.0 315.0,37.1 321.2,36.1 327.5,35.3 333.8,34.4 340.0,33.5"/>
  <g fill="#b4232c"><circle cx="77.5" cy="111.2" r="4"/><circle cx="127.5" cy="81.8" r="4"/><circle cx="227.5" cy="52.4" r="4"/></g>
  <g font-size="11" fill="#1f2a44">
    <text x="84" y="125">4</text><text x="130" y="98">8</text><text x="228" y="70">16</text>
    <text x="30" y="131" text-anchor="end">1</text><text x="30" y="89" text-anchor="end">2</text><text x="30" y="47" text-anchor="end">3</text>
    <text x="190" y="190" text-anchor="middle">mass ratio m0/mf (1 to 25)</text>
    <text x="48" y="22">Δv / c</text>
  </g>
</svg>
```
:::

::: context angle-of-attack Pointing versus moving
The angle of attack is the angle between where the rocket's nose points and the direction it is actually moving. At zero, the vehicle slices straight through the air along its path. A nonzero angle lets the vehicle steer, but it wastes a little thrust sideways and, in the atmosphere, lets the air push on the side of a long thin body — which can bend or break it. Lesson 5 shows how the gravity turn keeps this angle at zero.
:::

::: context flight-path-angle Measured from the horizon
The flight path angle $\gamma$ is measured between the velocity and the local horizontal. Straight up is $90^\circ$; level flight is $0$. Gravity (grey) splits into a part along the path, $g\sin\gamma$ (red), which slows the vehicle, and a part across it, $g\cos\gamma$, which bends the path downward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="110" y1="110" x2="300" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="110" y1="110" x2="229" y2="10" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="235,5 222,9 229,18" fill="#1d6fd1"/>
  <line x1="110" y1="110" x2="110" y2="184" stroke="#6c7a93" stroke-width="3"/>
  <polygon points="110,192 104,180 116,180" fill="#6c7a93"/>
  <line x1="110" y1="110" x2="74.7" y2="139.6" stroke="#b4232c" stroke-width="3"/>
  <polygon points="70.6,143.0 76.5,131.5 83.2,139.2" fill="#b4232c"/>
  <line x1="70.6" y1="143.0" x2="110" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <path d="M150,110 A40,40 0 0,0 140.6,84.3" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="156" y="100">γ</text>
    <text x="210" y="45">velocity</text>
    <text x="120" y="180">g</text>
    <text x="10" y="135" fill="#b4232c">g sin γ</text>
    <text x="250" y="126" fill="#6c7a93">horizontal</text>
  </g>
</svg>
```
:::

::: context radians Why the angles go in radians
A radian measures an angle by arc length: wrap the radius of a circle around its edge and the angle it covers is one radian, about $57.3^\circ$. A full turn is $2\pi$ radians. Calculus rules like "the rate of change of $\sin\gamma$ is $\cos\gamma$" are only true in radians; in degrees an extra factor of $\pi/180$ creeps in. So convert first: $70^\circ \times \pi/180 \approx 1.2217\,\mathrm{rad}$.
:::

::: context delta-v-budget Where the 9.4 km/s goes
A circular orbit a few hundred kilometers up needs a speed of about 7.7 km/s. The rocket must also pay for gravity loss (about 1.0–1.5 km/s), drag, and steering, which brings the bill to roughly 9.3–9.5 km/s. Launching eastward helps: Earth's spin already carries the pad east at up to about 0.46 km/s at the equator, less at higher latitudes. Engineers call this list a delta-v budget, and they keep it the way you would keep a bank account — every maneuver is a withdrawal.
:::

::: context staging Throwing away the empty tanks
Staging means stacking rockets and dropping each one when its propellant runs out. Once a tank is empty it is dead weight, and carrying it higher costs speed. Real attempts to avoid staging have struggled: the 1960s Atlas rocket was "stage and a half", dropping two of its engines partway up but keeping its tanks, and later single-stage designs such as the X-33 were cancelled before flying. The bars show how little room a single stage leaves for anything that is not propellant.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="40" y="20" width="287.7" height="26" fill="#8fb8f0"/><rect x="327.7" y="20" width="12.3" height="26" fill="#b4232c"/>
    <rect x="40" y="62" width="280.6" height="26" fill="#8fb8f0"/><rect x="320.6" y="62" width="19.4" height="26" fill="#b4232c"/>
    <rect x="40" y="104" width="264.4" height="26" fill="#8fb8f0"/><rect x="304.4" y="104" width="35.6" height="26" fill="#b4232c"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="34" y="37" text-anchor="end">300 s</text><text x="34" y="79" text-anchor="end">350 s</text><text x="34" y="121" text-anchor="end">450 s</text>
    <text x="50" y="37">propellant 95.9 %</text><text x="50" y="79">propellant 93.5 %</text><text x="50" y="121">propellant 88.1 %</text>
    <text x="340" y="145" text-anchor="end" fill="#b4232c">red: all structure and payload</text>
  </g>
</svg>
```
:::
