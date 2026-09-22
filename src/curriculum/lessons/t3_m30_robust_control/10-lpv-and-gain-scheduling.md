---
id: l10-lpv-and-gain-scheduling
title: Gain scheduling with guarantees, and LPV control
minutes: 21
covers:
  - Linear parameter-varying control and gain scheduling with guarantees
---

Every vehicle in this curriculum changes while it flies. A launch vehicle's aerodynamic moment coefficient is zero on the pad, peaks at maximum dynamic pressure and vanishes above the atmosphere, while its mass falls by a factor of five and its first bending mode climbs by tens of percent. An aircraft's dynamics change with Mach number, altitude and store loading. A spacecraft's inertia changes as propellant is consumed and as appendages deploy. One linear controller cannot serve all of it, and the universal industrial answer is to design several and interpolate: gain scheduling.

Gain scheduling works, and it has flown essentially every vehicle ever built. What it does not do, in its classical form, is prove anything. The design and the analysis are both carried out at *frozen* operating points, with the scheduling variable held constant, and then the controller is flown with that variable moving. Nothing in the frozen analysis says the moving case is stable, and it is not hard to build examples where every frozen point is comfortably stable and the time-varying system diverges.

This lesson shows exactly how that failure happens, states the conditions under which frozen-point design is safe, and then develops the linear parameter-varying framework, which replaces the hope with a proof: a single parameter-dependent controller, synthesised once, with a stability and performance guarantee that holds over every admissible parameter trajectory.

## Classical gain scheduling and its silent assumption

The recipe is familiar. Pick a scheduling variable $\rho$ that is measured or estimated in flight — Mach number, dynamic pressure, time from lift-off, propellant mass. Linearise the plant at a grid of values $\rho_1, \dots, \rho_N$. Design a controller $\mathbf{K}_i$ at each. In flight, interpolate the controller gains as a function of the measured $\rho$.

The analysis that accompanies it is a **frozen-time** analysis: for each $\rho_i$, verify that the closed loop with $\mathbf{K}_i$ and the plant at $\rho_i$ is stable with margins. That establishes stability of a family of constant-coefficient systems. The vehicle, meanwhile, is a time-varying system $\dot{x} = \mathbf{A}(\rho(t))x$, and for time-varying systems the eigenvalues of $\mathbf{A}(\rho(t))$ at each instant say nothing at all about stability.

::: example Two stable systems that alternate into instability
Take

$$\mathbf{A}_1 = \begin{pmatrix}-1 & 10 \\ 0 & -1\end{pmatrix}, \qquad \mathbf{A}_2 = \mathbf{A}_1^\mathsf{T} = \begin{pmatrix}-1 & 0 \\ 10 & -1\end{pmatrix}.$$

Both have a double eigenvalue at $-1$: each on its own decays with a one-second time constant, and any frozen-time analysis pronounces them stable with room to spare. Now alternate between them with a dwell time $t$ in each. The state transition matrix over one full cycle is $e^{\mathbf{A}_2t}e^{\mathbf{A}_1t}$, and its spectral radius is the amplification per cycle:

| dwell $t$ (s) | amplification per cycle |
| --- | --- |
| 0.2 | 3.907 |
| 0.5 | 9.919 |
| 1.0 | 13.803 |

At a half-second dwell the state grows by a factor of ten every second. Nothing has been perturbed; the system is exactly one of two stable systems at every instant.

The mechanism is visible in the limit of very fast switching, where the cycle map tends to $e^{(\mathbf{A}_1 + \mathbf{A}_2)t}$ and the behaviour is governed by the average matrix

$$\frac{\mathbf{A}_1 + \mathbf{A}_2}{2} = \begin{pmatrix}-1 & 5 \\ 5 & -1\end{pmatrix}, \qquad \text{eigenvalues } +4\ \text{and}\ -6 .$$

The average of two stable matrices is unstable. Physically, each subsystem contracts strongly along one direction and shears strongly across it; the shear of one feeds the weakly damped direction of the other, and energy is pumped in faster than either can dissipate it. A gain-scheduled controller whose closed-loop $\mathbf{A}$ matrix rotates its eigenvector directions as $\rho$ moves is doing exactly this, and no amount of frozen-point margin reporting will show it.
:::

Two further hazards live in the same place.

**Hidden coupling terms.** If $\rho$ depends on the state — scheduling on angle of attack, or on measured dynamic pressure, which depends on velocity — then differentiating the scheduled control law produces extra terms involving $\partial\mathbf{K}/\partial\rho\cdot\dot{\rho}$ that the frozen analysis never sees. These are genuine feedback paths, and they can be destabilising. Scheduling on an exogenous variable such as time or a commanded Mach profile avoids them; scheduling on a state does not.

**Interpolation of the wrong object.** Interpolating controller gains between two state-space realisations is not the same as interpolating the controllers, because a state-space realisation is not unique; two equivalent controllers can have wildly different matrices and the average of them may be neither. The standard defences are to fix a consistent realisation across the schedule (observer canonical form, or a velocity-form implementation), and to handle integrator states explicitly so that a schedule change does not produce a transient — bumpless transfer.

::: warning Frozen-time margins are a necessary condition, not a sufficient one
Good margins at every point of a schedule do not imply stability while the schedule moves, and this is not a technicality: the example above is a two-state system with textbook eigenvalues. The classical rule that saves gain scheduling in practice is that $\rho$ must vary *slowly* relative to the closed-loop dynamics. That rule is sound, but it is a rule, not a proof, and "slowly" is rarely quantified in a design review.
:::

## When frozen design is safe: the slow-variation argument

The classical justification is a perturbation argument: if $\dot{\rho}$ is small enough, the time-varying system inherits the stability of the frozen family. The quantitative version compares the rate of parameter change to the closed-loop bandwidth.

For the launch vehicle, $\mu_\alpha$ is proportional to dynamic pressure, rising from about $0.038\,\mathrm{s^{-2}}$ at twenty seconds to $0.228\,\mathrm{s^{-2}}$ at maximum dynamic pressure some forty seconds later. The average rate is $4.75\times 10^{-3}\,\mathrm{s^{-3}}$, so the *relative* rate is

$$\frac{\dot{\mu}_\alpha}{\mu_\alpha} \approx \frac{4.75\times 10^{-3}}{0.228} = 0.021\ \mathrm{s^{-1}},$$

against a closed-loop bandwidth of about $1.5\,\mathrm{rad/s}$. The plant changes seventy times more slowly than the loop responds, so the frozen analysis is well justified here — and now that is a number rather than a feeling. Compare a re-entry vehicle going from hypersonic to transonic in a few seconds, or an aircraft in a rapid store separation, where the same ratio can fall below ten and the argument stops holding.

## Quadratic stability: a proof that covers any rate

The linear parameter-varying framework drops the frozen assumption entirely. Model the vehicle as

$$\dot{x} = \mathbf{A}(\rho(t))\,x + \mathbf{B}(\rho(t))\,u,$$

with $\rho(t)$ measurable in real time and confined to a known set — usually a polytope with vertices $\rho^{(1)}, \dots, \rho^{(V)}$, with $\mathbf{A}(\rho)$ affine in $\rho$ so that $\mathbf{A}(\rho)$ is a convex combination of the vertex matrices.

::: key Quadratic stability
If there is a single $\mathbf{P} \succ 0$ with

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho) \prec 0 \quad\text{for every admissible }\rho,$$

then $V(x) = x^\mathsf{T}\mathbf{P}x$ decreases along every trajectory and the system is stable for **arbitrarily fast** parameter variation. For an affine polytopic model it suffices to check the inequality at the vertices, because the left side is then affine in $\rho$ and a negative-definite affine function of a convex combination is a convex combination of negative-definite matrices.
:::

That last observation is what makes the whole approach computable: an infinite family of conditions collapses to $V$ linear matrix inequalities, which convex solvers dispatch reliably. Note also what the switching counterexample now means — the matrices $\mathbf{A}_1$ and $\mathbf{A}_2$ there have *no* common $\mathbf{P}$, and that is precisely why alternating between them can diverge.

::: example Quadratic stability of the booster's attitude loop
Keep the proportional-derivative gains fixed at $K_p = 1.88$, $K_d = 1.59$ and let $\mu_\alpha$ range over $[0,\ 0.5]\,\mathrm{s^{-2}}$ — from the pad to beyond maximum dynamic pressure. With $\mu_\delta = 1.317\,\mathrm{s^{-2}}$ the closed-loop matrix is

$$\mathbf{A}(\mu_\alpha) = \begin{pmatrix}0 & 1 \\ \mu_\alpha - \mu_\delta K_p & -\mu_\delta K_d\end{pmatrix} = \begin{pmatrix}0 & 1 \\ \mu_\alpha - 2.476 & -2.094\end{pmatrix},$$

affine in $\mu_\alpha$, so the vertices are $\mu_\alpha = 0$ and $\mu_\alpha = 0.5$. The frozen eigenvalues are $-1.047 \pm 1.175j$ at one end and $-1.047 \pm 0.938j$ at the other: the real part does not move at all, because only the stiffness term depends on $\mu_\alpha$.

Solving the Lyapunov equation at the midpoint, $\mathbf{A}(0.25)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(0.25) = -\mathbf{I}$, gives

$$\mathbf{P} = \begin{pmatrix}1.2406 & 0.2246 \\ 0.2246 & 0.3460\end{pmatrix},$$

positive definite, and evaluating at the two vertices gives largest eigenvalues of $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}$ equal to $-0.953$ and $-0.841$. Both negative, so this single $\mathbf{P}$ is a common Lyapunov function and the loop is stable no matter how fast the dynamic pressure changes — a far stronger statement than a frozen margin sweep, obtained from two Lyapunov solves.

Widening the range, a common $\mathbf{P}$ of this form keeps working up to about $\mu_\alpha = 2.4\,\mathrm{s^{-2}}$, a little short of the frozen stability limit $\mu_\alpha = \mu_\delta K_p = 2.476$ at which the proportional gain can no longer overcome the aerodynamic moment. For this particular plant, then, quadratic stability costs almost nothing. That is a happy accident of the structure — only one entry of $\mathbf{A}$ moves — and it is worth knowing when it happens, because the general case is not so kind.
:::

## Rate bounds and parameter-dependent Lyapunov functions

Quadratic stability is conservative whenever the parameter is genuinely slow, because it certifies against infinitely fast variation that the vehicle cannot produce. The refinement is to let the Lyapunov matrix depend on the parameter, $\mathbf{P}(\rho)$, and to bound the rate: $\lvert\dot{\rho}_i\rvert \le \nu_i$. The condition becomes

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P}(\rho) + \mathbf{P}(\rho)\mathbf{A}(\rho) + \sum_i\dot{\rho}_i\frac{\partial\mathbf{P}}{\partial\rho_i} \prec 0$$

for all admissible $\rho$ and all $\lvert\dot{\rho}_i\rvert \le \nu_i$. The extra term is the price of a moving Lyapunov function, and the rate bound is what keeps it finite; with $\nu \to\infty$ one is forced back to a constant $\mathbf{P}$. This is where the "slowly varying" folklore gets a rigorous form: the rate bound is now a declared, checkable input to the analysis, and the certificate is valid for every trajectory respecting it.

For synthesis, the same machinery carries the induced $L_2$ gain. The bounded real lemma says $\lVert\mathbf{G}\rVert_\infty < \gamma$ for a linear time-invariant system if and only if a certain matrix inequality in $\mathbf{P}$ holds; imposing its parameter-dependent version at the vertices and solving for a parameter-dependent controller gives **self-scheduled H-infinity synthesis**. The output is one controller whose matrices are explicit functions of the measured $\rho$, together with a guarantee: for every admissible parameter trajectory, the closed loop is stable and the induced $L_2$ gain from disturbance to weighted error is below $\gamma$.

::: key LPV control versus ad hoc gain scheduling
Classic gain scheduling interpolates point designs and proves nothing about the transitions. LPV synthesis designs a single parameter-dependent controller with a stability guarantee over the whole parameter trajectory, usually bounded by a parameter rate limit.
:::

What it costs is worth stating plainly, because LPV is not free. The controller is a parameter-dependent state-space model that the flight software must evaluate every cycle, rather than a table of gains. The guarantee holds over a *set* of parameter trajectories, including physically impossible ones, so the design is conservative relative to what the vehicle will actually fly. The linear matrix inequalities grow with the number of vertices, which grows exponentially with the number of scheduling variables, so three or four parameters is a practical ceiling without further structure. And the certificate is only as good as the parameter set and rate bounds declared, which are engineering assumptions like any other.

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
# eigenvalues of the average (A1+A2)/2: [ 4. -6.]
# eig(A2^T P + P A2) = [-255.95097568  253.95097568]
#   mu_alpha=0.0: max eig(A^T P + P A) = -0.9530
#   mu_alpha=0.5: max eig(A^T P + P A) = -0.8407
```

::: example Reading a failed common-P search
Run the same test on the switching counterexample. Solving $\mathbf{A}_1^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}_1 = -\mathbf{I}$ gives

$$\mathbf{P} = \begin{pmatrix}0.5 & 2.5 \\ 2.5 & 25.5\end{pmatrix},$$

positive definite, and by construction $\mathbf{A}_1^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}_1$ has both eigenvalues at $-1$. Evaluating the same $\mathbf{P}$ against $\mathbf{A}_2$ gives eigenvalues $-255.95$ and $+253.95$: violently indefinite. That is not a proof that no common $\mathbf{P}$ exists — a single candidate failing proves nothing — but it is a strong hint, and here the switching simulation confirms it, since a system that can be destabilised by switching cannot be quadratically stable.

The practical procedure in a design office is the reverse of this order. First run the convex search for a common $\mathbf{P}$ over the vertices. If it succeeds, you have a certificate that covers every rate, and you are finished. If it fails, either introduce rate bounds and search for a parameter-dependent $\mathbf{P}(\rho)$, or look for a destabilising parameter trajectory directly — which, if you find one, tells the programme something far more useful than another margin table.
:::

::: warning An LPV guarantee is about a parameter set, not a flight
The certificate covers every $\rho(t)$ inside the declared polytope and respecting the declared rate bounds. If the vehicle leaves that set — an off-nominal trajectory, a failed engine changing the mass properties, an atmosphere colder than the dispersion assumed — the guarantee is void, exactly as an uncertainty weight's guarantee is void outside its set. Declaring the parameter set is the same engineering act as declaring an uncertainty weight, and deserves the same scrutiny.
:::

## Check yourself

::: check
Every frozen point of a schedule has $6\,\mathrm{dB}$ gain margin and $45^\circ$ phase margin. What, precisely, has been established?
:::

::: answer
That each member of a family of constant-coefficient closed loops is stable with those margins. Nothing has been established about the vehicle, which is a time-varying system. The counterexample in this lesson has two constant-coefficient systems with both eigenvalues at $-1$ — margins as good as you like — that amplify the state by a factor of ten per second when alternated. To convert the frozen result into a statement about the vehicle you need either a slow-variation argument with the rate quantified against the closed-loop bandwidth, or a Lyapunov certificate: a common $\mathbf{P}$ for arbitrary rates, or a parameter-dependent $\mathbf{P}(\rho)$ with declared rate bounds.
:::

::: check
Why does checking the quadratic stability inequality at the vertices of a polytope suffice when $\mathbf{A}(\rho)$ is affine in $\rho$?
:::

::: answer
If $\mathbf{A}(\rho)$ is affine, any admissible $\rho$ is a convex combination $\rho = \sum_i\lambda_i\rho^{(i)}$ with $\lambda_i \ge 0$, $\sum\lambda_i = 1$, and $\mathbf{A}(\rho) = \sum_i\lambda_i\mathbf{A}(\rho^{(i)})$. Then

$$\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho) = \sum_i\lambda_i\left(\mathbf{A}(\rho^{(i)})^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho^{(i)})\right),$$

a convex combination of matrices that are each negative definite, and a convex combination of negative-definite matrices with non-negative weights summing to one is negative definite. So $V$ conditions imply the whole continuum. Note the two things this needs: $\mathbf{P}$ must be the *same* matrix in every term, which is why quadratic stability uses a constant $\mathbf{P}$; and $\mathbf{A}$ must be affine, which is why LPV models are built in polytopic or linear-fractional form rather than by fitting arbitrary functions of $\rho$.
:::

::: check
The booster's $\mu_\alpha$ changes at a relative rate of about $0.021\,\mathrm{s^{-1}}$ against a closed-loop bandwidth of $1.5\,\mathrm{rad/s}$. A re-entry vehicle's dominant parameter changes at a relative rate of $0.6\,\mathrm{s^{-1}}$ against a bandwidth of $4\,\mathrm{rad/s}$. Comment on both.
:::

::: answer
The booster's ratio is $1.5/0.021 = 71$: the loop settles roughly seventy times faster than the plant changes, so the frozen-time picture is an excellent approximation and classical gain scheduling with a frozen margin sweep is defensible. The re-entry vehicle's ratio is $4/0.6 = 6.7$, which is in the region where the frozen approximation starts to be questionable — the loop has time for only a few time constants before the plant has moved appreciably, so transition behaviour is a genuine risk and hidden coupling terms from scheduling on a state-dependent variable will not be negligible. That case wants either an LPV design with a rate bound of $0.6\,\mathrm{s^{-1}}$ or, at minimum, a time-varying simulation of the whole transition with dispersions, rather than a table of frozen margins.
:::

::: check
A colleague proposes scheduling the attitude gains on measured angle of attack because it correlates well with the aerodynamic coefficients. What is the objection?
:::

::: answer
Angle of attack is a state of the closed loop, not an exogenous signal. Scheduling on it makes the control law $u = -\mathbf{K}(\alpha)x$, which is nonlinear in the state, and linearising it about an operating point produces extra terms proportional to $\partial\mathbf{K}/\partial\alpha$ multiplied by the state — hidden coupling that no frozen-point analysis contains, and that can destabilise the loop directly. It also creates a positive feedback risk: a disturbance raises $\alpha$, which changes the gains, which changes the response to $\alpha$. Safer choices are variables that the vehicle's own attitude loop does not drive on the same timescale: time from lift-off, a commanded Mach profile, measured dynamic pressure or propellant mass. If a state-dependent schedule is unavoidable, the correct framework is quasi-LPV, where the state-dependence is declared honestly and the resulting parameter set is bounded and rate-limited in the analysis.
:::

::: check
Explain why a design can be quadratically stable yet have poor performance, and what the bounded real lemma adds.
:::

::: answer
Quadratic stability asserts only that $x^\mathsf{T}\mathbf{P}x$ decreases: the state goes to zero for any admissible parameter trajectory. It says nothing about how fast, about the response to disturbances, or about actuator effort. A loop can satisfy it with a decay rate so slow that the pointing requirement is missed throughout. The bounded real lemma upgrades the certificate from stability to performance: the same matrix inequality with extra blocks certifies that the induced $L_2$ gain from a weighted disturbance input to a weighted error output is below $\gamma$, for every admissible parameter trajectory. That makes the LPV result directly comparable to an H-infinity result — it is the same $\gamma$, with the same interpretation as a scorecard on weighted specifications, now valid over a parameter set rather than at a single operating point. One can also add a decay-rate constraint, $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} \prec -2\lambda\mathbf{P}$, which forces every trajectory to decay at least as fast as $e^{-\lambda t}$ and is the LPV analogue of a pole-placement region.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gain scheduling | design at frozen $\rho$, interpolate; analysis is frozen-time and proves nothing about $\dot\rho \ne 0$ |
| Counterexample | $\mathbf{A}_1 = \begin{pmatrix}-1&10\\0&-1\end{pmatrix}$, $\mathbf{A}_2 = \mathbf{A}_1^\mathsf{T}$: eigenvalues $-1,-1$ each; alternating at $0.5\,\mathrm{s}$ amplifies by $9.92$ per cycle |
| Mechanism | fast switching behaves like $(\mathbf{A}_1+\mathbf{A}_2)/2$, whose eigenvalues here are $+4$ and $-6$ |
| Other hazards | hidden coupling when $\rho$ depends on the state; interpolating realisations rather than controllers; switching transients |
| Slow-variation rule | compare $\dot\rho/\rho$ with closed-loop bandwidth; booster $0.021$ against $1.5\,\mathrm{rad/s}$, a ratio of $71$ |
| LPV model | $\dot{x} = \mathbf{A}(\rho(t))x + \mathbf{B}(\rho(t))u$, $\rho$ measured, in a polytope, $\lvert\dot\rho_i\rvert \le \nu_i$ |
| Quadratic stability | one $\mathbf{P}\succ 0$ with $\mathbf{A}(\rho)^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A}(\rho)\prec 0$; vertices suffice for affine $\mathbf{A}$; covers any rate |
| Booster example | $\mu_\alpha\in[0,0.5]$: $\mathbf{P} = \begin{pmatrix}1.2406&0.2246\\0.2246&0.3460\end{pmatrix}$ works at both vertices ($-0.953$, $-0.841$) |
| Rate-bounded | $\mathbf{P}(\rho)$ with the extra term $\sum_i\dot\rho_i\,\partial\mathbf{P}/\partial\rho_i$; less conservative when $\rho$ is genuinely slow |
| Synthesis | bounded real lemma at the vertices gives self-scheduled H-infinity with a guaranteed induced $L_2$ gain |
| Costs | parameter-dependent controller in flight software; vertices grow exponentially; guarantee void outside the declared set |

The next lesson takes the idea one step further, to controllers that change themselves in flight, and asks why aerospace programmes treat that idea with such suspicion.
