---
id: l09-rodrigues-parameters-and-the-mrp-shadow-set
title: Classical and modified Rodrigues parameters, and the MRP shadow set
minutes: 19
covers:
  - classical and modified Rodrigues parameters, and the MRP shadow set
---

Euler angles spend three parameters and put the singularity in the middle of the flight envelope. Quaternions spend four and have no singularity but carry a constraint and a sign ambiguity. Between the two sit the Rodrigues parameter sets: three numbers, no constraint, no trigonometry in any of their formulas, and a singularity that can be pushed somewhere you never go.

There are two of them. The **classical Rodrigues parameters**, also called the Gibbs vector, take the tangent of the half-angle and blow up at $180^\circ$ — too close to be useful for a general-purpose attitude state, though their composition rule is the most elegant in the subject. The **modified Rodrigues parameters**, or MRPs, take the tangent of the quarter-angle and blow up only at a full $360^\circ$ turn, and they come with a trick — the shadow set — that removes even that. MRPs are the standard three-parameter attitude error state in spacecraft filters and in a good deal of nonlinear attitude control, and they are the reason a filter can carry a $3\times 3$ covariance honestly.

Conventions are those of lesson 05: unit, scalar-first, Hamilton, $q = [w,\mathbf{v}] = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$, with $\mathbf{C}(q) = (w^2-\mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times]$.

## Classical Rodrigues parameters

Divide the vector part of the quaternion by its scalar part:

$$
\mathbf{g} = \frac{\mathbf{v}}{w} = \hat{\mathbf{e}}\,\tan\frac{\Phi}{2}.
$$

Three numbers, no constraint — any $\mathbf{g}\in\mathbb{R}^3$ is a valid attitude. The direction of $\mathbf{g}$ is the principal axis and its magnitude is $\tan(\Phi/2)$, so the angle comes back as $\Phi = 2\arctan\lVert\mathbf{g}\rVert$.

The division by $w$ is the whole story. At $\Phi = 180^\circ$, $w = 0$ and $\mathbf{g}$ is infinite; the parameters diverge, and they do it fast. Watch $\tan(\Phi/2)$ approach the wall:

| $\Phi$ | $45^\circ$ | $90^\circ$ | $120^\circ$ | $150^\circ$ | $179^\circ$ | $179.9^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| $\lVert\mathbf{g}\rVert$ | $0.4142$ | $1.0000$ | $1.7321$ | $3.7321$ | $114.589$ | $1145.92$ |

A tenth of a degree from the singularity, the parameters are already of order $10^3$, and their sensitivity — $d\lVert\mathbf{g}\rVert/d\Phi = \tfrac12\sec^2(\Phi/2)$ — is of order $10^6$ per radian. Any $180^\circ$ manoeuvre, which is the worst-case slew a spacecraft has to be sized for, passes straight through the hole.

The DCM comes out rational. Substituting $\mathbf{v} = w\mathbf{g}$ and $w^2 = 1/(1 + \mathbf{g}^\top\mathbf{g})$, which follows from $w^2 + \mathbf{v}^\top\mathbf{v} = 1$,

$$
\mathbf{C}(\mathbf{g}) = \frac{(1 - \mathbf{g}^\top\mathbf{g})\mathbf{I}_3 + 2\,\mathbf{g}\mathbf{g}^\top + 2\,[\mathbf{g}\times]}{1 + \mathbf{g}^\top\mathbf{g}} .
$$

No sines, no cosines, no square roots — arithmetic only. Equivalently, it is the **Cayley transform** of the skew matrix $[\mathbf{g}\times]$:

$$
\mathbf{C} = (\mathbf{I}_3 + [\mathbf{g}\times])(\mathbf{I}_3 - [\mathbf{g}\times])^{-1},
\qquad
[\mathbf{g}\times] = (\mathbf{C} - \mathbf{I}_3)(\mathbf{C} + \mathbf{I}_3)^{-1},
$$

both verified numerically to $10^{-15}$. The inverse form fails exactly when $\mathbf{C} + \mathbf{I}_3$ is singular, which is when $\mathbf{C}$ has eigenvalue $-1$, which is $\Phi = 180^\circ$ again.

Composition is where the Gibbs vector earns its keep. From $q_1\otimes q_2$, the scalar part is $w_1w_2(1 - \mathbf{g}_1\cdot\mathbf{g}_2)$ and the vector part is $w_1w_2(\mathbf{g}_1 + \mathbf{g}_2 + \mathbf{g}_1\times\mathbf{g}_2)$, so the common factor cancels in the ratio:

$$
\mathbf{g}_{1\oplus 2} = \frac{\mathbf{g}_1 + \mathbf{g}_2 + \mathbf{g}_1\times\mathbf{g}_2}{1 - \mathbf{g}_1\cdot\mathbf{g}_2} .
$$

Composing two rotations takes one cross product, one dot product and a division. There is no shorter rule anywhere in this module.

::: key Classical and modified Rodrigues parameters
CRP (Gibbs): $\mathbf{g} = \hat{\mathbf{e}}\tan(\Phi/2) = \mathbf{v}/w$, singular at $\Phi = 180^\circ$. MRP: $\boldsymbol{\sigma} = \hat{\mathbf{e}}\tan(\Phi/4)$, singular only at $\Phi = 360^\circ$, and $\boldsymbol{\sigma} = \mathbf{q}_v/(1 + w)$.
:::

## Modified Rodrigues parameters

Halve the angle once more before taking the tangent:

$$
\boldsymbol{\sigma} = \hat{\mathbf{e}}\,\tan\frac{\Phi}{4} = \frac{\mathbf{v}}{1 + w},
\qquad
\Phi = 4\arctan\lVert\boldsymbol{\sigma}\rVert .
$$

The second form follows from the half-angle identity $\tan(\theta/2) = \sin\theta/(1+\cos\theta)$ applied with $\theta = \Phi/2$. Dividing by $1 + w$ rather than $w$ moves the singularity from $w = 0$ to $w = -1$ — from $\Phi = 180^\circ$ to $\Phi = 360^\circ$. Going back,

$$
w = \frac{1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma}}{1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma}},
\qquad
\mathbf{v} = \frac{2\boldsymbol{\sigma}}{1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma}},
$$

and the rotation matrix, again with no transcendental functions,

$$
\mathbf{C}(\boldsymbol{\sigma}) = \mathbf{I}_3 + \frac{8\,[\boldsymbol{\sigma}\times]^2 + 4\,(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\,[\boldsymbol{\sigma}\times]}{(1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma})^2}.
$$

All of these were checked against the quaternion route over $500$ random rotations, agreeing to $1.0\times 10^{-15}$.

The magnitudes are far better behaved than the Gibbs vector's. Since $\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$, a $180^\circ$ rotation has $\lVert\boldsymbol{\sigma}\rVert = \tan 45^\circ = 1$ exactly. The unit ball is therefore the set of rotations of at most $180^\circ$ — the whole of $SO(3)$, once.

## The shadow set

Every attitude has two principal descriptions: $\Phi$ about $\hat{\mathbf{e}}$, and $360^\circ - \Phi$ about $-\hat{\mathbf{e}}$. They correspond to the two quaternions $q$ and $-q$ of lesson 07, and therefore to two MRP vectors. Substituting $-q$ into $\boldsymbol{\sigma} = \mathbf{v}/(1+w)$ and simplifying with $w^2 + \mathbf{v}^\top\mathbf{v} = 1$ gives the second one:

$$
\boldsymbol{\sigma}^{S} = -\frac{\boldsymbol{\sigma}}{\boldsymbol{\sigma}^\top\boldsymbol{\sigma}},
$$

the **shadow set**. Two consequences follow immediately.

- $\lVert\boldsymbol{\sigma}\rVert\,\lVert\boldsymbol{\sigma}^{S}\rVert = 1$ exactly, verified across the whole range. So of the two descriptions, exactly one lies inside the unit ball, unless both are on its surface at $\Phi = 180^\circ$.
- $\mathbf{C}(\boldsymbol{\sigma}^{S}) = \mathbf{C}(\boldsymbol{\sigma})$: the shadow is the same attitude, not a different one. Checked to $10^{-15}$.

The rule is then one line: **whenever $\lVert\boldsymbol{\sigma}\rVert > 1$, replace $\boldsymbol{\sigma}$ by $\boldsymbol{\sigma}^{S}$**. The stored parameters never leave the unit ball, so $\lVert\boldsymbol{\sigma}\rVert$ never approaches the infinity at $\Phi = 360^\circ$, and the singularity is permanently out of reach.

```python
import numpy as np

def mrp_from_quat(q):
    """MRP from a unit scalar-first quaternion, always inside the unit ball."""
    s = np.asarray(q[1:]) / (1.0 + q[0])
    n2 = float(s @ s)
    return -s / n2 if n2 > 1.0 else s        # shadow-set switch
```

::: key The MRP shadow set
$\boldsymbol{\sigma}^{S} = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ describes the same attitude via the other principal rotation. Switching whenever $\lVert\boldsymbol{\sigma}\rVert > 1$ keeps the parameters bounded by $1$ and pushes the singularity permanently out of reach.
:::

::: example Walking an MRP all the way round
Rotate about $\hat{\mathbf{z}}$ and watch the single non-zero component of $\boldsymbol{\sigma}$ as the angle goes from $0^\circ$ to $720^\circ$, with and without the shadow switch.

| $\Phi$ | $90^\circ$ | $150^\circ$ | $180^\circ$ | $210^\circ$ | $270^\circ$ | $330^\circ$ | $360^\circ$ | $450^\circ$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| raw $\sigma_z$ | $0.41421$ | $0.76733$ | $1.00000$ | $1.30323$ | $2.41421$ | $7.59575$ | $\infty$ | $-2.41421$ |
| switched $\sigma_z$ | $0.41421$ | $0.76733$ | $1.00000$ | $-0.76733$ | $-0.41421$ | $-0.13165$ | $0.00000$ | $0.41421$ |

The raw parameters climb to $7.6$ by $330^\circ$ and are undefined at $360^\circ$, where $w = -1$. The switched parameters reach $1$ at $180^\circ$, jump to $-0.76733$ — the same attitude read as $150^\circ$ about $-\hat{\mathbf{z}}$ — and walk back down to zero at $360^\circ$, which is the identity, as it should be.

Two things to notice. The switch is a discontinuity in the *parameters* at $\lVert\boldsymbol{\sigma}\rVert = 1$, not in the attitude, and it is the same $180^\circ$ boundary where the quaternion's shortest-path convention had to jump in lesson 07: the two are the same topological obstruction wearing different clothes. And the switched trajectory never exceeds $1$, so the largest number any MRP-based propagator ever has to handle is $1$, against the $\tan(\Phi/2)$ of a Gibbs vector, which is unbounded well inside the normal flight envelope.
:::

::: example Why a filter error state prefers MRPs
Compare the three-parameter candidates as approximations to the rotation vector $\boldsymbol{\phi} = \Phi\hat{\mathbf{e}}$, which is the quantity a linearised filter is really estimating. For small $\Phi$: $\mathbf{q}_v \approx \boldsymbol{\phi}/2$, $\mathbf{g}\approx\boldsymbol{\phi}/2$, $\boldsymbol{\sigma}\approx\boldsymbol{\phi}/4$. All three are linear to first order; the question is how quickly they stop being.

| $\Phi$ | $\lVert\mathbf{q}_v\rVert$ | $\lVert\mathbf{g}\rVert$ | $\lVert\boldsymbol{\sigma}\rVert$ | $\Phi/2$ (rad) | $\Phi/4$ (rad) |
| --- | --- | --- | --- | --- | --- |
| $0.1^\circ$ | $0.00087266$ | $0.00087266$ | $0.00043633$ | $0.00087266$ | $0.00043633$ |
| $1^\circ$ | $0.00872654$ | $0.00872687$ | $0.00436335$ | $0.00872665$ | $0.00436332$ |
| $5^\circ$ | $0.04361939$ | $0.04366094$ | $0.02182008$ | $0.04363323$ | $0.02181662$ |
| $20^\circ$ | $0.17364818$ | $0.17632698$ | $0.08748866$ | $0.17453293$ | $0.08726646$ |

At $20^\circ$ — a large attitude error, far beyond what a converged filter sees — the MRP is within $0.255\%$ of the linear prediction $\Phi/4$, the quaternion vector part within $0.507\%$, and the Gibbs vector within $1.028\%$. The MRP's departure from linearity is a quarter of the Gibbs vector's and half the quaternion's, for the arithmetic reason that its argument is a quarter of the angle rather than a half, and $\tan x - x \approx x^3/3$.

That is the practical case for MRPs as an error state: three unconstrained parameters, no sign ambiguity while the error stays small, an honest $3\times 3$ covariance, a singularity that the shadow rule makes unreachable, and the mildest nonlinearity of the three candidates. Lesson 12 assembles this into an attitude error representation.
:::

::: example A slew through the Gibbs singularity
A spacecraft must turn $180^\circ$ to point an antenna the other way. Plan the manoeuvre as a constant-rate principal-axis rotation about $\hat{\mathbf{z}}$ at $0.5^\circ/\mathrm{s}$ and ask what each representation reports at $0.2\,\mathrm{s}$ intervals near the halfway point.

At $\Phi = 179.9^\circ$ the Gibbs vector is $\lVert\mathbf{g}\rVert = 1145.92$; at $179.99^\circ$ it is $11459.2$; at $180^\circ$ it is not a number. In the $0.2\,\mathrm{s}$ step spanning $179.95^\circ$ to $180.05^\circ$, $\mathbf{g}$ goes from $+2291.8$ to $-2291.8$ along $\hat{\mathbf{z}}$ — a swing of $4583.7$ in one control cycle for a vehicle turning a tenth of a degree.

The MRP over the same interval moves from $\sigma_z = 0.99956$ to $1.00044$, triggers the shadow switch, and continues from $\sigma_z = -0.99956$. The parameters change by $2.0$ at the switch — a genuine discontinuity, which any code differentiating $\boldsymbol{\sigma}$ must detect — but they remain of order $1$ throughout, and the attitude they describe is continuous to machine precision on both sides.

The quaternion, meanwhile, passes $180^\circ$ with $w$ crossing zero and nothing else happening at all: $[0.00044,\ 0,\ 0,\ 1.00000]$ to $[-0.00044,\ 0,\ 0,\ 1.00000]$. This is the ranking the module keeps arriving at — quaternion for the state, MRP for the error, Gibbs for algebra, Euler angles for display.
:::

::: warning The shadow switch is a jump in the state, and the code must know it
A controller or filter differentiating $\boldsymbol{\sigma}$ numerically, or a logger plotting it, will see a step of magnitude $2/\lVert\boldsymbol{\sigma}\rVert$ at the switch. The derivative must be recomputed from the new branch rather than differenced across the boundary, and a covariance carried in $\boldsymbol{\sigma}$ must be transformed by the Jacobian of the shadow map, not left alone. Implementations that switch silently inside a getter and hand the result to a differencing consumer produce a rate spike at exactly $180^\circ$ of attitude error — the same failure shape as the quaternion sign flip of lesson 07, from the same cause.
:::

::: warning Rodrigues parameters are not "small-angle quaternions"
The relations $\mathbf{g}\approx\boldsymbol{\phi}/2$ and $\boldsymbol{\sigma}\approx\boldsymbol{\phi}/4$ hold only to first order, and the factors of $2$ and $4$ are frequently mixed up. A feedback gain tuned against $\mathbf{q}_v$ and then applied to $\boldsymbol{\sigma}$ without rescaling is a factor of two too small; applied to $\mathbf{g}$ it is correct to first order and increasingly wrong beyond it. Write down which parameter the gain multiplies, in units, before tuning anything.
:::

## Check yourself

::: check
An MRP vector is $\boldsymbol{\sigma} = (0.2,\ -0.4,\ 0.4)$. Find the principal axis and angle, and the corresponding quaternion.
:::

::: answer
$\lVert\boldsymbol{\sigma}\rVert = \sqrt{0.04 + 0.16 + 0.16} = \sqrt{0.36} = 0.6$, which is inside the unit ball, so no shadow switch is needed. The angle is $\Phi = 4\arctan 0.6 = 4\times 30.9638^\circ = 123.855^\circ$, and the axis is $\boldsymbol{\sigma}/\lVert\boldsymbol{\sigma}\rVert = (0.3333, -0.6667, 0.6667)$. For the quaternion, $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 0.36$, so $w = (1-0.36)/(1+0.36) = 0.64/1.36 = 0.470588$ and $\mathbf{v} = 2(0.2,-0.4,0.4)/1.36 = (0.294118, -0.588235, 0.588235)$. Check: $w^2 + \mathbf{v}^\top\mathbf{v} = 0.221453 + 0.778547 = 1.000000$, and $2\arccos(0.470588) = 123.855^\circ$ as expected.
:::

::: check
Show that $\lVert\boldsymbol{\sigma}\rVert\lVert\boldsymbol{\sigma}^{S}\rVert = 1$, and explain why that guarantees one of the pair is always inside the unit ball.
:::

::: answer
$\boldsymbol{\sigma}^{S} = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$, so $\lVert\boldsymbol{\sigma}^{S}\rVert = \lVert\boldsymbol{\sigma}\rVert/\lVert\boldsymbol{\sigma}\rVert^2 = 1/\lVert\boldsymbol{\sigma}\rVert$, and the product is $1$. Since the two norms are reciprocals, either both equal $1$ or one is strictly less than $1$ and the other strictly greater. So at every attitude except the $180^\circ$ set, exactly one representative lies strictly inside the unit ball, and the switching rule selects it. In terms of the angle, $\tan(\Phi/4)\tan\bigl((360^\circ-\Phi)/4\bigr) = \tan(\Phi/4)\tan(90^\circ - \Phi/4) = \tan(\Phi/4)\cot(\Phi/4) = 1$, the same statement in trigonometry.
:::

::: check
Compose a $60^\circ$ rotation about $\hat{\mathbf{x}}$ with a $60^\circ$ rotation about $\hat{\mathbf{y}}$ using the Gibbs composition rule, and read off the resulting principal angle.
:::

::: answer
$\tan 30^\circ = 0.577350$, so $\mathbf{g}_1 = (0.577350, 0, 0)$ and $\mathbf{g}_2 = (0, 0.577350, 0)$. The dot product is $0$, so the denominator is $1 - 0 = 1$. The cross product is $\mathbf{g}_1\times\mathbf{g}_2 = (0, 0, 0.577350^2) = (0,0,0.333333)$. So $\mathbf{g} = (0.577350,\ 0.577350,\ 0.333333)$, with norm $\sqrt{0.333333+0.333333+0.111111} = \sqrt{0.777778} = 0.881917$. Then $\Phi = 2\arctan(0.881917) = 2\times 41.4096^\circ = 82.819^\circ$, about the axis $(0.654654, 0.654654, 0.377964)$. Two $60^\circ$ turns give an $82.8^\circ$ turn — principal angles do not add, as lesson 04 warned, and the whole calculation used one multiplication table and a division.
:::

::: check
Why does a filter that estimates MRPs as its error state never need the shadow set in normal operation, and when might it need it anyway?
:::

::: answer
A converged filter's attitude error is small — arcseconds to a few degrees — so $\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$ is of order $10^{-5}$ to $10^{-2}$, nowhere near $1$. The error state is reset to zero after each update, so it never accumulates. The shadow set matters in the cases that are not normal operation: initial acquisition from an unknown attitude, where the first error can be anything up to $180^\circ$; recovery after a safe-mode entry or a tumble; and any use of MRPs as the *global* attitude state rather than the error, which some nonlinear controllers do deliberately because a bounded three-parameter state is convenient for stability proofs. In all three, $\lVert\boldsymbol{\sigma}\rVert$ can exceed $1$ and the switch is what keeps the numbers finite.
:::

::: check
A colleague proposes using classical Rodrigues parameters as the attitude state because the composition rule is so cheap. Give the argument against, quantitatively.
:::

::: answer
The singularity at $\Phi = 180^\circ$ is inside the operating envelope, not outside it. Any $180^\circ$ slew — pointing an antenna the other way, flipping for a retrograde burn, recovering from an inverted attitude — passes through it. And the approach is violent: $\lVert\mathbf{g}\rVert = \tan(\Phi/2)$ is $3.73$ at $150^\circ$, $114.6$ at $179^\circ$ and $1145.9$ at $179.9^\circ$, with sensitivity $\tfrac12\sec^2(\Phi/2)$ reaching $6.6\times 10^{5}$ per radian at $179.9^\circ$. At a modest $0.5^\circ/\mathrm{s}$ slew rate, the parameters swing from $+2292$ to $-2292$ within a single $0.2\,\mathrm{s}$ control cycle. No gain schedule, integrator or numerical differentiation survives that. Use MRPs, which cost one extra division in the conversion and bound the state by $1$, or a quaternion.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{g} = \mathbf{v}/w = \hat{\mathbf{e}}\tan(\Phi/2)$ | Classical Rodrigues (Gibbs) parameters; singular at $\Phi = 180^\circ$ |
| $\mathbf{C}(\mathbf{g}) = \bigl[(1-\mathbf{g}^\top\mathbf{g})\mathbf{I}_3 + 2\mathbf{g}\mathbf{g}^\top + 2[\mathbf{g}\times]\bigr]/(1+\mathbf{g}^\top\mathbf{g})$ | Rational, no trigonometry |
| $\mathbf{C} = (\mathbf{I}_3+[\mathbf{g}\times])(\mathbf{I}_3-[\mathbf{g}\times])^{-1}$ | Cayley transform form |
| $\mathbf{g}_{1\oplus 2} = (\mathbf{g}_1+\mathbf{g}_2+\mathbf{g}_1\times\mathbf{g}_2)/(1-\mathbf{g}_1\cdot\mathbf{g}_2)$ | Cheapest composition rule in the module |
| $\boldsymbol{\sigma} = \mathbf{v}/(1+w) = \hat{\mathbf{e}}\tan(\Phi/4)$ | Modified Rodrigues parameters; singular only at $\Phi = 360^\circ$ |
| $w = (1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma})/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$, $\mathbf{v} = 2\boldsymbol{\sigma}/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ | Back to the quaternion |
| $\mathbf{C}(\boldsymbol{\sigma}) = \mathbf{I}_3 + \bigl(8[\boldsymbol{\sigma}\times]^2 + 4(1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma})[\boldsymbol{\sigma}\times]\bigr)/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})^2$ | MRP to DCM |
| $\boldsymbol{\sigma}^{S} = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ | Shadow set; $\lVert\boldsymbol{\sigma}\rVert\lVert\boldsymbol{\sigma}^{S}\rVert = 1$; switch when $\lVert\boldsymbol{\sigma}\rVert > 1$ |
| $\lVert\boldsymbol{\sigma}\rVert = 1$ | The $180^\circ$ boundary; $\Phi = 4\arctan\lVert\boldsymbol{\sigma}\rVert$ |
| Small angle | $\mathbf{q}_v\approx\boldsymbol{\phi}/2$, $\mathbf{g}\approx\boldsymbol{\phi}/2$, $\boldsymbol{\sigma}\approx\boldsymbol{\phi}/4$ |
| Worked figures | At $20^\circ$: MRP within $0.255\%$ of linear, quaternion $0.507\%$, Gibbs $1.028\%$ |

Five representations are now on the table. The next lesson puts every conversion between them in one place, with the branch selection that makes the DCM-to-quaternion step safe at every angle.
