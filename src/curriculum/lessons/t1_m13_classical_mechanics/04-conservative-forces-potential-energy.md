---
id: l04-conservative-forces-potential-energy
title: Conservative forces and potential energy
minutes: 20
covers:
  - conservative forces and potential energy
---

Lesson 3 left the work of gravity as an integral to be evaluated along whatever path the vehicle followed. For most forces that is the end of the story: the work of drag on an ascent depends on the exact trajectory through the atmosphere, and there is no shortcut. Gravity is different. Its work between two points is the same along every path connecting them, which means it can be computed once, tabulated as a function of position, and never integrated again. That function is the potential energy, and it turns the work-energy theorem into a conservation law.

For orbital work this is the most-used single fact in the subject. The total mechanical energy of a satellite under two-body gravity is constant, its value fixes the size of the orbit, and the speed at any radius follows from one algebraic equation. A propagator that does not hold that energy constant is broken, and an energy check is the first thing you add to any new simulation. Later, in lessons 8 and 9, the potential energy becomes the $V$ in the Lagrangian $L = T - V$, and the whole of the dynamics is generated from it.

This lesson defines conservative forces, shows why gravity is one, builds its potential energy, and derives the energy relations — vis-viva, escape speed, the orbit-size formula — that every orbital GNC engineer carries in their head.

## Conservative forces

A force is **conservative** when the work it does on a particle moving from $A$ to $B$ depends only on the two endpoints, not on the path taken between them. Three equivalent statements follow, and it is worth being able to move between them.

1. The work $\int_A^B \mathbf{F} \cdot d\mathbf{r}$ is the same along every path from $A$ to $B$.
2. The work around any closed loop is zero: $\oint \mathbf{F} \cdot d\mathbf{r} = 0$. (Go out along one path and back along another; if the two outbound works were different, the loop work would not vanish.)
3. There exists a scalar function $U(\mathbf{r})$ with $\mathbf{F} = -\nabla U$. Then $\mathbf{F} \cdot d\mathbf{r} = -\nabla U \cdot d\mathbf{r} = -dU$, so the work is $-[U(B) - U(A)]$ regardless of the path.

The third form is the one you compute with. Given $U$, the force is its negative gradient; given a force, you can test whether it is conservative by checking whether $\nabla \times \mathbf{F} = 0$ (a gradient field has zero curl), and if so integrate to find $U$. The sign convention — force points *down* the potential — makes potential energy behave like a landscape: the force pushes toward lower $U$, and a particle released from rest starts moving downhill.

Which forces are conservative? Any force that depends on position only, and whose curl vanishes. Two classes cover nearly everything in this module:

- **Uniform forces**, $\mathbf{F} = \mathbf{F}_0$ constant. Uniform gravity $m\mathbf{g}$ is the standard case.
- **Central forces with a magnitude depending on distance only**, $\mathbf{F} = F(r)\,\hat{\mathbf{r}}$. Newtonian gravity and the linear spring are both of this type.

The central-force proof is short and is the one to know. Along any path element, $\hat{\mathbf{r}} \cdot d\mathbf{r} = dr$, the change in distance from the centre — the component of the step along the radius. So $\mathbf{F} \cdot d\mathbf{r} = F(r)\,dr$, and

$$
W_{AB} = \int_{r_A}^{r_B} F(r)\,dr,
$$

which depends only on the initial and final distances. Whatever spiral, loop or ellipse the path traces out, only $r_A$ and $r_B$ survive. Gravity is conservative because it is central and depends on distance alone; the same argument works for any $F(r)$.

Which forces are not? **Drag** depends on velocity, not position, and always does negative work, so its loop integral can never vanish. **Friction** likewise. **Thrust** is a force you command; it can point anywhere, its work depends entirely on what the guidance did along the way, and no $U$ describes it. Forces of this kind are **non-conservative**, and they are handled separately in the energy equation.

## Potential energy

For a conservative force, define the **potential energy** at $\mathbf{r}$ as minus the work the force does in bringing the particle from a reference point $\mathbf{r}_0$ to $\mathbf{r}$:

$$
U(\mathbf{r}) = -\int_{\mathbf{r}_0}^{\mathbf{r}} \mathbf{F} \cdot d\mathbf{r}', \qquad \text{so that} \qquad W_{AB} = -\Delta U = U(A) - U(B).
$$

Equivalently, $U(\mathbf{r})$ is the work *you* would have to do against the force to put the particle at $\mathbf{r}$ — energy stored by position, recoverable as kinetic energy when the particle is let go. The reference point is a free choice; changing it adds a constant to $U$ everywhere, and no physical quantity depends on that constant because only differences of $U$ enter any equation. Choose whatever makes the formula simplest.

Three potentials you will use constantly. Each is obtained by evaluating the integral; check the gradient afterwards.

**Uniform gravity.** Take $z$ up, $\mathbf{F} = -m g\,\hat{\mathbf{z}}$, reference at $z = 0$:

$$
U = m g z, \qquad -\nabla U = -m g\,\hat{\mathbf{z}}. \checkmark
$$

**Linear spring.** A spring of stiffness $k$ (in $\mathrm{N/m}$) stretched by $x$ from its natural length pulls back with $F = -k x$. Reference at $x = 0$:

$$
U = \tfrac{1}{2} k x^2, \qquad -\frac{dU}{dx} = -k x. \checkmark
$$

**Newtonian gravity.** $\mathbf{F} = -\dfrac{\mu m}{r^2}\,\hat{\mathbf{r}}$, and the natural reference is infinity, where the force vanishes. Bringing the particle in from $r_0 \to \infty$ to $r$:

$$
U(r) = -\int_{\infty}^{r} \left(-\frac{\mu m}{r'^2}\right) dr' = \mu m \left[-\frac{1}{r'}\right]_{\infty}^{r} = -\frac{\mu m}{r}.
$$

Check: $-\dfrac{dU}{dr} = -\dfrac{\mu m}{r^2}$, pointing inward. $\checkmark$ The potential energy is negative everywhere and rises toward zero at infinity: a particle at finite $r$ is in an energy hole $\mu m / r$ deep, and that depth is the work needed to remove it to infinity. In lesson 3 you computed the work of gravity on a radial climb as $\mu m (1/r - 1/r_0)$; that is exactly $-\Delta U$ with this $U$.

It is convenient in orbital mechanics to divide out the mass and work with the **gravitational potential** $\Phi(r) = U/m = -\mu / r$, in $\mathrm{J/kg} = \mathrm{m^2/s^2}$. Near the surface, $-\mu/(R_E + h) \approx -\mu/R_E + (\mu/R_E^2)\,h$, which is $\Phi_0 + g h$: the uniform-gravity potential is the first-order expansion of the Newtonian one, good while $h \ll R_E$.

::: warning
Potential energy belongs to a *conservative* force and is defined only up to a constant. Two consequences. You cannot write a potential energy for thrust or drag; their work goes in the non-conservative column, always. And a negative potential energy is not "less than nothing" — with the reference at infinity, $U = -\mu m / r$ is negative for every bound orbit, and that sign is exactly what makes the orbit bound. Comparing potential energies computed with different reference points is the commonest way to get a nonsensical answer out of a correct formula.
:::

## Conservation of mechanical energy

Split the net force into a conservative part, with potential $U$, and a non-conservative remainder $\mathbf{F}_{\mathrm{nc}}$. The work-energy theorem of lesson 3 then reads

$$
\Delta K = W_{\mathrm{net}} = W_{\mathrm{cons}} + W_{\mathrm{nc}} = -\Delta U + W_{\mathrm{nc}}.
$$

Move $\Delta U$ across and define the **total mechanical energy** $E = K + U$:

$$
\Delta E = \Delta(K + U) = W_{\mathrm{nc}} = \int \mathbf{F}_{\mathrm{nc}} \cdot d\mathbf{r}.
$$

When no non-conservative force does work, $E$ is constant: **conservation of mechanical energy**. Kinetic energy and potential energy trade back and forth — a satellite slows as it climbs to apogee and speeds up falling back to perigee — but their sum does not move. When non-conservative forces do act, the equation still holds and is just as useful: the change in $E$ equals their work, so drag *removes* mechanical energy at the rate $-D v$ and thrust *adds* it at the rate $\mathbf{T} \cdot \mathbf{v}$.

::: key
The work-energy theorem is $W_{\mathrm{net}} = \Delta KE = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$. For conservative forces $W = -\Delta U$, giving conservation of $E = KE + U$ when only conservative forces do work; in general $\Delta E = W_{\mathrm{nc}}$, the work of the non-conservative forces (drag, thrust).
:::

This is the sanity check the module's objectives ask for. A two-body propagator has only gravity acting, so $E$ must be constant to within integration error. Compute $\tfrac{1}{2} v^2 - \mu / r$ at every step; if it drifts steadily, the integrator's step is too large or the force is wrong. Add drag and $E$ must fall monotonically, by exactly $-\int D v\,dt$. Add thrust and $E$ must change by $\int \mathbf{T} \cdot \mathbf{v}\,dt$. Any other behaviour is a bug, and the check costs one line of code.

```python
import numpy as np

MU_E = 3.986004418e14  # m^3/s^2

def specific_energy(r, v):
    """eps = v^2/2 - mu/r for state vectors r, v (m, m/s) in ECI."""
    return 0.5 * np.dot(v, v) - MU_E / np.linalg.norm(r)

r = np.array([6778e3, 0.0, 0.0])
v = np.array([0.0, 7668.6, 0.0])
print(specific_energy(r, v))
# -29404260.1...  -> about -2.94e7 J/kg for a 400 km circular orbit
```

## Energy of an orbit

Divide $E$ by the mass to get the **specific orbital energy**

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \qquad \mathrm{J/kg}.
$$

For a circular orbit of radius $r$, the second law gives $v^2 / r = \mu / r^2$, so $v^2 = \mu / r$ and

$$
\varepsilon_{\mathrm{circ}} = \frac{\mu}{2r} - \frac{\mu}{r} = -\frac{\mu}{2r}.
$$

The kinetic energy is exactly half the magnitude of the potential energy, and the total is negative: the orbit is bound. The same result generalises to any ellipse with semi-major axis $a$ — the derivation is in the two-body module, but you can verify it now at the apsides of a known orbit (see the first example) — giving the central formula of orbital energetics:

$$
\varepsilon = -\frac{\mu}{2a}.
$$

Energy fixes the *size* of an orbit and nothing else. Two orbits with the same $a$ — a circle and a highly eccentric ellipse — have the same energy. Equating the two expressions for $\varepsilon$ and solving for $v$ gives the **vis-viva equation**,

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right),
$$

the speed at any radius on an orbit of known size. Three regimes follow from the sign of $\varepsilon$:

- $\varepsilon < 0$: bound, elliptical ($a > 0$). The body cannot reach infinity because $v^2 = 2(\varepsilon + \mu / r)$ would go negative.
- $\varepsilon = 0$: parabolic, the boundary case. At radius $r$ the speed is the **escape speed** $v_{\mathrm{esc}} = \sqrt{2\mu / r}$, exactly $\sqrt{2}$ times circular speed at that radius. From the Earth's surface, $\sqrt{2 \times 3.986 \times 10^{14} / 6.378 \times 10^{6}} \approx 11.18\,\mathrm{km/s}$.
- $\varepsilon > 0$: unbound, hyperbolic. The body arrives at infinity with residual speed $v_\infty = \sqrt{2\varepsilon}$.

::: example The GTO apsides, from energy alone
Lesson 2 took the perigee speed of a geostationary transfer orbit ($r_p = 6678\,\mathrm{km}$, $r_a = 42{,}164\,\mathrm{km}$) as given. Derive both apsidal speeds using conservation of energy and of angular momentum.

At the apsides the velocity is perpendicular to the radius, so angular momentum conservation reads $r_p v_p = r_a v_a$, and energy conservation reads

$$
\frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{v_a^2}{2} - \frac{\mu}{r_a}.
$$

Substitute $v_a = (r_p / r_a) v_p$ and solve:

$$
v_p^2 \left[1 - \frac{r_p^2}{r_a^2}\right] = 2\mu\left(\frac{1}{r_p} - \frac{1}{r_a}\right)
\quad \Rightarrow \quad
v_p^2 = \frac{2\mu\,r_a}{r_p\,(r_p + r_a)}.
$$

Numerically, $v_p^2 = 2 \times 3.986 \times 10^{14} \times 4.2164 \times 10^{7} / (6.678 \times 10^{6} \times 4.8842 \times 10^{7}) \approx 1.0306 \times 10^{8}\,\mathrm{m^2/s^2}$, so $v_p \approx 10{,}152\,\mathrm{m/s}$ and $v_a = (6678 / 42{,}164) \times 10{,}152 \approx 1608\,\mathrm{m/s}$, matching lesson 2.

Now check $\varepsilon = -\mu / 2a$. The semi-major axis is $a = (r_p + r_a)/2 = 24{,}421\,\mathrm{km}$, so $-\mu/2a = -3.986 \times 10^{14} / (2 \times 2.4421 \times 10^{7}) \approx -8.16 \times 10^{6}\,\mathrm{J/kg}$. Directly at perigee: $\tfrac{1}{2} \times 10{,}152^2 - 3.986 \times 10^{14} / 6.678 \times 10^{6} \approx 5.153 \times 10^{7} - 5.969 \times 10^{7} \approx -8.16 \times 10^{6}\,\mathrm{J/kg}$. The two agree, and the formula gives, for instance, $v = \sqrt{\mu(2/r - 1/a)} \approx 7962\,\mathrm{m/s}$ at $r = 10{,}000\,\mathrm{km}$ on the way up — a number the propagator must reproduce.
:::

::: example How high does a vertical launch go?
A sounding rocket burns out at negligible altitude moving straight up at $2000\,\mathrm{m/s}$. Ignoring drag and the Earth's rotation, what peak altitude does it reach? Compare the uniform-gravity estimate with the exact one.

Uniform gravity: $E$ conservation with $U = m g_0 h$ gives $\tfrac{1}{2} v_0^2 = g_0 h_{\max}$, so $h_{\max} = 2000^2 / (2 \times 9.80665) \approx 204\,\mathrm{km}$.

Newtonian gravity: with $U = -\mu m / r$, at the peak $v = 0$, so

$$
\frac{v_0^2}{2} - \frac{\mu}{R_E} = -\frac{\mu}{r_{\max}}
\quad \Rightarrow \quad
r_{\max} = \left(\frac{1}{R_E} - \frac{v_0^2}{2\mu}\right)^{-1}.
$$

With $R_E = 6378\,\mathrm{km}$: $1/R_E = 1.5679 \times 10^{-7}\,\mathrm{m^{-1}}$ and $v_0^2 / 2\mu = 4 \times 10^{6} / (7.972 \times 10^{14}) = 5.018 \times 10^{-9}\,\mathrm{m^{-1}}$, so $r_{\max} \approx 6589\,\mathrm{km}$ and $h_{\max} \approx 211\,\mathrm{km}$. The uniform-gravity answer is 3 % low, because $g$ weakens by about 6 % over the climb and the rocket coasts farther than a constant $g_0$ would allow. At $2\,\mathrm{km/s}$ the correction is modest; at $8\,\mathrm{km/s}$ the uniform formula is useless.
:::

## Reading the energy budget of a real orbit

The energy equation with a non-conservative term is a diagnostic tool, not only a conservation law. Two uses recur.

**Orbital decay.** A satellite in low orbit loses energy to drag at the rate $dE/dt = -D v$. Since $\varepsilon = -\mu / 2a$, a small loss of energy means a small loss of semi-major axis: $d\varepsilon = (\mu / 2a^2)\,da$. The orbit shrinks — and, counter-intuitively, the satellite *speeds up*, because circular speed $\sqrt{\mu / r}$ grows as $r$ falls. Drag slows the satellite down at every instant and yet the satellite ends up faster; the resolution is that the loss of potential energy outruns the loss of total energy, two to one. This is a classic interview check on whether someone actually understands $E = K + U$.

**Manoeuvre cost.** To change from one orbit to another of different $a$, the engines must supply $\Delta\varepsilon = -\tfrac{\mu}{2}(1/a_2 - 1/a_1)$ per kilogram, and they supply it at the rate $\mathbf{T} \cdot \mathbf{v}$. For a fixed $\Delta v$ the energy delivered is largest where $v$ is largest — lesson 3's Oberth effect, now expressed as a statement about $\varepsilon$. Raising apogee is therefore done at perigee, and escape burns are done as deep in the gravity well as possible.

::: example Drag power on a space station
A $420\,\mathrm{t}$ station at $r = 6791\,\mathrm{km}$ (about 413 km altitude) loses roughly $100\,\mathrm{m}$ of altitude per day to drag. What average drag power does that represent, and what is the mean drag force?

The specific energy is $\varepsilon = -\mu / 2r$ for a near-circular orbit, so $d\varepsilon / dr = \mu / (2 r^2) = 3.986 \times 10^{14} / (2 \times (6.791 \times 10^{6})^2) \approx 4.32\,\mathrm{J/kg}$ per metre. Losing $100\,\mathrm{m}$ of radius costs $432\,\mathrm{J/kg}$, or $432 \times 4.2 \times 10^{5} \approx 1.81 \times 10^{8}\,\mathrm{J}$ per day for the whole station. Divided by $86{,}400\,\mathrm{s}$, the drag power is about $2.1\,\mathrm{kW}$ — the output of a domestic kettle, removing energy from a 420-tonne vehicle.

Since $dE/dt = -D v$ with $v \approx \sqrt{\mu / r} \approx 7661\,\mathrm{m/s}$, the mean drag force is $D \approx 2100 / 7661 \approx 0.27\,\mathrm{N}$. A quarter of a newton, continuously, is what brings the station down a few kilometres a month and has to be made up by periodic reboost burns.
:::

## Equilibrium and stability from the potential

One last idea, which lessons 8 and 9 will lean on. Where $\nabla U = 0$ the force vanishes and a particle at rest stays at rest: an **equilibrium**. Near a minimum of $U$ any displacement raises the potential energy, so the force $-\nabla U$ points back toward the minimum and the equilibrium is **stable**; the particle oscillates. Near a maximum the force points away and the equilibrium is **unstable**. In one dimension, expanding $U$ about a minimum $x_0$ gives $U \approx U_0 + \tfrac{1}{2} U''(x_0)(x - x_0)^2$, so every stable equilibrium looks like a spring of stiffness $k = U''(x_0)$ close up, with small-oscillation frequency $\omega = \sqrt{U''(x_0)/m}$. Reading stability off the shape of a potential is far faster than integrating the equations of motion, and it is the method of choice for propellant slosh, gravity-gradient attitude and libration-point orbits later in the curriculum.

## Check yourself

::: check
A satellite is in a circular orbit at 400 km altitude, $r = 6778\,\mathrm{km}$, moving at $7669\,\mathrm{m/s}$. What single tangential $\Delta v$ puts it on an escape trajectory?
:::

::: answer
Escape means $\varepsilon = 0$, so $v_{\mathrm{esc}} = \sqrt{2\mu / r} = \sqrt{2 \times 3.986 \times 10^{14} / 6.778 \times 10^{6}} \approx 10{,}845\,\mathrm{m/s}$, which is $\sqrt{2} \times 7669$. The required $\Delta v = 10{,}845 - 7669 \approx 3.18\,\mathrm{km/s}$, applied along the velocity. Doing it here rather than higher up is the Oberth effect: the same $\Delta v$ buys more energy where $v$ is larger.
:::

::: check
Explain why the potential energy of a rocket's thrust cannot be defined, but that of Earth's gravity can. Then state how the total mechanical energy of a vehicle under gravity, thrust and drag changes with time.
:::

::: answer
Gravity is a central force whose magnitude depends only on distance, so its work between two points is $\int F(r)\,dr$, fixed by the endpoints, and $U = -\mu m / r$ exists with $\mathbf{F} = -\nabla U$. Thrust is not a function of position at all — guidance points it wherever it likes — so its work depends on the path and no potential exists; the same is true of drag, which depends on velocity and always does negative work. For the vehicle, $dE/dt = \mathbf{T} \cdot \mathbf{v} - D v$: thrust adds mechanical energy at the rate $T v \cos\alpha$ ($\alpha$ the angle between thrust and velocity), drag removes it at the rate $D v$, and gravity does not appear because it is inside $E$.
:::

::: check
The Moon has $\mu = 4.905 \times 10^{12}\,\mathrm{m^3/s^2}$ and radius $1737\,\mathrm{km}$. What is the escape speed from its surface, and how does the depth of its gravity well (per kilogram) compare with Earth's?
:::

::: answer
$v_{\mathrm{esc}} = \sqrt{2\mu / R} = \sqrt{2 \times 4.905 \times 10^{12} / 1.737 \times 10^{6}} \approx 2376\,\mathrm{m/s}$. The well depth is $\mu / R = 2.82 \times 10^{6}\,\mathrm{J/kg}$, against Earth's $3.986 \times 10^{14} / 6.378 \times 10^{6} \approx 6.25 \times 10^{7}\,\mathrm{J/kg}$ — about 22 times shallower, which is why a lunar ascent stage can be a small fraction of the vehicle that landed it.
:::

::: check
A drag-perturbed propagator shows a satellite's speed increasing over several days. A colleague says drag can only slow things down, so the code must be wrong. Settle the argument with the energy equation.
:::

::: answer
Both are half right. Drag does negative work, so the total mechanical energy $E = K + U$ falls, and $\varepsilon = -\mu / 2a$ shows the semi-major axis falls with it. But for a near-circular orbit $K = \mu m / 2r$ *rises* as $r$ falls, while $U = -\mu m / r$ falls twice as fast, so the sum still decreases. The satellite speeds up because it is sinking deeper into the gravity well and gaining more kinetic energy from gravity than drag takes away. The code is behaving correctly; the check to make is that $E$ decreases monotonically at the rate $-D v$.
:::

::: check
A particle moves in one dimension under $U(x) = \tfrac{1}{2} k x^2 - \tfrac{1}{4} c x^4$ with $k, c > 0$. Where are the equilibria, which are stable, and what is the small-oscillation frequency about the stable one?
:::

::: answer
Equilibria are where $U'(x) = k x - c x^3 = 0$: $x = 0$ and $x = \pm\sqrt{k/c}$. The second derivative is $U'' = k - 3 c x^2$: at $x = 0$ it is $+k$, a minimum, so stable; at $x = \pm\sqrt{k/c}$ it is $k - 3k = -2k$, maxima, so unstable. Near $x = 0$ the particle behaves like a spring of stiffness $k$ and oscillates at $\omega = \sqrt{k/m}$. Push it past $\pm\sqrt{k/c}$ and it runs away; the two maxima bound the region where the equilibrium is safe.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| conservative force | work independent of path; $\oint \mathbf{F} \cdot d\mathbf{r} = 0$; $\mathbf{F} = -\nabla U$. Uniform forces and $F(r)\,\hat{\mathbf{r}}$ central forces qualify; drag, friction and thrust do not |
| $U(\mathbf{r}) = -\int_{\mathbf{r}_0}^{\mathbf{r}} \mathbf{F} \cdot d\mathbf{r}'$ | potential energy, defined up to a constant fixed by the reference point; $W_{\mathrm{cons}} = -\Delta U$ |
| $U = m g z$, $U = \tfrac{1}{2} k x^2$, $U = -\mu m / r$ | uniform gravity, linear spring, Newtonian gravity (reference at infinity) |
| $E = K + U$, $\Delta E = W_{\mathrm{nc}}$ | total mechanical energy; conserved when only conservative forces do work; $dE/dt = \mathbf{T} \cdot \mathbf{v} - D v$ under thrust and drag |
| $\varepsilon = v^2/2 - \mu/r = -\mu/2a$ | specific orbital energy; fixes orbit size; $-\mu/2r$ for a circle |
| $v^2 = \mu(2/r - 1/a)$ | vis-viva: speed at any radius on an orbit of semi-major axis $a$ |
| $v_{\mathrm{esc}} = \sqrt{2\mu/r} = \sqrt{2}\,v_{\mathrm{circ}}$ | escape speed, $\varepsilon = 0$; about $11.18\,\mathrm{km/s}$ at Earth's surface |
| $\varepsilon < 0$, $= 0$, $> 0$ | bound ellipse, parabola, hyperbola |
| equilibrium at $\nabla U = 0$ | stable at a minimum of $U$, unstable at a maximum; $\omega = \sqrt{U''/m}$ for small oscillations |

The next lesson leaves single particles behind. It shows that a system of interacting particles — a tumbling stage, a sloshing tank, a vehicle plus its exhaust — has a centre of mass that obeys Newton's second law exactly as a single particle would, which is what makes the particle idealisation of lessons 1 to 4 legitimate for real vehicles.
