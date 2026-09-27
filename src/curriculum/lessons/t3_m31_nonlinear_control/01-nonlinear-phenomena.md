---
id: l01-nonlinear-phenomena
title: Four things a linear model cannot do
minutes: 26
covers:
  - 'Nonlinear phenomena: multiple equilibria, limit cycles, finite escape time, bifurcation'
---

Push a child on a swing twice as hard and the swing goes about twice as high. That "twice the cause, twice the effect" habit is what **linear** means, and every control tool you have used so far leans on it: the transfer function, the state-space pair $(\mathbf{A}, \mathbf{B})$, the pole map, the gain and phase margin.

A linear system keeps four promises. It has exactly one resting point (or a whole flat family of them). Its response scales with its input. Its stability does not depend on how hard you hit it. And it can never reach infinity in a finite amount of time. Real vehicles break all four.

This lesson works through the four behaviors with real numbers: **multiple equilibria** (several resting points), **limit cycles** (an oscillation that holds its own size), **finite escape time** (reaching infinity at a clock time you can name), and **bifurcation** (the whole picture changing suddenly as a setting drifts).

None of these is exotic. A gravity-gradient satellite has four pitch resting points. A spacecraft holding attitude on cold-gas thrusters oscillates in a limit cycle for its whole mission, spending propellant on every swing. An aircraft pushed past a fold in its trim curve departs — loses control — and no amount of elevator brings it back. A loop that looks perfectly stable in linear analysis can be useless because its safe region is as small as the sensor noise.

## Why linearity was doing so much work

A linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ works like a recipe: double every ingredient and you get double the cake. Here $\mathbf{x}$ is the **state** — the list of numbers (angles, rates) that says where the system is — and $\dot{\mathbf{x}}$, read "x dot", is how fast that state is changing. A nonlinear system is written $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$, where $\mathbf{f}$ can be any rule at all, and two properties vanish.

**[[Superposition|superposition]].** Suppose $\mathbf{x}_a(t)$ is the response to input $\mathbf{u}_a$, and $\mathbf{x}_b(t)$ the response to $\mathbf{u}_b$. In a linear system, the response to $\alpha\mathbf{u}_a + \beta\mathbf{u}_b$ is $\alpha\mathbf{x}_a + \beta\mathbf{x}_b$ ($\alpha$ and $\beta$, "alpha" and "beta", are any two numbers). That is what lets you quote one frequency response for every amplitude. In a nonlinear system it fails. A $1^\circ$ step and a $10^\circ$ step give responses of different shapes, and there is no single frequency response.

**Stability belongs to a place, not to the system.** For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, the eigenvalues of $\mathbf{A}$ decide everything, everywhere. In a nonlinear system, stability is a property of one particular resting point and of some region around it. So the right question is never "is this system stable?" It is "is this resting point stable, and from how far away?"

::: key
A nonlinear system $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ obeys no superposition, so the shape of the response depends on its size. Stability is a property of an equilibrium point $\mathbf{x}_e$ (where $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$) together with a region around it, not of the system as a whole. Different equilibria of the same system can have different stability.
:::

## Multiple equilibria

A marble in an egg carton can rest in any of the cups. It can also, with great care, balance on one of the bumps between them. Every cup and bump is a resting point. Nudge the marble in a cup and it rolls back; nudge it on a bump and it rolls away.

An **equilibrium** is a state where $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$ — the rate of change is zero, so if the system starts there it stays there. For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with $\mathbf{A}$ invertible, there is exactly one: the origin. A nonlinear $\mathbf{f}$ can be zero in many places, and usually is.

The standard spacecraft case is the pitch motion of a **[[gravity-gradient|gravity-gradient]]** satellite. Gravity pulls a little harder on the end of the satellite nearer the Earth, and that difference makes a small torque. Let $\theta$ ("theta") be the pitch angle measured from the local vertical, $n$ the **[[orbit rate|orbit-rate]]** (how fast the satellite goes around, in radians per second), and $I_x$, $I_y$, $I_z$ the moments of inertia about the three body axes (how hard each axis is to spin up). The pitch equation is

$$
I_y\ddot{\theta} + \tfrac{3}{2}n^2 (I_x - I_z)\sin 2\theta = 0 .
$$

Here $\ddot{\theta}$ ("theta double dot") is the angular acceleration. Using $\sin 2\theta = 2\sin\theta\cos\theta$, this is the same as $\ddot{\theta} = -k\sin\theta\cos\theta$, with $k = 3n^2(I_x - I_z)/I_y$.

The right-hand side is zero whenever $\sin\theta = 0$ or $\cos\theta = 0$. That happens at $\theta = 0, \pi/2, \pi, 3\pi/2$: four equilibria around the circle, not one.

- **Near $\theta = 0$.** Write $\theta = \varepsilon$ ("epsilon", a small error). For small angles $\sin 2\varepsilon \approx 2\varepsilon$, so $\ddot{\varepsilon} = -k\varepsilon$. When $k > 0$ this is a spring: the satellite swings back and forth at angular frequency $\sqrt{k}$.
- **Near $\theta = \pi/2$.** Write $\theta = \pi/2 + \varepsilon$. Then $\sin(\pi + 2\varepsilon) = -\sin 2\varepsilon \approx -2\varepsilon$, so $\ddot{\varepsilon} = +k\varepsilon$. The sign has flipped. The "spring" now pushes the error away, and it grows exponentially at rate $\sqrt{k}$.

Same satellite, two resting points with opposite verdicts. The unstable ones are **saddles** — like a mountain pass, where you can balance on the path but any slip sends you downhill.

::: example Four equilibria on one satellite
Take a satellite bus with $I_x = 1200$, $I_y = 1500$, $I_z = 400\,\mathrm{kg\,m^2}$ in a $400\,\mathrm{km}$ circular orbit. The orbit radius is $a = 6378 + 400 = 6778\,\mathrm{km}$ and Earth's $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$.

**Orbit rate.** $n = \sqrt{\mu/a^3} = 1.131\times 10^{-3}\,\mathrm{rad/s}$. One orbit takes $2\pi/n$, about $92.6\,\mathrm{min}$ — the familiar low-orbit period, as it should be.

**The constant $k$.** Put the numbers in:

$$
k = \frac{3n^2(I_x - I_z)}{I_y} = \frac{3(1.131\times10^{-3})^2(800)}{1500} = 2.048\times 10^{-6}\,\mathrm{s^{-2}} .
$$

So $\sqrt{k} = 1.431\times 10^{-3}\,\mathrm{rad/s}$.

**The stable equilibria.** At $\theta = 0$ and $\theta = \pi$ the satellite's $z$-axis (its long, low-inertia axis) points along the local vertical, down or up. It swings about them with period $2\pi/\sqrt{k} = 4390\,\mathrm{s}$, which is $73.2\,\mathrm{min}$.

**The saddles.** At $\theta = \pm\pi/2$ the long axis lies along the direction of flight. There the error grows like $e^{1.431\times10^{-3}t}$, doubling every $\ln 2/\sqrt{k} = 484\,\mathrm{s}$, about eight minutes. Gravity gradient alone will never hold that attitude.

**Now watch superposition fail.** Integrate the exact equation $\ddot{\theta} = -k\sin\theta\cos\theta$ (fourth-order Runge–Kutta, time step $0.01\,\mathrm{s}$), releasing the satellite from rest at different angles, and time each swing, called a **libration**:

| Release amplitude | Libration period |
| --- | --- |
| $5^\circ$ | $4399\,\mathrm{s}$ (73.3 min) |
| $30^\circ$ | $4712\,\mathrm{s}$ (78.5 min) |
| $60^\circ$ | $6027\,\mathrm{s}$ (100.5 min) |
| $85^\circ$ | $10710\,\mathrm{s}$ (178.5 min) |

A linear model says $73.2\,\mathrm{min}$ for every row; the $5^\circ$ swing agrees to two tenths of a percent. The $85^\circ$ swing is off by a factor of $2.4$: the restoring torque, proportional to $\sin 2\theta$, weakens as $\theta$ nears the saddle at $90^\circ$, so the satellite dawdles there. A period that depends on amplitude is a nonlinear fingerprint; no linear system does it.
:::

## Limit cycles

Think of an old grandfather clock. Start its pendulum with a small push or a big one, and after a while it swings through exactly the same arc. The clock's escapement adds a little energy each swing when the swing is small and cannot keep up when it is large, so the swing settles on a size of its own.

That is a **limit cycle**: an *isolated* closed loop that the system runs around forever. Nearby motions spiral onto it (a stable limit cycle) or away from it (an unstable one).

"Isolated" is the important word. The undamped oscillator from the ODE module — a pole pair exactly on the imaginary axis, called a linear **center** — also runs in closed loops, but a nested family of them, one through every starting point. Its amplitude is whatever you gave it. A limit cycle has an amplitude of its own and returns to it after a disturbance.

The textbook example is the **[[van der Pol oscillator|van-der-pol]]**:

$$
\ddot{x} - \mu(1 - x^2)\dot{x} + x = 0 .
$$

Here $\mu$ ("mu") is a positive constant that sets how strong the nonlinear effect is. Read the middle term, $-\mu(1 - x^2)\dot{x}$, as friction whose strength depends on how far out you are. When $|x| < 1$ it is *negative* friction: it pumps energy in, so small swings grow. When $|x| > 1$ it is positive friction: it drains energy, so big swings shrink. Somewhere between, the energy in and the energy out balance over each loop. For small $\mu$ that balance happens at an amplitude close to $2$.

::: example The van der Pol cycle from both sides
Take $\mu = 0.3$. Integrate for $200\,\mathrm{s}$ with a time step of $1\,\mathrm{ms}$ from two very different starting points, and measure the last $50\,\mathrm{s}$:

| Initial state | Final amplitude | Final period |
| --- | --- | --- |
| $(x, \dot{x}) = (0.1, 0)$ | $2.0009$ | $6.3185\,\mathrm{s}$ |
| $(x, \dot{x}) = (3.0, 0)$ | $2.0009$ | $6.3184\,\mathrm{s}$ |

One run grew twentyfold, the other shrank by a third, and both arrived at the same loop to five figures.

The frequency is $2\pi/6.3185 = 0.9944\,\mathrm{rad/s}$. That is close to the linear $1\,\mathrm{rad/s}$, as it should be for small $\mu$.

A spacecraft on thrusters does exactly this when its deadband and thrusters interact; predicting the size without simulation is the job of describing functions, later in this module.

```python
import numpy as np

MU = 0.3

def vdp(x):
    return np.array([x[1], MU * (1 - x[0] ** 2) * x[1] - x[0]])

def rk4(f, x0, dt, T):
    x = np.array(x0, float)
    out = [x.copy()]
    for _ in range(int(round(T / dt))):
        k1 = f(x); k2 = f(x + 0.5 * dt * k1)
        k3 = f(x + 0.5 * dt * k2); k4 = f(x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        out.append(x.copy())
    return np.array(out)

for start in ([0.1, 0.0], [3.0, 0.0]):
    tail = rk4(vdp, start, 1e-3, 200.0)[150_000:]
    print(start, round(float(np.max(np.abs(tail[:, 0]))), 4))
# [0.1, 0.0] 2.0009
# [3.0, 0.0] 2.0009
```
:::

::: key
A limit cycle is an isolated periodic orbit of a nonlinear system. Its amplitude and period are properties of the system, not of the initial condition, and nearby trajectories converge onto it (stable) or leave it (unstable). A linear system cannot have one: its closed orbits, when they exist, come in a continuum and their amplitude is whatever you gave it.
:::

## Finite escape time

Imagine a savings account whose interest rate rises as the balance grows. An ordinary account grows exponentially — fast, but always finite. This strange one can reach infinity on a particular date.

A linear unstable system is the ordinary account: it grows like $e^{\sigma t}$ ($\sigma$, "sigma", is the growth rate). A nonlinear system can be the strange one, with no solution at all after its date. The cleanest case is

$$
\dot{x} = x^2, \qquad x(0) = x_0 > 0 \quad\Longrightarrow\quad x(t) = \frac{x_0}{1 - x_0 t}.
$$

To get this, **separate the variables**: put everything with $x$ on one side and everything with $t$ on the other, $x^{-2}\,dx = dt$. Integrate both sides: $-1/x = t + C$. At $t = 0$ this gives $C = -1/x_0$. Solve for $x$ and you get the formula above.

The bottom of the fraction, $1 - x_0 t$, reaches zero at $t = 1/x_0$. That moment is the **escape time**. The solution blows up there, and nothing exists after it.

With $x_0 = 0.2$: $x = 0.25$ at $1\,\mathrm{s}$, $x = 1$ at $4\,\mathrm{s}$, $x = 10$ at $4.9\,\mathrm{s}$, $x = 100$ at $4.99\,\mathrm{s}$, and no answer at all at $5\,\mathrm{s}$.

Notice how quiet the first eighty percent of that run is: at $t = 1\,\mathrm{s}$ the state has moved 25 percent. Finite escape gives no warning in the data.

::: note Why it has to be true: the general escape time
Take $\dot{x} = c\,x^p$ with $c > 0$, power $p > 1$, and $x_0 > 0$. Separate: $x^{-p}\,dx = c\,dt$. Integrate from the start $x_0$ all the way to $x = \infty$, which is reached at time $T$:

$$
\int_{x_0}^{\infty} x^{-p}\,dx = \frac{x_0^{1-p}}{p - 1} = c\,T
\quad\Longrightarrow\quad
T = \frac{x_0^{1-p}}{c(p-1)} .
$$

The integral on the left is finite only because $p > 1$: the area under $x^{-p}$ out to infinity is finite. For $p = 1$ (the linear case) it is infinite, which is why a linear system can never escape in finite time. For $\dot{x} = x^2$ ($c = 1$, $p = 2$) the formula gives $T = 1/x_0$, as found above.
:::

::: example A destabilizing moment that grows faster than the angle
An aerodynamic moment that pushes the nose away and gets stronger as the angle grows gives the same behavior on a vehicle. Model the pitch axis as $J\ddot{\alpha} = k\alpha^3$, where $\alpha$ ("alpha") is the angle of attack (incidence), $J = 90\,\mathrm{kg\,m^2}$ and $k = 400\,\mathrm{N\,m/rad^3}$. Dividing by $J$: $\ddot{\alpha} = a\alpha^3$ with $a = 400/90 = 4.444\,\mathrm{s^{-2}}$.

**Step 1: find the rate.** Multiply both sides by $\dot{\alpha}$. The left becomes the rate of change of $\tfrac{1}{2}\dot{\alpha}^2$, and the right the rate of change of $\tfrac{a}{4}\alpha^4$. Integrate from rest at $\alpha_0$:

$$
\tfrac{1}{2}\dot{\alpha}^2 = \tfrac{a}{4}\left(\alpha^4 - \alpha_0^4\right) \quad\Longrightarrow\quad
\dot{\alpha} = \sqrt{\tfrac{a}{2}\left(\alpha^4 - \alpha_0^4\right)} .
$$

**Step 2: add up the time.** Time is distance over speed, piece by piece, so the time to reach infinite incidence is

$$
T = \int_{\alpha_0}^{\infty}\frac{d\alpha}{\sqrt{\tfrac{a}{2}(\alpha^4 - \alpha_0^4)}}
 = \frac{1}{\alpha_0\sqrt{a/2}}\int_{1}^{\infty}\frac{du}{\sqrt{u^4 - 1}} ,
$$

where the second form substitutes $u = \alpha/\alpha_0$. The remaining integral is a **[[pure number|lemniscate]]**, $1.3110$, evaluated numerically (the substitutions $u = 1 + v^2$ near the lower end and $u = 1/w$ for the tail tame both ends).

**Step 3: plug in.** With $\alpha_0 = 2.865^\circ = 0.0500\,\mathrm{rad}$,

$$
T = \frac{1.3110}{0.0500\sqrt{2.222}} = 17.59\,\mathrm{s} .
$$

**Check.** Runge–Kutta at a $0.1\,\mathrm{ms}$ step agrees, and shows the run's shape: $3.29^\circ$ at $5\,\mathrm{s}$, $5.12^\circ$ at $10\,\mathrm{s}$, $14.8^\circ$ at $15\,\mathrm{s}$, $21.8^\circ$ at $15.83\,\mathrm{s}$, $214^\circ$ at $17.41\,\mathrm{s}$, and $1992^\circ$ at $17.57\,\mathrm{s}$. The first $7.7\,\mathrm{s}$ — under half of the $17.6\,\mathrm{s}$ — are spent below $4^\circ$.

**What it means.** No airframe has a cubic moment out to $200^\circ$, so the model stops describing a real vehicle long before $17.59\,\mathrm{s}$. A finite escape time does not say "the incidence becomes infinite". It says "these equations have nothing to say after $T$, and the vehicle is somewhere your model never went."
:::

::: warning
A simulation that returns `inf` or `nan` is not automatically an integrator bug. Shrinking the time step will not fix a genuine finite escape. It will only move the failure a little later and make the run longer. Before reaching for a smaller step, check whether a closed-form escape time exists — for $\dot{x} = cx^p$ with $p > 1$ it is $T = x_0^{1-p}/(c(p-1))$ — and compare it with the time at which your run died.
:::

## Bifurcation

Press down on a plastic ruler standing on a table. Press gently and it stays straight. Past a certain force it suddenly bows out left or right: one resting shape has become a choice of two.

That sudden change is a **[[bifurcation|bifurcation-word]]**: a change in the *kind* of behavior as a setting (a **parameter**) crosses a critical value. Equilibria appear, vanish, collide, or swap stability. On a real vehicle the parameter is usually something that drifts — **[[dynamic pressure|dynamic-pressure]]**, mass, a gain, a control deflection — which makes this a flight-safety topic.

Three local bifurcations cover most of what you will meet. Each has a simplest-possible equation, called its **normal form**, that shows its shape. In each, $\mu$ is the parameter.

- **Saddle-node (fold)**, $\dot{x} = \mu - x^2$. For $\mu > 0$ there are two equilibria at $\pm\sqrt{\mu}$, one stable and one unstable. At $\mu = 0$ they collide. For $\mu < 0$ there are none. Equilibria are born and die in pairs.
- **Pitchfork**, $\dot{x} = \mu x - x^3$. For $\mu < 0$ there is one stable equilibrium, at the origin. For $\mu > 0$ the origin turns unstable and two new stable equilibria appear at $\pm\sqrt{\mu}$. This is the ruler: a symmetric system breaking its symmetry.
- **Hopf**, where a complex pair of eigenvalues crosses the imaginary axis and a periodic orbit is born. In the *supercritical* case the new cycle is stable and small: the equilibrium goes gently from stable to a small oscillation. In the *subcritical* case an *unstable* cycle surrounds a stable equilibrium before the crossing, and shrinks onto it. The equilibrium loses stability by having its safe region squeezed down to nothing.

The **[[subcritical Hopf|subcritical-hopf]]** deserves numbers, because it is the mechanism behind the most dangerous sentence in control engineering: "the linearized model is stable."

Take the normal form for the radius $r$ (distance from the origin): $\dot{r} = \mu r + r^3 - r^5$, with $\mu = -0.1$. Near the origin $\dot{r} \approx -0.1\,r$, so it is linearly stable, with eigenvalue real part $\mu = -0.1$.

The cycles are the radii where $\dot{r} = 0$ with $r > 0$, so $\mu + r^2 - r^4 = 0$. This is a quadratic in $r^2$, with solutions $r^2 = \tfrac{1}{2}(1 \pm \sqrt{1 + 4\mu})$. That gives $r = 0.3357$ and $r = 0.9420$.

Now simulate. Use the planar system $\dot{x} = \lambda x - y$, $\dot{y} = x + \lambda y$ with $\lambda = \mu + r^2 - r^4$ (whose radius obeys exactly the equation above), and run each start for $200\,\mathrm{s}$:

- start at $r_0 = 0.30$: ends at $r = 0.0000$;
- start at $r_0 = 0.33$: ends at $r = 0.0000$;
- start at $r_0 = 0.34$: ends at $r = 0.9420$;
- start at $r_0 = 0.40$: ends at $r = 0.9420$.

The stable equilibrium is real. But its safe region ends at $r = 0.3357$ — a fence the linearization never mentions.

::: example Losing trim: a fold in the elevator curve
A vehicle can be stable at small incidence and unstable at large incidence. Model its **pitching-moment coefficient** (the nose-up or nose-down twist, in dimensionless form) as

$$
C_m(\alpha, \delta) = -0.9\,\alpha + 6\,\alpha^3 + 1.5\,\delta
$$

per radian, with $\delta$ ("delta") a nose-up elevator deflection.

**Trim** means balanced: $C_m = 0$. **Static stability** at a trim point means that pitching up a little makes a nose-down moment, so $\partial C_m/\partial\alpha < 0$. (The curly $\partial$ is a partial derivative: the slope in $\alpha$ with $\delta$ held fixed.) Here $\partial C_m/\partial\alpha = -0.9 + 18\alpha^2$, which is negative only while $|\alpha| < \sqrt{0.9/18} = 0.2236\,\mathrm{rad} = 12.81^\circ$.

**Where is the fold?** It is the elevator setting at which the trim reaches that edge. Put $\alpha = 0.2236$ into $C_m = 0$ and solve for $\delta$:

$$
\delta_{\text{fold}} = \frac{0.9(0.2236) - 6(0.2236)^3}{1.5} = 0.08944\,\mathrm{rad} = 5.12^\circ .
$$

**Check by solving the cubic** $C_m = 0$ for its roots at several elevator settings:

| $\delta$ | Trim incidences $\alpha$ | $\partial C_m/\partial\alpha$ at each |
| --- | --- | --- |
| $0^\circ$ | $-22.19^\circ$, $0^\circ$, $+22.19^\circ$ | $+1.8$, $-0.9$, $+1.8$ |
| $3.00^\circ$ | $-24.36^\circ$, $+5.30^\circ$, $+19.06^\circ$ | $+2.35$, $-0.75$, $+1.09$ |
| $4.80^\circ$ | $-25.44^\circ$, $+10.08^\circ$, $+15.36^\circ$ | $+2.65$, $-0.34$, $+0.39$ |
| $5.12^\circ$ | $-25.62^\circ$, $+12.49^\circ$, $+13.13^\circ$ | $+2.70$, $-0.04$, $+0.05$ |
| $5.40^\circ$ | $-25.78^\circ$ | $+2.74$ |

The usable trim (negative slope) and the unstable one above it march toward each other as $\delta$ grows. They meet at $12.81^\circ$, and then they are gone.

**Now fly it.** Use the short-period model $\ddot{\alpha} = a_m C_m(\alpha,\delta) - 2.0\,\dot{\alpha}$. Here $a_m = \bar{q}Sc/I_{yy}$, with dynamic pressure $\bar{q} = 15\,\mathrm{kPa}$, wing area $S = 28\,\mathrm{m^2}$, chord $c = 3.5\,\mathrm{m}$ and pitch inertia $I_{yy} = 75000\,\mathrm{kg\,m^2}$:

$$
a_m = \frac{(15\,000)(28)(3.5)}{75\,000} = 19.6\,\mathrm{s^{-2}} .
$$

About $\alpha = 0$ that gives a natural frequency $\omega_n = \sqrt{19.6\times 0.9} = 4.20\,\mathrm{rad/s}$ and damping ratio $\zeta = 2.0/(2\times 4.20) = 0.238$. Ramp the elevator up steadily over $20\,\mathrm{s}$, then hold it:

| $t$ | $\delta$ | $\alpha$, ramp to $4.80^\circ$ | $\alpha$, ramp to $5.40^\circ$ |
| --- | --- | --- | --- |
| $10\,\mathrm{s}$ | $2.40^\circ$ / $2.70^\circ$ | $4.09^\circ$ | $4.64^\circ$ |
| $15\,\mathrm{s}$ | $3.60^\circ$ / $4.05^\circ$ | $6.49^\circ$ | $7.54^\circ$ |
| $20\,\mathrm{s}$ | $4.80^\circ$ / $5.40^\circ$ | $9.80^\circ$ | $13.17^\circ$ |
| $30\,\mathrm{s}$ | hold | $10.080^\circ$ | departed, past $60^\circ$ by $21.6\,\mathrm{s}$ |

The first run settles on the predicted trim of $10.080^\circ$. The second crosses $\delta_{\text{fold}} = 5.12^\circ$ at $t = 18.98\,\mathrm{s}$; from then on there is no trim to hold, and the incidence runs away.

The two runs differ by $0.6^\circ$ of elevator. No gain margin, phase margin or pole location computed about $\alpha = 0$ contains that information.
:::

::: warning
Bifurcation parameters are rarely labeled as such in a requirements document. They arrive as "dynamic pressure at max-Q", "tank mass as propellant depletes", "actuator authority at altitude", or "controller gain after the schedule is retuned". When a nonlinear model is available, sweep the parameter and count the equilibria. The count changing is the warning.
:::

## Check yourself

::: check
The gravity-gradient satellite above is released at $\theta = 89.9^\circ$ with zero rate. Estimate how long until its pitch error has grown to $30^\circ$ from the saddle, and say why the estimate is only an estimate.
:::

::: answer
Near the saddle at $\theta = \pi/2$ the error obeys $\ddot{\varepsilon} = +k\varepsilon$, with $\sqrt{k} = 1.431\times10^{-3}\,\mathrm{s^{-1}}$. Starting from rest at $\varepsilon_0 = 0.1^\circ$, the solution is $\varepsilon = \varepsilon_0\cosh(\sqrt{k}\,t)$. (The **hyperbolic cosine**, $\cosh y = \tfrac{1}{2}(e^{y} + e^{-y})$, is the combination of growing and shrinking exponentials that starts with zero rate.)

Growing to $30^\circ$ means $\cosh(\sqrt{k}t) = 30/0.1 = 300$. So $\sqrt{k}\,t = \operatorname{arccosh}(300) = 6.40$, and $t = 6.40/(1.431\times10^{-3}) = 4470\,\mathrm{s}$. That is about $75\,\mathrm{min}$ — roughly one orbit.

It is only an estimate because it uses $\sin 2\varepsilon \approx 2\varepsilon$. At $30^\circ$ the true push-away term, $\tfrac{1}{2}\sin 2\varepsilon = 0.433$, is about 17 percent weaker than the linear $\varepsilon = 0.524\,\mathrm{rad}$, so the real error grows a little more slowly near the end. Integrating the exact equation gives $4486\,\mathrm{s}$, only $16\,\mathrm{s}$ later, because most of the time is spent at small angles.
:::

::: check
For $\dot{x} = 2x^3$ with $x(0) = 0.5$, find the escape time in closed form and evaluate it.
:::

::: answer
Separate: $x^{-3}\,dx = 2\,dt$. Integrating gives $-\tfrac{1}{2}x^{-2} = 2t + C$. At $t = 0$: $C = -\tfrac{1}{2}(0.5)^{-2} = -\tfrac{1}{2}(4) = -2$.

Multiply through by $-2$: $x^{-2} = 4 - 4t$, so $x(t) = 1/(2\sqrt{1 - t})$. The square root reaches zero at $t = 1$, so the escape time is $T = 1\,\mathrm{s}$.

Check against the general rule $T = x_0^{1-p}/(c(p-1))$ with $c = 2$, $p = 3$, $x_0 = 0.5$. The exponent is $1 - p = -2$, so $x_0^{-2} = 1/0.25 = 4$, and $T = 4/(2\times 2) = 1\,\mathrm{s}$. The two agree. Write negative exponents out in full rather than reading $x_0^{1-p}$ as $x_0^{2}$ — that is the slip this formula invites.
:::

::: check
A colleague reports that their thruster-controlled attitude loop "oscillates at $0.22\,\mathrm{Hz}$ with about $0.4^\circ$ amplitude, and it comes back to that amplitude whatever we do to it." Is that a marginally stable linear mode or a limit cycle, and how would you tell them apart from data alone?
:::

::: answer
It is a limit cycle. A marginally stable linear mode keeps whatever amplitude the last disturbance left it with: nudge it, and the new amplitude stays. A limit cycle has an amplitude of its own and returns to it.

So inject a pulse that doubles the amplitude and watch. If it returns to $0.4^\circ$ over some tens of seconds, it is a stable limit cycle. If it stays at $0.8^\circ$ forever, it is a linear center.

A second clue: thruster limit cycles are visibly not sine waves, with straight coasting stretches between pulses.
:::

::: check
In the trim example, is $\delta = 4.80^\circ$ a safe operating point? The table says the trim exists and is statically stable.
:::

::: answer
It exists, but the margin is thin in two different senses.

**In the parameter.** The fold is at $5.12^\circ$, so only $0.32^\circ$ more elevator destroys the trim.

**In the state.** The stable trim at $10.08^\circ$ and the unstable one at $15.36^\circ$ are only $5.3^\circ$ apart. That unstable trim is the edge of the safe region: a gust that pushes incidence past $15.36^\circ$ departs, even with the elevator held still.

Static stability at the operating point ($\partial C_m/\partial\alpha = -0.34$, already weak) says nothing about either margin. Estimating that safe region — the region of attraction — is a later lesson in this module.
:::

::: check
Name one qualitative behavior from this lesson that a linear model *can* reproduce, and explain why it is the exception.
:::

::: answer
Sustained oscillation. A linear system with a pole pair exactly on the imaginary axis oscillates forever at a fixed frequency, which looks like a limit cycle on a plot.

It is an exception only in appearance. The linear oscillation is not isolated, its amplitude is set by the initial condition, and it needs a parameter tuned to a knife edge — add any real damping and it becomes a decaying spiral. Multiple equilibria, finite escape and bifurcation have no linear counterpart at all.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$ | Equilibrium; a nonlinear system may have many, with different stability |
| $\ddot{\theta} = -k\sin\theta\cos\theta$, $k = 3n^2(I_x - I_z)/I_y$ | Gravity-gradient pitch: centers at $0, \pi$; saddles at $\pm\pi/2$ |
| $k = 2.048\times10^{-6}\,\mathrm{s^{-2}}$ at $400\,\mathrm{km}$ | Libration period $73.2\,\mathrm{min}$; saddle doubling time $484\,\mathrm{s}$ |
| Amplitude-dependent period | $73.3$, $78.5$, $100.5$, $178.5\,\mathrm{min}$ at $5^\circ$, $30^\circ$, $60^\circ$, $85^\circ$ |
| Limit cycle | Isolated periodic orbit; amplitude is a property of the system |
| $\ddot{x} - \mu(1-x^2)\dot{x} + x = 0$ | Van der Pol; at $\mu = 0.3$, amplitude $2.0009$, period $6.319\,\mathrm{s}$ |
| $\dot{x} = x^2 \Rightarrow x = x_0/(1 - x_0t)$ | Finite escape at $T = 1/x_0$; generally $T = x_0^{1-p}/(c(p-1))$ for $\dot{x} = cx^p$ |
| $\ddot{\alpha} = a\alpha^3$, $a = 4.444\,\mathrm{s^{-2}}$, $\alpha_0 = 0.05$ | Escape at $T = 17.59\,\mathrm{s}$ |
| Saddle-node $\dot{x} = \mu - x^2$ | Two equilibria collide and vanish at $\mu = 0$ |
| Pitchfork $\dot{x} = \mu x - x^3$ | Origin loses stability, two new equilibria appear |
| Subcritical Hopf $\dot{r} = \mu r + r^3 - r^5$ | At $\mu = -0.1$: stable origin, unstable cycle at $r = 0.3357$, stable cycle at $0.9420$ |
| $C_m = -0.9\alpha + 6\alpha^3 + 1.5\delta$ | Fold at $\alpha = 12.81^\circ$, $\delta = 5.12^\circ$; trim lost beyond |

The next lesson takes the tool the ODE module already gave you — the phase plane, with its trace–determinant chart for $2\times 2$ linear systems — and uses it to read these pictures directly: where the equilibria are, what each one looks like close up, and how the separatrices divide the plane into regions with different fates.

::: context superposition Why superposition is worth so much
Superposition means you can break a hard input into easy pieces, solve each piece, and add the answers. Engineers use it constantly without noticing. A frequency response is superposition: any signal is a sum of sine waves, so knowing the response to each sine wave tells you the response to everything. So is a step response built from impulses, and so is a Bode plot that holds for every amplitude.

Lose superposition and every one of those shortcuts is gone. The response to a big input is no longer a scaled-up response to a small one, so you must test each size separately. That is why nonlinear analysis leans so heavily on simulation — and on the Lyapunov tools later in this module, which reason about all sizes at once.
:::

::: context gravity-gradient How gravity can hold a satellite steady
Gravity weakens with distance. A long satellite has one end slightly closer to the Earth than the other, so that end is pulled slightly harder. The result is a tiny torque that tries to line the satellite's long axis up with the local vertical, like a pendulum hanging down.

The picture shows the torque around a full turn of pitch. Where the curve crosses zero, the satellite is balanced. At $0^\circ$ and $180^\circ$ the torque pushes it back (the arrows point inward): stable. At $90^\circ$ and $270^\circ$ it pushes it away: saddles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
<line x1="30" y1="70" x2="334" y2="70" stroke="#6c7a93" stroke-width="1"/>
<polyline points="30.0,70.0 32.5,73.8 35.0,77.5 37.5,81.1 40.0,84.6 42.5,88.0 45.0,91.2 47.5,94.1 50.0,96.8 52.5,99.1 55.0,101.2 57.5,102.9 60.0,104.2 62.5,105.2 65.0,105.8 67.5,106.0 70.0,105.8 72.5,105.2 75.0,104.2 77.5,102.9 80.0,101.2 82.5,99.1 85.0,96.8 87.5,94.1 90.0,91.2 92.5,88.0 95.0,84.6 97.5,81.1 100.0,77.5 102.5,73.8 105.0,70.0 107.5,66.2 110.0,62.5 112.5,58.9 115.0,55.4 117.5,52.0 120.0,48.8 122.5,45.9 125.0,43.2 127.5,40.9 130.0,38.8 132.5,37.1 135.0,35.8 137.5,34.8 140.0,34.2 142.5,34.0 145.0,34.2 147.5,34.8 150.0,35.8 152.5,37.1 155.0,38.8 157.5,40.9 160.0,43.2 162.5,45.9 165.0,48.8 167.5,52.0 170.0,55.4 172.5,58.9 175.0,62.5 177.5,66.2 180.0,70.0 182.5,73.8 185.0,77.5 187.5,81.1 190.0,84.6 192.5,88.0 195.0,91.2 197.5,94.1 200.0,96.8 202.5,99.1 205.0,101.2 207.5,102.9 210.0,104.2 212.5,105.2 215.0,105.8 217.5,106.0 220.0,105.8 222.5,105.2 225.0,104.2 227.5,102.9 230.0,101.2 232.5,99.1 235.0,96.8 237.5,94.1 240.0,91.2 242.5,88.0 245.0,84.6 247.5,81.1 250.0,77.5 252.5,73.8 255.0,70.0 257.5,66.2 260.0,62.5 262.5,58.9 265.0,55.4 267.5,52.0 270.0,48.8 272.5,45.9 275.0,43.2 277.5,40.9 280.0,38.8 282.5,37.1 285.0,35.8 287.5,34.8 290.0,34.2 292.5,34.0 295.0,34.2 297.5,34.8 300.0,35.8 302.5,37.1 305.0,38.8 307.5,40.9 310.0,43.2 312.5,45.9 315.0,48.8 317.5,52.0 320.0,55.4 322.5,58.9 325.0,62.5 327.5,66.2 330.0,70.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
<text x="30.0" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">0°</text>
<circle cx="30.0" cy="70" r="5" fill="#1f2a44"/>
<text x="105.0" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">90°</text>
<circle cx="105.0" cy="70" r="5" fill="white" stroke="#b4232c" stroke-width="2"/>
<text x="180.0" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">180°</text>
<circle cx="180.0" cy="70" r="5" fill="#1f2a44"/>
<text x="255.0" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">270°</text>
<circle cx="255.0" cy="70" r="5" fill="white" stroke="#b4232c" stroke-width="2"/>
<text x="330.0" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">360°</text>
<circle cx="330.0" cy="70" r="5" fill="#1f2a44"/>
<polygon points="59.5,70 71.5,65 71.5,75" fill="#b4232c"/>
<polygon points="150.5,70 138.5,65 138.5,75" fill="#b4232c"/>
<polygon points="209.5,70 221.5,65 221.5,75" fill="#b4232c"/>
<polygon points="300.5,70 288.5,65 288.5,75" fill="#b4232c"/>
<text x="30" y="14" font-size="11" fill="#1d6fd1">torque on the satellite</text>
<text x="105" y="100" font-size="11" fill="#b4232c" text-anchor="middle">saddle</text>
<text x="255" y="100" font-size="11" fill="#b4232c" text-anchor="middle">saddle</text>
<text x="180" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">stable</text>
<text x="180" y="145" font-size="11" fill="#1f2a44" text-anchor="middle">pitch angle θ</text>
</svg>
```

The torque is tiny — for the example bus it gives a swing period of over an hour — but it costs no power and no propellant. Many small satellites have used a long deployable boom with a tip mass to make the effect strong enough to rely on.
:::

::: context orbit-rate The orbit rate n
The orbit rate $n$ is how many radians of the orbit the satellite covers each second. A full orbit is $2\pi$ radians, so $n = 2\pi/P$, where $P$ is the period. Astronomers call it the **mean motion**.

For a circular orbit, $n = \sqrt{\mu/a^3}$, where $a$ is the distance from Earth's center. At $400\,\mathrm{km}$ altitude, $n = 1.131\times10^{-3}\,\mathrm{rad/s}$ and $P = 92.6\,\mathrm{min}$. Farther out, $n$ drops quickly: at geostationary distance the orbit takes a full day.

The gravity-gradient torque grows like $n^2$, so it is strongest in low orbit and far weaker out at geostationary height.
:::

::: context van-der-pol A radio engineer's oscillator
Balthasar van der Pol was a Dutch physicist who studied electrical circuits built around vacuum tubes in the 1920s. Those circuits oscillated at a steady size of their own, and his equation was a model of why: the tube acts like negative resistance for small signals and positive resistance for large ones.

The picture shows the phase plane — position $x$ across, rate $\dot{x}$ up — for $\mu = 0.3$. A run from $0.1$ spirals outward, a run from $3$ spirals inward, and both end on the same loop, which crosses the $x$ axis at $\pm 2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 216" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="108" x2="330" y2="108" stroke="#6c7a93"/><line x1="180" y1="22" x2="180" y2="200" stroke="#6c7a93"/>
<text x="336" y="112" font-size="12" fill="#1f2a44">x</text><text x="186" y="20" font-size="12" fill="#1f2a44">ẋ</text>
<polyline points="183.8,108.0 183.8,108.3 183.7,108.6 183.7,108.8 183.6,109.1 183.5,109.4 183.3,109.7 183.1,110.0 182.9,110.3 182.7,110.5 182.4,110.8 182.2,111.0 181.9,111.2 181.5,111.5 181.2,111.6 180.8,111.8 180.5,111.9 180.1,112.1 179.7,112.2 179.3,112.2 178.9,112.3 178.5,112.3 178.0,112.3 177.6,112.2 177.2,112.1 176.8,112.0 176.5,111.9 176.1,111.7 175.8,111.5 175.4,111.3 175.1,111.0 174.9,110.7 174.6,110.4 174.4,110.0 174.2,109.7 174.1,109.3 174.0,108.9 173.9,108.4 173.9,108.0 173.9,107.6 174.0,107.1 174.1,106.6 174.2,106.2 174.4,105.7 174.7,105.3 175.0,104.8 175.3,104.4 175.7,103.9 176.1,103.5 176.5,103.2 177.0,102.8 177.5,102.5 178.1,102.2 178.6,101.9 179.2,101.7 179.9,101.5 180.5,101.3 181.1,101.2 181.8,101.1 182.5,101.1 183.1,101.2 183.8,101.2 184.4,101.4 185.1,101.6 185.7,101.8 186.2,102.1 186.8,102.4 187.3,102.8 187.8,103.2 188.2,103.7 188.6,104.2 189.0,104.8 189.3,105.3 189.5,106.0 189.6,106.6 189.7,107.3 189.8,108.0 189.7,108.7 189.6,109.5 189.5,110.2 189.2,110.9 188.9,111.7 188.5,112.4 188.1,113.1 187.5,113.8 186.9,114.5 186.3,115.1 185.6,115.7 184.8,116.3 184.0,116.8 183.1,117.3 182.2,117.8 181.2,118.1 180.2,118.4 179.2,118.7 178.2,118.9 177.1,119.0 176.1,119.0 175.0,118.9 174.0,118.8 172.9,118.6 171.9,118.3 171.0,117.9 170.0,117.4 169.2,116.9 168.3,116.3 167.6,115.6 166.9,114.8 166.3,114.0 165.7,113.1 165.3,112.1 164.9,111.1 164.7,110.1 164.5,109.0 164.5,107.9 164.6,106.7 164.7,105.6 165.0,104.4 165.4,103.3 165.9,102.1 166.5,101.0 167.3,99.9 168.1,98.8 169.1,97.7 170.1,96.7 171.2,95.7 172.5,94.9 173.8,94.0 175.1,93.3 176.6,92.6 178.1,92.0 179.7,91.5 181.3,91.1 182.9,90.9 184.6,90.7 186.2,90.7 187.9,90.8 189.5,91.0 191.2,91.4 192.7,91.8 194.3,92.5 195.7,93.2 197.1,94.1 198.4,95.2 199.6,96.3 200.6,97.6 201.6,98.9 202.4,100.4 203.0,101.9 203.5,103.5 203.9,105.2 204.1,106.9 204.1,108.7 203.9,110.4 203.6,112.2 203.1,114.0 202.5,115.7 201.6,117.5 200.6,119.2 199.5,120.9 198.2,122.5 196.7,124.1 195.1,125.6 193.3,127.0 191.4,128.3 189.4,129.6 187.3,130.7 185.0,131.7 182.7,132.6 180.3,133.3 177.8,133.9 175.3,134.3 172.8,134.5 170.2,134.6 167.7,134.4 165.2,133.9 162.7,133.3 160.3,132.4 158.0,131.3 155.8,130.0 153.8,128.5 151.9,126.8 150.2,124.8 148.6,122.8 147.3,120.5 146.2,118.2 145.4,115.8 144.7,113.2 144.4,110.7 144.2,108.1 144.3,105.5 144.7,102.9 145.3,100.3 146.2,97.8 147.3,95.3 148.6,92.9 150.2,90.5 152.0,88.2 154.0,86.0 156.2,83.9 158.6,81.8 161.2,79.9 164.0,78.0 167.0,76.3 170.1,74.8 173.4,73.4 176.8,72.1 180.3,71.1 183.9,70.3 187.5,69.8 191.2,69.6 194.9,69.7 198.6,70.1 202.2,70.9 205.7,72.1 209.1,73.7 212.3,75.6 215.3,77.9 218.1,80.5 220.6,83.4 222.8,86.6 224.7,89.9 226.2,93.4 227.5,97.0 228.4,100.6 228.9,104.2 229.1,107.8 229.0,111.3 228.5,114.8 227.7,118.1 226.5,121.4 225.1,124.5 223.3,127.6 221.3,130.5 219.0,133.4 216.4,136.1 213.6,138.8 210.5,141.3 207.2,143.8 203.6,146.2 199.8,148.4 195.9,150.5 191.7,152.5 187.3,154.2 182.8,155.7 178.1,157.0 173.4,157.9 168.5,158.4 163.7,158.5 158.8,158.1 154.1,157.2 149.4,155.6 144.9,153.6 140.6,150.9 136.7,147.7 133.0,144.0 129.7,140.0 126.9,135.6 124.4,131.0 122.5,126.2 120.9,121.5 119.9,116.7 119.3,112.1 119.1,107.6 119.3,103.3 120.0,99.2 121.0,95.2 122.4,91.5 124.2,88.0 126.3,84.6 128.7,81.3 131.4,78.2 134.4,75.2 137.7,72.3 141.3,69.5 145.1,66.8 149.2,64.1 153.6,61.6 158.1,59.1 163.0,56.8 168.0,54.6 173.2,52.6 178.6,50.9 184.2,49.6 189.9,48.7 195.6,48.3 201.3,48.5 207.0,49.4 212.6,51.0 218.0,53.3 223.1,56.5 227.9,60.3 232.3,64.8 236.2,69.8 239.6,75.2 242.5,80.8 244.8,86.5 246.6,92.2 247.9,97.8 248.6,103.2 248.8,108.3 248.5,113.1 247.8,117.6 246.7,121.9 245.2,125.9 243.3,129.6 241.0,133.2 238.4,136.5 235.5,139.7 232.3,142.8 228.9,145.7 225.1,148.6 221.0,151.4 216.7,154.2 212.1,156.9 207.3,159.6 202.2,162.1 196.9,164.6 191.3,166.8 185.6,168.9 179.6,170.6 173.5,171.9 167.4,172.8 161.1,172.9 154.9,172.4 148.7,171.1 142.8,168.9 137.0,165.8 131.7,161.9 126.7,157.2 122.2,151.8 118.3,146.0 114.9,139.8 112.2,133.5 110.0,127.2 108.5,121.1 107.5,115.2 107.1,109.6 107.2,104.4 107.8,99.5 108.8,95.0 110.2,90.8 112.1,86.9 114.3,83.3 116.8,79.8 119.7,76.6 122.9,73.5 126.3,70.5 130.1,67.5 134.1,64.7 138.4,61.9 143.0,59.1 147.8,56.4 152.9,53.7 158.3,51.1 163.9,48.7 169.7,46.4 175.7,44.3 181.9,42.6 188.3,41.4 194.7,40.7 201.2,40.7 207.7,41.5 214.0,43.2 220.1,45.8 225.9,49.3 231.4,53.8 236.3,59.0 240.8,64.8 244.6,71.1 247.9,77.6 250.5,84.2 252.4,90.7 253.8,97.0 254.6,102.9 254.8,108.5 254.5,113.7 253.7,118.5 252.5,123.0 250.8,127.1 248.8,130.9 246.4,134.5 243.7,137.8 240.7,141.0" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<circle cx="183.8" cy="108.0" r="3.5" fill="#6c7a93"/>
<polyline points="294.0,108.0 293.6,115.5 292.6,121.7 291.0,126.7 289.0,130.8 286.6,134.3 283.9,137.3 281.0,140.0 277.7,142.3 274.3,144.5 270.7,146.6 266.8,148.6 262.8,150.6 258.6,152.7 254.2,154.7 249.5,156.9 244.7,159.1 239.6,161.4 234.4,163.9 228.8,166.4 223.0,169.1 217.0,171.8 210.7,174.6 204.1,177.5 197.2,180.2 190.1,182.8 182.8,185.2 175.2,187.0 167.5,188.3 159.7,188.8 151.9,188.2 144.2,186.4 136.8,183.4 129.7,179.0 123.1,173.4 117.0,166.7 111.7,159.1 107.2,151.1 103.4,142.8 100.4,134.6 98.2,126.7 96.8,119.3 96.0,112.4 95.9,106.2 96.4,100.5 97.3,95.4 98.8,90.8 100.7,86.6 102.9,82.8 105.5,79.3 108.5,76.0 111.7,72.9 115.2,70.0 119.1,67.1 123.2,64.3 127.5,61.6 132.1,58.8 137.0,56.0 142.2,53.2 147.6,50.5 153.3,47.7 159.3,45.1 165.5,42.5 172.0,40.2 178.6,38.1 185.5,36.5 192.5,35.4 199.5,35.1 206.5,35.6 213.5,37.1 220.2,39.7 226.7,43.4 232.7,48.1 238.2,53.8 243.2,60.3 247.4,67.2 251.0,74.4 253.9,81.7 256.1,88.9 257.6,95.7 258.5,102.1 258.8,108.1 258.5,113.6 257.7,118.7 256.5,123.3 254.8,127.5 252.7,131.4 250.3,135.0 247.5,138.4 244.4,141.5 241.0,144.6 237.3,147.6 233.4,150.4 229.1,153.3 224.6,156.1 219.8,158.9 214.7,161.6 209.4,164.4 203.8,167.1 198.0,169.6 191.9,172.1 185.6,174.3 179.1,176.1 172.4,177.5 165.7,178.3 158.9,178.4 152.1,177.7 145.4,175.9 139.0,173.2 132.8,169.4 127.1,164.7 121.9,159.1 117.2,152.8 113.2,146.1 109.9,139.1 107.2,132.1 105.2,125.3 103.9,118.7 103.1,112.6 103.0,106.8" fill="none" stroke="#b4232c" stroke-width="1.2"/>
<circle cx="294.0" cy="108.0" r="3.5" fill="#b4232c"/>
<polyline points="104.6,116.8 104.2,112.9 104.0,109.3 104.0,105.8 104.2,102.5 104.7,99.3 105.3,96.4 106.1,93.5 107.1,90.8 108.2,88.3 109.5,85.8 110.9,83.5 112.5,81.2 114.2,79.1 116.0,77.0 118.0,75.0 120.0,73.0 122.2,71.1 124.6,69.2 127.0,67.4 129.5,65.6 132.2,63.8 134.9,62.0 137.8,60.2 140.8,58.5 143.9,56.7 147.0,55.0 150.3,53.2 153.7,51.6 157.2,49.9 160.8,48.3 164.5,46.7 168.3,45.2 172.2,43.8 176.2,42.6 180.2,41.4 184.3,40.5 188.5,39.7 192.7,39.2 196.9,38.9 201.1,39.0 205.3,39.4 209.5,40.1 213.6,41.2 217.6,42.8 221.6,44.7 225.4,47.0 229.0,49.7 232.5,52.7 235.8,56.1 238.8,59.8 241.7,63.7 244.3,67.7 246.6,72.0 248.7,76.2 250.5,80.6 252.0,84.9 253.3,89.1 254.3,93.3 255.1,97.3 255.7,101.2 256.0,104.9 256.0,108.5 255.9,111.9 255.6,115.1 255.0,118.2 254.3,121.1 253.4,123.8 252.4,126.5 251.2,129.0 249.8,131.4 248.3,133.7 246.7,135.8 244.9,138.0 243.0,140.0 241.0,142.0 238.9,143.9 236.6,145.8 234.2,147.7 231.8,149.5 229.2,151.3 226.5,153.1 223.7,154.9 220.7,156.7 217.7,158.4 214.6,160.2 211.3,161.9 208.0,163.6 204.5,165.3 201.0,166.9 197.3,168.5 193.6,170.0 189.7,171.5 185.8,172.8 181.8,174.0 177.7,175.1 173.6,175.9 169.4,176.6 165.2,177.0 161.0,177.1 156.8,176.9 152.6,176.3 148.4,175.4 144.4,174.1 140.4,172.3 136.5,170.2 132.8,167.7 129.2,164.8 125.8,161.6 122.7,158.1 119.7,154.3 117.0,150.3 114.5,146.2 112.3,141.9 110.4,137.6 108.7,133.3 107.3,129.0 106.1,124.8 105.2,120.7 104.6,116.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<text x="294" y="100" font-size="11" fill="#b4232c" text-anchor="middle">start 3</text>
<text x="14" y="30" font-size="11" fill="#6c7a93">grey: start at 0.1</text>
<text x="14" y="200" font-size="11" fill="#1d6fd1">both end on the same loop</text>
</svg>
```

The same equation has since been used to model heartbeats, vocal cords and flutter. Wherever energy is pumped in at small amplitude and drained at large amplitude, a limit cycle appears.
:::

::: context lemniscate A famous number in disguise
The number $\int_1^{\infty} du/\sqrt{u^4 - 1} = 1.31103$ is not a random constant. It is exactly half of the **lemniscate constant**, $\varpi = 2.62206$ (the symbol is a curly "pi"), which plays the same role for a figure-eight curve called the lemniscate that $\pi$ plays for the circle.

You do not need that fact to use the result. The point of the substitution $u = \alpha/\alpha_0$ is that the whole problem collapses to one fixed number times $1/(\alpha_0\sqrt{a/2})$. Halve the starting angle and you double the escape time, with no new integral to do.
:::

::: context bifurcation-word A fork in the road
"Bifurcation" comes from the Latin *bifurcus*, "two-pronged", the word for a fork. The pitchfork looks like its name: one branch of equilibria splitting into two.

The picture below is a bifurcation diagram for the trim example later in this section. The elevator setting $\delta$ runs across, and every trim incidence $\alpha$ is plotted up. Solid blue trims are stable, dashed red are unstable. At $\delta = 4.8^\circ$ the dotted line meets three trims. Push $\delta$ past the fold at $5.12^\circ$ and the two upper trims have merged and vanished.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 216" font-family="Inter, Arial, sans-serif">
<line x1="30" y1="108.0" x2="330" y2="108.0" stroke="#6c7a93"/><line x1="180" y1="10" x2="180" y2="206" stroke="#6c7a93"/>
<polyline points="87.8,151.5 87.9,150.2 88.3,148.8 89.0,147.4 89.9,146.1 91.0,144.7 92.4,143.4 93.9,142.0 95.7,140.6 97.7,139.3 99.9,137.9 102.3,136.6 104.8,135.2 107.5,133.8 110.4,132.5 113.5,131.1 116.6,129.8 119.9,128.4 123.4,127.0 126.9,125.7 130.6,124.3 134.3,123.0 138.2,121.6 142.1,120.2 146.2,118.9 150.2,117.5 154.4,116.2 158.6,114.8 162.8,113.4 167.1,112.1 171.4,110.7 175.7,109.4 180.0,108.0 184.3,106.6 188.6,105.3 192.9,103.9 197.2,102.6 201.4,101.2 205.6,99.8 209.8,98.5 213.8,97.1 217.9,95.8 221.8,94.4 225.7,93.0 229.4,91.7 233.1,90.3 236.6,89.0 240.1,87.6 243.4,86.2 246.5,84.9 249.6,83.5 252.5,82.2 255.2,80.8 257.7,79.4 260.1,78.1 262.3,76.7 264.3,75.4 266.1,74.0 267.6,72.6 269.0,71.3 270.1,69.9 271.0,68.6 271.7,67.2 272.1,65.8 272.2,64.5" fill="none" stroke="#1d6fd1" stroke-width="2"/>
<polyline points="272.1,63.1 271.7,61.8 271.0,60.4 270.0,59.0 268.7,57.7 267.1,56.3 265.2,55.0 263.0,53.6 260.4,52.2 257.4,50.9 254.2,49.5 250.5,48.2 246.5,46.8 242.1,45.4 237.3,44.1 232.1,42.7 226.5,41.4 220.5,40.0 214.1,38.6 207.3,37.3 200.0,35.9 192.3,34.6 184.1,33.2 175.4,31.8 166.3,30.5 156.7,29.1 146.6,27.8 136.0,26.4 124.9,25.0 113.3,23.7 101.2,22.3 88.5,21.0 75.3,19.6 61.6,18.2 47.3,16.9 32.4,15.5" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
<polyline points="327.6,200.5 312.7,199.1 298.4,197.8 284.7,196.4 271.5,195.0 258.8,193.7 246.7,192.3 235.1,191.0 224.0,189.6 213.4,188.2 203.3,186.9 193.7,185.5 184.6,184.2 175.9,182.8 167.7,181.4 160.0,180.1 152.7,178.7 145.9,177.4 139.5,176.0 133.5,174.6 127.9,173.3 122.7,171.9 117.9,170.6 113.5,169.2 109.5,167.8 105.8,166.5 102.6,165.1 99.6,163.8 97.0,162.4 94.8,161.0 92.9,159.7 91.3,158.3 90.0,157.0 89.0,155.6 88.3,154.2 87.9,152.9" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
<line x1="266.4" y1="10" x2="266.4" y2="206" stroke="#6c7a93" stroke-dasharray="2 3"/>
<circle cx="266.4" cy="194.5" r="3.5" fill="#1f2a44"/>
<circle cx="266.4" cy="73.7" r="3.5" fill="#1f2a44"/>
<circle cx="266.4" cy="55.8" r="3.5" fill="#1f2a44"/>
<circle cx="272.2" cy="64.4" r="4" fill="white" stroke="#1f2a44" stroke-width="2"/>
<text x="280" y="54" font-size="11" fill="#1f2a44">fold</text>
<text x="262" y="160" font-size="11" fill="#6c7a93" text-anchor="end">δ = 4.8°</text>
<text x="186" y="18" font-size="11" fill="#1f2a44">α (trim incidence)</text>
<text x="330" y="124.0" font-size="11" fill="#1f2a44" text-anchor="end">δ (elevator)</text>
<text x="40" y="125.0" font-size="11" fill="#1d6fd1">stable trims</text>
<text x="40" y="36" font-size="11" fill="#b4232c">unstable trims</text>
</svg>
```
:::

::: context dynamic-pressure What dynamic pressure is
**Dynamic pressure**, written $\bar{q}$ ("q bar"), measures how hard the air is hitting the vehicle: $\bar{q} = \tfrac{1}{2}\rho v^2$, where $\rho$ is air density and $v$ is airspeed. Every aerodynamic force and moment scales with it.

On a climbing rocket, speed rises while the air thins, so $\bar{q}$ rises to a peak and then falls. That peak is called **max-Q**, and for many launchers it is a few tens of kilopascals. Because the vehicle's moments are proportional to $\bar{q}$, the same control system faces a very different plant at max-Q than at liftoff — which is exactly how a drifting parameter can walk a vehicle toward a bifurcation.
:::

::: context subcritical-hopf Soft and hard loss of stability
Engineers sometimes describe the two Hopf cases as a soft and a hard loss of stability.

In the **supercritical** (soft) case, as the parameter crosses the critical value a small oscillation appears and grows gradually. You see it coming, and backing the parameter off makes it go away.

In the **subcritical** (hard) case, nothing visible happens before the crossing. The equilibrium looks perfectly stable, but an unstable cycle is quietly shrinking around it. A disturbance larger than that cycle — or the crossing itself — throws the system out to a large oscillation. Backing the parameter off again often does not bring it back, because the large stable cycle (at $r = 0.9420$ in the example) is still there. Linear analysis sees neither cycle.
:::
