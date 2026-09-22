---
id: l10-time-of-flight
title: Time of flight and analytic propagation
minutes: 20
covers:
  - time of flight
---

How long does a spacecraft take to get from one point on its orbit to another? For a circular orbit the answer is a proportion of the period; for anything else it is the difference of two mean anomalies, each obtained from a true anomaly through the eccentric or hyperbolic anomaly. The same machinery, run in the other direction, answers the propagation question – where will the spacecraft be at a given time – exactly, in closed form, with no integration error. That analytic propagator is the reference against which every numerical integrator you write should be tested, and this lesson ends by performing that test.

Times of flight appear everywhere in operations: the coast between two burns of a transfer, the time from a de-orbit burn to entry interface, the window during which a satellite is above a ground station's horizon, the phasing wait in a rendezvous. On a vehicle, the analytic propagator is what a navigation filter uses to carry the state between measurements, and what an onboard planner uses to look ahead. Getting these times right to the second matters; getting them right to the millisecond is routine.

The lesson states the time-of-flight recipe for each conic with attention to wrapping, works elliptic, hyperbolic and parabolic cases, then assembles the analytic propagator and compares it against a high-order numerical integration of the two-body equation to show that the two agree to micrometres.

## The recipe

Everything rests on the fact that the mean anomaly is linear in time. For an ellipse, between two points with true anomalies $\nu_1$ and $\nu_2$:

1. Convert each true anomaly to eccentric anomaly, $E_k = \operatorname{atan2}\!\big(\sqrt{1 - e^2}\sin\nu_k,\; e + \cos\nu_k\big)$, in $[0, 2\pi)$.
2. Convert each to mean anomaly, $M_k = E_k - e\sin E_k$.
3. The time of flight is
$$
\Delta t = \frac{M_2 - M_1}{n} + kT, \qquad n = \sqrt{\frac{\mu}{a^3}}, \quad T = \frac{2\pi}{n},
$$
where the difference $M_2 - M_1$ is taken modulo $2\pi$ so that it is positive – if the path from $\nu_1$ to $\nu_2$ passes through periapsis, $M_2$ is numerically smaller than $M_1$ and $2\pi$ must be added – and $k$ counts complete extra revolutions.

For a circular orbit $M = E = \nu$ and the recipe collapses to $\Delta t = \Delta\nu/n$. For a hyperbola, replace $E$ by $H$ from $\tanh(H/2) = \sqrt{(e - 1)/(e + 1)}\tan(\nu/2)$, replace $M$ by $M_h = e\sinh H - H$ and $n$ by $n_h = \sqrt{\mu/\lvert a \rvert^3}$; there is no wrapping and no $k$, because a hyperbola is traversed once. For a parabola, use Barker's expression $B(\nu) = \tfrac{1}{2}\tan(\nu/2) + \tfrac{1}{6}\tan^3(\nu/2)$ and $\Delta t = \big(B(\nu_2) - B(\nu_1)\big)\sqrt{p^3/\mu}$.

Very often the question is posed in terms of radius rather than true anomaly – "how long until the spacecraft reaches $r$?" Then invert the orbit equation for the true anomaly, $\cos\nu = (p/r - 1)/e$, or go directly to the anomaly through $\cos E = (1 - r/a)/e$ for an ellipse and $\cosh H = (1 - r/a)/e$ for a hyperbola (recall $a < 0$ there), choosing the sign of $E$ or $H$ from whether the spacecraft is outbound or inbound.

::: key Time of flight on any conic
Ellipse: $\Delta t = \big[(M_2 - M_1) \bmod 2\pi\big]/n + kT$ with $M = E - e\sin E$, $n = \sqrt{\mu/a^3}$. Hyperbola: $\Delta t = (M_{h2} - M_{h1})/n_h$ with $M_h = e\sinh H - H$, $n_h = \sqrt{\mu/\lvert a \rvert^3}$. Parabola: $\Delta t = \sqrt{p^3/\mu}\,\big[B(\nu_2) - B(\nu_1)\big]$ with $B = \tfrac{1}{2}\tan\frac{\nu}{2} + \tfrac{1}{6}\tan^3\frac{\nu}{2}$. Circle: $\Delta t = \Delta\nu/n$.
:::

::: example Time of flight around a GTO, both ways round
The GTO ($a = 24\,396.14\,\mathrm{km}$, $e = 0.72831$, $n = 1.65687 \times 10^{-4}\,\mathrm{rad/s}$, $T = 37\,922\,\mathrm{s}$). From $\nu_1 = 90^\circ$ to $\nu_2 = 270^\circ$, the half of the orbit containing apogee: by symmetry $E_2 = 2\pi - E_1$ and $M_2 = 2\pi - M_1$, with $E_1 = 0.75494$ and $M_1 = 0.25587\,\mathrm{rad}$ from the previous lesson. So
$$
\Delta t = \frac{(2\pi - 0.25587) - 0.25587}{1.65687 \times 10^{-4}} = \frac{5.77145}{1.65687 \times 10^{-4}} = 34\,834\,\mathrm{s} = 9.68\,\mathrm{h},
$$
which is $91.9\,\%$ of the period spent on the outer half of the orbit by true anomaly. The other way round, from $270^\circ$ through perigee to $90^\circ$: now $M_2 - M_1 = 0.25587 - (2\pi - 0.25587) = -5.77145$, negative, so add $2\pi$ to get $0.51174$, and $\Delta t = 0.51174/1.65687 \times 10^{-4} = 3089\,\mathrm{s} = 51.5\,\mathrm{min}$. The two add to $37\,922\,\mathrm{s}$, one period, as they must.
:::

::: example The ISS through perigee, and how good the circular approximation is
For the ISS-like orbit ($a = 6791\,\mathrm{km}$, $e = 0.0006$, $n = 1.12815 \times 10^{-3}\,\mathrm{rad/s}$), from $\nu_1 = 350^\circ$ to $\nu_2 = 10^\circ$ through perigee. $E_1 = 350.012^\circ$, $M_1 = 350.012^\circ$; $E_2 = 9.988^\circ$, $M_2 = 9.988^\circ$ (the $E$ and $M$ steps each move the angle by only $0.017^\circ$ and $0.034^\circ$ at this eccentricity). $M_2 - M_1 = -340.024^\circ$, plus $360^\circ$ gives $19.976^\circ = 0.34865\,\mathrm{rad}$, so $\Delta t = 0.34865/1.12815 \times 10^{-3} = 309.0\,\mathrm{s}$. The circular approximation $\Delta\nu/n = 0.34907/1.12815 \times 10^{-3} = 309.4\,\mathrm{s}$ is off by $0.4\,\mathrm{s}$ – a tenth of a percent, matching the $2e\sin M$ estimate of the anomaly difference. Good enough for a contact schedule; not for a docking.
:::

::: example Time to reach ten Earth radii on a hyperbola
A hyperbola with $r_p = 6678.137\,\mathrm{km}$ and $e = 1.5$ has $a = r_p/(1 - e) = -13\,356.27\,\mathrm{km}$, $p = r_p(1 + e) = 16\,695.3\,\mathrm{km}$ and $n_h = \sqrt{\mu/\lvert a \rvert^3} = 4.0902 \times 10^{-4}\,\mathrm{s^{-1}}$. To reach $r = 10R = 63\,781.4\,\mathrm{km}$:
$$
\cosh H = \frac{1 - r/a}{e} = \frac{1 + 63\,781.4/13\,356.27}{1.5} = 3.8503, \qquad H = 2.0240 ,
$$
so $M_h = 1.5\sinh(2.0240) - 2.0240 = 1.5 \times 3.7183 - 2.0240 = 3.5532$ and $\Delta t = 3.5532/4.0902 \times 10^{-4} = 8687\,\mathrm{s} = 2.41\,\mathrm{h}$. The true anomaly there is $\cos\nu = (p/r - 1)/e = -0.4922$, $\nu = 119.5^\circ$, well on the way to the asymptote at $\nu_\infty = \arccos(-1/1.5) = 131.8^\circ$.
:::

## Analytic propagation

The recipe run backwards is a propagator. Given $\mathbf{r}_0, \mathbf{v}_0$ at $t_0$ and a time step $\Delta t$:

1. Convert the state to elements $(a, e, i, \Omega, \omega, \nu_0)$.
2. $\nu_0 \to E_0 \to M_0 = E_0 - e\sin E_0$.
3. $M = M_0 + n\,\Delta t$, wrapped to $[0, 2\pi)$.
4. Solve Kepler's equation for $E$; convert $E \to \nu$.
5. Convert $(a, e, i, \Omega, \omega, \nu)$ back to $\mathbf{r}, \mathbf{v}$.

Only step 4 involves iteration, and it converges to machine precision. The result is the exact two-body state at $t_0 + \Delta t$, limited only by floating-point round-off – around $10^{-12}$ relative, or a micrometre on a $7000\,\mathrm{km}$ orbit. Nothing accumulates with $\Delta t$: propagating a year ahead costs the same and is as accurate as propagating a minute ahead, as long as $M$ is computed in a way that does not lose precision when it grows large (keep $\Delta t$ and $n$ in double precision and wrap once).

::: example Propagating the ISS-like state by one hour
Start from $\mathbf{r}_0 = (-2267.240, -3989.573, 5001.268)\,\mathrm{km}$, $\mathbf{v}_0 = (5.0098, -5.4258, -2.0540)\,\mathrm{km/s}$. The state-to-elements conversion gives $a = 6790.985\,\mathrm{km}$, $e = 0.000598$, $i = 51.640^\circ$, $\Omega = 120.000^\circ$, $\omega = 79.896^\circ$, $\nu_0 = 30.104^\circ$, and $n = 1.128157 \times 10^{-3}\,\mathrm{rad/s}$. Then $E_0 = 30.086^\circ$, $M_0 = 30.069^\circ$; after $3600\,\mathrm{s}$, $n\,\Delta t = 4.06137\,\mathrm{rad} = 232.699^\circ$ and $M = 262.768^\circ$. Kepler's equation gives $E = 262.734^\circ$ and $\nu = 262.700^\circ$, and the elements-to-state conversion returns
$$
\mathbf{r} = (-2148.598,\; 6242.669,\; -1592.817)\,\mathrm{km}, \qquad \mathbf{v} = (-5.073044,\; -0.288197,\; 5.733046)\,\mathrm{km/s}.
$$
The radius is $6791.50\,\mathrm{km}$ and the speed $7.6608\,\mathrm{km/s}$; the energy $v^2/2 - \mu/r = -29.348\,\mathrm{km^2/s^2}$ agrees with the initial value to $10^{-14}$, as it must for an exact solution.
:::

## Numerical propagation, and showing the two agree

The other way to propagate is to integrate $\dot{\mathbf{x}} = (\mathbf{v}, -\mu\mathbf{r}/r^3)$ numerically, as the ODE and numerical-methods modules taught. For pure two-body motion this is strictly worse than the analytic solution – slower and less accurate – but it is the only option once perturbations are added, and the analytic solution is how you prove the integrator is correct before you trust it with perturbations.

The test is straightforward: integrate the same initial state for the same $\Delta t$ and difference the results. Using an eighth-order Dormand–Prince integrator with adaptive steps (`DOP853` in SciPy) on the ISS-like state:

| $\Delta t$ | Relative tolerance | Position difference | Velocity difference | Function evaluations |
| --- | --- | --- | --- | --- |
| 1 h | $10^{-6}$ | $11.5\,\mathrm{m}$ | $12\,\mathrm{mm/s}$ | 122 |
| 1 h | $10^{-9}$ | $11\,\mathrm{mm}$ | $0.011\,\mathrm{mm/s}$ | 206 |
| 1 h | $10^{-13}$ | $1.1\,\mathrm{\mu m}$ | $10^{-6}\,\mathrm{mm/s}$ | 566 |
| 24 h | $10^{-9}$ | $123\,\mathrm{mm}$ | $0.14\,\mathrm{mm/s}$ | 3890 |
| 24 h | $10^{-13}$ | $4.8\,\mathrm{\mu m}$ | $5 \times 10^{-6}\,\mathrm{mm/s}$ | 12 338 |
| 7 d | $10^{-13}$ | $0.63\,\mathrm{mm}$ | $7 \times 10^{-4}\,\mathrm{mm/s}$ | 86 018 |

Read the table two ways. At tight tolerance the two propagators agree to micrometres over a day and to a millimetre over a week – far below any physical perturbation – which validates both implementations at once: a wrong $\mu$, a sign error, a mis-ordered `atan2`, or a quadrant slip in either code path would show up as metres or kilometres. And the difference scales with the integrator's tolerance and with elapsed time exactly as integration error should, which confirms that the residual is the integrator's, not the analytic solution's.

A fixed-step classical RK4 tells the same story with cruder numbers: after one orbit ($5569\,\mathrm{s}$) the position error is $28\,\mathrm{m}$ with a $60\,\mathrm{s}$ step, $17\,\mathrm{mm}$ with a $10\,\mathrm{s}$ step, and below a micrometre with a $1\,\mathrm{s}$ step – the $h^4$ scaling of a fourth-order method ($6^4 = 1296$ between the first two rows, against the observed $1700$).

The comparison in code, using the conversion routines of the earlier lessons:

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 398600.4418

def propagate_kepler(r0, v0, dt):
    a, e, i, raan, argp, nu0 = rv2coe(r0, v0)          # from the conversions lesson
    n = np.sqrt(MU / a**3)
    E0 = np.arctan2(np.sqrt(1 - e**2) * np.sin(nu0), e + np.cos(nu0))
    M = (E0 - e * np.sin(E0) + n * dt) % (2 * np.pi)
    E = solve_kepler(M, e)                              # from the solver lesson
    nu = np.arctan2(np.sqrt(1 - e**2) * np.sin(E), np.cos(E) - e)
    return coe2rv(a, e, i, raan, argp, nu)

def two_body(t, x):
    r = x[:3]
    return np.concatenate([x[3:], -MU * r / np.linalg.norm(r)**3])

r0 = np.array([-2267.240, -3989.573, 5001.268])
v0 = np.array([5.0098, -5.4258, -2.0540])
dt = 86400.0
rk, vk = propagate_kepler(r0, v0, dt)
sol = solve_ivp(two_body, (0, dt), np.r_[r0, v0], method="DOP853", rtol=1e-13, atol=1e-16)
print(np.linalg.norm(sol.y[:3, -1] - rk) * 1e6, "micrometres")   # about 5
```

Keep this test in your toolbox permanently. Every time you add a perturbation to the integrator, switch it off and re-run the comparison; every time you change the conversion routines, re-run it. It is the cheapest regression test in astrodynamics.

::: warning Wrap the mean-anomaly difference, not the true-anomaly difference
The time of flight comes from $M_2 - M_1$ reduced to $[0, 2\pi)$. Reducing $\nu_2 - \nu_1$ instead and converting the *difference* to a mean anomaly is meaningless – the map from $\nu$ to $M$ is not linear, so a difference in $\nu$ does not convert to a difference in $M$. Convert each endpoint separately, then subtract, then wrap.
:::

::: warning Fractions of a period are for circles only
On a GTO the arc from $\nu = 90^\circ$ to $270^\circ$ is half the orbit by angle and $92\,\%$ of the orbit by time. Writing $\Delta t = (\Delta\nu/2\pi)\,T$ is correct only when $e = 0$; for $e = 0.0006$ it is off by a tenth of a percent, and for $e = 0.73$ it is off by nearly a factor of two on this arc.
:::

## Check yourself

::: check
A satellite in an orbit with $a = 8000\,\mathrm{km}$ and $e = 0.2$ is at $\nu = 300^\circ$. How long until it next reaches $\nu = 60^\circ$?
:::

::: answer
$n = \sqrt{398\,600.4418/8000^3} = 8.8234 \times 10^{-4}\,\mathrm{rad/s}$. At $\nu_1 = 300^\circ$: $E_1 = \operatorname{atan2}(\sqrt{0.96}\sin 300^\circ,\ 0.2 + \cos 300^\circ) = \operatorname{atan2}(-0.8485, 0.7) = -50.48^\circ = 309.52^\circ$, $M_1 = 5.4021 - 0.2\sin(309.52^\circ) = 5.4021 + 0.1543 = 5.5564\,\mathrm{rad}$. At $\nu_2 = 60^\circ$: $E_2 = \operatorname{atan2}(0.8485, 0.7) = 50.48^\circ = 0.8811\,\mathrm{rad}$, $M_2 = 0.8811 - 0.1543 = 0.7268\,\mathrm{rad}$. $M_2 - M_1 = -4.8296$, plus $2\pi$ gives $1.4536\,\mathrm{rad}$; $\Delta t = 1.4536/8.8234 \times 10^{-4} = 1647\,\mathrm{s} = 27.5\,\mathrm{min}$, against a period of $7121\,\mathrm{s}$. The $120^\circ$ arc through perigee takes $23\,\%$ of the period.
:::

::: check
Why does analytic propagation of a two-body orbit not accumulate error with time, while numerical integration does?
:::

::: answer
The analytic solution evaluates a closed-form expression at the target time: the only errors are round-off in a fixed number of arithmetic operations and the (machine-precision) tolerance of the Kepler solver, none of which depends on how far ahead you look. A numerical integrator approximates the solution step by step, and each step's truncation error is carried forward and compounded through the nonlinear dynamics, so the error grows with the number of steps and hence with $\Delta t$. The table shows it: micrometres in a day, a millimetre in a week, even at $10^{-13}$ tolerance.
:::

::: check
Your numerical integrator and your analytic propagator disagree by $3\,\mathrm{km}$ after one orbit, and the disagreement grows linearly with time along the velocity direction. What is the most likely bug?
:::

::: answer
A small error in $\mu$ (or equivalently in $a$) in one of the two codes. A wrong $\mu$ changes the period; the two propagators then drift apart along the track at a steady rate – an along-track error growing linearly in time is the signature of a period mismatch. A sign error or a frame error would produce a large, immediate disagreement, not a slow drift; integrator tolerance would produce a disagreement that shrinks when the tolerance is tightened.
:::

::: check
On a parabolic orbit with $p = 13\,356.27\,\mathrm{km}$, how long does the spacecraft take to go from $\nu = -90^\circ$ to $\nu = +90^\circ$?
:::

::: answer
$B(90^\circ) = \tfrac{1}{2} + \tfrac{1}{6} = 0.66667$ and $B(-90^\circ) = -0.66667$, so $\Delta B = 1.33333$. With $\sqrt{p^3/\mu} = 1/(4.0902 \times 10^{-4}) = 2444.9\,\mathrm{s}$, $\Delta t = 1.33333 \times 2444.9 = 3260\,\mathrm{s} = 54.3\,\mathrm{min}$ – twice the $27.2\,\mathrm{min}$ from periapsis to $90^\circ$, by symmetry.
:::

::: check
Describe how you would use the analytic propagator to compute the duration of a ground-station pass, given that the station sees the satellite whenever its radius vector satisfies some geometric condition.
:::

::: answer
Propagate analytically at a coarse step (say $10\,\mathrm{s}$) across the interval of interest, evaluate the visibility condition at each sample, and find the sign changes that mark rise and set. Then refine each crossing with a root-finder on time, calling the analytic propagator inside it – it is exact and cheap, so bisection or Brent's method to millisecond precision costs only a few dozen evaluations per crossing. No integration is involved, so the coarse sampling introduces no propagation error, only the risk of missing a pass shorter than the step.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta t = [(M_2 - M_1) \bmod 2\pi]/n + kT$ | Elliptic time of flight; convert each $\nu$ to $E$ to $M$ separately |
| $\cos E = (1 - r/a)/e$, $\cosh H = (1 - r/a)/e$ | Anomaly from radius; sign from outbound or inbound |
| $\Delta t = (M_{h2} - M_{h1})/n_h$ | Hyperbolic; $n_h = \sqrt{\mu/\lvert a \rvert^3}$, no wrapping |
| $\Delta t = \sqrt{p^3/\mu}\,[B(\nu_2) - B(\nu_1)]$ | Parabolic, with Barker's $B(\nu)$ |
| GTO $90^\circ \to 270^\circ$ | $9.68\,\mathrm{h}$, $92\,\%$ of the period |
| Analytic propagator | State to elements, advance $M$ by $n\,\Delta t$, solve Kepler, elements to state |
| Agreement test | DOP853 at $10^{-13}$: $1\,\mathrm{\mu m}$ in 1 h, $5\,\mathrm{\mu m}$ in 24 h, $0.6\,\mathrm{mm}$ in 7 d |
| Error signatures | Along-track linear drift means a period ($\mu$ or $a$) mismatch; immediate large error means sign or frame |

The next two lessons replace the three separate anomalies with one universal variable that handles every conic in the same code path, and express the propagated state as a linear combination of the initial position and velocity through the Lagrange coefficients.
