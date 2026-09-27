---
id: l08-radiation-effects-and-software-mitigations
title: Radiation effects and the software that survives them
minutes: 24
covers:
  - 'Radiation effects: SEU, SEL, TID, and the software mitigations (voting, checksums, scrubbing, resets)'
---

Imagine writing your homework answers on a whiteboard, and every so often, at random, someone walks past and changes one digit. How would you keep your answers right? You might write every answer three times and trust whichever two agree. You might add up each row and write the total at the end, so a changed digit makes the total wrong. You might walk along the board every hour and fix anything that looks off.

That is life for a computer in space. The "someone" is **radiation**: fast particles from the Sun and from far outside the solar system that pass through the spacecraft, and through its chips. On the ground, the thick air and Earth's magnetic field stop almost all of them. In orbit, many get through. Every flight computer above the atmosphere is being hit, all the time.

Engineers group the damage into three kinds, each with a three-letter name. A **single-event upset (SEU)** flips a bit. A **single-event latch-up (SEL)** makes a chip short-circuit itself. **Total ionizing dose (TID)** is slow wear from all the radiation added up over years. This lesson explains each one, then builds the software defenses in C++: voting, checksums, scrubbing and resets.

## Where the particles come from

Space radiation is **[[charged particles|particle-sources]]** — protons, electrons and the bare nuclei of heavier atoms — moving at a large fraction of the speed of light. There are three main sources:

- **Galactic cosmic rays**: nuclei from far outside our solar system. There are few, but each carries so much energy that shielding hardly stops them.
- **Solar particle events**: bursts of protons thrown out by the Sun during flares and storms. They can raise the upset rate many times over for a day or more.
- **Trapped radiation**: protons and electrons caught by Earth's magnetic field in the Van Allen belts. Low-orbit satellites meet the inner belt where it dips close to Earth, over the **[[South Atlantic|saa]]**.

A particle passing through silicon leaves a thin trail of freed electric charge, like a boat leaving a wake. Usually the trail lands somewhere harmless. Sometimes it lands on exactly the wrong transistor.

## Single-event upset: one bit flips

A memory cell stores a bit as a small amount of charge, or as the state of a tiny switch circuit. If a particle's trail dumps enough charge right there, the cell **[[changes its mind|how-a-bit-flips]]**: a 0 becomes a 1, or a 1 becomes a 0. Nothing is damaged. The next time you write that cell, it works perfectly. That is why this is called a *soft error*: the hardware is fine, only the data is wrong.

A bit flip can land anywhere:

- In a **data value**: a gain of 2.5 becomes 5.0 and the controller over-reacts.
- In a **pointer or index**: the code reads or writes the wrong place in memory.
- In a **register or the program counter**: the processor jumps into nonsense and hangs.
- In the **program code itself**: an instruction turns into a different instruction.

A close cousin is the **single-event functional interrupt (SEFI)**. A control bit deep inside a chip flips, and the whole device hangs — a flash memory stops responding — until it is reset.

::: key
A single-event upset is when a charged particle flips a bit in memory or a register. Mitigations are error-correcting memory with periodic scrubbing, checksums or CRCs on critical data and code, redundant computation with voting, and a watchdog that resets a hung processor.
:::

## Error-correcting memory and scrubbing

Flight computers use **error-correcting code (ECC)** memory. For every 64 bits of data, the memory chip stores 8 extra **check bits** worked out from the data. When you read a word, the hardware recomputes the check bits and compares. The common scheme is called **[[SECDED|secded]]**: *single error correct, double error detect*. If one bit in the word flipped, the hardware can tell which one and hands you the corrected value. If two bits flipped, it cannot fix them, but it knows something is wrong and raises an alarm.

Here is the trap. ECC fixes the value it *hands you*, but a word nobody reads keeps its flipped bit. When a second particle hits that word, there are two flipped bits, which ECC cannot fix. Rarely-read memory slowly collects errors.

The answer is **scrubbing**: a low-priority background task that walks through all of memory, reading every word, so that single-bit errors are found and corrected (written back) before a second one can join them. The scrubber is a small loop — with a fixed bound, as lesson 02 requires — that reads a chunk of memory every frame and wraps around to the start when it reaches the end.

::: example How often should you scrub?
Take a flight computer with 256 MiB of memory. That is

$$
256 \times 2^{20} \times 8 = 2147483648 \text{ bits},
$$

about $2.15 \times 10^9$ bits. Suppose each bit has a chance of $10^{-7}$ per day of being flipped. (That is an assumed number for illustration; real rates vary by a factor of a hundred or more with the orbit, the chip and the Sun's activity.)

**Upsets per day** across the whole memory:

$$
2147483648 \times 10^{-7} \approx 215 \text{ upsets per day}.
$$

So single-bit errors are routine: about nine an hour. ECC fixes each one.

**Words.** Memory is organized in 64-bit words, so there are $2147483648 / 64 = 33554432$ words, call that $W$. Each word has 64 bits, so its upset rate is $\lambda = 64 \times 10^{-7} = 6.4 \times 10^{-6}$ per day. (Read $\lambda$ as "lambda".)

**The danger** is a word taking two hits before the scrubber fixes the first. If the scrubber visits each word every $T$ days, the chance that one word gets two hits in that window is about $(\lambda T)^2 / 2$. Multiply by the number of words and divide by $T$ to get uncorrectable errors per day:

$$
\text{double errors per day} \approx \frac{W \lambda^2 T}{2}.
$$

- **Never scrubbed** for a year ($T = 365.25$): each word has taken about $\lambda T = 0.00234$ hits on average, and about $W (\lambda T)^2 / 2 \approx 92$ words have taken two. That is 92 values the hardware can no longer correct.
- **Scrubbed once a day** ($T = 1$): $33554432 \times (6.4 \times 10^{-6})^2 \times 1 / 2 \approx 0.00069$ per day, or about one every 4 years.
- **Scrubbed once an hour** ($T = 1/24$): about $2.9 \times 10^{-5}$ per day, one every 96 years or so.

**Sanity check.** $T$ is on top, so scrubbing 24 times as often should cut double errors by 24. It does: $0.00069 / 24 \approx 2.9 \times 10^{-5}$. And reading 256 MiB once an hour is a tiny load, so scrubbing is cheap insurance.
:::

::: warning ECC does not protect everything
ECC covers the main memory. It often does not cover processor registers, some caches, or buffers inside peripheral chips. Bits flipped there reach your code uncorrected. That is why the other defenses below exist: no single one covers every place a bit can live.
:::

## Voting: store it three times, trust the majority

For the few values that matter most — the current flight mode, the state of an arming switch — software can add its own protection. It keeps **three copies** and reads them by **majority vote**. This is **triple modular redundancy (TMR)**.

The trick is to vote *bit by bit*. For each bit position, the output is 1 if at least two of the three copies have a 1 there. In C++ that is one line of bitwise operators:

$$
v = (a \mathbin{\&} b) \mathbin{|} (a \mathbin{\&} c) \mathbin{|} (b \mathbin{\&} c)
$$

Read `&` as "and" (1 only if both are 1) and `|` as "or" (1 if either is 1). A bit of $v$ is 1 exactly when some pair of copies both have a 1 there — which is what "at least two of three" means. The **[[bitwise vote|vote-bits]]** survives any number of flips, as long as no two copies are hit in the same bit position.

::: example A self-repairing voted variable
This class stores one 32-bit word three times. Every read votes, and if any copy disagrees with the vote, the read writes the good value back into all three. That write-back is scrubbing, done on the spot.

```cpp
#include <cstdint>
#include <cstdio>

// Triple modular redundancy for one critical word: keep three copies,
// read by bitwise majority vote, and repair the copies on every read.
class Voted {
public:
    explicit Voted(std::uint32_t v) { write(v); }

    std::uint32_t read() {
        const std::uint32_t a = a_;
        const std::uint32_t b = b_;
        const std::uint32_t c = c_;
        // Each output bit is 1 when at least two of the three copies say 1.
        const std::uint32_t v = (a & b) | (a & c) | (b & c);
        if (a != v || b != v || c != v) {
            ++repairs_;
            write(v);                        // scrub: put the good value back
        }
        return v;
    }
    void write(std::uint32_t v) { a_ = v; b_ = v; c_ = v; }
    unsigned repairs() const { return repairs_; }

    // For the demonstration only: pretend a particle hit copy b.
    void flip_bit_in_b(int bit) { b_ = b_ ^ (1U << bit); }

private:
    // volatile: the compiler must really keep and really read three copies.
    volatile std::uint32_t a_{}, b_{}, c_{};
    unsigned repairs_{0};
};

int main() {
    Voted mode_word{3U};                     // 3 = "fine pointing"
    std::printf("read: %u\n", mode_word.read());

    mode_word.flip_bit_in_b(30);             // copy b is now 1073741827
    const std::uint32_t v = mode_word.read();
    std::printf("read after upset: %u, repairs: %u\n", v, mode_word.repairs());

    mode_word.flip_bit_in_b(0);              // a second upset, much later
    const std::uint32_t w = mode_word.read();
    std::printf("read after second upset: %u, repairs: %u\n", w, mode_word.repairs());
}
```

Built with `g++ -std=c++20 -Wall -Wextra` and run:

```text
read: 3
read after upset: 3, repairs: 1
read after second upset: 3, repairs: 2
```

The mode word starts as 3 in all three copies. A simulated particle flips bit 30 of copy `b`, which turns it into $3 + 2^{30} = 1073741827$ — a completely different mode, if anyone used it. The next read votes: in bit 30, copies `a` and `c` both say 0, so the vote says 0, and the result is 3. The read notices `b` disagreed, counts a repair, and rewrites `b`. Later a second particle flips bit 0 of `b`, and the same thing happens again.

**Sanity check.** Both upsets hit the same copy, yet the value stayed right, because each was repaired before the next arrived. If the second flip had landed in bit 30 of copy `a` *before* the first was repaired, two copies would say 1 there and the vote would be wrong. Voting plus prompt repair is what makes TMR strong. The [[volatile|why-volatile]] keyword matters too.
:::

::: warning Three copies in one place is one copy
If the three copies sit next to each other in the same memory word, or in the same cache line, one particle's trail or one failing chip can take out two of them at once. Real designs spread the copies across different memory banks, or across different processors entirely. And voting code that runs on one processor cannot protect against that processor itself going wrong.
:::

The same idea scales up from variables to whole computers. Three flight computers can run the same software and vote on their outputs. The SpaceX design you met in the concurrency module takes a variant of it: each of three flight strings has **[[two cores that check each other|actor-judge]]** and stays silent when they disagree, and the actuators judge among the commands they receive.

## Checksums and CRCs: catching a changed table

Voting costs three times the memory, so you cannot vote on everything. For large blocks that should *not* change — a table of controller gains, a star catalog, the program code itself — flight software stores a **checksum**: a short number computed from the whole block. Later it recomputes the number and compares. If even one bit of the block changed, the number will almost certainly be different.

The strongest everyday checksum is the **cyclic redundancy check (CRC)**. A 32-bit **[[CRC|crc-power]]** is computed by feeding the bytes through a small shift-and-XOR loop. It is guaranteed to catch any single flipped bit, any two flipped bits in blocks of normal size, and any run of flipped bits up to 32 long.

A checksum only *detects*. To *fix*, you need a known-good copy to reload from. On a vehicle that golden copy usually lives in memory that particles upset far less often, or that is itself protected, such as write-protected flash.

::: example Catching a doubled gain with a CRC
The program computes a CRC-32 over the controller gains at startup. Then a simulated particle flips one bit of the proportional gain `kp`. The periodic check finds the mismatch and reloads the gains from the golden copy.

```cpp
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>

// CRC-32 (the one used by Ethernet and zip files), one bit at a time.
// Loop bounds: n bytes times 8 bits -- fixed by the caller's buffer size.
std::uint32_t crc32(const unsigned char* data, std::size_t n) {
    std::uint32_t crc = 0xFFFFFFFFU;
    for (std::size_t i = 0; i < n; ++i) {
        crc ^= data[i];
        for (int bit = 0; bit < 8; ++bit) {
            const std::uint32_t mask = -(crc & 1U);   // all ones if low bit set
            crc = (crc >> 1) ^ (0xEDB88320U & mask);
        }
    }
    return ~crc;
}

struct Gains { double kp, ki, kd; };

// The golden copy would live in write-protected flash on a real vehicle.
const Gains kGolden{2.5, 0.1, 0.8};
Gains g_gains = kGolden;                // working copy in RAM
std::uint32_t g_gains_crc = 0;

std::uint32_t crc_of(const Gains& g) {
    return crc32(reinterpret_cast<const unsigned char*>(&g), sizeof g);
}

void check_gains() {
    if (crc_of(g_gains) != g_gains_crc) {
        std::printf("  CRC mismatch: reloading gains from golden copy\n");
        g_gains = kGolden;
    }
}

int main() {
    const char* test = "123456789";
    std::printf("crc32(\"123456789\") = %08X\n",
                crc32(reinterpret_cast<const unsigned char*>(test), 9));

    g_gains_crc = crc_of(g_gains);
    std::printf("gains CRC at init = %08X\n", g_gains_crc);

    // A particle flips bit 52 of kp (the lowest bit of its exponent).
    std::uint64_t bits;
    std::memcpy(&bits, &g_gains.kp, sizeof bits);
    bits ^= (std::uint64_t{1} << 52);
    std::memcpy(&g_gains.kp, &bits, sizeof bits);
    std::printf("kp after upset = %g\n", g_gains.kp);

    check_gains();
    std::printf("kp after check = %g\n", g_gains.kp);
}
```

Output:

```text
crc32("123456789") = CBF43926
gains CRC at init = E6C6C5BD
kp after upset = 5
  CRC mismatch: reloading gains from golden copy
kp after check = 2.5
```

The first line is a self-test: every correct CRC-32 of the text `123456789` gives `CBF43926`. The second is the gains' CRC at startup. Then one bit flips — bit 52, the lowest bit of the **exponent** in a `double`, the part that says which power of 2 to multiply by. That one bit turns $1.25 \times 2^1 = 2.5$ into $1.25 \times 2^2 = 5$. The gain has doubled, and a controller with double the gain can shake itself apart. The check sees the CRC no longer matches and reloads 2.5.

**Sanity check.** A single flipped bit changed the value by a factor of exactly 2, which is what flipping the lowest exponent bit must do. It shows why you cannot rely on "a bit flip only makes a small error": depending on which bit it hits, the error can be tiny, or enormous, or NaN.
:::

::: warning Padding bytes break checksums
`Gains` is three `double`s with no gaps, so every byte of it is data. A struct like `{ std::uint8_t mode; double value; }` has seven **padding** bytes after `mode` whose contents are not defined, and copying the struct may not copy them. A CRC over the raw bytes can then change without any real upset. Checksum structs that have no padding (check with `static_assert(sizeof(T) == ...)`), or compute the CRC field by field.
:::

The same check protects the program itself: flight software periodically computes a CRC over its own machine code and compares it with the value stored at build time. A mismatch means an instruction changed; the fix is to reload that code from a protected image, or to reset.

## Resets: when the processor itself is hit

If a particle flips a bit in the program counter, or in a register that decides where to go next, the software may jump into nonsense. It cannot check its own checksums, because it is not running its own code any more. This is where the **watchdog** from lesson 06 earns its place: the hung processor stops petting the timer, and the timer resets it. After the reset, the startup code reloads everything from protected storage, and the processor comes back clean.

## Single-event latch-up: the chip short-circuits

Deep inside most chips there is an accidental structure of four layers of silicon that can behave like a switch that, once on, stays on. A heavy particle can turn it on. Then a large current flows from the power supply to ground through the chip, and keeps flowing. That is **single-event [[latch-up|latch-up-picture]]**. It does not go away by itself. If the power is not removed quickly, the chip can overheat and be destroyed.

The defense is mostly hardware: a **current limiter** on each chip's power line that notices the current jump and cuts power, within a few milliseconds or faster. Software's job is what comes after. The flight software sees in telemetry that a device was power-cycled, turns it back on, reloads its configuration, and brings it back into service — the same "reset the unit" rung of the FDIR ladder from lesson 07. Software can also watch the supply currents itself and command a power cycle when one creeps above its normal band.

## Total ionizing dose: slow wear

The last effect has no single moment. Every particle that passes through a chip leaves a little electric charge trapped in the insulating layers of its transistors. Over years that trapped charge adds up. Transistors switch at slightly different voltages, leak more current, and slow down. Eventually the chip stops working.

The dose is measured in **[[rads|rad-unit]]** absorbed by silicon, usually in thousands: krad(Si). A part rated to 100 krad(Si) can take about that much total before it is expected to fail. The designer estimates the dose the mission will deliver behind the spacecraft's shielding, and chooses parts rated for it with a safety margin, often a factor of two.

TID is a hardware problem with a hardware answer: shielding and parts rated for the dose, such as **[[radiation-hardened processors|rad-hard]]**. Software cannot undo it, but it can watch the symptoms — supply currents creeping up over months — and report the trend so engineers can plan around a part before it fails.

::: warning Do not mix up the three
SEU is a *moment* that changes *data*; the chip is fine. SEL is a *moment* that damages hardware *unless power is cut fast*. TID is a *slow total* that wears the chip out over years. Software mitigations — voting, checksums, scrubbing, resets — are aimed mainly at SEUs. For SEL software helps with the recovery; for TID it only watches.
:::

## Check yourself

::: check
A parameter table of 4 KiB is loaded once at startup and read rarely. The memory has SECDED ECC. Why is ECC alone not enough, and what should the software add?
:::

::: answer
ECC corrects a single flipped bit only when the word is read, and it cannot correct two flipped bits in the same word. A table that is rarely read can collect a first upset, sit uncorrected, and then take a second hit in the same word, which ECC can only detect, not fix. The software should scrub that region regularly (read every word so single errors are corrected and written back), and can also keep a CRC over the table with a golden copy to reload from if the CRC ever fails.
:::

::: check
Three copies of a byte read $a = 10110010$, $b = 10110110$, $c = 00110010$ (in binary). What does the bitwise majority vote give? Which copies were upset, and in which bits?
:::

::: answer
Go bit by bit, taking whichever value at least two copies share. From the left: 1,1,0 gives 1; 0,0,0 gives 0; 1,1,1 gives 1; 1,1,1 gives 1; 0,0,0 gives 0; 0,1,0 gives 0; 1,1,1 gives 1; 0,0,0 gives 0. The vote is $10110010$. That equals $a$, so $a$ is clean. Copy $b$ differs in the sixth bit from the left (bit 2, counting from 0 at the right). Copy $c$ differs in the first bit (bit 7). Two copies were upset, but in different bit positions, so the vote is still right.
:::

::: check
Why does the `Voted` class mark its three copies `volatile`?
:::

::: answer
Without `volatile`, the compiler can see that `write` always stores the same value into all three members, and nothing in the program changes one without the others. It is then allowed to keep one copy, or to skip reloading them from memory in `read`. That would defeat the whole point: the copies must really exist in memory, and must really be read back, so that a flipped bit in one of them can be seen and outvoted.
:::

::: check
If the upset rate doubled during a solar storm, by what factor would the rate of uncorrectable double-bit errors change, for the same scrub interval?
:::

::: answer
The rate is $W \lambda^2 T / 2$, which grows as the square of $\lambda$. Doubling $\lambda$ multiplies it by $2^2 = 4$. That is why some spacecraft scrub more often during a storm: doubling the scrub rate halves $T$ and wins back a factor of 2, and quadrupling it wins back the full factor of 4.
:::

::: check
A power-supply telemetry channel for a camera jumps from 0.3 A to 1.8 A and stays there, while the camera stops responding. Which radiation effect is this most likely to be, and what should the system do?
:::

::: answer
A sudden, lasting current jump with a dead device is the signature of a single-event latch-up. Power must be removed quickly, before the chip overheats. A current limiter should already have tripped; if not, the software should command the camera's power off, wait, power it back on, reload its configuration, and log the event. An SEU would not raise the current, and TID changes current slowly over months, not in one step.
:::

## Summary

| Idea | What it is | Software answer |
|---|---|---|
| SEU | particle flips a bit; hardware is fine | ECC with scrubbing, CRCs, voting, watchdog reset |
| SEFI | particle upsets a chip's control logic; the device hangs | reset or power-cycle, then reconfigure |
| SEL | particle triggers a lasting short circuit | hardware cuts power; software restores the device |
| TID | charge builds up over years; chips degrade | shielding and rated parts; software watches trends |
| SECDED ECC | 8 check bits per 64 data bits | corrects 1 flipped bit, detects 2 |
| Scrubbing | read every word regularly | double errors per day about $W\lambda^2T/2$ |
| TMR vote | bitwise majority of three copies | correct while no two copies share a flipped bit |
| CRC-32 | 32-bit check value over a block | detects; reload from a golden copy to fix |

Several of these defenses rely on getting exactly the same answer twice: two cores that compare results, three computers that vote, a replay on the ground that must match flight. The next lesson, on fixed-point arithmetic and determinism, shows how to make arithmetic produce bit-for-bit identical results, and why a common compiler flag quietly breaks it.

::: context particle-sources What actually hits a spacecraft
Galactic cosmic rays are mostly protons, with a small share of helium and heavier nuclei such as iron. The heavy ones matter most for upsets, because a particle with more charge leaves a denser trail of freed charge. Solar particle events are mainly protons, and arrive in bursts after big flares or coronal mass ejections. Even at sea level a little of this reaches chips: cosmic rays striking the upper atmosphere make showers of neutrons, which cause occasional upsets in aircraft electronics and in large data centers.
:::

::: context saa The dent in the belts
Earth's magnetic field is not centered exactly on Earth's center, and it is tilted. Over the South Atlantic, off the coast of Brazil, the inner Van Allen belt comes down closest to the ground — a few hundred kilometers up. Satellites in low Earth orbit pass through this South Atlantic Anomaly several times a day, and many record most of their upsets there. Some missions even pause sensitive instruments while crossing it.
:::

::: context how-a-bit-flips Critical charge
Every memory cell has a **critical charge**: the smallest amount of stray charge that will flip it. A particle's trail through the silicon frees charge along its path, and some of it is collected at the cell's transistors. If that collected charge is bigger than the critical charge, the cell flips. As chips shrink, each cell holds less charge, so the critical charge falls. That is one reason modern, very small chips can be more sensitive per bit, although each cell is also a smaller target.
:::

::: context secded Eight extra bits
Richard Hamming invented error-correcting codes in 1950. The idea: add check bits, each one the parity (odd or even count of 1s) of a different subset of the data bits. If one bit flips, exactly the check bits whose subsets contain it come out wrong, and the pattern of wrong check bits spells out its position. Seven check bits are enough to locate one error in 64 data bits; an eighth, overall parity bit adds the ability to notice a second error. So a 64-bit word is stored as 72 bits.
:::

::: context vote-bits Voting one bit at a time
Each column is one bit position. The flipped bit in copy b (red) is outvoted because copies a and c agree in that column.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="13" fill="#1f2a44">
    <text x="20" y="35">copy a</text>
    <text x="20" y="70">copy b</text>
    <text x="20" y="105">copy c</text>
    <text x="20" y="150" font-weight="700">vote</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="100" y="18" width="40" height="26" fill="#8fb8f0"/><rect x="150" y="18" width="40" height="26" fill="#ffffff"/>
    <rect x="200" y="18" width="40" height="26" fill="#8fb8f0"/><rect x="250" y="18" width="40" height="26" fill="#8fb8f0"/>
    <rect x="100" y="53" width="40" height="26" fill="#8fb8f0"/><rect x="150" y="53" width="40" height="26" fill="#b4232c"/>
    <rect x="200" y="53" width="40" height="26" fill="#8fb8f0"/><rect x="250" y="53" width="40" height="26" fill="#8fb8f0"/>
    <rect x="100" y="88" width="40" height="26" fill="#8fb8f0"/><rect x="150" y="88" width="40" height="26" fill="#ffffff"/>
    <rect x="200" y="88" width="40" height="26" fill="#8fb8f0"/><rect x="250" y="88" width="40" height="26" fill="#8fb8f0"/>
    <rect x="100" y="133" width="40" height="26" fill="#1d6fd1"/><rect x="150" y="133" width="40" height="26" fill="#ffffff"/>
    <rect x="200" y="133" width="40" height="26" fill="#1d6fd1"/><rect x="250" y="133" width="40" height="26" fill="#1d6fd1"/>
  </g>
  <g font-size="14" text-anchor="middle">
    <text x="120" y="36" fill="#1f2a44">1</text><text x="170" y="36" fill="#1f2a44">0</text><text x="220" y="36" fill="#1f2a44">1</text><text x="270" y="36" fill="#1f2a44">1</text>
    <text x="120" y="71" fill="#1f2a44">1</text><text x="170" y="71" fill="#ffffff">1</text><text x="220" y="71" fill="#1f2a44">1</text><text x="270" y="71" fill="#1f2a44">1</text>
    <text x="120" y="106" fill="#1f2a44">1</text><text x="170" y="106" fill="#1f2a44">0</text><text x="220" y="106" fill="#1f2a44">1</text><text x="270" y="106" fill="#1f2a44">1</text>
    <text x="120" y="151" fill="#ffffff">1</text><text x="170" y="151" fill="#1f2a44">0</text><text x="220" y="151" fill="#ffffff">1</text><text x="270" y="151" fill="#ffffff">1</text>
  </g>
  <line x1="95" y1="124" x2="295" y2="124" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="305" y="71" font-size="11" fill="#b4232c">upset</text>
</svg>
```
:::

::: context why-volatile Stopping the optimizer from helping
An optimizing compiler is allowed to remove anything that makes no difference to the program's visible behavior. Three members that are always written with the same value and never changed separately look like wasted memory to it, and a vote over three equal values looks like it always returns the first. Marking the members `volatile` tells the compiler that each access is itself important and must really happen, in order. The memory module's lesson on strict aliasing and `volatile` covers the rules in detail; this is one of the few places `volatile` is the right tool outside of hardware registers.
:::

::: context actor-judge A bridge back to the concurrency module
The SpaceX architecture from the concurrency module uses three flight strings, each a dual-core processor. The two cores compute the same thing and compare. If they disagree, that string issues no command at all, so an upset turns into silence rather than a wrong order. The microcontrollers at the actuators receive commands from the strings and judge which to act on. It is voting and self-checking, done at the scale of whole computers, so that ordinary commercial processors can be flown instead of expensive radiation-hardened ones.
:::

::: context crc-power Why a CRC beats adding up bytes
A plain sum of bytes misses a lot: swap two bytes and the sum is unchanged; add 1 to one byte and subtract 1 from another and the sum is unchanged. A CRC treats the whole block as one huge binary number and takes its remainder after dividing by a carefully chosen 33-bit "polynomial". Changing any bit, anywhere, changes the remainder in a way that depends on the bit's position. The fixed test value `CBF43926` for the text `123456789` is how implementers check they built the standard CRC-32, and not a subtly different one.
:::

::: context latch-up-picture What a latch-up looks like in telemetry
The current is normal, then jumps when the particle strikes and stays high. The limiter cuts the power; after a pause, power comes back and the current returns to normal. Software then reloads the device's configuration.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="345" y="157" font-size="11" fill="#6c7a93" text-anchor="end">time</text>
  <text x="12" y="80" font-size="11" fill="#6c7a93" transform="rotate(-90 12 80)" text-anchor="middle">current</text>
  <line x1="40" y1="65" x2="345" y2="65" stroke="#b4232c" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="340" y="59" font-size="11" fill="#b4232c" text-anchor="end">trip limit</text>
  <polyline points="40,115 120,115 120,35 170,35 170,140 220,140 220,115 345,115" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="120" y="28" font-size="11" fill="#1f2a44" text-anchor="middle">strike</text>
  <text x="195" y="132" font-size="11" fill="#1f2a44" text-anchor="middle">off</text>
  <text x="270" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">back to normal</text>
  <text x="80" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">normal</text>
</svg>
```
:::

::: context rad-unit Rads and grays
A **rad** is an old unit of absorbed radiation dose: 0.01 joules of energy absorbed per kilogram of material. The SI unit is the **gray** (Gy), one joule per kilogram, so 1 rad = 0.01 Gy and 100 krad = 1,000 Gy. Space engineers still mostly speak in krad, and they always say what absorbed it — "(Si)" for silicon — because different materials absorb the same radiation differently.
:::

::: context rad-hard Chips built for space
A radiation-hardened processor is designed and manufactured to resist all three effects: its memory cells need more charge to flip, its layout avoids latch-up paths, and its insulating layers trap less charge. The RAD750, for example, flew on the Curiosity and Perseverance Mars rovers. The price is speed and cost: hardened processors run far slower than a modern phone's chip and cost vastly more. That trade is why some companies choose commercial chips plus the software defenses in this lesson.
:::
