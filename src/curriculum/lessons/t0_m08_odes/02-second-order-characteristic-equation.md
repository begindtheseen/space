---
id: l02-second-order-characteristic-equation
title: Second-order equations and the characteristic equation
minutes: 22
covers:
  - second-order linear constant-coefficient ODEs and the characteristic equation
---

Push down on the front of a car and let go. With good shock absorbers, it rises back up and stops. With worn-out ones, it bounces up and down a few times before settling. Something in the car can do what the cocoa and the shower of the last lesson never could: it can **overshoot** — go past where it is heading and swing back.

That swinging comes from one more derivative. **[[Newton's second law|newton-second-order]]** says force sets acceleration, and acceleration is the *second* derivative of position. So every rigid-body motion a GNC engineer cares about — a spacecraft turning under a control torque, a launch vehicle pitching as its engine swivels, a lander riding its throttled engines down — is a second-order differential equation before anything else is added. First-order equations describe how things *approach* a value. Second-order ones can also oscillate, overshoot and ring.

The good news is that the constant-coefficient linear case — which covers a rigid body plus a simple controller — can be solved completely with one idea. Guess that the answer is an exponential, put the guess in, and the differential equation collapses into a quadratic. That quadratic is the **characteristic equation**. Its two roots tell you everything about how the system moves on its own: decaying or growing, swinging or not, how fast, and how long until it settles. For the rest of the module you will call those roots the **poles** of the system.

## The equation and its structure

The general second-order linear ODE with constant coefficients is

$$
a\,\ddot{y} + b\,\dot{y} + c\,y = f(t).
$$

Read $\ddot{y}$ as "y double dot": the second derivative, the rate of change of the rate of change. The numbers $a \ne 0$, $b$ and $c$ are real constants, and $f(t)$ is a known **forcing function** — the outside push. When $f = 0$ the equation is **homogeneous**: the system is left alone to move on its own.

You will usually see it in one of two costumes:

- In mechanics, $m\ddot{x} + c\dot{x} + kx = F(t)$: a **[[mass on a spring with a damper|mass-spring-damper]]**. Here $m$ is the mass, $c$ the **damping coefficient** (how hard the damper resists motion), $k$ the **stiffness** (how hard the spring pulls back) and $F$ the applied force.
- In attitude control, $I\ddot{\theta} + K_d\dot{\theta} + K_p\theta = T(t)$: a spacecraft's angle $\theta$ ("theta") with moment of inertia $I$, a **derivative gain** $K_d$, a **proportional gain** $K_p$ and a torque $T$.

Linearity gives the same structure as in the first-order case, and each proof is one line. If $y_1$ and $y_2$ solve the homogeneous equation, so does any combination $C_1y_1 + C_2y_2$. Substitute it, and the operation "take $a$ times the second derivative, plus $b$ times the first, plus $c$ times the function" splits over the sum, giving $C_1 \cdot 0 + C_2 \cdot 0 = 0$. If $y_p$ solves the forced equation, then $y_p + C_1y_1 + C_2y_2$ does too. And every solution of the forced equation has this form, because the difference of two solutions is homogeneous.

### Two constants, two starting facts

The new feature is that there are *two* free constants. A second-order equation needs two initial conditions, $y(0)$ and $\dot{y}(0)$. On a vehicle those are position and velocity, or angle and turn rate. To throw a ball, you need to know both where it leaves your hand and how fast — and two constants are exactly what it takes to match both.

For this to work, the two homogeneous solutions must be genuinely different. They must be **linearly independent**: neither is a constant multiple of the other. The test is the **[[Wronskian|wronskian]]**,

$$
W = y_1\dot{y}_2 - \dot{y}_1y_2.
$$

If $W \ne 0$, the pair is independent and any two initial conditions can be matched. For a linear constant-coefficient equation, the initial value problem has exactly one solution, and it exists for all time.

## The exponential guess and the characteristic equation

The homogeneous equation asks for a function whose second derivative, first derivative and value are all proportional to one another. One function is famous for this: the exponential. Every derivative of $e^{st}$ is a multiple of $e^{st}$ itself.

So try $y = e^{st}$, with $s$ a constant still to be found. This kind of educated guess has a name, an **[[ansatz|ansatz]]**. Then $\dot{y} = se^{st}$ and $\ddot{y} = s^2e^{st}$. Put them in:

$$
a s^2 e^{st} + b s e^{st} + c e^{st} = \bigl(as^2 + bs + c\bigr)e^{st} = 0.
$$

An exponential is never zero, so the guess works exactly when

$$
a s^2 + b s + c = 0.
$$

This is the **characteristic equation**. The differential equation has turned into algebra you already know. Its roots, from the quadratic formula,

$$
s_{1,2} = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a},
$$

are the exponents of the two homogeneous solutions.

A word on units. The product $st$ must be a pure number, so $s$ has units of $\mathrm{s^{-1}}$ ("per second"). When the roots are complex, their imaginary parts are angular frequencies in $\mathrm{rad/s}$.

The **discriminant** $b^2 - 4ac$, the part under the square root, sorts the roots into three cases. Each case gives a different shape of motion — like the car with worn shocks, perfect shocks and very stiff shocks.

::: key
For $a\ddot{y} + b\dot{y} + cy = 0$, substituting $y = e^{st}$ gives the characteristic equation $as^2 + bs + c = 0$. Its roots are the exponents of the homogeneous solutions: real distinct roots give two exponentials, a repeated root gives $e^{st}$ and $te^{st}$, and a complex pair $\sigma \pm j\omega$ gives $e^{\sigma t}\cos\omega t$ and $e^{\sigma t}\sin\omega t$.
:::

## Case 1: two distinct real roots

If $b^2 > 4ac$, the roots $s_1$ and $s_2$ are real and different, and

$$
y(t) = C_1e^{s_1t} + C_2e^{s_2t}.
$$

The Wronskian of these two is $W = (s_2 - s_1)e^{(s_1 + s_2)t}$. That is never zero, because the roots differ, so the two exponentials are independent.

The motion is a sum of two plain exponentials, with no swinging at all. If both roots are negative, each term decays. After a while the term whose root is closer to zero — the **[[slow root|slow-root]]** — is all that is left, because the faster one has already died away. If either root is positive, the solution eventually grows without limit.

::: example Two real roots with initial conditions
Solve $\ddot{y} + 5\dot{y} + 6y = 0$ with $y(0) = 1$ and $\dot{y}(0) = 0$.

**Roots.** The characteristic equation $s^2 + 5s + 6 = (s + 2)(s + 3) = 0$ has roots $s_1 = -2$ and $s_2 = -3$. So

$$
y = C_1e^{-2t} + C_2e^{-3t}, \qquad \dot{y} = -2C_1e^{-2t} - 3C_2e^{-3t}.
$$

**Match the start.** Put $t = 0$ into both, using $e^0 = 1$:

$$
\begin{aligned}
C_1 + C_2 &= 1,\\
-2C_1 - 3C_2 &= 0.
\end{aligned}
$$

From the second line, $C_2 = -\tfrac{2}{3}C_1$. Substituting into the first, $C_1(1 - \tfrac{2}{3}) = 1$, so $C_1 = 3$ and $C_2 = -2$:

$$
y(t) = 3e^{-2t} - 2e^{-3t}.
$$

**Check.** $y(0) = 3 - 2 = 1$ and $\dot{y}(0) = -6 + 6 = 0$. Both starting facts hold.

The response starts at 1 with zero slope and decays without ever crossing zero. (The two terms have opposite signs, but $3e^{-2t}$ is bigger than $2e^{-3t}$ for every $t \ge 0$.) For large $t$ it behaves like $3e^{-2t}$: the slow root at $-2\,\mathrm{s^{-1}}$, with time constant $0.5\,\mathrm{s}$, sets the tail.
:::

## Case 2: one repeated real root

If $b^2 = 4ac$, the two roots land on the same value, $s_1 = -b/(2a)$. Now the guess produces only one solution, $e^{s_1t}$. You need a second, independent one.

Look for it in the form $y = v(t)e^{s_1t}$, where $v$ is an unknown function. This trick is called **reduction of order**. Differentiate twice:

$$
\dot{y} = (\dot{v} + s_1v)e^{s_1t}, \qquad \ddot{y} = (\ddot{v} + 2s_1\dot{v} + s_1^2v)e^{s_1t}.
$$

Put these into $a\ddot{y} + b\dot{y} + cy = 0$, and divide everything by $e^{s_1t}$:

$$
a\ddot{v} + (2as_1 + b)\dot{v} + (as_1^2 + bs_1 + c)v = 0.
$$

Now look at the brackets one at a time.

- The last bracket is the characteristic polynomial evaluated at its own root $s_1$, so it is zero.
- The middle bracket is $2as_1 + b = -b + b = 0$, because $s_1 = -b/(2a)$.

What remains is $a\ddot{v} = 0$. A function with zero second derivative is a straight line, so $v = C_1 + C_2t$, and the general solution is

$$
y(t) = (C_1 + C_2t)\,e^{s_1t}.
$$

The **[[extra factor of t|why-t-factor]]** is the signature of a repeated root. It means the response is not a pure exponential. The piece $te^{s_1t}$ first rises from zero, peaks at $t = -1/s_1$, then decays. When $s_1 < 0$ it still goes to zero in the end, because a decaying exponential always beats a growing polynomial.

::: example A deployment hinge at critical damping
A spring-loaded hinge that swings open a **[[solar array|solar-array]]** is modelled as $2\ddot{x} + 20\dot{x} + 50x = 0$. Here $x$ is the angle in radians, $2\,\mathrm{kg\,m^2}$ is the inertia, $20\,\mathrm{N\,m\,s}$ is the damper and $50\,\mathrm{N\,m}$ is the spring stiffness.

**Roots.** Divide by 2: $\ddot{x} + 10\dot{x} + 25x = 0$. Then $s^2 + 10s + 25 = (s + 5)^2$, so the root $s_1 = -5\,\mathrm{s^{-1}}$ is repeated, and

$$
x = (C_1 + C_2t)e^{-5t}.
$$

**Match the start.** The hinge is released from its resting angle with an initial rate of $1\,\mathrm{rad/s}$: $x(0) = 0$, $\dot{x}(0) = 1$. The first gives $C_1 = 0$. Differentiating, $\dot{x} = (C_2 - 5C_2t)e^{-5t}$, so $\dot{x}(0) = C_2 = 1$. Therefore

$$
x(t) = te^{-5t}.
$$

**The peak.** The swing is largest when $\dot{x} = 0$, which is at $t = 0.2\,\mathrm{s}$. There $x = 0.2e^{-1} = 0.0736\,\mathrm{rad}$, about four degrees. Then the hinge returns to rest without a single oscillation.

**Why no swing?** The discriminant of $2s^2 + 20s + 50$ is $20^2 - 4 \times 2 \times 50 = 0$ — exactly zero. The damper, $20\,\mathrm{N\,m\,s}$, equals $2\sqrt{ac} = 2\sqrt{2 \times 50}$: strong enough to kill the oscillation and no stronger. This is the **critically damped** case of lesson 3. With any less damping, the hinge would ring.
:::

::: warning One solution wearing two names
The most common error with a repeated root is writing $y = C_1e^{s_1t} + C_2e^{s_1t}$. That is one solution wearing two names — really $(C_1 + C_2)e^{s_1t}$ — and it cannot satisfy two independent initial conditions. The second solution is $te^{s_1t}$. Check the discriminant before you write the answer.
:::

## Case 3: a complex conjugate pair

If $b^2 < 4ac$, the number under the square root is negative, and the roots are

$$
s_{1,2} = \sigma \pm j\omega, \qquad \sigma = -\frac{b}{2a}, \qquad \omega = \frac{\sqrt{4ac - b^2}}{2a}.
$$

Here $j = \sqrt{-1}$. (Engineers write $j$ rather than $i$, for a **[[historical reason|why-j]]**.) Read $\sigma$ as "sigma" — the real part — and $\omega$ as "omega" — the imaginary part. Because the coefficients $a$, $b$, $c$ are real, complex roots always come as a **conjugate pair**: the same number with $+j$ and with $-j$.

The two solutions $e^{(\sigma + j\omega)t}$ and $e^{(\sigma - j\omega)t}$ are complex numbers, but a real spacecraft's angle is a real number. **Euler's formula**, $e^{j\omega t} = \cos\omega t + j\sin\omega t$, turns them into real functions:

$$
e^{(\sigma \pm j\omega)t} = e^{\sigma t}\bigl(\cos\omega t \pm j\sin\omega t\bigr).
$$

Half the sum of the two is $e^{\sigma t}\cos\omega t$. Half the difference, divided by $j$, is $e^{\sigma t}\sin\omega t$. Both are real. Both solve the equation, since they are combinations of solutions. And they are independent. So the real general solution is

$$
y(t) = e^{\sigma t}\bigl(C_1\cos\omega t + C_2\sin\omega t\bigr) = R\,e^{\sigma t}\cos(\omega t - \varphi),
$$

with $R = \sqrt{C_1^2 + C_2^2}$ and $\tan\varphi = C_2/C_1$ (the same "combine a cosine and a sine into one shifted cosine" trick from trigonometry).

The second form is the one to picture: a cosine swinging at angular frequency $\omega$, squeezed inside an **[[envelope|envelope]]** $Re^{\sigma t}$. The real part of the root sets the envelope. The imaginary part sets the swing rate.

- If $\sigma < 0$, the swinging dies away, with time constant $1/|\sigma|$.
- If $\sigma > 0$, it grows.
- If $\sigma = 0$, it goes on forever at the same size.

The period of the swing is $2\pi/\omega$.

::: example A decaying oscillation from a complex pair
Solve $\ddot{y} + 2\dot{y} + 5y = 0$ with $y(0) = 1$ and $\dot{y}(0) = 0$.

**Roots.** For $s^2 + 2s + 5 = 0$, the discriminant is $b^2 - 4ac = 4 - 20 = -16$. So $s = -1 \pm 2j$: $\sigma = -1\,\mathrm{s^{-1}}$ and $\omega = 2\,\mathrm{rad/s}$. The solution has the form $y = e^{-t}(C_1\cos 2t + C_2\sin 2t)$, and by the product rule

$$
\dot{y} = e^{-t}\bigl[(-C_1 + 2C_2)\cos 2t + (-C_2 - 2C_1)\sin 2t\bigr].
$$

**Match the start.** At $t = 0$, cosine is 1 and sine is 0. So $y(0) = C_1 = 1$, and $\dot{y}(0) = -C_1 + 2C_2 = 0$ gives $C_2 = \tfrac{1}{2}$. Therefore

$$
y(t) = e^{-t}\bigl(\cos 2t + \tfrac{1}{2}\sin 2t\bigr) = 1.118\,e^{-t}\cos(2t - 26.6^\circ),
$$

using $R = \sqrt{1 + 0.25} = 1.118$ and $\varphi = \arctan(0.5) = 26.6^\circ$.

**Reading it.** The response swings with period $2\pi/2 = 3.14\,\mathrm{s}$, inside an envelope that shrinks by a factor of $e$ every second. After three seconds the envelope is down to $1.118e^{-3} \approx 0.056$. The ringing is essentially gone after about four time constants of the real part — exactly like a first-order decay.
:::

## Reading the roots

Put the three cases side by side and a pattern appears that runs through the whole module. Each root $s$ contributes one **mode**, $e^{st}$, to the motion.

- The **real part** of the root decides growth or decay, and how fast. That mode's time constant is $1/|\operatorname{Re}s|$ (read "Re" as "the real part of").
- The **imaginary part** decides whether the mode swings, and how fast. Its period is $2\pi/\operatorname{Im}s$ ("Im" is "the imaginary part of").

A root on the negative real axis is a plain decay. A complex pair in the left half of the plane is a decaying swing. A pair sitting on the imaginary axis is a swing that never stops. Anything in the right half of the plane grows. That is why engineers draw roots as points on the **[[complex plane|pole-map]]** and call them poles: the picture *is* the behaviour.

::: note When there is no spring
If $c = 0$, the characteristic equation $as^2 + bs = 0$ has a root at $s = 0$. Its mode is $e^{0t} = 1$, a constant. Physically, the system has no spring: push it and it stays pushed. A rigid body with rate damping but no attitude feedback behaves like this. With neither ($b = c = 0$), there is a double root at zero and the modes are $1$ and $t$: the body drifts at a constant rate. That **double integrator** is the starting point of every attitude control design.
:::

## A PD attitude controller as a second-order equation

Now put the method to work on a real design. A spacecraft turns about one axis, with moment of inertia $I$. A **[[proportional-derivative (PD) controller|pd-controller]]** commands a torque that pushes back against both the angle error and the turn rate: $T = -K_p\theta - K_d\dot{\theta}$ (the target angle is $\theta = 0$). Newton's law for rotation, $I\ddot{\theta} = T$, gives

$$
I\ddot{\theta} + K_d\dot{\theta} + K_p\theta = 0 \quad\Longrightarrow\quad I s^2 + K_d s + K_p = 0.
$$

Compare with the mass on a spring. The proportional gain acts as a spring, pulling the angle back. The derivative gain acts as a damper, resisting motion. The controller has turned a drifting body into a damped oscillator, and the roots tell you which kind. **Critical damping** — the boundary between ringing and not ringing — happens when the discriminant is zero: $K_d^2 = 4K_pI$, so $K_d = 2\sqrt{K_pI}$.

::: example Attitude gains and the resulting motion
A small satellite has $I = 50\,\mathrm{kg\,m^2}$ about its pitch axis. Its gains are $K_p = 20\,\mathrm{N\,m/rad}$ and $K_d = 40\,\mathrm{N\,m\,s/rad}$.

**Roots.** The characteristic equation is $50s^2 + 40s + 20 = 0$. Dividing by 50, $s^2 + 0.8s + 0.4 = 0$. Its discriminant is $0.64 - 1.6$, negative, so the roots are complex:

$$
s = -0.4 \pm j\sqrt{0.4 - 0.16} = -0.4 \pm 0.490j\ \mathrm{s^{-1}}.
$$

**Match the start.** The satellite starts at rest with a $0.1\,\mathrm{rad}$ error. So $\theta = e^{-0.4t}(C_1\cos 0.490t + C_2\sin 0.490t)$ with $C_1 = 0.1$. From $\dot{\theta}(0) = -0.4C_1 + 0.490C_2 = 0$, we get $C_2 = 0.0816$. So

$$
\theta(t) = e^{-0.4t}\bigl(0.1\cos 0.490t + 0.0816\sin 0.490t\bigr) = 0.129\,e^{-0.4t}\cos(0.490t - 39.2^\circ).
$$

**Reading it.** The swing has period $2\pi/0.490 = 12.8\,\mathrm{s}$, and the envelope's time constant is $1/0.4 = 2.5\,\mathrm{s}$. At $t = 5\,\mathrm{s}$ the angle is $\theta = -0.0034\,\mathrm{rad}$ — already on the far side of zero. The satellite overshot.

**The fix.** To remove the overshoot entirely, the designer raises the derivative gain to $K_d = 2\sqrt{20 \times 50} = 63.2\,\mathrm{N\,m\,s/rad}$. The two roots then meet at $-0.632\,\mathrm{s^{-1}}$.
:::

::: warning Get every term on one side first
Put the ODE in the form $a\ddot{y} + b\dot{y} + cy = 0$ before you read off $a$, $b$ and $c$. For $\ddot{y} = -3\dot{y} + 4y$, move everything left: $\ddot{y} + 3\dot{y} - 4y = 0$. The characteristic equation is $s^2 + 3s - 4 = 0$, with roots $1$ and $-4$. One root is positive, so the motion grows. Reading the signs straight off the original line would give $s^2 - 3s + 4 = 0$, which is wrong.
:::

## Higher order and what comes next

Nothing in the method needed the order to be two. An $n$-th order homogeneous equation with constant coefficients,

$$
a_n y^{(n)} + \cdots + a_1\dot{y} + a_0y = 0,
$$

gives, with the same guess, the polynomial $a_ns^n + \cdots + a_1s + a_0 = 0$. (Here $y^{(n)}$ means the $n$-th derivative.) Its $n$ roots, counting repeats, give $n$ modes. Complex roots pair up as before, and repeated roots bring in powers of $t$. The free motion is a sum of modes, one per root, and $n$ initial conditions fix the $n$ constants. A satellite whose actuator has a first-order lag, for example, is third order: its characteristic cubic has one real root and one complex pair.

What the guess does *not* give is the response to a push $f(t)$: a commanded new attitude, a disturbance torque, a gust. That needs a particular solution, and lesson 5 builds it. First, lesson 3 takes the complex-root case, renames its two numbers as the natural frequency and the damping ratio, and turns this lesson's algebra into the everyday language of control engineering.

## Check yourself

::: check
Find the general solution of $\ddot{y} - \dot{y} - 6y = 0$ and describe what happens to almost every solution as $t \to \infty$.
:::

::: answer
The characteristic equation $s^2 - s - 6 = (s - 3)(s + 2) = 0$ has roots $3$ and $-2$, so

$$
y = C_1e^{3t} + C_2e^{-2t}.
$$

Unless the initial conditions happen to make $C_1$ exactly zero, the $e^{3t}$ term takes over and the solution grows without limit. One positive real root is enough to make the system unstable.
:::

::: check
Solve $\ddot{y} + 6\dot{y} + 9y = 0$ with $y(0) = 2$ and $\dot{y}(0) = -1$.
:::

::: answer
$s^2 + 6s + 9 = (s + 3)^2$: a repeated root at $-3$, so $y = (C_1 + C_2t)e^{-3t}$.

From $y(0) = 2$, $C_1 = 2$. Differentiating, $\dot{y} = (C_2 - 3C_1 - 3C_2t)e^{-3t}$, so $\dot{y}(0) = C_2 - 6 = -1$ and $C_2 = 5$. The solution is

$$
y = (2 + 5t)e^{-3t}.
$$

Its derivative is $\dot{y}(t) = (-1 - 15t)e^{-3t}$, which is negative for every $t \ge 0$. Unlike the hinge example, this one never rises at all. It slides down to zero without oscillating, as a repeated negative root always does.
:::

::: check
A structure obeys $\ddot{y} + 9y = 0$ with $y(0) = 0$ and $\dot{y}(0) = 6$. Write the solution and give the period of the motion.
:::

::: answer
$s^2 + 9 = 0$ gives $s = \pm 3j$: $\sigma = 0$ and $\omega = 3\,\mathrm{rad/s}$. So $y = C_1\cos 3t + C_2\sin 3t$.

From $y(0) = 0$, $C_1 = 0$. From $\dot{y}(0) = 3C_2 = 6$, $C_2 = 2$. So $y = 2\sin 3t$: an undamped oscillation of amplitude 2 and period $2\pi/3 = 2.09\,\mathrm{s}$. With no real part to the roots, nothing ever decays.
:::

::: check
A proof mass of $m = 2\,\mathrm{kg}$ sits on a spring of stiffness $k = 50\,\mathrm{N/m}$. What damping coefficient $c$ makes the free motion critically damped, and what is the repeated root?
:::

::: answer
The characteristic equation of $m\ddot{x} + c\dot{x} + kx = 0$ is $ms^2 + cs + k = 0$. It has a repeated root when the discriminant is zero, $c^2 = 4km$:

$$
c = 2\sqrt{km} = 2\sqrt{50 \times 2} = 20\,\mathrm{N\,s/m}.
$$

The root is $s = -c/(2m) = -20/4 = -5\,\mathrm{s^{-1}}$, so the free motion is $(C_1 + C_2t)e^{-5t}$.
:::

::: check
Why does a second-order equation need exactly two initial conditions, and what goes wrong if the two homogeneous solutions you found are not linearly independent?
:::

::: answer
The general solution $y_p + C_1y_1 + C_2y_2$ has two free constants. They match the two facts — $y(0)$ and $\dot{y}(0)$ — that Newton's law needs to start a motion.

Matching them means solving two linear equations for $C_1$ and $C_2$. The determinant of those equations is the Wronskian $W = y_1\dot{y}_2 - \dot{y}_1y_2$ at $t = 0$. If $y_1$ and $y_2$ are dependent, $W = 0$ and the equations are singular: for most initial conditions there is no solution at all, because you really have only one function. This is exactly the trap with a repeated root, and the second solution $te^{s_1t}$ is the cure.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $a\ddot{y} + b\dot{y} + cy = f(t)$ | Second-order linear constant-coefficient ODE; homogeneous when $f = 0$ |
| $y = e^{st}$ | The exponential guess (ansatz) |
| $as^2 + bs + c = 0$ | Characteristic equation; roots $s_{1,2} = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ in $\mathrm{s^{-1}}$ |
| $b^2 > 4ac$ | Two real roots: $y = C_1e^{s_1t} + C_2e^{s_2t}$ |
| $b^2 = 4ac$ | Repeated root $s_1 = -b/2a$: $y = (C_1 + C_2t)e^{s_1t}$ |
| $b^2 < 4ac$ | Complex pair $\sigma \pm j\omega$: $y = e^{\sigma t}(C_1\cos\omega t + C_2\sin\omega t) = Re^{\sigma t}\cos(\omega t - \varphi)$ |
| $\operatorname{Re}s$, $\operatorname{Im}s$ | Decay rate (time constant $1/\lvert\operatorname{Re}s\rvert$) and swing frequency (period $2\pi/\operatorname{Im}s$) |
| $W = y_1\dot{y}_2 - \dot{y}_1y_2$ | Wronskian; nonzero means the solutions are independent |
| $Is^2 + K_ds + K_p = 0$ | PD attitude loop; critical damping at $K_d = 2\sqrt{K_pI}$ |

Next lesson rewrites the characteristic equation as $s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$, in terms of a natural frequency and a damping ratio, and shows how those two numbers — read straight off the pole pair — predict overshoot and settling time.

::: context newton-second-order Why force gives a second derivative
Position is where you are. Velocity is how fast position changes — its first derivative. Acceleration is how fast velocity changes — the derivative of a derivative. Newton's law, $F = ma$, sets the acceleration. So to get from a force to a position, you have to undo two derivatives, and that needs two starting facts: where the object began and how fast it was already moving.
:::

::: context mass-spring-damper The three parts of a bouncing system
A spring pulls back harder the farther you stretch it (force $kx$). A damper — like a car's shock absorber, a piston pushing oil through a small hole — resists harder the faster you move it (force $c\dot{x}$). The mass resists changes in speed. Almost any structure that wobbles, from a car to a rocket's fuel sloshing in its tank, is modelled as some mix of these three pieces.
:::

::: context wronskian A test named after a mathematician
The Wronskian is named after the Polish mathematician Józef Hoene-Wroński, who studied these determinants in the early 1800s. For two functions it is the determinant of the little matrix with the functions in the top row and their derivatives in the bottom row. If it is zero everywhere, the two are really the same function scaled — no new information.
:::

::: context ansatz A German word for a starting guess
*Ansatz* (plural *Ansätze*) is German for "approach" or "starting point". In mathematics it means: guess the *form* of the answer, leave some numbers free, and let the equation tell you what they must be. It is not cheating. If the guess works, uniqueness guarantees you have found *the* answer. The exponential guess works here because differentiating $e^{st}$ only multiplies it by $s$.
:::

::: context slow-root The slow root wins
In the first example, $y = 3e^{-2t} - 2e^{-3t}$ is the sum of two decays. The $e^{-3t}$ piece (orange) dies faster, so after about a second the curve is almost exactly the slower $3e^{-2t}$ piece (light blue). That is why engineers watch the root closest to zero: it sets how long you wait.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="115.7" x2="340" y2="115.7" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="185" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
<path d="M40.0,21.3 L42.0,25.0 L44.0,28.6 L46.0,32.0 L48.0,35.3 L50.0,38.4 L52.0,41.4 L54.0,44.4 L56.0,47.2 L58.0,49.8 L60.0,52.4 L62.0,54.9 L64.0,57.3 L66.0,59.6 L68.0,61.8 L70.0,63.9 L72.0,65.9 L74.0,67.9 L76.0,69.8 L78.0,71.6 L80.0,73.3 L82.0,75.0 L84.0,76.6 L86.0,78.1 L88.0,79.6 L90.0,81.0 L92.0,82.4 L94.0,83.7 L96.0,84.9 L98.0,86.1 L100.0,87.3 L102.0,88.4 L104.0,89.5 L106.0,90.5 L108.0,91.5 L110.0,92.5 L112.0,93.4 L114.0,94.2 L116.0,95.1 L118.0,95.9 L120.0,96.7 L122.0,97.4 L124.0,98.1 L126.0,98.8 L128.0,99.5 L130.0,100.1 L132.0,100.7 L134.0,101.3 L136.0,101.9 L138.0,102.4 L140.0,103.0 L142.0,103.5 L144.0,103.9 L146.0,104.4 L148.0,104.8 L150.0,105.3 L152.0,105.7 L154.0,106.1 L156.0,106.5 L158.0,106.8 L160.0,107.2 L162.0,107.5 L164.0,107.8 L166.0,108.1 L168.0,108.4 L170.0,108.7 L172.0,109.0 L174.0,109.3 L176.0,109.5 L178.0,109.8 L180.0,110.0 L182.0,110.2 L184.0,110.4 L186.0,110.6 L188.0,110.8 L190.0,111.0 L192.0,111.2 L194.0,111.4 L196.0,111.6 L198.0,111.7 L200.0,111.9 L202.0,112.0 L204.0,112.2 L206.0,112.3 L208.0,112.5 L210.0,112.6 L212.0,112.7 L214.0,112.8 L216.0,112.9 L218.0,113.1 L220.0,113.2 L222.0,113.3 L224.0,113.4 L226.0,113.5 L228.0,113.5 L230.0,113.6 L232.0,113.7 L234.0,113.8 L236.0,113.9 L238.0,113.9 L240.0,114.0 L242.0,114.1 L244.0,114.1 L246.0,114.2 L248.0,114.3 L250.0,114.3 L252.0,114.4 L254.0,114.4 L256.0,114.5 L258.0,114.5 L260.0,114.6 L262.0,114.6 L264.0,114.7 L266.0,114.7 L268.0,114.8 L270.0,114.8 L272.0,114.8 L274.0,114.9 L276.0,114.9 L278.0,114.9 L280.0,115.0 L282.0,115.0 L284.0,115.0 L286.0,115.1 L288.0,115.1 L290.0,115.1 L292.0,115.1 L294.0,115.2 L296.0,115.2 L298.0,115.2 L300.0,115.2 L302.0,115.2 L304.0,115.3 L306.0,115.3 L308.0,115.3 L310.0,115.3 L312.0,115.3 L314.0,115.3 L316.0,115.4 L318.0,115.4 L320.0,115.4 L322.0,115.4 L324.0,115.4 L326.0,115.4 L328.0,115.4 L330.0,115.5 L332.0,115.5 L334.0,115.5 L336.0,115.5 L338.0,115.5 L340.0,115.5" fill="none" stroke="#8fb8f0" stroke-width="2"/>
<path d="M40.0,178.7 L42.0,175.0 L44.0,171.6 L46.0,168.3 L48.0,165.3 L50.0,162.4 L52.0,159.7 L54.0,157.1 L56.0,154.7 L58.0,152.4 L60.0,150.3 L62.0,148.3 L64.0,146.4 L66.0,144.6 L68.0,142.9 L70.0,141.3 L72.0,139.8 L74.0,138.4 L76.0,137.1 L78.0,135.9 L80.0,134.7 L82.0,133.6 L84.0,132.6 L86.0,131.6 L88.0,130.7 L90.0,129.8 L92.0,129.0 L94.0,128.2 L96.0,127.5 L98.0,126.8 L100.0,126.1 L102.0,125.5 L104.0,125.0 L106.0,124.4 L108.0,123.9 L110.0,123.5 L112.0,123.0 L114.0,122.6 L116.0,122.2 L118.0,121.8 L120.0,121.5 L122.0,121.1 L124.0,120.8 L126.0,120.5 L128.0,120.2 L130.0,120.0 L132.0,119.7 L134.0,119.5 L136.0,119.3 L138.0,119.1 L140.0,118.9 L142.0,118.7 L144.0,118.5 L146.0,118.4 L148.0,118.2 L150.0,118.1 L152.0,117.9 L154.0,117.8 L156.0,117.7 L158.0,117.6 L160.0,117.5 L162.0,117.4 L164.0,117.3 L166.0,117.2 L168.0,117.1 L170.0,117.0 L172.0,116.9 L174.0,116.9 L176.0,116.8 L178.0,116.7 L180.0,116.7 L182.0,116.6 L184.0,116.6 L186.0,116.5 L188.0,116.5 L190.0,116.4 L192.0,116.4 L194.0,116.4 L196.0,116.3 L198.0,116.3 L200.0,116.3 L202.0,116.2 L204.0,116.2 L206.0,116.2 L208.0,116.1 L210.0,116.1 L212.0,116.1 L214.0,116.1 L216.0,116.1 L218.0,116.0 L220.0,116.0 L222.0,116.0 L224.0,116.0 L226.0,116.0 L228.0,116.0 L230.0,116.0 L232.0,115.9 L234.0,115.9 L236.0,115.9 L238.0,115.9 L240.0,115.9 L242.0,115.9 L244.0,115.9 L246.0,115.9 L248.0,115.9 L250.0,115.9 L252.0,115.8 L254.0,115.8 L256.0,115.8 L258.0,115.8 L260.0,115.8 L262.0,115.8 L264.0,115.8 L266.0,115.8 L268.0,115.8 L270.0,115.8 L272.0,115.8 L274.0,115.8 L276.0,115.8 L278.0,115.8 L280.0,115.8 L282.0,115.8 L284.0,115.8 L286.0,115.8 L288.0,115.8 L290.0,115.8 L292.0,115.8 L294.0,115.8 L296.0,115.8 L298.0,115.8 L300.0,115.8 L302.0,115.8 L304.0,115.8 L306.0,115.8 L308.0,115.8 L310.0,115.8 L312.0,115.8 L314.0,115.8 L316.0,115.8 L318.0,115.8 L320.0,115.8 L322.0,115.8 L324.0,115.8 L326.0,115.8 L328.0,115.8 L330.0,115.8 L332.0,115.8 L334.0,115.8 L336.0,115.7 L338.0,115.7 L340.0,115.7" fill="none" stroke="#f2b880" stroke-width="2"/>
<path d="M40.0,84.3 L42.0,84.3 L44.0,84.4 L46.0,84.6 L48.0,84.8 L50.0,85.1 L52.0,85.4 L54.0,85.7 L56.0,86.1 L58.0,86.5 L60.0,87.0 L62.0,87.5 L64.0,87.9 L66.0,88.5 L68.0,89.0 L70.0,89.5 L72.0,90.0 L74.0,90.6 L76.0,91.2 L78.0,91.7 L80.0,92.3 L82.0,92.8 L84.0,93.4 L86.0,93.9 L88.0,94.5 L90.0,95.0 L92.0,95.6 L94.0,96.1 L96.0,96.7 L98.0,97.2 L100.0,97.7 L102.0,98.2 L104.0,98.7 L106.0,99.2 L108.0,99.7 L110.0,100.2 L112.0,100.6 L114.0,101.1 L116.0,101.5 L118.0,102.0 L120.0,102.4 L122.0,102.8 L124.0,103.2 L126.0,103.6 L128.0,104.0 L130.0,104.4 L132.0,104.7 L134.0,105.1 L136.0,105.4 L138.0,105.8 L140.0,106.1 L142.0,106.4 L144.0,106.7 L146.0,107.0 L148.0,107.3 L150.0,107.6 L152.0,107.9 L154.0,108.1 L156.0,108.4 L158.0,108.7 L160.0,108.9 L162.0,109.1 L164.0,109.4 L166.0,109.6 L168.0,109.8 L170.0,110.0 L172.0,110.2 L174.0,110.4 L176.0,110.6 L178.0,110.8 L180.0,110.9 L182.0,111.1 L184.0,111.3 L186.0,111.4 L188.0,111.6 L190.0,111.7 L192.0,111.9 L194.0,112.0 L196.0,112.2 L198.0,112.3 L200.0,112.4 L202.0,112.5 L204.0,112.6 L206.0,112.8 L208.0,112.9 L210.0,113.0 L212.0,113.1 L214.0,113.2 L216.0,113.3 L218.0,113.4 L220.0,113.4 L222.0,113.5 L224.0,113.6 L226.0,113.7 L228.0,113.8 L230.0,113.8 L232.0,113.9 L234.0,114.0 L236.0,114.0 L238.0,114.1 L240.0,114.2 L242.0,114.2 L244.0,114.3 L246.0,114.3 L248.0,114.4 L250.0,114.4 L252.0,114.5 L254.0,114.5 L256.0,114.6 L258.0,114.6 L260.0,114.7 L262.0,114.7 L264.0,114.7 L266.0,114.8 L268.0,114.8 L270.0,114.9 L272.0,114.9 L274.0,114.9 L276.0,115.0 L278.0,115.0 L280.0,115.0 L282.0,115.0 L284.0,115.1 L286.0,115.1 L288.0,115.1 L290.0,115.1 L292.0,115.2 L294.0,115.2 L296.0,115.2 L298.0,115.2 L300.0,115.2 L302.0,115.3 L304.0,115.3 L306.0,115.3 L308.0,115.3 L310.0,115.3 L312.0,115.3 L314.0,115.4 L316.0,115.4 L318.0,115.4 L320.0,115.4 L322.0,115.4 L324.0,115.4 L326.0,115.4 L328.0,115.5 L330.0,115.5 L332.0,115.5 L334.0,115.5 L336.0,115.5 L338.0,115.5 L340.0,115.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<text x="34" y="25.3" font-size="11" text-anchor="end" fill="#1f2a44">3</text>
<text x="34" y="88.3" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
<text x="34" y="182.7" font-size="11" text-anchor="end" fill="#1f2a44">−2</text>
<text x="34" y="119.7" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<text x="65.0" y="33.9" font-size="11" fill="#1d6fd1">3e^(−2t)</text>
<text x="85.0" y="156.7" font-size="11" fill="#1f2a44">−2e^(−3t)</text>
<text x="140.0" y="92.1" font-size="11" fill="#1d6fd1">sum y(t): starts at 1, flat</text>
<text x="140.0" y="129.7" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
<text x="240.0" y="129.7" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
<text x="340.0" y="129.7" font-size="11" text-anchor="middle" fill="#1f2a44">3</text>
<text x="340" y="109.7" font-size="11" text-anchor="end" fill="#1f2a44">t (s)</text>
</svg>
```
:::

::: context why-t-factor Where the extra t comes from
Imagine two roots that are close but not equal, $s_1$ and $s_1 + h$. The combination $\bigl(e^{(s_1 + h)t} - e^{s_1t}\bigr)/h$ is a legal solution. As $h$ shrinks to zero it becomes the derivative of $e^{st}$ with respect to $s$, which is $te^{s_1t}$. So the extra $t$ is what is left of the second root when the two merge.
:::

::: context solar-array Unfolding in orbit
Solar arrays launch folded flat against the spacecraft, then swing open once in orbit, often driven by springs at the hinges. If a hinge snaps open too hard, the shock can damage the panel or shake the spacecraft. Dampers slow the final swing so the panel settles gently into its latched position — which is why critical damping, the fastest return with no bounce, is the design target here.
:::

::: context why-j Why engineers write j
Mathematicians write $i$ for $\sqrt{-1}$. Electrical engineers already used $i$ for electric current, so they switched to $j$, and control engineering — which grew out of electrical engineering — kept it. The number is the same: $j^2 = -1$. You will see both in books; they mean the same thing.
:::

::: context envelope The envelope and the swing
The blue curve is $e^{-t}(\cos 2t + \tfrac{1}{2}\sin 2t)$ from the example. The dashed red curves are the envelope $\pm 1.118e^{-t}$: the swing always stays between them and touches them once per half-cycle. The real part of the root, $-1$, sets how fast the envelope closes; the imaginary part, $2$, sets how often the curve crosses zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="100.0" x2="340" y2="100.0" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="188" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
<path d="M40.0,18.0 L41.2,19.6 L42.4,21.2 L43.6,22.8 L44.8,24.3 L46.0,25.8 L47.2,27.3 L48.4,28.7 L49.6,30.1 L50.8,31.5 L52.0,32.9 L53.2,34.2 L54.4,35.5 L55.6,36.8 L56.8,38.0 L58.0,39.3 L59.2,40.5 L60.4,41.6 L61.6,42.8 L62.8,43.9 L64.0,45.0 L65.2,46.1 L66.4,47.2 L67.6,48.2 L68.8,49.3 L70.0,50.3 L71.2,51.3 L72.4,52.2 L73.6,53.2 L74.8,54.1 L76.0,55.0 L77.2,55.9 L78.4,56.8 L79.6,57.6 L80.8,58.5 L82.0,59.3 L83.2,60.1 L84.4,60.9 L85.6,61.7 L86.8,62.4 L88.0,63.2 L89.2,63.9 L90.4,64.6 L91.6,65.3 L92.8,66.0 L94.0,66.7 L95.2,67.3 L96.4,68.0 L97.6,68.6 L98.8,69.2 L100.0,69.8 L101.2,70.4 L102.4,71.0 L103.6,71.6 L104.8,72.2 L106.0,72.7 L107.2,73.2 L108.4,73.8 L109.6,74.3 L110.8,74.8 L112.0,75.3 L113.2,75.8 L114.4,76.3 L115.6,76.7 L116.8,77.2 L118.0,77.7 L119.2,78.1 L120.4,78.5 L121.6,79.0 L122.8,79.4 L124.0,79.8 L125.2,80.2 L126.4,80.6 L127.6,81.0 L128.8,81.3 L130.0,81.7 L131.2,82.1 L132.4,82.4 L133.6,82.8 L134.8,83.1 L136.0,83.4 L137.2,83.8 L138.4,84.1 L139.6,84.4 L140.8,84.7 L142.0,85.0 L143.2,85.3 L144.4,85.6 L145.6,85.9 L146.8,86.2 L148.0,86.4 L149.2,86.7 L150.4,87.0 L151.6,87.2 L152.8,87.5 L154.0,87.7 L155.2,88.0 L156.4,88.2 L157.6,88.5 L158.8,88.7 L160.0,88.9 L161.2,89.1 L162.4,89.3 L163.6,89.6 L164.8,89.8 L166.0,90.0 L167.2,90.2 L168.4,90.4 L169.6,90.5 L170.8,90.7 L172.0,90.9 L173.2,91.1 L174.4,91.3 L175.6,91.4 L176.8,91.6 L178.0,91.8 L179.2,91.9 L180.4,92.1 L181.6,92.3 L182.8,92.4 L184.0,92.6 L185.2,92.7 L186.4,92.9 L187.6,93.0 L188.8,93.1 L190.0,93.3 L191.2,93.4 L192.4,93.5 L193.6,93.7 L194.8,93.8 L196.0,93.9 L197.2,94.0 L198.4,94.1 L199.6,94.3 L200.8,94.4 L202.0,94.5 L203.2,94.6 L204.4,94.7 L205.6,94.8 L206.8,94.9 L208.0,95.0 L209.2,95.1 L210.4,95.2 L211.6,95.3 L212.8,95.4 L214.0,95.5 L215.2,95.6 L216.4,95.7 L217.6,95.8 L218.8,95.8 L220.0,95.9 L221.2,96.0 L222.4,96.1 L223.6,96.2 L224.8,96.2 L226.0,96.3 L227.2,96.4 L228.4,96.5 L229.6,96.5 L230.8,96.6 L232.0,96.7 L233.2,96.7 L234.4,96.8 L235.6,96.9 L236.8,96.9 L238.0,97.0 L239.2,97.0 L240.4,97.1 L241.6,97.2 L242.8,97.2 L244.0,97.3 L245.2,97.3 L246.4,97.4 L247.6,97.4 L248.8,97.5 L250.0,97.5 L251.2,97.6 L252.4,97.6 L253.6,97.7 L254.8,97.7 L256.0,97.8 L257.2,97.8 L258.4,97.8 L259.6,97.9 L260.8,97.9 L262.0,98.0 L263.2,98.0 L264.4,98.1 L265.6,98.1 L266.8,98.1 L268.0,98.2 L269.2,98.2 L270.4,98.2 L271.6,98.3 L272.8,98.3 L274.0,98.3 L275.2,98.4 L276.4,98.4 L277.6,98.4 L278.8,98.5 L280.0,98.5 L281.2,98.5 L282.4,98.6 L283.6,98.6 L284.8,98.6 L286.0,98.6 L287.2,98.7 L288.4,98.7 L289.6,98.7 L290.8,98.7 L292.0,98.8 L293.2,98.8 L294.4,98.8 L295.6,98.8 L296.8,98.9 L298.0,98.9 L299.2,98.9 L300.4,98.9 L301.6,99.0 L302.8,99.0 L304.0,99.0 L305.2,99.0 L306.4,99.0 L307.6,99.1 L308.8,99.1 L310.0,99.1 L311.2,99.1 L312.4,99.1 L313.6,99.1 L314.8,99.2 L316.0,99.2 L317.2,99.2 L318.4,99.2 L319.6,99.2 L320.8,99.2 L322.0,99.3 L323.2,99.3 L324.4,99.3 L325.6,99.3 L326.8,99.3 L328.0,99.3 L329.2,99.3 L330.4,99.4 L331.6,99.4 L332.8,99.4 L334.0,99.4 L335.2,99.4 L336.4,99.4 L337.6,99.4 L338.8,99.4 L340.0,99.4" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
<path d="M40.0,182.0 L41.2,180.4 L42.4,178.8 L43.6,177.2 L44.8,175.7 L46.0,174.2 L47.2,172.7 L48.4,171.3 L49.6,169.9 L50.8,168.5 L52.0,167.1 L53.2,165.8 L54.4,164.5 L55.6,163.2 L56.8,162.0 L58.0,160.7 L59.2,159.5 L60.4,158.4 L61.6,157.2 L62.8,156.1 L64.0,155.0 L65.2,153.9 L66.4,152.8 L67.6,151.8 L68.8,150.7 L70.0,149.7 L71.2,148.7 L72.4,147.8 L73.6,146.8 L74.8,145.9 L76.0,145.0 L77.2,144.1 L78.4,143.2 L79.6,142.4 L80.8,141.5 L82.0,140.7 L83.2,139.9 L84.4,139.1 L85.6,138.3 L86.8,137.6 L88.0,136.8 L89.2,136.1 L90.4,135.4 L91.6,134.7 L92.8,134.0 L94.0,133.3 L95.2,132.7 L96.4,132.0 L97.6,131.4 L98.8,130.8 L100.0,130.2 L101.2,129.6 L102.4,129.0 L103.6,128.4 L104.8,127.8 L106.0,127.3 L107.2,126.8 L108.4,126.2 L109.6,125.7 L110.8,125.2 L112.0,124.7 L113.2,124.2 L114.4,123.7 L115.6,123.3 L116.8,122.8 L118.0,122.3 L119.2,121.9 L120.4,121.5 L121.6,121.0 L122.8,120.6 L124.0,120.2 L125.2,119.8 L126.4,119.4 L127.6,119.0 L128.8,118.7 L130.0,118.3 L131.2,117.9 L132.4,117.6 L133.6,117.2 L134.8,116.9 L136.0,116.6 L137.2,116.2 L138.4,115.9 L139.6,115.6 L140.8,115.3 L142.0,115.0 L143.2,114.7 L144.4,114.4 L145.6,114.1 L146.8,113.8 L148.0,113.6 L149.2,113.3 L150.4,113.0 L151.6,112.8 L152.8,112.5 L154.0,112.3 L155.2,112.0 L156.4,111.8 L157.6,111.5 L158.8,111.3 L160.0,111.1 L161.2,110.9 L162.4,110.7 L163.6,110.4 L164.8,110.2 L166.0,110.0 L167.2,109.8 L168.4,109.6 L169.6,109.5 L170.8,109.3 L172.0,109.1 L173.2,108.9 L174.4,108.7 L175.6,108.6 L176.8,108.4 L178.0,108.2 L179.2,108.1 L180.4,107.9 L181.6,107.7 L182.8,107.6 L184.0,107.4 L185.2,107.3 L186.4,107.1 L187.6,107.0 L188.8,106.9 L190.0,106.7 L191.2,106.6 L192.4,106.5 L193.6,106.3 L194.8,106.2 L196.0,106.1 L197.2,106.0 L198.4,105.9 L199.6,105.7 L200.8,105.6 L202.0,105.5 L203.2,105.4 L204.4,105.3 L205.6,105.2 L206.8,105.1 L208.0,105.0 L209.2,104.9 L210.4,104.8 L211.6,104.7 L212.8,104.6 L214.0,104.5 L215.2,104.4 L216.4,104.3 L217.6,104.2 L218.8,104.2 L220.0,104.1 L221.2,104.0 L222.4,103.9 L223.6,103.8 L224.8,103.8 L226.0,103.7 L227.2,103.6 L228.4,103.5 L229.6,103.5 L230.8,103.4 L232.0,103.3 L233.2,103.3 L234.4,103.2 L235.6,103.1 L236.8,103.1 L238.0,103.0 L239.2,103.0 L240.4,102.9 L241.6,102.8 L242.8,102.8 L244.0,102.7 L245.2,102.7 L246.4,102.6 L247.6,102.6 L248.8,102.5 L250.0,102.5 L251.2,102.4 L252.4,102.4 L253.6,102.3 L254.8,102.3 L256.0,102.2 L257.2,102.2 L258.4,102.2 L259.6,102.1 L260.8,102.1 L262.0,102.0 L263.2,102.0 L264.4,101.9 L265.6,101.9 L266.8,101.9 L268.0,101.8 L269.2,101.8 L270.4,101.8 L271.6,101.7 L272.8,101.7 L274.0,101.7 L275.2,101.6 L276.4,101.6 L277.6,101.6 L278.8,101.5 L280.0,101.5 L281.2,101.5 L282.4,101.4 L283.6,101.4 L284.8,101.4 L286.0,101.4 L287.2,101.3 L288.4,101.3 L289.6,101.3 L290.8,101.3 L292.0,101.2 L293.2,101.2 L294.4,101.2 L295.6,101.2 L296.8,101.1 L298.0,101.1 L299.2,101.1 L300.4,101.1 L301.6,101.0 L302.8,101.0 L304.0,101.0 L305.2,101.0 L306.4,101.0 L307.6,100.9 L308.8,100.9 L310.0,100.9 L311.2,100.9 L312.4,100.9 L313.6,100.9 L314.8,100.8 L316.0,100.8 L317.2,100.8 L318.4,100.8 L319.6,100.8 L320.8,100.8 L322.0,100.7 L323.2,100.7 L324.4,100.7 L325.6,100.7 L326.8,100.7 L328.0,100.7 L329.2,100.7 L330.4,100.6 L331.6,100.6 L332.8,100.6 L334.0,100.6 L335.2,100.6 L336.4,100.6 L337.6,100.6 L338.8,100.6 L340.0,100.6" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
<path d="M40.0,26.7 L41.2,26.7 L42.4,27.0 L43.6,27.3 L44.8,27.8 L46.0,28.4 L47.2,29.1 L48.4,29.9 L49.6,30.9 L50.8,31.9 L52.0,33.0 L53.2,34.2 L54.4,35.5 L55.6,36.9 L56.8,38.3 L58.0,39.8 L59.2,41.4 L60.4,43.0 L61.6,44.7 L62.8,46.4 L64.0,48.1 L65.2,49.9 L66.4,51.7 L67.6,53.5 L68.8,55.4 L70.0,57.3 L71.2,59.1 L72.4,61.0 L73.6,62.9 L74.8,64.8 L76.0,66.7 L77.2,68.5 L78.4,70.4 L79.6,72.2 L80.8,74.1 L82.0,75.9 L83.2,77.6 L84.4,79.4 L85.6,81.1 L86.8,82.8 L88.0,84.5 L89.2,86.1 L90.4,87.7 L91.6,89.3 L92.8,90.8 L94.0,92.3 L95.2,93.7 L96.4,95.1 L97.6,96.4 L98.8,97.7 L100.0,99.0 L101.2,100.2 L102.4,101.3 L103.6,102.4 L104.8,103.5 L106.0,104.5 L107.2,105.5 L108.4,106.4 L109.6,107.2 L110.8,108.1 L112.0,108.8 L113.2,109.5 L114.4,110.2 L115.6,110.9 L116.8,111.4 L118.0,112.0 L119.2,112.5 L120.4,112.9 L121.6,113.3 L122.8,113.7 L124.0,114.0 L125.2,114.3 L126.4,114.5 L127.6,114.7 L128.8,114.9 L130.0,115.0 L131.2,115.1 L132.4,115.2 L133.6,115.2 L134.8,115.2 L136.0,115.2 L137.2,115.2 L138.4,115.1 L139.6,115.0 L140.8,114.8 L142.0,114.7 L143.2,114.5 L144.4,114.3 L145.6,114.1 L146.8,113.8 L148.0,113.6 L149.2,113.3 L150.4,113.0 L151.6,112.7 L152.8,112.4 L154.0,112.0 L155.2,111.7 L156.4,111.3 L157.6,111.0 L158.8,110.6 L160.0,110.2 L161.2,109.9 L162.4,109.5 L163.6,109.1 L164.8,108.7 L166.0,108.3 L167.2,107.9 L168.4,107.5 L169.6,107.1 L170.8,106.8 L172.0,106.4 L173.2,106.0 L174.4,105.6 L175.6,105.2 L176.8,104.8 L178.0,104.5 L179.2,104.1 L180.4,103.8 L181.6,103.4 L182.8,103.1 L184.0,102.7 L185.2,102.4 L186.4,102.1 L187.6,101.8 L188.8,101.5 L190.0,101.2 L191.2,100.9 L192.4,100.6 L193.6,100.4 L194.8,100.1 L196.0,99.9 L197.2,99.6 L198.4,99.4 L199.6,99.2 L200.8,99.0 L202.0,98.8 L203.2,98.6 L204.4,98.4 L205.6,98.3 L206.8,98.1 L208.0,97.9 L209.2,97.8 L210.4,97.7 L211.6,97.6 L212.8,97.5 L214.0,97.4 L215.2,97.3 L216.4,97.2 L217.6,97.1 L218.8,97.1 L220.0,97.0 L221.2,97.0 L222.4,96.9 L223.6,96.9 L224.8,96.9 L226.0,96.8 L227.2,96.8 L228.4,96.8 L229.6,96.8 L230.8,96.8 L232.0,96.9 L233.2,96.9 L234.4,96.9 L235.6,96.9 L236.8,97.0 L238.0,97.0 L239.2,97.1 L240.4,97.1 L241.6,97.2 L242.8,97.2 L244.0,97.3 L245.2,97.3 L246.4,97.4 L247.6,97.5 L248.8,97.5 L250.0,97.6 L251.2,97.7 L252.4,97.8 L253.6,97.8 L254.8,97.9 L256.0,98.0 L257.2,98.1 L258.4,98.1 L259.6,98.2 L260.8,98.3 L262.0,98.4 L263.2,98.5 L264.4,98.6 L265.6,98.6 L266.8,98.7 L268.0,98.8 L269.2,98.9 L270.4,99.0 L271.6,99.0 L272.8,99.1 L274.0,99.2 L275.2,99.3 L276.4,99.3 L277.6,99.4 L278.8,99.5 L280.0,99.5 L281.2,99.6 L282.4,99.7 L283.6,99.7 L284.8,99.8 L286.0,99.8 L287.2,99.9 L288.4,100.0 L289.6,100.0 L290.8,100.1 L292.0,100.1 L293.2,100.1 L294.4,100.2 L295.6,100.2 L296.8,100.3 L298.0,100.3 L299.2,100.3 L300.4,100.4 L301.6,100.4 L302.8,100.4 L304.0,100.5 L305.2,100.5 L306.4,100.5 L307.6,100.5 L308.8,100.6 L310.0,100.6 L311.2,100.6 L312.4,100.6 L313.6,100.6 L314.8,100.6 L316.0,100.6 L317.2,100.6 L318.4,100.6 L319.6,100.7 L320.8,100.7 L322.0,100.7 L323.2,100.7 L324.4,100.7 L325.6,100.7 L326.8,100.7 L328.0,100.6 L329.2,100.6 L330.4,100.6 L331.6,100.6 L332.8,100.6 L334.0,100.6 L335.2,100.6 L336.4,100.6 L337.6,100.6 L338.8,100.6 L340.0,100.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<text x="34" y="30.7" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
<text x="34" y="177.3" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
<text x="34" y="104.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<text x="85.0" y="47.2" font-size="11" fill="#b4232c">envelope ±1.118e^(−t)</text>
<line x1="40.0" y1="169.7" x2="228.5" y2="169.7" stroke="#1f2a44" stroke-width="1"/>
<line x1="228.5" y1="164.5" x2="228.5" y2="174.8" stroke="#1f2a44" stroke-width="1"/>
<text x="134.2" y="183.7" font-size="11" text-anchor="middle" fill="#1f2a44">one period, 3.14 s</text>
<text x="340" y="114.0" font-size="11" text-anchor="end" fill="#1f2a44">t</text>
</svg>
```
:::

::: context pole-map A map of behaviours
Each root is a point: its real part left or right, its imaginary part up or down. Left of the vertical axis, motion dies away; right of it, motion grows. Roots on the horizontal axis give plain decays; roots off it, always in mirror-image pairs, give swings. The farther a pair is from the horizontal axis, the faster it swings.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<rect x="20" y="10" width="180" height="180" fill="#8fb8f0" opacity="0.25"/>
<rect x="200" y="10" width="140" height="180" fill="#f2b880" opacity="0.3"/>
<line x1="20" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="200" y1="10" x2="200" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
<text x="345" y="94" font-size="11" text-anchor="end" fill="#1f2a44">Re s</text>
<text x="205" y="22" font-size="11" fill="#1f2a44">Im s</text>
<g stroke="#1f2a44" stroke-width="2.5"><line x1="115" y1="95" x2="125" y2="105"/><line x1="115" y1="105" x2="125" y2="95"/></g>
<g stroke="#1f2a44" stroke-width="2.5"><line x1="65" y1="95" x2="75" y2="105"/><line x1="65" y1="105" x2="75" y2="95"/></g>
<text x="95" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">plain decay</text>
<g stroke="#1d6fd1" stroke-width="2.5"><line x1="135" y1="45" x2="145" y2="55"/><line x1="135" y1="55" x2="145" y2="45"/></g>
<g stroke="#1d6fd1" stroke-width="2.5"><line x1="135" y1="145" x2="145" y2="155"/><line x1="135" y1="155" x2="145" y2="145"/></g>
<text x="140" y="36" font-size="11" text-anchor="middle" fill="#1d6fd1">decaying swing</text>
<g stroke="#6c7a93" stroke-width="2.5"><line x1="195" y1="55" x2="205" y2="65"/><line x1="195" y1="65" x2="205" y2="55"/></g>
<g stroke="#6c7a93" stroke-width="2.5"><line x1="195" y1="135" x2="205" y2="145"/><line x1="195" y1="145" x2="205" y2="135"/></g>
<text x="208" y="64" font-size="11" fill="#6c7a93">steady swing</text>
<g stroke="#b4232c" stroke-width="2.5"><line x1="275" y1="65" x2="285" y2="75"/><line x1="275" y1="75" x2="285" y2="65"/></g>
<g stroke="#b4232c" stroke-width="2.5"><line x1="275" y1="125" x2="285" y2="135"/><line x1="275" y1="135" x2="285" y2="125"/></g>
<g stroke="#b4232c" stroke-width="2.5"><line x1="295" y1="95" x2="305" y2="105"/><line x1="295" y1="105" x2="305" y2="95"/></g>
<text x="285" y="175" font-size="11" text-anchor="middle" fill="#b4232c">grows: unstable</text>
<text x="30" y="182" font-size="11" fill="#1f2a44">left half: dies away</text>
</svg>
```
:::

::: context pd-controller Proportional and derivative
A **proportional** term pushes back in proportion to how far off you are — like a spring. A **derivative** term pushes back in proportion to how fast the error is changing — like a damper, braking the motion before you overshoot. Satellites carry out the commanded torque with reaction wheels or small thrusters. Add an integral term, which pushes against error that has built up over time, and you get the PID controller used almost everywhere.
:::
