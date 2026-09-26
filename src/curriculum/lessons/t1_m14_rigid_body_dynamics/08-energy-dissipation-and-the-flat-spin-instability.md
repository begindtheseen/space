---
id: l08-energy-dissipation-and-the-flat-spin-instability
title: Energy dissipation and the flat-spin instability
minutes: 24
covers:
  - energy dissipation and the flat-spin instability
---

The last lesson proved that a rigid body spins stably about its major axis and its minor axis alike. On the night of January 31, 1958, the United States put its [[first satellite|explorer-launch]] into orbit spinning about its minor axis. Within its first few orbits it was tumbling.

Explorer 1 was shaped like a pencil, $2.03\,\mathrm{m}$ long and $15.2\,\mathrm{cm}$ across, and was spun at about $750\,\mathrm{rpm}$ (revolutions per minute) about its long axis, the way a rifle spins a bullet, to hold it steady. Its radio signals soon showed a **flat spin**: slow end-over-end turning about an axis across its length. The rigid-body theory used to design it said that could not happen.

The explanation: no spacecraft is rigid. Explorer 1 carried four flexible **[[whip antennas|whip-antenna]]**, and a flexing antenna turns motion into heat. Nothing inside a spacecraft can change its angular momentum, but it can drain its rotational kinetic energy. With the angular momentum fixed, the lowest-energy rotation is a spin about the axis of *largest* inertia. For a long, thin body, that is a flat spin.

This lesson makes that exact: why $\lVert\mathbf{H}\rVert$ cannot change while $T$ can, the energy of a spin at fixed momentum, and a small energy-drain model that gives a time scale. The result is the **major-axis rule**, the most important design rule in this module. Since Explorer 1, a spacecraft that must hold its spin with no active control is built to spin about its major axis. (Lesson 10 shows the one clever way around it.)

## Internal dissipation at constant angular momentum

Picture yourself on a spinning office chair, holding a heavy book. Nothing you do — waving the book, swinging your legs — changes the total spin of you plus the chair (friction in the chair's bearing aside). Every push you give the book, it gives back: Newton's third law. A spacecraft cannot change its own angular momentum from the inside.

Treat the spacecraft — structure plus flexing antennas, sloshing propellant, whatever moves inside — as a closed system with no outside torque. Its total angular momentum about the center of mass obeys

$$
\frac{d\mathbf{H}}{dt}\bigg|_N = \mathbf{M}_{\mathrm{ext}} = 0 .
$$

($N$ marks the inertial frame, fixed to the distant stars; $\mathbf{M}_{\mathrm{ext}}$ is the external torque.) So $\mathbf{H}$ is constant in space, in direction and size. [[Internal forces come in equal and opposite pairs|internal-pairs]] along the line joining the two parts that push on each other, so their moments cancel exactly. A damper can shuffle angular momentum between the structure and its fluid, but the total never moves.

Energy is different. The total energy of the closed system is conserved, but not the **rotational kinetic energy** $T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}$ of the body's overall turning. Bending a boom stores some as **strain energy**, the energy of a bent spring, and internal friction turns that into heat. Either way it has left the rotation's books. So the rule is:

> With zero external torque, $\lVert\mathbf{H}\rVert$ is exactly constant and $T$ can only go down.

That lopsidedness is the whole flat-spin instability. Lesson 6 pictured the body-frame angular momentum as living where a sphere of radius $H$ meets an ellipsoid set by $T$. Freeze the sphere and [[shrink the ellipsoid|shrinking-ellipsoid]], and the motion is no longer stuck on one closed polhode. It drifts across them toward smaller $T$ until $T$ is as small as it can be for that $H$.

## The energy of a spin at fixed momentum

Where is that lowest point? A figure skater turns slowly with arms out and fast with arms in. Her angular momentum is the same both ways; her energy is not.

For a pure spin about principal axis $k$ with moment $I_k$, the angular momentum is $H = I_k\omega_k$, so $\omega_k = H/I_k$. Put that into the kinetic energy:

$$
T = \tfrac{1}{2}I_k\omega_k^2 = \tfrac{1}{2}I_k\left(\frac{H}{I_k}\right)^2 = \frac{H^2}{2I_k} .
$$

With $H$ fixed, $T$ gets *smaller* as $I_k$ gets bigger — the skater with her arms out. Of the three pure spins, the one about the largest moment has the least energy and the one about the smallest moment has the most.

The same holds for any motion. Lesson 6 showed $2TI_1 \le H^2 \le 2TI_3$ (with $I_1 < I_2 < I_3$). Dividing the left half by $2I_1$ gives $T \le H^2/(2I_1)$; dividing the right half by $2I_3$ gives $T \ge H^2/(2I_3)$. Together:

$$
\frac{H^2}{2I_3} \le T \le \frac{H^2}{2I_1} .
$$

Only a pure major-axis spin reaches the bottom, and only a pure minor-axis spin the top. Dissipation pushes $T$ down, and $T$ cannot go below $H^2/(2I_3)$, so the motion must head for the major axis. There is nowhere else to go.

::: key The major-axis rule
With $\mathbf{H}$ fixed, the kinetic energy of a spin about a principal axis is $T = H^2/(2I)$, which is minimized by the *largest* $I$. Internal energy dissipation drives $T$ monotonically down toward that minimum, so the spin migrates to the major axis and stays there. A passively stabilized spinner must be a major-axis spinner.
:::

How much energy is there to lose? That sets how violent the change is. Going from a minor-axis spin to a major-axis spin, the body sheds

$$
\Delta T = \frac{H^2}{2I_1} - \frac{H^2}{2I_3} = \frac{H^2}{2I_1}\left(1 - \frac{I_1}{I_3}\right) = T_0\left(1 - \frac{I_1}{I_3}\right),
$$

where the middle step pulls out the common factor $H^2/(2I_1)$, which is the starting energy $T_0$. So the fraction lost is $1 - I_1/I_3$. For a slender body $I_1/I_3$ is a percent or two, so nearly all the rotational energy is destroyed, and the final rate $H/I_3$ is smaller than the starting $H/I_1$ by the same ratio. The body ends up turning far more slowly, about a different axis, having heated its own structure.

::: warning Nothing internal can change the angular momentum
The most common wrong idea is that a damper "takes momentum out" of the spin. It does not. Dampers, wheels, flexing structure, moving astronauts are all internal, and their forces cancel in pairs. Only an external torque changes $\mathbf{H}$. A damper changes how that fixed $\mathbf{H}$ is shared among the body's axes, always downhill in $T$. If a simulation with only internal damping shows $\lVert\mathbf{H}\rVert$ falling, the model is wrong.
:::

## A model energy sink you can integrate

So far you know where the motion ends, not how long it takes. For that, the loss must be in the equations of motion. A real damper adds moving parts — a mass on a spring, a ring of fluid — and lesson 12 models those. A simpler device captures the essentials.

First, the direction of the angular momentum, seen from the body. Divide $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ by its own length to get a unit vector, $\hat{\mathbf{h}}$ ("h hat"):

$$
\hat{\mathbf{h}} = \frac{\mathbf{I}\boldsymbol{\omega}}{\lVert\mathbf{I}\boldsymbol{\omega}\rVert} .
$$

Then apply the torque

$$
\mathbf{M} = -k\left[\boldsymbol{\omega} - \hat{\mathbf{h}}\,(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})\right],
\qquad k > 0 .
$$

Read the bracket as "$\boldsymbol{\omega}$ minus its part along $\hat{\mathbf{h}}$": the [[part of the spin that points sideways to the angular momentum|perp-part]]. So the torque brakes only that sideways part. For a pure principal-axis spin the bracket is zero, and so is the torque. The constant $k$ says how lossy the body is. Its units are $\mathrm{N\,m\,s}$: torque per unit of angular rate. (This $k$ is a new symbol — not the stiffness of lesson 7.)

Two properties make this the right stand-in.

**It never changes $\lVert\mathbf{H}\rVert$.** From lesson 5, $\tfrac{d}{dt}\tfrac{1}{2}H^2 = \mathbf{H}\cdot\mathbf{M}$. Dot $\mathbf{H}$ into the torque, and use $\mathbf{H}\cdot\hat{\mathbf{h}} = H$ (a vector dotted with its own direction gives its length) and $\hat{\mathbf{h}} = \mathbf{H}/H$:

$$
\mathbf{H}\cdot\mathbf{M} = -k\left[\mathbf{H}\cdot\boldsymbol{\omega} - (\mathbf{H}\cdot\hat{\mathbf{h}})(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})\right]
= -k\left[\mathbf{H}\cdot\boldsymbol{\omega} - H\,\frac{\mathbf{H}\cdot\boldsymbol{\omega}}{H}\right] = 0 ,
$$

exactly, for every state.

**It only ever removes energy.** Again from lesson 5, $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$, so

$$
\dot{T} = -k\left[\lVert\boldsymbol{\omega}\rVert^2 - (\boldsymbol{\omega}\cdot\hat{\mathbf{h}})^2\right] \le 0 .
$$

The bracket is the squared length of the sideways part of $\boldsymbol{\omega}$ (by Pythagoras: whole length squared minus the along-part squared). A square is never negative, and it is zero only when $\boldsymbol{\omega}$ lies along $\mathbf{H}$. So the model does what the physics demands — $\lVert\mathbf{H}\rVert$ constant, $T$ always falling — in three lines of code.

```python
import math

def deriv(w, I, k):
    """Euler's equations plus an internal energy sink, principal axes.
    The sink torque damps only the part of w perpendicular to H, so |H| is
    exactly conserved while the kinetic energy falls."""
    H = [I[j] * w[j] for j in range(3)]
    Hmag = math.sqrt(sum(h * h for h in H))
    h = [x / Hmag for x in H]
    wh = sum(w[j] * h[j] for j in range(3))
    M = [-k * (w[j] - wh * h[j]) for j in range(3)]
    return [((I[1] - I[2]) * w[1] * w[2] + M[0]) / I[0],
            ((I[2] - I[0]) * w[2] * w[0] + M[1]) / I[1],
            ((I[0] - I[1]) * w[0] * w[1] + M[2]) / I[2]]

def rk4_step(w, I, k, dt):
    a = deriv(w, I, k)
    b = deriv([w[j] + 0.5 * dt * a[j] for j in range(3)], I, k)
    c = deriv([w[j] + 0.5 * dt * b[j] for j in range(3)], I, k)
    d = deriv([w[j] + dt * c[j] for j in range(3)], I, k)
    return [w[j] + dt / 6 * (a[j] + 2 * b[j] + 2 * c[j] + d[j]) for j in range(3)]

def momentum(w, I):
    return math.sqrt(sum((I[j] * w[j]) ** 2 for j in range(3)))

def energy(w, I):
    return 0.5 * sum(I[j] * w[j] ** 2 for j in range(3))

I = [1.0, 2.0, 3.0]
w = [1.0, 0.01, 0.01]                       # spin about the minor axis
H0, T0 = momentum(w, I), energy(w, I)
for step in range(200000):                  # 2000 s at dt = 0.01
    w = rk4_step(w, I, 0.01, 0.01)
print('%.1e' % (momentum(w, I) / H0 - 1))   # -2.5e-12   -- |H| held
print('%.4f %.4f' % (energy(w, I) / T0, (H0**2 / (2 * I[2])) / T0))  # 0.3336 0.3336
print([round(x, 4) for x in w])             # [-0.0033, -0.0018, -0.3335]
```

::: example The unit body walks from its minor axis to its major axis
Run the code on the module's standard body, $\mathbf{I} = \mathrm{diag}(1, 2, 3)\,\mathrm{kg\,m^2}$. It starts at $\boldsymbol{\omega} = (1.0, 0.01, 0.01)\,\mathrm{rad/s}$ — a spin about the *minor* axis, the one lesson 7 called stable — with $k = 0.01\,\mathrm{N\,m\,s}$.

**The fixed quantities.** From $\mathbf{H} = (1.0,\ 0.02,\ 0.03)$, $H = \sqrt{1 + 0.0004 + 0.0009} = 1.00065\,\mathrm{N\,m\,s}$. It holds to $2.5\times 10^{-12}$. The starting energy is $T_0 = \tfrac{1}{2}(1\times 1^2 + 2\times 0.01^2 + 3\times 0.01^2) = 0.50025\,\mathrm{J}$. The limits it must stay between are $H^2/(2I_1) = 0.50065\,\mathrm{J}$ and $H^2/(2I_3) = 0.16688\,\mathrm{J}$. The start is a hair below the top, as a nearly pure minor-axis spin should be.

**The path.** For $300\,\mathrm{s}$ almost nothing shows: $\omega_1$ falls only from $1.0000$ to $0.9815\,\mathrm{rad/s}$, and $T$ from $0.50025$ to $0.48798\,\mathrm{J}$. But $T$ is falling, and once it has fallen far enough the change is quick. By $t = 600\,\mathrm{s}$ the rates are $(0.617, 0.310, 0.162)\,\mathrm{rad/s}$. At $t = 731\,\mathrm{s}$ the energy drops below $H^2/(2I_2) = 0.25033\,\mathrm{J}$ — the separatrix value of lesson 6 — and the state crosses from the family of polhodes around the minor axis to the family around the major axis. By $t = 800\,\mathrm{s}$ the rates are $(0.434, 0.085, -0.295)\,\mathrm{rad/s}$: the spin has moved from axis 1 over to axis 3.

**The end.** At $t = 2000\,\mathrm{s}$, $\boldsymbol{\omega} = (-0.0033, -0.0018, -0.3335)\,\mathrm{rad/s}$: a clean major-axis spin. Check it: $H/I_3 = 1.00065/3 = 0.33355\,\mathrm{rad/s}$, matching the third component to five figures. (It settled on the negative end; both ends are equally low, and the path decides which.) The final energy is $T/T_0 = 0.3336$, and the prediction $[H^2/(2I_3)]/T_0 = 0.16688/0.50025$ is $0.3336$ too. Two thirds of the energy became heat, and the spin rate fell by $I_1/I_3 = 1/3$.
:::

## How fast: the nutation time constant

Take the axisymmetric case, $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$, as most spinners nearly are. Let $\theta$ ("theta") be the **nutation angle** of lesson 6: the angle between the symmetry axis and the fixed $\mathbf{H}$.

**Energy as a function of one angle.** Split $\mathbf{H}$ into a part along the symmetry axis, $H_3 = H\cos\theta$, and a part across it, $H_t = H\sin\theta$. Each part has its own energy, $H_3^2/(2I_3)$ and $H_t^2/(2I_t)$:

$$
T = \frac{H_3^2}{2I_3} + \frac{H_t^2}{2I_t}
  = \frac{H^2}{2}\left(\frac{\cos^2\theta}{I_3} + \frac{\sin^2\theta}{I_t}\right).
$$

With $H$ fixed, $T$ depends on $\theta$ alone: one variable.

**Which way does $\theta$ move?** Differentiate with respect to $\theta$. The derivative of $\cos^2\theta$ is $-\sin 2\theta$ and of $\sin^2\theta$ is $+\sin 2\theta$, so

$$
\frac{dT}{d\theta} = \frac{H^2}{2}\sin 2\theta \left(\frac{1}{I_t} - \frac{1}{I_3}\right).
$$

For a **prolate** body ($I_3 < I_t$, the pencil), $1/I_t$ is smaller than $1/I_3$, so the bracket is negative: $T$ *falls* as $\theta$ grows. Losing energy pushes the nutation angle up, toward a flat spin at $\theta = 90^\circ$. For an **oblate** body ($I_3 > I_t$, the coin), the bracket is positive, and losing energy pushes $\theta$ down toward zero. The wobble dies out. Same physics, opposite result, decided by which side of $I_t$ the axial moment sits.

**How fast.** Use the chain rule, $\dot{T} = (dT/d\theta)\,\dot{\theta}$, so $\dot{\theta} = \dot{T}/(dT/d\theta)$. Write $\Delta = 1/I_t - 1/I_3$ for short ("delta"). For a small angle, $\sin 2\theta \approx 2\theta$, so the bottom is $H^2\theta\Delta$. For the top, the energy-sink model gives $\dot{T} = -k(\text{sideways part of }\boldsymbol{\omega})^2$, and for small $\theta$ that [[sideways part|small-angle-omega]] is about $H\theta\Delta$, so $\dot{T} = -kH^2\theta^2\Delta^2$. Divide:

$$
\dot{\theta} = \frac{-kH^2\theta^2\Delta^2}{H^2\theta\Delta} = -k\,\theta\,\Delta = k\,\theta\left(\frac{1}{I_3} - \frac{1}{I_t}\right)
= \frac{\theta}{\tau}, \qquad
\tau = \frac{I_3 I_t}{k\,(I_t - I_3)} .
$$

(The last step puts $1/I_3 - 1/I_t$ over a common denominator: $(I_t - I_3)/(I_3 I_t)$.)

$\dot{\theta} = \theta/\tau$ says the angle changes by the same fraction every second: exponentially, with **[[time constant|time-constant]]** $|\tau|$ ("tau"). And $H$ has dropped out. The time scale does not depend on how fast the body spins — only on its inertias and how lossy it is. Engineers call $|\tau|$ the **nutation time constant**. It is negative (the wobble decays) for an oblate body and positive (the wobble grows) for a prolate one.

::: key Nutation time constant of an axisymmetric body
For $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$ with a linear internal energy sink of coefficient $k$, the nutation angle obeys $\dot{\theta} = \theta/\tau$ with $\tau = I_3I_t/[k(I_t - I_3)]$. An oblate body ($I_3 > I_t$) has $\tau < 0$ and its wobble decays; a prolate body ($I_3 < I_t$) has $\tau > 0$ and its wobble grows exponentially into a flat spin. The time scale is independent of the spin rate.
:::

::: example A prolate upper stage goes into a flat spin
Take the spin-stabilized upper stage of lesson 6: a solid cylinder with $I_3 = 1000$ and $I_t = 2000\,\mathrm{kg\,m^2}$, spinning at $60\,\mathrm{rpm}$ ($n = 2\pi\,\mathrm{rad/s} = 6.283\,\mathrm{rad/s}$), with a sideways rate $\omega_t = 0.10\,\mathrm{rad/s}$ left over from separation. It is prolate, so it is spinning about its minor axis. Lesson 6 found $H = 6286\,\mathrm{N\,m\,s}$ and a nutation angle $\theta_0 = 1.82^\circ$. The starting energy is

$$
T_0 = \tfrac{1}{2}(1000\times 6.283^2 + 2000\times 0.10^2) = \tfrac{1}{2}(39{,}478 + 20) = 19{,}749\,\mathrm{J}.
$$

**Time constant.** Give it a lossy joint with $k = 20\,\mathrm{N\,m\,s}$:

$$
\tau = \frac{I_3I_t}{k(I_t - I_3)} = \frac{1000\times 2000}{20\times 1000} = \frac{2{,}000{,}000}{20{,}000} = 100\,\mathrm{s}.
$$

Positive, so the wobble grows. Integration agrees: $\theta$ reaches $3.00^\circ$ at $50\,\mathrm{s}$ (the formula $1.82^\circ\times e^{0.5}$ predicts $3.01^\circ$) and $4.95^\circ$ at $100\,\mathrm{s}$ (predicted $4.96^\circ$). The exponential estimate for reaching $45^\circ$ is $\tau\ln(45/1.82) = 100\times 3.21 = 321\,\mathrm{s}$. The simulation gets there at $345\,\mathrm{s}$ — a little later, because the small-angle shortcut is losing accuracy, as it must. By $600\,\mathrm{s}$ the stage is at $\theta = 85.5^\circ$ and still closing on $90^\circ$.

**End state.** The same $H$ is now carried about a transverse axis: $\omega = H/I_t = 6286/2000 = 3.143\,\mathrm{rad/s}$, which is $30.0\,\mathrm{rpm}$. The energy is $H^2/(2I_t) = 9880\,\mathrm{J}$ — exactly half of $T_0$, because $I_3/I_t = 1/2$. The simulation reads $0.5033\,T_0$ at $600\,\mathrm{s}$ and is still falling. Throughout, $\lVert\mathbf{H}\rVert = 6286.37\,\mathrm{N\,m\,s}$ holds to better than one part in $10^{12}$.

Spun at $60\,\mathrm{rpm}$ for steadiness, ten minutes later the stage is cartwheeling at $30\,\mathrm{rpm}$. So upper stages and spinning probes are designed oblate, carry active nutation control, or spin only for a short coast where the growth has no time to matter.
:::

## Explorer 1, and what it cost to learn

Explorer 1 stayed attached to the small solid motor of its rocket's fourth stage; together they came to about $14\,\mathrm{kg}$. Model the pair as a uniform cylinder with $m = 13.97\,\mathrm{kg}$, radius $R = 0.076\,\mathrm{m}$ and length $L = 2.03\,\mathrm{m}$. The table of lesson 2 gives

$$
I_3 = \tfrac{1}{2}mR^2 = 0.0403\,\mathrm{kg\,m^2}, \qquad
I_t = \tfrac{1}{12}m(3R^2 + L^2) = 4.82\,\mathrm{kg\,m^2}.
$$

Their ratio $I_t/I_3$ is $119$ — about as prolate as a spacecraft gets, and exactly the factor by which everything changes when it flips.

::: example Explorer 1's energy budget
**Start.** At $750\,\mathrm{rpm}$, $n = 750\times 2\pi/60 = 78.54\,\mathrm{rad/s}$. So

$$
H = I_3 n = 0.0403\times 78.54 = 3.17\,\mathrm{N\,m\,s}, \qquad T_0 = \tfrac{1}{2}I_3n^2 = \tfrac{1}{2}\times 0.0403\times 78.54^2 = 124\,\mathrm{J}.
$$

**After the flip.** The same $H$ is carried by the transverse moment: $\omega_f = H/I_t = 3.169/4.818 = 0.658\,\mathrm{rad/s}$, which is $0.658\times 60/(2\pi) = 6.3\,\mathrm{rpm}$. The energy is $T_f = H^2/(2I_t) = 1.04\,\mathrm{J}$. So the satellite lost $124 - 1 = 123\,\mathrm{J}$ — $99.2$ percent of its rotational energy — into the flexing of four wire antennas, and its spin rate fell by the factor $I_t/I_3 = 119$. Sanity check: the rate went from $750$ to $6.3\,\mathrm{rpm}$, and $750/6.3 \approx 119$.

**How long should it take?** Turn the time-constant formula around. Suppose the tumble grew from a wobble of about $1^\circ$ to a full flat spin in about three hours ($10{,}800\,\mathrm{s}$). Growing by a factor of $90$ takes $\ln 90 = 4.50$ time constants, so $\tau = 10{,}800/4.50 = 2400\,\mathrm{s}$. The loss coefficient that implies is

$$
k = \frac{I_3I_t}{\tau\,(I_t - I_3)} = \frac{0.0403\times 4.818}{2400\times 4.777} = 1.7\times 10^{-5}\,\mathrm{N\,m\,s} .
$$

That is tiny: a torque of $17\,\mathrm{\mu N\,m}$ (millionths of a newton meter) at $1\,\mathrm{rad/s}$ of sideways rate. Four springy wires whirling $12.5$ times a second supply it easily. The lesson is not that Explorer 1 was badly built, but that $\tau$ is inversely proportional to $k$: a *negligible* loss still gives a finite time constant, and a positive one makes the flat spin certain. Only the schedule was in doubt.
:::

::: key Explorer 1 and the origin of the major-axis rule
Explorer 1 (1958) was spun about its minor axis — its long, slender direction — and its flexible whip antennas dissipated energy. With $\lVert\mathbf{H}\rVert$ conserved and $T$ falling, the only possible end state was a spin about the axis of maximum inertia, and the satellite entered a flat spin within a few orbits. It was the first flight demonstration that a passively stabilized spacecraft must spin about its major axis.
:::

The explanation was published within months by [[two Stanford researchers|bracewell-garriott]].

## What dissipation does and does not change

Dissipation breaks the tie between the major and minor axes, and that is all it does. Three results are easy to blur, so take them one at a time.

**Minor-axis spin goes from stable to unstable.** For a rigid body it sits at the top of the energy range and nudges only make it wobble. Add any loss and it becomes the energy *maximum* of a system that only goes downhill: a marble on a hilltop. Its growth rate is $1/\tau$, set by the damping, not the spin rate. So here damping hurts.

**Major-axis spin goes from stable to asymptotically stable** — it now settles back, not just stays near. A rigid spinner keeps its wobble forever as a small polhode loop; a lossy one drives it to zero, since major-axis spin is the lowest energy at fixed $H$. Here damping helps, so engineers add it on purpose. An oblate spinner carries a **[[nutation damper|nutation-damper]]** — a tube of thick fluid or a mass on a spring — to shorten $|\tau|$. For an oblate body with $I_3 = 1500$, $I_t = 1000\,\mathrm{kg\,m^2}$ and $k = 20\,\mathrm{N\,m\,s}$, $\tau = 1500\times 1000/[20\times(1000 - 1500)] = -150\,\mathrm{s}$: the wobble shrinks by a factor of $e$ every $150\,\mathrm{s}$.

**The intermediate axis stays unstable.** It is unstable already, on lesson 7's time scale $1/\sigma$, normally far shorter than $|\tau|$. Damping only makes the tumble finally settle on the major axis instead of flipping forever.

::: warning The energy-sink torque is a stand-in, not a real torque
The model keeps $\lVert\mathbf{H}\rVert$ exactly constant, but it is written as an external torque, so in a simulation that also tracks attitude, the *direction* of $\mathbf{H}$ in space drifts slowly. A real internal damper holds that direction fixed too. The model is right for end state, energy budget and time constant, and wrong for the pointing history through the change. For that, give the damper its own moving part, as lesson 12 does.
:::

::: warning Integrator drift looks exactly like dissipation
A sloppy integrator also shows $T$ falling. First run with $k = 0$ and check that $T$ and $\lVert\mathbf{H}\rVert$ both hold to round-off. Then run with $k$ set and check that $\lVert\mathbf{H}\rVert$ *still* holds while $T$ falls. Real dissipation has that signature; numerical error spoils both.
:::

## Check yourself

::: check
A spacecraft has principal moments $I_1 = 400$, $I_2 = 900$ and $I_3 = 1000\,\mathrm{kg\,m^2}$ and spins about axis 1 at $0.50\,\mathrm{rad/s}$. It has an internal damper. What is its final spin rate, about which axis, and how much energy is lost?
:::

::: answer
The angular momentum is fixed at $H = I_1\omega_1 = 400\times 0.50 = 200\,\mathrm{N\,m\,s}$. The spin ends about axis 3, the major axis, at $\omega_f = H/I_3 = 200/1000 = 0.200\,\mathrm{rad/s}$.

The energies are $T_0 = H^2/(2I_1) = 40{,}000/800 = 50.0\,\mathrm{J}$ and $T_f = H^2/(2I_3) = 40{,}000/2000 = 20.0\,\mathrm{J}$. So $30.0\,\mathrm{J}$ is lost, a fraction $1 - I_1/I_3 = 1 - 0.4 = 0.60$. Check: $30/50 = 0.60$.

It turns more slowly, but it is no less "spun up" in the sense that matters for momentum: $H$ is unchanged.
:::

::: check
Your simulation of a damped body says $\lVert\mathbf{H}\rVert$ fell by $3$ percent over the run while $T$ fell by $40$ percent. Is that believable?
:::

::: answer
No. Internal dissipation cannot change $\lVert\mathbf{H}\rVert$ at all, so a three percent loss is a bug. There are two usual suspects.

One is the integrator: run again with the damping off, and if $\lVert\mathbf{H}\rVert$ still drifts, the integrator or step size is at fault. The other is a damping model not at right angles to $\mathbf{H}$, such as a plain $\mathbf{M} = -k\boldsymbol{\omega}$. That drains energy but also brakes the angular momentum, so it models outside drag, not an internal damper. The energy loss may be right; the momentum condemns the run.
:::

::: check
Two spinners have the same inertias, $I_3 = 1000$ and $I_t = 2000\,\mathrm{kg\,m^2}$, and the same damping coefficient. One spins at $10\,\mathrm{rpm}$ and the other at $100\,\mathrm{rpm}$. Which goes into a flat spin sooner?
:::

::: answer
Neither — they go on the same schedule. The time constant $\tau = I_3I_t/[k(I_t - I_3)]$ has no spin rate in it, and $\dot{\theta} = \theta/\tau$ is a statement about the *angle*, not the rate.

Spinning faster gives more resistance to an outside torque, and a bigger $H$ and $T$, but the fraction by which the nutation angle grows each second is unchanged. That is why "spin it faster" does not fix a prolate spinner.
:::

::: check
Using only $T$ and $H$, explain why a rigid body released about its minor axis stays there while a lossy one does not.
:::

::: answer
Both keep $\mathbf{H}$ fixed. The rigid body also keeps $T$ fixed, so its state is pinned to where the momentum sphere meets one energy ellipsoid: a single closed polhode, for a start near the minor axis a small loop around it. It cannot leave that curve, so the wobble stays small: stability.

The lossy body keeps the sphere but shrinks the ellipsoid, so it drifts through the polhodes toward smaller $T$. A minor-axis spin is the *maximum* of $T$ at fixed $H$, so every direction of drift leads away from it. The drift stops only at the minimum, $T = H^2/(2I_3)$, on the major axis.
:::

::: check
A satellite is a flat disc: $I_3 = 600\,\mathrm{kg\,m^2}$ about its symmetry axis and $I_t = 350\,\mathrm{kg\,m^2}$ across it. It spins about the symmetry axis with a $4^\circ$ nutation angle and carries a damper with $k = 1.2\,\mathrm{N\,m\,s}$. How long until the nutation is below $0.1^\circ$? What would change if it were a rod with the two moments swapped?
:::

::: answer
The disc is oblate ($I_3 > I_t$), so

$$
\tau = \frac{I_3I_t}{k(I_t - I_3)} = \frac{600\times 350}{1.2\times(350 - 600)} = \frac{210{,}000}{-300} = -700\,\mathrm{s}.
$$

Negative: the nutation decays with a time constant of $700\,\mathrm{s}$. Going from $4^\circ$ to $0.1^\circ$ is a factor of $40$, which takes $700\ln 40 = 700\times 3.689 = 2580\,\mathrm{s}$, about 43 minutes.

Swap the moments ($I_3 = 350$, $I_t = 600$) and the body is prolate: $\tau = 350\times 600/[1.2\times 250] = +700\,\mathrm{s}$. Now the same damper *grows* the nutation, from $4^\circ$ to $45^\circ$ in $700\ln(45/4) = 1700\,\mathrm{s}$. The end state is a flat spin at $H/600$ instead of a clean spin at $H/350$. Same damper, opposite outcome: the sign of $I_3 - I_t$ decides.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{M}_{\mathrm{ext}} = 0 \Rightarrow \mathbf{H}$ constant | Internal dissipation cannot change angular momentum, in size or direction |
| $\dot{T} \le 0$ | Internal dissipation only removes rotational kinetic energy |
| $T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = H^2/(2I)$ | Energy of a principal-axis spin at fixed $H$; smallest for the largest $I$ |
| $H^2/(2I_3) \le T \le H^2/(2I_1)$ | Energy range at fixed $H$; minor-axis spin is the maximum, major-axis the minimum |
| Major-axis rule | Dissipation drives the spin to the axis of maximum inertia and holds it there |
| $\Delta T = T_0(1 - I_1/I_3)$ | Energy shed in a minor-to-major change; final rate $H/I_3$ |
| $\mathbf{M} = -k[\boldsymbol{\omega} - \hat{\mathbf{h}}(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})]$ | Energy-sink model: $\mathbf{H}\cdot\mathbf{M} = 0$ exactly, $\dot{T} \le 0$ |
| $\tau = I_3I_t/[k(I_t - I_3)]$ | Nutation time constant; $\tau < 0$ (decay) if oblate, $\tau > 0$ (growth) if prolate; no spin rate in it |
| Explorer 1 | $I_3 = 0.0403$, $I_t = 4.82\,\mathrm{kg\,m^2}$; 750 rpm to 6.3 rpm, $124\,\mathrm{J}$ to $1.04\,\mathrm{J}$ |
| Unit body $\mathrm{diag}(1,2,3)$, $k = 0.01$ | Minor-axis start crosses the separatrix at $731\,\mathrm{s}$, settles at $0.334\,\mathrm{rad/s}$ on axis 3 |

Dissipation decides *which* steady spin a body ends on. The next lesson goes back to the motion itself: how fast a wobbling body's axis sweeps around $\mathbf{H}$ as seen from space, the sideways push a spinning body gives when you try to turn it, and the difference between nutation and forced precession.

::: context explorer-launch America's first satellite
Explorer 1 went up from Cape Canaveral, Florida, at 10:48 p.m. local time on January 31, 1958 — already February 1 in universal time. It came less than four months after the Soviet Union's Sputnik 1. The Jet Propulsion Laboratory (JPL) built the satellite and its upper stages, and the Army's rocket team supplied the Juno I booster.

The upper stages were spun to about $750\,\mathrm{rpm}$ to hold their direction during the burns. The instruments, designed by James Van Allen's group at the University of Iowa, made the first discovery of the space age: belts of trapped radiation around Earth, now called the Van Allen belts.
:::

::: context whip-antenna Thin, springy wires
A **whip antenna** is a thin, flexible rod or wire, like the tall antenna on an old car. Explorer 1 had four of them sticking out from its middle. On a spinning satellite, each one bends a little whenever the body wobbles, and springs back. No material is perfectly springy: every bend turns a tiny bit of motion into heat, the way a paper clip warms up if you bend it back and forth. That tiny, steady loss was enough to flip the satellite.

Any such loss works: a joint that rubs, propellant sliding in a tank, a bolt shifting in its hole. What matters is that the wobble itself drives it, so a body spinning cleanly loses nothing. The antennas were Explorer 1's bendiest parts, so they flexed most for each degree of wobble.
:::

::: context internal-pairs Why inside forces cannot spin you
Two parts inside a spacecraft push on each other with equal and opposite forces (blue and red), along the line joining them. About any point O, the two forces have the same lever arm $d$ — the distance from O to their shared line — but point in opposite directions, so their torques cancel exactly. Add up every pair and the total internal torque is zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="320" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <circle cx="110" cy="95" r="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="250" cy="65" r="14" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="124" y1="92" x2="170" y2="82.1" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="180,80 168,77.4 170.3,88.1" fill="#1d6fd1"/>
  <line x1="236" y1="68" x2="190" y2="77.9" stroke="#b4232c" stroke-width="3"/>
  <polygon points="180,80 191.7,72.2 189.4,82.9" fill="#b4232c"/>
  <circle cx="160" cy="150" r="4" fill="#1f2a44"/>
  <text x="150" y="165" font-size="12" fill="#1f2a44">O</text>
  <line x1="160" y1="150" x2="146.7" y2="87.6" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="128" font-size="12" fill="#1f2a44">d</text>
  <text x="95" y="72" font-size="12" fill="#1d6fd1">force on A</text>
  <text x="215" y="100" font-size="12" fill="#b4232c">force on B</text>
  <text x="104" y="99" font-size="12" fill="#1f2a44">A</text>
  <text x="244" y="69" font-size="12" fill="#1f2a44">B</text>
</svg>
```
:::

::: context shrinking-ellipsoid The ellipsoid shrinks, the sphere stays
A slice through lesson 6's picture for the unit body, in the plane of axes 1 and 3, with $H = 1$. The circle (black) is the momentum sphere; it never changes. Each energy ellipse has half-widths $\sqrt{2TI_1}$ and $\sqrt{2TI_3}$. At the highest energy, $T = H^2/(2I_1)$ (grey), it touches the circle only at the minor axis. As energy drains (blue), it shrinks until, at $T = H^2/(2I_3)$ (red), it touches only at the major axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="110" x2="280" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="4" x2="180" y2="216" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <ellipse cx="180" cy="110" rx="60" ry="103.9" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <ellipse cx="180" cy="110" rx="42.4" ry="73.5" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="180" cy="110" rx="34.6" ry="60" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="180" cy="110" r="60" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="284" y="114" font-size="12" fill="#1f2a44">axis 1 (minor)</text>
  <text x="186" y="14" font-size="12" fill="#1f2a44">axis 3 (major)</text>
  <text x="12" y="40" font-size="12" fill="#6c7a93">start: highest T</text>
  <text x="12" y="200" font-size="12" fill="#b4232c">end: lowest T</text>
  <text x="250" y="190" font-size="12" fill="#1f2a44">sphere, radius H</text>
</svg>
```
:::

::: context perp-part Splitting a vector in two
Any vector can be split into a part along a chosen direction and a part at right angles to it, like a shadow on the floor and the height above it. With a unit vector $\hat{\mathbf{h}}$, the "along" part of $\boldsymbol{\omega}$ is $(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})\,\hat{\mathbf{h}}$: its length along $\hat{\mathbf{h}}$, pointed along $\hat{\mathbf{h}}$. Subtract that from $\boldsymbol{\omega}$ and what is left is the sideways part. The two parts are at right angles, so by Pythagoras their squared lengths add up to $\lVert\boldsymbol{\omega}\rVert^2$.
:::

::: context small-angle-omega Where the sideways part comes from
For an axisymmetric body, $\omega_3 = H_3/I_3 = H\cos\theta/I_3$ and $\omega_t = H_t/I_t = H\sin\theta/I_t$. The direction of $\mathbf{H}$ makes angle $\theta$ with the axis. The part of $\boldsymbol{\omega}$ at right angles to $\mathbf{H}$ is then

$$
\omega_t\cos\theta - \omega_3\sin\theta = H\sin\theta\cos\theta\left(\frac{1}{I_t} - \frac{1}{I_3}\right).
$$

For small $\theta$, $\sin\theta \approx \theta$ and $\cos\theta \approx 1$, which leaves $H\theta\Delta$.
:::

::: context time-constant One time constant at a time
When a quantity changes at a rate proportional to itself, $\dot{x} = x/\tau$, the answer is $x = x_0\,e^{t/\tau}$. Each time constant $\tau$ multiplies it by $e \approx 2.718$. With $\tau$ negative it shrinks instead: each $|\tau|$ divides it by $e$, so after about $4.6$ time constants only one percent is left.

This curve is the prolate stage with $\tau = 100\,\mathrm{s}$: an exponential start, then leveling off as it nears the flat spin at $90^\circ$ (dashed).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="20" x2="40" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="36" x2="345" y2="36" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="34" y="40" font-size="11" text-anchor="end" fill="#b4232c">90°</text>
  <text x="34" y="112" font-size="11" text-anchor="end" fill="#1f2a44">45°</text>
  <text x="34" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0°</text>
  <text x="190" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">300 s</text>
  <text x="340" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">600 s</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,177.1 50.0,176.4 60.0,175.7 70.0,174.7 80.0,173.5 90.0,172.1 100.0,170.3 110.0,168.2 120.0,165.7 130.0,162.6 140.0,158.8 150.0,154.4 160.0,149.1 170.0,142.9 180.0,135.8 190.0,127.9 200.0,119.2 210.0,110.2 220.0,101.0 230.0,92.2 240.0,83.9 250.0,76.4 260.0,69.7 270.0,64.0 280.0,59.2 290.0,55.1 300.0,51.7 310.0,48.9 320.0,46.6 330.0,44.7 340.0,43.1"/>
  <text x="120" y="150" font-size="12" fill="#1d6fd1">nutation angle θ</text>
</svg>
```
:::

::: context bracewell-garriott Explained within months
In 1958 Ronald Bracewell and Owen Garriott, then at Stanford University, published a short paper in the journal *Nature* on the rotation of artificial satellites. They explained Explorer 1's tumble as energy loss in its flexible antennas driving the spin to the axis of greatest inertia — the argument of this lesson.

Owen Garriott later became a NASA astronaut and spent two months aboard the Skylab space station in 1973.
:::

::: context nutation-damper Built-in wobble killers
A **nutation damper** is a part added only to waste energy when the body wobbles. Common designs are a curved tube partly filled with a thick liquid, a ring of mercury or oil, or a small mass on a spring inside a fluid-filled can. When the body spins cleanly nothing moves inside, and nothing is lost. When it wobbles, the fluid or mass is shaken back and forth once per wobble cycle, and friction turns that motion into heat.

The same device on a prolate body would make things worse — which is exactly the lesson of Explorer 1.
:::
