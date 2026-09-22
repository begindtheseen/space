---
id: l11-active-versus-passive-rotation
title: Active against passive rotation, operator against coordinate transformation
minutes: 18
covers:
  - active vs passive rotation (operator vs coordinate transformation)
---

A $3\times 3$ orthonormal matrix with determinant $+1$ can mean two different things, and nothing about the matrix says which. It can be an **operator** that physically turns a vector within one fixed frame — the gimbal swings, the antenna slews, the vector ends up somewhere else. Or it can be a **coordinate transformation** that leaves the vector exactly where it is and re-expresses its components along a different set of axes — nothing moves, the numbers change. The first is called an *active* rotation, the second a *passive* rotation.

They are transposes of one another. That single sentence is the whole content of this lesson and the source of an entire category of flight software bugs, because a transpose error produces a matrix that passes every structural check: orthonormal, determinant $+1$, unit norm in quaternion form, sensible-looking numbers. Lesson 05 established that a transpose error costs exactly $2\Phi$ of pointing, which is zero at the identity attitude — so bench tests on a stationary vehicle find nothing, and the error appears in flight, growing with the manoeuvre.

The distinction has been deferred through this module with a note each time. Here it is settled, with the naming discipline that keeps it settled.

## The same turn, written twice

Take the elementary rotation about the third axis through $30^\circ$.

The **active** matrix turns a vector by $+30^\circ$ inside one frame. Its columns are the images of the basis vectors:

$$
\mathbf{R}_z(30^\circ) = \begin{bmatrix} 0.866025 & -0.500000 & 0\\ 0.500000 & 0.866025 & 0\\ 0 & 0 & 1\end{bmatrix},
\qquad
\mathbf{R}_z(30^\circ)\begin{bmatrix}1\\0\\0\end{bmatrix} = \begin{bmatrix}0.866025\\ 0.500000\\ 0\end{bmatrix}.
$$

The vector started along $\hat{\mathbf{x}}$ and has been carried $30^\circ$ toward $\hat{\mathbf{y}}$. Its second component is $+0.5$.

The **passive** matrix — module 15's $\mathbf{R}_3(30^\circ)$ — re-expresses a fixed vector in a frame that has itself been turned by $+30^\circ$:

$$
\mathbf{R}_3(30^\circ) = \begin{bmatrix} 0.866025 & 0.500000 & 0\\ -0.500000 & 0.866025 & 0\\ 0 & 0 & 1\end{bmatrix},
\qquad
\mathbf{R}_3(30^\circ)\begin{bmatrix}1\\0\\0\end{bmatrix} = \begin{bmatrix}0.866025\\ -0.500000\\ 0\end{bmatrix}.
$$

The vector has not moved. The new frame's first axis has moved $30^\circ$ ahead of it, so in the new coordinates the vector sits $30^\circ$ *behind* that axis and its second component is $-0.5$.

$$
\mathbf{R}_3(\theta) = \mathbf{R}_z(\theta)^{\top} = \mathbf{R}_z(-\theta).
$$

Turning the frame forward is the same arithmetic as turning the vector backward. Every statement about active and passive rotations is a restatement of that.

::: key Active against passive
An active (operator) rotation moves the vector within a fixed frame. A passive (coordinate transformation) rotation re-expresses the same physical vector in a rotated frame. They are transposes of one another, and conflating them is the other great source of silent sign errors.
:::

## Which one is the attitude matrix?

Both, depending on what you ask.

Read $\mathbf{C}_{N\leftarrow B}$ as a coordinate transformation and it is passive: it takes body components to reference components and moves nothing. Read the same matrix as an operator acting in the reference frame and it is the active rotation that carries the reference triad onto the body triad — which is exactly how lesson 04 assigned it a principal axis and angle through Rodrigues' formula. The two readings are consistent because $\mathbf{C}_{N\leftarrow B}$'s columns are the body axes in reference components, and a matrix whose columns are the images of the basis vectors is the operator that produces those images.

That is the useful way to hold it: **the matrix that takes $B$ components to $A$ components is the same matrix as the operator that carries the $A$ triad onto the $B$ triad.** Its transpose does both jobs the other way round.

So the elementary matrices of module 15, $\mathbf{R}_1$, $\mathbf{R}_2$, $\mathbf{R}_3$, are the ones with the *rotated* frame as the target: $\mathbf{R}_3(\psi) = \mathbf{C}_{N'\leftarrow N}$ where $N'$ is $N$ yawed by $+\psi$. That is why lesson 02's 3-2-1 sequence for $\mathbf{C}_{B\leftarrow N}$ is a product of $\mathbf{R}_k$ matrices in one order, and the quaternion chain for $q_{N\leftarrow B}$ runs the other way.

## The quaternion inherits it exactly

Under this module's Hamilton convention, $\mathbf{C}(q) = (w^2-\mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times]$ is the *active* matrix of the rotation $[\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$. So

$$
q\bigl(\mathbf{R}_z(30^\circ)\bigr) = [\,0.965926,\ 0,\ 0,\ +0.258819\,],
\qquad
q\bigl(\mathbf{R}_3(30^\circ)\bigr) = [\,0.965926,\ 0,\ 0,\ -0.258819\,],
$$

verified to exactly zero against the matrices above. The passive elementary rotation has the *negated* axis, because it equals the active rotation through $-30^\circ$. If a library's `from_axis_angle(axis, angle)` is active — as `Eigen::AngleAxis` is, and as the graphics convention generally is — then building a passive frame transformation from it requires negating the angle or conjugating the result, and doing neither is the same $2\Phi$ error in quaternion clothing.

::: example A star tracker alignment matrix used the wrong way
A star tracker is mounted with a small measured misalignment: $\Phi = 0.800^\circ$ about the axis $\hat{\mathbf{e}} = (0.202808,\ 0.912636,\ -0.354914)$. The alignment matrix $\mathbf{M}$ is stored in the spacecraft database, and the ingest code applies $\mathbf{M}^{\top}$ where $\mathbf{M}$ belongs.

The boresight in sensor axes is $\mathbf{b} = (0,0,1)$. Correctly transformed it is

$$
\mathbf{M}\mathbf{b} = (0.012735,\ -0.002863,\ 0.999915),
$$

and with the transpose,

$$
\mathbf{M}^{\top}\mathbf{b} = (-0.012749,\ 0.002800,\ 0.999915).
$$

Both are unit vectors to twelve digits. Both are within a degree and a half of the nominal boresight, so both look entirely reasonable in a plot. The angle between them is $1.496^\circ$ — and the principal angle of the relative rotation $\mathbf{M}\mathbf{M}$ is $1.600^\circ$, exactly $2\Phi$, which is the error a vector perpendicular to $\hat{\mathbf{e}}$ would suffer. The boresight gets $1.496^\circ$ rather than the full $1.600^\circ$ because it is not quite perpendicular to the misalignment axis.

For an imaging satellite specified to know its attitude to $0.01^\circ$, an error of $1.5^\circ$ is a hundred and fifty times the requirement and would be attributed to almost anything before the transpose — tracker bias, thermal distortion, a bad star catalogue — because the number is plausible and constant.
:::

::: example A rate gyro package, mounted at $45^\circ$
A three-axis gyro is bolted to a bracket rotated $45^\circ$ about the body $z$ axis, and reports $\boldsymbol{\omega}^{G} = (0.020,\ 0,\ 0)\,\mathrm{rad/s}$ about its own first axis. The database stores the passive matrix $\mathbf{R}_3(45^\circ) = \mathbf{C}_{G\leftarrow B}$.

The body rates are $\boldsymbol{\omega}^{B} = \mathbf{C}_{B\leftarrow G}\boldsymbol{\omega}^{G} = \mathbf{R}_3(45^\circ)^{\top}\boldsymbol{\omega}^{G} = (0.014142,\ 0.014142,\ 0)\,\mathrm{rad/s}$: equal parts roll and pitch, at $+45^\circ$ in the body $xy$ plane. Using the matrix without the transpose gives $(0.014142,\ -0.014142,\ 0)\,\mathrm{rad/s}$ — the same magnitude, $0.020\,\mathrm{rad/s}$, at $-45^\circ$ instead.

The two answers are exactly $90.000^\circ$ apart, which is $2\Phi$ for $\Phi = 45^\circ$. A controller fed the second one applies pitch torque where roll is needed and roll where pitch is needed, with the correct magnitudes throughout. Rate magnitude checks pass. Total angular momentum looks right. The vehicle diverges.

Notice how this one would be caught: exercise one axis at a time and watch the resolved rates. A pure gyro-$x$ input must produce body rates at $+45^\circ$; if it produces $-45^\circ$, the transpose is in the wrong place. That is a five-minute bench test and it is worth doing for every sensor and actuator on the vehicle.
:::

## Composition order is affected too

Active rotations applied successively in a **fixed** frame compose with the most recent on the left: apply $\mathbf{A}$, then $\mathbf{B}$, and the net operator is $\mathbf{B}\mathbf{A}$. Passive transformations chain by matching subscripts, $\mathbf{C}_{A\leftarrow C} = \mathbf{C}_{A\leftarrow B}\mathbf{C}_{B\leftarrow C}$, which reads left to right along the chain.

The two orders are genuinely different. With $\mathbf{A}$ a $50^\circ$ turn about $\hat{\mathbf{z}}$ and $\mathbf{B}$ a $30^\circ$ turn about $\hat{\mathbf{x}}$, the products $\mathbf{B}\mathbf{A}$ and $\mathbf{A}\mathbf{B}$ both have principal angle $57.809^\circ$ — equal, for the reason lesson 06 gave, since the scalar part of a quaternion product is symmetric in its arguments — and they are $25.119^\circ$ apart as attitudes.

This is the intrinsic-and-extrinsic reversal of lesson 02 in its general form. A sequence of active rotations about fixed axes, applied in one order, equals the same sequence of intrinsic rotations about moving axes applied in the opposite order. Two conventions, one relationship, appearing in every attitude library's documentation with different words.

::: warning Two wrong transposes can cancel, and then uncancel
The dangerous repair is the local one. A frame chain gives the wrong answer, a transpose is inserted where the test was failing, and the test passes — because a second convention error further along the chain was cancelling it, and now both are wrong in a compensating way. The chain is correct for the path that was tested and wrong for every other path through the same matrices. When a transpose fixes a symptom, find out which of the two conventions is actually wrong and fix that one; then re-run the paths that were previously passing.
:::

::: warning Vectors that live in one frame are immune, and that is the trap
Applying either convention to a vector whose frame does not change — normalising a measurement, comparing two directions already in the same axes — gives an answer that is wrong only by the rotation, which for small attitudes is small. So the bug hides in exactly the code that runs most often and is checked least. It emerges on the first large slew, at $2\Phi$, which is why the symptom is so often reported as "the estimator is fine until we manoeuvre".
:::

::: note Naming the matrices is the fix
Every convention argument in this module ends the same way: put the meaning in the name. `R_b_from_s` is unambiguous and reads correctly in a chain, `R_b_from_n @ n_vector`, with adjacent labels matching. `C_align`, `R_mount`, `dcm` and `q_body` are not names, they are placeholders, and no amount of commenting makes them safe. Where a language allows it, give the frames to the type system so that a mismatched product does not compile; where it does not, the naming convention is the only defence, and it works.
:::

## Check yourself

::: check
A matrix takes the vector $(0, 1, 0)$ to $(0, 0.866, -0.500)$. Is it an active rotation of $+30^\circ$ about $\hat{\mathbf{x}}$, or a passive one?
:::

::: answer
An active rotation of $+30^\circ$ about $\hat{\mathbf{x}}$ carries $\hat{\mathbf{y}}$ toward $\hat{\mathbf{z}}$, giving $(0, \cos 30^\circ, +\sin 30^\circ) = (0, 0.866, +0.500)$. The observed result has $-0.500$, so it is the transpose: the passive transformation into a frame rotated $+30^\circ$ about $\hat{\mathbf{x}}$, equivalently the active rotation through $-30^\circ$. This one test vector settles it, which is the general method — push a direction you understand through the matrix and compare with what geometry says.
:::

::: check
A thruster's direction is stored in body axes. The flight software needs it in the reference frame and has $q_{N\leftarrow B}$. Write the operation, and state what the wrong version would cost on a vehicle currently at $12^\circ$ from the reference attitude.
:::

::: answer
The thrust direction is a fixed physical vector; you want its reference components: $[0,\mathbf{t}^{N}] = q_{N\leftarrow B}\otimes[0,\mathbf{t}^{B}]\otimes q_{N\leftarrow B}^{*}$, equivalently $\mathbf{t}^{N} = \mathbf{C}(q_{N\leftarrow B})\,\mathbf{t}^{B}$. The wrong version conjugates the other way and applies the inverse rotation. At an attitude $12^\circ$ from the reference, the resulting thrust direction is wrong by $2\times 12^\circ = 24^\circ$ at worst — the full $2\Phi$ when the thrust axis is perpendicular to the attitude's principal axis, less otherwise. A burn executed $24^\circ$ off puts $1 - \cos 24^\circ = 8.7\%$ of the velocity change in the wrong direction and $\sin 24^\circ = 41\%$ across it.
:::

::: check
Explain why an active and a passive interpretation agree exactly at the identity, and why that makes unit testing near zero attitude useless for finding the confusion.
:::

::: answer
At the identity, $\mathbf{I}_3^\top = \mathbf{I}_3$: the two interpretations are the same matrix. More generally the discrepancy between $\mathbf{C}$ and $\mathbf{C}^\top$ as a pointing error is $2\Phi$, which goes to zero linearly as $\Phi$ does. So a test at $\Phi = 0.01^\circ$ sees a $0.02^\circ$ discrepancy, well inside any tolerance a test would use, and passes. The test that finds the bug has to run at a large attitude — $45^\circ$ or more — or has to check the matrix against an independently known geometry rather than against a round trip. Round trips are particularly bad at finding it, because applying a convention and then inverting it is self-consistent under either reading.
:::

::: check
Your library provides `from_axis_angle(axis, angle)` and you need the coordinate transformation into a frame rotated $+\theta$ about $\hat{\mathbf{n}}$. What do you call, and how do you verify it in one line?
:::

::: answer
If the library is active, as most are, call `from_axis_angle(n, -theta)`, or equivalently `from_axis_angle(n, theta).conjugate()` for a quaternion or `.transpose()` for a matrix. To verify in one line, take $\hat{\mathbf{n}} = \hat{\mathbf{z}}$, $\theta = 90^\circ$, and apply the result to $(1,0,0)$: the coordinate transformation must give $(0,-1,0)$, because the new frame's second axis has swung onto the old first axis, so the vector's second component is $-1$. If you get $(0,+1,0)$ the library gave you the active matrix and you need the other one.
:::

::: check
A team reports that their attitude estimator "is fine until we manoeuvre, then the error grows with the slew angle and comes back when we return to the reference attitude". Name the most likely cause and the diagnostic.
:::

::: answer
A transpose somewhere — an active matrix used as passive, a quaternion used without its conjugate, or a Hamilton-against-JPL mismatch, all of which produce the same $\mathbf{C}^\top$-for-$\mathbf{C}$ substitution. The signature is exact: the error is $2\Phi$, so it is zero at the reference attitude, grows proportionally with small slews, peaks at $180^\circ$ when the vehicle is $90^\circ$ from the reference, and returns to zero at $180^\circ$. The diagnostic is to plot the reported error against the vehicle's principal angle from the reference and check for the factor of two; then take a single sample, compute the estimate both with the suspect matrix and with its transpose, and see which agrees with an independent measurement such as a Sun sensor or a horizon crossing.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Active (operator) | Moves the vector within one frame; $\mathbf{v}' = \mathbf{R}\mathbf{v}$ |
| Passive (coordinate transformation) | Re-expresses one fixed vector in a rotated frame; $\mathbf{v}^{A} = \mathbf{C}_{A\leftarrow B}\mathbf{v}^{B}$ |
| $\mathbf{R}_3(\theta) = \mathbf{R}_z(\theta)^\top = \mathbf{R}_z(-\theta)$ | Turning the frame forward equals turning the vector backward |
| $\mathbf{C}_{A\leftarrow B}$ read as an operator | Carries the $A$ triad onto the $B$ triad |
| $\mathbf{C}(q)$ in this module | The active matrix of $[\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$ |
| Passive elementary quaternion | Same angle, negated axis: $[\cos(\theta/2), -\hat{\mathbf{n}}\sin(\theta/2)]$ |
| Composition | Active in a fixed frame: most recent leftmost. Passive: match adjacent subscripts |
| Cost of confusing them | Exactly $2\Phi$ of pointing error; zero at the identity |
| Diagnostic | Push one known vector through the matrix; check the sign of the second component |
| Worked figures | $0.8^\circ$ misalignment used transposed gives $1.496^\circ$ on the boresight, $1.600^\circ$ at worst; a $45^\circ$ gyro mount gives resolved rates exactly $90^\circ$ apart |

The conventions are now all named and pinned. The next lesson uses them for the quantity attitude control and estimation actually consume: not the attitude, but the error between two attitudes.
