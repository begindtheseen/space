---
id: l01-first-order-odes
title: First-order ODEs and the actuator lag
minutes: 23
covers:
  - first-order ODEs: separable, linear, integrating factor
---

Pour a mug of hot cocoa and leave it on the table. Nobody hands you a formula for its temperature at every minute. What you know is a rule about how it *changes*: the hotter it is compared with the room, the faster it cools. A rule like that — a rule about the rate of change — is a **differential equation**. Solving one means turning "how fast it changes right now" back into "what it is at every moment".

Rockets are full of these rules. Newton's second law says how velocity changes when a force acts. A **[[thrust-vector actuator|tvc-actuator]]** — the motor that swivels a rocket engine to steer — obeys a rule about how fast the nozzle angle can chase a command. A spinning **[[reaction wheel|reaction-wheel]]** slowing down under bearing friction loses speed at a rate proportional to the speed it has. None of these rules tells you the answer directly. Each tells you the *slope* of the answer at every instant, and leaves you to rebuild the curve.

A GNC engineer (guidance, navigation and control) lives inside differential equations. The vehicle is one, the sensors and actuators are more, and the controller you design is another one wrapped around all of them. This lesson starts with the smallest case: one unknown quantity, one derivative. Two families cover almost everything you will meet. **Separable** equations give exponential decay and the rocket equation. **Linear** equations, solved with an integrating factor, give the **first-order lag** — the standard model of an actuator, a sensor filter or a slowly wandering gyro error. Along the way you will meet the **time constant**, the one number that says how fast a first-order system forgets its past.

## What a differential equation says

An **ordinary differential equation** (ODE) links an unknown function $y(t)$ to its derivatives. **[[Ordinary|ordinary-partial]]** means there is one independent variable — for us, almost always time $t$. The **order** is the highest derivative that appears. A first-order ODE can always be written as

$$
\dot{y} = f(t, y).
$$

Read $\dot{y}$ as "y dot". It is short for $\frac{dy}{dt}$, the rate of change of $y$. The equation says: at time $t$, if the value is $y$, then the slope is $f(t, y)$.

So an ODE is a rule for the slope at every point of the $(t, y)$ plane. A **solution** is any curve $y(t)$ whose slope obeys that rule everywhere.

There are infinitely many such curves. Picture the rule as a field of short arrows, one at each point, each tilted to the slope $f(t, y)$. That picture is a **[[direction field|direction-field]]**. Start anywhere and follow the arrows, and you trace one solution. Start somewhere else and you trace another.

To pin down one solution you must say where to start. That is an **initial condition**, $y(t_0) = y_0$ — "at time $t_0$ the value was $y_0$". An ODE plus an initial condition is an **initial value problem**.

For any reasonably smooth $f$ (continuous in $t$, and not changing infinitely steeply in $y$), an initial value problem has exactly one solution near $t_0$. Two solution curves can never cross: at the crossing point the rule would have to give two different slopes at once. You will lean on this **uniqueness** constantly, usually without noticing. It is what lets a flight simulation that knows the state now predict the state a moment later.

An equation is **linear** when $y$ and its derivatives appear only to the first power, multiplied by known functions of $t$, and never inside another function. $\dot{y} + 3y = \sin t$ is linear. $\dot{y} = y^2$ and $\dot{y} = \sin y$ are not.

Linear equations have a huge advantage: their solutions can be added together. This **[[superposition|superposition]]** property is the foundation of the whole module. Nonlinear equations must be handled one at a time, and only some of them — the separable ones — can be solved with pencil and paper.

## Separable equations

Think of sorting laundry: socks in one pile, shirts in the other. An equation is **separable** when you can sort it the same way — everything about $y$ on one side, everything about $t$ on the other. That works when the slope factors into a piece that depends only on $t$ times a piece that depends only on $y$:

$$
\dot{y} = g(t)\,h(y).
$$

Divide both sides by $h(y)$ and multiply by $dt$. (Treating $\frac{dy}{dt}$ like a fraction here is allowed; the chain rule is what justifies it.) The variables are now in separate piles:

$$
\int \frac{dy}{h(y)} = \int g(t)\,dt + C.
$$

Do both integrals, then solve for $y$ if you can. The constant $C$ is fixed by the initial condition.

### Exponential decay and the time constant

The most important separable equation in engineering is

$$
\dot{y} = a\,y, \qquad y(0) = y_0,
$$

with $a$ a constant. In words: the rate of change is proportional to the amount you have. Separating gives $\int dy/y = \int a\,dt$, so $\ln|y| = at + C$. Raising $e$ to both sides [[turns the constant into the starting value|constant-to-start]]:

$$
y(t) = y_0\,e^{at}.
$$

If $a$ is positive, this is growth, like money with compound interest. If $a$ is negative, it is decay, like the cocoa's temperature gap closing. For decay it is standard to write $a = -1/\tau$, where $\tau$ (the Greek letter "tau") is a positive time called the **time constant**:

$$
\dot{y} = -\frac{y}{\tau} \quad\Longrightarrow\quad y(t) = y_0\,e^{-t/\tau}.
$$

The time constant has units of time, and it is the only time scale in the problem. Here is how much is left after each multiple of $\tau$:

| Time | $\tau$ | $2\tau$ | $3\tau$ | $4\tau$ | $5\tau$ |
| --- | --- | --- | --- | --- | --- |
| Fraction left, $e^{-t/\tau}$ | 36.8% | 13.5% | 5.0% | 1.8% | 0.7% |

Engineers round these into two rules of thumb. "After one time constant, 63% of the change is done." "After four time constants, you are within 2% — call it settled." The **half-life**, the time to lose half, is $\tau \ln 2 \approx 0.693\,\tau$.

::: example Reaction wheel spinning down
A reaction wheel with moment of inertia $I = 0.02\,\mathrm{kg\,m^2}$ (its resistance to being spun up) is switched off at $6000\,\mathrm{rpm}$. It coasts against bearing friction that makes a torque $-b\,\omega$, with $b = 2\times 10^{-5}\,\mathrm{N\,m\,s}$. Here $\omega$ ("omega") is the spin rate in radians per second.

**Set up.** Newton's law for rotation says inertia times angular acceleration equals torque: $I\dot{\omega} = -b\,\omega$. That is exponential decay, with time constant

$$
\tau = \frac{I}{b} = \frac{0.02}{2\times 10^{-5}} = 1000\,\mathrm{s}.
$$

**Convert the start speed.** One revolution is $2\pi$ radians and a minute is 60 seconds, so $\omega_0 = 6000 \times 2\pi/60 = 628\,\mathrm{rad/s}$.

**One hour later** ($3600\,\mathrm{s}$):

$$
\omega(3600) = 628\,e^{-3600/1000} = 628 \times 0.0273 = 17.2\,\mathrm{rad/s} \approx 164\,\mathrm{rpm}.
$$

**Sanity check.** An hour is 3.6 time constants, so a few percent should be left — and $17.2/628$ is about 2.7%. Good.

The wheel loses half its speed every $1000 \ln 2 = 693\,\mathrm{s}$, no matter how fast it happens to be spinning. That sameness at every scale is the signature of a linear equation. A wheel whose speed falls in a straight line instead is telling you its friction is not the viscous kind.
:::

### Nonlinear separable equations

Separable equations do not have to be linear, and the nonlinear ones behave differently. Take a body slowed only by air drag that grows with the square of its speed, $\dot{v} = -k v^2$ with $k > 0$. Separating, $\int dv/v^2 = -k\int dt$, so $-1/v = -kt + C$. With $v(0) = v_0$ the constant is $C = -1/v_0$, and

$$
v(t) = \frac{v_0}{1 + k v_0 t}.
$$

This is not exponential. It has no time constant, and the effective slowing rate, $k v_0$, depends on the starting speed. A fast body slows quickly; a slow one hardly slows at all. The speed creeps toward zero like $1/t$ rather than like $e^{-t/\tau}$.

Nonlinear equations can also do something linear ones never do: **blow up in finite time**. The equation $\dot{y} = y^2$ with $y(0) = 1$ separates to $-1/y = t + C$. The start gives $C = -1$, so $y = 1/(1 - t)$, which is infinite at $t = 1$. A solution is only promised to exist for a while near the start.

::: example The rocket equation as a separable ODE
A rocket of mass $m$ (changing as it burns) throws propellant backward at exhaust speed $v_e$ relative to itself. Momentum is conserved over a tiny interval, which gives $m\,dv = -v_e\,dm$. The mass change $dm$ is negative, so $dv$ is positive — the rocket speeds up. Separate and integrate from lift-off mass $m_0$ to burnout mass $m_f$:

$$
\frac{dv}{dm} = -\frac{v_e}{m} \quad\Longrightarrow\quad \int_{0}^{\Delta v} dv = -v_e \int_{m_0}^{m_f} \frac{dm}{m} \quad\Longrightarrow\quad \Delta v = v_e \ln\frac{m_0}{m_f}.
$$

Here the independent variable is mass, not time. The method does not care.

**Numbers for a Falcon 9 first stage.** Its sea-level **[[specific impulse|specific-impulse]]** is $I_{sp} \approx 282\,\mathrm{s}$, so the exhaust speed is $v_e = I_{sp}\,g_0 = 282 \times 9.80665 = 2765\,\mathrm{m/s}$. The vehicle lifts off at about $m_0 = 549{,}000\,\mathrm{kg}$ and the first stage burns about $411{,}000\,\mathrm{kg}$ of propellant, leaving $m_f = 138{,}000\,\mathrm{kg}$. The ideal speed gain is

$$
\Delta v = 2765 \times \ln\frac{549{,}000}{138{,}000} = 2765 \times 1.381 \approx 3820\,\mathrm{m/s}.
$$

**Sanity check.** The mass ratio is about 4, and $\ln 4 \approx 1.39$, so the gain should be a bit less than one and a half exhaust speeds. It is.

The real stage delivers less, because gravity and drag act during the burn. Those extra terms make the equation no longer separable, and a trajectory program integrates it numerically instead.
:::

## Linear equations and the integrating factor

The general first-order linear ODE is

$$
\dot{y} + p(t)\,y = q(t),
$$

where $p$ and $q$ are known functions. When $q = 0$ the equation is **homogeneous** ("nothing pushing it"), and it is separable. When $q \neq 0$ it is **forced**, and $q$ is the **input** or forcing term — the thing pushing the system.

Separation fails on the forced equation, because you cannot sort the $y$ on the left away from the $t$ on the right. The fix is a clever trick. Multiply the whole equation by a function $\mu(t)$ ("mu"), chosen so that the left side becomes the derivative of one single product. That function is the **[[integrating factor|integrating-factor-idea]]**.

Here is how to find it. We want $\mu\dot{y} + \mu p\,y$ to equal $\frac{d}{dt}(\mu y)$. By the product rule, $\frac{d}{dt}(\mu y) = \mu\dot{y} + \dot{\mu}\,y$. Comparing the two, we need $\dot{\mu} = p\,\mu$. That is itself separable, and its solution is

$$
\mu(t) = \exp\!\left(\int p(t)\,dt\right).
$$

(Here $\exp(x)$ means $e^x$.) Any constant of integration in the exponent only rescales $\mu$, and it cancels later, so leave it out. Now multiply the equation by $\mu$ and recognise the left side:

$$
\frac{d}{dt}\bigl(\mu y\bigr) = \mu\,q \quad\Longrightarrow\quad y(t) = \frac{1}{\mu(t)}\left(\int \mu(t)\,q(t)\,dt + C\right).
$$

That is a complete recipe. Compute $\mu$. Integrate $\mu q$. Divide by $\mu$. Fix $C$ from the initial condition. It works for any $p$ and $q$ you can integrate.

::: key
Integrating factor: for $\dot{y} + p(t)y = q(t)$, multiply by $\mu = \exp\bigl(\int p\,dt\bigr)$. Then $\frac{d}{dt}(\mu y) = \mu q$, and $y = \frac{1}{\mu}\bigl(\int \mu q\,dt + C\bigr)$.
:::

Try it on an equation whose coefficient changes with time: $\dot{y} + \frac{2}{t}\,y = t$ for $t > 0$.

- Here $p = 2/t$, so $\int p\,dt = 2\ln t$ and $\mu = e^{2\ln t} = t^2$.
- The equation becomes $\frac{d}{dt}(t^2 y) = t^2 \cdot t = t^3$.
- Integrate: $t^2 y = t^4/4 + C$.
- Divide by $t^2$: $y = t^2/4 + C/t^2$.

Check by differentiating: $\dot{y} = t/2 - 2C/t^3$, and $\dot{y} + 2y/t = t/2 - 2C/t^3 + t/2 + 2C/t^3 = t$. It works.

### The constant-coefficient case: the first-order lag

Think of a shower. You turn the knob to "warm", and the water does not jump to warm. It drifts there — fast at first, while the gap is big, then slower as it closes in. On a vehicle, $p$ is very often a constant, and this drifting behaviour is written

$$
\tau\,\dot{y} + y = u(t).
$$

Here $u(t)$ is the command or input and $\tau$ is the time constant. This is the **first-order lag**. Rearranged, it says $\dot{y} = (u - y)/\tau$: the output $y$ moves toward the command $u$ at a rate proportional to the gap.

It is the standard model for anything that follows a command with a delay but never overshoots: an electromechanical thrust-vector actuator, a valve, a temperature sensor, the smoothing filter on a rate gyro.

Divide by $\tau$ to get standard form. Then $p = 1/\tau$, so $\mu = e^{t/\tau}$, and the recipe gives

$$
y(t) = e^{-t/\tau}\left(\frac{1}{\tau}\int_0^t e^{t'/\tau}\,u(t')\,dt' + y(0)\right).
$$

(The $t'$, read "t prime", is only a name for the time variable inside the integral, so it does not clash with the $t$ at the upper limit.)

For a **step input** — the command jumps to a constant $U$ at $t = 0$ and stays there — the integral is $U\tau\,(e^{t/\tau} - 1)$, and the solution is

$$
y(t) = U + \bigl(y(0) - U\bigr)e^{-t/\tau}.
$$

Read it in words: the output starts at $y(0)$, and the gap to the final value $U$ shrinks exponentially with time constant $\tau$. Starting from rest, $y(t) = U(1 - e^{-t/\tau})$. That reaches 63.2% of the step after $\tau$ and 98.2% after $4\tau$.

The starting slope is $U/\tau$. If the output kept rising at that first rate, it would reach $U$ in exactly one time constant. That **[[tangent-line picture|tangent-line]]** is how engineers read $\tau$ off a recorded step response.

::: example A thrust-vector actuator answering a step
A TVC actuator is modelled as a first-order lag with $\tau = 0.05\,\mathrm{s}$. At $t = 0$ the autopilot commands a nozzle deflection of $2^\circ$, starting from a nozzle at rest at zero. Then $y(t) = 2(1 - e^{-t/0.05})$ degrees.

**After one, two and four time constants:**

$$
y(0.05) = 2(1 - e^{-1}) = 1.26^\circ, \qquad y(0.10) = 2(1 - e^{-2}) = 1.73^\circ, \qquad y(0.20) = 2(1 - e^{-4}) = 1.96^\circ.
$$

**Sanity check.** $1.26/2$ is 63%, exactly as one time constant should give.

The actuator is within 2% of the command after $4\tau = 0.2\,\mathrm{s}$. Now suppose the guidance loop sends a new command every $0.1\,\mathrm{s}$. That is only two time constants, so the nozzle gets only 86% of the way to each command before the next one arrives. The autopilot design has to allow for that lag. Later in this module the same actuator will appear as the transfer function $1/(\tau s + 1)$.
:::

### Ramp and sinusoidal inputs

Two more inputs matter, because real commands and disturbances are built from them.

A **ramp** is a command that climbs steadily, $u(t) = r\,t$, where $r$ is the rate. Starting from $y(0) = 0$, the integral is $\frac{r}{\tau}\int_0^t t' e^{t'/\tau}dt' = r\bigl[(t - \tau)e^{t/\tau} + \tau\bigr]$ (integrate by parts). Multiplying by $e^{-t/\tau}$:

$$
y(t) = r\,(t - \tau) + r\,\tau\,e^{-t/\tau}.
$$

Once the exponential dies away, the output is the ramp **[[delayed by one time constant|ramp-lag]]**. It trails the command by $r\tau$ in value, or by $\tau$ in time. A TVC actuator with $\tau = 0.05\,\mathrm{s}$ following a $10^\circ/\mathrm{s}$ slew sits $0.5^\circ$ behind the command, forever.

A **sinusoid** is a command that swings back and forth, $u(t) = A\cos\omega t$, with amplitude $A$ and angular frequency $\omega$ in radians per second. The algebra is cleaner in the form $\dot{y} + a y = a A \cos\omega t$, with $a = 1/\tau$. Rather than integrate $e^{at}\cos\omega t$ directly, guess that the long-run output is a sinusoid of the same frequency, $y_p = M \cos(\omega t - \phi)$, with unknown amplitude $M$ and delay angle $\phi$ ("phi"). Substitute it and match the $\cos\omega t$ terms and the $\sin\omega t$ terms separately. That gives

$$
M = \frac{aA}{\sqrt{a^2 + \omega^2}} = \frac{A}{\sqrt{1 + (\omega\tau)^2}}, \qquad \tan\phi = \frac{\omega}{a} = \omega\tau.
$$

The lag shrinks a sinusoid and delays it, and both effects grow with frequency. Take the actuator with $a = 20\,\mathrm{rad/s}$:

- at $\omega = 2\,\mathrm{rad/s}$: amplitude ratio $0.995$, phase lag $5.7^\circ$ — essentially perfect tracking;
- at $\omega = 20\,\mathrm{rad/s}$: ratio $0.707$, lag $45^\circ$;
- at $\omega = 60\,\mathrm{rad/s}$: ratio $0.316$, lag $71.6^\circ$.

The frequency $\omega = 1/\tau$, where the ratio is $1/\sqrt{2}$ and the lag is $45^\circ$, is the **[[corner frequency|corner-frequency]]** — the actuator's **bandwidth**, the fastest wiggle it can follow well. You have met your first frequency response. The second-order version arrives in lesson 5.

## Transient plus steady state

Look back at the three forced solutions. Each is a sum of two parts.

- One part depends on the initial condition and dies away: $(y(0) - U)e^{-t/\tau}$, or $r\tau e^{-t/\tau}$, or a decaying piece we did not write out for the sinusoid. This is the **transient** (also called the homogeneous or natural response).
- The other part is set by the input and stays: $U$, or $r(t - \tau)$, or $M\cos(\omega t - \phi)$. This is the **steady-state** response (also called the particular or forced response).

This split is not luck. It happens for every linear equation $\dot{y} + p y = q$. Suppose $y_p$ is any one solution (the **particular** solution) and $y_h$ solves the homogeneous equation $\dot{y} + py = 0$. Then $y_p + y_h$ is also a solution, because the equation is linear:

$$
(\dot{y}_p + \dot{y}_h) + p(y_p + y_h) = q + 0.
$$

Going the other way, the difference of any two solutions solves the homogeneous equation. So the general solution is

$$
y = y_p + C\,y_h,
$$

one particular solution plus the whole family of homogeneous solutions, with one free constant to match one initial condition. The homogeneous part, $e^{-t/\tau}$, depends only on the system. The particular part depends on the input. Every later lesson uses this structure, and the moral is worth saying out loud: **the system decides how it forgets; the input decides where it ends up.**

::: warning Fix the constant last
A common slip is to fix the constant $C$ from the initial condition *before* adding the particular solution. The initial condition applies to the whole solution $y = y_p + Cy_h$, so $C = y(0) - y_p(0)$. For the step response, $C = y(0) - U$, not $y(0)$.
:::

## Equilibria and the sign of the coefficient

Picture a marble. Put it at the bottom of a bowl and nudge it: it rolls back. Balance it on top of an upside-down bowl and nudge it: it rolls away. Both spots are places where the marble could sit still. Only one of them is a place it *returns to*.

Take a constant input and ask where $\dot{y} = 0$. The equation $\dot{y} = a y + b$ has a single **equilibrium**, a resting value, at $y_e = -b/a$. Its solution is

$$
y = y_e + (y_0 - y_e)e^{at},
$$

so whether solutions approach the equilibrium or flee from it depends only on the sign of $a$:

- $a < 0$: every solution closes in on $y_e$. The equilibrium is **stable** — the bottom of the bowl.
- $a > 0$: every solution except the one starting exactly at $y_e$ runs away exponentially. The equilibrium is **unstable** — the top of the upside-down bowl.
- $a = 0$: there is no pull either way. Every value is a resting point, and each is only neutrally stable, like a marble on a flat table.

This one-dimensional picture is the seed of the whole theory of stability. The number $a$ will later be called a **pole**, and "$a < 0$" will become "the pole lies in the left half of the complex plane".

The direction field makes the sign visible. When $a < 0$, the arrows above $y_e$ point down and the arrows below point up, funnelling every curve onto the equilibrium. When $a > 0$ they point away. The speed of approach is set by $|a|$ — a time constant of $1/|a|$ — and nothing else.

A slowly drifting gyro error, called a **bias**, is often modelled exactly this way: $\dot{b} = -b/\tau_c + w(t)$. Here $\tau_c$ is a correlation time of an hour or more, and $w$ is a random push. Left alone, the bias relaxes toward zero over hours, while the random push keeps nudging it. That is the **[[first-order Gauss–Markov process|gauss-markov]]** you will meet again when you study navigation filters.

::: key
Exponential response: $\dot{y} = ay$ gives $y = y_0e^{at}$. With $a = -1/\tau$ the solution decays with time constant $\tau$; 63.2% of a step is complete after $\tau$, 98.2% after $4\tau$. The equilibrium of $\dot{y} = ay + b$ is stable when $a < 0$, unstable when $a > 0$.
:::

::: note Reading coefficients as rates
In $\tau\dot{y} + y = u$, the term $\tau\dot{y}$ must carry the same units as $y$. So $\tau$ is in seconds and $1/\tau$ is in $\mathrm{s^{-1}}$ ("per second"). When you see $\dot{y} + 20y = 20u$, the 20 is $1/\tau$ in $\mathrm{s^{-1}}$, and the time constant is $50\,\mathrm{ms}$. The habit of reading coefficients as rates — in $\mathrm{s^{-1}}$ or $\mathrm{rad/s}$ — pays off in the next lessons, when you read natural frequencies straight off characteristic equations.
:::

## Check yourself

::: check
What is the integrating factor for $\dot{y} + p(t)y = q(t)$, and why does multiplying by it help?
:::

::: answer
$\mu(t) = \exp\bigl(\int p\,dt\bigr)$. Because $\dot{\mu} = p\mu$, the product rule gives

$$
\frac{d}{dt}(\mu y) = \mu\dot{y} + p\mu y = \mu(\dot{y} + py) = \mu q.
$$

The left side has collapsed into a single derivative, so one integration finishes the job: $\mu y = \int\mu q\,dt + C$.
:::

::: check
Solve $\dot{y} = -3y + 6$ with $y(0) = 0$. What is the time constant, and when is the response within 2% of its final value?
:::

::: answer
Rewrite it as $\dot{y} + 3y = 6$. Then $p = 3$ and $\mu = e^{3t}$, so $\frac{d}{dt}(e^{3t}y) = 6e^{3t}$. Integrating, $e^{3t}y = 2e^{3t} + C$, so $y = 2 + Ce^{-3t}$. The start $y(0) = 0$ gives $C = -2$, so

$$
y = 2(1 - e^{-3t}).
$$

The time constant is $\tau = 1/3\,\mathrm{s}$. The response is within 2% of its final value, 2, after $4\tau = 1.33\,\mathrm{s}$.

Check: the equilibrium of $\dot{y} = -3y + 6$ is $y_e = 6/3 = 2$, and the coefficient $-3$ is negative, so it is stable — matching the answer.
:::

::: check
A first-order actuator with $\tau = 0.1\,\mathrm{s}$ tracks a ramp command of $5^\circ/\mathrm{s}$. After the transient has died, how far behind the command is the actuator, in degrees and in seconds?
:::

::: answer
The steady-state ramp response is $y = r(t - \tau)$. So the actuator trails by $\tau = 0.1\,\mathrm{s}$ in time, which at $r = 5^\circ/\mathrm{s}$ is $r\tau = 0.5^\circ$ in value. The gap is constant: it does not grow with time, but it never closes either.
:::

::: check
Solve $\dot{y} + \frac{1}{t}\,y = 1$ for $t > 0$ with $y(1) = 0$.
:::

::: answer
Here $p = 1/t$, so $\int p\,dt = \ln t$ and $\mu = t$. Then $\frac{d}{dt}(ty) = t$, so $ty = t^2/2 + C$ and $y = t/2 + C/t$. The condition $y(1) = 0$ gives $1/2 + C = 0$, so $C = -1/2$ and

$$
y = \frac{t}{2} - \frac{1}{2t}.
$$

Verify: $\dot{y} = 1/2 + 1/(2t^2)$ and $y/t = 1/2 - 1/(2t^2)$. Their sum is 1, as the equation demands.
:::

::: check
The equation $\dot{y} = y^2$ with $y(0) = 1$ is separable. Solve it and explain what happens at $t = 1$. Could a linear first-order equation with constant coefficients do the same?
:::

::: answer
Separating, $\int dy/y^2 = \int dt$ gives $-1/y = t + C$. From $y(0) = 1$, $C = -1$, so $y = 1/(1 - t)$. The solution grows without bound as $t$ approaches 1, so it exists only for $0 \le t < 1$.

No linear constant-coefficient equation can do this. Its solutions have the form $y_p + Ce^{at}$, which is finite at every finite time. They may grow exponentially, but they never reach infinity in a finite time.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{y} = f(t, y)$ | General first-order ODE: a rule for the slope at each point |
| $\dot{y} = g(t)h(y)$ | Separable; solve $\int dy/h = \int g\,dt$ |
| $\dot{y} = ay$, $y = y_0e^{at}$ | Exponential growth ($a > 0$) or decay ($a < 0$) |
| $\tau = -1/a$ | Time constant; 63.2% done after $\tau$, 98.2% after $4\tau$, half-life $0.693\tau$ |
| $\dot{y} + p(t)y = q(t)$ | Linear first-order; integrating factor $\mu = e^{\int p\,dt}$ |
| $\tau\dot{y} + y = u$ | First-order lag (actuator model); step response $U + (y_0 - U)e^{-t/\tau}$ |
| Ramp response | Trails the command by $\tau$ in time, $r\tau$ in value |
| Sinusoid response | Amplitude $A/\sqrt{1 + (\omega\tau)^2}$, phase lag $\arctan\omega\tau$; corner at $\omega = 1/\tau$ |
| $y = y_p + Cy_h$ | Particular (steady-state) plus homogeneous (transient) |
| $\dot{y} = ay + b$ | Equilibrium $y_e = -b/a$, stable if and only if $a < 0$ |

Next lesson adds one more derivative. Second-order equations can swing back and forth, and the characteristic equation — whose roots, the poles, organise everything that follows — is the key to them.

::: context tvc-actuator Steering by swivelling the engine
A rocket has no rudder that works in empty space. Instead it tilts its engine a few degrees, so the thrust pushes slightly sideways and turns the vehicle. This is **thrust vector control** (TVC). The engine is mounted on a joint called a **gimbal**, and two actuators — powerful electric or hydraulic pistons — push it around. Because the actuator cannot move instantly, its response to a command is the first-order lag you meet in this lesson.
:::

::: context reaction-wheel A flywheel for turning a spacecraft
A reaction wheel is a heavy disc spun by an electric motor inside a satellite. Speed the wheel up one way, and the spacecraft turns the other way — the same reason a spinning office chair turns when you swing your arms. Wheels spin at thousands of rpm for years, so bearing friction matters: it slowly drains their speed, and the control system must make up for it.
:::

::: context ordinary-partial Ordinary versus partial
"Ordinary" does not mean "easy". It means the unknown depends on only one variable, so there is only one kind of derivative. When the unknown depends on several variables at once — the temperature at every point of a heat shield *and* every moment of reentry — the derivatives are **partial**, and the equation is a partial differential equation (PDE). Nearly all of guidance and control runs on ordinary ones: the state of a vehicle changes with time alone.
:::

::: context direction-field A field of little slopes
Here is the direction field of $\dot{y} = 1 - y$. Each grey dash is tilted to the slope the rule gives at that point. Above the line $y = 1$ the slope is negative, so the dashes tilt down; below it they tilt up. The three coloured curves start at different values and follow the dashes — each is one solution, and none crosses another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="175" x2="340" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="175" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
<g stroke="#6c7a93" stroke-width="1.3"><line x1="52.6" y1="165.6" x2="64.9" y2="152.4"/><line x1="51.3" y1="135.3" x2="66.2" y2="125.1"/><line x1="50.1" y1="104.0" x2="67.4" y2="98.8"/><line x1="49.8" y1="71.8" x2="67.7" y2="73.4"/><line x1="50.6" y1="40.0" x2="66.9" y2="47.6"/><line x1="51.9" y1="9.2" x2="65.6" y2="20.8"/><line x1="86.3" y1="165.6" x2="98.7" y2="152.4"/><line x1="85.1" y1="135.3" x2="99.9" y2="125.1"/><line x1="83.9" y1="104.0" x2="101.1" y2="98.8"/><line x1="83.5" y1="71.8" x2="101.5" y2="73.4"/><line x1="84.4" y1="40.0" x2="100.6" y2="47.6"/><line x1="85.7" y1="9.2" x2="99.3" y2="20.8"/><line x1="120.1" y1="165.6" x2="132.4" y2="152.4"/><line x1="118.8" y1="135.3" x2="133.7" y2="125.1"/><line x1="117.6" y1="104.0" x2="134.9" y2="98.8"/><line x1="117.3" y1="71.8" x2="135.2" y2="73.4"/><line x1="118.1" y1="40.0" x2="134.4" y2="47.6"/><line x1="119.4" y1="9.2" x2="133.1" y2="20.8"/><line x1="153.8" y1="165.6" x2="166.2" y2="152.4"/><line x1="152.6" y1="135.3" x2="167.4" y2="125.1"/><line x1="151.4" y1="104.0" x2="168.6" y2="98.8"/><line x1="151.0" y1="71.8" x2="169.0" y2="73.4"/><line x1="151.9" y1="40.0" x2="168.1" y2="47.6"/><line x1="153.2" y1="9.2" x2="166.8" y2="20.8"/><line x1="187.6" y1="165.6" x2="199.9" y2="152.4"/><line x1="186.3" y1="135.3" x2="201.2" y2="125.1"/><line x1="185.1" y1="104.0" x2="202.4" y2="98.8"/><line x1="184.8" y1="71.8" x2="202.7" y2="73.4"/><line x1="185.6" y1="40.0" x2="201.9" y2="47.6"/><line x1="186.9" y1="9.2" x2="200.6" y2="20.8"/><line x1="221.3" y1="165.6" x2="233.7" y2="152.4"/><line x1="220.1" y1="135.3" x2="234.9" y2="125.1"/><line x1="218.9" y1="104.0" x2="236.1" y2="98.8"/><line x1="218.5" y1="71.8" x2="236.5" y2="73.4"/><line x1="219.4" y1="40.0" x2="235.6" y2="47.6"/><line x1="220.7" y1="9.2" x2="234.3" y2="20.8"/><line x1="255.1" y1="165.6" x2="267.4" y2="152.4"/><line x1="253.8" y1="135.3" x2="268.7" y2="125.1"/><line x1="252.6" y1="104.0" x2="269.9" y2="98.8"/><line x1="252.3" y1="71.8" x2="270.2" y2="73.4"/><line x1="253.1" y1="40.0" x2="269.4" y2="47.6"/><line x1="254.4" y1="9.2" x2="268.1" y2="20.8"/><line x1="288.8" y1="165.6" x2="301.2" y2="152.4"/><line x1="287.6" y1="135.3" x2="302.4" y2="125.1"/><line x1="286.4" y1="104.0" x2="303.6" y2="98.8"/><line x1="286.0" y1="71.8" x2="304.0" y2="73.4"/><line x1="286.9" y1="40.0" x2="303.1" y2="47.6"/><line x1="288.2" y1="9.2" x2="301.8" y2="20.8"/><line x1="322.6" y1="165.6" x2="334.9" y2="152.4"/><line x1="321.3" y1="135.3" x2="336.2" y2="125.1"/><line x1="320.1" y1="104.0" x2="337.4" y2="98.8"/><line x1="319.8" y1="71.8" x2="337.7" y2="73.4"/><line x1="320.6" y1="40.0" x2="336.9" y2="47.6"/><line x1="321.9" y1="9.2" x2="335.6" y2="20.8"/></g>
<path d="M40.0,15.0 L43.8,18.1 L47.5,21.1 L51.2,23.9 L55.0,26.6 L58.8,29.2 L62.5,31.6 L66.2,33.9 L70.0,36.1 L73.8,38.2 L77.5,40.2 L81.2,42.1 L85.0,43.9 L88.8,45.6 L92.5,47.2 L96.2,48.8 L100.0,50.2 L103.8,51.6 L107.5,53.0 L111.2,54.2 L115.0,55.5 L118.8,56.6 L122.5,57.7 L126.3,58.7 L130.0,59.7 L133.8,60.7 L137.5,61.6 L141.2,62.4 L145.0,63.2 L148.8,64.0 L152.5,64.7 L156.2,65.4 L160.0,66.1 L163.8,66.7 L167.5,67.3 L171.2,67.9 L175.0,68.4 L178.8,68.9 L182.5,69.4 L186.2,69.9 L190.0,70.3 L193.8,70.8 L197.5,71.2 L201.2,71.5 L205.0,71.9 L208.8,72.3 L212.5,72.6 L216.2,72.9 L220.0,73.2 L223.8,73.5 L227.5,73.7 L231.3,74.0 L235.0,74.2 L238.8,74.5 L242.5,74.7 L246.2,74.9 L250.0,75.1 L253.8,75.3 L257.5,75.5 L261.2,75.7 L265.0,75.8 L268.8,76.0 L272.5,76.1 L276.2,76.3 L280.0,76.4 L283.8,76.5 L287.5,76.6 L291.2,76.8 L295.0,76.9 L298.8,77.0 L302.5,77.1 L306.2,77.2 L310.0,77.3 L313.8,77.3 L317.5,77.4 L321.2,77.5 L325.0,77.6 L328.8,77.6 L332.5,77.7 L336.2,77.8 L340.0,77.8" fill="none" stroke="#1d6fd1" stroke-width="2"/>
<path d="M40.0,175.0 L43.8,170.3 L47.5,165.9 L51.2,161.6 L55.0,157.6 L58.8,153.8 L62.5,150.1 L66.2,146.7 L70.0,143.4 L73.8,140.2 L77.5,137.2 L81.2,134.4 L85.0,131.7 L88.8,129.1 L92.5,126.7 L96.2,124.3 L100.0,122.1 L103.8,120.0 L107.5,118.0 L111.2,116.1 L115.0,114.3 L118.8,112.6 L122.5,111.0 L126.3,109.4 L130.0,107.9 L133.8,106.5 L137.5,105.2 L141.2,103.9 L145.0,102.7 L148.8,101.5 L152.5,100.4 L156.2,99.4 L160.0,98.4 L163.8,97.4 L167.5,96.5 L171.2,95.7 L175.0,94.9 L178.8,94.1 L182.5,93.4 L186.2,92.7 L190.0,92.0 L193.8,91.4 L197.5,90.8 L201.2,90.2 L205.0,89.6 L208.8,89.1 L212.5,88.6 L216.2,88.2 L220.0,87.7 L223.8,87.3 L227.5,86.9 L231.3,86.5 L235.0,86.1 L238.8,85.8 L242.5,85.5 L246.2,85.1 L250.0,84.8 L253.8,84.6 L257.5,84.3 L261.2,84.0 L265.0,83.8 L268.8,83.5 L272.5,83.3 L276.2,83.1 L280.0,82.9 L283.8,82.7 L287.5,82.5 L291.2,82.4 L295.0,82.2 L298.8,82.0 L302.5,81.9 L306.2,81.8 L310.0,81.6 L313.8,81.5 L317.5,81.4 L321.2,81.3 L325.0,81.1 L328.8,81.0 L332.5,80.9 L336.2,80.8 L340.0,80.8" fill="none" stroke="#b4232c" stroke-width="2"/>
<path d="M40.0,143.0 L43.8,139.9 L47.5,136.9 L51.2,134.1 L55.0,131.4 L58.8,128.8 L62.5,126.4 L66.2,124.1 L70.0,121.9 L73.8,119.8 L77.5,117.8 L81.2,115.9 L85.0,114.1 L88.8,112.4 L92.5,110.8 L96.2,109.2 L100.0,107.8 L103.8,106.4 L107.5,105.0 L111.2,103.8 L115.0,102.5 L118.8,101.4 L122.5,100.3 L126.3,99.3 L130.0,98.3 L133.8,97.3 L137.5,96.4 L141.2,95.6 L145.0,94.8 L148.8,94.0 L152.5,93.3 L156.2,92.6 L160.0,91.9 L163.8,91.3 L167.5,90.7 L171.2,90.1 L175.0,89.6 L178.8,89.1 L182.5,88.6 L186.2,88.1 L190.0,87.7 L193.8,87.2 L197.5,86.8 L201.2,86.5 L205.0,86.1 L208.8,85.7 L212.5,85.4 L216.2,85.1 L220.0,84.8 L223.8,84.5 L227.5,84.3 L231.3,84.0 L235.0,83.8 L238.8,83.5 L242.5,83.3 L246.2,83.1 L250.0,82.9 L253.8,82.7 L257.5,82.5 L261.2,82.3 L265.0,82.2 L268.8,82.0 L272.5,81.9 L276.2,81.7 L280.0,81.6 L283.8,81.5 L287.5,81.4 L291.2,81.2 L295.0,81.1 L298.8,81.0 L302.5,80.9 L306.2,80.8 L310.0,80.7 L313.8,80.7 L317.5,80.6 L321.2,80.5 L325.0,80.4 L328.8,80.4 L332.5,80.3 L336.2,80.2 L340.0,80.2" fill="none" stroke="#1d6fd1" stroke-width="2"/>
<line x1="40" y1="79.0" x2="340" y2="79.0" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
<text x="34" y="83.0" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
<text x="34" y="147.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<text x="34" y="19.0" font-size="11" text-anchor="end" fill="#1f2a44">2</text>
<text x="340" y="192" font-size="11" text-anchor="end" fill="#1f2a44">time t</text>
<text x="44" y="192" font-size="11" fill="#1f2a44">0</text>
<text x="336.0" y="71.0" font-size="11" text-anchor="end" fill="#1f2a44">every curve funnels to y = 1</text>
</svg>
```
:::

::: context superposition Adding solutions
For a linear equation, if one input gives one response and a second input gives another, then both inputs together give the sum of the two responses. Double an input and the response doubles. This is **superposition**. It is why engineers can study a system's reaction to one simple input — a step, a sinusoid, a sharp kick — and then build its reaction to any messy real input out of those pieces. Lesson 7 does exactly that with convolution.
:::

::: context constant-to-start Where the constant goes
Start from $\ln|y| = at + C$ and raise $e$ to both sides: $|y| = e^{C}e^{at}$. The number $e^{C}$ is some positive constant, and dropping the absolute value lets it be negative too, so $y = Ke^{at}$ for some constant $K$. Put $t = 0$ in: $y(0) = Ke^0 = K$. So the mysterious constant is the starting value, $y_0$.
:::

::: context specific-impulse What "specific impulse" measures
Specific impulse, $I_{sp}$, is a rocket engine's fuel economy. It is measured in seconds: how many seconds one kilogram of propellant can hold up its own weight, $9.80665\,\mathrm{N}$, as thrust. Multiplying by $g_0 = 9.80665\,\mathrm{m/s^2}$ turns it into the effective exhaust speed. A kerosene engine at sea level gets about $280\,\mathrm{s}$; a hydrogen engine in vacuum gets about $450\,\mathrm{s}$.
:::

::: context integrating-factor-idea The product rule, run backwards
The product rule says $\frac{d}{dt}(\mu y) = \mu\dot{y} + \dot{\mu}y$. The left side of $\mu(\dot{y} + py)$ is $\mu\dot{y} + \mu p y$. These match exactly when $\dot{\mu} = p\mu$. So the integrating factor is the one multiplier that makes the left side "look like" the result of a product rule — and anything that is a derivative can be undone by one integration. The name says what it does: it makes the equation integrable.
:::

::: context tangent-line Reading a time constant off a plot
Draw the step response and lay a ruler along its very first slope. The ruler reaches the final value $U$ at exactly $t = \tau$ — the same moment the real curve has covered 63.2% of the way. By $4\tau$ the curve is at 98.2%. Test engineers do this with a recorded actuator step to measure its time constant.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="33.6" x2="340" y2="33.6" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
<line x1="40.0" y1="170.0" x2="100.0" y2="33.6" stroke="#f2b880" stroke-width="2"/>
<path d="M40.0,170.0 L43.0,163.3 L46.0,157.0 L49.0,151.0 L52.0,145.3 L55.0,139.8 L58.0,134.7 L61.0,129.7 L64.0,125.0 L67.0,120.6 L70.0,116.3 L73.0,112.3 L76.0,108.5 L79.0,104.8 L82.0,101.4 L85.0,98.0 L88.0,94.9 L91.0,91.9 L94.0,89.1 L97.0,86.4 L100.0,83.8 L103.0,81.4 L106.0,79.0 L109.0,76.8 L112.0,74.7 L115.0,72.7 L118.0,70.8 L121.0,69.0 L124.0,67.3 L127.0,65.6 L130.0,64.1 L133.0,62.6 L136.0,61.2 L139.0,59.8 L142.0,58.5 L145.0,57.3 L148.0,56.2 L151.0,55.1 L154.0,54.0 L157.0,53.0 L160.0,52.1 L163.0,51.2 L166.0,50.3 L169.0,49.5 L172.0,48.7 L175.0,48.0 L178.0,47.3 L181.0,46.6 L184.0,46.0 L187.0,45.4 L190.0,44.8 L193.0,44.3 L196.0,43.8 L199.0,43.3 L202.0,42.8 L205.0,42.4 L208.0,41.9 L211.0,41.5 L214.0,41.1 L217.0,40.8 L220.0,40.4 L223.0,40.1 L226.0,39.8 L229.0,39.5 L232.0,39.2 L235.0,38.9 L238.0,38.7 L241.0,38.4 L244.0,38.2 L247.0,38.0 L250.0,37.8 L253.0,37.6 L256.0,37.4 L259.0,37.2 L262.0,37.0 L265.0,36.8 L268.0,36.7 L271.0,36.5 L274.0,36.4 L277.0,36.3 L280.0,36.1 L283.0,36.0 L286.0,35.9 L289.0,35.8 L292.0,35.7 L295.0,35.6 L298.0,35.5 L301.0,35.4 L304.0,35.3 L307.0,35.2 L310.0,35.2 L313.0,35.1 L316.0,35.0 L319.0,34.9 L322.0,34.9 L325.0,34.8 L328.0,34.8 L331.0,34.7 L334.0,34.7 L337.0,34.6 L340.0,34.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<line x1="100.0" y1="170" x2="100.0" y2="83.8" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
<circle cx="100.0" cy="83.8" r="3.5" fill="#b4232c"/>
<line x1="280.0" y1="170" x2="280.0" y2="36.1" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
<circle cx="280.0" cy="36.1" r="3.5" fill="#b4232c"/>
<text x="106.0" y="97.8" font-size="11" fill="#b4232c">63.2%</text>
<text x="280.0" y="52.1" font-size="11" text-anchor="middle" fill="#b4232c">98.2%</text>
<text x="100.0" y="185" font-size="11" text-anchor="middle" fill="#1f2a44">τ</text>
<text x="280.0" y="185" font-size="11" text-anchor="middle" fill="#1f2a44">4τ</text>
<text x="34" y="37.6" font-size="11" text-anchor="end" fill="#1f2a44">U</text>
<text x="34" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<text x="108.0" y="27.6" font-size="11" fill="#1f2a44">initial slope reaches U at τ</text>
<text x="340" y="185" font-size="11" text-anchor="end" fill="#1f2a44">t</text>
</svg>
```
:::

::: context ramp-lag Always one time constant late
When the command climbs steadily, the lag's output ends up climbing at the same rate, but offset. Measured sideways, it is $\tau$ late; measured up and down, it is $r\tau$ short. The gap never closes, because the output only moves when there is a gap to chase.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="170" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40.0" y1="170.0" x2="340.0" y2="15.0" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
<path d="M40.0,170.0 L43.0,170.0 L46.0,169.9 L49.0,169.7 L52.0,169.4 L55.0,169.1 L58.0,168.7 L61.0,168.3 L64.0,167.8 L67.0,167.3 L70.0,166.7 L73.0,166.1 L76.0,165.4 L79.0,164.7 L82.0,163.9 L85.0,163.1 L88.0,162.3 L91.0,161.4 L94.0,160.5 L97.0,159.6 L100.0,158.6 L103.0,157.6 L106.0,156.6 L109.0,155.5 L112.0,154.5 L115.0,153.4 L118.0,152.3 L121.0,151.1 L124.0,150.0 L127.0,148.8 L130.0,147.6 L133.0,146.4 L136.0,145.1 L139.0,143.9 L142.0,142.6 L145.0,141.4 L148.0,140.1 L151.0,138.8 L154.0,137.5 L157.0,136.1 L160.0,134.8 L163.0,133.5 L166.0,132.1 L169.0,130.7 L172.0,129.4 L175.0,128.0 L178.0,126.6 L181.0,125.2 L184.0,123.8 L187.0,122.4 L190.0,121.0 L193.0,119.5 L196.0,118.1 L199.0,116.7 L202.0,115.2 L205.0,113.8 L208.0,112.3 L211.0,110.9 L214.0,109.4 L217.0,107.9 L220.0,106.5 L223.0,105.0 L226.0,103.5 L229.0,102.0 L232.0,100.5 L235.0,99.0 L238.0,97.6 L241.0,96.1 L244.0,94.6 L247.0,93.1 L250.0,91.6 L253.0,90.1 L256.0,88.6 L259.0,87.0 L262.0,85.5 L265.0,84.0 L268.0,82.5 L271.0,81.0 L274.0,79.5 L277.0,78.0 L280.0,76.4 L283.0,74.9 L286.0,73.4 L289.0,71.9 L292.0,70.3 L295.0,68.8 L298.0,67.3 L301.0,65.7 L304.0,64.2 L307.0,62.7 L310.0,61.2 L313.0,59.6 L316.0,58.1 L319.0,56.6 L322.0,55.0 L325.0,53.5 L328.0,51.9 L331.0,50.4 L334.0,48.9 L337.0,47.3 L340.0,45.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<line x1="280.0" y1="46.0" x2="280.0" y2="76.4" stroke="#b4232c" stroke-width="2"/>
<text x="286.0" y="65.2" font-size="11" fill="#b4232c">rτ behind</text>
<line x1="221.1" y1="76.4" x2="280.0" y2="76.4" stroke="#f2b880" stroke-width="2"/>
<text x="250.0" y="70.4" font-size="11" text-anchor="middle" fill="#1f2a44">τ late</text>
<text x="112.0" y="95.6" font-size="11" fill="#6c7a93">command r t</text>
<text x="178.0" y="151.4" font-size="11" fill="#1d6fd1">actuator output</text>
<text x="340" y="185" font-size="11" text-anchor="end" fill="#1f2a44">t</text>
</svg>
```
:::

::: context corner-frequency Why it is called a corner
Plot the amplitude ratio against frequency on logarithmic scales and the curve looks like two straight lines: flat at 1 for slow wiggles, then sloping down steadily for fast ones. They meet at a "corner" at $\omega = 1/\tau$. For the actuator with $\tau = 0.05\,\mathrm{s}$ the corner is $20\,\mathrm{rad/s}$, about $3.2\,\mathrm{Hz}$. An autopilot designer keeps the control loop well slower than this, so the actuator can keep up.
:::

::: context gauss-markov A random walk on a leash
A gyro's error does not stay fixed; it wanders. Modelling it as $\dot{b} = -b/\tau_c + w$ gives the wandering a leash: random pushes $w$ move the bias around, and the $-b/\tau_c$ term keeps pulling it back toward zero. The correlation time $\tau_c$ says how long the bias "remembers" where it was. Navigation filters, such as the Kalman filter, carry exactly this equation inside them to estimate and remove gyro bias in flight.
:::
