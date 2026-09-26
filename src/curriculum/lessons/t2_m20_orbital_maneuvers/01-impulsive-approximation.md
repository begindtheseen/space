---
id: l01-impulsive-approximation
title: Impulsive Δv and when the instantaneous-burn model holds
minutes: 21
covers:
  - the impulsive approximation and its validity limits
---

Think about kicking a soccer ball. Your foot touches it for a tiny fraction of a second. Before the kick the ball is rolling one way. After it, the ball is flying another way. If someone asked you to draw the ball's path, you would draw one line, a sharp corner at the kick, and a second line. You would not draw the few millimeters the ball moved while your foot was on it.

This module draws spacecraft paths the same way. It pretends that a rocket engine changes a spacecraft's velocity instantly, at one single point, without the spacecraft moving at all during the burn. No real engine does this. A real burn lasts seconds to hours. During that time the vehicle keeps falling around its orbit, gravity keeps pulling, and the direction that was best at ignition slowly stops being best.

We throw all of that away on purpose. What is left is one clean vector addition at one point — rich enough to design a whole mission with, and simple enough to do by hand. You will use this model to size every Δv budget you ever write, from a quick check in a design review to the first pass of a real trajectory. But it is an approximation, and knowing when it stops being a good one is part of using it correctly. This lesson defines the model, gives you the one piece of vector math every later lesson needs, and sets up a quick test for whether a real burn is "instant enough". Lesson 8 later makes that test exact.

## The impulsive maneuver

A **maneuver** is any planned engine firing that changes a spacecraft's orbit. An **[[impulsive|impulse-word]] maneuver** is the idealized version: an instant change in velocity at a fixed point.

Two things happen across an impulsive burn, and it is worth being exact about them:

- The **position** $\mathbf{r}$ does not change. The spacecraft does not jump anywhere. (Bold letters like $\mathbf{r}$ are vectors — arrows with a length and a direction.)
- The **velocity** jumps. Right before the burn it is $\mathbf{v}^-$ (read "v minus"). Right after, it is $\mathbf{v}^+$ ("v plus").

The whole maneuver is described by one arrow, the difference between the two:

$$
\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-.
$$

Read $\Delta\mathbf{v}$ as "delta-vee". The $\Delta$ means "change in", so it is the change in velocity.

Before the burn, the spacecraft coasts on one **[[Keplerian orbit|keplerian-orbit]]** — the ellipse (or circle) that gravity alone would give it, from the last module. After the burn it coasts on a different one. The two orbits share exactly one point: the spot where the burn happened. Everything in lessons 2 through 7 is a choice of where to put one or more of these instant jumps, and what $\Delta\mathbf{v}$ to give each.

### What Δv stands for

A real burn pushes on the vehicle for a while. The total push (force times time) divided by the vehicle's mass is a change in velocity. That is what $\Delta v$ stands in for. Its units are speed: km/s or m/s.

Its size is what the **rocket equation**, from the rocket-equation module, turns into propellant:

$$
\Delta v = v_e \ln\frac{m_0}{m_f}, \qquad v_e = I_{sp}\, g_0 .
$$

Here $m_0$ is the mass before the burn and $m_f$ the mass after. $\ln$ is the natural logarithm. $v_e$ is the **effective exhaust velocity** — how fast the engine throws its exhaust backward. It comes from the **[[specific impulse|specific-impulse]]** $I_{sp}$ (read "I-S-P", measured in seconds) times standard gravity $g_0 = 9.80665\,\mathrm{m/s^2}$ (read "g-naught").

Turning the equation around gives the fraction of the starting mass that has to be propellant:

$$
\frac{m_p}{m_0} = 1 - \frac{m_f}{m_0} = 1 - e^{-\Delta v / v_e}.
$$

### Why engineers budget in speed

A **Δv budget** is a list of every maneuver a mission will make, each with its Δv, added up. It is really a propellant budget written in a handier currency. Speeds add in a straight line along a mission: 100 m/s here plus 50 m/s there is 150 m/s. Mass fractions do not add — they multiply — so bookkeeping in mass is clumsy. Budget in Δv, then convert to propellant once at the end.

::: example A propellant fraction from a Δv budget
A small satellite has a **[[monopropellant|monopropellant]]** thruster with $I_{sp} = 220\,\mathrm{s}$. Over its life it needs $\Delta v = 150\,\mathrm{m/s} = 0.150\,\mathrm{km/s}$ for station-keeping and disposal. How much of the spacecraft must be propellant?

**Step 1 — exhaust velocity.** Keep everything in km/s, so write $g_0 = 9.80665\times10^{-3}\,\mathrm{km/s^2}$:

$$
v_e = I_{sp}\,g_0 = 220 \times 9.80665\times10^{-3} = 2.1575\,\mathrm{km/s}.
$$

**Step 2 — the exponent.** $\Delta v / v_e = 0.150 / 2.1575 = 0.0695$.

**Step 3 — propellant fraction.**

$$
1 - e^{-0.0695} = 1 - 0.9328 = 0.0672.
$$

So $6.72\,\%$ of the spacecraft is propellant. For a $200\,\mathrm{kg}$ spacecraft that is $0.0672 \times 200 = 13.4\,\mathrm{kg}$.

**Sanity check.** The Δv is small compared with $v_e$ (about $7\,\%$ of it), so the propellant fraction should also be small, and roughly that same $7\,\%$. It is.

Notice that this Δv was never delivered as one kick. It came as dozens of short pulses spread over years. The rocket equation does not care; it only sees the total.
:::

## Combining velocity vectors

Here is the one piece of vector math you will use in almost every lesson from here on.

Picture a boat crossing a river. If you only want to go faster in the same direction, the change is easy: new speed minus old speed. But if you also want to turn, the engine has to push partly sideways, and that sideways push costs extra. Turning is never free.

For a spacecraft: the velocity before the burn is $\mathbf{v}^-$, with length (speed) $v^-$. The velocity you want after is $\mathbf{v}^+$, with speed $v^+$. The angle between the two arrows is $\theta$ (the Greek letter "theta"). Draw both arrows from the same point. The arrow from the tip of $\mathbf{v}^-$ to the tip of $\mathbf{v}^+$ is $\Delta\mathbf{v}$. The three arrows make a **[[triangle|velocity-triangle]]**, and the **law of cosines** gives the third side:

$$
|\Delta\mathbf{v}|^2 = (v^-)^2 + (v^+)^2 - 2\,v^-v^+\cos\theta .
$$

The bars $|\ |$ mean "the length of", so $|\Delta\mathbf{v}|$ is the size of the burn.

**Check the easy case.** When $\theta = 0$ the two arrows point the same way and $\cos 0 = 1$. The right side becomes $(v^+ - v^-)^2$, so $|\Delta\mathbf{v}| = |v^+ - v^-|$ — a plain difference of speeds. That is the case you used for every vis-viva problem in the last module.

When $\theta$ is not zero, the formula does not collapse, and the difference is not small. This same formula runs plane changes (lesson 5), apsidal rotation (lesson 6), and any maneuver that changes speed and direction at once. It is worth making it your own now.

::: example Two nearby velocities that are not nearly as close as they look
A vehicle's velocity changes from $v^- = 7.50\,\mathrm{km/s}$ to $v^+ = 7.80\,\mathrm{km/s}$, and the new direction is turned $5^\circ$ from the old one.

**The tempting (wrong) guess.** Ignore the turn and subtract speeds: $7.80 - 7.50 = 0.300\,\mathrm{km/s}$.

**The law of cosines.** Work out each piece:

- $7.50^2 = 56.25$ and $7.80^2 = 60.84$, which add to $117.09$.
- $2 \times 7.50 \times 7.80 = 117.0$, and $\cos 5^\circ = 0.99619$, so the last term is $117.0 \times 0.99619 = 116.555$.
- Subtract: $117.09 - 116.555 = 0.5352$.

$$
|\Delta\mathbf{v}| = \sqrt{0.5352} = 0.7316\,\mathrm{km/s}.
$$

**What it means.** A turn of only $5^\circ$ more than doubled the Δv. Rotating a fast-moving velocity costs propellant even when its size barely changes. That is why plane changes are expensive, and why lesson 5 exists.
:::

::: key Δv is a vector difference
$$
\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-, \qquad
|\Delta\mathbf{v}| = \sqrt{(v^-)^2 + (v^+)^2 - 2v^-v^+\cos\theta}.
$$
Position is continuous across an impulsive burn; only velocity jumps. Never subtract speeds when the directions differ.
:::

::: warning Subtracting speeds when the direction changes
The single most common Δv mistake is writing $v^+ - v^-$ when the two velocities point in different directions. The example above shows how badly it can miss: $0.300\,\mathrm{km/s}$ instead of $0.732\,\mathrm{km/s}$. If the direction changes at all, use the law of cosines.
:::

## When is a real burn "impulsive enough"?

Go back to the soccer ball. The kick is "instant" because the ball barely moves while your foot touches it. Now imagine pushing a shopping cart across a parking lot. Your push lasts the whole trip. Nobody would call that a kick.

A rocket burn can be either one. The question is how far the spacecraft travels around its orbit while the engine is running.

### How long does the burn take?

An engine produces a push called **thrust**, $T$, measured in newtons. On a vehicle of mass $m$ it gives an acceleration $a = T/m$. If that acceleration stays roughly constant, the time to build up a speed change $\Delta v$ is

$$
t_b \approx \frac{\Delta v}{a} = \frac{\Delta v \, m}{T}.
$$

$t_b$ is the **burn time**. This is only a first estimate. It ignores two things: the mass falls as propellant burns, and the best pointing direction slowly turns as the vehicle moves along its orbit.

Engineers often describe an engine by its **[[thrust-to-weight ratio|thrust-to-weight]]**, $T/W_0$: thrust divided by the vehicle's weight at standard gravity, $m g_0$. A ratio of $1$ means an acceleration of exactly $g_0$.

### How far around the orbit does it go?

While the engine runs, the vehicle keeps moving at roughly its orbital speed $v$. It covers a distance of about $v\,t_b$. On an orbit of radius $r$, that is an angle of about

$$
\text{swept angle} \approx \frac{v\,t_b}{r} \ \text{radians}.
$$

This is the **swept angle** — how much of the circle the burn smears across. (An angle in **[[radians|radians-arc]]** is arc length divided by radius.)

The impulsive model works well when the swept angle is small: roughly $15^\circ$ or less, a burn lasting a few percent of the orbital period. Only then is "the burn happened at one point" close to true. Only then does a thrust direction aimed once at ignition stay close to the best direction the whole way through. As the arc grows into the tens of degrees, the losses grow to several percent. Lesson 8 replaces this estimate with a real step-by-step simulation of the burn and measures the error directly. For now you only need the rough question: given a real $T$ and $m$, is $t_b$ a small slice of the orbital period, or not?

::: example Is this burn impulsive? Two engines, one Δv
Take the first burn of a transfer from a circular orbit of radius $r = 6678\,\mathrm{km}$ (about $300\,\mathrm{km}$ up). From the last module, the circular speed there is $v = 7.7258\,\mathrm{km/s}$ and the period is $5431\,\mathrm{s} = 90.5\,\mathrm{min}$. The burn is $\Delta v_1 = 2.4258\,\mathrm{km/s}$, the first burn of the trip toward geostationary orbit that lesson 2 derives.

**Engine 1: a chemical stage with $T/W_0 = 1.0$.** Its acceleration is $a = g_0 = 9.80665\times10^{-3}\,\mathrm{km/s^2}$.

- Burn time: $t_b \approx \dfrac{2.4258}{9.80665\times10^{-3}} = 247\,\mathrm{s}$, about $4.1\,\mathrm{min}$.
- Fraction of the period: $247 / 5431 = 0.046$, about $4.6\,\%$.
- Swept angle: $\dfrac{7.7258 \times 247}{6678} = 0.286\,\mathrm{rad}$. Multiply by $180/\pi$ to get degrees: about $16^\circ$.

That is small enough to treat the burn as instant for a first design. Lesson 8 finds the real loss for a burn like this to be about one percent of the Δv.

**Engine 2: a small [[electric thruster|electric-thruster]] with $T/W_0 = 0.001$** — a thousand times weaker. Its acceleration is a thousand times smaller, so everything scales up by a thousand:

- Burn time: $t_b \approx 2.47\times10^{5}\,\mathrm{s}$, which is $68.7\,\mathrm{hours}$.
- Fraction of the period: $2.47\times10^5 / 5431 \approx 45$ — about **45 whole orbits**.

The idea of "the point where the burn happened" has completely broken down. This is not a Hohmann transfer with a small correction. It is a different kind of trajectory — a slow spiral — and lesson 9 builds the tool (the Edelbaum result) for exactly this case.

**Sanity check.** The weaker engine's burn is a thousand times longer, as it must be when the acceleration is a thousand times smaller and the Δv is the same.
:::

::: key Rule of thumb for validity
Estimate $t_b \approx \Delta v\,m/T$ and compare it with the orbital period, or compare the swept angle $v\,t_b/r$ with $360^\circ$. Burn time a few percent of the period (a swept angle of up to about $15^\circ$) — impulsive is a good approximation. Tens of degrees — it still works, but with losses of several percent that must be budgeted. Burn time comparable to or longer than the period — it is not, and for burns many periods long the impulsive framework does not apply at all.
:::

::: warning Which mass?
$a = T/m$ uses the vehicle's *current* mass, and that mass falls throughout the burn as propellant leaves. The estimate above uses the starting mass. That makes it a slight overestimate of $t_b$: a real burn finishes a little sooner, because the same thrust pushes a lighter vehicle harder toward the end. Treat it as a first estimate. Lesson 8 simulates the burn properly, mass loss included, and shows exactly how much the simple estimate misses.
:::

::: warning Not every non-impulsive burn is a small correction
A burn that takes $5\,\%$ of a period and a burn that takes 45 periods are not two points on the same scale. Below some thrust-to-weight, the whole idea of an instant Δv at a point stops making sense. The right model is then not "a Hohmann transfer with losses" but a continuous low-thrust trajectory, covered in lesson 9. Working out which case you are in is the first decision in any real maneuver design.
:::

## Check yourself

::: check
A spacecraft's velocity changes from $6.90\,\mathrm{km/s}$ to $7.10\,\mathrm{km/s}$, with a $3^\circ$ turn between the two directions. Compute $|\Delta\mathbf{v}|$ and compare it with the naive guess $|v^+ - v^-|$.
:::

::: answer
Use the law of cosines, one piece at a time:

- $6.90^2 = 47.61$ and $7.10^2 = 50.41$.
- $2 \times 6.90 \times 7.10 = 97.98$, and $\cos 3^\circ = 0.99863$, so the last term is $97.98 \times 0.99863 = 97.846$.
- $47.61 + 50.41 - 97.846 = 0.174$.

So $|\Delta\mathbf{v}| = \sqrt{0.174} = 0.417\,\mathrm{km/s}$.

The naive guess is $7.10 - 6.90 = 0.200\,\mathrm{km/s}$ — more than a factor of two too small. Even a small angle matters when the speeds themselves are large.
:::

::: check
In terms of what stays continuous and what jumps, say exactly what an impulsive maneuver assumes about a spacecraft's path.
:::

::: answer
The position $\mathbf{r}$ is continuous across the maneuver — the spacecraft does not teleport. The velocity jumps from $\mathbf{v}^-$ to $\mathbf{v}^+$ at that one point, and the jump $\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-$ takes zero time.

Before that point the vehicle follows one Kepler orbit; after it, a different one. The two orbits have that single point in common — they cross there — but in general they head off in different directions from it.
:::

::: check
A $1200\,\mathrm{kg}$ spacecraft has a $300\,\mathrm{N}$ thruster and needs $\Delta v = 0.80\,\mathrm{km/s}$. The burn happens at $r = 7000\,\mathrm{km}$, where the orbital speed is about $7.55\,\mathrm{km/s}$. Estimate the burn time and the swept angle. Is treating this burn as impulsive reasonable?
:::

::: answer
**Acceleration:** $a = T/m = 300/1200 = 0.25\,\mathrm{m/s^2} = 2.5\times10^{-4}\,\mathrm{km/s^2}$.

**Burn time:** $t_b \approx \Delta v / a = 0.80 / (2.5\times10^{-4}) = 3200\,\mathrm{s}$, about $53.3\,\mathrm{min}$.

**Period at 7000 km:** $2\pi\sqrt{r^3/\mu} = 2\pi\sqrt{7000^3/398\,600.4418} \approx 5828\,\mathrm{s} = 97.1\,\mathrm{min}$. The burn uses $3200/5828 \approx 55\,\%$ of an orbit.

**Swept angle:** $v\,t_b/r = 7.55 \times 3200 / 7000 = 3.45\,\mathrm{rad} \approx 198^\circ$ — more than half the orbit.

That is far too much to call impulsive. This burn needs the finite-burn treatment of lesson 8, not a single Δv.
:::

::: check
Why does a very low thrust-to-weight ratio break the impulsive model in a different *kind* of way than a moderately long burn does?
:::

::: answer
A moderately long burn still happens over an arc that is a recognizable piece of one orbit. So it makes sense to ask: "how much Δv, and how much orbit error, compared with an instant burn at roughly this point?" That is exactly the finite-burn correction lesson 8 computes.

A very low thrust-to-weight burn can take many orbital periods to deliver the same Δv. The vehicle circles many times while thrusting, and the thrust direction sweeps around with it. There is no single point the burn happened at, and no single orbit it is a correction to. The orbit's shape changes continuously — a spiral. That needs the low-thrust methods of lesson 9, not a loss term added onto the impulsive answer.
:::

::: check
A mission's Δv budget totals $4.2\,\mathrm{km/s}$, flown on a stage with $I_{sp} = 311\,\mathrm{s}$. What fraction of the starting mass must be propellant?
:::

::: answer
**Exhaust velocity:** $v_e = I_{sp}\,g_0 = 311 \times 9.80665\times10^{-3} = 3.0498\,\mathrm{km/s}$.

**Exponent:** $\Delta v / v_e = 4.2 / 3.0498 = 1.3771$.

**Propellant fraction:** $1 - e^{-1.3771} = 1 - 0.2523 = 0.7477$, about $74.8\,\%$ of the starting mass.

Only about a quarter of the vehicle at ignition is left as structure, engine and payload at burnout. The rocket equation punishes a large Δv steeply — which is why every lesson from here on treats Δv as something to spend carefully.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-$ | Impulsive maneuver: instant velocity change, position continuous |
| $\lvert\Delta\mathbf{v}\rvert = \sqrt{(v^-)^2+(v^+)^2-2v^-v^+\cos\theta}$ | Law of cosines for a burn that changes direction as well as speed |
| $\Delta v = v_e\ln(m_0/m_f)$, $v_e = I_{sp}g_0$ | Rocket equation: turns a Δv budget into propellant mass |
| $m_p/m_0 = 1 - e^{-\Delta v/v_e}$ | Propellant fraction for a given Δv |
| $t_b \approx \Delta v\, m/T$ | First estimate of burn time for thrust $T$ and mass $m$ |
| Swept angle $\approx v t_b / r$ | How far around the orbit the burn smears |
| Validity check | Burn a few percent of the period (up to about $15^\circ$ of arc) $\Rightarrow$ impulsive is a good approximation |
| Breakdown | $t_b \gtrsim$ several periods $\Rightarrow$ not a correction to an impulsive burn; needs the low-thrust methods of lesson 9 |

Lessons 2 through 7 work entirely inside the instant-burn model you have now defined. The next lesson starts with the single most useful result in the subject: the two-burn Hohmann transfer between circular orbits. Lessons 8 and 9 then come back and ask what the model costs you — first for a moderately long burn, then for one so gentle it changes the whole shape of the problem.

::: context impulse-word Why "impulsive"
In physics an **impulse** is a force multiplied by the time it acts. A hammer blow and a gentle push can deliver the same impulse: a huge force for a moment, or a small force for a long time. Either way, the impulse divided by the mass is the change in velocity.

"Impulsive" in this module means the extreme case: all of the impulse delivered in no time at all. Real burns only approach it. A golf club touching the ball for about half a millisecond is close; a car accelerating onto a highway is not.
:::

::: context keplerian-orbit The orbit you coast on
Between burns, only gravity acts, so the spacecraft follows a **conic section** — circle, ellipse, parabola or hyperbola — with the planet's center at one focus. That is the two-body result from the last module, and these orbits are named after Johannes Kepler, who found the ellipse law in Mars observations in 1609.

The useful consequence: between burns you already know everything. Vis-viva gives the speed at any radius, and Kepler's third law gives the period. A maneuver is how you step from one known conic to the next.
:::

::: context specific-impulse Why specific impulse is measured in seconds
Picture the engine burning one kilogram of propellant. Specific impulse is how many seconds that kilogram could keep the engine pushing with a thrust equal to its own weight, about $9.8\,\mathrm{N}$. Multiply by $g_0$ and it becomes the exhaust speed: $I_{sp} = 300\,\mathrm{s}$ means $v_e \approx 2.94\,\mathrm{km/s}$.

Measuring it in seconds has a practical charm: the number is the same whether the engineers work in metric or US units. Typical values: about $220\,\mathrm{s}$ for a hydrazine thruster, $300$ to $350\,\mathrm{s}$ for storable or kerosene engines, about $450\,\mathrm{s}$ for hydrogen-oxygen, and $1500\,\mathrm{s}$ or more for electric thrusters.
:::

::: context monopropellant One liquid, no match needed
A **monopropellant** thruster uses a single liquid, usually hydrazine. The hydrazine flows over a hot catalyst bed and breaks apart into hot gas on its own — no second chemical and no igniter needed.

That makes it simple and reliable, which is why most small satellites use it for small attitude and orbit corrections. The price is a lower specific impulse, about $220$ to $230\,\mathrm{s}$, compared with about $300\,\mathrm{s}$ or more for engines that burn a fuel with a separate oxidizer.
:::

::: context velocity-triangle The velocity triangle
Put the tails of $\mathbf{v}^-$ and $\mathbf{v}^+$ together. The burn is the arrow from the tip of the old velocity to the tip of the new one. Even when the two arrows are nearly the same length, a small angle between long arrows leaves a gap that is not small.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="252" y2="170" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="260,170 250,175 250,165" fill="#1f2a44"/>
  <line x1="40" y1="170" x2="245.7" y2="74.1" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="253,70.7 246,79.4 241.8,70.4" fill="#1d6fd1"/>
  <line x1="260" y1="170" x2="253.7" y2="80.7" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <polygon points="253,70.7 258.7,80.3 248.7,81" fill="#b4232c"/>
  <path d="M90,170 A50,50 0 0,0 85.3,148.9" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="162" font-size="13" fill="#1f2a44">θ</text>
  <text x="150" y="190" font-size="13" fill="#1f2a44" text-anchor="middle">v⁻ (before)</text>
  <text x="120" y="112" font-size="13" fill="#1d6fd1" text-anchor="middle">v⁺ (after)</text>
  <text x="268" y="125" font-size="13" fill="#b4232c">Δv</text>
</svg>
```

The law of cosines is the rule for the third side of exactly this triangle.
:::

::: context thrust-to-weight Thrust-to-weight
Thrust-to-weight compares the engine's push with the vehicle's weight at Earth's surface, $m g_0$. A launch rocket needs more than $1$ even to leave the pad. In orbit nothing has to be held up, so any value works; it only sets how fast the speed changes.

A value of $1$ means the speed grows by about $9.8\,\mathrm{m/s}$ every second. An electric thruster on a small satellite might manage $10^{-4}$ — a speed change of about $1\,\mathrm{mm/s}$ each second.
:::

::: context radians-arc Why the swept angle comes out in radians
An angle in radians is arc length divided by radius, $\theta = s/r$. The burn smears the push along an arc of length about $v\,t_b$, so the angle is $v\,t_b/r$ with no conversion needed. Multiply by $180/\pi \approx 57.3$ to get degrees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="105" r="62" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="90" cy="105" r="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="152" cy="105" r="5" fill="#b4232c"/>
  <text x="90" y="190" font-size="12" fill="#1f2a44" text-anchor="middle">impulsive: one point</text>
  <circle cx="270" cy="105" r="62" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="270" cy="105" r="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M332,105 A62,62 0 0,0 329.48,87.49" fill="none" stroke="#b4232c" stroke-width="6"/>
  <line x1="270" y1="105" x2="332" y2="105" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="270" y1="105" x2="329.48" y2="87.49" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="270" y="30" font-size="12" fill="#b4232c" text-anchor="middle">4-minute burn: about 16°</text>
  <text x="270" y="190" font-size="12" fill="#1f2a44" text-anchor="middle">real burn: an arc</text>
</svg>
```

The arc on the right is drawn to scale for the $T/W_0 = 1$ example: $16^\circ$ out of $360^\circ$.
:::

::: context electric-thruster Electric thrusters
An electric thruster uses electricity from solar panels to throw charged gas (often xenon or krypton) out at very high speed — roughly 15 to 40 km/s, versus about 3 km/s for a chemical engine. That makes it extremely frugal with propellant.

The catch is power: a solar panel can only feed a thruster so fast, so the thrust is tiny, well under a newton for most spacecraft. Starlink satellites use Hall thrusters of this kind to climb from their drop-off orbit to their working altitude over weeks. Lesson 9 shows how to plan those slow spirals.
:::
