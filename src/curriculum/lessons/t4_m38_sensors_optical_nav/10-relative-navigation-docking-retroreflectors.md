---
id: l10-relative-navigation-docking-retroreflectors
title: 'Relative navigation for docking: retroreflectors and the closing error ellipse'
minutes: 17
covers:
  - 'Relative navigation sensors for docking: retroreflector tracking and pattern recognition'
---

Every sensor so far in this module measures against something that cooperates by its own existence — a star's catalog position, a field model, a map surveyed in advance. Docking asks a sharper question of a target that may not cooperate at all: a spacecraft's hull is not built to be tracked, and depending on its material and the sun angle at the moment, it can return almost no usable signal to a ranging sensor no matter how much power the sensor puts out. This lesson opens with why that happens and how a docking target is built to stop it happening, then follows the resulting measurement — range and bearing to a small, deliberately engineered pattern — through the one geometric fact every docking approach has to plan around: the shape of the position uncertainty it delivers is not fixed, it flips as the range closes.

## Why docking targets carry retroreflectors

An ordinary surface returns a ranging pulse two ways, and both are hostile to a sensor that needs a strong, reliable signal back. A **dark, diffuse** surface scatters light in all directions following Lambert's law — the returned intensity toward the source scales with the cosine of the incidence angle — and a low-albedo material on top of that cosine falloff can leave almost nothing to detect at anything but near-normal incidence. A **specular** surface is worse in a different way: it reflects like a mirror, sending the beam back toward the source only at the one precise angle where the surface happens to be exactly perpendicular to the incoming ray, and away from the sensor entirely at every other orientation — not a weak return, no return at all, until the geometry happens to line up.

A **corner-cube retroreflector** — three mirrors, or three total-internal-reflection surfaces, mounted mutually perpendicular like the inside corner of a cube — defeats both problems by a clean piece of geometry. Reflecting a ray off a mirror with unit normal $\hat{\mathbf{n}}$ sends direction $\hat{\mathbf{d}}$ to $\hat{\mathbf{d}}-2(\hat{\mathbf{d}}\cdot\hat{\mathbf{n}})\hat{\mathbf{n}}$; reflect in turn off three mutually perpendicular mirrors with normals $\hat{\mathbf{x}},\hat{\mathbf{y}},\hat{\mathbf{z}}$ and each reflection flips exactly one component's sign, so a ray entering with direction $(d_x,d_y,d_z)$ leaves as $(-d_x,-d_y,-d_z)$ — exactly $-\hat{\mathbf{d}}$, the reverse of however it came in, for *any* incoming direction within the device's acceptance cone.

::: example The corner cube returns exactly antiparallel, verified directly
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

Five random incidence directions, five exact reversals — the property is exact geometry, not an approximation that only holds near normal incidence. Against a diffuse surface's Lambertian falloff of $\cos(0^\circ){=}1.000$, $\cos(30^\circ){=}0.866$, $\cos(60^\circ){=}0.500$, $\cos(80^\circ){=}0.174$, a retroreflector returns essentially the same strong signal across its whole acceptance cone, and it does so regardless of whether the target material underneath is dark or bright, matte or specular — the retroreflector's own optics decide the return, not the hull it is bolted to.
:::

## Pattern recognition: a known constellation, not a natural scene

A docking target does not carry one retroreflector, it carries several, fixed in a known, deliberately asymmetric arrangement on the target's own docking interface — asymmetric for the same reason the star identification lesson checked handedness: a symmetric pattern is indistinguishable from its own mirror image, and an asymmetric one is not. The chaser's sensor detects each retroreflector's full three-dimensional position directly, range and bearing together, which is a genuine advantage over the camera lesson's pinhole geometry: recovering the target's pose from three or more known points measured in full 3-D is the least-squares module's rigid-alignment problem, solved once by SVD, with none of the four-way P3P ambiguity a bearings-only camera would have to resolve.

The other advantage a retroreflector pattern buys is a trivial defence against clutter. Nothing else in the field of view returns anywhere near as strongly, so a simple intensity threshold — no pattern matching required at all — separates true retroreflector returns from any diffuse background structure in the same field of view.

::: example Recovering a pose from five retroreflectors, with clutter rejected on brightness alone
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

Every clutter return, three of the eight total, is rejected by brightness alone before any geometric matching is attempted; the five real detections recover position to a few millimetres. Attitude comes out far coarser, $2964''$, nearly a degree — not a bug, but the direct consequence of the pattern's own size: attitude accuracy from a point cluster scales with position noise divided by the cluster's physical spread, and this pattern spans well under half a metre. A docking target's designers spread its retroreflectors as far apart as the mechanical interface allows for exactly this reason — the same geometric-diversity argument the least-squares module made for vector observations applies just as directly to physical points.
:::

## The closing error ellipse

A docking sensor measures range $\rho$ and bearing $\theta$, and their noise levels behave completely differently with distance: **range** noise, $\sigma_\rho$, is set by timing precision and stays roughly constant however far away the target is; **bearing** noise, $\sigma_\theta$, is set by angular measurement precision and is also roughly constant — in angle. Converted into Cartesian relative position, $(x,y)=(\rho\cos\theta,\rho\sin\theta)$, those two constant noise levels do not stay comparable at all. Propagating the covariance through the nonlinear map with its Jacobian,

$$
\mathbf{J} = \begin{pmatrix}\cos\theta & -\rho\sin\theta\\ \sin\theta & \rho\cos\theta\end{pmatrix}, \qquad
\mathbf{P}_{xy} = \mathbf{J}\begin{pmatrix}\sigma_\rho^2&0\\0&\sigma_\theta^2\end{pmatrix}\mathbf{J}^\mathsf{T},
$$

and because $\mathbf{J}$'s two columns are orthogonal, the resulting error ellipse's axes are exactly the radial and transverse directions, with semi-axis lengths $\sigma_\rho$ (**radial**, unchanged by range) and $\rho\,\sigma_\theta$ (**transverse**, directly proportional to range).

::: example The ellipse, watched through an entire approach
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
# range (m)   radial (m)  transverse (m)  aspect ratio     dominant
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

At two kilometres the ellipse is enormously elongated across the line of sight — an eighty-seven-to-one aspect ratio, because $0.05^\circ$ of bearing noise sweeps nearly two metres sideways at that range while the range itself is pinned to two centimetres. By a few tens of centimetres from contact the picture has completely inverted: transverse position is known to sub-millimetre precision, and the *range* itself, still limited by the same fixed $2\,\mathrm{cm}$ timing precision, is now the dominant axis by nearly eighty to one. The ellipse passes through its roundest point at $22.9\,\mathrm{m}$, exactly where $\sigma_\rho=\rho\,\sigma_\theta$.

This is not a curiosity, it is what a rendezvous flight plan is built around. Far out, position along the approach corridor is well known but lateral drift is not — the sensor can tell the chaser confidently how much farther to go, but only loosely where it is sideways, so far-range guidance corrects lateral error conservatively and accepts that it cannot yet trust a tight lateral bound. Close in, the opposite problem takes over: lateral alignment is now known to a fraction of a millimetre, tight enough for a physical docking mechanism to engage, while the remaining uncertainty is almost entirely in closing range and therefore in exactly when and how fast contact will occur — which is why final-approach control focuses on range-rate and contact conditions precisely where it once cared most about staying centred.
:::

::: key Retroreflector docking sensors
A corner-cube retroreflector returns light antiparallel to however it arrived, independent of incidence angle, defeating both a dark diffuse target (weak, angle-dependent return) and a specular one (return only at one exact orientation). A known, asymmetric pattern of them gives full 3-D pose by rigid alignment, with clutter rejected on brightness alone. Their combined range-bearing measurement's error ellipse is transverse-dominated at long range and radial-dominated at short range, crossing over where $\sigma_\rho=\rho\sigma_\theta$.
:::

## Check yourself

::: check
Using $\hat{\mathbf{d}}-2(\hat{\mathbf{d}}\cdot\hat{\mathbf{n}})\hat{\mathbf{n}}$ for reflection off a mirror with normal $\hat{\mathbf{n}}$, show that reflecting $(d_x,d_y,d_z)$ off mirrors with normals $\hat{\mathbf{x}}$, then $\hat{\mathbf{y}}$, then $\hat{\mathbf{z}}$ in turn gives exactly $(-d_x,-d_y,-d_z)$.
:::

::: answer
Reflecting off $\hat{\mathbf{x}}=(1,0,0)$: $(d_x,d_y,d_z)-2d_x(1,0,0)=(-d_x,d_y,d_z)$, flipping only the $x$ component. Reflecting that result off $\hat{\mathbf{y}}=(0,1,0)$ flips only the $y$ component, giving $(-d_x,-d_y,d_z)$. Reflecting off $\hat{\mathbf{z}}=(0,0,1)$ flips only the $z$ component, giving $(-d_x,-d_y,-d_z)$. Each reflection off a coordinate-axis-normal mirror flips exactly the one matching component and leaves the other two untouched, so three reflections off three mutually perpendicular mirrors flip all three components, regardless of the incoming direction's actual values.
:::

::: check
Explain why a specular target surface is, in a specific sense, a harder failure mode for a ranging sensor than a dark diffuse one, rather than only a weaker version of the same problem.
:::

::: answer
A dark diffuse surface still returns some signal at every incidence angle, following Lambert's cosine law — weaker than a brighter surface, but present and predictable everywhere in the field. A specular surface returns essentially the full beam at exactly the one orientation where it happens to be perpendicular to the incoming ray, and returns nothing at all — not a weak signal, a genuinely absent one — at every other orientation. The dark surface's problem is a matter of degree (signal-to-noise); the specular surface's problem is a matter of kind (signal present or completely absent, depending on an orientation the sensor does not control).
:::

::: check
Why does a docking target's retroreflector pattern need to be geometrically asymmetric, and what earlier lesson in this module faced an almost identical requirement?
:::

::: answer
A symmetric arrangement of points is indistinguishable from its own mirror image using position or angle measurements alone, so a symmetric pattern would leave the recovered pose ambiguous between the true orientation and its mirror reflection. The star identification lesson faced the identical issue: interstar angles are preserved by reflections as well as rotations, so that lesson checked the handedness of a matched triangle explicitly to rule out mirror-image false matches. An asymmetric retroreflector pattern avoids the ambiguity by construction rather than needing a handedness check after the fact.
:::

::: check
A coarser docking sensor has $\sigma_\rho=0.05\,\mathrm{m}$ and $\sigma_\theta=0.2^\circ$. Find its crossover range, and state whether its error ellipse at $50\,\mathrm{m}$ is transverse-dominated or radial-dominated.
:::

::: answer
The crossover range is $\sigma_\rho/\sigma_\theta=0.05/\mathrm{radians}(0.2^\circ)=14.3\,\mathrm{m}$. At $50\,\mathrm{m}$, well beyond that crossover, the transverse semi-axis is $50\times\mathrm{radians}(0.2^\circ)=0.175\,\mathrm{m}$, more than three times the constant $0.05\,\mathrm{m}$ radial semi-axis, so the ellipse at $50\,\mathrm{m}$ is transverse-dominated.
:::

::: check
In the pose-recovery example, position was recovered to a few millimetres while attitude was recovered only to about a degree. Explain this gap in terms of the pattern's own physical size, and state what a target's designers could change to tighten the attitude estimate without improving the sensor at all.
:::

::: answer
Attitude accuracy from a cluster of noisy point measurements is set by the position noise divided by how far apart the points actually are — a small angular error is much harder to detect across a small baseline than across a large one, for the same absolute position noise on each point. Spreading the same five retroreflectors across a larger area of the target's docking interface, with no change to the sensor's own range or bearing precision, would directly improve the attitude estimate by increasing that baseline, exactly the geometric-diversity argument the least-squares module made for vector observations, applied here to physical point spacing instead.
:::

::: check
Explain why final-approach guidance shifts its emphasis from lateral (transverse) control to range-rate (radial) control as a docking approach nears contact, using this lesson's own numbers.
:::

::: answer
Far from the target the error ellipse is transverse-dominated, so lateral position is the more uncertain quantity and is naturally what guidance has to work hardest to control and verify. Close to the target — inside the roughly $23\,\mathrm{m}$ crossover this lesson's numbers found — the ellipse has flipped to radial-dominated: lateral position is by then known to a small fraction of a millimetre, tight enough for mechanical engagement, while range and closing rate carry the larger remaining uncertainty. Guidance shifts emphasis because it is tracking whichever axis the sensor itself is least certain about, and that axis is not the same one throughout the approach.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\mathbf{d}}-2(\hat{\mathbf{d}}\cdot\hat{\mathbf{n}})\hat{\mathbf{n}}$, three orthogonal mirrors | Corner-cube retroreflector: exact reversal of any incoming ray, verified directly |
| Dark diffuse vs specular target | Weak but present return (Lambert's law) versus return only at one exact orientation |
| Rigid alignment (SVD) from $\ge3$ known 3-D points | Full pose with no P3P-style ambiguity, since lidar gives position directly, not only bearing |
| Intensity threshold | Separates retroreflector returns from clutter without any pattern matching |
| $\mathbf{P}_{xy}=\mathbf{J}\,\mathrm{diag}(\sigma_\rho^2,\sigma_\theta^2)\,\mathbf{J}^\mathsf{T}$ | Error ellipse from range/bearing noise; axes exactly radial ($\sigma_\rho$) and transverse ($\rho\sigma_\theta$) |
| Crossover at $\rho=\sigma_\rho/\sigma_\theta$ | Where the ellipse is roundest; transverse-dominated beyond it, radial-dominated inside it |
| Attitude accuracy $\propto$ (position noise) / (pattern baseline) | Same geometric-diversity argument as the least-squares module, applied to physical spacing |

The sensors in this module have now measured direction, field, range, and a target's own engineered pattern, each with its own accuracy and its own failure mode. The next lesson stops treating them one at a time and asks the question a flight computer actually has to answer: given several of them running at once, each imperfect in its own way, what does a fused measurement model and a consistent noise budget across all of them look like.
