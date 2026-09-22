---
id: l08-radiation-and-watchdogs
title: Radiation effects and watchdog timers
minutes: 22
covers:
  - "Radiation effects: single-event upsets, latch-up, total ionising dose; EDAC and ECC memory; memory scrubbing"
  - "Watchdog timers: what they catch, what they miss, and why a reset is a real-time decision"
---

Every fault this module has built so far originated in a sensor, a bus, or a piece of software. This lesson covers a fault source that needs none of those to be wrong: the silicon itself, struck by a passing charged particle, doing something the design never intended a single microsecond after it happened. Every vehicle that leaves the atmosphere spends its whole mission in an environment far more radiation-dense than the ground, and lesson 5's commodity multi-core, Linux-based flight computers made an explicit trade on exactly this point — more compute per watt, in exchange for silicon individually more susceptible to this class of fault. This lesson puts numbers on that exposure, covers the memory-level protection built to absorb it, and then turns to the watchdog timer: a mechanism every flight computer has, that catches a specific and narrow class of failure precisely, and is routinely given credit for catching far more than it does.

## Three distinct things radiation does to a computer

**Single-event upset (SEU).** A single energetic particle passes through a memory cell or a piece of logic and deposits enough charge to flip a stored bit. It is transient — the transistor itself is undamaged, and writing the correct value back fully repairs it — and it is probabilistic, characterized by a *cross-section*: a rate, specific to a device and its manufacturing process, describing how likely a given particle fluence is to cause an upset in a given number of bits.

**Latch-up.** A particle can trigger a parasitic low-impedance current path inherent to CMOS structures, and once triggered, that path stays open, drawing current well above normal operation, until power is removed and reapplied. Unlike an SEU, latch-up is not self-correcting and, left uninterrupted, can generate enough heat to permanently damage the part — it requires active detection (an overcurrent sensor on the affected supply rail) and a definite response (power-cycling that rail), not merely a rewritten memory value.

**Total ionizing dose (TID).** Where an SEU and latch-up are single-event, instantaneous effects, TID is cumulative: ionizing radiation gradually shifts transistor threshold voltages and increases leakage current, degrading a part's performance over the mission and, past a rated dose, causing outright failure. It is not correctable by any software response — the only design-time levers are shielding, part selection, and derating.

::: example How much dose a mission actually accumulates
```python
dose_rate_krad_yr = 2.0   # given: a radiation environment model's prediction behind typical shielding
for years in [1, 2, 3, 5]:
    print(f"{years} yr mission at {dose_rate_krad_yr:.1f} krad(Si)/yr -> {dose_rate_krad_yr * years:.1f} krad(Si) total")
# 1 yr mission at 2.0 krad(Si)/yr -> 2.0 krad(Si) total
# 2 yr mission at 2.0 krad(Si)/yr -> 4.0 krad(Si) total
# 3 yr mission at 2.0 krad(Si)/yr -> 6.0 krad(Si) total
# 5 yr mission at 2.0 krad(Si)/yr -> 10.0 krad(Si) total
```
The arithmetic is trivial — dose rate times time — and that is exactly the point: TID is a budget you spend down linearly over the mission, checked against a part's rated tolerance from its radiation lot acceptance testing, not a probabilistic event a monitor watches for in flight the way the rest of this lesson's mechanisms watch for SEUs and latch-up.
:::

## SEU rate: a worked calculation, and what changes it

An SEU rate depends on a device's cross-section (given by testing or a vendor datasheet, in $\mathrm{cm^2/bit}$) and the environment's particle flux (from a radiation environment model, in particles per $\mathrm{cm^2}$ per day). Multiplying the two gives an upset rate per bit, and multiplying that by the number of bits at risk gives an expected upset rate for the whole array. The specific numbers below are given inputs for a worked problem — the kind a radiation test report and an environment model would hand a flight software team — not a claim about any specific real device or mission; the method is what generalizes.

::: example Expected upsets per day, and how they scale with memory size
```python
sigma_bit_cm2 = 2.0e-14     # given: cross-section per bit, from device radiation testing
flux_cm2_day = 2.0e5        # given: environment model's effective upset-causing flux
rate_per_bit_day = sigma_bit_cm2 * flux_cm2_day

for mbit in [1, 16, 256, 1024, 4096]:
    bits = mbit * 1_000_000
    exp_per_day = rate_per_bit_day * bits
    print(f"{mbit:5d} Mbit: {exp_per_day:.5f} upsets/day, about one every {1/exp_per_day:.2f} days")
#     1 Mbit: 0.00400 upsets/day, about one every 250.00 days
#    16 Mbit: 0.06400 upsets/day, about one every 15.62 days
#   256 Mbit: 1.02400 upsets/day, about one every 0.98 days
#  1024 Mbit: 4.09600 upsets/day, about one every 0.24 days
#  4096 Mbit: 16.38400 upsets/day, about one every 0.06 days
```
The rate scales linearly with array size, which is the entire reason larger memories need proportionally more attention paid to the protection mechanisms in the next section: a 256 Mbit array seeing about one upset a day is a background nuisance an EDAC scheme handles without difficulty; a 4 Gbit array under the identical environment sees upsets roughly every hour and a half, and the same protection scheme now has to work substantially harder to stay ahead of them.
:::

## EDAC, ECC, and why scrubbing exists

Error detection and correction (EDAC) — most commonly single-error-correct, double-error-detect (SECDED) codes — protects memory by storing extra check bits alongside each word, so that a single flipped bit within that word is detected and corrected automatically whenever the word is read, and a second flipped bit in the same word is at least detected, even though it cannot be corrected. This is a strong, standard defense against the upset rate above — but it has a gap worth naming precisely: correction happens *when a word is read*. A bit flipped by an SEU in a memory location the software rarely touches sits there, silently corrected only in the value returned on the next read, while the underlying stored bit stays flipped until something explicitly rewrites it. If a second, independent upset lands in the *same word* before that rewrite happens, the two together produce an uncorrectable double-bit error.

**Scrubbing** closes that gap: a background process periodically reads and rewrites every word in memory, specifically to flush out any accumulated single-bit upset — correcting it and writing the corrected value back — before a second upset has a chance to land in the same word. How often to scrub is a genuine design trade, and the right answer depends on the radiation environment, not a rule of thumb copied from elsewhere.

::: example Choosing a scrub interval, in a benign environment and a harsh one
```python
from scipy import stats
word_bits = 32
n_words = 256_000_000 // word_bits
lam_word_per_day = rate_per_bit_day * word_bits   # from the array above

for label, multiplier in [("nominal LEO", 1.0), ("100x, inside a proton belt / SPE", 100.0)]:
    print(f"-- {label} --")
    for scrub_hours in [24, 168, 720]:
        mu = lam_word_per_day * multiplier * (scrub_hours / 24.0)   # expected upsets in ONE word per interval
        p_double_one_word = stats.poisson.sf(1, mu)                  # P(>=2) via the survival function
        p_any_word = 1 - (1 - p_double_one_word) ** n_words
        print(f"  scrub every {scrub_hours:4d} h: P(>=1 uncorrectable word before next scrub) = {p_any_word:.3e}")
# -- nominal LEO --
#   scrub every   24 h: P(...) = 6.573e-08
#   scrub every  168 h: P(...) = 3.212e-06
#   scrub every  720 h: P(...) = 5.898e-05
# -- 100x, inside a proton belt / SPE --
#   scrub every   24 h: P(...) = 6.551e-04
#   scrub every  168 h: P(...) = 3.160e-02
#   scrub every  720 h: P(...) = 4.455e-01
```
In the nominal environment, even a monthly (720-hour) scrub keeps the probability of any uncorrectable word below six in a hundred thousand — daily scrubbing here is comfortable margin, not a tightly load-bearing requirement. In an environment a hundred times harsher — inside a proton belt, or during a solar particle event — that same monthly interval becomes a coin flip (44.6%), and even weekly scrubbing carries a real, no-longer-negligible 3.2% risk. The scrub interval that was conservative in one environment is inadequate in the other; it is a parameter chosen from the mission's actual radiation exposure, not a constant carried over from a previous program.
:::

::: key
An SEU is transient and self-correcting on rewrite; latch-up is a sustained overcurrent that needs active detection and a power cycle; TID is a cumulative, permanent, non-correctable budget spent down over the mission. EDAC corrects a single-bit error when a word is read; scrubbing is what prevents an uncorrected bit from sitting long enough for a second upset to make it uncorrectable.
:::

## Watchdog timers: what they actually check

A watchdog timer is a countdown that the software it monitors must reset — "pet" — before it expires; if the timeout is reached without a pet, the watchdog takes a predetermined action, most commonly forcing a processor reset. Its question is narrow and worth stating exactly: *is the monitored task still reaching the point in its execution where it pets me, on schedule?*

::: example What trips a watchdog, and what does not
```python
class Watchdog:
    def __init__(self, timeout_cycles):
        self.timeout_cycles = timeout_cycles
        self.cycles_since_pet = 0
        self.tripped = False

    def tick(self, pet: bool):
        self.cycles_since_pet = 0 if pet else self.cycles_since_pet + 1
        self.tripped = self.tripped or self.cycles_since_pet >= self.timeout_cycles
        return self.tripped

wd = Watchdog(timeout_cycles=5)
for i, pet in enumerate([True, True, True, False, False, False, False, False]):
    print(f"cycle {i}: pet={pet}, tripped={wd.tick(pet)}")
# cycle 0: pet=True,  tripped=False
# cycle 1: pet=True,  tripped=False
# cycle 2: pet=True,  tripped=False
# cycle 3: pet=False, tripped=False
# cycle 4: pet=False, tripped=False
# cycle 5: pet=False, tripped=False
# cycle 6: pet=False, tripped=False
# cycle 7: pet=False, tripped=True

wd2, attitude = Watchdog(timeout_cycles=5), 0.0
for i in range(6):
    attitude += 15.0            # a bad gain feeding the filter, every cycle
    print(f"cycle {i}: computed_attitude={attitude:.1f} deg, tripped={wd2.tick(pet=True)}")
# cycle 0: computed_attitude=15.0 deg, tripped=False
# cycle 1: computed_attitude=30.0 deg, tripped=False
# cycle 2: computed_attitude=45.0 deg, tripped=False
# cycle 3: computed_attitude=60.0 deg, tripped=False
# cycle 4: computed_attitude=75.0 deg, tripped=False
# cycle 5: computed_attitude=90.0 deg, tripped=False
```
In the first run, the task stops petting at cycle 3 and the watchdog trips five cycles later, exactly on schedule — a hang, a deadlock, a crash, or an unbounded loop are all exactly this pattern from the watchdog's point of view, and it catches every one of them within its timeout, by design. In the second run, the task never stops petting — it is alive, scheduled, and running on time every cycle — while a bad gain drives its computed attitude 90 degrees away from truth over the same six cycles, and the watchdog never so much as notices, because nothing about its one question was ever violated.
:::

A watchdog answers "is the task alive and scheduled," and that is a real, useful, narrow question. It says nothing about whether the values that task is computing are correct: a diverged navigation filter, a sign-flipped gain, a sensor fault the software has incorrectly accepted as healthy — the vehicle flying every one of these happily pets its watchdog the entire way, because petting it has nothing to do with what the software is computing, only with the fact that it is still executing on schedule. Catching wrong-but-alive failures is exactly what lesson 9's residual monitors and persistence counters are for; a watchdog and a content check are answering different questions, and a system that relies on the watchdog alone to mean "the software is healthy" has quietly assumed an answer the watchdog was never built to give.

::: warning
A watchdog and a heartbeat are not the same guarantee. A heartbeat that only confirms a task is still scheduled — "I ran this cycle" — can be satisfied by a task that is looping through corrupted logic just as easily as by one working correctly. A heartbeat that instead requires the task to report *progress* — a monotonically advancing sequence number, a specific milestone reached — narrows the gap, but even that stops short of checking correctness; it only narrows "alive" toward "alive and making some kind of forward progress," which is still not "computing the right answer."
:::

## Why the reset itself is a real-time decision

The watchdog's *response* to a trip — commonly a processor reset — is not free, and treating it as an automatic, context-free reflex is itself a design mistake. A reset takes the computer through some version of lesson 2's `BOOT` sequence again: initialization time during which that computer contributes nothing. Whether that cost is acceptable depends entirely on what the vehicle is doing at the instant the trip occurs. A reset during a long, unhurried coast phase costs a brief gap a redundant string or a warm standby (lesson 5) can absorb without incident. The identical reset during a landing burn, where every one of the vehicle's remaining seconds is already committed to a converging trajectory, can cost far more than the hang it was meant to fix. This is why a watchdog's response has to be designed with the vehicle's operating phase in mind — sometimes a straight reset, sometimes a fail-over to an already-running hot standby instead of a reboot, sometimes an escalation that leaves the decision to a higher-level fault handler — and why the decision has to be bounded in time to begin with: the entire value of a watchdog is that it acts within a known, fixed interval after a hang begins, and a response mechanism that itself introduces unbounded delay before acting undoes that guarantee.

## Check yourself

::: check
A latch-up event and an SEU both originate from a particle strike. Why does an SEU's standard remedy — rewrite the correct value — not work for latch-up?
:::

::: answer
An SEU flips a stored bit without damaging the transistor, so writing the correct value back fully repairs it. Latch-up instead triggers a parasitic, low-impedance current path inherent to the CMOS structure itself; the device is now conducting an abnormal amount of current through that path, and no amount of rewriting a memory value addresses a current path that is not a stored bit at all. The only way to break the path is to remove power from the affected rail and reapply it, which is why latch-up needs active overcurrent detection and a power-cycling response rather than an ordinary EDAC correction.
:::

::: check
Using this lesson's SEU rate calculation, if a mission's onboard memory grows from 256 Mbit to 1024 Mbit with no other change, by what factor does the expected upset rate change, and why?
:::

::: answer
By a factor of four, matching the fourfold increase in bit count (256 Mbit to 1024 Mbit): the expected upset rate is the product of a fixed per-bit rate and the number of bits, so it scales linearly with array size. The worked example in this lesson shows exactly this — 1.024 upsets/day at 256 Mbit becomes 4.096 upsets/day at 1024 Mbit.
:::

::: check
Explain, without referring to specific numbers, why scrubbing exists at all given that EDAC already corrects single-bit errors automatically.
:::

::: answer
EDAC corrects a bit error in the value returned when a word is read, but it does not automatically rewrite the corrected value back into memory — the underlying flipped bit can remain in place until something explicitly reads and rewrites that word. If a rarely-accessed word accumulates a second, independent upset before it is ever read again, the two errors together exceed what EDAC can correct (though SECDED can still detect the double error). Scrubbing is a deliberate background process that reads and rewrites every word on a schedule specifically to flush out single-bit upsets before a second one has a chance to land in the same word, bounding how long any single upset is allowed to sit uncorrected in memory.
:::

::: check
A test engineer observes that a vehicle's watchdog never tripped during a flight in which the navigation filter is later found, from post-flight data review, to have diverged by several degrees for the last two minutes of flight. Does this mean the watchdog was faulty?
:::

::: answer
No. The watchdog was doing exactly what it is designed to do: confirming the navigation task remained alive and scheduled, which it apparently was throughout, since it continued petting the watchdog. A diverged filter that keeps executing on schedule is precisely the failure mode this lesson describes as invisible to a watchdog — it is a content failure, not a liveness failure, and only a residual monitor or similar content check (lesson 9) is positioned to catch it. The watchdog's silence here is consistent behavior, not evidence of a defect in the watchdog itself.
:::

::: check
Why is "always reset the processor on a watchdog trip" not a universally correct policy, according to this lesson?
:::

::: answer
A reset costs recovery time — the reset computer has to reinitialize before it contributes anything useful again — and whether that cost is acceptable depends on the vehicle's current operating phase. During a long, low-tempo phase such as a coast, the cost is easily absorbed; during a short, time-critical phase such as a landing burn, the same reset could cost more than the original hang would have, if a faster-recovering alternative (such as failing over to an already-running hot standby) were available instead. The correct response to a watchdog trip has to be chosen with the vehicle's context in mind, not applied as one fixed action regardless of when the trip occurs.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Single-event upset (SEU) | Transient bit flip; self-correcting once the correct value is rewritten |
| Latch-up | Sustained parasitic overcurrent; needs detection and a power cycle, not a rewrite |
| Total ionizing dose (TID) | Cumulative, permanent degradation; a budget spent down over the mission, not a runtime event |
| EDAC / SECDED | Corrects a single-bit error on read; detects but cannot correct a double-bit error in the same word |
| Scrubbing | Periodic background read-and-rewrite of memory, to prevent a single upset from sitting long enough to become a double, uncorrectable one |
| Watchdog timer | Trips if the monitored task fails to pet it within a timeout; catches hangs, crashes, and deadlocks |
| What a watchdog misses | Any failure where the task keeps running and keeps petting on schedule while computing wrong answers |
| Watchdog response | Its cost (commonly a reset) depends on vehicle phase, and must be chosen accordingly, within a bounded time |

The next lesson builds the mechanism that catches exactly what a watchdog cannot: a residual monitor that checks whether a filter's outputs remain statistically consistent with its own model, with a persistence counter tuned to the trade between catching a real fault quickly and not crying wolf over ordinary noise.
