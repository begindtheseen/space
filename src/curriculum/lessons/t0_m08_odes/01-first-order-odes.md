---
id: l01-first-order-odes
title: First-order ODEs and the actuator lag
minutes: 20
covers:
  - first-order ODEs: separable, linear, integrating factor
---

A differential equation is a statement about how something changes, written in the language of rates. Newton's second law says how velocity changes when a force acts; a thrust-vector actuator obeys a rule about how fast its nozzle angle can chase a command; a reaction wheel spinning down under bearing friction loses speed at a rate proportional to the speed it has. None of these statements tells you the answer directly. Each tells you the slope of the answer, at every instant, and leaves you to reconstruct the curve. Solving the equation is that reconstruction.

A GNC engineer lives inside differential equations. The vehicle's dynamics are differential equations, the sensors and actuators are differential equations, and the controller you design is another differential equation wrapped around all of them. Before you can read a damping ratio off a pole pair or write a Kalman filter's propagation step, you need to be fluent with the smallest case: one unknown function, one derivative. That is the first-order ordinary differential equation (ODE), and it is the subject of this lesson.

Two families cover almost every first-order equation you will meet on a vehicle. Separable equations, which you solve by pulling the variables apart and integrating each side, give you exponential decay, terminal velocity and the rocket equation. Linear equations, which you solve with an integrating factor, give you the first-order lag — the standard model of an actuator, a sensor filter, or a slowly wandering gyro bias. The lag also introduces the time constant, the single number that summarises how fast a first-order system forgets its past.

## What a differential equation says

An ordinary differential equation relates an unknown function $y(t)$ of one independent variable $t$ to its derivatives. "Ordinary" means one independent variable — for us, almost always time. The **order** of the equation is the highest derivative that appears. A first-order ODE can always be written as

$$
\dot{y} = f(t, y),
$$

where $\dot{y}$ means $\frac{dy}{dt}$ and $f$ is some given function. The equation says: at time $t$, if the value is $y$, the slope is $f(t, y)$. That is a rule for the slope at every point of the $(t, y)$ plane, and a solution is any curve $y(t)$ whose slope obeys the rule everywhere.

There are infinitely many such curves. Picture the rule as a field of little arrows in the plane, one at each point, pointing with slope $f(t, y)$ — a **direction field**. Start anywhere and follow the arrows and you trace one solution; start somewhere else and you trace another. To pin down a single solution you must say where to start: an **initial condition** $y(t_0) = y_0$. An ODE together with an initial condition is an **initial value problem**. For any $f$ that is reasonably smooth (continuous in $t$ and with a bounded slope in $y$), the initial value problem has exactly one solution near $t_0$. Two solution curves never cross, because at a crossing point the rule would have to give two different slopes at once. You will use this uniqueness constantly, usually without noticing: it is what allows a simulation that knows the state at one instant to predict the state at the next.

An equation is **linear** when $y$ and its derivatives appear only to the first power, multiplied by known functions of $t$, and never inside another function. $\dot{y} + 3y = \sin t$ is linear; $\dot{y} = y^2$ and $\dot{y} = \sin y$ are not. Linear equations have the enormous advantage that solutions can be added: this **superposition** property is the foundation of the whole module. Nonlinear equations must be handled one at a time, and a few — the separable ones — can be solved in closed form.

## Separable equations

An equation is **separable** when the slope function factors into a piece depending only on $t$ and a piece depending only on $y$:

$$
\dot{y} = g(t)\,h(y).
$$

Divide by $h(y)$ and multiply by $dt$, treating $\frac{dy}{dt}$ as a ratio of differentials (which the chain rule justifies), and the variables separate:

$$
\int \frac{dy}{h(y)} = \int g(t)\,dt + C.
$$

Do both integrals, then solve for $y$ if you can. The constant $C$ is fixed by the initial condition.

The most important separable equation in engineering is exponential decay or growth,

$$
\dot{y} = a\,y, \qquad y(0) = y_0,
$$

with $a$ a constant. Separating gives $\int dy/y = \int a\,dt$, so $\ln|y| = at + C$, and exponentiating,

$$
y(t) = y_0\,e^{at}.
$$

When $a$ is negative the solution decays, and it is conventional to write $a = -1/\tau$ with $\tau > 0$ the **time constant**:

$$
\dot{y} = -\frac{y}{\tau} \quad\Longrightarrow\quad y(t) = y_0\,e^{-t/\tau}.
$$

The time constant has the units of time and is the only scale in the problem. After one time constant the value has fallen to $e^{-1} \approx 36.8\%$ of where it started; after $2\tau$ to $13.5\%$; after $3\tau$ to $5.0\%$; after $4\tau$ to $1.8\%$; after $5\tau$ to $0.7\%$. Engineers round these to the rules of thumb "63% of the change is done after one time constant" and "the response is settled to within 2% after four time constants". The half-life is $\tau \ln 2 \approx 0.693\,\tau$.

::: example Reaction wheel spinning down
A reaction wheel with moment of inertia $I = 0.02\,\mathrm{kg\,m^2}$ is switched off at $6000\,\mathrm{rpm}$ and coasts against viscous bearing friction that produces a torque $-b\,\omega$ with $b = 2\times 10^{-5}\,\mathrm{N\,m\,s}$. Newton's law for rotation, $I\dot{\omega} = -b\,\omega$, is exponential decay with

$$
\tau = \frac{I}{b} = \frac{0.02}{2\times 10^{-5}} = 1000\,\mathrm{s}.
$$

The initial rate is $\omega_0 = 6000 \times 2\pi/60 = 628\,\mathrm{rad/s}$. One hour later,

$$
\omega(3600) = 628\,e^{-3600/1000} = 628 \times 0.0273 = 17.2\,\mathrm{rad/s} \approx 164\,\mathrm{rpm}.
$$

Half the speed is lost every $1000 \ln 2 = 693\,\mathrm{s}$, regardless of how fast the wheel happens to be spinning — that scale-independence is the signature of a linear equation. A wheel that is not spinning down this way (for example, one whose speed falls linearly) is telling you the friction is not viscous.
:::

Separable equations do not have to be linear, and the nonlinear ones behave differently. Consider a body slowed only by aerodynamic drag proportional to the square of its speed, $\dot{v} = -k v^2$ with $k > 0$. Separating, $\int dv/v^2 = -k\int dt$, so $-1/v = -kt + C$. With $v(0) = v_0$ the constant is $C = -1/v_0$ and

$$
v(t) = \frac{v_0}{1 + k v_0 t}.
$$

This is not exponential: it has no time constant, and the effective decay rate $k v_0$ depends on the initial speed. A fast body slows quickly, a slow one barely at all, and the speed approaches zero like $1/t$ rather than like $e^{-t/\tau}$. Nonlinear equations can also do something linear ones never do: blow up in finite time. The equation $\dot{y} = y^2$ with $y(0) = 1$ separates to $-1/y = t + C$, so $y = 1/(1 - t)$, which is infinite at $t = 1$. Existence of a solution is guaranteed only locally.

::: example The rocket equation as a separable ODE
A rocket of instantaneous mass $m$ expels propellant at exhaust speed $v_e$ relative to the vehicle. Conservation of momentum over a small interval gives $m\,dv = -v_e\,dm$ (the mass change $dm$ is negative), which is the separable equation

$$
\frac{dv}{dm} = -\frac{v_e}{m} \quad\Longrightarrow\quad \int_{0}^{\Delta v} dv = -v_e \int_{m_0}^{m_f} \frac{dm}{m} \quad\Longrightarrow\quad \Delta v = v_e \ln\frac{m_0}{m_f}.
$$

Here the independent variable is mass rather than time; the method does not care. For a Falcon 9 first stage with sea-level specific impulse $I_{sp} \approx 282\,\mathrm{s}$, the exhaust speed is $v_e = I_{sp}\,g_0 = 282 \times 9.80665 = 2765\,\mathrm{m/s}$. The vehicle lifts off at about $m_0 = 549{,}000\,\mathrm{kg}$ and the first stage burns about $411{,}000\,\mathrm{kg}$ of propellant, leaving $m_f = 138{,}000\,\mathrm{kg}$. The ideal velocity gain is

$$
\Delta v = 2765 \times \ln\frac{549{,}000}{138{,}000} = 2765 \times 1.381 \approx 3820\,\mathrm{m/s}.
$$

The real stage delivers less, because gravity and drag act during the burn — additional terms that make the equation no longer separable, and that a trajectory program integrates numerically.
:::

## Linear first-order equations and the integrating factor

The general first-order linear ODE is

$$
\dot{y} + p(t)\,y = q(t),
$$

where $p$ and $q$ are known functions. When $q = 0$ the equation is **homogeneous** and separable; when $q \neq 0$ it is **forced**, and $q$ is the input or forcing term. Separation fails on the forced equation because the $y$ on the left cannot be isolated from the $t$ on the right. The remedy is to multiply the whole equation by a cleverly chosen function $\mu(t)$, the **integrating factor**, so that the left side becomes an exact derivative.

We want $\mu\dot{y} + \mu p\,y$ to equal $\frac{d}{dt}(\mu y) = \mu\dot{y} + \dot{\mu}\,y$. Comparing, we need $\dot{\mu} = p\,\mu$, which is itself separable:

$$
\mu(t) = \exp\!\left(\int p(t)\,dt\right).
$$

Any constant of integration in the exponent only rescales $\mu$ and cancels later, so drop it. Multiplying the equation by $\mu$ and recognising the left side,

$$
\frac{d}{dt}\bigl(\mu y\bigr) = \mu\,q \quad\Longrightarrow\quad y(t) = \frac{1}{\mu(t)}\left(\int \mu(t)\,q(t)\,dt + C\right).
$$

This is a complete recipe: compute $\mu$, integrate $\mu q$, divide, fix $C$ from the initial condition. It works for any $p$ and $q$ that you can integrate.

::: key
Integrating factor: for $\dot{y} + p(t)y = q(t)$, multiply by $\mu = \exp\bigl(\int p\,dt\bigr)$. Then $\frac{d}{dt}(\mu y) = \mu q$, and $y = \frac{1}{\mu}\bigl(\int \mu q\,dt + C\bigr)$.
:::

A short example with a genuinely time-varying coefficient shows the mechanics. Take $\dot{y} + \frac{2}{t}\,y = t$ for $t > 0$. Here $p = 2/t$, so $\int p\,dt = 2\ln t$ and $\mu = t^2$. The equation becomes $\frac{d}{dt}(t^2 y) = t^3$, so $t^2 y = t^4/4 + C$ and $y = t^2/4 + C/t^2$. You can verify by differentiating: $\dot{y} = t/2 - 2C/t^3$, and $\dot{y} + 2y/t = t/2 - 2C/t^3 + t/2 + 2C/t^3 = t$.

### The constant-coefficient case: the first-order lag

On a vehicle, $p$ is very often a constant, and the equation is usually written in the form

$$
\tau\,\dot{y} + y = u(t),
$$

where $u(t)$ is the commanded or input quantity and $\tau$ is the time constant. This is the **first-order lag**. It says that $y$ moves toward $u$ at a rate proportional to the gap, $\dot{y} = (u - y)/\tau$. It is the standard model for anything that follows a command with a delay but no overshoot: an electromechanical thrust-vector actuator, a valve, a temperature sensor, the low-pass filter on a rate gyro.

Dividing by $\tau$ puts it in standard form with $p = 1/\tau$, so $\mu = e^{t/\tau}$ and

$$
y(t) = e^{-t/\tau}\left(\frac{1}{\tau}\int_0^t e^{t'/\tau}\,u(t')\,dt' + y(0)\right).
$$

For a **step input**, $u(t) = U$ constant for $t \ge 0$, the integral is $U\tau\,(e^{t/\tau} - 1)$ and the solution is

$$
y(t) = U + \bigl(y(0) - U\bigr)e^{-t/\tau}.
$$

Read it as: the output starts at $y(0)$ and the gap to the final value $U$ decays exponentially with time constant $\tau$. Starting from rest, $y(t) = U(1 - e^{-t/\tau})$, which reaches 63.2% of the step after $\tau$ and 98.2% after $4\tau$. The initial slope is $U/\tau$: if the output kept rising at its initial rate it would arrive at $U$ in exactly one time constant. That tangent-line construction is how you read $\tau$ off a recorded step response.

::: example A thrust-vector actuator answering a step
A TVC actuator is modelled as a first-order lag with $\tau = 0.05\,\mathrm{s}$. At $t = 0$ the autopilot commands a nozzle deflection of $2^\circ$ from a resting nozzle. Then $y(t) = 2(1 - e^{-t/0.05})$ degrees, so

$$
y(0.05) = 2(1 - e^{-1}) = 1.26^\circ, \qquad y(0.10) = 2(1 - e^{-2}) = 1.73^\circ, \qquad y(0.20) = 2(1 - e^{-4}) = 1.96^\circ.
$$

The actuator is within 2% of the command after $4\tau = 0.2\,\mathrm{s}$. If the guidance loop updates its command every $0.1\,\mathrm{s}$, the nozzle only ever gets 86% of the way to each new command before the next one arrives — a lag the autopilot design must account for. Later in this module the same actuator will appear as the transfer function $1/(\tau s + 1)$.
:::

### Ramp and sinusoidal inputs

Two more inputs matter because commands and disturbances are built from them. For a **ramp** $u(t) = r\,t$ with $y(0) = 0$, the integral is $\frac{r}{\tau}\int_0^t t' e^{t'/\tau}dt' = r\bigl[(t - \tau)e^{t/\tau} + \tau\bigr]$ (integrate by parts), so

$$
y(t) = r\,(t - \tau) + r\,\tau\,e^{-t/\tau}.
$$

After the exponential dies away, the output is the ramp delayed by exactly one time constant: it lags the command by $r\tau$ in value, or by $\tau$ in time. A TVC actuator with $\tau = 0.05\,\mathrm{s}$ following a $10^\circ/\mathrm{s}$ slew sits $0.5^\circ$ behind the command, forever.

For a **sinusoid** $u(t) = A\cos\omega t$, the algebra is cleaner in the standard form $\dot{y} + a y = a A \cos\omega t$ with $a = 1/\tau$. Rather than integrate $e^{at}\cos\omega t$ directly, guess that the long-run response is a sinusoid of the same frequency, $y_p = M \cos(\omega t - \phi)$, and substitute. Matching the $\cos\omega t$ and $\sin\omega t$ terms gives

$$
M = \frac{aA}{\sqrt{a^2 + \omega^2}} = \frac{A}{\sqrt{1 + (\omega\tau)^2}}, \qquad \tan\phi = \frac{\omega}{a} = \omega\tau.
$$

The lag attenuates and delays a sinusoid, and both effects grow with frequency. For the actuator with $a = 20\,\mathrm{rad/s}$: at $\omega = 2\,\mathrm{rad/s}$ the amplitude ratio is $0.995$ and the phase lag $5.7^\circ$, essentially perfect tracking; at $\omega = 20\,\mathrm{rad/s}$ the ratio is $0.707$ and the lag $45^\circ$; at $\omega = 60\,\mathrm{rad/s}$ the ratio is $0.316$ and the lag $71.6^\circ$. The frequency $\omega = 1/\tau$, where the ratio is $1/\sqrt{2}$ and the lag $45^\circ$, is the **corner frequency** — the actuator's bandwidth. You have met your first frequency response; the second-order version arrives in lesson 5.

## Transient plus steady state

Look back at the three forced solutions. Each is a sum of two parts. One part — $(y(0) - U)e^{-t/\tau}$, or $r\tau e^{-t/\tau}$, or the decaying piece we did not write out for the sinusoid — depends on the initial condition and dies away. The other — $U$, or $r(t - \tau)$, or $M\cos(\omega t - \phi)$ — is set by the input and persists. The first is the **transient** (or homogeneous, or natural) response; the second is the **steady-state** (or particular, or forced) response.

This split is not an accident of these examples. For any linear equation $\dot{y} + p y = q$, if $y_p$ is any one solution and $y_h$ solves the homogeneous equation $\dot{y} + py = 0$, then $y_p + y_h$ is also a solution, because the equation is linear: $(\dot{y}_p + \dot{y}_h) + p(y_p + y_h) = q + 0$. Conversely the difference of any two solutions solves the homogeneous equation. So the general solution is

$$
y = y_p + C\,y_h,
$$

one particular solution plus the full family of homogeneous solutions, with one free constant to match one initial condition. The homogeneous solution $e^{-t/\tau}$ depends only on the system; the particular solution depends on the input. Every later lesson exploits this structure, and it is worth pausing on the moral: **the system decides how it forgets, the input decides where it ends up.**

::: warning
A common slip is to fix the constant $C$ from the initial condition before adding the particular solution. The initial condition applies to the whole solution $y = y_p + Cy_h$, so $C = y(0) - y_p(0)$. For the step response, $C = y(0) - U$, not $y(0)$.
:::

## Equilibria and the sign of the coefficient

Set $q$ to a constant and ask where $\dot{y} = 0$: the equation $\dot{y} = a y + b$ has a single **equilibrium** at $y_e = -b/a$. Whether solutions approach it or flee from it is decided entirely by the sign of $a$, because the solution is $y = y_e + (y_0 - y_e)e^{at}$. If $a < 0$ every solution converges to $y_e$ and the equilibrium is **stable**; if $a > 0$ every solution except the one starting exactly at $y_e$ runs away exponentially and the equilibrium is **unstable**; if $a = 0$ there is no restoring tendency at all, and the "equilibrium" is a whole line of rest points, each neutrally stable.

This one-dimensional picture is the seed of the entire theory of stability from pole locations. The number $a$ will later be called a pole, and "$a < 0$" will become "the pole lies in the left half of the complex plane". The direction field makes the sign visible: for $a < 0$ the arrows above $y_e$ point down and the arrows below point up, funnelling every curve onto the equilibrium; for $a > 0$ they point away. The rate of approach is set by $|a|$ — a time constant $1/|a|$ — and nothing else. A gyro bias modelled as $\dot{b} = -b/\tau_c + w(t)$, with $\tau_c$ a correlation time of an hour or more and $w$ a random drive, is precisely this equation: left alone, the bias relaxes toward zero over hours, while the drive keeps kicking it. That is the first-order Gauss–Markov process you will meet again in the estimation modules.

::: key
Exponential response: $\dot{y} = ay$ gives $y = y_0e^{at}$. With $a = -1/\tau$ the solution decays with time constant $\tau$; 63.2% of a step is complete after $\tau$, 98.2% after $4\tau$. The equilibrium of $\dot{y} = ay + b$ is stable when $a < 0$, unstable when $a > 0$.
:::

::: note
Dimensional check: in $\tau\dot{y} + y = u$, the quantity $\tau\dot{y}$ must carry the units of $y$, so $\tau$ is in seconds and $1/\tau$ in $\mathrm{s^{-1}}$. When you see $\dot{y} + 20y = 20u$, the 20 is $1/\tau$ in $\mathrm{s^{-1}}$ and the time constant is $50\,\mathrm{ms}$. Getting into the habit of reading coefficients as rates, in $\mathrm{rad/s}$ or $\mathrm{s^{-1}}$, will pay off when you read natural frequencies off characteristic equations in the next lessons.
:::

## Check yourself

::: check
What is the integrating factor for $\dot{y} + p(t)y = q(t)$, and why does multiplying by it help?
:::

::: answer
$\mu(t) = \exp\bigl(\int p\,dt\bigr)$. Since $\dot{\mu} = p\mu$, the product rule gives $\frac{d}{dt}(\mu y) = \mu\dot{y} + p\mu y = \mu(\dot{y} + py) = \mu q$. The left side of the equation has collapsed into a single derivative, so one integration finishes the job: $\mu y = \int\mu q\,dt + C$.
:::

::: check
Solve $\dot{y} = -3y + 6$ with $y(0) = 0$. What is the time constant, and when is the response within 2% of its final value?
:::

::: answer
Rewrite as $\dot{y} + 3y = 6$: $p = 3$, $\mu = e^{3t}$, so $\frac{d}{dt}(e^{3t}y) = 6e^{3t}$, giving $e^{3t}y = 2e^{3t} + C$ and $y = 2 + Ce^{-3t}$. From $y(0) = 0$, $C = -2$, so $y = 2(1 - e^{-3t})$. The time constant is $\tau = 1/3\,\mathrm{s}$; the response is within 2% of the final value 2 after $4\tau = 1.33\,\mathrm{s}$. Check: the equilibrium of $\dot{y} = -3y + 6$ is $y_e = 6/3 = 2$ and the coefficient $-3$ is negative, so it is stable.
:::

::: check
A first-order actuator with $\tau = 0.1\,\mathrm{s}$ tracks a ramp command of $5^\circ/\mathrm{s}$. After the transient has died, how far behind the command is the actuator, in degrees and in seconds?
:::

::: answer
The steady-state ramp response is $y = r(t - \tau)$, so the actuator lags by $\tau = 0.1\,\mathrm{s}$ in time, which at $r = 5^\circ/\mathrm{s}$ is $r\tau = 0.5^\circ$ in value. The lag is constant: it does not grow with time, but it never closes either.
:::

::: check
Solve $\dot{y} + \frac{1}{t}\,y = 1$ for $t > 0$ with $y(1) = 0$.
:::

::: answer
$p = 1/t$, so $\int p\,dt = \ln t$ and $\mu = t$. Then $\frac{d}{dt}(ty) = t$, so $ty = t^2/2 + C$ and $y = t/2 + C/t$. The condition $y(1) = 0$ gives $1/2 + C = 0$, so $C = -1/2$ and $y = \frac{t}{2} - \frac{1}{2t}$. Verify: $\dot{y} = 1/2 + 1/(2t^2)$ and $y/t = 1/2 - 1/(2t^2)$; their sum is 1.
:::

::: check
The equation $\dot{y} = y^2$ with $y(0) = 1$ is separable. Solve it and explain what happens at $t = 1$. Could a linear first-order equation with constant coefficients do the same?
:::

::: answer
Separating, $\int dy/y^2 = \int dt$ gives $-1/y = t + C$; from $y(0) = 1$, $C = -1$, so $y = 1/(1 - t)$. The solution grows without bound as $t \to 1$: it exists only on $0 \le t < 1$. No linear constant-coefficient equation can do this. Its solutions are $y_p + Ce^{at}$, which are finite for every finite $t$; they may grow exponentially, but never reach infinity in finite time.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{y} = f(t, y)$ | General first-order ODE: a rule for the slope at each point |
| $\dot{y} = g(t)h(y)$ | Separable; solve $\int dy/h = \int g\,dt$ |
| $\dot{y} = ay$, $y = y_0e^{at}$ | Exponential growth ($a > 0$) or decay ($a < 0$) |
| $\tau = -1/a$ | Time constant; 63.2% after $\tau$, 98.2% after $4\tau$, half-life $0.693\tau$ |
| $\dot{y} + p(t)y = q(t)$ | Linear first-order; integrating factor $\mu = e^{\int p\,dt}$ |
| $\tau\dot{y} + y = u$ | First-order lag (actuator model); step response $U + (y_0 - U)e^{-t/\tau}$ |
| Ramp response | Lags the command by $\tau$ in time, $r\tau$ in value |
| Sinusoid response | Amplitude $A/\sqrt{1 + (\omega\tau)^2}$, phase lag $\arctan\omega\tau$; corner at $\omega = 1/\tau$ |
| $y = y_p + Cy_h$ | Particular (steady-state) plus homogeneous (transient) |
| $\dot{y} = ay + b$ | Equilibrium $y_e = -b/a$, stable iff $a < 0$ |

Next lesson adds one more derivative. Second-order equations bring oscillation, and with it the characteristic equation whose roots — the poles — organise everything that follows.
