---
id: l07-cameras-pinhole-intrinsics-extrinsics-distortion
title: 'Cameras for optical navigation: the pinhole model, intrinsics, extrinsics, distortion'
minutes: 25
covers:
  - 'Cameras for optical navigation: the pinhole model, intrinsics and extrinsics, distortion'
---

Close one eye and point at a streetlight across a dark parking lot. Your finger tells you exactly *which way* the light is. It tells you nothing about *how far away* it is. A streetlight twice as far away, twice as tall and twice as bright, would sit behind your fingertip in exactly the same spot.

A camera is that pointing finger, repeated a million times over. Each pixel looks in one direction. A bright spot on a pixel tells the camera a direction to something, not where that something is.

You met a camera already: the **star tracker** from the first lesson. For stars, direction is all you need, because they are so far away that distance never matters. A **navigation camera** looks at everything else: patterns painted on a docking target, the ground rushing up during a landing, a rock face on an asteroid. For those, distance matters a lot.

This lesson builds the **[[pinhole model|camera-obscura]]** that turns a point in space into a pixel, the numbers that describe one camera (its **intrinsics**), where it sits and points (its **extrinsics**), and the bending a real lens adds (**distortion**). Then the big question: if one pixel only gives a direction, how many landmarks does it take to find where the camera is?

## The pinhole: from a point in space to a spot on the picture

Picture a shoebox with a tiny hole in one end and a sheet of tracing paper at the other. Light from a candle outside passes through the hole in a straight line and makes a small spot on the paper. Every point of the candle sends its own straight line through the hole, so a whole (upside-down) image of the candle appears. That is a **pinhole camera**, and every navigation camera is modelled as one.

To write it down, put the hole at the origin and set up the **camera frame**:

- $Z$ points straight out of the camera, along the **boresight** — the direction the camera looks;
- $X$ points to the right of the picture;
- $Y$ points down the picture, because image rows are counted from the top.

A point in front of the camera has coordinates $(X, Y, Z)$, with $Z$ its depth — how far in front of the camera it is, measured along the boresight.

Now imagine the tracing paper one unit in *front* of the hole instead of behind it. The picture is the same, just right-side up. The straight line from the hole to the point crosses that sheet at the **normalized coordinates**

$$
x = \frac{X}{Z}, \qquad y = \frac{Y}{Z}.
$$

Read $x = X/Z$ as "x equals big X over big Z". Dividing by the depth $Z$ is called the **perspective divide**. It is why far-away things look small: the same sideways offset $X$, divided by a bigger $Z$, gives a smaller $x$.

::: note Why it has to be true
Look at the camera from above. The ray from the hole to the point is the long side of a right triangle with legs $Z$ (straight out) and $X$ (sideways). The sheet one unit in front of the hole cuts off a smaller triangle with legs $1$ and $x$. The two triangles share the same angle at the hole, so they are **similar**: every side of the small one is the same fraction of the matching side of the big one. So $x / 1 = X / Z$. Looking from the side instead gives $y / 1 = Y / Z$ the same way.
:::

### Pixels: the intrinsics

The normalized coordinates are angles in disguise: $x$ is the tangent of the angle off the boresight. A computer does not see those. It sees pixel numbers: column $u$ and row $v$. Two things turn one into the other.

First, a scale. The distance from the hole to the detector is the **focal length**. Measured in pixel widths instead of millimetres, it becomes $f_x$ ("f sub x"), the number of pixels you move per unit of $x$. On most cameras $f_x$ and $f_y$ are equal, but the pixel grid can be very slightly stretched in one direction, so they get one number each.

Second, a shift. The spot where the boresight hits the detector is the **principal point** $(c_x, c_y)$. On a $1024 \times 1024$ detector it is near $(512, 512)$, but never exactly, because the lens is never glued on perfectly centred.

Put together:

$$
u = f_x\,x + c_x, \qquad v = f_y\,y + c_y .
$$

Those four numbers are the camera's **intrinsics** — the facts about the optics and the chip that do not depend on where the camera is pointed. Engineers measure them on the ground by photographing a checkerboard from many angles, and they stay fixed in flight unless heat or a shock nudges the lens.

The four numbers are usually packed into one **intrinsic matrix**:

$$
\mathbf{K} = \begin{pmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{pmatrix}, \qquad
\begin{pmatrix} u \\ v \\ 1\end{pmatrix} \sim \mathbf{K}\begin{pmatrix} X \\ Y \\ Z\end{pmatrix}.
$$

The squiggle $\sim$ is read "is proportional to". Multiply $\mathbf{K}$ by $(X, Y, Z)$ and you get $(f_x X + c_x Z,\; f_y Y + c_y Z,\; Z)$. Divide all three by the last entry, $Z$, and you get $(u, v, 1)$. That trick of carrying one extra number and dividing by it at the end is called **[[homogeneous coordinates|homogeneous]]**. It lets a single matrix multiplication stand in for a division, and every camera library uses it.

::: key Pinhole camera model
$u = f_x(X/Z) + c_x$, $v = f_y(Y/Z) + c_y$, in the camera frame. Inverting a pixel gives a **ray**, not a point — one observation is a bearing, not a position.
:::

::: example Project a point, then run the pixel backwards
A camera has $f_x = f_y = 800$ pixels and principal point $(512, 512)$. A rock sits at $(X, Y, Z) = (1.3, -0.6, 5.0)\,\mathrm{m}$ in the camera frame. Where does it land?

**Divide by depth.** $x = 1.3 / 5.0 = 0.26$ and $y = -0.6 / 5.0 = -0.12$.

**Scale and shift.** $u = 800 \times 0.26 + 512 = 720$ and $v = 800 \times (-0.12) + 512 = 416$. The rock is right of centre (bigger $u$) and above centre (smaller $v$, since rows count down), which matches its positive $X$ and negative $Y$.

**Run it backwards.** From the pixel alone, $x = (720 - 512)/800 = 0.26$ and $y = (416 - 512)/800 = -0.12$. So the rock lies somewhere along the ray pointing in the direction $(0.26, -0.12, 1)$. That is all.

```python
import numpy as np

fx, fy, cx, cy = 800.0, 800.0, 512.0, 512.0
K = np.array([[fx, 0, cx], [0, fy, cy], [0, 0, 1]])

for P_cam in (np.array([1.3, -0.6, 5.0]), np.array([6.5, -3.0, 25.0])):   # same ray, 5x farther
    uvw = K @ P_cam
    u, v = uvw[0] / uvw[2], uvw[1] / uvw[2]
    print("point", P_cam, "-> pixel", (round(u, 3), round(v, 3)))

x, y = (720.0 - cx) / fx, (416.0 - cy) / fy          # back from the pixel
ray = np.array([x, y, 1.0]) / np.linalg.norm([x, y, 1.0])
print("ray direction:", ray.round(5))
# point [ 1.3 -0.6  5. ] -> pixel (720.0, 416.0)
# point [ 6.5 -3.  25. ] -> pixel (720.0, 416.0)
# ray direction: [ 0.24995 -0.11536  0.96136]
```

The second point is five times farther along the same ray, and it lands on exactly the same pixel. The perspective divide threw the distance away. **Sanity check:** the ray's direction is mostly along $Z$ ($0.961$), as it should be for a point well in front of the camera and only a little off to the side.
:::

::: warning Rows go down, and pixels are not millimetres
Two slips catch nearly everyone. First, $v$ counts *down* from the top row, so "up in the picture" means *smaller* $v$; flip that and every height comes out with the wrong sign. Second, a lens datasheet gives the focal length in millimetres, but $f_x$ in the model is in pixels. Divide the focal length by the pixel size to convert. A $20\,\mathrm{mm}$ lens on $5.5\,\mu\mathrm{m}$ pixels has $f_x = 20 / 0.0055 \approx 3636$ pixels, not $20$.
:::

## Extrinsics: where the camera is, and which way it points

Landmarks come with coordinates in some other, fixed frame: a map of the Moon, the body frame of a space station, an inertial frame. Think of a friend who says "the café is two blocks north of the library". To use that, you have to know where *you* are and which way *you* are facing.

The camera's version of "where I am and which way I face" is its **extrinsics**. With $\mathbf{t}$ the camera's position in the world frame, and $\mathbf{R}$ the rotation matrix (the direction cosine matrix from the attitude module) that turns world directions into camera directions,

$$
\mathbf{P}_{\text{cam}} = \mathbf{R}\big(\mathbf{P}_{\text{world}} - \mathbf{t}\big).
$$

Read it in two steps. $\mathbf{P}_{\text{world}} - \mathbf{t}$ is the arrow from the camera to the landmark, still written in world directions. Multiplying by $\mathbf{R}$ rewrites that same arrow in the camera's own directions.

Chain it with the intrinsics and you have the whole camera in one line: a known world point goes to a pixel through $\mathbf{K}\mathbf{R}(\mathbf{P}_{\text{world}} - \mathbf{t})$, followed by the divide.

The intrinsics are fixed by the hardware. The extrinsics are the unknowns: six numbers — three for the rotation $\mathbf{R}$ and three for the position $\mathbf{t}$ — called the camera's **pose**. Finding the pose is the whole reason a navigation camera flies.

## Distortion: a real lens is not a perfect pinhole

A perfect pinhole maps every straight line in the world to a straight line in the picture. A real lens, especially a wide-angle one, does not. Photograph a tiled wall with a cheap wide-angle camera and the lines near the edges bow outward like the sides of a barrel. That is **[[radial distortion|barrel-pincushion]]**: the lens magnifies slightly differently depending on how far from the centre of the picture the light passes.

The standard model measures how far a point is from the centre using $r^2 = x^2 + y^2$ (read "r squared"), the squared distance from the boresight in normalized coordinates. It then scales the normalized coordinates by a factor that depends on $r^2$:

$$
x_{\text{dist}} = x\big(1+k_1 r^2+k_2 r^4+\cdots\big), \qquad y_{\text{dist}} = y\big(1+k_1 r^2+k_2 r^4+\cdots\big).
$$

The **distortion coefficients** $k_1, k_2$ are more intrinsics, found in the same calibration. A negative $k_1$ squeezes points toward the centre (barrel); a positive one pushes them out (pincushion). A smaller **tangential** term, from lens elements sitting slightly tilted or off-centre, is left out here.

Distortion acts on the normalized coordinates *before* $\mathbf{K}$ turns them into pixels. Because it grows with $r^2$ and $r^4$, it is tiny near the centre and large at the corners.

::: example How far distortion moves a pixel
Take the same camera ($f_x = f_y = 800$, centre $512$) with $k_1 = -0.12$ and $k_2 = 0.02$. Work out the corner point $(x, y) = (0.6, 0.6)$ by hand first.

**Radius.** $r^2 = 0.6^2 + 0.6^2 = 0.72$, so $r^4 = 0.72^2 = 0.5184$.

**Scale factor.** $1 + k_1 r^2 + k_2 r^4 = 1 - 0.0864 + 0.0104 = 0.924$. The point is pulled about $7.6\%$ toward the centre.

**In pixels.** Each coordinate moves from $0.6$ to $0.6 \times 0.924 = 0.5544$, a change of $(0.6 - 0.5544) \times 800 \approx 36.5$ pixels. It moves that much in both $u$ and $v$, so the total shift is $36.5 \times \sqrt{2} \approx 51.6$ pixels.

The code does the same for four points across the picture:

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
    print(f"{name:10s} r={np.hypot(x, y):.3f}  moved {np.hypot(u1-u0, v1-v0):5.2f} px")
# centre     r=0.022  moved  0.00 px
# mid-frame  r=0.292  moved  2.35 px
# near edge  r=0.626  moved 22.06 px
# corner     r=0.849  moved 51.61 px
```

Near the centre the lens is essentially perfect. At the corner the same lens moves a landmark by more than fifty pixels. The star tracker lessons worked hard to find star centres to a tenth of a pixel; an error of fifty would swamp all of that.
:::

### Undoing distortion

Going forward (true point to distorted point) is one line. Going backward has no neat formula, because the unknown $x$ appears inside the scale factor too. But a guess-and-improve loop works well:

1. Guess that the true point equals the distorted one.
2. Work out the scale factor at the guess.
3. Divide the measured, distorted point by that factor to get a better guess.
4. Repeat until the guess stops changing.

This is a **[[fixed-point iteration|fixed-point]]**. Continuing the code above:

```python
def undistort(xd, yd, iters=20):
    x, y = xd, yd                       # step 1: first guess
    for _ in range(iters):
        r2 = x*x + y*y
        f = 1 + k1*r2 + k2*r2**2        # step 2: scale factor at the guess
        x, y = xd / f, yd / f           # step 3: better guess
    return x, y

xd, yd = distort(0.55, 0.30)
x_rec, y_rec = undistort(xd, yd)
print("recovered:", round(x_rec, 12), round(y_rec, 12))
# recovered: 0.55 0.3
```

Twenty rounds bring back the true point to twelve decimal places. In flight, every measured pixel is undistorted like this *before* any other geometry touches it. The pinhole formulas, the P3P solver below and every landmark match assume straight rays; fed raw pixels, they return a confident, wrong pose.

## One pixel is a bearing, not a position

Back to the pointing finger. One pixel fixes two numbers: which way left-right and which way up-down. That is a **bearing** — a direction with no distance attached. Engineers say it constrains **two degrees of freedom** (a degree of freedom is one independent number), and leaves the third, the range along the ray, unknown.

Every optical navigation method is a way of supplying the missing distance. There are three.

### Fix 1: several landmarks you already know

Suppose the camera sees three landmarks whose positions are known, say three craters on a map. It measures the angle between each pair of bearings; the map gives the distance between each pair of landmarks. The unknowns are the camera-to-landmark distances $d_1, d_2, d_3$.

Picture the camera and two landmarks as a triangle. You know the angle at the camera and the far side, and the law of cosines ties them to the two near sides. Let $a$ be the distance between landmarks 2 and 3 and $\alpha$ ("alpha") the angle between their bearings; $b$ and $\beta$ ("beta") go with landmarks 1 and 3, $c$ and $\gamma$ ("gamma") with 1 and 2:

$$
a^2=d_2^2+d_3^2-2d_2d_3\cos\alpha, \quad b^2=d_1^2+d_3^2-2d_1d_3\cos\beta, \quad c^2=d_1^2+d_2^2-2d_1d_2\cos\gamma .
$$

Three equations, three unknowns. This is the **Perspective-Three-Point** problem, or **P3P**, first solved by the German mathematician [[Johann Grunert in 1841|grunert]].

Here is the twist. Each equation is **quadratic** — the unknowns appear squared. Divide through by $d_1^2$ and use the ratios $d_2/d_1$ and $d_3/d_1$ as the unknowns. Two of the equations then tie the ratios together, and eliminating one ratio leaves a single polynomial in the other one of degree four, a **quartic**. A quartic can have up to four real roots. So:

::: key P3P ambiguity
Three known landmarks seen from one camera give **up to four** different camera poses that all produce exactly the same three bearings. The ambiguity is real geometry, not a solver fault; a fourth landmark, motion, or an independent range picks the right one.
:::

::: example Solving P3P and watching four answers appear
The code builds a true pose and three landmarks, measures the bearings, then forgets the truth. With $x = d_2/d_1$ and $y = d_3/d_1$, the $b$ and $c$ equations give $y$ from $x$ (two branches), and the $a$ equation is a leftover that must be zero. Scanning $x$ for sign changes finds every root.

```python
import numpy as np
from scipy.optimize import brentq

def rotation(axis, angle):
    """Rotation matrix for a turn of `angle` radians about `axis` (Rodrigues)."""
    k = np.asarray(axis, float) / np.linalg.norm(axis)
    Kx = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(angle) * Kx + (1 - np.cos(angle)) * Kx @ Kx

# The truth, which the solver never sees directly
R_true = rotation([0.2, 0.6, -0.3], 0.35)
cam_true = np.array([2.0, -1.0, 0.5])
P = np.array([[5.0, 1.0, 6.0], [4.0, -2.0, 7.0], [6.5, 0.5, 5.5]])   # known landmarks

# What the camera measures: three unit bearings
Pc_true = (R_true @ (P - cam_true).T).T
d_true = np.linalg.norm(Pc_true, axis=1)
bearings = Pc_true / d_true[:, None]

# Known side lengths and measured angles (as cosines)
a = np.linalg.norm(P[1] - P[2]); b = np.linalg.norm(P[0] - P[2]); c = np.linalg.norm(P[0] - P[1])
cos_a = bearings[1] @ bearings[2]
cos_b = bearings[0] @ bearings[2]
cos_g = bearings[0] @ bearings[1]

# Unknowns as ratios: x = d2/d1, y = d3/d1. The b and c equations give y from x
# (a quadratic, so two branches); the a equation is what is left over.
def y_from_x(x, branch):
    A, B = c**2, -2 * c**2 * cos_b
    C = c**2 - b**2 * (1 + x**2 - 2 * x * cos_g)
    disc = B * B - 4 * A * C
    if disc < 0:
        return None
    return (-B + (1 if branch == 0 else -1) * np.sqrt(disc)) / (2 * A)

def leftover(x, branch):
    y = y_from_x(x, branch)
    return a**2 * (1 + x**2 - 2 * x * cos_g) - c**2 * (x**2 + y**2 - 2 * x * y * cos_a)

roots = []
xs = np.linspace(1e-3, 5.0, 4000)
for branch in (0, 1):
    for x0, x1 in zip(xs[:-1], xs[1:]):
        if y_from_x(x0, branch) is None or y_from_x(x1, branch) is None:
            continue
        if leftover(x0, branch) * leftover(x1, branch) < 0:          # a sign change: a root
            x = brentq(leftover, x0, x1, args=(branch,))
            roots.append((x, y_from_x(x, branch)))

print("true distances:", np.round(d_true, 3))
for x, y in roots:
    d1 = c / np.sqrt(1 + x**2 - 2 * x * cos_g)
    d = np.array([d1, x * d1, y * d1])
    print("  candidate", np.round(d, 3), " distance from truth:", round(np.linalg.norm(d - d_true), 4))
# true distances: [6.576 6.874 6.892]
#   candidate [6.618 4.787 6.9  ]  distance from truth: 2.0874
#   candidate [6.576 6.874 6.892]  distance from truth: 0.0
#   candidate [6.328 6.949 6.808]  distance from truth: 0.2723
#   candidate [5.961 6.956 4.948]  distance from truth: 2.041
```

Four candidates from three bearings. One is the truth to every printed digit. The other three are honest solutions of the same three equations.

Now bring in a fourth known landmark. For each candidate, turn its three camera-frame points into a full pose (rotation and position) by lining them up with the known world points. That is the same SVD alignment the least-squares module used for Wahba's problem, done on points measured from their average instead of on directions. Then ask each candidate where landmark 4 should appear, and compare with where the camera really saw it:

```python
def pose_from_points(world, cam):
    """Best rotation R and position t with cam = R (world - t): SVD alignment."""
    wc, cc = world.mean(axis=0), cam.mean(axis=0)
    H = (world - wc).T @ (cam - cc)
    U, S, Vt = np.linalg.svd(H)
    D = np.diag([1, 1, np.sign(np.linalg.det(Vt.T @ U.T))])   # keep it a rotation, not a mirror
    R = Vt.T @ D @ U.T
    return R, wc - R.T @ cc

P4 = np.array([4.5, 1.5, 6.8])                     # a fourth known landmark
seen = R_true @ (P4 - cam_true); seen /= np.linalg.norm(seen)

for x, y in roots:
    d1 = c / np.sqrt(1 + x**2 - 2 * x * cos_g)
    points_cam = bearings * np.array([d1, x * d1, y * d1])[:, None]
    R, t = pose_from_points(P, points_cam)
    predicted = R @ (P4 - t); predicted /= np.linalg.norm(predicted)
    miss = np.degrees(np.arccos(np.clip(predicted @ seen, -1, 1)))
    print(f"  candidate predicts landmark 4 off by {miss:.2f} deg")
#   candidate predicts landmark 4 off by 3.24 deg
#   candidate predicts landmark 4 off by 0.00 deg
#   candidate predicts landmark 4 off by 0.99 deg
#   candidate predicts landmark 4 off by 5.82 deg
```

The true candidate predicts the fourth landmark exactly. The three false ones miss it by about $1^\circ$ to $6^\circ$. On a camera like the one above, where one degree is about $14$ pixels near the centre, that is a miss of roughly $14$ to $80$ pixels — impossible to overlook. Three landmarks give a pose up to a four-way tie; a fourth breaks the tie.
:::

### Fix 2: move, and look again

Hold up a finger and look at it with your left eye, then your right. It jumps against the background. That jump is **[[parallax|parallax]]**. Two pictures of the same landmark taken from two known camera positions give two rays, and two rays that are not parallel cross at exactly one point. This is **triangulation**, and it is how a moving camera builds a 3-D map of what it sees. The later lessons on visual odometry build on it.

### Fix 3: measure the distance with another sensor

The previous lesson's laser or radar altimeter measures range directly. Put a range on the camera's ray and the ray becomes a single point, with no second view or extra landmark needed.

### Why a single camera cannot measure size

Take any scene one camera has photographed from several positions. Make every landmark and every camera position twice as far from the origin, all at once. Every ray still points the same way, so every pixel is unchanged.

This means the overall **scale** of a one-camera (**monocular**) reconstruction is **unobservable**: no amount of data from that camera alone can pin it down. To fix it, you need something that knows about real metres: an accelerometer (its reading is in metres per second squared), a known **[[baseline|stereo-baseline]]** such as the fixed gap between two cameras, or an independent range measurement.

::: key What a single pinhole observation constrains
One pixel fixes a ray: two of three degrees of freedom, with range along the ray unknown. Three known landmarks give the pose up to P3P's four-way ambiguity; a fourth landmark, motion over time, or an independent range resolves it. The scale of monocular visual odometry is unobservable from bearings alone and needs an accelerometer, a known baseline, or an external range to fix it in metres.
:::

## Check yourself

::: check
Start from $u = f_x X/Z + c_x$ and $v = f_y Y/Z + c_y$. Show that a measured pixel $(u, v)$ gives you $X/Z$ and $Y/Z$ but nothing about $Z$ itself.
:::

::: answer
Solve each equation for the ratio. Subtract $c_x$ from both sides and divide by $f_x$: $X/Z = (u - c_x)/f_x$. The same steps give $Y/Z = (v - c_y)/f_y$. Both right-hand sides use only the pixel and the known intrinsics, so the two ratios are fully determined.

But $X$, $Y$ and $Z$ only ever appear divided by $Z$. Multiply the point $(X, Y, Z)$ by any positive number and both ratios, and so the pixel, stay the same. No value of $Z$ can be recovered from $(u, v)$ alone.
:::

::: check
A camera has $f_x = f_y = 1200$ pixels and $c_x = c_y = 640$ pixels. A point sits at $(0.4, -0.9, 8.0)\,\mathrm{m}$ in the camera frame. Which pixel does it land on?
:::

::: answer
Divide by depth: $X/Z = 0.4/8.0 = 0.05$ and $Y/Z = -0.9/8.0 = -0.1125$.

Scale and shift: $u = 1200 \times 0.05 + 640 = 700$ pixels, and $v = 1200 \times (-0.1125) + 640 = 505$ pixels.

Sanity check: the point is a little right of centre and above centre (negative $Y$), and indeed $u$ is a bit more than $640$ and $v$ a bit less.
:::

::: check
In the distortion example, a landmark near the centre moved $0$ pixels while one in the corner moved more than $50$, with the same lens. Explain this from the form of the distortion model.
:::

::: answer
The model multiplies the normalized coordinates by $1 + k_1 r^2 + k_2 r^4$, and that factor depends only on $r^2 = x^2 + y^2$, the squared distance from the centre.

Near the centre $r$ is almost $0$, so the factor is almost exactly $1$ and nothing moves. In the corner $r$ is largest, and because the correction grows with $r^2$ and $r^4$, a point twice as far out gets a correction about four times bigger, applied to a coordinate twice as big. Distortion depends strongly on distance from the centre; it is not a uniform shift.
:::

::: check
Without redoing the algebra, explain why P3P can have up to four solutions instead of exactly one.
:::

::: answer
Each of the three law-of-cosines equations is quadratic in the unknown distances. Dividing through by one distance leaves equations in two unknown ratios, each still quadratic. Eliminating one ratio between two quadratic equations generally produces a polynomial of degree four in the other ratio, and a degree-four polynomial can have up to four real roots.

So the ambiguity comes from the structure of the problem — two coupled quadratics — not from any particular solver. Each root is a genuinely different camera pose that sees the same three angles.
:::

::: check
The worked example used a fourth landmark to throw out three of the four candidate poses. Describe the test, and name the earlier lesson in this module that used the same idea for a different job.
:::

::: answer
Each candidate pose predicts the bearing of the fourth, known landmark. Compare with the bearing actually measured: the true candidate agrees (to $0.00^\circ$ here), the false ones miss by roughly $1^\circ$ to $6^\circ$ and are thrown out.

It is the star tracker's pyramid step from the first lesson: solve with the smallest set of measurements, then check each extra one against the answer and discard what does not fit.
:::

::: check
Why can a single camera, however long it watches, never measure the overall scale of its own motion? Name three kinds of measurement that fix it.
:::

::: answer
A camera measures only directions. Multiply every 3-D point and every camera position by the same positive number and every direction — so every pixel ever recorded — stays the same. The reconstruction is right in shape but free in size.

Fixing the size needs a measurement that carries real length units: an accelerometer, whose reading is in metres per second squared, so integrating it gives motion in metres; a known physical baseline, like the fixed distance between the two cameras of a stereo pair; or an independent range, such as the previous lesson's lidar or radar altimeter.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $x = X/Z$, $y = Y/Z$ | Perspective divide: normalized image coordinates |
| $u = f_x x + c_x$, $v = f_y y + c_y$ | Intrinsics turn normalized coordinates into pixels |
| $\mathbf{K}=\begin{pmatrix}f_x&0&c_x\\0&f_y&c_y\\0&0&1\end{pmatrix}$ | The intrinsic matrix; fixed, found by ground calibration |
| $\mathbf{P}_{\text{cam}}=\mathbf{R}(\mathbf{P}_{\text{world}}-\mathbf{t})$ | Extrinsics: the six-number pose a navigation camera exists to find |
| $x_{\text{dist}}=x(1+k_1r^2+k_2r^4+\cdots)$ | Radial distortion: tiny at the centre, large at the edges; undone by fixed-point iteration |
| One pixel | A bearing: two degrees of freedom, range unknown |
| P3P | Three known landmarks give up to four poses; a fourth landmark, motion, or a range picks one |
| Monocular scale | Unobservable from bearings alone; fixed by an accelerometer, a baseline, or a range |

This lesson looked at one picture at a time. The next one follows features across many pictures — finding the same rock again a moment later, and matching a whole view of the ground against a stored map — to pin a lander to the terrain it is falling toward.

::: context camera-obscura The oldest camera there is
A dark room with a small hole in one wall projects an upside-down picture of the outside onto the opposite wall. People noticed this more than two thousand years ago, and it was named the **camera obscura**, Latin for "dark room" — which is where the word *camera* comes from. A real lens gathers far more light than a pinhole, but it bends rays so they meet as if they had all passed through one point, so the pinhole's straight-line geometry still describes it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="20" x2="150" y2="68" stroke="#1f2a44" stroke-width="3"/>
  <line x1="150" y1="82" x2="150" y2="130" stroke="#1f2a44" stroke-width="3"/>
  <line x1="290" y1="20" x2="290" y2="130" stroke="#6c7a93" stroke-width="2"/>
  <line x1="40" y1="52" x2="40" y2="110" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="40,40 34,52 46,52" fill="#1d6fd1"/>
  <line x1="40" y1="40" x2="290" y2="119.5" stroke="#f2b880" stroke-width="1.5"/>
  <line x1="40" y1="110" x2="290" y2="30.5" stroke="#f2b880" stroke-width="1.5"/>
  <line x1="290" y1="30.5" x2="290" y2="108" stroke="#b4232c" stroke-width="4"/>
  <polygon points="290,120 284,108 296,108" fill="#b4232c"/>
  <text x="40" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">object</text>
  <text x="150" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">pinhole</text>
  <text x="300" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">image (flipped)</text>
</svg>
```

Rays from the top of the object land at the bottom of the image and the other way round, because every ray passes through the one hole.
:::

::: context homogeneous Carrying an extra 1
Dividing by $Z$ is not something a matrix can do: matrices only multiply and add. The fix is to write a pixel as three numbers, $(u, v, 1)$, and to agree that $(2u, 2v, 2)$ or $(Zu, Zv, Z)$ mean the same pixel. Now the whole projection is one matrix product, and the division happens once at the very end.

Engineers like this because chains of cameras, rotations and shifts become chains of matrix products, which computers do fast and which are easy to invert. You will meet the same idea again in robotics, where a rotation and a shift are packed into one $4 \times 4$ matrix.
:::

::: context barrel-pincushion Barrel and pincushion
A square grid photographed through a lens with negative $k_1$ bulges outward like a barrel; with positive $k_1$ its edges pinch inward like a pincushion. The centre is almost untouched in both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#1d6fd1" stroke-width="2">
    <path d="M40,25 Q95,10 150,25 Q165,75 150,125 Q95,140 40,125 Q25,75 40,25 Z"/>
    <path d="M95,17 L95,133"/>
    <path d="M32,75 L158,75"/>
  </g>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <path d="M210,25 Q265,42 320,25 Q303,75 320,125 Q265,108 210,125 Q227,75 210,25 Z"/>
    <path d="M265,33 L265,117"/>
    <path d="M218,75 L312,75"/>
  </g>
  <text x="95" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">barrel (k1 &lt; 0)</text>
  <text x="265" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">pincushion (k1 &gt; 0)</text>
</svg>
```

Wide-angle lenses, the kind hazard and descent cameras often use, tend toward barrel distortion.
:::

::: context fixed-point Guess, improve, repeat
A fixed-point iteration solves an equation of the form $x = g(x)$ by starting anywhere and repeating $x \leftarrow g(x)$. If each round shrinks the error, the guesses settle on the answer. Here $g$ divides the measured point by the scale factor worked out at the current guess. Because the scale factor changes only a little between nearby guesses, each round removes most of the remaining error, and a few rounds are enough. You can try the same trick on a calculator: type any number and press cosine over and over, in radians — it settles near $0.739$, the number whose cosine is itself.
:::

::: context grunert A problem older than photography
Surveyors met a flat version of this problem centuries ago: standing at an unknown spot, measure the angles between three church towers whose positions are on the map, and work out where you stand. In 1841 the German mathematician Johann August Grunert solved the full three-dimensional version — before cameras were common. The same algebra now runs inside robot vision libraries, docking cameras and planetary landers. It is still the smallest set of known points that can fix a camera's pose, which is why it sits inside robust matching loops that try thousands of random triples to find the right one.
:::

::: context parallax Two views make a depth
Two cameras (or one camera at two moments) a distance $B$ apart both see the same landmark. The rays cross at the landmark, and the farther away it is, the smaller the angle between them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="28" r="7" fill="#b4232c"/>
  <text x="194" y="32" font-size="12" fill="#1f2a44">landmark</text>
  <rect x="88" y="128" width="24" height="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="248" y="128" width="24" height="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="128" x2="180" y2="28" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="260" y1="128" x2="180" y2="28" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="152" x2="260" y2="152" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">baseline B</text>
  <text x="70" y="124" font-size="12" text-anchor="middle" fill="#1f2a44">view 1</text>
  <text x="290" y="124" font-size="12" text-anchor="middle" fill="#1f2a44">view 2</text>
</svg>
```

If you know $B$ in metres, the crossing point comes out in metres too. That is exactly why the baseline, and not the pictures, sets the scale.
:::

::: context stereo-baseline Why stereo cameras come in pairs
A **stereo camera** is two cameras bolted a fixed, carefully measured distance apart — the baseline. Mars rovers carry them: Curiosity's and Perseverance's navigation cameras sit in pairs on the mast, so every pair of images gives a depth map in real metres without any other sensor. The catch is range. The angle between the two rays shrinks as the target gets farther away, so a baseline of a few tens of centimetres gives good depth out to some tens of metres and poor depth beyond. That is why a lander high above the ground leans on an altimeter or an IMU for scale instead.
:::
