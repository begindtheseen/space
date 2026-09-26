---
id: l06-pole-placement
title: Pole placement — Ackermann, Bass-Gura and robust eigenstructure
minutes: 20
covers:
  - "Pole placement: Ackermann, Bass-Gura, and robust (eigenstructure) pole placement"
---

Think about the suspension of a car. Soft springs and weak shock absorbers make it float and bounce. Stiff springs and strong shocks make it settle fast, but every pebble hits you. The car's "personality" — how fast it settles, how much it bounces — is decided by a handful of numbers, and a suspension engineer picks them on purpose.

State feedback lets you do the same to a vehicle, with electronics instead of springs. Measure the whole state, multiply by a constant matrix, subtract. Write $\mathbf{u} = -\mathbf{K}\mathbf{x}$ and the plant $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ becomes

$$\dot{\mathbf{x}} = (\mathbf{A} - \mathbf{B}\mathbf{K})\,\mathbf{x}.$$

Here $\mathbf{K}$ is the **gain matrix** — how hard to push back on each state. The closed loop's behavior is decided entirely by the eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}$, its **poles**. Lesson 3 showed how to read them: real parts set how fast things decay, imaginary parts set how fast they ring, and the slowest pole sets the settling time. The remarkable result of this lesson is that for a controllable pair you can put those poles **anywhere you like**, with formulas for the $\mathbf{K}$ that does it.

That result is also a trap, and this lesson spends as long on the trap as on the formulas. "Anywhere you like" is a statement about arithmetic, not hardware. The gain grows with how far you move the poles, and with it the control effort, the amplified sensor noise, and the frequencies at which the loop relies on a model you do not have. Pole placement will return a perfectly good-looking answer for a design that saturates its wheels in the first second, and the arithmetic will not warn you.

## Controllability is exactly the right condition

First, the bad news, which takes two lines to prove. If a mode is uncontrollable, no feedback can move it.

Suppose mode $\lambda$ is uncontrollable. By PBH (Lesson 4) there is a left eigenvector $\mathbf{w}$ with $\mathbf{w}^\mathsf{T}\mathbf{A} = \lambda\mathbf{w}^\mathsf{T}$ and $\mathbf{w}^\mathsf{T}\mathbf{B} = \mathbf{0}^\mathsf{T}$. Then for *any* gain matrix $\mathbf{K}$,

$$\mathbf{w}^\mathsf{T}(\mathbf{A} - \mathbf{B}\mathbf{K}) = \lambda\mathbf{w}^\mathsf{T} - (\mathbf{w}^\mathsf{T}\mathbf{B})\mathbf{K} = \lambda\mathbf{w}^\mathsf{T}.$$

So $\lambda$ is still a closed-loop eigenvalue, with the same left eigenvector. No feedback of any size moves it. If $\lambda$ is unstable, no state feedback can stabilize the plant — which is why stabilizability, not controllability, is the minimum requirement.

Now the good news, the **placement theorem**. If $(\mathbf{A},\mathbf{B})$ is controllable, then for any **[[self-conjugate|self-conjugate]]** set of $n$ desired eigenvalues there is a real $\mathbf{K}$ that places them. Self-conjugate means complex values come in mirror pairs, $a \pm bi$. That is forced: $\mathbf{A} - \mathbf{B}\mathbf{K}$ is a real matrix, and a real matrix's complex eigenvalues always come in pairs. The next section proves the theorem by building $\mathbf{K}$.

## Placement in controllable canonical form

In the right coordinates, pole placement is subtraction. Put a single-input plant in the controllable canonical form of Lesson 1:

$$\mathbf{A}_c = \begin{pmatrix}0&1&\cdots&0\\ \vdots&&\ddots&\vdots\\ 0&0&\cdots&1\\ -a_0&-a_1&\cdots&-a_{n-1}\end{pmatrix}, \qquad \mathbf{B}_c = \begin{pmatrix}0\\\vdots\\0\\1\end{pmatrix}.$$

This is a **[[companion matrix|companion-matrix]]**: its last row holds the coefficients of the open-loop characteristic polynomial $s^n + a_{n-1}s^{n-1} + \cdots + a_0$.

**Step 1.** $\mathbf{B}_c\mathbf{K}_c$ is zero except in its last row, which is $\mathbf{K}_c = (k_1, \dots, k_n)$.

**Step 2.** So $\mathbf{A}_c - \mathbf{B}_c\mathbf{K}_c$ is again a companion matrix, with last row $-(a_0 + k_1,\ a_1 + k_2,\ \dots,\ a_{n-1} + k_n)$.

**Step 3.** Its characteristic polynomial is therefore $s^n + (a_{n-1}+k_n)s^{n-1} + \cdots + (a_0 + k_1)$.

**Step 4.** Match this to the desired polynomial $s^n + \alpha_{n-1}s^{n-1} + \cdots + \alpha_0$ ($\alpha$ is "alpha"):

$$k_{i+1} = \alpha_i - a_i, \qquad i = 0,\dots,n-1.$$

The gain in canonical coordinates is the coefficient-by-coefficient difference between where the characteristic polynomial is and where you want it. That is the whole of single-input pole placement. The rest is bookkeeping to get back to physical coordinates.

### Bass-Gura

Lesson 2 gave the change of coordinates: $\mathbf{x} = \mathbf{T}\mathbf{z}$ with $\mathbf{T} = \mathbf{C}_m\left(\mathbf{C}_m^{(c)}\right)^{-1}$, where $\mathbf{C}_m^{(c)}$ is the controllability matrix of the canonical form. Then $\mathbf{u} = -\mathbf{K}_c\mathbf{z} = -\mathbf{K}_c\mathbf{T}^{-1}\mathbf{x}$, so $\mathbf{K} = \mathbf{K}_c\mathbf{T}^{-1}$.

The inverse of the canonical controllability matrix has a neat closed form: $\left(\mathbf{C}_m^{(c)}\right)^{-1} = \mathbf{W}$, where

$$\mathbf{W} = \begin{pmatrix} a_1 & a_2 & \cdots & a_{n-1} & 1 \\ a_2 & a_3 & \cdots & 1 & 0 \\ \vdots & & \reflectbox{$\ddots$} & & \vdots \\ a_{n-1} & 1 & \cdots & 0 & 0 \\ 1 & 0 & \cdots & 0 & 0\end{pmatrix}$$

is the **[[Hankel matrix|hankel-matrix]]** of the open-loop coefficients. So $\mathbf{T} = \mathbf{C}_m\mathbf{W}$, and the result is the **[[Bass-Gura formula|bass-gura-names]]**:

$$\mathbf{K} = \left(\alpha_0 - a_0,\ \alpha_1 - a_1,\ \dots,\ \alpha_{n-1}-a_{n-1}\right)\left(\mathbf{C}_m\mathbf{W}\right)^{-1}.$$

### Ackermann

**[[Ackermann's formula|ackermann-name]]** gives the same answer without building $\mathbf{W}$. Let $\alpha_d(s) = s^n + \alpha_{n-1}s^{n-1} + \cdots + \alpha_0$ be the desired polynomial, and $\alpha_d(\mathbf{A})$ the matrix you get by putting $\mathbf{A}$ in place of $s$ (and $\mathbf{I}$ in place of the constant $1$).

::: key Ackermann formula
$\mathbf{K} = \begin{pmatrix}0 & \cdots & 0 & 1\end{pmatrix}\mathbf{C}_m^{-1}\,\alpha_d(\mathbf{A})$, where $\alpha_d$ is the desired characteristic polynomial. Elegant, single-input only, and numerically poor above about $n = 10$ — use a robust eigenstructure routine instead.
:::

::: note Why it has to be true
Write $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{K}$ and expand its powers, keeping every $\mathbf{B}$ in view:

$$\mathbf{A}_{cl}^2 = \mathbf{A}^2 - \mathbf{A}\mathbf{B}\mathbf{K} - \mathbf{B}\mathbf{K}\mathbf{A}_{cl}, \qquad \mathbf{A}_{cl}^3 = \mathbf{A}^3 - \mathbf{A}^2\mathbf{B}\mathbf{K} - \mathbf{A}\mathbf{B}\mathbf{K}\mathbf{A}_{cl} - \mathbf{B}\mathbf{K}\mathbf{A}_{cl}^2,$$

and in general $\mathbf{A}_{cl}^j = \mathbf{A}^j - \sum_{i=0}^{j-1}\mathbf{A}^i\mathbf{B}\mathbf{K}\mathbf{A}_{cl}^{j-1-i}$.

Now form $\alpha_d(\mathbf{A}_{cl}) = \sum_j\alpha_j\mathbf{A}_{cl}^j$ (with $\alpha_n = 1$). Cayley–Hamilton says this is $\mathbf{0}$, because $\alpha_d$ is by design the characteristic polynomial of $\mathbf{A}_{cl}$. Group the terms by which power of $\mathbf{A}$ sits in front of $\mathbf{B}$:

$$\mathbf{0} = \alpha_d(\mathbf{A}) - \left[\mathbf{B},\ \mathbf{A}\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}\right]\begin{pmatrix}\ast\\\vdots\\\ast\\\mathbf{K}\end{pmatrix}.$$

The blocks marked $\ast$ are messy combinations you never need. The last block is exactly $\mathbf{K}$: the only term with $\mathbf{A}^{n-1}\mathbf{B}$ in front comes from $\mathbf{A}_{cl}^n$ with $i = n-1$, and it is $\alpha_n\mathbf{K}\mathbf{A}_{cl}^0 = \mathbf{K}$. So $\alpha_d(\mathbf{A}) = \mathbf{C}_m(\ast;\dots;\ast;\mathbf{K})$. Multiply on the left by $\mathbf{C}_m^{-1}$, keep only the last row, and you have $\mathbf{K}$.
:::

::: example Placing the gimbal's poles by hand, two ways
Take the antenna gimbal of Lesson 1: $\mathbf{A} = \begin{pmatrix}0&1&0\\0&-0.5&1.25\\0&0&-50\end{pmatrix}$, $\mathbf{B} = (0,0,50)^\mathsf{T}$. The states are pointing angle, rate, and motor torque $\tau$. The open-loop polynomial is $s^3 + 50.5s^2 + 25s$, so $a_0 = 0$, $a_1 = 25$, $a_2 = 50.5$.

**The goal.** Closed-loop poles at $-2\pm2i$ and $-20\ \mathrm{s^{-1}}$: a pointing loop whose oscillation envelope decays with a $0.5\,\mathrm{s}$ time constant, with damping $\zeta = 1/\sqrt{2}$, plus a faster real pole for the motor state. The desired polynomial is

$$(s^2 + 4s + 8)(s + 20) = s^3 + 24s^2 + 88s + 160,$$

so $\alpha_0 = 160$, $\alpha_1 = 88$, $\alpha_2 = 24$. (Check: $4\times20 + 8 = 88$ and $8\times20 = 160$.)

**Canonical gains.** Subtract:

$$\mathbf{K}_c = (\alpha_0 - a_0,\ \alpha_1 - a_1,\ \alpha_2 - a_2) = (160,\ 63,\ -26.5).$$

**Back to physical coordinates.** Lesson 2 computed $\mathbf{T}^{-1} = \begin{pmatrix}0.016&0&0\\0&0.016&0\\0&-0.008&0.02\end{pmatrix}$ for this plant, so

$$\mathbf{K} = \mathbf{K}_c\mathbf{T}^{-1} = \left(160(0.016),\ \ 63(0.016) + (-26.5)(-0.008),\ \ -26.5(0.02)\right) = (2.56,\ 1.22,\ -0.53).$$

Ackermann's formula on the physical model returns $(2.56,\ 1.22,\ -0.53)$ to every digit, and so does Bass-Gura. The eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ come back as $-2\pm2i$ and $-20$.

**Read the gains.** $k_1 = 2.56\,\mathrm{N\,m/rad}$ is a position stiffness — about $0.045\,\mathrm{N\,m}$ per degree of error. $k_2 = 1.22\,\mathrm{N\,m\,s/rad}$ is rate damping, three times the bearing friction of $0.4$. And $k_3 = -0.53$ is *negative*, so $\mathbf{u} = -\mathbf{K}\mathbf{x}$ contains $+0.53\,\tau$: positive feedback on the motor torque. That makes the motor *slower*: its own pole at $-50$ becomes $-50 + 50(0.53) = -23.5$ inside the loop. The reason is the request itself — the third pole was asked for at $-20$, slower than the motor's natural $-50$, and the formula obeyed. Negative gains like this are a signal to question the specification: putting that third pole at or beyond $-50$ would let the motor keep its own speed. And any design that leans on cancelling or reshaping a pole you do not know accurately is how a loop that works in simulation fails on hardware.
:::

## What faster poles cost

Now the trap. Take one spacecraft axis: $J = 120\,\mathrm{kg\,m^2}$, $\mathbf{x} = (\theta,\omega)$, $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B} = (0,1/J)^\mathsf{T}$. Place the two poles at $-a(1\pm i)$ and slide $a$ to make the loop faster or slower. With $\mathbf{K} = (k_1, k_2)$,

$$\mathbf{A} - \mathbf{B}\mathbf{K} = \begin{pmatrix}0&1\\-k_1/J & -k_2/J\end{pmatrix}, \qquad \text{char poly } s^2 + \frac{k_2}{J}s + \frac{k_1}{J}.$$

The desired pair has sum $-2a$ and product $a^2 + a^2 = 2a^2$, so the desired polynomial is $s^2 + 2as + 2a^2$. Match coefficients:

$$k_1 = 2a^2J, \qquad k_2 = 2aJ.$$

Every **[[pole in this family|pole-family]]** has natural frequency $\omega_n = |\lambda| = a\sqrt{2}$ and damping $\zeta = a/(a\sqrt{2}) = 1/\sqrt{2} = 0.707$. For $\zeta = 0.707$ the closed-loop **[[−3 dB bandwidth|three-db]]** is exactly $\omega_n$. So $a$ is a clean bandwidth knob — and the gain on angle grows as $a^2$ while the gain on rate grows as $a$.

::: example Three walls that stop you going faster
Recover from a $\theta_0 = 5^\circ = 0.08727\,\mathrm{rad}$ attitude error with $\mathbf{u} = -\mathbf{K}\mathbf{x}$. The torque is largest at $t = 0$, before any rate has built up to cancel it, so the peak demand is

$$|u|_{\max} = k_1\theta_0 = 2a^2J\theta_0 \propto a^2.$$

At $a = 1\,\mathrm{rad/s}$: $2(1)(120)(0.08727) = 20.9\,\mathrm{N\,m}$. Fit a log-log line through a sweep of $a$ and the slope is exactly $2$: the **[[price of speed|walls-plot]]** is quadratic, not linear. Double the bandwidth and you need four times the torque.

**Wall one: actuator saturation.** Suppose the wheel set can deliver about $0.2\,\mathrm{N\,m}$ about this axis. Setting $2a^2J\theta_0 \le 0.2$ gives $a \le \sqrt{0.2/(2\times120\times0.08727)} = 0.098\,\mathrm{rad/s}$. Beyond that the wheels saturate on the first sample of a $5^\circ$ error. The loop stops being linear, every margin computed from $\mathbf{A}-\mathbf{B}\mathbf{K}$ becomes fiction, and the integrator you add in Lesson 9 **[[winds up|windup]]**.

**Wall two: noise amplification.** A star tracker with $10'' = 4.85\times10^{-5}\,\mathrm{rad}$ of noise per axis is multiplied by $k_1$ straight into the torque command. Requiring $2a^2J\sigma_\theta \le 0.2\,\mathrm{N\,m}$ — the wheels should not spend their whole authority chasing noise — gives $a \le 4.15\,\mathrm{rad/s}$. That wall is further out than the first here, but it moves in fast with a poorer sensor or a lighter vehicle, and long before saturation you are heating wheel bearings and shaking the payload.

**Wall three: model validity.** The design model has two states. The real vehicle has solar arrays whose first bending mode is near $0.35\,\mathrm{Hz} = 2.20\,\mathrm{rad/s}$, plus a control period, a filter and a wheel torque lag. Keeping the bandwidth $\omega_n = a\sqrt{2}$ a factor of three below the first flex mode gives $a \le 2.20/(3\sqrt{2}) = 0.52\,\mathrm{rad/s}$. Push past it and the controller commands motion at frequencies where its model is wrong — the classic way to destabilize a flexible spacecraft.

**The verdict.** The binding wall here is the first: $a \approx 0.1\,\mathrm{rad/s}$, a bandwidth of $0.14\,\mathrm{rad/s}$, and a settling time of about $4.6/(0.707\times0.138) \approx 47\,\mathrm{s}$ — around a minute. That is what a spacecraft attitude loop really looks like, and no amount of pole placement changes it.
:::

::: warning Placing poles says nothing about margins
Pole placement fixes the closed-loop eigenvalues of the nominal model. It does not bound the sensitivity function, does not give you a gain or phase margin, and does not tell you what happens when $J$ is $20\,\%$ off. Two gain matrices can place identical poles and have wildly different robustness, as the next section shows. After any placement, compute the margins — or the peak of the sensitivity function — the way the classical control module does, and check the design against the parameter spread you expect.
:::

## Multi-input placement: the freedom and what to do with it

With $m > 1$ inputs, $\mathbf{K}$ has $mn$ entries, but there are only $n$ eigenvalue conditions. The gain is not unique. The spare $n(m-1)$ degrees of freedom are a resource — like a recipe that fixes the flavor but leaves the texture up to you.

The clean way to spend them is **eigenstructure assignment**: choose the closed-loop eigen*vectors* as well as the eigenvalues. Ask for $(\mathbf{A} - \mathbf{B}\mathbf{K})\mathbf{v}_i = \lambda_i\mathbf{v}_i$ and rearrange:

$$\mathbf{A}\mathbf{v}_i + \mathbf{B}\mathbf{g}_i = \lambda_i\mathbf{v}_i \iff \left[\mathbf{A}-\lambda_i\mathbf{I},\ \ \mathbf{B}\right]\begin{pmatrix}\mathbf{v}_i\\\mathbf{g}_i\end{pmatrix} = \mathbf{0}, \qquad \mathbf{g}_i = -\mathbf{K}\mathbf{v}_i.$$

The matrix $[\mathbf{A}-\lambda_i\mathbf{I},\ \mathbf{B}]$ is $n\times(n+m)$, so its null space has dimension $m$ whenever the PBH condition holds — the controllability requirement again, now visible as "there is somewhere to choose from". The recipe:

1. For each desired eigenvalue, pick one null vector $(\mathbf{v}_i, \mathbf{g}_i)$, taking conjugate vectors for conjugate eigenvalues so the answer is real.
2. Stack them: $\mathbf{V} = [\mathbf{v}_1 \cdots \mathbf{v}_n]$ and $\mathbf{G} = [\mathbf{g}_1\cdots\mathbf{g}_n]$.
3. Solve $\mathbf{K} = -\mathbf{G}\mathbf{V}^{-1}$.

Every valid choice places the poles exactly. **Robust pole placement** picks the choice that makes $\mathbf{V}$ as well conditioned as possible. The reason is the **[[Bauer–Fike bound|bauer-fike]]**: for a diagonalizable closed loop, a perturbation $\Delta\mathbf{A}$ moves each eigenvalue by at most $\operatorname{cond}(\mathbf{V})\,\|\Delta\mathbf{A}\|$. A closed loop whose eigenvectors are nearly parallel has poles that fly apart under a small modeling error, whatever the nominal plot shows. The Kautsky–Nichols algorithm sweeps the $\mathbf{v}_i$ one at a time, replacing each with the vector in its allowed subspace that is most nearly perpendicular to the others.

::: example Six poles on the pyramid spacecraft, two ways
Place all six eigenvalues of the spacecraft model — $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$, $\mathbf{B} = \begin{pmatrix}\mathbf{0}\\\mathbf{J}^{-1}\mathbf{A}_w\end{pmatrix}$, four wheels, $\mathbf{J} = \operatorname{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ — at $\zeta = 0.707$ with natural frequencies $0.04$, $0.05$ and $0.06\,\mathrm{rad/s}$. Random admissible choices of the $\mathbf{v}_i$, and one conditioning sweep, all place the poles to within $10^{-14}$:

| choice | $\operatorname{cond}(\mathbf{V})$ | $\|\mathbf{K}\|_F$ |
| --- | --- | --- |
| random seed 0 | 56 | 180 |
| random seed 1 | 300 | 375 |
| random seed 3 | 695 | 525 |
| random seed 4 | 336 | 686 |
| conditioned sweep | 36 | 172 |

($\|\mathbf{K}\|_F$, the Frobenius norm, is the square root of the sum of the squared gains. Some random choices also make the four wheels fight each other with no net torque, which inflates $\|\mathbf{K}\|_F$ without changing the poles.)

**Now perturb the model the way reality does.** Raise $J_x$ by $20\,\%$ — as a mis-estimated propellant mass would — and recompute the closed-loop eigenvalues with each gain unchanged. The conditioned design's poles move by at most $0.0032\,\mathrm{s^{-1}}$, and its worst damping ratio falls from $0.707$ to $0.664$. The worst random design (seed 3) moves a pole by $0.0154\,\mathrm{s^{-1}}$ — nearly five times as far — and its damping falls to $0.546$. Seed 1's slowest pole drifts from real part $-0.0283$ to $-0.0188\,\mathrm{s^{-1}}$, a third of the way to the imaginary axis. Same nominal poles, same specification met on paper, measurably different vehicles.

Notice seed 0: its $\operatorname{cond}(\mathbf{V}) = 56$ is low, and it moved no more than the sweep. A low condition number *guarantees* small movement; a high one only *allows* large movement. And the conditioned design also has the smallest gain matrix — typical, but not guaranteed, since minimizing $\operatorname{cond}(\mathbf{V})$ and minimizing $\|\mathbf{K}\|$ are different goals that usually point the same way.
:::

Here is Ackermann's formula in code, on the gimbal.

```python
import numpy as np

def ctrb(A, B):
    return np.hstack([np.linalg.matrix_power(A, j) @ B for j in range(A.shape[0])])

def ackermann(A, B, poles):
    n = A.shape[0]
    coeffs = np.poly(np.asarray(poles, complex)).real     # [1, a_{n-1}, ..., a_0]
    P = np.zeros((n, n))
    for c in coeffs:                                      # Horner on matrices
        P = P @ A + c * np.eye(n)
    e_n = np.zeros((1, n)); e_n[0, -1] = 1.0
    return e_n @ np.linalg.inv(ctrb(A, B)) @ P

A = np.array([[0.0, 1, 0], [0, -0.5, 1.25], [0, 0, -50]])
B = np.array([[0.0], [0], [50]])
K = ackermann(A, B, [-2 + 2j, -2 - 2j, -20])
print("K =", np.round(K, 6))
print("closed-loop eigenvalues:", np.sort_complex(np.linalg.eigvals(A - B @ K)))
# K = [[ 2.56  1.22 -0.53]]
# closed-loop eigenvalues: [-20.+0.j  -2.-2.j  -2.+2.j]
```

::: note Choosing the pole pattern
Three habits cover most designs. First, pick a dominant pair with $\zeta$ between $0.6$ and $0.8$ — $0.707$ gives about $4\,\%$ overshoot — and set its $\omega_n$ from the settling time you need, roughly $4.6/(\zeta\omega_n)$ to settle within one percent. Second, place the remaining poles three to five times faster, so they add a brief transient and nothing else — but no faster than the model supports. Third, compare with the open-loop poles: a design that moves a pole by a factor of a hundred is asking for gains a hundred times larger than the plant's own dynamics. That almost always means the specification, the actuator or the model needs revisiting, not the gain.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \begin{pmatrix}0&1\\6&-1\end{pmatrix}$ and $\mathbf{B} = (0,1)^\mathsf{T}$ — an inverted-pendulum-like system with an unstable open-loop pole. Find $\mathbf{K}$ placing the closed-loop poles at $-3\pm3i$.
:::

::: answer
**Open loop.** $\det(s\mathbf{I}-\mathbf{A}) = s^2 + s - 6 = (s+3)(s-2)$. The pole at $+2\,\mathrm{s^{-1}}$ is unstable: the error doubles every $\ln 2/2 \approx 0.35\,\mathrm{s}$.

**Canonical form.** The pair is already in controllable canonical form, with $a_0 = -6$, $a_1 = 1$.

**Desired.** $(s+3)^2 + 9 = s^2 + 6s + 18$, so $\alpha_0 = 18$, $\alpha_1 = 6$.

**Gains.** $k_1 = \alpha_0 - a_0 = 18 + 6 = 24$ and $k_2 = \alpha_1 - a_1 = 6 - 1 = 5$, so $\mathbf{K} = (24\ \ 5)$.

**Check.** $\mathbf{A}-\mathbf{B}\mathbf{K} = \begin{pmatrix}0&1\\-18&-6\end{pmatrix}$: trace $-6$, determinant $18$, so the polynomial is $s^2+6s+18$, as required.
:::

::: check
Why can you not place the poles of a plant with $\mathbf{A} = \operatorname{diag}(-1, +0.5)$ and $\mathbf{B} = (1, 0)^\mathsf{T}$, and what is the consequence?
:::

::: answer
The second mode has no input path. $\mathbf{C}_m = [\mathbf{B}, \mathbf{A}\mathbf{B}] = \begin{pmatrix}1&-1\\0&0\end{pmatrix}$ has rank $1$. PBH at $\lambda = +0.5$ gives the left eigenvector $\mathbf{w} = (0,1)^\mathsf{T}$ with $\mathbf{w}^\mathsf{T}\mathbf{B} = 0$, so $\mathbf{w}^\mathsf{T}(\mathbf{A}-\mathbf{B}\mathbf{K}) = 0.5\,\mathbf{w}^\mathsf{T}$ for every $\mathbf{K}$: the pole stays at $+0.5$ whatever you do.

Because the stuck mode is unstable, the plant is not stabilizable, and no state feedback works. The consequence: this is a hardware problem, not a control problem. You need an actuator with a path into that mode.
:::

::: check
A design places the poles of the $J = 120\,\mathrm{kg\,m^2}$ axis at $-a(1\pm i)$ with $a = 0.3\,\mathrm{rad/s}$. Give $\mathbf{K}$, the closed-loop bandwidth, the peak torque for a $2^\circ$ initial error, and the torque produced by $10''$ of star tracker noise.
:::

::: answer
**Gains.** $k_1 = 2a^2J = 2(0.09)(120) = 21.6\,\mathrm{N\,m/rad}$ and $k_2 = 2aJ = 72\,\mathrm{N\,m\,s/rad}$.

**Bandwidth.** $\omega_n = a\sqrt{2} = 0.424\,\mathrm{rad/s}$, about $0.0675\,\mathrm{Hz}$. Settling to $1\,\%$ takes about $4.6/(0.707\times0.424) = 15.3\,\mathrm{s}$.

**Peak torque.** $\theta_0 = 2^\circ = 0.0349\,\mathrm{rad}$, so $21.6\times0.0349 = 0.754\,\mathrm{N\,m}$. That exceeds a $0.2\,\mathrm{N\,m}$ wheel set, so the recovery will be torque-limited rather than linear.

**Noise torque.** $21.6\times4.85\times10^{-5} = 1.05\times10^{-3}\,\mathrm{N\,m}$, about half a percent of authority — acceptable. Saturation is the binding problem, as it usually is at low bandwidth.
:::

::: check
Two multi-input designs place identical closed-loop poles. One has $\operatorname{cond}(\mathbf{V}) = 40$, the other $\operatorname{cond}(\mathbf{V}) = 1100$. What do you expect to differ, and how would you demonstrate it?
:::

::: answer
The nominal step responses will look similar, because the poles are the same. What differs is sensitivity. By Bauer–Fike, a modeling error $\Delta\mathbf{A}$ can move the eigenvalues by up to $\operatorname{cond}(\mathbf{V})\|\Delta\mathbf{A}\|$, so the second design's poles can move up to about $27$ times further ($1100/40 = 27.5$) for the same error. Its eigenvectors are nearly parallel, which also means large transient swings in the state even when every eigenvalue is well damped.

To demonstrate it, perturb the plant the way reality will — inertia off by $20\,\%$, an actuator gain off by $10\,\%$, a misalignment — and plot the closed-loop eigenvalues of both designs. Then compute the gain and phase margins at each input, and the peak of the sensitivity function.
:::

::: check
Why is Ackermann's formula a poor choice for a 20-state flexible launch vehicle model, and what would you use instead?
:::

::: answer
Three reasons.

1. It is single-input only, and a launch vehicle has at least pitch and yaw gimbal commands.
2. It needs $\mathbf{C}_m^{-1}$. For $n = 20$ the controllability matrix contains $\mathbf{A}^{19}$, so its condition number is effectively unbounded and the inverse is meaningless.
3. It goes through the characteristic polynomial, whose coefficients are a badly conditioned way to describe 20 roots spread over several decades of frequency — a change in the last digit of one coefficient can visibly move a pole.

Instead, use an eigenstructure-assignment routine that works directly with the null spaces of $[\mathbf{A}-\lambda_i\mathbf{I},\ \mathbf{B}]$ and conditions $\mathbf{V}$, on a scaled model — or move to an optimal-control formulation where the gain comes from a Riccati equation instead of a polynomial.
:::

## Summary

| Item | Statement |
| --- | --- |
| State feedback | $\mathbf{u} = -\mathbf{K}\mathbf{x}$ gives $\dot{\mathbf{x}} = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x}$ |
| Placement theorem | $(\mathbf{A},\mathbf{B})$ controllable $\iff$ the eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ can be placed arbitrarily |
| Uncontrollable mode | $\mathbf{w}^\mathsf{T}\mathbf{B} = 0 \Rightarrow \mathbf{w}^\mathsf{T}(\mathbf{A}-\mathbf{B}\mathbf{K}) = \lambda\mathbf{w}^\mathsf{T}$: unmoved by any $\mathbf{K}$ |
| Canonical form | $k_{i+1} = \alpha_i - a_i$, desired coefficients minus open-loop coefficients |
| Bass-Gura | $\mathbf{K} = (\alpha_0-a_0,\dots,\alpha_{n-1}-a_{n-1})(\mathbf{C}_m\mathbf{W})^{-1}$, $\mathbf{W} = (\mathbf{C}_m^{(c)})^{-1}$ Hankel in the $a_i$ |
| Ackermann | $\mathbf{K} = (0\cdots0\ 1)\mathbf{C}_m^{-1}\alpha_d(\mathbf{A})$; single input only |
| Double integrator | poles at $-a(1\pm i)$ give $\mathbf{K} = (2a^2J,\ 2aJ)$, $\omega_n = a\sqrt{2}$, $\zeta = 0.707$ |
| Price of speed | peak torque $2a^2J\theta_0 \propto a^2$; noise torque $\propto a^2$; bandwidth $\propto a$ |
| Three walls | actuator saturation, sensor-noise amplification, model validity above the flex modes |
| MIMO | $[\mathbf{A}-\lambda_i\mathbf{I},\ \mathbf{B}]\begin{pmatrix}\mathbf{v}_i\\\mathbf{g}_i\end{pmatrix} = \mathbf{0}$, $\mathbf{K} = -\mathbf{G}\mathbf{V}^{-1}$; freedom is $n(m-1)$ |
| Robust placement | minimize $\operatorname{cond}(\mathbf{V})$; Bauer–Fike: $|\Delta\lambda| \le \operatorname{cond}(\mathbf{V})\|\Delta\mathbf{A}\|$ |

All of this assumed you can measure the entire state. On a real vehicle you measure attitude and perhaps rate — not wheel torque, not flex-mode amplitude, not gyro bias. The next lesson builds the machine that manufactures the missing states, and shows that its error dynamics are a placement problem in disguise.

::: context self-conjugate Why complex poles come in pairs
A real polynomial with a complex root $a + bi$ always has $a - bi$ as a root too: take the complex conjugate of the equation $p(s) = 0$, and since every coefficient is real, you get $p(\bar{s}) = 0$. The characteristic polynomial of a real matrix is real. So you may ask for $-2 \pm 2i$, but never for $-2 + 2i$ alone. Physically, the pair is one oscillation: the real part is how fast it dies, the imaginary part is how fast it swings.
:::

::: context companion-matrix Why "companion"
The matrix is called the companion of its polynomial because it is built straight from the coefficients and has exactly that polynomial as its characteristic polynomial. Numerical libraries use the same trick in reverse: NumPy's `np.roots` finds a polynomial's roots by building its companion matrix and computing the eigenvalues. It is the bridge between "polynomial" and "matrix" that makes the canonical-form argument work.
:::

::: context hankel-matrix A matrix with constant anti-diagonals
A Hankel matrix has the same entry all along each anti-diagonal (bottom-left to top-right), so it is fully described by one list of numbers — here $a_1, a_2, \dots, a_{n-1}, 1, 0, \dots$. It is named after the German mathematician Hermann Hankel. Hankel matrices come back in Lesson 11, where the "Hankel singular values" measure how much each state matters to the input-output behavior.
:::

::: context bass-gura-names Who Bass and Gura were
The formula is credited to Robert W. Bass and Ira Gura, who published it in 1965, early in the state-space era of control. It is the textbook route to single-input pole placement because every step — canonical form, coefficient subtraction, change of coordinates — can be seen and checked. For the same reason it inherits the canonical form's numerical weaknesses for large $n$.
:::

::: context ackermann-name Who Ackermann was
Jürgen Ackermann, a German control engineer who worked at the German Aerospace Center (DLR), published the formula in 1972. He later became known for robust control of cars and aircraft. The formula is popular in teaching because it needs no coordinate change at all: one matrix polynomial, one inverse, one row.
:::

::: context pole-family Poles that slide along a ray
Poles at $-a(1\pm i)$ sit on two lines at $45^\circ$ from the negative real axis. Every point on those lines has damping $\zeta = 0.707$. Sliding outward along them keeps the shape of the response and makes it faster; the distance from the origin is $\omega_n = a\sqrt{2}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="300" y1="10" x2="300" y2="210" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="328" y="126" font-size="12" fill="#6c7a93">Re</text>
  <text x="306" y="22" font-size="12" fill="#6c7a93">Im</text>
  <line x1="300" y1="110" x2="200" y2="10" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="300" y1="110" x2="200" y2="210" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="264" y1="74" x2="276" y2="86"/><line x1="276" y1="74" x2="264" y2="86"/>
    <line x1="264" y1="134" x2="276" y2="146"/><line x1="276" y1="134" x2="264" y2="146"/>
    <line x1="234" y1="44" x2="246" y2="56"/><line x1="246" y1="44" x2="234" y2="56"/>
    <line x1="234" y1="164" x2="246" y2="176"/><line x1="246" y1="164" x2="234" y2="176"/>
    <line x1="204" y1="14" x2="216" y2="26"/><line x1="216" y1="14" x2="204" y2="26"/>
    <line x1="204" y1="194" x2="216" y2="206"/><line x1="216" y1="194" x2="204" y2="206"/>
  </g>
  <text x="270" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">a = 0.5</text>
  <text x="240" y="38" font-size="11" fill="#1f2a44" text-anchor="middle">a = 1</text>
  <text x="170" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">a = 1.5</text>
  <text x="120" y="104" font-size="12" fill="#1d6fd1" text-anchor="middle">ζ = 0.707 on both rays</text>
  <text x="240" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">−1</text>
  <line x1="240" y1="106" x2="240" y2="114" stroke="#6c7a93"/>
</svg>
```
:::

::: context three-db What "bandwidth" means here
Drive the closed loop with a slow sine wave and the output follows it. Speed the sine up and the output shrinks. The **−3 dB bandwidth** is the frequency where the output amplitude has fallen to $1/\sqrt{2} \approx 0.707$ of its slow value. For a standard second-order loop the response at $\omega = \omega_n$ has amplitude $1/(2\zeta)$, which is exactly $0.707$ when $\zeta = 0.707$ — so for this family the bandwidth equals $\omega_n$.
:::

::: context walls-plot The three walls on one plot
Peak torque for a $5^\circ$ error grows as $a^2$ (dark line). It crosses the $0.2\,\mathrm{N\,m}$ wheel limit at $a \approx 0.098$. The flex-mode limit is at $a \approx 0.52$. The noise torque from $10''$ of tracker noise (blue) crosses the limit only at $a \approx 4.15$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="190" x2="340" y2="190" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="190" x2="60" y2="20" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="102" y="205" font-size="11" fill="#6c7a93" text-anchor="middle">0.1</text>
  <text x="242" y="205" font-size="11" fill="#6c7a93" text-anchor="middle">1</text>
  <text x="330" y="214" font-size="11" fill="#1f2a44" text-anchor="end">a, rad/s (log)</text>
  <text x="54" y="194" font-size="11" fill="#6c7a93" text-anchor="end">0.01</text>
  <text x="54" y="126" font-size="11" fill="#6c7a93" text-anchor="end">1</text>
  <text x="54" y="58" font-size="11" fill="#6c7a93" text-anchor="end">100</text>
  <text x="14" y="16" font-size="11" fill="#1f2a44">torque, N m (log)</text>
  <line x1="60" y1="145.8" x2="340" y2="145.8" stroke="#f2b880" stroke-width="2"/>
  <text x="110" y="160" font-size="11" fill="#1f2a44">wheel limit 0.2</text>
  <text x="215" y="110" font-size="11" fill="#1f2a44">peak, 5° error</text>
  <text x="278" y="186" font-size="11" fill="#1d6fd1">10″ noise</text>
  <line x1="60" y1="165.6" x2="340" y2="29.6" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="237.5" y1="190" x2="340" y2="140.2" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100.7" y1="190" x2="100.7" y2="20" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="202.2" y1="190" x2="202.2" y2="20" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="328.6" y1="190" x2="328.6" y2="20" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="104" y="34" font-size="11" fill="#b4232c">saturate</text>
  <text x="206" y="34" font-size="11" fill="#b4232c">flex</text>
  <text x="324" y="34" font-size="11" fill="#b4232c" text-anchor="end">noise</text>
</svg>
```
:::

::: context windup Windup, briefly
An integrator adds up error over time. If the actuator is saturated, the error does not shrink as fast as the controller expects, so the integrator keeps piling up a larger and larger command the actuator cannot deliver. When the error finally reverses, that stored command has to be "unwound" first, causing a large overshoot. Lesson 9 adds integral action to state feedback and needs a guard against exactly this.
:::

::: context bauer-fike Nearly parallel eigenvectors
Friedrich Bauer and C. T. Fike published the bound in 1960. The picture behind it: two unit eigenvectors at right angles form a matrix with condition number $1$; squeeze them to $10^\circ$ apart and the condition number is $\cot 5^\circ \approx 11.4$. Nearly parallel eigenvectors mean the modes are barely distinguishable, and a small change to the matrix can reshuffle them — moving the eigenvalues a lot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="130" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="140,110 128,104 128,116" fill="#1d6fd1"/>
  <line x1="40" y1="110" x2="40" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="40,20 34,32 46,32" fill="#1d6fd1"/>
  <text x="90" y="138" font-size="12" fill="#1f2a44" text-anchor="middle">90° apart: cond = 1</text>
  <line x1="210" y1="110" x2="300" y2="110" stroke="#b4232c" stroke-width="3"/>
  <polygon points="310,110 298,104 298,116" fill="#b4232c"/>
  <line x1="210" y1="110" x2="298.6" y2="94.4" stroke="#b4232c" stroke-width="3"/>
  <polygon points="308.5,92.6 295.7,88.6 297.8,100.4" fill="#b4232c"/>
  <text x="262" y="138" font-size="12" fill="#1f2a44" text-anchor="middle">10° apart: cond ≈ 11.4</text>
</svg>
```
:::
