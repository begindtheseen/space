---
id: l04-rocket-equation-and-variable-mass
title: The rocket equation and the variable-mass equations of motion, derived cold
minutes: 21
covers:
  - "Whiteboard derivations under time pressure: the rocket equation, rigid-body equations of motion under thrust, the Kalman filter update, proportional navigation, Euler equations, the Clohessy-Wiltshire equations"
---

Picture yourself sitting on a skateboard, holding a heavy bag of baseballs. You throw one ball backward, hard. The ball goes one way and you roll the other way. Throw another, and you speed up a little more. Each throw also makes you lighter, so each later throw pushes you along a bit more easily. That is a rocket. The engine throws gas backward very fast, and the vehicle rolls forward, getting lighter all the time.

Almost every GNC interview panel asks for the **rocket equation** — the formula that says how much speed a rocket can gain from the propellant it carries. And almost every panel that asks for it asks a second question right away: *why does it contain no thrust term?* That second question is the real one. Writing $\Delta v = v_e \ln(m_0/m_f)$ from memory proves nothing. The panel wants to see you rebuild the argument that produces it. They also want to know whether you can say exactly where a careless use of Newton's second law goes wrong for a body that throws away its own mass. Plenty of candidates who know the formula perfectly still slip on that, so it separates people well.

This lesson derives both. First, the rocket equation itself, from momentum conservation, with nothing assumed. Then the full equations of motion for a vehicle whose mass changes — straight-line and turning — with thrust, gravity and control moments. Learn this one cold. It is the shortest of the six core derivations and the one most likely to open a dynamics round, which makes it the worst one to stumble on.

## The rocket equation, from momentum conservation

Start with the skateboard again. Before a throw, you and the ball move together. After the throw, you move a bit faster and the ball moves backward. Nothing outside pushed on the pair of you, so the total **momentum** — mass times velocity, the "amount of motion" — is the same before and after. That one fact is the whole derivation.

Now set it up carefully, because care is what turns a recitation into a derivation. Work in one dimension, with no outside forces for now.

- At time $t$ the vehicle has mass $m$ and velocity $v$.
- In a short time $dt$ ("d t", a tiny slice of time), it throws a small mass $dm_p > 0$ of propellant backward. Read $dm_p$ as "d m sub p", a tiny bit of propellant.
- That propellant leaves at speed $v_e$ ("v sub e", the **exhaust velocity**) *measured relative to the vehicle*.
- So the vehicle's mass drops by $dm_p$, and its velocity changes by $dv$.

The move that makes this solvable in one step is to choose the right system. Treat **the vehicle plus the propellant it is about to throw out** as one **[[closed system|closed-system]]** during $dt$. That is a fixed set of particles: nothing enters, nothing leaves. For a fixed set of particles with no outside force, momentum is conserved, full stop. This is exactly where Newton's second law holds with no fine print.

**Momentum before.** The whole system moves together at $v$:

$$
p(t) = m v.
$$

**Momentum after.** The lighter vehicle moves at $v + dv$. The thrown parcel moves at $v - v_e$ in the ground's frame: the vehicle's velocity, minus the exhaust speed, because the exhaust goes backward.

$$
p(t+dt) = (m - dm_p)(v + dv) + dm_p (v - v_e).
$$

**Set them equal**, $p(t + dt) = p(t)$:

$$
(m - dm_p)(v+dv) + dm_p(v - v_e) = mv.
$$

Multiply out the brackets, term by term:

$$
mv + m\,dv - dm_p\,v - dm_p\,dv + dm_p\,v - dm_p\,v_e = mv.
$$

Now tidy up, one move at a time.

1. $mv$ appears on both sides, so it cancels.
2. $-dm_p\,v$ and $+dm_p\,v$ cancel each other exactly.
3. $dm_p\,dv$ is **[[a tiny amount times a tiny amount|tiny-times-tiny]]**. It shrinks much faster than the other terms as $dt$ goes to zero, so it drops out in the limit.

What is left is

$$
m\,dv = v_e\,dm_p.
$$

In words: the vehicle's gain in momentum equals the momentum the exhaust carried backward, measured relative to the vehicle.

Next, switch from "propellant thrown out" to "change in the vehicle's own mass". Propellant leaving means the vehicle's mass $m$ goes *down*, so write $dm_p = -dm$, where $dm < 0$. Divide by $dt$:

$$
m\,\frac{dv}{dt} = -v_e\,\frac{dm}{dt}.
$$

Now **separate the variables** — put everything with $v$ on one side and everything with $m$ on the other — and add up (integrate) from the start of the burn $(m_0, v_0)$ to the end $(m_f, v_f)$, keeping $v_e$ constant:

$$
\int_{v_0}^{v_f} dv = -v_e \int_{m_0}^{m_f} \frac{dm}{m} = -v_e\left[\ln m_f - \ln m_0\right].
$$

The left side is $v_f - v_0 = \Delta v$ ("delta v", the change in speed). On the right, pull the minus sign inside using $-(\ln m_f - \ln m_0) = \ln m_0 - \ln m_f = \ln(m_0/m_f)$. So

$$
\Delta v = v_e \ln\frac{m_0}{m_f}.
$$

Read it aloud as "delta v equals v e times the **[[natural log|natural-log]]** of m zero over m f". Here $m_0$ is the starting (wet) mass and $m_f$ is the final (burnout) mass.

That is the whole derivation. Now notice what never showed up in it: thrust, burn time, mass flow rate. The answer is a sum over the *whole burn*. It depends only on the masses at the two ends and on the exhaust speed in between. It does not care how fast you got from one end to the other.

That is exactly why the rocket equation "contains no thrust term". Thrust and mass flow rate decide how *quickly* you work through the burn. That sets the **[[gravity and drag losses|gravity-drag-losses]]**, and the structural loads. Those are real, and often large, on an actual flight. But they do not enter the *ideal* $\Delta v$ at all. They are subtracted from it afterward.

Engineers often quote the engine's efficiency as **[[specific impulse|specific-impulse]]** $I_{sp}$, in seconds, instead of $v_e$. The two are linked by $v_e = I_{sp}\,g_0$, where $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. So an engine with $I_{sp} = 311\,\mathrm{s}$ has $v_e \approx 3050\,\mathrm{m/s}$.

::: key
$\Delta v = v_e \ln(m_0/m_f) = I_{sp}\,g_0 \ln(m_0/m_f)$. It follows from momentum conservation on the closed system of vehicle-plus-about-to-be-ejected-propellant. No thrust term: thrust and mass flow rate set burn duration and therefore gravity and drag losses, not the ideal velocity change.
:::

## Why staging exists, and why reuse is expensive

Think of a hike with a backpack of water bottles. If you could drop each empty bottle as you finish it, you would stop carrying dead weight. A rocket stage that drops its empty tanks does the same.

Here is the precise reason it matters. Because $\Delta v$ depends on the mass ratio through a *logarithm*, each extra bit of mass ratio buys less and less $\Delta v$. That one fact is the entire argument for staging.

Check the demand with numbers. Reaching low Earth orbit takes roughly $9.4\,\mathrm{km/s}$ of design $\Delta v$: about $7.8\,\mathrm{km/s}$ of orbital speed, plus roughly $1.5$–$1.6\,\mathrm{km/s}$ lost to gravity and drag. Take $v_e = 3050\,\mathrm{m/s}$. Undo the logarithm by raising $e$ to both sides, $m_0/m_f = e^{\Delta v / v_e}$. A single stage would need a **mass ratio** $MR = m_0/m_f$ of

$$
MR = e^{9400/3050} \approx 21.8.
$$

That means $1 - 1/21.8 \approx 95.4\%$ of the vehicle would have to be propellant. Under 5% would be left for tanks, engines, structure *and* payload together. Real hardware cannot do that.

Now split the same $\Delta v$ across two stages, each doing half:

$$
MR_{\text{each}} = e^{4700/3050} \approx 4.67.
$$

That is well within what real tanks and structures deliver. It works because of a log rule, $\ln(MR_1 \cdot MR_2) = \ln MR_1 + \ln MR_2$. Mass ratios *multiply*, but the $\Delta v$'s they buy *add*. Splitting the vehicle lets the second stage start with a fresh, small $m_0$ instead of dragging the first stage's empty tanks all the way up.

::: example Two-stage split, checked
Total requirement $\Delta v = 9400\,\mathrm{m/s}$, with $v_e = 3050\,\mathrm{m/s}$ for every stage to keep it simple.

**One stage.** $MR = e^{9400/3050} = e^{3.082} \approx 21.8$. The propellant fraction is $1 - 1/21.8 \approx 0.954$, over 95%. Not buildable.

**Two equal stages.** Each does $4700\,\mathrm{m/s}$, so $MR_{\text{each}} = e^{4700/3050} = e^{1.541} \approx 4.67$.

**Check that the pieces add back up.** The two stages together have an overall ratio $4.67 \times 4.67 = 4.67^2 \approx 21.8$. Then $v_e \ln(4.67^2) = 3050 \times \ln(21.8) = 9400\,\mathrm{m/s}$. That recovers the total exactly. So "ratios multiply, $\Delta v$'s add" holds in the algebra as well as in the physics.

Sanity check: $4.67$ is exactly $\sqrt{21.8}$, as it must be when two equal factors multiply to $21.8$. And it is far below half of $21.8$, which is the whole point of staging.
:::

The same logarithm is the honest reason reuse is hard. Recovery hardware — landing legs, grid fins, extra propellant saved for the landing burn — is dry mass carried the whole way up. It sits inside the same logarithm as the payload. It costs you at the rate the logarithm charges near your working mass ratio. For a first stage that cost is real but survivable, which is why reusable boosters fly. A reusable *upper* stage works at a much less forgiving mass ratio for its job, so the same hardware hurts far more. That is a much harder problem.

## Why $F = ma$ is wrong for a rocket

Here is the trap. It is worth writing out, because it is exactly the wrong turn a careless derivation takes. Reaching for Newton's second law, you might write

$$
F = \frac{d(mv)}{dt} = m\frac{dv}{dt} + v\frac{dm}{dt},
$$

using the **product rule** (the derivative of a product is "first times derivative of second, plus second times derivative of first"). Then you call the whole right side "force", and call the second term, $v\,dm/dt$, the thrust.

This is wrong. The cleanest way to see it is that the answer is **frame-dependent** — it changes when you change who is watching.

Picture two observers. One stands on the launch pad. The other rides in a car moving at a steady speed. Both are in an **[[inertial frame|inertial-frame]]**: neither is speeding up or turning. A real force, like the push of the engine, must be the same number for both of them. But $v$ in that formula is the vehicle's velocity as *you* measure it. So $v\,dm/dt$ changes when you switch observers. No real force can do that.

A quick number makes it concrete. Say the rocket loses mass at $dm/dt = -10\,\mathrm{kg/s}$. If you see it moving at $100\,\mathrm{m/s}$, the naive "thrust" is $100 \times (-10) = -1000\,\mathrm{N}$. Your friend in the car sees it at $200\,\mathrm{m/s}$ and gets $-2000\,\mathrm{N}$. Same engine, same instant, two different forces. A formula for a physical force that depends on the observer cannot be right, however it was found.

The derivation above never makes this mistake. It never differentiates $m(t)v(t)$ as if the vehicle alone were a closed system. It is not closed: it keeps losing mass to the exhaust. So $m(t)v(t)$ is only part of a system whose momentum is really conserved.

Now allow an outside force $F_{\text{ext}}$ — gravity, aerodynamic drag — alongside the engine. The result from the derivation becomes

$$
m\,\frac{dv}{dt} = T + F_{\text{ext}}, \qquad T \equiv -v_e\,\frac{dm}{dt}.
$$

Here $T$ is the thrust. (The symbol $\equiv$, read "is defined as", means this is a definition.) Since $dm/dt < 0$, $T$ comes out positive. Because it is built from $v_e$, the exhaust speed *relative to the vehicle*, and not from any observer's velocity, it is the same for every inertial observer — exactly as a real force must be.

So the trap and the fix differ in one place. The wrong version differentiates the vehicle's own momentum alone and mislabels a bookkeeping term as a force. The right version applies momentum conservation to the vehicle-plus-propellant system and finds the thrust as the **[[momentum flux|momentum-flux]]** carried away by the exhaust.

::: key Why F = ma is wrong for a rocket
Newton applies to a fixed set of particles; a rocket ejects mass. Use momentum conservation on a control volume containing the vehicle plus the propellant leaving in $dt$. The naive $d(mv)/dt$ gives a frame-dependent and therefore wrong thrust term. The correct form is $m\,dv/dt = T + F_{\text{ext}}$ with $T = -v_e\,dm/dt$.
:::

::: warning
If you are asked to defend $m\,dv/dt = T + F_{\text{ext}}$ against the naive $d(mv)/dt$ version, the fastest correct answer is frame independence. A real force cannot depend on which inertial frame you chose to write the equations in. $v\,dm/dt$ does depend on it. $-v_e\,dm/dt$ does not, because $v_e$ is measured relative to the vehicle itself.
:::

## The rotational equations of motion under thrust

Push a shopping cart exactly through its middle and it rolls straight. Push it off to one side and it swings around as it moves. A rocket engine works the same way. If the thrust line misses the **center of mass** — the balance point of the vehicle — it makes the vehicle turn. Engineers use this on purpose to steer.

The same care about what is and is not a closed system carries over to turning. Work in the **body frame**, axes fixed to the vehicle. Let $\mathbf{I}$ be the **inertia tensor**, a $3\times3$ matrix that says how hard the vehicle is to spin about each axis. Let $\boldsymbol{\omega}$ ("omega") be the body angular rate, how fast it is spinning. Then

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times (\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}_{\text{thrust}} + \mathbf{M}_{\text{ext}}, \qquad \mathbf{M}_{\text{thrust}} = \mathbf{r}_{\text{cg}\to\text{gimbal}} \times \mathbf{T}.
$$

Read $\dot{\boldsymbol{\omega}}$ as "omega dot", the rate of change of the spin. $\mathbf{M}$ is a **moment**, or torque — a twisting push. $\mathbf{r}_{\text{cg}\to\text{gimbal}}$ is the arrow from the center of mass (cg, "center of gravity") to the engine's pivot, and $\times$ is the cross product.

This is the rigid-body Euler equation, which lesson 6 derives in full, with the thrust moment added as one of the moments on the right. It is the working form for **thrust vector control** (TVC). A **[[gimbaled|gimbal-tvc]]** engine tilts the thrust by a small angle. The sideways part of the thrust, acting at a distance from the center of mass, makes the control torque that steers the vehicle.

One assumption is worth saying out loud at the board. $\mathbf{I}$ is taken at the current mass distribution, as if frozen for a moment. That is called **quasi-static**. It holds as long as the propellant drains slowly compared with the turning motion you are studying. That is normally true, except in very short, very aggressive maneuvers.

A fully careful treatment of a spinning, mass-ejecting body has one more piece. Name it even if you cannot size it. The exhaust also carries away angular momentum about the spin axis as it leaves. That makes a small extra moment that fights the spin, called **[[jet damping|jet-damping]]**. It comes from the same control-volume logic as the straight-line thrust term, applied to angular momentum instead of ordinary momentum. It matters most for spin-stabilized vehicles, and upper stages that burn or coast while spinning. Its size depends on the mass flow rate and on the shape of the flow leaving the nozzle. That is a modeling detail, not one universal formula. So tell an interviewer it is "the rotational version of the same momentum-flux argument", rather than quoting a number you have not derived.

::: example TVC control moment, worked
An engine makes $T = 800\,\mathrm{kN}$ of thrust. It is gimbaled $5^\circ$ off the vehicle's long axis. The gimbal sits $2\,\mathrm{m}$ from the center of mass, along that axis.

**Step 1: find the sideways part of the thrust.** Only the part of the thrust at right angles to the arm makes a turn. That part is $T\sin(5^\circ)$. With $\sin 5^\circ \approx 0.0872$:

$$
T \sin 5^\circ = 800{,}000 \times 0.0872 \approx 69{,}700\,\mathrm{N}.
$$

**Step 2: multiply by the arm.**

$$
M = T \sin(5^\circ) \times r = 800{,}000 \times 0.0872 \times 2 \approx 1.39\times10^5\,\mathrm{N\,m} \approx 139\,\mathrm{kN\,m}.
$$

**Step 3: sanity check.** This moment has to overcome the vehicle's resistance to turning, fast enough for the attitude loop. Suppose $\mathbf{I}$ about that axis is $5\times10^6\,\mathrm{kg\,m^2}$, plausible for a large launch vehicle. The angular acceleration is $M / I = 1.39\times10^5 / 5\times10^6 \approx 0.028\,\mathrm{rad/s^2}$, on the order of $0.03\,\mathrm{rad/s^2}$. That is comfortably enough for ascent attitude control. Doing this quick check out loud is better than leaving the moment as an unexamined number.
:::

## Check yourself

::: check
Explain, in one line each, why the $-dm_p\,v$ and $+dm_p\,v$ terms cancel in the momentum-conservation expansion, and why the $dm_p\,dv$ term is dropped.
:::

::: answer
They cancel because they are the same amount with opposite signs. One comes from expanding $(m-dm_p)(v+dv)$: that mass has left the vehicle's momentum. The other comes from the thrown parcel's momentum $dm_p(v - v_e)$: that same mass now shows up in the parcel. A closed system's momentum bookkeeping has to include both, so they cancel *exactly*. This is not an approximation.

The $dm_p\,dv$ term is dropped because it is a product of two tiny quantities. As $dt \to 0$ it shrinks faster than the first-order terms, so it adds nothing to the derivative.
:::

::: check
Why does the rocket equation's $\Delta v$ not depend on how long the burn takes, even though a real flight's velocity gain very much depends on burn time through gravity losses?
:::

::: answer
The derivation integrates $dv = -v_e\,dm/m$ over the whole burn. That integral only cares about the mass at the start and the mass at the end, not the path or the rate in between.

Burn time is set by mass flow rate (thrust divided by $v_e$). A slower burn spends more time fighting gravity along the way. That is a real loss (gravity loss, plus drag loss), and it cuts the velocity the trajectory actually gets. But it is a separate loss subtracted from the ideal $\Delta v$, not a change to the ideal formula. The rocket equation describes the ideal case with no outside forces. Gravity and drag losses are exactly the gap between that ideal and reality.
:::

::: check
An interviewer asks you to justify, without hand-waving, why $v\,dm/dt$ cannot be the thrust term. Give the argument in two sentences.
:::

::: answer
Thrust is a physical force made entirely by the engine, so its value cannot depend on which inertial frame the observer chose. $v\,dm/dt$ does depend on that choice, because $v$ is the vehicle's velocity in the chosen frame and changes if you switch to another steadily moving frame, while $-v_e\,dm/dt$ does not, because $v_e$ is measured relative to the vehicle itself — so only the second form can be a real force.
:::

::: check
In the two-stage example, why does splitting the required $\Delta v$ evenly between two stages cut the mass ratio needed per stage from about $21.8$ to about $4.7$, rather than to about $10.9$?
:::

::: answer
Mass ratio enters through a logarithm, not in a straight line: $\Delta v = v_e \ln(MR)$, so $MR = e^{\Delta v/v_e}$. Halving $\Delta v$ halves the *exponent*. Halving an exponent does not halve the result; it takes the square root. $e^{9400/3050} \approx 21.8$, and $\sqrt{21.8} \approx 4.67 = e^{4700/3050}$, matching the two-stage figure exactly.

This is also why staging works so well. The cost sits inside an exponential, so a modest cut in the $\Delta v$ asked of one stage gives a large cut in the mass ratio that stage must reach.
:::

::: check
Why is jet damping worth naming even if you cannot derive its size at the whiteboard, instead of stopping at $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$ with no comment?
:::

::: answer
Naming it shows you see that the turning problem has the same subtlety as the straight-line one. A mass-ejecting body's rotational equations, done carefully, pick up an extra term from angular momentum carried off by the exhaust. That exactly parallels how the translational thrust term came from ordinary momentum carried off by the exhaust.

Saying so shows you understand *why* such a term must exist and where it would come from in a control-volume argument. That beats both leaving it out (missing a real effect) and inventing a formula you have not derived (claiming precision you do not have).
:::

## Summary

| Idea | Statement |
| --- | --- |
| Rocket equation | $\Delta v = v_e \ln(m_0/m_f) = I_{sp} g_0 \ln(m_0/m_f)$, from momentum conservation on the vehicle-plus-ejected-propellant system |
| No thrust term | The result is a whole-burn integral; thrust and mass flow set duration and therefore losses, not the ideal $\Delta v$ |
| Staging | Mass ratios multiply, $\Delta v$'s add — a modest cut in required $\Delta v$ per stage gives a large cut in required mass ratio |
| Why $F=ma$ fails | $d(mv)/dt$ mislabels a frame-dependent bookkeeping term as force; the correct thrust $-v_e\,dm/dt$ is frame-independent |
| Correct translational equation | $m\,dv/dt = T + F_{\text{ext}}$, $T = -v_e\,dm/dt$ |
| Rotational equation under thrust | $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}_{\text{thrust}} + \mathbf{M}_{\text{ext}}$, with $\mathbf{M}_{\text{thrust}}$ from the cg-to-gimbal arm, plus a smaller jet-damping term for a spinning body |

The next lesson gives the same cold-derivation treatment to two formulas built on "best possible" arguments instead of momentum: the Kalman gain and the proportional-navigation guidance law.

::: context closed-system Drawing the box in the right place
Physicists draw an imaginary box around the things they are studying. Newton's laws in their simplest form hold for a box whose contents never change. A rocket alone is a leaky box: mass pours out the back. Draw the box around the rocket *and* the next puff of exhaust, and nothing leaves during $dt$ — so momentum is conserved inside it. Engineers call a box drawn this way a **control volume**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">before: mass m at v</text>
  <rect x="20" y="28" width="140" height="44" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <rect x="60" y="40" width="80" height="20" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="48" cy="50" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="90" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">parcel dm_p still aboard</text>
  <text x="270" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">after dt</text>
  <rect x="200" y="28" width="150" height="44" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <rect x="250" y="40" width="76" height="20" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="214" cy="50" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="326" y1="50" x2="346" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="350,50 342,46 342,54" fill="#1d6fd1"/>
  <text x="288" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">m − dm_p at v + dv</text>
  <text x="214" y="112" font-size="11" text-anchor="middle" fill="#b4232c">v − v_e</text>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#6c7a93">same particles in the dashed box, so same momentum</text>
</svg>
```
:::

::: context tiny-times-tiny Why the double-small term vanishes
Take $dt$ smaller and smaller. The parcel $dm_p$ shrinks in step with $dt$, and so does $dv$. Their product shrinks like $dt^2$. If $dt = 0.001\,\mathrm{s}$, then $dt^2 = 0.000001$ — a thousand times smaller again. When you divide the whole equation by $dt$ and let $dt$ go to zero, every first-order term leaves something behind, but the double-small term leaves nothing. That is what "dropping it in the limit" means. It is not rounding; the answer is exact.
:::

::: context natural-log The natural log in one line
$\ln x$, the **natural logarithm**, answers "$e$ to what power gives $x$?", where $e \approx 2.718$. So $\ln e = 1$ and $\ln 1 = 0$. It turns up here because $\int dm/m = \ln m$: the log is what you get when each bit of propellant pushes a vehicle whose mass is shrinking. Its most useful property for rockets is $\ln(ab) = \ln a + \ln b$, which is why staged mass ratios multiply while their $\Delta v$'s add. To go back the other way, use $e^{x}$.
:::

::: context gravity-drag-losses Where the missing speed goes
A rocket climbing straight up spends every second of its burn with gravity pulling it back at about $9.8\,\mathrm{m/s}$ each second. A slow burn means more seconds of that pull. Air resistance adds more loss low down. Together these are why a launch vehicle budgets roughly $9.4\,\mathrm{km/s}$ of $\Delta v$ to reach an orbit whose speed is only about $7.8\,\mathrm{km/s}$. Burning faster cuts gravity loss but raises drag and structural loads, so thrust is chosen as a trade — which is exactly the part the rocket equation leaves out.
:::

::: context specific-impulse Specific impulse, and why it is in seconds
**Specific impulse** says how much push you get from each kilogram of propellant. Measured "per unit of weight" of propellant at Earth's surface, the units boil down to seconds. Multiply by $g_0 = 9.80665\,\mathrm{m/s^2}$ and you get the effective exhaust velocity: $311\,\mathrm{s} \times 9.80665 \approx 3050\,\mathrm{m/s}$. A kerosene-oxygen engine at sea level sits near $280$–$310\,\mathrm{s}$; hydrogen-oxygen vacuum engines reach about $450$–$465\,\mathrm{s}$. Higher $I_{sp}$ means more $\Delta v$ from the same mass ratio.
:::

::: context inertial-frame What makes a frame "inertial"
A **frame** is a point of view with its own ruler and clock — the launch pad, a car, a train. It is **inertial** if it is not speeding up, slowing down or turning. In such a frame a ball with no force on it rolls in a straight line at steady speed. Newton's laws hold in every inertial frame, and all of them must agree on the size of any real force. Two frames moving at different steady speeds see different velocities, but the same forces. That is the test the naive thrust formula fails.
:::

::: context momentum-flux Thrust as momentum carried away
A garden hose pushes back on your hand because water leaves it carrying momentum. Each second, a mass $|dm/dt|$ leaves at speed $v_e$ relative to the nozzle, so momentum flows out at $|dm/dt|\,v_e$ per second. A flow of momentum per second *is* a force. That is the thrust. (A full engine model adds a pressure term when the exhaust pressure at the nozzle exit differs from the outside air; folding it in gives the "effective" exhaust velocity that $I_{sp}$ quotes.)
:::

::: context gimbal-tvc How a gimbal turns thrust into a turning moment
The engine pivots on a **gimbal**, a joint that lets it tilt. Tilt it by an angle $\delta$ and the thrust splits into a big part along the vehicle ($T\cos\delta$) and a small part sideways ($T\sin\delta$). The sideways part, times the distance from the pivot to the center of mass, is the steering moment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="70" x2="250" y2="70" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="6,4"/>
  <rect x="40" y="56" width="210" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5" opacity="0.6"/>
  <circle cx="130" cy="70" r="5" fill="#1f2a44"/>
  <text x="130" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">center of mass</text>
  <circle cx="250" cy="70" r="4" fill="#b4232c"/>
  <text x="250" y="48" font-size="12" text-anchor="middle" fill="#b4232c">gimbal</text>
  <line x1="130" y1="100" x2="250" y2="100" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="190" y="116" font-size="11" text-anchor="middle" fill="#6c7a93">arm r</text>
  <line x1="250" y1="70" x2="150" y2="140" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="146,143 153,133 158,141" fill="#1d6fd1"/>
  <text x="170" y="152" font-size="12" fill="#1d6fd1">T (thrust)</text>
  <path d="M 222 70 A 28 28 0 0 0 227 86" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="206" y="88" font-size="12" fill="#1f2a44">δ</text>
  <line x1="300" y1="70" x2="300" y2="130" stroke="#b4232c" stroke-width="3"/>
  <polygon points="300,136 295,126 305,126" fill="#b4232c"/>
  <text x="308" y="104" font-size="12" fill="#b4232c">T sin δ</text>
</svg>
```

The angle is exaggerated here; real gimbals tilt a few degrees.
:::

::: context jet-damping The exhaust takes some spin with it
Imagine spinning on an office chair while squirting a water bottle backward from your hand. Each bit of water leaves still carrying some of your sideways swirl, and it takes that swirl away. The result is a gentle brake on the spin. Rocket exhaust does the same, because the gas moving down the nozzle picks up the vehicle's rotation before it leaves. For most launch vehicles the effect is small, but spinning upper stages and spin-stabilized kick motors have to account for it.
:::
