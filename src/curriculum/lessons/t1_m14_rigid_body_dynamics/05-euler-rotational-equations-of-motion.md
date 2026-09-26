---
id: l05-euler-rotational-equations-of-motion
title: Euler's rotational equations of motion
minutes: 21
covers:
  - Euler rotational equations of motion
---

Hold a spinning bicycle wheel by its axle and turn around on the spot. The wheel twists in your hands, sideways, in a direction you never pushed. Nothing strange is acting on it. It is doing what every spinning body does when the frame it lives in turns: one axis of motion leaks into another. This lesson writes down the law behind that leak.

Newton's second law for rotation is short: the rate of change of angular momentum, seen from space, equals the applied torque. Everything hard about rigid-body dynamics comes from writing that law in the one frame where the inertia tensor stays constant — the body frame — which rotates. The result is **[[Euler's|euler-name]] rotational equations**: three linked equations for how the body rates change. They are the **[[plant model|plant-model]]** in every attitude control design, the core of every **[[six-degree-of-freedom|six-dof]]** simulator, and the equations you will program in this module's coding exercises.

A GNC engineer uses them in both directions. Forward: given the torques from thrusters, wheels, a swiveling engine and the environment, step the body rates ahead in time, and through lesson 1's kinematics, the attitude. Backward: given the angular acceleration you want, find the torque the actuators must make — including a part that accelerates nothing but fights the body's own **gyroscopic coupling**, the leak between axes. On a launch vehicle that coupling shows up as a yaw torque from rolling while pitching. On a spacecraft it is why a turn about one axis disturbs the other two.

## From Newton to Euler

The previous module showed, for any group of particles, that the rate of change of angular momentum about the center of mass, seen from space, equals the net outside torque about the center of mass:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \mathbf{M} .
$$

Here $\mathbf{M}$ is the torque vector, in newton meters, and the bar with $N$ means "rate as seen from inertial space". Internal forces cancel in pairs and add nothing. That is why a reaction wheel or sloshing fuel cannot change the total $\mathbf{H}$ of the vehicle.

Now bring in the rigid body. Three steps turn Newton's law into Euler's.

**Step 1: use $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$.** For a rigid body, with $\mathbf{I}$ constant in body axes (lesson 4).

**Step 2: move the rate into the body frame.** The transport rule from lesson 1 says

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \left.\frac{d\mathbf{H}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{H} .
$$

**Step 3: take the body rate of $\mathbf{I}\boldsymbol{\omega}$.** In the body frame the entries of $\mathbf{I}$ do not change, so only $\boldsymbol{\omega}$ changes, and the body rate of $\mathbf{I}\boldsymbol{\omega}$ is $\mathbf{I}\dot{\boldsymbol{\omega}}$. Here $\dot{\boldsymbol{\omega}}$ ("omega dot") is the rate of change of the body components of $\boldsymbol{\omega}$. Lesson 1 showed this equals the inertial rate too, since $\boldsymbol{\omega}\times\boldsymbol{\omega} = 0$.

Put the three together and set the result equal to the torque:

$$
\mathbf{I}\,\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M} .
$$

This is **Euler's rotational equation** in vector form. Every symbol in it is a body-axis component. $\boldsymbol{\omega}$ is what the gyros read. $\mathbf{M}$ is the torque along the structural axes. $\mathbf{I}$ is the tensor about the center of mass in those same axes.

Solved for the angular acceleration, it becomes

$$
\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}\bigl(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}\bigr),
$$

the form a simulator steps forward. The inverse $\mathbf{I}^{-1}$ always exists, because $\mathbf{I}$ is positive definite.

### The principal-axis form

In principal axes, $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$ and $\mathbf{I}\boldsymbol{\omega} = (I_1\omega_1, I_2\omega_2, I_3\omega_3)$. Work out the first component of the cross product $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$. The first component of $\mathbf{a}\times\mathbf{b}$ is $a_2b_3 - a_3b_2$, so

$$
\omega_2(I_3\omega_3) - \omega_3(I_2\omega_2) = (I_3 - I_2)\,\omega_2\omega_3 .
$$

Move it to the right-hand side, where it changes sign to $(I_2 - I_3)\omega_2\omega_3$. The other two components come out the same way:

$$
\begin{aligned}
I_1\dot{\omega}_1 &= (I_2 - I_3)\,\omega_2\omega_3 + M_1, \\
I_2\dot{\omega}_2 &= (I_3 - I_1)\,\omega_3\omega_1 + M_2, \\
I_3\dot{\omega}_3 &= (I_1 - I_2)\,\omega_1\omega_2 + M_3 .
\end{aligned}
$$

Each line is the one above with every index moved along one step, $1 \to 2 \to 3 \to 1$. That pattern is called a **[[cyclic permutation|cyclic-order]]**. So you only need to remember the first line.

This is the form to memorize, and the form the exercise starter code asks you to program. Everything the rest of the module says about spin stability comes from the signs of the three differences $I_2 - I_3$, $I_3 - I_1$ and $I_1 - I_2$.

::: key Euler's rotational equations
$\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$, all in body axes about the center of mass. In principal axes: $I_1\dot{\omega}_1 = (I_2 - I_3)\omega_2\omega_3 + M_1$ and its two cyclic permutations. The term $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ is the gyroscopic coupling; it vanishes when $\boldsymbol{\omega}$ lies along a principal axis and is what makes the equations nonlinear.
:::

## Reading the gyroscopic term

The term $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \boldsymbol{\omega}\times\mathbf{H}$ needs a careful look, because it is often mistaken for a torque. It is not one. It is the correction for watching a fixed arrow from a turning seat. The body components of $\mathbf{H}$ change at the rate $-\boldsymbol{\omega}\times\mathbf{H}$ even when $\mathbf{H}$ is fixed in space. And since $H_k = I_k\omega_k$, that means the body rates change. Three results fall straight out of the principal-axis form.

**1. A pure spin about any principal axis is an equilibrium.** Set $\omega_1 = \omega_2 = 0$ and $\omega_3 = n$, with no torque. Every product $\omega_j\omega_k$ on the right is zero, so $\dot{\boldsymbol{\omega}} = 0$. The body spins steadily forever. Whether that **[[equilibrium is stable|pencil-balance]]** — whether a small nudge stays small — is a separate question, and lesson 7 answers it.

**2. A steady spin about any other axis needs a torque.** If $\dot{\boldsymbol{\omega}} = 0$ while $\boldsymbol{\omega}$ is off a principal axis, then $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$, which is not zero. Lesson 4 worked this out for the bus with an off-center tank: holding a $0.05\,\mathrm{rad/s}$ spin on body $x$, one degree from the nearest principal axis, needs $0.054\,\mathrm{N\,m}$ of steady torque about $z$. The bearings of an unbalanced wheel supply exactly this kind of torque, which is why balance matters.

**3. Equal moments mean no coupling.** If all three principal moments are equal, every difference $I_j - I_k$ is zero. The equations shrink to $I\dot{\boldsymbol{\omega}} = \mathbf{M}$: three separate copies of Newton's law. So the coupling is driven entirely by the *differences* between the principal moments, not by their size. A bus with $\mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ couples through differences of $300$, $500$ and $800$. A launch vehicle with $\mathrm{diag}(7.03\times 10^5, 5.92\times 10^7, 5.92\times 10^7)$ couples pitch into yaw through a difference of $5.85\times 10^7$. It couples nothing into roll, because the two sideways moments are equal and $I_2 - I_3 = 0$.

The products $\omega_j\omega_k$ make the equations **nonlinear** — the unknowns multiply each other. There is no general formula solving them for any torque. Even the torque-free case, for a body with three different moments, needs special functions called elliptic functions. The torque-free case with two equal moments can be solved with sines and cosines, as lessons 6 and 9 show. For anything else, you step the equations forward numerically, or you **linearize** them — replace them with a simpler straight-line version that is accurate close to a chosen motion. Controllers do the latter.

::: example Torque for a turn with leftover rates
The bus with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ must speed up about its $z$ axis at $\dot{\omega}_3 = 0.001\,\mathrm{rad/s^2}$, with no speeding up about $x$ or $y$. It still carries leftover rates $\boldsymbol{\omega} = (0.01, 0.02, 0.05)\,\mathrm{rad/s}$ from an earlier maneuver. What torque must the actuators apply?

**Angular momentum.** Multiply each rate by its moment: $\mathbf{I}\boldsymbol{\omega} = (12, 30, 100)\,\mathrm{N\,m\,s}$.

**Gyroscopic term.** Cross $\boldsymbol{\omega}$ with that, one component at a time:

$$
\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \bigl(0.02\times 100 - 0.05\times 30,\ 0.05\times 12 - 0.01\times 100,\ 0.01\times 30 - 0.02\times 12\bigr) = (0.5,\ -0.4,\ 0.06)\,\mathrm{N\,m}.
$$

**Acceleration term.** $\mathbf{I}\dot{\boldsymbol{\omega}} = (0, 0, 2000\times 0.001) = (0, 0, 2)\,\mathrm{N\,m}$.

**Add them.**

$$
\mathbf{M} = \mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = (0.5,\ -0.4,\ 2.06)\,\mathrm{N\,m}.
$$

To speed up about $z$ alone, the actuators must also push $0.5\,\mathrm{N\,m}$ about $x$ and $-0.4\,\mathrm{N\,m}$ about $y$. That is a quarter of the main torque, on axes that are not supposed to be doing anything.

**What if you ignore it?** A controller that commands only $(0, 0, 2)$ will see $x$ and $y$ rates grow. From the first equation, $\dot{\omega}_1 = -0.5/1200 = -4.2\times 10^{-4}\,\mathrm{rad/s^2}$. Over a 60 s turn that adds up to roughly $4.2\times 10^{-4}\times 60 = 0.025\,\mathrm{rad/s}$ — more than the leftover rate it started with. This is why attitude controllers either **[[feed the gyroscopic term forward|feed-forward]]** or keep rates small enough that it does not matter.
:::

::: example Pitch and yaw coupling on a first stage
The loaded first stage of lesson 2 has $I_1 = 7.03\times 10^5\,\mathrm{kg\,m^2}$ about its roll axis and $I_2 = I_3 = 5.92\times 10^7\,\mathrm{kg\,m^2}$ about pitch and yaw. The pitch program calls for $\dot{\omega}_2 = 0.5^\circ/\mathrm{s^2} = 8.73\times 10^{-3}\,\mathrm{rad/s^2}$, with no other rates.

**Pitch torque.** $M_2 = I_2\dot{\omega}_2 = 5.92\times 10^7\times 8.73\times 10^{-3} = 5.17\times 10^5\,\mathrm{N\,m}$.

**Engine tilt.** The engines push $F = 7.6\,\mathrm{MN}$ and sit $\ell = 20\,\mathrm{m}$ behind the center of mass. Tilting the thrust by a **[[gimbal angle|gimbal]]** $\delta$ ("delta") gives a torque $F\ell\sin\delta$. Solve for the angle:

$$
\delta = \arcsin\frac{5.17\times 10^5}{7.6\times 10^6\times 20} = 3.40\times 10^{-3}\,\mathrm{rad} = 0.195^\circ .
$$

A fifth of a degree of engine tilt pitches 420 tonnes of rocket at the required rate. The lever is long and the thrust is enormous.

**Now add a roll.** Suppose the vehicle also rolls at $\omega_1 = 0.05\,\mathrm{rad/s}$ ($2.9^\circ/\mathrm{s}$) while pitching at $\omega_2 = 2^\circ/\mathrm{s} = 0.0349\,\mathrm{rad/s}$. The third Euler equation reads $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 + M_3$. Its coupling term is

$$
(I_1 - I_2)\,\omega_1\omega_2 = (7.03\times 10^5 - 5.92\times 10^7)\times 0.05\times 0.0349 = -1.02\times 10^5\,\mathrm{N\,m}.
$$

That is a fifth of the pitch torque, showing up about yaw with no yaw command at all. Left alone it gives $\dot{\omega}_3 = -1.02\times 10^5/5.92\times 10^7 = -1.72\times 10^{-3}\,\mathrm{rad/s^2}$, about $-0.1^\circ/\mathrm{s^2}$ of yaw acceleration.

**The picture.** The pitch angular momentum is $H_2 = I_2\omega_2 = 2.07\times 10^6\,\mathrm{N\,m\,s}$. The roll is **[[turning that arrow|roll-turns-h]]**, and turning it takes a torque of $\omega_1 H_2 = 0.05\times 2.07\times 10^6 = 1.03\times 10^5\,\mathrm{N\,m}$ — the same size as the coupling term. Launch vehicle autopilots hold roll rate near zero during the pitch program largely to keep this term small.
:::

## What goes on the right-hand side

The torque $\mathbf{M}$ collects everything outside the rigid body.

On a launch vehicle the big terms are the tilted engine thrust, of order $10^5$ to $10^6\,\mathrm{N\,m}$ as above, and the aerodynamic moment. For a vehicle that is aerodynamically unstable, the air's moment is about as large and pushes the wrong way.

On a spacecraft the control torques are small. A $1\,\mathrm{N}$ thruster on a $1\,\mathrm{m}$ arm gives $1\,\mathrm{N\,m}$. A reaction wheel gives $0.01$ to $1\,\mathrm{N\,m}$. The environment's torques are smaller still. In low orbit, gravity-gradient and aerodynamic torques are typically $10^{-5}$ to $10^{-3}\,\mathrm{N\,m}$. Sunlight pressure gives $10^{-6}$ to $10^{-5}\,\mathrm{N\,m}$. A leftover magnetic field in the spacecraft, pulling against Earth's field, lands somewhere in between. Tiny — but they act for months, and lesson 11 shows what piling them up does to a reaction wheel.

Reaction wheels need care. A wheel's torque is *internal* to the spacecraft. So it does not appear in $\mathbf{M}$ when $\mathbf{H}$ is the total angular momentum of body plus wheels. It does appear when you write the equation for the body alone and track the wheel's momentum separately — the bookkeeping of lesson 11. For now, $\mathbf{M}$ means outside torque, and the body is rigid with no moving parts.

## Stepping the equations forward in time

With the torques known, a computer steps the equations forward, together with the kinematic equation $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ or its quaternion version. A **[[fourth-order Runge–Kutta|runge-kutta]]** scheme (RK4) is enough for most attitude work, provided each time step is small compared with the fastest wobble in the motion. For the bus below, the wobble takes over two minutes, so a step of $0.01\,\mathrm{s}$ is generous.

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
print(f"{np.linalg.norm(I * w) / H0 - 1:.1e} {0.5 * np.dot(w, I * w) / T0 - 1:.1e}")
# 6.7e-16 1.3e-15   -- both conserved to round-off
```

### Two free checks

With no torque, two numbers must stay constant. That gives a free test of any simulation.

**Energy.** Take the dot product of Euler's equation with $\boldsymbol{\omega}$. The coupling term drops out, because $\boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{H}) = 0$: a cross product is perpendicular to both its vectors. What is left is $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \boldsymbol{\omega}\cdot\mathbf{M}$, which is $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$. With no torque, the kinetic energy is constant.

**Momentum.** Take the dot product with $\mathbf{H}$ instead. Again the cross term vanishes, leaving $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$. With no torque, the length of the angular momentum is constant. It must be: $\mathbf{H}$ itself is fixed in space, and only its body components move.

A torque-free run whose $T$ or $\lVert\mathbf{H}\rVert$ drifts has an integrator problem, not a physics result.

::: example What the bus does with no torque
Run the code above and record the rates along the way. Starting from $\boldsymbol{\omega} = (0.02, 0, 0.10)\,\mathrm{rad/s}$:

- the $x$ rate swings between $+0.020$ and $-0.020\,\mathrm{rad/s}$;
- the $y$ rate swings between $\pm 0.0226\,\mathrm{rad/s}$;
- the $z$ rate stays between $0.0993$ and $0.100\,\mathrm{rad/s}$.

The $x$ rate first crosses zero at about $t = 33.4\,\mathrm{s}$, and next crosses it in the same direction at $167.2\,\mathrm{s}$ — a period of $133.3\,\mathrm{s}$. Over the whole run, $\lVert\mathbf{H}\rVert = 201.43\,\mathrm{N\,m\,s}$ and $T = 10.24\,\mathrm{J}$ hold to about one part in $10^{15}$.

**Predict it by hand.** Both numbers can be worked out without a computer, which is how you know the simulation is right. With the spin $n = 0.10\,\mathrm{rad/s}$ on axis 3 and small sideways rates, the product $\omega_1\omega_2$ is tiny squared, so the third equation gives $\dot{\omega}_3 \approx 0$. The first two become straight-line (linear) equations:

$$
I_1\dot{\omega}_1 = (I_2 - I_3)\,n\,\omega_2, \qquad I_2\dot{\omega}_2 = (I_3 - I_1)\,n\,\omega_1 .
$$

Take the rate of change of the first and substitute the second for $\dot{\omega}_2$:

$$
\ddot{\omega}_1 = \frac{(I_2 - I_3)(I_3 - I_1)}{I_1 I_2}\,n^2\,\omega_1 = -\frac{(I_3 - I_2)(I_3 - I_1)}{I_1 I_2}\,n^2\,\omega_1 .
$$

Put in the bus numbers: the coefficient is $-(500\times 800)/(1200\times 1500)\times 0.01 = -2.22\times 10^{-3}\,\mathrm{s^{-2}}$. A negative coefficient means a back-and-forth swing, at $\sqrt{2.22\times 10^{-3}} = 0.0471\,\mathrm{rad/s}$. The period is $2\pi/0.0471 = 133.3\,\mathrm{s}$.

The size of the $y$ swing follows from the first linear equation: $\omega_2$ peaks at $\omega_1$'s peak times $\sqrt{I_1(I_3 - I_1)/(I_2(I_3 - I_2))} = \sqrt{1200\times 800/(1500\times 500)} = 1.13$. That gives $0.020\times 1.13 = 0.0226\,\mathrm{rad/s}$. The simulation agrees to three figures. This linearization is the whole of lesson 7's proof; here it serves as a test.
:::

::: warning The gyroscopic term is not a torque
$\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ has the units of torque and sits beside $\mathbf{M}$. But it comes from describing motion in a rotating frame, not from anything pushing on the body. During torque-free motion nothing pushes, and the rates change anyway. Treat the term as a disturbance torque to be estimated, and you get a controller that fights its own frame. Treat it as known physics to be fed forward, and you get a controller that works.
:::

::: warning Changing inertia
The derivation assumed $\mathbf{I}$ is constant in body axes. On a launch vehicle it is not: propellant leaves, and the tensor shrinks by more than ten times during a burn. The body rate of $\mathbf{H}$ is then $\dot{\mathbf{I}}\boldsymbol{\omega} + \mathbf{I}\dot{\boldsymbol{\omega}}$, and the full equation is $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{I}}\boldsymbol{\omega} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \mathbf{M}$, with a further correction for the angular momentum the exhaust carries away. For a slowly changing tensor and small rates the extra terms are usually negligible — but that is a modeling decision to make on purpose, not to forget.
:::

::: note Sign conventions
Some books write $I_1\dot{\omega}_1 - (I_2 - I_3)\omega_2\omega_3 = M_1$, with the coupling on the left. Others write $I_1\dot{\omega}_1 + (I_3 - I_2)\omega_2\omega_3 = M_1$. They are all the same equation. What never changes: the coupling in equation $k$ is the product of the *other two* rates times the difference of the *other two* moments, with the sign set by the cyclic order $1 \to 2 \to 3$. When in doubt, work out $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ from scratch.
:::

## Check yourself

::: check
Derive the third Euler equation, $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 + M_3$, from the vector form by working out the third component of $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ in principal axes.
:::

::: answer
In principal axes, $\mathbf{I}\boldsymbol{\omega} = (I_1\omega_1, I_2\omega_2, I_3\omega_3)$. The third component of $\mathbf{a}\times\mathbf{b}$ is $a_1b_2 - a_2b_1$. So the third component of $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ is

$$
\omega_1(I_2\omega_2) - \omega_2(I_1\omega_1) = (I_2 - I_1)\,\omega_1\omega_2 .
$$

The third line of the vector equation is therefore $I_3\dot{\omega}_3 + (I_2 - I_1)\omega_1\omega_2 = M_3$. Move the coupling to the right, flipping its sign, to get $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 + M_3$.
:::

::: check
A body with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ spins at $\boldsymbol{\omega} = (0, 0.1, 0)\,\mathrm{rad/s}$ with no torque. What is $\dot{\boldsymbol{\omega}}$? What would it be if the rate were $(0.001, 0.1, 0)$ instead?
:::

::: answer
With only $\omega_2$ nonzero, every product $\omega_j\omega_k$ is zero, so $\dot{\boldsymbol{\omega}} = 0$. A spin about a principal axis is an equilibrium, whichever axis it is.

With $(0.001, 0.1, 0)$, the third equation gives $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 = (1200 - 1500)\times 0.001\times 0.1 = -0.03\,\mathrm{N\,m}$. Divide by $I_3 = 2000$: $\dot{\omega}_3 = -1.5\times 10^{-5}\,\mathrm{rad/s^2}$. The first and second equations give zero, because each contains $\omega_3 = 0$.

So a rate appears about $z$ that was not there before. Whether it grows or only swings depends on whether axis 2 is stable, which lesson 7 decides. Here axis 2 is the intermediate axis — and it is not stable.
:::

::: check
Show that, with no torque, Euler's equation forces $\dot{T} = 0$ and $\tfrac{d}{dt}\lVert\mathbf{H}\rVert^2 = 0$.
:::

::: answer
Dot the vector equation with $\boldsymbol{\omega}$:

$$
\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}) = \boldsymbol{\omega}\cdot\mathbf{M}.
$$

A triple product with a repeated vector is zero, so the second term vanishes. Since $\mathbf{I}$ is symmetric and constant, $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \tfrac{d}{dt}\tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = \dot{T}$. So $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$, which is zero when $\mathbf{M} = 0$.

Now dot with $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ instead: $\mathbf{H}\cdot\dot{\mathbf{H}} + \mathbf{H}\cdot(\boldsymbol{\omega}\times\mathbf{H}) = \mathbf{H}\cdot\mathbf{M}$. The triple product again vanishes, and $\mathbf{H}\cdot\dot{\mathbf{H}} = \tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2$. So $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M} = 0$.
:::

::: check
A spacecraft with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ must hold a constant $\boldsymbol{\omega} = (0.05, 0.05, 0)\,\mathrm{rad/s}$. What torque does it need, and why is it not zero when nothing is speeding up?
:::

::: answer
With $\dot{\boldsymbol{\omega}} = 0$, Euler's equation leaves $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$. Here $\mathbf{I}\boldsymbol{\omega} = (60, 75, 0)$, and the cross product is

$$
(0.05\times 0 - 0\times 75,\ 0\times 60 - 0.05\times 0,\ 0.05\times 75 - 0.05\times 60) = (0,\ 0,\ 0.75)\,\mathrm{N\,m}.
$$

The axis $(1, 1, 0)/\sqrt{2}$ is not principal, so $\mathbf{H}$ is not parallel to $\boldsymbol{\omega}$. Holding the body's rotation fixed means dragging $\mathbf{H}$ around in space at rate $\boldsymbol{\omega}$, and changing $\mathbf{H}$ takes a torque. In principal-axis language: the third equation's coupling, $(I_1 - I_2)\omega_1\omega_2 = (1200 - 1500)\times 0.05\times 0.05 = -0.75\,\mathrm{N\,m}$, must be canceled by $M_3 = +0.75\,\mathrm{N\,m}$.
:::

::: check
A simulation of a torque-free tumbling body shows $T$ growing by 0.1 percent per hour, with $\lVert\mathbf{H}\rVert$ growing by the same fraction. Halving the time step shrinks both drifts by a factor of about sixteen. What is going on, and what does the sixteen tell you?
:::

::: answer
Both conserved numbers drift together, and the drift responds to the step size. So the cause is the integrator, not the model or the physics.

Sixteen is $2^4$. Halving the step and getting sixteen times less error is the signature of a fourth-order method such as RK4, whose error grows as the fourth power of the step. The fix is a smaller step, a higher-order or structure-preserving method, or a check that the state is not being renormalized wrongly. A real physical energy loss would leave $\lVert\mathbf{H}\rVert$ constant and would not care about the step size.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $d\mathbf{H}/dt\vert_N = \mathbf{M}$ | Newton's second law for rotation, about the center of mass |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega} = \mathbf{M}$ | Euler's equation in body axes, where $\mathbf{I}$ is constant |
| $I_1\dot{\omega}_1 = (I_2 - I_3)\omega_2\omega_3 + M_1$ | Principal-axis form, plus two cyclic permutations |
| $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ | Gyroscopic coupling; zero on a principal axis; driven by differences of principal moments |
| Steady spin needs torque $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ | Unless $\boldsymbol{\omega}$ is along a principal axis |
| $\dot{T} = \boldsymbol{\omega}\cdot\mathbf{M}$, $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$ | Both constant with no torque; free checks on a simulation |
| Bus turn example | Commanding $2\,\mathrm{N\,m}$ about $z$ with leftover rates needs $(0.5, -0.4, 2.06)\,\mathrm{N\,m}$ |
| First stage | Pitching at $0.5^\circ/\mathrm{s^2}$ needs $0.195^\circ$ of gimbal; rolling while pitching yaws it at $-0.1^\circ/\mathrm{s^2}$ |

The next lesson sets $\mathbf{M} = 0$ and asks what motions Euler's equations allow. The two conserved numbers, $\lVert\mathbf{H}\rVert$ and $T$, trap the body-frame angular velocity on the crossing of a sphere and an ellipsoid. That crossing curve is called the polhode, and its shape tells you at a glance which spins are stable.

::: context euler-name Leonhard Euler
Leonhard Euler (1707–1783), a Swiss mathematician, wrote more mathematics than almost anyone in history. He set out the theory of spinning rigid bodies in a 1765 book on the motion of solid bodies, and the three equations in this lesson carry his name. The same Euler gives his name to Euler angles, Euler's number $e$ and Euler's formula $e^{i\theta} = \cos\theta + i\sin\theta$.
:::

::: context plant-model What "plant" means
Control engineers call the thing being controlled the **plant** — a word borrowed from factories and power plants. The plant model is the set of equations saying how the plant responds to inputs. For attitude control the inputs are torques, the outputs are rates and angles, and Euler's equations are the model. A controller is only as good as the plant model it was designed against.
:::

::: context six-dof Six ways to move
A rigid body can move in six independent ways: slide along three directions (forward, sideways, up) and turn about three axes (roll, pitch, yaw). Each is a **degree of freedom**. A "6-DOF" simulator tracks all six. Newton's $\mathbf{F} = m\mathbf{a}$ handles the three slides; Euler's equations handle the three turns. Every launch vehicle and spacecraft is flown thousands of times in 6-DOF simulation before it flies for real.
:::

::: context cyclic-order Going around the circle
To get the next Euler equation, move every index one step around this circle: $1$ becomes $2$, $2$ becomes $3$, and $3$ wraps back to $1$. Starting from $I_1\dot{\omega}_1 = (I_2 - I_3)\omega_2\omega_3$ you get $I_2\dot{\omega}_2 = (I_3 - I_1)\omega_3\omega_1$, then $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="85" r="60" fill="none" stroke="#8fb8f0" stroke-width="3"/>
  <circle cx="180" cy="25" r="16" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="30" font-size="14" text-anchor="middle" fill="#1f2a44">1</text>
  <circle cx="232" cy="115" r="16" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="232" y="120" font-size="14" text-anchor="middle" fill="#1f2a44">2</text>
  <circle cx="128" cy="115" r="16" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="128" y="120" font-size="14" text-anchor="middle" fill="#1f2a44">3</text>
  <polygon points="232.0,55.0 220.8,47.6 231.2,41.6" fill="#1d6fd1"/>
  <polygon points="180.0,145.0 192.0,139.0 192.0,151.0" fill="#1d6fd1"/>
  <polygon points="128.0,55.0 127.2,68.4 116.8,62.4" fill="#1d6fd1"/>
  <text x="258" y="90" font-size="12" fill="#1f2a44">1 → 2 → 3 → 1</text>
</svg>
```
:::

::: context pencil-balance Balanced is not the same as stable
A pencil standing on its tip is in equilibrium: if it were perfectly upright, nothing would make it fall. But the smallest breath of air topples it. A pencil hanging from a string is also in equilibrium, and a nudge only makes it swing a little. Both are "equilibria"; only the second is **stable**. Spins about principal axes are the same: all three are equilibria, and lesson 7 finds that one of them behaves like the pencil on its tip.
:::

::: context gimbal Steering by tilting the engine
A **gimbal** is a pivot that lets the engine tilt. Tilt it by $\delta$ and the thrust no longer points through the center of mass; its sideways part, $F\sin\delta$, acting a distance $\ell$ away, makes a torque $F\ell\sin\delta$. The angle here is drawn much larger than the real $0.195^\circ$ so you can see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <rect x="160" y="10" width="40" height="160" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="60" r="5" fill="#1f2a44"/>
  <text x="208" y="64" font-size="12" fill="#1f2a44">center of mass</text>
  <line x1="180" y1="60" x2="180" y2="170" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="186" y="125" font-size="12" fill="#6c7a93">ℓ</text>
  <line x1="180" y1="170" x2="180" y2="212" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="170" x2="200.5" y2="208.6" stroke="#b4232c" stroke-width="3"/>
  <text x="210" y="200" font-size="12" fill="#b4232c">engine tilted by δ</text>
  <line x1="180" y1="170" x2="159.5" y2="131.4" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="159.5,131.4 169.1,141.0 162.1,144.8" fill="#1d6fd1"/>
  <text x="100" y="138" font-size="12" fill="#1d6fd1">thrust F</text>
</svg>
```
:::

::: context feed-forward Feeding it forward
A **feedback** controller waits for an error, then reacts. A **feedforward** term acts before any error appears, because the physics says what is coming. Here the controller already knows $\boldsymbol{\omega}$ from its gyros and $\mathbf{I}$ from the mass-properties report, so it can compute $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ and add it to the command. Feedback then only has to clean up what the model got wrong.
:::

::: context roll-turns-h The roll turns the pitch arrow
Look down the roll axis. The pitch angular momentum $H_2$ points along the pitch axis. Rolling at $\omega_1$ swings that arrow around, and the change points along yaw at the rate $\omega_1 H_2$. Changing an angular momentum takes a torque, so something — the engines — must supply $\omega_1 H_2$ about yaw, or the rocket starts to yaw on its own. The swing angle is drawn larger than life.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="300" y="190" font-size="12" fill="#6c7a93">pitch axis</text>
  <line x1="60" y1="170" x2="60" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="68" y="22" font-size="12" fill="#6c7a93">yaw axis</text>
  <line x1="60" y1="170" x2="280" y2="170" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="290,170 278,164 278,176" fill="#1d6fd1"/>
  <text x="170" y="160" font-size="12" fill="#1d6fd1">H₂ before</text>
  <line x1="60" y1="170" x2="276.7" y2="131.8" stroke="#8fb8f0" stroke-width="4"/>
  <polygon points="286.5,130.1 275.7,138.1 273.6,126.3" fill="#8fb8f0"/>
  <text x="150" y="130" font-size="12" fill="#1f2a44">H₂ after a little roll</text>
  <line x1="300" y1="170" x2="300" y2="138" stroke="#b4232c" stroke-width="3"/>
  <polygon points="300,128 294,140 306,140" fill="#b4232c"/>
  <text x="352" y="100" font-size="12" text-anchor="end" fill="#b4232c">change</text>
  <text x="352" y="114" font-size="12" text-anchor="end" fill="#b4232c">along yaw</text>
</svg>
```
:::

::: context runge-kutta Tasting the slope four times
The simplest way to step forward is to take the current rate of change and walk a straight line for one time step. It drifts off quickly. Carl Runge and Martin Kutta, around 1900, showed a better way: sample the rate of change four times — at the start, twice in the middle, and at the end — and take a weighted average. The total error then shrinks as the fourth power of the step, which is why halving the step cuts it sixteenfold.
:::
