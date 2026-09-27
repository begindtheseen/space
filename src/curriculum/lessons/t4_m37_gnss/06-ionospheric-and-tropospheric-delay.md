---
id: l06-ionospheric-and-tropospheric-delay
title: Ionospheric and tropospheric delay
minutes: 23
covers:
  - Ionospheric and tropospheric delay, their models, and the dual-frequency ionosphere-free combination
---

Imagine a delivery that drives $20{,}000\,\mathrm{km}$ on an empty highway, then has to pass through two towns before it arrives. In the first town, the hold-up depends on what you drive: big trucks crawl, small cars get through faster. In the second town, every vehicle is slowed by exactly the same amount. Send two vehicles of different sizes and compare their arrival times, and you can work out the first town's delay exactly. But nothing you do with vehicle sizes tells you anything about the second town.

A GNSS signal makes that trip. The highway is empty space. The first town is the **ionosphere**, a layer of electrically charged gas high above the ground, which slows each radio frequency by a different amount. The second town is the **troposphere**, the ordinary air near the ground, which slows every frequency the same. The pseudorange lesson put both into the error budget without justifying either: $2$ to $30\,\mathrm{m}$ of ionosphere on L1, and $2.3\,\mathrm{m}$ of troposphere straight up, far more near the horizon.

This distinction decides how receivers are built. A single-frequency receiver can only *model* the ionosphere and hope. A dual-frequency receiver can *measure* its way out of the ionosphere entirely — at a cost in noise that this lesson works out. Neither one gains anything against the troposphere, which every receiver must model, however many frequencies it has. By the end you will be able to compute both delays from first principles, not only quote their sizes.

## The ionosphere: a cloud of free electrons

Above about $50\,\mathrm{km}$, sunlight is strong enough to knock electrons off air molecules. What is left is a thin **[[plasma|plasma]]** — a gas with free electrons drifting loose. That layer is the ionosphere, and it is densest around $300$ to $400\,\mathrm{km}$ up.

A radio wave is an oscillating electric field. As it passes, it shakes every free electron back and forth, and each shaken electron sends out its own tiny wave, slightly out of step with the one that shook it. Add all those little waves to the original and the result travels at a different speed. The physics lives in one number, the **refractive index** $n$ — how much a material changes a wave's speed, with $n = 1$ for empty space. Work out how a single electron (charge $e$, mass $m_e$) responds to the wave, and you find a **plasma frequency** $f_p$, set by the electron density $N_e$ in electrons per cubic meter:

$$
f_p^2 = \frac{N_e e^2}{4\pi^2\varepsilon_0 m_e} .
$$

Here $\varepsilon_0$ (read "epsilon nought") is a fixed constant of electricity, the permittivity of free space. GPS frequencies are thousands of times higher than $f_p$, and at such high frequencies the refractive index is

$$
n \approx 1 - \frac{f_p^2}{2 f^2} = 1 - \frac{N_e e^2}{8\pi^2\varepsilon_0 m_e f^2}.
$$

It is less than one, and the gap shrinks as $1/f^2$: double the frequency and the effect drops by four.

### Code delayed, carrier advanced

Here is a strange twist. A refractive index below one means the wave's crests — its **phase** — actually run *faster* than light. But information, like the code a receiver times, rides on the wave's overall shape, which moves at the **[[group velocity|group-phase]]**. In a plasma the group runs slower than light by exactly the amount the phase runs faster. So the code is *delayed* and the carrier phase is *advanced*, by the same amount.

::: note Why it has to be true
Write $K = e^2/(8\pi^2\varepsilon_0 m_e)$, so the phase index is $n = 1 - K N_e/f^2$. The group index is $n_g = n + f\,\dfrac{dn}{df}$, because a group is a bundle of nearby frequencies and its speed depends on how fast $n$ changes with frequency. The derivative of $-K N_e f^{-2}$ is $2K N_e f^{-3}$, so $f\,dn/df = 2K N_e/f^2$, and

$$
n_g = 1 - \frac{K N_e}{f^2} + \frac{2K N_e}{f^2} = 1 + \frac{K N_e}{f^2}.
$$

The phase index sits $K N_e/f^2$ below one; the group index sits the same amount above one.
:::

The extra path length is the group index minus one, added up along the whole path. Adding up $N_e$ along the path gives the **total electron content**, $\mathrm{TEC} = \int N_e\,ds$ — the number of free electrons in a thin tube one square meter across, from the satellite down to you. So the code delay is

$$
I = \frac{e^2}{8\pi^2\varepsilon_0 m_e}\cdot\frac{\mathrm{TEC}}{f^2} \equiv \frac{40.3\,\mathrm{TEC}}{f^2}.
$$

Put in the constants — $e = 1.602\times10^{-19}\,\mathrm{C}$, $m_e = 9.109\times10^{-31}\,\mathrm{kg}$, $\varepsilon_0 = 8.854\times10^{-12}\,\mathrm{F/m}$ — and the fraction comes to about $40.3$ (with more digits, $40.31$). That is the constant the pseudorange lesson used without deriving.

TEC is counted in **TEC units**: $1\,\mathrm{TECU} = 10^{16}$ electrons per square meter. On L1, one TECU costs $40.3\times10^{16}/(1575.42\times10^6)^2 = 0.162\,\mathrm{m}$ — again the pseudorange lesson's figure. Looking straight up, TEC runs from a few units at night to over a hundred on a sunny afternoon near the magnetic equator at **[[solar maximum|solar-cycle]]**. That is why the ionosphere is the biggest single term in a single-frequency error budget.

The delay depends on frequency, which is what **dispersive** means — the same thing that lets a prism split white light into colors. It comes from the electrons, not from the geometry or the receiver. That one fact drives the rest of this lesson.

## The slanted path through a thin shell

TEC is usually mapped as a **vertical** amount, the column straight up. That is what changes smoothly with latitude and time of day, so it is what a model can represent. But a satellite is rarely straight overhead. A slanted signal crosses the layer at an angle and passes through more of it, so the delay you actually get is the vertical value times an **obliquity factor**, also called a **mapping function**.

Picture the ionosphere as a thin shell at height $h_{\mathrm{ion}}$, usually taken as $350\,\mathrm{km}$. The signal crosses the shell at a **[[pierce point|pierce-point]]**, and meets it at a zenith angle $z'$ — the angle from straight up, measured *at the shell*. The sine rule in the triangle made by Earth's center, the ground station and the pierce point links $z'$ to the elevation angle $\mathrm{el}$ seen on the ground:

$$
\sin z' = \frac{R_E}{R_E + h_{\mathrm{ion}}}\cos(\mathrm{el}).
$$

The path through a thin layer at angle $z'$ is $1/\cos z'$ times the vertical path. So the obliquity factor is

$$
F(\mathrm{el}) = \frac{1}{\cos z'} = \left[1 - \left(\frac{R_E}{R_E+h_{\mathrm{ion}}}\right)^2\cos^2(\mathrm{el})\right]^{-1/2}, \qquad I_{\mathrm{slant}} = F(\mathrm{el})\times I_{\mathrm{vertical}} .
$$

At $\mathrm{el}=60^\circ$, with $R_E=6378\,\mathrm{km}$ and $h_{\mathrm{ion}}=350\,\mathrm{km}$:

$$
F(60^\circ) = \left[1 - \left(\frac{6378}{6728}\right)^2\cos^2 60^\circ\right]^{-1/2} = 1.136 .
$$

That is the factor the pseudorange lesson used to turn $30\,\mathrm{TECU}$ vertical into $5.53\,\mathrm{m}$ slanted on L1. Lower down it grows: $F = 2.79$ at $10^\circ$ and $3.04$ at $5^\circ$. It can never pass about $3.1$, the value at the horizon, because a thin shell is crossed only once. Like the troposphere below, the ionosphere punishes low satellites.

## The Klobuchar model: the best one frequency can do

A single-frequency receiver cannot measure TEC. Instead it uses the **[[Klobuchar model|klobuchar]]**, a recipe broadcast in the navigation message: eight numbers, $\alpha_0$ to $\alpha_3$ and $\beta_0$ to $\beta_3$ (read "alpha nought", "beta nought" and so on), updated by the control segment and good for about a day.

The model's picture of the ionosphere is simple. At night the delay sits on a flat floor of $5\,\mathrm{ns}$. During the day a smooth bump rises on top of it, shaped like half of a cosine wave and peaking at $14{:}00$ local time at the pierce point:

$$
T_{\mathrm{iono}} = F(\mathrm{el})\times\begin{cases} 5\,\mathrm{ns} + \mathrm{AMP}\left(1 - \dfrac{x^2}{2} + \dfrac{x^4}{24}\right), & |x| < 1.57 \\ 5\,\mathrm{ns}, & \text{otherwise} \end{cases}, \qquad x = \frac{2\pi(t - 50400)}{\mathrm{PER}} .
$$

Here $t$ is local time in seconds ($50{,}400\,\mathrm{s}$ is $14{:}00$), AMP is the bump's height, and PER is its width in time. Both are cubic polynomials in the **geomagnetic latitude** $\phi_m$ (read "phi m") of the pierce point — latitude measured from Earth's magnetic equator, in units of half-circles, so $\pm1$ means $\pm180^\circ$:

$$
\mathrm{AMP} = \max\!\left(\sum_{n=0}^{3}\alpha_n\phi_m^n,\ 0\right), \qquad \mathrm{PER} = \max\!\left(\sum_{n=0}^{3}\beta_n\phi_m^n,\ 72{,}000\,\mathrm{s}\right).
$$

The $\max$ just stops the amplitude going negative and the period getting too short. And $1 - x^2/2 + x^4/24$ is the first three terms of the series for $\cos x$ — a cheap cosine without calling a trigonometry routine, a small kindness to 1980s receiver chips that the algorithm has carried ever since.

::: example An afternoon peak against a pre-dawn floor
Take coefficients of the size actually broadcast: $\alpha = (3.82,\ 1.49,\ -17.9,\ 0)\times10^{-8}\,\mathrm{s}$ and $\beta = (1.43,\ 0,\ -3.28,\ 1.13)\times10^{5}\,\mathrm{s}$. Use a geomagnetic latitude of $\phi_m = 0.30$ half-circles ($54^\circ$, a mid-latitude site) and the $F=1.136$ worked out above.

```python
import numpy as np

alpha = [3.82e-8, 1.49e-8, -17.9e-8, 0.0]
beta  = [1.43e5, 0.0, -3.28e5, 1.13e5]

def klobuchar(phi_m, t_sec, F):
    AMP = max(sum(a * phi_m**n for n, a in enumerate(alpha)), 0.0)
    PER = max(sum(b * phi_m**n for n, b in enumerate(beta)), 72000.0)
    x = 2 * np.pi * (t_sec - 50400.0) / PER
    T = F * (5e-9 + AMP * (1 - x**2 / 2 + x**4 / 24)) if abs(x) < 1.57 else F * 5e-9
    return T

C = 299792458.0
for label, t in (("14:00 local", 14 * 3600), ("02:00 local", 2 * 3600)):
    T = klobuchar(0.30, t, 1.135678868194363)
    print(f"{label}: {T*1e9:.2f} ns = {T*C:.2f} m")
# 14:00 local: 35.84 ns = 10.75 m
# 02:00 local: 5.68 ns = 1.70 m
```

At $14{:}00$ the delay is $35.84\,\mathrm{ns}$; multiply by the speed of light to get $10.75\,\mathrm{m}$. At $02{:}00$ only the night floor is left: $5\,\mathrm{ns}$ times $1.136$ is $5.68\,\mathrm{ns}$, or $1.70\,\mathrm{m}$.

A factor of six between mid-afternoon and the small hours. And the model never saw a single real electron — only the date, through the broadcast numbers, and the time of day.
:::

The model is honest about what it is: a smooth, eight-number fit to an average ionosphere, which is neither smooth nor the same everywhere. It typically takes out only about half of the real delay (in the root-mean-square sense). That is why the pseudorange lesson's single-frequency budget still carried $4.0\,\mathrm{m}$ of ionosphere after the correction. What it cannot see: day-to-day swings in solar activity, **geomagnetic storms** that pile on delay far above the quiet-day curve, the **[[equatorial anomaly|equatorial-anomaly]]** — two ridges of extra electrons either side of the magnetic equator — and travelling ripples in the ionosphere. None of that fits in a cubic in latitude and one cosine in time. To do better, a receiver needs a second look at the same ionosphere at a different frequency.

## Removing it outright: the ionosphere-free combination

Write the code pseudoranges on two frequencies, $f_1$ and $f_2$, with everything corrected except the ionosphere:

$$
\rho_1 = R + I_1 + \varepsilon_1, \qquad \rho_2 = R + I_2 + \varepsilon_2 .
$$

$R$ is everything the two share: geometric range, clock terms, troposphere. $I_1$ and $I_2$ are the ionospheric delays, and $\varepsilon_1$, $\varepsilon_2$ (read "epsilon") are the noise. Because the delay goes as $1/f^2$, the two delays are linked:

$$
I_2 = I_1\left(\frac{f_1}{f_2}\right)^2 .
$$

Now look for a mix $\rho_{\mathrm{IF}} = c_1\rho_1 + c_2\rho_2$ that gives back $R$ exactly. Two conditions pin down the two numbers:

1. Keep $R$ at full size: $c_1 + c_2 = 1$.
2. Cancel the ionosphere: $c_1 I_1 + c_2 I_2 = 0$.

Put $I_2 = I_1(f_1/f_2)^2$ into the second condition and divide by $I_1$: $c_1 = -c_2 (f_1/f_2)^2$. Put that into the first: $c_2\big(1 - f_1^2/f_2^2\big) = 1$. Solve for $c_2$, then $c_1 = 1 - c_2$:

$$
c_2 = \frac{-f_2^2}{f_1^2-f_2^2}, \qquad c_1 = \frac{f_1^2}{f_1^2-f_2^2} .
$$

So the **ionosphere-free combination** is

$$
\rho_{\mathrm{IF}} = \frac{f_1^2\rho_1 - f_2^2\rho_2}{f_1^2 - f_2^2} ,
$$

the closed form the pseudorange lesson's budget used. For L1 ($f_1=1575.42\,\mathrm{MHz}$) and L2 ($f_2=1227.60\,\mathrm{MHz}$), $c_1 = 2.546$ and $c_2 = -1.546$. The mix leans hard on both: more than two and a half times L1, minus one and a half times L2.

::: example Exact cancellation, then the noise it costs
Take a true range $R=21{,}000{,}000\,\mathrm{m}$ and $40\,\mathrm{TECU}$ of vertical TEC, seen at $\mathrm{el}=60^\circ$. With $F=1.136$, the slanted TEC is $45.4\,\mathrm{TECU}$.

```python
import numpy as np

Re, h_ion = 6378e3, 350e3
el = np.radians(60)
F = 1 / np.sqrt(1 - (Re / (Re + h_ion) * np.cos(el)) ** 2)   # obliquity, as derived above

f1, f2 = 1575.42e6, 1227.60e6
c1 = f1**2 / (f1**2 - f2**2)
c2 = -f2**2 / (f1**2 - f2**2)

R = 21_000_000.0
TEC_vert = 40.0                              # TECU
I1 = 40.3 * (TEC_vert * F * 1e16) / f1**2      # L1 ionospheric delay, m
I2 = I1 * (f1 / f2)**2                          # L2 ionospheric delay, m
rho1, rho2 = R + I1, R + I2
rho_IF = c1 * rho1 + c2 * rho2
print(round(I1, 3), round(I2, 3), rho_IF - R)
# 7.376 12.148 -7.450580596923828e-09
```

The L1 delay is $7.38\,\mathrm{m}$ and the L2 delay $12.15\,\mathrm{m}$ — bigger on the lower frequency, as $1/f^2$ demands. The combination gives back $R$ to about $10^{-8}\,\mathrm{m}$, which is only computer rounding.

Now the price. Give each frequency its own independent code noise with $\sigma=0.3\,\mathrm{m}$. When independent errors are scaled and added, their variances add: $\mathrm{Var}(\rho_{\mathrm{IF}}) = c_1^2\sigma^2 + c_2^2\sigma^2$. Take the square root:

$$
\sigma_{\mathrm{IF}} = \sqrt{c_1^2+c_2^2}\ \sigma = \sqrt{2.546^2+1.546^2}\times0.3 = 2.978\times0.3 = 0.893\,\mathrm{m}.
$$

A Monte Carlo run of $200{,}000$ random draws gives a spread of $0.896\,\mathrm{m}$, matching. Both $|c_1|$ and $|c_2|$ are bigger than $1$, so the noise on each frequency is magnified, not averaged down. This is the "roughly tripling" the pseudorange lesson charged the ionosphere-free column.
:::

The magnification is smaller when the two frequencies are further apart. Repeat the algebra for L1 and L5 ($f_5=1176.45\,\mathrm{MHz}$): $c_1=2.261$, $c_5=-1.261$, and $\sqrt{c_1^2+c_5^2}=2.588$. That beats L1/L2's $2.978$, because a wider gap in frequency makes the two delays more different, so less leverage is needed to separate them. It is one reason a modern three-frequency receiver prefers its widest pair.

::: key
Ionosphere-free combination: $\rho_{\mathrm{IF}} = (f_1^2\rho_1 - f_2^2\rho_2)/(f_1^2-f_2^2)$. It cancels the first-order ionospheric delay exactly, because the delay scales as $1/f^2$; noise grows roughly threefold. For L1/L2 the coefficients are $2.546$ and $-1.546$, magnifying independent noise by $\sqrt{c_1^2+c_2^2}=2.978$; the wider L1/L5 pair magnifies it by $2.588$.
:::

## The troposphere: not dispersive, so it must be modelled

Below the ionosphere is the ordinary air — the troposphere and stratosphere together, which GNSS people lump together as "the troposphere". It slows the signal too, but for a different reason: the gas molecules and water vapor themselves, not free electrons. At radio frequencies this slowing does not depend on frequency at all. So $I_1 = I_2$ for the troposphere, and the ionosphere-free trick — subtracting two measurements that disagree because of a $1/f^2$ term — has nothing to grab. **A second frequency does nothing for the troposphere.** Every receiver has to model it.

The standard model, due to Saastamoinen, splits the delay straight up — the **zenith delay** — into two parts. (An older model by Helen Hopfield makes the same split with a different fit to how the air thins with height; receivers use either.)

- the **hydrostatic** (or "dry") part, from the weight of the whole air column. It follows almost exactly from the surface air pressure, so it is easy to predict.
- the **wet** part, from water vapor. Water vapor is patchy and changes fast, so no single surface reading predicts it well.

The **zenith hydrostatic delay** is

$$
\mathrm{ZHD} = \frac{0.0022768\,P}{1 - 0.00266\cos(2\phi) - 0.00028\,h},
$$

with $P$ the surface pressure in **[[hectopascals|hectopascal]]**, $\phi$ the latitude, and $h$ the station height in kilometers. The small terms underneath adjust for gravity being slightly different at different latitudes and heights. At Cape Canaveral — latitude $28.56^\circ$, sea level, standard pressure $1013.25\,\mathrm{hPa}$ — the latitude term uses $2\phi = 57.12^\circ$:

$$
\mathrm{ZHD} = \frac{0.0022768 \times 1013.25}{1 - 0.00266\cos(57.12^\circ) - 0} = 2.310\,\mathrm{m},
$$

the pseudorange lesson's figure exactly. The **zenith wet delay** is smaller and much less steady. It depends on the water vapor pressure $e$ (in hPa — not the electron charge this time) and the temperature $T$ in kelvin:

$$
\mathrm{ZWD} \approx 0.002277\left(\frac{1255}{T} + 0.05\right)e .
$$

::: example How much the weather changes the wet delay
To get the vapor pressure from everyday weather, use the Magnus formula for the pressure of saturated air, $e_s(T_c) = 6.1094\exp\big(17.625\,T_c/(T_c+243.04)\big)\,\mathrm{hPa}$, with $T_c$ in degrees Celsius. Then scale by the relative humidity: $e = (\mathrm{RH}/100)\,e_s$. Convert to kelvin ($T = T_c + 273.15$) and use the ZWD formula.

| Conditions | $e\,(\mathrm{hPa})$ | ZWD |
| --- | --- | --- |
| Cape Canaveral, $26^\circ\mathrm{C}$, $70\%$ RH | $23.5$ | $0.227\,\mathrm{m}$ |
| Hot, humid tropics, $35^\circ\mathrm{C}$, $90\%$ RH | $50.6$ | $0.475\,\mathrm{m}$ |
| Cold and dry, $0^\circ\mathrm{C}$, $40\%$ RH | $2.4$ | $0.026\,\mathrm{m}$ |

The hot-humid case is about eighteen times the cold-dry one. The hydrostatic delay, meanwhile, moves only a few percent with the weather.

That is why the two parts are handled differently. The hydrostatic part is corrected from a pressure reading and trusted to a centimeter or two. The wet part is either modelled roughly, accepting several centimeters of error, or — in precise work — treated as an unknown and estimated from the data. The receiver's navigation filter carries a slowly wandering zenith wet delay as an extra state beside position, the kind of **[[random-walk state|random-walk]]** the Kalman filtering module describes. Precise point positioning does exactly this, later in this module.
:::

Both parts are then mapped from straight up to the real line of sight. The simplest mapping divides by $\sin(\mathrm{el})$, because a flat layer is crossed on a path $1/\sin(\mathrm{el})$ times longer when you look at elevation $\mathrm{el}$. At $\mathrm{el}=60^\circ$ the Cape Canaveral total, $2.310 + 0.227 = 2.537\,\mathrm{m}$ at zenith, maps to $2.93\,\mathrm{m}$ — the pseudorange lesson's figure. But this simple form gets badly wrong below about $15^\circ$. At $5^\circ$ it gives $29\,\mathrm{m}$, more than the "up to $25\,\mathrm{m}$" the pseudorange lesson quoted. The real atmosphere is curved with the Earth, and the ray bends as it passes through layers of changing density; $1/\sin(\mathrm{el})$ ignores both. Working receivers use better **[[mapping functions|mapping]]** — Niell's and Marini's are the standard names — fitted to computer ray-traces through real atmospheres and good well below $10^\circ$.

::: key
Troposphere versus ionosphere: the troposphere is not dispersive, so dual-frequency does not help. It must be modelled (Saastamoinen, Hopfield) with a mapping function, or estimated as a zenith delay state. Zenith delay is about $2.3\,\mathrm{m}$, rising steeply at low elevation. The hydrostatic part comes from surface pressure and is stable; the wet part, from humidity, runs from a few centimeters to half a meter and is poorly predicted. The ionosphere, $I=40.3\,\mathrm{TEC}/f^2$, is dispersive: removed by dual-frequency, or modelled by Klobuchar, which takes out roughly half.
:::

::: warning
Dual-frequency does not mean "remove the atmosphere". It means "remove the ionosphere". The troposphere is exactly as big a problem for a dual-frequency receiver as for a single-frequency one, because its delay is the same on every frequency — combining two frequencies gives no second, independent equation for it. A receiver that trusts its ionosphere-free combination to also fix a bad tropospheric model, or skips the tropospheric correction because it is "dual-frequency anyway", is carrying meters of uncorrected error.
:::

## Check yourself

::: check
Why does the ionospheric delay depend on frequency while the tropospheric delay does not? Answer in terms of what each layer is made of.
:::

::: answer
The ionosphere is a plasma of free electrons. A free electron shaken by a radio wave responds in a way that depends on the frequency — for frequencies far above the plasma frequency, the effect scales as $1/f^2$ — and the delay comes straight from that response. The troposphere is neutral gas and water vapor, where electrons are bound inside molecules. At GNSS frequencies those molecules respond the same way to every frequency in the band, so the delay is the same on every carrier.
:::

::: check
Vertical TEC is $60\,\mathrm{TECU}$ and the satellite is at $\mathrm{el}=30^\circ$. Using the $350\,\mathrm{km}$ thin shell, find the obliquity factor and the slanted ionospheric delay on L1.
:::

::: answer
Obliquity: $\cos 30^\circ = 0.86603$ and $6378/6728 = 0.94798$, so $\sin z' = 0.94798\times0.86603 = 0.82097$. Then $\cos z' = \sqrt{1 - 0.82097^2} = 0.57097$, and $F = 1/0.57097 = 1.751$.

Slanted TEC: $60 \times 1.751 = 105.1\,\mathrm{TECU}$.

Delay: each TECU costs $0.162\,\mathrm{m}$ on L1, so $I = 40.3 \times (105.1\times10^{16})/(1575.42\times10^6)^2 = 17.1\,\mathrm{m}$.

That is large, but inside the "$2$ to $30\,\mathrm{m}$" range the pseudorange lesson quoted — high but not extreme TEC, at a middling elevation.
:::

::: check
Derive the ionosphere-free coefficients for L1 and L5 ($f_1=1575.42\,\mathrm{MHz}$, $f_5=1176.45\,\mathrm{MHz}$). Is the noise magnification better or worse than for L1/L2?
:::

::: answer
Square the frequencies (in MHz): $f_1^2 = 2.4819\times10^6$ and $f_5^2 = 1.3840\times10^6$, so $f_1^2 - f_5^2 = 1.0979\times10^6$.

Then $c_1 = f_1^2/(f_1^2-f_5^2) = 2.261$ and $c_5 = -f_5^2/(f_1^2-f_5^2) = -1.261$. They add to $1$, as they must.

Noise magnification: $\sqrt{c_1^2+c_5^2} = 2.588$. That is better (smaller) than L1/L2's $2.978$, because L1 and L5 are further apart in frequency, so separating the $1/f^2$ term needs less leverage on either measurement.
:::

::: check
Compute the Saastamoinen zenith hydrostatic delay for a station with $1000\,\mathrm{hPa}$ surface pressure, at $45^\circ$ latitude and $1\,\mathrm{km}$ height.
:::

::: answer
At $45^\circ$ latitude, $2\phi = 90^\circ$ and $\cos 90^\circ = 0$, so the latitude term drops out. The height term is $0.00028 \times 1 = 0.00028$.

$$
\mathrm{ZHD} = \frac{0.0022768\times1000}{1 - 0 - 0.00028} = \frac{2.2768}{0.99972} = 2.277\,\mathrm{m}.
$$

The height term barely matters at $1\,\mathrm{km}$. What matters more at height is the pressure itself, which falls as you climb: an aircraft or rocket high in the atmosphere has far less air above it, and so far less delay.
:::

::: check
The Klobuchar coefficients are broadcast fresh every day, yet the model still leaves roughly half the real ionospheric delay uncorrected. What kind of ionospheric behavior can an eight-number model of this form never represent?
:::

::: answer
Anything that is not a smooth function of geomagnetic latitude and local time, repeated the same way every day. That rules out day-to-day swings from solar activity, sudden jumps from geomagnetic storms, the equatorial anomaly's two ridges of extra electrons either side of the magnetic equator (a shape no cubic in latitude can draw), and travelling disturbances. The model is a *climatology* — an average day — not a forecast of the actual one.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Ionospheric delay | $I = 40.3\,\mathrm{TEC}/f^2$ (TEC in electrons per square meter, $f$ in Hz); code delayed, carrier advanced by the same amount |
| TEC unit | $1\,\mathrm{TECU}=10^{16}\,\mathrm{el/m^2}$, costing $0.162\,\mathrm{m}$ on L1 |
| Obliquity factor | $F(\mathrm{el}) = [1-(R_E/(R_E+h_{\mathrm{ion}}))^2\cos^2(\mathrm{el})]^{-1/2}$; $1.136$ at $60^\circ$, $2.79$ at $10^\circ$ ($350\,\mathrm{km}$ shell) |
| Klobuchar model | half-cosine bump peaking at 14:00 local on a $5\,\mathrm{ns}$ night floor; AMP and PER cubic in geomagnetic latitude from 8 broadcast numbers; removes about half the delay |
| Ionosphere-free combination | $\rho_{\mathrm{IF}} = (f_1^2\rho_1-f_2^2\rho_2)/(f_1^2-f_2^2)$; L1/L2 coefficients $2.546$ and $-1.546$; noise times $2.978$ |
| Troposphere | not dispersive, so dual-frequency does not help; hydrostatic part stable, about $2.3\,\mathrm{m}$ at zenith; wet part $0.03$ to $0.5\,\mathrm{m}$, often estimated as a filter state |
| Saastamoinen ZHD | $0.0022768\,P/(1-0.00266\cos2\phi-0.00028h)$ |
| Saastamoinen ZWD | $0.002277(1255/T+0.05)\,e$ |
| Mapping | $1/\sin(\mathrm{el})$ as a first guess; Niell or Marini functions below about $10^\circ$ |

The atmosphere is now accounted for, down to the last term the pseudorange lesson left unexplained. What remains — signals bouncing off nearby surfaces, errors in the orbits the satellites broadcast, and the satellite clocks' leftover drift — is not physics a receiver can model away, and it is the subject of the next lesson.

::: context plasma The fourth state of matter
Solid, liquid, gas — and **plasma**, a gas so energized that some electrons have been knocked free of their atoms. Lightning, neon signs and the Sun are plasmas.

The ionosphere is a very thin one: even at its densest there are only about a trillion free electrons per cubic meter, among far more neutral molecules. It is made fresh each day by ultraviolet and X-ray light from the Sun, and partly fades at night when the electrons recombine with ions. That daily breathing is exactly the day-night pattern the Klobuchar model tries to follow.
:::

::: context group-phase Crests and packages
Think of a wave as a long train of crests. The **phase velocity** is how fast one crest moves. The **group velocity** is how fast a *package* of waves — a bump in loudness, a change in pattern — moves along. In empty space they are the same. In a plasma, the crests run a little faster than light while the package runs a little slower.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M20.0,100.0 L24.0,99.9 L28.0,99.9 L32.0,99.9 L36.0,99.9 L40.0,99.8 L44.0,99.7 L48.0,99.6 L52.0,99.5 L56.0,99.4 L60.0,99.2 L64.0,98.9 L68.0,98.6 L72.0,98.2 L76.0,97.8 L80.0,97.2 L84.0,96.5 L88.0,95.7 L92.0,94.8 L96.0,93.7 L100.0,92.4 L104.0,91.0 L108.0,89.3 L112.0,87.5 L116.0,85.6 L120.0,83.4 L124.0,81.2 L128.0,78.8 L132.0,76.3 L136.0,73.7 L140.0,71.1 L144.0,68.6 L148.0,66.1 L152.0,63.8 L156.0,61.7 L160.0,59.7 L164.0,58.1 L168.0,56.8 L172.0,55.8 L176.0,55.2 L180.0,55.0 L184.0,55.2 L188.0,55.8 L192.0,56.8 L196.0,58.1 L200.0,59.7 L204.0,61.7 L208.0,63.8 L212.0,66.1 L216.0,68.6 L220.0,71.1 L224.0,73.7 L228.0,76.3 L232.0,78.8 L236.0,81.2 L240.0,83.4 L244.0,85.6 L248.0,87.5 L252.0,89.3 L256.0,91.0 L260.0,92.4 L264.0,93.7 L268.0,94.8 L272.0,95.7 L276.0,96.5 L280.0,97.2 L284.0,97.8 L288.0,98.2 L292.0,98.6 L296.0,98.9 L300.0,99.2 L304.0,99.4 L308.0,99.5 L312.0,99.6 L316.0,99.7 L320.0,99.8 L324.0,99.9 L328.0,99.9 L332.0,99.9 L336.0,99.9 L340.0,100.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M20.0,100.0 L22.0,100.0 L24.0,100.0 L26.0,99.9 L28.0,99.9 L30.0,100.0 L32.0,100.0 L34.0,100.1 L36.0,100.1 L38.0,100.2 L40.0,100.1 L42.0,100.0 L44.0,99.9 L46.0,99.7 L48.0,99.6 L50.0,99.7 L52.0,99.8 L54.0,100.1 L56.0,100.4 L58.0,100.7 L60.0,100.8 L62.0,100.6 L64.0,100.2 L66.0,99.5 L68.0,98.8 L70.0,98.4 L72.0,98.5 L74.0,99.2 L76.0,100.3 L78.0,101.6 L80.0,102.7 L82.0,103.0 L84.0,102.3 L86.0,100.6 L88.0,98.2 L90.0,96.0 L92.0,94.8 L94.0,95.1 L96.0,97.4 L98.0,101.0 L100.0,105.0 L102.0,108.0 L104.0,108.7 L106.0,106.4 L108.0,101.5 L110.0,95.2 L112.0,89.5 L114.0,86.6 L116.0,87.9 L118.0,93.6 L120.0,102.4 L122.0,111.6 L124.0,118.1 L126.0,119.2 L128.0,113.9 L130.0,103.2 L132.0,90.1 L134.0,79.0 L136.0,73.7 L138.0,76.8 L140.0,88.0 L142.0,104.3 L144.0,120.6 L146.0,131.3 L148.0,132.5 L150.0,123.0 L152.0,105.2 L154.0,84.5 L156.0,67.7 L158.0,60.7 L160.0,66.1 L162.0,82.9 L164.0,106.0 L166.0,127.9 L168.0,141.5 L170.0,142.0 L172.0,128.9 L174.0,106.3 L176.0,81.4 L178.0,62.2 L180.0,55.0 L182.0,62.2 L184.0,81.4 L186.0,106.3 L188.0,128.9 L190.0,142.0 L192.0,141.5 L194.0,127.9 L196.0,106.0 L198.0,82.9 L200.0,66.1 L202.0,60.7 L204.0,67.7 L206.0,84.5 L208.0,105.2 L210.0,123.0 L212.0,132.5 L214.0,131.3 L216.0,120.6 L218.0,104.3 L220.0,88.0 L222.0,76.8 L224.0,73.7 L226.0,79.0 L228.0,90.1 L230.0,103.2 L232.0,113.9 L234.0,119.2 L236.0,118.1 L238.0,111.6 L240.0,102.4 L242.0,93.6 L244.0,87.9 L246.0,86.6 L248.0,89.5 L250.0,95.2 L252.0,101.5 L254.0,106.4 L256.0,108.7 L258.0,108.0 L260.0,105.0 L262.0,101.0 L264.0,97.4 L266.0,95.1 L268.0,94.8 L270.0,96.0 L272.0,98.2 L274.0,100.6 L276.0,102.3 L278.0,103.0 L280.0,102.7 L282.0,101.6 L284.0,100.3 L286.0,99.2 L288.0,98.5 L290.0,98.4 L292.0,98.8 L294.0,99.5 L296.0,100.2 L298.0,100.6 L300.0,100.8 L302.0,100.7 L304.0,100.4 L306.0,100.1 L308.0,99.8 L310.0,99.7 L312.0,99.6 L314.0,99.7 L316.0,99.9 L318.0,100.0 L320.0,100.1 L322.0,100.2 L324.0,100.1 L326.0,100.1 L328.0,100.0 L330.0,100.0 L332.0,99.9 L334.0,99.9 L336.0,100.0 L338.0,100.0 L340.0,100.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="40" font-size="12" fill="#b4232c" text-anchor="middle">package (group): slower than light</text>
  <text x="180" y="165" font-size="12" fill="#1d6fd1" text-anchor="middle">crests (phase): faster than light</text>
</svg>
```

No information travels faster than light, because information rides on the package. The code a receiver times is the package, so it is delayed. The carrier phase, which the carrier-phase lesson later in this module uses for centimeter positioning, is the crests, so it is advanced — by exactly the same amount. That equal and opposite pair becomes a useful tool there.
:::

::: context solar-cycle The Sun's eleven-year heartbeat
The Sun's activity rises and falls on a cycle of about eleven years. At **solar maximum** there are many sunspots, more ultraviolet light and more solar storms, so the ionosphere holds far more electrons. At solar minimum it is much calmer.

GNSS engineers plan around the cycle. A receiver or an ionosphere model tested only near solar minimum can be caught out a few years later. The peak of Solar Cycle 25 arrived around 2024–2025, with some of the strongest geomagnetic storms in two decades.
:::

::: context pierce-point Where the signal crosses the shell
The ionosphere is squeezed into a thin shell $350\,\mathrm{km}$ up (drawn much thicker here). A signal arriving at elevation $\mathrm{el}$ crosses it at the pierce point, meeting the shell at a zenith angle $z'$ measured from the vertical *there*.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="340" r="195" fill="none" stroke="#f2b880" stroke-width="10"/>
  <circle cx="180" cy="340" r="150" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="190" x2="250" y2="190" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="190" x2="311" y2="128.9" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="180" cy="190" r="5" fill="#1f2a44"/>
  <circle cx="249.2" cy="157.7" r="5" fill="#1f2a44"/>
  <line x1="249.2" y1="157.7" x2="267" y2="111" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="222" y="186" font-size="12" fill="#b4232c">el</text>
  <text x="264" y="136" font-size="12" fill="#1f2a44">z′</text>
  <text x="180" y="210" font-size="12" fill="#1f2a44" text-anchor="middle">receiver</text>
  <text x="240" y="150" font-size="12" fill="#1f2a44" text-anchor="end">pierce point</text>
  <text x="40" y="165" font-size="12" fill="#1f2a44">ionosphere shell</text>
  <text x="300" y="120" font-size="12" fill="#b4232c">to satellite</text>
</svg>
```

Because the shell sits above the ground, $z'$ is always a little smaller than the zenith angle at the receiver. Here the elevation is $25^\circ$, so the zenith angle at the ground is $65^\circ$, but at the (exaggerated) shell it is only about $44^\circ$.
:::

::: context klobuchar Eight numbers for the whole sky
The model is named for John Klobuchar of the U.S. Air Force Geophysics Laboratory, who published it in 1987. It was designed to be computed by the simple processors of early GPS receivers and to fit in a few bits of the navigation message — and it is still broadcast by GPS today.

One detail differs from this lesson. The official algorithm uses its own quick polynomial for the obliquity factor, $F = 1 + 16(0.53 - E)^3$, with the elevation $E$ in half-circles. At $60^\circ$ it gives $1.12$, close to the thin-shell $1.136$ used here. Galileo broadcasts a different, more detailed model called NeQuick.
:::

::: context equatorial-anomaly Two bright bands around the world
You might expect the most electrons directly under the noon Sun, over the equator. Instead there are two ridges, about $15^\circ$ north and south of the *magnetic* equator, with a dip in between. Electric fields in the ionosphere push plasma upward over the magnetic equator, and it then slides down along Earth's magnetic field lines to either side — like water from a fountain landing in a ring.

These ridges hold some of the highest TEC on Earth. A launch site near the equator, such as Kourou in French Guiana, works under them.
:::

::: context hectopascal The weather map's pressure unit
A **hectopascal** is $100$ pascals, and it is the same as the older **millibar**. Standard air pressure at sea level is $1013.25\,\mathrm{hPa}$, and weather maps are drawn in this unit. A strong hurricane might have $920\,\mathrm{hPa}$ at its center; a winter high might reach $1040\,\mathrm{hPa}$.

Because the hydrostatic delay is proportional to pressure, that whole weather range moves it by only $-9\%$ to $+3\%$ — about $21\,\mathrm{cm}$ less to $6\,\mathrm{cm}$ more at Cape Canaveral. A barometer reading takes care of it.
:::

::: context random-walk A state that wanders slowly
A **random walk** is a quantity that takes a small random step each moment, with no pull back to any fixed value. Humidity along a signal path behaves roughly like that over minutes to hours. So a precise receiver's Kalman filter adds the zenith wet delay as one more unknown, tells the filter it may drift by a few millimeters per root-hour, and lets the pseudoranges from many satellites at different elevations pin it down.

The same idea — estimate what you cannot model — returns for satellite clocks and carrier-phase ambiguities later in this module.
:::

::: context mapping Why low satellites cost so much more in the air
How many times longer the slanted path is than the straight-up path, against elevation. The troposphere (red, $1/\sin\mathrm{el}$) keeps climbing as the satellite sinks toward the horizon. The ionosphere's thin shell (blue) levels off near $3$, because it is so high up that even a horizontal ray crosses it at a slant.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="185" x2="345" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="185" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="40" y1="130" x2="340" y2="130"/><line x1="40" y1="75" x2="340" y2="75"/><line x1="40" y1="20" x2="340" y2="20"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="189">0</text><text x="34" y="134">4</text><text x="34" y="79">8</text><text x="34" y="24">12</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="200">0°</text><text x="140" y="200">30°</text><text x="240" y="200">60°</text><text x="340" y="200">90°</text>
  </g>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="56.7,27.2 60.0,53.5 63.3,72.2 66.7,86.2 70.0,97.1 73.3,105.8 80.0,118.9 86.7,128.2 96.7,138.0 106.7,144.8 123.3,152.5 140.0,157.5 173.3,163.6 206.7,167.1 240.0,169.1 273.3,170.4 306.7,171.0 340.0,171.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,141.8 56.7,143.2 73.3,146.6 90.0,150.8 106.7,154.7 140.0,160.9 173.3,165.0 206.7,167.7 240.0,169.4 273.3,170.5 306.7,171.1 340.0,171.2"/>
  <text x="80" y="40" font-size="12" fill="#b4232c">troposphere</text>
  <text x="150" y="146" font-size="12" fill="#1d6fd1">ionosphere</text>
  <text x="192" y="214" font-size="11" fill="#1f2a44" text-anchor="middle">elevation</text>
</svg>
```

At $5^\circ$ the troposphere factor is about $11.5$ and the ionosphere factor about $3.0$. Both curves reach $1$ straight overhead.
:::
