---
id: l14-multiple-model-and-imm-filters
title: Multiple-model and IMM filters
minutes: 23
covers:
  - Multiple-model and IMM filters
---

Picture a friend on a bike, and you are trying to guess where they will be one second from now. Most of the time they ride straight at a steady speed, and "same as before" is a great guess. Then, with no warning, they swerve around a puddle. For that second, "same as before" is a terrible guess, and a guess of "they could be anywhere nearby" is better. A smart watcher keeps both ideas in mind, notices which one has been working lately, and switches trust between them as the ride goes on.

Every filter in this module so far has assumed one dynamics model $\mathbf f$ — maybe badly nonlinear, but a single, fixed rule for how the state moves. Real vehicles do not always follow one rule. An aircraft flies straight, banks into a turn, levels out. A spacecraft coasts, then fires a thruster. Each time, it switches to a different **[[regime|regime]]** — a stretch of time during which one kind of motion is in force. Which regime it is in right now is not announced. The filter has to work it out from the same measurements it uses to track the state.

The standard answer is the **Interacting Multiple Model (IMM)** filter: run several candidate models side by side, let the data decide how much to trust each one, moment to moment, and blend them into one output. It is the **[[workhorse of target tracking|imm-history]]**, from air-traffic radar to missile defense.

## A bank of competing models

At first sight this looks like the Gaussian sum filter from earlier in this module: a small bank of filters, weighted and combined. The difference is *what the members disagree about*. A Gaussian sum filter's components share one dynamics model and disagree about the **state** — which valley the vehicle is in. An IMM's components disagree about the **dynamics model itself**.

In this lesson's example, both models say "constant velocity". What differs is their **[[process noise|process-noise]]** — how much random push each model expects the target to get between measurements:

- The **quiet** model expects almost no push ($q = 0.02$). It tracks a steady target tightly, but it is shocked by a swerve.
- The **maneuvering** model expects a lot of push ($q = 4.0$). It is never shocked, but it tracks a steady target more loosely.

Each model is an ordinary Kalman filter with its own estimate $\hat{\mathbf x}^{(j)}$ ("x hat, model j") and covariance $\mathbf P^{(j)}$. After each measurement, each filter reports a **[[likelihood|likelihood]]** $\Lambda^{(j)}$ ($\Lambda$ is capital "lambda"): how probable this measurement was, according to model $j$. For a scalar measurement it comes from the innovation $\nu$ ("nu", the measured value minus the predicted one) and its variance $S$:

$$
\Lambda = \frac{1}{\sqrt{2\pi S}}\exp\!\left(-\frac{\nu^2}{2S}\right).
$$

A model that predicted the measurement well — small $\nu$ compared with $\sqrt S$ — gets a high likelihood. A model that was badly surprised gets a tiny one.

## How regimes switch: the Markov chain

The IMM needs one more ingredient: a rule for how likely the target is to switch regimes. It uses a **[[Markov chain|markov]]** — a model in which the chance of what happens next depends only on the regime right now, not on the whole history. The chances are collected in a **transition matrix** $\Pi$ (capital "pi"). The entry $\Pi_{ij}$ is the probability of being in model $j$ at the next step, given model $i$ now. This lesson uses

$$
\Pi = \begin{pmatrix} 0.97 & 0.03 \\ 0.15 & 0.85 \end{pmatrix}.
$$

Row one says: from quiet, stay quiet with probability $0.97$, start maneuvering with $0.03$. Row two says: from maneuvering, calm down with probability $0.15$, keep maneuvering with $0.85$. Each row adds up to $1$, because the target must be in *some* regime next.

The diagonal entries tell you how long a regime typically lasts. If each step has a chance $1 - \Pi_{ii}$ of leaving, the average stay, the **[[dwell time|dwell]]**, is

$$
\text{average dwell} = \frac{1}{1 - \Pi_{ii}} \text{ steps}.
$$

For quiet: $1/0.03 \approx 33$ steps. For maneuvering: $1/0.15 \approx 6.7$ steps. So this $\Pi$ describes a target that flies straight for half a minute or so at a time, with maneuvers lasting several seconds.

The filter also carries a **mode probability** $\mu^{(i)}$ ("mu i") for each model: how much it currently believes model $i$ is the one in force. They always add up to $1$. Before a new measurement arrives, the Markov chain moves those beliefs forward one step:

$$
c_j = \sum_i \Pi_{ij}\,\mu^{(i)} .
$$

Here $c_j$ is the predicted probability of model $j$, before looking at the new measurement. Read the sum as "all the ways of ending up in model $j$: from each model $i$, times the chance of moving from $i$ to $j$".

## The IMM recipe

Now the whole cycle. It has four steps.

::: key Interacting Multiple Model filter, one cycle
An IMM filter runs a bank of filters for different motion models, mixes their estimates each step according to a Markov transition matrix over models, and combines them by model probability. It is the standard filter for maneuvering-target tracking.

For $M$ candidate models with a known **Markov transition matrix** $\Pi$ ($\Pi_{ij}$ = probability of being in model $j$ next, given model $i$ now), current mode probabilities $\mu^{(i)}$, and per-model estimates $\hat{\mathbf x}^{(i)},\mathbf P^{(i)}$:

**Mixing**: compute mixing weights $w_{ij}=\Pi_{ij}\mu^{(i)}\big/c_j$ with $c_j=\sum_i\Pi_{ij}\mu^{(i)}$, and mixed initial conditions for each model $j$, $\hat{\mathbf x}_{0j}=\sum_i w_{ij}\hat{\mathbf x}^{(i)}$, with $\mathbf P_{0j}$ combined by the same moment-matching formula the Gaussian sum filter lesson used.

**Filter**: run each model's own predict-and-update cycle from its mixed initial condition, producing a likelihood $\Lambda^{(j)}$ for how well model $j$ explains this cycle's measurement.

**Mode probability update**: $\mu^{(j)}\propto c_j\Lambda^{(j)}$, renormalized to sum to one.

**Combination**: report $\hat{\mathbf x}=\sum_j\mu^{(j)}\hat{\mathbf x}^{(j)}$ (and its moment-matched covariance) as the filter's single output.
:::

The **mixing weight** $w_{ij}$ answers: "given that the target is in model $j$ now, what is the chance it was in model $i$ a moment ago?" Model $j$'s filter then starts its cycle from a blend of all the models' estimates, weighted by those chances. The spread of that blend comes from **[[moment matching|moment-matching]]**:

$$
\mathbf P_{0j} = \sum_i w_{ij}\left[\mathbf P^{(i)} + \big(\hat{\mathbf x}^{(i)} - \hat{\mathbf x}_{0j}\big)\big(\hat{\mathbf x}^{(i)} - \hat{\mathbf x}_{0j}\big)^{\mathsf T}\right].
$$

In words: each model's own spread, plus an extra term for how far its estimate sits from the blended one. When the models disagree, the blend is honestly less certain than any single one.

The symbol $\propto$ in the mode update means "proportional to". Compute $c_j\Lambda^{(j)}$ for every model, then divide each by their total so they add up to $1$. This is Bayes' rule: prior belief $c_j$ times how well the model explained the data.

Why mix at all? Without mixing, each filter would live only on its own history. Suppose the quiet model gets badly fooled by a maneuver. Its estimate falls behind, and it has no way to catch up except slowly, from its own tight, stubborn predictions. Mixing hands it the maneuvering model's better estimate at the start of every cycle, in proportion to how likely a switch is. So a model that lost favor for a while does not have to rebuild its estimate from scratch.

::: example One mode update by hand
Here is the cycle in which the maneuver happens (step 30 of the simulation below). Coming in, the mode probabilities are $\mu = (0.906,\ 0.094)$ for (quiet, maneuvering).

**Predict the mode probabilities.** Using the columns of $\Pi$:

$$
c_{\text{quiet}} = 0.97 \times 0.906 + 0.15 \times 0.094 \approx 0.893, \qquad
c_{\text{man}} = 0.03 \times 0.906 + 0.85 \times 0.094 \approx 0.107.
$$

They add up to $1$, as they must.

**Likelihoods.** The target has jumped. The quiet filter's innovation is $\nu = 16.90\,\mathrm m$ with $S = 6.91\,\mathrm{m^2}$, so $\sqrt S \approx 2.63\,\mathrm m$ and the surprise is $6.4$ standard deviations. The maneuvering filter's innovation is $18.73\,\mathrm m$ with $S = 14.94\,\mathrm{m^2}$: $\sqrt S \approx 3.86\,\mathrm m$, a surprise of $4.8$ standard deviations. Putting these into the likelihood formula:

$$
\Lambda_{\text{quiet}} \approx 1.61 \times 10^{-10}, \qquad \Lambda_{\text{man}} \approx 8.20 \times 10^{-7}.
$$

Both are small — this measurement surprised everyone — but the maneuvering model's is about $5100$ times larger. A $6.4$-sigma surprise is enormously less likely than a $4.8$-sigma one, because the bell curve falls off so steeply.

**Multiply and normalize.**

$$
c_{\text{quiet}}\Lambda_{\text{quiet}} \approx 1.44 \times 10^{-10}, \qquad c_{\text{man}}\Lambda_{\text{man}} \approx 8.76 \times 10^{-8}.
$$

The total is about $8.78 \times 10^{-8}$. Divide each by it: $\mu_{\text{man}} \approx 0.998$ and $\mu_{\text{quiet}} \approx 0.002$.

Sanity check: the maneuvering model started with only about $11\%$ of the belief, but a likelihood ratio in the thousands overwhelmed that. One strongly surprising measurement is enough to flip the filter's mind.
:::

::: example Mode probability tracking a real maneuver
Track a target with the two models above. Everything else — measurement noise ($2\,\mathrm m$), dynamics structure — is identical. The target's velocity jumps by $15\,\mathrm{m/s}$ at step $30$ of a $60$-step run:

| step | $\mu_{\text{quiet}}$ | $\mu_{\text{maneuver}}$ |
| --- | --- | --- |
| $28$ | $0.935$ | $0.065$ |
| $29$ | $0.906$ | $0.094$ |
| $30$ | $0.002$ | $0.998$ |
| $31$ | $0.137$ | $0.863$ |
| $36$ | $0.652$ | $0.348$ |
| $44$ | $0.905$ | $0.095$ |

At the exact step of the maneuver, $\mu_{\text{maneuver}}$ jumps from $9\%$ to $99.8\%$ in one cycle — the hand calculation above. Then the belief drains back toward the quiet model over the next dozen or so steps, as the target flies straight again and the quiet model's tighter tracking fits better. By step 44 the quiet model holds about $90\%$ again. The filter is never stuck on "a maneuver was detected". It keeps re-asking which model fits *now*. The **[[whole trace|mode-plot]]** is worth seeing.
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
# 28 [0.935 0.065]  29 [0.906 0.094]  30 [0.002 0.998]
# 31 [0.137 0.863]  36 [0.652 0.348]  44 [0.905 0.095]
```

Look at what mixing does right after the maneuver. At the start of step 31, the mixing weight from the maneuvering model into the quiet model is about $0.99$. In plain words: the quiet filter's starting point for that cycle is $99\%$ the maneuvering filter's estimate. The quiet model gets dragged straight to where the target really is, and can take over again once the target settles.

## What the mixing actually buys

::: example RMSE against single models and an unmixed bank
Compare the IMM's combined output with each single model run alone, and with the same two filters run as a bank *without* the mixing step (their outputs still blended by mode probability). The measure is the **[[RMSE|rmse]]** of the position, on identical truth and measurements:

| window | IMM | quiet-only | maneuver-only | unmixed bank |
| --- | --- | --- | --- | --- |
| overall ($60$ steps) | $1.37\,\mathrm m$ | $7.41\,\mathrm m$ | $1.71\,\mathrm m$ | $1.47\,\mathrm m$ |
| pre-maneuver ($30$ steps) | $1.08\,\mathrm m$ | $0.99\,\mathrm m$ | $1.45\,\mathrm m$ | $1.08\,\mathrm m$ |
| $8$ steps post-maneuver | $2.34\,\mathrm m$ | $18.45\,\mathrm m$ | $2.34\,\mathrm m$ | $2.34\,\mathrm m$ |
| last $22$ steps | $1.23\,\mathrm m$ | $4.96\,\mathrm m$ | $1.77\,\mathrm m$ | $1.52\,\mathrm m$ |

**Before the maneuver**, the quiet-only filter is the *best* of all ($0.99\,\mathrm m$). It is the closest match to what the target is doing. The IMM's slightly worse $1.08\,\mathrm m$ is the honest cost of hedging against a maneuver that has not happened yet.

**Right after the maneuver**, the order flips. The quiet-only filter lags badly ($18.45\,\mathrm m$): its tight process noise says a $15\,\mathrm{m/s}$ jump is nearly impossible, so it refuses to follow. The IMM ($2.34\,\mathrm m$) tracks as well as the maneuvering filter built for exactly this case.

**After things calm down**, mixing shows its value. The unmixed bank's quiet filter never recovers from the maneuver on its own, so the maneuvering filter keeps winning: at step 44 the unmixed bank still gives the maneuvering model $97\%$ of the belief, while the IMM has handed $90\%$ back to the quiet model. The unmixed bank is stuck with the looser tracker and does worse ($1.52\,\mathrm m$ against $1.23\,\mathrm m$).

Over the whole run, the IMM ($1.37\,\mathrm m$) beats every alternative. It is not better than a well-matched model in that model's own regime. It simply never pays the big penalty a single model pays in the regime it was not built for.
:::

```python
import numpy as np

rng = np.random.default_rng(17)
dt = 1.0
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])
def Qof(q): return q*np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
Q1, Q2 = Qof(0.02), Qof(4.0)
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

def mixP(xi, Pi_, xj, Pj_, wi, wj, x0):
    di, dj = xi-x0, xj-x0
    return wi*(Pi_+np.outer(di, di)) + wj*(Pj_+np.outer(dj, dj))

def run_single(Q):
    x, P = np.array([0.0, 5.0]), np.diag([4.0, 4.0])
    out = []
    for k in range(N):
        xp, Pp = predict(x, P, Q)
        x, P, _ = update(xp, Pp, zs[k])
        out.append(x.copy())
    return np.array(out)

def run_imm(Pi, interact=True):
    x1, P1 = np.array([0.0, 5.0]), np.diag([4.0, 4.0])
    x2, P2 = x1.copy(), P1.copy()
    mu = np.array([0.9, 0.1])
    out, mus = [], []
    for k in range(N):
        c = mu@Pi
        if interact:                     # the mixing step
            mix = Pi*mu[:, None]/c[None, :]
            x1_0 = mix[0, 0]*x1 + mix[1, 0]*x2
            x2_0 = mix[0, 1]*x1 + mix[1, 1]*x2
            P1_0 = mixP(x1, P1, x2, P2, mix[0, 0], mix[1, 0], x1_0)
            P2_0 = mixP(x1, P1, x2, P2, mix[0, 1], mix[1, 1], x2_0)
        else:                            # no mixing: each filter keeps its own history
            x1_0, P1_0, x2_0, P2_0 = x1, P1, x2, P2
        x1p, P1p = predict(x1_0, P1_0, Q1); x2p, P2p = predict(x2_0, P2_0, Q2)
        x1, P1, lik1 = update(x1p, P1p, zs[k]); x2, P2, lik2 = update(x2p, P2p, zs[k])
        num = c*np.array([lik1, lik2]); mu = num/num.sum()
        out.append(mu[0]*x1 + mu[1]*x2); mus.append(mu.copy())
    return np.array(out), np.array(mus)

Pi = np.array([[0.97, 0.03], [0.15, 0.85]])
xs_cv, xs_mv = run_single(Q1), run_single(Q2)
xs_imm, mus = run_imm(Pi)
xs_bank, mus_bank = run_imm(Pi, interact=False)
rmse = lambda est, sl: np.sqrt(np.mean((est[sl, 0]-xs_true[1:][sl, 0])**2))
for name, est in [('IMM', xs_imm), ('quiet', xs_cv), ('maneuver', xs_mv), ('no-mix bank', xs_bank)]:
    print(name, [round(float(rmse(est, sl)), 2) for sl in (slice(None), slice(0, 30), slice(30, 38), slice(38, 60))])
print('mu_maneuver at step 44: IMM', round(float(mus[44, 1]), 3), ' no-mix bank', round(float(mus_bank[44, 1]), 3))
# IMM [1.37, 1.08, 2.34, 1.23]
# quiet [7.41, 0.99, 18.45, 4.96]
# maneuver [1.71, 1.45, 2.34, 1.77]
# no-mix bank [1.47, 1.08, 2.34, 1.52]
# mu_maneuver at step 44: IMM 0.095  no-mix bank 0.974
```

::: key IMM is a hedge, not a free upgrade
The pre-maneuver row is the honest accounting: the correctly matched single model beats the IMM in its own regime, because the IMM spends some of its trust hedging against a maneuver that has not yet happened. The payoff comes in the regime a fixed single model cannot handle. Averaged over a realistic mix of both regimes, that payoff is large enough to make the IMM the best overall — without the filter ever needing to know in advance which regime it is in.
:::

::: warning The candidate models still have to be reasonable ones
An IMM can only choose among the models it was given — the Gaussian sum filter's limitation, restated for models instead of state hypotheses. A target moving in a way no model in the bank describes well (a much sharper turn, a completely different acceleration pattern) will still be explained, badly, by whichever model fits least poorly. The mode probabilities then report confidence among the wrong menu of choices. Nothing in them signals that a better model was never offered, so check the innovations of the winning model: if they stay large, the menu is wrong.
:::

::: warning The transition matrix $\Pi$ is a real tuning parameter, not a formality
The off-diagonal entries of $\Pi$ set how readily the filter believes a switch has happened, and how readily it believes one has ended. Too small, and the models barely interact: the filter behaves like the unmixed bank, and can get stuck in one mode long after the regime has changed. Too large, and the filter hops between models on every noisy cycle and never settles into confident tracking in a quiet stretch. Set $\Pi$ from the real expected dwell times in each regime, $\Pi_{ii} = 1 - 1/(\text{average dwell in steps})$. That is the same kind of engineering judgment as choosing $\mathbf Q$ for an ordinary Kalman filter.
:::

## Check yourself

::: check
Explain the difference between what varies across a Gaussian sum filter's components and what varies across an IMM's components.
:::

::: answer
A Gaussian sum filter's components share the same dynamics and measurement model, but each is a different hypothesis about the *current state* — which valley, which peak of the posterior.

An IMM's components are different *dynamics models* applied to the same underlying state — a quiet constant-velocity model against a maneuvering one, in this lesson. Their weights (the mode probabilities) track which model currently best explains the vehicle's behavior, not which value of the state is correct.
:::

::: check
Why is the mixing step what makes this filter "interacting", and what is lost by running the two models as two independent filters, combined only at the very end by their mode probabilities?
:::

::: answer
Mixing shares each model's information with the others every cycle, weighted by the transition matrix, before any model runs its own predict and update. So a model whose probability was low for a while still starts its next cycle from a point informed by whichever model was doing better.

Two independent filters each live on their own history. A model that was fooled by a maneuver has no way to catch up using the other model's better estimate. The lesson's own run shows the cost: the unmixed bank's quiet filter never recovered, the bank stayed $97\%$ convinced of the maneuvering model at step 44, long after the target had calmed down, and its RMSE over the last $22$ steps was $1.52\,\mathrm m$ against the IMM's $1.23\,\mathrm m$.
:::

::: check
In the RMSE table, the IMM was not the best filter in the pre-maneuver window. Is this evidence the IMM is poorly designed?
:::

::: answer
No. It is the expected, honest cost of hedging. Before the maneuver, the quiet-only filter is the closest match to what the target is doing. A filter that also puts some belief on a (for now) wrong maneuvering model cannot beat a filter that puts all its trust in the right one.

The IMM's value is not "always the single best filter in every window". It is "never far behind the right specialist in any window, without knowing in advance which window it is in" — which is what the overall and post-maneuver rows show.
:::

::: check
Using the likelihood formula, check the likelihood of the quiet model in the hand example: $\nu = 16.90\,\mathrm m$, $S = 6.91\,\mathrm{m^2}$. Then explain in one sentence why the maneuvering model's likelihood, with a *larger* innovation ($18.73\,\mathrm m$), came out about $5100$ times bigger.
:::

::: answer
First the pieces. $\nu^2 = 16.90^2 \approx 285.6$, and $2S = 13.82$, so the exponent is $-285.6/13.82 \approx -20.67$. Then $e^{-20.67} \approx 1.06 \times 10^{-9}$. The front factor is $1/\sqrt{2\pi \times 6.91} = 1/\sqrt{43.4} \approx 0.152$. Multiply: $\Lambda_{\text{quiet}} \approx 0.152 \times 1.06 \times 10^{-9} \approx 1.61 \times 10^{-10}$.

What matters is the innovation measured in the model's *own* standard deviations: the maneuvering model expected big pushes, so its $S$ is larger and $18.73\,\mathrm m$ is only $4.8$ of its sigmas, while $16.90\,\mathrm m$ is $6.4$ of the quiet model's sigmas — and a Gaussian falls off so steeply that those extra $1.6$ sigmas cost a factor of thousands.
:::

::: check
A design team sets $\Pi$'s off-diagonal transition probabilities extremely small (say $10^{-6}$) to keep the filter "stable". What would you expect from the mode probabilities during and after a maneuver like the one in this lesson?
:::

::: answer
With switches almost forbidden, the models barely mix, so the filter behaves nearly like the unmixed bank.

*During* a large maneuver, detection can still be fast, because a likelihood ratio in the thousands can overcome even a strong prior against switching. Running the lesson's second program with this $\Pi$ gives $\mu_{\text{maneuver}} \approx 0.79$ at step 30 and $1.00$ at step 31. A gentler maneuver, with a smaller likelihood ratio, would take several cycles to register.

*After* the maneuver, the damage shows. The quiet filter no longer gets the maneuvering filter's estimate through mixing, so it stays lost. The mode probability stays at about $1.00$ for the maneuvering model through the end of the run — the filter never returns to quiet tracking. Overall RMSE rises to about $1.60\,\mathrm m$, against $1.37\,\mathrm m$ with the lesson's $\Pi$. "Stable" mode probabilities turned out to mean "stuck".
:::

::: check
Suppose a third model were added — a "sharp turn" model with even more process noise than the "maneuvering" one. What would you expect the mode probabilities to do during straight flight, and during a maneuver, compared with the two-model filter?
:::

::: answer
During straight flight, both the maneuvering and sharp-turn models expect far more push than the target is getting, so their likelihoods tend to be lower than the well-matched quiet model's. The quiet model should still dominate, much as it did with two models.

The real change comes *during* a maneuver. The filter must now split belief between two maneuvering candidates instead of committing to one. Which one wins depends on how well each model's process-noise level matches the actual severity of the maneuver, not merely on detecting that some maneuver happened. A third model also costs a third filter's worth of computation, and $\Pi$ grows to $3 \times 3$, with more entries to tune.
:::

## Summary

| Item | Statement |
| --- | --- |
| IMM in one line | A bank of filters for different motion models, mixed each step by a Markov transition matrix over models, combined by model probability |
| Transition matrix | $\Pi_{ij}$ = chance of model $j$ next given model $i$ now; rows sum to $1$; average dwell $1/(1 - \Pi_{ii})$ steps |
| One cycle | Predict $c_j = \sum_i \Pi_{ij}\mu^{(i)}$; mix with $w_{ij} = \Pi_{ij}\mu^{(i)}/c_j$; run each filter; $\mu^{(j)} \propto c_j\Lambda^{(j)}$; output $\sum_j \mu^{(j)}\hat{\mathbf x}^{(j)}$ |
| Likelihood | $\Lambda = \exp(-\nu^2/2S)/\sqrt{2\pi S}$; judged in each model's own sigmas |
| What varies across models | The dynamics model itself (process noise, or the dynamics function entirely), not the state hypothesis as in a Gaussian sum filter |
| Demonstrated | Maneuver belief jumped from $9\%$ to $99.8\%$ in one cycle at the true maneuver, and the quiet model was back to about $90\%$ within about fifteen cycles |
| Demonstrated payoff | Pre-maneuver: quiet-only wins ($0.99\,\mathrm m$ vs IMM's $1.08\,\mathrm m$). Post-maneuver: IMM ($2.34\,\mathrm m$) matches the specialist; the mismatched model lags at $18.45\,\mathrm m$. Overall: IMM ($1.37\,\mathrm m$) beats both single models and the unmixed bank ($1.47\,\mathrm m$) |
| Real cost | $\Pi$ needs genuine tuning; the filter can only choose among the models it was given |

This closes the module. Every filter here — EKF, UKF, cubature, particle, Gaussian sum, error-state, Multiplicative EKF, invariant EKF, consider and augmented states, IMM — answers a question the linear Kalman filter never had to ask: what do you do when the world will not hold still long enough to linearize once and trust it? The answer running through every lesson was never "use this filter instead of that one". It was "know exactly what each approximation costs, on this specific problem, before the vehicle finds out for you". The inertial navigation module puts these tools to work, and multiple-model ideas return **[[beyond tracking|mmae]]** wherever a system can fail or change in a few known ways.

::: context regime A word from everyday life
A **regime** is a period during which one set of rules holds — the word is used the same way for a diet or an exercise plan. In tracking, a target's regimes might be "cruising", "turning" and "accelerating". For a spacecraft, "coasting" and "thrusting" are two regimes with very different dynamics: during a burn, the acceleration can be thousands of times larger than the tiny pushes from sunlight or thin air that act while coasting. A filter tuned for one regime is badly tuned for the other.
:::

::: context imm-history Born for air-traffic control
The IMM algorithm was published by Henk Blom and Yaakov Bar-Shalom in 1988, in the *IEEE Transactions on Automatic Control*. Its appeal was cost: it gets most of the benefit of tracking every possible history of mode switches — a number that doubles every step with two models — while running only one filter per model. That made it practical for radar trackers following many aircraft at once, and it spread from air-traffic control to military and space tracking. Bar-Shalom's textbooks on tracking made it the standard teaching example.
:::

::: context process-noise How much surprise a model allows
Process noise is a filter's allowance for pushes it cannot predict: gusts, small thrusts, a pilot's hand on the stick. A small $q$ says "this target moves very smoothly", so the filter trusts its own predictions and changes course slowly. A large $q$ says "anything can happen", so the filter follows each new measurement closely — including its noise. Neither setting is right all the time. That tension, which the Kalman module met as the problem of tuning $\mathbf Q$, is exactly what an IMM sidesteps by running both settings at once and letting the data choose.
:::

::: context likelihood Probability, turned around
The **likelihood** is a probability read backwards. Normally you ask "given the model, how probable is this measurement?". Here the measurement is already in, and the same number is used to score the models: "which model made what we saw least surprising?". The formula is the Gaussian bell evaluated at the innovation. It has units (per metre, here), so a likelihood is not a probability by itself — only ratios of likelihoods matter, which is why the IMM always normalizes at the end.
:::

::: context markov Named for Andrey Markov
The Russian mathematician Andrey Markov studied chains of random events in the early 1900s where the next step depends only on the present state — famously testing the idea on the sequence of vowels and consonants in Pushkin's poem *Eugene Onegin*. The arrows below are this lesson's $\Pi$: the loops are the chances of staying, and the arrows between the circles are the chances of switching. The two arrows leaving each circle add up to $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="100" cy="100" r="34" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="260" cy="100" r="34" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="100" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">quiet</text>
  <text x="260" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">maneuver</text>
  <path d="M125,77 Q180,35 235,77" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="235,77 224.0,74.9 230.1,66.9" fill="#1f2a44"/>
  <path d="M235,123 Q180,165 125,123" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="125,123 136.0,125.1 129.9,133.1" fill="#1f2a44"/>
  <path d="M70,85 C20,60 20,140 70,115" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="70,115 63.3,123.9 58.8,115.0" fill="#1f2a44"/>
  <path d="M290,85 C340,60 340,140 290,115" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="290,115 301.2,115.0 296.7,123.9" fill="#1f2a44"/>
  <text x="180" y="48" font-size="12" fill="#b4232c" text-anchor="middle">0.03</text>
  <text x="180" y="160" font-size="12" fill="#b4232c" text-anchor="middle">0.15</text>
  <text x="4" y="104" font-size="12" fill="#1f2a44">0.97</text>
  <text x="331" y="104" font-size="12" fill="#1f2a44">0.85</text>
</svg>
```
:::

::: context dwell Why the average stay is one over the leaving chance
If a maneuver ends with chance $p = 0.15$ at each step, the chance it lasts exactly $n$ steps is $(1-p)^{n-1}p$: stay $n - 1$ times, then leave. The bars below show that for $n = 1$ to $12$. They shrink by a factor $0.85$ each step, and the average of this pattern works out to $1/p = 6.7$ steps. Many maneuvers are short, a few are long. If your real target's maneuvers last about $10$ steps, choose $p = 0.1$, so $\Pi_{22} = 0.9$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="34" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="34" y1="40" x2="34" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="40" y="50.0" width="18" height="120.0"/><rect x="64" y="68.0" width="18" height="102.0"/>
    <rect x="88" y="83.3" width="18" height="86.7"/><rect x="112" y="96.3" width="18" height="73.7"/>
    <rect x="136" y="107.4" width="18" height="62.6"/><rect x="160" y="116.8" width="18" height="53.2"/>
    <rect x="184" y="124.7" width="18" height="45.3"/><rect x="208" y="131.5" width="18" height="38.5"/>
    <rect x="232" y="137.3" width="18" height="32.7"/><rect x="256" y="142.2" width="18" height="27.8"/>
    <rect x="280" y="146.4" width="18" height="23.6"/><rect x="304" y="149.9" width="18" height="20.1"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="49" y="185">1</text><text x="121" y="185">4</text><text x="193" y="185">7</text><text x="265" y="185">10</text>
  </g>
  <line x1="28" y1="50" x2="34" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="26" y="54" font-size="11" fill="#1f2a44" text-anchor="end">0.15</text>
  <text x="26" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="330" y="196" font-size="11" fill="#1f2a44" text-anchor="end">maneuver length (steps)</text>
  <text x="200" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">chance a maneuver lasts exactly n steps</text>
</svg>
```
:::

::: context moment-matching One bell standing in for several
**Moment matching** replaces a blend of several Gaussians with one Gaussian that has the same mean and the same spread — the first two "moments" of the blend. The mean is the weighted average of the means. The spread has two parts: the weighted average of each member's own covariance, plus how scattered the members' means are around the blended mean. Forget the second part and the blended filter is overconfident exactly when the models disagree most, which is right after a maneuver. It is the same formula the Gaussian sum filter lesson used to collapse its mixture.
:::

::: context mode-plot Sixty steps of changing its mind
The maneuvering model's probability over the whole run. It hovers near $0.1$ while the target flies straight, with small bumps when noise happens to favor it. At step 30 (red dashed line) it leaps to $0.998$, then drains back over about fifteen steps as the quiet model proves itself again.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="25" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="34" y1="30" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="34" y1="100" x2="40" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="31" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="31" y="104" font-size="11" fill="#1f2a44" text-anchor="end">0.5</text>
  <text x="31" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <line x1="195" y1="25" x2="195" y2="170" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 4"/>
  <polyline points="45,154.5 50,154.0 55,155.6 60,156.6 65,157.8 70,159.2 75,160.3 80,154.0 85,158.0 90,159.1 95,161.0 100,161.2 105,161.7 110,160.2 115,157.5 120,161.2 125,146.8 130,158.7 135,159.8 140,160.5 145,160.5 150,139.6 155,157.5 160,158.0 165,160.2 170,155.0 175,160.2 180,160.6 185,160.9 190,156.8 195,30.3 200,49.2 205,59.3 210,75.1 215,93.3 220,103.9 225,121.3 230,109.9 235,132.5 240,141.7 245,148.4 250,147.9 255,154.9 260,158.1 265,156.7 270,159.6 275,160.6 280,158.2 285,142.0 290,157.4 295,159.5 300,159.8 305,158.4 310,156.7 315,151.4 320,157.0 325,158.2 330,146.8 335,157.5 340,158.8" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="185">0</text><text x="120" y="185">15</text><text x="195" y="185">30</text><text x="270" y="185">45</text>
  </g>
  <text x="200" y="20" font-size="11" fill="#b4232c">maneuver</text>
  <text x="340" y="198" font-size="11" fill="#1f2a44" text-anchor="end">step</text>
  <text x="46" y="20" font-size="11" fill="#1d6fd1">probability of the maneuvering model</text>
</svg>
```
:::

::: context rmse Root mean square error
**RMSE** stands for root mean square error. Take the error at every step, square each one (so negatives count too), average the squares, then take the square root to get back to metres. Squaring makes big errors count much more than small ones: one $18\,\mathrm m$ miss outweighs dozens of $1\,\mathrm m$ ones. That suits tracking, where a single large miss can mean losing the target altogether.
:::

::: context mmae Multiple models beyond tracking
The same idea — a bank of filters, each assuming a different version of the world, weighted by how well they explain the data — is used for fault detection. One filter assumes every sensor is healthy; others each assume one particular sensor has failed or one thruster is stuck. When a failure happens, the filter that assumed it starts winning, and the mode probabilities point to the culprit. The family is often called multiple-model adaptive estimation. Its cost grows with the number of models, so designers keep the list of failures short and specific.
:::
