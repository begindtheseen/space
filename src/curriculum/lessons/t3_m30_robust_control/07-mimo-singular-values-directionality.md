---
id: l07-mimo-singular-values-directionality
title: Singular values of a transfer matrix and directionality
minutes: 20
covers:
  - Singular values of MIMO transfer matrices and input/output directionality
---

Push a shopping cart straight ahead and it rolls easily. Push the same cart sideways with the same effort and it barely moves, because the wheels fight you. Same push, same cart, very different result — and the only thing that changed was the **direction** of the push.

A spacecraft with three torque axes is like that cart. A plant with one input and one output has one gain at each frequency. A plant with several inputs and outputs — engineers say **MIMO**, for multiple-input multiple-output — has a different gain in every direction. The number you would write on a Bode plot depends on which *combination* of torques you apply. That is the whole of multivariable control in one sentence. Decoupling, interaction measures, why an ill-conditioned plant is hard, why errors at the actuators can hurt more than errors at the sensors — all of it follows from taking that sentence seriously.

The tool is the **singular value decomposition** (SVD), applied one frequency at a time to the complex matrix $\mathbf{G}(j\omega)$. This lesson shows what the singular values and their directions mean, what the condition number does and does not tell you, and works two vehicles: the module's coupled spacecraft, whose directions are mild and never change, and a momentum-bias spacecraft, whose directions are extreme and turn with frequency.

## One gain becomes a band of gains

Recall the picture from linear algebra. A real matrix $\mathbf{A}$ takes every vector of length one — all the points on a circle, or a sphere in three dimensions — and maps them onto an **[[ellipse|circle-to-ellipse]]**. The SVD writes $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$. The **singular values** $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$ ("sigma one, sigma two") are the lengths of the ellipse's half-axes. The columns of $\mathbf{V}$ are the input directions that land on those axes, and the columns of $\mathbf{U}$ are the axis directions themselves: $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$.

For a transfer matrix, only one thing changes. At a given frequency, $\mathbf{G}(j\omega)$ is a matrix of *complex* numbers, so each direction carries a phase as well as a size. At each frequency, factor

$$\mathbf{G}(j\omega) = \mathbf{U}(\omega)\,\boldsymbol{\Sigma}(\omega)\,\mathbf{V}(\omega)^\mathsf{H}, \qquad \boldsymbol{\Sigma} = \operatorname{diag}(\sigma_1, \dots, \sigma_m), \ \sigma_1 \ge \dots \ge \sigma_m \ge 0.$$

Here $\mathbf{V}^\mathsf{H}$ (read "V Hermitian") is the **conjugate transpose** — flip the matrix over its diagonal and change the sign of every imaginary part. $\mathbf{U}$ and $\mathbf{V}$ are **[[unitary|unitary]]**: the complex version of a rotation, which never changes a vector's length.

- The columns $\mathbf{v}_i$ are the **input directions**.
- The columns $\mathbf{u}_i$ are the **output directions**.
- $\mathbf{G}(j\omega)\mathbf{v}_i = \sigma_i\mathbf{u}_i$.

Read that last line physically. Drive every input channel with a sine wave at frequency $\omega$, with relative sizes and **[[relative phases|phase-pattern]]** set by $\mathbf{v}_i$. The outputs come out as sine waves with the relative sizes and phases of $\mathbf{u}_i$, made $\sigma_i$ times bigger. A direction with phase is a *timing pattern* between the channels, and that turns out to matter physically.

Write $\bar{\sigma} = \sigma_1$ (read "sigma bar", the largest, also written $\sigma_{\max}$) and $\underline{\sigma} = \sigma_m$ (read "sigma under-bar", the smallest, also written $\sigma_{\min}$). For any input vector $u$,

$$\underline{\sigma}(\mathbf{G}(j\omega))\,\lVert u\rVert \ \le\ \lVert\mathbf{G}(j\omega)u\rVert \ \le\ \bar{\sigma}(\mathbf{G}(j\omega))\,\lVert u\rVert,$$

and some input reaches each bound exactly. So the plant does not have *a* gain at $\omega$. It has a band of gains, and the two singular values are its edges. A MIMO Bode magnitude plot is therefore **two curves**, $\bar{\sigma}$ and $\underline{\sigma}$ against frequency, with everything the plant can do in between.

::: key MIMO directionality
A MIMO plant has a different gain in every input direction, spanned by $\sigma_{\min} = \underline{\sigma}$ to $\sigma_{\max} = \bar{\sigma}$. The condition number $\gamma(\mathbf{G}) = \sigma_{\max}/\sigma_{\min}$ warns of an ill-conditioned plant where one input direction is nearly ineffective. The H-infinity norm is $\sup_\omega\bar{\sigma}$; the gain available in the worst direction is $\underline{\sigma}$, and $\underline{\sigma}(\mathbf{G}) = 1/\bar{\sigma}(\mathbf{G}^{-1})$, so a small $\underline{\sigma}$ means large control effort.
:::

### Three facts you will use constantly

These carry over unchanged from real matrices.

1. $\lvert\det\mathbf{G}\rvert = \prod_i\sigma_i$. The determinant multiplies all the gains together, so a plant can have a healthy determinant and still be nearly dead in one direction.
2. $\underline{\sigma}(\mathbf{G})$ is the distance to the nearest singular matrix. It measures how close the vehicle is to losing control authority in *some* direction.
3. The eigenvalues of $\mathbf{G}(j\omega)$ are **not** the gains. The **[[shear|shear-matrix]]** $\begin{pmatrix}1 & 10 \\ 0 & 1\end{pmatrix}$ has both eigenvalues equal to $1$, yet its singular values are $10.099$ and $0.099$ — a hundredfold spread that the eigenvalues never mention.

Eigenvalues answer questions about dynamics and stability. Singular values answer questions about gain and direction. Keep the two jobs apart.

::: note Why the two bounds have to be true
Write any input in the $\mathbf{v}$ basis, $u = \sum_i c_i\mathbf{v}_i$. Because $\mathbf{V}$ is unitary, $\lVert u\rVert^2 = \sum_i\lvert c_i\rvert^2$. The plant sends it to $\mathbf{G}u = \sum_i c_i\sigma_i\mathbf{u}_i$, and because $\mathbf{U}$ is unitary too, $\lVert\mathbf{G}u\rVert^2 = \sum_i\sigma_i^2\lvert c_i\rvert^2$. Every $\sigma_i^2$ lies between $\underline{\sigma}^2$ and $\bar{\sigma}^2$, so the sum lies between $\underline{\sigma}^2\lVert u\rVert^2$ and $\bar{\sigma}^2\lVert u\rVert^2$. Put all the input on $\mathbf{v}_1$ and you hit the top; put it all on $\mathbf{v}_m$ and you hit the bottom.
:::

## What the condition number says, and what it does not

The **[[condition number|condition-number]]** $\gamma(\mathbf{G}) = \bar{\sigma}/\underline{\sigma}$ (read "gamma of G") is the ratio of the best gain to the worst. It is always at least $1$. A large value means one input direction is nearly wasted: to move the output in the matching direction you must push $\gamma$ times harder than in the best one. On a vehicle that has three consequences.

**Control effort.** A unit of output in the weak direction costs $1/\underline{\sigma}$ units of input. Actuators saturate. So a large condition number is a saturation risk — and a nominal simulation that only ever moves along the strong direction will never show it.

**Errors at the input can hurt much more than errors at the output.** A relative error at the actuators is multiplied by $\mathbf{G}$ before it reaches the output. On an ill-conditioned plant, a small input error along the strong direction can show up as a large *relative* error in the weak one. This is why the input and output multiplicative uncertainty models of the first lesson must be kept apart. It is also why ill-conditioned plants are the classic failure case for decoupling controllers, which invert the plant and so lean hard on the weak direction.

**It depends on units.** Change one actuator's units from newton-metres to millinewton-metres and the condition number changes. A large $\gamma$ computed on badly scaled data may be an artefact. The honest procedure is:

- scale each input by its largest expected value, and each output by its allowed error, *before* computing anything;
- if the number is to be compared across designs, report the **minimised condition number** — the smallest $\gamma$ over all diagonal rescalings.

### A measure that ignores units: the relative gain array

The **[[relative gain array|rga]]** (RGA) measures interaction without caring about units:

$$\boldsymbol{\Lambda}(\mathbf{G}) = \mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}.$$

$\boldsymbol{\Lambda}$ is the capital Greek letter "lambda". The small circle $\circ$ means multiply entry by entry — the top-left of one times the top-left of the other, and so on — not ordinary matrix multiplication. So the RGA is $\mathbf{G}$ multiplied entry by entry with the transpose of its inverse.

Each row and each column of $\boldsymbol{\Lambda}$ adds up to $1$. $\boldsymbol{\Lambda} = \mathbf{I}$ means no interaction under the input-output pairing you chose: input 1 drives output 1 and nothing else, and so on. Large entries, or negative ones, mean the pairing is bad.

::: example The coupled inertia tensor, direction by direction
The module's spacecraft has

$$\mathbf{J} = \begin{pmatrix}120 & 18 & 12 \\ 18 & 100 & 9 \\ 12 & 9 & 140\end{pmatrix}\ \mathrm{kg\,m^2}, \qquad \mathbf{G}(s) = \frac{\mathbf{J}^{-1}}{s^2}.$$

The off-diagonal entries are the **products of inertia**, which couple the axes. The plant takes torque in and gives attitude out.

**Step 1: singular values.** $\mathbf{J}$ is symmetric and positive definite, so $\mathbf{J}^{-1}$ is too. For such a matrix the singular values *are* the eigenvalues. The eigenvalues of $\mathbf{J}$ are the **[[principal inertias|principal-axes]]** $89.35$, $119.70$ and $150.96\,\mathrm{kg\,m^2}$. Invert each:

$$\sigma(\mathbf{J}^{-1}) = 0.011192,\ \ 0.008354,\ \ 0.006624\ \ \mathrm{(kg\,m^2)^{-1}}.$$

**Step 2: condition number.** $0.011192/0.006624 = 1.690$. That is exactly the largest principal inertia over the smallest, $150.96/89.35$, because in the principal axes the plant is a plain diagonal matrix.

**Step 3: directions.** The strongest input direction is $\mathbf{v}_1 = (-0.495,\ 0.868,\ -0.037)$. A torque mostly about body $y$, with a negative $x$ part, gives the most angular acceleration, because that combination points along the minimum-inertia principal axis. The weakest is $\mathbf{v}_3 = (0.498,\ 0.318,\ 0.807)$, along the maximum-inertia axis. Since $\mathbf{J}^{-1}$ is symmetric, the input and output directions are the same.

**Step 4: frequency.** On the imaginary axis $\mathbf{G}(j\omega) = -\mathbf{J}^{-1}/\omega^2$. Every singular value is scaled by the same $1/\omega^2$, so the directions do not move with frequency at all.

**Step 5: interaction.** The relative gain array is

$$\boldsymbol{\Lambda}(\mathbf{J}^{-1}) = \begin{pmatrix}1.035 & -0.027 & -0.008 \\ -0.027 & 1.032 & -0.005 \\ -0.008 & -0.005 & 1.013\end{pmatrix}.$$

Check: the first row adds to $1.035 - 0.027 - 0.008 = 1.000$, as it must. The array is very close to the identity. So the diagonal pairing — roll torque to roll angle, and so on — is the right one, and interaction is about a three-percent effect.

This is what "mildly coupled" looks like in numbers, and it is why a per-axis design is a reasonable *starting point* for this vehicle. The next lesson shows why it is not a reasonable finishing point.
:::

::: example A momentum-bias spacecraft, where the directions rotate
Now a vehicle with a **[[momentum wheel|momentum-bias]]** spinning about body $z$ with $h = 50\,\mathrm{N\,m\,s}$ of stored angular momentum, and transverse inertia $J_t = 120\,\mathrm{kg\,m^2}$. The wheel's momentum couples the two transverse axes gyroscopically — twist one and the other responds:

$$J_t\ddot{\theta}_x + h\dot{\theta}_y = u_x, \qquad J_t\ddot{\theta}_y - h\dot{\theta}_x = u_y.$$

Take Laplace transforms. The torque-to-attitude transfer matrix is the inverse of

$$\mathbf{M}(s) = \begin{pmatrix}J_ts^2 & hs \\ -hs & J_ts^2\end{pmatrix}, \qquad \mathbf{G}(s) = \mathbf{M}(s)^{-1}.$$

**Step 1: singular values in closed form.** On the imaginary axis, $\mathbf{M}(j\omega)$ is Hermitian (equal to its own conjugate transpose), with eigenvalues $-J_t\omega^2 \pm h\omega$. The singular values of $\mathbf{G}$ are one over the sizes of those:

$$\bar{\sigma}(\mathbf{G}(j\omega)) = \frac{1}{\omega\,\lvert J_t\omega - h\rvert}, \qquad \underline{\sigma}(\mathbf{G}(j\omega)) = \frac{1}{\omega\,(J_t\omega + h)}.$$

The larger one blows up where $J_t\omega = h$, at $\omega_n = h/J_t = 50/120 = 0.4167\,\mathrm{rad/s}$. That is the **[[nutation|nutation]]** frequency — a real, lightly damped wobble of the vehicle.

**Step 2: numbers across frequency.**

| $\omega$ (rad/s) | $\bar{\sigma}$ | $\underline{\sigma}$ | condition number |
| --- | --- | --- | --- |
| 0.05 | 0.4545 | 0.3571 | 1.27 |
| 0.20 | 0.1923 | 0.0676 | 2.85 |
| 0.45 | 0.5556 | 0.0214 | 26.0 |
| 1.00 | 0.01429 | 0.00588 | 2.43 |

Check one by hand. At $0.45\,\mathrm{rad/s}$: $J_t\omega = 54$, so $\bar{\sigma} = 1/(0.45\times 4) = 0.5556$ and $\underline{\sigma} = 1/(0.45\times 104) = 0.02137$. A grid point only $0.008\,\%$ from the nutation frequency already reads $\bar{\sigma} = 600$ against $\underline{\sigma} = 0.024$.

**Step 3: the directions.** At $0.40\,\mathrm{rad/s}$ the strongest input direction has two components of equal size, $0.7071$, with a $90^\circ$ phase difference between them. Two equal sine waves a quarter-period apart are a torque vector of constant size *rotating* in the transverse plane. The sense of rotation is everything. Rotating the same way as the nutation, from $+x$ toward $+y$, the torque drives the mode at resonance. Rotating the other way, the gain is $\underline{\sigma}$ and the vehicle barely responds. At $0.45\,\mathrm{rad/s}$, two torque commands of identical size and identical frequency, differing only in the sign of one phase, differ in effect by a factor of twenty-six.

A scalar Bode plot cannot show that. Neither can a per-axis analysis, which quietly assumes the channels are driven independently. A nutation damper designed that way will damp one direction of rotation and leave the other alone.
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
    print(f"w={w:4.2f}  sv={sv[0]:.5f} {sv[1]:.5f}  closed form={closed[0]:.5f} {closed[1]:.5f}"
          f"  cond={sv[0] / sv[1]:5.2f}")

U, sv, Vh = np.linalg.svd(plant(0.40))
v1 = Vh[0].conj()                       # strongest input direction
print("sizes:", np.abs(v1).round(4),
      " phase of u_y relative to u_x (deg):", np.degrees(np.angle(v1[1] / v1[0])).round(1))
# w=0.05  sv=0.45455 0.35714  closed form=0.45455 0.35714  cond= 1.27
# w=0.20  sv=0.19231 0.06757  closed form=0.19231 0.06757  cond= 2.85
# w=0.45  sv=0.55556 0.02137  closed form=0.55556 0.02137  cond=26.00
# w=1.00  sv=0.01429 0.00588  closed form=0.01429 0.00588  cond= 2.43
# sizes: [0.7071 0.7071]  phase of u_y relative to u_x (deg): -90.0
```

A phase of $-90^\circ$ means $u_y$ lags $u_x$ by a quarter period: $u_x = \cos\omega t$, $u_y = \sin\omega t$, a torque turning from $+x$ toward $+y$.

::: warning Do not read a MIMO plot as if it were scalar
Three habits from the single-loop world break here.

- A "gain crossover frequency" is ambiguous. $\bar{\sigma}(\mathbf{L})$ and $\underline{\sigma}(\mathbf{L})$ cross one at different frequencies, and in the band between them the loop is closed in some directions and open in others.
- "Phase" is not a single number either. The multivariable version is a set of principal phases, and the usable substitute is the disk margin of the next lesson.
- Stability is governed by the determinant of $\mathbf{I} + \mathbf{L}$, through the multivariable Nyquist criterion — not by any single loop's gain.
:::

::: warning An ill-conditioned plant is not always a hard plant
A large condition number matters only if you need to move the output in the weak direction. A launch vehicle with two gimballed engines has huge pitch authority and feeble differential-roll authority. Its effector matrix $\begin{pmatrix}1 & 1 \\ 0.05 & -0.05\end{pmatrix}$ has singular values $1.414$ and $0.0707$, a condition number of twenty — and it flies perfectly well, because the roll disturbance it must reject is small too. Compare the weak direction against the *disturbance* and *command* directions before calling a plant difficult. Ill-conditioning becomes dangerous when you need the weak direction *and* have input uncertainty at the same time.
:::

## Check yourself

::: check
A $2\times 2$ plant at $5\,\mathrm{rad/s}$ has $\bar{\sigma} = 40$ and $\underline{\sigma} = 0.5$. A command requires an output of size one in the direction $\mathbf{u}_2$. How much input is needed, and what happens if the actuators saturate at $1.5$ units?
:::

::: answer
The output direction $\mathbf{u}_2$ is reached from the input direction $\mathbf{v}_2$ with gain $\underline{\sigma} = 0.5$. So a unit output needs $\lVert u\rVert = 1/0.5 = 2$ units of input.

With saturation at $1.5$ the command cannot be met. The best output in that direction is $0.5\times 1.5 = 0.75$, a twenty-five percent shortfall.

It is worse than a shortfall. In a MIMO loop, saturation does not only shrink the response — it changes the *direction* of the applied input, because the two channels clip by different amounts. The vehicle then moves partly along $\mathbf{u}_1$ instead. This directional error is a standard way a linear MIMO design misbehaves on the real vehicle. It is why **[[anti-windup|direction-preserving]]** schemes for MIMO loops keep the direction of the commanded input rather than clipping channel by channel.
:::

::: check
Why do the input and output singular directions of $\mathbf{J}^{-1}/s^2$ not move with frequency, while those of the momentum-bias plant do?
:::

::: answer
$\mathbf{G}(j\omega) = -\mathbf{J}^{-1}/\omega^2$ is a fixed real symmetric matrix times a single number that depends on frequency. Multiplying a matrix by a number scales all its singular values equally and leaves $\mathbf{U}$ and $\mathbf{V}$ alone. So the directions are the principal axes of the inertia tensor at every frequency, and the condition number stays at $1.690$.

The momentum-bias plant is different in kind. The gyroscopic term $hs$ has one factor of $s$, while the inertia term $J_ts^2$ has two. So the balance between coupling and inertia shifts with frequency:

- at low frequency the $hs$ terms win, and the plant is strongly coupled;
- near nutation one eigenvalue of $\mathbf{M}(j\omega)$ passes through zero;
- at high frequency the $J_ts^2$ terms win, and the plant approaches two separate double integrators with condition number near one.

Directions move with frequency whenever coupling and inertia enter at different powers of $s$ — that is, whenever gyroscopic or aerodynamic cross terms are present.
:::

::: check
Compute the relative gain array of $\mathbf{G} = \begin{pmatrix}1 & 1 \\ 0.05 & -0.05\end{pmatrix}$ and say what it means for pairing.
:::

::: answer
The determinant is $1\times(-0.05) - 1\times 0.05 = -0.1$. So

$$\mathbf{G}^{-1} = \frac{1}{-0.1}\begin{pmatrix}-0.05 & -1 \\ -0.05 & 1\end{pmatrix} = \begin{pmatrix}0.5 & 10 \\ 0.5 & -10\end{pmatrix}.$$

Multiply $\mathbf{G}$ entry by entry with $(\mathbf{G}^{-1})^\mathsf{T}$: $\Lambda_{11} = 1\times 0.5 = 0.5$, $\Lambda_{12} = 1\times 0.5 = 0.5$, $\Lambda_{21} = 0.05\times 10 = 0.5$, $\Lambda_{22} = -0.05\times(-10) = 0.5$. Each row and column adds to $1$, as it should.

Every entry is $0.5$. That is the signature of complete interaction: neither pairing is better than the other, and no diagonal controller can decouple the loops.

Physically this is the two-engine vehicle: both engines count equally toward pitch, and equally in size toward roll. The right move is not to pick a pairing. It is to invert the effector matrix — command the *sum* and *difference* of the gimbal angles instead of the gimbals themselves. That step is **[[control allocation|control-allocation]]**, and it turns an interacting plant into two independent ones before the attitude loops are designed.
:::

::: check
A disturbance hits the momentum-bias spacecraft as a constant-size torque rotating in the transverse plane at $0.45\,\mathrm{rad/s}$, in the same sense as the nutation. How much larger is its effect than the same torque rotating the opposite way?
:::

::: answer
The two senses of rotation are exactly the two singular directions. So the ratio of their effects is the condition number at that frequency: $\bar{\sigma}/\underline{\sigma} = 0.5556/0.02137 = 26.0$.

The rotation that goes along with the nutation produces $26$ times the attitude swing of the opposing one, from the identical torque size. This is why momentum-bias vehicles are analysed in circular rather than $x$-$y$ coordinates for the transverse axes. The natural modes rotate, so the natural input and output directions rotate too. A per-axis $x$-$y$ plot mixes the two together and hides a factor of twenty-six.
:::

::: check
The H-infinity norm of a stable $\mathbf{G}$ is $\sup_\omega\bar{\sigma}(\mathbf{G}(j\omega))$. Why is there no matching useful norm built from $\underline{\sigma}$?
:::

::: answer
A norm must be zero only for the zero system, and must obey the triangle inequality. $\sup_\omega\underline{\sigma}$ fails the first test at once: any non-square or rank-deficient $\mathbf{G}$ has $\underline{\sigma} = 0$ at every frequency while being a perfectly good nonzero system.

More to the point, $\underline{\sigma}$ describes the *worst* direction, which is a floor on what the system does. Every stability and performance argument in this module needs a ceiling. Robust stability needs the loop gain to be small in *all* directions, and that is a statement about $\bar{\sigma}$.

Where $\underline{\sigma}$ does matter, it enters through an inverse: $\underline{\sigma}(\mathbf{G}) = 1/\bar{\sigma}(\mathbf{G}^{-1})$. A requirement that the plant be strongly invertible becomes an H-infinity bound on $\mathbf{G}^{-1}$, and the usual machinery applies again.
:::

## Summary

| Item | Statement |
| --- | --- |
| SVD at each frequency | $\mathbf{G}(j\omega) = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$, $\mathbf{G}\mathbf{v}_i = \sigma_i\mathbf{u}_i$; directions carry phase |
| Gain band | $\underline{\sigma}\lVert u\rVert \le \lVert\mathbf{G}u\rVert \le \bar{\sigma}\lVert u\rVert$; a MIMO Bode plot is two curves |
| Condition number | $\gamma = \sigma_{\max}/\sigma_{\min}$; large means one direction is nearly ineffective; depends on scaling |
| Effort | $\underline{\sigma}(\mathbf{G}) = 1/\bar{\sigma}(\mathbf{G}^{-1})$; unit output in the weak direction costs $1/\underline{\sigma}$ of input |
| Eigenvalues are not gains | $\begin{pmatrix}1&10\\0&1\end{pmatrix}$: eigenvalues $1, 1$; singular values $10.099$, $0.099$ |
| Interaction measure | $\boldsymbol{\Lambda} = \mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}$; rows and columns sum to $1$; $\boldsymbol{\Lambda} = \mathbf{I}$ means no interaction |
| Spacecraft inertia | $\sigma(\mathbf{J}^{-1}) = 0.01119,\ 0.00835,\ 0.00662$; $\gamma = 1.690$; directions fixed with frequency; $\boldsymbol{\Lambda}\approx\mathbf{I}$ |
| Momentum bias | $\bar{\sigma} = 1/(\omega\lvert J_t\omega - h\rvert)$, $\underline{\sigma} = 1/(\omega(J_t\omega + h))$; nutation at $h/J_t$ |
| Rotating directions | at $0.45\,\mathrm{rad/s}$, $\gamma = 26$: the two rotation senses of torque differ in effect by $26\times$ |

The next lesson turns directionality into a margin. If the plant has a different gain in every direction, a gain margin measured one loop at a time cannot be the whole story — and the disk margin is what replaces it.

::: context circle-to-ellipse Circles become ellipses
Take every input of length one. Together they make a circle. Push them all through the matrix and they land on an ellipse. The longest half-axis is $\sigma_1$ long and points along $\mathbf{u}_1$; the shortest is $\sigma_2$ long and points along $\mathbf{u}_2$. The inputs that land on those axes are $\mathbf{v}_1$ and $\mathbf{v}_2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polyline points="125.0,105.0 124.9,102.6 124.8,100.3 124.4,98.0 124.0,95.6 123.5,93.4 122.8,91.1 122.0,88.9 121.1,86.7 120.1,84.6 119.0,82.5 117.7,80.5 116.4,78.5 115.0,76.7 113.4,74.9 111.8,73.2 110.1,71.6 108.3,70.0 106.5,68.6 104.5,67.3 102.5,66.0 100.4,64.9 98.3,63.9 96.1,63.0 93.9,62.2 91.6,61.5 89.4,61.0 87.0,60.6 84.7,60.2 82.4,60.1 80.0,60.0 77.6,60.1 75.3,60.2 73.0,60.6 70.6,61.0 68.4,61.5 66.1,62.2 63.9,63.0 61.7,63.9 59.6,64.9 57.5,66.0 55.5,67.3 53.5,68.6 51.7,70.0 49.9,71.6 48.2,73.2 46.6,74.9 45.0,76.7 43.6,78.5 42.3,80.5 41.0,82.5 39.9,84.6 38.9,86.7 38.0,88.9 37.2,91.1 36.5,93.4 36.0,95.6 35.6,98.0 35.2,100.3 35.1,102.6 35.0,105.0 35.1,107.4 35.2,109.7 35.6,112.0 36.0,114.4 36.5,116.6 37.2,118.9 38.0,121.1 38.9,123.3 39.9,125.4 41.0,127.5 42.3,129.5 43.6,131.5 45.0,133.3 46.6,135.1 48.2,136.8 49.9,138.4 51.7,140.0 53.5,141.4 55.5,142.7 57.5,144.0 59.6,145.1 61.7,146.1 63.9,147.0 66.1,147.8 68.4,148.5 70.6,149.0 73.0,149.4 75.3,149.8 77.6,149.9 80.0,150.0 82.4,149.9 84.7,149.8 87.0,149.4 89.4,149.0 91.6,148.5 93.9,147.8 96.1,147.0 98.3,146.1 100.4,145.1 102.5,144.0 104.5,142.7 106.5,141.4 108.3,140.0 110.1,138.4 111.8,136.8 113.4,135.1 115.0,133.3 116.4,131.5 117.7,129.5 119.0,127.5 120.1,125.4 121.1,123.3 122.0,121.1 122.8,118.9 123.5,116.6 124.0,114.4 124.4,112.0 124.8,109.7 124.9,107.4 125.0,105.0" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="105" x2="125" y2="105" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="80" y1="105" x2="80" y2="60" stroke="#b4232c" stroke-width="2.5"/>
  <text x="102.5" y="121" font-size="12" text-anchor="middle" fill="#1d6fd1">v₁</text>
  <text x="68" y="82.5" font-size="12" text-anchor="middle" fill="#b4232c">v₂</text>
  <text x="80" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">all inputs of size 1</text>
  <polyline points="312.4,69.0 311.6,67.8 310.6,66.8 309.5,65.8 308.2,64.9 306.7,64.2 305.1,63.5 303.4,63.0 301.5,62.6 299.4,62.3 297.2,62.1 294.9,62.1 292.5,62.1 290.0,62.3 287.3,62.6 284.5,63.0 281.7,63.5 278.7,64.2 275.7,64.9 272.6,65.8 269.5,66.8 266.3,67.8 263.0,69.0 259.7,70.3 256.4,71.6 253.1,73.1 249.8,74.6 246.4,76.3 243.1,78.0 239.8,79.8 236.5,81.6 233.3,83.5 230.1,85.5 226.9,87.5 223.8,89.6 220.8,91.7 217.9,93.9 215.1,96.1 212.3,98.3 209.7,100.5 207.1,102.7 204.7,105.0 202.4,107.2 200.3,109.5 198.2,111.7 196.4,113.9 194.6,116.1 193.0,118.3 191.6,120.4 190.4,122.5 189.2,124.5 188.3,126.5 187.5,128.4 186.9,130.2 186.5,132.0 186.3,133.7 186.2,135.4 186.3,136.9 186.6,138.4 187.0,139.7 187.6,141.0 188.4,142.2 189.4,143.2 190.5,144.2 191.8,145.1 193.3,145.8 194.9,146.5 196.6,147.0 198.5,147.4 200.6,147.7 202.7,147.9 205.1,147.9 207.5,147.9 210.0,147.7 212.7,147.4 215.5,147.0 218.3,146.5 221.3,145.8 224.3,145.1 227.4,144.2 230.5,143.2 233.7,142.2 237.0,141.0 240.3,139.7 243.6,138.4 246.9,136.9 250.2,135.4 253.6,133.7 256.9,132.0 260.2,130.2 263.5,128.4 266.7,126.5 269.9,124.5 273.1,122.5 276.2,120.4 279.2,118.3 282.1,116.1 284.9,113.9 287.7,111.7 290.3,109.5 292.9,107.3 295.3,105.0 297.6,102.8 299.7,100.5 301.8,98.3 303.6,96.1 305.4,93.9 307.0,91.7 308.4,89.6 309.6,87.5 310.8,85.5 311.7,83.5 312.5,81.6 313.1,79.8 313.5,78.0 313.7,76.3 313.8,74.6 313.7,73.1 313.4,71.6 313.0,70.3 312.4,69.0" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="105" x2="312.4" y2="69.0" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="250" y1="105" x2="236.5" y2="81.6" stroke="#b4232c" stroke-width="2.5"/>
  <text x="308.4" y="59.0" font-size="12" text-anchor="end" fill="#1d6fd1">σ₁u₁ (1.6)</text>
  <text x="228.5" y="83.6" font-size="12" text-anchor="end" fill="#b4232c">σ₂u₂ (0.6)</text>
  <text x="250" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">outputs: an ellipse</text>
  <text x="165" y="100" font-size="20" text-anchor="middle" fill="#6c7a93">→</text>
  <text x="165" y="80" font-size="12" text-anchor="middle" fill="#6c7a93">G</text>
</svg>
```

Here the matrix has singular values $1.6$ and $0.6$. Every output lies on the ellipse, so every gain lies between $0.6$ and $1.6$.
:::

::: context unitary Unitary: a rotation that keeps lengths
A real **rotation matrix** turns vectors without stretching them. Its transpose undoes it: $\mathbf{R}^\mathsf{T}\mathbf{R} = \mathbf{I}$. A **unitary** matrix is the same idea for complex vectors: $\mathbf{U}^\mathsf{H}\mathbf{U} = \mathbf{I}$, and it never changes a vector's length. That is why the SVD is so clean. $\mathbf{V}^\mathsf{H}$ turns the input onto the right axes, $\boldsymbol{\Sigma}$ stretches each axis by its own amount, and $\mathbf{U}$ turns the result into place. Only $\boldsymbol{\Sigma}$ changes any sizes.
:::

::: context phase-pattern A direction with a timing pattern
A complex direction like $(0.7071,\ -0.7071j)$ does not say "push this way". It says "push both channels equally, but make the second one peak a quarter period after the first".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="55" x2="340" y2="55" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="40.0,33.0 41.2,33.0 42.5,33.1 43.8,33.3 45.0,33.5 46.2,33.7 47.5,34.1 48.8,34.5 50.0,34.9 51.2,35.4 52.5,35.9 53.8,36.5 55.0,37.2 56.2,37.9 57.5,38.7 58.8,39.4 60.0,40.3 61.2,41.2 62.5,42.1 63.8,43.0 65.0,44.0 66.2,45.0 67.5,46.1 68.8,47.1 70.0,48.2 71.2,49.3 72.5,50.4 73.8,51.6 75.0,52.7 76.2,53.8 77.5,55.0 78.8,56.2 80.0,57.3 81.2,58.4 82.5,59.6 83.8,60.7 85.0,61.8 86.2,62.9 87.5,63.9 88.8,65.0 90.0,66.0 91.2,67.0 92.5,67.9 93.8,68.8 95.0,69.7 96.2,70.6 97.5,71.3 98.8,72.1 100.0,72.8 101.2,73.5 102.5,74.1 103.8,74.6 105.0,75.1 106.2,75.5 107.5,75.9 108.8,76.3 110.0,76.5 111.2,76.7 112.5,76.9 113.8,77.0 115.0,77.0 116.2,77.0 117.5,76.9 118.8,76.7 120.0,76.5 121.2,76.3 122.5,75.9 123.8,75.5 125.0,75.1 126.2,74.6 127.5,74.1 128.8,73.5 130.0,72.8 131.2,72.1 132.5,71.3 133.8,70.6 135.0,69.7 136.2,68.8 137.5,67.9 138.8,67.0 140.0,66.0 141.2,65.0 142.5,63.9 143.8,62.9 145.0,61.8 146.2,60.7 147.5,59.6 148.8,58.4 150.0,57.3 151.2,56.2 152.5,55.0 153.8,53.8 155.0,52.7 156.2,51.6 157.5,50.4 158.8,49.3 160.0,48.2 161.2,47.1 162.5,46.1 163.8,45.0 165.0,44.0 166.2,43.0 167.5,42.1 168.8,41.2 170.0,40.3 171.2,39.4 172.5,38.7 173.8,37.9 175.0,37.2 176.2,36.5 177.5,35.9 178.8,35.4 180.0,34.9 181.2,34.5 182.5,34.1 183.8,33.7 185.0,33.5 186.2,33.3 187.5,33.1 188.8,33.0 190.0,33.0 191.2,33.0 192.5,33.1 193.8,33.3 195.0,33.5 196.2,33.7 197.5,34.1 198.7,34.5 200.0,34.9 201.2,35.4 202.5,35.9 203.8,36.5 205.0,37.2 206.2,37.9 207.5,38.7 208.8,39.4 210.0,40.3 211.2,41.2 212.5,42.1 213.8,43.0 215.0,44.0 216.2,45.0 217.5,46.1 218.7,47.1 220.0,48.2 221.2,49.3 222.5,50.4 223.8,51.6 225.0,52.7 226.2,53.8 227.5,55.0 228.7,56.2 230.0,57.3 231.2,58.4 232.5,59.6 233.8,60.7 235.0,61.8 236.2,62.9 237.5,63.9 238.8,65.0 240.0,66.0 241.2,67.0 242.5,67.9 243.8,68.8 245.0,69.7 246.2,70.6 247.5,71.3 248.8,72.1 250.0,72.8 251.2,73.5 252.5,74.1 253.7,74.6 255.0,75.1 256.2,75.5 257.5,75.9 258.8,76.3 260.0,76.5 261.2,76.7 262.5,76.9 263.8,77.0 265.0,77.0 266.2,77.0 267.5,76.9 268.8,76.7 270.0,76.5 271.2,76.3 272.5,75.9 273.8,75.5 275.0,75.1 276.2,74.6 277.5,74.1 278.8,73.5 280.0,72.8 281.2,72.1 282.5,71.3 283.8,70.6 285.0,69.7 286.2,68.8 287.5,67.9 288.8,67.0 290.0,66.0 291.2,65.0 292.5,63.9 293.8,62.9 295.0,61.8 296.2,60.7 297.5,59.6 298.7,58.4 300.0,57.3 301.2,56.2 302.5,55.0 303.8,53.8 305.0,52.7 306.2,51.6 307.5,50.4 308.8,49.3 310.0,48.2 311.2,47.1 312.5,46.1 313.8,45.0 315.0,44.0 316.2,43.0 317.5,42.1 318.8,41.2 320.0,40.3 321.2,39.4 322.5,38.7 323.8,37.9 325.0,37.2 326.2,36.5 327.5,35.9 328.7,35.4 330.0,34.9 331.2,34.5 332.5,34.1 333.8,33.7 335.0,33.5 336.2,33.3 337.5,33.1 338.8,33.0 340.0,33.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="40.0,140.0 41.2,138.8 42.5,137.7 43.8,136.6 45.0,135.4 46.2,134.3 47.5,133.2 48.8,132.1 50.0,131.1 51.2,130.0 52.5,129.0 53.8,128.0 55.0,127.1 56.2,126.2 57.5,125.3 58.8,124.4 60.0,123.7 61.2,122.9 62.5,122.2 63.8,121.5 65.0,120.9 66.2,120.4 67.5,119.9 68.8,119.5 70.0,119.1 71.2,118.7 72.5,118.5 73.8,118.3 75.0,118.1 76.2,118.0 77.5,118.0 78.8,118.0 80.0,118.1 81.2,118.3 82.5,118.5 83.8,118.7 85.0,119.1 86.2,119.5 87.5,119.9 88.8,120.4 90.0,120.9 91.2,121.5 92.5,122.2 93.8,122.9 95.0,123.7 96.2,124.4 97.5,125.3 98.8,126.2 100.0,127.1 101.2,128.0 102.5,129.0 103.8,130.0 105.0,131.1 106.2,132.1 107.5,133.2 108.8,134.3 110.0,135.4 111.2,136.6 112.5,137.7 113.8,138.8 115.0,140.0 116.2,141.2 117.5,142.3 118.8,143.4 120.0,144.6 121.2,145.7 122.5,146.8 123.8,147.9 125.0,148.9 126.2,150.0 127.5,151.0 128.8,152.0 130.0,152.9 131.2,153.8 132.5,154.7 133.8,155.6 135.0,156.3 136.2,157.1 137.5,157.8 138.8,158.5 140.0,159.1 141.2,159.6 142.5,160.1 143.8,160.5 145.0,160.9 146.2,161.3 147.5,161.5 148.8,161.7 150.0,161.9 151.2,162.0 152.5,162.0 153.8,162.0 155.0,161.9 156.2,161.7 157.5,161.5 158.8,161.3 160.0,160.9 161.2,160.5 162.5,160.1 163.8,159.6 165.0,159.1 166.2,158.5 167.5,157.8 168.8,157.1 170.0,156.3 171.2,155.6 172.5,154.7 173.8,153.8 175.0,152.9 176.2,152.0 177.5,151.0 178.8,150.0 180.0,148.9 181.2,147.9 182.5,146.8 183.8,145.7 185.0,144.6 186.2,143.4 187.5,142.3 188.8,141.2 190.0,140.0 191.2,138.8 192.5,137.7 193.8,136.6 195.0,135.4 196.2,134.3 197.5,133.2 198.7,132.1 200.0,131.1 201.2,130.0 202.5,129.0 203.8,128.0 205.0,127.1 206.2,126.2 207.5,125.3 208.8,124.4 210.0,123.7 211.2,122.9 212.5,122.2 213.8,121.5 215.0,120.9 216.2,120.4 217.5,119.9 218.7,119.5 220.0,119.1 221.2,118.7 222.5,118.5 223.8,118.3 225.0,118.1 226.2,118.0 227.5,118.0 228.7,118.0 230.0,118.1 231.2,118.3 232.5,118.5 233.8,118.7 235.0,119.1 236.2,119.5 237.5,119.9 238.8,120.4 240.0,120.9 241.2,121.5 242.5,122.2 243.8,122.9 245.0,123.7 246.2,124.4 247.5,125.3 248.8,126.2 250.0,127.1 251.2,128.0 252.5,129.0 253.7,130.0 255.0,131.1 256.2,132.1 257.5,133.2 258.8,134.3 260.0,135.4 261.2,136.6 262.5,137.7 263.8,138.8 265.0,140.0 266.2,141.2 267.5,142.3 268.8,143.4 270.0,144.6 271.2,145.7 272.5,146.8 273.8,147.9 275.0,148.9 276.2,150.0 277.5,151.0 278.8,152.0 280.0,152.9 281.2,153.8 282.5,154.7 283.8,155.6 285.0,156.3 286.2,157.1 287.5,157.8 288.8,158.5 290.0,159.1 291.2,159.6 292.5,160.1 293.8,160.5 295.0,160.9 296.2,161.3 297.5,161.5 298.7,161.7 300.0,161.9 301.2,162.0 302.5,162.0 303.8,162.0 305.0,161.9 306.2,161.7 307.5,161.5 308.8,161.3 310.0,160.9 311.2,160.5 312.5,160.1 313.8,159.6 315.0,159.1 316.2,158.5 317.5,157.8 318.8,157.1 320.0,156.3 321.2,155.6 322.5,154.7 323.8,153.8 325.0,152.9 326.2,152.0 327.5,151.0 328.7,150.0 330.0,148.9 331.2,147.9 332.5,146.8 333.8,145.7 335.0,144.6 336.2,143.4 337.5,142.3 338.8,141.2 340.0,140.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="34" y="59" font-size="12" text-anchor="end" fill="#1d6fd1">u_x</text>
  <text x="34" y="144" font-size="12" text-anchor="end" fill="#b4232c">u_y</text>
  <line x1="40" y1="20" x2="40" y2="178" stroke="#1f2a44" stroke-dasharray="3,3"/>
  <line x1="77.5" y1="20" x2="77.5" y2="178" stroke="#1f2a44" stroke-dasharray="3,3"/>
  <text x="58.8" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">¼ period</text>
  <text x="200" y="14" font-size="11" text-anchor="middle" fill="#1f2a44">same size; u_y peaks a quarter period later</text>
</svg>
```

Draw the torque vector $(u_x, u_y) = (\cos\omega t, \sin\omega t)$ at each instant and its tip goes around a circle. So a $90^\circ$ phase difference between equal channels is a torque of fixed size that *rotates*. That is the pattern that drives the momentum-bias spacecraft's nutation.
:::

::: context shear-matrix Why eigenvalues miss the gain
An eigenvector is a direction the matrix does not turn — it only stretches it. The shear $\begin{pmatrix}1 & 10 \\ 0 & 1\end{pmatrix}$ leaves the $x$ axis alone (stretch $1$), so its eigenvalues are both $1$. But feed it $(0, 1)$ and out comes $(10, 1)$, about ten times longer. Eigenvalues only report on the special directions the matrix does not turn. The biggest stretch happens in a direction that *is* turned, and only the singular values see it.
:::

::: context condition-number Where "condition number" comes from
The name comes from numerical analysis, the study of solving equations on a computer. When you solve $\mathbf{A}x = b$, a small relative error in $b$ can grow into a relative error in $x$ up to $\gamma(\mathbf{A})$ times larger. A problem with a big condition number is called **ill-conditioned**: the answer is fragile. For a plant the meaning is the same idea turned around — asking the plant for an output in its weak direction is like solving an ill-conditioned equation for the input you need.
:::

::: context rga Where the relative gain array came from
Edgar Bristol proposed the relative gain array in 1966 for chemical process plants, where operators had to decide which valve should control which temperature or flow. Each entry $\Lambda_{ij}$ compares two gains from input $j$ to output $i$: the gain with all other loops open, divided by the gain with all other loops closed perfectly. An entry of $1$ means the other loops do not change what this one sees. An entry far from $1$, or negative, means closing the other loops changes this one a lot — or even flips its sign.
:::

::: context principal-axes Principal axes of a spacecraft
Every rigid body has three special perpendicular axes, the **principal axes**. Spin it about one of them and it turns cleanly, without wobbling. They are the eigenvectors of the inertia tensor $\mathbf{J}$, and the eigenvalues are the **principal inertias**. The products of inertia in $\mathbf{J}$ are only there because the body axes the engineers drew on the structure are not lined up with the principal ones. In principal axes the coupling disappears, and the three axes become three separate double integrators.
:::

::: context momentum-bias What a momentum-bias spacecraft is
Many communications satellites carry a wheel that spins fast all the time. Its stored angular momentum acts like a gyroscope and resists tipping about the two axes perpendicular to the wheel, so little active control is needed there. The price is gyroscopic coupling: push the vehicle about $x$ and it responds about $y$. The same effect makes a spinning bicycle wheel, held by its axle, swing sideways when you try to tilt it.
:::

::: context nutation Nutation: the wobble of a spinning top
Nutation is the nodding, circling wobble of a spinning body whose spin axis is a little off. A spinning top shows it, and so does a thrown football that is not a perfect spiral. On a momentum-bias spacecraft, the pointing error traces a small circle at $\omega_n = h/J_t$. Nothing in the rigid dynamics damps it, which is why these vehicles carry nutation dampers. A damper only works if it pushes against the circle in the right sense of rotation.

Here are the momentum-bias plant's two singular values across frequency — the two curves of a MIMO Bode plot:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="62" y="20" width="283" height="150" fill="#fff" stroke="#1f2a44"/>
  <line x1="58" y1="170.0" x2="62" y2="170.0" stroke="#1f2a44"/><text x="55" y="174.0" font-size="11" text-anchor="end" fill="#1f2a44">0.0001</text><line x1="58" y1="140.0" x2="62" y2="140.0" stroke="#1f2a44"/><text x="55" y="144.0" font-size="11" text-anchor="end" fill="#1f2a44">0.001</text><line x1="58" y1="110.0" x2="62" y2="110.0" stroke="#1f2a44"/><text x="55" y="114.0" font-size="11" text-anchor="end" fill="#1f2a44">0.01</text><line x1="58" y1="80.0" x2="62" y2="80.0" stroke="#1f2a44"/><text x="55" y="84.0" font-size="11" text-anchor="end" fill="#1f2a44">0.1</text><line x1="58" y1="50.0" x2="62" y2="50.0" stroke="#1f2a44"/><text x="55" y="54.0" font-size="11" text-anchor="end" fill="#1f2a44">1</text><line x1="58" y1="20.0" x2="62" y2="20.0" stroke="#1f2a44"/><text x="55" y="24.0" font-size="11" text-anchor="end" fill="#1f2a44">10</text><line x1="115.2" y1="170" x2="115.2" y2="174" stroke="#1f2a44"/><text x="115.2" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text><line x1="168.4" y1="170" x2="168.4" y2="174" stroke="#1f2a44"/><text x="168.4" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0.2</text><line x1="238.6" y1="170" x2="238.6" y2="174" stroke="#1f2a44"/><text x="238.6" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0.5</text><line x1="291.8" y1="170" x2="291.8" y2="174" stroke="#1f2a44"/><text x="291.8" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">1</text><line x1="345.0" y1="170" x2="345.0" y2="174" stroke="#1f2a44"/><text x="345.0" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <line x1="224.7" y1="20" x2="224.7" y2="170" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <polyline points="62.0,60.3 62.5,60.3 62.9,60.4 63.4,60.5 63.9,60.5 64.4,60.6 64.8,60.7 65.3,60.8 65.8,60.8 66.3,60.9 66.7,61.0 67.2,61.0 67.7,61.1 68.1,61.2 68.6,61.2 69.1,61.3 69.6,61.4 70.0,61.4 70.5,61.5 71.0,61.6 71.4,61.6 71.9,61.7 72.4,61.8 72.9,61.8 73.3,61.9 73.8,62.0 74.3,62.0 74.8,62.1 75.2,62.2 75.7,62.2 76.2,62.3 76.6,62.4 77.1,62.4 77.6,62.5 78.1,62.6 78.5,62.6 79.0,62.7 79.5,62.8 80.0,62.8 80.4,62.9 80.9,63.0 81.4,63.0 81.8,63.1 82.3,63.2 82.8,63.2 83.3,63.3 83.7,63.4 84.2,63.4 84.7,63.5 85.2,63.6 85.6,63.6 86.1,63.7 86.6,63.8 87.0,63.8 87.5,63.9 88.0,63.9 88.5,64.0 88.9,64.1 89.4,64.1 89.9,64.2 90.3,64.3 90.8,64.3 91.3,64.4 91.8,64.5 92.2,64.5 92.7,64.6 93.2,64.6 93.7,64.7 94.1,64.8 94.6,64.8 95.1,64.9 95.5,65.0 96.0,65.0 96.5,65.1 97.0,65.1 97.4,65.2 97.9,65.3 98.4,65.3 98.9,65.4 99.3,65.4 99.8,65.5 100.3,65.6 100.7,65.6 101.2,65.7 101.7,65.7 102.2,65.8 102.6,65.9 103.1,65.9 103.6,66.0 104.0,66.0 104.5,66.1 105.0,66.2 105.5,66.2 105.9,66.3 106.4,66.3 106.9,66.4 107.4,66.5 107.8,66.5 108.3,66.6 108.8,66.6 109.2,66.7 109.7,66.7 110.2,66.8 110.7,66.9 111.1,66.9 111.6,67.0 112.1,67.0 112.6,67.1 113.0,67.1 113.5,67.2 114.0,67.3 114.4,67.3 114.9,67.4 115.4,67.4 115.9,67.5 116.3,67.5 116.8,67.6 117.3,67.6 117.7,67.7 118.2,67.7 118.7,67.8 119.2,67.8 119.6,67.9 120.1,68.0 120.6,68.0 121.1,68.1 121.5,68.1 122.0,68.2 122.5,68.2 122.9,68.3 123.4,68.3 123.9,68.4 124.4,68.4 124.8,68.5 125.3,68.5 125.8,68.6 126.3,68.6 126.7,68.7 127.2,68.7 127.7,68.8 128.1,68.8 128.6,68.9 129.1,68.9 129.6,69.0 130.0,69.0 130.5,69.1 131.0,69.1 131.5,69.1 131.9,69.2 132.4,69.2 132.9,69.3 133.3,69.3 133.8,69.4 134.3,69.4 134.8,69.5 135.2,69.5 135.7,69.6 136.2,69.6 136.6,69.6 137.1,69.7 137.6,69.7 138.1,69.8 138.5,69.8 139.0,69.8 139.5,69.9 140.0,69.9 140.4,70.0 140.9,70.0 141.4,70.0 141.8,70.1 142.3,70.1 142.8,70.2 143.3,70.2 143.7,70.2 144.2,70.3 144.7,70.3 145.2,70.4 145.6,70.4 146.1,70.4 146.6,70.5 147.0,70.5 147.5,70.5 148.0,70.6 148.5,70.6 148.9,70.6 149.4,70.7 149.9,70.7 150.3,70.7 150.8,70.8 151.3,70.8 151.8,70.8 152.2,70.8 152.7,70.9 153.2,70.9 153.7,70.9 154.1,71.0 154.6,71.0 155.1,71.0 155.5,71.0 156.0,71.1 156.5,71.1 157.0,71.1 157.4,71.1 157.9,71.2 158.4,71.2 158.9,71.2 159.3,71.2 159.8,71.2 160.3,71.3 160.7,71.3 161.2,71.3 161.7,71.3 162.2,71.3 162.6,71.3 163.1,71.4 163.6,71.4 164.1,71.4 164.5,71.4 165.0,71.4 165.5,71.4 165.9,71.4 166.4,71.4 166.9,71.5 167.4,71.5 167.8,71.5 168.3,71.5 168.8,71.5 169.2,71.5 169.7,71.5 170.2,71.5 170.7,71.5 171.1,71.5 171.6,71.5 172.1,71.5 172.6,71.5 173.0,71.5 173.5,71.5 174.0,71.5 174.4,71.5 174.9,71.5 175.4,71.5 175.9,71.5 176.3,71.4 176.8,71.4 177.3,71.4 177.8,71.4 178.2,71.4 178.7,71.4 179.2,71.4 179.6,71.3 180.1,71.3 180.6,71.3 181.1,71.3 181.5,71.2 182.0,71.2 182.5,71.2 182.9,71.2 183.4,71.1 183.9,71.1 184.4,71.1 184.8,71.0 185.3,71.0 185.8,70.9 186.3,70.9 186.7,70.9 187.2,70.8 187.7,70.8 188.1,70.7 188.6,70.7 189.1,70.6 189.6,70.5 190.0,70.5 190.5,70.4 191.0,70.4 191.5,70.3 191.9,70.2 192.4,70.2 192.9,70.1 193.3,70.0 193.8,69.9 194.3,69.8 194.8,69.8 195.2,69.7 195.7,69.6 196.2,69.5 196.6,69.4 197.1,69.3 197.6,69.2 198.1,69.0 198.5,68.9 199.0,68.8 199.5,68.7 200.0,68.6 200.4,68.4 200.9,68.3 201.4,68.1 201.8,68.0 202.3,67.8 202.8,67.7 203.3,67.5 203.7,67.3 204.2,67.2 204.7,67.0 205.2,66.8 205.6,66.6 206.1,66.4 206.6,66.2 207.0,65.9 207.5,65.7 208.0,65.5 208.5,65.2 208.9,64.9 209.4,64.7 209.9,64.4 210.4,64.1 210.8,63.7 211.3,63.4 211.8,63.1 212.2,62.7 212.7,62.3 213.2,61.9 213.7,61.5 214.1,61.0 214.6,60.5 215.1,60.0 215.5,59.5 216.0,58.9 216.5,58.3 217.0,57.6 217.4,56.9 217.9,56.2 218.4,55.4 218.9,54.5 219.3,53.5 219.8,52.4 220.3,51.2 220.7,49.8 221.2,48.2 221.7,46.4 222.2,44.3 222.6,41.7 223.1,38.4 223.6,33.8 224.1,26.4 224.5,20.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="225.0,20.0 225.5,30.5 225.9,36.6 226.4,40.8 226.9,44.0 227.4,46.6 227.8,48.9 228.3,50.8 228.8,52.5 229.2,54.0 229.7,55.4 230.2,56.7 230.7,57.9 231.1,59.0 231.6,60.1 232.1,61.0 232.6,62.0 233.0,62.8 233.5,63.7 234.0,64.5 234.4,65.2 234.9,66.0 235.4,66.7 235.9,67.4 236.3,68.0 236.8,68.7 237.3,69.3 237.8,69.9 238.2,70.5 238.7,71.0 239.2,71.6 239.6,72.1 240.1,72.6 240.6,73.2 241.1,73.7 241.5,74.2 242.0,74.6 242.5,75.1 242.9,75.6 243.4,76.0 243.9,76.5 244.4,76.9 244.8,77.3 245.3,77.8 245.8,78.2 246.3,78.6 246.7,79.0 247.2,79.4 247.7,79.8 248.1,80.2 248.6,80.6 249.1,80.9 249.6,81.3 250.0,81.7 250.5,82.0 251.0,82.4 251.5,82.7 251.9,83.1 252.4,83.4 252.9,83.8 253.3,84.1 253.8,84.5 254.3,84.8 254.8,85.1 255.2,85.5 255.7,85.8 256.2,86.1 256.7,86.4 257.1,86.7 257.6,87.0 258.1,87.3 258.5,87.7 259.0,88.0 259.5,88.3 260.0,88.6 260.4,88.9 260.9,89.1 261.4,89.4 261.8,89.7 262.3,90.0 262.8,90.3 263.3,90.6 263.7,90.9 264.2,91.1 264.7,91.4 265.2,91.7 265.6,92.0 266.1,92.3 266.6,92.5 267.0,92.8 267.5,93.1 268.0,93.3 268.5,93.6 268.9,93.9 269.4,94.1 269.9,94.4 270.4,94.6 270.8,94.9 271.3,95.2 271.8,95.4 272.2,95.7 272.7,95.9 273.2,96.2 273.7,96.4 274.1,96.7 274.6,96.9 275.1,97.2 275.5,97.4 276.0,97.7 276.5,97.9 277.0,98.1 277.4,98.4 277.9,98.6 278.4,98.9 278.9,99.1 279.3,99.3 279.8,99.6 280.3,99.8 280.7,100.1 281.2,100.3 281.7,100.5 282.2,100.8 282.6,101.0 283.1,101.2 283.6,101.5 284.1,101.7 284.5,101.9 285.0,102.1 285.5,102.4 285.9,102.6 286.4,102.8 286.9,103.0 287.4,103.3 287.8,103.5 288.3,103.7 288.8,103.9 289.3,104.2 289.7,104.4 290.2,104.6 290.7,104.8 291.1,105.0 291.6,105.3 292.1,105.5 292.6,105.7 293.0,105.9 293.5,106.1 294.0,106.3 294.4,106.6 294.9,106.8 295.4,107.0 295.9,107.2 296.3,107.4 296.8,107.6 297.3,107.8 297.8,108.0 298.2,108.3 298.7,108.5 299.2,108.7 299.6,108.9 300.1,109.1 300.6,109.3 301.1,109.5 301.5,109.7 302.0,109.9 302.5,110.1 303.0,110.3 303.4,110.5 303.9,110.7 304.4,110.9 304.8,111.2 305.3,111.4 305.8,111.6 306.3,111.8 306.7,112.0 307.2,112.2 307.7,112.4 308.1,112.6 308.6,112.8 309.1,113.0 309.6,113.2 310.0,113.4 310.5,113.6 311.0,113.8 311.5,114.0 311.9,114.2 312.4,114.4 312.9,114.6 313.3,114.8 313.8,115.0 314.3,115.2 314.8,115.4 315.2,115.5 315.7,115.7 316.2,115.9 316.7,116.1 317.1,116.3 317.6,116.5 318.1,116.7 318.5,116.9 319.0,117.1 319.5,117.3 320.0,117.5 320.4,117.7 320.9,117.9 321.4,118.1 321.8,118.3 322.3,118.5 322.8,118.6 323.3,118.8 323.7,119.0 324.2,119.2 324.7,119.4 325.2,119.6 325.6,119.8 326.1,120.0 326.6,120.2 327.0,120.4 327.5,120.5 328.0,120.7 328.5,120.9 328.9,121.1 329.4,121.3 329.9,121.5 330.4,121.7 330.8,121.9 331.3,122.1 331.8,122.2 332.2,122.4 332.7,122.6 333.2,122.8 333.7,123.0 334.1,123.2 334.6,123.4 335.1,123.5 335.6,123.7 336.0,123.9 336.5,124.1 337.0,124.3 337.4,124.5 337.9,124.7 338.4,124.8 338.9,125.0 339.3,125.2 339.8,125.4 340.3,125.6 340.7,125.8 341.2,125.9 341.7,126.1 342.2,126.3 342.6,126.5 343.1,126.7 343.6,126.8 344.1,127.0 344.5,127.2 345.0,127.4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="62.0,63.4 62.5,63.5 62.9,63.6 63.4,63.7 63.9,63.8 64.4,63.9 64.8,63.9 65.3,64.0 65.8,64.1 66.3,64.2 66.7,64.3 67.2,64.4 67.7,64.5 68.1,64.6 68.6,64.7 69.1,64.8 69.6,64.8 70.0,64.9 70.5,65.0 71.0,65.1 71.4,65.2 71.9,65.3 72.4,65.4 72.9,65.5 73.3,65.6 73.8,65.7 74.3,65.7 74.8,65.8 75.2,65.9 75.7,66.0 76.2,66.1 76.6,66.2 77.1,66.3 77.6,66.4 78.1,66.5 78.5,66.6 79.0,66.6 79.5,66.7 80.0,66.8 80.4,66.9 80.9,67.0 81.4,67.1 81.8,67.2 82.3,67.3 82.8,67.4 83.3,67.5 83.7,67.6 84.2,67.6 84.7,67.7 85.2,67.8 85.6,67.9 86.1,68.0 86.6,68.1 87.0,68.2 87.5,68.3 88.0,68.4 88.5,68.5 88.9,68.6 89.4,68.7 89.9,68.7 90.3,68.8 90.8,68.9 91.3,69.0 91.8,69.1 92.2,69.2 92.7,69.3 93.2,69.4 93.7,69.5 94.1,69.6 94.6,69.7 95.1,69.8 95.5,69.9 96.0,69.9 96.5,70.0 97.0,70.1 97.4,70.2 97.9,70.3 98.4,70.4 98.9,70.5 99.3,70.6 99.8,70.7 100.3,70.8 100.7,70.9 101.2,71.0 101.7,71.1 102.2,71.2 102.6,71.3 103.1,71.3 103.6,71.4 104.0,71.5 104.5,71.6 105.0,71.7 105.5,71.8 105.9,71.9 106.4,72.0 106.9,72.1 107.4,72.2 107.8,72.3 108.3,72.4 108.8,72.5 109.2,72.6 109.7,72.7 110.2,72.8 110.7,72.9 111.1,73.0 111.6,73.1 112.1,73.1 112.6,73.2 113.0,73.3 113.5,73.4 114.0,73.5 114.4,73.6 114.9,73.7 115.4,73.8 115.9,73.9 116.3,74.0 116.8,74.1 117.3,74.2 117.7,74.3 118.2,74.4 118.7,74.5 119.2,74.6 119.6,74.7 120.1,74.8 120.6,74.9 121.1,75.0 121.5,75.1 122.0,75.2 122.5,75.3 122.9,75.4 123.4,75.5 123.9,75.6 124.4,75.6 124.8,75.7 125.3,75.8 125.8,75.9 126.3,76.0 126.7,76.1 127.2,76.2 127.7,76.3 128.1,76.4 128.6,76.5 129.1,76.6 129.6,76.7 130.0,76.8 130.5,76.9 131.0,77.0 131.5,77.1 131.9,77.2 132.4,77.3 132.9,77.4 133.3,77.5 133.8,77.6 134.3,77.7 134.8,77.8 135.2,77.9 135.7,78.0 136.2,78.1 136.6,78.2 137.1,78.3 137.6,78.4 138.1,78.5 138.5,78.6 139.0,78.7 139.5,78.8 140.0,78.9 140.4,79.0 140.9,79.1 141.4,79.2 141.8,79.3 142.3,79.4 142.8,79.5 143.3,79.6 143.7,79.7 144.2,79.8 144.7,79.9 145.2,80.0 145.6,80.1 146.1,80.2 146.6,80.3 147.0,80.4 147.5,80.5 148.0,80.6 148.5,80.7 148.9,80.8 149.4,80.9 149.9,81.0 150.3,81.1 150.8,81.2 151.3,81.3 151.8,81.4 152.2,81.5 152.7,81.6 153.2,81.8 153.7,81.9 154.1,82.0 154.6,82.1 155.1,82.2 155.5,82.3 156.0,82.4 156.5,82.5 157.0,82.6 157.4,82.7 157.9,82.8 158.4,82.9 158.9,83.0 159.3,83.1 159.8,83.2 160.3,83.3 160.7,83.4 161.2,83.5 161.7,83.6 162.2,83.7 162.6,83.8 163.1,83.9 163.6,84.0 164.1,84.1 164.5,84.3 165.0,84.4 165.5,84.5 165.9,84.6 166.4,84.7 166.9,84.8 167.4,84.9 167.8,85.0 168.3,85.1 168.8,85.2 169.2,85.3 169.7,85.4 170.2,85.5 170.7,85.6 171.1,85.7 171.6,85.8 172.1,86.0 172.6,86.1 173.0,86.2 173.5,86.3 174.0,86.4 174.4,86.5 174.9,86.6 175.4,86.7 175.9,86.8 176.3,86.9 176.8,87.0 177.3,87.1 177.8,87.2 178.2,87.4 178.7,87.5 179.2,87.6 179.6,87.7 180.1,87.8 180.6,87.9 181.1,88.0 181.5,88.1 182.0,88.2 182.5,88.3 182.9,88.4 183.4,88.6 183.9,88.7 184.4,88.8 184.8,88.9 185.3,89.0 185.8,89.1 186.3,89.2 186.7,89.3 187.2,89.4 187.7,89.5 188.1,89.7 188.6,89.8 189.1,89.9 189.6,90.0 190.0,90.1 190.5,90.2 191.0,90.3 191.5,90.4 191.9,90.5 192.4,90.7 192.9,90.8 193.3,90.9 193.8,91.0 194.3,91.1 194.8,91.2 195.2,91.3 195.7,91.4 196.2,91.6 196.6,91.7 197.1,91.8 197.6,91.9 198.1,92.0 198.5,92.1 199.0,92.2 199.5,92.4 200.0,92.5 200.4,92.6 200.9,92.7 201.4,92.8 201.8,92.9 202.3,93.0 202.8,93.2 203.3,93.3 203.7,93.4 204.2,93.5 204.7,93.6 205.2,93.7 205.6,93.8 206.1,94.0 206.6,94.1 207.0,94.2 207.5,94.3 208.0,94.4 208.5,94.5 208.9,94.7 209.4,94.8 209.9,94.9 210.4,95.0 210.8,95.1 211.3,95.2 211.8,95.4 212.2,95.5 212.7,95.6 213.2,95.7 213.7,95.8 214.1,95.9 214.6,96.1 215.1,96.2 215.5,96.3 216.0,96.4 216.5,96.5 217.0,96.6 217.4,96.8 217.9,96.9 218.4,97.0 218.9,97.1 219.3,97.2 219.8,97.4 220.3,97.5 220.7,97.6 221.2,97.7 221.7,97.8 222.2,98.0 222.6,98.1 223.1,98.2 223.6,98.3 224.1,98.4 224.5,98.6 225.0,98.7 225.5,98.8 225.9,98.9 226.4,99.0 226.9,99.2 227.4,99.3 227.8,99.4 228.3,99.5 228.8,99.6 229.2,99.8 229.7,99.9 230.2,100.0 230.7,100.1 231.1,100.3 231.6,100.4 232.1,100.5 232.6,100.6 233.0,100.7 233.5,100.9 234.0,101.0 234.4,101.1 234.9,101.2 235.4,101.4 235.9,101.5 236.3,101.6 236.8,101.7 237.3,101.9 237.8,102.0 238.2,102.1 238.7,102.2 239.2,102.3 239.6,102.5 240.1,102.6 240.6,102.7 241.1,102.8 241.5,103.0 242.0,103.1 242.5,103.2 242.9,103.3 243.4,103.5 243.9,103.6 244.4,103.7 244.8,103.8 245.3,104.0 245.8,104.1 246.3,104.2 246.7,104.3 247.2,104.5 247.7,104.6 248.1,104.7 248.6,104.9 249.1,105.0 249.6,105.1 250.0,105.2 250.5,105.4 251.0,105.5 251.5,105.6 251.9,105.7 252.4,105.9 252.9,106.0 253.3,106.1 253.8,106.3 254.3,106.4 254.8,106.5 255.2,106.6 255.7,106.8 256.2,106.9 256.7,107.0 257.1,107.2 257.6,107.3 258.1,107.4 258.5,107.5 259.0,107.7 259.5,107.8 260.0,107.9 260.4,108.1 260.9,108.2 261.4,108.3 261.8,108.4 262.3,108.6 262.8,108.7 263.3,108.8 263.7,109.0 264.2,109.1 264.7,109.2 265.2,109.4 265.6,109.5 266.1,109.6 266.6,109.8 267.0,109.9 267.5,110.0 268.0,110.1 268.5,110.3 268.9,110.4 269.4,110.5 269.9,110.7 270.4,110.8 270.8,110.9 271.3,111.1 271.8,111.2 272.2,111.3 272.7,111.5 273.2,111.6 273.7,111.7 274.1,111.9 274.6,112.0 275.1,112.1 275.5,112.3 276.0,112.4 276.5,112.5 277.0,112.7 277.4,112.8 277.9,112.9 278.4,113.1 278.9,113.2 279.3,113.3 279.8,113.5 280.3,113.6 280.7,113.7 281.2,113.9 281.7,114.0 282.2,114.1 282.6,114.3 283.1,114.4 283.6,114.5 284.1,114.7 284.5,114.8 285.0,114.9 285.5,115.1 285.9,115.2 286.4,115.4 286.9,115.5 287.4,115.6 287.8,115.8 288.3,115.9 288.8,116.0 289.3,116.2 289.7,116.3 290.2,116.4 290.7,116.6 291.1,116.7 291.6,116.9 292.1,117.0 292.6,117.1 293.0,117.3 293.5,117.4 294.0,117.5 294.4,117.7 294.9,117.8 295.4,118.0 295.9,118.1 296.3,118.2 296.8,118.4 297.3,118.5 297.8,118.6 298.2,118.8 298.7,118.9 299.2,119.1 299.6,119.2 300.1,119.3 300.6,119.5 301.1,119.6 301.5,119.7 302.0,119.9 302.5,120.0 303.0,120.2 303.4,120.3 303.9,120.4 304.4,120.6 304.8,120.7 305.3,120.9 305.8,121.0 306.3,121.1 306.7,121.3 307.2,121.4 307.7,121.6 308.1,121.7 308.6,121.8 309.1,122.0 309.6,122.1 310.0,122.3 310.5,122.4 311.0,122.5 311.5,122.7 311.9,122.8 312.4,123.0 312.9,123.1 313.3,123.3 313.8,123.4 314.3,123.5 314.8,123.7 315.2,123.8 315.7,124.0 316.2,124.1 316.7,124.2 317.1,124.4 317.6,124.5 318.1,124.7 318.5,124.8 319.0,125.0 319.5,125.1 320.0,125.2 320.4,125.4 320.9,125.5 321.4,125.7 321.8,125.8 322.3,126.0 322.8,126.1 323.3,126.2 323.7,126.4 324.2,126.5 324.7,126.7 325.2,126.8 325.6,127.0 326.1,127.1 326.6,127.2 327.0,127.4 327.5,127.5 328.0,127.7 328.5,127.8 328.9,128.0 329.4,128.1 329.9,128.2 330.4,128.4 330.8,128.5 331.3,128.7 331.8,128.8 332.2,129.0 332.7,129.1 333.2,129.3 333.7,129.4 334.1,129.5 334.6,129.7 335.1,129.8 335.6,130.0 336.0,130.1 336.5,130.3 337.0,130.4 337.4,130.6 337.9,130.7 338.4,130.9 338.9,131.0 339.3,131.1 339.8,131.3 340.3,131.4 340.7,131.6 341.2,131.7 341.7,131.9 342.2,132.0 342.6,132.2 343.1,132.3 343.6,132.5 344.1,132.6 344.5,132.8 345.0,132.9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="87.8" y="52.3" font-size="12" fill="#1d6fd1">σ max</text>
  <text x="129.2" y="92.6" font-size="12" fill="#b4232c">σ min</text>
  <text x="228.7" y="34" font-size="11" fill="#6c7a93">nutation 0.417</text>
  <text x="203.5" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">frequency (rad/s)</text>
</svg>
```

The top curve spikes at nutation; the bottom one never notices it.
:::

::: context direction-preserving Keeping the direction when you run out of push
Suppose the controller asks for torque $(3, 1)$ but each actuator can give only $2$. Clipping each channel gives $(2, 1)$ — pointing $26.6^\circ$ from the axis instead of the requested $18.4^\circ$, a different direction. Scaling the whole vector down by $2/3$ gives $(2, 0.667)$, which points exactly the way the controller asked, only shorter. MIMO anti-windup schemes prefer the second: a weaker push in the right direction does less harm than a full push in the wrong one.
:::

::: context control-allocation Control allocation
**Control allocation** is the step that turns "I want this much pitch torque and this much roll torque" into "move gimbal 1 here and gimbal 2 there". Done well, the attitude controller never sees the individual actuators — it sees a clean, decoupled plant. You will meet it again wherever a vehicle has more effectors than axes, from a launch vehicle's engine cluster to a spacecraft's twelve thrusters.
:::
