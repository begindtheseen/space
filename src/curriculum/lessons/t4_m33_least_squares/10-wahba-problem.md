---
id: l10-wahba-problem
title: "The Wahba problem: aligning two sets of vector observations"
minutes: 19
covers:
  - "The Wahba problem: find the rotation best aligning two sets of vector observations"
---

Picture yourself on a dark night holding a paper star map above your head. The map shows where the bright stars are. The sky shows where they really are. At first the two do not line up, so you turn the map — twist it, tilt it — until the stars on the paper sit on top of the stars in the sky. The turn you had to make tells you which way you are facing.

A spacecraft does exactly this, many times a second. Its sensors report where things *look* to be, as seen from the spacecraft. Its computer holds a model of where those same things *really* are in space. The job is to find the one turn that makes the two agree. That turn is the spacecraft's **attitude** — which way it is pointing.

There is a catch you know from real life. Your star map is never perfect and your eyes are never perfect, so no turn makes every star line up exactly. You settle for the turn that makes them line up *best*. "Best", in this module, means least squares: the smallest total of squared misses. In 1965 the statistician **[[Grace Wahba|grace-wahba]]** wrote this question down in exactly that form, and it has carried her name ever since: the **Wahba problem**.

This lesson states the problem carefully, turns it into a neater equivalent form — maximizing one number built from one $3\times3$ matrix — and counts how many sensor readings you need before the answer is pinned down.

## Directions are what attitude sensors see

Every attitude sensor on a spacecraft reports the same kind of fact: a **direction**, an arrow pointing somewhere, with no interest in how far away the thing is.

- A **sun sensor** reports which way the Sun is.
- A **magnetometer** reports which way Earth's magnetic field points where the spacecraft is.
- A **star tracker** — a small camera that recognizes star patterns — reports which way a known star is.

Each of these is reported in the spacecraft's own axes, its **body frame**: "the Sun is up and to the left of my nose". Meanwhile a model says where the same direction points in a **[[reference frame|reference-frame]]** that does not turn with the spacecraft. For the Sun the model is a table of where the Sun is on each date; for the magnetic field it is a map of Earth's field; for stars it is a star catalog.

Because only the direction matters, we store each one as a **unit vector** — an arrow of length exactly $1$. We name them like this:

- $\mathbf{r}_i$ (read "r sub i") is the $i$-th direction as the *reference* model gives it.
- $\mathbf{b}_i$ (read "b sub i") is the same physical direction as the *body* sensor measures it.
- $k$ is how many direction pairs we have, so $i$ runs from $1$ to $k$.

The two are linked by the attitude, written as a $3\times3$ rotation matrix $\mathbf{A}$ — the direction cosine matrix from the attitude module. Multiplying a reference-frame arrow by $\mathbf{A}$ gives the same arrow in body axes:

$$
\mathbf{b}_i = \mathbf{A}\mathbf{r}_i + \text{noise}.
$$

The word "noise" is the honest part: every sensor is a little wrong.

Not every $3\times3$ matrix is a rotation. A rotation must keep lengths and angles the same, which is the condition $\mathbf{A}^\mathsf{T}\mathbf{A}=\mathbf{I}$ (read "A transpose A equals the identity"; a matrix that obeys it is called **orthogonal**). It must also not turn the world into its mirror image, which is the condition $\det\mathbf{A}=+1$. The set of all matrices obeying both is called $SO(3)$, read "S O three" — the **[[special orthogonal group|so3]]**, a fancy name for "all possible 3D rotations".

## The problem, precisely

Now we can write the star-map idea as a formula. For each sensor, the miss is the gap between what the sensor saw, $\mathbf{b}_i$, and what a candidate attitude $\mathbf{A}$ predicts it should have seen, $\mathbf{A}\mathbf{r}_i$. That gap is the arrow $\mathbf{b}_i - \mathbf{A}\mathbf{r}_i$, and its squared length is $\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$ (read the double bars as "the length of").

Some sensors are better than others, so we give each one a **weight** $a_i>0$. A bigger weight means "I trust this one more, so its misses count more." This plays exactly the role that $1/\sigma_i^2$ played from lesson two on: a sensor with half the noise gets four times the weight.

Add up the weighted squared misses, halve the total for tidiness, and look for the rotation that makes it smallest:

$$
\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \ \tfrac12 \sum_{i=1}^{k} a_i \lVert \mathbf{b}_i - \mathbf{A}\mathbf{r}_i \rVert^2 .
$$

Read it aloud as: "A hat is the rotation A, among all rotations in S O three, that makes the half-sum of weighted squared misses as small as possible." The hat on $\hat{\mathbf{A}}$ marks it as an estimate, as it has all module. "arg min" means "the thing that gives the minimum", not the minimum value itself.

Here is what is new. Every problem so far in this module searched over ordinary lists of numbers, $\mathbb{R}^n$. This one searches only over rotations. The rules $\mathbf{A}^\mathsf{T}\mathbf{A}=\mathbf{I}$ and $\det\mathbf{A}=+1$ are part of the search itself, not something patched on afterward.

If you allow *every* orthogonal matrix, mirror images included, the same question is an older one from numerical linear algebra, the **[[orthogonal Procrustes problem|procrustes]]**: find the orthogonal matrix that best maps one set of vectors onto another. Wahba's version insists on proper rotations only. That matters, because a spacecraft can turn but it cannot turn into its own mirror image.

::: key The Wahba problem
$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \tfrac12\sum_i a_i\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2$, given body observations $\mathbf{b}_i$ and reference vectors $\mathbf{r}_i$. It is the orthogonal Procrustes problem on $SO(3)$: restricted to proper rotations.
:::

## From squared error to a trace

The cost above has a square inside a sum. We can boil it down to something much simpler, and every solver in the next lesson starts from that simpler form.

### Step 1: each miss becomes one dot product

Take one term. The squared length of a difference of two arrows expands just like $(x-y)^2 = x^2 - 2xy + y^2$:

$$
\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = \lVert\mathbf{b}_i\rVert^2 - 2\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i + \lVert\mathbf{A}\mathbf{r}_i\rVert^2 .
$$

The middle piece, $\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$, is the dot product of the measured arrow with the predicted arrow.

Now use two facts. First, $\mathbf{b}_i$ is a unit vector, so $\lVert\mathbf{b}_i\rVert^2 = 1$. Second, a rotation never changes a length, so $\lVert\mathbf{A}\mathbf{r}_i\rVert = \lVert\mathbf{r}_i\rVert = 1$ as well. Both outside pieces are $1$, and

$$
\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = 2 - 2\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i .
$$

This makes sense as a picture. The dot product of two unit arrows is the cosine of the angle between them. If the prediction is perfect, the angle is zero, the dot product is $1$, and the miss is $2-2=0$. If the prediction points exactly the wrong way, the dot product is $-1$ and the miss is $2+2=4$ — the gap between opposite ends of a circle of radius $1$ is $2$, and $2^2=4$.

### Step 2: add them up

Multiply by the weights and add:

$$
\sum_i a_i\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = 2\sum_i a_i - 2\sum_i a_i\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i .
$$

The first piece, $2\sum_i a_i$, is a fixed number. It does not change whichever $\mathbf{A}$ you try. So making the cost *small* is exactly the same as making the second sum *big*. We have swapped "minimize the misses" for "maximize the agreement" — a weighted total of cosines, one per sensor.

### Step 3: package all the data into one matrix

Each agreement term can be rewritten using the **[[trace|trace]]** of a matrix, written $\operatorname{trace}$ — the sum of the numbers down its main diagonal. The rule we need is

$$
\mathbf{u}^\mathsf{T}\mathbf{M}\mathbf{v}=\operatorname{trace}(\mathbf{M}\mathbf{v}\mathbf{u}^\mathsf{T}),
$$

where $\mathbf{v}\mathbf{u}^\mathsf{T}$ is an **outer product**: a column times a row, which gives a whole $3\times3$ matrix. Apply it with $\mathbf{u}=\mathbf{b}_i$, $\mathbf{M}=\mathbf{A}$, $\mathbf{v}=\mathbf{r}_i$, then pull $\mathbf{A}$ out of the sum (trace and sums can be swapped, and $\mathbf{A}$ is the same in every term):

$$
\sum_i a_i\,\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i = \sum_i a_i\operatorname{trace}(\mathbf{A}\mathbf{r}_i\mathbf{b}_i^\mathsf{T}) = \operatorname{trace}\!\left(\mathbf{A}\sum_i a_i\mathbf{r}_i\mathbf{b}_i^\mathsf{T}\right) = \operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}).
$$

The last step gives a name to the sum. The **attitude profile matrix** is

$$
\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T},
$$

so its transpose is $\mathbf{B}^\mathsf{T}=\sum_i a_i\mathbf{r}_i\mathbf{b}_i^\mathsf{T}$, which is what appeared in the line above. Wahba's problem is therefore

$$
\hat{\mathbf{A}} = \arg\max_{\mathbf{A}\in SO(3)}\ \operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}) .
$$

Notice what happened to the data. Two sensors or two hundred, every $\mathbf{b}_i$, $\mathbf{r}_i$ and $a_i$ has been squeezed into nine numbers — the entries of $\mathbf{B}$. Once you have $\mathbf{B}$, you can throw the individual readings away. It is like keeping only a class's total score instead of every test paper: for this one question, nothing is lost.

::: note Why the trace rule has to be true
Write out both sides with indices. On the left, $\mathbf{u}^\mathsf{T}\mathbf{M}\mathbf{v} = \sum_{j}\sum_{l} u_j M_{jl} v_l$: take row $j$ of $\mathbf{M}$, dot it with $\mathbf{v}$, weight by $u_j$, and add. On the right, the matrix $\mathbf{M}\mathbf{v}\mathbf{u}^\mathsf{T}$ has entry $(j,j)$ equal to $(\mathbf{M}\mathbf{v})_j\,u_j = \sum_l M_{jl}v_l\,u_j$. The trace adds these diagonal entries over $j$, giving $\sum_j\sum_l u_j M_{jl} v_l$ — the same double sum. So the two sides are equal for every $\mathbf{u}$, $\mathbf{M}$, $\mathbf{v}$.
:::

::: key Attitude profile matrix
$\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$, a $3\times3$ matrix built once from all the data. Minimizing the Wahba cost equals maximizing $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$. Every Wahba solver is a different way of doing that maximization.
:::

Because the cost equals $\sum_i a_i - \operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$ (halve Step 2's equation), and the cost can never be negative, the trace can never be bigger than $\sum_i a_i$. On perfect, noise-free data the true attitude reaches that ceiling exactly.

::: example Checking the identity with numbers
A small satellite carries a sun sensor and a magnetometer. The sun sensor is four times more accurate (noise $0.05^\circ$ against $0.2^\circ$), so its weight is $4^2 = 16$ times bigger: we use $a_{\mathrm{sun}}=1$ and $a_{\mathrm{mag}}=(0.05/0.2)^2=0.0625$. The two reference directions are about $74.5^\circ$ apart. We invent a true attitude (a $32^\circ$ turn about some axis), make noise-free readings from it, and test three candidate attitudes:

```python
import numpy as np

def dcm_from_axis_angle(axis, angle):
    """Rotation matrix for a turn of `angle` radians about `axis` (Rodrigues' formula)."""
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(angle) * K + (1 - np.cos(angle)) * (K @ K)

A_true = dcm_from_axis_angle(np.array([0.3, -0.5, 0.8]), np.radians(32.0))
r_sun = np.array([0.7660, 0.6428, 0.0])
r_mag = np.array([0.2050, 0.1720, 0.9636])
r_sun, r_mag = r_sun / np.linalg.norm(r_sun), r_mag / np.linalg.norm(r_mag)
b_sun, b_mag = A_true @ r_sun, A_true @ r_mag      # noiseless body observations

a = (1.0, (0.05 / 0.2) ** 2)                       # weights 1 and 0.0625: sun sensor 4x more accurate
B = a[0] * np.outer(b_sun, r_sun) + a[1] * np.outer(b_mag, r_mag)

candidates = {
    "truth": A_true,
    "40 deg off about b_sun": dcm_from_axis_angle(b_sun, np.radians(40)) @ A_true,
    "40 deg off about b_mag": dcm_from_axis_angle(b_mag, np.radians(40)) @ A_true,
}
for label, A in candidates.items():
    cost = 0.5 * (a[0] * np.sum((b_sun - A @ r_sun) ** 2) + a[1] * np.sum((b_mag - A @ r_mag) ** 2))
    print(f"{label:23s} trace = {np.trace(A @ B.T):.4f}   sum(a) - trace = {sum(a) - np.trace(A @ B.T):.4f}   cost = {cost:.4f}")
# truth                   trace = 1.0625   sum(a) - trace = 0.0000   cost = 0.0000
# 40 deg off about b_sun  trace = 1.0489   sum(a) - trace = 0.0136   cost = 0.0136
# 40 deg off about b_mag  trace = 0.8453   sum(a) - trace = 0.2172   cost = 0.2172
```

Read the three lines one at a time.

**Truth.** The trace is $1.0625$, which is exactly $\sum a_i = 1 + 0.0625$, the ceiling. The cost is $0$. Perfect data, perfect answer.

**$40^\circ$ off, turning about the sun direction.** The cost worked out directly and the cost from $\sum a_i - \operatorname{trace}$ are both $0.0136$. The identity holds exactly, not approximately. The cost is small because a turn about $\mathbf{b}_{\mathrm{sun}}$ leaves the sun arrow where it was; only the low-weight magnetometer notices.

**$40^\circ$ off, turning about the magnetic field direction.** Now the heavily weighted sun sensor sees the error, and the cost jumps sixteenfold to $0.2172$.

Sanity check: the same $40^\circ$ mistake costs very different amounts depending on the axis. That is what weights are for — and it is the first hint of this lesson's last idea: a sensor cannot see a turn about its own line of sight.
:::

## How many vectors does it take?

Hold a pencil at arm's length and point it straight at a lamp. Now roll the pencil between your fingers. It still points at the lamp. Knowing that the pencil points at the lamp tells you *two* things about how you are holding it — left-right and up-down — but nothing about how far it is rolled.

A rotation in 3D has three **[[degrees of freedom|degrees-of-freedom]]** — three independent numbers are needed to describe it, like roll, pitch and yaw. A single unit vector supplies only two constraints, because a direction on a sphere is fixed by two numbers (think latitude and longitude). Its length is always $1$, so the length tells you nothing. One vector pair therefore leaves one number free: the **[[spin about the observed direction|spin-about-vector]]** itself. Any amount of it gives zero extra cost.

::: example The rotation that stays hidden
Use only the sun-sensor pair from the previous example. After the true attitude, add an extra spin about $\mathbf{b}_{\mathrm{sun}}$ of $0^\circ$, $40^\circ$, $137^\circ$ or $250^\circ$, and measure how well each result matches the sun reading alone. (This code continues the previous block.)

```python
for extra_deg in (0, 40, 137, 250):
    A_c = dcm_from_axis_angle(b_sun, np.radians(extra_deg)) @ A_true
    cost_sun_only = 0.5 * np.sum((b_sun - A_c @ r_sun) ** 2)
    print(f"extra spin {extra_deg:3d} deg: sun-only cost = {cost_sun_only:.1e}   predicted b_mag = {np.round(A_c @ r_mag, 3)}")
# extra spin   0 deg: sun-only cost = 0.0e+00   predicted b_mag = [-0.123  0.021  0.992]
# extra spin  40 deg: sun-only cost = 9.2e-33   predicted b_mag = [ 0.486 -0.188  0.853]
# extra spin 137 deg: sun-only cost = 2.0e-32   predicted b_mag = [ 0.853  0.117 -0.509]
# extra spin 250 deg: sun-only cost = 7.7e-33   predicted b_mag = [-0.64   0.688 -0.342]
```

The costs are around $10^{-32}$ — zero, apart from the last few digits of computer rounding (your machine may print slightly different tiny numbers). All four attitudes match the sun reading perfectly.

Yet they are four genuinely different attitudes. Look at the last column: each one predicts the magnetometer should point somewhere completely different. The sun sensor alone cannot tell them apart.

This is lesson eight's **[[observability|observability]]** idea in a new setting. There, a design matrix that lacked some column direction could not see the state combination that column would have measured. Here, rotation about the observed arrow is a direction in attitude space that one arrow cannot see.

A second arrow that is not parallel to the first fixes this. Two vectors give up to four constraints for three unknowns. But "not parallel" is not a yes-or-no switch. Repeat the test with the second reference vector (weight $0.0625$, as before) moved closer and closer to $\mathbf{r}_{\mathrm{sun}}$, and a wrong spin of $30^\circ$ about the sun direction:

| Separation between $\mathbf{r}_1,\mathbf{r}_2$ | Cost at $+30^\circ$ wrong spin |
| --- | --- |
| $74.5^\circ$ | $7.78\times10^{-3}$ |
| $5.0^\circ$ | $6.36\times10^{-5}$ |
| $0.1^\circ$ | $2.55\times10^{-8}$ |

The cost is never exactly zero while the separation is bigger than zero, so the second vector always constrains the spin in principle. But the penalty for a wrong spin shrinks like the square of the sine of the separation. At $0.1^\circ$ it is three hundred thousand times smaller than at $74.5^\circ$. The problem behaves more and more like the one-vector case: mathematically solvable, but once real noise is added, practically blind. This is the same thing, for rotations, as two nearly parallel columns in a design matrix. The next two lessons measure exactly what it costs.
:::

::: warning A unit vector is worth two constraints, not three
It is tempting to count "one vector observation" as "one measurement", the way a single range or a single bias was one measurement earlier in this module. People then either think one vector is enough (it is not) or think three vectors are needed to "match three unknowns" (they are not). Each unit vector gives exactly two constraints, because its length is always $1$ and carries no information. Two non-parallel vectors are already enough in principle. A third adds protection against noise and against one bad sensor; it does not fill a gap that two good vectors leave open.
:::

## Check yourself

::: check
Starting from $\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2$, show it equals $2-2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$, and say which two facts make the simplification possible.
:::

::: answer
Expand the square like $(x-y)^2$: $\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = \mathbf{b}_i^\mathsf{T}\mathbf{b}_i - 2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i + (\mathbf{A}\mathbf{r}_i)^\mathsf{T}(\mathbf{A}\mathbf{r}_i)$.

The first term is $\lVert\mathbf{b}_i\rVert^2=1$, because $\mathbf{b}_i$ is a unit vector.

The last term is $\mathbf{r}_i^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{r}_i=\mathbf{r}_i^\mathsf{T}\mathbf{r}_i=1$, because $\mathbf{A}$ is orthogonal ($\mathbf{A}^\mathsf{T}\mathbf{A}=\mathbf{I}$) and $\mathbf{r}_i$ is a unit vector.

Both outer terms are fixed at $1$, leaving $1 + 1 - 2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i = 2-2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$. The two facts: the vectors have unit length, and $\mathbf{A}$ is orthogonal.
:::

::: check
Why does maximizing $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$ need only $\mathbf{B}$, a single $3\times3$ matrix, rather than the full list of every $\mathbf{b}_i$ and $\mathbf{r}_i$?
:::

::: answer
Every $\mathbf{b}_i$, $\mathbf{r}_i$ and $a_i$ enters the cost only through the sum $\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$. Once $\mathbf{B}$ is formed, the individual measurements can be thrown away and the optimization runs from $\mathbf{B}$ alone. This is the attitude version of the information matrix from lesson two: many measurements compress, without losing anything needed to find $\hat{\mathbf{A}}$, into one object of fixed size.
:::

::: check
With exactly one vector pair, describe the full set of rotations that give zero Wahba cost.
:::

::: answer
Every rotation of the form $\mathbf{R}(\mathbf{b}_i,\theta)\,\mathbf{A}_{\mathrm{true}}$, for any angle $\theta$, where $\mathbf{R}(\mathbf{b}_i,\theta)$ is a turn by $\theta$ about the axis $\mathbf{b}_i$ itself.

Why: applying $\mathbf{A}_{\mathrm{true}}$ first sends $\mathbf{r}_i$ to $\mathbf{b}_i$. Any turn about $\mathbf{b}_i$ afterward leaves $\mathbf{b}_i$ where it is, the way rolling a pencil leaves it pointing at the same lamp. So the combined rotation still sends $\mathbf{r}_i$ exactly to $\mathbf{b}_i$.

That is a one-parameter family — a whole circle of equally good attitudes. Geometrically: turning about the observed direction is completely unconstrained by that one observation.
:::

::: check
Two reference vectors are separated by only $0.1^\circ$. Is the Wahba problem with these two vectors technically well-posed? Is it a good idea to rely on it in practice?
:::

::: answer
Technically yes. For any separation bigger than $0^\circ$ the two vectors are not parallel, a unique best rotation exists, and the problem is well-posed in the strict mathematical sense.

In practice it is a poor idea. The penalty for a wrong turn about the shared, nearly common axis shrinks like the square of the sine of the separation. At $0.1^\circ$ it is hundreds of thousands of times weaker than with well-separated vectors, so ordinary sensor noise swamps it. "Mathematically observable" and "practically observable" are different questions, and the second is the one an engineer needs answered.
:::

::: check
A star tracker reports three star directions instead of two. Using this lesson's constraint count, explain why this is more than the minimum needed, and name one reason it is still worth having beyond protection against a single bad measurement.
:::

::: answer
Two non-parallel unit vectors already give four constraints for three unknowns, so a third is not needed to make the problem well-posed. Three vectors give six constraints for three unknowns — three more than the minimum.

Beyond guarding against one wrongly identified star, a third vector improves the *geometry*. If the first two happen to be closer to parallel than you would like, a third pointing a different way restores the conditioning the near-parallel pair lacked — exactly as an added, well-placed measurement fixed the observability problem in lesson eight.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{b}_i, \mathbf{r}_i$ | Unit vector seen in the body frame; the same physical direction, known in the reference frame |
| $\mathbf{b}_i = \mathbf{A}\mathbf{r}_i + \text{noise}$ | The attitude matrix $\mathbf{A}$ turns reference arrows into body arrows |
| $\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\tfrac12\sum_i a_i\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2$ | The Wahba problem; orthogonal Procrustes restricted to proper rotations |
| $\lVert\mathbf{b}_i-\mathbf{A}\mathbf{r}_i\rVert^2 = 2-2\mathbf{b}_i^\mathsf{T}\mathbf{A}\mathbf{r}_i$ | Unit vectors and an orthogonal $\mathbf{A}$ collapse each squared miss to a dot product |
| $\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$ | Attitude profile matrix; holds everything the solvers need |
| $\hat{\mathbf{A}} = \arg\max_{\mathbf{A}\in SO(3)}\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$ | Equivalent trace form every solver works from; the maximum possible trace is $\sum_i a_i$ |
| One vector | Two constraints; leaves the spin about it completely free |
| Two non-parallel vectors | Four constraints for three unknowns; well-posed, but weak when nearly parallel |

The next lesson turns $\mathbf{B}$ from a definition into an answer: five different ways of finding the $\mathbf{A}$ that maximizes $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$, from a two-vector construction that needs no optimization at all to the eigenvalue method flown on most real spacecraft.

::: context grace-wahba The person behind the name
Grace Wahba posed the problem in 1965 as a short challenge printed in *SIAM Review*, a journal of applied mathematics, under the title "A least squares estimate of satellite attitude". Several readers mailed in solutions the next year. She went on to become one of the best-known statisticians of her generation, at the University of Wisconsin–Madison, famous for work on smoothing splines — a way of drawing the best smooth curve through noisy data. So the attitude problem that bears her name comes from someone whose whole career was about estimating things from noisy measurements.
:::

::: context reference-frame A frame that does not turn with you
A frame is a set of three perpendicular axes you measure directions against. The body frame is glued to the spacecraft: its "x" might be the nose. A reference frame is chosen so it does *not* turn with the spacecraft — for example axes pointing at fixed, very distant stars, called an inertial frame. The Sun, the magnetic field and the stars have known directions in that frame, because astronomers and geophysicists have mapped them. Attitude is nothing more than how the body axes are turned relative to those reference axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke-width="2" fill="none">
    <line x1="70" y1="120" x2="150" y2="120" stroke="#6c7a93"/>
    <line x1="70" y1="120" x2="70" y2="40" stroke="#6c7a93"/>
    <line x1="250" y1="120" x2="319" y2="80" stroke="#1d6fd1"/>
    <line x1="250" y1="120" x2="210" y2="51" stroke="#1d6fd1"/>
    <line x1="70" y1="120" x2="130" y2="60" stroke="#b4232c" stroke-dasharray="5 3"/>
    <line x1="250" y1="120" x2="307" y2="63" stroke="#b4232c" stroke-dasharray="5 3"/>
  </g>
  <text x="70" y="145" font-size="12" fill="#1f2a44">reference axes</text>
  <text x="235" y="145" font-size="12" fill="#1d6fd1">body axes (turned)</text>
  <text x="120" y="52" font-size="12" fill="#b4232c">r: Sun</text>
  <text x="300" y="55" font-size="12" fill="#b4232c">b: Sun</text>
</svg>
```

The dashed red arrow is the same Sun direction against each set of axes. It is $45^\circ$ from the first reference axis, but only $15^\circ$ from the first body axis, because the body is turned $30^\circ$. Same arrow, different numbers.
:::

::: context so3 What the letters S, O and 3 stand for
The **3** means three dimensions. The **O** stands for orthogonal: the matrix keeps every length and every right angle, so $\mathbf{A}^\mathsf{T}\mathbf{A}=\mathbf{I}$. The **S** stands for special, meaning the determinant is $+1$ rather than $-1$. Orthogonal matrices with determinant $-1$ include a mirror flip — they would turn a right glove into a left glove. "Group" is the mathematicians' word for a set where doing one member after another always lands you on another member: two rotations in a row are always a rotation.
:::

::: context procrustes A name from a Greek myth
In Greek legend Procrustes was a bandit who made every traveller fit his bed exactly: he stretched the short ones and cut down the tall ones. Psychologists and statisticians borrowed the name in the early 1960s for the problem of forcing one set of points to match another as closely as possible — except that here the only thing allowed is a rigid turn, with no stretching. Peter Schönemann published the standard solution for the orthogonal version in 1966. You will meet a version of his answer, with Wahba's no-mirrors fix, in the next lesson's SVD method.
:::

::: context trace The sum down the diagonal
The trace of a square matrix is the sum of the numbers on its main diagonal, from top-left to bottom-right. For a rotation it has a lovely meaning: a turn by angle $\phi$ about any axis has trace $1 + 2\cos\phi$. No turn gives $3$; a half-turn gives $-1$. So "maximize a trace" is, loosely, "find the turn that leaves things as close to lined up as possible" — which is exactly what Wahba asks.
:::

::: context degrees-of-freedom Counting what a direction tells you
A direction is a point on a sphere of radius one. Like a place on Earth, it needs only two numbers — latitude and longitude — so one measured direction supplies two constraints. An attitude needs three numbers. The gap of one is the roll about the direction itself.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="75" r="55" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="90" cy="75" rx="55" ry="16" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <line x1="90" y1="75" x2="129" y2="36" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="129" cy="36" r="4" fill="#1d6fd1"/>
  <text x="90" y="145" font-size="12" text-anchor="middle" fill="#1f2a44">direction: 2 numbers</text>
  <line x1="200" y1="75" x2="330" y2="75" stroke="#1f2a44" stroke-width="3"/>
  <ellipse cx="290" cy="75" rx="10" ry="26" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="290,49 283,44 283,54" fill="#b4232c"/>
  <text x="265" y="130" font-size="12" text-anchor="middle" fill="#b4232c">roll about it: unseen</text>
</svg>
```
:::

::: context spin-about-vector The rotisserie picture
Think of a chicken on a rotisserie spit. The spit always points the same way, while the chicken turns around it. If your only sensor tells you where the spit points, you have no idea which side of the chicken faces you. For a spacecraft with one sun sensor, the spit is the line to the Sun. That is why a spacecraft with a sun sensor almost always carries a second kind of sensor too — a magnetometer, an Earth-horizon sensor or a star tracker — to pin down the roll.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="75" x2="320" y2="75" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="332,75 318,69 318,81" fill="#1f2a44"/>
  <text x="300" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">Sun line (the spit)</text>
  <ellipse cx="200" cy="75" rx="18" ry="50" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="60" y1="75" x2="200" y2="25" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="60" y1="75" x2="216.5" y2="55" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="60" y1="75" x2="200" y2="125" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="200" cy="25" r="4" fill="#1d6fd1"/><circle cx="216.5" cy="55" r="4" fill="#1d6fd1"/><circle cx="200" cy="125" r="4" fill="#1d6fd1"/>
  <text x="120" y="20" font-size="12" fill="#1d6fd1">predicted field arrow</text>
  <text x="120" y="145" font-size="12" fill="#1f2a44">all fit the Sun reading equally well</text>
</svg>
```
:::

::: context observability The same idea, again and again
Observability asks: can the data tell apart every pair of states that are genuinely different? In lesson eight it showed up as a near-zero singular value of the design matrix. Here it shows up as a turn one arrow cannot see. In the Kalman filter module it returns as a formal test on a moving system — for example, whether a spacecraft's gyro drift can be estimated from the star sightings it gets. The lesson is the same each time: before trusting an estimator, ask whether the measurements can even tell the answers apart.
:::
