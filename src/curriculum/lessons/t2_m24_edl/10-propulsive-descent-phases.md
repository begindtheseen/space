---
id: l10-propulsive-descent-phases
title: Propulsive descent — entry burn, aerodynamic guidance, landing burn
minutes: 14
covers:
  - "propulsive descent: entry burn, aerodynamic guidance, landing burn"
---

Everything in this module up to lesson 8 describes a vehicle that arrives with a heat shield and, at most, a parachute — the descent is decided entirely by aerodynamics and, where flown, lift. A reusable booster returning to land has a different, and in one sense simpler, tool available throughout: its own engines. A Falcon-9-class first stage flies three distinct phases on the way down, each using a different combination of propulsion and aerodynamics, and this lesson introduces all three before lessons 11 and 12 work the sensing and the terminal-guidance problem each one raises in depth.

## Three phases, three jobs

After stage separation, a returning booster is on a ballistic arc, still moving away from — or, for a return-to-launch-site profile, having been redirected back toward — its landing site, and it is about to meet the atmosphere at a speed and angle a heat-shielded capsule would never willingly fly (no ablative protection, thin structure, engines and plumbing exposed to the flow). Three phases manage that mismatch in sequence:

**Entry burn.** Shortly before the dense atmosphere, the stage fires its engines retrograde, shedding a substantial fraction of its speed *before* drag and heating would otherwise peak. This is a direct, deliberate application of lessons 2 through 4's own results: since peak dynamic pressure and peak heat rate both rise steeply with entry speed (deceleration as $v^2$, heat rate as $v^3$), spending propellant to reduce $v$ before the worst of the atmosphere is reached buys a proportionally much larger reduction in the resulting structural and thermal load.

**Aerodynamic guidance.** Engines off, the stage falls the rest of the way through the dense atmosphere on grid fins alone (t1_m18's own subject), using the modest lift a slightly angled cylinder produces to steer toward the landing site through the hypersonic, supersonic, and transonic regimes lesson 9 described — including, unavoidably, the transonic instability band that lesson describes, which grid fins have to fly through with reduced or changing control authority.

**Landing burn.** A final, precisely timed propulsive burn brings the stage the rest of the way to zero velocity at zero altitude. Because the minimum throttle a real engine can sustain typically still exceeds the vehicle's weight this late in the flight (propellant mostly spent, so light), this burn cannot be flown as a controlled hover-and-descend — it is a single-shot problem, and lesson 12 works out exactly what that forces onto the guidance.

::: key The three-phase booster return
Entry burn: sheds speed before the dense atmosphere, trading propellant for a large reduction in peak heating and dynamic pressure. Aerodynamic guidance: unpowered, grid-fin-steered descent through hypersonic to transonic flow. Landing burn: a final, propulsively controlled — and, as lesson 12 shows, throttle-constrained — approach to touchdown.
:::

## What the entry burn buys, quantified

::: example Halving entry-burn exit speed
Take a booster-class stage with $\beta \approx 2400\ \mathrm{kg/m^2}$ (t1_m18's own figure for an engines-first Falcon-9-class stage) falling steeply, $\gamma_E \approx -70^\circ$, with a representative nose radius $R_n = 1\ \mathrm{m}$ for the blunt, engines-forward configuration. Compare peak heat rate and peak deceleration with and without an entry burn that halves the speed at which the stage meets the dense atmosphere, from $2000\ \mathrm{m/s}$ to $1000\ \mathrm{m/s}$:

| entry speed | peak deceleration | peak heat rate |
| --- | --- | --- |
| $2000\ \mathrm{m/s}$ (no entry burn) | $9.79\,g_0$ | $27.30\ \mathrm{W/cm^2}$ |
| $1000\ \mathrm{m/s}$ (after entry burn) | $2.45\,g_0$ | $3.41\ \mathrm{W/cm^2}$ |

Halving entry speed cuts peak deceleration by a factor of exactly $4$ (the $v^2$ scaling of lesson 2) and peak heat rate by a factor of exactly $8$ (the $v^3$ scaling of lesson 4). This is why the entry burn exists even though it costs propellant that could otherwise go toward payload: an unshielded, thin-walled stage cannot survive a full-speed encounter with the dense atmosphere the way a heat-shielded capsule can, and the cubic heat-rate scaling means a comparatively modest speed reduction buys a disproportionately large safety margin.
:::

::: example Dynamic pressure through the aerodynamic-guidance phase
Grid fins only work where there is enough dynamic pressure to generate a meaningful force — t1_m18 derived exactly this dependence, $\Delta N \propto \bar q$. Using this module's exponential atmosphere, three points along a representative descent:

| altitude | speed | dynamic pressure $\bar q = \tfrac12\rho v^2$ |
| --- | --- | --- |
| $15\ \mathrm{km}$ | $600\ \mathrm{m/s}$ | $27.5\ \mathrm{kPa}$ |
| $5\ \mathrm{km}$ | $250\ \mathrm{m/s}$ | $19.1\ \mathrm{kPa}$ |
| $1\ \mathrm{km}$ | $150\ \mathrm{m/s}$ | $12.0\ \mathrm{kPa}$ |

Dynamic pressure falls through this phase even though density is rising, because speed is falling faster than density is rising — a factor of $16$ in $v^2$ against a factor of $7$ in $\rho$ between the first and third rows, a net fall of a bit over a factor of two. Grid-fin authority weakens correspondingly through the descent (echoing t1_m18's own comparison at higher altitude and speed), which is one reason the aerodynamic phase hands off to a propulsive landing burn rather than trying to fly the fins all the way to zero speed: by the time speed and dynamic pressure have both fallen this far, aerodynamic control alone is no longer enough to guarantee a precision touchdown.
:::

## Reading the sequence as an energy-management problem

Step back from the three phases individually and the whole sequence is a single energy-management problem, solved with two different currencies. The entry burn and the landing burn both spend **propellant** (via the rocket equation) to remove kinetic energy directly. The aerodynamic-guidance phase spends **no propellant at all** — it removes energy to drag exactly as every ballistic or lifting entry vehicle in lessons 2 through 8 does, for free, using structure and grid fins instead of an engine. A mission planner's job is deciding how much of the total energy-removal burden to hand to the free (aerodynamic) phase versus the expensive (propulsive) phases: more aerodynamic braking, achieved with a lower entry-burn cutoff speed, saves propellant but demands the vehicle (uninsulated, non-ablative) survive a correspondingly harsher aerothermal environment; more propulsive braking costs propellant — and therefore payload — but relaxes the structural and thermal demand on the airframe. This trade is exactly why the entry burn's target speed is a designed number, not "as slow as possible" or "as fast as propellant allows."

::: warning A booster's "entry" is not a capsule's entry
Every formula in lessons 2 through 4 still applies to a booster's atmospheric pass — the physics of drag and heating does not know or care what the vehicle is for — but the vehicle side of the comparison is different in kind. A capsule is built around surviving one full-speed atmospheric pass with a heat shield sized for it; a reusable booster is built to be reused many times, with no ablative protection to spend, which is precisely why it trades propellant for a gentler pass rather than building in the thermal margin a capsule carries instead.
:::

## Check yourself

::: check
Name the three phases of a propulsive booster return and, for each, state what removes the vehicle's kinetic energy during that phase.
:::

::: answer
Entry burn: the vehicle's own engines, firing retrograde, remove kinetic energy directly via thrust — propellant is spent. Aerodynamic guidance: atmospheric drag removes energy, exactly as in any unpowered entry, at no propellant cost. Landing burn: the engines again, removing the last of the vehicle's kinetic energy propulsively to reach zero velocity at the ground.
:::

::: check
Why does halving the speed at which a stage meets the dense atmosphere cut peak heat rate by a factor of $8$ rather than by a factor of $2$?
:::

::: answer
Peak convective heat rate (Sutton-Graves, lesson 4) scales as $v^3$, not linearly with speed. Halving $v$ therefore scales heat rate by $(1/2)^3 = 1/8$, an eightfold reduction, while peak deceleration — which scales as $v^2$ — falls by only a factor of $4$ for the same speed change. The entry burn is worth flying largely because of this cubic leverage.
:::

::: check
Why does dynamic pressure fall through the aerodynamic-guidance phase in the worked table, even though the vehicle is descending into progressively denser air?
:::

::: answer
Dynamic pressure is $\bar q = \tfrac12\rho v^2$, and in the worked example speed falls by a factor of $4$ ($600\to150\ \mathrm{m/s}$, a factor of $16$ in $v^2$) while density rises only by a factor of about $7$ over the same altitude range. The $v^2$ term's decrease outweighs the $\rho$ term's increase, so the product falls overall, even though density alone is rising the whole time.
:::

::: check
Explain why a reusable booster is designed to fly an entry burn at all, when a heat-shielded capsule flies its full-speed atmospheric pass with no propulsive assistance.
:::

::: answer
A capsule is built around a heat shield specifically sized to survive one full-speed atmospheric pass, at the peak heat rate and load that pass implies; a reusable booster carries no comparable ablative protection, because it is designed to fly many times and cannot afford to lose material (or accumulate structural damage) on every flight the way an expendable heat shield can. Spending propellant on an entry burn to reduce peak heat rate and dynamic pressure before the dense atmosphere is how the booster substitutes for the thermal margin a capsule instead builds into its heat shield.
:::

::: check
A mission considers lowering the entry-burn cutoff speed further to save propellant elsewhere in the flight. What does this trade against, according to this lesson's energy-management framing?
:::

::: answer
A lower entry-burn cutoff speed means the aerodynamic-guidance phase (and the tail end of the entry burn itself) has to absorb a larger share of the total kinetic energy removal aerodynamically rather than propulsively, which raises the peak dynamic pressure, peak deceleration, and — most steeply, via the $v^3$ scaling — peak heat rate the airframe and grid fins must survive without ablative protection. Saving entry-burn propellant is not free; it is traded directly against the structural and thermal margin of an uninsulated, reusable airframe.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Entry burn | Propulsive braking before the dense atmosphere; trades propellant for reduced peak heating and dynamic pressure |
| Halving entry speed | Cuts peak deceleration by $4\times$ ($v^2$ scaling) and peak heat rate by $8\times$ ($v^3$ scaling) |
| Aerodynamic guidance | Unpowered, grid-fin-steered descent through hypersonic to transonic flow; removes energy to drag at no propellant cost |
| $\bar q = \tfrac12\rho v^2$ through this phase | Falls through the descent in the worked example ($27.5\to12.0\ \mathrm{kPa}$) as speed's fall outweighs density's rise |
| Landing burn | Final propulsive approach to touchdown; single-shot, not hover-capable (lesson 12) |
| Energy-management trade | More free (aerodynamic) braking saves propellant but demands a harsher thermal/structural margin; more propulsive braking costs payload but relaxes it |

The next lesson looks at what the vehicle actually measures to fly this sequence — the sensors a terminal descent depends on that neither a capsule's entry nor an orbital rendezvous needs in the same way.
