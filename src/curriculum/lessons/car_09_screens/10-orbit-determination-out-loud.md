---
id: l10-orbit-determination-out-loud
title: "Orbit determination, out loud"
minutes: 24
covers:
  - reported topics: PD control, orbit determination, frequency-domain analysis
---

Throw a ball and have a friend take three photos of it in the air. From those photos, a careful person could work out the whole arc: how high it went and where it will land. Snapshots plus the rule that thrown things follow a curve pin down the path.

Spacecraft are the same, with gravity drawing the curve. **Orbit determination** — working out a spacecraft's whole orbit from a handful of measurements — is the third topic people report on GNC (guidance, navigation and control) phone screens. Unlike a PD control or phase margin question, it has no single right answer. It is a *family* of problems, and the interviewer is asking whether you can look at a set of measurements and say which member you are in.

That is why this module's drill words it the way it does: *describe how you would determine an orbit from three position observations.* Change three to two, or "position" to "line of sight", and the problem changes completely. One memorized method gives the same answer to all three versions and is wrong twice. Counting unknowns and measurements gets all three right.

## Count the unknowns, count the observations

Think of a puzzle with six blank boxes. Each clue fills some of them; extra clues let you check your work.

An orbit, in the **two-body problem** (one spacecraft, one planet, nothing else pulling), is six numbers. You can write them as a position vector and a velocity vector, $(\mathbf{r}, \mathbf{v})$ — read "r and v" — three numbers each, at a stated moment called the **epoch** (the time stamp on the snapshot). Or you can write six **[[orbital elements|six-elements]]**, the standard shape-and-tilt numbers. Either way, the count is six.

Now count what each measurement gives:

- A **position vector** is three numbers — from a radar that measures distance plus two angles, or from a **GNSS** fix (said "G-N-S-S": the family of navigation satellites that includes GPS).
- An **angles-only** observation — a line of sight with no distance — is two numbers: **[[right ascension and declination|sky-coordinates]]**, or azimuth and elevation.
- A **range** (distance) is one number. A **range-rate** (how fast the distance is changing), measured from the **[[Doppler shift|doppler-shift]]** of a radio signal, is one more.

Each measurement also has a time stamp — not an unknown, but information, because the laws of motion link where you are at one time to where you are at another. From that counting, three classic cases fall out.

**Two position vectors plus the time of flight.** Six numbers, but two points alone do not fix an orbit. Infinitely many orbit shapes — ellipses, parabolas and hyperbolas, called **conics** — pass through two points, differing in how fast the spacecraft travels between them; the time of flight picks one. This is **Lambert's problem**, also the workhorse of transfer design. It comes with **[[branch choices|lambert-branches]]** you should name: short way or long way around, and how many complete revolutions are allowed.

**Three position vectors, no times needed.** Nine numbers for six unknowns. Three points on a conic, plus the fact that its **focus** (the point an orbit curves around) sits at the planet's center, over-determine the orbit, and the extra becomes a consistency check. This is **Gibbs' method** (said "gibz"), the answer to the drill.

**Three angles-only observations with their times.** Two numbers each makes six — exactly enough. This is **[[Gauss's method|gauss-ceres]]**; Laplace's method is the other classic route. With nothing spare to check itself, it is the most delicate.

::: key
An orbit is six numbers. A position vector gives three, an angles-only observation gives two, a range or a range-rate gives one. Two positions plus a time of flight is Lambert's problem; three positions is Gibbs' method and needs no times; three angles-only observations with times is Gauss's method. Count the unknowns and count the observations, and the method selects itself.
:::

## Gibbs' method

You have three position vectors $\mathbf{r}_1$, $\mathbf{r}_2$, $\mathbf{r}_3$ (read "r one, r two, r three"), taken one after another on the same orbit. Their lengths — distances from the planet's center — are $r_1$, $r_2$, $r_3$, in plain type. Build three helper vectors using the **[[cross product|cross-product-plane]]** ($\times$, read "cross"):

$$\mathbf{D} = \mathbf{r}_1\times\mathbf{r}_2 + \mathbf{r}_2\times\mathbf{r}_3 + \mathbf{r}_3\times\mathbf{r}_1$$

$$\mathbf{N} = r_1(\mathbf{r}_2\times\mathbf{r}_3) + r_2(\mathbf{r}_3\times\mathbf{r}_1) + r_3(\mathbf{r}_1\times\mathbf{r}_2)$$

$$\mathbf{S} = (r_2-r_3)\,\mathbf{r}_1 + (r_3-r_1)\,\mathbf{r}_2 + (r_1-r_2)\,\mathbf{r}_3$$

So $\mathbf{D}$ sums the three pairwise cross products; $\mathbf{N}$ weights each by the length of the vector *missing* from it; $\mathbf{S}$ weights the positions by differences of their lengths. The velocity at the middle point is then

$$\mathbf{v}_2 = \sqrt{\frac{\mu}{ND}}\left(\frac{\mathbf{D}\times\mathbf{r}_2}{r_2} + \mathbf{S}\right)$$

where $N = \lVert\mathbf{N}\rVert$ and $D = \lVert\mathbf{D}\rVert$ are the lengths of those vectors. The Greek letter $\mu$ (read "mew") is the planet's **gravitational parameter** — its mass times the gravitational constant, a measure of its pull. For Earth, $\mu = 3.986\times10^{5}\,\mathrm{km^3/s^2}$. Now $\mathbf{r}_2$ and $\mathbf{v}_2$ at a known time give a full state, and orbital elements follow by standard bookkeeping.

::: note Where the formula comes from, and a free check
Write the conic's distance-direction rule for each point and combine the three with cross products: the shape terms cancel, leaving $\mathbf{N} = p\,\mathbf{D}$, where $p = a(1-e^2)$ is the orbit's **semi-latus rectum** ($a$ the semi-major axis, $e$ the eccentricity). So with clean data $N/D = p$. A python3 test with $a = 8000\,\mathrm{km}$, $e = 0.1$ gives $N/D = 7920\,\mathrm{km}$ and the true $\mathbf{v}_2$ to every printed digit.
:::

**The coplanarity check comes first.** An orbit around one planet lies in a flat plane. If your three points do not, no method can rescue them. So take the unit **normal** (the arrow sticking straight out of a plane) to the plane of $\mathbf{r}_2$ and $\mathbf{r}_3$, and dot it with the unit vector along $\mathbf{r}_1$. For coplanar vectors that dot product is zero. In practice it is only small; how small is a judgment about your measurement errors — the honest answer if asked for a threshold.

**Where it breaks down.** Look at $\mathbf{S}$: it is built from differences of $r_1$, $r_2$, $r_3$. Measurements close together in time have nearly equal lengths, so each difference subtracts two big, nearly equal numbers, and its relative error balloons. That is **[[catastrophic cancellation|cancellation-numbers]]**, and it makes Gibbs the wrong tool for closely spaced observations, however clean the data.

The alternative is **Herrick–Gibbs**. It uses the observation *times* — which Gibbs ignores — and builds $\mathbf{v}_2$ from a **[[Taylor expansion|taylor-idea]]** of the path about the middle point. A cut-off expansion is only good over a short arc, so Herrick–Gibbs is strong exactly where Gibbs is weak, and the reverse. Knowing *why*, from the structure of $\mathbf{S}$, separates an understood answer from a memorized one.

::: warning Gibbs and Herrick–Gibbs are not interchangeable, and the reason is numerical
Gibbs is closed-form geometry that needs no times and degrades, through cancellation in $\mathbf{S}$, as the arc shortens. Herrick–Gibbs is a cut-off series in the times that degrades as the arc lengthens. Name only one, and when the interviewer changes the spacing your answer has nowhere to go.
:::

## Initial orbit determination is not orbit determination

**Initial orbit determination** (IOD, said "I-O-D") is what all three methods above do. Minimum observations, two-body motion, perfect measurements, a state calculated directly. No statistics: one answer and no idea how good it is.

**Orbit determination** in the working, operational sense is an estimation problem. It uses many observations, far more than the minimum, with a motion model that includes **perturbations** (small extra pulls such as Earth's bulge, air drag, the Moon and Sun) and a measurement model that includes noise and biases. Two standard forms:

- **Batch least squares.** Guess the state at an epoch. Predict what each measurement *should* have read; the gaps from the actual readings are the **residuals**. Adjust the epoch state to make the weighted sum of their squares as small as possible. The measurements depend on the state nonlinearly, so you repeat until it settles — a **differential correction** — with the **[[state transition matrix|stm-nudge]]** carrying each measurement's sensitivity back to the epoch. It produces a **[[covariance|covariance-ellipse]]** as well as a state, from the inverse of the normal matrix.
- **Sequential estimation.** An extended or unscented **Kalman filter** takes each observation as it arrives, carrying the state and covariance forward between measurements — for when observations keep coming and you want a current estimate, not a best fit to a finished arc.

The sentence to say: **initial orbit determination supplies the starting guess that the differential correction needs**, one close enough to settle on the right answer. Gibbs, Lambert or Gauss is how you get one from a **[[cold start|iod-pipeline]]** — a new object in a radar catalog, a satellite breaking up, a spacecraft whose tracking was lost.

::: key
Initial orbit determination is deterministic: minimum observations, two-body assumption, no error model, no covariance. Operational orbit determination is estimation over many observations — batch least squares by differential correction, or a sequential filter — with perturbations, a measurement error model and a covariance. The first supplies the initial guess the second needs to converge.
:::

## Checks you can state out loud

Whatever comes out, close with a check. Three good ones need no computer.

**Vis-viva.** The speed $v$ at distance $r$ from the planet, on an orbit with **semi-major axis** $a$ (half the long width of the ellipse), is given by the **[[vis-viva equation|vis-viva-name]]**:

$$v = \sqrt{\mu\left(\frac{2}{r} - \frac{1}{a}\right)}$$

Compare your velocity's length against it: the single best check, in one line.

**Does the orbit hit the planet?** The **perigee** radius — closest distance to the planet's center — is $a(1-e)$, with $e$ the **eccentricity** (how stretched the ellipse is; 0 is a circle). Below the planet's radius, the answer has failed — and noticing that yourself beats the arithmetic.

**Order of magnitude.** Low Earth orbit is near $7.7\,\mathrm{km/s}$ with a period near ninety minutes. Get 3 km/s or 40 km/s for a low orbit and something is wrong — most often meters mixed with kilometers, by far the commonest mistake in this material.

::: example "How would you determine an orbit from three position observations?"
**Weak answer:** "I would use Gibbs' method. You form a few cross products from the three position vectors — there is a D vector and an N vector and an S vector — and then there is a formula that gives you the velocity at the middle point. Once you have position and velocity you can get the orbital elements. I would have to look up the exact expressions."

**Strong answer:**

"Let me set up the problem, pick the method, then say where it fails.

The counting picks the method. An orbit is six numbers; three position vectors are nine — over-determined by three, and the extra is useful. Two positions would not be enough, since infinitely many orbits pass through two points; I would need the time of flight, which is Lambert's problem. With three positions I do not need the times at all — surprising, so worth saying.

Method: Gibbs. First, coplanarity — the normal to the plane of $\mathbf{r}_2$ and $\mathbf{r}_3$, dotted with the unit vector along $\mathbf{r}_1$, should be zero within measurement error. If not, they are not one orbit and I stop.

Then three helper vectors: $\mathbf{D}$, the sum of the pairwise cross products; $\mathbf{N}$, the same cross products each weighted by the length of the vector not in it; and $\mathbf{S}$, the positions weighted by differences of their lengths. The middle velocity is the square root of $\mu$ over $N$ times $D$, multiplied by $\mathbf{D}$ cross $\mathbf{r}_2$ over $r_2$, plus $\mathbf{S}$. That gives $\mathbf{r}_2$ and $\mathbf{v}_2$ at a known time, and the elements follow.

Where it fails: in $\mathbf{S}$. Closely spaced observations have nearly equal radii, so I am subtracting big nearly equal numbers — catastrophic cancellation, whatever the measurement quality. For a short arc I would use Herrick–Gibbs, which uses the times and a Taylor expansion about the middle point; the two cover opposite cases.

Last: this is initial orbit determination — deterministic, two-body, no covariance. In operations it is the starting guess for a batch least-squares differential correction or a sequential filter, which gives an estimate with its uncertainty attached."

**What makes the difference:** the weak answer names the right method but is a recalled recipe: ask why three and not two, or about observations seconds apart, and it has nothing. The strong one leads with the counting, puts the check before the computation, describes each vector's *structure* rather than its components (the right level for voice), and names the failure with its cause. Its last paragraph impresses most — the IOD-versus-OD line separates having read about the subject from having used it.
:::

::: example "Now suppose all you have is three lines of sight from a ground station"
**Interviewer:** Same three observations, but the sensor is a telescope. Angles only, no range. Does your method still work?

**Weak answer:** "No, you would need range. Without range you cannot get position vectors, so Gibbs would not apply. You would have to wait for a radar pass or get range some other way."

**Strong answer:**

"Gibbs does not apply, but the counting says it is still solvable. Each angles-only observation is two numbers, right ascension and declination, so three give exactly six — that is why the classic angles-only methods take exactly three.

The classic route is Gauss's method. Each line of sight fixes the *direction* from the station to the object, not the distance along it, so there are three unknown **slant ranges** — straight-line distances from the station — on top of the orbit. What closes the system is that all three positions lie on one two-body orbit; that, plus the known station positions, solves for the ranges. You end up with a polynomial for the middle range that can have more than one physically possible root, so you select by carrying each candidate forward and testing it against a later observation.

Two flags. It is much more sensitive than the position case: exactly determined, so nothing spare to check against, and short arcs with small angle changes are badly conditioned. So in practice the output is a starting guess, refined right away by least squares over a longer arc."

**What makes the difference:** the weak answer is true but stops at the obstacle. Angles-only orbit determination has been solved for more than two centuries and is how most optical tracking works, so that is a real gap. The strong one uses the counting to *predict* a solution before naming the method, gives its structure without algebra, and names root selection and the sensitivity.
:::

::: example Checking the answer
**Interviewer:** You have run Gibbs and have a velocity at the middle point. How do you know it is right?

**Strong answer:**

"Vis-viva first. Say the middle position has length about $7543\,\mathrm{km}$ and the elements give a semi-major axis of $8000\,\mathrm{km}$. Two over 7543 is about $2.651\times10^{-4}$ per kilometer; one over 8000 is $1.25\times10^{-4}$. The difference is about $1.401\times10^{-4}$. Times $\mu = 3.986\times10^{5}\,\mathrm{km^3/s^2}$ that is about $55.9\,\mathrm{km^2/s^2}$, and the square root is about $7.47\,\mathrm{km/s}$. If the Gibbs velocity matches, state and elements agree.

Second, perigee. With $a = 8000\,\mathrm{km}$ and, say, $e = 0.1$, the perigee radius is $8000 \times 0.9 = 7200\,\mathrm{km}$. Minus Earth's radius of about 6378 kilometers, that is about 820 kilometers up, above the atmosphere — possible. Below Earth's radius, something is wrong however clean the algebra.

Third, order of magnitude. The period, two pi times the square root of $a^3$ over $\mu$, is about 7100 seconds — a bit under two hours. Low Earth orbit is about ninety minutes at $7.7\,\mathrm{km/s}$; this orbit is a little higher and slower, the right direction. At 3 or 40 kilometers per second I would hunt for a meters-versus-kilometers slip."

**What makes the difference:** nothing here is hard, and that is the point: three one-line checks, each catching a different kind of error. The interviewer learns that you do not blindly trust your own arithmetic — the habit they are hiring for.
:::

## Check yourself

::: check
Why do three position vectors determine an orbit without any observation times, while two position vectors do not determine one even with both times known?
:::

::: answer
Three positions are nine numbers for six unknowns, and three points plus a focus at the planet's center fix the conic by geometry alone, so Gibbs ignores the times. Two positions are six numbers but not six independent constraints: infinitely many conics pass through two points, differing in how fast the body covers the arc. The time of flight picks one — Lambert's problem — and you still choose a branch: short or long way, and how many revolutions.
:::

::: check
Explain, from the structure of the method, why Gibbs' method degrades for closely spaced observations, and name the method used instead.
:::

::: answer
$\mathbf{S}$ is built from $(r_2-r_3)$, $(r_3-r_1)$ and $(r_1-r_2)$. Closely spaced observations have nearly equal radii, so each difference subtracts two big nearly equal numbers and its relative error balloons — catastrophic cancellation, even with good measurements. Use Herrick–Gibbs instead: it uses the times and a Taylor expansion about the middle point, accurate on a short arc and poor on a long one, so the two are complementary.
:::

::: check
Why do the classic angles-only methods need exactly three observations, and what extra difficulty do they have that the three-position case does not?
:::

::: answer
Each angles-only observation gives two numbers (right ascension and declination, or azimuth and elevation), so three give six — exactly the six unknowns. The extra difficulties: exactly determined, so nothing spare to check with (the three-position case gets its coplanarity check from its extra numbers); and the slant ranges are unknown, so the solution goes through a polynomial for the middle range that can have several plausible roots, needing a root-selection step tested against a further observation.
:::

::: check
Distinguish initial orbit determination from operational orbit determination, and state how they are related.
:::

::: answer
Initial orbit determination (Gibbs, Herrick–Gibbs, Lambert, Gauss) is deterministic: minimum observations, two-body motion, error-free measurements, one state, no covariance. Operational orbit determination is estimation over many observations, with perturbations and measurement noise and biases modeled, solved by batch least-squares differential correction or a sequential filter, giving a state and a covariance. The link: the estimation needs a starting guess close enough to converge, and IOD supplies it.
:::

::: check
Give three checks you can state out loud on an orbit determination result, and say what kind of error each catches.
:::

::: answer
Vis-viva, $v = \sqrt{\mu(2/r - 1/a)}$, against the length of your velocity: catches a mismatch between the state and its elements. Perigee radius $a(1-e)$ against the planet's radius: catches a physically impossible answer that may still be algebraically consistent. Order of magnitude against low Earth orbit (about 7.7 km/s, ninety minutes): catches a unit error, typically meters mixed with kilometers, which the first two can both pass because they are consistent in the wrong units.
:::

::: check
An interviewer asks how you would determine the orbit of a newly detected object with no prior information. Structure an answer in four sentences.
:::

::: answer
First, say what the observations are, since that picks the method: three positions means Gibbs, three lines of sight with times means Gauss, two positions with a time of flight means Lambert. Second, run that initial orbit determination (checking coplanarity first for positions) and note that its state carries no uncertainty. Third, use it to start a batch least-squares differential correction over the longest arc available, modeling perturbations and sensor noise and biases, for a refined state and a covariance. Fourth, check it — vis-viva, perigee above the surface, speed and period in range — before believing any of it.
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

That completes the three reported technical topics. The next lesson returns to the interview itself, and to the moment these lessons prepare you for but cannot prevent: being asked something you do not know.

::: context six-elements The six numbers by name
The classic set: the **semi-major axis** $a$ (how big), the **eccentricity** $e$ (how stretched — 0 is a circle), the **inclination** $i$ (how tilted from the equator), the **right ascension of the ascending node** (which way the tilt faces), the **argument of perigee** (where the closest point sits within the orbit), and the **true anomaly** (where the spacecraft is right now). The first two give the shape, the next three the orientation, the last the position along it. Six numbers, the same count as $(\mathbf{r}, \mathbf{v})$.
:::

::: context sky-coordinates Latitude and longitude, painted on the sky
Imagine the stars painted on a giant ball around Earth. **Declination** is like latitude on that ball: degrees north or south of the sky's equator. **Right ascension** is like longitude, measured eastward, often in hours instead of degrees. A telescope pointed at a satellite reads off these two angles — but not how far away the satellite is. That missing distance is why an angles-only observation counts as two numbers, not three.
:::

::: context doppler-shift The ambulance siren trick
An ambulance siren sounds higher as it drives toward you and lower as it drives away. Radio signals do the same thing: the frequency you receive shifts by an amount proportional to how fast the distance between you is changing. Ground stations measure that shift very precisely, and it gives range-rate directly. Deep-space navigation leans heavily on Doppler tracking for exactly this reason.
:::

::: context lambert-branches Short way or long way
Two points on a circle can be joined going either way around. Lambert's problem has the same choice: the spacecraft can sweep through the short angle between the two points or the long one, and with enough time it can also loop the whole way around one or more extra times first. Each branch is a different orbit, so a good answer names which branch it means.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="90" r="10" fill="#1d6fd1"/>
  <text x="180" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">planet</text>
  <path d="M 250 90 A 70 70 0 0 0 180 20" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M 250 90 A 70 70 0 1 1 180 20" fill="none" stroke="#b4232c" stroke-width="3" stroke-dasharray="6 4"/>
  <circle cx="250" cy="90" r="5" fill="#1f2a44"/>
  <circle cx="180" cy="20" r="5" fill="#1f2a44"/>
  <text x="258" y="94" font-size="12" fill="#1f2a44">point 1</text>
  <text x="188" y="16" font-size="12" fill="#1f2a44">point 2</text>
  <text x="236" y="32" font-size="12" fill="#1d6fd1">short way (90°)</text>
  <text x="14" y="170" font-size="12" fill="#b4232c">long way (270°)</text>
</svg>
```
:::

::: context gauss-ceres The lost dwarf planet
On 1 January 1801 the astronomer Giuseppe Piazzi spotted a new object. He named it Ceres and tracked it for about six weeks before it vanished into the Sun's glare. With so few observations, predicting where it would reappear was a hard problem. The young mathematician Carl Friedrich Gauss developed a method from Piazzi's angle measurements, predicted its position, and Ceres was found again near that spot at the end of 1801. Descendants of that method still start orbits for newly spotted asteroids and satellites.
:::

::: context cross-product-plane Why cross products appear
The cross product of two vectors is a third vector standing straight out of the plane the first two lie in, with length equal to the area of the parallelogram they make. So a cross product of two positions on one orbit points along the orbit's normal. That is why $\mathbf{D}$ and $\mathbf{N}$ both point perpendicular to the orbit plane, and why a tilt in that direction flags three points that do not share a plane.
:::

::: context cancellation-numbers Subtracting nearly equal numbers
Suppose two radii are 7000.4 km and 7000.1 km, each measured to within 0.05 km. Each is known to better than one part in a hundred thousand. Their difference is 0.3 km — but the errors can add, so it could really be anywhere from 0.2 to 0.4 km. The relative error has jumped from about 0.0007% to about 33%. Nothing went wrong with the measurements; the subtraction threw away the digits that were right and kept the ones that were uncertain.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="12" y="30" font-size="12" fill="#1f2a44">each radius</text>
  <rect x="120" y="18" width="220" height="16" fill="#8fb8f0"/>
  <text x="12" y="54" font-size="11" fill="#6c7a93">error ±0.05 km out of 7000 km: too small to draw</text>
  <text x="12" y="84" font-size="12" fill="#1f2a44">difference</text>
  <rect x="120" y="72" width="66" height="16" fill="#1d6fd1"/>
  <rect x="164" y="72" width="44" height="16" fill="#b4232c" fill-opacity="0.45"/>
  <text x="12" y="110" font-size="11" fill="#b4232c">0.3 km, give or take 0.1 km (red): a third is doubt</text>
</svg>
```
:::

::: context taylor-idea Guessing a curve from nearby points
A **Taylor expansion** describes a smooth path near one point using the point, its slope, its curvature, and so on, in a sum of simpler and simpler terms. Kept to a few terms, it is excellent close by and drifts further away — like guessing the rest of a road from the few meters you can see. Herrick–Gibbs uses exactly that: great for a short arc, poor for a long one.
:::

::: context stm-nudge How a nudge now moves you later
The **state transition matrix** answers: if I nudge the starting position or velocity a tiny bit, how much does the state change later on? It is a 6-by-6 table of those sensitivities. Least squares needs it to know which way to adjust the epoch state so that all the predicted measurements line up better with the real ones. You will build one in the orbital estimation modules later in the course.
:::

::: context covariance-ellipse An error bar for six numbers
A single measurement has an error bar. A state has six numbers whose errors are tangled together — a position error along the track usually comes with a matching speed error. The **covariance** is the matrix that records all of that. Drawn for two of the numbers, it is an ellipse: the answer is probably somewhere inside it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="146" font-size="11" text-anchor="end" fill="#1f2a44">along-track position error</text>
  <text x="46" y="22" font-size="11" fill="#1f2a44">speed error</text>
  <ellipse cx="185" cy="72" rx="95" ry="26" transform="rotate(-20 185 72)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="185" cy="72" r="4" fill="#1f2a44"/>
  <text x="196" y="76" font-size="11" fill="#1f2a44">best estimate</text>
</svg>
```

Initial orbit determination gives you the dot with no ellipse. Operational orbit determination gives you both.
:::

::: context iod-pipeline From cold start to trusted orbit
The two halves fit together as a pipeline. The quick, rough method feeds the slow, careful one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="30" width="78" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">3 fresh</text>
  <text x="45" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">observations</text>
  <rect x="100" y="30" width="72" height="44" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="136" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">IOD</text>
  <text x="136" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">Gibbs, Gauss</text>
  <rect x="188" y="30" width="80" height="44" rx="6" fill="#1d6fd1" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="228" y="50" font-size="11" text-anchor="middle" fill="#fff">least squares</text>
  <text x="228" y="64" font-size="11" text-anchor="middle" fill="#fff">or filter</text>
  <rect x="284" y="30" width="70" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="319" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">state +</text>
  <text x="319" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">covariance</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="84" y1="52" x2="94" y2="52"/><line x1="172" y1="52" x2="182" y2="52"/><line x1="268" y1="52" x2="278" y2="52"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="100,52 93,48 93,56"/><polygon points="188,52 181,48 181,56"/><polygon points="284,52 277,48 277,56"/>
  </g>
  <text x="228" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">many more observations</text>
  <line x1="228" y1="86" x2="228" y2="80" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="228,75 224,82 232,82" fill="#6c7a93"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">first guess</text>
</svg>
```
:::

::: context vis-viva-name The "living force"
*Vis viva* is Latin for "living force", an old name, used by Leibniz, for the quantity $mv^2$ — twice what we now call kinetic energy. The equation is really energy conservation in disguise: kinetic energy per kilogram, $v^2/2$, plus gravitational energy per kilogram, $-\mu/r$, always equals the same total, $-\mu/(2a)$. Rearrange for $v$ and you get the formula. That is why it only needs $r$ and $a$.
:::
