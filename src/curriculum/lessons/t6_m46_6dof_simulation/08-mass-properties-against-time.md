---
id: l08-mass-properties-against-time
title: Mass properties against time
minutes: 20
covers:
  - "Mass properties against time: propellant depletion, center of mass migration, inertia tensor change"
---

Balance a full can of soda on its side across one finger. The balance point is in the middle. Now drink half and try again: the liquid lies along the low side, and the balance point has moved toward it. Drink it all and the balance point is back in the middle, where the empty can's own balance point always was. The can never changed shape. Only the liquid inside it did.

A rocket stage is that can, a few hundred times bigger and emptied in about a minute and a half. Three numbers describe how its mass is spread out: the total **mass**, the **center of mass** (the balance point), and the **inertia tensor** (how hard it is to start or stop it turning, about each axis). Together they are the vehicle's **mass properties**, and all three change as the propellant burns.

The Rigid Body Dynamics module derived Euler's equations with a constant inertia tensor, and warned in passing that a launch vehicle does not have one: its inertia falls by about a factor of ten over a burn. This lesson turns that warning into a model. The Plant box has to recompute mass, center of mass and inertia from the propellant that is left, correctly, at every step. They are a full part of the equations of motion, not a slowly varying afterthought.

## How fast the mass goes

A car's fuel gauge falls faster when you floor it. A rocket engine is the same: the harder it pushes, the faster it eats propellant. The rule that ties the two together is the one propulsion sizing already uses:

$$
\dot m = -\frac{F}{I_{sp}\,g_0} .
$$

Read $\dot m$ as "m dot", the **mass flow rate** in kg/s. It is negative because the mass is going down. $F$ is the thrust in newtons. $I_{sp}$ ("I sub s p") is the **[[specific impulse|isp]]** in seconds, a measure of how much push the engine gets from each kilogram. And $g_0 = 9.80665\,\mathrm{m/s^2}$ ("g nought") is **[[standard gravity|g-nought]]**, a fixed reference number used to put $I_{sp}$ in seconds. It stays $9.80665$ wherever the vehicle actually is, even in deep space.

For a burn at constant thrust, $\dot m$ is constant, and the mass falls in a straight line:

$$
m(t) = m_0 - |\dot m|\,t .
$$

Here $m_0$ is the mass at ignition and $|\dot m|$ is the size of the flow rate, without its sign. A **throttling** engine, one whose thrust can be turned up and down, makes $\dot m(t)$ change with the commanded thrust. The simulation then works it out from the same formula at every step.

Take $F = 800\,\mathrm{kN}$ and $I_{sp} = 320\,\mathrm{s}$. Then $I_{sp}\,g_0 = 320 \times 9.80665 = 3138.1\,\mathrm{m/s}$, and $|\dot m| = 800\,000 / 3138.1 = 254.93\,\mathrm{kg/s}$. That is about a quarter of a metric ton every second. Mass is the simplest of the three quantities, and it drives the other two.

## Where the balance point goes

The center of mass is a **weighted average** of the positions of every piece of the vehicle: each position counts in proportion to how heavy that piece is. Split the vehicle into two pieces, the **dry** structure (everything that is not propellant) and the propellant. Then

$$
\mathbf{r}_{\text{cg}}(t) = \frac{m_{\text{dry}}\,\mathbf{r}_{\text{dry}} + m_{\text{prop}}(t)\,\mathbf{r}_{\text{prop}}(t)}{m_{\text{dry}} + m_{\text{prop}}(t)} .
$$

Read $\mathbf{r}_{\text{cg}}$ as "r sub c g", the position of the center of mass (engineers often say "c g", for center of gravity). $\mathbf{r}_{\text{dry}}$ is the fixed center of mass of the dry structure. $\mathbf{r}_{\text{prop}}(t)$ is the center of whatever propellant is left *right now*.

That last one moves, even though the tank is rigid and bolted in place. Most tanks are **[[bottom-fed|bottom-fed]]**: the engine sits below the tank and draws from its bottom. So the liquid that is left always sits in the lower part of the tank, as a column that gets shorter. The center of a column is at half its height. As the column shrinks, its center slides down toward the tank's bottom. Nothing in the tank has moved. The *shape of the liquid* has changed.

For a cylindrical tank of length $L$ whose bottom is at $x_{\text{bot}}$, with a fraction $m_{\text{prop}}/m_{\text{prop},0}$ of the propellant left, the column height and its center are

$$
h = L\,\frac{m_{\text{prop}}}{m_{\text{prop},0}}, \qquad x_{\text{prop}} = x_{\text{bot}} + \frac{h}{2} .
$$

::: example Mass, center of mass and inertia over a burn
A stage has a dry mass of $4{,}000\,\mathrm{kg}$ with its center at $x_{\text{dry}} = 5.0\,\mathrm{m}$, measured from a structural reference point near the engine. Its $25{,}000\,\mathrm{kg}$ of propellant fills a cylindrical tank of radius $1.5\,\mathrm{m}$ and length $8\,\mathrm{m}$, with the tank bottom at $x = 2.0\,\mathrm{m}$. The engine gives $F = 800\,\mathrm{kN}$ at $I_{sp} = 320\,\mathrm{s}$. The dry structure's own inertia about its own center is $12{,}000\,\mathrm{kg\,m^2}$, about a sideways (transverse) axis.

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F / (Isp * g0)

m_dry, x_dry, I_dry_cm = 4000.0, 5.0, 12000.0     # kg, m, kg m^2
m_prop0, x_bot, L_tank, r_tank = 25000.0, 2.0, 8.0, 1.5

t_burn = m_prop0 / mdot

def state(t):
    m_prop = max(m_prop0 - mdot*t, 0.0)
    h = L_tank * (m_prop/m_prop0)                  # remaining liquid column, bottom-fed tank
    x_prop_cg = x_bot + h/2.0
    m_total = m_dry + m_prop
    x_cg = (m_dry*x_dry + m_prop*x_prop_cg) / m_total
    I_prop = m_prop*(3*r_tank**2 + h**2)/12.0 + m_prop*(x_prop_cg - x_cg)**2   # solid-cylinder + parallel axis
    I_dry = I_dry_cm + m_dry*(x_dry - x_cg)**2                                # dry mass, parallel axis
    return m_total, x_cg, I_prop + I_dry

print("mdot (kg/s):", mdot, " t_burn (s):", t_burn)
for t in [0, 15, 76.34, 98.0665]:
    m, xcg, I = state(t)
    print(f"t={t:7.2f}  m={m:9.1f}  x_cg={xcg:.4f}  I={I:10.1f}")
# mdot (kg/s): 254.92905324448208  t_burn (s): 98.06649999999999
# t=   0.00  m=  29000.0  x_cg=5.8621  I=  162844.1
# t=  15.00  m=  25176.1  x_cg=5.3265  I=  105450.1
# t=  76.34  m=   9538.7  x_cg=3.7726  I=   26943.3
# t=  98.07  m=   4000.0  x_cg=5.0000  I=   12000.0
```

Walk through what `state` does at each time, in order.

Step 1: propellant left, $m_{\text{prop}} = 25{,}000 - 254.93\,t$. It runs out at $t_{\text{burn}} = 25{,}000 / 254.93 = 98.07\,\mathrm{s}$.

Step 2: the column height $h$ and its center $x_{\text{prop}} = 2.0 + h/2$. Full, that is $2.0 + 4.0 = 6.0\,\mathrm{m}$.

Step 3: the weighted average. At ignition, $x_{\text{cg}} = (4000 \times 5.0 + 25{,}000 \times 6.0)/29{,}000 = 170{,}000/29{,}000 = 5.862\,\mathrm{m}$.

Step 4: the inertia about that center, using the **parallel axis theorem** (next section) for both pieces.

Now read the results. The vehicle sheds $25{,}000\,\mathrm{kg}$. The transverse inertia falls from $162{,}844$ to $12{,}000\,\mathrm{kg\,m^2}$, a factor of $13.6$ — the Rigid Body Dynamics module's order-of-magnitude warning, now with a real number.

The center of mass does something more interesting. It starts at $5.862\,\mathrm{m}$, pulled toward the heavy full tank. It ends at exactly $5.000\,\mathrm{m}$, the dry structure's own center, once the tank is empty. But it does not go straight there. It **[[dips to 3.773 m|soda-can]]** at about $76\,\mathrm{s}$, when the little propellant left is all low in the tank, and then climbs back up. Its total swing is $5.862 - 3.773 = 2.09\,\mathrm{m}$, more than twice the $0.862\,\mathrm{m}$ gap between its start and end points.

Sanity check: the end values match the dry structure alone ($4000\,\mathrm{kg}$, $5.0\,\mathrm{m}$, $12{,}000\,\mathrm{kg\,m^2}$), as they must with an empty tank.

None of these curves is a straight line in time, even though $\dot m$ is constant. Center of mass and inertia both come from a weighted average whose weights change steadily while one of the positions being averaged is itself moving.
:::

::: warning Start and end points hide the swing
Look at only the first and last center-of-mass values and you would say it "migrates $0.862\,\mathrm{m}$". It actually travels $2.09\,\mathrm{m}$ out and part of the way back. Any check that depends on how far the center of mass moves — a lever arm, a control gain, a clearance — needs the whole curve, not its two ends.
:::

## Recomputing the inertia tensor, not rescaling it

Spin an office chair with your arms out, then pull them in, and you speed up: the same mass, held closer to the axis, is easier to turn. That is inertia. It depends on how much mass there is and, even more, on how far it sits from the axis, squared.

The inertia tensor Euler's equations need is the one about the *current* center of mass, in body axes. The **[[inertia tensor|inertia-tensor]]** is a $3\times 3$ table of numbers, written $\mathbf{I}$ (bold capital I), that gives the inertia about every axis at once. The tool that moves a piece's inertia from its own center to the vehicle's center is the **[[parallel axis theorem|parallel-axis]]**:

$$
I = I_{\text{own}} + m\,d^2 .
$$

In words: a piece of mass $m$, whose own center sits a distance $d$ from the axis, adds its own inertia about its own center, $I_{\text{own}}$, plus $m$ times $d$ squared. In the code above, the propellant column is treated as a solid cylinder, whose transverse inertia about its own center is $m(3r^2 + h^2)/12$, and the $m\,d^2$ terms are the `(x_prop_cg - x_cg)**2` and `(x_dry - x_cg)**2` parts.

Because the center of mass moves, there is no single tensor that shrinks in place. At every step the simulation rebuilds it:

1. List each piece: the propellant (treated for now as a rigid, **[[frozen mass|frozen-propellant]]**), the dry structure, and anything else with a known inertia about its own center.
2. Find the vehicle's current center of mass.
3. Shift each piece's inertia to that center with the parallel axis theorem.
4. Add them up.

The shortcut people reach for is to compute the tensor once, at ignition, and scale it down as mass leaves. It quietly keeps the ignition center of mass as its reference forever. Its error grows as the center of mass moves away from that point — out to the $2.09\,\mathrm{m}$ the example found. It is the same reference-point bookkeeping mistake the frame-discipline lesson warned about, now hiding in a number instead of a rotation.

::: warning A fixed reference point standing in for the moving center of mass
It is common, and wrong, to compute inertia once about a handy fixed point — the gimbal pivot, say, or the nose — and use it as "the" inertia tensor for the whole burn. Euler's equations hold about the center of mass specifically. Inertia about any other point carries an error that grows as the center of mass moves away from it. That is not a numerical integration error at all. It is the wrong equation, solved exactly.
:::

## The extra term when inertia changes

Newton's law for turning says torque changes angular momentum, and angular momentum is inertia times spin rate, $\mathbf{I}\boldsymbol\omega$ ("I omega"). When $\mathbf{I}$ is constant, only $\boldsymbol\omega$ changes. When $\mathbf{I}$ changes too, the product rule gives a second piece. The rotational equation of motion, as the Rigid Body Dynamics module noted without taking it further, becomes

$$
\mathbf{I}\dot{\boldsymbol\omega} + \dot{\mathbf{I}}\boldsymbol\omega + \boldsymbol\omega\times\mathbf{I}\boldsymbol\omega = \mathbf{M} .
$$

Read $\dot{\boldsymbol\omega}$ as "omega dot", the angular acceleration; $\dot{\mathbf{I}}$ ("I dot") as how fast the inertia is changing; $\mathbf{M}$ as the applied torque (moment). The new piece is $\dot{\mathbf{I}}\boldsymbol\omega$. Is it small next to $\mathbf{I}\dot{\boldsymbol\omega}$? That question has a number. It is not something to assume.

::: example Is the mass-change term actually negligible?
Use the vehicle above at $t = 15\,\mathrm{s}$, with typical ascent values $\omega = 0.02\,\mathrm{rad/s}$ and $\dot\omega = 0.001\,\mathrm{rad/s^2}$. Find $\dot I$ from the inertia curve by a **central difference**: the change in $I$ from a hundredth of a second before to a hundredth after, divided by the time between.

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F / (Isp * g0)
m_dry, x_dry, I_dry_cm = 4000.0, 5.0, 12000.0
m_prop0, x_bot, L_tank, r_tank = 25000.0, 2.0, 8.0, 1.5

def state(t):                                       # exactly as in the example above
    m_prop = max(m_prop0 - mdot*t, 0.0)
    h = L_tank * (m_prop/m_prop0)
    x_prop_cg = x_bot + h/2.0
    m_total = m_dry + m_prop
    x_cg = (m_dry*x_dry + m_prop*x_prop_cg) / m_total
    I_prop = m_prop*(3*r_tank**2 + h**2)/12.0 + m_prop*(x_prop_cg - x_cg)**2
    I_dry = I_dry_cm + m_dry*(x_dry - x_cg)**2
    return m_total, x_cg, I_prop + I_dry

dt = 0.01
t_mid = 15.0
Idot = (state(t_mid+dt)[2] - state(t_mid-dt)[2]) / (2*dt)
_, _, I_mid = state(t_mid)
w, wdot = 0.02, 0.001
print("dI/dt at t=15s:", Idot, " |Idot*w| =", abs(Idot*w), " |I*wdot| =", abs(I_mid*wdot))
# dI/dt at t=15s: -3177.414822155697  |Idot*w| = 63.54829644311394  |I*wdot| = 105.4500882254598
```

Step 1: $\dot I \approx -3{,}177\,\mathrm{kg\,m^2/s}$. The inertia is falling by over three thousand units every second at this point in the burn.

Step 2: the mass-change term is $|\dot I\,\omega| = 3177 \times 0.02 = 63.5\,\mathrm{N\,m}$.

Step 3: the usual term is $|I\dot\omega| = 105{,}450 \times 0.001 = 105.5\,\mathrm{N\,m}$.

Step 4: compare: $63.5 / 105.5 = 0.60$. The mass-change term is $60\%$ of the size of the angular-acceleration term. That is nowhere near negligible for this vehicle at this point in its burn.

A spacecraft thruster burning grams per second next to a multi-metric ton dry mass might truly earn the word "negligible". A booster shedding hundreds of kilograms per second does not get to assume it. The only way to know which case you are in is to compute both terms, as here, rather than guess from the label "slowly varying".
:::

::: note The exhaust carries spin away too
The equation above treats $\mathbf{M}$ as every torque on the vehicle. For a rocket, one of those torques comes from the exhaust itself, and it is easy to forget. Gas leaving the nozzle while the vehicle turns is swinging sideways with the nozzle, so it carries angular momentum out of the vehicle. The result is a **[[jet damping|jet-damping]]** torque of about $-\dot m_e\,\ell_e^2\,\boldsymbol\omega$ about a transverse axis, where $\dot m_e$ is the exhaust mass flow (a positive number) and $\ell_e$ is the distance from the center of mass to the nozzle exit.

It pushes against $\dot{\mathbf{I}}\boldsymbol\omega$. Move $\dot{\mathbf{I}}\boldsymbol\omega$ to the right-hand side and, since $\dot I$ is negative, it tends to speed the turn up; jet damping tends to slow it down. If this vehicle's nozzle exit sat at $x = 0$, then at $t = 15\,\mathrm{s}$, $\ell_e = 5.33\,\mathrm{m}$ and $\dot m_e \ell_e^2 = 254.93 \times 5.33^2 = 7{,}233\,\mathrm{kg\,m^2/s}$ — more than twice $|\dot I|$. Both mass-flow terms are the same size as the ones you have been comparing, so a credible plant models both, from the real nozzle geometry.
:::

::: warning An IMU's lever arm is not constant either
A sensor mounted away from the center of mass feels extra specific force from the vehicle's turning, acting through the **[[lever arm|lever-arm]]** between sensor and center of mass. The IMU stays bolted to the structure, but the center of mass does not stay put. In the example it swings $2.09\,\mathrm{m}$ during the burn, and the lever arm changes with it. A sensor model that fixes the lever arm at its ignition value is quietly wrong by the end of the burn, by an amount that follows exactly the migration this lesson computes.
:::

::: key Mass properties are recomputed, not rescaled
Mass, center of mass and inertia are all functions of the remaining propellant, evaluated fresh at every step:

- $m(t)$ from $\dot m = -F/(I_{sp}g_0)$;
- $\mathbf{r}_{\text{cg}}(t)$ as the mass-weighted average of the dry structure and the *current* propellant centroid, which itself moves as the liquid column shrinks;
- $\mathbf{I}(t)$ by applying the parallel axis theorem to every piece about the *current* center of mass, never by scaling a tensor computed once.

The full equation of motion carries an extra term, $\dot{\mathbf{I}}\boldsymbol\omega$, whose size next to $\mathbf{I}\dot{\boldsymbol\omega}$ must be checked with numbers, not assumed away.
:::

## Check yourself

::: check
Why does the center of the *remaining* propellant move during a burn, even though the tank is rigid and does not move at all?
:::

::: answer
A bottom-fed tank drains from the bottom, so the liquid left always fills the lower part of the tank. The empty space above it, the ullage, keeps growing.

The liquid is a column whose center is at half its height. As the column gets shorter, its center gets lower, sliding toward the tank bottom. No mass has been carried anywhere inside the tank. The center moves only because a shorter column has a lower middle.
:::

::: check
In the worked example, at $t = 15\,\mathrm{s}$ the inertia is $105{,}450\,\mathrm{kg\,m^2}$ and $\dot I \approx -3{,}177\,\mathrm{kg\,m^2/s}$. Suppose the controller asks for $\dot\omega = 0.0005\,\mathrm{rad/s^2}$ at that instant, half the example's value, with $\omega$ still $0.02\,\mathrm{rad/s}$. Is the mass-change term now more or less important next to the angular-acceleration term?
:::

::: answer
More important.

$|I\dot\omega|$ halves: $105{,}450 \times 0.0005 = 52.7\,\mathrm{N\,m}$. But $|\dot I\,\omega| = 3177 \times 0.02 = 63.5\,\mathrm{N\,m}$ has not changed, because it depends on $\omega$, not on $\dot\omega$.

So the mass-change term is now *bigger* than the angular-acceleration term, instead of $60\%$ of it. A gentler maneuver does not shrink the mass-change term. It shrinks the other one, which makes the mass-change term relatively more important, not less.
:::

::: check
A simulation computes the inertia tensor once at ignition, about the center of mass at that moment. After that it multiplies every entry by $m(t)/m(0)$ as propellant is burned, without finding the new center of mass or using the parallel axis theorem again. What exactly is wrong?
:::

::: answer
Scaling by the mass ratio would be right only if every piece stayed the same distance from the center of mass while it got lighter. But the center of mass moves as the tank drains. So the parallel-axis distance $d$ for every piece keeps changing, not just its mass — and $d$ enters squared.

The shortcut silently keeps the ignition center of mass as its reference. After the first instant the tensor is not about the vehicle's real center of mass at all, and the error grows with the center-of-mass migration: $2.09\,\mathrm{m}$ at its worst in the example.
:::

::: check
Why is it wrong to say, as a blanket rule, that the $\dot{\mathbf{I}}\boldsymbol\omega$ term is "usually negligible for a launch vehicle"?
:::

::: answer
Whether it is negligible depends on the numbers for that vehicle, at that moment in the burn. It compares how fast the inertia is changing ($\dot I$, driven by propellant flow compared with the total inertia), times the spin rate, against the commanded angular acceleration times the inertia.

The worked example found the term at $60\%$ of $\mathbf{I}\dot{\boldsymbol\omega}$ for one booster-class vehicle, hardly a small correction. A low-thrust spacecraft thruster draining slowly next to a big dry mass might well make it negligible. The only way to know which case you are in is to compute both terms.
:::

::: check
A vehicle's dry structure has its center at $x_{\text{dry}} = 5.0\,\mathrm{m}$, and its propellant tank runs from $x = 2.0$ to $x = 10.0\,\mathrm{m}$. Without doing the full calculation, explain why, once the tank is more than half empty, the vehicle's center of mass must lie between $x = 2.0\,\mathrm{m}$ and $5.0\,\mathrm{m}$, and not anywhere in the tank's full range.
:::

::: answer
The vehicle's center of mass is a weighted average of two positions: $x_{\text{dry}} = 5.0\,\mathrm{m}$ and the current propellant center. A weighted average of two numbers always lies between them.

Full, the propellant column's center is at the tank's middle, $6.0\,\mathrm{m}$. Once the tank is more than half empty, the column is less than $4\,\mathrm{m}$ tall, so its center is below $2.0 + 2.0 = 4.0\,\mathrm{m}$, and it keeps falling toward the bottom at $2.0\,\mathrm{m}$. So the propellant center is somewhere between $2.0$ and $4.0\,\mathrm{m}$, and the vehicle's center of mass is between that and $5.0\,\mathrm{m}$. That pins it between $2.0$ and $5.0\,\mathrm{m}$, never up in the $5$–$10\,\mathrm{m}$ part of the tank.
:::

::: check
Why does treating the propellant as a rigid, "frozen" mass in the inertia calculation need to be revisited, and which lesson in this module does it?
:::

::: answer
Real propellant is a liquid, not a solid. It can slosh, moving around inside the tank when the vehicle accelerates or turns. A sloshing mass does not add to the vehicle's inertia the way a frozen mass in the same place would, and where it sits is no longer set only by how much has burned.

The next lesson, on slosh and structural flex, drops exactly this simplification. It gives the propellant's motion relative to the tank its own dynamics.
:::

## Summary

| Quantity | Formula | Worked example |
| --- | --- | --- |
| Mass flow | $\dot m = -F/(I_{sp}g_0)$ | $254.93\,\mathrm{kg/s}$ for $F = 800\,\mathrm{kN}$, $I_{sp} = 320\,\mathrm{s}$ |
| Burn time | $t_{\text{burn}} = m_{\text{prop},0}/\lvert\dot m\rvert$ | $98.07\,\mathrm{s}$ |
| Propellant centroid, bottom-fed tank | Middle of the remaining liquid column, falling toward the tank bottom | $6.000\,\mathrm{m} \to 2.000\,\mathrm{m}$ |
| Vehicle center of mass | $\mathbf{r}_{\text{cg}} = (m_{\text{dry}}\mathbf{r}_{\text{dry}} + m_{\text{prop}}\mathbf{r}_{\text{prop}})/(m_{\text{dry}}+m_{\text{prop}})$ | $5.862\,\mathrm{m}$, down to $3.773\,\mathrm{m}$, back to $5.000\,\mathrm{m}$ |
| Parallel axis theorem | $I = I_{\text{own}} + m\,d^2$ | Applied to each piece about the current center of mass |
| Inertia | Rebuilt fresh every step, never rescaled | $162{,}844 \to 12{,}000\,\mathrm{kg\,m^2}$, a factor of $13.6$ |
| Extra term | $\dot{\mathbf{I}}\boldsymbol\omega$, checked with numbers against $\mathbf{I}\dot{\boldsymbol\omega}$ | $63.5\,\mathrm{N\,m}$ against $105.5\,\mathrm{N\,m}$ — $60\%$, not negligible |

The next lesson drops the assumption that propellant is a rigid, frozen mass. It gives the liquid — and the structure itself — dynamics of their own: slosh and structural flex, and exactly where in the loop they are inserted.

::: context isp Seconds of push per kilogram
Specific impulse says how much push an engine gets out of each bit of propellant. Measured in seconds, it has a neat meaning: in an engine with $I_{sp} = 320\,\mathrm{s}$, each kilogram of propellant can push with a force equal to its own weight at Earth's surface for $320$ seconds. A kerosene engine at sea level gets about $280$–$310\,\mathrm{s}$; a hydrogen engine in vacuum, about $450\,\mathrm{s}$. For a fixed thrust, higher $I_{sp}$ means a smaller $\dot m$, so the propellant lasts longer.
:::

::: context g-nought A fixed number, not the local gravity
$g_0 = 9.80665\,\mathrm{m/s^2}$ is a defined constant, agreed internationally in 1901 as "standard gravity". In $\dot m = -F/(I_{sp}g_0)$ it is only a conversion factor that turns $I_{sp}$ in seconds back into an exhaust speed, $I_{sp}g_0$, in m/s. So it never changes with altitude. An engine far from Earth still uses $9.80665$, even though the local gravity there is nearly zero. Using the local $g$ instead is a classic bug.
:::

::: context bottom-fed Why tanks drain from the bottom
The outlet is at the bottom of the tank because the engine is below it, and because the vehicle's acceleration pushes the liquid down onto the outlet, the way braking pushes you forward in a car. The picture shows the same tank full and part-drained. The dot is the liquid's center, at half the column's height, so it slides down as the column shrinks. In free fall there is no "down", and liquid can float away from the outlet. Upper stages then fire small **ullage** thrusters first to settle it before the main engine lights.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="30" width="60" height="160" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="100" cy="110" r="5" fill="#b4232c"/>
  <text x="100" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">full</text>
  <rect x="220" y="30" width="60" height="160" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="221" y="130" width="58" height="59" fill="#8fb8f0"/>
  <circle cx="250" cy="160" r="5" fill="#b4232c"/>
  <text x="250" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">part drained</text>
  <text x="250" y="85" font-size="12" text-anchor="middle" fill="#6c7a93">ullage</text>
  <line x1="295" y1="130" x2="295" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="164" font-size="12" fill="#1f2a44">h</text>
  <line x1="140" y1="110" x2="180" y2="110" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="142" y="104" font-size="11" fill="#b4232c">center at h/2</text>
  <line x1="100" y1="190" x2="100" y2="204" stroke="#1f2a44" stroke-width="2"/>
  <line x1="250" y1="190" x2="250" y2="204" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">outlet to engine</text>
</svg>
```
:::

::: context soda-can The dip, and when it bottoms out
The vehicle's center of mass over the burn, from the worked example. It falls from $5.86\,\mathrm{m}$, bottoms out at $3.77\,\mathrm{m}$ near $76\,\mathrm{s}$, and climbs back to $5.00\,\mathrm{m}$ as the last propellant goes. There is a neat fact hiding here: the center of mass is lowest at the exact moment it sits level with the liquid's surface. Here the column is then $1.77\,\mathrm{m}$ tall, so the surface is at $2.0 + 1.77 = 3.77\,\mathrm{m}$. Physics teachers pose the same puzzle about a soda can.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="86" x2="335" y2="86" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,37.7 57.0,42.7 64.0,47.7 71.0,52.6 78.0,57.5 85.0,62.3 92.0,67.1 99.0,71.9 106.0,76.7 113.0,81.4 120.0,86.0 127.0,90.6 134.0,95.1 141.0,99.6 148.0,104.0 155.0,108.3 162.0,112.5 169.0,116.7 176.0,120.7 183.0,124.6 190.0,128.4 197.0,132.1 204.0,135.6 211.0,138.9 218.0,142.0 225.0,144.9 232.0,147.5 239.0,149.8 246.0,151.7 253.0,153.3 260.0,154.3 267.0,154.7 274.0,154.4 281.0,153.3 288.0,151.0 295.0,147.4 302.0,142.0 309.0,134.3 316.0,123.3 323.0,107.9 330.0,86.0"/>
  <circle cx="268" cy="154.7" r="4" fill="#b4232c"/>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">6 m</text>
  <text x="44" y="90" font-size="11" text-anchor="end" fill="#1f2a44">5 m</text>
  <text x="44" y="146" font-size="11" text-anchor="end" fill="#1f2a44">4 m</text>
  <text x="50" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0 s</text>
  <text x="330" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">98 s</text>
  <text x="268" y="140" font-size="11" text-anchor="middle" fill="#b4232c">3.77 m</text>
  <text x="150" y="60" font-size="12" fill="#1d6fd1">center of mass</text>
</svg>
```
:::

::: context inertia-tensor Nine numbers for one idea
A single inertia number only works for turning about one fixed axis. A vehicle can turn about any axis, so its inertia is a $3\times 3$ table, the inertia tensor. The three numbers down the diagonal, $I_{xx}$, $I_{yy}$, $I_{zz}$, are the inertias about the body's own three axes. The others, the **products of inertia**, show how turning about one axis drags on another, and they are zero for a perfectly symmetric vehicle. A long rocket has a small roll inertia and two large, nearly equal pitch and yaw inertias. This lesson's example tracks one of those big transverse ones.
:::

::: context parallel-axis Moving inertia to a new axis
A piece of mass $m$ has inertia $I_{\text{own}}$ about its own center. About a parallel axis a distance $d$ away, its inertia is $I_{\text{own}} + m d^2$. The extra $m d^2$ is the inertia of the whole piece treated as a point swinging around the new axis. Because $d$ is squared, a piece twice as far away counts four times as much. This is why the center of mass must be found first: $d$ is always measured from it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="20" x2="80" y2="125" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="80" cy="72" r="6" fill="#b4232c"/>
  <text x="80" y="136" font-size="12" text-anchor="middle" fill="#b4232c">vehicle center of mass</text>
  <rect x="230" y="47" width="60" height="50" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="260" cy="72" r="4" fill="#1f2a44"/>
  <line x1="260" y1="20" x2="260" y2="125" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="86" y1="72" x2="256" y2="72" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="170" y="64" font-size="13" text-anchor="middle" fill="#1f2a44">d</text>
  <text x="260" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">piece, mass m</text>
  <text x="170" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">I = I_own + m d²</text>
</svg>
```
:::

::: context frozen-propellant Frozen for now
"Frozen" here does not mean cold. It means the model pretends the liquid moves with the tank as if it were solid, so its only change is getting shorter. That is a good first model and a wrong final one. Lesson 9 lets part of the liquid slosh like a pendulum, and lesson 10 handles what happens when a whole stage, tank and all, is thrown away at once.
:::

::: context jet-damping Why the exhaust calms the turn
Picture a garden hose spraying straight out of a spinning sprinkler arm. The water leaving the tip is already moving sideways with the arm, so it takes some of the arm's spin with it. A rocket nozzle far behind the center of mass does the same when the vehicle pitches: the exhaust leaves with a sideways speed of about $\omega\ell_e$, and the angular momentum it carries off shows up as a damping torque of about $\dot m_e\ell_e^2\omega$. Because the nozzle is usually the part of the vehicle farthest from the center of mass, this effect tends to outweigh $\dot I\omega$, and on long burns it is a small, welcome source of stability.
:::

::: context lever-arm Why an off-center sensor feels extra acceleration
Sit on the outer edge of a merry-go-round and you feel pushed outward; sit at the center and you feel nothing. An accelerometer a distance $r$ from the center of mass feels the same: about $\omega^2 r$ toward the center, plus $\dot\omega\, r$ sideways while the spin rate is changing. With $\omega = 0.02\,\mathrm{rad/s}$ and $\dot\omega = 0.001\,\mathrm{rad/s^2}$, a lever arm that is wrong by $2.09\,\mathrm{m}$ gives errors of about $0.0008$ and $0.0021\,\mathrm{m/s^2}$. The second is about $210$ micro-g, several times the bias of a navigation-grade accelerometer.
:::
