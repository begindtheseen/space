---
id: l14-multiple-model-and-imm-filters
title: Multiple-model and IMM filters
minutes: 19
covers:
  - Multiple-model and IMM filters
---

Every filter this module has built assumes the dynamics model $\mathbf f$ is known — nonlinear, perhaps severely so, but a single, fixed function the filter can linearize, sample around, or integrate exactly. Real targets do not always cooperate with that assumption. An aircraft under manual control flies straight for a while, then banks into a turn, then levels out; a spacecraft coasts, then fires a thruster; in each case the vehicle is genuinely following a *different* dynamics model at different times, and which one is currently in force is not known in advance — it has to be inferred from the same data the filter is already using to estimate the state. The **Interacting Multiple Model (IMM)** filter is the standard answer: run several candidate dynamics models in parallel, let the data decide how much to trust each one moment to moment, and combine them into a single output that adapts as the true regime changes.

This looks, at first glance, like the Gaussian sum filter from earlier in this module — a small bank of filters, weighted and combined. The difference is what varies between the bank's members: a Gaussian sum filter's components disagree about the *state* (which valley, which mode of a shared posterior); an IMM's components disagree about the *dynamics model itself*, and — the piece a naive parallel bank would be missing — the models are allowed to **mix into each other** every cycle, because a real vehicle that was maneuvering a moment ago is more likely to still be maneuvering now than a randomly-chosen model would suggest.

## The IMM recipe

::: key Interacting Multiple Model filter, one cycle
For $M$ candidate models with a known **Markov transition matrix** $\Pi$ ($\Pi_{ij}$ = probability of being in model $j$ next, given model $i$ now), and current mode probabilities $\mu^{(i)}$ and per-model estimates $\hat{\mathbf x}^{(i)},\mathbf P^{(i)}$:

**Mixing**: compute mixing weights $w_{ij}=\Pi_{ij}\mu^{(i)}\big/c_j$ with $c_j=\sum_i\Pi_{ij}\mu^{(i)}$, and mixed initial conditions for each model $j$, $\hat{\mathbf x}_{0j}=\sum_i w_{ij}\hat{\mathbf x}^{(i)}$, with $\mathbf P_{0j}$ combined by the same moment-matching formula the Gaussian sum filter lesson used.

**Filter**: run each model's own predict-and-update cycle from its mixed initial condition, producing a likelihood $\Lambda^{(j)}$ for how well model $j$ explains this cycle's measurement.

**Mode probability update**: $\mu^{(j)}\propto c_j\Lambda^{(j)}$, renormalized to sum to one.

**Combination**: report $\hat{\mathbf x}=\sum_j\mu^{(j)}\hat{\mathbf x}^{(j)}$ (and its moment-matched covariance) as the filter's single output.
:::

The mixing step is what makes this an *interacting* multiple-model filter rather than merely a Gaussian sum filter with a different label. Without it, a model that briefly explains the data poorly — a constant-velocity model during one noisy cycle in the middle of otherwise straight flight — would see its probability crushed and would restart, on the *next* cycle, from an initial condition that never benefited from the *other* models' better information during the bad cycle. Mixing shares information across models every cycle, weighted by how likely a transition between them actually is, so a model does not have to rebuild its estimate from scratch every time it temporarily loses favor.

::: example Mode probability tracking a real maneuver
Track a target with two models — a low-process-noise "quiet" constant-velocity model and a high-process-noise "maneuvering" model, everything else (measurement noise, dynamics structure) identical — through a $15\,\mathrm{m/s}$ sudden velocity change at step $30$ of a $60$-step run, transition matrix $\Pi=\begin{pmatrix}0.97&0.03\\0.15&0.85\end{pmatrix}$:

| step | $\mu_{\text{quiet}}$ | $\mu_{\text{maneuver}}$ |
| --- | --- | --- |
| $28$ | $0.935$ | $0.065$ |
| $29$ | $0.906$ | $0.094$ |
| $30$ | $0.002$ | $0.998$ |
| $31$ | $0.137$ | $0.863$ |
| $36$ | $0.652$ | $0.348$ |
| $44$ | $0.905$ | $0.095$ |

At the exact step the maneuver occurs, $\mu_{\text{maneuver}}$ jumps from $9\%$ to $99.8\%$ in a single cycle — the maneuvering model's likelihood for that one measurement overwhelmingly outperforms the quiet model's, because the quiet model's much smaller assumed process noise makes a sudden $15\,\mathrm{m/s}$ jump look like an enormous, barely-credible innovation, while the maneuvering model's larger process noise absorbs it comfortably. The probability then decays back toward the quiet model over the following dozen-or-so steps, once the target resumes straight-line flight and the quiet model's tighter tracking again fits the data better — the filter is not stuck having "detected a maneuver," it continuously re-assesses which model fits *now*.
:::

```python
import numpy as np

rng = np.random.default_rng(17)
dt = 1.0
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])
def Qof(q): return q*np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
Q1, Q2 = Qof(0.02), Qof(4.0)
Pi = np.array([[0.97, 0.03], [0.15, 0.85]])
N, MAN = 60, 30

x_true = np.array([0.0, 5.0]); xs_true = [x_true.copy()]
for k in range(N):
    if k == MAN: x_true[1] += 15.0
    x_true = F@x_true + rng.multivariate_normal([0, 0], Qof(0.05))
    xs_true.append(x_true.copy())
xs_true = np.array(xs_true)
zs = (H@xs_true[1:].T).flatten() + rng.normal(0, 2.0, N)

def predict(x, P, Q): return F@x, F@P@F.T+Q
def update(x, P, z):
    S = (H@P@H.T+R)[0, 0]; K = (P@H.T)/S; nu = z-(H@x)[0]
    x2 = x + K.flatten()*nu; P2 = (np.eye(2)-np.outer(K, H))@P
    lik = np.exp(-0.5*nu*nu/S)/np.sqrt(2*np.pi*S)
    return x2, P2, lik

x1, P1 = np.array([0.0, 5.0]), np.diag([4.0, 4.0])
x2, P2 = x1.copy(), P1.copy()
mu = np.array([0.9, 0.1])
for k in range(N):
    c = mu@Pi
    mix = Pi*mu[:, None]/c[None, :]
    x1_0 = mix[0, 0]*x1 + mix[1, 0]*x2
    x2_0 = mix[0, 1]*x1 + mix[1, 1]*x2
    def mixP(xi, Pi_, xj, Pj_, wi, wj, x0):
        di, dj = xi-x0, xj-x0
        return wi*(Pi_+np.outer(di, di)) + wj*(Pj_+np.outer(dj, dj))
    P1_0 = mixP(x1, P1, x2, P2, mix[0, 0], mix[1, 0], x1_0)
    P2_0 = mixP(x1, P1, x2, P2, mix[0, 1], mix[1, 1], x2_0)
    x1p, P1p = predict(x1_0, P1_0, Q1); x2p, P2p = predict(x2_0, P2_0, Q2)
    x1, P1, lik1 = update(x1p, P1p, zs[k]); x2, P2, lik2 = update(x2p, P2p, zs[k])
    num = c*np.array([lik1, lik2]); mu = num/num.sum()
    if k in (28, 29, 30, 31, 36, 44): print(k, mu)
# 28 [0.936 0.065]  29 [0.906 0.094]  30 [0.002 0.998]
# 31 [0.137 0.863]  36 [0.652 0.348]  44 [0.906 0.094]
```

## What the mixing actually buys

::: example RMSE against either single model, before and after the maneuver
Compare the IMM's combined output against each single model run alone, on the identical truth and measurements:

| window | IMM | quiet-only | maneuver-only |
| --- | --- | --- | --- |
| overall ($60$ steps) | $1.37\,\mathrm m$ | $7.41\,\mathrm m$ | $1.71\,\mathrm m$ |
| pre-maneuver ($30$ steps) | $1.08\,\mathrm m$ | $0.99\,\mathrm m$ | $1.45\,\mathrm m$ |
| $8$ steps post-maneuver | $2.34\,\mathrm m$ | $18.45\,\mathrm m$ | $2.34\,\mathrm m$ |

Before the maneuver, the quiet-only model is actually the *best* of the three ($0.99\,\mathrm m$) — it is the exactly correct model for that segment, and the IMM's slightly worse $1.08\,\mathrm m$ is the honest cost of hedging against a maneuver that has not happened yet. Immediately after the maneuver, that ordering flips completely: the quiet-only model lags catastrophically ($18.45\,\mathrm m$, unable to absorb a $15\,\mathrm{m/s}$ jump its own tight process-noise assumption rules out), while the IMM ($2.34\,\mathrm m$) tracks essentially as well as the maneuvering model built for exactly this case. Averaged over the whole run, the IMM's overall RMSE ($1.37\,\mathrm m$) beats *both* single models — not because it is better than a correctly-matched model in its own regime, but because it never pays the catastrophic penalty either single model pays in the regime it was not built for.
:::

```python
import numpy as np

rng = np.random.default_rng(17)
dt = 1.0
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])
def Qof(q): return q*np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
Q1, Q2 = Qof(0.02), Qof(4.0)
Pi = np.array([[0.97, 0.03], [0.15, 0.85]])
N, MAN = 60, 30

x_true = np.array([0.0, 5.0]); xs_true = [x_true.copy()]
for k in range(N):
    if k == MAN: x_true[1] += 15.0
    x_true = F@x_true + rng.multivariate_normal([0, 0], Qof(0.05))
    xs_true.append(x_true.copy())
xs_true = np.array(xs_true)
zs = (H@xs_true[1:].T).flatten() + rng.normal(0, 2.0, N)

def predict(x, P, Q): return F@x, F@P@F.T+Q
def update(x, P, z):
    S = (H@P@H.T+R)[0, 0]; K = (P@H.T)/S; nu = z-(H@x)[0]
    x2 = x + K.flatten()*nu; P2 = (np.eye(2)-np.outer(K, H))@P
    lik = np.exp(-0.5*nu*nu/S)/np.sqrt(2*np.pi*S)
    return x2, P2, lik

def run_single(Q):
    x, P = np.array([0.0, 5.0]), np.diag([4.0, 4.0])
    out = []
    for k in range(N):
        xp, Pp = predict(x, P, Q)
        x, P, _ = update(xp, Pp, zs[k])
        out.append(x.copy())
    return np.array(out)

def run_imm():
    x1, P1 = np.array([0.0, 5.0]), np.diag([4.0, 4.0])
    x2, P2 = x1.copy(), P1.copy()
    mu = np.array([0.9, 0.1])
    out = []
    for k in range(N):
        c = mu@Pi
        mix = Pi*mu[:, None]/c[None, :]
        x1_0 = mix[0, 0]*x1 + mix[1, 0]*x2
        x2_0 = mix[0, 1]*x1 + mix[1, 1]*x2
        def mixP(xi, Pi_, xj, Pj_, wi, wj, x0):
            di, dj = xi-x0, xj-x0
            return wi*(Pi_+np.outer(di, di)) + wj*(Pj_+np.outer(dj, dj))
        P1_0 = mixP(x1, P1, x2, P2, mix[0, 0], mix[1, 0], x1_0)
        P2_0 = mixP(x1, P1, x2, P2, mix[0, 1], mix[1, 1], x2_0)
        x1p, P1p = predict(x1_0, P1_0, Q1); x2p, P2p = predict(x2_0, P2_0, Q2)
        x1, P1, lik1 = update(x1p, P1p, zs[k]); x2, P2, lik2 = update(x2p, P2p, zs[k])
        num = c*np.array([lik1, lik2]); mu = num/num.sum()
        out.append(mu[0]*x1 + mu[1]*x2)
    return np.array(out)

xs_cv, xs_mv, xs_imm = run_single(Q1), run_single(Q2), run_imm()
rmse = lambda est, sl: np.sqrt(np.mean((est[sl, 0]-xs_true[1:][sl, 0])**2))
print(rmse(xs_imm, slice(None)), rmse(xs_cv, slice(None)), rmse(xs_mv, slice(None)))
print(rmse(xs_imm, slice(0, 30)), rmse(xs_cv, slice(0, 30)), rmse(xs_mv, slice(0, 30)))
print(rmse(xs_imm, slice(30, 38)), rmse(xs_cv, slice(30, 38)), rmse(xs_mv, slice(30, 38)))
# 1.366 7.407 1.712
# 1.077 0.986 1.451
# 2.336 18.445 2.338
```

::: key IMM is a hedge, not a free upgrade
The pre-maneuver row is the honest accounting: the correctly-matched single model beats the IMM in its own regime, every time, because the IMM is spending some of its trust hedging against a possibility (the maneuver) that has not yet materialized. The payoff comes precisely in the regime a fixed single model has no way to handle — and averaged over a realistic mix of both regimes, that payoff is large enough to make the IMM's overall performance the best of the three, without ever requiring the filter to know in advance which regime it is in.
:::

::: warning The candidate models still have to be reasonable ones
An IMM can only choose among the dynamics models it was given — exactly the Gaussian sum filter's own limitation, restated for models instead of state hypotheses. A target maneuvering in a way neither the "quiet" nor the "maneuvering" model describes well (a much sharper turn, a different kind of acceleration profile entirely) will still be explained, however imperfectly, by whichever of the two available models fits best, with the reported mode probabilities reflecting confidence among the wrong menu of choices rather than any signal that a better model was never offered.
:::

::: warning The transition matrix $\Pi$ is a real tuning parameter, not a formality
$\Pi$'s off-diagonal entries set how quickly the filter is willing to believe a mode switch has occurred, and how quickly it is willing to believe one has ended — too small, and the mode probabilities respond sluggishly to a genuine maneuver (closer to running two independent filters that barely interact); too large, and the filter chases noise between models on every noisy cycle, never settling into confident tracking during genuinely quiet stretches. The $0.97/0.03$ and $0.15/0.85$ split used in this lesson's example was chosen to make the maneuver detection sharp without being tuned to this specific scenario's numbers; a real design would set it from the actual expected dwell times in each regime, the same kind of engineering judgment that choosing $\mathbf Q$ for an ordinary Kalman filter always required.
:::

## Check yourself

::: check
Explain the difference between what varies across a Gaussian sum filter's components and what varies across an IMM's components.
:::

::: answer
A Gaussian sum filter's components share the same dynamics and measurement model but represent different hypotheses about the *current state* — which valley, which mode of an otherwise identical posterior. An IMM's components represent different *dynamics models* applied to the same underlying state — constant velocity against a maneuvering model, in this lesson's example — with the mixture weights tracking which model currently best explains the vehicle's behavior rather than which value of the state is correct.
:::

::: check
Why is the mixing step described as what makes this filter "interacting," and what would be lost by running the two models as two completely independent filters, combined only at the very end by their mode probabilities?
:::

::: answer
Mixing shares each model's information with the others every cycle, weighted by the transition matrix, before either model runs its own predict-and-update — so a model whose probability was temporarily low still starts its next cycle from an initial condition informed by whichever model was doing better during that stretch. Two completely independent filters, combined only at the end, would each have to rebuild their own estimate entirely from their own history; a model that fell out of favor during a maneuver would have no way to "catch up" using the other model's better-informed trajectory once its own probability recovered, producing a worse combined estimate than the interacting version even with identical final mode probabilities.
:::

::: check
In the RMSE table, the IMM was not the best-performing filter in the pre-maneuver window. Is this evidence the IMM is poorly designed?
:::

::: answer
No — it is the expected and honest cost of hedging. The quiet-only model is, by construction, exactly the correct model before the maneuver, so no amount of good design lets a filter that also allocates some belief to an (at that point) incorrect maneuvering model outperform a filter that puts its entire trust in the correct one. The IMM's value is not "always the single best filter in every window," it is "never far behind the correct specialist in any window, without needing to know in advance which window it is in" — precisely what the overall and post-maneuver rows demonstrate.
:::

::: check
A design team sets $\Pi$'s off-diagonal transition probabilities extremely small (say, $10^{-6}$) to keep the filter "stable." Based on this lesson's warning about $\Pi$, what behavior would you expect from the mode probabilities during an actual maneuver?
:::

::: answer
Sluggish, delayed response — with such a small probability of transitioning between modes built into the mixing step, the mode probability update would need a correspondingly large and sustained run of maneuvering-model-favoring likelihoods to overcome the strong prior against switching, so the filter would take many more cycles to recognize a genuine maneuver than the sharp, single-cycle jump this lesson's example demonstrated. This trades a faster, noisier mode response for a slower, more stable one — exactly the tuning trade-off the warning describes, pushed to an extreme that would likely cost significant tracking accuracy during the maneuver itself.
:::

::: check
Suppose a third candidate model were added — a "sharp turn" model with even higher process noise than the "maneuvering" model already in the bank. What would you expect to happen to the mode probabilities during ordinary straight-line flight, compared to the two-model version in this lesson?
:::

::: answer
During ordinary straight-line flight, both the "maneuvering" and "sharp turn" models are over-specified relative to what is actually happening, so their likelihoods would both tend to be somewhat lower than the well-matched "quiet" model's — the quiet model should still dominate, much as it did in the two-model case. Adding a third, even-higher-process-noise model mainly changes what happens *during* a maneuver: the filter now has to allocate probability across two maneuvering candidates rather than committing fully to one, and correctly distinguishing a moderate maneuver from a sharp turn would depend on how well each model's specific process-noise level matches the actual severity of what the vehicle is doing, not merely on detecting that some maneuver occurred.
:::

## Summary

| Item | Statement |
| --- | --- |
| IMM recipe | Mix per-model estimates using $\Pi$ and current mode probabilities; run each model's own predict-update from its mixed start; update mode probabilities by each model's likelihood; combine into one output |
| What varies across models | The dynamics model itself (process noise, or the dynamics function entirely) — not the state hypothesis, as in a Gaussian sum filter |
| Demonstrated | Mode probability jumped from $9\%$ to $99.8\%$ maneuvering-model confidence in one cycle at the true maneuver, decaying back to $91\%$ quiet-model confidence within about fifteen cycles afterward |
| Demonstrated payoff | Pre-maneuver: quiet-only model wins ($0.99\,\mathrm m$ vs IMM's $1.08\,\mathrm m$). Post-maneuver: IMM ($2.34\,\mathrm m$) matches the specialist and dwarfs the mismatched model ($18.45\,\mathrm m$). Overall: IMM ($1.37\,\mathrm m$) beats both single models |
| Real cost | $\Pi$ requires genuine engineering tuning; the filter is still limited to choosing among the models it was given |

This closes the module. Every filter here — EKF, UKF, CKF, particle filter, Gaussian sum, error-state, Multiplicative EKF, invariant EKF, consider and augmented states, IMM — answers the same underlying question the linear Kalman filter never had to ask: what do you do when the world will not hold still long enough to linearize once and trust it. The honest answer, running through every lesson in this module, was never "use this one filter instead of that one" — it was "know precisely what each approximation costs, on this specific problem, before the vehicle finds out for you."
