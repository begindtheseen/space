---
id: l01-relative-motion-frames
title: Relative motion frames: LVLH, Hill and RIC
minutes: 21
covers:
  - "relative motion frames: LVLH, Hill, RIC"
---

Picture two cars on a highway, both doing 100 km/h. To someone standing by the road, both are going very fast. To the driver of the car behind, the car ahead is barely moving at all. It is 20 m in front, and the gap is shrinking by a walking pace. For the driver, the only numbers that matter are the gap and how fast it changes.

Every lesson up to now has asked where a spacecraft is relative to the center of the Earth. **Rendezvous and proximity operations** — bringing one spacecraft up close to another and flying next to it — ask the driver's question instead. Where is one spacecraft relative to *another* spacecraft? A Dragon capsule closing on the International Space Station does not care that the station is doing $7.66\,\mathrm{km/s}$ around the planet. It cares that the station is $250\,\mathrm{m}$ away and the gap is closing at $0.1\,\mathrm{m/s}$.

To answer that question you need a set of directions that rides along with the target spacecraft. Those directions turn as the target goes around the Earth, once per orbit. This lesson builds that moving frame, names the two vehicles, and shows how to convert between "where is the chaser relative to Earth's center" (which you already know how to compute) and "where is the chaser relative to the target" (which rendezvous guidance needs). Everything from the Clohessy-Wiltshire equations onward is built on this conversion.

One warning before we start. If you get the frame wrong — flip an axis, or mix up which way is "ahead" — every formula afterward still looks right. It just gives an answer that is exactly backwards. A burn that should lift you above the target instead drops you into it. So this module fixes one convention in this lesson and keeps it for every lesson that follows.

## Target and chaser, chief and deputy

A rendezvous involves two vehicles, and they play different roles.

One vehicle is passive. It flies its own orbit and does not steer to close the gap. In operations it is called the **target** — the ISS, a satellite that needs servicing, a tumbling piece of debris.

The other vehicle is active. It fires its thrusters to change the distance and the closing speed. In operations it is called the **chaser** — Dragon, Cygnus, Progress.

Research papers, especially on satellites flying in formation, often use a second pair of names: the **[[chief and deputy|chief-deputy]]**. The chief is the target. The deputy is the chaser. This module uses both pairs: target = chief, chaser = deputy.

The target's orbit is called the **reference orbit** — the orbit everything else is measured from. Every position and speed in this module is stated relative to it.

## The LVLH frame

Imagine you are an astronaut sitting in the target, looking out. Three directions make sense to you right away. "Up" is straight away from the Earth. "Ahead" is the way you are flying. "Sideways" is out the side window, square to both. A frame built from those three directions is the one rendezvous uses.

It goes by three names in books and papers, for what is really one frame:

- **LVLH**, short for **local-vertical, local-horizontal** — "vertical" and "horizontal" measured at the target's own spot in the sky;
- the **[[Hill frame|hill-history]]**, after the astronomer G. W. Hill, who studied the Moon's motion relative to the Earth in the 1870s;
- **RIC** (radial, in-track, cross-track), which Vallado's book calls **RSW**.

They all agree on the three directions: one along the local vertical, one along the direction of motion, and one square to the orbit's flat plane. They disagree, maddeningly, on the order of the axes and which way each one points. NASA's own ISS operations documents use an [[LVLH convention with the vertical axis pointing toward Earth|iss-convention]]. The research papers on relative motion nearly all point it *away* from Earth. Neither is wrong. They are two books using the same words for different arrows.

This module fixes one convention now and never leaves it. Picture it with the [[target moving across the page|lvlh-picture]]:

::: key The LVLH/Hill/RIC convention used throughout this module
Origin at the target. Right-handed axes $(\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}})$:

- $\hat{\mathbf{x}}$ — **radial**, pointing from Earth's center through the target (outward). $+x$ is away from Earth.
- $\hat{\mathbf{y}}$ — **in-track** (or along-track), in the direction of the target's velocity. $+y$ is ahead of the target (the direction it is traveling); $-y$ is behind it.
- $\hat{\mathbf{z}} = \hat{\mathbf{x}} \times \hat{\mathbf{y}}$ — **cross-track**, normal to the target's orbit plane, completing a right-handed set.

"R-bar" names the radial ($x$) line through the target; "V-bar" names the in-track ($y$) line.
:::

A few words about the symbols. The little hat means "unit vector" — an arrow of length exactly 1 that only shows a direction. Read $\hat{\mathbf{x}}$ as "x-hat". The $\times$ between two vectors is the **cross product**, which gives a third arrow square to both. "Right-handed" means that if you curl the fingers of your right hand from $\hat{\mathbf{x}}$ toward $\hat{\mathbf{y}}$, your thumb points along $\hat{\mathbf{z}}$.

### Building the axes from the target's orbit

A computer cannot "look out the window". It builds the three arrows from the target's position and velocity. Call the target's position from Earth's center $\mathbf{r}_t$ (read "r sub t"), its velocity $\mathbf{v}_t$, and their lengths $r_t$ and $v_t$. The target's **[[specific angular momentum|specific-angular-momentum]]** is $\mathbf{h}_t = \mathbf{r}_t \times \mathbf{v}_t$, an arrow that sticks straight out of the orbit's plane. Then:

$$
\hat{\mathbf{x}} = \frac{\mathbf{r}_t}{r_t}, \qquad
\hat{\mathbf{z}} = \frac{\mathbf{h}_t}{\lVert \mathbf{h}_t \rVert}, \qquad
\hat{\mathbf{y}} = \hat{\mathbf{z}} \times \hat{\mathbf{x}}.
$$

In words: divide the position by its own length to get the "up" arrow. Divide the angular momentum by its length to get the "sideways" arrow. The cross product of those two gives "ahead". The double bars $\lVert \cdot \rVert$ mean "length of".

On a **circular** orbit, $\hat{\mathbf{y}}$ points exactly along the velocity. The distance from Earth never changes, so none of the velocity is up or down — all of it is sideways to $\hat{\mathbf{x}}$.

On an **eccentric** (oval) orbit, the target climbs on one half of the orbit and falls on the other. Its velocity then has a small up-or-down part, so $\hat{\mathbf{y}}$ is close to the velocity direction but not exactly on it. Only at the lowest point (periapsis) and the highest point (apoapsis) do they line up. That is why "in-track" is the more accurate name for $\hat{\mathbf{y}}$. The difference matters again when eccentric reference orbits appear later in the module.

::: warning A different book, a different frame
If you read Fehse, Vallado or an ISS operations document and the signs do not match a formula here, do not assume anyone made an error. Check that document's own stated convention before using its equations — every time. Never mix a formula from one convention with a number from another. Inside this module, the convention above is the only one in force.
:::

## The frame rotates

Here is the twist. The "up" arrow always points away from Earth, and the target goes around the Earth. So "up" keeps turning. After half an orbit, "up" points the opposite way in space from where it started. The whole frame turns once per orbit, like the seats of a Ferris wheel that always stay the same way up relative to the wheel's hub.

A frame that turns is not **inertial**. An inertial frame is one that does not spin or speed up, so Newton's laws work in it as written. Inside a turning frame, Newton's laws need extra terms. Those extra terms shape the whole next lesson. Before you can use the frame for anything with numbers, you need to know how fast it turns.

The target moves around its orbit through an angle called the **true anomaly**, $\theta$ (the Greek letter "theta"). The dot on top means "rate of change", so $\dot\theta$ ("theta-dot") is how fast that angle grows. From the two-body lessons, $\dot\theta = h_t / r_t^2$.

The frame turns in the orbit's plane, about the $\hat{\mathbf{z}}$ axis. With only Earth's gravity acting, $\mathbf{h}_t$ never changes direction, so that axis stays put. So the frame's **angular velocity** — its turning rate, as an arrow along the turning axis — is

$$
\boldsymbol\omega = \dot\theta\, \hat{\mathbf{z}} = \frac{h_t}{r_t^2}\,\hat{\mathbf{z}}.
$$

($\boldsymbol\omega$ is the Greek letter "omega".)

For a circular reference orbit, $r_t$ never changes. Then $\dot\theta$ becomes the constant **[[mean motion|mean-motion]]**,

$$
n = \sqrt{\frac{\mu}{r_t^3}},
$$

where $\mu$ ("mew") is Earth's gravitational parameter, $3.986 \times 10^5\,\mathrm{km^3/s^2}$. The frame's spin, $\boldsymbol\omega = n\,\hat{\mathbf{z}}$, is then constant in both size and direction.

That single fact is what lets the circular case be solved with a neat formula. Lose it — give the target an oval orbit, where $\dot\theta$ speeds up and slows down around the orbit — and the neat formula breaks. You will see exactly how later in the module.

## Converting an absolute state to a relative one

Suppose you have both vehicles' **absolute states** — position and velocity measured from Earth's center, in the same inertial frame. Write $(\mathbf{r}_t, \mathbf{v}_t)$ for the target and $(\mathbf{r}_c, \mathbf{v}_c)$ for the chaser. The two-body lessons taught you to compute these. Now turn them into a **relative state**: where the chaser is, and how it is moving, as seen from the target in LVLH.

### Relative position

The relative position is the plain difference $\mathbf{r}_c - \mathbf{r}_t$, the arrow from target to chaser. But its numbers are still written along the inertial axes. To read it along the LVLH axes, take its component along each LVLH arrow:

$$
\boldsymbol\rho = \mathbf{R}^\mathsf{T}(\mathbf{r}_c - \mathbf{r}_t), \qquad
\mathbf{R} = \begin{bmatrix} \hat{\mathbf{x}} & \hat{\mathbf{y}} & \hat{\mathbf{z}} \end{bmatrix}.
$$

Here $\boldsymbol\rho$ (the Greek letter "rho") is the relative position in LVLH, with parts $(x, y, z)$. $\mathbf{R}$ is the $3\times 3$ matrix whose columns are the three LVLH unit vectors. Multiplying by $\mathbf{R}$ turns LVLH components into inertial ones. Multiplying by its **transpose** $\mathbf{R}^\mathsf{T}$ (read "R transpose" — the rows and columns swapped) goes the other way. For a matrix like this, [[the transpose is also the inverse|rotation-transpose]]: $\mathbf{R}^\mathsf{T} = \mathbf{R}^{-1}$.

### Relative velocity: the spinning-frame correction

You might expect the relative velocity to be $\mathbf{R}^\mathsf{T}(\mathbf{v}_c - \mathbf{v}_t)$, by the same move. It is not.

Think of a playground merry-go-round. A child sits still on it, halfway out. To the child, nothing is moving. To a parent standing on the ground, the child is whizzing around in a circle. The difference is the merry-go-round's spin. A point sitting still in a turning frame still [[moves as seen from outside|spinning-frame-velocity]], at a speed that grows with its distance from the center.

The same thing happens in LVLH. To find the velocity *as seen in the turning frame*, you must remove the part that comes only from the frame's spin. That part is $\boldsymbol\omega \times (\mathbf{r}_c - \mathbf{r}_t)$. The correct rule, which comes from the **transport theorem** (the rule for rates of change seen from a turning frame), is

$$
\dot{\boldsymbol\rho} = \mathbf{R}^\mathsf{T}\Big[(\mathbf{v}_c - \mathbf{v}_t) - \boldsymbol\omega \times (\mathbf{r}_c - \mathbf{r}_t)\Big],
$$

with $\boldsymbol\omega$ the frame's spin from the last section, taken at the target's current state. Here $\dot{\boldsymbol\rho}$ ("rho-dot") is the relative velocity in LVLH, with parts $(\dot x, \dot y, \dot z)$.

Skip the $\boldsymbol\omega \times (\cdot)$ term and $\dot{\boldsymbol\rho}$ comes out wrong. The error grows with separation. It is small and easy to miss in a test with a $10\,\mathrm{m}$ offset, and badly wrong at $10\,\mathrm{km}$.

### Going back the other way

Sometimes you have a relative state $(\boldsymbol\rho, \dot{\boldsymbol\rho})$ that you *want*, and you need the chaser's absolute state to hand to a **propagator** — a program that steps an orbit forward in time. Undo both steps:

$$
\mathbf{r}_c = \mathbf{r}_t + \mathbf{R}\boldsymbol\rho, \qquad
\mathbf{v}_c = \mathbf{v}_t + \mathbf{R}\dot{\boldsymbol\rho} + \boldsymbol\omega \times (\mathbf{R}\boldsymbol\rho).
$$

This time the spin term is *added*, because you are putting back the motion the frame's turning gives to a point.

You will use this pair all the time. The first pair of formulas reads a relative state out of an accurate simulation of both orbits. The second builds a starting state for one.

::: example Building a relative state from two absolute orbits
**The target.** It is on a circular orbit of radius $r_t = 6791\,\mathrm{km}$ (about $413\,\mathrm{km}$ up — this module's standing reference orbit). At this moment it is $40^\circ$ around from the inertial $x$ axis:

$$
\mathbf{r}_t = (5202.2,\ 4365.2,\ 0.0)\,\mathrm{km}, \qquad
\mathbf{v}_t = (-4.9246,\ 5.8689,\ 0.0)\,\mathrm{km/s}.
$$

Its speed is $v_t = \sqrt{\mu/r_t} = 7.6613\,\mathrm{km/s}$. Because the orbit is circular, all of that velocity is sideways to the radius.

**The LVLH arrows.** Divide the position by its length: $\hat{\mathbf{x}} = \mathbf{r}_t/r_t = (0.7660,\ 0.6428,\ 0)$. That is $(\cos 40^\circ, \sin 40^\circ, 0)$, as it should be. The orbit lies in the inertial $xy$ plane, so its angular momentum points straight along the inertial $z$ axis: $\hat{\mathbf{z}} = (0, 0, 1)$. Then $\hat{\mathbf{y}} = \hat{\mathbf{z}} \times \hat{\mathbf{x}} = (-0.6428,\ 0.7660,\ 0)$. Check: dividing $\mathbf{v}_t$ by $7.6613$ gives the same arrow, as expected for a circular orbit.

**The chaser.** It sits at $\mathbf{r}_c = \mathbf{r}_t + (0.3,\ -1.8,\ 0.4)\,\mathrm{km}$ with $\mathbf{v}_c = \mathbf{v}_t + (0.0004,\ 0.0002,\ -0.0001)\,\mathrm{km/s}$. These offsets are in *inertial* axes.

**Relative position.** Multiplying by $\mathbf{R}^\mathsf{T}$ means taking the dot product of the offset with each LVLH arrow:

$$
\begin{aligned}
x &= (0.3)(0.7660) + (-1.8)(0.6428) = 0.2298 - 1.1570 = -0.927\,\mathrm{km}, \\
y &= (0.3)(-0.6428) + (-1.8)(0.7660) = -0.1928 - 1.3789 = -1.572\,\mathrm{km}, \\
z &= 0.400\,\mathrm{km}.
\end{aligned}
$$

So $\boldsymbol\rho = (-0.927,\ -1.572,\ 0.400)\,\mathrm{km}$. The chaser is $927\,\mathrm{m}$ *below* the target, $1572\,\mathrm{m}$ *behind* it, and $400\,\mathrm{m}$ out of the orbit plane. The total distance is $\lVert\boldsymbol\rho\rVert = \sqrt{0.927^2 + 1.572^2 + 0.400^2} = 1.868\,\mathrm{km}$.

**The spin term.** The frame turns at $n = \sqrt{\mu/r_t^3} = 1.1282\times 10^{-3}\,\mathrm{rad/s}$ about $\hat{\mathbf{z}} = (0,0,1)$. For a spin about $z$, the cross product is $n\,\hat{\mathbf{z}} \times (a, b, c) = n(-b,\ a,\ 0)$. So

$$
\boldsymbol\omega \times (0.3,\ -1.8,\ 0.4) = n\,(1.8,\ 0.3,\ 0) = (2.031,\ 0.338,\ 0)\,\mathrm{m/s}.
$$

**Relative velocity.** Subtract that from the velocity offset, $(0.4,\ 0.2,\ -0.1)\,\mathrm{m/s}$:

$$
(0.4 - 2.031,\ 0.2 - 0.338,\ -0.1 - 0) = (-1.631,\ -0.138,\ -0.100)\,\mathrm{m/s}.
$$

Then take the dot product with each LVLH arrow, as before:

$$
\begin{aligned}
\dot x &= (-1.631)(0.7660) + (-0.138)(0.6428) = -1.249 - 0.089 = -1.338\,\mathrm{m/s}, \\
\dot y &= (-1.631)(-0.6428) + (-0.138)(0.7660) = 1.048 - 0.106 = 0.942\,\mathrm{m/s}, \\
\dot z &= -0.100\,\mathrm{m/s}.
\end{aligned}
$$

So $\dot{\boldsymbol\rho} = (-1.338,\ 0.942,\ -0.100)\,\mathrm{m/s}$.

**What it means.** Read each part next to its position. The chaser is below the target ($x < 0$) and $\dot x$ is negative, so it is sinking *further* below. It is behind ($y < 0$) and $\dot y$ is positive, so it is catching up along the track. It is out of plane on the $+z$ side and $\dot z$ is negative, so it is heading back toward the plane.

Notice how big the spin term was: about $2\,\mathrm{m/s}$, larger than the whole inertial velocity offset. Forgetting it would have made every one of these conclusions wrong.
:::

::: example Placing a chaser from a commanded relative state
Now go the other way. A guidance program wants the chaser $150\,\mathrm{m}$ ahead ($+y$), $60\,\mathrm{m}$ above ($+x$) and $20\,\mathrm{m}$ out of plane, drifting back toward the target at $50\,\mathrm{mm/s}$ along $-y$:

$$
\boldsymbol\rho = (0.060,\ 0.150,\ 0.020)\,\mathrm{km}, \qquad \dot{\boldsymbol\rho} = (0,\ -0.00005,\ 0)\,\mathrm{km/s}.
$$

**The target.** At this instant it sits on the inertial $x$ axis: $\mathbf{r}_t = (6791,\ 0,\ 0)\,\mathrm{km}$ and $\mathbf{v}_t = (0,\ 7.66129,\ 0)\,\mathrm{km/s}$. The LVLH arrows then line up with the inertial ones, so $\mathbf{R} = \mathbf{I}$ (the identity matrix, which changes nothing). That keeps the arithmetic short.

**Position.** Add the offset:

$$
\mathbf{r}_c = \mathbf{r}_t + \boldsymbol\rho = (6791.060,\ 0.150,\ 0.020)\,\mathrm{km}.
$$

**The spin term.** Using the same cross-product pattern as before,

$$
\boldsymbol\omega \times \boldsymbol\rho = n\,(-0.150,\ 0.060,\ 0) = (-1.692\times10^{-4},\ 6.769\times10^{-5},\ 0)\,\mathrm{km/s}.
$$

**Velocity.** Add all three pieces — target velocity, commanded relative velocity, spin term:

$$
\mathbf{v}_c = (0,\ 7.66129,\ 0) + (0,\ -0.00005,\ 0) + (-0.0001692,\ 0.0000677,\ 0) = (-1.692\times10^{-4},\ 7.66131,\ 0)\,\mathrm{km/s}.
$$

**Sanity check.** The chaser's speed is $7.661310\,\mathrm{km/s}$, barely different from the target's $7.661292\,\mathrm{km/s}$, even though it sits $60\,\mathrm{m}$ higher. That is reasonable: a $60\,\mathrm{m}$ change on a $6791\,\mathrm{km}$ orbit is tiny. The next lessons explain exactly what that small speed difference does over time.

This absolute state is what you would hand to a two-body propagator (or a more detailed one) to check the commanded relative motion against reality. The rest of this module does that at every turn.
:::

## Why bother with a rotating frame at all

You could skip LVLH and track $\mathbf{r}_c - \mathbf{r}_t$ in the inertial frame. Two things make that a poor choice.

First, the chaser's sensors see the target, not the stars. Lidar, cameras and relative GPS measure range and direction to the target. Those measurements naturally live in a frame tied to the target, not in some fixed inertial direction.

Second, and more important, the relative *motion* — how $\boldsymbol\rho$ changes under gravity — takes a strikingly simple form in LVLH when the reference orbit is circular. Those are the Clohessy-Wiltshire equations of the next lesson. The simplicity belongs to the rotating frame. In inertial coordinates the same physics is two separate orbits, and it gives no feel at all for how close they are to each other.

::: warning Not an inertial frame
Because LVLH turns, $\ddot{\boldsymbol\rho}$ (the relative acceleration, read "rho double-dot") is not "force divided by mass" the way it would be in an inertial frame. Extra **Coriolis** and **centrifugal** terms appear, exactly as they do for [[winds on the turning Earth|coriolis-weather]]. The next lesson derives them. Do not apply $\mathbf{F} = m\mathbf{a}$ directly to $\boldsymbol\rho$ without them.
:::

## Check yourself

::: check
A target orbits with $\mathbf{r}_t = (0,\ 7000,\ 0)\,\mathrm{km}$ and $\mathbf{v}_t = (-7.0,\ 0,\ 3.0)\,\mathrm{km/s}$. Find the LVLH unit vectors $\hat{\mathbf{x}}$, $\hat{\mathbf{z}}$ and $\hat{\mathbf{y}}$.
:::

::: answer
**Radial.** $r_t = 7000\,\mathrm{km}$ and only the second part is nonzero, so $\hat{\mathbf{x}} = \mathbf{r}_t/r_t = (0,\ 1,\ 0)$.

**Cross-track.** Work out $\mathbf{h}_t = \mathbf{r}_t \times \mathbf{v}_t = (0,\ 7000,\ 0)\times(-7.0,\ 0,\ 3.0)$ one part at a time:

- $h_x = (7000)(3.0) - (0)(0) = 21000$;
- $h_y = (0)(-7.0) - (0)(3.0) = 0$;
- $h_z = (0)(0) - (7000)(-7.0) = 49000$.

So $\mathbf{h}_t = (21000,\ 0,\ 49000)\,\mathrm{km^2/s}$. Its length is $\sqrt{21000^2 + 49000^2} = 53310.4\,\mathrm{km^2/s}$. Dividing, $\hat{\mathbf{z}} = (0.3939,\ 0,\ 0.9191)$.

**In-track.** $\hat{\mathbf{y}} = \hat{\mathbf{z}}\times\hat{\mathbf{x}} = (0.3939,\ 0,\ 0.9191)\times(0,\ 1,\ 0)$:

- first part: $(0)(0) - (0.9191)(1) = -0.9191$;
- second part: $(0.9191)(0) - (0.3939)(0) = 0$;
- third part: $(0.3939)(1) - (0)(0) = 0.3939$.

So $\hat{\mathbf{y}} = (-0.9191,\ 0,\ 0.3939)$. Check: it has length 1 and is square to both $\hat{\mathbf{x}}$ and $\hat{\mathbf{z}}$ (both dot products are zero).
:::

::: check
Explain in one or two sentences why skipping the $\boldsymbol\omega \times (\mathbf{r}_c-\mathbf{r}_t)$ correction gives a velocity error that grows with separation, rather than a fixed offset.
:::

::: answer
That term is the velocity a point would get purely from the frame spinning, if it sat still at the chaser's spot in LVLH. Like the child on the merry-go-round, its size is the spin rate times the distance from the center, so it grows in direct proportion to the separation. A chaser holding perfectly still relative to the target would appear to move if you forgot the frame was turning — and the farther away it sat, the faster it would appear to go.
:::

::: check
Why does $\hat{\mathbf{y}}$ point exactly along the target's velocity for a circular reference orbit, but only approximately for an eccentric one?
:::

::: answer
On a circular orbit the radius never changes, so all of the velocity is sideways to $\hat{\mathbf{x}}$. $\hat{\mathbf{y}}$ is defined as the direction in the orbit plane square to $\hat{\mathbf{x}}$, so it lines up with the velocity exactly.

On an eccentric orbit the radius is changing everywhere except periapsis and apoapsis. The velocity then has a radial part, $\dot r\,\hat{\mathbf{x}}$, on top of the sideways part. $\hat{\mathbf{y}}$ is still defined purely by geometry, as $\hat{\mathbf{z}}\times\hat{\mathbf{x}}$, so it no longer points exactly along $\mathbf{v}_t$.
:::

::: check
Two engineers want to fire a burn that raises a chaser away from Earth. One uses this module's convention. The other uses an ISS-operations LVLH convention with the vertical axis pointing toward Earth. Both call it "a positive-$x$ burn". Will they command the same thruster firing?
:::

::: answer
No. "Positive $x$" means opposite things in the two conventions — outward in one, toward Earth in the other. A burn that is $+x$ in one convention is $-x$, the opposite physical direction, in the other.

This is exactly the failure the lesson warns about. The *words* "a radial burn raises you" do not depend on convention, but the *sign* you command does. Mixing a number from one source with a formula from another fires the thrusters the wrong way, and nothing anywhere prints an error.
:::

::: check
For this module's standing reference orbit, $r_t = 6791\,\mathrm{km}$, find the frame's turning rate $n$ and the time it takes to turn once, $2\pi/n$.
:::

::: answer
$n = \sqrt{\mu/r_t^3} = \sqrt{398600.4418 / 6791^3} = 1.1282\times10^{-3}\,\mathrm{rad/s}$.

One full turn is $2\pi$ radians, so the period is $T = 2\pi/n = 5569.4\,\mathrm{s}$, which is $92.82$ minutes. That is the orbital period, as it should be: the frame turns exactly once per orbit. This $n$ is the constant used throughout the module wherever a circular reference orbit is assumed.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Target / chief | The passive vehicle that does not maneuver; its orbit is the reference orbit |
| Chaser / deputy | The active vehicle whose position relative to the target is being controlled |
| $\hat{\mathbf{x}} = \mathbf{r}_t/r_t$ | Radial, outward from Earth through the target ($+x$ away from Earth) |
| $\hat{\mathbf{z}} = \mathbf{h}_t/\lVert\mathbf{h}_t\rVert$ | Cross-track, square to the orbit plane |
| $\hat{\mathbf{y}} = \hat{\mathbf{z}}\times\hat{\mathbf{x}}$ | In-track, $+y$ ahead of the target |
| R-bar, V-bar | The radial ($x$) and in-track ($y$) lines through the target |
| $\boldsymbol\omega = (h_t/r_t^2)\,\hat{\mathbf{z}}$ | LVLH frame's turning rate; becomes $n\hat{\mathbf{z}}$ for a circular reference orbit |
| $\boldsymbol\rho = \mathbf{R}^\mathsf{T}(\mathbf{r}_c-\mathbf{r}_t)$ | Relative position from two absolute states |
| $\dot{\boldsymbol\rho} = \mathbf{R}^\mathsf{T}[(\mathbf{v}_c-\mathbf{v}_t) - \boldsymbol\omega\times(\mathbf{r}_c-\mathbf{r}_t)]$ | Relative velocity — never skip the $\boldsymbol\omega\times(\cdot)$ term |
| $\mathbf{r}_c = \mathbf{r}_t + \mathbf{R}\boldsymbol\rho$, $\mathbf{v}_c = \mathbf{v}_t + \mathbf{R}\dot{\boldsymbol\rho} + \boldsymbol\omega\times\mathbf{R}\boldsymbol\rho$ | Back from relative to absolute |
| This module's reference orbit | $r_t = 6791\,\mathrm{km}$ (about 413 km up, circular): $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, $T = 92.82\,\mathrm{min}$ |

The next lesson puts a chaser in this turning frame and asks how it accelerates. That means taking the rate of change of $\boldsymbol\rho$ twice while the frame itself turns — and that is where the Coriolis and centrifugal terms flagged above earn their keep.

::: context chief-deputy Two sets of names for two jobs
"Target" and "chaser" come from operations, where one vehicle really does chase the other to dock with it. "Chief" and "deputy" come from research on **formation flying**, where several satellites fly in a loose group for months — for example, pairs of satellites that measure Earth's gravity by tracking the distance between them. There nobody is chasing anybody, so "chaser" would be a strange word. The mathematics is the same either way: one orbit is the reference, and the others are described relative to it.
:::

::: context hill-history A frame older than spaceflight
George William Hill was an American astronomer who worked on the motion of the Moon. In the late 1870s he wrote the Moon's motion in a frame that turns with the Earth around the Sun, and got equations of almost exactly the form this module uses. About eighty years later, W. H. Clohessy and R. S. Wiltshire wrote the same kind of equations for one satellite near another, in a 1960 paper on guiding a spacecraft to a rendezvous. That is why you will see them called Hill's equations, the Clohessy-Wiltshire (CW) equations, or HCW — all the same idea.
:::

::: context iss-convention How the ISS team draws its axes
The ISS program uses an LVLH frame with $+X$ roughly along the velocity, $+Z$ pointing down toward Earth's center, and $+Y$ completing a right-handed set. That is a perfectly good choice for people who fly a station: "down" is where the Earth is, and "forward" is where the station is going.

In this module $x$ is up, $y$ is forward, and $z$ is sideways. So the ISS's $+Z$ is this module's $-x$, and the ISS's $+X$ is roughly this module's $+y$. Same three directions, different labels and signs. Translate before you copy any number.
:::

::: context lvlh-picture The frame riding on the target
The target moves counterclockwise around the Earth in this picture. The three arrows are drawn at the target and move with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="100" cy="165" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="170" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <path d="M206.3,136.5 A110,110 0 0,0 45.0,69.7" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="100" y1="165" x2="163.1" y2="74.9" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2,3"/>
  <line x1="163.1" y1="74.9" x2="186.1" y2="42.1" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="191.8,33.9 190.2,45.0 182.0,39.2" fill="#b4232c"/>
  <line x1="163.1" y1="74.9" x2="130.3" y2="51.9" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="122.1,46.2 133.2,47.8 127.4,56.0" fill="#1d6fd1"/>
  <circle cx="163.1" cy="74.9" r="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="163.1" cy="74.9" r="2" fill="#1f2a44"/>
  <text x="196" y="30" font-size="12" fill="#b4232c">x: up (R-bar)</text>
  <text x="40" y="36" font-size="12" fill="#1d6fd1">y: ahead (V-bar)</text>
  <text x="175" y="92" font-size="12" fill="#1f2a44">z: out of page</text>
  <text x="232" y="150" font-size="11" fill="#6c7a93">target's orbit</text>
</svg>
```

The dot in the small circle means "an arrow pointing straight at you". Curl your right hand from the red arrow toward the blue one and your thumb points out of the page — that is $z$.
:::

::: context specific-angular-momentum What the arrow h measures
**Angular momentum** measures how much "going around" something has. **Specific** means "per kilogram", so the spacecraft's mass drops out and $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ depends only on the orbit.

The cross product of two arrows is square to both. Both $\mathbf{r}$ and $\mathbf{v}$ lie in the orbit's flat plane, so $\mathbf{h}$ sticks straight out of it, like an axle through a wheel. With only Earth's gravity pulling (always toward the center), $\mathbf{h}$ never changes. That is why the orbit plane stays put, and why $\mathbf{h}$ is the natural way to find the "sideways" direction.
:::

::: context mean-motion Why it is called "mean motion"
Old astronomers called how fast a planet moves around the sky its "motion", and its *average* rate over a whole orbit its **mean motion**. On an oval orbit the real rate changes — faster near the low point, slower near the high point — but the average is always $n = \sqrt{\mu/a^3}$, where $a$ is the orbit's semi-major axis (its average size). On a circular orbit the rate never changes, so the average and the real rate are the same number. For this module's orbit, $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$: about $0.0646^\circ$ per second, one full turn every $92.8$ minutes.
:::

::: context rotation-transpose Why flipping the matrix undoes it
The columns of $\mathbf{R}$ are three arrows of length 1, each square to the other two. Multiplying $\mathbf{R}^\mathsf{T}$ by $\mathbf{R}$ takes the dot product of every column with every column. A column dotted with itself gives $1$ (its length squared). A column dotted with a different one gives $0$ (they are square to each other). So $\mathbf{R}^\mathsf{T}\mathbf{R}$ is the identity matrix, which means $\mathbf{R}^\mathsf{T}$ undoes $\mathbf{R}$. Matrices like this are called **orthonormal**, or rotation matrices. Flipping one is much cheaper and more accurate than inverting a general matrix.
:::

::: context spinning-frame-velocity Sitting still on a spinning platform
Every point on a spinning disk sits still on the disk, yet moves as seen from the ground. The farther out it sits, the faster it goes: speed equals spin rate times distance, which is what $\boldsymbol\omega \times \mathbf{r}$ says.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="100" r="75" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="100" r="3" fill="#1f2a44"/>
  <line x1="110" y1="100" x2="160" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <circle cx="135" cy="100" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="160" cy="100" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <line x1="135" y1="100" x2="135" y2="86" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="135,77.5 131,87 139,87" fill="#1d6fd1"/>
  <line x1="160" y1="100" x2="160" y2="64" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="160,55 156,65 164,65" fill="#1d6fd1"/>
  <path d="M70,40 A70,70 0 0,0 45,80" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="42,88 40,77 50,79" fill="#b4232c"/>
  <text x="28" y="36" font-size="12" fill="#b4232c">spin</text>
  <text x="200" y="70" font-size="12" fill="#1f2a44">still on the disk,</text>
  <text x="200" y="86" font-size="12" fill="#1f2a44">but moving as seen</text>
  <text x="200" y="102" font-size="12" fill="#1f2a44">from the ground</text>
  <text x="200" y="130" font-size="12" fill="#1d6fd1">twice as far out:</text>
  <text x="200" y="146" font-size="12" fill="#1d6fd1">twice as fast</text>
</svg>
```

To get motion *as seen on the disk*, you subtract this spin-made velocity. That is the $-\boldsymbol\omega \times (\mathbf{r}_c - \mathbf{r}_t)$ term.
:::

::: context coriolis-weather The same terms that spin hurricanes
The Earth is a turning frame too. Air flowing toward a low-pressure area gets deflected sideways as seen from the ground — to the right in the northern hemisphere — because the ground turns underneath it. That sideways push is the **Coriolis effect**, and it is why hurricanes spin. No real force does the pushing; it appears only because we describe the air from the turning ground. The LVLH frame turns much faster than the Earth — once every $93$ minutes instead of once a day — so these terms dominate a chaser's motion near a target.
:::
