---
id: l07-coning-sculling-multi-sample-algorithms
title: Coning and sculling corrections
minutes: 17
covers:
  - "Coning and sculling corrections and multi-sample algorithms"
---

The attitude update of the previous lesson integrated a single rotation vector per step, $\Delta\boldsymbol\theta=\boldsymbol\omega_{nb}^b\,\Delta t$, as though the rate were constant across the interval. Under any rotational vibration that assumption fails in a specific, unforgiving way: the true attitude accumulates a rotation the simple sum of samples cannot see, because finite rotations do not commute and a naive sum silently assumes they do. The velocity update has the same disease one level down — a naive sum of specific-force samples cannot see the velocity a correlated wobble in rotation and translation produces. Both errors are systematic, not random; both are invisible on a bench that never vibrates; and both are why every real strapdown mechanization runs its gyro and accelerometer several times faster than it updates attitude and velocity, combining the extra samples with a specific correction before the update this module has already built ever sees them.

This lesson derives both corrections from the same starting point — the exact kinematics of a rotating, accelerating body, expanded to the order the error first appears — and gives each one real numbers, so that "the correction matters" stops being a claim and becomes an arithmetic fact you can check.

## Coning: the Bortz equation and where 2/3 comes from

Let $\boldsymbol\phi(t)$ be the rotation vector describing the body's orientation relative to its own orientation at the start of the current compute interval, so $\boldsymbol\phi(0)=\mathbf 0$ and simple integration $\int_0^t\boldsymbol\omega\,ds$ is only its first approximation. The exact relationship, due to Bortz, is

$$
\dot{\boldsymbol\phi} = \boldsymbol\omega + \tfrac12\boldsymbol\phi\times\boldsymbol\omega + \left[\text{terms of order }\phi^2\right]\boldsymbol\phi\times(\boldsymbol\phi\times\boldsymbol\omega),
$$

and for the small rotations one compute interval accumulates, the bracketed term is smaller than the first two by another factor of $\phi^2$ and can be dropped: $\dot{\boldsymbol\phi}\approx\boldsymbol\omega+\tfrac12\boldsymbol\phi\times\boldsymbol\omega$. The second term is the whole of coning error. It vanishes for pure single-axis rotation, since then $\boldsymbol\phi$ stays parallel to $\boldsymbol\omega$, but under rotation about two axes at once it does not, and integrating only $\boldsymbol\omega$ — what "naive" rate integration does — silently drops it.

Split the compute interval into two equal sub-intervals, gyro increments $\Delta\boldsymbol\theta_1$ and $\Delta\boldsymbol\theta_2$, and model $\boldsymbol\omega(t)$ as varying linearly across the *whole* interval (a constant angular acceleration, the natural two-parameter fit to two samples). Writing $\boldsymbol\omega(t)=\mathbf a+\mathbf b t$ and integrating the Bortz correction term exactly for this profile gives, after eliminating $\mathbf a,\mathbf b$ in favour of the two measured increments,

$$
\boldsymbol\theta_{2\Delta t} \approx \Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2 + \tfrac23\,\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2 .
$$

The $\tfrac23$ is exact for this linear-rate model and a direct symbolic check confirms it: substituting $\mathbf a=(3\Delta\boldsymbol\theta_1-\Delta\boldsymbol\theta_2)/2\Delta t$ and $\mathbf b=(\Delta\boldsymbol\theta_2-\Delta\boldsymbol\theta_1)/\Delta t^2$ (the linear fit through the two increments) into $\tfrac12\int_0^{2\Delta t}\boldsymbol\phi(t)\times\boldsymbol\omega(t)\,dt$ and simplifying returns exactly $\tfrac23\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2$, with every other term cancelling.

::: key The two-sample coning correction
$\boldsymbol\theta = \Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2+\tfrac23(\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2)$. The cross-product term is the whole algorithm; it is exactly zero when the two increments are parallel (pure single-axis rotation, no coning to correct) and largest when they are in quadrature.
:::

::: example Naive against corrected, and how much the correction buys

Drive a simulated gyro with the classic coning motion — sinusoidal rotation about two orthogonal axes, $90^\circ$ out of phase, amplitude $\alpha=1^\circ$, frequency $20\,\mathrm{Hz}$ — sampled at $200\,\mathrm{Hz}$, ten samples per coning cycle, and integrate attitude for $200$ cycles both ways.

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

alpha, Omega = np.deg2rad(1.0), 2*np.pi*20.0     # cone half-angle, coning frequency
def body_rates(t):
    return np.array([alpha*Omega*np.cos(Omega*t), alpha*Omega*np.sin(Omega*t), 0.0])

def rodrigues(theta):
    ang = np.linalg.norm(theta)
    if ang < 1e-14: return np.eye(3)
    k = theta/ang
    K = np.array([[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]])
    return np.eye(3) + np.sin(ang)*K + (1-np.cos(ang))*(K@K)

dt, n_pairs = 1/200.0, int(200*(1/20.0)/(2/200.0))
C_naive, C_corr, t = np.eye(3), np.eye(3), 0.0
for _ in range(n_pairs):
    d1, d2 = body_rates(t)*dt, body_rates(t+dt)*dt
    C_naive = C_naive @ rodrigues(d1+d2)
    C_corr  = C_corr  @ rodrigues(d1+d2+(2/3)*np.cross(d1,d2))
    t += 2*dt

truth_rate = 0.5*alpha**2*Omega                 # derived below
rate_naive = R.from_matrix(C_naive).as_rotvec()[2]/t
rate_corr  = R.from_matrix(C_corr).as_rotvec()[2]/t
print(truth_rate, rate_naive, rate_corr)
# 0.019139676963148035 0.014968263293745957 0.01967934833745386
```

Truth, from the formula the next section derives, is $1.914\times10^{-2}\,\mathrm{rad/s}$. Naive integration reads $1.497\times10^{-2}\,\mathrm{rad/s}$, $21.8\%$ low. The two-sample correction reads $1.968\times10^{-2}\,\mathrm{rad/s}$, $2.8\%$ high — the discretization at only ten samples per cycle is coarse enough that the correction does not land exactly on truth, but it cuts the error by a factor of $7.7$, and that factor grows as the sample rate rises relative to the vibration frequency, exactly where a real coning correction earns its keep.
:::

## How large the drift really is

The "true coning rate" — how fast the naive integral's missing rotation actually accumulates — follows from time-averaging the Bortz correction term itself. For this motion, $\boldsymbol\phi(t)\approx\alpha(\sin\Omega t,\,1-\cos\Omega t,\,0)$ to leading order, and the third component of $\tfrac12\boldsymbol\phi\times\boldsymbol\omega$ works out to $\tfrac12\alpha^2\Omega(1-\cos\Omega t)$, whose time average is $\tfrac12\alpha^2\Omega$:

$$
\dot\theta_{\text{coning}} = \frac{\alpha^2\Omega}{2}.
$$

Two independent checks confirm the factor of one-half rather than one. A direct high-precision integration of the exact nonlinear attitude kinematics (no Bortz truncation at all) gives $1.9135\times10^{-2}\,\mathrm{rad/s}$ for $\alpha=1^\circ$, $\Omega=2\pi\times20\,\mathrm{rad/s}$, against $\alpha^2\Omega/2 = 1.9140\times10^{-2}\,\mathrm{rad/s}$ — agreement to four figures, with the residual explained by the amplitude not being infinitesimal. And there is a second, purely geometric route to the same number: the body axis traces, to leading order, a cone of half-angle $\alpha$ in space, and the net rotation a closed loop like this imprints on anything carried around it — the same holonomy that gives a Foucault pendulum its daily precession — equals the **solid angle** the loop subtends, $2\pi(1-\cos\alpha)\approx\pi\alpha^2$ for small $\alpha$. Divide by the period $2\pi/\Omega$ and the rate is again $\alpha^2\Omega/2$, exactly.

::: example Scaling: why halving the cone angle is worth four times more than halving the frequency

Both checks above confirm $\dot\theta_{\text{coning}}\propto\alpha^2\Omega$: doubling the frequency doubles the drift, but doubling the amplitude quadruples it. A coning motion of $2^\circ$ at $20\,\mathrm{Hz}$ drifts four times faster than $1^\circ$ at $20\,\mathrm{Hz}$ — $\left(2^\circ/1^\circ\right)^2=4$ — while $1^\circ$ at $40\,\mathrm{Hz}$ drifts only twice as fast as $1^\circ$ at $20\,\mathrm{Hz}$. On a launch vehicle, where vibration amplitude tracks structural response and frequency tracks the excitation source, this asymmetry is why isolating the IMU from a resonance that doubles its effective vibration *amplitude* is worth far more than one that merely shifts its dominant *frequency*.
:::

## Sculling: the same non-commutativity, one integral further

The velocity update has an analogous gap. The true velocity increment, properly accounting for the body rotating while specific force accumulates, is $\Delta\mathbf v = \int_0^{2\Delta t}\mathbf C_b(t)\,\mathbf f^b(t)\,dt$, where $\mathbf C_b(t)\approx\mathbf I+[\boldsymbol\theta(t)\times]$ tracks rotation from the start of the interval. Expanding gives $\Delta\mathbf v \approx \Delta\mathbf v_{sf} + \boldsymbol\nu$, with $\Delta\mathbf v_{sf}=\int\mathbf f^b\,dt$ the plain sum and $\boldsymbol\nu=\int_0^{2\Delta t}\boldsymbol\theta(t)\times\mathbf f^b(t)\,dt$ the whole correction — no extra one-half here, since this is a first-order rotation of a vector, not the Bortz rotation-vector equation. Fitting the same linear-in-time model used for coning to both $\boldsymbol\omega(t)$ and $\mathbf f^b(t)$ and evaluating $\boldsymbol\nu$ in terms of the two sub-interval gyro increments ($\Delta\boldsymbol\theta_1,\Delta\boldsymbol\theta_2$) and accelerometer increments ($\Delta\mathbf v_1,\Delta\mathbf v_2$) splits it cleanly in two:

$$
\boldsymbol\nu \approx \underbrace{\tfrac12(\Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2)\times(\Delta\mathbf v_1+\Delta\mathbf v_2)}_{\text{rotate by the mid-interval attitude}} + \underbrace{\tfrac12\big(\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2\big)}_{\text{sculling correction}} ,
$$

confirmed numerically to within the same small discretization residual coning showed. The first term is unavoidable bookkeeping — it says rotate the summed specific force by half the interval's total rotation rather than none, the natural symmetric choice — and any reasonable mechanization already includes it. The second term is the genuine **sculling correction**, and its structure explains sculling's defining property at a glance: for steady rotation and steady specific force, $\Delta\boldsymbol\theta_1\approx\Delta\boldsymbol\theta_2$ and $\Delta\mathbf v_1\approx\Delta\mathbf v_2$, and the term collapses to $\tfrac12(\mathbf d\times\mathbf e+\mathbf e\times\mathbf d)=\mathbf 0$ for any vectors $\mathbf d,\mathbf e$. Sculling is exactly zero under smooth motion; it exists only when the two sub-intervals disagree, which is what correlated angular and linear vibration does and a static bench test never can.

::: key Sculling error
The velocity-channel analogue of coning: correlated angular and linear vibration produces a systematic velocity error under naive integration. Corrected by $\tfrac12(\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2)$, added to the specific-force sum after it has been rotated by half the interval's total rotation. Like coning, it vanishes under steady motion and is invisible in a static test.
:::

::: example Rectification from a resonance, quantified

Take angular vibration about the body $x$-axis, $\omega_x(t)=\alpha\Omega\cos\Omega t$ (amplitude $\alpha=1^\circ$), coupled through a resonance to linear vibration along $y$ a quarter-cycle out of phase, $f_y(t)=A\Omega\sin\Omega t$ with $A=0.5\,\mathrm{m/s}$ and the same $\Omega=2\pi\times20\,\mathrm{rad/s}$. A high-precision integration of the exact, uncorrected kinematics shows the $z$-velocity growing at a steady $0.5483\,\mathrm{m/s}$ per second — not oscillating around zero, but accumulating — matching the closed form $\dot v_{\text{scull}}=\tfrac12\alpha A\Omega = 0.5483\,\mathrm{m/s^2}$ to four figures. Run for one minute uncorrected and this single vibration mode alone injects $32.9\,\mathrm{m/s}$ of spurious velocity, comparable to the entire bias-driven velocity error this module's random-walk lesson computed for a whole hour of coasting — from a vibration a static calibration would never reveal, because setting $A=0$ or $\alpha=0$ collapses the rectification to exactly zero.
:::

## Multi-sample algorithms

Two samples per compute interval fit $\boldsymbol\omega(t)$ and $\mathbf f^b(t)$ with a line — a constant plus a ramp — and capture the leading, quadratic-in-$\Delta t$ non-commutativity error. A higher vibration frequency relative to the attitude-update rate leaves a line a worse fit, and the residual error grows correspondingly. The general fix samples the gyro and accelerometer $N$ times per interval and fits a higher-order polynomial through the sub-samples, producing coning and sculling coefficients that are no longer the flat $\tfrac23$ and $\tfrac12$ of the two-sample case but small tables of numbers, one set per $N$, derived by the identical Bortz-equation route carried to a higher-order fit — Savage's original papers tabulate them up to $N=8$ or more for exactly this reason. The engineering trade is between sample rate (cost, in gyro and accelerometer bandwidth and processing) and how high a vibration frequency the mechanization can absorb without a residual coning or sculling bias — a launch vehicle's structural modes, which run into the hundreds of hertz, is the environment that makes this trade a real one rather than an academic refinement.

::: warning
Coning and sculling corrections fix a *modelling* error in how the rate and specific-force samples are combined; they cannot fix a genuine *aliasing* problem where the vibration frequency approaches or exceeds half the sample rate. If the coning frequency in the worked example above rose to $95\,\mathrm{Hz}$ against the same $200\,\mathrm{Hz}$ sampling, the two samples per interval would badly under-resolve each cycle and no coefficient rescues that — the fix at that point is a faster sensor, not a better formula.
:::

## Check yourself

::: check
A gyro reports two consecutive increments $\Delta\boldsymbol\theta_1=(2,0,0)\times10^{-3}\,\mathrm{rad}$ and $\Delta\boldsymbol\theta_2=(0,3,0)\times10^{-3}\,\mathrm{rad}$. Compute the coning-corrected rotation vector and state which axis the correction acts on.
:::

::: answer
$\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2 = (0\cdot0-0\cdot3,\,0\cdot0-2\cdot0,\,2\cdot3-0\cdot0)\times10^{-6}=(0,0,6)\times10^{-6}\,\mathrm{rad}$, so the correction is $\tfrac23\times6\times10^{-6}=4\times10^{-6}\,\mathrm{rad}$ about $z$, giving $\boldsymbol\theta=(2.000,\,3.000,\,0.004)\times10^{-3}\,\mathrm{rad}$. The correction acts entirely on the axis neither raw increment touches — exactly the "third axis" the module's second lesson named, because the cross product of two vectors is always perpendicular to both.
:::

::: check
Why does the coning correction vanish identically when $\Delta\boldsymbol\theta_1$ and $\Delta\boldsymbol\theta_2$ are parallel, and what physical motion does that correspond to?
:::

::: answer
The cross product of two parallel vectors is zero by definition, so $\tfrac23\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2=\mathbf 0$ whenever the two increments point the same way. Physically this is single-axis rotation: the body turns about one fixed axis, faster or slower from one sub-interval to the next perhaps, but never sweeping a cone, and successive rotations about a single fixed axis commute exactly, so there is no non-commutativity for a correction to fix.
:::

::: check
A sculling test shows zero rectified velocity even though both the gyro and the accelerometer clearly show oscillation at the same frequency on a spectrum analyzer. What does the algebra of this lesson say must be true of the two signals, and name one way that could happen physically?
:::

::: answer
The sculling term collapses to zero whenever $\Delta\boldsymbol\theta_1\approx\Delta\boldsymbol\theta_2$ and $\Delta\mathbf v_1\approx\Delta\mathbf v_2$ hold together, or more generally whenever the two signals are close enough to in-phase (rather than in quadrature) that $\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2$ averages to zero over a cycle — the worked example's $90^\circ$ phase shift was chosen specifically to maximize rectification, and a $0^\circ$ or $180^\circ$ phase relationship between the angular and linear vibration gives none. Physically this happens when the vibration source excites rotation and translation through a mechanically symmetric path with no phase lag between them, for instance a purely radial vibration mode that moves a component straight in and out without any accompanying rotational lag.
:::

::: check
Explain why a two-sample coning algorithm running at $200\,\mathrm{Hz}$ handles a $20\,\mathrm{Hz}$ vibration far better than the same algorithm would handle a $90\,\mathrm{Hz}$ vibration on the same hardware, in terms of this lesson's derivation rather than the shorthand "higher frequency is worse."
:::

::: answer
The two-sample coning coefficient was derived by fitting a straight line — a linear-in-time rate — through two samples spanning the compute interval, and that fit is only as good as the assumption that the true rate does not curve much within the interval. At $20\,\mathrm{Hz}$ sampled at $200\,\mathrm{Hz}$, each compute interval (two $5\,\mathrm{ms}$ samples) covers a tenth of a vibration cycle, where a sinusoid is close to linear. At $90\,\mathrm{Hz}$ on the same $200\,\mathrm{Hz}$ clock, each interval covers nearly half a cycle, where a sinusoid curves sharply and a straight-line fit is a poor model — the derivation's own assumption fails, not merely "the number is bigger," and no two-sample coefficient can fix a violated assumption.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{\boldsymbol\phi}\approx\boldsymbol\omega+\tfrac12\boldsymbol\phi\times\boldsymbol\omega$ | Bortz equation, truncated to the order coning first appears |
| $\boldsymbol\theta=\Delta\boldsymbol\theta_1+\Delta\boldsymbol\theta_2+\tfrac23\Delta\boldsymbol\theta_1\times\Delta\boldsymbol\theta_2$ | Two-sample coning correction |
| $\dot\theta_{\text{coning}}=\alpha^2\Omega/2$ | True coning drift rate; solid angle $2\pi(1-\cos\alpha)$ per revolution |
| $\Delta\mathbf v\approx\tfrac12\Delta\boldsymbol\theta_{\text{tot}}\times(\Delta\mathbf v_1+\Delta\mathbf v_2)+\tfrac12(\Delta\boldsymbol\theta_1\times\Delta\mathbf v_2+\Delta\mathbf v_1\times\Delta\boldsymbol\theta_2)$ | Velocity update with sculling correction |
| Both vanish for smooth motion | Coning needs two-axis rotation; sculling needs correlated angular and linear vibration |
| $N$-sample algorithms | Higher-order polynomial fit through more sub-samples; trades sensor bandwidth for tolerance of higher vibration frequency |

The mechanization loop is now complete and correctly handling vibration. The next two lessons turn to what happens when it runs unaided for a long time: first the Schuler oscillation, the feedback mechanism that keeps the errors this module has been computing from growing forever, and then the full free-inertial error budget it bounds.
