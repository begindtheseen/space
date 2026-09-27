---
id: l11-spacecraft-attitude-control
title: 'Nonlinear spacecraft attitude control: unwinding, MRPs, and tracking'
minutes: 22
covers:
  - 'Nonlinear spacecraft attitude control: quaternion feedback laws, the unwinding problem, MRP-based control, Lyapunov-derived tracking laws with proof'
---

Stand facing a door, then turn $5^\circ$ to your right. To face the door again you turn $5^\circ$ back. You could also turn $355^\circ$ the other way and end up facing the same door, but nobody would, because it is silly. A spacecraft controller can do exactly that silly thing, and its stability proof will still be correct. This lesson is about why, and how to stop it.

Lesson 4 proved the quaternion feedback law stable and then admitted something it had not fixed: the proof certified convergence to *one* of two points, and the other is the same physical attitude wearing a different sign. Here you pin that problem, called **unwinding**, to a number: a vehicle that swings most of the way around to fix an error of a few degrees. You fix it with one sign. You then watch the same problem, and the same cure, appear in a different set of three-number coordinates. Finally you extend everything from steering to a fixed target to **tracking** a moving one.

This is the attitude-control material interviewers reach for first. It rewards what this module has been building: a real proof, a real failure mode found *inside* that proof, and a fix that is one line of code once you see why it is needed. The attitude kinematics module gave you quaternions, modified Rodrigues parameters and their kinematic equations. Here they earn their keep.

## The quaternion law, and the question its own proof leaves open

Here is the setup from lesson 4. The vehicle is a rigid body,

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u},
$$

with inertia matrix $\mathbf{J}$, body rate $\boldsymbol{\omega}$ ("omega") and control torque $\mathbf{u}$. The attitude error is a unit quaternion $\mathbf{q} = (q_0, \mathbf{q}_v)$: a scalar $q_0$ ("q zero") and a three-part vector $\mathbf{q}_v$ ("q sub v"). For an error of angle $\Phi$ ("capital phi") about a unit axis $\hat{\mathbf{n}}$,

$$
q_0 = \cos(\Phi/2), \qquad \mathbf{q}_v = \hat{\mathbf{n}}\sin(\Phi/2),
$$

so $\mathbf{q} = (1, \mathbf{0})$ means no error. The kinematics are

$$
\dot{q}_0 = -\tfrac12\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}, \qquad \dot{\mathbf{q}}_v = \tfrac12\left(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}\right),
$$

and the law is a spring on $\mathbf{q}_v$ plus a damper on the rate, $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$. With

$$
V = \tfrac12\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0),
$$

lesson 4 showed $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0$. That is only negative *semi*-definite, since it vanishes whenever $\boldsymbol{\omega} = \mathbf{0}$, at any attitude. LaSalle then showed every trajectory converges to

$$
M = \{\boldsymbol{\omega} = \mathbf{0},\ \mathbf{q}_v = \mathbf{0}\} = \{(\mathbf{0}, q_0{=}1)\} \ \cup\ \{(\mathbf{0}, q_0{=}-1)\} .
$$

Two points, both true resting points of the closed loop. And they are the *same physical attitude*. Here is why. Replace $\Phi$ by $\Phi + 360^\circ$ — one extra full turn, which changes nothing physical. The half-angle grows by $180^\circ$, which flips the sign of both $\cos(\Phi/2)$ and $\sin(\Phi/2)$. So $(q_0, \mathbf{q}_v)$ and $(-q_0, -\mathbf{q}_v)$ describe the identical orientation. Every attitude has exactly **[[two quaternion labels|two-labels]]**. Nobody told the controller.

That raises a question the proof does not answer. The vehicle always ends up pointed correctly. But does *how it gets there* depend on which label the attitude estimator handed over? Yes — and by a lot.

## The unwinding problem, made concrete

Take a physical error of $5^\circ$ about $\hat{\mathbf{x}}$ — small and ordinary, the kind a **[[star tracker|star-tracker]]** update corrects every day. Its two labels are

$$
\mathbf{q}_{\text{short}} = (0.999048,\ 0.043619,\ 0,\ 0), \qquad \mathbf{q}_{\text{long}} = -\mathbf{q}_{\text{short}} = (-0.999048,\ -0.043619,\ 0,\ 0) .
$$

Check: $\cos 2.5^\circ = 0.999048$ and $\sin 2.5^\circ = 0.043619$.

::: example Unwinding, measured
Give the sign-blind law $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$ each label in turn. Use $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $K = 20\,\mathrm{N\,m}$, $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$ and $\boldsymbol{\omega}(0) = \mathbf{0}$. Track the total angle turned, the **path** $\int\lVert\boldsymbol{\omega}\rVert\,dt$, integrating at $\Delta t = 2\,\mathrm{ms}$:

| Start | $t$ | $q_0$ | Path so far |
| --- | --- | --- | --- |
| $\mathbf{q}_{\text{short}}$ | $150\,\mathrm{s}$ | $1.00000$ | $5.000^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $0$ | $-0.99905$ | $0^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $30\,\mathrm{s}$ | $-0.60712$ | $100.237^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $60\,\mathrm{s}$ | $0.99854$ | $348.802^\circ$ |
| $\mathbf{q}_{\text{long}}$ | $150\,\mathrm{s}$ | $1.00000$ | $355.000^\circ$ |

**The short label.** The law turns the vehicle straight back: a path of $5.000^\circ$, the size of the error. Good.

**The long label.** Same $5^\circ$ physical error, same law, gains and vehicle — and the vehicle turns $355.000^\circ$, the long way around. It is slow about it, too. At $30\,\mathrm{s}$ it has turned only $100^\circ$. It lingers near $q_0 = -1$, which is an **[[unstable resting point|lingering]]**: motion away from one starts slowly, in proportion to how close you are. Then it speeds up and finishes the loop.

**Where both end.** Both runs finish at $q_0 = +1$. The sign-blind law almost always does, because $q_0 = -1$ is where the potential $2K(1 - q_0)$ is at its highest, $4K$ — a saddle. The only starts that reach it form a thin set with no room around it; among starts at rest, only the point itself. The two runs differ in the path, not the destination.

**The fix.** Change one line: $\mathbf{u} = -K\,\mathrm{sign}(q_0)\,\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, where $\mathrm{sign}(q_0)$ is $+1$ or $-1$ depending on the sign of $q_0$. Repeat from $\mathbf{q}_{\text{long}}$: path $5.000^\circ$, the same as the short run, ending at $q_0 = -1.00000$. The fix does not force one pole. It sends the vehicle to *whichever* pole is physically closer — that is what "take the short way" means. Stopping at $q_0 = -1$ is not a failure. It is the correct attitude, reached in $5^\circ$ instead of $355^\circ$.
:::

You can see the mechanism in the first command. The two labels have opposite $\mathbf{q}_v$, so $-K\mathbf{q}_v$ gives opposite starting torques: $(-0.872, 0, 0)\,\mathrm{N\,m}$ for the short label, $(+0.872, 0, 0)\,\mathrm{N\,m}$ for the long one. From the long label's point of view, "$\mathbf{q}_v$ back to zero" happens at $q_0 = -1$ or by crossing all the way through $q_0 = 0$ to $+1$ — and its torque starts the vehicle turning away from the nearby target.

::: key The canonical quaternion law and its Lyapunov function
$\mathbf{u} = -K\,\mathrm{sign}(q_0)\,\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, with $K$, $\mathbf{P}$ positive definite: proportional on the vector part of the error quaternion, derivative on body rate. With $V = \tfrac12\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0)$, $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$, negative semi-definite, and LaSalle gives asymptotic stability.
:::

::: key Unwinding and its fix
$\mathbf{q}$ and $-\mathbf{q}$ are the same attitude: the unit quaternions are a **double cover** of $SO(3)$, two labels for every orientation. A sign-blind law built from $\mathbf{q}_v$ alone cannot tell which label it was handed. LaSalle's set always holds both $q_0 = \pm1$. The sign-blind law can stabilize the far representation and rotate nearly $360^\circ$ unnecessarily when the starting label has $q_0 \lt 0$. Fix: multiply the feedback by $\mathrm{sign}(q_0)$, usually with hysteresis, so the controller always closes the smaller angle.
:::

## Why no smooth law can avoid it

Could a cleverer smooth law avoid the switch? No.

The unit quaternions form a sphere in four dimensions, written $S^3$. The map from a quaternion to the rotation it stands for is exactly two-to-one. The set of all rotations is called **[[SO(3)|so3-name]]**. A control law that is **continuous** — changes smoothly, with no jumps — and stabilizes one label of an attitude must, by that same smoothness, push away from the opposite label of the *same* attitude. Something must happen between them, and a smooth law has no way to make both labels attract.

The deeper statement is a theorem of topology: $SO(3)$ is not **[[contractible|contractible]]**, and a space that is not contractible cannot carry a continuous flow that pulls *every* point to one resting point.

::: key The topological obstruction on SO(3)
No continuous, time-invariant state feedback globally asymptotically stabilizes an attitude on $SO(3)$, because $SO(3)$ is not contractible. Global results require discontinuous or hybrid (hysteretic) control.
:::

So the sign function is not a patch for a weak proof. It is the smallest jump the topology lets you get away with.

::: warning
A bare $\mathrm{sign}(q_0)$ evaluated every control cycle chatters when $q_0$ sits near zero, the same way a sliding-mode switch chatters near its surface. Flight software adds a small **[[hysteresis|hysteresis]]** band around $q_0 = 0$: it keeps the current sign until $q_0$ has crossed zero by a small margin, instead of flipping on every wobble of a noisy estimate. It is the boundary-layer idea from lesson 8, applied to a sign.
:::

## MRP-based control: fewer numbers, the same obstruction

A quaternion uses four numbers for three degrees of freedom, tied together by $q_0^2 + \mathbf{q}_v^\mathsf{T}\mathbf{q}_v = 1$. **[[Modified Rodrigues parameters|mrp-growth]]** (MRPs) use exactly three:

$$
\boldsymbol{\sigma} = \hat{\mathbf{n}}\tan(\Phi/4) = \frac{\mathbf{q}_v}{1 + q_0} .
$$

Read $\boldsymbol{\sigma}$ as "sigma". The second form follows from the half-angle identity $\tan(\Phi/4) = \sin(\Phi/2)/(1 + \cos(\Phi/2))$. Zero error is $\boldsymbol{\sigma} = \mathbf{0}$. The MRP kinematics, from the prerequisite module, are

$$
\dot{\boldsymbol{\sigma}} = \tfrac14\Big[(1 - \sigma^2)\mathbf{I} + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\mathsf{T}\Big]\boldsymbol{\omega}, \qquad \sigma^2 := \boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\sigma} ,
$$

where $[\boldsymbol{\sigma}\times]$ is the matrix that does a cross product, $[\boldsymbol{\sigma}\times]\mathbf{v} = \boldsymbol{\sigma}\times\mathbf{v}$. You can check this formula rather than trust it: at a random state, a finite-difference derivative of $\boldsymbol{\sigma}(t)$ computed from the quaternion kinematics matches it to about $10^{-10}$.

### Building the potential from the kinematics

Build the potential the way lesson 4 built $2K(1 - q_0)$, and the way lesson 10 called energy shaping. Try the spring $\mathbf{u}_p = -K\boldsymbol{\sigma}$. Its power is $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p = -K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega}$. You want a potential $U = f(\sigma^2)$ whose rate is $+K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega}$, to cancel it.

The slope of $U$ is $\nabla U = 2f'(\sigma^2)\boldsymbol{\sigma}$. Dot $\boldsymbol{\sigma}^\mathsf{T}$ into the bracket, using two facts: $\boldsymbol{\sigma}^\mathsf{T}[\boldsymbol{\sigma}\times] = \mathbf{0}^\mathsf{T}$ (a vector is at right angles to its own cross products) and $\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\sigma}\boldsymbol{\sigma}^\mathsf{T} = \sigma^2\boldsymbol{\sigma}^\mathsf{T}$. The bracket gives $(1 - \sigma^2) + 2\sigma^2 = 1 + \sigma^2$, so

$$
\dot{U} = \nabla U\cdot\dot{\boldsymbol{\sigma}} = 2f'(\sigma^2)\cdot\tfrac14(1 + \sigma^2)\,\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} = \tfrac12 f'(\sigma^2)(1 + \sigma^2)\,\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} .
$$

Set this equal to $K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega}$. Then $f'(x) = 2K/(1 + x)$, and with $f(0) = 0$, $f(x) = 2K\ln(1 + x)$:

$$
U(\boldsymbol{\sigma}) = 2K\ln\!\left(1 + \boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\sigma}\right) .
$$

It grows without limit as $\sigma \to \infty$.

::: example The MRP law, proved and flown
**The proof.** Take $V = \tfrac12\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K\ln(1 + \sigma^2)$ and $\mathbf{u} = -K\boldsymbol{\sigma} - \mathbf{P}\boldsymbol{\omega}$:

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{u} + K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} = \boldsymbol{\omega}^\mathsf{T}(-K\boldsymbol{\sigma} - \mathbf{P}\boldsymbol{\omega}) + K\boldsymbol{\sigma}^\mathsf{T}\boldsymbol{\omega} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0 .
$$

Term for term, the quaternion computation. LaSalle: on $\{\boldsymbol{\omega} = \mathbf{0}\}$, $\dot{\boldsymbol{\omega}} \equiv \mathbf{0}$ forces $-K\boldsymbol{\sigma} = \mathbf{0}$, so $M = \{\boldsymbol{\omega} = \mathbf{0}, \boldsymbol{\sigma} = \mathbf{0}\}$ — **one point**, not two.

**Has the topology been beaten?** No. $\boldsymbol{\sigma} = \mathbf{0}$ is one point in $\boldsymbol{\sigma}$-space, but $\tan(\Phi/4)$ blows up as $\Phi \to 360^\circ$. The identity attitude, approached the long way, sits at infinity in these coordinates. A rotation $\Phi$ and a rotation $\Phi - 360^\circ$ about the same axis are the same attitude, with MRPs $\boldsymbol{\sigma}$ and its **shadow set**

$$
\boldsymbol{\sigma}_S = -\boldsymbol{\sigma}/\sigma^2 .
$$

The shadow obeys the same kinematic equation, so switching between the two mid-flight changes the label, not the physics.

**The numbers.** For the $5^\circ$ error about $\hat{\mathbf{x}}$: $\boldsymbol{\sigma}_{\text{short}} = (0.021820, 0, 0)$, since $\tan 1.25^\circ = 0.021820$. Its shadow is $-\boldsymbol{\sigma}_{\text{short}}/\sigma^2 = (-1/0.021820, 0, 0) = (-45.829351, 0, 0)$. That stands for $\Phi = 4\arctan(45.829351) = 355.0^\circ$, the long way — the same rotation as $\mathbf{q}_{\text{long}}$, as it must be.

Fly each start with the same $K$, $\mathbf{P}$ and $\mathbf{J}$ as before, at $\Delta t = 1\,\mathrm{ms}$, for $30\,\mathrm{s}$:

| Start | Shadow switching | Path in $30\,\mathrm{s}$ | Peak $\lVert\mathbf{u}\rVert$ |
| --- | --- | --- | --- |
| $\boldsymbol{\sigma}_{\text{short}}$ | — | $4.303^\circ$ | $0.436\,\mathrm{N\,m}$ |
| $\boldsymbol{\sigma}_{\text{shadow}}$ | none | $335.341^\circ$ (still going) | $916.587\,\mathrm{N\,m}$ |
| $\boldsymbol{\sigma}_{\text{shadow}}$ | after each step | $4.685^\circ$ | $916.587\,\mathrm{N\,m}$ |
| $\boldsymbol{\sigma}_{\text{shadow}}$ | before each command | $4.303^\circ$ | $0.436\,\mathrm{N\,m}$ |

The short start has closed most of its $5^\circ$ by $30\,\mathrm{s}$; the MRP spring is softer than the quaternion one ($K\tan(\Phi/4)$ against $K\sin(\Phi/2)$), so it is slower.

Without switching, the shadow start turns $220.750^\circ$ in the first $5\,\mathrm{s}$ and is still unwinding at $30\,\mathrm{s}$: the same disease in different coordinates.

Switching after each integration step ($\boldsymbol{\sigma} \to \boldsymbol{\sigma}_S$ whenever $\sigma^2 \gt 1$) cures the path. But look at the torque. The very first command, $-K\boldsymbol{\sigma}_{\text{shadow}} = 20 \times 45.83 = 916.587\,\mathrm{N\,m}$, went out before the loop noticed. That one-millisecond kick is also why the path is $0.38^\circ$ longer. Check the state and switch *before* computing the command, and the shadow start behaves exactly like the short one.

**Why this matters.** A quaternion always has $\lVert\mathbf{q}_v\rVert \le 1$. An MRP is **unbounded**. A gain sized for ordinary $\boldsymbol{\sigma}$ can demand an impossible torque the instant $\boldsymbol{\sigma}$ is large — a hardware hazard on top of the wasted path. So MRP practice treats shadow switching as mandatory, done on the current state before the control law runs.
:::

::: key The shadow set
$\boldsymbol{\sigma}_S = -\boldsymbol{\sigma}/\lVert\boldsymbol{\sigma}\rVert^2$ is the same physical attitude as $\boldsymbol{\sigma}$, obeys the same kinematics, and has $\lVert\boldsymbol{\sigma}_S\rVert = 1/\lVert\boldsymbol{\sigma}\rVert$. Enforcing $\lVert\boldsymbol{\sigma}\rVert \le 1$ keeps MRPs finite and always the short rotation. It switches where the quaternion fix does: $\lVert\boldsymbol{\sigma}\rVert = 1 \iff \Phi = 180^\circ \iff q_0 = 0$.
:::

## Lyapunov-derived tracking laws, with proof

So far the target stood still. Most missions need a **moving** target: follow a ground track, point at another spacecraft, sweep a scan pattern. Think of a camera operator following a runner: the aim is not a fixed spot but a spot that keeps moving at a known rate.

A trajectory generator supplies a desired attitude $\mathbf{q}_d(t)$, a desired rate $\boldsymbol{\omega}_d(t)$ written in the desired frame's own axes, and its rate of change $\boldsymbol{\alpha}_d = \dot{\boldsymbol{\omega}}_d$ ("alpha"). Both the vehicle and the reference obey the same kinematics, written with the **[[Hamilton product|hamilton]]** $\otimes$ (the quaternion multiplication):

$$
\dot{\mathbf{q}} = \tfrac12\mathbf{q}\otimes(0, \boldsymbol{\omega}), \qquad \dot{\mathbf{q}}_d = \tfrac12\mathbf{q}_d\otimes(0, \boldsymbol{\omega}_d) ,
$$

where $(0, \mathbf{v})$ is a vector written as a quaternion with zero scalar part. Expanding the first gives the $\dot{q}_0$, $\dot{\mathbf{q}}_v$ equations above.

**The errors.** The **tracking error quaternion** is $\mathbf{q}_e = \bar{\mathbf{q}}_d\otimes\mathbf{q}$, where $\bar{\mathbf{q}}_d = (q_{d0}, -\mathbf{q}_{dv})$ is the **conjugate** ("q d bar", the reverse rotation). It is the rotation from the desired frame to the body frame, and it equals $(1, \mathbf{0})$ exactly when the vehicle is on its reference.

The rate error needs care, because $\boldsymbol{\omega}$ and $\boldsymbol{\omega}_d$ are written in different, differently turning axes. Resolve the desired rate into the body's axes first,

$$
\boldsymbol{\omega}_d^{\mathcal{B}} := \bar{\mathbf{q}}_e\otimes(0, \boldsymbol{\omega}_d)\otimes\mathbf{q}_e ,
$$

(the superscript $\mathcal{B}$ means "in body axes"), and then subtract: $\boldsymbol{\omega}_e := \boldsymbol{\omega} - \boldsymbol{\omega}_d^{\mathcal{B}}$.

::: note Why it has to be true: the error kinematics
**One lemma.** For any unit quaternion $\mathbf{p}$ and vector $\mathbf{v}$, $(0, \mathbf{v})\otimes\mathbf{p} = \mathbf{p}\otimes(0, \mathbf{w})$ with $\mathbf{w} := \bar{\mathbf{p}}\otimes(0, \mathbf{v})\otimes\mathbf{p}$. Proof: $\mathbf{p}\otimes(0, \mathbf{w}) = \mathbf{p}\otimes\bar{\mathbf{p}}\otimes(0, \mathbf{v})\otimes\mathbf{p} = (0, \mathbf{v})\otimes\mathbf{p}$, because $\mathbf{p}\otimes\bar{\mathbf{p}} = (1, \mathbf{0})$ for a unit quaternion.

**Differentiate** $\mathbf{q}_e = \bar{\mathbf{q}}_d\otimes\mathbf{q}$ by the product rule. Conjugation reverses the order of a product, so $\dot{\bar{\mathbf{q}}}_d = -\tfrac12(0, \boldsymbol{\omega}_d)\otimes\bar{\mathbf{q}}_d$. Then

$$
\dot{\mathbf{q}}_e = \dot{\bar{\mathbf{q}}}_d\otimes\mathbf{q} + \bar{\mathbf{q}}_d\otimes\dot{\mathbf{q}} = -\tfrac12(0, \boldsymbol{\omega}_d)\otimes\mathbf{q}_e + \tfrac12\mathbf{q}_e\otimes(0, \boldsymbol{\omega}) .
$$

Apply the lemma to the first term with $\mathbf{p} = \mathbf{q}_e$: $(0, \boldsymbol{\omega}_d)\otimes\mathbf{q}_e = \mathbf{q}_e\otimes(0, \boldsymbol{\omega}_d^{\mathcal{B}})$. So

$$
\dot{\mathbf{q}}_e = \tfrac12\mathbf{q}_e\otimes(0, \boldsymbol{\omega} - \boldsymbol{\omega}_d^{\mathcal{B}}) = \tfrac12\mathbf{q}_e\otimes(0, \boldsymbol{\omega}_e) .
$$
:::

Expanding that product the same way as for $\mathbf{q}$ gives the result that matters:

$$
\dot{q}_{e0} = -\tfrac12\mathbf{q}_{ev}^\mathsf{T}\boldsymbol{\omega}_e , \qquad \dot{\mathbf{q}}_{ev} = \tfrac12\left(q_{e0}\boldsymbol{\omega}_e + \mathbf{q}_{ev}\times\boldsymbol{\omega}_e\right) .
$$

**The tracking error obeys exactly the same kinematics as the regulation error**, with $\boldsymbol{\omega}$ replaced by $\boldsymbol{\omega}_e$. A moving target did not change the shape of the problem. It only changed which rate you subtract.

**The error dynamics.** Differentiating $\boldsymbol{\omega}_d^{\mathcal{B}}$ by the product rule gives three terms. The two that carry $\dot{\mathbf{q}}_e$ and $\dot{\bar{\mathbf{q}}}_e$ reduce, through $(0, \mathbf{a})\otimes(0, \mathbf{b}) = (-\mathbf{a}\cdot\mathbf{b}, \mathbf{a}\times\mathbf{b})$, to one cross product. The middle term is $\boldsymbol{\alpha}_d$ turned into body axes, $\boldsymbol{\alpha}_d^{\mathcal{B}} := \bar{\mathbf{q}}_e\otimes(0, \boldsymbol{\alpha}_d)\otimes\mathbf{q}_e$. The result is

$$
\dot{\boldsymbol{\omega}}_d^{\mathcal{B}} = \boldsymbol{\omega}_d^{\mathcal{B}}\times\boldsymbol{\omega}_e + \boldsymbol{\alpha}_d^{\mathcal{B}} .
$$

In words: the desired rate, seen from the body, changes because the reference speeds up ($\boldsymbol{\alpha}_d^{\mathcal{B}}$) and because the body is turning relative to the reference ($\boldsymbol{\omega}_e$). So

$$
\mathbf{J}\dot{\boldsymbol{\omega}}_e = \mathbf{J}\dot{\boldsymbol{\omega}} - \mathbf{J}\dot{\boldsymbol{\omega}}_d^{\mathcal{B}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u} - \mathbf{J}\left(\boldsymbol{\omega}_d^{\mathcal{B}}\times\boldsymbol{\omega}_e\right) - \mathbf{J}\boldsymbol{\alpha}_d^{\mathcal{B}} .
$$

**The law.** Choose

$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - \mathbf{J}\left(\boldsymbol{\omega}_e\times\boldsymbol{\omega}_d^{\mathcal{B}}\right) + \mathbf{J}\boldsymbol{\alpha}_d^{\mathcal{B}} - K\,\mathrm{sign}(q_{e0})\,\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e .
$$

Read it term by term: cancel the gyroscopic torque; cancel the cross-coupling; supply the reference's acceleration as **[[feedforward|feedforward]]**; then the sign-fixed regulation law on the *error*. Substitute. The gyroscopic terms cancel. The cross-coupling terms cancel too, because $\boldsymbol{\omega}_d^{\mathcal{B}}\times\boldsymbol{\omega}_e = -\boldsymbol{\omega}_e\times\boldsymbol{\omega}_d^{\mathcal{B}}$. The acceleration terms cancel. What is left is

$$
\mathbf{J}\dot{\boldsymbol{\omega}}_e = -K\,\mathrm{sign}(q_{e0})\,\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e .
$$

Tracking has become regulation of the error state, by construction. **The proof carries over.** With $V = \tfrac12\boldsymbol{\omega}_e^\mathsf{T}\mathbf{J}\boldsymbol{\omega}_e + 2K(1 - q_{e0})$, the algebra of lesson 4 repeats with an $e$ on every symbol (written for $q_{e0} \gt 0$; the other half is its mirror image):

$$
\dot{V} = -\boldsymbol{\omega}_e^\mathsf{T}\mathbf{P}\boldsymbol{\omega}_e \le 0 .
$$

LaSalle gives $M = \{\boldsymbol{\omega}_e = \mathbf{0}, \mathbf{q}_{ev} = \mathbf{0}\}$: the same two-point set, with the same caveat, closed by the same sign fix. Perfect tracking is asymptotically stable, certified over $\{V \lt 4K\}$ as before.

::: example Tracking a constant scan rate
A satellite must scan at $\boldsymbol{\omega}_d = (0, 0, 0.05)\,\mathrm{rad/s}$ in the desired frame, about $2.86^\circ/\mathrm{s}$. The rate is constant, so $\boldsymbol{\alpha}_d = \mathbf{0}$ and the acceleration feedforward drops out.

Start with the reference at $\mathbf{q}_d = (1, \mathbf{0})$ and the vehicle $30^\circ$ away about $(1, 1, 0)/\sqrt2$, turning at $\boldsymbol{\omega}(0) = (0.02, -0.01, 0.03)\,\mathrm{rad/s}$. Use the same $\mathbf{J}$, $K = 20$ and $\mathbf{P} = 80\mathbf{I}$. Integrate the *full* nonlinear loop — vehicle attitude, vehicle rate and reference — at $\Delta t = 1\,\mathrm{ms}$:

| $t$ | $q_{e0}$ | $\lVert\mathbf{q}_{ev}\rVert$ | $\lVert\boldsymbol{\omega}_e\rVert$ (rad/s) | $\lVert\mathbf{u}\rVert$ (N m) |
| --- | --- | --- | --- | --- |
| $0$ | $0.965926$ | $0.258819$ | $0.048606$ | $6.7598$ |
| $5\,\mathrm{s}$ | $0.986252$ | $0.165247$ | $0.046351$ | $0.4269$ |
| $10\,\mathrm{s}$ | $0.996975$ | $0.077723$ | $0.024633$ | $0.4562$ |
| $20\,\mathrm{s}$ | $0.999879$ | $0.015562$ | $0.005035$ | $0.1011$ |
| $40\,\mathrm{s}$ | $1.000000$ | $0.000620$ | $0.000199$ | $0.0039$ |
| $80\,\mathrm{s}$ | $1.000000$ | $0.000001$ | $0.000000$ | $0.0000$ |

**First row.** $q_{e0} = \cos 15^\circ = 0.965926$ and $\lVert\mathbf{q}_{ev}\rVert = \sin 15^\circ = 0.258819$: the $30^\circ$ start, as it should be.

**The trend.** The error dies away with the same shape as the regulation runs in lesson 4. Once locked on, the vehicle spins steadily about its body $z$ axis, a principal axis, which needs no torque at all — so the last row shows zero torque even though the vehicle is still turning.

**Two identities, checked instead of assumed.** First, $\mathbf{J}\dot{\boldsymbol{\omega}}_e$ from a finite difference of the simulated $\boldsymbol{\omega}_e$ matches $-K\,\mathrm{sign}(q_{e0})\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e$ to better than $10^{-9}$ at $t = 0$ and $t = 20\,\mathrm{s}$: the cancellation holds on the real nonlinear trajectory. Second, $\mathbf{q}_e$ computed as $\bar{\mathbf{q}}_d\otimes\mathbf{q}$ at every step, against $\mathbf{q}_e$ obtained by integrating *only* the error kinematics, never differ by more than $3\times10^{-9}$ over the $80{,}000$ steps. The kinematic match is exact, not approximate.
:::

::: key The tracking law
$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - \mathbf{J}(\boldsymbol{\omega}_e\times\boldsymbol{\omega}_d^{\mathcal B}) + \mathbf{J}\boldsymbol{\alpha}_d^{\mathcal B} - K\,\mathrm{sign}(q_{e0})\mathbf{q}_{ev} - \mathbf{P}\boldsymbol{\omega}_e ,
$$
with $\mathbf{q}_e = \bar{\mathbf{q}}_d\otimes\mathbf{q}$ and $\boldsymbol{\omega}_e = \boldsymbol{\omega} - \boldsymbol{\omega}_d^{\mathcal B}$. The error kinematics have the same form as the regulation kinematics with $\boldsymbol{\omega}\to\boldsymbol{\omega}_e$; the feedforward terms make the error *dynamics* collapse to the regulation closed loop too. Then $V = \tfrac12\boldsymbol{\omega}_e^\mathsf{T}\mathbf{J}\boldsymbol{\omega}_e + 2K(1 - q_{e0})$ gives $\dot{V} = -\boldsymbol{\omega}_e^\mathsf{T}\mathbf{P}\boldsymbol{\omega}_e$, and the earlier proof transfers unchanged. With a fixed target it becomes the regulation law plus a gyroscopic-cancellation term, which does no work.
:::

## Check yourself

::: check
Two engineers compute $\Phi = 2\arccos(q_0)$ for the same physical $5^\circ$ error. One uses $\mathbf{q}_{\text{short}}$ and gets $5^\circ$. The other uses $\mathbf{q}_{\text{long}}$ and gets $355^\circ$. Which one is right?
:::

::: answer
Both labels are valid, so neither is wrong — but neither number alone is the whole story. The calculator's $\arccos$ returns an angle between $0^\circ$ and $180^\circ$, so $2\arccos(q_0)$ lands between $0^\circ$ and $360^\circ$. It reports whichever turn that particular label encodes.

The physically meaningful number is the *smaller* of $\Phi$ and $360^\circ - \Phi$: here $5^\circ$ either way. That is exactly what $\mathrm{sign}(q_0)$ picks in the control law. It chooses the label with the smaller angle; it does not "correct" a wrong answer.
:::

::: check
Why does the sign-blind run linger near $q_0 = -1$ for the first $30\,\mathrm{s}$, covering only $100^\circ$ of its eventual $355^\circ$, instead of turning at a steady rate?
:::

::: answer
$q_0 = -1$, $\boldsymbol{\omega} = \mathbf{0}$ is a true resting point of the closed loop: the control is exactly zero there, because $\mathbf{q}_v = \mathbf{0}$.

Near any resting point the arrows of the flow are short, and the speed of departure is roughly proportional to the distance from it. Starting at $q_0 = -0.999$, very close, the vehicle drifts away slowly at first. The drift grows on itself, and only once it is far enough away does it swing quickly around. It is the slow-then-fast escape of every unstable equilibrium.
:::

::: check
An engineer using MRPs says: "The LaSalle set for my law is a single point, $\boldsymbol{\sigma} = \mathbf{0}$, so I have no unwinding problem and do not need shadow switching." Where is the mistake?
:::

::: answer
The single point is in $\boldsymbol{\sigma}$-space, not in the space of physical attitudes. The same small error has two MRP labels: $\boldsymbol{\sigma}$ and its shadow $\boldsymbol{\sigma}_S = -\boldsymbol{\sigma}/\sigma^2$, which is huge exactly when $\boldsymbol{\sigma}$ is small.

Reaching $\boldsymbol{\sigma} = \mathbf{0}$ from the shadow label means $\boldsymbol{\sigma}$ shrinking from a huge value to zero. That is $\Phi$ shrinking from near $360^\circ$ to $0^\circ$: the vehicle turning nearly a full circle, $335^\circ$ in $30\,\mathrm{s}$ in the worked example. The double cover is still there, hidden where the coordinates go to infinity. And the first command from the shadow label, $916\,\mathrm{N\,m}$, could not be delivered by any real actuator.
:::

::: check
In the tracking law, what does $\boldsymbol{\omega}_d^{\mathcal B}$ become when the vehicle is tracking perfectly, $\mathbf{q}_e = (1, \mathbf{0})$? Why does that make sense?
:::

::: answer
With $\mathbf{q}_e = (1, \mathbf{0})$, the identity quaternion, $\bar{\mathbf{q}}_e\otimes(0, \boldsymbol{\omega}_d)\otimes\mathbf{q}_e = (0, \boldsymbol{\omega}_d)$: no rotation is applied. So $\boldsymbol{\omega}_d^{\mathcal B} = \boldsymbol{\omega}_d$.

That makes sense. When tracking is perfect, the body axes and the desired axes coincide, so "the desired rate in body axes" and "the desired rate" are the same vector. Then $\boldsymbol{\omega}_e = \boldsymbol{\omega} - \boldsymbol{\omega}_d$, the plain rate difference you would have written without any rotation bookkeeping.
:::

::: check
Set $\boldsymbol{\omega}_d \equiv \mathbf{0}$ and $\mathbf{q}_d = (1, \mathbf{0})$ in the tracking law. Do you get the regulation law $\mathbf{u} = -K\,\mathrm{sign}(q_0)\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$ exactly? If not, does the difference matter?
:::

::: answer
**Substitute.** With a fixed target at the identity, $\mathbf{q}_e = \bar{\mathbf{q}}_d\otimes\mathbf{q} = \mathbf{q}$. Also $\boldsymbol{\omega}_d^{\mathcal B} = \mathbf{0}$ and $\boldsymbol{\alpha}_d^{\mathcal B} = \mathbf{0}$, so $\boldsymbol{\omega}_e = \boldsymbol{\omega}$. The cross-coupling and acceleration terms are built from those zeros, so they vanish. What is left is

$$
\mathbf{u} = \boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} - K\,\mathrm{sign}(q_0)\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega} .
$$

**Not exactly, then.** It is the regulation law plus a term that cancels the gyroscopic torque.

**Does it matter?** Not for stability. In the regulation proof, $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$, so that term adds nothing to $\dot{V}$ either way. In tracking the term is needed, because the proof dots with $\boldsymbol{\omega}_e$, not $\boldsymbol{\omega}$, and $\boldsymbol{\omega}_e^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$ is not zero in general. Regulation is the fixed-target case of tracking, up to a term that does no work there.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{q}$ and $-\mathbf{q}$ | Same physical attitude; unit quaternions double-cover $SO(3)$ |
| $\mathbf{u}=-K\,\mathrm{sign}(q_0)\mathbf{q}_v-\mathbf{P}\boldsymbol{\omega}$ | Canonical law with unwinding fix: always closes the smaller angle |
| $V=\tfrac12\boldsymbol\omega^\mathsf T\mathbf J\boldsymbol\omega+2K(1-q_0)$ | $\dot V=-\boldsymbol\omega^\mathsf T\mathbf P\boldsymbol\omega$; LaSalle finishes |
| $5^\circ$ error, wrong label | $355.000^\circ$ turned sign-blind against $5.000^\circ$ with the fix |
| $SO(3)$ not contractible | No continuous time-invariant state feedback is globally stabilizing |
| $\boldsymbol{\sigma}=\hat{\mathbf n}\tan(\Phi/4)=\mathbf{q}_v/(1+q_0)$ | MRP; three numbers, infinite at $\Phi=360^\circ$ |
| $\dot{\boldsymbol{\sigma}}=\tfrac14[(1-\sigma^2)\mathbf I+2[\boldsymbol\sigma\times]+2\boldsymbol\sigma\boldsymbol\sigma^\mathsf T]\boldsymbol\omega$ | MRP kinematics |
| $U=2K\ln(1+\sigma^2)$, $\mathbf u=-K\boldsymbol\sigma-\mathbf P\boldsymbol\omega$ | MRP law; $\dot V=-\boldsymbol\omega^\mathsf T\mathbf P\boldsymbol\omega$, $M=\{\boldsymbol\sigma=\mathbf0\}$ |
| $\boldsymbol{\sigma}_S=-\boldsymbol{\sigma}/\sigma^2$ | Shadow set; same attitude, $\lVert\boldsymbol\sigma_S\rVert=1/\lVert\boldsymbol\sigma\rVert$ |
| Shadow start, no switching | $335^\circ$ in 30 s, still unwinding; first command $916.6\,\mathrm{N\,m}$ |
| Switch at $\lVert\boldsymbol\sigma\rVert=1 \iff q_0=0$ | Same physical threshold as the quaternion fix; switch before commanding |
| $\mathbf{q}_e=\bar{\mathbf{q}}_d\otimes\mathbf{q}$, $\boldsymbol\omega_e=\boldsymbol\omega-\boldsymbol\omega_d^{\mathcal B}$ | Tracking error attitude and rate |
| $\dot q_{e0}=-\tfrac12\mathbf q_{ev}^\mathsf T\boldsymbol\omega_e$, $\dot{\mathbf q}_{ev}=\tfrac12(q_{e0}\boldsymbol\omega_e+\mathbf q_{ev}\times\boldsymbol\omega_e)$ | Error kinematics: same form as regulation |
| Tracking law | Collapses the loop to $\mathbf J\dot{\boldsymbol\omega}_e=-K\,\mathrm{sign}(q_{e0})\mathbf q_{ev}-\mathbf P\boldsymbol\omega_e$ |

Every controller here still had to be switched, saturated or hardened before its Lyapunov guarantee meant something in flight. The next lesson comes at such switching and saturating parts from the other side: instead of proving them stable, it predicts the steady oscillation they cause, from nothing more than how the loop responds to a sine wave.

::: context two-labels One attitude, two labels
Plot $q_0 = \cos(\Phi/2)$ as the turn angle $\Phi$ runs through two full circles. A $5^\circ$ turn and a $365^\circ$ turn leave the vehicle in the same orientation, but their $q_0$ values are opposite.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="350" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="20" x2="30" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,30.0 38.9,30.9 47.8,33.6 56.7,38.0 65.6,44.0 74.4,51.4 83.3,60.0 92.2,69.5 101.1,79.6 110.0,90.0 118.9,100.4 127.8,110.5 136.7,120.0 145.6,128.6 154.4,136.0 163.3,142.0 172.2,146.4 181.1,149.1 190.0,150.0 198.9,149.1 207.8,146.4 216.7,142.0 225.6,136.0 234.4,128.6 243.3,120.0 252.2,110.5 261.1,100.4 270.0,90.0 278.9,79.6 287.8,69.5 296.7,60.0 305.6,51.4 314.4,44.0 323.3,38.0 332.2,33.6 341.1,30.9 350.0,30.0"/>
  <line x1="190" y1="20" x2="190" y2="160" stroke="#6c7a93" stroke-dasharray="4 4"/>
  <circle cx="32.2" cy="30.1" r="5" fill="#1d6fd1"/>
  <circle cx="192.2" cy="149.9" r="5" fill="#b4232c"/>
  <text x="44" y="16" font-size="11" fill="#1d6fd1">5°: q₀ = +0.999</text>
  <text x="206" y="175" font-size="11" fill="#b4232c">365°: q₀ = −0.999</text>
  <text x="24" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="24" y="94" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="24" y="154" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="190" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">360°</text>
  <text x="344" y="104" font-size="11" text-anchor="end" fill="#1f2a44">720°</text>
</svg>
```

It takes $720^\circ$ for the quaternion to come back to where it started. There is a famous party version of this, the "belt trick": a belt twisted by one full turn cannot be straightened without turning its end, but a belt twisted by two full turns can.
:::

::: context star-tracker What a star tracker does
A star tracker is a small camera that photographs the sky, matches the pattern of stars against an onboard catalog, and works out which way the spacecraft is pointing — often to a few arcseconds (thousandths of a degree).

It reports its answer as a quaternion. Whether that quaternion comes out with $q_0$ positive or negative is a matter of convention inside its software, not physics. That is exactly how a controller can be handed the "long" label for a perfectly ordinary small error.
:::

::: context lingering Balancing a pencil
Balance a pencil on its point. If it starts almost upright, it barely moves for a while, then falls faster and faster. The push away from an unstable resting point is proportional to how far you already are from it, so the departure grows like compound interest: slow at first, then fast.

The sign-blind controller near $q_0 = -1$ is that pencil. Starting $5^\circ$ from its unstable point, it spends a long time leaving before it swings the rest of the way around.
:::

::: context so3-name Reading the name SO(3)
$SO(3)$ is read "S O three", short for the **special orthogonal group** in three dimensions. It is the set of all $3\times3$ rotation matrices.

"Orthogonal" means the matrix keeps lengths and right angles. "Special" means its determinant is $+1$, which rules out mirror flips. "Group" means you can combine any two rotations to get another. Every possible orientation of a rigid body is exactly one point of $SO(3)$, so it is the true "space of attitudes" that quaternions and MRPs are labeling.
:::

::: context contractible What "contractible" means
A space is contractible if you can shrink the whole thing smoothly to a single point without tearing it. A solid disk is contractible: pull everything toward the center. The rim of the disk, a circle, is not — any smooth shrinking has to break the loop somewhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="65" r="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="90" cy="65" r="4" fill="#1f2a44"/>
  <line x1="126" y1="44" x2="100" y2="59" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="95,62 101,53 105,61" fill="#1d6fd1"/>
  <line x1="54" y1="86" x2="80" y2="71" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="85,68 79,77 75,69" fill="#1d6fd1"/>
  <text x="90" y="135" font-size="12" text-anchor="middle" fill="#1f2a44">disk: shrinks to a point</text>
  <circle cx="270" cy="65" r="45" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="262" y1="15" x2="278" y2="35" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="278" y1="15" x2="262" y2="35" stroke="#b4232c" stroke-width="2.5"/>
  <text x="270" y="135" font-size="12" text-anchor="middle" fill="#1f2a44">circle: must tear</text>
</svg>
```

$SO(3)$ is like the circle, only harder to picture: it contains loops that no smooth squeezing can undo. A controller that pulls every attitude to one resting point would, run over time, be exactly such a shrinking. So it cannot be done with a continuous law, and a jump such as $\mathrm{sign}(q_0)$ has to appear somewhere.
:::

::: context hysteresis Hysteresis, like a thermostat
A home thermostat set to $20^\circ\mathrm{C}$ does not switch the heater on at $19.99$ and off at $20.01$, or it would click all day. It turns on at, say, $19.5$ and off at $20.5$. Between the two it keeps doing whatever it was doing. That memory band is **hysteresis**.

Attitude software does the same with the sign of $q_0$: keep the current sign until $q_0$ passes, say, $-0.1$ or $+0.1$. Near $q_0 = 0$ the vehicle is about $180^\circ$ off, where either way around is about as long, so holding the old choice costs almost nothing.
:::

::: context mrp-growth How MRPs grow
The size of the MRP vector is $\tan(\Phi/4)$. It is exactly $1$ at a half turn and runs off to infinity as the turn approaches a full circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,150.0 52.5,147.4 65.0,144.7 77.5,142.0 90.0,139.3 102.5,136.4 115.0,133.4 127.5,130.3 140.0,126.9 152.5,123.3 165.0,119.3 177.5,114.9 190.0,110.0 202.5,104.4 215.0,97.9 227.5,90.1 240.0,80.7 252.5,68.9 265.0,53.4 277.5,32.2 285.0,15.0"/>
  <line x1="40" y1="110" x2="190" y2="110" stroke="#6c7a93" stroke-dasharray="4 4"/>
  <line x1="190" y1="150" x2="190" y2="110" stroke="#6c7a93" stroke-dasharray="4 4"/>
  <circle cx="190" cy="110" r="4" fill="#b4232c"/>
  <line x1="340" y1="150" x2="340" y2="15" stroke="#b4232c" stroke-dasharray="3 3"/>
  <text x="34" y="114" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">3</text>
  <text x="40" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0°</text>
  <text x="190" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="340" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">360°</text>
  <text x="196" y="102" font-size="11" fill="#b4232c">switch to shadow here</text>
  <text x="200" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">turn angle Φ</text>
</svg>
```

Keeping $\lVert\boldsymbol{\sigma}\rVert \le 1$ means staying on the left half of this curve, where the numbers are tame.
:::

::: context hamilton Where quaternions came from
The Irish mathematician William Rowan Hamilton spent years trying to multiply triples of numbers the way complex numbers multiply pairs. In 1843, walking along a canal in Dublin, he realized he needed four numbers and that the order of multiplication had to matter: $\mathbf{a}\otimes\mathbf{b}$ is not in general $\mathbf{b}\otimes\mathbf{a}$. He scratched the rule into the stone of Broom Bridge, where a plaque now marks the spot.

That order-matters property is why the proof above has to be careful about which side each quaternion sits on.
:::

::: context feedforward Feedforward: acting before the error appears
A driver sees a curve ahead and starts turning the wheel as the curve begins, not after the car has drifted toward the edge. That is **feedforward**: using what you know about the path to act before any error shows up. Feedback then cleans up whatever the prediction missed.

In the tracking law, $\mathbf{J}\boldsymbol{\alpha}_d^{\mathcal B}$ is the torque the reference *needs*, supplied in advance. Without it, the error would have to grow before the spring and damper reacted, and the vehicle would always lag behind a speeding-up target.
:::
