---
id: l12-invariant-and-on-manifold-ekf
title: On-manifold and invariant EKF, equivariant filtering
minutes: 20
covers:
  - On-manifold and invariant EKF (IEKF), equivariant filtering
---

The Multiplicative EKF built one specific instance of a more general idea: when the true state lives on a curved space rather than a vector space, split it into a nominal (on the curved space, propagated exactly) and an error (in the flat tangent space at that nominal, small, estimated by an ordinary Kalman recursion). Quaternions and $SO(3)$ were this module's example, but nothing about "nominal plus tangent-space error" is specific to attitude. Any state that lives on a **Lie group** — a space that is simultaneously a smooth manifold and a group, with a well-defined multiplication, identity, and inverse — admits the identical architecture: attitude and gyro bias together, a full inertial navigation state of position, velocity and attitude, even a 2-D robot's position and heading. This lesson generalizes the recipe, and names a specific property — present in the attitude case this module already built, present in some other important navigation states, and decidedly absent in others — that decides whether the generalization buys anything the ordinary EKF did not already have.

## The on-manifold recipe, and the property that makes it special

For any matrix Lie group $G$ with identity element $\mathbf I$, the same split applies: $\mathbf X_{\text{true}} = \mathbf X_{\text{nom}}\cdot\exp(\boldsymbol\delta\xi^\wedge)$, with $\mathbf X_{\text{nom}}\in G$ the nominal, $\boldsymbol\delta\xi$ a small vector in the group's tangent space at the identity (its **Lie algebra**), $\exp(\cdot)$ the group's exponential map (for $SO(3)$, exactly the rotation-vector-to-quaternion map this module has used throughout), and $\wedge$ the operator turning a vector into the algebra's matrix form. Injection multiplies the correction in; reset re-zeros $\boldsymbol\delta\xi$ and transforms the covariance by a reset Jacobian — the exact machinery the previous two lessons already built, now stated for an arbitrary group rather than specifically $SO(3)$.

What changes from one Lie group to another is whether the **error's own dynamics** end up depending on the nominal trajectory. For an ordinary EKF's state-dependent Jacobian $\mathbf F(\hat{\mathbf x})$ — and, in principle, for a naively-chosen tangent-space error too — the linearization used to propagate uncertainty is evaluated at the filter's own current estimate, which the divergence lesson showed can be badly wrong. A system is called **group-affine** when a specific, correctly-chosen invariant error (built from the group's own left or right multiplication, exactly the "body-frame" construction the MEKF lesson fixed for attitude) obeys dynamics that do **not** depend on the nominal trajectory at all — the Jacobian is the same matrix regardless of where in the state space the filter currently believes it is, computed once from the *inputs* (gyro rate, in the attitude case) and nothing else.

::: key Group-affine error dynamics
For a group-affine system, the invariant error $\boldsymbol\delta\xi$ obeys a **log-linear** equation, $\dot{\boldsymbol\delta\xi}=\mathbf F(\mathbf u)\,\boldsymbol\delta\xi$, with $\mathbf F$ a function of the system's inputs $\mathbf u$ only — never of the estimated state $\hat{\mathbf X}$. The propagated Jacobian is therefore **exact**, not merely a first-order approximation taken at a possibly-wrong estimate, which removes a structural source of the exact inconsistency mechanism the divergence lesson demonstrated for the ordinary EKF.
:::

This is not a new claim invented for this lesson — it is precisely what the previous lesson's error-dynamics matrix already showed, without naming the property: $\mathbf F=-\operatorname{skew}(\boldsymbol\omega_{\text{corr}})$ for the attitude error depends only on the (bias-corrected) gyro rate, never on the nominal quaternion $\mathbf q_{\text{nom}}$ itself. The Multiplicative EKF is the $SO(3)$-only special case of exactly the group-affine, invariant-error idea this lesson generalizes; the **invariant EKF (IEKF)**, developed by Barrau and Bonnabel, is the recognition that this same estimate-independence holds for a much broader class of systems on other matrix Lie groups — including, importantly, the combined position–velocity–attitude "extended pose" group an inertial navigator's full state naturally lives on — whenever the group-affine condition holds and the invariant (not an arbitrary) error is used.

::: example State-independence, checked exactly, at four widely-separated attitudes
Take the attitude error dynamics from the previous lesson, $\mathbf F=-\operatorname{skew}(\boldsymbol\omega)$, and verify — not merely assert — that it is the same matrix regardless of the nominal attitude. Propagate a small body-frame error through the *exact*, unlinearized quaternion kinematics for $\Delta t=0.2\,\mathrm s$ under a fixed rate $\boldsymbol\omega=(5,-3,8)^\circ/\mathrm s$, starting from four nominal attitudes covering essentially the whole range of orientations: $(0,0,0)^\circ$, $(70,-40,100)^\circ$, $(170,20,-60)^\circ$, $(-150,80,10)^\circ$. Recover the error-propagation Jacobian at each by finite difference on the exact nonlinear map:

| nominal attitude | max $|J-J_{(0,0,0)}|$ |
| --- | --- |
| $(0,0,0)^\circ$ | $0$ (reference) |
| $(70,-40,100)^\circ$ | $2.6\times10^{-10}$ |
| $(170,20,-60)^\circ$ | $6.5\times10^{-11}$ |
| $(-150,80,10)^\circ$ | $1.2\times10^{-10}$ |

Every entry agrees with the first to within machine precision — not approximately, not "close enough," but the identical matrix, to ten significant figures, at four attitudes that differ from each other by as much as $180^\circ$ in some axes. The formula $\mathbf I-\operatorname{skew}(\boldsymbol\omega)\Delta t$ matches all four to within $5\times10^{-4}$, the expected size of the next term in its own Taylor expansion in $\Delta t$.
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

## What a naive (non-invariant) tangent-space error looks like instead

The state-independence above is not automatic just because *some* tangent-space error was chosen — it is a consequence of choosing the *invariant* (body-frame, group-multiplicative) one specifically. A naive choice — treat the quaternion's own four components as an ordinary vector and linearize its propagation directly, exactly the additive parameterization the Multiplicative EKF lesson opened by rejecting — has no such property.

::: example The same four attitudes, the naive parameterization's Jacobian
Repeat the identical exercise, but linearize the raw $4$-vector propagation $\mathbf q_{k+1}=\mathbf q_k\otimes\exp(\boldsymbol\omega\Delta t)$ directly with respect to $\mathbf q_k$'s own components, instead of the invariant body-frame error:

| nominal attitude | max entry | max $|J-J_{(0,0,0)}|$ | Frobenius $\|J-J_{(0,0,0)}\|$ |
| --- | --- | --- | --- |
| $(0,0,0)^\circ$ | $1.00$ | $0$ (reference) | $0$ |
| $(70,-40,100)^\circ$ | $0.92$ | $0.818$ | $1.27$ |
| $(170,20,-60)^\circ$ | $1.00$ | $1.000$ | $1.41$ |
| $(-150,80,10)^\circ$ | $1.00$ | $0.992$ | $1.41$ |

Every entry in this Jacobian is bounded (the quaternion components themselves are bounded), so the *magnitude* of the matrix looks similar from one attitude to the next — but the matrix itself is a genuinely different linear map at each nominal, differing from the identity-attitude baseline by nearly as much as the matrices' own entries, at every one of the three attitudes tested away from the reference. A covariance propagated with this Jacobian is being pushed through a *different* linear approximation depending on where the filter's own estimate happens to sit — precisely the estimate-dependence the divergence lesson identified as the EKF's structural weakness, reproduced here in a different, non-invariant choice of attitude parameterization.
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
    J = np.zeros((4,4)); q_nom_new = propagate_exact(q_nom, omega, dt)
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

Not every state a filter cares about is naturally a matrix Lie group, even when it has real, exploitable symmetry. **Equivariant filtering** generalizes the idea one step further: rather than requiring the state to literally be a matrix group element, it asks only that some symmetry group act on the state space in a way that the system's dynamics and measurements respect — commute with, in the technical sense — and builds the filter's error and its propagation directly from that action, whether or not the state space itself has a group multiplication of its own. The attitude and inertial-navigation cases this module and its prerequisites cover are the concrete, matrix-Lie-group special case; equivariant filtering is the statement that the same underlying idea — build the error from the symmetry the physical problem actually has, not from whatever coordinates happen to be convenient — extends past that special case.

::: warning Group-affine is a real condition, not a label to apply hopefully
Not every state-and-dynamics pair is group-affine, and the payoff this lesson demonstrated — an error Jacobian with no dependence on the current estimate — is not available just by wishing a system onto a Lie group. A system with dynamics that do not have the affine structure Barrau and Bonnabel's condition requires will, even after being written as a nominal-plus-invariant-error filter, still end up with a state-dependent error Jacobian; the benefit demonstrated here is earned by systems that actually satisfy the condition; the attitude kinematics this module has used throughout happen to be one of the clean, practically important cases that do.
:::

::: warning State-independence of the Jacobian is not the same claim as immunity to divergence
An invariant, group-affine filter's *propagated* covariance no longer inherits the specific "linearized at a bad estimate" pathology the divergence lesson demonstrated for the ordinary EKF — a real, structural improvement. It is not, by itself, a guarantee against every failure mode this module has covered: a group-affine filter can still be fed a genuinely non-Gaussian or multi-modal posterior it cannot represent, still needs correctly-tuned $\mathbf Q$ and $\mathbf R$, and still needs the update step's own Jacobians (which are not automatically state-independent merely because the propagation step's is) checked on their own terms.
:::

## Check yourself

::: check
State the specific property that makes a system "group-affine," and identify which part of the Multiplicative EKF's own machinery already exhibited it, one lesson before this term was introduced.
:::

::: answer
A system is group-affine when the correctly-chosen invariant error's dynamics, $\dot{\boldsymbol\delta\xi}=\mathbf F(\mathbf u)\boldsymbol\delta\xi$, depend only on the system's inputs $\mathbf u$ and never on the estimated state itself. The Multiplicative EKF lesson's error-propagation matrix, $\mathbf F=-\operatorname{skew}(\boldsymbol\omega_{\text{corr}})$, already had exactly this property — a function of the bias-corrected gyro rate alone, with no $\mathbf q_{\text{nom}}$ anywhere in the formula — without that lesson needing to name it.
:::

::: check
In the worked comparison, the naive additive Jacobian's individual entries never exceeded about $1.0$ in magnitude at any of the four attitudes, yet the matrices were shown to be very different from one another. Explain why "bounded entries" does not imply "the same matrix."
:::

::: answer
A matrix's entries being bounded constrains only its overall scale, not its direction or structure — two matrices can each have entries no larger than $1$ in magnitude while representing completely different linear maps, exactly as the measured Frobenius differences of $1.27$–$1.41$ (comparable to the matrices' own overall size) demonstrate. The relevant comparison is not "how big are the entries" but "how similar is the map from one matrix to the next," which the max-difference and Frobenius-norm columns measure directly and which showed substantial disagreement at every attitude tested away from the reference.
:::

::: check
A filter designer, impressed by the invariant EKF's estimate-independent propagation, assumes the resulting filter cannot diverge the way the ordinary EKF did in the divergence lesson. What specific gap in this reasoning does this lesson's second warning identify?
:::

::: answer
Estimate-independence removes one specific mechanism of inconsistency — the propagated Jacobian no longer depends on a possibly-wrong current estimate — but it says nothing about the *update* step's Jacobian, about whether $\mathbf Q$ and $\mathbf R$ are tuned correctly, or about whether the true posterior is well described by a single Gaussian at all. A group-affine, invariant filter could still exhibit the linear-filter mistuning divergence the Kalman filter module covered, or need the particle-filter machinery this module built for a genuinely multi-modal posterior; "state-independent propagation" is a real, specific fix for a real, specific problem, not a blanket immunity.
:::

::: check
Suppose a state's dynamics were group-affine only under the *left*-invariant error convention, not the right-invariant (body-frame) one this module has used throughout for attitude. What would you expect to happen if a filter were built using the right-invariant error anyway?
:::

::: answer
The filter would lose the state-independence property this lesson demonstrated — the whole point of the group-affine condition is that it holds for a *specific* choice of invariant error (left or right, depending on the system), and using the other one is no longer guaranteed to produce input-only error dynamics. The resulting filter would still be a valid multiplicative error-state filter, with all of the previous two lessons' injection-and-reset machinery still applicable, but its propagated Jacobian could once again depend on the current estimate, giving up the specific benefit this lesson is about without necessarily being obviously broken in any other respect.
:::

::: check
How does equivariant filtering's requirement — that a symmetry group's action on the state space commute with the dynamics and measurements — relate to, but go beyond, the matrix-Lie-group construction this lesson used for attitude?
:::

::: answer
The matrix-Lie-group construction is the special case where the state space *is* a group and the "symmetry" is the group acting on itself by its own multiplication — exactly the $\mathbf X_{\text{nom}}\cdot\exp(\boldsymbol\delta\xi^\wedge)$ split this lesson opened with. Equivariant filtering keeps the essential requirement — that the physically meaningful transformations of the problem commute with how the state actually evolves and is measured — while dropping the requirement that the state space itself have a group multiplication of its own, letting the same design principle (build the error from the problem's real symmetry, not from an arbitrary choice of coordinates) apply to state spaces a matrix Lie group cannot directly describe.
:::

## Summary

| Item | Statement |
| --- | --- |
| On-manifold recipe | $\mathbf X_{\text{true}}=\mathbf X_{\text{nom}}\cdot\exp(\boldsymbol\delta\xi^\wedge)$ for any matrix Lie group; identical nominal/error/injection/reset architecture as the attitude-specific MEKF, generalized |
| Group-affine | The invariant error's dynamics depend on the system's inputs only, never on the estimated state — a real, checkable condition, not automatic |
| Demonstrated (invariant) | Attitude error Jacobian identical to $10$ significant figures across four attitudes spanning $180^\circ$ of difference |
| Demonstrated (naive) | The raw-quaternion-component Jacobian differs substantially (Frobenius norm up to $1.41$) across the same four attitudes |
| Equivariant filtering | Generalizes further: build the filter from a symmetry group's action on the state space, without requiring the state space itself to be a matrix Lie group |
| Limits | Fixes estimate-dependence in propagation specifically; does not by itself address mistuning, non-Gaussian posteriors, or the update step's own Jacobians |

This lesson closes the module's tour of filter architectures. The remaining two lessons return to practical decisions every one of these filters eventually forces: which parameters are worth estimating at all, and how to combine several candidate dynamics models when a single one is not known in advance to be the right one.
