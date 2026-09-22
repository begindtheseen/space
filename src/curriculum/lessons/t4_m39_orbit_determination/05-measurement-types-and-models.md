---
id: l05-measurement-types-and-models
title: "Measurement types and models: range, range-rate, angles, GNSS, VLBI, ISL"
minutes: 13
covers:
  - "Measurement types and models: range, range-rate/Doppler, angles, GNSS, VLBI, inter-satellite links"
---

Every $\mathbf H_i(t_i)$ in the batch and sequential normal equations of the last two lessons came from somewhere: a measurement model $y=h(\mathbf x)$ and its partial derivative with respect to the state. This lesson catalogues the measurement types an orbit determination system actually sees, derives the partials each one needs, and is honest about which of them measure the same physical quantity by a different name and which measure something genuinely different.

## Range

A ranging system (radar, laser, or a coherent radio transponder) measures the straight-line distance from a tracking site at $\mathbf R$ to the spacecraft at $\mathbf r$:
$$
\rho = \lVert \mathbf r - \mathbf R \rVert, \qquad \frac{\partial\rho}{\partial\mathbf r} = \frac{\mathbf r-\mathbf R}{\rho} = \hat{\boldsymbol\rho}, \qquad \frac{\partial\rho}{\partial\mathbf v}=\mathbf 0.
$$
This is not a new derivation — it is exactly the position-fix Jacobian the least-squares module used for its own multi-station range example, the unit line-of-sight vector, unchanged. The only OD-specific detail is that $\mathbf R$ is not fixed: a ground station's position in the inertial frame rotates with the Earth, so $\mathbf R=\mathbf R(t)$ must be evaluated at the exact observation time, the same site-rotation construction the initial-orbit-determination lesson used to place stations in an inertial frame.

## Range-rate (Doppler)

A coherent link also measures the rate of change of range, either directly (a ranging tone's phase rate) or via the Doppler shift of a carrier, $f_d = -(\dot\rho/c)f_0$. Differentiating $\rho=\lVert\mathbf r-\mathbf R\rVert$ with the quotient rule,
$$
\dot\rho = \frac{(\mathbf r-\mathbf R)\cdot(\mathbf v-\dot{\mathbf R})}{\rho} = \hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}, \qquad
\frac{\partial\dot\rho}{\partial\mathbf v} = \hat{\boldsymbol\rho}, \qquad
\frac{\partial\dot\rho}{\partial\mathbf r} = \frac{\dot{\boldsymbol\rho}}{\rho} - \frac{\dot\rho}{\rho}\,\hat{\boldsymbol\rho},
$$
the last from differentiating $\hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}$ and using $\partial\hat{\boldsymbol\rho}/\partial\mathbf r=(\mathbf I-\hat{\boldsymbol\rho}\hat{\boldsymbol\rho}^\mathsf T)/\rho$. Range and range-rate together give a $2\times6$ block, $\mathbf H=\begin{pmatrix}\hat{\boldsymbol\rho}^\mathsf T & \mathbf 0\\ (\dot{\boldsymbol\rho}/\rho-\dot\rho\hat{\boldsymbol\rho}/\rho)^\mathsf T & \hat{\boldsymbol\rho}^\mathsf T\end{pmatrix}$, exactly what fed the batch and sequential normal equations of the last two lessons.

::: example Checking the range-rate partial against a finite difference
For a $420\,\mathrm{km}$ LEO state and a mid-latitude station at an observation time when the range is $\approx6862\,\mathrm{km}$:

```python
import numpy as np

def range_rr(x, R, V):
    rho = x[:3] - R
    rhod = x[3:] - V
    rn = np.linalg.norm(rho)
    return rn, np.dot(rho, rhod) / rn

def H_analytic(x, R, V):
    rho = x[:3] - R; rhod = x[3:] - V
    rn = np.linalg.norm(rho); rr = np.dot(rho, rhod) / rn
    H = np.zeros((2, 6))
    H[0, :3] = rho / rn
    H[1, :3] = (rhod - rr * rho / rn) / rn
    H[1, 3:] = rho / rn
    return H

# x, R, V from a real pass geometry (km, km/s)
x = np.array([3149.693, 4949.506, 3421.126, -6.090, 0.695, 4.602])
R = np.array([2705.0, 4222.0, 4210.0]); V = np.array([-0.308, 0.197, 0.0])
H = H_analytic(x, R, V)
h = 1e-6
H_fd = np.column_stack([
    (np.array(range_rr(x + h*e, R, V)) - np.array(range_rr(x - h*e, R, V))) / (2*h)
    for e in np.eye(6)
])
print("max |H_analytic - H_fd| =", np.max(np.abs(H - H_fd)))
# max |H_analytic - H_fd| = 2.56e-07
```

The analytic and finite-difference Jacobians agree to seven figures — the residual is finite-difference truncation error, not a flaw in the analytic form.
:::

## Angles

A right-ascension/declination pair (or azimuth/elevation, related by a fixed rotation) is a direction only, carrying no range information at all:
$$
\alpha=\operatorname{atan2}(\rho_y,\rho_x), \qquad \delta=\arcsin(\rho_z/\rho), \qquad \boldsymbol\rho=\mathbf r-\mathbf R,
$$
with partials
$$
\frac{\partial\alpha}{\partial\mathbf r} = \frac{(-\rho_y,\ \rho_x,\ 0)}{\rho_x^2+\rho_y^2}, \qquad
\frac{\partial\delta}{\partial\mathbf r} = \frac{(-\rho_x\rho_z,\ -\rho_y\rho_z,\ \rho_x^2+\rho_y^2)}{\rho^2\sqrt{\rho_x^2+\rho_y^2}},
$$
both zero with respect to velocity. These are the same partials the initial-orbit-determination lesson's Gauss method needed to build its line-of-sight vectors, now organized as an $\mathbf H$ row for a filter instead of an algebraic input to a closed-form method. The structural point worth carrying forward: angles alone give two numbers per look and are blind to range, which is exactly why the initial-orbit-determination lesson needed three separated looks (and the observer's own motion) to recover a full state from angles, where a single range-and-rate look did not.

## GNSS pseudorange

A GNSS receiver's pseudorange to one satellite looks like an ordinary range measurement with one addition: the receiver clock is not synchronized to GPS time, so every pseudorange carries a common bias,
$$
\tilde\rho = \lVert\mathbf r-\mathbf r_{\text{GPS}}\rVert + c\,\delta t_{\text{clock}} + \text{(other errors)},
$$
with $\delta t_{\text{clock}}$ a fourth unknown solved for alongside position — exactly the receiver-clock-bias treatment the GNSS module built in full for the navigation solution itself. For an orbiting receiver being tracked (rather than doing its own navigation), the same pseudoranges instead become tracking data: $\mathbf H$ gains one more column, $\partial\tilde\rho/\partial(\delta t_{\text{clock}})=c$, a constant, alongside the usual $\hat{\boldsymbol\rho}$ block for position. Whether the clock bias is solved for as an extra state or removed by differencing (as carrier-phase and differential techniques do) is the same solve-for-versus-eliminate choice that recurs with every nuisance parameter in this module.

## VLBI: an angle measurement of extraordinary precision

Very-long-baseline interferometry does not measure a range at all. Two widely separated ground antennas at $\mathbf R_1$ and $\mathbf R_2$ (baseline $\mathbf b=\mathbf R_2-\mathbf R_1$, commonly thousands of kilometres) receive the same signal, and the wavefront reaches the far antenna a time
$$
\Delta\tau \approx -\frac{\mathbf b\cdot\hat{\boldsymbol\rho}}{c}
$$
later, to the extent the spacecraft is far enough away that the wavefront is locally planar across the baseline — the far-field (plane-wave) approximation. This is a projection of the baseline onto the line of sight, divided by the speed of light, and it depends on $\hat{\boldsymbol\rho}$ — direction only — not on $\rho$ itself.

::: example VLBI delay: an angle measurement, verified against the exact geometry
Two stations $8226\,\mathrm{km}$ apart (Goldstone- and Effelsberg-like) tracking a target at interplanetary distance ($0.2\,\mathrm{AU}\approx3.0\times10^7\,\mathrm{km}$):

```python
import numpy as np
C = 299792.458   # km/s

def delay_exact(r_target, R1, R2):
    return (np.linalg.norm(r_target - R2) - np.linalg.norm(r_target - R1)) / C

def delay_planewave(r_target, R1, R2):
    rho_hat = (r_target - R1) / np.linalg.norm(r_target - R1)
    return -np.dot(R2 - R1, rho_hat) / C

R1 = np.array([-2355.0, -4645.0, 3628.0])     # km, ECI at the observation epoch
R2 = np.array([3993.0, 1046.0, 4919.0])
direction = np.array([0.4, 0.7, 0.3]); direction /= np.linalg.norm(direction)
r_target = R1 + 2.992e7 * direction

exact = delay_exact(r_target, R1, R2)
approx = delay_planewave(r_target, R1, R2)
print(f"exact delay:  {exact*1e9:.3f} ns")
print(f"plane-wave:   {approx*1e9:.3f} ns")
print(f"relative error: {abs(exact-approx)/abs(exact):.2e}")
# exact delay:  -25816813.902 ns
# plane-wave:   -25817246.752 ns
# relative error: 1.68e-05
```

At this distance the plane-wave delay is accurate to about five significant figures, and shifting the target $1\,\mathrm{km}$ purely in range (holding direction fixed) changes the plane-wave delay by less than a picosecond, confirmed directly — VLBI is an angle measurement, and an extremely precise one, because a baseline of thousands of kilometres acts as an enormous angular aperture compared with a single antenna. It is the tool of choice for deep-space and geostationary tracking, where a single site's angular precision alone is not enough and there is no return signal strong enough, or no cooperative transponder present, for high-precision ranging.
:::

## Inter-satellite links

A crosslink range between two spacecraft, $\mathbf r_A$ and $\mathbf r_B$, is algebraically identical to a ground range, $\rho_{AB}=\lVert\mathbf r_A-\mathbf r_B\rVert$, with one structural difference: *both* endpoints are unknown state vectors when both objects are being estimated together, so the partials appear twice, with opposite sign, in two different blocks of $\mathbf H$:
$$
\frac{\partial\rho_{AB}}{\partial\mathbf r_A} = \hat{\boldsymbol\rho}_{AB}, \qquad \frac{\partial\rho_{AB}}{\partial\mathbf r_B} = -\hat{\boldsymbol\rho}_{AB}.
$$
A single crosslink measurement therefore constrains the *relative* position of the two spacecraft along the link direction far better than it constrains either one's absolute position — a preview of why relative orbit determination for a constellation, built from many such crosslinks, can reach much better relative accuracy than either spacecraft's absolute state, a theme the module returns to in its closing lesson.

::: key Six measurement types, two physical quantities
Range, GNSS pseudorange and inter-satellite range are all the same quantity — a line-of-sight distance — differing only in what sits at the far end (a fixed station, a GNSS satellite carrying its own clock error, or another spacecraft). Angles and VLBI delay are both direction-only measurements; VLBI simply reaches far higher angular precision by using a very long physical baseline instead of a single antenna's own resolution. Range-rate adds the time derivative of the first family. Every one of them reduces to a line-of-sight vector, or a baseline projected onto one, differentiated with respect to the state.
:::

::: warning Angles alone never give a range, however many you take from one site
No amount of additional angular precision, and no number of repeated angle measurements from a *single*, non-moving vantage point, adds range information — every partial derived in this lesson with respect to $\rho$ itself is zero for both angle types. Range enters an angles-only solution only through the observer's own motion between looks (the initial-orbit-determination lesson's Gauss method) or through a genuinely separate baseline (VLBI, or triangulation from two sites). Mistaking "more angle data" for "better range knowledge" is a common and completely avoidable error.
:::

## Check yourself

::: check
Explain why $\partial\dot\rho/\partial\mathbf v=\hat{\boldsymbol\rho}$ but $\partial\rho/\partial\mathbf v=\mathbf 0$, using the physical meaning of each measurement.
:::

::: answer
Range depends only on where the spacecraft *is* at the observation time, not on how fast it is moving, so it has no sensitivity to velocity at all. Range-rate is literally the line-of-sight component of relative velocity, $\dot\rho=\hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}$; a small change in $\mathbf v$ changes $\dot{\boldsymbol\rho}$ by exactly that amount, and its projection onto $\hat{\boldsymbol\rho}$ (to first order, holding $\hat{\boldsymbol\rho}$ fixed) is $\hat{\boldsymbol\rho}$ dotted into the perturbation — hence the partial is $\hat{\boldsymbol\rho}$ itself.
:::

::: check
A GNSS-tracked spacecraft's receiver clock bias is added to the state as a solve-for parameter rather than removed by differencing. What does this cost in the size of the normal equations, and what does it buy?
:::

::: answer
It costs one extra row and column in $\boldsymbol\Lambda$ per clock state (one, if a single common bias is assumed, or one per epoch if the bias is allowed to walk) — a small, constant-coefficient column since $\partial\tilde\rho/\partial(\delta t)=c$ is the same for every pseudorange at that epoch. It buys keeping every pseudorange in the fit directly, without needing to double-difference between satellites or receivers to cancel the bias, which is simpler to set up but throws away nothing about the clock's own behaviour, at the cost of one more parameter for the data to constrain.
:::

::: check
Why is the VLBI plane-wave delay formula's error a *relative* description (accurate to five significant figures) rather than a fixed number of nanoseconds?
:::

::: answer
The plane-wave approximation replaces the true, slightly curved wavefront reaching the two antennas with a flat one; the two disagree by an amount that scales with how much the baseline "sees" the wavefront's curvature, which shrinks as the target recedes (the correction term in this lesson's example fell by roughly the same factor as distance grew, when the target was moved from lunar to interplanetary distance). The absolute delay itself, $\mathbf b\cdot\hat{\boldsymbol\rho}/c$, does not shrink with distance — it depends only on the baseline and direction — so a fixed absolute error at one distance is a smaller and smaller fraction of that same delay as the target moves farther away, which is why accuracy is naturally reported as a relative, not absolute, figure.
:::

::: check
Two spacecraft in a constellation are linked by a crosslink range measurement, and only spacecraft $A$'s state is being estimated (spacecraft $B$'s state is treated as known and fixed). How does $\mathbf H$ for this measurement differ from the case where both are being estimated together?
:::

::: answer
With only $A$ solved for, $\mathbf H$ has a single $1\times 6$ (or $1\times n$) block, $\partial\rho_{AB}/\partial\mathbf r_A=\hat{\boldsymbol\rho}_{AB}$, exactly like a range to a fixed ground station — $B$'s position enters the predicted measurement but not as a column of the design matrix, since it is not an unknown. With both estimated together, $\mathbf H$ has two blocks, $\hat{\boldsymbol\rho}_{AB}$ for $A$ and $-\hat{\boldsymbol\rho}_{AB}$ for $B$, and the measurement constrains the difference $\mathbf r_A-\mathbf r_B$ far more tightly than either absolute position individually — the same measurement, but a materially different observability picture depending on which states are actually being solved for.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\rho=\lVert\mathbf r-\mathbf R\rVert$, $\partial\rho/\partial\mathbf r=\hat{\boldsymbol\rho}$ | Range; the least-squares module's line-of-sight Jacobian, reused |
| $\dot\rho=\hat{\boldsymbol\rho}\cdot\dot{\boldsymbol\rho}$, $\partial\dot\rho/\partial\mathbf v=\hat{\boldsymbol\rho}$, $\partial\dot\rho/\partial\mathbf r=(\dot{\boldsymbol\rho}-\dot\rho\hat{\boldsymbol\rho})/\rho$ | Range-rate / Doppler |
| $\alpha,\delta$ partials, both zero in $\mathbf v$ | Angles: direction only, no range information |
| $\tilde\rho=\rho+c\,\delta t_{\text{clock}}$ | GNSS pseudorange; clock bias as an extra column of $\mathbf H$ |
| $\Delta\tau\approx-\mathbf b\cdot\hat{\boldsymbol\rho}/c$ | VLBI delay; an angle measurement using a physical baseline as its aperture |
| $\partial\rho_{AB}/\partial\mathbf r_A=\hat{\boldsymbol\rho}_{AB}=-\partial\rho_{AB}/\partial\mathbf r_B$ | Inter-satellite range; constrains the relative state strongly |

Every measurement type here contributes rows to the same $\mathbf H$ the batch and sequential estimators already use. What determines whether those rows actually pin down the state — one station or several, one geometry repeated or a changing one — is the subject of the next lesson.
