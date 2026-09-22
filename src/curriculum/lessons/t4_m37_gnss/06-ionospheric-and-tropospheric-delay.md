---
id: l06-ionospheric-and-tropospheric-delay
title: Ionospheric and tropospheric delay
minutes: 24
covers:
  - Ionospheric and tropospheric delay, their models, and the dual-frequency ionosphere-free combination
---

The pseudorange lesson put two numbers into the error budget without justifying either: an ionosphere that costs $2$ to $30\,\mathrm{m}$ on L1, and a troposphere that costs $2.3\,\mathrm{m}$ at the zenith and far more near the horizon. Both are the same underlying fact — the signal does not travel through vacuum for the last few hundred kilometres of its path — but they behave so differently that they need two separate treatments and, as this lesson shows, only one of them can be removed by using a second frequency.

The distinction is worth getting exactly right, because it decides how a receiver is engineered. A single-frequency receiver has no choice but to model the ionosphere and hope; a dual-frequency one can measure its way out of the ionosphere entirely, at a real cost in noise this lesson derives rather than asserts. Neither buys anything against the troposphere, which every receiver, however many frequencies it carries, must model. By the end of this lesson you will be able to compute both delays from first principles, not just quote their sizes.

## The ionosphere: a dispersive plasma

Above about $50\,\mathrm{km}$, solar radiation ionises enough of the atmosphere that it contains a significant density of free electrons — the ionosphere, peaking in electron density around $300$ to $400\,\mathrm{km}$ altitude. A radio wave passing through a plasma of electron number density $N_e$ (electrons per cubic metre) has its phase velocity altered because the free electrons oscillate in the wave's electric field and re-radiate, slightly out of phase with the driving wave. Solving the electron's equation of motion under the wave field (charge $e$, mass $m_e$, no collisions, no magnetic field — the first-order treatment) gives a plasma frequency $f_p$ with $f_p^2 = N_e e^2/(4\pi^2\varepsilon_0 m_e)$, and for GPS frequencies, thousands of times above $f_p$, the refractive index is

$$
n \approx 1 - \frac{f_p^2}{2 f^2} = 1 - \frac{N_e e^2}{8\pi^2\varepsilon_0 m_e f^2}.
$$

Phase and group velocity differ in a dispersive medium — the code (group velocity) is delayed by exactly the amount the carrier (phase velocity) is advanced — and integrating $(n-1)$ along the path with a sign flip for the group case gives the delay in terms of the **total electron content**, $\mathrm{TEC} = \int N_e\,ds$, electrons per square metre along the ray:

$$
I = \frac{e^2}{8\pi^2\varepsilon_0 m_e}\cdot\frac{\mathrm{TEC}}{f^2} \equiv \frac{40.3\,\mathrm{TEC}}{f^2}.
$$

Substituting the physical constants — $e = 1.602\times10^{-19}\,\mathrm{C}$, $m_e = 9.109\times10^{-31}\,\mathrm{kg}$, $\varepsilon_0 = 8.854\times10^{-12}\,\mathrm{F/m}$ — gives $e^2/(8\pi^2\varepsilon_0 m_e) = 40.308$, confirming the constant the pseudorange lesson used without deriving. TEC is conventionally measured in **TEC units**, $1\,\mathrm{TECU} = 10^{16}\,\mathrm{el/m^2}$, for which $1\,\mathrm{TECU}$ on L1 is $40.3\times10^{16}/(1575.42\times10^6)^2 = 0.162\,\mathrm{m}$ — the conversion the pseudorange lesson also quoted. Vertical TEC runs from a few units at night to over a hundred on a sunlit, solar-maximum afternoon near the geomagnetic equator, which is why the ionosphere is the largest single term in a single-frequency budget.

The delay is **dispersive** — it depends on $f$ — because it comes from the free electrons' resonant response, which scales as $1/f^2$ at frequencies well above $f_p$; it is not, notably, a property of the geometry or the receiver, only of the plasma and the frequency. That single fact drives everything else in this lesson.

## Obliquity: the slant path through a thin shell

$\mathrm{TEC}$ is usually mapped as a **vertical** quantity — the column density looking straight up — because that is what varies smoothly with geomagnetic latitude and local time and is what a model can practically represent. A satellite is rarely at the zenith, so the delay actually experienced is the vertical value scaled up by an obliquity factor. Model the ionosphere as a thin shell at height $h_{\mathrm{ion}}$ (conventionally $350\,\mathrm{km}$) and let the signal cross it at a zenith angle $z'$ measured *at the shell*, related to the ground elevation angle $\mathrm{el}$ by

$$
\sin z' = \frac{R_E}{R_E + h_{\mathrm{ion}}}\cos(\mathrm{el}),
$$

a direct consequence of the sine rule in the triangle formed by the Earth's centre, the ground station and the pierce point. The obliquity (mapping) factor is $F(\mathrm{el}) = 1/\cos z' = \big[1 - (R_E/(R_E+h_{\mathrm{ion}}))^2\cos^2(\mathrm{el})\big]^{-1/2}$, and slant delay is $I_{\mathrm{slant}} = F(\mathrm{el})\times I_{\mathrm{vertical}}$. At $\mathrm{el}=60^\circ$ with $R_E=6378\,\mathrm{km}$ and $h_{\mathrm{ion}}=350\,\mathrm{km}$,

$$
F(60^\circ) = \left[1 - \left(\frac{6378}{6728}\right)^2\cos^2 60^\circ\right]^{-1/2} = 1.136,
$$

reproducing the obliquity factor the pseudorange lesson used to turn $30\,\mathrm{TECU}$ vertical into $5.53\,\mathrm{m}$ slant on L1. At $\mathrm{el}=10^\circ$, $F=2.90$; at $\mathrm{el}=5^\circ$, $F=3.62$: the ionosphere, like the troposphere below, punishes a low elevation mask.

## The Klobuchar model: what a single frequency can do

A single-frequency receiver cannot measure TEC directly, so it applies a model broadcast in the navigation message: eight coefficients, $\alpha_0$–$\alpha_3$ and $\beta_0$–$\beta_3$, updated by the control segment and good for one day. The model represents the ionosphere as a half-cosine pulse of delay centred at $14{:}00$ local time at the signal's ionospheric pierce point, sitting on a constant night-time floor of $5\,\mathrm{ns}$:

$$
T_{\mathrm{iono}} = F(\mathrm{el})\times\begin{cases} 5\,\mathrm{ns} + \mathrm{AMP}\left(1 - \dfrac{x^2}{2} + \dfrac{x^4}{24}\right), & |x| < 1.57 \\ 5\,\mathrm{ns}, & \text{otherwise} \end{cases}, \qquad x = \frac{2\pi(t - 50400)}{\mathrm{PER}},
$$

with $t$ the local time in seconds and the amplitude and period each a cubic in the geomagnetic latitude $\phi_m$ (in semicircles, $\pm1$ over $\pm180^\circ$) of the pierce point:

$$
\mathrm{AMP} = \max\!\left(\sum_{n=0}^{3}\alpha_n\phi_m^n,\ 0\right), \qquad \mathrm{PER} = \max\!\left(\sum_{n=0}^{3}\beta_n\phi_m^n,\ 72{,}000\,\mathrm{s}\right).
$$

The cosine truncated to a fourth-order Taylor series (the $1-x^2/2+x^4/24$ term) is a cheap way to evaluate an approximate cosine without a trigonometric function call, a small mercy to 1980s receiver hardware that the algorithm has carried ever since.

::: example An afternoon peak against a pre-dawn floor
Take representative coefficients of the size actually broadcast, $\alpha = (3.82,\ 1.49,\ -17.9,\ 0)\times10^{-8}\,\mathrm{s}$ and $\beta = (1.43,\ 0,\ -3.28,\ 1.13)\times10^{5}\,\mathrm{s}$, a geomagnetic latitude of $\phi_m = 0.30$ semicircles ($54^\circ$, representative of a mid-latitude site), and the $F=1.136$ obliquity worked out above.

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

A factor of six between mid-afternoon and the small hours, from a model that never looked at an actual electron measurement — only the date (through the broadcast coefficients) and the time of day.
:::

The model is honest about what it is: a smooth fit, with eight numbers, to a global average of a phenomenon that is neither smooth nor globally uniform. It typically removes only about half of the true ionospheric delay's variance, which is exactly why the pseudorange lesson's single-frequency budget carried a $4.0\,\mathrm{m}$ residual after applying it. What the model cannot see is day-to-day variability in solar activity, geomagnetic storms that inject delay far above the quiet-time curve, the equatorial anomaly's twin crests of enhanced TEC either side of the magnetic equator, and travelling ionospheric disturbances — all real structure with no room in a cubic polynomial of latitude and a single cosine of local time. A single-frequency receiver has no way to do better without another measurement of the same ionosphere at a different frequency, which is exactly what the next section provides.

## Removing it outright: the ionosphere-free combination

Write the code pseudoranges on two frequencies, corrected for everything except the ionosphere:

$$
\rho_1 = R + I_1 + \varepsilon_1, \qquad \rho_2 = R + I_2 + \varepsilon_2,
$$

with $R$ the common (frequency-independent) geometric-plus-clock range and $I_1, I_2$ the ionospheric delays on each frequency, related by the dispersive scaling just derived: $I_2 = I_1\,(f_1/f_2)^2$. Look for a linear combination $\rho_{\mathrm{IF}} = c_1\rho_1 + c_2\rho_2$ that reproduces $R$ exactly. Two conditions pin down $c_1$ and $c_2$: the combination must leave $R$ unscaled, $c_1+c_2=1$, and it must cancel the ionosphere, $c_1 I_1 + c_2 I_2 = 0$. Substituting $I_2 = I_1(f_1/f_2)^2$ into the second condition gives $c_1 = -c_2(f_1/f_2)^2$; combining with the first,

$$
c_2\left(1 - \frac{f_1^2}{f_2^2}\right) = 1 \implies c_2 = \frac{-f_2^2}{f_1^2-f_2^2}, \qquad c_1 = 1-c_2 = \frac{f_1^2}{f_1^2-f_2^2},
$$

so that

$$
\rho_{\mathrm{IF}} = \frac{f_1^2\rho_1 - f_2^2\rho_2}{f_1^2 - f_2^2},
$$

exactly the closed form the pseudorange lesson's error-budget table used without derivation. For L1 and L2, $f_1=1575.42\,\mathrm{MHz}$, $f_2=1227.60\,\mathrm{MHz}$: $c_1 = 2.546$, $c_2=-1.546$.

::: example Exact cancellation, then the noise it costs
Take a true range $R=21{,}000{,}000\,\mathrm{m}$ and $40\,\mathrm{TECU}$ vertical TEC at $\mathrm{el}=60^\circ$ ($F=1.136$, slant $\mathrm{TEC}=45.4\,\mathrm{TECU}$):

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

$I_1=7.38\,\mathrm{m}$, $I_2=12.15\,\mathrm{m}$ — larger on the lower frequency, as the $1/f^2$ scaling demands — and $\rho_{\mathrm{IF}}$ recovers $R$ to nine decimal places, the residue pure floating-point arithmetic rather than anything physical. Now add independent code noise of $\sigma=0.3\,\mathrm{m}$ to each frequency and propagate it: $\mathrm{Var}(\rho_{\mathrm{IF}}) = c_1^2\sigma^2 + c_2^2\sigma^2$, since the two measurements' noise is independent, so

$$
\sigma_{\mathrm{IF}} = \sqrt{c_1^2+c_2^2}\ \sigma = \sqrt{2.546^2+1.546^2}\times0.3 = 2.978\times0.3 = 0.893\,\mathrm{m}.
$$

A Monte Carlo run of $200{,}000$ draws with this noise gives a sample standard deviation of $0.896\,\mathrm{m}$, matching the closed form. Both $|c_1|$ and $|c_2|$ exceed $1$, so both frequencies' noise is amplified rather than averaged down — this is the "roughly tripling" the pseudorange lesson's budget already charged for the ionosphere-free column.
:::

The amplification is smaller for a pair of frequencies further apart: repeating the same algebra for L1 and L5 ($f_5=1176.45\,\mathrm{MHz}$) gives $c_1=2.261$, $c_5=-1.261$, and $\sqrt{c_1^2+c_5^2}=2.588$ — noticeably better than L1/L2's $2.978$, because a wider frequency spread needs less leverage on each measurement to isolate the $1/f^2$ term. This is one reason a modernised triple-frequency receiver prefers the widest available pair for its ionosphere-free combination.

::: key
Ionosphere-free combination: $\rho_{\mathrm{IF}} = (f_1^2\rho_1 - f_2^2\rho_2)/(f_1^2-f_2^2)$, cancelling the $1/f^2$ ionospheric term exactly. For L1/L2, coefficients $2.546$ and $-1.546$ amplify independent code noise by $\sqrt{c_1^2+c_2^2}=2.978\approx3\times$; a wider frequency separation (L1/L5) amplifies less ($2.588\times$).
:::

## The troposphere: not dispersive, must be modelled

The neutral atmosphere below the ionosphere — the troposphere and stratosphere together, conventionally just called "the troposphere" in GNSS — also slows the signal, but for a completely different reason: refraction by neutral gas molecules and water vapour, not by free electrons. At radio frequencies this refractivity does not depend on frequency, so $I_1 = I_2$ and the ionosphere-free combination's whole trick — subtracting two measurements that disagree because of a $1/f^2$ term — has nothing to work with. **Dual-frequency operation does nothing for the troposphere.** It must be modelled, exactly as the single-frequency ionosphere is, but there is no cheap alternative to modelling available to any receiver, however many frequencies it carries.

The Saastamoinen model splits the zenith delay into a **hydrostatic** (dry) part, from the bulk of the atmosphere's mass and accurately predictable from surface pressure alone, and a **wet** part, from water vapour, poorly correlated with any single surface measurement because water vapour is patchy and does not follow a simple scale height. The hydrostatic zenith delay is

$$
\mathrm{ZHD} = \frac{0.0022768\,P}{1 - 0.00266\cos(2\phi) - 0.00028\,h},
$$

with $P$ the surface pressure in hectopascals, $\phi$ the latitude, and $h$ the station height in kilometres — the small denominator terms are corrections for the variation of surface gravity with latitude and altitude. At Cape Canaveral's latitude ($28.56^\circ$), sea level, standard pressure $1013.25\,\mathrm{hPa}$:

$$
\mathrm{ZHD} = \frac{0.0022768 \times 1013.25}{1 - 0.00266\cos(57.12^\circ) - 0} = 2.310\,\mathrm{m},
$$

reproducing the pseudorange lesson's figure exactly. The wet zenith delay is smaller and far more variable, driven by the surface water vapour partial pressure $e$ (hPa) and temperature $T$ (kelvin):

$$
\mathrm{ZWD} \approx 0.002277\left(\frac{1255}{T} + 0.05\right)e.
$$

::: example How much the weather changes the wet delay
Using the Magnus formula for saturation vapour pressure, $e_s(T_c) = 6.1094\exp(17.625\,T_c/(T_c+243.04))\,\mathrm{hPa}$ ($T_c$ in Celsius) and $e = (\mathrm{RH}/100)\,e_s$:

| Conditions | $e\,(\mathrm{hPa})$ | ZWD |
| --- | --- | --- |
| Cape Canaveral, $26^\circ\mathrm{C}$, $70\%$ RH | $23.5$ | $0.227\,\mathrm{m}$ |
| Hot, humid tropical, $35^\circ\mathrm{C}$, $90\%$ RH | $50.6$ | $0.475\,\mathrm{m}$ |
| Cold and dry, $0^\circ\mathrm{C}$, $40\%$ RH | $2.4$ | $0.026\,\mathrm{m}$ |

A factor of eighteen between the cold-dry and hot-humid cases, against a hydrostatic delay that moves only a few percent with weather. This is why the hydrostatic delay is corrected from a surface pressure reading and trusted to a centimetre or two, while the wet delay is either modelled crudely (accepting several centimetres of error) or, in precise applications, carried as an unknown to be estimated from the data itself — a random-walk zenith wet delay state alongside position in the navigation filter, the same kind of state the Kalman filtering module's process model would describe, and precisely what a precise-point-positioning solution does, taken up when the module reaches differential and precise techniques.
:::

Both parts are mapped from zenith to the actual line of sight the same way the pseudorange lesson did — dividing by $\sin(\mathrm{el})$ as a first approximation — but this simple mapping overestimates badly below about $15^\circ$: at $\mathrm{el}=60^\circ$ the Cape Canaveral total maps to $2.93\,\mathrm{m}$, matching the pseudorange lesson's figure, but at $5^\circ$ the crude cosecant mapping gives $29\,\mathrm{m}$, higher than the "up to $25\,\mathrm{m}$" the pseudorange lesson quoted, because a real ray bends slightly as it crosses layers of varying density and $1/\sin(\mathrm{el})$ assumes it does not. Operational systems use mapping functions — Niell's and Marini's are the standard names — built from continued fractions fitted to ray-traced atmospheric profiles, accurate well below $10^\circ$ where the simple form is not.

::: key
Ionospheric delay $I=40.3\,\mathrm{TEC}/f^2$, dispersive; removed by dual-frequency or modelled (Klobuchar, single-frequency, roughly half the true delay). Tropospheric delay is not dispersive — dual-frequency does not help — and is split into hydrostatic (Saastamoinen, from surface pressure, $\approx2.3\,\mathrm{m}$ zenith, stable) and wet (from humidity, a few centimetres to half a metre, poorly predicted and often estimated as a filter state). Both are mapped from zenith with $1/\sin(\mathrm{el})$ as a first approximation, refined by Niell- or Marini-type mapping functions at low elevation.
:::

::: warning
Dual-frequency operation is not "remove the atmosphere" — it is "remove the ionosphere." The troposphere is exactly as large a problem for a dual-frequency receiver as for a single-frequency one, because its delay does not depend on frequency at all; nothing about combining two frequencies gives you a second, independent equation for it. A receiver that trusts its ionosphere-free combination to also fix a bad tropospheric model, or that skips the tropospheric correction because it is "dual-frequency anyway," is carrying an uncorrected error of metres.
:::

## Check yourself

::: check
Why is the ionospheric delay dispersive (frequency-dependent) while the tropospheric delay is not, in terms of what each medium is made of?
:::

::: answer
The ionosphere is a plasma of free electrons, and a free electron's response to an oscillating electric field is resonant in a way that scales as $1/f^2$ well above the plasma frequency — the delay comes directly from that frequency-dependent response. The troposphere is neutral gas and water vapour; at GNSS frequencies its refractivity comes from the polarisability of bound molecules, which does not depend on frequency across the L-band range, so the delay it produces is the same on every carrier.
:::

::: check
Vertical TEC is $60\,\mathrm{TECU}$ and the satellite is at $\mathrm{el}=30^\circ$ ($F=1.288$ for a $350\,\mathrm{km}$ shell — you may take this as given). What is the slant ionospheric delay on L1?
:::

::: answer
Slant TEC $= 60 \times 1.288 = 77.3\,\mathrm{TECU}$. $I = 40.3 \times (77.3\times10^{16})/(1575.42\times10^6)^2 = 12.6\,\mathrm{m}$ — large, but well within the "$2$ to $30\,\mathrm{m}$" range the pseudorange lesson quoted, consistent with high (but not extreme) TEC at a moderate elevation.
:::

::: check
Derive the ionosphere-free combination coefficients for L1 and L5 ($f_1=1575.42\,\mathrm{MHz}$, $f_5=1176.45\,\mathrm{MHz}$), and say whether the noise amplification is better or worse than L1/L2's.
:::

::: answer
$c_1 = f_1^2/(f_1^2-f_5^2) = 2.261$, $c_5 = -f_5^2/(f_1^2-f_5^2) = -1.261$, summing to $1$ as required. Noise amplification is $\sqrt{c_1^2+c_5^2} = 2.588$, better (smaller) than L1/L2's $2.978$, because L1 and L5 are further apart in frequency than L1 and L2, so isolating the $1/f^2$ term needs less leverage on either measurement.
:::

::: check
Compute the Saastamoinen zenith hydrostatic delay for a station at $1000\,\mathrm{hPa}$ surface pressure, $45^\circ$ latitude, $1\,\mathrm{km}$ elevation.
:::

::: answer
$\mathrm{ZHD} = 0.0022768\times1000/(1 - 0.00266\cos90^\circ - 0.00028\times1) = 2.2768/(1-0-0.00028) = 2.277\,\mathrm{m}$. The height term barely moves the answer at $1\,\mathrm{km}$; it matters far more at aircraft or launch-vehicle altitudes, where the atmosphere above the receiver — and hence the delay — is smaller.
:::

::: check
The Klobuchar model is broadcast fresh every day and still leaves roughly half the true ionospheric delay uncorrected. What kind of ionospheric behaviour does an eight-coefficient model of this form fundamentally have no way to represent?
:::

::: answer
Anything that is not a smooth function of geomagnetic latitude and local time repeated identically every day at that latitude. That excludes day-to-day variability driven by solar activity, sudden enhancements from geomagnetic storms, the equatorial anomaly's twin crests of TEC either side of the magnetic equator (a spatial structure no cubic-in-latitude curve can reproduce), and travelling ionospheric disturbances. The model is, by construction, a climatology — an average day — not a forecast of the actual one.
:::

## Summary

| Item | Statement |
| --- | --- |
| Ionospheric delay | $I = 40.3\,\mathrm{TEC}/f^2$ (TEC in $\mathrm{el/m^2}$, $f$ in Hz); $1\,\mathrm{TECU}=10^{16}\,\mathrm{el/m^2}=0.162\,\mathrm{m}$ on L1 |
| Obliquity factor | $F(\mathrm{el}) = [1-(R_E/(R_E+h_{\mathrm{ion}}))^2\cos^2(\mathrm{el})]^{-1/2}$; $1.136$ at $60^\circ$, $2.90$ at $10^\circ$ (350 km shell) |
| Klobuchar model | Half-cosine pulse peaking $14{:}00$ local, $5\,\mathrm{ns}$ night floor; AMP, PER cubic in geomagnetic latitude from 8 broadcast coefficients; removes roughly half the true delay |
| Ionosphere-free combination | $\rho_{\mathrm{IF}} = (f_1^2\rho_1-f_2^2\rho_2)/(f_1^2-f_2^2)$; L1/L2 coefficients $2.546,\,-1.546$; noise amplified $\times2.978$ |
| Troposphere | Not dispersive — dual-frequency does not help; hydrostatic (Saastamoinen, from surface pressure, stable, $\approx2.3\,\mathrm{m}$ zenith) plus wet (from humidity, $0.03$–$0.5\,\mathrm{m}$, often estimated as a filter state) |
| Saastamoinen ZHD | $0.0022768\,P/(1-0.00266\cos2\phi-0.00028h)$ |
| Saastamoinen ZWD | $0.002277(1255/T+0.05)\,e$ |
| Mapping | $1/\sin(\mathrm{el})$ as a first approximation; Niell/Marini functions needed below about $10^\circ$ |

The atmosphere is now accounted for down to the last term the pseudorange lesson's table left unexplained. What remains — multipath, the ephemeris the satellite broadcasts about its own position, and the satellite clock's residual error after the broadcast polynomial — is not physics the receiver can model away at all, and is the subject of the next lesson.
