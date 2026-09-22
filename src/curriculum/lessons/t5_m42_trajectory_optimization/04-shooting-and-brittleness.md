---
id: l04-shooting-and-brittleness
title: The two-point boundary value problem and why shooting is brittle
minutes: 20
covers:
  - "The two-point boundary value problem; single and multiple shooting; costate sensitivity and why indirect methods are brittle"
---

Put the last three lessons together and you have a complete recipe for the necessary conditions of an optimal trajectory: a state that must run forward from a known $\mathbf{x}(t_0)$, a costate that must run backward from a transversality condition at $t_f$, coupled through $\dot{\mathbf{x}}=\partial H/\partial\boldsymbol\lambda$ and $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$, with the minimum principle picking $\mathbf{u}(t)$ pointwise from the two. Half the boundary data sits at $t_0$, half at $t_f$ — a **two-point boundary value problem**, and nothing said so far tells you how to actually solve one.

This lesson solves a real one, twice: once carelessly and once carefully, on the same low-thrust orbit transfer, so the difference between "the necessary conditions are correct" and "the necessary conditions are usable" is a number you can see rather than a warning you take on faith.

## Shooting: turn the BVP into a root-finding problem

The costate's initial value $\boldsymbol\lambda(t_0)$ is exactly what you do not have — the transversality condition specifies $\boldsymbol\lambda(t_f)$, not $\boldsymbol\lambda(t_0)$. **Single shooting** guesses it anyway: pick a candidate $\boldsymbol\lambda(t_0)$ (and, if $t_f$ is free, a candidate $t_f$), integrate the full state-costate system forward as an ordinary initial value problem, and see how far the result misses the actual terminal conditions. Collect every terminal condition — the target state, the transversality equations — into a residual vector $F(\mathbf{z})$ of a guess vector $\mathbf{z} = \big(\boldsymbol\lambda(t_0), t_f\big)$, and hand $F(\mathbf{z})=\mathbf{0}$ to a root finder (Newton's method or one of its quasi-Newton relatives). Converge, and the necessary conditions are satisfied everywhere; the entire trajectory falls out as a side effect of having integrated it correctly once.

::: example Shooting a minimum-time low-thrust orbit transfer
A $1200\,\mathrm{kg}$ spacecraft with continuous thrust $T_{\max}=100\,\mathrm{N}$ and $I_{sp}=1800\,\mathrm{s}$ ($c=17\,651.97\,\mathrm{m/s}$) must raise a circular orbit from $r_0=7000\,\mathrm{km}$ ($v_0=7546.05\,\mathrm{m/s}$) to $r_1=9000\,\mathrm{km}$ ($v_1=6654.99\,\mathrm{m/s}$) in minimum time. In polar coordinates the state is $(r,\theta,v_r,v_t)$, but the previous lesson showed $\theta$ and its costate decouple completely, leaving three states $(r,v_r,v_t)$ and, because the thrust magnitude is fixed at $T_{\max}$ for a minimum-time problem — more thrust never hurts, so it is always on — a single control: the **steering angle** $\beta(t)$. Minimising the Hamiltonian over $\beta$ gives the classical **primer-vector** result: thrust points opposite the vector $\mathbf{p}=(\lambda_{v_r},\lambda_{v_t})$, so $\sin\beta^\star = -\lambda_{v_r}/|\mathbf{p}|$, $\cos\beta^\star=-\lambda_{v_t}/|\mathbf{p}|$ — a smooth, continuously varying control, not bang-bang, because $H$ enters $\beta$ through $\sin$ and $\cos$ rather than linearly.

The shooting unknowns are $\mathbf{z}=(\lambda_r(0),\lambda_{v_r}(0),\lambda_{v_t}(0),t_f)$, and the four residuals are the three terminal state errors plus $H(t_f)=0$ (free final time, autonomous problem). Solving with a Newton-type root finder (working in units nondimensionalised by $r_0$ and the local orbital period, standard practice taken up in full in a later lesson) converges to

$$
\boldsymbol\lambda(0) = (-76.7224,\ -17.7767,\ -92.4554)\ \text{[nondim]}, \qquad t_f = 11\,475.17\,\mathrm{s} = 3.1875\,\mathrm{hr} \approx 1.97\ \text{orbits},
$$

landing on the target radius, radial velocity and tangential velocity to better than a metre and a millimetre per second, with $H(t_f) = -3.4\times10^{-13}$ — a residual at the level of integrator round-off, not approximation. The transfer spends $65.01\,\mathrm{kg}$ of the vehicle's $1200\,\mathrm{kg}$, about $5.42\,\%$.

Converging is not the interesting part. **Guessing well enough to converge is.** A plainly reasonable first guess — all costates zero — fails outright: the primer vector $\mathbf{p}=(\lambda_{v_r},\lambda_{v_t})=(0,0)$ has no defined direction, the thrust-steering law is undefined at the very first instant, and the root finder cannot even take a first step (residual stuck at its initial value). Two other physically-motivated guesses — costates set to point the thrust prograde, and costates set to a "small," conservative $0.1$ in each component — both run to completion but land far from the target (final residual norm $0.17$ and $0.23$ respectively, against a converged residual below $10^{-6}$). Of $25$ initial guesses for $\big(\lambda_r(0),\lambda_{v_r}(0),\lambda_{v_t}(0)\big)$ drawn uniformly from $[-3,3]^3$ (with $t_f$ drawn near the right order of magnitude, so the comparison is not sabotaged on the one variable with an obvious physical scale), only $5$ converged to any solution at all, and all $5$ happened to find the correct physical one — a $20\,\%$ hit rate on a problem where every other ingredient (dynamics, targets, thrust level) is exactly known.
:::

::: key Why the costates resist a physical guess
Unlike a state, which has units and a magnitude you can reason about (an altitude in metres, a velocity in metres per second), a costate is the *sensitivity of the remaining optimal cost* to that state — an abstract number with no independent physical meaning until a trajectory already exists to compute it from. There is no intuition to guess $\lambda_r(0)$ from the way there is intuition to guess an initial velocity; the quantity being guessed is downstream of the very answer the shooting is trying to produce.
:::

## Why: the monodromy matrix and its reciprocal eigenvalues

The mechanism behind the brittleness is not mysterious once you linearise. Let $\Phi(t,0) = \partial(\mathbf{x},\boldsymbol\lambda)(t)\,/\,\partial(\mathbf{x},\boldsymbol\lambda)(0)$ be the sensitivity of the whole state-costate vector at time $t$ to the whole state-costate vector at $t=0$ — the **monodromy matrix** of the linearised Hamiltonian system. A costate-guessing error $\delta\boldsymbol\lambda(0)$ propagates to a terminal error $\Phi(t_f,0)$ applied to $(\mathbf{0},\delta\boldsymbol\lambda(0))$, and how large that gets is entirely a question of $\Phi$'s eigenvalues.

Computed by finite differences along the converged transfer above, $\Phi(t_f,0)$ is a $6\times6$ matrix with $\det\Phi = 0.99993$ — indistinguishable from $1$ at the precision of the calculation — and eigenvalues

$$
3.3766,\quad 2.1443\ (\text{sign }-),\quad 0.2961,\quad 0.4664\ (\text{sign }-),\quad -0.0672\pm0.9978i,
$$

which come in **reciprocal pairs**: $3.3766\times0.2961 = 0.99989$, $2.1443\times0.4664=0.99998$, and the complex pair sits exactly on the unit circle, its own reciprocal. This is not a coincidence — it is the defining algebraic signature of a Hamiltonian (symplectic) flow, the same structure that gives $\dot{\mathbf{x}}=\partial H/\partial\boldsymbol\lambda$, $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$ its name. Every direction that grows under forward propagation is matched by an equally strong direction that shrinks. A guessing error with any component along the growing eigenvectors — generic, since a random guess is not aligned with the contracting subspace — gets amplified by a factor pushing $3.4$ over less than two orbits, which is the numerical fact underneath the $20\,\%$ convergence rate above.

That amplification grows with how long you propagate before anchoring the trajectory again: computing $\Phi$ at a quarter, a half, three-quarters and the full transfer time gives a largest eigenvalue magnitude of $1.31$, $1.96$, $1.67$ and $3.38$ respectively — growing overall (the dip at three-quarters reflects the fact that the fastest-growing direction rotates through the state space as the trajectory curves, not a clean exponential in this coordinate system, which is itself an honest reminder that "amplification" here is not a single constant rate). The qualitative trend is the one that matters: shoot over a shorter arc and a guessing error has less distance in which to grow before you have a chance to correct it. That observation is exactly what multiple shooting turns into an algorithm.

## Multiple shooting: anchor the middle

Break $[t_0,t_f]$ into segments at interior times $t_0<\tau_1<\cdots<\tau_{k-1}<t_f$. Guess the *entire* state-costate vector at the start of every segment, not only at $t_0$ — call these $\mathbf{y}_1,\dots,\mathbf{y}_k$, with $\mathbf{y}_1$ fixed by the known $\mathbf{x}(t_0)$ and a guessed $\boldsymbol\lambda(t_0)$. Integrate each segment independently from its own guessed start to its own end, and demand two kinds of residual vanish together: **continuity**, that segment $i$'s integrated endpoint matches segment $i{+}1$'s guessed start, for every interior boundary; and the original **terminal conditions**, applied only to the last segment's integrated endpoint. A two-segment split of the transfer above turns the $4$-unknown, $4$-equation single-shooting system into a $10$-unknown, $10$-equation one ($3$ costates at $t_0$, $6$ full state-costate values at the midpoint, $t_f$; $6$ continuity equations, $3$ terminal states, $H(t_f)=0$).

The payoff is that no single integration has to survive the full amplification computed above — each segment only has to survive *its own* stretch, and the continuity equations mean a bad guess in one segment does not have to be corrected by guessing the far-end costates better, only by that segment's own local Newton step.

::: example Two-segment shooting on the same transfer
Splitting the transfer at its midpoint ($\tau=t_f/2$) turns the $4$-unknown, $4$-equation single-shooting system into a $10$-unknown, $10$-equation one: $3$ costates at $t_0$, $6$ full state-costate values guessed at the midpoint, $t_f$; against $6$ continuity equations, $3$ terminal states, and $H(t_f)=0$.

Seeded from the already-converged single-shooting solution (using it to generate a consistent midpoint guess), the two-segment system converges to the identical trajectory to ten digits — $t_f=12.370316$ nondimensional time either way — confirming the formulation is correct. Seeded instead from a naive straight-line guess for the midpoint state ($r$ and $v_t$ interpolated linearly between the endpoints, $v_r=0$) and small costates throughout — deliberately no better an initial guess than the failed single-shooting attempts above — it does **not** fully converge either, stalling at a residual of $0.23$ after the same iteration budget. And the condition number of the resulting $10\times10$ Jacobian at the solution is $1.1\times10^{5}$ — *larger*, not smaller, than single shooting's $10.4$, because it stacks near-identity continuity blocks (sensitivity of a segment boundary to its own guessed value is exactly $-\mathbf{I}$) against forward-integration blocks of very different scale, and the two do not compare on the same footing. For a transfer this short and this mildly amplifying (a factor of $3.4$, not $3.4\times10^{6}$), doubling the guesswork by also guessing an interior state buys back less than the shorter propagation length costs in extra unknowns.
:::

::: warning Multiple shooting is not a free upgrade
The benefit of segmenting scales with how bad the single-shooting amplification already is, and on a mildly sensitive problem it can lose to plain single shooting simply because it is a bigger, differently-structured system with its own convergence behaviour to manage, as the worked example just showed. Multiple shooting earns its keep on the long-horizon, strongly amplifying problems — many-orbit low-thrust spirals, multi-year interplanetary trajectories with several flybys — where the alternative is not "single shooting, slightly worse," it is "single shooting does not converge from any guess a human would write down." Reach for it when the amplification factor, not the calendar, tells you to — and remember that the honest way to know which regime you are in is to compute the monodromy matrix's eigenvalues, not to guess.
:::

## Check yourself

::: check
Why does a shooting residual function need to be defined (and return a large, finite value) even for guesses that make no physical sense — negative masses, integration blow-ups — rather than being left to crash?
:::

::: answer
A root finder explores the guess space by taking Newton-type steps that can, especially early on, land far outside any physically sensible region, and if evaluating the residual there throws an exception or hangs, the optimisation cannot proceed to compare that step against others or reject it in a line search. Returning a large, finite, clearly-bad residual (as the orbit-transfer implementation did for a non-positive $t_f$ or a failed integration) lets the root finder treat a nonsensical guess exactly like any other bad step — something to move away from — rather than a fatal error that kills the run. This is a basic robustness requirement for any shooting code, not a cosmetic detail.
:::

::: check
The reciprocal eigenvalue pairing of the monodromy matrix means every growing direction has an equally strong shrinking partner. Why does this fact make forward shooting brittle while explaining why a *backward* recursion (as the value-function methods in the optimal control module use) is well behaved?
:::

::: answer
Forward shooting propagates a guessing error at $t_0$ forward in time; any component of that error along a growing eigenvector of $\Phi(t_f,0)$ is amplified, and because a random or naive guess has no reason to avoid those directions, amplification is the generic outcome. A backward recursion — computing the value function or the costate from the terminal condition back toward $t_0$, as dynamic programming does — effectively propagates along $\Phi(t_0,t_f) = \Phi(t_f,0)^{-1}$, whose eigenvalues are exactly the reciprocals of the forward ones. Every direction that was unstable forward is stable backward, and vice versa: the reciprocal pairing guarantees that whichever direction you integrate, you are moving along contracting eigenvectors for that direction, which is the deep reason dynamic-programming-flavoured methods do not inherit shooting's sensitivity, taken up again when this module reaches the shooting-flavoured alternative to indirect methods.
:::

::: check
Of $25$ random costate guesses, $5$ converged and all $5$ found the same physical solution — none converged to a spurious, unphysical extremal. Is that reassuring, and why or why not?
:::

::: answer
It is reassuring about this particular problem's extremal structure — a minimum-time coplanar circular-to-circular transfer with a single thrust arc has, apparently, one dominant extremal in the region searched, so a convergent guess reliably finds it rather than some other stationary point of the necessary conditions. It is not reassuring about the *guessing* problem, which is the actual difficulty: $80\,\%$ of reasonable-looking starting points produced no answer at all, converged or otherwise. A different problem — one with a genuine singular arc, a bang-bang structure with several switches, or simply a longer horizon — can easily have multiple extremals satisfying the necessary conditions, only one of which is the true minimum, and nothing about this experiment bears on that risk.
:::

::: check
Estimate, using only the monodromy eigenvalues already computed, how much smaller a costate guessing error would need to be for the transfer's *single-shooting* Newton iteration to land within $1\,\mathrm{km}$ of the target radius, starting from an error of order $1$ in the nondimensional costates.
:::

::: answer
The worst-case linear amplification over the full transfer is $3.3766$ (nondimensional units of state per nondimensional unit of costate), and $1\,\mathrm{km}$ is $1000/7\,000\,000 = 1.43\times10^{-4}$ in the nondimensional length unit used ($r_0=7000\,\mathrm{km}$). A costate error $\delta\lambda$ produces a terminal error of at most about $3.3766\,\delta\lambda$, so hitting $1.43\times10^{-4}$ requires $\delta\lambda \lesssim 1.43\times10^{-4}/3.3766 \approx 4.2\times10^{-5}$ — a guess accurate to about five significant figures, out of costates whose converged magnitudes run from $18$ to $92$. No physically motivated guess is anywhere near that precise, which is exactly why Newton's method, not intuition, has to close the last five orders of magnitude, and why the *basin* within which Newton's method converges at all — not the final accuracy once it has — is the practical bottleneck.
:::

## Summary

| Object | Statement |
| --- | --- |
| Two-point BVP | $\mathbf{x}(t_0)$ known, $\boldsymbol\lambda(t_f)$ (or a manifold condition) known; $\boldsymbol\lambda(t_0)$ unknown, coupled by the state-costate ODEs |
| Single shooting | Guess $\mathbf{z}=(\boldsymbol\lambda(t_0), t_f)$; integrate forward; root-find $F(\mathbf{z})=\mathbf{0}$ on the terminal residuals |
| Transfer result | $\boldsymbol\lambda(0)=(-76.72,-17.78,-92.46)$, $t_f=11\,475.2\,\mathrm{s}$, propellant $65.01\,\mathrm{kg}$ ($5.42\,\%$) |
| Guessing difficulty | All-zero and two other plausible guesses fail; $5/25$ random guesses converge (all to the correct solution) |
| Monodromy matrix | $\Phi(t_f,0)$: eigenvalues in reciprocal pairs (symplectic structure), $\det\Phi\approx1$; max $\lvert\text{eig}\rvert=3.38$ over the full transfer |
| Amplification vs. horizon | Max $\lvert\text{eig}\rvert$ at $\tfrac14,\tfrac12,\tfrac34,1$ of $t_f$: $1.31,\ 1.96,\ 1.67,\ 3.38$ — grows with propagation length |
| Multiple shooting | Guess the full state-costate vector at every segment start; continuity + terminal residuals, root-found together |
| This transfer's verdict | Converges when seeded correctly; a naive guess does not converge either, and the segmented Jacobian's condition number ($1.1\times10^5$) is *worse* than single shooting's ($10.4$) here — the benefit is problem-dependent, not automatic |
| When it wins | Long horizons and strong amplification, where single shooting has no convergence basin at all |

Guessing costates is one problem with indirect methods. The next lesson takes on the other half of the phrase "bang-bang": the switching structure the minimum principle predicts, and the singular arcs where it stops predicting anything pointwise at all.
