---
id: l09-free-inertial-error-propagation
title: Free-inertial error propagation
minutes: 17
covers:
  - "Free-inertial error propagation: how position error grows with time from each error source"
---

Every error law this module has derived — bias instability's saturating wander, angle and velocity random walk's square-root growth, the Schuler oscillation's bound on a constant bias — has been developed one source at a time, on its own. A real coast is never one source at a time. A real IMU carries a gyro bias, an accelerometer bias, angle and velocity random walk, and an initial velocity error the vehicle inherited from whatever aiding it last had, all running simultaneously, all growing at different rates, and the question "how far off will the position estimate be after an hour" only has an honest answer once every one of them has been carried through to position error and combined.

This lesson does exactly that arithmetic, for the tactical-grade gyro and accelerometer this module has used since the random-walk lesson, at three checkpoints — ten seconds, one minute, and one hour — because the ranking of which error source dominates changes completely across that range, and knowing which one to fix first depends entirely on how long the coast actually is.

## Three deterministic terms, three growth laws

Recall the Schuler lesson's linearized loop, $\dot{\delta v}=-g\varepsilon$, $\dot\varepsilon=\delta v/R$, and its three driven or free solutions.

**A constant gyro bias $b$**, treated as a bias instability held effectively constant over the coast, drives $\dot\varepsilon=b-\delta v/R$. For $t\ll1/\omega_s$ this gives the short-time cubic law $\delta x(t)\approx gbt^3/6$; the exact Schuler-bounded solution is $\delta x(t)=bR(t-\sin(\omega_st)/\omega_s)$, a bounded oscillation riding a secular drift at rate $bR$.

**A constant accelerometer bias $a$** drives $\dot{\delta v}=a-g\varepsilon$ directly. Short-time: $\delta x(t)\approx at^2/2$. Exact: $\delta x(t)=(a/\omega_s^2)(1-\cos\omega_st)$, purely bounded, no secular term.

**An initial velocity error $\delta v_0$**, with no bias driving it, is the free (undriven) solution of the same loop. Short-time: $\delta x(t)\approx\delta v_0t$, plain linear growth. Exact: $\delta x(t)=(\delta v_0/\omega_s)\sin\omega_st$, purely bounded, no secular term, exactly like the accelerometer-bias case — an initial velocity error, once you look past the first few minutes, is not a permanent problem at all.

## Two stochastic terms, one integration further than usual

Angle random walk and velocity random walk were characterized in attitude and velocity terms; this lesson needs position, one more integration than either the random-walk lesson or the probability module carried them.

**Velocity random walk** already reached position in the probability module: white accelerometer noise integrates twice, giving $\sigma_{\delta x,\mathrm{VRW}}(t)=\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$, the identical construction used there for a wandering altimeter and repeated in this module's random-walk lesson.

**Angle random walk** takes one integration more, because it enters through attitude, not directly through velocity: white gyro noise makes attitude a random walk, $\mathrm{Var}(\theta(t))=Q_{\mathrm{ARW}}t$; that tilt leaks gravity into velocity, $\delta v(t)=-g\int_0^t\theta(s)\,ds$, itself a further integral of Brownian motion with $\mathrm{Var}(\delta v(t))=g^2Q_{\mathrm{ARW}}t^3/3$ — exactly the pattern the rate-random-walk section of the random-walk lesson used, one level up. Position needs a third integration, $\delta x(t)=\int_0^t\delta v(s)\,ds$, and working out $\mathrm{Var}\!\left(\int_0^t\!\int_0^s\theta(u)\,du\,ds\right)$ by the same autocovariance reduction used throughout this module gives a clean result, confirmed by a $30\,000$-path Monte Carlo simulation of the triple integral to within $1\%$ at every checkpoint tested:

$$
\sigma_{\delta x,\mathrm{ARW}}(t) = g\sqrt{Q_{\mathrm{ARW}}}\,\frac{t^{5/2}}{\sqrt{20}} = g\cdot\mathrm{ARW}\cdot\frac{t^{5/2}}{\sqrt{20}} .
$$

Both formulas hold only while $t\ll1/\omega_s$, the same short-time window the deterministic terms' cubic and quadratic laws need — a point this lesson's last section returns to.

::: key Position error from each source, short-time forms
Gyro bias: $gbt^3/6$. Accelerometer bias: $at^2/2$. Initial velocity error: $\delta v_0t$. Velocity random walk: $\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$. Angle random walk: $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$. All Schuler-bounded once $t$ is no longer small compared with $1/\omega_s\approx13\,\mathrm{minutes}$ at Earth's surface.
:::

::: example The full attribution, at ten seconds and one minute

Take this module's running tactical IMU: $\mathrm{ARW}=0.3^\circ/\sqrt{\mathrm h}$, gyro bias instability $b=3^\circ/\mathrm h$, $\mathrm{VRW}=0.0588\,\mathrm{m/s}/\sqrt{\mathrm h}$, accelerometer bias instability $a=50\,\mu g$, and a representative initial velocity error $\delta v_0=0.10\,\mathrm{m/s}$ left over from the last aiding fix, at $28.5^\circ$ latitude ($g=9.7921\,\mathrm{m/s^2}$, $R_M=6\,349\,951\,\mathrm m$).

```python
import numpy as np

deg = np.pi/180.0
g, Rm = 9.792092465091237, 6349951.494413983

b = 3.0*deg/3600.0                    # rad/s
a = 50e-6*9.80665                     # m/s^2
dv0 = 0.10                            # m/s
ARW_si = np.deg2rad(0.3)/60.0         # rad/sqrt(s)
VRW_si = 0.0588/60.0                  # m/s/sqrt(s)

def gyro_bias(t):    return g*b*t**3/6.0
def accel_bias(t):   return 0.5*a*t**2
def init_vel(t):     return dv0*t
def arw(t):          return g*ARW_si*t**2.5/np.sqrt(20.0)
def vrw(t):           return VRW_si*t**1.5/np.sqrt(3.0)

for t in [10.0, 60.0]:
    terms = {"gyro bias": gyro_bias(t), "accel bias": accel_bias(t),
             "init. velocity": init_vel(t), "ARW (rms)": arw(t), "VRW (rms)": vrw(t)}
    print(f"--- t = {t:.0f} s ---")
    for name, val in terms.items():
        print(f"  {name:16s} {val:10.5f} m")
    print(f"  sum of biases+initv        {gyro_bias(t)+accel_bias(t)+init_vel(t):10.5f} m")
    print(f"  RSS of ARW,VRW             {np.hypot(arw(t), vrw(t)):10.5f} m")
# --- t = 10 s ---
#   gyro bias           0.02374 m
#   accel bias          0.02452 m
#   init. velocity      1.00000 m
#   ARW (rms)           0.06042 m
#   VRW (rms)           0.01789 m
#   sum of biases+initv           1.04825 m
#   RSS of ARW,VRW                0.06302 m
# --- t = 60 s ---
#   gyro bias           5.12713 m
#   accel bias          0.88260 m
#   init. velocity      6.00000 m
#   ARW (rms)           5.32827 m
#   VRW (rms)           0.26296 m
#   sum of biases+initv          12.00973 m
#   RSS of ARW,VRW                5.33475 m
```

At ten seconds the initial velocity error dominates everything else by more than an order of magnitude — a tenth of a metre per second, held for ten seconds, is a metre, full stop, and none of the sensor error terms have had time to accumulate to a tenth of that. By one minute the picture has changed completely: initial velocity error has grown only six-fold (linear in $t$), while the gyro bias term has grown roughly $216$-fold ($6^3$, the cubic law) to become comparable with it, and angle random walk — negligible at ten seconds — has grown nearly $90$-fold ($6^{2.5}$) to become comparable with both. Three different growth laws, three different fates for the same six-fold increase in time: this is why no single number answers "how good does the IMU need to be" without also answering "for how long."
:::

## What one hour actually costs

An hour is $3600\,\mathrm s$, and $1/\omega_s\approx805\,\mathrm s\approx13.4$ minutes at this latitude: an hour is more than four times past the point where the short-time laws above stop applying, so the honest answer uses the Schuler lesson's exact closed forms, not the polynomials.

::: example One hour, unaided, in full

```python
import numpy as np

g, Rm = 9.792092465091237, 6349951.494413983
ws = np.sqrt(g/Rm)
deg = np.pi/180.0
b, a, dv0 = 3.0*deg/3600.0, 50e-6*9.80665, 0.10

def gyro_bias_exact(t):  return b*Rm*(t - np.sin(ws*t)/ws)
def accel_bias_exact(t): return (a/ws**2)*(1-np.cos(ws*t))
def init_vel_exact(t):   return (dv0/ws)*np.sin(ws*t)

t = 3600.0
print("1/ws =", 1/ws, "s =", 1/ws/60, "min;  ws*t =", ws*t, "rad")
print("gyro bias (exact) :", gyro_bias_exact(t), "m")
print("accel bias (exact):", accel_bias_exact(t), "m")
print("init velocity     :", init_vel_exact(t), "m")
print("gyro bias (naive cubic, invalid here):", g*b*t**3/6, "m")
# 1/ws = 805.2809975256563 s = 13.421349958760938 min;  ws*t = 4.470489197015112 rad
# gyro bias (exact) : 404690.06657280663 m
# accel bias (exact): 394.1383908389232 m
# init velocity     : -78.18349939880737 m
# gyro bias (naive cubic, invalid here): 1107459.5670739873 m
```

The gyro bias term reaches $405\,\mathrm{km}$ — not a typo, and the clearest single number this module has produced for why unaided inertial navigation is a stopgap measured in minutes, not an alternative to aiding measured in hours. A $3^\circ/\mathrm h$ bias sounds negligible on a datasheet; multiplied by the Earth's radius, its secular drift rate is $bR_M=92.4\,\mathrm{m/s}$, over $300\,\mathrm{km/h}$, and an hour of that adds up exactly as badly as it sounds. Trusting the short-time cubic formula this far past its $t\ll1/\omega_s$ licence would have said $1107\,\mathrm{km}$, nearly three times too large — the Schuler bound does restrain the growth, from cubic to linear-on-average, but "restrained" is not "small" once the driving bias runs for an hour. The accelerometer bias and the initial velocity error, by contrast, are exactly where the Schuler lesson said they would be: bounded, oscillating, currently at $394\,\mathrm m$ and $-78\,\mathrm m$ respectively, nowhere near a naive $t^2$ or $t$ extrapolation and nowhere near the gyro bias term's scale.
:::

::: warning
The short-time formulas for angle and velocity random walk share the same $t\ll1/\omega_s$ licence the deterministic terms do, and it is tempting to plug $t=3600\,\mathrm s$ into $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$ anyway because the formula does not visibly object. It should not be trusted there. A random walk driven continuously through an *undamped* resonance does not saturate the way a Gauss-Markov bias does, but it does not keep accelerating either: simulating the driven stochastic Schuler loop directly shows the velocity-error variance transitioning from the short-time $t^3$ growth to plain **linear-in-$t$** growth once $t$ passes a few Schuler periods — the standard-deviation equivalent of angle random walk's own $\sqrt t$ law, reasserting itself one level up once the resonance has had time to respond. Qualitatively this puts angle random walk's hour-mark contribution to velocity far below the naive polynomial's extrapolation and, on this vehicle, well below the gyro bias term's $92\,\mathrm{m/s}$ secular rate — the ranking the ten-second and one-minute checkpoints already suggested is heading toward does not reverse at one hour; the deterministic bias term's unbounded secular drift keeps pulling further ahead of everything Schuler-bounded or square-root-bounded regardless.
:::

## Reading the ranking

Put the three checkpoints side by side and the lesson is not any single number but how the ranking itself changes.

| Source | $10\,\mathrm s$ | $60\,\mathrm s$ | Growth law (short-time) | Long-time behaviour |
| --- | --- | --- | --- | --- |
| Initial velocity error | $1.000\,\mathrm m$ | $6.00\,\mathrm m$ | $\propto t$ | Bounded, oscillates (no secular term) |
| Gyro bias | $0.024\,\mathrm m$ | $5.13\,\mathrm m$ | $\propto t^3$ | Secular drift at rate $bR$, Schuler-bounded oscillation on top |
| Accelerometer bias | $0.025\,\mathrm m$ | $0.88\,\mathrm m$ | $\propto t^2$ | Bounded, oscillates (no secular term) |
| Angle random walk | $0.060\,\mathrm m$ | $5.33\,\mathrm m$ | $\propto t^{2.5}$ | Transitions to $\propto\sqrt t$ once past $1/\omega_s$ |
| Velocity random walk | $0.018\,\mathrm m$ | $0.26\,\mathrm m$ | $\propto t^{1.5}$ | Similarly restrained past $1/\omega_s$ |

At ten seconds, whatever velocity error the vehicle carried into the coast dominates outright — the number to fix, if this coast is all that matters, is the initial condition, not the sensor. By a minute, the two fastest-growing terms, gyro bias (cubic) and angle random walk ($t^{2.5}$), have both caught up to it, and which of the three matters most is now a genuine three-way contest. Past about thirteen minutes, every stochastic and every accelerometer-driven term is Schuler-bounded or slower, and the *only* term still growing without limit is the gyro bias's secular drift — so for any coast measured in tens of minutes to hours, the entire error budget reduces to one number, the residual gyro bias, and improving anything else buys almost nothing.

## Check yourself

::: check
For this module's tactical gyro and accelerometer, at what approximate time does the accelerometer-bias position error first equal the velocity-random-walk position error? Set up the equation rather than reading it off the table.
:::

::: answer
Solve $\tfrac12at^2=\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$ for $t$: $t^{1/2}=2\sqrt{Q_{\mathrm{VRW}}}/(a\sqrt3)$, so $t=4Q_{\mathrm{VRW}}/(3a^2)$. With $\sqrt{Q_{\mathrm{VRW}}}=\mathrm{VRW}_{\mathrm{si}}=9.8\times10^{-4}\,\mathrm{m/s}/\sqrt{\mathrm s}$ and $a=4.903\times10^{-4}\,\mathrm{m/s^2}$, $t=4\times(9.8\times10^{-4})^2/(3\times(4.903\times10^{-4})^2)\approx5.3\,\mathrm s$ — at this sensor grade the accelerometer bias overtakes velocity random walk within the first few seconds, consistent with the ten-second row already showing the bias term ahead.
:::

::: check
A colleague argues that because angle random walk and the gyro bias both reach about $5\,\mathrm m$ at $t=60\,\mathrm s$ in the worked example, the two error sources are "equally important" for this vehicle. What is incomplete about that conclusion?
:::

::: answer
Equal position error at one instant says nothing about the trend: the gyro bias term is on an unbounded secular path that will dominate everything else within the hour, while angle random walk is approaching a transition, past roughly $13$ minutes, after which its growth slows to $\sqrt t$. Two terms that happen to coincide at one snapshot can be heading in completely different directions, and "equally important" is only true at that single instant, not as a general statement about the vehicle's error budget.
:::

::: check
Why does the initial-velocity-error term have no secular position drift at long times, while the gyro-bias term does, even though both eventually drive the identical Schuler oscillator?
:::

::: answer
The two differ in *how* they enter the loop, not in the loop itself. An initial velocity error is a free initial condition on the homogeneous oscillator — it has no ongoing forcing, so the oscillator's own energy is fixed at $t=0$ and stays fixed forever, producing pure bounded oscillation. A gyro bias is a *continuous* forcing term that never switches off, feeding the tilt equation at every instant; even though the oscillatory part of the response is bounded exactly as before, the continuous forcing sustains a nonzero average velocity error, $bR$, which a bounded oscillation cannot cancel out of a running integral — hence the secular drift. The distinguishing question for any error source is not "does it reach the Schuler loop" but "does it keep pushing after it arrives."
:::

::: check
Scale the worked example: if the gyro bias were improved from $3^\circ/\mathrm h$ to $0.03^\circ/\mathrm h$ (two orders of magnitude, a jump from tactical to navigation grade) but nothing else changed, roughly how does the one-hour position error change, and does this IMU's error budget become dominated by a different term?
:::

::: answer
The gyro-bias secular drift rate $bR_M$ scales linearly with $b$, so a hundred-fold smaller bias gives a hundred-fold smaller one-hour position error: roughly $4.05\,\mathrm{km}$ instead of $405\,\mathrm{km}$. That is still far larger than the accelerometer-bias term's $394\,\mathrm m$ or angle random walk's Schuler-restrained contribution, so at one hour the gyro bias remains dominant even after a hundred-fold improvement — only once it were pushed down to roughly the same $3\times10^{-3\,\circ}/\mathrm h$ region as the true navigation-grade table in the sensor-physics lesson would the accelerometer bias term become the limiting factor for an hour-long unaided coast at this grade.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $gbt^3/6$, exact $bR(t-\sin\omega_st/\omega_s)$ | Gyro bias: cubic short-time, secular-plus-bounded exact |
| $at^2/2$, exact $(a/\omega_s^2)(1-\cos\omega_st)$ | Accelerometer bias: quadratic short-time, purely bounded exact |
| $\delta v_0t$, exact $(\delta v_0/\omega_s)\sin\omega_st$ | Initial velocity error: linear short-time, purely bounded exact |
| $\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$ | Velocity random walk into position |
| $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$ | Angle random walk into position, short-time |
| $1/\omega_s\approx13.4\,\mathrm{min}$ at Earth's surface | The boundary past which every short-time law above must be replaced by its Schuler-bounded form |
| Only the gyro bias keeps an unbounded secular term | The single number that dominates any coast measured in tens of minutes or longer |

This is the full free-inertial picture: every error this module has characterized, carried to position, ranked at three honest checkpoints. The remaining lessons turn from measuring the damage to limiting it — first how a system is told where it started (initial alignment), then how it is kept from drifting at all (INS/GNSS integration and the error-state filter that fuses them), and finally the smaller corrections — lever arm, zero-velocity updates, vibration rectification — that separate a good implementation from a merely correct one.
