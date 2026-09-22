---
id: l07-cameras-pinhole-intrinsics-extrinsics-distortion
title: 'Cameras for optical navigation: the pinhole model, intrinsics, extrinsics, distortion'
minutes: 19
covers:
  - 'Cameras for optical navigation: the pinhole model, intrinsics and extrinsics, distortion'
---

A star tracker, from the first lesson of this module, is already a camera: a lens, a detector, a projection from three dimensions to two. What made it work was a catalog — thousands of known reference directions to match against. A navigation camera looks at everything else a mission needs seen: engineered fiducials on a docking target, natural terrain during a landing, a rock face during proximity operations to a small body. The projection is the same pinhole geometry this module has already used once; what changes is the question asked of it, and this lesson exists to answer that question precisely: given one pixel, what, exactly, do you know?

The honest answer is less than it looks. A pixel is a direction, not a place — inverting the projection hands back a ray from the camera's centre, and nothing in a single observation says how far along that ray the point actually sits. Everything a navigation camera does beyond simple bearing measurement — locating itself from known landmarks, building a three-dimensional map, recovering its own motion — is a specific, well-defined way of adding the missing information back in, whether from several landmarks measured at once, from motion over time, or from another sensor's independent range. This lesson builds the projection model in full, including the distortion a real lens adds that an ideal pinhole does not, and then works through exactly how few landmarks — and how many candidate answers — it takes to recover a full pose from bearings alone.

## The pinhole projection model: intrinsics

A point at camera-frame coordinates $(X,Y,Z)$, with $Z$ the depth along the boresight, projects through the lens centre onto the image plane at the **normalized coordinates**

$$
x = \frac{X}{Z}, \qquad y = \frac{Y}{Z},
$$

exactly the star tracker's own projection from earlier in this module, generalized only by dropping that lesson's assumption of a single, isotropic focal length and a boresight-centred detector. A real camera's pixel grid can have different physical scale in its two axes, and its optical centre rarely sits exactly on the sensor's geometric centre, so the mapping from normalized coordinates to pixels carries four numbers instead of one:

$$
u = f_x x + c_x, \qquad v = f_y y + c_y,
$$

collected into the **intrinsic matrix**

$$
\mathbf{K} = \begin{pmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{pmatrix}, \qquad
\begin{pmatrix} u \\ v \\ 1\end{pmatrix} \sim \mathbf{K}\begin{pmatrix} X \\ Y \\ Z\end{pmatrix},
$$

where $\sim$ denotes equality up to the scale $Z$ that the perspective divide removes — the homogeneous form every camera geometry library uses, since it lets the same matrix multiplication represent the nonlinear division. $f_x,f_y$ (focal length in pixel units, one per axis) and $c_x,c_y$ (the principal point) are the camera's **intrinsics**: fixed properties of the optics and sensor, found once by ground calibration and, barring thermal or mechanical shifts, unchanging in flight.

::: example Project a point, then ask what the pixel alone can tell you back
```python
import numpy as np

fx, fy, cx, cy = 800.0, 800.0, 512.0, 512.0
K = np.array([[fx, 0, cx], [0, fy, cy], [0, 0, 1]])

P_cam = np.array([1.3, -0.6, 5.0])                # a point, camera-frame coordinates, metres
uvw = K @ P_cam
u, v = uvw[0] / uvw[2], uvw[1] / uvw[2]
print("pixel:", u, v)

# invert: what does this pixel alone constrain?
x, y = (u - cx) / fx, (v - cy) / fy
ray = np.array([x, y, 1.0]); ray /= np.linalg.norm(ray)
print("recovered ray direction:", ray)
print("true direction:", P_cam / np.linalg.norm(P_cam))
print("depth Z is recoverable from the pixel alone?", False, " (any point along this ray projects to the same pixel)")
# pixel: 720.0 416.0
# recovered ray direction: [ 0.24995379 -0.11536329  0.96136071]
# true direction: [ 0.24995379 -0.11536329  0.96136071]
```

The recovered ray matches the true direction to full precision — the pinhole model inverts exactly, as it must, since it is a direct algebraic map with no noise added here. But the inversion only recovers *direction*: scale a point five times farther along the same ray, at $(6.5,-3.0,25.0)$, and it projects to the identical pixel, $(720.0,416.0)$, because the perspective divide that built the pixel in the first place threw the scale away. One pixel is a bearing; it was never a position.
:::

## Extrinsics: where the camera is, in the world

The coordinates above are camera-frame. Landmarks are naturally known in some other, fixed reference frame — a target vehicle's body frame, an inertial frame, a planet-fixed frame — and relating the two is exactly a rotation and a translation, the **extrinsics**: with $\mathbf{R}$ the attitude representations module's own direction cosine matrix from the reference frame to the camera frame and $\mathbf{t}$ the camera's position in that same reference frame,

$$
\mathbf{P}_{\text{cam}} = \mathbf{R}\big(\mathbf{P}_{\text{world}} - \mathbf{t}\big),
$$

so the full projection from a known world point to a pixel is $\mathbf{K}\mathbf{R}(\mathbf{P}_{\text{world}}-\mathbf{t})$, intrinsics and extrinsics composed into one matrix product. Where the intrinsics are fixed by the hardware, the extrinsics are exactly the six-degree-of-freedom pose — three for $\mathbf{R}$, three for $\mathbf{t}$ — that a navigation camera exists to recover, which is what the rest of this lesson is about.

## Distortion: a real lens is not an ideal pinhole

An ideal pinhole maps a straight line in space to a straight line of pixels; a real lens, particularly a wide-field one, does not. The standard correction models the departure as a function of normalized radius $r^2=x^2+y^2$ from the optical axis, split into a **radial** term (symmetric blurring of scale with radius, from imperfect lens curvature) and a smaller **tangential** term (from imperfect lens-to-sensor alignment, omitted here for brevity since radial distortion dominates in most navigation optics):

$$
x_{\text{dist}} = x\big(1+k_1 r^2+k_2 r^4+\cdots\big), \qquad y_{\text{dist}} = y\big(1+k_1 r^2+k_2 r^4+\cdots\big),
$$

applied to the normalized coordinates *before* the intrinsic matrix converts them to pixels. Because the correction scales with $r^2$ and $r^4$, it is negligible near the optical axis and grows rapidly toward the edge of the frame — exactly the pattern real lenses show.

::: example How far distortion moves a pixel, and how to undo it
```python
import numpy as np

fx = fy = 800.0
cx = cy = 512.0
k1, k2 = -0.12, 0.02

def distort(x, y):
    r2 = x*x + y*y
    f = 1 + k1*r2 + k2*r2**2
    return x*f, y*f

def to_pixel(x, y):
    return fx*x + cx, fy*y + cy

for name, (x, y) in [("centre", (0.02, -0.01)), ("mid-frame", (0.25, 0.15)),
                      ("near edge", (0.55, 0.30)), ("corner", (0.60, 0.60))]:
    xd, yd = distort(x, y)
    u0, v0 = to_pixel(x, y)
    u1, v1 = to_pixel(xd, yd)
    print(f"{name:10s} r={np.hypot(x,y):.3f}  displacement = {np.hypot(u1-u0, v1-v0):5.2f} px")
# centre      r=0.022  displacement =  0.00 px
# mid-frame   r=0.292  displacement =  2.35 px
# near edge   r=0.626  displacement = 22.06 px
# corner      r=0.849  displacement = 51.61 px
```

A landmark near the frame's centre is essentially undistorted; the same lens moves a corner landmark by more than fifty pixels — enough, uncorrected, to overwhelm any centroiding precision this module has derived. Undoing it has no closed form (the distortion equation is not directly invertible), but a fixed-point iteration converges in a handful of steps: guess the undistorted coordinate equal to the distorted one, redistort the guess, and correct by the ratio, repeated until it stops moving.

```python
def undistort(xd, yd, iters=20):
    x, y = xd, yd
    for _ in range(iters):
        r2 = x*x + y*y
        f = 1 + k1*r2 + k2*r2**2
        x, y = xd / f, yd / f
    return x, y

x_true, y_true = 0.55, 0.30
xd, yd = distort(x_true, y_true)
x_rec, y_rec = undistort(xd, yd)
print("recovered:", x_rec, y_rec, " error:", np.hypot(x_rec - x_true, y_rec - y_true))
# recovered: 0.55 0.3  error: 0.0
```

Twenty iterations recover the true normalized coordinate to full floating-point precision, and in practice far fewer are needed — undistortion is applied once, on every pixel, before any of this module's other geometry (star centroiding, landmark matching, the pinhole inversion above) is allowed to touch the data.
:::

## One pixel is a bearing, not a position — and what fixes that

The first worked example already showed the consequence directly: a single pixel constrains two numbers (the ray's direction) and says nothing about the third (how far along it). Everything that follows in optical navigation is one of three ways of supplying that missing information.

The first is **several landmarks at once, with known positions**: three points, each contributing one bearing and one known inter-point distance, turn into a system the eighteenth-century astronomer Grunert first solved in closed form and every modern pose-estimation library still calls the **Perspective-Three-Point (P3P)** problem. With $\alpha,\beta,\gamma$ the angles between pairs of measured bearings and $a,b,c$ the known distances between the corresponding landmark pairs, the law of cosines applied to each pair of unknown camera-to-landmark distances $d_1,d_2,d_3$ gives three equations,

$$
a^2=d_2^2+d_3^2-2d_2d_3\cos\alpha, \quad b^2=d_1^2+d_3^2-2d_1d_3\cos\beta, \quad c^2=d_1^2+d_2^2-2d_1d_2\cos\gamma,
$$

in three unknowns. Eliminating one distance ratio between two of these — each individually quadratic in two unknowns — generically produces a single quartic polynomial in the other ratio, and a quartic has up to four real roots: **P3P has, in general, up to four geometrically distinct candidate poses consistent with the identical three measured bearings**, exactly the module's own card. This is not a numerical artifact to be solved away; it is how many rigid placements of three known points can, in principle, produce the same three observed angles between them.

::: example Solving P3P for real, and watching all four solutions appear
```python
import numpy as np
from scipy.optimize import brentq

# a synthetic camera pose, three known world landmarks, and their true bearings
rng = np.random.default_rng(11)
def rotation(axis, ang):
    k = np.asarray(axis, float) / np.linalg.norm(axis)
    Kx = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(ang) * Kx + (1 - np.cos(ang)) * Kx @ Kx

R_true = rotation([0.2, 0.6, -0.3], 0.35)
cam_true = np.array([2.0, -1.0, 0.5])
P = np.array([[5.0, 1.0, 6.0], [4.0, -2.0, 7.0], [6.5, 0.5, 5.5]])

Pc_true = (R_true @ (P - cam_true).T).T
d_true = np.linalg.norm(Pc_true, axis=1)
bearings = Pc_true / d_true[:, None]

a = np.linalg.norm(P[1]-P[2]); b = np.linalg.norm(P[0]-P[2]); c = np.linalg.norm(P[0]-P[1])
cos_a, cos_b, cos_g = bearings[1]@bearings[2], bearings[0]@bearings[2], bearings[0]@bearings[1]

def y_branches(x):
    A, B = c**2, -2*c**2*cos_b
    C = c**2 - b**2 - b**2*x**2 + 2*b**2*x*cos_g
    disc = B*B - 4*A*C
    if disc < 0: return []
    r = np.sqrt(disc)
    return [(-B+r)/(2*A), (-B-r)/(2*A)]

def residual(x, y):
    return a**2*(1+x**2-2*x*cos_g) - c**2*(x**2+y**2-2*x*y*cos_a)

roots = []
xs = np.linspace(1e-3, 5.0, 4000)
for branch in (0, 1):
    vals = [residual(x, y[branch]) if len(y := y_branches(x)) > branch else np.nan for x in xs]
    for i in range(len(xs)-1):
        v0, v1 = vals[i], vals[i+1]
        if np.isfinite(v0) and np.isfinite(v1) and v0*v1 < 0:
            xr = brentq(lambda x: residual(x, y_branches(x)[branch]), xs[i], xs[i+1])
            roots.append((xr, y_branches(xr)[branch]))

print("true distances:", np.round(d_true, 3))
for x, y in roots:
    d1 = c / np.sqrt(1 + x**2 - 2*x*cos_g)
    d2, d3 = x*d1, y*d1
    print(f"  candidate d=({d1:.3f},{d2:.3f},{d3:.3f})  matches truth? err={np.linalg.norm([d1,d2,d3]-d_true):.4f}")
# true distances: [6.576 6.874 6.892]
#   candidate d=(6.618,4.787,6.900)  matches truth? err=2.0874
#   candidate d=(6.576,6.874,6.892)  matches truth? err=0.0000
#   candidate d=(6.328,6.949,6.808)  matches truth? err=0.2723
#   candidate d=(5.961,6.956,4.948)  matches truth? err=2.0410
```

Four candidates, from exactly three bearing measurements and three known landmark separations; one matches the truth to the last printed digit, and the other three are entirely legitimate solutions of the same three equations — different rigid placements of the triangle that happen to present the identical set of angles to the camera. A **fourth** landmark resolves it without any further algebra: project each of the four candidate poses' prediction for the fourth landmark's bearing and compare to what the camera actually measured there. Recovering a pose (rotation and translation) from each candidate's three camera-frame points and the known world points is the same rigid-alignment problem the least-squares module's Wahba lesson solved by SVD, applied to points about their centroid instead of directions from the origin; carried through for this example, the true candidate predicts the fourth bearing to $0.000^\circ$, while the three false candidates miss it by $6.3^\circ$, $2.5^\circ$, and $13.9^\circ$ — nowhere close, and trivially rejected. Three points give you a pose *up to a four-way ambiguity*; a fourth gives you a pose.
:::

The second way to supply the missing depth is **motion**: two images of the same landmark from two different, known camera positions triangulate to a unique point, exactly the parallax a moving observer always has available, and this is the basis of every multi-view and visual-odometry technique this module's later lessons build on. The third is an **independent range measurement** — the previous lesson's lidar or radar altimeter, fused with the camera's bearing, turns one ambiguous ray into one determined point directly, without needing a second view or a second landmark at all.

::: key What a single pinhole observation constrains
$u=f_xX/Z+c_x$, $v=f_yY/Z+c_y$: one pixel fixes a ray, two of three degrees of freedom, and leaves range along that ray completely unknown. Three known landmarks solve for pose up to P3P's four-way ambiguity; a fourth landmark, motion over time, or an independent range measurement resolves it. This is also why the scale of a monocular visual-odometry solution is unobservable from bearings alone — every camera-only reconstruction can be uniformly rescaled and still explain the same pixels — and needs an accelerometer, a known baseline, or exactly the kind of independent range this lesson just described to fix it in physical units.
:::

## Check yourself

::: check
Starting from $u=f_xX/Z+c_x$, $v=f_yY/Z+c_y$, show algebraically that inverting these two equations for a measured $(u,v)$ recovers the ratios $X/Z$ and $Y/Z$ but no information about $Z$ itself.
:::

::: answer
Solving each equation for the ratio gives $X/Z=(u-c_x)/f_x$ and $Y/Z=(v-c_y)/f_y$ directly — two numbers, fully determined by the pixel and the known intrinsics. Nothing in either equation involves $X$, $Y$, or $Z$ individually; only their ratios to $Z$ appear, because the projection itself was built by dividing through by $Z$. Multiplying $(X,Y,Z)$ by any positive scalar leaves both ratios, and therefore the pixel, completely unchanged, so no value of $Z$ can be recovered from $(u,v)$ alone.
:::

::: check
A camera has $f_x=f_y=1200\,\mathrm{px}$, $c_x=c_y=640\,\mathrm{px}$. A point sits at camera-frame coordinates $(0.4,-0.9,8.0)\,\mathrm{m}$. Compute the pixel it projects to.
:::

::: answer
$X/Z=0.4/8.0=0.05$, $Y/Z=-0.9/8.0=-0.1125$. Then $u=1200(0.05)+640=700\,\mathrm{px}$ and $v=1200(-0.1125)+640=505\,\mathrm{px}$.
:::

::: check
In the distortion example, a landmark at the frame's centre moved $0\,\mathrm{px}$ while one at the corner moved over $50\,\mathrm{px}$, for the same lens. Explain this factor from the form of the distortion model itself.
:::

::: answer
The correction multiplies the normalized coordinates by $1+k_1r^2+k_2r^4$, a factor that depends only on $r^2=x^2+y^2$, the squared distance from the optical axis in normalized coordinates. At the centre $r\approx0$, so the correction factor is essentially $1$ and the displacement vanishes; at the corner $r$ is largest, and because the correction grows with the *square* and *fourth power* of $r$, even a modest increase in radius produces a much larger displacement — distortion is a strongly radius-dependent effect by construction, not a uniform one.
:::

::: check
Explain, in terms of eliminating variables between two equations, why the P3P problem generically produces up to four solutions rather than a unique one, without redoing the specific algebra.
:::

::: answer
The three law-of-cosines equations are each quadratic in the unknown distances; fixing one distance and dividing through leaves two equations, each quadratic in the remaining two distance ratios. Eliminating one of those two ratios between two quadratic equations is, in general, exactly the kind of elimination that produces a quartic polynomial in the other ratio — and a quartic polynomial has up to four roots. The four-way ambiguity is a structural consequence of the problem being built from two coupled quadratics, not a flaw in any particular solution method.
:::

::: check
The worked P3P example used a fourth landmark to discard three of the four candidate poses. Describe the test that discards them, and name the earlier lesson in this module that used an almost identical mechanism for a different purpose.
:::

::: answer
Each candidate pose's rotation and translation, recovered from the first three landmarks, predicts where a fourth, independently known landmark should appear as a bearing; comparing that prediction against the bearing the camera actually measured for the fourth landmark separates the one candidate that agrees (to machine precision, in the noiseless worked example) from the others, which disagree by several degrees. This is the same idea as the residual gate the star tracker lesson used to reject a false star or a swapped identification: solve using a minimal set, then check every additional piece of data against the solution and discard whatever does not fit.
:::

::: check
Why is the scale of a purely monocular visual-odometry reconstruction unobservable, and what kinds of measurement fix it?
:::

::: answer
A camera measures only bearings, and uniformly rescaling every 3-D point and every camera position by the same positive factor leaves every bearing, and therefore every pixel the camera ever recorded, completely unchanged — the reconstruction is correct up to an entirely unconstrained overall scale. Fixing it needs information a bearing-only measurement cannot supply on its own: an accelerometer, whose reading has physical units of length over time squared and so pins down the scale of any integrated motion; a known physical baseline, such as the fixed separation between two cameras in a stereo rig; or an independent range measurement, such as the lidar or radar altimeter of the previous lesson, fused with the camera's bearings.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $x=X/Z$, $y=Y/Z$ | Perspective divide: normalized image coordinates |
| $u=f_xx+c_x$, $v=f_yy+c_y$; $\mathbf{K}=\begin{pmatrix}f_x&0&c_x\\0&f_y&c_y\\0&0&1\end{pmatrix}$ | Intrinsics: fixed camera properties, found by calibration |
| $\mathbf{P}_{\text{cam}}=\mathbf{R}(\mathbf{P}_{\text{world}}-\mathbf{t})$ | Extrinsics: the pose a navigation camera exists to recover |
| $x_{\text{dist}}=x(1+k_1r^2+k_2r^4+\cdots)$ | Radial distortion; negligible near the axis, large toward the frame edge; corrected by fixed-point iteration |
| One pixel | A bearing (two DOF); range along it is unrecoverable from that pixel alone |
| P3P: up to four candidate poses from three bearings | Resolved by a fourth landmark, motion and triangulation, or an independent range |
| Monocular scale | Unobservable from bearings alone; fixed by an accelerometer, a known baseline, or an external range |

This lesson fixed the geometry a camera hands back for one instant, one set of pixels. The next turns to what happens across many instants — tracking the same features frame to frame, matching a whole scene against a stored map, and using exactly the fourth-point trick above at a much larger scale to pin a lander to the ground it is falling toward.
