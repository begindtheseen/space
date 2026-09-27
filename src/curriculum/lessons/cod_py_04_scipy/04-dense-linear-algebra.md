---
id: l04-dense-linear-algebra
title: Dense linear algebra: Cholesky, QR, expm and Riccati
minutes: 24
covers:
  - 'scipy.linalg: cholesky, qr, expm, solve_continuous_are and solve_discrete_are'
---

A kitchen drawer with one good knife will get you through most meals. But a baker also owns a bread knife, a paring knife and a pair of shears. Each one does one job, and does it better than the all-purpose knife ever could. Pick the right tool and the job is faster and cleaner. Pick the wrong one and you get squashed bread.

NumPy's `np.linalg` is the good all-purpose knife: `solve`, `inv`, `eig`. **`scipy.linalg`** is the full drawer. It has everything NumPy has, plus tools built for matrices with a special shape or a special job. This lesson covers the four you will reach for most in guidance, navigation and control work:

- **`cholesky`**, a "square root" for covariance matrices, used to draw correlated random errors in a Monte Carlo run;
- **`qr`**, the safe way to solve a least-squares fit;
- **`expm`**, the matrix exponential, which moves a state forward in time;
- **`solve_continuous_are`** and **`solve_discrete_are`**, which solve the equations behind an optimal controller called LQR.

All four live inside real flight software and the tools that design it. A navigation filter carries a covariance matrix and keeps it healthy with Cholesky factors. A trajectory fit uses QR under the hood. A simulator steps its dynamics with a matrix exponential. And a landing or docking controller often gets its gains from a Riccati equation. The word **dense** in the title means every entry of the matrix is stored, even the zeros. That is the right choice for the small matrices of a vehicle's state, which rarely have more than a few dozen rows.

## Cholesky: a square root for covariance matrices

Start with one number. If a GPS position error has a **variance** of $9\,\mathrm{m^2}$ (variance is the average squared error), its **standard deviation** is the square root, $3\,\mathrm{m}$. To fake realistic errors in a simulation, you draw a standard normal number $z$ (average $0$, spread $1$) and multiply: $x = 3z$. The square root turns "spread 1" into "spread 3 m".

Now suppose you track two errors at once, position and velocity, and they are linked: when the position estimate is too far ahead, the velocity estimate usually is too. That link is **correlation**, a number between $-1$ and $1$. The spreads and the link together live in a **covariance matrix** $\mathbf{C}$:

$$
\mathbf{C} = \begin{bmatrix} \sigma_p^2 & \rho\,\sigma_p\sigma_v \\ \rho\,\sigma_p\sigma_v & \sigma_v^2 \end{bmatrix}.
$$

Read $\sigma_p$ as "sigma sub p", the position standard deviation, and $\rho$ as "rho", the correlation. A covariance matrix is always **symmetric** (it equals its own mirror image across the diagonal) and, for any real set of errors, **[[positive definite|positive-definite]]** (every direction has a positive variance).

The **Cholesky factorization** is the matrix version of the square root. It writes $\mathbf{C}$ as a **lower-triangular** matrix $\mathbf{L}$ (all zeros above the diagonal) times its own transpose:

$$
\mathbf{C} = \mathbf{L}\mathbf{L}^{\mathsf{T}}.
$$

Read it "C equals L times L transpose". Then $\mathbf{x} = \mathbf{L}\mathbf{z}$, with $\mathbf{z}$ a vector of independent standard normal numbers, has exactly the covariance $\mathbf{C}$. That is how a **[[Monte Carlo|monte-carlo]]** simulation makes errors that are both the right size and correctly linked.

::: example Factoring a covariance by hand
A navigation filter says the position error has $\sigma_p = 3\,\mathrm{m}$, the velocity error has $\sigma_v = 0.5\,\mathrm{m/s}$, and they are correlated with $\rho = 0.8$. Build $\mathbf{C}$ and factor it.

**Build the matrix.** The corners are $3^2 = 9$ and $0.5^2 = 0.25$. The off-diagonal entry is $0.8 \times 3 \times 0.5 = 1.2$. So

$$
\mathbf{C} = \begin{bmatrix} 9 & 1.2 \\ 1.2 & 0.25 \end{bmatrix}.
$$

**Write the unknown factor.** Let $\mathbf{L} = \begin{bmatrix} \ell_{11} & 0 \\ \ell_{21} & \ell_{22} \end{bmatrix}$. Multiplying out $\mathbf{L}\mathbf{L}^{\mathsf{T}}$ gives $\begin{bmatrix} \ell_{11}^2 & \ell_{11}\ell_{21} \\ \ell_{11}\ell_{21} & \ell_{21}^2 + \ell_{22}^2 \end{bmatrix}$.

**Match entries one at a time.** Top left: $\ell_{11}^2 = 9$, so $\ell_{11} = 3$. Off-diagonal: $3\,\ell_{21} = 1.2$, so $\ell_{21} = 0.4$. Bottom right: $0.4^2 + \ell_{22}^2 = 0.25$, so $\ell_{22}^2 = 0.25 - 0.16 = 0.09$ and $\ell_{22} = 0.3$.

$$
\mathbf{L} = \begin{bmatrix} 3 & 0 \\ 0.4 & 0.3 \end{bmatrix}.
$$

**Sanity check.** The top-left entry is the position standard deviation, $3\,\mathrm{m}$, as it should be: the first error is $3z_1$. The second error is $0.4z_1 + 0.3z_2$. It borrows some of $z_1$, which is exactly what makes it correlated with the first.
:::

Here is the same thing in SciPy, with a check that samples drawn through $\mathbf{L}$ really have the covariance we asked for:

```python
import numpy as np
from scipy import linalg

C = np.array([[9.0, 1.2],
              [1.2, 0.25]])
L = linalg.cholesky(C, lower=True)        # lower=True is NOT the default
print(np.round(L, 3))
print(np.allclose(L @ L.T, C))

rng = np.random.default_rng(1)
z = rng.standard_normal((2, 100_000))     # independent, spread 1
x = L @ z                                  # correlated, covariance C
print(np.round(np.cov(x), 2))
# [[3.  0. ]
#  [0.4 0.3]]
# True
# [[8.94 1.19]
#  [1.19 0.25]]
```

The sample covariance is within a percent of the target, which is what $100\,000$ random draws buy you.

::: warning SciPy's Cholesky is upper-triangular by default
`scipy.linalg.cholesky(C)` returns the **upper** factor $\mathbf{U}$, with $\mathbf{C} = \mathbf{U}^{\mathsf{T}}\mathbf{U}$. `numpy.linalg.cholesky(C)` returns the **lower** factor $\mathbf{L}$. They are transposes of each other, so the numbers look right either way. If you write `x = U @ z` by mistake, the spreads come out wrong and nothing warns you. Pass `lower=True`, or check `np.allclose(L @ L.T, C)` once.
:::

### Cholesky as a health test

Cholesky only works on a positive-definite matrix. If you hand it anything else, it raises `LinAlgError`. That makes it a cheap test. A covariance matrix that a filter has updated thousands of times can drift, through round-off, into something that no real set of errors could have. Try to factor it, and a failure tells you at once.

```python
import numpy as np
from scipy import linalg

bad = np.array([[9.0, 1.6],
                [1.6, 0.25]])     # implies correlation 1.6 / 1.5 > 1
try:
    linalg.cholesky(bad)
except linalg.LinAlgError:
    print("not positive definite")
print(np.round(np.linalg.eigvalsh(bad), 3))
# not positive definite
# [-0.033  9.283]
```

The off-diagonal $1.6$ would need a correlation of $1.6 / (3 \times 0.5) \approx 1.07$, and no correlation can exceed $1$. The negative **eigenvalue** (a variance along some special direction) confirms it: a variance cannot be negative.

When you need to solve $\mathbf{C}\mathbf{x} = \mathbf{b}$ with a positive-definite $\mathbf{C}$, use `linalg.cho_factor` once and `linalg.cho_solve` for each right-hand side. It does about half the work of a general solve and is more accurate.

::: key
Cholesky writes a symmetric positive-definite matrix as $\mathbf{C} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$. Correlated samples are $\mathbf{x} = \mathbf{L}\mathbf{z}$. `scipy.linalg.cholesky` returns the upper factor unless you pass `lower=True`, and it raises `LinAlgError` if the matrix is not positive definite.
:::

## QR: least squares without squaring your troubles

Back in the lesson on residuals and scaling, you met the **[[condition number|condition-number]]**: roughly, how many times a small error in your data can grow in the answer. A condition number of $10^6$ means you can lose about six of the sixteen digits a double-precision number carries.

The classic way to fit a line or curve is the **normal equations**. You want $\mathbf{A}\mathbf{x} \approx \mathbf{b}$, where each row of $\mathbf{A}$ is one measurement's model terms and $\mathbf{b}$ holds the measurements. You multiply both sides by $\mathbf{A}^{\mathsf{T}}$ and solve the small square system $\mathbf{A}^{\mathsf{T}}\mathbf{A}\,\mathbf{x} = \mathbf{A}^{\mathsf{T}}\mathbf{b}$. It works on paper. On a computer it has a hidden cost: the condition number of $\mathbf{A}^{\mathsf{T}}\mathbf{A}$ is the *square* of the condition number of $\mathbf{A}$. Lose six digits in $\mathbf{A}$, and you lose twelve in the normal equations.

The **QR factorization** avoids the squaring. It writes $\mathbf{A} = \mathbf{Q}\mathbf{R}$:

- $\mathbf{Q}$ has **[[orthonormal|orthonormal]]** columns: each has length $1$ and each is at right angles to the others, so $\mathbf{Q}^{\mathsf{T}}\mathbf{Q} = \mathbf{I}$ (the identity matrix, all ones down the diagonal).
- $\mathbf{R}$ is square and **upper-triangular** (all zeros below the diagonal).

Now do the fit in three steps. Replace $\mathbf{A}$ by $\mathbf{Q}\mathbf{R}$, so $\mathbf{Q}\mathbf{R}\mathbf{x} \approx \mathbf{b}$. Multiply both sides by $\mathbf{Q}^{\mathsf{T}}$; since $\mathbf{Q}^{\mathsf{T}}\mathbf{Q} = \mathbf{I}$, this leaves $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf{T}}\mathbf{b}$. Solve that by **back substitution**: the last row has one unknown, the row above has two, and so on up. No matrix is ever squared.

```python
import numpy as np
from scipy import linalg

t = np.linspace(0.0, 10.0, 101)                # time, s
A = np.vander(t, 7, increasing=True)           # columns 1, t, t^2, ..., t^6
x_true = np.ones(7)
b = A @ x_true                                  # perfect data, no noise

Q, R = linalg.qr(A, mode="economic")           # Q is 101x7, R is 7x7
x_qr = linalg.solve_triangular(R, Q.T @ b)     # back substitution
x_ne = linalg.solve(A.T @ A, A.T @ b)          # normal equations

print(f"cond(A)     = {np.linalg.cond(A):.1e}")
print(f"cond(A.T A) = {np.linalg.cond(A.T @ A):.1e}")
print(f"worst error, QR:               {np.max(np.abs(x_qr - 1)):.0e}")
print(f"worst error, normal equations: {np.max(np.abs(x_ne - 1)):.0e}")
# cond(A)     = 7.1e+06
# cond(A.T A) = 5.0e+13
# worst error, QR:               8e-11
# worst error, normal equations: 3e-06
```

The data are perfect, so every error here is round-off. The normal equations throw away about $40\,000$ times more accuracy than QR ($3 \times 10^{-6}$ against $8 \times 10^{-11}$). The condition numbers predict it: $7.1 \times 10^6$ squared is about $5 \times 10^{13}$.

`mode="economic"` asks for the thin version: $\mathbf{Q}$ with as many columns as $\mathbf{A}$ (here $7$), not a full $101 \times 101$ square. You almost always want the economic mode for fitting.

::: note Why multiplying by Q-transpose does not change the fit
A matrix with orthonormal columns preserves lengths: rotate or reflect a vector and it stays the same length. Least squares minimizes the length of the residual $\mathbf{r} = \mathbf{A}\mathbf{x} - \mathbf{b}$. Extend $\mathbf{Q}$ to a full square orthogonal matrix $[\mathbf{Q}\;\mathbf{Q}_\perp]$, whose extra columns are at right angles to all of $\mathbf{Q}$. Multiplying $\mathbf{r}$ by its transpose keeps the length and splits the residual into two parts:

$$
\|\mathbf{r}\|^2 = \|\mathbf{R}\mathbf{x} - \mathbf{Q}^{\mathsf{T}}\mathbf{b}\|^2 + \|\mathbf{Q}_\perp^{\mathsf{T}}\mathbf{b}\|^2.
$$

The second part does not depend on $\mathbf{x}$ at all. So the best $\mathbf{x}$ makes the first part zero: $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf{T}}\mathbf{b}$. The second part is the leftover misfit no choice of $\mathbf{x}$ can remove.
:::

In practice `np.linalg.lstsq` and `scipy.linalg.lstsq` do something equally safe for you (they use a closely related factorization). You call `qr` yourself when you want the pieces: to reuse $\mathbf{R}$ for many right-hand sides, to add measurements one at a time, or to read the uncertainty of the fit from $\mathbf{R}$.

::: warning Never form A-transpose-A for a badly scaled fit
If you see `np.linalg.solve(A.T @ A, A.T @ b)` in a fitting script, treat it as a bug waiting for bad data. Use `lstsq`, or QR, and scale the columns first as lesson 3 taught: fitting against time in seconds since midnight instead of seconds since launch can push the condition number past what any method survives.
:::

## expm: moving a state forward in time

Money in a savings account that grows at a steady rate $a$ follows $\dot{x} = a x$. Read $\dot{x}$ as "x dot", the rate of change of $x$. The answer is the exponential: $x(t) = e^{at}\,x(0)$.

A vehicle's state is not one number but several — position and velocity, say — and they feed each other. A **linear system** writes that as $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, with $\mathbf{A}$ a square matrix. The answer has the same shape as the savings account:

$$
\mathbf{x}(t) = e^{\mathbf{A}t}\,\mathbf{x}(0).
$$

The matrix $e^{\mathbf{A}t}$ is the **matrix exponential**, and in navigation it has its own name: the **[[state transition matrix|state-transition]]** $\boldsymbol{\Phi}$ (read "capital phi"). Multiply today's state by $\boldsymbol{\Phi}$ and you get the state $t$ seconds later. It is defined by the same series as the ordinary exponential, with matrix powers in place of number powers:

$$
e^{\mathbf{M}} = \mathbf{I} + \mathbf{M} + \frac{\mathbf{M}^2}{2!} + \frac{\mathbf{M}^3}{3!} + \cdots
$$

`scipy.linalg.expm` computes it accurately. It does not add up the series term by term, which can be slow and inaccurate; it uses a scaling-and-squaring method that is reliable for the matrices you meet in practice.

For a body coasting in one dimension, with state (position, velocity) and no force, $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$. Here $\mathbf{A}^2$ is all zeros, so the series stops after two terms: $e^{\mathbf{A}\,\Delta t} = \mathbf{I} + \mathbf{A}\,\Delta t$. That is "new position = old position + velocity × time", as it should be.

```python
import numpy as np
from scipy import linalg

dt = 0.1                                   # s
A = np.array([[0.0, 1.0],
              [0.0, 0.0]])
print(linalg.expm(A * dt))                 # the matrix exponential
print(np.round(np.exp(A * dt), 3))         # WRONG: exp of each entry
# [[1.  0.1]
#  [0.  1. ]]
# [[1.    1.105]
#  [1.    1.   ]]
```

::: warning np.exp is not the matrix exponential
`np.exp(M)` takes $e$ to the power of each entry separately. Every zero becomes a one, so the coasting body above would gain position from nothing. The matrix exponential is `scipy.linalg.expm(M)`. The two agree only for diagonal matrices, and even then `np.exp` turns the off-diagonal zeros into ones.
:::

::: example Where is a vibrating panel half a period later?
A solar-array panel flexes like a spring. Model it as a **[[structural mode|structural-mode]]** with natural frequency $f_n = 2\,\mathrm{Hz}$ and damping ratio $\zeta = 0.02$ (read "zeta"; $2\%$ damping, typical of a lightly damped structure). With state (displacement, velocity),

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega_n^2 & -2\zeta\omega_n \end{bmatrix}, \qquad \omega_n = 2\pi f_n \approx 12.57\,\mathrm{rad/s}.
$$

The panel starts bent $1\,\mathrm{cm}$ and at rest. Where is it after $0.25\,\mathrm{s}$, half of the $0.5\,\mathrm{s}$ period?

**Step forward with expm.** $\boldsymbol{\Phi} = e^{\mathbf{A} \times 0.25}$, and the new state is $\boldsymbol{\Phi}\,[0.01,\ 0]^{\mathsf{T}}$.

```python
import numpy as np
from scipy import linalg

wn = 2 * np.pi * 2.0                        # rad/s
zeta = 0.02
A = np.array([[0.0, 1.0],
              [-wn**2, -2 * zeta * wn]])
Phi = linalg.expm(A * 0.25)
x = Phi @ np.array([0.01, 0.0])             # 1 cm, at rest
print(f"displacement {x[0] * 100:.3f} cm, velocity {x[1] * 100:.3f} cm/s")
# displacement -0.939 cm, velocity -0.007 cm/s
```

**Read the answer.** Half a swing later the panel is on the other side, at $-0.939\,\mathrm{cm}$, nearly at rest again.

**Sanity check.** Damping shrinks the swing by the factor $e^{-\zeta\omega_n t} = e^{-0.02 \times 12.57 \times 0.25} \approx 0.939$. That matches. The tiny leftover velocity is there because damping makes the real period a hair longer than $0.5\,\mathrm{s}$.
:::

### expm also builds discrete models

A flight computer does not push a constant force forever. It sets the thruster command, holds it for one time step $\Delta t$, then sets it again. With a force input, the model is $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$. Over one step, the state update becomes $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d u_k$ (read "x sub k plus one": the state at step $k+1$). There is a neat trick, due to Charles **[[Van Loan|van-loan]]**, for getting both matrices from one call: stack $\mathbf{A}$ and $\mathbf{B}$ into a bigger square matrix and take its exponential.

```python
import numpy as np
from scipy import linalg

dt = 0.1
A = np.array([[0.0, 1.0],
              [0.0, 0.0]])
B = np.array([[0.0],
              [1.0]])                        # force per unit mass
M = np.zeros((3, 3))
M[:2, :2] = A
M[:2, 2:] = B
E = linalg.expm(M * dt)
Ad, Bd = E[:2, :2], E[:2, 2:]
print(Ad)
print(np.round(Bd, 4))
# [[1.  0.1]
#  [0.  1. ]]
# [[0.005]
#  [0.1  ]]
```

$\mathbf{B}_d$ says a unit push held for $0.1\,\mathrm{s}$ adds $0.1\,\mathrm{m/s}$ of speed and $\tfrac{1}{2}(0.1)^2 = 0.005\,\mathrm{m}$ of distance — the familiar $\tfrac{1}{2}at^2$. This is exactly what `scipy.signal.cont2discrete` does with its default method, and lesson 6 picks it up from there.

::: key
$\mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0)$: the state transition matrix is `scipy.linalg.expm(A * t)`, never `np.exp`. The exponential of $\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{0} & \mathbf{0}\end{bmatrix}\Delta t$ holds $\mathbf{A}_d$ and $\mathbf{B}_d$ for an input held constant over each step.
:::

## Riccati equations and the LQR gain

Think about keeping a car in its lane. If you drift a little, you steer a little. Steer too gently and you wander; steer too hard and the ride is jerky and you waste effort. Every good driver finds a balance between "how far off am I" and "how hard am I working". A **linear-quadratic regulator**, or **LQR**, finds the best balance with a formula.

LQR assumes a linear model $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ and a **state-feedback** law: the command is a gain matrix times the state, $\mathbf{u} = -\mathbf{K}\mathbf{x}$. It picks $\mathbf{K}$ to make this total cost as small as possible:

$$
J = \int_0^{\infty} \left( \mathbf{x}^{\mathsf{T}}\mathbf{Q}\,\mathbf{x} + \mathbf{u}^{\mathsf{T}}\mathbf{R}\,\mathbf{u} \right) dt.
$$

- $\mathbf{Q}$ weights the errors. Big $\mathbf{Q}$ means "I hate being off".
- $\mathbf{R}$ weights the effort. Big $\mathbf{R}$ means "fuel and actuator travel are expensive".
- The integral runs forever (**infinite horizon**), so the gain never changes with time.

The optimal cost turns out to be $J_{\min} = \mathbf{x}_0^{\mathsf{T}}\mathbf{P}\,\mathbf{x}_0$, where $\mathbf{P}$ is a symmetric matrix called the **[[cost-to-go|cost-to-go]]** matrix: from any starting error $\mathbf{x}_0$, it tells you the total cost still ahead if you fly optimally from here. $\mathbf{P}$ is the solution of the **continuous algebraic Riccati equation** (CARE):

$$
\mathbf{A}^{\mathsf{T}}\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^{\mathsf{T}}\mathbf{P} + \mathbf{Q} = \mathbf{0}.
$$

"Algebraic" because there are no derivatives in it; **[[Riccati|riccati]]** after the mathematician who studied its one-number ancestor. It is quadratic in $\mathbf{P}$, so you cannot solve it by one matrix division. That is what `solve_continuous_are(A, B, Q, R)` does for you. It returns $\mathbf{P}$, and the gain comes from one more line:

$$
\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^{\mathsf{T}}\mathbf{P}.
$$

With that gain, the controlled system is $\dot{\mathbf{x}} = (\mathbf{A} - \mathbf{B}\mathbf{K})\mathbf{x}$. Its **closed-loop poles** — the eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}$ — say how fast and how smoothly errors die out. Every one has a negative real part for an LQR design, which means every error decays.

::: example A one-number Riccati equation by hand
A rocket's roll rate $\omega$ (in rad/s) slows by itself through air drag and is pushed by a roll torque $u$ (in N·m): $\dot{\omega} = -0.5\,\omega + 0.01\,u$. Take $Q = 1$ and $R = 10^{-4}$. Find the LQR gain.

**Write the scalar CARE.** With one number each, $A = a = -0.5$ and $B = b = 0.01$. The equation becomes $2ap - \dfrac{b^2}{R}p^2 + Q = 0$.

**Put in the numbers.** $\dfrac{b^2}{R} = \dfrac{0.0001}{0.0001} = 1$, so the equation reads $2(-0.5)p - p^2 + 1 = 0$. Tidy it up and flip every sign: $p^2 + p - 1 = 0$.

**Solve the quadratic.** $p = \dfrac{-1 \pm \sqrt{1 + 4}}{2}$. The cost-to-go must be positive, so take the plus sign: $p = \dfrac{-1 + \sqrt{5}}{2} \approx 0.618$.

**Form the gain.** $K = \dfrac{b\,p}{R} = \dfrac{0.01 \times 0.618}{0.0001} \approx 61.8\,\mathrm{N\,m}$ per rad/s.

**Check the closed loop.** The pole moves from $-0.5$ to $a - bK = -0.5 - 0.01 \times 61.8 \approx -1.118\,\mathrm{s^{-1}}$. Roll-rate errors now die out more than twice as fast as drag alone could manage. That makes sense: we paid some torque to get a faster response.
:::

Here is the matrix version on the simplest two-state plant, a coasting body with unit mass ($\ddot{x} = u$), where the answer is known in closed form: $\mathbf{P} = \begin{bmatrix}\sqrt{3} & 1\\ 1 & \sqrt{3}\end{bmatrix}$ and $\mathbf{K} = [1,\ \sqrt{3}]$.

```python
import numpy as np
from scipy import linalg

A = np.array([[0.0, 1.0],
              [0.0, 0.0]])
B = np.array([[0.0],
              [1.0]])
Q = np.eye(2)
R = np.array([[1.0]])                       # R must be 2-D, even when 1x1

P = linalg.solve_continuous_are(A, B, Q, R) # returns P, not K
K = np.linalg.solve(R, B.T @ P)             # K = R^-1 B^T P
print(np.round(P, 4))
print(np.round(K, 4))
print(np.round(linalg.eigvals(A - B @ K), 4))
residual = A.T @ P + P @ A - P @ B @ np.linalg.solve(R, B.T @ P) + Q
print(np.max(np.abs(residual)) < 1e-12)
# [[1.7321 1.    ]
#  [1.     1.7321]]
# [[1.     1.7321]]
# [-0.866+0.5j -0.866-0.5j]
# True
```

Three habits are packed in there. Form $\mathbf{K}$ with `np.linalg.solve(R, ...)` rather than `inv(R)`. Check the poles of $\mathbf{A} - \mathbf{B}\mathbf{K}$. And, once, plug $\mathbf{P}$ back into the equation to see the residual is round-off.

::: example Gains for a docking approach
A $2000\,\mathrm{kg}$ spacecraft closes on a docking port along one axis. State: position error (m) and closing-speed error (m/s). Input: thruster force (N). So $\mathbf{B} = [0,\ 1/2000]^{\mathsf{T}}$.

**Choose the weights with [[Bryson's rule|bryson]].** Put one over the square of the largest error you will accept on the diagonal. Accept $1\,\mathrm{m}$ of position error, $0.1\,\mathrm{m/s}$ of speed error and $20\,\mathrm{N}$ of thrust: $\mathbf{Q} = \mathrm{diag}(1/1^2,\ 1/0.1^2) = \mathrm{diag}(1, 100)$ and $R = 1/20^2 = 0.0025$.

**Solve and form the gain.**

```python
import numpy as np
from scipy import linalg

m = 2000.0                                   # kg
A = np.array([[0.0, 1.0],
              [0.0, 0.0]])
B = np.array([[0.0],
              [1.0 / m]])
Q = np.diag([1 / 1.0**2, 1 / 0.1**2])
R = np.array([[1 / 20.0**2]])
P = linalg.solve_continuous_are(A, B, Q, R)
K = np.linalg.solve(R, B.T @ P)
print(np.round(K, 1))
print(np.round(linalg.eigvals(A - B @ K), 4))
# [[ 20.  346.4]]
# [-0.0866+0.05j -0.0866-0.05j]
```

**Read the gain.** $K = [20,\ 346.4]$: each meter of position error asks for $20\,\mathrm{N}$, and each m/s of speed error asks for $346.4\,\mathrm{N}$.

**Sanity check.** A $1\,\mathrm{m}$ error alone asks for $20\,\mathrm{N}$, exactly the thrust we said we would accept for it. The poles have real part $-0.0866\,\mathrm{s^{-1}}$, a time constant of $1/0.0866 \approx 11.5\,\mathrm{s}$ — slow and gentle, which is how you want to approach a space station.
:::

### The discrete version

A flight computer runs its controller once per step, so you often design directly in discrete time with $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ (the $\mathbf{A}_d, \mathbf{B}_d$ that `expm` gave us above). The cost becomes a sum, and `solve_discrete_are(Ad, Bd, Q, R)` returns its $\mathbf{P}$. The gain formula changes, because the command is held for a whole step and $\mathbf{P}$ must account for where that step lands you:

$$
\mathbf{K} = \left(\mathbf{R} + \mathbf{B}_d^{\mathsf{T}}\mathbf{P}\mathbf{B}_d\right)^{-1}\mathbf{B}_d^{\mathsf{T}}\mathbf{P}\mathbf{A}_d.
$$

```python
import numpy as np
from scipy import linalg

dt = 0.1
Ad = np.array([[1.0, dt],
               [0.0, 1.0]])
Bd = np.array([[dt**2 / 2],
               [dt]])
Q = np.eye(2) * dt                          # a sum over steps ~ integral / dt
R = np.array([[1.0]]) * dt
P = linalg.solve_discrete_are(Ad, Bd, Q, R)
K = np.linalg.solve(R + Bd.T @ P @ Bd, Bd.T @ P @ Ad)
print(np.round(K, 3))
print(np.round(np.abs(linalg.eigvals(Ad - Bd @ K)), 3))
# [[0.917 1.636]]
# [0.917 0.917]
```

The discrete gain, $[0.917,\ 1.636]$, is a little softer than the continuous $[1,\ 1.732]$: a command held for $0.1\,\mathrm{s}$ does more than an instant one, so less of it is needed. A discrete system is stable when every eigenvalue of $\mathbf{A}_d - \mathbf{B}_d\mathbf{K}$ has size less than $1$; here both have size $0.917$.

::: key
Solving the algebraic Riccati equation gives the cost-to-go matrix $\mathbf{P}$ for an infinite-horizon LQR. The optimal gain is then $K = R^{-1}B^{\mathsf{T}}P$ (continuous) or $K = (R + B^{\mathsf{T}}PB)^{-1}B^{\mathsf{T}}PA$ (discrete). `scipy.linalg.solve_continuous_are` and `solve_discrete_are` compute $\mathbf{P}$; the closed-loop poles are the eigenvalues of $A - BK$.
:::

::: warning The solver returns P, not the gain
`solve_continuous_are` hands back the cost-to-go matrix. Using $\mathbf{P}$ as if it were $\mathbf{K}$ gives a matrix of the wrong shape in most problems, and in square cases a plausible-looking wrong controller. Always form $\mathbf{K}$ from $\mathbf{P}$, then check that every closed-loop pole has a negative real part (continuous) or size below $1$ (discrete). Also note the argument order is `(A, B, Q, R)`, and $\mathbf{R}$ must be a 2-D array even when it holds one number.
:::

## Check yourself

::: check
`linalg.cholesky(C)` on a $3 \times 3$ covariance returns a matrix whose entries below the diagonal are all zero. A teammate draws Monte Carlo errors with `x = linalg.cholesky(C) @ z`. What is wrong, and what are two fixes?
:::

::: answer
Without `lower=True`, SciPy returns the upper factor $\mathbf{U}$ with $\mathbf{C} = \mathbf{U}^{\mathsf{T}}\mathbf{U}$. Then $\mathbf{U}\mathbf{z}$ has covariance $\mathbf{U}\mathbf{U}^{\mathsf{T}}$, which is generally not $\mathbf{C}$, so the spreads and correlations of the samples are wrong. Fix it with `linalg.cholesky(C, lower=True) @ z`, or keep $\mathbf{U}$ and use `U.T @ z`. Either way, check `np.allclose(L @ L.T, C)` once.
:::

::: check
Factor $\mathbf{C} = \begin{bmatrix} 4 & 2 \\ 2 & 5 \end{bmatrix}$ by hand into $\mathbf{L}\mathbf{L}^{\mathsf{T}}$.
:::

::: answer
Top left: $\ell_{11}^2 = 4$, so $\ell_{11} = 2$. Off-diagonal: $2\,\ell_{21} = 2$, so $\ell_{21} = 1$. Bottom right: $1^2 + \ell_{22}^2 = 5$, so $\ell_{22}^2 = 4$ and $\ell_{22} = 2$. So $\mathbf{L} = \begin{bmatrix} 2 & 0 \\ 1 & 2 \end{bmatrix}$. Check: $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \begin{bmatrix} 4 & 2 \\ 2 & 1 + 4 \end{bmatrix}$, which is $\mathbf{C}$.
:::

::: check
A fit matrix $\mathbf{A}$ has condition number $10^5$. About how many significant digits can the normal equations lose, compared with QR? Why?
:::

::: answer
QR works with $\mathbf{R}$, which has the same condition number as $\mathbf{A}$, about $10^5$: up to about five digits lost out of sixteen. The normal equations solve with $\mathbf{A}^{\mathsf{T}}\mathbf{A}$, whose condition number is the square, $10^{10}$: up to about ten digits lost. Squaring the condition number doubles the digits lost.
:::

::: check
For the coasting body $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$, what is `expm(A * 2.0)`, and what is `np.exp(A * 2.0)`? Which one moves a state forward in time?
:::

::: answer
Since $\mathbf{A}^2 = \mathbf{0}$, the series stops: $e^{2\mathbf{A}} = \mathbf{I} + 2\mathbf{A} = \begin{bmatrix} 1 & 2 \\ 0 & 1 \end{bmatrix}$, meaning "position grows by velocity times $2\,\mathrm{s}$". `np.exp(A * 2.0)` exponentiates each entry: $\begin{bmatrix} e^0 & e^2 \\ e^0 & e^0 \end{bmatrix} \approx \begin{bmatrix} 1 & 7.39 \\ 1 & 1 \end{bmatrix}$, which is meaningless as dynamics. Only `expm` is the state transition matrix.
:::

::: check
In the roll-rate example, what happens to the gain if torque becomes four times more expensive, $R = 4 \times 10^{-4}$? Work it out.
:::

::: answer
Now $b^2/R = 0.0001 / 0.0004 = 0.25$, so the CARE is $2(-0.5)p - 0.25p^2 + 1 = 0$, or $0.25p^2 + p - 1 = 0$. Multiply by $4$: $p^2 + 4p - 4 = 0$, so $p = \dfrac{-4 + \sqrt{16 + 16}}{2} = -2 + 2\sqrt{2} \approx 0.828$. The gain is $K = bp/R = 0.01 \times 0.828 / 0.0004 \approx 20.7$, down from $61.8$. The closed-loop pole is $-0.5 - 0.01 \times 20.7 \approx -0.707\,\mathrm{s^{-1}}$: slower, because effort now costs more.
:::

## Summary

| Tool | What it gives | Remember |
|---|---|---|
| `linalg.cholesky(C, lower=True)` | $\mathbf{L}$ with $\mathbf{C} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$ | Default is upper; fails if not positive definite |
| Correlated samples | $\mathbf{x} = \mathbf{L}\mathbf{z}$ | $\mathbf{z}$ independent standard normal |
| `linalg.qr(A, mode="economic")` | $\mathbf{A} = \mathbf{Q}\mathbf{R}$ | Solve $\mathbf{R}\mathbf{x} = \mathbf{Q}^{\mathsf{T}}\mathbf{b}$; avoids squaring the condition number |
| `linalg.expm(A * t)` | State transition matrix $e^{\mathbf{A}t}$ | Not `np.exp`; stacked with $\mathbf{B}$ it gives $\mathbf{A}_d, \mathbf{B}_d$ |
| `solve_continuous_are(A, B, Q, R)` | Cost-to-go $\mathbf{P}$ | $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^{\mathsf{T}}\mathbf{P}$ |
| `solve_discrete_are(Ad, Bd, Q, R)` | Discrete $\mathbf{P}$ | $\mathbf{K} = (\mathbf{R} + \mathbf{B}^{\mathsf{T}}\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^{\mathsf{T}}\mathbf{P}\mathbf{A}$ |
| Closed-loop poles | eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}$ | Negative real part (continuous), size below 1 (discrete) |

The next lesson turns from matrices to signals: how `scipy.signal` designs a filter, why running it forwards and backwards removes its delay, and how a Welch spectrum finds a vibration buried in noise.

::: context positive-definite What positive definite means
A matrix $\mathbf{C}$ is positive definite when $\mathbf{v}^{\mathsf{T}}\mathbf{C}\mathbf{v} > 0$ for every nonzero vector $\mathbf{v}$. For a covariance, $\mathbf{v}^{\mathsf{T}}\mathbf{C}\mathbf{v}$ is the variance of the error measured along the direction $\mathbf{v}$, so the rule says: in every direction, the error has some spread. Picture the cloud of possible errors as an ellipse. Positive definite means the ellipse has real width in every direction. A zero eigenvalue would squash it flat to a line; a negative one describes no cloud at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <ellipse cx="90" cy="65" rx="70" ry="25" transform="rotate(-25 90 65)" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="90" cy="65" r="3" fill="#1f2a44"/>
  <text x="90" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">positive definite</text>
  <line x1="206.6" y1="94.6" x2="333.4" y2="35.4" stroke="#b4232c" stroke-width="3"/>
  <circle cx="270" cy="65" r="3" fill="#1f2a44"/>
  <text x="270" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">zero eigenvalue: flat</text>
</svg>
```
:::

::: context monte-carlo Many runs with random errors
A Monte Carlo simulation runs the same flight hundreds or thousands of times, each with different random errors in sensors, engines, winds and mass. Instead of one answer you get a spread of answers, and you report how often the vehicle stays inside its limits. The name comes from the casino in Monaco, a nod to rolling dice. It was coined in the 1940s by scientists at Los Alamos who used random sampling to study neutrons. Lesson 10 of this module is about reporting those spreads with percentiles.
:::

::: context condition-number How much errors can grow
The condition number compares the most a matrix can stretch a vector to the least it can. If one direction is stretched by $10^6$ and another by $1$, a tiny error in the small direction can look, after solving, as large as the real signal. A double holds about $16$ significant digits, and you lose about $\log_{10}$ of the condition number of them. Lesson 3 met the same idea from the optimizer's side: badly scaled decision variables give a badly conditioned problem.
:::

::: context orthonormal Why orthonormal columns are safe
Orthonormal columns act like a rotation or a reflection: they turn vectors without stretching them. A rotation keeps every length and every angle, so it cannot make an error grow. That is why working with $\mathbf{Q}$ costs no accuracy, and all the conditioning trouble stays in $\mathbf{R}$, where it is no worse than in $\mathbf{A}$ itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="160" y2="130" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="130" x2="40" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="130" x2="130" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="40" y1="130" x2="40" y2="40" stroke="#b4232c" stroke-width="3"/>
  <text x="100" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">before</text>
  <text x="200" y="85" font-size="18" text-anchor="middle" fill="#1f2a44">→</text>
  <line x1="250" y1="130" x2="350" y2="130" stroke="#6c7a93" stroke-width="1"/>
  <line x1="250" y1="130" x2="250" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <line x1="250" y1="130" x2="327.9" y2="85" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="250" y1="130" x2="205" y2="52.1" stroke="#b4232c" stroke-width="3"/>
  <text x="290" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">after a turn</text>
</svg>
```

Both arrows are $90$ units long before and after a $30°$ turn, and they still meet at a right angle.
:::

::: context state-transition The navigator's name for expm
In a navigation filter, $\boldsymbol{\Phi}$ carries both the state estimate and its uncertainty from one time step to the next. The covariance update is $\mathbf{C}_{k+1} = \boldsymbol{\Phi}\,\mathbf{C}_k\,\boldsymbol{\Phi}^{\mathsf{T}} + \text{process noise}$. For a model whose $\mathbf{A}$ is constant over the step, $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ exactly. Flight code often uses a two- or three-term series for speed, which is fine when $\mathbf{A}\Delta t$ is small; `expm` is the reference you check it against.
:::

::: context structural-mode A structure that rings like a bell
Every flexible part of a spacecraft — a solar array, an antenna boom, a long fuel tank — has natural frequencies at which it likes to vibrate. Each is a structural mode. Tap the structure and it rings at those frequencies, dying out slowly because space structures have very little damping, often $0.5$ to $2\%$. Control engineers must keep their loops from exciting these modes, which is where lessons 5 and 6 come in.
:::

::: context van-loan A trick from 1978
Charles Van Loan, a numerical analyst at Cornell, published this block-matrix method in 1978 in a paper on computing integrals that involve the matrix exponential. Before it, getting $\mathbf{B}_d = \int_0^{\Delta t} e^{\mathbf{A}s}\,ds\,\mathbf{B}$ needed either an inverse of $\mathbf{A}$ (which fails when $\mathbf{A}$ is singular, as it is for a coasting body) or a separate numerical integral. The same block idea also gives the discrete process-noise matrix for a Kalman filter.
:::

::: context cost-to-go The cost still ahead
Picture a hiker who knows, from any spot on the mountain, how much effort the best route home will still take. That lookup is the cost-to-go. In LQR it has a simple shape: a quadratic bowl $\mathbf{x}^{\mathsf{T}}\mathbf{P}\,\mathbf{x}$. The optimal command at every instant is the one that rolls you down that bowl as cheaply as possible, which is why the gain is built from $\mathbf{P}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="125" x2="330" y2="125" stroke="#6c7a93" stroke-width="1"/>
  <path d="M60,25 Q180,225 300,25" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="180" cy="125" r="5" fill="#1f2a44"/>
  <text x="180" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">x = 0, cost 0</text>
  <circle cx="270" cy="69" r="6" fill="#b4232c"/>
  <text x="282" y="73" font-size="12" fill="#b4232c">x₀</text>
  <text x="180" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">cost still ahead = x₀ᵀ P x₀</text>
</svg>
```
:::

::: context riccati Where the name comes from
Jacopo Riccati was an Italian mathematician of the early 1700s. He studied equations like $\dot{y} = a + by + cy^2$, where the unknown appears squared. The matrix version showed up in 1960, when Rudolf Kalman worked out the optimal linear regulator and the optimal estimator — the Kalman filter — and found the same quadratic matrix equation at the heart of both.
:::

::: context bryson A starting point for weights
Bryson's rule, named after Stanford's Arthur Bryson, sets each diagonal weight to one over the square of the largest acceptable value of that quantity. It puts every error and every actuator on a common "fraction of what I can tolerate" scale, which is the same scaling idea as lesson 3. It is a first guess, not the final answer: engineers then tune the weights while watching simulated responses.
:::
