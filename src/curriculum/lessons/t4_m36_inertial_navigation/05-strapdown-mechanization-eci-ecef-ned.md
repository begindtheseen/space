---
id: l05-strapdown-mechanization-eci-ecef-ned
title: Strapdown mechanization in ECI, ECEF, and the local-level frame
minutes: 16
covers:
  - "Strapdown mechanization in ECI, ECEF and local-level (NED) frames"
---

A strapdown mechanization is the software that turns a stream of corrected gyro and accelerometer samples into a running estimate of attitude, velocity and position. It is a loop, not a formula: the current attitude estimate rotates the newly measured specific force into a navigation frame, gravity and any Coriolis-type terms are added, the result is integrated once into velocity and once more into position, and the updated velocity feeds back into the attitude update for the next step through the frame's own rotation rate. Every strapdown navigator ever flown is this loop, in one of a small number of reference frames, and the frame you pick changes the equations, the complexity, and what the output looks like when you print it — without changing the physics underneath.

This lesson lays out the three frame choices this module works with — Earth-centred inertial (ECI), Earth-centred Earth-fixed (ECEF), and the local-level or north-east-down (NED) frame — and derives the mechanization equations' frame-dependent parts: the rotation rate each frame carries relative to inertial space, and, for the local-level frame, the geodesy that turns a velocity into a latitude and longitude. The rotating-frames module already built every tool this needs — the transport theorem, the definitions of ECI and ECEF, the construction of NED — so this lesson uses that machinery rather than rebuilding it, and spends its effort on what is specific to inertial navigation: which frame's own rotation shows up as an apparent force, and what that costs.

## Three frames, one transport theorem

Recall the tool. For any vector $\mathbf x$ and two frames related by angular rate $\boldsymbol\omega$, the rotating-frames module's transport theorem gives

$$
\left.\frac{d\mathbf x}{dt}\right|_{\text{frame }i} = \left.\frac{d\mathbf x}{dt}\right|_{\text{frame }r} + \boldsymbol\omega_{ir}\times\mathbf x .
$$

Applied to position and then to velocity, this is the entire content of a strapdown mechanization's velocity equation: whatever frame you differentiate in that is not itself inertial picks up an extra $\boldsymbol\omega\times(\cdot)$ term the accelerometer never measures, because the accelerometer measures specific force in a frame that does not care about your choice of navigation frame at all. The three frames this module uses differ only in what $\boldsymbol\omega$ is.

**ECI**, the J2000/GCRF frame the rotating-frames module defined, does not rotate relative to itself by construction, so a velocity resolved in ECI needs no such correction: $\dot{\mathbf v}^i = \mathbf f^i + \mathbf g_{grav}^i$, specific force rotated into ECI plus gravitation, full stop. This is the frame Newton's law was written in back in the first lesson of this module, and it is why guidance during ascent and orbit insertion is very often mechanized here — the equations of motion are literally the simplest possible.

**ECEF** rotates with the Earth at $\boldsymbol\omega_{ie}$, so a velocity resolved in ECEF, which is what a GPS receiver reports and what a ground track is naturally described in, picks up one correction term when you differentiate: an apparent Coriolis acceleration $2\boldsymbol\omega_{ie}\times\mathbf v^e$ plus a centrifugal term that the rotating-frames module showed folds into the gravitation to make **gravity** $\mathbf g$ — the quantity this module's first lesson already used. This is the natural frame for anything whose job is to answer "where is this, relative to the ground."

**NED** goes one step further. It does not merely rotate with the Earth; it also tips as the vehicle moves, since "north" and "down" are defined relative to the vehicle's own changing position on a curved surface. Its rotation rate relative to inertial space is $\boldsymbol\omega_{in}^n = \boldsymbol\omega_{ie}^n + \boldsymbol\omega_{en}^n$: Earth rate, resolved in NED exactly as the first lesson of this module derived it, plus a second term, the **transport rate** $\boldsymbol\omega_{en}$, the rate at which NED rotates relative to ECEF because the vehicle is moving over a curved Earth. NED is the frame that outputs latitude, longitude and height directly and reads naturally to a human, at the cost of carrying this extra term — and, as the last section of this lesson shows, at the cost of becoming impractical at high enough speed.

::: key The velocity equation's shape, frame by frame
$\dot{\mathbf v}^i = \mathbf f^i+\mathbf g_{grav}^i$ in ECI (no rotation term); $\dot{\mathbf v}^e = \mathbf f^e - 2\boldsymbol\omega_{ie}\times\mathbf v^e+\mathbf g^e$ in ECEF (Earth rate only); $\dot{\mathbf v}^n = \mathbf f^n-(2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n+\mathbf g^n$ in NED (Earth rate plus transport rate). Each extra term is the transport theorem's $\boldsymbol\omega\times\mathbf v$, paid for the convenience of that frame's output.
:::

## WGS84 geodesy: the two radii of curvature

The transport rate needs to know how fast latitude and longitude change for a given velocity, and that depends on the Earth's shape, not only its rotation. WGS84 models the Earth as an ellipsoid of revolution, semi-major axis $a = 6\,378\,137\,\mathrm m$ and eccentricity squared $e^2 = 6.694\,38\times10^{-3}$, and a vehicle moving north or east at geodetic latitude $\varphi$ sees two different local radii of curvature, because a meridian (a north-south slice) and a parallel (an east-west circle) are not the same shape.

The **meridian radius of curvature** $R_M$ governs north-south motion: moving north at speed $v_N$ changes latitude at $\dot\varphi = v_N/(R_M+h)$. The **transverse** (or normal) **radius of curvature** $R_N$ governs east-west motion at a given height: $\dot\lambda = v_E/[(R_N+h)\cos\varphi]$, the $\cos\varphi$ because a parallel's actual radius shrinks toward the poles. Both come from the ellipse's curvature:

$$
R_M = \frac{a(1-e^2)}{(1-e^2\sin^2\varphi)^{3/2}}, \qquad R_N = \frac{a}{\sqrt{1-e^2\sin^2\varphi}}.
$$

At the equator, $R_N = a$ exactly — the transverse radius there is the semi-major axis itself, since a slice through the equator is a circle of that radius — while $R_M = 6\,335\,439\,\mathrm m$, smaller, because the meridian ellipse curves more tightly at the equator than a circle of radius $a$ would. At the poles the two coincide, both equal to the **polar radius of curvature** $a^2/b = 6\,399\,594\,\mathrm m$ (with $b=a\sqrt{1-e^2}$ the semi-minor axis), since every direction through the pole is equivalent. Between the two, $R_M < R_N$ everywhere except at the poles, and the gap is not small: at $45^\circ$ latitude $R_M = 6\,367\,382\,\mathrm m$ against $R_N = 6\,388\,838\,\mathrm m$, a difference of $21.5\,\mathrm{km}$ — using a single mean Earth radius in place of both, a shortcut that shows up in more textbooks than it should, misstates a $250\,\mathrm{m/s}$ aircraft's latitude rate by several parts in ten thousand, enough to matter over a long flight.

::: example Two radii, one platform, at Cape Canaveral

At $\varphi = 28.5^\circ$, the latitude this module has used since its first lesson, $R_M = 6\,349\,951\,\mathrm m$ and $R_N = 6\,383\,003\,\mathrm m$, a gap of $33.1\,\mathrm{km}$. A ground vehicle moving due north at $20\,\mathrm{m/s}$ changes latitude at $\dot\varphi = 20/6\,349\,951 = 3.150\times10^{-6}\,\mathrm{rad/s}$, or $0.650^\circ/\mathrm{h}$; the same vehicle moving due east at $20\,\mathrm{m/s}$ changes longitude at $\dot\lambda = 20/(6\,383\,003\times\cos28.5^\circ) = 3.565\times10^{-6}\,\mathrm{rad/s} = 0.735^\circ/\mathrm{h}$ — eastward motion advances longitude $13\%$ faster than the same speed northward advances latitude, entirely because $R_N > R_M$ and the parallel is already narrower than the meridian at this latitude before the speed difference is even considered.
:::

## The transport rate

Two contributions to $\boldsymbol\omega_{en}^n$, and each has a clean geometric source. Longitude rate $\dot\lambda$ is a rotation about the Earth's polar axis, exactly the same kind of rotation Earth rate itself is — so it resolves into NED by the identical projection the first lesson of this module used for $\boldsymbol\omega_{ie}^n$, with $\dot\lambda$ standing in for $\omega_{ie}$: $\dot\lambda(\cos\varphi,\,0,\,-\sin\varphi)$. Latitude rate $\dot\varphi$ is different in kind: it tips the local vertical forward as you move north, a rotation about the local **east** axis, contributing $\dot\varphi\,(0,\,-1,\,0)$ — negative because increasing latitude rotates north toward up, which is a negative rotation about east by the right-hand rule. Add the two and substitute $\dot\varphi = v_N/(R_M+h)$, $\dot\lambda = v_E/[(R_N+h)\cos\varphi]$:

$$
\boldsymbol\omega_{en}^n = \left(\frac{v_E}{R_N+h},\ -\frac{v_N}{R_M+h},\ -\frac{v_E\tan\varphi}{R_N+h}\right).
$$

Differentiating the NED-to-ECEF direction cosine matrix directly and extracting its instantaneous rotation rate confirms this to thirteen significant figures for an arbitrary test velocity — the derivation above is exact, not an approximation valid only for small rates.

::: example When transport rate is negligible, and when it is not

At $45^\circ$ latitude, a ship moving at $5\,\mathrm{m/s}$ ($\approx10\,\mathrm{kn}$) has $|\boldsymbol\omega_{en}| = 7.85\times10^{-7}\,\mathrm{rad/s}$, about $1.1\%$ of Earth rate $\omega_{ie}=7.292\times10^{-5}\,\mathrm{rad/s}$ — safely ignorable for anything but a strategic-grade system. An aircraft flying due north at $250\,\mathrm{m/s}$ ($\approx900\,\mathrm{km/h}$) has $|\boldsymbol\omega_{en}|=3.93\times10^{-5}\,\mathrm{rad/s}$, $54\%$ of Earth rate, and flying due east at the same speed gives $5.53\times10^{-5}\,\mathrm{rad/s}$, $76\%$ of Earth rate — an aircraft-grade INS that dropped this term would be dropping a correction comparable in size to the one every INS textbook insists on keeping. Push the speed to orbital, $7.7\,\mathrm{km/s}$, and $|\boldsymbol\omega_{en}|$ reaches $1.21\times10^{-3}\,\mathrm{rad/s}$, over sixteen times Earth rate: the local-level frame would be spinning faster than the vehicle can usefully track, which is the mechanical reason orbital mechanization is done in ECI rather than NED, not merely a matter of taste.
:::

## Choosing a frame

The choice is an engineering trade, not a rule. ECI costs nothing in rotation terms but hands back Cartesian inertial coordinates nobody on the ground finds readable, so it dominates during boost and orbital flight, where the vehicle's own guidance already thinks in orbital elements or inertial state vectors, and a ground display converts afterward. ECEF is the natural common frame for anything referenced against GPS, whose broadcast solution is ECEF by definition, and for long-range cruise where the destination is a fixed point on a rotating Earth rather than a fixed direction in inertial space. NED costs a second rotation term and the geodesy above, and earns it back by outputting latitude, longitude and height — what a pilot, a ship's navigator, or a ground operator actually wants to read — directly from the mechanization loop with no further conversion, provided the vehicle's speed keeps $\boldsymbol\omega_{en}$ inside a range the loop can still integrate accurately. Aircraft and most ground and marine systems mechanize in NED for exactly that reason; the module's own strapdown exercise does too.

::: warning
It is tempting to treat $\boldsymbol\omega_{en}$ as a small correction and linearize or drop it "for now." Its size scales with speed, not with any sensor grade, so whether it is negligible has nothing to do with whether the IMU is tactical or navigation grade and everything to do with how fast the vehicle is moving — the worked example above showed it reaching most of Earth rate for an ordinary airliner. Dropping it is a modelling decision about the vehicle, never a simplification that a better gyro makes safe.
:::

## Check yourself

::: check
Why is $R_N=a$ exactly at the equator, while $R_M$ is not?
:::

::: answer
A slice through the equator perpendicular to the polar axis is, by the definition of an ellipsoid of revolution, a perfect circle of radius $a$ — the semi-major axis is the equatorial radius by construction, and the transverse radius of curvature at any point equals the distance from that point to the polar axis measured along the local normal, which at the equator is exactly $a$. The meridian, by contrast, is an ellipse, not a circle, and its radius of curvature at the equator is the ellipse's own curvature there, $a(1-e^2)$ scaled further by the $(1-e^2\sin^2\varphi)^{3/2}$ term — a genuinely different geometric quantity that happens to coincide with $a$ nowhere except in the limit $e\to0$, a sphere.
:::

::: check
A submarine cruises at $10\,\mathrm{m/s}$ due east at $60^\circ$ latitude. Compute $\dot\lambda$ and compare the size of $\boldsymbol\omega_{en}^n$'s down component to its north component.
:::

::: answer
At $60^\circ$, $R_N = 6\,394\,209\,\mathrm m$ (transverse radius grows slowly with latitude). $\dot\lambda = v_E/[(R_N+h)\cos60^\circ] = 10/(6\,394\,209\times0.5) = 3.128\times10^{-6}\,\mathrm{rad/s}$. The down component is $-\dot\lambda\sin60^\circ = -2.709\times10^{-6}\,\mathrm{rad/s}$ and the north component, from a purely eastward velocity, is $v_E/(R_N+h)=\dot\lambda\cos60^\circ=1.564\times10^{-6}\,\mathrm{rad/s}$; the down component is larger because $\tan60^\circ>1$, and both grow toward the pole while the north component from eastward motion alone shrinks toward the equator's $\cos\varphi\to1$, $\sin\varphi\to0$ limit.
:::

::: check
Explain, without doing any arithmetic, why an ECI mechanization needs no equivalent of $\boldsymbol\omega_{en}$ at all, not even a small one.
:::

::: answer
$\boldsymbol\omega_{en}$ exists because the NED frame's own axes are defined relative to the vehicle's position on a rotating, curved surface, so the frame itself reorients as the vehicle moves, independent of anything the vehicle's attitude is doing. ECI's axes are fixed directions in inertial space by definition — they do not know or care where the vehicle is — so there is no mechanism by which the vehicle's motion could make the frame itself rotate. The transport theorem's $\boldsymbol\omega\times\mathbf x$ term is exactly zero for ECI because $\boldsymbol\omega_{ii}=\mathbf 0$ identically, not because the term has been made small.
:::

::: check
A navigation engineer proposes mechanizing a hypersonic glide vehicle, apogee speed near $6\,\mathrm{km/s}$, in NED throughout its flight "for consistency with the ground display." What number from this lesson would you show them, and what would you recommend instead?
:::

::: answer
Scale the orbital-speed result: at $7.7\,\mathrm{km/s}$, $|\boldsymbol\omega_{en}|\approx16.6\,\omega_{ie}$, so at $6\,\mathrm{km/s}$ it is still on the order of $13\,\omega_{ie}\approx9.5\times10^{-4}\,\mathrm{rad/s}$ — a frame rotating roughly ten thousand times faster than the vehicle needs its ground display updated, which strains both the numerical integration of the attitude and the small-angle assumptions much of the mechanization relies on. The better answer is to mechanize in ECI or ECEF, where no such term appears or it is bounded by Earth rate alone, and convert to latitude, longitude and height only for the ground display, a coordinate transformation applied to the output rather than carried through the integration itself.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{\mathbf v}^i=\mathbf f^i+\mathbf g_{grav}^i$ | ECI velocity equation: no rotation term |
| $\dot{\mathbf v}^e=\mathbf f^e-2\boldsymbol\omega_{ie}\times\mathbf v^e+\mathbf g^e$ | ECEF velocity equation: Earth-rate Coriolis only |
| $\dot{\mathbf v}^n=\mathbf f^n-(2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n+\mathbf g^n$ | NED velocity equation: Earth rate plus transport rate |
| $R_M=\dfrac{a(1-e^2)}{(1-e^2\sin^2\varphi)^{3/2}}$ | Meridian radius of curvature; governs north-south motion |
| $R_N=\dfrac{a}{\sqrt{1-e^2\sin^2\varphi}}$ | Transverse radius of curvature; governs east-west motion; $R_N(0^\circ)=a$ |
| $\boldsymbol\omega_{en}^n=\left(\dfrac{v_E}{R_N+h},\,-\dfrac{v_N}{R_M+h},\,-\dfrac{v_E\tan\varphi}{R_N+h}\right)$ | Transport rate: NED's own rotation from moving over a curved Earth |
| ECI / ECEF / NED | Simplest dynamics / ground-referenced / human-readable, in order of increasing rotation-term cost |

The next lesson takes these three velocity equations and turns each into an actual update algorithm — how the attitude, velocity and position states advance from one IMU sample to the next — including the gravity model this lesson has so far left as a symbol, $\mathbf g$.
