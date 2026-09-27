---
id: l06-tmr-and-voting
title: Triple modular redundancy and voting
minutes: 22
covers:
  - Triple modular redundancy and voting; mid-value select; what a voter can and cannot detect
---

You ask three friends what time it is. Two say "3:10" and one says "5:40". You go with 3:10 without a second thought: two watches that agree are more believable than one that doesn't. You have just run a vote.

Now a twist. All three friends set their watches that morning from the same kitchen clock, and that clock was two hours slow. All three say "3:10". They agree perfectly, and all three are wrong. Asking them again, or asking more carefully, will not help. Agreement among them can only tell you they match each other, never that they match the real time.

That little story is this whole lesson. **Triple modular redundancy (TMR)** means three independent **channels** — sensors, computers or pieces of software — produce the same quantity, and a **voter** combines them into one answer for the rest of the vehicle. It is the best-known pattern in fault-tolerant flight software, and also the one most often trusted to do more than it does. A voter can tell you when the three disagree, and it can give a sensible answer when one of them is wrong in an obvious way. It cannot tell you the answer is *correct*. Those are different claims, and real failures live in the gap between them.

Lesson 7 adds a second, different way to beat a vote: a channel that tells different listeners different stories. This lesson stays with the first.

## Two ways to combine three channels

Given three values that should describe the same thing, a voter must produce one output — or openly refuse. Two schemes are standard in flight software, and it is worth knowing both by name and by exact behavior.

**Majority vote with a tolerance.** Check each of the three pairs to see whether its two values are within a **tolerance** — the largest difference you will still call "agreeing". Then:

- all three pairs agree: output the average of all three, flag nothing;
- exactly one pair agrees: output that pair's average, and flag the third channel as faulted;
- two pairs agree (the values form a chain, like $1.00$, $1.08$, $1.16$ with tolerance $0.10$): the channel in both pairs is the middle one, and no channel disagrees with *both* others, so output the middle one and flag nothing;
- no pair agrees: refuse to output anything, and flag all three. A majority that does not exist must never be invented by picking one at random.

**Mid-value select.** Output the **[[median|median]]** — the middle value once the three are sorted. Always. There is no idea of "agreement" in it at all, and no case where it refuses to answer.

```python
def majority_vote(values, tol):
    a, b, c = values
    pairs = [(0, 1, a, b), (0, 2, a, c), (1, 2, b, c)]
    agreeing = [(i, j) for (i, j, x, y) in pairs if abs(x - y) <= tol]
    if len(agreeing) == 0:
        return None, [0, 1, 2]
    if len(agreeing) == 3:
        return sum(values) / 3.0, []
    if len(agreeing) == 2:
        # the channel in both agreeing pairs is the middle value;
        # nobody disagrees with both others, so nobody is flagged
        (i, j), (k, l) = agreeing
        shared = ({i, j} & {k, l}).pop()
        return values[shared], []
    (i, j) = agreeing[0]
    k = ({0, 1, 2} - {i, j}).pop()
    return (values[i] + values[j]) / 2.0, [k]

def mid_value_select(values):
    return sorted(values)[1]
```

Each function returns the output and, for the majority vote, the list of flagged channel numbers ($0$, $1$ or $2$). `None` means "no answer".

::: note Why the shared channel is the middle one
Suppose $b$ agrees with $a$ and with $c$, but $a$ and $c$ do not agree. Could $b$ be the largest of the three? If it were, both $a$ and $c$ would lie below $b$ and within the tolerance of it, so they would lie within the tolerance of each other — the gap between two numbers in a window of width $w$ is at most $w$. That contradicts "$a$ and $c$ do not agree". The same argument rules out $b$ being the smallest. So $b$ is in the middle.
:::

Both schemes are TMR: three copies feeding one combining function. What differs is what each assumes and what each promises. That difference is the second half of this lesson.

## What a voter is good at: hiding a hard failure

Take three redundant channels all measuring the vehicle's pitch rate in degrees per second. Let one of them fail **[[hard-over|hard-over]]** — stuck at a wild value that is obviously wrong the moment you see it next to the other two.

::: example Masking a hard-over failure
```python
A, B, C = 1.00, 1.02, 6.00      # deg/s; C is stuck hard-over
tol = 0.10

mv_out, mv_fault = majority_vote([A, B, C], tol)
mid_out = mid_value_select([A, B, C])
print(f"|A-B|={abs(A-B):.3f}  |A-C|={abs(A-C):.3f}  |B-C|={abs(B-C):.3f}")
print(f"majority_vote -> out={mv_out}, faulted={mv_fault}")
print(f"mid_value_select -> out={mid_out}")
print(f"plain average -> out={(A + B + C) / 3:.3f}")
# |A-B|=0.020  |A-C|=5.000  |B-C|=4.980
# majority_vote -> out=1.01, faulted=[2]
# mid_value_select -> out=1.02
# plain average -> out=2.673
```

Step by step. A and B differ by $0.02$, inside the $0.10$ tolerance, so they agree. C differs from each of them by about $5$, so it agrees with neither. Exactly one pair agrees, so the majority vote outputs that pair's average, $(1.00 + 1.02)/2 = 1.01$, and flags channel 2 (C).

Mid-value select sorts the values to $1.00$, $1.02$, $6.00$ and takes the middle: $1.02$, a healthy value. It got there without ever asking who agreed with whom.

For contrast, the last line shows a plain average: $(1.00 + 1.02 + 6.00)/3 \approx 2.673$. One bad channel dragged the answer to more than two and a half times the truth. That is the failure a median is immune to.
:::

Why is the median immune? A single hard-over value is, by being hard-over, the largest or the smallest of the three. The median is never the largest or the smallest. So a single wild value can never *be* the output — the most it can do is decide which of the two healthy values gets picked. An average has no such protection: every channel pulls on it in proportion to how far out it is.

::: key
Mid-value select: take the median of three channels. It is inherently immune to a single hard-over because the median cannot be the extreme value, and it degrades gracefully where an averaging voter would be dragged by the outlier.
:::

## What a voter cannot detect: the common-mode error

Now let the same three channels agree tightly with each other — and be wrong together. A **common-mode error** is any fault that hits all channels the same way. It might be a calibration constant built identically into all three, a shared power supply or clock, the same bad input fed to all three, or — the case that matters most for a GNC engineer — a **[[software defect present in the identical code|same-code]]** that all three run.

::: example Perfect agreement, and a five-degree-per-second error nobody catches
The true pitch rate is $1.00\,\mathrm{deg/s}$. All three channels carry the same $+5\,\mathrm{deg/s}$ calibration mistake.

```python
true_value = 1.00
A, B, C = 5.998, 6.020, 5.990   # a shared +5 deg/s calibration defect in all three
tol = 0.10

mv_out, mv_fault = majority_vote([A, B, C], tol)
mid_out = mid_value_select([A, B, C])
print(f"spread = {max(A,B,C)-min(A,B,C):.3f}")
print(f"majority_vote -> out={mv_out:.3f}, faulted={mv_fault}")
print(f"mid_value_select -> out={mid_out:.3f}")
print(f"error vs truth: majority={mv_out-true_value:.3f}, midvalue={mid_out-true_value:.3f}")
# spread = 0.030
# majority_vote -> out=6.003, faulted=[]
# mid_value_select -> out=5.998
# error vs truth: majority=5.003, midvalue=4.998
```

The three values span only $6.020 - 5.990 = 0.030\,\mathrm{deg/s}$. That is tighter agreement than the healthy pair in the last example. Every pair is within tolerance, so the majority vote averages all three to about $6.003$ and flags nothing. Mid-value select gives $5.998$. Both are wrong by about $5\,\mathrm{deg/s}$ — five times the real rate — and both report full health.

Sanity check: this is the three watches set from one slow kitchen clock. Nothing about running either voter, however carefully, can reveal it.
:::

This is not a bad tolerance and not a bug in either function. It is a fact about what voting *is*. A voter checks **agreement among the channels**. Agreement is necessary for correctness but nowhere near enough. When three copies run identical code on identical inputs, or share one wrong constant, they compute the identical wrong answer. A mechanism built only from comparing those channels with each other has nothing left to compare against.

::: key
TMR with voting covers independent random hardware faults — a single upset or failure is outvoted. It does NOT cover common-mode faults: the same software defect, the same bad table, the same wrong input, or a shared power or timing source.
:::

### What does help against common-mode faults

If comparison among copies cannot help, something *not* a copy must. The main options are:

- **An independent measurement** of the same physical quantity, by a different sensing principle — for pitch rate, the attitude change seen by a star tracker, say. A residual check against it catches a shared calibration error, because the star tracker does not share it. Lessons 9 and 10 build exactly this.
- **Diversity** in the software itself: a separately written program, by a separate team, checking or backing up the main one. The Space Shuttle flew this way, with a **[[backup flight system|shuttle-bfs]]** of independently written software. It is expensive, and independently written programs turn out to share more mistakes than you would hope, because different people misread the same hard part of a requirement.
- **A simpler independent monitor**: a small, easily checked piece of logic that does not repeat the complex calculation, only tests whether its result is believable — "a pitch rate this large is impossible at this point in flight".
- **Verification**: finding the defect before flight, by thorough testing against the requirements and, where it pays, mathematical proof.

The voter itself deserves a word too. Everything flows through it, so it is a single point of failure. The usual answer is to keep it so small and simple — a dozen lines, like `mid_value_select` — that it can be tested in every case and trusted.

## Majority vote versus mid-value select: what each buys

The two schemes gave nearly the same answers in both examples, which can make them look interchangeable. They are not. The difference shows when the tolerance is set to match what majority vote is really for.

A majority vote with a **tight, near [[bit-exact|bit-exact]] tolerance** is the right tool when the three channels are *supposed* to compute an identical value — three copies of a **deterministic** program (one that always gives the same output for the same input) on three flight computers, as in lesson 5. There, any difference between two channels is itself evidence of a fault. Lesson 7 says much more about what "identical" demands.

It is the wrong tool for three **independent physical sensors**. Each sensor has its own random noise, so healthy sensors never agree to the last bit.

::: example A drifting channel: majority vote goes silent, mid-value select degrades gracefully
Two healthy channels read $1.0002$ and $0.9997$ — close, but never bit-identical. The third, C, starts at $1.0000$ and drifts up by $0.006$ each second. The tolerance is zero: bit-exact.

```python
A, B = 1.0002, 0.9997    # two independent, healthy channels -- never bit-identical
tol = 0.0                # bit-exact: appropriate for comparing deterministic replicas, not sensors
drift_rate = 0.006        # units per second

for t in [0, 8, 16, 24, 32, 40]:
    C = 1.0000 + drift_rate * t
    mv_out, mv_fault = majority_vote([A, B, C], tol)
    mid_out = mid_value_select([A, B, C])
    mv_str = "no majority" if mv_out is None else f"{mv_out:.6f}"
    print(f"t={t:3d}s  C={C:.4f}  majority={mv_str:>12}  mid_value={mid_out:.4f}")
# t=  0s  C=1.0000  majority= no majority  mid_value=1.0000
# t=  8s  C=1.0480  majority= no majority  mid_value=1.0002
# t= 16s  C=1.0960  majority= no majority  mid_value=1.0002
# t= 24s  C=1.1440  majority= no majority  mid_value=1.0002
# t= 32s  C=1.1920  majority= no majority  mid_value=1.0002
# t= 40s  C=1.2400  majority= no majority  mid_value=1.0002
```

Read the majority column first. It says "no majority" from the very first line, before C has drifted at all. A and B are both healthy, but they are not bit-identical, so no pair ever passes a zero tolerance. The vote fails because it is the wrong instrument for this signal, not because anything broke.

Now the mid-value column. At $t = 0$, C ($1.0000$) sits between B ($0.9997$) and A ($1.0002$), so the median is C. By $t = 8\,\mathrm{s}$, C is at $1.0000 + 0.006 \times 8 = 1.048$, above both, so the median becomes A, the higher healthy channel, at $1.0002$. It stays there at every later step: bounded, sensible, always defined. A control loop reading it always has a number to act on. That is what **[[degrades gracefully|graceful]]** means.
:::

So neither scheme is simply better. They answer different questions and suit different signals.

- Majority vote, with a tolerance that fits the quantity, is a genuine check when the channels are meant to match. A mismatch really means something is wrong, and refusing to answer when no majority exists is the right, careful response. Applied to independent sensors, the same refuse-on-disagreement rule turns harmless noise into total loss of output.
- Mid-value select never refuses. That is right for a continuous physical signal that should always have a best current estimate. It is wrong if what you needed to know was "did two of these three deterministic copies fail to match?" The median cannot even ask that question — it throws that information away by design.

::: warning Picking the voter picks the signal type
Choosing a voting scheme is choosing what kind of signal you believe you are voting on. A tight-tolerance majority vote on three physical sensors will manufacture total-loss-of-output events out of ordinary noise. A mid-value select on three outputs that are supposed to match exactly will quietly pass over a real fault instead of flagging it, because it never checks for agreement at all.
:::

## What this leaves for the rest of the module

TMR, done with either scheme, earns its keep against the failure it was built for: one channel going wrong on its own, in a way the other two do not share. That is a large and common class of real hardware failure, and hiding it, as the first example did, is no small thing. But you have now seen, with numbers, a case voting cannot touch — the common-mode error, agreement and all — and a case where the wrong voting scheme turns healthy redundancy into an outage. Lesson 7 adds a third problem: one lying channel that tells two listeners two different stories.

## Check yourself

::: check
Using `majority_vote` from this lesson, three channels report $2.00$, $2.03$ and $2.05$ with a tolerance of $0.10$. What does the function output, and which channel, if any, is flagged?
:::

::: answer
The three pairwise differences are $0.03$, $0.05$ and $0.02$, all within $0.10$. So all three pairs agree, and the function takes the "all three agree" branch. It outputs the average of all three, $(2.00 + 2.03 + 2.05)/3 = 6.08/3 \approx 2.027$, and flags nothing. When every pair agrees, no channel is suspect.
:::

::: check
A student says the common-mode example "isn't really a voting failure, because the voter did exactly what it was designed to do." Is that a fair defense, and what should the student conclude?
:::

::: answer
It is fair about the voter's logic: it correctly reported that the three channels agreed. It is no comfort about the vehicle, though. The point of having redundant channels was to catch a wrong answer, and the output was off by $5\,\mathrm{deg/s}$ while the voter reported full health. The right conclusion is that the voter checks a necessary condition (agreement) that is not sufficient for correctness. A design that relies on voting alone has covered independent hardware faults and left common-mode software and calibration defects completely uncovered — those need something outside the three channels.
:::

::: check
A team will vote on three copies of the same guidance program, each on identical hardware with identical inputs, and expects their outputs to match to the last bit. Which voting scheme fits, and with what tolerance?
:::

::: answer
Majority vote, with a tight tolerance — bit-exact or very nearly. The copies are meant to compute the identical value, so any real disagreement is evidence of a fault. Mid-value select would throw that evidence away by quietly taking the median without ever checking whether the three matched. One caution: "match to the last bit" is a strong assumption. Lesson 7 shows why even correct, fault-free copies can differ in the last bits unless determinism is deliberately engineered in.
:::

::: check
Using the drifting-channel example, explain why a bit-exact majority vote can report "no majority" when none of the three channels has failed at all.
:::

::: answer
Bit-exact agreement needs two of the three values to be identical to the last bit. Independent physical channels, even perfectly healthy ones, each carry their own random noise, so exact matches essentially never happen. In the example, A ($1.0002$) and B ($0.9997$) never match each other, whatever C does, so no pair ever passes and the vote says "no majority" from the very first sample. That is the result of applying an agreement standard meant for deterministic copies to signals that could never meet it — not evidence that anything is broken.
:::

::: check
A vehicle uses mid-value select on three independent altimeter channels during landing. One channel starts between the other two and then slowly drifts upward over many seconds. What does the vote output while the drift goes on, and is mid-value select by itself a complete fault response?
:::

::: answer
While the drifting channel is still between the other two, it *is* the median, so the output follows it — slightly wrong, but only within the spread of the healthy pair. Once it drifts above both healthy channels, the median switches to the higher healthy channel and stays there, bounded, as the worked example showed.

So the output stays sensible throughout. But mid-value select never flags the drifting channel or tells anything downstream that one input is going bad; it quietly tolerates it. It protects the output but supplies no detection or isolation. That is why lessons 9 and 10 build separate monitoring on top of the vote instead of treating the vote as a fault detector.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Triple modular redundancy (TMR) | Three redundant channels feeding one combining voter |
| Majority vote | Pairs within tolerance agree; average the agreeing channels, flag a channel that disagrees with both others, refuse if no pair agrees |
| Mid-value select | Output the median, always; never refuses, never flags; immune to a single hard-over |
| Averaging voter | Dragged toward an outlier: $(1.00 + 1.02 + 6.00)/3 \approx 2.673$ |
| What a voter detects | Disagreement among redundant channels |
| What a voter cannot detect | A common-mode error: all channels wrong the same way, so all in agreement |
| Remedies for common-mode | Independent measurement, diverse software, a simple independent monitor, verification |
| Deterministic copies | Majority vote with a tight or bit-exact tolerance |
| Independent physical sensors | Mid-value select; a bit-exact majority vote fails to form even when all are healthy |

Lesson 7 keeps the same three-channel setup and adds a fault neither scheme here was built to survive: one channel that reports a different value to each of two computers, so that two healthy computers, each running a correct vote, disagree with each other.

::: context median The middle of three
The **median** of a list is the value in the middle once the list is sorted. For $6.00$, $1.00$, $1.02$, sort to $1.00$, $1.02$, $6.00$; the median is $1.02$. The mean (average) adds everything and divides, so every value pulls on it. The median only cares about order, so one extreme value cannot move it far. That is also why house prices are usually reported as medians: one mansion on the street does not change the median much.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="82">1</text><text x="100" y="82">2</text><text x="160" y="82">3</text>
    <text x="220" y="82">4</text><text x="280" y="82">5</text><text x="340" y="82">6</text>
  </g>
  <circle cx="40" cy="60" r="6" fill="#1d6fd1"/>
  <circle cx="41.2" cy="60" r="6" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="340" cy="60" r="6" fill="#b4232c"/>
  <text x="46" y="36" font-size="12" fill="#1d6fd1">A, B healthy; median 1.02</text>
  <text x="330" y="36" font-size="12" text-anchor="end" fill="#b4232c">C stuck at 6</text>
  <line x1="140" y1="48" x2="140" y2="72" stroke="#f2b880" stroke-width="3"/>
  <text x="140" y="102" font-size="12" text-anchor="middle" fill="#6c7a93">average 2.67</text>
</svg>
```

The healthy pair sits near $1$, the stuck channel at $6$. The median stays with the pair; the average is dragged a third of the way toward the outlier.
:::

::: context hard-over Where "hard-over" comes from
The term comes from steering and actuators: a rudder or control surface that fails "hard over" has slammed to the end of its travel and stayed there. For a sensor it means an output stuck at, or near, the end of its range — a gyro reading its maximum rate while the vehicle sits still. Hard-over failures are the easy kind to catch: they are big and they sit on one side of the healthy channels. The dangerous failures are the small, plausible ones.
:::

::: context same-code Ariane 5: two units, one bug
On its first flight in 1996, Ariane 5 carried two inertial reference units, a working one and a hot spare, running identical software reused from Ariane 4. About $37\,\mathrm{s}$ after liftoff, a conversion of a large horizontal-velocity value into a 16-bit integer overflowed. The spare hit the same overflow first; the active unit hit it moments later. Both shut down, and the rocket broke up. The redundancy was real hardware redundancy — and useless, because the defect was in the software both units shared. It is the textbook common-mode failure; the Flight 501 mishap report, in this module's reading list, tells the whole story.
:::

::: context shuttle-bfs Five computers, two programs
The Space Shuttle carried five identical general-purpose computers. During ascent and entry, four ran the main flight software in a redundant set and voted. The fifth ran the **Backup Flight System**: separate software, written by a different contractor from the same requirements. If a software defect had taken down all four primary computers at once — a common-mode failure no vote could catch — the crew could switch to the backup. It was never needed in flight, but it is a clear, real example of buying diversity against common-mode defects.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="30" width="54" height="40" fill="#8fb8f0"/>
    <rect x="84" y="30" width="54" height="40" fill="#8fb8f0"/>
    <rect x="148" y="30" width="54" height="40" fill="#8fb8f0"/>
    <rect x="212" y="30" width="54" height="40" fill="#8fb8f0"/>
    <rect x="290" y="30" width="54" height="40" fill="#f2b880"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="47" y="55">GPC 1</text><text x="111" y="55">GPC 2</text><text x="175" y="55">GPC 3</text>
    <text x="239" y="55">GPC 4</text><text x="317" y="55">GPC 5</text>
  </g>
  <text x="143" y="20" font-size="12" text-anchor="middle" fill="#1d6fd1">same primary software, voting</text>
  <text x="317" y="20" font-size="12" text-anchor="middle" fill="#b4232c">different software</text>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">a shared bug in the four cannot reach the fifth</text>
</svg>
```
:::

::: context bit-exact Why "bit-exact" is a high bar
Computers store numbers as patterns of bits, and floating-point arithmetic rounds after every operation. Two sensors measuring the same rate with independent noise will almost never produce the same bit pattern. Even the *same* calculation can round differently if the operations happen in a different order: in floating point, $(a + b) + c$ need not equal $a + (b + c)$ to the last bit. Lesson 7 uses exactly this to show healthy computers failing a bit-exact vote.
:::

::: context graceful Degrading gracefully
A system **degrades gracefully** when a failure makes it somewhat worse instead of stopping it cold. A car with one flat tire on a run-flat design still drives, slowly; that is graceful. A car whose engine cuts out when one sensor disagrees is not. For a control loop, graceful degradation means the loop always has a bounded, sensible input, even while one channel goes bad, so it keeps flying while the fault-management logic decides what to do.
:::
