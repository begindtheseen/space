---
id: l07-change-of-basis-between-frames
title: Change of basis between reference frames
minutes: 21
covers:
  - change of basis between reference frames
---

The first lesson of this module made a promise: a vector is a physical arrow, its components are numbers that depend on the frame you chose, and two lessons would be spent on converting the numbers from one frame to another. This is the first of those lessons. It builds the matrix that performs the conversion, shows that it is an orthogonal matrix with determinant $+1$ — a rotation — and sets down the notation that the rest of the curriculum uses for frames, so that a product of three rotation matrices can be checked for correctness by reading its subscripts.

A vehicle carries many frames. An Earth-centred inertial frame for the equations of motion; an Earth-fixed frame for GNSS and ground stations; a body frame fixed to the structure; a frame for each sensor, mounted at some angle to the body; an orbit-local frame for pointing. Every measurement arrives in one of these and every command leaves in another, so a flight computer is constantly changing basis. Most attitude bugs are frame bugs: the right matrix in the wrong order, or the matrix for "body from inertial" used where "inertial from body" was needed. Both mistakes produce a valid rotation matrix and neither produces an error message. The defence is notation that makes the mistake visible on the page.

The lesson also gives the elementary rotations about the three axes and assembles them into the yaw–pitch–roll sequence that this module's rotation-matrix exercise asks you to build and audit.

## Frames, axes and components

A **reference frame** is an origin together with three mutually perpendicular unit vectors $\hat{\mathbf{a}}_1, \hat{\mathbf{a}}_2, \hat{\mathbf{a}}_3$ arranged right-handed, so that $\hat{\mathbf{a}}_1 \times \hat{\mathbf{a}}_2 = \hat{\mathbf{a}}_3$ in the sense of the right-hand rule — the cross product itself is defined properly in the next lesson, and for this one it is enough that the triad has the handedness of $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$. Call the frame $A$. Its axes are an orthonormal basis of $\mathbb{R}^3$, so by the previous lesson any vector $\mathbf{r}$ has coordinates in that basis given by dot products:

$$
\mathbf{r} = r^A_1\,\hat{\mathbf{a}}_1 + r^A_2\,\hat{\mathbf{a}}_2 + r^A_3\,\hat{\mathbf{a}}_3, \qquad r^A_i = \hat{\mathbf{a}}_i\cdot\mathbf{r} .
$$

The column of these three numbers is written $\mathbf{r}^A$, and the superscript names the frame in which the components are **resolved**. The same arrow resolved in a second frame $B$ with axes $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$ is $\mathbf{r}^B$, a different column of numbers. In code the frame travels in the variable name: `r_eci`, `v_body`, `omega_body`. A vector whose frame you cannot name is a vector you do not yet understand.

## Change of basis in general

Before the orthonormal case, the general one. Let $\mathbf{p}_1, \dots, \mathbf{p}_n$ be any basis of $\mathbb{R}^n$, written in standard coordinates, and place them as the columns of a matrix $\mathbf{P}$. A vector with coordinates $\mathbf{c}$ in the new basis is $\mathbf{x} = \sum_j c_j\,\mathbf{p}_j = \mathbf{P}\mathbf{c}$. So

$$
\mathbf{x} = \mathbf{P}\mathbf{c}, \qquad \mathbf{c} = \mathbf{P}^{-1}\mathbf{x} .
$$

$\mathbf{P}$ converts new coordinates to standard ones by forming the linear combination; $\mathbf{P}^{-1}$ converts back, and it exists because a basis is independent. Finding coordinates in a general basis is solving a linear system. For the basis $\mathbf{p}_1 = (2, 1)^T$, $\mathbf{p}_2 = (1, 3)^T$ and the vector $\mathbf{x} = (4, 7)^T$, the two-by-two inverse formula gives $\mathbf{P}^{-1} = \tfrac{1}{5}\begin{pmatrix} 3 & -1 \\ -1 & 2 \end{pmatrix}$ and $\mathbf{c} = \tfrac{1}{5}(12 - 7,\ -4 + 14)^T = (1, 2)^T$. Check: $1\,(2, 1)^T + 2\,(1, 3)^T = (4, 7)^T$.

If the matrix of some linear map is $\mathbf{M}$ in standard coordinates, the same map written in the new coordinates is $\mathbf{P}^{-1}\mathbf{M}\mathbf{P}$: convert new coordinates to standard, apply the map, convert back. Matrices related this way are **similar**, and they describe one machine seen from two bases. The determinant lesson showed $\det(\mathbf{P}^{-1}\mathbf{M}\mathbf{P}) = \det\mathbf{M}$, so the volume factor is a property of the machine, not of the basis. Eigenvalues, in Linear Algebra II, are the same kind of invariant.

A reference frame is the special case in which the basis is orthonormal. Then $\mathbf{P}^T\mathbf{P} = \mathbf{I}$, so $\mathbf{P}^{-1} = \mathbf{P}^T$, and coordinates cost three dot products instead of a solve. That is the whole practical reason frames are built from perpendicular unit axes.

## The direction cosine matrix

Now take two frames $A$ and $B$ sharing an origin, and one vector $\mathbf{r}$ with components $\mathbf{r}^A$ and $\mathbf{r}^B$. To relate them, write $\mathbf{r}$ in terms of the $B$ axes and take components along the $A$ axes:

$$
r^A_i = \hat{\mathbf{a}}_i\cdot\mathbf{r} = \hat{\mathbf{a}}_i\cdot\Big(\sum_{j} r^B_j\,\hat{\mathbf{b}}_j\Big) = \sum_j \big(\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j\big)\,r^B_j .
$$

This is a matrix–vector product. Define the $3 \times 3$ matrix $\mathbf{R}_A^B$ with entries

$$
\big(\mathbf{R}_A^B\big)_{ij} = \hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j = \cos\big(\text{angle between } \hat{\mathbf{a}}_i \text{ and } \hat{\mathbf{b}}_j\big),
$$

and then

$$
\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B .
$$

Because its entries are cosines of the angles between the axes of the two frames, $\mathbf{R}_A^B$ is called the **direction cosine matrix**, or DCM. It is also called the rotation matrix from $B$ to $A$, and the change-of-basis matrix, and the attitude matrix; they are all the same object.

### Reading the notation

The notation is chosen so that the algebra checks itself. In $\mathbf{R}_A^B$, the **superscript is the frame the components come from** and the **subscript is the frame they go to**: read it as "$A$ from $B$". The equation $\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B$ has the superscript $B$ of the matrix meeting the superscript $B$ of the vector it multiplies, and the subscript $A$ matching the result. Later modules write the identical matrix with an arrow, $\mathbf{R}_{A \leftarrow B}$, and in code it is `R_AB` or, better, `R_a_from_b`, so that `r_a = R_a_from_b @ r_b` reads as a sentence. The module's exercise calls the body-to-inertial matrix `R_IB`; that is $\mathbf{R}_I^B$, inertial from body.

### Columns and rows have meanings

Column $j$ of $\mathbf{R}_A^B$ has entries $\hat{\mathbf{a}}_1\cdot\hat{\mathbf{b}}_j$, $\hat{\mathbf{a}}_2\cdot\hat{\mathbf{b}}_j$, $\hat{\mathbf{a}}_3\cdot\hat{\mathbf{b}}_j$ — the components of $\hat{\mathbf{b}}_j$ resolved in $A$. Row $i$ has entries $\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$ for $j = 1, 2, 3$ — the components of $\hat{\mathbf{a}}_i$ resolved in $B$. So:

> The columns of $\mathbf{R}_A^B$ are the $B$ axes written in $A$ coordinates. The rows are the $A$ axes written in $B$ coordinates.

This is the practical recipe. If you know where a sensor's three axes point in the body frame, those three unit vectors, written as columns, *are* $\mathbf{R}_B^S$. No angles, no trigonometry. It is also the previous lesson's rule that the matrix of a linear map has the images of the basis vectors as its columns: $\mathbf{R}_A^B$ sends $\mathbf{e}_j$ — which is $\hat{\mathbf{b}}_j$ resolved in $B$ — to $\hat{\mathbf{b}}_j$ resolved in $A$.

### Orthogonality and determinant

The columns of $\mathbf{R}_A^B$ are the $B$ axes resolved in $A$. Those axes are mutually perpendicular unit vectors, and dot products do not depend on the frame they are computed in, so the columns are orthonormal:

$$
\big(\mathbf{R}_A^B\big)^T\mathbf{R}_A^B = \mathbf{I} .
$$

Entry $(i, j)$ of the left side is column $i$ dotted with column $j$, which is $\hat{\mathbf{b}}_i\cdot\hat{\mathbf{b}}_j = \delta_{ij}$. Hence the inverse is the transpose, and the inverse must be the matrix converting the other way:

$$
\mathbf{R}_B^A = \big(\mathbf{R}_A^B\big)^{-1} = \big(\mathbf{R}_A^B\big)^T .
$$

Swapping the labels transposes the matrix. This agrees with the row reading: the rows of $\mathbf{R}_A^B$ are the $A$ axes in $B$ coordinates, which are exactly the columns of $\mathbf{R}_B^A$.

From the determinant lesson, orthonormal columns give $\det = \pm 1$. Both frames are right-handed, and the determinant of $[\hat{\mathbf{b}}_1\ \hat{\mathbf{b}}_2\ \hat{\mathbf{b}}_3]$ is the signed volume of the unit cube they span, which is $+1$ for a right-handed triad and $-1$ for a left-handed one. So

$$
\det\mathbf{R}_A^B = +1 .
$$

The two properties together — $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ and $\det\mathbf{R} = +1$ — define the **special orthogonal group** $SO(3)$, the set of all proper rotations in three dimensions. Every change of basis between right-handed frames is an element of $SO(3)$, and every element of $SO(3)$ is a change of basis between some pair of right-handed frames. A matrix that passes the first test but has $\det = -1$ is a reflection: a left-handed frame, or one axis defined with the wrong sign, has crept in.

::: key Properties of a rotation matrix
$\mathbf{R} \in SO(3)$ satisfies $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ (orthonormal columns) and $\det\mathbf{R} = +1$ (no reflection). Together they give $\mathbf{R}^{-1} = \mathbf{R}^T$. For frames, $\mathbf{R}_B^A = (\mathbf{R}_A^B)^T$: swap the labels, transpose the matrix. Lengths and angles are the same in every frame.
:::

### Chaining frames

Three frames $A$, $B$, $C$. Given $\mathbf{R}_B^A$ and $\mathbf{R}_C^B$, convert a vector from $A$ to $C$ in two steps:

$$
\mathbf{r}^C = \mathbf{R}_C^B\,\mathbf{r}^B = \mathbf{R}_C^B\,\big(\mathbf{R}_B^A\,\mathbf{r}^A\big) = \big(\mathbf{R}_C^B\,\mathbf{R}_B^A\big)\,\mathbf{r}^A ,
$$

so

$$
\mathbf{R}_C^A = \mathbf{R}_C^B\,\mathbf{R}_B^A .
$$

The inner labels — the subscript of the right factor and the superscript of the left — are the same frame $B$, and they cancel, leaving $C$ from $A$. This is multiplication as composition from the second lesson, read right to left in the direction the vector travels: first $A$ to $B$, then $B$ to $C$. **Before you multiply two rotation matrices, check that the inner labels match.** If they do not, one of the factors needs transposing, and the notation tells you which. The reverse product $\mathbf{R}_B^A\,\mathbf{R}_C^B$ has mismatched inner labels ($A$ against $C$); it is a perfectly good rotation matrix, and it is meaningless.

::: key Chaining rotations
$\mathbf{R}_C^A = \mathbf{R}_C^B\,\mathbf{R}_B^A$: adjacent labels cancel. Read right to left, and check that the inner labels match before you multiply. In code, `R_c_from_a = R_c_from_b @ R_b_from_a`.
:::

## Elementary rotations

The simplest change of basis turns one frame into another about a shared axis. Let frame $B$ be obtained from frame $A$ by rotating $A$ through an angle $\theta$ about $\hat{\mathbf{a}}_3$, positive by the right-hand rule (thumb along $\hat{\mathbf{a}}_3$, fingers curling in the direction of the turn). Then $\hat{\mathbf{b}}_3 = \hat{\mathbf{a}}_3$, and in the plane of the other two axes the rotation-in-the-plane picture of the second lesson applies:

$$
\hat{\mathbf{b}}_1 = \cos\theta\,\hat{\mathbf{a}}_1 + \sin\theta\,\hat{\mathbf{a}}_2, \qquad \hat{\mathbf{b}}_2 = -\sin\theta\,\hat{\mathbf{a}}_1 + \cos\theta\,\hat{\mathbf{a}}_2 .
$$

The columns of $\mathbf{R}_A^B$ are the $B$ axes in $A$ coordinates, so

$$
\mathbf{R}_A^B = \mathbf{R}_3(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{pmatrix}.
$$

The same construction about the other two axes gives

$$
\mathbf{R}_1(\theta) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta \\ 0 & \sin\theta & \cos\theta \end{pmatrix}, \qquad
\mathbf{R}_2(\theta) = \begin{pmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{pmatrix}.
$$

In each, the axis of rotation has a row and column of the identity, and the remaining $2 \times 2$ block is a plane rotation. $\mathbf{R}_2$ looks different only because the cyclic order of axes $(3, 1)$ puts its off-diagonal sines in the other corners; check that column 1 of $\mathbf{R}_2(\theta)$, which is $\hat{\mathbf{b}}_1$ in $A$ coordinates, is $(\cos\theta, 0, -\sin\theta)^T$: tilting the frame nose-up about the 2-axis by $\theta$ points the new 1-axis up, toward negative 3 when 3 points down, as it does in aircraft body axes.

Each $\mathbf{R}_k(\theta)$ is "original frame from rotated frame": it takes components in the frame that was turned through $+\theta$ and returns components in the frame it was turned from. Equivalently, since the columns of $\mathbf{R}_3(\theta)$ are the images of $\hat{\mathbf{a}}_1, \hat{\mathbf{a}}_2, \hat{\mathbf{a}}_3$ under the turn, $\mathbf{R}_k(\theta)$ is also the matrix that actively rotates a vector by $+\theta$ about axis $k$. The transpose $\mathbf{R}_k(\theta)^T = \mathbf{R}_k(-\theta)$ is "rotated frame from original frame". For $\theta = 30°$, $\mathbf{R}_3(30°)$ sends the vector $(1, 0, 0)^T$ — the rotated frame's 1-axis, in its own coordinates — to $(0.8660, 0.5, 0)^T$, the same axis seen from the original frame.

::: warning Passive or active, and whose convention
Some texts and libraries — including the rotating-frames module later in this curriculum — define the elementary matrices as the transpose of the ones here, so that $\mathbf{R}_3(\theta)$ means "rotated frame from original frame" and has $+\sin\theta$ above the diagonal. Neither convention is wrong; mixing them is. Never trust the name of an argument. Push a vector you can picture — a frame axis — through the matrix and check that it lands where geometry says it must. The rule that the columns of $\mathbf{R}_A^B$ are the $B$ axes in $A$ coordinates is convention-free and settles every such question.
:::

## Euler sequences: yaw, pitch, roll

A general attitude is built from three elementary rotations in sequence. The **3-2-1 sequence** used for aircraft and launch vehicles starts from the inertial (or local-level) frame $I$ and applies yaw, pitch and roll in turn, each about an axis of the frame produced by the previous step:

1. Yaw $\psi$ about $\hat{\mathbf{i}}_3$ produces an intermediate frame $F_1$: $\mathbf{R}_I^{F_1} = \mathbf{R}_3(\psi)$.
2. Pitch $\theta$ about the *new* 2-axis $\hat{\mathbf{f}}_{1,2}$ produces $F_2$: $\mathbf{R}_{F_1}^{F_2} = \mathbf{R}_2(\theta)$.
3. Roll $\phi$ about the *new* 1-axis produces the body frame $B$: $\mathbf{R}_{F_2}^{B} = \mathbf{R}_1(\phi)$.

Chain them with the cancellation rule:

$$
\mathbf{R}_I^B = \mathbf{R}_I^{F_1}\,\mathbf{R}_{F_1}^{F_2}\,\mathbf{R}_{F_2}^{B} = \mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_1(\phi) .
$$

Each elementary matrix is "previous frame from next frame", each step rotates about an axis of the frame it starts from, and the inner labels cancel in order. This is the `R3(yaw) @ R2(pitch) @ R1(roll)` of the exercise, and it converts body components to inertial components: $\mathbf{r}^I = \mathbf{R}_I^B\,\mathbf{r}^B$. Its transpose, $\mathbf{R}_B^I = \mathbf{R}_1(-\phi)\,\mathbf{R}_2(-\theta)\,\mathbf{R}_3(-\psi)$, converts the other way.

The order is not negotiable. Rotations in three dimensions do not commute: $\mathbf{R}_3(30°)\,\mathbf{R}_2(10°)$ has first column $(0.8529, 0.4924, -0.1736)^T$ while $\mathbf{R}_2(10°)\,\mathbf{R}_3(30°)$ has first column $(0.8529, 0.5, -0.1504)^T$ — both unit vectors, both plausible, pointing $1.4°$ apart. A yaw followed by a pitch is a different attitude from a pitch followed by a yaw, and the notation is what keeps the sequence straight.

::: example Building and reading a body-to-inertial matrix
A vehicle has yaw $\psi = 30°$, pitch $\theta = 10°$ and roll $\phi = 5°$ in a 3-2-1 sequence. With $\cos 30° = 0.8660$, $\sin 30° = 0.5$, $\cos 10° = 0.9848$, $\sin 10° = 0.1736$, $\cos 5° = 0.9962$ and $\sin 5° = 0.0872$, first form $\mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)$:

$$
\begin{pmatrix} 0.8660 & -0.5 & 0 \\ 0.5 & 0.8660 & 0 \\ 0 & 0 & 1 \end{pmatrix}\begin{pmatrix} 0.9848 & 0 & 0.1736 \\ 0 & 1 & 0 \\ -0.1736 & 0 & 0.9848 \end{pmatrix} = \begin{pmatrix} 0.8529 & -0.5 & 0.1504 \\ 0.4924 & 0.8660 & 0.0868 \\ -0.1736 & 0 & 0.9848 \end{pmatrix},
$$

then multiply by $\mathbf{R}_1(\phi)$ on the right, which leaves column 1 alone and mixes columns 2 and 3:

$$
\mathbf{R}_I^B = \begin{pmatrix} 0.8529 & -0.4850 & 0.1934 \\ 0.4924 & 0.8703 & 0.0110 \\ -0.1736 & 0.0858 & 0.9811 \end{pmatrix}.
$$

**Read the columns.** Column 1 is the body 1-axis — the nose — in inertial coordinates: $(0.8529, 0.4924, -0.1736)^T$, which is $(\cos\theta\cos\psi,\ \cos\theta\sin\psi,\ -\sin\theta)^T$: yawed $30°$ round, pitched $10°$ up (negative 3 is up here). Column 3 is the body 3-axis, tilted from inertial 3 by the roll and pitch.

**Audit.** The column norms are $\sqrt{0.8529^2 + 0.4924^2 + 0.1736^2} = 1.000$ and likewise for the others; the dot product of columns 1 and 2 is $-0.4137 + 0.4285 - 0.0149 = 0.000$ to the precision shown; and the determinant by cofactors is $1.000$. So $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ and $\det\mathbf{R} = +1$.

**Use it.** A point $100\ \mathrm{m}$ ahead along the nose has $\mathbf{r}^B = (100, 0, 0)^T$ m and $\mathbf{r}^I = \mathbf{R}_I^B\,\mathbf{r}^B = 100 \times \text{column 1} = (85.3, 49.2, -17.4)^T$ m. Going the other way, the gravity vector $\mathbf{g}^I = (0, 0, -9.80665)^T\ \mathrm{m/s^2}$ in the body frame is $\mathbf{g}^B = (\mathbf{R}_I^B)^T\mathbf{g}^I = -9.80665 \times \text{row 3}$ of $\mathbf{R}_I^B$, that is $(1.703, -0.842, -9.621)^T\ \mathrm{m/s^2}$. Its norm is still $9.807\ \mathrm{m/s^2}$: a change of frame never changes a magnitude.
:::

::: example A frame chain, and what the wrong order costs
A star tracker $S$ is mounted with its boresight $\hat{\mathbf{s}}_1$ along the body 2-axis, and the sensor frame is the body frame turned $90°$ about the body 3-axis. So $\mathbf{R}_B^S = \mathbf{R}_3(90°)$, whose first column $(0, 1, 0)^T$ is indeed $\hat{\mathbf{s}}_1$ in body coordinates. Where does the boresight point in inertial space, with $\mathbf{R}_I^B$ from the previous example?

Inner labels must match: $\mathbf{R}_I^S = \mathbf{R}_I^B\,\mathbf{R}_B^S$. The boresight in inertial coordinates is column 1 of that product, which is $\mathbf{R}_I^B$ times $(0, 1, 0)^T$ — column 2 of $\mathbf{R}_I^B$:

$$
\hat{\mathbf{s}}_1^{\,I} = (-0.4850, 0.8703, 0.0858)^T .
$$

Reversing the order, $\mathbf{R}_B^S\,\mathbf{R}_I^B$, is also a rotation matrix. Its first column is $\mathbf{R}_3(90°)$ applied to column 1 of $\mathbf{R}_I^B$, which is $(-0.4924, 0.8529, -0.1736)^T$ — a unit vector, superficially similar, and $14.9°$ away from the correct answer. A star tracker's field of view is a few degrees across. The wrong product would identify no stars, and nothing in the arithmetic would say why.
:::

::: example Auditing a corrupted rotation matrix
Take $\mathbf{R}_I^B$ from the first example and scale its first column by $1.001$, mimicking a slow loss of normalisation in an attitude integrator. Entry $(1, 1)$ of $\mathbf{R}^T\mathbf{R}$ is the squared norm of the first column, now $1.001^2 = 1.002$, so $\|\mathbf{R}^T\mathbf{R} - \mathbf{I}\|_\infty = 0.002$. The determinant, linear in each column, becomes $1.001$. An audit with tolerance $10^{-9}$ on both tests rejects the matrix at once, while a naive code that used it would rotate every vector with a $0.1\%$ length error along one axis — small enough to survive for hours and large enough to matter at the end of a burn. Re-orthonormalising a drifted matrix is exactly Gram–Schmidt on its columns.
:::

::: warning The single most common frame bug
Using $\mathbf{R}_B^I$ where $\mathbf{R}_I^B$ is needed. The two differ by a transpose, both are valid rotations, and for small angles they differ by so little that a simulation can look right. Name every matrix by both its frames, in code as well as on paper, and make the frame of every vector part of its name. Then `R_i_from_b @ r_b` reads correctly and `R_b_from_i @ r_b` is visibly wrong.
:::

```python
import numpy as np

def R1(t): c, s = np.cos(t), np.sin(t); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def R2(t): c, s = np.cos(t), np.sin(t); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def R3(t): c, s = np.cos(t), np.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

yaw, pitch, roll = np.radians([30.0, 10.0, 5.0])
R_i_from_b = R3(yaw) @ R2(pitch) @ R1(roll)
print(R_i_from_b[:, 0])                       # [ 0.8529  0.4924 -0.1736]  body x-axis in I
print(np.allclose(R_i_from_b.T @ R_i_from_b, np.eye(3)), np.linalg.det(R_i_from_b))  # True 1.0
```

## Check yourself

::: check
A sensor frame $S$ has axes, in body coordinates, $\hat{\mathbf{s}}_1 = (0, 0, 1)^T$, $\hat{\mathbf{s}}_2 = (1, 0, 0)^T$, $\hat{\mathbf{s}}_3 = (0, 1, 0)^T$. Write $\mathbf{R}_B^S$ and $\mathbf{R}_S^B$, and check the handedness.
:::

::: answer
The columns of $\mathbf{R}_B^S$ are the $S$ axes in $B$ coordinates: $\mathbf{R}_B^S = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ 1 & 0 & 0 \end{pmatrix}$. Then $\mathbf{R}_S^B$ is its transpose, $\begin{pmatrix} 0 & 0 & 1 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{pmatrix}$. The determinant by cofactors is $0 - 1\,(0 \cdot 0 - 1 \cdot 1) + 0 = +1$, so the sensor triad is right-handed and the matrix is a proper rotation (it is a cyclic relabelling of the axes).
:::

::: check
You are given $\mathbf{R}_B^I$ and $\mathbf{R}_S^B$ and need $\mathbf{R}_I^S$. Write it using only transposes and products.
:::

::: answer
$\mathbf{R}_I^S = \mathbf{R}_I^B\,\mathbf{R}_B^S$ by cancellation, and each factor is the transpose of what you have: $\mathbf{R}_I^S = (\mathbf{R}_B^I)^T(\mathbf{R}_S^B)^T = (\mathbf{R}_S^B\,\mathbf{R}_B^I)^T$. The last form uses the transpose-of-a-product rule and reads: $\mathbf{R}_S^I = \mathbf{R}_S^B\,\mathbf{R}_B^I$ chains correctly, and $\mathbf{R}_I^S$ is its transpose.
:::

::: check
Frame $B$ is obtained from $A$ by turning $A$ through $+90°$ about their shared 1-axis. A vector has $\mathbf{r}^B = (0, 1, 0)^T$. Find $\mathbf{r}^A$ and confirm it geometrically.
:::

::: answer
$\mathbf{R}_A^B = \mathbf{R}_1(90°) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 0 & -1 \\ 0 & 1 & 0 \end{pmatrix}$, and $\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B$ is column 2, $(0, 0, 1)^T$. Geometry: turning the 2-axis through $+90°$ about the 1-axis (right-hand rule) carries it onto the old 3-axis, so $\hat{\mathbf{b}}_2 = \hat{\mathbf{a}}_3$. The vector lies along $\hat{\mathbf{b}}_2$, hence along $\hat{\mathbf{a}}_3$, and its $A$ components are $(0, 0, 1)^T$. Matrix and picture agree.
:::

::: check
A matrix that is supposed to be $\mathbf{R}_I^B$ passes $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ to $10^{-15}$ but has $\det\mathbf{R} = -1$. What has happened, and what will it do to a vector?
:::

::: answer
The columns are orthonormal but the triad they form is left-handed: one axis has the wrong sign, or two axes were swapped, or the sensor frame was defined left-handed. The matrix is a reflection composed with a rotation. It will preserve every length and every angle between vectors but reverse handedness, so a cross product computed in one frame and rotated will disagree in sign with the cross product computed in the other — angular momentum and torque will come out backwards.
:::

::: check
Explain, using the column reading of the DCM, why $\mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)$ has first column $(\cos\theta\cos\psi,\ \cos\theta\sin\psi,\ -\sin\theta)^T$.
:::

::: answer
The first column of a product $\mathbf{M}\mathbf{N}$ is $\mathbf{M}$ times the first column of $\mathbf{N}$. The first column of $\mathbf{R}_2(\theta)$ is $(\cos\theta, 0, -\sin\theta)^T$: the pitched 1-axis in the yawed frame. Applying $\mathbf{R}_3(\psi)$ rotates its in-plane part $(\cos\theta, 0)$ through $\psi$ to $(\cos\theta\cos\psi, \cos\theta\sin\psi)$ and leaves the third component alone, giving $(\cos\theta\cos\psi,\ \cos\theta\sin\psi,\ -\sin\theta)^T$. Physically this is the nose direction after yawing by $\psi$ and pitching up by $\theta$, resolved in the original frame; roll about the nose cannot change it, which is why $\mathbf{R}_1(\phi)$ on the right leaves column 1 untouched.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{r}^A$, $r^A_i = \hat{\mathbf{a}}_i\cdot\mathbf{r}$ | Components of $\mathbf{r}$ resolved in frame $A$ |
| $\mathbf{x} = \mathbf{P}\mathbf{c}$, $\mathbf{c} = \mathbf{P}^{-1}\mathbf{x}$ | General change of basis; $\mathbf{P}$ has the new basis as columns |
| $\mathbf{P}^{-1}\mathbf{M}\mathbf{P}$ | The same map in the new basis (similar matrices) |
| $\mathbf{R}_A^B$, $(\mathbf{R}_A^B)_{ij} = \hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$ | Direction cosine matrix, "$A$ from $B$"; $\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B$ |
| Columns of $\mathbf{R}_A^B$ | The $B$ axes in $A$ coordinates; rows are the $A$ axes in $B$ coordinates |
| $\mathbf{R}^T\mathbf{R} = \mathbf{I}$, $\det\mathbf{R} = +1$ | Defining properties of $SO(3)$; hence $\mathbf{R}^{-1} = \mathbf{R}^T$ |
| $\mathbf{R}_B^A = (\mathbf{R}_A^B)^T$ | Swap labels, transpose |
| $\mathbf{R}_C^A = \mathbf{R}_C^B\,\mathbf{R}_B^A$ | Chain: inner labels cancel; read right to left |
| $\mathbf{R}_1, \mathbf{R}_2, \mathbf{R}_3$ | Elementary rotations; "original frame from rotated frame" |
| $\mathbf{R}_I^B = \mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_1(\phi)$ | 3-2-1 yaw–pitch–roll, body to inertial |
| $\mathbf{R}_{A \leftarrow B}$, `R_a_from_b` | The same matrix in later modules and in code |

A rotation matrix that changes with time — a body frame turning at angular velocity $\boldsymbol{\omega}$ — has a derivative, and that derivative is the rotation matrix times a skew-symmetric matrix built from $\boldsymbol{\omega}$. The final lesson of this module constructs that matrix from the cross product and shows why it is the foundation of attitude kinematics.
