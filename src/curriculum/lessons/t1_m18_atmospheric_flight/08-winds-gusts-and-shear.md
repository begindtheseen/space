---
id: l08-winds-gusts-and-shear
title: Wind profiles, gusts and wind shear
minutes: 24
covers:
  - wind profiles and gust models (Dryden, von Karman), wind shear
---

Ride a bike on a windy day. Three different things happen. There is the steady breeze, which you lean into and forget about. There is the moment you pass the corner of a building and the wind suddenly changes — a sharp step from calm to blowing. And there are the gusts: random little shoves, never the same twice, that keep your handlebars busy.

A rocket climbing through the atmosphere meets the same three things, only much faster and much harder. The last three lessons boiled all of it down to one input: the wind-caused angle of attack $\alpha_w$ ("alpha sub w"). On a real launch day that input is a whole **wind profile** — wind speed and direction at every height from the pad to 30 km. It is measured by a balloon a couple of hours before lift-off, it keeps changing while the countdown runs, and it hides sudden changes and gusts that no measurement can see. The strongest winds, in the **[[jet stream|jet-stream]]**, sit at 10 to 14 km — exactly where dynamic pressure peaks. The air delivers its biggest push at the moment the rocket can least afford it.

A GNC engineer needs the wind in three forms, matching the bike ride:

- the **mean profile** — the steady breeze: how the average wind varies with height, both statistically and on the day. It is used to design the trajectory and the day-of-launch steering;
- **discrete features** — the building corner: wind shear across a layer, and idealized gust shapes that test the control loop the same way every time. They are used for load and control analysis;
- **continuous turbulence** — the random shoves: the Dryden and von Kármán models, which describe gustiness statistically and can be made by filtering random noise. They are used in Monte Carlo simulation.

This lesson covers all three, and ties each to the angle of attack it makes at climbing speeds.

## The mean wind profile

Wind usually gets stronger with height through the lowest layer of the atmosphere, the **troposphere**. It peaks near the **tropopause** — the top of that layer, about 11 km up — where the jet stream lives, and then weakens in the stratosphere above. At launch sites in the middle latitudes the jet core sits between about 10 and 14 km.

Its speed changes a lot with the season. At Cape Canaveral in winter, the monthly average wind at jet height is about 30 to 40 m/s. The **[[95th-percentile|percentile]]** envelopes used for design reach 60 to 75 m/s, and some days go past 90 m/s. Summer winds at the same height are typically half as strong. The jet mostly blows from the west. So the launch direction and the season together decide whether the strongest wind hits the rocket from the front, from behind, or from the side.

### Describing the wind with statistics

For design, one day's wind is not enough; you need all the winds the rocket might meet. Range reference atmospheres list, for each height and month, the average wind vector and how much it varies. The wind components at one height are treated as following a bell curve, linked to the winds at nearby heights.

From these tables engineers build **synthetic design profiles**. Each is a smooth envelope at some probability level (95 % or 99 %), with a shear build-up beneath the peak and a gust added on top. They are combined so that the resulting load has a known chance of being exceeded. The alternative is to fly the simulated rocket through hundreds of measured historical profiles — a **Monte Carlo** run — and read off how the loads spread. Modern programs do both.

### What the day-of-launch update removes

The mean profile is what the day-of-launch steering update (lesson 7's wind biasing) removes. **[[Weather balloons|balloons]]** or a radar wind profiler measure the profile. The pitch and yaw programs are recomputed so the rocket flies with its nose into the measured wind at every height. The angle of attack left over comes from three places only: what changed between measurement and launch, shear and gusts finer than the measurement can resolve, and the controller's own dynamics.

::: example What an unbiased jet-stream wind would do
Suppose the steering were *not* updated. The rocket flies its planned gravity turn straight through a 75 m/s crosswind at 12 km, where its airspeed is 420 m/s and $\bar{q} = 27.4\ \mathrm{kPa}$.

**Angle of attack.** The crosswind and the airspeed make a right triangle, so

$$
\alpha = \arctan\frac{75}{420} = 10.1^\circ .
$$

**Load.** Multiply by the dynamic pressure:

$$
\bar{q}\alpha = 27.4 \times 10.1 = 277\ \mathrm{kPa\cdot deg}.
$$

That is roughly three times a typical envelope of about $100\ \mathrm{kPa\cdot deg}$.

**A milder case.** Even a moderate 40 m/s wind, met earlier in the climb at 300 m/s airspeed (and lower $\bar{q}$), gives $\arctan(40/300) = 7.6^\circ$.

**Sanity check.** $75/420$ is about $0.18$, and a small angle in radians is about equal to its tangent: $0.18 \times 57.3 \approx 10^\circ$. Wind biasing is not a refinement. Without it, most winter days would be unflyable.
:::

## Wind shear

**Wind shear** is how fast the wind changes as you go up. It is written $\partial \mathbf{w}/\partial h$, read "partial w by partial h": the change in wind velocity $\mathbf{w}$ per metre of height $h$. (The curly $\partial$ just means "change with height, holding everything else fixed".)

A rocket does not sit at one height, so it does not feel the shear as a pattern in space. It climbs at vertical speed $\dot h$ ("h dot"), so it feels the shear as a change *in time*:

$$
\dot{\mathbf{w}} = \frac{\partial\mathbf{w}}{\partial h}\,\dot h .
$$

The change in wind it feels each second is the change per metre times the metres climbed each second. That turns straight into a ramp in angle of attack.

Design shears are usually stated as the change in wind speed across a layer of a stated thickness. The strongest shears sit just below the jet core, where the wind builds up over a kilometre or two. A change of 20 to 30 m/s across 1 km is within the design envelope at the Cape. The max-Q exercise's 30 m/s per kilometre is a severe case.

What makes shear dangerous is speed. At 70 s into the lesson 2 trajectory, the rocket's speed is 418 m/s along a path tilted $54^\circ$ above the horizon. Its vertical speed is

$$
\dot h = 418 \sin 54^\circ = 338\ \mathrm{m/s},
$$

so it crosses a 1 km layer in $1000/338 = 3.0\ \mathrm{s}$. A 30 m/s change in the sideways wind, at 420 m/s airspeed, changes the angle of attack by

$$
\Delta\alpha = \arctan\frac{30}{420} = 4.1^\circ .
$$

It arrives as a ramp of about $4.1/3.0 \approx 1.4^\circ$ per second. That is about as fast as an attitude loop with a 0.36 Hz crossover responds, so the loop is still reacting when the ramp ends. At $\bar{q} = 27.4\ \mathrm{kPa}$ the load indicator jumps by $27.4 \times 4.1 = 112\ \mathrm{kPa\cdot deg}$ before load relief can take any of it back. This is the spike the max-Q exercise asks you to inject and then relieve.

::: key
Wind shear $\partial w/\partial h$ becomes an angle-of-attack ramp $\dot\alpha \approx (\partial w_\perp/\partial h)\,\dot h / V$ on a climbing vehicle; 30 m/s over 1 km at 420 m/s airspeed is $4.1^\circ$ in about 3 s. Because the traverse time is comparable to the attitude loop's response time, the airframe sees most of the shear before load relief acts.
:::

(In the key, $w_\perp$ — "w perp" — is the part of the wind at right angles to the flight path, the only part that makes angle of attack, and $V$ is the airspeed.)

::: warning
A shear number means nothing without its layer thickness. "30 m/s of shear" over 1 km is a gradient of $30/1000 = 0.03$ per second. Over 100 m it would be ten times steeper, and physically closer to a gust. Design documents give shear as a speed change over a stated thickness, and the gradients are usually larger over thinner layers.
:::

## Discrete gusts

A **discrete gust** is a made-up, perfectly repeatable wind bump. Engineers use it to test a control loop the same way every time, like a standard crash test for cars.

The standard shape is the **[[1-cosine gust|one-cosine]]**, a smooth hill that rises from zero to a peak $w_m$ and falls back to zero over a distance $2d_m$:

$$
w_g(s) = \frac{w_m}{2}\left[1 - \cos\left(\frac{\pi s}{d_m}\right)\right], \qquad 0 \le s \le 2 d_m .
$$

Here $s$ is the distance travelled into the gust and $d_m$ is the gust **half-width**. Check the ends. At $s = 0$ the cosine is $1$, so the bracket is $0$: no wind. At $s = d_m$ the cosine is $\cos\pi = -1$, so the bracket is $2$ and the wind is the full peak $w_m$. At $s = 2d_m$ the cosine is back to $1$ and the wind is zero again.

Launch-vehicle design adds gusts of roughly 9 m/s on top of the synthetic profile at the jet peak, with half-widths from tens to a few hundred metres. It also uses "embedded" gusts built into measured profiles. For a 9 m/s gust at 420 m/s the peak angle of attack is only $9/420 = 0.021\ \mathrm{rad} = 1.2^\circ$. The point is not the size. It is how suddenly it arrives.

::: example A 1-cosine gust crossed at climbing speed
Take $w_m = 9\ \mathrm{m/s}$ and $d_m = 150\ \mathrm{m}$, so the gust is 300 m long.

**The shape.** Put a few distances into the formula. The first factor is $w_m/2 = 4.5\ \mathrm{m/s}$.

- $s = 37.5$ m: $\cos(\pi/4) = 0.707$, so $4.5 \times (1 - 0.707) = 1.32\ \mathrm{m/s}$.
- $s = 75$ m: $\cos(\pi/2) = 0$, so $4.5 \times 1 = 4.50\ \mathrm{m/s}$.
- $s = 150$ m: $\cos\pi = -1$, so $4.5 \times 2 = 9.00\ \mathrm{m/s}$, the peak.
- $s = 225$ m: $4.50\ \mathrm{m/s}$ again, and $s = 300$ m: $0$.

**How long it lasts.** At a climb rate of 338 m/s the whole gust passes in $300/338 = 0.89\ \mathrm{s}$. The angle of attack goes from zero to $1.2^\circ$ and back inside a second.

**What the loop can do.** A 0.36 Hz attitude loop needs a second or two to respond, so it cannot follow. The airframe takes the full $1.2^\circ$ as a brief load, about $27.4 \times 1.23 = 34\ \mathrm{kPa\cdot deg}$, essentially unrelieved. The loop's job is to calm the attitude wobble the gust leaves behind. That is why gust loads are added to the shear and mean-wind loads in the structural budget.

**Sanity check.** The shape is symmetric — the same wind a quarter of the way in as three quarters of the way in — as the cosine promises.
:::

## Continuous turbulence: Dryden and von Kármán

Real gustiness is random. You cannot write down the wind at the next second, but you can describe its *character*: how strong the gusts are on average, and whether they are long slow swells or short sharp jabs.

The tool for that is the **[[power spectral density|psd]]** (PSD). Think of the graphic equalizer on a music player, with sliders from deep bass to high treble. A PSD says how much of the wind's energy sits at each "note" — each frequency of wobble. Turbulence is modelled as a random process whose PSD is fixed.

Two spectra are standard. Both use three quantities:

- the **spatial frequency** $\Omega$ ("capital omega"), in radians per metre: how many wobbles the eddies make per metre of path;
- the **scale length** $L$, the size of the typical eddy;
- the **turbulence intensity** $\sigma$ ("sigma"), the root-mean-square gust speed — a typical gust size.

For the gust component $w$ at right angles to the flight path — the one that becomes angle of attack — the spectra $\Phi_w$ (capital "phi") are:

$$
\text{Dryden:}\quad
\Phi_w(\Omega) = \sigma_w^2\,\frac{L_w}{\pi}\;\frac{1 + 3(L_w\Omega)^2}{\left[1 + (L_w\Omega)^2\right]^2},
$$

$$
\text{von Kármán:}\quad
\Phi_w(\Omega) = \sigma_w^2\,\frac{L_w}{\pi}\;\frac{1 + \tfrac{8}{3}(1.339\,L_w\Omega)^2}{\left[1 + (1.339\,L_w\Omega)^2\right]^{11/6}} .
$$

The along-path component $u$ has simpler forms:

$$
\text{Dryden: } \Phi_u = \frac{\sigma_u^2\,(2L_u/\pi)}{1 + (L_u\Omega)^2}, \qquad
\text{von Kármán: } \Phi_u = \frac{\sigma_u^2\,(2L_u/\pi)}{\left[1 + (1.339\, L_u\Omega)^2\right]^{5/6}} .
$$

Both are scaled so that adding up $\Phi$ over all frequencies gives $\sigma^2$: all the energy together is the square of the typical gust size.

### From metres to seconds

The spectra are written per metre, but the controller lives in seconds. A rocket flying at speed $V$ through turbulence that is (nearly) standing still sweeps past $V$ metres of it every second. So a wobble of $\Omega$ radians per metre is felt at

$$
\omega = \Omega V
$$

radians per second. This is **[[Taylor's hypothesis|frozen-turbulence]]**. The spectrum the vehicle feels in time is $\Phi(\omega) = \Phi(\Omega = \omega/V)/V$, and the **break frequency** — where the spectrum starts to fall off — is $V/L$.

### Why two models?

They differ at high frequency, among the small, fast eddies. Von Kármán falls off as $\Omega^{-5/3}$. That is the slope [[Kolmogorov's theory|kolmogorov]] predicts, and measurements confirm it. Dryden falls off as $\Omega^{-2}$, a little too steep. At thirty times the break frequency the von Kármán spectrum carries 1.7 times the Dryden energy. That matters for shaking the structure, but little for the rigid-body attitude loop.

Dryden survives for a practical reason. Its spectrum is a **rational function** of $\Omega^2$ — a fraction made of ordinary polynomials — so it can be produced *exactly* by passing **white noise** (random static with equal energy at every frequency) through a simple linear filter:

$$
H_u(s) = \sigma_u\sqrt{\frac{2L_u}{\pi V}}\;\frac{1}{1 + \dfrac{L_u}{V}s},
\qquad
H_w(s) = \sigma_w\sqrt{\frac{L_w}{\pi V}}\;\frac{1 + \sqrt{3}\,\dfrac{L_w}{V}s}{\left(1 + \dfrac{L_w}{V}s\right)^2} .
$$

That is a few lines of code in any simulation — see the [[white noise through a filter|noise-filter]] sketch below. Von Kármán's fractional powers ($5/6$, $11/6$) have no exact filter, so they are approximated when a filter is needed.

Above about 600 m altitude, the military specifications set $L_u = L_v = L_w \approx 533\ \mathrm{m}$ (1750 ft). Intensities run from about 1–2 m/s for light turbulence to 5 m/s and more for severe.

```python
import numpy as np

V, L, sigma = 420.0, 533.0, 3.0      # airspeed m/s, scale length m, intensity m/s
tau = L / V                           # filter time constant, s
dt, n = 0.01, 400_000                 # 4000 s of flight
rng = np.random.default_rng(1)
# white noise scaled for the 1/pi convention of the spectra
noise = rng.standard_normal(n) * np.sqrt(np.pi / dt)

# H_w(s) = K (1 + sqrt(3) tau s) / (1 + tau s)^2, built from two first-order lags
K = sigma * np.sqrt(L / (np.pi * V))
x1 = x2 = 0.0
w = np.empty(n)
for k in range(n):
    x1 += dt * (K * noise[k] - x1) / tau    # first lag
    x2 += dt * (x1 - x2) / tau              # second lag
    w[k] = x2 + np.sqrt(3) * (x1 - x2)      # adds the sqrt(3) tau s term
print(round(w.std(), 1))                    # -> 3.0 (m/s, the intensity sigma)
```

The printed RMS is the check that the scaling is right: the gusts come out with the intensity you asked for.

::: example Turbulence at max-Q
Fly at $V = 420\ \mathrm{m/s}$ through Dryden turbulence with $L_w = 533\ \mathrm{m}$ and $\sigma_w = 3\ \mathrm{m/s}$.

**Break frequency and time constant.**

$$
\frac{V}{L_w} = \frac{420}{533} = 0.79\ \mathrm{rad/s},
$$

and dividing by $2\pi$ gives $0.125\ \mathrm{Hz}$. The filter time constant is the flip, $L_w/V = 533/420 = 1.27\ \mathrm{s}$.

**Typical angle of attack.** A gust of speed $w$ at airspeed $V$ tilts the flow by about $w/V$ radians, so the RMS angle of attack is

$$
\sigma_\alpha = \frac{\sigma_w}{V} = \frac{3}{420} = 0.0071\ \mathrm{rad} = 0.41^\circ .
$$

A $3\sigma$ excursion (three times the typical size, reached now and then) is $1.2^\circ$ — about 34 kPa·deg at 27.4 kPa, riding on top of whatever the shear has already done.

**Where the energy sits.** Adding up the spectrum up to each frequency, about 63 % of the gust energy lies below 0.3 Hz and 88 % below 1 Hz. So most of the turbulence is inside the attitude loop's bandwidth. There the controller responds to it and the gimbal works all the time. The remaining tenth or so passes straight through to the structure and to the bending modes of the next lesson.

**Sanity check.** The break frequency, $0.125\ \mathrm{Hz}$, is below the loop's $0.36\ \mathrm{Hz}$ crossover, so it makes sense that most of the energy is slow enough for the loop to follow.
:::

::: key
Dryden and von Kármán are the two standard turbulence spectra, parameterised by intensity $\sigma$ and scale length $L$ (about 533 m at altitude), converted to the vehicle's time domain by $\omega = \Omega V$. Von Kármán has the physically correct $\Omega^{-5/3}$ high-frequency slope; Dryden is rational and can be generated exactly by filtering white noise, which is why simulations use it.
:::

## Winds in the simulation and on launch day

In a 3-DOF or 6-DOF ascent simulation (three or six **degrees of freedom**: position only, or position plus attitude), the wind enters in exactly one place, the air-relative velocity:

$$
\mathbf{V} = \mathbf{v} - \mathbf{w}(h, t).
$$

The vehicle's velocity $\mathbf{v}$ minus the wind $\mathbf{w}$ at height $h$ and time $t$. From it, $\alpha$, $\beta$ and $\bar{q}$ follow as in lesson 4. The mean profile is a table against height, with the shear built into that table. Discrete gusts are added as functions of height or time. Turbulence is the output of the Dryden filters. The load indicator $\bar{q}\alpha_T$ is logged along the trajectory and its peak compared with the envelope, run after run, until the chance of going over is known.

On launch day the profile is measured. **Rawinsonde** balloons take about an hour to rise to 20 km and report the wind from GPS tracking. Doppler radar wind profilers give a profile through the jet every few minutes without launching anything. The measured profile feeds the steering update and a loads check. The ascent team predicts $\bar{q}\alpha_T$ against the certified envelope, with allowances for the wind change expected before lift-off and for gusts and shear the measurement cannot see. A predicted exceedance breaks a **launch commit criterion**. That is why a countdown can be [[scrubbed for "upper-level winds"|upper-winds]] on a clear, calm morning.

::: warning
Wind direction conventions bite. Meteorologists report the direction the wind blows *from*. A vector-wind table gives the components it blows *toward*. A 270° wind is a westerly: it blows from the west, toward the east. Get this backwards and your wind bias steers the nose downwind, doubling the load instead of removing it.
:::

::: warning
Scale-length conventions differ between the military specifications. MIL-F-8785C writes the same Dryden spectrum with $2L$ in place of $L$, so its quoted scale lengths are half the values above for the same physical turbulence. Check which convention a formula uses before you plug in 533 m.
:::

## Check yourself

::: check
A vehicle climbs at 300 m/s vertical speed with 380 m/s airspeed through a layer in which the crosswind grows by 24 m/s over 800 m. What angle-of-attack ramp does it feel, and for how long?
:::

::: answer
**Time.** The layer takes $800/300 = 2.7\ \mathrm{s}$ to cross.

**Size.** The angle-of-attack change is $\arctan(24/380) = 3.6^\circ$.

**Rate.** $3.61/2.67 \approx 1.35^\circ$ per second (using the unrounded values).

The shear gradient is $24/800 = 0.03$ per second — the same gradient as the exercise's 30 m/s per kilometre.
:::

::: check
Why is the Dryden spectrum preferred for simulation, even though the von Kármán spectrum matches measured turbulence better?
:::

::: answer
The Dryden PSD is a rational function of frequency. So it is exactly the output spectrum of white noise passed through a linear filter of finite order with real coefficients — the $H_w(s)$ above. That makes it easy to generate a gust time history in a simulation, and to include in a linear analysis.

The von Kármán exponents $5/6$ and $11/6$ correspond to fractional-order dynamics, which no finite filter reproduces exactly; it can only be approximated. Dryden's price is a high-frequency slope of $-2$ instead of $-5/3$, which under-predicts the energy at frequencies well above $V/L$.
:::

::: check
For Dryden turbulence with $L_w = 533\ \mathrm{m}$, how does the break frequency the vehicle feels change between 300 m/s and 600 m/s airspeed? What does that mean for the attitude loop?
:::

::: answer
The break frequency is $V/L_w$:

- at 300 m/s: $300/533 = 0.56\ \mathrm{rad/s}$, or 0.09 Hz;
- at 600 m/s: $600/533 = 1.13\ \mathrm{rad/s}$, or 0.18 Hz.

Flying faster sweeps through the same eddies in less time. That pushes turbulence energy toward and past the attitude loop's crossover (0.36 Hz in the running example). At the same time $\sigma_\alpha = \sigma_w/V$ halves, so the angle-of-attack wobbles are smaller but faster. And dynamic pressure at 600 m/s is already falling, so the loads matter less.
:::

::: check
A 1-cosine gust has $w_m = 12\ \mathrm{m/s}$ and $d_m = 100\ \mathrm{m}$. What is the wind at $s = 50\ \mathrm{m}$, and how long does the gust last for a vehicle climbing at 350 m/s?
:::

::: answer
**Wind at 50 m.** $w_g(50) = 6\,[1 - \cos(\pi \times 50/100)] = 6\,[1 - 0] = 6\ \mathrm{m/s}$. That is half the peak, because $s = d_m/2$ is the quarter-way point of the gust.

**Duration.** The gust spans $2d_m = 200\ \mathrm{m}$, which at 350 m/s takes $200/350 = 0.57\ \mathrm{s}$.

At 420 m/s airspeed the peak angle of attack would be $12/420 = 0.029\ \mathrm{rad}$, or $1.6^\circ$.
:::

::: check
Explain why the day-of-launch steering update removes the mean wind but cannot remove wind shear or turbulence. What handles the rest?
:::

::: answer
The steering update reshapes the pitch and yaw programs from a profile measured an hour or more before launch. It can point the nose into whatever wind that profile shows at each height — but only as finely as the measurement resolves (hundreds of metres), and only as long as the wind stays put over the countdown.

Shear finer than that resolution, gusts a few hundred metres long and turbulence are not in the measured profile. Being random, they could not be pre-programmed anyway. They become leftover angle of attack. The closed-loop attitude controller and its load-relief accelerometer feedback handle it in real time — within the limits of a bandwidth that is slower than a gust and about as fast as a shear crossing.
:::

## Summary

| Symbol or fact | Meaning or value |
| --- | --- |
| Jet stream | strongest winds at 10–14 km, where max-Q is; 30–40 m/s mean, 60–75 m/s design envelopes in winter |
| Wind biasing | day-of-launch steering update flies the nose into the measured mean wind |
| Shear | $\partial w/\partial h$; 30 m/s over 1 km at 420 m/s is $\Delta\alpha = 4.1^\circ$ in about 3 s |
| 1-cosine gust | $w_g = \tfrac{w_m}{2}[1 - \cos(\pi s/d_m)]$, $0 \le s \le 2d_m$; design gusts about 9 m/s |
| Dryden $\Phi_w$ | $\sigma_w^2 \tfrac{L_w}{\pi}\tfrac{1 + 3(L_w\Omega)^2}{[1 + (L_w\Omega)^2]^2}$; rational, so it can be filtered |
| von Kármán $\Phi_w$ | exponent $11/6$, factor 1.339; correct $\Omega^{-5/3}$ slope |
| Taylor's hypothesis | $\omega = \Omega V$; break frequency $V/L$ (0.125 Hz at 420 m/s, $L = 533$ m) |
| Dryden filter $H_w(s)$ | $\sigma_w\sqrt{L_w/(\pi V)}\,(1 + \sqrt{3}\tfrac{L_w}{V}s)/(1 + \tfrac{L_w}{V}s)^2$ |
| Turbulence at max-Q | $\sigma_\alpha = \sigma_w/V = 0.41^\circ$ for 3 m/s; about 63 % of the energy below 0.3 Hz |

The disturbances are now described. The next lesson turns to the rocket's own weakness: the airframe is not rigid, and its bending modes can turn a well-designed attitude loop into an oscillator.

::: context jet-stream A river of air
The jet stream is a narrow, fast band of wind near the top of the troposphere, driven by the temperature difference between the cold poles and the warm tropics. Airliners flying east ride it to save fuel. For a rocket it is bad timing: it peaks at the same heights where dynamic pressure peaks. The sketch shows the typical shape of a winter profile — the average and a 95 % design envelope — with the max-Q band shaded.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="68" width="300" height="32" fill="#f2b880" opacity="0.45"/>
  <text x="345" y="88" font-size="11" text-anchor="end" fill="#1f2a44">max-Q band</text>
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="18" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="67.5,180.0 71.9,176.0 76.2,172.0 80.6,168.0 85.0,164.0 89.4,160.0 93.8,156.0 98.1,152.0 102.5,148.0 106.7,144.0 110.9,140.0 115.2,136.0 120.0,132.0 125.6,128.0 132.0,124.0 138.4,120.0 144.5,116.0 150.3,112.0 156.1,108.0 161.3,104.0 165.5,100.0 169.1,96.0 172.5,92.0 175.0,88.0 176.0,84.0 173.9,80.0 168.8,76.0 162.0,72.0 155.0,68.0 147.2,64.0 137.8,60.0 128.3,56.0 120.0,52.0 112.8,48.0 106.0,44.0 100.0,40.0 95.5,36.0 92.0,32.0 88.8,28.0 86.4,24.0 85.0,20.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="102.5,180.0 111.9,176.0 120.9,172.0 129.5,168.0 137.5,164.0 144.9,160.0 151.7,156.0 158.4,152.0 165.5,148.0 172.8,144.0 180.3,140.0 188.2,136.0 197.0,132.0 207.4,128.0 219.2,124.0 231.3,120.0 242.5,116.0 253.1,112.0 263.6,108.0 273.1,104.0 281.0,100.0 288.1,96.0 294.9,92.0 300.0,88.0 302.0,84.0 297.9,80.0 287.6,76.0 273.9,72.0 260.0,68.0 244.1,64.0 225.0,60.0 205.9,56.0 190.0,52.0 177.4,48.0 165.9,44.0 156.0,40.0 148.0,36.0 141.3,32.0 135.3,28.0 130.4,24.0 127.0,20.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="178" y="150" font-size="11" fill="#1d6fd1">average</text>
  <text x="262" y="140" font-size="11" fill="#b4232c">95 % envelope</text>
  <g font-size="11" fill="#1f2a44">
    <text x="44" y="184" text-anchor="end">0</text><text x="44" y="104" text-anchor="end">10</text><text x="44" y="24" text-anchor="end">20 km</text>
    <text x="50" y="197" text-anchor="middle">0</text><text x="190" y="197" text-anchor="middle">40</text><text x="330" y="197" text-anchor="middle">80 m/s</text>
  </g>
</svg>
```
:::

::: context percentile What "95th percentile" means
Line up every January wind at 12 km over many years, from weakest to strongest. The 95th percentile is the speed that 95 out of every 100 of them stay below. Designing to it means the rocket can fly on about 95 % of days in that month; on the other 5 % the wind is too strong and the launch waits. Choosing 95 % or 99 % is a trade between how often you can launch and how heavy the structure has to be.
:::

::: context balloons How the wind is measured
A weather balloon carries a small radio package called a radiosonde. As it rises it drifts with the wind, and GPS tracking of its position shows exactly how fast and which way it is being carried at each height. (When the package reports wind, it is called a rawinsonde.)

It is simple and accurate, but slow: about an hour to reach 20 km, so by the time the whole profile is in, the lowest part is already an hour old. Radar wind profilers fill the gap by bouncing radio waves off the turbulent air itself, producing a fresh profile every few minutes.
:::

::: context one-cosine The shape of a standard gust
The 1-cosine gust with $w_m = 9$ m/s and $d_m = 150$ m, drawn to scale. It starts and ends with zero slope, so it switches on smoothly, like a real gust, instead of as a sudden step. At ascent speed the whole 300 m passes in under a second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="42" x2="182.5" y2="42" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="182.5" y1="42" x2="182.5" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <polyline points="40.0,150.0 44.8,149.7 49.5,148.8 54.2,147.4 59.0,145.3 63.8,142.8 68.5,139.7 73.2,136.1 78.0,132.1 82.8,127.7 87.5,123.0 92.2,118.0 97.0,112.7 101.8,107.2 106.5,101.6 111.2,96.0 116.0,90.4 120.8,84.8 125.5,79.3 130.2,74.0 135.0,69.0 139.8,64.3 144.5,59.9 149.2,55.9 154.0,52.3 158.8,49.2 163.5,46.7 168.2,44.6 173.0,43.2 177.8,42.3 182.5,42.0 187.2,42.3 192.0,43.2 196.8,44.6 201.5,46.7 206.2,49.2 211.0,52.3 215.8,55.9 220.5,59.9 225.2,64.3 230.0,69.0 234.8,74.0 239.5,79.3 244.2,84.8 249.0,90.4 253.8,96.0 258.5,101.6 263.2,107.2 268.0,112.7 272.8,118.0 277.5,123.0 282.2,127.7 287.0,132.1 291.8,136.1 296.5,139.7 301.2,142.8 306.0,145.3 310.8,147.4 315.5,148.8 320.2,149.7 325.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44">
    <text x="34" y="46" text-anchor="end">9</text><text x="34" y="154" text-anchor="end">0</text>
    <text x="40" y="166" text-anchor="middle">0</text><text x="182.5" y="166" text-anchor="middle">150 m = d_m</text><text x="325" y="166" text-anchor="middle">300 m</text>
    <text x="48" y="26">wind, m/s</text>
  </g>
</svg>
```
:::

::: context psd A recipe of wiggles
Any wiggly signal can be built by adding together smooth waves of different frequencies. The power spectral density is the recipe: how much of each frequency goes in. A deep, slow swell is low-frequency energy; a fast buzz is high-frequency energy.

For gusts this is exactly what a control engineer needs, because a control loop responds very differently to slow and fast inputs. Slow wobbles it can follow and correct; fast ones slip past it into the structure. The PSD tells you how much of the wind falls on each side of that line.
:::

::: context frozen-turbulence Frozen turbulence
G. I. Taylor suggested in 1938 that when you move fast through turbulence, you can treat the eddies as frozen in place: they change slowly compared with how quickly you sweep past them. A rocket at 420 m/s crosses a 533 m eddy in about 1.3 s, far faster than the eddy itself evolves, so the idea works very well. It is what lets a pattern in space (per metre) be turned into a signal in time (per second) with one multiplication by $V$.
:::

::: context kolmogorov The five-thirds law
In 1941 Andrey Kolmogorov argued that in fully developed turbulence, big eddies break into smaller ones, which break into smaller ones still, passing energy down the line until it is finally lost to friction as heat. From that picture alone, and from which quantities the process can depend on, he showed the energy spectrum must fall as the $-5/3$ power of frequency across the middle range of sizes. Measurements in wind tunnels, oceans and the atmosphere have confirmed it. Von Kármán's spectrum is built to have that slope.
:::

::: context noise-filter Making gusts from static
Feed white noise — equal energy at every frequency, like radio static — into the Dryden filter, and out comes a gust history with exactly the Dryden spectrum. The filter smooths away the fast jitter and keeps the slow swells. The traces below are real: the right one is 30 s of output from $H_w(s)$ for $V = 420$ m/s and $L_w = 533$ m, and the left one is the first 2 s of the noise that drove it (each scaled to fit).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polyline points="12.0,76.6 14.5,118.1 17.0,91.2 19.5,100.1 22.0,99.1 24.5,96.9 27.0,113.2 29.5,97.1 32.0,102.8 34.5,65.0 37.0,93.0 39.5,98.2 42.0,97.5 44.5,101.0 47.0,104.5 49.5,98.5 52.0,90.6 54.5,97.2 57.0,86.4 59.5,96.8 62.0,94.8 64.5,81.0 67.0,90.1 69.5,99.6 72.0,96.7 74.5,90.1 77.0,77.5 79.5,97.4 82.0,97.2 84.5,86.0 87.0,103.0 89.5,97.6 92.0,87.0 94.5,89.8 97.0,94.2 99.5,89.0 102.0,120.5 104.5,85.8 107.0,103.7 109.5,110.1" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="60" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">white noise</text>
  <line x1="116" y1="95" x2="140" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="146,95 138,90 138,100" fill="#1f2a44"/>
  <rect x="148" y="72" width="78" height="46" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="187" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">Dryden</text>
  <text x="187" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">H_w(s)</text>
  <line x1="226" y1="95" x2="238" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="244,95 236,90 236,100" fill="#1f2a44"/>
  <polyline points="248.0,95.0 250.0,101.0 252.0,94.2 254.0,87.1 256.0,91.9 258.0,102.1 260.0,112.5 262.0,89.8 264.0,113.2 266.0,94.9 268.0,94.4 270.0,75.0 272.0,77.5 274.0,98.3 276.0,95.5 278.0,67.1 280.0,65.4 282.0,80.0 284.0,93.5 286.0,112.8 288.0,120.2 290.0,92.7 292.0,87.2 294.0,66.9 296.0,67.9 298.0,88.0 300.0,99.1 302.0,116.5 304.0,94.5 306.0,96.0 308.0,84.3 310.0,105.0 312.0,89.2 314.0,88.6 316.0,71.3 318.0,65.0 320.0,72.6 322.0,107.8 324.0,100.3 326.0,75.0 328.0,100.7 330.0,97.4 332.0,67.7 334.0,69.6 336.0,80.3 338.0,82.2 340.0,88.6 342.0,110.7 344.0,99.1 346.0,91.5" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="297" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">gusts w(t)</text>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#6c7a93">left: 2 s of input · right: 30 s of output</text>
</svg>
```
:::

::: context upper-winds Scrubbed on a sunny day
Spectators are often puzzled when a launch is called off under a clear blue sky. The trouble is 10 km overhead. If the balloon and radar measurements show jet-stream winds or shears that would push the predicted $\bar{q}\alpha$ past the certified envelope, the launch commit criteria forbid lift-off. Space Shuttle, Falcon 9 and many other launches have been held or scrubbed for upper-level winds. Often the fix is simply to wait a day for the jet stream to shift.
:::
