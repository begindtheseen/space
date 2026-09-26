---
id: l04-euler-rotation-theorem-and-the-principal-axis
title: Euler rotation theorem, principal rotation axis and angle
minutes: 22
covers:
  - Euler rotation theorem, principal rotation axis and angle
---

Pick up a book and turn it around a few times — tip it forward, spin it, flip it on its side. Put it down. Here is a surprising fact: there is one straight line you could have pushed a skewer through, and one single turn about that skewer, that would have taken the book from where it started to where it ended, in one smooth move. However many turns you made, one would have done.

That fact is **Euler's rotation theorem**. The mathematician [[Leonhard Euler|euler-1775]] proved it in 1775. The skewer is called the **principal rotation axis** — the one line the whole move turns about. The amount of turn is the **principal rotation angle**. Together they are the thriftiest honest description of an attitude: two numbers for the axis direction (it is a unit arrow, so three components with one rule) and one number for the angle.

This is not a curiosity. On a spacecraft the principal angle between two attitudes *is* the pointing error. When a requirement says "attitude knowledge better than $0.02^\circ$", that $0.02^\circ$ is a principal angle. When a slew planner turns the vehicle from one target to the next, the shortest turn is about the principal axis of the difference. And the principal axis and angle are the parents of the quaternion (built from half the angle) and of both Rodrigues parameter sets (built from tangents of a half and a quarter of the angle). Get comfortable here and the next five lessons are bookkeeping.

## Euler's rotation theorem

Think of a spinning globe. Every city on it moves — except two spots: the North Pole and the South Pole. Those two, and every point on the line through the middle joining them, stay exactly where they are. That line is the axis.

Euler's theorem says every rotation is like the globe: there is always a line that does not move. Here is the precise statement.

> Any orientation of a rigid body relative to a reference frame can be reached by a single rotation through a principal angle $\Phi$ about a fixed principal axis $\hat{\mathbf{e}}$.

Read $\Phi$ as "capital phi" and $\hat{\mathbf{e}}$ as "e-hat"; the hat marks a unit arrow. A **[[rigid body|rigid-body]]** is an object that does not bend or stretch, so every part of it turns together.

In matrix language, the claim is that every rotation matrix $\mathbf{C}$ in $SO(3)$ (the set of valid DCMs from lesson 01) has an arrow it leaves alone:

$$
\mathbf{C}\,\hat{\mathbf{e}} = \hat{\mathbf{e}} .
$$

A direction that a matrix does not turn, only stretches, is called an **[[eigenvector|eigen-word]]**, and the stretch factor is its **eigenvalue**. Here the stretch factor is $1$ — the axis is not even stretched. So the theorem says: every rotation matrix has an eigenvalue equal to $1$, and the unit eigenvector that goes with it is the principal axis.

::: note Why it has to be true
We show that $\det(\mathbf{C} - \mathbf{I}_3) = 0$. A zero determinant means some nonzero arrow $\hat{\mathbf{e}}$ gives $(\mathbf{C} - \mathbf{I}_3)\hat{\mathbf{e}} = \mathbf{0}$, which is exactly $\mathbf{C}\hat{\mathbf{e}} = \hat{\mathbf{e}}$. Use the two rules a rotation obeys: $\mathbf{C}\mathbf{C}^\top = \mathbf{I}_3$ and $\det\mathbf{C} = +1$.

$$
\det(\mathbf{C} - \mathbf{I}_3)
= \det(\mathbf{C} - \mathbf{C}\mathbf{C}^{\top})
= \det\mathbf{C}\,\det(\mathbf{I}_3 - \mathbf{C}^{\top})
= \det\bigl((\mathbf{I}_3 - \mathbf{C})^{\top}\bigr)
= \det(\mathbf{I}_3 - \mathbf{C}).
$$

Step by step: the first equals sign swaps $\mathbf{I}_3$ for $\mathbf{C}\mathbf{C}^\top$ (they are equal). The second pulls out the common factor $\mathbf{C}$ on the left, and the determinant of a product is the product of determinants. The third uses $\det\mathbf{C} = +1$ and writes $\mathbf{I}_3 - \mathbf{C}^\top$ as a transpose. The last uses the fact that a transpose does not change a determinant.

Now $\mathbf{I}_3 - \mathbf{C} = -(\mathbf{C} - \mathbf{I}_3)$. Multiplying a $3\times 3$ matrix by $-1$ multiplies its determinant by $(-1)^3 = -1$. So $\det(\mathbf{C}-\mathbf{I}_3) = -\det(\mathbf{C}-\mathbf{I}_3)$. The only number equal to its own negative is zero:

$$
\det(\mathbf{C} - \mathbf{I}_3) = 0 .
$$

Both rotation rules were needed. A mirror reflection has $\det = -1$, and the argument fails — correctly, because a mirror has no fixed axis, only a fixed plane. And the dimension entered through $(-1)^3$. That is why the theorem is about [[odd numbers of dimensions|odd-dimensions]] like our three; in four dimensions a rotation can leave no direction fixed at all.
:::

### The axis looks the same from both frames

Because $\mathbf{C}\hat{\mathbf{e}} = \hat{\mathbf{e}}$, the principal axis has **the same components in both frames**. Converting it from reference axes to body axes gives back the same three numbers. It is the only direction with that property.

That makes a handy check. If an arrow you believe is the rotation axis comes out different in the two frames, something else is wrong.

### The angle hides in the trace

A $3\times 3$ matrix has three eigenvalues. We know one is $1$. The other two follow from three facts:

- A rotation keeps lengths, so every eigenvalue has size $1$.
- The three multiply to $\det\mathbf{C} = +1$.
- For a real matrix, [[complex eigenvalues|complex-pair]] come in mirror-image pairs $a \pm bi$.

The only way to satisfy all three is

$$
\{\,1,\ e^{i\Phi},\ e^{-i\Phi}\,\},
$$

where $e^{i\Phi} = \cos\Phi + i\sin\Phi$ is the length-one complex number at angle $\Phi$, from the trigonometry module. The angle of that complex pair is the principal angle.

Now a shortcut. The **[[trace|trace-word]]** of a matrix, written $\operatorname{tr}\mathbf{C}$, is the sum of the three numbers on its main diagonal. It is also always the sum of the eigenvalues. Adding them, the imaginary parts cancel and the real parts double:

$$
\operatorname{tr}\mathbf{C} = 1 + (\cos\Phi + i\sin\Phi) + (\cos\Phi - i\sin\Phi) = 1 + 2\cos\Phi .
$$

Solve for the angle:

$$
\cos\Phi = \frac{\operatorname{tr}\mathbf{C} - 1}{2}
\qquad\Longrightarrow\qquad
\Phi = \arccos\frac{\operatorname{tr}\mathbf{C} - 1}{2} \in [0, \pi].
$$

Sanity check with no rotation at all: $\mathbf{C} = \mathbf{I}_3$ has trace $3$, so $\cos\Phi = 1$ and $\Phi = 0$. And a half turn about $x$, $\operatorname{diag}(1,-1,-1)$, has trace $-1$, so $\cos\Phi = -1$ and $\Phi = 180^\circ$. Both right.

The angle always comes out between $0$ and $180^\circ$, because $\arccos$ only returns that range. A turn of $250^\circ$ one way is a turn of $110^\circ$ the other way about the reversed axis, so nothing is lost.

::: key Euler rotation theorem and the principal angle
Any orientation of a rigid body relative to a reference frame is reachable by one rotation through a principal angle $\Phi$ about a fixed principal axis $\hat{\mathbf{e}}$. Equivalently, every $\mathbf{C}\in SO(3)$ has eigenvalue $1$ with eigenvector $\hat{\mathbf{e}}$, and eigenvalues $e^{\pm i\Phi}$. The axis has the same components in both frames. Three parameters always suffice — and always come with a singularity somewhere.
:::

::: key Principal angle from a DCM
$\cos\Phi = (\operatorname{tr}(\mathbf{C}) - 1)/2$, so $\Phi = \arccos\bigl((\operatorname{tr}(\mathbf{C}) - 1)/2\bigr) \in [0, \pi]$. The axis comes from the skew part of $\mathbf{C}$, or safely from the quaternion.
:::

## Building the matrix: Rodrigues' formula

Now go the other way: given an axis and an angle, write down the matrix.

Picture a [[door on its hinge|hinge-split]]. The hinge is the axis. Take any arrow $\mathbf{v}$ and split it into two pieces: the part along the hinge, and the part sticking straight out from it. When the door swings, the part along the hinge does not move at all. The part sticking out swings around in a circle, like the edge of the door. That is the whole idea.

In symbols, the two pieces are

$$
\mathbf{v}_\parallel = (\hat{\mathbf{e}}\cdot\mathbf{v})\,\hat{\mathbf{e}},
\qquad
\mathbf{v}_\perp = \mathbf{v} - \mathbf{v}_\parallel .
$$

Read $\mathbf{v}_\parallel$ as "v parallel" (the piece along the axis) and $\mathbf{v}_\perp$ as "v perp" (the piece perpendicular to it).

To swing $\mathbf{v}_\perp$ through the angle $\Phi$, we need a second arrow in the same flat circle, at a right angle to it. The cross product $\hat{\mathbf{e}}\times\mathbf{v}$ is exactly that: it is perpendicular to the axis and to $\mathbf{v}_\perp$, and it has the same length as $\mathbf{v}_\perp$. (Also $\hat{\mathbf{e}}\times\mathbf{v} = \hat{\mathbf{e}}\times\mathbf{v}_\perp$, because the parallel piece crosses to zero.) Turning through $\Phi$ in that plane is then the usual "cosine of one, sine of the other":

$$
\mathbf{v}' = \mathbf{v}_\parallel + \cos\Phi\,\mathbf{v}_\perp + \sin\Phi\,(\hat{\mathbf{e}}\times\mathbf{v}) .
$$

Here $\mathbf{v}'$ ("v prime") is the turned arrow.

To make this a matrix, use the **cross-product matrix** $[\hat{\mathbf{e}}\times]$ from module 14 — the $3\times 3$ matrix that does "cross with $\hat{\mathbf{e}}$" when you multiply by it. Two facts about it do the work:

- $[\hat{\mathbf{e}}\times]\mathbf{v} = \hat{\mathbf{e}}\times\mathbf{v}$, by definition.
- $[\hat{\mathbf{e}}\times]^2 = \hat{\mathbf{e}}\hat{\mathbf{e}}^\top - \mathbf{I}_3$. So $[\hat{\mathbf{e}}\times]^2\mathbf{v} = \mathbf{v}_\parallel - \mathbf{v} = -\mathbf{v}_\perp$. Crossing twice with the axis kills the parallel piece and flips the perpendicular piece.

Now rewrite the first two terms: $\mathbf{v}_\parallel + \cos\Phi\,\mathbf{v}_\perp = \mathbf{v} - (1-\cos\Phi)\,\mathbf{v}_\perp$. Replace $-\mathbf{v}_\perp$ by $[\hat{\mathbf{e}}\times]^2\mathbf{v}$ and $\hat{\mathbf{e}}\times\mathbf{v}$ by $[\hat{\mathbf{e}}\times]\mathbf{v}$, and pull out $\mathbf{v}$:

$$
\mathbf{R}(\hat{\mathbf{e}}, \Phi) = \mathbf{I}_3 + \sin\Phi\,[\hat{\mathbf{e}}\times] + (1-\cos\Phi)\,[\hat{\mathbf{e}}\times]^2 .
$$

This is **Rodrigues' rotation formula**. Its trace agrees with what we found before. $[\hat{\mathbf{e}}\times]$ has zeros down its diagonal, so its trace is $0$. And $\operatorname{tr}[\hat{\mathbf{e}}\times]^2 = \operatorname{tr}(\hat{\mathbf{e}}\hat{\mathbf{e}}^\top) - 3 = 1 - 3 = -2$. So $\operatorname{tr}\mathbf{R} = 3 - 2(1-\cos\Phi) = 1 + 2\cos\Phi$. Same answer, two different roads.

### Which matrix is it?

$\mathbf{R}(\hat{\mathbf{e}},\Phi)$ is an **operator**: it moves an arrow to a new place within one frame. Applied to attitude, it is the matrix that carries the reference axes onto the body axes. By lesson 01, that is the attitude matrix $\mathbf{C}_{N\leftarrow B}$ ("C, N from B").

Its transpose, $\mathbf{C}_{B\leftarrow N}$, has the same principal angle and the opposite axis, because

$$
\mathbf{R}(\hat{\mathbf{e}},\Phi)^\top = \mathbf{R}(-\hat{\mathbf{e}},\Phi) = \mathbf{R}(\hat{\mathbf{e}},-\Phi).
$$

Turning backward about an axis is the same as turning forward about the reversed axis. Lesson 11 makes this distinction its whole subject. For now, the habit is: name the matrix before you name its axis.

### Getting the axis back out

Rodrigues' formula has two kinds of pieces. $[\hat{\mathbf{e}}\times]$ is **skew** — flipping it across its diagonal (transposing) changes its sign. $[\hat{\mathbf{e}}\times]^2$ and $\mathbf{I}_3$ are **symmetric** — transposing leaves them alone. So subtracting and adding the transpose pulls the two kinds apart:

$$
\mathbf{R} - \mathbf{R}^{\top} = 2\sin\Phi\,[\hat{\mathbf{e}}\times],
\qquad
\mathbf{R} + \mathbf{R}^{\top} = 2\cos\Phi\,\mathbf{I}_3 + 2(1-\cos\Phi)\,\hat{\mathbf{e}}\hat{\mathbf{e}}^{\top} .
$$

The first gives the axis straight from the off-diagonal entries. Here $R_{32}$ means the entry in row 3, column 2:

$$
\hat{\mathbf{e}} = \frac{1}{2\sin\Phi}
\begin{bmatrix} R_{32} - R_{23}\\ R_{13} - R_{31}\\ R_{21} - R_{12}\end{bmatrix}.
$$

Use it whenever $\sin\Phi$ is not small. Two cases break it.

- **$\Phi = 0$.** The matrix is $\mathbf{I}_3$, the skew part is zero, and there really is no axis: no turn has no axis. Any unit arrow will do. Code should return a fixed default instead of dividing by zero.
- **$\Phi = 180^\circ$.** Now $\sin\Phi = 0$, but the turn is real. The matrix is symmetric, so the skew part vanishes and the formula reads $0/0$. The axis survives only in the symmetric part. With $\cos\Phi = -1$, the second identity reads $\mathbf{R} + \mathbf{R}^\top = -2\mathbf{I}_3 + 4\hat{\mathbf{e}}\hat{\mathbf{e}}^\top$, so $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top = (\mathbf{R} + \mathbf{I}_3)/2$. The diagonal gives the sizes $\lvert e_i\rvert = \sqrt{(R_{ii}+1)/2}$. Pick the largest (so you never divide by a small number) and read the other signs from that row of $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top$. The overall sign is free, because a half turn about $\hat{\mathbf{e}}$ and about $-\hat{\mathbf{e}}$ are the same move.

Those two cases are no accident. Axis and angle is a three-number description, and every three-number description of attitude has a bad spot somewhere: Euler angles have gimbal lock (lesson 03), and axis and angle lose the axis at $0^\circ$ and give two answers at $180^\circ$. Three numbers always suffice, but always with a singularity. Lesson 13 shows why no clever choice can avoid it, and the quaternion's escape is a fourth number.

Near $180^\circ$ — close but not at it — both formulas are shaky. $\sin\Phi$ is small, so the first divides by a small number. And $\arccos$ is [[infinitely steep at its ends|arccos-steep]], so $\Phi$ itself is noisy. Lesson 10 gives the branch-selection method that handles the whole range at once. That is why production code pulls a quaternion out of a matrix, not an axis and angle.

::: example Principal axis and angle of a vehicle attitude
Take the gravity-turn attitude of lesson 02: heading $15^\circ$, pitch $50^\circ$, bank $5^\circ$. What single turn produces it?

**The angle.** The attitude matrix is $\mathbf{C}_{N\leftarrow B} = \mathbf{C}_{B\leftarrow N}^{\top}$. A transpose keeps the diagonal, so the trace is the same. Add the diagonal:

$$
\operatorname{tr}\mathbf{C} = 0.620885 + 0.979530 + 0.640342 = 2.240757 .
$$

Subtract $1$ and halve:

$$
\cos\Phi = \frac{2.240757 - 1}{2} = 0.620379, \qquad \Phi = \arccos(0.620379) = 51.656^\circ .
$$

**The axis.** Here $2\sin\Phi = 1.568605$. Take the three differences of off-diagonal entries of $\mathbf{C}_{N\leftarrow B}$ and divide by that:

$$
\hat{\mathbf{e}} = (-0.036532,\ 0.972666,\ 0.229318),
\qquad \lVert\hat{\mathbf{e}}\rVert = 1.000000 .
$$

So the vehicle's attitude is one turn of $51.66^\circ$ about an axis lying almost along the reference east direction, tipped a little toward down. Does that make sense? Yes: pitching the nose up $50^\circ$ is most of what happened, and pitch in a north-east-down frame is a turn about east. The small heading and bank tip the axis a bit.

**Checks.** First, $\mathbf{C}_{N\leftarrow B}\hat{\mathbf{e}} - \hat{\mathbf{e}} = (0,0,0)$ to within $10^{-16}$, so the axis really is left alone. Second, rebuilding the matrix from Rodrigues' formula matches $\mathbf{C}_{N\leftarrow B}$ to within $1.1\times 10^{-16}$. Third, a library eigenvalue routine returns $1$ and $0.620379 \pm 0.784303i$. The angle of that complex pair is $51.656^\circ$ — the principal angle again.
:::

::: example A 180° rotation, where the usual formula fails
Turn by $180^\circ$ about $\hat{\mathbf{e}} = (1, 2, 2)/3$. (Check the length: $\sqrt{1 + 4 + 4}/3 = 3/3 = 1$.)

**Build it.** With $\sin\Phi = 0$ and $1 - \cos\Phi = 2$, Rodrigues gives $\mathbf{R} = \mathbf{I}_3 + 2[\hat{\mathbf{e}}\times]^2 = 2\hat{\mathbf{e}}\hat{\mathbf{e}}^\top - \mathbf{I}_3$:

$$
\mathbf{R} = \begin{bmatrix}
-0.777778 & 0.444444 & 0.444444\\
0.444444 & -0.111111 & 0.888889\\
0.444444 & 0.888889 & -0.111111
\end{bmatrix},
\qquad \operatorname{tr}\mathbf{R} = -1.000000 .
$$

**Angle.** $\cos\Phi = (-1 - 1)/2 = -1$, so $\Phi = 180.0^\circ$. Good.

**Axis, the usual way.** The matrix is symmetric, so $\mathbf{R}-\mathbf{R}^\top$ is exactly zero, and the formula reads $0/0$. Dead end.

**Axis, the symmetric way.** Form $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top = (\mathbf{R}+\mathbf{I}_3)/2$. Its diagonal is $(0.111111,\ 0.444444,\ 0.444444)$. Square roots give the sizes of the axis components: $(0.333333,\ 0.666667,\ 0.666667)$. The largest is the second (tied with the third). Divide the second row of $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top$, which is $(0.222222, 0.444444, 0.444444)$, by $0.666667$:

$$
\hat{\mathbf{e}} = (0.333333,\ 0.666667,\ 0.666667) = (1,2,2)/3 .
$$

All signs positive — exactly the axis we built it with. Its negative describes the same turn.

**A look-alike.** Now try $\mathbf{R} = \operatorname{diag}(1,-1,-1)$. The trace is $1 - 1 - 1 = -1$ again, so $\Phi = 180^\circ$. And $(\mathbf{R}+\mathbf{I}_3)/2 = \operatorname{diag}(1,0,0)$ gives $\hat{\mathbf{e}} = (1,0,0)$. Its determinant is $(1)(-1)(-1) = +1$, so despite the two negative entries it is a real rotation — a half turn about $x$ — not a mirror.
:::

::: example What a principal angle costs in slew time
Now let the same $\Phi = 51.656^\circ$ be the error between where a spacecraft points and where it must point. The shortest turn is about the principal axis, so the move is a single-axis **slew** — a planned turn — through $51.656^\circ$.

The reaction wheels can give $0.02^\circ/\mathrm{s^2}$ of angular acceleration, and the spin rate is capped at $0.5^\circ/\mathrm{s}$. The plan is a [[speed-up, cruise, slow-down profile|slew-profile]].

**Speed up.** Reaching the rate cap takes $t_1 = 0.5 / 0.02 = 25.0\,\mathrm{s}$. The angle covered is $\tfrac12 \times 0.02 \times 25^2 = 6.25^\circ$.

**Slow down.** Braking is the mirror image: another $25.0\,\mathrm{s}$ and $6.25^\circ$. The two ramps cover $12.50^\circ$ together.

**Cruise.** What is left is $51.656 - 12.50 = 39.156^\circ$, flown at $0.5^\circ/\mathrm{s}$. That takes $39.156 / 0.5 = 78.31\,\mathrm{s}$.

**Total.**

$$
t = 2 \times 25.0 + 78.31 = 128.3\,\mathrm{s}.
$$

Sanity check: flying the whole $51.656^\circ$ at the cap would take $103.3\,\mathrm{s}$, and the ramps must add some time on top, so a bit over two minutes is right.

Any other path turns through more angle and so, with these limits, takes longer. That is why slew planning starts by pulling out the principal angle of the error. It is also why a $180^\circ$ error is the worst case a momentum-limited spacecraft has to be sized for.
:::

::: warning Principal angles do not add
The principal angle is not a distance you can pile up along a string of moves. Turn $90^\circ$ about the $x$ axis, then $90^\circ$ about the fixed $z$ axis. The combined matrix $\mathbf{R}_z\mathbf{R}_x$ has trace $0.000000$, so $\cos\Phi = (0 - 1)/2 = -0.5$ and $\Phi = 120.0^\circ$, about the axis $(1,1,1)/\sqrt{3}$. Two $90^\circ$ turns make one $120^\circ$ turn, not $180^\circ$. Only turns about a *shared* axis combine by adding angles. This is another face of the fact from lesson 01 that the order of turns matters.
:::

::: warning arccos is a poor way to measure a small angle
Near $\Phi = 0$, $\operatorname{tr}\mathbf{C} = 1 + 2\cos\Phi \approx 3 - \Phi^2$. So recovering a small $\Phi$ means taking $\arccos$ of a number within $\Phi^2/2$ of $1$. At $\Phi = 10^{-5}\,\mathrm{rad}$ the trace differs from $3$ by only $10^{-10}$ — close to the round-off floor of a sum of three numbers near $1$ — and the recovered angle carries several digits of noise. For attitude *errors*, which are small by design, take the angle from the quaternion instead: $\Phi = 2\arcsin\lVert\mathbf{q}_v\rVert$, where $\lVert\mathbf{q}_v\rVert$ is the length of the quaternion's vector part (lesson 05). It is accurate right down to zero, because $\lVert\mathbf{q}_v\rVert$ is itself small and nothing cancels.
:::

## Check yourself

::: check
A DCM has trace $2.5$. What is its principal angle? How much does the angle change if the trace is off by $0.001$?
:::

::: answer
**Angle.** $\cos\Phi = (2.5-1)/2 = 0.75$, so $\Phi = \arccos 0.75 = 41.41^\circ = 0.7227\,\mathrm{rad}$.

**Sensitivity.** Take the change of both sides of $\cos\Phi = (\operatorname{tr}-1)/2$: $-\sin\Phi\,d\Phi = d(\operatorname{tr})/2$. So $d\Phi = -d(\operatorname{tr})/(2\sin\Phi)$. Here $\sin\Phi = 0.6614$, giving $d\Phi = -0.001/(2\times 0.6614) = -7.6\times 10^{-4}\,\mathrm{rad} = -0.043^\circ$. A part-per-thousand error in the trace moves the angle four hundredths of a degree. Acceptable.

**The same at $\Phi = 1^\circ$.** Now $\sin\Phi = 0.01745$ and $d\Phi = 0.001/(2\times 0.01745) = 0.029\,\mathrm{rad} = 1.6^\circ$ — useless for a $1^\circ$ angle. The error is multiplied by $1/(2\sin\Phi)$, which blows up for small angles. That is why small angles are read from the quaternion.
:::

::: check
Show that the principal axis has the same components in the reference frame and the body frame.
:::

::: answer
By definition $\mathbf{C}_{N\leftarrow B}\hat{\mathbf{e}} = \hat{\mathbf{e}}$. The transpose leaves the same arrow alone too: $\mathbf{C}_{B\leftarrow N}\hat{\mathbf{e}} = \mathbf{C}^{-1}\hat{\mathbf{e}} = \hat{\mathbf{e}}$ (undo a move that did nothing to $\hat{\mathbf{e}}$ and $\hat{\mathbf{e}}$ still has not moved). Now read the left side: $\mathbf{C}_{B\leftarrow N}$ takes an arrow's $N$ components and returns its $B$ components. So if $\hat{\mathbf{e}}$ holds the $N$ components, the result is the $B$ components, and the equation says they are the same three numbers: $\hat{\mathbf{e}}^{B} = \hat{\mathbf{e}}^{N}$.

In pictures: the axis is the one direction the turn does not move, so both frames see it the same way. That is why a rotation's axis is a natural physical thing, while its angle needs a sign convention.
:::

::: check
Use Rodrigues' formula to show $\mathbf{R}(\hat{\mathbf{e}},\Phi)^\top = \mathbf{R}(\hat{\mathbf{e}}, -\Phi) = \mathbf{R}(-\hat{\mathbf{e}}, \Phi)$.
:::

::: answer
Start from $\mathbf{R} = \mathbf{I}_3 + \sin\Phi[\hat{\mathbf{e}}\times] + (1-\cos\Phi)[\hat{\mathbf{e}}\times]^2$ and transpose each piece. $\mathbf{I}_3$ is symmetric, so it stays. $[\hat{\mathbf{e}}\times]$ is skew, so $[\hat{\mathbf{e}}\times]^\top = -[\hat{\mathbf{e}}\times]$. And $([\hat{\mathbf{e}}\times]^2)^\top = ([\hat{\mathbf{e}}\times]^\top)^2 = (-[\hat{\mathbf{e}}\times])^2 = [\hat{\mathbf{e}}\times]^2$. So

$$
\mathbf{R}^\top = \mathbf{I}_3 - \sin\Phi[\hat{\mathbf{e}}\times] + (1-\cos\Phi)[\hat{\mathbf{e}}\times]^2 .
$$

Replacing $\Phi$ by $-\Phi$ flips the sine and leaves the cosine: the same thing. Replacing $\hat{\mathbf{e}}$ by $-\hat{\mathbf{e}}$ flips $[\hat{\mathbf{e}}\times]$ and leaves its square: the same thing again. So turning backward about an axis and forward about the reversed axis are one rotation. That is why the pairs $(\hat{\mathbf{e}},\Phi)$ and $(-\hat{\mathbf{e}},-\Phi)$ can never be told apart.
:::

::: check
A star tracker measures an attitude whose error from the commanded attitude has trace $2.9999998$. Give the pointing error in arcseconds. Would you trust the number?
:::

::: answer
**The number.** $\cos\Phi = (2.9999998-1)/2 = 0.9999999$, so $\Phi = \arccos(0.9999999) = 4.472\times 10^{-4}\,\mathrm{rad}$. An [[arcsecond|arcsecond]] is $1/206265$ of a radian, so multiply by $206265$: $92.2''$, about $0.026^\circ$.

**Trust.** It depends on how the trace was formed. The trace is a sum of three numbers near $1$, and its distance from $3$ is only $2\times 10^{-7}$. In double precision the sum is off by around $10^{-16}$, so $3 - \operatorname{tr}$ has a relative error near $5\times 10^{-10}$ — the angle is good to many digits. In single precision the round-off floor is near $10^{-7}$, about the size of the signal itself, and the same calculation would be pure noise. The robust route is $\Phi = 2\arcsin\lVert\mathbf{q}_v\rVert$ from the error quaternion.
:::

::: check
A spacecraft must slew $118^\circ$ with the wheels of the worked example ($0.02^\circ/\mathrm{s^2}$, rate cap $0.5^\circ/\mathrm{s}$). How long does it take, and what fraction of the time is spent at the cap?
:::

::: answer
**Ramps.** Unchanged: $25.0\,\mathrm{s}$ each, $6.25^\circ$ each, $12.50^\circ$ together.

**Cruise.** $118 - 12.50 = 105.50^\circ$ at $0.5^\circ/\mathrm{s}$ takes $105.50/0.5 = 211.0\,\mathrm{s}$.

**Total.** $2\times 25.0 + 211.0 = 261.0\,\mathrm{s}$. The fraction at the cap is $211.0/261.0 = 80.8\%$.

Notice: the angle grew from $51.66^\circ$ to $118^\circ$, a factor of $2.28$, but the time grew only from $128.3\,\mathrm{s}$ to $261.0\,\mathrm{s}$, a factor of $2.03$. The fixed cost of the ramps is spread over a longer cruise.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Euler rotation theorem | One axis $\hat{\mathbf{e}}$ and one angle $\Phi$ reach any orientation |
| $\det(\mathbf{C}-\mathbf{I}_3) = 0$ | The proof: every $\mathbf{C}\in SO(3)$ has eigenvalue $1$ |
| Eigenvalues $\{1, e^{i\Phi}, e^{-i\Phi}\}$ | The principal angle is the angle of the complex pair |
| $\cos\Phi = (\operatorname{tr}\mathbf{C}-1)/2$ | $\Phi = \arccos(\cdot)\in[0,\pi]$ |
| $\hat{\mathbf{e}}^{B} = \hat{\mathbf{e}}^{N}$ | The axis has the same components in both frames |
| $\mathbf{R} = \mathbf{I}_3 + \sin\Phi[\hat{\mathbf{e}}\times] + (1-\cos\Phi)[\hat{\mathbf{e}}\times]^2$ | Rodrigues' rotation formula |
| $\mathbf{R}-\mathbf{R}^\top = 2\sin\Phi[\hat{\mathbf{e}}\times]$ | Axis from the skew part, when $\sin\Phi$ is not small |
| $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top = (\mathbf{R}+\mathbf{R}^\top-2\cos\Phi\,\mathbf{I}_3)/(2(1-\cos\Phi))$ | Axis from the symmetric part; the route at $\Phi = 180^\circ$ |
| $\mathbf{R}^\top = \mathbf{R}(\hat{\mathbf{e}},-\Phi) = \mathbf{R}(-\hat{\mathbf{e}},\Phi)$ | Reversing the angle or the axis gives the same matrix |
| Worked figures | $(15^\circ,50^\circ,5^\circ)$ is $\Phi = 51.656^\circ$ about $(-0.0365, 0.9727, 0.2293)$; $128.3\,\mathrm{s}$ to slew it |

One axis and one angle is the thriftiest honest description of an attitude, and $\arccos$ of a trace is a poor way to compute it. The next lesson replaces the angle by its half and the axis by a scaled copy. That removes the trigonometric awkwardness entirely — and brings in a family of conventions that cause more flight software bugs than everything else in this module put together.

::: context euler-1775 The man with his name on everything
Leonhard Euler (1707–1783), a Swiss mathematician who worked mostly in St Petersburg and Berlin, wrote more mathematics than almost anyone in history — much of it after he had gone nearly blind. His name is on so many results that engineers must say *which* Euler: Euler angles (lesson 02), the Euler formula $e^{i\theta} = \cos\theta + i\sin\theta$, Euler's equations for a spinning body, and this rotation theorem, which he presented in 1775 while studying how rigid bodies move. Say it "OY-ler", not "YOO-ler".
:::

::: context rigid-body Why "rigid" matters
A rigid body keeps every distance between its parts fixed. That is what lets one matrix describe the whole thing: if the body cannot bend, knowing how three axes glued to it are turned tells you where every bolt and panel points. Real spacecraft are not perfectly rigid — solar arrays flex and propellant sloshes — and attitude engineers model those as small wobbles added on top of a rigid-body attitude. The theorem is about the rigid part.
:::

::: context eigen-word Where "eigen" comes from
*Eigen* is German for "own", as in "its own". An eigenvector is a matrix's own direction — one the matrix does not turn away, only stretches or shrinks. The eigenvalue is the amount of stretch. For a rotation matrix the axis is an eigenvector with eigenvalue exactly $1$: the rotation neither turns it nor stretches it. Every other direction gets turned, so the axis is the only real eigenvector — with two exceptions. "No rotation" leaves every arrow alone. And a half turn flips every arrow perpendicular to the axis, which counts as a stretch by $-1$.
:::

::: context odd-dimensions Why odd dimensions always have an axis
The proof used $(-1)^3 = -1$. In any odd number of dimensions, $(-1)^n = -1$ and the same argument works, so every rotation leaves some direction fixed. In even dimensions it does not. In a flat two-dimensional plane, a turn about the center moves every arrow — the "axis" sticks out of the plane, not in it. In four dimensions a rotation can turn two separate planes at once and leave no direction fixed at all. We live in three, so every tumble has an axis.
:::

::: context complex-pair Why complex eigenvalues come in pairs
The eigenvalues of a matrix solve a polynomial equation whose coefficients are built from the matrix entries. When the entries are ordinary real numbers, the polynomial has real coefficients, and any complex solution $a + bi$ must be joined by its mirror image $a - bi$ — flipping the sign of $i$ everywhere leaves a real-coefficient equation unchanged. For a rotation, the pair is $\cos\Phi \pm i\sin\Phi$: two points on the unit circle at angles $+\Phi$ and $-\Phi$.
:::

::: context trace-word The trace does not care about frames
The trace — the sum of the diagonal entries — is the same no matter which set of axes you write a matrix in. That is why it equals the sum of the eigenvalues, which do not depend on axes either. For a rotation, it means you can compute $1 + 2\cos\Phi$ from $\mathbf{C}_{N\leftarrow B}$, from its transpose, or from the same rotation written in any other frame, and get the same number. Three additions give you the size of any rotation.
:::

::: context hinge-split The hinge picture
Split the arrow $\mathbf{v}$ into a piece along the axis and a piece straight out from it. The piece along the axis stays put. The piece straight out swings around a circle through the angle $\Phi$, exactly like the edge of a door on its hinge. Add the unmoved piece back and you have the turned arrow $\mathbf{v}'$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="175" x2="120" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="120.0,25.0 125.0,35.0 115.0,35.0" fill="#1f2a44"/>
  <text x="128" y="30" font-size="13" fill="#1f2a44">ê (axis)</text>
  <ellipse cx="120" cy="90" rx="110" ry="26" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="120" y1="175" x2="222.1" y2="96.1" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="230.0,90.0 225.1,100.1 219.0,92.2" fill="#1d6fd1"/>
  <text x="238" y="112" font-size="13" fill="#1d6fd1">v</text>
  <line x1="120" y1="90" x2="220" y2="90" stroke="#f2b880" stroke-width="2.5"/>
  <polygon points="230.0,90.0 220.0,95.0 220.0,85.0" fill="#f2b880"/>
  <text x="236" y="84" font-size="12" fill="#1f2a44">v⊥</text>
  <line x1="120" y1="90" x2="149.2" y2="109.0" stroke="#f2b880" stroke-width="2.5"/>
  <polygon points="157.6,114.4 146.5,113.2 152.0,104.8" fill="#f2b880"/>
  <line x1="120" y1="175" x2="152.3" y2="122.9" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="157.6,114.4 156.6,125.6 148.1,120.3" fill="#b4232c"/>
  <text x="164" y="132" font-size="13" fill="#b4232c">v′</text>
  <polyline points="160,90 158.1,92.8 152.8,95.4 144.4,97.5 133.7,98.9" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="137" y="86" font-size="12" fill="#1f2a44">Φ</text>
  <text x="68" y="95" font-size="12" fill="#1f2a44">v∥</text>
  <line x1="112" y1="175" x2="112" y2="90" stroke="#1f2a44" stroke-width="3"/>
  <text x="290" y="160" font-size="11" text-anchor="middle" fill="#1f2a44">v∥ stays; v⊥ turns by Φ</text>
</svg>
```
:::

::: context arccos-steep Why arccos is steep at its ends
Near $\Phi = 0$ the cosine curve is almost flat: turning $1^\circ$ changes $\cos\Phi$ by only $0.00015$. Run that backwards and a tiny change in the input to $\arccos$ makes a big change in the angle it returns. At exactly $\cos\Phi = \pm 1$ the slope of $\arccos$ is infinite. So any rounding error in a trace near $3$ (tiny angles) or near $-1$ (angles near $180^\circ$) is hugely magnified in $\Phi$. The formula is fine in the middle of the range and treacherous at both ends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="25" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="50.0,30.0 65.6,31.1 81.1,34.2 96.7,39.4 112.2,46.4 127.8,55.0 143.3,65.0 158.9,76.1 174.4,87.8 190.0,100.0 205.6,112.2 221.1,123.9 236.7,135.0 252.2,145.0 267.8,153.6 283.3,160.6 298.9,165.8 314.4,168.9 330.0,170.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="50.0,30.0 65.6,31.1 81.1,34.2" fill="none" stroke="#b4232c" stroke-width="4"/>
  <polyline points="298.9,165.8 314.4,168.9 330.0,170.0" fill="none" stroke="#b4232c" stroke-width="4"/>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="104" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="190" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">Φ from 0° to 180°</text>
  <text x="190" y="116" font-size="11" fill="#1f2a44">90°</text>
  <text x="96" y="24" font-size="12" fill="#b4232c">flat: cos Φ hardly moves</text>
  <text x="330" y="156" font-size="12" text-anchor="end" fill="#b4232c">flat again near 180°</text>
  <text x="140" y="140" font-size="12" fill="#1d6fd1">cos Φ</text>
</svg>
```
:::

::: context slew-profile Speed up, cruise, slow down
Plot spin rate against time for the worked slew and you get a flat-topped trapezoid. The rate climbs for $25\,\mathrm{s}$, holds at the $0.5^\circ/\mathrm{s}$ cap for $78.3\,\mathrm{s}$, then falls for $25\,\mathrm{s}$. The area under the shape is the angle turned: $6.25^\circ + 39.16^\circ + 6.25^\circ = 51.66^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="352" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="40,150 100,50 287.9,50 347.9,150" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="50" x2="100" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="287.9" y1="50" x2="287.9" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="34" y="54" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="34" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="24" font-size="11" fill="#1f2a44">rate, °/s</text>
  <text x="100" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">25 s</text>
  <text x="287.9" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">103.3 s</text>
  <text x="347.9" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">128.3 s</text>
  <text x="194" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">cruise 39.16°</text>
  <text x="194" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
</svg>
```
:::

::: context arcsecond Arcseconds
Split a degree into $60$ arcminutes and each arcminute into $60$ arcseconds, so one arcsecond is $1/3600$ of a degree. A full radian is $57.2958^\circ$, which is $57.2958 \times 3600 = 206265$ arcseconds. Pointing people use arcseconds because the numbers are friendly: a good star tracker is good to a few arcseconds, and a space telescope holds steady to a small fraction of one.
:::
