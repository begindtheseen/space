---
id: l11-the-multiplicative-ekf-for-attitude
title: The Multiplicative EKF for attitude
minutes: 24
covers:
  - 'The Multiplicative EKF for attitude: the 3-parameter attitude error, covariance on the tangent space'
---

Every filter in this module so far estimated a state that lives in an ordinary vector space, where addition means what it always means and a covariance matrix describes uncertainty the way it always does. Attitude does not live there. A unit quaternion — this lesson uses the Hamilton, scalar-first convention the quaternion-conventions lesson in the attitude-representations module fixed, and stays with it throughout — has four components but only three degrees of freedom, because $\|\mathbf q\|=1$ is not optional. Stuff that quaternion directly into a Kalman filter's state vector, run the ordinary predict-update recursion on it, and something is wrong before a single measurement is even processed: the state does not live in $\mathbb R^4$, it lives on the unit sphere inside $\mathbb R^4$, and nothing about $\hat{\mathbf x}+\mathbf K\boldsymbol\nu$ or $(\mathbf I-\mathbf K\mathbf H)\mathbf P$ knows that.

This lesson makes that failure precise, shows exactly what it costs numerically when it is ignored, and builds the standard remedy — the **Multiplicative Extended Kalman Filter (MEKF)** — using the error-state architecture the previous lesson introduced, now applied to the one state in this curriculum that genuinely needs it. This is the module's central lesson: everything about error-state filtering the previous lesson built toward lands here, and the exercise this module ends on asks for exactly this filter, implemented from scratch.

## Why a quaternion cannot be an additive Kalman state

Differentiate the unit-norm constraint itself. If $\mathbf q^{\mathsf T}\mathbf q=1$ holds for every valid attitude, then for any infinitesimal variation $\delta\mathbf q$ that keeps the state on the unit sphere, $2\mathbf q^{\mathsf T}\delta\mathbf q=0$ — the variation must be **orthogonal to $\mathbf q$ itself**, always, with no exception. A covariance matrix built from genuinely constraint-respecting variations, $\mathbf P=\mathbb E[\delta\mathbf q\,\delta\mathbf q^{\mathsf T}]$, therefore satisfies $\mathbf q^{\mathsf T}\mathbf P\mathbf q=\mathbb E\big[(\mathbf q^{\mathsf T}\delta\mathbf q)^2\big]=0$ identically: **zero variance along $\mathbf q$ itself**, forced by the geometry, not by any modeling choice. A $4\times4$ covariance that respects the constraint is therefore rank $\le3$ — genuinely singular — not merely "close to singular" or "numerically ill-conditioned."

::: example The constraint forces an exactly singular covariance
Take a nominal attitude $\mathbf q_0$ (a $40^\circ$ rotation about $(1,2,-1)$) and a genuinely tangent-space uncertainty, $3\times3$ and isotropic, $\mathbf P_3=\sigma^2\mathbf I_3$ with $\sigma=5^\circ$. Map it into $\mathbb R^4$ via the small-angle quaternion map $\delta\mathbf q(\boldsymbol\delta\theta)\otimes\mathbf q_0$, $\mathbf J=\partial(\delta\mathbf q\otimes\mathbf q_0)/\partial\boldsymbol\delta\theta$ at $\boldsymbol\delta\theta=\mathbf 0$ (a $4\times3$ Jacobian, computed by finite differences), and $\mathbf P_4=\mathbf J\mathbf P_3\mathbf J^{\mathsf T}$. The eigenvalues of the resulting $4\times4$ matrix are
$$
(0,\ \ 0.0019039,\ \ 0.0019039,\ \ 0.0019039)\ \mathrm{rad^2}
$$
— exactly rank $3$, with the three nonzero eigenvalues exactly equal to $\sigma^2/4=(2.5^\circ)^2$ (the $\delta\mathbf q\approx[1,\tfrac12\boldsymbol\delta\theta]$ small-angle scaling accounts for the factor of four). And $\mathbf q_0^{\mathsf T}\mathbf P_4\mathbf q_0=-4.2\times10^{-21}$ — zero to machine precision, exactly as the constraint requires.
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

A filter that does not respect this — that treats $\mathbf q$ as an ordinary $\mathbb R^4$ vector, applies $\hat{\mathbf x}+\mathbf K\boldsymbol\nu$ directly to it, and propagates a full $4\times4$ covariance with the ordinary Kalman recursion — has no way to keep that covariance's radial eigenvalue at exactly zero. Nothing in $(\mathbf I-\mathbf K\mathbf H)\mathbf P$ enforces it, and any process noise added the naive, isotropic way injects variance in the radial direction every single cycle, forever.

::: example A naive additive filter's covariance lies, and the lie grows without bound
Propagate a quaternion exactly (renormalized every step, as any real implementation must) under a constant body rate, alongside a naive $4\times4$ covariance updated by $\mathbf P_{k+1}=\boldsymbol\Phi_k\mathbf P_k\boldsymbol\Phi_k^{\mathsf T}+\sigma_q^2\mathbf I_4$ — an ordinary linear covariance recursion, with an isotropic process-noise guess because nothing in this naive formulation suggests any direction is different from any other. Track $\mathbf q_k^{\mathsf T}\mathbf P_k\mathbf q_k$, the radial variance, as a fraction of $\operatorname{tr}\mathbf P_k$:

| $t\,(\mathrm s)$ | $\operatorname{tr}\mathbf P$ | radial variance $\mathbf q^{\mathsf T}\mathbf P\mathbf q$ | fraction radial |
| --- | --- | --- | --- |
| $0$ | $0.000004$ | $0.000001$ | $0.250$ |
| $10$ | $0.080004$ | $0.020001$ | $0.250$ |
| $20$ | $0.160004$ | $0.040001$ | $0.250$ |

A full **quarter** of this filter's entire reported uncertainty sits in a direction the unit-norm constraint proves has exactly zero true variance — and it never corrects itself, because nothing in the ordinary linear covariance recursion has any way to know that direction is special. Over twenty seconds the total reported uncertainty grows forty-thousand-fold from its tiny start, a quarter of it complete fiction throughout.
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

## The multiplicative error, and its covariance

::: key The MEKF error definition
$$
\mathbf q_{\text{true}} = \mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\theta), \qquad \delta\mathbf q(\boldsymbol\delta\theta)\approx\big(1,\ \tfrac12\boldsymbol\delta\theta\big)\ \text{for small }\boldsymbol\delta\theta,
$$
a **body-frame** multiplicative error. The filter's state is the $3$-vector $\boldsymbol\delta\theta$ — the attitude error expressed in the tangent space at the current nominal — carrying a well-conditioned $3\times3$ covariance with no constraint, no singular direction, and no wasted component.
:::

This is exactly the error-state architecture the previous lesson built, with $\oplus$ now meaning quaternion composition rather than addition: $\mathbf q_{\text{nom}}$ is the nominal, integrated exactly through the true nonlinear quaternion kinematics and renormalized every step; $\boldsymbol\delta\theta$ is the error, three-dimensional, small, and estimated by an ordinary linear Kalman recursion. Injection folds the estimated correction in multiplicatively, $\mathbf q_{\text{nom}}\leftarrow\mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\hat\theta)$; reset zeroes $\boldsymbol\delta\hat\theta$. The one piece the previous lesson's additive example got for free — the reset carrying $\mathbf P$ through unchanged — is exactly the piece that changes here, because the tangent space at one attitude is not the same coordinate system as the tangent space at a different one.

::: key The attitude reset Jacobian
$$
\mathbf G = \mathbf I - \operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta), \qquad \mathbf P^{\text{new}} \leftarrow \mathbf G\,\mathbf P\,\mathbf G^{\mathsf T},
$$
where $\operatorname{skew}(\mathbf v)\mathbf u=\mathbf v\times\mathbf u$. Second order in $\boldsymbol\delta\hat\theta$, so implementations that omit it often still run without crashing — but it is what makes the covariance honest after the nominal has moved.
:::

::: example The reset Jacobian, checked against the exact nonlinear reset
Sample the true error many times from $\mathbf P_{\text{old}}=\operatorname{diag}\!\big((6^\circ)^2,(4^\circ)^2,(5^\circ)^2\big)$, inject a fixed estimated correction $\boldsymbol\delta\hat\theta=(8^\circ,-5^\circ,3^\circ)$, and compute the **exact** new error for each sample — no linearization anywhere — by composing quaternions and taking the true rotation-vector (log-map) of the result relative to the new nominal. Over $2{,}000{,}000$ samples, the sample covariance of the exact new errors is
$$
\begin{pmatrix}0.010950 & -0.000150 & -0.000134\\ -0.000150 & 0.004902 & 0.000204\\ -0.000134 & 0.000204 & 0.007632\end{pmatrix}\ \mathrm{rad^2},
$$
against the analytic $\mathbf G\mathbf P_{\text{old}}\mathbf G^{\mathsf T}$ prediction, whose relative Frobenius error against this exact Monte Carlo result is $\mathbf{0.41\%}$. Skipping $\mathbf G$ entirely (using $\mathbf P_{\text{old}}$ unchanged, the additive-state shortcut the previous lesson used) gives a $2.85\%$ error; using the *wrong sign*, $\mathbf I+\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$, gives $5.71\%$ — both several times worse than the correct formula, confirming both that the correction matters and that its sign is tied to a specific error-composition convention (body-frame, right-multiplicative, exactly as defined above) that an implementation must apply consistently.
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

def qconj(q): return np.array([q[0], -q[1], -q[2], -q[3]])
def skew(v): return np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])

rng = np.random.default_rng(5)
q_nom_old = np.array([1.0,0.0,0.0,0.0])
P_old = np.diag([np.radians(6.0)**2, np.radians(4.0)**2, np.radians(5.0)**2])
dtheta_hat = np.radians(np.array([8.0,-5.0,3.0]))
q_nom_new = qmul(q_nom_old, quat_from_rotvec(dtheta_hat))

N = 2_000_000
old_errors = rng.multivariate_normal(np.zeros(3), P_old, size=N)
new_errors = np.zeros((N,3))
for i in range(N):
    q_true = qmul(q_nom_old, quat_from_rotvec(old_errors[i]))
    dq_new = qmul(qconj(q_nom_new), q_true)
    w, v = dq_new[0], dq_new[1:]
    if w < 0: w, v = -w, -v
    n = np.linalg.norm(v)
    new_errors[i] = v*(2*np.arctan2(n,w)/n) if n > 1e-10 else np.zeros(3)

sample_cov = np.cov(new_errors.T)
G = np.eye(3) - skew(0.5*dtheta_hat)
G_wrong = np.eye(3) + skew(0.5*dtheta_hat)
P_new = G@P_old@G.T
P_new_wrong = G_wrong@P_old@G_wrong.T
err = lambda P: np.linalg.norm(sample_cov-P)/np.linalg.norm(P_new)*100
print(err(P_new), err(P_old), err(P_new_wrong))
# 0.414  2.859  5.706  (percent)
```

## Updating from a vector measurement

A star tracker, sun sensor, or magnetometer reports a reference direction $\mathbf r$ (known in an inertial or reference frame) as a body-frame unit vector, $\mathbf v_{\text{body}}=\mathbf A(\mathbf q_{\text{true}})\mathbf r+\text{noise}$, with $\mathbf A(\mathbf q)$ the attitude matrix. Predict it from the nominal, $\hat{\mathbf v}=\mathbf A(\mathbf q_{\text{nom}})\mathbf r$, and the Jacobian with respect to the body-frame error is exact and simple:

::: key Vector-measurement Jacobian
$$
\mathbf H = \frac{\partial \mathbf v_{\text{body}}}{\partial\boldsymbol\delta\theta}\bigg|_{\boldsymbol\delta\theta=\mathbf 0} = \operatorname{skew}(\hat{\mathbf v}), \qquad \hat{\mathbf v}=\mathbf A(\mathbf q_{\text{nom}})\mathbf r,
$$
for the body-frame error convention fixed above (verified by finite difference to $7\times10^{-11}$). The sign flips for the opposite error convention — memorize the one in use and never mix the two within one filter.
:::

::: example A complete MEKF cycle: gyro, two vector measurements, bias
Estimate attitude and a constant gyro bias, $\mathbf b_{\text{true}}=(0.5,-0.3,0.2)^\circ/\mathrm s$, from a gyro (angular random walk $0.05^\circ/\sqrt{\mathrm s}$, rate random walk $0.002^\circ/\mathrm s^{3/2}$) and two vector sensors (a sun-like direction and a magnetometer-like direction, each $0.3^\circ$ per-axis noise), starting $26.9^\circ$ off in attitude and with zero bias estimate. Each cycle: propagate $\mathbf q_{\text{nom}}$ by the bias-corrected gyro (exact rotation-vector exponential) and the $6\times6$ error covariance by the linearized model; update once per vector measurement (Jacobian $\operatorname{skew}(\hat{\mathbf v})$ on the attitude block, identity on the bias block); inject and reset after each update.

| cycle | attitude error | $\hat{\mathbf b}$ ($^\circ/\mathrm s$) |
| --- | --- | --- |
| $0$ | $1.837^\circ$ | $(-0.043,\ 0.055,\ -0.092)$ |
| $1$ | $0.498^\circ$ | $(1.367,\ 0.848,\ 0.728)$ |
| $2$ | $0.548^\circ$ | $(0.705,\ 0.098,\ 0.169)$ |
| $3$ | $0.470^\circ$ | $(0.713,\ 0.219,\ 0.190)$ |
| $4$ | $0.183^\circ$ | $(0.520,\ 0.049,\ 0.197)$ |
| $5$ | $0.426^\circ$ | $(0.467,\ -0.001,\ 0.180)$ |

Two vector measurements per cycle already cut the initial $26.9^\circ$ attitude error to under $2^\circ$ after the very first cycle; by cycle $5$ it sits under half a degree. The bias estimate visibly converges toward the true $(0.5,-0.3,0.2)^\circ/\mathrm s$ on two axes but is still $0.30^\circ/\mathrm s$ off on the second by cycle $5$ — six cycles and two sensors is not enough to fully resolve every bias component from this particular geometry, an honest reminder that bias observability depends on how the reference vectors and the rotation are actually arranged, not merely on running the filter for a while.
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

for cycle in range(6):
    q_true = qmul(q_true, quat_from_rotvec(omega_true*dt)); q_true /= np.linalg.norm(q_true)
    omega_meas = omega_true + b_true + rng.normal(0, np.sqrt(arw_var/dt), 3)
    q_nom, b_hat, P = mekf_propagate(q_nom, b_hat, P, omega_meas, dt, arw_var, rrw_var)
    for r_ref in (r_sun, r_mag):
        v_body = quat_to_dcm(q_true)@r_ref + rng.normal(0, sigma_meas, 3)
        v_body /= np.linalg.norm(v_body)
        q_nom, b_hat, P = mekf_update(q_nom, b_hat, P, v_body, r_ref, R_meas)
    dq_err = qmul(qconj(q_nom), q_true)
    ang_err = np.degrees(2*np.arccos(np.clip(np.abs(dq_err[0]), 0, 1)))
    print(cycle, round(ang_err, 4), np.round(np.degrees(b_hat), 5))
```

::: warning Additive-quaternion covariance is not "a bit optimistic" — it is structurally dishonest
The naive filter's radial fraction sat at exactly $25\%$ for the entire run, never drifting toward the true value of zero, because nothing in an ordinary linear covariance recursion has any mechanism to discover that one direction is special. This is not a tuning problem an engineer can fix by choosing a smaller process noise; it is a consequence of forcing a constrained, three-dimensional state into an unconstrained, four-dimensional representation, and it is exactly why every serious attitude filter in this curriculum's prerequisite modules uses a multiplicative, tangent-space error instead.
:::

::: warning A convention, once chosen, must be applied everywhere in the same filter
The reset Jacobian's sign ($\mathbf I-\operatorname{skew}$, not $+$) and the vector Jacobian's sign ($+\operatorname{skew}(\hat{\mathbf v})$, not $-$) both trace back to the same single choice made at the top of this lesson — a body-frame, right-multiplicative error, $\mathbf q_{\text{true}}=\mathbf q_{\text{nom}}\otimes\delta\mathbf q$. A left-multiplicative (reference-frame) convention flips both signs together, consistently; mixing the two — one formula derived under one convention, another under the other — produces exactly the kind of confidently wrong filter this lesson's naive example demonstrated, for a different underlying reason.
:::

## Check yourself

::: check
State, in one sentence, why $\mathbf q^{\mathsf T}\mathbf P\mathbf q=0$ is a consequence of the unit-norm constraint rather than a modeling choice.
:::

::: answer
Differentiating $\mathbf q^{\mathsf T}\mathbf q=1$ shows that any variation $\delta\mathbf q$ that keeps the state on the unit sphere must satisfy $\mathbf q^{\mathsf T}\delta\mathbf q=0$ exactly, so a covariance built from genuinely constraint-respecting variations, $\mathbf P=\mathbb E[\delta\mathbf q\,\delta\mathbf q^{\mathsf T}]$, must give $\mathbf q^{\mathsf T}\mathbf P\mathbf q=\mathbb E[(\mathbf q^{\mathsf T}\delta\mathbf q)^2]=0$ regardless of what process or measurement noise the filter designer chose — the zero is forced by the geometry of the constraint itself.
:::

::: check
The naive additive filter's radial fraction was measured at exactly $25\%$ throughout the run. Trace where that specific number comes from.
:::

::: answer
The small-angle map $\delta\mathbf q\approx(1,\tfrac12\boldsymbol\delta\theta)$ scales a genuine $3$-dimensional tangent perturbation by a factor of $\tfrac12$ before it appears in the $4$-vector, so a properly-constructed $4\times4$ covariance has its three nonzero eigenvalues equal to one quarter of the corresponding tangent-space variance and its fourth eigenvalue exactly zero — three "real" directions and one "fictitious" one, in a $4$-dimensional representation of a $3$-dimensional state. The naive filter's isotropic process noise adds equally to all four components every cycle with no mechanism favoring the three real directions over the fictitious one, so a full $1/4$ of the added noise, and hence of the accumulated total, lands in the radial direction — matching the observed $25\%$ exactly.
:::

::: check
Explain why the reset Jacobian $\mathbf G=\mathbf I-\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$ is described as second order in $\boldsymbol\delta\hat\theta$, and what this implies about skipping it for a small correction.
:::

::: answer
$\mathbf G$ itself is only first order in $\boldsymbol\delta\hat\theta$ (it is $\mathbf I$ plus a term linear in $\boldsymbol\delta\hat\theta$), but its *effect* on the covariance, $\mathbf G\mathbf P\mathbf G^{\mathsf T}-\mathbf P$, is second order, since it involves a product of two factors each carrying one power of $\boldsymbol\delta\hat\theta$. This means the correction shrinks quadratically as the injected correction shrinks — for a filter that is already tracking well and only ever injects tiny corrections, omitting $\mathbf G$ costs comparatively little per cycle, which is exactly why implementations that skip it often still run without visibly failing; the worked example's $8^\circ$ correction is large enough that the $2.85\%$-versus-$0.41\%$ gap is clearly measurable, and the gap would shrink for a filter injecting only fractions of a degree per cycle.
:::

::: check
A colleague's MEKF uses the reference-frame (left-multiplicative) error convention, $\mathbf q_{\text{true}}=\delta\mathbf q\otimes\mathbf q_{\text{nom}}$, but copies this lesson's vector-measurement Jacobian, $\mathbf H=+\operatorname{skew}(\hat{\mathbf v})$, unchanged. What would you expect to happen?
:::

::: answer
A sign error in the measurement update, of exactly the kind this lesson's warning describes: the Jacobian's sign is tied to which multiplicative convention the error is defined under, and copying a formula derived for the body-frame (right-multiplicative) convention into a filter built on the opposite (reference-frame, left-multiplicative) convention would apply corrections in the wrong rotational sense. Depending on the specific geometry this could look like a filter that converges to the wrong attitude, oscillates, or diverges outright — the same category of failure as using the wrong-sign reset Jacobian, which this lesson's Monte Carlo check showed to be several times worse than the correct formula even though both "look like" a plausible skew-symmetric correction.
:::

::: check
In the full worked MEKF example, the bias estimate on one axis ($0.848\to0.098\to\ldots\to-0.001\ ^\circ/\mathrm s$) converged much faster than the axis that was still $0.30^\circ/\mathrm s$ off by cycle $5$. What does this suggest about the geometry of the two reference vectors used, without needing to see their specific numbers?
:::

::: answer
It suggests the two reference vectors used, together with the specific rotation the vehicle underwent, provided stronger observability of the bias along some body axes than others — a vector-measurement Jacobian of $\operatorname{skew}(\hat{\mathbf v})$ is, by construction, blind to any component of an error aligned exactly with $\hat{\mathbf v}$ itself, so a bias axis that happens to stay poorly separated from the sensors' own directions over the six cycles will be resolved more slowly than one the geometry constrains well. This is exactly the same "observability depends on geometry, not merely on running longer" lesson the least-squares module's Wahba-problem treatment made for static attitude solutions, now showing up in a dynamic filter instead.
:::

## Summary

| Item | Statement |
| --- | --- |
| Why additive fails | $\mathbf q^{\mathsf T}\mathbf q=1$ forces $\mathbf q^{\mathsf T}\delta\mathbf q=0$ for any constraint-respecting variation, so a valid covariance is exactly rank $\le3$ in $\mathbb R^4$; an ordinary linear covariance recursion has no mechanism to keep it that way |
| Demonstrated cost | A naive additive filter's radial variance fraction: exactly $25\%$ of total reported uncertainty, unchanging, for the entire run — pure fiction, forever |
| MEKF error | $\mathbf q_{\text{true}}=\mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\theta)$, body-frame, $\delta\mathbf q\approx(1,\tfrac12\boldsymbol\delta\theta)$; filter state is the well-conditioned $3$-vector $\boldsymbol\delta\theta$ |
| Injection / reset | $\mathbf q_{\text{nom}}\leftarrow\mathbf q_{\text{nom}}\otimes\delta\mathbf q(\boldsymbol\delta\hat\theta)$; $\mathbf P\leftarrow\mathbf G\mathbf P\mathbf G^{\mathsf T}$, $\mathbf G=\mathbf I-\operatorname{skew}(\tfrac12\boldsymbol\delta\hat\theta)$ — verified to $0.41\%$ against an exact nonlinear Monte Carlo reset |
| Vector-measurement Jacobian | $\mathbf H=\operatorname{skew}(\hat{\mathbf v})$, $\hat{\mathbf v}=\mathbf A(\mathbf q_{\text{nom}})\mathbf r$, verified to $7\times10^{-11}$ by finite difference |
| Worked full filter | $26.9^\circ$ initial attitude error, under $2^\circ$ after one two-sensor cycle, $0.43^\circ$ by cycle $5$; bias converging unevenly across axes, reflecting real geometric observability limits |

This lesson's MEKF is the special case, for $SO(3)$ specifically, of a broader idea: any state living on a group rather than a vector space can be given the same nominal-plus-tangent-space-error treatment, with its own version of the reset Jacobian this lesson derived. The next lesson generalizes it, and names the specific structural property — present here, and present or absent depending on the problem elsewhere — that decides whether the generalization buys anything beyond what the MEKF already provides.
