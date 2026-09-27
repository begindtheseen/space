---
id: l02-continuous-discrete-and-iterated-ekf
title: The continuous-discrete EKF and the iterated EKF
minutes: 18
covers:
  - Continuous-discrete EKF and the iterated EKF
---

Think of a friend throwing a ball in a dark gym while a camera flash goes off once a second. You only *see* the ball at each flash. But between flashes the ball does not teleport. It flies a smooth arc, pulled by gravity at every instant. If you want to guess where it will be at the next flash, you have to follow that arc, not draw one straight jump from flash to flash.

The last lesson wrote the EKF's predict step as one jump, $\hat{\mathbf x}_k^-=\mathbf f(\hat{\mathbf x}_{k-1}^+,\mathbf u_{k-1})$. That is fine when the motion has a neat formula for "where you are after $\Delta t$", as a constant-velocity target does. Almost nothing else in guidance and navigation is that convenient. An orbit bends under gravity between GPS fixes. A spacecraft turns smoothly between star-tracker frames. A landing vehicle slows under drag and thrust between radar pings. The filter still only *updates* at the flashes, but between them the state follows a **differential equation** — a rule for how fast things change at each instant. Handling that properly is the **continuous-discrete EKF**: continuous motion, discrete readings.

This lesson makes one EKF cycle work harder in two ways. First, it follows the smooth arc between readings instead of one frozen jump. Second, the **iterated EKF** squeezes more out of a single reading by re-aiming its straight-line approximation several times. Both ideas come back by name later in this module.

## Between the readings: continuous-discrete propagation

Write the motion in continuous time:

$$
\dot{\mathbf x}(t) = \mathbf f(\mathbf x(t),t) + \mathbf w(t).
$$

Read $\dot{\mathbf x}$ as "x dot", the rate of change of the state. Here $\mathbf w(t)$ is continuous-time white noise with **[[spectral density|spectral-density]]** $\mathbf Q_c(t)$. That is the continuous cousin of the discrete $\mathbf Q_{k-1}$, related to it as in the stochastic-model lesson's discretization.

Two things must be carried forward from one reading to the next, and they are carried differently.

**The mean** needs no approximation at all. It obeys $\dot{\hat{\mathbf x}}(t) = \mathbf f(\hat{\mathbf x}(t),t)$, the real nonlinear equation the vehicle obeys. You hand it to a numerical **[[ODE integrator|ode-integrator]]** such as Runge-Kutta and step it across the interval.

**The covariance** uses the same trick as the discrete EKF: use a straight-line stand-in only where the exact rule would be unmanageable. It obeys a **[[continuous-time Lyapunov equation|lyapunov-name]]**, a rule for how the covariance changes at each instant:

::: key Continuous-discrete EKF propagation
$$
\dot{\hat{\mathbf x}}(t) = \mathbf f(\hat{\mathbf x}(t),t), \qquad \dot{\mathbf P}(t) = \mathbf F(t)\,\mathbf P(t) + \mathbf P(t)\,\mathbf F(t)^{\mathsf T} + \mathbf Q_c(t), \qquad \mathbf F(t) = \left.\frac{\partial\mathbf f}{\partial\mathbf x}\right|_{\hat{\mathbf x}(t)},
$$
integrated together from $t_{k-1}$ to $t_k$ to produce $\hat{\mathbf x}_k^-$ and $\mathbf P_k^-$; the update step is unchanged from the ordinary EKF. $\mathbf F(t)$ is evaluated **along the trajectory** $\hat{\mathbf x}(t)$, not frozen at its value at $t_{k-1}$.
:::

Each term of the covariance equation has a job. $\mathbf F\mathbf P + \mathbf P\mathbf F^{\mathsf T}$ stretches, squeezes and turns the cloud of uncertainty the way the motion stretches nearby paths. $\mathbf Q_c$ adds fresh fuzz every instant, from the random pushes the model cannot predict.

::: note Why it has to be true
Take a very short step $\Delta t$. Over it, the straight-line transition matrix is about $\boldsymbol\Phi \approx \mathbf I + \mathbf F\Delta t$, and the added noise is about $\mathbf Q_c\Delta t$. The discrete rule from the Kalman filter module says $\mathbf P(t+\Delta t) = \boldsymbol\Phi\mathbf P\boldsymbol\Phi^{\mathsf T} + \mathbf Q_c\Delta t$. Multiply out the brackets:

$$
(\mathbf I + \mathbf F\Delta t)\mathbf P(\mathbf I + \mathbf F\Delta t)^{\mathsf T} = \mathbf P + \mathbf F\mathbf P\Delta t + \mathbf P\mathbf F^{\mathsf T}\Delta t + \mathbf F\mathbf P\mathbf F^{\mathsf T}\Delta t^2.
$$

Subtract $\mathbf P$, add the noise, and divide by $\Delta t$:

$$
\frac{\mathbf P(t+\Delta t)-\mathbf P(t)}{\Delta t} = \mathbf F\mathbf P + \mathbf P\mathbf F^{\mathsf T} + \mathbf Q_c + \mathbf F\mathbf P\mathbf F^{\mathsf T}\Delta t.
$$

As $\Delta t$ shrinks to zero, the last term vanishes and the left side becomes $\dot{\mathbf P}$. What is left is the Lyapunov equation.
:::

The last clause of the key block is the whole point of this section, and a hurried implementation misses it. The tempting shortcut is to treat $\mathbf F$ as constant for the whole interval. Work out $\mathbf F$ once, at $t_{k-1}$, and use the exact recipe for a fixed linear system: the matrix exponential $\boldsymbol\Phi=\exp(\mathbf F\,\Delta t)$ and its matching discrete noise, built with **[[Van Loan's method|van-loan]]**.

That shortcut is exact for a truly linear system. It is also fine when $\Delta t$ is short compared with how fast $\mathbf F$ changes along the path. It fails when the path sweeps through a region where the bend of $\mathbf f$ changes quickly within one interval. For a nonlinear system that is not a rare corner case. It is the normal situation.

::: example A pendulum's covariance, followed properly or frozen
Take the pendulum from the last lesson, with $L=1\,\mathrm m$. Put random pushes on the swing-rate channel only: $\mathbf Q_c=\operatorname{diag}(0,\,q)$ with $q=0.02\,\mathrm{rad^2/s^3}$. Start with standard deviations of $2^\circ$ in angle and $1^\circ/\mathrm s$ in rate, $\mathbf P_0=\operatorname{diag}\!\left((2^\circ)^2,(1^\circ/\mathrm s)^2\right)$, and release from rest. Carry it forward $\Delta t=0.5\,\mathrm s$ in two ways:

- **(a) followed**: integrate $\dot{\hat{\mathbf x}}$ and $\dot{\mathbf P}$ together, working out $\mathbf F(\hat\theta(t))$ afresh at every instant of the swing, with a high-accuracy integrator;
- **(b) frozen**: fix $\mathbf F$ at its value at $\theta_0$ and use the exact matrix-exponential recipe for that fixed system.

Compare the **trace** $\operatorname{tr}\mathbf P$, the sum of the diagonal entries, a one-number summary of the total uncertainty (units mixed, $\mathrm{rad^2}$ plus $\mathrm{rad^2/s^2}$):

| $\theta_0$ | $\operatorname{tr}\mathbf P$, followed (a) | $\operatorname{tr}\mathbf P$, frozen (b) | relative error |
| --- | --- | --- | --- |
| $5^\circ$ | $0.017483$ | $0.017469$ | $-0.08\%$ |
| $45^\circ$ | $0.015728$ | $0.014565$ | $-7.40\%$ |
| $80^\circ$ | $0.011908$ | $0.011255$ | $-5.49\%$ |

**Reading it.** The relative error is (frozen − followed) ÷ followed. At $45^\circ$: $(0.014565 - 0.015728)/0.015728 = -0.0739$, so frozen understates the total uncertainty by $7.4\%$.

At $5^\circ$ the pendulum is nearly linear, and freezing costs almost nothing. At $45^\circ$, $7.4\%$ is lost in a single half-second step — not a disaster on its own, but a filter repeats that step every cycle for minutes.

Notice the error does *not* steadily grow with the angle: it is smaller at $80^\circ$ than at $45^\circ$. How much freezing costs depends on how $\mathbf F$ changes over the *whole* interval on this particular path, not on the starting angle alone. Freezing quietly substitutes one instant's slope for the whole interval's, and the only reliable way to know the price is to check your own trajectory.
:::

```python
import numpy as np
from scipy.integrate import solve_ivp
from scipy.linalg import expm

G0, L, q = 9.80665, 1.0, 0.02
Qc = np.array([[0.0, 0.0], [0.0, q]])

def f(x):
    theta, omega = x
    return np.array([omega, -(G0/L)*np.sin(theta)])

def Fjac(x):
    theta, omega = x
    return np.array([[0.0, 1.0], [-(G0/L)*np.cos(theta), 0.0]])

def propagate_true(x0, P0, dt):
    def rhs(t, y):
        x, P = y[:2], y[2:].reshape(2, 2)
        F = Fjac(x)
        return np.concatenate([f(x), (F@P + P@F.T + Qc).flatten()])
    sol = solve_ivp(rhs, [0, dt], np.concatenate([x0, P0.flatten()]), method='DOP853', rtol=1e-11, atol=1e-12)
    y = sol.y[:, -1]
    return y[:2], y[2:].reshape(2, 2)

def propagate_frozen(x0, P0, dt):
    F0 = Fjac(x0)
    M = np.zeros((4, 4)); M[:2,:2] = -F0; M[:2,2:] = Qc; M[2:,2:] = F0.T
    eM = expm(M*dt)
    Phi = eM[2:, 2:].T
    Qd = Phi @ eM[:2, 2:]
    return Phi @ P0 @ Phi.T + Qd

P0 = np.diag([np.radians(2.0)**2, np.radians(1.0)**2])
for theta0_deg in [5.0, 45.0, 80.0]:
    x0 = np.array([np.radians(theta0_deg), 0.0])
    _, P_true = propagate_true(x0, P0, 0.5)
    P_frozen = propagate_frozen(x0, P0, 0.5)
    print(theta0_deg, np.trace(P_true), np.trace(P_frozen))
# 5.0  0.01748279... 0.01746893...
# 45.0 0.01572777... 0.01456451...
# 80.0 0.01190802... 0.01125461...
```

::: warning Smaller frozen steps are not the same as integrating
A common shortcut for "continuous motion" is to chop the interval into many small steps and reuse the discrete EKF's one-Jacobian-per-step recipe on each. That does approach the right answer as the steps shrink. But for any practical step count it is still the frozen-$\mathbf F$ approximation this example measured, only cut into smaller pieces. Better than one big frozen step; still not the same as following $\mathbf F(t)$ along the path with a real integrator.
:::

## Re-aiming at one reading: the iterated EKF

Imagine aiming a basketball shot using where you *think* you are standing. You shoot, see the ball land short, and realize you were standing further back than you thought. Now you would aim differently from that new spot. The sensible thing is to re-aim from your corrected position — but judge the shot against the *same* evidence, not pile correction on correction.

The ordinary EKF update draws its straight line for $\mathbf h$ once, at $\hat{\mathbf x}_k^-$, and takes one step. If the prediction is close to the truth and $\mathbf h$ is gentle, one step is nearly all there is to gain. If the prediction is far off, or the reading is very precise, or $\mathbf h$ bends sharply, that one straight line can leave real accuracy behind. The update moves the estimate, and the *new* estimate would have been a better place to draw the straight line.

The **iterated EKF** (**IEKF**) does exactly that. It repeats the update, re-working $\mathbf H$ at the newest estimate each time. But every repeat measures against the *original* prediction $\hat{\mathbf x}_k^-$ and $\mathbf P_k^-$. Each pass is a fresh update from the prior, not a chain of updates on updates. Read $\mathbf x^{(i)}$ as "x, pass i".

::: key Iterated EKF update
Starting from $\mathbf x^{(0)}=\hat{\mathbf x}_k^-$, repeat for $i=0,1,2,\ldots$:
$$
\mathbf H^{(i)} = \left.\frac{\partial\mathbf h}{\partial\mathbf x}\right|_{\mathbf x^{(i)}}, \qquad \mathbf S^{(i)} = \mathbf H^{(i)}\mathbf P_k^-\mathbf H^{(i)\mathsf T}+\mathbf R_k, \qquad \mathbf K^{(i)} = \mathbf P_k^-\mathbf H^{(i)\mathsf T}\mathbf S^{(i)-1},
$$
$$
\mathbf x^{(i+1)} = \hat{\mathbf x}_k^- + \mathbf K^{(i)}\Big[\mathbf z_k-\mathbf h(\mathbf x^{(i)})-\mathbf H^{(i)}\big(\hat{\mathbf x}_k^--\mathbf x^{(i)}\big)\Big],
$$
until $\|\mathbf x^{(i+1)}-\mathbf x^{(i)}\|$ is negligible; then $\hat{\mathbf x}_k^+=\mathbf x^{(i+1)}$ and $\mathbf P_k^+=(\mathbf I-\mathbf K^{(i)}\mathbf H^{(i)})\mathbf P_k^-$ using the final iterate's $\mathbf H^{(i)}$.
:::

The bracket looks strange at first. The part $\mathbf h(\mathbf x^{(i)})+\mathbf H^{(i)}(\hat{\mathbf x}_k^--\mathbf x^{(i)})$ is the straight line drawn at $\mathbf x^{(i)}$, read off at the prior $\hat{\mathbf x}_k^-$. So the bracket is "the reading minus what the *new* straight line says the prior should have seen". On the first pass, $\mathbf x^{(0)}=\hat{\mathbf x}_k^-$, the last term is zero, and the formula is exactly the ordinary EKF update.

This is not a new idea invented for filtering. It is **[[Gauss-Newton|gauss-newton-recall]]**, the method from the least-squares module's nonlinear lesson, applied to this cost:

$$
J(\mathbf x)=\tfrac12(\mathbf x-\hat{\mathbf x}_k^-)^{\mathsf T}(\mathbf P_k^-)^{-1}(\mathbf x-\hat{\mathbf x}_k^-)+\tfrac12(\mathbf z_k-\mathbf h(\mathbf x))^{\mathsf T}\mathbf R_k^{-1}(\mathbf z_k-\mathbf h(\mathbf x)).
$$

The first half charges you for straying from the prediction; the second half charges you for disagreeing with the reading. Each is weighted by how uncertain it is. For a Gaussian prior and Gaussian sensor noise, $J$ is the negative [[logarithm of the posterior|neg-log]], up to a constant. So the lowest point of $J$ is the **maximum a posteriori** (**MAP**) estimate, the single most probable state — the same cost the least-squares module's MAP lesson wrote down for a fixed unknown.

A single EKF update *is* one Gauss-Newton step from $\hat{\mathbf x}_k^-$. The IEKF is Gauss-Newton carried on until it stops moving. What it reaches is the peak of the true posterior — its **[[mode|mode-mean]]** — not merely where one straight line happened to point. The extra prior term $(\mathbf P_k^-)^{-1}$ is the prior information matrix from the recursive-least-squares lesson. It does the same job here: it keeps the problem well posed even when one reading alone cannot pin down the whole state.

::: example One-shot against iterated against the true MAP
A static test with position only. The prior is $\hat{\mathbf x}_k^-=(200,\,200)\,\mathrm m$ with $\mathbf P_k^-=\operatorname{diag}(80^2,80^2)\,\mathrm m^2$: about $80\,\mathrm m$ of doubt in each direction. One very precise bearing arrives, $\sigma_\theta=0.5^\circ$, taken from a true position of $(80,\,260)\,\mathrm m$. It reads $z=72.8973^\circ$. The prior points at $45.000^\circ$, so a large, truly nonlinear correction is needed.

**One-shot EKF.**

- Slopes at the prior: $r^2 = 200^2+200^2 = 80\,000\,\mathrm{m^2}$, so $\mathbf H=(-200/80\,000,\ 200/80\,000)=(-0.0025,\ 0.0025)\,\mathrm{rad/m}$.
- Innovation: $72.8973^\circ - 45^\circ = 27.897^\circ = 0.48690\,\mathrm{rad}$.
- $S = 6400 \times (0.0025^2 + 0.0025^2) + (0.5^\circ)^2 = 0.08 + 0.0000762 = 0.080076\,\mathrm{rad^2}$.
- Gain: $\mathbf K=(6400 \times (-0.0025),\ 6400 \times 0.0025)/0.080076 = (-199.81,\ 199.81)\,\mathrm{m/rad}$.
- Step: $199.81 \times 0.48690 = 97.29\,\mathrm m$ in each direction, giving $\hat{\mathbf x}^+=(102.71,\,297.29)\,\mathrm m$.

**Iterated EKF.** Re-aim at each new estimate:
$(200,200)\to(102.71,297.29)\to(73.05,243.86)\to(73.36,237.94)\to(73.63,238.96)\to(73.623,238.940)$.
After five passes it settles at $(73.6228,\,238.9397)\,\mathrm m$; the last pass moved it only $1.2\times10^{-4}\,\mathrm m$.

**True MAP.** Minimize $J(\mathbf x)$ directly with a general-purpose search, no straight lines at all: $(73.6228,\,238.9397)\,\mathrm m$. The IEKF agrees to within about $6\,\mathrm{\mu m}$ (micrometers). The one-shot EKF is $65.2\,\mathrm m$ away from it.

**Sanity check.** Neither answer is the true $(80,260)$; the IEKF is $22.0\,\mathrm m$ off. That is expected. One bearing fixes only a direction, not how far along it the target is, so the prior decides where on that line the best guess sits. The comparison shows something narrower and sharper: the iterated update finds the peak of the posterior that the prior and the reading actually define, and the one-shot update does not.
:::

```python
import numpy as np
from scipy.optimize import minimize

def h(x): return np.arctan2(x[1], x[0])
def Hjac(x):
    r2 = x[0]**2 + x[1]**2
    return np.array([-x[1]/r2, x[0]/r2])

def wrap(a): return (a+np.pi) % (2*np.pi) - np.pi

x0m = np.array([200.0, 200.0]); P0 = np.diag([80.0**2, 80.0**2])
sigma_th = np.radians(0.5); R = sigma_th**2
x_true = np.array([80.0, 260.0]); z = h(x_true)
P0inv = np.linalg.inv(P0)

x_iter = x0m.copy()
for i in range(6):
    Hi = Hjac(x_iter)
    Si = Hi@P0@Hi.T + R
    Ki = P0@Hi.T/Si
    resid = wrap(z - h(x_iter) - Hi@(x0m-x_iter))
    x_iter = x0m + Ki*resid

def cost(x):
    dx = x-x0m
    rz = wrap(z - h(x))
    return 0.5*dx@P0inv@dx + 0.5*rz**2/R

res = minimize(cost, x0m, method='Nelder-Mead',
                options=dict(xatol=1e-12, fatol=1e-16, maxiter=50000, maxfev=50000))
print(x_iter, res.x, np.linalg.norm(x_iter-res.x))
# [ 73.6228315  238.93972163] [ 73.6228299  238.93971622] 5.6e-06
```

::: warning The iterated EKF still uses a single Gaussian
Iterating removes the *straight-line* error of one update. It does not touch the deeper assumption that the posterior is one bell-shaped hump. If the true posterior has two peaks — this module returns to that case with particle filters — Gauss-Newton climbs whichever peak its starting point is near, and reports a covariance that knows nothing about the other one. Iterating fixes *how well* the filter finds a peak. It does not fix *which* peak, and it cannot notice there might be more than one.
:::

## Check yourself

::: check
Which two quantities are integrated together in the continuous-discrete EKF's predict step? Which one needs no linearization at all?
:::

::: answer
The mean $\hat{\mathbf x}(t)$, obeying $\dot{\hat{\mathbf x}}=\mathbf f(\hat{\mathbf x},t)$, and the covariance $\mathbf P(t)$, obeying $\dot{\mathbf P}=\mathbf F(t)\mathbf P+\mathbf P\mathbf F(t)^{\mathsf T}+\mathbf Q_c(t)$. Both run together from $t_{k-1}$ to $t_k$.

The mean needs no linearization. It is the true nonlinear equation, integrated numerically as it stands. Only the covariance uses the Jacobian $\mathbf F(t)$, and that Jacobian must be worked out along the moving $\hat{\mathbf x}(t)$, not frozen at its value at $t_{k-1}$.
:::

::: check
Why is the iterated EKF called "Gauss-Newton on the MAP cost"? Which term of that cost plays the role of the prior's information matrix from the recursive-least-squares lesson?
:::

::: answer
Each IEKF pass is, line for line, one Gauss-Newton step on

$$
J(\mathbf x)=\tfrac12(\mathbf x-\hat{\mathbf x}_k^-)^{\mathsf T}(\mathbf P_k^-)^{-1}(\mathbf x-\hat{\mathbf x}_k^-)+\tfrac12(\mathbf z_k-\mathbf h(\mathbf x))^{\mathsf T}\mathbf R_k^{-1}(\mathbf z_k-\mathbf h(\mathbf x)).
$$

So repeating the update until it stops moving is Gauss-Newton run to the end instead of stopped after one step.

The prior term's $(\mathbf P_k^-)^{-1}$ is the same information matrix that appeared as $\mathbf P^{-1}$ in the recursive-least-squares lesson. It keeps the cost well posed even where the reading alone would not pin down $\mathbf x$.
:::

::: check
In the bearing example, the IEKF's answer is $22.0\,\mathrm m$ from the true position, even though it matches the MAP to within micrometers. Is that a failure of the iterated EKF?
:::

::: answer
No. The filter was given one number (a bearing) to find two unknowns (a 2-D position). A bearing fixes only the direction from the observer. A whole line of positions fits it equally well. Where along that line the best guess sits is decided by the prior, not by the truth, which the data cannot tell apart from any other point on the line.

The IEKF correctly answers the question it was asked: "what is the most probable position, given this prior and this one reading?" That answer differs from the truth because of a real limit on the *information available*, not a mistake in how the filter used it.
:::

::: check
A colleague says: "The IEKF converges to the MAP estimate, so its covariance $\mathbf P_k^+$ must be more accurate than the one-shot EKF's." Is that necessarily true?
:::

::: answer
Not necessarily. The IEKF's $\mathbf P_k^+=(\mathbf I-\mathbf K^{(i)}\mathbf H^{(i)})\mathbf P_k^-$ uses the Jacobian at the final estimate. That describes the curvature of the posterior at its actual peak better than the one-shot covariance, whose Jacobian was taken at the prior, possibly far away. In practice it is usually an improvement.

But it is still a Gaussian, bell-shaped approximation fitted at the peak. If the true posterior is lopsided, has heavy tails, or has other peaks nearby, landing on exactly the right peak does not make a bell shape a good description of the whole distribution.
:::

::: check
A filter uses a fixed $\Delta t=0.5\,\mathrm s$ discrete EKF on the pendulum, freezing $\mathbf F$ at the start of each interval. From this lesson's table, is the worst single-step covariance error at the largest swing, $80^\circ$? What does that tell you about predicting the cost of freezing?
:::

::: answer
No. The measured errors were $-0.08\%$ at $5^\circ$, $-7.40\%$ at $45^\circ$ and $-5.49\%$ at $80^\circ$. The worst was at $45^\circ$, not at the largest angle.

The cost of freezing depends on how much $\mathbf F(t)$ changes across *that particular* interval, not on the starting angle alone. "More nonlinear region" and "worse frozen-Jacobian error" go together roughly, but they are not the same statement. The only reliable way to know is to check the actual trajectory, as the table did — or to follow $\mathbf F(t)$ with an integrator and not have to ask.
:::

## Summary

| Item | Statement |
| --- | --- |
| Continuous-discrete predict | $\dot{\hat{\mathbf x}}=\mathbf f(\hat{\mathbf x},t)$ integrated as it stands; $\dot{\mathbf P}=\mathbf F(t)\mathbf P+\mathbf P\mathbf F(t)^{\mathsf T}+\mathbf Q_c(t)$ integrated with $\mathbf F(t)$ worked out along the path |
| Frozen-$\mathbf F$ shortcut | Exact only for a truly fixed linear interval; on the pendulum it lost between $0.08\%$ and $7.40\%$ of $\operatorname{tr}\mathbf P$ in $0.5\,\mathrm s$, depending on how much $\mathbf F$ changed across the interval |
| Iterated EKF | Re-work $\mathbf H$ at each new estimate, always measuring against the original prior; the same as Gauss-Newton on the MAP cost, ending at the posterior's peak |
| IEKF against one-shot | On the bearing example, the IEKF matched the directly computed MAP to about $6\,\mathrm{\mu m}$; the one-shot update was $65.2\,\mathrm m$ away |
| Limits of iterating | Finds *a* peak more accurately; does nothing for a posterior with several peaks, which needs tools from later in this module |

Both ideas make one EKF cycle work harder without changing what it is: still one Gaussian, still a straight line drawn at an estimate. The next lesson shows what happens when that nature itself becomes the problem — a filter, tuned perfectly, that drifts away from the truth because of where it drew its straight line.

::: context spectral-density Noise measured per second
Continuous white noise is a strange object: it is infinitely jumpy, so it has no ordinary variance. What is finite is how much variance it adds per unit of time. That rate is the spectral density $\mathbf Q_c$. Over a short step $\Delta t$ it adds about $\mathbf Q_c\Delta t$ of covariance. That is why the pendulum's $q$ has units of $\mathrm{rad^2/s^3}$: angular acceleration squared, $\mathrm{rad^2/s^4}$, times seconds.
:::

::: context ode-integrator Integrators in one paragraph
An ODE (ordinary differential equation) integrator turns "how fast things change" into "where things end up". Euler's method takes one straight step along the current slope. Runge-Kutta methods sample the slope at several points inside the step and blend them, so the error shrinks much faster as the step gets smaller: halve the step of a fourth-order method and the error drops about sixteen times. The DOP853 method used in the code is an eighth-order Runge-Kutta that also picks its own step size to meet an accuracy target.
:::

::: context lyapunov-name Named for a stability pioneer
Aleksandr Lyapunov, a Russian mathematician, wrote his famous 1892 thesis on when motions stay stable. Equations of the form $\dot{\mathbf P} = \mathbf F\mathbf P + \mathbf P\mathbf F^{\mathsf T} + \mathbf Q$ carry his name because the same equation, set to zero, tests whether a linear system settles down. In filtering, you read it as a bookkeeping rule: the motion reshapes the uncertainty cloud, and the noise keeps adding to it. If $\mathbf F$ is stable, the two balance and $\mathbf P$ levels off; if not, $\mathbf P$ keeps growing until a reading pulls it back.
:::

::: context van-loan Van Loan's trick
Charles Van Loan showed in 1978 how to get both $\boldsymbol\Phi = \exp(\mathbf F\Delta t)$ and the matching discrete process noise from one matrix exponential. Stack $-\mathbf F$, $\mathbf Q_c$ and $\mathbf F^{\mathsf T}$ into a block matrix twice the size, exponentiate it, and read the two answers out of its blocks. The `propagate_frozen` function in the code does exactly this. It is exact — but only for an $\mathbf F$ that truly stays fixed over the interval.
:::

::: context gauss-newton-recall Gauss-Newton as repeated straightening
To find the lowest point of a sum of squared misfits, Gauss-Newton replaces the curved model by its straight line at the current guess, solves that easy straight-line problem exactly, moves there, and repeats. Near the answer it homes in very fast. Far from the answer it can overshoot, which is why the least-squares module paired it with Levenberg-Marquardt, a damped version that takes shorter, safer steps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="345" y2="140" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M 30 20 Q 190 220 340 30" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M 49.2 42.6 L 125.1 104.9 L 162.6 119.2 L 181.3 122.1 L 191.5 122.6" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="49.2" cy="42.6" r="5" fill="#b4232c"/>
  <text x="58" y="40" font-size="11" fill="#b4232c">start (prior)</text>
  <circle cx="125.1" cy="104.9" r="4" fill="#1d6fd1"/>
  <circle cx="162.6" cy="119.2" r="4" fill="#1d6fd1"/>
  <circle cx="181.3" cy="122.1" r="4" fill="#1d6fd1"/>
  <circle cx="191.5" cy="122.6" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <line x1="191.5" y1="128" x2="191.5" y2="140" stroke="#f2b880" stroke-width="1.5"/>
  <text x="140" y="158" font-size="11" fill="#1f2a44">lowest cost = MAP</text>
  <text x="290" y="72" font-size="11" fill="#1f2a44">cost J</text>
  <text x="70" y="100" font-size="11" fill="#1d6fd1">passes</text>
</svg>
```
:::

::: context neg-log Why a logarithm turns bells into squares
A Gaussian probability looks like $e^{-\frac12 d^2}$, where $d$ is the distance from the center measured in standard deviations. Take the natural logarithm and the exponential disappears, leaving $-\tfrac12 d^2$. Flip the sign and you have a squared distance. Multiply the prior and sensor probabilities together, take minus the log, and products become sums: the prior's squared distance plus the reading's squared distance. That sum is $J$. Making the probability as large as possible is the same as making $J$ as small as possible.
:::

::: context mode-mean Peak and average are different places
For a perfect bell curve, the peak (the mode) and the balance point (the mean) are the same place. For a lopsided distribution they are not. The IEKF finds the peak. The ideal Kalman estimate for a bell curve is the mean. When the posterior is lopsided, the two differ, and no single-Gaussian filter can report both. Later filters in this module, the unscented and particle filters, aim at the mean instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="345" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M 30 130 C 70 130 80 25 110 25 C 150 25 200 100 330 128" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="110" y1="25" x2="110" y2="130" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="153" y1="44" x2="153" y2="130" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="70" y="148" font-size="11" fill="#1f2a44">peak (mode)</text>
  <text x="158" y="148" font-size="11" fill="#b4232c">average (mean)</text>
  <text x="200" y="60" font-size="11" fill="#1d6fd1">long tail to the right</text>
</svg>
```
:::
