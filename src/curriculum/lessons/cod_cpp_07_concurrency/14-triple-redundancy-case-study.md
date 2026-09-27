---
id: l14-triple-redundancy-case-study
title: "Case study: three flight computers and a vote"
minutes: 21
covers:
  - The SpaceX triple-redundancy architecture as a case study
---

Imagine a math contest where the answer really matters. The teacher does not trust any one student, so she sets up three pairs. In each pair, both students solve the problem on their own and then compare. If the two answers match, the pair hands it in. If they do not match, the pair hands in nothing at all — one of them made a slip, and they cannot tell which. The teacher collects whatever arrives and accepts the answer that the pairs agree on.

Now suppose someone sneezes on one student's paper and smudges a digit. That pair disagrees and goes quiet. The other two pairs still hand in the same, correct answer. The contest is not even slowed down.

That is, in outline, how SpaceX has publicly described flying ordinary processors through space radiation. This last lesson of the module is a case study of that design. It uses almost everything you have learned. Threads and races, memory ordering, allocation-free loops and Linux real-time setup all turn out to serve one requirement: two computers given the same inputs must produce *exactly* the same bits. Without that, the vote cannot work.

## The problem: radiation and ordinary chips

Above the atmosphere, and even inside it at altitude, fast particles pass through electronics all the time. When one crosses a transistor that stores a bit, it can deposit enough charge to flip it. The chip is not damaged; one bit just changed. That is a **[[single-event upset|seu]]**. In memory it corrupts a variable. In a register or pipeline it can corrupt a result mid-calculation.

There are two ways to deal with it. One is to build the chip differently: **[[radiation-hardened|rad-hard]]** ("rad-hard") processors use special designs and manufacturing so that upsets are far rarer. They work, and they fly on many spacecraft. But they are expensive, made in small numbers, and generations behind ordinary chips in speed.

The other way is to accept that upsets will happen and design the *system* so that one upset cannot cause a wrong command. That is the route this lesson studies.

## What SpaceX engineers have said

Everything in this section comes from what SpaceX engineers have said publicly, in **[[Reddit "Ask Me Anything" sessions|public-sources]]** held by the company's software team and in conference talks. Details that have not been stated publicly — exact processor models, how many computers a Dragon carries, what happens after a second failure — are left out rather than guessed.

- The Falcon 9 and Dragon flight computers are built from **commodity** processors — mass-produced x86 chips of the kind found in ordinary computers, not radiation-hardened parts.
- Each flight computer is a **dual-core** x86 processor running **Linux**, and the flight software is written in **C++**.
- There are **three** of them. Each is called a **[[flight string|string-word]]**: one processor with the path from its inputs to its commands.
- Within a string, **the two cores compare their results**. If they disagree, the string issues no command. If they agree, it sends the command on.
- The commands go to **microcontrollers at the actuators** — the engines, grid fins and valves — publicly described as PowerPC-based. Each one receives three commands, one per string, and **judges** which is correct. The design has been publicly called an **actor–judge** arrangement: the strings act, the actuator controllers judge.
- A string that drops out does not stop the vehicle: the vehicle keeps flying on the other two.

::: key How SpaceX gets radiation tolerance from commodity parts
Three flight strings, each a dual-core x86 running Linux, where the two cores compare results and a disagreeing string issues no command; PowerPC microcontrollers at the actuators receive three commands and judge the correct one. Redundancy and voting replace rad-hard silicon.
:::

## Layer one: the self-checking pair

Look at one string on its own. Both cores run the same control code on the same inputs. After each calculation they compare. Match: send. Mismatch: stay silent.

Why silence? Because a string that disagrees with itself cannot know *which* core is right. With two witnesses who disagree, there is no majority. So it takes the one safe action it has: it says nothing. This behaviour has a name: **[[fail-silent|fail-silent]]**. A fail-silent unit either gives a correct output or no output. It never gives a wrong one.

That turns a hard problem into an easy one. A wrong command is dangerous: an actuator cannot easily tell a plausible wrong value from a right one. A *missing* command is easy to notice. By pairing its cores, each string converts "maybe wrong" into "right or absent".

::: warning The pair checks the arithmetic, not the idea
Both cores run the same program. If the program itself has a bug, both cores compute the same wrong answer, agree, and send it. Self-checking pairs catch *random* faults like upsets. They do nothing against a mistake that is the same everywhere — a **[[common-mode failure|common-mode]]**. That is what testing, reviews and simulation are for.
:::

## Layer two: three strings and a judge

Now step back to all three strings. Each actuator controller receives up to three commands per cycle: one from each string that is not silent. It picks the command the strings agree on. With all three healthy, they send identical commands. With one string silent, the other two still agree, and the actuator gets its command as usual.

Two points are easy to get backwards:

- The judging happens **at the actuators**, in the small controllers that drive the hardware — not among the three flight computers, and not on the ground. The strings never vote with each other; each only checks itself.
- Each layer covers the other's gap. The pair turns an upset into silence. The three strings make sure silence from one does not leave the actuator without a command.

::: example Simulating three self-checking strings with an upset
Each `Core` holds its own copy of the flight state and runs the same `step`. A `FlightString` runs both cores and compares their commands bit for bit. The `judge` accepts a command that at least two strings sent. At frame 2, one bit of the second core's state in string B is flipped, as an upset would.

```cpp
// Three flight strings, each with two cores that must agree bit for bit.
// A disagreeing string sends nothing. The actuator controller judges
// among the commands it receives.
#include <array>
#include <bit>
#include <cstdint>
#include <cstdio>
#include <optional>

struct Core {                        // one core's copy of the flight state
    double angle = 0.10;             // rad, estimated pitch error
    double rate  = 0.0;              // rad/s

    double step(double gyro) {       // identical code on every core
        rate  = gyro;
        angle = angle + 0.01 * rate; // 100 Hz update
        return -2.0 * angle - 0.5 * rate;   // gimbal command, degrees
    }
};

std::uint64_t bits(double x) { return std::bit_cast<std::uint64_t>(x); }

void flip_bit(double& x, int b) {    // a radiation upset in memory
    x = std::bit_cast<double>(bits(x) ^ (std::uint64_t{1} << b));
}

struct FlightString {
    Core a, b;
    bool silent = false;

    std::optional<double> step(double gyro) {
        const double ca = a.step(gyro);
        const double cb = b.step(gyro);
        if (bits(ca) != bits(cb)) silent = true;    // the pair disagrees
        if (silent) return std::nullopt;            // fail silent
        return ca;
    }
};

// The actuator's judge: accept a value that at least two strings sent.
std::optional<double> judge(const std::array<std::optional<double>, 3>& in) {
    for (int i = 0; i < 3; ++i)
        for (int j = i + 1; j < 3; ++j)
            if (in[i] && in[j] && bits(*in[i]) == bits(*in[j])) return in[i];
    return std::nullopt;
}

int main() {
    std::array<FlightString, 3> strings;
    const std::array<double, 6> gyro = {-0.20, -0.18, -0.15, -0.12, -0.10, -0.08};

    std::printf("frame   string A   string B   string C   judged\n");
    for (int f = 0; f < 6; ++f) {
        if (f == 2) flip_bit(strings[1].b.angle, 51);   // upset in B's second core
        std::array<std::optional<double>, 3> cmd;
        for (int s = 0; s < 3; ++s) cmd[s] = strings[s].step(gyro[f]);
        std::printf("%5d", f);
        for (auto& c : cmd) {
            if (c) std::printf("  %9.5f", *c);
            else   std::printf("  %9s", "silent");
        }
        auto j = judge(cmd);
        if (j) std::printf("  %9.5f\n", *j);
        else   std::printf("  %9s\n", "NONE");
    }
    std::printf("string B core a angle %.6f, core b angle %.6f\n",
                strings[1].a.angle, strings[1].b.angle);
}
```

`std::optional<double>` (read "optional double") holds either a `double` or nothing; here "nothing" means silence. `std::bit_cast` from lesson 6 of the last module reads the 64 bits of a `double` as an integer, so the comparison is on the exact bits. Built with `g++ -std=c++20 -Wall -Wextra -O2`:

```text
frame   string A   string B   string C   judged
    0   -0.09600   -0.09600   -0.09600   -0.09600
    1   -0.10240   -0.10240   -0.10240   -0.10240
    2   -0.11440     silent   -0.11440   -0.11440
    3   -0.12700     silent   -0.12700   -0.12700
    4   -0.13500     silent   -0.13500   -0.13500
    5   -0.14340     silent   -0.14340   -0.14340
string B core a angle 0.091700, core b angle 0.060450
```

Step by step:

1. Frame 0. Every core computes `angle` $= 0.10 + 0.01 \times (-0.20) = 0.098$, and the command $-2 \times 0.098 - 0.5 \times (-0.20) = -0.196 + 0.100 = -0.096$. All three strings agree; the judge passes $-0.096$.
2. Frame 2. Just before the step, bit 51 of core b's `angle` in string B flips. That is the top bit of the fraction part of the `double`. The angle was $0.0962$, which lies between $2^{-4} = 0.0625$ and $2^{-3}$, so that bit is worth $2^{-4}/2 = 0.03125$, and the angle drops to about $0.0650$.
3. Core b then commands $-2 \times 0.0635 - 0.5 \times (-0.15) \approx -0.052$, while core a commands $-0.1144$. The bits differ, so string B goes silent.
4. The judge sees A and C agree on $-0.11440$ and passes it. The actuator never saw $-0.052$ — a command less than half the right size.
5. B stays silent for the rest of the run, because its two copies of the state no longer match. The last line confirms it: the two angles differ by $0.091700 - 0.060450 = 0.03125$, exactly the flipped bit.

Sanity check: frames 0 and 1 are identical in all three strings, as they must be for identical code and inputs, and the judged column matches strings A and C in every frame, before and after the upset. The vehicle kept flying on two strings.
:::

What happens to a silent string afterwards — whether it is reset, reloaded from the healthy ones and brought back — has not been described in the public accounts, so this lesson does not guess. The simulation keeps it silent. The next module's lesson on fault detection, isolation and recovery treats that question in general.

## Why determinism makes the vote possible

The pair compares **bits**, not "close enough". That only works if a healthy core *always* produces exactly the same bits as its healthy partner. The property is **determinism**: the same program, given the same inputs, produces the same outputs, every time. Look back at the module through that lens, and most of it is a list of ways to lose determinism:

- **Data races** (lesson 2). A racing program has undefined behaviour. Two cores might see a torn value at different moments and disagree though nothing was upset.
- **Uninitialised reads.** A variable never set holds whatever was in that memory before. The two cores' leftovers differ, so their results can differ.
- **Thread scheduling.** If two threads race to update a result, or a thread pool (lesson 8) hands work out in whatever order threads become free, the order of operations changes from run to run. Flight code runs a fixed schedule: the same tasks, in the same order, every cycle.
- **Reading time or live data.** Each core reading the clock, or a value another thread is still writing, gets a slightly different input. Inputs must be captured once and given to both cores identically.
- **Heap addresses.** Sorting by pointer, or hashing addresses, depends on where the allocator put things. Allocation-free code (lesson 13) removes this too.
- **Floating-point order.** Floating-point addition is not associative: $(a + b) + c$ can differ from $a + (b + c)$ in the last bit. Add the same numbers in a different order and the answer can change.

That last one surprises people most, so here it is measured.

::: example The same eight numbers, added in two orders
Two cores sum the same eight accelerometer samples: one front to back, the other back to front.

```cpp
#include <array>
#include <bit>
#include <cstdint>
#include <cstdio>

int main() {
    // Eight accelerometer samples, m/s^2
    const std::array<double, 8> s = {9.81, 0.1, -9.7, 1e-3, 3.3, -0.07, 2.2e-4, 5.5};

    double forward = 0.0, backward = 0.0;
    for (int i = 0; i < 8; ++i)  forward  += s[i];   // core 1's order
    for (int i = 7; i >= 0; --i) backward += s[i];   // core 2's order

    std::printf("forward  = %.17g  bits %016llx\n", forward,
                (unsigned long long)std::bit_cast<std::uint64_t>(forward));
    std::printf("backward = %.17g  bits %016llx\n", backward,
                (unsigned long long)std::bit_cast<std::uint64_t>(backward));
    std::printf("bit-identical: %s, difference %.3g\n",
                forward == backward ? "yes" : "no", forward - backward);
}
```

Output:

```text
forward  = 8.9412200000000013  bits 4021e1e7967caea8
backward = 8.9412199999999995  bits 4021e1e7967caea7
bit-identical: no, difference 1.78e-15
```

Reading it:

1. The true sum is $8.94122$. Neither `double` is exactly that, because most decimals have no exact binary form, and each addition rounds.
2. The two orders round differently. The results differ by $1.78 \times 10^{-15}$, which is exactly one step of the last bit: the hex ends in `a8` and `a7`. That gap is called one **[[unit in the last place|last-place]]**.
3. No physics cares about $10^{-15}\,\mathrm{m/s^2}$. A self-checking pair does: comparing bits, it would call this a fault and silence a perfectly healthy string.

Sanity check: python3 gives the same two values for the same two orders, so this is ordinary IEEE 754 double arithmetic, not a compiler quirk. Run the program again and you get the same two lines — each order on its own is deterministic. The trouble starts only when the two cores do not use the same order.
:::

::: warning Do not fix this by comparing with a tolerance
It is tempting to let the pair accept results "within $10^{-9}$". Then an upset in a low bit passes unnoticed and slowly grows in an integrating filter, and choosing the tolerance becomes its own research project. The design wants bit equality, which means the code must be written for it: the same binary on both cores, the same inputs, a fixed order of every operation, no races, no uninitialised data. The next module's lesson on bit-exact determinism takes this further, across compilers and platforms.
:::

So the concurrency rules of this module are not only about avoiding crashes. A program with a benign-looking race, or a thread pool that finishes in a different order each time, would make a redundant system *less* reliable: its healthy strings would drop out on their own.

## Another answer to the same question: the Space Shuttle

The Space Shuttle solved a similar problem decades earlier, with different trade-offs. It carried **five** IBM AP-101 general-purpose computers. During critical phases, **four** of them formed a redundant set running the same primary flight software, the Primary Avionics Software System, and compared their outputs; a computer that disagreed with the others was voted out. The **fifth** ran the **Backup Flight System**, software written separately by a different team, so that one bug could not bring down all five — a guard against common-mode failure. The Shuttle's flight software was written mostly in a language called HAL/S. At the actuators, commands from the redundant computers drove the hydraulics together, and a single bad channel was overpowered by the others, a **[[force-fight|force-fight]]** vote in the hardware itself.

Compare the two designs:

| Question | Space Shuttle | SpaceX, as publicly described |
|---|---|---|
| Processors | Five AP-101 computers | Three dual-core commodity x86 |
| How a fault is caught | Computers compare with each other; the odd one is voted out | Each string's two cores compare; a mismatch makes it silent |
| Where the final choice is made | Actuators, by hydraulic force-fight | Actuator microcontrollers judge among commands |
| A bug in the main software | Separately written backup system | Pairs cannot catch it; public accounts describe no separate backup |

Both reach the same idea by different roads: never let one computer's wrong answer become the vehicle's action.

## Check yourself

::: check
A string's two cores agree, and the string sends a command. Can that command still be wrong? Give two different reasons it could be, and say which layer of the design catches each one.
:::

::: answer
Yes. First, a software bug: both cores run the same code, so they compute the same wrong answer and agree. No layer of the pair-and-judge design catches that; it is a common-mode failure, prevented by testing and review (the Shuttle added separately written backup software for exactly this). Second, both cores could receive the same wrong input, for example a bad sensor reading. They agree on a command computed from bad data. The pair cannot catch that either; it needs input checks, such as comparing redundant sensors, before the computation.
:::

::: check
Why does a self-checking string go silent on a mismatch instead of picking one core's answer?
:::

::: answer
With two results that disagree, there is no way to tell which is right: there is no majority of two. Picking one would be a coin toss, and half the time the string would send a corrupted command. Silence is always safe to receive, and it is easy for the actuator to notice. It makes each string fail-silent: correct output or none. The actuator's judge, with the other strings' commands, supplies the majority the pair lacks.
:::

::: check
In the simulation, the upset flipped bit 51 of a `double` near $0.0962$ and changed it by $0.03125$. Suppose instead bit 0, the lowest bit, had flipped. How big is that change? Would string B still go silent? Would a pair that accepts results within $10^{-9}$ of each other have noticed?
:::

::: answer
A `double` near $0.0962$ has power of two $2^{-4}$ and 52 fraction bits, so bit 0 is worth $2^{-4} \times 2^{-52} = 2^{-56} \approx 1.4 \times 10^{-17}$. Changing `51` to `0` in the program and running it gives exactly the same table: string B goes silent at frame 2. The last line now prints `0.091700` for both angles, because six decimals cannot show a $10^{-17}$ difference, but the bits differ, and the exact comparison saw it. A $10^{-9}$ tolerance would have accepted it, and the corrupted state would have lived on in that core. Exact comparison catches the smallest upset; a tolerance lets small ones through.
:::

::: check
A teammate speeds up the navigation filter by splitting a sum over 1,000 terms across four threads of a thread pool and adding the four partial sums as each thread finishes. Tests pass. Why is this dangerous in this architecture, and how would you fix it while keeping four threads?
:::

::: answer
The partial sums arrive in whatever order the threads finish, which varies from run to run and from core to core. Floating-point addition is not associative, so the final sum can differ in the last bit between the two cores of a string. The pair then sees a mismatch and a healthy string goes silent. With bad luck in all three strings, the vehicle loses its commands without any radiation at all. Fix: keep the four partial sums in four fixed slots and add them in a fixed order, slot 0 + slot 1 + slot 2 + slot 3, after all four have finished (for example after joining the futures in order). Each thread's own partial sum must also run over its terms in a fixed order.
:::

::: check
Someone says "the SpaceX design is triple modular redundancy: the three computers vote and the majority wins". What is right and what is wrong about that summary?
:::

::: answer
Right: there are three redundant strings, and the final command is the one they agree on. Wrong: the three computers do not vote with each other. Each string checks itself with its two cores and either sends a command or stays silent. The choice among the commands happens downstream, in the microcontrollers at the actuators, which judge the commands they receive. The difference matters because a faulty string is silent, not outvoted: the actuator never has to reject a wrong command, it just receives fewer right ones.
:::

## Summary

| Idea | Meaning | Rule or fact |
|---|---|---|
| Single-event upset | A particle flips a stored bit | The chip is not damaged; the data is |
| Rad-hard processor | Chip designed to resist upsets | Expensive and slow; SpaceX has said it flies commodity chips instead |
| Flight string | One computer with its inputs and outputs | Three strings, each a dual-core x86 running Linux, software in C++ |
| Self-checking pair | Two cores compare every result | Mismatch: the string issues no command (fail-silent) |
| Actor–judge | Strings act, actuator controllers judge | Actuator microcontrollers pick the agreed command among three |
| Flying on two | One string silent | The other two still agree; the vehicle continues |
| Determinism | Same inputs, same bits | Needs no races, no uninitialised reads, fixed schedules, fixed floating-point order |
| Common-mode failure | A fault shared by all copies | Pairs cannot catch it; the Shuttle used separately written backup software |
| Space Shuttle | Five AP-101 computers | Four in a voting set, one Backup Flight System |

This was the last lesson of the module. The next module, *Real-Time Constraints and Allocation-Free Flight Code*, turns the habits you practised here into **[[rules you can check|next-module]]**: worst-case execution time, static memory pools, bounded loops and stack depth, watchdogs and fault recovery, radiation effects and their software defences, and bit-exact determinism across compilers — the coding discipline that makes a design like this one flyable.

::: context seu One particle, one bit
A single-event upset happens when one energetic particle — a proton or heavy ion from the Sun or from deep space, or a neutron made by cosmic rays hitting the air — leaves a trail of charge through a transistor, and that charge flips a stored bit. "Single event" because one particle does it. The next module's lesson on radiation effects covers upsets alongside latch-up (a particle triggering a short circuit) and total dose (slow damage that builds up over years), with the software defences for each.
:::

::: context rad-hard What a hardened processor costs
The best-known radiation-hardened processor is BAE Systems' RAD750, a hardened version of a PowerPC 750 design. It flies on NASA's Curiosity and Perseverance rovers, among many spacecraft, and runs at up to about 200 MHz — far slower than an ordinary laptop chip of the same era or since. Hardened parts also cost far more, because they are made in small numbers and qualified at length. That price in speed and money is what the commodity-plus-voting approach avoids.
:::

::: context public-sources Where these facts come from
An "Ask Me Anything" is an open question-and-answer thread on the Reddit website, where the hosts answer questions typed by the public. Several SpaceX engineers have described their flight computers this way and in conference talks. These are the best public sources, but they are informal: short answers, not design documents. That is why this lesson states only what was said, uses "publicly described as" for details like the actuator processors, and leaves out numbers that different accounts give differently.
:::

::: context string-word Not that kind of string
In avionics, a **string** is one complete chain: a computer plus the sensors, buses and outputs that belong to it, able to fly the vehicle on its own. Nothing to do with `std::string`. "Three strings" means three such chains side by side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <rect x="16" y="14" width="150" height="46" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="24" y="32">string A</text><text x="24" y="50">core a = core b ?</text>
    <rect x="16" y="76" width="150" height="46" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
    <text x="24" y="94" fill="#b4232c">string B</text><text x="24" y="112" fill="#b4232c">mismatch: silent</text>
    <rect x="16" y="138" width="150" height="46" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="24" y="156">string C</text><text x="24" y="174">core a = core b ?</text>
    <rect x="236" y="70" width="110" height="58" fill="#f2b880" stroke="#1f2a44"/>
    <text x="246" y="94">actuator</text><text x="246" y="112">judge</text>
  </g>
  <line x1="166" y1="37" x2="236" y2="86" stroke="#1f2a44" stroke-width="2"/>
  <line x1="166" y1="99" x2="236" y2="99" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="166" y1="161" x2="236" y2="112" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="94" font-size="11" fill="#b4232c">nothing</text>
</svg>
```
:::

::: context fail-silent Words for how things fail
Engineers sort failures by what the outside world sees. A **fail-silent** unit stops producing output when it detects its own fault. A **fail-operational** system keeps working after a failure; a **fail-safe** one goes to a safe state. The Space Shuttle's avionics requirement is often summed up as "fail operational, fail safe": after one computer failure, keep flying normally; after a second, still land safely. Designs are described by how many failures they can absorb before each of those states.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="40" width="96" height="50" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="62" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">fail-silent</text>
  <text x="62" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">unit</text>
  <line x1="110" y1="55" x2="196" y2="22" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="65" x2="196" y2="65" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="75" x2="196" y2="108" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="204" y="26" font-size="12" fill="#1d6fd1">correct output: allowed</text>
  <text x="204" y="69" font-size="12" fill="#1f2a44">no output: allowed</text>
  <text x="204" y="112" font-size="12" fill="#b4232c">wrong output: never</text>
  <line x1="200" y1="104" x2="340" y2="116" stroke="#b4232c" stroke-width="1.5"/>
</svg>
```
:::

::: context common-mode When all the backups fail the same way
The classic example is Ariane 5's first flight in 1996. Its two inertial reference units, primary and backup, ran identical software. About 37 seconds after lift-off, both hit the same unhandled error converting a 64-bit floating-point value into a 16-bit integer, and both shut down within moments of each other. Redundant hardware gave no protection, because the fault was in the design, copied into both. The rocket broke up. Redundancy guards against random faults; a common-mode fault needs diversity or, better, not being there.
:::

::: context last-place The last bit of a double
A `double` stores a sign, an 11-bit exponent and a 52-bit fraction. The gap between neighbouring doubles near a value $x$ is one **unit in the last place**, or ulp: $2^{-52}$ times the power of two at or below $x$. Near $8.94$ that power is $2^3 = 8$, so one ulp is $8 \times 2^{-52} = 2^{-49} \approx 1.78 \times 10^{-15}$ — exactly the difference the example printed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="60" y1="50" x2="60" y2="70"/><line x1="140" y1="50" x2="140" y2="70"/>
    <line x1="220" y1="50" x2="220" y2="70"/><line x1="300" y1="50" x2="300" y2="70"/>
  </g>
  <circle cx="140" cy="60" r="6" fill="#1d6fd1"/>
  <circle cx="220" cy="60" r="6" fill="#b4232c"/>
  <line x1="194" y1="42" x2="194" y2="78" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <text x="194" y="36" font-size="11" text-anchor="middle" fill="#6c7a93">true 8.94122</text>
  <text x="140" y="92" font-size="11" text-anchor="middle" fill="#1d6fd1">…aea7 backward</text>
  <text x="228" y="92" font-size="11" text-anchor="middle" fill="#b4232c">…aea8 forward</text>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#1f2a44">neighbouring doubles, 1 ulp = 1.78e-15 apart</text>
</svg>
```
:::

::: context force-fight Voting with muscle
On the Shuttle, several computers' commands drove the same actuator at once through separate hydraulic channels. If one channel was driven wrongly, the others pushed against it and won, and the faulty channel could then be detected and switched off. The vote happened in the hydraulics rather than in software. It is the same instinct as the SpaceX actuator judge: make the final choice as close to the hardware as possible, after every computer has had its say.
:::

::: context next-module What the next module adds
This module showed *why* a flight loop must be predictable and deterministic. The next one, *Real-Time Constraints and Allocation-Free Flight Code*, is about *proving* it: measuring and bounding worst-case execution time, replacing the heap with pools sized at build time, bounding every loop and the stack, watchdogs and recovery from faults, and making results bit-exact even across compilers. It closes with the coding standards — the NASA/JPL Power of Ten, MISRA C++ and JSF++ — that write these habits down as rules a tool can check.
:::
