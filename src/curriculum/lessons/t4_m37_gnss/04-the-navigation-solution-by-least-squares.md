---
id: l04-the-navigation-solution-by-least-squares
title: The navigation solution by least squares
minutes: 20
covers:
  - The navigation solution by iterative least squares / Newton iteration
---

The previous two lessons built every piece the navigation solution needs and set none of them moving. The corrected pseudorange still carried the receiver's clock bias, hundreds of kilometres of it in the worked example that opened the module. The Jacobian row was written down — $[-\mathbf{e}_i^{\mathsf T},\ 1]$ — but never used for anything. This lesson is where the pieces run: take four or more corrected pseudoranges, linearise the geometry about a guess, solve a small linear system, update the guess, and repeat until the update stops moving. That loop, executing once a second or faster, is the entire navigation function of a GNSS receiver; everything else in the receiver — the tracking loops, the message decoder, the atmospheric models — exists to hand this loop clean pseudoranges to chew on.

There is a closed-form alternative. Bancroft's method (1985) rewrites the four pseudorange equations as a single quadratic by embedding position and time in a four-dimensional space with a Lorentz-like inner product, and solves it algebraically with no iteration at all. It is worth knowing it exists, because it gives a receiver a direct, non-iterative starting guess when it has none. But every operational receiver still iterates for the epoch-to-epoch solution, for three reasons this lesson makes concrete: iteration extends without modification from four satellites to any number, it extends without modification to weighted measurements, and the object it builds along the way — the geometry matrix $\mathbf{G}$ — is exactly what the next lesson turns into dilution of precision. Get comfortable with $\mathbf{G}$ here; the rest of the module keeps coming back to it.

## Linearising the pseudorange equation

Write the corrected pseudorange to satellite $i$ (atmosphere and satellite clock already removed, as in the pseudorange lesson) as a function of the four unknowns:

$$
\hat\rho_i(\mathbf{x}, b) = \|\mathbf{s}_i - \mathbf{x}\| + \Delta\rho_{\text{Sagnac},i}(\mathbf{x}) + b,
$$

a modelled range plus a small Earth-rotation correction, derived below, plus the clock bias. This is nonlinear in $\mathbf{x}$ — the position sits inside a square root — so there is no direct linear solve. Instead, linearise about a current estimate $(\mathbf{x}_k, b_k)$ with a first-order Taylor expansion, exactly as any nonlinear least-squares problem is handled:

$$
\hat\rho_i(\mathbf{x}_k + \delta\mathbf{x},\, b_k + \delta b) \approx \hat\rho_i(\mathbf{x}_k, b_k) + \left.\frac{\partial \hat\rho_i}{\partial \mathbf{x}}\right|_{\mathbf{x}_k}\!\!\cdot \delta\mathbf{x} + \delta b.
$$

The partial derivative is the geometric heart of the whole subject, so derive it rather than quote it. Let $\mathbf{u} = \mathbf{s}_i - \mathbf{x}$, so $\|\mathbf{s}_i - \mathbf{x}\| = (\mathbf{u}\cdot\mathbf{u})^{1/2}$. By the chain rule,

$$
\frac{\partial}{\partial \mathbf{x}}(\mathbf{u}\cdot\mathbf{u})^{1/2} = \frac{1}{2\|\mathbf{u}\|}\cdot 2\,\mathbf{u}\cdot\frac{\partial \mathbf{u}}{\partial \mathbf{x}} = \frac{\mathbf{u}}{\|\mathbf{u}\|}\cdot(-\mathbf{I}) = -\frac{\mathbf{s}_i - \mathbf{x}}{\|\mathbf{s}_i - \mathbf{x}\|} = -\mathbf{e}_i^{\mathsf T},
$$

since $\partial\mathbf{u}/\partial\mathbf{x} = -\mathbf{I}$ (moving the receiver moves $\mathbf{u}$ the opposite way) and $\mathbf{e}_i = (\mathbf{s}_i-\mathbf{x})/\|\mathbf{s}_i-\mathbf{x}\|$ is the unit line of sight from receiver to satellite, the same $\mathbf{e}_i$ the previous lesson used for the velocity solution. Moving the receiver one metre toward a satellite shortens the range to it by one metre — the minus sign is exactly that statement. The partial derivative with respect to $b$ is $1$, trivially, since $b$ enters additively. Stacking one row per satellite gives the **geometry matrix**

$$
\mathbf{G} = \begin{pmatrix} -\mathbf{e}_1^{\mathsf T} & 1 \\ -\mathbf{e}_2^{\mathsf T} & 1 \\ \vdots & \vdots \\ -\mathbf{e}_n^{\mathsf T} & 1 \end{pmatrix},
$$

an $n \times 4$ matrix built entirely from unit vectors and ones — no ranges, no noise, nothing but the directions from which the satellites are seen. Every property of the fix that geometry alone controls, including everything the next lesson derives about dilution of precision, comes from this matrix.

## The Sagnac correction, derived

The previous lesson deferred one term: the correction for Earth's rotation during the signal's transit, promised there and delivered here. ECEF coordinates of an Earth-fixed point do not depend on when you read them — the receiver's triplet $(x_r, y_r, z_r)$ is the same three numbers at transmission time $t_{tx}$ and at reception time $t_{rx} = t_{tx}+\tau$. But those same three numbers point at two different locations *in inertial space*, because the axes themselves have turned by $\omega_e\tau$ in between. Computing $\|\mathbf{s}_i - \mathbf{x}\|$ directly from the ephemeris position and the receiver's ECEF coordinates, with no further correction, silently uses the receiver's inertial location at $t_{tx}$ — before Earth carried it eastward — rather than at $t_{rx}$, when the signal actually arrived there.

Earth's rotation vector is $\boldsymbol\omega_e = \omega_e\hat{\mathbf{z}}$, and a point rigidly attached to the Earth moves, in inertial space, at velocity $\boldsymbol\omega_e \times \mathbf{x}_r$. Over the short transit time $\tau$ the receiver is carried by

$$
\delta\mathbf{x} = \tau\,\boldsymbol\omega_e \times \mathbf{x}_r = \omega_e\tau\,(-y_r,\ x_r,\ 0).
$$

Moving the receiver by $\delta\mathbf{x}$ changes the range to satellite $i$, to first order, by $-\mathbf{e}_i \cdot \delta\mathbf{x}$ — the same linearisation just derived, applied to a displacement of the receiver instead of the satellite. Carrying out the dot product,

$$
-\mathbf{e}_i\cdot\delta\mathbf{x} = -\frac{\omega_e\tau}{\rho_i}\Big[-y_r(x_{s,i}-x_r) + x_r(y_{s,i}-y_r)\Big] = \frac{\omega_e\tau}{\rho_i}\big(x_{s,i}\,y_r - y_{s,i}\,x_r\big),
$$

and substituting $\tau \approx \rho_i/c$ — the light time, correct to the same order this correction already works at — gives

$$
\Delta\rho_{\text{Sagnac},i} = \frac{\omega_e}{c}\,\big(x_{s,i}\,y_r - y_{s,i}\,x_r\big),
$$

exactly the closed form the pseudorange lesson quoted. For the four satellites used throughout this lesson (worked out below) it evaluates to $-10.0$, $-19.0$, $+20.3$ and $+14.8\,\mathrm{m}$ — comfortably inside the $\pm 30$ to $40\,\mathrm{m}$ bound already given. Because $\Delta\rho_{\text{Sagnac},i}$ is itself a function of the receiver position, it has its own partial derivatives — $\partial\Delta\rho_{\text{Sagnac},i}/\partial x_r = -\omega_e y_{s,i}/c$ and $\partial\Delta\rho_{\text{Sagnac},i}/\partial y_r = \omega_e x_{s,i}/c$ — but with $\omega_e/c \approx 2.4\times10^{-13}\,\mathrm{s/m}$ and satellite coordinates of order $10^7\,\mathrm{m}$, these are of order $10^{-6}$, against the geometric partials' order-one direction cosines. They are dropped from $\mathbf{G}$ without measurable effect on convergence; the correction itself, not its tiny slope, is what matters, and it is recomputed from the current position estimate every iteration rather than fixed once.

## Gauss-Newton: solving the linear step

Collect the $n \ge 4$ linearised equations into $\mathbf{G}\,\delta = \Delta\boldsymbol\rho$, where $\delta = (\delta\mathbf{x}, \delta b)$ is the update and $\Delta\rho_i = \tilde\rho_i - \hat\rho_i(\mathbf{x}_k, b_k)$ is the **prefit residual** — observed corrected pseudorange minus the range the current estimate predicts. With exactly four satellites this is a square linear system, solved directly. With more, it is overdetermined, and the sibling module on least squares derives what to do: the normal equations $\delta = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\Delta\boldsymbol\rho$, or, more robustly against a poorly conditioned $\mathbf{G}$, the equivalent solution by QR decomposition that module prefers. Either way, add $\delta$ to the current estimate, throw the linearisation away, and rebuild it at the new point: $\mathbf{G}$ depends on $\mathbf{x}_k$ through $\mathbf{e}_i$, so unlike an ordinary linear regression — where the design matrix is fixed once by the problem and never changes — $\mathbf{G}$ has to be recomputed every iteration. That outer loop of relinearise-solve-update is what turns a one-shot linear least-squares solve into an iterative nonlinear one.

Calling this "Newton iteration," as the GNSS literature does, is a slight looseness worth naming. True Newton's method for a least-squares cost also uses the second derivative of the range function; what is actually run here is Gauss–Newton, which keeps only the first derivative and treats the linearisation as exact at each step. The two agree here because the range function's curvature is minuscule at this scale: a satellite $20{,}000\,\mathrm{km}$ away looks locally flat over a position correction measured in kilometres, let alone the metres or millimetres of the later iterations. The convergence below shows what that buys.

::: key
The linearised pseudorange Jacobian row is $[-\mathbf{e}_i^{\mathsf T},\ 1]$, with $\mathbf{e}_i = (\mathbf{s}_i-\mathbf{x})/\|\mathbf{s}_i-\mathbf{x}\|$ evaluated at the current position estimate. Stack the rows into $\mathbf{G}$, solve $\mathbf{G}\,\delta = \Delta\boldsymbol\rho$ (directly if $n=4$, by least squares if $n>4$), update, and rebuild $\mathbf{G}$ at the new estimate — every iteration, because $\mathbf{e}_i$ moves with $\mathbf{x}$.
:::

## A four-satellite fix, converged to the nanometre

Reuse the four satellites from the previous lesson's example — Cape Canaveral, $(\text{az}, \text{el})$ of $(135^\circ,60^\circ)$, $(45^\circ,30^\circ)$, $(225^\circ,25^\circ)$ and $(315^\circ,45^\circ)$ at the GPS orbital radius — with a true clock bias of $b = 18{,}500\,\mathrm{m}$ ($61.7\,\mathrm{\mu s}$). The code below builds the corrected-pseudorange model with the Sagnac term included, generates noise-free pseudoranges from the true position, and iterates the Gauss-Newton step from the centre of the Earth:

```python
import numpy as np

C = 299792458.0
OMEGA_E = 7.292e-5

x_true = np.array([914936.61, -5526684.03, 3049186.55])    # Cape Canaveral, ECEF, m
sats = np.array([
    [11350562.41, -23441217.26, 5206502.33],    # az 135 deg, el 60 deg
    [15228615.04, -6538895.01, 20754896.68],    # az  45 deg, el 30 deg
    [-11200404.28, -23485162.13, -5332138.78],  # az 225 deg, el 25 deg
    [-8420060.43, -15461050.49, 19886983.18],   # az 315 deg, el 45 deg
])
b_true = 18500.0                                  # receiver clock bias, m


def model(sats, x, b):
    """Corrected pseudorange model: geometric range + Sagnac term + clock bias."""
    los = sats - x
    rng = np.linalg.norm(los, axis=1)
    sagnac = (OMEGA_E / C) * (sats[:, 0] * x[1] - sats[:, 1] * x[0])
    return rng + sagnac + b


rho = model(sats, x_true, b_true)                 # noise-free "observed" pseudoranges

x, b, steps = np.zeros(3), 0.0, []                # start from the centre of the Earth
for it in range(8):
    los = sats - x
    e = los / np.linalg.norm(los, axis=1)[:, None]    # unit line of sight, each row
    G = np.column_stack([-e, np.ones(len(sats))])      # Jacobian: row i = [-e_i^T, 1]
    drho = rho - model(sats, x, b)                      # prefit residual
    step, *_ = np.linalg.lstsq(G, drho, rcond=None)
    x, b = x + step[:3], b + step[3]
    steps.append(np.linalg.norm(step[:3]))
    if steps[-1] < 1e-4:
        break

print("|step| by iteration (m):", [f"{s:.3e}" for s in steps])
# |step| by iteration (m): ['7.680e+06', '1.260e+06', '4.191e+04', '4.731e+01', '2.444e-04', '3.800e-09']
print("position error (m):", np.linalg.norm(x - x_true))
# position error (m): 3.2927225399135964e-09
print("clock bias error (m):", b - b_true)
# clock bias error (m): -6.912159733474255e-10
print("final residual (m):", rho - model(sats, x, b))
# final residual (m): [ 0.0000000e+00 -3.7252903e-09  0.0000000e+00 -3.7252903e-09]
```

Six iterations, and the step sizes tell the story of Gauss-Newton convergence: $7.68\times10^6\,\mathrm{m}$, $1.26\times10^6\,\mathrm{m}$, $4.19\times10^4\,\mathrm{m}$, $47.3\,\mathrm{m}$, $2.44\times10^{-4}\,\mathrm{m}$, then $3.8\times10^{-9}\,\mathrm{m}$. Far from the answer, the linearisation is a rough guide and the steps shrink by only a factor of five or six each time; once the fourth iteration lands within $47\,\mathrm{m}$ — a whisper against a $20{,}000\,\mathrm{km}$ range — the local flatness the previous section relied on kicks in fully, and each further step's error is roughly the square of the last: quadratic convergence, the hallmark of Newton-type methods once they are close enough to trust the linearisation. Position error against the known truth is $3.3\,\mathrm{nm}$, clock bias error $0.7\,\mathrm{nm}$, and all four residuals sit at the $10^{-9}\,\mathrm{m}$ floor of double-precision arithmetic. That last fact is the previous lesson's warning made concrete: four measurements, four unknowns, zero residual — whether or not the fit is right. Here it happens to be right, because the data were noise-free by construction; the residual itself could not have told you that, and could not have told you if it were wrong.

## What redundancy buys: residuals from six satellites

Add two more satellites to the sky — $(10^\circ, 75^\circ)$, nearly overhead, and $(200^\circ, 15^\circ)$, low and on the opposite side — and give every pseudorange independent Gaussian noise with $\sigma = 3\,\mathrm{m}$, in the middle of the single-frequency budgets the pseudorange lesson worked out. Six measurements, four unknowns, two degrees of freedom of redundancy:

```python
sats6 = np.vstack([sats, [
    [4231690.58, -19962286.90, 17000985.17],    # az  10 deg, el 75 deg
    [-4355633.71, -22609494.10, -13239064.60],  # az 200 deg, el 15 deg
]])
rng = np.random.default_rng(37)
noise = rng.normal(0.0, 3.0, size=6)               # sigma = 3 m per satellite
rho_obs = model(sats6, x_true, b_true) + noise
print("injected noise (m):", np.round(noise, 3))
# injected noise (m): [ 2.7   -1.375 -3.942  1.976  2.866  1.574]

x, b = np.zeros(3), 0.0                             # same iteration, six rows now
for it in range(8):
    los = sats6 - x
    e = los / np.linalg.norm(los, axis=1)[:, None]
    G = np.column_stack([-e, np.ones(6)])
    step, *_ = np.linalg.lstsq(G, rho_obs - model(sats6, x, b), rcond=None)
    x, b = x + step[:3], b + step[3]
    if np.linalg.norm(step[:3]) < 1e-4:
        break

resid = rho_obs - model(sats6, x, b)
print("iterations:", it, "position error (m):", np.linalg.norm(x - x_true))
# iterations: 5 position error (m): 6.730806919440523
print("post-fit residuals (m):", np.round(resid, 3))
# post-fit residuals (m): [-0.029 -0.924 -3.476  1.516  0.184  2.729]
print("sum of squared residuals (m^2):", round(np.sum(resid**2), 3), " vs (n-p)*sigma^2 =", (6-4)*3.0**2)
# sum of squared residuals (m^2): 22.712  vs (n-p)*sigma^2 = 18.0
```

The fit converges in the same six iterations (the loop's zero-based counter prints five for the last completed pass) and lands $6.73\,\mathrm{m}$ from the true position — noise, not a coding error, since the injected pseudorange errors were themselves a few metres. The residuals are no longer zero: $-0.03$, $-0.92$, $-3.48$, $1.52$, $0.18$ and $2.73\,\mathrm{m}$, an RSS of $4.77\,\mathrm{m}$. This is what the previous lesson's warning was building toward — with redundancy, the fit can no longer absorb every measurement exactly, and what is left over is informative. The sibling module on least squares shows that for an unweighted linear fit with $n$ measurements and $p$ parameters, the expected sum of squared residuals is $(n-p)\sigma^2$; here that predicts $2 \times 3.0^2 = 18.0\,\mathrm{m}^2$ against this single draw's $22.7\,\mathrm{m}^2$ — a reasonable fluctuation, not a discrepancy, and confirmed by running the same fit $20{,}000$ times with fresh noise: the mean sum of squared residuals comes out to $18.20\,\mathrm{m}^2$, matching the prediction to within Monte Carlo sampling error. Over those same $20{,}000$ draws the root-mean-square position error is $6.98\,\mathrm{m}$, and $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ evaluated at the true position gives a factor of $2.3268$ on the position-coordinate rows, so $2.3268 \times 3.0\,\mathrm{m} = 6.98\,\mathrm{m}$ — exactly the Monte Carlo figure. That factor is dilution of precision, and $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ is precisely the parameter covariance the least-squares module derives for a unit-variance measurement, evaluated here with $\sigma=1$. The next lesson names it properly and puts it to work.

::: example The exactly determined case, revisited
With the four original satellites and no noise, the residual was zero regardless of anything — a fact about the arithmetic of a square system, not about accuracy. Inject the same $\sigma=3\,\mathrm{m}$ noise into those same four satellites and solve again: the residual is *still* zero, to machine precision, on every draw, because four equations in four unknowns has no freedom left to disagree with itself. Only the estimated position moves, silently absorbing every metre of noise with no residual to show for it. This is exactly why five and six satellites appeared earlier in this lesson: redundancy is not a luxury for better averaging, it is the only thing that makes a residual mean anything at all.
:::

::: example Breaking the sign on purpose
Flip the sign in the Jacobian — use $+\mathbf{e}_i^{\mathsf T}$ instead of $-\mathbf{e}_i^{\mathsf T}$ — and rerun the four-satellite case from the same centre-of-Earth start. The step sizes are $7.68\times10^6\,\mathrm{m}$, then $2.14\times10^7\,\mathrm{m}$, then $9.33\times10^7\,\mathrm{m}$, growing by roughly a factor of three each iteration instead of shrinking: the solver is confidently correcting every estimate in exactly the wrong direction. This is the cleanest evidence that the minus sign in $-\mathbf{e}_i^{\mathsf T}$ is not a bookkeeping nicety.
:::

::: warning
The Jacobian row is $-\mathbf{e}_i^{\mathsf T}$, not $+\mathbf{e}_i^{\mathsf T}$: moving the receiver toward a satellite, in the direction $+\mathbf{e}_i$, shortens that range, so the partial derivative of range with respect to position is negative. Get the sign wrong and the iteration does not fail quietly — it diverges, as the example above shows, because every step now moves the estimate further from the truth along every satellite's line of sight at once. A solver that explodes instead of converging almost always has this sign backwards, or an equivalent error in how the residual is formed ($\Delta\boldsymbol\rho = \tilde{\boldsymbol\rho} - \hat{\boldsymbol\rho}$, observed minus modelled, not the other way round).
:::

## Check yourself

::: check
State the Jacobian row for satellite $i$ and identify every symbol in it.
:::

::: answer
$[-\mathbf{e}_i^{\mathsf T},\ 1]$, where $\mathbf{e}_i = (\mathbf{s}_i - \mathbf{x})/\|\mathbf{s}_i - \mathbf{x}\|$ is the unit vector from the current receiver-position estimate $\mathbf{x}$ toward satellite position $\mathbf{s}_i$. The first three entries are minus that unit vector — the partial derivatives of range with respect to the three position coordinates — and the fourth entry is $1$, the partial derivative of range with respect to the clock bias $b$, which enters the pseudorange additively.
:::

::: check
Why must the geometry matrix $\mathbf{G}$ be rebuilt at every iteration, when an ordinary linear regression's design matrix is fixed once at the start?
:::

::: answer
Because $\mathbf{G}$'s entries are $-\mathbf{e}_i^{\mathsf T}$, and $\mathbf{e}_i$ is a function of the current position estimate $\mathbf{x}_k$, not of anything fixed in advance. An ordinary linear regression is linear in its unknowns from the outset, so its design matrix depends only on the (fixed) independent variables. The pseudorange equation is nonlinear in position — range is a square root of a quadratic — so linearising it produces a matrix that is only valid near the point it was linearised about, and has to be recomputed once that point moves.
:::

::: check
A satellite sits at ECEF $(2.10\times10^7,\ 1.50\times10^7,\ 0)\,\mathrm{m}$; a receiver estimate is at $(4.00\times10^6,\ -5.00\times10^6,\ 3.00\times10^6)\,\mathrm{m}$. Compute the Sagnac correction for this pair, in metres.
:::

::: answer
$\Delta\rho_{\text{Sagnac}} = (\omega_e/c)(x_s y_r - y_s x_r) = (7.292\times10^{-5}/299{,}792{,}458)\times\big(2.10\times10^7 \times(-5.00\times10^6) - 1.50\times10^7\times 4.00\times10^6\big) = -40.1\,\mathrm{m}$. The satellite's $z$-coordinate never enters the formula — the correction depends only on the equatorial ($x,y$) components of both positions, because it comes from a rotation about the polar axis.
:::

::: check
The four-satellite noise-free example converged to a residual of exactly zero; the six-satellite noisy example converged to a residual with an RSS of $4.77\,\mathrm{m}$. Does the nonzero residual mean the six-satellite fix is less trustworthy than the four-satellite one?
:::

::: answer
No — the opposite, if anything. The four-satellite residual is zero because four equations in four unknowns has no spare information to disagree with itself: it would be exactly zero even if the pseudoranges were wrong by kilometres, which is precisely the previous lesson's warning about exactly determined systems. The six-satellite fit has two redundant measurements, so a residual is possible, and its size — an RSS of $4.77\,\mathrm{m}$, consistent with $\sigma=3\,\mathrm{m}$ noise on six measurements — is actual evidence that the data are mutually consistent with the model. A checkable fit with a small residual is more trustworthy than an unforced-to-agree fit with no residual at all, not less.
:::

::: check
Once the iteration is within tens of metres of the answer, each further step's size is roughly the square of the previous step's size (relative to the problem's scale), rather than shrinking by a fixed factor. Why?
:::

::: answer
This is quadratic convergence, the signature of Newton-type methods near a solution. The linearisation error at each step is the part of the true (curved) range function that the first-order Taylor expansion misses, which is of second order in the distance to the true answer. Far from the answer that second-order term is not negligible, and convergence is only linear-ish; once the estimate is close, the second-order error is the square of an already-small quantity, so it shrinks far faster than the first-order term does. Concretely here: from $47\,\mathrm{m}$ to $2.4\times10^{-4}\,\mathrm{m}$ is a factor of about $2\times10^5$ in one step, far more than any fixed per-iteration ratio could produce.
:::

## Summary

| Item | Statement |
| --- | --- |
| Modelled pseudorange | $\hat\rho_i(\mathbf{x},b) = \|\mathbf{s}_i-\mathbf{x}\| + \Delta\rho_{\text{Sagnac},i}(\mathbf{x}) + b$ |
| Jacobian row | $[-\mathbf{e}_i^{\mathsf T},\ 1]$, $\mathbf{e}_i=(\mathbf{s}_i-\mathbf{x})/\|\mathbf{s}_i-\mathbf{x}\|$, rebuilt every iteration |
| Sagnac correction | $\Delta\rho_{\text{Sagnac},i} = (\omega_e/c)(x_{s,i}y_r - y_{s,i}x_r)$; derived from the receiver's inertial displacement $\boldsymbol\omega_e\times\mathbf{x}_r\,\tau$ during transit |
| Gauss-Newton step | $\mathbf{G}\,\delta = \Delta\boldsymbol\rho$ (direct if $n=4$, least squares if $n>4$); update and relinearise; converges quadratically once close |
| Four-satellite example | Noise-free, centre-of-Earth start: converges in 6 iterations, position and bias error $\sim10^{-9}\,\mathrm{m}$, residual exactly zero (exactly determined) |
| Six-satellite example | $\sigma=3\,\mathrm{m}$ noise: position error $6.73\,\mathrm{m}$ (single draw), residual RSS $4.77\,\mathrm{m}$; $E[\text{SSE}]=(n-p)\sigma^2=18.0\,\mathrm{m}^2$, Monte Carlo mean $18.20\,\mathrm{m}^2$ |
| Position error vs. residual | Residual measures self-consistency of redundant data; position error against truth is a separate quantity, related to measurement noise by a purely geometric factor |
| Sign check | Jacobian row is $-\mathbf{e}_i^{\mathsf T}$; the wrong sign diverges rather than converging slowly |

The $6.98\,\mathrm{m}$ root-mean-square position error above came from $3.0\,\mathrm{m}$ measurement noise times a factor of $2.3268$ that depended on nothing but where the six satellites were in the sky. The next lesson names that factor — dilution of precision — derives GDOP, PDOP, HDOP, VDOP and TDOP from the same matrix $\mathbf{G}$, and shows the same $3.0\,\mathrm{m}$ noise producing a very different position error under a poorly chosen constellation.
