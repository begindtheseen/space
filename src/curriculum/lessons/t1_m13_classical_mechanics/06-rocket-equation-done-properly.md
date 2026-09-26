---
id: l06-rocket-equation-done-properly
title: Variable mass and the rocket equation, done properly
minutes: 23
covers:
  - variable-mass systems and the rocket equation done properly
---

Stand on a skateboard holding a pile of heavy balls. Throw one hard out the back, and you roll forward. Throw another, and you roll a bit faster. Nothing outside pushed you: you pushed the balls backward, and they pushed you forward. A rocket is that skateboard, throwing tiny "balls" of hot gas out the back thousands of times a second.

"Derive the rocket equation" is one of the most common whiteboard questions for a GNC job, and most people who know the answer get the derivation wrong. The usual wrong answer writes Newton's second law as $F = d(mv)/dt$, expands the product, and calls the $v\,dm/dt$ piece the thrust. It gives a right-looking formula by accident, and it falls apart the moment someone asks which frame $v$ is measured in. The interviewer is not checking that you remember $\Delta v = v_e \ln(m_0/m_f)$. They are checking that you know what Newton's second law is a statement *about*.

Lessons 1, 2 and 5 set up the answer. The second law, $\mathbf{F}_{\mathrm{ext}} = d\mathbf{P}/dt$, holds for a *fixed collection of matter* in an inertial frame. A rocket by itself is not a fixed collection of matter. A rocket together with the propellant it is about to throw out is. Apply the law to that system over one tiny time step $dt$, and the equation of motion falls out in five lines, with no confusion about frames. The thrust appears not as an assumption but as the momentum the exhaust carries away. This lesson does that derivation, shows exactly where the naive version fails, adds the pressure term that makes an engine's thrust change with altitude, and integrates to the rocket equation. Lesson 7 adds gravity, drag and steering for a whole ascent.

## The trap

Take a rocket of mass $m(t)$ moving at velocity $v(t)$ along a straight line in an inertial frame. An **external force** $F_{\mathrm{ext}}$ (gravity, drag) acts on it. Its mass goes down because propellant leaves, so the rate of change $\dot{m} = dm/dt$ ("m dot") is negative; the amount leaving per second is its size, $|\dot{m}|$. The tempting move is

$$
F_{\mathrm{ext}} = \frac{d(mv)}{dt} = m\frac{dv}{dt} + v\frac{dm}{dt} \qquad \text{(wrong)},
$$

then rearranging to $m\,dv/dt = F_{\mathrm{ext}} - v\,\dot{m}$ and calling $-v\dot{m}$ the thrust. Two observations show this cannot be physics.

**It depends on who is watching.** Move to another [[inertial frame|same-physics]] cruising at a steady speed $u$ along the line. The acceleration $dv/dt$, the mass, its rate of change and the external force are all the same for this observer. But $v$ becomes $v - u$, so the "thrust" changes by $u\dot{m}$. A Falcon 9 first stage burns about $|\dot{m}| \approx 2750\,\mathrm{kg/s}$. With $u = 1000\,\mathrm{m/s}$, two observers would disagree about the thrust by $2750 \times 1000 = 2.75\,\mathrm{MN}$ — more than a third of the engines' output. The vehicle's acceleration is the same for both, so at least one has the wrong equation. Since neither observer is special, both do.

**It predicts nonsense in the simplest case.** In the frame where the rocket is momentarily at rest, $v = 0$, and the equation shrinks to $m\,dv/dt = F_{\mathrm{ext}}$: no thrust at all. A rocket on the pad would never lift off. And a cart leaking sand out of a hole in its floor — sand leaving with *zero* speed relative to the cart — would speed up as it drained. No cart has ever done that.

The algebra is fine; the product rule is correct. The error is applying $F = dp/dt$ to "the rocket", a system whose membership changes every instant. The momentum of the vehicle at time $t + dt$ minus its momentum at time $t$ is not the momentum change of any fixed collection of matter. Newton's law makes no promise about it.

::: key Newton's second law with changing mass
Newton's second law in the form that survives variable mass is $\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$ applied to a *fixed* system of matter. For a rocket you must include the momentum carried off by the exhaust; $\mathbf{F} = m\mathbf{a}$ — or $d(m\mathbf{v})/dt$ — applied to the shrinking vehicle alone is wrong, and the $\mathbf{v}\,dm/dt$ term it produces is frame-dependent nonsense.
:::

## Choosing the system, and the derivation

Choose the system with care. At time $t$ the system is the whole vehicle — structure, payload, engines and *all* the propellant on board — with mass $m$ and velocity $\mathbf{v}$ in an inertial frame. This is a [[fixed collection of matter|fixed-system]]: we follow exactly these atoms for the next $dt$. Its momentum is

$$
\mathbf{P}(t) = m\,\mathbf{v}.
$$

During $dt$ a small parcel of propellant, of mass $dm_e$ (a positive number; the vehicle's mass changes by $dm = -dm_e$), goes out through the nozzle. It leaves at velocity $\mathbf{v}_e$ *relative to the vehicle*, pointing backward. At the end of the step the same matter is in two pieces:

- the vehicle, now of mass $m - dm_e$, moving at $\mathbf{v} + d\mathbf{v}$;
- the parcel, whose inertial velocity is the vehicle's velocity plus its own relative velocity: $\mathbf{v} - \mathbf{v}_e$.

(Whether we use $\mathbf{v}$ or $\mathbf{v} + d\mathbf{v}$ for the vehicle's speed in that last line changes the answer only by $dm_e\,d\mathbf{v}$, a product of two tiny numbers, which we drop.) So

$$
\mathbf{P}(t + dt) = (m - dm_e)(\mathbf{v} + d\mathbf{v}) + dm_e\,(\mathbf{v} - \mathbf{v}_e).
$$

Multiply out the brackets and drop the tiny product $dm_e\,d\mathbf{v}$:

$$
\mathbf{P}(t + dt) = m\mathbf{v} + m\,d\mathbf{v} - dm_e\,\mathbf{v} + dm_e\,\mathbf{v} - dm_e\,\mathbf{v}_e = m\mathbf{v} + m\,d\mathbf{v} - dm_e\,\mathbf{v}_e .
$$

Watch the two terms $-dm_e\,\mathbf{v}$ and $+dm_e\,\mathbf{v}$ cancel. The first is the momentum the vehicle *loses by losing mass*. The second is the momentum the parcel *has because it was riding along with the vehicle*. They are the same momentum, written on two sides of the ledger, and the observer's velocity disappears with them. What survives is the momentum the parcel carries *relative to the vehicle* — the one thing every inertial observer agrees on.

Now apply the second law to the fixed system. The external force times the time step equals the change in momentum:

$$
\mathbf{F}_{\mathrm{ext}}\,dt = \mathbf{P}(t + dt) - \mathbf{P}(t) = m\,d\mathbf{v} - dm_e\,\mathbf{v}_e .
$$

Divide by $dt$, write $dm_e/dt = |\dot{m}|$, and move the exhaust term to the right:

$$
m\frac{d\mathbf{v}}{dt} = \mathbf{F}_{\mathrm{ext}} + \mathbf{v}_e|\dot{m}| .
$$

This is the equation of motion of a rocket. Mass times acceleration equals the external force plus a term $\mathbf{v}_e|\dot{m}|$. Because $\mathbf{v}_e$ points backward, the minus sign we moved across makes this term point *forward*. It is the **thrust**, $\mathbf{T} = \mathbf{v}_e|\dot{m}|$, of size $T = |\dot{m}|\,v_e$ — exactly the $T = \dot{m} v_e$ lesson 2 got from the definition of specific impulse. It is a force on the vehicle in the ordinary sense: the push of hot gas on the combustion chamber and nozzle walls. The derivation shows why it has the size it does. It is the rate at which momentum is handed to the exhaust, measured relative to the vehicle.

No outside object appears in the thrust. The rocket does not push against the air, or the pad, or anything else; it pushes against its own exhaust, and works better in vacuum than in air. And the external forces act on the mass $m$ actually on board at that instant. That is the correct sense in which the mass "varies": $m$ is a known function of time on the left side, not something to be differentiated on the right.

::: key The correct equation of motion
The correct equation of motion for a rocket under external forces is $m\,d\mathbf{v}/dt = \mathbf{F}_{\mathrm{ext}} + \mathbf{v}_e|\dot{m}| = \mathbf{F}_{\mathrm{ext}} + \mathbf{T}$, with $\mathbf{T}$ the thrust. The propellant term appears as a force because of the momentum it carries away, not because mass is changing inside $F = ma$.
:::

### Variable-mass systems in general

The same derivation covers any body that gains or loses mass. If matter joins or leaves at velocity $\mathbf{u}$ *relative to the body*, at rate $dm/dt$ (positive for gaining, negative for losing), then

$$
m\frac{d\mathbf{v}}{dt} = \mathbf{F}_{\mathrm{ext}} + \mathbf{u}\,\frac{dm}{dt},
$$

sometimes called the **[[Meshchersky equation|meshchersky]]**. Three cases:

- **Rocket.** $\mathbf{u} = -\mathbf{v}_e$ and $dm/dt = -|\dot{m}|$. Two minus signs make a plus: the extra term is $+\mathbf{v}_e|\dot{m}|$, the thrust.
- **Leaking sand cart.** $\mathbf{u} = 0$, so there is no extra term. Draining does not change the cart's speed, which is what really happens.
- **Scoop gathering still air** while moving at $\mathbf{v}$. The air arrives at $\mathbf{u} = -\mathbf{v}$ relative to the scoop, and $dm/dt > 0$, so the extra force is $-\mathbf{v}\,dm/dt$, a drag. It is the momentum cost of bringing the collected air up to the scoop's speed.

In every case the *relative* velocity appears, never the body's own inertial velocity. That is the sign of a correct variable-mass equation.

::: warning Two bookkeeping slips
The two most common errors in this derivation are both bookkeeping. One is giving the parcel an inertial velocity of $-\mathbf{v}_e$ instead of $\mathbf{v} - \mathbf{v}_e$ — forgetting that the propellant was moving with the vehicle before it left. That sneaks the bogus $\mathbf{v}\,dm/dt$ term back in. The other is defining the system as "the vehicle at time $t$" and comparing it with "the vehicle at time $t + dt$", which are different collections of matter. Always name the fixed system — vehicle plus the parcel about to leave — and follow it.
:::

## The thrust equation with back pressure

Hold your hand flat against the open end of a garden hose. You feel the water's momentum, but you also feel its pressure. An engine's thrust has the same two parts. The derivation above lumped them together by treating $v_e$ as whatever makes $T = |\dot{m}|\,v_e$ true. Splitting them explains why one engine has two different specific impulses.

Draw a boundary around the vehicle — engineers call it a **control volume**, a region you watch matter flow out of. It follows the outer skin and is closed off by the flat disk across the nozzle's exit, the **exit plane**, of area $A_e$. Gas crosses the exit plane at its real speed $v_{e,\mathrm{exit}}$ and at pressure $p_e$, which usually differs from the surrounding air pressure $p_a$ ("ambient"). The air presses on every bit of the skin with $p_a$. If it also pressed on the exit plane with $p_a$, all the pressure forces would cancel, because an even pressure all over a closed surface has no net push. But on the [[exit plane|exit-pressure]] the pressure is $p_e$, not $p_a$. The difference, $(p_e - p_a)$ times $A_e$, is a net push — forward when $p_e > p_a$. Adding it to the momentum term gives the **thrust equation**:

$$
T = |\dot{m}|\,v_{e,\mathrm{exit}} + (p_e - p_a)\,A_e .
$$

The **effective exhaust velocity** $v_e$ is then defined so that $T = |\dot{m}|\,v_e$ still holds:

$$
v_e = v_{e,\mathrm{exit}} + \frac{(p_e - p_a)\,A_e}{|\dot{m}|}, \qquad I_{sp} = \frac{v_e}{g_0}.
$$

Here $I_{sp}$ is the specific impulse and $g_0 = 9.80665\,\mathrm{m/s^2}$. The equation of motion keeps using $v_e$ and $T$. The split matters when you ask how $T$ changes with altitude:

- The mass flow is set upstream, by the pumps, injectors and chamber pressure. It does not know what the outside pressure is.
- $v_{e,\mathrm{exit}}$ and $p_e$ are set by the chamber and the nozzle's shape.
- Only $p_a$ changes, from about $101\,\mathrm{kPa}$ at sea level to zero in vacuum.

So thrust rises with altitude by exactly $p_a A_e$, and vacuum $I_{sp}$ beats sea-level $I_{sp}$ by $p_{a,0} A_e / (|\dot{m}| g_0)$, where $p_{a,0}$ is sea-level pressure. A **[[vacuum-optimized engine|vacuum-nozzle]]** carries a much bigger nozzle — larger $A_e$, lower $p_e$ — because with $p_a = 0$ there is no penalty for expanding the gas further. The same nozzle at sea level would have $p_e$ far below $p_a$, a large negative pressure term, and flow that peels away from the nozzle wall.

::: key The thrust equation
The rocket thrust equation including back pressure is $F = \dot{m}\,v_{e,\mathrm{exit}} + (p_e - p_a)A_e$. The pressure term is why sea-level and vacuum $I_{sp}$ differ for the same engine: $\dot{m}$ and the exit conditions are fixed upstream, and only $p_a$ changes with altitude.
:::

::: example One engine, two thrusts
A kerosene–oxygen engine passes $|\dot{m}| = 300\,\mathrm{kg/s}$ through a nozzle with exit area $A_e = 0.68\,\mathrm{m^2}$ (about $0.93\,\mathrm{m}$ across). Gas leaves at $v_{e,\mathrm{exit}} = 2911\,\mathrm{m/s}$ and $p_e = 60\,\mathrm{kPa}$ — figures chosen to match the Merlin 1D's published thrusts. Find thrust, effective exhaust velocity and $I_{sp}$ at sea level ($p_a = 101.3\,\mathrm{kPa}$), at $10\,\mathrm{km}$ ($p_a = 26.5\,\mathrm{kPa}$) and in vacuum.

**Momentum term** (the same everywhere): $300 \times 2911 = 8.733 \times 10^{5}\,\mathrm{N}$.

**Sea level.** Pressure term: $(60{,}000 - 101{,}325) \times 0.68 \approx -2.81 \times 10^{4}\,\mathrm{N}$ — negative, the air pushes back. So $T \approx 873{,}300 - 28{,}100 \approx 845\,\mathrm{kN}$. Then $v_e = 845{,}200 / 300 \approx 2817\,\mathrm{m/s}$ and $I_{sp} = 2817 / 9.80665 \approx 287\,\mathrm{s}$.

**10 km.** Pressure term: $(60{,}000 - 26{,}500) \times 0.68 \approx +2.28 \times 10^{4}\,\mathrm{N}$, so $T \approx 896\,\mathrm{kN}$ — already 6% more than at liftoff, burning propellant at the same rate.

**Vacuum.** Pressure term: $60{,}000 \times 0.68 = 4.08 \times 10^{4}\,\mathrm{N}$, so $T \approx 914\,\mathrm{kN}$, $v_e \approx 3047\,\mathrm{m/s}$ and $I_{sp} \approx 311\,\mathrm{s}$.

**Sense check.** The whole $69\,\mathrm{kN}$ gap between sea level and vacuum is $p_{a,0} A_e = 101{,}325 \times 0.68$. The mass flow did not change, and neither did the gas speed at the exit. Only the air pushing back on the exit plane changed. (Public figures round the sea-level $I_{sp}$ to $282\,\mathrm{s}$; the gap is in rounding of published thrust and flow, not in the physics.)
:::

## Integrating: the rocket equation

Go back to the equation of motion and switch off the external force — deep space, or a burn short enough that gravity and drag do little. Along the thrust direction, and using $|\dot{m}| = -dm/dt$:

$$
m\,\frac{dv}{dt} = |\dot{m}|\,v_e = -v_e\,\frac{dm}{dt}
\quad \Rightarrow \quad
dv = -v_e\,\frac{dm}{m}.
$$

The second step multiplied both sides by $dt$ and divided by $m$. Look at what is left: the speed gained depends only on the *fraction* of mass thrown out, $dm/m$, not on how fast it is thrown or how long the burn takes. With $v_e$ constant, add up from starting mass $m_0$ to final mass $m_f$ (the integral of $dm/m$ is the **natural logarithm**, $\ln$):

$$
\Delta v = v_e \ln\frac{m_0}{m_f} = I_{sp}\,g_0\,\ln\frac{m_0}{m_f}.
$$

This is the **[[rocket equation|tsiolkovsky]]**, also called Tsiolkovsky's equation. Turned around, it gives the **mass ratio** needed for a given $\Delta v$, $m_0 / m_f = e^{\Delta v / v_e}$, and the **propellant mass fraction** $m_p / m_0 = 1 - e^{-\Delta v / v_e}$, where $m_p$ is the propellant burned.

That [[exponential|exponential-cost]] is the whole problem of launch-vehicle design. To gain a $\Delta v$ equal to $v_e$, you must throw away 63% of the vehicle; for $2 v_e$, 86%; for $3 v_e$, 95%. Reaching low Earth orbit takes about $9.4\,\mathrm{km/s}$ of ideal $\Delta v$ (lesson 7 explains why that is more than the $7.8\,\mathrm{km/s}$ orbital speed). With kerosene–oxygen at $311\,\mathrm{s}$, $v_e \approx 3050\,\mathrm{m/s}$, so that is $3.08\,v_e$, and the mass ratio is $e^{3.08} \approx 21.8$. The vehicle on the pad must weigh 21.8 times everything that reaches orbit, tanks and engines included. No single-stage structure has ever been built that light. **Staging** — dropping empty tanks partway up — is how the exponential is beaten.

::: example The Falcon 9 first stage, ideal
A Falcon 9 lifts off at about $549\,\mathrm{t}$, and its first stage burns about $411\,\mathrm{t}$ of propellant. What is the stage's ideal $\Delta v$ — the speed it would gain in empty space — at sea-level and at vacuum $I_{sp}$?

**Mass ratio.** $m_f = 549 - 411 = 138\,\mathrm{t}$, so $m_0 / m_f = 549 / 138 \approx 3.98$, and $\ln 3.98 \approx 1.381$.

**Sea-level $I_{sp}$, 282 s.** $v_e = 282 \times 9.80665 \approx 2765\,\mathrm{m/s}$, so $\Delta v = 2765 \times 1.381 \approx 3.82\,\mathrm{km/s}$.

**Vacuum $I_{sp}$, 311 s.** $v_e \approx 3050\,\mathrm{m/s}$, so $\Delta v \approx 4.21\,\mathrm{km/s}$.

The real burn starts at sea-level performance and ends near vacuum performance, so the ideal $\Delta v$ is about $4.0\,\mathrm{km/s}$.

**Now add gravity**, for a straight-up burn. With $F_{\mathrm{ext}} = -mg$, the equation of motion is $m\,dv/dt = T - mg$. Divide by $m$ and multiply by $dt$: $dv = -v_e\,dm/m - g\,dt$. Adding up over the burn time $t_b$,

$$
\Delta v = v_e \ln\frac{m_0}{m_f} - g\,t_b .
$$

At $|\dot{m}| \approx 2750\,\mathrm{kg/s}$ the burn lasts $t_b = 411{,}000 / 2750 \approx 149\,\mathrm{s}$. Then $g t_b \approx 9.8 \times 149 \approx 1.46\,\mathrm{km/s}$ would be lost — more than a third of the ideal $\Delta v$ — if the stage flew straight up the whole time. This **gravity loss** grows with $t_b$, so a higher thrust-to-weight ratio (a shorter burn) loses less, and flying horizontally loses none. Lesson 7 turns $g$ into $g\sin\gamma$ and shows how a gravity turn keeps the loss nearer $1.2\,\mathrm{km/s}$ for the whole ascent.
:::

::: example Propellant for a station-keeping budget
A $2000\,\mathrm{kg}$ satellite needs $100\,\mathrm{m/s}$ of $\Delta v$ over its life. How much propellant does that take with a hydrazine thruster at $I_{sp} = 220\,\mathrm{s}$, and with an **[[ion thruster|ion-thruster]]** at $3000\,\mathrm{s}$?

**Formula.** $m_p = m_0\left(1 - e^{-\Delta v / v_e}\right)$.

**Hydrazine.** $v_e = 220 \times 9.80665 \approx 2157\,\mathrm{m/s}$, so $\Delta v / v_e = 100/2157 = 0.0464$ and $m_p = 2000 \times (1 - e^{-0.0464}) \approx 90.6\,\mathrm{kg}$.

**Ion.** $v_e \approx 29{,}420\,\mathrm{m/s}$, so $\Delta v / v_e = 0.0034$ and $m_p \approx 6.8\,\mathrm{kg}$.

**Sense check.** When $\Delta v / v_e$ is small, the exponential is nearly a straight line and $m_p \approx m_0 \Delta v / v_e$: for hydrazine, $2000 \times 0.0464 = 92.8\,\mathrm{kg}$, close to $90.6$. That is lesson 2's impulse relation, $m\,\Delta v = m_p v_e$ — the rocket equation turns into impulse bookkeeping when the mass barely changes. The ion thruster saves $84\,\mathrm{kg}$. The price is thrust of tens of millinewtons and burns lasting weeks, where the quick-burn picture fails and the full equation of motion must be integrated.
:::

## Checking it numerically

The equation of motion is a pair of rate equations, $\dot{v} = T/m + F_{\mathrm{ext}}/m$ and $\dot{m} = -T/v_e$. Integrated in empty space, it must reproduce $v_e \ln(m_0/m_f)$ up to the step-size error. This is the first test to write for any rocket simulation: switch off gravity and drag, and check the logarithm. The code below steps forward with **[[Euler's method|euler-method]]**.

```python
import math

def burn(m0, mp, thrust, v_e, dt=0.01):
    """Integrate m dv/dt = T, dm/dt = -T/v_e in free space (Euler)."""
    m, v = m0, 0.0
    while m > m0 - mp:
        v += thrust / m * dt
        m -= thrust / v_e * dt
    return v

v_e = 311 * 9.80665
print(burn(549e3, 411e3, 7.6e6, v_e), v_e * math.log(549 / 138))
# 4211.5...  4211.39...   -> agree to the step-size error of Euler
```

The thrust level and burn time cancel out of the final speed, as the derivation said they must; only $v_e$ and the mass ratio survive. If your simulation's empty-space $\Delta v$ depends on the thrust level, the mass is being differentiated somewhere it should not be.

## Check yourself

::: check
A $500\,\mathrm{kg}$ cart rolls without friction at $3.0\,\mathrm{m/s}$ and leaks $2\,\mathrm{kg/s}$ of sand through a hole in its floor. What is its velocity after $60\,\mathrm{s}$? What does the naive $F = d(mv)/dt$ predict?
:::

::: answer
The sand leaves with zero velocity relative to the cart. In $m\,dv/dt = F_{\mathrm{ext}} + \mathbf{u}\,dm/dt$, the relative velocity $\mathbf{u} = 0$ and $F_{\mathrm{ext}} = 0$, so $dv/dt = 0$. The cart is still at $3.0\,\mathrm{m/s}$, now with $500 - 2 \times 60 = 380\,\mathrm{kg}$ on board.

Its momentum fell from $1500$ to $1140\,\mathrm{kg\,m/s}$. The missing $360\,\mathrm{kg\,m/s}$ went with the sand, which was still moving forward at $3.0\,\mathrm{m/s}$ as it fell out.

The naive formula says $0 = m\,dv/dt + v\,dm/dt$, so $dv/dt = -v\dot{m}/m = 3.0 \times 2 / m > 0$: the cart would speed up as it emptied, with no force on it. That is the frame-dependent term doing damage in the simplest possible case.
:::

::: check
A stage with $v_e = 3050\,\mathrm{m/s}$ is moving at $4000\,\mathrm{m/s}$ in an Earth-centered inertial frame (ECI). Which way is its exhaust moving in that frame? Does the engine still give its full thrust?
:::

::: answer
The exhaust's inertial velocity is $v - v_e = 4000 - 3050 = +950\,\mathrm{m/s}$. It is moving *forward*, the same way as the vehicle, at nearly a kilometer per second.

The thrust is unchanged at $|\dot{m}|\,v_e$, because the equation of motion depends only on the exhaust velocity *relative to the vehicle*. Each parcel leaves still moving forward, but $3050\,\mathrm{m/s}$ slower than it was a moment before on board; that lost momentum is what the vehicle gains. It is lesson 3's Oberth effect, seen through momentum.
:::

::: check
A second stage has $4\,\mathrm{t}$ of dry mass, carries $111\,\mathrm{t}$ of propellant, and delivers a $15\,\mathrm{t}$ payload with a vacuum $I_{sp}$ of $348\,\mathrm{s}$. What ideal $\Delta v$ can it give? How does the answer change for a $30\,\mathrm{t}$ payload?
:::

::: answer
$v_e = 348 \times 9.80665 \approx 3413\,\mathrm{m/s}$. Starting mass $4 + 111 + 15 = 130\,\mathrm{t}$; final mass $4 + 15 = 19\,\mathrm{t}$. So $\Delta v = 3413 \ln(130 / 19) \approx 3413 \times 1.923 \approx 6.56\,\mathrm{km/s}$.

With $30\,\mathrm{t}$ of payload: $3413 \ln(145 / 34) \approx 3413 \times 1.450 \approx 4.95\,\mathrm{km/s}$.

Doubling the payload costs $1.6\,\mathrm{km/s}$, because the mass ratio drops from $6.84$ to $4.26$, and the logarithm punishes that hard.
:::

::: check
An engine's data sheet lists $845\,\mathrm{kN}$ at sea level and $914\,\mathrm{kN}$ in vacuum. A colleague concludes the turbopump delivers 8% more propellant in vacuum. Correct them, and estimate the nozzle exit area.
:::

::: answer
The mass flow is set by the pumps and injectors upstream of the nozzle and does not depend on outside pressure. The exit speed and exit pressure are set by the chamber and nozzle shape, and do not depend on it either. Only the $-p_a A_e$ part of the pressure term $(p_e - p_a)A_e$ changes.

So $T_{\mathrm{vac}} - T_{\mathrm{sl}} = p_{a,0} A_e$, which gives $A_e \approx 69{,}000 / 101{,}325 \approx 0.68\,\mathrm{m^2}$ — an exit about $0.93\,\mathrm{m}$ across, a sensible size for an engine of this class.
:::

::: check
A $2000\,\mathrm{kg}$ spacecraft in a $400\,\mathrm{km}$ circular orbit makes the $3.18\,\mathrm{km/s}$ escape burn of lesson 4 with an engine of $I_{sp} = 311\,\mathrm{s}$. How much of the spacecraft is propellant? Why is it fair to use the rocket equation directly, even though gravity acts during the burn?
:::

::: answer
$v_e = 3050\,\mathrm{m/s}$, so $m_p = 2000\,(1 - e^{-3180/3050}) = 2000\,(1 - e^{-1.043}) \approx 2000 \times 0.647 \approx 1295\,\mathrm{kg}$ — almost two thirds of the spacecraft.

The rocket equation ignores $F_{\mathrm{ext}}$. That is fair when the burn is short compared with the orbit: gravity then points nearly at right angles to a burn along the velocity, so it barely changes the speed during the burn. The correction is lesson 7's gravity-loss integral — small for a chemical burn of a few minutes, large for an electric-propulsion spiral lasting months.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{F}_{\mathrm{ext}} = d\mathbf{P}/dt$ | applies to a fixed collection of matter; for a rocket, the vehicle plus the parcel about to leave |
| $d(m\mathbf{v})/dt = m\dot{\mathbf{v}} + \mathbf{v}\dot{m}$ applied to the vehicle alone | wrong: $\mathbf{v}\dot{m}$ is frame-dependent, predicts no liftoff in the rest frame and a self-accelerating leaking cart |
| $\mathbf{P}(t+dt) = (m - dm_e)(\mathbf{v} + d\mathbf{v}) + dm_e(\mathbf{v} - \mathbf{v}_e)$ | momentum of the fixed system after $dt$; the $\pm dm_e\mathbf{v}$ terms cancel |
| $m\,d\mathbf{v}/dt = \mathbf{F}_{\mathrm{ext}} + \mathbf{v}_e\lvert\dot{m}\rvert = \mathbf{F}_{\mathrm{ext}} + \mathbf{T}$ | equation of motion of a rocket; thrust is the momentum flow of the exhaust relative to the vehicle |
| $m\,d\mathbf{v}/dt = \mathbf{F}_{\mathrm{ext}} + \mathbf{u}\,dm/dt$ | any variable-mass body; $\mathbf{u}$ is the velocity of the gained or lost matter relative to the body |
| $F = \dot{m}\,v_{e,\mathrm{exit}} + (p_e - p_a)A_e$ | thrust equation with back pressure; $\dot{m}$, $v_{e,\mathrm{exit}}$ and $p_e$ are fixed upstream, only $p_a$ varies with altitude |
| $v_e = v_{e,\mathrm{exit}} + (p_e - p_a)A_e/\lvert\dot{m}\rvert$, $I_{sp} = v_e/g_0$ | effective exhaust velocity; $T_{\mathrm{vac}} - T_{\mathrm{sl}} = p_{a,0}A_e$ |
| $\Delta v = v_e \ln(m_0/m_f)$ | rocket equation, empty space, constant $v_e$; independent of thrust level and burn time |
| $m_0/m_f = e^{\Delta v/v_e}$, $m_p/m_0 = 1 - e^{-\Delta v/v_e}$ | mass ratio and propellant fraction; about $21.8$ and 95% for $9.4\,\mathrm{km/s}$ at $311\,\mathrm{s}$ |
| $\Delta v = v_e \ln(m_0/m_f) - g\,t_b$ | straight-up burn under gravity: the first appearance of a gravity loss |

The next lesson keeps the external force on for a whole ascent. It writes the equation of motion along the flight path, integrates it into ideal $\Delta v$ minus gravity, drag and steering losses, puts numbers on each for a trip to low orbit, and explains why every orbital launcher flies a gravity turn.

::: context same-physics Every steady observer sees the same physics
Toss a ball straight up on a smoothly moving train, and it lands back in your hand, exactly as it would on the platform. Someone on the platform sees the ball move sideways as well, but agrees on every force and every acceleration. That is the rule for inertial frames: frames moving at steady velocity relative to each other see the same forces. Velocities differ between them; accelerations and forces do not. So any "force" whose size depends on the observer's velocity, like $v\,dm/dt$, cannot be a real force.
:::

::: context fixed-system Follow the same matter
The trick is to draw the boundary around the vehicle *and* the parcel about to leave, and keep following both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="85" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">time t</text>
  <rect x="20" y="40" width="130" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="24" y="48" width="18" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <polygon points="150,40 172,58 150,76" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="63" font-size="12" fill="#1f2a44" text-anchor="middle">m, v</text>
  <rect x="12" y="32" width="168" height="52" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="270" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">time t + dt</text>
  <rect x="222" y="40" width="108" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="330,40 352,58 330,76" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="276" y="63" font-size="11" fill="#1f2a44" text-anchor="middle">m − dmₑ</text>
  <rect x="196" y="48" width="18" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="190" y="32" width="166" height="52" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="276" y1="104" x2="330" y2="104" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="340,104 328,98 328,110" fill="#1d6fd1"/>
  <text x="276" y="124" font-size="11" fill="#1d6fd1" text-anchor="middle">vehicle: v + dv</text>
  <line x1="205" y1="140" x2="245" y2="140" stroke="#f2b880" stroke-width="2.5"/>
  <polygon points="255,140 243,134 243,146" fill="#f2b880"/>
  <text x="205" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">parcel: v − vₑ</text>
  <text x="95" y="112" font-size="11" fill="#b4232c" text-anchor="middle">dashed box: same matter</text>
</svg>
```

The orange parcel is inside the vehicle at the start and right behind it at the end. The dashed boundary holds the same atoms both times, so Newton's law applies to it.
:::

::: context meshchersky Who worked out variable mass
Ivan Meshchersky, a Russian professor of mechanics, wrote the general equation for bodies that gain or lose mass in 1897, before anyone had built a spaceflight rocket. The same equation covers a raindrop growing as it sweeps up droplets, a jet engine taking in air, a meteor burning away as it falls — and a rocket.
:::

::: context exit-pressure Pressure on the exit plane
The outside air presses inward on the whole vehicle. Across the nozzle exit, the gas pushes with its own pressure instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M40,60 L200,60 L200,62 L280,40 L280,120 L200,98 L200,100 L40,100 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="40,60 14,80 40,100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="40" x2="280" y2="120" stroke="#b4232c" stroke-width="3"/>
  <g stroke="#6c7a93" stroke-width="1.5" fill="#6c7a93">
    <line x1="80" y1="30" x2="80" y2="52"/><polygon points="80,58 76,50 84,50"/>
    <line x1="140" y1="30" x2="140" y2="52"/><polygon points="140,58 136,50 144,50"/>
    <line x1="80" y1="130" x2="80" y2="108"/><polygon points="80,102 76,110 84,110"/>
    <line x1="140" y1="130" x2="140" y2="108"/><polygon points="140,102 136,110 144,110"/>
  </g>
  <text x="110" y="22" font-size="12" fill="#6c7a93" text-anchor="middle">outside air pₐ</text>
  <g stroke="#b4232c" stroke-width="2" fill="#b4232c">
    <line x1="300" y1="62" x2="322" y2="62"/><polygon points="330,62 320,57 320,67"/>
    <line x1="300" y1="98" x2="322" y2="98"/><polygon points="330,98 320,93 320,103"/>
  </g>
  <text x="300" y="140" font-size="12" fill="#b4232c" text-anchor="middle">gas at pₑ, area Aₑ</text>
  <text x="120" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">vehicle</text>
</svg>
```

If the gas pressure $p_e$ equals $p_a$, the two cancel and only the momentum term is left. If $p_e$ is higher, the vehicle gets an extra push forward; if lower, the air wins and thrust drops.
:::

::: context vacuum-nozzle Two versions of one engine
SpaceX flies two versions of the Merlin engine. The first stage's sea-level engines have a nozzle whose exit area is about 16 times its narrowest throat area. The second stage's Merlin Vacuum has a huge nozzle extension, with an exit area around 165 times the throat. In vacuum that extra expansion squeezes more speed out of the gas and raises $I_{sp}$ to about $348\,\mathrm{s}$. At sea level, the same giant nozzle would let the outside air push the flow off its walls, so it only ever runs high up.
:::

::: context tsiolkovsky An old equation
Konstantin Tsiolkovsky, a Russian schoolteacher, published the rocket equation in 1903 and argued from it that liquid-fueled, multi-stage rockets could reach space. He was not quite the first: the British mathematician William Moore worked out the same result for military rockets in 1813. Tsiolkovsky's name stuck because he was the one who saw what it meant for spaceflight.
:::

::: context exponential-cost The exponential in pictures
The mass ratio $m_0/m_f = e^{\Delta v / v_e}$ climbs slowly, then steeply.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="151">5</text><text x="34" y="119">10</text><text x="34" y="86">15</text><text x="34" y="54">20</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="36" y1="147.5" x2="40" y2="147.5"/><line x1="36" y1="115" x2="40" y2="115"/><line x1="36" y1="82.5" x2="40" y2="82.5"/><line x1="36" y1="50" x2="40" y2="50"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="196">0</text><text x="130" y="196">1</text><text x="220" y="196">2</text><text x="310" y="196">3</text>
  </g>
  <text x="190" y="208" font-size="11" fill="#1f2a44" text-anchor="middle">Δv / vₑ</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,173.5 49.0,172.8 58.0,172.1 67.0,171.2 76.0,170.3 85.0,169.3 94.0,168.2 103.0,166.9 112.0,165.5 121.0,164.0 130.0,162.3 139.0,160.5 148.0,158.4 157.0,156.1 166.0,153.6 175.0,150.9 184.0,147.8 193.0,144.4 202.0,140.7 211.0,136.5 220.0,132.0 229.0,126.9 238.0,121.3 247.0,115.2 256.0,108.3 265.0,100.8 274.0,92.5 283.0,83.3 292.0,73.1 301.0,61.9 310.0,49.4 319.0,35.7 328.0,20.5"/>
  <circle cx="130" cy="162.3" r="4" fill="#b4232c"/><text x="130" y="150" font-size="11" fill="#b4232c" text-anchor="middle">2.7</text>
  <circle cx="220" cy="132.0" r="4" fill="#b4232c"/><text x="210" y="120" font-size="11" fill="#b4232c" text-anchor="middle">7.4</text>
  <circle cx="317.2" cy="38.6" r="4" fill="#b4232c"/><text x="290" y="36" font-size="11" fill="#b4232c" text-anchor="middle">21.8 (orbit)</text>
  <text x="48" y="22" font-size="11" fill="#1f2a44">m₀ / m_f</text>
</svg>
```

Each extra $v_e$ of $\Delta v$ multiplies the needed mass ratio by about $2.7$. That is why going from "nearly orbit" to "orbit" is so expensive, and why rockets drop stages.
:::

::: context ion-thruster Ion engines
An ion thruster uses electricity, usually from solar panels, to pull charged atoms of xenon gas through a strong electric field and fling them out at tens of kilometers per second. That gives a huge $I_{sp}$ but a tiny push. NASA's Dawn spacecraft, which orbited the asteroid Vesta and the dwarf planet Ceres, used ion engines at about $3000\,\mathrm{s}$ with a thrust of at most about $0.09\,\mathrm{N}$ — roughly the weight of two sheets of paper — firing for years in total.
:::

::: context euler-method The simplest way to step forward
**Euler's method** takes the current rates of change, pretends they stay fixed for one short step $dt$, and moves forward: new speed = old speed + acceleration × $dt$, new mass = old mass + mass rate × $dt$. Then it repeats. Each step is slightly off because the rates really change during it, but the error shrinks as $dt$ shrinks — halve the step and the error roughly halves. Real simulations use smarter steppers, but Euler is enough to check the logarithm here.
:::
