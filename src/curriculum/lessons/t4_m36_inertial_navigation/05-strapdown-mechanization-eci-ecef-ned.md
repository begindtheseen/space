---
id: l05-strapdown-mechanization-eci-ecef-ned
title: Strapdown mechanization in ECI, ECEF, and the local-level frame
minutes: 18
covers:
  - "Strapdown mechanization in ECI, ECEF and local-level (NED) frames"
---

Close your eyes in the back seat of a car and try to keep track of where you are. You feel the car speed up, slow down and turn. If you remember which way you are facing, you can add up every push into a speed, and add up the speed into a distance traveled. That is dead reckoning with your inner ear, and it is exactly what an inertial navigator does — except that it does it hundreds of times a second, with instruments instead of an inner ear, and with no guessing.

A **strapdown mechanization** is the software that does this. Its inputs are the corrected gyro and accelerometer samples from the previous lessons. Its outputs are a running estimate of **attitude** (which way the vehicle faces), **velocity** and **position**. "Strapdown" means the sensors are bolted, or strapped, straight to the vehicle's body and turn with it, and "mechanization" is the old name for the equations that turn their readings into navigation.

It is a loop, not a formula. Every strapdown navigator ever flown runs the same loop, in one of a few **reference frames** — a set of three axes you measure everything against. The frame you choose changes the equations, how hard they are, and what the answer looks like when you print it. It does not change the physics. This lesson lays out the three frames this module uses and works out what each one costs. The next lesson turns them into an actual step-by-step update.

## The loop

Here is one pass of the loop, in words:

1. **Attitude.** Use the gyro reading to update which way the body faces relative to the navigation frame.
2. **Rotate.** Use that attitude to turn the accelerometer's reading, the **specific force** $\mathbf f$ (everything pushing on the vehicle except gravity), from body axes into navigation axes.
3. **Add what the accelerometer cannot feel.** Add gravity from a computer model. Add any extra terms the navigation frame's own rotation creates.
4. **Integrate twice.** The sum is the rate of change of velocity. Step it once into velocity, and velocity once more into position.
5. **Feed back.** The new position and velocity tell you how the navigation frame itself is turning, which the next attitude update needs.

A word on notation, which this module uses throughout. A superscript says which axes a vector is written in: $\mathbf v^n$ is read "v in n", the velocity written in navigation axes. A pair of subscripts on a rate says what turns relative to what: $\boldsymbol\omega_{ie}$ is read "omega i e", the rate of the Earth frame $e$ relative to the inertial frame $i$. So $\boldsymbol\omega_{ie}^n$ is "omega i e, in n" — Earth's spin, written in navigation axes.

## Three frames, one transport theorem

Stand on a spinning merry-go-round and roll a ball straight out from the center. Someone on the ground sees it travel in a straight line. You, turning with the ride, see it curve away. Nothing pushed the ball sideways; your frame turned under it. Every rotating frame comes with this kind of bookkeeping.

The rotating-frames module wrote that bookkeeping as the **transport theorem**. For any vector $\mathbf x$ and two frames, with frame $r$ turning at angular rate $\boldsymbol\omega_{ir}$ relative to frame $i$:

$$
\left.\frac{d\mathbf x}{dt}\right|_{\text{frame }i} = \left.\frac{d\mathbf x}{dt}\right|_{\text{frame }r} + \boldsymbol\omega_{ir}\times\mathbf x .
$$

In words: the rate of change you see from frame $i$ equals the rate you see from the turning frame $r$, plus a cross-product term from the turning itself. Apply this to position, and then to velocity, and you have the whole content of a mechanization's velocity equation. Any frame that is not itself inertial picks up an extra $\boldsymbol\omega\times(\cdot)$ term, and the accelerometer never measures it, because the accelerometer does not care which navigation frame you chose. The three frames differ only in what $\boldsymbol\omega$ is.

### ECI: nothing turns

The **Earth-centered inertial** frame (**[[ECI|eci-j2000]]**) has its origin at Earth's center and axes pointed at fixed directions among the stars. It does not rotate, by construction, so velocity in ECI needs no correction at all:

$$
\dot{\mathbf v}^i = \mathbf f^i + \mathbf g_{grav}^i .
$$

Read $\dot{\mathbf v}^i$ as "v dot in i", the rate of change of velocity. It is specific force turned into ECI, plus **gravitation** $\mathbf g_{grav}$ — the pure pull of Earth's mass. That is Newton's law in its plainest form. It is why guidance during ascent and orbit insertion is very often mechanized in ECI: the equations of motion cannot be simpler.

### ECEF: turning with the Earth

The **Earth-centered Earth-fixed** frame (**ECEF**) is glued to the planet and spins with it, at Earth rate $\boldsymbol\omega_{ie}$. A GPS receiver reports position and velocity in ECEF, and a ground track is naturally described in it. Differentiating in this spinning frame adds two terms. One is the **[[Coriolis|coriolis]]** acceleration, $-2\boldsymbol\omega_{ie}\times\mathbf v^e$: the merry-go-round's sideways curve. The other is a centrifugal term, which the rotating-frames module showed folds into gravitation to make **gravity** $\mathbf g$ — the direction a plumb line actually hangs.

$$
\dot{\mathbf v}^e = \mathbf f^e - 2\boldsymbol\omega_{ie}\times\mathbf v^e + \mathbf g^e .
$$

ECEF is the natural frame for any question that starts "where is this, relative to the ground?"

### NED: turning with the Earth and with you

The **north-east-down** frame (**NED**), also called the **local-level** frame, goes one step further. Its axes point north, east and straight down *at the vehicle's current position*. So it does not only spin with the Earth — it also tips as the vehicle moves, because "north" and "down" change direction as you travel over a curved surface. Its rate relative to inertial space has two parts:

$$
\boldsymbol\omega_{in}^n = \boldsymbol\omega_{ie}^n + \boldsymbol\omega_{en}^n .
$$

The first is Earth rate, written in NED as the first lesson of this module derived it. The second is new: the **[[transport rate|transport-picture]]** $\boldsymbol\omega_{en}$, the rate at which NED turns relative to ECEF because the vehicle is moving over a curved Earth. The velocity equation picks it up:

$$
\dot{\mathbf v}^n = \mathbf f^n - (2\boldsymbol\omega_{ie}^n + \boldsymbol\omega_{en}^n)\times\mathbf v^n + \mathbf g^n .
$$

Notice that Earth rate appears **[[twice|why-twice]]** but the transport rate only once. NED earns its extra term by handing out latitude, longitude and height directly, in a form any person can read. As the last sections show, it also becomes impractical at very high speed.

::: key The velocity equation's shape, frame by frame
$\dot{\mathbf v}^i = \mathbf f^i+\mathbf g_{grav}^i$ in ECI (no rotation term); $\dot{\mathbf v}^e = \mathbf f^e - 2\boldsymbol\omega_{ie}\times\mathbf v^e+\mathbf g^e$ in ECEF (Earth rate only); $\dot{\mathbf v}^n = \mathbf f^n-(2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n+\mathbf g^n$ in NED (Earth rate plus transport rate). Each extra term is the transport theorem's $\boldsymbol\omega\times\mathbf v$, paid for the convenience of that frame's output.
:::

## WGS84 geodesy: the two radii of curvature

To find the transport rate, you need to know how fast latitude and longitude change for a given speed. That depends on Earth's shape, not only its spin.

Earth is not a ball. It bulges at the equator and is squashed at the poles, like a slightly sat-on beach ball. The **WGS84** model — the one GPS uses — describes it as an **[[ellipsoid|ellipsoid]]**: an ellipse spun about Earth's axis. Two numbers define it. The **semi-major axis** $a = 6\,378\,137\,\mathrm m$ is the equator's radius. The **eccentricity squared** $e^2 = 6.694\,38\times10^{-3}$ says how squashed the ellipse is ($e^2 = 0$ would be a perfect sphere).

On a squashed surface, "how curved is the ground here?" has two answers: one going north-south and another going east-west. Each is a **radius of curvature** — the radius of the circle that best hugs the surface in that direction.

- The **meridian radius of curvature** $R_M$ ("R sub M") governs north-south motion. A **meridian** is a north-south line, like a line of longitude. Moving north at speed $v_N$, at height $h$ above the ellipsoid, changes latitude at $\dot\varphi = v_N/(R_M+h)$.
- The **transverse radius of curvature** $R_N$ ("R sub N", also called the normal radius) governs east-west motion: $\dot\lambda = v_E/[(R_N+h)\cos\varphi]$. The $\cos\varphi$ is there because a circle of constant latitude, a **parallel**, shrinks toward the poles.

Here $\varphi$ ("phi") is the **[[geodetic latitude|geodetic-latitude]]** and $\lambda$ ("lambda") the longitude. Both radii come from the curvature of the ellipse:

$$
R_M = \frac{a(1-e^2)}{(1-e^2\sin^2\varphi)^{3/2}}, \qquad R_N = \frac{a}{\sqrt{1-e^2\sin^2\varphi}}.
$$

Check the ends. **At the equator**, $\sin\varphi = 0$, so $R_N = a$ exactly. A slice through the equator is a perfect circle of radius $a$. Meanwhile $R_M = a(1-e^2) = 6\,335\,439\,\mathrm m$, smaller, because the north-south ellipse curves more tightly there than a circle of radius $a$ would. **At the poles**, the two are equal, both $a^2/b = 6\,399\,594\,\mathrm m$, where $b = a\sqrt{1-e^2}$ is the **semi-minor axis**, the polar radius. Every direction through a pole looks the same, so they must agree.

Everywhere between, $R_M < R_N$, and the gap is not small. At $45^\circ$ latitude $R_M = 6\,367\,382\,\mathrm m$ and $R_N = 6\,388\,838\,\mathrm m$, a difference of $21.5\,\mathrm{km}$. Using one "mean Earth radius" for both — a shortcut in more textbooks than it should be — misstates an aircraft's latitude rate by several parts in ten thousand, which adds up over a long flight.

::: example Two radii at Cape Canaveral
Take $\varphi = 28.5^\circ$, the latitude this module keeps using. The formulas give $R_M = 6\,349\,951\,\mathrm m$ and $R_N = 6\,383\,003\,\mathrm m$, a gap of $33.1\,\mathrm{km}$. Take $h = 0$.

**Going north.** A ground vehicle drives due north at $20\,\mathrm{m/s}$. Its latitude changes at

$$
\dot\varphi = \frac{20}{6\,349\,951} = 3.150\times10^{-6}\,\mathrm{rad/s}.
$$

Multiply by $180/\pi$ for degrees and by $3600$ for per hour: $0.650^\circ/\mathrm h$.

**Going east.** The same vehicle drives due east at $20\,\mathrm{m/s}$. Now divide by $R_N$ and by $\cos28.5^\circ = 0.8788$:

$$
\dot\lambda = \frac{20}{6\,383\,003\times0.8788} = 3.565\times10^{-6}\,\mathrm{rad/s},
$$

which is $0.735^\circ/\mathrm h$.

Sanity check: the same speed moves longitude about $13\%$ faster than latitude. Most of that is the $\cos\varphi$ — a parallel at $28.5^\circ$ is a smaller circle than a meridian — and a little is $R_N$ being larger than $R_M$, which pulls the other way.
:::

## The transport rate

Picture walking north across a huge ball. Your "down" always points toward the ball's center, so as you walk, your down arrow slowly swings. The NED frame is carried along with you and swings the same way. That swinging is the transport rate. It has two parts, and each has a clean geometric source.

**Longitude rate.** Changing longitude is a turn about Earth's polar axis — the same kind of turn as Earth's spin. So it goes into NED axes by exactly the same projection as Earth rate, with $\dot\lambda$ in place of $\omega_{ie}$: $\dot\lambda\,(\cos\varphi,\ 0,\ -\sin\varphi)$.

**Latitude rate.** Changing latitude is different. Moving north over the curve, your forward (north) axis keeps tipping downward, toward the ground ahead, as the surface curves away beneath you. That is a turn about the local **east** axis. By the **[[right-hand rule|right-hand-rule]]**, a positive turn about east would tip north *up*, so tipping north down is a negative turn: $\dot\varphi\,(0,\ -1,\ 0)$.

Add the two parts, then substitute $\dot\varphi = v_N/(R_M+h)$ and $\dot\lambda = v_E/[(R_N+h)\cos\varphi]$. In the north entry, $\dot\lambda\cos\varphi$ becomes $v_E/(R_N+h)$; in the down entry, $\dot\lambda\sin\varphi$ becomes $v_E\tan\varphi/(R_N+h)$, since $\sin\varphi/\cos\varphi = \tan\varphi$:

$$
\boldsymbol\omega_{en}^n = \left(\frac{v_E}{R_N+h},\ -\frac{v_N}{R_M+h},\ -\frac{v_E\tan\varphi}{R_N+h}\right).
$$

Is this exact, or only good for small rates? Differentiating the NED-to-ECEF rotation matrix numerically, for an arbitrary test velocity, and pulling out its rotation rate gives the same three numbers to within the rounding of the numerical derivative. It is exact.

::: example When the transport rate is negligible, and when it is not
Compare everything with Earth rate, $\omega_{ie} = 7.292\times10^{-5}\,\mathrm{rad/s}$, at $45^\circ$ latitude.

**A ship.** Moving north at $5\,\mathrm{m/s}$ (about $10$ **[[knots|knots]]**), only the middle entry is nonzero: $5/6\,367\,382 = 7.85\times10^{-7}\,\mathrm{rad/s}$. That is about $1.1\%$ of Earth rate — safe to ignore for anything but the most precise systems.

**An airliner.** Flying due north at $250\,\mathrm{m/s}$ (about $900\,\mathrm{km/h}$): $250/6\,367\,382 = 3.93\times10^{-5}\,\mathrm{rad/s}$, or $54\%$ of Earth rate. Flying due east at the same speed, two entries are nonzero, each $250/6\,388\,838 = 3.91\times10^{-5}\,\mathrm{rad/s}$ (at $45^\circ$, $\tan\varphi = 1$). Their combined size is $\sqrt2$ times that, $5.53\times10^{-5}\,\mathrm{rad/s}$, or $76\%$ of Earth rate. An airliner's INS that dropped this term would be dropping a correction as large as the one every textbook insists on keeping.

**Orbital speed.** At $7.7\,\mathrm{km/s}$ due north, $|\boldsymbol\omega_{en}|$ reaches $1.21\times10^{-3}\,\mathrm{rad/s}$ — more than sixteen times Earth rate. The transport rate is no longer a correction. It is the main thing the frame is doing.
:::

## Choosing a frame

The choice is an engineering trade, not a rule.

- **ECI** costs nothing in rotation terms, but its answers are Cartesian coordinates in space that nobody on the ground finds readable. It dominates during boost and in orbit, where guidance already thinks in orbits and inertial states, and a ground display converts afterward.
- **ECEF** is the natural common frame for anything checked against GPS, whose solution is ECEF by definition, and for long-range flight to a fixed point on the spinning Earth.
- **NED** pays for a second rotation term and the geodesy above. It earns that back by producing latitude, longitude and height — what a pilot, a ship's navigator or a ground operator wants to read — straight out of the loop. Aircraft and most ground and marine systems mechanize in NED for that reason, and so does this module's strapdown exercise.

NED has two limits, both visible in the transport-rate formula. At high speed the transport rate grows until it dominates, as the orbital example showed. And the down entry holds $\tan\varphi$, which grows without limit near the **[[poles|pole-problem]]**, where "north" stops meaning anything. An orbit that crosses high latitudes runs into both, which is a real reason orbital navigation is done in ECI rather than NED, not merely a matter of taste.

::: warning The transport rate is about speed, not sensor grade
It is tempting to treat $\boldsymbol\omega_{en}$ as a small correction and drop it "for now". But its size scales with the vehicle's speed, not with the quality of the IMU. Whether it is negligible has nothing to do with whether the gyros are tactical or navigation grade, and everything to do with how fast the vehicle moves — the example showed it reaching three quarters of Earth rate for an ordinary airliner. Dropping it is a decision about the vehicle, never a simplification a better gyro makes safe.
:::

## Check yourself

::: check
Why is $R_N = a$ exactly at the equator, while $R_M$ is not?
:::

::: answer
A slice through the equator, square to the polar axis, is a perfect circle of radius $a$ — for an ellipsoid of revolution that is true by construction. The transverse radius at any point is the distance from the point to the polar axis measured along the local vertical, and at the equator that is exactly $a$.

The meridian is an ellipse, not a circle. Its radius of curvature at the equator is the ellipse's own curvature there, $a(1-e^2)$, which is smaller than $a$. The two would agree only if $e = 0$ — a sphere.
:::

::: check
A submarine cruises due east at $10\,\mathrm{m/s}$ at $60^\circ$ latitude, where $R_N = 6\,394\,209\,\mathrm m$. Find $\dot\lambda$, and compare the down and north entries of $\boldsymbol\omega_{en}^n$.
:::

::: answer
Take $h = 0$ and $\cos60^\circ = 0.5$:

$$
\dot\lambda = \frac{v_E}{R_N\cos\varphi} = \frac{10}{6\,394\,209\times0.5} = 3.128\times10^{-6}\,\mathrm{rad/s}.
$$

North entry: $v_E/R_N = \dot\lambda\cos60^\circ = 1.564\times10^{-6}\,\mathrm{rad/s}$.

Down entry: $-v_E\tan\varphi/R_N = -\dot\lambda\sin60^\circ = -2.709\times10^{-6}\,\mathrm{rad/s}$.

The down entry is larger, by the factor $\tan60^\circ = 1.73$. The north entry barely changes with latitude (only through the slow change in $R_N$), while the down entry grows as $\tan\varphi$ toward the pole and vanishes at the equator.
:::

::: check
Explain, without any arithmetic, why an ECI mechanization needs no equivalent of $\boldsymbol\omega_{en}$ at all — not even a small one.
:::

::: answer
The transport rate exists because NED's axes are defined by the vehicle's position on a curved, spinning Earth, so the frame turns whenever the vehicle moves, whatever the vehicle's attitude is doing.

ECI's axes are fixed directions in space by definition. They do not depend on where the vehicle is, so the vehicle's motion cannot make them turn. The transport theorem's $\boldsymbol\omega\times\mathbf x$ term is exactly zero for ECI, because the rate of the inertial frame relative to itself, $\boldsymbol\omega_{ii}$, is zero — not because the term has been made small.
:::

::: check
An engineer proposes mechanizing a hypersonic glide vehicle, with a top speed near $6\,\mathrm{km/s}$, in NED for its whole flight, "to match the ground display". What number from this lesson would you show them, and what would you recommend?
:::

::: answer
Scale the orbital result. At $6\,\mathrm{km/s}$ due north the transport rate is about $9.4\times10^{-4}\,\mathrm{rad/s}$, roughly thirteen times Earth rate. The frame's own turning would be the largest rate in the whole attitude update, and on a trajectory that passes at high latitude the $\tan\varphi$ term would grow without limit.

Better: mechanize in ECI or ECEF, where the rotation term is zero or bounded by Earth rate, and convert to latitude, longitude and height only for the display. That conversion is applied to the output; it never has to be carried through the integration.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\dot{\mathbf v}^i=\mathbf f^i+\mathbf g_{grav}^i$ | ECI velocity equation: no rotation term |
| $\dot{\mathbf v}^e=\mathbf f^e-2\boldsymbol\omega_{ie}\times\mathbf v^e+\mathbf g^e$ | ECEF velocity equation: Earth-rate Coriolis only |
| $\dot{\mathbf v}^n=\mathbf f^n-(2\boldsymbol\omega_{ie}^n+\boldsymbol\omega_{en}^n)\times\mathbf v^n+\mathbf g^n$ | NED velocity equation: Earth rate plus transport rate |
| $R_M=\dfrac{a(1-e^2)}{(1-e^2\sin^2\varphi)^{3/2}}$ | Meridian radius of curvature; governs north-south motion |
| $R_N=\dfrac{a}{\sqrt{1-e^2\sin^2\varphi}}$ | Transverse radius of curvature; governs east-west motion; $R_N=a$ at the equator |
| $\boldsymbol\omega_{en}^n=\left(\dfrac{v_E}{R_N+h},\,-\dfrac{v_N}{R_M+h},\,-\dfrac{v_E\tan\varphi}{R_N+h}\right)$ | Transport rate: NED's own turning from moving over a curved Earth |
| ECI / ECEF / NED | Simplest dynamics / ground-referenced / human-readable, in order of rising rotation-term cost |

The next lesson takes the NED velocity equation and turns it into an actual update — how attitude, velocity and position step forward from one IMU sample to the next — and supplies the gravity model this lesson left as the symbol $\mathbf g$.

::: context eci-j2000 Fixed to the stars, dated to the year 2000
"Inertial" axes still need to point *somewhere*. The standard choice, called **J2000**, points the $z$ axis along Earth's spin axis and the $x$ axis toward the vernal equinox — the direction from Earth to the Sun on the first day of spring — both as they were at noon on 1 January 2000. The date matters because Earth's axis slowly wobbles, tracing a circle among the stars about once every $26\,000$ years, so "the direction of the pole" drifts. Freezing the axes at one moment makes them truly fixed. Its modern successor, the **GCRF**, is tied to distant quasars and matches J2000 to within a few hundredths of an arcsecond.
:::

::: context coriolis The sideways push of a spinning floor
Gaspard-Gustave de Coriolis, a French engineer, worked out this term in 1835 while studying machines with spinning parts. It is why hurricanes spin: air rushing toward a low-pressure center is deflected sideways by Earth's rotation, to the right in the northern hemisphere, so the storm winds counterclockwise. It is why long-range artillery tables include an Earth-rotation correction. For a navigator it is small but not negligible: a car at $30\,\mathrm{m/s}$ at mid-latitude feels a Coriolis acceleration of about $3\times10^{-3}\,\mathrm{m/s^2}$ — around $300$ micro-$g$, larger than a navigation-grade accelerometer's bias.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="95" r="65" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="270" cy="95" r="65" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M60,28 A70,70 0 0 0 30,65" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="28,72 25,61 35,64" fill="#1f2a44"/>
  <path d="M240,28 A70,70 0 0 0 210,65" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="208,72 205,61 215,64" fill="#1f2a44"/>
  <line x1="90" y1="95" x2="140" y2="95" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="150,95 139,90 139,100" fill="#b4232c"/>
  <path d="M270,95 Q305,98 318,128" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="321,137 313,128 323,125" fill="#b4232c"/>
  <circle cx="90" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="270" cy="95" r="4" fill="#1f2a44"/>
  <text x="90" y="180" font-size="12" fill="#1f2a44" text-anchor="middle">seen from the ground</text>
  <text x="270" y="180" font-size="12" fill="#1f2a44" text-anchor="middle">seen riding along</text>
</svg>
```

The ride turns counterclockwise. A ball rolled straight out from the center goes straight for someone on the ground, but bends to its right for someone turning with the ride.
:::

::: context transport-picture Down swings as you travel
Walk over a curved surface and your "down" arrow keeps pointing at the center, so it swings as you go. NED swings with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 212" font-family="Inter, Arial, sans-serif">
  <path d="M40,190 A160,160 0 0 1 320,190 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="2.5" fill="#b4232c">
    <line x1="112" y1="122" x2="126" y2="152"/><polygon points="130,161 122,155 131,150"/>
    <line x1="248" y1="122" x2="234" y2="152"/><polygon points="230,161 229,150 238,155"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="2.5" fill="#1d6fd1">
    <line x1="112" y1="122" x2="142" y2="109"/><polygon points="150,105 144,113 140,104"/>
    <line x1="248" y1="122" x2="278" y2="136"/><polygon points="286,140 275,141 280,132"/>
  </g>
  <circle cx="112" cy="122" r="5" fill="#1f2a44"/>
  <circle cx="248" cy="122" r="5" fill="#1f2a44"/>
  <text x="104" y="112" font-size="12" fill="#1f2a44" text-anchor="end">start</text>
  <text x="256" y="112" font-size="12" fill="#1f2a44">later</text>
  <text x="150" y="96" font-size="12" fill="#1d6fd1">north</text>
  <text x="142" y="176" font-size="12" fill="#b4232c">down</text>
  <text x="180" y="206" font-size="12" fill="#1f2a44" text-anchor="middle">Earth (curvature exaggerated)</text>
</svg>
```

The traveler has moved north over the curve. At the new spot, both the north (blue) and down (red) arrows have turned by the same angle, in the same sense. The rate of that turning is $v_N/(R_M+h)$.
:::

::: context why-twice Two Earth rates, one transport rate
Here, $\mathbf v^n$ is velocity *relative to the Earth*, written in NED axes. To reach Newton's law you differentiate twice, and Earth's spin gets in each time. First, getting from position to Earth-relative velocity costs one $\boldsymbol\omega_{ie}\times\mathbf r$. Differentiating again brings in the spin a second time, once through the velocity and once through that first term; the part of the result that involves velocity is $2\boldsymbol\omega_{ie}\times\mathbf v$, and what is left, $\boldsymbol\omega_{ie}\times(\boldsymbol\omega_{ie}\times\mathbf r)$, is the centrifugal term that hides inside $\mathbf g$. The transport rate never enters the definition of the velocity. It only describes how the axes you *write* $\mathbf v$ in are turning relative to the Earth, so it appears once, in the last differentiation.
:::

::: context ellipsoid A squashed Earth
Earth spins, and the spin flings the equator outward a little. The result is an ellipsoid whose equatorial radius is about $21.4\,\mathrm{km}$ longer than its polar radius: $a = 6\,378\,137\,\mathrm m$ against $b = 6\,356\,752\,\mathrm m$. That difference is only one part in $298$ — draw Earth as a circle $30\,\mathrm{cm}$ across and the squashing is about a millimeter, thinner than the pencil line. But navigation cares about meters, and $21\,\mathrm{km}$ is a lot of meters. **WGS84** (World Geodetic System 1984) is the version maintained by the US military for GPS, and nearly every navigation system on Earth uses it.
:::

::: context geodetic-latitude Which way is down?
On an ellipsoid, the local vertical — the line straight down, square to the ground — does not point at Earth's center. **Geodetic latitude** is the angle that vertical makes with the equator's plane. It is what maps and GPS report.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="170" cy="110" rx="140" ry="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <circle cx="170" cy="110" r="3" fill="#1f2a44"/>
  <line x1="277" y1="52" x2="170" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="308" y1="12" x2="233" y2="110" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="277" cy="52" r="5" fill="#1f2a44"/>
  <text x="287" y="58" font-size="12" fill="#1f2a44">you</text>
  <text x="246" y="104" font-size="12" fill="#b4232c">φ</text>
  <text x="178" y="126" font-size="11" fill="#6c7a93">center</text>
  <text x="300" y="16" font-size="11" fill="#b4232c" text-anchor="end">local vertical</text>
</svg>
```

The red local vertical crosses the equator's plane off-center, at an angle $\varphi$ steeper than the gray line to the center (squashing exaggerated here). On the real Earth the two latitudes differ by at most about $0.19^\circ$, near $45^\circ$ — some $21\,\mathrm{km}$ on the ground.
:::

::: context right-hand-rule Which way is a positive turn?
Point your right thumb along an axis. Your fingers curl in the direction of a positive turn about that axis. Try it with NED: point your thumb east, with north ahead of you and down toward the floor. Your fingers curl from north toward up — so a positive turn about east would tip the nose up. Moving north over a curved Earth tips "north" down instead, which is why the latitude part of the transport rate carries a minus sign.
:::

::: context knots A sailor's unit
A **knot** is one nautical mile per hour, and a nautical mile is exactly $1852\,\mathrm m$ — chosen because it is very nearly one arcminute of latitude. So a ship at $10$ knots moves $18.5\,\mathrm{km}$ an hour, or about $5.1\,\mathrm{m/s}$, and changes its latitude by about ten arcminutes per hour if it heads due north. Aviation still uses knots and nautical miles for the same reason: they tie distance straight to latitude.
:::

::: context pole-problem Where north stops working
At a pole every direction is south, so NED's north and east axes have no meaning, and $\tan\varphi$ in the transport rate — along with $1/\cos\varphi$ in the longitude rate — grows without limit. Real systems that must cross the poles, like transpolar airliners and polar-orbiting spacecraft, avoid this. Aircraft use a **wander-azimuth** frame: level like NED, but its horizontal axes are allowed to drift away from north, so they never need to spin wildly near the pole. Spacecraft simply stay in ECI.
:::
