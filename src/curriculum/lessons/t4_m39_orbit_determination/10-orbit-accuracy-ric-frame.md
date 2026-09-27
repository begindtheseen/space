---
id: l10-orbit-accuracy-ric-frame
title: "Orbit accuracy metrics and covariance in the RIC frame"
minutes: 20
covers:
  - "Orbit accuracy metrics and covariance in the RIC (radial, in-track, cross-track) frame"
---

Imagine a friend running laps on a school track. You know roughly where she is. Ask yourself *how* you are unsure. You are pretty sure she is in her lane, so you know well how far she is from the middle of the field. You are sure she is on the track, not floating above it. What you are least sure about is how far around the lap she has got. And that doubt gets worse every lap: if she is a tiny bit slower than you think, by lap twenty she is a long way behind where you would guess.

A satellite is exactly that runner. Every **[[covariance|covariance-recap]]** in this module so far — the matrix that says how unsure we are about the state, and in which directions — has been written in inertial $x$, $y$, $z$ components, fixed to the stars. Those numbers are correct, but you cannot look at them and see the shape of the doubt. The tracking-geometry lesson's worst-observed direction was a mix of all six state components. The consider-covariance lesson's matrix was honest but told you nothing at a glance.

This lesson turns the same covariance so that its axes follow the orbit: up-and-down, along-the-track, and sideways. That frame is called **RIC** — **radial, in-track, cross-track**. Nothing about the uncertainty changes. You only look at it from the runner's point of view, and the shape jumps out: a long cigar pointing along the track, getting longer every lap. Then we ask the harder question: how do you know the covariance is telling the truth at all?

## The RIC frame

Stand on the satellite. Three directions are natural.

- **Radial** — straight up, away from Earth's center. Its unit vector is $\hat{\mathbf R}$, read "R hat". (A **unit vector** has length $1$ and only points.)
- **Cross-track** — sideways, out of the plane the orbit lies in. Its unit vector is $\hat{\mathbf C}$, "C hat". It points along the **[[orbit normal|orbit-normal]]**, the direction of the angular momentum $\mathbf h = \mathbf r \times \mathbf v$.
- **In-track** — forward along the path, finishing the set. Its unit vector is $\hat{\mathbf I}$, "I hat".

All three come straight out of the position $\mathbf r$ and velocity $\mathbf v$:

$$
\hat{\mathbf R} = \frac{\mathbf r}{r}, \qquad
\hat{\mathbf C} = \frac{\mathbf h}{h}, \qquad
\hat{\mathbf I} = \hat{\mathbf C}\times\hat{\mathbf R}.
$$

Here $r$ is the length of $\mathbf r$ and $h$ is the length of $\mathbf h$. Dividing a vector by its own length leaves a unit vector. The cross product in the last formula makes the three axes a **[[right-handed triad|right-handed-triad]]** — three mutually perpendicular directions ordered the same way as the $x$, $y$, $z$ axes you already use.

Notice that $\hat{\mathbf I}$ is built to be exactly perpendicular to $\hat{\mathbf R}$, inside the orbit plane. On a circular orbit that is exactly the velocity direction. On an **eccentric** (oval) orbit, the velocity also has a small up-or-down part, so $\hat{\mathbf I}$ and $\mathbf v$ differ by a small angle. $\hat{\mathbf I}$ is "forward along the local horizon", not "exactly where I am heading".

### Turning the covariance

Stack the three unit vectors as the rows of a $3\times3$ matrix:

$$
\mathbf T = \begin{pmatrix}\hat{\mathbf R}^\mathsf T\\ \hat{\mathbf I}^\mathsf T\\ \hat{\mathbf C}^\mathsf T\end{pmatrix}.
$$

Multiply any inertial vector by $\mathbf T$ and you get its three RIC components: each row takes a dot product, which asks "how much of this vector points along me?" A covariance changes frame the way every covariance does — sandwiched between the matrix and its transpose. Position and velocity are turned by the same $\mathbf T$, so the $6\times6$ version uses $\mathbf T$ twice, in blocks:

$$
\mathbf P_{\text{RIC}} = \begin{pmatrix}\mathbf T&\mathbf 0\\ \mathbf 0&\mathbf T\end{pmatrix}\mathbf P_{XYZ}\begin{pmatrix}\mathbf T&\mathbf 0\\ \mathbf 0&\mathbf T\end{pmatrix}^{\!\mathsf T}.
$$

The rows of $\mathbf T$ are unit vectors at right angles to each other, so $\mathbf T$ is an **[[orthogonal matrix|orthogonal-matrix]]**: a pure rotation. Nothing is added or lost. The total uncertainty is the same, and it is only re-described along axes a person can picture. The square roots of the diagonal of $\mathbf P_{\text{RIC}}$ are the familiar **sigmas**: $\sigma_R$, $\sigma_I$, $\sigma_C$ ("sigma R" and so on), each the one-standard-deviation uncertainty along one axis.

::: key RIC frame
Radial, In-track, Cross-track — the natural frame for orbit errors. Always report covariance in RIC, never in inertial Cartesian, because the physical structure is only visible in RIC. $\hat{\mathbf R}=\mathbf r/r$, $\hat{\mathbf C}=\mathbf h/h$, $\hat{\mathbf I}=\hat{\mathbf C}\times\hat{\mathbf R}$, and $\mathbf P_{\text{RIC}}=\mathrm{diag}(\mathbf T,\mathbf T)\,\mathbf P_{XYZ}\,\mathrm{diag}(\mathbf T,\mathbf T)^\mathsf T$ is a pure rotation.
:::

## Why in-track grows and the others do not

Back to the runner. Suppose you think she runs a lap in exactly $90$ seconds, but really she takes $91$. After one lap you are off by one second. After ten laps you are off by ten seconds. The error in *where she is along the track* keeps growing, because a wrong lap time is wrong on every lap.

For an orbit the "lap time" is the **period**, and **[[Kepler's third law|kepler-third-law]]** ties it to one thing only, the **semi-major axis** $a$ (half the long diameter of the orbit's oval; for a circle, the radius):

$$
T_{\text{period}}=2\pi\sqrt{\frac{a^3}{\mu}}.
$$

Here $\mu$ ("mu") is Earth's gravitational parameter, $3.986\times10^{14}\,\mathrm{m^3/s^2}$. A small error $\delta a$ ("delta a") in the semi-major axis makes a small error in the period. How small? Take the natural logarithm of both sides and then look at small changes (the step-by-step is in the note below):

$$
\frac{\delta T_{\text{period}}}{T_{\text{period}}} = \frac32\,\frac{\delta a}{a}.
$$

In words: a fractional error in $a$ becomes one and a half times that fractional error in the period.

The same idea works with the **mean motion** $n=\sqrt{\mu/a^3}$ — the average angle the satellite sweeps per second, in radians per second. Because $n$ goes like $a^{-3/2}$,

$$
\frac{\delta n}{n} = -\frac32\,\frac{\delta a}{a}.
$$

The minus sign says a bigger orbit turns more slowly. An error $\delta n$ in the turning rate, kept up for a time $t$, puts the satellite an angle $\delta n\,t$ away from where you predicted. Multiply by the radius $r$ to turn that angle into a distance along the track:

$$
\delta s_{\text{in-track}}(t) \approx r\,|\delta n|\,t = \frac{3}{2}\,r\,n\,\frac{|\delta a|}{a}\,t.
$$

The symbol $\delta s_{\text{in-track}}$ is the along-track distance error. The whole formula is **linear in $t$**: double the time, double the error. It never stops growing.

Radial and cross-track errors are different. An error that does not change $a$ does not change the period. So the wrong orbit and the true orbit still take the same time per lap, and they stay in step. A radial error only makes the orbit a little more oval or shifts where it is lowest. A cross-track error only tilts the orbit's plane a little. Either way, the gap between the two orbits swings back and forth once per orbit and comes back — it is **[[periodic, not secular|secular-periodic]]**. It stays bounded.

::: key Why the covariance is long in-track
A semi-major axis error changes the period, so along-track phase error grows linearly every revolution while radial and cross-track errors stay bounded and oscillatory. In symbols: $\delta T_{\text{period}}/T_{\text{period}}=\tfrac32\,\delta a/a$, so $\delta s_{\text{in-track}}(t)\approx\tfrac32\,r\,n\,(\delta a/a)\,t$.
:::

::: note Why it has to be true: the logarithm trick
Start from $T_{\text{period}}=2\pi\sqrt{a^3/\mu} = 2\pi\,a^{3/2}\mu^{-1/2}$. Take the natural log of both sides. Logs turn products into sums and powers into multipliers:

$$
\ln T_{\text{period}} = \ln(2\pi) + \tfrac32\ln a - \tfrac12\ln\mu.
$$

Now nudge $a$ by a small $\delta a$. The constants $\ln(2\pi)$ and $\ln\mu$ do not change. The derivative of $\ln x$ is $1/x$, so a small change in $\ln x$ is $\delta x/x$. Applying that to both sides gives

$$
\frac{\delta T_{\text{period}}}{T_{\text{period}}} = \frac32\,\frac{\delta a}{a}.
$$

The same steps on $n=\mu^{1/2}a^{-3/2}$ give $\ln n = \tfrac12\ln\mu-\tfrac32\ln a$, so $\delta n/n=-\tfrac32\,\delta a/a$. Multiplying by $n$ and using $r\approx a$ on a near-circular orbit: $r\,|\delta n| = \tfrac32\,r\,n\,|\delta a|/a$.
:::

## The mechanism, isolated

::: example Two orbits that differ only in size
Take two circular orbits at about $420\,\mathrm{km}$ altitude, the height of the International Space Station. Orbit A has $a = 6798.137\,\mathrm{km}$. Orbit B is identical except $a$ is $1\,\mathrm{km}$ bigger. So

$$
\frac{\delta a}{a} = \frac{1}{6798.137} \approx 1.471\times10^{-4}.
$$

**Step 1: the period.** Orbit A's period is $T_{\text{period}}=5578.2\,\mathrm s$, about $93$ minutes. Kepler's third law says B's period is longer by

$$
\delta T_{\text{period}} = \tfrac32 \times 1.471\times10^{-4} \times 5578.2\,\mathrm s \approx 1.23\,\mathrm s.
$$

So B arrives about $1.23$ seconds late at the end of every lap. At an orbital speed of about $7.66\,\mathrm{km/s}$, that is about $9.4\,\mathrm{km}$ behind per lap.

**Step 2: the drift rate.** The mean motion is $n = \sqrt{\mu/a^3} \approx 1.126\times10^{-3}\,\mathrm{rad/s}$. With $r = a$, the formula gives an in-track drift rate of

$$
\tfrac32\,n\,\delta a = \tfrac32 \times 1.126\times10^{-3}\,\mathrm{s^{-1}} \times 1000\,\mathrm m \approx 1.69\,\mathrm{m/s}.
$$

**Step 3: fly them.** Start both at the same point, fly them with pure two-body gravity (so nothing else is going on), and look at B's position in A's RIC frame after whole numbers of orbits:

```python
# n_orbits    t (s)      R (m)        I (m)       C (m)
#      0         0.0     1000.0          0.0        0.0
#      1      5578.2      993.5      -9424.4        0.0
#      2     11156.4      973.9     -18848.8        0.0
#      4     22312.9      895.5     -37697.5        0.0
#      8     44625.8      582.0     -75393.9        0.0
#     16     89251.6     -672.0    -150778.5        0.0
```

**Reading the table.** Cross-track is exactly zero. The two orbits lie in the same plane, so B never leaves A's plane.

In-track grows in a straight line. Double the orbits and the gap doubles: $-9424$, $-18849$, $-37698$, $-75394\,\mathrm m$. The slope is $150\,778.5\,\mathrm m$ over $89\,251.6\,\mathrm s$, about $1.69\,\mathrm{m/s}$ — the formula from Step 2. The sign is negative because B, the bigger orbit, is slower and falls behind.

Radial starts at the $1\,\mathrm{km}$ size difference and does not grow at all. The drop at the end, to $-672\,\mathrm m$, is not a real change in height. The RIC axes are straight lines, and the orbit is curved. When B is $150.8\,\mathrm{km}$ behind, the curve of the orbit has bent away below A's straight in-track axis by about $I^2/(2a)$, which is $\frac{150.8^2}{2 \times 6798}\,\mathrm{km} \approx 1.67\,\mathrm{km}$. That **[[curvature sag|curvature-sag]]** is all of it: $1000 - 1672 = -672\,\mathrm m$.

**Sanity check:** after $16$ orbits, a full day, a $1\,\mathrm{km}$ size error has become $150\,\mathrm{km}$ of along-track error. Tracking teams really do find their in-track predictions going stale far faster than anything else, so this makes sense.
:::

## The same thing in a real fit

The runner picture explains one wrong orbit. A covariance describes a whole cloud of possible orbits. The cloud does the same thing: every member with a slightly wrong $a$ drifts along the track at its own steady rate, and the cloud stretches along the track.

To see it, you move the covariance forward in time with the **state transition matrix** $\boldsymbol\Phi(t,t_0)$ (read "Phi of t, t nought"), the matrix from earlier lessons that carries a small change at the epoch $t_0$ to time $t$:

$$
\mathbf P(t)=\boldsymbol\Phi(t,t_0)\,\mathbf P_0\,\boldsymbol\Phi(t,t_0)^\mathsf T.
$$

Then turn $\mathbf P(t)$ into RIC with $\mathbf T$ built at that later time.

::: example An epoch covariance, carried forward a week
Here is the three-pass fit from the batch lesson: the same $420\,\mathrm{km}$, $51.6^\circ$ orbit with $e=0.001$, one ground station, range noise $5\,\mathrm m$ and range-rate noise $1\,\mathrm{mm/s}$. It was re-run for this lesson with two-body dynamics and a station at $45^\circ$ north, $120^\circ$ east, which sees three passes in the first four hours ($109$ epochs, $10\,\mathrm s$ apart). Its epoch covariance, turned into RIC and then carried forward:

```python
# t          R sigma (m)   I sigma (m)   C sigma (m)    I/R     I/C
# epoch          0.491         1.577         0.410        3.2     3.8
# +1 day         0.491         2.028         0.387        4.1     5.2
# +3 days        0.441         5.349         0.333       12.1    16.0
# +7 days        0.316        12.064         0.213       38.2    56.6
```

**Step 1: read the columns.** Radial and cross-track stay below half a metre all week. They wander a little but never grow. In-track goes from $1.6\,\mathrm m$ to $12\,\mathrm m$, and the ratio $I/R$ ("I over R") climbs from about $3$ to about $38$.

**Step 2: check it is linear.** From day 1 to day 3, in-track sigma grows by $5.349 - 2.028 = 3.321\,\mathrm m$, which is $1.66\,\mathrm m$ per day. From day 3 to day 7 it grows by $12.064 - 5.349 = 6.715\,\mathrm m$, which is $1.68\,\mathrm m$ per day. Steady, as the runner picture promised.

**Step 3: predict it from $\sigma_a$.** The same covariance says the semi-major axis is known to $\sigma_a \approx 0.0118\,\mathrm m$ — about a centimeter. The drift formula turns that into a growth rate:

$$
\tfrac32\,n\,\sigma_a = \tfrac32 \times 1.126\times10^{-3}\,\mathrm{s^{-1}} \times 0.0118\,\mathrm m \approx 1.99\times10^{-5}\,\mathrm{m/s}.
$$

A week is $604\,800\,\mathrm s$, so the week's growth is about $1.99\times10^{-5} \times 604\,800 \approx 12.0\,\mathrm m$. The full propagation says $12.06\,\mathrm m$. A one-centimeter doubt in the orbit's size has become a twelve-meter doubt in where the satellite is.

**Sanity check:** nothing in the matrix itself said "in-track is the danger". Only after carrying it forward and turning it into RIC does the shape, and how fast it is growing, become visible.
:::

::: warning A small epoch covariance does not mean a small covariance next week
The epoch ratio above, $I/R\approx3$, looks tame. A week of free flight turns the same covariance into a cigar almost forty times longer along the track than it is tall. Reporting only the epoch covariance, or only one number such as its trace (the sum of the variances), hides exactly what a collision check or a hand-off to another tracking station needs: how big the uncertainty will be, and in which direction, *at the time that matters*.
:::

## Beyond a single number: how accuracy is really judged

A formal covariance is the fit's own opinion of itself. It is computed from the noise levels and force models you gave the fit. If those were wrong — a force you left out, a noise level set too low, a station **bias** (a steady offset in its measurements) you never solved for — the covariance can look perfectly sensible and still be wrong.

So flight dynamics teams check from the outside. The most direct check is an **[[overlap comparison|overlap-comparison]]**. Fit two independent arcs of data that overlap in time — this week's data and last week's, or two different tracking networks over the same days. Carry both solutions to a common epoch and compare them. Two fits that should agree, and do not, are hard evidence about accuracy that no single fit can give you.

It works like checking your homework with a friend who solved it separately. You can be neat, confident, and consistent with yourself, and still be wrong. A second, independent answer is what catches it. This is the residual-editing lesson's warning, "converged is not correct", applied across two fits instead of inside one. Teams run it routinely before they trust a covariance enough to hand it to a collision check or a maneuver plan.

## Check yourself

::: check
A colleague reports "the position uncertainty is $50\,\mathrm{cm}$" without saying which frame or which time. What two pieces of information are missing before that number means anything?
:::

::: answer
**Which direction.** $50\,\mathrm{cm}$ radial and $50\,\mathrm{cm}$ in-track mean very different things. Radial stays bounded for as long as you keep propagating. In-track is a snapshot of a quantity that grows every orbit and may be many meters a week later.

**Which time (epoch).** As the worked example showed, the same covariance's in-track sigma grew from $1.6\,\mathrm m$ to $12\,\mathrm m$ in one week of free flight, while radial and cross-track stayed under half a meter. A sigma without a time is not a statement about accuracy.
:::

::: check
Why is the cross-track separation exactly zero in the two-orbit example? Would it stay zero if the two orbits also differed slightly in inclination?
:::

::: answer
Cross-track measures how far apart the objects are perpendicular to the orbit plane. The two orbits have the same inclination and the same node (RAAN), so they lie in the same plane, and $\hat{\mathbf C}\cdot(\mathbf r_B-\mathbf r_A)=0$ at every moment.

A small inclination or node difference tilts one plane against the other. Then the cross-track separation is no longer zero: it swings from one side to the other once per orbit, crossing zero where the two planes intersect. It stays bounded, like the radial part, because tilting a plane does not change the period.
:::

::: check
Using $\delta T_{\text{period}}/T_{\text{period}}=\tfrac32\,\delta a/a$, estimate how large a semi-major-axis error would cause a one-second period error on a $90$-minute orbit with $a\approx6800\,\mathrm{km}$. Why does that become an in-track error that keeps growing?
:::

::: answer
Turn the rule around: $\delta a/a = \tfrac23\,\delta T_{\text{period}}/T_{\text{period}}$. Ninety minutes is $5400\,\mathrm s$, so

$$
\frac{\delta a}{a} = \tfrac23\times\frac{1\,\mathrm s}{5400\,\mathrm s}\approx1.23\times10^{-4},
$$

and $\delta a \approx 1.23\times10^{-4} \times 6800\,\mathrm{km} \approx 0.84\,\mathrm{km}$. Less than a kilometer of size error makes a one-second timing error per orbit.

Under two-body motion $a$ does not change, so the period error is the same on every lap. After $N$ orbits the satellite is about $N$ seconds off in timing, which is about $N$ times the orbital speed in distance. It grows without limit, unlike a radial or cross-track error of the same starting size.
:::

::: check
At some moment a satellite is at $\mathbf r = (0,\ 7000,\ 0)\,\mathrm{km}$ with velocity $\mathbf v = (-7.5,\ 0,\ 0)\,\mathrm{km/s}$. Find $\hat{\mathbf R}$, $\hat{\mathbf C}$ and $\hat{\mathbf I}$. Its inertial position covariance is diagonal with sigmas $\sigma_x = 100\,\mathrm m$, $\sigma_y = 1\,\mathrm m$, $\sigma_z = 2\,\mathrm m$. What are $\sigma_R$, $\sigma_I$ and $\sigma_C$?
:::

::: answer
$\hat{\mathbf R} = \mathbf r/r = (0,\ 1,\ 0)$.

$\mathbf h = \mathbf r\times\mathbf v$. Its $z$ component is $r_x v_y - r_y v_x = 0 - 7000 \times (-7.5) = 52\,500\,\mathrm{km^2/s}$, and its other two components are zero. So $\hat{\mathbf C} = (0,\ 0,\ 1)$.

$\hat{\mathbf I} = \hat{\mathbf C}\times\hat{\mathbf R} = (0,0,1)\times(0,1,0) = (-1,\ 0,\ 0)$. That is exactly the velocity direction, as it should be: at this moment $\mathbf r\cdot\mathbf v = 0$, so the velocity has no up-or-down part.

So $\mathbf T$ only relabels the axes: R is $y$, I is minus $x$, C is $z$. A minus sign does not change a sigma. So $\sigma_R = 1\,\mathrm m$, $\sigma_I = 100\,\mathrm m$, $\sigma_C = 2\,\mathrm m$: a long in-track cigar, which you could only see once you asked which inertial axis pointed along the track.
:::

::: check
An operator has only ever looked at one fit's formal covariance and never compared it against an independent, overlapping solution. What kind of failure can that covariance never catch on its own?
:::

::: answer
A formal covariance is only as good as the noise and force models that produced it. If those models are subtly wrong in a way that pushes the fit off — a force left out, a noise level set wrong, a station bias never solved for or considered — the covariance can be completely self-consistent and still describe the wrong place, confidently.

Only comparing against an independently derived answer (different data, a different arc, a different processing choice) can reveal that kind of bias. No amount of staring at one fit's own reported uncertainty can tell a correct fit from a confidently wrong one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\mathbf R}=\mathbf r/r$, $\hat{\mathbf C}=\mathbf h/h$, $\hat{\mathbf I}=\hat{\mathbf C}\times\hat{\mathbf R}$ | RIC unit vectors, built from the state itself |
| $\mathbf P_{\text{RIC}}=\mathrm{diag}(\mathbf T,\mathbf T)\,\mathbf P_{XYZ}\,\mathrm{diag}(\mathbf T,\mathbf T)^\mathsf T$ | A pure rotation of the covariance; nothing gained or lost |
| $\delta T_{\text{period}}/T_{\text{period}} = \tfrac32\,\delta a/a$ | Kepler's third law, linearized; the source of in-track growth |
| $\delta s_{\text{in-track}}(t)\approx\tfrac32\,r\,n\,(\delta a/a)\,t$ | In-track error grows linearly with time |
| Radial and cross-track errors | Bounded; they swing once per orbit and do not accumulate |
| $I/R$ growing with time | Same covariance: about $3$ at epoch, about $38$ a week later |
| Overlap comparison | Independent outside check; catches a fit that is self-consistent but biased |

The RIC frame gave the covariance a physical shape. The next lesson uses that shape directly: it turns the uncertainty of two objects into the probability that they actually hit each other.

::: context covariance-recap What a covariance is, in one picture
A covariance is a matrix that describes a cloud of possible states. Its diagonal holds each component's **variance** (a sigma squared); the entries off the diagonal say how errors in two components move together. Draw the set of positions one sigma from the best guess and you get an ellipsoid, the **error ellipsoid**. Its long axis is the direction you know least well. After a few days of free flight, a low orbit's ellipsoid looks like this — the picture is not to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="330" y2="70" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polygon points="340,70 328,64 328,76" fill="#6c7a93"/>
  <text x="300" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">orbit track</text>
  <ellipse cx="70" cy="70" rx="16" ry="7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="70" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">at epoch</text>
  <ellipse cx="220" cy="70" rx="80" ry="5" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="220" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">a week later: a cigar</text>
  <line x1="24" y1="92" x2="24" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="24,44 19,54 29,54" fill="#1f2a44"/>
  <text x="32" y="56" font-size="11" fill="#1f2a44">R</text>
  <text x="180" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">shapes only, not to scale</text>
</svg>
```
:::

::: context orbit-normal The orbit normal and the angular momentum
"Normal" is the geometry word for "perpendicular". The orbit normal is the direction straight out of the flat plane the orbit lies in. You find it with a cross product: $\mathbf h = \mathbf r \times \mathbf v$ is at right angles to both position and velocity, so it points out of their plane. That vector is the **specific angular momentum**, and without thrust or other pushes it stays fixed, which is why the orbit plane does not wobble in simple two-body motion. Tip your right hand's fingers from $\mathbf r$ toward $\mathbf v$; your thumb points along $\mathbf h$.
:::

::: context right-handed-triad Three axes that ride along
The three RIC axes move with the satellite. Here the satellite is at the top of its orbit, moving to the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M 50.1 125 A 150 150 0 0 1 309.9 125" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="180" cy="200" r="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
  <line x1="180" y1="50" x2="180" y2="18" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="180,8 174,20 186,20" fill="#b4232c"/>
  <text x="190" y="20" font-size="12" fill="#b4232c">R: radial, up</text>
  <line x1="180" y1="50" x2="248" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="258,50 246,44 246,56" fill="#1d6fd1"/>
  <text x="262" y="46" font-size="12" fill="#1d6fd1">I: in-track</text>
  <circle cx="180" cy="50" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="174.3" y1="44.3" x2="185.7" y2="55.7" stroke="#1f2a44" stroke-width="2"/>
  <line x1="174.3" y1="55.7" x2="185.7" y2="44.3" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">C: cross-track, into the page</text>
</svg>
```

Check the order with the right-hand rule: fingers along R (up), curl toward I (right), and your thumb points into the page — that is C. The circle with a cross is the usual sign for an arrow going into the page.
:::

::: context orthogonal-matrix Why a rotation cannot add or remove doubt
A matrix whose rows are unit vectors at right angles is called **orthogonal**. Its transpose is its inverse: $\mathbf T\mathbf T^\mathsf T = \mathbf I$. Multiplying by it keeps every length and every angle the same, the way turning a photo on your desk does not change the size of anything in it. For a covariance, that means the sum of the variances (the trace) and the volume of the error ellipsoid are unchanged by the change to RIC. Only the labels on the axes move.
:::

::: context kepler-third-law A law found from watching planets
Johannes Kepler published his third law in 1619, from years of Tycho Brahe's careful observations of Mars and the other planets: the square of a planet's period is proportional to the cube of its orbit's size. Isaac Newton later showed why, from his law of gravity, and supplied the constant: $T_{\text{period}}^2 = 4\pi^2 a^3/\mu$. The same rule that sets a year for Earth sets about $93$ minutes for the Space Station. What matters here is what is missing from it: eccentricity and tilt do not appear, only $a$.
:::

::: context secular-periodic Two ways an error can behave
Astronomers call an effect **secular** when it keeps building up, and **periodic** when it swings back and forth and returns. The word comes from the Latin *saeculum*, "an age", because the first secular effects people noticed changed so slowly that they took ages to see. An in-track error from a wrong $a$ is secular. A radial or cross-track error with the right period is periodic. The same story is often told through **vis-viva**, the energy equation $v^2 = \mu(2/r - 1/a)$: anything that changes the orbit's energy — drag is the big one in low orbit — changes $a$, then the period, then the in-track error.
:::

::: context curvature-sag Straight axes on a curved path
The RIC axes are straight lines drawn at one point. The orbit bends away from them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="40" x2="335" y2="40" stroke="#1d6fd1" stroke-width="2"/>
  <text x="190" y="30" font-size="12" fill="#1d6fd1" text-anchor="middle">straight in-track axis</text>
  <path d="M 40 40 Q 185 40 330 100" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">the curved orbit</text>
  <circle cx="40" cy="40" r="5" fill="#1f2a44"/>
  <text x="40" y="62" font-size="11" fill="#1f2a44" text-anchor="middle">reference</text>
  <circle cx="330" cy="100" r="5" fill="#b4232c"/>
  <text x="330" y="122" font-size="11" fill="#b4232c" text-anchor="middle">far along</text>
  <line x1="330" y1="40" x2="330" y2="95" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="322" y="72" font-size="11" fill="#b4232c" text-anchor="end">sag about I²/2a</text>
</svg>
```

An object far along the same orbit sits "below" the straight axis by about $I^2/(2a)$, even at the same height above Earth. For large in-track gaps, engineers switch to **curvilinear** coordinates that measure along the curve, which removes this false radial part.
:::

::: context overlap-comparison How overlap checks are done in practice
A typical routine: fit seven days of tracking, then fit another seven days that shares, say, three of them. Carry both answers to a time inside the shared stretch and difference the positions in RIC. Collect many such differences over weeks and compare their spread with the sigmas the fits claimed. If the real differences are regularly two or three times bigger than the claimed sigmas, the covariance is **optimistic**, and teams scale it up — a **covariance realism** factor — before anyone uses it to decide whether to move a satellite.
:::
