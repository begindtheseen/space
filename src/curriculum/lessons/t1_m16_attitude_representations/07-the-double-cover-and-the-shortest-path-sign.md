---
id: l07-the-double-cover-and-the-shortest-path-sign
title: The double cover and the shortest-path sign convention
minutes: 18
covers:
  - the double cover and the shortest-path sign convention
---

Lesson 06 ended with a group: the unit quaternions are the sphere $S^3$ in four dimensions, closed under multiplication, with the conjugate as inverse. But $S^3$ is not $SO(3)$. It has exactly twice as many points, and the map from one to the other sends both $q$ and $-q$ to the same rotation. This is the **double cover**, and it is not a blemish to be tidied away — it is a consequence of the topology of rotations, it is what makes quaternions work at all, and it has a price that every attitude controller and every attitude filter pays.

The price is concrete enough to name. A sign that flips where nobody looked turns a $1.5^\circ$ correction into a $358.5^\circ$ slew. It turns a $1^\circ/\mathrm{s}$ rotation in a telemetry log into an apparent $3599^\circ/\mathrm{s}$ spike. It turns the average of two attitudes one degree apart into an attitude $179^\circ$ away. None of those failures involves a wrong number anywhere; every quaternion in them is a correct representation of a correct attitude.

## Why $q$ and $-q$ are the same rotation

Two arguments, and each is worth having.

**From the half-angle.** A rotation through $\Phi$ about $\hat{\mathbf{e}}$ and a rotation through $\Phi + 360^\circ$ about the same axis are the same rotation. Their quaternions are

$$
\bigl[\cos\tfrac{\Phi}{2},\ \hat{\mathbf{e}}\sin\tfrac{\Phi}{2}\bigr]
\quad\text{and}\quad
\bigl[\cos(\tfrac{\Phi}{2}+180^\circ),\ \hat{\mathbf{e}}\sin(\tfrac{\Phi}{2}+180^\circ)\bigr]
= -\bigl[\cos\tfrac{\Phi}{2},\ \hat{\mathbf{e}}\sin\tfrac{\Phi}{2}\bigr].
$$

The half-angle turns a $360^\circ$ ambiguity in $\Phi$ into a sign ambiguity in $q$.

**From the matrix.** Every term of $\mathbf{C}(q) = (w^2-\mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times]$ is quadratic in the components, so replacing $q$ by $-q$ leaves the matrix unchanged: $\mathbf{C}(-q) = \mathbf{C}(q)$ identically, verified numerically to exactly zero. The same quadratic structure is why the sandwich product $q\otimes[0,\mathbf{v}]\otimes q^*$ is insensitive to the sign — the two conjugates each contribute one factor.

So the map $S^3\to SO(3)$ is two-to-one everywhere, with no exceptions and no fixed points. It is a **double cover**.

## What the topology is telling you

$SO(3)$ is what you get by taking $S^3$ and gluing every point to its antipode. That object has a name: real projective three-space, $\mathbb{RP}^3$. Equivalently, take the closed hemisphere $w\ge 0$ — every attitude has exactly one representative there, except on the equator $w = 0$, where $q$ and $-q$ are both on the boundary and must be identified.

The equator is the set of $180^\circ$ rotations. That is the one place where the shortest-path convention below cannot be made continuous, and it is the origin of the antipodal awkwardness that runs through the rest of this lesson.

The physical face of the same fact is the **plate trick**, or Dirac's belt trick. Hold a cup on your palm and rotate your arm through $360^\circ$; your arm is twisted and the configuration has not returned to where it started, even though the cup's orientation has. Continue a second $360^\circ$ in the same direction and the twist comes out. A $360^\circ$ rotation is a loop in $SO(3)$ that cannot be shrunk to a point; a $720^\circ$ rotation can. On the covering sphere the same statement is transparent: a $360^\circ$ turn is a path from $q$ to $-q$, which is not a closed loop on $S^3$ at all, while a $720^\circ$ turn goes from $q$ back to $q$ and can be contracted.

::: key The double cover and what it costs
$q$ and $-q$ map to the same rotation: the unit sphere $S^3$ covers $SO(3)$ twice, and $SO(3) \cong \mathbb{RP}^3$. Costs: a sign ambiguity that must be resolved — keep the scalar part non-negative — before differencing or interpolating, and a rank-deficient 4-parameter covariance, which is why filters estimate a 3-parameter error state.
:::

## The shortest-path convention

The convention is one line: **force $w \ge 0$**, negating the whole quaternion when it is not.

It is called the shortest-path convention because $w = \cos(\Phi/2)$, so $w\ge 0$ is equivalent to $\Phi \le 180^\circ$. Of the two ways round the same axis — $\Phi$ one way, $360^\circ - \Phi$ the other — it always names the shorter. Applied to an error quaternion, it guarantees that the rotation the controller sees is the one it should actually fly.

```python
def canonical(q):
    """Shortest-path representative: scalar part non-negative."""
    return -q if q[0] < 0.0 else q
```

Where to apply it: on every quaternion that will be differenced, interpolated, averaged, logged for later differentiation, or fed to a feedback law. Where not to apply it blindly: on a quaternion being integrated forward, because forcing the sign mid-propagation introduces a discontinuity in the state; integrate freely and canonicalise at the point of use.

The convention is discontinuous at $\Phi = 180^\circ$, and that is unavoidable. Watch the $z$ component of the canonical representative of a rotation about $\hat{\mathbf{z}}$ as $\Phi$ passes $180^\circ$: at $179.99^\circ$ it is $+1.00000000$; at $180.01^\circ$ it is $-1.00000000$. The attitude changed by two hundredths of a degree and the stored quaternion jumped to its antipode. Any code that assumes quaternion components are continuous in time will misbehave there, which is why $180^\circ$ error rotations deserve their own test case.

::: example A sign flip turns a correction into a slew
A spacecraft is $1.5^\circ$ off its commanded attitude about the body $z$ axis. The error quaternion is

$$
\delta q = [\,0.99991433,\ 0,\ 0,\ 0.0130896\,],
\qquad 2\arccos(w) = 1.500^\circ .
$$

The estimator, for reasons of its own, delivers $-\delta q = [-0.99991433,\ 0,\ 0,\ -0.0130896]$. It is the same attitude error — the two DCMs agree to exactly zero, and both have principal angle $1.500^\circ$. But a routine that reads the angle as $2\arccos(w)$ now returns $358.500^\circ$, and, worse, a feedback law of the form $\boldsymbol{\tau} = -K\,\delta\mathbf{q}_v - D\,\boldsymbol{\omega}$ sees a vector part of the opposite sign. With $K = 0.4$, the commanded torque about $z$ goes from $-0.005236$ to $+0.005236\,\mathrm{N\,m}$: the controller drives the vehicle away from the target, all the way around.

Cost it. Take $J = 1200\,\mathrm{kg\,m^2}$, a wheel torque limit of $0.20\,\mathrm{N\,m}$ giving $1.667\times 10^{-4}\,\mathrm{rad/s^2}$, and a rate limit of $0.5^\circ/\mathrm{s}$.

| Path | Angle | Time | Peak rate | Peak wheel momentum |
| --- | --- | --- | --- | --- |
| Short | $1.5^\circ$ | $25.1\,\mathrm{s}$ | $0.1197^\circ/\mathrm{s}$ | $2.51\,\mathrm{N\,m\,s}$ |
| Long | $358.5^\circ$ | $769.4\,\mathrm{s}$ | $0.5000^\circ/\mathrm{s}$ | $10.47\,\mathrm{N\,m\,s}$ |

Thirteen minutes instead of twenty-five seconds, and four times the wheel momentum — enough to saturate a wheel sized for the short path. On a vehicle that must hold an antenna on a ground station or a radiator away from the Sun, a $358.5^\circ$ excursion is not a slow correction; it is a loss of the attitude constraint for a quarter of an hour.
:::

::: example Sign flips in logged data
A vehicle rotates at a steady $1^\circ/\mathrm{s}$ about $\hat{\mathbf{z}}$ and its attitude is logged at $10\,\mathrm{Hz}$. Two consecutive samples differ by $\delta q = q_2\otimes q_1^{*} = [0.99999962,\ 0,\ 0,\ 0.00087266]$, whose angle is $0.10000^\circ$, giving a rate of $1.00000^\circ/\mathrm{s}$. Correct.

Now suppose the second sample was stored as $-q_2$. Then $\delta q = [-0.99999962,\ 0,\ 0,\ -0.00087266]$, and a routine computing $2\arccos(w)$ reports $359.900^\circ$ over $0.1\,\mathrm{s}$: an apparent rate of $3599^\circ/\mathrm{s}$, ten revolutions per second. Applying the shortest-path convention to $\delta q$ before reading the angle recovers $0.10000^\circ$ and $1.00000^\circ/\mathrm{s}$ exactly.

Averaging is worse, because the failure is quiet. Take two attitudes $0^\circ$ and $2^\circ$ about $\hat{\mathbf{z}}$ and average the components. Consistently signed, the mean is $[0.99992385,\ 0,\ 0,\ 0.00872620]$ with norm $0.99996$, and normalising gives $1.000^\circ$ — the right answer, because for small separations componentwise averaging is a good approximation. Flip the sign of the second sample and the mean becomes $[0.00007615,\ 0,\ 0,\ -0.00872620]$, with norm $0.008727$. Normalised, it is a rotation of $179.000^\circ$ about $-\hat{\mathbf{z}}$.

The collapsed norm is the tell. Two unit quaternions one degree apart average to something of norm very close to $1$; across a sign flip the norm falls toward zero, and exactly at $q$ and $-q$ the average is the zero vector, which has no normalisation at all. Checking the norm of a componentwise mean is a cheap guard, and canonicalising every sample against the first one is the fix.
:::

## The second cost: a rank-deficient covariance

An estimator wants a covariance matrix for its state. Carry a quaternion as four estimated numbers and the covariance is $4\times 4$ — and it is necessarily singular.

The reason is the constraint. The state is confined to $\lVert q\rVert = 1$, a three-dimensional surface in four-dimensional space, so there is no uncertainty in the direction normal to that surface. Linearising the constraint about the estimate gives $q^\top\delta q = 0$, so any admissible perturbation is orthogonal to $q$, and the covariance satisfies $\mathbf{P}q = \mathbf{0}$: it has a zero eigenvalue with eigenvector $q$. A Kalman update that inverts an innovation covariance built from a singular $\mathbf{P}$ is working with a matrix that is singular in exact arithmetic and arbitrarily ill-conditioned in floating point.

The double cover compounds it. Even restricted to the sphere, the state has two representatives, so any probability density over quaternions that is to describe one attitude must be either symmetric under $q\to -q$ — in which case its mean is zero and useless — or arbitrarily restricted to a hemisphere, with a discontinuity at the boundary.

The standard resolution is the **multiplicative** formulation: carry the full attitude as a unit quaternion outside the filter's linear algebra, and estimate a small three-parameter error — a rotation vector or a set of modified Rodrigues parameters — multiplicatively against it. The error state has no constraint and no sign ambiguity because it is always small, so its $3\times 3$ covariance is honest. Lesson 12 develops this, and lesson 09 supplies the three-parameter sets it uses.

::: warning The sign guard belongs at the point of use, not once at the top
It is tempting to canonicalise every quaternion as soon as it appears and consider the problem solved. It is not enough, because the sign that matters is the sign of a *product*. Two canonical quaternions can have a non-canonical difference: if $q_{\text{cmd}}$ and $q_{\text{est}}$ both have $w \ge 0$ but are more than $180^\circ$ apart, then $\delta q = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ has $w < 0$ and must be negated in its own right. The guard goes immediately before every difference, interpolation or average, on the quantity being used.
:::

::: warning $2\arccos(w)$ is not the principal angle unless the sign has been fixed
The formula $\Phi = 2\arccos(w)$ returns a value in $[0^\circ, 360^\circ]$ and faithfully reports $358.5^\circ$ for a $1.5^\circ$ error stored with a negative scalar. Two safer forms: canonicalise first, or use $\Phi = 2\arcsin\lVert\mathbf{v}\rVert$, which is sign-insensitive in the vector part's norm and, as lesson 04 noted, far better conditioned for small angles. For a small error quaternion, $\Phi \approx 2\lVert\mathbf{v}\rVert$ to within a part in $10^6$ below $1^\circ$.
:::

::: note The cover is a feature, not only a cost
Without the double cover there would be no smooth singularity-free representation at all. $SO(3)$ is not a sphere and cannot be given a global coordinate system; $S^3$ is a sphere, is a group, and maps onto $SO(3)$ smoothly and evenly. The price of that smoothness is exactly one sign, and a sign is something a program can manage. A singularity is not.
:::

## Check yourself

::: check
Show that $\mathbf{C}(-q) = \mathbf{C}(q)$ without evaluating the matrix, using only the sandwich product.
:::

::: answer
The rotation acts as $[0,\mathbf{v}'] = q\otimes[0,\mathbf{v}]\otimes q^{*}$. Replace $q$ by $-q$: the conjugate of $-q$ is $-q^{*}$, so the sandwich becomes $(-q)\otimes[0,\mathbf{v}]\otimes(-q^{*})$. Quaternion multiplication is linear in each argument, so the two minus signs come out front and multiply to $+1$, leaving $q\otimes[0,\mathbf{v}]\otimes q^{*}$ unchanged. Every vector is mapped identically, so the two matrices are equal. The same observation explains why the double cover is exactly two-to-one and not more: a scalar $\lambda$ satisfies $\lambda^2 = 1$ only for $\lambda = \pm 1$.
:::

::: check
An error quaternion is $[-0.7071,\ 0,\ 0.7071,\ 0]$. What is the attitude error, and what would an unguarded controller do?
:::

::: answer
Canonicalise: negate to $[0.7071,\ 0,\ -0.7071,\ 0]$. The scalar is $\cos(\Phi/2) = 0.7071$, so $\Phi = 2\times 45^\circ = 90^\circ$, about the axis $\mathbf{v}/\lVert\mathbf{v}\rVert = (0,-1,0)$. So the true error is a $90^\circ$ rotation about $-\hat{\mathbf{y}}$. Unguarded, a routine reading $2\arccos(-0.7071)$ reports $270^\circ$, and a proportional law using the raw vector part $(0, +0.7071, 0)$ commands torque in the opposite sense, driving the vehicle the $270^\circ$ way round. This is the worst practical case short of the $180^\circ$ boundary: three times the angle and three times the momentum.
:::

::: check
Why is the shortest-path convention necessarily discontinuous, and where?
:::

::: answer
The convention picks the representative with $w \ge 0$, which is a closed hemisphere of $S^3$. Every attitude has exactly one representative in the open hemisphere $w > 0$, but on the equator $w = 0$ both $q$ and $-q$ qualify, and they are different points. So the choice cannot be made continuously across $w = 0$, which corresponds to $\Phi = 180^\circ$. Concretely, for rotations about $\hat{\mathbf{z}}$, the canonical representative has $z$ component $+1.00000000$ at $\Phi = 179.99^\circ$ and $-1.00000000$ at $\Phi = 180.01^\circ$. The underlying reason is topological: $SO(3)$ is $\mathbb{RP}^3$ and no continuous global section of the double cover exists.
:::

::: check
An estimator reports a $4\times 4$ quaternion covariance whose smallest eigenvalue is $3\times 10^{-19}$ while the others are near $10^{-8}$. Is this a numerical problem or a modelling one?
:::

::: answer
Modelling. The unit-norm constraint confines the state to a three-dimensional surface, so the covariance must have a zero eigenvalue in the direction normal to it — that is, with eigenvector $q$ itself. The reported $3\times 10^{-19}$ is that structural zero, filled in by round-off, and the ratio $3\times 10^{-19}$ to $10^{-8}$ is a condition number near $3\times 10^{10}$. Adding process noise to hide it corrupts the other directions; inverting it produces garbage. The correct response is to stop estimating four constrained parameters and estimate a three-parameter error state multiplicatively instead, which is what lesson 12 builds.
:::

::: check
Two flight computers exchange attitude at $1\,\mathrm{Hz}$. One always canonicalises before transmitting, the other does not canonicalise on receipt. The vehicle slowly rotates through a $180^\circ$ error relative to the reference. What does the receiver see, and what should it do?
:::

::: answer
As the error passes $180^\circ$, the transmitter's canonical representative jumps to its antipode, so the received quaternion's components flip sign between one sample and the next while the attitude changes by a fraction of a degree. The receiver, differencing consecutive samples without a guard, sees a near-$360^\circ$ apparent rotation in one second and reports a rate spike of order $360^\circ/\mathrm{s}$. The fix at the receiver is to canonicalise each incoming sample *relative to the previous one*: negate $q_k$ if $q_k\cdot q_{k-1} < 0$, which keeps the logged series continuous through the boundary and leaves every attitude unchanged. That is the same dot-product guard SLERP uses, which is the next lesson.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{C}(-q) = \mathbf{C}(q)$ | $q$ and $-q$ are the same rotation; the map $S^3\to SO(3)$ is two-to-one |
| Half-angle origin | $\Phi$ and $\Phi + 360^\circ$ give $q$ and $-q$ |
| $SO(3)\cong \mathbb{RP}^3$ | $S^3$ with antipodes identified; a $360^\circ$ loop is not contractible, $720^\circ$ is |
| Shortest path | Force $w\ge 0$, equivalent to $\Phi\le 180^\circ$; negate the whole quaternion |
| Discontinuity | At $w = 0$, that is $\Phi = 180^\circ$; unavoidable |
| $\Phi = 2\arcsin\lVert\mathbf{v}\rVert$ | Sign-insensitive and well conditioned for small angles |
| Relative guard | Negate $q_k$ when $q_k\cdot q_{k-1} < 0$ to keep a series continuous |
| $\mathbf{P}q = \mathbf{0}$ | A $4$-parameter quaternion covariance is structurally rank-deficient |
| Worked figures | $1.5^\circ$ error read as $358.5^\circ$: $769\,\mathrm{s}$ instead of $25\,\mathrm{s}$, $10.47$ instead of $2.51\,\mathrm{N\,m\,s}$ |
| Worked figures | Sign flip between $10\,\mathrm{Hz}$ samples: $3599^\circ/\mathrm{s}$ apparent rate; averaging across one gives $179^\circ$ |

The sign guard has appeared twice now, and the next lesson is where it earns its name: interpolating between two attitudes along the shorter arc of the sphere.
