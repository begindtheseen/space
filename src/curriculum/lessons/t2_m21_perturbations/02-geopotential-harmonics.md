---
id: l02-geopotential-harmonics
title: The geopotential, spherical harmonics, and J2
minutes: 18
covers:
  - non-spherical gravity, spherical harmonics, J2 and higher zonals
---

Earth is not a sphere. It spins, and rotation flattens a fluid or semi-fluid body into an oblate spheroid — wider at the equator than from pole to pole by about $21\,\mathrm{km}$ out of a $6378\,\mathrm{km}$ radius, roughly $0.3\%$. That sounds small, but the shell theorem that let the two-body module treat Earth as a point mass only holds *exactly* for a spherically symmetric body, and Earth's mass is not spherically symmetric: there is more of it bulging at the equator and less at the poles than a sphere of the same total mass would have. A spacecraft near the equatorial bulge feels a small but systematic extra pull that a spacecraft over the pole does not, and that asymmetry is the single most consequential fact this module has to teach.

This lesson builds the tool for describing any deviation from spherical mass distribution — the geopotential as an expansion in spherical harmonics — and then does the one derivation that matters most in this module: the Cartesian acceleration due to $J_2$, Earth's oblateness term, worked from the potential to a formula you can drop into a propagator. It closes with the higher zonal harmonics, which exist, matter for high-precision work, and are otherwise dwarfed by $J_2$ by three orders of magnitude.

## The geopotential as a sum of harmonics

For a point mass, the gravitational potential (defined here so that acceleration is $\mathbf{a} = \nabla U$, matching the sign convention used throughout this module) is $U = \mu/r$: check that $\nabla(\mu/r) = -(\mu/r^2)\hat{\mathbf{r}}$, the familiar inward two-body acceleration. A non-spherical mass distribution modifies this with additional terms that depend on direction as well as distance. For a body with an axis of symmetry (Earth's rotation axis, to good approximation — true axisymmetry is an idealisation, since there are also smaller longitude-dependent terms called tesseral and sectoral harmonics that capture continents and mountain ranges, but those are two to three further orders of magnitude down and outside this module's scope), the potential depends on radius $r$ and geocentric latitude $\phi$ — the angle between the radius vector and the equatorial plane, *not* the geodetic latitude a map or a GPS receiver reports, which is measured from the local vertical to a reference ellipsoid and differs from geocentric latitude by up to about $11.5$ arcminutes. The expansion is

$$
U(r,\phi) = \frac{\mu}{r}\left[1 - \sum_{n=2}^{\infty} J_n \left(\frac{R_E}{r}\right)^n P_n(\sin\phi)\right],
$$

where $R_E = 6378.137\,\mathrm{km}$ is Earth's equatorial radius, $J_n$ are dimensionless coefficients — determined empirically, by tracking how real satellites actually move, not derived from a model of Earth's interior — and $P_n$ are the Legendre polynomials,

$$
P_2(s) = \frac{3s^2-1}{2}, \qquad P_3(s) = \frac{5s^3-3s}{2}, \qquad P_4(s) = \frac{35s^4-30s^2+3}{8}, \qquad s = \sin\phi .
$$

These are called *zonal* harmonics because $P_n(\sin\phi)$ depends only on latitude: each term divides Earth into latitude bands (zones) of alternating sign, like the rings of an onion, rather than picking out particular longitudes. The sum starts at $n=2$ because $n=0$ would only rescale $\mu$ and $n=1$ vanishes identically once you place the origin at Earth's centre of mass (there is no net first-moment asymmetry about the centre of mass, by definition of where the centre of mass is).

The acceleration from a single degree-$n$ term follows by taking the gradient in spherical coordinates, $\nabla U = (\partial U/\partial r)\hat{\mathbf{r}} + (1/r)(\partial U/\partial\phi)\hat{\boldsymbol\phi}$ (there is no longitude dependence for a zonal term, so no third component). Writing $U_n = -(\mu/r)J_n(R_E/r)^n P_n(\sin\phi)$ for the $n$-th term alone,

$$
a_r = \frac{\partial U_n}{\partial r} = (n+1)\,\frac{\mu J_n R_E^n}{r^{n+2}}\,P_n(\sin\phi), \qquad
a_\phi = \frac{1}{r}\frac{\partial U_n}{\partial\phi} = -\frac{\mu J_n R_E^n}{r^{n+2}}\,P_n'(\sin\phi)\cos\phi ,
$$

using $d(\sin\phi)/d\phi = \cos\phi$ for the second. Every zonal harmonic, at every degree, reduces to these two components; the work left is turning $(a_r, a_\phi)$ into Cartesian coordinates for a particular $n$, which is where $J_2$ earns its own derivation.

## Deriving the J2 acceleration

Set $n=2$: $P_2(s) = (3s^2-1)/2$, so $P_2'(s) = 3s$, giving

$$
a_r = \frac{3\mu J_2 R_E^2}{r^4}\,P_2(\sin\phi) = \frac{3}{2}\frac{\mu J_2 R_E^2}{r^4}\left(3\sin^2\phi - 1\right), \qquad
a_\phi = -\frac{3\mu J_2 R_E^2}{r^4}\sin\phi\cos\phi .
$$

To convert to Cartesian components, use $\sin\phi = z/r$, $\cos\phi = \rho/r$ where $\rho = \sqrt{x^2+y^2}$, and the two unit vectors $\hat{\mathbf{r}} = (x/r, y/r, z/r)$ and $\hat{\boldsymbol\phi} = (-(z/r)(x/\rho), -(z/r)(y/\rho), \rho/r)$ — the direction of increasing latitude, in the meridian plane, perpendicular to $\hat{\mathbf{r}}$. The Cartesian acceleration is $\mathbf{a} = a_r\hat{\mathbf{r}} + a_\phi\hat{\boldsymbol\phi}$; working out the $x$-component alone,

$$
a_x = a_r\frac{x}{r} - a_\phi\frac{zx}{r\rho} = \frac{3}{2}\frac{\mu J_2 R_E^2}{r^5}\,x\left(3\frac{z^2}{r^2}-1\right) + 3\frac{\mu J_2 R_E^2}{r^4}\sin\phi\cos\phi\,\frac{zx}{r\rho} .
$$

The last term simplifies using $\sin\phi\cos\phi/\rho = (z/r)(\rho/r)/\rho = z/r^2$, so it becomes $3\mu J_2 R_E^2 xz^2/r^7$, which equals $\tfrac{3}{2}(\mu J_2 R_E^2/r^5)\,x\cdot(2z^2/r^2)$. Adding the two pieces,

$$
a_x = \frac{3}{2}\frac{\mu J_2 R_E^2}{r^5}\,x\left[\left(3\frac{z^2}{r^2}-1\right) + 2\frac{z^2}{r^2}\right] = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\,\frac{x}{r}\left(5\frac{z^2}{r^2}-1\right) .
$$

The $y$-component follows by the same algebra with $x \to y$, and the $z$-component works out (by the equivalent steps, tracking that $\hat{\boldsymbol\phi}_z = \rho/r$ rather than $-zx/(r\rho)$) to the companion form with a $-3$ in place of the $-1$. Collecting all three,

$$
\mathbf{a}_{J_2} = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\left[\frac{x}{r}\left(5\frac{z^2}{r^2}-1\right),\ \ \frac{y}{r}\left(5\frac{z^2}{r^2}-1\right),\ \ \frac{z}{r}\left(5\frac{z^2}{r^2}-3\right)\right].
$$

This is the formula this module uses throughout, and it is worth checking that it behaves correctly at two extremes. Over the equator ($z=0$): $\mathbf{a}_{J_2} = -\tfrac{3}{2}(J_2\mu R_E^2/r^4)(x/r, y/r, 0)$, which points *inward*, adding to the two-body pull — physically sensible, since the equatorial bulge is extra nearby mass. Over the pole ($x=y=0$, $z=\pm r$): $\mathbf{a}_{J_2} = \tfrac{3}{2}(J_2\mu R_E^2/r^4)(0,0,\pm 2z/r)$, which points *outward along the axis* — the flattened poles have a mass deficit relative to a sphere, so gravity there is weaker along the polar direction than a point mass would give, though the total (two-body plus $J_2$) magnitude is still smaller at the pole than at the equator for a fixed $r$ only because $z^2/r^2\le 1$ bounds the correction; the sign flip is the geometric signature of oblateness rather than a claim that polar gravity exceeds equatorial gravity.

::: example J2 acceleration at 400 km, equator and mid-latitude
With $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $J_2 = 1.082\,626\,68\times10^{-3}$, $R_E = 6378.137\,\mathrm{km}$, at $r = 6778.137\,\mathrm{km}$ ($400\,\mathrm{km}$ altitude), over the equator ($x=r$, $y=z=0$):
$$
a_x = -\frac{3}{2}\frac{J_2\mu R_E^2}{r^4} = -1.2475\times10^{-5}\,\mathrm{km/s^2} = -1.2475\times10^{-2}\,\mathrm{m/s^2},
$$
pointed toward Earth, matching the ranking table of the previous lesson. At $30^\circ$ latitude on the same sphere ($z/r = \sin30^\circ = 0.5$, $x/r=\cos30^\circ=0.8660$, $y=0$):
$$
a_x = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}(0.8660)\big(5(0.25)-1\big) = 1.2475\times10^{-5}\times0.8660\times0.25 = 2.701\times10^{-6}\,\mathrm{km/s^2},
$$
$$
a_z = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}(0.5)\big(5(0.25)-3\big) = -1.2475\times10^{-5}\times0.5\times1.75 = -1.0916\times10^{-5}\,\mathrm{km/s^2}.
$$
The magnitude, $\sqrt{a_x^2+a_z^2} = 1.126\times10^{-5}\,\mathrm{km/s^2} = 1.126\times10^{-2}\,\mathrm{m/s^2}$, is close to but not identical to the equatorial value — $J_2$'s effect varies with latitude, and this latitude dependence is exactly what produces the secular drifts the next lessons derive.
:::

## Higher zonals: J3, J4, and how far this goes

$J_2$ is not the only zonal harmonic, but it is by roughly three orders of magnitude the largest. Commonly tabulated Earth values (WGS84-consistent, to the precision that matters for this module) are

$$
J_2 = 1.082\,626\,68\times10^{-3}, \qquad J_3 \approx -2.532\times10^{-6}, \qquad J_4 \approx -1.611\times10^{-6},
$$

with $J_5$ and $J_6$ smaller again, of order $10^{-7}$. Physically, $J_2$ is the oblateness (equatorial bulge, symmetric between the northern and southern hemispheres); $J_3$ is odd in $\sin\phi$ (since $P_3$ is an odd polynomial), so it measures a north–south *asymmetry* — Earth is very slightly more pointed at the north pole and flatter at the south, sometimes called the "pear shape", a popular description that overstates how large the effect actually is; $J_4$ and higher even terms refine the equator-to-pole flattening profile beyond the single bulge $J_2$ captures.

For a rough sense of how quickly these fall off, use the general formulas from the previous section: at fixed latitude, the degree-$n$ acceleration scales as $J_n(R_E/r)^n$ relative to the degree-2 term's $J_2(R_E/r)^2$, i.e. by a factor of order $(J_n/J_2)(R_E/r)^{n-2}$. Near Earth, $R_E/r$ is close to but less than one, so each additional degree costs a factor of both the harmonic-coefficient ratio (itself of order $10^{-3}$ from $J_2$ to $J_3$) and one more power of $R_E/r$ — both effects push in the same direction, and by $J_4$ the acceleration is typically four to five orders of magnitude below $J_2$ in low orbit.

::: example Comparing J3's acceleration to J2's
At $30^\circ$ latitude and $r=6778.137\,\mathrm{km}$ (the same point as the example above), evaluating the general $n=3$ formulas with $J_3 = -2.532\times10^{-6}$ gives a radial component $a_r = 4\mu J_3 R_E^3 P_3(\sin\phi)/r^5$ with $P_3(0.5) = (5(0.125)-3(0.5))/2 = -0.4375$, and a latitudinal component from $P_3'(s) = (15s^2-3)/2 = 0.375$ at $s=0.5$. Carrying the full vector through (the same rotation from $(a_r,a_\phi)$ to Cartesian used for $J_2$) gives a total magnitude of about $3.3\times10^{-5}\,\mathrm{m/s^2}$ — roughly $0.3\%$ of the $J_2$ magnitude at the same point, consistent with the "three orders of magnitude smaller" rule of thumb, and small enough that most mission-design work safely lumps $J_3$ and higher into a single "higher harmonics" bucket the way the previous lesson's table did.
:::

High-precision applications — the operational GPS constellation's ground segment, an orbit-determination system reconciling laser-ranging data to centimetres — use full gravity models like EGM96 or EGM2008, tabulating not just zonal but tesseral and sectoral coefficients out to degree and order 360 or beyond, a resolution that resolves individual mountain ranges' gravitational signature. GNC design work, and every propagator this module builds, needs at most $J_2$ through $J_6$; the remaining thousands of coefficients in a full model move a low-orbit satellite by metres over a day, not the kilometres $J_2$ alone moves it.

::: key The geopotential and J2
$$
U(r,\phi) = \frac{\mu}{r}\left[1 - \sum_{n\ge2} J_n\left(\frac{R_E}{r}\right)^n P_n(\sin\phi)\right], \qquad \mathbf{a} = \nabla U .
$$
$J_2 = 1.082\,626\,68\times10^{-3}$ is the oblateness term, about a thousand times larger than any other zonal coefficient. Its Cartesian acceleration is
$$
\mathbf{a}_{J_2} = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\left[\frac{x}{r}\Big(5\frac{z^2}{r^2}-1\Big),\ \frac{y}{r}\Big(5\frac{z^2}{r^2}-1\Big),\ \frac{z}{r}\Big(5\frac{z^2}{r^2}-3\Big)\right].
$$
:::

::: warning Geocentric latitude, not geodetic latitude
The $\phi$ in every formula above is *geocentric* latitude: the angle the position vector $\mathbf{r}$ makes with the equatorial plane, computed directly from $\sin\phi = z/r$. The latitude printed on a map, or returned by most GPS receivers, is *geodetic* latitude: the angle between the local normal to a reference ellipsoid and the equatorial plane. Because Earth is oblate, these differ by up to about $11.5$ arcminutes at mid-latitudes (zero at the equator and the poles). For the geopotential and every element-rate formula in this module, always use geocentric latitude computed from the Cartesian state; substituting a geodetic latitude from a ground-station database is a common and hard-to-notice source of error, because $11.5$ arcminutes sounds negligible until you recall that $J_2$'s whole effect lives in exactly this kind of small-angle latitude dependence.
:::

## Check yourself

::: check
Why does the sum defining the geopotential start at $n=2$ rather than $n=0$ or $n=1$?
:::

::: answer
$n=0$ would only be a constant rescaling of $\mu$, already absorbed into the point-mass term $\mu/r$ in front of the bracket. $n=1$ corresponds to a first-moment (centre-of-mass) offset, which vanishes identically once the origin is placed at the body's actual centre of mass — by definition, there is no net "lopsidedness" about the centre of mass. The physically meaningful asymmetries start at $n=2$, the quadrupole term, which is $J_2$.
:::

::: check
Without recomputing the full vector, explain qualitatively why $J_2$'s acceleration points inward (adds to two-body gravity) over the equator but outward along the axis over the poles.
:::

::: answer
$J_2$ represents the equatorial bulge: relative to a sphere of the same mass, there is extra mass near the equator and a deficit near the poles. A spacecraft over the equator is close to that extra mass, which pulls it inward more strongly than a point-mass model predicts. A spacecraft over the pole is close to the mass deficit, so the pull there is weaker along the radial (here, polar-axis) direction than the point-mass model predicts, which shows up as an outward correction relative to the two-body term.
:::

::: check
Using the scaling argument in this lesson (degree-$n$ acceleration relative to $J_2$'s scales as $(J_n/J_2)(R_E/r)^{n-2}$), estimate roughly how much smaller $J_4$'s acceleration is than $J_2$'s at $r = 6778.137\,\mathrm{km}$, using $J_4 \approx -1.611\times10^{-6}$.
:::

::: answer
$J_4/J_2 \approx 1.611\times10^{-6}/1.0826\times10^{-3} \approx 1.49\times10^{-3}$, and $(R_E/r)^2 = (6378.137/6778.137)^2 \approx 0.8847$. The product is about $1.3\times10^{-3}$, so $J_4$'s acceleration is roughly a thousand times smaller than $J_2$'s at this altitude — consistent with the "higher harmonics" row of the ranking table sitting some three to four orders of magnitude below the $J_2$ row.
:::

::: check
A colleague computes $J_2$ acceleration using the geodetic latitude read off a ground-station almanac instead of the geocentric latitude from the spacecraft's own position vector. Is the resulting error large or small, and why?
:::

::: answer
It is a real, non-negligible error, even though $11.5$ arcminutes sounds tiny. $J_2$'s entire physical content is a latitude-dependent correction of order $10^{-3}$ relative to two-body gravity, and the geocentric–geodetic discrepancy is largest (about $11.5$ arcminutes, roughly $0.2^\circ$) at exactly the mid-latitudes where $J_2$'s latitude dependence is changing fastest. Using the wrong latitude definition introduces a systematic bias into every element-rate calculation that depends on latitude, which is most of them — this is a "small angle, wrong formula" error, not a rounding error, and it does not average out over an orbit the way random noise would.
:::

::: check
Why does high-precision orbit determination (for example, reconciling laser-ranging measurements to centimetre accuracy) need a gravity model with thousands of coefficients, when this module's propagators use at most six?
:::

::: answer
The zonal harmonics $J_2$ through $J_6$ capture the latitude-dependent, axisymmetric part of Earth's gravity field, which is enough to predict a satellite's position to the metre-level accuracy most GNC design and analysis needs. Tesseral and sectoral harmonics capture longitude-dependent mass anomalies — mountain ranges, ocean trenches, density variations in the crust and mantle — that are individually much smaller than $J_2$ but, taken together across thousands of coefficients, matter at the centimetre level that geodesy and precision orbit determination require. Whether to include them is a question of what error budget the application can tolerate, not a question of which model is "more correct."
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $U(r,\phi) = (\mu/r)\big[1 - \sum_{n\ge2} J_n(R_E/r)^n P_n(\sin\phi)\big]$ | Geopotential as a sum of zonal harmonics; $\mathbf{a} = \nabla U$ |
| $\phi$ | Geocentric latitude, $\sin\phi = z/r$ — not geodetic latitude |
| $P_2(s) = (3s^2-1)/2$ | Legendre polynomial for $J_2$ |
| $a_r = (n+1)\mu J_nR_E^n P_n(\sin\phi)/r^{n+2}$, $a_\phi = -\mu J_nR_E^nP_n'(\sin\phi)\cos\phi/r^{n+2}$ | General zonal-harmonic acceleration, spherical components |
| $\mathbf{a}_{J_2} = \tfrac32(J_2\mu R_E^2/r^4)\big[(x/r)(5z^2/r^2-1),\,(y/r)(5z^2/r^2-1),\,(z/r)(5z^2/r^2-3)\big]$ | $J_2$ acceleration, Cartesian |
| $J_2 = 1.082\,626\,68\times10^{-3}$ | Earth oblateness; about $1000\times$ any other zonal |
| $J_3 \approx -2.532\times10^{-6}$, $J_4\approx-1.611\times10^{-6}$ | Next-largest zonals; north–south asymmetry and finer flattening |

The next lesson puts the $J_2$ acceleration derived here to work: the Gauss variational equations that turn any perturbing acceleration, including this one, into rates of change of the classical orbital elements.
