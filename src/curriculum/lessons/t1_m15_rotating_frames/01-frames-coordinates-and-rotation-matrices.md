---
id: l01-frames-coordinates-and-rotation-matrices
title: Frames, coordinates and rotation matrices
minutes: 18
covers:
  - frame transformation chains and notation discipline
---

A number like 7.6 km/s means nothing on its own. Relative to what is the vehicle moving? Along which axes are the three components written? Measured from which origin? Every vector quantity that flows through a GNC system carries those three tags whether or not anyone wrote them down, and most of the frame bugs that have ever reached flight were cases where two pieces of code disagreed about a tag that neither of them stated.

On a real vehicle the tags are unavoidable because the sensors disagree with each other by design. An inertial measurement unit reports specific force and angular rate along its own mounting axes. A GNSS receiver reports position and velocity in an Earth-fixed frame that turns with the ground. A star tracker matches a catalogue of inertial star directions and therefore reports attitude with respect to the celestial sphere. Guidance wants the state in an orbit-fixed or launch-site frame. The job of the navigation software is to move every one of those quantities into a common description without losing anything, and the tool for that is the rotation matrix.

This lesson sets up the language used by every lesson in the module: what a frame is, how a vector's coordinates change between frames, how to chain transformations without getting them backwards, and the naming discipline that turns a silent error into a visible one.

## What a reference frame is

A reference frame is a rigid set of three mutually perpendicular unit vectors, $\hat{\mathbf{e}}_1, \hat{\mathbf{e}}_2, \hat{\mathbf{e}}_3$, forming a right-handed triad ($\hat{\mathbf{e}}_1 \times \hat{\mathbf{e}}_2 = \hat{\mathbf{e}}_3$), attached to an origin $O$, together with a clock. The triad may move and rotate over time. A body-fixed frame rides on the spacecraft; an Earth-centred Earth-fixed frame turns with the planet; an inertial frame does neither.

The distinction that matters for everything that follows is between a *vector* and its *coordinates*. A physical vector — the velocity of the vehicle relative to the Earth's centre, say — is one geometric object. Its coordinates are three numbers that depend on which triad you resolve it along:

$$
\mathbf{a} = a_1 \hat{\mathbf{e}}_1 + a_2 \hat{\mathbf{e}}_2 + a_3 \hat{\mathbf{e}}_3, \qquad
\mathbf{a}^{A} = \begin{bmatrix} a_1 \\ a_2 \\ a_3 \end{bmatrix}, \qquad a_i = \mathbf{a} \cdot \hat{\mathbf{e}}_i .
$$

The superscript on $\mathbf{a}^{A}$ names the frame whose axes the components refer to. The same vector written along the axes of a second frame $B$ is $\mathbf{a}^{B}$, a different column of numbers describing the same arrow.

Three tags travel with every vector quantity in flight software:

- **The frame of reference** — the observer whose motion the quantity is measured against. A velocity "relative to ECEF" and a velocity "relative to ECI" are different vectors, not the same vector in different coordinates. Time derivatives depend on this tag, which is the subject of the next lesson.
- **The resolving axes** — the triad the components are written along. Changing this tag is a rotation and changes nothing physical.
- **The reference point** — the origin, which matters for position and for moments and angular momentum, and does not matter for free vectors such as velocity differences, forces or angular velocity.

Two of the three tags usually coincide (an ECEF velocity is normally resolved in ECEF axes), which is why people forget that they are separate. An inertial navigation system routinely holds the velocity relative to the Earth resolved in north–east–down axes: the frame of reference is the Earth, the resolving axes are the local-level triad, and the two must be named separately or the equations of motion come out wrong.

## Rotation matrices as coordinate transformations

Take two frames $A$ and $B$ with a common origin, axes $\hat{\mathbf{a}}_j$ and $\hat{\mathbf{b}}_i$. A vector $\mathbf{r}$ has coordinates $r_j^{A}$ along $A$ and $r_i^{B}$ along $B$. Since $r_i^{B} = \mathbf{r} \cdot \hat{\mathbf{b}}_i$ and $\mathbf{r} = \sum_j r_j^{A} \hat{\mathbf{a}}_j$,

$$
r_i^{B} = \sum_{j=1}^{3} \left( \hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j \right) r_j^{A}
\qquad\Longrightarrow\qquad
\mathbf{r}^{B} = \mathbf{R}_{B \leftarrow A}\, \mathbf{r}^{A}, \quad
\left[\mathbf{R}_{B \leftarrow A}\right]_{ij} = \hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j .
$$

The entries are the cosines of the angles between the axes of the two frames, which is why $\mathbf{R}_{B \leftarrow A}$ is also called the direction cosine matrix, or DCM. Read the subscript as an arrow: $\mathbf{R}_{B \leftarrow A}$ takes coordinates *from* $A$ *to* $B$. In code this lesson writes the same object `R_b_from_a`.

Three properties follow directly from the definition:

- **Columns and rows have a meaning.** Column $j$ of $\mathbf{R}_{B \leftarrow A}$ holds the coordinates of $\hat{\mathbf{a}}_j$ resolved in $B$. Row $i$ holds the coordinates of $\hat{\mathbf{b}}_i$ resolved in $A$. If you can write down where one frame's axes point in the other frame, you can write down the matrix.
- **It is orthogonal with determinant $+1$.** The columns are orthonormal, so $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$, and a right-handed triad maps to a right-handed triad, so $\det \mathbf{R} = +1$. A determinant of $-1$ means a reflection has crept in — a left-handed frame, or one axis with the wrong sign.
- **The inverse is the transpose.** $\mathbf{R}_{A \leftarrow B} = \mathbf{R}_{B \leftarrow A}^{-1} = \mathbf{R}_{B \leftarrow A}^{T}$, so going back never needs a matrix inversion.

### The three elementary rotations

Most frames in this module are related by rotations about a single coordinate axis. Suppose frame $B$ is obtained from frame $A$ by turning $A$ through an angle $\theta$ about their shared third axis, in the right-handed sense. The new axes are $\hat{\mathbf{b}}_1 = \cos\theta\, \hat{\mathbf{a}}_1 + \sin\theta\, \hat{\mathbf{a}}_2$ and $\hat{\mathbf{b}}_2 = -\sin\theta\, \hat{\mathbf{a}}_1 + \cos\theta\, \hat{\mathbf{a}}_2$, so the rows of the matrix are those coordinates:

$$
\mathbf{R}_3(\theta) = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}, \qquad
\mathbf{R}_1(\theta) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & \sin\theta \\ 0 & -\sin\theta & \cos\theta \end{bmatrix}, \qquad
\mathbf{R}_2(\theta) = \begin{bmatrix} \cos\theta & 0 & -\sin\theta \\ 0 & 1 & 0 \\ \sin\theta & 0 & \cos\theta \end{bmatrix}.
$$

Each $\mathbf{R}_k(\theta)$ is the coordinate transformation from a frame into the frame you get by rotating it through $+\theta$ about axis $k$. The pattern is the same for all three: the sine above the diagonal is positive and the one below is negative, with $\mathbf{R}_2$ looking different only because the cyclic order of $(3, 1)$ puts its off-diagonal sines in the other corners.

### Active and passive rotations

The matrix above *re-labels* a fixed vector in a new frame. The matrix that physically *turns* a vector through $+\theta$ about the third axis within one fixed frame is

$$
\mathbf{R}_3(\theta)^{T} = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}.
$$

The first use is called a passive rotation (or coordinate transformation), the second an active rotation (or operator). They are transposes of each other, and a passive rotation through $+\theta$ has the same matrix as an active rotation through $-\theta$. Both conventions are in wide use. This module, like most navigation texts, uses passive rotations throughout: rotating the *frame* forward by $\theta$ makes the *coordinates* of a fixed vector appear to turn backward by $\theta$. The test that never lies is to push one vector you understand through the matrix and look at where it lands.

::: example An elementary rotation, checked by hand
Frame $B$ is frame $A$ turned through $\theta = 30^\circ$ about their shared $z$ axis. A vector points along $\hat{\mathbf{a}}_1$, so $\mathbf{r}^{A} = (1, 0, 0)$. Where does it lie in $B$?

Geometrically, $\hat{\mathbf{b}}_1$ has moved $30^\circ$ ahead of the vector, so in $B$ the vector sits $30^\circ$ *behind* the first axis: a positive first component and a negative second one. The matrix agrees:

$$
\mathbf{r}^{B} = \mathbf{R}_3(30^\circ)\begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix} = \begin{bmatrix} \cos 30^\circ \\ -\sin 30^\circ \\ 0 \end{bmatrix} = \begin{bmatrix} 0.866 \\ -0.500 \\ 0 \end{bmatrix}.
$$

The length is preserved ($0.866^2 + 0.500^2 = 1.000$), and the first column of $\mathbf{R}_3(30^\circ)$ is exactly this result, as it must be: column 1 is $\hat{\mathbf{a}}_1$ resolved in $B$. Had you used the active matrix by mistake, the second component would have come out $+0.500$ — a sign error of exactly the kind that hides in a frame chain for months.
:::

## Chaining transformations

Real problems pass through several frames. If you know $\mathbf{R}_{B \leftarrow A}$ and $\mathbf{R}_{C \leftarrow B}$, then

$$
\mathbf{r}^{C} = \mathbf{R}_{C \leftarrow B}\, \mathbf{r}^{B} = \mathbf{R}_{C \leftarrow B}\, \mathbf{R}_{B \leftarrow A}\, \mathbf{r}^{A}
\qquad\Longrightarrow\qquad
\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\, \mathbf{R}_{B \leftarrow A}.
$$

Written with the arrow notation the rule is visible: adjacent inner labels must match ($B$ meets $B$), the outer labels give the result, and the matrix nearest the vector acts first. A chain such as inertial → Earth-fixed → local-level → body → sensor becomes a product of four matrices whose subscripts read like dominoes. If two neighbouring labels do not match, the product is meaningless, and the notation tells you so before any arithmetic happens.

Two consequences to keep in mind:

- **Order is not negotiable.** Rotations in three dimensions do not commute. A $90^\circ$ turn about $x$ followed by $90^\circ$ about $z$ ends somewhere different from the same two turns in the opposite order. Writing $\mathbf{R}_{B \leftarrow A}\mathbf{R}_{C \leftarrow B}$ is not a small mistake; it is a different rotation.
- **Inverting a chain reverses it.** $\mathbf{R}_{A \leftarrow C} = \mathbf{R}_{C \leftarrow A}^{T} = \mathbf{R}_{B \leftarrow A}^{T}\, \mathbf{R}_{C \leftarrow B}^{T} = \mathbf{R}_{A \leftarrow B}\,\mathbf{R}_{B \leftarrow C}$, which again reads correctly as dominoes.

::: example A two-hop chain, verified by a shortcut
A star tracker is mounted on a spacecraft with its boresight axis $\hat{\mathbf{s}}_1$ along the body $\hat{\mathbf{b}}_2$ axis, obtained by turning the body frame $90^\circ$ about $\hat{\mathbf{b}}_3$. So $\mathbf{R}_{S \leftarrow B} = \mathbf{R}_3(90^\circ)$. The body itself is turned $30^\circ$ about $\hat{\mathbf{a}}_3$ relative to a reference frame $A$, so $\mathbf{R}_{B \leftarrow A} = \mathbf{R}_3(30^\circ)$. A reference direction has coordinates $\mathbf{u}^{A} = (1, 0, 0)$. What are its sensor coordinates?

Hop one, from the previous example: $\mathbf{u}^{B} = (0.866, -0.500, 0)$.

Hop two: $\mathbf{R}_3(90^\circ)$ maps $(x, y, z)$ to $(y, -x, z)$, so $\mathbf{u}^{S} = (-0.500, -0.866, 0)$.

Verification by shortcut: both rotations are about the same axis, so they add, and $\mathbf{R}_{S \leftarrow A} = \mathbf{R}_3(120^\circ)$. Directly, $\mathbf{u}^{S} = (\cos 120^\circ, -\sin 120^\circ, 0) = (-0.500, -0.866, 0)$. The chain and the shortcut agree. When the axes differ the shortcut is unavailable, and the only checks are the structural ones — orthogonality, determinant $+1$, and a known vector landing where geometry says it should — which is exactly what the tests in this module's coding exercise do.
:::

## Notation discipline

Every vector in this module is three real numbers, and so is every other vector. Nothing in Python, C++ or Fortran will stop you adding a velocity relative to the Earth resolved in ECEF to a velocity relative to inertial space resolved in ECI. The sum has the right shape, the right units and a plausible magnitude. It is also wrong by the velocity of the Earth-fixed frame itself, which at the equator is about 465 m/s; a state estimator fed that sum does not crash, it drifts, and the anomaly report arrives weeks later as an unexplained navigation error.

The defence is to put the tags into the code where a reader — and ideally the compiler — sees them:

- A vector carries its frame of reference and its resolving axes in its name: `r_eci`, `v_ecef`, `v_ned`. When the two differ, say so: `v_ecef_in_ned` is the velocity relative to the Earth resolved along NED axes.
- An angular velocity carries both frames and its resolving axes: `omega_body_wrt_eci_in_body` is $\boldsymbol{\omega}_{B/I}^{B}$, the rate of the body frame relative to the inertial frame, written in body components — precisely what a strapdown gyro triad outputs.
- A matrix carries both ends of its arrow: `R_eci_from_body` is $\mathbf{R}_{I \leftarrow B}$. The word `from` makes the product rule a matter of reading left to right: `R_eci_from_body @ R_body_from_sensor` is allowed, `R_body_from_sensor @ R_eci_from_body` is a spelling error you can see.
- Where the language allows it, make the frame a type or template parameter, so that `Vector<ECI> + Vector<ECEF>` fails to compile. A compile error costs a minute; a silent frame mismatch can cost the mission.

A minimal version of the last point fits in a dozen lines of Python and is worth having in every analysis script:

```python
from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class Vec:
    frame: str
    xyz: np.ndarray

    def __add__(self, other: "Vec") -> "Vec":
        if self.frame != other.frame:
            raise ValueError(f"frame mismatch: {self.frame} + {other.frame}")
        return Vec(self.frame, self.xyz + other.xyz)

v_eci  = Vec("eci",  np.array([-5050.2, -5702.3, -2413.2]))
v_ecef = Vec("ecef", np.array([-5300.0, -5000.0, -2400.0]))
total = v_eci + v_ecef   # ValueError: frame mismatch: eci + ecef
```

The runtime check is weaker than a compile-time one, but it converts a slow divergence into an immediate, named failure, which is the whole point.

::: key
Every vector carries its frame, and ideally its reference point: `r_eci`, `v_ecef`, `omega_body_wrt_eci_in_body`. Matrices carry both frames: `R_eci_from_body`, so that `R_eci_from_body @ R_body_from_sensor` reads correctly and the reverse order is visibly wrong. Better still, make the frame a template or type parameter so a mismatch will not compile.
:::

::: key
A coordinate transformation between frames is a direction cosine matrix $\mathbf{R}_{B \leftarrow A}$ with entries $\hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j$. It is orthogonal with $\det = +1$, its inverse is its transpose, and chains compose as $\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\mathbf{R}_{B \leftarrow A}$ with matching inner labels.
:::

::: warning
Active and passive rotations are transposes of each other. The elementary matrices $\mathbf{R}_k(\theta)$ in this module are passive: they re-express a fixed vector in a frame that has been turned through $+\theta$. If a library you call rotates vectors actively, its matrix for "the same" angle is the transpose of the one here. Never trust the argument name; push a known vector through and look.
:::

::: warning
A frame mismatch is dimensionally valid and therefore silent. Adding or differencing vectors that live in different frames, or multiplying matrices whose inner labels do not match, produces numbers of the right size and shape that are wrong by something like $\boldsymbol{\omega} \times \mathbf{r}$ — up to 465 m/s for ECI against ECEF at the equator. It shows up as slow navigation divergence, not as an exception.
:::

## Check yourself

::: check
A frame $B$ is obtained from $A$ by rotating $A$ through $+90^\circ$ about their common $x$ axis. Write $\mathbf{R}_{B \leftarrow A}$ and use it to find the $B$-coordinates of a vector with $\mathbf{r}^{A} = (0, 1, 0)$. Does the answer match the geometry?
:::

::: answer
The rotation is about axis 1, so $\mathbf{R}_{B \leftarrow A} = \mathbf{R}_1(90^\circ)$ with $\cos 90^\circ = 0$, $\sin 90^\circ = 1$:

$$
\mathbf{R}_1(90^\circ) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & -1 & 0 \end{bmatrix}, \qquad
\mathbf{r}^{B} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & -1 & 0 \end{bmatrix}\begin{bmatrix} 0 \\ 1 \\ 0 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ -1 \end{bmatrix}.
$$

Geometry: the rows of $\mathbf{R}_{B \leftarrow A}$ are the new axes resolved in the old frame. Row 2 is $(0, 0, 1)$, so $\hat{\mathbf{b}}_2 = \hat{\mathbf{a}}_3$; row 3 is $(0, -1, 0)$, so $\hat{\mathbf{b}}_3 = -\hat{\mathbf{a}}_2$. The vector lies along $\hat{\mathbf{a}}_2 = -\hat{\mathbf{b}}_3$, so its $B$-coordinates must be $(0, 0, -1)$. Matrix and geometry agree. Reading the rows this way is more reliable than picturing the rotation, and it is the habit to build.
:::

::: check
You are given `R_ned_from_ecef` and `R_body_from_ned`. Write the product that gives `R_ecef_from_body`, and say which properties you would test numerically before trusting it.
:::

::: answer
The target arrow runs from body to ECEF. Available arrows: body → NED is the transpose of `R_body_from_ned`, and NED → ECEF is the transpose of `R_ned_from_ecef`. Dominoes: `R_ecef_from_body = R_ned_from_ecef.T @ R_body_from_ned.T`, whose inner labels are NED–NED. Equivalently, `(R_body_from_ned @ R_ned_from_ecef).T`.

Tests: (1) `R.T @ R` equals the identity to about $10^{-12}$; (2) $\det \mathbf{R} = +1$, not $-1$; (3) a known vector lands correctly — for instance the body $z$ axis of a vehicle sitting level on the pad, $\mathbf{u}^{B} = (0, 0, 1)$ with body $z$ pointing down, should map to the ECEF direction of the local down vector at the pad, which is $-(\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$ for a spherical Earth at latitude $\varphi$ and longitude $\lambda$.
:::

::: check
Why is $\det \mathbf{R} = -1$ a red flag for a matrix that is supposed to be a frame transformation, even when $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$ holds?
:::

::: answer
Orthogonality guarantees only that lengths and angles are preserved. A determinant of $-1$ means the mapping includes a reflection: a right-handed triad is sent to a left-handed one. No physical rotation of a rigid frame can do that, so the matrix cannot be a DCM between two right-handed frames. In practice it means one axis definition has the wrong sign — for example a "north, east, up" triad typed in as if it were right-handed, when north × east points down, not up. Reflections silently flip one component's sign everywhere downstream.
:::

::: check
A colleague's code contains `v_total = v_eci + v_ned`. Both are NumPy arrays of length 3 with units of m/s. State two separate things that are wrong with this line.
:::

::: answer
First, the resolving axes differ: one column is written along inertial axes and the other along north–east–down axes, so componentwise addition mixes numbers that refer to different directions. Second, the frames of reference differ: `v_eci` is a velocity relative to inertial space and `v_ned` is (by the usual convention) a velocity relative to the rotating Earth. Even after rotating both into the same axes the two are different physical vectors, differing by the velocity of the Earth-fixed frame at that point, $\boldsymbol{\omega}_E \times \mathbf{r}$, which is up to about 465 m/s. The fix is a rotation for the first problem and an explicit transport term for the second — and a naming or typing convention that would have made the line look wrong at a glance.
:::

::: check
Without computing anything, explain why $\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\mathbf{R}_{B \leftarrow A}$ requires the matrix nearest the vector to act first, and what goes wrong physically if the two factors are swapped.
:::

::: answer
The product acts on $\mathbf{r}^{A}$, a column of $A$-coordinates. Only a matrix whose arrow starts at $A$ can consume it, so $\mathbf{R}_{B \leftarrow A}$ must be the right-hand factor; it produces $B$-coordinates, which $\mathbf{R}_{C \leftarrow B}$ then consumes. Swapping the factors feeds $A$-coordinates into a matrix expecting $B$-coordinates. The result is still a valid rotation matrix (the product of two rotations always is), but it is a different rotation, because three-dimensional rotations do not commute. The output will pass orthogonality and determinant tests and will still be wrong, which is why a known-vector test is the one that catches it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}^{A}$ | Coordinates of the vector $\mathbf{a}$ resolved along the axes of frame $A$ |
| Three tags | Frame of reference, resolving axes, reference point |
| $\mathbf{R}_{B \leftarrow A}$, `R_b_from_a` | Coordinate transformation from $A$ to $B$; $[\mathbf{R}]_{ij} = \hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j$ |
| Columns / rows | Columns: $A$ axes in $B$ coordinates. Rows: $B$ axes in $A$ coordinates |
| $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$, $\det \mathbf{R} = +1$ | Orthogonal, proper; inverse is the transpose |
| $\mathbf{R}_1, \mathbf{R}_2, \mathbf{R}_3$ | Passive elementary rotations; positive sine above the diagonal |
| Passive vs active | Transposes of each other; passive by $+\theta$ equals active by $-\theta$ |
| $\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\mathbf{R}_{B \leftarrow A}$ | Chains compose with matching inner labels; nearest matrix acts first |
| Naming | `r_eci`, `v_ecef`, `omega_body_wrt_eci_in_body`, `R_eci_from_body`; frame as a type where possible |

The next lesson takes the time derivative of a vector and shows that it depends on which frame the observer is fixed in. The result, the transport theorem, is the single identity behind every equation of motion in a rotating frame.
