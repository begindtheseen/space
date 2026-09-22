---
id: l08-mass-properties-against-time
title: Mass properties against time
minutes: 21
covers:
  - "Mass properties against time: propellant depletion, centre of mass migration, inertia tensor change"
---

The Rigid Body Dynamics module's derivation of Euler's equations assumed a constant inertia tensor, and flagged, in passing, that a launch vehicle does not have one: propellant leaves, and the tensor falls by an order of magnitude over a burn. This lesson makes that warning into a model. A vehicle's mass, the location of its centre of mass, and its inertia tensor are all functions of how much propellant remains and where it is, and the plant box has to recompute all three, correctly, at every step — not as a slowly-varying afterthought, but as a first-class part of the equations of motion.

## Propellant depletion

Mass flow follows directly from thrust and specific impulse, exactly the relationship propulsion sizing already uses: $\dot m = -F/(I_{sp}g_0)$, with $g_0 = 9.80665\,\mathrm{m/s^2}$ the standard reference used to define $I_{sp}$ in seconds regardless of where the vehicle actually is. Integrating a constant $\dot m$ gives $m(t) = m_0 - |\dot m|\,t$ for a constant-thrust burn; a throttling engine makes $\dot m(t)$ itself a function of the commanded thrust, evaluated the same way at every step. This is the simplest of the three quantities in this lesson, and it drives the other two.

## Centre of mass migration

The vehicle's centre of mass is the mass-weighted average of every piece of it, and the dominant moving piece is the propellant. For a tank fed from the bottom — the common configuration, since the engine sits below it — propellant drains from the bottom up, so the *remaining* liquid always occupies the lower portion of the tank and its own centroid is not fixed: as the liquid column shrinks, its centroid moves down, toward the tank's bottom, even though nothing about the tank itself has moved.

$$
\mathbf{r}_{\text{cg}}(t) = \frac{m_{\text{dry}}\,\mathbf{r}_{\text{dry}} + m_{\text{prop}}(t)\,\mathbf{r}_{\text{prop}}(t)}{m_{\text{dry}} + m_{\text{prop}}(t)},
$$

with $\mathbf{r}_{\text{dry}}$ the (fixed) centre of mass of everything except propellant and $\mathbf{r}_{\text{prop}}(t)$ the *current* centroid of whatever propellant remains — itself a function of time even though the tank's geometry is fixed, precisely because the shape of the liquid inside it is not.

::: example Mass, centre of mass and inertia over a burn
A stage with dry mass $4{,}000\,\mathrm{kg}$ at $x_{\text{dry}} = 5.0\,\mathrm{m}$ (measured from an arbitrary structural reference) and $25{,}000\,\mathrm{kg}$ of propellant filling a cylindrical tank of radius $1.5\,\mathrm{m}$ and length $8\,\mathrm{m}$, bottom at $x = 2.0\,\mathrm{m}$, burns at $F = 800\,\mathrm{kN}$, $I_{sp} = 320\,\mathrm{s}$:

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
for t in [0, 15, 98.0665]:
    m, xcg, I = state(t)
    print(f"t={t:7.2f}  m={m:9.1f}  x_cg={xcg:.4f}  I={I:10.1f}")
# mdot (kg/s): 254.92905324448208  t_burn (s): 98.06649999999999
# t=   0.00  m=  29000.0  x_cg=5.8621  I=  162844.1
# t=  15.00  m=  25176.1  x_cg=5.3265  I=  105450.1
# t=  98.07  m=   4000.0  x_cg=5.0000  I=   12000.0
```

Over the $98.07\,\mathrm{s}$ burn, the vehicle sheds $25{,}000\,\mathrm{kg}$, the centre of mass migrates $0.862\,\mathrm{m}$ — from $5.862\,\mathrm{m}$, pulled toward the heavy full tank, to $5.000\,\mathrm{m}$, exactly the dry structure's own centroid once the tank is empty — and the transverse inertia falls from $162{,}844$ to $12{,}000\,\mathrm{kg\,m^2}$, a factor of $13.6$, confirming the Rigid Body Dynamics module's order-of-magnitude warning with an actual number. None of these three curves is linear in time even though $\dot m$ is constant: $x_{\text{cg}}(t)$ and $I(t)$ are both the result of a mass-weighted average whose weights change linearly while one of the two positions being averaged is itself moving.
:::

## Recomputing the inertia tensor, not rescaling it

The inertia tensor Euler's equations need is the tensor *about the current centre of mass*, in body axes. Because the centre of mass moves, this is not a single tensor that shrinks in place — it has to be recomputed from scratch at every step: take each piece of the vehicle (propellant, treated for now as a rigid, frozen mass — lesson 9 removes exactly this assumption — plus dry structure, plus anything else with its own known inertia about its own centre of mass), apply the parallel axis theorem to shift each piece's contribution to the *current* vehicle centre of mass, and sum. A tensor computed once about the *initial* centre of mass, and merely scaled down as mass is lost, silently accumulates a parallel-axis error that grows with exactly the $0.862\,\mathrm{m}$ of migration the example above computed — the same kind of reference-point bookkeeping error the frame-discipline lesson warned about, now hiding in a scalar rather than a rotation.

The full rotational equation of motion, as the Rigid Body Dynamics module noted without deriving it further, gains a term when $\mathbf{I}$ is not constant:

$$
\mathbf{I}\dot{\boldsymbol\omega} + \dot{\mathbf{I}}\boldsymbol\omega + \boldsymbol\omega\times\mathbf{I}\boldsymbol\omega = \mathbf{M} .
$$

Whether $\dot{\mathbf{I}}\boldsymbol\omega$ is negligible next to $\mathbf{I}\dot{\boldsymbol\omega}$ is a question with a number, not an assumption.

::: example Is the mass-change term actually negligible?
Using the finite difference of the inertia curve above at $t = 15\,\mathrm{s}$, and representative ascent values $\omega = 0.02\,\mathrm{rad/s}$, $\dot\omega = 0.001\,\mathrm{rad/s^2}$:

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

$\dot I \approx -3{,}177\,\mathrm{kg\,m^2/s}$ at this point in the burn, and $|\dot I\boldsymbol\omega| = 63.5\,\mathrm{N\,m}$ against $|\mathbf{I}\dot{\boldsymbol\omega}| = 105.5\,\mathrm{N\,m}$ — the mass-change term is $60\%$ of the angular-acceleration term's size, nowhere near negligible for this vehicle at this point in its burn. A slowly-draining spacecraft thruster burning grams per second next to a multi-tonne dry mass might genuinely earn the word "negligible"; a first-stage-class booster shedding propellant at hundreds of kilograms per second does not get to assume it, and the only way to know which case you are in is to compute both terms, as above, not to guess from the label "slowly varying."
:::

::: key Mass properties are recomputed, not rescaled
Mass, centre of mass and inertia are all functions of remaining propellant, evaluated fresh at every step: $m(t)$ from $\dot m = -F/(I_{sp}g_0)$; $\mathbf{r}_{\text{cg}}(t)$ as the mass-weighted average of dry structure and the *current* propellant centroid, which itself moves as the liquid column shrinks; $\mathbf{I}(t)$ by applying the parallel axis theorem to every component about the *current* centre of mass, not by scaling a tensor computed once. The full equation of motion carries an extra term, $\dot{\mathbf{I}}\boldsymbol\omega$, whose size relative to $\mathbf{I}\dot{\boldsymbol\omega}$ must be checked numerically rather than assumed away.
:::

::: warning A fixed reference point standing in for the moving centre of mass
It is common, and wrong, to compute inertia once about a convenient fixed structural point — the gimbal pivot, say, or the vehicle's nose — and treat it as "the" inertia tensor for the whole burn. Euler's equations are valid about the centre of mass specifically; using inertia about a fixed point that is not the current centre of mass introduces an error that grows exactly as the centre of mass migrates away from that point, and it is not a numerical integration error at all — it is the wrong equation, solved exactly.
:::

::: warning An IMU's lever arm is not constant either
A sensor mounted away from the centre of mass measures specific force with a contribution from the vehicle's angular rate and acceleration acting through the lever arm between the sensor and the centre of mass — and if the centre of mass migrates $0.862\,\mathrm{m}$ over a burn while the IMU stays bolted to the structure, that lever arm changes by the same $0.862\,\mathrm{m}$ over the same burn. A sensor model with a fixed, burn-start lever arm is subtly wrong by the end of the burn, in a way that grows with exactly the mass migration this lesson computes.
:::

## Check yourself

::: check
Why does the centroid of the *remaining* propellant move during a burn, even though the tank itself is rigid and does not move at all?
:::

::: answer
A bottom-fed tank drains from the bottom, so the remaining liquid always occupies the lower portion of the tank and the ullage (ever-growing empty space) sits at the top. As the liquid column's height shrinks, its own centroid — the midpoint of that shrinking column — moves down, toward the tank's bottom, purely because a shorter column's centre is lower, not because any physical mass has been relocated within the tank.
:::

::: check
In the worked example, the inertia at $t = 15\,\mathrm{s}$ is $105{,}450\,\mathrm{kg\,m^2}$ and $\dot I \approx -3{,}177\,\mathrm{kg\,m^2/s}$. If a controller commands $\dot\omega = 0.0005\,\mathrm{rad/s^2}$ (half the value used in the example) at the same instant, with $\omega$ unchanged at $0.02\,\mathrm{rad/s}$, is the mass-change term now more or less significant relative to the angular-acceleration term?
:::

::: answer
More significant. $|\mathbf{I}\dot{\boldsymbol\omega}|$ halves to about $52.7\,\mathrm{N\,m}$ while $|\dot I\boldsymbol\omega|$ is unchanged at $63.5\,\mathrm{N\,m}$ (it depends on $\omega$, not $\dot\omega$), so the mass-change term is now *larger* than the angular-acceleration term rather than $60\%$ of it. A gentler manoeuvre does not make the mass-change term smaller — it makes the other term smaller, which can make the mass-change term relatively more important, not less.
:::

::: check
A simulation computes the inertia tensor once at the start of a burn, about the centre of mass at that instant, and then multiplies every component by $m(t)/m(0)$ as propellant depletes, without recomputing the centre of mass or reapplying the parallel axis theorem. What specifically is wrong with this shortcut?
:::

::: answer
Scaling by the mass ratio only correctly captures the shrinking of each piece's own inertia if every piece's distance from the centre of mass stayed the same — but the centre of mass itself moves as the tank drains, so the correct parallel-axis distances for every remaining piece change continuously, not only their masses. The shortcut silently keeps using the burn-start centre of mass as the implicit reference, producing a tensor that is not about the vehicle's actual current centre of mass at any time after the first instant, and the error grows with exactly the centre-of-mass migration the example computed.
:::

::: check
Why is it not correct to say the $\dot{\mathbf{I}}\boldsymbol\omega$ term is "usually negligible for a launch vehicle" as a blanket rule?
:::

::: answer
Whether it is negligible depends on the numbers for the specific vehicle and the specific point in the burn: it depends on how fast mass properties are changing ($\dot I$, driven by propellant flow rate relative to total inertia) relative to how fast the commanded angular acceleration is. The worked example showed the term at $60\%$ of $\mathbf{I}\dot{\boldsymbol\omega}$'s size for one representative booster-class vehicle — not a small correction. A slowly-draining low-thrust spacecraft thruster next to a large dry mass could plausibly make the same term genuinely negligible. The only way to know which situation a given vehicle is in is to compute both terms, not to apply a rule of thumb.
:::

::: check
A vehicle's dry structure centre of mass is at $x_{\text{dry}} = 5.0\,\mathrm{m}$ and its propellant tank spans $x = 2.0$ to $x = 10.0\,\mathrm{m}$. Without doing the full calculation, explain why the vehicle's overall centre of mass must lie somewhere between $x = 2.0\,\mathrm{m}$ and $x_{\text{dry}} = 5.0\,\mathrm{m}$ once the tank is more than half empty, rather than anywhere in the tank's full range.
:::

::: answer
The overall centre of mass is always a weighted average of $x_{\text{dry}} = 5.0\,\mathrm{m}$ and the current propellant centroid, so it must lie between those two values, never outside either of them. Once the tank is more than half empty, the remaining liquid column's own centroid is already below its original midpoint of $6.0\,\mathrm{m}$ and continuing to fall toward the tank bottom at $2.0\,\mathrm{m}$; since $x_{\text{dry}} = 5.0\,\mathrm{m}$ is one of the two endpoints of the weighted average, the overall centre of mass is confined between whatever the (falling) propellant centroid is and $5.0\,\mathrm{m}$ — which, once the propellant centroid drops below $5.0\,\mathrm{m}$ itself, means the overall centre of mass is bounded between the tank bottom and $5.0\,\mathrm{m}$, not the tank's full $2.0$–$10.0\,\mathrm{m}$ span.
:::

::: check
Why does treating the propellant as a rigid, "frozen" mass for the inertia calculation in this lesson need to be revisited, and which upcoming topic in this module does exactly that?
:::

::: answer
Real propellant is a fluid, not a rigid solid — it can slosh, redistributing itself relative to the tank under acceleration, and a sloshing mass does not contribute to the vehicle's inertia the same way a frozen mass in the same location would, nor does it move purely as a function of how much has burned. The next lesson, on slosh and structural flex, removes exactly this simplification and models the propellant's motion relative to the tank as its own dynamic degree of freedom.
:::

## Summary

| Quantity | Formula | Worked example |
| --- | --- | --- |
| Mass flow | $\dot m = -F/(I_{sp}g_0)$ | $254.93\,\mathrm{kg/s}$ for $F = 800\,\mathrm{kN}$, $I_{sp} = 320\,\mathrm{s}$ |
| Burn time | $t_{\text{burn}} = m_{\text{prop},0}/\lvert\dot m\rvert$ | $98.07\,\mathrm{s}$ |
| Propellant centroid, bottom-fed tank | Midpoint of the remaining liquid column, falling toward the tank bottom | $6.000\,\mathrm{m} \to 2.000\,\mathrm{m}$ |
| Vehicle centre of mass | $\mathbf{r}_{\text{cg}} = (m_{\text{dry}}\mathbf{r}_{\text{dry}} + m_{\text{prop}}\mathbf{r}_{\text{prop}})/(m_{\text{dry}}+m_{\text{prop}})$ | $5.862\,\mathrm{m} \to 5.000\,\mathrm{m}$ |
| Inertia | Parallel axis theorem applied fresh, about the current centre of mass, every step | $162{,}844 \to 12{,}000\,\mathrm{kg\,m^2}$, a factor of $13.6$ |
| Extra EOM term | $\dot{\mathbf{I}}\boldsymbol\omega$, checked numerically against $\mathbf{I}\dot{\boldsymbol\omega}$ | $63.5\,\mathrm{N\,m}$ against $105.5\,\mathrm{N\,m}$ — $60\%$, not negligible |

The next lesson removes this lesson's simplifying assumption that propellant is a rigid, frozen mass, and gives the liquid — and the structure itself — their own dynamics: slosh and structural flex, and exactly where in the loop they get inserted.
