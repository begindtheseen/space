---
id: l05-verification-and-fault-tolerant-computers
title: Verifying flight software and building a computer that survives faults
minutes: 18
covers:
  - Engineering system design: GNC simulation infrastructure for a constellation; a telemetry pipeline for six thousand satellites; how you would verify this flight software; how you would architect a fault-tolerant flight computer
  - Knowing the SpaceX answer: three dual-core x86 flight strings, per-string core cross-check, PowerPC actuator controllers judging three commands
---

Think about how a new bridge is checked before cars drive on it. Engineers test each steel beam in a lab. Then they check the drawings against the building code, line by line. Then they load the finished bridge with heavy trucks and measure how far it bends. No single check is enough. A beam can be perfect while the drawing is wrong; the drawing can be right while a bolt was never tightened. Confidence comes from a stack of different checks, each catching what the others miss.

Now think about a car with two brake circuits. If one springs a leak, the other still stops the car. The designers did not try to build one brake that can never fail. They built two ordinary ones and arranged them so a single failure is survivable.

This lesson is about both ideas, in the form an interviewer asks them. "How would you verify this flight software?" is the bridge question: a stack of checks. "How would you architect a fault-tolerant flight computer?" is the brake question: survive a failure instead of hoping it never happens. Last lesson you designed a simulation system and a telemetry pipeline; these are the other two prompts from the same system-design topic.

## Verification: a ladder of checks

**Verification** means gathering evidence that the software does what its requirements say. The key word is *evidence*: something another engineer can inspect, not "I ran it and it looked fine".

A strong answer climbs a ladder. Each rung puts the code in a setting closer to real flight and closes a gap the rung below left open.

### Unit tests with meaningful tolerances

A **unit test** checks one small piece — one function, one class — on its own, with known inputs and expected outputs. For GNC code the outputs are floating-point numbers, so the test compares with a **[[tolerance|why-tolerances]]**: an allowed difference, chosen for a reason.

Here is the reason tolerances are needed. Rotating the point $(1, 0)$ by a quarter turn should give $(0, 1)$. The computer gives something a hair away from zero:

```python
import math

def rotate_z(x, y, angle_rad):
    c, s = math.cos(angle_rad), math.sin(angle_rad)
    return c * x - s * y, s * x + c * y

def test_quarter_turn():
    x, y = rotate_z(1.0, 0.0, math.pi / 2)
    print(x, y)                                   # 6.123233995736766e-17 1.0
    assert math.isclose(x, 0.0, abs_tol=1e-12)    # an exact x == 0.0 would fail
    assert math.isclose(y, 1.0, rel_tol=1e-12)

test_quarter_turn()
print("passed")                                   # passed
```

The $x$ value is about $6 \times 10^{-17}$, not $0$, because $\pi/2$ cannot be stored exactly. A test demanding exact zero would fail on correct code. A **meaningful** tolerance is one you can justify: far smaller than any error that matters, far larger than rounding noise.

### MIL, SIL, PIL and HIL

After unit tests, the whole control system is tested in a simulated world, four times, each closer to flight. The names all end in "in the loop", meaning the thing under test sits inside a closed loop with a simulated vehicle: it reads fake sensors and its commands move the fake vehicle.

- **Model-in-the-loop (MIL).** The controller is still a model — a Simulink diagram, say — running against the simulated vehicle. It checks the *design*: is the control law right?
- **Software-in-the-loop (SIL).** The controller is now real code (hand-written or generated from the model) compiled for a desktop computer. It checks the *code*: does it match the model?
- **Processor-in-the-loop (PIL).** The same code, compiled with the flight compiler, runs on the real flight processor, still talking to the simulation. It checks *compiler and processor effects*: timing, number formats, memory.
- **Hardware-in-the-loop (HIL).** The real flight computer, with its real input and output wiring, is connected to a simulator that pretends to be the sensors and actuators. It checks the *integration*: real interrupts, real buses, real timing.

The **[[ladder|xil-ladder]]** matters because each rung catches a different class of bug. A wrong gain shows up in MIL. A sign flipped during coding shows up in SIL. A float that behaves differently on the flight chip shows up in PIL. A cable wired to the wrong pin shows up only in HIL.

### Structural coverage, including MC/DC

**Structural coverage** measures how much of the code's structure your tests actually exercised. The weakest kind, **statement coverage**, asks whether each line ran at least once. Stronger kinds look inside decisions.

A **decision** is an `if` test as a whole. A **condition** is one true-or-false piece inside it. In

$$
\text{fire} = A \land (B \lor C)
$$

read $\land$ as "and" and $\lor$ as "or". Here $A$, $B$ and $C$ are three conditions and the whole expression is one decision. Picture it as a thruster firing rule: $A$ = "thrusters armed", $B$ = "attitude error too large", $C$ = "ground commanded a burn".

**MC/DC**, **[[modified condition/decision coverage|mcdc-where]]**, demands that for every condition, you show a pair of tests where *only that condition changes* and the decision's outcome changes with it. That proves each condition independently affects the result — none is dead, masked or wired backwards.

::: example Counting MC/DC test cases
Take $\text{fire} = A \land (B \lor C)$. Write true as $1$ and false as $0$.

**All combinations.** Three conditions, each $0$ or $1$, give $2^3 = 8$ rows. Exhaustive testing would need all $8$.

**Pick pairs.** Start from test T1: $A=1, B=1, C=0$, which fires ($1 \land (1 \lor 0) = 1$).

- For $A$: flip only $A$. T2: $A=0, B=1, C=0$ gives $0$. Outcome changed, so $A$ is shown to matter.
- For $B$: flip only $B$ from T1. T3: $A=1, B=0, C=0$ gives $1 \land (0 \lor 0) = 0$. Changed, so $B$ matters.
- For $C$: flip only $C$ from T3. T4: $A=1, B=0, C=1$ gives $1 \land (0 \lor 1) = 1$. Changed, so $C$ matters.

**Count.** T1 to T4: four test cases cover MC/DC, instead of eight. The outcomes are $1, 0, 0, 1$, so plain **decision coverage** (the whole `if` seen both true and false) is also met.

**The general rule.** For $N$ conditions, MC/DC needs at least $N + 1$ tests, while exhaustive testing needs $2^N$. At $N = 10$ that is $11$ against $1024$; at $N = 20$ it is $21$ against $1\,048\,576$.

**Sanity check.** Could fewer than four work? Each condition needs its own flipped pair, and the first pair needs two tests; each later condition adds at least one new test. So $3 + 1 = 4$ is the floor.
:::

::: warning High coverage is not correct code
Coverage says which code your tests *ran*, not whether the answers were *right*. A test that calls every function and checks nothing reaches 100% statement coverage. Coverage finds untested code; tolerances, requirements and review decide whether the tested code is correct.
:::

### Requirements traceability

**Requirements traceability** is a chain of links: each requirement points to the code that implements it and the tests that verify it, and each test points back to a requirement. It answers two audit questions. Is every requirement tested? Does every piece of code exist for a reason? Without the links, "we tested it" is a claim. With them, it is **auditable** — someone who was not there can check it.

### Monte Carlo, fault injection and independent review

**Monte Carlo dispersion**, from last lesson, runs the closed loop thousands of times with uncertain inputs spread over their realistic ranges. It shows the software works across the whole cloud of possible vehicles, not only the nominal one.

**[[Fault injection|fault-injection]]** deliberately breaks things during a run: a sensor freezes, a thruster sticks open, a message arrives corrupted. It checks that the fault-handling code — the code that runs least often in normal testing — actually works.

**[[Independent review|independent-review]]** means someone who did not write the code examines it and its evidence. Authors share their own blind spots; a fresh reader does not.

::: key How would you verify this flight software? (card int02_c6)
Unit tests with meaningful tolerances, then model-in-the-loop, software-in-the-loop, processor-in-the-loop and hardware-in-the-loop, with structural coverage including MC/DC, requirements traceability, Monte Carlo dispersion, fault injection and independent review.
:::

Say *why* each rung is there. Each one closes a gap the others leave open, and the traceability and coverage records are what turn a story into evidence.

## Fault tolerance: two ways to survive radiation

In space, a fast charged particle can pass through a chip and flip a bit — a $0$ becomes a $1$. This is a **single-event upset**. It is not permanent damage; the chip is fine afterwards. But if the flipped bit was in a register holding a thruster command, the command is wrong.

There are two broad answers.

**Make the parts tougher.** **[[Radiation-hardened|rad-hard]]** ("rad-hard") processors are designed and built so that particles rarely flip bits. They work, but they are expensive, slow, and usually generations behind ordinary chips.

**Assume parts will fail, and catch it.** Use ordinary, fast, cheap processors, several of them, and compare their answers. This is **redundancy with cross-checking**. A wrong answer is caught because it disagrees with a right one.

### Detecting versus deciding

Two different jobs are hidden here.

**Detecting** a fault needs two copies. If two cores compute the same thing and get different answers, something is wrong — but you cannot tell which one.

**Deciding** which answer is right needs three or more copies. If three agree two-to-one, the odd one out is probably wrong. This is **voting**.

### The reported SpaceX answer

The architecture reported for SpaceX uses both jobs, at two levels. It is sometimes called an **Actor-Judge** design.

- There are three **[[flight strings|strings]]**. A string is one complete, independent flight computer. Each has a **dual-core x86** processor — an ordinary processor family of the kind found in desktop computers, with two cores.
- Inside each string, both cores compute the command and compare. If they agree, the string sends its command. If they disagree, the string **issues no command at all**. A string is either right or silent; it never shouts a wrong answer. Engineers call this **fail-silent**.
- At the actuators — the engines, valves and fins that move the vehicle — sit **PowerPC** microcontrollers. Each receives the three commands, one from each string, and **judges** among them before acting.

So a bit flip in one core is *detected* inside its string, which goes quiet. The actuator controller then *decides* using the commands it still receives. Commodity x86 parts can fly because no single part has to be trustworthy on its own.

::: key The fault-tolerant flight computer (card int02_c4)
Redundancy with cross-checking rather than rad-hard parts: three dual-core x86 flight strings, each comparing its two cores and issuing no command on disagreement, and PowerPC microcontrollers at the actuators judging among the three commands they receive. Citing it shows you did the homework.
:::

::: warning Redundancy that is not independent
Running the same code twice on one core and comparing catches some glitches, but a fault in that core, its memory or its power supply hits both runs the same way. Real redundancy needs separate hardware. The same logic explains why voting belongs at the actuators on the vehicle, not somewhere on the ground: it has to act in the moment, where the command is used.
:::

### A probability sketch

Numbers make the point. The figures below are **illustrative** — invented for the sketch, not anyone's real failure rates.

::: example Illustrative: how likely is it that strings fail together?
Suppose one string fails at a rate of $\lambda = 10^{-4}$ per hour (read $\lambda$ as "lambda"; it is a failure rate), and the flight lasts $t = 10$ hours. Assume the three strings fail **independently** — one failing does not make another more likely.

**One string.** The chance a single string fails during the flight is
$$
p = 1 - e^{-\lambda t} = 1 - e^{-10^{-4} \times 10} = 1 - e^{-0.001} \approx 9.995 \times 10^{-4},
$$
about one in a thousand. (For small $\lambda t$, $p \approx \lambda t$.)

**Two or more of three.** Exactly two fail in $3$ ways (strings 1 and 2, 1 and 3, or 2 and 3), each with chance $p^2(1-p)$. All three fail with chance $p^3$. So
$$
P(\ge 2) = 3p^2(1-p) + p^3 \approx 3.0 \times 10^{-6}.
$$

**All three.** $P(3) = p^3 \approx 1.0 \times 10^{-9}$.

**Reading it.** If the judge needed two healthy strings, the chance of losing command drops from about one in a thousand to about three in a million. If a single healthy string is enough — plausible when failed strings go silent rather than lie — it drops to about one in a billion. Either way, redundancy buys factors of a thousand or more.

**Sanity check.** $3.0 \times 10^{-6}$ is about $3p^2$, as it should be when $p$ is small, since the $p^3$ term and the $(1-p)$ correction are tiny.
:::

::: note Why it has to be true
Each string is up or down, like a coin that lands "failed" with chance $p$. For independent coins the chance of any specific pattern is the product: strings 1 and 2 down and string 3 up has chance $p \cdot p \cdot (1-p)$. There are $\binom{3}{2} = 3$ patterns with exactly two down, all with the same chance, so exactly two down has chance $3p^2(1-p)$. The one pattern with all three down has chance $p^3$. These patterns cannot happen at the same time, so their chances add. The single-string formula $p = 1 - e^{-\lambda t}$ comes from a constant failure rate: the chance of surviving each short moment multiplies up to $e^{-\lambda t}$.
:::

The big weakness of this sketch is the word *independently*. A **[[common-cause failure|common-cause]]** — one bug in the software all three strings run, one power surge, one bad batch of chips — can take out all three at once, and then the tiny numbers are meaningless. Saying that out loud in an interview is worth as much as the arithmetic.

## Check yourself

::: check
Give one kind of bug that SIL testing would catch but MIL testing would not, and one that only HIL would catch.
:::

::: answer
MIL runs the model, not the code. So a mistake made while turning the model into code — a flipped sign, a gain typed wrongly, a wrong unit conversion — only appears once the real code runs, in SIL. HIL is the first rung with the real flight computer and its wiring, so a sensor cable on the wrong pin, a bus that is slower than assumed, or an interrupt that arrives late is caught only there.
:::

::: check
For the decision $A \lor B$ (two conditions), write a minimal MC/DC test set and say how many tests it has.
:::

::: answer
Start with $A=0, B=0$, which gives $0$. Flip only $A$: $A=1, B=0$ gives $1$, so $A$ matters. Flip only $B$ from the first test: $A=0, B=1$ gives $1$, so $B$ matters. Three tests: $(0,0)$, $(1,0)$, $(0,1)$. That is $N + 1 = 3$ for $N = 2$. The fourth combination, $(1,1)$, is not needed.
:::

::: check
Your test suite reaches 100% statement coverage. A reviewer says that proves nothing about correctness. Is she right? What would you add?
:::

::: answer
She is right. Statement coverage shows every line ran, not that the results were checked. You would add assertions with justified tolerances, MC/DC so each condition's effect is shown, and requirements traceability so each requirement has a test that checks its specific behaviour.
:::

::: check
In the three-string design, a radiation particle flips a bit in one core of string 2. Trace what happens, step by step, until an engine valve moves.
:::

::: answer
String 2's two cores now compute different commands. The cross-check inside string 2 sees the disagreement, so string 2 sends no command. Strings 1 and 3 are unaffected: each of their core pairs agrees, and each sends its command. The PowerPC controller at the valve receives commands from strings 1 and 3 and nothing from string 2, judges among what it received, and acts. The valve moves correctly. The bad bit never left string 2.
:::

::: check
Redo the illustrative probability with $p = 0.01$ per string. Find $P(\ge 2 \text{ fail})$ and $P(\text{all } 3 \text{ fail})$, and say what assumption makes both numbers too optimistic.
:::

::: answer
$P(\ge 2) = 3(0.01)^2(0.99) + (0.01)^3 = 0.000297 + 0.000001 = 0.000298$, about $3.0 \times 10^{-4}$. $P(3) = (0.01)^3 = 10^{-6}$. Both assume the strings fail independently. A common cause — shared software, shared power, a shared manufacturing defect — can fail several strings together, so real risk is higher than these products.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Verification | evidence that software meets its requirements, from a stack of different checks |
| Tolerance | allowed difference, justified: above rounding noise, below any error that matters |
| MIL, SIL, PIL, HIL | model, desktop code, flight processor, real flight hardware, each in a simulated loop |
| MC/DC | each condition shown to change the decision alone; at least $N + 1$ tests versus $2^N$ |
| Traceability | requirement to code to test and back; makes the argument auditable |
| Fault injection | break things on purpose to exercise fault-handling code |
| Rad-hard versus redundancy | tough slow parts, or ordinary fast parts cross-checked |
| Reported SpaceX design | three dual-core x86 strings, each silent on core disagreement; PowerPC actuator controllers judge three commands |
| Two-of-three failure | $3p^2(1-p) + p^3$, if strings fail independently |

Next lesson turns to the domain rounds a GNC candidate faces — control, orbit determination, frequency response and drag — and to estimating anything out loud.

::: context why-tolerances Computers round
A computer stores numbers in a fixed number of binary digits, so most decimals are stored as the nearest value it can hold. In Python, `0.1 + 0.2` gives `0.30000000000000004`. Each operation can add a rounding error around $10^{-16}$ of the number's size. Long GNC calculations stack thousands of operations, so exact equality is the wrong test. The right test asks whether two numbers are close enough for the physics, which is what a tolerance states.
:::

::: context xil-ladder Four rungs, each closer to flight
Each rung swaps one simulated thing for a real one. The vehicle and its world stay simulated throughout; only the controller side gets more real.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="130" width="150" height="28" fill="#fff"/>
    <rect x="60" y="95" width="150" height="28" fill="#fff"/>
    <rect x="100" y="60" width="150" height="28" fill="#8fb8f0"/>
    <rect x="140" y="25" width="150" height="28" fill="#1d6fd1"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="28" y="148">MIL: model of controller</text>
    <text x="68" y="113">SIL: real code, desktop</text>
    <text x="108" y="78">PIL: flight processor</text>
  </g>
  <text x="148" y="43" font-size="11" fill="#fff">HIL: flight computer</text>
  <line x1="320" y1="155" x2="320" y2="30" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="320,22 314,34 326,34" fill="#6c7a93"/>
  <text x="332" y="95" font-size="11" fill="#6c7a93" transform="rotate(-90 332 95)" text-anchor="middle">closer to flight</text>
</svg>
```

Moving up costs more per run, so the cheap lower rungs run thousands of times and HIL runs fewer, targeted cases.
:::

::: context mcdc-where Where MC/DC comes from
MC/DC is best known from aviation. DO-178C, the standard used to certify software on airliners, requires it for the most critical software, where a failure could be catastrophic. It was chosen as a middle path: much stronger than checking each branch once, far cheaper than testing every combination. Space programs borrow the same idea for flight code, and interviewers use the term to see whether you know verification beyond "we had unit tests".
:::

::: context fault-injection Breaking things on purpose
Fault handling is the code that runs almost never in normal tests — which makes it the code most likely to be broken on the day it is needed. Fault injection forces it to run. In simulation you can freeze a gyro reading, add a large bias, drop every third message, or make a thruster produce half its thrust. On a HIL bench you can pull a connector or corrupt bytes on a data bus. Each injected fault is a test with an expected response written down in advance.
:::

::: context independent-review A second pair of eyes, on purpose
NASA has a whole program for this, called independent verification and validation (IV&V), where a separate team checks mission software. The key word is *independent*: the reviewer should not share the author's assumptions, schedule pressure or boss. Even a light version — a teammate who did not write the code reading the code, the tests and the coverage report — catches mistakes the author cannot see, because the author reads what they meant to write.
:::

::: context rad-hard What makes a chip radiation-hardened
Rad-hard chips use special manufacturing processes, larger transistors that need more charge to flip, and extra circuits that detect and correct flipped bits in memory. Each design takes years to develop and qualify for space, and relatively few are sold, so they cost far more and lag well behind the speed of ordinary processors. That speed gap is the reason cross-checked ordinary processors are attractive: you get modern performance and handle upsets by design instead of by material.
:::

::: context strings Three strings, two cores each
A string is one complete flight computer. Each compares its own two cores; the actuator controllers listen to all three.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="15" y="15" width="120" height="44"/>
    <rect x="15" y="75" width="120" height="44"/>
    <rect x="15" y="135" width="120" height="44"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="25" y="25" width="40" height="24"/><rect x="85" y="25" width="40" height="24"/>
    <rect x="25" y="85" width="40" height="24"/><rect x="85" y="85" width="40" height="24"/>
    <rect x="25" y="145" width="40" height="24"/><rect x="85" y="145" width="40" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="41">core</text><text x="105" y="41">core</text>
    <text x="45" y="101">core</text><text x="105" y="101">core</text>
    <text x="45" y="161">core</text><text x="105" y="161">core</text>
    <text x="75" y="12">string 1</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="135" y1="37" x2="240" y2="90"/>
    <line x1="135" y1="97" x2="240" y2="97"/>
    <line x1="135" y1="157" x2="240" y2="104"/>
  </g>
  <rect x="240" y="72" width="105" height="50" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="292" y="93" font-size="11" text-anchor="middle" fill="#1f2a44">actuator judge</text>
  <text x="292" y="109" font-size="11" text-anchor="middle" fill="#1f2a44">(PowerPC)</text>
  <text x="185" y="190" font-size="11" text-anchor="middle" fill="#6c7a93">a string whose cores disagree sends nothing</text>
</svg>
```
:::

::: context common-cause When all three fail at once
The most famous example is Ariane 5's first flight in 1996. Its two inertial reference computers ran the same software, and both hit the same number-conversion error within moments of each other, so the backup and the primary failed in exactly the same way and the rocket was lost. Redundant hardware running identical software protects against random hardware faults, not against a shared design mistake. That is why the verification ladder earlier in this lesson matters even for a triple-redundant computer.
:::
