---
id: l07-change-of-basis-between-frames
title: Change of basis between reference frames
minutes: 24
covers:
  - change of basis between reference frames
---

Ask two friends where the bakery is. One says "two blocks ahead and one to the left". The other, facing the opposite way, says "two blocks behind and one to the right". Both are describing the same bakery. Their numbers differ because they are standing in different directions. Nothing about the bakery changed.

A vector works the same way. Lesson 1 made a promise: a vector is a physical arrow, its **components** are numbers that depend on the frame you measure them in, and later lessons would show how to convert those numbers from one frame to another. This lesson keeps that promise. It builds the matrix that does the conversion. It shows that this matrix is always a rotation — an orthogonal matrix with determinant $+1$. And it sets down a notation that lets you catch a wrong product of three rotation matrices by reading its labels, before you run a single line of code.

A vehicle carries many frames at once. There is an Earth-centered inertial frame for the equations of motion, an Earth-fixed frame for GPS and ground stations, a body frame bolted to the structure, a frame for each sensor, and an orbit frame for pointing. Every measurement arrives in one frame and every command leaves in another, so a flight computer changes frames all the time. Most attitude bugs are frame bugs: the right matrix in the wrong order, or "body from inertial" used where "inertial from body" was needed. Both mistakes produce a perfectly valid rotation matrix, and neither produces an error message. Your defense is notation that makes the mistake visible on the page.

## Frames, axes and components

Picture the corner of a room: two walls and the floor meet at a point, and three edges run out from it at right angles. That corner is a frame.

A **[[reference frame|frame-word]]** — a set of axes you measure against — is an origin plus three unit vectors at right angles, $\hat{\mathbf{a}}_1, \hat{\mathbf{a}}_2, \hat{\mathbf{a}}_3$ (read "a-hat one, two, three"). They are arranged **[[right-handed|right-handed-triad]]**: turning $\hat{\mathbf{a}}_1$ toward $\hat{\mathbf{a}}_2$ makes $\hat{\mathbf{a}}_3$ point the way your right thumb points when your fingers curl in that turn. Written with the cross product of Lesson 8, that is $\hat{\mathbf{a}}_1 \times \hat{\mathbf{a}}_2 = \hat{\mathbf{a}}_3$. For now, all you need is that the three axes have the same handedness as $\hat{\mathbf{x}}, \hat{\mathbf{y}}, \hat{\mathbf{z}}$.

Call this frame $A$. Its axes are an orthonormal basis of $\mathbb{R}^3$, so by Lesson 6 any vector $\mathbf{r}$ is built from them, and each coordinate is one dot product:

$$
\mathbf{r} = r^A_1\,\hat{\mathbf{a}}_1 + r^A_2\,\hat{\mathbf{a}}_2 + r^A_3\,\hat{\mathbf{a}}_3, \qquad r^A_i = \hat{\mathbf{a}}_i\cdot\mathbf{r} .
$$

The column of these three numbers is written $\mathbf{r}^A$, read "r in A". The superscript names the frame the components are **resolved** in — measured along. The same arrow resolved in a second frame $B$, with axes $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$, is $\mathbf{r}^B$: a different column of numbers for the same arrow.

In code the frame travels in the variable name: `r_eci`, `v_body`, `omega_body`. A vector whose frame you cannot name is a vector you do not yet understand.

## Change of basis in general

Before frames, take the general case, where the new axes need not be perpendicular or unit length. Think of a city whose streets run at a slant. "Three blocks along Main, two along Oak" is a perfectly good address, even though Main and Oak do not meet at right angles.

Let $\mathbf{p}_1, \dots, \mathbf{p}_n$ be any basis of $\mathbb{R}^n$, written in ordinary coordinates, and put them side by side as the columns of a matrix $\mathbf{P}$. A vector whose coordinates in the new basis are $\mathbf{c}$ — "$c_1$ of the first street, $c_2$ of the second" — is the linear combination $\mathbf{x} = \sum_j c_j\,\mathbf{p}_j$. By the column picture of Lesson 2 that is $\mathbf{P}\mathbf{c}$. So

$$
\mathbf{x} = \mathbf{P}\mathbf{c}, \qquad \mathbf{c} = \mathbf{P}^{-1}\mathbf{x} .
$$

$\mathbf{P}$ converts new coordinates to ordinary ones by forming the combination. $\mathbf{P}^{-1}$ converts back. It exists because the columns of a basis are independent. So finding coordinates in a general basis means solving a linear system.

Take the basis $\mathbf{p}_1 = (2, 1)^T$, $\mathbf{p}_2 = (1, 3)^T$ and the vector $\mathbf{x} = (4, 7)^T$. The two-by-two inverse formula of Lesson 2 gives $\det\mathbf{P} = 2 \cdot 3 - 1 \cdot 1 = 5$ and

$$
\mathbf{P}^{-1} = \tfrac{1}{5}\begin{pmatrix} 3 & -1 \\ -1 & 2 \end{pmatrix}, \qquad \mathbf{c} = \tfrac{1}{5}\begin{pmatrix} 3 \cdot 4 - 1 \cdot 7 \\ -1 \cdot 4 + 2 \cdot 7 \end{pmatrix} = \tfrac{1}{5}\begin{pmatrix} 5 \\ 10 \end{pmatrix} = \begin{pmatrix} 1 \\ 2 \end{pmatrix}.
$$

Check by rebuilding: $1\,(2, 1)^T + 2\,(1, 3)^T = (4, 7)^T$. One of the first street, two of the second.

Matrices change basis too. If a linear map has matrix $\mathbf{M}$ in ordinary coordinates, the same map written in the new coordinates is $\mathbf{P}^{-1}\mathbf{M}\mathbf{P}$. Read it right to left: convert new coordinates to ordinary ones, apply the map, convert back. Two matrices related this way are **similar** — one machine described from two bases. Lesson 5 showed that the determinant does not change under this, so the volume factor belongs to the machine, not to the basis. Eigenvalues, in Linear Algebra II, are the same kind of basis-free fact.

A reference frame is the special case where the basis is orthonormal. Then $\mathbf{P}^T\mathbf{P} = \mathbf{I}$, so $\mathbf{P}^{-1} = \mathbf{P}^T$. Coordinates cost three dot products instead of a solve. That is the whole practical reason frames are built from perpendicular unit axes.

## The direction cosine matrix

Now take two frames $A$ and $B$ that share an origin, and one arrow $\mathbf{r}$. You know its components $\mathbf{r}^B$ and want $\mathbf{r}^A$.

The plan: build $\mathbf{r}$ out of the $B$ axes, then measure the result along each $A$ axis. Step by step,

$$
r^A_i = \hat{\mathbf{a}}_i\cdot\mathbf{r} = \hat{\mathbf{a}}_i\cdot\Big(\sum_{j} r^B_j\,\hat{\mathbf{b}}_j\Big) = \sum_j \big(\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j\big)\,r^B_j .
$$

The first equality is the definition of a component. The second writes $\mathbf{r}$ using the $B$ axes. The third moves the dot product inside the sum, because the dot product distributes.

The last line is a matrix times a vector. Define the $3 \times 3$ matrix $\mathbf{R}_A^B$ with entries

$$
\big(\mathbf{R}_A^B\big)_{ij} = \hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j = \cos\big(\text{angle between } \hat{\mathbf{a}}_i \text{ and } \hat{\mathbf{b}}_j\big),
$$

and the conversion becomes

$$
\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B .
$$

The entries are cosines of the angles between the axes of the two frames, so $\mathbf{R}_A^B$ is called the **[[direction cosine matrix|direction-cosines]]**, or DCM. It also goes by rotation matrix, change-of-basis matrix and attitude matrix. They are all the same object.

### Reading the notation

The labels are chosen so the algebra checks itself. In $\mathbf{R}_A^B$ the **superscript is the frame the components come from** and the **subscript is the frame they go to**. Read it aloud as "$A$ from $B$".

In $\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B$, the matrix's superscript $B$ sits right next to the vector's superscript $B$, and the subscript $A$ matches the answer. Later modules write the identical matrix with an arrow, $\mathbf{R}_{A \leftarrow B}$. In code it is `R_AB`, or better `R_a_from_b`, so that `r_a = R_a_from_b @ r_b` reads as a sentence. The module's exercise calls the body-to-inertial matrix `R_IB`; that is $\mathbf{R}_I^B$, "inertial from body".

### Columns and rows have meanings

Look down column $j$ of $\mathbf{R}_A^B$. Its entries are $\hat{\mathbf{a}}_1\cdot\hat{\mathbf{b}}_j$, $\hat{\mathbf{a}}_2\cdot\hat{\mathbf{b}}_j$, $\hat{\mathbf{a}}_3\cdot\hat{\mathbf{b}}_j$. Those are exactly the components of $\hat{\mathbf{b}}_j$ resolved in $A$. Now look across row $i$: its entries $\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$, for $j = 1, 2, 3$, are the components of $\hat{\mathbf{a}}_i$ resolved in $B$. So:

> The columns of $\mathbf{R}_A^B$ are the $B$ axes written in $A$ coordinates. The rows are the $A$ axes written in $B$ coordinates.

This is the practical recipe. If you know where a sensor's three axes point in the body frame, those three unit vectors, written as columns, *are* $\mathbf{R}_B^S$. No angles, no trigonometry.

It is also the rule from Lesson 2 that a matrix's columns are the images of the basis vectors. $\mathbf{R}_A^B$ sends $\mathbf{e}_j$ — which is $\hat{\mathbf{b}}_j$ resolved in $B$ — to $\hat{\mathbf{b}}_j$ resolved in $A$.

### Orthogonality and determinant

The columns of $\mathbf{R}_A^B$ are the $B$ axes. Those axes are perpendicular unit vectors, and a dot product gives the same number in every frame. So the columns are orthonormal, and as in Lesson 6,

$$
\big(\mathbf{R}_A^B\big)^T\mathbf{R}_A^B = \mathbf{I} .
$$

To see it entry by entry: entry $(i, j)$ of the left side is column $i$ dotted with column $j$, which is $\hat{\mathbf{b}}_i\cdot\hat{\mathbf{b}}_j$. That is $1$ when $i = j$ and $0$ otherwise — the **Kronecker delta** $\delta_{ij}$ (read "delta i j"). So the transpose is the inverse. And the inverse must be the matrix that converts the other way:

$$
\mathbf{R}_B^A = \big(\mathbf{R}_A^B\big)^{-1} = \big(\mathbf{R}_A^B\big)^T .
$$

Swap the labels, transpose the matrix. The row reading agrees: the rows of $\mathbf{R}_A^B$ are the $A$ axes in $B$ coordinates, which are exactly the columns of $\mathbf{R}_B^A$.

Lesson 5 showed that orthonormal columns give $\det = \pm 1$. Which sign? The determinant of $[\hat{\mathbf{b}}_1\ \hat{\mathbf{b}}_2\ \hat{\mathbf{b}}_3]$ is the signed volume of the unit cube those axes span: $+1$ for a right-handed set, $-1$ for a left-handed one. Both our frames are right-handed, so

$$
\det\mathbf{R}_A^B = +1 .
$$

These two properties together — $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ and $\det\mathbf{R} = +1$ — define the **[[special orthogonal group|so3-name]]** $SO(3)$, the set of all proper rotations in three dimensions. Every change of basis between right-handed frames lies in $SO(3)$, and every member of $SO(3)$ is a change of basis between some pair of right-handed frames. A matrix that passes the first test but has $\det = -1$ is a reflection: a left-handed frame, or one axis with the wrong sign, has crept in.

::: key Properties of a rotation matrix
$\mathbf{R} \in SO(3)$ satisfies $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ (orthonormal columns) and $\det\mathbf{R} = +1$ (no reflection). Together they give $\mathbf{R}^{-1} = \mathbf{R}^T$. For frames, $\mathbf{R}_B^A = (\mathbf{R}_A^B)^T$: swap the labels, transpose the matrix. Lengths and angles are the same in every frame.
:::

### Chaining frames

Now three frames, $A$, $B$ and $C$. You have $\mathbf{R}_B^A$ and $\mathbf{R}_C^B$, and you want to go from $A$ straight to $C$. Go in two hops:

$$
\mathbf{r}^C = \mathbf{R}_C^B\,\mathbf{r}^B = \mathbf{R}_C^B\,\big(\mathbf{R}_B^A\,\mathbf{r}^A\big) = \big(\mathbf{R}_C^B\,\mathbf{R}_B^A\big)\,\mathbf{r}^A .
$$

The first step converts $B$ to $C$. The second substitutes $\mathbf{r}^B$ from its own conversion. The third regroups, which matrix multiplication allows. So

$$
\mathbf{R}_C^A = \mathbf{R}_C^B\,\mathbf{R}_B^A .
$$

Look at the **[[inner labels|labels-cancel]]** — the subscript of the right factor and the superscript of the left. Both are $B$, and they cancel, leaving "$C$ from $A$". This is multiplication as composition from Lesson 2, read right to left in the order the vector travels: first $A$ to $B$, then $B$ to $C$.

**Before you multiply two rotation matrices, check that the inner labels match.** If they do not, one factor needs a transpose, and the labels tell you which. The reverse product $\mathbf{R}_B^A\,\mathbf{R}_C^B$ has mismatched inner labels, $A$ against $C$. It is a perfectly good rotation matrix, and it means nothing.

::: key Chaining rotations
$\mathbf{R}_C^A = \mathbf{R}_C^B\,\mathbf{R}_B^A$: adjacent labels cancel. Read right to left, and check that the inner labels match before you multiply. In code, `R_c_from_a = R_c_from_b @ R_b_from_a`.
:::

## Elementary rotations

The simplest change of frame is a turn about one shared axis, like a door swinging on its hinge. Let frame $B$ be frame $A$ turned through an angle $\theta$ ("theta") about $\hat{\mathbf{a}}_3$. Positive $\theta$ follows the **right-hand rule**: point your right thumb along $\hat{\mathbf{a}}_3$, and your fingers curl the positive way.

The hinge axis does not move, so $\hat{\mathbf{b}}_3 = \hat{\mathbf{a}}_3$. The other two axes turn in their plane exactly like the plane rotation of Lesson 2:

$$
\hat{\mathbf{b}}_1 = \cos\theta\,\hat{\mathbf{a}}_1 + \sin\theta\,\hat{\mathbf{a}}_2, \qquad \hat{\mathbf{b}}_2 = -\sin\theta\,\hat{\mathbf{a}}_1 + \cos\theta\,\hat{\mathbf{a}}_2 .
$$

The columns of $\mathbf{R}_A^B$ are the $B$ axes in $A$ coordinates, so write these down as columns:

$$
\mathbf{R}_A^B = \mathbf{R}_3(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{pmatrix}.
$$

The same construction about the other two axes gives

$$
\mathbf{R}_1(\theta) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta \\ 0 & \sin\theta & \cos\theta \end{pmatrix}, \qquad
\mathbf{R}_2(\theta) = \begin{pmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{pmatrix}.
$$

In each, the hinge axis gets a row and a column of the identity, and the other $2 \times 2$ block is a plane rotation. $\mathbf{R}_2$ looks different only because the cyclic order of its plane is $(3, 1)$, which puts its sines in the other corners.

Check $\mathbf{R}_2$ with a picture. Its column 1 is $\hat{\mathbf{b}}_1$ in $A$ coordinates: $(\cos\theta, 0, -\sin\theta)^T$. In aircraft body axes, 1 is the nose, 2 is the right wing and 3 points down. Pitching nose-up about the wing axis by $\theta$ tips the nose upward, toward negative 3. The matrix says the same.

Each $\mathbf{R}_k(\theta)$ is "original frame from turned frame": it takes components in the frame that was turned through $+\theta$ and returns components in the frame it was turned from. Because its columns are also where $\hat{\mathbf{a}}_1, \hat{\mathbf{a}}_2, \hat{\mathbf{a}}_3$ land under the turn, $\mathbf{R}_k(\theta)$ is also the matrix that actively turns a vector by $+\theta$ about axis $k$. Its transpose, $\mathbf{R}_k(\theta)^T = \mathbf{R}_k(-\theta)$, is "turned frame from original frame".

For $\theta = 30°$, $\mathbf{R}_3(30°)$ sends $(1, 0, 0)^T$ — the turned frame's 1-axis, in its own coordinates — to $(0.8660, 0.5, 0)^T$, the same axis seen from the original frame.

::: warning Passive or active, and whose convention
Some books and libraries — including the rotating-frames module later in this curriculum — define the elementary matrices as the transpose of the ones here. Their $\mathbf{R}_3(\theta)$ means "turned frame from original frame" and has $+\sin\theta$ above the diagonal. Neither choice is wrong. Mixing them is. Never trust the name of a function argument. Push a vector you can picture — a frame axis — through the matrix and check that it lands where the geometry says it must. The rule "the columns of $\mathbf{R}_A^B$ are the $B$ axes in $A$ coordinates" does not depend on anyone's convention, and it settles every such question.
:::

## Euler sequences: yaw, pitch, roll

Any orientation can be reached with three hinge turns in a row. The **3-2-1 sequence** used for aircraft and launch vehicles starts from the inertial (or local-level) frame $I$ and applies **[[yaw, pitch and roll|yaw-pitch-roll]]** — nose left-right, nose up-down, and a turn about the nose — each about an axis of the frame the previous step produced:

1. Yaw $\psi$ ("psi") about $\hat{\mathbf{i}}_3$ gives an in-between frame $F_1$: $\mathbf{R}_I^{F_1} = \mathbf{R}_3(\psi)$.
2. Pitch $\theta$ about the *new* 2-axis gives $F_2$: $\mathbf{R}_{F_1}^{F_2} = \mathbf{R}_2(\theta)$.
3. Roll $\phi$ ("phi") about the *new* 1-axis gives the body frame $B$: $\mathbf{R}_{F_2}^{B} = \mathbf{R}_1(\phi)$.

Chain them with the cancellation rule:

$$
\mathbf{R}_I^B = \mathbf{R}_I^{F_1}\,\mathbf{R}_{F_1}^{F_2}\,\mathbf{R}_{F_2}^{B} = \mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_1(\phi) .
$$

Each elementary matrix is "previous frame from next frame", and the inner labels cancel in order: $F_1$, then $F_2$. This is the `R3(yaw) @ R2(pitch) @ R1(roll)` of the exercise. It converts body components to inertial ones, $\mathbf{r}^I = \mathbf{R}_I^B\,\mathbf{r}^B$. Its transpose, $\mathbf{R}_B^I = \mathbf{R}_1(-\phi)\,\mathbf{R}_2(-\theta)\,\mathbf{R}_3(-\psi)$, converts the other way.

The order is not up for negotiation, because turns in three dimensions **[[do not commute|order-matters]]** — the order changes the result. $\mathbf{R}_3(30°)\,\mathbf{R}_2(10°)$ has first column $(0.8529, 0.4924, -0.1736)^T$, while $\mathbf{R}_2(10°)\,\mathbf{R}_3(30°)$ has first column $(0.8529, 0.5, -0.1504)^T$. Both are unit vectors. Both look plausible. They point $1.4°$ apart. A yaw then a pitch is a different attitude from a pitch then a yaw, and the labels are what keep the sequence straight.

One caution for later: at a pitch of exactly $\pm 90°$ these three angles run into a problem called **[[gimbal lock|gimbal-lock-bridge]]**, where yaw and roll stop being different turns.

::: example Building and reading a body-to-inertial matrix
A vehicle has yaw $\psi = 30°$, pitch $\theta = 10°$ and roll $\phi = 5°$ in a 3-2-1 sequence. Use $\cos 30° = 0.8660$, $\sin 30° = 0.5$, $\cos 10° = 0.9848$, $\sin 10° = 0.1736$, $\cos 5° = 0.9962$ and $\sin 5° = 0.0872$.

**Step 1: yaw times pitch.**

$$
\begin{pmatrix} 0.8660 & -0.5 & 0 \\ 0.5 & 0.8660 & 0 \\ 0 & 0 & 1 \end{pmatrix}\begin{pmatrix} 0.9848 & 0 & 0.1736 \\ 0 & 1 & 0 \\ -0.1736 & 0 & 0.9848 \end{pmatrix} = \begin{pmatrix} 0.8529 & -0.5 & 0.1504 \\ 0.4924 & 0.8660 & 0.0868 \\ -0.1736 & 0 & 0.9848 \end{pmatrix}.
$$

For instance, the top-left entry is row 1 of the left matrix dotted with column 1 of the right one: $0.8660 \times 0.9848 + (-0.5) \times 0 + 0 \times (-0.1736) = 0.8528$. With unrounded cosines it is $0.8529$, the value shown.

**Step 2: times roll, on the right.** $\mathbf{R}_1(\phi)$ leaves column 1 alone and mixes columns 2 and 3:

$$
\mathbf{R}_I^B = \begin{pmatrix} 0.8529 & -0.4850 & 0.1934 \\ 0.4924 & 0.8703 & 0.0110 \\ -0.1736 & 0.0858 & 0.9811 \end{pmatrix}.
$$

**Read the columns.** Column 1 is the body 1-axis — the nose — in inertial coordinates: $(0.8529, 0.4924, -0.1736)^T$. That is $(\cos\theta\cos\psi,\ \cos\theta\sin\psi,\ -\sin\theta)^T$: swung $30°$ around, and tipped $10°$ up. Here, as in aircraft axes, inertial 3 points down, so negative 3 is up. Column 3 is the body 3-axis, tilted away from straight down by the roll and pitch.

**Audit.** Column 1 has length $\sqrt{0.8529^2 + 0.4924^2 + 0.1736^2} = 1.000$, and the others do too. Columns 1 and 2 dot to $-0.4136 + 0.4285 - 0.0149 = 0.000$ to the digits shown. The determinant by cofactors is $1.000$. So $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ and $\det\mathbf{R} = +1$.

**Use it.** A point $100\ \mathrm{m}$ ahead along the nose has $\mathbf{r}^B = (100, 0, 0)^T$ m, so $\mathbf{r}^I = \mathbf{R}_I^B\,\mathbf{r}^B = 100 \times \text{column 1} = (85.3, 49.2, -17.4)^T$ m. Now go the other way. Gravity points down, so $\mathbf{g}^I = (0, 0, 9.80665)^T\ \mathrm{m/s^2}$. In the body frame, $\mathbf{g}^B = (\mathbf{R}_I^B)^T\mathbf{g}^I = 9.80665 \times \text{row 3 of } \mathbf{R}_I^B = (-1.703, 0.842, 9.621)^T\ \mathrm{m/s^2}$.

**Sanity check.** With the nose up, gravity should pull partly backward along the nose — and its first component is negative. Its length is still $9.807\ \mathrm{m/s^2}$: a change of frame never changes a magnitude.
:::

::: example A frame chain, and what the wrong order costs
A star tracker, frame $T$, has its boresight $\hat{\mathbf{t}}_1$ — the direction it looks — along the body 2-axis. Its frame is the body frame turned $90°$ about the body 3-axis, so $\mathbf{R}_B^T = \mathbf{R}_3(90°)$. Check: its first column is $(\cos 90°, \sin 90°, 0)^T = (0, 1, 0)^T$, which is indeed the body 2-axis. Where does the boresight point in inertial space, using $\mathbf{R}_I^B$ from the previous example?

**Match the inner labels.** $\mathbf{R}_I^T = \mathbf{R}_I^B\,\mathbf{R}_B^T$. The boresight in inertial coordinates is column 1 of this product, which is $\mathbf{R}_I^B$ times $(0, 1, 0)^T$ — that is, column 2 of $\mathbf{R}_I^B$:

$$
\hat{\mathbf{t}}_1^{\,I} = (-0.4850, 0.8703, 0.0858)^T .
$$

**The wrong order.** $\mathbf{R}_B^T\,\mathbf{R}_I^B$ is also a rotation matrix. Its first column is $\mathbf{R}_3(90°)$ applied to column 1 of $\mathbf{R}_I^B$, which gives $(-0.4924, 0.8529, -0.1736)^T$. It is a unit vector, it looks similar, and it is $14.9°$ away from the right answer. A star tracker reports its pointing to within a few arcseconds — about a thousandth of a degree. The wrong product would send it hunting for stars in the wrong patch of sky, and nothing in the arithmetic would say why.
:::

::: example Auditing a corrupted rotation matrix
Take $\mathbf{R}_I^B$ from the first example and multiply its first column by $1.001$. This mimics an attitude integrator slowly losing its normalization.

**Orthogonality test.** Entry $(1, 1)$ of $\mathbf{R}^T\mathbf{R}$ is the squared length of column 1, now $1.001^2 = 1.002$. So the largest entry of $\mathbf{R}^T\mathbf{R} - \mathbf{I}$ is $0.002$.

**Determinant test.** The determinant is linear in each column, so it becomes $1.001$.

An audit with tolerance $10^{-9}$ on both tests rejects this matrix at once. Code that trusted it would rotate every vector with a $0.1\%$ length error along one axis — small enough to go unnoticed for hours, large enough to matter at the end of a burn. Repairing a drifted matrix is Gram–Schmidt on its columns, from Lesson 6.
:::

::: warning The single most common frame bug
Using $\mathbf{R}_B^I$ where $\mathbf{R}_I^B$ is needed. The two differ by a transpose, both are valid rotations, and for small angles they are so close that a simulation can look right. Name every matrix by both its frames, on paper and in code, and put the frame of every vector in its name. Then `R_i_from_b @ r_b` reads correctly and `R_b_from_i @ r_b` is visibly wrong.
:::

The same construction in NumPy, with the audit:

```python
import numpy as np

def R1(t): c, s = np.cos(t), np.sin(t); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def R2(t): c, s = np.cos(t), np.sin(t); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def R3(t): c, s = np.cos(t), np.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

yaw, pitch, roll = np.radians([30.0, 10.0, 5.0])
R_i_from_b = R3(yaw) @ R2(pitch) @ R1(roll)
print(R_i_from_b[:, 0].round(4))              # [ 0.8529  0.4924 -0.1736]  body x-axis in I
print(np.allclose(R_i_from_b.T @ R_i_from_b, np.eye(3)), round(np.linalg.det(R_i_from_b), 12))  # True 1.0
```

## Check yourself

::: check
A sensor frame $S$ has axes, in body coordinates, $\hat{\mathbf{s}}_1 = (0, 0, 1)^T$, $\hat{\mathbf{s}}_2 = (1, 0, 0)^T$, $\hat{\mathbf{s}}_3 = (0, 1, 0)^T$. Write $\mathbf{R}_B^S$ and $\mathbf{R}_S^B$, and check that the sensor frame is right-handed.
:::

::: answer
The columns of $\mathbf{R}_B^S$ are the $S$ axes in $B$ coordinates, so write the three given vectors side by side:

$$
\mathbf{R}_B^S = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ 1 & 0 & 0 \end{pmatrix}, \qquad \mathbf{R}_S^B = (\mathbf{R}_B^S)^T = \begin{pmatrix} 0 & 0 & 1 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{pmatrix}.
$$

Expanding the determinant of $\mathbf{R}_B^S$ along the first row by cofactors: $0 - 1\,(0 \cdot 0 - 1 \cdot 1) + 0 = +1$. So the sensor triad is right-handed and the matrix is a proper rotation. It is a cyclic relabeling of the axes: body 3 becomes sensor 1, body 1 becomes sensor 2, body 2 becomes sensor 3.
:::

::: check
You are given $\mathbf{R}_B^N$ (body from a navigation frame $N$) and $\mathbf{R}_C^B$ (camera from body), and you need $\mathbf{R}_N^C$. Write it using only transposes and products.
:::

::: answer
By cancellation, $\mathbf{R}_N^C = \mathbf{R}_N^B\,\mathbf{R}_B^C$ — the inner labels are both $B$. Each factor is the transpose of something you have: $\mathbf{R}_N^B = (\mathbf{R}_B^N)^T$ and $\mathbf{R}_B^C = (\mathbf{R}_C^B)^T$. So

$$
\mathbf{R}_N^C = (\mathbf{R}_B^N)^T(\mathbf{R}_C^B)^T = (\mathbf{R}_C^B\,\mathbf{R}_B^N)^T .
$$

The last form uses the rule that the transpose of a product reverses the order. It also reads well: $\mathbf{R}_C^N = \mathbf{R}_C^B\,\mathbf{R}_B^N$ chains correctly, and what you want is its transpose.
:::

::: check
Frame $B$ is frame $A$ turned through $+90°$ about their shared 1-axis. A vector has $\mathbf{r}^B = (0, 1, 0)^T$. Find $\mathbf{r}^A$, and confirm it with a picture.
:::

::: answer
With $\cos 90° = 0$ and $\sin 90° = 1$,

$$
\mathbf{R}_A^B = \mathbf{R}_1(90°) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 0 & -1 \\ 0 & 1 & 0 \end{pmatrix},
$$

and $\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B$ is column 2 of this matrix, $(0, 0, 1)^T$.

The picture: point your right thumb along the 1-axis and curl your fingers. A $90°$ turn carries the 2-axis onto the old 3-axis, so $\hat{\mathbf{b}}_2 = \hat{\mathbf{a}}_3$. The vector lies along $\hat{\mathbf{b}}_2$, so it lies along $\hat{\mathbf{a}}_3$, and its $A$ components are $(0, 0, 1)^T$. Matrix and picture agree.
:::

::: check
A matrix that is supposed to be $\mathbf{R}_I^B$ passes $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ to $10^{-15}$ but has $\det\mathbf{R} = -1$. What has happened, and what will it do to vectors?
:::

::: answer
The columns are orthonormal, but the axes they describe form a left-handed set. One axis has the wrong sign, or two axes were swapped, or the sensor frame was defined left-handed. The matrix is a reflection combined with a rotation.

It keeps every length and every angle between vectors, but it reverses handedness. So a cross product computed in one frame and then converted will disagree in sign with the cross product computed in the other frame. Angular momentum and torque will come out backwards.
:::

::: check
Explain, using the column reading of the DCM, why $\mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)$ has first column $(\cos\theta\cos\psi,\ \cos\theta\sin\psi,\ -\sin\theta)^T$.
:::

::: answer
The first column of a product $\mathbf{M}\mathbf{N}$ is $\mathbf{M}$ times the first column of $\mathbf{N}$.

The first column of $\mathbf{R}_2(\theta)$ is $(\cos\theta, 0, -\sin\theta)^T$: the pitched 1-axis, seen from the yawed frame. Applying $\mathbf{R}_3(\psi)$ turns its first two components $(\cos\theta, 0)$ through $\psi$ in their plane, giving $(\cos\theta\cos\psi, \cos\theta\sin\psi)$, and leaves the third component alone. The result is $(\cos\theta\cos\psi,\ \cos\theta\sin\psi,\ -\sin\theta)^T$.

In words: this is the nose direction after yawing by $\psi$ and pitching up by $\theta$, seen from the original frame. Roll turns the vehicle about its nose, so it cannot move the nose. That is why multiplying by $\mathbf{R}_1(\phi)$ on the right leaves column 1 untouched.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{r}^A$, $r^A_i = \hat{\mathbf{a}}_i\cdot\mathbf{r}$ | Components of $\mathbf{r}$ resolved in frame $A$ |
| $\mathbf{x} = \mathbf{P}\mathbf{c}$, $\mathbf{c} = \mathbf{P}^{-1}\mathbf{x}$ | General change of basis; $\mathbf{P}$ has the new basis as columns |
| $\mathbf{P}^{-1}\mathbf{M}\mathbf{P}$ | The same map in the new basis (similar matrices) |
| $\mathbf{R}_A^B$, $(\mathbf{R}_A^B)_{ij} = \hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$ | Direction cosine matrix, "$A$ from $B$"; $\mathbf{r}^A = \mathbf{R}_A^B\,\mathbf{r}^B$ |
| Columns of $\mathbf{R}_A^B$ | The $B$ axes in $A$ coordinates; rows are the $A$ axes in $B$ coordinates |
| $\mathbf{R}^T\mathbf{R} = \mathbf{I}$, $\det\mathbf{R} = +1$ | Defining properties of $SO(3)$; so $\mathbf{R}^{-1} = \mathbf{R}^T$ |
| $\mathbf{R}_B^A = (\mathbf{R}_A^B)^T$ | Swap the labels, transpose the matrix |
| $\mathbf{R}_C^A = \mathbf{R}_C^B\,\mathbf{R}_B^A$ | Chain: inner labels cancel; read right to left |
| $\mathbf{R}_1, \mathbf{R}_2, \mathbf{R}_3$ | Elementary rotations; "original frame from turned frame" |
| $\mathbf{R}_I^B = \mathbf{R}_3(\psi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_1(\phi)$ | 3-2-1 yaw–pitch–roll, body to inertial |
| $\mathbf{R}_{A \leftarrow B}$, `R_a_from_b` | The same matrix in later modules and in code |

A rotation matrix that changes with time — a body turning at angular velocity $\boldsymbol{\omega}$ — has a rate of change, and that rate is the rotation matrix times a special matrix built from $\boldsymbol{\omega}$. The next and final lesson of this module builds that matrix out of the cross product and shows why it sits at the heart of attitude kinematics.

::: context frame-word Why "frame"
A picture frame decides what you see and from where. A reference frame does the same for measurements: it fixes an origin and three directions, and every number you write down is "as seen from here". Engineers say "frame" and "coordinate system" almost interchangeably. Strictly, a frame is the set of physical directions — tied to the stars, to the Earth, to the vehicle — and a coordinate system is the way you attach numbers to it.
:::

::: context right-handed-triad Right hand, not left
Curl the fingers of your right hand from axis 1 toward axis 2; your thumb gives axis 3. Do the same with your left hand and the thumb points the other way. The two sets are mirror images, and no turning can make one into the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke-width="2.5" fill="none">
    <line x1="80" y1="130" x2="40" y2="168" stroke="#1f2a44"/>
    <line x1="80" y1="130" x2="160" y2="130" stroke="#1f2a44"/>
    <line x1="80" y1="130" x2="80" y2="40" stroke="#1d6fd1"/>
    <line x1="280" y1="130" x2="320" y2="168" stroke="#1f2a44"/>
    <line x1="280" y1="130" x2="200" y2="130" stroke="#1f2a44"/>
    <line x1="280" y1="130" x2="280" y2="40" stroke="#b4232c"/>
  </g>
  <g font-size="13" fill="#1f2a44">
    <text x="28" y="182">1</text><text x="164" y="134">2</text><text x="86" y="46">3</text>
    <text x="324" y="182">1</text><text x="186" y="134">2</text><text x="286" y="46">3</text>
  </g>
  <path d="M62,147 A26,26 0 0,0 106,130" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M298,147 A26,26 0 0,1 254,130" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="80" y="196" font-size="12" text-anchor="middle" fill="#1d6fd1">right-handed</text>
  <text x="280" y="196" font-size="12" text-anchor="middle" fill="#b4232c">left-handed (mirror)</text>
</svg>
```

Every frame in ORBIT is right-handed. A left-handed one sneaking in is exactly what the $\det\mathbf{R} = +1$ test catches.
:::

::: context direction-cosines Where the cosines come from
The dot product of two unit vectors is the cosine of the angle between them. So each entry of the DCM is the cosine of the angle between one axis of $A$ and one axis of $B$. When frame $B$ is frame $A$ turned by $\theta$ about a shared axis, $\hat{\mathbf{b}}_1$ reaches $\cos\theta$ along $\hat{\mathbf{a}}_1$ and $\sin\theta$ along $\hat{\mathbf{a}}_2$ — and those two numbers are the first column of the matrix.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke-width="2.5">
    <line x1="120" y1="170" x2="230" y2="170" stroke="#1f2a44"/>
    <line x1="120" y1="170" x2="120" y2="60" stroke="#1f2a44"/>
    <line x1="120" y1="170" x2="215.26" y2="115" stroke="#1d6fd1"/>
    <line x1="120" y1="170" x2="65" y2="74.74" stroke="#1d6fd1"/>
  </g>
  <line x1="215.26" y1="115" x2="215.26" y2="170" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M155,170 A35,35 0 0,0 150.31,152.5" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <g font-size="13" fill="#1f2a44">
    <text x="234" y="174">a1</text><text x="112" y="54">a2</text>
    <text x="160" y="164" fill="#b4232c">θ</text>
    <text x="222" y="112" fill="#1d6fd1">b1</text><text x="46" y="72" fill="#1d6fd1">b2</text>
    <text x="222" y="148" font-size="12">sin θ</text>
    <text x="168" y="190" font-size="12" text-anchor="middle">cos θ</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="252" y="50">B = A turned</text>
    <text x="252" y="66">by θ about the</text>
    <text x="252" y="82">shared 3-axis</text>
    <text x="252" y="98">(out of page)</text>
  </g>
</svg>
```
:::

::: context so3-name Reading the name SO(3)
"O" is for orthogonal: $\mathbf{R}^T\mathbf{R} = \mathbf{I}$. "S" is for special: determinant exactly $+1$. The "3" is the size, $3 \times 3$. A **group** is a set closed under an operation — here, multiply two rotations and you get another rotation, and every rotation has an inverse that is also a rotation. Later modules on attitude lean on that closure every time they chain frames.
:::

::: context labels-cancel Like units cancelling
The cancellation rule works the way units do. Hours times kilometers-per-hour leaves kilometers; "$C$ from $B$" times "$B$ from $A$" leaves "$C$ from $A$".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="2">
    <circle cx="300" cy="50" r="20"/><circle cx="180" cy="50" r="20"/><circle cx="60" cy="50" r="20"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle" font-weight="700">
    <text x="300" y="55">A</text><text x="180" y="55">B</text><text x="60" y="55">C</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="#1d6fd1">
    <line x1="280" y1="50" x2="208" y2="50"/><polygon points="200,50 210,45 210,55"/>
    <line x1="160" y1="50" x2="88" y2="50"/><polygon points="80,50 90,45 90,55"/>
  </g>
  <g font-size="12" fill="#1d6fd1" text-anchor="middle">
    <text x="240" y="40">B from A</text><text x="120" y="40">C from B</text>
  </g>
  <line x1="290" y1="96" x2="78" y2="96" stroke="#b4232c" stroke-width="2"/>
  <polygon points="70,96 80,91 80,101" fill="#b4232c"/>
  <text x="180" y="118" font-size="12" fill="#b4232c" text-anchor="middle">C from A = (C from B)(B from A)</text>
</svg>
```

The vector travels right to left along the arrows, which is why the first hop is written last.
:::

::: context yaw-pitch-roll Words borrowed from ships
Yaw, pitch and roll are old sailing words. A ship pitches when its bow rises and falls over a wave, rolls when it rocks side to side, and yaws when its heading swings. Aircraft and rockets took the words over. For a launch vehicle on the pad, "pitch over" is the slow tilt from vertical toward the direction of flight that starts soon after liftoff.
:::

::: context order-matters Try it with a book
Lay a book flat, cover up. Turn it $90°$ about the vertical, then $90°$ about the left-right axis. Note where the spine ends up. Start again and do the two turns in the other order. The book finishes in a different position. That is all "rotations do not commute" means, and it is why the 3-2-1 order must be written down and kept.
:::

::: context gimbal-lock-bridge Where Euler angles break
The 3-2-1 angles have a weak spot: at a pitch of exactly $\pm 90°$, yaw and roll turn about the same line, and one degree of freedom is lost. This is called **gimbal lock**. Apollo spacecraft carried an indicator that warned the crew when their inertial platform was getting close to it. The attitude-representations module shows how quaternions avoid the problem altogether.
:::
