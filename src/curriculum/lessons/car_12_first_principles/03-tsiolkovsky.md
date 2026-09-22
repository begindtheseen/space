---
id: l03-tsiolkovsky
title: "Deriving Tsiolkovsky, and what it hides"
minutes: 18
covers:
  - deriving Tsiolkovsky from the variable-mass equation
---

The rocket equation is the most-asked derivation in this round, and it is asked for a reason that has nothing to do with difficulty. It takes three lines. What it tests is whether you know what those three lines cost — because the equation is an idealisation that is wrong by one and a half kilometres per second for a real first stage, and a candidate who writes it down as though it were the answer to "how much velocity does this stage give me" has revealed something.

So this lesson does two things. It derives $\Delta v = c\ln(m_0/m_f)$ from the momentum balance of the previous lesson, which is quick. Then it spends most of its length on the assumptions the integration hides, one at a time, with a number attached to each — because "it assumes no gravity" is a memorised phrase, and "gravity costs a first stage about 1.2 kilometres per second, and here is the integral" is an answer.

The equation is usually named for Konstantin Tsiolkovsky, who published it in 1903; it was derived independently several times before and after. The name is worth knowing because interviewers use it.

## The derivation

Start from the result of the previous lesson, with the external forces set to zero:

$$
m\frac{dv}{dt} = -c\,\frac{dm}{dt},
$$

where $c$ is the effective exhaust velocity in metres per second, $m(t)$ the vehicle mass in kilograms and $v(t)$ its speed. Writing $c$ rather than $v_e$ folds the pressure term in, which is the form you want for trajectory work.

**Assumptions, said before the algebra.** $c$ is constant. There are no external forces at all — no gravity, no drag, no ambient pressure changing under the nozzle. The motion is one-dimensional, along the thrust direction. Thrust and velocity are collinear throughout.

Now separate the variables. Cancel $dt$:

$$
dv = -c\,\frac{dm}{m}.
$$

Integrate from the initial mass $m_0$ to the final mass $m_f$, and from $v_0$ to $v_f$:

$$
\int_{v_0}^{v_f} dv = -c\int_{m_0}^{m_f}\frac{dm}{m}
\quad\Longrightarrow\quad
\Delta v = -c\left[\ln m\right]_{m_0}^{m_f} = c\ln\frac{m_0}{m_f}.
$$

Three lines. The sign works out because $m_f < m_0$, so $\ln(m_0/m_f) > 0$.

::: key
The Tsiolkovsky rocket equation: $\Delta v = c\ln(m_0/m_f) = I_{sp}g_0\ln(m_0/m_f)$, with $m_0$ the mass at ignition and $m_f$ the mass at cutoff. It assumes constant exhaust velocity, no gravity, no drag and no external forces of any kind, so it is an **upper bound** on what a real stage delivers.
:::

Two structural facts to say out loud when you write it down, because they are what the equation is actually for:

- The velocity gain depends on the **ratio** of masses, not the difference. Doubling every mass in the vehicle changes nothing.
- The dependence is **logarithmic**, so buying more $\Delta v$ by adding propellant has sharply diminishing returns, while buying it by raising $c$ is linear. That asymmetry is the entire argument for staging and for high-$I_{sp}$ upper stages.

::: example A stage, and why dry mass hurts so much
**Assumptions.** A stage of ignition mass $m_0 = 500\,\mathrm{t}$ and cutoff mass $m_f = 125\,\mathrm{t}$, with an average effective exhaust velocity corresponding to $I_{sp} = 300\,\mathrm{s}$.

**Exhaust velocity.** $c = I_{sp}g_0 = 300 \times 9.80665 = 2942\,\mathrm{m/s}$.

**Mass ratio.** $500/125 = 4.0$, and $\ln 4 = 1.3863$.

**Ideal $\Delta v$.** $2942 \times 1.3863 = 4078.5\,\mathrm{m/s}$, so about 4.08 km/s.

**Now perturb the dry mass.** Suppose the structure comes in ten per cent heavy: $m_f = 137.5\,\mathrm{t}$ instead of 125 t, everything else unchanged. Then $\ln(500/137.5) = 1.2910$ and the ideal $\Delta v$ is $2942 \times 1.2910 = 3798\,\mathrm{m/s}$.

**The cost.** $4078.5 - 3798 = 280\,\mathrm{m/s}$ lost for 12.5 tonnes of extra structure — a ten per cent mass error producing a seven per cent $\Delta v$ loss, which at the top of an ascent is the difference between reaching orbit and not.

**Sanity check.** Units: $\mathrm{m/s}$ times a dimensionless logarithm gives $\mathrm{m/s}$. Magnitude: a first stage delivering four kilometres per second of the roughly 9.4 km/s an ascent to low Earth orbit needs is the right share for a two-stage vehicle.
:::

## What the three lines assumed

Each of these is a line you can be asked to defend. For each one: what was assumed, what really happens, and how big it is for a first stage.

**Constant effective exhaust velocity.** $c$ rose eleven per cent between the pad and vacuum in the previous lesson's example, because the pressure term $(p_e - p_a)A_e$ grows as the ambient pressure falls. Using the sea-level value throughout under-predicts; using the vacuum value over-predicts by a similar amount. In practice you integrate with $c(t)$, or use a flight-averaged value. For a first stage this is worth of order 100 to 200 m/s either way — a few per cent, and the one assumption on this list whose error has a sign you can choose.

**No ambient pressure variation.** The same physical cause, listed separately because it is a separate modelling decision: the derivation treated the nozzle as though the air outside it never changed. It is the reason the previous item is not exact rather than an independent error.

**No gravity.** The largest term by far, and the subject of the next section. Roughly 1.0 to 1.5 km/s for an ascent to low Earth orbit, most of it spent in the first stage.

**No drag.** The vehicle pushes through the atmosphere for the first ninety seconds or so. Drag loss scales with $C_D S/m$, so it depends strongly on vehicle size: for a large launcher it is small, of order 20 to 50 m/s, and for a small launcher with the same frontal area per tonne it can be 100 to 150 m/s.

**Thrust collinear with velocity — no steering loss.** The derivation is one-dimensional. A real vehicle points away from its velocity vector to steer, and only the component of thrust along the velocity adds speed. The loss is $\int (1 - \cos\alpha)\,T/m\,dt$ over the flight, typically tens of m/s up to around 100 m/s.

**No thrust vector misalignment.** A gimballed engine deflected by $\delta$ contributes $T\cos\delta$ along the body axis. At a typical in-flight deflection of $\delta = 2^\circ$, $\cos 2^\circ = 0.99939$, so the loss is six parts in ten thousand — for $c = 2942\,\mathrm{m/s}$ that is under 2 m/s over the whole stage. Name it, then say it is negligible for $\Delta v$ and matters only for control authority. Being able to say which of your neglected terms are genuinely small is worth as much as listing them.

::: warning "It assumes no gravity" is only half an answer
Every candidate says it. What distinguishes an answer is the follow-through: gravity loss is $\int g\sin\gamma\,dt$, it is large, and it is the reason a vehicle pitches over within seconds of clearing the tower rather than climbing vertically. If you say "no gravity" and stop, expect the interviewer to ask how much — and to have a number ready.
:::

## Gravity loss, with the integral

Put gravity back into the momentum balance, for motion in a vertical plane at flight path angle $\gamma$ above the horizontal. The component of gravity along the velocity vector is $-g\sin\gamma$, so

$$
\frac{dv}{dt} = \frac{T}{m} - g\sin\gamma.
$$

Integrating over the burn gives the ideal $\Delta v$ minus a deficit:

$$
\Delta v_{\text{actual}} = c\ln\frac{m_0}{m_f} - \underbrace{\int_0^{t_b} g\sin\gamma\,dt}_{\text{gravity loss}}.
$$

The integrand is largest when $\gamma = 90^\circ$ — flying straight up — and vanishes when $\gamma = 0$, flying horizontally. That single observation is the whole argument for the gravity turn, which the next two lessons develop: the vehicle is trying to get horizontal as early as the structure and the atmosphere allow, because every second spent vertical costs $g$ metres per second of speed it will never get back.

::: key
Gravity loss is $\int_0^{t_b} g\sin\gamma\,dt$ and drag loss is $\int (D/m)\,dt$. Both are subtracted from the Tsiolkovsky $\Delta v$, which is why the $\Delta v$ actually spent to reach orbit — about 9.3 to 9.5 km/s to low Earth orbit — exceeds the roughly 7.7 km/s of orbital speed you end up with.
:::

::: example Gravity loss for a 160-second first stage
**Assumptions.** Burn time $t_b = 160\,\mathrm{s}$. The flight path angle falls linearly from $90^\circ$ at liftoff to $20^\circ$ at staging — crude, but it captures the shape and is defensible in thirty seconds. Take $g = 9.80665\,\mathrm{m/s^2}$ as constant, which it is to within two per cent over the first hundred kilometres.

**The integral.** With $\gamma$ linear in $t$ from $\gamma_0$ to $\gamma_1$,

$$
\int_0^{t_b}\sin\gamma\,dt = \frac{t_b}{\gamma_0-\gamma_1}\left(\cos\gamma_1 - \cos\gamma_0\right),
$$

with the angles in radians. Here $\gamma_0 - \gamma_1 = 1.2217\,\mathrm{rad}$, $\cos\gamma_1 = 0.9397$ and $\cos\gamma_0 = 0$, so the integral is $160/1.2217 \times 0.9397 = 123.1\,\mathrm{s}$.

**Gravity loss.** $9.80665 \times 123.1 = 1207\,\mathrm{m/s}$.

**Compare with flying straight up the whole way.** Then $\sin\gamma = 1$ throughout and the loss would be $9.80665 \times 160 = 1569\,\mathrm{m/s}$ — 362 m/s worse. Pitching over buys that back.

**Sanity check.** Published gravity losses for ascents to low Earth orbit are usually quoted between about 1.0 and 1.5 km/s, so 1.2 km/s from a two-line model is in the right place. If this had come out at 100 m/s or 10 km/s, the model would be wrong, not the atmosphere.

**Uncertainty.** The dominant term is the pitch profile, not $g$. Ending at $10^\circ$ instead of $20^\circ$ lowers the loss by roughly five per cent; the linear-in-time assumption is worth more than that. Say so.
:::

::: example Why nobody flies single stage to orbit
**The question.** Take 9.4 km/s as the ideal $\Delta v$ needed for low Earth orbit, including the losses. What propellant mass fraction does a single stage need?

**Rearrange.** $m_0/m_f = e^{\Delta v/c}$, and the propellant fraction is $1 - m_f/m_0$.

| $I_{sp}$ | $c$ (m/s) | $m_0/m_f$ | Propellant fraction |
| --- | --- | --- | --- |
| 300 s (kerosene–oxygen) | 2942 | 24.4 | 95.9 % |
| 350 s (good kerosene–oxygen, vacuum) | 3432 | 15.5 | 93.5 % |
| 450 s (hydrogen–oxygen, vacuum) | 4413 | 8.42 | 88.1 % |

**Read it.** At $I_{sp} = 300\,\mathrm{s}$ the vehicle must be 95.9 per cent propellant, leaving 4.1 per cent for tanks, engines, avionics, structure *and payload*. Empty aluminium tanks alone are a few per cent of the propellant they hold. Hydrogen improves the exponent but the tanks are bulky and the fraction is still under twelve per cent for everything that is not propellant.

**The conclusion, said out loud.** Staging works because it throws away the structure that has already done its job, so the exponential is applied twice to two smaller numbers instead of once to a large one. This table is the fastest way to demonstrate that at a whiteboard.
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

Line two, cancel $dt$ and separate. This uses the assumption that $c$ is constant, so it can be taken outside the integral in the next line, and that the motion is one-dimensional so $v$ is a scalar:

$$
dv = -c\frac{dm}{m}.
$$

Line three, integrate from ignition to cutoff:

$$
\Delta v = c\ln\frac{m_0}{m_f}.
$$

Say the assumptions as you use them rather than as a list at the end. That is what makes it a derivation rather than a recollection.
:::

::: check
An interviewer asks: "Which assumption in the rocket equation costs you the most, and how do you know?" Answer in two sentences, with a number.
:::

::: answer
Gravity, by an order of magnitude over anything else on the list. The gravity loss $\int g\sin\gamma\,dt$ for a first stage burning for around 160 seconds with a realistic pitch profile comes to roughly 1.2 km/s, against perhaps 100–200 m/s for the varying exhaust velocity, 20–150 m/s for drag, tens of m/s for steering and under 2 m/s for gimbal misalignment.

The way you know is that it is the only neglected term that is comparable to $g$ times the burn time, and $g t_b$ for a 160-second burn is $9.80665 \times 160 = 1569\,\mathrm{m/s}$ — which is an upper bound on the gravity loss and is already a sixth of the total ascent $\Delta v$.
:::

::: check
A stage has $I_{sp} = 340\,\mathrm{s}$, ignition mass 120 t and 95 t of propellant. What is its ideal $\Delta v$? If you then learn that it flies at an average flight path angle of $30^\circ$ for its 300-second burn, what does it actually deliver?
:::

::: answer
Cutoff mass is $120 - 95 = 25\,\mathrm{t}$, so the mass ratio is $120/25 = 4.8$ and $\ln 4.8 = 1.5686$.

$c = 340 \times 9.80665 = 3334\,\mathrm{m/s}$, so the ideal $\Delta v$ is $3334 \times 1.5686 = 5230\,\mathrm{m/s}$.

Gravity loss with constant $\gamma = 30^\circ$: $\sin 30^\circ = 0.5$, so the loss is $9.80665 \times 0.5 \times 300 = 1471\,\mathrm{m/s}$.

Delivered: $5230 - 1471 = 3759\,\mathrm{m/s}$, about 3.76 km/s — twenty-eight per cent less than the ideal figure. Neglecting drag and steering, both small compared with this, is worth saying rather than leaving silent.
:::

::: check
Why is the rocket equation an upper bound rather than an approximation that could err either way?
:::

::: answer
Because every neglected effect has the same sign. Gravity removes speed along the velocity vector; drag removes speed along the velocity vector; steering means only $T\cos\alpha$ contributes instead of $T$; gimbal deflection contributes $T\cos\delta$ instead of $T$. None of them can add velocity.

The one genuine exception is the exhaust velocity assumption, which errs either way depending on whether you used a sea-level or a vacuum value for $c$. If you quote the sea-level $I_{sp}$ for a first stage, the equation under-predicts the propulsive term while still over-predicting the delivered $\Delta v$ — two errors of opposite sign that do not cancel reliably. That is why flight-averaged values exist.
:::

::: check
Two vehicles have identical mass ratios. One has an effective exhaust velocity twice the other's. Compare their $\Delta v$, and then compare what happens if instead you double each vehicle's mass ratio.
:::

::: answer
Doubling $c$ doubles $\Delta v$ exactly, because $c$ multiplies the logarithm.

Doubling the mass ratio adds $c\ln 2 = 0.693c$, whatever the mass ratio was. Starting from a ratio of 4 at $c = 2942\,\mathrm{m/s}$: $\Delta v$ goes from $2942 \times 1.3863 = 4078.5\,\mathrm{m/s}$ to $2942 \times 2.0794 = 6118\,\mathrm{m/s}$, a gain of 2039 m/s for doubling every tonne of propellant in the vehicle. Doubling $c$ instead would have gained 4078.5 m/s for free.

That asymmetry — linear in $c$, logarithmic in mass ratio — is the reason propulsion research chases specific impulse, and the reason an upper stage uses a different and more expensive propellant combination than the booster underneath it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\Delta v = c\ln(m_0/m_f)$ | Tsiolkovsky rocket equation; $c = I_{sp}g_0$ |
| $m_0$, $m_f$ | Mass at ignition and at cutoff, kilograms |
| Hidden assumptions | Constant $c$; no gravity; no drag; no ambient pressure change; one-dimensional; thrust along velocity; no gimbal misalignment |
| Gravity loss | $\int_0^{t_b} g\sin\gamma\,dt$; about 1.0–1.5 km/s to low Earth orbit |
| Drag loss | $\int (D/m)\,dt$; 20–50 m/s for a large vehicle, 100–150 m/s for a small one |
| Steering and gimbal losses | Tens of m/s; gimbal misalignment under 2 m/s at $\delta = 2^\circ$ |
| Ascent budget | About 9.3–9.5 km/s of ideal $\Delta v$ for roughly 7.7 km/s of orbital speed |
| Worked stage | Mass ratio 4 at $I_{sp} = 300\,\mathrm{s}$ gives 4078.5 m/s ideal |

The next lesson stops treating the trajectory as one-dimensional. It resolves the forces along and across the velocity vector and produces the planar powered-flight equations — the set you will be asked to derive at a board in under ten minutes.
