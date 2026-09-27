---
id: l01-the-extended-kalman-filter
title: The Extended Kalman Filter — linearizing about the estimate
minutes: 25
covers:
  - 'The Extended Kalman Filter: linearization about the current estimate, Jacobians F and H, first-order truncation error'
---

Stand in a big field and look around. The ground looks flat. You know the Earth is round, but the piece you can see is so small compared with the whole planet that "flat" is an excellent description of it. Walk a hundred kilometers and "flat" starts to fail. Up close, almost any curve looks like a straight line.

The Kalman filter from the last module only knows straight lines. Its dynamics are a matrix times the state, and its sensor is another matrix times the state. Real vehicles are not like that. A radar reports range and bearing, not east and north. A star tracker reports a direction. An orbit bends under an inverse-square pull. The **Extended Kalman Filter** (**EKF**) — the Kalman filter adapted to curved, nonlinear problems — handles them with the field trick: zoom in on the curve at the spot where you think you are, and treat it as straight *there*.

The EKF is the oldest answer to "what do I do when the world curves", and still the most common. It grew out of the navigation work for [[Apollo|apollo-origin]] in the early 1960s, and versions of it run in spacecraft, aircraft, drones and phones today. This lesson writes it down, builds the two slope tables it needs (the Jacobians $\mathbf F$ and $\mathbf H$), and measures exactly what the "treat it as straight" step throws away.

## When the world is not a straight line

Write the model the way the Kalman filter module did, but let the two rules be any smooth functions:

$$
\mathbf{x}_k = \mathbf{f}(\mathbf{x}_{k-1}, \mathbf{u}_{k-1}) + \mathbf{w}_{k-1}, \qquad \mathbf{z}_k = \mathbf{h}(\mathbf{x}_k) + \mathbf{v}_k.
$$

Read $\mathbf f$ as "the motion rule": it takes the state at the last step and the control input $\mathbf u$ and returns the state now. Read $\mathbf h$ as "the sensor rule": it takes the state and returns what the sensor should read. The noises are exactly as before: $\mathbf{w}_{k-1}\sim\mathcal N(\mathbf 0,\mathbf Q_{k-1})$ and $\mathbf{v}_k\sim\mathcal N(\mathbf 0,\mathbf R_k)$, white and independent of each other. Only $\mathbf f$ and $\mathbf h$ have changed. They are no longer matrices. They can be a coordinate change, a $1/r^2$ gravity law, or an $\operatorname{atan2}$.

That one change breaks a step the linear filter relied on. The linear filter predicted the mean with $\mathbf F\hat{\mathbf x}$, because the **average** of a matrix times something is the matrix times the average. For a curved function that is false:

$$
\mathbb E[\mathbf f(\mathbf x)] \neq \mathbf f(\mathbb E[\mathbf x]) \quad\text{in general.}
$$

(Read $\mathbb E[\cdot]$ as "the expected value of", the average over all the ways things could turn out.) Here is the simplest case. Let $x$ be a random number with average $0$ and standard deviation $1$, and let $f(x)=x^2$. Then $f$ of the average is $0^2 = 0$. But $x^2$ is never negative, and its average is the variance, $1$. The [[curve bends the average|jensen-bend]] away from where the straight-line thinking puts it.

The EKF's answer is an honest approximation. Assume the state is packed closely enough around the estimate $\hat{\mathbf x}$ that the two sides are nearly equal. Then push the single best-guess point through the true $\mathbf f$, instead of trying to push the whole spread of possibilities through it.

## Zooming in: the Jacobians F and H

To zoom in on a curve you need its slope. For a function of one number, that is the derivative. For a function of several numbers that returns several numbers, you need a slope for every pair — "how much does output $i$ change when I nudge input $j$". Arrange those slopes in a table and you have the **[[Jacobian|jacobi-name]]** matrix: the best straight-line (linear) stand-in for a curved function near one chosen point.

For a sensor rule $\mathbf h$ that takes $n$ state numbers and returns $m$ readings, the Jacobian $\mathbf H$ has $m$ rows and $n$ columns. Its entry in row $i$, column $j$ is $\partial h_i/\partial x_j$, read "partial h i by partial x j": the slope of output $i$ when only input $j$ moves and the others are held still. Every entry is worked out at one specific point.

Which point? This is the heart of the whole lesson. The EKF works out $\mathbf H_k$ at $\hat{\mathbf x}_k^-$, its own prediction. It cannot use the true state $\mathbf x_k$, because nobody ever gets to see the truth — the filter included. $\mathbf F_{k-1}$ is worked out at $\hat{\mathbf x}_{k-1}^+$ for the same reason. The Jacobian answers "if I nudge the state a little, starting from *here*, how does the output change?" — and "here" is always the filter's best current guess, because that is the only point it has.

::: key The Extended Kalman Filter
$$
\hat{\mathbf x}_k^- = \mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1}), \qquad \mathbf P_k^- = \mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T} + \mathbf Q_{k-1},
$$
$$
\boldsymbol\nu_k = \mathbf z_k - \mathbf h(\hat{\mathbf x}_k^-), \qquad \mathbf H_k = \left.\frac{\partial \mathbf h}{\partial \mathbf x}\right|_{\hat{\mathbf x}_k^-}, \qquad \mathbf S_k = \mathbf H_k\mathbf P_k^-\mathbf H_k^{\mathsf T}+\mathbf R_k,
$$
$$
\mathbf K_k = \mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}, \qquad \hat{\mathbf x}_k^+ = \hat{\mathbf x}_k^- + \mathbf K_k\boldsymbol\nu_k, \qquad \mathbf P_k^+ = (\mathbf I-\mathbf K_k\mathbf H_k)\mathbf P_k^-,
$$
with $\mathbf F_{k-1}=\left.\dfrac{\partial \mathbf f}{\partial \mathbf x}\right|_{\hat{\mathbf x}_{k-1}^+,\,\mathbf u_{k-1}}$. The mean is carried through the true nonlinear $\mathbf f$ and $\mathbf h$; only $\mathbf P$'s transformation is linearized.
:::

::: key EKF in one line
Run the Kalman equations with $\mathbf F = \partial\mathbf f/\partial\mathbf x$ and $\mathbf H = \partial\mathbf h/\partial\mathbf x$ evaluated at the current estimate, but propagate the MEAN through the nonlinear functions $\mathbf f$ and $\mathbf h$, not through the Jacobians.
:::

Read the first block slowly. Every symbol does the same job it did in the predict-and-update lesson. $\hat{\mathbf x}_k^-$ ("x hat k minus") is still the prediction before the reading. $\mathbf P_k^+$ is still the covariance after it. $\boldsymbol\nu_k$ ("nu k") is still the **innovation**, the surprise in the reading. $\mathbf K_k$ is still the gain that sets how far to trust the reading over the prediction. The gain formula and the covariance update have the same shape as before. Two things are new. The mean now goes through the real $\mathbf f$ and $\mathbf h$. And $\mathbf F$ and $\mathbf H$ are now slope tables, recomputed at the current estimate.

::: example The bearing sensor's Jacobian
A **bearing-only** sensor reports only the direction to a target, not its distance — think of hearing a sound and pointing at it. Take the state $\mathbf x=(x,\,y,\,\dot x,\,\dot y)^{\mathsf T}$: the target's position and velocity relative to the observer ($\dot x$ is read "x dot", the speed in $x$). The reading is the angle $h(\mathbf x)=\operatorname{atan2}(y,x)$, the [[four-quadrant arctangent|atan2-recall]].

**Step 1: the slopes.** Write $r^2=x^2+y^2$ for the squared distance. Ordinary calculus gives

$$
\frac{\partial h}{\partial x} = \frac{-y}{x^2+y^2}, \qquad \frac{\partial h}{\partial y} = \frac{x}{x^2+y^2}, \qquad \frac{\partial h}{\partial \dot x}=\frac{\partial h}{\partial \dot y}=0.
$$

The last two are zero because the angle does not depend on speed. So $\mathbf H(\mathbf x) = \left(-y/r^2,\ \ x/r^2,\ \ 0,\ \ 0\right)$.

**Step 2: a number.** Take the estimate $\hat{\mathbf x}=(812,\ 431,\ -60,\ 15)^{\mathsf T}$, positions in meters and speeds in m/s. The distance is $r=\sqrt{812^2+431^2}=919.30\,\mathrm m$, so $r^2 = 845\,105\,\mathrm{m^2}$. Divide:

$$
\mathbf H(\hat{\mathbf x}) = \left(-0.00051000,\ \ 0.00096083,\ \ 0,\ \ 0\right)\ \mathrm{rad/m}.
$$

**Step 3: check it.** A **[[central finite difference|finite-difference]]** nudges each input up and down by a tiny $\epsilon=10^{-6}\,\mathrm m$ and measures the slope directly: $\left[h(\hat{\mathbf x}+\epsilon\mathbf e_i)-h(\hat{\mathbf x}-\epsilon\mathbf e_i)\right]/2\epsilon$, where $\mathbf e_i$ is a vector with a $1$ in slot $i$ and zeros elsewhere. It gives the same four numbers; the biggest disagreement is $9.3\times10^{-12}$.

**Sanity check.** The units are radians per meter, as a slope of angle against position should be. And $1/r = 0.00109\,\mathrm{rad/m}$ is the size of the whole row, $\sqrt{0.00051^2+0.00096^2}$: one meter of sideways motion at $919\,\mathrm m$ turns the bearing by about a thousandth of a radian.
:::

This check is how engineers catch a wrong Jacobian before it reaches a filter. Code the finite difference once, compare it with the hand-derived formula at a few random states, and treat any disagreement much bigger than the step size as a bug in the formula.

```python
import numpy as np

def h(x):
    return np.array([np.arctan2(x[1], x[0])])

def H_analytic(x):
    r2 = x[0]**2 + x[1]**2
    return np.array([[-x[1]/r2, x[0]/r2, 0.0, 0.0]])

def H_finite_diff(x, eps=1e-6):
    H = np.zeros((1, len(x)))
    for i in range(len(x)):
        dx = np.zeros(len(x)); dx[i] = eps
        H[:, i] = (h(x+dx) - h(x-dx)) / (2*eps)
    return H

x0 = np.array([812.0, 431.0, -60.0, 15.0])
print(H_analytic(x0))
print(H_finite_diff(x0))
print(np.max(np.abs(H_analytic(x0) - H_finite_diff(x0))))
# [[-0.00051     0.00096083  0.          0.        ]]
# [[-0.00051     0.00096083  0.          0.        ]]
# 9.303408195736329e-12
```

The two Jacobians are built the same way but do different jobs. $\mathbf H_k$ says how sensitive this reading is to each part of the state, near the prediction. It decides which combinations of the state this sensor can see, as the linear $\mathbf H$ did — but now that sensitivity changes from one estimate to the next. $\mathbf F_{k-1}$ says how a small error in the last estimate grows or shrinks by now. For a curved $\mathbf f$, $\mathbf F$ depends on the state, so the covariance step $\mathbf P_k^-=\mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T}+\mathbf Q_{k-1}$ uses a *different* $\mathbf F_{k-1}$ almost every cycle.

::: example A pendulum's Jacobian, and how fast it changes
A swinging pendulum of length $L$ obeys $\ddot\theta = -(g_0/L)\sin\theta$. Here $\theta$ is the angle from straight down and $\ddot\theta$ ("theta double dot") is its angular acceleration. A [[pendulum|pendulum-model]] is the classic small test problem for nonlinear filters.

**Step 1: write it as a state.** Use $\mathbf x=(\theta,\omega)^{\mathsf T}$, with $\omega$ ("omega") the swing rate. Then

$$
\dot{\mathbf x}=\mathbf f(\mathbf x)=\begin{pmatrix}\omega \\ -(g_0/L)\sin\theta\end{pmatrix}.
$$

**Step 2: take the slopes.** The top row depends only on $\omega$, with slope $1$. The bottom row depends only on $\theta$; the derivative of $\sin\theta$ is $\cos\theta$. So

$$
\mathbf F(\mathbf x) = \frac{\partial \mathbf f}{\partial \mathbf x} = \begin{pmatrix}0 & 1\\ -(g_0/L)\cos\theta & 0\end{pmatrix}.
$$

**Step 3: numbers.** Take $L=1\,\mathrm m$ and $g_0=9.80665\,\mathrm{m/s^2}$. The bottom-left entry, $F_{21}$, is:

- at $\theta=5^\circ$: $-9.80665\cos 5^\circ = -9.76933\,\mathrm{s^{-2}}$;
- at $\theta=60^\circ$: $-9.80665 \times 0.5 = -4.903325\,\mathrm{s^{-2}}$;
- at $\theta=90^\circ$: exactly $0$, because $\cos 90^\circ = 0$.

**What it means.** $F_{21}$ is the restoring pull on a small error. Over one quarter of a swing it halves and then vanishes. A filter that worked out $\mathbf F$ once and reused it would be steering by a slope that is no longer true.
:::

## What the straight line leaves out: first-order truncation error

Zooming in always drops something. **[[Taylor's theorem|taylor-name]]** says exactly what. Write $\boldsymbol\delta = \mathbf x-\hat{\mathbf x}$ ("delta") for how far the truth sits from the estimate. For a single-output $h$,

$$
h(\mathbf x) = h(\hat{\mathbf x}) + \mathbf H\boldsymbol\delta + \underbrace{\tfrac12\boldsymbol\delta^{\mathsf T}\nabla^2h(\hat{\mathbf x})\,\boldsymbol\delta + O(\|\boldsymbol\delta\|^3)}_{\text{first-order truncation error}}.
$$

The first term is the value at the estimate. The second is the straight-line correction, with $\mathbf H=\nabla h(\hat{\mathbf x})^{\mathsf T}$, the row of slopes. The rest is the bend. $\nabla^2 h$ ("the Hessian of h") is the table of second derivatives — how fast the slopes themselves change — and $O(\|\boldsymbol\delta\|^3)$, read "order delta cubed", means "terms that shrink at least as fast as the cube of the distance".

The EKF keeps the first two terms and throws away the rest. That leftover is the **first-order truncation error**. It is real, and it does not vanish because the filter ignores it. The filter is **first-order accurate**: exact only in the limit where $\boldsymbol\delta$ goes to zero. How big the leftover gets depends on two things you can reason about:

- how sharply $h$ curves near the estimate (the size of $\nabla^2 h$), and
- how far the truth usually sits from the estimate (the size of $\boldsymbol\delta$), which the filter's own $\mathbf P$ reports.

::: example The bearing sensor's truncation error
Go back to the bearing sensor at $\hat{\mathbf x}$, where $r_0=919.30\,\mathrm m$ and the bearing is $\theta_0=27.959^\circ$. Move the target a distance $s$ purely **[[cross-range|cross-range-picture]]** — sideways, at right angles to the line of sight.

**Step 1: the exact answer.** Sideways by $s$ at distance $r_0$ makes a right triangle, so the true bearing is exactly $\theta_0+\arctan(s/r_0)$. No approximation.

**Step 2: the straight-line answer.** For a sideways move, the slope of bearing is $1/r_0$, so the linear prediction is $\theta_0+s/r_0$.

**Step 3: the difference.** The truncation error is $\arctan(s/r_0)-s/r_0$. The arctangent's own series is $\arctan u = u - u^3/3 + u^5/5 - \dots$, so

$$
\arctan(s/r_0)-s/r_0 = -\tfrac13(s/r_0)^3+O\!\left((s/r_0)^5\right).
$$

It starts at the *cube* of the offset, not the square. The squared term cancels by symmetry: moving left or right by the same amount turns the bearing by equal amounts in opposite directions, so the error has no lopsided, squared part.

**Step 4: numbers.** At $s=150\,\mathrm m$, $s/r_0=0.1632$. The true bearing is $0.649717\,\mathrm{rad}$, the straight line says $0.651142\,\mathrm{rad}$, and the error is $-1.425\,\mathrm{mrad}$ (milliradians, thousandths of a radian). The cubic term alone predicts $-\tfrac13(0.16317)^3=-1.448\times10^{-3}\,\mathrm{rad}$. Close; the small gap is the next, fifth-power term. At $s=10\,\mathrm m$ the error is only $-4.29\times10^{-7}\,\mathrm{rad}$.

**Sanity check.** Fifteen times less offset gave about $1425/0.429 \approx 3300$ times less error, close to $15^3 = 3375$. That is cubic scaling. And a move purely *along* the line of sight changes the distance but not the direction at all, so there the straight line is exact — the code confirms zero error to machine precision.
:::

```python
import numpy as np

x0 = np.array([812.0, 431.0, -60.0, 15.0])
r0 = np.hypot(x0[0], x0[1])
theta0 = np.arctan2(x0[1], x0[0])
u_cross = np.array([-np.sin(theta0), np.cos(theta0), 0, 0])

for s in [10, 30, 60, 100, 150]:
    true_b = np.arctan2(*(x0 + s*u_cross)[[1, 0]])
    lin_b = theta0 + s/r0
    print(s, true_b - lin_b, -(s/r0)**3/3)
# 10  -4.29024315e-07  -4.29054774e-07
# 30  -1.15770823e-05  -1.15844789e-05
# 60  -9.24396798e-05  -9.26758312e-05
# 100 -4.26034121e-04  -4.29054774e-04
# 150 -1.42535904e-03  -1.44805986e-03
```

::: example The pendulum: bend, and a slope gone stale
Now ask how well straight lines predict where a *nearby* pendulum ends up. Start one pendulum at rest at $\theta_0$ and a second one $\delta\theta_0=2^\circ$ further out. After $\Delta t = 1\,\mathrm s$, about half a swing, measure how far apart they are, $\Delta\theta$. Compare two straight-line predictions:

- **$\mathbf F$ frozen at the start**: work out $\mathbf F(\theta_0)$ once and use the [[state transition matrix|stm-meaning]] $\exp(\mathbf F(\theta_0)\,\Delta t)$ for the whole second.
- **$\mathbf F$ following the swing**: chain together many tiny straight-line steps, each using $\mathbf F$ at the first pendulum's angle at that moment.

Errors are prediction minus truth, in millidegrees ($1\,\mathrm{mdeg} = 0.001^\circ$):

| $\theta_0$ | true $\Delta\theta$ after 1 s | error, $\mathbf F$ frozen | error, $\mathbf F$ following |
| --- | --- | --- | --- |
| $5^\circ$ | $-1.99974^\circ$ | $0.001\ \mathrm{mdeg}$ | $-0.054\ \mathrm{mdeg}$ |
| $30^\circ$ | $-1.98045^\circ$ | $31.9\ \mathrm{mdeg}$ | $-2.20\ \mathrm{mdeg}$ |
| $60^\circ$ | $-1.76284^\circ$ | $563\ \mathrm{mdeg}$ | $-14.2\ \mathrm{mdeg}$ |
| $90^\circ$ | $-0.97634^\circ$ | $2976\ \mathrm{mdeg}$ | $-40.2\ \mathrm{mdeg}$ |

(The true gap is negative because after half a swing the outer pendulum is on the other side.)

**Reading the right-hand column.** This is pure truncation error: the straight line is re-aimed at every instant, and all that is lost is the bend. It is tiny near the bottom and grows about $740$ times from $5^\circ$ to $90^\circ$, only because $\sin\theta$ curves more over the $2^\circ$ gap there.

**Reading the frozen column.** It is far worse at large angles. At $90^\circ$, the frozen $F_{21}=0$ says there is no pull back at all, so it predicts the gap stays $+2^\circ$. The truth is $-0.98^\circ$. The error, nearly $3^\circ$, is bigger than the nudge itself. Most of this is not bend; it is a slope that went stale as the pendulum swung. The next lesson is about fixing exactly that.
:::

```python
import numpy as np
from scipy.integrate import solve_ivp
from scipy.linalg import expm

g0 = 9.80665
def rhs(t, y):  # pendulum plus its along-the-swing transition matrix
    th, om = y[:2]; Phi = y[2:].reshape(2, 2)
    F = np.array([[0, 1], [-g0*np.cos(th), 0]])
    return np.concatenate([[om, -g0*np.sin(th)], (F @ Phi).ravel()])

d = np.radians(2.0)
for t0 in [5, 30, 60, 90]:
    th = np.radians(t0)
    y = solve_ivp(rhs, [0, 1], [th, 0, 1, 0, 0, 1], method='DOP853', rtol=1e-12, atol=1e-12).y[:, -1]
    y2 = solve_ivp(rhs, [0, 1], [th + d, 0, 1, 0, 0, 1], method='DOP853', rtol=1e-12, atol=1e-12).y[:, -1]
    true_gap = y2[0] - y[0]
    frozen = (expm(np.array([[0, 1], [-g0*np.cos(th), 0]])) @ [d, 0])[0]
    follow = (y[2:].reshape(2, 2) @ [d, 0])[0]
    print(t0, np.degrees(true_gap), 1000*np.degrees(frozen - true_gap), 1000*np.degrees(follow - true_gap))
# 5  -1.99974  0.0008   -0.054
# 30 -1.98045  31.913   -2.195
# 60 -1.76284  562.766  -14.204
# 90 -0.97634  2976.335 -40.174
```

::: key First-order truncation error
The EKF keeps the constant and linear terms of a Taylor expansion of $\mathbf f$ and $\mathbf h$ about the current estimate and drops the rest. The dropped remainder is $O(\|\boldsymbol\delta\|^2)$ in general (cubic in special symmetric directions, as the bearing example shows) and grows with both the size of the state spread $\boldsymbol\delta$ and the local curvature of $\mathbf f$ or $\mathbf h$. Nothing in the filter's own reported $\mathbf P$ accounts for this term — it is gone entirely.
:::

::: note Why the leftover starts at the square
Taylor's theorem for one variable says $h(\hat x+\delta) = h(\hat x) + h'(\hat x)\,\delta + \tfrac12 h''(\xi)\,\delta^2$ for some point $\xi$ between $\hat x$ and $\hat x+\delta$. The straight line matches the first two terms exactly, so what is left is exactly $\tfrac12 h''(\xi)\,\delta^2$. If the bend $h''$ is at most some number $M$ near the estimate, the leftover is at most $\tfrac12 M\delta^2$. Halve the distance and the error drops to a quarter. Only when $h''$ happens to be zero at the estimate — as for a sideways move on the bearing sensor — does the leftover start one power higher, at $\delta^3$.
:::

## Why the evaluation point is the whole story

Look once more at where $\mathbf F_{k-1}$ and $\mathbf H_k$ are worked out: at $\hat{\mathbf x}_{k-1}^+$ and $\hat{\mathbf x}_k^-$, the filter's own guesses.

A linear Kalman filter never faces this question. Its $\mathbf F$ and $\mathbf H$ do not depend on the state. They are fixed and correct whether the current guess is close to the truth or badly off. An EKF has no such luxury. Its slopes are only as good as the point they are taken at, and the only point it has is its own belief, which may be wrong.

Suppose the prediction sits where the true curve bends sharply, or far from where the truth really is. Then $\mathbf H_k$ measures the sensitivity *there*, not at the truth. Every later number in the update — $\mathbf S_k$, $\mathbf K_k$, $\mathbf P_k^+$ — inherits the mismatch, and nothing in the algebra raises a flag. Linearizing about the estimate, never the truth, is the thread the rest of this module pulls on.

::: warning Linearize the covariance, not the mean
A common first-implementation bug predicts the *mean* with $\mathbf F\hat{\mathbf x}$ instead of $\mathbf f(\hat{\mathbf x})$, as if the EKF were a linear filter with a changing $\mathbf F$. That throws away the accuracy the EKF is built to keep. The mean should go through the *true* nonlinear function; the straight-line stand-in is only for how the *covariance* changes. The error builds silently, because nothing in the covariance update shows that the mean is now wrong.
:::

::: warning A Jacobian worked out once is not good forever
Because $\mathbf F$ and $\mathbf H$ usually depend on the state, a Jacobian that was right at start-up can be badly wrong ten seconds later, once the state has moved somewhere with a different bend. The pendulum's $F_{21}$ went from $-9.77$ to $-4.90$ to $0\,\mathrm{s^{-2}}$ in a quarter swing. Every cycle needs its own Jacobian, at the current estimate — never a stored one from an easier moment.
:::

## Check yourself

::: check
Write the EKF predict step for a general nonlinear $\mathbf f$. Say exactly which part uses $\mathbf f$ itself and which part uses $\mathbf F$.
:::

::: answer
The mean: $\hat{\mathbf x}_k^- = \mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1})$. This uses the true nonlinear function, with no straight-line approximation.

The covariance: $\mathbf P_k^- = \mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T}+\mathbf Q_{k-1}$. This uses only the Jacobian $\mathbf F_{k-1}=\partial\mathbf f/\partial\mathbf x$, worked out at $\hat{\mathbf x}_{k-1}^+$. The covariance is moved as if $\mathbf f$ were the straight-line map $\mathbf F_{k-1}$ near that point. That is the filter's one approximation.
:::

::: check
A range-only sensor reads $h(\mathbf x)=\sqrt{x^2+y^2}$ instead of the bearing. Find its Jacobian $\mathbf H$ with respect to $\mathbf x=(x,y,\dot x,\dot y)^{\mathsf T}$.
:::

::: answer
Write $r=(x^2+y^2)^{1/2}$. By the chain rule, $\partial r/\partial x = \tfrac12(x^2+y^2)^{-1/2}\cdot 2x = x/r$, and in the same way $\partial r/\partial y = y/r$. The speeds do not appear in $h$, so those two slopes are zero:

$$
\mathbf H(\mathbf x) = (x/r,\ \ y/r,\ \ 0,\ \ 0).
$$

The position part is a unit vector pointing from the observer toward the target — the direction in which the range changes fastest. That picture is worth keeping next to the algebra.
:::

::: check
Without redoing any arithmetic, explain why a move purely along the line of sight gave zero truncation error for the bearing sensor, while a sideways move gave a nonzero, cubic error.
:::

::: answer
A bearing sensor reads only direction. Sliding the target along the line it already sits on changes the distance but not the direction, so the bearing is exactly constant in that direction. Every slope and every bend along that direction is zero, and the straight line is exact, not merely close.

Sideways is the direction the bearing really responds to. $\mathbf H$ captures the first slope exactly, but $\theta_0+\arctan(s/r_0)$ is not a straight line in $s$, so something is left over. Because left and right are symmetric, the square term cancels and the leftover starts at the cube.
:::

::: check
At a new estimate, a sensor's Jacobian is ten times larger than one cycle ago, while $\mathbf P$ is almost the same. What happens to $\mathbf S_k$ and $\mathbf K_k$? Why is that dangerous if the new, larger Jacobian is itself inaccurate?
:::

::: answer
$\mathbf S_k=\mathbf H_k\mathbf P_k^-\mathbf H_k^{\mathsf T}+\mathbf R_k$ contains $\mathbf H$ twice. Ten times larger $\mathbf H$ makes the $\mathbf H_k\mathbf P_k^-\mathbf H_k^{\mathsf T}$ part about $10^2 = 100$ times larger, before $\mathbf R_k$ is added. That changes $\mathbf K_k=\mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}$, and with it how hard the update leans on the reading and how much $\mathbf P$ shrinks.

If that larger Jacobian is only a straight-line guess taken at a badly placed estimate, the filter is making a large, confident decision from a slope that may not describe the real sensor at all. Lesson 3 of this module shows this exact mechanism making a filter diverge.
:::

::: check
In the pendulum table, suppose the nudge $\delta\theta_0$ is halved from $2^\circ$ to $1^\circ$. Predict what happens to each error column. (Recomputed, the $30^\circ$, $60^\circ$ and $90^\circ$ rows become $16.5$, $285$ and $1498\,\mathrm{mdeg}$ for the frozen column and $-0.53$, $-3.50$ and $-9.95\,\mathrm{mdeg}$ for the following column.)
:::

::: answer
**Following column.** This is pure truncation error, which starts at the square of the offset. Halving the nudge should cut it to about a quarter. It does: $-2.20 \to -0.53$, $-14.2 \to -3.50$, $-40.2 \to -9.95$, each close to a factor of four.

**Frozen column.** This error is mostly a wrong slope, not a bend. A wrong slope times a nudge gives an error proportional to the nudge itself, so halving the nudge should only halve it. It does: $31.9 \to 16.5$, $563 \to 285$, $2976 \to 1498$.

So the two columns fail in different ways. Shrinking the uncertainty fixes truncation error fast, but it only slowly fixes a stale Jacobian. The tiny $5^\circ$ entries are too close to zero to show a clean pattern.
:::

## Summary

| Item | Statement |
| --- | --- |
| Nonlinear model | $\mathbf x_k=\mathbf f(\mathbf x_{k-1},\mathbf u_{k-1})+\mathbf w_{k-1}$, $\mathbf z_k=\mathbf h(\mathbf x_k)+\mathbf v_k$; noise assumptions unchanged from the linear Kalman filter |
| EKF predict | $\hat{\mathbf x}_k^-=\mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1})$ (nonlinear); $\mathbf P_k^-=\mathbf F_{k-1}\mathbf P_{k-1}^+\mathbf F_{k-1}^{\mathsf T}+\mathbf Q_{k-1}$ (linearized) |
| EKF update | $\boldsymbol\nu_k=\mathbf z_k-\mathbf h(\hat{\mathbf x}_k^-)$ (nonlinear); $\mathbf K_k$ and $\mathbf P_k^+$ have the same form as the linear filter, built from $\mathbf H_k$ |
| Jacobians | $\mathbf F_{k-1}=\partial\mathbf f/\partial\mathbf x$ at $\hat{\mathbf x}_{k-1}^+$; $\mathbf H_k=\partial\mathbf h/\partial\mathbf x$ at $\hat{\mathbf x}_k^-$ — always at the current estimate, never the unknown truth |
| Truncation error | The Taylor leftover the EKF drops: $O(\|\boldsymbol\delta\|^2)$ in general, growing with the spread and with the local bend of $\mathbf f$ or $\mathbf h$ |
| Bearing sensor | $\mathbf H=(-y/r^2,\ x/r^2,\ 0,\ 0)$; sideways error is cubic, $-\tfrac13(s/r_0)^3$; along-the-line error is exactly zero |
| Stale Jacobian | Freezing $\mathbf F$ while the state moves gives an error proportional to the offset — usually much worse than the truncation error |

The next lesson keeps this recipe and asks two more questions. What happens *between* readings, when the motion runs in continuous time instead of one jump? And what if the filter re-aims its straight line more than once for a single reading?

::: context apollo-origin From Apollo to your phone
In 1960, Stanley Schmidt's group at NASA's Ames Research Center was working out how Apollo could navigate between the Earth and the Moon. Rudolf Kalman had recently published his filter, which assumed straight-line models. Orbits are not straight lines, so Schmidt's team linearized the equations around the current best trajectory estimate — the step at the heart of this lesson. That work helped carry the Kalman filter into the Apollo guidance computer. Since then the same idea has spread to aircraft inertial navigation, satellite GPS receivers, drones and the motion sensors in phones.
:::

::: context jensen-bend Why a bend moves the average
Picture the curve $y = x^2$. Take two equally likely values, $x=-1$ and $x=+1$. Their average is $0$, and $f(0)=0$. But both of them map to $y=1$, so the average output is $1$. A curve that bends upward lifts the average output above the output at the average input. Mathematicians call this Jensen's inequality.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="330" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="160" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M 60 30 Q 180 270 300 30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="120" cy="120" r="5" fill="#1f2a44"/>
  <circle cx="240" cy="120" r="5" fill="#1f2a44"/>
  <line x1="120" y1="120" x2="240" y2="120" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="180" cy="120" r="5" fill="#b4232c"/>
  <circle cx="180" cy="150" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="112" y="167" font-size="12" fill="#1f2a44">−1</text>
  <text x="235" y="167" font-size="12" fill="#1f2a44">+1</text>
  <text x="188" y="113" font-size="12" fill="#b4232c">average of f = 1</text>
  <text x="188" y="143" font-size="12" fill="#1f2a44">f(average) = 0</text>
  <text x="275" y="55" font-size="12" fill="#1d6fd1">y = x²</text>
</svg>
```
:::

::: context jacobi-name Named after Jacobi
The Jacobian is named after Carl Gustav Jacob Jacobi, a German mathematician of the early 1800s who studied these tables of partial derivatives and their determinants. Engineers use the word loosely: "the Jacobian" can mean the matrix itself or, in other fields, its determinant. In filtering it always means the matrix. You met the same object in the least-squares module, where Gauss-Newton needs the slope of each residual with respect to each unknown, and you will meet it again as the reset Jacobian of the error-state filter later in this module.
:::

::: context atan2-recall Why atan2 and not arctan
Plain $\arctan(y/x)$ cannot tell the point $(1,1)$ from $(-1,-1)$: both give $y/x = 1$. The two-argument $\operatorname{atan2}(y,x)$ looks at the signs of $x$ and $y$ separately and returns the correct angle in all four quadrants, from $-\pi$ to $\pi$. The trigonometry module covers it in full. Its slope, though, is the same smooth formula everywhere except the origin, which is why the bearing Jacobian is so tidy.
:::

::: context finite-difference Why nudge both ways
A one-sided difference, $[h(x+\epsilon)-h(x)]/\epsilon$, is off by an amount proportional to $\epsilon$ times the bend. Nudging both ways and dividing by $2\epsilon$ cancels that first error, leaving one proportional to $\epsilon^2$. With $\epsilon = 10^{-6}$ that is tiny. Do not make $\epsilon$ too small, though: subtracting two almost-equal numbers loses digits to rounding, so there is a best step size, often around $10^{-5}$ to $10^{-6}$ of the variable's size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M 30 170 Q 180 170 330 35" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="130" y1="164.6" x2="300" y2="72.8" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="130" y1="159.2" x2="290" y2="72.8" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="180" y1="140.3" x2="300" y2="64.7" stroke="#b4232c" stroke-width="1.8" stroke-dasharray="6 4"/>
  <circle cx="150" cy="148.4" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="270" cy="83.6" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="210" cy="121.4" r="4.5" fill="#1d6fd1"/>
  <text x="140" y="184" font-size="11" fill="#1f2a44">x − ε</text>
  <text x="200" y="184" font-size="11" fill="#1f2a44">x</text>
  <text x="258" y="184" font-size="11" fill="#1f2a44">x + ε</text>
  <line x1="12" y1="18" x2="36" y2="18" stroke="#1d6fd1" stroke-width="2"/>
  <text x="42" y="22" font-size="11" fill="#1f2a44">true slope at x</text>
  <line x1="12" y1="36" x2="36" y2="36" stroke="#f2b880" stroke-width="2.5"/>
  <text x="42" y="40" font-size="11" fill="#1f2a44">nudge both ways: parallel</text>
  <line x1="12" y1="54" x2="36" y2="54" stroke="#b4232c" stroke-width="1.8" stroke-dasharray="6 4"/>
  <text x="42" y="58" font-size="11" fill="#1f2a44">nudge one way: too steep</text>
</svg>
```
:::

::: context pendulum-model Why a pendulum keeps showing up
A pendulum is the smallest system with a truly curved motion rule: the pull back is $\sin\theta$, not $\theta$. Near the bottom it behaves like a straight-line system, and far from it, it does not, so you can dial the nonlinearity up and down by choosing the starting angle. The same kind of sine-shaped restoring pull appears in the gravity-gradient torque that swings a long satellite back toward pointing at Earth, which is one reason it is a favorite test problem.
:::

::: context taylor-name Taylor's idea
Brook Taylor published this expansion in 1715: near any point, a smooth function equals its value there, plus slope times distance, plus half the bend times distance squared, and so on. Each extra term is a better fit over a wider patch. The EKF stops after the slope term. The unscented Kalman filter, later in this module, captures more of the bend without ever writing a second derivative.
:::

::: context cross-range-picture Along the line of sight and across it
The observer sits at the origin and looks at the target along the line of sight. Moving the target along that line (orange) changes its range but not its bearing. Moving it across the line (red) turns the bearing by $\arctan(s/r_0)$, which is close to, but a little less than, $s/r_0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="30" cy="170" r="5" fill="#1f2a44"/>
  <text x="14" y="187" font-size="11" fill="#1f2a44">observer</text>
  <line x1="30" y1="170" x2="330" y2="10" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="246" cy="55" r="5" fill="#1d6fd1"/>
  <text x="252" y="72" font-size="11" fill="#1d6fd1">target</text>
  <line x1="246" y1="55" x2="304" y2="24" stroke="#f2b880" stroke-width="3"/>
  <polygon points="304,24 293,26 298,34" fill="#f2b880"/>
  <text x="290" y="50" font-size="11" fill="#1f2a44">range only</text>
  <line x1="246" y1="55" x2="218" y2="3" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="218,3 217,15 226,11" fill="#b4232c"/>
  <line x1="30" y1="170" x2="218" y2="3" stroke="#b4232c" stroke-width="1.2"/>
  <text x="240" y="20" font-size="11" fill="#b4232c">across by s</text>
  <text x="48" y="120" font-size="11" fill="#1f2a44">bearing turns</text>
  <text x="140" y="120" font-size="11" fill="#1f2a44">r₀</text>
</svg>
```
:::

::: context stm-meaning What a state transition matrix does
For a straight-line system $\dot{\mathbf x} = \mathbf F\mathbf x$ with fixed $\mathbf F$, the state after time $\Delta t$ is $\exp(\mathbf F\Delta t)\,\mathbf x$. That matrix, $\boldsymbol\Phi$ ("phi"), is the state transition matrix: it carries any small difference forward in time. When $\mathbf F$ changes along the path, $\boldsymbol\Phi$ has to be built up piece by piece, solving $\dot{\boldsymbol\Phi}=\mathbf F(t)\boldsymbol\Phi$. The covariance rides on the same matrix, $\mathbf P \to \boldsymbol\Phi\mathbf P\boldsymbol\Phi^{\mathsf T}$, so a wrong $\boldsymbol\Phi$ means a wrong $\mathbf P$.
:::
