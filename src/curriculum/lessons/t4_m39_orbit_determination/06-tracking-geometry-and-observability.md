---
id: l06-tracking-geometry-and-observability
title: Station and tracking geometry and its effect on observability
minutes: 19
covers:
  - Station and tracking geometry and its effect on observability
---

Close one eye and try to touch two pencil tips together at arm's length. It is surprisingly hard. With one eye you still see *which way* each tip is, very sharply, but you have almost no sense of *how far*. Open the other eye and it becomes easy. Nothing about your eyesight got sharper. What changed is the **[[viewpoint|two-viewpoints]]**: two eyes a few centimeters apart see the scene from two slightly different places, and that difference is what reveals depth.

Orbit determination has exactly this problem. Tracking data can be extremely precise and still leave some combination of position and velocity almost untouched, because every measurement looked at the spacecraft from nearly the same angle. Whether the data can pin down every part of the state is called **observability**. This lesson is about how the geometry of the tracking — how long a pass, how many passes, which stations — decides it.

The batch lesson already met one kind of badly conditioned normal matrix $\boldsymbol\Lambda$: in kilometers and seconds it looked terrible, and switching to canonical units fixed it completely. That was a problem of *units*. This lesson is about a deeper kind of ill-conditioning that no change of units touches: the case where the tracking data itself, however precise and however carefully scaled, does not constrain some direction of the state. It is the same condition-number idea the least-squares module built for a fixed measurement geometry, now applied to geometry that moves.

## Observability is a property of the geometry, not the noise

Picture finding a boat from two lighthouses. Each gives you a bearing line, and the boat is where the lines cross. If the two lines cross at a right angle, the crossing point is sharp. If they are **[[nearly parallel|nearly-parallel]]**, a tiny wobble in either line slides the crossing point a long way. The boat is well located *across* the lines and badly located *along* them.

Orbit determination works the same way, in six dimensions instead of two. Each measurement gives a row of the design matrix $\widetilde{\mathbf H}$ (from the batch lesson: the measurement partials mapped back to the epoch through $\boldsymbol\Phi$). Each row is like one bearing line. If all the rows point in nearly the same few directions, some other direction of the state is barely constrained, however many rows there are.

Formally, a state is **observable** from an arc of data when

$$
\boldsymbol\Lambda=\sum\widetilde{\mathbf H}_i^\mathsf T\mathbf W_i\widetilde{\mathbf H}_i
$$

is nonsingular (it has an inverse). In practice that is not enough: it must be *well conditioned*, so that solving for $\delta\mathbf x_0$ does not blow round-off or noise up into a useless answer.

Perfect, noise-free measurements do not rescue a degenerate geometry. If every observation in an arc is sensitive to the same combination of state components and blind to some other combination, no amount of precision tells you anything about the combination it cannot see. What an *arc* adds, compared with one instant, is that the geometry changes as the spacecraft moves — and that change is the only thing that can resolve directions a single look cannot.

### Measuring how lopsided the data is

The tool for measuring this is the **[[singular value decomposition|singular-values]]**, or SVD. Every matrix, however messy, stretches some directions more than others. The SVD finds those directions and the stretch factor along each one. The stretch factors are the **singular values** $s_1 \ge s_2 \ge \dots \ge s_6$. A big $s$ means the data is very sensitive to that direction of the state; a tiny $s$ means it barely notices it.

The **condition number** is the ratio of the largest to the smallest:

$$
\operatorname{cond}(\widetilde{\mathbf H}) = \frac{s_{\max}}{s_{\min}}.
$$

A condition number of $1$ means every direction is seen equally well. A condition number of $10^{11}$ means one direction is seen a hundred billion times more weakly than another.

To make the numbers mean something, $\widetilde{\mathbf H}$ is taken in two careful forms. Its rows are divided by each measurement's noise $\sigma$, so every row counts in units of "how many sigmas". Its columns are in the **[[canonical units|canonical-units]]** of the batch lesson, so position and velocity are on the same footing and the kilometers-and-seconds problem is gone. Whatever lopsidedness is left is real.

::: example Where the conditioning actually comes from
Use the same $420\,\mathrm{km}$ orbit as the last two lessons, a station at $40^\circ$ N, range and range-rate every $10\,\mathrm s$ above $10^\circ$ elevation, and the noise levels $5\,\mathrm m$ and $1\,\mathrm{mm/s}$. Build the weighted, non-dimensional $\widetilde{\mathbf H}$ for several different arcs and take its singular values directly with an SVD:

| arc | looks | $\operatorname{cond}(\widetilde{\mathbf H})$ |
| --- | --- | --- |
| first 60 s of one pass | 7 | $2.27\times10^{11}$ |
| first 120 s of that pass | 13 | $4.19\times10^{10}$ |
| the whole pass (380 s) | 39 | $6.57\times10^{9}$ |
| that pass plus the next one, about 1.5 h later | 66 | $2.73\times10^{4}$ |
| three passes spread over 12 h | 99 | $1.28\times10^{4}$ |

**Longer pass.** Stretching one pass from $60\,\mathrm s$ to its full $380\,\mathrm s$ improves the condition number by a factor of about $35$ — about one and a half orders of magnitude.

**Second pass.** Adding one *more* pass, separated in time rather than merely longer, improves it by a factor of about $240\,000$ — more than five orders of magnitude.

Why such a difference? Within one pass the viewing geometry changes only gradually. The station sees a short, nearly straight stretch of the orbit, and many nearby orbits would draw almost the same stretch. This is closely related to why the short-arc Gibbs and Gauss solutions of the initial-orbit-determination lesson struggled: not enough of the orbit's curve had been sampled. A second pass, an orbit later, sees the spacecraft from a new place in its orbit and from a new place in the station's own ride around the spinning Earth. It is almost a new pair of eyes.

**What this does to the normal matrix.** The batch lesson showed $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$. For the $60\,\mathrm s$ arc that is about $(2.27\times10^{11})^2 \approx 5.15\times10^{22}$. A 64-bit number keeps only about $16$ significant digits, so a matrix with that spread cannot be stored faithfully at all. When the computer actually forms $\boldsymbol\Lambda$ for this arc and asks for its eigenvalues, it reports a condition number of only about $6\times10^{16}$ (wrong by a factor of about a million) and a smallest eigenvalue of about $-7$ — a *negative* eigenvalue, which a matrix of the form $\widetilde{\mathbf H}^\mathsf T\widetilde{\mathbf H}$ can never really have. Solving the normal equations for an arc this short does not only give an imprecise answer; it can fail outright from round-off, before noise even enters.
:::

::: warning Units and observability are different problems
The batch lesson's bad conditioning vanished when position and velocity were put in comparable canonical units. The conditioning in this lesson does not: every number in the table above is already in canonical units. If rescaling fixes it, it was a units problem. If it survives rescaling, it is geometry, and only different or more varied data can fix it.
:::

## Reading the covariance ellipsoid

The covariance $\mathbf P=\boldsymbol\Lambda^{-1}$ can be pictured as an ellipsoid — a stretched ball — in the six-dimensional state space. Its *shape*, not just its overall size, is what "observable in some directions and not others" looks like as numbers instead of a claim.

The SVD hands you that shape directly. The directions it finds (the right singular vectors of $\widetilde{\mathbf H}$) are the axes of the ellipsoid, and the $1\sigma$ half-length along axis $i$ is

$$
\sigma_i = \frac{1}{s_i}.
$$

So a big singular value means a short axis (well known), and a small one means a long axis (poorly known).

::: note Why it has to be true: sigma is one over the singular value
Write the SVD as $\widetilde{\mathbf H} = \mathbf U\,\mathbf\Sigma\,\mathbf V^\mathsf T$, where $\mathbf U$ and $\mathbf V$ are rotations (their columns are perpendicular unit vectors) and $\mathbf\Sigma$ holds the singular values on its diagonal. The rows of $\widetilde{\mathbf H}$ are already weighted, so $\mathbf W$ is the identity here and

$$
\boldsymbol\Lambda = \widetilde{\mathbf H}^\mathsf T\widetilde{\mathbf H} = \mathbf V\,\mathbf\Sigma^\mathsf T\mathbf U^\mathsf T\mathbf U\,\mathbf\Sigma\,\mathbf V^\mathsf T = \mathbf V\,\mathbf\Sigma^2\,\mathbf V^\mathsf T,
$$

because $\mathbf U^\mathsf T\mathbf U = \mathbf I$. Inverting a rotation is transposing it, so

$$
\mathbf P = \boldsymbol\Lambda^{-1} = \mathbf V\,\mathbf\Sigma^{-2}\,\mathbf V^\mathsf T.
$$

Along the $i$-th column of $\mathbf V$ the variance is $1/s_i^2$, so the standard deviation is $1/s_i$. It also shows why the eigenvalues of $\boldsymbol\Lambda$ are the *squares* $s_i^2$ — and so why its condition number is the square of $\widetilde{\mathbf H}$'s.
:::

::: example The worst- and best-observed directions
Take the singular values of $\widetilde{\mathbf H}$ for the shortest and the longest arcs of the first example. Distances are in canonical units, where one unit is Earth's radius, $6378\,\mathrm{km}$.

**The 60-second arc.** The smallest singular value is $s_{\min} = 0.00624$, so the worst direction has

$$
\sigma_{\text{worst}} = \frac{1}{0.00624} \approx 160
$$

canonical units — a hundred and sixty Earth radii. That direction is, for every practical purpose, not measured at all. The largest singular value is $s_{\max} = 1.41\times10^9$, so the best direction has $\sigma_{\text{best}} \approx 7.1\times10^{-10}$ units, a few millimeters' worth. The ratio of worst to best is the condition number, $2.27\times10^{11}$: from the same seven looks, one combination of the state is known exquisitely and another not at all.

**The 12-hour, three-pass arc.** Now $s_{\min} = 3.99\times10^6$ and $s_{\max} = 5.11\times10^{10}$, so

$$
\sigma_{\text{worst}} \approx 2.5\times10^{-7}, \qquad \sigma_{\text{best}} \approx 2.0\times10^{-11}
$$

canonical units — about $1.6\,\mathrm m$ and $0.13\,\mathrm{mm}$ in position terms. The worst-to-best ratio has narrowed to about $12\,800$. Still very lopsided — an ellipsoid, never a sphere, is the normal shape of an orbit covariance — but no longer catastrophic.

Neither direction, written as raw inertial $(x, y, z, v_x, v_y, v_z)$ components, is easy to read by eye: each is a mixture of all six. Turning that mixture into directions with physical meaning — radial, along-track, cross-track — is exactly what the RIC-frame lesson later in this module does with results like these.
:::

::: key Observability is about direction, conditioning is about degree
A short or repetitive arc does not fail loudly. The normal equations still solve, and unless you check $\operatorname{cond}(\widetilde{\mathbf H})$ or look at the eigenvectors of $\mathbf P$, a poorly observed direction looks like any other number in the output. It shows up only as an enormous formal uncertainty along some combination of state components (or, in the extreme case, as the solver failing outright), never as an explicit warning. Reading the covariance ellipsoid — not just its trace or its largest entry — is the only way to see which directions the data actually constrained.
:::

## Multiple stations: geometry, not just more data

Adding looks does not automatically help if they repeat information the arc already has. The lighthouse picture says so: a third lighthouse standing right next to the first adds almost nothing. One on the far side of the bay changes everything.

Compare two tracking plans with *the same number of looks*, $99$ each. The first uses three passes from the station at $40^\circ$ N, $20^\circ$ W. The second uses two of those passes plus one pass from a station at the **[[antipode|antipode]]**, $40^\circ$ S, $160^\circ$ E — the exact opposite side of the Earth:

| plan | looks | $\operatorname{cond}(\widetilde{\mathbf H})$ |
| --- | --- | --- |
| three passes, all from one station | 99 | $1.28\times10^{4}$ |
| two passes from that station + one from its antipode | 99 | $4.36\times10^{3}$ |

The same number of looks conditions about three times better, because the far station sees the orbit from a genuinely different angle instead of repeating the first station's view.

It is not automatic, though. In the same simulation, using the antipodal station's short, low pass at $8.7\,\mathrm h$ instead (only $20$ looks, $86$ in all) gave $2.33\times10^{4}$ — *worse* than one station alone. A brief, low pass sees too little of the orbit to add a new angle. What counts is how differently each pass sees the object, not just where the station stands or how many looks it logs.

This is the same principle as **[[dilution of precision|dop]]** in the GNSS module: a receiver's fix improves more from satellites spread across the sky than from the same number bunched together. Here it is applied to ground stations instead of satellites.

::: warning A well-conditioned fit from a short arc is still a short-arc fit
Adding a loose **[[a priori|a-priori]]**, or carrying on because the normal equations happened to solve without complaint, does not create observability the geometry does not contain. A regularized, Bayesian-looking answer from a single short pass reports *a* covariance, but the direction with the largest uncertainty in it is telling the truth: the data barely touched it, and the estimate along it is close to whatever the prior said, not something the tracking determined.
:::

## Check yourself

::: check
For one tracking arc, the smallest singular value of the weighted, non-dimensional $\widetilde{\mathbf H}$ is $2.0\times10^{5}$. What is the $1\sigma$ uncertainty along the worst-observed direction, in canonical units and, treating it as a position, in meters?
:::

::: answer
The $1\sigma$ half-length along a singular direction is one over its singular value: $\sigma = \frac{1}{2.0\times10^{5}} = 5.0\times10^{-6}$ canonical units.

One canonical distance unit is $6378\,\mathrm{km}$, so in position terms this is $5.0\times10^{-6} \times 6378 \approx 0.0319\,\mathrm{km}$, or about $32\,\mathrm m$. Every other direction of the state is known better than this.
:::

::: check
Why does the SVD of $\widetilde{\mathbf H}$, rather than the eigenvalues of $\boldsymbol\Lambda$, give a trustworthy answer for the 60-second arc, when $\boldsymbol\Lambda$'s own eigenvalues for that arc come out wrong?
:::

::: answer
$\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$, because $\boldsymbol\Lambda=\widetilde{\mathbf H}^\mathsf T\mathbf W\widetilde{\mathbf H}$ squares every singular value. For the 60-second arc, $\widetilde{\mathbf H}$'s condition number is already about $2.3\times10^{11}$, so $\boldsymbol\Lambda$'s is about $5\times10^{22}$. That is far beyond the roughly $10^{16}$ spread a 64-bit number can hold within one matrix. So $\boldsymbol\Lambda$'s smallest eigenvalues come out as round-off noise: in the example, a reported condition number about a million times too small and a spurious *negative* eigenvalue for a matrix that is positive semi-definite by construction. Working with $\widetilde{\mathbf H}$'s singular values directly never forms that squared, doubly ill-conditioned quantity.
:::

::: check
A station operator proposes fixing a poorly observed direction by tracking twice as long during the same single pass. Based on the first worked example, how much improvement should be expected, and why is a second, separated pass different?
:::

::: answer
Not much. Doubling the arc from $60\,\mathrm s$ to $120\,\mathrm s$ improved the condition number by a factor of only about $5$, and even the whole $380\,\mathrm s$ pass improved it by only about $35$ over the first minute. A longer pass just samples more of the same, slowly changing geometry.

A second pass hours later sees the spacecraft from a different point in its orbit and a different point in the station's own rotation with the Earth. That is genuinely new geometric information, not an extension of the first pass. In the example it improved the condition number by more than five orders of magnitude, far more than any amount of extra time inside the original pass could.
:::

::: check
The three-pass, twelve-hour arc left the best- and worst-observed directions differing by a factor of about $12\,800$ in formal uncertainty. Does that make the fit unreliable?
:::

::: answer
Not necessarily. A lopsided covariance is the normal result of orbit determination, not a sign of failure. The real question is whether every direction that matters for the job at hand — predicting a close approach, planning a maneuver, handing the object to another tracking site — is constrained well enough for that job. The ellipsoid will never be a sphere.

A factor of about $12\,800$ is enormously better than the 60-second arc's factor of more than $10^{11}$. Whether it is good enough depends on what the covariance says about the directions that matter, examined directly — which is what the RIC-frame lesson does.
:::

::: check
Two tracking plans offer the same total number of looks: three passes from a single station, or two passes from that station plus one pass from a station on nearly the opposite side of the Earth. Which would you expect to observe the state better, and what could spoil that expectation?
:::

::: answer
Usually the two-station plan. It does not have more data — in the example both had $99$ looks — but a station near the antipode views the orbit from a very different angle, adding information the first station's passes cannot. In the example it improved the condition number by about a factor of three. It is the same reason a GNSS fix improves more from satellites spread across the sky than from the same number clustered together.

What could spoil it is a poor pass from the second station. A short, low pass sees so little of the orbit that it adds little new geometry; in the example, such a pass (and fewer looks) left the fit *worse* than three passes from one station. Diversity helps only when each pass really sees the orbit from a new angle.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Observability | Whether the data constrains every direction of the state; set by geometry, not noise |
| $\operatorname{cond}(\widetilde{\mathbf H}) = s_{\max}/s_{\min}$, via SVD | The numerically sound observability measure; weight rows by $1/\sigma$ and use canonical units first |
| $\operatorname{cond}(\boldsymbol\Lambda)\approx\operatorname{cond}(\widetilde{\mathbf H})^2$ | Why a marginal arc's normal equations can fail from round-off, not only from noise |
| $\sigma_i = 1/s_i$ | $1\sigma$ half-length of the covariance ellipsoid along singular direction $i$ |
| Extending one pass | Improves conditioning slowly — the geometry changes only gradually within a pass |
| A second, separated pass | Improves conditioning dramatically — a genuinely different vantage point |
| Eigenvectors of $\mathbf P=\boldsymbol\Lambda^{-1}$ | The best- and worst-observed directions; physically readable once rotated into RIC |
| Station diversity over station count | A site on the far side of the Earth resolves directions a repeated single site cannot — the GNSS module's DOP idea, applied to ground geometry |

The covariance ellipsoid in this lesson came from trusting the dynamics completely between observations. The next lesson asks what changes when that trust is not fully deserved — when a real, unmodelled force is quietly acting on the spacecraft between the measurements that are supposed to be pinning its state down.

::: context two-viewpoints Depth from two places
Each eye sees a nearby pencil against a slightly different background. The brain measures that shift, called **parallax**, and turns it into distance. The farther apart the two viewpoints, the bigger the shift and the better the depth. Astronomers do the same with Earth's orbit: looking at a nearby star in January and again in July, from points $300$ million kilometers apart, makes it shift against the distant stars. In orbit determination, the "second eye" is a second pass or a second station.
:::

::: context nearly-parallel Two lines that cross at a shallow angle
Each measurement fixes the answer to lie in a band (the line, give or take its noise). Where two bands cross, the answer is pinned down. If the lines meet at a right angle, the overlap is a small square. If they meet at a shallow angle, the overlap is a long, thin diamond: known well across the lines, badly along them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g transform="translate(80,75)">
    <rect x="-8" y="-60" width="16" height="120" fill="#8fb8f0" fill-opacity="0.6"/>
    <rect x="-60" y="-8" width="120" height="16" fill="#f2b880" fill-opacity="0.6"/>
    <rect x="-8" y="-8" width="16" height="16" fill="#b4232c"/>
  </g>
  <text x="80" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">right angle: small overlap</text>
  <g transform="translate(265,75)">
    <rect x="-85" y="-8" width="170" height="16" fill="#8fb8f0" fill-opacity="0.6" transform="rotate(8)"/>
    <rect x="-85" y="-8" width="170" height="16" fill="#f2b880" fill-opacity="0.6" transform="rotate(-8)"/>
    <polygon points="-57.5,0 0,8.07 57.5,0 0,-8.07" fill="#b4232c"/>
  </g>
  <text x="265" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">shallow angle: long, thin overlap</text>
</svg>
```

Same band widths in both pictures — same measurement noise. Only the angle between the lines changed.
:::

::: context singular-values What a matrix does to a circle
Feed every unit-length arrow into a matrix and look at what comes out: the circle of arrows becomes an ellipse. The singular values are the half-lengths of that ellipse's axes, and the SVD tells you which input directions land on them. A tiny singular value means some direction gets squashed almost flat — the matrix, and the data behind it, can hardly see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="70" r="40" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="80" y1="70" x2="120" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="80" y1="70" x2="80" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <text x="80" y="135" font-size="11" fill="#1f2a44" text-anchor="middle">unit circle in</text>
  <line x1="150" y1="70" x2="190" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="198,70 188,65 188,75" fill="#1f2a44"/>
  <text x="172" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">H</text>
  <ellipse cx="280" cy="70" rx="70" ry="10" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="280" y1="70" x2="350" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="280" y1="70" x2="280" y2="60" stroke="#b4232c" stroke-width="2"/>
  <text x="315" y="90" font-size="11" fill="#b4232c" text-anchor="middle">s₁ = 1.75</text>
  <text x="252" y="50" font-size="11" fill="#b4232c" text-anchor="middle">s₂ = 0.25</text>
  <text x="280" y="135" font-size="11" fill="#1f2a44" text-anchor="middle">ellipse out: cond = 7</text>
</svg>
```

A condition number of $10^{11}$ would squash the ellipse so flat that no drawing could show its short axis.
:::

::: context canonical-units Measuring in Earths
Canonical units measure distance in Earth radii ($1\,\mathrm{DU} = 6378.137\,\mathrm{km}$) and time in a unit chosen so that $\mu = 1$ ($1\,\mathrm{TU} \approx 806.8\,\mathrm s$). Then a low orbit has position about $1$ and speed about $1$, and a matrix built from them has columns of similar size. It is like measuring a room in meters and a pencil in centimeters so that both come out as sensible numbers.
:::

::: context antipode The point straight through the Earth
"Antipode" comes from Greek words meaning "feet opposite": people at antipodes stand with their feet pointing at each other through the planet. To find it, flip the latitude from north to south and move $180^\circ$ in longitude. The antipode of $40^\circ$ N, $20^\circ$ W, out in the Atlantic, is $40^\circ$ S, $160^\circ$ E, in the Tasman Sea near New Zealand. Real tracking networks aim for this kind of spread: NASA's Deep Space Network has sites in California, Spain and Australia, spread roughly a third of the way around the world from one another.
:::

::: context dop A bridge back to GNSS
Dilution of precision, or DOP, is a single number that says how much the satellite geometry magnifies range errors into position errors. Satellites all in one patch of sky give a high DOP; satellites spread around the sky give a low one. It is computed from the same kind of matrix as here, $(\mathbf H^\mathsf T\mathbf H)^{-1}$, so the GNSS module's DOP and this lesson's condition number are two views of one idea: the shape of the geometry sets how well errors are controlled.
:::

::: context a-priori What an a priori is
"A priori" is Latin for "from before". In estimation it means what you believed about the state before this batch of data: a starting estimate with its own covariance. Adding it to $\boldsymbol\Lambda$ always makes the matrix invertible, which is why it can hide a hole in the data. Along the poorly observed direction, the answer simply echoes the prior. That is fine if the prior was honest, and misleading if you forget it is there.
:::
