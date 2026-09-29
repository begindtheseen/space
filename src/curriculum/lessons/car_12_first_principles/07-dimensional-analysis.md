---
id: l07-dimensional-analysis
title: "Dimensional analysis as a live error check"
minutes: 21
covers:
  - dimensional analysis as a live error check
---

Imagine a recipe that says "add 2 cups of sugar plus 3 minutes." You would stop right there. Cups measure an amount and minutes measure time, and you cannot add them. Something was left out of the recipe, and you spotted it without knowing anything about baking.

That is the whole idea of **dimensional analysis** — checking that the *kinds* of quantity in a formula fit together. Every derivation in this module so far ended with a check like this, and none took more than fifteen seconds. Fifteen seconds spent, a whole class of mistakes caught: that trade is why it is the most valuable habit in the whiteboard round. It runs while you write. It needs no extra information. And it catches exactly the mistakes that pressure produces — a step of integration skipped, a division forgotten, a factor of $v$ that fell off a line.

It does a second thing, which candidates use far less than they should. When you cannot derive a result in the time you have, dimensions will often hand you its *form* — how the answer must grow or shrink with each input — leaving only a plain number unknown. "It must go as the square root of length over gravity, and the constant turns out to be $2\pi$" is a complete engineering answer, produced in ninety seconds.

This lesson covers both uses. It is also honest about a third thing: where dimensional analysis stops being able to help.

## The two rules

**Rule one: every term in a sum must have the same dimensions.** A **dimension** is the kind of thing a number measures — length, mass, time. You cannot add a force to a velocity, any more than sugar to minutes. This is the rule that catches errors, because a dropped factor almost always shows up as one term in a sum that no longer matches its neighbors.

**Rule two: whatever goes inside a [[transcendental function|transcendental]] must be dimensionless.** Exponentials, logarithms, sines and cosines only take pure numbers — numbers with no units at all, called **dimensionless**. $e^{-t/\tau}$ is fine: $t$ is a time and $\tau$ (the Greek letter "tau") is a time, so seconds cancel. But $e^{-t}$ with $t$ in seconds is not fine, and the missing $\tau$ is the error. This rule catches a whole family of mistakes in control loops and atmosphere models.

One thing follows from rule two. The logarithm of a *ratio* is always allowed, whatever units the two quantities have, because the units cancel inside. That is why $\ln(m_0/m_f)$ in the rocket equation is legitimate, and $\ln m_0$ on its own would not be.

::: key
Dimensional analysis as an error check: verify the dimensions of every term before trusting a result. A term that should be an acceleration and is coming out as a velocity means an integration or a division was dropped. Catching it yourself, live, is far better than being corrected.
:::

## The dimensions you need

Four **base dimensions** cover almost everything in this course: mass $M$, length $L$, time $T$, and temperature $\Theta$ (the Greek capital "theta"). Every other quantity is built from these. Velocity is a length per time, written $LT^{-1}$ and read "L T to the minus one". The minus power means "divided by".

Angle is dimensionless. A **[[radian|radian]]** is an arc length divided by a radius — a length over a length — so the units cancel. That is convenient, and it is also the source of one trap, covered near the end.

| Quantity | Dimensions | SI |
| --- | --- | --- |
| Velocity | $LT^{-1}$ | m/s |
| Acceleration | $LT^{-2}$ | $\mathrm{m/s^2}$ |
| Force | $MLT^{-2}$ | N |
| Pressure, stress | $ML^{-1}T^{-2}$ | Pa |
| Energy, work, torque | $ML^2T^{-2}$ | J, or N m |
| Power | $ML^2T^{-3}$ | W |
| Density | $ML^{-3}$ | $\mathrm{kg/m^3}$ |
| Moment of inertia | $ML^2$ | $\mathrm{kg\,m^2}$ |
| Angular rate | $T^{-1}$ | rad/s |
| Gravitational parameter $\mu$ | $L^3T^{-2}$ | $\mathrm{m^3/s^2}$ |
| Specific impulse | $T$ | s |

You can rebuild most rows from one fact: force is mass times acceleration, so a newton is $MLT^{-2}$. Pressure is force per area, so divide by $L^2$. Energy is force times distance, so multiply by $L$.

The last two rows are the ones to have memorized. The **gravitational parameter** $\mu$ (read "mu") is $GM$, the gravitational constant times the planet's mass. It has the dimensions of length cubed over time squared. That is why square roots of $\mu$ over a length keep turning up in orbital mechanics: $\sqrt{L^3T^{-2}/L} = LT^{-1}$, a speed.

And **[[specific impulse|specific-impulse]]**, $I_{sp}$ (read "I sub s p"), really does have the dimensions of time. That is an accident of history, not physics. The quantity that means something is the exhaust velocity $c = I_{sp}g_0$, where $g_0$ ("g nought") is standard gravity, $9.80665\,\mathrm{m/s^2}$.

## Using it live, as an error check

The drill is mechanical. That is what makes it usable when you are nervous.

1. **After every line**, name the dimensions of the term you have written, out loud, in three or four words: *"newtons — good"*, *"meters per second squared — good"*.
2. **When a sum appears**, check the terms against each other rather than against what you meant to write. You are hunting for the mismatch, not judging correctness in general.
3. **When something fails**, state the mismatch as a ratio of dimensions. *"That is a velocity and it needs to be an acceleration, so I am missing a divide by time."* The ratio tells you what kind of error to look for, and usually finds it in one line.

That third step is what makes this a [[useful check rather than a panicked one|error-drill]]. A dimensional mismatch is never mysterious. It names the missing factor.

::: example Catching a dropped $1/v$ mid-derivation
Suppose you are deriving the gravity turn from lesson 5 under time pressure. There, $\gamma$ ("gamma") is the flight-path angle — how steeply the rocket is climbing — and $\dot\gamma$ ("gamma dot") is how fast that angle changes. You write

$$
\dot\gamma = -g\cos\gamma.
$$

It looks plausible. The gravity term is there, the cosine is there, the sign is right.

**The check.** The left side is an angular rate: dimensions $T^{-1}$, units rad/s. The right side is an acceleration: $LT^{-2}$, units $\mathrm{m/s^2}$. (The cosine is a pure number, so it adds nothing.) They do not match.

**The diagnosis.** Divide what you wrote by what you need: $LT^{-2}/T^{-1} = LT^{-1}$ — a velocity. So the right-hand side must be divided by a velocity. There is exactly one velocity in the problem, the speed $v$.

**The repair.** $\dot\gamma = -(g/v)\cos\gamma$. Check again: $\mathrm{m/s^2}$ divided by $\mathrm{m/s}$ gives $\mathrm{s^{-1}}$. It matches.

**Why it matters in numbers.** At $v = 500\,\mathrm{m/s}$ and $\gamma = 45^\circ$, the correct rate is

$$
\dot\gamma = -\frac{9.80665}{500}\times 0.70711 = -0.01387\,\mathrm{rad/s},
$$

a bit under one degree per second — a gentle pitch-over, as it should be. The wrong expression gives $-9.80665 \times 0.70711 = -6.934$, which read as a rate is nearly four hundred degrees per second. Absurd on its face. But you might not notice that in the middle of a derivation, whereas the dimension check is impossible to miss.

**What to say.** *"That is coming out as an acceleration and it needs to be a rate, so I am missing a divide by speed — and I know where it came from: the inertia term was $mv\dot\gamma$, not $m\dot\gamma$."* Eight seconds, and the interviewer has watched you catch your own error and explain where it came from.
:::

::: warning Check terms against each other, not against your hopes
The check only works if you actually name the dimensions of each term. Glancing at an equation and feeling that it "looks like physics" is not a check — $\dot\gamma = -g\cos\gamma$ looked fine. Say the dimensions out loud, term by term.
:::

## Using it to construct a result

When the physics is clear but the algebra is long, dimensions can hand you the answer's shape. The method has three steps:

1. List every quantity the answer could depend on.
2. Write the answer as a product of powers of them, with unknown exponents.
3. Match the powers of $M$, $L$ and $T$ on both sides, and solve for the exponents.

The symbol $\propto$ (read "is proportional to") means "equals, apart from a plain-number constant".

::: example Three results recovered from dimensions alone
**The orbital period.** A circular orbit is described by its radius $a$ and the gravitational parameter $\mu$. Nothing else is available. The satellite's mass cannot appear: it is not in the list, and nothing could cancel its $M$. Write $P \propto a^{x}\mu^{y}$ for the period $P$ and match dimensions:

$$
T^{1} = L^{x}\left(L^{3}T^{-2}\right)^{y} \;\Longrightarrow\; -2y = 1,\quad x + 3y = 0.
$$

The time powers give $-2y = 1$, so $y = -1/2$. The length powers give $x + 3y = 0$, so $x = 3/2$. Therefore $P \propto \sqrt{a^3/\mu}$ — this is **[[Kepler's third law|kepler]]**, obtained without solving anything. The unknown plain-number constant happens to be $2\pi$.

*Check it with numbers.* Take $a = 6.771\times 10^6\,\mathrm{m}$ (a 400 km orbit) and $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$. Then $a^3/\mu = 7.788\times 10^5\,\mathrm{s^2}$, and $\sqrt{7.788\times 10^5} = 882.5\,\mathrm{s}$. Multiply by $2\pi$: 5545 s, which is 92.4 minutes — the familiar period of a low Earth orbit.

**The drag force.** Drag $D$ can depend on air density $\rho$ ("rho"), speed $v$ and a reference area $S$. Write $D \propto \rho^{a}v^{b}S^{c}$ (here $a$, $b$, $c$ are unknown exponents, not the orbit radius) and match force, $MLT^{-2}$:

- Mass: only $\rho$ carries $M$, so $a = 1$.
- Time: only $v$ carries $T$, as $T^{-1}$, so $-b = -2$ and $b = 2$.
- Length: $-3a + b + 2c = 1$, so $-3 + 2 + 2c = 1$ and $c = 1$.

Therefore $D \propto \rho v^2 S$. That is the drag equation, with the plain-number group $\tfrac12 C_D$ left over ($C_D$ is the drag coefficient). The $v^2$ came out of the dimensions, not out of any aerodynamics.

**The pendulum.** A pendulum's period can depend on its length $\ell$, gravity $g$ and its mass $m$. Matching dimensions makes the exponent of $m$ zero, because nothing else in the list carries mass. Then $P \propto \sqrt{\ell/g}$. For $\ell = 1\,\mathrm{m}$, with the constant $2\pi$, that is $2\pi\sqrt{1/9.80665} = 2.01\,\mathrm{s}$ — about the tick of a tall grandfather clock.

**The prediction worth noticing.** "The period does not depend on the mass" is a statement about the physical world, and it came from bookkeeping. That is the strongest thing dimensional analysis does. Reach for it when an interviewer asks how something scales.
:::

::: note Why the exponent of a lonely dimension must be zero
Suppose mass appears in only one quantity on the list, say $m$, with exponent $z$. The product then carries $M^z$ and nothing else can cancel it. The answer is a time, $M^0L^0T^1$, so matching the powers of $M$ gives $z = 0$. No physics went in; the conclusion is forced by requiring both sides to be the same kind of quantity. The same argument breaks down as soon as two quantities carry mass, because then their exponents only need to *add* to zero.
:::

::: example A power estimate checked before it is trusted
**The setting.** You are estimating the electrical power a satellite's solar array produces. You write $P = S A \eta$, where $S$ is the **[[solar constant|solar-constant]]** (the sunlight power landing on each square meter near Earth), $A$ is the array area and $\eta$ ("eta") is the cell efficiency.

**The check.** The solar constant is power per area, $\mathrm{W/m^2}$. A watt is $ML^2T^{-3}$, so dividing by $L^2$ leaves $MT^{-3}$. Area is $L^2$. Efficiency is dimensionless. The product is $MT^{-3}\times L^2 = ML^2T^{-3}$, which is power. It checks.

**Now a deliberately wrong version.** Suppose you had written $P = S A^2\eta$, reasoning loosely that "bigger panels help twice". The dimensions become $ML^4T^{-3}$, which is not power, and the check kills it at once. Put in numbers: $S = 1361\,\mathrm{W/m^2}$, $A = 10\,\mathrm{m^2}$, $\eta = 0.30$.

- Correct: $1361 \times 10 \times 0.30 = 4083\,\mathrm{W}$, about 4 kW.
- Wrong: $1361 \times 10^2 \times 0.30 = 40\,830$ — "forty kilowatts".

Forty kilowatts is absurd for a small satellite — but only if you already know what small satellites use. The dimension check does not need you to know that.

**The general lesson.** Dimensional checking needs no knowledge of the answer. It works on problems where you have no feel for the size of the result, which is exactly where you need a check most.
:::

## Where dimensional analysis cannot help

Knowing the limits is part of using the tool well, and an interviewer may probe them.

**It never gives the plain-number constants.** $2\pi$, $\tfrac12$, $C_D$, the 12 in a rod's moment of inertia $mL^2/12$: none can be recovered. Dimensions give you the scaling. You supply the constant from a derivation, from data, or by saying it is "of order one".

**Different quantities can share dimensions.** Torque and energy are both $ML^2T^{-2}$. The check cannot tell them apart, so writing a torque where an energy belongs will pass. In the same way, angular rate (rad/s) and frequency (cycles per second) are both $T^{-1}$. So a factor of $2\pi$ between them is invisible to the method — a classic source of answers that are out by exactly $2\pi$ or $(2\pi)^2$. Units that match in kind but differ in size, like newtons and pounds-force, also slip through; that is how a [[real spacecraft was lost|mars-climate-orbiter]].

**Angles are dimensionless, so degrees and radians look identical.** The equation $\dot\gamma = -(g/v)\cos\gamma$ is dimensionally consistent whether $\dot\gamma$ is in rad/s or deg/s, and only one of them is right. Write the unit in words beside the symbol, not only the dimension.

**With more than one dimensionless group, the form is not fixed.** Suppose the answer can depend on both a **[[Reynolds number|reynolds-mach]]** and a **Mach number** — two different plain-number ratios that describe a flow. Then dimensional analysis gives you an unknown function of two variables, not a formula. That is still useful — it tells you what to plot against what — but it is not an answer.

::: warning Specific impulse in seconds is a trap that passes the check
Write $\Delta v = I_{sp}\ln(m_0/m_f)$ and the answer comes out in seconds, not meters per second, so this slip is caught. Write a mass flow as $\dot m = T/I_{sp}$ and you get $\mathrm{N/s}$, which is off by $g_0$ — and $\mathrm{N/s}$ is visibly not $\mathrm{kg/s}$, so that is caught too. The dangerous version is using $I_{sp}$ in seconds inside an expression where the $g_0$ has already been absorbed somewhere else. Then the dimensions balance and the number is wrong by a factor of 9.8. The defense: convert $I_{sp}$ to $c = I_{sp}g_0$ the moment you write it down.
:::

## Check yourself

::: check
A candidate writes the dynamic pressure as $\bar q = \rho v$. Catch the error with dimensions and repair it.
:::

::: answer
Dynamic pressure must have the dimensions of pressure, $ML^{-1}T^{-2}$. The proposed expression has $ML^{-3}\times LT^{-1} = ML^{-2}T^{-1}$.

Divide what is needed by what is written: $ML^{-1}T^{-2}/(ML^{-2}T^{-1}) = LT^{-1}$ — a velocity. So one more factor of $v$ is missing: $\bar q \propto \rho v^2$, and the plain-number constant is $\tfrac12$.

With numbers, at $\rho = 0.364\,\mathrm{kg/m^3}$ and $v = 447\,\mathrm{m/s}$: $0.5 \times 0.364 \times 447^2 = 36\,365\,\mathrm{Pa}$, about 36 kPa — a believable **[[max-Q|max-q]]**, the peak aerodynamic load on a climbing rocket. The wrong version would have given 163, in units that are not pressure at all.
:::

::: check
Why can dimensional analysis prove that a pendulum's period does not depend on its mass, but not that a rocket's $\Delta v$ does not depend on its mass?
:::

::: answer
In the pendulum problem, mass is the *only* quantity on the list carrying the dimension $M$. Its exponent must therefore be zero for the product to be a time — and that is a proof.

In the rocket problem there are two masses, $m_0$ and $m_f$, and their exponents only need to add to zero. So dimensional analysis allows any function of the ratio $m_0/m_f$, which is dimensionless — and the real answer is indeed a logarithm of that ratio. The method tells you the answer depends on the masses only through their ratio, which is genuinely useful. But it cannot produce the logarithm.

The general rule: dimensional analysis removes a variable only when nothing else can balance its dimension.
:::

::: check
An interviewer gives you a quantity you have never met — the "ballistic coefficient" $\beta = m/(C_D S)$ — and asks what its dimensions are and what that tells you.
:::

::: answer
$m$ is $M$, $C_D$ is dimensionless and $S$ is $L^2$. So $\beta$ ("beta") has dimensions $ML^{-2}$, units $\mathrm{kg/m^2}$.

What that tells you: mass per unit of front-facing area is the ratio that decides how strongly air slows a body down. The drag deceleration is $D/m = \tfrac12\rho v^2 C_D S/m = \tfrac12\rho v^2/\beta$. Its dimensions are $ML^{-3}\times L^2T^{-2}/(ML^{-2}) = LT^{-2}$, an acceleration, as it should be.

So a high ballistic coefficient means a body that punches deep into the atmosphere and slows late and hard — like a bowling ball. A low one means it slows high up — like a badminton shuttlecock. That whole qualitative conclusion came from the dimensions of a symbol you had never seen, which shows how far the method reaches.
:::

::: check
Recover the form of the escape velocity from a body with gravitational parameter $\mu$, at radius $r$, using dimensions only. Then say what the method could not tell you.
:::

::: answer
Write $v_{\text{esc}} \propto \mu^{x}r^{y}$ and match a velocity, $LT^{-1}$:

$$
LT^{-1} = \left(L^3T^{-2}\right)^{x}L^{y} \;\Longrightarrow\; -2x = -1,\quad 3x + y = 1.
$$

So $x = 1/2$ and $y = -1/2$, giving $v_{\text{esc}} \propto \sqrt{\mu/r}$.

What the method cannot tell you is the constant, which is $\sqrt{2}$. Nor can it tell you that the same scaling with a different constant — namely 1 — is the circular orbit speed. Two physically different quantities with identical scaling is exactly the ambiguity dimensional analysis leaves behind.

With $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$ and $r = 6.771\times 10^6\,\mathrm{m}$, $\sqrt{\mu/r} = 7673\,\mathrm{m/s}$. Escape from that radius is $\sqrt{2}$ times that, about 10.85 km/s.
:::

::: check
You are mid-derivation, and a term that should be a moment, in newton meters, is coming out in newtons. What single question do you ask yourself, and why is that faster than rereading the algebra?
:::

::: answer
*"Where did a length go?"* The ratio of what you need to what you have is $ML^2T^{-2}/(MLT^{-2}) = L$, so exactly one factor of length is missing. In a moment calculation there are very few candidates — usually a moment arm or a lever distance.

It is faster than rereading because it turns an open search ("find my mistake") into a closed one ("find the missing length"). At a whiteboard with someone watching, an open search looks like a stall, and a closed one looks like diagnosis. Say the closed version out loud: *"I am a length short — I think I dropped the moment arm when I substituted."*
:::

## Summary

| Item | Statement |
| --- | --- |
| Rule one | Every term in a sum has the same dimensions |
| Rule two | Arguments of $\exp$, $\ln$, $\sin$, $\cos$ are dimensionless |
| Base dimensions | $M$, $L$, $T$, $\Theta$; angle is dimensionless |
| $\mu$ | $L^3T^{-2}$, $\mathrm{m^3/s^2}$ |
| $I_{sp}$ | Dimensions of time; convert to $c = I_{sp}g_0$ immediately |
| Error drill | Name the dimensions of each term; on a mismatch, state the ratio, which names the missing factor |
| Construction | Write the target as a product of powers and solve for the exponents |
| Recovered forms | $P\propto\sqrt{a^3/\mu}$; $D\propto\rho v^2S$; $P\propto\sqrt{\ell/g}$; $v_{\text{esc}}\propto\sqrt{\mu/r}$ |
| Limits | No dimensionless constants; torque and energy share dimensions; radians and degrees both dimensionless; two dimensionless groups leave an unknown function |

That completes the derivation half of the module. The next three lessons turn to the other kind of problem this round asks: an estimate with no data, where there is no equation to derive and the whole answer is a breakdown you build and defend.

::: context transcendental Where "transcendental" comes from
A **transcendental function** is one that cannot be built from a finite number of additions, multiplications and roots — exponentials, logarithms, sines and cosines are the everyday ones. The name means "going beyond" ordinary algebra.

Why must their inputs be pure numbers? Write $e^x$ as its series: $1 + x + x^2/2 + x^3/6 + \dots$. If $x$ were in seconds, you would be adding plain numbers to seconds and seconds squared — rule one broken on every term. The only way the sum makes sense is if $x$ has no units at all.
:::

::: context radian A radian is a length over a length
Take a circle, and walk along its edge a distance equal to its radius. The angle you have turned through, seen from the center, is one **radian** — about $57.3^\circ$. Because a radian is defined as arc length divided by radius, meters cancel meters and nothing is left. That is why angles carry no dimension, and why $2\pi$ radians make a full turn: the edge is $2\pi$ radii long.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="90" r="70" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="120" y1="90" x2="190" y2="90" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="90" x2="157.82" y2="31.10" stroke="#1f2a44" stroke-width="2"/>
  <path d="M190,90 A70,70 0 0,0 157.82,31.10" fill="none" stroke="#1d6fd1" stroke-width="4"/>
  <path d="M140,90 A20,20 0 0,0 130.81,73.17" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="155" y="106" font-size="12" fill="#1f2a44" text-anchor="middle">r</text>
  <text x="128" y="55" font-size="12" fill="#1f2a44">r</text>
  <text x="192" y="55" font-size="12" fill="#1d6fd1">arc = r</text>
  <text x="146" y="82" font-size="11" fill="#b4232c">1 rad</text>
  <text x="228" y="80" font-size="12" fill="#1f2a44">angle = arc / radius</text>
  <text x="228" y="100" font-size="12" fill="#1f2a44">= m / m = no units</text>
  <text x="228" y="120" font-size="12" fill="#1f2a44">1 rad ≈ 57.3°</text>
</svg>
```
:::

::: context specific-impulse Why specific impulse is measured in seconds
Specific impulse is thrust divided by the *weight* of propellant burned each second. Newtons divided by newtons per second leaves seconds. Engineers chose weight rather than mass partly so the number would come out the same in metric and in US units, where "pound" was used for both force and mass. The price is the stray $g_0$: multiply by $9.80665\,\mathrm{m/s^2}$ and you get the exhaust velocity, the number the physics uses. A kerosene engine at around 300 s has an exhaust velocity of about $300 \times 9.80665 \approx 2940\,\mathrm{m/s}$.
:::

::: context error-drill The drill as a loop
The error drill is a small loop you run on every line. Name the dimensions; compare the terms; if they match, move on; if not, divide one by the other, and the ratio names what is missing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 166" font-family="Inter, Arial, sans-serif">
  <text x="180" y="16" font-size="11" text-anchor="middle" fill="#1d6fd1">yes: next line</text>
  <path d="M304,36 C304,18 56,18 56,32" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="56,36 52,28 60,28" fill="#1d6fd1"/>
  <rect x="8" y="36" width="96" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="56" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">write a line</text>
  <rect x="132" y="36" width="96" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">name each</text>
  <text x="180" y="68" font-size="12" text-anchor="middle" fill="#1f2a44">term's dims</text>
  <rect x="256" y="36" width="96" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="304" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">terms match?</text>
  <line x1="104" y1="56" x2="128" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="132,56 124,52 124,60" fill="#1f2a44"/>
  <line x1="228" y1="56" x2="252" y2="56" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="256,56 248,52 248,60" fill="#1f2a44"/>
  <line x1="304" y1="76" x2="304" y2="112" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="304,116 300,108 308,108" fill="#b4232c"/>
  <text x="312" y="98" font-size="11" fill="#b4232c">no</text>
  <rect x="200" y="116" width="152" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="276" y="134" font-size="12" text-anchor="middle" fill="#1f2a44">ratio = the missing</text>
  <text x="276" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">factor (e.g. 1/v)</text>
</svg>
```
:::

::: context kepler Kepler found it from data
Johannes Kepler published his third law in 1619, after years of fitting the planets' measured orbits: the square of a planet's period is proportional to the cube of its distance from the Sun. He had no theory of gravity; Newton explained it decades later. Dimensional analysis gets the same shape in a few lines, given only that $\mu$ and $a$ are the ingredients. What neither Kepler's data nor the dimensions give you directly is the $2\pi$ — that takes the actual orbit calculation.
:::

::: context solar-constant How much sunlight reaches us
At Earth's average distance from the Sun, each square meter facing the Sun receives about $1361\,\mathrm{W}$ — roughly the power of a small electric heater, from an area the size of a doormat. Satellites see all of it. On the ground, air and clouds take a share, so a sunny noon gives closer to $1000\,\mathrm{W/m^2}$. The value changes by about three percent over the year, because Earth's orbit is slightly oval.
:::

::: context mars-climate-orbiter Right dimensions, wrong units
In 1999 NASA lost the Mars Climate Orbiter. Ground software from one team reported thruster impulse in pound-force seconds; the navigation software expected newton-seconds. Both are impulses — the dimensions match perfectly — so no dimensional check could have caught it. The numbers were off by a factor of about 4.45, the spacecraft's path drifted, and it came in far too low at Mars and was lost. The lesson: dimensions check the *kind* of quantity; you still have to carry the *unit*.
:::

::: context reynolds-mach Two famous plain-number ratios
The **Reynolds number** compares how hard a flowing fluid's momentum pushes against how strongly its stickiness (viscosity) resists. It decides whether flow is smooth or turbulent. The **Mach number** is speed divided by the speed of sound; Mach 1 is where shock waves appear. Both are dimensionless, and drag on a rocket depends on both. That is why wind-tunnel engineers plot drag coefficient against Mach number at a given Reynolds number, rather than hoping for a single formula.
:::

::: context max-q The hardest squeeze of the climb
Dynamic pressure is $\tfrac12\rho v^2$: the push of the oncoming air. On the way up, speed rises while the air thins. Early on the speed wins and the pressure grows; later the thinning wins and it falls. The peak in between is **max-Q**, usually about a minute after launch, and many rockets throttle down through it to protect the structure. Tens of kilopascals is typical.
:::
