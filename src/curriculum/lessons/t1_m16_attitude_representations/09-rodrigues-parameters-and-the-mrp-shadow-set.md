---
id: l09-rodrigues-parameters-and-the-mrp-shadow-set
title: Classical and modified Rodrigues parameters, and the MRP shadow set
minutes: 19
covers:
  - classical and modified Rodrigues parameters, and the MRP shadow set
---

Every flat map of the round Earth stretches something. Some maps blow up the regions near the poles until Greenland looks as big as Africa, and a few send one point off to infinity altogether. Mapmakers do not hope the stretching away. They choose *where* it goes, and they put it somewhere nobody needs to look.

Describing attitude with three numbers is the same game. So far you have met two ways to do it. **Euler angles** spend three numbers and put their bad spot — gimbal lock — right in the middle of places a vehicle actually goes. **Quaternions** spend four numbers and have no bad spot, but they carry a rule (length $1$) and a sign ambiguity. This lesson is about the family in between: the **Rodrigues parameters**, named for the French mathematician [[Olinde Rodrigues|rodrigues-history]]. They use three numbers, obey no rule, need no sines or cosines in any of their formulas, and put their bad spot somewhere you can arrange never to go.

There are two of them.

- The **classical Rodrigues parameters**, also called the **Gibbs vector**, use the tangent of *half* the rotation angle. They blow up at $180^\circ$ — too close for comfort in a general attitude state — but their rule for combining two rotations is the neatest in the subject.
- The **modified Rodrigues parameters**, or **MRPs**, use the tangent of a *quarter* of the angle. They blow up only at a full $360^\circ$ turn, and they come with a trick — the **shadow set** — that removes even that.

MRPs are the standard three-number attitude error in spacecraft filters and in a good deal of attitude control, and they are the reason a filter can carry an honest $3\times 3$ covariance. The conventions are those of lesson 05: unit, scalar-first, Hamilton, $q = [w,\mathbf{v}] = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$, with $\mathbf{C}(q) = (w^2-\mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times]$.

## Classical Rodrigues parameters

### The definition

Take the quaternion and divide its vector part by its scalar part:

$$
\mathbf{g} = \frac{\mathbf{v}}{w} = \hat{\mathbf{e}}\,\tan\frac{\Phi}{2}.
$$

The second form follows at once: $\mathbf{v}/w = \hat{\mathbf{e}}\sin(\Phi/2)/\cos(\Phi/2)$, and sine over cosine is tangent. So $\mathbf{g}$ ("g", for Gibbs) is an arrow pointing along the rotation axis, with length $\tan(\Phi/2)$. To get the angle back, undo the tangent: $\Phi = 2\arctan\lVert\mathbf{g}\rVert$.

Three numbers, and no rule they must obey — any arrow $\mathbf{g}$ at all is a valid attitude. Geometrically, $\mathbf{g}$ is what you get by shining a light from the center of the quaternion sphere onto a flat sheet touching it at the identity ([[picture|central-projection]]).

### Where it breaks

The division by $w$ is the whole story. At $\Phi = 180^\circ$, $w = \cos 90^\circ = 0$, and $\mathbf{g}$ is infinite. The parameters do not creep up on the wall; they charge at it:

| $\Phi$ | $45^\circ$ | $90^\circ$ | $120^\circ$ | $150^\circ$ | $179^\circ$ | $179.9^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| $\lVert\mathbf{g}\rVert$ | $0.4142$ | $1.0000$ | $1.7321$ | $3.7321$ | $114.589$ | $1145.92$ |

A tenth of a degree from the wall, the parameters are already over a thousand. Their **sensitivity** — how much they change per radian of turn — is $d\lVert\mathbf{g}\rVert/d\Phi = \tfrac12\sec^2(\Phi/2)$ (where $\sec = 1/\cos$), and at $179.9^\circ$ that is about $6.6\times 10^{5}$, nearly a million. Any $180^\circ$ maneuver — the worst-case slew a spacecraft has to be designed for — passes straight through the hole.

### The rotation matrix needs only arithmetic

Put $\mathbf{v} = w\mathbf{g}$ into the rule $w^2 + \mathbf{v}^\top\mathbf{v} = 1$. That gives $w^2 + w^2\,\mathbf{g}^\top\mathbf{g} = 1$, so $w^2 = 1/(1 + \mathbf{g}^\top\mathbf{g})$. Now put $\mathbf{v} = w\mathbf{g}$ into every term of $\mathbf{C}(q)$. Each term has exactly two factors of $w$ (counting $\mathbf{v}$ as one), so $w^2$ comes out front, and it equals $1/(1 + \mathbf{g}^\top\mathbf{g})$:

$$
\mathbf{C}(\mathbf{g}) = \frac{(1 - \mathbf{g}^\top\mathbf{g})\mathbf{I}_3 + 2\,\mathbf{g}\mathbf{g}^\top + 2\,[\mathbf{g}\times]}{1 + \mathbf{g}^\top\mathbf{g}} .
$$

No sines, no cosines, no square roots — only adding, multiplying and one division. A formula like that is called **[[rational|rational-word]]**. The same matrix can be written as the **[[Cayley transform|cayley]]** of the skew matrix $[\mathbf{g}\times]$ (the cross-product matrix from lesson 01):

$$
\mathbf{C} = (\mathbf{I}_3 + [\mathbf{g}\times])(\mathbf{I}_3 - [\mathbf{g}\times])^{-1},
\qquad
[\mathbf{g}\times] = (\mathbf{C} - \mathbf{I}_3)(\mathbf{C} + \mathbf{I}_3)^{-1}.
$$

Both check out numerically on random rotations to round-off. The second form, which gets $\mathbf{g}$ back from a matrix, fails exactly when $\mathbf{C} + \mathbf{I}_3$ has no inverse. That happens when $\mathbf{C}$ turns some arrow into its own negative — eigenvalue $-1$ — which is a half-turn, $\Phi = 180^\circ$, again.

### Combining two rotations

This is where the Gibbs vector earns its keep. Multiply two quaternions with the product from lesson 06 and write each $\mathbf{v}_i = w_i\mathbf{g}_i$:

- the scalar part is $w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2 = w_1w_2\,(1 - \mathbf{g}_1\cdot\mathbf{g}_2)$;
- the vector part is $w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2 = w_1w_2\,(\mathbf{g}_2 + \mathbf{g}_1 + \mathbf{g}_1\times\mathbf{g}_2)$.

The Gibbs vector of the product is vector part over scalar part, and the common factor $w_1w_2$ cancels:

$$
\mathbf{g}_{1\oplus 2} = \frac{\mathbf{g}_1 + \mathbf{g}_2 + \mathbf{g}_1\times\mathbf{g}_2}{1 - \mathbf{g}_1\cdot\mathbf{g}_2} .
$$

(The symbol $\oplus$, "o-plus", just means "first rotation combined with second".) One cross product, one dot product, one division. There is no shorter composition rule anywhere in this module.

::: key Classical and modified Rodrigues parameters
CRP (Gibbs): $\mathbf{g} = \hat{\mathbf{e}}\tan(\Phi/2) = \mathbf{v}/w$, singular at $\Phi = 180^\circ$. MRP: $\boldsymbol{\sigma} = \hat{\mathbf{e}}\tan(\Phi/4)$, singular only at $\Phi = 360^\circ$, and $\boldsymbol{\sigma} = \mathbf{q}_v/(1 + w)$.
:::

## Modified Rodrigues parameters

### The definition

Halve the angle once more before taking the tangent:

$$
\boldsymbol{\sigma} = \hat{\mathbf{e}}\,\tan\frac{\Phi}{4} = \frac{\mathbf{v}}{1 + w},
\qquad
\Phi = 4\arctan\lVert\boldsymbol{\sigma}\rVert .
$$

Read $\boldsymbol{\sigma}$ as "sigma". It is also written $\mathbf{q}_v/(1+w)$, where $\mathbf{q}_v$ ("q sub v") is the quaternion's vector part. The second form comes from the half-angle rule $\tan(\theta/2) = \sin\theta/(1+\cos\theta)$ with $\theta = \Phi/2$: the top becomes $\sin(\Phi/2)$, which with the axis is $\mathbf{v}$, and the bottom becomes $1 + \cos(\Phi/2) = 1 + w$.

Dividing by $1 + w$ instead of $w$ is the whole improvement. The bottom is now zero only when $w = -1$, which is $\Phi/2 = 180^\circ$, so $\Phi = 360^\circ$. The bad spot has moved from a half-turn to a full turn. Geometrically, this is shining the light from the *far pole* of the sphere instead of its center ([[picture|stereo-projection]]), so only that one point is sent to infinity.

### Going back, and the matrix

The double-angle rules for tangent give the quaternion back from $\boldsymbol{\sigma}$:

$$
w = \frac{1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma}}{1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma}},
\qquad
\mathbf{v} = \frac{2\boldsymbol{\sigma}}{1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma}}.
$$

The rotation matrix again needs no sines or cosines:

$$
\mathbf{C}(\boldsymbol{\sigma}) = \mathbf{I}_3 + \frac{8\,[\boldsymbol{\sigma}\times]^2 + 4\,(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\,[\boldsymbol{\sigma}\times]}{(1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma})^2}.
$$

All of these were checked against the quaternion route over $500$ random rotations and agree to about $10^{-15}$ — round-off.

### How big do they get?

Much tamer than the Gibbs vector. Since $\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$, a $180^\circ$ rotation has $\lVert\boldsymbol{\sigma}\rVert = \tan 45^\circ = 1$ exactly. So the **unit ball** — every arrow of length at most $1$ — holds every rotation of $180^\circ$ or less. Since every attitude can be reached by a turn of at most $180^\circ$, the unit ball holds the whole of $SO(3)$, once.

## The shadow set

Every attitude can be reached two ways round: $\Phi$ about $\hat{\mathbf{e}}$, or $360^\circ - \Phi$ about $-\hat{\mathbf{e}}$. Those are the two quaternions $q$ and $-q$ of lesson 07, and each gives its own MRP. Put $-q$ into $\boldsymbol{\sigma} = \mathbf{v}/(1+w)$ and you get the second one:

$$
\boldsymbol{\sigma}^{S} = -\frac{\boldsymbol{\sigma}}{\boldsymbol{\sigma}^\top\boldsymbol{\sigma}},
$$

called the **[[shadow set|shadow-name]]** — the same attitude's other MRP. (Read $\boldsymbol{\sigma}^{S}$ as "sigma shadow".)

::: note Why it has to be true
Replacing $q$ with $-q$ turns $\mathbf{v}/(1+w)$ into $-\mathbf{v}/(1-w)$. Multiply its top and bottom by $(1+w)$:

$$
-\frac{\mathbf{v}}{1-w} = -\frac{\mathbf{v}(1+w)}{(1-w)(1+w)} = -\frac{\mathbf{v}(1+w)}{1 - w^2} = -\frac{\mathbf{v}(1+w)}{\mathbf{v}^\top\mathbf{v}},
$$

using $1 - w^2 = \mathbf{v}^\top\mathbf{v}$ from the unit-length rule. Now compute $-\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$. Since $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = \mathbf{v}^\top\mathbf{v}/(1+w)^2$,

$$
-\frac{\boldsymbol{\sigma}}{\boldsymbol{\sigma}^\top\boldsymbol{\sigma}} = -\frac{\mathbf{v}}{1+w}\cdot\frac{(1+w)^2}{\mathbf{v}^\top\mathbf{v}} = -\frac{\mathbf{v}(1+w)}{\mathbf{v}^\top\mathbf{v}} .
$$

The two agree.
:::

Two facts follow straight away.

- **The lengths are reciprocals.** $\lVert\boldsymbol{\sigma}\rVert\,\lVert\boldsymbol{\sigma}^{S}\rVert = 1$, exactly. So if one is shorter than $1$, the other is longer. Of the pair, exactly one lies inside the unit ball — unless both sit right on its surface, at $\Phi = 180^\circ$.
- **It is the same attitude.** $\mathbf{C}(\boldsymbol{\sigma}^{S}) = \mathbf{C}(\boldsymbol{\sigma})$, checked to $10^{-15}$. The shadow is another name, not another place.

So the rule is one line: **whenever $\lVert\boldsymbol{\sigma}\rVert > 1$, replace $\boldsymbol{\sigma}$ by $\boldsymbol{\sigma}^{S}$.** The stored parameters then never leave the unit ball. They never get anywhere near the infinity at $\Phi = 360^\circ$, and the singularity is permanently out of reach.

```python
import numpy as np

def mrp_from_quat(q):
    """MRP from a unit scalar-first quaternion, always inside the unit ball."""
    s = np.asarray(q[1:]) / (1.0 + q[0])
    n2 = float(s @ s)
    return -s / n2 if n2 > 1.0 else s        # shadow-set switch

# 270 deg about z: raw MRP would be (0, 0, 2.414); the shadow is 90 deg about -z
h = np.radians(270) / 2
print(np.round(mrp_from_quat(np.array([np.cos(h), 0.0, 0.0, np.sin(h)])), 5) + 0.0)   # [ 0.       0.      -0.41421]
```

Sanity check: a $270^\circ$ turn one way is a $90^\circ$ turn the other way, and $\tan(90^\circ/4) = \tan 22.5^\circ = 0.41421$, pointing along $-\hat{\mathbf{z}}$. That is what came out.

::: key The MRP shadow set
$\boldsymbol{\sigma}^{S} = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ describes the same attitude via the other principal rotation. Switching whenever $\lVert\boldsymbol{\sigma}\rVert > 1$ keeps the parameters bounded by $1$ and pushes the singularity permanently out of reach.
:::

::: example Walking an MRP all the way round
Turn about $\hat{\mathbf{z}}$ and watch the one non-zero part of $\boldsymbol{\sigma}$, its $z$ component, as the angle grows — once with the raw formula, once with the shadow switch.

| $\Phi$ | $90^\circ$ | $150^\circ$ | $180^\circ$ | $210^\circ$ | $270^\circ$ | $330^\circ$ | $360^\circ$ | $450^\circ$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| raw $\sigma_z$ | $0.41421$ | $0.76733$ | $1.00000$ | $1.30323$ | $2.41421$ | $7.59575$ | $\infty$ | $-2.41421$ |
| switched $\sigma_z$ | $0.41421$ | $0.76733$ | $1.00000$ | $-0.76733$ | $-0.41421$ | $-0.13165$ | $0.00000$ | $0.41421$ |

**The raw row.** It climbs to $7.6$ by $330^\circ$ and is undefined at $360^\circ$, where $w = \cos 180^\circ = -1$ and the bottom $1 + w$ is zero. Past $360^\circ$ it comes back from minus infinity: at $450^\circ$, $\tan(112.5^\circ) = -2.41421$.

**The switched row.** It reaches $1$ at $180^\circ$ and then jumps to $-0.76733$. Check that jump: $210^\circ$ one way is $150^\circ$ the other way, about $-\hat{\mathbf{z}}$, and $\tan(150^\circ/4) = 0.76733$. Also $-1/1.30323 = -0.76733$, as the shadow formula says. From there it walks back down to $0$ at $360^\circ$ — the identity, as it should be, since a full turn is no turn — and on to $0.41421$ at $450^\circ$, the same as at $90^\circ$ ([[plot|shadow-plot]]).

Two things to notice. The switch is a jump in the *numbers*, at $\lVert\boldsymbol{\sigma}\rVert = 1$, not in the attitude. And it happens at the same $180^\circ$ boundary where the quaternion's shortest-path convention had to jump in lesson 07. They are the same obstacle from the shape of $SO(3)$, showing up in different clothes. Meanwhile the switched values never exceed $1$, so the largest number an MRP-based program ever handles is $1$ — against a Gibbs vector that is unbounded well inside the normal flight envelope.
:::

::: example Why a filter error state prefers MRPs
A filter that estimates a small attitude error is, underneath, estimating the **rotation vector** $\boldsymbol{\phi} = \Phi\hat{\mathbf{e}}$ ("phi" — the axis scaled by the angle in radians). For small angles, every three-number set is nearly a fixed multiple of it:

$$
\mathbf{q}_v \approx \frac{\boldsymbol{\phi}}{2}, \qquad \mathbf{g}\approx\frac{\boldsymbol{\phi}}{2}, \qquad \boldsymbol{\sigma}\approx\frac{\boldsymbol{\phi}}{4}.
$$

That is because $\sin x \approx x$ and $\tan x \approx x$ for small $x$. All three are straight-line (linear) to first order. The question is how fast each one bends away from its straight line as the angle grows.

| $\Phi$ | $\lVert\mathbf{q}_v\rVert$ | $\lVert\mathbf{g}\rVert$ | $\lVert\boldsymbol{\sigma}\rVert$ | $\Phi/2$ (rad) | $\Phi/4$ (rad) |
| --- | --- | --- | --- | --- | --- |
| $0.1^\circ$ | $0.00087266$ | $0.00087266$ | $0.00043633$ | $0.00087266$ | $0.00043633$ |
| $1^\circ$ | $0.00872654$ | $0.00872687$ | $0.00436335$ | $0.00872665$ | $0.00436332$ |
| $5^\circ$ | $0.04361939$ | $0.04366094$ | $0.02182008$ | $0.04363323$ | $0.02181662$ |
| $20^\circ$ | $0.17364818$ | $0.17632698$ | $0.08748866$ | $0.17453293$ | $0.08726646$ |

Look at the $20^\circ$ row — a large error, far beyond what a settled filter sees. Compare each set with its straight-line prediction:

- MRP: $0.08748866 / 0.08726646 = 1.00255$, so $0.255\%$ off.
- Quaternion vector part: $0.17364818 / 0.17453293 = 0.99493$, so $0.507\%$ off.
- Gibbs vector: $0.17632698 / 0.17453293 = 1.01028$, so $1.028\%$ off.

The MRP bends away a quarter as much as the Gibbs vector and half as much as the quaternion. The reason is arithmetic: the MRP's tangent is taken of a quarter of the angle, not a half, and $\tan x - x \approx x^3/3$, so the relative error grows like $x^2$ — halve $x$ and the error drops to a quarter.

That is the practical case for MRPs as an error state: three unconstrained numbers, no sign ambiguity while the error stays small, an honest $3\times 3$ covariance, a singularity the shadow rule makes unreachable, and the mildest bending of the three. Lesson 12 builds this into an attitude error representation.
:::

::: example A slew through the Gibbs singularity
A spacecraft must turn $180^\circ$ to point an antenna the other way. It turns about $\hat{\mathbf{z}}$ at a steady $0.5^\circ/\mathrm{s}$, and the control loop samples every $0.2\,\mathrm{s}$ — so the vehicle turns $0.5 \times 0.2 = 0.1^\circ$ per sample. Watch what each representation reports near the halfway mark.

**Gibbs vector.** At $\Phi = 179.9^\circ$, $\lVert\mathbf{g}\rVert = \tan 89.95^\circ = 1145.92$. At $179.99^\circ$ it is $11459.2$. At $180^\circ$ it is not a number. In the one sample from $179.95^\circ$ to $180.05^\circ$, $g_z$ goes from $+2291.8$ to $-2291.8$ — a swing of $4583.7$ in one control cycle, for a vehicle that turned a tenth of a degree.

**MRP.** Over the same sample, $\sigma_z$ goes from $\tan(179.95^\circ/4) = 0.99956$ to $1.00044$, trips the shadow switch, and carries on from $-1/1.00044 = -0.99956$. The numbers jump by about $2.0$ at the switch — a real jump, which any code differentiating $\boldsymbol{\sigma}$ must notice — but they stay near $1$ throughout, and the attitude they describe is smooth on both sides to machine precision.

**Quaternion.** It passes $180^\circ$ with $w$ crossing zero and nothing else happening at all: from $[0.00044,\ 0,\ 0,\ 1.00000]$ to $[-0.00044,\ 0,\ 0,\ 1.00000]$.

This is the ranking the module keeps arriving at: quaternion for the state, MRP for the error, Gibbs for algebra, Euler angles for display.
:::

::: warning The shadow switch is a jump in the state, and the code must know it
A controller or filter that differentiates $\boldsymbol{\sigma}$ numerically, or a logger plotting it, will see a step at the switch. Its size is $\lVert\boldsymbol{\sigma}\rVert + 1/\lVert\boldsymbol{\sigma}\rVert$ (the old arrow and its shadow point opposite ways), which is about $2$ because the switch happens at $\lVert\boldsymbol{\sigma}\rVert \approx 1$. The derivative must be recomputed on the new branch, not differenced across the boundary. A covariance carried in $\boldsymbol{\sigma}$ must be transformed by the Jacobian (the matrix of derivatives) of the shadow map, not left alone. Code that switches silently inside a getter and hands the result to something that differences it produces a rate spike at exactly $180^\circ$ of attitude error — the same failure shape as the quaternion sign flip of lesson 07, from the same cause.
:::

::: warning Rodrigues parameters are not "small-angle quaternions"
$\mathbf{g}\approx\boldsymbol{\phi}/2$ and $\boldsymbol{\sigma}\approx\boldsymbol{\phi}/4$ hold only for small angles, and the factors of $2$ and $4$ are mixed up all the time. A feedback gain tuned against $\mathbf{q}_v$ and then applied to $\boldsymbol{\sigma}$ without rescaling is a factor of two too small. Applied to $\mathbf{g}$ it is right for small angles and increasingly wrong beyond them. Before tuning anything, write down which parameter the gain multiplies, and in what units.
:::

## Check yourself

::: check
An MRP vector is $\boldsymbol{\sigma} = (0.2,\ -0.4,\ 0.4)$. Find the principal axis and angle, and the matching quaternion.
:::

::: answer
Length first: $\lVert\boldsymbol{\sigma}\rVert = \sqrt{0.04 + 0.16 + 0.16} = \sqrt{0.36} = 0.6$. That is inside the unit ball, so no shadow switch is needed.

Angle: $\Phi = 4\arctan 0.6 = 4\times 30.9638^\circ = 123.855^\circ$. Axis: divide by the length, $(0.2, -0.4, 0.4)/0.6 = (0.3333, -0.6667, 0.6667)$.

Quaternion: $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 0.36$, so $w = (1-0.36)/(1+0.36) = 0.64/1.36 = 0.470588$, and $\mathbf{v} = 2(0.2,-0.4,0.4)/1.36 = (0.294118, -0.588235, 0.588235)$.

Check the length: $w^2 + \mathbf{v}^\top\mathbf{v} = 0.221453 + 0.778547 = 1.000000$. Check the angle: $2\arccos(0.470588) = 123.855^\circ$. Both agree.
:::

::: check
Show that $\lVert\boldsymbol{\sigma}\rVert\lVert\boldsymbol{\sigma}^{S}\rVert = 1$, and explain why that means one of the pair is always inside the unit ball.
:::

::: answer
$\boldsymbol{\sigma}^{S} = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$, and $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = \lVert\boldsymbol{\sigma}\rVert^2$. So $\lVert\boldsymbol{\sigma}^{S}\rVert = \lVert\boldsymbol{\sigma}\rVert/\lVert\boldsymbol{\sigma}\rVert^2 = 1/\lVert\boldsymbol{\sigma}\rVert$, and the product of the two lengths is $1$.

Two positive numbers whose product is $1$ are either both exactly $1$, or one is below $1$ and the other above. So at every attitude except the half-turns, exactly one representative lies strictly inside the unit ball, and the switching rule picks it.

In angles: $\tan(\Phi/4)\cdot\tan\bigl((360^\circ-\Phi)/4\bigr) = \tan(\Phi/4)\tan(90^\circ - \Phi/4) = \tan(\Phi/4)\cot(\Phi/4) = 1$ — the same statement in trigonometry.
:::

::: check
Combine a $60^\circ$ rotation about $\hat{\mathbf{x}}$ with a $60^\circ$ rotation about $\hat{\mathbf{y}}$ using the Gibbs composition rule, and read off the principal angle of the result.
:::

::: answer
Each is a $60^\circ$ turn, so each Gibbs vector has length $\tan 30^\circ = 0.577350$: $\mathbf{g}_1 = (0.577350, 0, 0)$ and $\mathbf{g}_2 = (0, 0.577350, 0)$.

Dot product: $0$, since the axes are perpendicular. So the bottom is $1 - 0 = 1$.

Cross product: $\mathbf{g}_1\times\mathbf{g}_2 = (0, 0, 0.577350^2) = (0, 0, 0.333333)$.

Add up the top: $\mathbf{g} = (0.577350,\ 0.577350,\ 0.333333)$. Its length is $\sqrt{0.333333+0.333333+0.111111} = \sqrt{0.777778} = 0.881917$.

Angle: $\Phi = 2\arctan(0.881917) = 2\times 41.4096^\circ = 82.819^\circ$, about the axis $\mathbf{g}/\lVert\mathbf{g}\rVert = (0.654654, 0.654654, 0.377964)$.

Two $60^\circ$ turns make an $82.8^\circ$ turn, not $120^\circ$: principal angles do not add, as lesson 04 warned. And the whole calculation took one cross product, one dot product and a division.
:::

::: check
A filter that estimates MRPs as its error state never needs the shadow set in normal operation. Why not — and when might it need it anyway?
:::

::: answer
A settled filter's attitude error is small — arcseconds to a few degrees. So $\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$ is of order $10^{-5}$ to $10^{-2}$, nowhere near $1$. The error state is also reset to zero after each update, so it never piles up.

The shadow set matters in the situations that are not normal:

- first acquisition from an unknown attitude, where the first error can be anything up to $180^\circ$;
- recovery after a safe-mode entry or a tumble;
- any use of MRPs as the *whole* attitude state rather than the error, which some controllers do on purpose, because a bounded three-number state makes stability proofs easier.

In all three, $\lVert\boldsymbol{\sigma}\rVert$ can go past $1$, and the switch is what keeps the numbers finite.
:::

::: check
A colleague wants to use classical Rodrigues parameters as the attitude state because the composition rule is so cheap. Make the case against, with numbers.
:::

::: answer
The singularity at $\Phi = 180^\circ$ is inside the operating envelope, not outside it. Any $180^\circ$ slew passes through it — pointing an antenna the other way, flipping around for a **[[retrograde burn|retrograde]]**, recovering from an upside-down attitude.

And the approach is violent. $\lVert\mathbf{g}\rVert = \tan(\Phi/2)$ is $3.73$ at $150^\circ$, $114.6$ at $179^\circ$ and $1145.9$ at $179.9^\circ$. The sensitivity $\tfrac12\sec^2(\Phi/2)$ reaches $6.6\times 10^{5}$ per radian at $179.9^\circ$. At a modest $0.5^\circ/\mathrm{s}$ slew, the parameters swing from $+2292$ to $-2292$ within a single $0.2\,\mathrm{s}$ control cycle. No gain schedule, integrator or numerical derivative survives that.

Use MRPs, which cost one extra addition in the conversion (plus the shadow check) and keep the state within $1$, or use a quaternion.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{g} = \mathbf{v}/w = \hat{\mathbf{e}}\tan(\Phi/2)$ | Classical Rodrigues (Gibbs) parameters; singular at $\Phi = 180^\circ$ |
| $\mathbf{C}(\mathbf{g}) = \bigl[(1-\mathbf{g}^\top\mathbf{g})\mathbf{I}_3 + 2\mathbf{g}\mathbf{g}^\top + 2[\mathbf{g}\times]\bigr]/(1+\mathbf{g}^\top\mathbf{g})$ | Rational: arithmetic only |
| $\mathbf{C} = (\mathbf{I}_3+[\mathbf{g}\times])(\mathbf{I}_3-[\mathbf{g}\times])^{-1}$ | Cayley transform form |
| $\mathbf{g}_{1\oplus 2} = (\mathbf{g}_1+\mathbf{g}_2+\mathbf{g}_1\times\mathbf{g}_2)/(1-\mathbf{g}_1\cdot\mathbf{g}_2)$ | Cheapest composition rule in the module |
| $\boldsymbol{\sigma} = \mathbf{v}/(1+w) = \hat{\mathbf{e}}\tan(\Phi/4)$ | Modified Rodrigues parameters; singular only at $\Phi = 360^\circ$ |
| $w = (1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma})/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$, $\mathbf{v} = 2\boldsymbol{\sigma}/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ | Back to the quaternion |
| $\mathbf{C}(\boldsymbol{\sigma}) = \mathbf{I}_3 + \bigl(8[\boldsymbol{\sigma}\times]^2 + 4(1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma})[\boldsymbol{\sigma}\times]\bigr)/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})^2$ | MRP to DCM |
| $\boldsymbol{\sigma}^{S} = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ | Shadow set; $\lVert\boldsymbol{\sigma}\rVert\lVert\boldsymbol{\sigma}^{S}\rVert = 1$; switch when $\lVert\boldsymbol{\sigma}\rVert > 1$ |
| $\lVert\boldsymbol{\sigma}\rVert = 1$ | The $180^\circ$ boundary; $\Phi = 4\arctan\lVert\boldsymbol{\sigma}\rVert$ |
| Small angle | $\mathbf{q}_v\approx\boldsymbol{\phi}/2$, $\mathbf{g}\approx\boldsymbol{\phi}/2$, $\boldsymbol{\sigma}\approx\boldsymbol{\phi}/4$ |
| Worked figures | At $20^\circ$: MRP within $0.255\%$ of linear, quaternion $0.507\%$, Gibbs $1.028\%$ |

Five representations are now on the table. The next lesson puts every conversion between them in one place, with the branch choice that makes the DCM-to-quaternion step safe at every angle.

::: context rodrigues-history Who Rodrigues was
Olinde Rodrigues (1795–1851) was a French mathematician who also worked as a banker and a social reformer. In an 1840 paper he worked out how two rotations combine, using what are now called Rodrigues parameters — before Hamilton invented quaternions in 1843. His work was overlooked for more than a century. The name "Gibbs vector" honors the American scientist Josiah Willard Gibbs, whose vector notation made the same parameters popular. The "modified" set came much later, in the 1960s, and spread through spacecraft work in the 1990s.
:::

::: context central-projection Light from the center
A two-dimensional slice: the circle stands for the quaternion sphere, with $w$ pointing up. A light at the center throws each point onto the flat line touching the top ($w = 1$, the identity). Where it lands is $\tan(\Phi/2)$. A $90^\circ$ turn lands at $1$; a $140^\circ$ turn lands far out, at $2.75$. A $180^\circ$ turn sits level with the light, and its ray never reaches the line — that is the Gibbs singularity.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="350" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="160" r="60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="160" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="160" x2="240" y2="100" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="160" x2="344.8" y2="100" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="180" y1="160" x2="300" y2="160" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="222.4" cy="117.6" r="4" fill="#1d6fd1"/>
  <circle cx="236.4" cy="139.5" r="4" fill="#b4232c"/>
  <circle cx="240" cy="160" r="4" fill="#6c7a93"/>
  <circle cx="180" cy="100" r="4" fill="#1f2a44"/>
  <text x="140" y="92" font-size="12" fill="#1f2a44">identity</text>
  <text x="228" y="92" font-size="12" fill="#1d6fd1">90°</text>
  <text x="318" y="92" font-size="12" fill="#b4232c">140°</text>
  <text x="248" y="176" font-size="12" fill="#6c7a93">180°: never lands</text>
  <text x="24" y="92" font-size="12" fill="#1f2a44">flat sheet w = 1</text>
</svg>
```
:::

::: context rational-word What "rational" means here
A rational function is one built from its inputs using only adding, subtracting, multiplying and dividing — a fraction of two polynomials. No sines, square roots or logarithms. On a flight computer that is valuable: those four operations are fast, exact to round-off, and never need a lookup table or a series. Quaternions share the property — their matrix is a polynomial in the four components — but among three-number sets, only the Rodrigues family has it. Euler angles need sines and cosines.
:::

::: context cayley Cayley's trick
Arthur Cayley, a British mathematician, noticed in 1846 that if $\mathbf{S}$ is skew-symmetric (it equals minus its own transpose, like $[\mathbf{g}\times]$), then $(\mathbf{I} + \mathbf{S})(\mathbf{I} - \mathbf{S})^{-1}$ is always a rotation matrix. The trick works in any number of dimensions. It gives a way to make a rotation from free numbers without any trigonometry, and to run the recipe backwards — except for rotations that flip some direction exactly around.
:::

::: context stereo-projection Light from the far pole
Now the light sits at the bottom of the circle, $w = -1$, and throws points onto the flat line through the middle ($w = 0$). Where a point lands is $\tan(\Phi/4)$. A $90^\circ$ turn lands at $0.41$; a $180^\circ$ turn lands exactly on the circle, at $1$; a $270^\circ$ turn lands outside, at $2.41$. Only the light's own spot ($360^\circ$) is sent to infinity. Mapmakers call this a stereographic projection.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="350" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="130" r="60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="190" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="190" x2="222.4" y2="87.6" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="190" x2="240" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="190" x2="324.9" y2="130" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="222.4" cy="87.6" r="4" fill="#1d6fd1"/>
  <circle cx="204.9" cy="130" r="4" fill="#1d6fd1"/>
  <circle cx="240" cy="130" r="4" fill="#6c7a93"/>
  <circle cx="222.4" cy="172.4" r="4" fill="#b4232c"/>
  <circle cx="324.9" cy="130" r="4" fill="#b4232c"/>
  <circle cx="180" cy="70" r="4" fill="#1f2a44"/>
  <text x="188" y="64" font-size="12" fill="#1f2a44">identity (0°)</text>
  <text x="228" y="84" font-size="12" fill="#1d6fd1">90°</text>
  <text x="246" y="124" font-size="12" fill="#6c7a93">180°</text>
  <text x="300" y="122" font-size="12" fill="#b4232c">270°</text>
  <text x="190" y="205" font-size="12" fill="#1f2a44">light at w = −1 (360°)</text>
  <text x="24" y="122" font-size="12" fill="#1f2a44">flat line w = 0</text>
</svg>
```
:::

::: context shadow-name Why "shadow"
The name fits the projection picture. Every attitude has two quaternions, $q$ and $-q$, at opposite points of the sphere. Project both from the far pole and one lands inside the unit circle while the other lands outside — like an object and its shadow on either side of a lamp. The two are always the same direction apart from sign, and their distances from the center multiply to exactly $1$.
:::

::: context shadow-plot The switched MRP, drawn
$\sigma_z$ against the angle for a turn about $\hat{\mathbf{z}}$. The grey raw curve heads off to infinity toward $360^\circ$. The blue switched curve climbs to $1$ at $180^\circ$, jumps to $-1$ (dotted), and climbs back to $0$ at $360^\circ$, never leaving the band between $-1$ and $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 4">
    <line x1="40" y1="104" x2="320" y2="104"/><line x1="40" y1="176" x2="320" y2="176"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="108">1</text><text x="34" y="144">0</text><text x="34" y="180">−1</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="204">180°</text><text x="320" y="204">360°</text>
  </g>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="180.0,104.0 187.8,100.7 195.6,97.1 203.3,93.1 211.1,88.6 218.9,83.5 226.7,77.6 234.4,70.8 242.2,62.8 250.0,53.1 257.8,41.1 265.6,25.8"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,140.0 47.8,138.4 55.6,136.9 63.3,135.3 71.1,133.7 78.9,132.0 86.7,130.4 94.4,128.6 102.2,126.9 110.0,125.1 117.8,123.2 125.6,121.3 133.3,119.2 141.1,117.1 148.9,114.8 156.7,112.4 164.4,109.8 172.2,107.0 180.0,104.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="180.0,176.0 187.8,173.0 195.6,170.2 203.3,167.6 211.1,165.2 218.9,162.9 226.7,160.8 234.4,158.7 242.2,156.8 250.0,154.9 257.8,153.1 265.6,151.4 273.3,149.6 281.1,148.0 288.9,146.3 296.7,144.7 304.4,143.1 312.2,141.6 320.0,140.0"/>
  <line x1="180" y1="104" x2="180" y2="176" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="2 3"/>
  <text x="272" y="30" font-size="12" fill="#6c7a93">raw → ∞</text>
  <text x="200" y="192" font-size="12" fill="#1d6fd1">switched</text>
</svg>
```
:::

::: context retrograde Turning around to brake
A retrograde burn fires the engine against the direction of travel, to slow down — for a deorbit, or to lower one side of an orbit. A spacecraft that normally faces forward must turn about $180^\circ$ first, then turn back afterwards. Crewed capsules, cargo ships and satellites all do it routinely, which is why a representation that breaks at $180^\circ$ is not acceptable as the attitude state.
:::
