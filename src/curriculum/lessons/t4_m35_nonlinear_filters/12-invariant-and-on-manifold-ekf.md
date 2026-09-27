---
id: l12-invariant-and-on-manifold-ekf
title: On-manifold and invariant EKF, equivariant filtering
minutes: 22
covers:
  - On-manifold and invariant EKF (IEKF), equivariant filtering
---

Think about two ways of giving someone directions. One is a map instruction: "the bakery is $200\,\mathrm m$ north of the fountain". The other is a body instruction: "walk forward $50\,\mathrm m$, then turn left". The map instruction only makes sense if you know where you are on the map. The body instruction works the same wherever you happen to be standing — in Paris or in Tokyo, facing any way at all. You do not need to know your position to follow it.

A Kalman filter has exactly this worry. To push its uncertainty forward it needs a Jacobian, and an ordinary EKF works that Jacobian out at its own *estimate* of the state. If the estimate is wrong, the Jacobian is wrong, and — as the EKF-divergence lesson showed — the filter can talk itself into false confidence. So here is a tempting question: can we describe the error in a "body instruction" way, so that how it evolves does not depend on where the filter thinks it is?

For a large and important class of systems, the answer is yes. The previous lesson's MEKF already did it for attitude, without saying so. This lesson names the general recipe — the **on-manifold EKF** — and the property that makes it work, which gives the **invariant EKF (IEKF)** of Barrau and Bonnabel. Then it takes one more step, to **equivariant filtering**.

## Lie groups: the general setting

The MEKF split an attitude into a nominal (on the curved space, integrated exactly) and a small error (in the flat tangent space at that nominal). Nothing about that idea is special to attitude. It works for any state that lives on a **Lie group** (say "lee").

A **[[group|group-word]]** is a set of things you can combine, where combining is always possible, there is a "do nothing" element (the **identity**), and every element can be undone (its **inverse**). Rotations are the standard example: do one rotation after another and you get a rotation; not turning at all is the identity; turning back undoes a turn. A **Lie group** is a group that is also a smooth curved space — a **manifold** — so you can talk about small, smooth changes.

The ones that matter in navigation are **matrix Lie groups**, whose elements are matrices and whose combining rule is matrix multiplication:

- $SO(3)$, the $3\times 3$ rotation matrices: attitude;
- $SE(2)$, a ground robot's position and heading together;
- $SE_2(3)$, the **[[extended pose|extended-pose]]**: attitude, velocity and position packed into one $5\times 5$ matrix — the natural home of an inertial navigator's state.

Every Lie group has a flat space attached at its identity, called its **Lie algebra**: the space of "small moves". For $SO(3)$ it is the rotation vectors. Two tools connect them:

- the **[[exponential map|exp-map]]** $\exp(\cdot)$ turns a small move into a group element — for $SO(3)$ it is the rotation-vector-to-rotation map this module has used throughout;
- the **hat** operator $\wedge$ turns a vector of numbers into the algebra's matrix form — for $SO(3)$, $\boldsymbol\xi^\wedge = \operatorname{skew}(\boldsymbol\xi)$.

With those, the on-manifold recipe is the MEKF's recipe for any matrix Lie group $G$:

::: key The on-manifold error
$$
\mathbf X_{\text{true}} = \mathbf X_{\text{nom}}\,\exp(\boldsymbol\delta\xi^\wedge), \qquad \mathbf X_{\text{nom}}\in G,
$$
with $\boldsymbol\delta\xi$ ("delta xi") a small vector in the Lie algebra. Injection multiplies the correction in, $\mathbf X_{\text{nom}}\leftarrow\mathbf X_{\text{nom}}\exp(\boldsymbol\delta\hat\xi^\wedge)$; reset zeroes $\boldsymbol\delta\hat\xi$ and turns $\mathbf P$ by a reset Jacobian — the same machinery as the previous two lessons.
:::

For $SO(3)$ this is exactly the MEKF's body-frame error, $\mathbf q_{\text{nom}}\otimes\delta\mathbf q$ in quaternion form.

## The property that matters: group-affine dynamics

Here is where Lie groups differ from each other. What matters is whether the **error's own dynamics** depend on the nominal.

In an ordinary EKF, the error-propagation Jacobian $\mathbf F(\hat{\mathbf x})$ is worked out at the filter's estimate. It changes as the estimate changes, and it is wrong when the estimate is wrong. Some systems, though, have a special structure. For them, a suitably chosen error — built with the group's own multiplication, the "body instruction" of the opening — evolves in a way that does not involve the state at all. Its Jacobian depends only on the **inputs**, like the gyro's reading. Such systems are called **group-affine**.

The suitable errors are called **invariant errors**, and there are two:

$$
\boldsymbol\eta_L = \mathbf X_{\text{nom}}^{-1}\mathbf X_{\text{true}} \quad(\text{left-invariant}), \qquad \boldsymbol\eta_R = \mathbf X_{\text{true}}\mathbf X_{\text{nom}}^{-1} \quad(\text{right-invariant}).
$$

The left-invariant one is unchanged if you multiply both states on the left by the same element; the right-invariant one, on the right. Our body-frame error, $\mathbf X_{\text{true}} = \mathbf X_{\text{nom}}\exp(\boldsymbol\delta\xi^\wedge)$, gives $\mathbf X_{\text{nom}}^{-1}\mathbf X_{\text{true}} = \exp(\boldsymbol\delta\xi^\wedge)$: it is the **left-invariant** error, even though the correction multiplies on the *right*. That **[[naming trap|left-right-naming]]** catches many people.

::: key Invariant EKF, one line
Define the error on the Lie group (left- or right-invariant). For group-affine dynamics the error propagation is log-linear and independent of the estimate, which removes a major source of EKF inconsistency.
:::

**Log-linear** means: write the invariant error as $\exp(\boldsymbol\delta\xi^\wedge)$ (so $\boldsymbol\delta\xi$ is its "logarithm"). Then

$$
\dot{\boldsymbol\delta\xi}=\mathbf F(\mathbf u)\,\boldsymbol\delta\xi,
$$

with $\mathbf F$ a function of the inputs $\mathbf u$ only, never of the estimate $\hat{\mathbf X}$. Barrau and Bonnabel showed more: without noise, this linear equation predicts the *true, nonlinear* error exactly, not only to first order. The propagated Jacobian is exact, even when the estimate is far off.

The previous lesson's $\mathbf F$ already had this shape. For attitude, the error dynamics were $\boldsymbol\delta\dot\theta = -\boldsymbol\omega\times\boldsymbol\delta\theta$: only the gyro rate appears, never $\mathbf q_{\text{nom}}$. The MEKF is the $SO(3)$ special case. The IEKF is the discovery that the same estimate-independence holds for much bigger states — including the extended pose of a full inertial navigator — whenever the system is group-affine and the matching invariant error is used.

::: note Why attitude kinematics are group-affine
A system $\dot{\mathbf X} = f_u(\mathbf X)$ on a matrix group is **group-affine** when, for any two elements $\mathbf A$ and $\mathbf B$,

$$
f_u(\mathbf A\mathbf B) = f_u(\mathbf A)\,\mathbf B + \mathbf A\,f_u(\mathbf B) - \mathbf A\,f_u(\mathbf I)\,\mathbf B.
$$

Test it on attitude driven by a body-frame gyro, $\dot{\mathbf R} = \mathbf R\,\boldsymbol\omega^\wedge$, so $f(\mathbf R) = \mathbf R\boldsymbol\omega^\wedge$ and $f(\mathbf I) = \boldsymbol\omega^\wedge$. The right side is

$$
\mathbf A\boldsymbol\omega^\wedge\mathbf B + \mathbf A\mathbf B\boldsymbol\omega^\wedge - \mathbf A\boldsymbol\omega^\wedge\mathbf B = \mathbf A\mathbf B\boldsymbol\omega^\wedge = f(\mathbf A\mathbf B).
$$

The first and last terms cancel, and the condition holds.

Now watch the left-invariant error $\boldsymbol\eta = \hat{\mathbf R}^{\mathsf T}\mathbf R$ move (for a rotation, the inverse is the transpose). With the same $\boldsymbol\omega$ driving both, the product rule gives

$$
\dot{\boldsymbol\eta} = \dot{\hat{\mathbf R}}{}^{\mathsf T}\mathbf R + \hat{\mathbf R}^{\mathsf T}\dot{\mathbf R} = -\boldsymbol\omega^\wedge\boldsymbol\eta + \boldsymbol\eta\,\boldsymbol\omega^\wedge,
$$

using $(\boldsymbol\omega^\wedge)^{\mathsf T} = -\boldsymbol\omega^\wedge$. Neither $\hat{\mathbf R}$ nor $\mathbf R$ appears on its own — only $\boldsymbol\eta$ and $\boldsymbol\omega$. With $\boldsymbol\eta \approx \mathbf I + \boldsymbol\delta\theta^\wedge$, this becomes $\boldsymbol\delta\dot\theta = -\boldsymbol\omega\times\boldsymbol\delta\theta$, the MEKF's error dynamics.
:::

::: example The same Jacobian at four very different attitudes
Check the claim with numbers, not just algebra. Spin at a fixed rate $\boldsymbol\omega=(5,-3,8)^\circ/\mathrm s$ for $\Delta t=0.2\,\mathrm s$, using the *exact* quaternion kinematics with no linearization. Start from four nominal attitudes spread across the space of orientations — rotation vectors of $(0,0,0)^\circ$, $(70,-40,100)^\circ$, $(170,20,-60)^\circ$ and $(-150,80,10)^\circ$. At each, nudge the body-frame error by $\pm10^{-6}$ on each axis, propagate exactly, and measure how the error comes out: a finite-difference Jacobian $\mathbf J$.

| nominal attitude | largest entry of $|\mathbf J-\mathbf J_{(0,0,0)}|$ |
| --- | --- |
| $(0,0,0)^\circ$ | $0$ (reference) |
| $(70,-40,100)^\circ$ | $2.6\times10^{-10}$ |
| $(170,20,-60)^\circ$ | $6.5\times10^{-11}$ |
| $(-150,80,10)^\circ$ | $1.2\times10^{-10}$ |

The four Jacobians agree to about ten decimal places — the size of finite-difference rounding. It is the same matrix at every attitude. It also matches the exact answer $\exp(-\operatorname{skew}(\boldsymbol\omega)\Delta t)$ to $3\times10^{-10}$. The first-order shortcut $\mathbf I-\operatorname{skew}(\boldsymbol\omega)\Delta t$ is off by $5.4\times10^{-4}$, about the size of the next Taylor term, $\tfrac12(\|\boldsymbol\omega\|\Delta t)^2 = \tfrac12(0.0350)^2 = 6.1\times 10^{-4}$.

Sanity check: nothing in the recipe used the nominal attitude except to build the test, so a filter using this Jacobian cannot be misled by a wrong attitude estimate during propagation.
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

def propagate_exact(q, omega, dt): return qmul(q, quat_from_rotvec(omega*dt))

def mult_error(q_nom, q_true):
    dq = qmul(qconj(q_nom), q_true)
    if dq[0] < 0: dq = -dq
    v = dq[1:]; n = np.linalg.norm(v)
    return np.zeros(3) if n < 1e-12 else (2*np.arctan2(n, dq[0])/n)*v

omega = np.radians(np.array([5.0,-3.0,8.0])); dt = 0.2
attitudes_deg = [(0,0,0), (70,-40,100), (170,20,-60), (-150,80,10)]
Js = []
for ang in attitudes_deg:
    q_nom = quat_from_rotvec(np.radians(np.array(ang)))
    q_nom_new = propagate_exact(q_nom, omega, dt)
    J = np.zeros((3,3)); eps = 1e-6
    for i in range(3):
        d = np.zeros(3); d[i] = eps
        ep = mult_error(q_nom_new, propagate_exact(qmul(q_nom, quat_from_rotvec(d)), omega, dt))
        em = mult_error(q_nom_new, propagate_exact(qmul(q_nom, quat_from_rotvec(-d)), omega, dt))
        J[:,i] = (ep-em)/(2*eps)
    Js.append(J)
    print(ang, np.max(np.abs(J-Js[0])))
# (0, 0, 0)         0.0
# (70, -40, 100)    2.6e-10
# (170, 20, -60)    6.5e-11
# (-150, 80, 10)    1.2e-10
```

### What it buys in practice

Two things. First, **stability**: Barrau and Bonnabel proved that for group-affine systems the IEKF converges locally like a well-behaved observer, and it tolerates much larger initial errors than a standard EKF — a larger **domain of attraction**, the set of starting errors from which it still finds the truth.

Second, **consistency**. A standard EKF's Jacobians carry its own estimation errors. In problems with directions that no measurement can ever see — such as the overall heading of a camera-plus-IMU system that only sees nearby landmarks — this fools the EKF into believing it has learned something about those unobservable directions. Its covariance shrinks where it should not, a well-documented failure in **[[visual-inertial odometry|vio]]**. The IEKF's estimate-independent Jacobians keep the unobservable directions unobservable, as they should be.

::: warning A gyro bias breaks the perfect case
The attitude-only example is exactly group-affine. Add a gyro bias to the state, as the MEKF does, and it no longer is: the nominal is spun by $\boldsymbol\omega_c = \boldsymbol\omega_{\text{meas}} - \hat{\mathbf b}$, and $\hat{\mathbf b}$ is part of the estimate. So the $\mathbf F$ of the MEKF depends on the estimated bias. Real inertial IEKFs carry biases this way anyway, as an "imperfect" IEKF: the attitude, velocity and position part keeps the invariant structure, and the bias part is handled like an ordinary EKF. It still performs very well, but the exactness claim no longer holds in full.
:::

## A non-invariant error, for contrast

Estimate-independence is not automatic just because *some* error was chosen. It comes from choosing the invariant one. Compare the naive choice the MEKF lesson rejected: treat the quaternion's four components as an ordinary vector, and linearize its propagation directly.

::: example The same four attitudes, with the naive 4-vector error
Repeat the test, but now nudge the raw quaternion components by $\pm10^{-6}$, renormalize (as any real implementation must, to stay on the sphere), and propagate $\mathbf q_{k+1}=\mathbf q_k\otimes\exp(\boldsymbol\omega\Delta t)$. The Jacobian is now $4\times 4$:

| nominal attitude | largest entry | largest $|\mathbf J-\mathbf J_{(0,0,0)}|$ | Frobenius $\|\mathbf J-\mathbf J_{(0,0,0)}\|$ |
| --- | --- | --- | --- |
| $(0,0,0)^\circ$ | $1.00$ | $0$ (reference) | $0$ |
| $(70,-40,100)^\circ$ | $0.92$ | $0.818$ | $1.27$ |
| $(170,20,-60)^\circ$ | $1.00$ | $1.000$ | $1.41$ |
| $(-150,80,10)^\circ$ | $1.00$ | $0.992$ | $1.41$ |

(The **Frobenius norm** is the square root of the sum of all squared entries: a single "size" for a matrix.) All the entries stay below about $1$, so the matrices *look* similar in size. But they are very different maps: the difference from the reference is as big as the entries themselves.

Where does the dependence come from? The quaternion product $\mathbf q\otimes\mathbf p$ is linear in $\mathbf q$, so on its own it would give the same matrix everywhere. The renormalization is what brings the attitude in. To first order it removes the part of any nudge that points along $\mathbf q$, which is the matrix $\mathbf I - \mathbf q\mathbf q^{\mathsf T}$, and the Jacobian becomes the fixed product matrix times that projector. (That formula matches all four tables to $10^{-10}$.) The projector depends on where $\mathbf q$ is. A covariance propagated this way is pushed through a different linear map depending on where the *estimate* sits — the estimate-dependence the EKF-divergence lesson warned about. Other non-invariant choices are worse: **[[Euler angles|euler-jacobian]]**, for example, give a Jacobian that blows up near $90^\circ$ of pitch.
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
def propagate_exact(q, omega, dt): return qmul(q, quat_from_rotvec(omega*dt))

omega = np.radians(np.array([5.0,-3.0,8.0])); dt = 0.2
attitudes_deg = [(0,0,0), (70,-40,100), (170,20,-60), (-150,80,10)]

def additive_jacobian(q_nom, omega, dt, eps=1e-6):
    J = np.zeros((4,4))
    for i in range(4):
        d = np.zeros(4); d[i] = eps
        qtp = q_nom+d; qtp /= np.linalg.norm(qtp)
        qtm = q_nom-d; qtm /= np.linalg.norm(qtm)
        J[:,i] = (propagate_exact(qtp, omega, dt) - propagate_exact(qtm, omega, dt))/(2*eps)
    return J

Js2 = []
for ang in attitudes_deg:
    q_nom = quat_from_rotvec(np.radians(np.array(ang)))
    J = additive_jacobian(q_nom, omega, dt)
    Js2.append(J)
    print(ang, np.max(np.abs(J)), np.max(np.abs(J-Js2[0])), np.linalg.norm(J-Js2[0]))
# (0, 0, 0)       1.00  0.0    0.0
# (70, -40, 100)  0.92  0.818  1.27
# (170, 20, -60)  1.00  1.000  1.41
# (-150, 80, 10)  1.00  0.992  1.41
```

## Beyond matrix groups: equivariant filtering

Not every state is naturally a matrix Lie group, even when the problem has a clear symmetry. A direction to a star is a point on a sphere, not a rotation. A landmark map plus a robot pose has symmetry, but it is not a single group element.

**[[Equivariant filtering|equivariant]]** takes the idea one step further. It asks only that some symmetry group **act** on the state space — move states around — in a way that the dynamics and measurements respect. "Respect" has a precise meaning: moving the state by a symmetry and then letting it evolve gives the same result as letting it evolve and then moving it. Those two orders **commute**. The filter then builds its error and its propagation from that action, whether or not the state space has a multiplication of its own.

The attitude and inertial-navigation cases in this module are the special case where the state space *is* the group and the symmetry is the group acting on itself by multiplication. The general principle is the same throughout: build the error from the symmetry the physical problem really has, not from whatever coordinates are convenient.

::: warning Group-affine is a real condition, not a label
Not every system is group-affine. Writing a state as a Lie-group element and using a multiplicative error does not, by itself, make the error dynamics independent of the estimate. If the dynamics lack the structure in the condition above, the invariant-error filter still ends up with a state-dependent Jacobian. The benefit is earned by systems that satisfy the condition — attitude kinematics, and inertial navigation on the extended pose without biases, are clean and important ones. Check the condition before claiming the benefit.
:::

::: warning Exact propagation is not immunity to divergence
An invariant filter's *propagation* no longer inherits the "linearized at a bad estimate" problem. That is a real improvement, but it is not a guarantee against every failure in this module. The *update* Jacobians are not automatically estimate-independent. $\mathbf Q$ and $\mathbf R$ still have to be tuned honestly. And a single Gaussian still cannot represent a posterior with two separate peaks — for that you still need the particle or Gaussian-sum machinery.
:::

## Check yourself

::: check
What makes a system "group-affine", and which part of the MEKF already showed this property before it had a name?
:::

::: answer
A system is group-affine when its dynamics satisfy $f_u(\mathbf A\mathbf B) = f_u(\mathbf A)\mathbf B + \mathbf A f_u(\mathbf B) - \mathbf A f_u(\mathbf I)\mathbf B$. The payoff is that the matching invariant error obeys $\dot{\boldsymbol\delta\xi}=\mathbf F(\mathbf u)\boldsymbol\delta\xi$, which depends only on the inputs $\mathbf u$ and never on the estimated state. The MEKF's attitude error dynamics, $\boldsymbol\delta\dot\theta = -\boldsymbol\omega_c\times\boldsymbol\delta\theta$, already had this form: only the gyro rate appears, and $\mathbf q_{\text{nom}}$ appears nowhere.
:::

::: check
In the naive comparison, no entry of the 4-vector Jacobian ever exceeded about $1$ in size, yet the matrices were called very different. Why does "bounded entries" not mean "the same matrix"?
:::

::: answer
Bounded entries limit only the overall size of a matrix, not which map it is. Two matrices with every entry between $-1$ and $1$ can send the same vector to completely different places — a rotation by $+90^\circ$ and one by $-90^\circ$ in the plane both have entries of size at most $1$, but they point any vector in opposite directions. The right comparison is the size of the *difference*. Here the Frobenius norm of the difference was $1.27$ to $1.41$, as large as the matrices themselves, so the maps really do differ from attitude to attitude.
:::

::: check
A designer decides that because the IEKF's propagation is estimate-independent, it cannot diverge the way the EKF did in the divergence lesson. What is missing from that reasoning?
:::

::: answer
Estimate-independence fixes one specific mechanism: the propagated Jacobian no longer depends on a possibly wrong estimate. It says nothing about the update step's Jacobians, which may still depend on the estimate. It says nothing about $\mathbf Q$ and $\mathbf R$ being right, so the mistuning divergence of the linear Kalman filter module can still happen. And it says nothing about whether one Gaussian can describe the posterior at all — a two-peaked posterior still needs a particle or Gaussian-sum filter. It is a real fix for a real problem, not a blanket guarantee.
:::

::: check
Suppose a system is group-affine and its nice error is the *right*-invariant one, $\mathbf X_{\text{true}}\mathbf X_{\text{nom}}^{-1}$. A filter is built with the left-invariant (body-frame) error anyway. What would you expect?
:::

::: answer
It would still be a valid multiplicative error-state filter: injection, reset and the rest all still work. But it would lose the property this lesson is about. Group-affine systems guarantee input-only error dynamics only for the invariant error that matches their structure; with the other one, the error dynamics generally pick up a dependence on the state. For inertial navigation with the world-frame gravity and position terms, for example, it is the right-invariant error on the extended pose that gives the clean result. The filter would not look obviously broken — it would simply give up the consistency and convergence benefits that motivated the design.
:::

::: check
How does equivariant filtering relate to the matrix-Lie-group construction, and how does it go beyond it?
:::

::: answer
The Lie-group construction is the special case where the state space *is* a group and the symmetry is the group acting on itself by multiplication — the split $\mathbf X_{\text{true}}=\mathbf X_{\text{nom}}\exp(\boldsymbol\delta\xi^\wedge)$. Equivariant filtering keeps the key requirement — that the problem's symmetry commutes with how the state evolves and is measured — but drops the requirement that the state itself be a group element. So the same design rule, "build the error from the problem's real symmetry", applies to states like directions on a sphere or a pose plus landmarks, which no single matrix group describes.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Lie group | A group that is also a smooth curved space | $SO(3)$, $SE(2)$, $SE_2(3)$ in navigation |
| On-manifold error | Nominal times a small move from the algebra | $\mathbf X_{\text{true}}=\mathbf X_{\text{nom}}\exp(\boldsymbol\delta\xi^\wedge)$ |
| Invariant errors | Built with the group's multiplication | left $\mathbf X_{\text{nom}}^{-1}\mathbf X_{\text{true}}$, right $\mathbf X_{\text{true}}\mathbf X_{\text{nom}}^{-1}$ |
| Group-affine | Invariant error depends on inputs only | $\dot{\boldsymbol\delta\xi}=\mathbf F(\mathbf u)\boldsymbol\delta\xi$, exact (log-linear) |
| Test (invariant) | Attitude Jacobian at four attitudes | identical to about $10^{-10}$ |
| Test (naive) | Raw 4-vector Jacobian | differs by Frobenius $1.27$–$1.41$, via the projector $\mathbf I-\mathbf q\mathbf q^{\mathsf T}$ |
| Payoff | Better consistency, larger domain of attraction | unobservable directions stay unobservable |
| Equivariant filtering | Build the filter from a symmetry acting on the state | no need for the state to be a group |
| Limits | Propagation only | update Jacobians, tuning and multi-peak posteriors still matter |

This lesson closes the module's tour of filter architectures. The last two lessons return to practical decisions every one of these filters eventually forces: which uncertain parameters to estimate at all, and how to run several motion models at once when you do not know in advance which one is right.

::: context group-word What mathematicians mean by a group
A **group** is any set with a way of combining two members into a third that obeys four rules: combining never leaves the set; grouping does not matter, $(ab)c = a(bc)$; there is an identity that changes nothing; and every member has an inverse that undoes it. Whole numbers under addition are a group (identity $0$, inverse $-n$). Rotations under "do one, then the other" are a group. Order *may* matter: rotations are a group where $ab$ and $ba$ usually differ.
:::

::: context extended-pose One matrix for a whole navigator
The extended pose packs attitude $\mathbf R$, velocity $\mathbf v$ and position $\mathbf p$ into one $5\times 5$ matrix. Multiplying two such matrices combines them the way navigation needs, and the inverse undoes it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="20" width="90" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="20" width="30" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="220" y="20" width="30" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="110" width="150" height="60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="145" y="70">R (3×3)</text><text x="205" y="70">v</text><text x="235" y="70">p</text>
    <text x="145" y="138">0</text><text x="205" y="132">1</text><text x="235" y="132">0</text>
    <text x="205" y="160">0</text><text x="235" y="160">1</text>
  </g>
  <line x1="190" y1="110" x2="190" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="190" y1="140" x2="250" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <text x="262" y="60" font-size="12" fill="#1f2a44">attitude,</text>
  <text x="262" y="76" font-size="12" fill="#1f2a44">velocity,</text>
  <text x="262" y="92" font-size="12" fill="#1f2a44">position</text>
</svg>
```

Barrau and Bonnabel showed that strapdown inertial navigation, with gravity and without sensor biases, is group-affine on this group — the main reason the IEKF caught on in navigation and legged robotics.
:::

::: context exp-map Wrapping a straight line onto a curve
The exponential map takes a straight step in the flat algebra and wraps it onto the curved group, keeping its length. On a circle (the rotations of a plane), a step of length $\theta$ along the tangent line wraps to the point $\theta$ radians around the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="100" r="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="210" y1="20" x2="210" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="210" y1="100" x2="210" y2="37" stroke="#1d6fd1" stroke-width="4"/>
  <path d="M210,100 A60,60 0 0 0 182.4,49.5" fill="none" stroke="#b4232c" stroke-width="4"/>
  <circle cx="210" cy="100" r="4" fill="#1f2a44"/>
  <circle cx="182.4" cy="49.5" r="4" fill="#b4232c"/>
  <text x="218" y="104" font-size="12" fill="#1f2a44">identity</text>
  <text x="218" y="46" font-size="12" fill="#1d6fd1">step θ in the algebra</text>
  <text x="70" y="36" font-size="12" fill="#b4232c">exp: θ around the circle</text>
</svg>
```

Here $\theta = 63/60 = 1.05\,\mathrm{rad}$, about $60^\circ$: the blue step and the red arc have the same length. For small steps the two nearly coincide, which is why $\delta\mathbf q\approx[1,\tfrac12\boldsymbol\delta\theta]$ works.
:::

::: context left-right-naming Right-multiplied, but left-invariant
"Left" and "right" in the names describe what leaves the error unchanged, not where the correction goes. The body-frame error $\mathbf X_{\text{nom}}^{-1}\mathbf X_{\text{true}}$ stays the same if both states are multiplied *on the left* by the same element — for attitude, if the whole reference frame is turned. So it is left-invariant, even though its correction multiplies $\mathbf X_{\text{nom}}$ on the *right*. Papers disagree on phrasing, so read each one's definition.
:::

::: context vio Cameras, IMUs and a fake certainty
Visual-inertial odometry (VIO) tracks a phone, drone or robot from a camera and an IMU. Nothing it sees fixes its absolute position or its heading around the vertical: move the whole world and every image looks the same. Those directions are unobservable. Standard EKF-based VIO was found to shrink its covariance along exactly those directions anyway, because Jacobians taken at slightly different estimates at different times do not agree with each other. Invariant filters, and "observability-constrained" EKFs, were two answers to it.
:::

::: context euler-jacobian Euler angles: a Jacobian that blows up
Run the same test with yaw–pitch–roll angles as the error, at zero yaw and roll. The chart shows the largest off-identity entry of the $0.2\,\mathrm s$ error Jacobian, on a scale where each gridline is ten times the one below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="0.8">
    <line x1="60" y1="160" x2="340" y2="160"/><line x1="60" y1="120" x2="340" y2="120"/>
    <line x1="60" y1="80" x2="340" y2="80"/><line x1="60" y1="40" x2="340" y2="40"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="54" y="164">0.01</text><text x="54" y="124">0.1</text><text x="54" y="84">1</text><text x="54" y="44">10</text>
  </g>
  <rect x="80" y="142.2" width="44" height="17.8" fill="#1d6fd1"/>
  <rect x="145" y="118.8" width="44" height="41.2" fill="#1d6fd1"/>
  <rect x="210" y="83.8" width="44" height="76.2" fill="#f2b880"/>
  <rect x="275" y="40.4" width="44" height="119.6" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="102" y="136">0.028</text><text x="167" y="112">0.107</text><text x="232" y="77">0.80</text><text x="297" y="34">9.75</text>
    <text x="102" y="178">pitch 0°</text><text x="167" y="178">60°</text><text x="232" y="178">80°</text><text x="297" y="178">88°</text>
  </g>
</svg>
```

The Jacobian depends strongly on the attitude estimate and grows without limit near $90^\circ$ pitch, the gimbal-lock point. It is the opposite of an invariant error.
:::

::: context equivariant Where equivariant filtering came from
The equivariant filter (EqF) was developed around 2020 by Robert Mahony and collaborators, including Pieter van Goor and Tarek Hamel. It grew out of years of work on nonlinear observers that use symmetry, and it contains the IEKF as a special case. "Equivariant" means "varying in the same way": if you transform the input by a symmetry, the output is transformed by the matching symmetry.
:::
