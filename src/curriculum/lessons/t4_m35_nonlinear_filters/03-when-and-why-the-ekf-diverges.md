---
id: l03-when-and-why-the-ekf-diverges
title: When and why the EKF diverges
minutes: 19
covers:
  - When and why the EKF diverges
---

Stand on a sidewalk and watch a car drive past. While it is far down the street, its direction from you hardly changes: you barely turn your head. As it passes right in front of you, your head has to whip around. Then it is far away again, and your head is still. The closer something is, the faster its direction swings for the same motion.

A **bearing** sensor — one that reports only the direction to a target — lives with exactly this. That makes it a perfect trap for the Extended Kalman Filter. The EKF draws its straight-line approximation at its own *guess* of where the target is. If that guess lands close to the sensor, the straight line is drawn where directions swing wildly, and the filter can talk itself into believing something false with great confidence.

The Kalman filter module's divergence lesson showed a *linear* filter drifting away from the truth. The cause there was tuning: $\mathbf Q$ set too small, or a push the model left out. Fix the tuning and that problem goes away; the equations were never at fault. This lesson is about a stranger kind of **divergence** — a filter's estimate drifting away from the truth while it keeps claiming to be accurate. It happens even when $\mathbf Q$ and $\mathbf R$ are exactly right and the motion model is perfect. The only thing "wrong" is that the EKF must draw its straight line at its own estimate, and the estimate is not the truth.

## The mechanism

Recall the warning from the first lesson of this module. $\mathbf H_k$ is worked out at $\hat{\mathbf x}_k^-$, the filter's own prediction, never at the true state $\mathbf x_k$. Usually that is harmless: the prediction is close enough that the slope there is a fine stand-in for the slope at the truth.

Trouble starts when one bad update pushes the prediction somewhere the curve of $\mathbf h$ bends sharply, and that bend is nothing like the region where the truth actually is. The filter cannot know this. It computes $\mathbf S_k$ and $\mathbf K_k$ from that misleading $\mathbf H_k$ as if it were perfectly trustworthy.

::: key The EKF divergence mechanism
An update evaluated at a poor estimate can produce a covariance collapse — $\mathbf P_k^+$ shrinking far more than the *true* uncertainty warrants — because $(\mathbf I-\mathbf K_k\mathbf H_k)\mathbf P_k^-$ is entirely a function of the linearized $\mathbf H_k$, which does not know it was evaluated somewhere unrepresentative. Once $\mathbf P^+$ is too small, every subsequent $\mathbf K$ is too small to correct it: the filter becomes closed to the very measurements that could fix the mistake. This is a positive-feedback loop the linear Kalman filter cannot exhibit, because a linear filter's $\mathbf H$ never depends on the estimate in the first place.
:::

A **[[covariance collapse|collapse-picture]]** means the filter's reported uncertainty suddenly shrinks to a tiny value, though nothing it learned justifies it. **[[Positive feedback|positive-feedback]]** means the mistake feeds itself: small $\mathbf P$ gives small $\mathbf K$, small $\mathbf K$ ignores the readings that would reveal the mistake, and so $\mathbf P$ stays small.

::: key When the EKF fails
When the nonlinearity has significant curvature over the covariance spread, when the initial error is large, or when the Jacobian is evaluated at a bad estimate. The failure is biased mean and optimistic covariance, and it compounds.
:::

Here "biased mean" means the estimate is off in a consistent direction, not only randomly. "Optimistic covariance" means $\mathbf P$ claims more accuracy than the filter really has.

**Bearings-only tracking** — following a moving target using direction readings alone — is a standard, hard test of exactly this failure. Its Jacobian is not merely curved; it is **unbounded**, meaning it can grow without limit. With the sensor at the origin and the target at $(x,y)$, the first lesson of this module found

$$
\mathbf H = (-y/r^2,\ x/r^2,\ 0,\ 0), \qquad \|\mathbf H\| = \frac{\sqrt{x^2+y^2}}{r^2} = \frac{1}{r}.
$$

That is the **[[passing-car effect|passing-car]]** in one formula: as $r$ shrinks toward zero, the slope blows up. Any error that puts the filter's estimate near $r=0$ lands exactly where a small position doubt maps, through the straight line, into a huge — and false — claim about how much one bearing reading pins down the position.

## One run, tuned perfectly, that still fails

To judge whether a filter is honest you need a yardstick. The Kalman filter module's consistency-testing lesson built one: the **NEES**, $\mathbf e^{\mathsf T}\mathbf P^{-1}\mathbf e$, where $\mathbf e$ is the true error. It measures the error in units of the filter's own claimed uncertainty. For an honest filter with $n$ states, the NEES averages $n$. Here $n = 4$, so an honest filter's NEES hovers around $4$. A NEES of $500$ means the filter is badly overconfident.

::: example A single run, correctly tuned, that still diverges
A target starts at $\mathbf x_0=(300,\,50,\,-11,\,-1)$: $300\,\mathrm m$ east and $50\,\mathrm m$ north of the sensor, moving at $11\,\mathrm{m/s}$ west and $1\,\mathrm{m/s}$ south. It moves at nearly constant velocity with mild random pushes. A fixed bearing sensor at the origin reads every $\Delta t=1\,\mathrm s$ with noise $\sigma_\theta=2^\circ$, for 40 steps. The target's path takes it close past the sensor.

The filter starts *exactly* at the truth, $\hat{\mathbf x}_0^+=\mathbf x_0$, with an honest, not overconfident, prior $\mathbf P_0^+=\operatorname{diag}(60^2,60^2,2^2,2^2)$. Its $\mathbf Q$ and $\mathbf R$ match the simulation exactly. There is no tuning error anywhere.

| step | $r_{\text{true}}\,(\mathrm m)$ | position error $(\mathrm m)$ | NEES | $\operatorname{tr}\mathbf P$ (position block) |
| --- | --- | --- | --- | --- |
| 20 | 88.90 | 42.28 | 0.91 | 3340.2 |
| 24 | 46.31 | 26.91 | 0.34 | 3271.0 |
| 25 | 35.88 | 31.74 | 1.13 | 1587.1 |
| 26 | 25.53 | 16.50 | 3.94 | 965.5 |
| 27 | 15.53 | 6.44 | **519.29** | **2.50** |
| 28 | 7.58 | 2.13 | 510.73 | 2.95 |
| 29 | 10.24 | 9.38 | 432.52 | 1.08 |
| 30 | 19.64 | 4.33 | 184.56 | 0.72 |
| 35 | 71.66 | 15.94 | 137.98 | 3.31 |
| 40 | 122.70 | 26.42 | 97.38 | 11.70 |

The **trace** $\operatorname{tr}\mathbf P$ of the position block is the east variance plus the north variance, in $\mathrm{m^2}$. Up to step 26 the NEES sits near $4$ or below: the filter is honest. Now follow steps 26 and 27 closely.

**Step 26: an overshoot.** The prediction is $(53.96,\,21.14)\,\mathrm m$, so the filter thinks the range is $\hat r=\sqrt{53.96^2+21.14^2}=57.95\,\mathrm m$. The true range is only $25.53\,\mathrm m$. The guess is about twice as far out as the target — a real error, but not an extreme one, since the predicted $\operatorname{tr}\mathbf P$ is about $1643\,\mathrm{m^2}$, a standard deviation near $\sqrt{1643/2} \approx 29\,\mathrm m$ on each axis. The update, using $\mathbf H$ at that moderate range, makes a large but reasonable-looking correction. It **overshoots**. The next prediction, for step 27, lands at $(-3.94,\,5.49)\,\mathrm m$: past the sensor entirely, at $\hat r=6.76\,\mathrm m$.

**Step 27: the collapse.** At $\hat r = 6.76\,\mathrm m$, $\|\mathbf H\| = 1/6.76 = 0.148\,\mathrm{rad/m}$, between eight and nine times larger than at step 26. The filter's straight line now says that a modest position doubt means an enormous spread in bearing: $S=20.1\,\mathrm{rad^2}$, a standard deviation of $\sqrt{20.1} = 4.5\,\mathrm{rad}$. That is wider than the whole circle of possible bearings, $\pm\pi$. So the actual innovation of $-86.3^\circ$ — really a glaring sign that "the target is not where I put it" — looks, to the straight line, like an ordinary draw from a wide spread.

The update makes a small, confident correction, and the reported position covariance collapses from $994.1$ to $2.5\,\mathrm{m^2}$, a **99.7% drop**. The filter now claims to know the position to about a meter.

**After the collapse.** From then on $\mathbf K$ is too small to undo the mistake. The true error grows steadily, to $26\,\mathrm m$ by step 40, while the filter insists, with $\operatorname{tr}\mathbf P$ under $12\,\mathrm{m^2}$, that it knows the position to within a few meters. The NEES stays near $100$ or higher.
:::

```python
import numpy as np

def wrap(a): return (a+np.pi) % (2*np.pi) - np.pi
def h(x): return np.arctan2(x[1], x[0])
def Hjac(x):
    r2 = x[0]**2+x[1]**2
    return np.array([-x[1]/r2, x[0]/r2, 0.0, 0.0])

dt = 1.0
F = np.array([[1,0,dt,0],[0,1,0,dt],[0,0,1,0],[0,0,0,1]])
q = 0.01
Q = q*np.array([[dt**3/3,0,dt**2/2,0],[0,dt**3/3,0,dt**2/2],
                [dt**2/2,0,dt,0],[0,dt**2/2,0,dt]])
sigma_th = np.radians(2.0); R = sigma_th**2

def run(seed, show=()):
    rng = np.random.default_rng(seed)
    x_true = np.array([300.0, 50.0, -11.0, -1.0])
    x = x_true.copy(); P = np.diag([60.0**2,60.0**2,2.0**2,2.0**2])
    nees = []
    for k in range(40):
        x_true = F@x_true + rng.multivariate_normal(np.zeros(4), Q)
        z = h(x_true) + rng.normal(0, sigma_th)
        xm = F@x; Pm = F@P@F.T + Q
        Hm = Hjac(xm)
        S = Hm@Pm@Hm.T + R
        K = Pm@Hm.T/S
        x = xm + K*wrap(z-h(xm))
        P = (np.eye(4)-np.outer(K,Hm))@Pm
        e = x_true - x
        nees.append(e@np.linalg.solve(P, e))
        if k+1 in show:
            print(k+1, np.round(xm[:2],2), round(np.hypot(*xm[:2]),2), round(np.trace(P[:2,:2]),2))
    return np.array(nees)

run(7, show=(26, 27))
# 26 [53.96 21.14] 57.95 965.54
# 27 [-3.94  5.49] 6.76 2.5

late = np.array([run(1000+s)[-10:].mean() for s in range(50)])
print(np.median(late), late.mean(), (late > 20).sum(), late.max())
# 3.84... 49.17... 5 1813.57...
```

::: note Why a small P locks the door
The gain is $\mathbf K_k=\mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}$. For one reading, with $\mathbf H\mathbf P^-\mathbf H^{\mathsf T}$ small next to $\mathbf R$, this is about $\mathbf P_k^-\mathbf H_k^{\mathsf T}/R$: the gain grows in proportion to $\mathbf P$. After a collapse, the next prediction is $\mathbf P_k^- = \mathbf F\mathbf P_{k-1}^+\mathbf F^{\mathsf T}+\mathbf Q$. That starts from the collapsed value and adds only one step's worth of $\mathbf Q$, which is small when the filter is tuned for a gently moving target. So the gain stays small, and each update can move the estimate only a little, however large the innovation. The door the readings would come through has been shut by the filter's own overconfidence.
:::

## It is not always this dramatic — and that is the point

One run could be bad luck. So run the same scenario many times, each with different random noise. That is a **[[Monte Carlo|monte-carlo]]** test.

::: example Fifty independent trials, correctly tuned, same geometry
Repeat the scenario 50 times with fresh, independent random pushes and sensor noise each time. For each run, average the NEES over its last ten steps. An honest filter should give about $4$.

**The middle run is fine.** The **median** — the middle value when all 50 are sorted — is $3.84$. That is right where a healthy four-state filter should sit.

**The average is not.** The **mean** of the 50 values is $49.17$, more than twelve times the median. A few runs with enormous NEES drag it up; the **[[median ignores them, the mean does not|median-vs-mean]]**.

**Counting the bad runs.** Call a run diverged if its late mean NEES is above $20$, five times the honest value of $4$. Five of the fifty qualify, a rate of $10\%$. The worst has a late mean NEES of $1813.6$. Its true error sits about $\sqrt{1813.6} \approx 42.6$ of its own claimed standard deviations away — a filter completely sure of an answer that is badly wrong.

**Sanity check.** Fifty runs is a small sample, so is $10\%$ trustworthy? Repeating the test with 500 runs gives a divergence rate of $9.8\%$. The number holds up.
:::

The median run in that batch is fine. A filter that happens not to land near $r=0$ at a moment of large doubt tracks the target well, and reports a covariance that matches its real accuracy — as the consistency-testing lesson wants. That is the uncomfortable shape of this failure. The EKF is not *usually* wrong on this problem. It is *occasionally, badly and silently* wrong. A single test run, or a single flight, has a real chance of never meeting it, and a real chance of walking straight into it.

::: key Divergence here is a tail-risk problem, not an average-case one
Across the fifty-trial batch, the *median* behavior looked perfectly healthy; the *mean* was dominated by rare, severe covariance collapses. A design review that checks only a few Monte Carlo runs, or only summary statistics like mean RMSE, can miss exactly the failure mode that matters most for a safety-critical system: the rare run where the filter is confidently, catastrophically wrong.
:::

A **tail risk** is a rare outcome far out in the "tail" of the spread of results — unlikely, but severe. **RMSE**, the root-mean-square error, is the usual one-number accuracy score; it can look acceptable even when a few runs are disasters.

::: warning This is not the same as mistuned process noise
The Kalman filter module's process-noise-tuning and filter-divergence lessons showed divergence from $\mathbf Q$ or $\mathbf R$ not matching reality. That kind is fixed by better tuning, and caught by the consistency tests that module built. Nothing here is mistuned. $\mathbf Q$ and $\mathbf R$ are exactly right, and the motion model is exact. The cause is only that $\mathbf H$ is worked out at an estimate, not the truth. No amount of retuning removes that gap. The real remedies change *how the curved function itself is approximated* — which is where this module goes next.
:::

::: warning A collapse looks, for a moment, like great performance
Right after the step-27 update, $\operatorname{tr}\mathbf P$ fell to $2.5\,\mathrm{m^2}$. On a flight dashboard, with no truth to compare against, that looks like a filter that has suddenly nailed the target's position. Telling "the filter got much better information" apart from "the filter drew its straight line somewhere it should not have" is exactly what the **[[NIS test|nis-check]]** from the consistency-testing lesson is for. It uses only quantities a real flight computer has, no truth required. A sudden, large drop in reported covariance is a moment to check the NIS, not to celebrate.
:::

## Check yourself

::: check
Using the numbers from the worked example, explain why the update at step 26 *overshot* instead of making a correction of the right size.
:::

::: answer
At step 26 the prediction was about twice as far from the sensor as the truth ($57.95\,\mathrm m$ against $25.53\,\mathrm m$), with a large predicted $\operatorname{tr}\mathbf P\approx1643\,\mathrm{m^2}$. The gain, built from $\mathbf H$ at that moderate range, was large enough to move the estimate a long way in one step. It moved it right past the sensor, to a predicted range of $6.76\,\mathrm m$ at step 27, instead of near the true $25.53\,\mathrm m$.

In straight-line terms, the update was reacting correctly to a real innovation. It had no way to know that the bearing function curves, so its correction would carry the estimate into a region where the same straight line is a far worse description than where it was drawn.
:::

::: check
Why does a covariance collapse, once it happens, tend to stay instead of fixing itself at the next update?
:::

::: answer
The gain $\mathbf K_k=\mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}$ grows with $\mathbf P_k^-$. After a collapse, the next prediction $\mathbf P_k^- = \mathbf F\mathbf P_{k-1}^+\mathbf F^{\mathsf T}+\mathbf Q$ starts from the same small value, plus one step's modest $\mathbf Q$. So the next gain is small too, and the update can only make a small correction, however large the innovation.

The filter has locked its own door: it no longer trusts new readings enough to let them move the estimate far. That is why the true error in the example kept growing, to $26\,\mathrm m$ by step 40, instead of shrinking back after the bad step.
:::

::: check
A flight team runs this exact filter on one Monte Carlo trial before launch and sees healthy NEES throughout. Is that good evidence the filter is safe to fly?
:::

::: answer
No, not on its own. The batch in this lesson showed about a $10\%$ rate of severe collapse with identical tuning and geometry. So a single trial has roughly a $90\%$ chance of looking perfectly healthy even though the failure is real.

This is why the consistency-testing lesson insisted on many independent runs before drawing conclusions. A rare, catastrophic failure can be invisible in a small sample and still be unacceptable in flight. Even three healthy runs in a row would happen with probability $0.9^3 \approx 0.73$.
:::

::: check
Suppose the sensor measured **range** instead of bearing, $h(\mathbf x)=\sqrt{x^2+y^2}$. Would you expect the same near-the-sensor divergence to be as severe? Why or why not?
:::

::: answer
Less severe. The bearing Jacobian has size $1/r$, which blows up as the target nears the sensor. That is exactly what turned a modest position error near the origin into a huge, false claim of information.

The range Jacobian, $\mathbf H=(x/r,\,y/r,\,0,\,0)$, has size $1$ for every $r>0$. It never grows without limit. Range readings are still curved, and can still be linearized at a poor estimate and mislead the filter. But the particular runaway slope near the origin that drove this lesson's example would not appear in the same form.
:::

::: check
The worked example started the filter exactly at the truth. Does that mean a poor starting guess is not needed for this kind of divergence?
:::

::: answer
Right — and that is the more unsettling lesson of the example. Divergence did not need a bad prior. It needed only that the estimate, through ordinary predictions and correctly computed updates, passed close enough to the sensor for the sensor's own curve to overwhelm one straight-line approximation.

A better start makes this rarer, but it cannot remove the mechanism. The estimate can still wander into a sharply curved region through the ordinary mix of random pushes and sensor noise along the way.
:::

## Summary

| Item | Statement |
| --- | --- |
| Divergence mechanism | $\mathbf H_k$ worked out at a poor $\hat{\mathbf x}_k^-$ can collapse $\mathbf P_k^+$ far below the true uncertainty; the small $\mathbf K$ that follows stops later readings from fixing the mistake |
| Not a tuning problem | $\mathbf Q$, $\mathbf R$ and the motion model can all be exactly right and this still happens, because it comes from linearizing about the estimate |
| When the EKF fails | Strong curvature over the covariance spread, large initial error, or a Jacobian at a bad estimate; the result is a biased mean and an optimistic covariance |
| Bearing sensor | $\|\mathbf H\| = 1/r$, unbounded near the sensor |
| Worked case | Tuned perfectly; one update cut $\operatorname{tr}\mathbf P$ by $99.7\%$ (from $994.1$ to $2.5$) after the estimate overshot past the sensor; NEES reached $519$ against an honest value of $4$ |
| Tail risk | 50 trials: median NEES $3.84$ (healthy), mean $49.17$ (dragged up by outliers), $10\%$ diverged; 500 trials: $9.8\%$ |
| Catching it live | A sudden, large drop in reported covariance is the moment to run the NIS check, which needs no truth |

Two remedies appear later in this module. The unscented Kalman filter replaces the single straight line with several evaluations of the true curved $\mathbf h$; the next lesson builds it from the ground up. The particle filter goes further, for problems where even that is not enough because the posterior is not one bell-shaped hump at all. And the module's EKF-against-UKF exercise adds a second difficulty of bearings-only tracking: [[range that bearings alone cannot see|observer-maneuver]].

::: context collapse-picture What a collapse looks like
Here is the worked run from step 16 to step 40, on a scale where each gridline is ten times the one below. The blue line is the spread the filter claims, $\sqrt{\operatorname{tr}\mathbf P}$ for position. The red line is the actual position error. Up to step 26 the claim sits above the error: honest. At step 27 the claim plunges below two meters and stays low, while the real error bounces between about 2 and 10 meters and then climbs to 26.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="345" y2="150" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="50" y1="15" x2="50" y2="150" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="44" y="137" font-size="11" fill="#1f2a44" text-anchor="end">1 m</text>
  <text x="44" y="80" font-size="11" fill="#1f2a44" text-anchor="end">10 m</text>
  <text x="44" y="24" font-size="11" fill="#1f2a44" text-anchor="end">100 m</text>
  <line x1="50" y1="76.5" x2="345" y2="76.5" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3 3"/>
  <line x1="50" y1="133" x2="345" y2="133" stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="50,35 62,35 74,34 86,34 98,33 110,33 122,34 135,33 147,34 159,43 171,49 183,122 195,120 207,132 219,137 231,137 243,132 255,127 268,123 280,118 292,115 304,111 316,108 328,105 340,103"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.2" points="50,66 62,54 74,53 86,48 98,41 110,45 122,43 135,42 147,52 159,48 171,64 183,87 195,114 207,78 219,97 231,86 243,79 255,73 268,69 280,65 292,62 304,59 316,57 328,55 340,53"/>
  <line x1="183" y1="150" x2="183" y2="155" stroke="#1f2a44"/>
  <text x="183" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">step 27</text>
  <text x="50" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">16</text>
  <text x="340" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">40</text>
  <text x="232" y="152" font-size="11" fill="#1d6fd1">claimed spread</text>
  <text x="250" y="48" font-size="11" fill="#b4232c">actual error</text>
</svg>
```
:::

::: context positive-feedback Loops that feed themselves
In a positive-feedback loop, a change causes more of the same change. A microphone too close to its own speaker squeals: sound is picked up, made louder, played, picked up again. Negative feedback does the opposite and calms things down, like a thermostat. A healthy Kalman filter runs on negative feedback: a big surprise makes it trust the readings more and correct itself. The collapse turns that around. Overconfidence makes it trust the readings less, which keeps it overconfident.
:::

::: context passing-car Why close things swing fast
Here a car moves along a road at a steady speed, shown at equal time steps. The lines show the direction from you to the car at each step. Far away, the lines bunch together: the direction barely changes. Right in front of you, they fan out: the same step of motion turns the direction by much more. That spreading is the $1/r$ in the bearing Jacobian.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="50" x2="350" y2="50" stroke="#6c7a93" stroke-width="2"/>
  <text x="14" y="40" font-size="11" fill="#6c7a93">road</text>
  <g stroke="#8fb8f0" stroke-width="1.5">
    <line x1="180" y1="150" x2="20" y2="50"/><line x1="180" y1="150" x2="60" y2="50"/>
    <line x1="180" y1="150" x2="100" y2="50"/><line x1="180" y1="150" x2="140" y2="50"/>
    <line x1="180" y1="150" x2="180" y2="50"/><line x1="180" y1="150" x2="220" y2="50"/>
    <line x1="180" y1="150" x2="260" y2="50"/><line x1="180" y1="150" x2="300" y2="50"/>
    <line x1="180" y1="150" x2="340" y2="50"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="20" cy="50" r="4"/><circle cx="60" cy="50" r="4"/><circle cx="100" cy="50" r="4"/>
    <circle cx="140" cy="50" r="4"/><circle cx="180" cy="50" r="4"/><circle cx="220" cy="50" r="4"/>
    <circle cx="260" cy="50" r="4"/><circle cx="300" cy="50" r="4"/><circle cx="340" cy="50" r="4"/>
  </g>
  <circle cx="180" cy="150" r="6" fill="#1f2a44"/>
  <text x="192" y="168" font-size="11" fill="#1f2a44">you (the sensor)</text>
  <text x="200" y="30" font-size="11" fill="#1f2a44">equal steps of the car</text>
</svg>
```
:::

::: context monte-carlo Named after a casino
Monte Carlo methods are named after the casino in Monaco. Stanislaw Ulam and John von Neumann used random sampling in the 1940s at Los Alamos to study problems too hard to solve with pencil and paper, and the code name stuck. For filters, a Monte Carlo campaign means running hundreds or thousands of simulated flights, each with fresh random noise, and looking at the whole spread of results — especially the worst ones. Flight programs routinely run thousands of cases before trusting a navigation filter.
:::

::: context median-vs-mean One billionaire in the room
Put nine people who each earn a normal salary in a room with one billionaire. The median income — the middle person — is still a normal salary. The mean income is suddenly enormous. The mean listens to every value, including one extreme outlier; the median does not. That is why the batch's median NEES looked healthy while its mean was twelve times larger: a handful of disastrous runs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="106" x2="345" y2="106" stroke="#6c7a93" stroke-width="1.2"/>
  <g fill="#1d6fd1"><circle cx="48" cy="100" r="3"/><circle cx="72" cy="100" r="3"/><circle cx="78" cy="100" r="3"/><circle cx="78" cy="93" r="3"/><circle cx="84" cy="100" r="3"/><circle cx="84" cy="93" r="3"/><circle cx="90" cy="100" r="3"/><circle cx="90" cy="93" r="3"/><circle cx="90" cy="86" r="3"/><circle cx="96" cy="100" r="3"/><circle cx="96" cy="93" r="3"/><circle cx="96" cy="86" r="3"/><circle cx="102" cy="100" r="3"/><circle cx="102" cy="93" r="3"/><circle cx="102" cy="86" r="3"/><circle cx="102" cy="79" r="3"/><circle cx="102" cy="72" r="3"/><circle cx="102" cy="65" r="3"/><circle cx="102" cy="58" r="3"/><circle cx="102" cy="51" r="3"/><circle cx="108" cy="100" r="3"/><circle cx="108" cy="93" r="3"/><circle cx="108" cy="86" r="3"/><circle cx="108" cy="79" r="3"/><circle cx="108" cy="72" r="3"/><circle cx="108" cy="65" r="3"/><circle cx="114" cy="100" r="3"/><circle cx="114" cy="93" r="3"/><circle cx="114" cy="86" r="3"/><circle cx="114" cy="79" r="3"/><circle cx="114" cy="72" r="3"/><circle cx="120" cy="100" r="3"/><circle cx="120" cy="93" r="3"/><circle cx="120" cy="86" r="3"/><circle cx="120" cy="79" r="3"/><circle cx="126" cy="100" r="3"/><circle cx="132" cy="100" r="3"/><circle cx="132" cy="93" r="3"/><circle cx="132" cy="86" r="3"/><circle cx="132" cy="79" r="3"/><circle cx="132" cy="72" r="3"/><circle cx="138" cy="100" r="3"/><circle cx="138" cy="93" r="3"/><circle cx="138" cy="86" r="3"/><circle cx="168" cy="100" r="3"/><circle cx="204" cy="100" r="3"/><circle cx="210" cy="100" r="3"/><circle cx="216" cy="100" r="3"/><circle cx="252" cy="100" r="3"/><circle cx="324" cy="100" r="3"/></g>
  <line x1="110.3" y1="30" x2="110.3" y2="112" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="198.2" y1="30" x2="198.2" y2="112" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="104" y="24" font-size="11" fill="#1f2a44" text-anchor="end">median 3.84</text>
  <text x="204" y="24" font-size="11" fill="#b4232c">mean 49.17</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="63.9" y="124">1</text><text x="143.3" y="124">10</text><text x="222.7" y="124">100</text><text x="302.1" y="124">1000</text>
  </g>
  <text x="192" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">late mean NEES of each of 50 runs (log scale)</text>
</svg>
```
:::

::: context nis-check A truth-free lie detector
The NIS, normalized innovation squared, is $\boldsymbol\nu^{\mathsf T}\mathbf S^{-1}\boldsymbol\nu$: the surprise in each reading, measured against how surprised the filter expected to be. It needs no truth, only the reading and the filter's own numbers, so it can run on board. For one bearing reading it should average $1$. In the worked run it was only $0.11$ at step 27 itself, because the inflated $S$ hid the surprise. But at steps 28, 29 and 30 it jumped to $30$, $33$ and $145$: a loud alarm, one step late. After that it quiets down again, because the filter has settled on a wrong answer that the new readings no longer contradict strongly — which is why an alarm has to be acted on when it rings.
:::

::: context observer-maneuver Why the observer usually has to move
There is a deeper weakness in bearings-only tracking with a still sensor. Take any target path at constant velocity and scale it up — twice as far, twice as fast. Every bearing stays exactly the same. So bearings alone cannot tell range from a fixed spot: range is not **observable**, in the sense of the Kalman module's observability lesson. Only the prior pinned it down in this lesson's example. Submarines tracking by sonar solve this by turning partway through, so the geometry changes. This module's EKF-against-UKF exercise asks you to show that effect.
:::
