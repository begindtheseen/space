---
id: l11-active-versus-passive-rotation
title: Active against passive rotation, operator against coordinate transformation
minutes: 19
covers:
  - active vs passive rotation (operator vs coordinate transformation)
---

Take a photo of a chair from where you stand. Now do one of two things. Either turn the chair $30^\circ$ to the left, or leave the chair alone and walk round it so that *you* have turned $30^\circ$ to the right. Take a second photo. The two new photos are identical. Looking only at the pictures, you cannot tell whether the chair moved or you did.

A rotation matrix has exactly this problem. A $3\times 3$ **orthonormal** matrix (its columns are unit length and at right angles to each other) with determinant $+1$ can mean two different things, and nothing about the matrix says which.

- It can be an **[[operator|operator-word]]** — something that acts on a vector and physically turns it, inside one fixed frame. The gimbal swings, the antenna slews, the vector ends up pointing somewhere new. This is an **active rotation**.
- It can be a **coordinate transformation** — something that leaves the vector exactly where it is and re-expresses its components along a different set of axes. Nothing moves; only the numbers change. This is a **passive rotation**.

The two are **[[transposes|transpose-grid]]** of each other: flip one across its main diagonal and you get the other. That single sentence is the whole content of this lesson. It is also the source of an entire family of flight software bugs, because a transpose error produces a matrix that passes every structural check. It is orthonormal. Its determinant is $+1$. As a quaternion it has length $1$. Its numbers look sensible.

Lesson 05 showed that a transpose error costs exactly $2\Phi$ of pointing (twice the principal angle, folded into $0^\circ$ to $180^\circ$). At the identity attitude, $\Phi = 0$, that is zero. So bench tests on a vehicle sitting still find nothing, and the error appears in flight, growing with each manoeuvre. This module has put the question off several times with a note. Here it is settled, along with the naming habit that keeps it settled.

## The same turn, written twice

Take the simplest case: a turn of $30^\circ$ about the third axis, $z$.

The **active** matrix $\mathbf{R}_z(30^\circ)$ (read "R sub z of thirty degrees") turns a vector by $+30^\circ$ inside one frame. Its columns are where the three basis arrows end up:

$$
\mathbf{R}_z(30^\circ) = \begin{bmatrix} 0.866025 & -0.500000 & 0\\ 0.500000 & 0.866025 & 0\\ 0 & 0 & 1\end{bmatrix},
\qquad
\mathbf{R}_z(30^\circ)\begin{bmatrix}1\\0\\0\end{bmatrix} = \begin{bmatrix}0.866025\\ 0.500000\\ 0\end{bmatrix}.
$$

The vector started along $\hat{\mathbf{x}}$ and has been carried $30^\circ$ toward $\hat{\mathbf{y}}$. Its second component is $+0.5$, which is $\sin 30^\circ$. That is the chair turning.

The **passive** matrix is the elementary $\mathbf{R}_3(30^\circ)$ of lesson 02 and module 15 (read "R three of thirty degrees"). It re-expresses a fixed vector in a frame that has itself been turned by $+30^\circ$:

$$
\mathbf{R}_3(30^\circ) = \begin{bmatrix} 0.866025 & 0.500000 & 0\\ -0.500000 & 0.866025 & 0\\ 0 & 0 & 1\end{bmatrix},
\qquad
\mathbf{R}_3(30^\circ)\begin{bmatrix}1\\0\\0\end{bmatrix} = \begin{bmatrix}0.866025\\ -0.500000\\ 0\end{bmatrix}.
$$

This time the vector has not moved. The new frame's first axis has swung $30^\circ$ ahead of it. So, [[seen from the new axes|two-pictures]], the vector sits $30^\circ$ *behind* the first axis, and its second component is $-0.5$. That is you walking round the chair.

Put the two matrices side by side and the pattern is plain:

$$
\mathbf{R}_3(\theta) = \mathbf{R}_z(\theta)^{\top} = \mathbf{R}_z(-\theta).
$$

In words: turning the frame forward is the same arithmetic as turning the vector backward. Every statement about active and passive rotations is a restatement of that.

::: note Why it has to be true
Turn the axes by $+\theta$ about $z$. The new first axis is $\hat{\mathbf{x}}' = (\cos\theta, \sin\theta, 0)$ and the new second axis is $\hat{\mathbf{y}}' = (-\sin\theta, \cos\theta, 0)$, written in the old frame. A component along an axis is a dot product with that axis, so the new components of a fixed vector $\mathbf{v}$ are $\hat{\mathbf{x}}'\cdot\mathbf{v}$, $\hat{\mathbf{y}}'\cdot\mathbf{v}$ and $\hat{\mathbf{z}}\cdot\mathbf{v}$. Stacking them, the passive matrix has the new axes as its **rows**.

The active matrix has those same arrows as its **columns**, because its columns are where it sends $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$ and $\hat{\mathbf{z}}$. Rows of one are columns of the other: they are transposes.

Finally, $\cos(-\theta) = \cos\theta$ and $\sin(-\theta) = -\sin\theta$, so replacing $\theta$ by $-\theta$ in $\mathbf{R}_z$ flips exactly the two sine entries — which is what the transpose does too.
:::

::: key Active against passive
An active (operator) rotation moves the vector within a fixed frame. A passive (coordinate transformation) rotation re-expresses the same physical vector in a rotated frame. They are transposes of one another, and conflating them is the other great source of silent sign errors.
:::

## Which one is the attitude matrix?

Both. It depends on the question you ask it.

Read $\mathbf{C}_{N\leftarrow B}$ ("C, N from B") as a coordinate transformation and it is passive. It takes body components to reference components, and moves nothing.

Read the *same* matrix as an operator acting in the reference frame, and it is the active rotation that carries the reference **[[triad|triad-word]]** — the three axis arrows of a frame — onto the body triad. That is exactly how lesson 04 gave it a principal axis and angle through Rodrigues' formula.

The two readings fit together because of what the columns are. The columns of $\mathbf{C}_{N\leftarrow B}$ are the body axes written in reference components. And a matrix whose columns are the images of the basis arrows is the operator that produces those images. So here is the useful way to hold it:

**The matrix that takes $B$ components to $A$ components is the same matrix as the operator that carries the $A$ triad onto the $B$ triad.** Its transpose does both jobs the other way round.

That settles the elementary matrices $\mathbf{R}_1$, $\mathbf{R}_2$, $\mathbf{R}_3$. They are the ones with the *turned* frame as the target: $\mathbf{R}_3(\psi) = \mathbf{C}_{N'\leftarrow N}$, where $N'$ is $N$ yawed by $+\psi$. It is also why lesson 02's 3-2-1 sequence for $\mathbf{C}_{B\leftarrow N}$ multiplies $\mathbf{R}_k$ matrices in one order, while the quaternion chain for $q_{N\leftarrow B}$ in lesson 10 runs the other way.

## The quaternion inherits it exactly

Quaternions do not escape the question; they carry it along. Under this module's Hamilton convention, the matrix

$$
\mathbf{C}(q) = (w^2-\mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times]
$$

is the *active* matrix of the turn $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$. Converting the two $30^\circ$ matrices above into quaternions gives

$$
q\bigl(\mathbf{R}_z(30^\circ)\bigr) = [\,0.965926,\ 0,\ 0,\ +0.258819\,],
\qquad
q\bigl(\mathbf{R}_3(30^\circ)\bigr) = [\,0.965926,\ 0,\ 0,\ -0.258819\,],
$$

where $0.965926 = \cos 15^\circ$ and $0.258819 = \sin 15^\circ$ (half of $30^\circ$, as always). Rebuilding the matrices from these reproduces them exactly.

The passive quaternion has the axis *negated*, because it is the active turn through $-30^\circ$. And here is the trap. If a library's `from_axis_angle(axis, angle)` is active — as [[Eigen's AngleAxis|eigen-active]] is, and as graphics code generally is — then to build a passive frame transformation from it you must negate the angle or conjugate the result. Doing neither is the same $2\Phi$ error, dressed as a quaternion.

::: example A star tracker alignment matrix used the wrong way
A **[[star tracker|star-tracker]]** is a camera that recognises star patterns to measure attitude. This one is mounted with a small measured misalignment: $\Phi = 0.800^\circ$ about the axis $\hat{\mathbf{e}} = (0.202808,\ 0.912636,\ -0.354914)$. The alignment matrix $\mathbf{M}$ is stored in the spacecraft database. By mistake, the code that reads it in applies $\mathbf{M}^{\top}$ where $\mathbf{M}$ belongs.

The tracker's **boresight** — the direction its lens looks along — is $\mathbf{b} = (0,0,1)$ in the tracker's own axes. Done correctly,

$$
\mathbf{M}\mathbf{b} = (0.012735,\ -0.002863,\ 0.999915).
$$

With the transpose,

$$
\mathbf{M}^{\top}\mathbf{b} = (-0.012749,\ 0.002800,\ 0.999915).
$$

Both are unit vectors to twelve digits. Each is $0.748^\circ$ from the nominal boresight $(0,0,1)$, so both look entirely reasonable on a plot.

The angle between them is $1.496^\circ$. Compare that with the rule. The relative rotation between the right and wrong matrices is $\mathbf{M}\mathbf{M}$, and its principal angle is $1.600^\circ$ — exactly $2\Phi = 2\times 0.800^\circ$. That is the error a vector at right angles to $\hat{\mathbf{e}}$ would suffer. The boresight gets a bit less, $1.496^\circ$, because it is [[not quite at right angles|boresight-gap]] to the misalignment axis. Sanity check: $1.496^\circ$ is less than $1.600^\circ$, as it must be.

Now scale it. An imaging satellite specified to know its attitude to $0.01^\circ$ is off by $1.5^\circ$ — a hundred and fifty times the requirement. Because the number is plausible and steady, it would be blamed on almost anything before the transpose: tracker bias, thermal bending, a bad star catalogue.
:::

::: example A rate gyro package, mounted at 45°
A three-axis **rate gyro** (a sensor that measures how fast the vehicle turns about each of its axes) is bolted to a bracket [[turned 45° about body z|gyro-mount]]. It reports $\boldsymbol{\omega}^{G} = (0.020,\ 0,\ 0)\,\mathrm{rad/s}$ — a turn rate only about its own first axis. ($\boldsymbol{\omega}$ is "omega", the angular velocity; the superscript $G$ says "in gyro axes".) The database stores the passive matrix $\mathbf{R}_3(45^\circ) = \mathbf{C}_{G\leftarrow B}$.

We want body rates, so we need $\mathbf{C}_{B\leftarrow G}$, which is the transpose:

$$
\boldsymbol{\omega}^{B} = \mathbf{R}_3(45^\circ)^{\top}\boldsymbol{\omega}^{G} = (0.020\cos 45^\circ,\ 0.020\sin 45^\circ,\ 0) = (0.014142,\ 0.014142,\ 0)\,\mathrm{rad/s}.
$$

That is equal parts roll and pitch, pointing at $+45^\circ$ in the body $xy$ plane — exactly where the gyro's first axis points. Good.

Forget the transpose and you get $(0.014142,\ -0.014142,\ 0)\,\mathrm{rad/s}$ instead. Same size, $\sqrt{0.014142^2 + 0.014142^2} = 0.020\,\mathrm{rad/s}$, but at $-45^\circ$.

The two answers are exactly $90.000^\circ$ apart — which is $2\Phi$ for $\Phi = 45^\circ$. A controller fed the wrong one applies pitch torque where roll is needed, with the right magnitudes throughout. Rate-magnitude checks pass. Total angular momentum looks right. The vehicle tumbles.

Here is how to catch it. Excite one axis at a time and watch the resolved rates. A pure gyro-$x$ input must come out at $+45^\circ$ in the body; if it comes out at $-45^\circ$, the transpose is in the wrong place. It is a five-minute bench test, and it is worth doing for [[every sensor and actuator|polarity-test]] on the vehicle.
:::

## Composition order is affected too

The choice also changes how rotations stack up.

**Active rotations in a fixed frame** stack with the most recent on the left. Apply $\mathbf{A}$, then $\mathbf{B}$, and the net operator is $\mathbf{B}\mathbf{A}$ — like writing $f(g(x))$, where the function applied last is written first.

**Passive transformations** chain by matching labels: $\mathbf{C}_{A\leftarrow C} = \mathbf{C}_{A\leftarrow B}\mathbf{C}_{B\leftarrow C}$. The inner labels touch, like dominoes, and you read the chain left to right.

The two orders really are different. Let $\mathbf{A}$ be a $50^\circ$ turn about $\hat{\mathbf{z}}$ and $\mathbf{B}$ a $30^\circ$ turn about $\hat{\mathbf{x}}$. The products $\mathbf{B}\mathbf{A}$ and $\mathbf{A}\mathbf{B}$ both have principal angle $57.809^\circ$. (They must match: lesson 06 showed the scalar part of a quaternion product does not care about the order.) But as attitudes they are $25.119^\circ$ apart.

This is the intrinsic-and-extrinsic reversal of lesson 02 in its general form. A list of active turns about *fixed* axes, applied in one order, equals the same list of turns about *moving* (body) axes applied in the opposite order. Two conventions, one relationship, described in every attitude library's documentation with different words.

::: warning Two wrong transposes can cancel, and then uncancel
The dangerous repair is the local one. A frame chain gives the wrong answer. Someone inserts a transpose where the test was failing, and the test passes. But it passes because a second convention error further along the chain was cancelling the first — and now both are wrong in a way that happens to balance. The chain is right for the path that was tested and wrong for every other path through the same matrices. When a transpose fixes a symptom, find out which of the two conventions is actually wrong, fix that one, and re-run the paths that were already passing.
:::

::: warning Small attitudes hide the bug, and that is the trap
Code that uses either convention on a vehicle near its reference attitude is wrong only by $2\Phi$, and $\Phi$ is small. So the bug hides in exactly the code that runs most often and is checked least carefully. It surfaces on the first large slew, at $2\Phi$, which is why it is so often reported as "the estimator is fine until we manoeuvre".
:::

::: note Naming the matrices is the fix
Every convention argument in this module ends the same way: put the meaning in the name. `R_b_from_s` (body from sensor) cannot be misread, and it reads correctly in a chain — `R_b_from_n @ n_vector`, with the neighbouring labels matching. `C_align`, `R_mount`, `dcm` and `q_body` are not names; they are placeholders, and no amount of commenting makes them safe. Where a language allows it, give the frames to the [[type system|frame-types]] so that a mismatched product does not compile. Where it does not, the naming habit is the only defence — and it works.
:::

## Check yourself

::: check
A matrix takes the vector $(0, 1, 0)$ to $(0, 0.866, -0.500)$. Is it an active rotation of $+30^\circ$ about $\hat{\mathbf{x}}$, or a passive one?
:::

::: answer
Work out what the active rotation would do. Turning $+30^\circ$ about $\hat{\mathbf{x}}$ carries $\hat{\mathbf{y}}$ toward $\hat{\mathbf{z}}$, giving $(0, \cos 30^\circ, +\sin 30^\circ) = (0, 0.866, +0.500)$.

The observed result has $-0.500$. So it is the transpose: the passive transformation into a frame turned $+30^\circ$ about $\hat{\mathbf{x}}$ — the same thing as the active rotation through $-30^\circ$.

One test vector settled it. That is the general method: push a direction you understand through the matrix and compare with what the geometry says.
:::

::: check
A thruster's direction $\mathbf{t}$ is stored in body axes. The flight software needs it in the reference frame and has $q_{N\leftarrow B}$. Write the operation. Then say what the wrong version would cost on a vehicle that is currently $12^\circ$ from the reference attitude.
:::

::: answer
The thrust direction is a fixed physical arrow; you want its reference components. So

$$
[0,\mathbf{t}^{N}] = q_{N\leftarrow B}\otimes[0,\mathbf{t}^{B}]\otimes q_{N\leftarrow B}^{*},
\qquad\text{equivalently}\qquad
\mathbf{t}^{N} = \mathbf{C}(q_{N\leftarrow B})\,\mathbf{t}^{B}.
$$

The wrong version puts the conjugate on the other side and applies the inverse rotation. With the vehicle $12^\circ$ from the reference, the thrust direction comes out wrong by up to $2\times 12^\circ = 24^\circ$ — the full $2\Phi$ when the thrust axis is at right angles to the attitude's principal axis, less otherwise.

A burn pointed $24^\circ$ off loses $1 - \cos 24^\circ = 1 - 0.914 = 0.086$, about $8.6\%$, of the velocity change in the intended direction, and puts $\sin 24^\circ = 0.407$, about $41\%$, of it sideways.
:::

::: check
Explain why the active and passive readings agree exactly at the identity, and why that makes unit testing near zero attitude useless for finding the confusion.
:::

::: answer
At the identity, $\mathbf{I}_3^\top = \mathbf{I}_3$: the two readings are literally the same matrix.

More generally, using $\mathbf{C}^\top$ in place of $\mathbf{C}$ costs $2\Phi$ of pointing, which shrinks to zero along with $\Phi$. A test at $\Phi = 0.01^\circ$ sees a $0.02^\circ$ discrepancy — well inside any tolerance a test would use — and passes.

The test that finds the bug must run at a large attitude, $45^\circ$ or more, or must check the matrix against a geometry you know independently. Round-trip tests are especially bad at finding it. Applying a convention and then undoing it is self-consistent under *either* reading, so the round trip always comes back clean.
:::

::: check
Your library provides `from_axis_angle(axis, angle)`, and you need the coordinate transformation into a frame turned $+\theta$ about $\hat{\mathbf{n}}$. What do you call, and how do you check it in one line?
:::

::: answer
If the library is active, as most are, call `from_axis_angle(n, -theta)`. Equivalently, call `from_axis_angle(n, theta)` and take `.conjugate()` for a quaternion or `.transpose()` for a matrix.

To check: take $\hat{\mathbf{n}} = \hat{\mathbf{z}}$ and $\theta = 90^\circ$, and apply the result to $(1,0,0)$. The coordinate transformation must give $(0,-1,0)$. Here is why: the new second axis $\hat{\mathbf{y}}'$ has swung round to point along the old $-x$ direction, so the old $\hat{\mathbf{x}}$ lies along $-\hat{\mathbf{y}}'$, and its second component is $-1$. If you get $(0,+1,0)$, the library handed you the active matrix and you need the other one.
:::

::: check
A team reports that their attitude estimator "is fine until we manoeuvre, then the error grows with the slew angle, and it goes away when we return to the reference attitude". Name the most likely cause and the diagnostic.
:::

::: answer
A transpose somewhere: an active matrix used as passive, a quaternion used without its conjugate, or a Hamilton-against-JPL mix-up. All three produce the same swap of $\mathbf{C}^\top$ for $\mathbf{C}$.

The signature is exact. The error is $2\Phi$ (folded into $0^\circ$ to $180^\circ$). So it is zero at the reference attitude, grows in proportion to small slews, peaks at $180^\circ$ when the vehicle is $90^\circ$ from the reference, and falls back to zero at a $180^\circ$ slew.

The diagnostic has two steps. First, plot the reported error against the vehicle's principal angle from the reference and look for the factor of two. Then take a single sample, compute the estimate both with the suspect matrix and with its transpose, and see which one agrees with an independent measurement, such as a Sun sensor or a horizon crossing.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Active (operator) | Moves the vector within one frame: $\mathbf{v}' = \mathbf{R}\mathbf{v}$ |
| Passive (coordinate transformation) | Re-expresses one fixed vector in a turned frame: $\mathbf{v}^{A} = \mathbf{C}_{A\leftarrow B}\mathbf{v}^{B}$ |
| $\mathbf{R}_3(\theta) = \mathbf{R}_z(\theta)^\top = \mathbf{R}_z(-\theta)$ | Turning the frame forward equals turning the vector backward |
| $\mathbf{C}_{A\leftarrow B}$ read as an operator | Carries the $A$ triad onto the $B$ triad |
| $\mathbf{C}(q)$ in this module | The active matrix of $[\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$ |
| Passive elementary quaternion | Same angle, negated axis: $[\cos(\theta/2), -\hat{\mathbf{n}}\sin(\theta/2)]$ |
| Composition | Active in a fixed frame: most recent leftmost. Passive: match neighbouring labels |
| Cost of confusing them | Exactly $2\Phi$ of pointing error; zero at the identity |
| Diagnostic | Push one known vector through the matrix; check the sign of the result |
| Worked figures | A $0.8^\circ$ misalignment used transposed gives $1.496^\circ$ on the boresight, $1.600^\circ$ at worst; a $45^\circ$ gyro mount gives resolved rates exactly $90^\circ$ apart |

Every convention is now named and pinned down. The next lesson uses them for the quantity attitude control and estimation actually work with: not the attitude itself, but the error between two attitudes.

::: context operator-word What "operator" means
In mathematics an operator is anything that takes an object and gives back another object of the same kind. A rotation operator takes an arrow and hands back a turned arrow. Think of a machine on a conveyor belt: a box goes in, a turned box comes out. A coordinate transformation is not a machine at all. It is a new ruler held up against the same box.
:::

::: context transpose-grid The transpose, drawn
Transposing a matrix flips it across its main diagonal: row 1 becomes column 1, and so on. For the $30^\circ$ turn about $z$, only the two sine entries move: the $+0.5$ and the $-0.5$ swap places.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1" fill="#fff">
    <rect x="20" y="30" width="46" height="28"/><rect x="66" y="30" width="46" height="28" fill="#f2b880"/><rect x="112" y="30" width="46" height="28"/>
    <rect x="20" y="58" width="46" height="28" fill="#8fb8f0"/><rect x="66" y="58" width="46" height="28"/><rect x="112" y="58" width="46" height="28"/>
    <rect x="20" y="86" width="46" height="28"/><rect x="66" y="86" width="46" height="28"/><rect x="112" y="86" width="46" height="28"/>
    <rect x="202" y="30" width="46" height="28"/><rect x="248" y="30" width="46" height="28" fill="#8fb8f0"/><rect x="294" y="30" width="46" height="28"/>
    <rect x="202" y="58" width="46" height="28" fill="#f2b880"/><rect x="248" y="58" width="46" height="28"/><rect x="294" y="58" width="46" height="28"/>
    <rect x="202" y="86" width="46" height="28"/><rect x="248" y="86" width="46" height="28"/><rect x="294" y="86" width="46" height="28"/>
  </g>
  <line x1="20" y1="30" x2="158" y2="114" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="202" y1="30" x2="340" y2="114" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4,3"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="43" y="49">0.866</text><text x="89" y="49">−0.5</text><text x="135" y="49">0</text>
    <text x="43" y="77">0.5</text><text x="89" y="77">0.866</text><text x="135" y="77">0</text>
    <text x="43" y="105">0</text><text x="89" y="105">0</text><text x="135" y="105">1</text>
    <text x="225" y="49">0.866</text><text x="271" y="49">0.5</text><text x="317" y="49">0</text>
    <text x="225" y="77">−0.5</text><text x="271" y="77">0.866</text><text x="317" y="77">0</text>
    <text x="225" y="105">0</text><text x="271" y="105">0</text><text x="317" y="105">1</text>
    <text x="89" y="20">active R_z(30°)</text><text x="271" y="20">passive R_3(30°)</text>
    <text x="180" y="76">↔</text>
  </g>
  <text x="180" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">mirror across the dashed diagonal</text>
</svg>
```
:::

::: context two-pictures Chair turns, or you walk round
On the left, the axes stay put and the arrow turns $30^\circ$: its $y$ component is $+0.5$. On the right, the arrow stays put and the axes turn $30^\circ$: measured against the new axes $x'$ and $y'$, the arrow is $30^\circ$ *below* $x'$, so its $y'$ component is $-0.5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="60" y1="150" x2="165" y2="150"/><line x1="60" y1="150" x2="60" y2="45"/>
    <line x1="210" y1="150" x2="315" y2="150" stroke-dasharray="4,3"/><line x1="210" y1="150" x2="210" y2="45" stroke-dasharray="4,3"/>
  </g>
  <line x1="60" y1="150" x2="146.6" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="146.6,100.0 137.0,111.3 132.0,102.7" fill="#1d6fd1"/>
  <line x1="60" y1="150" x2="146.6" y2="150" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="3,3"/>
  <path d="M100,150 A40,40 0 0,0 94.64,130" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="108" y="140" font-size="11" fill="#1f2a44">30°</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="210" y1="150" x2="296.6" y2="100"/><line x1="210" y1="150" x2="160" y2="63.4"/>
  </g>
  <line x1="210" y1="150" x2="305" y2="150" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="310,150 298,144 298,156" fill="#1d6fd1"/>
  <path d="M250,150 A40,40 0 0,0 244.64,130" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="258" y="140" font-size="11" fill="#1f2a44">30°</text>
  <g font-size="12" fill="#1f2a44">
    <text x="168" y="154">x</text><text x="54" y="40">y</text>
    <text x="300" y="96" fill="#b4232c">x′</text><text x="146" y="60" fill="#b4232c">y′</text>
  </g>
  <text x="100" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">active: arrow turns</text>
  <text x="255" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">passive: axes turn</text>
</svg>
```
:::

::: context triad-word Why "triad"
A triad is a group of three. Engineers use it for the three unit arrows $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$, $\hat{\mathbf{z}}$ that make up a frame, because the frame *is* those three arrows and nothing more. "Carry the reference triad onto the body triad" means: turn the three reference arrows until they lie exactly along the body's three arrows.
:::

::: context eigen-active Libraries pick a side
Most general-purpose libraries — Eigen's `AngleAxis`, graphics engines, robotics toolkits — build the active matrix: hand them an axis and a positive angle and they turn vectors counter-clockwise about that axis. Many spacecraft attitude textbooks instead build the passive attitude matrix from the same inputs. Neither is wrong. The bug appears only when code written with one in mind calls a library built on the other, so read the library's documentation and then test it with one known vector.
:::

::: context star-tracker How a star tracker works
A star tracker is a small digital camera with a computer attached. It photographs a patch of sky, finds the bright dots, matches their pattern against a catalogue of thousands of stars, and works out which way the camera is pointing — often to a few arcseconds, about a thousandth of a degree. Because it measures the camera's attitude, the spacecraft must know exactly how the camera is bolted on. That is the alignment matrix, and it is measured on the ground before launch.
:::

::: context boresight-gap Why the boresight moves less than 2Φ
A turn through angle $\beta$ about an axis moves an arrow that sits at angle $\alpha$ from that axis through
$$
2\arcsin\bigl(\sin\alpha\,\sin(\beta/2)\bigr).
$$
An arrow at right angles ($\alpha = 90^\circ$) moves the full $\beta$. An arrow along the axis ($\alpha = 0$) does not move at all. Here the boresight is $\alpha = 69.2^\circ$ from the misalignment axis and $\beta = 2\Phi = 1.6^\circ$, giving $2\arcsin(0.935\times 0.01396) = 1.496^\circ$. Think of a spinning top: points near the axle barely move.
:::

::: context gyro-mount The gyro axis, right and wrong
The gyro's first axis really points at $+45^\circ$ in the body $xy$ plane (blue). Using the matrix without its transpose puts it at $-45^\circ$ (red). The two are $90^\circ$ apart: $2\Phi$ with $\Phi = 45^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="95" x2="260" y2="95" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="150" y1="95" x2="150" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="266" y="99" font-size="12" fill="#1f2a44">body x</text>
  <text x="130" y="12" font-size="12" fill="#1f2a44">body y</text>
  <line x1="150" y1="95" x2="206.57" y2="38.43" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="210.1,34.9 203.7,48.3 196.7,41.3" fill="#1d6fd1"/>
  <line x1="150" y1="95" x2="206.57" y2="151.57" stroke="#b4232c" stroke-width="3"/>
  <polygon points="210.1,155.1 196.7,148.7 203.7,141.7" fill="#b4232c"/>
  <path d="M171.21,73.79 A30,30 0 0,1 171.21,116.21" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="186" y="99" font-size="11" fill="#1f2a44">90°</text>
  <text x="218" y="36" font-size="12" fill="#1d6fd1">+45°: correct</text>
  <text x="218" y="164" font-size="12" fill="#b4232c">−45°: transposed</text>
</svg>
```
:::

::: context polarity-test A mounting error that reached the ground
In 2004 NASA's Genesis capsule, returning samples of the solar wind, hit the Utah desert at high speed because its parachutes never opened. The investigation found that the tiny acceleration sensors meant to detect atmospheric entry had been drawn into the design upside down, so they never sensed the slowing that should have triggered the parachutes. It was an orientation error, not a transpose, but the lesson is the same: move each sensor in a known direction on the ground and check the sign that comes out.
:::

::: context frame-types Letting the compiler check frames
In languages such as C++ or Rust, a vector can carry its frame as part of its type — `Vec3<Body>` instead of plain `Vec3`. A rotation then has a type like `Rotation<Body, Sensor>`, and multiplying it by a `Vec3<Nav>` is a compile error rather than a silent wrong answer. Some robotics and flight software libraries are built this way, so a whole class of transpose bugs can never reach the vehicle.
:::
