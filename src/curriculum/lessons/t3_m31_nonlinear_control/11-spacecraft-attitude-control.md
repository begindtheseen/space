---
id: l11-spacecraft-attitude-control
title: 'Nonlinear spacecraft attitude control: unwinding, MRPs, and tracking'
minutes: 34
covers:
  - 'Nonlinear spacecraft attitude control: quaternion feedback laws, the unwinding problem, MRP-based control, Lyapunov-derived tracking laws with proof'
---

The Lyapunov lesson proved the quaternion feedback law stable and then, in its closing section, admitted something it had not fixed: the proof certified convergence to *one* of two points, and the other is the same physical attitude wearing a different sign. The backstepping lesson built a second law on the identical geometry without touching the question either. This lesson is where the module stops deferring it. You will pin the unwinding problem to a number — a vehicle that rotates most of the way around to correct an error of a few degrees — fix it with one sign, watch the same disease and the same cure show up in a completely different three-parameter representation, and then extend everything from steering to a fixed target to tracking one that moves.

This is the spacecraft attitude material an interviewer reaches for first, because it rewards exactly the kind of thinking this module has been building: a real proof, a real failure mode found *inside* that proof rather than outside it, and a fix that is one line of code once you understand why the vehicle needed it. The attitude kinematics prerequisite gave you quaternions, modified Rodrigues parameters, and the kinematic differential equations for both; this lesson is where that machinery earns its keep.

Four pieces, in order. First, restate the quaternion law precisely enough to ask an exact question: which of the two equilibria, and does the path matter even when the endpoint is fine? Second, answer it numerically and fix it. Third, do the same analysis for MRPs, a representation with no redundant fourth component and, it turns out, no escape from the same obstruction. Fourth, extend the regulation proof to tracking a moving reference, with the full nonlinear law and a complete Lyapunov argument. Underneath all four is one topological fact worth knowing by name: no continuous, time-invariant state feedback can globally asymptotically stabilize an attitude on $SO(3)$, because $SO(3)$ is not contractible. Two lessons ago that was an abstract warning. By the end of this one it is a concrete design decision you have made twice, in two different coordinates.

## The quaternion law, and the question its own proof leaves open

Recall the setup exactly as the Lyapunov lesson left it. A rigid body $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}$, an attitude error quaternion $\mathbf{q} = (q_0, \mathbf{q}_v)$ with $\mathbf{q} = (1,\mathbf{0})$ meaning zero error, kinematics $\dot{q}_0 = -\tfrac12\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, $\dot{\mathbf{q}}_v = \tfrac12(q_0\boldsymbol{\omega}+\mathbf{q}_v\times\boldsymbol{\omega})$, and the law $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$. With $V = \tfrac12\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1-q_0)$, that lesson proved $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0$ and, by LaSalle, that every trajectory converges to

$$
M = \{\boldsymbol{\omega} = \mathbf{0},\ \mathbf{q}_v = \mathbf{0}\} = \{(\mathbf{0}, q_0{=}1)\} \ \cup\ \{(\mathbf{0}, q_0{=}-1)\} .
$$

Two points, both genuine equilibria of the closed loop, and — because a unit quaternion and its negative describe the same rotation — the *same physical attitude*. That is a fact about quaternions, not about this law: for a principal rotation of angle $\Phi$ about $\hat{\mathbf{n}}$, $q_0 = \cos(\Phi/2)$ and $\mathbf{q}_v = \hat{\mathbf{n}}\sin(\Phi/2)$, and replacing $\Phi$ with $\Phi + 360^\circ$ flips the sign of both $\cos$ and $\sin$ of the half-angle, so $(q_0,\mathbf{q}_v)$ and $(-q_0,-\mathbf{q}_v)$ sit on the unit sphere $360^\circ$ apart in this parameter but describe an identical orientation. Every attitude has exactly two quaternion labels. The controller was never told that.

That raises a question the proof does not answer: given that the vehicle always ends up correctly pointed, does *how it gets there* depend on which of the two labels the attitude estimator happened to hand the controller? The answer is yes, and the gap between the two answers is not a rounding error.

## The unwinding problem, made concrete

Take a physical attitude error of $5^\circ$ about $\hat{\mathbf{x}}$ — a small, unremarkable pointing error, the kind a star tracker update corrects routinely. It has exactly two quaternion labels:

$$
\mathbf{q}_{\text{short}} = (0.999048,\ 0.043619,\ 0,\ 0), \qquad \mathbf{q}_{\text{long}} = -\mathbf{q}_{\text{short}} = (-0.999048,\ -0.043619,\ 0,\ 0) .
$$

Both are unit quaternions, both represent the identical $5^\circ$ error. Hand the sign-blind law $\mathbf{u}=-K\mathbf{q}_v-\mathbf{P}\boldsymbol{\omega}$ each one in turn, with $\mathbf{J}=\mathrm{diag}(120,100,80)\,\mathrm{kg\,m^2}$, $K=20\,\mathrm{N\,m}$, $\mathbf{P}=80\,\mathbf{I}\,\mathrm{N\,m\,s}$, $\boldsymbol{\omega}(0)=\mathbf{0}$, and track the total angle travelled, $\int\lVert\boldsymbol{\omega}\rVert\,dt$:

::: example Unwinding, measured
Integrating at $\Delta t = 2\,\mathrm{ms}$:

| Start | $t$ | $q_0$ | Path travelled |
| --- | --- | --- | --- |
| $\mathbf{q}_{\text{short}}$ | any | $\to 1$ | $5.000^\circ$ total |
| $\mathbf{q}_{\text{long}}$ | $0$ | $-0.99905$ | $0^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $30\,\mathrm{s}$ | $-0.60712$ | $100.237^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $60\,\mathrm{s}$ | $0.99854$ | $348.802^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $150\,\mathrm{s}$ | $1.00000000$ | $355.000^\circ$ |

Starting from $\mathbf{q}_{\text{short}}$, the law corrects the error directly: a path of $5.000^\circ$, matching the error itself. Starting from $\mathbf{q}_{\text{long}}$ — the *same* $5^\circ$ physical error, differently labelled — the same law, same gains, same vehicle, travels $355.000^\circ$: the long way around, missing a full revolution by five degrees. It is not instantaneous, either: at $t=30\,\mathrm{s}$ the vehicle has covered only $100^\circ$ and $q_0$ is still deep in negative territory, near $-1$. It lingers close to the unstable equilibrium — motion away from an unstable point starts slowly, proportional to how close you are to it — before accelerating away and completing the loop. Both trajectories end at $q_0 = 1$: **the sign-blind law always converges to $q_0=+1$ eventually**, because $q_0=-1$ is the unique point where $V$ is maximised, an unstable saddle whose basin is a single point rather than a neighbourhood. Any generic initial condition escapes it. The two runs differ entirely in the path, not the destination.

Fix it with the standard one-line change, $\mathbf{u} = -K\,\mathrm{sign}(q_0)\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, and repeat from $\mathbf{q}_{\text{long}}$: path $= 5.000^\circ$, matching the short run exactly, but this time ending at $q_0 = -1.000000$. The fix did not force convergence to a fixed pole — it forced convergence to *whichever* pole is physically closer, which is what "take the short way" actually means. Parking at $q_0=-1$ is not a failure: it is the same identity attitude, correctly reached in five degrees instead of three hundred fifty-five.
:::

The mechanism is visible in the sign of the proportional term alone. $\mathbf{q}_v$ for the two representatives points in opposite directions for the *same* physical rotation axis, so $-K\mathbf{q}_v$ commands opposite initial torques. For $\mathbf{q}_{\text{long}}$, that torque pushes the vehicle to keep rotating in the direction that *increases* the angle already travelled, because from the far label's point of view, reducing $\lVert\mathbf{q}_v\rVert$ to zero happens at $q_0=-1$, not $q_0=+1$, and getting there without crossing back through $q_0=0$ means completing most of a revolution.

::: key Unwinding and its fix
Because $\mathbf{q}$ and $-\mathbf{q}$ describe the same physical attitude, a control law built from $\mathbf{q}_v$ alone cannot tell which of the two labels it has been handed. LaSalle's invariant set always contains both $q_0=\pm1$; the sign-blind law reaches $q_0=+1$ from almost any start, but the *path* can be nearly a full revolution longer than necessary when the initial label has $q_0 \lt 0$. The fix, $\mathbf{u}=-K\,\mathrm{sign}(q_0)\mathbf{q}_v-\mathbf{P}\boldsymbol{\omega}$, makes the controller always reduce whichever half-angle is smaller.
:::

Here is the fact behind why no smooth relabelling avoids this. The unit quaternions form a sphere, $S^3$, and the map sending a quaternion to the rotation it represents is exactly two-to-one — a double cover of $SO(3)$. A control law continuous in $\mathbf{q}$ that stabilizes one representative of an attitude is, by that same continuity, forced to destabilize the antipodal representative of the *same* attitude, because a small perturbation away from an unstable equilibrium has to go somewhere and the sphere has no room to hide a third option. This is not a defect this module's particular law happens to have; it is proven (in a course on the topology of Lie groups) that $SO(3)$ is not contractible, and a compact space that is not contractible cannot carry a continuous vector field with one single globally attracting rest point. **No continuous, time-invariant state feedback globally asymptotically stabilizes attitude on $SO(3)$.** The sign function is not a stopgap for a weak proof; it is the smallest discontinuity that a fundamentally topological obstruction allows you to get away with.

::: warning
A literal $\mathrm{sign}(q_0)$ evaluated every control cycle chatters if $q_0$ sits near zero — the same reason a sliding-mode switch chatters near its surface. Production implementations add a small hysteresis band around $q_0=0$ rather than flipping on every sign change of a noisy estimate, exactly the boundary-layer reasoning the sliding-mode lesson used to tame chattering, applied here to a sign rather than a saturation.
:::

## MRP-based control: a minimal representation, the same obstruction

Quaternions carry a redundant fourth number — four parameters for three rotational degrees of freedom, tied together by $q_0^2+\mathbf{q}_v^\mathsf{T}\mathbf{q}_v=1$. **Modified Rodrigues parameters**, from the attitude kinematics prerequisite, use exactly three: $\boldsymbol{\sigma} = \hat{\mathbf{n}}\tan(\Phi/4)$, related to the quaternion by

$$
\boldsymbol{\sigma} = \frac{\mathbf{q}_v}{1+q_0} ,
$$

a relation you can check directly from the half-angle definitions. $\boldsymbol{\sigma}=\mathbf{0}$ is zero error, exactly like $\mathbf{q}_v=\mathbf{0},q_0=1$. Their kinematics, standard and stated here as given (confirmed below against the quaternion kinematics rather than taken on faith), are

$$
\dot{\boldsymbol{\sigma}} = \tfrac14\Big[(1-\sigma^2)\mathbf{I} + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\mathsf{T}\Big]\boldsymbol{\omega}, \qquad \sigma^2 := \boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\sigma} ,
$$

where $[\boldsymbol{\sigma}\times]$ is the matrix with $[\boldsymbol{\sigma}\times]\mathbf{v}=\boldsymbol{\sigma}\times\mathbf{v}$. For $\boldsymbol{\sigma}=(0.8116,-0.1737,-0.1004)$ and a random $\boldsymbol{\omega}$, this formula gives $\dot{\boldsymbol{\sigma}}=(0.013255,\,0.002718,\,-0.328533)$, matching a finite difference of the quaternion-derived $\boldsymbol{\sigma}(t)$ to $5\times10^{-9}$ — the formula is not a leap of faith, it is a checkable identity.

**Build the potential the way the Lyapunov lesson built $2K(1-q_0)$: from the kinematics, not from a guess.** Try the proportional law $\mathbf{u}_p=-K\boldsymbol{\sigma}$, and look for a radially symmetric potential $U(\sigma^2)$ whose rate cancels its power. Writing $U=f(\sigma^2)$, so $\nabla U = 2f'(\sigma^2)\boldsymbol{\sigma}$, and using $\boldsymbol{\sigma}^\mathsf{T}[\boldsymbol{\sigma}\times]=\mathbf{0}^\mathsf{T}$ (any vector dotted with its own cross product) and $\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\sigma}\boldsymbol{\sigma}^\mathsf{T}=\sigma^2\boldsymbol{\sigma}^\mathsf{T}$,

$$
\dot{U} = \nabla U\cdot\dot{\boldsymbol{\sigma}} = 2f'(\sigma^2)\cdot\tfrac14(1+\sigma^2)\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} = \tfrac12f'(\sigma^2)(1+\sigma^2)\,\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} .
$$

Demanding this equal $K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega}$ (to cancel $\mathbf{u}_p$'s power $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p=-K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega}$, exactly the matching condition from the passivity lesson) gives $f'(x) = 2K/(1+x)$, so $f(x)=2K\ln(1+x)$ with $f(0)=0$. The shaped potential is

$$
U(\boldsymbol{\sigma}) = 2K\ln\!\left(1+\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\sigma}\right) ,
$$

and it is radially unbounded: $U\to\infty$ as $\sigma\to\infty$.

::: example The MRP law, proved the same way
With $V=\tfrac12\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}+2K\ln(1+\sigma^2)$ and $\mathbf{u}=-K\boldsymbol{\sigma}-\mathbf{P}\boldsymbol{\omega}$:

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{u} + K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} = \boldsymbol{\omega}^\mathsf{T}(-K\boldsymbol{\sigma}-\mathbf{P}\boldsymbol{\omega}) + K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0,
$$

term for term the same computation as the quaternion case. LaSalle: on $E=\{\boldsymbol{\omega}=\mathbf{0}\}$, $\dot{\boldsymbol{\omega}}\equiv\mathbf{0}$ forces $-K\boldsymbol{\sigma}=\mathbf{0}$, so $M=\{\boldsymbol{\omega}=\mathbf{0},\boldsymbol{\sigma}=\mathbf{0}\}$ — **one point**, not two. That looks like the topological obstruction has been beaten. It has not: $\boldsymbol{\sigma}=\mathbf{0}$ is one point in $\boldsymbol{\sigma}$-space, but the *same* physical near-zero error has a second MRP label, because $\boldsymbol{\sigma}=\hat{\mathbf{n}}\tan(\Phi/4)$ blows up as $\Phi\to360^\circ$ — the identity rotation approached the long way is a genuine coordinate singularity of this chart, not a different attitude. A rotation of $\Phi$ and one of $\Phi-360^\circ$ about the same axis are the same physical attitude with MRPs $\boldsymbol{\sigma}$ and its **shadow set** $\boldsymbol{\sigma}_S = -\boldsymbol{\sigma}/\sigma^2$ (which obeys the identical kinematic equation, so switching between them mid-integration changes nothing about the physics, only the label).

For the same $5^\circ$ error about $\hat{\mathbf{x}}$: $\boldsymbol{\sigma}_{\text{short}}=(0.021820,0,0)$, and its shadow $\boldsymbol{\sigma}_{\text{shadow}}=-\boldsymbol{\sigma}_{\text{short}}/\sigma^2=(-45.829351,0,0)$, representing $\Phi_{\text{shadow}}=4\arctan(45.829351)=355.0^\circ$ about the same axis — the long way, exactly matching the quaternion figure above, as it must, since it is the same rotation.

| Start | Switching? | Path travelled | Peak $\lVert\mathbf{u}\rVert$ |
| --- | --- | --- | --- |
| $\boldsymbol{\sigma}_{\text{short}}$ | — | $4.303^\circ$ (30 s) | $0.436\,\mathrm{N\,m}$ |
| $\boldsymbol{\sigma}_{\text{shadow}}$ | no | $335.341^\circ$ (30 s, still unwinding) | $916.587\,\mathrm{N\,m}$ |
| $\boldsymbol{\sigma}_{\text{shadow}}$ | yes, $\lvert\boldsymbol{\sigma}\rvert\le1$ | $4.313^\circ$ (30 s) | $916.587\,\mathrm{N\,m}$ |

Same $K=20$, $\mathbf{P}=80\mathbf{I}$, $\mathbf{J}=\mathrm{diag}(120,100,80)$. Without switching, the shadow start travels $220.750^\circ$ by $t=5\,\mathrm{s}$ alone and is still not converged at $t=30\,\mathrm{s}$: unwinding again, dressed in different coordinates. With shadow switching enforced ($\boldsymbol{\sigma}\to\boldsymbol{\sigma}_S$ whenever $\sigma^2\gt1$), the same start converges in $4.313^\circ$ — matching the always-short run to within $0.01^\circ$.

Look at the peak torque row, though: it is *identical*, $916.587\,\mathrm{N\,m}$, whether or not switching is enabled. That is $\mathbf{u}(0)=-K\boldsymbol{\sigma}_{\text{shadow}}$, computed before the loop has taken a single step to notice $\sigma^2\gt1$ and switch. This is the sharper reason MRP practice treats shadow switching as mandatory rather than a refinement: unlike a quaternion, whose $\lVert\mathbf{q}_v\rVert\le1$ always, an MRP is **unbounded**, and a control gain sized for the ordinary range of $\boldsymbol{\sigma}$ can demand a wildly unrealizable torque the instant $\boldsymbol{\sigma}$ is large — a hardware hazard on top of the path-length inefficiency. The practical fix checks and shadow-switches the *current state* before the control law is evaluated, not only inside the propagation loop, so the first command is never computed from the far side.
:::

::: key The shadow set
$\boldsymbol{\sigma}_S=-\boldsymbol{\sigma}/\lVert\boldsymbol{\sigma}\rVert^2$ represents the same physical attitude as $\boldsymbol{\sigma}$, obeys the same kinematic equation, and has $\lVert\boldsymbol{\sigma}_S\rVert = 1/\lVert\boldsymbol{\sigma}\rVert$. Enforcing $\lVert\boldsymbol{\sigma}\rVert\le1$ — switching to the shadow whenever it is exceeded — keeps MRPs finite and always represents the short rotation. It switches at exactly the same physical configuration as the quaternion fix: $\lVert\boldsymbol{\sigma}\rVert=1 \iff \Phi=180^\circ \iff q_0=0$. Two representations, one obstruction, one switching surface.
:::

## Lyapunov-derived tracking laws, with proof

Regulation steers to a fixed target; most missions need to steer to a *moving* one — a ground track, a relative-navigation target, a scan pattern. Let $\mathbf{q}$ and $\boldsymbol{\omega}$ be the vehicle's actual inertial attitude and body rate, as always, and let a trajectory generator supply a desired attitude $\mathbf{q}_d(t)$ and desired rate $\boldsymbol{\omega}_d(t)$, the latter expressed in the desired frame's own axes, both obeying the same kinematic form: $\dot{\mathbf{q}}_d = \tfrac12\mathbf{q}_d\otimes(0,\boldsymbol{\omega}_d)$, writing $\otimes$ for the Hamilton product and $(0,\mathbf{v})$ for a vector written as a quaternion with zero scalar part — the same identity that expands to $(\dot q_0,\dot{\mathbf{q}}_v)$ above, for either $\mathbf{q}$ or $\mathbf{q}_d$.

Define the **tracking error quaternion** $\mathbf{q}_e = \bar{\mathbf{q}}_d\otimes\mathbf{q}$, where $\bar{\mathbf{q}}_d=(q_{d0},-\mathbf{q}_{dv})$ is the conjugate — the rotation from the desired frame to the body frame, zero exactly when the vehicle is exactly on its reference. The rate error needs more care than a plain difference, because $\boldsymbol{\omega}$ and $\boldsymbol{\omega}_d$ are expressed in different, differently-rotating frames. Define $\boldsymbol{\omega}_e := \boldsymbol{\omega} - \boldsymbol{\omega}_d^{\mathcal{B}}$, where $\boldsymbol{\omega}_d^{\mathcal{B}} := \bar{\mathbf{q}}_e\otimes(0,\boldsymbol{\omega}_d)\otimes\mathbf{q}_e$ is $\boldsymbol{\omega}_d$ resolved into the body frame's own current axes via the error attitude.

**One lemma does the rest of the work.** For any unit quaternion $\mathbf{p}$ and vector $\mathbf{v}$, $(0,\mathbf{v})\otimes\mathbf{p} = \mathbf{p}\otimes(0,\mathbf{w})$ where $\mathbf{w}:=\bar{\mathbf{p}}\otimes(0,\mathbf{v})\otimes\mathbf{p}$ — proved in one line, $\mathbf{p}\otimes(0,\mathbf{w}) = \mathbf{p}\otimes\bar{\mathbf{p}}\otimes(0,\mathbf{v})\otimes\mathbf{p} = (0,\mathbf{v})\otimes\mathbf{p}$, using $\mathbf{p}\otimes\bar{\mathbf{p}}=(1,\mathbf{0})$ for unit $\mathbf{p}$.

**Error kinematics.** Differentiate $\mathbf{q}_e=\bar{\mathbf{q}}_d\otimes\mathbf{q}$ by the product rule. Since conjugation reverses products, $\dot{\bar{\mathbf{q}}}_d = \overline{\tfrac12\mathbf{q}_d\otimes(0,\boldsymbol{\omega}_d)} = -\tfrac12(0,\boldsymbol{\omega}_d)\otimes\bar{\mathbf{q}}_d$, so

$$
\dot{\mathbf{q}}_e = \dot{\bar{\mathbf{q}}}_d\otimes\mathbf{q} + \bar{\mathbf{q}}_d\otimes\dot{\mathbf{q}}
= -\tfrac12(0,\boldsymbol{\omega}_d)\otimes\mathbf{q}_e + \tfrac12\mathbf{q}_e\otimes(0,\boldsymbol{\omega}) .
$$

Apply the lemma to the first term with $\mathbf{p}=\mathbf{q}_e$: $(0,\boldsymbol{\omega}_d)\otimes\mathbf{q}_e = \mathbf{q}_e\otimes(0,\boldsymbol{\omega}_d^{\mathcal B})$, exactly the definition above. So

$$
\dot{\mathbf{q}}_e = -\tfrac12\mathbf{q}_e\otimes(0,\boldsymbol{\omega}_d^{\mathcal B}) + \tfrac12\mathbf{q}_e\otimes(0,\boldsymbol{\omega}) = \tfrac12\mathbf{q}_e\otimes(0,\boldsymbol{\omega}-\boldsymbol{\omega}_d^{\mathcal B}) = \tfrac12\mathbf{q}_e\otimes(0,\boldsymbol{\omega}_e) .
$$

Expanding the Hamilton product exactly as at the top of this lesson,

$$
\boxed{\ \dot{q}_{e0} = -\tfrac12\mathbf{q}_{ev}^\mathsf{T}\boldsymbol{\omega}_e , \qquad \dot{\mathbf{q}}_{ev} = \tfrac12\left(q_{e0}\boldsymbol{\omega}_e + \mathbf{q}_{ev}\times\boldsymbol{\omega}_e\right)\ } .
$$

This is the whole point: **the tracking error obeys the identical kinematic form as the regulation error**, with $\boldsymbol{\omega}\to\boldsymbol{\omega}_e$. Nothing about tracking a moving target changed the shape of the problem — it only changed which rate you subtract.

**Error dynamics.** Differentiate $\boldsymbol{\omega}_d^{\mathcal B}=\bar{\mathbf{q}}_e\otimes(0,\boldsymbol{\omega}_d)\otimes\mathbf{q}_e$ by the product rule, using $\dot{\mathbf{q}}_e$ just found and $\dot{\boldsymbol{\omega}}_d=:\boldsymbol{\alpha}_d$ (the reference generator's known angular acceleration). Three terms appear; the one carrying $\dot{\mathbf{q}}_e$ and the one carrying $\dot{\bar{\mathbf{q}}}_e$ each reduce, by the pure-vector product rule $(0,\mathbf{a})\otimes(0,\mathbf{b})=(-\mathbf{a}\cdot\mathbf{b},\mathbf{a}\times\mathbf{b})$, to cross products in $\boldsymbol{\omega}_e$ and $\boldsymbol{\omega}_d^{\mathcal B}$ that combine into one; the middle term is $\boldsymbol{\alpha}_d$ rotated the same way $\boldsymbol{\omega}_d$ was, $\boldsymbol{\alpha}_d^{\mathcal B}:=\bar{\mathbf{q}}_e\otimes(0,\boldsymbol{\alpha}_d)\otimes\mathbf{q}_e$. The result, confirmed numerically below,

$$
\dot{\boldsymbol{\omega}}_d^{\mathcal B} = \boldsymbol{\omega}_d^{\mathcal B}\times\boldsymbol{\omega}_e + \boldsymbol{\alpha}_d^{\mathcal B} .
$$

Then $\mathbf{J}\dot{\boldsymbol{\omega}}_e = \mathbf{J}\dot{\boldsymbol{\omega}} - \mathbf{J}\dot{\boldsymbol{\omega}}_d^{\mathcal B} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u} - \mathbf{J}\left(\boldsymbol{\omega}_d^{\mathcal B}\times\boldsymbol{\omega}_e\right) - \mathbf{J}\boldsymbol{\alpha}_d^{\mathcal B}$. Choose

$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - \mathbf{J}\left(\boldsymbol{\omega}_e\times\boldsymbol{\omega}_d^{\mathcal B}\right) + \mathbf{J}\boldsymbol{\alpha}_d^{\mathcal B} - K\,\mathrm{sign}(q_{e0})\,\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e
$$

— gyroscopic cancellation, a cross-coupling feedforward, an acceleration feedforward, and the sign-fixed regulation law applied to the *error* state — and, using $\boldsymbol{\omega}_d^{\mathcal B}\times\boldsymbol{\omega}_e=-\boldsymbol{\omega}_e\times\boldsymbol{\omega}_d^{\mathcal B}$, every term cancels except

$$
\mathbf{J}\dot{\boldsymbol{\omega}}_e = -K\,\mathrm{sign}(q_{e0})\,\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e .
$$

Tracking has been turned into regulation of the error state, by construction rather than by analogy. The Lyapunov argument transfers without a new idea: $V=\tfrac12\boldsymbol{\omega}_e^\mathsf{T}\mathbf{J}\boldsymbol{\omega}_e+2K(1-q_{e0})$ gives, by the identical algebra as the fixed-target case with every symbol carrying an $e$,

$$
\dot{V} = -\boldsymbol{\omega}_e^\mathsf{T}\mathbf{P}\boldsymbol{\omega}_e \le 0,
$$

negative semi-definite, LaSalle gives $M=\{\boldsymbol{\omega}_e=\mathbf{0},\mathbf{q}_{ev}=\mathbf{0}\}$, the same two-point set as before with the same antipodal caveat, closed by the same $\mathrm{sign}(q_{e0})$ fix. Perfect tracking is asymptotically stable, certified over $\{V\lt4K\}$, exactly as regulation was.

::: example Tracking a constant scan rate, proved and simulated
A satellite is commanded to scan at a constant $\boldsymbol{\omega}_d=(0,0,0.05)\,\mathrm{rad/s}$ in the desired frame ($\approx2.86^\circ/\mathrm{s}$), so $\boldsymbol{\alpha}_d=\mathbf{0}$ and the feedforward acceleration term drops out. Start with a $30^\circ$ error about $(1,1,0)/\sqrt2$, $\boldsymbol{\omega}(0)=(0.02,-0.01,0.03)\,\mathrm{rad/s}$, $\mathbf{J}=\mathrm{diag}(120,100,80)\,\mathrm{kg\,m^2}$, $K=20$, $\mathbf{P}=80\mathbf{I}$, integrating the *full* nonlinear closed loop — actual attitude, actual rate, and the reference — at $\Delta t=1\,\mathrm{ms}$:

| $t$ | $q_{e0}$ | $\lVert\mathbf{q}_{ev}\rVert$ | $\lVert\boldsymbol{\omega}_e\rVert$ | $\lVert\mathbf{u}\rVert$ |
| --- | --- | --- | --- | --- |
| $0$ | $0.965926$ | $0.258819$ | $0.048606$ | $6.7598$ |
| $5\,\mathrm{s}$ | $0.986252$ | $0.165247$ | $0.046351$ | $0.4269$ |
| $10\,\mathrm{s}$ | $0.996975$ | $0.077723$ | $0.024633$ | $0.4562$ |
| $20\,\mathrm{s}$ | $0.999879$ | $0.015562$ | $0.005035$ | $0.1011$ |
| $40\,\mathrm{s}$ | $1.000000$ | $0.000620$ | $0.000199$ | $0.0039$ |
| $80\,\mathrm{s}$ | $1.000000$ | $0.000001$ | $0.000000$ | $0.0000$ |

Tracking error falls away exactly as the regulation error did in the Lyapunov lesson — same shape, different state. Two identities were checked independently rather than assumed. First, $\mathbf{J}\dot{\boldsymbol{\omega}}_e$, computed from a finite difference of the simulated $\boldsymbol{\omega}_e$, against $-K\,\mathrm{sign}(q_{e0})\mathbf{q}_{ev}-\mathbf{P}\boldsymbol{\omega}_e$: they agree to $2\times10^{-6}$ at $t=0$ and to $10^{-9}$ by $t=20\,\mathrm{s}$ — the claimed cancellation in $\mathbf{u}$ holds on the actual nonlinear trajectory, not only on paper. Second, $\mathbf{q}_e$ computed directly from $\bar{\mathbf{q}}_d\otimes\mathbf{q}$ at every step, against $\mathbf{q}_e$ obtained by integrating *only* the boxed error-kinematics equation above, starting from the same initial condition and fed the same $\boldsymbol{\omega}_e$: the two never differ by more than $1.7\times10^{-5}$ over the full 80-second, 80,000-step run. The kinematic form-invariance the proof claims is not an approximation.
:::

::: key The tracking law
$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - \mathbf{J}(\boldsymbol{\omega}_e\times\boldsymbol{\omega}_d^{\mathcal B}) + \mathbf{J}\boldsymbol{\alpha}_d^{\mathcal B} - K\,\mathrm{sign}(q_{e0})\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e ,
$$
with $\mathbf{q}_e=\bar{\mathbf{q}}_d\otimes\mathbf{q}$, $\boldsymbol{\omega}_e=\boldsymbol{\omega}-\boldsymbol{\omega}_d^{\mathcal B}$. The error kinematics are form-identical to the regulation kinematics with $\boldsymbol{\omega}\to\boldsymbol{\omega}_e$, so the feedforward terms exist only to make the error *dynamics* collapse to the regulation closed loop too. Once they do, $V=\tfrac12\boldsymbol{\omega}_e^\mathsf{T}\mathbf{J}\boldsymbol{\omega}_e+2K(1-q_{e0})$ and the entire earlier proof transfer unchanged. Setting $\boldsymbol{\omega}_d\equiv\mathbf{0}$ collapses $\mathbf{q}_e\to\mathbf{q}$, $\boldsymbol{\omega}_e\to\boldsymbol{\omega}$, and this law back to the plain regulation law: tracking strictly contains regulation, not the other way round.
:::

## Check yourself

::: check
Two engineers each read off $\Phi=2\arccos(q_0)$ for the same physical $5^\circ$ error, one using $\mathbf{q}_{\text{short}}$ and getting $\Phi=5^\circ$, the other using $\mathbf{q}_{\text{long}}$ and getting $\Phi=355^\circ$. Which one is "right"?
:::

::: answer
Neither is wrong and neither is complete: $2\arccos(q_0)$ (with the principal value of $\arccos$, in $[0^\circ,360^\circ]$) returns whichever half-angle representation that specific label encodes, and both labels are valid descriptions of the identical attitude. The physically meaningful quantity is the *shorter* of $\Phi$ and $360^\circ-\Phi$, here $5^\circ$ either way — which is exactly what $\mathrm{sign}(q_0)$ is selecting for when it appears in the control law: it is choosing the representative with the smaller principal angle, not "correcting" a wrong answer.
:::

::: check
Why does the sign-blind law's simulated trajectory linger near $q_0=-1$ for the first $30\,\mathrm{s}$ (covering only $100^\circ$ of its eventual $355^\circ$) rather than unwinding at a constant rate?
:::

::: answer
$q_0=-1,\boldsymbol{\omega}=\mathbf{0}$ is a genuine equilibrium of the closed loop — the control vanishes there exactly, since $\mathbf{q}_v=\mathbf{0}$. Near any equilibrium, the vector field is small and the rate of departure is proportional to distance from it, the same slow-then-fast character every unstable equilibrium produces (compare the escape-time examples from the nonlinear-phenomena lesson). Starting at $q_0=-0.999$, deep in that equilibrium's neighbourhood, the vehicle initially moves at a rate set by how far it already is from equilibrium — small — and only accelerates once it has drifted far enough that the linearization no longer applies.
:::

::: check
An engineer represents attitude with MRPs and reasons: "the LaSalle set for my law is a single point, $\boldsymbol{\sigma}=\mathbf{0}$, so unlike quaternions I have no unwinding problem and don't need shadow switching." Where is the error?
:::

::: answer
The single point is in $\boldsymbol{\sigma}$-space, not in physical-attitude space. The same near-zero physical error has two MRP labels — $\boldsymbol{\sigma}$ itself, and its shadow $\boldsymbol{\sigma}_S=-\boldsymbol{\sigma}/\sigma^2$, which is enormous precisely when $\boldsymbol{\sigma}$ is small. Reaching $\boldsymbol{\sigma}=\mathbf{0}$ from the shadow label means $\boldsymbol{\sigma}$ shrinking continuously from a huge value to zero, which is $\Phi$ shrinking from near $360^\circ$ to $0^\circ$ — the vehicle physically completing nearly a full revolution, measured at $335^\circ$ in the worked example. One point in the parameter space does not mean one basin in the physical space; the coordinate chart itself has the double cover folded into where it goes to infinity.
:::

::: check
For the tracking law, what does $\boldsymbol{\omega}_d^{\mathcal B}$ reduce to if the vehicle is currently tracking perfectly ($\mathbf{q}_e=(1,\mathbf{0})$), and why does that make sense?
:::

::: answer
$\boldsymbol{\omega}_d^{\mathcal B}=\bar{\mathbf{q}}_e\otimes(0,\boldsymbol{\omega}_d)\otimes\mathbf{q}_e$ with $\mathbf{q}_e=(1,\mathbf{0})$ (the identity quaternion) reduces to $(0,\boldsymbol{\omega}_d)$ itself — no rotation applied, since the body and desired frames coincide exactly. That is the sensible limit: when tracking is perfect, "the desired rate resolved into body axes" and "the desired rate" are the same vector, and $\boldsymbol{\omega}_e=\boldsymbol{\omega}-\boldsymbol{\omega}_d^{\mathcal B}$ reduces to the ordinary rate error you would have written down without any of the rotation bookkeeping.
:::

::: check
Why does the boxed tracking law reduce exactly to the plain regulation law $\mathbf{u}=-K\,\mathrm{sign}(q_0)\mathbf{q}_v-\mathbf{P}\boldsymbol{\omega}$ when $\boldsymbol{\omega}_d\equiv\mathbf{0}$, rather than merely resembling it?
:::

::: answer
With $\boldsymbol{\omega}_d\equiv\mathbf{0}$ and $\boldsymbol{\alpha}_d=\mathbf{0}$, $\mathbf{q}_d$ is constant, and taking $\mathbf{q}_d=(1,\mathbf{0})$ (a fixed target) gives $\mathbf{q}_e=\bar{\mathbf{q}}_d\otimes\mathbf{q}=\mathbf{q}$ identically, and $\boldsymbol{\omega}_d^{\mathcal B}=\mathbf{0}$ so $\boldsymbol{\omega}_e=\boldsymbol{\omega}$. Substituting into the boxed law, the cross-coupling and acceleration feedforward terms vanish because they are built entirely from $\boldsymbol{\omega}_d^{\mathcal B}$ and $\boldsymbol{\alpha}_d^{\mathcal B}$, leaving exactly $\mathbf{u}=\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}-K\,\mathrm{sign}(q_0)\mathbf{q}_v-\mathbf{P}\boldsymbol{\omega}$ minus the gyroscopic term it started with — which is the regulation law, because the regulation dynamics already contain $-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ on the plant side and this control never needed to cancel it. Regulation is the $\boldsymbol{\omega}_d=\mathbf{0}$ special case of tracking, exactly, not approximately.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{q}$ and $-\mathbf{q}$ | Same physical attitude; unit quaternions double-cover $SO(3)$ |
| $\mathbf{u}=-K\,\mathrm{sign}(q_0)\mathbf{q}_v-\mathbf{P}\boldsymbol{\omega}$ | Unwinding fix: always reduces the smaller half-angle |
| $5^\circ$ error, wrong label | $355.000^\circ$ travelled sign-blind vs. $5.000^\circ$ fixed |
| $SO(3)$ not contractible | No continuous time-invariant state feedback is globally stabilizing |
| $\boldsymbol{\sigma}=\mathbf{q}_v/(1+q_0)$ | MRP; three parameters, singular at $\Phi=360^\circ$ |
| $\dot{\boldsymbol{\sigma}}=\tfrac14[(1-\sigma^2)\mathbf I+2[\boldsymbol\sigma\times]+2\boldsymbol\sigma\boldsymbol\sigma^\mathsf T]\boldsymbol\omega$ | MRP kinematics |
| $U=2K\ln(1+\sigma^2)$, $\mathbf u=-K\boldsymbol\sigma-\mathbf P\boldsymbol\omega$ | MRP law; $\dot V=-\boldsymbol\omega^\mathsf T\mathbf P\boldsymbol\omega$, $M=\{\boldsymbol\sigma=\mathbf0\}$ |
| $\boldsymbol{\sigma}_S=-\boldsymbol{\sigma}/\sigma^2$ | Shadow set; same attitude, $\lVert\boldsymbol\sigma_S\rVert=1/\lVert\boldsymbol\sigma\rVert$ |
| Shadow start, no switch | $335^\circ$ travelled, $916.6\,\mathrm{N\,m}$ peak torque, still unwinding at 30 s |
| Switch at $\lVert\boldsymbol\sigma\rVert=1 \iff q_0=0$ | Same physical threshold as the quaternion fix |
| $\mathbf{q}_e=\bar{\mathbf{q}}_d\otimes\mathbf{q}$, $\boldsymbol\omega_e=\boldsymbol\omega-\boldsymbol\omega_d^{\mathcal B}$ | Tracking error attitude and rate |
| $\dot q_{e0}=-\tfrac12\mathbf q_{ev}^\mathsf T\boldsymbol\omega_e$, $\dot{\mathbf q}_{ev}=\tfrac12(q_{e0}\boldsymbol\omega_e+\mathbf q_{ev}\times\boldsymbol\omega_e)$ | Error kinematics: form-identical to regulation |
| Tracking law (boxed above) | Collapses closed loop to $\mathbf J\dot{\boldsymbol\omega}_e=-K\,\mathrm{sign}(q_{e0})\mathbf q_{ev}-\mathbf P\boldsymbol\omega_e$ |
| $30^\circ$ error, $\omega_d=0.05\,\mathrm{rad/s}$ scan | Converges as the regulation case did; identity verified to $10^{-9}$ and $1.7\times10^{-5}$ |

Every controller in this lesson still had to be switched, saturated, or fixed against real hardware to make its Lyapunov guarantee mean something in flight. The next lesson takes the opposite approach to that same problem: instead of proving a switching or saturating nonlinearity stable from first principles, it predicts the limit cycle such a nonlinearity produces directly, from nothing more than how the loop responds to a sine wave.
