---
id: l07-byzantine-faults-and-determinism
title: Byzantine faults and determinism
minutes: 27
covers:
  - Byzantine faults and why a majority vote does not handle an asymmetric liar
  - Determinism across redundant strings, and why a non-deterministic algorithm cannot be voted
---

Imagine three friends who went to the same basketball game. You and your cousin each call all three to ask the final score. Two friends are honest and tell you both the same thing. The third is playing a trick: he tells you "the home team won" and tells your cousin "the visitors won". You compare his story with the other two and decide who to believe. So does your cousin. But you started from different stories, so you can each reason perfectly and still end up believing different things. And neither of you knows the other one disagrees.

Lesson 6 built voters that assumed something quietly: whatever a channel reports, it reports the same thing to everyone listening. A stuck sensor is stuck the same way for every computer that reads it. That assumption is not a law of nature. It is a property of the wiring and the electronics. When it breaks, the fault gets its own name: a **Byzantine fault** — a fault that shows *different* values to *different* listeners at the same moment. The name comes from a famous puzzle about **[[loyal generals and a traitor|byzantine-generals]]**.

This lesson does two things. First it builds a Byzantine fault and shows two healthy flight computers, running the same correct voting code, reach two different answers. Then it turns to a second way a vote can fail with no broken hardware at all: redundant computers that are not quite running "the same" calculation, because their software is not **deterministic**.

## A fault that is not the same to everyone

Every fault in this module so far — stuck, hard-over, drifting, common-mode — gave one value, however wrong, that every reader of the channel saw identically. A Byzantine fault drops that. The failing unit presents one value to one computer and a different value to another, for the same quantity, at the same instant.

This is not science fiction. Here are some real ways it happens:

- a partly failed output driver that pushes a strong signal down one wire and a weak one down another;
- a damaged routing stage that feeds two computers along two separate paths, and corrupts only one of them;
- a signal that sits **[[exactly on a sampling threshold|on-the-threshold]]** — a voltage right at the line between "0" and "1". Two receivers with very slightly different thresholds read it differently. This is one of the most common physical causes.

Nothing about the failure announces itself. To each single observer it looks like an ordinary disagreement between channels.

Why does this matter more than an ordinary failure? Every voter so far reasons only from what *it* was told. If what it was told is not what another, equally healthy voter was told, the two can each run a correct algorithm on inputs that look consistent — and land on two different answers.

## Two healthy computers, one liar, two answers

Take two redundant flight computers, FC1 and FC2. Each votes on its own over the same three channels, A, B and C. A and B are honest: each sends the same value to both computers. C is faulty and sends a different value to each. The **tolerance** `tol` is how close two values must be to count as agreeing.

::: example An asymmetric liar produces two different, confident answers
```python
def majority_vote(values, tol):
    a, b, c = values
    pairs = [(0, 1, a, b), (0, 2, a, c), (1, 2, b, c)]
    agreeing = [(i, j) for (i, j, x, y) in pairs if abs(x - y) <= tol]
    if len(agreeing) == 0:
        return None, [0, 1, 2]
    if len(agreeing) == 3:
        return sum(values) / 3.0, []
    (i, j) = agreeing[0]
    k = ({0, 1, 2} - {i, j}).pop()
    return (values[i] + values[j]) / 2.0, [k]

A, B = 1.00, 1.20                  # honest: both computers get these same values
tol = 0.10
C_to_FC1, C_to_FC2 = 1.05, 1.20    # the liar: a different value for each computer

out1, fault1 = majority_vote([A, B, C_to_FC1], tol)
out2, fault2 = majority_vote([A, B, C_to_FC2], tol)
print(f"FC1 sees [A={A}, B={B}, C={C_to_FC1}] -> out={out1:.4f}, excludes channel {fault1}")
print(f"FC2 sees [A={A}, B={B}, C={C_to_FC2}] -> out={out2:.4f}, excludes channel {fault2}")
print(f"divergence between FC1 and FC2: {abs(out1 - out2):.4f}")
# FC1 sees [A=1.0, B=1.2, C=1.05] -> out=1.0250, excludes channel [1]
# FC2 sees [A=1.0, B=1.2, C=1.2] -> out=1.2000, excludes channel [0]
# divergence between FC1 and FC2: 0.1750
```

Walk through FC1 first. Its copy of C is $1.05$. That is $0.05$ from A (inside the tolerance of $0.10$) and $0.15$ from B (outside). So FC1 trusts the pair {A, C}, outputs their average $(1.00 + 1.05)/2 = 1.025$, and throws out B — which is perfectly healthy.

Now FC2. Its copy of C is $1.20$. That is $0.20$ from A (outside) and $0$ from B (inside). So FC2 trusts {B, C}, outputs $1.20$, and throws out A — also perfectly healthy.

Both computers ran the identical, correct algorithm. Both are fully confident. They disagree by $1.20 - 1.025 = 0.175$. Each has thrown out an honest channel, and each kept the one channel that lied to both of them.
:::

Notice what did *not* go wrong. Neither computer's voting code has a bug. A and B never changed their story. The whole fault lives upstream, in what C chose to tell each listener. A voter that only sees its own inputs cannot detect it, because from where it sits, everything it was given hangs together.

::: key
Byzantine fault: a faulty unit sends DIFFERENT values to different recipients, so the good units disagree about what was sent. Tolerating $f$ such faults needs at least $3f+1$ units and multiple exchange rounds. A common physical cause is a signal sitting exactly on a sampling threshold. No amount of care in the voting *algorithm* fixes it, because the fault is in what each voter is told, not in how it decides.
:::

## Making the liar contradict itself

The asymmetry is only dangerous because each computer reasons alone. So let them talk. In one extra **round** of messages — before either one votes — FC1 and FC2 tell each other what C said to them. Now the contradiction is visible to both at once.

::: example One round of cross-exchange exposes the liar to both computers
This continues the code from the example above.

```python
def exchange_and_vote(a, b, c_seen_by_me, c_seen_by_peer, tol):
    if abs(c_seen_by_me - c_seen_by_peer) > tol:
        # C told two different stories: exclude it, vote on what remains
        if abs(a - b) <= tol:
            return (a + b) / 2.0, "C excluded (inconsistent across consumers)"
        return None, "C excluded (inconsistent across consumers); A and B do not agree either"
    return majority_vote([a, b, c_seen_by_me], tol)

out1x, reason1x = exchange_and_vote(A, B, C_to_FC1, C_to_FC2, tol)
out2x, reason2x = exchange_and_vote(A, B, C_to_FC2, C_to_FC1, tol)
print(f"FC1 with exchange: {out1x}  ({reason1x})")
print(f"FC2 with exchange: {out2x}  ({reason2x})")
# FC1 with exchange: None  (C excluded (inconsistent across consumers); A and B do not agree either)
# FC2 with exchange: None  (C excluded (inconsistent across consumers); A and B do not agree either)
```

Step one: each computer compares its copy of C with its partner's copy. The gap is $|1.05 - 1.20| = 0.15$, bigger than the tolerance of $0.10$. So both computers see that C told two stories, and both exclude C before it gets anywhere near a vote.

Step two: vote on what remains. A and B are $0.20$ apart. This example chose them that far apart on purpose, so that C was needed to form any majority. With C gone, there is no majority, and both computers report "no trustworthy answer".

Sanity check: is "no answer" a failure? No. It is the guarantee cross-exchange actually buys. You are not promised a good value — sometimes, as here, there isn't one. You are promised that both computers reach the *same* conclusion. Two computers that fail the same way, loudly, give the rest of the system (a fault monitor, a backup source, a crew alert) something it can act on. Two computers that quietly disagree, each fully confident, do not.
:::

The general version of this is a classic result in computer science, from the problem of **interactive consistency**: getting every healthy participant to agree on what every other participant said. To tolerate $f$ Byzantine units you need:

- at least $3f+1$ units in total (read "three f plus one");
- $f+1$ rounds of exchanging and relaying messages;
- a shared, synchronized sense of time, so everyone knows when a round is over.

So one liar needs $3(1)+1 = 4$ units and $2$ rounds. Two liars need $7$ units and $3$ rounds. Three is *not* enough to handle one liar — which is exactly why a plain triplex vote cannot fix this.

::: note Why three units cannot handle one liar
Take a commander and two lieutenants, L1 and L2, one of whom may be a traitor. The commander sends an order; the lieutenants then tell each other what they heard.

Scenario 1: the commander is the traitor. He tells L1 "attack" and L2 "retreat". L2, honest, tells L1 "the commander said retreat".

Scenario 2: the commander is loyal and tells both "attack". L2 is the traitor and tells L1 "the commander said retreat".

In both scenarios L1 holds exactly the same information: "commander said attack to me; L2 says he was told retreat". L1 cannot tell the scenarios apart, so no rule L1 follows can be right in both. In scenario 2 it must obey the loyal commander and attack. In scenario 1 it must agree with honest L2, who by the same logic would act on "retreat". A fourth participant breaks the tie, because then the honest majority can outvote a single relayed lie. That is where $3f+1$ comes from.
:::

Full agreement protocols are expensive. Units have to talk to each other, not only report to a common reader, and the cost grows fast as $f$ grows. So flight systems usually attack the problem at its source instead:

- **Isolate the fan-out.** Wire each channel so a fault cannot easily reach one computer's copy without reaching the other's identically.
- **Self-checking pairs.** Build each unit as two halves that compare with each other and go silent if they differ (lesson 5's lockstep pair). A unit that goes silent cannot lie two ways.
- **Hardware that forbids asymmetry.** A single broadcast medium, where every reader physically receives the same signal from the same wire.
- **Targeted exchange.** Add the cross-exchange round above only for the few values where an asymmetric fault would be most costly.

## Determinism: the promise a vote needs from good software

Now a second way a vote fails, with no hardware fault anywhere.

Picture three students given the same long list of numbers to add up, and a teacher who marks any answer that differs from the other two as wrong. If two students add top to bottom and one adds bottom to top, you would expect the same total. On paper, you would get it. On a computer, you might not.

**Determinism** means: the same code, given the same inputs, gives the same output, every time, on every copy. A redundant computing path is called a **string** (lesson 5). A tight, bit-for-bit vote across three strings only makes sense if they are deterministic with respect to each other. If they are not, two perfectly healthy strings can produce different bit patterns for what is mathematically the same answer. The voter cannot tell that difference from a fault.

The most common way determinism breaks is ordinary **[[floating-point arithmetic|floating-point]]**. A computer rounds after every addition. So addition is not **associative** on a computer: $(a+b)+c$ and $a+(b+c)$ — the same sum grouped two ways — can differ in the last bit.

::: example Changing the order of addition changes the bits
```python
a, b, c = 0.1, 0.2, 0.3
left = (a + b) + c
right = a + (b + c)
print(f"(a+b)+c = {left!r}")
print(f"a+(b+c) = {right!r}")
print(f"bit-exact equal? {left == right}")
# (a+b)+c = 0.6000000000000001
# a+(b+c) = 0.6
# bit-exact equal? False
```

Neither line is a bug. Both add the same three numbers correctly, to full precision. The first adds $0.1 + 0.2$, rounds, then adds $0.3$ and rounds again. The second rounds at different moments. Different rounding moments, different last bit. The gap here is about $1 \times 10^{-16}$ — tiny, but a bit-exact vote sees any gap at all.
:::

::: example A healthy string outvoted because it added in a different order
```python
values = [0.1, 0.7, 0.3, 0.9, 0.2, 0.6, 0.4, 0.8, 0.5, 1.1]

def sum_forward(vals):
    total = 0.0
    for v in vals:
        total += v
    return total

lane_A = sum_forward(values)                  # reference implementation
lane_B = sum_forward(list(values))            # same algorithm, same order
lane_C = sum_forward(list(reversed(values)))  # a later rewrite loops backward

print(f"lane A: {lane_A!r}")
print(f"lane B: {lane_B!r}")
print(f"lane C: {lane_C!r}")
print(f"A == B (bit-exact)? {lane_A == lane_B}")
print(f"A == C (bit-exact)? {lane_A == lane_C}")
# lane A: 5.6
# lane B: 5.6
# lane C: 5.6000000000000005
# A == B (bit-exact)? True
# A == C (bit-exact)? False
```

A bit-exact vote over these three lanes finds the majority {A, B} and flags C as faulty. But C computed nothing wrong. It added the same ten numbers in a different, equally valid order, and rounding did the rest. The vote threw away a healthy string for no reason except that the strings were not deterministic with respect to each other. This is the failure lesson 6 named without explaining, produced here from ordinary Python numbers.
:::

Summation order is one case of a bigger family. Anything that lets two strings, running the same source code, take a different path through the arithmetic breaks the guarantee:

- a container whose **[[iteration order|iteration-order]]** depends on where things landed in memory;
- a parallel sum that combines partial results in whatever order threads happen to finish (a scheduling-dependent reduction order);
- a compiler that regroups floating-point expressions differently at two optimization settings;
- reading memory that was never set, which holds different leftover values on two runs;
- an **unseeded** random number generator, or one seeded from the clock instead of from a **[[seed|seed]]** shared by every string;
- an iterative solver that stops when a wall-clock time limit runs out, instead of after a fixed number of iterations.

That last one deserves its own example, because guidance code is full of iterative solvers.

::: example A solver that stops on the clock cannot be voted
The equation $x = \cos x$ has one solution, near $0.739$. A simple way to find it: start at $x = 1$ and keep replacing $x$ with $\cos x$. Each pass is one **iteration**.

```python
import math

def solve(iterations):
    # find x with x = cos(x) by repeating x <- cos(x)
    x = 1.0
    for _ in range(iterations):
        x = math.cos(x)
    return x

lane_1 = solve(60)   # a fixed budget: exactly 60 iterations
lane_2 = solve(60)
lane_3 = solve(61)   # this lane's clock let it squeeze in one more
print(f"lane 1: {lane_1!r}")
print(f"lane 2: {lane_2!r}")
print(f"lane 3: {lane_3!r}")
print(f"difference: {abs(lane_3 - lane_1):.2e}")
# lane 1: 0.7390851332287504
# lane 2: 0.7390851332287504
# lane 3: 0.7390851332060064
# difference: 2.27e-11
```

If each string runs "as many iterations as fit in 5 ms", a string that was interrupted a little less gets one extra pass. Its answer is just as good — the difference is about $2 \times 10^{-11}$ — but it is different, and the voter flags it. Give every string the same fixed iteration budget, and lanes 1 and 2 show they agree to the last bit. This is a strong argument for guidance solvers with a fixed iteration count rather than "stop when converged" or "stop when time is up".
:::

::: key
Why a voted algorithm must be deterministic: the voter cannot distinguish legitimate disagreement from a fault. Anything timing-dependent — an unseeded RNG, a wall-clock iteration limit, a scheduling-dependent reduction order — turns healthy strings into apparent failures. An argument for a fixed iteration budget in the guidance solver.
:::

::: warning
"The three strings run the same source code" is not the same claim as "the three strings are deterministic with respect to each other." Fixed iteration order, no floating-point regrouping, identically seeded and identically used random numbers, and no dependence on memory addresses or thread timing all have to be engineered in on purpose. They do not come free with correct code.
:::

### When bit-for-bit agreement is out of reach

Sometimes exact agreement cannot be had — for example, when each string reads its own sensor. Then there are two honest options. The first is to **[[synchronize the strings|frame-sync]]** tightly: make every string finish the same frame of work on the same inputs, and compare only at those agreed points. The second is to pick one string as the **commanding** string and treat the others as **monitors**. The monitors check the commander's output within a tolerance, and that tolerance has to be justified by analysis, not guessed. Too tight and healthy strings raise false alarms. Too wide and real faults hide inside it.

## Check yourself

::: check
In the first worked example, both computers run the identical `majority_vote` function. Why does FC1 trust the pair {A, C} while FC2 trusts {B, C}?
:::

::: answer
Each computer's vote depends only on the values it was given, and C gave each a different value. FC1's copy of C ($1.05$) is within tolerance of A ($1.00$), $0.05$ away, but $0.15$ from B. FC2's copy ($1.20$) matches B exactly but is $0.20$ from A. The algorithm is the same and correctly applied in both. The disagreement comes entirely from the inconsistent inputs C supplied, not from any difference in how FC1 and FC2 process them.
:::

::: check
A reviewer says the fault in the first example "isn't really a voting failure, because A and B, the two honest channels, never changed their story." What does this get right, and what does it miss?
:::

::: answer
It is right about *where* the fault lives: A and B were each consistent, and the asymmetry came entirely from C, upstream of any vote. But it misses the consequence. Two computers that are meant to agree on one shared answer now disagree. Anything downstream acting on FC1's output and anything acting on FC2's output will behave as if two different measurements were true. A system is judged by what it does, not by which layer is technically to blame, and what this one did was disagree with itself.
:::

::: check
Why does the cross-exchange fix need an extra round of communication between FC1 and FC2? Why can't either computer add something to its own voting logic instead?
:::

::: answer
The fault is invisible from any single computer's inputs. FC1's view of A, B and its copy of C hangs together on its own, and no local rule can reveal that C told FC2 something else. Spotting the contradiction means comparing what two different computers were told. Neither has that information until it asks the other. So the fix is one more round of messages, not a smarter local algorithm.
:::

::: check
Two engineers each write the same averaging function in C++, with the same compiler and the same input array. Both versions pass every test, yet a bit-exact comparison of their outputs fails. What is the most likely explanation?
:::

::: answer
They almost certainly add the numbers in a different order: a different loop, a different accumulator, or a container whose iteration order differs between the two. Because computer addition rounds after every step, it is not associative, so a different order can change the last bit even though both results are mathematically correct. Passing tests means "matches to a reasonable tolerance". Bit-exact is a stronger claim, and it is the one a tight-tolerance vote needs.
:::

::: check
A team wants to vote across three strings running a guidance calculation that includes a random dispersion check. What must be true of the random number generator on the three strings for a bit-exact vote to mean anything?
:::

::: answer
All three must be seeded with the identical seed, and must draw from the generator the same number of times, in the same order. Then each string gets exactly the same sequence of "random" numbers. If any string seeds itself (from its own clock, say), or draws one extra number before the compared point, the strings drift apart with no fault in the guidance logic — exactly like a different summation order. In practice, the seed is treated as an input and handed to all strings with their other inputs, not made locally.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Byzantine fault | A faulty unit sends different values to different recipients of the same data, at the same time |
| Ordinary fault | The faulty channel's wrong value is the same for every reader |
| Asymmetric divergence | Two healthy computers, each voting correctly, reach different answers because the liar told them different things |
| Cross-exchange | Computers compare what they were told before voting, so an inconsistent channel is exposed to both |
| What cross-exchange guarantees | The same conclusion on every healthy computer, not necessarily a usable value |
| Tolerating $f$ liars | At least $3f+1$ units, $f+1$ rounds, synchronized time; three units cannot handle one liar |
| Common physical cause | A signal sitting exactly on a sampling threshold |
| Determinism | Same code, same inputs, same output, on every string, every run |
| Floating-point non-associativity | `(a+b)+c` and `a+(b+c)` can differ in the last bit, so order must be fixed |
| Determinism killers | Unseeded RNG, wall-clock iteration limit, scheduling-dependent reduction order, unset memory |
| When exact agreement is impossible | Synchronize at frame boundaries, or one commanding string plus monitors with a justified tolerance |

Lessons 6 and 7 together show what a voter can mask, what it cannot, and what it takes — determinism, and sometimes an extra round of messages — for a vote to mean what it claims. Next comes a different enemy entirely: radiation striking the silicon the vote runs on, and the watchdog that is supposed to notice when a computer stops running.

::: context byzantine-generals Where the name comes from
In 1982 Leslie Lamport, Robert Shostak and Marshall Pease published "The Byzantine Generals Problem". They imagined generals of the Byzantine army camped around a city, sending messengers to agree on attack or retreat, while some generals were traitors free to send different messages to different colleagues. The Byzantine Empire was picked because its court had a reputation for intrigue.

The story stuck. Engineers now call any fault that can behave arbitrarily — including lying differently to different listeners — a Byzantine fault. The same paper also showed that if messages carry signatures nobody can forge, the problem becomes easier, a link to command authentication in lesson 3.
:::

::: context on-the-threshold How one wire can tell two stories
A digital receiver turns a voltage into a bit by comparing it with a threshold. No two receivers have exactly the same threshold. If a failing driver leaves the voltage sitting right between two receivers' thresholds, one reads 1 and the other reads 0, from the same wire, at the same instant.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="146" font-size="11" text-anchor="middle" fill="#6c7a93">time</text>
  <text x="34" y="24" font-size="11" text-anchor="end" fill="#6c7a93">V</text>
  <line x1="40" y1="60" x2="340" y2="60" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="338" y="54" font-size="11" text-anchor="end" fill="#1d6fd1">FC2 threshold: reads 0</text>
  <line x1="40" y1="90" x2="340" y2="90" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="338" y="106" font-size="11" text-anchor="end" fill="#6c7a93">FC1 threshold: reads 1</text>
  <polyline points="40,120 80,120 90,76 130,74 170,77 210,75 250,76 290,74 340,75" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="150" y="70" font-size="11" fill="#b4232c">failing signal, stuck between</text>
</svg>
```

A 2003 Honeywell paper by Kevin Driscoll and colleagues called these "slightly out of specification" signals and showed they are a real, recurring cause of Byzantine behavior in avionics.
:::

::: context floating-point Why a computer cannot store 0.1 exactly
Computers store numbers in binary, as sums of halves, quarters, eighths and so on. Just as one third is $0.333\ldots$ forever in decimal, one tenth is a repeating pattern forever in binary. A standard 64-bit "double" keeps 53 binary digits and rounds the rest away.

So $0.1$ in a computer is really about $0.1000000000000000055$. Every addition produces a result that must be rounded again to 53 digits. Group the additions differently, and the roundings land differently. The size of one last-bit step near $0.6$ is about $1.1 \times 10^{-16}$, which is exactly the size of the gap in the first determinism example.
:::

::: context iteration-order Containers that shuffle themselves
Some data structures, like hash tables, store items in slots chosen by a scrambling function. Walking through them gives items in slot order, not insertion order. If the scrambling depends on memory addresses, or on a per-run random key, two strings can walk the same contents in different orders.

Python itself does this for sets of strings: since version 3.3 it scrambles string hashes with a random key chosen when the program starts, so the order of a set of words can change from one run to the next. Flight code that must be voted avoids such containers, or sorts before it sums.
:::

::: context seed What a random seed is
Computer "random" numbers come from a formula. You give it a starting number, the **seed**, and it produces a long sequence that looks random but is completely fixed by that seed. Same seed, same sequence, every time, on every machine running the same generator.

That is a gift for voting: hand every string the same seed and they draw identical "random" numbers. Seed each string from its own clock, and they draw different ones. The 6-DOF simulation module relies on the same trick to replay one Monte Carlo case exactly.
:::

::: context frame-sync What a frame is
Flight software runs in **frames**: fixed time slots, say every 10 ms, in which it reads inputs, computes, and writes outputs. If every string starts frame 1000 with the same inputs and must finish it before comparing, then the strings agree about *which* calculation they are comparing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="8" y="34">string 1</text><text x="8" y="64">string 2</text><text x="8" y="94">string 3</text>
  </g>
  <rect x="70" y="22" width="70" height="18" fill="#8fb8f0"/><rect x="170" y="22" width="80" height="18" fill="#8fb8f0"/>
  <rect x="70" y="52" width="60" height="18" fill="#8fb8f0"/><rect x="170" y="52" width="70" height="18" fill="#8fb8f0"/>
  <rect x="70" y="82" width="80" height="18" fill="#8fb8f0"/><rect x="170" y="82" width="60" height="18" fill="#8fb8f0"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="160" y1="12" x2="160" y2="108"/><line x1="260" y1="12" x2="260" y2="108"/>
  </g>
  <text x="160" y="124" font-size="11" text-anchor="middle" fill="#b4232c">compare</text>
  <text x="260" y="124" font-size="11" text-anchor="middle" fill="#b4232c">compare</text>
</svg>
```

Each string may take a different time inside the frame (blue bars), but all results are compared only at the red frame boundaries.
:::
