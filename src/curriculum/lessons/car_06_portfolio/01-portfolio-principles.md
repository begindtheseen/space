---
id: l01-portfolio-principles
title: "Portfolio principles: few, deep, and defensible"
minutes: 22
covers:
  - "portfolio principles: few, deep, documented, defensible, reproducible"
  - "what not to build: tutorial follow-alongs, notebooks without validation, thirty shallow repositories"
---

Think about a science fair. One student has a poster covered in pictures, and when the judge asks "why did you do it that way?", the answer is "the website said to." Another has a plain poster but can answer the first question, the second and the tenth, because every choice on it was theirs. The judge remembers the second student.

A **portfolio** — a small collection of your own projects that shows what you can do — works the same way when you apply for a guidance, navigation and control (GNC) job. Without a degree behind you, it is not a side dish next to your application — it *is* the application. You have no transcript saying a university checked your skills. You have a few things you built, and the question is whether they hold up once a skilled engineer starts asking about them.

Most self-taught portfolios do not fail because the work is bad. They fail because the work was built to be *shown*, and the interview does not look at work — it questions it. This module is about a portfolio that survives questioning: one that keeps giving correct, specific answers after the fifth follow-up from someone who has fixed this exact kind of problem and knows where it usually breaks.

This lesson sets the standard: five words for what a portfolio should be, a five-part test for whether a project passes, and the kinds of project not to build. Later lessons cover the projects themselves — a six-degree-of-freedom (6-DOF) flight simulation, a landing-guidance solver, an attitude filter, an orbit fit, and a momentum-management study. Choosing a good project is half the job. The other half, where most people slip first, is writing it up so it survives the conversation that follows.

## Few and deep: what the interview rewards

A project review for a GNC job is less like a tour of everything you built and more like a **[[thesis defense|thesis-defense]]** squeezed into one project: you present it for fifteen or twenty minutes, and then a panel spends most of the remaining time asking about the parts you did *not* present. The option you turned down. The case that broke first. The number you cannot produce on the spot.

So a project you can defend for an hour, from five angles, is worth more than five projects you can each describe for two minutes. The two-minute version gets pushed past its depth by minute three.

That is why **few** and **deep** come first. **Deep** means your understanding reaches well past the point where your description stops. That depth comes from decisions. A real project forces choices: this integrator (the code that steps the math forward in time), not that one; this measurement model, not a simpler one. Each choice is a question you have already answered once. A project thrown together to fill a slot never had to choose, so there is nothing under the description to ask about.

Ten projects look busier in a list than three. But three projects, each showing something different and each defensible for an hour, beat ten at half that standard. Depth shows up when someone asks the second question — exactly where breadth runs out.

::: key The portfolio principle
Few, deep, documented, defensible, reproducible. Three projects you can defend for an hour each beat thirty you can describe for two minutes each, because the interview format rewards depth under questioning. What gets measured is how far your understanding reaches past your description — and a project built quickly to fill a slot does not have that.
:::

## Defensible: the five things a project needs

**Defensible** does not mean "good." A defensible project is one where five specific things exist, *in writing*, and can be pointed at when someone asks. When one is missing, even strong engineering falls over at the second question.

**1. A stated requirement it was built against.** A **requirement** is the bar the project had to clear — land within some distance, estimate the spacecraft's pointing to some accuracy, finish within some time. It turns a number into a result. "My filter's [[RMS error|rms-and-sigma]] is 0.3 degrees" means nothing alone. "My filter had to know the spacecraft's pointing to 0.5 degrees, 1-sigma, and it achieved 0.3" is something a reviewer can judge, because there is a bar. With no requirement, you invite the most damaging question in the whole review: good compared to what?

**2. A model whose assumptions are written down.** A **model** is the set of equations your code treats as the truth about the world. Every model rests on **assumptions** — simplifications like "the vehicle is a rigid body," "it's a single point of mass," "the sensor noise is random and unconnected from one moment to the next." They are not weaknesses to hide; they are the edges of what your result means. Leaving them unsaid forces the reviewer to guess, and an experienced reviewer's guess is rarely kind.

**3. Verification evidence that is not "it ran."** This is the biggest gap between a hobby project and an engineering one. "The simulation finished without crashing" and "the path looked about right" are both perfectly compatible with a serious hidden bug — a flipped sign in a cross product, an uncertainty that is quietly wrong by a factor of ten. A defensible project says exactly *how* correctness was checked: a known-answer case matched to a stated tolerance, a quantity physics says must stay constant that did, an error that shrank at the predicted rate. Lesson 3 builds this toolkit.

**4. A known-failure section.** Every real project has a case that broke, a loosened tolerance, or a range where the result stops being trustworthy. Name it in writing before a reviewer finds it by asking. A project with no stated limitation reads one of two ways — "nobody looked closely enough to find one" or "someone found one and left it out" — and the reviewer cannot tell which. Both readings hurt you.

**5. A clear line between what you built and what a library did.** A **[[library|library]]** is code someone else wrote that you call. A project that calls `scipy.integrate.solve_ivp` and reports a trajectory shows you can call a library function. A project that derives the equations of motion, writes its own integrator, and uses `solve_ivp` only as an outside cross-check shows something far bigger. From outside the two look the same unless you *say* which one you did — and that sentence answers, in advance, the question every reviewer eventually asks: which parts of this are yours?

::: key Defensible
Defensible means five things exist in writing: a stated requirement, written-down model assumptions, verification evidence beyond "it ran," a named known-failure case, and a clear statement of what you built versus what a library provided. Missing one does not make a project "mostly done" — it makes it exactly as strong as its [[weakest of the five|weakest-link]], because that is the one a good question finds first.
:::

## Documented and reproducible: for a stranger who does not trust you yet

The last two words get full lessons later. They belong on the list because they solve the same problem: a reviewer who has never met you starts at zero trust, and everything about the project either builds that trust or spends it.

**Documented** means the five things above are written where a stranger can find them in minutes — not scattered through old commit messages, not explained only in person. A test result that lives only in your memory is evidence to nobody but you. The next lesson builds that written structure.

**Reproducible** means a stranger can get your result themselves, from your code, without asking you anything. A claim nobody else can repeat is really a claim about your computer on some past afternoon. It sits at the same level as defensibility — not a nice extra on top.

## Weak versus strong: one project, told two ways

To see what these words are worth, take one project and write it up twice. The code is identical. Only the write-up changes.

The project is an orbit **propagator**: a program that takes where a satellite is and how fast it is moving, and steps it forward in time to predict where it will be. It uses [[RK4|rk4]], a standard recipe for taking those steps. Some terms in the strong version — J2, the eccentricity $e$ (how stretched the orbit is), the energy $\varepsilon$ — come later in the course; watch the *shape* of the write-up.

::: example A two-body orbit propagator: weak README versus strong README
**Weak version.** "This project implements a two-body orbital propagator in Python using RK4 integration. It takes an initial position and velocity and propagates the orbit forward in time. Tested on a few sample orbits and it works well."

Hold it against the five-part test:

- Requirement? None. Accurate to what, over how long?
- Assumptions? None written down.
- Verification? "Works well" is the author's impression, not a check anyone can repeat.
- Known failure? None.
- What is yours versus a library's? Not said.

Nothing here answers the first real question: how do you know it's right?

**Strong version.** "Propagates a two-body orbit from an initial state. Requirement: specific orbital energy is conserved to better than $10^{-12}$ relative error over at least ten orbital periods. Uses a fixed-step RK4 integrator written from scratch (no `scipy.integrate` in the propagation path; `solve_ivp` appears only in `tests/cross_check.py` as an independent comparison). Assumptions: point-mass two-body gravity only, no J2 or higher terms, no atmospheric drag — valid only for spans short enough that these are negligible, and not tested beyond that. Verification: for a 7000 km, $e = 0.01$ orbit propagated for 20 orbital periods at a 1 s step, the specific energy computed from the initial state matches the closed-form value $\varepsilon = -\mu/2a$ to about $10^{-16}$ (rounding level), and its largest relative drift over the run is $3.9\times10^{-14}$ — see `tests/energy_conservation.py`. Known limitation: the requirement holds only at small steps. At a 10 s step the same orbit already drifts by about $2.5\times10^{-11}$ in a single period, which fails it. Highly eccentric orbits ($e > 0.9$) are harder still, because a fixed step cannot shrink during the fast pass close to Earth; an adaptive-step method would be needed there."

Run the same test on the strong version and all five items are there, each with a number or a file name.

Sanity check on the numbers: the requirement was $10^{-12}$, and $3.9\times10^{-14}$ is about 25 times smaller, so the 1 s run passes with room to spare; $2.5\times10^{-11}$ is 25 times *bigger* than $10^{-12}$, so the 10 s run fails. The limitation is consistent with the requirement.
:::

The code did not change — only whether the five things got written down.

## What not to build

Three kinds of project turn up again and again in self-taught portfolios. All three fail the five-part test by their very shape, no matter how many hours go in.

**Tutorial follow-alongs.** A **tutorial follow-along** is working through someone else's blog post, course or textbook example step by step. It shows you can follow instructions. It does not show engineering judgment, because every decision in it — which filter, which way to chop time into steps, which tolerance — was made by the tutorial's author, not you. You can hear the problem in the questions. "Why an [[EKF instead of a UKF|ekf-ukf]] here?" has no real answer except "the tutorial used one." Resembling a famous problem is fine; borrowed decisions are not.

**Notebooks without validation.** A [[notebook|notebook]] full of good-looking plots is evidence that code ran and made numbers. It is not evidence the numbers are right — and that is exactly the gap verification exists to close. A smooth plot convinces the person who made it, but smooth is not correct: a sign error or a wrongly scaled uncertainty can draw a perfectly smooth, perfectly wrong curve. A notebook becomes defensible the moment it gains a stated requirement and evidence, beyond "it looks right," that the requirement was met.

**Thirty shallow repositories.** A **[[repository|repository]]** (a "repo") is one project's folder of code and history, kept online. A profile with dozens of small demo repos reads as busyness, not depth. It also costs you the **benefit of the doubt** — the reviewer's willingness to assume the best. A reviewer who opens a couple at random and finds nothing defensible will reasonably stop looking, so every shallow repo pulls attention away from your good ones.

More traps get full treatment later: a filter tuned "by eye" until its plot looks smooth, with no statistical test; a controller shown working only on the exact system it was tuned on; numbers with no units or uncertainty; work a reviewer cannot run; a README that describes what the project *hopes* to do instead of what it measured.

::: key Portfolio failure modes
A tutorial follow-along with the author's design decisions rather than yours; a notebook with plots but no validation; many shallow repositories; and any project whose central decision you cannot defend when asked "why not the other approach?"
:::

::: example Auditing a made-up profile against the five-part test
A candidate has twelve repositories. Sort them:

- **Four tutorial follow-alongs.** One copies a popular blog post's "Kalman filter from scratch" down to its variable names.
- **Five single-notebook explorations.** Plots, but no stated requirement and no verification.
- **Two real, substantial projects** — a 6-DOF simulation and an attitude estimator. But their READMEs say what each project "aims to do," in the present tense, with no results and no limitations.
- **One small, complete utility library** with tests and a stated scope, on a topic that has nothing to do with GNC.

Count: $4 + 5 + 2 + 1 = 12$, so every repo is sorted.

None of the twelve passes the test yet, but the audit shows where the time should go. The two substantial projects are worth finishing: the hard work already exists, and what is missing is only the written half of "defensible." The four tutorials and five notebooks — nine repos — are candidates for archiving, because no amount of writing turns a follow-along into a project with your own decisions in it. (The utility library can stay as a supporting piece.)

Notice what did *not* decide the sorting: how many hours each repo took.
:::

::: warning Many repositories is not neutral
A large number of repositories works against you. Every one a reviewer opens and finds indefensible uses up some of the [[benefit of the doubt|reviewer-sampling]] the next one would have got. Thirty entries give a doubtful reviewer thirty chances to stop looking before reaching the three that would have held up.
:::

## Check yourself

::: check
State the five words this lesson builds the module around. For each, give a one-sentence reason it matters that is specific to the interview format — not a general statement about quality.
:::

::: answer
- **Few:** one project defended for an hour under questioning beats several defended for two minutes each, because the format tests exactly the depth a shallow project runs out of first.
- **Deep:** the interview measures how far your understanding reaches past your description, and that only exists if you made real decisions while building.
- **Documented:** a result that lives only in your memory is not something a reviewer can check on their own time.
- **Defensible:** the five-part checklist is exactly what a hard question probes for.
- **Reproducible:** a claim a stranger cannot regenerate is a claim about your machine at some past moment, not evidence anyone else can verify.
:::

::: check
List the five things a defensible project needs. Then explain why a project with *no* known-failure section is weaker than you might expect — why its silence is not neutral.
:::

::: answer
The five: a stated requirement, written-down model assumptions, verification evidence beyond "it ran," a named known-failure case, and an explicit statement of what you built versus what a library did.

The silence is not neutral: the reviewer has to read it somehow, and it reads as either "not examined closely enough to find a failure" or "found one and left it out," and both damage trust more than naming a real limitation would. Stating it yourself removes the doubt and shows the self-awareness the reviewer was going to test for.
:::

::: check
A candidate says their project "used `scipy.optimize` to solve the guidance problem." Using the fifth item of the defensibility checklist, say what is missing from that sentence and rewrite it so the missing part is there.
:::

::: answer
Missing is the line between what the author built and what the library did. The sentence fits both "called a function with default settings" and "set up the problem and its time steps myself, then ended with a solver call."

A rewrite that draws the line: "I set up the descent problem as a convex program with linear constraints, following the lossless-convexification result, did the time-discretization myself, and used `scipy.optimize.linprog` only to solve the final linear program. The formulation and discretization are mine; the linear-program solve is not."

Now a reviewer knows where to aim "why this approach?" and where to aim "how does this solver work?"
:::

::: check
Using the interview format — not a general point about effort — explain why ten shallow repositories are worth less than three deep ones, even if the ten took more total hours.
:::

::: answer
The interview spends most of its time questioning a few chosen projects, not surveying everything you built. Hours spread across many shallow projects never become visible.

Presenting one of the ten shallow projects, a candidate runs out of real content by the second or third follow-up, and the other nine cannot rescue that conversation. Three hour-deep projects match what the format measures; ten shallow ones are built for a long list the format barely looks at.
:::

::: check
A reviewer opens two of a candidate's thirty repositories at random and finds neither defensible. What is the reviewer likely to do next, and why does that make the size of the profile a liability rather than a neutral fact?
:::

::: answer
The reviewer will most likely stop looking rather than keep hunting, because each indefensible repo uses up benefit of the doubt.

So size is a liability. The chance that a small random sample lands on your best work falls as the share of shallow projects rises. With 3 strong repos among 30, there is about an 81% chance that two random picks miss all three. Adding shallow repos actively lowers the odds that your strongest work is ever seen.
:::

## Summary

| Idea | What it means |
| --- | --- |
| Few | One project defended for an hour beats several defended for two minutes, because long questioning is the actual format |
| Deep | Real design decisions were made, so your understanding reaches past your description |
| Documented | The five defensibility items are written where a stranger can find them, not held only in memory |
| Defensible | Five things in writing: stated requirement, written assumptions, verification beyond "it ran," a known-failure case, a you-versus-library statement |
| Reproducible | A stranger can regenerate the result without asking you anything |
| Weak vs strong README | Same code, two write-ups — the strong one answers "how do you know it's right?" before it is asked |
| What not to build | Tutorial follow-alongs, notebooks without validation, thirty shallow repositories, and their cousins |

The next lesson takes "documented" and turns it into a full write-up structure — problem, model, assumptions, verification, validation, results, limitations — and shows what a busy reviewer actually reads in the first ninety seconds.

::: context thesis-defense Why it is called a "defense"
When someone finishes a PhD, they write a long report on their research, called a **thesis**, and then sit in front of a committee who question it, sometimes for hours. That meeting is called the **defense**, because the candidate has to defend each claim against challenges. The word "thesis" comes from Greek for "something put forward."

A GNC project review borrows the same shape: you put a claim forward, and experts push on it. The skill being tested is not presenting — it is holding your ground, with evidence, when the questions leave your slides behind.
:::

::: context rms-and-sigma RMS error and "1-sigma"
**RMS**, said "R-M-S," stands for root mean square: square every error, take the average, then take the square root. It is a fair "typical size" of the error that ignores whether each miss was plus or minus.

**Sigma** ($\sigma$, the Greek letter "s") is the standard deviation — the usual width of a spread of values. "1-sigma" means "one standard deviation." For errors that follow the common bell-shaped curve, about 68% of them land within one sigma of the center.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M130,110 L130,61.1 L135,56.2 L140,51.4 L145,46.8 L150,42.6 L155,38.8 L160,35.5 L165,32.9 L170,30.9 L175,29.7 L180,29.3 L185,29.7 L190,30.9 L195,32.9 L200,35.5 L205,38.8 L210,42.6 L215,46.8 L220,51.4 L225,56.2 L230,61.1 L230,110 Z" fill="#8fb8f0"/>
  <path d="M30,109.1 L40,108.4 L50,107.3 L60,105.5 L70,102.8 L80,99.1 L90,94.0 L100,87.6 L110,79.7 L120,70.7 L130,61.1 L140,51.4 L150,42.6 L160,35.5 L170,30.9 L180,29.3 L190,30.9 L200,35.5 L210,42.6 L220,51.4 L230,61.1 L240,70.7 L250,79.7 L260,87.6 L270,94.0 L280,99.1 L290,102.8 L300,105.5 L310,107.3 L320,108.4 L330,109.1" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="130" y="127">−1σ</text><text x="180" y="127">0</text><text x="230" y="127">+1σ</text>
    <text x="180" y="80">68%</text>
  </g>
  <text x="180" y="145" font-size="11" fill="#6c7a93" text-anchor="middle">about 68% of values fall within one sigma of the center</text>
</svg>
```
:::

::: context library What a library is
A **library** is a bundle of code someone else wrote and tested, which you call instead of writing it yourself. SciPy (said "sigh-pie") is a free Python library full of math tools, and `solve_ivp` is its function for stepping equations forward in time.

Using libraries is normal and smart — professional engineers do it every day. The only portfolio rule is honesty about the line: say which parts you wrote and which parts you called, so a reviewer knows which questions you should be able to answer from the inside.
:::

::: context weakest-link A chain of five links
A defensible project is like a chain: it holds only as well as its weakest link. A reviewer's questions are the pull. They do not test the strong links first — they find the weak one, because that is where the answers run out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke-width="5">
    <rect x="12" y="45" width="72" height="30" rx="15" stroke="#1d6fd1"/>
    <rect x="72" y="45" width="72" height="30" rx="15" stroke="#1d6fd1"/>
    <rect x="132" y="45" width="72" height="30" rx="15" stroke="#1d6fd1"/>
    <rect x="192" y="45" width="72" height="30" rx="15" stroke="#b4232c" stroke-dasharray="14 6"/>
    <rect x="252" y="45" width="72" height="30" rx="15" stroke="#1d6fd1"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="32">requirement</text>
    <text x="108" y="100">assumptions</text>
    <text x="168" y="32">verification</text>
    <text x="228" y="100" fill="#b4232c">known failure</text>
    <text x="288" y="32">you vs library</text>
  </g>
  <text x="180" y="122" font-size="11" fill="#6c7a93" text-anchor="middle">one missing link and the whole chain fails at that point</text>
</svg>
```
:::

::: context rk4 RK4, the workhorse step
**RK4** stands for the fourth-order Runge–Kutta method, said "RUNG-uh KUT-ah," after German mathematicians Carl Runge and Martin Kutta, who developed the idea around 1900. To take one step forward in time, it checks the slope four times — at the start, twice in the middle, and at the end — and blends them. That makes it far more accurate than one straight-line step.

"Fourth-order" means that halving the step size cuts the error by about $2^4 = 16$ times. Lesson 3 shows how to check that your own RK4 really behaves this way.
:::

::: context ekf-ukf Two kinds of filter
A **filter** here is a program that blends a prediction with noisy sensor readings to estimate something, such as which way a spacecraft is pointing. An **EKF** (extended Kalman filter, said letter by letter) handles curved, nonlinear physics by straightening it out locally at each step. A **UKF** (unscented Kalman filter) instead pushes a few carefully chosen sample points through the curved physics.

Neither is always better. That is exactly why "why this one?" is a real question — and why a follow-along, where the author chose for you, has no answer to it.
:::

::: context notebook What a notebook is
A **Jupyter notebook** mixes code, its output and notes on one scrollable page, so it is great for exploring. The name comes from three languages it was built for: **Ju**lia, **Py**thon and **R**.

The trouble is not the tool. It is that a notebook makes it easy to stop at "the plot looks nice." Cells can also be run out of order, so the page may show results that the code, run top to bottom, would not reproduce. A notebook becomes portfolio evidence only when it states what it had to achieve and shows the checks that it did.
:::

::: context repository Repositories and GitHub
A **repository** is a project folder that also records its full history: every change, who made it, and when. That history is kept by a tool called **Git**. **GitHub** is a website where people store repositories online so others can see them.

For a job hunt, your GitHub profile acts like a shop window. A reviewer can open any repo, read its README (the front-page description file), and look at the code and its history. That is why what sits in the window matters more than how much is there.
:::

::: context reviewer-sampling Why a few random picks usually miss
Suppose a profile has 30 repositories and only 3 are strong. A reviewer opens 2 at random. The chance that *neither* is strong is

$$
\frac{27}{30}\cdot\frac{26}{29} = \frac{702}{870} \approx 0.81.
$$

So about four times in five, the reviewer sees none of the good work. With only the 3 strong repos on display, every pick lands on one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g fill="#6c7a93">
    <rect x="15" y="30" width="9" height="20"/><rect x="26" y="30" width="9" height="20"/><rect x="37" y="30" width="9" height="20"/><rect x="48" y="30" width="9" height="20"/><rect x="59" y="30" width="9" height="20"/>
    <rect x="70" y="30" width="9" height="20"/><rect x="81" y="30" width="9" height="20"/><rect x="92" y="30" width="9" height="20"/><rect x="103" y="30" width="9" height="20"/><rect x="114" y="30" width="9" height="20"/>
    <rect x="125" y="30" width="9" height="20"/><rect x="136" y="30" width="9" height="20"/><rect x="147" y="30" width="9" height="20"/><rect x="158" y="30" width="9" height="20"/><rect x="169" y="30" width="9" height="20"/>
    <rect x="180" y="30" width="9" height="20"/><rect x="191" y="30" width="9" height="20"/><rect x="202" y="30" width="9" height="20"/><rect x="213" y="30" width="9" height="20"/><rect x="224" y="30" width="9" height="20"/>
    <rect x="235" y="30" width="9" height="20"/><rect x="246" y="30" width="9" height="20"/><rect x="257" y="30" width="9" height="20"/><rect x="268" y="30" width="9" height="20"/><rect x="279" y="30" width="9" height="20"/>
    <rect x="290" y="30" width="9" height="20"/><rect x="301" y="30" width="9" height="20"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="312" y="30" width="9" height="20"/><rect x="323" y="30" width="9" height="20"/><rect x="334" y="30" width="9" height="20"/>
  </g>
  <text x="15" y="20" font-size="11" fill="#1f2a44">27 shallow repos</text>
  <text x="345" y="20" font-size="11" fill="#1d6fd1" text-anchor="end">3 strong</text>
  <text x="180" y="78" font-size="12" fill="#1f2a44" text-anchor="middle">open 2 at random: about 81% chance</text>
  <text x="180" y="96" font-size="12" fill="#1f2a44" text-anchor="middle">neither is one of the strong three</text>
</svg>
```
:::
