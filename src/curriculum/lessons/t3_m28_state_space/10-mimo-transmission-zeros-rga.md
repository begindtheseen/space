---
id: l10-mimo-transmission-zeros-rga
title: MIMO systems, transmission zeros and the relative gain array
minutes: 22
covers:
  - MIMO systems, transmission zeros, and the relative gain array
---

The matrices in this module have been multi-input and multi-output since Lesson 1, but every design so far could have been done one channel at a time and would have come out much the same. This lesson is about the things that have no single-loop counterpart at all — the questions that only exist because $\mathbf{G}(s)$ is a matrix.

There are three. First, gain becomes directional: a MIMO plant does not have *a* gain at a frequency, it has a largest and a smallest depending on which combination of inputs you push, and the ratio between them decides how much control authority a manoeuvre actually costs. Second, zeros stop being roots of a numerator and become directions in which the plant blocks transmission — and a channel that is non-minimum phase on its own need not make the whole system non-minimum phase, which is the single most useful MIMO fact in vehicle design. Third, if you intend to close several single loops rather than one matrix loop, you have to decide which actuator chases which output, and the relative gain array is the tool that decides it and warns you when no pairing is any good.

## Directional gain

At a frequency $\omega$, $\mathbf{G}(j\omega)$ is a complex matrix, and Linear Algebra II's singular value decomposition says exactly what a matrix does to a vector: $\mathbf{G} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^*$, so the input direction $\mathbf{v}_1$ produces the largest output, of size $\bar{\sigma} = \sigma_1$, and the direction $\mathbf{v}_{\min}$ produces the smallest, $\underline{\sigma} = \sigma_{\min}$. The **condition number** $\gamma = \bar{\sigma}/\underline{\sigma}$ is how much harder the worst direction is than the best. For a square plant, $\gamma \gg 1$ means the plant is close to losing rank in some direction, and any command in that direction costs enormous actuator effort.

::: example Two nearly redundant pitch effectors
A transport aircraft at a cruise condition has an elevator and an all-moving stabilator, both of which produce pitching moment and a little lift. Per degree of deflection, take representative increments

$$\mathbf{G}(0) = \begin{pmatrix}\partial C_m/\partial\delta_e & \partial C_m/\partial\delta_s\\ \partial C_L/\partial\delta_e & \partial C_L/\partial\delta_s\end{pmatrix} = \begin{pmatrix}-0.0120 & -0.0280\\ 0.0035 & 0.0075\end{pmatrix}\ \mathrm{deg^{-1}}.$$

Its singular values are $\bar\sigma = 3.157\times10^{-2}$ and $\underline{\sigma} = 2.534\times10^{-4}$, so $\gamma = 124.6$. The strong input direction is $\mathbf{v}_1 = (0.396,\ 0.918)$ — both surfaces deflecting the same way, which is how you generate pitching moment. The weak direction is $\mathbf{v}_2 = (0.918,\ -0.396)$, the two surfaces opposing each other, which is how you change lift without changing moment, and the plant barely responds.

Put numbers on the consequence. Asking for $\Delta C_m = -0.01$ with $\Delta C_L = 0$ requires $\delta_e = -9.375^\circ$ and $\delta_s = +4.375^\circ$: two large opposing deflections, most of whose effects cancel. Asking for $\Delta C_m = -0.01$ with $\Delta C_L = +0.002$ — almost along the strong direction — requires only $\delta_e = -2.375^\circ$ and $\delta_s = +1.375^\circ$. Same moment, one quarter of the deflection, because the second request is in a direction the plant likes. A condition number is not an abstraction; it is a deflection budget.
:::

## Transmission zeros

A SISO zero is a root of the numerator, and its meaning is that the plant blocks a signal at that frequency. Take the meaning as the definition and it generalises.

Build the **Rosenbrock system matrix**

$$\mathbf{P}(\lambda) = \begin{pmatrix}\mathbf{A}-\lambda\mathbf{I} & \mathbf{B}\\ \mathbf{C} & \mathbf{D}\end{pmatrix},$$

an $(n+p)\times(n+m)$ matrix, and call $\lambda$ a **transmission zero** of $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$ when $\mathbf{P}(\lambda)$ drops below its normal rank — the rank it has for all but finitely many $\lambda$.

The blocking property follows in four lines. Suppose $\mathbf{P}(\lambda)$ loses rank, so there is a non-zero $(\mathbf{x}_0, \mathbf{u}_0)$ with $(\mathbf{A}-\lambda\mathbf{I})\mathbf{x}_0 + \mathbf{B}\mathbf{u}_0 = \mathbf{0}$ and $\mathbf{C}\mathbf{x}_0 + \mathbf{D}\mathbf{u}_0 = \mathbf{0}$. Start the plant at $\mathbf{x}(0) = \mathbf{x}_0$ and apply $\mathbf{u}(t) = \mathbf{u}_0e^{\lambda t}$. Then $\mathbf{x}(t) = \mathbf{x}_0e^{\lambda t}$ satisfies the state equation, because $\dot{\mathbf{x}} = \lambda\mathbf{x}_0e^{\lambda t} = (\mathbf{A}\mathbf{x}_0 + \mathbf{B}\mathbf{u}_0)e^{\lambda t}$, and the output is

$$\mathbf{y}(t) = (\mathbf{C}\mathbf{x}_0 + \mathbf{D}\mathbf{u}_0)e^{\lambda t} = \mathbf{0}.$$

A non-zero input of the form $\mathbf{u}_0e^{\lambda t}$, pushed in the direction $\mathbf{u}_0$, produces no output at all. That direction is the **zero direction**, and it is information the SISO picture does not carry.

For a square plant with $\mathbf{D} = \mathbf{0}$ the Schur complement gives $\det\mathbf{P}(s) = (-1)^n\det(s\mathbf{I}-\mathbf{A})\,\det\mathbf{G}(s)$, so the transmission zeros are exactly the roots of the numerator of $\det\mathbf{G}(s)$ after the pole polynomial cancels. In the SISO case $\det\mathbf{G} = G$ and the definition reduces to the familiar one. Numerically, evaluate $\det\mathbf{P}(\lambda)$ at $n+1$ points, fit the polynomial, and take its roots.

Two facts follow that matter in practice. Poles are eigenvalues of $\mathbf{A}$; zeros are rank drops of a bigger matrix, and are **not** eigenvalues of anything you have already computed. And zeros in the right half plane are structural: no feedback moves them, because feedback $\mathbf{u} = -\mathbf{K}\mathbf{x} + \mathbf{v}$ replaces $\mathbf{A}$ by $\mathbf{A}-\mathbf{B}\mathbf{K}$ and leaves $\mathbf{P}(\lambda)$'s rank unchanged, as a column operation on the block matrix shows. A right-half-plane zero at $z$ caps the achievable bandwidth at roughly $z/2$, whatever controller you build.

::: example The launch vehicle that goes the wrong way first
Model a launch vehicle in the pitch plane, rigid and without aerodynamics, with a gimballed engine. Let $\theta$ be pitch attitude, $y$ lateral position, $\delta$ nozzle deflection, $T$ thrust, $m$ mass, $J$ pitch inertia and $\ell$ the distance from the gimbal to the centre of mass. Deflecting the nozzle tilts the thrust, which both pushes the vehicle sideways and rotates it:

$$J\ddot{\theta} = -T\ell\,\delta, \qquad m\ddot{y} = T(\theta + \delta).$$

Eliminating $\theta$ gives the transfer function from nozzle to drift,

$$\frac{Y(s)}{\Delta(s)} = \frac{T}{m}\frac{1}{s^2}\left(1 - \frac{T\ell}{Js^2}\right) = \frac{T}{m}\cdot\frac{s^2 - T\ell/J}{s^4},$$

with zeros at $s = \pm\sqrt{T\ell/J}$. One of them is in the right half plane.

With liftoff numbers for a large two-stage vehicle — $T = 7.6\,\mathrm{MN}$, $m = 5.5\times10^5\,\mathrm{kg}$, $\ell = 25\,\mathrm{m}$, $J = 2.2\times10^8\,\mathrm{kg\,m^2}$ — the zero is at

$$z = \sqrt{\frac{(7.6\times10^6)(25)}{2.2\times10^8}} = 0.929\,\mathrm{rad/s} = 0.148\,\mathrm{Hz}.$$

Physically this is the tail-wags-dog effect. To drift right, the controller deflects the nozzle; the immediate consequence is a sideways force at the base pushing the vehicle *left*, and only after the vehicle has rotated does the thrust vector carry it right. Initial response opposite to the eventual response is the signature of a right-half-plane zero.

The consequence for design is the rule of thumb $\omega_c \lesssim z/2 = 0.465\,\mathrm{rad/s}$ for any loop that closes drift around nozzle deflection. Push the bandwidth past that and the loop fights the wrong-way response, the sensitivity function develops a large peak, and the vehicle becomes less robust the harder you try — which is why drift is controlled slowly, through attitude, and not directly.
:::

## MIMO zeros are not the union of the channels' zeros

Here is the fact worth carrying out of this lesson. Add a reaction control system to the same vehicle, giving a second input $M$: a pure moment with no lateral force. Then

$$J\ddot{\theta} = -T\ell\,\delta + M, \qquad m\ddot{y} = T(\theta+\delta),$$

with states $\mathbf{x} = (\theta,\dot\theta,y,\dot y)$, inputs $(\delta, M)$ and outputs $(\theta, y)$:

$$\mathbf{A} = \begin{pmatrix}0&1&0&0\\0&0&0&0\\0&0&0&1\\ T/m&0&0&0\end{pmatrix},\ \ \mathbf{B} = \begin{pmatrix}0&0\\ -T\ell/J & 1/J\\ 0&0\\ T/m&0\end{pmatrix},\ \ \mathbf{C} = \begin{pmatrix}1&0&0&0\\0&0&1&0\end{pmatrix}.$$

::: example The extra actuator buys back the direction
Compute $\det\mathbf{P}(\lambda)$ for the $2\times2$ system by evaluating the $6\times6$ determinant at several $\lambda$ and fitting. Every coefficient of the fitted polynomial vanishes except the constant, which comes out at $-6.281\times10^{-8}$, independent of $\lambda$. By hand it is $-T/(mJ)$, and $-7.6\times10^6/(5.5\times10^5\times2.2\times10^8) = -6.281\times10^{-8}$ confirms it.

A constant determinant has no roots, so the $2\times2$ system has **no finite transmission zeros at all**. Yet the single channel from $\delta$ to $y$, computed the same way, returns zeros at $\pm0.929$ — the right-half-plane zero of the previous example, still there.

What happened algebraically is that $\det\mathbf{G} = G_{11}G_{22} - G_{12}G_{21}$, and the right-half-plane factor in $G_{21}$ cancelled exactly against the product of the other two. What happened physically is that the RCS can supply the pitching moment, so the controller no longer has to buy its moment by deflecting the nozzle and paying for it with a wrong-way lateral force. The blocking direction that existed with one actuator has nothing to block with two.

The lesson is general and it cuts both ways. A vehicle whose channels each look non-minimum phase may be perfectly well behaved as a MIMO plant, and a vehicle whose channels each look fine may have a right-half-plane transmission zero that no pairing of single loops will reveal. Compute the zeros of the system, not of the channels.
:::

## The relative gain array

Suppose you decide to close $p$ single loops rather than one matrix loop — which is still the common choice on a real vehicle, because single loops are easier to schedule, to certify and to fail safely. Which input should chase which output?

::: key Relative gain array
For a square $\mathbf{G}$, $\boldsymbol{\Lambda}(\mathbf{G}) = \mathbf{G}\circ\left(\mathbf{G}^{-1}\right)^\mathsf{T}$, an elementwise (Hadamard) product. Entry $\lambda_{ij}$ is the gain from $u_j$ to $y_i$ with every other loop **open**, divided by the same gain with every other loop **perfectly closed**.
:::

The interpretation is what makes it useful. Open loop, the gain from $u_j$ to $y_i$ is $g_{ij}$. With every other output held at zero by perfect control, the gain becomes $1/\left[(\mathbf{G}^{-1})_{ji}\right]$, so the ratio is $g_{ij}(\mathbf{G}^{-1})_{ji}$, which is the $(i,j)$ entry of $\mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}$. Three properties follow:

- **Every row and every column sums to one**, so the entries cannot all be small or all be large.
- **It is invariant under scaling** of inputs or outputs, because a diagonal $\mathbf{D}_1\mathbf{G}\mathbf{D}_2$ leaves $\boldsymbol{\Lambda}$ unchanged. That makes it one of the few diagnostics you can quote without first agreeing on units.
- It depends on frequency, and should be evaluated near the intended crossover as well as at DC.

The pairing rules follow from the interpretation. Pair on entries close to $1$: closing the other loops then barely changes your loop. Never pair on a **negative** entry: a negative $\lambda_{ij}$ means the gain of that loop *changes sign* when the other loops are closed, so a controller that stabilises it with the others open destabilises it with them closed — and the failure appears exactly when another loop trips off. And treat large entries, above about $5$, as a warning that the plant is ill-conditioned and strongly interacting, so that decentralised control will be fragile whatever you pair.

::: example Two effectors you should not pair
Take the elevator-and-stabilator matrix from earlier. Its inverse is

$$\mathbf{G}(0)^{-1} = \frac{1}{8\times10^{-6}}\begin{pmatrix}0.0075 & 0.0280\\ -0.0035 & -0.0120\end{pmatrix} = \begin{pmatrix}937.5 & 3500\\ -437.5 & -1500\end{pmatrix},$$

so the relative gain array is

$$\boldsymbol{\Lambda} = \begin{pmatrix}-0.012 & -0.028\\ 0.0035 & 0.0075\end{pmatrix}\circ\begin{pmatrix}937.5 & -437.5\\ 3500 & -1500\end{pmatrix} = \begin{pmatrix}-11.25 & 12.25\\ 12.25 & -11.25\end{pmatrix}.$$

Rows and columns sum to one, as they must. Every entry is enormous, and the diagonal entries are negative. Pairing the elevator with pitching moment and the stabilator with lift is the worst available choice: the moment loop's gain reverses sign the moment the lift loop closes. Pairing the other way round gives $+12.25$, which at least has the right sign but says that closing one loop changes the other's gain by more than an order of magnitude.

The honest conclusion is that neither pairing works and the problem is the hardware geometry, not the control structure. The two effectors are nearly collinear in $(C_m, C_L)$ space — which is what $\gamma = 125$ measured — so either use a matrix controller that commands the strong and weak directions explicitly, or accept that the weak direction is unavailable and control moment alone with both surfaces ganged.

For contrast, take a two-axis gimbal whose drive axes are misaligned from the sensing axes by an angle $\alpha$, so $\mathbf{G}(0)$ is a rotation. Its RGA is $\begin{pmatrix}\cos^2\alpha & \sin^2\alpha\\ \sin^2\alpha & \cos^2\alpha\end{pmatrix}$. At $\alpha = 10^\circ$ that is $\begin{pmatrix}0.970 & 0.030\\ 0.030 & 0.970\end{pmatrix}$: pair on the diagonal, expect three percent of interaction, proceed. At $\alpha = 45^\circ$ every entry is $0.5$ and the two pairings are exactly equally bad, which is the RGA's way of saying the axes carry no information about which motor belongs to which encoder.
:::

```python
import numpy as np

def transmission_zeros(A, B, C, D):
    n = A.shape[0]
    pts = np.exp(2j * np.pi * np.arange(n + 1) / (n + 1))          # on the unit circle
    vals = np.array([np.linalg.det(np.block([[A - p * np.eye(n), B], [C, D]])) for p in pts])
    coef = np.polyfit(pts, vals, n)
    coef[np.abs(coef) < 1e-9 * max(np.abs(coef).max(), 1e-30)] = 0
    nz = np.nonzero(coef)[0]
    return np.array([]) if len(nz) == 0 or nz[0] == n else np.roots(coef[nz[0]:])

T, m, ell, J = 7.6e6, 5.5e5, 25.0, 2.2e8
A = np.array([[0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1], [T / m, 0, 0, 0.0]])
B = np.array([[0, 0], [-T * ell / J, 1 / J], [0, 0], [T / m, 0.0]])
C = np.array([[1.0, 0, 0, 0], [0, 0, 1, 0]])
print("TVC only, drift channel:", np.round(transmission_zeros(A, B[:, [0]], C[[1]], np.zeros((1, 1))), 4))
print("TVC + RCS, 2x2 system :", transmission_zeros(A, B, C, np.zeros((2, 2))))

G = np.array([[-0.0120, -0.0280], [0.0035, 0.0075]])
print("singular values:", np.linalg.svd(G, compute_uv=False))
print("RGA:\n", np.round(G * np.linalg.inv(G).T, 4))
# TVC only, drift channel: [ 0.9293+0.j -0.9293-0.j]
# TVC + RCS, 2x2 system : []
# singular values: [0.03156637 0.00025343]
# RGA:
#  [[-11.25  12.25]
#  [ 12.25 -11.25]]
```

::: warning The RGA is a screening tool, not a verdict
It is computed from a steady-state or single-frequency matrix and says nothing about dynamics, so two channels with identical RGA entries and wildly different bandwidths will behave differently. It is defined for square plants, and needs a pseudoinverse and careful interpretation when there are more actuators than outputs — a redundant set like four wheels for three axes is a control-allocation problem, not a pairing problem. And a good RGA does not imply a good design: a plant can pair cleanly and still have a right-half-plane transmission zero that limits every loop on it. Use it to eliminate pairings, then verify what survives with the full MIMO analysis.
:::

## Check yourself

::: check
A $2\times2$ plant has $\bar\sigma = 10$ and $\underline{\sigma} = 0.02$ at the intended crossover. What does that tell you, and what would you look at next?
:::

::: answer
The condition number is $500$, so a command in the worst input direction produces $500$ times less output than one of the same size in the best direction. Any manoeuvre with a large component along the weak direction will need enormous actuator effort and will be dominated by whatever model error exists in that direction. Next: compute the right singular vector $\mathbf{v}_{\min}$ and read it physically — which combination of actuators is being asked for — and the left singular vector $\mathbf{u}_{\min}$, which says which combination of outputs is hard to produce. Then ask whether the mission actually needs that direction. Often it does not, and the plant is fine; when it does, the answer is usually different hardware geometry rather than a cleverer controller.
:::

::: check
Show that state feedback $\mathbf{u} = -\mathbf{K}\mathbf{x} + \mathbf{v}$ does not move the transmission zeros.
:::

::: answer
Under the feedback the plant becomes $(\mathbf{A}-\mathbf{B}\mathbf{K},\ \mathbf{B},\ \mathbf{C}-\mathbf{D}\mathbf{K},\ \mathbf{D})$, so its system matrix is

$$\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K}-\lambda\mathbf{I} & \mathbf{B}\\ \mathbf{C}-\mathbf{D}\mathbf{K}&\mathbf{D}\end{pmatrix} = \begin{pmatrix}\mathbf{A}-\lambda\mathbf{I}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}\begin{pmatrix}\mathbf{I}&\mathbf{0}\\-\mathbf{K}&\mathbf{I}\end{pmatrix}.$$

The right factor is invertible for every $\mathbf{K}$, so the rank of the product equals the rank of $\mathbf{P}(\lambda)$ at every $\lambda$, and the set of transmission zeros is unchanged. That is why a right-half-plane zero is a property of the vehicle, its actuators and its sensors, and cannot be designed away — only the poles move.
:::

::: check
A pairing analysis returns $\boldsymbol{\Lambda} = \begin{pmatrix}0.6&0.4\\0.4&0.6\end{pmatrix}$. What do you conclude, and how does it compare with $\begin{pmatrix}2.5&-1.5\\-1.5&2.5\end{pmatrix}$?
:::

::: answer
The first says the diagonal pairing is preferable but the interaction is substantial: closing the second loop changes the first loop's effective gain by a factor of $1/0.6 = 1.67$. That is workable with detuning, or with a sequential design in which the faster loop is closed first. The second is worse in two ways: the diagonal entries of $2.5$ mean closing the other loop reduces your loop's gain to $40\,\%$ of its open-loop value, and the off-diagonal entries are negative, so the off-diagonal pairing would suffer a sign reversal. The diagonal pairing is the only candidate, and it needs verification with both loops closed, both loops open, and one loop failed. Note that neither array distinguishes a fast plant from a slow one — both need a dynamic check near crossover.
:::

::: check
A vehicle has a right-half-plane transmission zero at $z = 0.5\,\mathrm{rad/s}$ and a requirement for a $0.4\,\mathrm{rad/s}$ closed-loop bandwidth. What are the options?
:::

::: answer
The requirement is not achievable with that plant: the rule of thumb $\omega_c \lesssim z/2 = 0.25\,\mathrm{rad/s}$ comes from the fact that the sensitivity function must satisfy an interpolation constraint at the zero, and pushing crossover past it produces a large sensitivity peak — the loop overreacts to the wrong-way initial response. No controller removes the zero, since state feedback leaves it where it is. The options are all physical: move the zero by changing geometry (in the launch-vehicle case, moving the gimbal or the centre of mass changes $\ell$, and $z = \sqrt{T\ell/J}$ with it); add an actuator whose input direction removes the blocking direction, as the reaction control system did in the worked example; measure something else, since the zero depends on $\mathbf{C}$ as well; or renegotiate the requirement.
:::

::: check
For the launch vehicle with only the nozzle, the $\delta\to\theta$ channel had two transmission zeros at the origin and the $\delta\to y$ channel had zeros at $\pm0.929$. Why is neither list the zero list of the one-input, two-output plant?
:::

::: answer
Because a transmission zero of the full system must block transmission to **every** output at once, not one of them alone. For the one-input two-output plant, $\mathbf{P}(\lambda)$ is $6\times5$ and its normal rank is $5$; a rank drop requires a $\lambda$ at which both output rows are annihilated by the same $(\mathbf{x}_0,u_0)$. The origin blocks $\theta$ but not $y$, and $+0.929$ blocks $y$ but not $\theta$, so neither is a transmission zero of the pair. This is the same phenomenon as the $2\times2$ example, seen from the output side: adding outputs can only remove zeros, in the same way adding inputs can. The zero list belongs to the whole $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$, and changing any of the four changes it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Directional gain | $\bar\sigma(\mathbf{G}(j\omega))$ and $\underline{\sigma}(\mathbf{G}(j\omega))$ from the SVD; $\gamma = \bar\sigma/\underline{\sigma}$ |
| Aircraft example | $\bar\sigma = 3.157\times10^{-2}$, $\underline\sigma = 2.534\times10^{-4}$, $\gamma = 125$: the weak direction costs four times the deflection |
| Transmission zero | $\lambda$ where $\mathbf{P}(\lambda) = \begin{pmatrix}\mathbf{A}-\lambda\mathbf{I}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}$ drops rank |
| Blocking property | $\mathbf{x}(0) = \mathbf{x}_0$, $\mathbf{u} = \mathbf{u}_0e^{\lambda t}$ gives $\mathbf{y}\equiv\mathbf{0}$ |
| Square, $\mathbf{D} = \mathbf{0}$ | $\det\mathbf{P}(s) = (-1)^n\det(s\mathbf{I}-\mathbf{A})\det\mathbf{G}(s)$: zeros are the numerator of $\det\mathbf{G}$ |
| Invariance | state feedback moves poles and never moves zeros |
| RHP zero limit | $\omega_c \lesssim z/2$; launch vehicle $z = \sqrt{T\ell/J} = 0.929\,\mathrm{rad/s}$ |
| MIMO zeros | not the union of the channels' zeros; adding the RCS removed the RHP zero entirely |
| RGA | $\boldsymbol{\Lambda} = \mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}$; rows and columns sum to $1$; scaling invariant |
| Pairing rules | pair near $1$; never pair on a negative entry; entries above $\approx5$ mean strong interaction |
| Worked RGA | $\begin{pmatrix}-11.25&12.25\\12.25&-11.25\end{pmatrix}$: no acceptable decentralised pairing exists |

Large MIMO models are also expensive to run and hard to certify, and most of their states contribute almost nothing to what the sensors see. The last lesson makes that statement precise, with an invariant you have already met: the Hankel singular values that survived every similarity transform in Lesson 2.
