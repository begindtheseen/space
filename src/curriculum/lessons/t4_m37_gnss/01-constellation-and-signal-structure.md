---
id: l01-constellation-and-signal-structure
title: The constellation and the signal
minutes: 22
covers:
  - "GNSS constellation and signal structure: L1/L2/L5, C/A and P(Y) codes, CDMA, the navigation message"
---

Lightning flashes. You count one, two, three — then thunder. Sound covers about $343$ meters a second, so the storm is about a kilometer away. You turned a *delay* into a *distance*.

Satellite navigation does the same with radio waves and far better clocks. Each satellite keeps announcing "this piece of my signal left me at exactly this time". Your receiver hears it a little late, compares the stamp with its own clock, and multiplies the delay by the speed of light. That is a distance. Several distances to several satellites give a position.

The general name is **GNSS**, global navigation satellite system; GPS is the American one. A GNSS receiver is really a clock-reading instrument, and everything in this module — the pseudorange, the four-unknown fix, dilution of precision, carrier phase, the tracking loops that hold lock on a launch vehicle — rests on the structure of the signal it reads.

That signal has three layers, like a radio show:

- The **carrier** is the station: a pure radio wave at one fixed frequency in the **L-band** ($1$ to $2\,\mathrm{GHz}$).
- The **ranging code** is a rhythm you know by heart, laid on the wave. Lining up your copy with the one you hear gives the timing, like a ruler with marks a few hundred meters apart.
- The **navigation message** is slow speech on top of the rhythm: where the satellite is, what its clock is doing, and what time it is.

The receiver locks to the carrier to hold the signal, lines up the code to measure the time of sending, and decodes the message to learn where the sender was.

## The constellation

A **constellation** here is the whole fleet. GPS is the reference design.

The baseline has $24$ slots in six orbital planes, four per plane, each plane tilted $55^\circ$ to the equator. About $31$ working satellites fly at any time, filling extra slots. The orbits are nearly circular, with **semi-major axis** (for a circle, the radius) $a \approx 26{,}560\,\mathrm{km}$. Earth's equatorial radius in the WGS-84 model is $R_E = 6{,}378\,\mathrm{km}$, so the satellites fly about $20{,}180\,\mathrm{km}$ up.

Two numbers follow from $a$ and Earth's gravity constant $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (read "mu"). The orbital speed is $\sqrt{\mu/a} = 3{,}874\,\mathrm{m/s}$. The period, the time for one lap, is

$$
T = 2\pi\sqrt{\frac{a^3}{\mu}} = 43{,}078\,\mathrm{s} = 11.97\,\mathrm{h}.
$$

That is within four seconds of half a **[[sidereal day|sidereal-day]]**, one spin of Earth measured against the stars ($86{,}164\,\mathrm{s}/2 = 43{,}082\,\mathrm{s}$). The altitude was chosen for this match. Each satellite makes two laps while Earth turns once, so its ground track repeats daily, about four minutes earlier each day. The sky a launch site sees at a given time today, it sees again tomorrow. Because the satellites circle twice as fast as Earth turns, they drift eastward across the sky, and a pass lasts about five hours from horizon to horizon.

Seen *from* a satellite, Earth fills a cone of half-angle $\arcsin(R_E/a) = 13.9^\circ$ around the **[[straight-down direction|earth-cone]]**, called **nadir**. That angle limits how far a signal path can tilt from nadir and still reach the ground, it is why errors along the orbit barely change a range, and it is what a spacecraft *above* the constellation must work around.

The distance to a satellite runs from $20{,}180\,\mathrm{km}$ overhead to $\sqrt{a^2 - R_E^2} = 25{,}780\,\mathrm{km}$ on the horizon, so the signal's trip takes $67.3$ to $86.0\,\mathrm{ms}$. During the trip the satellite moves about $300\,\mathrm{m}$, and Earth turns through about $5\,\mathrm{\mu rad}$ (millionths of a radian) — about $150\,\mathrm{m}$ at the satellite's distance. Both come back in the navigation solution.

::: key
GPS: 24 baseline slots in six planes at $55^\circ$, $a \approx 26{,}560\,\mathrm{km}$ (altitude about $20{,}200\,\mathrm{km}$), speed $3.87\,\mathrm{km/s}$, period $11\,\mathrm{h}\,58\,\mathrm{min}$ — half a sidereal day, so the sky repeats daily. Range $20{,}200$ to $25{,}800\,\mathrm{km}$, transit time $67$ to $86\,\mathrm{ms}$. The Earth subtends $\pm 13.9^\circ$ from the satellite.
:::

## The carriers: L1, L2, L5

A guitar's strings are tuned to notes that fit together. GPS frequencies fit together too: each is a whole-number multiple of a base frequency $f_0 = 10.23\,\mathrm{MHz}$ (read "f nought"), made by the satellite's atomic clock.

| Carrier | Multiple | Frequency | Wavelength |
| --- | --- | --- | --- |
| L1 | $154 f_0$ | $1575.42\,\mathrm{MHz}$ | $19.03\,\mathrm{cm}$ |
| L2 | $120 f_0$ | $1227.60\,\mathrm{MHz}$ | $24.42\,\mathrm{cm}$ |
| L5 | $115 f_0$ | $1176.45\,\mathrm{MHz}$ | $25.48\,\mathrm{cm}$ |

The **wavelength**, the length of one wave, is $\lambda = c/f$ (read "lambda"), with $c = 299{,}792{,}458\,\mathrm{m/s}$ the speed of light, exactly. The $19\,\mathrm{cm}$ L1 wavelength becomes the unit of carrier-phase measurement later in the module.

The ratio between carriers matters too. The **ionosphere**, a layer of electrically charged gas high above us, delays each carrier in proportion to $1/f^2$. The ratio $(f_1/f_2)^2 = (154/120)^2 = 1.647$ is known exactly, and the dual-frequency correction uses it to cancel that delay.

L-band is a compromise: lower frequencies suffer more ionospheric delay and need bigger antennas; higher ones are weakened more by rain, leaves, rocket plumes and reentry plasma. L5 sits in a protected aviation band and carries a ten-times-faster code, so aviation and launch-vehicle receivers want it.

## The ranging codes: C/A and P(Y)

Picture a drum pattern that never seems to repeat: *boom, tap, tap, boom, boom, tap…* If you know it by heart, you can hear a recording and say exactly how far into the pattern it is. That is the ranging code.

The satellite writes a **pseudorandom** code on the carrier: a string of 1s and 0s that looks random but is fixed and known to every receiver. Each 1 or 0 is a **[[chip|chip-word]]**. The writing method is **[[binary phase-shift keying|bpsk]]** (BPSK): a 1 flips the wave upside down (a $180^\circ$ phase shift), and a 0 leaves it alone. The receiver makes its own copy of the code and slides it in time until it lines up with the arriving one. How far it slid is the measurement.

The **coarse/acquisition code**, or **C/A code**, lives on L1. It runs at $1.023\,\mathrm{Mcps}$ (million chips per second), a tenth of $f_0$, and is $1023$ chips long, so it repeats every $1\,\mathrm{ms}$. One chip lasts $1/1.023\,\mathrm{\mu s} = 977.5\,\mathrm{ns}$, and in that time light travels

$$
\frac{c}{1.023 \times 10^6\,\mathrm{s^{-1}}} = 293.1\,\mathrm{m}.
$$

That is the **chip length**: the ruler has marks every $293\,\mathrm{m}$, usually quoted as $300\,\mathrm{m}$. Lining up the code to one percent of a chip measures the range to $3\,\mathrm{m}$. Because the code repeats every millisecond, it gives the sending time only **[[modulo|modulo]]** $1\,\mathrm{ms}$ — up to an unknown whole number of milliseconds, or $300\,\mathrm{km}$ of range. The navigation message settles that.

The **precision code, P(Y)**, runs ten times faster, at $10.23\,\mathrm{Mcps}$. Its chip is $29.3\,\mathrm{m}$, and it repeats only once a week — about $6.19 \times 10^{12}$ chips, a different one-week piece for each satellite. It is sent on both L1 and L2. Since 1994 it has been scrambled by an extra secret code, the **[["Y"|y-code]]** in P(Y), so only keyed military receivers can use it. The newer civil signals, L2C, L5 and L1C, give everyone an open code on every carrier. On L1, C/A and P(Y) ride on two parts of the carrier a quarter-wave apart ("in quadrature"), P(Y) $3\,\mathrm{dB}$ weaker, half the power.

Faster chips buy precision: a faster code has a sharper **[[correlation peak|correlation-peak]]**, the spike you get when the copy lines up. A sharper spike gives a smaller timing error at the same signal strength, and smaller errors from echoes. L5 chips at $10.23\,\mathrm{Mcps}$ with a code $10{,}230$ chips long, still repeating every millisecond; its chip is a tenth of a C/A chip, and it copes with echoes that much better.

::: key
L1 at $1575.42\,\mathrm{MHz}$ ($154 \times 10.23\,\mathrm{MHz}$), L2 at $1227.60\,\mathrm{MHz}$, L5 at $1176.45\,\mathrm{MHz}$. The C/A code chips at $1.023\,\mathrm{Mcps}$, is $1023$ chips long, repeats every $1\,\mathrm{ms}$, and one chip is $293\,\mathrm{m}$ (about $300\,\mathrm{m}$) of range. P(Y) chips at $10.23\,\mathrm{Mcps}$ ($29.3\,\mathrm{m}$) and repeats weekly.
:::

## CDMA: thirty satellites, one frequency

Picture a party where each pair of friends speaks a different language: you follow yours and hear the rest as a murmur. That is how GPS satellites share a frequency.

They all send on the same L1 frequency at the same time, and the receiver hears the sum. They are kept apart by **code-division multiple access** (CDMA): each satellite has its own C/A code. A receiver matching against satellite 7's code sees satellite 7 at full strength and every other satellite as a small, limited leftover.

The C/A codes are **Gold codes**, each made by combining two ten-stage **[[shift registers|shift-register]]**. The first, G1, is the same for every satellite. The second, G2, is read out at two stages chosen per satellite. The two outputs are combined by **exclusive-or** (XOR: the result is 1 when exactly one input is 1). Match one Gold code against another, or against itself shifted, and you only ever get three values. For length $1023$ they are $-65$, $-1$ and $+63$, against a perfect-match peak of $1023$. The worst case is $20\log_{10}(65/1023) = -23.9\,\mathrm{dB}$ below the peak. (A **[[decibel|decibel]]**, dB, is a ratio on a log scale.) Here is the generator with the matching test:

```python
import numpy as np

G2_TAPS = {1: (2, 6), 2: (3, 7), 3: (4, 8), 4: (5, 9), 5: (1, 9), 6: (2, 10)}


def ca_code(prn):
    """The 1023-chip GPS C/A Gold code for one satellite, as 0/1 chips."""
    g1 = np.ones(10, int)
    g2 = np.ones(10, int)
    t1, t2 = G2_TAPS[prn]
    chips = np.zeros(1023, int)
    for i in range(1023):
        chips[i] = g1[9] ^ g2[t1 - 1] ^ g2[t2 - 1]
        f1 = g1[2] ^ g1[9]
        f2 = g2[1] ^ g2[2] ^ g2[5] ^ g2[7] ^ g2[8] ^ g2[9]
        g1 = np.roll(g1, 1)
        g1[0] = f1
        g2 = np.roll(g2, 1)
        g2[0] = f2
    return chips


s1 = 1 - 2 * ca_code(1).astype(float)   # 0/1 chips -> +1/-1 symbols
s2 = 1 - 2 * ca_code(2).astype(float)
auto = [s1 @ np.roll(s1, k) for k in range(1, 1023)]
cross = [s1 @ np.roll(s2, k) for k in range(1023)]
print(oct(int("".join(map(str, ca_code(1)[:10])), 2)))   # 0o1440
print(sorted({int(v) for v in auto}), sorted({int(v) for v in cross}))
# [-65, -1, 63] [-65, -1, 63]
```

Each satellite has a number, its **PRN** (pseudorandom noise number). The first ten chips of PRN 1 come out as octal $1440$, the value in the official interface specification, and the match values are exactly the three the theory promises. Matching over one full code lifts the wanted signal above noise and the other satellites by the **despreading gain**, $10\log_{10}(1023) = 30.1\,\mathrm{dB}$.

CDMA has a cost. A floor $24\,\mathrm{dB}$ down is harmless when all satellites arrive about equally strong, as they do on the ground, within a few decibels. It is a hazard when one signal is $20$ or $30\,\mathrm{dB}$ stronger than another: the strong satellite's leftover can beat the weak one's true peak, and the receiver locks onto a phantom. On the ground that is rare. For a spacecraft above the constellation, listening to weak edge beams, it is routine; the space-based lesson takes it up. [[Other systems|other-gnss]] — Galileo, GLONASS, BeiDou — work on the same principles, and a modern receiver tracks them all.

## The signal is below the noise

The official guarantee is a minimum C/A power of $-158.5\,\mathrm{dBW}$ at the ground, for a standard $3\,\mathrm{dBi}$ antenna (dBW means decibels compared with one watt). That is $1.4 \times 10^{-16}\,\mathrm{W}$.

Every receiver also hears **thermal noise**, the hiss of warm electronics. At a standard $290\,\mathrm{K}$ its strength per hertz of bandwidth is $N_0 = k_B T = 1.38 \times 10^{-23} \times 290 = 4.0 \times 10^{-21}\,\mathrm{W/Hz}$, or $-204.0\,\mathrm{dBW/Hz}$, where $k_B$ is Boltzmann's constant. Receiver engineers work in the **carrier-to-noise-density ratio** $C/N_0$ (read "C over N nought"):

$$
\frac{C}{N_0} = -158.5 - (-204.0) = 45.5\,\mathrm{dB\text{-}Hz}.
$$

The C/A signal is spread over about $2\,\mathrm{MHz}$ (its main hump spans $\pm 1.023\,\mathrm{MHz}$). The noise in that width is $-204.0 + 10\log_{10}(2.046 \times 10^6) = -140.9\,\mathrm{dBW}$. So the signal enters the receiver $17.6\,\mathrm{dB}$ *below* the noise, about fifty-eight times weaker. Nothing in the raw samples looks like a signal.

Matching against the code over $1\,\mathrm{ms}$ squeezes the noise bandwidth to $1\,\mathrm{kHz}$. The signal-to-noise ratio after matching is $45.5 - 30 = 15.5\,\mathrm{dB}$; over a full $20\,\mathrm{ms}$ data bit it is $28.5\,\mathrm{dB}$. Tracking-loop figures are all written in $C/N_0$; remember $45\,\mathrm{dB\text{-}Hz}$ as the comfortable open-sky value.

::: example Checking the link budget from the satellite end
A **link budget** adds up the gains and losses from transmitter to receiver. A Block IIR satellite (one generation of GPS satellite) radiates about $27\,\mathrm{W}$ of L1 C/A power through an antenna with about $13\,\mathrm{dBi}$ of gain toward Earth's edge.

**Power sent.** $10\log_{10}(27) = 14.3\,\mathrm{dBW}$. Add the antenna gain: $14.3 + 13 = 27.3\,\mathrm{dBW}$, the **effective isotropic radiated power**.

**Spreading loss.** The signal thins out over a growing sphere. Over a slant range $d = 25{,}000\,\mathrm{km}$ at $\lambda = 0.1903\,\mathrm{m}$, the **free-space path loss** is

$$
L = 20\log_{10}\frac{4\pi d}{\lambda} = 20\log_{10}\frac{4\pi \times 2.5 \times 10^{7}}{0.1903} = 184.4\,\mathrm{dB}.
$$

**Power received.** An antenna with no gain receives $27.3 - 184.4 = -157.1\,\mathrm{dBW}$. A decibel or two lost in the air and to polarization bring it to the $-158.5\,\mathrm{dBW}$ specification. It matches.

**Sanity check.** $184\,\mathrm{dB}$ means the signal loses eighteen powers of ten on the way down; about a tenth of a femtowatt arrives. A one-watt jammer a few kilometers away, or a spacecraft hearing the satellite from three times as far, shifts that budget by tens of decibels — which is why both get lessons of their own.
:::

## The navigation message

On top of the code, at $50$ bits per second, rides the **navigation message**. Each bit lasts $20\,\mathrm{ms}$ — twenty code repeats, $20{,}460$ chips — and flips the sign of the code for that time. Once the code is lined up, the receiver reads each bit from the sign of its match.

The original message (LNAV) is laid out like a book. A **frame** is $1500$ bits, lasting $30\,\mathrm{s}$, made of five **subframes** of $300$ bits, $6\,\mathrm{s}$ each. Every subframe opens with two words that make the system work as a clock:

- the **telemetry word** (TLM), starting with the fixed eight-bit **preamble** $10001011$ that the receiver hunts for to find where subframes begin;
- the **handover word** (HOW), carrying the **time of week** — GPS time, in $6\,\mathrm{s}$ steps, at which the *next* subframe begins — plus the subframe number and flags.

The rest carries the content:

| Subframe | Content | Refreshed |
| --- | --- | --- |
| 1 | GPS week number, satellite health, clock correction polynomial ($a_{f0}, a_{f1}, a_{f2}$, reference time $t_{oc}$), group delay $T_{GD}$ | every frame |
| 2, 3 | Ephemeris: fifteen orbit parameters ($\sqrt{A}$, $e$, $i_0$, $\Omega_0$, $\omega$, $M_0$, $\Delta n$, $\dot\Omega$, $\dot i$ and six harmonic corrections) plus reference time $t_{oe}$ | every frame |
| 4, 5 | Almanac for all satellites, ionospheric (Klobuchar) coefficients, UTC offset and leap seconds, health summaries | one page per frame; 25 frames for the full set |

The **[[ephemeris|ephemeris-word]]** is a curve fitted to the satellite's predicted orbit, good for about four hours around $t_{oe}$ and normally replaced every two hours. The **almanac** is a rough, long-lasting version for every satellite, used to plan which ones to search for.

A receiver switched on with no memory needs $25 \times 30\,\mathrm{s} = 12.5\,\mathrm{min}$ to collect all 25 almanac pages. The clock and ephemeris of a satellite already being tracked arrive within $30\,\mathrm{s}$, or $18\,\mathrm{s}$ if you catch subframe 1 as it starts. With an almanac, a rough position and a rough time, the receiver knows which satellites are up and roughly their frequency shifts, so finding them takes seconds instead of minutes.

## Reading the transmit time off the signal

Now the three layers come together. Locked to a satellite, the receiver knows, for the sample in front of it:

1. which subframe it is in and its time of week, from the HOW — steps of $6\,\mathrm{s}$;
2. how many bits into the subframe — steps of $20\,\mathrm{ms}$;
3. how many code repeats into the bit — steps of $1\,\mathrm{ms}$;
4. how many chips into the code — steps of $977\,\mathrm{ns}$, about $293\,\mathrm{m}$;
5. the fraction of a chip, from fine alignment of its code copy — a few nanoseconds, a meter or so.

Like reading a clock's hands plus a stopwatch, adding the pieces gives the **time of transmission** by the satellite's clock, to a nanosecond: a counter $20{,}000\,\mathrm{km}$ away, read to ten digits from a signal buried in noise. The receiver also notes the **time of reception** by its own clock. The difference, times $c$, is the pseudorange; why that is not quite the true range is the next lesson.

::: example From chip count to transmit time
A receiver's channel for PRN 14 reports, at one moment: HOW time of week $302{,}406\,\mathrm{s}$; $17$ complete bits since the subframe began; $8$ complete code repeats in the current bit; $611$ complete chips in the current code; and a fine code phase of $0.376$ chip.

Convert each piece to seconds and add. Bits are $20\,\mathrm{ms}$, code repeats $1\,\mathrm{ms}$, and chips are divided by the chip rate:

$$
t_{tx} = 302{,}406 + 17 \times 0.020 + 8 \times 0.001 + \frac{611.376}{1.023 \times 10^6} = 302{,}406.348\,597\,6\,\mathrm{s}.
$$

The chip part is $611.376 \times 977.5\,\mathrm{ns} = 597.63\,\mathrm{\mu s}$.

If the receiver's clock read $302{,}406.421\,\mathrm{s}$ at that moment, the apparent travel time is $72.402\,\mathrm{ms}$. Times $c$, that is about $21{,}706\,\mathrm{km}$.

**Sanity check.** That sits between the $20{,}180$ and $25{,}780\,\mathrm{km}$ limits — plausible for a satellite near $60^\circ$ elevation, though the number also contains the receiver's clock error. The fine code phase is what the code tracking loop measures; one percent of a chip is $2.9\,\mathrm{m}$.
:::

::: warning
Lining up the code alone gives the transmit time modulo $1\,\mathrm{ms}$ — a $300\,\mathrm{km}$ ambiguity. Receivers that start before decoding the handover word assume every travel time lies between $67$ and $86\,\mathrm{ms}$ and pick the millisecond that fits. A wrong pick puts one satellite's range off by exactly $299.79\,\mathrm{km}$. A spacecraft receiver, whose travel times fall outside that window, cannot use the ground assumption: it must decode the message or be told the time.
:::

## Doppler, and where it comes from

An ambulance siren sounds higher coming toward you and lower going away. That is the **[[Doppler shift|doppler]]**. The GPS carrier shifts the same way, by the **range rate** $\dot\rho$ (read "rho dot"), how fast the distance is changing:

$$
f_d = -\frac{\dot\rho}{\lambda}.
$$

The minus sign says a shrinking range raises the frequency.

For a user standing still, the range changes fastest with the satellite on the horizon. There the line of sight makes $90^\circ - 13.9^\circ = 76.1^\circ$ with the satellite's velocity, so

$$
|\dot\rho|_{\max} = 3{,}874\,\mathrm{m/s} \times \cos 76.1^\circ = 930\,\mathrm{m/s}, \qquad |f_d|_{\max} = \frac{930}{0.1903} = 4.9\,\mathrm{kHz}.
$$

Earth's spin carries a user on the equator at $465\,\mathrm{m/s}$, which reduces that in most geometries; the usual design window for a receiver at rest is $\pm 5\,\mathrm{kHz}$. The Doppler *rate* is gentle, under $1\,\mathrm{Hz/s}$. A launch vehicle's own speed adds tens of kilohertz and a far faster Doppler rate; that is a later lesson.

The code shifts too, by the same fraction. The C/A chip rate is $1575.42/1.023 = 1540$ times lower than the carrier, so $4\,\mathrm{kHz}$ of carrier Doppler is $2.6\,\mathrm{chips/s}$ of code Doppler. The tracking-loop lesson uses this to let the carrier loop steer the code loop.

## Check yourself

::: check
A receiver measures the fine code phase of a C/A signal to $0.005$ chip. What range precision is that? How much better would the same fraction of a chip be on L5?
:::

::: answer
One C/A chip is $c/1.023\,\mathrm{Mcps} = 293.1\,\mathrm{m}$, so $0.005 \times 293.1 = 1.47\,\mathrm{m}$. An L5 chip is ten times shorter, $29.3\,\mathrm{m}$, so the same fraction is $0.15\,\mathrm{m}$. Faster chips give a sharper peak and a finer ruler. That, not the carrier frequency, is why L5 ranges more precisely than L1 C/A at the same signal-to-noise ratio.
:::

::: check
Why does matching against a satellite's code for one millisecond lift it out of the noise, and by how much? What is the signal-to-noise ratio after matching for a signal at $C/N_0 = 38\,\mathrm{dB\text{-}Hz}$?
:::

::: answer
The code spreads the signal over about $2\,\mathrm{MHz}$, where it sits $17.6\,\mathrm{dB}$ below the noise. Multiplying by a lined-up copy removes the code and packs the signal back into a width of about $1/T$, where $T$ is the matching time, while the noise stays spread. Over one code the gain is $10\log_{10}(1023) = 30.1\,\mathrm{dB}$.

Equivalently, the ratio after matching is $C/N_0$ times $T$. With $T = 1\,\mathrm{ms}$, which is $-30\,\mathrm{dB}$ in seconds, it is $38 - 30 = 8\,\mathrm{dB}$: thin but trackable. Over a $20\,\mathrm{ms}$ bit it is $21\,\mathrm{dB}$.
:::

::: check
A receiver has lined up the code and is counting chips but has not decoded the handover word. What does it know about the transmit time, and how do ground receivers get away with it?
:::

::: answer
It knows the transmit time modulo $1\,\mathrm{ms}$, so the range modulo $299.79\,\mathrm{km}$. A ground receiver assumes the travel time lies between $67$ and $86\,\mathrm{ms}$. Once its clock is roughly set, that $19\,\mathrm{ms}$ window holds exactly one consistent millisecond. Decoding the handover word gives the time of week directly and removes the assumption — which a receiver in orbit, whose travel times fall outside the window, needs.
:::

::: check
Two satellites arrive at a receiver at $C/N_0$ of $48$ and $22\,\mathrm{dB\text{-}Hz}$. Is there a risk in acquiring the weaker one? What property of the codes decides it?
:::

::: answer
Yes. The Gold codes' cross-match is limited to $23.9\,\mathrm{dB}$ below the true peak. The strong satellite, matched against the weak one's code, makes a false peak at $48 - 23.9 = 24.1\,\mathrm{dB\text{-}Hz}$ equivalent — above the weak satellite's true peak at $22\,\mathrm{dB\text{-}Hz}$. The receiver can lock onto the leftover and report a range that belongs to the wrong satellite. A spacecraft on side lobes meets this routinely and must check each candidate against the expected Doppler.
:::

::: check
State the L1 carrier frequency and wavelength, the C/A chip rate, code length, repeat period and chip length, and the L2 and L5 frequencies.
:::

::: answer
L1 is $1575.42\,\mathrm{MHz}$ ($154 \times 10.23\,\mathrm{MHz}$), wavelength $19.03\,\mathrm{cm}$. The C/A code chips at $1.023\,\mathrm{Mcps}$, is $1023$ chips long, repeats every $1\,\mathrm{ms}$, and a chip is $293\,\mathrm{m}$ of range, about $300\,\mathrm{m}$. L2 is $1227.60\,\mathrm{MHz}$ ($120 f_0$) and L5 is $1176.45\,\mathrm{MHz}$ ($115 f_0$).
:::

## Summary

| Item | Value or statement |
| --- | --- |
| GPS orbit | $a \approx 26{,}560\,\mathrm{km}$, altitude $\approx 20{,}200\,\mathrm{km}$, $55^\circ$, six planes, period $11\,\mathrm{h}\,58\,\mathrm{min}$ = half a sidereal day, speed $3.87\,\mathrm{km/s}$ |
| Geometry from the satellite | Earth subtends $\pm 13.9^\circ$; range $20{,}200$–$25{,}800\,\mathrm{km}$; transit $67$–$86\,\mathrm{ms}$ |
| Carriers | L1 $= 154 f_0 = 1575.42\,\mathrm{MHz}$ ($\lambda = 19.03\,\mathrm{cm}$); L2 $= 120 f_0 = 1227.60\,\mathrm{MHz}$; L5 $= 115 f_0 = 1176.45\,\mathrm{MHz}$; $f_0 = 10.23\,\mathrm{MHz}$ |
| C/A code | $1.023\,\mathrm{Mcps}$, $1023$ chips, $1\,\mathrm{ms}$ period, chip $= 293\,\mathrm{m}$; Gold code, cross-correlation $\le -23.9\,\mathrm{dB}$ |
| P(Y) code | $10.23\,\mathrm{Mcps}$, chip $= 29.3\,\mathrm{m}$, one-week period, encrypted; L5 chips at the same rate, $1\,\mathrm{ms}$ period |
| CDMA | Shared frequency, separated by codes; despreading gain $30.1\,\mathrm{dB}$; near–far hazard beyond $\sim 24\,\mathrm{dB}$ power difference |
| Link | Received C/A $\ge -158.5\,\mathrm{dBW}$; $N_0 = -204\,\mathrm{dBW/Hz}$; $C/N_0 \approx 45\,\mathrm{dB\text{-}Hz}$; $17.6\,\mathrm{dB}$ below the noise before correlation |
| Navigation message | $50\,\mathrm{bps}$; subframe $6\,\mathrm{s}$, frame $30\,\mathrm{s}$; TLM preamble, HOW time of week; subframe 1 clock, 2–3 ephemeris, 4–5 almanac and ionosphere; full almanac $12.5\,\mathrm{min}$ |
| Transmit time | HOW $+$ bits $\times 20\,\mathrm{ms}$ $+$ code periods $\times 1\,\mathrm{ms}$ $+$ chips $\times 977.5\,\mathrm{ns}$ $+$ fractional chip |
| Doppler | $f_d = -\dot\rho/\lambda$; static user $\le 930\,\mathrm{m/s}$, $\pm 4.9\,\mathrm{kHz}$ on L1; code Doppler $= $ carrier Doppler$/1540$ |

Next: subtract this transmit time from the receiver's own clock reading, and find out why the result — the pseudorange — misses the true range by tens of meters.

::: context sidereal-day Why a day is not one spin
A **solar day**, noon to noon, is $24$ hours. But in that time Earth has also moved about one degree along its orbit around the Sun, so it must turn a little more than once to bring the Sun back overhead. One spin measured against the far-away stars — the **sidereal day** — is shorter: about $23\,\mathrm{h}\,56\,\mathrm{min}\,4\,\mathrm{s}$, or $86{,}164\,\mathrm{s}$. GPS satellites lap twice per sidereal day, which is why their pattern in your sky comes back about four minutes earlier each solar day.
:::

::: context earth-cone How big Earth looks from GPS orbit
From $26{,}560\,\mathrm{km}$ out, Earth is a ball of radius $6{,}378\,\mathrm{km}$. The lines from the satellite that just graze its edge make an angle $\alpha$ with the straight-down line, where $\sin\alpha = R_E/a = 0.240$, so $\alpha = 13.9^\circ$. A satellite antenna only needs to cover this narrow cone to light up the whole visible Earth. Signal sent wider than that misses Earth and heads out into space — which is exactly what a spacecraft above the constellation listens to.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="164" r="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="14" x2="215" y2="155.4" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="14" x2="145" y2="155.4" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="14" x2="180" y2="164" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="164" x2="215" y2="155.4" stroke="#1f2a44" stroke-width="1"/>
  <path d="M 180 54 A 40 40 0 0 0 189.6 52.8" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="173" y="8" width="14" height="12" fill="#1f2a44"/>
  <text x="196" y="18" font-size="12" fill="#1f2a44">GPS satellite</text>
  <text x="196" y="66" font-size="12" fill="#b4232c">13.9°</text>
  <text x="222" y="152" font-size="11" fill="#1f2a44">edge: line grazes Earth</text>
  <text x="140" y="203" font-size="12" fill="#1f2a44">Earth, R = 6378 km</text>
  <text x="120" y="100" font-size="11" fill="#6c7a93" text-anchor="end">a = 26 560 km</text>
</svg>
```
:::

::: context chip-word Chips, not bits
Why "chip" and not "bit"? A **bit** carries information — a piece of the navigation message. A **chip** carries none. It is one tick of a fixed pattern everyone already knows, used only to spread the signal and to time it. Keeping the two words apart stops you mixing up the $50$ bits per second of message with the $1.023$ million chips per second of code: there are $20{,}460$ chips in every bit.
:::

::: context bpsk Flipping the wave
Binary phase-shift keying writes bits onto a wave by turning it upside down. For a chip of 0 the wave carries on as it was. For a chip of 1 it is flipped: every crest becomes a trough. In the drawing each chip holds two waves; on the real L1 signal each C/A chip holds $1540$ of them. A receiver that multiplies by the same pattern of flips undoes them, and a clean wave is left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1" stroke-dasharray="3 3">
    <line x1="80" y1="40" x2="80" y2="145"/><line x1="130" y1="40" x2="130" y2="145"/><line x1="180" y1="40" x2="180" y2="145"/>
    <line x1="230" y1="40" x2="230" y2="145"/><line x1="280" y1="40" x2="280" y2="145"/>
  </g>
  <g font-size="14" fill="#1f2a44" text-anchor="middle" font-weight="700">
    <text x="55" y="34">1</text><text x="105" y="34">0</text><text x="155" y="34">0</text>
    <text x="205" y="34">1</text><text x="255" y="34">1</text><text x="305" y="34">0</text>
  </g>
  <text x="180" y="16" font-size="12" fill="#6c7a93" text-anchor="middle">chips</text>
  <line x1="30" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="30,132.0 31,131.3 32,129.3 33,126.0 34,121.8 35,116.8 36,111.4 37,105.9 38,100.6 39,96.0 40,92.2 41,89.5 42,88.2 43,88.2 44,89.5 45,92.2 46,96.0 47,100.6 48,105.9 49,111.4 50,116.8 51,121.8 52,126.0 53,129.3 54,131.3 55,132.0 56,131.3 57,129.3 58,126.0 59,121.8 60,116.8 61,111.4 62,105.9 63,100.6 64,96.0 65,92.2 66,89.5 67,88.2 68,88.2 69,89.5 70,92.2 71,96.0 72,100.6 73,105.9 74,111.4 75,116.8 76,121.8 77,126.0 78,129.3 79,131.3 80,132.0 80,88.0 81,88.7 82,90.7 83,94.0 84,98.2 85,103.2 86,108.6 87,114.1 88,119.4 89,124.0 90,127.8 91,130.5 92,131.8 93,131.8 94,130.5 95,127.8 96,124.0 97,119.4 98,114.1 99,108.6 100,103.2 101,98.2 102,94.0 103,90.7 104,88.7 105,88.0 106,88.7 107,90.7 108,94.0 109,98.2 110,103.2 111,108.6 112,114.1 113,119.4 114,124.0 115,127.8 116,130.5 117,131.8 118,131.8 119,130.5 120,127.8 121,124.0 122,119.4 123,114.1 124,108.6 125,103.2 126,98.2 127,94.0 128,90.7 129,88.7 130,88.0 131,88.7 132,90.7 133,94.0 134,98.2 135,103.2 136,108.6 137,114.1 138,119.4 139,124.0 140,127.8 141,130.5 142,131.8 143,131.8 144,130.5 145,127.8 146,124.0 147,119.4 148,114.1 149,108.6 150,103.2 151,98.2 152,94.0 153,90.7 154,88.7 155,88.0 156,88.7 157,90.7 158,94.0 159,98.2 160,103.2 161,108.6 162,114.1 163,119.4 164,124.0 165,127.8 166,130.5 167,131.8 168,131.8 169,130.5 170,127.8 171,124.0 172,119.4 173,114.1 174,108.6 175,103.2 176,98.2 177,94.0 178,90.7 179,88.7 180,88.0 180,132.0 181,131.3 182,129.3 183,126.0 184,121.8 185,116.8 186,111.4 187,105.9 188,100.6 189,96.0 190,92.2 191,89.5 192,88.2 193,88.2 194,89.5 195,92.2 196,96.0 197,100.6 198,105.9 199,111.4 200,116.8 201,121.8 202,126.0 203,129.3 204,131.3 205,132.0 206,131.3 207,129.3 208,126.0 209,121.8 210,116.8 211,111.4 212,105.9 213,100.6 214,96.0 215,92.2 216,89.5 217,88.2 218,88.2 219,89.5 220,92.2 221,96.0 222,100.6 223,105.9 224,111.4 225,116.8 226,121.8 227,126.0 228,129.3 229,131.3 230,132.0 231,131.3 232,129.3 233,126.0 234,121.8 235,116.8 236,111.4 237,105.9 238,100.6 239,96.0 240,92.2 241,89.5 242,88.2 243,88.2 244,89.5 245,92.2 246,96.0 247,100.6 248,105.9 249,111.4 250,116.8 251,121.8 252,126.0 253,129.3 254,131.3 255,132.0 256,131.3 257,129.3 258,126.0 259,121.8 260,116.8 261,111.4 262,105.9 263,100.6 264,96.0 265,92.2 266,89.5 267,88.2 268,88.2 269,89.5 270,92.2 271,96.0 272,100.6 273,105.9 274,111.4 275,116.8 276,121.8 277,126.0 278,129.3 279,131.3 280,132.0 280,88.0 281,88.7 282,90.7 283,94.0 284,98.2 285,103.2 286,108.6 287,114.1 288,119.4 289,124.0 290,127.8 291,130.5 292,131.8 293,131.8 294,130.5 295,127.8 296,124.0 297,119.4 298,114.1 299,108.6 300,103.2 301,98.2 302,94.0 303,90.7 304,88.7 305,88.0 306,88.7 307,90.7 308,94.0 309,98.2 310,103.2 311,108.6 312,114.1 313,119.4 314,124.0 315,127.8 316,130.5 317,131.8 318,131.8 319,130.5 320,127.8 321,124.0 322,119.4 323,114.1 324,108.6 325,103.2 326,98.2 327,94.0 328,90.7 329,88.7 330,88.0"/>
  <text x="180" y="158" font-size="11" fill="#b4232c" text-anchor="middle">the wave jumps where the chip value changes</text>
</svg>
```
:::

::: context modulo Modulo, like a clock face
"Modulo" means "counting round and round and forgetting the full laps". A clock face shows time modulo $12$ hours: it says $3$ o'clock but not which day, or even morning or afternoon. The C/A code is a clock face that goes round once a millisecond. Lining it up tells you where the hand is, not how many laps it has made. The navigation message supplies the lap count.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="90" r="60" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="180" y1="30" x2="180" y2="38"/><line x1="210" y1="38" x2="206" y2="45"/><line x1="232" y1="60" x2="225" y2="64"/>
    <line x1="240" y1="90" x2="232" y2="90"/><line x1="232" y1="120" x2="225" y2="116"/><line x1="210" y1="142" x2="206" y2="135"/>
    <line x1="180" y1="150" x2="180" y2="142"/><line x1="150" y1="142" x2="154" y2="135"/><line x1="128" y1="120" x2="135" y2="116"/>
    <line x1="120" y1="90" x2="128" y2="90"/><line x1="128" y1="60" x2="135" y2="64"/><line x1="150" y1="38" x2="154" y2="45"/>
  </g>
  <line x1="180" y1="90" x2="222" y2="90" stroke="#1d6fd1" stroke-width="4"/>
  <circle cx="180" cy="90" r="4" fill="#1f2a44"/>
  <text x="180" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">12</text>
  <text x="250" y="94" font-size="12" fill="#1f2a44">3</text>
  <text x="180" y="170" font-size="12" fill="#b4232c" text-anchor="middle">which lap? the face cannot say</text>
</svg>
```
:::

::: context y-code Why the P code was locked
The P code was always published, so anyone could build a receiver for it — and anyone could build a transmitter that faked it. To stop an enemy sending false P-code signals (**spoofing**), the United States switched on "anti-spoofing" on 31 January 1994. It mixes the P code with a secret encrypting code, and the result is the Y code. Military receivers hold the key; civil receivers can only use the C/A code and, later, the new open civil signals. Spoofing gets its own lesson near the end of this module.
:::

::: context correlation-peak Why the peak is a triangle
Matching a ±1 code against a shifted copy of itself and averaging gives the **correlation**. Lined up exactly, every chip agrees and the value is $1$. Shifted by half a chip, half of each chip overlaps its twin and the value is about $0.5$. Shifted by a whole chip or more, the chips are unrelated and the value drops almost to zero (for C/A, to $-1/1023$ at most shifts). So the peak is a triangle two chips wide at the base. A faster code has shorter chips and a narrower triangle, whose tip is easier to pin down in noise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="146" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,140 110,140 180,30 250,140 320,140"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="40,140 173,140 180,30 187,140 320,140"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="136" x2="40" y2="144"/><line x1="110" y1="136" x2="110" y2="144"/><line x1="180" y1="136" x2="180" y2="144"/>
    <line x1="250" y1="136" x2="250" y2="144"/><line x1="320" y1="136" x2="320" y2="144"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="158">−2</text><text x="110" y="158">−1</text><text x="180" y="158">0</text><text x="250" y="158">+1</text><text x="320" y="158">+2</text>
    <text x="180" y="175">offset in C/A chips</text>
  </g>
  <text x="188" y="26" font-size="12" fill="#1f2a44">1</text>
  <text x="258" y="80" font-size="12" fill="#1d6fd1">C/A</text>
  <text x="194" y="60" font-size="12" fill="#b4232c">L5 (10× faster)</text>
</svg>
```
:::

::: context shift-register A machine that makes a pattern
A **shift register** is a row of boxes, each holding a 0 or a 1. On every tick, each value moves one box along, the last one falls out as the output, and a new value enters the first box — made by XOR-ing a few chosen boxes together. With ten boxes and the right choice of boxes to combine, the pattern runs through $2^{10} - 1 = 1023$ steps before repeating: every possible filling except all zeros. That is why the C/A code is $1023$ chips long. The hardware is tiny, which mattered for satellites built in the 1970s.
:::

::: context decibel Decibels, and dBW, dBi and dB-Hz
A **decibel** turns a power ratio into a small, addable number: $10\log_{10}$ of the ratio. A factor of $10$ is $10\,\mathrm{dB}$, a factor of $2$ is about $3\,\mathrm{dB}$, and a factor of $1000$ is $30\,\mathrm{dB}$. Multiplying ratios becomes adding decibels, which is why link budgets are written this way. A suffix names what the ratio is against: **dBW** is compared with one watt, **dBi** is antenna gain compared with an antenna that sends equally in all directions, and **dB-Hz** is a power per hertz of noise, so it carries a "per hertz" inside it. For signal *amplitudes*, such as the correlation values in the lesson, the formula is $20\log_{10}$, because power goes as amplitude squared.
:::

::: context other-gnss Galileo, GLONASS and BeiDou
**Galileo** (Europe) flies $24$ baseline satellites in three planes at $56^\circ$ and $23{,}222\,\mathrm{km}$ altitude, sending E1 (on L1's center frequency), E5a (on L5's), E5b and E6, all CDMA with longer codes. **GLONASS** (Russia) uses three planes at $64.8^\circ$ and $19{,}100\,\mathrm{km}$, period $11\,\mathrm{h}\,16\,\mathrm{min}$. It kept satellites apart the old radio way, by frequency (**FDMA**): each sends on $1602\,\mathrm{MHz} + k \times 0.5625\,\mathrm{MHz}$, where $k$ is its channel. That avoids the CDMA near–far hazard, at the price of a more complex receiver and channel-by-channel delays inside it; its newer signals are CDMA. **BeiDou** (China) mixes medium orbits with tilted geosynchronous and geostationary satellites. Tracking all four raises the satellites in view from about eight to about thirty, which transforms geometry and integrity checking — as long as the receiver also solves for the small time offsets between the systems' clocks.
:::

::: context ephemeris-word Ephemeris: a table of where things will be
"Ephemeris" comes from the Greek for "daily". Astronomers' ephemerides were books of tables giving where the Moon and planets would be each day. A GPS ephemeris is the same idea compressed into a formula: a short set of orbit numbers from which a receiver computes where the satellite was at any instant in a four-hour window. The control segment on the ground tracks every satellite, predicts its orbit, and uploads fresh ephemerides regularly. The newer message formats (CNAV on L2C and L5, CNAV-2 on L1C) pack the same clock and orbit information more flexibly, with error correction and faster data.
:::

::: context doppler The siren and the satellite
Waves from something moving toward you get squeezed together, so more crests arrive each second and the frequency rises. Moving away, they get stretched and the frequency falls. For radio, the shift is the range rate divided by the wavelength. A satellite on the horizon closing at $930\,\mathrm{m/s}$ pushes each $19\,\mathrm{cm}$ wave in a little early, adding about $4{,}900$ crests per second to the $1{,}575{,}420{,}000$ the satellite sends.
:::
