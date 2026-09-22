---
id: l01-nonlinear-phenomena
title: Four things a linear model cannot do
minutes: 19
covers:
  - 'Nonlinear phenomena: multiple equilibria, limit cycles, finite escape time, bifurcation'
---

Every control tool you have used so far starts by assuming the plant is linear: a transfer function, a state-space pair $(\mathbf{A}, \mathbf{B})$, a pole map, a gain and phase margin. That assumption is not a convenience, it is a structural commitment. A linear system has exactly one equilibrium (or a whole subspace of them), its response scales with its input, its stability does not depend on how hard you hit it, and it cannot reach infinity in finite time. Real vehicles violate all four.

This module is about what you do when the violations matter. Before any of the machinery — Lyapunov functions, sliding surfaces, backstepping — you need a catalogue of the behaviour that machinery exists to handle. There are four items on the list and this lesson works through them with numbers: **multiple equilibria**, **limit cycles**, **finite escape time**, and **bifurcation**, the sudden qualitative change of the whole picture as a parameter drifts.

None of these is exotic. A gravity-gradient satellite has four pitch equilibria, two of them stable and two of them saddles. A spacecraft holding attitude on cold-gas thrusters sits in a limit cycle for its entire mission, burning propellant on every cycle. An aircraft pushed past a fold in its trim curve departs, and no amount of elevator brings it back. A loop that is perfectly stable in linear analysis can be unusable because its region of attraction is the size of the sensor noise. You will meet all four again in this module, so meet them properly now.

## Why linearity was doing so much work

Two properties define a linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, and both fail the moment you write $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u})$ with $\mathbf{f}$ anything else.

**Superposition.** If $\mathbf{x}_a(t)$ solves the system for input $\mathbf{u}_a$ and $\mathbf{x}_b(t)$ for $\mathbf{u}_b$, then $\alpha\mathbf{x}_a + \beta\mathbf{x}_b$ solves it for $\alpha\mathbf{u}_a + \beta\mathbf{u}_b$. This is what lets you build a step response out of an impulse response, decompose a signal into sinusoids, and quote one frequency response for all amplitudes. Nonlinearly, none of that holds: a $1^\circ$ step and a $10^\circ$ step produce responses that are not scaled copies, and there is no such thing as *the* frequency response.

**Stability belongs to the system.** For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, the eigenvalues of $\mathbf{A}$ decide everything everywhere. Nonlinearly, stability is a property of a *particular equilibrium* and of a *particular neighbourhood* of it. The right question is never "is this system stable?" but "is this equilibrium stable, and from how far away?"

::: key
A nonlinear system $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ obeys no superposition, so response shape depends on amplitude. Stability is a property of an equilibrium point $\mathbf{x}_e$ (where $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$) together with a region around it, not of the system as a whole. Different equilibria of the same system can have different stability.
:::

## Multiple equilibria

An equilibrium is a state where $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$: put the system there and it stays. For $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with $\mathbf{A}$ invertible there is exactly one, the origin. A nonlinear $\mathbf{f}$ can vanish anywhere, and usually does so in several places.

The pitch libration of a gravity-gradient satellite is the standard case. With $\theta$ the pitch angle from the local vertical and $n$ the orbit rate, the torque-balanced pitch equation is

$$
I_y\ddot{\theta} + \tfrac{3}{2}n^2 (I_x - I_z)\sin 2\theta = 0 ,
$$

so $\ddot{\theta} = -k\sin\theta\cos\theta$ with $k = 3n^2(I_x - I_z)/I_y$. The right-hand side vanishes at $\theta = 0, \pi/2, \pi, 3\pi/2$: four equilibria on the circle, not one. Near $\theta = 0$ write $\theta = \varepsilon$ and use $\sin 2\varepsilon \approx 2\varepsilon$, giving $\ddot{\varepsilon} = -k\varepsilon$ — an oscillation at $\sqrt{k}$ when $k > 0$. Near $\theta = \pi/2$ write $\theta = \pi/2 + \varepsilon$, so $\sin(\pi + 2\varepsilon) = -\sin 2\varepsilon \approx -2\varepsilon$ and $\ddot{\varepsilon} = +k\varepsilon$ — exponential growth at $\sqrt{k}$. The same system, the same parameters, two equilibria with opposite verdicts.

::: example Four equilibria on one satellite
Take a bus with $I_x = 1200$, $I_y = 1500$, $I_z = 400\,\mathrm{kg\,m^2}$ in a $400\,\mathrm{km}$ circular orbit. With $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$ and $a = 6778\,\mathrm{km}$, the orbit rate is $n = \sqrt{\mu/a^3} = 1.131\times 10^{-3}\,\mathrm{rad/s}$, a period of $92.6\,\mathrm{min}$. Then

$$
k = \frac{3n^2(I_x - I_z)}{I_y} = \frac{3(1.131\times10^{-3})^2(800)}{1500} = 2.048\times 10^{-6}\,\mathrm{s^{-2}} .
$$

So $\sqrt{k} = 1.431\times 10^{-3}\,\mathrm{rad/s}$. At $\theta = 0$ and $\theta = \pi$ (nose down and nose up along the local vertical) the satellite librates with period $2\pi/\sqrt{k} = 4390\,\mathrm{s} = 73.2\,\mathrm{min}$. At $\theta = \pm\pi/2$ (long axis along the velocity vector) the error grows as $e^{1.431\times10^{-3}t}$, doubling every $484\,\mathrm{s}$ — about eight minutes. That is a saddle, and gravity gradient alone will not hold it.

Now watch superposition fail. Integrating the exact equation $\ddot{\theta} = -k\sin\theta\cos\theta$ with a fourth-order Runge–Kutta step of $0.01\,\mathrm{s}$, released from rest at various amplitudes:

| Release amplitude | Libration period |
| --- | --- |
| $5^\circ$ | $4399\,\mathrm{s}$ (73.3 min) |
| $30^\circ$ | $4712\,\mathrm{s}$ (78.5 min) |
| $60^\circ$ | $6027\,\mathrm{s}$ (100.5 min) |
| $85^\circ$ | $10710\,\mathrm{s}$ (178.5 min) |

A linear model would give $73.2\,\mathrm{min}$ for every one of them. The $5^\circ$ case agrees to two tenths of a per cent; the $85^\circ$ case is off by a factor of $2.4$, because the restoring torque $\sin 2\theta$ weakens as $\theta$ approaches the saddle and the satellite dawdles there. Period depending on amplitude is a nonlinear fingerprint — no linear system does it.
:::

## Limit cycles

A **limit cycle** is an isolated closed trajectory: the system runs around it forever, and nearby trajectories spiral onto it (stable limit cycle) or away from it (unstable). "Isolated" is the operative word. A linear centre — the undamped oscillator of the ODE module, with its pole pair exactly on the imaginary axis — also has closed orbits, but it has a continuum of them, one through every point, with amplitude set entirely by the initial condition and nothing to hold it there. A limit cycle has an amplitude of its own, and the system returns to that amplitude after a disturbance.

The van der Pol oscillator is the canonical example:

$$
\ddot{x} - \mu(1 - x^2)\dot{x} + x = 0 .
$$

Read the damping term $-\mu(1 - x^2)\dot{x}$ as a damping coefficient that depends on amplitude. For $|x| < 1$ it is negative — energy goes in and small oscillations grow. For $|x| > 1$ it is positive — energy comes out and large oscillations shrink. Something in between is sustained, and for small $\mu$ that something has amplitude close to $2$.

::: example The van der Pol cycle from both sides
With $\mu = 0.3$, integrate for $200\,\mathrm{s}$ at $\Delta t = 1\,\mathrm{ms}$ from two very different starts and measure the last $50\,\mathrm{s}$:

| Initial state | Final amplitude | Final period |
| --- | --- | --- |
| $(x, \dot{x}) = (0.1, 0)$ | $2.0009$ | $6.3185\,\mathrm{s}$ |
| $(x, \dot{x}) = (3.0, 0)$ | $2.0009$ | $6.3184\,\mathrm{s}$ |

One trajectory grew by a factor of twenty, the other shrank by a third, and they arrived at the same orbit to five figures. The frequency is $2\pi/6.3185 = 0.9944\,\mathrm{rad/s}$, close to the linear $1\,\mathrm{rad/s}$ because $\mu$ is small. An amplitude that the system defends is exactly what a spacecraft on thrusters does when its deadband and its actuator conspire, and predicting that amplitude without simulation is what describing functions are for, later in this module.

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

A linear unstable system grows like $e^{\sigma t}$: fast, but finite at every finite time. A nonlinear system can reach infinity at a specific clock time and have no solution beyond it. The cleanest case is

$$
\dot{x} = x^2, \qquad x(0) = x_0 > 0 \quad\Longrightarrow\quad x(t) = \frac{x_0}{1 - x_0 t},
$$

which you verify by separating variables: $\int x^{-2}dx = \int dt$ gives $-1/x = t - 1/x_0$. The solution blows up at $t = 1/x_0$ — the **escape time** — and no solution exists afterwards. With $x_0 = 0.2$: $x = 0.25$ at $1\,\mathrm{s}$, $x = 1$ at $4\,\mathrm{s}$, $x = 10$ at $4.9\,\mathrm{s}$, $x = 100$ at $4.99\,\mathrm{s}$, and nothing at all at $5\,\mathrm{s}$.

Notice how quiet the first eighty per cent of that run is. At $t = 1\,\mathrm{s}$ the state has moved 25 per cent, which a monitoring system would call nominal. Finite escape gives no warning in the data.

::: example A destabilising moment that grows faster than the angle
An aerodynamic moment that is destabilising and stiffens with incidence gives the same behaviour on a vehicle. Model the pitch axis as $J\ddot{\alpha} = k\alpha^3$ with $J = 90\,\mathrm{kg\,m^2}$ and $k = 400\,\mathrm{N\,m/rad^3}$, so $\ddot{\alpha} = a\alpha^3$ with $a = 4.444\,\mathrm{s^{-2}}$. Multiply by $\dot{\alpha}$ and integrate from rest at $\alpha_0$:

$$
\tfrac{1}{2}\dot{\alpha}^2 = \tfrac{a}{4}\left(\alpha^4 - \alpha_0^4\right) \quad\Longrightarrow\quad
\dot{\alpha} = \sqrt{\tfrac{a}{2}\left(\alpha^4 - \alpha_0^4\right)} .
$$

The time to reach infinite incidence is therefore

$$
T = \int_{\alpha_0}^{\infty}\frac{d\alpha}{\sqrt{\tfrac{a}{2}(\alpha^4 - \alpha_0^4)}}
 = \frac{1}{\alpha_0\sqrt{a/2}}\int_{1}^{\infty}\frac{du}{\sqrt{u^4 - 1}} ,
$$

substituting $u = \alpha/\alpha_0$. The remaining integral is a pure number, $1.3110$, evaluated numerically with the substitutions $u = 1 + v^2$ near the endpoint and $u = 1/w$ for the tail. With $\alpha_0 = 2.865^\circ = 0.0500\,\mathrm{rad}$,

$$
T = \frac{1.3110}{0.0500\sqrt{2.222}} = 17.59\,\mathrm{s} .
$$

Runge–Kutta at $\Delta t = 0.1\,\mathrm{ms}$ agrees and shows the shape of the run: $3.29^\circ$ at $5\,\mathrm{s}$, $5.12^\circ$ at $10\,\mathrm{s}$, $14.8^\circ$ at $15\,\mathrm{s}$, $21.8^\circ$ at $15.83\,\mathrm{s}$, $214^\circ$ at $17.41\,\mathrm{s}$, $1992^\circ$ at $17.57\,\mathrm{s}$. Under half the escape time — about $7.7\,\mathrm{s}$ of the $17.6\,\mathrm{s}$ — is spent under $4^\circ$.

The model stops describing a real vehicle long before $17.59\,\mathrm{s}$ — no airframe has a cubic moment out to $200^\circ$. That is the correct reading of a finite escape time: not "the incidence becomes infinite" but "these equations have nothing to say after $T$, and the vehicle is somewhere your model never went."
:::

::: warning
A simulation that returns `inf` or `nan` is not automatically an integrator bug. Shrinking the time step will not fix a genuine finite escape; it will only move the failure a little later and make the run longer. Before reaching for a smaller step, check whether the closed-form escape time exists — for $\dot{x} = cx^p$ with $p > 1$ it is $T = x_0^{1-p}/(c(p-1))$ — and compare it with the time at which your run died.
:::

## Bifurcation

The last item is not a behaviour but a change of behaviour. A **bifurcation** is a qualitative change in the set of equilibria or periodic orbits as a parameter crosses a critical value: equilibria appear, vanish, collide, or exchange stability. The parameter is usually something that drifts on a real vehicle — dynamic pressure, mass, a gain, a control deflection — which is what makes this a flight-safety topic rather than a curiosity.

Three local bifurcations cover most of what you meet, each with a normal form that captures its shape:

- **Saddle-node (fold)**, $\dot{x} = \mu - x^2$: for $\mu > 0$ two equilibria at $\pm\sqrt{\mu}$, one stable and one unstable; at $\mu = 0$ they collide; for $\mu < 0$ there are none. Equilibria are created and destroyed in pairs.
- **Pitchfork**, $\dot{x} = \mu x - x^3$: one stable equilibrium at the origin for $\mu < 0$; for $\mu > 0$ the origin turns unstable and two stable equilibria at $\pm\sqrt{\mu}$ appear. Symmetric systems break their symmetry this way.
- **Hopf**, where a complex eigenvalue pair crosses the imaginary axis and a periodic orbit is born. In the *supercritical* case the new cycle is stable and small — the equilibrium goes gently from stable to a low-amplitude oscillation. In the *subcritical* case an *unstable* cycle surrounds a stable equilibrium before the crossing and shrinks onto it, so the equilibrium loses stability by having its region of attraction squeezed to nothing.

The subcritical Hopf deserves a number, because it is the mechanism behind the most dangerous sentence in control engineering: "the linearised model is stable." Take the radial normal form $\dot{r} = \mu r + r^3 - r^5$ with $\mu = -0.1$. The origin is linearly stable with eigenvalue real part $\mu = -0.1$. The cycles are the positive roots of $\mu + r^2 - r^4 = 0$, that is $r^2 = \tfrac{1}{2}(1 \pm \sqrt{1 + 4\mu})$, giving $r = 0.3357$ and $r = 0.9420$. Integrating the planar system $\dot{x} = \lambda x - y$, $\dot{y} = x + \lambda y$ with $\lambda = \mu + r^2 - r^4$ for $200\,\mathrm{s}$: starting at $r_0 = 0.30$ ends at $r = 0.0000$, $r_0 = 0.33$ ends at $0.0000$, $r_0 = 0.34$ ends at $0.9420$, $r_0 = 0.40$ ends at $0.9420$. The stable equilibrium is real, and its basin ends at $r = 0.3357$, a fence the linearisation never mentions.

::: example Losing trim: a fold in the elevator curve
A vehicle with a pitching-moment coefficient that is statically stable at low incidence and destabilising at high incidence has

$$
C_m(\alpha, \delta) = -0.9\,\alpha + 6\,\alpha^3 + 1.5\,\delta
$$

per radian, with $\delta$ a nose-up elevator deflection. Trim means $C_m = 0$. Static stability at a trim point means $\partial C_m/\partial\alpha = -0.9 + 18\alpha^2 < 0$, so $|\alpha| < \sqrt{0.9/18} = 0.2236\,\mathrm{rad} = 12.81^\circ$. The fold is exactly where the trim reaches that bound; putting $\alpha = 0.2236$ into the trim equation,

$$
\delta_{\text{fold}} = \frac{0.9(0.2236) - 6(0.2236)^3}{1.5} = 0.08944\,\mathrm{rad} = 5.12^\circ .
$$

Solving the cubic for the trims confirms the picture:

| $\delta$ | Trim incidences $\alpha$ | $\partial C_m/\partial\alpha$ at each |
| --- | --- | --- |
| $0^\circ$ | $-22.19^\circ$, $0^\circ$, $+22.19^\circ$ | $+1.8$, $-0.9$, $+1.8$ |
| $3.00^\circ$ | $-24.36^\circ$, $+5.30^\circ$, $+19.06^\circ$ | $+2.35$, $-0.75$, $+1.09$ |
| $4.80^\circ$ | $-25.44^\circ$, $+10.08^\circ$, $+15.36^\circ$ | $+2.65$, $-0.34$, $+0.39$ |
| $5.12^\circ$ | $-25.62^\circ$, $+12.49^\circ$, $+13.13^\circ$ | $+2.70$, $-0.04$, $+0.05$ |
| $5.40^\circ$ | $-25.78^\circ$ | $+2.74$ |

The usable trim at $+10.08^\circ$ and the unstable one at $+15.36^\circ$ march toward each other as $\delta$ grows, meet at $12.81^\circ$, and are gone. Now fly it. Take the short-period model $\ddot{\alpha} = a_m C_m(\alpha,\delta) - 2.0\,\dot{\alpha}$ with $a_m = \bar{q}Sc/I_{yy} = (15\,\mathrm{kPa})(28\,\mathrm{m^2})(3.5\,\mathrm{m})/(75000\,\mathrm{kg\,m^2}) = 19.6\,\mathrm{s^{-2}}$, which gives $\omega_n = \sqrt{19.6\times 0.9} = 4.20\,\mathrm{rad/s}$ and $\zeta = 0.238$ about $\alpha = 0$. Ramp the elevator linearly over $20\,\mathrm{s}$ and hold:

| $t$ | $\delta$ | $\alpha$, ramp to $4.80^\circ$ | $\alpha$, ramp to $5.40^\circ$ |
| --- | --- | --- | --- |
| $10\,\mathrm{s}$ | $2.40^\circ$ / $2.70^\circ$ | $4.09^\circ$ | $4.64^\circ$ |
| $15\,\mathrm{s}$ | $3.60^\circ$ / $4.05^\circ$ | $6.49^\circ$ | $7.54^\circ$ |
| $20\,\mathrm{s}$ | $4.80^\circ$ / $5.40^\circ$ | $9.80^\circ$ | $13.17^\circ$ |
| $30\,\mathrm{s}$ | hold | $10.080^\circ$ | departed near $21.7\,\mathrm{s}$ |

The first case settles on the predicted trim of $10.080^\circ$ and stays. The second crosses $\delta_{\text{fold}} = 5.12^\circ$ at $t = 18.98\,\mathrm{s}$, at which moment there is no longer any trim to hold, and the incidence runs away. The difference between the two runs is $0.6^\circ$ of elevator. No gain margin, phase margin or pole location computed about $\alpha = 0$ contains this information.
:::

::: warning
Bifurcation parameters are rarely labelled as such in a requirements document. They arrive as "dynamic pressure at max-Q", "tank mass as propellant depletes", "actuator authority at altitude", or "controller gain after the schedule is retuned". When a nonlinear model is available, sweep the parameter and count the equilibria; the count changing is the warning.
:::

## Check yourself

::: check
The gravity-gradient satellite above is released at $\theta = 89.9^\circ$ with zero rate. Estimate how long until its pitch error has grown to $30^\circ$ from the saddle, and say why the estimate is only an estimate.
:::

::: answer
Near the saddle at $\theta = \pi/2$ the deviation obeys $\ddot{\varepsilon} = +k\varepsilon$ with $\sqrt{k} = 1.431\times10^{-3}\,\mathrm{s^{-1}}$. From rest at $\varepsilon_0 = 0.1^\circ$ the solution is $\varepsilon = \varepsilon_0\cosh(\sqrt{k}\,t)$, so growing to $30^\circ$ needs $\cosh(\sqrt{k}t) = 300$, giving $\sqrt{k}\,t = \operatorname{arccosh}(300) = 6.40$ and $t = 4470\,\mathrm{s}$, about $75\,\mathrm{min}$ — roughly one orbit. It is only an estimate because the linearisation $\sin 2\varepsilon \approx 2\varepsilon$ has lost 10 per cent of its accuracy by $\varepsilon = 30^\circ$ and the true restoring term is weaker than linear, so the real growth is a little slower near the end.
:::

::: check
For $\dot{x} = 2x^3$ with $x(0) = 0.5$, find the escape time in closed form and evaluate it.
:::

::: answer
Separate: $x^{-3}dx = 2\,dt$, so $-\tfrac{1}{2}x^{-2} = 2t + C$ with $C = -\tfrac{1}{2}(0.5)^{-2} = -2$. Then $x^{-2} = 4 - 4t$ and $x(t) = 1/(2\sqrt{1 - t})$, which escapes at $T = 1\,\mathrm{s}$. Check against the general rule $T = x_0^{1-p}/(c(p-1))$ with $c = 2$, $p = 3$, $x_0 = 0.5$: the exponent is $1 - p = -2$, so $x_0^{-2} = 4$ and $T = 4/(2\times 2) = 1\,\mathrm{s}$. The two agree. Write negative exponents out rather than reading $x_0^{1-p}$ as $x_0^{2}$ — that is the slip this formula invites.
:::

::: check
A colleague reports that their thruster-controlled attitude loop "oscillates at $0.22\,\mathrm{Hz}$ with about $0.4^\circ$ amplitude, and it comes back to that amplitude whatever we do to it." Is that a marginally stable linear mode or a limit cycle, and how would you tell them apart from data alone?
:::

::: answer
It is a limit cycle. A marginally stable linear mode keeps whatever amplitude the disturbance left it with: nudge it and the new amplitude persists. A limit cycle has an amplitude of its own and returns to it. The test is a deliberate disturbance: inject a pulse that doubles the amplitude and watch. Returning to $0.4^\circ$ over some tens of seconds is a stable limit cycle; staying at $0.8^\circ$ indefinitely is a linear centre. A second clue is the waveform — thruster limit cycles are visibly non-sinusoidal, with straight coasting segments between pulses.
:::

::: check
In the trim example, is $\delta = 4.80^\circ$ a safe operating point? The table says the trim exists and is statically stable.
:::

::: answer
It exists, but the margin is thin in two different senses. In parameter: the fold is at $5.12^\circ$, so only $0.32^\circ$ of further elevator destroys the trim. In state: the stable trim at $10.08^\circ$ and the unstable one at $15.36^\circ$ are $5.3^\circ$ apart, and that unstable trim is the edge of the region of attraction — a gust that pushes incidence past $15.36^\circ$ departs even with the elevator held. Static stability at the operating point ($\partial C_m/\partial\alpha = -0.34$, already weak) says nothing about either margin. Estimating that region of attraction is a later lesson in this module.
:::

::: check
Name one qualitative behaviour from this lesson that a linear model *can* reproduce, and explain why it is the exception.
:::

::: answer
Sustained oscillation. A linear system with a pole pair exactly on the imaginary axis oscillates forever at a fixed frequency, which looks like a limit cycle on a plot. It is the exception only in appearance: the linear oscillation is not isolated, its amplitude is set by the initial condition rather than by the system, and it requires a parameter tuned exactly to a knife edge — any real damping and it becomes a decaying spiral. Multiple equilibria, finite escape, and bifurcation have no linear counterpart at all.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$ | Equilibrium; a nonlinear system may have many, with different stability |
| $\ddot{\theta} = -k\sin\theta\cos\theta$, $k = 3n^2(I_x - I_z)/I_y$ | Gravity-gradient pitch: centres at $0, \pi$; saddles at $\pm\pi/2$ |
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

The next lesson takes the tool the ODE module already gave you — the phase plane, with its trace–determinant classification of $2\times 2$ linear systems — and uses it to read these pictures directly: where the equilibria are, what each one looks like close up, and how the separatrices divide the plane into regions with different fates.
