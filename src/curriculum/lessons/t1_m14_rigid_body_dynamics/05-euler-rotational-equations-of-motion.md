---
id: l05-euler-rotational-equations-of-motion
title: Euler's rotational equations of motion
minutes: 19
covers:
  - Euler rotational equations of motion
---

Newton's second law for rotation is short: the inertial rate of change of angular momentum equals the applied torque. Everything difficult about rigid-body dynamics comes from writing that law in the one frame where the inertia tensor is constant — the body frame — which rotates. The result is Euler's rotational equations, three coupled nonlinear differential equations for the body rates. They are the plant model in every attitude control design, the core of every six-degree-of-freedom simulator, and the equations you integrate in this module's coding exercises.

A GNC engineer uses them in both directions. Forward: given the torques from thrusters, wheels, a gimballed engine and the environment, propagate the body rates and, through the kinematic equation of lesson 1, the attitude. Backward: given a desired angular acceleration, compute the torque the actuators must produce — including the part that is needed not to accelerate anything but to fight the body's own gyroscopic coupling. On a launch vehicle that coupling appears as a yaw torque produced by rolling while pitching; on a spacecraft it is the reason a slew about one axis disturbs the other two.

## From Newton to Euler

The previous module established, for any system of particles, that the inertial time derivative of the angular momentum about the centre of mass equals the net external torque about the centre of mass:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \mathbf{M} .
$$

Internal forces cancel in pairs and contribute nothing, which is why a reaction wheel or a sloshing tank cannot change the total $\mathbf{H}$ of the vehicle. For a rigid body, $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ with $\mathbf{I}$ constant in body axes. Apply the transport rule from lesson 1 to move the derivative into the body frame:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \left.\frac{d\mathbf{H}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{H} .
$$

In the body frame the components of $\mathbf{I}$ do not change, so the body derivative of $\mathbf{I}\boldsymbol{\omega}$ is $\mathbf{I}\dot{\boldsymbol{\omega}}$, where $\dot{\boldsymbol{\omega}}$ is the derivative of the body components of $\boldsymbol{\omega}$ — which lesson 1 showed equals the inertial derivative as well, since $\boldsymbol{\omega}\times\boldsymbol{\omega} = 0$. Putting the pieces together,

$$
\mathbf{I}\,\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M} .
$$

This is **Euler's rotational equation** in vector form. Every symbol is a body-axis component: $\boldsymbol{\omega}$ is what the gyros read, $\mathbf{M}$ is the torque resolved along the structural axes, and $\mathbf{I}$ is the tensor about the centre of mass in those same axes. Solved for the angular acceleration,

$$
\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}\bigl(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}\bigr),
$$

which is the form a simulator integrates. The inverse exists because $\mathbf{I}$ is positive definite.

### Principal-axis form

In principal axes $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$ and $\mathbf{I}\boldsymbol{\omega} = (I_1\omega_1, I_2\omega_2, I_3\omega_3)$. The cross product $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ has first component $\omega_2 I_3\omega_3 - \omega_3 I_2\omega_2 = (I_3 - I_2)\omega_2\omega_3$, and cyclically for the others. Moving these to the right-hand side,

$$
\begin{aligned}
I_1\dot{\omega}_1 &= (I_2 - I_3)\,\omega_2\omega_3 + M_1, \\
I_2\dot{\omega}_2 &= (I_3 - I_1)\,\omega_3\omega_1 + M_2, \\
I_3\dot{\omega}_3 &= (I_1 - I_2)\,\omega_1\omega_2 + M_3 .
\end{aligned}
$$

Each line is the previous one with the indices advanced $1 \to 2 \to 3 \to 1$. This is the form to memorise, and the form the module's exercise starter code asks you to implement. Everything the rest of the module says about spin stability is read off the signs of the three differences $I_2 - I_3$, $I_3 - I_1$ and $I_1 - I_2$.

::: key Euler's rotational equations
$\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$, all in body axes about the centre of mass. In principal axes: $I_1\dot{\omega}_1 = (I_2 - I_3)\omega_2\omega_3 + M_1$ and its two cyclic permutations. The term $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ is the gyroscopic coupling; it vanishes when $\boldsymbol{\omega}$ lies along a principal axis and is what makes the equations nonlinear.
:::

## Reading the gyroscopic term

The term $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \boldsymbol{\omega}\times\mathbf{H}$ deserves a paragraph of its own, because it is not a torque and is often mistaken for one. It is the correction for describing a fixed vector from a rotating frame: the body components of $\mathbf{H}$ change at rate $-\boldsymbol{\omega}\times\mathbf{H}$ even when $\mathbf{H}$ is inertially constant, and with $H_k = I_k\omega_k$ that means the body rates change. Three consequences follow directly from the principal-axis form.

First, a pure spin about any single principal axis is an equilibrium of the torque-free equations. With $\omega_1 = \omega_2 = 0$ and $\omega_3 = n$, all three products $\omega_j\omega_k$ on the right vanish and $\dot{\boldsymbol{\omega}} = 0$. The body spins steadily forever. Whether that equilibrium is stable — whether a small disturbance stays small — is a separate question, and lesson 7 answers it.

Second, a steady rotation about any axis that is not principal requires a torque. If $\dot{\boldsymbol{\omega}} = 0$ with $\boldsymbol{\omega}$ off a principal axis, then $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} \ne 0$. Lesson 4 computed this for the bus with an off-centre tank: holding a $0.05\,\mathrm{rad/s}$ spin on body $x$, one degree from the nearest principal axis, needs $0.054\,\mathrm{N\,m}$ of continuous torque about $z$. The bearings of an unbalanced wheel supply exactly this kind of torque, and it is why balance matters.

Third, a body with three equal principal moments has no gyroscopic coupling at all: every difference $I_j - I_k$ is zero and the equations reduce to $I\dot{\boldsymbol{\omega}} = \mathbf{M}$, three independent copies of Newton's law. The coupling is driven entirely by the *differences* between principal moments, not by their size. A body with $\mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ couples through differences of $300$, $500$ and $800$; a launch vehicle with $\mathrm{diag}(7.03\times 10^5, 5.92\times 10^7, 5.92\times 10^7)$ couples pitch into yaw through a difference of $5.85\times 10^7$, and roll into nothing, because the two transverse moments are equal.

The products $\omega_j\omega_k$ make the equations nonlinear. There is no general closed-form solution for arbitrary torques, and even the torque-free case for an asymmetric body needs elliptic functions. The axisymmetric torque-free case solves in elementary functions, which is the subject of lessons 6 and 9. For anything else you integrate numerically, or linearise about a nominal motion, which is what controllers do.

::: example Torque for a slew with residual rates
The bus with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ is to accelerate about its $z$ axis at $\dot{\omega}_3 = 0.001\,\mathrm{rad/s^2}$ with no acceleration about $x$ or $y$, while carrying residual rates $\boldsymbol{\omega} = (0.01, 0.02, 0.05)\,\mathrm{rad/s}$ from an earlier manoeuvre. What torque must the actuators apply?

The angular momentum is $\mathbf{I}\boldsymbol{\omega} = (12, 30, 100)\,\mathrm{N\,m\,s}$. The gyroscopic term is

$$
\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \bigl(0.02\times 100 - 0.05\times 30,\ 0.05\times 12 - 0.01\times 100,\ 0.01\times 30 - 0.02\times 12\bigr) = (0.5,\ -0.4,\ 0.06)\,\mathrm{N\,m}.
$$

The inertial part is $\mathbf{I}\dot{\boldsymbol{\omega}} = (0, 0, 2000\times 0.001) = (0, 0, 2)\,\mathrm{N\,m}$. So

$$
\mathbf{M} = \mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = (0.5,\ -0.4,\ 2.06)\,\mathrm{N\,m}.
$$

To accelerate about $z$ alone, the actuators must also push $0.5\,\mathrm{N\,m}$ about $x$ and pull $0.4\,\mathrm{N\,m}$ about $y$ — a quarter of the main torque, applied to axes that are not supposed to be doing anything. A controller that ignores the coupling and commands only $(0, 0, 2)$ will see $x$ and $y$ rates develop: from the first equation, $\dot{\omega}_1 = -0.5/1200 = -4.2\times 10^{-4}\,\mathrm{rad/s^2}$, which over a 60 s slew accumulates to $0.025\,\mathrm{rad/s}$, larger than the residual rate it started with. This is why attitude controllers either feed the gyroscopic term forward or keep rates small enough that it is negligible.
:::

::: example Pitch and yaw coupling on a first stage
The loaded first stage of lesson 2 has $I_1 = 7.03\times 10^5\,\mathrm{kg\,m^2}$ about the roll axis and $I_2 = I_3 = 5.92\times 10^7\,\mathrm{kg\,m^2}$ about pitch and yaw. The pitch program calls for $\dot{\omega}_2 = 0.5^\circ/\mathrm{s^2} = 8.73\times 10^{-3}\,\mathrm{rad/s^2}$ with no other rates. The torque needed is $M_2 = I_2\dot{\omega}_2 = 5.92\times 10^7\times 8.73\times 10^{-3} = 5.17\times 10^5\,\mathrm{N\,m}$. With $7.6\,\mathrm{MN}$ of thrust acting $20\,\mathrm{m}$ behind the centre of mass, a gimbal deflection $\delta$ gives a torque $F\,\ell\sin\delta$, so

$$
\delta = \arcsin\frac{5.17\times 10^5}{7.6\times 10^6\times 20} = 3.40\times 10^{-3}\,\mathrm{rad} = 0.195^\circ .
$$

A fifth of a degree of gimbal moves 420 tonnes of rocket at the required rate — the lever arm is long and the thrust enormous.

Now suppose the vehicle is also rolling at $\omega_1 = 0.05\,\mathrm{rad/s}$ ($2.9^\circ/\mathrm{s}$) while pitching at $\omega_2 = 2^\circ/\mathrm{s} = 0.0349\,\mathrm{rad/s}$. The third Euler equation reads $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 + M_3$. The coupling term is

$$
(I_1 - I_2)\,\omega_1\omega_2 = (7.03\times 10^5 - 5.92\times 10^7)\times 0.05\times 0.0349 = -1.02\times 10^5\,\mathrm{N\,m},
$$

a fifth of the pitch torque, appearing about yaw with no yaw command at all. Left uncorrected it gives $\dot{\omega}_3 = -1.02\times 10^5/5.92\times 10^7 = -1.72\times 10^{-3}\,\mathrm{rad/s^2}$, about $-0.1^\circ/\mathrm{s^2}$ of yaw acceleration. Physically, the pitch angular momentum $H_2 = I_2\omega_2 = 2.07\times 10^6\,\mathrm{N\,m\,s}$ is being rotated by the roll, and $\omega_1 H_2 = 1.03\times 10^5\,\mathrm{N\,m}$ is the torque needed to turn it. Launch vehicle autopilots keep roll rates near zero during the pitch program largely to keep this term small.
:::

## What goes on the right-hand side

The torque $\mathbf{M}$ collects everything external to the rigid body. On a launch vehicle the dominant terms are the gimballed thrust, of order $10^5$ to $10^6\,\mathrm{N\,m}$ as above, and the aerodynamic moment, which for an aerodynamically unstable vehicle is comparable and destabilising. On a spacecraft the control torques are small — a $1\,\mathrm{N}$ thruster on a $1\,\mathrm{m}$ arm gives $1\,\mathrm{N\,m}$, a reaction wheel $0.01$ to $1\,\mathrm{N\,m}$ — and the environmental torques are smaller still: gravity gradient and aerodynamic torques in low orbit are typically $10^{-5}$ to $10^{-3}\,\mathrm{N\,m}$, solar radiation pressure torque $10^{-6}$ to $10^{-5}\,\mathrm{N\,m}$, and a residual magnetic dipole interacting with the geomagnetic field somewhere in between. Small, but they act for months, and lesson 11 shows what accumulating them does to a reaction wheel.

Reaction wheels need a word of care. A wheel torque is internal to the spacecraft, so it does not appear in $\mathbf{M}$ when $\mathbf{H}$ is the total angular momentum of body plus wheels. It does appear when you write the equation for the body alone, with the wheel momentum tracked separately; that bookkeeping is lesson 11's subject. For now, $\mathbf{M}$ means external torque, and the body is rigid with no moving parts.

## Integrating the equations

With torques known as functions of time and state, the equations are integrated numerically alongside the kinematic equation $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ or its quaternion equivalent. A fourth-order Runge–Kutta scheme with a step small compared with the shortest oscillation period in the motion is adequate for most attitude work; the coupling period for the bus below is over two minutes, and a step of $0.01\,\mathrm{s}$ is generous.

```python
import numpy as np

def euler_deriv(w, I, M):
    """Body-rate derivative from Euler's equations, principal axes.
    w, I, M are length-3 arrays: rates (rad/s), moments (kg m^2), torque (N m)."""
    return np.array([
        ((I[1] - I[2]) * w[1] * w[2] + M[0]) / I[0],
        ((I[2] - I[0]) * w[2] * w[0] + M[1]) / I[1],
        ((I[0] - I[1]) * w[0] * w[1] + M[2]) / I[2],
    ])

def rk4_step(w, I, M, dt):
    k1 = euler_deriv(w, I, M)
    k2 = euler_deriv(w + 0.5 * dt * k1, I, M)
    k3 = euler_deriv(w + 0.5 * dt * k2, I, M)
    k4 = euler_deriv(w + dt * k3, I, M)
    return w + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)

I = np.array([1200.0, 1500.0, 2000.0])
w = np.array([0.02, 0.0, 0.10])
M = np.zeros(3)
H0, T0 = np.linalg.norm(I * w), 0.5 * np.dot(w, I * w)
for _ in range(30000):                # 300 s at dt = 0.01
    w = rk4_step(w, I, M, 0.01)
print(np.linalg.norm(I * w) / H0 - 1, 0.5 * np.dot(w, I * w) / T0 - 1)
# 5.6e-16 1.0e-15   -- both conserved to round-off
```

Two conserved quantities give a free check on any torque-free integration. Take the dot product of the vector equation with $\boldsymbol{\omega}$: the coupling term drops out because $\boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{H}) = 0$, leaving $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \boldsymbol{\omega}\cdot\mathbf{M}$, that is $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$. With no torque, the kinetic energy is constant. Take the dot product with $\mathbf{H}$ instead: $\mathbf{H}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \mathbf{H}\cdot\dot{\mathbf{H}}$ and again the cross term vanishes, so $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$. With no torque, the magnitude of the angular momentum is constant, as it must be, since $\mathbf{H}$ itself is fixed in space and only its body components move. A torque-free run whose $T$ or $\lVert\mathbf{H}\rVert$ drifts has an integrator problem, not a physics result.

::: example What the bus does with no torque
Run the code above and record the rates. Starting from $\boldsymbol{\omega} = (0.02, 0, 0.10)\,\mathrm{rad/s}$, the $x$ rate oscillates between $+0.020$ and $-0.020\,\mathrm{rad/s}$, the $y$ rate between $\pm 0.0226\,\mathrm{rad/s}$, and the $z$ rate stays within $0.0993$ to $0.100\,\mathrm{rad/s}$. The $x$ rate first crosses zero at $t = 33.4\,\mathrm{s}$ and again, in the same direction, at $167.2\,\mathrm{s}$: a period of $133.3\,\mathrm{s}$. Over the whole run $\lVert\mathbf{H}\rVert = 201.43\,\mathrm{N\,m\,s}$ and $T = 10.24\,\mathrm{J}$ hold to one part in $10^{15}$.

Both numbers can be predicted by hand, which is how you know the integrator is right. For small transverse rates about a spin $n = 0.10\,\mathrm{rad/s}$ on axis 3, the products $\omega_1\omega_2$ are second-order small and the third equation gives $\dot{\omega}_3 \approx 0$. The first two become linear: $I_1\dot{\omega}_1 = (I_2 - I_3)n\,\omega_2$ and $I_2\dot{\omega}_2 = (I_3 - I_1)n\,\omega_1$. Differentiate the first and substitute the second:

$$
\ddot{\omega}_1 = \frac{(I_2 - I_3)(I_3 - I_1)}{I_1 I_2}\,n^2\,\omega_1 = -\frac{(I_3 - I_2)(I_3 - I_1)}{I_1 I_2}\,n^2\,\omega_1 .
$$

With the bus numbers the coefficient is $-(500\times 800)/(1200\times 1500)\times 0.01 = -2.22\times 10^{-3}\,\mathrm{s^{-2}}$, so $\omega_1$ oscillates at $\sqrt{2.22\times 10^{-3}} = 0.0471\,\mathrm{rad/s}$, a period of $2\pi/0.0471 = 133.3\,\mathrm{s}$. The amplitude ratio follows from the first linear equation: $\omega_2$ peaks at $\omega_1$ times $\sqrt{I_1(I_3 - I_1)/(I_2(I_3 - I_2))} = \sqrt{1200\times 800/(1500\times 500)} = 1.13$, giving $0.0226\,\mathrm{rad/s}$. The simulation agrees to three figures. That linearisation is the whole of lesson 7's proof; here it is a test.
:::

::: warning The gyroscopic term is not a torque
$\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ has the units of torque and sits beside $\mathbf{M}$, but it is a kinematic consequence of describing motion in a rotating frame, not a physical torque acting on the body. Nothing pushes on the body during torque-free motion; its rates change anyway. Treating the term as a disturbance torque to be estimated leads to controllers that fight their own frame; treating it as known dynamics to be fed forward leads to controllers that work.
:::

::: warning Time-varying inertia
The derivation assumed $\mathbf{I}$ is constant in body axes. On a launch vehicle it is not: propellant leaves and the tensor falls by an order of magnitude during a burn. The body derivative of $\mathbf{H}$ is then $\dot{\mathbf{I}}\boldsymbol{\omega} + \mathbf{I}\dot{\boldsymbol{\omega}}$, and the full equation is $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{I}}\boldsymbol{\omega} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \mathbf{M}$, with a further correction for the angular momentum the exhaust carries away. For a slowly varying tensor and small rates the extra terms are usually negligible, but it is a modelling decision to make, not to forget.
:::

::: note Sign conventions
Some texts write Euler's equations as $I_1\dot{\omega}_1 - (I_2 - I_3)\omega_2\omega_3 = M_1$, moving the coupling to the left; others write $I_1\dot{\omega}_1 + (I_3 - I_2)\omega_2\omega_3 = M_1$. All are the same equation. The invariant content is that the coupling in equation $k$ is the product of the other two rates times the difference of the other two moments, with the sign fixed by the cyclic order $1 \to 2 \to 3$. When in doubt, recompute $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ from scratch.
:::

## Check yourself

::: check
Derive the third Euler equation, $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 + M_3$, directly from the vector form by computing the third component of $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ in principal axes.
:::

::: answer
In principal axes $\mathbf{I}\boldsymbol{\omega} = (I_1\omega_1, I_2\omega_2, I_3\omega_3)$. The third component of $\mathbf{a}\times\mathbf{b}$ is $a_1b_2 - a_2b_1$, so the third component of $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ is $\omega_1 I_2\omega_2 - \omega_2 I_1\omega_1 = (I_2 - I_1)\omega_1\omega_2$. The third component of the vector equation is therefore $I_3\dot{\omega}_3 + (I_2 - I_1)\omega_1\omega_2 = M_3$, and moving the coupling across gives $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 + M_3$.
:::

::: check
A body with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ spins at $\boldsymbol{\omega} = (0, 0.1, 0)\,\mathrm{rad/s}$ with no torque. What is $\dot{\boldsymbol{\omega}}$ now, and what would it be if the rate were instead $(0.001, 0.1, 0)$?
:::

::: answer
With only $\omega_2$ non-zero, every product $\omega_j\omega_k$ vanishes and $\dot{\boldsymbol{\omega}} = 0$: a spin about a principal axis is an equilibrium, whichever axis it is. With $(0.001, 0.1, 0)$, the third equation gives $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 = (1200 - 1500)\times 0.001\times 0.1 = -0.03\,\mathrm{N\,m}$, so $\dot{\omega}_3 = -1.5\times 10^{-5}\,\mathrm{rad/s^2}$; the first and second equations give zero because $\omega_3 = 0$. A rate appears about $z$ that was not there before. Whether it grows or oscillates depends on whether axis 2 is stable, which lesson 7 decides — here it is the intermediate axis, and it is not.
:::

::: check
Show that for torque-free motion $\dot{T} = 0$ and $\tfrac{d}{dt}\lVert\mathbf{H}\rVert^2 = 0$ follow from Euler's equation.
:::

::: answer
Dot the vector equation with $\boldsymbol{\omega}$: $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}) = \boldsymbol{\omega}\cdot\mathbf{M}$. The triple product with a repeated vector is zero, and since $\mathbf{I}$ is symmetric and constant, $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \tfrac{d}{dt}\tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = \dot{T}$. So $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M} = 0$ when $\mathbf{M} = 0$. Dot with $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ instead: $\mathbf{H}\cdot\dot{\mathbf{H}} + \mathbf{H}\cdot(\boldsymbol{\omega}\times\mathbf{H}) = \mathbf{H}\cdot\mathbf{M}$, the triple product again vanishes, and $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M} = 0$.
:::

::: check
A spacecraft with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ must hold a constant $\boldsymbol{\omega} = (0.05, 0.05, 0)\,\mathrm{rad/s}$. What torque is required, and why is it not zero even though nothing is accelerating?
:::

::: answer
With $\dot{\boldsymbol{\omega}} = 0$, $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$. Here $\mathbf{I}\boldsymbol{\omega} = (60, 75, 0)$ and the cross product is $(0.05\times 0 - 0\times 75,\ 0\times 60 - 0.05\times 0,\ 0.05\times 75 - 0.05\times 60) = (0, 0, 0.75)\,\mathrm{N\,m}$. The axis $(1, 1, 0)/\sqrt{2}$ is not principal, so $\mathbf{H}$ is not parallel to $\boldsymbol{\omega}$; holding the body's rotation fixed means dragging the vector $\mathbf{H}$ around in inertial space at rate $\boldsymbol{\omega}$, and changing $\mathbf{H}$ needs a torque. In principal-axis language, the third equation's coupling $(I_1 - I_2)\omega_1\omega_2 = -0.75\,\mathrm{N\,m}$ must be cancelled by $M_3 = +0.75\,\mathrm{N\,m}$.
:::

::: check
A simulation of a torque-free tumbling body shows $T$ growing by 0.1 per cent per hour with $\lVert\mathbf{H}\rVert$ growing by the same fraction. Halving the time step reduces both drifts by a factor of about sixteen. What is going on, and what does the factor tell you?
:::

::: answer
Both conserved quantities drift together and the drift responds to the step size, so the cause is the integrator, not the model or the physics. A factor of sixteen for halving the step is $2^4$, the signature of a fourth-order method such as RK4: its global error scales as the fourth power of the step. The fix is a smaller step, a higher-order or symplectic method, or a check that the state is not being renormalised incorrectly. A physical energy loss would leave $\lVert\mathbf{H}\rVert$ constant and would not care about the step size.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $d\mathbf{H}/dt|_N = \mathbf{M}$ | Rotational form of Newton's second law, about the centre of mass |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \mathbf{M}$ | Euler's equation in body axes; $\mathbf{I}$ constant there |
| $I_1\dot{\omega}_1 = (I_2 - I_3)\omega_2\omega_3 + M_1$ | Principal-axis form, plus two cyclic permutations |
| $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ | Gyroscopic coupling; zero on a principal axis; driven by differences of principal moments |
| Steady spin needs torque $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ | Unless $\boldsymbol{\omega}$ is along a principal axis |
| $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$, $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$ | Conserved for torque-free motion; integrator checks |
| Bus slew example | Commanding $(0, 0, 2)\,\mathrm{N\,m}$ with residual rates needs $(0.5, -0.4, 2.06)\,\mathrm{N\,m}$ |
| First stage | Pitch at $0.5^\circ/\mathrm{s^2}$ needs $0.195^\circ$ of gimbal; rolling while pitching yaws at $-0.1^\circ/\mathrm{s^2}$ |

The next lesson sets $\mathbf{M} = 0$ and asks what motions Euler's equations permit. Conservation of $\lVert\mathbf{H}\rVert$ and $T$ confines the body-frame angular velocity to the intersection of a sphere and an ellipsoid, a curve called the polhode, and its shape says at a glance which spins are stable.
