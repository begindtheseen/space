---
id: l01-probability-and-bayes
title: Sample spaces, conditional probability and Bayes' theorem
minutes: 23
covers:
  - sample spaces, conditional probability, Bayes theorem
---

Every sensor on a vehicle lies a little. A gyro reports a turning rate that is not quite the true rate. A GNSS receiver (the satellite-navigation box, like the GPS in a phone) reports a position a few metres off. Now and then a star tracker matches the wrong pattern of stars and reports an attitude that is completely wrong.

Navigation is the job of combining these imperfect reports into a best guess of where the vehicle is and which way it points — plus an honest statement of how unsure that guess is. Probability is the language that turns "imperfect", "best" and "honest" into numbers you can compute with.

This first lesson lays down the small set of rules everything else in the module rests on: what a probability is, how it changes when you learn something, when two facts can be treated as unrelated, and how to turn "how the sensor behaves if the truth is X" into "how likely the truth is X, given what the sensor said". That last step is **Bayes' theorem**. It is not a curiosity. A **[[Kalman filter|kalman-bridge]]** — the navigation program on almost every spacecraft — is Bayes' theorem applied once per measurement. A fault monitor is Bayes' theorem applied to a yes-or-no question. Understand this lesson well and the rest of the module is detail.

## Sample spaces and events

Picture rolling one die. Before it lands you cannot say which face will come up, but you can list every face that *could*: $1, 2, 3, 4, 5, 6$. That list is the whole world of possibilities for this experiment.

The **sample space** $\Omega$ (the Greek capital "omega") is the set of every outcome an experiment could produce. For a coin it is $\{\text{heads}, \text{tails}\}$. For a range sensor it is every real number the reading could take. For a star tracker trying to identify stars it might be $\{\text{correct match}, \text{false match}, \text{no match}\}$.

An **event** is a group of outcomes you care about — a subset of the sample space. "The die shows an even number" is the event $\{2, 4, 6\}$. On a vehicle, "the range reading is more than $3\,\mathrm{m}$ too long" is an event, and so is "at least one of the two IMUs has failed" (an **IMU**, inertial measurement unit, is the box of gyros and accelerometers that senses turning and pushing).

Because events are sets, set language applies. Draw the sample space as a box and each event as a blob inside it, and the words become **[[pictures|venn-picture]]**:

- $A \cap B$, read "A and B" (or "A intersect B"): both happen — the overlap of the blobs.
- $A \cup B$, read "A or B" (or "A union B"): at least one happens — everything inside either blob.
- $A^c$, read "A complement" or "not A": $A$ does not happen — everything in the box outside $A$.

Two events that cannot both happen, so their overlap is empty ($A \cap B = \varnothing$, the empty set), are called **disjoint** or mutually exclusive. "The die shows 1" and "the die shows 6" are disjoint.

### The three rules

A **probability** $P$ attaches a number to every event. Whatever the experiment, it must obey [[three rules|kolmogorov]]:

1. $P(A) \geq 0$ for every event $A$ — no negative chances.
2. $P(\Omega) = 1$ — something in the sample space certainly happens.
3. If $A_1, A_2, \ldots$ are disjoint, then $P(A_1 \cup A_2 \cup \cdots) = P(A_1) + P(A_2) + \cdots$ — chances of things that cannot overlap add up.

Everything else in probability follows from these. Two results you will use constantly come out at once.

First, $A$ and "not $A$" are disjoint and together fill the box, so rule 3 and rule 2 give $P(A) + P(A^c) = 1$, the **complement rule**:

$$
P(A^c) = 1 - P(A).
$$

Second, if $A$ and $B$ can overlap, adding $P(A)$ and $P(B)$ counts the overlap twice. Take it away once and you get **inclusion–exclusion**:

$$
P(A \cup B) = P(A) + P(B) - P(A \cap B).
$$

The complement rule is more useful than it looks. "At least one of these things happens" is almost always easier to work out as one minus "none of them happens".

::: note What the number means
What does $P(A) = 0.02$ actually say? This module takes the engineer's view, which has [[two faces|two-meanings]]. It is the long-run fraction of repeats of the experiment in which $A$ happens — fly the mission ten thousand times and $A$ happens in about two hundred. It is also a fair statement of how strongly the evidence supports $A$ right now. A Monte Carlo campaign estimates the first. A navigation filter keeps track of the second. The mathematics is identical either way.
:::

## Conditional probability

Imagine a class of 30 students. Twelve play soccer, and of those twelve, four also play the trumpet. A friend tells you, "the student I'm thinking of plays soccer." You can now forget the other eighteen — your world has shrunk to the twelve soccer players — and the chance the student plays trumpet is $4/12$.

That is all conditioning is. When you learn that event $B$ happened, every outcome outside $B$ becomes impossible. The sample space shrinks to $B$, and the probabilities inside must be rescaled so they again add up to one. The **conditional probability of $A$ given $B$**, read "P of A given B", is

$$
P(A \mid B) = \frac{P(A \cap B)}{P(B)}, \qquad P(B) > 0.
$$

In words: of all the probability sitting on $B$, what fraction also sits on $A$? The vertical bar $\mid$ is read "given".

Multiply both sides by $P(B)$ and you get the **multiplication rule**, which builds the chance of two things happening together out of one step at a time:

$$
P(A \cap B) = P(A \mid B)\,P(B) = P(B \mid A)\,P(A).
$$

Used again and again it gives the **chain rule**, $P(A \cap B \cap C) = P(A \mid B \cap C)\,P(B \mid C)\,P(C)$.

Conditioning is not a minor technical trick. It is what *learning* looks like in mathematics. Before a measurement arrives, the vehicle's state has some spread of possibilities. After the measurement arrives, the spread is the conditional one, given the measurement. Every filter you will ever write is a machine for computing conditional probabilities.

## Independence

Flip a coin and roll a die. Knowing the coin came up heads tells you nothing about the die. That is **independence**: learning that one event happened does not change the chance of the other.

$$
P(A \mid B) = P(A) \quad\Longleftrightarrow\quad P(A \cap B) = P(A)\,P(B).
$$

The double arrow $\Longleftrightarrow$ is read "is the same as": each statement implies the other. The right-hand form is the usual definition, because it treats $A$ and $B$ the same way and still makes sense when $P(B) = 0$. For several events $A_1, \ldots, A_n$ to be independent all together, the product rule must hold for every smaller group of them, not only for pairs.

Independence is an assumption about the physics, not something you can read off the individual probabilities. Two IMUs in separate boxes, with separate power supplies, may fail independently. Two IMUs bolted to the same bracket, sharing the same heat and the same shaking, will not: if one fails, that raises the chance the other has failed too. Much of the hard-won wisdom in redundancy design is about **[[common-cause failures|common-cause]]** — which is another name for an independence assumption that turned out false.

::: warning Disjoint is not independent
"Disjoint" and "independent" are nearly opposites, and learners often mix them up. Disjoint events cannot happen together, so $P(A \cap B) = 0$. If both have positive probability they are strongly *dependent*: learning that $A$ happened tells you for certain that $B$ did not. Independent events with positive probability can always happen together.
:::

::: example Two IMUs, independent and not
A vehicle carries two IMUs. Each has probability $0.02$ of failing at some point during the flight. Call the events $F_1$ and $F_2$.

**If the failures are independent**, both fail with probability

$$
P(F_1 \cap F_2) = 0.02 \times 0.02 = 4.0 \times 10^{-4}.
$$

At least one fails with probability one minus "neither fails". Each survives with probability $1 - 0.02 = 0.98$, so

$$
P(F_1 \cup F_2) = 1 - P(F_1^c)\,P(F_2^c) = 1 - 0.98^2 = 1 - 0.9604 = 0.0396.
$$

Exactly one fails with probability $2 \times 0.02 \times 0.98 = 0.0392$ (either the first fails and the second survives, or the other way round). Check: $0.0392 + 0.0004 = 0.0396$, matching "at least one". Redundancy has cut the chance of losing all inertial data from $2\%$ to $0.04\%$ — fifty times smaller.

**Now suppose a vibration test** finds that the chance both fail is really $0.008$, because both units sit on one bracket. Then

$$
P(F_2 \mid F_1) = \frac{P(F_1 \cap F_2)}{P(F_1)} = \frac{0.008}{0.02} = 0.40.
$$

Given that one IMU has failed, the other has a $40\%$ chance of having failed too — not the $2\%$ that independence promised. The redundancy is worth far less than the first calculation suggested, and the whole difference lives in the conditional probability.
:::

## The law of total probability

Suppose you want the chance of rain tomorrow. The forecast says there is a $30\%$ chance a storm front arrives. If it does, rain is $90\%$ likely. If it does not, rain is only $10\%$ likely. The overall chance of rain is a weighted average: $0.9 \times 0.3 + 0.1 \times 0.7 = 0.27 + 0.07 = 0.34$.

That is the **law of total probability**. Split the sample space into pieces $B_1, B_2, \ldots, B_n$ that do not overlap and together cover everything — a **partition**. Then $A$ is made of the separate pieces $A \cap B_i$, rule 3 adds them up, and the multiplication rule rewrites each piece:

$$
P(A) = \sum_{i=1}^{n} P(A \cap B_i) = \sum_{i=1}^{n} P(A \mid B_i)\,P(B_i).
$$

The $\sum$ (capital "sigma") means "add up, for $i$ from $1$ to $n$". The result is the conditional chances, each weighted by how likely its scenario is. When the partition is "the fault is present" and "the fault is absent", this sum is the bottom line of Bayes' theorem, which comes next.

## Bayes' theorem

Your smoke alarm goes off. Is the house on fire? The alarm almost always sounds when there *is* a fire. But you were making toast, and toast sets it off too. And real fires are rare, while toast happens every morning. So the most likely story is toast.

That everyday reasoning is Bayes' theorem. The alarm's specification runs in one direction: *given* a fire, how likely is the alarm? The question you care about runs the other way: *given* the alarm, how likely is a fire? Bayes' theorem **reverses the direction of conditioning**.

On a vehicle the specification reads like this: "if the unit is faulty, the monitor fires with probability $0.99$; if it is healthy, it fires with probability $0.005$." The question on board is the reverse: the monitor fired — how likely is a fault?

Write the multiplication rule both ways, $P(A \cap B) = P(A \mid B)P(B) = P(B \mid A)P(A)$, and divide by $P(B)$:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}.
$$

That is the whole derivation. The bottom line is usually expanded by the law of total probability, splitting over "$A$" and "not $A$":

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B \mid A)\,P(A) + P(B \mid A^c)\,P(A^c)}.
$$

The pieces have names, and the same names are used throughout estimation:

- $P(A)$ is the **prior**: what you believed about $A$ before seeing $B$.
- $P(B \mid A)$ is the **likelihood**: how probable the observation $B$ is if $A$ is true. It is the sensor model, run forwards, evaluated at the observation you actually got.
- $P(B)$ is the **evidence**: the overall chance of the observation. It does not depend on which hypothesis you are testing, so when you only compare hypotheses it is a fixed rescaling number, a **normalising constant**.
- $P(A \mid B)$ is the **posterior**: what you believe about $A$ after seeing $B$.

::: key Bayes' theorem
$P(A \mid B) = P(B \mid A)\,P(A)/P(B)$. In estimation the same statement reads **posterior $\propto$ likelihood $\times$ prior** (the symbol $\propto$ is read "is proportional to"). The measurement model, evaluated at the measurement you received, reweights whatever you believed before; the evidence $P(B)$ only rescales the result so it adds up to one.
:::

::: example What an alarm actually tells you
A built-in test watches a flight computer. From qualification testing, the chance the computer is faulty on a given flight is $P(F) = 0.001$. The monitor catches a real fault with probability $P(\text{alarm} \mid F) = 0.99$. On a healthy computer it gives a false alarm with probability $P(\text{alarm} \mid F^c) = 0.005$. The alarm fires. How likely is a real fault?

**Step 1 — the evidence**, by total probability over "faulty" and "healthy" (healthy has probability $1 - 0.001 = 0.999$):

$$
P(\text{alarm}) = 0.99 \times 0.001 + 0.005 \times 0.999 = 0.00099 + 0.004995 = 0.005985.
$$

**Step 2 — Bayes.** Divide the "faulty and alarm" part by the total:

$$
P(F \mid \text{alarm}) = \frac{0.99 \times 0.001}{0.005985} = \frac{0.00099}{0.005985} = 0.165.
$$

A monitor that catches $99\%$ of faults and cries wolf only $0.5\%$ of the time, and yet when it fires the computer is *probably fine*: about five alarms in every six are false. The reason is the **[[prior|base-rate]]**. Faults are so rare that a small false-alarm rate, applied to the huge healthy population, makes more alarms than a big detection rate applied to the tiny faulty one. Sanity check: the posterior $0.165$ sits between the prior $0.001$ and $1$, and it moved up a lot — the alarm is real evidence, only not conclusive.

Two ways to change the answer, both worth knowing:

- **A bigger prior.** After a hard landing makes damage plausible, say $P(F) = 0.05$. The same alarm now gives $\frac{0.99 \times 0.05}{0.99 \times 0.05 + 0.005 \times 0.95} = \frac{0.0495}{0.05425} = 0.912$.
- **A second look.** If the monitor fires on two independent test cycles in a row, the likelihoods multiply: $0.99^2$ if faulty, $0.005^2$ if healthy. The posterior rises to $\frac{0.99^2 \times 0.001}{0.99^2 \times 0.001 + 0.005^2 \times 0.999} = 0.975$. A second look at the evidence is worth more than a better single test.
:::

::: warning The likelihood is not the posterior
$P(B \mid A)$ and $P(A \mid B)$ are different numbers answering different questions. Mixing them up is the single most common error in reasoning about tests and monitors. A test with a $99\%$ detection rate does *not* mean a $99\%$ chance of a fault when it fires. The prior always matters, and when the prior is small the two numbers can differ by a factor of hundreds.
:::

## Bayes as an update rule

On a vehicle, Bayes' theorem is not used once. It is used over and over, as each new observation arrives. Think of a detective: each new clue makes a suspect a little more or a little less likely, and yesterday's conclusion is today's starting point.

Suppose you are weighing two hypotheses, $H_1$ and $H_0$ (say "the star match is correct" and "the star match is false"). Observations $y_1, y_2, \ldots$ arrive one at a time, and given the hypothesis each observation is independent of the others. After the first,

$$
P(H_1 \mid y_1) = \frac{P(y_1 \mid H_1)\,P(H_1)}{P(y_1)}.
$$

When $y_2$ arrives, the posterior after $y_1$ becomes the new prior, and the same formula runs again.

The cleanest way to watch this is with **[[odds|odds]]**: the chance of $H_1$ divided by the chance of $H_0$. Divide Bayes for $H_1$ by Bayes for $H_0$; the evidence $P(y)$ is the same in both, so it cancels. What remains is the **odds form** of Bayes' theorem:

$$
\frac{P(H_1 \mid y_1, \ldots, y_n)}{P(H_0 \mid y_1, \ldots, y_n)}
= \frac{P(H_1)}{P(H_0)} \prod_{k=1}^{n} \frac{P(y_k \mid H_1)}{P(y_k \mid H_0)}.
$$

The $\prod$ (capital "pi") means "multiply together", the way $\sum$ means "add up". In words: **posterior odds equal prior odds times the likelihood ratio of every observation**. An observation more probable under $H_1$ than $H_0$ has a ratio above one and pushes the odds up. One more probable under $H_0$ pushes them down. Take logarithms and the product becomes a running sum — exactly how **[[sequential fault detectors|wald-sprt]]** are built.

::: example Is the star tracker locked onto the right stars?
A star tracker has produced an attitude, but the match might be false. Start neutral: $P(H_1) = 0.5$, so the prior odds are $0.5/0.5 = 1$.

Each new frame gives a residual — the gap between what the tracker sees and what the predicted attitude says it should see — that is either "small" or "large". From testing, a small residual happens with probability $0.9$ if the match is correct and $0.3$ if it is false. So each small residual carries a likelihood ratio of $0.9/0.3 = 3$.

**Three small residuals in a row.** The odds become $1 \times 3 \times 3 \times 3 = 27$. Turn odds back into a probability with $p = \text{odds}/(1 + \text{odds})$:

$$
P(H_1 \mid \text{three small}) = \frac{27}{1 + 27} = 0.964.
$$

A fourth small residual makes the odds $81$ and the probability $81/82 = 0.988$.

**A contrary fourth frame.** Suppose instead the fourth residual is large. That has probability $0.1$ if the match is correct and $0.7$ if false, a ratio of $0.1/0.7 = 1/7$. The odds fall to $27/7 = 3.86$ and the probability to $3.86/4.86 = 0.794$.

One contrary observation does not undo three consistent ones, but it does wipe out most of the confidence the third one bought. That is how a well-behaved belief should move.
:::

::: note From yes-or-no to positions
Everything in this lesson was about events, which either happen or do not. When the unknown is a continuous quantity, like a position, probabilities become probability densities (the next lesson) and sums become integrals. The shape of Bayes' theorem does not change: posterior density is proportional to likelihood times prior density. When both are Gaussian (the bell curve of lesson 4), the posterior is Gaussian too, and its mean is a weighted average of the prior guess and the measurement, each weighted by how much it can be trusted. That single sentence is the Kalman filter, and the lessons on the Gaussian and on linear transformations make every word of it precise.
:::

## Check yourself

::: check
A lander has three thrusters. Each fails to ignite with probability $0.01$, independently of the others. What is the probability that at least one fails to ignite? What would you need to know to trust the independence assumption?
:::

::: answer
Use the complement: "at least one fails" is one minus "all three ignite". Each ignites with probability $0.99$, so

$$
P(\text{at least one fails}) = 1 - 0.99^3 = 1 - 0.970299 = 0.0297,
$$

about $3\%$. To trust independence you would need the ways they fail to be physically unrelated: separate valves, separate igniters, separate propellant lines, and no shared stress such as cold or vibration. A single frozen pipe feeding all three would make the failures strongly dependent, and the true chance could be far higher than $3\%$ even though each thruster on its own is equally reliable.
:::

::: check
For two events, $P(A) = 0.4$, $P(B) = 0.3$ and $P(A \mid B) = 0.5$. Find $P(A \cap B)$, $P(B \mid A)$ and $P(A \cup B)$. Are $A$ and $B$ independent?
:::

::: answer
Multiplication rule: $P(A \cap B) = P(A \mid B)\,P(B) = 0.5 \times 0.3 = 0.15$.

Then $P(B \mid A) = P(A \cap B)/P(A) = 0.15/0.4 = 0.375$.

Inclusion–exclusion: $P(A \cup B) = 0.4 + 0.3 - 0.15 = 0.55$.

They are not independent, because $P(A \mid B) = 0.5$ is not $P(A) = 0.4$. Equivalently, $P(A)P(B) = 0.12$, not $0.15$. Learning $B$ raises the chance of $A$.
:::

::: check
A radar altimeter gives a valid reading with probability $0.95$ over land and $0.60$ over water. On one descent corridor, $80\%$ of possible touchdown points are over land. What is the probability of a valid reading? If the reading is invalid, what is the probability the vehicle is over water?
:::

::: answer
Total probability over {land, water}:

$$
P(\text{valid}) = 0.95 \times 0.8 + 0.60 \times 0.2 = 0.76 + 0.12 = 0.88,
$$

so $P(\text{invalid}) = 1 - 0.88 = 0.12$. Over water an invalid reading has probability $1 - 0.60 = 0.40$. By Bayes,

$$
P(\text{water} \mid \text{invalid}) = \frac{P(\text{invalid} \mid \text{water})\,P(\text{water})}{P(\text{invalid})} = \frac{0.40 \times 0.2}{0.12} = 0.667.
$$

An invalid return more than triples the chance of being over water, from $0.2$ to about $0.67$.
:::

::: check
A GNSS integrity monitor sees a certain pattern in its residuals. Three hypotheses cover every possibility: normal operation (prior $0.97$), one faulty satellite (prior $0.02$), and a jump in the receiver's clock (prior $0.01$). The pattern has likelihood $0.05$ under normal operation, $0.60$ under a satellite fault and $0.30$ under a clock jump. Find the posterior probability of each.
:::

::: answer
Multiply each likelihood by its prior: $0.05 \times 0.97 = 0.0485$, $0.60 \times 0.02 = 0.012$, $0.30 \times 0.01 = 0.003$. The evidence is their sum, $0.0635$.

Divide each by the evidence: normal $0.0485/0.0635 = 0.764$, satellite fault $0.012/0.0635 = 0.189$, clock jump $0.003/0.0635 = 0.047$. Check: $0.764 + 0.189 + 0.047 = 1.000$.

The pattern is twelve times more likely under a satellite fault than under normal operation ($0.60/0.05 = 12$), yet normal is still the best explanation, because its prior is nearly fifty times larger ($0.97/0.02 = 48.5$).
:::

::: check
Explain in one or two sentences why the evidence $P(B)$ can be ignored when you only want to rank hypotheses, but not when you must report a probability.
:::

::: answer
The evidence is the same number for every hypothesis — it depends only on the observation — so dividing by it cannot change which posterior is largest or the ratios between them. But it is exactly the number that makes the posteriors add up to one, so to report an actual probability, like "the fault is present with probability $0.165$", you must compute it, usually with the law of total probability.
:::

## Summary

| Symbol or rule | Meaning |
| --- | --- |
| $\Omega$, $A \subseteq \Omega$ | Sample space of all outcomes; an event is a subset of it |
| $A \cap B$, $A \cup B$, $A^c$ | "A and B", "A or B", "not A" |
| $P(A^c) = 1 - P(A)$ | Complement rule; "at least one" is one minus "none" |
| $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ | Inclusion–exclusion: do not count the overlap twice |
| $P(A \mid B) = P(A \cap B)/P(B)$ | Conditional probability: shrink the world to $B$ and rescale |
| $P(A \cap B) = P(A \mid B)P(B)$ | Multiplication rule |
| $P(A \cap B) = P(A)P(B)$ | Independence — a physical assumption, not a computation |
| $P(A) = \sum_i P(A \mid B_i)P(B_i)$ | Law of total probability over a partition |
| $P(A \mid B) = P(B \mid A)P(A)/P(B)$ | Bayes' theorem: posterior $\propto$ likelihood $\times$ prior |
| Posterior odds $=$ prior odds $\times$ likelihood ratios | Sequential form used by fault detectors |

Next lesson: instead of yes-or-no events you will attach a *number* to every outcome — a random variable — and meet the two functions that describe it, the CDF and the density. Those are what let Bayes' theorem work on continuous things like position and attitude.

::: context kalman-bridge Bayes on board since Apollo
Rudolf Kálmán published his filter in 1960. Within a few years, engineers at NASA Ames led by Stanley Schmidt had adapted it to navigate the Apollo spacecraft to the Moon, and a version of it ran on the Apollo Guidance Computer.

Seen through this lesson, the filter is a loop: predict where the vehicle is (the prior), take a measurement (the likelihood), combine them (the posterior), repeat. You will build that loop piece by piece — the Gaussian in lesson 4, the covariance step in lesson 5, and the consistency tests in lesson 13.
:::

::: context venn-picture Events as blobs in a box
The box is the sample space $\Omega$: every outcome. Each event is a region inside it. The overlap is "A and B"; everything inside either circle is "A or B"; everything in the box outside $A$ is "not A".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="12" width="320" height="146" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="32" y="32" font-size="14" fill="#1f2a44">Ω</text>
  <circle cx="145" cy="88" r="56" fill="#8fb8f0" fill-opacity="0.55" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="215" cy="88" r="56" fill="#f2b880" fill-opacity="0.55" stroke="#b4232c" stroke-width="2"/>
  <text x="112" y="92" font-size="14" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="248" y="92" font-size="14" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="180" y="92" font-size="12" fill="#1f2a44" text-anchor="middle">A∩B</text>
  <text x="300" y="148" font-size="12" fill="#6c7a93" text-anchor="middle">outside both</text>
</svg>
```

Disjoint events are two circles that do not touch at all.
:::

::: context kolmogorov Who wrote the rules down
People computed chances for centuries — for dice, cards and insurance — before anyone agreed on what the foundations were. In 1933 the Russian mathematician Andrey Kolmogorov showed that three short rules are enough: chances are never negative, the whole sample space has chance one, and chances of non-overlapping events add. Every other fact in this module, from Bayes' theorem to the chi-square test, can be derived from those three.
:::

::: context two-meanings Two ways to read a probability
The **frequency** reading: repeat the experiment many times and count. A $2\%$ failure chance means about 2 failures per 100 flights.

The **belief** reading: a number that measures how strongly the evidence you have supports a claim, updated as evidence arrives. This is how a filter treats "the vehicle is within $10\,\mathrm{m}$ of here" — there is only one real flight, so "repeat it many times" does not quite fit.

Statisticians have argued about which reading is right for a long time. For engineering the argument rarely matters, because both readings obey exactly the same three rules and give the same arithmetic.
:::

::: context common-cause One cause, two failures
Redundancy works only if backups fail for *different* reasons. In 1970, on Apollo 13, one of the two oxygen tanks in the service module exploded, and the blast damaged the second tank, which then leaked away too. Two tanks that looked like independent backups were taken out by a single event.

Designers now hunt for shared causes on purpose: a shared bracket, a shared power bus, a shared software bug, a shared batch of parts. Physical separation and dissimilar designs are the usual cures.
:::

::: context base-rate Count the flights instead
Bayes feels less strange if you count cases. Imagine $1{,}000{,}000$ flights. With a fault rate of $0.001$, $1000$ are faulty and $999{,}000$ are healthy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="8" width="120" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="26" font-size="12" fill="#1f2a44" text-anchor="middle">1,000,000 flights</text>
  <line x1="160" y1="34" x2="90" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="34" x2="270" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="66" width="100" height="26" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">1000 faulty</text>
  <rect x="210" y="66" width="120" height="26" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="84" font-size="12" fill="#1f2a44" text-anchor="middle">999,000 healthy</text>
  <line x1="90" y1="92" x2="90" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="270" y1="92" x2="270" y2="122" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="96" y="112" font-size="11" fill="#6c7a93">× 0.99</text>
  <text x="276" y="112" font-size="11" fill="#6c7a93">× 0.005</text>
  <text x="90" y="138" font-size="12" fill="#b4232c" text-anchor="middle">990 alarms</text>
  <text x="270" y="138" font-size="12" fill="#b4232c" text-anchor="middle">4995 alarms</text>
  <text x="180" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">real faults among alarms: 990 / 5985 = 0.165</text>
</svg>
```

Most alarms come from the big healthy group, not the small faulty one. Doctors call this the base-rate effect: a good test for a rare condition still gives many false positives.
:::

::: context odds Odds, as at a racetrack
Odds compare the chance *for* with the chance *against*. A probability of $0.75$ is odds of $0.75/0.25 = 3$, "three to one". Odds of $27$ mean 27 chances for every 1 against, so a probability of $27/28$.

To convert back, use $p = \text{odds}/(1 + \text{odds})$. Odds of $1$ mean even chances, $p = 0.5$. Odds are handy for updating because each new observation *multiplies* them by its likelihood ratio. Here are the star-tracker probabilities after each frame; the red bar is the large-residual fourth frame.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="36" y1="20" x2="340" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="32" y="24" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="32" y="99" font-size="11" fill="#1f2a44" text-anchor="end">0.5</text>
  <text x="32" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <rect x="55" y="95" width="34" height="75" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="100" y="57.5" width="34" height="112.5" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="145" y="35" width="34" height="135" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="190" y="25.4" width="34" height="144.6" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="235" y="21.8" width="34" height="148.2" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="285" y="50.9" width="34" height="119.1" fill="#b4232c" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="72" y="186">start</text><text x="117" y="186">1</text><text x="162" y="186">2</text>
    <text x="207" y="186">3</text><text x="252" y="186">4 small</text><text x="302" y="186">4 large</text>
    <text x="72" y="90">0.5</text><text x="117" y="52">0.75</text><text x="162" y="31">0.9</text>
    <text x="302" y="46">0.79</text>
  </g>
</svg>
```
:::

::: context wald-sprt Keep a running score
During the Second World War the statistician Abraham Wald worked out the best way to decide between two hypotheses when data arrive one at a time: the **sequential probability ratio test**. Keep a running sum of the logarithms of the likelihood ratios. Stop and declare $H_1$ when the sum climbs above an upper threshold; declare $H_0$ when it falls below a lower one; otherwise wait for the next observation.

Adding logs instead of multiplying ratios keeps the numbers a sensible size, and it is cheap enough to run on a flight computer at every sensor sample. Many fault detectors on satellites and aircraft are built this way.
:::
