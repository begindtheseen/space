---
id: l09-reading-the-difficulty-rating
title: "What a 2.8 out of 5 difficulty rating indicates"
minutes: 21
covers:
  - "Glassdoor difficulty rating of 2.8 out of 5 for GNC Engineer, and what that really indicates"
---

Picture two school tests. The first is one single brain-twister: most people cannot solve it, and it is over in ten minutes. The second is a whole day of exams — math, science, writing, a speech, a lab — where every question is one you have seen in class. Ask students afterward, "how hard were the questions?" The first test gets a high score. The second gets a middling one. Yet which one would you rather *not* sit?

That picture is the key to one number that gets quoted about this process more than any other: a **[[Glassdoor|glassdoor]]** interview difficulty rating of **2.8 out of 5** for GNC Engineer. Candidates quote it to talk themselves *into* applying, and to talk themselves *out of* preparing. When a number is misread in both directions at once, it is worth reading carefully.

The right reading is neither "easy" nor "meaningless". A 2.8 out of 5 fits perfectly with everything the last four lessons described — a process running five to eight weeks, ending in five to seven back-to-back interviews over more than eight hours. Seeing why those two facts sit together tells you something specific about where your preparation should go.

This lesson does two things. First it clears up the apparent contradiction, which changes *how* you prepare. Then it treats the number as data, which changes how much weight you put on it — and on anything else from the same source.

## The apparent contradiction

On a scale from 1 to 5, the **[[midpoint|midpoint]]** — the middle value — is 3. So 2.8 sits slightly *below* the middle. That is a moderate score, not a fearsome one.

Now set it beside the process this module has described. Up to nine touchpoints. A technical screen with an engineer on the team. A full day of five to seven interviews in a row: a presentation to a panel of five to ten people with long questioning, two to three coding rounds, systems and architecture rounds, domain rounds, and estimation problems. That does not sound like a below-the-middle experience. Candidates who read both facts together usually decide one of them must be wrong.

Neither is wrong. They measure different things. The difference between them is the whole content of this lesson.

## Question difficulty is not process difficulty

A difficulty rating is a judgment about the **questions**: how hard each individual problem felt to the person answering it. It is not a judgment about the **process**: how demanding the whole experience was to get through.

Those two can be wildly different. Look again at the two school tests.

- **One killer question** that almost nobody solves gets a high difficulty rating, even if the whole thing lasts forty-five minutes.
- **A day of thirty basic questions**, each of which you could answer well on a quiet afternoon, gets a moderate difficulty rating — even though the day is exhausting. No single question was exotic, and difficulty is being rated question by question.

This process appears to have the second shape. That gives the number its real meaning. The **filter** — the thing that decides who gets through — is not how hard the questions are.

::: key
A 2.8 out of 5 difficulty rating indicates that the filter is breadth and fluency rather than exotic difficulty. The questions are fundamental; the challenge is answering many of them cleanly, quickly and across several subjects in one day.
:::

Two words in that box need a meaning. **Breadth** is how many different subjects you are solid in. **Fluency** is being able to use what you know smoothly and quickly, the way a fluent speaker does not stop to build each sentence.

### What that means for preparation

Three consequences follow. They are more useful than the number itself.

**1. Fundamentals, not frontier material.** Preparing for unusual or advanced topics is preparing for a difficulty the rating says is not there. The reported phone-screen topics were **[[PD control|pd-control]]**, orbit determination and **[[frequency-domain analysis|frequency-domain]]** — the core of the subject, not its edges. The target is being truly fluent in the standard material, not vaguely familiar with a wider range of it.

**2. Breadth, because depth in one area does not make up for a gap in another.** A day with presentation, coding, systems, domain and estimation rounds is a day in which one weak subject means one weak round. And each weak round gets its own written report at the **debrief**, the meeting where interviewers compare notes. The candidate who is outstanding at estimation but cannot write clean C++ while someone watches does not get to average the two into a pass. This is the most useful consequence of the rating, and the one most often missed.

**3. Speed and cleanness, because "answering many of them" is the real limit.** A question you can answer in four minutes but not in two is — in a thirty-minute screen, or a forty-five-minute round holding several questions — a question you cannot answer. Fluency here means your routine runs without you having to build it on the spot: state the assumptions, give the structure, then the content.

## Treating the number as data

The second half of this lesson asks how much weight the figure can carry. The honest answer: less than the confidence it gets quoted with. There are three reasons.

### It is a voluntary-response sample

Candidates *choose* whether to post an interview report. That makes the reports a **[[voluntary-response sample|voluntary-response]]**: the people in the data picked themselves. Nothing in the average corrects for who chose to post.

That is not a criticism of the site. It is true of every dataset built this way. It means the reports are not a random draw from everyone who interviewed.

Which way does that push the average — up or down? Nobody outside can say. To know, you would need to know who did *not* post and what they would have said — which is exactly the information a voluntary sample does not contain. The honest conclusion is that the bias exists and its direction is unknown. It is not "the number is too high" or "the number is too low".

### The GNC sample is small

This module's own reading of the source says the GNC sample is small. A small sample makes an average **unstable**: a single new report can move it a lot. That is easy to underestimate, so let us make it concrete.

When one new rating $x$ joins $n$ ratings whose **mean** (average) is $\bar{x}$ — read "x bar" — the new mean is the old total plus the new rating, shared over one more report:

$$
\bar{x}_{\text{new}} = \frac{n\,\bar{x} + x}{n + 1}
$$

::: example How far can one report move the average?
We do not know how many reports sit behind the 2.8. So **suppose** — this is a made-up number, for illustration only — it rests on $n = 20$ reports. One more candidate posts and rates the interview a 5.

**Old total.** $20 \times 2.8 = 56$.

**New total.** $56 + 5 = 61$, now shared over $21$ reports.

**New mean.** $61 / 21 \approx 2.90$. One report moved the average by about $0.1$ — a full step in the first decimal place.

**Now the same report added to 200 reports.** Old total $200 \times 2.8 = 560$. New total $565$, over $201$ reports: $565/201 \approx 2.81$. A change of about $0.01$.

**Sanity check.** The shift is the gap between the new rating and the old mean, shared over $n + 1$ reports: $(5 - 2.8)/21 \approx 0.105$ and $(5 - 2.8)/201 \approx 0.011$. Ten times as many reports, about one tenth of the shift — as it should be.
:::

So with a small sample, even the ".8" is fragile: one report can push it to ".9". Treating 2.8 as really different from 2.7 or 2.9 gives it a **[[precision|precision]]** it does not have. "Somewhere near 3" is the honest reading.

### Good for structure, not for money

What interview reports are truly good for is the *shape* of a process: how many rounds, what kinds, in what order, what got asked. That is factual information that many people can report the same way.

**Compensation** figures — pay — from the same source are different. They are self-reported. They are structured differently across job levels and **[[equity|equity]]** arrangements. And they go stale at rates nobody knows. This module's reading is that they are unreliable. Use the source for the map, not for the numbers.

::: warning Do not quote this rating in an interview
There is no version of "I see the interview is rated 2.8 out of 5" that lands well. At best it has nothing to do with the question you were asked. At worst it sounds like you prepared for a reputation instead of for the work. The rating is an input to how you spend your preparation hours. It is not something to bring into the conversation.
:::

## What no number here can tell you

It is worth being clear about the figures this lesson does *not* have, because leaving them out is deliberate.

This course does not know what fraction of candidates pass the phone screen, what fraction of onsites end in offers, how many applications one opening receives, or how any of those vary by role family. No such figure appears anywhere the course can rely on. A believable-sounding one invented here would be repeated by a reader who trusted it — possibly out loud, in an interview.

The difficulty rating is the one number about this process that the module actually carries. That is part of why it deserves a whole lesson of careful reading instead of a footnote.

::: example Two candidates read the same number
Two candidates find the 2.8 rating three weeks before their onsites.

**The first reads it as reassurance.** Below the middle of the scale, she reasons, means the interview is not especially hard. Her control theory is strong: she has spent two years on it and can derive most of it from scratch. So she spends the three weeks going deeper into control — the subject she already owns, and the one most pleasant to study.

On the day, the domain round goes extremely well. The two coding rounds do not. She has not written C++ against a clock in a year. In the first round she spends her time rediscovering how to structure the solution instead of stating an approach and writing it. In the second, she finishes correct code four minutes after time is up. The systems round is adequate. The afternoon estimation question she answers without a cross-check, because she has never practiced making one.

**Count the reports.** Five rounds: the domain round outstanding, systems adequate, the two coding rounds and the estimation round weak. That is one outstanding, one adequate and three weak. None of it contradicts the rating — no question she got was hard in the sense the rating measures. The day beat her on *breadth*, which is exactly what a moderate rating on a long, many-round process predicts.

**The second reads the same number as a statement about where the filter is.** She keeps control on maintenance — an hour a week, enough to stay fluent — and spends the rest of the three weeks on her weakest subjects: C++ against a timer, three systems-design discussions talked through out loud with a friend, and a dozen Fermi problems done properly with cross-checks. Her domain round is good rather than exceptional. Every other round is solid. Her day has no weak report at all.

**Sanity check:** the first candidate had the stronger single subject and the weaker day. That is the rating's meaning, played out.
:::

::: example Reading the reports without trusting the average
A candidate decides to use the interview reports for what they are good for, and not for what they are not.

**She ignores every rating.** What she pulls out instead is structure: whether reports mention a presentation and how long it ran, how many coding rounds appear, whether anyone describes a tour, what subjects the technical screen covered, and how many separate conversations people describe before the onsite. A person posting a report can state these facts accurately, and they do not depend on that person's judgment or mood.

**She treats disagreement as information.** Reports vary. If some describe a take-home exercise and others do not, that fits with a take-home being used for some roles and not all — which is what this module says. She does not average anything.

**She leaves the money alone.** She notices two pay figures, several years apart, that differ a lot. She draws no conclusion from either. Both are self-reported, neither states a job level, and she cannot tell what equity is included.

**She turns gaps into questions.** She keeps the structural picture, drops the numbers, and writes down two questions for the recruiter about the parts the reports disagreed on. That is the only reliable way to settle them.
:::

## Check yourself

::: check
Explain how a difficulty rating below the midpoint of a five-point scale fits with a process of five to seven back-to-back interviews over eight or more hours.
:::

::: answer
The rating measures how hard the individual questions felt, not how demanding the whole process was. A day of many fundamental questions, none of them exotic, earns a moderate question-difficulty rating while still being an exhausting day. Difficulty is judged question by question, and the burden comes from volume, breadth and endurance. The two facts measure different things, so they do not conflict.
:::

::: check
State the three preparation consequences that follow from reading the rating correctly.
:::

::: answer
1. **Fundamentals over frontier material**, since the rating says the questions are standard — the reported screen topics were PD control, orbit determination and frequency-domain analysis.
2. **Breadth**, because depth in one subject does not make up for a gap in another when each round produces its own report.
3. **Speed and cleanness**, because the real limit is answering many questions well in limited time, which needs a routine that runs without being built under pressure.
:::

::: check
Why can nobody say whether a voluntary-response interview rating is biased upward or downward?
:::

::: answer
To know the direction of the bias you would need to know who chose not to post and what they would have said — and that is exactly the information a voluntary-response sample does not contain.

What is certain is that the people who posted are not a random draw from everyone who interviewed. The direction of the resulting error cannot be recovered from the data. So the honest statement is: the bias exists, and its direction is unknown.
:::

::: check
A candidate treats "2.8" as a precise figure, meaningfully different from 2.7 or 2.9. Using a made-up sample size, show why that precision is not justified.
:::

::: answer
Suppose the 2.8 rested on twenty reports. One more report rating the interview 5 gives a new mean of $(20 \times 2.8 + 5)/21 = 61/21 \approx 2.90$ — a jump of about $0.1$ in the first decimal place from a single person.

The same report added to two hundred reports gives $(200 \times 2.8 + 5)/201 = 565/201 \approx 2.81$, a change of only about $0.01$.

Since the GNC sample is described as small, the figure cannot support that precision. "Somewhere near 3" is the honest reading.
:::

::: check
What is this kind of source good for, what is it unreliable for, and why does this lesson refuse to give a pass rate for any stage?
:::

::: answer
It is good for **structure** — the number of rounds, their kinds, their order, the subjects asked — because those are facts people posting reports can state consistently.

It is unreliable for **compensation**, which is self-reported, structured differently across levels and equity arrangements, and goes stale at unknown rates.

It gives no pass rate because no such figure exists in anything this course can rely on. An invented one would be trusted, planned around, and possibly repeated out loud in an interview by a reader with no reason to doubt it.
:::

## Summary

| Claim | Status |
| --- | --- |
| Difficulty rating 2.8 out of 5 for GNC Engineer | The module's stated figure |
| What it measures | How hard the questions felt, not how hard the process was |
| What it indicates | Breadth and fluency are the filter, not exotic difficulty |
| Preparation consequence | Fundamentals, breadth over depth, speed and cleanness |
| Sample type | Voluntary response; not a random draw; bias direction unknown |
| One new rating | New mean $= (n\bar{x} + x)/(n+1)$; a small $n$ means a big swing |
| GNC sample size | Small, so the mean is unstable and its precision is overstated |
| Good for | Process structure — rounds, order, subjects |
| Not good for | Compensation |
| Pass rates, conversion rates, applicant counts | Not known here, and not invented here |

The next lesson takes the practical consequence of everything since lesson five seriously: how to get through eight hours of continuous evaluation with the last round as good as the first.

::: context glassdoor A review site for jobs
**Glassdoor** is a website where people post anonymous reviews of employers: what it is like to work there, what they were paid, and what their interviews were like. Anyone who posts an interview report can rate its difficulty from 1 (very easy) to 5 (very difficult), and the site shows the average for each company and job title. The name suggests seeing through a glass door into a company before you walk in. That is also exactly its limit: you see only what the people who chose to post decided to show you.
:::

::: context midpoint The middle of the scale
On a scale from 1 to 5, the middle is $(1 + 5)/2 = 3$. So 2.8 sits a little below the middle — much closer to 3 than to either end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="42" x2="30" y2="58"/><line x1="105" y1="42" x2="105" y2="58"/><line x1="180" y1="40" x2="180" y2="60"/><line x1="255" y1="42" x2="255" y2="58"/><line x1="330" y1="42" x2="330" y2="58"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="76">1</text><text x="105" y="76">2</text><text x="180" y="76" font-weight="700">3</text><text x="255" y="76">4</text><text x="330" y="76">5</text>
    <text x="30" y="92" font-size="11" fill="#6c7a93">very easy</text><text x="330" y="92" font-size="11" fill="#6c7a93">very hard</text>
  </g>
  <circle cx="165" cy="50" r="6" fill="#b4232c"/>
  <text x="165" y="30" font-size="12" fill="#b4232c" text-anchor="middle">2.8</text>
  <text x="200" y="30" font-size="11" fill="#1f2a44">middle = 3</text>
</svg>
```

Each whole step is 75 units wide, so 2.8 sits $0.2 \times 75 = 15$ units left of the middle mark.
:::

::: context pd-control Push harder the further off you are
**PD control**, said "P-D", stands for **proportional–derivative** control. A controller pushes a vehicle back toward where it should be. The **P** part pushes harder the further off the vehicle is, like a spring. The **D** part pushes against how fast the error is changing, like a shock absorber, so the vehicle does not overshoot and wobble. Written out, the command is $u = -K_p e - K_d \dot{e}$, where $e$ is the error and $\dot{e}$ ("e dot") is how fast it changes. It is one of the first things a GNC engineer learns and uses every week.
:::

::: context frequency-domain Looking at a system by its rhythms
A **frequency-domain analysis** studies how a system responds to steady back-and-forth wiggles of different speeds, instead of following it moment by moment. Push a swing slowly and it follows your hand; push it at exactly the right rhythm and it swings wildly; push too fast and it hardly moves. Plotting that response against the wiggle speed shows at a glance how stable a control loop is and how much safety margin it has. The control modules of the technical track teach it with Bode plots.
:::

::: context voluntary-response Who chooses to answer
A **voluntary-response sample** is one where people decide for themselves whether to be counted — a radio call-in poll, product reviews, or interview reports. The people who choose to answer are often the ones with strong feelings, but you cannot tell in which direction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="200" height="90" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="14" font-size="11" text-anchor="middle" fill="#1f2a44">everyone who interviewed</text>
  <g fill="#6c7a93">
    <circle cx="35" cy="45" r="6"/><circle cx="65" cy="45" r="6"/><circle cx="95" cy="45" r="6"/><circle cx="125" cy="45" r="6"/><circle cx="155" cy="45" r="6"/><circle cx="185" cy="45" r="6"/>
    <circle cx="35" cy="85" r="6"/><circle cx="65" cy="85" r="6"/><circle cx="125" cy="85" r="6"/><circle cx="185" cy="85" r="6"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="95" cy="85" r="6"/><circle cx="155" cy="85" r="6"/><circle cx="65" cy="65" r="6"/>
  </g>
  <line x1="215" y1="65" x2="255" y2="65" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="262,65 252,60 252,70" fill="#1f2a44"/>
  <rect x="270" y="40" width="80" height="50" rx="8" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <g fill="#1d6fd1"><circle cx="290" cy="65" r="6"/><circle cx="310" cy="65" r="6"/><circle cx="330" cy="65" r="6"/></g>
  <text x="310" y="108" font-size="11" text-anchor="middle" fill="#1d6fd1">chose to post</text>
</svg>
```

Here 3 of 13 people posted. The average describes those 3 — and nothing tells you how the other 10 would have rated it.
:::

::: context precision How many digits you can trust
**Precision** is how finely a number claims to be known. Writing "2.8" claims the answer is closer to 2.8 than to 2.7 or 2.9. Writing "2.80" claims even more: that it is not 2.79 or 2.81. A number should carry only as many digits as the data can back up. When one extra report can move the average from 2.8 to 2.9, even the "8" is shaky — and quoting more digits would be claiming knowledge nobody has. Engineers meet the same idea with sensor readings: never report more digits than the sensor can measure.
:::

::: context equity Pay that is part of the company
**Equity** is pay in the form of a piece of ownership in the company — usually shares of stock, often handed over gradually across several years. Its real value depends on what the company is worth later, which nobody knows for certain. So when one person reports "total pay" including equity and another reports only salary, the two numbers are not measuring the same thing. That is one big reason self-reported pay figures are hard to compare, and why this module treats them as unreliable.
:::
