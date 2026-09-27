---
id: l10-mimo-transmission-zeros-rga
title: MIMO systems, transmission zeros and the relative gain array
minutes: 26
covers:
  - MIMO systems, transmission zeros, and the relative gain array
---

Picture a shower with two taps, one hot and one cold. You want two things: the right temperature and the right flow. Turn up the hot tap and *both* change — the water gets warmer and there is more of it. There is no tap for "temperature" and no tap for "flow". Every move touches both.

That is a **MIMO** system — multi-input, multi-output. The matrices in this module have been MIMO since Lesson 1. But every design so far could have been done one channel at a time and would have come out much the same. This lesson is about the questions that only exist because $\mathbf{G}(s)$ — the transfer function, "G of s" — is a matrix and not a single number.

There are three of them.

- **Gain has a direction.** A MIMO plant does not have *a* gain at a given frequency. It has a largest and a smallest, depending on which combination of inputs you push. The ratio between them decides how much actuator effort a maneuver really costs.
- **Zeros become directions.** A zero stops being a root of a numerator. It becomes a direction in which the plant blocks the signal — and a channel that misbehaves alone need not make the whole system misbehave.
- **Pairing.** To close several single loops instead of one matrix loop, you must decide which actuator chases which output. The relative gain array decides — and warns you when no pairing is any good.

## Directional gain

Two tugboats push a ship from nearly the same side. Pushing it that way is easy. Pushing it sideways means they shove *against each other*, and most of their effort cancels. Easy in one direction, very hard in another: that is directional gain.

The precise tool is the **[[singular value decomposition|svd-ellipse]]** (SVD) from Linear Algebra II. At a frequency $\omega$ ("omega"), $\mathbf{G}(j\omega)$ is a complex matrix, and the SVD writes it as

$$\mathbf{G} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^*.$$

Here $\mathbf{V}^*$ is the conjugate transpose of $\mathbf{V}$ (read "V star"). The columns of $\mathbf{V}$ are input directions and the columns of $\mathbf{U}$ are output directions. $\boldsymbol{\Sigma}$ ("capital sigma") is diagonal and holds the **singular values** — the gains along those directions, largest first.

- The input direction $\mathbf{v}_1$ produces the biggest output. Its size is $\bar{\sigma} = \sigma_1$, read "sigma bar", the **largest singular value**.
- The input direction $\mathbf{v}_{\min}$ produces the smallest. Its size is $\underline{\sigma} = \sigma_{\min}$, read "sigma under-bar", the **smallest singular value**.

The **condition number** — how much harder the worst direction is than the best — is

$$\gamma = \bar{\sigma}/\underline{\sigma},$$

read "gamma". For a square plant, $\gamma \gg 1$ means the plant is close to losing rank in some direction. Any command in that direction costs enormous actuator effort.

::: example Two nearly redundant pitch effectors
A transport aircraft at a cruise condition has an **elevator** and an all-moving **[[stabilator|stabilator-word]]**. Both make pitching moment and a little lift. Take representative increments per degree of deflection, with inputs $(\delta_e, \delta_s)$ (elevator and stabilator angles) and outputs $(C_m, C_L)$ (pitching-moment and lift coefficients):

$$\mathbf{G}(0) = \begin{pmatrix}\partial C_m/\partial\delta_e & \partial C_m/\partial\delta_s\\ \partial C_L/\partial\delta_e & \partial C_L/\partial\delta_s\end{pmatrix} = \begin{pmatrix}-0.0120 & -0.0280\\ 0.0035 & 0.0075\end{pmatrix}\ \mathrm{deg^{-1}}.$$

**Step 1 — the singular values.** Running the SVD gives $\bar\sigma = 3.157\times10^{-2}$ and $\underline{\sigma} = 2.534\times10^{-4}$. So

$$\gamma = \frac{3.157\times10^{-2}}{2.534\times10^{-4}} = 124.6.$$

**Step 2 — read the directions.** The strong input direction is $\mathbf{v}_1 = (0.396,\ 0.918)$: both surfaces deflect the same way. That is how you make pitching moment. The weak direction is $\mathbf{v}_2 = (0.918,\ -0.396)$: the two surfaces oppose each other. That is how you would change lift without changing moment — and the plant barely responds.

**Step 3 — put numbers on it.** To get the deflections for a request, multiply the request by $\mathbf{G}(0)^{-1}$ (worked out in the RGA example below).

- Ask for $\Delta C_m = -0.01$ with $\Delta C_L = 0$. That needs $\delta_e = -9.375^\circ$ and $\delta_s = +4.375^\circ$: two large opposing deflections whose effects mostly cancel.
- Ask for $\Delta C_m = -0.01$ with $\Delta C_L = +0.002$. This request lies within about $4^\circ$ of the strong output direction. It needs only $\delta_e = -2.375^\circ$ and $\delta_s = +1.375^\circ$.

**Sanity check.** The total deflection is $\sqrt{9.375^2 + 4.375^2} = 10.3^\circ$ for the first request and $\sqrt{2.375^2 + 1.375^2} = 2.74^\circ$ for the second. Same moment, about a quarter of the deflection, because the second request points where the plant likes to go. A condition number is not an abstraction. It is a deflection budget.
:::

## Transmission zeros

In a single-loop (**SISO**, single-input single-output) plant, a zero is a root of the numerator. What it *means* is that the plant blocks a signal. Think of walking up a down escalator at exactly its speed: your legs are moving, but you stay in the same place. Some input goes in and nothing comes out.

Take that meaning as the definition, and it carries over to matrices.

Build the **[[Rosenbrock system matrix|rosenbrock-name]]**

$$\mathbf{P}(\lambda) = \begin{pmatrix}\mathbf{A}-\lambda\mathbf{I} & \mathbf{B}\\ \mathbf{C} & \mathbf{D}\end{pmatrix},$$

an $(n+p)\times(n+m)$ matrix for $n$ states, $m$ inputs and $p$ outputs. Call $\lambda$ ("lambda") a **transmission zero** of $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$ when $\mathbf{P}(\lambda)$ drops below its **normal rank** — the rank it has for all but a handful of values of $\lambda$.

One honest fine print. For a **minimal** realization (every state controllable and observable), these rank drops are exactly the zeros of the transfer function. For a non-minimal one, $\mathbf{P}(\lambda)$ also drops rank at modes the input cannot reach or the output cannot see. Those extra roots are called **decoupling zeros**. The full list is sometimes called the *invariant* zeros.

### Why a rank drop blocks the signal

Suppose $\mathbf{P}(\lambda)$ loses rank. Then some non-zero pair $(\mathbf{x}_0, \mathbf{u}_0)$ is sent to zero:

$$(\mathbf{A}-\lambda\mathbf{I})\mathbf{x}_0 + \mathbf{B}\mathbf{u}_0 = \mathbf{0}, \qquad \mathbf{C}\mathbf{x}_0 + \mathbf{D}\mathbf{u}_0 = \mathbf{0}.$$

Start the plant at $\mathbf{x}(0) = \mathbf{x}_0$ and apply $\mathbf{u}(t) = \mathbf{u}_0e^{\lambda t}$. Try the guess $\mathbf{x}(t) = \mathbf{x}_0e^{\lambda t}$. Its derivative is $\lambda\mathbf{x}_0e^{\lambda t}$. The first equation says $\lambda\mathbf{x}_0 = \mathbf{A}\mathbf{x}_0 + \mathbf{B}\mathbf{u}_0$, so

$$\dot{\mathbf{x}} = (\mathbf{A}\mathbf{x}_0 + \mathbf{B}\mathbf{u}_0)e^{\lambda t} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}.$$

The guess satisfies the state equation. Now the output, using the second equation:

$$\mathbf{y}(t) = (\mathbf{C}\mathbf{x}_0 + \mathbf{D}\mathbf{u}_0)e^{\lambda t} = \mathbf{0}.$$

A non-zero input $\mathbf{u}_0e^{\lambda t}$, pushed in the direction $\mathbf{u}_0$, produces no output at all. That direction is the **zero direction**. The SISO picture has no such thing.

### Finding them

For a square plant ($m = p$), there is a shortcut through the determinant.

$$\det\mathbf{P}(s) = (-1)^n\det(s\mathbf{I}-\mathbf{A})\,\det\mathbf{G}(s).$$

So the transmission zeros of a minimal square plant are the roots of the numerator of $\det\mathbf{G}(s)$, once the pole polynomial cancels. In the SISO case $\det\mathbf{G} = G$, and the definition reduces to the familiar one. Numerically, evaluate $\det\mathbf{P}(\lambda)$ at $n+1$ points, fit a polynomial through them, and take its roots.

::: note Why the determinant formula has to be true
Use the **[[Schur complement|schur-complement]]**. For a block matrix whose top-left block $\mathbf{M}$ is invertible,

$$\det\begin{pmatrix}\mathbf{M}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix} = \det\mathbf{M}\,\det\!\left(\mathbf{D} - \mathbf{C}\mathbf{M}^{-1}\mathbf{B}\right).$$

Put $\mathbf{M} = \mathbf{A} - s\mathbf{I}$. Then $-\mathbf{M}^{-1} = (s\mathbf{I}-\mathbf{A})^{-1}$, so the second factor is $\det\!\left(\mathbf{D} + \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}\right) = \det\mathbf{G}(s)$. And $\det(\mathbf{A}-s\mathbf{I}) = (-1)^n\det(s\mathbf{I}-\mathbf{A})$, because flipping the sign of an $n\times n$ matrix multiplies its determinant by $(-1)^n$.
:::

Two facts follow that matter in practice.

**Zeros are not eigenvalues.** Poles are eigenvalues of $\mathbf{A}$. Zeros are rank drops of a bigger matrix. They are *not* eigenvalues of anything you have already computed.

**Feedback cannot move a zero.** State feedback $\mathbf{u} = -\mathbf{K}\mathbf{x} + \mathbf{v}$ replaces $\mathbf{A}$ by $\mathbf{A}-\mathbf{B}\mathbf{K}$, and a column operation on $\mathbf{P}(\lambda)$ shows its rank is unchanged (Check yourself works it out). So zeros in the right half plane are structural. A right-half-plane zero at $z$ caps the achievable bandwidth at roughly **[[z/2|zero-bandwidth-limit]]**, whatever controller you build.

::: example The launch vehicle that goes the wrong way first
Model a launch vehicle in the pitch plane: rigid, no aerodynamics, one gimbaled engine. The symbols are:

- $\theta$ — pitch attitude; $y$ — sideways (lateral) position;
- $\delta$ — nozzle deflection; $T$ — thrust; $m$ — mass;
- $J$ — pitch inertia; $\ell$ ("ell") — distance from the gimbal to the center of mass.

Deflecting the nozzle tilts the thrust. That both pushes the vehicle sideways and rotates it:

$$J\ddot{\theta} = -T\ell\,\delta, \qquad m\ddot{y} = T(\theta + \delta).$$

**Step 1 — eliminate $\theta$.** In Laplace form, the first equation gives $\Theta = -\dfrac{T\ell}{Js^2}\Delta$. Put that into the second:

$$\frac{Y(s)}{\Delta(s)} = \frac{T}{m}\frac{1}{s^2}\left(1 - \frac{T\ell}{Js^2}\right) = \frac{T}{m}\cdot\frac{s^2 - T\ell/J}{s^4}.$$

**Step 2 — find the zeros.** The numerator vanishes at $s = \pm\sqrt{T\ell/J}$. One of them is in the right half plane. All four poles sit at the origin — see the [[pole-zero map|drift-pole-zero]].

**Step 3 — numbers.** Use liftoff values for a large two-stage vehicle: $T = 7.6\,\mathrm{MN}$, $m = 5.5\times10^5\,\mathrm{kg}$, $\ell = 25\,\mathrm{m}$, $J = 2.2\times10^8\,\mathrm{kg\,m^2}$.

$$z = \sqrt{\frac{(7.6\times10^6)(25)}{2.2\times10^8}} = \sqrt{0.864} = 0.929\,\mathrm{rad/s} = 0.148\,\mathrm{Hz}.$$

**What it means physically.** This is the **[[tail-wags-dog|wrong-way-response]]** effect. To drift right, the controller deflects the nozzle. The first thing that happens is a sideways force at the base, pushing the vehicle *left*. Only after the vehicle has rotated does the tilted thrust carry it right. An initial response opposite to the final one is the signature of a right-half-plane zero. You meet the same thing on a bicycle: to turn right, you first steer slightly left.

**Step 4 — the design limit.** The rule of thumb gives $\omega_c \lesssim z/2 = 0.465\,\mathrm{rad/s}$ for any loop that closes drift around nozzle deflection. Here $\omega_c$ is the crossover frequency, roughly the loop's bandwidth. Push past it and the loop fights the wrong-way response: the sensitivity peak grows, and robustness falls the harder you try. So drift is controlled slowly, through attitude.

**Sanity check.** $0.148\,\mathrm{Hz}$ is a period of about $7\,\mathrm{s}$ — slow, as a big rocket's rotation should be.
:::

## MIMO zeros are not the channels' zeros

Here is the fact worth carrying out of this lesson. Give the same vehicle a **[[reaction control system|rcs-word]]** (RCS) — small thrusters that add a second input $M$, a pure moment with no sideways force:

$$J\ddot{\theta} = -T\ell\,\delta + M, \qquad m\ddot{y} = T(\theta+\delta).$$

Take states $\mathbf{x} = (\theta,\dot\theta,y,\dot y)$, inputs $(\delta, M)$ and outputs $(\theta, y)$:

$$\mathbf{A} = \begin{pmatrix}0&1&0&0\\0&0&0&0\\0&0&0&1\\ T/m&0&0&0\end{pmatrix},\ \ \mathbf{B} = \begin{pmatrix}0&0\\ -T\ell/J & 1/J\\ 0&0\\ T/m&0\end{pmatrix},\ \ \mathbf{C} = \begin{pmatrix}1&0&0&0\\0&0&1&0\end{pmatrix}.$$

::: example The extra actuator buys back the direction
**Step 1 — compute $\det\mathbf{P}(\lambda)$.** For this $2\times2$ system, $\mathbf{P}$ is $6\times6$. Evaluate its determinant at several values of $\lambda$ and fit a polynomial. Every coefficient comes out zero except the constant, which is $-6.281\times10^{-8}$ whatever $\lambda$ is.

**Step 2 — check it by hand.** Expanding the determinant gives $-T/(mJ)$. And

$$-\frac{7.6\times10^6}{(5.5\times10^5)(2.2\times10^8)} = -6.281\times10^{-8},$$

which confirms it.

**Step 3 — read the result.** A constant determinant has no roots. So the $2\times2$ system has **no finite transmission zeros at all**. (The realization is minimal — its controllability and observability matrices both have rank 4 — so no decoupling zeros hide in that statement.) Yet the single channel from $\delta$ to $y$, computed the same way, still returns zeros at $\pm0.929$. The right-half-plane zero of the last example is still there in that channel.

**Why, in algebra.** $\det\mathbf{G} = G_{11}G_{22} - G_{12}G_{21}$. The right-half-plane factor in $G_{21}$ cancels exactly against the product of the other terms.

**Why, in physics.** The RCS can supply the pitching moment. The controller no longer has to buy its moment by deflecting the nozzle and paying with a wrong-way sideways force. The blocking direction that existed with one actuator has nothing left to block with two.
:::

The lesson is general, and it cuts both ways. A vehicle whose channels each look non-minimum phase may be perfectly well behaved as a MIMO plant. A vehicle whose channels each look fine may have a right-half-plane transmission zero that no pairing of single loops will reveal. Compute the zeros of the system, not of the channels.

## The relative gain array

Back to the shower. Run it with two hands: one on the hot tap watching temperature, one on the cold tap watching flow. Each hand is a single loop. Is that the right pairing, or the other way round?

On a real vehicle, closing $p$ separate single loops is still the common choice, because single loops are easier to schedule, to **[[certify|certify-word]]** and to fail safely.

::: key Relative gain array
For a square $\mathbf{G}$, $\boldsymbol{\Lambda}(\mathbf{G}) = \mathbf{G}\circ\left(\mathbf{G}^{-1}\right)^\mathsf{T}$, an elementwise (**[[Hadamard|hadamard-product]]**) product. Entry $\lambda_{ij}$ is the gain from $u_j$ to $y_i$ with every other loop **open**, divided by the same gain with every other loop **perfectly closed**.
:::

Read $\boldsymbol{\Lambda}$ as "capital lambda", the **[[relative gain array|rga-origin]]** (RGA). The circle $\circ$ means "multiply entry by entry" — not ordinary matrix multiplication.

### Where the formula comes from

Open loop, the gain from $u_j$ to $y_i$ is $g_{ij}$, the $(i,j)$ entry of $\mathbf{G}$.

Now suppose every *other* output is held at zero by perfect control. Then the only non-zero output is $y_i$, so $\mathbf{u} = \mathbf{G}^{-1}\mathbf{y}$ gives $u_j = (\mathbf{G}^{-1})_{ji}\,y_i$. Turned around, the gain from $u_j$ to $y_i$ is now $1/(\mathbf{G}^{-1})_{ji}$.

The ratio of the two gains is $g_{ij}(\mathbf{G}^{-1})_{ji}$. That is exactly the $(i,j)$ entry of $\mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}$.

### Three properties

- **Every row and every column sums to one.** So the entries cannot all be small or all be large.
- **It ignores scaling.** Rescaling inputs or outputs — replacing $\mathbf{G}$ by $\mathbf{D}_1\mathbf{G}\mathbf{D}_2$ with diagonal $\mathbf{D}_1, \mathbf{D}_2$ — leaves $\boldsymbol{\Lambda}$ unchanged. That makes it one of the few diagnostics you can quote without first agreeing on units.
- **It depends on frequency.** Evaluate it near the intended crossover as well as at DC (zero frequency).

### Pairing rules

- **Pair on entries close to $1$.** Closing the other loops then barely changes your loop.
- **Never pair on a negative entry.** A negative $\lambda_{ij}$ means the gain of that loop *changes sign* when the other loops close. A controller that stabilizes it with the others open destabilizes it with them closed — and the failure appears exactly when another loop trips off.
- **Treat entries above about $5$ as a warning.** The plant is ill-conditioned and strongly interacting, so decentralized control will be fragile whatever you pair.

::: example Two effectors you should not pair
Take the elevator-and-stabilator matrix from earlier.

**Step 1 — the inverse.** The determinant is $(-0.0120)(0.0075) - (-0.0280)(0.0035) = -9.0\times10^{-5} + 9.8\times10^{-5} = 8\times10^{-6}$. Swap the diagonal, flip the signs of the off-diagonal, divide by the determinant:

$$\mathbf{G}(0)^{-1} = \frac{1}{8\times10^{-6}}\begin{pmatrix}0.0075 & 0.0280\\ -0.0035 & -0.0120\end{pmatrix} = \begin{pmatrix}937.5 & 3500\\ -437.5 & -1500\end{pmatrix}.$$

**Step 2 — transpose and multiply entry by entry.**

$$\boldsymbol{\Lambda} = \begin{pmatrix}-0.012 & -0.028\\ 0.0035 & 0.0075\end{pmatrix}\circ\begin{pmatrix}937.5 & -437.5\\ 3500 & -1500\end{pmatrix} = \begin{pmatrix}-11.25 & 12.25\\ 12.25 & -11.25\end{pmatrix}.$$

**Sanity check.** Each row and column sums to one: $-11.25 + 12.25 = 1$. As it must.

**Step 3 — read it.** Every entry is enormous, and the diagonal ones are negative. Pairing the elevator with pitching moment and the stabilator with lift is the worst available choice: the moment loop's gain reverses sign the moment the lift loop closes. Pairing the other way gives $+12.25$. That at least has the right sign, but it says closing one loop changes the other's gain by more than a factor of ten.

**The honest conclusion.** Neither pairing works, and the problem is the hardware geometry, not the control structure. The two effectors point in nearly the same direction in $(C_m, C_L)$ space — which is what $\gamma = 125$ measured. Either use a matrix controller that commands the strong and weak directions explicitly, or accept that the weak direction is unavailable and control moment alone with both surfaces ganged together.

**For contrast.** Take a two-axis gimbal whose drive axes are twisted from its sensing axes by an angle $\alpha$ ("alpha"), so $\mathbf{G}(0)$ is a rotation matrix. Its RGA is $\begin{pmatrix}\cos^2\alpha & \sin^2\alpha\\ \sin^2\alpha & \cos^2\alpha\end{pmatrix}$. At $\alpha = 10^\circ$ that is $\begin{pmatrix}0.970 & 0.030\\ 0.030 & 0.970\end{pmatrix}$: pair on the diagonal, expect three percent interaction, proceed. At $\alpha = 45^\circ$ every entry is $0.5$, and the two pairings are exactly equally bad. That is the RGA's way of saying the axes carry no information about which motor belongs to which encoder.
:::

The code below reproduces all three calculations. It finds zeros by fitting $\det\mathbf{P}$, as described above, so it is meant for square systems.

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
It comes from a steady-state or single-frequency matrix and says nothing about dynamics. Two channels with identical RGA entries and wildly different bandwidths will behave differently. It is defined for square plants. With more actuators than outputs it needs a pseudoinverse and careful reading — a redundant set like four wheels for three axes is a **[[control-allocation|control-allocation]]** problem, not a pairing problem. And a good RGA does not mean a good design: a plant can pair cleanly and still have a right-half-plane transmission zero that limits every loop on it. Use the RGA to eliminate pairings, then check what survives with the full MIMO analysis.
:::

## Check yourself

::: check
A $2\times2$ plant has $\bar\sigma = 10$ and $\underline{\sigma} = 0.02$ at the intended crossover. What does that tell you, and what would you look at next?
:::

::: answer
The condition number is $\gamma = 10/0.02 = 500$. A command in the worst input direction produces $500$ times less output than one of the same size in the best direction. Any maneuver with a large component along the weak direction will need enormous actuator effort, and it will be dominated by whatever model error exists in that direction.

Next, compute the right singular vector $\mathbf{v}_{\min}$ and read it physically: which combination of actuators is being asked for? Then the left singular vector $\mathbf{u}_{\min}$: which combination of outputs is hard to produce? Then ask whether the mission actually needs that direction. Often it does not, and the plant is fine. When it does, the answer is usually different hardware geometry rather than a cleverer controller.
:::

::: check
Show that state feedback $\mathbf{u} = -\mathbf{K}\mathbf{x} + \mathbf{v}$ does not move the transmission zeros.
:::

::: answer
Under the feedback, $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}\mathbf{v}$ and $\mathbf{y} = (\mathbf{C}-\mathbf{D}\mathbf{K})\mathbf{x} + \mathbf{D}\mathbf{v}$. So the new plant is $(\mathbf{A}-\mathbf{B}\mathbf{K},\ \mathbf{B},\ \mathbf{C}-\mathbf{D}\mathbf{K},\ \mathbf{D})$, and its system matrix factors as

$$\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K}-\lambda\mathbf{I} & \mathbf{B}\\ \mathbf{C}-\mathbf{D}\mathbf{K}&\mathbf{D}\end{pmatrix} = \begin{pmatrix}\mathbf{A}-\lambda\mathbf{I}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}\begin{pmatrix}\mathbf{I}&\mathbf{0}\\-\mathbf{K}&\mathbf{I}\end{pmatrix}.$$

(Multiply out the right side to check: the first block column becomes $\mathbf{A}-\lambda\mathbf{I}-\mathbf{B}\mathbf{K}$ over $\mathbf{C}-\mathbf{D}\mathbf{K}$.) The right factor is invertible for every $\mathbf{K}$ — its determinant is $1$. So the product has the same rank as $\mathbf{P}(\lambda)$ at every $\lambda$, and the set of transmission zeros is unchanged. That is why a right-half-plane zero belongs to the vehicle, its actuators and its sensors, and cannot be designed away. Only the poles move.
:::

::: check
A pairing analysis returns $\boldsymbol{\Lambda} = \begin{pmatrix}0.6&0.4\\0.4&0.6\end{pmatrix}$. What do you conclude, and how does it compare with $\begin{pmatrix}2.5&-1.5\\-1.5&2.5\end{pmatrix}$?
:::

::: answer
The first says the diagonal pairing is preferable, but the interaction is substantial. Closing the second loop changes the first loop's effective gain by a factor of $1/0.6 = 1.67$. That is workable with detuning, or with a sequential design in which the faster loop is closed first.

The second is worse in two ways. The diagonal entries of $2.5$ mean closing the other loop cuts your loop's gain to $1/2.5 = 40\,\%$ of its open-loop value. And the off-diagonal entries are negative, so the off-diagonal pairing would suffer a sign reversal. The diagonal pairing is the only candidate, and it needs checking with both loops closed, both loops open, and one loop failed.

Neither array tells a fast plant from a slow one. Both need a dynamic check near crossover.
:::

::: check
A vehicle has a right-half-plane transmission zero at $z = 0.5\,\mathrm{rad/s}$ and a requirement for a $0.4\,\mathrm{rad/s}$ closed-loop bandwidth. What are the options?
:::

::: answer
The requirement is not achievable with that plant. The rule of thumb gives $\omega_c \lesssim z/2 = 0.25\,\mathrm{rad/s}$, well below $0.4$. The rule comes from an interpolation constraint the sensitivity function must satisfy at the zero; pushing crossover past it produces a large sensitivity peak, because the loop overreacts to the wrong-way initial response. No controller removes the zero, since state feedback leaves it where it is.

The options are all physical:

- **Move the zero by changing geometry.** In the launch-vehicle case, moving the gimbal or the center of mass changes $\ell$, and $z = \sqrt{T\ell/J}$ with it.
- **Add an actuator** whose input direction removes the blocking direction, as the reaction control system did in the worked example.
- **Measure something else.** The zero depends on $\mathbf{C}$ as well.
- **Renegotiate the requirement.**
:::

::: check
For the launch vehicle with only the nozzle, the rank test on the $\delta\to\theta$ channel flags $\lambda = 0$ twice, and the $\delta\to y$ channel has zeros at $\pm0.929$. Why is neither list the zero list of the one-input, two-output plant $\delta\to(\theta, y)$?
:::

::: answer
First, a word on the $\delta\to\theta$ list. Its transfer function is $-T\ell/(Js^2)$, which has no zeros at all. The two roots at $\lambda = 0$ come from the drift states $y$ and $\dot y$, which a $\theta$ sensor cannot see. They are decoupling zeros of a non-minimal realization, not transmission zeros.

Second, the main point. A zero of the full system must block transmission to **every** output at once, not to one of them. For the one-input, two-output plant, $\mathbf{P}(\lambda)$ is $6\times5$ with normal rank $5$. A rank drop needs a $\lambda$ at which one $(\mathbf{x}_0,u_0)$ zeroes both output rows together. The origin fails to block $y$, and $+0.929$ fails to block $\theta$. Computing the rank confirms it stays at $5$ at $0$, $+0.929$ and $-0.929$. So the pair has no transmission zeros.

This is the $2\times2$ example seen from the output side. When $\mathbf{P}(\lambda)$ already has full column normal rank — the usual case when there are at least as many outputs as inputs — adding an output can only remove zeros, never create them. Likewise, when $\mathbf{P}(\lambda)$ has full row normal rank, adding an input can only remove them. The zero list belongs to the whole $(\mathbf{A},\mathbf{B},\mathbf{C},\mathbf{D})$, and changing any of the four changes it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Directional gain | $\bar\sigma(\mathbf{G}(j\omega))$ and $\underline{\sigma}(\mathbf{G}(j\omega))$ from the SVD; $\gamma = \bar\sigma/\underline{\sigma}$ |
| Aircraft example | $\bar\sigma = 3.157\times10^{-2}$, $\underline\sigma = 2.534\times10^{-4}$, $\gamma = 125$: the weak direction costs about four times the deflection |
| Transmission zero | $\lambda$ where $\mathbf{P}(\lambda) = \begin{pmatrix}\mathbf{A}-\lambda\mathbf{I}&\mathbf{B}\\\mathbf{C}&\mathbf{D}\end{pmatrix}$ drops below normal rank (use a minimal realization) |
| Blocking property | $\mathbf{x}(0) = \mathbf{x}_0$, $\mathbf{u} = \mathbf{u}_0e^{\lambda t}$ gives $\mathbf{y}\equiv\mathbf{0}$ |
| Square plant | $\det\mathbf{P}(s) = (-1)^n\det(s\mathbf{I}-\mathbf{A})\det\mathbf{G}(s)$: zeros are the numerator of $\det\mathbf{G}$ |
| Invariance | state feedback moves poles and never moves zeros |
| RHP zero limit | $\omega_c \lesssim z/2$; launch vehicle $z = \sqrt{T\ell/J} = 0.929\,\mathrm{rad/s}$ |
| MIMO zeros | not the channels' zeros; adding the RCS removed the RHP zero entirely |
| RGA | $\boldsymbol{\Lambda} = \mathbf{G}\circ(\mathbf{G}^{-1})^\mathsf{T}$; rows and columns sum to $1$; scaling invariant |
| Pairing rules | pair near $1$; never pair on a negative entry; entries above $\approx5$ mean strong interaction |
| Worked RGA | $\begin{pmatrix}-11.25&12.25\\12.25&-11.25\end{pmatrix}$: no acceptable decentralized pairing exists |

Large MIMO models are also expensive to run and hard to certify, and most of their states contribute almost nothing to what the sensors see. The last lesson makes that precise, with an invariant you have already met: the Hankel singular values that survived every similarity transform in Lesson 2.

::: context svd-ellipse What the SVD draws
Feed every unit-length input into a $2\times2$ matrix and the outputs trace an ellipse. The longest radius of the ellipse is $\bar\sigma$, the shortest is $\underline\sigma$. The input that lands on the long radius is $\mathbf{v}_1$; the direction of that long radius is $\mathbf{u}_1$. Here the matrix has $\bar\sigma = 2$ and $\underline\sigma = 0.5$, so $\gamma = 4$. The aircraft in the example has $\gamma = 125$ — its ellipse would be a thin needle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="105" r="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="105" x2="110" y2="70.36" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="90" y1="105" x2="55.36" y2="85" stroke="#b4232c" stroke-width="2.5"/>
  <text x="112" y="64" font-size="12" fill="#1d6fd1">v₁</text>
  <text x="38" y="82" font-size="12" fill="#b4232c">v₂</text>
  <text x="90" y="170" font-size="12" fill="#1f2a44" text-anchor="middle">unit inputs</text>
  <line x1="148" y1="105" x2="172" y2="105" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="178,105 170,101 170,109" fill="#6c7a93"/>
  <text x="163" y="96" font-size="12" fill="#6c7a93" text-anchor="middle">G</text>
  <ellipse cx="260" cy="105" rx="80" ry="20" transform="rotate(-30 260 105)" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="105" x2="329.28" y2="65" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="260" y1="105" x2="250" y2="87.68" stroke="#b4232c" stroke-width="2.5"/>
  <text x="300" y="100" font-size="12" fill="#1d6fd1">σ₁u₁</text>
  <text x="226" y="84" font-size="12" fill="#b4232c">σ₂u₂</text>
  <text x="260" y="170" font-size="12" fill="#1f2a44" text-anchor="middle">outputs: σ₁ = 2, σ₂ = 0.5</text>
</svg>
```
:::

::: context stabilator-word A tail that moves all at once
On most airplanes the horizontal tail is a fixed part in front with a hinged flap, the **elevator**, on its back edge. A **stabilator** is a horizontal tail whose whole surface pivots. Many fighters and some light aircraft use one. Airliners usually do something in between: the whole horizontal stabilizer tilts slowly for trim, and the elevator moves quickly for control. Either way, you end up with two surfaces that both mostly make pitching moment — the recipe for a large condition number.
:::

::: context rosenbrock-name Where the system matrix comes from
The block matrix is named after Howard Rosenbrock, a British control engineer who, in the late 1960s and early 1970s, built a theory of multivariable systems around it. His insight was that a zero is best seen not in a transfer function, where cancellations can hide things, but in the state equations themselves. Stack the state equation and the output equation into one matrix, and a zero becomes a place where that matrix loses rank.
:::

::: context schur-complement Block elimination
The Schur complement is what you get from Gaussian elimination done a block at a time. Use the top rows to clear the bottom-left block: subtract $\mathbf{C}\mathbf{M}^{-1}$ times the top block row from the bottom one. The bottom-right block becomes $\mathbf{D}-\mathbf{C}\mathbf{M}^{-1}\mathbf{B}$, and the matrix is now block triangular. The determinant of a block-triangular matrix is the product of the determinants of its diagonal blocks, and elimination does not change a determinant.
:::

::: context zero-bandwidth-limit Why a zero caps the bandwidth
The sensitivity function $S = (\mathbf{I}+\mathbf{G}\mathbf{K})^{-1}$ measures how much a disturbance gets through. At a right-half-plane zero $z$, the plant's output is blocked, so the loop cannot help there. For a single loop, $S$ is forced to equal $1$ at $s = z$ no matter what controller you use; for a matrix loop the same is true along the zero's output direction. A function pinned to $1$ at $z$ cannot also be tiny at all frequencies near and above $z$. Ask for good disturbance rejection up to about $z/2$ and $S$ can still pass through $1$ at $z$ gracefully. Ask for more, and it has to overshoot somewhere — the sensitivity peak.
:::

::: context drift-pole-zero The drift channel on the s-plane
Four poles pile up at the origin, one for each integration from nozzle to position. The two zeros sit on the real axis at $\pm\sqrt{T\ell/J} = \pm0.929\,\mathrm{rad/s}$. The one on the right is the troublemaker.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="15" x2="180" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="15" width="160" height="125" fill="#b4232c" fill-opacity="0.06"/>
  <g stroke="#1f2a44" stroke-width="1.2">
    <line x1="80" y1="76" x2="80" y2="84"/><line x1="280" y1="76" x2="280" y2="84"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="98">−1</text><text x="280" y="98">+1</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="173" y1="73" x2="187" y2="87"/><line x1="173" y1="87" x2="187" y2="73"/>
  </g>
  <text x="192" y="68" font-size="12" fill="#1d6fd1">×4</text>
  <circle cx="87.07" cy="80" r="7" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="272.93" cy="80" r="7" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <text x="87" y="62" font-size="11" fill="#1f2a44" text-anchor="middle">−0.929</text>
  <text x="273" y="62" font-size="11" fill="#b4232c" text-anchor="middle">+0.929</text>
  <text x="330" y="128" font-size="11" fill="#b4232c" text-anchor="end">right half plane</text>
  <text x="336" y="96" font-size="11" fill="#1f2a44" text-anchor="end">Re s</text>
  <text x="186" y="26" font-size="11" fill="#1f2a44">Im s</text>
</svg>
```
:::

::: context wrong-way-response Watching it go the wrong way
Hold the nozzle at $-1^\circ$ to drift right, and let the model above run with no controller. The sideways position is $y(t) = \tfrac{T}{m}\delta\left(\tfrac{t^2}{2} - \tfrac{T\ell}{J}\tfrac{t^4}{24}\right)$. It first dips to about $-0.42\,\mathrm{m}$ at $t = 2.6\,\mathrm{s}$, crosses back through zero at $t = \sqrt{12}/z = 3.7\,\mathrm{s}$, and only then heads right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="40" y2="18" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="153.33" x2="330" y2="153.33" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="40" y1="100" x2="330" y2="100"/><line x1="40" y1="46.67" x2="330" y2="46.67"/>
    <line x1="248.74" y1="153.33" x2="248.74" y2="165"/>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,153.3 45.6,153.4 51.2,153.6 56.8,153.9 62.4,154.4 68.0,154.9 73.6,155.6 79.2,156.4 84.8,157.3 90.4,158.2 96.0,159.3 101.6,160.4 107.2,161.6 112.8,162.9 118.4,164.2 124.0,165.5 129.6,166.8 135.2,168.1 140.8,169.3 146.4,170.5 152.0,171.7 157.6,172.7 163.2,173.6 168.8,174.4 174.4,175.0 180.0,175.4 185.6,175.7 191.2,175.6 196.8,175.3 202.4,174.7 208.0,173.7 213.6,172.4 219.2,170.7 224.8,168.5 230.4,165.8 236.0,162.7 241.6,158.9 247.2,154.6 252.8,149.7 258.4,144.1 264.0,137.7 269.6,130.7 275.2,122.8 280.8,114.0 286.4,104.4 292.0,93.8 297.6,82.2 303.2,69.5 308.8,55.8 314.4,40.9 320.0,24.8"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="157">0</text><text x="34" y="104">1</text><text x="34" y="51">2</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="152" y="198">2</text><text x="264" y="198">4</text><text x="248.7" y="178">3.7 s</text>
  </g>
  <text x="44" y="14" font-size="11" fill="#1f2a44">y (m)</text>
  <text x="330" y="198" font-size="11" fill="#1f2a44" text-anchor="end">t (s)</text>
  <text x="120" y="192" font-size="11" fill="#b4232c" text-anchor="middle">wrong way first</text>
</svg>
```
:::

::: context rcs-word Small thrusters for turning
A **reaction control system** is a set of small rocket thrusters placed around a vehicle to make it turn. Fire two on opposite sides, pointing opposite ways, and their pushes cancel while their turning effects add: a pure moment with no net sideways force. That is the input $M$ in the model. Upper stages, crew capsules and the Space Shuttle orbiter all carried reaction control thrusters; during powered ascent, large first stages steer mainly by gimbaling their engines.
:::

::: context certify-word Why single loops are easier to sign off
Before software flies, someone must show a reviewer — and often a regulator — that every loop has enough stability margin, at every flight condition, and still works if a sensor or actuator fails. With single loops, each margin is a number you can read off a Bode plot, and a failed loop can be switched off on its own. A full matrix controller mixes everything together, so each of those arguments becomes a multivariable analysis. That extra work is a large part of why many vehicles still fly decentralized loops.
:::

::: context hadamard-product Multiplying entry by entry
The Hadamard product, named after the French mathematician Jacques Hadamard, multiplies two matrices of the same size entry by entry: $(\mathbf{X}\circ\mathbf{Y})_{ij} = x_{ij}y_{ij}$. It is not the ordinary matrix product. In NumPy it is what `*` does between two arrays, while `@` is the ordinary product — which is why the code computes the RGA as `G * np.linalg.inv(G).T`.
:::

::: context rga-origin From chemical plants to flight control
The relative gain array was introduced by Edgar Bristol in 1966, for chemical process plants — distillation columns where one valve changes both temperature and composition, much like the shower. Process engineers have used it ever since to choose which valve controls which measurement. It moved into aerospace wherever vehicles are flown with several single loops.
:::

::: context control-allocation More actuators than axes
A spacecraft with four reaction wheels has one more wheel than it has axes. There is no single "wheel for roll". Instead, the controller asks for a torque vector, and a separate step called **control allocation** splits it among the wheels — often by a pseudoinverse, sometimes with limits and failure logic. The spare wheel is also why a pyramid of four wheels keeps full three-axis control after one wheel fails, which the module's controllability exercise checks.
:::
