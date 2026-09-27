---
id: l10-lpv-and-gain-scheduling
title: Gain scheduling with guarantees, and LPV control
minutes: 24
covers:
  - Linear parameter-varying control and gain scheduling with guarantees
---

Think about riding a bicycle. Now imagine the bike changing *while you ride it* — the frame stretching, the wheels getting lighter every second. That is what every vehicle in this course does.

A launch vehicle's air forces are zero on the pad, peak at **[[maximum dynamic pressure|max-q]]** and fade away above the atmosphere. Meanwhile its mass falls by a factor of five and its first bending frequency climbs by tens of percent. An aircraft changes with Mach number, altitude and what hangs under its wings. A spacecraft changes as propellant is used up and solar arrays unfold. One fixed linear controller cannot serve all of that. The answer used across the industry is to design several controllers and blend between them. That is **gain scheduling**.

Gain scheduling has flown nearly every vehicle ever built. What it does not do, in its classic form, is *prove* anything. This lesson shows exactly how it can fail, says when it is safe, and then builds the **linear parameter-varying** (LPV) framework, which replaces hope with a proof: one controller, designed once, with a guarantee that holds however the parameter moves inside declared limits.

## Classical gain scheduling and its silent assumption

The recipe is like the settings chart on a clothes dryer: cotton here, wool there. Pick a **scheduling variable** $\rho$ (the Greek letter "rho") — something you can measure or estimate in flight, such as Mach number, **[[dynamic pressure|scheduling-variable]]**, time since lift-off, or propellant mass. Then:

1. Linearize the plant at a grid of values $\rho_1, \dots, \rho_N$.
2. Design a controller $\mathbf{K}_i$ at each grid point.
3. In flight, interpolate the controller gains as a function of the measured $\rho$.

The analysis that goes with it is a **frozen-time** analysis. For each $\rho_i$, you hold $\rho$ still and check that the closed loop with $\mathbf{K}_i$ and the plant at $\rho_i$ is stable with good margins. That proves something about a *family of constant systems*.

But the vehicle is not a constant system. It is a **time-varying** system,

$$\dot{x} = \mathbf{A}(\rho(t))\,x,$$

where the matrix $\mathbf{A}$ changes as $\rho$ changes. For a time-varying system, the eigenvalues of $\mathbf{A}(\rho(t))$ at each instant say nothing at all about stability. Here is a case you can check yourself.

::: example Two stable systems that alternate into instability
Take

$$\mathbf{A}_1 = \begin{pmatrix}-1 & 10 \\ 0 & -1\end{pmatrix}, \qquad \mathbf{A}_2 = \mathbf{A}_1^\mathsf{T} = \begin{pmatrix}-1 & 0 \\ 10 & -1\end{pmatrix}.$$

($\mathbf{A}_1^\mathsf{T}$, read "A one transpose", is $\mathbf{A}_1$ with rows and columns swapped.) Each matrix is triangular, so its eigenvalues are its diagonal entries: both at $-1$. On its own, each system dies away with a one-second time constant. Any frozen-time analysis calls both of them stable with room to spare.

Now switch back and forth: spend a dwell time $t$ in $\mathbf{A}_1$, then $t$ in $\mathbf{A}_2$, and repeat. Over one full cycle the state gets multiplied by the matrix $e^{\mathbf{A}_2t}e^{\mathbf{A}_1t}$. The size of its largest eigenvalue — its **[[spectral radius|spectral-radius]]** — is how much the state grows per cycle in the long run:

| dwell $t$ (s) | amplification per cycle |
| --- | --- |
| 0.2 | 3.907 |
| 0.5 | 9.919 |
| 1.0 | 13.803 |

Read the middle row. With a half-second dwell, a full cycle takes one second, so the state grows by a factor of about ten *every second*. Nothing has been disturbed. At every instant, the system is exactly one of two stable systems.

Why? Look at very fast switching. Then the cycle map tends to $e^{(\mathbf{A}_1 + \mathbf{A}_2)t}$, so the behavior is set by the **[[average matrix|average-matrix]]**

$$\frac{\mathbf{A}_1 + \mathbf{A}_2}{2} = \begin{pmatrix}-1 & 5 \\ 5 & -1\end{pmatrix}, \qquad \text{eigenvalues } +4\ \text{and}\ -6 .$$

Sanity check: this symmetric matrix has eigenvectors $(1,1)$ and $(1,-1)$, giving $-1 + 5 = 4$ and $-1 - 5 = -6$. The average of two stable matrices is unstable.

Each system squeezes hard along one direction and shears hard across it. The shear of one feeds the weakly squeezed direction of the other, so energy is pumped in faster than either can remove it — like a child **[[pumping a swing|pumping-a-swing]]**. A gain-scheduled loop whose eigenvector directions turn as $\rho$ moves can do exactly this, and no table of frozen margins will show it.
:::

Two more hazards live in the same place.

**Hidden coupling terms.** Suppose $\rho$ depends on the state — you schedule on angle of attack, or on measured dynamic pressure, which depends on velocity. Then differentiating the scheduled control law produces extra terms involving $\partial\mathbf{K}/\partial\rho\cdot\dot{\rho}$ (read "the partial derivative of K with respect to rho, times rho-dot"). The frozen analysis never sees them. They are real feedback paths, and they can destabilize the loop. Scheduling on an outside variable, such as time or a pre-planned Mach profile, avoids them. Scheduling on a state does not.

**Interpolating the wrong object.** A controller can be written as a state-space model in many different ways that behave identically. So averaging the *matrices* of two controllers is not the same as averaging the *controllers*: two equivalent controllers can have wildly different matrices, and their average may behave like neither. The standard defenses are to use one consistent form across the whole schedule (observer canonical form, or a velocity-form implementation), and to handle integrator states carefully so a schedule change does not kick the actuator — **[[bumpless transfer|bumpless-transfer]]**.

::: warning Frozen-time margins are a necessary condition, not a sufficient one
Good margins at every point of a schedule do not imply stability while the schedule moves. This is not a technicality: the example above is a two-state system with textbook eigenvalues. The classical rule that saves gain scheduling in practice is that $\rho$ must change *slowly* compared with the closed-loop dynamics. That rule is sound, but it is a rule, not a proof, and "slowly" is rarely given a number in a design review.
:::

## When frozen design is safe: the slow-variation argument

Picture a movie made of still frames. If the scene changes slowly compared with the frame rate, the stills tell the story well. The frozen analysis works the same way. If $\dot{\rho}$ is small enough, the time-varying system inherits the stability of the frozen family. To make "small enough" a number, compare how fast the plant changes with how fast the loop responds.

For the booster, use $\mu_\alpha$ (read "mu sub alpha"), the **[[aerodynamic instability coefficient|mu-alpha]]** from the atmospheric flight module. It is proportional to dynamic pressure. It rises from about $0.038\,\mathrm{s^{-2}}$ at twenty seconds to $0.228\,\mathrm{s^{-2}}$ at maximum dynamic pressure, about forty seconds later.

Step 1, the average rate: $(0.228 - 0.038)/40 = 4.75\times 10^{-3}\,\mathrm{s^{-3}}$.

Step 2, the *relative* rate — the rate as a fraction of the value:

$$\frac{\dot{\mu}_\alpha}{\mu_\alpha} \approx \frac{4.75\times 10^{-3}}{0.228} = 0.021\ \mathrm{s^{-1}}.$$

Step 3, compare with the closed-loop bandwidth of about $1.5\,\mathrm{rad/s}$: $1.5/0.021 \approx 71$.

The plant changes about seventy times more slowly than the loop responds. So here the frozen analysis is well justified — and now that is a number rather than a feeling. Compare a re-entry vehicle going from hypersonic to transonic in a few seconds, or an aircraft releasing a heavy store. There the same ratio can drop below ten, and the argument stops holding.

## Quadratic stability: a proof that covers any rate

The LPV framework drops the "frozen" assumption completely. Write the vehicle as

$$\dot{x} = \mathbf{A}(\rho(t))\,x + \mathbf{B}(\rho(t))\,u,$$

where $\rho(t)$ is measured in real time and stays inside a known set. Usually the set is a **polytope** — a box or other flat-sided shape — with corners (vertices) $\rho^{(1)}, \dots, \rho^{(V)}$. We also ask that $\mathbf{A}(\rho)$ be **affine** in $\rho$: a constant matrix plus $\rho$ times another constant matrix. Then $\mathbf{A}(\rho)$ at any point inside is a weighted blend of the corner matrices.

Now the picture. Put a marble in a bowl. Wherever it is, it rolls downhill toward the bottom. Suppose you can find *one* bowl that slopes downhill for every frozen system in the family. Then it does not matter how fast you switch between them: every one of them rolls the marble down *that same bowl*, so the marble can never climb. That bowl is a **[[Lyapunov function|lyapunov-bowl]]** $V(x) = x^\mathsf{T}\mathbf{P}x$, and finding one shared $\mathbf{P}$ is the whole game.

The notation: $\mathbf{P} \succ 0$ (read "P is positive definite") means $x^\mathsf{T}\mathbf{P}x > 0$ for every nonzero $x$ — the bowl really is a bowl. $\mathbf{Q} \prec 0$ ("Q is negative definite") means $x^\mathsf{T}\mathbf{Q}x < 0$ for every nonzero $x$. Along a trajectory, $\dot{V} = x^\mathsf{T}(\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A})x$, so the bowl slopes downhill exactly when $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} \prec 0$.

::: key Quadratic stability
If there is a single $\mathbf{P} \succ 0$ with

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho) \prec 0 \quad\text{for every admissible }\rho,$$

then $V(x) = x^\mathsf{T}\mathbf{P}x$ decreases along every trajectory and the system is stable for **arbitrarily fast** parameter variation. For an affine polytopic model it suffices to check the inequality at the vertices, because the left side is then affine in $\rho$ and a negative-definite affine function of a convex combination is a convex combination of negative-definite matrices.
:::

That last sentence is what makes the method computable. An infinite family of conditions collapses to $V$ **[[linear matrix inequalities|lmi]]**, one per corner, and computers solve those reliably. It also explains the switching example: $\mathbf{A}_1$ and $\mathbf{A}_2$ have *no* common $\mathbf{P}$, which is why alternating between them can diverge.

::: note Why it has to be true: corners are enough
Any admissible $\rho$ is a blend of the corners, $\rho = \sum_i\lambda_i\rho^{(i)}$, with weights $\lambda_i \ge 0$ that add up to $1$. Because $\mathbf{A}$ is affine, the same weights blend the matrices: $\mathbf{A}(\rho) = \sum_i\lambda_i\mathbf{A}(\rho^{(i)})$. Plug that in:

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho) = \sum_i\lambda_i\left(\mathbf{A}(\rho^{(i)})^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho^{(i)})\right).$$

Sandwich both sides between $x^\mathsf{T}$ and $x$: each bracket gives a negative number, and a blend of negative numbers is negative. So the corner checks cover every point inside.
:::

::: example Quadratic stability of the booster's attitude loop
The booster's pitch motion is $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$, where $\theta$ is the attitude error and $\delta$ the engine gimbal angle. The coefficient $\mu_\delta$ ("mu sub delta") says how hard one radian of gimbal turns the vehicle. The proportional-derivative law is $\delta = -K_p\theta - K_d\dot{\theta}$.

Fix the gains at $K_p = 1.88$, $K_d = 1.59$. Take $\mu_\delta = 1.317\,\mathrm{s^{-2}}$, and let $\mu_\alpha$ range over $[0,\ 0.5]\,\mathrm{s^{-2}}$ — from the pad to beyond maximum dynamic pressure.

**Step 1, the closed-loop matrix.** Substitute the law: $\ddot{\theta} = (\mu_\alpha - \mu_\delta K_p)\theta - \mu_\delta K_d\dot{\theta}$. With state $x = (\theta, \dot{\theta})$, and $\mu_\delta K_p = 2.476$, $\mu_\delta K_d = 2.094$:

$$\mathbf{A}(\mu_\alpha) = \begin{pmatrix}0 & 1 \\ \mu_\alpha - \mu_\delta K_p & -\mu_\delta K_d\end{pmatrix} = \begin{pmatrix}0 & 1 \\ \mu_\alpha - 2.476 & -2.094\end{pmatrix}.$$

This is affine in $\mu_\alpha$, so the vertices are $\mu_\alpha = 0$ and $\mu_\alpha = 0.5$.

**Step 2, the frozen picture.** The frozen eigenvalues are $-1.047 \pm 1.175j$ at one end and $-1.047 \pm 0.938j$ at the other. The real part does not move at all, because only the stiffness entry depends on $\mu_\alpha$.

**Step 3, a candidate bowl.** Solve the Lyapunov equation at the midpoint, $\mathbf{A}(0.25)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(0.25) = -\mathbf{I}$:

$$\mathbf{P} = \begin{pmatrix}1.2406 & 0.2246 \\ 0.2246 & 0.3460\end{pmatrix}.$$

Its eigenvalues are $0.293$ and $1.294$, both positive, so $\mathbf{P} \succ 0$.

**Step 4, test the corners.** The largest eigenvalue of $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}$ is $-0.953$ at $\mu_\alpha = 0$ and $-0.841$ at $\mu_\alpha = 0.5$. Both negative. So this single $\mathbf{P}$ is a common Lyapunov function, and the loop is stable *no matter how fast* the dynamic pressure changes. That is a far stronger statement than a frozen margin sweep, and it took two Lyapunov solves.

**How far does it stretch?** The frozen loop loses stability at $\mu_\alpha = \mu_\delta K_p = 2.476$, where the proportional gain can no longer beat the aerodynamic moment. The midpoint recipe of Step 3 keeps producing a working $\mathbf{P}$ up to about $\mu_\alpha = 2.18$. A proper search over all $\mathbf{P}$ does better: a common $\mathbf{P}$ exists at least up to $\mu_\alpha = 2.47$, a hair short of the frozen limit. So for this plant, quadratic stability costs almost nothing. That is a lucky feature of its structure — only one entry of $\mathbf{A}$ moves — and the general case is not so kind.
:::

## Rate bounds and parameter-dependent Lyapunov functions

Quadratic stability can be too cautious. It certifies the loop against infinitely fast parameter changes that the real vehicle cannot produce.

The fix is to let the bowl change shape with the parameter, $\mathbf{P}(\rho)$, and in return to promise a speed limit on the parameter: $\lvert\dot{\rho}_i\rvert \le \nu_i$ ($\nu$ is the Greek letter "nu"). The test becomes

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P}(\rho) + \mathbf{P}(\rho)\mathbf{A}(\rho) + \sum_i\dot{\rho}_i\frac{\partial\mathbf{P}}{\partial\rho_i} \prec 0$$

for all admissible $\rho$ and all $\lvert\dot{\rho}_i\rvert \le \nu_i$. The extra sum is the price of a moving bowl: while the marble rolls, the bowl itself can tilt under it. The rate bound keeps that tilt finite. Let $\nu \to \infty$ and you are forced back to a constant $\mathbf{P}$.

This is where the "slowly varying" folklore finally gets a rigorous form. The rate bound is a declared, checkable input, and the certificate holds for every trajectory that respects it.

For **synthesis** — designing the controller, not only testing it — the same machinery carries performance. The **[[bounded real lemma|bounded-real-lemma]]** says $\lVert\mathbf{G}\rVert_\infty < \gamma$ for a linear time-invariant system if and only if a certain matrix inequality in $\mathbf{P}$ holds. Impose its parameter-dependent version at the vertices and solve for a parameter-dependent controller. The result is **self-scheduled H-infinity synthesis**. Out comes one controller whose matrices are explicit functions of the measured $\rho$, plus a guarantee: for every admissible parameter trajectory, the closed loop is stable and the **induced $L_2$ gain** (the worst-case energy gain) from disturbance to weighted error is below $\gamma$.

::: key LPV control versus ad hoc gain scheduling
Classic gain scheduling interpolates point designs and proves nothing about the transitions. LPV synthesis designs a single parameter-dependent controller with a stability guarantee over the whole parameter trajectory, usually bounded by a parameter rate limit.
:::

LPV is not free, and it is worth being plain about the bill.

- The controller is a parameter-dependent state-space model that the flight software must evaluate every cycle, not a table of gains.
- The guarantee covers a *set* of parameter trajectories, including physically impossible ones, so the design is more cautious than the real flight needs.
- The number of inequalities grows with the number of vertices, and that grows exponentially with the number of scheduling variables — **[[two corners per variable|vertex-count]]**. Three or four parameters is a practical ceiling without extra structure.
- The certificate is only as good as the declared parameter set and rate bounds, which are engineering assumptions like any other.

Here is the lesson's arithmetic as a script.

```python
import numpy as np


def lyap(A, Q):
    """Solve A^T P + P A + Q = 0 by the Kronecker (vec) formulation."""
    n = A.shape[0]
    I = np.eye(n)
    K = np.kron(I, A.T) + np.kron(A.T, I)
    return np.linalg.solve(K, -Q.reshape(-1, order='F')).reshape((n, n), order='F')


def expm(A):
    """Matrix exponential by scaling and squaring with a Taylor series."""
    k = int(np.ceil(max(0.0, np.log2(max(np.linalg.norm(A, np.inf), 1e-30))))) + 4
    As, E, term = A / 2**k, np.eye(A.shape[0]), np.eye(A.shape[0])
    for j in range(1, 30):
        term = term @ As / j
        E = E + term
    for _ in range(k):
        E = E @ E
    return E


A1 = np.array([[-1.0, 10.0], [0.0, -1.0]])
A2 = A1.T
print("eigenvalues of A1:", np.linalg.eigvals(A1), " of A2:", np.linalg.eigvals(A2))
for t in (0.2, 0.5, 1.0):
    rho = max(abs(np.linalg.eigvals(expm(A2 * t) @ expm(A1 * t))))
    print(f"  dwell {t:.1f} s each: amplification per cycle = {rho:.3f}")
print("eigenvalues of the average (A1+A2)/2:", np.linalg.eigvals((A1 + A2) / 2))

P = lyap(A1, np.eye(2))
print("P from A1 is positive definite:", bool(np.all(np.linalg.eigvalsh(P) > 0)))
print("eig(A2^T P + P A2) =", np.linalg.eigvalsh(A2.T @ P + P @ A2))

mud, Kp, Kd = 1.317, 1.88, 1.59            # booster control coefficient and PD gains
Acl = lambda mua: np.array([[0.0, 1.0], [mua - mud * Kp, -mud * Kd]])
P = lyap(Acl(0.25), np.eye(2))
print("\ncommon P for mu_alpha in [0, 0.5]:\n", P.round(4))
for mua in (0.0, 0.5):
    print(f"  mu_alpha={mua}: max eig(A^T P + P A) = {max(np.linalg.eigvalsh(Acl(mua).T @ P + P @ Acl(mua))):.4f}")
#   dwell 0.5 s each: amplification per cycle = 9.919
# eigenvalues of the average (A1+A2)/2: [ 4. -6.]
# eig(A2^T P + P A2) = [-255.95097568  253.95097568]
#   mu_alpha=0.0: max eig(A^T P + P A) = -0.9530
#   mu_alpha=0.5: max eig(A^T P + P A) = -0.8407
```

::: example Reading a failed common-P search
Run the same test on the switching example.

**Step 1.** Solve $\mathbf{A}_1^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}_1 = -\mathbf{I}$:

$$\mathbf{P} = \begin{pmatrix}0.5 & 2.5 \\ 2.5 & 25.5\end{pmatrix}.$$

It is positive definite, and by construction $\mathbf{A}_1^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}_1$ has both eigenvalues at $-1$.

**Step 2.** Test the same $\mathbf{P}$ against $\mathbf{A}_2$. The eigenvalues of $\mathbf{A}_2^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}_2$ are $-255.95$ and $+253.95$: wildly indefinite, meaning the bowl slopes steeply *uphill* in some direction.

**Step 3, read it carefully.** One candidate failing does not prove that no common $\mathbf{P}$ exists. But it is a strong hint, and here the switching simulation settles it: a system that switching can destabilize cannot be quadratically stable.

In a design office the order is reversed. First run the convex search for a common $\mathbf{P}$ over the vertices. If it succeeds, you hold a certificate for every rate, and you are done. If it fails, add rate bounds and search for a $\mathbf{P}(\rho)$, or hunt for a destabilizing parameter trajectory — which, if found, tells the program more than another margin table.
:::

::: warning An LPV guarantee is about a parameter set, not a flight
The certificate covers every $\rho(t)$ inside the declared polytope that respects the declared rate bounds. If the vehicle leaves that set — an off-nominal trajectory, a failed engine changing the mass properties, an atmosphere colder than the dispersions assumed — the guarantee is void, exactly as an uncertainty weight's guarantee is void outside its set. Declaring the parameter set is the same engineering act as declaring an uncertainty weight, and it deserves the same scrutiny.
:::

## Check yourself

::: check
Every frozen point of a schedule has $6\,\mathrm{dB}$ gain margin and $45^\circ$ phase margin. What, precisely, has been established?
:::

::: answer
That each member of a family of constant-coefficient closed loops is stable with those margins. Nothing has been established about the vehicle, which is a time-varying system.

The counterexample in this lesson has two constant-coefficient systems with both eigenvalues at $-1$ — margins as good as you like — that amplify the state by a factor of about ten per second when alternated.

To turn the frozen result into a statement about the vehicle you need one of two things. Either a slow-variation argument, with the rate given a number and compared with the closed-loop bandwidth. Or a Lyapunov certificate: a common $\mathbf{P}$ for arbitrary rates, or a parameter-dependent $\mathbf{P}(\rho)$ with declared rate bounds.
:::

::: check
Why does checking the quadratic stability inequality at the vertices of a polytope suffice when $\mathbf{A}(\rho)$ is affine in $\rho$?
:::

::: answer
If $\mathbf{A}(\rho)$ is affine, any admissible $\rho$ is a convex combination $\rho = \sum_i\lambda_i\rho^{(i)}$ with $\lambda_i \ge 0$ and $\sum\lambda_i = 1$, and then $\mathbf{A}(\rho) = \sum_i\lambda_i\mathbf{A}(\rho^{(i)})$. So

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho) = \sum_i\lambda_i\left(\mathbf{A}(\rho^{(i)})^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho^{(i)})\right).$$

That is a convex combination of matrices that are each negative definite. A convex combination of negative-definite matrices, with non-negative weights summing to one, is negative definite. So $V$ conditions imply the whole continuum.

Notice the two things this needs. $\mathbf{P}$ must be the *same* matrix in every term — which is why quadratic stability uses a constant $\mathbf{P}$. And $\mathbf{A}$ must be affine — which is why LPV models are built in polytopic or linear-fractional form, not by fitting arbitrary functions of $\rho$.
:::

::: check
The booster's $\mu_\alpha$ changes at a relative rate of about $0.021\,\mathrm{s^{-1}}$ against a closed-loop bandwidth of $1.5\,\mathrm{rad/s}$. A re-entry vehicle's dominant parameter changes at a relative rate of $0.6\,\mathrm{s^{-1}}$ against a bandwidth of $4\,\mathrm{rad/s}$. Comment on both.
:::

::: answer
**Booster:** $1.5/0.021 = 71$. The loop settles roughly seventy times faster than the plant changes. The frozen-time picture is an excellent approximation, and classical gain scheduling with a frozen margin sweep is defensible.

**Re-entry vehicle:** $4/0.6 = 6.7$. That is where the frozen approximation starts to be questionable. The loop has time for only a few time constants before the plant has moved noticeably, so transition behavior is a real risk. Any hidden coupling terms from scheduling on a state-dependent variable will not be negligible either.

That case wants either an LPV design with a rate bound of $0.6\,\mathrm{s^{-1}}$, or at the very least a time-varying simulation of the whole transition with dispersions — not a table of frozen margins.
:::

::: check
A colleague proposes scheduling the attitude gains on measured angle of attack because it correlates well with the aerodynamic coefficients. What is the objection?
:::

::: answer
Angle of attack is a state of the closed loop, not an outside signal. Scheduling on it makes the control law $u = -\mathbf{K}(\alpha)x$, which is nonlinear in the state. Linearizing it about an operating point produces extra terms proportional to $\partial\mathbf{K}/\partial\alpha$ times the state. That is hidden coupling that no frozen-point analysis contains, and it can destabilize the loop directly.

It also creates a feedback risk: a disturbance raises $\alpha$, which changes the gains, which changes the response to $\alpha$.

Safer choices are variables that the attitude loop does not drive on the same timescale: time from lift-off, a planned Mach profile, measured dynamic pressure or propellant mass. If a state-dependent schedule cannot be avoided, the right framework is **[[quasi-LPV|quasi-lpv]]**, where the state dependence is declared honestly and the resulting parameter set is bounded and rate-limited in the analysis.
:::

::: check
Explain why a design can be quadratically stable yet have poor performance, and what the bounded real lemma adds.
:::

::: answer
Quadratic stability says only that $x^\mathsf{T}\mathbf{P}x$ decreases: the state goes to zero for any admissible parameter trajectory. It says nothing about how fast, about the response to disturbances, or about actuator effort. A loop can pass it with a decay so slow that the pointing requirement is missed the whole time.

The bounded real lemma upgrades the certificate from stability to performance. The same kind of matrix inequality, with extra blocks, certifies that the induced $L_2$ gain from a weighted disturbance input to a weighted error output is below $\gamma$, for every admissible parameter trajectory. That makes the LPV result directly comparable to an H-infinity result: the same $\gamma$, read the same way as a scorecard on weighted specifications, but now valid over a parameter set rather than at one operating point.

You can also add a decay-rate constraint, $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} \prec -2\lambda\mathbf{P}$. It forces every trajectory to decay at least as fast as $e^{-\lambda t}$, and it is the LPV version of a pole-placement region.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gain scheduling | design at frozen $\rho$, interpolate; analysis is frozen-time and proves nothing about $\dot\rho \ne 0$ |
| Counterexample | $\mathbf{A}_1 = \begin{pmatrix}-1&10\\0&-1\end{pmatrix}$, $\mathbf{A}_2 = \mathbf{A}_1^\mathsf{T}$: eigenvalues $-1,-1$ each; alternating at $0.5\,\mathrm{s}$ amplifies by $9.92$ per cycle |
| Mechanism | fast switching behaves like $(\mathbf{A}_1+\mathbf{A}_2)/2$, whose eigenvalues here are $+4$ and $-6$ |
| Other hazards | hidden coupling when $\rho$ depends on the state; interpolating realizations rather than controllers; switching transients |
| Slow-variation rule | compare $\dot\rho/\rho$ with closed-loop bandwidth; booster $0.021$ against $1.5\,\mathrm{rad/s}$, a ratio of about $71$ |
| LPV model | $\dot{x} = \mathbf{A}(\rho(t))x + \mathbf{B}(\rho(t))u$, $\rho$ measured, in a polytope, $\lvert\dot\rho_i\rvert \le \nu_i$ |
| Quadratic stability | one $\mathbf{P}\succ 0$ with $\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho)\prec 0$; vertices suffice for affine $\mathbf{A}$; covers any rate |
| Booster example | $\mu_\alpha\in[0,0.5]$: $\mathbf{P} = \begin{pmatrix}1.2406&0.2246\\0.2246&0.3460\end{pmatrix}$ works at both vertices ($-0.953$, $-0.841$); a common $\mathbf{P}$ exists almost to the frozen limit $2.476$ |
| Rate-bounded | $\mathbf{P}(\rho)$ with the extra term $\sum_i\dot\rho_i\,\partial\mathbf{P}/\partial\rho_i$; less conservative when $\rho$ is genuinely slow |
| Synthesis | bounded real lemma at the vertices gives self-scheduled H-infinity with a guaranteed induced $L_2$ gain |
| Costs | parameter-dependent controller in flight software; vertices grow exponentially; guarantee void outside the declared set |

The next lesson takes the idea one step further, to controllers that change *themselves* in flight, and asks why aerospace programs treat that idea with such suspicion.

::: context max-q The hardest moment of the climb
**Dynamic pressure**, written $\bar{q} = \tfrac{1}{2}\rho_{\text{air}}v^2$, measures how hard the air pushes on a moving vehicle. Low down, the rocket is slow; high up, the air is thin. Somewhere in between — typically one to one and a half minutes after lift-off, around 10 to 15 km up — the product peaks. That peak is "max-q". Air loads on the structure and the aerodynamic twisting moment are largest there, which is why launch vehicle control designs are usually sized at that point, and why engines are often throttled down through it.
:::

::: context scheduling-variable Picking what to schedule on
A good scheduling variable is measured reliably, changes the dynamics a lot, and is not pushed around by the loop it schedules. Dynamic pressure from air data or from a navigation estimate is a favorite, because the aerodynamic terms scale with it.

A small notation warning: aerodynamicists also use $\rho$ for air density. In this lesson $\rho$ is the scheduling parameter, and when air density appears it is labeled $\rho_{\text{air}}$. Control papers on LPV nearly always use $\rho$ (or $\theta$) for the scheduling parameter, so it is worth getting used to.
:::

::: context spectral-radius The biggest stretch factor
The **spectral radius** of a square matrix is the largest size (absolute value) among its eigenvalues. If you apply the same matrix $\mathbf{M}$ again and again, $x_{k+1} = \mathbf{M}x_k$, then after many steps the state grows or shrinks by about that factor per step.

So a cycle matrix with spectral radius $9.919$ means: each full cycle, the state ends up roughly ten times bigger. Below one means decay; above one means growth. It is the discrete-step twin of "real part of the eigenvalue is negative".
:::

::: context average-matrix Stable parts, unstable average
Fast switching behaves like the average of the two matrices. Each part has both eigenvalues at $-1$, safely in the left half of the plane. Their average has one eigenvalue at $-6$ and one at $+4$, on the unstable side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="190" y="14" width="150" height="118" fill="#f2b880" opacity="0.25"/>
  <text x="265" y="30" font-size="11" fill="#b4232c" text-anchor="middle">unstable side</text>
  <line x1="190" y1="14" x2="190" y2="132" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="16" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="16" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="46" y="146">−6</text><text x="166" y="146">−1</text><text x="190" y="146">0</text><text x="286" y="146">+4</text>
  </g>
  <text x="20" y="50" font-size="11" fill="#1f2a44">A₁ alone, A₂ alone</text>
  <circle cx="166" cy="60" r="6" fill="#1d6fd1"/>
  <text x="150" y="48" font-size="11" fill="#1d6fd1" text-anchor="end">double at −1</text>
  <text x="20" y="100" font-size="11" fill="#1f2a44">average (A₁+A₂)/2</text>
  <circle cx="46" cy="110" r="6" fill="#1d6fd1"/>
  <circle cx="286" cy="110" r="6" fill="#b4232c"/>
</svg>
```

Each tick is to scale: 24 pixels per unit, zero at the dashed line.
:::

::: context pumping-a-swing How a swing gets pumped
A child on a swing stands up at the bottom of each arc and crouches at the ends. In either posture held still, the swing slowly dies down — each is a stable system. But switching between them at the right moments feeds energy in every cycle, and the swing goes higher and higher. Physicists call this **parametric pumping**: nothing pushes the swing from outside; only a parameter (the rider's height) changes in time. A gain schedule changing a loop's stiffness at the wrong rhythm can do the same thing to a vehicle.
:::

::: context bumpless-transfer Where "bumpless" comes from
The term comes from industrial process control. When an operator switched a valve from manual to automatic, the controller's output would jump to whatever its internal integrator happened to hold, and the valve slammed — a "bump". Bumpless transfer means initializing the new controller's internal states so its first output matches the old one's last output. In a gain-scheduled flight controller the same care applies every time the schedule moves from one design to the next, especially for integrator states.
:::

::: context mu-alpha The two booster coefficients
From the atmospheric flight module, a booster's pitch motion near an operating point is $\ddot{\theta} = \mu_\alpha\theta + \mu_\delta\delta$. Both have units of $\mathrm{s^{-2}}$ (per radian, per second squared).

$\mu_\alpha$ is how hard the air twists the nose further away once it is off line. It is positive because the center of pressure sits ahead of the center of mass, so the rocket is aerodynamically unstable, and it scales with dynamic pressure. $\mu_\delta$ is how hard one radian of engine gimbal twists the vehicle back. It grows during the flight as the vehicle burns propellant and its inertia falls.
:::

::: context lyapunov-bowl One bowl for every frozen system
Here are two level curves ("contours") of the booster's $V = x^\mathsf{T}\mathbf{P}x$, with a trajectory whose $\mu_\alpha$ flips between $0$ and $0.5$ every $0.7\,\mathrm{s}$, starting from $\theta = 1$, $\dot{\theta} = 0$. It crosses each contour inward and never back out: $V$ falls at every step, whichever system is active.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="110" x2="310" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="12" x2="180" y2="208" stroke="#6c7a93" stroke-width="1"/>
  <text x="312" y="106" font-size="11" fill="#6c7a93">θ</text>
  <text x="186" y="22" font-size="11" fill="#6c7a93">θ̇</text>
  <polygon fill="none" stroke="#8fb8f0" stroke-width="2" points="270.0,110.0 266.9,102.3 263.2,94.8 258.9,87.2 253.5,79.2 246.6,70.3 237.3,60.3 224.4,48.9 206.0,36.4 180.0,24.8 148.0,19.3 118.1,24.9 98.2,39.1 88.4,55.4 84.7,70.0 84.3,82.4 85.4,92.8 87.4,101.8 90.0,110.0 93.1,117.7 96.8,125.2 101.1,132.8 106.5,140.8 113.4,149.7 122.7,159.7 135.6,171.1 154.0,183.6 180.0,195.2 212.0,200.7 241.9,195.1 261.8,180.9 271.6,164.6 275.3,150.0 275.7,137.6 274.6,127.2 272.6,118.2"/>
  <polygon fill="none" stroke="#8fb8f0" stroke-width="2" points="225.0,110.0 223.5,106.2 221.6,102.4 219.4,98.6 216.7,94.6 213.3,90.2 208.7,85.2 202.2,79.5 193.0,73.2 180.0,67.4 164.0,64.7 149.0,67.4 139.1,74.6 134.2,82.7 132.4,90.0 132.1,96.2 132.7,101.4 133.7,105.9 135.0,110.0 136.5,113.8 138.4,117.6 140.6,121.4 143.3,125.4 146.7,129.8 151.3,134.8 157.8,140.5 167.0,146.8 180.0,152.6 196.0,155.3 211.0,152.6 220.9,145.4 225.8,137.3 227.6,130.0 227.9,123.8 227.3,118.6 226.3,114.1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="270.0,110.0 269.0,120.0 266.1,127.9 261.9,133.9 256.7,138.3 250.7,141.1 244.3,142.8 237.7,143.4 231.1,141.9 224.9,140.2 219.1,138.2 213.7,136.1 208.7,133.9 204.1,131.8 200.0,129.6 196.2,127.9 192.8,126.1 189.7,124.3 187.1,122.6 184.7,120.8 182.7,119.2 181.0,117.7 179.7,116.2 178.5,115.0 177.7,113.9 177.0,112.9 176.5,112.1 176.1,111.3 175.9,110.7 175.9,110.1 176.0,109.3 176.7,108.6 177.8,108.6 179.2,109.1"/>
  <circle cx="270" cy="110" r="4" fill="#b4232c"/>
  <text x="282" y="96" font-size="11" fill="#b4232c">start</text>
  <text x="16" y="212" font-size="11" fill="#1f2a44">start: θ = 1, θ̇ = 0 · θ̇ axis drawn at half scale</text>
</svg>
```
:::

::: context lmi Linear matrix inequalities
A **linear matrix inequality**, or LMI, is a condition "some matrix is negative definite", where the matrix depends linearly on the unknowns — here, the entries of $\mathbf{P}$. The set of $\mathbf{P}$ that satisfy a batch of LMIs is convex: a blob with no dents, so any two good answers can be blended into another good answer. Convex problems have no false valleys to get stuck in, and interior-point solvers find an answer, or prove none exists, in a predictable time. That is why robust-control theory of the 1990s rushed to rewrite its tests as LMIs.
:::

::: context bounded-real-lemma Why "bounded real"
The name is old circuit theory. A "bounded real" function describes how a passive network scatters signals, and its gain never exceeds one at any frequency. The lemma links that frequency-domain bound to a matrix inequality on the state-space model, so "peak gain below $\gamma$" can be checked by a convex solver instead of sweeping frequencies. It is the same fact the Riccati equations of H-infinity synthesis rest on, written in LMI form.
:::

::: context vertex-count Two corners per variable
Each scheduling variable with a lower and upper limit is an interval with two ends. Two variables make a rectangle with $4$ corners; three make a box with $8$; $n$ variables make $2^n$ corners. Ten variables would already mean $1024$ corner conditions, each a matrix inequality.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="80" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="60" r="5" fill="#1d6fd1"/><circle cx="80" cy="60" r="5" fill="#1d6fd1"/>
  <text x="55" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">1 variable: 2</text>
  <rect x="125" y="35" width="55" height="55" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="125" cy="35" r="5" fill="#1d6fd1"/><circle cx="180" cy="35" r="5" fill="#1d6fd1"/>
  <circle cx="125" cy="90" r="5" fill="#1d6fd1"/><circle cx="180" cy="90" r="5" fill="#1d6fd1"/>
  <text x="152" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">2 variables: 4</text>
  <g fill="none" stroke="#1f2a44" stroke-width="2">
    <rect x="240" y="45" width="50" height="50"/>
    <rect x="265" y="25" width="50" height="50"/>
    <line x1="240" y1="45" x2="265" y2="25"/><line x1="290" y1="45" x2="315" y2="25"/>
    <line x1="240" y1="95" x2="265" y2="75"/><line x1="290" y1="95" x2="315" y2="75"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="240" cy="45" r="5"/><circle cx="290" cy="45" r="5"/><circle cx="240" cy="95" r="5"/><circle cx="290" cy="95" r="5"/>
    <circle cx="265" cy="25" r="5"/><circle cx="315" cy="25" r="5"/><circle cx="265" cy="75" r="5"/><circle cx="315" cy="75" r="5"/>
  </g>
  <text x="278" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">3 variables: 8</text>
</svg>
```
:::

::: context quasi-lpv When the parameter is really a state
In a **quasi-LPV** model, some of the "parameters" are actually states of the vehicle, such as angle of attack or speed. You rewrite the nonlinear dynamics so they look like an LPV model in those variables, then treat them as parameters with declared bounds and rate limits. It is honest as long as the analysis really enforces those bounds. You will meet the same idea again in the nonlinear control module, where the closed loop's state dependence is handled head-on with Lyapunov functions.
:::
