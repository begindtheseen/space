---
id: l11-the-multiplicative-ekf-for-attitude
title: The Multiplicative EKF for attitude
minutes: 24
covers:
  - 'The Multiplicative EKF for attitude: the 3-parameter attitude error, covariance on the tangent space'
---

Stand on a basketball — well, imagine an ant standing on one. The ant can walk anywhere on the surface, but it can never leave it. Now suppose someone tells the ant "move $3\,\mathrm{cm}$ east" and does it with a ruler held flat: the ruler's tip sticks out into the air, a little above the ball. To get the ant back onto the ball, you have to squash the point back down. The ball's surface is curved, and straight-line steps do not stay on it.

A spacecraft's attitude has the same problem. This lesson stores attitude as a unit quaternion, in the Hamilton, scalar-first convention fixed in the attitude-representations module: $\mathbf q = (q_w, q_x, q_y, q_z)$ with $\|\mathbf q\| = 1$. Four numbers, but only three **[[degrees of freedom|degrees-of-freedom]]**, because the length must be exactly $1$. The unit quaternions form a **[[sphere in four dimensions|unit-sphere]]**, and the attitude is the ant: it lives *on* the sphere. The ordinary Kalman update $\hat{\mathbf x}+\mathbf K\boldsymbol\nu$ is the flat ruler. It knows nothing about the sphere.

This lesson makes that failure precise, measures what it costs, and builds the standard fix: the **Multiplicative Extended Kalman Filter**, or **MEKF**. It is the error-state filter of the previous lesson, applied to the one state that truly needs it. It is also what the module's final exercise asks you to build from scratch, and it flies on a great many spacecraft, fusing a gyro with a **[[star tracker|star-tracker]]**, sun sensor or magnetometer.

## Why a quaternion cannot be an additive Kalman state

Start from the rule every valid attitude obeys: $\mathbf q^{\mathsf T}\mathbf q = 1$. (Here $\mathbf q^{\mathsf T}\mathbf q$ is the dot product of $\mathbf q$ with itself: the squared length.) Now nudge the quaternion by a tiny $\delta\mathbf q$ that keeps it on the sphere. The length must still be $1$:

$$
(\mathbf q+\delta\mathbf q)^{\mathsf T}(\mathbf q+\delta\mathbf q) = \mathbf q^{\mathsf T}\mathbf q + 2\,\mathbf q^{\mathsf T}\delta\mathbf q + \delta\mathbf q^{\mathsf T}\delta\mathbf q = 1.
$$

The first term is $1$, and the last one is tiny squared, so it drops out. What is left is $2\,\mathbf q^{\mathsf T}\delta\mathbf q = 0$. Every allowed nudge is **at right angles to $\mathbf q$ itself** — the ruler lying flat against the ball, never pointing into or out of it.

Now build a covariance from such nudges, $\mathbf P = \mathbb E[\delta\mathbf q\,\delta\mathbf q^{\mathsf T}]$ ($\mathbb E$ means "the average of"). Its variance along the direction $\mathbf q$ is

$$
\mathbf q^{\mathsf T}\mathbf P\mathbf q = \mathbb E\big[(\mathbf q^{\mathsf T}\delta\mathbf q)^2\big] = \mathbb E[0^2] = 0.
$$

Zero variance along $\mathbf q$ — the **radial** direction, straight out from the sphere's center. This is forced by the geometry, not chosen by the designer. So an honest $4\times 4$ covariance of a quaternion has one direction with no spread at all: it is **singular**, with **[[rank|rank-word]]** at most $3$. Not "nearly singular". Exactly.

::: example The constraint forces an exactly singular covariance
Take a nominal attitude $\mathbf q_0$: a $40^\circ$ rotation about the axis $(1, 2, -1)$. Give it a realistic uncertainty of $\sigma = 5^\circ$ about each of the three body axes, $\mathbf P_3 = \sigma^2\mathbf I_3$. Map that $3\times 3$ uncertainty into quaternion space: nudge $\mathbf q_0$ by small rotations, measure how the four components move (a $4\times 3$ Jacobian $\mathbf J$, found by finite differences), and form $\mathbf P_4 = \mathbf J\mathbf P_3\mathbf J^{\mathsf T}$. Its four eigenvalues (the variances along its four main directions) are

$$
(0,\ \ 0.0019039,\ \ 0.0019039,\ \ 0.0019039)\ \mathrm{rad^2}.
$$

Exactly rank $3$. The three nonzero ones equal $\sigma^2/4 = (2.5^\circ)^2$, because a small rotation $\boldsymbol\delta\theta$ moves the quaternion's vector part by only $\tfrac12\boldsymbol\delta\theta$, and halving a spread quarters its variance. The radial variance comes out as $\mathbf q_0^{\mathsf T}\mathbf P_4\mathbf q_0 = -4.2\times10^{-21}$: zero to machine precision, as the algebra said.
:::

```python
import numpy as np

def qmul(a, b):
    aw,ax,ay,az = a; bw,bx,by,bz = b
    return np.array([aw*bw-ax*bx-ay*by-az*bz, aw*bx+ax*bw+ay*bz-az*by,
                      aw*by-ax*bz+ay*bw+az*bx, aw*bz+ax*by-ay*bx+az*bw])

def quat_from_rotvec(theta):
    a = np.linalg.norm(theta)
    if a < 1e-8: return np.array([1.0, *(0.5*theta)])
    return np.array([np.cos(a/2), *(np.sin(a/2)*theta/a)])

axis = np.array([1.0,2.0,-1.0]); axis /= np.linalg.norm(axis)
q0 = quat_from_rotvec(axis*np.radians(40.0))
sigma = np.radians(5.0); P3 = np.eye(3)*sigma**2
eps = 1e-6
J = np.zeros((4,3))
for i in range(3):
    d = np.zeros(3); d[i] = eps
    J[:,i] = (qmul(quat_from_rotvec(d), q0) - qmul(quat_from_rotvec(-d), q0))/(2*eps)
P4 = J@P3@J.T
print(np.linalg.eigvalsh(P4))
print(q0@P4@q0)
# [0.         0.00190386 0.00190386 0.00190386]
# -4.176e-21
```

A filter that treats $\mathbf q$ as an ordinary 4-vector has no way to keep that radial variance at zero. Nothing in $(\mathbf I-\mathbf K\mathbf H)\mathbf P$ knows about the sphere. And process noise added the natural naive way — the same amount in every direction — pours variance into the radial direction every single cycle.

::: example A naive filter's covariance lies, and keeps lying
Spin a quaternion at a constant body rate, renormalizing it every step as any real code must. Alongside it, run the naive covariance recursion $\mathbf P_{k+1}=\boldsymbol\Phi_k\mathbf P_k\boldsymbol\Phi_k^{\mathsf T}+\sigma_q^2\mathbf I_4$, with the same process noise in all four directions, because nothing in this formulation says any direction is special. Track the radial variance $\mathbf q^{\mathsf T}\mathbf P\mathbf q$ as a share of the total, $\operatorname{tr}\mathbf P$:

| $t\,(\mathrm s)$ | $\operatorname{tr}\mathbf P$ | radial variance $\mathbf q^{\mathsf T}\mathbf P\mathbf q$ | share radial |
| --- | --- | --- | --- |
| $0$ | $0.000004$ | $0.000001$ | $0.250$ |
| $10$ | $0.080004$ | $0.020001$ | $0.250$ |
| $20$ | $0.160004$ | $0.040001$ | $0.250$ |

A full **quarter** of the filter's reported uncertainty sits in a direction the geometry proves has zero true variance, and it never goes away. Over $20\,\mathrm s$ the total grows forty-thousand-fold from its tiny start ($0.160004 / 0.000004 \approx 40\,000$), and a quarter of it is fiction the whole way.
:::

```python
import numpy as np

def qmul(a, b):
    aw,ax,ay,az = a; bw,bx,by,bz = b
    return np.array([aw*bw-ax*bx-ay*by-az*bz, aw*bx+ax*bw+ay*bz-az*by,
                      aw*by-ax*bz+ay*bw+az*bx, aw*bz+ax*by-ay*bx+az*bw])

def quat_from_rotvec(theta):
    a = np.linalg.norm(theta)
    if a < 1e-8: return np.array([1.0, *(0.5*theta)])
    return np.array([np.cos(a/2), *(np.sin(a/2)*theta/a)])

def left_mult_matrix(p):
    M = np.zeros((4,4))
    for i in range(4):
        e = np.zeros(4); e[i] = 1.0
        M[:,i] = qmul(p, e)
    return M

omega = np.array([0.05,-0.03,0.02]); dt = 0.05; sigma_q = 0.01
q = np.array([1.0,0.0,0.0,0.0]); P = np.diag([1e-6]*4)
for k in range(401):
    if k % 200 == 0:
        print(k*dt, np.trace(P), q@P@q, (q@P@q)/np.trace(P))
    dq = quat_from_rotvec(omega*dt)
    Phi = left_mult_matrix(dq)
    q = Phi@q; q /= np.linalg.norm(q)
    P = Phi@P@Phi.T + (sigma_q**2)*np.eye(4)
# 0.0  4e-06     1e-06     0.25
# 10.0 0.080004  0.020001  0.25
# 20.0 0.160004  0.040001  0.25
```

::: key The one-sentence answer on quaternion states
A unit quaternion lives on a 3-dimensional manifold in $\mathbb R^4$, so an additive update breaks the norm constraint and the $4\times4$ covariance is singular along the radial direction. Estimate the error in the tangent space instead.
:::

A **manifold** is a curved space that looks flat when you zoom in close enough, like the ball's surface to the ant. The **tangent space** at a point is that flat, zoomed-in sheet touching it.

## The multiplicative error

Here is the fix, in the navigator's language from the previous lesson. Keep the quaternion as the **nominal** — the pencil line — and never feed it to the Kalman equations. Integrate it exactly with the gyro, and renormalize it every step. Then describe how far the truth is from the nominal with a small **rotation**: three numbers $\boldsymbol\delta\theta$ (read "delta theta"), a **rotation vector** whose direction is the axis and whose length is the angle. That 3-vector is the error state. It lives in the flat tangent space, has no constraint, and gets an ordinary $3\times 3$ covariance with no singular direction.

The error is glued on by quaternion multiplication, not addition. Written in the form most flight software and the Markley–Crassidis book use:

::: key MEKF error definition
$$
\mathbf q_{\text{true}} = \delta\mathbf q(\boldsymbol\delta\theta) * \mathbf q_{\text{nominal}}, \qquad \delta\mathbf q(\boldsymbol\delta\theta)\approx\big[1,\ \tfrac12\boldsymbol\delta\theta\big].
$$
The filter state is the 3-vector $\boldsymbol\delta\theta$, whose covariance is a well-conditioned $3\times3$.
:::

A word on the product sign, because this is where people get lost. The $*$ in that key is the **[[Shuster product|product-order]]**, defined so that attitude matrices multiply in the same order: $\mathbf A(\mathbf p * \mathbf q) = \mathbf A(\mathbf p)\mathbf A(\mathbf q)$. This course's Hamilton product $\otimes$ runs the other way round, so the *very same* error is written

$$
\mathbf q_{\text{true}} = \mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\theta) \qquad\Longleftrightarrow\qquad \mathbf A(\mathbf q_{\text{true}}) = \mathbf A(\delta\mathbf q)\,\mathbf A(\mathbf q_{\text{nom}}).
$$

The matrix form on the right settles it without any quaternion conventions: first rotate from the reference frame into the nominal body frame, then apply a small extra rotation. The error lives in the **body frame**. All the code in this lesson uses Hamilton's $\otimes$ and this body-frame error.

The small-angle form says the error quaternion is almost $[1, \mathbf 0]$ (no rotation) plus half the rotation vector. For a $2^\circ$ error, $\boldsymbol\delta\theta$ has length $0.0349\,\mathrm{rad}$ and the vector part has length $0.0175$.

Now the previous lesson's two steps, with $\oplus$ meaning quaternion multiplication:

- **Injection**: $\mathbf q_{\text{nom}}\leftarrow\mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\hat\theta)$, then renormalize.
- **Reset**: $\boldsymbol\delta\hat\theta\leftarrow\mathbf 0$ — and this time the covariance must be transformed.

### How the error moves between measurements

The nominal is spun forward with the **bias-corrected** gyro rate $\boldsymbol\omega_c = \boldsymbol\omega_{\text{meas}} - \hat{\mathbf b}$, where $\hat{\mathbf b}$ is the filter's estimate of the gyro's **bias** (a slowly wandering offset in its reading). The truth spins at the real rate. The difference makes the error move:

$$
\boldsymbol\delta\dot\theta = -\boldsymbol\omega_c\times\boldsymbol\delta\theta - \boldsymbol\delta\mathbf b - \text{gyro noise}, \qquad \boldsymbol\delta\dot{\mathbf b} = \text{bias random walk}.
$$

Read it in words. The first term says the error, being measured in the spinning body frame, gets carried round as the body turns. The second says an error in the bias estimate feeds straight into the attitude error, like a clock running slightly fast. So the $6\times 6$ error-dynamics matrix, for the error state $(\boldsymbol\delta\theta, \boldsymbol\delta\mathbf b)$, is

$$
\mathbf F = \begin{pmatrix} -\operatorname{skew}(\boldsymbol\omega_c) & -\mathbf I \\ \mathbf 0 & \mathbf 0 \end{pmatrix}, \qquad \operatorname{skew}(\mathbf v)\mathbf u = \mathbf v\times\mathbf u.
$$

$\operatorname{skew}(\mathbf v)$, the **[[skew-symmetric matrix|skew-matrix]]** of $\mathbf v$, is the $3\times 3$ matrix that does a cross product. Notice what is *not* in $\mathbf F$: the nominal quaternion. The next lesson makes a great deal of that.

## The reset Jacobian

After injection, the nominal has moved by $\boldsymbol\delta\hat\theta$. The truth has not moved. So the error, now measured from the new nominal, is the old error with the correction taken off — but taken off by *rotation*, and rotations do not quite add. To first order,

$$
\boldsymbol\delta\theta^{\text{new}} \approx \boldsymbol\delta\theta - \boldsymbol\delta\hat\theta - \tfrac12\,\boldsymbol\delta\hat\theta\times\boldsymbol\delta\theta.
$$

The last term is the small twist that makes curved space different from flat space. Its Jacobian with respect to the old error gives the reset matrix.

::: key Attitude reset Jacobian
$$
\mathbf G = \mathbf I - \operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta), \qquad \mathbf P \leftarrow \mathbf G\mathbf P\mathbf G^{\mathsf T}
$$
for the attitude block. Second order in the error, so often omitted — but required for a consistent high-accuracy filter.
:::

"Second order" deserves a careful reading. $\mathbf G$ itself is the identity plus a term the size of the correction. So the change it makes to $\mathbf P$ is (size of the correction) $\times$ (size of $\mathbf P$) — the product of two small quantities. Halve the correction and the fix halves too. For a filter tracking well, injecting a small fraction of a degree each cycle, it is tiny, which is why many implementations skip it and still run.

::: note Why the reset has that twist term
For two small rotation vectors $\mathbf a$ and $\mathbf b$, doing rotation $\mathbf a$ and then rotation $\mathbf b$ is *not* the single rotation $\mathbf a + \mathbf b$. To first order in each, it is

$$
\mathbf a + \mathbf b + \tfrac12\,\mathbf a\times\mathbf b.
$$

(This is the start of the **Baker–Campbell–Hausdorff** formula for rotations.) The half-cross-product is the price of rotations not commuting: turn a book $90^\circ$ about one edge then another, and you get a different result from the reverse order.

The new error is "undo the correction, then apply the old error": $\boldsymbol\delta\theta^{\text{new}}$ combines $\mathbf a = -\boldsymbol\delta\hat\theta$ with $\mathbf b = \boldsymbol\delta\theta$. Put them into the formula:

$$
\boldsymbol\delta\theta^{\text{new}} \approx -\boldsymbol\delta\hat\theta + \boldsymbol\delta\theta + \tfrac12(-\boldsymbol\delta\hat\theta)\times\boldsymbol\delta\theta.
$$

Differentiate with respect to $\boldsymbol\delta\theta$. The constant $-\boldsymbol\delta\hat\theta$ drops out, $\boldsymbol\delta\theta$ gives $\mathbf I$, and $-\tfrac12\boldsymbol\delta\hat\theta\times\boldsymbol\delta\theta = -\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)\,\boldsymbol\delta\theta$ gives the rest:

$$
\mathbf G = \mathbf I - \operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta).
$$

With a reference-frame (left) error instead, the order of $\mathbf a$ and $\mathbf b$ flips, the cross product changes sign, and so does the sign in $\mathbf G$.
:::

::: example The reset Jacobian, checked against the exact reset
Draw two million random true errors from $\mathbf P_{\text{old}}=\operatorname{diag}\!\big((6^\circ)^2,(4^\circ)^2,(5^\circ)^2\big)$. Inject a fixed correction $\boldsymbol\delta\hat\theta=(8^\circ,-5^\circ,3^\circ)$, about $9.9^\circ$ in all. For each sample, compute the **exact** new error: multiply the quaternions and take the true rotation vector of what is left, with no approximation anywhere. The sample covariance of the exact new errors is

$$
\begin{pmatrix}0.010950 & -0.000150 & -0.000134\\ -0.000150 & 0.004902 & 0.000204\\ -0.000134 & 0.000204 & 0.007632\end{pmatrix}\ \mathrm{rad^2}.
$$

Compare three predictions with it, using the relative **Frobenius error** (the size of the difference matrix, as a share of the size of $\mathbf G\mathbf P_{\text{old}}\mathbf G^{\mathsf T}$):

- the correct $\mathbf G\mathbf P_{\text{old}}\mathbf G^{\mathsf T}$: $0.41\%$ off;
- skipping $\mathbf G$ (the additive shortcut, $\mathbf P$ unchanged): $2.85\%$ off;
- the **[[wrong sign|sign-bars]]**, $\mathbf I+\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$: $5.71\%$ off.

The correct formula is about seven times closer than skipping it. The wrong sign is worse than doing nothing, which is the practical danger: the sign belongs to the body-frame error convention, and an implementation must use the one that matches.
:::

```python
import numpy as np

def qmul(a, b):                     # Hamilton product, works on arrays of quaternions
    aw, ax, ay, az = np.moveaxis(a, -1, 0); bw, bx, by, bz = np.moveaxis(b, -1, 0)
    return np.stack([aw*bw - ax*bx - ay*by - az*bz, aw*bx + ax*bw + ay*bz - az*by,
                     aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw], -1)

def quat_from_rotvec(th):           # exact exponential map, rows of rotation vectors
    th = np.atleast_2d(th); a = np.linalg.norm(th, axis=1, keepdims=True)
    s = np.where(a > 1e-8, np.sin(a/2)/np.where(a > 1e-8, a, 1), 0.5)
    return np.hstack([np.cos(a/2), s*th])

def rotvec_from_quat(q):            # exact log map, rows of quaternions
    q = np.where(q[:, :1] < 0, -q, q)
    n = np.linalg.norm(q[:, 1:], axis=1, keepdims=True)
    k = np.where(n > 1e-10, 2*np.arctan2(n, q[:, :1])/np.where(n > 1e-10, n, 1), 2.0)
    return k*q[:, 1:]

def skew(v): return np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
conj = np.array([1, -1, -1, -1])

rng = np.random.default_rng(5)
P_old = np.diag(np.radians([6.0, 4.0, 5.0])**2)
dth_hat = np.radians([8.0, -5.0, 3.0])        # the correction we inject
q_nom_old = np.array([1.0, 0, 0, 0])
q_nom_new = qmul(q_nom_old, quat_from_rotvec(dth_hat)[0])

N = 2_000_000
old = rng.multivariate_normal(np.zeros(3), P_old, size=N)
q_true = qmul(q_nom_old, quat_from_rotvec(old))
new = rotvec_from_quat(qmul(q_nom_new*conj, q_true))   # exact new errors
C = np.cov(new.T)

G = np.eye(3) - skew(0.5*dth_hat)
G_wrong = np.eye(3) + skew(0.5*dth_hat)
P_new = G @ P_old @ G.T
err = lambda P: 100*np.linalg.norm(C - P)/np.linalg.norm(P_new)
print(np.round(C, 6))
print(round(err(P_new), 2), round(err(P_old), 2), round(err(G_wrong @ P_old @ G_wrong.T), 2))
# 0.41 2.85 5.71
```

## Updating from a vector measurement

A star tracker, sun sensor or magnetometer measures a **direction**. Some reference direction $\mathbf r$ is known in the reference frame — the Sun's direction from an ephemeris, the magnetic field from a model. The sensor reports it as seen from the body:

$$
\mathbf v_{\text{body}}=\mathbf A(\mathbf q_{\text{true}})\,\mathbf r+\text{noise},
$$

with $\mathbf A(\mathbf q)$ the **attitude matrix** (it turns reference-frame vectors into body-frame ones). The filter predicts the reading from its nominal, $\hat{\mathbf v}=\mathbf A(\mathbf q_{\text{nom}})\mathbf r$ ("v hat").

For a small error, $\mathbf A(\delta\mathbf q) \approx \mathbf I - \operatorname{skew}(\boldsymbol\delta\theta)$. So the true reading is

$$
\mathbf v_{\text{body}} \approx (\mathbf I - \operatorname{skew}(\boldsymbol\delta\theta))\,\hat{\mathbf v} = \hat{\mathbf v} - \boldsymbol\delta\theta\times\hat{\mathbf v} = \hat{\mathbf v} + \hat{\mathbf v}\times\boldsymbol\delta\theta.
$$

(Swapping the order of a cross product flips its sign.) The change is $\hat{\mathbf v}\times\boldsymbol\delta\theta = \operatorname{skew}(\hat{\mathbf v})\,\boldsymbol\delta\theta$, which is linear in the error, and its matrix is the Jacobian.

::: key Measurement Jacobian for a rotated reference vector
With the predicted body vector $\hat{\mathbf v} = \mathbf A(\mathbf q)\mathbf r$, the Jacobian with respect to $\boldsymbol\delta\theta$ is
$$
\mathbf H = \operatorname{skew}(\hat{\mathbf v})
$$
(sign depends on the error convention). Memorize the convention you use and never mix two.
:::

A finite-difference check of this formula, at an arbitrary attitude, agrees to about $10^{-10}$. One consequence is worth seeing: $\operatorname{skew}(\hat{\mathbf v})\,\hat{\mathbf v} = \hat{\mathbf v}\times\hat{\mathbf v} = \mathbf 0$. A rotation *about* the measured direction leaves that direction unchanged, so one vector sensor is **[[blind to spin about its own line|vector-blind]]**. Two sensors pointing different ways cover each other's blind spot and pin down all three axes.

::: example A complete MEKF: gyro, two vector sensors, bias
Estimate attitude and a constant gyro bias, $\mathbf b_{\text{true}}=(0.5,-0.3,0.2)^\circ/\mathrm s$. The gyro has **[[angle random walk|arw-rrw]]** $0.05^\circ/\sqrt{\mathrm s}$ and rate random walk $0.002^\circ/\mathrm s^{3/2}$. Two vector sensors (one Sun-like, one magnetometer-like) each have $0.3^\circ$ noise per axis. The filter starts with zero bias estimate and an attitude $26.9^\circ$ wrong ($\sqrt{10^2+15^2+20^2} = 26.9$).

Each $1\,\mathrm s$ cycle:

1. propagate $\mathbf q_{\text{nom}}$ with the bias-corrected gyro (the exact rotation-vector exponential), and the $6\times 6$ covariance with $\mathbf F$ above;
2. update once per vector sensor, with $\mathbf H = [\operatorname{skew}(\hat{\mathbf v}),\ \mathbf 0]$ — the bias does not appear directly in a direction reading;
3. after each update, inject (multiply into the quaternion, add to the bias) and reset with $\mathbf G$.

| cycle | attitude error | $\hat{\mathbf b}$ ($^\circ/\mathrm s$) | filter's bias $\sigma$ ($^\circ/\mathrm s$) |
| --- | --- | --- | --- |
| $0$ | $1.84^\circ$ | $(-0.043,\ 0.055,\ -0.092)$ | $(0.998,\ 0.998,\ 0.998)$ |
| $1$ | $0.50^\circ$ | $(1.367,\ 0.848,\ 0.728)$ | $(0.406,\ 0.373,\ 0.313)$ |
| $2$ | $0.55^\circ$ | $(0.705,\ 0.098,\ 0.169)$ | $(0.218,\ 0.198,\ 0.166)$ |
| $5$ | $0.43^\circ$ | $(0.467,\ -0.001,\ 0.180)$ | $(0.077,\ 0.072,\ 0.059)$ |
| $10$ | $0.54^\circ$ | $(0.483,\ -0.164,\ 0.264)$ | $(0.034,\ 0.032,\ 0.028)$ |
| $20$ | $0.22^\circ$ | $(0.479,\ -0.260,\ 0.226)$ | $(0.017,\ 0.017,\ 0.015)$ |
| $59$ | $0.27^\circ$ | $(0.497,\ -0.302,\ 0.205)$ | $(0.011,\ 0.011,\ 0.011)$ |

Two readings in the first cycle cut the $26.9^\circ$ error to $1.84^\circ$, and after that the attitude stays within about half a degree. The bias is slower, because the filter can only see it through how the attitude *drifts* between cycles. By cycle $59$ every axis is within $0.005^\circ/\mathrm s$ of the truth.

But look at cycle $5$: the $y$ bias is $0.30^\circ/\mathrm s$ off while the filter claims $\sigma = 0.07^\circ/\mathrm s$ — about four sigma. The Check yourself section asks you why.
:::

```python
import numpy as np

def qmul(a, b):
    aw,ax,ay,az = a; bw,bx,by,bz = b
    return np.array([aw*bw-ax*bx-ay*by-az*bz, aw*bx+ax*bw+ay*bz-az*by,
                      aw*by-ax*bz+ay*bw+az*bx, aw*bz+ax*by-ay*bx+az*bw])
def qconj(q): return np.array([q[0], -q[1], -q[2], -q[3]])
def quat_from_rotvec(theta):
    a = np.linalg.norm(theta)
    if a < 1e-8: return np.array([1.0, *(0.5*theta)])
    return np.array([np.cos(a/2), *(np.sin(a/2)*theta/a)])
def skew(v): return np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
def quat_to_dcm(q):
    w,x,y,z = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y+w*z), 2*(x*z-w*y)],
                      [2*(x*y-w*z), 1-2*(x*x+z*z), 2*(y*z+w*x)],
                      [2*(x*z+w*y), 2*(y*z-w*x), 1-2*(x*x+y*y)]])

def mekf_propagate(q, b, P, omega_meas, dt, arw_var, rrw_var):
    omega_c = omega_meas - b
    q = qmul(q, quat_from_rotvec(omega_c*dt)); q /= np.linalg.norm(q)
    F = np.zeros((6,6)); F[:3,:3] = -skew(omega_c); F[:3,3:] = -np.eye(3)
    Phi = np.eye(6) + F*dt
    Qd = np.zeros((6,6)); Qd[:3,:3] = arw_var*dt*np.eye(3); Qd[3:,3:] = rrw_var*dt*np.eye(3)
    return q, b, Phi@P@Phi.T + Qd

def mekf_update(q, b, P, v_body, v_ref, R):
    v_hat = quat_to_dcm(q)@v_ref
    H = np.zeros((3,6)); H[:,:3] = skew(v_hat)
    S = H@P@H.T + R
    K = P@H.T@np.linalg.inv(S)
    dx = K@(v_body - v_hat)
    P = (np.eye(6)-K@H)@P
    q = qmul(q, quat_from_rotvec(dx[:3])); q /= np.linalg.norm(q)
    b = b + dx[3:]
    G = np.eye(6); G[:3,:3] = np.eye(3) - skew(0.5*dx[:3])
    return q, b, G@P@G.T

rng = np.random.default_rng(9)
dt = 1.0
arw_var = np.radians(0.05)**2
rrw_var = np.radians(0.002)**2
sigma_meas = np.radians(0.3)
r_sun = np.array([1.0, 0.0, 0.0]); r_mag = np.array([0.0, 0.80, 0.60])
R_meas = (sigma_meas**2)*np.eye(3)
b_true = np.radians(np.array([0.5, -0.3, 0.2]))
q_true = quat_from_rotvec(np.radians(np.array([10.0, -15.0, 20.0])))
omega_true = np.radians(np.array([1.0, 0.5, -0.8]))
q_nom = np.array([1.0, 0.0, 0.0, 0.0]); b_hat = np.zeros(3)
P = np.zeros((6,6)); P[:3,:3] = np.eye(3)*np.radians(15.0)**2; P[3:,3:] = np.eye(3)*np.radians(1.0)**2

for cycle in range(60):
    q_true = qmul(q_true, quat_from_rotvec(omega_true*dt)); q_true /= np.linalg.norm(q_true)
    omega_meas = omega_true + b_true + rng.normal(0, np.sqrt(arw_var/dt), 3)
    q_nom, b_hat, P = mekf_propagate(q_nom, b_hat, P, omega_meas, dt, arw_var, rrw_var)
    for r_ref in (r_sun, r_mag):
        v_body = quat_to_dcm(q_true)@r_ref + rng.normal(0, sigma_meas, 3)
        v_body /= np.linalg.norm(v_body)
        q_nom, b_hat, P = mekf_update(q_nom, b_hat, P, v_body, r_ref, R_meas)
    dq_err = qmul(qconj(q_nom), q_true)
    ang_err = np.degrees(2*np.arccos(np.clip(np.abs(dq_err[0]), 0, 1)))
    sig_b = np.degrees(np.sqrt(np.diag(P)[3:]))
    if cycle in (0, 1, 2, 5, 10, 20, 59):
        print(cycle, round(ang_err, 2), np.round(np.degrees(b_hat), 3), np.round(sig_b, 3))
# 0 1.84 [-0.043  0.055 -0.092] [0.998 0.998 0.998]
# ...
# 59 0.27 [ 0.497 -0.302  0.205] [0.011 0.011 0.011]
```

::: warning A quaternion covariance is not "a bit optimistic" — it is built wrong
The naive filter's radial share sat at exactly $25\%$ for the whole run and never drifted toward the true value, zero. That is not a tuning problem you can fix with a smaller process noise. It comes from forcing a three-dimensional state into a four-dimensional box with no rule saying which direction is fake. Renormalizing the quaternion after each update does not help either: it moves the state back onto the sphere but leaves $\mathbf P$ describing a spread the state no longer has. That is why every serious attitude filter uses a three-parameter error in the tangent space.
:::

::: warning One convention, applied everywhere in the filter
The reset sign ($\mathbf I-\operatorname{skew}$, not $+$), the measurement sign ($+\operatorname{skew}(\hat{\mathbf v})$, not $-$) and the error-dynamics sign ($-\operatorname{skew}(\boldsymbol\omega_c)$) all come from one choice: the body-frame error, $\mathbf A(\mathbf q_{\text{true}}) = \mathbf A(\delta\mathbf q)\mathbf A(\mathbf q_{\text{nom}})$. A reference-frame error flips them together, consistently. Copying one formula from a book that uses the other convention — or the other quaternion product — gives a filter that looks plausible and is confidently wrong. Check each Jacobian by finite differences before you trust it.
:::

## Check yourself

::: check
In one sentence: why is $\mathbf q^{\mathsf T}\mathbf P\mathbf q=0$ forced by the unit-norm rule, rather than being a modeling choice?
:::

::: answer
Differentiating $\mathbf q^{\mathsf T}\mathbf q=1$ shows every variation that stays on the unit sphere obeys $\mathbf q^{\mathsf T}\delta\mathbf q=0$, so a covariance built from such variations, $\mathbf P=\mathbb E[\delta\mathbf q\,\delta\mathbf q^{\mathsf T}]$, gives $\mathbf q^{\mathsf T}\mathbf P\mathbf q=\mathbb E[(\mathbf q^{\mathsf T}\delta\mathbf q)^2]=0$ whatever noise values the designer picked — the zero comes from the geometry of the sphere.
:::

::: check
The naive filter's radial share was exactly $25\%$ throughout. Where does that particular number come from?
:::

::: answer
From the isotropic covariance. The filter started with $\mathbf P = 10^{-6}\,\mathbf I_4$ and added $\sigma_q^2\mathbf I_4$ every step: the same variance in every direction of 4-dimensional space. The radial direction is one of four perpendicular directions, so it gets exactly one quarter of the trace. The propagation step cannot change that, because $\boldsymbol\Phi$ here is multiplication by a unit quaternion, which is a pure rotation of 4-dimensional space: it turns an equal-in-all-directions covariance into another equal-in-all-directions one. So the share stays at $1/4$ forever, while the truth is $0$.
:::

::: check
The reset Jacobian is called "second order in the error". What does that mean for a filter injecting $0.2^\circ$ corrections each cycle, compared with the worked example's $9.9^\circ$ correction?
:::

::: answer
The change $\mathbf G\mathbf P\mathbf G^{\mathsf T}-\mathbf P$ is (size of the correction) times (size of $\mathbf P$): both small, so the product is second order in small quantities. Relative to $\mathbf P$, it scales in proportion to the correction. For the example's $\mathbf P$, the change was about $2.9\%$ of $\mathbf P$ for the $9.9^\circ$ correction, and it halves each time the correction halves. A $0.2^\circ$ correction is about $50$ times smaller, so skipping $\mathbf G$ would change $\mathbf P$ by only about $0.06\%$ that cycle. That is why many filters that are tracking well skip it without visible harm, and why a high-accuracy filter, or one recovering from a large error, should not.
:::

::: check
A colleague builds the MEKF with the reference-frame error, $\mathbf A(\mathbf q_{\text{true}}) = \mathbf A(\mathbf q_{\text{nom}})\mathbf A(\delta\mathbf q)$, but copies this lesson's $\mathbf H = +\operatorname{skew}(\hat{\mathbf v})$ unchanged. What happens?
:::

::: answer
A sign mismatch in the update. The Jacobian's sign belongs to the error convention, so under the other convention this $\mathbf H$ describes the reading changing the wrong way for a given error. (Under the reference-frame error the Jacobian also involves the reference-frame vector $\mathbf r$ rather than $\hat{\mathbf v}$.) The filter would push corrections in the wrong rotational sense, so it could converge to a wrong attitude, oscillate, or diverge, while its $\mathbf P$ keeps shrinking as if all were well. It is the same kind of failure as the wrong-sign reset in the Monte Carlo check, which was worse than no correction at all. A finite-difference test of $\mathbf H$ against the filter's own error definition catches it in minutes.
:::

::: check
At cycle $5$ of the full MEKF run, the $y$ bias estimate was $0.30^\circ/\mathrm s$ off while the filter claimed $\sigma \approx 0.07^\circ/\mathrm s$. By cycle $59$ it was right. What went wrong early, and what would you change?
:::

::: answer
The first updates broke the error-state promise that the error is small. The filter started $26.9^\circ$ off, so its first linearized updates used $\mathbf H = \operatorname{skew}(\hat{\mathbf v})$ at a badly wrong attitude, and the small-angle approximations were poor. After cycle $0$ the attitude was still $1.84^\circ$ off while $\mathbf P$ claimed about $0.3^\circ$. The filter explained that leftover error the only way it could — as gyro bias — which is why $\hat{\mathbf b}$ jumped to $(1.37, 0.85, 0.73)^\circ/\mathrm s$ at cycle $1$. Meanwhile $\mathbf P$ shrank as if every update had been perfectly linear, so the filter was overconfident for a while, and only the steady flow of later readings pulled the bias back. (Starting the same run only about $1^\circ$ off instead, the $y$ bias at cycle $5$ is $-0.26^\circ/\mathrm s$, close to the truth.) The practical fix is to start the MEKF from a good attitude, found first with a static two-vector solution such as TRIAD or QUEST from the least-squares module, or to inflate $\mathbf P$ honestly while the error is large.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| The constraint | Allowed nudges are perpendicular to $\mathbf q$ | $\mathbf q^{\mathsf T}\delta\mathbf q=0$, so $\mathbf q^{\mathsf T}\mathbf P\mathbf q=0$ |
| Naive filter | Isotropic noise in 4-D | $25\%$ of reported uncertainty is fake, forever |
| MEKF error | Small body-frame rotation | $\mathbf q_{\text{true}}=\delta\mathbf q(\boldsymbol\delta\theta)*\mathbf q_{\text{nominal}}$ (Hamilton: $\mathbf q_{\text{nom}}\otimes\delta\mathbf q$), $\delta\mathbf q\approx[1,\tfrac12\boldsymbol\delta\theta]$ |
| Error state | 3 numbers, $3\times3$ covariance | $\boldsymbol\delta\theta$, plus $\boldsymbol\delta\mathbf b$ for gyro bias |
| Error dynamics | Carried round by the spin, fed by bias error | $\boldsymbol\delta\dot\theta = -\boldsymbol\omega_c\times\boldsymbol\delta\theta - \boldsymbol\delta\mathbf b$ + noise |
| Injection | Multiply the correction in | $\mathbf q_{\text{nom}}\leftarrow\mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\hat\theta)$ |
| Reset | Zero the error, turn the covariance | $\mathbf G=\mathbf I-\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$, $\mathbf P\leftarrow\mathbf G\mathbf P\mathbf G^{\mathsf T}$; $0.41\%$ vs exact |
| Vector sensor | Jacobian of a rotated reference vector | $\mathbf H=\operatorname{skew}(\hat{\mathbf v})$, $\hat{\mathbf v}=\mathbf A(\mathbf q_{\text{nom}})\mathbf r$; blind to spin about $\hat{\mathbf v}$ |

The MEKF is one case of a wider pattern: any state that lives on a curved space with a group structure can be given a nominal plus a tangent-space error. The next lesson states that pattern in general, and names the property — already hiding in this lesson's $\mathbf F$, which never mentions the nominal quaternion — that decides whether the general version beats an ordinary EKF.

::: context degrees-of-freedom Four numbers, three freedoms
A **degree of freedom** is one independent way something can change. An attitude has three: you can turn about any of three axes, and every orientation is some combination of those. A quaternion spends four numbers on it, tied together by one rule, $q_w^2+q_x^2+q_y^2+q_z^2=1$. Four numbers minus one rule leaves three freedoms. The extra number buys something valuable — no gimbal lock and smooth arithmetic — but a filter must never treat it as a fourth freedom.
:::

::: context unit-sphere A step off the sphere
The circle stands in for the unit sphere of quaternions (really four-dimensional, but the idea is the same). Adding a correction moves the point along a straight line, off the sphere. Renormalizing pulls it back along the radius. The attitude you end up with is fine; the problem is that the covariance never learned about the pull.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="100" r="3" fill="#1f2a44"/>
  <circle cx="180" cy="40" r="4" fill="#1d6fd1"/>
  <line x1="180" y1="40" x2="236" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="240,40 230,35 230,45" fill="#1d6fd1"/>
  <circle cx="240" cy="40" r="4" fill="#b4232c"/>
  <line x1="180" y1="100" x2="240" y2="40" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="222.4" cy="57.6" r="4" fill="#b4232c"/>
  <text x="160" y="34" font-size="12" fill="#1d6fd1">q</text>
  <text x="200" y="26" font-size="12" fill="#1d6fd1">q + K·ν: off the sphere</text>
  <text x="236" y="76" font-size="12" fill="#b4232c">renormalized</text>
  <text x="150" y="175" font-size="12" fill="#1f2a44">unit sphere ‖q‖ = 1</text>
</svg>
```
:::

::: context star-tracker Cameras that read the stars
A star tracker is a small digital camera with a catalog of thousands of stars in its memory. It photographs a patch of sky, recognizes the pattern, and reports which way it is pointing, often to a few arcseconds — a thousandth of a degree. It is the most accurate attitude sensor a spacecraft usually carries, but it is slow (a few readings a second) and can be blinded by the Sun, Moon or Earth. The gyro fills the gaps, and the MEKF blends the two.
:::

::: context rank-word What "rank" means
The **rank** of a matrix is the number of truly independent directions it acts in. A $4\times 4$ covariance of full rank $4$ has spread in all four directions. Rank $3$ means one direction has exactly zero spread, so the matrix cannot be inverted: $\mathbf P^{-1}$ does not exist. That matters because many filter formulas — the information form, the NEES test $\mathbf e^{\mathsf T}\mathbf P^{-1}\mathbf e$ — need $\mathbf P^{-1}$.
:::

::: context product-order Two quaternion products, one attitude
There are two conventions for multiplying quaternions. Hamilton's (used in this course, in Sola's notes and in most robotics code) and Shuster's (used by Markley and Crassidis and much NASA attitude software) differ in the sign of the cross-product term, so $\mathbf p * \mathbf q$ in Shuster's product equals $\mathbf q\otimes\mathbf p$ in Hamilton's. That is why one book writes the MEKF error as $\delta\mathbf q * \mathbf q_{\text{nom}}$ and another as $\mathbf q_{\text{nom}}\otimes\delta\mathbf q$ — and both mean the same body-frame error. When reading any source, find its definition of the product before you copy a single formula.
:::

::: context skew-matrix A matrix that does a cross product
For $\mathbf v = (v_1, v_2, v_3)$,

$$
\operatorname{skew}(\mathbf v) = \begin{pmatrix} 0 & -v_3 & v_2 \\ v_3 & 0 & -v_1 \\ -v_2 & v_1 & 0 \end{pmatrix}.
$$

Multiply it by any $\mathbf u$ and you get $\mathbf v\times\mathbf u$. It is called skew-symmetric because flipping it across its diagonal gives its negative. Turning the cross product into a matrix lets it sit inside Jacobians and covariance formulas like any other linear map.
:::

::: context sign-bars Three predictions, one exact answer
The Monte Carlo check, as bars: how far each covariance prediction lands from the exact reset, as a percentage.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="141.8" width="60" height="8.2" fill="#1d6fd1"/>
  <rect x="150" y="93" width="60" height="57" fill="#6c7a93"/>
  <rect x="240" y="35.8" width="60" height="114.2" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="134">0.41%</text><text x="180" y="86">2.85%</text><text x="270" y="29">5.71%</text>
    <text x="90" y="166">G correct</text><text x="180" y="166">no G</text><text x="270" y="166">sign flipped</text>
  </g>
</svg>
```

The leftover $0.41\%$ is higher-order terms plus the small scatter of a two-million-sample average.
:::

::: context vector-blind Why one vector sensor is not enough
Point a pencil at the Sun and spin it about its own length. The Sun's direction, seen from the pencil, never changes. That spin is the one attitude change a sun sensor cannot detect, and the math says the same: $\mathbf H\hat{\mathbf v} = \hat{\mathbf v}\times\hat{\mathbf v} = \mathbf 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="290" y2="60" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="300,58 287,55 290,66" fill="#1d6fd1"/>
  <ellipse cx="165" cy="85" rx="12" ry="28" fill="none" stroke="#b4232c" stroke-width="2" transform="rotate(-11.3 165 85)"/>
  <polygon points="171,58 160,54 162,63" fill="#b4232c"/>
  <text x="250" y="48" font-size="12" fill="#1d6fd1">measured direction v̂</text>
  <text x="120" y="135" font-size="12" fill="#b4232c">spin about v̂: invisible</text>
</svg>
```

A second sensor pointing a different way sees that spin clearly, which is why an attitude filter needs two non-parallel directions.
:::

::: context arw-rrw How gyro noise is specified
**Angle random walk** (ARW) is the gyro's fast, white noise, seen as a random wander in the integrated angle that grows like the square root of time: $0.05^\circ/\sqrt{\mathrm s}$ means about $0.05^\circ$ of wander after $1\,\mathrm s$ and $0.5^\circ$ after $100\,\mathrm s$. **Rate random walk** (RRW) is the bias itself slowly wandering, in units of $^\circ/\mathrm s^{3/2}$. In the filter, ARW sets the attitude block of $\mathbf Q$ and RRW sets the bias block. The Inertial Navigation module shows how to measure both from a gyro sitting still, with the Allan variance.
:::
