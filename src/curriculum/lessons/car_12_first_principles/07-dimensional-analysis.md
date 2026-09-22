---
id: l07-dimensional-analysis
title: "Dimensional analysis as a live error check"
minutes: 19
covers:
  - dimensional analysis as a live error check
---

Every derivation in this module so far has ended with a units check, and it has never taken more than fifteen seconds. That ratio — seconds spent against errors caught — is why dimensional analysis is the single highest-value habit in this round. It runs while you write, it needs no extra information, and it catches exactly the class of mistake that whiteboard pressure produces: a dropped integration, a missing division, a factor of $v$ that fell off a line.

It does something else too, which candidates use far less often than they should. When you cannot derive a result in the time available, dimensional analysis will often hand you its *form* — the way the answer must scale with each input — leaving only a dimensionless constant unknown. An answer that says "it must go as the square root of length over gravity, and the constant turns out to be $2\pi$" is a complete engineering answer produced in ninety seconds.

This lesson covers both uses, and is honest about the third thing, which is where dimensional analysis stops being able to help.

## The two rules

**Rule one: every term in a sum must have the same dimensions.** You cannot add a force to a velocity. This is the rule that does the error-checking, because a dropped factor almost always shows up as one term in a sum no longer matching its neighbours.

**Rule two: the argument of any transcendental function must be dimensionless.** Exponentials, logarithms, sines and cosines take pure numbers. $e^{-t/\tau}$ is fine; $e^{-t}$ with $t$ in seconds is not, and the missing $\tau$ is the error. This one catches a whole family of mistakes in control and in atmospheric models.

A corollary of rule two worth stating: a logarithm of a *ratio* is dimensionless whatever the units of the two quantities, which is why $\ln(m_0/m_f)$ in the rocket equation is legitimate and $\ln m_0$ would not be.

::: key
Dimensional analysis as an error check: verify the dimensions of every term before trusting a result. A term that should be an acceleration and is coming out as a velocity means an integration or a division was dropped. Catching it yourself, live, is far better than being corrected.
:::

## The dimensions you need

Four base dimensions cover almost everything in this curriculum: mass $M$, length $L$, time $T$, and temperature $\Theta$. Angle is dimensionless — a radian is a length divided by a length — which is both convenient and the source of one recurring trap, covered below.

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

The last two are the ones to have memorised. $\mu = GM$ has the dimensions of length cubed over time squared, which is why square roots of $\mu$ over a length keep appearing in orbital mechanics. And specific impulse genuinely has the dimensions of time, which is a piece of notational history rather than physics — the quantity that means something is $c = I_{sp}g_0$, a velocity.

## Using it live, as an error check

The drill is mechanical, which is what makes it usable under pressure.

1. **After every line**, name the dimensions of the term you just wrote, out loud, in three or four words: *"newtons — good"*, *"metres per second squared — good"*.
2. **When a sum appears**, check the terms against each other rather than against your intention. It is the mismatch you are looking for, not correctness in the abstract.
3. **When something fails**, state the discrepancy as a ratio of dimensions. *"That is a velocity and it needs to be an acceleration, so I am missing a divide by time."* The ratio tells you what kind of error to look for and usually finds it in one line.

That third step is what separates a useful check from a panicked one. A dimensional mismatch is never mysterious: it names the missing factor.

::: example Catching a dropped $1/v$ mid-derivation
Suppose, deriving the gravity turn under time pressure, you write

$$
\dot\gamma = -g\cos\gamma.
$$

It looks plausible — the gravity term is there, the cosine is there, the sign is right.

**The check.** The left side is an angular rate, dimensions $T^{-1}$, units rad/s. The right side is an acceleration, $LT^{-2}$, units $\mathrm{m/s^2}$. They do not match.

**The diagnosis.** The ratio of the wrong side to the right side is $LT^{-2}/T^{-1} = LT^{-1}$ — a velocity. So a velocity has been divided out somewhere and should not have been, or equivalently the right-hand side needs to be divided by a velocity. There is exactly one velocity in the problem.

**The repair.** $\dot\gamma = -(g/v)\cos\gamma$. Check again: $\mathrm{m/s^2}$ divided by $\mathrm{m/s}$ gives $\mathrm{s^{-1}}$. ✓

**Numerically, why it matters.** At $v = 500\,\mathrm{m/s}$ and $\gamma = 45^\circ$ the correct rate is $-0.01387\,\mathrm{rad/s}$. The dimensionally wrong expression gives $-9.80665 \times 0.70711 = -6.934$, which read as a rate would be nearly four hundred degrees per second. Absurd on its face — but you would not necessarily have noticed that mid-derivation, whereas the dimensional check is unmissable.

**What to say.** *"That is coming out as an acceleration and it needs to be a rate, so I am missing a divide by speed — and I know where it came from: the inertia term was $mv\dot\gamma$, not $m\dot\gamma$."* Eight seconds, and the interviewer has watched you catch your own error and explain its origin.
:::

## Using it to construct a result

When the physics is clear but the algebra is long, dimensions can hand you the answer's form. The method: list the quantities the answer can depend on, write the target as a product of powers of them, and solve for the exponents by matching dimensions.

::: example Three results recovered from dimensions alone
**The orbital period.** A circular orbit is characterised by its radius $a$ and the gravitational parameter $\mu$. Nothing else is available — not the satellite's mass, which cannot appear because it is not in the list and no combination could cancel it. Write $P \propto a^{x}\mu^{y}$ and match:

$$
T^{1} = L^{x}\left(L^{3}T^{-2}\right)^{y} \;\Longrightarrow\; -2y = 1,\quad x + 3y = 0,
$$

so $y = -1/2$ and $x = 3/2$. Therefore $P \propto \sqrt{a^3/\mu}$ — Kepler's third law, obtained without solving anything. The unknown dimensionless constant happens to be $2\pi$.

*Check it numerically.* At $a = 6.771\times 10^6\,\mathrm{m}$ with $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$: $a^3/\mu = 7.788\times 10^5\,\mathrm{s^2}$, and $\sqrt{7.788\times 10^5} = 882.5\,\mathrm{s}$. Multiply by $2\pi$: 5545 s, which is 92.4 minutes — the familiar low-Earth-orbit period.

**The drag force.** Drag can depend on air density $\rho$, speed $v$ and a reference area $S$. Write $D \propto \rho^{a}v^{b}S^{c}$ and match $MLT^{-2}$:

- Mass: $a = 1$.
- Time: $-b = -2$, so $b = 2$.
- Length: $-3a + b + 2c = 1$, so $-3 + 2 + 2c = 1$ and $c = 1$.

Therefore $D \propto \rho v^2 S$, which is the drag equation with the dimensionless group $\tfrac12 C_D$ left over. The $v^2$ came out of the dimensions, not out of any aerodynamics.

**The pendulum.** A pendulum's period can depend on its length $\ell$, gravity $g$ and its mass $m$. Matching gives the exponent of $m$ as zero — there is no other source of mass in the list, so it cannot appear at all. Then $P \propto \sqrt{\ell/g}$, and for $\ell = 1\,\mathrm{m}$ the constant $2\pi$ gives 2.01 s.

**The prediction worth noticing.** "The period does not depend on the mass" is a physical statement, derived here from bookkeeping. That is the strongest thing dimensional analysis does, and it is the move to reach for when an interviewer asks how something scales.
:::

::: example A power estimate checked before it is trusted
**The setting.** Estimating the electrical power a satellite's solar array produces, you write $P = S A \eta$, with $S$ the solar constant, $A$ the array area and $\eta$ the cell efficiency.

**The check.** The solar constant is an irradiance: power per unit area, $\mathrm{W/m^2}$, dimensions $MT^{-3}$. Area is $L^2$. Efficiency is dimensionless. Product: $MT^{-3}\times L^2 = ML^2T^{-3}$, which is power. ✓

**Now a deliberately wrong version.** Suppose instead you had written $P = S A^2\eta$, reasoning loosely that "bigger panels help twice". The dimensions become $ML^4T^{-3}$, which is not power, and the check kills it immediately. With $S = 1361\,\mathrm{W/m^2}$ and $A = 10\,\mathrm{m^2}$ at $\eta = 0.30$, the correct expression gives $1361 \times 10 \times 0.30 = 4083\,\mathrm{W}$ while the wrong one gives forty kilowatts — an absurd number for a small satellite, but absurd only if you already know what small satellites draw. The dimensional check does not require you to know that.

**The general lesson.** Dimensional checking is knowledge-free. It works on problems where you have no intuition for the magnitude, which is exactly where you need a check most.
:::

## Where dimensional analysis cannot help

Being clear about the limits is part of using it well, and an interviewer may probe them.

**It never gives dimensionless constants.** $2\pi$, $\tfrac12$, $C_D$, the 3 in $mL^2/12$: none of these can be recovered. Dimensional analysis gives you the scaling and you supply the constant from a derivation, from data, or by saying it is of order one.

**Different quantities can share dimensions.** Torque and energy are both $ML^2T^{-2}$; a check cannot tell them apart, and writing a torque where an energy belongs will pass. Similarly, angular rate and frequency are both $T^{-1}$, so a factor of $2\pi$ between them is invisible to the method — a classic source of errors that are exactly $2\pi$ or $(2\pi)^2$ out.

**Angles are dimensionless, so degrees and radians look identical.** The equation $\dot\gamma = -(g/v)\cos\gamma$ is dimensionally consistent whether you put $\dot\gamma$ in rad/s or deg/s, and only one of them is right. Carry the unit in words beside the symbol, not only the dimension.

**With more than one dimensionless group, the form is not determined.** If the answer can depend on both a Reynolds number and a Mach number, dimensional analysis gives you an unknown function of two variables rather than a formula. That is still useful — it tells you what to plot against what — but it is not an answer.

::: warning Specific impulse in seconds is a trap that passes the check
Write $\Delta v = I_{sp}\ln(m_0/m_f)$ and the units come out as seconds, not metres per second, so this one is caught. But write a mass flow as $\dot m = T/I_{sp}$ and you get $\mathrm{N/s}$, which is wrong by $g_0$ — and $\mathrm{N/s}$ is visibly not $\mathrm{kg/s}$, so it is caught too. The genuinely dangerous version is using $I_{sp}$ in seconds inside an expression where the $g_0$ has already been absorbed elsewhere; then the dimensions balance and the number is out by a factor of 9.8. The defence is to convert $I_{sp}$ to $c = I_{sp}g_0$ the moment you write it down.
:::

## Check yourself

::: check
A candidate writes the dynamic pressure as $\bar q = \rho v$. Catch the error dimensionally and repair it.
:::

::: answer
Dynamic pressure must have the dimensions of pressure, $ML^{-1}T^{-2}$. The proposed expression has $ML^{-3}\times LT^{-1} = ML^{-2}T^{-1}$.

The ratio of what is needed to what is written is $ML^{-1}T^{-2}/(ML^{-2}T^{-1}) = LT^{-1}$ — a velocity. So one more factor of $v$ is missing: $\bar q \propto \rho v^2$, and the dimensionless constant is $\tfrac12$.

Numerically, at $\rho = 0.364\,\mathrm{kg/m^3}$ and $v = 447\,\mathrm{m/s}$: $0.5 \times 0.364 \times 447^2 = 36365\,\mathrm{Pa}$, about 36 kPa, a plausible max-Q. The dimensionally wrong version would have given 163, in units that are not pressure at all.
:::

::: check
Why can dimensional analysis prove that a pendulum's period is independent of its mass, but not that a rocket's $\Delta v$ is independent of its mass?
:::

::: answer
Because in the pendulum problem, mass is the *only* quantity in the list carrying the dimension $M$. Its exponent must therefore be zero for the product to have dimensions of time, and that is a proof.

In the rocket problem there are two masses, $m_0$ and $m_f$, and their exponents need only sum to zero. Dimensional analysis therefore permits any function of the ratio $m_0/m_f$, which is dimensionless — and indeed the answer is a logarithm of that ratio. The method tells you the answer depends on the masses only through their ratio, which is genuinely useful, but it cannot produce the logarithm.

The general rule: dimensional analysis eliminates a variable only when nothing else can balance its dimension.
:::

::: check
An interviewer gives you a quantity you have never met — the "ballistic coefficient" $\beta = m/(C_D S)$ — and asks what its dimensions are and what that tells you.
:::

::: answer
$m$ is $M$, $C_D$ is dimensionless and $S$ is $L^2$, so $\beta$ has dimensions $ML^{-2}$, units $\mathrm{kg/m^2}$.

What that tells you: mass per unit frontal area is the ratio that decides how strongly a body is decelerated by air. The drag deceleration is $D/m = \tfrac12\rho v^2 C_D S/m = \tfrac12\rho v^2/\beta$ — dimensions $ML^{-3}\times L^2T^{-2}/(ML^{-2}) = LT^{-2}$, an acceleration. ✓

So a high ballistic coefficient means a body that punches through the atmosphere and decelerates late and hard; a low one means it slows high up. That entire qualitative conclusion came from looking at the dimensions of a symbol you had not seen before, which is a good demonstration of the method's reach.
:::

::: check
Recover the form of the escape velocity from a body of gravitational parameter $\mu$ at radius $r$, using dimensions only. Then say what the method could not tell you.
:::

::: answer
Write $v_{\text{esc}} \propto \mu^{x}r^{y}$ and match $LT^{-1}$:

$$
LT^{-1} = \left(L^3T^{-2}\right)^{x}L^{y} \;\Longrightarrow\; -2x = -1,\quad 3x + y = 1,
$$

so $x = 1/2$ and $y = -1/2$, giving $v_{\text{esc}} \propto \sqrt{\mu/r}$.

What the method cannot tell you is the constant, which is $\sqrt{2}$. It also cannot tell you that the same scaling with a different constant — namely 1 — is the circular orbital speed. Two physically distinct quantities with identical scaling is exactly the ambiguity dimensional analysis leaves behind.

For $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$ and $r = 6.771\times 10^6\,\mathrm{m}$, $\sqrt{\mu/r} = 7673\,\mathrm{m/s}$, so escape from that radius is $\sqrt{2}$ times it, about 10.85 km/s.
:::

::: check
You are mid-derivation and a term that should be a moment, in newton metres, is coming out in newtons. What single question do you ask yourself, and why is that faster than rereading the algebra?
:::

::: answer
*"Where did a length go?"* The dimensional ratio of what you need to what you have is $ML^2T^{-2}/(MLT^{-2}) = L$, so exactly one factor of length is missing — and in a moment calculation there are very few candidates, usually a moment arm or a lever distance.

It is faster than rereading because it converts an open search ("find my mistake") into a closed one ("find the missing length"). On a whiteboard with someone watching, an open search reads as a stall and a closed one reads as diagnosis. Say the closed version out loud: *"I am a length short — I think I dropped the moment arm when I substituted."*
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
| Limits | No dimensionless constants; torque and energy share dimensions; radians and degrees both dimensionless; two Pi groups leave an unknown function |

That completes the derivation half of the module. The next three lessons turn to the other kind of problem this round asks: an estimate with no data, where there is no equation to derive and the entire answer is a decomposition you construct and defend.
