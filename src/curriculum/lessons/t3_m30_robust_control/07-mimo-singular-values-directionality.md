---
id: l07-mimo-singular-values-directionality
title: Singular values of a transfer matrix and directionality
minutes: 19
covers:
  - Singular values of MIMO transfer matrices and input/output directionality
---

A single-input single-output plant has one gain at each frequency. A three-axis vehicle has a different gain in every direction, and the number you write on a Bode plot depends on which combination of torques you apply. That is the whole of multivariable control in one sentence, and everything else — decoupling, interaction measures, why an ill-conditioned plant is hard, why input uncertainty is worse than output uncertainty — follows from taking it seriously.

The tool is the singular value decomposition, applied frequency by frequency to the complex matrix $\mathbf{G}(j\omega)$. The linear algebra module established it for real matrices: $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$, and $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$ — the unit sphere mapped to an ellipsoid with semi-axes $\sigma_i\mathbf{u}_i$. Nothing changes here except that the matrix is complex, so the transpose becomes the conjugate transpose and the directions carry phase as well as magnitude. A direction with phase is a *pattern in time*, which turns out to matter physically.

This lesson defines the singular values of a transfer matrix and the input and output directions that go with them, shows what the condition number does and does not tell you, and works two vehicles: the coupled inertia tensor used throughout this module, whose directionality is mild and frequency-independent, and a momentum-bias spacecraft, whose directionality is extreme and rotates with frequency.

## Singular values of a transfer matrix

At each frequency, factor the complex matrix

$$\mathbf{G}(j\omega) = \mathbf{U}(\omega)\,\boldsymbol{\Sigma}(\omega)\,\mathbf{V}(\omega)^\mathsf{H}, \qquad \boldsymbol{\Sigma} = \operatorname{diag}(\sigma_1, \dots, \sigma_m), \ \sigma_1 \ge \dots \ge \sigma_m \ge 0,$$

with $\mathbf{U}$ and $\mathbf{V}$ unitary. The columns $\mathbf{v}_i$ are the **input directions**, the columns $\mathbf{u}_i$ the **output directions**, and $\mathbf{G}(j\omega)\mathbf{v}_i = \sigma_i\mathbf{u}_i$: a sinusoidal input at frequency $\omega$ whose channels have the relative amplitudes and phases of $\mathbf{v}_i$ produces an output with the relative amplitudes and phases of $\mathbf{u}_i$, amplified by $\sigma_i$.

Write $\bar{\sigma} = \sigma_1$ and $\underline{\sigma} = \sigma_m$. For any input vector $u$,

$$\underline{\sigma}(\mathbf{G}(j\omega))\,\lVert u\rVert \ \le\ \lVert\mathbf{G}(j\omega)u\rVert \ \le\ \bar{\sigma}(\mathbf{G}(j\omega))\,\lVert u\rVert,$$

with both bounds attained. So the plant does not have *a* gain at $\omega$; it has a band of gains, and the two singular values are its edges. A MIMO Bode magnitude plot is therefore two curves — $\bar{\sigma}$ and $\underline{\sigma}$ against frequency — with everything the plant can do between them.

::: key MIMO directionality
A MIMO plant has a different gain in every input direction, spanned by $\underline{\sigma}$ to $\bar{\sigma}$. The condition number $\gamma(\mathbf{G}) = \bar{\sigma}/\underline{\sigma}$ warns of an ill-conditioned plant where one input direction is nearly ineffective. The H-infinity norm is $\sup_\omega\bar{\sigma}$; the gain available in the worst direction is $\underline{\sigma}$, and $\underline{\sigma}(\mathbf{G}) = 1/\bar{\sigma}(\mathbf{G}^{-1})$, so a small $\underline{\sigma}$ means large control effort.
:::

Three facts carry over unchanged from the real case and are used constantly. $\lvert\det\mathbf{G}\rvert = \prod_i\sigma_i$, so a plant can have a healthy determinant and still be nearly singular in one direction. $\underline{\sigma}(\mathbf{G})$ is the distance to the nearest singular matrix, so it measures how close the vehicle is to losing control authority in some direction. And the eigenvalues of $\mathbf{G}(j\omega)$ are *not* the gains: for the shear $\begin{pmatrix}1 & 10 \\ 0 & 1\end{pmatrix}$ both eigenvalues are $1$ while the singular values are $10.099$ and $0.099$, a hundredfold spread that the eigenvalues never mention. Eigenvalues answer questions about dynamics and stability; singular values answer questions about gain and direction.

## What the condition number says, and what it does not

$\gamma(\mathbf{G}) = \bar{\sigma}/\underline{\sigma}$ is the ratio of best to worst gain. A large value means one input direction is nearly wasted: to move the output in the corresponding direction you must apply $\gamma$ times as much input. That has three consequences on a vehicle.

**Control effort.** Achieving a commanded output in the weak direction costs $1/\underline{\sigma}$ units of input per unit of output. Actuators saturate, so a large condition number is a saturation risk that a nominal simulation along the strong direction will never show.

**Input uncertainty hurts more than output uncertainty.** A relative error at the input is multiplied by $\mathbf{G}$ before it reaches the output, and for an ill-conditioned plant a small input error in the strong direction appears as a large *relative* error in the weak one. This asymmetry is why the input and output multiplicative descriptions of the first lesson must be kept apart, and it is why ill-conditioned plants are the classic failure case for decoupling controllers.

**It is not scaling-invariant.** Change the units of one actuator from newton-metres to millinewton-metres and the condition number changes. So a large $\gamma$ computed on badly scaled data may be an artefact. The honest procedure is to scale each input by its maximum expected value and each output by its allowed error *before* computing anything, and to report the **minimised condition number** over diagonal scalings if the number is to be compared across designs. The scaling-free interaction measure is the relative gain array,

$$\boldsymbol{\Lambda}(\mathbf{G}) = \mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T},$$

the elementwise product of $\mathbf{G}$ with the transpose of its inverse. Rows and columns sum to one; $\boldsymbol{\Lambda} = \mathbf{I}$ means no interaction under the given input-output pairing, and large or negative entries mean the pairing is bad.

::: example The coupled inertia tensor, direction by direction
The module's spacecraft has

$$\mathbf{J} = \begin{pmatrix}120 & 18 & 12 \\ 18 & 100 & 9 \\ 12 & 9 & 140\end{pmatrix}\ \mathrm{kg\,m^2}, \qquad \mathbf{G}(s) = \frac{\mathbf{J}^{-1}}{s^2}.$$

Because $\mathbf{J}$ is symmetric and positive definite, so is $\mathbf{J}^{-1}$, and its singular values are its eigenvalues: the reciprocals of the principal inertias $89.35$, $119.70$ and $150.96\,\mathrm{kg\,m^2}$, giving

$$\sigma(\mathbf{J}^{-1}) = 0.011192,\ \ 0.008354,\ \ 0.006624\ \ \mathrm{(kg\,m^2)^{-1}},$$

and a condition number of $1.690$ — exactly the ratio of the largest principal inertia to the smallest, since the plant is a scaled identity in the principal axes. The strongest input direction is $\mathbf{v}_1 = (-0.495,\ 0.868,\ -0.037)$: a torque mostly about the body $y$ axis with a negative $x$ component produces the most angular acceleration, because that combination points along the minimum-inertia principal axis. The weakest is $\mathbf{v}_3 = (0.498,\ 0.318,\ 0.807)$, aligned with the maximum-inertia axis. Since $\mathbf{J}^{-1}$ is symmetric, input and output directions coincide, and because $\mathbf{G}(j\omega) = -\mathbf{J}^{-1}/\omega^2$ the directions do not move with frequency at all: every singular value is scaled by the same $1/\omega^2$.

The relative gain array is

$$\boldsymbol{\Lambda}(\mathbf{J}^{-1}) = \begin{pmatrix}1.035 & -0.027 & -0.008 \\ -0.027 & 1.032 & -0.005 \\ -0.008 & -0.005 & 1.013\end{pmatrix},$$

very close to the identity. So the diagonal pairing — roll torque to roll angle, and so on — is the right one, and interaction is a three-percent effect. This is what "mildly coupled" looks like numerically, and it is why a per-axis design is a reasonable *starting point* for this vehicle. The margin lesson shows why it is not a reasonable finishing point.
:::

::: example A momentum-bias spacecraft, where the directions rotate
Now a vehicle with a bias momentum wheel of $h = 50\,\mathrm{N\,m\,s}$ spinning about the body $z$ axis and transverse inertia $J_t = 120\,\mathrm{kg\,m^2}$. The linearised transverse attitude dynamics are gyroscopically coupled:

$$J_t\ddot{\theta}_x + h\dot{\theta}_y = u_x, \qquad J_t\ddot{\theta}_y - h\dot{\theta}_x = u_y,$$

so the torque-to-attitude transfer matrix is the inverse of

$$\mathbf{M}(s) = \begin{pmatrix}J_ts^2 & hs \\ -hs & J_ts^2\end{pmatrix}, \qquad \mathbf{G}(s) = \mathbf{M}(s)^{-1}.$$

On the imaginary axis $\mathbf{M}(j\omega)$ is Hermitian with eigenvalues $-J_t\omega^2 \pm h\omega$, so the singular values of the plant are

$$\bar{\sigma}(\mathbf{G}(j\omega)) = \frac{1}{\omega\,\lvert J_t\omega - h\rvert}, \qquad \underline{\sigma}(\mathbf{G}(j\omega)) = \frac{1}{\omega\,(J_t\omega + h)}.$$

The larger one blows up at $\omega_n = h/J_t = 0.4167\,\mathrm{rad/s}$, which is the **nutation frequency** — a real, lightly damped mode of the vehicle. Evaluating on a grid: at $0.05\,\mathrm{rad/s}$ the singular values are $0.4545$ and $0.3571$, a condition number of $1.27$; at $0.20\,\mathrm{rad/s}$, $0.1923$ and $0.0676$, condition number $2.85$; at $0.45\,\mathrm{rad/s}$, $0.5556$ and $0.0214$, condition number $26.0$; at $1.0\,\mathrm{rad/s}$, $0.01429$ and $0.00588$, back down to $2.43$. A grid point only $0.008\,\%$ away from the nutation frequency already reads $\bar{\sigma} = 600$ against $\underline{\sigma} = 0.024$.

The directions are the interesting part. At $0.40\,\mathrm{rad/s}$ the strongest input direction has components of equal magnitude $0.7071$ with phases $180^\circ$ and $-90^\circ$ — a $90^\circ$ phase difference between the two torque channels. That is a torque vector of constant magnitude *rotating* in the transverse plane, and the sense of rotation matters: rotating with the nutation, it drives the mode resonantly; rotating against it, the gain is $\underline{\sigma}$ and the vehicle barely responds. Two torque commands of identical amplitude and identical frequency, differing only in the sign of a phase, differ in effect here by a factor of twenty-six.

A scalar Bode plot cannot express that. A per-axis analysis, which implicitly assumes the channels are driven independently, cannot express it either — and a nutation damper design that ignores it will damp one circular polarisation and leave the other alone.
:::

```python
import numpy as np

Jt, h = 120.0, 50.0                     # kg m^2, N m s


def plant(w):
    """Transverse dynamics of a momentum-bias spacecraft, torque -> attitude."""
    s = 1j * w
    M = np.array([[Jt * s**2, h * s], [-h * s, Jt * s**2]])
    return np.linalg.inv(M)


for w in (0.05, 0.20, 0.45, 1.00):
    sv = np.linalg.svd(plant(w), compute_uv=False)
    closed = np.array([1 / (w * abs(Jt * w - h)), 1 / (w * (Jt * w + h))])
    print(f"w={w:5.2f}  sv={sv[0]:9.5f} {sv[1]:9.5f}   closed form={closed[0]:9.5f} {closed[1]:9.5f}"
          f"   cond={sv[0] / sv[1]:7.2f}")

U, sv, Vh = np.linalg.svd(plant(0.40))
print("strongest input direction:", np.abs(Vh[0]).round(4),
      "phases (deg):", np.degrees(np.angle(Vh[0])).round(1))
# w= 0.05  sv=  0.45455   0.35714   closed form=  0.45455   0.35714   cond=   1.27
# w= 0.45  sv=  0.55556   0.02137   closed form=  0.55556   0.02137   cond=  26.00
# strongest input direction: [0.7071 0.7071] phases (deg): [180. -90.]
```

::: warning Do not read a MIMO plot as if it were scalar
Three habits from the single-loop world break here. A "gain crossover frequency" is ambiguous — $\bar{\sigma}(\mathbf{L})$ and $\underline{\sigma}(\mathbf{L})$ cross one at different frequencies, and the band between them is where the loop is closed in some directions and open in others. "Phase" is not a scalar either; the analogue is the set of principal phases, and the usable substitute is the disk margin of the next lesson. And the determinant of $\mathbf{I} + \mathbf{L}$, not any single loop's gain, governs stability through the multivariable Nyquist criterion.
:::

::: warning An ill-conditioned plant is not always a hard plant
A large condition number matters only if you need to move the output in the weak direction. A launch vehicle with two gimballed engines has enormous pitch authority and feeble differential-roll authority — a condition number of twenty on the effector matrix $\begin{pmatrix}1 & 1 \\ 0.05 & -0.05\end{pmatrix}$ — and flies perfectly well, because the roll disturbance it must reject is correspondingly small. Compare the condition number against the *disturbance* directions and the *command* directions before calling a plant difficult. What makes ill-conditioning dangerous is needing the weak direction and having input uncertainty at the same time.
:::

## Check yourself

::: check
A $2\times 2$ plant at $5\,\mathrm{rad/s}$ has $\bar{\sigma} = 40$ and $\underline{\sigma} = 0.5$. A command requires an output of unit magnitude in the direction $\mathbf{u}_2$. How much input is needed, and what happens if the actuators saturate at $1.5$ units?
:::

::: answer
The output direction $\mathbf{u}_2$ is reached by the input direction $\mathbf{v}_2$ with gain $\underline{\sigma} = 0.5$, so a unit output needs $\lVert u\rVert = 1/0.5 = 2$ units of input. With saturation at $1.5$ the command cannot be met: the achievable output in that direction is $0.5\times 1.5 = 0.75$, a twenty-five percent shortfall. Worse, saturation in a MIMO loop does not merely scale the response — it changes the *direction* of the applied input, because the two channels clip by different amounts, so the vehicle moves partly along $\mathbf{u}_1$ instead. Directional error under saturation is one of the standard mechanisms by which a linear MIMO design misbehaves in the real vehicle, and it is why anti-windup schemes for MIMO loops preserve the direction of the commanded input rather than clipping channel by channel.
:::

::: check
Why do the input and output singular directions of $\mathbf{J}^{-1}/s^2$ not move with frequency, while those of the momentum-bias plant do?
:::

::: answer
$\mathbf{G}(j\omega) = -\mathbf{J}^{-1}/\omega^2$ is a fixed real symmetric matrix multiplied by a scalar function of frequency. Scaling a matrix by a scalar scales all its singular values equally and leaves $\mathbf{U}$ and $\mathbf{V}$ alone, so the directions are the principal axes of the inertia tensor at every frequency, and the condition number is constant at $1.690$. The momentum-bias plant is different in kind: the gyroscopic term $hs$ enters with a factor of $s$ while the inertia term enters with $s^2$, so the relative weight of coupling to inertia changes with frequency. At low frequency the $hs$ terms dominate and the plant is strongly coupled; near nutation one eigenvalue of $\mathbf{M}(j\omega)$ passes through zero; at high frequency the $J_ts^2$ terms dominate and the plant approaches a decoupled double integrator with condition number tending to one. Frequency-dependent directionality is the rule whenever coupling and inertia enter at different powers of $s$, which is to say whenever gyroscopic or aerodynamic cross terms are present.
:::

::: check
Compute the relative gain array of $\mathbf{G} = \begin{pmatrix}1 & 1 \\ 0.05 & -0.05\end{pmatrix}$ and say what it means for pairing.
:::

::: answer
$\det\mathbf{G} = 1\times(-0.05) - 1\times 0.05 = -0.1$, so $\mathbf{G}^{-1} = \frac{1}{-0.1}\begin{pmatrix}-0.05 & -1 \\ -0.05 & 1\end{pmatrix} = \begin{pmatrix}0.5 & 10 \\ 0.5 & -10\end{pmatrix}$. The relative gain array is the elementwise product of $\mathbf{G}$ with $(\mathbf{G}^{-1})^\mathsf{T}$: $\Lambda_{11} = 1\times 0.5 = 0.5$, $\Lambda_{12} = 1\times 0.5 = 0.5$, $\Lambda_{21} = 0.05\times 10 = 0.5$, $\Lambda_{22} = -0.05\times(-10) = 0.5$. Every entry is $0.5$, which is the signature of complete interaction: neither pairing is better than the other, and no diagonal controller can decouple the loops. Physically this is the two-engine vehicle — both engines contribute equally to pitch and equally in magnitude to roll — and the correct response is not to pick a pairing but to invert the effector matrix explicitly, commanding the sum and difference of the gimbal angles rather than the gimbals themselves. That step is control allocation, and it converts an interacting plant into two independent ones before the attitude loops are designed.
:::

::: check
A disturbance enters the momentum-bias spacecraft as a constant-magnitude torque rotating in the transverse plane at $0.45\,\mathrm{rad/s}$, in the same sense as the nutation. How much larger is its effect than the same torque rotating in the opposite sense?
:::

::: answer
The two senses of rotation are exactly the two singular directions, so the ratio of their effects is the condition number at that frequency, $\bar{\sigma}/\underline{\sigma} = 0.5556/0.02137 = 26.0$. The sympathetic rotation produces $26$ times the attitude excursion of the opposing one, from the identical torque magnitude. This is why momentum-bias vehicles are analysed in circular rather than Cartesian coordinates for the transverse axes: the natural modes are circularly polarised, so the natural input and output directions are too, and a Cartesian per-axis plot mixes the two together and hides a factor of twenty-six.
:::

::: check
The H-infinity norm of a stable $\mathbf{G}$ is $\sup_\omega\bar{\sigma}(\mathbf{G}(j\omega))$. Why is there no corresponding useful norm built from $\underline{\sigma}$?
:::

::: answer
A norm must be zero only for the zero system and must satisfy the triangle inequality; $\sup_\omega\underline{\sigma}$ fails the first requirement immediately, because any non-square or rank-deficient $\mathbf{G}$ has $\underline{\sigma} = 0$ at every frequency while being a perfectly good nonzero system. More to the point, $\underline{\sigma}$ measures the *worst* direction, which is a lower bound on what the system does, and every stability and performance argument in this module is an upper bound: robust stability needs the loop gain to be small in *all* directions, which is a statement about $\bar{\sigma}$. Where $\underline{\sigma}$ does matter, it enters through an inverse: $\underline{\sigma}(\mathbf{G}) = 1/\bar{\sigma}(\mathbf{G}^{-1})$, so a requirement that the plant be strongly invertible becomes an H-infinity bound on $\mathbf{G}^{-1}$, and the machinery applies again.
:::

## Summary

| Item | Statement |
| --- | --- |
| Frequency-wise SVD | $\mathbf{G}(j\omega) = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$, $\mathbf{G}\mathbf{v}_i = \sigma_i\mathbf{u}_i$; directions carry phase |
| Gain band | $\underline{\sigma}\lVert u\rVert \le \lVert\mathbf{G}u\rVert \le \bar{\sigma}\lVert u\rVert$; a MIMO Bode plot is two curves |
| Condition number | $\gamma = \bar{\sigma}/\underline{\sigma}$; large means one direction is nearly ineffective; not scaling-invariant |
| Effort | $\underline{\sigma}(\mathbf{G}) = 1/\bar{\sigma}(\mathbf{G}^{-1})$; unit output in the weak direction costs $1/\underline{\sigma}$ of input |
| Eigenvalues are not gains | $\begin{pmatrix}1&10\\0&1\end{pmatrix}$: eigenvalues $1, 1$; singular values $10.099$, $0.099$ |
| Interaction measure | $\boldsymbol{\Lambda} = \mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}$; $\boldsymbol{\Lambda} = \mathbf{I}$ means no interaction |
| Spacecraft inertia | $\sigma(\mathbf{J}^{-1}) = 0.01119,\ 0.00835,\ 0.00662$; $\gamma = 1.690$; directions fixed with frequency; $\boldsymbol{\Lambda}\approx\mathbf{I}$ |
| Momentum bias | $\bar{\sigma} = 1/(\omega\lvert J_t\omega - h\rvert)$, $\underline{\sigma} = 1/(\omega(J_t\omega + h))$; nutation at $h/J_t$ |
| Rotating directions | at $0.45\,\mathrm{rad/s}$, $\gamma = 26$: the two circular polarisations of torque differ in effect by $26\times$ |

The next lesson turns directionality into a margin. If the plant has a different gain in every direction, a gain margin measured one loop at a time cannot be the whole story — and the disk margin is what replaces it.
