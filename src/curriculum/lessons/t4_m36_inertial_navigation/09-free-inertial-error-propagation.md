---
id: l09-free-inertial-error-propagation
title: Free-inertial error propagation
minutes: 19
covers:
  - "Free-inertial error propagation: how position error grows with time from each error source"
---

Picture three runners on a track. The first jogs at a steady pace. The second starts slowly but speeds up a little every second. The third starts slower still but speeds up faster and faster. Stop the race after five seconds and the jogger is winning. Stop it after five minutes and the third runner is so far ahead the others are specks. Who "wins" depends entirely on when you blow the whistle.

The errors in an unaided inertial navigator race the same way. Each lesson so far has studied one error source on its own: a bias, a random walk, the Schuler loop's hold on a constant bias. A real **[[coast|coast]]** — a stretch of time with no GPS or other aiding — is never one source at a time. A real IMU carries a gyro bias, an accelerometer bias, angle and velocity random walk, and an initial velocity error left over from the last aiding fix, all at once, all growing at different rates. The question "how far off will the position be after an hour?" has an honest answer only once every one of them has been carried through to position and compared.

This lesson does exactly that, for the **[[tactical-grade|tactical-grade]]** gyro and accelerometer this module has used since the random-walk lesson, at three checkpoints: ten seconds, one minute and one hour. The ranking of which error matters most changes completely across that range. Knowing which one to fix first depends on how long the coast will be.

## Three steady errors, three growth laws

Start with the three errors that are fixed numbers rather than noise. Recall the Schuler lesson's linearized loop, with velocity error $\delta v$ and tilt $\varepsilon$:

$$
\dot{\delta v}=-g\varepsilon, \qquad \dot\varepsilon=\frac{\delta v}{R}.
$$

Each steady error enters this loop in its own way.

**A constant gyro bias $b$.** Treat the gyro's bias instability as holding constant over the coast. It drives the tilt equation: $\dot\varepsilon=b-\delta v/R$, with $\dot{\delta v}=g\varepsilon$. (This is the east-velocity/north-tilt pair from the Schuler lesson, where both signs flip; the loop is the same.) For short times the tilt grows like $bt$, that tilt leaks gravity as a false acceleration $gbt$, and integrating twice gives the short-time **cubic law**:

$$
\delta x(t)\approx\frac{gbt^3}{6}.
$$

The exact Schuler solution is $\delta x(t)=bR(t-\sin(\omega_st)/\omega_s)$: a bounded wobble riding on a secular drift at rate $bR$.

**A constant accelerometer bias $a$.** It drives the velocity equation directly: $\dot{\delta v}=a-g\varepsilon$. For short times it is a constant false acceleration, so position grows as

$$
\delta x(t)\approx\frac{at^2}{2}.
$$

The exact solution is $\delta x(t)=(a/\omega_s^2)(1-\cos\omega_st)$ — purely bounded, with no secular term.

**An initial velocity error $\delta v_0$.** Nothing keeps pushing here; the loop just starts with the wrong velocity. For short times position error grows in a plain straight line, $\delta x(t)\approx\delta v_0t$. The exact solution of the free loop is $\delta x(t)=(\delta v_0/\omega_s)\sin\omega_st$ — purely bounded, no secular term, just like the accelerometer bias. Once you look past the first few minutes, an initial velocity error is not a lasting problem at all.

::: key Free-inertial error growth laws
Gyro bias $b$: attitude error grows like $bt$, position like $gbt^3/6$. Accelerometer bias $a$: position like $at^2/2$. Initial velocity error: linear in $t$. All Schuler-bounded at long times — in the sense that the Schuler loop stops the power-law growth; for a gyro bias a secular drift at rate $bR$ still remains.
:::

::: note Why the gyro bias gives a cube
Follow one step at a time, for times short enough that the loop's feedback has not yet kicked in.

1. The gyro reports a turn rate $b$ that is not there. The computed platform tilts at that rate, so after time $t$ the tilt is $\varepsilon=bt$.
2. A tilt $\varepsilon$ leaks a slice $g\varepsilon$ of gravity into the horizontal channel. So the false acceleration is $gbt$ — it grows in a straight line.
3. Integrate once for velocity: $\delta v=\int_0^t gbs\,ds=\tfrac12gbt^2$.
4. Integrate again for position: $\delta x=\int_0^t\tfrac12gbs^2\,ds=\tfrac16gbt^3$.

Each integration adds one power of $t$, and the gyro bias starts one step further up the chain than an accelerometer bias does. That is the whole reason it ends up one power higher.
:::

## Two random errors, one integration further than usual

Angle random walk and velocity random walk were described in the random-walk lesson in terms of attitude and velocity. This lesson needs position, one more integration than before. Both are **[[Brownian motion|brownian]]** at heart: white noise, added up.

**Velocity random walk** (VRW) is white noise on the accelerometer. Integrated once it makes velocity a random walk. Integrated again it gives position, with a spread that grows as $t^{3/2}$ — the same construction the probability module used for a wandering altimeter:

$$
\sigma_{\delta x,\mathrm{VRW}}(t)=\sqrt{Q_{\mathrm{VRW}}}\,\frac{t^{3/2}}{\sqrt3}.
$$

Here $\sigma$ ("sigma") is the standard deviation — the typical size of the error — and $Q_{\mathrm{VRW}}$ is the noise strength, so $\sqrt{Q_{\mathrm{VRW}}}$ is the VRW coefficient in SI units, $\mathrm{m/s}/\sqrt{\mathrm s}$.

**Angle random walk** (ARW) is white noise on the gyro. It takes one integration more, because it enters through attitude:

1. White gyro noise makes the tilt a random walk, with variance $\mathrm{Var}(\theta(t))=Q_{\mathrm{ARW}}t$.
2. The tilt leaks gravity into velocity: $\delta v(t)=-g\int_0^t\theta(s)\,ds$. That is an integral of a random walk, with variance $g^2Q_{\mathrm{ARW}}t^3/3$ — the same pattern the random-walk lesson used for rate random walk, one level up.
3. Position needs a third integration, $\delta x(t)=\int_0^t\delta v(s)\,ds$.

Working out the variance of that double integral of a random walk gives a clean result:

$$
\sigma_{\delta x,\mathrm{ARW}}(t) = g\sqrt{Q_{\mathrm{ARW}}}\,\frac{t^{5/2}}{\sqrt{20}} = g\cdot\mathrm{ARW}\cdot\frac{t^{5/2}}{\sqrt{20}} .
$$

A **[[Monte Carlo|monte-carlo]]** simulation — thousands of random runs of the noise, whose spread is then measured — agrees with it to within a couple of percent at one minute.

Both formulas hold only while $t\ll1/\omega_s$, the same short-time window the cubic and quadratic laws need. The last sections come back to what happens after that.

::: note Where the square roots of 3 and 20 come from
Let $W(t)$ be a random walk with unit strength, so $\mathrm{Var}(W(t))=t$ and the correlation of two values is $\mathbb E[W(s)W(u)]=\min(s,u)$ — they share only the steps both have taken.

Integrate once: $I_1(t)=\int_0^tW(s)\,ds$. Its variance is the double integral of the correlation,

$$
\mathrm{Var}(I_1)=\int_0^t\!\!\int_0^t\min(s,u)\,ds\,du=\frac{t^3}{3}.
$$

Integrate again: $I_2(t)=\int_0^tI_1(s)\,ds$. The same method, one level deeper, gives $\mathrm{Var}(I_2)=t^5/20$.

VRW position is $\sqrt{Q_{\mathrm{VRW}}}\,I_1$, so its standard deviation is $\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$. ARW position is $g\sqrt{Q_{\mathrm{ARW}}}\,I_2$, so its standard deviation is $g\sqrt{Q_{\mathrm{ARW}}}\,t^{5/2}/\sqrt{20}$.
:::

::: key Position error from each source, short-time forms
Gyro bias: $gbt^3/6$. Accelerometer bias: $at^2/2$. Initial velocity error: $\delta v_0t$. Velocity random walk: $\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$. Angle random walk: $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$. All valid only while $t$ is small compared with $1/\omega_s\approx13\,\mathrm{minutes}$ at Earth's surface.
:::

::: example The full attribution, at ten seconds and one minute
Take this module's running tactical IMU:

- angle random walk $\mathrm{ARW}=0.3^\circ/\sqrt{\mathrm h}$,
- gyro bias instability $b=3^\circ/\mathrm h$,
- velocity random walk $\mathrm{VRW}=0.0588\,\mathrm{m/s}/\sqrt{\mathrm h}$,
- accelerometer bias instability $a=50\,\mu g$,
- and an initial velocity error $\delta v_0=0.10\,\mathrm{m/s}$ left over from the last aiding fix,

at $28.5^\circ$ latitude, where $g=9.7921\,\mathrm{m/s^2}$ and $R_M=6\,349\,951\,\mathrm m$. Each "per root hour" figure converts to SI by dividing by $60$, since $\sqrt{3600\,\mathrm s}=60\,\sqrt{\mathrm s}$.

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
def vrw(t):          return VRW_si*t**1.5/np.sqrt(3.0)

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

The steady errors are added with their signs (here all positive). The two random ones are combined by **[[root-sum-square|rss]]**, because independent random errors partly cancel.

**At ten seconds** the initial velocity error beats everything else by more than ten times. A tenth of a meter per second, held for ten seconds, is a meter. None of the sensor errors has had time to grow to even a tenth of that.

**At one minute** the picture has changed completely. Time went up six-fold.

- The initial velocity term grew only six-fold (linear in $t$): $1.00$ to $6.00\,\mathrm m$.
- The gyro bias term grew $6^3=216$-fold (the cubic law): $0.0237$ to $5.13\,\mathrm m$. Now it rivals the initial velocity term.
- Angle random walk grew $6^{2.5}\approx88$-fold: $0.0604$ to $5.33\,\mathrm m$. It rivals both.

Three growth laws, three different fates for the same six-fold stretch of time. That is why no single number answers "how good does the IMU need to be?" without also asking "for how long?"
:::

## What one hour actually costs

An hour is $3600\,\mathrm s$, and $1/\omega_s\approx805\,\mathrm s\approx13.4$ minutes at this latitude. So an hour is more than four times past the point where the short-time laws stop applying. The honest answer uses the Schuler loop's exact solutions for every term, the random ones included.

For the random terms, the loop gives these exact spreads (derived in the note after this example):

$$
\sigma_{\delta x,\mathrm{ARW}}(t)=R\cdot\mathrm{ARW}\sqrt{\tfrac32t-\frac{2\sin\omega_st}{\omega_s}+\frac{\sin2\omega_st}{4\omega_s}},\qquad \sigma_{\delta x,\mathrm{VRW}}(t)=\frac{\mathrm{VRW}}{\omega_s}\sqrt{\frac t2-\frac{\sin2\omega_st}{4\omega_s}} .
$$

For small $t$ these shrink back to the $t^{5/2}$ and $t^{3/2}$ laws: at one minute they give $5.327\,\mathrm m$ and $0.2628\,\mathrm m$, matching the table above. For large $t$ both grow only as $\sqrt t$.

::: example One hour, unaided, in full

```python
import numpy as np

g, Rm = 9.792092465091237, 6349951.494413983
ws = np.sqrt(g/Rm)
deg = np.pi/180.0
b, a, dv0 = 3.0*deg/3600.0, 50e-6*9.80665, 0.10
ARW_si, VRW_si = np.deg2rad(0.3)/60.0, 0.0588/60.0

def gyro_bias_exact(t):  return b*Rm*(t - np.sin(ws*t)/ws)
def accel_bias_exact(t): return (a/ws**2)*(1 - np.cos(ws*t))
def init_vel_exact(t):   return (dv0/ws)*np.sin(ws*t)
def arw_exact(t):        # rms, white gyro noise through the Schuler loop
    return Rm*ARW_si*np.sqrt(1.5*t - 2*np.sin(ws*t)/ws + np.sin(2*ws*t)/(4*ws))
def vrw_exact(t):        # rms, white accelerometer noise through the Schuler loop
    return (VRW_si/ws)*np.sqrt(t/2 - np.sin(2*ws*t)/(4*ws))

t = 3600.0
print(f"1/ws = {1/ws:.1f} s = {1/ws/60:.2f} min;  ws*t = {ws*t:.3f} rad")
print(f"gyro bias  : {gyro_bias_exact(t):12.1f} m   (naive cubic {g*b*t**3/6:.0f} m)")
print(f"ARW (rms)  : {arw_exact(t):12.1f} m   (naive t^2.5 {g*ARW_si*t**2.5/np.sqrt(20):.0f} m)")
print(f"accel bias : {accel_bias_exact(t):12.1f} m")
print(f"init. vel. : {init_vel_exact(t):12.1f} m")
print(f"VRW (rms)  : {vrw_exact(t):12.1f} m")
print(f"check at 60 s: ARW {arw_exact(60.0):.3f} m, VRW {vrw_exact(60.0):.4f} m")
# 1/ws = 805.3 s = 13.42 min;  ws*t = 4.470 rad
# gyro bias  :     404690.1 m   (naive cubic 1107460 m)
# ARW (rms)  :      46551.9 m   (naive t^2.5 148581 m)
# accel bias :        394.1 m
# init. vel. :        -78.2 m
# VRW (rms)  :         32.6 m
# check at 60 s: ARW 5.327 m, VRW 0.2628 m
```

**The gyro bias term reaches $405\,\mathrm{km}$.** That is not a typo. It is the clearest single number in this module for why unaided inertial navigation is a stopgap measured in minutes, not a replacement for aiding measured in hours. A $3^\circ/\mathrm h$ bias sounds tiny on a datasheet. Multiplied by the Earth's radius, its secular drift rate is $bR_M=92.4\,\mathrm{m/s}$ — over $330\,\mathrm{km/h}$ — and an hour of that adds up as badly as it sounds. The short-time cubic, used far outside its range, would have said $1107\,\mathrm{km}$, nearly three times too much. The Schuler loop does restrain the growth, from cubic to straight-line on average. But restrained is not small when the bias pushes for an hour.

**Angle random walk comes second, at about $47\,\mathrm{km}$** (one standard deviation). Its naive $t^{5/2}$ formula would have said $149\,\mathrm{km}$. Past a few Schuler periods it grows only as $\sqrt t$, but its multiplier is the Earth's radius, so the $\sqrt t$ growth is still large.

**Everything else is small.** The accelerometer bias and the initial velocity error sit exactly where the Schuler lesson said they would: bounded and rocking, currently at $394\,\mathrm m$ and $-78\,\mathrm m$. Velocity random walk is about $33\,\mathrm m$.
:::

::: note Why the random terms end up growing as the square root of time
Treat the white noise as a rapid string of tiny independent kicks. Each kick sets off the loop's **impulse response** — its reaction to one sharp tap — and the total error is the sum of all those reactions.

- A tap on the *tilt* (a gyro noise kick) of size $1$ gives a velocity error $(g/\omega_s)\sin\omega_s\tau$ and a position error $R(1-\cos\omega_s\tau)$ after time $\tau$. That position response never goes back to zero on average: each kick leaves a permanent offset of about $R$, plus a wobble.
- A tap on the *velocity* (an accelerometer noise kick) of size $1$ gives a position error $(\sin\omega_s\tau)/\omega_s$, which swings evenly around zero.

For independent kicks the variances add, so the variance is the noise strength times the integral of the squared response over the elapsed time. For the gyro, $\int_0^t R^2(1-\cos\omega_s\tau)^2\,d\tau$ gives the ARW formula; for the accelerometer, $\int_0^t\sin^2(\omega_s\tau)/\omega_s^2\,d\tau$ gives the VRW formula. Both integrals grow in proportion to $t$ once $t$ spans several periods, so the standard deviations grow as $\sqrt t$. A Monte Carlo run of the loop, with $20\,000$ random paths, reproduces both one-hour values to within half a percent.
:::

::: warning Do not stretch the short-time formulas
The random-walk formulas have the same $t\ll1/\omega_s$ limit as the steady ones. It is tempting to put $t=3600\,\mathrm s$ into $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$ anyway, because the formula does not visibly object. It gives $149\,\mathrm{km}$ where the truth is $47\,\mathrm{km}$. Noise driven through an undamped loop does not settle down the way a **[[Gauss-Markov|gauss-markov]]** bias does, but it does not keep speeding up either: once $t$ passes a few Schuler periods the growth drops to $\sqrt t$. Past about ten minutes, always use the loop's exact solutions.
:::

## Reading the ranking

Put the three checkpoints **[[side by side|five-curves]]**. The lesson is not any single number but how the ranking changes.

| Source | $10\,\mathrm s$ | $60\,\mathrm s$ | $1\,\mathrm h$ | Growth law (short-time) | Long-time behavior |
| --- | --- | --- | --- | --- | --- |
| Initial velocity error | $1.000\,\mathrm m$ | $6.00\,\mathrm m$ | $78\,\mathrm m$ | $\propto t$ | Bounded, rocks (no secular term) |
| Gyro bias | $0.024\,\mathrm m$ | $5.13\,\mathrm m$ | $405\,\mathrm{km}$ | $\propto t^3$ | Secular drift at rate $bR$, bounded wobble on top |
| Accelerometer bias | $0.025\,\mathrm m$ | $0.88\,\mathrm m$ | $394\,\mathrm m$ | $\propto t^2$ | Bounded, rocks (no secular term) |
| Angle random walk | $0.060\,\mathrm m$ | $5.33\,\mathrm m$ | $47\,\mathrm{km}$ | $\propto t^{2.5}$ | Slows to $\propto\sqrt t$ past $1/\omega_s$, with multiplier $R$ |
| Velocity random walk | $0.018\,\mathrm m$ | $0.26\,\mathrm m$ | $33\,\mathrm m$ | $\propto t^{1.5}$ | Slows to $\propto\sqrt t$ past $1/\omega_s$ |

(The one-hour initial-velocity entry is the size of $-78\,\mathrm m$; that term swings through zero and back.)

**At ten seconds**, whatever velocity error the vehicle carried into the coast wins outright. If this short coast is all that matters, fix the starting velocity, not the sensor.

**At one minute**, the two fastest growers — gyro bias (cubic) and angle random walk ($t^{2.5}$) — have caught up with it. Which of the three matters most is now a real three-way contest.

**Past about thirteen minutes**, the Schuler loop takes over. The accelerometer bias and the initial velocity error stop growing at all. Both random walks slow to $\sqrt t$. Only the gyro bias keeps a secular drift that grows in a straight line forever. For this IMU, over any coast of tens of minutes or more, the error budget is led by the residual gyro bias, with angle random walk a clear second — both gyro errors. Improving the accelerometer buys almost nothing.

## Check yourself

::: check
For this module's tactical accelerometer, at about what time does the accelerometer-bias position error first equal the velocity-random-walk position error? Set up the equation rather than reading the table.
:::

::: answer
Set the two short-time laws equal: $\tfrac12at^2=\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$. Divide both sides by $t^{3/2}$: $\tfrac12at^{1/2}=\sqrt{Q_{\mathrm{VRW}}}/\sqrt3$, so $t^{1/2}=2\sqrt{Q_{\mathrm{VRW}}}/(a\sqrt3)$. Square both sides: $t=4Q_{\mathrm{VRW}}/(3a^2)$.

Now the numbers: $\sqrt{Q_{\mathrm{VRW}}}=0.0588/60=9.8\times10^{-4}\,\mathrm{m/s}/\sqrt{\mathrm s}$ and $a=4.903\times10^{-4}\,\mathrm{m/s^2}$. So

$$
t=\frac{4\times(9.8\times10^{-4})^2}{3\times(4.903\times10^{-4})^2}\approx5.3\,\mathrm s .
$$

At this grade the accelerometer bias overtakes velocity random walk within the first few seconds — consistent with the ten-second column, where the bias term ($0.025\,\mathrm m$) is already ahead ($0.018\,\mathrm m$).
:::

::: check
A colleague says that because angle random walk and the gyro bias both reach about $5\,\mathrm m$ at $t=60\,\mathrm s$, the two are "equally important" for this vehicle. What is incomplete about that?
:::

::: answer
Equal size at one instant says nothing about where each is heading. The gyro bias is on a path with a secular drift that grows forever, at $92\,\mathrm{m/s}$ on average once the loop has taken hold. Angle random walk, past roughly $13$ minutes, slows to $\sqrt t$ growth. By one hour the gyro bias gives $405\,\mathrm{km}$ and angle random walk about $47\,\mathrm{km}$ — nearly nine times apart. Two terms that coincide at one snapshot can be heading in very different directions, so "equally important" is true only at that one moment.
:::

::: check
Why does the initial-velocity-error term have no secular position drift at long times, while the gyro-bias term does, even though both feed the very same Schuler loop?
:::

::: answer
They differ in *how* they enter the loop, not in the loop itself. An initial velocity error is a starting condition on a loop with nothing pushing it. The loop's swing is set at $t=0$ and stays that size forever, so the result is a pure bounded rocking whose velocity averages zero. A gyro bias is a push that never switches off, feeding the tilt equation at every instant. The rocking part of its response is bounded just as before, but the constant push also holds the velocity error at an average of $bR$ — and a nonzero average velocity integrates into position that keeps growing. The question to ask of any error source is not "does it reach the Schuler loop?" but "does it keep pushing after it arrives?"
:::

::: check
Suppose the gyro bias improves from $3^\circ/\mathrm h$ to $0.03^\circ/\mathrm h$ — a hundred times better, a jump toward navigation grade — but nothing else changes. Roughly how does the one-hour position error change, and does a different term now lead the budget?
:::

::: answer
The gyro-bias term scales in proportion to $b$, so a hundred-times-smaller bias gives a hundred-times-smaller contribution: about $4.05\,\mathrm{km}$ instead of $405\,\mathrm{km}$.

But "nothing else changes" includes the angle random walk, still $0.3^\circ/\sqrt{\mathrm h}$. Its one-hour contribution is about $47\,\mathrm{km}$, more than ten times the improved bias term. So angle random walk now leads the budget, and the total one-hour error is set mostly by it, not by the bias. The lesson: once one error is fixed, the next one in line takes over. To reach a few kilometers per hour, this IMU would need its angle random walk improved too — toward the $0.002$ to $0.005^\circ/\sqrt{\mathrm h}$ of the navigation-grade row in the sensor-physics lesson's table.
:::

::: check
Using the exact formula, what position error does the $3^\circ/\mathrm h$ gyro bias alone produce after one full Schuler period, $t=2\pi/\omega_s$? Compare it with the short-time cubic law at the same time.
:::

::: answer
At $t=2\pi/\omega_s$, $\sin\omega_st=0$, so the exact formula reduces to $\delta x=bR_M\cdot t$. With $bR_M=92.4\,\mathrm{m/s}$ and $t=2\pi\times805.3=5060\,\mathrm s$,

$$
\delta x=92.4\times5060\approx4.68\times10^5\,\mathrm m ,
$$

about $468\,\mathrm{km}$. The cubic law gives $gbt^3/6=9.792\times1.454\times10^{-5}\times5060^3/6\approx3.07\times10^6\,\mathrm m$, about $3070\,\mathrm{km}$ — more than six times too large. After one full period the wobble has exactly canceled, and only the secular drift remains.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $gbt^3/6$, exact $bR(t-\sin\omega_st/\omega_s)$ | Gyro bias: cubic at first, then secular drift plus a bounded wobble |
| $at^2/2$, exact $(a/\omega_s^2)(1-\cos\omega_st)$ | Accelerometer bias: quadratic at first, then purely bounded |
| $\delta v_0t$, exact $(\delta v_0/\omega_s)\sin\omega_st$ | Initial velocity error: linear at first, then purely bounded |
| $\sqrt{Q_{\mathrm{VRW}}}\,t^{3/2}/\sqrt3$ | Velocity random walk into position, short-time |
| $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$ | Angle random walk into position, short-time |
| Random walks past $1/\omega_s$ | Grow as $\sqrt t$; ARW's multiplier is $R$, so it stays large |
| $1/\omega_s\approx13.4\,\mathrm{min}$ | Past this, every short-time law must be replaced by its Schuler form |
| Only the gyro bias keeps a secular term | It leads any coast of tens of minutes or more, with angle random walk next |

This is the full free-inertial picture: every error this module has described, carried to position, ranked at three honest checkpoints. The remaining lessons turn from measuring the damage to limiting it — first how a system learns where it starts (initial alignment), then how it is kept from drifting at all (INS/GNSS integration and the error-state filter), and finally the smaller corrections — lever arm, zero-velocity updates, vibration rectification — that separate a good implementation from a merely correct one.

::: context coast What "coasting" means here
In navigation, a **coast** is any stretch when the INS runs on its own sensors with no outside fix: a GPS outage in a tunnel, a submarine deep underwater, a missile whose GPS is jammed, a lander between radar readings. Everything in this lesson is about how fast the estimate drifts during a coast. Aiding at the end of it resets the damage, which is why the length of the longest expected coast is one of the first numbers an INS designer asks for.
:::

::: context tactical-grade What "tactical grade" buys
IMUs are sorted into rough grades by how fast they drift. Consumer MEMS parts in phones and cars drift by $10$ to $1000^\circ/\mathrm h$. **Tactical** grade, used in guided munitions, drones and short-range rockets, sits around $0.1$ to $10^\circ/\mathrm h$ of gyro bias. **Navigation** grade, in airliners, is near $0.01^\circ/\mathrm h$. **Strategic** grade, in submarines and long-range missiles, is better still. This lesson's $3^\circ/\mathrm h$ unit is a typical tactical part — good for minutes of coasting, not hours.
:::

::: context brownian A walk made of tiny random steps
**Brownian motion** is named after Robert Brown, who in 1827 watched pollen grains jiggle in water under a microscope. The grains were being knocked about by water molecules. The mathematical version is a random walk with infinitely many infinitely small steps: its spread grows as $\sqrt t$, because independent steps add their *variances*, not their sizes. White noise on a gyro is exactly such a string of tiny independent kicks, which is why its angle behaves the same way.
:::

::: context monte-carlo Checking a formula by rolling dice
A **Monte Carlo** simulation answers a question about randomness by brute force: generate the random noise thousands of times, run each version through the equations, and measure the spread of the results. It is named after the casino in Monaco. Here, $20\,000$ runs of white gyro noise pushed through the error loop give a spread at one minute within a couple of percent of $g\cdot\mathrm{ARW}\cdot t^{5/2}/\sqrt{20}$. Engineers use it constantly to check that a derived formula — or a navigation filter's own error estimate — matches what the noise really does.
:::

::: context rss Why random errors add as squares
If two errors are independent and random, they are as likely to partly cancel as to pile up. Their typical combined size is not $A+B$ but $\sqrt{A^2+B^2}$, the **root-sum-square** (RSS). It is the same rule as the long side of a right triangle, and for the same reason: independent errors act like perpendicular directions. At one minute the two random terms, $5.33\,\mathrm m$ and $0.26\,\mathrm m$, combine to $5.33\,\mathrm m$ — the small one barely counts. Steady biases are different: they point a definite way, so they add with their signs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="100,130 260,130 260,10" fill="#8fb8f0" fill-opacity="0.3" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="130" x2="260" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="260" y1="130" x2="260" y2="10" stroke="#f2b880" stroke-width="3"/>
  <line x1="100" y1="130" x2="260" y2="10" stroke="#b4232c" stroke-width="3"/>
  <rect x="248" y="118" width="12" height="12" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="146" font-size="12" text-anchor="middle" fill="#1d6fd1">error A = 4</text>
  <text x="266" y="74" font-size="12" fill="#f2b880">error B = 3</text>
  <text x="120" y="62" font-size="12" fill="#b4232c">RSS = 5, not 7</text>
</svg>
```
:::

::: context gauss-markov Noise that forgets
A **Gauss-Markov** process, used in the random-walk lesson to model bias instability, is noise with a memory that fades: it wanders, but is always gently pulled back toward zero, with a correlation time $T$. So its spread levels off. White noise pushed through the undamped Schuler loop has no such pull-back, which is why its spread keeps growing — only more slowly, as $\sqrt t$.
:::

::: context five-curves All five errors on one chart
The same five errors from $1\,\mathrm s$ to $1\,\mathrm h$, using the Schuler loop's exact forms, on logarithmic axes (each grid step is a factor of $100$ in error). On such axes a power law $t^n$ is a straight line of slope $n$, so you can read each growth law off the steepness.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
  <line x1="50" y1="67.5" x2="330" y2="67.5" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
  <line x1="50" y1="105" x2="330" y2="105" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
  <line x1="50" y1="142.5" x2="330" y2="142.5" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3,3"/>
  <line x1="50" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="30" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="46" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1000 km</text>
  <text x="46" y="71" font-size="11" text-anchor="end" fill="#1f2a44">10 km</text>
  <text x="46" y="109" font-size="11" text-anchor="end" fill="#1f2a44">100 m</text>
  <text x="46" y="146" font-size="11" text-anchor="end" fill="#1f2a44">1 m</text>
  <text x="46" y="184" font-size="11" text-anchor="end" fill="#1f2a44">1 cm</text>
  <text x="50" y="195" font-size="11" text-anchor="middle" fill="#1f2a44">1 s</text>
  <text x="190" y="195" font-size="11" text-anchor="middle" fill="#1f2a44">1 min</text>
  <text x="330" y="195" font-size="11" text-anchor="middle" fill="#1f2a44">1 h</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.8" points="50.0,161.3 53.5,160.4 57.1,159.6 60.6,158.7 64.2,157.9 67.7,157.0 71.3,156.2 74.8,155.3 78.4,154.5 81.9,153.7 85.4,152.8 89.0,152.0 92.5,151.1 96.1,150.3 99.6,149.4 103.2,148.6 106.7,147.7 110.3,146.9 113.8,146.1 117.3,145.2 120.9,144.4 124.4,143.5 128.0,142.7 131.5,141.8 135.1,141.0 138.6,140.1 142.2,139.3 145.7,138.5 149.2,137.6 152.8,136.8 156.3,135.9 159.9,135.1 163.4,134.2 167.0,133.4 170.5,132.6 174.1,131.7 177.6,130.9 181.1,130.0 184.7,129.2 188.2,128.3 191.8,127.5 195.3,126.7 198.9,125.8 202.4,125.0 205.9,124.1 209.5,123.3 213.0,122.5 216.6,121.6 220.1,120.8 223.7,119.9 227.2,119.1 230.8,118.3 234.3,117.5 237.8,116.6 241.4,115.8 244.9,115.0 248.5,114.2 252.0,113.4 255.6,112.6 259.1,111.9 262.7,111.1 266.2,110.4 269.7,109.7 273.3,109.1 276.8,108.5 280.4,107.9 283.9,107.5 287.5,107.1 291.0,106.8 294.6,106.8 298.1,106.9 301.6,107.4 305.2,108.3 308.7,110.0 312.3,113.1 315.8,120.4 319.4,123.1 322.9,112.9 326.5,108.8 330.0,107.0"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2" points="50.0,180.0 53.5,180.0 57.1,180.0 60.6,180.0 64.2,180.0 67.7,180.0 71.3,180.0 74.8,180.0 78.4,180.0 81.9,180.0 85.4,180.0 89.0,180.0 92.5,180.0 96.1,180.0 99.6,180.0 103.2,180.0 106.7,180.0 110.3,180.0 113.8,180.0 117.3,179.3 120.9,178.1 124.4,176.8 128.0,175.5 131.5,174.3 135.1,173.0 138.6,171.7 142.2,170.5 145.7,169.2 149.2,167.9 152.8,166.7 156.3,165.4 159.9,164.1 163.4,162.9 167.0,161.6 170.5,160.3 174.1,159.1 177.6,157.8 181.1,156.5 184.7,155.3 188.2,154.0 191.8,152.7 195.3,151.5 198.9,150.2 202.4,149.0 205.9,147.7 209.5,146.4 213.0,145.2 216.6,143.9 220.1,142.6 223.7,141.4 227.2,140.1 230.8,138.9 234.3,137.6 237.8,136.4 241.4,135.1 244.9,133.9 248.5,132.6 252.0,131.4 255.6,130.2 259.1,128.9 262.7,127.7 266.2,126.5 269.7,125.4 273.3,124.2 276.8,123.1 280.4,122.0 283.9,120.9 287.5,119.9 291.0,119.0 294.6,118.1 298.1,117.3 301.6,116.6 305.2,116.1 308.7,115.7 312.3,115.4 315.8,115.4 319.4,115.3 322.9,115.2 326.5,114.9 330.0,114.1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,180.0 53.5,180.0 57.1,180.0 60.6,180.0 64.2,180.0 67.7,180.0 71.3,180.0 74.8,180.0 78.4,180.0 81.9,180.0 85.4,180.0 89.0,180.0 92.5,180.0 96.1,180.0 99.6,180.0 103.2,180.0 106.7,180.0 110.3,180.0 113.8,179.8 117.3,178.1 120.9,176.4 124.4,174.7 128.0,173.1 131.5,171.4 135.1,169.7 138.6,168.0 142.2,166.3 145.7,164.6 149.2,162.9 152.8,161.2 156.3,159.6 159.9,157.9 163.4,156.2 167.0,154.5 170.5,152.8 174.1,151.1 177.6,149.4 181.1,147.7 184.7,146.1 188.2,144.4 191.8,142.7 195.3,141.0 198.9,139.3 202.4,137.6 205.9,135.9 209.5,134.2 213.0,132.6 216.6,130.9 220.1,129.2 223.7,127.5 227.2,125.8 230.8,124.1 234.3,122.5 237.8,120.8 241.4,119.1 244.9,117.4 248.5,115.8 252.0,114.1 255.6,112.5 259.1,110.8 262.7,109.2 266.2,107.5 269.7,105.9 273.3,104.3 276.8,102.8 280.4,101.2 283.9,99.7 287.5,98.2 291.0,96.8 294.6,95.5 298.1,94.2 301.6,93.0 305.2,92.0 308.7,91.1 312.3,90.4 315.8,90.0 319.4,90.0 322.9,90.4 326.5,91.6 330.0,93.8"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="50.0,180.0 53.5,180.0 57.1,180.0 60.6,180.0 64.2,180.0 67.7,180.0 71.3,180.0 74.8,180.0 78.4,180.0 81.9,180.0 85.4,180.0 89.0,180.0 92.5,180.0 96.1,180.0 99.6,180.0 103.2,180.0 106.7,178.5 110.3,176.4 113.8,174.2 117.3,172.1 120.9,170.0 124.4,167.9 128.0,165.8 131.5,163.7 135.1,161.6 138.6,159.5 142.2,157.4 145.7,155.3 149.2,153.1 152.8,151.0 156.3,148.9 159.9,146.8 163.4,144.7 167.0,142.6 170.5,140.5 174.1,138.4 177.6,136.3 181.1,134.2 184.7,132.0 188.2,129.9 191.8,127.8 195.3,125.7 198.9,123.6 202.4,121.5 205.9,119.4 209.5,117.3 213.0,115.2 216.6,113.1 220.1,111.0 223.7,108.8 227.2,106.7 230.8,104.6 234.3,102.5 237.8,100.4 241.4,98.3 244.9,96.2 248.5,94.1 252.0,92.1 255.6,90.0 259.1,87.9 262.7,85.8 266.2,83.7 269.7,81.7 273.3,79.6 276.8,77.6 280.4,75.6 283.9,73.6 287.5,71.7 291.0,69.7 294.6,67.8 298.1,66.0 301.6,64.3 305.2,62.6 308.7,61.0 312.3,59.5 315.8,58.2 319.4,57.1 322.9,56.1 326.5,55.4 330.0,55.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.2" points="50.0,180.0 53.5,180.0 57.1,180.0 60.6,180.0 64.2,180.0 67.7,180.0 71.3,180.0 74.8,180.0 78.4,180.0 81.9,180.0 85.4,180.0 89.0,180.0 92.5,180.0 96.1,180.0 99.6,180.0 103.2,180.0 106.7,180.0 110.3,180.0 113.8,180.0 117.3,180.0 120.9,178.6 124.4,176.0 128.0,173.5 131.5,171.0 135.1,168.4 138.6,165.9 142.2,163.4 145.7,160.8 149.2,158.3 152.8,155.8 156.3,153.2 159.9,150.7 163.4,148.2 167.0,145.6 170.5,143.1 174.1,140.6 177.6,138.1 181.1,135.5 184.7,133.0 188.2,130.5 191.8,127.9 195.3,125.4 198.9,122.9 202.4,120.3 205.9,117.8 209.5,115.3 213.0,112.7 216.6,110.2 220.1,107.7 223.7,105.2 227.2,102.6 230.8,100.1 234.3,97.6 237.8,95.0 241.4,92.5 244.9,90.0 248.5,87.5 252.0,85.0 255.6,82.4 259.1,79.9 262.7,77.4 266.2,74.9 269.7,72.5 273.3,70.0 276.8,67.5 280.4,65.1 283.9,62.6 287.5,60.2 291.0,57.9 294.6,55.5 298.1,53.2 301.6,51.0 305.2,48.8 308.7,46.7 312.3,44.7 315.8,42.9 319.4,41.2 322.9,39.7 326.5,38.4 330.0,37.4"/>
  <text x="20" y="214" font-size="11" fill="#b4232c">gyro bias</text>
  <text x="82" y="214" font-size="11" fill="#f2b880">ARW</text>
  <text x="114" y="214" font-size="11" fill="#1d6fd1">accel bias</text>
  <text x="180" y="214" font-size="11" fill="#8fb8f0">VRW</text>
  <text x="214" y="214" font-size="11" fill="#6c7a93">initial velocity (dips at a zero crossing)</text>
</svg>
```
:::
