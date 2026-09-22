---
id: l01-relative-motion-frames
title: Relative motion frames: LVLH, Hill and RIC
minutes: 18
covers:
  - "relative motion frames: LVLH, Hill, RIC"
---

Every lesson up to now has asked where one spacecraft is relative to the centre of the Earth. Rendezvous and proximity operations ask a different question: where is one spacecraft relative to *another* spacecraft, one that is itself in orbit and moving at kilometres per second. A Dragon capsule closing on the ISS does not care that the station is doing 7.66 km/s around the planet — it cares that the station is 250 m away and closing at 0.1 m/s. Answering that question needs a frame that rides along with the target, and the mechanics of a frame that itself orbits the Earth, rotating once per revolution, is the subject of this lesson.

Get the frame wrong — flip an axis, or mix up which direction is "ahead" — and every formula downstream still looks right and gives an answer that is exactly backwards. A radial burn that should raise you above the target instead drops you into it. This module fixes one convention in this lesson and holds it for every lesson that follows, precisely so that a correct derivation later never reads as a mistake because the axes quietly changed.

This lesson builds the frame, names the two vehicles, and derives how to convert between "where is spacecraft B relative to the centre of the Earth" (what you already know how to compute) and "where is spacecraft B relative to spacecraft A" (what rendezvous guidance actually needs). Everything from the Clohessy-Wiltshire equations onward is built on the conversion this lesson derives.

## Target and chaser, chief and deputy

Rendezvous involves two vehicles. One is passive: it flies its own orbit and does not manoeuvre to close the gap. Operationally this is the **target** — the ISS, a satellite to be serviced, a tumbling piece of debris. In the astrodynamics literature the same vehicle is often called the **chief**, particularly in papers descended from Clohessy and Wiltshire's original 1960 formulation. The other vehicle is active: it fires thrusters to change the distance and rate between the two. Operationally this is the **chaser** — Dragon, Cygnus, Progress. In the literature it is the **deputy**.

Both pairs of names describe the same physical roles, and this module uses them interchangeably: target = chief, chaser = deputy. The target's orbit is the *reference orbit*. Everything in this module is stated relative to it.

## The LVLH frame

Attach a frame to the target that moves and rotates with it. Three names for essentially the same frame appear in the literature: **LVLH** (local-vertical, local-horizontal), the **Hill frame** (after G. W. Hill, who studied lunar relative motion in the 1870s), and **RIC** or **RSW** (radial – in-track/transverse – cross-track). They agree on the geometry — one axis along the local vertical, one along the direction of motion, one normal to the orbit plane — and differ, maddeningly, on axis order, sign and which axis points which way. NASA's own ISS operations documents use an LVLH convention with the vertical axis pointing *toward* Earth; the Hill/RIC convention used almost everywhere in the relative-motion research literature points it *away*. Neither is wrong. They are different books using the same three words for different axes.

This module fixes one convention now and never departs from it:

::: key The LVLH/Hill/RIC convention used throughout this module
Origin at the target. Right-handed axes $(\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}})$:

- $\hat{\mathbf{x}}$ — **radial**, pointing from Earth's centre through the target (outward). $+x$ is away from Earth.
- $\hat{\mathbf{y}}$ — **in-track** (or along-track), in the direction of the target's velocity. $+y$ is ahead of the target (the direction it is travelling); $-y$ is behind it.
- $\hat{\mathbf{z}} = \hat{\mathbf{x}} \times \hat{\mathbf{y}}$ — **cross-track**, normal to the target's orbit plane, completing a right-handed set.

"R-bar" names the radial ($x$) line through the target; "V-bar" names the in-track ($y$) line.
:::

Formally, with the target's inertial position and velocity $\mathbf{r}_t$, $\mathbf{v}_t$ (magnitudes $r_t$, $v_t$) and specific angular momentum $\mathbf{h}_t = \mathbf{r}_t \times \mathbf{v}_t$:

$$
\hat{\mathbf{x}} = \frac{\mathbf{r}_t}{r_t}, \qquad
\hat{\mathbf{z}} = \frac{\mathbf{h}_t}{\lVert \mathbf{h}_t \rVert}, \qquad
\hat{\mathbf{y}} = \hat{\mathbf{z}} \times \hat{\mathbf{x}}.
$$

For a circular orbit $\hat{\mathbf{y}}$ coincides with $\hat{\mathbf{v}}_t$ exactly, since velocity is purely tangential. For an eccentric orbit $\mathbf{v}_t$ has a small radial component near periapsis and apoapsis, so $\hat{\mathbf{y}}$ is close to but not identical to the velocity direction; "in-track" is the more accurate name for what $\hat{\mathbf{y}}$ actually is, and this distinction matters again once eccentric reference orbits appear later in the module.

::: warning A different book, a different frame
If you read Fehse, Vallado, or an ISS operations document and the signs do not match a formula here, do not assume either source made an error. Check that document's own stated convention before using its equations, every time, and never mix a formula from one convention with a number from another. Inside this module the convention above is the only one in force.
:::

## The frame rotates

Unlike the frames of earlier lessons, LVLH is not inertial — it rotates with the target, so Newton's laws do not apply directly inside it. That rotation is what makes the relative-motion equations of the next lesson look the way they do, and you need its rate before you can use the frame for anything quantitative.

The target sweeps out true anomaly at the instantaneous rate $\dot\theta = h_t / r_t^2$, and because $\hat{\mathbf{z}}$ is fixed along $\mathbf{h}_t$ (constant in direction, for unperturbed two-body motion) and the whole frame turns with the target in its own orbit plane, the frame's angular velocity is exactly

$$
\boldsymbol\omega = \dot\theta\, \hat{\mathbf{z}} = \frac{h_t}{r_t^2}\,\hat{\mathbf{z}}.
$$

For a circular reference orbit, $r_t$ is constant and $\dot\theta$ reduces to the mean motion $n = \sqrt{\mu/r_t^3}$ — constant in both magnitude and direction, so $\boldsymbol\omega = n\,\hat{\mathbf{z}}$ throughout. This is the single fact that makes the circular-reference-orbit case solvable in closed form, and losing it (an eccentric target, where $\dot\theta$ varies around the orbit) is exactly what breaks that closed form later in the module.

## Converting an absolute state to a relative one

Suppose you have propagated both vehicles' absolute states, $(\mathbf{r}_t, \mathbf{v}_t)$ for the target and $(\mathbf{r}_c, \mathbf{v}_c)$ for the chaser, in the same inertial frame — exactly what the two-body lessons already taught you to do. The relative position is the straightforward difference, projected onto the LVLH basis:

$$
\boldsymbol\rho = \mathbf{R}^\mathsf{T}(\mathbf{r}_c - \mathbf{r}_t), \qquad
\mathbf{R} = \begin{bmatrix} \hat{\mathbf{x}} & \hat{\mathbf{y}} & \hat{\mathbf{z}} \end{bmatrix},
$$

where $\mathbf{R}$ is the $3\times 3$ matrix with the LVLH unit vectors as its columns (so $\mathbf{R}$ rotates LVLH components into inertial components, and $\mathbf{R}^\mathsf{T} = \mathbf{R}^{-1}$ does the reverse). Write $\boldsymbol\rho = (x,y,z)$ for its components.

The relative *velocity* is not $\mathbf{R}^\mathsf{T}(\mathbf{v}_c - \mathbf{v}_t)$ on its own. Two observers disagree about the rate of change of a rotating vector: an inertial observer sees the frame's own spin contribute to the apparent velocity. The correct relation, from the transport theorem, is

$$
\dot{\boldsymbol\rho} = \mathbf{R}^\mathsf{T}\Big[(\mathbf{v}_c - \mathbf{v}_t) - \boldsymbol\omega \times (\mathbf{r}_c - \mathbf{r}_t)\Big],
$$

with $\boldsymbol\omega$ the frame angular velocity derived above, evaluated at the target's current state. Skip the $\boldsymbol\omega \times (\cdot)$ term and $\dot{\boldsymbol\rho}$ comes out wrong by an amount that grows with separation — small and easy to miss in a unit test with a 10 m offset, and badly wrong at 10 km.

Going the other direction — given a desired relative state $(\boldsymbol\rho, \dot{\boldsymbol\rho})$, find the chaser's absolute state to hand to a propagator — inverts both relations:

$$
\mathbf{r}_c = \mathbf{r}_t + \mathbf{R}\boldsymbol\rho, \qquad
\mathbf{v}_c = \mathbf{v}_t + \mathbf{R}\dot{\boldsymbol\rho} + \boldsymbol\omega \times (\mathbf{R}\boldsymbol\rho).
$$

You will use this pair constantly: the first form to read a relative state out of a nonlinear truth simulation, the second to build one for it.

::: example Building a relative state from two absolute orbits
The target orbits circularly at $r_t = 6791\,\mathrm{km}$ (about 413 km altitude, this module's standing reference orbit — see the summary table), at a point $40°$ around from a reference direction:

$$
\mathbf{r}_t = (5202.2,\ 4365.2,\ 0.0)\,\mathrm{km}, \qquad
\mathbf{v}_t = (-4.9246,\ 5.8689,\ 0.0)\,\mathrm{km/s}.
$$

Its speed is $v_t = \sqrt{\mu/r_t} = 7.6613\,\mathrm{km/s}$, and since the orbit is circular, $\mathbf{v}_t$ is purely tangential.

The LVLH basis follows directly from the convention above: $\hat{\mathbf{x}} = \mathbf{r}_t/r_t = (0.7660,\ 0.6428,\ 0)$, $\hat{\mathbf{z}} = \mathbf{h}_t/\lVert\mathbf{h}_t\rVert = (0,0,1)$ (the orbit is equatorial in this inertial frame), and $\hat{\mathbf{y}} = \hat{\mathbf{z}} \times \hat{\mathbf{x}} = (-0.6428,\ 0.7660,\ 0)$ — indeed parallel to $\mathbf{v}_t$, as expected for a circular orbit.

A chaser sits at $\mathbf{r}_c = \mathbf{r}_t + (0.3, -1.8, 0.4)\,\mathrm{km}$ with $\mathbf{v}_c = \mathbf{v}_t + (0.0004,\ 0.0002,\ -0.0001)\,\mathrm{km/s}$. Projecting:

$$
\boldsymbol\rho = \mathbf{R}^\mathsf{T}(\mathbf{r}_c-\mathbf{r}_t) = (-0.927,\ -1.572,\ 0.400)\,\mathrm{km}.
$$

The chaser is 927 m *below* the target radially, 1572 m *behind* it in-track, and 400 m out of plane — total separation $\lVert\boldsymbol\rho\rVert = 1.868\,\mathrm{km}$. For the velocity, first subtract the frame's own spin contribution $\boldsymbol\omega \times (\mathbf{r}_c-\mathbf{r}_t)$, with $\boldsymbol\omega = n\hat{\mathbf{z}}$, $n = \sqrt{\mu/r_t^3} = 1.1282\times 10^{-3}\,\mathrm{rad/s}$, then project:

$$
\dot{\boldsymbol\rho} = (-1.338,\ 0.942,\ -0.100)\,\mathrm{m/s}.
$$

The chaser is closing radially (negative $\dot x$, moving toward the target's altitude), moving forward in-track relative to the target, and drifting slightly out of plane.
:::

::: example Placing a chaser from a commanded relative state
Turn the conversion around. A guidance algorithm has decided the chaser should sit $150\,\mathrm{m}$ ahead ($+y$), $60\,\mathrm{m}$ above ($+x$), $20\,\mathrm{m}$ out of plane, closing at $50\,\mathrm{mm/s}$ toward the target along $-y$ (falling back toward it from ahead): $\boldsymbol\rho = (0.060,\ 0.150,\ 0.020)\,\mathrm{km}$, $\dot{\boldsymbol\rho} = (0,\ -0.00005,\ 0)\,\mathrm{km/s}$. The target is on the $x$-axis at this instant: $\mathbf{r}_t = (6791, 0, 0)\,\mathrm{km}$, $\mathbf{v}_t = (0,\ 7.66129,\ 0)\,\mathrm{km/s}$, so $\mathbf{R} = \mathbf{I}$ and the projection is trivial.

$$
\mathbf{r}_c = \mathbf{r}_t + \boldsymbol\rho = (6791.060,\ 0.150,\ 0.020)\,\mathrm{km}.
$$

For the velocity, add the frame-spin term $\boldsymbol\omega \times \mathbf{R}\boldsymbol\rho = n\hat{\mathbf{z}} \times (0.060, 0.150, 0.020) = n(-0.150,\ 0.060,\ 0)\,\mathrm{km/s} = (-1.693\times10^{-4},\ 6.771\times10^{-5},\ 0)\,\mathrm{km/s}$:

$$
\mathbf{v}_c = \mathbf{v}_t + \dot{\boldsymbol\rho} + \boldsymbol\omega\times\mathbf{R}\boldsymbol\rho = (-1.692\times10^{-4},\ 7.66131,\ 0)\,\mathrm{km/s}.
$$

Notice the chaser's speed, $7.661310\,\mathrm{km/s}$, is barely different from the target's $7.661292\,\mathrm{km/s}$ despite sitting 60 m higher — a fact the next two lessons make precise. This absolute state is what you would hand to a two-body (or higher-fidelity) propagator to verify the commanded relative motion in truth, which is exactly what the rest of this module does at every turn.
:::

## Why bother with a rotating frame at all

An alternative would be to track $\mathbf{r}_c - \mathbf{r}_t$ directly in the inertial frame and skip LVLH entirely. Two things make that impractical. First, a GNC system on the chaser measures range and bearing to the target with its own sensors — lidar, cameras, relative GPS — and those measurements are naturally in a frame tied to the target, not to some arbitrary inertial direction. Second, and more importantly, the relative *dynamics* — how $\boldsymbol\rho$ evolves under gravity — take a strikingly simple closed form in LVLH coordinates for a circular reference orbit, the Clohessy-Wiltshire equations of the next lesson. That simplicity is a property of the rotating frame; expressed in inertial coordinates the same physics is two ordinary orbits, offering no particular insight into how close they are to each other.

::: warning Not an inertial frame
Because LVLH rotates, $\ddot{\boldsymbol\rho}$ is not "force over mass" the way it would be in an inertial frame — fictitious Coriolis and centrifugal terms appear, exactly as they do for weather on a rotating Earth. The next lesson derives them explicitly. Do not apply $\mathbf{F} = m\mathbf{a}$ directly to $\boldsymbol\rho$ without them.
:::

## Check yourself

::: check
A target orbits with $\mathbf{r}_t = (0,\ 7000,\ 0)\,\mathrm{km}$ and $\mathbf{v}_t = (-7.0,\ 0,\ 3.0)\,\mathrm{km/s}$. Find the LVLH unit vectors $\hat{\mathbf{x}}$, $\hat{\mathbf{z}}$ and $\hat{\mathbf{y}}$.
:::

::: answer
$\hat{\mathbf{x}} = \mathbf{r}_t/r_t = (0,1,0)$, since $r_t = 7000\,\mathrm{km}$ and only the $y$-component is nonzero.

$\mathbf{h}_t = \mathbf{r}_t \times \mathbf{v}_t = (0,7000,0)\times(-7.0,0,3.0)$. Expanding: $h_x = 7000(3.0) - 0(0) = 21000$, $h_y = 0(-7.0)-0(3.0) = 0$, $h_z = 0(0)-7000(-7.0) = 49000$, so $\mathbf{h}_t = (21000, 0, 49000)\,\mathrm{km^2/s}$, $\lVert\mathbf{h}_t\rVert = \sqrt{21000^2+49000^2} = 53300.8\,\mathrm{km^2/s}$, giving $\hat{\mathbf{z}} = (0.3940,\ 0,\ 0.9191)$.

$\hat{\mathbf{y}} = \hat{\mathbf{z}}\times\hat{\mathbf{x}} = (0.3940,0,0.9191)\times(0,1,0) = (0(0)-0.9191(1),\ 0.9191(0)-0.3940(0),\ 0.3940(1)-0(0)) = (-0.9191,\ 0,\ 0.3940)$.
:::

::: check
Explain, in one or two sentences, why skipping the $\boldsymbol\omega \times (\mathbf{r}_c-\mathbf{r}_t)$ correction when computing relative velocity produces an error that grows with separation rather than a fixed offset.
:::

::: answer
That term is the velocity the LVLH frame's own rotation would impart to a point fixed at separation $\mathbf{r}_c-\mathbf{r}_t$, purely from the frame spinning — and it is proportional to the separation itself ($\boldsymbol\omega\times\mathbf{r}$ scales with $\lVert\mathbf{r}\rVert$). A chaser sitting still relative to the target (in LVLH) still appears to move if you only subtract inertial velocities and forget the frame is turning, and the size of that spurious apparent motion grows in direct proportion to how far away the chaser is.
:::

::: check
Why does $\hat{\mathbf{y}}$ coincide exactly with the target's velocity direction for a circular reference orbit, but only approximately for an eccentric one?
:::

::: answer
On a circular orbit the radius never changes, so all of the velocity is tangential — perpendicular to $\hat{\mathbf{x}}$ — and $\hat{\mathbf{y}}$, defined perpendicular to $\hat{\mathbf{x}}$ in the orbit plane, lines up with it exactly. On an eccentric orbit the radius is changing except at periapsis and apoapsis, so velocity has a nonzero radial component $\dot r\,\hat{\mathbf{x}}$ in addition to the tangential part; $\hat{\mathbf{y}}$, still defined purely geometrically as $\hat{\mathbf{z}}\times\hat{\mathbf{x}}$, no longer points exactly along $\mathbf{v}_t$.
:::

::: check
Two engineers, one using this module's convention and one using an ISS-ops LVLH convention with the vertical axis pointing toward Earth, both compute a "positive $x$" burn to raise a chaser away from the target. Will they command the same physical thruster firing?
:::

::: answer
No. "Positive $x$" means opposite things in the two conventions — outward in one, toward Earth in the other — so a burn that is $+x$ in one convention is $-x$ (and therefore the opposite physical direction) in the other. This is exactly the failure mode the lesson warns about: the formula for "a radial burn raises you" is convention-independent in words, but the *sign* to command it is not, and mixing a number from one source with a formula from another produces a burn in the wrong direction with no error message anywhere.
:::

::: check
For this module's standing reference orbit, $r_t = 6791\,\mathrm{km}$, compute the frame's angular velocity magnitude $n$ and its period $2\pi/n$.
:::

::: answer
$n = \sqrt{\mu/r_t^3} = \sqrt{398600.4418 / 6791^3} = 1.1282\times10^{-3}\,\mathrm{rad/s}$. Period $T = 2\pi/n = 5569.4\,\mathrm{s} = 92.82\,\mathrm{minutes}$. This $n$ is the constant used throughout the module wherever a circular reference orbit is assumed.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Target / chief | The passive, non-manoeuvring vehicle; the reference orbit |
| Chaser / deputy | The active vehicle whose position relative to the target is being controlled |
| $\hat{\mathbf{x}} = \mathbf{r}_t/r_t$ | Radial, outward from Earth through the target ($+x$ away from Earth) |
| $\hat{\mathbf{z}} = \mathbf{h}_t/\lVert\mathbf{h}_t\rVert$ | Cross-track, orbit-normal |
| $\hat{\mathbf{y}} = \hat{\mathbf{z}}\times\hat{\mathbf{x}}$ | In-track, $+y$ ahead of the target |
| R-bar, V-bar | The radial ($x$) and in-track ($y$) lines through the target |
| $\boldsymbol\omega = (h_t/r_t^2)\,\hat{\mathbf{z}}$ | LVLH frame angular velocity; reduces to $n\hat{\mathbf{z}}$ for a circular reference orbit |
| $\boldsymbol\rho = \mathbf{R}^\mathsf{T}(\mathbf{r}_c-\mathbf{r}_t)$ | Relative position from two absolute states |
| $\dot{\boldsymbol\rho} = \mathbf{R}^\mathsf{T}[(\mathbf{v}_c-\mathbf{v}_t) - \boldsymbol\omega\times(\mathbf{r}_c-\mathbf{r}_t)]$ | Relative velocity — never skip the $\boldsymbol\omega\times(\cdot)$ term |
| This module's reference orbit | $r_t = 6791\,\mathrm{km}$ (413 km altitude, circular): $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, $T = 92.82\,\mathrm{min}$ |

The next lesson puts a spacecraft in this frame and asks how it accelerates — which means differentiating $\boldsymbol\rho$ twice while the frame itself is turning, and that is where the Coriolis and centrifugal terms flagged above earn their keep.
