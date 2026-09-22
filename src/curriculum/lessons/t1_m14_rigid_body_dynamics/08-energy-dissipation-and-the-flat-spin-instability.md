---
id: l08-energy-dissipation-and-the-flat-spin-instability
title: Energy dissipation and the flat-spin instability
minutes: 22
covers:
  - energy dissipation and the flat-spin instability
---

The previous lesson proved that a rigid body spins stably about its major axis and equally stably about its minor axis. On 1 February 1958 the United States put its first satellite into orbit spinning about its minor axis, and within a few hours it was tumbling. Explorer 1 was a pencil — 2.03 m long, 15.2 cm across — spun at about 750 rpm about its long axis for gyroscopic stiffness, exactly as a rifle bullet is. Telemetry showed that it had gone into a **flat spin**: rotating slowly end over end about an axis perpendicular to its length. The rigid-body theory used to design it said that was impossible.

The resolution is one sentence long. No spacecraft is rigid. Explorer 1 carried four flexible whip antennas, and a flexing antenna dissipates energy as heat. Internal dissipation cannot change the body's angular momentum — nothing internal can — but it steadily removes rotational kinetic energy. At fixed angular momentum, the lowest-energy rotation is a spin about the axis of *largest* inertia, so that is where the motion ends up. For a long, thin body that means a flat spin.

This lesson makes that argument precise: why $\lVert\mathbf{H}\rVert$ is untouchable and $T$ is not, what the energy of a spin at fixed momentum is, and how to get a time constant out of a small energy-sink model you can integrate alongside Euler's equations. The result — the **major-axis rule** — is the most consequential piece of engineering guidance in this module: every passively spin-stabilised spacecraft ever flown has been a major-axis spinner.

## Internal dissipation at constant angular momentum

Take the spacecraft to be a closed system with no external torque: a body plus whatever moves inside it — flexing antennas, propellant in a tank, a ball rolling in an oil-filled tube. The total angular momentum about the centre of mass obeys

$$
\frac{d\mathbf{H}}{dt}\bigg|_N = \mathbf{M}_{\mathrm{ext}} = 0 ,
$$

so $\mathbf{H}$ is constant in inertial space, in direction and magnitude, whatever the internal parts do: internal forces come in equal and opposite pairs along the line between the two masses, so their moments cancel exactly. A damper can shuffle momentum between the structure and the fluid inside it, but the sum never moves.

Energy is different. The total energy of the closed system is conserved too, but not the *rotational kinetic energy of the bulk motion*. Flexing a boom converts some of it into strain energy, and internal friction converts that into heat. Either way it has left the rotational bookkeeping. So the constraint is:

> Under zero external torque, $\lVert\mathbf{H}\rVert$ is exactly constant and $T$ can only decrease.

That asymmetry is the whole of the flat-spin instability. Lesson 6 built a picture from the pair $(H^2, T)$: the body-frame angular momentum lives on the intersection of a sphere of radius $H$ and an ellipsoid set by $T$. Freeze the sphere and shrink the ellipsoid, and the motion is no longer confined to one closed polhode — it drifts from one to the next, always toward smaller $T$, spiralling across the sphere until $T$ is as small as it can be for that $H$.

## The energy of a spin at fixed momentum

Where is that point? For a pure spin about principal axis $k$ with moment $I_k$, the angular momentum is $H = I_k\omega_k$ and the kinetic energy is

$$
T = \tfrac{1}{2}I_k\omega_k^2 = \frac{H^2}{2I_k} .
$$

At a given $H$ this decreases with $I_k$: of the three pure spins available, the one about the largest moment has the least energy and the one about the smallest the most. For general, non-principal motion the same conclusion follows from lesson 6's inequality $2TI_1 \le H^2 \le 2TI_3$, read the other way round:

$$
\frac{H^2}{2I_3} \le T \le \frac{H^2}{2I_1} .
$$

The lower bound is attained only by a pure major-axis spin and the upper bound only by a pure minor-axis spin. Since dissipation drives $T$ down and $T$ cannot go below $H^2/(2I_3)$, the motion must approach a spin about the major axis. There is nowhere else for it to go.

::: key The major-axis rule
With $\mathbf{H}$ fixed, the kinetic energy of a spin about a principal axis is $T = H^2/(2I)$, which is minimised by the *largest* $I$. Internal energy dissipation drives $T$ monotonically down toward that minimum, so the spin migrates to the major axis and stays there. A passively stabilised spinner must be a major-axis spinner.
:::

The energy available to be dissipated is worth naming, because it sets how violent the transition is. Starting from a minor-axis spin and ending on the major axis, the body sheds

$$
\Delta T = \frac{H^2}{2I_1} - \frac{H^2}{2I_3} = \frac{H^2}{2I_1}\left(1 - \frac{I_1}{I_3}\right) = T_0\left(1 - \frac{I_1}{I_3}\right),
$$

a fraction $1 - I_1/I_3$ of what it started with. For a slender body, where $I_1/I_3$ is a per cent or two, essentially all of the rotational kinetic energy is destroyed, and the final spin rate $H/I_3$ is smaller than the initial $H/I_1$ by the same ratio. The body ends up rotating far more slowly, about a different axis, having converted the difference into heat in its own structure.

::: warning Nothing internal can change the angular momentum
The most common wrong intuition is that a damper "takes momentum out" of the spin. It does not. Dampers, wheels, flexing structure, moving crew — all are internal, and internal forces and torques cancel in pairs. Only an external torque changes $\mathbf{H}$. What a damper changes is how that fixed $\mathbf{H}$ is distributed among the body's axes, and the direction it pushes that redistribution is always downhill in $T$. If a simulation shows $\lVert\mathbf{H}\rVert$ falling while the only modelled effect is internal damping, the model is wrong.
:::

## A model energy sink you can integrate

The argument above says where the motion ends, not how it gets there or how long it takes. For that the dissipation has to be in the equations of motion. Modelling a real damper means adding degrees of freedom — a sprung mass, a fluid ring, a flexible appendage — and lesson 12 does that. A much simpler device captures the essential behaviour.

Write the body-frame unit vector along the angular momentum as

$$
\hat{\mathbf{h}} = \frac{\mathbf{I}\boldsymbol{\omega}}{\lVert\mathbf{I}\boldsymbol{\omega}\rVert} ,
$$

and apply the torque

$$
\mathbf{M} = -k\left[\boldsymbol{\omega} - \hat{\mathbf{h}}\,(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})\right],
\qquad k > 0 .
$$

The bracket is the component of $\boldsymbol{\omega}$ perpendicular to $\mathbf{H}$, so the torque damps the part of the rotation not aligned with the angular momentum and vanishes at a pure principal-axis spin. The constant $k$ has units of $\mathrm{N\,m\,s}$: torque per unit angular rate.

Two properties make it the right stand-in. First, it does not change $\lVert\mathbf{H}\rVert$. From lesson 5, $\tfrac{d}{dt}\tfrac{1}{2}H^2 = \mathbf{H}\cdot\mathbf{M}$, and

$$
\mathbf{H}\cdot\mathbf{M} = -k\left[\mathbf{H}\cdot\boldsymbol{\omega} - (\mathbf{H}\cdot\hat{\mathbf{h}})(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})\right]
= -k\left[\mathbf{H}\cdot\boldsymbol{\omega} - H\,\frac{\mathbf{H}\cdot\boldsymbol{\omega}}{H}\right] = 0 ,
$$

exactly, for every state. Second, it removes energy and never adds any. Again from lesson 5, $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$, and

$$
\dot{T} = -k\left[\lVert\boldsymbol{\omega}\rVert^2 - (\boldsymbol{\omega}\cdot\hat{\mathbf{h}})^2\right] \le 0 ,
$$

because the bracket is the squared length of the component of $\boldsymbol{\omega}$ perpendicular to a unit vector, zero only when $\boldsymbol{\omega}$ lies along $\mathbf{H}$. The model reproduces the two facts the physics demands — constant $\lVert\mathbf{H}\rVert$, monotonically falling $T$ — in three lines of code.

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
print('%.4f %.4f' % (energy(w, I) / T0, (H0**2 / (2 * I[2])) / T0))
print([round(x, 4) for x in w])
```

::: example The unit body walks from its minor axis to its major axis
Run the code above on the module's standard test case, $\mathbf{I} = \mathrm{diag}(1, 2, 3)\,\mathrm{kg\,m^2}$, released at $\boldsymbol{\omega} = (1.0, 0.01, 0.01)\,\mathrm{rad/s}$ — a spin about the *minor* axis, the one lesson 7 called stable — with $k = 0.01\,\mathrm{N\,m\,s}$.

The invariants first. $H = \sqrt{1^2(1.0)^2 + 2^2(0.01)^2 + 3^2(0.01)^2} = 1.00065\,\mathrm{N\,m\,s}$, and it holds to $2.5\times 10^{-12}$ over the whole run. The energy starts at $T_0 = 0.50025\,\mathrm{J}$, and the bounds it must stay between are $H^2/(2I_1) = 0.50065\,\mathrm{J}$ and $H^2/(2I_3) = 0.16688\,\mathrm{J}$. The release is a hair below the upper bound, as a near-pure minor-axis spin should be.

Now the path. For the first 300 s almost nothing visible happens: $\omega_1$ falls only from $1.0000$ to $0.9815\,\mathrm{rad/s}$ and $T$ from $0.50025$ to $0.48798\,\mathrm{J}$. The body is still, to the eye, a minor-axis spinner. But $T$ is falling, and once it has fallen far enough the transition is fast. By $t = 600\,\mathrm{s}$ the rates are $(0.617, 0.310, 0.162)\,\mathrm{rad/s}$; at $t = 731\,\mathrm{s}$ the energy drops below $H^2/(2I_2) = 0.25033\,\mathrm{J}$, the separatrix value of lesson 6, and the state crosses from the minor-axis family of polhodes to the major-axis family; by $t = 800\,\mathrm{s}$ the rates are $(0.434, 0.085, -0.295)\,\mathrm{rad/s}$, the spin having moved bodily from axis 1 to axis 3.

The end state is a clean major-axis spin. At $t = 2000\,\mathrm{s}$, $\boldsymbol{\omega} = (-0.0033, -0.0018, -0.3335)\,\mathrm{rad/s}$, and $H/I_3 = 1.00065/3 = 0.33355\,\mathrm{rad/s}$ matches the third component to five figures. (It settled on the negative pole; both poles are equally good minima and which one is reached depends on the path.) The final energy ratio is $T/T_0 = 0.3336$, and the predicted ratio $[H^2/(2I_3)]/T_0$ is $0.3336$. Two thirds of the rotational kinetic energy went into heat, and the spin rate fell by the inertia ratio $I_1/I_3 = 1/3$.
:::

## How fast: the nutation time constant

Take the axisymmetric case, $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$: it gives a closed-form answer, and spinners are built nearly axisymmetric. Let $\theta$ be the nutation angle of lesson 6, the angle between the symmetry axis and the fixed $\mathbf{H}$. Resolve $\mathbf{H}$ into axial and transverse parts, $H_3 = H\cos\theta$ and $H_t = H\sin\theta$:

$$
T = \frac{H_3^2}{2I_3} + \frac{H_t^2}{2I_t}
  = \frac{H^2}{2}\left(\frac{\cos^2\theta}{I_3} + \frac{\sin^2\theta}{I_t}\right).
$$

At fixed $H$ this is a function of $\theta$ alone, so the whole dissipation problem reduces to one variable. Differentiate:

$$
\frac{dT}{d\theta} = \frac{H^2}{2}\sin 2\theta \left(\frac{1}{I_t} - \frac{1}{I_3}\right).
$$

For a **prolate** body ($I_3 < I_t$, the pencil) the bracket is negative, so $T$ decreases as $\theta$ grows: dissipation pushes the nutation angle *up*, toward the flat spin at $\theta = 90^\circ$. For an **oblate** body ($I_3 > I_t$, the disc) the bracket is positive and dissipation pushes $\theta$ *down* toward zero, so the wobble damps out and the spin settles onto the symmetry axis. Same physics, opposite consequence, decided by which side of $I_t$ the axial moment sits on.

The rate follows from $\dot{\theta} = \dot{T}/(dT/d\theta)$. Put the energy-sink model into the numerator and expand both for small $\theta$. With $\Delta = 1/I_t - 1/I_3$, the numerator is $\dot{T} = -kH^2\theta^2\Delta^2$ and the denominator $H^2\theta\Delta$, so

$$
\dot{\theta} = -k\,\theta\,\Delta = k\,\theta\left(\frac{1}{I_3} - \frac{1}{I_t}\right)
= \frac{\theta}{\tau}, \qquad
\tau = \frac{I_3 I_t}{k\,(I_t - I_3)} .
$$

The nutation angle grows or decays exponentially with time constant $|\tau|$, and $H$ has dropped out: the time scale does not depend on how fast the body spins, only on its inertias and on how lossy it is. Engineers call $|\tau|$ the **nutation time constant**; it is negative — damping — for an oblate body and positive — divergence — for a prolate one.

::: key Nutation time constant of an axisymmetric body
For $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$ with a linear internal energy sink of coefficient $k$, the nutation angle obeys $\dot{\theta} = \theta/\tau$ with $\tau = I_3I_t/[k(I_t - I_3)]$. An oblate body ($I_3 > I_t$) has $\tau < 0$ and its wobble decays; a prolate body ($I_3 < I_t$) has $\tau > 0$ and its wobble grows exponentially into a flat spin. The time scale is independent of the spin rate.
:::

::: example A prolate upper stage acquires a flat spin
The spin-stabilised stage of lesson 6 — a solid cylinder, $I_3 = 1000$ and $I_t = 2000\,\mathrm{kg\,m^2}$, spinning at $60\,\mathrm{rpm}$ ($n = 6.283\,\mathrm{rad/s}$) with a tip-off transverse rate $\omega_t = 0.10\,\mathrm{rad/s}$ — is prolate, so it is spinning about its minor axis. Lesson 6 found $H = 6286\,\mathrm{N\,m\,s}$ and a nutation angle $\theta_0 = 1.82^\circ$. The initial energy is $T_0 = \tfrac{1}{2}(1000\times 6.283^2 + 2000\times 0.10^2) = 19{,}749\,\mathrm{J}$.

Give it a lossy joint with $k = 20\,\mathrm{N\,m\,s}$. Then $\tau = I_3I_t/[k(I_t - I_3)] = 1000\times 2000/(20\times 1000) = 100\,\mathrm{s}$. Integration with the model above confirms it: $\theta$ reaches $3.00^\circ$ at $50\,\mathrm{s}$ against a prediction of $3.01^\circ$, and $4.95^\circ$ at $100\,\mathrm{s}$ against $4.96^\circ$. The exponential estimate for $45^\circ$ is $\tau\ln(45/1.82) = 321\,\mathrm{s}$; the simulation gets there at $345\,\mathrm{s}$, the small-angle expansion having started to lose accuracy, as it must. By $600\,\mathrm{s}$ the body is at $\theta = 85.5^\circ$ and still closing on $90^\circ$.

The end state: $\omega = H/I_t = 6286/2000 = 3.143\,\mathrm{rad/s}$, that is $30.0\,\mathrm{rpm}$, about a transverse axis. The energy is $H^2/(2I_t) = 9880\,\mathrm{J}$, exactly half of $T_0$ because $I_3/I_t = 1/2$; the simulation reads $0.5033$ of $T_0$ at $600\,\mathrm{s}$ and is still falling. Throughout, $\lVert\mathbf{H}\rVert = 6286.37\,\mathrm{N\,m\,s}$ holds to six parts in $10^{12}$.

Read the practical message: the stage was released spinning at 60 rpm about its long axis for pointing stiffness, and ten minutes later it is cartwheeling at 30 rpm, with its payload pointing somewhere new every second. This is why upper stages and spin-stabilised probes are designed to be oblate, or are actively nutation-controlled, or are spun up only for the short coast where the growth has no time to matter.
:::

## Explorer 1, and what it cost to learn

Explorer 1 was built at the Jet Propulsion Laboratory around a Redstone-derived fourth stage. Satellite plus burnt-out stage came to about $14\,\mathrm{kg}$, $2.03\,\mathrm{m}$ long and $0.152\,\mathrm{m}$ across, and the upper cluster was spun on the launcher to about $750\,\mathrm{rpm}$ to hold its orientation through the burn. Four flexible whip antennas radiated the telemetry. Model it as a uniform cylinder: with $m = 13.97\,\mathrm{kg}$, $R = 0.076\,\mathrm{m}$ and $L = 2.03\,\mathrm{m}$, the table of lesson 2 gives

$$
I_3 = \tfrac{1}{2}mR^2 = 0.0403\,\mathrm{kg\,m^2}, \qquad
I_t = \tfrac{1}{12}m(3R^2 + L^2) = 4.82\,\mathrm{kg\,m^2},
$$

a ratio of 119 — about as prolate as a spacecraft gets, and exactly the factor by which everything changes when it flips.

::: example Explorer 1's energy budget
At $750\,\mathrm{rpm}$, $n = 78.54\,\mathrm{rad/s}$, so $H = I_3 n = 0.0403\times 78.54 = 3.17\,\mathrm{N\,m\,s}$ and $T_0 = \tfrac{1}{2}I_3n^2 = 124\,\mathrm{J}$.

After the flip, the same $H$ is carried by the transverse moment: $\omega_f = H/I_t = 3.169/4.818 = 0.658\,\mathrm{rad/s}$, which is $6.3\,\mathrm{rpm}$. The energy is $T_f = H^2/(2I_t) = 1.04\,\mathrm{J}$. The satellite dissipated $123\,\mathrm{J}$ — $99.2$ per cent of its rotational kinetic energy — into the flexing of four wire antennas, and its spin rate fell by the factor $I_t/I_3 = 119$.

How long should it have taken? Invert the nutation time constant. If the tumble developed from a tip-off of order $1^\circ$ to a full flat spin in about three hours, then $\tau = 10{,}800/\ln(90/1) = 2400\,\mathrm{s}$, and the implied loss coefficient is

$$
k = \frac{I_3I_t}{\tau\,(I_t - I_3)} = \frac{0.0403\times 4.818}{2400\times 4.777} = 1.7\times 10^{-5}\,\mathrm{N\,m\,s} .
$$

That is a minute amount of damping — a torque of $17\,\mathrm{\mu N\,m}$ at $1\,\mathrm{rad/s}$ of transverse rate. Four springy wires waving at 12.5 revolutions per second supply it easily. The point is not that Explorer 1 was badly built. It is that $\tau$ is inversely proportional to $k$, so a *negligible* loss mechanism still gives a finite time constant — and a positive time constant makes the flat spin certain. Only the schedule was in question.
:::

::: key Explorer 1 and the origin of the major-axis rule
Explorer 1 (1958) was spun about its minor axis — its long, slender direction — and its flexible whip antennas dissipated energy. With $\lVert\mathbf{H}\rVert$ conserved and $T$ falling, the only possible end state was a spin about the axis of maximum inertia, and the satellite entered a flat spin within a few orbits. It was the first flight demonstration that a passively stabilised spacecraft must spin about its major axis.
:::

## What dissipation does and does not change

Dissipation breaks the major–minor symmetry of the intermediate axis theorem, and that is all it does. Three consequences are easy to run together, so state them separately.

**Minor-axis spin goes from stable to unstable.** For a rigid body it sits at the top of the energy range and small perturbations merely oscillate. Add any loss and it becomes the energetic maximum of a system that only goes downhill: an unstable equilibrium, with growth rate $1/\tau$ set by the damping rather than by the spin rate. This reverses the usual intuition that damping helps.

**Major-axis spin goes from stable to asymptotically stable.** A disturbed rigid spinner keeps its perturbation forever as a bounded polhode loop; a dissipative one drives that loop to zero, since major-axis spin is the strict energy minimum at fixed $H$. Damping is now a benefit, and it is deliberately added: an oblate spinner carries a **nutation damper**, a tube of viscous fluid or a spring-mounted mass, precisely to shorten $|\tau|$. For an oblate body with $I_3 = 1500$, $I_t = 1000\,\mathrm{kg\,m^2}$ and $k = 20\,\mathrm{N\,m\,s}$, $\tau = -150\,\mathrm{s}$: a wobble decays by $1/e$ every $150\,\mathrm{s}$.

**The intermediate axis stays unstable.** It is unstable already, on the rigid-body time scale $\sigma^{-1}$ of lesson 7, normally far shorter than $|\tau|$. Adding damping only means the resulting tumble eventually settles on the major axis instead of flipping periodically forever.

::: warning The energy-sink torque is a stand-in, not a real torque
The model conserves $\lVert\mathbf{H}\rVert$ exactly, which is what the physics needs, but it is written as an external torque, so in a simulation that also propagates attitude the inertial *direction* of $\mathbf{H}$ drifts slowly. A true internal damper holds that direction fixed too. The model is right for the questions this lesson asks — end state, energy budget, time constant — and wrong if you need the inertial pointing history through the transition. For that, give the damper its own degree of freedom, as lesson 12 does.
:::

::: warning Integrator drift looks exactly like dissipation
A sloppy integrator also shows $T$ falling. Before reading any energy history as physics, rerun the same initial condition with $k = 0$ and confirm $T$ and $\lVert\mathbf{H}\rVert$ hold to round-off; then rerun with $k$ set and confirm $\lVert\mathbf{H}\rVert$ *still* holds while $T$ falls. Physical dissipation has that signature; numerical error degrades both.
:::

::: note Why the antennas, and not the structure
Any hysteretic loss works — structural damping in a joint, eddy currents in a conducting shell moving through the geomagnetic field, propellant sliding in a tank, a bolt shifting in its hole. What matters is that the loss is driven by the periodic strain nutation produces, so a body with no nutation has no loss. Explorer 1's antennas were by far its most compliant parts, so they flexed most per degree of nutation angle.
:::

## Check yourself

::: check
A spacecraft has principal moments $I_1 = 400$, $I_2 = 900$, $I_3 = 1000\,\mathrm{kg\,m^2}$ and is spinning about axis 1 at $0.50\,\mathrm{rad/s}$. It has an internal damper. What is its final spin rate, about which axis, and how much energy is dissipated?
:::

::: answer
$H = I_1\omega_1 = 400\times 0.50 = 200\,\mathrm{N\,m\,s}$, fixed. The final state is a spin about axis 3, the major axis, at $\omega_f = H/I_3 = 200/1000 = 0.200\,\mathrm{rad/s}$. The energies are $T_0 = H^2/(2I_1) = 40{,}000/800 = 50.0\,\mathrm{J}$ and $T_f = H^2/(2I_3) = 40{,}000/2000 = 20.0\,\mathrm{J}$, so $30.0\,\mathrm{J}$ is dissipated, a fraction $1 - I_1/I_3 = 0.60$. Note that the spacecraft ends up rotating more slowly but is no less "spun up" in the sense that matters for momentum: $H$ is unchanged.
:::

::: check
Your simulation of a damped body reports that $\lVert\mathbf{H}\rVert$ has fallen by $3$ per cent over the run while $T$ fell by $40$ per cent. Is this a plausible result?
:::

::: answer
No. Internal dissipation cannot change $\lVert\mathbf{H}\rVert$ at all, so a three per cent loss is a bug. Two candidates: an integrator that is not conserving (rerun with the damping off — if $\lVert\mathbf{H}\rVert$ still drifts, it is the integrator or the step size), or a damping model that is not orthogonal to $\mathbf{H}$, such as a plain $\mathbf{M} = -k\boldsymbol{\omega}$, which is a fine energy sink but also a brake on angular momentum and so models external drag, not an internal damper. The energy loss may well be right; it is the momentum that condemns the run.
:::

::: check
Two spinners have the same inertias, $I_3 = 1000$ and $I_t = 2000\,\mathrm{kg\,m^2}$, and the same damping coefficient, but one spins at $10\,\mathrm{rpm}$ and the other at $100\,\mathrm{rpm}$. Which develops a flat spin sooner?
:::

::: answer
Neither — they diverge on the same schedule. The time constant $\tau = I_3I_t/[k(I_t - I_3)]$ contains no spin rate, and the small-angle equation $\dot{\theta} = \theta/\tau$ is a statement about the *angle*, not about the rate. Spinning faster gives more gyroscopic stiffness against an applied torque, and it gives a larger $H$ and a larger $T$, but the fractional rate at which the nutation angle grows is unchanged. This is the counter-intuitive part of the result and the reason "spin it faster" is not a fix for a prolate spinner.
:::

::: check
Explain, using $T$ and $H$ only, why a rigid body released about its minor axis stays there while a dissipative one does not.
:::

::: answer
Both conserve $\mathbf{H}$. The rigid body also conserves $T$ exactly, so its state is pinned to the intersection of the momentum sphere and one fixed energy ellipsoid — a single closed polhode, for a near-minor-axis release a small loop around the minor axis. It cannot leave that curve, so the perturbation stays bounded: stability. The dissipative body keeps the sphere but shrinks the ellipsoid, so it is confined to no one polhode and drifts through the family toward smaller $T$. A minor-axis spin is the *maximum* of $T$ at fixed $H$, so every direction of drift leads away from it, and the drift stops only at the minimum $T = H^2/(2I_3)$, on the major axis.
:::

::: check
A satellite is a flat disc: $I_3 = 600\,\mathrm{kg\,m^2}$ about the symmetry axis and $I_t = 350\,\mathrm{kg\,m^2}$ transverse. It spins about its symmetry axis with a $4^\circ$ nutation angle and carries a damper with $k = 1.2\,\mathrm{N\,m\,s}$. How long until the nutation is below $0.1^\circ$, and what would change if the disc were replaced by a rod with the same two numbers exchanged?
:::

::: answer
The body is oblate, $I_3 > I_t$, so $\tau = I_3I_t/[k(I_t - I_3)] = 600\times 350/[1.2\times(350 - 600)] = 210{,}000/(-300) = -700\,\mathrm{s}$: the nutation decays with a time constant of $700\,\mathrm{s}$. Going from $4^\circ$ to $0.1^\circ$ takes $700\ln(4/0.1) = 700\times 3.689 = 2580\,\mathrm{s}$, about 43 minutes. With the moments exchanged ($I_3 = 350$, $I_t = 600$) the body is prolate and $\tau = 350\times 600/[1.2\times 250] = +700\,\mathrm{s}$: the same damper now *grows* the nutation, from $4^\circ$ to $45^\circ$ in $700\ln(45/4) = 1700\,\mathrm{s}$, and the end state is a flat spin at $H/600$ instead of a clean spin at $H/350$. Identical hardware, identical damper, opposite outcome — the sign of $I_3 - I_t$ decides.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{M}_{\mathrm{ext}} = 0 \Rightarrow \mathbf{H}$ constant | Internal dissipation cannot change angular momentum, in magnitude or direction |
| $\dot{T} \le 0$ | Internal dissipation removes rotational kinetic energy only |
| $T = H^2/(2I)$ | Energy of a principal-axis spin at fixed $H$; smallest for the largest $I$ |
| $H^2/(2I_3) \le T \le H^2/(2I_1)$ | Energy range at fixed $H$; minor-axis spin is the maximum, major-axis the minimum |
| Major-axis rule | Dissipation drives the spin to the axis of maximum inertia and holds it there |
| $\Delta T = T_0(1 - I_1/I_3)$ | Energy shed in a minor-to-major transition; final rate $H/I_3$ |
| $\mathbf{M} = -k[\boldsymbol{\omega} - \hat{\mathbf{h}}(\boldsymbol{\omega}\cdot\hat{\mathbf{h}})]$ | Energy-sink model: $\mathbf{H}\cdot\mathbf{M} = 0$ exactly, $\dot{T} \le 0$ |
| $\tau = I_3I_t/[k(I_t - I_3)]$ | Nutation time constant; $\tau < 0$ (damping) if oblate, $\tau > 0$ (divergence) if prolate, independent of spin rate |
| Explorer 1 | $I_3 = 0.0403$, $I_t = 4.82\,\mathrm{kg\,m^2}$; 750 rpm to 6.3 rpm, $124\,\mathrm{J}$ to $1.04\,\mathrm{J}$ |
| Unit body $\mathrm{diag}(1,2,3)$, $k = 0.01$ | Minor-axis release crosses the separatrix at $731\,\mathrm{s}$, settles at $0.334\,\mathrm{rad/s}$ on axis 3 |

Dissipation decides *which* steady spin a body ends on. The next lesson returns to the motion itself and works out the inertial picture — the rate at which a nutating body's axis sweeps around $\mathbf{H}$, the gyroscopic torque a spinning body exerts when you try to turn it, and the distinction between nutation and forced precession.
