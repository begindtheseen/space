---
id: l04-the-navigation-solution-by-least-squares
title: The navigation solution by least squares
minutes: 22
covers:
  - The navigation solution by iterative least squares / Newton iteration
---

Play a game of hot and cold with your eyes shut. Four friends stand around a field, and each one calls out how far away you are. You make a guess about where you stand. You work out how far each friend *should* be from that guess, and compare with what they actually called. The differences tell you which way to step, and roughly how far. You step, and do it again. After a few rounds the differences shrink to nothing, and you know where you are.

A GNSS receiver plays exactly this game, once a second or faster. The friends are satellites. The called-out distances are the corrected **pseudoranges** from the earlier lessons — measured distances that still carry the receiver's own clock error. And the "guess, compare, step, repeat" loop has a proper name: the **navigation solution by iterative least squares**, also called **Newton iteration**. It is the whole navigation job of a receiver. Everything else inside it — the tracking loops, the message decoder, the atmosphere models — exists to hand this loop clean pseudoranges.

The previous two lessons built every piece and set none of them moving. The clock bias was admitted as a fourth unknown. The row $[-\mathbf{e}_i^{\mathsf T},\ 1]$ was written down but never used. This lesson runs the loop. Along the way it builds one object, the **geometry matrix** $\mathbf{G}$, that the rest of the module keeps coming back to — the next lesson turns it straight into dilution of precision.

There is also a way to skip the loop. **[[Bancroft's method|bancroft]]** (1985) rewrites the four pseudorange equations as one quadratic and solves it with algebra, no guessing. It is worth knowing it exists, because it hands a receiver a good first guess when it has none. But every working receiver still iterates for its second-by-second fix, for three reasons you will see here. The loop works unchanged for any number of satellites. It works unchanged when some measurements are trusted more than others. And it builds $\mathbf{G}$ along the way.

## Turning a curve into a straight line

The trouble is the square root. The distance from a receiver at $\mathbf{x}$ to a satellite at $\mathbf{s}_i$ is $\|\mathbf{s}_i - \mathbf{x}\|$ (read "the length of s i minus x"). Working out a length means squaring the three differences, adding them and taking a square root. So the unknown position sits *inside* a square root, and there is no single step that solves for it.

Here is the trick. Stand on a football field and the ground looks flat, even though the Earth is round. Any smooth curve looks like a straight line if you zoom in close enough. So near your current guess, pretend the range is a straight-line function of position. Solve that easy straight-line problem. Move to the answer, and zoom in again there. This is called **[[linearizing|linearize]]** — swapping a curve for its straight-line stand-in near one point.

Write the modelled pseudorange to satellite $i$ — atmosphere and satellite clock already removed, as in the pseudorange lesson — as a function of the four unknowns:

$$
\hat\rho_i(\mathbf{x}, b) = \|\mathbf{s}_i - \mathbf{x}\| + \Delta\rho_{\text{Sagnac},i}(\mathbf{x}) + b .
$$

Read $\hat\rho_i$ as "rho hat i": the hat marks a value *predicted* from the model, not measured. It is the geometric range, plus a small correction for Earth's rotation (the next section derives it), plus the clock bias $b$ in metres. Now take the current guess $(\mathbf{x}_k, b_k)$ — the subscript $k$ counts the rounds — and ask how the prediction changes if you nudge position by $\delta\mathbf{x}$ and the clock by $\delta b$ (read "delta x", a small change). To first order, which is the straight-line approximation,

$$
\hat\rho_i(\mathbf{x}_k + \delta\mathbf{x},\, b_k + \delta b) \approx \hat\rho_i(\mathbf{x}_k, b_k) + \left.\frac{\partial \hat\rho_i}{\partial \mathbf{x}}\right|_{\mathbf{x}_k}\!\!\cdot \delta\mathbf{x} + \delta b .
$$

The symbol $\partial \hat\rho_i / \partial \mathbf{x}$ is a **partial derivative**: how fast the range changes as you move the receiver in each of the three directions, with everything else held still. The bar with $\mathbf{x}_k$ says "worked out at the current guess". The clock bias enters by plain addition, so its partial derivative is exactly $1$.

### The derivative that matters most

The position derivative is the heart of the whole subject, so here it is in words first. Picture a string from you to the satellite. Take one step along the string, toward the satellite. The string gets one step shorter. Take one step sideways, at right angles to the string, and its length hardly changes. So the range responds only to the part of your motion *along* the line of sight, and it shrinks when you move toward the satellite.

Put that into symbols with the **unit line of sight**

$$
\mathbf{e}_i = \frac{\mathbf{s}_i - \mathbf{x}}{\|\mathbf{s}_i - \mathbf{x}\|},
$$

an arrow of length one pointing from the receiver to satellite $i$ — the same $\mathbf{e}_i$ the previous lesson used for the velocity solution. The rate of change of range with position is minus that arrow:

$$
\frac{\partial \|\mathbf{s}_i - \mathbf{x}\|}{\partial \mathbf{x}} = -\mathbf{e}_i^{\mathsf T}.
$$

The $\mathsf T$ (read "transpose") lays the arrow down as a row, so it can sit in a matrix row. The minus sign is the string getting shorter.

::: note Why it has to be true
Let $\mathbf{u} = \mathbf{s}_i - \mathbf{x}$, so the range is $\|\mathbf{u}\| = (\mathbf{u}\cdot\mathbf{u})^{1/2}$. The **[[chain rule|chain-rule]]** says: differentiate the outside (the square root), then multiply by the derivative of the inside. The derivative of $w^{1/2}$ is $\tfrac{1}{2}w^{-1/2}$, and the derivative of $\mathbf{u}\cdot\mathbf{u}$ is $2\mathbf{u}$ times the derivative of $\mathbf{u}$. Moving the receiver by $\delta\mathbf{x}$ changes $\mathbf{u}$ by $-\delta\mathbf{x}$, so $\partial\mathbf{u}/\partial\mathbf{x} = -\mathbf{I}$, minus the identity matrix. Putting it together:

$$
\frac{\partial}{\partial \mathbf{x}}(\mathbf{u}\cdot\mathbf{u})^{1/2} = \frac{1}{2\|\mathbf{u}\|}\cdot 2\,\mathbf{u}^{\mathsf T}\frac{\partial \mathbf{u}}{\partial \mathbf{x}} = \frac{\mathbf{u}^{\mathsf T}}{\|\mathbf{u}\|}(-\mathbf{I}) = -\frac{(\mathbf{s}_i - \mathbf{x})^{\mathsf T}}{\|\mathbf{s}_i - \mathbf{x}\|} = -\mathbf{e}_i^{\mathsf T}.
$$

The two $2$s cancel, $\mathbf{u}/\|\mathbf{u}\|$ is a unit arrow, and the $-\mathbf{I}$ supplies the minus sign.
:::

Each satellite gives one row: minus its line of sight, then a $1$ for the clock. Stack one row per satellite and you have the geometry matrix:

$$
\mathbf{G} = \begin{pmatrix} -\mathbf{e}_1^{\mathsf T} & 1 \\ -\mathbf{e}_2^{\mathsf T} & 1 \\ \vdots & \vdots \\ -\mathbf{e}_n^{\mathsf T} & 1 \end{pmatrix}.
$$

It has $n$ rows (one per satellite) and $4$ columns ($x$, $y$, $z$, clock). Look at what is in it: unit arrows and ones. No ranges, no noise — nothing but the directions from which the satellites are seen. That is why everything geometry alone controls about the fix, including all of the next lesson, comes out of this matrix.

::: key
Pseudorange measurement **[[Jacobian|jacobian-name]]**: row $i$ is $[-\mathbf{e}_i^{\mathsf T},\ 1]$, with $\mathbf{e}_i = (\mathbf{s}_i-\mathbf{x})/\|\mathbf{s}_i-\mathbf{x}\|$ the unit line of sight from the receiver to satellite $i$, worked out at the current position estimate. Stacking the rows gives the geometry matrix $\mathbf{G}$.
:::

## The Earth turns while the signal flies

Throw a ball to a friend on a spinning merry-go-round. By the time the ball gets there, your friend has moved on a little. You have to aim at where they *will* be, not where they are.

A GNSS signal takes about $0.07\,\mathrm{s}$ to fall from the satellite to the ground. During that time the Earth turns, and it carries the receiver eastward. The receiver's position is written in **ECEF** coordinates — Earth-centered, Earth-fixed axes that spin with the planet. Those three numbers stay the same while the Earth turns, but the axes themselves have rotated. So the same three numbers point to two different places in non-spinning space: one when the signal left the satellite, and one when it arrived. Computing $\|\mathbf{s}_i - \mathbf{x}\|$ straight from the satellite's position and the receiver's ECEF coordinates quietly uses the receiver's *old* place. The fix is the **[[Sagnac correction|sagnac]]**, promised in the previous lesson and derived here.

Earth spins about its polar axis at $\omega_e = 7.292\times10^{-5}\,\mathrm{rad/s}$ (read "omega e"). A point stuck to the Earth at $\mathbf{x}_r = (x_r, y_r, z_r)$ moves at velocity $\boldsymbol\omega_e \times \mathbf{x}_r$. Over the travel time $\tau$ (read "tau") the receiver is carried by

$$
\delta\mathbf{x} = \tau\,\boldsymbol\omega_e \times \mathbf{x}_r = \omega_e\tau\,(-y_r,\ x_r,\ 0).
$$

We already know what a small move of the receiver does to the range: it changes by $-\mathbf{e}_i \cdot \delta\mathbf{x}$, the string rule from above. Write out the dot product, with $\rho_i$ the range and $(x_{s,i}, y_{s,i})$ the satellite's first two coordinates:

$$
-\mathbf{e}_i\cdot\delta\mathbf{x} = -\frac{\omega_e\tau}{\rho_i}\Big[-y_r(x_{s,i}-x_r) + x_r(y_{s,i}-y_r)\Big] = \frac{\omega_e\tau}{\rho_i}\big(x_{s,i}\,y_r - y_{s,i}\,x_r\big).
$$

Inside the bracket, the $x_r y_r$ terms cancel. Last, the travel time is the range divided by the speed of light, $\tau \approx \rho_i / c$. The $\rho_i$ cancels too, and what is left is short:

$$
\Delta\rho_{\text{Sagnac},i} = \frac{\omega_e}{c}\,\big(x_{s,i}\,y_r - y_{s,i}\,x_r\big).
$$

That is the closed form the pseudorange lesson quoted. The $z$ coordinates never appear, because the spin is about the $z$ axis. For the four satellites used below it comes to $-10.0$, $-19.0$, $+20.3$ and $+14.8\,\mathrm{m}$ — inside the $\pm 30$ to $40\,\mathrm{m}$ bound the pseudorange lesson gave. Tens of metres is far too big to ignore.

Should the correction have its own entries in $\mathbf{G}$? It depends on position, so strictly yes. But its slopes are tiny. The factor $\omega_e/c$ is about $2.4\times10^{-13}$ per meter, and satellite coordinates are about $10^7\,\mathrm{m}$, so the slopes are around $10^{-6}$. The geometric slopes are about $1$. They are dropped from $\mathbf{G}$ with no measurable effect. The correction itself is recomputed from the new position every round.

## One step of the loop

Now line the equations up. For each satellite, the **prefit residual** $\Delta\rho_i = \tilde\rho_i - \hat\rho_i(\mathbf{x}_k, b_k)$ is what you measured ($\tilde\rho_i$, read "rho tilde i") minus what your guess predicts. The linearized model says that residual should be explained by the correction $\delta = (\delta\mathbf{x}, \delta b)$:

$$
\mathbf{G}\,\delta = \Delta\boldsymbol\rho .
$$

With exactly four satellites this is four equations in four unknowns, solved directly. With more, there are more equations than unknowns, and they cannot all be met at once. Then you pick the $\delta$ that makes the leftover mismatches as small as possible in the **least-squares** sense — smallest sum of squares. The sibling module on least squares derives the answer, the **normal equations**:

$$
\delta = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\Delta\boldsymbol\rho .
$$

In practice a QR decomposition gives the same answer more safely when $\mathbf{G}$ is badly shaped; that module prefers it. Either way, add $\delta$ to the guess. Then throw the straight line away and build a new one at the new point.

That last step is what makes this different from an ordinary straight-line fit. In an ordinary fit, the matrix is fixed once by the problem and never changes. Here $\mathbf{G}$ is built from the arrows $\mathbf{e}_i$, and the arrows depend on where you think you are. Move the guess and the arrows swing, so $\mathbf{G}$ must be rebuilt every round. The outer loop — relinearize, solve, update — turns a one-shot linear solve into an iterative nonlinear one.

The GNSS books call this "Newton iteration", which is a small looseness worth naming. Newton's method proper would also use the curve's *bend* (its second derivative). What runs here keeps only the slope, and is called **[[Gauss–Newton|gauss-newton]]**. The two behave the same here because the range curve bends so little. From $20{,}000\,\mathrm{km}$ away, a satellite's range looks flat over a correction of kilometres, let alone metres.

::: key
Solve $\mathbf{G}\,\delta = \Delta\boldsymbol\rho$ — directly if $n=4$, by least squares if $n>4$ — add $\delta$ to the estimate, and rebuild $\mathbf{G}$ at the new estimate every iteration, because $\mathbf{e}_i$ moves with $\mathbf{x}$.
:::

## A four-satellite fix, converged to the nanometer

Here is the loop on real numbers. The receiver is at Cape Canaveral. The four satellites are the previous lesson's, at azimuth and elevation $(135^\circ,60^\circ)$, $(45^\circ,30^\circ)$, $(225^\circ,25^\circ)$ and $(315^\circ,45^\circ)$, all at the GPS orbit radius. (**Azimuth** is the compass direction; **elevation** is the angle above the horizon.) The true clock bias is $b = 18{,}500\,\mathrm{m}$, which is $61.7\,\mathrm{\mu s}$ of clock error times the speed of light.

The code below builds the pseudorange model with the Sagnac term, makes noise-free "measured" pseudoranges from the true position, and runs the loop starting from the center of the Earth — the worst possible guess. It holds each satellite's position fixed. A real receiver first works out where each satellite was when *it* transmitted, $t_{tx} = t_{rx} - \rho/c$, because a satellite moves about $270\,\mathrm{m}$ along its orbit during the signal's flight. That is done once, from the broadcast orbit, before the loop begins.

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

Six rounds. Read the step sizes as a story: $7.68\times10^6\,\mathrm{m}$, then $1.26\times10^6$, then $4.19\times10^4$, then $47.3$, then $2.44\times10^{-4}$, then $3.8\times10^{-9}\,\mathrm{m}$. At first the guess is thousands of kilometres off, the straight line is a rough guide, and the step shrinks by only about six times. Once the fourth round lands within $47\,\mathrm{m}$ — a whisper against a $20{,}000\,\mathrm{km}$ range — the flat-ground picture is nearly exact. From then on each step's size is roughly the *square* of the last one, measured against the size of the problem. That is **[[quadratic convergence|quadratic-convergence]]**, the mark of Newton-type methods once they are close. From $47\,\mathrm{m}$ to $0.00024\,\mathrm{m}$ is a jump of about two hundred thousand times in one round.

The final position is $3.3$ nanometers from the truth, and the clock is $0.7$ nanometers off. All four residuals sit at about $10^{-9}\,\mathrm{m}$, which is as small as double-precision arithmetic can resolve at this size. Now remember the previous lesson's warning: four measurements, four unknowns, zero residual — *whether or not the fix is right*. Here it is right, because the data were noise-free by construction. The residual could not have told you that. It could not have told you if the fix were wrong, either.

## What redundancy buys: six satellites and some noise

Add two more satellites: one nearly overhead at $(10^\circ, 75^\circ)$, and one low on the other side of the sky at $(200^\circ, 15^\circ)$. Give every pseudorange its own random error, drawn from a bell curve with standard deviation $\sigma = 3\,\mathrm{m}$ (read "sigma"). That is in the middle of the single-frequency error budgets from the pseudorange lesson. Now there are six measurements for four unknowns: two spare, or two **degrees of freedom**.

```python
import numpy as np

C, OMEGA_E = 299792458.0, 7.292e-5
x_true = np.array([914936.61, -5526684.03, 3049186.55])
b_true = 18500.0
sats = np.array([
    [11350562.41, -23441217.26, 5206502.33],
    [15228615.04, -6538895.01, 20754896.68],
    [-11200404.28, -23485162.13, -5332138.78],
    [-8420060.43, -15461050.49, 19886983.18],
])


def model(sats, x, b):
    los = sats - x
    rng_ = np.linalg.norm(los, axis=1)
    sagnac = (OMEGA_E / C) * (sats[:, 0] * x[1] - sats[:, 1] * x[0])
    return rng_ + sagnac + b


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

It converges in the same six rounds. (The loop counter starts at zero, so it prints $5$ for the sixth pass.) The fix lands $6.73\,\mathrm{m}$ from the truth. That is the noise, not a bug: the pseudoranges themselves were off by a few meters.

The **post-fit residuals** — measured minus predicted, *after* the fit — are no longer zero: $-0.03$, $-0.92$, $-3.48$, $1.52$, $0.18$ and $2.73\,\mathrm{m}$. Their root-sum-square is $4.77\,\mathrm{m}$. With spare measurements, the fit can no longer bend to match every one exactly, and what is left over carries information.

How big should the leftovers be? The least-squares module shows that for $n$ measurements, $p$ unknowns and noise $\sigma$, the expected sum of squared residuals is $(n-p)\sigma^2$. Here that is $2 \times 3.0^2 = 18.0\,\mathrm{m}^2$. This one draw gave $22.7\,\mathrm{m}^2$. Is that suspicious? Run the same fit $20{,}000$ times with fresh noise — a **[[Monte Carlo|monte-carlo]]** run — and the average comes out at $18.20\,\mathrm{m}^2$. So $22.7$ is an ordinary fluctuation, and the formula holds.

The same $20{,}000$ runs give a root-mean-square position error of $6.98\,\mathrm{m}$. Now compute the matrix $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ at the true position, add its three position entries on the diagonal, and take the square root: you get $2.3268$. Multiply by the noise: $2.3268 \times 3.0\,\mathrm{m} = 6.98\,\mathrm{m}$ — the Monte Carlo figure exactly. That factor depended on nothing but where the six satellites sat in the sky. It is **dilution of precision**, and the next lesson names it properly.

::: example The exactly determined case, revisited
Go back to the four original satellites and add the same $\sigma = 3\,\mathrm{m}$ noise. Solve again. The residual is *still* zero, to machine precision, on every draw you try. Four equations in four unknowns leave no room to disagree with themselves. The position moves instead: it silently soaks up every meter of noise, and no residual shows it.

So the residual only means something when there are spare satellites. Redundancy is not a luxury for better averaging. It is the only thing that lets the fix [[check itself|redundancy-test]] at all.
:::

::: example Breaking the sign on purpose
Flip the sign in the Jacobian — use $+\mathbf{e}_i^{\mathsf T}$ instead of $-\mathbf{e}_i^{\mathsf T}$ — and rerun the four-satellite case from the same center-of-Earth start.

The first step has the same size, $7.68\times10^6\,\mathrm{m}$, but points the opposite way. Then the steps are $2.14\times10^7\,\mathrm{m}$ and $9.33\times10^7\,\mathrm{m}$. Each is about three times the last. Instead of shrinking, the steps grow: the solver confidently corrects in exactly the wrong direction every time, and after three rounds the "position" is about $93{,}000\,\mathrm{km}$ out — a quarter of the way to the Moon.

This is the cleanest evidence that the minus sign in $-\mathbf{e}_i^{\mathsf T}$ is physics, not bookkeeping.
:::

::: warning
The Jacobian row is $-\mathbf{e}_i^{\mathsf T}$, not $+\mathbf{e}_i^{\mathsf T}$. Moving the receiver toward a satellite, in the direction $+\mathbf{e}_i$, *shortens* that range, so the slope is negative. Get it wrong and the loop does not fail quietly — it blows up, as the example shows. If your solver explodes instead of converging, check this sign first. Then check the residual: it is $\Delta\boldsymbol\rho = \tilde{\boldsymbol\rho} - \hat{\boldsymbol\rho}$, observed minus modelled, not the other way round. Swapping that has the same effect.
:::

## Check yourself

::: check
Write the Jacobian row for satellite $i$ and say what every symbol in it means.
:::

::: answer
The row is $[-\mathbf{e}_i^{\mathsf T},\ 1]$. Here $\mathbf{e}_i = (\mathbf{s}_i - \mathbf{x})/\|\mathbf{s}_i - \mathbf{x}\|$ is the unit arrow from the current receiver-position estimate $\mathbf{x}$ toward satellite position $\mathbf{s}_i$. The first three entries, minus that arrow, are the partial derivatives of range with respect to the three position coordinates. The fourth entry, $1$, is the partial derivative with respect to the clock bias $b$ (in meters), which is added straight onto every pseudorange.
:::

::: check
Why must $\mathbf{G}$ be rebuilt every iteration, when an ordinary straight-line fit keeps its matrix fixed?
:::

::: answer
Because the entries of $\mathbf{G}$ are the arrows $-\mathbf{e}_i^{\mathsf T}$, and each arrow points from the *current guess* to the satellite. Move the guess and the arrows swing. An ordinary straight-line fit is linear in its unknowns from the start, so its matrix depends only on fixed inputs. The pseudorange is not linear in position — range is a square root of a sum of squares — so the straight-line stand-in is only good near the point where it was built, and must be rebuilt once that point moves.
:::

::: check
A satellite is at ECEF $(2.10\times10^7,\ 1.50\times10^7,\ 0)\,\mathrm{m}$ and a receiver estimate at $(4.00\times10^6,\ -5.00\times10^6,\ 3.00\times10^6)\,\mathrm{m}$. Compute the Sagnac correction.
:::

::: answer
Use $\Delta\rho_{\text{Sagnac}} = (\omega_e/c)(x_s y_r - y_s x_r)$.

The bracket: $x_s y_r = 2.10\times10^7 \times (-5.00\times10^6) = -1.05\times10^{14}$, and $y_s x_r = 1.50\times10^7 \times 4.00\times10^6 = 6.00\times10^{13}$. So $x_s y_r - y_s x_r = -1.65\times10^{14}\,\mathrm{m^2}$.

The factor: $\omega_e / c = 7.292\times10^{-5} / 299{,}792{,}458 = 2.432\times10^{-13}$ per meter (radians per second divided by meters per second).

Multiply: $2.432\times10^{-13} \times (-1.65\times10^{14}) = -40.1\,\mathrm{m}$.

The satellite's $z$ never enters. The correction comes from a spin about the polar axis, so only the equatorial ($x$, $y$) parts of the two positions matter.
:::

::: check
The noise-free four-satellite fix ended with a residual of exactly zero. The noisy six-satellite fix ended with a residual whose root-sum-square is $4.77\,\mathrm{m}$. Is the six-satellite fix less trustworthy?
:::

::: answer
No — if anything, the opposite. The four-satellite residual is zero because four equations in four unknowns have no spare information to disagree with. It would be zero even if every pseudorange were wrong by kilometers. The six-satellite fit has two spare measurements, so a residual *can* appear. Its size, $4.77\,\mathrm{m}$ — about what $\sigma = 3\,\mathrm{m}$ noise on six measurements should leave — is real evidence that the data agree with the model. A fit that could have disagreed and mostly did not is more trustworthy than one that was never able to disagree.
:::

::: check
Once the loop is within tens of meters, each step is roughly the square of the one before (relative to the size of the problem) instead of shrinking by a fixed factor. Why?
:::

::: answer
The error in each step comes from what the straight-line stand-in misses: the curve's bend. How much a curve bends away from its tangent line grows with the *square* of the distance you move. Far from the answer that error is large, and progress is slow. Close to the answer, the error is the square of a small number, which is much smaller still. Here that took the step from $47\,\mathrm{m}$ to $2.4\times10^{-4}\,\mathrm{m}$ — a factor of about $2\times10^5$ in one round, far more than any fixed shrink factor could give. This is quadratic convergence.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Modelled pseudorange | $\hat\rho_i(\mathbf{x},b) = \|\mathbf{s}_i-\mathbf{x}\| + \Delta\rho_{\text{Sagnac},i}(\mathbf{x}) + b$ |
| Jacobian row | $[-\mathbf{e}_i^{\mathsf T},\ 1]$, $\mathbf{e}_i=(\mathbf{s}_i-\mathbf{x})/\|\mathbf{s}_i-\mathbf{x}\|$; stack the rows to get $\mathbf{G}$, rebuilt every iteration |
| Sagnac correction | $\Delta\rho_{\text{Sagnac},i} = (\omega_e/c)(x_{s,i}y_r - y_{s,i}x_r)$, from the receiver riding the Earth's spin during the signal's flight |
| Gauss–Newton step | $\mathbf{G}\,\delta = \Delta\boldsymbol\rho$: direct if $n=4$, least squares if $n>4$; update, relinearize, repeat; quadratic convergence once close |
| Four satellites, no noise | 6 iterations from Earth's center; errors about $10^{-9}\,\mathrm{m}$; residual zero because the system is exactly determined |
| Six satellites, $\sigma=3\,\mathrm{m}$ | position error $6.73\,\mathrm{m}$ (one draw); residual root-sum-square $4.77\,\mathrm{m}$; expected sum of squares $(n-p)\sigma^2=18.0\,\mathrm{m}^2$, Monte Carlo $18.20\,\mathrm{m}^2$ |
| Residual versus error | the residual tests whether spare data agree; the position error is a separate thing, set by noise times a geometry factor |
| Sign check | $-\mathbf{e}_i^{\mathsf T}$; the wrong sign diverges instead of converging |

The $6.98\,\mathrm{m}$ position error came from $3.0\,\mathrm{m}$ of noise times $2.3268$, a number set only by where the satellites were. The next lesson names that number — dilution of precision — splits it into GDOP, PDOP, HDOP, VDOP and TDOP, and shows the same noise giving a far worse fix under a badly placed set of satellites.

::: context bancroft A way to skip the guessing
In 1985 Stephen Bancroft published an exact, no-iteration answer to the four-satellite problem. He squared the pseudorange equations, which turns them into equations where position and clock bias appear together in a clever four-number "distance" that mixes space and time, a bit like the space-time of relativity. The result is one quadratic equation — the kind you solve with the quadratic formula — with two possible answers. One of them usually lies far from Earth's surface and is easy to throw away.

Receivers use it for a cold start, when they have no idea where they are. After that, the iterative loop takes over.
:::

::: context linearize Zoom in and every curve goes straight
Near any one point, a smooth curve is almost the same as its **tangent line**, the straight line that just touches it there. Linearizing means solving the easy straight-line problem instead of the curved one, then moving and doing it again.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M20,180 Q200,20 340,120" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="30" y1="115" x2="350" y2="55" stroke="#f2b880" stroke-width="3"/>
  <circle cx="190" cy="85" r="5" fill="#b4232c"/>
  <text x="190" y="110" font-size="12" fill="#b4232c" text-anchor="middle">current guess</text>
  <text x="60" y="160" font-size="12" fill="#1d6fd1">true curve</text>
  <text x="250" y="45" font-size="12" fill="#1f2a44">straight-line stand-in</text>
</svg>
```

Close to the red dot the orange line and the blue curve are almost the same. Far from it they part company — which is why the loop has to rebuild the line each time it moves.
:::

::: context chain-rule Outside, then inside
The **chain rule** is how you differentiate a function inside another function. Suppose $y = \sqrt{w}$ and $w$ itself depends on $x$. Then the rate at which $y$ changes with $x$ is (how fast $y$ changes with $w$) times (how fast $w$ changes with $x$).

Think of gears: if gear A turns gear B twice as fast, and B turns C three times as fast, then A turns C six times as fast. Rates along a chain multiply. The range is a square root (outer gear) of a sum of squares (middle gear) of position differences (inner gear), so its slope is three factors multiplied together.
:::

::: context jacobian-name Named for Carl Jacobi
A **Jacobian** is the table of every partial derivative of several outputs with respect to several inputs: one row per output, one column per input. It is named for the German mathematician Carl Gustav Jacob Jacobi (1804–1851), who studied these arrays of derivatives and their determinants. Here the outputs are the pseudoranges and the inputs are $x$, $y$, $z$ and $b$, so the Jacobian is the $n\times4$ matrix $\mathbf{G}$.

You will meet the same word in the Kalman filter, where the measurement Jacobian is called $\mathbf{H}$. For GNSS, $\mathbf{H}$ and $\mathbf{G}$ are the same rows.
:::

::: context sagnac The receiver moves while the signal flies
Seen from space, the signal (red) left the satellite aimed at where the receiver would be, not where it was. In the $0.07\,\mathrm{s}$ of flight, Earth's spin carried the receiver from A to B — about $30\,\mathrm{m}$ at Cape Canaveral, drawn much larger here.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="250" r="150" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="126" cy="110" r="6" fill="#6c7a93"/>
  <text x="112" y="96" font-size="12" fill="#6c7a93" text-anchor="end">A: when sent</text>
  <circle cx="215" cy="104" r="6" fill="#1f2a44"/>
  <text x="228" y="96" font-size="12" fill="#1f2a44">B: when received</text>
  <path d="M136,104 Q170,92 203,100" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="207,101 197,95 198,106" fill="#1f2a44"/>
  <text x="170" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">Earth turns east</text>
  <rect x="60" y="14" width="22" height="12" fill="#f2b880" stroke="#1f2a44"/>
  <text x="94" y="25" font-size="12" fill="#1f2a44">satellite</text>
  <line x1="71" y1="26" x2="211" y2="98" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
</svg>
```

The effect is named for the French physicist Georges Sagnac, who in 1913 showed that light sent both ways around a spinning loop takes different times. Ring-laser and fiber-optic gyros use the same effect to measure rotation.
:::

::: context gauss-newton How a lost dwarf planet was found
In January 1801 the astronomer Giuseppe Piazzi spotted a new object, Ceres, then lost it behind the Sun after only a few weeks of sightings. The young Carl Friedrich Gauss fitted an orbit to those few, noisy observations using the method of least squares he had worked out, and predicted where Ceres would reappear. At the very end of 1801 astronomers pointed their telescopes there and found it.

The GNSS fix is the same problem in miniature: a nonlinear model, more observations than you would like to trust singly, and a best fit found by linearizing and repeating. Gauss–Newton carries his name for that reason.
:::

::: context quadratic-convergence Counting the zeros
Plot each step's size on a scale where every mark is ten times smaller than the last. The bars barely shrink at first, then fall off a cliff: once the loop is close, each step roughly doubles the number of correct digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="80" x2="350" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="10" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="14" font-size="11" fill="#1f2a44" text-anchor="end">10 000 km</text>
  <text x="44" y="84" font-size="11" fill="#1f2a44" text-anchor="end">1 m</text>
  <text x="44" y="174" font-size="11" fill="#1f2a44" text-anchor="end">1 nm</text>
  <line x1="47" y1="10" x2="53" y2="10" stroke="#1f2a44"/>
  <line x1="47" y1="170" x2="53" y2="170" stroke="#1f2a44"/>
  <rect x="65" y="11.1" width="30" height="68.9" fill="#1d6fd1"/>
  <rect x="113" y="19" width="30" height="61" fill="#1d6fd1"/>
  <rect x="161" y="33.8" width="30" height="46.2" fill="#1d6fd1"/>
  <rect x="209" y="63.3" width="30" height="16.7" fill="#1d6fd1"/>
  <rect x="257" y="80" width="30" height="36.1" fill="#b4232c"/>
  <rect x="305" y="80" width="30" height="84.2" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="192">1</text><text x="128" y="192">2</text><text x="176" y="192">3</text>
    <text x="224" y="192">4</text><text x="272" y="192">5</text><text x="320" y="192">6</text>
  </g>
</svg>
```

Blue bars are steps longer than a meter; red bars are steps shorter than a meter, drawn downward. The numbers along the bottom count the rounds.
:::

::: context monte-carlo Checking a formula by rolling dice
A **Monte Carlo** run answers "what happens on average?" by simply trying it many times with random inputs and averaging the results. It was named in the 1940s by scientists at Los Alamos after the famous casino in Monaco, because it runs on chance.

Engineers use it as an independent check on formulas like $(n-p)\sigma^2$. If a formula and $20{,}000$ random trials agree, you trust both. If they disagree, one of them — often the formula's assumptions — is wrong. A launch vehicle's navigation design is signed off with Monte Carlo runs of thousands of simulated flights.
:::

::: context redundancy-test Where the residual goes next
The sum of squared residuals divided by $\sigma^2$ has a known spread when nothing is wrong: it follows the **chi-square** distribution with $n - 4$ degrees of freedom. If one satellite is feeding in a bad measurement, the sum jumps far above that spread.

That is the idea behind **RAIM**, receiver autonomous integrity monitoring, in the integrity lesson later in this module. With five satellites a receiver can *detect* that something is wrong; with six it can often work out *which* satellite it is. Both rely on exactly the spare measurements this lesson introduced.
:::
