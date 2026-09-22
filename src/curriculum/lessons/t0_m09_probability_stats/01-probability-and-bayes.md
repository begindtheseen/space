---
id: l01-probability-and-bayes
title: Sample spaces, conditional probability and Bayes' theorem
minutes: 20
covers:
  - sample spaces, conditional probability, Bayes theorem
---

Every sensor on a vehicle lies a little. A gyro reports a rate that is not quite the true rate, a GNSS receiver reports a position that is a few metres off, a star tracker occasionally locks onto the wrong pattern and reports an attitude that is completely wrong. Navigation is the discipline of combining these imperfect reports into a best estimate of where the vehicle is and how it is oriented, together with an honest statement of how uncertain that estimate is. Probability theory is the language in which "imperfect", "best" and "honest" become precise.

This first lesson lays down the small set of rules that everything else in the module rests on: what a probability is, how it changes when you learn something (conditioning), when two pieces of information can be treated as unrelated (independence), and how to turn a model of *how sensors behave given the truth* into a statement about *what the truth probably is given the sensors*. That last step is Bayes' theorem, and it is not a curiosity. A Kalman filter is Bayes' theorem applied once per measurement; a fault-detection monitor is Bayes' theorem applied to a yes-or-no question. If you understand this lesson thoroughly, the rest of the module is detail.

The reader is assumed to be comfortable with sets, sums and integrals. Nothing here needs more than that.

## Sample spaces and events

Start with an experiment whose outcome you cannot predict: one execution of a launch, one reading of a range sensor, one attempt by a star tracker to identify the stars in its field of view. The **sample space** $\Omega$ is the set of every outcome the experiment could produce. For a coin it is $\{\text{heads}, \text{tails}\}$; for a range sensor it is the set of all real numbers the reading could take; for a star tracker it might be $\{\text{correct match}, \text{false match}, \text{no match}\}$.

An **event** is a subset of the sample space: a collection of outcomes you care about as a group. "The range reading is more than 3 m too long" is an event. "At least one of the two IMUs has failed" is an event. Because events are sets, the language of sets applies. The event that $A$ *and* $B$ both happen is the intersection $A \cap B$; the event that $A$ *or* $B$ (or both) happens is the union $A \cup B$; the event that $A$ does not happen is the complement $A^c$. Two events that cannot both occur, so that $A \cap B = \varnothing$, are called **disjoint** or mutually exclusive.

A **probability measure** $P$ assigns a number to every event, and it must obey three rules:

1. $P(A) \geq 0$ for every event $A$;
2. $P(\Omega) = 1$: something in the sample space happens;
3. if $A_1, A_2, \ldots$ are disjoint, then $P(A_1 \cup A_2 \cup \cdots) = P(A_1) + P(A_2) + \cdots$.

Everything else about probability is a consequence of these three axioms. Two consequences you will use constantly follow immediately. Since $A$ and $A^c$ are disjoint and their union is $\Omega$,

$$
P(A^c) = 1 - P(A).
$$

And for two events that may overlap, counting the overlap once rather than twice gives the **inclusion–exclusion** rule

$$
P(A \cup B) = P(A) + P(B) - P(A \cap B).
$$

The complement rule is more useful than it looks. "At least one of these things happens" is almost always easier to compute as one minus "none of them happens".

::: note
What does the number $P(A)$ mean? In this module we take the engineering view: $P(A)$ is the long-run fraction of repetitions of the experiment in which $A$ occurs, and, equivalently, a fair statement of how strongly the evidence supports $A$. A Monte Carlo campaign estimates the first; a navigation filter maintains the second. The mathematics is identical either way, which is why the interpretation debate rarely matters on a vehicle.
:::

## Conditional probability

Suppose you learn that event $B$ has occurred. Outcomes outside $B$ are now impossible, so the sample space has effectively shrunk to $B$, and the probabilities of the remaining outcomes must be rescaled so that they again add up to one. The **conditional probability of $A$ given $B$** is

$$
P(A \mid B) = \frac{P(A \cap B)}{P(B)}, \qquad P(B) > 0.
$$

Read it as: of the probability that sat on $B$, what fraction also sits on $A$? Rearranged, it becomes the **multiplication rule**

$$
P(A \cap B) = P(A \mid B)\,P(B) = P(B \mid A)\,P(A),
$$

which is how you build the probability of a joint event out of a chain of conditional steps. Applied repeatedly it gives the chain rule $P(A \cap B \cap C) = P(A \mid B \cap C)\,P(B \mid C)\,P(C)$.

Conditioning is not a minor technical device. It is the mathematical form of *learning*. Before a measurement arrives, the vehicle's state has some probability distribution; after it arrives, the distribution is the conditional one given the measurement. Every filter you will ever write is an engine for computing conditional probabilities.

## Independence

Two events are **independent** if learning that one happened tells you nothing about the other:

$$
P(A \mid B) = P(A) \quad\Longleftrightarrow\quad P(A \cap B) = P(A)\,P(B).
$$

The second form is the usual definition because it is symmetric and does not need $P(B) > 0$. For several events $A_1, \ldots, A_n$ to be mutually independent, the product rule must hold for every sub-collection, not only for pairs.

Independence is an assumption about the physics, not a fact you can read off the probabilities of the individual events. Two IMUs in separate boxes with separate power supplies may fail independently. Two IMUs bolted to the same bracket, sharing a thermal environment and a vibration spectrum, will not: a failure of one raises the probability that the other has failed too. Most of the hard-won lessons in redundancy management are about common-cause failures, which is another name for the failure of an independence assumption.

::: warning
"Disjoint" and "independent" are almost opposites, and learners mix them up. Disjoint events cannot happen together, so $P(A \cap B) = 0$; if both have positive probability they are strongly *dependent*, because learning that $A$ happened tells you for certain that $B$ did not. Independent events with positive probability always can happen together.
:::

::: example Dual-redundant IMUs
A vehicle carries two IMUs. Suppose each has probability $0.02$ of failing at some point during the flight, and that the failures are independent. The probability that both fail is

$$
P(F_1 \cap F_2) = 0.02 \times 0.02 = 4.0 \times 10^{-4}.
$$

The probability that at least one fails is easiest by the complement:

$$
P(F_1 \cup F_2) = 1 - P(F_1^c)\,P(F_2^c) = 1 - 0.98^2 = 0.0396,
$$

and exactly one fails with probability $2 \times 0.02 \times 0.98 = 0.0392$. Redundancy has cut the probability of losing all inertial data from $2\%$ to $0.04\%$, a factor of fifty.

Now suppose a vibration analysis finds that the joint failure probability is actually $0.008$ because both units sit on the same bracket. Then

$$
P(F_2 \mid F_1) = \frac{P(F_1 \cap F_2)}{P(F_1)} = \frac{0.008}{0.02} = 0.40.
$$

Given that one IMU has failed, the other has a $40\%$ chance of having failed too, against $2\%$ under independence. The redundancy is worth far less than the independent calculation suggested, and the difference is entirely in the conditional probability.
:::

## The law of total probability

Often you know how likely an event is under each of several scenarios, and how likely each scenario is, and want the overall probability of the event. If $B_1, B_2, \ldots, B_n$ are disjoint and together cover the whole sample space (a **partition**), then $A$ is the disjoint union of the pieces $A \cap B_i$, and the third axiom together with the multiplication rule gives the **law of total probability**:

$$
P(A) = \sum_{i=1}^{n} P(A \cap B_i) = \sum_{i=1}^{n} P(A \mid B_i)\,P(B_i).
$$

It is a weighted average of the conditional probabilities, weighted by how likely each scenario is. When the partition is "the fault is present" and "the fault is absent", it is the denominator of Bayes' theorem, which we come to now.

## Bayes' theorem

Sensor models are naturally written in the forward direction: *given* the true state, how does the sensor behave? A fault monitor's specification says "if the unit is faulty, the alarm fires with probability 0.99; if it is healthy, the alarm fires with probability 0.005". But the question you need answered on the vehicle runs the other way: the alarm has fired, so what is the probability that the unit is faulty? Bayes' theorem reverses the direction of conditioning.

Write the multiplication rule both ways, $P(A \cap B) = P(A \mid B)P(B) = P(B \mid A)P(A)$, and divide by $P(B)$:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}.
$$

That is the whole derivation. The denominator is usually expanded with the law of total probability over $A$ and its complement:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B \mid A)\,P(A) + P(B \mid A^c)\,P(A^c)}.
$$

The names of the pieces matter, because the same names are used throughout estimation theory:

- $P(A)$ is the **prior**: what you believed about $A$ before seeing $B$.
- $P(B \mid A)$ is the **likelihood**: how probable the observation $B$ is if $A$ is true. It is the forward sensor model, evaluated at the observation you actually got.
- $P(B)$ is the **evidence** or marginal probability of the observation. It does not depend on $A$, so for the purpose of comparing hypotheses it is a normalising constant.
- $P(A \mid B)$ is the **posterior**: what you believe about $A$ after seeing $B$.

::: key
Bayes' theorem: $P(A \mid B) = P(B \mid A)\,P(A)/P(B)$. In estimation the same statement reads **posterior $\propto$ likelihood $\times$ prior**: the measurement model, evaluated at the measurement you received, reweights whatever you believed before, and the evidence $P(B)$ only rescales the result so that it sums to one.
:::

::: example What an alarm actually tells you
A built-in test monitors a flight computer. From qualification data, the probability that the computer is faulty on any given flight is $P(F) = 0.001$. The monitor detects a real fault with probability $P(\text{alarm} \mid F) = 0.99$ and raises a false alarm on a healthy computer with probability $P(\text{alarm} \mid F^c) = 0.005$. The alarm fires. How likely is a real fault?

First the evidence, by total probability:

$$
P(\text{alarm}) = 0.99 \times 0.001 + 0.005 \times 0.999 = 0.00099 + 0.004995 = 0.005985.
$$

Then Bayes:

$$
P(F \mid \text{alarm}) = \frac{0.99 \times 0.001}{0.005985} = 0.165.
$$

An alarm from a monitor that catches $99\%$ of faults and cries wolf only $0.5\%$ of the time still means the computer is *probably fine*: about five out of every six alarms are false. The reason is the prior. Faults are so rare that the small false-alarm rate applied to the large healthy population produces more alarms than the large detection rate applied to the tiny faulty population.

Two ways to change the conclusion, both instructive. If the prior were $P(F) = 0.05$ (say, after a hard landing that makes damage plausible), the same alarm would give $P(F \mid \text{alarm}) = 0.912$. And if the monitor fired on two independent test cycles in a row, the likelihoods multiply: $P(\text{two alarms} \mid F) = 0.99^2$ and $P(\text{two alarms} \mid F^c) = 0.005^2$, so the posterior rises to $0.975$. A second look at the evidence is worth more than a better single test.
:::

## Bayes as an update rule

The alarm example hints at the way Bayes' theorem is actually used on a vehicle: not once, but over and over as observations arrive. Suppose you are weighing two hypotheses $H_1$ and $H_0$ and observations $y_1, y_2, \ldots$ arrive in sequence, each one independent of the others given the hypothesis. After the first observation,

$$
P(H_1 \mid y_1) = \frac{P(y_1 \mid H_1)\,P(H_1)}{P(y_1)}.
$$

For the second observation, the posterior after $y_1$ becomes the prior, and the same formula is applied again. Because the evidence terms are the same for both hypotheses, the cleanest way to see what is happening is to divide the posterior of $H_1$ by that of $H_0$. Evidence cancels, and the **odds form** of Bayes' theorem appears:

$$
\frac{P(H_1 \mid y_1, \ldots, y_n)}{P(H_0 \mid y_1, \ldots, y_n)}
= \frac{P(H_1)}{P(H_0)} \prod_{k=1}^{n} \frac{P(y_k \mid H_1)}{P(y_k \mid H_0)}.
$$

Posterior odds equal prior odds multiplied by the **likelihood ratio** of every observation. Each observation that is more probable under $H_1$ than under $H_0$ pushes the odds up by its ratio; each observation more probable under $H_0$ pushes them down. Taking logarithms turns the product into a running sum, which is exactly how sequential fault detectors are implemented.

::: example Is the star tracker locked onto the right stars?
A star tracker has produced an attitude solution, but the match may be false. Take the prior probability of a correct match to be $P(H_1) = 0.5$, so the prior odds are $1$. Each subsequent frame produces a residual against the propagated attitude that is either "small" or "large". From the tracker's characterisation, a small residual occurs with probability $0.9$ if the match is correct and $0.3$ if it is false, so each small residual carries a likelihood ratio of $0.9/0.3 = 3$.

After three consecutive small residuals the posterior odds are $1 \times 3^3 = 27$, so

$$
P(H_1 \mid \text{three small}) = \frac{27}{1 + 27} = 0.964.
$$

After a fourth, the odds are $81$ and the probability $0.988$. Now suppose instead that the fourth residual is large. A large residual has probability $0.1$ under $H_1$ and $0.7$ under $H_0$, a likelihood ratio of $1/7$, so the odds fall to $27/7 = 3.86$ and the posterior to $0.794$. One contrary observation does not undo three consistent ones, but it does cost most of the confidence that the third one bought. That is what a well-behaved belief update should do.
:::

::: warning
The likelihood $P(B \mid A)$ and the posterior $P(A \mid B)$ are different numbers that answer different questions, and confusing them is the single most common error in reasoning about tests and monitors. A test with a $99\%$ detection rate does not imply a $99\%$ chance of a fault when it fires. The prior always matters, and when the prior is small the two numbers can differ by a factor of hundreds.
:::

::: note
Everything in this lesson was stated for events, which take values "happened" or "did not". When the unknown is a continuous quantity such as a position, the probabilities become probability densities and the sums become integrals, but the structure of Bayes' theorem is unchanged: posterior density is proportional to likelihood times prior density. When both are Gaussian the result is again Gaussian, and its mean is a weighted average of the prior mean and the measurement, weighted by how much each is to be trusted. That single sentence is the Kalman filter; the lessons on the Gaussian and on linear transformations will make every word of it precise.
:::

## Check yourself

::: check
A lander has three thrusters, each of which fails to ignite with probability $0.01$, independently. What is the probability that at least one fails to ignite? What would you need to know to trust the independence assumption?
:::

::: answer
By the complement rule, $P(\text{at least one fails}) = 1 - 0.99^3 = 0.0297$, about $3\%$. To trust independence you would need the failure mechanisms to be physically unrelated: separate valves, separate igniters, separate propellant feed lines and no shared environmental stress. A single frozen manifold feeding all three would make the failures strongly dependent and the true probability could be far higher than $3\%$ even though each thruster's individual reliability is unchanged.
:::

::: check
For two events, $P(A) = 0.4$, $P(B) = 0.3$ and $P(A \mid B) = 0.5$. Find $P(A \cap B)$, $P(B \mid A)$ and $P(A \cup B)$. Are $A$ and $B$ independent?
:::

::: answer
From the multiplication rule, $P(A \cap B) = P(A \mid B)P(B) = 0.5 \times 0.3 = 0.15$. Then $P(B \mid A) = P(A \cap B)/P(A) = 0.15/0.4 = 0.375$. Inclusion–exclusion gives $P(A \cup B) = 0.4 + 0.3 - 0.15 = 0.55$. They are not independent, because $P(A \mid B) = 0.5 \neq P(A) = 0.4$; equivalently $P(A)P(B) = 0.12 \neq 0.15$. Learning $B$ raises the probability of $A$.
:::

::: check
A radar altimeter returns a valid reading with probability $0.95$ when the terrain below is land and $0.60$ when it is water. On a particular descent corridor, $80\%$ of the possible touchdown points are over land. What is the probability of a valid reading? If the reading is invalid, what is the probability the vehicle is over water?
:::

::: answer
Total probability over the partition {land, water}: $P(\text{valid}) = 0.95 \times 0.8 + 0.60 \times 0.2 = 0.76 + 0.12 = 0.88$. So $P(\text{invalid}) = 0.12$. By Bayes, $P(\text{water} \mid \text{invalid}) = P(\text{invalid} \mid \text{water})P(\text{water})/P(\text{invalid}) = (0.40 \times 0.2)/0.12 = 0.667$. An invalid return more than triples the probability of being over water, from $0.2$ to about $0.67$.
:::

::: check
A GNSS integrity monitor observes a particular residual pattern. Three hypotheses partition the possibilities: nominal operation with prior $0.97$, a single-satellite fault with prior $0.02$, and a receiver clock jump with prior $0.01$. The pattern has likelihood $0.05$ under nominal, $0.60$ under a satellite fault and $0.30$ under a clock jump. Compute the posterior probability of each hypothesis.
:::

::: answer
The evidence is $0.05 \times 0.97 + 0.60 \times 0.02 + 0.30 \times 0.01 = 0.0485 + 0.012 + 0.003 = 0.0635$. The posteriors are the unnormalised products divided by the evidence: nominal $0.0485/0.0635 = 0.764$, satellite fault $0.012/0.0635 = 0.189$, clock jump $0.003/0.0635 = 0.047$. Although the pattern is twelve times more likely under a satellite fault than under nominal operation, nominal remains the most probable explanation because its prior is nearly fifty times larger. Notice that the three posteriors sum to one, as they must.
:::

::: check
Explain in one or two sentences why the evidence $P(B)$ can be ignored when the goal is to rank hypotheses, and why it cannot be ignored when the goal is to report a probability.
:::

::: answer
The evidence is the same number for every hypothesis, since it depends only on the observation, so dividing by it does not change which hypothesis has the largest posterior or the ratios between posteriors. But it is exactly the constant that makes the posteriors sum to one, so if you want an actual probability such as "the fault is present with probability 0.165" you must compute it, usually with the law of total probability.
:::

## Summary

| Symbol or rule | Meaning |
| --- | --- |
| $\Omega$, $A \subseteq \Omega$ | Sample space of all outcomes; an event is a subset |
| $P(A^c) = 1 - P(A)$ | Complement rule; "at least one" is one minus "none" |
| $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ | Inclusion–exclusion |
| $P(A \mid B) = P(A \cap B)/P(B)$ | Conditional probability: rescale to the shrunken sample space |
| $P(A \cap B) = P(A \mid B)P(B)$ | Multiplication rule |
| $P(A \cap B) = P(A)P(B)$ | Independence (a physical assumption, not a computation) |
| $P(A) = \sum_i P(A \mid B_i)P(B_i)$ | Law of total probability over a partition |
| $P(A \mid B) = P(B \mid A)P(A)/P(B)$ | Bayes' theorem: posterior $\propto$ likelihood $\times$ prior |
| Posterior odds $=$ prior odds $\times$ likelihood ratio | Sequential form used by fault detectors |

The next lesson replaces events with random variables, which attach a number to every outcome, and introduces the density and distribution functions that let Bayes' theorem operate on continuous quantities like position and attitude.
