---
id: l09-symplectic-integrators
title: Symplectic integrators for long-horizon propagation
minutes: 19
covers:
  - Symplectic integrators and long-horizon propagation
---

Picture yourself walking around a round running track with your eyes closed. Every few seconds you open them for an instant, look at which way the track curves right where you stand, close them, and take a stride straight ahead in that direction. Each stride is a straight line, and the track curves away under it, so you always land a little outside the lane. After one lap you are a step outside. After a hundred laps you are in the parking lot. No single stride was badly wrong. The trouble is that every stride was wrong *in the same direction*.

Explicit Euler on a circular orbit does exactly this: every step lands a little too high, and the orbit spirals outward. Better methods like RK4 and DOP853 make the error per step thousands of times smaller, but in the last lesson you saw that they still do not get rid of the "same direction" part. Their energy drifts along a straight line, and on a long enough run a straight line always wins.

This lesson meets a different kind of method. A **symplectic integrator** is a fixed-step method built so that it respects the geometry of frictionless motion. Its energy error does not grow at all. It wobbles up and down within a fixed band, whether you run ten orbits or ten million. You will build the simplest one, see why it works, build the workhorse **leapfrog** scheme for an orbit, and learn when it beats an adaptive high-order solver and when it does not. This matters for long-horizon propagation: debris and disposal-orbit studies over decades, checks that a spent upper stage will not hit another planet for a century, and the motion of the planets themselves.

## Position and momentum, side by side

Frictionless motion has a special structure, and symplectic methods are built on it. To see it, go back to the simplest oscillator: a mass on a spring, with the mass and the spring constant both set to $1$. Its position is $q$ and its momentum is $p$ (for unit mass, momentum is the same as velocity). The total energy is

$$
H(q, p) = \frac{p^2}{2} + \frac{q^2}{2}.
$$

Written as a function of position and momentum like this, the energy is called the **Hamiltonian**, after **[[William Rowan Hamilton|hamilton]]**. The equations of motion come straight out of it:

$$
\dot{q} = \frac{\partial H}{\partial p} = p, \qquad \dot{p} = -\frac{\partial H}{\partial q} = -q.
$$

(Read $\partial H / \partial p$ as "the partial derivative of H with respect to p": how fast $H$ changes when you nudge $p$ and hold $q$ still.) Any system whose motion follows these two equations for some $H$ is a **Hamiltonian system**. Gravity, springs and every other force that comes from a potential give Hamiltonian systems. Drag and thrust do not.

A two-body orbit is one too, with position and velocity as three-component vectors and

$$
H(\mathbf{q}, \mathbf{p}) = \frac{|\mathbf{p}|^2}{2} - \frac{\mu}{|\mathbf{q}|},
$$

which is exactly the specific energy $\varepsilon$ from the last lesson.

Now draw the oscillator's state as a point on a flat map, $q$ across and $p$ up. That map is called **[[phase space|phase-space]]**. The true motion goes round and round a circle of constant $H$ forever.

## Why explicit Euler spirals out, and a one-line fix

Explicit Euler updates both $q$ and $p$ from the *old* values:

$$
q_{n+1} = q_n + h\,p_n, \qquad p_{n+1} = p_n - h\,q_n.
$$

Add the squares of the new values. The cross terms $2hq_np_n$ and $-2hq_np_n$ cancel, and you get

$$
q_{n+1}^2 + p_{n+1}^2 = (1 + h^2)\,\bigl(q_n^2 + p_n^2\bigr).
$$

Every step multiplies the energy by $1 + h^2$, which is always more than one. That is the eyes-closed walker: every stride lands outside the circle.

Now make one tiny change. Update the momentum first, then move the position using the *new* momentum:

$$
p_{n+1} = p_n - h\,q_n, \qquad q_{n+1} = q_n + h\,p_{n+1}.
$$

This is **symplectic Euler**. It costs exactly the same as explicit Euler and is still only first order. But look at what it does:

```python
import numpy as np

h, n = 0.1, 628                       # 628 steps of 0.1 s: ten periods

def explicit_euler(q, p):
    return q + h * p, p - h * q       # both updates use the old values

def symplectic_euler(q, p):
    p = p - h * q                     # kick: update momentum first
    q = q + h * p                     # drift: move with the NEW momentum
    return q, p

for name, step in [("explicit", explicit_euler), ("symplectic", symplectic_euler)]:
    q, p = 1.0, 0.0
    energies = []
    for _ in range(n):
        q, p = step(q, p)
        energies.append(0.5 * (q**2 + p**2))
    print(f"{name:10}  min {min(energies):.4f}  max {max(energies):.4f}  final {energies[-1]:.4f}")
# explicit    min 0.5050  max 258.6978  final 258.6978
# symplectic  min 0.4762  max 0.5263  final 0.5003
```

::: example Ten periods of a spring
The true energy is $H = 0.5$ forever.

**Explicit Euler.** Each step multiplies the energy by $1 + h^2 = 1.01$. After $628$ steps that is $1.01^{628} \approx 517.4$, so the energy grows from $0.5$ to about $0.5 \times 517.4 \approx 258.7$ — the printed $258.6978$. The spring is swinging with an amplitude of about $23$ instead of $1$.

**Symplectic Euler.** The energy stays between $0.4762$ and $0.5263$, about $5\%$ either side of the truth, and after ten periods it is back at $0.5003$. Run it for a million periods and the band is the same.

**Sanity check.** Both methods have the same first-order accuracy per step and the same cost. The only difference is the order of two lines. The symplectic one is not more accurate per step; it makes its errors in a way that cannot pile up.
:::

::: key
Symplectic schemes conserve a nearby Hamiltonian, so energy error stays bounded and oscillatory over very long horizons instead of drifting secularly. Adaptive high-order methods are more accurate per step but drift; over centuries of propagation the symplectic scheme wins.
:::

## Why it works: area, and a shadow energy

There are two ways to see why the order of the updates matters so much.

**Area.** Take a small patch of starting states in phase space — a little blob of nearby $(q, p)$ points — and let each one move. The true motion of any Hamiltonian system bends and stretches the blob, but never changes its area. That fact is **[[Liouville's theorem|liouville]]**. A method that also keeps area exactly is called **symplectic**. Explicit Euler maps $(q, p)$ through the matrix

$$
\begin{bmatrix} 1 & h \\ -h & 1 \end{bmatrix},
$$

whose determinant (the factor by which it scales areas) is $1 + h^2$. It inflates every blob a little each step, which is the outward spiral. Symplectic Euler's matrix is

$$
\begin{bmatrix} 1 - h^2 & h \\ -h & 1 \end{bmatrix},
$$

with determinant $(1 - h^2) \cdot 1 - h \cdot (-h) = 1$. Areas are kept exactly. A method that keeps area cannot spiral outward or inward, because a spiral would squeeze or stretch the ring of states around the orbit.

**A shadow energy.** Here is the deeper reason. Symplectic Euler does not keep $H$ constant. But it keeps a slightly different quantity *exactly* constant:

$$
\tilde{H}(q, p) = \frac{q^2 + p^2}{2} - \frac{h}{2}\,q\,p.
$$

Read $\tilde{H}$ as "H tilde". This is the **[[shadow Hamiltonian|shadow-hamiltonian]]**: an energy of a slightly different, nearby system. The numerical solution is the *exact* solution of that nearby system. Since $\tilde{H}$ is constant and differs from $H$ by the small term $\frac{h}{2}qp$, the true energy $H$ can only wobble within a band whose size is proportional to $h$. It can never run away.

::: note Why the shadow energy has to be constant
Write one step as $p' = p - hq$ and $q' = q + hp'$. We want to show $q'^2 + p'^2 - h\,q'p' = q^2 + p^2 - h\,qp$.

First, group the terms with $q'$: $q'^2 - h\,q'p' = q'\,(q' - h\,p')$. Since $q' = q + hp'$, the bracket $q' - hp'$ is $q$. So this part equals $q'\,q = q^2 + h\,q\,p'$.

Add $p'^2$: the total is $q^2 + h\,q\,p' + p'^2 = q^2 + p'\,(hq + p')$. Since $p' = p - hq$, the bracket $hq + p'$ is $p$. So the total is $q^2 + p'\,p = q^2 + p^2 - h\,qp$, which is what we started from.

For a general Hamiltonian the shadow is not this tidy, but a theorem of **backward error analysis** says every symplectic method, run with a fixed step, exactly follows a nearby Hamiltonian system (up to terms far smaller than the step's own error) for extremely long times. Bounded energy error is the result.
:::

## Leapfrog: the workhorse for orbits

Symplectic Euler is first order. The standard practical method is its symmetric cousin, **leapfrog**, also called **[[velocity Verlet|verlet]]** or Störmer–Verlet. It splits each step into three moves: a half **kick** (change the velocity using the acceleration for half a step), a full **drift** (move the position with that velocity), and another half kick with the acceleration at the new position.

$$
\mathbf{v}_{n+1/2} = \mathbf{v}_n + \tfrac{h}{2}\,\mathbf{a}(\mathbf{r}_n), \qquad
\mathbf{r}_{n+1} = \mathbf{r}_n + h\,\mathbf{v}_{n+1/2}, \qquad
\mathbf{v}_{n+1} = \mathbf{v}_{n+1/2} + \tfrac{h}{2}\,\mathbf{a}(\mathbf{r}_{n+1}).
$$

Leapfrog is second order, symplectic, and **time-reversible**: run it backward with step $-h$ and it retraces its path exactly, as the true motion does. The acceleration at the end of one step is the one needed at the start of the next, so a careful implementation costs one force evaluation per step, against four for RK4.

Here is leapfrog against RK4 on an orbit with a perigee radius of $7000\,\mathrm{km}$ and eccentricity $0.1$ (a slightly oval orbit, period $6826\,\mathrm{s}$). To make the race fair, both get the same budget of force evaluations: RK4 steps of about $60\,\mathrm{s}$ (four evaluations each) and leapfrog steps of about $15\,\mathrm{s}$ (one each). The code prints the worst relative energy error seen during revolutions 1, 10 and 100.

```python
import numpy as np

MU = 3.986004418e14
rp, ecc = 7.0e6, 0.1                              # perigee radius, eccentricity
a = rp / (1 - ecc)
T = 2 * np.pi * np.sqrt(a**3 / MU)                # 6826.4 s
r0 = np.array([rp, 0.0, 0.0])
v0 = np.array([0.0, np.sqrt(MU * (2 / rp - 1 / a)), 0.0])

def accel(r):
    return -MU * r / np.linalg.norm(r)**3

def energy(r, v):
    return 0.5 * v @ v - MU / np.linalg.norm(r)

def leapfrog(r, v, h):                            # kick-drift-kick
    v = v + 0.5 * h * accel(r)
    r = r + h * v
    v = v + 0.5 * h * accel(r)
    return r, v

def rk4(r, v, h):
    f = lambda y: np.concatenate([y[3:], accel(y[:3])])
    y = np.concatenate([r, v])
    k1 = f(y); k2 = f(y + 0.5 * h * k1); k3 = f(y + 0.5 * h * k2); k4 = f(y + h * k3)
    y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
    return y[:3], y[3:]

E0 = energy(r0, v0)
for name, step, h in [("RK4", rk4, 60.0), ("leapfrog", leapfrog, 15.0)]:
    n_per_rev = round(T / h)
    r, v, worst = r0, v0, []
    for rev in range(100):
        w = 0.0
        for _ in range(n_per_rev):
            r, v = step(r, v, T / n_per_rev)
            w = max(w, abs((energy(r, v) - E0) / E0))
        worst.append(w)
    print(f"{name:8}  rev 1: {worst[0]:.1e}  rev 10: {worst[9]:.1e}  rev 100: {worst[99]:.1e}")
# RK4       rev 1: 1.3e-07  rev 10: 1.2e-06  rev 100: 1.2e-05
# leapfrog  rev 1: 2.0e-05  rev 10: 2.0e-05  rev 100: 2.0e-05
```

(For clarity this `leapfrog` computes the acceleration twice per step. A production version keeps the second one for the next step.)

::: example Bounded against secular, over a thousand orbits
**The first orbit.** RK4 is ahead: its worst error is $1.3 \times 10^{-7}$, against leapfrog's $2.0 \times 10^{-5}$, about $150$ times better. Fourth order beats second order per step.

**The shape.** RK4's error grows ten times for every ten times more orbits: $1.3 \times 10^{-7}$, $1.2 \times 10^{-6}$, $1.2 \times 10^{-5}$. That is secular drift at about $1.2 \times 10^{-7}$ per orbit. Leapfrog's worst error is $2.0 \times 10^{-5}$ in orbit 1, in orbit 10 and in orbit 100. It does not grow.

**The crossover.** RK4's line reaches leapfrog's band after about $2.0 \times 10^{-5} / 1.21 \times 10^{-7} \approx 170$ orbits, about $13$ days. Running both codes for $1000$ orbits ($79$ days) confirms it: RK4 reaches $1.2 \times 10^{-4}$ while leapfrog still sits at $2.0 \times 10^{-5}$.

**A fourth-order symplectic method.** The **[[Yoshida|yoshida]]** scheme chains three leapfrog substeps with weights $w_1 \approx 1.3512$, $w_0 \approx -1.7024$, $w_1 \approx 1.3512$ (they add to $1$). At steps of $45\,\mathrm{s}$ it uses the same force-evaluation budget, and its energy error stays at $6.8 \times 10^{-7}$ for all $1000$ orbits. It passes RK4 after about $6$ orbits and never looks back.

**Sanity check.** Same cost, same order for RK4 and Yoshida, but after $1000$ orbits RK4's energy error is about $180$ times larger. The only difference is the shape of the curve.
:::

## What symplectic does not promise

Bounded energy is a strong property, but it is not the same as an accurate position. Three limits matter in practice.

**The phase still drifts.** The numerical orbit keeps the right energy on average, but its period is a tiny bit wrong, so it slowly gets ahead of or behind the true satellite. That along-track error grows in a straight line with time. For a Runge–Kutta method, whose energy error also grows, the along-track error grows with the *square* of time, so symplectic still wins in the long run — but "wins" can mean "less wrong". After $1000$ orbits the leapfrog run above was about $4000\,\mathrm{km}$ from the true position, and Yoshida about $140\,\mathrm{km}$.

**The step must be fixed.** Symplectic behavior comes from applying the *same* area-keeping map every step. Change the step size from step to step according to the state, the way an adaptive solver does, and the property is lost. Leapfrog with a step that grows and shrinks with distance from Earth showed an energy error of $9.8 \times 10^{-8}$ after one orbit, $9.9 \times 10^{-7}$ after 10 and $9.8 \times 10^{-6}$ after 100: secular drift is back.

**The system must be Hamiltonian.** Drag, thrust and anything else that adds or removes energy break the structure. There is nothing to conserve, so there is no benefit.

::: warning Do not put a symplectic method inside an adaptive step controller
It is tempting to "improve" leapfrog by adding an error estimate and adapting the step. Doing it the straightforward way turns it back into an ordinary method with secular drift, as the numbers above show. If an eccentric orbit needs small steps near perigee and large ones near apogee, the fix is to change the time variable so that a fixed step in the new variable covers the orbit evenly, a technique called **[[regularization|regularization]]**, not to vary $h$.
:::

## Choosing for a long horizon

So which method should propagate a spacecraft for a long time? It depends on the horizon and the question.

For **precise work over days to months** — orbit determination, conjunction screening, a 30-day propagation to a maneuver — use an adaptive high-order method at tight tolerance, as in the last two lessons. On the same eccentric orbit, DOP853 at `rtol=1e-12` ran $1000$ orbits with a final energy drift of $3.1 \times 10^{-10}$ and a position error of about $12.5\,\mathrm{m}$, using about $750$ force evaluations per orbit. Yoshida, with $456$ per orbit, was $140\,\mathrm{km}$ off. For a precise answer over $79$ days, DOP853 wins by a mile.

For **very long horizons**, the shapes take over. DOP853's drift, about $3 \times 10^{-13}$ per orbit, would reach Yoshida's fixed band of $6.8 \times 10^{-7}$ after about $2.2$ million orbits — roughly $480$ years. Over centuries of propagation, on problems where many runs must be cheap and the energy must not creep, the symplectic scheme wins. That is the regime of **[[planetary science|wisdom-holman]]** and of long-term questions such as "does this disposal orbit stay clear of the operational belt for 200 years?" or "can this spent upper stage in solar orbit return to Earth within a century?"

For **qualitative questions** — is this orbit stable, does this resonance persist — bounded energy error matters even more than accuracy. An RK run that slowly gains energy can make a stable orbit look like it is escaping. A symplectic run cannot invent that trend.

## Check yourself

::: check
Explicit Euler with $h = 0.05$ is run on the unit spring for $2000$ steps. By what factor has the energy grown? What would symplectic Euler's energy do?
:::

::: answer
Each step multiplies the energy by $1 + h^2 = 1 + 0.0025 = 1.0025$. After $2000$ steps the factor is $1.0025^{2000} = e^{2000 \ln 1.0025} \approx e^{4.99} \approx 148$.

Symplectic Euler keeps $\tilde{H} = \frac{q^2 + p^2}{2} - \frac{h}{2}qp$ exactly constant, so $H$ only wobbles in a narrow band (a few percent wide for $h = 0.05$) around $0.5$. It does not grow, however many steps you take.
:::

::: check
Show that the matrix $\begin{bmatrix} 1 - h^2 & h \\ -h & 1 \end{bmatrix}$ is what symplectic Euler does to $(q, p)$ for the unit spring, and explain in one sentence why its determinant matters.
:::

::: answer
The step is $p' = p - hq$, then $q' = q + hp' = q + h(p - hq) = (1 - h^2)\,q + h\,p$. So $q' = (1 - h^2)q + hp$ and $p' = -hq + p$, which are the two rows of the matrix.

The determinant is $(1 - h^2)(1) - (h)(-h) = 1$, and the determinant is the factor by which the step scales areas in phase space, so the step keeps areas exactly, as the true motion does.
:::

::: check
A colleague runs leapfrog on a satellite with drag and is surprised the energy falls steadily. Is the integrator broken?
:::

::: answer
No. Drag removes energy from the real satellite, so the energy should fall. The system is no longer Hamiltonian, so leapfrog has no special property to offer. The right check is the energy balance from the last lesson: the energy change should match the work done by drag.
:::

::: check
Why is leapfrog cheaper per step than RK4, and why does that matter in a fair comparison?
:::

::: answer
The acceleration computed at the end of one leapfrog step, $\mathbf{a}(\mathbf{r}_{n+1})$, is exactly the one needed for the first half-kick of the next step. Keeping it means one force evaluation per step, against four for RK4.

Force evaluations are what cost time in an orbit propagator (especially with a detailed gravity model), so a fair race gives each method the same number of them: leapfrog then gets four steps for each RK4 step.
:::

::: check
You must predict where a satellite will be in 10 days to within $50\,\mathrm{m}$, with Earth's gravity and drag. Would you choose leapfrog? Why or why not?
:::

::: answer
No. Ten days is a short horizon and the requirement is a precise position, which calls for an adaptive high-order method such as DOP853 at a tight tolerance with a per-state `atol`. Symplectic methods do not bound the along-track error, and with drag in the model the system is not Hamiltonian anyway. Their advantage appears over very long horizons and for questions about long-term behavior.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Hamiltonian | energy as a function of position and momentum | $\dot{q} = \partial H/\partial p$, $\dot{p} = -\partial H/\partial q$ |
| Symplectic | keeps phase-space area exactly | determinant of one step $= 1$ |
| Explicit Euler on a spring | energy grows every step | factor $1 + h^2$ per step |
| Symplectic Euler | kick then drift with the new momentum | conserves $\tilde{H} = \frac{q^2 + p^2}{2} - \frac{h}{2}qp$ |
| Shadow Hamiltonian | the nearby energy a symplectic method keeps | energy error bounded, oscillating |
| Leapfrog (velocity Verlet) | half kick, drift, half kick | second order, time-reversible, one force call per step |
| Yoshida | three leapfrog substeps | fourth order; weights $1.3512$, $-1.7024$, $1.3512$ |
| Limits | what it does not give | phase still drifts; fixed step only; Hamiltonian systems only |
| When it wins | long horizons | centuries, many cheap runs, qualitative stability questions |

The next lesson turns to what happens when the smooth dynamics are interrupted: staging, thrust cutoff and other sudden changes, and why the right answer is to stop the solver and start it again.

::: context hamilton A mathematician who wrote on a bridge
William Rowan Hamilton, an Irish mathematician, published his reformulation of mechanics in 1834 and 1835. Instead of forces and accelerations, it describes a system by one function, the energy in terms of positions and momenta, and gets both equations of motion from it. He is also remembered for carving the rules of the quaternions into the stone of Broom Bridge in Dublin in 1843 — the same quaternions that spacecraft use for attitude today.
:::

::: context phase-space Circles, spirals and closed loops
Phase space puts position across and momentum up, so each point is a complete state and the motion is a curve. The true spring motion is a circle. Explicit Euler (left, drawn with a large step $h = 0.25$ so the effect is visible) spirals outward. Symplectic Euler (right, same step) runs round a closed loop that stays near the circle forever.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="100" r="40" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="130.0,100.0 130.0,110.0 127.5,120.0 122.5,129.4 115.2,137.5 105.8,143.8 94.8,147.7 82.9,148.9 70.7,147.2 58.9,142.3 48.3,134.6 39.7,124.1 33.6,111.5 30.7,97.4 31.4,82.6 35.7,68.0 43.7,54.4 55.1,42.8 69.4,34.1 85.9,29.0 103.6,27.9 121.7,31.4 138.8,39.3 154.0,51.5 166.1,67.5 174.3,86.5 177.6,107.6"/>
  <circle cx="130" cy="100" r="3.5" fill="#1f2a44"/>
  <text x="90" y="190" font-size="12" text-anchor="middle" fill="#b4232c">explicit Euler</text>
  <circle cx="270" cy="100" r="40" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="310.0,100.0 307.5,110.0 302.7,119.4 295.8,127.5 287.3,134.0 277.7,138.3 267.6,140.2 257.7,139.6 248.6,136.6 240.8,131.2 234.8,123.9 231.0,115.1 229.7,105.4 230.9,95.3 234.5,85.5 240.3,76.6 248.0,69.2 257.1,63.7 267.0,60.5 277.0,59.7 286.7,61.5 295.2,65.7 302.3,72.0 307.2,80.0 309.9,89.3 310.1,99.3 307.7,109.3"/>
  <circle cx="310" cy="100" r="3.5" fill="#1f2a44"/>
  <text x="270" y="190" font-size="12" text-anchor="middle" fill="#1d6fd1">symplectic Euler</text>
  <text x="200" y="18" font-size="11" text-anchor="middle" fill="#6c7a93">dashed: the true circle</text>
</svg>
```
:::

::: context liouville Blobs that bend but keep their size
Joseph Liouville proved in 1838 that Hamiltonian motion keeps phase-space volume. Picture a drop of ink in a frictionless, swirling fluid: the drop stretches into a long, thin thread, but the amount of fluid it covers never changes. Friction breaks this: with damping, every blob of states shrinks toward the resting point. Symplectic methods copy the ink-drop behavior exactly, step by step, which is why they cannot fake a slow gain or loss of energy.
:::

::: context shadow-hamiltonian The energy the numbers really keep
For symplectic Euler on the spring, the kept quantity $\tilde{H} = \frac{q^2 + p^2}{2} - \frac{h}{2}qp$ is a slightly tilted ellipse instead of a circle. The picture exaggerates it by using $h = 0.5$: the ellipse is stretched along the line $q = p$ to a half-width of $1/\sqrt{1 - h/2} \approx 1.15$ and squeezed across it to $1/\sqrt{1 + h/2} \approx 0.89$. The numerical states stay on the ellipse forever, so the true energy only wobbles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="100" x2="270" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <text x="274" y="104" font-size="11" fill="#6c7a93">q</text>
  <text x="184" y="22" font-size="11" fill="#6c7a93">p</text>
  <circle cx="180" cy="100" r="60" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <ellipse cx="180" cy="100" rx="69.3" ry="53.7" transform="rotate(-45 180 100)" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="252" y="40" font-size="11" fill="#1d6fd1">shadow energy: kept exactly</text>
  <text x="60" y="176" font-size="11" fill="#1f2a44">true energy: dashed circle</text>
</svg>
```
:::

::: context verlet From auroras to molecules
The scheme has been discovered several times. The Norwegian mathematician Carl Størmer used a version of it in the early 1900s to trace electrically charged particles in Earth's magnetic field while studying the aurora. The French physicist Loup Verlet made it famous in 1967 for simulating the motion of molecules in a gas, and molecular-dynamics codes still use it for billions of atoms. The name "leapfrog" describes the half-step version, where velocity and position leap over each other in time. The picture shows one kick-drift-kick step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="330" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="72" x2="60" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="72" x2="300" y2="88" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">t_n</text>
  <text x="300" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">t_n + h</text>
  <rect x="52" y="30" width="16" height="30" fill="#b4232c"/>
  <text x="76" y="40" font-size="11" fill="#b4232c">half kick</text>
  <line x1="68" y1="50" x2="288" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="292,50 282,45 282,55" fill="#1d6fd1"/>
  <text x="180" y="68" font-size="11" text-anchor="middle" fill="#1d6fd1">drift with the new velocity</text>
  <rect x="292" y="30" width="16" height="30" fill="#b4232c"/>
  <text x="286" y="24" font-size="11" text-anchor="end" fill="#b4232c">half kick</text>
</svg>
```
:::

::: context yoshida A step backward to go forward
In 1990 the Japanese astronomer Haruo Yoshida showed how to build higher-order symplectic methods by chaining lower-order ones, and Forest and Ruth published an equivalent fourth-order scheme the same year. The weights $w_1 = 1/(2 - 2^{1/3}) \approx 1.3512$ and $w_0 = 1 - 2w_1 \approx -1.7024$ are chosen so the second- and third-order errors cancel. The middle substep has a negative weight: it runs time backward for a moment. Each substep is a leapfrog step, so each keeps area, and a chain of area-keeping steps keeps area too.
:::

::: context regularization Stretching time near perigee
On an eccentric orbit the satellite races through perigee and crawls through apogee, so a fixed time step is wasted at apogee and too coarse at perigee. Regularization replaces time with a new variable that ticks faster when the satellite is far out, for example by making $dt = r\,ds$ (a Sundman transformation). A fixed step in $s$ is then a small time step near Earth and a large one far away. With some extra care — rewriting the problem as a new Hamiltonian system in the variable $s$ — the method stays symplectic, because the step in $s$ never changes.
:::

::: context wisdom-holman The planets over billions of years
In 1991 Jack Wisdom and Matthew Holman published a symplectic method for the Solar System that splits the motion into a Kepler orbit around the Sun, which can be solved exactly, and the small tugs between planets, applied as kicks. Because the dominant motion is handled exactly, the steps can be days long. Their method and its descendants became the standard tool for integrating the planets over millions to billions of years, the kind of horizon where a secular energy drift would make any answer meaningless.
:::
