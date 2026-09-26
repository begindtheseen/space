---
id: l01-frames-coordinates-and-rotation-matrices
title: Frames, coordinates and rotation matrices
minutes: 22
covers:
  - frame transformation chains and notation discipline
---

A friend on the phone says "the café is on your left". That only helps if you both know which way you face. Turn around and the café is on your right. It did not move; only the description changed.

A spacecraft's numbers work the same way. A speed of $7.6\,\mathrm{km/s}$ means nothing on its own. Moving relative to what? Along which three directions are the numbers written? Measured from which starting point? Every vector in a guidance, navigation and control (GNC) system carries those three labels, whether or not anyone wrote them down. Most of the frame bugs that have ever reached flight were two pieces of code quietly disagreeing about a label that neither of them stated.

On a real vehicle the sensors disagree by design. An inertial measurement unit reports along its own mounting axes. A GNSS receiver (GPS and its cousins) reports in a frame that turns with the Earth. A **[[star tracker|star-tracker]]** — a small camera that recognizes star patterns — reports pointing against the fixed stars. Navigation software must move all of these into one shared description without losing anything. The tool for that is the **rotation matrix**, and this lesson sets up the language the whole module uses.

## What a reference frame is

Stand in the corner of a room. Three perpendicular edges meet at your feet: along one wall, along the other, and straight up. With them you can describe any spot in the room by three numbers: so far along this wall, so far along that one, so far up.

That is a **reference frame**: a rigid set of three perpendicular directions, fixed to a starting point, together with a clock. Precisely, it is three **[[unit vectors|hat-notation]]** — arrows of length exactly $1$ that only mark a direction — written $\hat{\mathbf{e}}_1, \hat{\mathbf{e}}_2, \hat{\mathbf{e}}_3$ (read "e-hat one, e-hat two, e-hat three"). They are attached to an **origin** $O$, the starting point.

The three arrows must form a **[[right-handed|right-hand-rule]]** set, which means

$$
\hat{\mathbf{e}}_1 \times \hat{\mathbf{e}}_2 = \hat{\mathbf{e}}_3 .
$$

A frame may move and turn. A **body-fixed frame** rides on the spacecraft and turns with it. An **Earth-centred, Earth-fixed frame** (ECEF) turns with the planet. An **inertial frame** does neither: it does not spin and does not speed up, so Newton's laws hold in it as written.

### A vector and its coordinates are different things

Everything else rests on this. A physical vector — say, the vehicle's velocity relative to the Earth's center — is one arrow in space. Its **coordinates** are three numbers that depend on which axes you measure it against. Two people facing different ways describe the same arrow with different numbers.

In symbols, the arrow $\mathbf{a}$ is built from its components along the axes:

$$
\mathbf{a} = a_1 \hat{\mathbf{e}}_1 + a_2 \hat{\mathbf{e}}_2 + a_3 \hat{\mathbf{e}}_3, \qquad
\mathbf{a}^{A} = \begin{bmatrix} a_1 \\ a_2 \\ a_3 \end{bmatrix}, \qquad a_i = \mathbf{a} \cdot \hat{\mathbf{e}}_i .
$$

The last piece says how to find each number: take the **dot product** of the arrow with that axis, which measures how much of the arrow lies along it. The column $\mathbf{a}^{A}$ is read "a in A". The superscript names the frame whose axes the numbers refer to. The same arrow written along the axes of a second frame $B$ is $\mathbf{a}^{B}$ — a different column of numbers describing the same arrow.

### Three labels on every vector

Three labels travel with every vector in flight software:

- **The frame of reference** — the observer whose motion the quantity is measured against. A velocity "relative to ECEF" and a velocity "relative to ECI" (the inertial frame) are different arrows, not the same arrow in different coordinates. Rates of change depend on this label, which is the subject of the next lesson.
- **The resolving axes** — the three directions the numbers are written along. Changing this label is a rotation. It changes nothing physical.
- **The reference point** — the origin. It matters for position, moments and angular momentum, but not for "free" vectors such as a force or an angular velocity.

Usually two of the labels match — an ECEF velocity is normally written along ECEF axes — so people forget they are separate. But an inertial navigation system routinely holds the velocity relative to the Earth written along local north–east–down axes. Those two labels must be named separately, or the equations of motion come out wrong.

## Rotation matrices: changing the axes

Picture a map on a table. Walk around to the other side, and north on the map now points toward you instead of away. To describe the same route from your new spot, you need a rule that turns the old numbers into new ones. In three dimensions that rule is a 3 × 3 table of numbers — a matrix.

Take two frames $A$ and $B$ that share an origin. Frame $A$ has axes $\hat{\mathbf{a}}_1, \hat{\mathbf{a}}_2, \hat{\mathbf{a}}_3$, and frame $B$ has axes $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$. A vector $\mathbf{r}$ has coordinates $r_j^{A}$ along $A$ and $r_i^{B}$ along $B$. The $i$-th coordinate in $B$ is the dot product with $\hat{\mathbf{b}}_i$, and the arrow itself is $\mathbf{r} = \sum_j r_j^{A} \hat{\mathbf{a}}_j$ (the $\sum_j$, read "sum over j", means add up the terms for $j = 1, 2, 3$). Put these together:

$$
r_i^{B} = \sum_{j=1}^{3} \left( \hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j \right) r_j^{A}
\qquad\Longrightarrow\qquad
\mathbf{r}^{B} = \mathbf{R}_{B \leftarrow A}\, \mathbf{r}^{A}, \quad
\left[\mathbf{R}_{B \leftarrow A}\right]_{ij} = \hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j .
$$

In words: the number in row $i$, column $j$ of the matrix is the dot product of $B$'s axis $i$ with $A$'s axis $j$.

Read $\mathbf{R}_{B \leftarrow A}$ aloud as "R, B from A". The little arrow in the subscript says it takes coordinates *from* $A$ *to* $B$. In code this lesson writes the same object `R_b_from_a`.

The dot product of two unit arrows is the cosine of the angle between them. So every entry of the matrix is the cosine of an angle between one axis of $B$ and one axis of $A$. That is why $\mathbf{R}_{B \leftarrow A}$ is also called the **[[direction cosine matrix|direction-cosines]]**, or **DCM**.

Three properties come straight from the definition.

- **Columns and rows have a meaning.** Column $j$ of $\mathbf{R}_{B \leftarrow A}$ holds the coordinates of $\hat{\mathbf{a}}_j$ written in $B$. Row $i$ holds the coordinates of $\hat{\mathbf{b}}_i$ written in $A$. If you can say where one frame's axes point in the other frame, you can write down the matrix.
- **It is orthogonal with determinant $+1$.** The columns are unit length and perpendicular to each other, so $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$. Here $\mathbf{R}^{T}$ ("R transpose") is the matrix flipped across its diagonal, and $\mathbf{I}_3$ is the 3 × 3 identity, the matrix that changes nothing. A right-handed set of axes goes to a right-handed set, so the **determinant** is $\det \mathbf{R} = +1$. A determinant of $-1$ means a mirror flip has crept in — a left-handed frame, or one axis with the wrong sign.
- **The inverse is the transpose.** Going back from $B$ to $A$ undoes the matrix, and for a rotation the undo is the transpose: $\mathbf{R}_{A \leftarrow B} = \mathbf{R}_{B \leftarrow A}^{-1} = \mathbf{R}_{B \leftarrow A}^{T}$. You never need to invert a rotation matrix the hard way.

::: note Why the transpose undoes it
Entry $(i, j)$ of $\mathbf{R}^{T}\mathbf{R}$ is the dot product of column $i$ with column $j$ of $\mathbf{R}$. Column $i$ is the axis $\hat{\mathbf{a}}_i$ written in $B$ coordinates, and column $j$ is $\hat{\mathbf{a}}_j$. Dot products do not care which axes you write arrows in, so this is $\hat{\mathbf{a}}_i \cdot \hat{\mathbf{a}}_j$: $1$ when $i = j$ (a unit arrow with itself) and $0$ otherwise (perpendicular axes). That is exactly the identity matrix. So $\mathbf{R}^{T}$ times $\mathbf{R}$ changes nothing, which is what "inverse" means.
:::

### The three elementary rotations

Most frames in this module are related by a turn about one shared axis — like a door swinging on its hinge. Suppose frame $B$ is frame $A$ turned through an angle $\theta$ ("theta") about their shared third axis, turning the right-handed way. The new axes, written in $A$, are

$$
\hat{\mathbf{b}}_1 = \cos\theta\, \hat{\mathbf{a}}_1 + \sin\theta\, \hat{\mathbf{a}}_2, \qquad
\hat{\mathbf{b}}_2 = -\sin\theta\, \hat{\mathbf{a}}_1 + \cos\theta\, \hat{\mathbf{a}}_2, \qquad
\hat{\mathbf{b}}_3 = \hat{\mathbf{a}}_3 .
$$

Rows of the matrix are the new axes written in the old frame, so these three lines *are* the rows. The same reasoning for the other two axes gives the full set:

$$
\mathbf{R}_3(\theta) = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\ -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}, \qquad
\mathbf{R}_1(\theta) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & \sin\theta \\ 0 & -\sin\theta & \cos\theta \end{bmatrix}, \qquad
\mathbf{R}_2(\theta) = \begin{bmatrix} \cos\theta & 0 & -\sin\theta \\ 0 & 1 & 0 \\ \sin\theta & 0 & \cos\theta \end{bmatrix}.
$$

Each $\mathbf{R}_k(\theta)$ ("R-k of theta") takes coordinates from a frame into the frame you get by turning it through $+\theta$ about axis $k$. The axis you turn about keeps a $1$ on the diagonal. The other four entries are two cosines and two sines, one sine positive and one negative.

Which corner gets the plus sign? Go round the axes in the order $1 \to 2 \to 3 \to 1$ and take the two axes that come after $k$. The $+\sin\theta$ sits in the first one's row and the second one's column. For $\mathbf{R}_3$ that is row 1, column 2; for $\mathbf{R}_1$, row 2, column 3 — both above the diagonal. For $\mathbf{R}_2$ it is row 3, column 1, *below* the diagonal. That is the only reason $\mathbf{R}_2$ looks different.

### Turning the frame or turning the arrow

There are two ways to "rotate by $\theta$", and they are easy to mix up.

Hold a pencil still and turn your head left: the pencil seems to move right. Or keep your head still and turn the pencil left. The two feel alike but go opposite ways.

The matrices above turn your head. They *re-label* a fixed arrow in a new frame. This is called a **passive rotation**, or coordinate transformation. The matrix that physically *turns an arrow* through $+\theta$ about the third axis, inside one fixed frame, is the transpose:

$$
\mathbf{R}_3(\theta)^{T} = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}.
$$

That second kind is called an **active rotation**. The two are transposes of each other, and a passive turn through $+\theta$ has the same matrix as an active turn through $-\theta$. Both conventions are in wide use. This module, like most navigation books, uses **[[passive rotations|passive-picture]]** throughout: turning the *frame* forward by $\theta$ makes the *coordinates* of a fixed arrow appear to turn backward by $\theta$. The test that never lies is to push one arrow you understand through the matrix and look where it lands.

::: example An elementary rotation, checked by hand
Frame $B$ is frame $A$ turned through $\theta = 30^\circ$ about their shared $z$ axis. An arrow points along $\hat{\mathbf{a}}_1$, so $\mathbf{r}^{A} = (1, 0, 0)$. Where does it lie in $B$?

**Guess from the picture first.** The axis $\hat{\mathbf{b}}_1$ has swung $30^\circ$ ahead of the arrow. So, seen from $B$, the arrow sits $30^\circ$ *behind* the first axis. Expect a positive first number and a negative second number.

**Now the matrix.** Multiply $\mathbf{R}_3(30^\circ)$ by the column. Because the column is $(1, 0, 0)$, the product picks out the first column of the matrix:

$$
\mathbf{r}^{B} = \mathbf{R}_3(30^\circ)\begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix} = \begin{bmatrix} \cos 30^\circ \\ -\sin 30^\circ \\ 0 \end{bmatrix} = \begin{bmatrix} 0.866 \\ -0.500 \\ 0 \end{bmatrix}.
$$

**Sanity checks.** The signs match the guess. The length is unchanged: $0.866^2 + 0.500^2 = 1.000$. And the first column of $\mathbf{R}_3(30^\circ)$ is this result, as it must be — column 1 is $\hat{\mathbf{a}}_1$ written in $B$.

Had you used the active matrix by mistake, the second number would have come out $+0.500$. That is exactly the kind of sign error that hides in a frame chain for months.
:::

## Chaining transformations

Real problems pass through several frames, like a letter passing through post offices on its way to you. If you know $\mathbf{R}_{B \leftarrow A}$ and $\mathbf{R}_{C \leftarrow B}$, apply them one after the other:

$$
\mathbf{r}^{C} = \mathbf{R}_{C \leftarrow B}\, \mathbf{r}^{B} = \mathbf{R}_{C \leftarrow B}\, \mathbf{R}_{B \leftarrow A}\, \mathbf{r}^{A}
\qquad\Longrightarrow\qquad
\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\, \mathbf{R}_{B \leftarrow A}.
$$

The arrow notation makes the rule visible. The labels that meet in the middle must match ($B$ next to $B$). The outside labels give the answer ($C$ from $A$). And the matrix nearest the vector acts first. A chain such as inertial → Earth-fixed → local-level → body → sensor becomes a product of four matrices whose labels line up like **[[dominoes|domino-chain]]**. If two neighboring labels do not match, the product means nothing — and the notation tells you so before you do any arithmetic.

Two consequences to keep in mind:

- **Order is not negotiable.** Turns in three dimensions do not **commute**, meaning the order changes the result. A $90^\circ$ turn about $x$ then $90^\circ$ about $z$ ends somewhere different from the same two turns the other way round. Try it with a [[book on your desk|book-experiment]]. Writing $\mathbf{R}_{B \leftarrow A}\mathbf{R}_{C \leftarrow B}$ is not a small slip; it is a different rotation.
- **Undoing a chain reverses it.** Transpose each piece and reverse the order, the way you take off socks and shoes in the opposite order you put them on: $\mathbf{R}_{A \leftarrow C} = \mathbf{R}_{C \leftarrow A}^{T} = \mathbf{R}_{B \leftarrow A}^{T}\, \mathbf{R}_{C \leftarrow B}^{T} = \mathbf{R}_{A \leftarrow B}\,\mathbf{R}_{B \leftarrow C}$. Again the labels read correctly as dominoes.

::: example A two-hop chain, checked by a shortcut
A star tracker is mounted on a spacecraft with its main sighting axis $\hat{\mathbf{s}}_1$ along the body's $\hat{\mathbf{b}}_2$ axis. Its frame is the body frame turned $90^\circ$ about $\hat{\mathbf{b}}_3$, so $\mathbf{R}_{S \leftarrow B} = \mathbf{R}_3(90^\circ)$. The body itself is turned $30^\circ$ about $\hat{\mathbf{a}}_3$ from a reference frame $A$, so $\mathbf{R}_{B \leftarrow A} = \mathbf{R}_3(30^\circ)$. A reference direction has $\mathbf{u}^{A} = (1, 0, 0)$. What are its coordinates in the sensor frame $S$?

**Hop one**, from the previous example: $\mathbf{u}^{B} = (0.866, -0.500, 0)$.

**Hop two.** Put $\theta = 90^\circ$ into $\mathbf{R}_3$: $\cos 90^\circ = 0$ and $\sin 90^\circ = 1$, so the matrix sends $(x, y, z)$ to $(y, -x, z)$. Apply that to $\mathbf{u}^{B}$: $\mathbf{u}^{S} = (-0.500, -0.866, 0)$.

**Shortcut check.** Both turns are about the same axis, so they add: $30^\circ + 90^\circ = 120^\circ$, and $\mathbf{R}_{S \leftarrow A} = \mathbf{R}_3(120^\circ)$. Directly, $\mathbf{u}^{S} = (\cos 120^\circ, -\sin 120^\circ, 0) = (-0.500, -0.866, 0)$. The chain and the shortcut agree.

When the turns are about different axes there is no shortcut. The checks are then orthogonality, determinant $+1$, and a known arrow landing where geometry says it should — exactly the tests in this module's coding exercise.
:::

## Naming discipline

Every vector in this module is three numbers. Nothing in Python, C++ or Fortran stops you adding a velocity relative to the Earth, along ECEF axes, to a velocity relative to inertial space, along ECI axes. The sum has the right shape, units and a believable size.

It is also wrong, by the velocity of the Earth-fixed frame itself — about [[465 m/s|earth-surface-speed]] at the equator. A navigation filter fed that sum does not crash. It drifts, and the problem report arrives weeks later.

The defense is to put the labels into the code, where a reader — and ideally the compiler — can see them:

- A vector carries its frame of reference and its resolving axes in its name: `r_eci`, `v_ecef`, `v_ned`. When the two differ, say so: `v_ecef_in_ned` is the velocity relative to the Earth, written along north–east–down axes.
- An angular velocity carries both frames and its resolving axes. `omega_body_wrt_eci_in_body` ("wrt" means "with respect to") is $\boldsymbol{\omega}_{B/I}^{B}$, read "omega, B relative to I, in B": the turning rate of the body frame relative to the inertial frame, in body components. That is exactly what a **[[strapdown|strapdown]]** gyro set outputs.
- A matrix carries both ends of its arrow: `R_eci_from_body` is $\mathbf{R}_{I \leftarrow B}$. The word `from` turns the product rule into reading left to right. `R_eci_from_body @ R_body_from_sensor` is allowed (body meets body). `R_body_from_sensor @ R_eci_from_body` is a spelling mistake you can see (sensor meets eci). In Python, `@` is matrix multiplication.
- Where the language allows it, [[make the frame part of the type|types-that-catch]], so that `Vector<ECI> + Vector<ECEF>` fails to compile. A compile error costs a minute. A silent frame mismatch can cost the mission.

A small version of the last idea fits in a dozen lines of Python, and it is worth having in every analysis script:

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
try:
    total = v_eci + v_ecef
except ValueError as err:
    print(err)   # frame mismatch: eci + ecef
```

A check while the program runs is weaker than one by the compiler, but it turns a slow drift into an immediate, named failure.

::: key
Every vector carries its frame, and ideally its reference point: `r_eci`, `v_ecef`, `omega_body_wrt_eci_in_body`. Matrices carry both frames: `R_eci_from_body`, so that `R_eci_from_body @ R_body_from_sensor` reads correctly and the reverse order is visibly wrong. Better still, make the frame a template or type parameter so a mismatch will not compile.
:::

::: key
A coordinate transformation between frames is a direction cosine matrix $\mathbf{R}_{B \leftarrow A}$ with entries $\hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j$. It is orthogonal with $\det = +1$, its inverse is its transpose, and chains compose as $\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\mathbf{R}_{B \leftarrow A}$ with matching inner labels.
:::

::: warning Active or passive? Test, do not trust
Active and passive rotations are transposes of each other. The matrices $\mathbf{R}_k(\theta)$ in this module are passive: they re-describe a fixed arrow in a frame that has been turned through $+\theta$. If a library you call turns arrows actively, its matrix for "the same" angle is the transpose of the one here. Never trust the name of a function's input. Push a known arrow through and look.
:::

::: warning A frame mismatch makes no noise
Adding or subtracting vectors that live in different frames, or multiplying matrices whose inner labels do not match, gives numbers of the right size and shape. They are wrong by something like $\boldsymbol{\omega} \times \mathbf{r}$ — up to $465\,\mathrm{m/s}$ for ECI against ECEF at the equator. The error shows up as a slow navigation drift, not as a crash.
:::

## Check yourself

::: check
A frame $B$ is frame $A$ turned through $+90^\circ$ about their shared $x$ axis. Write $\mathbf{R}_{B \leftarrow A}$ and use it to find the $B$-coordinates of an arrow with $\mathbf{r}^{A} = (0, 1, 0)$. Does the answer match the geometry?
:::

::: answer
The turn is about axis 1, so $\mathbf{R}_{B \leftarrow A} = \mathbf{R}_1(90^\circ)$. Put in $\cos 90^\circ = 0$ and $\sin 90^\circ = 1$, then multiply:

$$
\mathbf{R}_1(90^\circ) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & -1 & 0 \end{bmatrix}, \qquad
\mathbf{r}^{B} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & -1 & 0 \end{bmatrix}\begin{bmatrix} 0 \\ 1 \\ 0 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ -1 \end{bmatrix}.
$$

Geometry: the rows are the new axes written in the old frame. Row 2 is $(0, 0, 1)$, so $\hat{\mathbf{b}}_2 = \hat{\mathbf{a}}_3$. Row 3 is $(0, -1, 0)$, so $\hat{\mathbf{b}}_3 = -\hat{\mathbf{a}}_2$. The arrow lies along $\hat{\mathbf{a}}_2 = -\hat{\mathbf{b}}_3$, so its $B$-coordinates must be $(0, 0, -1)$. Matrix and geometry agree. Reading rows is more reliable than picturing the turn in your head.
:::

::: check
You are given `R_ned_from_ecef` and `R_body_from_ned`. Write the product that gives `R_ecef_from_body`, and say which properties you would test numerically before trusting it.
:::

::: answer
The target arrow runs from body to ECEF. You need body → NED, which is the transpose of `R_body_from_ned`, and NED → ECEF, which is the transpose of `R_ned_from_ecef`. Line up the dominoes: `R_ecef_from_body = R_ned_from_ecef.T @ R_body_from_ned.T`. The inner labels are NED and NED, so it is legal. The same thing can be written `(R_body_from_ned @ R_ned_from_ecef).T`.

Tests:

1. `R.T @ R` equals the identity to about $10^{-12}$.
2. $\det \mathbf{R} = +1$, not $-1$.
3. A known arrow lands correctly. For a vehicle sitting level on the pad with body $z$ pointing down, the body $z$ axis $\mathbf{u}^{B} = (0, 0, 1)$ should map to the ECEF direction of "down" at the pad. For a round Earth at latitude $\varphi$ ("phi") and longitude $\lambda$ ("lambda") that is $-(\cos\varphi\cos\lambda, \cos\varphi\sin\lambda, \sin\varphi)$.
:::

::: check
Why is $\det \mathbf{R} = -1$ a red flag for a matrix that is supposed to be a frame transformation, even when $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$ holds?
:::

::: answer
Orthogonality only guarantees that lengths and angles are kept. A determinant of $-1$ means the mapping includes a mirror flip: a right-handed set of axes is sent to a left-handed one. No real turning of a rigid frame can do that, so the matrix cannot be a DCM between two right-handed frames.

In practice one axis has the wrong sign — for example a "north, east, up" set typed in as if it were right-handed, when north × east points *down*. The flip silently reverses one component everywhere downstream.
:::

::: check
A colleague's code contains `v_total = v_eci + v_ned`. Both are NumPy arrays of length 3 in m/s. Name two separate things wrong with this line.
:::

::: answer
First, the **resolving axes** differ. One column is written along inertial axes and the other along north–east–down axes. Adding them number by number mixes numbers that refer to different directions.

Second, the **frames of reference** differ. `v_eci` is a velocity relative to inertial space. `v_ned`, by the usual convention, is a velocity relative to the turning Earth. Even after both are rotated onto the same axes they are different physical arrows. They differ by the velocity of the Earth-fixed frame at that point, $\boldsymbol{\omega}_E \times \mathbf{r}$, which is up to about $465\,\mathrm{m/s}$.

The fix is a rotation for the first problem, an explicit $\boldsymbol{\omega}_E \times \mathbf{r}$ term for the second, and a naming convention that makes the line look wrong at a glance.
:::

::: check
Without computing anything, explain why in $\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\mathbf{R}_{B \leftarrow A}$ the matrix nearest the vector must act first, and what goes wrong if the two factors are swapped.
:::

::: answer
The product acts on $\mathbf{r}^{A}$, a column of $A$-coordinates. Only a matrix whose arrow starts at $A$ can take it in, so $\mathbf{R}_{B \leftarrow A}$ must be the right-hand factor. It hands back $B$-coordinates, which $\mathbf{R}_{C \leftarrow B}$ then takes in.

Swapping the factors feeds $A$-coordinates into a matrix expecting $B$-coordinates. The result is still a valid rotation matrix — two rotations multiplied always give one. But it is a different rotation, because turns in three dimensions do not commute. It passes the orthogonality and determinant tests and is still wrong. That is why the known-arrow test is the one that catches it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}^{A}$ | Coordinates of the arrow $\mathbf{a}$ along the axes of frame $A$ ("a in A") |
| Three labels | Frame of reference, resolving axes, reference point |
| $\mathbf{R}_{B \leftarrow A}$, `R_b_from_a` | Coordinate transformation from $A$ to $B$; $[\mathbf{R}]_{ij} = \hat{\mathbf{b}}_i \cdot \hat{\mathbf{a}}_j$ |
| Columns / rows | Columns: $A$ axes in $B$ coordinates. Rows: $B$ axes in $A$ coordinates |
| $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$, $\det \mathbf{R} = +1$ | Orthogonal and proper; the inverse is the transpose |
| $\mathbf{R}_1, \mathbf{R}_2, \mathbf{R}_3$ | Passive elementary rotations; $+\sin\theta$ in the row of the next axis after $k$ (above the diagonal for $\mathbf{R}_1$, $\mathbf{R}_3$; below for $\mathbf{R}_2$) |
| Passive vs active | Transposes of each other; passive by $+\theta$ equals active by $-\theta$ |
| $\mathbf{R}_{C \leftarrow A} = \mathbf{R}_{C \leftarrow B}\mathbf{R}_{B \leftarrow A}$ | Chains compose with matching inner labels; the nearest matrix acts first |
| Naming | `r_eci`, `v_ecef`, `omega_body_wrt_eci_in_body`, `R_eci_from_body`; frame as a type where possible |

Next lesson: the rate of change of an arrow depends on which frame the observer is standing in. The rule that connects the two views, the **transport theorem**, is the single identity behind every equation of motion in a turning frame.

::: context star-tracker A camera that reads the sky
A star tracker is a small digital camera with a computer attached. It takes a picture of a patch of sky, finds the bright dots, and matches the pattern of their spacing against a stored catalog of a few thousand stars. Once it knows *which* stars it is looking at, it knows which way it is pointing, to within a few arcseconds (an arcsecond is $1/3600$ of a degree).

The stars are so far away that their directions are the same from anywhere in the solar system. That is why a star tracker naturally reports attitude against the inertial, star-fixed frame — not against the turning Earth.
:::

::: context hat-notation What the little hat means
A hat on a bold letter, as in $\hat{\mathbf{e}}_1$, marks a **unit vector**: an arrow whose length is exactly $1$. It carries a direction and nothing else.

You can turn any arrow into a unit vector by dividing it by its own length, $\hat{\mathbf{v}} = \mathbf{v}/|\mathbf{v}|$. Then any arrow along that direction is "a number times the hat": $5\hat{\mathbf{e}}_1$ is five units along the first axis. That is how the three numbers of a vector's coordinates become an arrow again.
:::

::: context right-hand-rule The right-hand rule
Point the fingers of your right hand along axis 1, then curl them toward axis 2. Your thumb points along axis 3. If it does, the frame is right-handed and $\hat{\mathbf{e}}_1 \times \hat{\mathbf{e}}_2 = \hat{\mathbf{e}}_3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="120" x2="280" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="290,120 278,114 278,126" fill="#1d6fd1"/>
  <text x="296" y="124" font-size="13" fill="#1f2a44">e₁</text>
  <line x1="150" y1="120" x2="150" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="150,20 144,32 156,32" fill="#1d6fd1"/>
  <text x="158" y="26" font-size="13" fill="#1f2a44">e₂</text>
  <circle cx="150" cy="120" r="10" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="150" cy="120" r="3" fill="#b4232c"/>
  <text x="100" y="148" font-size="13" fill="#b4232c">e₃ (out of page)</text>
  <path d="M 225 120 A 75 75 0 0 0 150 45" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="205" y="70" font-size="12" fill="#6c7a93">curl 1 → 2</text>
</svg>
```

With axis 1 to the right and axis 2 up the page, axis 3 points straight out of the page at you. A left-handed frame would put it into the page — a mirror image, which no turning can undo.
:::

::: context direction-cosines Why the entries are cosines
For two unit arrows, the dot product is $|\hat{\mathbf{b}}||\hat{\mathbf{a}}|\cos\gamma = \cos\gamma$, where $\gamma$ ("gamma") is the angle between them. So each entry of the matrix is the cosine of the angle between one old axis and one new axis.

That gives a quick sense check. Two axes that coincide give $\cos 0^\circ = 1$. Perpendicular axes give $\cos 90^\circ = 0$. Every entry of a rotation matrix must lie between $-1$ and $1$; a $1.3$ in your matrix means something is broken before you run a single test.
:::

::: context passive-picture Turn the axes, and the arrow seems to turn back
The red arrow stays put along the old axis $a_1$ (grey). The new axes (blue) are the old ones turned $30^\circ$ counterclockwise. Measured from the new axis $b_1$, the arrow is $30^\circ$ clockwise — so its new coordinates are $(\cos 30^\circ, -\sin 30^\circ) = (0.866, -0.500)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="110" y1="160" x2="250" y2="160" stroke="#6c7a93" stroke-width="2"/>
  <text x="256" y="164" font-size="12" fill="#6c7a93">a₁</text>
  <line x1="110" y1="160" x2="110" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <text x="96" y="28" font-size="12" fill="#6c7a93">a₂</text>
  <line x1="110" y1="160" x2="222.6" y2="95" stroke="#1d6fd1" stroke-width="2"/>
  <text x="228" y="92" font-size="12" fill="#1d6fd1">b₁</text>
  <line x1="110" y1="160" x2="45" y2="47.4" stroke="#1d6fd1" stroke-width="2"/>
  <text x="30" y="42" font-size="12" fill="#1d6fd1">b₂</text>
  <line x1="110" y1="160" x2="210" y2="160" stroke="#b4232c" stroke-width="4"/>
  <polygon points="220,160 208,154 208,166" fill="#b4232c"/>
  <text x="160" y="180" font-size="12" fill="#b4232c">r (fixed)</text>
  <path d="M 180 160 A 70 70 0 0 0 170.6 125" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="186" y="142" font-size="12" fill="#1f2a44">30°</text>
  <text x="250" y="40" font-size="12" fill="#1f2a44">r in B:</text>
  <text x="250" y="58" font-size="12" fill="#1f2a44">(0.866, −0.500)</text>
</svg>
```
:::

::: context domino-chain A chain of frames, end to end
Each matrix is a bridge from one frame to the next, and the labels must touch. Written right to left, the frames a star tracker's measurement might pass through on its way to the ground look like this:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="8" y="30" width="60" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="38" y="50">sensor</text>
    <rect x="102" y="30" width="60" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="132" y="50">body</text>
    <rect x="196" y="30" width="60" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="226" y="50">ECI</text>
    <rect x="290" y="30" width="60" height="30" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="320" y="50">ECEF</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="68" y1="45" x2="96" y2="45"/><line x1="162" y1="45" x2="190" y2="45"/><line x1="256" y1="45" x2="284" y2="45"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="102,45 92,40 92,50"/><polygon points="196,45 186,40 186,50"/><polygon points="290,45 280,40 280,50"/>
  </g>
  <text x="180" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">R_ecef_from_eci @ R_eci_from_body @ R_body_from_sensor</text>
</svg>
```

Read the code line from right to left and every "from" meets the frame the previous step produced. Change the order and two labels that do not match end up side by side.
:::

::: context book-experiment Try it with a book
Put a book flat on the table, cover up, spine toward you. Turn it $90^\circ$ about the line pointing away from you, then $90^\circ$ about the vertical. Note where the spine ends up. Now start again and do the same two turns in the opposite order. The spine ends up somewhere else.

Turns in a flat plane do commute — two turns of a dial add up either way — which is why the shortcut in the second example worked: both turns there were about the same axis.
:::

::: context earth-surface-speed Where 465 m/s comes from
The ground at the equator goes once around the Earth's axis every sidereal day. The Earth turns at $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$, and the equatorial radius is $6\,378\,137\,\mathrm{m}$. Speed is turning rate times distance from the axis:

$$
7.292115 \times 10^{-5} \times 6\,378\,137 \approx 465.1\,\mathrm{m/s}.
$$

Away from the equator you are closer to the axis, so the speed shrinks with the cosine of latitude. At Cape Canaveral it is about $409\,\mathrm{m/s}$. Lesson 3 uses exactly this number to work out how much the Earth helps a rocket reach orbit.
:::

::: context strapdown Strapdown: sensors bolted to the body
Early inertial systems, like the ones on Apollo, kept their gyros and accelerometers on a platform held steady by gimbals while the vehicle turned around it. Modern systems are **strapdown**: the sensors are bolted straight to the vehicle and turn with it. Software does the work the gimbals used to do.

So a strapdown gyro set measures the body's turning rate relative to inertial space, written along the body's own axes — $\boldsymbol{\omega}_{B/I}^{B}$. Getting everything else right depends on keeping those two labels straight.
:::

::: context types-that-catch Let the compiler do the checking
In C++ a vector type can carry its frame as a template parameter, `Vector3<Frame::ECI>`. Addition is only defined for two vectors with the same parameter, so mixing frames is a compile error rather than a flight anomaly. Rust and Ada flight code do the same with distinct types.

It is the same idea as keeping units straight. NASA's Mars Climate Orbiter was lost in 1999 because one team's software produced numbers in pound-force seconds and another's read them as newton-seconds. The numbers were the right shape and a believable size — and wrong. A frame label is a unit for direction.
:::
