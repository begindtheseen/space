---
id: l10-orbit-determination-out-loud
title: "Orbit determination, out loud"
minutes: 27
covers:
  - reported topics: PD control, orbit determination, frequency-domain analysis
---

The third reported phone-screen topic is orbit determination, and it behaves differently from the other two. PD control and phase margin each have a single right answer you either produce or do not. Orbit determination is a family of problems, and the question an interviewer is really asking is whether you can look at a set of observations and say which member of the family you are in.

That is why this module's drill list phrases it the way it does: *describe how you would determine an orbit from three position observations.* The number three is not decoration. Change it to two and the problem changes completely; change "position" to "line of sight" and it changes again. A candidate who has one memorised method gives the same answer to all three and is wrong twice. A candidate who counts unknowns and counts observations gets all three right without memorising anything.

This lesson gives you that counting argument, the three classical methods it selects between, the numerical failure mode that decides between two of them, and the distinction — which interviewers do probe — between determining an orbit once and estimating one continuously.

## Count the unknowns, count the observations

An orbit, in the two-body problem, is six numbers. You can carry them as a position and velocity vector at a stated epoch, $(\mathbf{r}, \mathbf{v})$, or as six orbital elements; the choice is bookkeeping, and the count is the same either way. Six unknowns means you need six independent numbers out of your observations, plus enough structure to tie them together.

Now count what each kind of observation gives you:

- A **position vector** — from a radar giving range plus two angles, or from a processed GNSS fix — is three numbers.
- An **angles-only** observation, a line of sight with no range, is two numbers: right ascension and declination, or azimuth and elevation.
- A **range** alone is one number; a **range-rate** from Doppler is one more.

Each observation also carries a time, which is not an unknown but is information, because the dynamics relate states at different times.

From that counting, the three classical cases fall out immediately.

**Two position vectors plus the time of flight.** Six numbers of position, but two points alone do not determine an orbit: infinitely many conics pass through two given points, differing in how fast the body travels between them. The time of flight selects one. This is **Lambert's problem**, and it is the workhorse of transfer design as well as of orbit determination. It also carries branch choices you should name — the short way or the long way around, and how many complete revolutions are allowed between the two points.

**Three position vectors, no times required.** Nine numbers for six unknowns. Three points on a conic, together with the fact that the conic has a focus at the central body, over-determine the orbit, and the redundancy is used as a consistency check rather than thrown away. This is **Gibbs' method**, and it is the answer to the question as this module's drill poses it.

**Three angles-only observations with their times.** Two numbers each is six, exactly determined — which is why the classical angles-only methods need exactly three observations. This is **Gauss's method** (Laplace's is the other classical route). Being exactly determined, it has no redundancy to check itself with, and it is the most delicate of the three.

::: key
An orbit is six numbers. A position vector gives three, an angles-only observation gives two, a range or a range-rate gives one. Two positions plus a time of flight is Lambert's problem; three positions is Gibbs' method and needs no times; three angles-only observations with times is Gauss's method. Count the unknowns and count the observations, and the method selects itself.
:::

## Gibbs' method

Given three position vectors $\mathbf{r}_1$, $\mathbf{r}_2$, $\mathbf{r}_3$ at successive times on the same orbit, with magnitudes $r_1$, $r_2$, $r_3$, form three auxiliary vectors:

$$\mathbf{D} = \mathbf{r}_1\times\mathbf{r}_2 + \mathbf{r}_2\times\mathbf{r}_3 + \mathbf{r}_3\times\mathbf{r}_1$$

$$\mathbf{N} = r_1(\mathbf{r}_2\times\mathbf{r}_3) + r_2(\mathbf{r}_3\times\mathbf{r}_1) + r_3(\mathbf{r}_1\times\mathbf{r}_2)$$

$$\mathbf{S} = (r_2-r_3)\,\mathbf{r}_1 + (r_3-r_1)\,\mathbf{r}_2 + (r_1-r_2)\,\mathbf{r}_3$$

The velocity at the middle point is then

$$\mathbf{v}_2 = \sqrt{\frac{\mu}{ND}}\left(\frac{\mathbf{D}\times\mathbf{r}_2}{r_2} + \mathbf{S}\right)$$

where $N = \lVert\mathbf{N}\rVert$, $D = \lVert\mathbf{D}\rVert$, and $\mu$ is the gravitational parameter of the central body — $3.986\times10^{5}\,\mathrm{km^3/s^2}$ for Earth. You now have $\mathbf{r}_2$ and $\mathbf{v}_2$ at a known time, which is a full state, and converting that to orbital elements is standard bookkeeping.

**The coplanarity check comes first.** Before any of that, verify that the three positions actually lie in one plane, because if they do not they are not three observations of one Keplerian orbit and no method will rescue them. Take the unit normal to the plane of $\mathbf{r}_2$ and $\mathbf{r}_3$ and dot it with the unit vector along $\mathbf{r}_1$; for coplanar vectors that dot product is zero. In practice it will be small rather than zero, and how small it has to be is a judgment about your measurement errors — which is the honest thing to say if asked for a threshold.

**Where it breaks down.** Look at $\mathbf{S}$: it is built from differences of the magnitudes $r_1$, $r_2$, $r_3$. If the three observations are closely spaced in time, those magnitudes are nearly equal, the differences are small numbers formed by subtracting large nearly equal ones, and the relative error in $\mathbf{S}$ becomes large. That is catastrophic cancellation, and it is the reason Gibbs' method is the wrong tool for closely spaced observations however clean the data is.

The alternative for that case is **Herrick–Gibbs**, which uses the observation *times* — which Gibbs does not need at all — and builds $\mathbf{v}_2$ from a Taylor expansion of the trajectory about the middle point. It is accurate exactly where Gibbs is not, and inaccurate where Gibbs is strong, because the truncated expansion is only good over a short arc. Knowing that the two methods are complementary, and knowing *why* from the structure of $\mathbf{S}$, is the difference between a memorised answer and an understood one.

::: warning Gibbs and Herrick–Gibbs are not interchangeable, and the reason is numerical
It is tempting to present them as two equivalent recipes. They are not: Gibbs is a closed-form geometric construction that needs no times and degrades through cancellation in $\mathbf{S}$ as the arc shortens; Herrick–Gibbs is a truncated series in the observation times that is accurate over a short arc and degrades as the arc lengthens. If you name only one of them and the interviewer changes the spacing of the observations, the answer has to change with it.
:::

## Initial orbit determination is not orbit determination

This is the distinction most likely to be probed, and it is worth being explicit about, because the two phrases get used loosely.

**Initial orbit determination** is what all three methods above do: take the minimum number of observations, assume two-body motion and no measurement error, and produce a state deterministically. There is no statistics in it. It gives you one answer and no idea how good the answer is.

**Orbit determination** in the operational sense is an estimation problem over many observations, usually far more than the minimum, with a dynamical model that includes perturbations and a measurement model that includes noise and biases. Two standard forms:

- **Batch least squares.** Choose a state at an epoch, propagate it, compute the predicted observation at each measurement time, form the residuals, and adjust the epoch state to minimise the weighted sum of their squares. Because the measurements depend nonlinearly on the epoch state, this is a differential correction iterated to convergence, with the state transition matrix mapping each measurement's partial derivatives back to the epoch. It produces a covariance as well as a state, from the inverse of the normal matrix.
- **Sequential estimation.** An extended or unscented Kalman filter that processes each observation as it arrives, propagating the state and covariance between measurements. This is what you use when observations keep coming and you want a current estimate rather than a best fit to a completed arc.

The relationship between the two halves is the thing to say: **initial orbit determination supplies the starting guess that the differential correction needs.** A least-squares iteration on a nonlinear problem needs a first estimate close enough to converge, and Gibbs, Lambert or Gauss is how you get one from a cold start — a new object in a radar catalogue, a fragmentation event, a spacecraft whose tracking has been lost.

::: key
Initial orbit determination is deterministic: minimum observations, two-body assumption, no error model, no covariance. Operational orbit determination is estimation over many observations — batch least squares by differential correction, or a sequential filter — with perturbations, a measurement error model and a covariance. The first supplies the initial guess the second needs to converge.
:::

## Checks you can state out loud

Whatever comes out, close with a check. Three good ones, all sayable without a computer.

**Vis-viva.** The speed at radius $r$ on an orbit of semi-major axis $a$ is

$$v = \sqrt{\mu\left(\frac{2}{r} - \frac{1}{a}\right)}$$

so once you have a state you can check the magnitude of the velocity you computed against the semi-major axis it implies. This is the single best check available and it takes one line.

**Does the orbit intersect the planet?** Compute the perigee radius $a(1-e)$ and compare it with the radius of the central body. An orbit determination that puts perigee below the surface has failed, and noticing that yourself is worth more than the arithmetic that produced it.

**Order of magnitude.** A low Earth orbit has a speed near $7.7\,\mathrm{km/s}$ and a period near ninety minutes. If your answer is 3 km/s or 40 km/s for something in the few-thousand-kilometre range, something is wrong — most often a unit error between metres and kilometres, which is by a wide margin the commonest mistake in this material.

::: example "How would you determine an orbit from three position observations?"
**Weak answer:** "I would use Gibbs' method. You form a few cross products from the three position vectors — there is a D vector and an N vector and an S vector — and then there is a formula that gives you the velocity at the middle point. Once you have position and velocity you can get the orbital elements. I would have to look up the exact expressions."

**Strong answer:**

"Let me say what the problem is, pick the method and say why, and then say where it fails.

First, the counting, because it selects the method. An orbit is six numbers — a position and velocity at an epoch, or six elements. Each position vector is three numbers, so three of them is nine numbers for six unknowns: over-determined by three, and that redundancy is useful rather than wasted. Two positions would not be enough on their own, because infinitely many orbits pass through two points; you would need the time of flight as well, and that is Lambert's problem rather than this one. Note that with three positions I do not need the observation times at all, which is worth saying out loud because it is surprising.

Method: Gibbs. Before anything else I check coplanarity — take the normal to the plane of $\mathbf{r}_2$ and $\mathbf{r}_3$, dot it with the unit vector along $\mathbf{r}_1$, and it should be zero to within measurement error. If it is not, these are not three observations of one Keplerian orbit and I should stop.

Then the construction. Three auxiliary vectors: $\mathbf{D}$, the sum of the three pairwise cross products; $\mathbf{N}$, the same cross products each weighted by the magnitude of the vector not appearing in it; and $\mathbf{S}$, a combination of the three position vectors weighted by differences of their magnitudes. The velocity at the middle point is the square root of $\mu$ over $N$ times $D$, multiplied by $\mathbf{D}$ cross $\mathbf{r}_2$ over $r_2$, plus $\mathbf{S}$. That gives me $\mathbf{r}_2$ and $\mathbf{v}_2$ at a known time, and elements follow from that by standard conversions.

Where it fails: in $\mathbf{S}$. It is built from differences of the three radii, so if the observations are closely spaced the radii are nearly equal and I am subtracting large nearly equal numbers to get a small one — catastrophic cancellation, and the answer degrades regardless of how good the measurements are. For a short arc I would use Herrick–Gibbs instead, which does use the times and builds the velocity from a Taylor expansion about the middle point; it is accurate on a short arc and degrades on a long one, so the two methods cover opposite regimes.

Last thing: this is initial orbit determination, not orbit determination. It is deterministic, two-body, and gives me no covariance. In an operational setting its output is the initial guess for a batch least-squares differential correction or a sequential filter over many observations, which is what actually produces an estimate with uncertainty attached."

**What makes the difference:** the weak answer names the right method and knows roughly what is in it, and would score something. What it cannot do is survive a change to the question. Asked why three and not two, asked whether the times matter, asked what happens if the observations are seconds apart, it has nothing — because it is a recalled recipe rather than a selected one.

The strong answer leads with the counting argument, which is the part that generalises; states the check before the computation, which is what an engineer does; describes the structure of each auxiliary vector rather than reciting components, which is the right level of detail for a voice-only answer; and names the failure mode with its numerical cause. The last paragraph is the one that most reliably impresses, because the distinction between initial orbit determination and operational orbit determination is exactly the distinction between having read about the subject and having used it.
:::

::: example "Now suppose all you have is three lines of sight from a ground station"
**Interviewer:** Same three observations, but the sensor is optical. You get angles only — no range. Does your method still work?

**Weak answer:** "No, you would need range. Without range you cannot get position vectors, so Gibbs would not apply. You would have to wait for a radar pass or get range some other way."

**Strong answer:**

"Gibbs does not apply, correct, but the problem is still solvable — and notice that the counting predicts it is. Each angles-only observation is two numbers, right ascension and declination, so three observations give exactly six, matching the six unknowns. That is why the classical angles-only methods take exactly three observations: not by convention, but because that is where the count closes.

The classical route is Gauss's method. The structure is that each line of sight fixes the *direction* from the observing site to the object but not the distance along it, so there are three unknown slant ranges in addition to the orbit. What closes the system is the dynamics: the three position vectors are not independent, because all three lie on one Keplerian orbit, and that constraint plus the known observer positions is enough to solve for the slant ranges. You end up solving a polynomial for the middle range, which can have more than one physically plausible root — so unlike the three-position case there is a root-selection problem, and you resolve it by propagating each candidate and testing it against a later observation.

Two things I would flag. First, this is much more sensitive than the position-vector case: the observations are exactly determined, so there is no redundancy to check yourself against, and short arcs with small angular separation are badly conditioned. Second, exactly because of that, in practice the output is treated as an initial guess and immediately refined by least squares over a longer arc, rather than used as a final answer."

**What makes the difference:** the weak answer is not false — Gibbs genuinely does not apply — but it stops at the obstacle and concludes the problem is unsolvable without different hardware. Angles-only orbit determination is a century-old solved problem and it is how most optical tracking works, so that conclusion is a real gap rather than a stylistic one.

The strong answer reuses the counting argument to *predict* that a solution exists before naming the method, which is the clearest possible demonstration that the framework is doing the work rather than recall. It then describes the structure of the method in three sentences without attempting the algebra, names the root-selection problem, and closes with the conditioning caveat and what is done about it in practice.
:::

::: example Checking the answer
**Interviewer:** You have run Gibbs and you have a velocity at the middle point. How do you know it is right?

**Strong answer:**

"Vis-viva, first. Suppose the middle position has magnitude about $7543\,\mathrm{km}$, and the elements that come out have a semi-major axis of $8000\,\mathrm{km}$. Then the predicted speed is the square root of $\mu$ times the quantity two over $r$ minus one over $a$. With $\mu = 3.986\times10^{5}\,\mathrm{km^3/s^2}$, two over 7543 is about $2.651\times10^{-4}$ and one over 8000 is $1.25\times10^{-4}$, so the difference is about $1.401\times10^{-4}$ per kilometre, and $\mu$ times that is about $55.9\,\mathrm{km^2/s^2}$. The square root is about $7.47\,\mathrm{km/s}$. If the magnitude of the velocity vector Gibbs produced agrees with that, the state and the elements are consistent with each other.

Second check: perigee. With $a = 8000$ and the eccentricity that comes out — say 0.1 — perigee radius is $a(1-e) = 7200\,\mathrm{km}$, which is about 800 kilometres of altitude above an Earth radius of roughly 6378 kilometres. Above the atmosphere, so the orbit is physically possible. If that number had come out below the Earth's radius I would know something was wrong regardless of how clean the algebra looked.

Third: order of magnitude. Period is two pi root $a^3$ over $\mu$, which for $a = 8000\,\mathrm{km}$ is a bit under two hours. Low Earth orbit is about ninety minutes at about $7.7\,\mathrm{km/s}$, and this orbit is a little higher and a little slower, which is the right direction. If I had got 3 or 40 kilometres per second I would be looking for a factor of a thousand somewhere — a metres-versus-kilometres error, which is the commonest mistake in this material by a wide margin."

**What makes the difference:** nothing in this answer is difficult, and that is the point. Three independent checks, each costing one or two lines, each capable of catching a different class of error: vis-viva catches an inconsistency between the state and the elements, the perigee check catches a physically impossible answer, and the order-of-magnitude check catches a unit error that both of the others might pass. An interviewer hearing this learns that the candidate does not trust their own arithmetic, which is precisely the habit they are hiring for.
:::

## Check yourself

::: check
Why do three position vectors determine an orbit without any observation times, while two position vectors do not determine one even with both times known?
:::

::: answer
Because of what each set constrains. Three position vectors are nine numbers against six unknowns, and three points together with a focus at the central body pin down the conic geometrically — no timing information is needed, which is why Gibbs' method does not use the times at all. Two position vectors are only six numbers, but they are not six independent constraints on the orbit: infinitely many conics pass through two given points, differing in how fast the body traverses the arc between them. What selects one is the time of flight between the two points, which is Lambert's problem — and even then a branch must be chosen, short way or long way, and the number of complete revolutions allowed.
:::

::: check
Explain, from the structure of the method, why Gibbs' method degrades for closely spaced observations, and name the method used instead.
:::

::: answer
Because the vector $\mathbf{S}$ is built from differences of the three radii, $(r_2-r_3)$, $(r_3-r_1)$ and $(r_1-r_2)$. For closely spaced observations the three radii are nearly equal, so each difference is a small number obtained by subtracting two large nearly equal ones, and its relative error is amplified — catastrophic cancellation. The result degrades even with perfect-looking measurements. The method used instead is Herrick–Gibbs, which does use the observation times and constructs the middle velocity from a Taylor expansion about the middle point; it is accurate over a short arc and degrades over a long one, so the two are complementary rather than interchangeable.
:::

::: check
Why do the classical angles-only methods require exactly three observations, and what additional difficulty do they have that the three-position case does not?
:::

::: answer
Because each angles-only observation supplies two numbers — right ascension and declination, or azimuth and elevation — so three observations supply six, exactly matching the six unknowns of an orbit. The count closes at three, which is why the classical methods take three. The additional difficulties are that the system is exactly determined, so there is no redundancy left over to check consistency with, unlike the three-position case where the coplanarity check falls out of the extra information; and that the slant ranges are unknown, so the solution goes through a polynomial for the middle range that can admit more than one physically plausible root, requiring an explicit root-selection step tested against a further observation.
:::

::: check
Distinguish initial orbit determination from operational orbit determination, and state how they are related.
:::

::: answer
Initial orbit determination is deterministic: it takes the minimum number of observations, assumes two-body motion and error-free measurements, and produces a single state with no statistical content and no covariance — Gibbs, Herrick–Gibbs, Lambert and Gauss are all of this kind. Operational orbit determination is an estimation problem over many observations, with a dynamical model including perturbations and a measurement model including noise and biases, solved either as a batch least-squares differential correction or with a sequential filter, and producing a covariance as well as a state. They are related because the nonlinear estimation problem needs a starting guess close enough to converge, and initial orbit determination is how that guess is obtained from a cold start.
:::

::: check
Give three checks you can state out loud on an orbit determination result, and say what class of error each catches.
:::

::: answer
Vis-viva: compute $v = \sqrt{\mu(2/r - 1/a)}$ and compare it with the magnitude of the velocity vector you produced — this catches an inconsistency between the state and the elements derived from it. Perigee radius: compute $a(1-e)$ and compare with the radius of the central body — this catches a physically impossible answer that may nonetheless be algebraically self-consistent. Order of magnitude against something known, such as a low Earth orbit being near 7.7 km/s with a period near ninety minutes — this catches a unit error, typically a factor of a thousand between metres and kilometres, which the first two checks can both pass because they are internally consistent in the wrong units.
:::

::: check
An interviewer asks how you would determine the orbit of a newly detected object with no prior information. Structure an answer in four sentences.
:::

::: answer
Establish what the observations are, because that selects the method: three position vectors means Gibbs, three lines of sight with times means Gauss, two positions with a time of flight means Lambert. Run the appropriate initial orbit determination to get a deterministic state, checking coplanarity first if the observations are position vectors, and noting that this result carries no uncertainty. Use that state as the starting guess for a batch least-squares differential correction over as long an arc as is available, with a dynamical model carrying the perturbations that matter over the arc and a measurement model carrying the sensor's noise and biases, which yields both a refined state and a covariance. Then check the result — vis-viva against the elements, perigee above the surface, speed and period in the right range — before believing any of it.
:::

## Summary

| Observations | Method | Needs times? | Note |
| --- | --- | --- | --- |
| Two position vectors + time of flight | Lambert | Yes | Branch choice: short/long way, revolutions |
| Three position vectors | Gibbs | No | Coplanarity check; fails on short arcs |
| Three position vectors, short arc | Herrick–Gibbs | Yes | Taylor expansion; fails on long arcs |
| Three lines of sight | Gauss | Yes | Exactly determined; root selection needed |
| Many observations | Batch least squares or a filter | Yes | Gives a covariance; needs an initial guess |

| Check | Expression |
| --- | --- |
| Vis-viva | $v = \sqrt{\mu\left(\dfrac{2}{r} - \dfrac{1}{a}\right)}$ |
| Perigee radius | $r_p = a(1-e)$, compare with the body's radius |
| Earth's gravitational parameter | $\mu = 3.986\times10^{5}\,\mathrm{km^3/s^2}$ |

That completes the three reported technical topics. The next lesson returns to the interview itself, and to the situation every one of these technical lessons is preparation for but none of them can prevent: being asked something you do not know.
