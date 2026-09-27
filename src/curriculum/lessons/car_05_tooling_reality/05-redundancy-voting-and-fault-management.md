---
id: l05-redundancy-voting-and-fault-management
title: "Redundancy, voting, and fault management"
minutes: 19
covers:
  - redundancy, voting and fault management as first-class design concerns
---

Think about how a long car trip goes wrong. You would not set out across a desert with no spare tire, and a sensible driver also checks the spare is inflated before leaving. Having the backup is only half the plan. The other half is noticing the flat, knowing which wheel it is, and actually changing it.

The previous lesson assumed the flight computer works. This one starts from the fact that, eventually, on some flight, a specific unit will not. A sensor will drift. A computer will glitch. A connector will fail. None of that is a design defect. It is what physical hardware does when it runs long enough, in a harsh enough place, that rare events stop being rare. **Redundancy** (having more than one of something), **voting** (combining those copies into one answer) and **fault management** (noticing and handling failures) exist because the vehicle still has to behave correctly when that happens.

The module lists these as **[[first-class|first-class]]** design concerns. That phrase does specific work. It means the question "what happens when this fails?" is asked while the architecture is still being decided — how many flight computers, how many of each sensor, how one final command gets chosen when sources disagree. It is not asked afterward, as a separate pass over a finished design. A system designed this way looks different from day one. It has more than one of each thing that must not silently fail, and it has an explicit, tested answer for what happens when one of them does.

## Voting: turning several imperfect answers into one trustworthy one

Start with the simplest version of the problem. You have three sensors measuring the same thing. Each has a little ordinary noise. Then one develops a fault and starts reporting something wrong. What single number should the rest of the system use?

Picture three friends guessing the time without a clock. Two say "about ten past three." The third, whose watch has stopped, says "noon." You would not average the three guesses — that gives an answer nobody believes. You would go with the two who agree.

That is the whole idea. A plain **average** gives every input equal weight, including the broken one. A single badly wrong sensor pulls the average toward itself, by an amount that grows with how wrong it is, with no limit.

**Voting** does something different. The simplest vote for three numbers is the **[[median|median-of-three]]** — the middle value once you sort them. As long as two of the three sources still agree, the median tracks that agreeing pair almost exactly. The third source is effectively ignored, however far it drifts.

::: example A drifting sensor, voted out
The true value is $118.4$. Two healthy sensors read it with small noise. The third develops a bias fault that grows over time. Here are four snapshots, taking the median and the average of each:

```python
import numpy as np
true_value = 118.4
readings = [
    (118.308, 118.520, 124.400),   # snapshot 1: sensor 3 already biased high
    (118.475, 118.409, 124.700),   # snapshot 2
    (118.294, 118.286, 125.300),   # snapshot 3
    (118.407, 118.432, 126.500),   # snapshot 4: fault has grown further
]
for s1, s2, s3 in readings:
    med = float(np.median([s1, s2, s3]))
    avg = float(np.mean([s1, s2, s3]))
    print(f"s3={s3:8.3f}  median={med:8.3f}  average={avg:8.3f}")
# s3= 124.400  median= 118.520  average= 120.409
# s3= 124.700  median= 118.475  average= 120.528
# s3= 125.300  median= 118.294  average= 120.627
# s3= 126.500  median= 118.432  average= 121.113
```

Work out the errors against $118.4$ for the first row by hand. Median: $118.520 - 118.4 = 0.120$. Average: $(118.308 + 118.520 + 124.400)/3 = 361.228/3 = 120.409$, so the error is $2.009$.

Across all four rows, the median's errors are $0.120, 0.075, 0.106, 0.032$. The worst is $0.12$ — about the size of ordinary sensor noise. The average's errors are $2.009, 2.128, 2.227, 2.713$. The worst is $2.713$, more than twenty times larger ($2.713 / 0.12 \approx 22.6$), and it keeps growing as sensor 3 drifts.

Sanity check: the average's error should be about one third of sensor 3's bias, since sensor 3 is one of three equal votes. In the last row the bias is $126.5 - 118.4 = 8.1$, and $8.1/3 = 2.7$. It matches.

Notice what the median does *not* do. It never looks at which sensor is which. It has no idea sensor 3 is broken. It reflects whatever value two of the three agree on — and that is exactly what makes it robust to one bad input.
:::

Taking the median is only one shape of the idea. Some designs compare every pair of sources and explicitly flag whichever one disagrees with the rest. The principle is the same. With enough independent sources, and a rule that favors agreement over any single input, one faulted source can no longer corrupt the answer by itself.

## What redundancy buys you, in numbers — and the assumption underneath

You can put a number on redundancy's benefit, if you make one assumption: **each unit fails independently of the others**, with the same probability $p$ (a number between $0$ and $1$) over some stretch of time.

- **Simplex** — one unit, no backup. The system fails whenever that unit fails:

$$
P(\text{fail}) = p
$$

- **Triplex, 2-of-3 voting** — three units, and the vote is right as long as at least two agree. The system fails only if two or more units fail. There are $\binom{3}{2} = 3$ ways to pick which two fail (read $\binom{3}{2}$ as "three choose two"), each with probability $p^2(1-p)$, plus $\binom{3}{3} = 1$ way for all three to fail, with probability $p^3$:

$$
P(\text{fail}) = \binom{3}{2}p^2(1-p) + \binom{3}{3}p^3
$$

Multiply it out and it tidies to $3p^2 - 2p^3$. For small $p$ the $p^3$ part is tiny, so the answer is close to $3p^2$. That squared $p$ is the whole story: squaring a small number makes it far smaller.

::: note Why the formula counts it this way
"At least two fail" splits into two cases that cannot both happen: exactly two fail, or exactly three fail. So their probabilities add. For "exactly two," pick the pair — units $\{1,2\}$, $\{1,3\}$ or $\{2,3\}$ — which is $\binom{3}{2} = 3$ choices. For each choice the two chosen units fail (probability $p \cdot p$) and the third survives (probability $1-p$). Multiplying is allowed only because we assumed the units fail independently. Hold on to that — it is where the trouble comes from later.
:::

::: example How much does voting actually buy, assuming independence?
Two illustrative values of $p$. These show the arithmetic; they are not a claim about any real vehicle's failure rate.

```python
import math

def triplex_fail(p):
    return math.comb(3, 2)*p**2*(1-p) + math.comb(3, 3)*p**3

for p in (0.02, 0.001):
    simplex = p
    triplex = triplex_fail(p)
    print(f"p={p:6.4f}  simplex={simplex:.6f}  triplex-2-of-3={triplex:.8f}  ratio={simplex/triplex:,.1f}x")
# p=0.0200  simplex=0.020000  triplex-2-of-3=0.00118400  ratio=16.9x
# p=0.0010  simplex=0.001000  triplex-2-of-3=0.00000300  ratio=333.6x
```

Check the first row by hand. With $p = 0.02$: $3 \times 0.02^2 \times 0.98 = 3 \times 0.0004 \times 0.98 = 0.001176$, and $0.02^3 = 0.000008$. The sum is $0.001184$. The ratio is $0.02 / 0.001184 \approx 16.9$.

Second row: $3 \times 0.001^2 \times 0.999 + 0.001^3 \approx 0.000002998$, which prints as $0.00000300$. The ratio is about $334$ — more than two **[[orders of magnitude|orders-of-magnitude]]**.

Look at the trend. When the units got twenty times more reliable (from $0.02$ to $0.001$), the benefit of voting grew from about $17\times$ to about $334\times$. Redundancy is most valuable exactly when each unit is already fairly reliable — which is the range real flight hardware is designed to live in.
:::

### Common-mode failures: where the numbers lie

That whole calculation rests on the one assumption stated at the start: independence. Real failures are not always independent, and the ones that are not are the genuinely hard part of this problem.

A **[[common-mode failure|ariane-501]]** is a single root cause that defeats more than one redundant unit at once. Examples:

- three sensors from the same manufacturing batch, sharing the same hidden flaw;
- three computers fed by one power supply, which fails;
- three identical copies of software, sharing the same bug;
- a burst of **[[radiation|single-event-upset]]** — a well-documented hazard for electronics above most of the atmosphere's shielding — flipping bits in more than one unit within the same short window.

Against a common-mode failure, tripling the hardware buys nothing. The arithmetic assumed three unrelated failures, and a common-mode event makes them closely related. So real fault-tolerant design spends effort on **diversity** where it can — different batches, separate power, sometimes different designs — and on hardware and software built to detect or tolerate a single cause with many symptoms. The redundancy count is necessary. By itself it is not sufficient.

::: key
Voting converts several imperfect, redundant measurements or computations into one trustworthy answer by favoring agreement over any single disagreeing input; a plain average does the opposite; a triplex 2-of-3 architecture can reduce system-level failure probability by orders of magnitude versus a single unit, assuming failures are independent — and that assumption, not the redundancy count, is where common-mode failures do their damage.
:::

On real vehicles this is not theory. Publicly described flight-computer designs, from the [[Space Shuttle to Dragon|real-voting]], vote across several computers so that one misbehaving unit is outvoted rather than obeyed.

## Fault management: detect, isolate, recover

Redundant hardware and a voting rule are still not enough on their own. Something has to notice a fault, work out which unit caused it, and decide what to do next. This is usually split into three capabilities, known together as **FDIR** (said "F-D-I-R": fault detection, isolation and recovery). Each can fail on its own even if the other two work.

**Detection** is noticing that something is wrong at all. A vote that does not agree cleanly. A reading outside what is physically possible. A **checksum** — a small number computed from a block of data to reveal corruption — that does not match. A system with excellent redundant hardware and no detection will keep using a faulted unit's output forever, because nothing is watching for the disagreement.

**Isolation** is working out *which* unit is at fault, not only that there is a disagreement. "The three sensors disagree" is not the same as "sensor 3 is wrong." Isolation lets the system stop trusting the faulted unit specifically, instead of guessing, or distrusting everything.

**Recovery** is deciding what to do once the fault is isolated. Keep going on the remaining good units. Switch to a backup. Or, if the fault is severe enough, command the vehicle into a **[[safe, well-understood configuration|safe-mode]]** instead of pressing on with degraded information. Recovery is a specific, designed decision for each class of fault — not a generic "figure it out."

### Proving it works: inject the fault

All three must be deliberately designed, and — equally important — deliberately tested. A fault-management path that has never been exercised by a real injected fault is not verified. It is in the same position as a simulation with no verification case, back in the lesson on reading someone else's simulation: a plausible-looking design is not a demonstrated one.

So engineers practice **[[fault injection|fault-injection]]**. During testing they force a specific, realistic fault — a sensor stuck at one value, a computer that stops responding — and confirm that detection fires, isolation picks the right unit, and recovery does what the design says. That is how this part of the system earns the same trust a control loop's timing budget earns in the previous lesson.

::: warning Redundant hardware without fault management is not fault tolerance
Three sensors wired to a voting function is real progress over one. But "we have three of them" is not a complete answer to "what happens when one fails?" That answer also needs detection that actually fires, isolation that picks the right unit, and a recovery action that has been tested, not merely designed. Treat all three as separate requirements, each verified on its own.
:::

## Check yourself

::: check
Explain what voting is solving for, given several redundant measurements of the same quantity, and why a plain average is a poor substitute for it.
:::

::: answer
Voting produces one trustworthy value from several imperfect, redundant sources when one of them may be faulted. A plain average weights every source equally, right or wrong, so one badly wrong input drags the result toward itself by an amount that grows with its error, without limit. A voting scheme such as the median follows whatever value the majority agrees on, so a single disagreeing source is largely ignored instead of corrupting the combined answer.
:::

::: check
In the drifting-sensor example, the median's worst error was 0.12 and the plain average's worst error was 2.713. Explain specifically why the gap between the two grows as the faulted sensor's bias grows.
:::

::: answer
The median depends only on the value two of the three sources agree on. While the fault stays a minority of one in three, pushing that one sensor's bias further does not move the median — it stays anchored to the agreeing pair. The average includes the faulted value with full weight, one third of the total, so it moves by about one third of the bias: $8.1/3 \approx 2.7$ in the last row. As the bias grows, the average is pulled further from the truth and the gap between the two methods widens.
:::

::: check
Explain concretely what it means for redundancy to be "a first-class design concern" rather than something added after the nominal design is finished.
:::

::: answer
It means asking what happens when each unit fails while the architecture is still being decided — how many flight computers, how many of each sensor, and how a command is chosen when sources disagree — so the answer shapes the hardware count and the voting and fault-management software from the start. Treating it as an afterthought means designing the nominal system first and only later asking how it degrades. That tends to give redundancy that is incomplete, mismatched to the real failure modes, or bolted onto an architecture never built to support it cleanly.
:::

::: check
A designer proposes going from triplex to quadruplex (four units) and quotes the improved independent-failure number. The four computers share one power supply. What is wrong with relying on that number, and what would you suggest?
:::

::: answer
The improved number assumes the four units fail independently. A shared power supply is a common-mode failure: one fault takes out all four at once, so the probability of losing the whole set can be no better than the probability of losing that supply, however many computers sit behind it. The extra unit does nothing against that cause. The fix is diversity — separate power for each unit where practical — and then checking the remaining shared causes (same batch, same software) the same way.
:::

::: check
The reliability calculation for triplex voting assumes each unit fails independently. Explain what a common-mode failure is and why it defeats the benefit that calculation predicts.
:::

::: answer
A common-mode failure is a single root cause — a shared design flaw, a shared power supply, a shared software bug, a radiation event hitting more than one unit in the same short window — that defeats several redundant units at once rather than one at a time. The calculation's big improvement comes entirely from treating the units' failures as statistically independent, which is what allows multiplying $p \cdot p$. A common-mode event makes the failures strongly correlated, the assumption breaks, and the real protection against that cause can be far smaller than the independent-failure number suggests.
:::

::: check
Name the three components of fault management — detection, isolation and recovery — and explain why a system could have working redundant hardware and still fail to tolerate a fault if only one of the three is missing.
:::

::: answer
Detection notices that something is wrong; isolation determines which unit is at fault; recovery decides and carries out the response. Without detection, the system keeps using a faulted unit's output indefinitely, since nothing watches for disagreement. Without isolation, it knows something is wrong but cannot safely choose which source to stop trusting. Without a tested recovery, it can find the fault and still have no actual response. All three must work, and each must be tested with an injected fault, for the system to be fault tolerant rather than merely equipped with extra hardware.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Redundancy | More than one of each unit that must not silently fail, decided while the architecture is designed |
| Voting | Combining several redundant sources into one answer that favors agreement over any single input (e.g. median of three) |
| Simplex / triplex | One unit with no backup / three units combined by a 2-of-3 vote |
| $P(\text{fail})$, simplex | $p$ |
| $P(\text{fail})$, triplex 2-of-3 | $\binom{3}{2}p^2(1-p) + \binom{3}{3}p^3 = 3p^2 - 2p^3$, assuming independent per-unit probability $p$ |
| Common-mode failure | One root cause defeating several redundant units at once, breaking the independence assumption |
| FDIR | Fault detection, isolation and recovery — three separate capabilities, each tested by injecting faults |

The next lesson moves from one unit failing to everything being slightly off at once: Monte Carlo dispersion campaigns, built to find the bad combinations that only show up rarely, and what a claim built on them is allowed to say.

::: context first-class Where "first-class" comes from
On a train or a plane, first class gets the best treatment and is planned for from the start. Programmers borrowed the phrase: a "first-class" feature of a language is one that gets full, built-in support rather than being bolted on. Calling fault tolerance a first-class design concern means the same thing — it gets a seat at the table in the very first design meeting, alongside performance and cost, instead of being squeezed in at the end.
:::

::: context median-of-three Why the middle value ignores one liar
Sort three readings from smallest to largest and take the middle one. If one reading is wildly high, it goes to the top of the list. If it is wildly low, it goes to the bottom. Either way it cannot be in the middle — unless it happens to sit between the two healthy readings, where it does no harm.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="55" x2="340" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <line x1="30" y1="50" x2="30" y2="60" stroke="#1f2a44"/><text x="30" y="75">118</text>
    <line x1="90" y1="50" x2="90" y2="60" stroke="#1f2a44"/><text x="90" y="75">120</text>
    <line x1="150" y1="50" x2="150" y2="60" stroke="#1f2a44"/><text x="150" y="75">122</text>
    <line x1="210" y1="50" x2="210" y2="60" stroke="#1f2a44"/><text x="210" y="75">124</text>
    <line x1="270" y1="50" x2="270" y2="60" stroke="#1f2a44"/><text x="270" y="75">126</text>
  </g>
  <circle cx="42.2" cy="55" r="5" fill="#1d6fd1"/>
  <circle cx="43" cy="40" r="5" fill="#1d6fd1"/>
  <circle cx="285" cy="55" r="5" fill="#b4232c"/>
  <line x1="43" y1="20" x2="43" y2="34" stroke="#1d6fd1" stroke-width="2"/>
  <text x="52" y="22" font-size="12" fill="#1d6fd1">median 118.43</text>
  <line x1="123.4" y1="62" x2="123.4" y2="90" stroke="#f2b880" stroke-width="3"/>
  <text x="130" y="100" font-size="12" fill="#1f2a44">average 121.11</text>
  <text x="285" y="35" font-size="12" text-anchor="middle" fill="#b4232c">faulty 126.5</text>
</svg>
```

This is the last snapshot from the example: the two blue readings sit together near 118.4, the red one is far off. The median stays with the blue pair; the average is dragged a third of the way toward the red.
:::

::: context orders-of-magnitude Orders of magnitude
An **order of magnitude** is a factor of ten. One order of magnitude better means ten times better; two orders means a hundred times; three means a thousand. Engineers use the phrase to talk about size without fussing over exact numbers. A $334\times$ improvement is "more than two orders of magnitude," since it is more than $100$ but less than $1{,}000$.
:::

::: context ariane-501 A real common-mode failure: Ariane 5, 1996
On its first flight in June 1996, Europe's Ariane 5 rocket broke up about forty seconds after launch. It carried two inertial reference systems — one active, one hot backup — running the same software. A number describing the rocket's horizontal velocity grew too big to fit into the smaller format the code converted it into, and that conversion failed. It failed in the backup first and then, a fraction of a second later, in the active unit, for the identical reason. The redundancy was real. It did nothing, because both copies shared the same cause. Engineers still teach this flight as the textbook common-mode failure.
:::

::: context single-event-upset When a particle flips a bit
Above most of the atmosphere, fast charged particles from the Sun and from deep space pass through electronics. When one strikes a memory cell or a processor register at the wrong spot, it can flip a stored $0$ to a $1$. Engineers call this a **single-event upset**. Nothing is permanently broken — the chip works fine afterward — but a wrong bit in the wrong place gives a wrong answer. It is one reason flight computers are redundant and cross-checked, and why memory on spacecraft often carries extra bits that detect and correct flips.
:::

::: context real-voting Voting on real vehicles
NASA's Space Shuttle is the classic public example. Four primary computers ran the same software and compared their outputs, so one bad computer could be outvoted. A fifth computer ran separately written backup software, so a bug shared by the four primaries would not take down the fifth — a deliberate defense against common-mode failure.

SpaceX has publicly described a related approach for Dragon and Falcon 9: three flight computers, each built from a pair of processors that check each other, with the vehicle able to continue if one computer drops out. The details belong to the company; the principle — vote, and do not trust any single unit — is the one in this lesson.
:::

::: context safe-mode What a safe configuration looks like
Many spacecraft have a **safe mode**: a simple, heavily tested state they drop into when something serious goes wrong. Typically it turns off anything non-essential, points the solar panels at the Sun so the batteries stay charged, keeps the radio listening, and waits for people on the ground to diagnose the problem. It is the spacecraft version of pulling over to the side of the road. The point is not to finish the mission right now — it is to stay alive until someone who understands the fault can decide.
:::

::: context fault-injection How faults are injected
Fault injection happens at every level of testing. In a pure software test, the code is fed a stuck or wildly wrong sensor value. In **hardware-in-the-loop** testing — real flight computers wired to a simulation that pretends to be the vehicle and its world — engineers can cut power to one computer, unplug a cable, or corrupt a message on purpose, then watch whether detection, isolation and recovery behave as designed. Every fault the design claims to handle should have a test that makes it happen.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="35" width="72" height="36" rx="5" fill="#f2b880"/>
    <rect x="102" y="35" width="72" height="36" rx="5" fill="#8fb8f0"/>
    <rect x="194" y="35" width="72" height="36" rx="5" fill="#8fb8f0"/>
    <rect x="286" y="35" width="66" height="36" rx="5" fill="#8fb8f0"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="46" y="57">inject</text><text x="138" y="57">detect</text><text x="230" y="57">isolate</text><text x="319" y="57">recover</text>
  </g>
  <g fill="#1f2a44">
    <polygon points="100,53 90,48 90,58"/><polygon points="192,53 182,48 182,58"/><polygon points="284,53 274,48 274,58"/>
  </g>
  <line x1="82" y1="53" x2="90" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="174" y1="53" x2="182" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="266" y1="53" x2="274" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="95" font-size="11" text-anchor="middle" fill="#6c7a93">each blue step must be seen to happen in the test</text>
</svg>
```
:::
