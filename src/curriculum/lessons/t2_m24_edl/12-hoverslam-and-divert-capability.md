---
id: l12-hoverslam-and-divert-capability
title: The hoverslam problem, divert capability, and propellant margin
minutes: 27
covers:
  - landing burn timing and the hoverslam problem
  - divert capability and the landing ellipse
---

Picture riding a bike toward a stop line, with brakes that have a strange flaw: once you squeeze them, you cannot squeeze gently. They grab hard or not at all. Squeeze too early and you stop short of the line. Squeeze too late and you roll across it. There is exactly one right moment, and once you have squeezed, you cannot let go and try again.

That is the landing burn of a reusable booster. The engine has a lowest setting it can run at, and even that setting pushes harder than the nearly empty stage weighs. So the stage cannot hover. It has one shot: light the engine at the right height, and arrive at the ground with zero speed at the same instant.

This lesson works that problem from both sides. First, when to light the engine, and how badly a small error hurts. Second, a guidance law that steers the burn all the way down, and the hard limits the engine's lowest and highest thrust put on it. Third, how far sideways the stage can steer during the same burn to reach its target — its **divert capability** — and whether thrust or fuel runs out first.

## The vehicle

Every number in this lesson uses one landing stage, loosely modeled on a Falcon-9-class first stage coming down on a single engine.

- Mass $m = 25{,}000\ \mathrm{kg}$. We hold it constant during the short burn. That is a simplification, and a warning further down says what it hides.
- Engine thrust adjustable between $T_{\min} = 360\ \mathrm{kN}$ and $T_{\max} = 900\ \mathrm{kN}$. That is a **throttle** range of $40$ to $100$ percent — throttle meaning the engine's power setting, as on a car.

The acceleration the engine can give is thrust divided by mass. We write it $a_T$ ("a sub T", the **thrust acceleration**):

$$
a_{T,\max} = \frac{T_{\max}}{m} = \frac{900{,}000}{25{,}000} = 36.0\ \mathrm{m/s^2} = 3.671\,g_0,
$$

$$
a_{T,\min} = \frac{T_{\min}}{m} = \frac{360{,}000}{25{,}000} = 14.4\ \mathrm{m/s^2} = 1.468\,g_0.
$$

Here $g_0 = 9.80665\ \mathrm{m/s^2}$ is standard gravity. Dividing by it turns each acceleration into a **[[thrust-to-weight ratio|thrust-to-weight]]**: how many times its own weight the engine pushes.

Look at the second line. Even at its lowest setting, the engine pushes $1.468$ times the stage's weight. So the instant the engine lights, the stage starts slowing its fall — and if the burn ran on past zero speed, it would start climbing. It **cannot hover**. There is no "slow down, hold still, take a look" option.

::: key Hoverslam
A **hoverslam** (or suicide burn) is a single braking burn timed so that velocity and altitude reach zero together. It is forced because the minimum achievable thrust still exceeds the vehicle weight — the stage cannot hover, so there is exactly one correct ignition time and no opportunity to stop and reassess.
:::

## When to light the engine

Start with the simplest version: straight down, engine at one fixed thrust.

Think of braking a car. A car going twice as fast needs four times the distance to stop, because stopping distance grows with speed squared. A falling stage is the same, with one twist: gravity keeps pulling down while the engine pushes up. So the part of the thrust that actually slows the fall is $a_T - g$.

Call up positive. At ignition the stage is at height $h$ and falling at speed $v$. During the burn the net upward acceleration is $a_T - g$. The standard constant-acceleration rule says

$$
v_{\text{end}}^2 = v^2 - 2\,(a_T - g)\,h,
$$

where $v_{\text{end}}$ is the speed when the height reaches zero. We want $v_{\text{end}} = 0$ exactly at the ground. Set the left side to zero and solve for $h$:

$$
h = \frac{v^2}{2\,(a_T - g)}.
$$

The burn lasts as long as it takes to remove the speed $v$ at the rate $a_T - g$:

$$
t_b = \frac{v}{a_T - g}.
$$

If $a_T \le g$ the bottom of the fraction is zero or negative. The engine cannot even hold the stage up, so no ignition height works. A real guidance program checks for that before dividing.

::: key Ignition altitude for a 1-D constant-thrust landing burn
$$
h = \frac{v^2}{2(a_T - g)}, \qquad a_T = T/m.
$$
It grows as the square of the velocity, so a small velocity error moves the ignition point a lot.
:::

::: example Where to light the engine
The stage falls at $v = 225\ \mathrm{m/s}$ and will burn at $T = 600\ \mathrm{kN}$, two thirds of full throttle. Where should it light?

**Step 1: thrust acceleration.** $a_T = 600{,}000 / 25{,}000 = 24.0\ \mathrm{m/s^2}$.

**Step 2: the part that fights the fall.** $a_T - g = 24.0 - 9.80665 = 14.193\ \mathrm{m/s^2}$.

**Step 3: ignition height.**

$$
h = \frac{225^2}{2 \times 14.193} = \frac{50{,}625}{28.387} = 1783\ \mathrm{m}.
$$

**Step 4: burn time.** $t_b = 225 / 14.193 = 15.9\ \mathrm{s}$.

**Does it make sense?** A stage slowing at about $1.4\,g$ from $225\ \mathrm{m/s}$ should take a bit under $20\ \mathrm{s}$ and cover a couple of kilometers. It does. And a speed error of $10\ \mathrm{m/s}$ (falling at $235$ instead of $225$) moves the ignition point up by $235^2/28.387 - 1783 = 162\ \mathrm{m}$ — the square in action.
:::

::: example How much a small error hurts
Same stage, same planned ignition at $1783\ \mathrm{m}$. Now let two things go wrong, one at a time.

**The engine is $1\%$ weak.** Real thrust gives $a_T = 0.99 \times 24.0 = 23.76\ \mathrm{m/s^2}$, so the net braking is $23.76 - 9.80665 = 13.953\ \mathrm{m/s^2}$. Put it into $v_{\text{end}}^2 = v^2 - 2(a_T - g)h$:

$$
v_{\text{end}}^2 = 50{,}625 - 2 \times 13.953 \times 1783 = 50{,}625 - 49{,}769 = 856, \qquad v_{\text{end}} = 29.3\ \mathrm{m/s}.
$$

**The altitude estimate is $50\ \mathrm{m}$ high.** The stage thinks it is at $1783\ \mathrm{m}$ but is really at $1733\ \mathrm{m}$, so it lights $50\ \mathrm{m}$ late:

$$
v_{\text{end}}^2 = 50{,}625 - 2 \times 14.193 \times 1733 = 50{,}625 - 49{,}206 = 1419, \qquad v_{\text{end}} = 37.7\ \mathrm{m/s}.
$$

**Reading it.** A $1\%$ thrust error hits the pad at about $29\ \mathrm{m/s}$, over $100\ \mathrm{km/h}$. A $50\ \mathrm{m}$ height error hits at about $38\ \mathrm{m/s}$. Either one destroys the stage. Lighting $50\ \mathrm{m}$ *early* is no better: the stage reaches zero speed $50\ \mathrm{m}$ above the pad and, unable to hover, starts to climb.

This is why no real vehicle flies the burn open loop — "set the thrust, light at the computed height, and hope". It measures its height and speed all the way down (lesson 11's sensors) and keeps adjusting the throttle. The next section builds a law that does exactly that.
:::

## The ZEM/ZEV guidance law, derived

Now let the guidance change the acceleration during the burn. Work on one axis at a time: position $r$, velocity $v$, and $\ddot r = a(t)$. Read $\ddot r$ as "r double-dot", the rate of change of the rate of change — the acceleration. For now $a$ is the *total* acceleration, gravity included. We sort out the engine's share afterward.

Right now the vehicle is at $r_0$ moving at $v_0$. We want it at $r_f$ moving at $v_f$ ("f" for final) after a time $t_{go}$, read "t go", the **time-to-go**. That is four conditions: two now, two at the end.

Infinitely many acceleration histories meet them. We pick the gentlest: the one that makes the total control effort, $\int_0^{t_{go}} a(t)^2\,dt$, as small as possible. That choice turns out to be a **[[straight line in time|why-linear]]**:

$$
a(t) = A + Bt.
$$

Integrate once for velocity and twice for position:

$$
v(t) = v_0 + At + \tfrac12 Bt^2, \qquad r(t) = r_0 + v_0 t + \tfrac12 At^2 + \tfrac16 Bt^3.
$$

Two names make the algebra clean. The **[[zero-effort miss|zem-name]]**, $\mathrm{ZEM}$, is how far you would be from the target if you stopped steering and coasted at $v_0$. The **zero-effort velocity error**, $\mathrm{ZEV}$, is how far your velocity is from the target velocity:

$$
\mathrm{ZEM} \equiv r_f - (r_0 + v_0\,t_{go}), \qquad \mathrm{ZEV} \equiv v_f - v_0.
$$

Now impose the end conditions, writing $t_{go}$ for $t$. The velocity condition says the acceleration must supply the velocity gap. The position condition says it must supply the coasting miss:

$$
\mathrm{ZEV} = A\,t_{go} + \tfrac12 B\,t_{go}^2, \qquad \mathrm{ZEM} = \tfrac12 A\,t_{go}^2 + \tfrac16 B\,t_{go}^3.
$$

Two equations, two unknowns. From the first, $B = 2(\mathrm{ZEV} - A\,t_{go})/t_{go}^2$. Put that into the second:

$$
\mathrm{ZEM} = \tfrac12 A\,t_{go}^2 + \tfrac13(\mathrm{ZEV} - A\,t_{go})\,t_{go} = \tfrac16 A\,t_{go}^2 + \tfrac13\,\mathrm{ZEV}\,t_{go}.
$$

Solve for $A$, then feed it back to get $B$:

$$
A = \frac{6\,\mathrm{ZEM}}{t_{go}^2} - \frac{2\,\mathrm{ZEV}}{t_{go}}, \qquad
B = \frac{6\,\mathrm{ZEV}}{t_{go}^2} - \frac{12\,\mathrm{ZEM}}{t_{go}^3}.
$$

$A$ is the acceleration to command *right now*. A real flight computer does not fly the whole planned line. Every guidance cycle — many times a second — it re-measures $r$ and $v$, recomputes $\mathrm{ZEM}$, $\mathrm{ZEV}$ and $t_{go}$, and commands the new $A$. If the engine runs $1\%$ weak, the next cycle sees a bigger miss and asks for more. That is **[[closed-loop|closed-loop]]** guidance, the same idea as Apollo's and the Shuttle's entry guidance in lesson 8.

::: key ZEM/ZEV terminal guidance
$$
a_{\mathrm{cmd}} = \frac{6\,\mathrm{ZEM}}{t_{go}^2} - \frac{2\,\mathrm{ZEV}}{t_{go}}, \qquad
\mathrm{ZEM} = r_f - (r + v\,t_{go}), \quad \mathrm{ZEV} = v_f - v.
$$
The minimum-effort acceleration profile connecting current position and velocity to a target position and velocity at a specified time-to-go. Recomputed every cycle from the current state — closed loop, not a fixed plan. The required *thrust* acceleration is this command minus gravity (vertically) or the command directly (horizontally, where gravity has no component).
:::

"Minus gravity" is a vector statement. With up positive, gravity is $-g$, so the vertical thrust acceleration is $a_{\mathrm{thrust},y} = a_y - (-g) = a_y + g$. The engine must supply the commanded acceleration *and* hold the stage up.

::: example The law reaches the ground exactly
Start at $y_0 = 2000\ \mathrm{m}$, falling at $v_{y0} = -225\ \mathrm{m/s}$. Target $y_f = 0$, $v_{yf} = 0$. Burn time $t_{go} = 18\ \mathrm{s}$.

**Step 1: the two errors.**

$$
\mathrm{ZEM} = 0 - (2000 + (-225)(18)) = 0 - (2000 - 4050) = 2050\ \mathrm{m}, \qquad \mathrm{ZEV} = 0 - (-225) = 225\ \mathrm{m/s}.
$$

The positive ZEM says that, coasting, the stage would end $2050\ \mathrm{m}$ *below* the ground. The acceleration must push it back up that much.

**Step 2: the coefficients.**

$$
A = \frac{6 \times 2050}{18^2} - \frac{2 \times 225}{18} = 37.963 - 25.000 = 12.963\ \mathrm{m/s^2},
$$

$$
B = \frac{6 \times 225}{18^2} - \frac{12 \times 2050}{18^3} = 4.1667 - 4.2181 = -0.0514\ \mathrm{m/s^3}.
$$

**Step 3: check the end.** Propagating $a(t) = A + Bt$ forward gives $y(18) = 0$ and $v_y(18) = 0$ to rounding error. That has to happen: $A$ and $B$ were solved to make it happen.

**Step 4: what the engine must give.** Add $g_0$. At ignition, $12.963 + 9.807 = 22.77\ \mathrm{m/s^2}$. At touchdown, $12.963 - 0.0514 \times 18 + 9.807 = 21.84\ \mathrm{m/s^2}$.

**Does it make sense?** Both values sit comfortably inside the engine's range $[14.4,\ 36.0]\ \mathrm{m/s^2}$. They are also close to the $22.46\ \mathrm{m/s^2}$ a constant-thrust burn would need from this height and speed ($225^2/(2 \times 2000) + 9.807$). The smooth law is a gently tilted version of the constant burn.
:::

## What the throttle floor and ceiling do

The law above is pure mathematics. It will ask for any acceleration at all. The engine can only give between $a_{T,\min}$ and $a_{T,\max}$. So the real question is: for which burn times does the law stay inside that range?

Because $a(t) = A + Bt$ is a straight line, its biggest and smallest values over the burn sit at the two ends. So checking a whole burn means checking only two numbers: the thrust acceleration at ignition and at touchdown.

Now try many burn times $t_{go}$ for the baseline start ($2000\ \mathrm{m}$, $-225\ \mathrm{m/s}$):

- **Too short**, and the law asks for more than $a_{T,\max}$ — there is not enough time to kill that much speed. For this start the breach happens at the touchdown end, where the straight line is highest.
- **Too long**, and the law wants to ease off toward a soft finish, asking for less than $a_{T,\min}$ near touchdown. A throttle floor above $g_0$ forbids exactly that.

Between the two sits a **[[feasible window|feasible-window]]** of burn times for which both ends — and therefore everything between — stay inside the limits:

$$
t_{go} \in [14.47,\ 21.81]\ \mathrm{s}, \qquad \text{width } 7.34\ \mathrm{s}.
$$

Repeat at the same height with other descent speeds:

| $v_{y0}$ (m/s) | feasible window (s) | width (s) |
| --- | --- | --- |
| $-150$ | $[24.65,\ 28.00]$ | $3.35$ |
| $-200$ | $[16.58,\ 23.60]$ | $7.02$ |
| $-225$ | $[14.47,\ 21.81]$ | $7.34$ |
| $-250$ | $[13.89,\ 20.24]$ | $6.35$ |
| $-300$ | $[12.82,\ 14.75]$ | $1.92$ |
| $-324$ | none | $0$ |

The window widens, peaks near $-225\ \mathrm{m/s}$, then narrows fast. By about $-324\ \mathrm{m/s}$ it is gone. (That edge was found by bisection — repeatedly halving the gap between a speed that has a window and one that does not.)

Past that speed, **no burn time exists** for which the smooth law respects both the ceiling and the floor. This is a hard wall, not a rougher ride. A stage arriving faster has two ways out. The aerodynamic phase upstream (lesson 10) can deliver it slower. Or the guidance can fly a different shape, such as full throttle for a while, switching to this law only once the remaining problem fits inside the window.

::: key A minimum-throttle constraint can eliminate the solution entirely
Because the throttle floor exceeds $g_0$, the guidance problem is not "fly the smooth law, accepting a rougher ride near the limits". Outside the feasible window, the smooth law's required thrust leaves $[a_{T,\min}, a_{T,\max}]$, and there is no way to fly it at all. The feasible set of burns is a bounded, sometimes narrow, sometimes empty window — not a range that degrades gracefully at its edges. That is why the hoverslam is a single-shot problem.
:::

::: warning Constant mass flatters the numbers
We used $m = 25{,}000\ \mathrm{kg}$ throughout — the stage's mass at the *end* of the burn. At ignition it still carries its landing propellant and is heavier, so the same thrust gives less acceleration: at $30{,}500\ \mathrm{kg}$, full thrust gives only $900{,}000/30{,}500 = 29.5\ \mathrm{m/s^2}$. The true ceiling is lower early in the burn. A flight-quality check tracks mass as it falls, and the real feasible windows are somewhat narrower than this table.
:::

## Divert capability and the landing ellipse

Before landing, nobody knows exactly where the stage will be. Navigation errors, wind and small engine differences scatter the possible arrival points into an oval on the ground called the **[[landing ellipse|landing-ellipse]]**. A landing burn rarely starts straight above the pad. It must also steer sideways — **divert** — during the same burn. The divert capability must cover the ellipse, or some landings miss.

Apply the same ZEM/ZEV law sideways, on the $x$ axis. Start at an offset $x_0$ with no sideways speed, and aim for $x_f = 0$, $v_{xf} = 0$ over the same $t_{go} = 18\ \mathrm{s}$. Here $\mathrm{ZEM} = -x_0$ and $\mathrm{ZEV} = 0$, so

$$
A_x = -\frac{6x_0}{t_{go}^2}, \qquad B_x = \frac{12x_0}{t_{go}^3}.
$$

The stage accelerates toward the target for the first half of the burn and brakes for the second. Gravity has no sideways part, so this is also the sideways thrust acceleration.

The engine now points along the combined vector. Two limits apply at every instant:

- **Magnitude:** $a_{T,\min} \le \sqrt{a_{\mathrm{thrust},x}^2 + a_{\mathrm{thrust},y}^2} \le a_{T,\max}$.
- **Pointing:** $a_{\mathrm{thrust},y} \ge 0$. The engine cannot push the stage toward the ground.

Increasing $x_0$ step by step, the magnitude first hits the ceiling at

$$
x_{0,\text{thrust-limited}} \approx 1506\ \mathrm{m}.
$$

It happens at ignition. That is where the sideways demand is largest ($27.9\ \mathrm{m/s^2}$, matched again at touchdown) and the vertical demand is also at its highest. The thrust vector leans about $51^\circ$ from vertical there, and about $52^\circ$ at touchdown — far from the $90^\circ$ where it would lie flat. So the pointing limit is never the one that bites here.

::: warning Pointing still needs checking
In the straight-down examples the engine never had to point anywhere but up. Once sideways steering is added, the vertical part can in principle go negative. It did not here, but it is a separate check, and on a steeper divert it can be the limit.
:::

That settles the engine's *strength*. But the stage also carries only so much propellant. That is a second, separate limit.

::: example Propellant budget for the combined burn
The engine is a kerosene/liquid-oxygen design with **[[specific impulse|specific-impulse]]** $I_{sp} = 283\ \mathrm{s}$. Its effective exhaust velocity is

$$
v_e = I_{sp}\,g_0 = 283 \times 9.80665 = 2775.3\ \mathrm{m/s}.
$$

**Step 1: the budget.** The stage carries $5500\ \mathrm{kg}$ of usable landing propellant: $m_0 = 30{,}500\ \mathrm{kg}$ at ignition, $m_f = 25{,}000\ \mathrm{kg}$ with the tanks at their reserve. The rocket equation gives

$$
\Delta v_{\mathrm{budget}} = v_e\ln\frac{m_0}{m_f} = 2775.3\,\ln\frac{30{,}500}{25{,}000} = 2775.3 \times 0.19885 = 551.9\ \mathrm{m/s}.
$$

**Step 2: the straight-down cost.** The vertical burn from the earlier example costs

$$
\Delta v_{\mathrm{vertical}} = \int_0^{18} a_{\mathrm{thrust},y}\,dt = A t_{go} + \tfrac12 B t_{go}^2 + g_0 t_{go} = 233.3 - 8.3 + 176.5 = 401.5\ \mathrm{m/s}.
$$

Read the pieces. $233.3 - 8.3 = 225$ is the descent speed being removed. The other $176.5\ \mathrm{m/s}$ is **[[gravity loss|gravity-loss]]**: $18\ \mathrm{s}$ of holding the stage up against gravity.

**Step 3: add the divert — carefully.** The engine pushes along one tilted line. What it spends is the *length* of the thrust vector, added up over time:

$$
\Delta v_{\mathrm{burn}} = \int_0^{t_{go}} \sqrt{a_{\mathrm{thrust},x}^2 + a_{\mathrm{thrust},y}^2}\;dt.
$$

At the thrust limit, $x_0 = 1506\ \mathrm{m}$, this integral comes to $489.6\ \mathrm{m/s}$ — less than the $551.9\ \mathrm{m/s}$ budget. In propellant: $30{,}500\,(1 - e^{-489.6/2775.3}) = 4933\ \mathrm{kg}$ of the $5500\ \mathrm{kg}$.

**Step 4: which limit wins.** Propellant alone would allow diverting to about $2067\ \mathrm{m}$ before the budget runs out. The engine's ceiling stops the stage at $1506\ \mathrm{m}$ first. **For this stage, thrust is the binding limit.**

**Does it make sense?** Sideways divert adds surprisingly little: $1506\ \mathrm{m}$ of steering raised the bill from $401.5$ to only $489.6\ \mathrm{m/s}$. That is because sideways push is at right angles to the upward push, and right-angle pieces combine like the [[sides of a triangle|divert-triangle]], not end to end.
:::

::: warning Delta-v does not add axis by axis
A tempting shortcut is to cost each axis separately and add them. The sideways profile alone costs $\int |a_x|\,dt = 3x_0/t_{go}$, so the shortcut says $401.5 + 3x_0/18 \le 551.9$, giving $x_0 \le 902\ \mathrm{m}$. That is wrong, and far too pessimistic. It is the bill for two separate engines, one pointing up and one sideways. One engine pointing along the diagonal pays only for the diagonal.
:::

::: example When propellant is the limit
Change one thing: the stage arrives with only $4500\ \mathrm{kg}$ of landing propellant, so $m_0 = 29{,}500\ \mathrm{kg}$.

**Step 1: new budget.** $\Delta v_{\mathrm{budget}} = 2775.3\,\ln(29{,}500/25{,}000) = 2775.3 \times 0.16551 = 459.3\ \mathrm{m/s}$.

**Step 2: straight down still costs $401.5\ \mathrm{m/s}$**, leaving a thin margin.

**Step 3: largest divert.** Increasing $x_0$ until the vector integral reaches $459.3\ \mathrm{m/s}$ gives $x_0 \approx 1187\ \mathrm{m}$. At that offset the peak thrust demand is $31.7\ \mathrm{m/s^2}$, under the $36.0\ \mathrm{m/s^2}$ ceiling.

**Reading it.** Same engine, same guidance, $1000\ \mathrm{kg}$ less propellant — and now propellant, not thrust, sets the footprint, $1187\ \mathrm{m}$ instead of $1506\ \mathrm{m}$.
:::

::: key Divert capability: check thrust and propellant separately
Sizing a landing ellipse means two separate checks. Does the *instantaneous* thrust vector stay within its magnitude and pointing limits at every moment? Does the *cumulative* propellant spend — the integral of the thrust vector's length — stay within the $\Delta v$ budget? Either one can be the actual limiter, depending on the vehicle and how much propellant it arrives with.
:::

## Check yourself

::: check
In one sentence, why can this lesson's stage not hover? What does that mean for how its landing burn is flown?
:::

::: answer
Its minimum-throttle thrust acceleration, $14.4\ \mathrm{m/s^2}$, is larger than gravity, $9.807\ \mathrm{m/s^2}$, so even at the lowest setting the engine pushes it upward harder than gravity pulls it down — it cannot hold a steady height.

The consequence: the burn must be timed so that speed and height reach zero together, from one specific ignition point. Light too early and the stage stops above the pad and starts to climb. Light too late and it hits the pad still moving. There is no pausing mid-burn to reassess.
:::

::: check
A stage falls at $150\ \mathrm{m/s}$ and burns at a constant $a_T = 2.5\,g_0$. At what height must it light, and how long does the burn last? If it lights at that height but is really falling at $160\ \mathrm{m/s}$, what speed does it hit the pad at?
:::

::: answer
Net braking: $a_T - g = 2.5 \times 9.80665 - 9.80665 = 1.5 \times 9.80665 = 14.710\ \mathrm{m/s^2}$.

Ignition height: $h = 150^2 / (2 \times 14.710) = 22{,}500 / 29.420 = 764.8\ \mathrm{m}$.

Burn time: $t_b = 150 / 14.710 = 10.2\ \mathrm{s}$.

With $160\ \mathrm{m/s}$ instead: $v_{\text{end}}^2 = 160^2 - 29.420 \times 764.8 = 25{,}600 - 22{,}500 = 3100$, so $v_{\text{end}} = 55.7\ \mathrm{m/s}$. A $10\ \mathrm{m/s}$ speed error became a $56\ \mathrm{m/s}$ impact, because the stopping distance depends on speed squared.
:::

::: check
Starting from the end conditions $v(t_{go}) = v_f$ and $r(t_{go}) = r_f$ on $a(t) = A + Bt$, explain why the command $A$ depends on the zero-effort miss as $1/t_{go}^2$ but on the zero-effort velocity error only as $1/t_{go}$.
:::

::: answer
Solving the two end-condition equations gives $A = 6\,\mathrm{ZEM}/t_{go}^2 - 2\,\mathrm{ZEV}/t_{go}$.

The ZEM term comes through the position condition. Position picks up acceleration through a $t^2$ term (from constant acceleration, distance grows as time squared). So fixing a given position error in a given time needs an acceleration that scales as $1/t_{go}^2$.

The ZEV term comes through the velocity condition. Velocity picks up acceleration only linearly in time. So closing a given velocity gap needs an acceleration that scales as only $1/t_{go}$.
:::

::: check
At $v_{y0} = -225\ \mathrm{m/s}$ the feasible window is $7.34\ \mathrm{s}$ wide. At $-300\ \mathrm{m/s}$ it has shrunk to $1.92\ \mathrm{s}$, and by about $-324\ \mathrm{m/s}$ it has closed. What does "closed" mean physically, and what must change for the stage to land safely at that speed?
:::

::: answer
It means no burn time $t_{go}$ keeps the smooth minimum-effort profile inside $[a_{T,\min}, a_{T,\max}]$ at both ends of the burn. Every choice asks either for more thrust than the engine has, or for less thrust than the throttle floor allows.

To land anyway, either the aerodynamic phase upstream must deliver the stage to ignition height at a lower speed, which reopens the window, or the guidance must drop the smooth law for a different strategy — for example, an opening segment at full throttle — that a straight-line-in-time profile cannot represent.
:::

::: check
An engineer costs the combined burn axis by axis — $401.5\ \mathrm{m/s}$ vertical plus $3x_0/t_{go}$ sideways — and reports a divert capability of $902\ \mathrm{m}$. The thrust-magnitude check allows $1506\ \mathrm{m}$. Which number is right for sizing the landing ellipse, and why?
:::

::: answer
$1506\ \mathrm{m}$. The $902\ \mathrm{m}$ figure treats the stage as if it had one engine pushing up and a second pushing sideways, paying for each separately. The real single engine points along the diagonal, and the propellant it burns depends on the length of the thrust vector, $\sqrt{a_x^2 + a_y^2}$, integrated over time.

Costed that way, the $1506\ \mathrm{m}$ divert needs $489.6\ \mathrm{m/s}$ of the $551.9\ \mathrm{m/s}$ budget, so propellant is not the limit — the thrust ceiling is. Reporting $902\ \mathrm{m}$ would understate the reachable footprint by about 40 percent. The general rule stands: check both limits properly, and size the ellipse to whichever binds first.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $a_{T,\min} = T_{\min}/m = 14.4\ \mathrm{m/s^2} = 1.468\,g_0$ | Minimum throttle acceleration; above $g_0$, so this stage cannot hover |
| $a_{T,\max} = T_{\max}/m = 36.0\ \mathrm{m/s^2} = 3.671\,g_0$ | Maximum throttle acceleration |
| $h = v^2/(2(a_T - g))$, $t_b = v/(a_T - g)$ | Constant-thrust ignition height and burn time; $h$ grows as $v^2$ |
| Error sensitivity ($225\ \mathrm{m/s}$, $1783\ \mathrm{m}$) | $1\%$ weak thrust: $29.3\ \mathrm{m/s}$ at the pad; $50\ \mathrm{m}$ late: $37.7\ \mathrm{m/s}$ |
| $a_{\mathrm{cmd}} = 6\,\mathrm{ZEM}/t_{go}^2 - 2\,\mathrm{ZEV}/t_{go}$ | ZEM/ZEV guidance; minimum effort, closed loop, recomputed every cycle |
| Feasible window ($2000\ \mathrm{m}$, $-225\ \mathrm{m/s}$) | $t_{go} \in [14.47,\ 21.81]\ \mathrm{s}$, width $7.34\ \mathrm{s}$ |
| Window closes at | $v_{y0} \approx -324\ \mathrm{m/s}$ at $2000\ \mathrm{m}$ |
| $\Delta v_{\mathrm{budget}} = v_e\ln(m_0/m_f)$ | $551.9\ \mathrm{m/s}$ for $5500\ \mathrm{kg}$; $401.5\ \mathrm{m/s}$ goes to the vertical burn |
| $\Delta v_{\mathrm{burn}} = \int \lvert\mathbf{a}_{\mathrm{thrust}}\rvert\,dt$ | Propellant cost uses the thrust vector's length, not the sum of its axes |
| Divert capability | $1506\ \mathrm{m}$, thrust-limited, with $5500\ \mathrm{kg}$; $1187\ \mathrm{m}$, propellant-limited, with $4500\ \mathrm{kg}$ |

The next lesson takes these ideas to two real extremes: Mars, where the air is too thin to finish the job and a descent stage must be *designed* to hover, and a reusable booster choosing between flying home and landing on a ship downrange.

::: context thrust-to-weight Thrust-to-weight, the number that decides hovering
Thrust-to-weight is thrust divided by weight, $T/(mg)$. It has no units: it counts how many "weights" the engine is pushing. At $1$ the engine exactly holds the vehicle up — that is hovering. Above $1$ it climbs; below $1$ it sinks.

A rocket on the launch pad needs thrust-to-weight well above $1$ to leave. A landing stage wants the opposite: the ability to go *below* $1$. Our stage's lowest setting is $1.468$, so it can never reach the hovering value.
:::

::: context why-linear Why the best profile is a straight line
Suppose $a(t)$ is the best profile and you nudge it by a small change $\delta a(t)$ (read "delta a"). To still hit the target, the nudge must add no net velocity, $\int \delta a\,dt = 0$, and no net position, $\int (t_{go} - t)\,\delta a\,dt = 0$.

At the best profile, no allowed nudge can lower the effort, so the first-order change $2\int a\,\delta a\,dt$ must be zero for every such nudge. The only functions "blind" to every nudge that is blind to $1$ and to $t$ are combinations of $1$ and $t$. So $a(t) = A + Bt$. This is a small taste of the **calculus of variations**, the math of finding the best curve rather than the best number.
:::

::: context zem-name A name borrowed from missiles
"Zero-effort miss" comes from missile guidance. There the question is by how much an interceptor would miss its target if it stopped steering now. Guidance that drives that predicted miss to zero is the idea behind proportional navigation, used by interceptors for decades.

Landing guidance borrowed the idea and added a second target: arriving at the right *velocity* as well as the right place. That is the ZEV term. A rocket that hits the pad at the right spot but at $30\ \mathrm{m/s}$ has not landed.
:::

::: context closed-loop Closed loop, like a phone's map app
An **open-loop** plan is a list of instructions computed once: "drive two kilometers, turn left". A **closed-loop** controller keeps checking where you really are and recomputes. Miss a turn, and your phone's map app says "rerouting" and hands you a new plan from where you are now.

ZEM/ZEV guidance reroutes every cycle. That is why a $1\%$ weak engine, which would wreck an open-loop hoverslam, is merely an input the next cycle absorbs — as long as the new command still fits inside the throttle range.
:::

::: context feasible-window The shrinking window, drawn
Each bar shows the burn times that keep the whole smooth profile between the throttle floor and ceiling, starting from $2000\ \mathrm{m}$. The window is widest near $-225\ \mathrm{m/s}$ and gone by about $-324\ \mathrm{m/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3">
    <line x1="137.5" y1="20" x2="137.5" y2="160"/><line x1="205" y1="20" x2="205" y2="160"/><line x1="272.5" y1="20" x2="272.5" y2="160"/>
  </g>
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5">
    <rect x="267.8" y="22" width="45.2" height="16"/>
    <rect x="158.8" y="46" width="94.8" height="16"/>
    <rect x="130.4" y="70" width="99.1" height="16"/>
    <rect x="122.5" y="94" width="85.7" height="16"/>
    <rect x="108.1" y="118" width="26.0" height="16"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="64" y="34">−150</text><text x="64" y="58">−200</text><text x="64" y="82">−225</text>
    <text x="64" y="106">−250</text><text x="64" y="130">−300</text><text x="64" y="153">−324</text>
  </g>
  <text x="80" y="153" font-size="11" fill="#b4232c">no window</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="175">10</text><text x="137.5" y="175">15</text><text x="205" y="175">20</text><text x="272.5" y="175">25</text><text x="340" y="175">30</text>
  </g>
  <text x="205" y="193" font-size="11" fill="#1f2a44" text-anchor="middle">burn time (s)</text>
  <text x="12" y="14" font-size="11" fill="#1f2a44">v (m/s)</text>
</svg>
```
:::

::: context landing-ellipse Real landing ellipses
A landing ellipse is the oval on the ground that should contain the touchdown point with high probability, given all the scatter the vehicle might have. It is long in the direction of travel, because small errors in speed and timing stretch out along the path.

Mars landers show how guidance shrinks it. Curiosity, in 2012, targeted an ellipse about $20\ \mathrm{km}$ by $7\ \mathrm{km}$. Perseverance, in 2021, targeted about $7.7\ \mathrm{km}$ by $6.6\ \mathrm{km}$, and added terrain relative navigation (lesson 11) to divert away from hazards inside it. A booster landing on a pad or ship needs its ellipse down to meters, which is why its divert capability matters so much.
:::

::: context specific-impulse What specific impulse measures
Specific impulse, $I_{sp}$, is an engine's fuel efficiency, measured in seconds. One way to read it: how many seconds one kilogram of propellant could hold up its own weight in thrust. Higher is better.

Multiply by $g_0$ and you get the effective exhaust velocity $v_e$ — how fast the exhaust effectively leaves the nozzle. That is the number the rocket equation uses. Kerosene engines near sea level sit around $280$ to $310\ \mathrm{s}$; the $283\ \mathrm{s}$ here is a round, representative value.
:::

::: context gravity-loss The cost of standing still
Gravity loss is the thrust spent holding the vehicle up rather than changing its speed. Every second a rocket burns while fighting gravity costs about $9.8\ \mathrm{m/s}$ of $\Delta v$ that does nothing useful.

Here $18\ \mathrm{s}$ of burn costs $9.80665 \times 18 = 176.5\ \mathrm{m/s}$ — nearly as much as the $225\ \mathrm{m/s}$ of descent speed being removed. This is why a landing burn wants to be short and hard: a gentler, longer burn would pay more gravity loss. The hoverslam is not only forced by the throttle floor; it is also efficient.
:::

::: context divert-triangle Why sideways steering is cheap
At ignition on the $1506\ \mathrm{m}$ divert, the engine must give $22.8\ \mathrm{m/s^2}$ up and $27.9\ \mathrm{m/s^2}$ sideways. One engine delivers both along the diagonal, $\sqrt{22.8^2 + 27.9^2} = 36.0\ \mathrm{m/s^2}$ — exactly the ceiling, drawn here as an arc. Adding the two legs would claim $50.7$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M221.7,142.4 A126,126 0 0,0 121.9,50.9" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="228" y="130" font-size="11" fill="#b4232c">ceiling 36.0</text>
  <line x1="100" y1="175" x2="197.6" y2="175" stroke="#8fb8f0" stroke-width="3"/>
  <line x1="197.6" y1="175" x2="197.6" y2="95.3" stroke="#8fb8f0" stroke-width="3"/>
  <line x1="100" y1="175" x2="197.6" y2="95.3" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="197.6,95.3 184.5,98.2 190.8,105.9" fill="#1d6fd1"/>
  <circle cx="100" cy="175" r="4" fill="#1f2a44"/>
  <text x="148.8" y="192" font-size="11" fill="#1f2a44" text-anchor="middle">sideways 27.9</text>
  <text x="204" y="140" font-size="11" fill="#1f2a44">up 22.8</text>
  <text x="128" y="122" font-size="11" fill="#1d6fd1" text-anchor="end">thrust 36.0</text>
  <text x="12" y="24" font-size="11" fill="#1f2a44">m/s² at ignition</text>
</svg>
```
:::
