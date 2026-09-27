---
id: l10-relative-navigation-docking-retroreflectors
title: 'Docking navigation: retroreflectors and the closing error ellipse'
minutes: 23
covers:
  - 'Relative navigation sensors for docking: retroreflector tracking and pattern recognition'
---

Ride a bike at night and a car's headlights hit your pedals. The little plastic reflectors on them light up, bright, straight back at the driver — whichever way the pedals happen to be turned. The stripes on a road worker's vest do the same, and so do the **[[glass studs down the middle of a highway|cats-eye]]**. They are not glowing. They send light back to exactly where it came from.

Docking two spacecraft needs that trick. The **chaser**, the vehicle doing the approaching, must know where the **target** is — how far, which way, and how it is turned — to a few centimeters, and then to a few millimeters. It measures this with light it sends out itself, usually a laser. But a bare spacecraft hull is a terrible thing to bounce a laser off. So the target carries a small, carefully placed pattern of reflectors, and the chaser tracks those.

This is **relative navigation**: working out one vehicle's position and orientation *relative to another*, instead of relative to Earth or the stars. This lesson follows it in three steps. First, why an ordinary hull fails as a target and how a corner-cube reflector fixes it. Second, how a known pattern of reflectors gives the target's full position and orientation. Third, the one geometric fact every docking approach is planned around: the *shape* of the position uncertainty is not fixed. It flips as the range closes.

## Why a bare hull is a bad target

Shine a flashlight at a black T-shirt. Very little comes back. Now shine it at a bathroom mirror. Either you are blinded, or — if the mirror is tilted even a little — nothing comes back at all, because the beam went off somewhere else. A spacecraft hull can behave like either one, and both are bad news for a sensor that needs a strong, reliable echo.

A **diffuse** surface — a rough, matte one like paper or paint — scatters light in all directions. How much comes back toward the source follows **[[Lambert's cosine law|lambert]]**: the returned brightness scales with $\cos i$, where $i$ is the **incidence angle**, the angle between the incoming beam and the line sticking straight out of the surface. Head-on, $\cos 0^\circ = 1$. At $60^\circ$ it is $0.5$, half as much. At $80^\circ$ it is $0.174$. Make the surface dark as well, and at anything but a nearly head-on view there is almost nothing left to detect.

A **[[specular|specular-word]]** surface — a shiny, mirror-like one such as polished metal or some thermal blankets — is worse in a different way. It reflects the whole beam in one direction only. That direction points back at the sensor only at the one exact tilt where the surface faces the beam squarely. At every other tilt the echo is not weak. It is *gone*.

So the two failures are different in kind. The dark diffuse surface gives a weak echo that is still there, and predictable, at every angle. The specular surface gives all or nothing, depending on a tilt the sensor does not control.

::: warning
Do not treat a shiny target as "a bright target." A mirror-like surface returns a huge signal at one orientation and none at all at the rest. A sensor tuned on the ground against one lucky tilt can lose the target completely the moment it rotates a few degrees.
:::

## The corner-cube retroreflector

The fix is a **corner-cube retroreflector**: three flat mirrors set at right angles to one another, like the inside corner of a box. (Solid glass versions use the three back faces of a glass corner instead of mirrors.) Light that goes in comes back out traveling exactly the opposite way — for *any* direction it came in from, as long as it enters the device's **[[acceptance cone|acceptance-cone]]**.

Here is why. A mirror flips the part of a ray's direction that points into the mirror, and leaves the rest alone. In symbols: a ray moving in direction $\hat{\mathbf{d}}$ (read "d hat" — the hat means a **unit vector**, an arrow of length one that only says which way) hits a mirror whose outward direction is the unit vector $\hat{\mathbf{n}}$. It leaves moving in direction

$$
\hat{\mathbf{d}}' = \hat{\mathbf{d}} - 2\,(\hat{\mathbf{d}}\cdot\hat{\mathbf{n}})\,\hat{\mathbf{n}}.
$$

The dot product $\hat{\mathbf{d}}\cdot\hat{\mathbf{n}}$ is how much of the ray points along $\hat{\mathbf{n}}$. Subtracting it once would leave the ray skimming along the mirror. Subtracting it twice flips it.

Now line up the three mirrors with the three axes, so their directions are $\hat{\mathbf{x}}=(1,0,0)$, $\hat{\mathbf{y}}=(0,1,0)$ and $\hat{\mathbf{z}}=(0,0,1)$. A ray arrives moving in direction $(d_x, d_y, d_z)$.

1. It hits the $\hat{\mathbf{x}}$ mirror. Here $\hat{\mathbf{d}}\cdot\hat{\mathbf{x}} = d_x$, so the rule subtracts $2d_x$ from the first number only: the direction becomes $(-d_x, d_y, d_z)$.
2. It hits the $\hat{\mathbf{y}}$ mirror. That flips only the second number: $(-d_x, -d_y, d_z)$.
3. It hits the $\hat{\mathbf{z}}$ mirror. That flips only the third: $(-d_x, -d_y, -d_z)$.

That is $-\hat{\mathbf{d}}$, the exact reverse. Nothing in the three steps depended on the actual values of $d_x$, $d_y$ and $d_z$. So the reversal is exact geometry, not an approximation that only works near head-on. (The order of the bounces does not matter either: each one flips a different number, and flips can be done in any order.)

::: example The corner cube returns exactly backward, checked directly
Send five random directions into a model corner cube and compare what comes out with the reverse of what went in.

```python
import numpy as np

def reflect(d, n):
    return d - 2 * np.dot(d, n) * n

def corner_cube(d_in):
    d = d_in / np.linalg.norm(d_in)
    for n in (np.array([1.,0,0]), np.array([0,1.,0]), np.array([0,0,1.])):
        d = reflect(d, n)
    return d

rng = np.random.default_rng(13)
for _ in range(5):
    d_in = rng.standard_normal(3); d_in /= np.linalg.norm(d_in)
    d_out = corner_cube(d_in)
    print("in:", np.round(d_in, 3), " out:", np.round(d_out, 3), " out == -in?", np.allclose(d_out, -d_in))
# in: [ 0.493 -0.831  0.259]  out: [-0.493  0.831 -0.259]  out == -in? True
# in: [0.051 0.959 0.28 ]  out: [-0.051 -0.959 -0.28 ]  out == -in? True
# in: [ 0.962  0.017 -0.272]  out: [-0.962 -0.017  0.272]  out == -in? True
# in: [ 0.719  0.536 -0.442]  out: [-0.719 -0.536  0.442]  out == -in? True
# in: [-0.239  0.694  0.679]  out: [ 0.239 -0.694 -0.679]  out == -in? True
```

Five random directions, five exact reversals: each output is the input with every sign flipped.

**Compare with a diffuse hull.** A matte surface returns $\cos 0^\circ = 1.000$ of its head-on echo at $0^\circ$, $0.866$ at $30^\circ$, $0.500$ at $60^\circ$ and only $0.174$ at $80^\circ$. The retroreflector returns about the same strong echo across its whole acceptance cone. And it does so whether the hull underneath is dark or bright, matte or shiny: the reflector's own optics decide the echo, not the surface it is bolted to.

**Sanity check.** A reflector that sends light straight back is what a bike pedal does for a driver, so this is the everyday behavior you already know, now with the reason attached.
:::

::: key Retroreflector docking targets
A corner-cube retroreflector (three mutually perpendicular mirrors) returns light antiparallel to however it arrived, independent of incidence angle. That defeats both a dark diffuse target (weak, angle-dependent return, $\propto\cos i$) and a specular one (return only at one exact orientation). The reflector's optics set the return, not the hull.
:::

The same trick works over huge distances. Astronauts left **[[corner-cube arrays on the Moon|moon-reflectors]]**, and observatories still bounce lasers off them today.

## A known pattern, not a natural scene

A docking target carries not one reflector but several, fixed in a known arrangement on its docking port. The pattern is deliberately **[[asymmetric|mirror-pattern]]** — lopsided, with no mirror symmetry. The reason is the same one the star identification lesson met: a symmetric pattern looks identical to its own mirror image, so the sensor could not tell the true orientation from its reflection. A lopsided pattern has only one fit.

The chaser's laser sensor measures each reflector's **range** (how far away it is) and **bearing** (which direction it lies in). Together those give each reflector's full 3-D position, in meters, in the sensor's frame. That is a real advantage over the camera lesson. A camera gets only bearings, so three landmarks leave the **[[four-way P3P ambiguity|p3p-bridge]]**. With full 3-D points instead, recovering the target's position and orientation is the least-squares module's **rigid alignment** problem: find the one rotation and shift that best lays the known pattern onto the measured points. It is solved in one step with the SVD, by the method often called the **[[Kabsch algorithm|kabsch]]**.

A pattern of reflectors buys one more thing: an easy defense against **clutter**, meaning everything else in view that is not a reflector — bits of hull, antennas, the Earth behind. Nothing else sends back anywhere near as much light. So a plain brightness cut, with no pattern matching at all, throws out the clutter before any geometry starts.

::: example Recovering a pose from five reflectors, with clutter rejected on brightness
Five reflectors sit on the target in a known lopsided pattern spanning well under half a meter. The target is about $3.5\,\mathrm{m}$ away and turned by $0.5\,\mathrm{rad}$. The sensor measures each reflector's 3-D position with $3\,\mathrm{mm}$ of noise, and it also picks up three dim clutter points.

```python
import numpy as np
rng = np.random.default_rng(17)

pattern = np.array([[0.0,0.0,0.0],[0.4,0.0,0.0],[0.0,0.3,0.0],[0.15,0.15,0.08],[-0.2,0.1,0.02]])  # target body frame, m

def rotation(axis, ang):
    k = np.asarray(axis, float) / np.linalg.norm(axis)
    K = np.array([[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]])
    return np.eye(3) + np.sin(ang)*K + (1-np.cos(ang))*K@K

R_true = rotation([0.1, 0.9, -0.3], 0.5)
t_true = np.array([1.2, -0.4, 3.5])
retro_sensor = (R_true @ pattern.T).T + t_true

sigma_pos = 0.003   # m, per-return 3-D precision from this sensor's range and bearing noise
detections = retro_sensor + rng.normal(0, sigma_pos, retro_sensor.shape)
clutter = t_true + rng.normal(0, 0.6, (3, 3))                 # background structure, same field of view
intensities = np.concatenate([950.0*(1+rng.normal(0,0.05,len(pattern))), rng.uniform(5.0, 40.0, len(clutter))])
all_points = np.vstack([detections, clutter])

kept = all_points[intensities > 200.0]
print("returns:", len(all_points), " kept after intensity threshold:", len(kept), " (all", len(pattern), "true retroreflectors)")

def kabsch(A, B):
    Ac, Bc = A - A.mean(0), B - B.mean(0)
    U, _, Vt = np.linalg.svd(Bc.T @ Ac)
    d = np.sign(np.linalg.det(U @ Vt))
    R = U @ np.diag([1, 1, d]) @ Vt
    return R, B.mean(0) - R @ A.mean(0)

R_est, t_est = kabsch(pattern, kept)
print("position error:", round(np.linalg.norm(t_est - t_true) * 1000, 2), "mm")
print("attitude error:", round(np.degrees(np.arccos(np.clip((np.trace(R_est@R_true.T)-1)/2,-1,1)))*3600, 1), "arcsec")
# returns: 8  kept after intensity threshold: 5  (all 5 true retroreflectors)
# position error: 3.27 mm
# attitude error: 2964.1 arcsec
```

**Step 1, the brightness cut.** The reflectors come back near $950$ brightness units, the clutter between $5$ and $40$. A threshold at $200$ keeps all five reflectors and drops all three clutter points, before any geometry.

**Step 2, the fit.** The `kabsch` function centers both point sets, builds a $3\times3$ matrix from them and takes its SVD. The line with `np.sign(np.linalg.det(...))` makes sure the answer is a true rotation, never a mirror flip. Position comes out within $3.27\,\mathrm{mm}$ — about the size of the noise on each point.

**Step 3, the surprise.** Orientation comes out only to $2964''$ (arcseconds), which is $0.82^\circ$ — nearly a degree. That is not a bug. Turning the pattern by a small angle moves each reflector sideways by that angle times its distance from the pattern's center. If the points are only about $0.23\,\mathrm{m}$ from the center on average, a $3\,\mathrm{mm}$ wobble on each looks like a turn of roughly

$$
\frac{0.003}{0.23} \approx 0.013\,\mathrm{rad},
$$

about $0.75^\circ$. That is the same size as the $0.82^\circ$ found.

**Sanity check.** Position error of a few millimeters from millimeter-level noise: sensible. Orientation limited by *noise divided by pattern size*: this is why designers spread the reflectors as far apart as the docking port allows. It is the same geometric-diversity lesson the least-squares module taught for direction measurements, now for physical points.
:::

::: warning
A brightness cut is only as good as the rule "nothing else is this bright." A glint of sunlight off a shiny panel can be. Flight sensors add further guards — checking that the kept points actually fit the known pattern, or comparing frames taken with the laser on and off — so a single glint cannot pose as a reflector.
:::

## The closing error ellipse

Now the most important idea in the lesson. Picture pointing a laser pointer at a wall across a room. Your hand shakes a tiny bit. At the near wall the dot barely moves; on a building a kilometer away, the same tiny shake sweeps the dot across meters. The *angle* of the shake stayed the same. The *sideways distance* grew with range.

A docking sensor measures range $\rho$ (Greek "rho") and bearing angle $\theta$ ("theta"). Each has its own noise, written with $\sigma$ ("sigma"), the standard deviation:

- **Range noise** $\sigma_\rho$ is set by how precisely the sensor times the light's round trip. It stays about the same at any distance — a few centimeters, say.
- **Bearing noise** $\sigma_\theta$ is set by how precisely it measures angle. It also stays about the same — *in angle*.

Turn those into a position with $x = \rho\cos\theta$ and $y = \rho\sin\theta$. The range noise moves the point *along* the line of sight by about $\sigma_\rho$. The bearing noise swings it *across* the line of sight by about $\rho\,\sigma_\theta$ — angle times distance, like the laser dot. So the cloud of possible positions is an **[[error ellipse|error-ellipse]]** with two axes:

- the **radial** axis, along the line of sight, of length $\sigma_\rho$ — the same at every range;
- the **transverse** axis, across the line of sight, of length $\rho\,\sigma_\theta$ — growing in step with range.

Far away, $\rho\,\sigma_\theta$ is big and the ellipse is a thin sliver lying *across* the line of sight. Close in, $\rho\,\sigma_\theta$ shrinks below $\sigma_\rho$ and the ellipse is a sliver lying *along* it. In between it passes through a circle, at the **crossover range** where the two axes are equal:

$$
\sigma_\rho = \rho\,\sigma_\theta \quad\Longrightarrow\quad \rho_{\text{cross}} = \frac{\sigma_\rho}{\sigma_\theta}.
$$

Here $\sigma_\theta$ must be in radians, so that $\rho\,\sigma_\theta$ comes out in meters.

::: note Why it has to be true
The exact way to carry noise through the change from $(\rho,\theta)$ to $(x,y)$ is the covariance rule from the least-squares module: $\mathbf{P}_{xy} = \mathbf{J}\,\mathbf{P}_{\rho\theta}\,\mathbf{J}^\mathsf{T}$, where $\mathbf{J}$ is the **[[Jacobian|jacobian]]**, the table of how each output changes with each input. Differentiating $x=\rho\cos\theta$ and $y=\rho\sin\theta$ gives

$$
\mathbf{J} = \begin{pmatrix}\cos\theta & -\rho\sin\theta\\ \sin\theta & \rho\cos\theta\end{pmatrix}, \qquad
\mathbf{P}_{xy} = \mathbf{J}\begin{pmatrix}\sigma_\rho^2&0\\0&\sigma_\theta^2\end{pmatrix}\mathbf{J}^\mathsf{T}.
$$

The first column, $(\cos\theta,\sin\theta)$, is the unit vector along the line of sight. The second column is $\rho$ times $(-\sin\theta,\cos\theta)$, a vector of length $\rho$ at right angles to it. Because the two columns are perpendicular, the ellipse's axes point exactly along and across the line of sight. Their lengths are the column lengths times the matching noise: $1\times\sigma_\rho$ radially and $\rho\times\sigma_\theta$ transversely. This is exact for this linearized model, not a rough picture.
:::

::: example The ellipse, watched through a whole approach
Take a sensor with $\sigma_\rho = 0.02\,\mathrm{m}$ ($2\,\mathrm{cm}$) and $\sigma_\theta = 0.05^\circ$. Follow the two axes from $2\,\mathrm{km}$ out to $30\,\mathrm{cm}$.

```python
import numpy as np

sigma_rho = 0.02                     # m, range precision
sigma_theta = np.radians(0.05)       # bearing precision

print(f"{'range (m)':>10} {'radial (m)':>12} {'transverse (m)':>16} {'aspect ratio':>13} {'dominant':>12}")
for rho in (2000.0, 500.0, 100.0, 30.0, 10.0, 3.0, 1.0, 0.3):
    radial, transverse = sigma_rho, rho * sigma_theta
    aspect = max(radial, transverse) / min(radial, transverse)
    print(f"{rho:10.1f} {radial:12.4f} {transverse:16.4f} {aspect:13.2f} {'transverse' if transverse>radial else 'radial':>12}")

print("\ncrossover range where the ellipse is roundest:", round(sigma_rho / sigma_theta, 3), "m")
#  range (m)   radial (m)   transverse (m)  aspect ratio     dominant
#     2000.0       0.0200           1.7453         87.27   transverse
#      500.0       0.0200           0.4363         21.82   transverse
#      100.0       0.0200           0.0873          4.36   transverse
#       30.0       0.0200           0.0262          1.31   transverse
#       10.0       0.0200           0.0087          2.29       radial
#        3.0       0.0200           0.0026          7.64       radial
#        1.0       0.0200           0.0009         22.92       radial
#        0.3       0.0200           0.0003         76.39       radial
#
# crossover range where the ellipse is roundest: 22.918 m
```

**By hand, at 2 km.** First turn the angle into radians: $0.05^\circ \times \pi/180 = 0.0008727\,\mathrm{rad}$. The transverse axis is $2000 \times 0.0008727 = 1.745\,\mathrm{m}$. The radial axis is still $0.02\,\mathrm{m}$. The ellipse is about $87$ times longer across than along — the sensor knows how far to go to within $2\,\mathrm{cm}$ but where it is sideways only to within almost $2\,\mathrm{m}$.

**At 30 cm** the picture has flipped. Sideways position is known to $0.0003\,\mathrm{m}$, a third of a millimeter. The range is still limited by the same $2\,\mathrm{cm}$ timing precision, so now *range* is the long axis, by about $76$ to $1$.

**The crossover.** $0.02 / 0.0008727 = 22.92\,\mathrm{m}$. There the two axes match and the ellipse is a circle.

**Sanity check.** The $30\,\mathrm{m}$ row, just outside the crossover, is almost round ($1.31$ to $1$), and the $10\,\mathrm{m}$ row, just inside, has already flipped to radial. That is what a crossover near $23\,\mathrm{m}$ should look like.
:::

This is not a curiosity. A rendezvous flight plan is built around it.

- **Far out**, the sensor tells the chaser confidently how much farther it has to go, but only loosely where it is sideways. Far-range guidance corrects sideways drift gently, and does not yet trust a tight sideways bound.
- **Close in**, sideways alignment is known to a fraction of a millimeter — tight enough for a docking mechanism to latch. What remains uncertain is mostly the range, and so exactly *when* and *how fast* contact will happen. So final-approach control shifts its attention to the **closing rate** (how fast the range is shrinking) and the conditions at contact, just where it once cared most about staying centered.

That approach is how real vehicles have come in. Europe's **[[cargo ships to the space station|atv]]** did exactly this.

::: key The closing error ellipse
A range-bearing measurement's error ellipse has axes exactly along the line of sight ($\sigma_\rho$, constant) and across it ($\rho\,\sigma_\theta$, growing with range). It is transverse-dominated at long range and radial-dominated at short range, crossing over where $\sigma_\rho = \rho\,\sigma_\theta$. A known asymmetric pattern of retroreflectors gives full 3-D pose by rigid alignment, with clutter rejected on brightness alone; attitude accuracy scales as position noise divided by the pattern's size.
:::

## Check yourself

::: check
Using $\hat{\mathbf{d}}-2(\hat{\mathbf{d}}\cdot\hat{\mathbf{n}})\hat{\mathbf{n}}$ for reflection off a mirror with direction $\hat{\mathbf{n}}$, show that reflecting $(d_x,d_y,d_z)$ off mirrors with directions $\hat{\mathbf{x}}$, then $\hat{\mathbf{y}}$, then $\hat{\mathbf{z}}$ gives exactly $(-d_x,-d_y,-d_z)$.
:::

::: answer
Off $\hat{\mathbf{x}}=(1,0,0)$: the dot product is $d_x$, so the result is $(d_x,d_y,d_z)-2d_x(1,0,0)=(-d_x,d_y,d_z)$. Only the $x$ number flipped. Off $\hat{\mathbf{y}}=(0,1,0)$: the dot product is now $d_y$, so only the $y$ number flips, giving $(-d_x,-d_y,d_z)$. Off $\hat{\mathbf{z}}=(0,0,1)$: only the $z$ number flips, giving $(-d_x,-d_y,-d_z)$. Each mirror lined up with an axis flips exactly its own number and leaves the other two alone. Three perpendicular mirrors flip all three, whatever values the incoming direction had.
:::

::: check
Explain why a shiny (specular) target is a harder problem for a ranging sensor than a dark diffuse one, and not merely a weaker version of the same problem.
:::

::: answer
A dark diffuse surface still returns *some* signal at every incidence angle, following Lambert's cosine law. It is weaker than a bright surface would give, but it is present and predictable everywhere. A specular surface returns nearly the whole beam at the one tilt where it faces the beam squarely, and returns nothing at every other tilt — not a weak echo, an absent one. The dark surface's problem is one of degree (a poor signal-to-noise ratio). The shiny surface's problem is one of kind: the echo is there or completely missing, depending on a tilt the sensor does not control.
:::

::: check
Why must a docking target's reflector pattern be lopsided (asymmetric), and which earlier lesson in this module met almost the same requirement?
:::

::: answer
A symmetric pattern cannot be told apart from its own mirror image using positions or angles alone, so the recovered orientation could be the true one or its reflection. The star identification lesson met the same issue: angles between stars are unchanged by reflections as well as rotations, so that lesson checked the handedness (the sign of a triple product) of each matched triangle to throw out mirror-image matches. A lopsided reflector pattern removes the ambiguity by design, instead of needing a handedness check afterward.
:::

::: check
A coarser docking sensor has $\sigma_\rho=0.05\,\mathrm{m}$ and $\sigma_\theta=0.2^\circ$. Find its crossover range, and say whether its error ellipse at $50\,\mathrm{m}$ is longer across or along the line of sight.
:::

::: answer
First convert the angle: $0.2^\circ\times\pi/180=0.003491\,\mathrm{rad}$. The crossover is $\rho_{\text{cross}}=\sigma_\rho/\sigma_\theta=0.05/0.003491\approx14.3\,\mathrm{m}$. At $50\,\mathrm{m}$, well beyond the crossover, the transverse axis is $50 \times 0.003491 = 0.175$ meters. That is about three and a half times the constant $0.05\,\mathrm{m}$ radial axis. So at $50\,\mathrm{m}$ the ellipse is longer *across* the line of sight: transverse-dominated.
:::

::: check
In the pose example, position came out to a few millimeters but orientation only to about a degree. Explain the gap using the pattern's size, and say what the target's designers could change to tighten the orientation without improving the sensor at all.
:::

::: answer
A small turn of the pattern moves each reflector sideways by the angle times its distance from the pattern's center. With points only about $0.23\,\mathrm{m}$ from the center, a $3\,\mathrm{mm}$ error on each point looks like a turn of about $0.003/0.23\approx0.013\,\mathrm{rad}$, close to a degree. Orientation accuracy is roughly position noise divided by the pattern's size. Spreading the same reflectors farther apart on the docking port — a bigger baseline — improves orientation directly, with no change to the sensor. It is the least-squares module's geometric-diversity argument, applied to physical spacing.
:::

::: check
Using this lesson's numbers, explain why final-approach guidance shifts its attention from sideways (transverse) control to closing-rate (radial) control as it nears contact.
:::

::: answer
Far from the target the ellipse is transverse-dominated: at $2\,\mathrm{km}$, sideways position is uncertain by $1.7\,\mathrm{m}$ against $2\,\mathrm{cm}$ in range, so sideways position is what guidance must work hardest to control. Inside the crossover (about $23\,\mathrm{m}$ for this sensor) the ellipse has flipped. By $30\,\mathrm{cm}$ sideways position is known to a third of a millimeter, tight enough for the mechanism to engage, while range — and so the closing rate and the moment of contact — carries the larger remaining uncertainty. Guidance follows whichever axis the sensor is least sure of, and that axis changes during the approach.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| Mirror reflection | Flips the part of a ray pointing into the mirror | $\hat{\mathbf{d}}-2(\hat{\mathbf{d}}\cdot\hat{\mathbf{n}})\hat{\mathbf{n}}$ |
| Corner-cube retroreflector | Three perpendicular mirrors | Any ray in its acceptance cone leaves as $-\hat{\mathbf{d}}$ |
| Diffuse vs specular target | Matte vs mirror-like surface | Weak but present ($\propto\cos i$) vs all-or-nothing by tilt |
| Rigid alignment (SVD) | Pose from three or more known 3-D points | No P3P-style ambiguity, since range and bearing give full position |
| Brightness threshold | First clutter filter | Reflector returns far outshine everything else |
| Attitude from a pattern | Limited by the pattern's size | About (position noise) / (pattern spread) |
| Error ellipse | Range-bearing noise in position | $\mathbf{P}_{xy}=\mathbf{J}\,\mathrm{diag}(\sigma_\rho^2,\sigma_\theta^2)\,\mathbf{J}^\mathsf{T}$; axes $\sigma_\rho$ radial, $\rho\sigma_\theta$ transverse |
| Crossover range | Where the ellipse is a circle | $\rho_{\text{cross}}=\sigma_\rho/\sigma_\theta$; transverse-dominated beyond, radial-dominated inside |

The sensors in this module have now measured directions, fields, ranges, and an engineered target pattern, each with its own accuracy and its own way of failing. The next lesson stops treating them one at a time and asks what a flight computer has to answer: with several of them running at once, how should their measurements be combined?

::: context cats-eye A reflector in the road
The glass road studs called cat's eyes were patented by the English inventor Percy Shaw in 1934. Each holds glass beads that bounce a car's headlight straight back toward the driver's eyes, so the road's center line glows even on a dark, wet night. Bike reflectors, the stripes on safety vests and the white paint on road signs use the same idea, with tiny corner cubes or glass beads. You meet retroreflectors every time you are in a car at night.
:::

::: context lambert Why matte surfaces fade at a slant
Johann Heinrich Lambert, a Swiss-German scientist, described this rule in his book *Photometria* in 1760. A matte surface looks equally bright from every viewing direction, but a beam arriving at a slant spreads its light over a bigger patch, so each bit of surface receives less. Tilt the beam to $60^\circ$ and the same beam covers twice the area, so the echo halves: $\cos 60^\circ = 0.5$. Near $90^\circ$, grazing, almost nothing lands on each bit of surface and almost nothing comes back.
:::

::: context specular-word Where "specular" comes from
It comes from the Latin *speculum*, "mirror". A specular reflection is a mirror-like one: the beam leaves at the same angle it arrived, on the other side of the line sticking straight out of the surface. Polished metal, glass and many of the shiny gold or silver blankets wrapped around spacecraft reflect this way, which is exactly why they make poor laser targets.
:::

::: context acceptance-cone How wide a corner cube can see
The reversal is exact only for light that actually enters the corner and bounces off all three faces. Light arriving too far off the corner's own axis clips an edge, misses a face, or escapes early. The range of directions that work is the **acceptance cone**. For a typical corner cube it is a cone a few tens of degrees across. That is why docking targets aim their reflectors roughly toward the approach path, and sometimes mount several tilted a little differently.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="40" x2="120" y2="170" stroke="#1f2a44" stroke-width="4"/>
  <line x1="120" y1="170" x2="310" y2="170" stroke="#1f2a44" stroke-width="4"/>
  <polyline points="340,70 200,170 120,112.86 260,12.86" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,170 211.9,156.7 216.3,162.9" fill="#1d6fd1"/>
  <polygon points="260,12.86 243.3,19.1 247.7,25.3" fill="#1d6fd1"/>
  <text x="300" y="72" font-size="12" fill="#1f2a44">in</text>
  <text x="210" y="30" font-size="12" fill="#1f2a44">out</text>
  <text x="130" y="186" font-size="11" fill="#6c7a93">mirror</text>
  <text x="60" y="60" font-size="11" fill="#6c7a93">mirror</text>
  <text x="200" y="110" font-size="11" fill="#b4232c">out is parallel to in,</text>
  <text x="200" y="124" font-size="11" fill="#b4232c">pointing back</text>
</svg>
```

The picture shows the flat, two-mirror version: two bounces reverse a ray in the plane. The third mirror does the same for the third direction.
:::

::: context moon-reflectors Reflectors on the Moon
Apollo 11 left the first corner-cube array on the Moon in 1969, and Apollo 14 and 15 added more. The Soviet Lunokhod 1 and 2 rovers carry reflectors too. Observatories fire laser pulses at them and time the faint echo's round trip. The measurements pin the Earth-Moon distance to about a centimeter or better, and they show the Moon drifting away from Earth by about $3.8\,\mathrm{cm}$ a year. The arrays have no power and no moving parts, and they still work more than fifty years later.
:::

::: context mirror-pattern One pattern, two ways round
Seen from the front, the five reflectors from the worked example (left) and their mirror image (right). No turn in the plane of the page carries one onto the other, so a sensor that sees the left pattern can only have one orientation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g fill="#1d6fd1" stroke="#1f2a44" stroke-width="1">
    <circle cx="80" cy="150" r="6"/>
    <circle cx="180" cy="150" r="6"/>
    <circle cx="80" cy="75" r="6"/>
    <circle cx="117.5" cy="112.5" r="6"/>
    <circle cx="30" cy="125" r="6"/>
  </g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <circle cx="300" cy="150" r="6"/>
    <circle cx="200" cy="150" r="6"/>
    <circle cx="300" cy="75" r="6"/>
    <circle cx="262.5" cy="112.5" r="6"/>
    <circle cx="350" cy="125" r="6"/>
  </g>
  <line x1="190" y1="40" x2="190" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="95" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">pattern</text>
  <text x="275" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">mirror image</text>
  <text x="190" y="184" font-size="11" text-anchor="middle" fill="#6c7a93">mirror line</text>
</svg>
```
:::

::: context p3p-bridge Why full 3-D points avoid the camera's puzzle
In the camera lesson, three known landmarks seen only as directions led to the Perspective-Three-Point problem, which can have up to four different poses that all fit. The trouble is that a direction says nothing about distance. A laser sensor measures distance too, so each reflector becomes a full 3-D point. Three points that do not lie on one line then fix a rigid body's position and orientation uniquely, and the least-squares fit uses all of them at once.
:::

::: context kabsch Laying one shape on another
Wolfgang Kabsch published this recipe in 1976 for comparing the shapes of molecules. It is the same answer as the Procrustes and Wahba problems from the least-squares module: subtract each point set's center, multiply the centered sets together into a $3\times3$ matrix, take its SVD, and read off the best rotation. The determinant check matters. Without it, a noisy or flat point set can make the "best fit" a mirror flip, which no real rigid body can do.
:::

::: context error-ellipse The shape of "somewhere around here"
An error ellipse is the outline of where the true position probably is. Its long axis is the direction you are least sure about. For a range-bearing sensor it swaps direction during an approach:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="20" cy="75" r="6" fill="#1f2a44"/>
  <line x1="26" y1="75" x2="350" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <ellipse cx="90" cy="75" rx="26" ry="5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="190" cy="75" r="14" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="300" cy="75" rx="5" ry="40" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="20" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">sensor</text>
  <text x="90" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">near: long</text>
  <text x="90" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">along the line</text>
  <text x="190" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">crossover:</text>
  <text x="190" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">round</text>
  <text x="300" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">far: long across</text>
  <text x="200" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">line of sight</text>
</svg>
```

The shapes are drawn for clarity, not to scale: the real far-range ellipse in the example is 87 times longer than it is wide.
:::

::: context jacobian A table of sensitivities
Named after the German mathematician Carl Gustav Jacob Jacobi, a Jacobian is a grid of partial derivatives: row $i$, column $j$ says how much output $i$ changes when input $j$ nudges a little. Multiplying a small input error by it gives the small output error. That is why the same matrix, used twice as $\mathbf{J}\mathbf{P}\mathbf{J}^\mathsf{T}$, turns an input covariance into an output covariance. You will meet it again as the $\mathbf{H}$ matrix of every Kalman filter update.
:::

::: context atv How Europe's cargo ships came in
The European Space Agency's Automated Transfer Vehicle flew five cargo missions to the International Space Station between 2008 and 2014, docking automatically each time to the station's Russian segment. For the last stretch of the approach it used laser sensors that tracked retroreflector targets mounted on the station. The flight software watched the same things this lesson describes: sideways alignment far out, then closing rate and contact conditions at the end.
:::
