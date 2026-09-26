---
id: l12-attitude-error-representations
title: Attitude error representations
minutes: 24
covers:
  - attitude error representations
---

Aim a garden hose at a flower pot. You do not think "the hose points $37^\circ$ east of north." You think "a bit more to the left." Your hands act on the *gap* between where the water goes and where you want it.

A spacecraft is the same. Almost nothing in guidance, navigation and control uses the attitude on its own. The **controller** — the software that fires thrusters or spins wheels — uses the gap between where the vehicle points and where it should point. The **estimator** — the software that works out the attitude from sensors — uses the gap between what a star camera should see and what it does see. That is again a gap between two attitudes. Even testing is about a gap: the difference between the estimated attitude and the truth. So the attitude is really a stepping stone on the way to an **attitude error**, the rotation that carries one attitude onto another.

Errors are easier than attitudes in one way and harder in another. Easier, because in a working system the error is small, and small rotations behave almost like ordinary arrows. Singularities and the double cover fade away when the error is a sixtieth of a degree. Harder, because an error is a rotation *between two frames*, and you must keep track of which frame its axis is written in. Get that wrong and you build a controller that is stable, smooth and pushing on the wrong axes.

This lesson builds the error quaternion, its small-angle form, the feedback signal every quaternion attitude controller uses, and the three-number error that keeps an attitude filter honest. The conventions are the module's: unit quaternions, scalar first, Hamilton multiplication, and a stored attitude means $q_{N\leftarrow B}$ (read "q, N from B": it turns body components into reference components) unless a formula says otherwise.

## The error rotation, and which frame it lives in

Face a friend and say "turn left." Their left is your right: "left" means nothing until you say *whose* left. An attitude error has exactly this problem. The rotation itself is one physical thing. But its axis is an arrow, and an arrow's three numbers depend on which set of axes you measure it against. Engineers say a vector is **[[resolved in|resolved-in]]** a frame: written as components along that frame's axes.

Now the symbols. Let $q_{\text{est}}$ ("q est") be the estimated attitude and $q_{\text{cmd}}$ ("q command") the commanded one, the attitude you want. The symbol $\otimes$ is the quaternion product from lesson 06, and $q^{-1}$ is the inverse. There are two error quaternions, and they are not the same object:

$$
\delta q^{B} = q_{\text{est}}^{-1}\otimes q_{\text{cmd}},
\qquad
\delta q^{N} = q_{\text{cmd}}\otimes q_{\text{est}}^{-1} .
$$

Read $\delta q$ as "delta q"; the Greek $\delta$ marks a small change. The superscript says which frame the error is written in: $B$ for body, $N$ for the reference frame.

Both describe the same physical rotation: the one that carries the estimated body frame onto the commanded body frame. Both have the same **scalar part** (the first number, $w$), so both give the same principal angle. They differ only in the frame their **vector part** (the last three numbers, written $\delta\mathbf{q}_v$) is resolved in. With the module's $q_{N\leftarrow B}$ storage, the first is resolved in body axes and the second in reference axes. They are linked by the attitude matrix of lesson 01:

$$
\delta\mathbf{q}^{N}_v = \mathbf{C}(q_{\text{est}})\,\delta\mathbf{q}^{B}_v .
$$

::: note Why it has to be true
Write $\delta q^{N}$ with a clever "one" in the middle, $q_{\text{est}}\otimes q_{\text{est}}^{-1}$:

$$
\delta q^{N} = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}
= q_{\text{est}}\otimes\bigl(q_{\text{est}}^{-1}\otimes q_{\text{cmd}}\bigr)\otimes q_{\text{est}}^{-1}
= q_{\text{est}}\otimes\delta q^{B}\otimes q_{\text{est}}^{-1}.
$$

A sandwich $q\otimes p\otimes q^{-1}$ leaves the scalar part of $p$ alone and rotates its vector part by $\mathbf{C}(q)$ — that is how lesson 06 rotates vectors. So the scalars match and the vector parts differ by $\mathbf{C}(q_{\text{est}})$.
:::

### Which one a controller wants

Almost all attitude control wants the **body-resolved** error. The reason is physical. Wheels and thrusters are bolted to the body, so torques are applied about body axes. Which formula gives the body-resolved error depends on the storage direction, and this is exactly the trap:

- With $q$ meaning $q_{N\leftarrow B}$ (this module), the body-resolved error is $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$.
- With $q$ meaning $q_{B\leftarrow N}$ — the storage much spacecraft flight software uses — the body-resolved error is written $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$. That is the form in most textbooks and in this module's flashcards.

The second bullet hides one more trap. Most software that stores $q_{B\leftarrow N}$ also uses the JPL multiplication of lesson 05, and there $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ gives *exactly* the four numbers of $\delta q^{B}$ above. If you store $q_{B\leftarrow N}$ but multiply the Hamilton way, the same formula gives the conjugate of $\delta q^{B}$: still in body axes, but with the vector part's sign flipped, so the feedback sign flips too.

So do not memorize one formula. Name your storage direction and multiplication convention, pick the matching formula, and test it: build a known small error about a known body axis and check that the vector part comes out along that axis, with the right sign, in body components.

::: key The attitude error quaternion
$\delta q = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$. For small errors $\delta q \approx [1,\ \delta\boldsymbol{\theta}/2]$, so the vector part is half the rotation-vector error — the standard feedback signal.
:::

## The small-angle form

Any rotation is one turn through an angle $\Phi$ ("capital phi") about an axis $\hat{\mathbf{e}}$ ("e-hat"), by Euler's theorem from lesson 04. So write the error that way:

$$
\delta q = \bigl[\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)\bigr].
$$

Now define the **rotation vector** $\delta\boldsymbol{\theta} = \Phi\hat{\mathbf{e}}$ ("delta theta"). It is an arrow that points along the error axis and whose length is the error angle in radians. It packs the whole error into three numbers: its size is the pointing error, and its direction is the axis.

For small angles, $\sin x \approx x$ and $\cos x \approx 1 - x^2/2$ (lesson 06 of the trigonometry module). Put $x = \Phi/2$ and keep the next term of each series:

$$
\delta q = \Bigl[\,1 - \frac{\Phi^2}{8} + \cdots,\ \ \frac{\delta\boldsymbol{\theta}}{2}\Bigl(1 - \frac{\Phi^2}{24} + \cdots\Bigr)\Bigr]
\ \approx\ \Bigl[\,1,\ \frac{\delta\boldsymbol{\theta}}{2}\,\Bigr].
$$

In words: the vector part is half the rotation vector, and the scalar part is $1$ with an error that is only second order — it shrinks like $\Phi^2$.

How good is that? If you estimate the angle as $2\lVert\delta\mathbf{q}_v\rVert$ (twice the length of the vector part; $\lVert\cdot\rVert$ means "length of"), the relative error is $\sin(\Phi/2)/(\Phi/2) - 1 \approx -\Phi^2/24$:

| $\Phi$ | $0.1^\circ$ | $1^\circ$ | $5^\circ$ | $10^\circ$ | $30^\circ$ | $60^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| relative error of $2\lVert\delta\mathbf{q}_v\rVert$ | $-1.3\times 10^{-7}$ | $-1.3\times 10^{-5}$ | $-3.2\times 10^{-4}$ | $-1.3\times 10^{-3}$ | $-1.1\times 10^{-2}$ | $-4.5\times 10^{-2}$ |
| $w$ | $0.9999996$ | $0.9999619$ | $0.9990482$ | $0.9961947$ | $0.9659258$ | $0.8660254$ |

At $1^\circ$ the estimate is good to one part in $100\,000$. At $10^\circ$, to one part in $1000$. At $60^\circ$ it is $4.5\%$ low, and that is where the straight-line approximation — **[[linearization|linearization]]** — stops being honest.

A converged attitude estimate lives at the left end of that table, which is why the linear error model works so well. Re-check it after anything that could push the error to $30^\circ$ or more, such as a sensor dropout or a reboot.

::: example An error quaternion, resolved two ways
A spacecraft's estimated attitude is $q_{\text{est}} = [0.93667219,\ 0.07022077,\ -0.10533115,\ 0.32652657]$. Its scalar part gives the angle: $2\arccos(0.93667219) = 41.0^\circ$. The commanded attitude is $2.400^\circ$ away, about the body axis $\hat{\mathbf{d}} = (0.500275,\ 0.800440,\ -0.330182)$.

**Body-resolved.** Multiply out $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$:

$$
\delta q^{B} = [\,0.99978068,\ 0.01047697,\ 0.01676316,\ -0.00691481\,].
$$

The angle is $2\arcsin\lVert\delta\mathbf{q}_v\rVert = 2.400000^\circ$. Dividing the vector part by its length gives the axis $(0.500275,\ 0.800440,\ -0.330182)$ — the body axis we built it from. Good.

**Reference-resolved.** Multiply the other way:

$$
\delta q^{N} = [\,0.99978068,\ -0.00144421,\ 0.02066230,\ -0.00309333\,].
$$

The scalar part is the same, so the angle is again $2.400000^\circ$. But the axis is $(-0.068961,\ 0.986624,\ -0.147706)$. That is $\mathbf{C}(q_{\text{est}})\hat{\mathbf{d}}$ to eight digits: the same physical axis, written in reference components.

**The cost of mixing them up.** A controller handed $\delta q^{N}$ when it expects $\delta q^{B}$ pushes with the right strength about the wrong axis — here an axis $36.5^\circ$ away from the right one. (The two can be at most $41^\circ$ apart, the vehicle's own attitude angle; here they are less because $\hat{\mathbf{d}}$ is not square to the attitude's axis.) Every size check agrees. Only the direction is wrong.

**The small-angle form.** Doubling the vector part gives $2\delta\mathbf{q}^{B}_v = (0.02095394,\ 0.03352631,\ -0.01382962)\,\mathrm{rad}$. The exact rotation vector is $2.4^\circ$ in radians times $\hat{\mathbf{d}}$: $(0.02095548,\ 0.03352876,\ -0.01383064)$. The shortfall is $7.3\times 10^{-5}$ relative, or $0.00018^\circ$ out of $2.4^\circ$. That matches the table: $\Phi^2/24$ with $\Phi = 0.0419\,\mathrm{rad}$ is $7.3\times 10^{-5}$.
:::

## The feedback signal

Here is the standard quaternion attitude control law:

$$
\boldsymbol{\tau} = K\,\delta\mathbf{q}^{B}_v - D\,\boldsymbol{\omega}^{B}.
$$

Read it piece by piece. $\boldsymbol{\tau}$ ("tau") is the torque vector to apply, in $\mathrm{N\,m}$. $K$ is the **proportional gain** — how hard to push per unit of error, like the stiffness of a spring. $\boldsymbol{\omega}^{B}$ ("omega") is the body's angular velocity. $D$ is the **derivative gain** — how hard to brake against spin, like a shock absorber. Before use, $\delta q^{B}$ is flipped to $w\ge 0$ by the shortest-path rule of lesson 07. Three things make this law work.

**It needs only the vector part.** Since $\lVert\delta q\rVert = 1$, the scalar carries no new information: it is $\sqrt{1 - \lVert\delta\mathbf{q}_v\rVert^2}$, up to the sign the guard fixes. Three numbers in, three torques out.

**It is nearly linear where it matters.** Look at one axis, with moment of inertia $J$ (how hard the body is to spin about that axis, in $\mathrm{kg\,m^2}$). Let $\delta\theta$ be the error angle about that axis. A dot means "rate of change," two dots the rate of that. As the body turns toward the target, the error shrinks at the body's spin rate, so $\omega = -\dot{\delta\theta}$, and the torque that turns the body shrinks the error: $J\ddot{\delta\theta} = -\tau$. Put in $\tau = K\,\delta\theta/2 + D\,\dot{\delta\theta}$ and move everything to one side:

$$
J\,\ddot{\delta\theta} + D\,\dot{\delta\theta} + \frac{K}{2}\,\delta\theta = 0,
\qquad
\omega_n = \sqrt{\frac{K}{2J}},
\qquad
\zeta = \frac{D}{2\sqrt{JK/2}} .
$$

That is a mass on a spring with a damper. $\omega_n$ is its **[[natural frequency|second-order]]** (how fast it would swing with no damper) and $\zeta$ ("zeta") is its **damping ratio** (how quickly the swinging dies out). Notice the $K/2$: it comes from the half-angle. Standard design applies, which is the point: choose $\omega_n$ and $\zeta$, then read off $K$ and $D$.

**It [[saturates gracefully|saturation]] at large errors.** As $\Phi\to 180^\circ$, $\lVert\delta\mathbf{q}_v\rVert = \sin(\Phi/2)\to 1$. So the commanded torque can never exceed $K$, however large the error. Compare a law with the same small-error behavior built on the rotation vector, $\tfrac{K}{2}\delta\boldsymbol{\theta}$: at a half turn it commands $\tfrac{\pi}{2}K \approx 1.57K$. And a law of $K\delta\boldsymbol{\theta}$ would command $\pi K$.

::: example Sizing a quaternion attitude controller
A spacecraft bus has $J = 1200\,\mathrm{kg\,m^2}$ about the axis of interest. We want $\omega_n = 0.050\,\mathrm{rad/s}$ — a natural period of $2\pi/0.050 = 125.7\,\mathrm{s}$ — and damping $\zeta = 0.70$.

**The gains.** Solve $\omega_n = \sqrt{K/2J}$ for $K$, then $\zeta$'s formula for $D$:

$$
K = 2J\omega_n^2 = 2(1200)(0.0025) = 6.00\,\mathrm{N\,m},
\qquad
D = 2\zeta\sqrt{JK/2} = 1.4\sqrt{3600} = 1.4 \times 60 = 84.0\,\mathrm{N\,m\,s}.
$$

**The first push.** Start with a $5.0^\circ$ error. The vector part has length $\sin(2.5^\circ) = 0.043619$, so the first torque is $6.00\times 0.043619 = 0.2617\,\mathrm{N\,m}$. That is within what a typical **[[reaction wheel|reaction-wheel]]** can deliver, and far below the $6.00\,\mathrm{N\,m}$ half-turn ceiling.

**How long to settle.** A common rule of thumb says the error falls to $2\%$ in $4/(\zeta\omega_n) = 4/0.035 = 114.3\,\mathrm{s}$. It comes from the decay factor $e^{-\zeta\omega_n t}$, and $e^{-4} = 1.8\%$.

Now simulate the full law from $5.0^\circ$, stepping at $100\,\mathrm{Hz}$. The error last exceeds $0.10^\circ$ (which is $2\%$) at $t = 119.6\,\mathrm{s}$. By $400\,\mathrm{s}$ it has fallen to $3.4\times 10^{-6}$ degrees.

Why $119.6$ and not $114.3$? Not the nonlinearity: the linear model also gives $119.6\,\mathrm{s}$, since at $5^\circ$, $\sin(\Phi/2)$ is within $0.03\%$ of $\Phi/2$. The gap is the rule of thumb itself. With $\zeta = 0.7$ the decaying swing starts from an envelope $1/\sqrt{1-\zeta^2} = 1.40$ times the initial error, so reaching $2\%$ takes a few seconds longer. Sanity check: the answer is within $5\%$ of the rule, and about one natural period, as a well-damped loop should be.
:::

::: note No continuous feedback can catch every starting attitude
The sign guard makes the control law jump on the set of $180^\circ$ errors. That is not a flaw of this particular law. Because $SO(3)$ is not **[[contractible|contractible]]** — the topological fact behind the whole module — no continuous, time-invariant feedback can steer every starting attitude to one target. Every such law leaves some starting points that do not converge. For the quaternion law, that set is the $180^\circ$ boundary.

Dropping the guard removes the jump but brings in **[[unwinding|unwinding]]**: starting just past $180^\circ$, the vehicle turns the long way round. Real systems keep the guard, add **hysteresis** (a small dead band around the boundary, so the sign does not flicker back and forth), and accept a vanishingly thin set of starting attitudes that need a nudge.
:::

## Three-parameter error states and the multiplicative filter

A **[[Kalman filter|kalman-filter]]** is the standard estimator. Besides its best guess, it keeps a **covariance** — a matrix, $\mathbf{P}$, that says how uncertain the guess is in each direction. The trouble is that a quaternion has four numbers but only three freedoms. Lesson 07 showed that a $4\times 4$ covariance over a unit quaternion is broken by design. The rule $\lVert q\rVert = 1$ forbids any uncertainty along $q$ itself, so $\mathbf{P}q = \mathbf{0}$ and the matrix has a zero direction. The fix is to keep the quaternion out of the filter's matrix arithmetic entirely.

The **multiplicative extended Kalman filter** (MEKF, "multiplicative" because errors are multiplied on, not added) carries the attitude in two pieces:

- a unit quaternion $\hat{q}$ ("q-hat"), the full attitude, pushed forward in time by the quaternion kinematics and normalized;
- a three-number error $\delta\boldsymbol{\theta}$, defined by $q_{\text{true}} = \hat{q}\otimes\delta q(\delta\boldsymbol{\theta})$. It is held at zero by construction. Its $3\times 3$ covariance $\mathbf{P}$ is what the filter actually carries and updates.

Each measurement update produces an estimate $\delta\hat{\boldsymbol{\theta}}$ of the error. The filter folds it into the quaternion, renormalizes, and resets the error to zero:

$$
\hat{q} \leftarrow \frac{\hat{q}\otimes[\,1,\ \delta\hat{\boldsymbol{\theta}}/2\,]}{\bigl\lVert\hat{q}\otimes[\,1,\ \delta\hat{\boldsymbol{\theta}}/2\,]\bigr\rVert},
\qquad
\delta\hat{\boldsymbol{\theta}} \leftarrow \mathbf{0}.
$$

The arrow $\leftarrow$ means "replace with."

Picture a hiker with a map pin at $\hat{q}$. Every few minutes she spots a landmark, moves her pin by the error, and starts counting from zero again.

This buys three things. The error never grows large, so its straight-line approximation is never strained. The error has no length rule, so its covariance has no zero direction. And there is no sign ambiguity, because a small error is nowhere near the $180^\circ$ set. The same scheme works with $4\boldsymbol{\sigma}$ (four times the modified Rodrigues parameters) in place of $\delta\boldsymbol{\theta}$, since for small angles $\boldsymbol{\sigma}\approx\delta\boldsymbol{\theta}/4$. Lesson 09 showed MRPs are the most nearly linear of the three-number sets, which is why some filters prefer them.

::: example A star tracker update and reset, in arcseconds
A **[[star tracker|star-tracker]]** is a camera that recognizes star patterns. A filter holds

$$
\hat{q} = [0.9366721892,\ 0.0702207681,\ -0.1053311521,\ 0.3265265717]
$$

with error covariance $\mathbf{P} = \operatorname{diag}\bigl((30'')^2,\ (30'')^2,\ (200'')^2\bigr)$, in $\mathrm{rad^2}$. The $''$ means **[[arcseconds|arcsecond]]**, $1/3600$ of a degree. "diag" means those numbers down the diagonal, zeros elsewhere. So the attitude is known well across the camera's view ($30''$) and poorly about its line of sight ($200''$). That lopsided **[[shape|uncertainty-shape]]** is typical of a single star tracker. Its condition number (largest over smallest eigenvalue) is $(200/30)^2 = 44.4$ — harmless.

**The update.** A measurement returns $\delta\hat{\boldsymbol{\theta}} = (12,\ -8,\ 45)$ arcseconds. One arcsecond is $\pi/(180\times 3600) = 4.848\times 10^{-6}\,\mathrm{rad}$, so this is $(5.81776,\ -3.87851,\ 21.81662)\times 10^{-5}\,\mathrm{rad}$. Its length is $2.2909691\times 10^{-4}\,\mathrm{rad} = 47.255''$.

**The increment.** Halve the vector and put a $1$ in front:

$$
[\,1,\ \delta\hat{\boldsymbol{\theta}}/2\,] = [\,1,\ 2.90888\times 10^{-5},\ -1.93925\times 10^{-5},\ 1.090831\times 10^{-4}\,].
$$

Its length is more than $1$ by only $6.56\times 10^{-9}$. Still worth normalizing: it would pile up over thousands of updates. The exact increment $[\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$ differs from the normalized first-order one by $4.8\times 10^{-13}$ per component. At this error size the linear form is exact for any purpose.

**The reset.** Multiply, normalize, and zero the error:

$$
\hat{q} = [\,0.9366324793,\ 0.0702428567,\ -0.1053474775,\ 0.3266304469\,].
$$

Sanity check: the angle between the old and new estimates is $47.255''$, matching $\lVert\delta\hat{\boldsymbol{\theta}}\rVert$ to eight digits.

**The contrast.** Now map the same $3\times 3$ covariance into quaternion space, using the $4\times 3$ Jacobian (the table of rates of change) of $q = \hat{q}\otimes[1,\delta\boldsymbol{\theta}/2]$. The resulting $4\times 4$ matrix has eigenvalues $\{0,\ 5.29\times 10^{-9},\ 5.29\times 10^{-9},\ 2.35\times 10^{-7}\}\,\mathrm{rad^2}$. Each nonzero one is a quarter of a $3\times 3$ eigenvalue — the factor $\tfrac12$, squared. And one is exactly zero, with $\mathbf{P}_4\hat{q} = \mathbf{0}$ to machine precision. That zero is the unit-length rule. It is why the filter does its arithmetic in three dimensions and carries the fourth outside.
:::

::: warning Euler angles are not an error representation
Subtracting two Euler-angle triples gives neither the error rotation nor anything resolved in one frame, and near gimbal lock it is meaningless: two attitudes a hundredth of a degree apart can have triples that differ by $180^\circ$ in two components. The error is a rotation and must be computed as one: form $\delta q$ or $\delta\mathbf{C}$, then convert to whatever three numbers you want to display. A requirement written as "yaw error less than $0.1^\circ$" should be read as a limit on one component of a rotation vector, and stated that way.
:::

::: warning Keep the error's frame in the name
The two forms $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$ and $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ have identical scalar parts. So the reported pointing error is the same, and no size check can tell them apart. Only the frame of the vector part differs, so the controller pushes with the right strength about axes turned by the vehicle's own attitude. Name them `dq_body` and `dq_ref`. Unit-test with the vehicle at a large attitude, never at the identity, where the two agree.
:::

## Check yourself

::: check
An error quaternion has vector part $(0.0010,\ -0.0025,\ 0.0007)$. What is the pointing error in arcseconds, and about which axis?
:::

::: answer
**Length of the vector part.** Square, add, take the root: $\lVert\delta\mathbf{q}_v\rVert = \sqrt{10^{-6} + 6.25\times 10^{-6} + 4.9\times 10^{-7}} = \sqrt{7.74\times 10^{-6}} = 2.7821\times 10^{-3}$.

**The angle.** $\Phi = 2\arcsin(2.7821\times 10^{-3}) = 5.5642\times 10^{-3}\,\mathrm{rad}$. There are $206\,265$ arcseconds in a radian, so this is $5.5642\times 10^{-3}\times 206\,265 = 1147.7''$, or $0.3188^\circ$. (Twice the length, $5.5642\times 10^{-3}$, gives the same thing to five digits, as the small-angle table promises.)

**The axis.** Divide the vector part by its length: $(0.3594,\ -0.8986,\ 0.2516)$. It is in whichever frame the error was formed in. The numbers cannot tell you which — the variable name must.
:::

::: check
Design a quaternion attitude controller for $J = 400\,\mathrm{kg\,m^2}$ with $\omega_n = 0.10\,\mathrm{rad/s}$ and $\zeta = 1.0$. What torque does it command at a $30^\circ$ error, and is the linear model trustworthy there?
:::

::: answer
**Gains.** $K = 2J\omega_n^2 = 2(400)(0.01) = 8.00\,\mathrm{N\,m}$. Then $JK/2 = 400\times 4 = 1600$, so $D = 2\zeta\sqrt{1600} = 2\times 40 = 80.0\,\mathrm{N\,m\,s}$.

**Torque at $30^\circ$.** The vector part has length $\sin 15^\circ = 0.258819$, so the proportional torque is $8.00\times 0.258819 = 2.071\,\mathrm{N\,m}$.

**Is linear OK?** Only just. From the table, $2\lVert\delta\mathbf{q}_v\rVert$ understates the angle by $1.1\%$ at $30^\circ$. So the effective stiffness is about $1\%$ low and the response a little slower than designed. That is fine for a passing transient, but it should not be the design point. Size the bandwidth for small errors, and check the large-error response by simulation.
:::

::: check
Why is the error state in a multiplicative filter reset to zero after every update, rather than allowed to build up?
:::

::: answer
Because everything that makes the error state well behaved depends on it being small.

- Its covariance is the covariance of a *linearized* rotation, which is only valid while $\delta\boldsymbol{\theta}$ is small.
- It needs no unit-length rule only because it is a rotation vector, not a quaternion — and rotation vectors themselves go bad at $2\pi$.
- It has no sign ambiguity only because it is far from the $180^\circ$ set.

Folding the error into the quaternion and zeroing it keeps all three true however far the vehicle turns. The quaternion soaks up the large motion; the error state holds only what changed since the last update.
:::

::: check
Two teams report the same $0.05^\circ$ pointing error, but their controllers disagree about which way to turn. What single difference explains it, and what test settles it?
:::

::: answer
One team forms the error in body axes and the other in reference axes. The two forms $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$ and $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ have the same scalar part, so the same reported angle, but their vector parts differ by the vehicle's own attitude.

(A second suspect with a similar signature is a missing shortest-path sign guard, which flips the vector part outright. But that would report $359.95^\circ$, not $0.05^\circ$, unless the angle was computed from $\lVert\delta\mathbf{q}_v\rVert$.)

**The test.** Put the vehicle at a large known attitude, such as $90^\circ$ about a body axis. Add a known small error about a *different* body axis. Check which team's error vector points along that body axis. At the identity attitude the two forms agree, and the test proves nothing.
:::

::: check
A filter reports attitude uncertainty as a $3\times 3$ covariance whose diagonal has square roots $(15'',\ 15'',\ 90'')$. What is the total pointing uncertainty, and why is the third number so much larger?
:::

::: answer
**Total.** Treat the three as independent. The expected squared size of the rotation vector is the sum of the diagonal (the trace): $15^2 + 15^2 + 90^2 = 225 + 225 + 8100 = 8550\,\mathrm{arcsec^2}$. The square root is $92.5''$, about $0.026^\circ$. Barely more than $90''$: the biggest term dominates.

**Why the third is large.** A single star tracker sees sideways motion much better than a roll about its line of sight. If the tracker tips sideways by an angle $\epsilon$, every star on the image moves by $\epsilon$. If it rolls by $\epsilon$ about its line of sight, a star moves only by $\epsilon$ times the sine of its angle from the center of view — a small number for a camera with a narrow view. So the roll information is weaker by a factor of several. That is why spacecraft carry two trackers pointing in widely different directions when roll knowledge matters.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\delta q = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ | Attitude error quaternion (flashcard form; body-resolved when $q$ means $q_{B\leftarrow N}$ with JPL multiplication) |
| $\delta q^{B} = q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$ | Body-resolved error with this module's $q_{N\leftarrow B}$, Hamilton |
| $\delta\mathbf{q}^{N}_v = \mathbf{C}(q_{\text{est}})\,\delta\mathbf{q}^{B}_v$ | Same scalar part, same angle; only the vector part's frame differs |
| $\delta q \approx [1,\ \delta\boldsymbol{\theta}/2]$ | Small-angle form; vector part is half the rotation vector |
| $\Phi = 2\arcsin\lVert\delta\mathbf{q}_v\rVert$ | Pointing error, well behaved at small angles |
| Relative error $\approx -\Phi^2/24$ | $1.3\times 10^{-5}$ at $1^\circ$, $1.1\times 10^{-2}$ at $30^\circ$ |
| $\boldsymbol{\tau} = K\delta\mathbf{q}^{B}_v - D\boldsymbol{\omega}^{B}$ | Standard law, with $w \ge 0$ guard; torque never exceeds $K$ |
| $\omega_n = \sqrt{K/2J}$, $\zeta = D/(2\sqrt{JK/2})$ | Closed-loop design from the linearized error dynamics |
| $\hat{q}\leftarrow \hat{q}\otimes[1,\delta\hat{\boldsymbol{\theta}}/2]$ (normalized), then $\delta\hat{\boldsymbol{\theta}}\leftarrow \mathbf{0}$ | Multiplicative filter update and reset |
| $\mathbf{P}$ is $3\times 3$ | Full rank; the $4\times 4$ version has an exact zero eigenvalue along $\hat{q}$ |
| Worked figures | $J = 1200$, $\omega_n = 0.05$, $\zeta = 0.7$ gives $K = 6.00\,\mathrm{N\,m}$, $D = 84.0\,\mathrm{N\,m\,s}$, settling $119.6\,\mathrm{s}$ from $5^\circ$ |

Small rotations have behaved like arrows all through this lesson — added, scaled, given covariances. The last lesson explains why that works, what the exact statement is, and where the flat picture ends.

::: context resolved-in Same arrow, different numbers
An arrow is a physical thing. Its three numbers are not: they depend on which axes you measure it against. Here the red arrow is fixed. Measured against the grey reference axes it is about $(0.34,\ 0.94)$. Measured against the blue body axes, turned $41^\circ$, the same arrow is about $(0.87,\ 0.48)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="150" x2="300" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <line x1="180" y1="150" x2="180" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <text x="304" y="154" font-size="12" fill="#6c7a93">x ref</text>
  <text x="168" y="24" font-size="12" fill="#6c7a93">y ref</text>
  <line x1="180" y1="150" x2="263" y2="77.8" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="150" x2="107.8" y2="67" stroke="#1d6fd1" stroke-width="2"/>
  <text x="268" y="76" font-size="12" fill="#1d6fd1">x body</text>
  <text x="62" y="64" font-size="12" fill="#1d6fd1">y body</text>
  <line x1="180" y1="150" x2="214.2" y2="56" stroke="#b4232c" stroke-width="3"/>
  <polygon points="214.2,56 205.4,65.6 214.8,69" fill="#b4232c"/>
  <text x="222" y="48" font-size="12" fill="#b4232c">error axis</text>
  <text x="20" y="172" font-size="11" fill="#1f2a44">reference: (0.34, 0.94)   body: (0.87, 0.48)</text>
</svg>
```
:::

::: context linearization Trading a curve for a straight line
To **linearize** is to replace a curve by the straight line that touches it at the point you care about. Near $x = 0$, $\sin x$ hugs the line $y = x$. So for small angles you may swap $\sin(\Phi/2)$ for $\Phi/2$ and every equation becomes one you can solve with ordinary algebra. The price is an error that grows like $\Phi^2$: tiny at a degree, a few percent at $60^\circ$. Nearly all of estimation and control rests on this trade, which is why engineers work so hard to keep errors small.
:::

::: context second-order A mass on a spring, with a shock absorber
The equation $J\ddot{x} + D\dot{x} + kx = 0$ describes a car's suspension, a door closer and this attitude loop. The spring alone would swing back and forth at the **natural frequency** $\omega_n = \sqrt{k/J}$. The damper eats the swing. The **damping ratio** $\zeta$ says how fast: at $\zeta = 1$ the error slides home with no overshoot; at $\zeta = 0.7$ it overshoots by about $5\%$ and settles quickly, a favorite design choice. The classical-control module later in the course treats this system in full; here it arrives because the quaternion law, for small errors, *is* a spring and a damper with stiffness $K/2$.
:::

::: context saturation Why the push levels off
The proportional torque is $K\sin(\Phi/2)$ (blue). A rotation-vector law with the same small-error stiffness would be $K\Phi/2$ (grey). They agree for small errors. Past about $60^\circ$ the quaternion law bends over and tops out at exactly $K$ at a half turn, while the straight line keeps climbing to $1.57K$. A bounded command is kinder to wheels and thrusters that have limits anyway.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="46" y1="86.25" x2="330" y2="86.25" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="18" y="90" font-size="12" fill="#1f2a44">K</text>
  <text x="46" y="198" font-size="11" fill="#1f2a44">0°</text>
  <text x="178" y="198" font-size="11" fill="#1f2a44">90°</text>
  <text x="314" y="198" font-size="11" fill="#1f2a44">180°</text>
  <text x="258" y="206" font-size="11" fill="#1f2a44">error Φ</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="50.0,180.0 65.6,171.8 81.1,163.6 96.7,155.5 112.2,147.3 127.8,139.1 143.3,130.9 158.9,122.7 174.4,114.6 190.0,106.4 205.6,98.2 221.1,90.0 236.7,81.8 252.2,73.6 267.8,65.5 283.3,57.3 298.9,49.1 314.4,40.9 330.0,32.7"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,180.0 65.6,171.8 81.1,163.7 96.7,155.7 112.2,147.9 127.8,140.4 143.3,133.1 158.9,126.2 174.4,119.7 190.0,113.7 205.6,108.2 221.1,103.2 236.7,98.8 252.2,95.0 267.8,91.9 283.3,89.4 298.9,87.7 314.4,86.6 330.0,86.2"/>
  <text x="236" y="42" font-size="12" fill="#6c7a93">K Φ/2</text>
  <text x="236" y="120" font-size="12" fill="#1d6fd1">K sin(Φ/2)</text>
</svg>
```
:::

::: context reaction-wheel Spinning a wheel to turn the ship
A **reaction wheel** is a heavy flywheel driven by an electric motor. Speed the wheel up one way and the spacecraft turns the other way, because the total spin of the whole system cannot change. Three or four wheels, mounted along different axes, can turn a spacecraft about any axis without burning propellant. They deliver small torques — from thousandths of a newton-meter on a small satellite to around one on a large one — which is why the $0.26\,\mathrm{N\,m}$ in the example is a realistic number and why a bounded command matters.
:::

::: context contractible A space you can shrink to a point
A space is **contractible** if you can shrink the whole thing smoothly down to a single point, like squeezing a ball of clay. A disk is contractible. A circle is not: you cannot shrink it to a point without tearing it. The attitudes about a single axis form a circle, and $SO(3)$ carries the same kind of obstruction in three dimensions. Mathematicians proved (Bhat and Bernstein, 2000) that this forces every continuous attitude control law to leave some starting attitudes behind.
:::

::: context unwinding Turning the long way round
Show the attitudes about one axis as a circle, with the target at the top. A vehicle $190^\circ$ away should finish the turn the short way — $170^\circ$ more. Without the sign guard, the quaternion law only knows how to drive toward one of the two quaternions for the target, and may send it $190^\circ$ back the long way. That wasted slew is **unwinding**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M169.2,171.1 A62,62 0 0,1 180,48" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M166.5,186.8 A78,78 0 1,0 180,32" fill="none" stroke="#b4232c" stroke-width="3" stroke-dasharray="6 4"/>
  <circle cx="180" cy="40" r="5" fill="#1f2a44"/>
  <circle cx="167.8" cy="178.9" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="190" y="22" font-size="12" fill="#1f2a44">target (0°)</text>
  <text x="178" y="204" font-size="12" fill="#1f2a44">vehicle at 190°</text>
  <text x="14" y="104" font-size="12" fill="#1d6fd1">guard: 170°</text>
  <text x="14" y="120" font-size="12" fill="#1d6fd1">the short way</text>
  <text x="266" y="104" font-size="12" fill="#b4232c">no guard: 190°</text>
  <text x="266" y="120" font-size="12" fill="#b4232c">the long way</text>
</svg>
```
:::

::: context kalman-filter Guessing well, and knowing how well
A **Kalman filter** blends a prediction (from a model of how the vehicle moves) with measurements (from sensors), weighting each by how much it can be trusted. It keeps two things: the best guess, and a covariance saying how uncertain that guess is. Rudolf Kálmán published it in 1960, and it flew on the Apollo guidance computer. The "extended" version handles curved, nonlinear problems by linearizing around the current guess — which is exactly why the error must stay small. The estimation modules later in the course build it step by step.
:::

::: context star-tracker A camera that reads the sky
A **star tracker** takes a picture of the sky, finds the bright dots, matches their pattern against a catalog of thousands of stars, and works out which way it is pointing. Good ones do this several times a second to a few arcseconds. The catch is roll: turning about the camera's own line of sight barely moves the stars in a narrow field of view, so that axis is known several times worse.
:::

::: context arcsecond How small an arcsecond is
A degree splits into $60$ arcminutes, and each arcminute into $60$ **arcseconds**, so an arcsecond is $1/3600$ of a degree, about $4.85\times 10^{-6}$ radians. A coin $2.5\,\mathrm{cm}$ across seen from about $5.2\,\mathrm{km}$ away covers one arcsecond. Space telescopes and star trackers routinely quote attitude in arcseconds because degrees would need too many zeros.
:::

::: context uncertainty-shape The shape of not knowing
A covariance can be pictured as an ellipse: its width in each direction is how uncertain you are that way. For one star tracker it is long and thin — $200''$ about the line of sight, $30''$ across it. Drawn to scale, the long axis is $6.7$ times the short one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="60" rx="150" ry="22.5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="37.5" x2="180" y2="82.5" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="180" y="106" font-size="12" text-anchor="middle" fill="#1f2a44">about the line of sight: ±200″</text>
  <text x="190" y="32" font-size="12" fill="#1f2a44">across: ±30″</text>
</svg>
```
:::
