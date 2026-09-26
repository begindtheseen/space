---
id: l04-conservative-forces-potential-energy
title: Conservative forces and potential energy
minutes: 23
covers:
  - conservative forces and potential energy
---

Picture a hill with two trails to the top. One is a steep, straight path. The other zigzags back and forth in gentle switchbacks. Carry a backpack up either one and you arrive at the same height, so gravity has taken exactly the same amount of energy from you either way. Now picture pushing a heavy box across a carpet. A longer route costs you more, and none of that effort comes back. Gravity keeps score by *where you are*. The carpet keeps score by *how far you went*.

Lesson 3 left the work of gravity as an integral that had to be worked out along whatever path the vehicle flew. For most forces that is the end of the story: the work that air drag does during an ascent depends on the exact trajectory, and there is no shortcut. Gravity is different. Its work between two points is the same along every path, so it can be worked out once, written down as a function of position, and never integrated again. That function is the **potential energy**, and it turns the work-energy theorem into a conservation law.

For orbits this is the most-used single fact in the subject. The total energy of a satellite under gravity alone is constant. Its value fixes the size of the orbit, and the speed at any distance follows from one line of algebra. A **[[propagator|propagator]]** — the program that steps a spacecraft's position forward in time — that does not hold that energy constant is broken, and an energy check is the first thing you add to any new simulation. This lesson defines conservative forces, shows why gravity is one, builds its potential energy, and derives the energy relations every orbital GNC engineer carries in their head.

## Conservative forces

A force is **conservative** — it keeps score by position only — when the work it does on a particle moving from point $A$ to point $B$ depends only on the two endpoints, not on the [[path taken between them|path-independence]]. Three statements say the same thing, and it pays to move easily between them.

1. The work $\int_A^B \mathbf{F} \cdot d\mathbf{r}$ is the same along every path from $A$ to $B$.
2. The work around any closed loop is zero: $\oint \mathbf{F} \cdot d\mathbf{r} = 0$. (The circle on the integral sign, read "the loop integral", means "go all the way around and come back to the start". If two routes out gave different work, going out one way and back the other would leave a leftover.)
3. There is a single number-valued function $U(\mathbf{r})$ with $\mathbf{F} = -\nabla U$.

The third form is the one you compute with. The symbol $\nabla U$, read "[[del|del-symbol]] U" or "grad U", is the **gradient** of $U$: the vector that points in the direction $U$ rises fastest, with a length equal to how steeply it rises. So the force points straight *downhill* on the $U$ landscape. Along any small step, $\mathbf{F} \cdot d\mathbf{r} = -\nabla U \cdot d\mathbf{r} = -dU$, the drop in $U$ over that step. Add up the steps and the work is $-[U(B) - U(A)]$, whatever path you took.

That minus sign makes potential energy behave like a real landscape. The force shoves you toward lower $U$, and a particle let go from rest starts rolling downhill.

Given a force, how can you tell whether a $U$ exists? Check its **[[curl|curl-test]]**, $\nabla \times \mathbf{F}$ (read "del cross F"). A gradient always has zero curl, so if $\nabla \times \mathbf{F} = 0$ everywhere, the force is conservative and you can integrate it to find $U$.

Two families cover nearly every conservative force in this module:

- **Uniform forces**, $\mathbf{F} = \mathbf{F}_0$, the same everywhere. Gravity near the ground, $m\mathbf{g}$, is the standard case.
- **Central forces whose size depends on distance only**, $\mathbf{F} = F(r)\,\hat{\mathbf{r}}$. "Central" means the force always points straight toward or away from one center; $\hat{\mathbf{r}}$, read "r hat", is the unit arrow pointing outward from that center. Newton's gravity and a spring anchored at one end are both of this type.

The proof for central forces is short, and it is the one to know. Take a tiny step $d\mathbf{r}$ in any direction. Only the part of that step along the radius counts, because the force points along the radius. That part is $\hat{\mathbf{r}} \cdot d\mathbf{r} = dr$, the change in distance from the center. So $\mathbf{F} \cdot d\mathbf{r} = F(r)\,dr$, and adding up all the steps gives

$$
W_{AB} = \int_{r_A}^{r_B} F(r)\,dr .
$$

The right-hand side mentions only the starting distance $r_A$ and the final distance $r_B$. Whatever spiral, loop or ellipse the path traces, only those two numbers survive. Gravity is conservative because it is central and depends on distance alone.

Which forces are **non-conservative**? **Drag** depends on velocity, not position, and it always does negative work, so its loop integral can never be zero. **Friction** is the same. **Thrust** is a force you command: it can point anywhere, its work depends entirely on what the guidance did along the way, and no $U$ can describe it. These forces get their own column in the energy equation.

## Potential energy

Think of a stretched rubber band, or a book lifted onto a high shelf. Energy you put in is stored by *position*, and it comes back as motion when you let go. That stored energy is **potential energy**.

Precisely: for a conservative force, the potential energy at $\mathbf{r}$ is minus the work the force does as the particle moves from a chosen **reference point** $\mathbf{r}_0$ to $\mathbf{r}$:

$$
U(\mathbf{r}) = -\int_{\mathbf{r}_0}^{\mathbf{r}} \mathbf{F} \cdot d\mathbf{r}', \qquad \text{so that} \qquad W_{AB} = -\Delta U = U(A) - U(B).
$$

(The prime on $\mathbf{r}'$ only marks it as the variable being integrated over.) Put another way, $U(\mathbf{r})$ is the work *you* would have to do against the force to carry the particle to $\mathbf{r}$.

The reference point is your free choice, like measuring height from the floor or from sea level. Changing it adds the same constant to $U$ everywhere, and [[nothing physical depends on that constant|reference-point]], because only *differences* in $U$ ever enter an equation. Choose whatever makes the formula simplest.

Three potentials come up constantly. Each comes from doing the integral; then we check it by taking the gradient.

**Uniform gravity.** Let $z$ point up, so $\mathbf{F} = -m g\,\hat{\mathbf{z}}$, and put the reference at $z = 0$. Lifting from $0$ to $z$, gravity does work $-mgz$, so

$$
U = m g z, \qquad -\nabla U = -m g\,\hat{\mathbf{z}}. \checkmark
$$

**Linear spring.** A spring of **stiffness** $k$ (how many newtons per meter of stretch, in $\mathrm{N/m}$) stretched a distance $x$ past its natural length pulls back with $F = -k x$. Reference at $x = 0$:

$$
U = \tfrac{1}{2} k x^2, \qquad -\frac{dU}{dx} = -k x. \checkmark
$$

**Newtonian gravity.** The force is $\mathbf{F} = -\dfrac{\mu m}{r^2}\,\hat{\mathbf{r}}$, where $\mu$ ("mu") is the planet's gravitational parameter, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ for Earth. The natural reference is infinitely far away, where the force dies out. Bring the particle in from infinity to $r$:

$$
U(r) = -\int_{\infty}^{r} \left(-\frac{\mu m}{r'^2}\right) dr' = \mu m \left[-\frac{1}{r'}\right]_{\infty}^{r} = -\frac{\mu m}{r}.
$$

Step by step: the two minus signs outside and inside make a plus; the integral of $1/r'^2$ is $-1/r'$; at infinity that is $0$, so only $-1/r$ is left. Check: $-\dfrac{dU}{dr} = -\dfrac{\mu m}{r^2}$, pointing inward. $\checkmark$

This potential energy is negative everywhere and rises toward zero far away. A particle at distance $r$ sits at the bottom of an **[[energy hole|gravity-well]]** $\mu m / r$ deep, and that depth is the work needed to lift it out to infinity. In lesson 3 you found the work of gravity on a straight-up climb to be $\mu m (1/r - 1/r_0)$. That is exactly $-\Delta U$ with this $U$.

In orbital mechanics it is handy to divide out the mass and use the **gravitational potential** $\Phi(r) = U/m = -\mu / r$ ($\Phi$ is capital "phi"), in $\mathrm{J/kg}$, which is the same as $\mathrm{m^2/s^2}$. Near the surface, a first-order expansion gives $-\mu/(R_E + h) \approx -\mu/R_E + (\mu/R_E^2)\,h = \Phi_0 + g h$, where $R_E$ is Earth's radius and $h$ the height. So the uniform-gravity $mgh$ is the first-order piece of the Newtonian potential, good while $h$ is much smaller than $R_E$.

::: warning Potential energy has rules
Potential energy belongs only to a *conservative* force, and it is defined only up to a constant. Two things follow. You cannot write a potential energy for thrust or drag; their work always goes in the non-conservative column. And a negative potential energy is not "less than nothing". With the reference at infinity, $U = -\mu m / r$ is negative for every bound orbit, and that sign is exactly what makes the orbit bound. Comparing potential energies computed from different reference points is the commonest way to get nonsense out of a correct formula.
:::

## Conservation of mechanical energy

A child on a swing is fast at the bottom and stops for an instant at the top. Speed turns into height and back again, and if nothing rubbed or dragged, the swing would go on forever. That trade is conservation of energy.

Here is the precise version. Split the net force into a conservative part, with potential $U$, and a non-conservative remainder $\mathbf{F}_{\mathrm{nc}}$. Lesson 3's work-energy theorem says the change in kinetic energy $K$ equals the net work, and the conservative part of that work is $-\Delta U$:

$$
\Delta K = W_{\mathrm{net}} = W_{\mathrm{cons}} + W_{\mathrm{nc}} = -\Delta U + W_{\mathrm{nc}}.
$$

Move $\Delta U$ to the left side and define the **total mechanical energy** $E = K + U$:

$$
\Delta E = \Delta(K + U) = W_{\mathrm{nc}} = \int \mathbf{F}_{\mathrm{nc}} \cdot d\mathbf{r}.
$$

When no non-conservative force does work, $E$ does not change: **conservation of mechanical energy**. Kinetic and potential energy trade back and forth — a satellite slows as it climbs to **apogee** (its highest point) and speeds up falling back to **perigee** (its lowest) — but the sum stays put.

When non-conservative forces do act, the equation still holds and is every bit as useful: the change in $E$ equals their work. Drag *removes* mechanical energy at the rate $-D v$, where $D$ is the drag force and $v$ the speed. Thrust *adds* it at the rate $\mathbf{T} \cdot \mathbf{v}$.

::: key The work-energy theorem and conservation
The work-energy theorem is $W_{\mathrm{net}} = \Delta KE = \tfrac{1}{2} m v_2^2 - \tfrac{1}{2} m v_1^2$. For conservative forces $W = -\Delta U$, giving conservation of $E = KE + U$ when only conservative forces do work; in general $\Delta E = W_{\mathrm{nc}}$, the work of the non-conservative forces (drag, thrust).
:::

This is the sanity check the module asks you to use on a simulation. A two-body propagator has only gravity acting, so $E$ must stay constant, apart from tiny numerical error. Compute $\tfrac{1}{2} v^2 - \mu / r$ at every step. If it drifts steadily, the time step is too large or the force is wrong. Add drag and $E$ must fall steadily, by exactly $\int D v\,dt$. Add thrust and $E$ must change by $\int \mathbf{T} \cdot \mathbf{v}\,dt$. Anything else is a bug, and the check costs one line of code.

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

Divide $E$ by the mass and you get the **specific orbital energy** — energy per kilogram — written $\varepsilon$ ("epsilon"):

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \qquad \mathrm{J/kg}.
$$

For a circular orbit of radius $r$, gravity supplies exactly the pull needed to bend the path into a circle: $v^2 / r = \mu / r^2$. Multiply both sides by $r$ to get $v^2 = \mu / r$. Put that in:

$$
\varepsilon_{\mathrm{circ}} = \frac{\mu}{2r} - \frac{\mu}{r} = -\frac{\mu}{2r}.
$$

The kinetic energy is exactly half the size of the potential energy, and the total is negative: the orbit is **bound**, meaning the satellite cannot get away. The same result extends to any ellipse with **semi-major axis** $a$ (half the ellipse's longest width). The general derivation is in the two-body module, but you can check it now at the high and low points of a real orbit, as the first example does. It gives the central formula of orbital energy:

$$
\varepsilon = -\frac{\mu}{2a}.
$$

Energy fixes the *size* of an orbit and nothing else. A circle and a long, thin ellipse with the same $a$ have the same energy. Set the two expressions for $\varepsilon$ equal and solve for $v$ to get the **[[vis-viva equation|vis-viva-name]]**,

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right),
$$

the speed at any distance on an orbit of known size. The sign of $\varepsilon$ sorts every orbit into three kinds:

- $\varepsilon < 0$: bound, an ellipse ($a > 0$). The body can never reach infinity, because $v^2 = 2(\varepsilon + \mu / r)$ would have to go negative on the way.
- $\varepsilon = 0$: a parabola, the borderline case. At distance $r$ the speed is the **escape speed** $v_{\mathrm{esc}} = \sqrt{2\mu / r}$, exactly $\sqrt{2}$ times the circular speed at that distance. From Earth's surface, $\sqrt{2 \times 3.986 \times 10^{14} / 6.378 \times 10^{6}} \approx 11.18\,\mathrm{km/s}$.
- $\varepsilon > 0$: unbound, a hyperbola. The body reaches infinity with speed to spare, $v_\infty = \sqrt{2\varepsilon}$.

::: example The GTO high and low points, from energy alone
Lesson 2 took the perigee speed of a **geostationary transfer orbit** (GTO, the ellipse that carries satellites up to geostationary height) as given, with $r_p = 6678\,\mathrm{km}$ and $r_a = 42{,}164\,\mathrm{km}$. Now derive both speeds from conservation of energy and of angular momentum.

At perigee and apogee the velocity is at right angles to the radius, so angular momentum conservation reads $r_p v_p = r_a v_a$. Energy conservation reads

$$
\frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{v_a^2}{2} - \frac{\mu}{r_a}.
$$

Put $v_a = (r_p / r_a) v_p$ into it, gather the $v_p^2$ terms on the left, and solve:

$$
v_p^2 \left[1 - \frac{r_p^2}{r_a^2}\right] = 2\mu\left(\frac{1}{r_p} - \frac{1}{r_a}\right)
\quad \Rightarrow \quad
v_p^2 = \frac{2\mu\,r_a}{r_p\,(r_p + r_a)}.
$$

**Numbers.** $v_p^2 = 2 \times 3.986 \times 10^{14} \times 4.2164 \times 10^{7} / (6.678 \times 10^{6} \times 4.8842 \times 10^{7}) \approx 1.0306 \times 10^{8}\,\mathrm{m^2/s^2}$. The square root gives $v_p \approx 10{,}152\,\mathrm{m/s}$. Then $v_a = (6678 / 42{,}164) \times 10{,}152 \approx 1608\,\mathrm{m/s}$, matching lesson 2.

**Check $\varepsilon = -\mu / 2a$.** The semi-major axis is $a = (r_p + r_a)/2 = 24{,}421\,\mathrm{km}$, so $-\mu/2a = -3.986 \times 10^{14} / (2 \times 2.4421 \times 10^{7}) \approx -8.16 \times 10^{6}\,\mathrm{J/kg}$. Directly at perigee: $\tfrac{1}{2} \times 10{,}152^2 - 3.986 \times 10^{14} / 6.678 \times 10^{6} \approx 5.153 \times 10^{7} - 5.969 \times 10^{7} \approx -8.16 \times 10^{6}\,\mathrm{J/kg}$. The two agree.

Vis-viva now gives the speed anywhere. At $r = 10{,}000\,\mathrm{km}$ on the way up, $v = \sqrt{\mu(2/r - 1/a)} \approx 7962\,\mathrm{m/s}$ — between the perigee and apogee speeds, as it should be, and a number your propagator must reproduce.
:::

::: example How high does a vertical launch go?
A sounding rocket burns out near the ground moving straight up at $2000\,\mathrm{m/s}$. Ignoring drag and Earth's spin, how high does it coast? Compare the uniform-gravity estimate with the exact one.

**Uniform gravity.** With $U = m g_0 h$, all the kinetic energy becomes potential energy at the top: $\tfrac{1}{2} v_0^2 = g_0 h_{\max}$. So $h_{\max} = 2000^2 / (2 \times 9.80665) \approx 204\,\mathrm{km}$.

**Newtonian gravity.** With $U = -\mu m / r$, and $v = 0$ at the peak:

$$
\frac{v_0^2}{2} - \frac{\mu}{R_E} = -\frac{\mu}{r_{\max}}
\quad \Rightarrow \quad
r_{\max} = \left(\frac{1}{R_E} - \frac{v_0^2}{2\mu}\right)^{-1}.
$$

With $R_E = 6378\,\mathrm{km}$: $1/R_E = 1.5679 \times 10^{-7}\,\mathrm{m^{-1}}$ and $v_0^2 / 2\mu = 4 \times 10^{6} / (7.972 \times 10^{14}) = 5.018 \times 10^{-9}\,\mathrm{m^{-1}}$. Subtract and flip: $r_{\max} \approx 6589\,\mathrm{km}$, so $h_{\max} \approx 211\,\mathrm{km}$.

**Sense check.** The uniform-gravity answer is about 3% low. That makes sense: $g$ weakens by about 6% over the climb, so the real rocket coasts farther than a constant $g_0$ allows. At $2\,\mathrm{km/s}$ the correction is modest; at $8\,\mathrm{km/s}$ the uniform formula is useless.
:::

## Reading the energy budget of a real orbit

The energy equation with a non-conservative term is a diagnostic tool, not only a conservation law. Two uses come up again and again.

**Orbital decay.** A satellite in low orbit loses energy to drag at the rate $dE/dt = -D v$. Since $\varepsilon = -\mu / 2a$, a small loss of energy means a small shrink of the orbit: $d\varepsilon = (\mu / 2a^2)\,da$. The orbit shrinks — and, surprisingly, the satellite *[[speeds up|drag-paradox]]*, because circular speed $\sqrt{\mu / r}$ grows as $r$ falls. Drag slows the satellite at every instant, yet it ends up faster. The answer to the puzzle: the potential energy falls twice as fast as the total energy, so kinetic energy has to rise. This is a classic interview check on whether someone really understands $E = K + U$.

**Maneuver cost.** To move to an orbit of different size, the engines must supply $\Delta\varepsilon = -\tfrac{\mu}{2}(1/a_2 - 1/a_1)$ per kilogram, at the rate $\mathbf{T} \cdot \mathbf{v}$. For a fixed $\Delta v$, the energy delivered is largest where $v$ is largest — lesson 3's Oberth effect, now said in terms of $\varepsilon$. That is why apogee is raised by burning at perigee, and escape burns are done as deep in the gravity well as possible.

::: example Drag power on a space station
A $420\,\mathrm{t}$ station at $r = 6791\,\mathrm{km}$ (about $413\,\mathrm{km}$ up) loses roughly $100\,\mathrm{m}$ of altitude per day to drag. What average drag power is that, and what is the average drag force?

**Energy per meter.** For a near-circular orbit $\varepsilon = -\mu / 2r$, so the energy per kilogram per meter of height is $d\varepsilon / dr = \mu / (2 r^2) = 3.986 \times 10^{14} / (2 \times (6.791 \times 10^{6})^2) \approx 4.32\,\mathrm{J/kg}$ per meter.

**Energy per day.** Losing $100\,\mathrm{m}$ costs $432\,\mathrm{J/kg}$. For the whole station, $432 \times 4.2 \times 10^{5} \approx 1.81 \times 10^{8}\,\mathrm{J}$ per day.

**Power.** Divide by the $86{,}400\,\mathrm{s}$ in a day: about $2.1\,\mathrm{kW}$ — the power of an electric kettle, draining a 420-tonne vehicle.

**Force.** Since $dE/dt = -D v$ with $v \approx \sqrt{\mu / r} \approx 7661\,\mathrm{m/s}$, the drag is $D \approx 2100 / 7661 \approx 0.27\,\mathrm{N}$ — about the weight of a slice of bread. A quarter of a newton, never stopping, brings the station down a few kilometers a month, and periodic reboost burns have to make it up.
:::

## Equilibrium and stability from the potential

A marble in a bowl rolls back to the bottom when you nudge it. A marble balanced on an upside-down bowl rolls away. The shape of $U$ tells you which kind of spot you are in, without solving any equations of motion.

Where $\nabla U = 0$, the force is zero and a particle at rest stays at rest: an **equilibrium**. Near a *minimum* of $U$, any nudge raises the potential energy, so the force $-\nabla U$ points back toward the minimum. The equilibrium is **stable**, and the particle rocks back and forth. Near a *maximum*, the force points away, and the equilibrium is **unstable**.

In one dimension you can say exactly how it rocks. Close to a minimum at $x_0$, $U$ looks like a bowl: $U \approx U_0 + \tfrac{1}{2} U''(x_0)(x - x_0)^2$, where $U''$ ("U double-prime") is the second derivative, the bowl's curvature. That is the spring formula with stiffness $k = U''(x_0)$. So every stable equilibrium looks like a spring close up, and small oscillations have angular frequency $\omega = \sqrt{U''(x_0)/m}$ ($\omega$ is "omega", in radians per second).

Reading stability from the shape of a potential is far faster than integrating the motion. Later in the curriculum it is the method of choice for propellant slosh, gravity-gradient attitude and orbits around the **[[libration points|libration-points]]**.

## Check yourself

::: check
A satellite is in a circular orbit at $400\,\mathrm{km}$ altitude, $r = 6778\,\mathrm{km}$, moving at $7669\,\mathrm{m/s}$. What single $\Delta v$, pointed along the velocity, puts it on an escape trajectory?
:::

::: answer
Escape means $\varepsilon = 0$, so $v_{\mathrm{esc}} = \sqrt{2\mu / r} = \sqrt{2 \times 3.986 \times 10^{14} / 6.778 \times 10^{6}} \approx 10{,}845\,\mathrm{m/s}$. That is $\sqrt{2} \times 7669$, as it should be.

The required $\Delta v = 10{,}845 - 7669 \approx 3.18\,\mathrm{km/s}$, applied along the velocity. Doing it low down rather than higher up is the Oberth effect: the same $\Delta v$ buys more energy where $v$ is larger.
:::

::: check
Explain why a potential energy for a rocket's thrust cannot be defined, but one for Earth's gravity can. Then say how the total mechanical energy of a vehicle under gravity, thrust and drag changes with time.
:::

::: answer
Gravity is a central force whose size depends only on distance. Its work between two points is $\int F(r)\,dr$, fixed by the endpoints, so $U = -\mu m / r$ exists with $\mathbf{F} = -\nabla U$.

Thrust is not a function of position at all — guidance points it wherever it likes — so its work depends on the path and no potential exists. Drag is the same: it depends on velocity and always does negative work.

For the vehicle, $dE/dt = \mathbf{T} \cdot \mathbf{v} - D v$. Thrust adds mechanical energy at the rate $T v \cos\alpha$, where $\alpha$ is the angle between thrust and velocity. Drag removes it at the rate $D v$. Gravity does not appear, because it is already inside $E$.
:::

::: check
The Moon has $\mu = 4.905 \times 10^{12}\,\mathrm{m^3/s^2}$ and radius $1737\,\mathrm{km}$. What is the escape speed from its surface? How does the depth of its gravity well, per kilogram, compare with Earth's?
:::

::: answer
$v_{\mathrm{esc}} = \sqrt{2\mu / R} = \sqrt{2 \times 4.905 \times 10^{12} / 1.737 \times 10^{6}} \approx 2376\,\mathrm{m/s}$.

The well depth is $\mu / R = 2.82 \times 10^{6}\,\mathrm{J/kg}$. Earth's is $3.986 \times 10^{14} / 6.378 \times 10^{6} \approx 6.25 \times 10^{7}\,\mathrm{J/kg}$ — about 22 times deeper. That is why a lunar ascent stage can be a small fraction of the vehicle that landed it.
:::

::: check
A drag-affected propagator shows a satellite's speed *increasing* over several days. A colleague says drag can only slow things down, so the code must be wrong. Settle the argument with the energy equation.
:::

::: answer
Both are half right. Drag does negative work, so the total mechanical energy $E = K + U$ falls, and $\varepsilon = -\mu / 2a$ says the orbit shrinks with it.

But for a near-circular orbit $K = \mu m / 2r$ *rises* as $r$ falls, while $U = -\mu m / r$ falls twice as fast, so the sum still goes down. The satellite speeds up because it is sinking deeper into the gravity well, gaining more kinetic energy from gravity than drag takes away.

The code is behaving correctly. The check to make is that $E$ decreases steadily at the rate $D v$.
:::

::: check
A particle moves in one dimension with potential energy $U(x) = \tfrac{1}{2} k x^2 - \tfrac{1}{4} c x^4$, where $k$ and $c$ are positive. Where are the equilibria, which are stable, and what is the small-oscillation frequency about the stable one?
:::

::: answer
Equilibria are where $U'(x) = k x - c x^3 = 0$. Factor it as $x(k - c x^2) = 0$: so $x = 0$ and $x = \pm\sqrt{k/c}$.

The second derivative is $U'' = k - 3 c x^2$. At $x = 0$ it is $+k$: a minimum, so stable. At $x = \pm\sqrt{k/c}$ it is $k - 3k = -2k$: maxima, so unstable.

Near $x = 0$ the particle acts like a spring of stiffness $k$ and oscillates at $\omega = \sqrt{k/m}$. Push it past $\pm\sqrt{k/c}$ and it runs away; the two maxima fence in the region where the equilibrium is safe.
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

The next lesson leaves single particles behind. A system of interacting particles — a tumbling stage, a sloshing tank, a vehicle plus its exhaust — has a center of mass that obeys Newton's second law exactly as a single particle would. That is what makes the point-particle picture of lessons 1 to 4 legitimate for real vehicles.

::: context propagator What a propagator is
To **propagate** an orbit is to start from where a spacecraft is and how fast it is going *now*, and work out where it will be later. The program that does it takes small time steps: work out the forces, nudge the velocity, nudge the position, repeat. Every mission control center and every flight computer that navigates runs one. Because each small step carries a tiny error, the errors can pile up — and a slowly drifting energy is usually the first sign.
:::

::: context path-independence Two trails, one answer
Gravity's work from $A$ to $B$ depends only on how much height you gained, not on the trail.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5,4"/>
  <line x1="20" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5,4"/>
  <path d="M60,140 L280,40" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M60,140 C140,140 240,125 250,110 C260,95 110,105 110,85 C110,65 270,70 280,40" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="60" cy="140" r="5" fill="#1f2a44"/>
  <circle cx="280" cy="40" r="5" fill="#1f2a44"/>
  <text x="48" y="160" font-size="13" fill="#1f2a44">A</text>
  <text x="288" y="34" font-size="13" fill="#1f2a44">B</text>
  <line x1="320" y1="44" x2="320" y2="136" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="320,40 315,50 325,50" fill="#1f2a44"/>
  <polygon points="320,140 315,130 325,130" fill="#1f2a44"/>
  <text x="326" y="94" font-size="12" fill="#1f2a44">Δh</text>
  <text x="120" y="30" font-size="12" fill="#1d6fd1">steep path</text>
  <text x="130" y="160" font-size="12" fill="#b4232c">winding path</text>
</svg>
```

Both paths gain the same height $\Delta h$, so gravity does the same work, $-mg\,\Delta h$, on each. Friction on the winding path would be a different story: it grows with every extra meter walked.
:::

::: context del-symbol The upside-down triangle
The symbol $\nabla$ is called **del** or **nabla**. The name "nabla" comes from a Greek word for a kind of harp, which the symbol's shape resembles. It stands for "take the partial derivative in each direction": $\nabla U = (\partial U/\partial x,\ \partial U/\partial y,\ \partial U/\partial z)$. You met it in the multivariable calculus module. Here it turns a height map of energy into an arrow that points uphill; the force is the arrow flipped to point downhill.
:::

::: context curl-test The paddle-wheel test
Imagine dropping a tiny paddle wheel into a flowing stream. If the water on one side moves faster than on the other, the wheel spins. The **curl** of a force field measures that spin at each point. A force that comes from a landscape, $\mathbf{F} = -\nabla U$, never makes the wheel spin, because going around any small loop you end at the same height you started. Mathematically, $\nabla \times \nabla U = 0$ because mixed partial derivatives come out the same in either order. So zero curl is the quick test for "conservative".
:::

::: context reference-point Where you put zero does not matter
Measure a shelf's height from the floor and it is $2\,\mathrm{m}$. Measure from sea level and it is $302\,\mathrm{m}$. Drop a book from it and the book falls exactly the same way — only the *difference* between the shelf and the floor matters. Potential energy works the same way. Near the ground engineers put zero at the surface ($U = mgz$). For orbits they put it at infinity ($U = -\mu m/r$). Both are fine, but never mix numbers from the two in one calculation.
:::

::: context gravity-well The gravity well
Plot $U = -\mu m / r$ against distance and you get a well: steep near the planet, flattening toward zero far away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="350" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="352" y="24" font-size="11" fill="#1f2a44" text-anchor="end">U = 0 (at infinity)</text>
  <line x1="40" y1="20" x2="40" y2="195" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="30" width="50" height="165" fill="#8fb8f0" opacity="0.5"/>
  <text x="65" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">planet</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="90.0,180.0 94.4,167.9 98.8,157.5 103.2,148.6 107.6,140.9 112.0,134.1 116.4,128.1 120.8,122.8 125.3,118.0 129.7,113.6 134.1,109.7 138.5,106.2 142.9,102.9 147.3,99.9 151.7,97.1 156.1,94.6 160.5,92.2 164.9,90.0 169.3,88.0 173.7,86.1 178.1,84.3 182.5,82.6 186.9,81.0 191.4,79.6 195.8,78.2 200.2,76.8 204.6,75.6 209.0,74.4 213.4,73.3 217.8,72.2 222.2,71.2 226.6,70.2 231.0,69.3 235.4,68.4 239.8,67.5 244.2,66.7 248.6,65.9 253.1,65.2 257.5,64.5 261.9,63.8 266.3,63.1 270.7,62.5 275.1,61.9 279.5,61.3 283.9,60.8 288.3,60.2 292.7,59.7 297.1,59.2 301.5,58.7 305.9,58.2 310.3,57.7 314.7,57.3 319.2,56.9 323.6,56.4 328.0,56.0 332.4,55.7 336.8,55.3 341.2,54.9 345.6,54.5 350.0,54.2"/>
  <line x1="100" y1="34" x2="100" y2="176" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="100,30 95,40 105,40" fill="#1d6fd1"/>
  <polygon points="100,180 95,170 105,170" fill="#1d6fd1"/>
  <text x="106" y="176" font-size="12" fill="#1d6fd1">depth μm/R</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="207">1</text><text x="140" y="207">2</text><text x="190" y="207">3</text>
    <text x="240" y="207">4</text><text x="290" y="207">5</text><text x="340" y="207">6</text>
  </g>
  <text x="250" y="110" font-size="11" fill="#6c7a93">distance r, in planet radii</text>
</svg>
```

At twice the planet's radius the well is half as deep; at six radii it is a sixth as deep. Climbing out completely takes $\mu m/R$ of energy.
:::

::: context vis-viva-name "Living force"
*Vis viva* is Latin for "living force". It was Gottfried Leibniz's name, in the late 1600s, for the quantity $mv^2$ — twice what we now call kinetic energy. He argued that this "living force" is what is kept constant in collisions and falls, an early form of the energy conservation in this lesson. The orbital equation kept the old name because it is, at heart, a statement about kinetic energy.
:::

::: context drag-paradox Why drag speeds a satellite up
Compare a circular orbit before and after drag lowers it. Per kilogram, $K = \mu/2r$ and $U = -\mu/r$, so $U = -2K$ and $E = -K$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="22" y="74" font-size="11" fill="#1f2a44">0</text>
  <rect x="50" y="40" width="30" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="90" y="80" width="30" height="80" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="130" y="80" width="30" height="40" fill="#b4232c" opacity="0.7" stroke="#1f2a44"/>
  <rect x="200" y="30" width="30" height="50" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="240" y="80" width="30" height="100" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="280" y="80" width="30" height="50" fill="#b4232c" opacity="0.7" stroke="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="65" y="34">K</text><text x="105" y="174">U</text><text x="145" y="134">E</text>
    <text x="215" y="24">K</text><text x="255" y="174">U</text><text x="295" y="144">E</text>
    <text x="105" y="20">higher orbit</text><text x="255" y="20">after drag</text>
  </g>
</svg>
```

Drag took energy away, so $E$ went down. But $U$ went down twice as far, and the difference showed up as extra kinetic energy. Lower orbit, faster satellite.
:::

::: context libration-points Balance points in space
Where Earth's and the Sun's gravity (and the effect of going around together) cancel out, there are five special spots called **Lagrange points** or libration points. The James Webb Space Telescope orbits near one of them, about $1.5$ million kilometers from Earth on the side away from the Sun. Along the Sun–Earth line that point sits on a *hump* of the effective potential, not in a bowl, so it is unstable: Webb fires small thrusters about every three weeks to stay nearby — the marble-on-a-dome case from this lesson.
:::
