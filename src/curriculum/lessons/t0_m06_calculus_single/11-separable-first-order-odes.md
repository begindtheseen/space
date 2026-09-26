---
id: l11-separable-first-order-odes
title: Separable first-order ODEs and the rocket equation
minutes: 23
covers:
  - separable first-order ODEs
---

So far you have always started with a function and asked for its slope or its area. Nature rarely hands you the function. It hands you a *rule about change*, and asks what function obeys it.

A cup of hot cocoa is a good picture. You do not know its temperature at every minute. But you do know a rule: the hotter it is compared with the room, the faster it cools. From that rule alone you can work out the temperature at every moment.

Rockets and sensors are full of rules like that. A rocket's speed changes at a rate set by its thrust and its current mass — and the mass is changing too. A rate sensor's output creeps toward its input at a rate proportional to the gap. A capsule plowing into the atmosphere slows at a rate proportional to its speed squared. Air pressure falls with height at a rate proportional to the pressure itself. Each is a **differential equation**: an equation that ties a quantity to its own rate of change. Solving it means finding the velocity, output, speed or pressure as a function of time or height.

This lesson covers the simplest and most useful kind: **separable first-order equations**. In these, you can sort the two variables onto opposite sides of the equals sign and integrate each side with the tools of the last three lessons. It is a modest technique. Yet it is enough to derive the ideal rocket equation from momentum conservation, to define the time constant that every control engineer reads off a response, to solve for drag on a coasting capsule, and to derive the exponential atmosphere used in earlier lessons. The full theory of differential equations gets its own module. This is the part one integration can reach.

## What a differential equation asks

An **[[ordinary differential equation|ode-ordinary]]** (ODE) ties an unknown function of one variable to its derivatives. Its **order** is the highest derivative in it.

- $\dot x = -x/\tau$ is first order. ($\dot x$, read "x dot", is $dx/dt$.)
- $\ddot\theta = -(g_0/\ell)\sin\theta$, the swinging pendulum, is second order. ($\ddot\theta$ is "theta double-dot", the second derivative.)

A **solution** is a *function* that makes the equation true at every moment in some interval — not a number. Integrating brings in a constant, so a first-order equation has a whole family of solutions, one for each value of the constant. That family is the **general solution**. To pick one member you need one extra fact, usually the starting value, such as $x(0) = x_0$. Equation plus starting value is an **initial value problem**. For the equations in this lesson it has exactly one solution.

The pendulum, being second order, needs two starting facts: angle and rate. And every GNC model is written as $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ — a list of first-order equations together, called **state-space form**. Everything a trajectory [[propagator|propagator-bridge]] does is solve an initial value problem numerically. This lesson is about the few cases where you can write the solution down.

## Separable equations

Some rules of change come in two separate pieces multiplied together: one piece depends only on where you are ($x$), the other only on how much you have ($y$). Such an equation is **separable**:

$$
\frac{dy}{dx} = g(x)\,h(y).
$$

The method: divide by $h(y)$, multiply by $dx$, and integrate each side with respect to its own variable. The $y$ stuff goes left, the $x$ stuff goes right:

$$
\frac{dy}{h(y)} = g(x)\,dx \quad\Longrightarrow\quad \int\frac{dy}{h(y)} = \int g(x)\,dx + C.
$$

It looks like shuffling $dy$ and $dx$ around as if they were numbers. That is allowed here, and it is worth seeing why.

::: note Why it has to be true
Let $H(y)$ be an antiderivative of $1/h(y)$ and $G(x)$ one of $g(x)$. If $y(x)$ solves the equation, the chain rule gives

$$
\frac{d}{dx}H\big(y(x)\big) = H'(y)\,\frac{dy}{dx} = \frac{1}{h(y)}\cdot g(x)\,h(y) = g(x) = G'(x).
$$

So $H(y(x))$ and $G(x)$ have the same derivative everywhere. Two functions with the same derivative differ by a constant: $H(y) = G(x) + C$. That is exactly what "integrate both sides" produced. The differential notation $dy = y'\,dx$ from the linearization lesson is what makes the shorthand honest.
:::

Two cautions come with the method.

**Do not lose the equilibria.** Dividing by $h(y)$ assumes $h(y) \ne 0$. Any value $y^*$ with $h(y^*) = 0$ gives a constant solution $y \equiv y^*$ (read "$y$ is always $y^*$"). That is an **equilibrium**: a value where the rate of change is zero, so nothing moves. Division throws it away without warning, so add it back by looking.

**Expect an implicit answer.** The result $H(y) = G(x) + C$ usually has $y$ tangled inside a function. Getting $y$ alone may need a logarithm or a root, and the starting value fixes any sign or choice of branch.

::: key Separable ODE
To solve a separable first-order ODE $\dfrac{dy}{dx} = g(x)\,h(y)$: separate to $\dfrac{dy}{h(y)} = g(x)\,dx$, integrate both sides, then apply the initial condition to fix the constant. Check for equilibrium solutions $h(y) = 0$ lost in the division. The rocket equation is exactly this move.
:::

## Exponential decay and the time constant

Back to the cocoa. Its temperature *above the room* shrinks at a rate proportional to how big it is. The same shape describes a spinning wheel coasting down, a battery draining through a resistor, and a sensor catching up with a change. It is the most important separable equation in engineering:

$$
\dot x = -\frac{x}{\tau}, \qquad x(0) = x_0,
$$

where $\tau$ ("tau") is a positive constant with units of time.

**Separate:** $\dfrac{dx}{x} = -\dfrac{dt}{\tau}$.

**Integrate:** $\ln|x| = -\dfrac{t}{\tau} + C$, so $|x| = e^C e^{-t/\tau}$.

**Apply the start:** at $t = 0$, $|x_0| = e^C$. The sign of $x$ never changes, because $x \equiv 0$ is itself a solution and [[solutions cannot cross|no-crossing]]. So $x$ keeps the sign of $x_0$:

$$
x(t) = x_0\,e^{-t/\tau}.
$$

$\tau$ is the **[[time constant|time-constant-picture]]**. In one time constant, $x$ falls to $e^{-1} = 36.8\%$ of its value. That is true starting from *any* moment, because the ratio $x(t + \tau)/x(t) = e^{-1}$ is the same for every $t$.

There is a second way to see $\tau$. The slope at $t = 0$ is $-x_0/\tau$. If $x$ kept falling at that first speed, along the line $x_0(1 - t/\tau)$, it would hit zero at exactly $t = \tau$.

Here is how the decay piles up:

| Elapsed | Remaining $e^{-t/\tau}$ | Decayed |
| --- | --- | --- |
| $1\tau$ | $0.368$ | $63.2\%$ |
| $2\tau$ | $0.135$ | $86.5\%$ |
| $3\tau$ | $0.050$ | $95.0\%$ |
| $4\tau$ | $0.018$ | $98.2\%$ |
| $5\tau$ | $0.0067$ | $99.3\%$ |

Two more markers are worth remembering. The **half-life** — the time to lose half — is $t_{1/2} = \tau\ln 2 = 0.693\tau$. And $90\%$ decay takes $\tau\ln 10 = 2.30\tau$. The control engineer's rule of thumb, "settled after three to five time constants", is this table.

### The first-order lag

Now let $x$ chase a constant target $u$, closing the gap at a rate proportional to the gap:

$$
\dot x = \frac{u - x}{\tau}.
$$

This is a **first-order lag**. Measure from the target instead: let $e = x - u$ be the gap. Since $u$ is constant, $\dot e = \dot x = -e/\tau$. That is the decay equation again, so $e = e_0 e^{-t/\tau}$, and

$$
x(t) = u + (x_0 - u)\,e^{-t/\tau}.
$$

Starting from $x_0 = 0$, this is the **step response** $x = u(1 - e^{-t/\tau})$. The output reaches $63.2\%$ of the step in one time constant and $95\%$ in three. A [[rate gyro|rate-gyro]] with $\tau = 20\,\mathrm{ms}$ reports $95\%$ of a sudden change in spin rate after $60\,\mathrm{ms}$. A flight-control loop running tens of times a second must be designed around that delay.

Flip the sign and you get growth: $\dot x = +x/\tau$ gives $x_0 e^{t/\tau}$, which doubles every $\tau\ln 2$. That is the signature of an **unstable mode**. Its "time constant" is the time in which a small disturbance grows by a factor of $e$.

::: key Time constant
For $\dot x = -x/\tau$, $\tau$ is the time constant and $x(t) = x_0 e^{-t/\tau}$. After $1\tau$ about $63\%$ of the initial value has decayed, after $3\tau$ about $95\%$, and after $5\tau$ about $99.3\%$. Half-life is $\tau\ln 2$.
:::

::: example The barometric atmosphere
Air that is not blowing around is in **[[hydrostatic equilibrium|hydrostatic]]**: each layer holds up the weight of the air above it. So pressure $p$ falls with height $h$ by the weight of each thin layer:

$$
\frac{dp}{dh} = -\rho g,
$$

where $\rho$ ("rho") is the air density. For an ideal gas, $\rho = \dfrac{p}{R_s T}$, with $R_s = 287\,\mathrm{J/(kg\,K)}$ for air and $T$ the temperature. Take $T$ constant. Find $p(h)$ and the scale height.

**Substitute** for $\rho$: $\dfrac{dp}{dh} = -\dfrac{g}{R_s T}\,p$. The right side is a constant times $p$, so it separates.

**Separate and integrate:**

$$
\frac{dp}{p} = -\frac{g}{R_s T}\,dh \quad\Longrightarrow\quad \ln p = -\frac{g\,h}{R_s T} + C \quad\Longrightarrow\quad p(h) = p_0\,e^{-h/H}, \qquad H = \frac{R_s T}{g}.
$$

Density follows the same law, $\rho = \rho_0 e^{-h/H}$, since $\rho$ is proportional to $p$ when $T$ is fixed.

The **scale height** $H$ is the time constant's cousin in space: the height you climb for pressure to fall by a factor of $e$.

**Numbers.** At the sea-level temperature $288\,\mathrm{K}$: $H = 287 \times 288/9.80665 = 8.43\,\mathrm{km}$. That is the value that matched sea-level pressure in lesson 9. At $256\,\mathrm{K}$, a fair average through the lower stratosphere (roughly $10$ to $20\,\mathrm{km}$ up): $H = 287 \times 256/9.80665 = 7.49\,\mathrm{km}$, or about $7.5\,\mathrm{km}$, the value used in the earlier max-Q and column-mass examples.

The two numbers do not contradict each other. The real atmosphere changes temperature with height, so $H$ drifts too, and a single exponential is a fit whose $H$ depends on which band of heights you care about. The same equation gives about $7.5\,\mathrm{km}$ for Earth, about $11\,\mathrm{km}$ for Mars's thin, cold air, and about $16\,\mathrm{km}$ for Venus's hot, dense air — a handy cross-check on any entry-guidance model.
:::

## The ideal rocket equation

Now the derivation this whole module has been building toward — and the one the exercises ask you to reproduce.

First, a picture. Stand on a skateboard holding a pile of bricks, and throw them backward one at a time. Each throw pushes you forward. The faster you throw, the bigger each push. And as the pile shrinks, each push moves you more, because there is less of you left to move. A rocket does the same with gas.

Set it up carefully. A vehicle of mass $m(t)$ moves at velocity $v(t)$ in an **inertial frame** (one that is not accelerating or spinning), in space with no gravity or air. It throws propellant backward at a constant speed $v_e$ *relative to the vehicle* — the **exhaust velocity**. In a short time $dt$, its mass changes by $dm$. Since it is losing mass, $dm < 0$, and the propellant thrown out has mass $-dm > 0$.

**[[Momentum before|momentum-picture]]**, at time $t$: $p(t) = m\,v$.

**Momentum after**, at $t + dt$: the vehicle has mass $m + dm$ and velocity $v + dv$. The thrown-out propellant has mass $-dm$. It left at $v_e$ backward relative to a vehicle moving at $v$, so its velocity in the inertial frame is $v - v_e$. (Strictly, the vehicle's speed changes by $dv$ during the throw, but that only adds a term smaller than the ones we keep.) So

$$
p(t + dt) = (m + dm)(v + dv) + (-dm)(v - v_e).
$$

**Expand** term by term:

$$
p(t + dt) = mv + m\,dv + v\,dm + dm\,dv - v\,dm + v_e\,dm.
$$

**Watch the two $v\,dm$ terms cancel.** This is the heart of the derivation. The propellant was riding *with* the vehicle at speed $v$ before it left, and it carries that momentum away. The vehicle's loss of $v\,dm$ is exactly the exhaust's gain of it. Nothing is created or lost.

This is the step that goes wrong if you apply $F = d(mv)/dt$ to the vehicle alone. That formula keeps the $v\,dm$ term and produces an equation that depends on which frame you watch from — and is wrong.

**Conserve momentum.** There is no outside force, so $p(t + dt) = p(t)$. Subtract $mv$ from both sides:

$$
m\,dv + v_e\,dm + dm\,dv = 0.
$$

**Drop the tiny term.** $dm\,dv$ is a product of two small quantities. As $dt \to 0$ it shrinks much faster than the others, so drop it. Divide by $dt$:

$$
m\,\frac{dv}{dt} = -v_e\,\frac{dm}{dt}.
$$

Since $dm/dt < 0$, the right side is positive: the vehicle speeds up, as it should. The right side has units of force. It is the **thrust**, $T = -v_e\,\dot m = \dot m_p\,v_e$, where $\dot m_p = -\dot m > 0$ ("m-dot sub p") is the propellant mass flow in kilograms per second. That is why $T/\dot m_p$ in lesson 8 turned out to be $v_e$.

**[[Specific impulse|isp-seconds]]** $I_{sp}$ is defined by $v_e = I_{sp}\,g_0$, so it is measured in seconds whatever unit system you use. $I_{sp} = 298\,\mathrm{s}$ means $v_e = 298 \times 9.80665 \approx 2920\,\mathrm{m/s}$.

::: key Variable-mass equation of motion
Equation of motion for a rocket in field-free space: $m\,\dfrac{dv}{dt} = -v_e\,\dfrac{dm}{dt}$, with $\dfrac{dm}{dt} < 0$. Thrust is $T = -v_e\,\dot m = \dot m_p\,v_e$. It comes from momentum conservation for vehicle plus exhaust; the $v\,dm$ terms cancel between the two.
:::

This equation is separable, and separating it is the step that produces the logarithm. Divide by $m$ and multiply by $dt$:

$$
dv = -v_e\,\frac{dm}{m}.
$$

Integrate the left side from the starting speed $v_0$ to the final speed $v_f$, and the right side from the starting mass $m_0$ to the final mass $m_f$:

$$
\int_{v_0}^{v_f}dv = -v_e\int_{m_0}^{m_f}\frac{dm}{m} \quad\Longrightarrow\quad \Delta v = v_f - v_0 = -v_e\big[\ln m\big]_{m_0}^{m_f} = v_e\ln\frac{m_0}{m_f}.
$$

The last step uses $-(\ln m_f - \ln m_0) = \ln m_0 - \ln m_f = \ln(m_0/m_f)$.

Notice what was *not* assumed: anything about how the thrust varies. The burn may be throttled, paused and restarted. The result depends only on $v_e$ and the **[[mass ratio|log-curve]]** $m_0/m_f$. The $1/m$ in the integrand is the whole origin of the logarithm in rocketry. As the last lesson showed, $\Delta v$ grows without limit as $m_f \to 0$, but only like a logarithm, so each tenfold increase in mass ratio buys the same $2.30\,v_e$.

::: key Tsiolkovsky rocket equation
Ideal rocket ([[Tsiolkovsky|tsiolkovsky]]) equation: $\Delta v = v_e\ln\dfrac{m_0}{m_f} = I_{sp}\,g_0\ln\dfrac{m_0}{m_f}$. Only the effective exhaust velocity and the mass ratio matter, not the thrust history.
:::

::: example Ideal and real delta-v of a first stage
Lesson 8's first stage had thrust $T = 7600\,\mathrm{kN}$, propellant flow $\dot m_p = 2600\,\mathrm{kg/s}$ and starting mass $m_0 = 550\,000\,\mathrm{kg}$, and burned for $162\,\mathrm{s}$. Its pitch program gave a gravity loss of $1314\,\mathrm{m/s}$. Find the ideal and the real $\Delta v$, and the mass ratio a single stage would need to reach orbit.

**Exhaust velocity:** $v_e = T/\dot m_p = 7.6 \times 10^6/2600 = 2923\,\mathrm{m/s}$.

**Final mass:** $m_f = 550\,000 - 2600 \times 162 = 128\,800\,\mathrm{kg}$, so $m_0/m_f = 4.270$.

**Ideal:** $\Delta v_{\mathrm{ideal}} = 2923\ln(4.270) = 4243\,\mathrm{m/s}$. That matches lesson 8's direct integration of thrust acceleration, as it must: that integral and this derivation are the same calculation.

**Add gravity.** Now let a uniform gravity field act. Call $\gamma$ ("gamma") the **flight-path angle**: the angle of the velocity above the local horizon. The part of gravity pulling straight back along the flight direction is $mg\sin\gamma$. So momentum picks up an outside push, and the equation of motion becomes

$$
m\,\frac{dv}{dt} = -v_e\dot m - mg\sin\gamma.
$$

Divide by $m$ and multiply by $dt$: $dv = -v_e\dfrac{dm}{m} - g\sin\gamma\,dt$. The first term integrates as before. The second is a plain integral over time:

$$
\Delta v = v_e\ln\frac{m_0}{m_f} - \int_0^{t_b} g\sin\gamma\,dt = 4243 - 1314 = 2929\,\mathrm{m/s}.
$$

Here $t_b$ is the burn time. The real gain is $2929/4243 = 69\%$ of the ideal. Drag would take roughly another hundred meters per second.

**Single stage to orbit?** Orbit needs about $9.4\,\mathrm{km/s}$ of ideal $\Delta v$ once gravity and drag losses are counted. With $v_e = 3.0\,\mathrm{km/s}$, solve the rocket equation for the mass ratio:

$$
\frac{m_0}{m_f} = e^{9.4/3.0} = e^{3.13} = 23.0.
$$

Then the vehicle at ignition would be $1 - 1/23.0 = 95.6\%$ propellant, leaving $4.4\%$ for tanks, engines, structure and payload together. Nobody has built that. **Staging** — dropping empty tanks so the logarithm starts over from a smaller $m_0$ — is the engineering answer to the shape of $\ln(m_0/m_f)$.
:::

## Quadratic drag

Stick your hand out of a car window. At twice the speed, the push is about four times as hard. Drag in air grows with speed squared. A body coasting through air of density $\rho$, with drag coefficient $C_D$ and reference area $A$, slows at

$$
\frac{dv}{dt} = -k\,v^2, \qquad k = \frac{\rho\,C_D A}{2m}.
$$

The combination $m/(C_D A)$ is the **[[ballistic coefficient|ballistic-coefficient]]** $\beta$ ("beta"), so $k = \rho/(2\beta)$. The equation is separable with $h(v) = v^2$:

$$
-\frac{dv}{v^2} = k\,dt \quad\Longrightarrow\quad \frac{1}{v} = \frac{1}{v_0} + k\,t \quad\Longrightarrow\quad v(t) = \frac{v_0}{1 + k\,v_0\,t}.
$$

The middle step: the antiderivative of $-1/v^2$ is $1/v$, and at $t = 0$ it equals $1/v_0$, which fixes the constant.

This does not fade like an exponential. It fades like $1/t$. The speed halves in a time $1/(k v_0)$, then takes twice as long to halve again, because the drag weakens with the square of the dropping speed. The equilibrium $v \equiv 0$ is approached but never reached.

For the distance, integrate $v$ using the substitution $u = 1 + kv_0 t$:

$$
x(t) = \frac{1}{k}\ln(1 + k v_0 t).
$$

That grows without limit. A body with quadratic drag *alone* never quite stops. In real life, gravity or other small forces take over once the $1/t$ tail gets weak enough.

::: example A capsule in dense air
A capsule of mass $5000\,\mathrm{kg}$ with $C_D A = 8\,\mathrm{m^2}$ moves horizontally at $300\,\mathrm{m/s}$ through air of density $1.0\,\mathrm{kg/m^3}$. Ignore gravity. Find its speed and distance after $10\,\mathrm{s}$, and the time and distance to slow to $100\,\mathrm{m/s}$.

**Constants:** $\beta = 5000/8 = 625\,\mathrm{kg/m^2}$ and $k = 1.0/(2 \times 625) = 8.0 \times 10^{-4}\,\mathrm{m^{-1}}$. Then $k v_0 = 8.0 \times 10^{-4} \times 300 = 0.24\,\mathrm{s^{-1}}$.

**After 10 s:** $1 + k v_0 t = 1 + 2.4 = 3.4$, so

$$
v = \frac{300}{3.4} = 88.2\,\mathrm{m/s}, \qquad x = \frac{\ln 3.4}{8.0 \times 10^{-4}} = 1530\,\mathrm{m}.
$$

**Down to 100 m/s:** from $\dfrac{1}{v} = \dfrac{1}{v_0} + kt$, $\dfrac{1}{100} - \dfrac{1}{300} = k\,t$, so $t = \dfrac{6.667 \times 10^{-3}}{8.0 \times 10^{-4}} = 8.33\,\mathrm{s}$. At that moment $1 + kv_0 t = 1 + 0.24 \times 8.33 = 3$, so $x = \dfrac{\ln 3}{k} = 1373\,\mathrm{m}$.

**Check:** $v = 300/3 = 100\,\mathrm{m/s}$. Good. And $8.33\,\mathrm{s}$ is less than $10\,\mathrm{s}$, as it should be, since $100\,\mathrm{m/s}$ is faster than the $88.2\,\mathrm{m/s}$ reached at $10\,\mathrm{s}$.

**Loads:** the starting deceleration is $k v_0^2 = 8.0 \times 10^{-4} \times 300^2 = 72\,\mathrm{m/s^2}$, more than $7g$. By the time the speed is $88\,\mathrm{m/s}$ it has fallen to $6.2\,\mathrm{m/s^2}$. The peak load comes at the start, and the ballistic coefficient sets its size. That is the first number an entry-guidance designer asks for.
:::

::: warning Never use F = d(mv)/dt on a rocket alone
Do not apply $F = \dfrac{d(mv)}{dt} = m\dot v + v\dot m$ to a rocket by itself. The vehicle is not a closed system. It is throwing mass away, and the momentum that mass carries must be counted. Applied to vehicle plus exhaust, momentum conservation gives $m\dot v = -v_e\dot m$. Only the exhaust speed *relative to the vehicle* appears, and the vehicle's own speed does not — as it must, since the physics cannot depend on which inertial frame you watch from. The naive formula gives $m\dot v = -v\dot m$, which depends on the frame. It is right only by accident, at an instant when the vehicle's speed in your chosen frame happens to equal $v_e$.
:::

::: warning Fix the constant first, and look for lost equilibria
After you separate and integrate, apply the initial condition before anything else. Keep the absolute value in $\ln|x|$ until the sign is settled: $\ln|x| = -t/\tau + C$ describes two families, one positive and one negative, and the starting value picks one. Also check whether dividing by $h(y)$ threw away an equilibrium. $\dot v = -kv^2$ has the solution $v \equiv 0$, which the formula $1/v = 1/v_0 + kt$ cannot represent.
:::

::: note Not every equation separates
$\dot x = -x/\tau + u(t)$, with an input $u$ that changes in time, does not separate. Its right side is a *sum*, not a product. Solving it takes a tool called an integrating factor, and the answer is the convolution integral

$$
x(t) = x_0 e^{-t/\tau} + \int_0^t e^{-(t - s)/\tau}u(s)\,ds,
$$

which the ODE module derives. That module also covers second-order equations, systems in state-space form and the Laplace transform — all built on the exponential solution found here.
:::

## Check yourself

::: check
Solve $\dfrac{dy}{dx} = x\,y$ with $y(0) = 2$, and find $y(1)$.
:::

::: answer
Separate: $\dfrac{dy}{y} = x\,dx$. Integrate: $\ln|y| = \dfrac{x^2}{2} + C$. Undo the log: $y = A e^{x^2/2}$, where $A = \pm e^C$.

The starting value gives $A = 2$, so $y = 2e^{x^2/2}$ and $y(1) = 2e^{0.5} = 3.30$.

Check by differentiating: $y' = 2x e^{x^2/2} = x\,y$. It works. The equilibrium $y \equiv 0$ is also a solution, but the start $y(0) = 2$ does not pick it.
:::

::: check
A first-order lag has time constant $\tau = 20\,\mathrm{ms}$. After a step input, how long until the output is within $10\%$ of its final value? Within $1\%$?
:::

::: answer
The remaining gap is $e^{-t/\tau}$ of the step.

For $10\%$: $e^{-t/\tau} = 0.1$, so $t = \tau\ln 10 = 2.30\tau = 46\,\mathrm{ms}$.

For $1\%$: $t = \tau\ln 100 = 4.61\tau = 92\,\mathrm{ms}$.

Each extra factor of ten in accuracy costs another $2.30\tau$, because the gap shrinks by the same factor $e$ in every time constant.
:::

::: check
An upper stage must deliver $\Delta v = 3200\,\mathrm{m/s}$ with an engine of $I_{sp} = 311\,\mathrm{s}$. What mass ratio does it need, and what fraction of its ignition mass is propellant?
:::

::: answer
$v_e = I_{sp}g_0 = 311 \times 9.80665 = 3050\,\mathrm{m/s}$.

From $\Delta v = v_e\ln(m_0/m_f)$: $m_0/m_f = e^{3200/3050} = e^{1.049} = 2.855$.

The propellant fraction is $1 - m_f/m_0 = 1 - 1/2.855 = 0.650$. So $65\%$ of the stage at ignition is propellant, and $35\%$ is everything else, payload included.

Asking for $10\%$ more $\Delta v$, $3520\,\mathrm{m/s}$, raises the ratio to $e^{1.154} = 3.17$ — the logarithm at work.
:::

::: check
Plutonium-238, the heat source in a [[radioisotope generator|rtg]], has a half-life of $87.7$ years. What is its time constant, and what fraction of the starting heat output remains after a $14$-year mission?
:::

::: answer
Radioactive decay obeys $\dot N = -N/\tau$, so $N = N_0 e^{-t/\tau}$ and the half-life is $\tau\ln 2$. Hence $\tau = 87.7/\ln 2 = 126.5$ years.

After $14$ years: $e^{-14/126.5} = e^{-0.1107} = 0.895$. So $89.5\%$ of the heat output remains, from decay alone. (The electrical output falls further, because the parts that turn heat into electricity also wear out.) After $30$ years the figure is $78.9\%$.
:::

::: check
An avionics box at $60^\circ\mathrm{C}$ is switched off in a $20^\circ\mathrm{C}$ bay. It cools by $\dot T = -(T - 20)/\tau$ with $\tau = 15\,\mathrm{min}$. When does it reach $30^\circ\mathrm{C}$?
:::

::: answer
This is the first-order lag toward $u = 20$: $T(t) = 20 + 40e^{-t/\tau}$.

Set $T = 30$: $40e^{-t/\tau} = 10$, so $e^{-t/\tau} = \tfrac14$ and $t = \tau\ln 4 = 15 \times 1.386 = 20.8\,\mathrm{min}$.

Sanity check: the *excess* over the bay falls from $40$ to $10$ degrees, which is two halvings. Each takes one half-life, $\tau\ln 2 = 10.4\,\mathrm{min}$, and $2 \times 10.4 = 20.8$.
:::

::: check
In the momentum balance for a rocket, the vehicle's momentum changes by $m\,dv + v\,dm$ over $dt$. Explain what happens to the $v\,dm$ term, and why the final equation of motion contains $v_e$ but not $v$.
:::

::: answer
The vehicle loses momentum $v\,dm$ (negative, since $dm < 0$). The expelled propellant was moving with the vehicle at $v$, and it carries momentum $(-dm)\,v$ away. In the total, the two cancel.

What is left is the exhaust's momentum *relative to the vehicle*, $(-dm)(-v_e) = v_e\,dm$, balanced against $m\,dv$. So $m\,dv = -v_e\,dm$ involves only the relative exhaust speed.

It could not be otherwise. Switching to another inertial frame adds a constant to $v$ but cannot change the physics, so $v$ itself cannot appear.
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
| With gravity | $\Delta v = v_e\ln\dfrac{m_0}{m_f} - \displaystyle\int g\sin\gamma\,dt$, $\gamma$ the flight-path angle above the horizon |
| Quadratic drag | $\dot v = -kv^2 \Rightarrow v = \dfrac{v_0}{1 + kv_0t}$, $x = \dfrac{1}{k}\ln(1 + kv_0 t)$, $k = \rho/(2\beta)$ |

This completes single-variable calculus. The next module carries every idea here to functions of several variables: partial derivatives, the gradient, and the Jacobian matrix. The Jacobian is the many-variable form of the linearization you learned both to trust and to distrust in this module.

::: context ode-ordinary Ordinary versus partial
"Ordinary" does not mean "easy". It means the unknown function depends on only **one** variable, usually time. When the unknown depends on several variables at once — the temperature at every point of a heat shield *and* every moment — the equation involves partial derivatives and is called a **partial differential equation** (PDE). Almost all of GNC runs on ODEs. PDEs show up in heat flow, fluid flow and structural vibration.
:::

::: context propagator-bridge What a propagator does
A **propagator** is the flight-software or ground-software routine that pushes a state forward in time: given where a spacecraft is and how fast it moves now, where will it be in ten minutes? It takes $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ and the current state, then steps forward in small time slices. The numerical methods module builds these step by step. The exact solutions in this lesson are what you test a propagator against: if it cannot reproduce $x_0 e^{-t/\tau}$, it cannot be trusted with an orbit.
:::

::: context no-crossing Why solutions cannot cross
For well-behaved equations like these, each starting value has exactly one solution. Suppose a decaying solution reached $x = 0$ at some moment. From that point, two different futures would both fit the rule: the curve you were on, and the equilibrium $x \equiv 0$ that sits at zero forever. That would break "exactly one solution". So a solution that starts positive stays positive, getting ever closer to zero without touching it.
:::

::: context time-constant-picture Reading τ off a graph
The curve is $x/x_0 = e^{-t/\tau}$. The dashed tangent at the start hits zero at exactly $t = \tau$. At that moment the real curve is still at $0.368$. By $3\tau$ it is down to $0.050$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="100" y2="160" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.0 47.5,45.3 55.0,58.8 62.5,70.7 70.0,81.2 77.5,90.4 85.0,98.6 92.5,105.8 100.0,112.2 107.5,117.8 115.0,122.8 122.5,127.1 130.0,131.0 137.5,134.4 145.0,137.4 152.5,140.1 160.0,142.4 167.5,144.5 175.0,146.3 182.5,147.9 190.0,149.3 197.5,150.6 205.0,151.7 212.5,152.7 220.0,153.5 227.5,154.3 235.0,155.0 242.5,155.6 250.0,156.1 257.5,156.5 265.0,156.9 272.5,157.3 280.0,157.6 287.5,157.9 295.0,158.1 302.5,158.4 310.0,158.6 317.5,158.7 325.0,158.9 332.5,159.0 340.0,159.1"/>
  <line x1="100" y1="160" x2="100" y2="112.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="40" y1="112.2" x2="100" y2="112.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="220" y1="160" x2="220" y2="153.5" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="100" cy="112.2" r="3.5" fill="#1d6fd1"/>
  <circle cx="220" cy="153.5" r="3.5" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="175">0</text><text x="100" y="175">τ</text><text x="160" y="175">2τ</text><text x="220" y="175">3τ</text><text x="280" y="175">4τ</text><text x="340" y="175">5τ</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="34">1</text><text x="34" y="116">0.368</text><text x="34" y="164">0</text>
  </g>
  <text x="112" y="104" font-size="12" fill="#1f2a44">36.8% left at τ</text>
  <text x="228" y="140" font-size="12" fill="#1f2a44">5% left at 3τ</text>
  <text x="70" y="60" font-size="11" fill="#b4232c">first slope</text>
</svg>
```
:::

::: context rate-gyro Lag in a real rate sensor
A rate gyro measures how fast a vehicle is spinning. Its output cannot jump instantly; its internal filtering often makes it behave roughly like a first-order lag. Engineers often quote this as a **bandwidth** instead of a time constant, related by $f = 1/(2\pi\tau)$. A $20\,\mathrm{ms}$ time constant is a bandwidth of about $8\,\mathrm{Hz}$. A control loop that tries to react much faster than the sensor can report is steering by an out-of-date picture, and it can go unstable.
:::

::: context hydrostatic A column of air holding itself up
"Hydrostatic" means "fluid standing still". Picture the air above you as a tall stack of thin blankets. The bottom blanket carries the weight of every blanket above, so it is squeezed hardest. Climb up, and there is less weight above you, so the pressure drops. Because squeezed air is also denser, each layer near the ground weighs more, which is why the pressure falls fastest low down and the answer comes out exponential.
:::

::: context momentum-picture The momentum bookkeeping
Before: one vehicle of mass $m$ moving at $v$. After a tiny time: a slightly lighter vehicle moving slightly faster, and a puff of exhaust of mass $-dm$ moving at $v - v_e$ (slower, in this frame, by the exhaust speed). The total momentum on the right must equal the total on the left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" font-weight="700" fill="#1f2a44">before (time t)</text>
  <rect x="120" y="32" width="70" height="26" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="155" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">m</text>
  <line x1="196" y1="45" x2="250" y2="45" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="258,45 248,40 248,50" fill="#1d6fd1"/>
  <text x="264" y="49" font-size="12" fill="#1f2a44">v</text>
  <line x1="10" y1="72" x2="350" y2="72" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="10" y="92" font-size="12" font-weight="700" fill="#1f2a44">after (time t + dt)</text>
  <rect x="150" y="104" width="66" height="26" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="183" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">m + dm</text>
  <line x1="222" y1="117" x2="282" y2="117" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="290,117 280,112 280,122" fill="#1d6fd1"/>
  <text x="294" y="121" font-size="12" fill="#1f2a44">v + dv</text>
  <circle cx="92" cy="117" r="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="92" y="144" font-size="11" text-anchor="middle" fill="#1f2a44">mass −dm, speed v − v_e</text>
</svg>
```

Multiply each mass by its speed, add, and set after equal to before. The $v\,dm$ pieces cancel, leaving $m\,dv = -v_e\,dm$.
:::

::: context isp-seconds Why specific impulse is in seconds
Dividing $v_e$ by $g_0$ turns meters per second into plain seconds. One way to picture it: $I_{sp}$ is how many seconds a kilogram of propellant can keep producing a thrust equal to its own weight on Earth. A big plus is that the number is the same whether an engineer works in SI or in pounds, so American and European engine data can be compared directly. Kerosene engines reach about $280$–$350\,\mathrm{s}$, hydrogen engines about $450\,\mathrm{s}$.
:::

::: context log-curve The logarithm's slow climb
Each point on the curve is the ideal $\Delta v$, in units of $v_e$, for a given mass ratio. Doubling the mass ratio from $10$ to $20$ adds only $\ln 2 = 0.69\,v_e$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 43.0,161.1 46.0,153.8 49.1,147.6 52.1,142.3 58.1,133.3 64.2,126.1 70.2,119.9 76.2,114.5 88.3,105.6 100.4,98.3 112.5,92.2 124.6,86.8 136.7,82.1 148.8,77.9 172.9,70.6 197.1,64.4 221.2,59.1 245.4,54.4 269.6,50.2 293.8,46.4 330.0,41.2"/>
  <circle cx="148.75" cy="77.9" r="3.5" fill="#b4232c"/>
  <circle cx="269.58" cy="50.2" r="3.5" fill="#b4232c"/>
  <text x="150" y="96" font-size="11" fill="#1f2a44">MR 10: 2.30 v_e</text>
  <text x="228" y="70" font-size="11" fill="#1f2a44">MR 20: 3.00 v_e</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="185">1</text><text x="88.3" y="185">5</text><text x="148.8" y="185">10</text><text x="209.2" y="185">15</text><text x="269.6" y="185">20</text><text x="330" y="185">25</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="174">0</text><text x="34" y="134">1</text><text x="34" y="94">2</text><text x="34" y="54">3</text>
  </g>
  <text x="190" y="199" font-size="11" text-anchor="middle" fill="#1f2a44">mass ratio m₀/m_f</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">Δv / v_e</text>
</svg>
```
:::

::: context tsiolkovsky Who Tsiolkovsky was
Konstantin Tsiolkovsky (1857–1935) was a Russian schoolteacher who worked out much of the theory of spaceflight on his own. He published this equation in 1903, in a paper on exploring space with reaction devices — rockets. An equivalent result had appeared in 1813 in a British treatise on military rockets by William Moore, but Tsiolkovsky was the first to apply it to reaching space, and his name stuck.
:::

::: context ballistic-coefficient What the ballistic coefficient tells you
$\beta = m/(C_D A)$ compares how much mass is pushing forward with how much drag area is holding it back. A heavy, slim object has a large $\beta$: it barely notices the air and plunges deep before slowing. A light, broad one has a small $\beta$ and slows high up, where the air is thin. That is why entry capsules are blunt and wide, and why a parachute works by making $C_D A$ enormous.
:::

::: context rtg Nuclear batteries in space
A radioisotope thermoelectric generator (RTG) turns the heat of decaying plutonium-238 into electricity with no moving parts. Far from the Sun, solar panels do not collect enough light, so deep-space probes such as Voyager, Cassini and New Horizons carry RTGs, as does the Perseverance rover on Mars. Because the decay follows $e^{-t/\tau}$, mission planners know years ahead how much power will be left.
:::
