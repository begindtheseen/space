---
id: l02-geopotential-harmonics
title: The geopotential, spherical harmonics, and J2
minutes: 18
covers:
  - non-spherical gravity, spherical harmonics, J2 and higher zonals
---

Spin a ball of pizza dough in the air and it spreads out into a flat disk. Anything soft that spins bulges at its waist. Earth spins once a day, and over billions of years its rock and water have settled into the same kind of shape: slightly squashed, fatter around the equator than from pole to pole. The shape is an **[[oblate spheroid|oblate-picture]]** — a ball flattened at the poles.

The squash is small. Earth's equatorial radius is $6378.137\,\mathrm{km}$ and its polar radius is about $6356.752\,\mathrm{km}$, so the equator sticks out about $21.4\,\mathrm{km}$ farther — roughly $0.3\%$. But it matters a great deal. In the two-body module you treated Earth as a single point of mass. That is exactly right only for a perfectly round planet, thanks to the **[[shell theorem|shell-theorem]]**. Earth has extra mass bulging at the equator and less at the poles than a round ball of the same total mass. A spacecraft passing over the bulge feels a small, steady extra pull that a spacecraft over the pole does not. That lopsided pull is the single most important fact in this module.

This lesson builds the tool for describing any departure from a round Earth: the **geopotential** written as a sum of **spherical harmonics**. Then it does the derivation that matters most here — the push from $J_2$, Earth's oblateness term, worked all the way to a formula you can drop into a propagator. It ends with the higher terms, which exist and matter for precise work but are about a thousand times smaller than $J_2$.

## Gravity as a landscape: the potential

Think of a map with contour lines showing hills and valleys. At every point, the steepest uphill direction and how steep it is are fixed by the shape of the land. Gravity can be described the same way, by one number at each point in space, called the **gravitational potential** $U$. The **[[acceleration is the slope of that landscape|potential-hill]]**:

$$
\mathbf{a} = \nabla U .
$$

The upside-down triangle $\nabla$ is read "del" or "grad" (for **gradient**). $\nabla U$ is the vector that points in the direction $U$ increases fastest, with length equal to how fast it increases. This module uses the sign convention where acceleration points *up* the slope of $U$.

For a point mass, $U = \mu/r$. Check that it gives the familiar pull: $U$ depends only on $r$, so its gradient points along the radius, $\hat{\mathbf{r}}$ ("r-hat", the unit vector pointing away from Earth's center), with size $dU/dr$:

$$
\nabla\!\left(\frac{\mu}{r}\right) = \frac{d}{dr}\!\left(\frac{\mu}{r}\right)\hat{\mathbf{r}} = -\frac{\mu}{r^2}\,\hat{\mathbf{r}} .
$$

The minus sign means inward, toward Earth. That is the two-body acceleration, as it should be.

## Building Earth's shape out of bands

Now let Earth be squashed. For a body shaped the same all the way around its spin axis, the potential depends on two things: the distance $r$, and how far north or south you are.

"How far north" here means **geocentric latitude** $\phi$ ("phi"): the angle between the position vector $\mathbf{r}$ and the equatorial plane. With the $z$ axis pointing to the North Pole,

$$
\sin\phi = \frac{z}{r} .
$$

This is *not* the latitude on a map. Map and GPS latitude is **geodetic latitude**, measured from the local "straight down" on a reference ellipsoid. On a squashed Earth the two differ by up to about $11.5$ arcminutes (about $0.19^\circ$), near latitude $45^\circ$.

The potential is then

$$
U(r,\phi) = \frac{\mu}{r}\left[1 - \sum_{n=2}^{\infty} J_n \left(\frac{R_E}{r}\right)^n P_n(\sin\phi)\right].
$$

Take it piece by piece:

- The $1$ inside the brackets gives back the point-mass potential $\mu/r$.
- The big sigma $\sum$ means "add up the terms for $n = 2, 3, 4, \ldots$". Each term is a correction.
- $R_E = 6378.137\,\mathrm{km}$ is Earth's equatorial radius. The factor $(R_E/r)^n$ is less than one above the surface, so higher-$n$ terms fade faster with height.
- $J_n$ ("J sub n") are the **zonal coefficients**: plain numbers with no units. They are *measured*, by **[[tracking how real satellites move|measured-from-orbits]]**, not worked out from a model of Earth's insides.
- $P_n$ are the **[[Legendre polynomials|legendre]]**, fixed recipes in $s = \sin\phi$:

$$
P_2(s) = \frac{3s^2-1}{2}, \qquad P_3(s) = \frac{5s^3-3s}{2}, \qquad P_4(s) = \frac{35s^4-30s^2+3}{8} .
$$

These are called **zonal harmonics** because $P_n(\sin\phi)$ depends only on latitude. Each term divides Earth into **[[latitude bands, or zones|zonal-bands]]**, where the correction is alternately positive and negative, rather than picking out any particular longitude.

Two honest caveats. First, Earth is not perfectly the same all the way around its axis. Continents and mountain ranges add terms that depend on longitude too, called **tesseral** and **sectoral** harmonics. Together with the zonals, the full set is the spherical harmonics. The longitude terms are two to three orders of magnitude smaller than $J_2$ and outside this module's scope. Second, why does the sum start at $n = 2$?

- An $n = 0$ term would only change the overall strength, and that is already in $\mu$.
- An $n = 1$ term would describe the mass being off-center. But we put the origin exactly at Earth's center of mass, and by definition the mass is not lopsided about its own center of mass. So that term is zero.

The first real shape term is $n = 2$: the bulge, $J_2$.

## From the landscape to the push

To get acceleration from $U$, take its gradient. In the directions of increasing $r$ and increasing latitude $\phi$, the gradient has two parts:

$$
\nabla U = \frac{\partial U}{\partial r}\hat{\mathbf{r}} + \frac{1}{r}\frac{\partial U}{\partial\phi}\hat{\boldsymbol\phi} .
$$

The curly $\partial$ ("partial") means "change one variable, hold the other fixed". The unit vector $\hat{\boldsymbol\phi}$ points due north along the surface of a sphere. The $1/r$ turns an angle change into a distance, the way an arc length is radius times angle. There is no east–west part, because a zonal term does not depend on longitude.

Take one term on its own:

$$
U_n = -\frac{\mu}{r}J_n\left(\frac{R_E}{r}\right)^n P_n(\sin\phi) = -\mu J_n R_E^n\, r^{-(n+1)}\, P_n(\sin\phi).
$$

**Radial part.** Only $r^{-(n+1)}$ depends on $r$. Its derivative is $-(n+1)r^{-(n+2)}$, and the two minus signs cancel:

$$
a_r = \frac{\partial U_n}{\partial r} = (n+1)\,\frac{\mu J_n R_E^n}{r^{n+2}}\,P_n(\sin\phi).
$$

**Northward part.** Only $P_n(\sin\phi)$ depends on $\phi$. By the chain rule its derivative is $P_n'(\sin\phi)\cos\phi$, where $P_n'$ ("P n prime") is the derivative of the polynomial and $\cos\phi$ comes from $d(\sin\phi)/d\phi$. Dividing by $r$:

$$
a_\phi = \frac{1}{r}\frac{\partial U_n}{\partial\phi} = -\frac{\mu J_n R_E^n}{r^{n+2}}\,P_n'(\sin\phi)\cos\phi .
$$

Every zonal term, at every degree $n$, comes down to these two components. What is left is to turn them into $x, y, z$ for a propagator.

## Deriving the J2 acceleration

Set $n = 2$. Then $P_2(s) = (3s^2-1)/2$, and its derivative is $P_2'(s) = 3s$. Put these into the two formulas:

$$
a_r = \frac{3}{2}\frac{\mu J_2 R_E^2}{r^4}\left(3\sin^2\phi - 1\right), \qquad
a_\phi = -\frac{3\mu J_2 R_E^2}{r^4}\sin\phi\cos\phi .
$$

To go to $x, y, z$, you need the two unit vectors in Cartesian form. Write $\rho = \sqrt{x^2+y^2}$ for the distance from the spin axis (a different use of $\rho$ from density). Then $\sin\phi = z/r$, $\cos\phi = \rho/r$, and

$$
\hat{\mathbf{r}} = \left(\frac{x}{r}, \frac{y}{r}, \frac{z}{r}\right), \qquad \hat{\boldsymbol\phi} = \left(-\frac{z}{r}\frac{x}{\rho},\ -\frac{z}{r}\frac{y}{\rho},\ \frac{\rho}{r}\right).
$$

The second one points north, in the plane through the axis and the spacecraft, at right angles to $\hat{\mathbf{r}}$. The acceleration is $\mathbf{a} = a_r\hat{\mathbf{r}} + a_\phi\hat{\boldsymbol\phi}$.

**The $x$ component**, step by step. Multiply each part by the $x$ entry of its unit vector:

$$
a_x = a_r\frac{x}{r} - a_\phi\frac{zx}{r\rho} = \frac{3}{2}\frac{\mu J_2 R_E^2}{r^5}\,x\left(3\frac{z^2}{r^2}-1\right) + 3\frac{\mu J_2 R_E^2}{r^4}\sin\phi\cos\phi\,\frac{zx}{r\rho} .
$$

Tidy the last term. Since $\sin\phi\cos\phi/\rho = (z/r)(\rho/r)/\rho = z/r^2$, it becomes $3\mu J_2 R_E^2 xz^2/r^7$. Write that in the same shape as the first term: $\tfrac{3}{2}(\mu J_2 R_E^2/r^5)\,x\cdot(2z^2/r^2)$. Now add the two:

$$
a_x = \frac{3}{2}\frac{\mu J_2 R_E^2}{r^5}\,x\left[\left(3\frac{z^2}{r^2}-1\right) + 2\frac{z^2}{r^2}\right] = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\,\frac{x}{r}\left(5\frac{z^2}{r^2}-1\right) .
$$

The $y$ component is the same algebra with $y$ in place of $x$. The $z$ component comes out with a $-3$ where $x$ and $y$ have $-1$ (worked in the note below). All together:

$$
\mathbf{a}_{J_2} = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\left[\frac{x}{r}\left(5\frac{z^2}{r^2}-1\right),\ \ \frac{y}{r}\left(5\frac{z^2}{r^2}-1\right),\ \ \frac{z}{r}\left(5\frac{z^2}{r^2}-3\right)\right].
$$

::: note Why it has to be true: the z component, and a compact form
For $z$, use the $z$ entries of the unit vectors, $z/r$ and $\rho/r$:

$$
a_z = a_r\frac{z}{r} + a_\phi\frac{\rho}{r} = \frac{3}{2}\frac{\mu J_2R_E^2}{r^4}\left(3\frac{z^2}{r^2}-1\right)\frac{z}{r} - \frac{3\mu J_2R_E^2}{r^4}\,\frac{z}{r}\,\frac{\rho}{r}\,\frac{\rho}{r} .
$$

Pull out $\tfrac32(\mu J_2R_E^2/r^4)(z/r)$. What is left in the brackets is $(3z^2/r^2 - 1) - 2\rho^2/r^2$. Since $\rho^2 = r^2 - z^2$, the last piece is $-2 + 2z^2/r^2$, and the bracket becomes $5z^2/r^2 - 3$.

Look at the whole vector once more. Each component is "$(5z^2/r^2 - 1)$ times the matching entry of $\hat{\mathbf{r}}$", except that $z$ has an extra $-2z/r$. So the same acceleration can be written as

$$
\mathbf{a}_{J_2} = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\Big[\big(5\sin^2\phi - 1\big)\hat{\mathbf{r}} - 2\sin\phi\,\hat{\mathbf{z}}\Big],
$$

a push along the radius plus a push parallel to Earth's axis. The next lesson uses this form to find how much of $J_2$ points out of the orbit plane.
:::

### Check it at the two extremes

A new formula should behave sensibly where you can guess the answer. Call the common factor $K = \tfrac{3}{2}J_2\mu R_E^2/r^4$.

**Over the equator** ($z = 0$): $\mathbf{a}_{J_2} = -K(x/r,\ y/r,\ 0)$. That points *inward*, adding to the two-body pull. It makes sense: the bulge is extra mass close by.

**Over the North Pole** ($x = y = 0$, $z = r$): $\mathbf{a}_{J_2} = K(0,\ 0,\ 5 - 3) = K(0,\ 0,\ 2)$. That points *outward* along the axis, subtracting from the two-body pull. (At the South Pole, $z = -r$, it is $K(0, 0, -2)$ — again outward.) The flattened poles have less mass than a round Earth would put there, so the pull is weaker.

So at the same distance $r$, total gravity is $\mu/r^2 + K$ over the equator but $\mu/r^2 - 2K$ over the poles. At $400\,\mathrm{km}$ up, that is $8.688\,\mathrm{m/s^2}$ against $8.651\,\mathrm{m/s^2}$.

::: key The J2 acceleration
$$
\mathbf{a}_{J_2} = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\left[\frac{x}{r}\Big(5\frac{z^2}{r^2}-1\Big),\ \frac{y}{r}\Big(5\frac{z^2}{r^2}-1\Big),\ \frac{z}{r}\Big(5\frac{z^2}{r^2}-3\Big)\right]
$$
It points inward over the equator (magnitude $K$) and outward along the axis over the poles (magnitude $2K$), with $K = \tfrac32 J_2\mu R_E^2/r^4$.
:::

::: example J2 acceleration at 400 km, on the equator and at 30° latitude
Use $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $J_2 = 1.082\,626\,68\times10^{-3}$, $R_E = 6378.137\,\mathrm{km}$ and $r = 6778.137\,\mathrm{km}$.

**The common factor.** $\mu J_2 R_E^2/r^4 = 8.3169\times10^{-6}\,\mathrm{km/s^2}$, so $K = 1.5 \times 8.3169\times10^{-6} = 1.2475\times10^{-5}\,\mathrm{km/s^2}$.

**Over the equator** ($x = r$, $y = z = 0$): the $x$ bracket is $1 \times (0 - 1) = -1$, so

$$
a_x = -K = -1.2475\times10^{-5}\,\mathrm{km/s^2} = -1.2475\times10^{-2}\,\mathrm{m/s^2},
$$

pointing toward Earth. This matches the $J_2$ row of the last lesson's table.

**At $30^\circ$ latitude** on the same sphere, with $y = 0$: $z/r = \sin30^\circ = 0.5$ and $x/r = \cos30^\circ = 0.8660$. So $5z^2/r^2 = 5 \times 0.25 = 1.25$.

$$
a_x = K(0.8660)(1.25-1) = 1.2475\times10^{-5}\times0.8660\times0.25 = 2.701\times10^{-6}\,\mathrm{km/s^2},
$$

$$
a_z = K(0.5)(1.25-3) = -1.2475\times10^{-5}\times0.5\times1.75 = -1.0916\times10^{-5}\,\mathrm{km/s^2}.
$$

The size is $\sqrt{a_x^2+a_z^2} \approx 1.1245\times10^{-5}\,\mathrm{km/s^2}$, or $1.125\times10^{-2}\,\mathrm{m/s^2}$.

**Does it make sense?** The size is close to the equator value but not the same, and the direction has swung: $a_z$ is negative, pulling the spacecraft toward the equatorial plane. That latitude dependence is exactly what produces the slow drifts the next lessons derive.
:::

## Higher zonals: J3, J4 and beyond

$J_2$ is not the only zonal coefficient, but it is by far the largest. Standard Earth values are

$$
J_2 = 1.082\,626\,68\times10^{-3}, \qquad J_3 \approx -2.532\times10^{-6}, \qquad J_4 \approx -1.611\times10^{-6},
$$

with $J_5$ and $J_6$ of order $10^{-7}$. So $J_2$ is about $430$ times $|J_3|$ and $670$ times $|J_4|$ — roughly a thousand times, three orders of magnitude, give or take.

What each one means:

- **$J_2$** is the oblateness — the equatorial bulge, the same in both hemispheres.
- **$J_3$** goes with $P_3$, an *odd* polynomial: it changes sign between north and south. So it measures a north–south lopsidedness, Earth's slight **[[pear shape|pear-shape]]**. The popular name overstates it — the effect is tens of meters on a planet $12\,700\,\mathrm{km}$ across.
- **$J_4$** and the higher even terms refine the pole-to-equator flattening beyond the single bulge $J_2$ captures.

How fast do they fade? At a fixed latitude, compare the degree-$n$ acceleration with $J_2$'s. From the general formulas, the ratio is roughly

$$
\frac{J_n}{J_2}\left(\frac{R_E}{r}\right)^{n-2} .
$$

The big drop is the first step: $J_3/J_2$ is only about $2\times10^{-3}$. After that the coefficients are all small, of order $10^{-6}$ to $10^{-7}$, and each extra degree adds one more factor of $R_E/r$, a bit less than one in low orbit. So in low orbit every higher zonal sits roughly three orders of magnitude or more below $J_2$.

::: example Comparing J3's push with J2's
Stay at $30^\circ$ latitude and $r = 6778.137\,\mathrm{km}$, and use $J_3 = -2.532\times10^{-6}$.

**The polynomial and its slope** at $s = \sin30^\circ = 0.5$:

$$
P_3(0.5) = \frac{5(0.125) - 3(0.5)}{2} = \frac{0.625 - 1.5}{2} = -0.4375, \qquad P_3'(0.5) = \frac{15(0.25) - 3}{2} = 0.375 .
$$

**The common factor.** $\mu |J_3| R_E^3/r^5 = 1.8303\times10^{-5}\,\mathrm{m/s^2}$. Because $J_3$ is negative, $\mu J_3 R_E^3/r^5 = -1.8303\times10^{-5}\,\mathrm{m/s^2}$.

**Radial part**, with $n + 1 = 4$:

$$
a_r = 4\times(-1.8303\times10^{-5})\times(-0.4375) = 3.203\times10^{-5}\,\mathrm{m/s^2}.
$$

**Northward part**, with $\cos30^\circ = 0.8660$:

$$
a_\phi = -(-1.8303\times10^{-5})\times0.375\times0.8660 = 5.944\times10^{-6}\,\mathrm{m/s^2}.
$$

**Size:** $\sqrt{a_r^2 + a_\phi^2} \approx 3.26\times10^{-5}\,\mathrm{m/s^2}$. That is about $0.29\%$ of $J_2$'s $1.125\times10^{-2}\,\mathrm{m/s^2}$ at the same point — the "about a thousand times smaller" rule, within a factor of a few. It is small enough that mission design usually lumps $J_3$ and up into one "higher harmonics" bucket, as the last lesson's table did.
:::

### How far real models go

High-precision work — the GPS ground segment, or orbit determination from laser ranging to a few centimeters — uses full gravity models such as EGM96 or **[[EGM2008|grace]]**. They list zonal, tesseral and sectoral coefficients out to degree and order 360 and far beyond, fine enough to see the pull of individual mountain ranges. GNC design work, and every propagator in this module, needs at most $J_2$ through $J_6$. The thousands of other coefficients each add a tiny amount. Together their effect is far smaller than $J_2$'s, but far larger than centimeters, which is why precision work carries them.

::: key The geopotential and J2
$$
U(r,\phi) = \frac{\mu}{r}\left[1 - \sum_{n\ge2} J_n\left(\frac{R_E}{r}\right)^n P_n(\sin\phi)\right], \qquad \mathbf{a} = \nabla U .
$$
$J_2 = 1.08263 \times 10^{-3}$ (more precisely $1.082\,626\,68\times10^{-3}$) is the oblateness term of the geopotential — the equatorial bulge. It is about a thousand times larger than any other harmonic coefficient. Its Cartesian acceleration is
$$
\mathbf{a}_{J_2} = \frac{3}{2}\frac{J_2\mu R_E^2}{r^4}\left[\frac{x}{r}\Big(5\frac{z^2}{r^2}-1\Big),\ \frac{y}{r}\Big(5\frac{z^2}{r^2}-1\Big),\ \frac{z}{r}\Big(5\frac{z^2}{r^2}-3\Big)\right].
$$
:::

::: warning Geocentric latitude, not geodetic latitude
The $\phi$ in every formula here is *geocentric* latitude, computed from the state vector as $\sin\phi = z/r$. The latitude on a map or from a GPS receiver is *geodetic*: the angle between the local "straight down" on the reference ellipsoid and the equatorial plane. They differ by up to about $11.5$ arcminutes near $45^\circ$, and by zero at the equator and poles.

Always use geocentric latitude computed from the Cartesian state. Swapping in a geodetic latitude from a ground-station database is a common, hard-to-spot error. It sounds harmless, but $J_2$'s whole effect lives in exactly this kind of latitude dependence. At $400\,\mathrm{km}$ and $45^\circ$, the mix-up shifts the $J_2$ acceleration by about $1.3\times10^{-4}\,\mathrm{m/s^2}$ — about $1\%$ of $J_2$, and roughly four times $J_3$'s entire push.
:::

## Check yourself

::: check
Why does the sum in the geopotential start at $n = 2$ and not at $n = 0$ or $n = 1$?
:::

::: answer
An $n = 0$ term would only rescale the overall strength $\mu$, which is already in the point-mass term $\mu/r$ in front of the bracket.

An $n = 1$ term describes the center of mass being offset from the origin. It vanishes once the origin is placed at Earth's actual center of mass, because by definition there is no net lopsidedness about the center of mass.

The first real shape term is $n = 2$, the quadrupole term — $J_2$.
:::

::: check
Without computing the vector, explain why $J_2$'s acceleration points inward over the equator but outward along the axis over the poles.
:::

::: answer
$J_2$ describes the equatorial bulge. Compared with a round Earth of the same mass, there is extra mass near the equator and less near the poles.

A spacecraft over the equator is near that extra mass, which pulls it inward harder than the point-mass model says, so the correction points inward.

A spacecraft over a pole is near the missing mass, so the pull is weaker than the point-mass model says. A weaker inward pull shows up as an *outward* correction along the axis.
:::

::: check
Using the scaling rule from this lesson, that the degree-$n$ acceleration relative to $J_2$'s goes as $(J_n/J_2)(R_E/r)^{n-2}$, estimate how much smaller $J_4$'s acceleration is than $J_2$'s at $r = 6778.137\,\mathrm{km}$. Use $J_4 \approx -1.611\times10^{-6}$.
:::

::: answer
The coefficient ratio is $|J_4|/J_2 = 1.611\times10^{-6}/1.0826\times10^{-3} \approx 1.49\times10^{-3}$.

The distance factor is $(R_E/r)^2 = (6378.137/6778.137)^2 \approx 0.8855$.

The product is about $1.3\times10^{-3}$. So $J_4$'s push is roughly a thousand times smaller than $J_2$'s at this height. That matches the last lesson's table, where the higher-harmonics row sits about three orders of magnitude below the $J_2$ row.
:::

::: check
A colleague computes the $J_2$ acceleration using the geodetic latitude from a ground-station almanac instead of the geocentric latitude from the spacecraft's own position. Is the error large or small, and why?
:::

::: answer
It is a real error, even though $11.5$ arcminutes (about $0.19^\circ$) sounds tiny.

$J_2$'s whole content is a latitude-dependent correction of about $10^{-3}$ of gravity. The two latitudes differ most at mid-latitudes, which is where $J_2$'s latitude dependence changes fastest. At $400\,\mathrm{km}$ and $45^\circ$, the wrong latitude shifts the acceleration by about $1.3\times10^{-4}\,\mathrm{m/s^2}$ — larger than all of $J_3$.

It is also *systematic*: the wrong formula gives the same bias every time the spacecraft passes that latitude. It does not average away over an orbit the way random noise would.
:::

::: check
Why does high-precision orbit determination, such as matching laser-ranging data to a few centimeters, need a gravity model with thousands of coefficients, when this module's propagators use at most six?
:::

::: answer
The zonals $J_2$ through $J_6$ capture the part of Earth's gravity that depends only on latitude. That is enough for the accuracy most GNC design and analysis needs.

The tesseral and sectoral terms capture mass lumps that depend on longitude — mountain ranges, ocean trenches, denser patches of crust and mantle. Each is much smaller than $J_2$, but together, across thousands of coefficients, they matter at the centimeter level that geodesy and precise orbit determination demand.

Which model to use is a question of the error budget the job can tolerate, not of which model is "more correct".
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a} = \nabla U$ | Acceleration is the gradient of the potential; point mass $U = \mu/r$ |
| $U(r,\phi) = (\mu/r)\big[1 - \sum_{n\ge2} J_n(R_E/r)^n P_n(\sin\phi)\big]$ | Geopotential as a sum of zonal harmonics |
| $\phi$ | Geocentric latitude, $\sin\phi = z/r$ — not geodetic latitude |
| $P_2(s) = (3s^2-1)/2$ | Legendre polynomial for $J_2$ |
| $a_r = (n+1)\mu J_nR_E^n P_n(\sin\phi)/r^{n+2}$, $a_\phi = -\mu J_nR_E^nP_n'(\sin\phi)\cos\phi/r^{n+2}$ | Acceleration from one zonal term, radial and northward |
| $\mathbf{a}_{J_2} = \tfrac32(J_2\mu R_E^2/r^4)\big[(x/r)(5z^2/r^2-1),\,(y/r)(5z^2/r^2-1),\,(z/r)(5z^2/r^2-3)\big]$ | $J_2$ acceleration in Cartesian form |
| $J_2 = 1.082\,626\,68\times10^{-3}$ | Earth's oblateness; about $1000\times$ any other harmonic coefficient |
| $J_3 \approx -2.532\times10^{-6}$, $J_4\approx-1.611\times10^{-6}$ | Next zonals: north–south lopsidedness and finer flattening |

Next lesson: you have a force; now you want to know what it does to an orbit. The Gauss variational equations turn any perturbing acceleration, including this one, into the rate of change of each orbital element.

::: context oblate-picture A squashed ball, exaggerated
The blue outline is a round sphere. The dark outline is an oblate spheroid with the same equator, squashed at the poles. Here the squash is exaggerated about 60 times so you can see it. Earth's real flattening, $21.4\,\mathrm{km}$ out of $6378\,\mathrm{km}$, would be thinner than the line itself at this size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="80" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <ellipse cx="180" cy="100" rx="80" ry="64" fill="#fff" fill-opacity="0.4" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="100" x2="260" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="100" x2="180" y2="36" stroke="#b4232c" stroke-width="2"/>
  <text x="220" y="94" font-size="12" fill="#1d6fd1" text-anchor="middle">equatorial</text>
  <text x="186" y="62" font-size="12" fill="#b4232c">polar</text>
  <text x="270" y="104" font-size="11" fill="#1f2a44">6378 km</text>
  <text x="186" y="30" font-size="11" fill="#1f2a44">6357 km</text>
  <text x="174" y="20" font-size="11" fill="#6c7a93" text-anchor="end">spin axis</text>
</svg>
```
:::

::: context shell-theorem Why a round planet acts like a point
In 1687, in the *Principia*, Isaac Newton proved that a hollow shell of uniform mass pulls on anything outside it exactly as if all its mass sat at the center. A solid ball is a nest of such shells, so a ball whose density depends only on depth also acts like a point.

The proof needs perfect roundness. Squash the ball and the shells are no longer spheres, so the point-mass answer is only approximately right. Every term in this lesson measures how wrong it is.
:::

::: context potential-hill The potential as a hill
Picture gravity as a landscape. With the sign used in this module, the potential $U = \mu/r$ is larger the closer you are to Earth, so the landscape rises toward the planet like a steep mountain. The acceleration points up the slope, toward the peak — inward.

The landscape idea pays off because a single number per point is much easier to add up than a vector per point. You write down one potential for each piece of the planet's shape, add the numbers, and take the slope once at the end. (Many physics books flip the sign, with $\mathbf{a} = -\nabla U$ and $U = -\mu/r$, so gravity points downhill instead. The physics is identical; only the bookkeeping differs.)
:::

::: context measured-from-orbits Earth's shape, measured by satellites
Before satellites, the flattening was estimated from surveys on the ground. The first artificial satellites turned the problem around: their orbits drifted in exactly the way this module will predict from $J_2$, so measuring the drift measured $J_2$.

In 1958 Desmond King-Hele and colleagues in Britain used the drift of Sputnik 2's orbit to work out Earth's flattening as about $1/298.3$ — close to the value used today, $1/298.257$. Every $J_n$ in this lesson is known the same way: by watching what real orbits do.
:::

::: context legendre What the Legendre polynomials look like
Adrien-Marie Legendre introduced these polynomials in the 1780s while working out the gravitational pull of squashed spheres — the very problem in this lesson. Here are $P_2$ (blue) and $P_3$ (red) for $s = \sin\phi$ from $-1$ (South Pole) to $+1$ (North Pole). $P_2$ is symmetric, the same north and south. $P_3$ is flipped between the hemispheres, which is why $J_3$ measures north–south lopsidedness. Every $P_n$ equals $1$ at the North Pole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="30" x2="180" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="36" y1="35" x2="324" y2="35" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="36" y1="165" x2="324" y2="165" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,35.0 47.0,44.5 54.0,53.5 61.0,62.1 68.0,70.1 75.0,77.7 82.0,84.7 89.0,91.3 96.0,97.4 103.0,103.0 110.0,108.1 117.0,112.8 124.0,116.9 131.0,120.6 138.0,123.7 145.0,126.4 152.0,128.6 159.0,130.3 166.0,131.5 173.0,132.3 180.0,132.5 187.0,132.3 194.0,131.5 201.0,130.3 208.0,128.6 215.0,126.4 222.0,123.7 229.0,120.6 236.0,116.9 243.0,112.8 250.0,108.1 257.0,103.0 264.0,97.4 271.0,91.3 278.0,84.7 285.0,77.7 292.0,70.1 299.0,62.1 306.0,53.5 313.0,44.5 320.0,35.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,165.0 47.0,146.7 54.0,130.7 61.0,116.9 68.0,105.2 75.0,95.4 82.0,87.5 89.0,81.3 96.0,76.6 103.0,73.4 110.0,71.6 117.0,70.9 124.0,71.4 131.0,72.8 138.0,75.1 145.0,78.2 152.0,81.8 159.0,85.9 166.0,90.4 173.0,95.1 180.0,100.0 187.0,104.9 194.0,109.6 201.0,114.1 208.0,118.2 215.0,121.8 222.0,124.9 229.0,127.2 236.0,128.6 243.0,129.1 250.0,128.4 257.0,126.6 264.0,123.4 271.0,118.7 278.0,112.5 285.0,104.6 292.0,94.8 299.0,83.1 306.0,69.3 313.0,53.3 320.0,35.0"/>
  <g font-size="11" fill="#1f2a44">
    <text x="30" y="39" text-anchor="end">1</text><text x="30" y="104" text-anchor="end">0</text><text x="30" y="169" text-anchor="end">−1</text>
    <text x="40" y="186" text-anchor="middle">−1</text><text x="180" y="186" text-anchor="middle">0</text><text x="320" y="186" text-anchor="middle">1</text>
    <text x="180" y="199" text-anchor="middle" fill="#6c7a93">s = sin φ</text>
  </g>
  <text x="200" y="145" font-size="12" fill="#1d6fd1">P2</text>
  <text x="96" y="64" font-size="12" fill="#b4232c">P3</text>
</svg>
```
:::

::: context zonal-bands The zones in "zonal"
$P_2(\sin\phi)$ is zero where $\sin^2\phi = 1/3$, which is latitude $\pm35.26^\circ$. Between those two lines it is negative; beyond them, toward the poles, it is positive. So the $J_2$ term splits the globe into three zones: an equatorial belt and two polar caps. Higher $P_n$ cut it into more bands, like the stripes on a beach ball seen from above a pole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="80" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <path d="M114.68,53.81 A80,80 0 0,1 245.32,53.81 Z" fill="#8fb8f0"/>
  <path d="M114.68,146.19 A80,80 0 0,0 245.32,146.19 Z" fill="#8fb8f0"/>
  <circle cx="180" cy="100" r="80" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="114.68" y1="53.81" x2="245.32" y2="53.81" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="114.68" y1="146.19" x2="245.32" y2="146.19" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="100" y1="100" x2="260" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="180" y="42" font-size="12" fill="#1f2a44" text-anchor="middle">P2 &gt; 0</text>
  <text x="180" y="92" font-size="12" fill="#1f2a44" text-anchor="middle">P2 &lt; 0</text>
  <text x="180" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">P2 &gt; 0</text>
  <text x="252" y="50" font-size="11" fill="#1f2a44">35.26° N</text>
  <text x="252" y="158" font-size="11" fill="#1f2a44">35.26° S</text>
  <text x="268" y="104" font-size="11" fill="#6c7a93">equator</text>
</svg>
```
:::

::: context pear-shape The pear-shaped Earth
The small US satellite Vanguard 1, launched in 1958, was tracked closely enough for John O'Keefe and his colleagues to find a steady north–south asymmetry in its orbit, published in 1959. That was the first measurement of $J_3$, and the newspapers called it a "pear-shaped Earth".

The pear is extremely subtle: the sea-level surface near the North Pole sits roughly 10 to 20 meters higher, and near the South Pole roughly 20 to 30 meters lower, than a perfectly symmetric squashed ball. You could never see it. Satellites feel it because they sum its effect over thousands of orbits.
:::

::: context grace Weighing Earth from orbit
EGM2008, a widely used model, is complete to degree and order 2159 — millions of numbers, fine enough to show the gravity of single mountain ranges.

Earth's gravity even changes over time. The GRACE mission (2002–2017) and its successor GRACE Follow-On (launched 2018) fly two satellites one behind the other and measure the tiny changes in the distance between them. From those changes scientists map shifting mass month by month: melting ice sheets, draining groundwater, moving ocean water. Even $J_2$ itself drifts very slowly as the planet's mass moves around.
:::
