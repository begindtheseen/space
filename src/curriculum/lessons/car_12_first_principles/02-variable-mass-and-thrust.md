---
id: l02-variable-mass-and-thrust
title: "Variable-mass mechanics and the thrust equation"
minutes: 21
covers:
  - variable-mass Newtonian mechanics and the thrust term as momentum flux plus a pressure term
---

Stand on a skateboard holding a heavy bag of baseballs. Throw one ball hard backward. You roll forward a little. Throw another, and another. Each throw pushes you forward, and each throw also makes you lighter, so the next push moves you a bit more. That is a rocket. The only difference is that a rocket throws hundreds of kilograms of hot gas backward every second, instead of one ball at a time.

*"Write down Newton's second law for a rocket."* It is the most common opening move in this round, and it is a trap. The obvious answer — force equals mass times acceleration — is wrong, in a way that takes thirty seconds to expose and cannot be argued out of. That law was derived for a fixed collection of matter. A rocket is not one: like you on the skateboard, it is throwing away part of itself the whole time. Engineers call it a **variable-mass system** — something whose mass changes as it moves.

The question earns its popularity. It has a definite right answer. It takes four lines. It forces you to say exactly what you are applying Newton's law *to*. And its result — the thrust as a **momentum flux** plus a **pressure term** — is the foundation of everything else in this module. If you can produce it cleanly at a board, the next four lessons are bookkeeping.

This lesson derives the variable-mass momentum balance, turns it into the thrust equation with its pressure term, and defines the effective exhaust velocity and specific impulse used through the rest of the course. Everything is done the way you would do it standing up: assumptions first, one line at a time, units carried.

## The system boundary is the whole problem

First, one word. **[[Momentum|momentum]]** is mass times velocity, $p = mv$. It measures how much "oomph" a moving thing carries: a heavy truck creeping at walking pace can carry as much momentum as a car at highway speed. Newton's second law in its most general form says force is the rate at which momentum changes:

$$
\mathbf{F} = \frac{d\mathbf{p}}{dt}.
$$

(Bold letters are vectors — quantities with a direction. $d\mathbf{p}/dt$, read "d p by d t", is the rate of change of momentum over time.)

Here is the catch. This law applies to a **fixed set of particles**. The $\mathbf{p}$ on the right must be the momentum of the *same* bits of matter at every instant.

Suppose you point at the rocket and call it "the system". Its set of particles changes from one instant to the next, because some of them have left through the nozzle. So $d\mathbf{p}/dt$ for that shrinking set is not the applied force.

Write it anyway and see what goes wrong. Use the product rule (the rate of change of a product is each factor's rate times the other factor, added up):

$$
\mathbf{F} = \frac{d(m\mathbf{v})}{dt} = m\dot{\mathbf{v}} + \dot m\mathbf{v}.
$$

(A dot over a symbol means "rate of change over time": $\dot m$, read "m dot", is how fast the mass changes, in kilograms per second.) You get an apparent extra force, $\dot m\mathbf{v}$. It depends on the vehicle's velocity $\mathbf{v}$ in whatever **[[inertial frame|inertial-frame]]** you happened to pick. But velocity depends on who is watching: the same rocket is doing 1000 m/s to an observer on the ground and 0 m/s to one flying alongside. A force that changes when you change who is watching is not a force. That is the whole objection. Have the sentence ready, because interviewers ask *why* the naive form fails, not only what the right one is.

The fix is to choose a **system boundary** — an imaginary line around what you are applying the law to — that never loses particles: **the vehicle plus the propellant it is about to throw out.** Follow that fixed set across a short time $dt$, then let $dt$ shrink to zero.

::: warning The exhaust velocity is relative to the vehicle
$v_e$ (read "v sub e") is the speed of the exhaust *measured from the nozzle*, not from the ground. It is a property of the engine — its chamber conditions, propellant chemistry and nozzle shape — and it does not change when the vehicle speeds up. Mixing up the two frames is the most common error in this derivation, and it produces an equation in which a rocket on the pad has no thrust.
:::

## The variable-mass momentum balance

Work in one dimension, along the flight direction. Put the assumptions on the board first:

- The vehicle has mass $m(t)$ and velocity $v(t)$ in an inertial frame.
- Propellant leaves at a constant speed $v_e$ relative to the vehicle, pointed backward. So in the inertial frame it moves at $v - v_e$.
- All external forces — gravity, drag, anything else — are collected into one symbol, $F_{\text{ext}}$.
- Products of two tiny changes are dropped (they are **[[second-order small|second-order]]**).

**At time $t$.** The system is the vehicle plus the small parcel of propellant it is about to throw out. Together they have mass $m$, all moving at $v$:

$$
p(t) = m v.
$$

**At time $t + dt$.** During $dt$ the vehicle's mass changes by $dm$. Since the vehicle is getting lighter, $dm$ is negative, and the parcel it threw out has mass $-dm$ (a positive number). The vehicle is left with mass $m + dm$, now moving at $v + dv$. The parcel moves at $v - v_e$. Same particles, now in two pieces:

$$
p(t + dt) = (m + dm)(v + dv) + (-dm)(v - v_e).
$$

**Expand and cancel.** Multiply out the first bracket: $mv + m\,dv + v\,dm + dm\,dv$. Multiply out the second: $-v\,dm + v_e\,dm$. Now subtract $p(t) = mv$. The $mv$ terms cancel. The $+v\,dm$ and $-v\,dm$ cancel. And $dm\,dv$ is tiny times tiny, so it is dropped. What remains is

$$
dp = m\,dv + v_e\,dm.
$$

**Apply Newton to the fixed set.** For a fixed set of particles, the change in momentum equals the external force times the time, $dp = F_{\text{ext}}\,dt$. Set the two equal and divide by $dt$:

$$
m\frac{dv}{dt} + v_e\frac{dm}{dt} = F_{\text{ext}}
\quad\Longrightarrow\quad
m\frac{dv}{dt} = -v_e\frac{dm}{dt} + F_{\text{ext}}.
$$

That is the result. While the engine runs, $dm/dt < 0$, so the first term on the right, $-v_e\,dm/dt$, is positive: it pushes the vehicle forward. And notice that $v$ appears nowhere in it. The push is the same whether the vehicle is sitting on the pad or moving fast — exactly the frame-independence the naive form lacked.

::: key
Variable-mass momentum balance for a rocket: $m\,dv/dt = -v_e\,dm/dt + F_{\text{ext}}$ (also written $m\,dv/dt = -v_e\,\dot m + F_{\text{ext}}$), where $v_e$ is the exhaust velocity relative to the vehicle and $dm/dt = \dot m < 0$ during a burn. The first term is thrust; $F_{\text{ext}}$ carries gravity, drag and any other applied force. It follows from applying $F = dp/dt$ to the vehicle *plus* the mass it expels, never to the vehicle alone.
:::

It helps to have a positive symbol for how fast propellant pours out. Define $\dot m_e \equiv -\dot m > 0$ (the $\equiv$ means "is defined as"), the **mass flow rate** out of the nozzle, in kilograms per second. The thrust from the first term is then

$$
T_{\text{mom}} = \dot m_e v_e.
$$

This is the **momentum flux** term. "Flux" means flow through a surface: every second, $\dot m_e$ kilograms cross the nozzle exit, each carrying momentum $v_e$ per kilogram. Check the units: $\mathrm{kg/s} \times \mathrm{m/s} = \mathrm{kg\,m/s^2} = \mathrm{N}$, a force in newtons. That check takes two seconds and is worth saying out loud.

## The pressure term

The derivation above pretended the exhaust leaves and that is the end of it. A real nozzle has an exit — a flat circle at the end of the bell called the **exit plane**, with area $A_e$. The gas crossing it has its own pressure, $p_e$ (the **exit pressure**). That is not usually equal to the pressure of the air outside, $p_a$ (the **ambient pressure**; "ambient" means surrounding).

Here is the picture. Think of a sealed soda can sitting in still air. Air pushes on every part of its surface equally, so the pushes from all sides cancel and the can goes nowhere. That is the rule: **a uniform pressure over a closed surface gives no net force.**

Now look at the rocket's outside surface. Almost all of it sits at ambient pressure $p_a$. The one exception is the nozzle exit plane, which feels $p_e$ instead. So all the pressure forces cancel except for the difference over that one patch:

$$
T_{\text{pres}} = (p_e - p_a)A_e.
$$

Add the two pieces and you have the thrust equation.

::: key
The full thrust equation: $T = \dot m_e v_e + (p_e - p_a)A_e$. The momentum flux term dominates. The pressure term is why sea-level and vacuum thrust differ, and why the nozzle expansion ratio is a design choice rather than "as large as possible".
:::

The **expansion ratio** is how much wider the nozzle exit is than its narrowest point, the throat. A wider exit lets the gas expand more, which lowers $p_e$. That gives three cases, named by comparing $p_e$ with $p_a$ ([[picture them as plume shapes|plume-shapes]]):

- **Under-expanded**, $p_e > p_a$: the gas is still pushing outward as it leaves. The pressure term is positive and helps.
- **Over-expanded**, $p_e < p_a$: the gas has expanded past the outside pressure. The term is negative and subtracts from thrust.
- **Perfectly expanded**, $p_e = p_a$: the term is zero. This happens at only one ambient pressure, so at one altitude.

A first-stage engine is designed over-expanded at sea level, so that it is closer to ideal through most of its climb. A **[[vacuum engine|vacuum-nozzle]]** gets a very large exit, because there is no outside pressure up there to punish it.

## Effective exhaust velocity and specific impulse

Two thrust terms are awkward for trajectory work, so engineers fold them into one number. Define the **effective exhaust velocity** $c$:

$$
c \equiv \frac{T}{\dot m_e} = v_e + \frac{(p_e - p_a)A_e}{\dot m_e}.
$$

It has units of meters per second, and by construction $T = \dot m_e c$ exactly. It is the exhaust speed that, with no pressure term, would give the same thrust.

The **[[specific impulse|specific-impulse]]**, $I_{sp}$ (said "I-S-P"), is the same number divided by **standard gravity** $g_0$ (said "g naught"):

$$
I_{sp} = \frac{c}{g_0}, \qquad g_0 = 9.80665\,\mathrm{m/s^2}.
$$

Meters per second divided by meters per second squared leaves seconds, so $I_{sp}$ is measured in seconds. Its one advantage is that it has the same value in any unit system. Its meaning is "effective exhaust velocity in disguise". For every calculation in this module, turn it straight back into a velocity with $c = I_{sp}g_0$.

Both $c$ and $I_{sp}$ depend on the outside pressure. So an engine has a sea-level value and a vacuum value. Quoting one without saying which is a mistake an interviewer will pick up.

::: example Sea-level and vacuum thrust of a representative engine
No real engine's numbers are claimed here. These are round figures, typical of a **[[kerosene–oxygen|kerolox]]** first-stage engine, and the point is the shape of the calculation.

**Assumptions.** Propellant flow $\dot m_e = 300\,\mathrm{kg/s}$. Nozzle exit velocity $v_e = 2900\,\mathrm{m/s}$. Exit area $A_e = 0.90\,\mathrm{m^2}$. Exit pressure $p_e = 60\,\mathrm{kPa}$. Sea-level ambient pressure $p_a = 101.3\,\mathrm{kPa}$. (A pascal, Pa, is one newton per square meter, so a kilopascal times a square meter gives kilonewtons.)

**Momentum flux term.** $300 \times 2900 = 8.70 \times 10^5\,\mathrm{N}$, or $870\,\mathrm{kN}$.

**Pressure term at sea level.** $(60 - 101.3) \times 0.90 = -41.3 \times 0.90 = -37.2\,\mathrm{kN}$. Negative: the nozzle is over-expanded on the pad.

**Sea-level thrust.** $870 - 37.2 = 833\,\mathrm{kN}$. The pressure term costs $37.2/833 \approx 0.045$, about 4.5 percent.

**Vacuum.** Set $p_a = 0$. The pressure term becomes $60 \times 0.90 = +54.0\,\mathrm{kN}$, so the thrust is $870 + 54.0 = 924\,\mathrm{kN}$.

**The ratio.** $924/833 \approx 1.11$ — eleven percent more thrust in vacuum, from the same engine at the same flow rate, with nothing changed but the air outside.

**Effective exhaust velocity and $I_{sp}$.** At sea level, $c = 833\,000/300 \approx 2780\,\mathrm{m/s}$, so $I_{sp} = 2780/9.80665 \approx 283\,\mathrm{s}$. In vacuum, $c = 924\,000/300 = 3080\,\mathrm{m/s}$ and $I_{sp} = 3080/9.80665 \approx 314\,\mathrm{s}$. A spread of about 31 seconds, all of it from the pressure term.

**Sanity check.** Kerosene–oxygen engines sit around 260–300 s at sea level and 310–350 s in vacuum, so both numbers land where they should.
:::

::: example What the naive form predicts, and why it is absurd
Suppose you had written $F = d(mv)/dt$ for the vehicle alone and called the extra term $\dot m v$ the thrust.

Use the same engine: the vehicle's mass changes at $\dot m = -300\,\mathrm{kg/s}$. Evaluate at two moments in the same flight.

**On the pad**, $v = 0$. The predicted thrust is $-300 \times 0 = 0\,\mathrm{N}$. The vehicle would never leave the ground.

**Later**, at $v = 1000\,\mathrm{m/s}$, the prediction is $-300 \times 1000 = -3.00 \times 10^5\,\mathrm{N}$ — a $300\,\mathrm{kN}$ force pointing *backward*. Meanwhile the correct momentum flux term is $+8.70 \times 10^5\,\mathrm{N}$ forward at both moments.

**The diagnosis, said out loud:** the naive term is proportional to $v$, and $v$ depends on the frame, so it cannot be a physical force. Switch to a frame moving with the vehicle and the predicted thrust would change — but no real engine cares who is watching it. This is the cleanest demonstration that the system boundary, not the algebra, was the error.
:::

::: example Where this nozzle is perfectly expanded
Keep $p_e = 60\,\mathrm{kPa}$. Perfect expansion happens where the outside pressure has dropped to equal it. At what altitude is that?

**Model.** Air pressure falls off roughly exponentially with height: $p = p_0 e^{-h/H}$, with sea-level pressure $p_0 = 101.3\,\mathrm{kPa}$ and **[[scale height|scale-height]]** $H = 7.6\,\mathrm{km}$. This is a fair fit over the lowest ten kilometers, not a precise standard-atmosphere value.

**Solve.** Set $p = p_e$: $p_e = p_0 e^{-h/H}$. Divide both sides by $p_0$ and take the natural logarithm of both sides: $\ln(p_e/p_0) = -h/H$, so $h = H\ln(p_0/p_e)$. Now the numbers: $\ln(101.3/60) = \ln(1.688) \approx 0.524$, so $h = 7.6 \times 0.524 \approx 3.98\,\mathrm{km}$, about $4\,\mathrm{km}$.

**Interpretation.** The engine is over-expanded from the pad up to roughly $4\,\mathrm{km}$, perfectly expanded there, and under-expanded above. Its thrust rises steadily with altitude from $833\,\mathrm{kN}$ toward $924\,\mathrm{kN}$. Most of that rise happens in the first fifteen kilometers, where the outside pressure falls fastest.

**Sanity check.** The standard atmosphere — the agreed reference table of air conditions by height — gives about $61.6\,\mathrm{kPa}$ at $4\,\mathrm{km}$. Our model says $60\,\mathrm{kPa}$ there, an error of about three percent from a two-number model. That is the accuracy this kind of estimate is for.
:::

::: warning Do not write $\dot m$ where you mean $\dot m_e$
The vehicle's mass rate $\dot m$ is negative during a burn. The propellant flow $\dot m_e = -\dot m$ is positive. Books write both as "$\dot m$", and a sign error here flips the direction of the thrust. At a board, say in words which one you mean the first time you write it, and never switch.
:::

## Check yourself

::: check
State the variable-mass momentum balance. Then say in one sentence why $F = m\,dv/dt$ with a time-varying $m$ is not merely an approximation but wrong.
:::

::: answer
$m\,dv/dt = -v_e\dot m + F_{\text{ext}}$, with $v_e$ the exhaust velocity relative to the vehicle and $\dot m < 0$ during the burn.

It is wrong rather than approximate because $F = dp/dt$ holds for a fixed set of particles, and the vehicle alone is not one. Applying it to the vehicle alone throws away the momentum carried off by the exhaust. The false term it produces, $\dot m v$, depends on the observer's frame, so it cannot be a force at all. Making $dt$ smaller does not shrink the error — and that is what separates a wrong model from a rough one.
:::

::: check
An engine flows $250\,\mathrm{kg/s}$ with an exit velocity of $3100\,\mathrm{m/s}$, an exit area of $1.2\,\mathrm{m^2}$ and an exit pressure of $25\,\mathrm{kPa}$. Find its sea-level and vacuum thrust, and its vacuum specific impulse.
:::

::: answer
Momentum flux: $250 \times 3100 = 7.75 \times 10^5\,\mathrm{N}$, or $775\,\mathrm{kN}$.

Pressure term at sea level: $(25 - 101.3) \times 1.2 = -76.3 \times 1.2 = -91.6\,\mathrm{kN}$. Sea-level thrust: $775 - 91.6 \approx 683\,\mathrm{kN}$.

In vacuum: $25 \times 1.2 = 30.0\,\mathrm{kN}$, so $775 + 30.0 = 805\,\mathrm{kN}$.

Vacuum effective exhaust velocity: $c = 805\,000/250 = 3220\,\mathrm{m/s}$, so $I_{sp} = 3220/9.80665 \approx 328\,\mathrm{s}$.

Worth noticing: the low exit pressure and large exit area make this nozzle heavily over-expanded at sea level. It loses $91.6/775 \approx 0.118$ — nearly twelve percent of its momentum thrust — on the pad. That is the signature of a vacuum-optimized nozzle, and it is one reason upper-stage engines are not used as boosters.
:::

::: check
Why does a launch vehicle's thrust increase as it climbs, even with constant propellant flow and constant chamber conditions?
:::

::: answer
Only the pressure term changes. In $T = \dot m_e v_e + (p_e - p_a)A_e$, only $p_a$ depends on altitude. As the vehicle climbs, $p_a$ falls toward zero, so $(p_e - p_a)A_e$ grows by exactly $p_{a,\text{sea level}}A_e$ between the pad and vacuum.

For the example engine that is $101.3 \times 0.90 \approx 91.2\,\mathrm{kN}$ of extra thrust — the same as the $924 - 833 = 91\,\mathrm{kN}$ difference found above. The momentum flux term is untouched, because $\dot m_e$ and $v_e$ are set by chamber pressure, throat area and nozzle shape, none of which knows about the atmosphere.
:::

::: check
An interviewer says: "Your thrust equation has a pressure term. Why can I ignore the pressure everywhere else on the vehicle?"
:::

::: answer
Because a uniform pressure over a closed surface produces no net force. The ambient pressure adds up to zero over the whole vehicle, and the nozzle exit plane is the single place where the surface pressure is not ambient.

The cleanest way to say it at a board: [[imagine sealing the nozzle exit with a weightless cap|pressure-cap]] at ambient pressure. Now the vehicle is a closed body in uniform pressure and feels no net pressure force. Remove the cap, and $p_a$ over that area is replaced by $p_e$. The difference, $(p_e - p_a)A_e$, is the entire pressure contribution to thrust.

This also answers the follow-up, "what about drag?" Drag is not a uniform-pressure effect. It comes from the airflow around a moving vehicle, and it belongs in $F_{\text{ext}}$, not in $T$.
:::

::: check
An engine is quoted at $I_{sp} = 340\,\mathrm{s}$ with a thrust of $800\,\mathrm{kN}$. What is its propellant flow rate, and what must you ask before using either number?
:::

::: answer
First turn $I_{sp}$ back into a velocity: $c = I_{sp}g_0 = 340 \times 9.80665 \approx 3334\,\mathrm{m/s}$. Then $\dot m_e = T/c = 800\,000/3334 \approx 240\,\mathrm{kg/s}$.

The question to ask is **sea level or vacuum?** Both $T$ and $I_{sp}$ depend on the outside pressure, and the pair must come from the same condition. A vacuum $I_{sp}$ paired with a sea-level thrust gives a flow rate wrong by the ratio of the two — ten percent or more. If the figures are a matched pair, the flow rate comes out the same either way, because in $\dot m_e = T/(I_{sp}g_0)$ the top and bottom shift together. Mixing conditions is what breaks it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $m\,dv/dt = -v_e\dot m + F_{\text{ext}}$ | Variable-mass momentum balance; $\dot m < 0$ during a burn |
| $\dot m_e = -\dot m$ | Propellant mass flow rate, positive, $\mathrm{kg/s}$ |
| $v_e$ | Exhaust velocity relative to the vehicle, $\mathrm{m/s}$ |
| $T = \dot m_e v_e + (p_e - p_a)A_e$ | Thrust: momentum flux plus pressure term |
| $p_e, p_a, A_e$ | Nozzle exit pressure, ambient pressure, nozzle exit area |
| $c = T/\dot m_e$ | Effective exhaust velocity, $\mathrm{m/s}$ |
| $I_{sp} = c/g_0$, $g_0 = 9.80665\,\mathrm{m/s^2}$ | Specific impulse, seconds |
| Over- / under-expanded | $p_e < p_a$ / $p_e > p_a$; perfectly expanded where they are equal |
| Representative engine | $870\,\mathrm{kN}$ momentum flux; $833\,\mathrm{kN}$ at sea level, $924\,\mathrm{kN}$ in vacuum |

The next lesson takes this momentum balance, sets $F_{\text{ext}} = 0$, and integrates it to get the rocket equation — the single most-asked derivation in this round — and then lists, one by one, everything that integration quietly assumed.

::: context momentum Momentum, the quantity that is never lost
Momentum is mass times velocity. Its great property is that in any collision, push or explosion, the total momentum of everything involved stays the same — it only moves from one object to another. When you throw a ball backward off a skateboard, the ball gains backward momentum and you gain the same amount forward. A rocket engine does this with gas, hundreds of kilograms every second. That is why the whole derivation is a careful count of momentum before and after.
:::

::: context inertial-frame Frames that are not accelerating
A frame of reference is a point of view you measure positions and speeds from — the ground, a moving train, a passing rocket. An inertial frame is one that is not speeding up, slowing down or spinning. Newton's laws hold in every inertial frame, and speeds differ between them: a ball rolling at 2 m/s on a train doing 30 m/s moves at 32 m/s to someone on the platform. Real forces, like the push of your hand, do not change between inertial frames. That is the test the naive $\dot m v$ term fails.
:::

::: context second-order Why tiny times tiny can be thrown away
Suppose $dm$ is a thousandth of a kilogram and $dv$ is a thousandth of a meter per second. Their product is a millionth — a thousand times smaller than either one. As $dt$ shrinks toward zero, terms like $dm\,dv$ shrink much faster than terms like $m\,dv$, so in the limit they vanish completely. Mathematicians call them second-order small. Dropping them is not an approximation; in the limit it is exact.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="200" height="100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="20" width="20" height="100" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="120" width="200" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="120" width="20" height="20" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="75" font-size="13" text-anchor="middle" fill="#1f2a44">big × big</text>
  <text x="270" y="75" font-size="11" fill="#1f2a44">big × tiny</text>
  <text x="140" y="134" font-size="11" text-anchor="middle" fill="#1f2a44">tiny × big</text>
  <text x="268" y="136" font-size="11" fill="#b4232c">tiny × tiny</text>
</svg>
```

Grow a rectangle by a thin strip on two sides: the corner square (red) is by far the smallest piece, and it shrinks fastest.
:::

::: context plume-shapes You can see the pressure term in the flame
The shape of a rocket's exhaust plume tells you which case you are in. Over-expanded, the outside air squeezes the plume narrower as it leaves. Perfectly expanded, it leaves straight. Under-expanded, it bulges outward — which is why engines high in the thin upper atmosphere grow huge, wide plumes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#6c7a93">
    <path d="M45,20 L75,20 L85,60 L35,60 Z"/>
    <path d="M165,20 L195,20 L205,60 L155,60 Z"/>
    <path d="M285,20 L315,20 L325,60 L275,60 Z"/>
  </g>
  <g fill="#f2b880" stroke="#b4232c" stroke-width="1.5">
    <path d="M35,60 L85,60 L72,120 L48,120 Z"/>
    <path d="M155,60 L205,60 L205,120 L155,120 Z"/>
    <path d="M275,60 L325,60 L350,120 L250,120 Z"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="140">over-expanded</text><text x="60" y="156">p_e &lt; p_a</text>
    <text x="180" y="140">perfect</text><text x="180" y="156">p_e = p_a</text>
    <text x="300" y="140">under-expanded</text><text x="300" y="156">p_e &gt; p_a</text>
  </g>
</svg>
```
:::

::: context vacuum-nozzle Why upper-stage nozzles are so big
Above the atmosphere $p_a$ is zero, so there is no over-expansion penalty and a bigger exit always lowers $p_e$ and squeezes more push out of the gas. The limit is weight and size, not air. That is why second-stage engines carry enormous bell-shaped nozzle extensions — the vacuum version of SpaceX's Merlin engine, for instance, has a nozzle far wider than the sea-level Merlin it is derived from. Fire such a nozzle at sea level and the outside air would push back hard on that wide exit, and the flow can even break away from the nozzle wall.
:::

::: context specific-impulse Why a speed is measured in seconds
Specific impulse began as "impulse per unit weight of propellant": the total push (force times time) you get from burning propellant that weighs one unit. Force divided by weight leaves seconds, whether you work in newtons or in pounds. That is its one advantage — American and European engineers can compare engines without converting. The number means something simple: with $I_{sp} = 300\,\mathrm{s}$, each kilogram of propellant can push with a force equal to one kilogram's weight for 300 seconds. Multiply by $g_0$ and you are back to an exhaust velocity.
:::

::: context kerolox Kerosene and liquid oxygen
Many first stages burn a highly refined kerosene called RP-1 with liquid oxygen, a pair engineers nickname "kerolox". It is dense, stores well in tanks, and gives good thrust at the pad. SpaceX's Merlin engines on Falcon 9 burn it, and so did the Saturn V's first stage. Its specific impulse is lower than hydrogen and oxygen, but its density keeps the tanks small — a trade you will see again in the rocket equation.
:::

::: context scale-height The height over which air thins by a factor e
In the model $p = p_0 e^{-h/H}$, climbing one scale height $H$ divides the pressure by $e \approx 2.718$. Climb two and it is divided by about 7.4; three, by about 20. With $H \approx 7.6\,\mathrm{km}$, the air at the top of Mount Everest (about $8.8\,\mathrm{km}$) is roughly a third of sea-level pressure, which matches what climbers breathe. The real atmosphere's temperature changes with height, so $H$ is not quite constant, but one number gets you within a few percent low down.
:::

::: context pressure-cap The imaginary cap
Picture the rocket as a closed can in uniform air: all the pushes cancel. Now take the cap off the nozzle exit. Over that one patch, the push changes from $p_a$ to $p_e$, and only that difference is left over.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="45" width="200" height="50" rx="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M60,55 L30,40 L30,100 L60,85 Z" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="40" x2="30" y2="100" stroke="#b4232c" stroke-width="4"/>
  <g stroke="#6c7a93" stroke-width="1.5" fill="#6c7a93">
    <line x1="160" y1="15" x2="160" y2="38"/><polygon points="160,44 156,36 164,36"/>
    <line x1="160" y1="125" x2="160" y2="102"/><polygon points="160,96 156,104 164,104"/>
    <line x1="295" y1="70" x2="272" y2="70"/><polygon points="266,70 274,66 274,74"/>
    <line x1="110" y1="15" x2="110" y2="38"/><polygon points="110,44 106,36 114,36"/>
    <line x1="110" y1="125" x2="110" y2="102"/><polygon points="110,96 106,104 114,104"/>
  </g>
  <text x="190" y="24" font-size="11" fill="#6c7a93">p_a all around: cancels</text>
  <text x="12" y="125" font-size="11" fill="#b4232c">exit plane A_e</text>
  <text x="12" y="140" font-size="11" fill="#b4232c">feels p_e, not p_a</text>
</svg>
```
:::
