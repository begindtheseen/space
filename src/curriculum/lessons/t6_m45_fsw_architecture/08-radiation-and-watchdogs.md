---
id: l08-radiation-and-watchdogs
title: Radiation effects and watchdog timers
minutes: 26
covers:
  - "Radiation effects: single-event upsets, latch-up, total ionising dose; EDAC and ECC memory; memory scrubbing"
  - "Watchdog timers: what they catch, what they miss, and why a reset is a real-time decision"
---

Picture a wall of a billion tiny light switches, each one a stored bit: up for 1, down for 0. Now picture someone throwing an invisible grain of sand at the wall every so often. Most miss. Once in a while one hits a switch hard enough to flip it. Nothing is broken — flip the switch back and it works fine — but the wall no longer says what you wrote on it.

That is what space does to a computer. Every fault so far in this module started in a sensor, a bus or a piece of software. This lesson covers a fault that needs none of those to be wrong: the silicon itself, hit by a fast charged particle from the Sun or from deep space. Above the atmosphere those particles are far more common than on the ground. Lesson 5 described modern vehicles that fly **commodity** processors — ordinary commercial chips, like the ones in servers — running Linux. They made a deliberate trade: far more computing power per watt, in exchange for chips that are individually easier to upset.

This lesson puts numbers on that exposure and covers the memory protection built to absorb it. Then it turns to the **watchdog timer**: a mechanism every flight computer has. It catches one narrow class of failure very well, and it is routinely given credit for catching far more than it does.

## Three different things radiation does

Radiation harms electronics in three distinct ways. They need three distinct defenses, so keep them apart.

**Single-event upset (SEU).** One energetic particle passes through a memory cell or a logic gate and leaves behind enough electric charge to flip a stored bit. It is **transient** — the transistor is not damaged, and writing the right value back fully repairs it. It is also random. How easily a device is upset is described by its **[[cross-section|cross-section]]**: in effect, the target area each bit presents to the passing particles, measured by testing the device in a particle beam.

**Single-event latch-up (SEL).** Every standard chip contains, by accident of how it is built, a **[[hidden switch|parasitic-thyristor]]** that a particle can turn on. Once on, it opens a low-resistance path from power to ground and stays open, drawing far more current than normal, until the power is removed. Latch-up does not fix itself. Left alone it can heat the part until it is destroyed. So it needs active detection — a current sensor on the power line — and a definite response: switch that power line off and back on.

**Total ionizing dose (TID).** SEU and SEL are single, sudden events. TID is slow and adds up. Radiation gradually shifts the voltages at which transistors switch and makes them leak more current. Performance degrades over the mission, and past a certain dose the part fails outright. No software response can undo it. The only levers are at design time: shielding, choosing tougher parts, and running them below their limits.

::: key
Radiation effects vocabulary. SEU: a bit flips, corrected by ECC and scrubbing. SEL: latch-up, a parasitic conducting path that needs the power cycled to clear and can destroy the part. TID: total ionising dose, cumulative degradation over the mission life.
:::

::: example A dose budget for a five-year mission
Dose is measured in **[[krad(Si)|krad-si]]** ("kilorad in silicon"). Suppose an environment model predicts $2.0$ krad(Si) per year behind the planned shielding, and the part has been tested to survive $30$ krad(Si).

```python
dose_rate_krad_yr = 2.0   # given: environment model's prediction behind the planned shielding
part_rating_krad = 30.0   # given: the dose the part is tested to survive
for years in [1, 2, 3, 5]:
    total = dose_rate_krad_yr * years
    print(f"{years} yr: {total:4.1f} krad(Si) total, margin = {part_rating_krad / total:4.1f}x")
# 1 yr:  2.0 krad(Si) total, margin = 15.0x
# 2 yr:  4.0 krad(Si) total, margin =  7.5x
# 3 yr:  6.0 krad(Si) total, margin =  5.0x
# 5 yr: 10.0 krad(Si) total, margin =  3.0x
```

The arithmetic is only dose rate times time: $2.0 \times 5 = 10$ krad(Si) after five years. The part is rated to $30$, so the margin is $30 / 10 = 3$. Designers commonly want a margin of at least $2$, so this part passes.

That simplicity is the point. TID is a budget you spend down steadily over the mission and check against the part's tested rating before launch. It is not a surprise event that a monitor watches for in flight.
:::

## How often do bits flip?

The upset rate for one bit is the device's cross-section times the particle **flux** — how many particles cross each square centimeter per day, taken from an environment model:

$$
\text{upsets per bit per day} = \sigma \times \Phi .
$$

Here $\sigma$ (read "sigma") is the cross-section in $\mathrm{cm^2}$ per bit, and $\Phi$ (read "fye") is the flux in particles per $\mathrm{cm^2}$ per day. Square centimeters cancel, leaving upsets per bit per day. Multiply by the number of bits and you have the expected upsets for the whole memory. The numbers below are given inputs for a worked problem, the kind a test report and an environment model would hand a software team. They are not data for a specific real chip. The method is what carries over.

::: example Expected upsets per day, and how they grow with memory size
```python
sigma_bit_cm2 = 2.0e-14     # given: upset cross-section per bit, from radiation testing
flux_cm2_day = 2.0e5        # given: environment model's upset-causing particle flux
rate_per_bit_day = sigma_bit_cm2 * flux_cm2_day

for mbit in [1, 16, 256, 1024, 4096]:
    bits = mbit * 1_000_000
    per_day = rate_per_bit_day * bits
    print(f"{mbit:5d} Mbit: {per_day:8.5f} upsets/day, about one every {24 / per_day:7.2f} hours")
#     1 Mbit:  0.00400 upsets/day, about one every 6000.00 hours
#    16 Mbit:  0.06400 upsets/day, about one every  375.00 hours
#   256 Mbit:  1.02400 upsets/day, about one every   23.44 hours
#  1024 Mbit:  4.09600 upsets/day, about one every    5.86 hours
#  4096 Mbit: 16.38400 upsets/day, about one every    1.46 hours
```

Step one: the rate per bit is $2.0 \times 10^{-14} \times 2.0 \times 10^{5} = 4.0 \times 10^{-9}$ upsets per bit per day. Step two: a 256 Mbit memory has $2.56 \times 10^8$ bits, so it sees $4.0 \times 10^{-9} \times 2.56 \times 10^8 \approx 1.02$ upsets per day — about one a day.

The rate grows in step with memory size. Four times the bits, four times the upsets. A 256 Mbit memory with one upset a day is a background nuisance. A 4 Gbit memory in the same place sees one about every hour and a half, and the protection in the next section has to work much harder to keep up.
:::

## ECC, and why scrubbing exists

**EDAC** (error detection and correction) protects memory by storing a few extra check bits beside every word. The most common scheme is **[[SECDED|secded]]**: single-error correct, double-error detect. When a word is read, the hardware uses the check bits to find and fix one flipped bit automatically. If two bits in the same word have flipped, it can tell something is wrong but cannot fix it. Memory built this way is called **ECC memory** (error-correcting code).

There is a gap, and it is worth naming exactly. The correction happens *when the word is read*. The fixed value goes to the processor, but the flipped bit in memory can stay flipped. A word the software rarely touches can sit there with one bad bit for days. If a second particle hits the *same word* in that time, the two flips together make an uncorrectable **double-bit error**.

**Scrubbing** closes that gap. A background task walks through the whole memory, reading every word and writing the corrected value back. Any single flipped bit is repaired before a second one can join it. How often to scrub is a real design trade, and the answer depends on the radiation environment.

::: example Choosing a scrub interval, in a gentle environment and a harsh one
Take the 256 Mbit memory from before, as 8 million words of 32 bits (counting only the data bits). Upsets arrive at random, so the number landing in one word before the next scrub follows a **[[Poisson distribution|poisson]]** with average $\mu$ (read "mew"). The chance of two or more is $1 - e^{-\mu}(1 + \mu)$.

```python
import math

rate_per_bit_day = 2.0e-14 * 2.0e5     # from the previous example
word_bits = 32
n_words = 256_000_000 // word_bits     # a 256 Mbit memory
lam_word_per_day = rate_per_bit_day * word_bits

def p_two_or_more(mu):
    # Poisson: P(k >= 2) = 1 - e^-mu (1 + mu), written to stay accurate for tiny mu
    return -math.expm1(-mu) - mu * math.exp(-mu)

for label, multiplier in [("nominal", 1.0), ("100x harsher", 100.0)]:
    print(f"-- {label} --")
    for scrub_hours in [24, 168, 720]:
        mu = lam_word_per_day * multiplier * scrub_hours / 24.0   # expected upsets in ONE word
        p_word = p_two_or_more(mu)
        p_any = -math.expm1(n_words * math.log1p(-p_word))         # 1 - (1 - p_word)^n_words
        print(f"  scrub every {scrub_hours:3d} h: P(any uncorrectable word) = {p_any:.3e}")
# -- nominal --
#   scrub every  24 h: P(any uncorrectable word) = 6.554e-08
#   scrub every 168 h: P(any uncorrectable word) = 3.211e-06
#   scrub every 720 h: P(any uncorrectable word) = 5.898e-05
# -- 100x harsher --
#   scrub every  24 h: P(any uncorrectable word) = 6.551e-04
#   scrub every 168 h: P(any uncorrectable word) = 3.160e-02
#   scrub every 720 h: P(any uncorrectable word) = 4.455e-01
```

Check the first line by hand. One word collects $4.0 \times 10^{-9} \times 32 = 1.28 \times 10^{-7}$ upsets per day. For a tiny $\mu$, the chance of two is about $\mu^2 / 2 = 8.2 \times 10^{-15}$. Times 8 million words gives about $6.55 \times 10^{-8}$. That matches.

In the nominal environment, even a monthly (720-hour) scrub keeps the chance of any uncorrectable word below 6 in 100,000. Daily scrubbing is comfortable margin here.

Now make the environment 100 times harsher — inside a **[[radiation belt|radiation-belts]]**, or during a solar storm. The same monthly scrub becomes close to a coin flip, $44.6\%$. Even weekly scrubbing carries a $3.2\%$ risk. Notice the harsh numbers are about $100^2 = 10{,}000$ times worse at first, because a double hit needs two particles. A scrub interval that was generous in one environment is inadequate in the other. It is chosen from the mission's actual exposure, not copied from the last program.
:::

::: key
An SEU is transient and fixed by rewriting; latch-up is a sustained overcurrent that needs detection and a power cycle; TID is a permanent budget spent down over the mission. EDAC corrects a single-bit error when a word is read; scrubbing stops an uncorrected bit from sitting long enough for a second upset to make the word uncorrectable.
:::

## Paying for reliability with architecture

Why not fly only **radiation-hardened** chips — chips designed and built to resist all this? They exist, but they are many times slower and far more expensive than commercial chips of the same era. And hardening lowers the upset rate; it does not make it zero.

Why not wrap the computer in thick metal? **Shielding** helps a lot against total dose and against lower-energy particles. But the fastest particles, the **[[galactic cosmic rays|cosmic-rays]]**, go straight through any practical thickness of aluminum, and every kilogram of shielding is a kilogram of payload you did not fly.

So a vehicle flying commodity processors accepts that upsets *will* happen and handles them at the system level:

- ECC on memory, with background scrubbing;
- several redundant computing strings with voted output, so a string with an upset is simply outvoted (lessons 5 and 6);
- checksums on tables and code images, so a corrupted copy is caught before use;
- watchdogs, for a string that hangs;
- a fast restart path, so an upset string reboots and rejoins the running set quickly;
- current-limited power switches that detect latch-up and cycle the power to clear it.

## Watchdog timers: what they actually check

Think of a lifeguard who tells a swimmer, "Wave at me at least once a minute. If you don't, I'm coming in after you." The lifeguard does not know whether the swimmer is swimming well. Only whether the swimmer is still waving.

A **watchdog timer** is that lifeguard. It is a countdown that the monitored software must reset — engineers say **[[pet or kick|pet-the-dog]]** — before it runs out. If the countdown reaches zero with no pet, the watchdog takes a fixed action, most often forcing the processor to reset. Its question is narrow: *is the task still reaching the line of code where it pets me, on schedule?*

::: example What trips a watchdog, and what does not
```python
class Watchdog:
    def __init__(self, timeout_cycles):
        self.timeout_cycles = timeout_cycles
        self.cycles_since_pet = 0
        self.tripped = False

    def tick(self, pet):
        self.cycles_since_pet = 0 if pet else self.cycles_since_pet + 1
        self.tripped = self.tripped or self.cycles_since_pet >= self.timeout_cycles
        return self.tripped

# Run 1: the task hangs after cycle 2 and never pets again
wd = Watchdog(timeout_cycles=5)
for i, pet in enumerate([True, True, True, False, False, False, False, False]):
    print(f"cycle {i}: pet={pet}, tripped={wd.tick(pet)}")
# cycle 0: pet=True, tripped=False
# cycle 1: pet=True, tripped=False
# cycle 2: pet=True, tripped=False
# cycle 3: pet=False, tripped=False
# cycle 4: pet=False, tripped=False
# cycle 5: pet=False, tripped=False
# cycle 6: pet=False, tripped=False
# cycle 7: pet=False, tripped=True

# Run 2: the task keeps petting, but a bad gain corrupts its answer
wd2, attitude = Watchdog(timeout_cycles=5), 0.0
for i in range(6):
    attitude += 15.0
    print(f"cycle {i}: computed_attitude={attitude:.1f} deg, tripped={wd2.tick(pet=True)}")
# cycle 0: computed_attitude=15.0 deg, tripped=False
# cycle 1: computed_attitude=30.0 deg, tripped=False
# cycle 2: computed_attitude=45.0 deg, tripped=False
# cycle 3: computed_attitude=60.0 deg, tripped=False
# cycle 4: computed_attitude=75.0 deg, tripped=False
# cycle 5: computed_attitude=90.0 deg, tripped=False
```

In run 1 the task stops petting at cycle 3. The missed pets count up — 1, 2, 3, 4 — and on the fifth missed pet, at cycle 7, the watchdog trips. A hang, a **deadlock** (two tasks each waiting forever for the other), a crash and an endless loop all look exactly like this to the watchdog, and it catches every one within its timeout.

In run 2 the task never stops petting. It is alive and on time every cycle. Meanwhile a bad gain drives its computed attitude $15^\circ$ further off each cycle, $6 \times 15 = 90^\circ$ in all. The watchdog never notices, because its one question was never violated.
:::

::: key
What a watchdog catches and misses. Catches: hangs, deadlocks, crashes, unbounded **[[priority inversion|priority-inversion]]** — anything that stops the code reaching the pet point. Misses: everything where the software runs happily and computes wrong answers.
:::

A watchdog answers "is the task alive and on schedule?" That is a real and useful question. It says nothing about whether the answers are right. A diverged navigation filter, a sign-flipped gain, a failed sensor wrongly accepted as healthy — a vehicle with any of these pets its watchdog happily the whole way down. Catching wrong-but-alive failures is the job of lesson 9's residual monitors. A system that treats "the watchdog is quiet" as "the software is healthy" has assumed an answer the watchdog was never built to give.

::: warning
A watchdog and a heartbeat are not the same guarantee. A heartbeat that only says "I ran this cycle" can be sent by a task looping through corrupted logic as easily as by a healthy one. A heartbeat that must report *progress* — a sequence number that keeps climbing, a milestone reached — narrows the gap. But even that only moves "alive" toward "alive and moving forward". It is still not "computing the right answer".
:::

## Why the reset is a real-time decision

The watchdog's usual response, a reset, is not free. The computer goes back through its start-up sequence (lesson 2's `BOOT`), and while it restarts it contributes nothing. Whether that is acceptable depends on what the vehicle is doing at that moment.

::: example What a 3-second restart costs in two phases
Suppose a computer takes $3\,\mathrm{s}$ to restart.

During a quiet coast, the vehicle's attitude drifts at perhaps $0.05^\circ$ per second with no control. In $3\,\mathrm{s}$ that is $0.05 \times 3 = 0.15^\circ$. A backup string, or even no control at all, absorbs that easily.

During a landing burn, the vehicle might be descending at $40\,\mathrm{m/s}$. In $3\,\mathrm{s}$ it drops $40 \times 3 = 120\,\mathrm{m}$ with nobody steering the engine. That can cost far more than the hang the reset was meant to fix.
:::

So a watchdog's response must be designed with the flight phase in mind. Sometimes a plain reset is right. Sometimes the better move is to switch to a hot standby that is already running (lesson 5), with no reboot at all. Sometimes the watchdog should escalate to a higher-level fault manager that knows the phase. And the response itself must happen within a bounded time. The whole value of a watchdog is that it acts within a known, fixed interval after a hang begins. A response that adds unbounded delay throws that guarantee away.

## Check yourself

::: check
A latch-up and an SEU both start with a particle strike. Why doesn't the SEU fix — write the correct value back — work for latch-up?
:::

::: answer
An SEU flips a stored bit without damaging anything, so rewriting the bit repairs it completely. Latch-up is not a wrong stored value at all. It turns on a hidden low-resistance path through the chip's own structure, and current keeps flowing through that path. Rewriting memory does nothing to a current path. The only way to break it is to remove power from that supply line and reapply it — which is why latch-up needs overcurrent detection and a power cycle, not an EDAC correction.
:::

::: check
Using the upset-rate method in this lesson, if a memory grows from 256 Mbit to 1024 Mbit with nothing else changed, by what factor does the expected upset rate change, and why?
:::

::: answer
By a factor of four. The expected rate is a fixed per-bit rate times the number of bits, and the number of bits went up four times ($1024 / 256 = 4$). The worked example shows it: $1.024$ upsets per day becomes $4.096$ upsets per day.
:::

::: check
EDAC already corrects single-bit errors automatically. Without using numbers, explain why scrubbing is still needed.
:::

::: answer
EDAC corrects the value handed to the processor when a word is read, but the flipped bit can stay flipped in memory. A word that is rarely read can sit with one bad bit for a long time. If a second upset lands in that same word first, the two together are more than SECDED can correct (it can still detect them). Scrubbing reads and rewrites every word on a schedule, so no single upset is allowed to sit long enough to be joined by a second.
:::

::: check
After a flight, engineers find the navigation filter was off by several degrees for the last two minutes. The watchdog never tripped. Was the watchdog broken?
:::

::: answer
No. The watchdog did its job: it confirmed the navigation task stayed alive and on schedule, which it evidently did, since it kept petting. A diverged filter that keeps running on time is exactly the kind of failure a watchdog cannot see. It is a failure of content, not of liveness, and only a content check such as a residual monitor (lesson 9) can catch it. The watchdog's silence is correct behavior, not a defect.
:::

::: check
Why is "always reset the processor when the watchdog trips" not a correct policy for every situation?
:::

::: answer
A reset costs time: the computer contributes nothing until it has restarted. Whether that cost is acceptable depends on the flight phase. In a long, quiet coast it is easily absorbed. In a short, critical phase like a landing burn, the same gap can cost more than the original hang, especially if a faster option exists, such as switching to a hot standby that is already running. The response to a trip has to be chosen with the phase in mind, not fixed once for all times.
:::

## Summary

| Term | Meaning |
| --- | --- |
| SEU | A bit flips; transient, fixed by rewriting; handled by ECC and scrubbing |
| SEL (latch-up) | A hidden conducting path turns on; needs overcurrent detection and a power cycle; can destroy the part |
| TID | Cumulative, permanent degradation; a dose budget spent over the mission, checked against the part's rating |
| Upset rate | Cross-section $\times$ flux $\times$ number of bits; grows in step with memory size |
| EDAC / SECDED | Corrects one flipped bit per word on read; detects but cannot correct two |
| Scrubbing | Background read-and-rewrite of all memory, so single upsets never pile up into doubles |
| Commodity processors | Accept upsets; handle them with ECC, scrubbing, voted strings, checksums, watchdogs, fast restart |
| Watchdog timer | Trips if the task fails to pet it in time; catches hangs, deadlocks, crashes, unbounded priority inversion |
| What a watchdog misses | Any failure where the task keeps running and petting while computing wrong answers |
| Watchdog response | Its cost depends on the flight phase; chosen per phase, and bounded in time |

The next lesson builds the mechanism that catches what a watchdog cannot: a residual monitor that asks whether a filter's measurements still fit its own model, with a persistence counter tuned between catching a real fault fast and not crying wolf over ordinary noise.

::: context cross-section A target area for each bit
Imagine each bit as a tiny target on a dartboard, and particles as darts thrown at random over the whole board. The bigger a bit's target, the more often it is hit. The **cross-section** is that effective target area, in square centimeters.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="200" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1d6fd1">
    <rect x="45" y="40" width="14" height="14"/><rect x="95" y="40" width="14" height="14"/><rect x="145" y="40" width="14" height="14"/><rect x="195" y="40" width="14" height="14"/>
    <rect x="45" y="85" width="14" height="14"/><rect x="95" y="85" width="14" height="14"/><rect x="145" y="85" width="14" height="14"/><rect x="195" y="85" width="14" height="14"/>
  </g>
  <rect x="95" y="85" width="14" height="14" fill="#b4232c"/>
  <g fill="#1f2a44">
    <circle cx="70" cy="30" r="2.5"/><circle cx="130" cy="65" r="2.5"/><circle cx="102" cy="92" r="2.5"/><circle cx="180" cy="108" r="2.5"/><circle cx="35" cy="70" r="2.5"/>
  </g>
  <text x="235" y="45" font-size="11" fill="#1d6fd1">blue square: σ per bit</text>
  <text x="235" y="65" font-size="11" fill="#1f2a44">dots: particle hits</text>
  <text x="235" y="85" font-size="11" fill="#b4232c">red: a hit bit flips</text>
</svg>
```

It is measured, not calculated: engineers put the chip in a particle accelerator beam, count upsets, and divide by the number of particles per square centimeter that went through.
:::

::: context parasitic-thyristor The switch nobody meant to build
A standard chip places regions of silicon doped two different ways side by side. By accident, four of these layers stacked in a row form a structure called a **thyristor** — a switch that, once triggered, holds itself on as long as current flows.

A particle strike can dump enough charge to trigger it. Then current pours from the power supply to ground through the chip, far above normal. Turning the power off lets the switch reset. That is why flight power switches watch the current on each line and cut it within milliseconds when it jumps.
:::

::: context krad-si What a rad is
Dose measures energy absorbed per kilogram of material. One **rad** is $0.01$ joules per kilogram; the SI unit, the gray, is $100$ rad. Because different materials absorb differently, engineers say which material: "(Si)" means silicon, the stuff of chips.

So $10$ krad(Si) means silicon has absorbed $10{,}000 \times 0.01 = 100$ joules per kilogram — about $100$ gray. That is a tiny amount of heat, but delivered as ionization it slowly damages transistors. Radiation-hardened parts are commonly rated to $100$ krad(Si) or more; many commercial parts give up somewhere between a few and a few tens of krad(Si).
:::

::: context secded How a few extra bits find the bad one
The trick, invented by Richard Hamming in 1950, is to store check bits that each cover a different overlapping group of data bits. When one bit flips, the pattern of which checks fail spells out the flipped bit's position, like a binary address. One more overall check bit tells a single flip from a double.

It is cheap: $7$ check bits protect a $32$-bit word, and $8$ protect a $64$-bit word. That is why "72-bit wide" memory is standard on servers and flight computers alike.
:::

::: context poisson Counting random events
When events happen at random, independently, at a steady average rate — raindrops on one paving stone, particle hits on one word — the number that arrive in a fixed time follows the **Poisson distribution**. If the average is $\mu$, the chance of exactly $k$ events is $e^{-\mu}\mu^k / k!$.

So the chance of zero is $e^{-\mu}$, of exactly one is $\mu e^{-\mu}$, and of two or more is whatever is left: $1 - e^{-\mu}(1 + \mu)$. For small $\mu$ that is close to $\mu^2/2$, which is why halving the scrub interval cuts the double-hit risk about four times.
:::

::: context radiation-belts Where the harsh places are
Earth's magnetic field traps charged particles in two doughnut-shaped zones, the **Van Allen belts**: an inner one rich in protons and an outer one rich in electrons. Over the South Atlantic the inner belt dips close to Earth, the **South Atlantic Anomaly**, and many low-orbit satellites see most of their upsets while crossing it.

The Sun adds bursts of its own. During a **solar particle event**, proton flux can jump by orders of magnitude for hours or days. The 100-times-harsher case in the scrubbing example is the kind of jump engineers plan for.
:::

::: context cosmic-rays Why shielding cannot stop everything
Galactic cosmic rays are atomic nuclei, from protons up to iron, flung across the galaxy by exploding stars. Many carry billions of electron-volts of energy — far more than the protons of the radiation belts. A few millimeters of aluminum stops most belt electrons and low-energy protons, but a cosmic ray nucleus can pass through many centimeters and still flip a bit on the other side. Heavier shielding also costs mass on every flight, so past a point the cheaper answer is to design for upsets rather than to try to block them.
:::

::: context pet-the-dog Why "pet" and "kick"
The names come from the picture of a guard dog that must be reassured regularly or it attacks. Some teams say "pet", others "kick" or "feed" — same thing: reset the countdown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="110" x2="30" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="185" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">time</text>
  <line x1="30" y1="100" x2="340" y2="100" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="336" y="95" font-size="11" text-anchor="end" fill="#b4232c">zero: reset!</text>
  <polyline points="30,30 70,50 70,30 110,50 110,30 150,50 150,30 290,100" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="95" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">pets refill the countdown</text>
  <text x="200" y="55" font-size="11" fill="#1f2a44">task hangs: no pets</text>
</svg>
```

A good watchdog runs on its own hardware with its own clock, so a processor that has frozen, or whose clock has stopped, cannot also freeze the thing watching it.
:::

::: context priority-inversion The bug a watchdog found on Mars
**Priority inversion** is when a high-priority task is stuck waiting for a lock held by a low-priority task, while medium-priority tasks keep the low one from running. The important task starves.

This happened on Mars Pathfinder in 1997. Shortly after landing, a data-bus task kept missing its deadline because of exactly this pattern, and a timer that checked for it reset the whole computer, again and again. Engineers reproduced it on an identical ground testbed, then uploaded a change that switched on "priority inheritance" for the lock. It is the classic case of an in-flight update that was the safer choice, the question lesson 12 takes up.
:::
