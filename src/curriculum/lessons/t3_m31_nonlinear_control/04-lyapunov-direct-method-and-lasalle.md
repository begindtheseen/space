---
id: l04-lyapunov-direct-method-and-lasalle
title: The direct method, Lyapunov functions and LaSalle
minutes: 26
covers:
  - 'The Lyapunov direct method, Lyapunov functions, LaSalle invariance principle'
---

Aleksandr Lyapunov's 1892 thesis contains the observation this module is built on: if you can find a scalar function of the state that is positive everywhere except at the equilibrium, and that decreases along every trajectory, then trajectories have nowhere to go but the equilibrium. No solution of the differential equation is required. No linearisation is required. The dynamics can be of any order, can be discontinuous, and can be far from any operating point.

That is the **direct method**, and it is the only general stability tool in nonlinear control. Everything later in this module is an application of it: sliding surfaces are designed by choosing $V = \tfrac{1}{2}s^\mathsf{T}s$ and forcing $\dot{V}$ negative, backstepping builds $V$ one state at a time, passivity-based control reuses the physical energy as $V$, and the region-of-attraction lesson turns a sublevel set of $V$ into a certified safe region.

The recurring complaint is that finding $V$ looks like magic. It is not, and this lesson is mostly about where candidates come from. There is a short list of sources — physical energy, energy plus a potential that the controller itself creates, quadratic forms from the Lyapunov equation, weighted sums of squared errors — and for control design you often choose $V$ *first* and then design the control law to make $\dot{V}$ negative, which reverses the apparent difficulty. The lesson ends with the canonical spacecraft case worked in full: the quaternion feedback law $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, its Lyapunov function, its LaSalle argument, and a careful statement of which equilibrium the proof actually certifies.

## Positive definite functions and the theorem

Let $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ with $\mathbf{f}(\mathbf{0}) = \mathbf{0}$, the equilibrium moved to the origin without loss of generality. A continuously differentiable scalar $V(\mathbf{x})$ is **positive definite** on a region $D$ containing the origin if $V(\mathbf{0}) = 0$ and $V(\mathbf{x}) > 0$ for every other $\mathbf{x}$ in $D$; **positive semi-definite** if $V(\mathbf{x}) \ge 0$ is all you can say. It is **radially unbounded** if $V(\mathbf{x}) \to \infty$ as $\lVert\mathbf{x}\rVert \to \infty$.

The derivative that matters is the one taken *along the trajectories*:

$$
\dot{V}(\mathbf{x}) = \frac{\partial V}{\partial\mathbf{x}}\,\dot{\mathbf{x}} = \nabla V(\mathbf{x})\cdot\mathbf{f}(\mathbf{x}) .
$$

This is a function of the state alone — no solution needed. That single substitution is what makes the method usable.

::: key Lyapunov's direct method
For $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ with equilibrium at the origin, suppose $V$ is continuously differentiable with $V(\mathbf{0}) = 0$ and $V(\mathbf{x}) > 0$ for $\mathbf{x} \ne \mathbf{0}$ (positive definite). If $\dot{V}(\mathbf{x}) \le 0$ along trajectories, the origin is **stable**. If $\dot{V}(\mathbf{x}) < 0$ for $\mathbf{x} \ne \mathbf{0}$ (negative definite), the origin is **asymptotically stable**. If in addition $V$ is radially unbounded, the origin is **globally asymptotically stable**.
:::

The geometry behind it is worth holding on to. The sets $\{V(\mathbf{x}) = c\}$ are nested closed surfaces around the origin, shrinking to it as $c \to 0$. Saying $\dot{V} \le 0$ says the trajectory never crosses one of these surfaces outward. So a trajectory that starts inside $\{V \le c\}$ stays inside it forever — the sublevel set is **positively invariant** — and that is what "stable" means. Making $\dot{V}$ strictly negative forces the trajectory through every surface inward, so $V \to 0$ and the state goes to the origin.

Two conditions are more than bookkeeping. The sublevel set must be **bounded** for the argument to trap anything, which is what radial unboundedness buys globally: the function $V = x_1^2/(1 + x_1^2) + x_2^2$ is positive definite and can be made to have $\dot{V} < 0$ everywhere, yet its level set $V = 1$ is the unbounded curve $x_2^2 = 1/(1 + x_1^2)$, so trajectories can run off to infinity with $V$ decreasing the whole way. And $\dot{V}$ must be evaluated with the actual $\mathbf{f}$: a $V$ that decreases in some directions and not along the flow proves nothing.

## Where candidates come from

Four sources cover most of practice.

**1. The physical energy.** For a mechanical system, kinetic plus potential energy is positive definite about a rest equilibrium, and $\dot{V}$ is the net power in. For a rigid body, $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$ is rotational kinetic energy, with $\mathbf{J}$ the inertia matrix and $\boldsymbol{\omega}$ the body rate. This works because the Euler equations conserve it when no torque acts, so $\dot{V}$ reduces to the work rate of whatever you add.

**2. Energy plus the potential your controller creates.** This is the source that makes attitude control work, and it is a construction rather than a guess. Suppose the control has a proportional part $\mathbf{u}_p(\mathbf{x})$ and a damping part $-\mathbf{P}\boldsymbol{\omega}$. Take $V = \text{kinetic energy} + U$, where $U$ is chosen so that $\dot{U} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p$. Then the proportional term's contribution cancels exactly and $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$, whatever the proportional law was. Your job is to integrate $\mathbf{u}_p$ into a potential and check it is positive definite. The quaternion example below does precisely this in two lines.

**3. The Lyapunov equation.** If part of the system is linear with a Hurwitz $\mathbf{A}$, solve $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ for a chosen positive definite $\mathbf{Q}$ and take $V = \mathbf{x}^\mathsf{T}\mathbf{P}\mathbf{x}$. This is the candidate the indirect method's proof used, and it is the standard starting point when you have a nominal linear design and want to certify a region around it.

**4. Weighted sums of squared errors.** For a tracking problem, $V = \tfrac{1}{2}\mathbf{e}^\mathsf{T}\mathbf{M}\mathbf{e}$ with $\mathbf{M}$ chosen to make the cross terms cancel. Sliding-mode design uses the one-dimensional version, $V = \tfrac{1}{2}s^2$ in the surface variable, and gets a reaching condition out of it.

::: example Detumble, with a rate you can certify
A spacecraft with $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$ is tumbling and the only feedback available is rate: $\mathbf{u} = -\mathbf{P}\boldsymbol{\omega}$ with $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$. The dynamics are Euler's equations,

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{u} .
$$

Take $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the kinetic energy, positive definite in $\boldsymbol{\omega}$ and radially unbounded. Differentiate along trajectories:

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}}
= -\boldsymbol{\omega}^\mathsf{T}\left(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}\right) + \boldsymbol{\omega}^\mathsf{T}\mathbf{u}
= -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} ,
$$

because $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ is perpendicular to $\boldsymbol{\omega}$, so its dot product with $\boldsymbol{\omega}$ vanishes identically — the gyroscopic term does no work, which is why the messy nonlinearity never appears in the proof. With $\mathbf{P}$ positive definite, $\dot{V} < 0$ for every $\boldsymbol{\omega} \ne \mathbf{0}$: globally asymptotically stable, no linearisation, no restriction to small rates.

Now extract a rate. Since $\tfrac{1}{2}\lambda_{\min}(\mathbf{J})\lVert\boldsymbol{\omega}\rVert^2 \le V \le \tfrac{1}{2}\lambda_{\max}(\mathbf{J})\lVert\boldsymbol{\omega}\rVert^2$ and $\dot{V} = -\lambda_{\min}(\mathbf{P})\lVert\boldsymbol{\omega}\rVert^2$ here,

$$
\dot{V} \le -\frac{2\lambda_{\min}(\mathbf{P})}{\lambda_{\max}(\mathbf{J})}\,V = -\frac{2(80)}{120}V = -\tfrac{4}{3}V
\quad\Longrightarrow\quad
V(t) \le V(0)\,e^{-4t/3} .
$$

Start at $\boldsymbol{\omega}(0) = (0.30, -0.20, 0.15)\,\mathrm{rad/s}$, so $V(0) = 8.30\,\mathrm{J}$ and $\lVert\boldsymbol{\omega}(0)\rVert = 0.3905\,\mathrm{rad/s}$. Reaching $\lVert\boldsymbol{\omega}\rVert \lt 10^{-3}\,\mathrm{rad/s}$ is guaranteed once $V \lt \tfrac{1}{2}\lambda_{\min}(\mathbf{J})(10^{-3})^2 = 4\times10^{-5}\,\mathrm{J}$, which the bound promises by

$$
t = \frac{\ln\!\left(8.30/4\times10^{-5}\right)}{4/3} = \frac{12.243}{1.3333} = 9.18\,\mathrm{s} .
$$

Runge–Kutta integration of the full nonlinear equations at $\Delta t = 1\,\mathrm{ms}$ gives $8.576\,\mathrm{s}$:

| $t$ | $\lVert\boldsymbol{\omega}\rVert$ ($\mathrm{rad/s}$) | $V$ (J) | Bound $V(0)e^{-4t/3}$ |
| --- | --- | --- | --- |
| $1\,\mathrm{s}$ | $1.867\times10^{-1}$ | $1.950$ | $2.188$ |
| $2\,\mathrm{s}$ | $9.112\times10^{-2}$ | $0.4730$ | $0.5767$ |
| $5\,\mathrm{s}$ | $1.131\times10^{-2}$ | $7.506\times10^{-3}$ | $1.056\times10^{-2}$ |
| $10\,\mathrm{s}$ | $3.835\times10^{-4}$ | $8.768\times10^{-6}$ | $1.344\times10^{-5}$ |

The bound is above the truth at every row, by about 35 per cent in $V$ and $0.6\,\mathrm{s}$ in settling time. That gap is the price of a guarantee: a Lyapunov bound is conservative by construction, and a conservative certificate is what a flight program wants.
:::

## When $\dot{V}$ goes only semi-definite: LaSalle

The useful candidates very often give $\dot{V} \le 0$ with equality on a whole set, not at a single point. In the detumble example the damping acted on every state, so $\dot{V}$ was strictly negative. Add attitude feedback and $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ still, which vanishes whenever the vehicle is at rest — at *any* attitude. Lyapunov's theorem then gives stability and stops.

LaSalle's invariance principle finishes the job, and its idea is that being at rest at the wrong attitude is not something the system can keep doing.

::: key LaSalle's invariance principle
Let $\Omega$ be a compact set that trajectories cannot leave (for instance a bounded sublevel set $\{V \le c\}$, which is positively invariant when $\dot{V} \le 0$ on it). Let $E = \{\mathbf{x} \in \Omega : \dot{V}(\mathbf{x}) = 0\}$ and let $M$ be the largest invariant set contained in $E$. Then every trajectory starting in $\Omega$ approaches $M$ as $t \to \infty$. If $M$ is the origin alone, the origin is asymptotically stable with region of attraction containing $\Omega$.
:::

"Invariant" means a trajectory that starts in the set stays in it for all time, forward and backward. The working procedure is mechanical:

1. Write $E$: solve $\dot{V}(\mathbf{x}) = 0$.
2. Assume the trajectory *stays* in $E$ for all time, and differentiate that assumption.
3. Feed the result back into the dynamics to see what else is forced to zero.
4. Whatever survives is $M$.

A small case first. For $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 - x_2^3$ — the system whose Jacobian at the origin was $\pm j$ and told you nothing — take $V = \tfrac{1}{2}(x_1^2 + x_2^2)$. Then $\dot{V} = x_1x_2 + x_2(-x_1 - x_2^3) = -x_2^4 \le 0$: negative semi-definite, so Lyapunov alone gives stability. Apply LaSalle. $E = \{x_2 = 0\}$. If a trajectory stays in $E$ then $x_2 \equiv 0$, hence $\dot{x}_2 \equiv 0$, and the second equation forces $-x_1 - 0 = 0$, so $x_1 \equiv 0$. Therefore $M = \{\mathbf{0}\}$ and the origin is asymptotically stable. $V$ is radially unbounded, so globally. Integration confirms it and shows how slow it is — from $(1, 0)$, $\lVert\mathbf{x}\rVert$ is $0.349$ at $10\,\mathrm{s}$, $0.114$ at $100\,\mathrm{s}$, $0.0365$ at $1000\,\mathrm{s}$, $0.0258$ at $2000\,\mathrm{s}$. Convergent, and not exponentially so, exactly as the previous lesson's marginal case predicted. With the cubic damping removed, $\lVert\mathbf{x}\rVert$ is $1.0000$ at $2000\,\mathrm{s}$: the term LaSalle used is doing all the work.

## The quaternion attitude law, proved

Here is the result the module is organised around. It is the standard spacecraft regulator, it is three lines of algebra, and every line has a physical reading.

The vehicle is a rigid body with inertia $\mathbf{J}$, body rate $\boldsymbol{\omega}$, and control torque $\mathbf{u}$:

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{u} .
$$

Attitude error is carried by a unit quaternion $\mathbf{q} = (q_0, \mathbf{q}_v)$, scalar first, with $q_0^2 + \mathbf{q}_v^\mathsf{T}\mathbf{q}_v = 1$. For a principal rotation of angle $\Phi$ about a unit axis $\hat{\mathbf{n}}$, $q_0 = \cos(\Phi/2)$ and $\mathbf{q}_v = \hat{\mathbf{n}}\sin(\Phi/2)$, so $\mathbf{q} = (1, \mathbf{0})$ is zero error. The kinematics, from the attitude kinematics module, are

$$
\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega},
\qquad
\dot{\mathbf{q}}_v = \tfrac{1}{2}\left(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}\right).
$$

The control law is proportional on the vector part and derivative on rate:

$$
\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega},
\qquad K > 0, \quad \mathbf{P} = \mathbf{P}^\mathsf{T} > 0 .
$$

::: example Constructing the candidate and closing the proof
**Build $V$ rather than guess it.** Start from kinetic energy $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$ and look for a potential $U(\mathbf{q})$ whose rate cancels the work done by the proportional term. The proportional term's power is $\boldsymbol{\omega}^\mathsf{T}(-K\mathbf{q}_v) = -K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, so you need $\dot{U} = +K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. The kinematics hand you that for free: $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, so

$$
\frac{d}{dt}\left(-2Kq_0\right) = K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} .
$$

Add the constant $2K$ to make the potential vanish at zero error and stay non-negative, since $q_0 \le 1$:

$$
\boxed{\,V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0)\,}
$$

This is not a guess. It is kinetic energy plus the potential the proportional gain is the gradient of, and every attitude law in this module gets its candidate the same way.

**Check positive definiteness.** The first term is positive definite in $\boldsymbol{\omega}$ because $\mathbf{J}$ is. The second satisfies $2K(1 - q_0) \ge 0$ with equality only at $q_0 = 1$, which on the unit sphere means $\mathbf{q}_v = \mathbf{0}$. So $V \ge 0$, and $V = 0$ exactly at $(\boldsymbol{\omega}, \mathbf{q}) = (\mathbf{0}, (1,\mathbf{0}))$. Its maximum over the quaternion is $4K$, at $q_0 = -1$.

**Differentiate along the closed loop.**

$$
\begin{aligned}
\dot{V} &= \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}} - 2K\dot{q}_0 \\
&= \boldsymbol{\omega}^\mathsf{T}\left(-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}\right) + K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} \\
&= \boldsymbol{\omega}^\mathsf{T}\mathbf{u} + K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} \\
&= -K\boldsymbol{\omega}^\mathsf{T}\mathbf{q}_v - \boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} + K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} \\
&= -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \ \le\ 0 .
\end{aligned}
$$

Line two uses $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$. Line five uses that $K\boldsymbol{\omega}^\mathsf{T}\mathbf{q}_v$ and $K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ are the same scalar. Nothing is approximated and nothing is assumed small.

**Apply LaSalle.** $\dot{V}$ is negative *semi*-definite: it vanishes on $E = \{\boldsymbol{\omega} = \mathbf{0}\}$, for every attitude. Take $\Omega = \{V \le c\}$ with $c \lt 4K$; it is positively invariant because $\dot{V} \le 0$, and compact because the quaternion lies on the unit sphere and $V \le c$ bounds $\boldsymbol{\omega}$. On a trajectory that remains in $E$, $\boldsymbol{\omega} \equiv \mathbf{0}$ so $\dot{\boldsymbol{\omega}} \equiv \mathbf{0}$, and the closed-loop dynamics give

$$
\mathbf{0} = \mathbf{J}\dot{\boldsymbol{\omega}} = -\mathbf{0}\times\mathbf{J}\mathbf{0} - K\mathbf{q}_v - \mathbf{P}\mathbf{0} = -K\mathbf{q}_v
\quad\Longrightarrow\quad \mathbf{q}_v = \mathbf{0} .
$$

So $M = \{\boldsymbol{\omega} = \mathbf{0},\ \mathbf{q}_v = \mathbf{0}\}$, which on the unit sphere means $q_0 = \pm1$. Inside $\Omega$ with $c \lt 4K$ the point $q_0 = -1$ is excluded, because $V = 4K$ there. Therefore every trajectory starting with $V(0) \lt 4K$ converges to $\mathbf{q} = (1, \mathbf{0})$ with $\boldsymbol{\omega} = \mathbf{0}$: asymptotically stable, with a certified region of attraction $\{V \lt 4K\}$.

**Fly it.** Take $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $K = 20\,\mathrm{N\,m}$, $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$, an initial error of $150^\circ$ about the axis $\hat{\mathbf{n}} = (1,2,2)/3$, and $\boldsymbol{\omega}(0) = (0.02, -0.03, 0.01)\,\mathrm{rad/s}$. Then $q_0(0) = \cos 75^\circ = 0.25882$ and

$$
V(0) = 0.0730 + 2(20)(1 - 0.25882) = 29.720\,\mathrm{J} \lt 4K = 80\,\mathrm{J} ,
$$

so the initial state is inside the certified region. Integrating with fourth-order Runge–Kutta at $\Delta t = 1\,\mathrm{ms}$, renormalising the quaternion each step:

| $t$ | $V$ (J) | Error angle $\Phi$ | $\lVert\boldsymbol{\omega}\rVert$ ($\mathrm{rad/s}$) |
| --- | --- | --- | --- |
| $0$ | $29.7202$ | $150.00^\circ$ | $3.74\times10^{-2}$ |
| $5\,\mathrm{s}$ | $16.0864$ | $99.45^\circ$ | $2.03\times10^{-1}$ |
| $10\,\mathrm{s}$ | $4.7832$ | $51.77^\circ$ | $1.27\times10^{-1}$ |
| $20\,\mathrm{s}$ | $0.2560$ | $11.75^\circ$ | $3.12\times10^{-2}$ |
| $40\,\mathrm{s}$ | $5.86\times10^{-4}$ | $0.564^\circ$ | $1.49\times10^{-3}$ |
| $100\,\mathrm{s}$ | $9.39\times10^{-12}$ | $0.0001^\circ$ | $1.87\times10^{-7}$ |
| $200\,\mathrm{s}$ | $\lt 10^{-13}$ | $0.0000^\circ$ | $7.4\times10^{-14}$ |

$V$ decreases at every step of the $60000$-step run — the largest change is $-4.2\times10^{-10}$, never positive. And the identity itself is checkable: computing $\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}} - 2K\dot{q}_0$ from the simulated derivatives and comparing with $-\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ gives $-0.11200000$ against $-0.11200000$ at $t = 0$, $-2.46963488$ against $-2.46963488$ at $t = 1.5\,\mathrm{s}$, and so on. The algebra above is what the simulation does.

```python
import numpy as np

J = np.diag([120.0, 100.0, 80.0])
K, P = 20.0, 80.0 * np.eye(3)

def deriv(s):
    q0, qv, w = s[0], s[1:4], s[4:]
    u = -K * qv - P @ w
    wd = np.linalg.solve(J, -np.cross(w, J @ w) + u)
    return np.concatenate(([-0.5 * qv @ w], 0.5 * (q0 * w + np.cross(qv, w)), wd))

def lyap(s):
    return 0.5 * s[4:] @ J @ s[4:] + 2 * K * (1 - s[0])

ang, n = np.radians(150.0), np.array([1.0, 2.0, 2.0]) / 3.0
s = np.concatenate(([np.cos(ang / 2)], np.sin(ang / 2) * n, [0.02, -0.03, 0.01]))
dt = 1e-3
for step in range(200_000):
    k1 = deriv(s); k2 = deriv(s + 0.5 * dt * k1)
    k3 = deriv(s + 0.5 * dt * k2); k4 = deriv(s + dt * k3)
    s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    s[:4] /= np.linalg.norm(s[:4])
print(round(lyap(s), 12), np.round(s[:4], 9))
# 0.0 [1. 0. 0. 0.]
```
:::

## What the proof certifies, and what it leaves open

Read the last step of the LaSalle argument again. The invariant set $M$ contained **two** points: $\mathbf{q} = (1,\mathbf{0})$ and $\mathbf{q} = (-1,\mathbf{0})$. Both are genuine equilibria of the closed loop, because $\mathbf{q}_v = \mathbf{0}$ makes the control vanish at either. The proof excluded the second by restricting to $V \lt 4K$, which is the sublevel set that does not reach $q_0 = -1$.

That restriction is not an artefact of a lazy proof. The two points are the *same physical attitude*: a unit quaternion and its negative describe the same rotation, because $\Phi \to \Phi + 2\pi$ flips the sign of both $\cos(\Phi/2)$ and $\sin(\Phi/2)$. So the control law has been proved to drive the vehicle to a particular *representation*, and if the attitude estimator hands it the other one, the vehicle will rotate almost all the way around to get there. That is the unwinding problem, and the spacecraft attitude control lesson later in this module fixes it with one sign.

The same reading also gives the region of attraction for free: $\{V \lt 4K\}$, that is,

$$
\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0) \lt 4K .
$$

At zero rate this permits any $q_0 \gt -1$, so every attitude except the exact antipode. At zero attitude error it permits $\lVert\boldsymbol{\omega}\rVert$ up to $\sqrt{8K/\lambda_{\max}(\mathbf{J})} = \sqrt{160/120} = 1.155\,\mathrm{rad/s}$ guaranteed. That is a real number a reviewer can check, produced by a proof rather than by a simulation campaign.

::: warning
$\dot{V} \le 0$ alone gives stability, not asymptotic stability. Writing "$\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0$, therefore the attitude converges" skips the only step in the argument that mentions attitude at all. Without LaSalle, the vehicle drifting to rest at $90^\circ$ of error is fully consistent with everything you have written.
:::

::: warning
A failed candidate proves nothing. If your $V$ gives $\dot{V} \gt 0$ somewhere, the system may still be perfectly stable — you chose the wrong function. Lyapunov's theorems are sufficient conditions only, and a negative result sends you back for a better candidate, not to the conclusion that the loop is unstable.
:::

::: note
Converse theorems say that a suitable $V$ exists whenever the equilibrium is asymptotically stable, so the search is never futile in principle. They are not constructive, which is why the practical answer remains the short list above, plus the numerical route: parametrise $V$ as a polynomial and solve for coefficients that make $V$ and $-\dot{V}$ non-negative. That is the sum-of-squares method, and it is the subject of the next lesson.
:::

## Check yourself

::: check
For $\dot{x} = -x + x^3$, test $V = \tfrac{1}{2}x^2$. What do you conclude, and about which region?
:::

::: answer
$\dot{V} = x\dot{x} = -x^2 + x^4 = -x^2(1 - x^2)$, which is negative for $0 \lt |x| \lt 1$ and positive for $|x| \gt 1$. So the candidate certifies asymptotic stability of the origin on the region $|x| \lt 1$, and the sublevel sets of $V$ inside that region are $\{V \lt 1/2\}$, that is $|x| \lt 1$ itself. It is not a global result, and it should not be: $x = \pm1$ are equilibria of the system, so the true region of attraction is exactly $|x| \lt 1$ and the estimate is tight here. That is unusual — most Lyapunov estimates are strictly conservative.
:::

::: check
A colleague proposes $V = \tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\mathbf{q}_v$ for the quaternion law. Why does it fail?
:::

::: answer
It is not positive definite in the full state: it vanishes for every $\boldsymbol{\omega}$ when $\mathbf{q}_v = \mathbf{0}$, so it says nothing about rate, and the state $(\mathbf{q}_v, \boldsymbol{\omega}) = (\mathbf{0}, \text{large})$ has $V = 0$ while being far from equilibrium. Its derivative is also unhelpful: $\dot{V} = \mathbf{q}_v^\mathsf{T}\dot{\mathbf{q}}_v = \tfrac{1}{2}q_0\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, using $\mathbf{q}_v^\mathsf{T}(\mathbf{q}_v\times\boldsymbol{\omega}) = 0$, which has no definite sign under the control law and contains no damping term to make it negative. A candidate must see every state the dynamics move.
:::

::: check
In the detumble example, how would the guaranteed settling bound change if $\mathbf{P}$ were $\mathrm{diag}(80, 60, 40)$ instead of $80\,\mathbf{I}$?
:::

::: answer
The bound uses the worst direction, so $\lambda_{\min}(\mathbf{P}) = 40$ replaces $80$: $\dot{V} \le -2(40)/120\,V = -\tfrac{2}{3}V$, half the previous rate. Reaching $V \lt 4\times10^{-5}\,\mathrm{J}$ from $V(0) = 8.30\,\mathrm{J}$ then takes $12.243/0.6667 = 18.4\,\mathrm{s}$ instead of $9.18\,\mathrm{s}$. The actual settling would be faster than that, because two of the three axes are damped harder than the bound assumes, but the certificate is set by the slowest axis and no reviewer should accept better.
:::

::: check
Write out the LaSalle steps for $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1^3 - x_2$ with $V = \tfrac{1}{4}x_1^4 + \tfrac{1}{2}x_2^2$.
:::

::: answer
$\dot{V} = x_1^3\dot{x}_1 + x_2\dot{x}_2 = x_1^3x_2 + x_2(-x_1^3 - x_2) = -x_2^2 \le 0$, negative semi-definite, so $E = \{x_2 = 0\}$. Suppose a trajectory stays in $E$: then $x_2 \equiv 0$, so $\dot{x}_2 \equiv 0$, and the second equation gives $-x_1^3 - 0 = 0$, hence $x_1 \equiv 0$. So $M = \{\mathbf{0}\}$ and the origin is asymptotically stable. $V$ is radially unbounded and $\dot{V} \le 0$ everywhere, so the result is global. Note that the Jacobian at the origin is $\begin{bmatrix}0 & 1\\ 0 & -1\end{bmatrix}$, eigenvalues $0$ and $-1$: the indirect method is inconclusive and the direct method settles it.
:::

::: check
The certified region for the quaternion law is $V \lt 4K$. A mission requires recovery from any attitude with rates up to $2\,\mathrm{rad/s}$ on the worst axis. What does the proof demand of $K$, and what does raising $K$ cost?
:::

::: answer
The worst case inside the requirement is the largest possible $V$: any attitude means $q_0$ can approach $-1$, contributing up to $4K$, so a rate allowance on top of that cannot be certified by this sublevel set at all — with $q_0 = -1$ the candidate is already at the boundary. Taking the requirement as "rates up to $2\,\mathrm{rad/s}$ at moderate attitude error", the kinetic part is at most $\tfrac{1}{2}(120)(2)^2 = 240\,\mathrm{J}$, and with an attitude error contributing $2K(1 - q_0)$ you need $240 + 2K(1 - q_0) \lt 4K$. For $q_0 \ge 0$ this needs $K \gt 120\,\mathrm{N\,m}$; for $q_0 = -0.5$ it needs $K \gt 240\,\mathrm{N\,m}$. The cost is torque: the proportional term alone reaches $K\lVert\mathbf{q}_v\rVert$, up to $240\,\mathrm{N\,m}$ at $K = 240$, which no reaction wheel will deliver. This is the honest shape of the trade, and it is also the strongest argument for the sign fix, which halves the worst-case attitude term by never letting $q_0$ be negative.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $V(\mathbf{x})$ positive definite | $V(\mathbf{0}) = 0$, $V \gt 0$ elsewhere |
| $\dot{V} = \nabla V\cdot\mathbf{f}(\mathbf{x})$ | Derivative along trajectories; no solution needed |
| $\dot{V} \le 0$ | Stable; sublevel sets positively invariant |
| $\dot{V} \lt 0$ | Asymptotically stable; plus radially unbounded, globally so |
| LaSalle | Trajectories approach the largest invariant set $M$ inside $\{\dot{V} = 0\}$ |
| $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, $\mathbf{u} = -\mathbf{P}\boldsymbol{\omega}$ | $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$; global detumble, $V \le V(0)e^{-2\lambda_{\min}(\mathbf{P})t/\lambda_{\max}(\mathbf{J})}$ |
| $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$ | The gyroscopic term does no work — why the proof is short |
| $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$ | Canonical quaternion feedback law |
| $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0)$ | Its Lyapunov function; $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ |
| $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ | The kinematic identity that builds the potential $-2Kq_0$ |
| $M = \{\boldsymbol{\omega} = \mathbf{0}, \mathbf{q}_v = \mathbf{0}\}$ | Two points, $q_0 = \pm1$; $V \lt 4K$ keeps only the first |
| $\mathbf{J} = \mathrm{diag}(120,100,80)$, $K = 20$, $\mathbf{P} = 80\mathbf{I}$ | From $150^\circ$: $V(0) = 29.72\,\mathrm{J}$, error $0.564^\circ$ at $40\,\mathrm{s}$ |

The proof handed you a region of attraction as a by-product — the sublevel set $V \lt 4K$. The next lesson makes that the point: how to choose $V$ and the level $c$ so that the certified region is as large as the true one, and how sum-of-squares programming automates the search.
