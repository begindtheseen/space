---
id: l09-hypersonic-aerodynamics-and-transonic-transition
title: Hypersonic aerodynamics and the transonic transition
minutes: 15
covers:
  - hypersonic aerodynamics and the transonic transition
---

Every lesson so far has folded a vehicle's entire aerodynamic behaviour into two numbers: the ballistic coefficient $\beta = m/(C_D A)$ and, from lesson 7, a lift-to-drag ratio. Both assume the drag and lift coefficients are constants — fixed numbers, not functions of speed — across a trajectory that spans Mach numbers from the high twenties or thirties at entry interface down through single digits at parachute deployment. That assumption is not free; it happens to be an excellent one for most of an entry and a badly wrong one for a narrow, critical band near the end. This lesson derives why it holds in the hypersonic regime and precisely identifies where it stops.

## Newtonian impact theory

Model the hypersonic flow as a stream of independent particles, each travelling at the freestream velocity $v$ and each losing all of its momentum *normal* to a surface it strikes, sliding freely along the surface tangentially (an idealisation that gets better, not worse, as speed increases, because the shock layer that separates real gas behaviour from this simple picture becomes thinner and thinner). A surface element inclined so its local flow-incidence angle is $\theta$ (the angle between the surface and the oncoming flow — $\theta = 90^\circ$ for a surface square-on to the flow, $\theta = 0^\circ$ for one aligned with it) intercepts a mass flux $\rho v \sin\theta$ per unit area, and removes the normal momentum component $v\sin\theta$ from each unit mass. The pressure this produces is that momentum-removal rate:

$$
\Delta p = (\rho\,v\sin\theta)(v\sin\theta) = \rho v^2 \sin^2\theta,
$$

giving a pressure coefficient

$$
C_p = \frac{\Delta p}{\tfrac{1}{2}\rho v^2} = 2\sin^2\theta.
$$

At $\theta = 90^\circ$ this gives $C_p = 2$, the hypersonic stagnation-point limit; at $\theta = 0^\circ$ it gives $C_p = 0$ — a surface parallel to the flow feels no impact pressure in this model, appropriately, since a shadowed (leeward) surface is assigned zero pressure entirely, another simplification of the model.

::: key Newtonian impact pressure coefficient
$$
C_p = 2\sin^2\theta,
$$
$\theta$ the local flow-incidence angle. Derived from momentum flux alone — no viscosity, no compressibility parameter, nothing but geometry and the assumption that the shock layer is infinitesimally thin, which becomes an increasingly good approximation as Mach number rises.
:::

::: example Newtonian drag coefficient of a sphere
Integrate the Newtonian pressure over a sphere's windward hemisphere. Parametrise by the angle $\phi$ from the stagnation point, so the local incidence is $\theta = 90^\circ - \phi$ and $C_p = 2\cos^2\phi$; a ring element at $\phi$ has area $dA = 2\pi R^2\sin\phi\,d\phi$, and its pressure force projects onto the drag axis with an extra factor $\cos\phi$. Referencing to the frontal (cross-sectional) area $\pi R^2$:

$$
C_D = \frac{1}{\pi R^2}\int_0^{\pi/2} 2\cos^2\phi\cdot\cos\phi\cdot 2\pi R^2\sin\phi\,d\phi
= 4\int_0^{\pi/2}\cos^3\phi\,\sin\phi\,d\phi.
$$

Substituting $u = \cos\phi$: $\int_0^{\pi/2}\cos^3\phi\sin\phi\,d\phi = \int_0^1 u^3\,du = \tfrac14$, so $C_D = 4\times\tfrac14 = 1.0$ exactly. A measured hypersonic drag coefficient for a real blunt capsule typically comes out somewhat higher, around $1.3$–$1.5$, because the base (aft, shadowed) region does not actually sit at the zero pressure Newtonian theory assigns it — real base pressure is low but not zero, and it acts in the *same* direction as the windward pressure once accounted for correctly, adding to the total. The pure windward-only Newtonian estimate is a lower bound, not an exact prediction, but it captures the right order of magnitude and — more importantly for this module — the right *scaling*.
:::

## The Mach independence principle

Look again at $C_p = 2\sin^2\theta$: nowhere does Mach number appear. Once the flow is fast enough that the shock layer is thin and the Newtonian picture holds — a rule of thumb widely used is Mach numbers above about $5$ — the pressure coefficient, and therefore $C_D$ and $C_L$, stop changing with speed at all. This is the **Mach independence principle**, and it is the physical justification for treating $\beta$ as a single constant across the entire hypersonic portion of every trajectory this module has computed: from entry interface at Mach $25$–$30$ down to roughly Mach $5$–$6$, the drag coefficient genuinely does not change enough to matter, and the peak-deceleration and peak-heating formulas of lessons 2 through 4 are built on exactly that constancy.

::: warning Mach independence is a hypersonic-regime result, not a universal one
$C_p = 2\sin^2\theta$ says nothing about how pressure coefficient depends on Mach number at supersonic or transonic speeds, where compressibility effects the Newtonian model entirely ignores are dominant, not negligible. The principle's value is precisely that it tells you where it is safe to ignore Mach number — high hypersonic — by construction it cannot tell you anything about the regime where Mach number matters most.
:::

::: example What a 40 percent drag-coefficient error costs
Suppose a vehicle's true hypersonic $C_D$ is $1.4$ but a design estimate — perhaps a pure Newtonian sphere approximation from the example above — assumes $C_D = 1.0$. Since $\beta = m/(C_DA)$, the true ballistic coefficient is $\beta_{\mathrm{real}}/\beta_{\mathrm{estimate}} = C_{D,\mathrm{estimate}}/C_{D,\mathrm{real}} = 1.0/1.4 = 0.714$, a $28.6\ \mathrm{percent}$ lower true $\beta$. From lesson 2, the peak-deceleration altitude shifts by $H\ln(0.714^{-1}) = 7200\ln(1.4) = 2423\ \mathrm{m}$ — the real vehicle peaks nearly $2.4\ \mathrm{km}$ higher than the underestimated-$C_D$ design predicted, with a correspondingly different thermal environment at that peak. Peak deceleration magnitude itself is unaffected (it never depended on $\beta$), but every $\beta$-dependent number this module has derived — peak altitude, peak heating rate, downrange, duration, impact speed — moves. Getting $C_D$ right is not a cosmetic concern.
:::

## Where it breaks: the transonic transition

Mach independence holds because the shock layer stays thin and attached in a stable, self-similar pattern across the entire hypersonic and most of the supersonic range. That pattern changes as the vehicle decelerates toward Mach $1$. Through the transonic band — roughly Mach $0.8$ to $1.2$, the same band t1_m18 identified for a grid fin's own drag rise — shock structure around a blunt body becomes strongly Mach-dependent: local regions of supersonic flow embedded in an otherwise subsonic flow field appear and disappear as speed drops, shock waves move and weaken, and the drag coefficient typically *rises* toward a local maximum near Mach $1$ before settling to a lower, roughly constant subsonic value once the flow is fully subsonic. A single constant $C_D$ — and with it, a single constant $\beta$ — is the wrong model here; this is exactly the regime this lesson's Newtonian derivation explicitly excluded.

The consequence is more than a drag-coefficient inconvenience. Real blunt capsules can develop **transonic and low-supersonic instability**: as the shock structure reorganises, the vehicle's centre of pressure can shift enough to change, or even reverse, its static margin, producing an aerodynamic trim state the vehicle did not have hypersonically. A capsule stable "heat-shield-forward" at hypersonic speed is not guaranteed to stay stable in exactly that attitude as it decelerates through this band, which is why real capsule designs — and their reaction-control or drogue-parachute systems — are sized with this transition explicitly in mind, not carried straight over from the hypersonic aerodynamic database.

::: key The transonic transition
Roughly Mach $0.8$–$1.2$: shock structure reorganises, drag coefficient rises toward a local peak near Mach $1$ before falling to its subsonic value, and centre-of-pressure shifts can destabilise a shape that was perfectly stable hypersonically. The constant-$\beta$, constant-$L/D$ assumption behind every earlier lesson in this module is valid above this band and must be replaced by Mach-dependent aerodynamic data within and below it.
:::

This is also, practically, why parachute deployment and other terminal-phase events are timed against **Mach number**, not altitude or elapsed time alone: a supersonic parachute deployed too early meets a flow regime its designers never qualified it for, and a vehicle that has not yet cleared the transonic instability band cannot be assumed to hold the attitude a parachute mortar or a propulsive phase needs. Lesson 13's Mars entries make this constraint concrete, where the entire deployment sequence is scheduled by Mach number precisely because the atmosphere is too thin to give a forgiving margin on timing.

## Check yourself

::: check
Derive the Newtonian pressure coefficient $C_p = 2\sin^2\theta$ from the momentum-flux argument, stating the model's central assumption explicitly.
:::

::: answer
The model treats the flow as independent particles that lose all momentum normal to a surface on impact while sliding freely tangentially. A surface at local incidence $\theta$ intercepts mass flux $\rho v\sin\theta$ per unit area, and each unit mass loses normal momentum $v\sin\theta$; the resulting pressure is $\Delta p = (\rho v\sin\theta)(v\sin\theta) = \rho v^2\sin^2\theta$, and dividing by the dynamic pressure $\tfrac12\rho v^2$ gives $C_p = 2\sin^2\theta$.
:::

::: check
Why does the pure windward-hemisphere Newtonian calculation give $C_D = 1.0$ for a sphere while real measured hypersonic sphere or capsule drag coefficients typically come out around $1.3$–$1.5$?
:::

::: answer
The Newtonian model assigns exactly zero pressure to the shadowed (base, aft) region of the body, since particles cannot strike a surface the flow cannot reach in this simplified picture. Real base pressure is low but not zero, and accounting for it correctly adds to the total drag beyond the windward-only Newtonian estimate — making the pure Newtonian calculation a lower bound rather than an exact prediction, even though it captures the correct order of magnitude and the correct Mach-independent scaling.
:::

::: check
State the Mach independence principle and explain, using the form of $C_p = 2\sin^2\theta$, why it is a direct consequence of Newtonian theory rather than an additional assumption layered on top of it.
:::

::: answer
The Mach independence principle says that above roughly Mach $5$, aerodynamic force coefficients (drag, lift) become essentially constant with further increases in Mach number. This follows immediately from $C_p = 2\sin^2\theta$, which contains no Mach number at all — it depends only on the local surface geometry. Since $C_p$ is what integrates to give $C_D$ and $C_L$, and $C_p$ itself never depended on Mach number in this model, the coefficients built from it cannot depend on it either; Mach independence is not an extra assumption, it is what the model already implies once accepted.
:::

::: check
Why does the constant-$\beta$ assumption used in every earlier lesson of this module fail specifically in the transonic band, rather than failing gradually across the whole supersonic-to-subsonic range?
:::

::: answer
Mach independence relies on the shock layer staying thin, stable, and self-similar in shape across a wide hypersonic-to-supersonic range, which is why $C_D$ stays nearly constant there. Near Mach $1$ specifically, the flow field around a blunt body reorganises qualitatively — embedded supersonic pockets within an otherwise subsonic field appear and vanish as speed changes, and the shock structure itself is no longer self-similar — so drag coefficient becomes strongly, not gradually, Mach-dependent exactly in this band, rising toward a local peak before settling to a different, roughly constant subsonic value once the reorganisation is complete.
:::

::: check
Why are parachute deployment and other terminal-phase events typically scheduled against Mach number rather than against altitude or elapsed time since entry?
:::

::: answer
Mach number is what actually determines the flow regime a parachute or other terminal-phase system will operate in, including whether the vehicle has cleared the transonic instability band and can be relied on to hold a stable attitude. Altitude and elapsed time both vary from flight to flight with atmospheric density dispersions and trajectory dispersions (lesson 5), so a fixed altitude or time trigger risks deploying into the wrong flow regime on an off-nominal flight, while a Mach-number trigger tracks the actual aerodynamic state directly, at the cost of needing a reliable in-flight speed-of-sound and velocity estimate to evaluate it.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $C_p = 2\sin^2\theta$ | Newtonian impact pressure coefficient; $\theta$ = local flow-incidence angle; no Mach dependence |
| $C_D = 1.0$ (Newtonian sphere) | Windward-hemisphere-only estimate; real blunt-body $C_D$ typically $1.3$–$1.5$ due to nonzero base pressure |
| Mach independence principle | Above roughly Mach $5$, $C_D$ and $C_L$ are essentially constant — the basis for treating $\beta$ as fixed throughout lessons 2–8 |
| $40\%$ $C_D$ error example | Shifts peak-altitude prediction by $H\ln(1.4) = 2.42\ \mathrm{km}$; peak-$g$ magnitude itself is unaffected |
| Transonic transition | Roughly Mach $0.8$–$1.2$: $C_D$ rises toward a local peak near Mach $1$, shock structure reorganises, centre of pressure can shift and destabilise the vehicle |
| Terminal-event triggers | Scheduled by Mach number, not altitude or time, because Mach number tracks the actual flow regime through atmospheric and trajectory dispersions |

The next lesson leaves aerodynamic deceleration behind and opens the propulsive part of descent: the entry burn, the aerodynamically guided phase this lesson and lessons 6–8 have covered, and the landing burn that brings the vehicle the rest of the way to the ground under thrust.
