---
id: l08-energy-and-jacobi-drift
title: Energy and Jacobi-constant drift as an accuracy check
minutes: 20
covers:
  - Energy and Jacobi-constant drift as an independent accuracy check
---

Think about two bank accounts, checking and savings. All month you move money back and forth between them: two hundred dollars to savings, fifty back to checking. You do not know, off the top of your head, what either balance should be on the 30th. But you know one thing for sure. If no money came in and none went out, the *total* of the two accounts is the same as on the 1st. If the total has changed by three cents, there is a mistake in the bookkeeping somewhere, and you found it without knowing the right answer for either account.

An orbit keeps books the same way. A satellite trades speed for height and back again all the way around. It is fastest at the low point and slowest at the high point. But the total — kinetic energy plus potential energy — never changes. That total is known exactly from the first line of the simulation. So at any later moment you can recompute it from the state the integrator hands you, and any change is a mistake the integrator made.

This lesson turns that idea into a routine check. You will compute the **specific orbital energy** of a two-body orbit and watch how it drifts under different solvers and tolerances. You will learn to turn an energy error into meters of position error. You will see what the check cannot catch. And you will meet its cousin for Earth–Moon trajectories, the **Jacobi constant**, which keeps the same books in a frame that rotates with the Moon.

## A number that must not change

A **[[conserved quantity|noether]]** (also called an **invariant**, or an integral of the motion) is a number computed from the state that stays exactly constant along every true solution. Energy is the most famous one. It is conserved whenever the forces come from a fixed **potential** — a landscape of hills and valleys that does not change with time — and nothing like drag or thrust adds or removes energy.

Why is this so useful for checking an integrator? In the earlier lessons you measured error by comparing against an exact solution, such as $\cos t$ or a Kepler orbit. Real simulations have no exact solution to compare with. You can compare two runs at different tolerances, but that only tells you they agree, and two runs can share the same mistake.

A conserved quantity needs no reference. The true dynamics hold it perfectly constant. So whatever change you see is **purely numerical** — it was made by the integrator (or by round-off), not by the physics. That is what "independent accuracy check" means: independent of any second trajectory, and independent of the solver's own opinion of its error.

::: key
A conserved quantity is an exact invariant of the true dynamics. Its drift along a numerical solution is purely numerical error, and measuring it needs no reference trajectory.
:::

## Specific orbital energy

In the two-body problem a small satellite moves under the gravity of one big body, like Earth. Its energy per kilogram of satellite is

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}.
$$

Read $\varepsilon$ as "epsilon". Here $v$ is the speed, $r$ is the distance from Earth's center and $\mu$ ("mu") is Earth's gravitational parameter, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$. The first term is kinetic energy per kilogram. The second is potential energy per kilogram; it is negative because a satellite has to be given energy to escape to infinity, where the potential is zero.

The word **[[specific|specific-energy]]** means "per unit mass", so the units are joules per kilogram, which is the same as $\mathrm{m^2/s^2}$. A bound orbit has negative $\varepsilon$. It is tied to the orbit's size, the semi-major axis $a$, by a neat formula:

$$
\varepsilon = -\frac{\mu}{2a}.
$$

That is the **[[vis-viva|vis-viva]]** relation. Its consequence is important later: a wrong energy means a wrong orbit size.

In Python the check is two lines. Here is a circular orbit of radius $7000\,\mathrm{km}$, about $620\,\mathrm{km}$ above Earth's surface:

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14                       # Earth's mu, m^3/s^2

def two_body(t, y):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -MU * r / np.linalg.norm(r)**3])

def energy(y):
    r, v = y[:3], y[3:]
    return 0.5 * v @ v - MU / np.linalg.norm(r)

a = 7.0e6                                 # circular orbit radius, m
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)
print(f"period {T:.1f} s, energy {energy(y0):.4e} J/kg")
# period 5828.5 s, energy -2.8471e+07 J/kg
```

The period is $5828.5\,\mathrm{s}$, about $97$ minutes. The energy is $-2.8471 \times 10^7\,\mathrm{J/kg}$, and you can check it by hand: $-\mu / (2a) = -3.986 \times 10^{14} / (1.4 \times 10^7) \approx -2.847 \times 10^7$.

What you watch is the **relative energy drift**:

$$
\delta_\varepsilon(t) = \left| \frac{\varepsilon(t) - \varepsilon_0}{\varepsilon_0} \right|,
$$

where $\varepsilon_0$ ("epsilon nought") is the energy at the start. Dividing by $\varepsilon_0$ makes it a pure number, so a drift of $10^{-10}$ means the same thing for a low orbit and for a geostationary one.

::: key
Specific energy $\varepsilon = v^2/2 - \mu/r$ is a good accuracy check for two-body propagation because it is an exact invariant of the true dynamics, so any drift is purely numerical and requires no reference trajectory. Relative drift below about $10^{-10}$ over many revolutions is a reasonable bar for a high-accuracy propagation.
:::

## Reading the drift

Now propagate for twenty revolutions with three solver settings and print the drift after 5, 10 and 20 orbits. This continues from the block above.

```python
settings = [("RK45", 1e-9, 1e-6), ("DOP853", 1e-9, 1e-6), ("DOP853", 1e-12, 1e-9)]
e0 = energy(y0)
for method, rtol, atol in settings:
    sol = solve_ivp(two_body, (0.0, 20 * T), y0, method=method,
                    rtol=rtol, atol=atol, dense_output=True)
    drift = [abs((energy(sol.sol(k * T)) - e0) / e0) for k in (5, 10, 20)]
    print(f"{method:6} rtol={rtol:.0e} nfev={sol.nfev:>5}  "
          + "  ".join(f"{d:.1e}" for d in drift))
# RK45   rtol=1e-09 nfev=14378  1.1e-08  2.2e-08  4.4e-08
# DOP853 rtol=1e-09 nfev= 6137  4.0e-10  6.6e-10  1.1e-09
# DOP853 rtol=1e-12 nfev=14642  1.9e-13  1.2e-12  4.6e-13
```

::: example Reading a drift table
**RK45 at `rtol=1e-9`.** The drift goes $1.1 \times 10^{-8}$, $2.2 \times 10^{-8}$, $4.4 \times 10^{-8}$ at 5, 10 and 20 revolutions. Each time the run doubles, the drift doubles. That is steady, straight-line growth, which is called **[[secular|secular]]** drift. Every orbit adds about the same small energy error, always in the same direction.

**DOP853 at the same tolerance.** The drift is about $40$ times smaller, and it took fewer than half the function evaluations ($6137$ against $14\,378$). The eighth-order method takes longer steps and makes a smaller error per step. The growth is still roughly straight-line.

**DOP853 at `rtol=1e-12`.** The drift is $10^{-13}$ to $10^{-12}$ and does not grow steadily; it goes up and then down. At this level the integrator's own error is so small that round-off from the arithmetic takes over, and round-off errors add up like random steps, partly cancelling. This run meets the $10^{-10}$ bar with a margin of almost a hundred.

**Sanity check.** The best run cost about the same as RK45 at `rtol=1e-9` but is about $100\,000$ times better. For tight orbit work the method matters as much as the tolerance, which matches the advice of the `solve_ivp` lesson.
:::

Three shapes of drift are worth learning to recognise:

- **Straight-line (secular) growth.** Each step makes a small error of the same sign. Typical of Runge–Kutta methods at a tolerance well above round-off. Tightening the tolerance lowers the line but does not change its shape. The next lesson shows a kind of method that removes this shape altogether.
- **A slow, noisy wander.** Round-off. It grows roughly like the square root of the number of steps. It is the floor you cannot go below in `float64`.
- **A sudden jump.** Something happened at one moment: a close pass near a body where $1/r$ changes fast, a discontinuity, or a bug. Look at the step sizes around that time.

::: warning Default tolerances destroy an orbit
`solve_ivp`'s defaults are `rtol=1e-3`, `atol=1e-6`. For an orbit that is catastrophic, and the energy check shows it at once:

```python
sol = solve_ivp(two_body, (0.0, 20 * T), y0, dense_output=True)   # all defaults
print(sol.status, sol.message)
print(f"stopped after {sol.t[-1] / T:.2f} revolutions")
print(f"drift after one revolution: {abs((energy(sol.sol(T)) - e0) / e0):.1e}")
# -1 Required step size is less than spacing between numbers.
# stopped after 9.84 revolutions
# drift after one revolution: 5.8e-02
```

After one orbit the energy is already $5.8\%$ off. The numerical satellite loses hundreds of kilometers of altitude each revolution, spirals into the Earth, and the solver gives up after $9.84$ revolutions. Every orbit run should print its energy drift before anyone looks at a plot.
:::

## What an energy error means in meters

A drift of $4.4 \times 10^{-8}$ sounds tiny. Is it? The vis-viva relation turns it into distance.

Since $\varepsilon = -\mu/(2a)$, a small relative change in energy is the same size as a small relative change in the orbit's size:

$$
\left|\frac{\Delta\varepsilon}{\varepsilon}\right| = \left|\frac{\Delta a}{a}\right|.
$$

(Read $\Delta$ as "change in".) A wrong $a$ does two things. First, the orbit is the wrong size, so the satellite is off in the up-down direction by about $\Delta a$. Second, and far worse, the period is wrong. The period is $T = 2\pi\sqrt{a^3/\mu}$, so

$$
\frac{\Delta T}{T} = \frac{3}{2}\,\frac{\Delta a}{a}.
$$

A satellite with a slightly longer period falls a little further behind on every orbit, and the lag keeps adding up. That lag is **[[along-track|along-track]]** error: error in the direction the satellite is moving. After $N$ revolutions with a constant relative energy error $\delta$, the along-track error is about

$$
\Delta s \approx \frac{3}{2}\,\delta \cdot 2\pi N \cdot a.
$$

If the energy error itself grows in a straight line from zero to $\delta$, the average error over the run is half of that, so the factor $\frac{3}{2}$ becomes $\frac{3}{4}$.

::: example Twenty-eight meters from a drift of $4.4 \times 10^{-8}$
The RK45 run above ended 20 revolutions with a relative energy error of $\delta = 4.39 \times 10^{-8}$, growing in a straight line from zero.

**Radial error.** $\Delta a = \delta \cdot a = 4.39 \times 10^{-8} \times 7 \times 10^6\,\mathrm{m} \approx 0.31\,\mathrm{m}$. The orbit ended about $31\,\mathrm{cm}$ too big.

**Along-track error.** With straight-line growth, $\Delta s \approx \frac{3}{4} \times 4.39 \times 10^{-8} \times 2\pi \times 20 \times 7 \times 10^6\,\mathrm{m}$. Step by step: $2\pi \times 20 \approx 125.7$; $125.7 \times 7 \times 10^6 \approx 8.80 \times 10^8$; times $4.39 \times 10^{-8}$ gives $38.6$; times $\frac{3}{4}$ gives about $28.9\,\mathrm{m}$.

**Compare with the truth.** A circular orbit returns to its start after each period, so the final position error can be measured directly. It is $0.307\,\mathrm{m}$ outward and $27.9\,\mathrm{m}$ behind. The estimate from energy alone, $28.9\,\mathrm{m}$, is within $4\%$.

**Sanity check.** The along-track error is about $90$ times the radial error, and it grows with the number of orbits, so a tiny energy error becomes a large position error on long runs. That is why the bar for many-revolution propagation is so strict.
:::

::: warning The along-track error grows faster than the energy drift
A straight-line energy drift gives an along-track error that grows with the *square* of time: twice the run, twice the energy error, and twice as many orbits over which to lag — four times the miss. Do not judge a 30-day propagation by the drift after one day.
:::

## What energy cannot see

The energy check catches a lot, but it is one number. Any error that leaves the energy alone slips past it.

- **Errors in timing at the right energy.** A satellite on exactly the right orbit, but in the wrong place along it, has the correct energy. Once the along-track error exists, energy cannot see it grow.
- **Errors in direction.** Suppose a bug rotates the velocity vector by $1°$ without changing its length. The speed and radius are unchanged, so $\varepsilon$ is unchanged, but the orbit is now tilted or reshaped. A second invariant catches this: the **[[angular momentum|angular-momentum]]** vector $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, which is also exactly constant in the two-body problem. Checking both $\varepsilon$ and $\mathbf{h}$ costs nothing.
- **Wrong physics.** If you type $\mu$ wrong, or forget a force, the energy computed with the same wrong model is still conserved. The check tests the integration, not the model.

When the model has forces that are not conservative — drag, thrust, solar radiation pressure — energy really does change, and the check needs one more term. The energy should change by exactly the work done by those forces, so you check the balance instead: $\varepsilon(t) - \varepsilon_0 - \int_0^t \mathbf{a}_{nc} \cdot \mathbf{v}\,dt$, where $\mathbf{a}_{nc}$ is the non-conservative acceleration. Integrating that work term as an extra state costs one line.

When the model adds Earth's oblateness (the $J_2$ term), energy is still conserved, but only if you include the matching potential term, $\frac{\mu J_2 R_E^2}{2 r^3}\left(3\sin^2\phi - 1\right)$ with $\phi$ the latitude, in $\varepsilon$. Leave it out and you will see a large "drift" that is really a bookkeeping mistake in the check.

::: warning Compute the invariant for the model you integrated
The invariant must match the equations exactly: the same $\mu$, the same force terms, the same frame. A mismatch between the right-hand side and the energy function shows up as drift, and it looks exactly like an integrator problem. If the drift does not shrink when you tighten the tolerance, suspect the check before the solver.
:::

## The Jacobi constant

Near the Moon the two-body picture breaks down. A spacecraft on its way to the Moon, or orbiting it at a large distance, feels the Earth and the Moon both. Its ordinary energy is *not* conserved, because the Moon is moving: as it swings around Earth, its gravity pushes and pulls the spacecraft in a way that changes over time, the same way a moving planet gives a probe a gravity-assist boost.

The fix is to watch from a frame that turns with the Moon. In the **circular restricted three-body problem** (CR3BP), Earth and the Moon move on circles around their common center of mass, and the spacecraft is too light to disturb them. In a **[[rotating frame|rotating-frame]]** that turns once per lunar month, both bodies stand still on the $x$-axis. Now the landscape of hills and valleys is frozen in time again, and one conserved quantity returns: the **Jacobi constant**,

$$
C = 2\,\Omega(x, y, z) - \left(\dot{x}^2 + \dot{y}^2 + \dot{z}^2\right),
\qquad
\Omega = \frac{x^2 + y^2}{2} + \frac{1 - \mu}{r_1} + \frac{\mu}{r_2}.
$$

Here everything is in nondimensional units: distances in Earth–Moon distances ($384\,400\,\mathrm{km}$), time such that one lunar month is $2\pi$, and $\mu$ is now the Moon's share of the total mass, about $0.01215$. The distances $r_1$ and $r_2$ are to Earth (at $x = -\mu$) and to the Moon (at $x = 1 - \mu$). The velocities are measured in the rotating frame. Read $\Omega$ as "capital omega"; the first term in it comes from the frame's rotation, and the others are the two gravity wells.

$C$ plays the role energy played before: it is $-2$ times an energy-like quantity, so it goes *up* when that energy goes down. It was found by the mathematician **[[Carl Jacobi|jacobi-history]]**, and it is the standard accuracy check for halo orbits, distant retrograde orbits and every other Earth–Moon trajectory computed in this model.

::: example Checking a distant retrograde orbit
A **[[distant retrograde orbit|dro]]** (DRO) circles the Moon in the opposite direction to the Moon's own motion, far out. Start one $0.2$ Earth–Moon distances ($76\,880\,\mathrm{km}$) from the Moon, on the Earth side, and propagate it for 20 periods:

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 0.01215058560962404                   # Moon / (Earth + Moon) mass

def cr3bp(t, s):
    x, y, z, vx, vy, vz = s
    r1 = np.sqrt((x + MU)**2 + y**2 + z**2)         # distance to Earth
    r2 = np.sqrt((x - 1 + MU)**2 + y**2 + z**2)     # distance to Moon
    ax = 2 * vy + x - (1 - MU) * (x + MU) / r1**3 - MU * (x - 1 + MU) / r2**3
    ay = -2 * vx + y - (1 - MU) * y / r1**3 - MU * y / r2**3
    az = -(1 - MU) * z / r1**3 - MU * z / r2**3
    return [vx, vy, vz, ax, ay, az]

def jacobi(s):
    x, y, z, vx, vy, vz = s
    r1 = np.sqrt((x + MU)**2 + y**2 + z**2)
    r2 = np.sqrt((x - 1 + MU)**2 + y**2 + z**2)
    omega = 0.5 * (x**2 + y**2) + (1 - MU) / r1 + MU / r2
    return 2 * omega - (vx**2 + vy**2 + vz**2)

s0 = np.array([1 - MU - 0.2, 0.0, 0.0, 0.0, 0.54226651, 0.0])   # a DRO
P = 3.54823                                  # its period, nondimensional
C0 = jacobi(s0)
print(f"C0 = {C0:.6f}")
for method, rtol, atol in [("RK45", 1e-6, 1e-9), ("DOP853", 1e-12, 1e-12)]:
    sol = solve_ivp(cr3bp, (0.0, 20 * P), s0, method=method, rtol=rtol, atol=atol)
    drift = abs((jacobi(sol.y[:, -1]) - C0) / C0)
    print(f"{method:6} rtol={rtol:.0e} nfev={sol.nfev:>6} drift={drift:.1e}")
# C0 = 2.917783
# RK45   rtol=1e-06 nfev=  3956 drift=6.0e-06
# DOP853 rtol=1e-12 nfev= 12374 drift=1.1e-12
```

**Units.** One nondimensional time unit is $27.32 / (2\pi) \approx 4.35$ days, so the period $P \approx 3.548$ is about $15.4$ days, and 20 periods is about $309$ days.

**The RK45 run.** The relative drift is $6.0 \times 10^{-6}$, so $\Delta C \approx 6.0 \times 10^{-6} \times 2.918 \approx 1.75 \times 10^{-5}$. What speed error is that? $C$ contains $-v^2$, and a small change in $v^2$ is $2v\,\Delta v$. With $v \approx 0.542$, $\Delta v \approx 1.75 \times 10^{-5} / (2 \times 0.542) \approx 1.6 \times 10^{-5}$ velocity units. One velocity unit is $384\,400\,\mathrm{km}$ per $4.35$ days, about $1.02\,\mathrm{km/s}$, so the error is like an unplanned burn of about $1.6\,\mathrm{cm/s}$ — the size of a real trajectory-correction budget item.

**The DOP853 run.** A drift of $1.1 \times 10^{-12}$: about five million times smaller, for about three times the function evaluations. For mission design, that is the run you trust.
:::

::: warning Use rotating-frame velocities in the Jacobi constant
$C$ is only constant when $\dot{x}, \dot{y}, \dot{z}$ are measured in the rotating frame. If your state is in an inertial frame, or you convert positions but not velocities, $C$ will "drift" by amounts set by the Moon's motion, not by the integrator. As with energy: if the drift ignores your tolerance, suspect the check.
:::

## Check yourself

::: check
A GPS-like orbit has $a = 26\,560\,\mathrm{km}$. What is its specific energy? After a long run the relative energy drift is $2 \times 10^{-9}$. By how many meters is the semi-major axis off?
:::

::: answer
$\varepsilon = -\mu/(2a) = -3.986 \times 10^{14} / (2 \times 2.656 \times 10^7) \approx -7.50 \times 10^6\,\mathrm{J/kg}$.

The relative error in $a$ equals the relative energy error, so $\Delta a = 2 \times 10^{-9} \times 2.656 \times 10^7\,\mathrm{m} \approx 0.053\,\mathrm{m}$, about five centimeters.
:::

::: check
Two runs of the same 50-revolution propagation give relative energy drifts of $3 \times 10^{-9}$ and $3.2 \times 10^{-9}$ at `rtol=1e-10` and `rtol=1e-13`. The drift barely moves when the tolerance is tightened a thousand times. What are two likely explanations?
:::

::: answer
First, the energy function may not match the equations of motion: a different $\mu$, a missing $J_2$ potential term, or a force in the model that is not conservative (drag, thrust) with no work term in the check. Then the "drift" is real physics or a bookkeeping error, and no tolerance can remove it.

Second, the run may be at the round-off floor or limited by something other than the tolerance, such as `atol` being too loose on one state, so the requested `rtol` is not what controls the steps. Checking the energy function against the right-hand side, term by term, comes first.
:::

::: check
Why is the energy check called *independent*? Name one kind of error it cannot detect.
:::

::: answer
The true dynamics keep the energy exactly constant, so any change is caused by the numerics. Measuring it needs no second trajectory and does not rely on the solver's own error estimate. It is independent of both.

It cannot detect an error that keeps the energy right: a satellite on the correct orbit but at the wrong point along it, a velocity rotated without changing its length, or a wrong force model used consistently in both the equations and the check.
:::

::: check
An RK4 propagation of a $7000\,\mathrm{km}$ circular orbit shows a relative energy drift growing in a straight line to $1 \times 10^{-9}$ after 100 revolutions. Estimate the along-track error at that point.
:::

::: answer
With straight-line growth, $\Delta s \approx \frac{3}{4}\,\delta \cdot 2\pi N \cdot a$.

$2\pi \times 100 \approx 628.3$; times $7 \times 10^6\,\mathrm{m}$ is $4.40 \times 10^9\,\mathrm{m}$; times $10^{-9}$ is $4.40\,\mathrm{m}$; times $\frac{3}{4}$ gives about $3.3\,\mathrm{m}$.

The radial error is only $10^{-9} \times 7 \times 10^6 = 7\,\mathrm{mm}$. Almost all the error is along the track.
:::

::: check
You propagate a spacecraft near the Moon in an Earth-centered inertial frame, with Earth and Moon gravity, and compute $v^2/2 - \mu_E/r_E - \mu_M/r_M$. It changes by a large amount over a week, even with DOP853 at `rtol=1e-12`. Is the integrator broken?
:::

::: answer
No. The Moon is moving in that frame, so its gravity field changes with time, and the spacecraft's energy is really not conserved. The change is physics.

To get a conserved quantity, use the CR3BP model and compute the Jacobi constant in the frame that rotates with the Moon, using rotating-frame velocities. Its drift then measures the integrator.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Conserved quantity | constant on every true solution | drift is purely numerical; no reference needed |
| Specific energy | two-body energy per kilogram | $\varepsilon = v^2/2 - \mu/r = -\mu/(2a)$, in $\mathrm{J/kg}$ |
| Relative drift | the number you watch | $\lvert(\varepsilon - \varepsilon_0)/\varepsilon_0\rvert$; below about $10^{-10}$ over many orbits |
| Drift shapes | what each means | straight line: method error; noisy wander: round-off; jump: event or bug |
| Energy to position | how a small drift costs meters | $\Delta a/a = \Delta\varepsilon/\varepsilon$; $\Delta T/T = \frac{3}{2}\Delta a/a$; lag grows along-track |
| Blind spots | what energy misses | timing at the right energy, rotated velocity, wrong physics; also check $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ |
| Jacobi constant | the CR3BP invariant | $C = 2\Omega - v^2$ in the rotating frame |

Every Runge–Kutta run above the round-off floor showed straight-line energy drift, and tightening the tolerance only lowered the line. The next lesson meets **symplectic integrators**, which change the shape of the curve itself: their energy error stays bounded however long you run.

::: context noether Why energy is conserved at all
In 1918 the mathematician Emmy Noether proved that every symmetry of a physical system comes with a conserved quantity. If the laws do not change when you shift the clock — the same forces act today as tomorrow — then energy is conserved. If they do not change when you rotate the system, angular momentum is conserved. That is why the two-body problem has both, and why a moving Moon, which makes the forces depend on time, breaks ordinary energy conservation.
:::

::: context specific-energy Per kilogram, so mass drops out
"Specific" in engineering means "divided by mass", as in specific heat or specific impulse. Dividing by the satellite's mass is natural here because gravity's pull is proportional to mass, so the satellite's own mass cancels out of its motion. A $1\,\mathrm{kg}$ cubesat and a $400\,\mathrm{t}$ space station on the same orbit have the same $\varepsilon$. One $\mathrm{J/kg}$ is one $\mathrm{m^2/s^2}$, the units of a speed squared, which fits the $v^2/2$ term.
:::

::: context vis-viva A "living force" from the 1600s
Vis viva is Latin for "living force", the name Gottfried Leibniz gave to the quantity mass times speed squared, an early form of kinetic energy. Orbital mechanics kept the name for the equation $v^2 = \mu\,(2/r - 1/a)$, which gives the speed anywhere on an orbit from the distance and the orbit's size. Multiply it by one half and subtract $\mu/r$, and you get $\varepsilon = -\mu/(2a)$: the energy depends only on the size of the orbit, not on its shape.
:::

::: context secular Why "secular" means slow and steady
In astronomy, a secular change is one that keeps going in the same direction over a long time, instead of oscillating back and forth. The word comes from the Latin *saeculum*, "an age" or "a century", because the first secular effects astronomers found were changes that took centuries to notice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="170" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="46" y="18" font-size="11" fill="#1f2a44">energy error</text>
  <line x1="40" y1="150" x2="330" y2="40" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="50" font-size="11" text-anchor="end" fill="#b4232c">secular: straight line</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" points="40,150 60,142 80,146 100,136 120,139 140,130 160,134 180,127 200,131 220,122 240,126 260,120 280,124 300,116 320,119 330,114"/>
  <text x="330" y="108" font-size="11" text-anchor="end" fill="#6c7a93">round-off: noisy wander</text>
  <path d="M40,150 Q55,132 70,150 T100,150 T130,150 T160,150 T190,150 T220,150 T250,150 T280,150 T310,150 T340,150" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="330" y="140" font-size="11" text-anchor="end" fill="#1d6fd1">bounded: wiggles, no growth</text>
</svg>
```
:::

::: context along-track Behind, not below
Position errors on an orbit are usually split three ways: radial (up and down), along-track (forward and back along the path) and cross-track (sideways, out of the orbit plane). A small energy error makes a small radial error but a growing along-track error, because the wrong period makes the satellite fall further behind every lap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="130" cy="100" r="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="130" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="187.3" cy="59.8" r="6" fill="#1d6fd1"/>
  <text x="199.3" y="53.8" font-size="11" fill="#1d6fd1">true position</text>
  <circle cx="205.3" cy="84.0" r="6" fill="#b4232c"/>
  <text x="217.3" y="88.0" font-size="11" fill="#b4232c">computed</text>
  <text x="217.3" y="102.0" font-size="11" fill="#b4232c">(a bit high, far behind)</text>
  <path d="M190.6,135.0 A70,70 0 0 0 199.7,106.1" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="200.4,98.1 203.7,106.4 195.7,105.8" fill="#1d6fd1"/>
  <text x="212" y="140" font-size="11" fill="#1d6fd1">motion: counterclockwise</text>
  <text x="130" y="192" font-size="11" text-anchor="middle" fill="#6c7a93">errors drawn far larger than real</text>
</svg>
```
:::

::: context angular-momentum The second free check
The angular momentum per kilogram, $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, points perpendicular to the orbit plane, and its length is twice the area the line from Earth to the satellite sweeps out each second. Kepler's second law — equal areas in equal times — is the statement that this length is constant. In the two-body problem the whole vector is constant, so its direction pins the orbit plane. A check that watches both $\varepsilon$ and $\mathbf{h}$ catches errors in size, shape and orientation.
:::

::: context rotating-frame The Earth–Moon system, standing still
In the rotating frame, Earth and the Moon sit fixed on the $x$-axis, and the frame turns once every $27.32$ days. Distances are in units of the Earth–Moon distance, so the Moon is at $x = 1 - \mu \approx 0.988$. The loop is the distant retrograde orbit from the example, drawn from the computed trajectory: it is taller than it is wide, and it circles the Moon clockwise, against the Moon's own motion around Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="340" y="116" font-size="11" text-anchor="end" fill="#6c7a93">x</text>
  <circle cx="40" cy="100" r="9" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="250" cy="100" r="4" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <text x="250" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">Moon</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="208.0,100.0 208.4,91.6 209.4,83.5 211.2,75.7 213.5,68.5 216.5,62.0 219.9,56.2 223.9,51.3 228.2,47.2 232.9,44.1 237.9,41.9 243.1,40.6 248.5,40.3 254.0,40.9 259.5,42.4 264.9,44.9 270.1,48.3 275.1,52.5 279.7,57.5 283.8,63.3 287.4,69.7 290.3,76.7 292.4,84.2 293.8,92.0 294.2,100.0 293.8,108.0 292.4,115.8 290.3,123.3 287.4,130.3 283.8,136.7 279.7,142.5 275.1,147.5 270.1,151.7 264.9,155.1 259.5,157.6 254.0,159.1 248.5,159.7 243.1,159.4 237.9,158.1 232.9,155.9 228.2,152.8 223.9,148.7 219.9,143.8 216.5,138.0 213.5,131.5 211.2,124.3 209.4,116.5 208.4,108.4 208.0,100.0"/>
  <polygon points="208.4,84 204,93 212.6,93" fill="#1d6fd1"/>
  <text x="300" y="40" font-size="11" fill="#1d6fd1">DRO</text>
  <text x="120" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">frame turns once a lunar month</text>
</svg>
```
:::

::: context jacobi-history Found in 1836
Carl Gustav Jacob Jacobi, a German mathematician, published the constant in 1836 while studying the motion of a small body under the pull of two large ones. It has a practical meaning for mission designers: since $C = 2\Omega - v^2$ and $v^2$ can never be negative, a spacecraft can only go where $2\Omega \ge C$. The boundaries of those allowed regions are the "zero-velocity curves", which show at a glance whether a spacecraft with a given $C$ can reach the Moon or escape the Earth–Moon system at all.
:::

::: context dro Orion's parking orbit
On the Artemis I mission in late 2022, the uncrewed Orion capsule entered a distant retrograde orbit around the Moon and flew about half a revolution before heading home. DROs are attractive because they are very stable: small errors do not grow quickly, so little propellant is needed to stay in one. Stable does not mean easy to compute, though; designers still check the Jacobi constant on every propagated arc, because in the three-body problem it is the only conserved quantity they have.
:::
