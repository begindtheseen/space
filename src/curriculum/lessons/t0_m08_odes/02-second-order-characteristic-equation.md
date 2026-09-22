---
id: l02-second-order-characteristic-equation
title: Second-order equations and the characteristic equation
minutes: 20
covers:
  - second-order linear constant-coefficient ODEs and the characteristic equation
---

Newton's second law is a second-order differential equation. Force sets acceleration, acceleration is the second derivative of position, and so every rigid-body motion a GNC engineer cares about — a spacecraft rotating under a control torque, a launch vehicle pitching under thrust-vector deflection, a lander descending under throttled engines — is second order before anything else is added. The first-order equations of the previous lesson described how things approach a value. Second-order equations can do something new: they can oscillate, overshoot, and ring.

The good news is that the constant-coefficient linear case, which covers the rigid body plus a proportional-derivative controller, is completely solvable with one idea. Guess that the solution is an exponential, substitute it, and the differential equation collapses into a quadratic. That quadratic is the **characteristic equation**, and its two roots tell you everything about how the system moves on its own: whether it decays or grows, whether it oscillates, how fast, and how long it takes to settle. In the language you will use for the rest of the module, the roots are the **poles** of the system.

This lesson builds the method carefully, because the three cases of the quadratic — two real roots, one repeated root, a complex pair — are exactly the three kinds of motion you will meet in lesson 3 as overdamped, critically damped and underdamped. You will finish by reading the motion of a PD-controlled satellite straight off its characteristic roots.

## The equation and its structure

The general second-order linear ODE with constant coefficients is

$$
a\,\ddot{y} + b\,\dot{y} + c\,y = f(t),
$$

with $a \ne 0$, $b$ and $c$ real constants and $f(t)$ a known forcing function. When $f = 0$ the equation is **homogeneous**. In mechanics you will usually see it as $m\ddot{x} + c\dot{x} + kx = F(t)$ — mass, damping coefficient, stiffness, applied force — and in attitude control as $I\ddot{\theta} + K_d\dot{\theta} + K_p\theta = T(t)$, with moment of inertia, derivative gain and proportional gain.

Linearity gives the same structural results as in the first-order case, and the proofs are one line each. If $y_1$ and $y_2$ solve the homogeneous equation, so does any combination $C_1y_1 + C_2y_2$: substitute it and the operator $a\frac{d^2}{dt^2} + b\frac{d}{dt} + c$ distributes over the sum, giving $C_1 \cdot 0 + C_2 \cdot 0 = 0$. If $y_p$ solves the forced equation, then $y_p + C_1y_1 + C_2y_2$ does too, and every solution of the forced equation has this form because the difference of two solutions is homogeneous.

The new feature is that there are *two* free constants. A second-order equation needs two initial conditions, $y(0)$ and $\dot{y}(0)$ — position and velocity, or attitude and rate — and two constants are exactly what it takes to meet them. For this to work the two homogeneous solutions must be genuinely different: **linearly independent**, meaning neither is a constant multiple of the other. The test is the Wronskian $W = y_1\dot{y}_2 - \dot{y}_1y_2$; if $W \ne 0$ the pair is independent and the two initial conditions can always be matched. For a linear constant-coefficient equation the initial value problem has exactly one solution, defined for all time.

## The exponential ansatz and the characteristic equation

The homogeneous equation asks for a function whose second derivative, first derivative and value are proportional to one another with fixed coefficients. The exponential $e^{st}$ has exactly this property: every derivative is a multiple of the function itself. So try $y = e^{st}$ with $s$ a constant to be found. Then $\dot{y} = se^{st}$ and $\ddot{y} = s^2e^{st}$, and

$$
a s^2 e^{st} + b s e^{st} + c e^{st} = \bigl(as^2 + bs + c\bigr)e^{st} = 0.
$$

Since $e^{st}$ is never zero, the guess works if and only if

$$
a s^2 + b s + c = 0.
$$

This is the **characteristic equation** (or characteristic polynomial set to zero). The differential equation has been reduced to algebra. Its roots,

$$
s_{1,2} = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a},
$$

are the exponents of the two homogeneous solutions. Dimensionally, $st$ must be a pure number, so $s$ carries units of $\mathrm{s^{-1}}$; when the roots are complex their imaginary parts are angular frequencies in $\mathrm{rad/s}$. The discriminant $b^2 - 4ac$ sorts the roots into three cases, and each case gives a different shape of motion.

::: key
For $a\ddot{y} + b\dot{y} + cy = 0$, substituting $y = e^{st}$ gives the characteristic equation $as^2 + bs + c = 0$. Its roots are the exponents of the homogeneous solutions: real distinct roots give two exponentials, a repeated root gives $e^{st}$ and $te^{st}$, and a complex pair $\sigma \pm j\omega$ gives $e^{\sigma t}\cos\omega t$ and $e^{\sigma t}\sin\omega t$.
:::

## Case 1: two distinct real roots

If $b^2 > 4ac$, the roots $s_1 \neq s_2$ are real and

$$
y(t) = C_1e^{s_1t} + C_2e^{s_2t}.
$$

The Wronskian is $W = (s_2 - s_1)e^{(s_1 + s_2)t}$, nonzero because the roots differ, so the two exponentials are independent. The solution is a sum of two pure exponentials with no oscillation at all. If both roots are negative each term decays, and after a while the one with the smaller magnitude — the **slow** root — dominates, because the other has already vanished. If either root is positive the solution eventually grows without bound.

::: example Two real roots with initial conditions
Solve $\ddot{y} + 5\dot{y} + 6y = 0$ with $y(0) = 1$ and $\dot{y}(0) = 0$.

The characteristic equation $s^2 + 5s + 6 = (s + 2)(s + 3) = 0$ has roots $s_1 = -2$ and $s_2 = -3$, so $y = C_1e^{-2t} + C_2e^{-3t}$ and $\dot{y} = -2C_1e^{-2t} - 3C_2e^{-3t}$. The initial conditions give two linear equations:

$$
\begin{aligned}
C_1 + C_2 &= 1,\\
-2C_1 - 3C_2 &= 0.
\end{aligned}
$$

From the second, $C_2 = -\tfrac{2}{3}C_1$; substituting, $C_1(1 - \tfrac{2}{3}) = 1$, so $C_1 = 3$ and $C_2 = -2$:

$$
y(t) = 3e^{-2t} - 2e^{-3t}.
$$

Check: $y(0) = 3 - 2 = 1$ and $\dot{y}(0) = -6 + 6 = 0$. The response starts at 1 with zero slope, decays without ever crossing zero (the two terms have opposite signs but $3e^{-2t} > 2e^{-3t}$ for all $t \ge 0$), and for large $t$ behaves like $3e^{-2t}$ — the slow root at $-2\,\mathrm{s^{-1}}$, time constant $0.5\,\mathrm{s}$, sets the tail.
:::

## Case 2: one repeated real root

If $b^2 = 4ac$ the two roots coincide at $s_1 = -b/(2a)$ and the ansatz produces only one solution, $e^{s_1t}$. You need a second independent one. Look for it in the form $y = v(t)e^{s_1t}$ with $v$ unknown — the method of **reduction of order**. Differentiating,

$$
\dot{y} = (\dot{v} + s_1v)e^{s_1t}, \qquad \ddot{y} = (\ddot{v} + 2s_1\dot{v} + s_1^2v)e^{s_1t}.
$$

Substituting into $a\ddot{y} + b\dot{y} + cy = 0$ and dividing by $e^{s_1t}$,

$$
a\ddot{v} + (2as_1 + b)\dot{v} + (as_1^2 + bs_1 + c)v = 0.
$$

The last bracket is the characteristic polynomial at $s_1$, which is zero. The middle bracket is $2as_1 + b = -b + b = 0$ because $s_1 = -b/(2a)$. What remains is $a\ddot{v} = 0$, so $v = C_1 + C_2t$, and the general solution is

$$
y(t) = (C_1 + C_2t)\,e^{s_1t}.
$$

The extra factor of $t$ is the signature of a repeated root. It means the response does not decay as a pure exponential: $te^{s_1t}$ first rises from zero, peaks at $t = -1/s_1$, then decays. When $s_1 < 0$ it still goes to zero, because the exponential always wins against a polynomial.

::: example A deployment hinge at critical damping
A spring-loaded hinge on a solar array is modelled as $2\ddot{x} + 20\dot{x} + 50x = 0$, with $x$ in radians and the coefficients an inertia of $2\,\mathrm{kg\,m^2}$, a damper of $20\,\mathrm{N\,m\,s}$ and a stiffness of $50\,\mathrm{N\,m}$. Divide by 2: $\ddot{x} + 10\dot{x} + 25x = 0$, so $s^2 + 10s + 25 = (s + 5)^2$ and the root $s_1 = -5\,\mathrm{s^{-1}}$ is repeated. Hence $x = (C_1 + C_2t)e^{-5t}$.

If the hinge is released from its resting angle with an initial rate of $1\,\mathrm{rad/s}$ — $x(0) = 0$, $\dot{x}(0) = 1$ — then $C_1 = 0$ and, since $\dot{x} = (C_2 - 5C_2t)e^{-5t}$, $C_2 = 1$: $x(t) = te^{-5t}$. The excursion peaks when $\dot{x} = 0$, at $t = 0.2\,\mathrm{s}$, where $x = 0.2e^{-1} = 0.0736\,\mathrm{rad}$, and returns to rest without a single oscillation. This is the critically damped case of lesson 3: the damper is exactly strong enough to kill the oscillation and no stronger. Had the damper been $b = 2\sqrt{ac} = 2\sqrt{50 \times 2} = 20\,\mathrm{N\,m\,s}$ — which it is — the discriminant is zero; any less and the hinge would ring.
:::

::: warning
The most common error with a repeated root is to write $y = C_1e^{s_1t} + C_2e^{s_1t}$, which is one solution wearing two names — it cannot satisfy two independent initial conditions. The second solution is $te^{s_1t}$. Check the discriminant before you write the answer.
:::

## Case 3: a complex conjugate pair

If $b^2 < 4ac$ the square root is imaginary and the roots are

$$
s_{1,2} = \sigma \pm j\omega, \qquad \sigma = -\frac{b}{2a}, \qquad \omega = \frac{\sqrt{4ac - b^2}}{2a},
$$

where $j = \sqrt{-1}$ (engineers use $j$ because $i$ is current). Because the coefficients are real, complex roots always come in conjugate pairs. The two solutions $e^{(\sigma + j\omega)t}$ and $e^{(\sigma - j\omega)t}$ are complex-valued, but the physical response must be real, so use Euler's formula $e^{j\omega t} = \cos\omega t + j\sin\omega t$:

$$
e^{(\sigma \pm j\omega)t} = e^{\sigma t}\bigl(\cos\omega t \pm j\sin\omega t\bigr).
$$

Half the sum of the two is $e^{\sigma t}\cos\omega t$ and half the difference divided by $j$ is $e^{\sigma t}\sin\omega t$; both are real, both solve the equation (they are combinations of solutions), and they are independent. So the real general solution is

$$
y(t) = e^{\sigma t}\bigl(C_1\cos\omega t + C_2\sin\omega t\bigr) = R\,e^{\sigma t}\cos(\omega t - \varphi),
$$

with $R = \sqrt{C_1^2 + C_2^2}$ and $\tan\varphi = C_2/C_1$. The second form is the one to picture: a cosine of angular frequency $\omega$ inside an exponential envelope $Re^{\sigma t}$. The real part of the root sets the envelope, the imaginary part sets the frequency. If $\sigma < 0$ the oscillation dies away with time constant $1/|\sigma|$; if $\sigma > 0$ it grows; if $\sigma = 0$ it continues forever at constant amplitude. The period of the oscillation is $2\pi/\omega$.

::: example A decaying oscillation from a complex pair
Solve $\ddot{y} + 2\dot{y} + 5y = 0$ with $y(0) = 1$ and $\dot{y}(0) = 0$.

The characteristic equation $s^2 + 2s + 5 = 0$ has $b^2 - 4ac = 4 - 20 = -16$, so $s = -1 \pm 2j$: $\sigma = -1\,\mathrm{s^{-1}}$ and $\omega = 2\,\mathrm{rad/s}$. Then $y = e^{-t}(C_1\cos 2t + C_2\sin 2t)$, and

$$
\dot{y} = e^{-t}\bigl[(-C_1 + 2C_2)\cos 2t + (-C_2 - 2C_1)\sin 2t\bigr].
$$

At $t = 0$: $y(0) = C_1 = 1$ and $\dot{y}(0) = -C_1 + 2C_2 = 0$, so $C_2 = \tfrac{1}{2}$. Therefore

$$
y(t) = e^{-t}\bigl(\cos 2t + \tfrac{1}{2}\sin 2t\bigr) = 1.118\,e^{-t}\cos(2t - 26.6^\circ),
$$

using $R = \sqrt{1 + 0.25} = 1.118$ and $\varphi = \arctan(0.5) = 26.6^\circ$. The response oscillates with period $2\pi/2 = 3.14\,\mathrm{s}$ inside an envelope that shrinks by a factor $e$ every second. After three seconds the envelope is down to $1.118e^{-3} = 0.056$: the ringing is essentially gone in about four time constants of the real part, exactly as a first-order decay would be.
:::

## Reading the roots

Put the three cases side by side and a pattern appears that will carry through the whole module. Each root $s$ contributes a **mode** $e^{st}$ to the free motion. The **real part** of the root decides growth or decay and at what rate — the time constant of that mode is $1/|\operatorname{Re}s|$. The **imaginary part** decides whether the mode oscillates and how fast — its period is $2\pi/\operatorname{Im}s$. A root on the negative real axis is a plain decay; a complex pair in the left half of the plane is a decaying oscillation; a pair on the imaginary axis is a sustained oscillation; anything in the right half plane grows. This is why engineers draw roots as points in the complex plane and call them poles: the picture *is* the behaviour.

::: note
When $c = 0$ the characteristic equation $as^2 + bs = 0$ has a root at $s = 0$, whose mode $e^{0t} = 1$ is a constant. Physically the system has no spring: displace it and it stays displaced. A rigid body with only rate damping and no attitude feedback behaves this way, and a body with neither ($b = c = 0$) has a double root at zero and the modes $1$ and $t$: it drifts at constant rate. That "double integrator" is the starting point of every attitude control design.
:::

## A PD attitude controller as a second-order equation

Consider a spacecraft rotating about one axis with moment of inertia $I$. A proportional-derivative (PD) controller commands a torque proportional to the attitude error and to the rate: $T = -K_p\theta - K_d\dot{\theta}$ (with the target attitude at $\theta = 0$). Newton's law for rotation, $I\ddot{\theta} = T$, gives

$$
I\ddot{\theta} + K_d\dot{\theta} + K_p\theta = 0 \quad\Longrightarrow\quad I s^2 + K_d s + K_p = 0.
$$

The proportional gain acts as a spring and the derivative gain as a damper; the controller has turned a drifting body into a damped oscillator, and the roots tell you what kind. Critical damping — the boundary between ringing and not ringing — occurs when the discriminant vanishes: $K_d^2 = 4K_pI$, so $K_d = 2\sqrt{K_pI}$.

::: example Attitude gains and the resulting motion
A small satellite has $I = 50\,\mathrm{kg\,m^2}$ about its pitch axis, with gains $K_p = 20\,\mathrm{N\,m/rad}$ and $K_d = 40\,\mathrm{N\,m\,s/rad}$. The characteristic equation $50s^2 + 40s + 20 = 0$, or $s^2 + 0.8s + 0.4 = 0$, has discriminant $0.64 - 1.6 < 0$, so the roots are complex:

$$
s = -0.4 \pm j\sqrt{0.4 - 0.16} = -0.4 \pm 0.490j\ \mathrm{s^{-1}}.
$$

Released from a $0.1\,\mathrm{rad}$ error at rest, $\theta = e^{-0.4t}(C_1\cos 0.490t + C_2\sin 0.490t)$ with $C_1 = 0.1$ and, from $\dot{\theta}(0) = -0.4C_1 + 0.490C_2 = 0$, $C_2 = 0.0816$. So

$$
\theta(t) = e^{-0.4t}\bigl(0.1\cos 0.490t + 0.0816\sin 0.490t\bigr) = 0.129\,e^{-0.4t}\cos(0.490t - 39.2^\circ).
$$

The oscillation has period $2\pi/0.490 = 12.8\,\mathrm{s}$ and the envelope time constant is $1/0.4 = 2.5\,\mathrm{s}$; at $t = 5\,\mathrm{s}$ the attitude is $\theta = -0.0034\,\mathrm{rad}$, already on the far side of zero — the satellite overshot. To remove the overshoot entirely the designer would raise the derivative gain to $K_d = 2\sqrt{20 \times 50} = 63.2\,\mathrm{N\,m\,s/rad}$, making the roots coincide at $-0.632\,\mathrm{s^{-1}}$.
:::

::: warning
Keep the sign convention straight when forming the characteristic equation. The ODE must have all its $y$ terms on one side and be written as $a\ddot{y} + b\dot{y} + cy = 0$ before you read off $a$, $b$, $c$. For $\ddot{y} = -3\dot{y} + 4y$, the characteristic equation is $s^2 + 3s - 4 = 0$ with roots $1$ and $-4$ — one of them positive, so the motion grows — not $s^2 - 3s + 4 = 0$.
:::

## Higher order and what comes next

Nothing in the method depended on the order being two. An $n$-th order homogeneous equation with constant coefficients, $a_n y^{(n)} + \cdots + a_1\dot{y} + a_0y = 0$, yields under the same ansatz the polynomial $a_ns^n + \cdots + a_1s + a_0 = 0$, whose $n$ roots (counted with multiplicity) give $n$ modes; complex roots pair up as before and repeated roots bring in powers of $t$. The free motion is a sum of modes, one per root, and $n$ initial conditions fix the $n$ constants. A satellite whose actuator has a first-order lag, for example, is third order, and its characteristic cubic has one real root and one complex pair.

What the ansatz does not give is the response to forcing $f(t)$: a commanded attitude, a disturbance torque, a gust. That needs a particular solution, and lesson 5 builds it. Before that, lesson 3 takes the complex-root case, renames its two parameters as the natural frequency and damping ratio, and turns this lesson's algebra into the standard vocabulary of control engineering.

## Check yourself

::: check
Find the general solution of $\ddot{y} - \dot{y} - 6y = 0$ and describe what happens to almost every solution as $t \to \infty$.
:::

::: answer
The characteristic equation $s^2 - s - 6 = (s - 3)(s + 2) = 0$ has roots $3$ and $-2$, so $y = C_1e^{3t} + C_2e^{-2t}$. Unless the initial conditions happen to make $C_1 = 0$ exactly, the $e^{3t}$ term takes over and the solution grows without bound: one positive real root is enough to make the system unstable.
:::

::: check
Solve $\ddot{y} + 6\dot{y} + 9y = 0$ with $y(0) = 2$ and $\dot{y}(0) = -1$.
:::

::: answer
$s^2 + 6s + 9 = (s + 3)^2$: a repeated root at $-3$, so $y = (C_1 + C_2t)e^{-3t}$. Then $y(0) = C_1 = 2$ and $\dot{y} = (C_2 - 3C_1 - 3C_2t)e^{-3t}$ gives $\dot{y}(0) = C_2 - 6 = -1$, so $C_2 = 5$. The solution is $y = (2 + 5t)e^{-3t}$. It rises briefly (the initial slope is $-1$ but $5t$ soon dominates? No — check: $\dot{y}(0) = -1 < 0$, so it starts downward) and decays to zero without oscillating, as a repeated negative root always does.
:::

::: check
A structure obeys $\ddot{y} + 9y = 0$ with $y(0) = 0$ and $\dot{y}(0) = 6$. Write the solution and give the period of the motion.
:::

::: answer
$s^2 + 9 = 0$ gives $s = \pm 3j$: $\sigma = 0$, $\omega = 3\,\mathrm{rad/s}$, so $y = C_1\cos 3t + C_2\sin 3t$. From $y(0) = 0$, $C_1 = 0$; from $\dot{y}(0) = 3C_2 = 6$, $C_2 = 2$. So $y = 2\sin 3t$: an undamped oscillation of amplitude 2 and period $2\pi/3 = 2.09\,\mathrm{s}$. With no real part to the roots, nothing ever decays.
:::

::: check
A proof mass of $m = 2\,\mathrm{kg}$ sits on a spring of stiffness $k = 50\,\mathrm{N/m}$. What damping coefficient $c$ makes the free motion critically damped, and what is the repeated root?
:::

::: answer
The characteristic equation of $m\ddot{x} + c\dot{x} + kx = 0$ is $ms^2 + cs + k = 0$, with a repeated root when $c^2 = 4km$: $c = 2\sqrt{km} = 2\sqrt{50 \times 2} = 20\,\mathrm{N\,s/m}$. The root is $s = -c/(2m) = -20/4 = -5\,\mathrm{s^{-1}}$, so the free motion is $(C_1 + C_2t)e^{-5t}$.
:::

::: check
Why does a second-order equation need exactly two initial conditions, and what goes wrong if the two homogeneous solutions you found are not linearly independent?
:::

::: answer
The general solution $y_p + C_1y_1 + C_2y_2$ has two free constants, matching the two pieces of information — $y(0)$ and $\dot{y}(0)$ — that Newton's law needs to start a motion. Matching them means solving two linear equations for $C_1$ and $C_2$, whose determinant is the Wronskian $W = y_1\dot{y}_2 - \dot{y}_1y_2$ at $t = 0$. If $y_1$ and $y_2$ are dependent, $W = 0$ and the system is singular: for most initial conditions there is no solution at all, because you really have only one function. This is precisely the trap with a repeated root, cured by the second solution $te^{s_1t}$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $a\ddot{y} + b\dot{y} + cy = f(t)$ | Second-order linear constant-coefficient ODE; homogeneous when $f = 0$ |
| $y = e^{st}$ | The exponential ansatz |
| $as^2 + bs + c = 0$ | Characteristic equation; roots $s_{1,2} = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ in $\mathrm{s^{-1}}$ |
| $b^2 > 4ac$ | Two real roots: $y = C_1e^{s_1t} + C_2e^{s_2t}$ |
| $b^2 = 4ac$ | Repeated root $s_1 = -b/2a$: $y = (C_1 + C_2t)e^{s_1t}$ |
| $b^2 < 4ac$ | Complex pair $\sigma \pm j\omega$: $y = e^{\sigma t}(C_1\cos\omega t + C_2\sin\omega t) = Re^{\sigma t}\cos(\omega t - \varphi)$ |
| $\operatorname{Re}s$, $\operatorname{Im}s$ | Decay rate (time constant $1/\lvert\operatorname{Re}s\rvert$) and oscillation frequency (period $2\pi/\operatorname{Im}s$) |
| $W = y_1\dot{y}_2 - \dot{y}_1y_2$ | Wronskian; nonzero means the solutions are independent |
| $Is^2 + K_ds + K_p = 0$ | PD attitude loop; critical damping at $K_d = 2\sqrt{K_pI}$ |

Next lesson rewrites $s^2 + 2\zeta\omega_n s + \omega_n^2 = 0$ in terms of a natural frequency and a damping ratio, and shows how those two numbers — read straight off the pole pair — predict overshoot and settling time.
