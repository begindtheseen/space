---
id: l11-separable-first-order-odes
title: Separable first-order ODEs and the rocket equation
minutes: 26
covers:
  - separable first-order ODEs
---

Every lesson so far has started from a known function and asked about its derivative or its integral. Physics rarely hands you the function. It hands you a law — a relation between a quantity and its rate of change — and asks you to find the function that obeys it. A rocket's velocity changes at a rate set by its thrust and its current mass, and the mass is itself changing. A rate sensor's output moves toward its input at a rate proportional to the gap. A re-entering capsule decelerates at a rate proportional to the square of its speed. Atmospheric pressure falls with altitude at a rate proportional to the pressure itself. Each of these is a **differential equation**, and solving it means recovering velocity, output, speed or pressure as a function of time or altitude.

This lesson treats the simplest and most useful class, the **separable first-order equations**, in which the variables can be sorted onto opposite sides of the equals sign and each side integrated with the tools of the last three lessons. It is a modest technique, and it is enough to derive the ideal rocket equation from momentum conservation, to define the time constant that every control engineer reads off a step response, to solve the drag deceleration of a ballistic body, and to derive the exponential atmosphere that earlier lessons assumed. The full theory of differential equations is its own module; this is the part of it that a single integration can reach.

## What a differential equation asks

An **ordinary differential equation** (ODE) relates an unknown function of one variable to its derivatives. Its **order** is the highest derivative present. $\dot x = -x/\tau$ is first order; $\ddot\theta = -(g_0/\ell)\sin\theta$ is second order. A **solution** is a function that satisfies the equation identically on an interval — not a number, a function. Because integrating introduces a constant, a first-order equation has a one-parameter family of solutions, the **general solution**, and pinning down one member needs one extra fact, usually the value at the start: $x(0) = x_0$. Equation plus initial condition is an **initial value problem**, and for the equations in this lesson it has exactly one solution.

Notice that the second-order pendulum equation needs two conditions, angle and rate; and that the state-space form $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ in which every GNC model is written is a system of first-order equations. Everything a propagator does is the numerical solution of an initial value problem; this lesson is about the few cases where the solution can be written down instead.

## Separable equations

A first-order equation is **separable** when it can be written as a product of a function of the independent variable and a function of the dependent one:

$$
\frac{dy}{dx} = g(x)\,h(y).
$$

The method is to divide by $h(y)$, multiply by $dx$, and integrate each side with respect to its own variable:

$$
\frac{dy}{h(y)} = g(x)\,dx \quad\Longrightarrow\quad \int\frac{dy}{h(y)} = \int g(x)\,dx + C.
$$

This looks like algebra with differentials, and it is worth seeing why it is legitimate. Let $H(y)$ be an antiderivative of $1/h(y)$ and $G(x)$ one of $g(x)$. If $y(x)$ solves the equation, then by the chain rule

$$
\frac{d}{dx}H\big(y(x)\big) = H'(y)\,\frac{dy}{dx} = \frac{1}{h(y)}\cdot g(x)\,h(y) = g(x) = G'(x),
$$

so $H(y(x))$ and $G(x)$ have the same derivative and differ by a constant: $H(y) = G(x) + C$. That is exactly what "integrate both sides" produced. The differential notation $dy = y'\,dx$ from the linearisation lesson is what makes the shorthand honest.

Two cautions belong to the method itself. Dividing by $h(y)$ assumes $h(y) \ne 0$; any value $y^*$ with $h(y^*) = 0$ gives a constant solution $y \equiv y^*$, an **equilibrium**, which the division silently discards and which you must add back by inspection. And the result $H(y) = G(x) + C$ is usually implicit; solving for $y$ may need a logarithm or a root, and the sign or branch is fixed by the initial condition.

::: key
To solve a separable first-order ODE $\dfrac{dy}{dx} = g(x)\,h(y)$: separate to $\dfrac{dy}{h(y)} = g(x)\,dx$, integrate both sides, then apply the initial condition to fix the constant. Check for equilibrium solutions $h(y) = 0$ lost in the division. The rocket equation is exactly this move.
:::

## Exponential decay and the time constant

The most important separable equation in engineering is

$$
\dot x = -\frac{x}{\tau}, \qquad x(0) = x_0,
$$

with $\tau > 0$ a constant with units of time. Separate and integrate: $\dfrac{dx}{x} = -\dfrac{dt}{\tau}$ gives $\ln|x| = -\dfrac{t}{\tau} + C$, so $|x| = e^C e^{-t/\tau}$. The initial condition fixes $e^C = |x_0|$, and since $x$ cannot cross zero (the equilibrium $x \equiv 0$ is itself a solution and solutions do not cross), $x$ keeps the sign of $x_0$:

$$
x(t) = x_0\,e^{-t/\tau}.
$$

$\tau$ is the **time constant**. It is the time in which $x$ falls to $e^{-1} = 36.8\%$ of its value — any value, since the ratio $x(t + \tau)/x(t) = e^{-1}$ is the same at every $t$. It is also where the initial tangent line reaches zero: the slope at $t = 0$ is $-x_0/\tau$, and the line $x_0(1 - t/\tau)$ hits the axis at $t = \tau$. Cumulative decay:

| Elapsed | Remaining $e^{-t/\tau}$ | Decayed |
| --- | --- | --- |
| $1\tau$ | $0.368$ | $63.2\%$ |
| $2\tau$ | $0.135$ | $86.5\%$ |
| $3\tau$ | $0.050$ | $95.0\%$ |
| $4\tau$ | $0.018$ | $98.2\%$ |
| $5\tau$ | $0.0067$ | $99.3\%$ |

Two other markers are worth memorising: the **half-life** $t_{1/2} = \tau\ln 2 = 0.693\tau$, and $90\%$ decay at $\tau\ln 10 = 2.30\tau$. The rule "settled after three to five time constants" that control engineers use is this table.

The same equation describes a **first-order lag** driven by a constant input $u$: $\dot x = \dfrac{u - x}{\tau}$. Let $e = x - u$; since $u$ is constant, $\dot e = \dot x = -e/\tau$, so $e = e_0 e^{-t/\tau}$ and

$$
x(t) = u + (x_0 - u)\,e^{-t/\tau}.
$$

Starting from $x_0 = 0$ this is the **step response** $x = u(1 - e^{-t/\tau})$: the output rises to $63.2\%$ of the step in one time constant and to $95\%$ in three. A rate gyro with $\tau = 20\,\mathrm{ms}$ reports $95\%$ of a sudden rate change after $60\,\mathrm{ms}$, a lag that a flight-control loop closed at tens of hertz must be designed around. With the sign reversed, $\dot x = +x/\tau$ gives $x_0 e^{t/\tau}$, exponential growth with doubling time $\tau\ln 2$: the signature of an unstable mode, whose "time constant" is the time in which a disturbance grows by $e$.

::: key
For $\dot x = -x/\tau$, $\tau$ is the time constant and $x(t) = x_0 e^{-t/\tau}$. After $1\tau$ about $63\%$ of the initial value has decayed, after $3\tau$ about $95\%$, and after $5\tau$ about $99.3\%$. Half-life is $\tau\ln 2$.
:::

::: example The barometric atmosphere
Air in hydrostatic equilibrium obeys $\dfrac{dp}{dh} = -\rho g$: pressure falls with altitude by the weight of the air above. For an ideal gas $\rho = \dfrac{p}{R_s T}$ with $R_s = 287\,\mathrm{J/(kg\,K)}$. Taking $T$ constant, find $p(h)$ and the scale height.

Substituting for $\rho$ gives $\dfrac{dp}{dh} = -\dfrac{g}{R_s T}\,p$, which is separable with $h(p) = p$ and $g(h) = -g/(R_s T)$ constant:

$$
\frac{dp}{p} = -\frac{g}{R_s T}\,dh \quad\Longrightarrow\quad \ln p = -\frac{g\,h}{R_s T} + C \quad\Longrightarrow\quad p(h) = p_0\,e^{-h/H}, \qquad H = \frac{R_s T}{g}.
$$

Density follows the same law, $\rho = \rho_0 e^{-h/H}$, since $\rho \propto p$ at constant $T$. The **scale height** $H$ is the time constant's spatial cousin: the altitude gain over which pressure falls by $e$. At the sea-level temperature $288\,\mathrm{K}$, $H = 287 \times 288/9.80665 = 8.43\,\mathrm{km}$, which is the value that reproduced sea-level pressure in the substitution lesson. At $256\,\mathrm{K}$, a fair average through the lower stratosphere, $H = 7.50\,\mathrm{km}$, the value used for the max-Q and column-mass examples. The two figures are not a contradiction: the real atmosphere is not isothermal, so $H$ drifts with altitude, and a single exponential is a fit whose $H$ depends on which altitude band you care about. That the same equation gives a $7.5\,\mathrm{km}$ scale height for Earth's air, $\approx 11\,\mathrm{km}$ for Mars's thin cold atmosphere and $\approx 16\,\mathrm{km}$ for Venus's hot dense one is a useful cross-check on any entry-guidance model.
:::

## The ideal rocket equation

Now the derivation the module has been building toward, and the one the exercises ask you to reproduce. A vehicle of instantaneous mass $m(t)$ moves at velocity $v(t)$ in an inertial frame, in field-free space, expelling propellant backward at a constant speed $v_e$ *relative to the vehicle*. Over a short interval $dt$ it expels a small mass, so its own mass changes by $dm < 0$ and the expelled mass is $-dm > 0$.

**Momentum before**, at time $t$: $p(t) = m\,v$.

**Momentum after**, at $t + dt$: the vehicle has mass $m + dm$ and velocity $v + dv$; the expelled propellant has mass $-dm$ and, being ejected at $v_e$ backward relative to a vehicle moving at $v$, has inertial velocity $v - v_e$ (to first order — the vehicle's own speed changes by $dv$ during the interval, which contributes a term of second order). So

$$
p(t + dt) = (m + dm)(v + dv) + (-dm)(v - v_e).
$$

Expand: $mv + m\,dv + v\,dm + dm\,dv - v\,dm + v_e\,dm$. The two $v\,dm$ terms cancel: the propellant was travelling *with* the vehicle at speed $v$ before ejection and carries that momentum away with it, so the vehicle's loss of $v\,dm$ is exactly balanced by the exhaust's gain of it. This is the step that a careless application of $F = d(mv)/dt$ to the vehicle alone gets wrong — that formula keeps the $v\,dm$ term and produces a frame-dependent, incorrect equation. With no external force, momentum is conserved, $p(t + dt) = p(t)$:

$$
m\,dv + v_e\,dm + dm\,dv = 0.
$$

The product $dm\,dv$ is second order in the small quantities and vanishes faster than the others as $dt \to 0$; drop it, divide by $dt$, and the equation of motion is

$$
m\,\frac{dv}{dt} = -v_e\,\frac{dm}{dt}.
$$

Since $dm/dt < 0$ the right-hand side is positive: the vehicle accelerates. The right-hand side has the units of force and is the **thrust**, $T = -v_e\,\dot m = \dot m_p\,v_e$ where $\dot m_p = -\dot m > 0$ is the propellant mass flow — which is why $T/\dot m_p$ in the integration lesson turned out to be $v_e$. Specific impulse $I_{sp}$ is defined by $v_e = I_{sp}\,g_0$, so that it has units of seconds regardless of the unit system; $298\,\mathrm{s}$ means $v_e = 2923\,\mathrm{m/s}$.

::: key
Equation of motion for a rocket in field-free space: $m\,\dfrac{dv}{dt} = -v_e\,\dfrac{dm}{dt}$, with $\dfrac{dm}{dt} < 0$. Thrust is $T = -v_e\,\dot m = \dot m_p\,v_e$. It comes from momentum conservation for vehicle plus exhaust; the $v\,dm$ terms cancel between the two.
:::

The equation is separable — and this is the step that produces the logarithm. Divide by $m$ and multiply by $dt$:

$$
dv = -v_e\,\frac{dm}{m} \quad\Longrightarrow\quad \int_{v_0}^{v_f}dv = -v_e\int_{m_0}^{m_f}\frac{dm}{m} \quad\Longrightarrow\quad \Delta v = v_f - v_0 = -v_e\big[\ln m\big]_{m_0}^{m_f} = v_e\ln\frac{m_0}{m_f}.
$$

Nothing about the thrust profile was assumed: the burn may be throttled, paused and restarted, and the result depends only on $v_e$ and the mass ratio $m_0/m_f$. The $1/m$ in the integrand is the entire origin of the logarithm in rocketry, and its consequences were laid out in the last lesson: $\Delta v$ grows without bound as $m_f \to 0$ but only logarithmically, so each tenfold increase in mass ratio buys the same $2.30\,v_e$.

::: key
Ideal rocket (Tsiolkovsky) equation: $\Delta v = v_e\ln\dfrac{m_0}{m_f} = I_{sp}\,g_0\ln\dfrac{m_0}{m_f}$. Only the effective exhaust velocity and the mass ratio matter, not the thrust history.
:::

::: example Ideal and realised delta-v of a first stage
The first stage of the integration lesson had $T = 7600\,\mathrm{kN}$, $\dot m_p = 2600\,\mathrm{kg/s}$, $m_0 = 550\,000\,\mathrm{kg}$ and burned for $162\,\mathrm{s}$; its pitch programme gave a gravity loss of $1298\,\mathrm{m/s}$. Find the ideal and the realised $\Delta v$, and the mass ratio a single stage would need to reach orbital speed.

$v_e = T/\dot m_p = 2923\,\mathrm{m/s}$ and $m_f = 550\,000 - 2600 \times 162 = 128\,800\,\mathrm{kg}$, so $\Delta v_{\mathrm{ideal}} = 2923\ln(4.270) = 4243\,\mathrm{m/s}$, agreeing with the direct integration of thrust acceleration — as it must, since that integral and this derivation are the same computation. Add a uniform gravity field: the external force along the flight direction is $-mg\sin\gamma$, so momentum conservation acquires a term and the equation of motion becomes $m\,\dfrac{dv}{dt} = -v_e\dot m - mg\sin\gamma$. Divide by $m$: $dv = -v_e\dfrac{dm}{m} - g\sin\gamma\,dt$. The first term integrates as before; the second is a plain time integral:

$$
\Delta v = v_e\ln\frac{m_0}{m_f} - \int_0^{t_b} g\sin\gamma\,dt = 4243 - 1298 = 2945\,\mathrm{m/s}.
$$

The realised gain is $69\%$ of the ideal; drag would remove another hundred metres per second or so. For orbit, roughly $9.4\,\mathrm{km/s}$ of ideal $\Delta v$ is needed once gravity and drag losses are included. With $v_e = 3.0\,\mathrm{km/s}$ that requires $m_0/m_f = e^{9.4/3.0} = 23.0$: the vehicle at ignition would have to be $95.6\%$ propellant, leaving $4.4\%$ for tanks, engines, structure and payload together. No one has built that. Staging — dropping empty tankage so the logarithm restarts from a smaller $m_0$ — is the engineering response to the shape of $\ln(m_0/m_f)$.
:::

## Quadratic drag

A body coasting through air of density $\rho$ with drag coefficient $C_D$ and reference area $A$ decelerates at

$$
\frac{dv}{dt} = -k\,v^2, \qquad k = \frac{\rho\,C_D A}{2m},
$$

where $m/(C_D A)$ is the **ballistic coefficient** $\beta$ and $k = \rho/(2\beta)$. This is separable with $h(v) = v^2$:

$$
-\frac{dv}{v^2} = k\,dt \quad\Longrightarrow\quad \frac{1}{v} = \frac{1}{v_0} + k\,t \quad\Longrightarrow\quad v(t) = \frac{v_0}{1 + k\,v_0\,t}.
$$

Unlike the exponential, this decays like $1/t$: the speed halves in a time $1/(k v_0)$, then needs twice as long to halve again, because the drag weakens as the square of the falling speed. The equilibrium $v \equiv 0$ is approached but never reached. Distance follows by integrating $v$ with the substitution $u = 1 + kv_0 t$: $x(t) = \dfrac{1}{k}\ln(1 + k v_0 t)$, which grows without bound — a body under quadratic drag alone never quite stops. In reality gravity, or the $1/t$ tail dropping below other forces, ends the story.

::: example A capsule in dense air
A capsule of mass $5000\,\mathrm{kg}$ with $C_D A = 8\,\mathrm{m^2}$ is moving horizontally at $300\,\mathrm{m/s}$ through air of density $1.0\,\mathrm{kg/m^3}$. Neglecting gravity, find its speed and distance after $10\,\mathrm{s}$, and the time and distance to slow to $100\,\mathrm{m/s}$.

$\beta = 5000/8 = 625\,\mathrm{kg/m^2}$ and $k = 1.0/(2 \times 625) = 8.0 \times 10^{-4}\,\mathrm{m^{-1}}$. Then $k v_0 = 0.24\,\mathrm{s^{-1}}$, and after $10\,\mathrm{s}$:

$$
v = \frac{300}{1 + 2.4} = 88.2\,\mathrm{m/s}, \qquad x = \frac{\ln 3.4}{8.0 \times 10^{-4}} = 1530\,\mathrm{m}.
$$

To reach $100\,\mathrm{m/s}$: $\dfrac{1}{100} - \dfrac{1}{300} = k\,t$ gives $t = \dfrac{6.667 \times 10^{-3}}{8.0 \times 10^{-4}} = 8.33\,\mathrm{s}$, and $x = \dfrac{\ln 3}{k} = 1373\,\mathrm{m}$. Check: at $t = 8.33$, $1 + kv_0 t = 3$, so $v = 300/3 = 100$. The initial deceleration $k v_0^2 = 72\,\mathrm{m/s^2}$, over $7g$, has fallen to $6.2\,\mathrm{m/s^2}$ by the time the speed is $88\,\mathrm{m/s}$: the peak load of an entry is at the start, and the ballistic coefficient sets its scale, which is the first number an entry-guidance designer asks for.
:::

::: warning
Do not apply $F = \dfrac{d(mv)}{dt} = m\dot v + v\dot m$ to a rocket by itself. The vehicle is not a closed system; it is throwing mass away, and the momentum that mass carries must be accounted for. Applied to vehicle plus exhaust, conservation of momentum gives $m\dot v = -v_e\dot m$, in which the exhaust speed relative to the vehicle appears and the vehicle's inertial speed does not — as it must, since physics cannot depend on which inertial frame you chose. The naive formula gives $m\dot v = -v\dot m$, a frame-dependent result that is wrong in every frame but one.
:::

::: warning
After separating and integrating, apply the initial condition before doing anything else, and keep the absolute value in $\ln|x|$ until the sign is settled. The general solution $\ln|x| = -t/\tau + C$ describes two families, positive and negative; the initial value chooses one. Also check whether dividing by $h(y)$ threw away an equilibrium: $\dot v = -kv^2$ has the solution $v \equiv 0$, which the formula $1/v = 1/v_0 + kt$ cannot represent.
:::

::: note
Not every first-order equation separates. $\dot x = -x/\tau + u(t)$ with a time-varying input does not, because the right-hand side is a sum, not a product; its solution needs an integrating factor and produces the convolution integral $x(t) = x_0 e^{-t/\tau} + \int_0^t e^{-(t - s)/\tau}u(s)\,ds$, which the ODE module derives. That module also treats second-order equations, systems in state-space form and the Laplace transform, all of which rest on the exponential solution found here.
:::

## Check yourself

::: check
Solve $\dfrac{dy}{dx} = x\,y$ with $y(0) = 2$, and evaluate $y(1)$.
:::

::: answer
Separate: $\dfrac{dy}{y} = x\,dx$, so $\ln|y| = \dfrac{x^2}{2} + C$ and $y = A e^{x^2/2}$ with $A = \pm e^C$. The initial condition gives $A = 2$: $y = 2e^{x^2/2}$, and $y(1) = 2e^{0.5} = 3.30$. Check by differentiating: $y' = 2x e^{x^2/2} = x\,y$. The equilibrium $y \equiv 0$ is not selected by $y(0) = 2$.
:::

::: check
A first-order lag has time constant $\tau = 20\,\mathrm{ms}$. After a step input, how long until the output is within $10\%$ of its final value? Within $1\%$?
:::

::: answer
The error is $e^{-t/\tau}$ of the step. For $10\%$: $e^{-t/\tau} = 0.1$ gives $t = \tau\ln 10 = 2.30\tau = 46\,\mathrm{ms}$. For $1\%$: $t = \tau\ln 100 = 4.61\tau = 92\,\mathrm{ms}$. Each additional factor of ten in accuracy costs another $2.30\tau$, because the exponential's remaining error falls by $e$ per time constant.
:::

::: check
An upper stage must deliver $\Delta v = 3200\,\mathrm{m/s}$ with an engine of $I_{sp} = 311\,\mathrm{s}$. What mass ratio does it need, and what fraction of its ignition mass is propellant?
:::

::: answer
$v_e = I_{sp}g_0 = 311 \times 9.80665 = 3050\,\mathrm{m/s}$. From $\Delta v = v_e\ln(m_0/m_f)$, $m_0/m_f = e^{3200/3050} = e^{1.049} = 2.855$. The propellant fraction is $1 - m_f/m_0 = 1 - 1/2.855 = 0.650$: $65\%$ of the stage at ignition is propellant and $35\%$ is everything else, including the payload it carries. Adding $10\%$ more $\Delta v$ would raise the ratio to $e^{1.154} = 3.17$ — the logarithm at work.
:::

::: check
Plutonium-238, the heat source in a radioisotope generator, has a half-life of $87.7$ years. What is its time constant, and what fraction of the initial thermal power remains after a $14$-year mission?
:::

::: answer
Decay obeys $\dot N = -N/\tau$, so $N = N_0 e^{-t/\tau}$ and the half-life is $\tau\ln 2$; hence $\tau = 87.7/\ln 2 = 126.5\,\mathrm{y}$. After $14$ years, $e^{-14/126.5} = e^{-0.1107} = 0.895$: $89.5\%$ of the initial power remains from decay alone (thermocouple degradation reduces the electrical output further). After $30$ years the figure is $78.9\%$.
:::

::: check
An avionics box at $60^\circ\mathrm{C}$ is switched off in a $20^\circ\mathrm{C}$ bay and cools according to $\dot T = -(T - 20)/\tau$ with $\tau = 15\,\mathrm{min}$. When does it reach $30^\circ\mathrm{C}$?
:::

::: answer
This is the first-order lag toward $u = 20$: $T(t) = 20 + 40e^{-t/\tau}$. Set $T = 30$: $40e^{-t/\tau} = 10$, so $e^{-t/\tau} = \tfrac14$ and $t = \tau\ln 4 = 15 \times 1.386 = 20.8\,\mathrm{min}$. Two half-lives of the temperature *excess*, each $\tau\ln 2 = 10.4\,\mathrm{min}$, as expected for a fall from $40$ to $10$ degrees above ambient.
:::

::: check
In the momentum balance for a rocket, the vehicle's momentum changes by $m\,dv + v\,dm$ over $dt$. Explain what happens to the $v\,dm$ term and why the resulting equation of motion contains $v_e$ but not $v$.
:::

::: answer
The vehicle's loss of momentum $v\,dm$ (negative, since $dm < 0$) is matched by the expelled propellant, which was moving with the vehicle at $v$ and carries momentum $(-dm)\,v$ away: the two cancel in the total. What remains is the exhaust's momentum *relative to the vehicle*, $(-dm)(-v_e) = v_e\,dm$, balanced against $m\,dv$. The equation $m\,dv = -v_e\,dm$ therefore involves only the relative exhaust speed. It could not be otherwise: a change of inertial frame shifts $v$ by a constant but cannot change the physics, so $v$ itself cannot appear.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Separable ODE | $\dfrac{dy}{dx} = g(x)h(y)$: $\displaystyle\int\frac{dy}{h(y)} = \int g(x)\,dx + C$, then apply the initial condition |
| Equilibria | Values with $h(y) = 0$ are constant solutions lost when dividing |
| Exponential decay | $\dot x = -x/\tau \Rightarrow x = x_0 e^{-t/\tau}$; $63\%$ at $1\tau$, $95\%$ at $3\tau$, $99.3\%$ at $5\tau$; $t_{1/2} = \tau\ln 2$ |
| First-order lag | $\dot x = (u - x)/\tau \Rightarrow x = u + (x_0 - u)e^{-t/\tau}$ |
| Barometric law | $dp/dh = -\rho g$, $\rho = p/(R_sT) \Rightarrow p = p_0 e^{-h/H}$, $H = R_sT/g$ |
| Variable-mass EOM | $m\,\dfrac{dv}{dt} = -v_e\,\dfrac{dm}{dt}$; $T = -v_e\dot m = \dot m_p v_e$; $v_e = I_{sp}g_0$ |
| Tsiolkovsky | $\Delta v = v_e\ln\dfrac{m_0}{m_f} = I_{sp}g_0\ln\dfrac{m_0}{m_f}$ |
| With gravity | $\Delta v = v_e\ln\dfrac{m_0}{m_f} - \displaystyle\int g\sin\gamma\,dt$ |
| Quadratic drag | $\dot v = -kv^2 \Rightarrow v = \dfrac{v_0}{1 + kv_0t}$, $x = \dfrac{1}{k}\ln(1 + kv_0 t)$, $k = \rho/(2\beta)$ |

This completes single-variable calculus. The next module extends every idea here to functions of several variables — partial derivatives, the gradient, and the Jacobian matrix that is the multivariable form of the linearisation you learned to trust and to distrust in this one.
