---
id: l11-patched-conics-launch-windows
title: Patched conics and interplanetary trajectory design
minutes: 24
covers:
  - patched conics, sphere of influence, C3, gravity assists
  - porkchop plots and launch windows
---

Every maneuver in this module so far has stayed within a single central body's gravity. A mission that leaves Earth for Mars, or swings past Jupiter on its way to the outer solar system, moves through at least two, sometimes three, dominant gravitational regimes: Earth's, the Sun's, and a target or flyby planet's. Integrating the true many-body equations of motion from launch to arrival is possible but overkill for mission design — the patched-conic method instead treats the trajectory as a sequence of ordinary two-body arcs, each governed by whichever body dominates locally, stitched together at the boundaries. This lesson builds that method, the sphere of influence that defines its boundaries, the C3 metric that separates the two-body problem of departure from the one of arrival, the gravity assist that patches through a third body deliberately, and the launch-window bookkeeping that turns all of it into a real mission calendar.

## The sphere of influence

Near a planet, a spacecraft's motion can be described two ways: as an orbit around the planet, perturbed by the Sun's gravity, or as an orbit around the Sun, perturbed by the planet's gravity. Each description is most accurate close to its own primary and progressively worse further away. The sphere of influence is the (approximate) boundary where the two descriptions are equally good, and patched-conic mission design switches from one description to the other there.

Compare the *ratio* of the perturbing acceleration to the main one in each frame. Planet-centred, with the spacecraft at distance $r$ from a planet of mass $m$, itself at distance $D$ from the Sun (mass $M$): the planet's own pull is $\sim Gm/r^2$, and the Sun's perturbing effect on the planet-relative motion is a *tidal* term — the difference between the Sun's pull on the spacecraft and on the planet — which scales as $\sim GMr/D^3$ for $r \ll D$. The ratio is
$$
\text{(planet-frame perturbation ratio)} \sim \frac{GMr/D^3}{Gm/r^2} = \frac{M r^3}{m D^3}.
$$
Sun-centred, the planet's pull on the spacecraft, $\sim Gm/r^2$, is not a tidal term here — it is simply small compared with the Sun's direct pull $\sim GM/D^2$ whenever the spacecraft is close to the planet — giving
$$
\text{(Sun-frame perturbation ratio)} \sim \frac{Gm/r^2}{GM/D^2} = \frac{mD^2}{Mr^2}.
$$
The sphere of influence is where these ratios are equal:
$$
\frac{Mr^3}{mD^3} = \frac{mD^2}{Mr^2} \quad\Longrightarrow\quad M^2r^5 = m^2D^5 \quad\Longrightarrow\quad r_{\text{SOI}} = D\left(\frac{m}{M}\right)^{2/5}.
$$

::: key Sphere of influence
$$
r_{\text{SOI}} = D\left(\frac{m}{M}\right)^{2/5},
$$
where $D$ is the planet's distance from the Sun, $m$ the planet's mass, $M$ the Sun's mass. Inside it, treat the planet as the primary and the Sun as a perturbation; outside, the reverse. Because the tidal term's exact geometric factor depends on direction (roughly twice as strong toward or away from the Sun as perpendicular to it), this boundary is only approximately spherical — a genuine sphere is the idealisation, not the physical reality.
:::

::: example Earth's sphere of influence
$D = 1\,\mathrm{AU} = 1.495\,978\,707\times10^{8}\,\mathrm{km}$, $\mu_{\text{Earth}}=398\,600.4418\,\mathrm{km^3/s^2}$, $\mu_{\text{Sun}}=1.327\,124\times10^{11}\,\mathrm{km^3/s^2}$ (masses enter only as the ratio $\mu_{\text{Earth}}/\mu_{\text{Sun}}$, since $G$ cancels):
$$
r_{\text{SOI}} = 1.495\,978\,707\times10^{8}\left(\frac{398\,600.4418}{1.327\,124\times10^{11}}\right)^{2/5} = 924\,600\,\mathrm{km},
$$
about 145 Earth radii — small next to the $1.5\times10^8\,\mathrm{km}$ Earth-Sun distance, which is exactly why the "coast almost entirely under the Sun's gravity, with brief planet-dominated legs at each end" picture works as well as it does.
:::

## C3: the currency of departure

Once a trajectory leaves the sphere of influence on a hyperbolic escape, its speed relative to the departure planet approaches a constant, the hyperbolic excess speed $v_\infty$ — introduced already in the last module's orbit-families lesson, where $\varepsilon = v_\infty^2/2 = -\mu/(2a)$ for the escaping hyperbola. Mission designers square it and call the result the *characteristic energy*,
$$
C_3 = v_\infty^2 = -\frac{\mu}{a},
$$
because it is what a launch vehicle's performance curve is quoted against: how much hyperbolic-excess energy, not how much $\Delta v$, a given payload mass can be thrown with, independent of which direction $v_\infty$ points or how far away the destination is. $C_3=0$ is exactly escape at zero excess speed; a negative $a$ (bound orbit) is not on this curve at all.

::: example C3 for two departure speeds
$v_\infty=2.0\,\mathrm{km/s}$: $C_3 = 4.0\,\mathrm{km^2/s^2}$, and the corresponding hyperbola has $a=-\mu/C_3 = -398\,600.4418/4.0 = -99\,650.1\,\mathrm{km}$. $v_\infty=3.0\,\mathrm{km/s}$: $C_3=9.0\,\mathrm{km^2/s^2}$, $a=-44\,288.9\,\mathrm{km}$. Both are realistic figures for an Earth-departure toward Mars; a porkchop plot, met later in this lesson, is nothing more than $C_3$ contoured over many departure and arrival date pairs.
:::

## Gravity assists

Inside a flyby planet's sphere of influence, the encounter is an ordinary hyperbolic two-body pass, exactly as the orbit-families lesson worked out: arriving with excess speed $v_\infty$ and periapsis $r_p$, the eccentricity is $e = 1+r_pv_\infty^2/\mu$ and the trajectory bends through a turning angle
$$
\sin\frac{\delta}{2} = \frac{1}{e} = \frac{1}{1+r_pv_\infty^2/\mu}.
$$
Since the flyby is unpowered, energy in the *planet-centred* frame is conserved — $v_\infty$ leaves with exactly the magnitude it arrived with, only rotated by $\delta$. That rotation is the entire content of a gravity assist, and by itself it looks like it changes nothing about the spacecraft's speed. The payoff appears only when you switch back to the Sun-centred frame: the spacecraft's heliocentric velocity is $\mathbf{v}_{\text{helio}} = \mathbf{V}_{\text{planet}} + \mathbf{v}_\infty$, a vector sum of the planet's own heliocentric velocity and the (rotated) excess velocity. Because $\mathbf{V}_{\text{planet}}$ is unchanged by the flyby but $\mathbf{v}_\infty$'s *direction* is not, $|\mathbf{v}_{\text{helio}}|$ before and after the encounter are generally different — a free change in heliocentric speed, paid for entirely by the planet's own orbital momentum rather than the spacecraft's propellant.

::: example A Jupiter flyby that raises heliocentric speed
Jupiter's heliocentric circular speed is about $v_J=\sqrt{\mu_\odot/(5.2\,\mathrm{AU})}=13.06\,\mathrm{km/s}$. A spacecraft arrives with $v_\infty=8.0\,\mathrm{km/s}$, perpendicular to Jupiter's velocity, and passes at $r_p=71\,992\,\mathrm{km}$ (500 km above the cloud tops), $\mu_{\text{Jupiter}}=1.266\,865\times10^{8}\,\mathrm{km^3/s^2}$: $e=1.0364$, turning angle $\delta = 2\sin^{-1}(1/1.0364)=149.55^\circ$ — an enormous deflection, only possible because $e$ is barely above 1 (a slow approach relative to Jupiter's deep well). Choosing the flyby geometry so the turn rotates $\mathbf{v}_\infty$ toward alignment with $\mathbf{V}_J$: incoming heliocentric velocity $\mathbf{V}_J+\mathbf{v}_\infty = (13.06,8.0)\,\mathrm{km/s}$, magnitude $15.32\,\mathrm{km/s}$; outgoing, with $\mathbf{v}_\infty$ rotated $149.55^\circ$ toward the $+x$ direction, gives $(17.12,-6.90)\,\mathrm{km/s}$, magnitude $18.45\,\mathrm{km/s}$ — a heliocentric speed gain of $3.14\,\mathrm{km/s}$, entirely free. This is how missions to the outer solar system, and interstellar probes such as Voyager, reach speeds far beyond what their launch vehicles alone provided.
:::

::: warning A gravity assist can just as easily slow a spacecraft down
Nothing in the geometry above requires the turn to help. Aim the flyby so $\mathbf{v}_\infty$ rotates *away* from alignment with $\mathbf{V}_{\text{planet}}$, and heliocentric speed falls instead — exactly what missions targeting the inner solar system (a Venus flyby to shed heliocentric energy on the way to Mercury, for instance) deliberately arrange.
:::

## Launch windows and the porkchop plot

Earth and Mars are almost never in the geometric relationship a low-$C_3$ transfer needs; a launch window is the calendar of dates when they are, or close to it. Because both planets move continuously, the favourable geometry recurs periodically, at the *synodic period* — the time for the faster planet to lap the slower one by exactly $360^\circ$. With sidereal periods $T_1<T_2$, the angular rates are $n_1=2\pi/T_1$, $n_2=2\pi/T_2$, and the relative angle grows at $n_1-n_2$, so the geometry repeats after
$$
T_{\text{syn}} = \frac{1}{\dfrac{1}{T_1}-\dfrac{1}{T_2}}.
$$

::: example The Earth-Mars synodic period
$T_{\text{Earth}}=365.256\,\mathrm{days}$, $T_{\text{Mars}}=686.980\,\mathrm{days}$:
$$
T_{\text{syn}} = \frac{1}{1/365.256 - 1/686.980} = 779.9\,\mathrm{days} \approx 2.14\,\mathrm{years}.
$$
This is why Earth-to-Mars launch opportunities cluster roughly every 26 months rather than being available continuously — missing a window does not mean waiting a Mars year, it means waiting the synodic period, which is longer than either planet's own year.
:::

A porkchop plot is what a mission designer actually reads to pick a specific date inside that roughly-26-month cadence: a contour plot with launch date along one axis and arrival date (or time of flight) along the other, coloured or contoured by $C_3$ at departure, or by arrival $v_\infty$, computed by solving for the transfer trajectory — Lambert's problem, the subject of this track's next module — at every point on the grid. The result typically shows two lobes of low-$C_3$ "sweet spots" separated by a ridge, and the whole pattern shifts and repeats with the synodic period found above. This module gives you every piece needed to understand what the plot means and why its features fall where they do; building one from a Lambert solver is the next module's task.

::: warning Patched conics is a design tool, not the final answer
Treating the trajectory as a sequence of exact two-body arcs, discontinuously handed off at a spherical boundary, ignores the perturbations the sphere-of-influence derivation already flagged as approximate, and ignores the fact that the two-body arcs on either side do not perfectly agree at the boundary in a full numerical integration. It is accurate enough for mission design, launch-vehicle sizing, and picking a launch window; a real trajectory is later verified and refined with a full numerical propagation.
:::

## Check yourself

::: check
Explain, in your own words, why the sphere-of-influence boundary is defined by comparing *ratios* of accelerations rather than the accelerations themselves.
:::

::: answer
The raw accelerations from the Sun and from the planet are wildly different in size everywhere near the planet — the planet's direct pull always dominates at short range. What actually matters for choosing which two-body description to trust is how large the *perturbation* is relative to the *main* force in that description, since a two-body approximation is good exactly when its perturbation is small compared with its own central term. Comparing the two ratios, rather than the two raw accelerations, finds the point where each description is equally (im)precise, which is the sensible place to switch between them.
:::

::: check
Mars has $\mu_{\text{Mars}}=42\,828\,\mathrm{km^3/s^2}$ and orbits at $D=1.524\,\mathrm{AU}$. Estimate its sphere of influence radius.
:::

::: answer
$r_{\text{SOI}} = D(\mu_{\text{Mars}}/\mu_\odot)^{2/5} = 1.524\times1.495\,978\,707\times10^{8}\times(42\,828/1.327\,124\times10^{11})^{2/5}$. The ratio $42\,828/1.327\,124\times10^{11}=3.227\times10^{-7}$, raised to the $2/5$ power is $(3.227\times10^{-7})^{0.4}\approx2.532\times10^{-3}$. So $r_{\text{SOI}}\approx(1.524\times1.495\,978\,707\times10^8)\times2.532\times10^{-3}\approx577\,300\,\mathrm{km}$ — *smaller* than Earth's $924\,600\,\mathrm{km}$, even though Mars orbits farther from the Sun. Distance enters only linearly, but the mass ratio enters to the $2/5$ power, and Mars's $\mu$ is about a ninth of Earth's; the mass deficit outweighs the $1.524\times$ larger distance.
:::

::: check
Two spacecraft depart Earth with $v_\infty=4.0\,\mathrm{km/s}$ and $v_\infty=5.0\,\mathrm{km/s}$ respectively. Compute both $C_3$ values and explain which mission needed more from its launch vehicle.
:::

::: answer
$C_3=v_\infty^2$: $16.0\,\mathrm{km^2/s^2}$ and $25.0\,\mathrm{km^2/s^2}$. The second mission needed more launch performance — $C_3$ is exactly the metric launch-vehicle payload-versus-energy curves are plotted against, and a higher required $C_3$ means a lower payload mass for the same rocket, or a larger rocket for the same payload.
:::

::: check
Why does the direction of a gravity-assist turn matter for whether heliocentric speed increases or decreases, when the magnitude of $\mathbf{v}_\infty$ is unchanged by the flyby either way?
:::

::: answer
Heliocentric speed is the magnitude of $\mathbf{V}_{\text{planet}}+\mathbf{v}_\infty$, a vector sum, not simply $V_{\text{planet}}+v_\infty$. Rotating $\mathbf{v}_\infty$ so that it points more nearly parallel to $\mathbf{V}_{\text{planet}}$ increases the magnitude of the sum (the two vectors add more constructively); rotating it the other way, toward anti-parallel, decreases it. Since $|\mathbf{v}_\infty|$ itself never changes, the entire effect on heliocentric speed comes from which way the fixed-length vector ends up pointing after the turn — controlled by the flyby's aim point (which sets $r_p$, hence $\delta$) and which side of the planet the spacecraft passes.
:::

::: check
A mission misses its Earth-Mars launch window. Explain, using the synodic period, roughly how long until the next comparable opportunity, and why the answer is not simply "one Mars year."
:::

::: answer
About $780$ days ($\approx2.14$ years), the Earth-Mars synodic period, not the Martian year of $687$ days. The launch window depends on the *relative* geometry between Earth and Mars as seen from the Sun repeating, not on Mars alone completing an orbit — Earth is also moving throughout, and the two periods have to combine (via $1/T_{\text{syn}}=1/T_{\text{Earth}}-1/T_{\text{Mars}}$) before the same relative configuration recurs, which takes longer than either planet's individual period.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r_{\text{SOI}}=D(m/M)^{2/5}$ | Sphere of influence; boundary for switching two-body primaries |
| Earth $r_{\text{SOI}}$ | $\approx924\,600\,\mathrm{km}$ ($\approx145\,R_\oplus$) |
| $C_3=v_\infty^2=-\mu/a$ | Characteristic energy; the launch-performance currency for a hyperbolic departure |
| $e=1+r_pv_\infty^2/\mu$, $\sin(\delta/2)=1/e$ | Hyperbolic flyby eccentricity and turning angle (from the orbit-families lesson) |
| $\mathbf{v}_{\text{helio}}=\mathbf{V}_{\text{planet}}+\mathbf{v}_\infty$ | Gravity assist changes heliocentric speed by rotating $\mathbf{v}_\infty$, not its magnitude |
| Jupiter flyby example | 149.6° turn, 8.0 km/s $v_\infty$, gains 3.14 km/s of heliocentric speed |
| $T_{\text{syn}}=1/(1/T_1-1/T_2)$ | Synodic period; sets how often a launch window's geometry recurs |
| Earth-Mars $T_{\text{syn}}$ | 780 days ($\approx$26 months) |

This lesson closes the module's tour of maneuver types. Every one of them — Hohmann and bi-elliptic transfers, plane changes and apsidal rotation, phasing, finite and low-thrust burns, station-keeping, and now patched-conic departures and gravity assists — reduces to the same handful of ideas first built in lesson 1: a Δv is a vector, tangential burns are cheap and rotations are not, and every trade in this subject exchanges propellant for time in one direction or the other. The next module puts real perturbations back into the two-body picture this whole module assumed.
