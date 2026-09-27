---
id: l02-the-write-up-structure
title: "The write-up: structure, and the ninety-second read"
minutes: 20
covers:
  - "the write-up structure: problem, model, assumptions, verification, validation, results, limitations"
---

Think of a recipe card. The name of the dish is at the top. Then the ingredients. Then the steps. Then, if the cook is honest, a note at the bottom: "doesn't work with gluten-free flour." You never hunt for the oven temperature, because every recipe card puts things in the same places.

A project **write-up** — the document that explains your project, usually the README file at the top of its repository — should work the same way. The last lesson named "documented" as one of the five words a portfolio is judged by, and said a defensible project needs five things *in writing*. This lesson gives that writing a fixed shape.

Here is why the shape matters so much. A reviewer who opens your repository has, realistically, about ninety seconds before deciding whether to keep reading. If they have to dig for the requirement, the result, or the catch, they give up before your best work is even seen. The fix is not *more* writing. It is a fixed structure, used every time, so a reader always knows where the next fact lives.

That structure has seven parts: **problem, model, assumptions, verification, validation, results, limitations**. This lesson covers each part, where it lives in your repository, and what a reader does with the first screen of it. The next lesson covers the technical side of verification — what evidence actually earns that name. Here the question is narrower: once the evidence exists, how do you arrange it so a stranger finds it in the order they need?

## The seven parts, and what belongs in each

Go through them in order. Each one answers one question a reviewer is carrying.

**1. Problem.** The requirement the project was built against, stated as a bar to clear rather than as an activity. Write "land within a 10 m [[circular error probable|cep]] given a limited range of engine thrust," not "explored powered descent guidance." This is the same requirement the defensibility checklist asked for. Here it goes first, because nothing else in the document means anything without it.

**2. Model.** What the project actually simulates or estimates, and at what **[[fidelity|fidelity]]** — how closely it copies reality. Rigid body or bendy? A single point of mass, or a solid shape? A straight-line (linear) measurement model or a curved (nonlinear) one? One or two sentences. The details go in the assumptions, not buried in code a reader has to open to learn what problem the code is solving.

**3. Assumptions.** Every simplification the model makes, named one by one rather than hinted at. "Two-body gravity; no [[J2 or drag|j2-drag]]" is one line, and it removes a whole family of questions before they are asked. An empty assumptions section is not a sign of a perfect model. Every model simplifies something. A reviewer who finds no stated assumptions will conclude you did not spot them — not that there were none.

**4. Verification.** The specific evidence that the code correctly solves the equations it claims to solve: a case with a known answer matched to a stated tolerance, a quantity that should stay constant and did, an error that shrank at the rate the math predicts. This section answers "**did you build the thing right?**" It is a question about the code matching its own equations, and you can answer it entirely inside the simulation, with no reference to the real world.

**5. Validation.** Whether the equations themselves are a trustworthy description of the real system. You check this, where you can, against real hardware, flight data, or an outside source you did not write. It answers a different question: "**did you build the right thing?**"

The two are easy to blur, so here is the difference in one picture. Verification is checking that you followed the map correctly. Validation is checking that the map matches the land. A [[perfectly verified model|verify-validate]] of the wrong physics is still wrong.

A self-taught project can usually verify fully, because verification needs only your code and your equations. Validation is harder, because it needs an outside reference you did not control, and most self-taught projects only partly clear that bar. Say so plainly. A reviewer who cannot tell which claim you are making will assume the weaker one.

**6. Results.** The actual numbers the project produced, each with a unit. Where the project ran many trials — a **[[Monte Carlo|monte-carlo]]** run, which repeats the same simulation many times with randomly varied inputs — give the worst case next to the average. A results section is not a list of what the code *can* do. It is what happened when it ran, with numbers a reader can hold you to.

**7. Limitations.** Where the result stops being trustworthy, stated as precisely as the result itself: a step size beyond which the integrator gets worse, an orbit shape beyond which an assumption breaks, a range of conditions the Monte Carlo never tested. This is the section the last lesson called the known-failure case. It goes last for the same reason a good project talk ends on it: it is the last thing a reader should carry away, because it is what separates a claim from an honest one.

Of the seven, two carry the most weight with an experienced reviewer: **assumptions** and **limitations**. Anyone can produce a result. Knowing where your model simplifies, and where your result stops being true, is what reviewers are really checking — and it is exactly what a hobbyist tends to leave out. Those sections also answer, in advance, the hardest question in any review: "what would break this?"

::: key The write-up structure
Problem, model, assumptions, verification, validation, results, limitations — in that order. The assumptions and limitations sections are the ones that distinguish an engineer from a hobbyist, and they are the first thing an experienced reviewer looks for.
:::

::: key Verification versus validation
Verification asks whether the code was built right against its own equations. Validation asks whether those equations are right about the world. A self-taught project can usually verify fully and validate only partly — say exactly which is which, rather than letting a reader assume the stronger claim.
:::

## The repository layout

The write-up's structure should show up in the repository's folders too. A reader who wants to check one claim should know at once which file to open.

```text
project/
  README.md              <- the seven-part write-up; the first thing anyone opens
  requirements.txt        <- pinned dependency versions (later lesson)
  src/
    dynamics.py            <- the model, hand-written where the claims say hand-written
  tests/
    test_analytic_case.py  <- verification: the code the README's claims are checked against
    test_conservation.py
  results/
    dispersion_summary.csv <- the numbers the README quotes, regenerated, not hand-typed
  .github/workflows/ci.yml <- runs the tests on every push (later lesson)
```

Read it top to bottom. `README.md` holds the seven parts. `requirements.txt` lists the exact versions of every outside library, so the code runs the same on a stranger's computer — that is called **[[pinning|pinning-and-ci]]** the dependencies. `src/` holds your own code. `tests/` holds the verification. `results/` holds the numbers the README quotes, written by the code rather than typed in by hand. The last file tells a service to rerun the tests on every change.

The layout either backs up your claims or quietly takes them back. A README that claims energy is conserved to $10^{-14}$, next to a `tests/` folder with no file that could produce that number, is a mismatch a reviewer spots in seconds.

## The ninety-second read

A busy reviewer's first pass through your README follows a fast, fairly fixed pattern. Knowing it tells you exactly what has to be visible without scrolling.

- **First ten seconds or so:** the title and the one-sentence result. If that sentence has no number in it, most of the ninety seconds are already lost, because there is nothing yet to judge.
- **Next twenty seconds:** the one plot or block of numbers that carries the argument. It needs to sit near the top, not three sections down.
- **Next fifteen seconds:** a scan for a stated limitation. Whether one is there is the fastest signal of whether the rest deserves a careful read.
- **The rest:** deciding whether to open a file. That decision rests not on your code, but on what the first screen already showed.

Add the first three up: $10 + 20 + 15 = 45$ seconds. Half the time is gone before the reader has touched a single file.

This tells you how to order the README. The seven-part structure is the whole document, but its *opening* is an **[[inverted pyramid|inverted-pyramid]]**: most important thing first. Lead with the problem and the headline result, with a number. Put the one plot right after it. Only then come the full model, assumptions, verification, validation and limitations sections underneath. A README that opens with installation steps or the story of how the project started can be complete and still fail the ninety-second read, because the reader never reaches the part that would have kept them.

::: example The first screen: weak order versus strong order
**Weak.** A README opens: "This project was inspired by wanting to understand orbit determination better. It started as a simple least-squares fit and grew from there over several weekends. Below are installation instructions."

Where is the result? Three screens down, after the history and the setup steps. In the first ten seconds the reviewer finds no number, and in the next twenty finds no plot. A reviewer with ninety seconds never reaches it.

**Strong.** The same project's README opens: "Batch [[Gauss-Newton|gauss-newton]] orbit determination from multi-station range data. Recovers a 4-state constant-velocity arc to 23 m in position and 0.23 m/s in velocity (1-sigma, from a 400-trial Monte Carlo) using 50 m 1-sigma range measurements from four stations over a 300 s arc — formal covariance matches empirical scatter to within 8%." One plot of the fit settling down follows at once. Installation steps are near the bottom — needed, but not what the first ninety seconds are for.

Check the strong opening against the pattern. Title and a result with numbers in the first sentence: yes. Units on every number: m, m/s, s. How many trials: 400. A check that the method's own uncertainty estimate (its **covariance**) is honest: the predicted spread matches the measured spread within 8%. Every uncertainty says what it is: 1-sigma.
:::

## Writing results honestly, including what did not work

Suppose your friend says they baked a perfect cake on the first try. Maybe. But if they say "the first one sank in the middle, so I checked the oven with a thermometer, found it ran cold, and the second one came out right," you believe them more — and you learn they know how to fix things.

A results section that reports only the runs that worked is not lying in any one sentence. It still misleads, because it lets the reader imagine a smoother path than the real one. The strongest write-ups include a short, specific account of what did *not* work on the way: a method tried and dropped because it made the numbers blow up, a first tuning that failed a test before a corrected one passed.

This is not padding. It is direct evidence the work was real engineering, not one lucky attempt tidied up afterwards. It is also exactly the material the interview lessons later in this course turn into a rehearsed failure story. The write-up and the interview answer draw on the same honest account — not two different ones.

::: example A results section that includes the failed attempt
"The first process-noise tuning ($q = 5\times10^{-5}$, chosen by matching the filter's steady-state covariance to a target by eye) passed no consistency check: mean [[NEES|nees-band]] over 300 runs was 41.2 against a 95% band of $[5.61, 6.40]$ for a 6-state filter — badly overconfident. Retuning $q$ upward by roughly two orders of magnitude, justified by re-examining the actual gyro noise spec rather than fitting by eye, brought mean NEES to 6.07, inside the band. Both numbers are reported here, not only the second, because the first is what the process actually looked like."

Unpack it. The **process noise** $q$ is how much the filter expects the real system to wander between measurements. A **consistency check** asks whether the filter's own stated uncertainty matches its real errors. NEES is one such check: for a healthy 6-state filter it should average about 6, and with 300 runs the average should land between 5.61 and 6.40 about 95% of the time.

Now read the numbers. First try: 41.2, which is $41.2 / 6 \approx 6.9$ times the ideal — far above the band. The filter believed it was much more accurate than it was. After retuning: 6.07, inside $[5.61, 6.40]$. Sanity check on the direction of the fix: an overconfident filter thinks the world is calmer than it is, so raising $q$ is the right way to turn.

That one paragraph shows a reviewer three things: a consistency test exists, it was able to catch a real problem, and the author diagnosed the fix instead of guessing. A bare sentence like "the filter is consistent" carries none of that.
:::

::: warning Intent is not a result
A README that says what a project "aims to do" or "is designed to demonstrate" is describing intent, not results — and intent is not evidence. Every sentence in the results section should be checkable against something that already happened: a number, a file, a passing test. If a sentence would still be true had the project never been run, it does not belong in results.
:::

## Check yourself

::: check
Name the seven parts of the write-up in order. Then say in one phrase each what question verification answers and what question validation answers.
:::

::: answer
Problem, model, assumptions, verification, validation, results, limitations.

Verification answers "was the code built right against its own equations?" — an inside question, code versus equations, answerable entirely in simulation. Validation answers "are those equations right about the real system?" — an outside question that needs a reference the author did not write, such as hardware or flight data.
:::

::: check
A project's README states an energy-conservation result of $10^{-14}$, but its `tests/` folder has no file that could produce that number. What does this mismatch tell a reviewer, and why is it worse than the number being wrong?
:::

::: answer
It tells the reviewer the claim cannot be checked right now. That is worse than a wrong number. A wrong but checkable number is a bug to find. An unbacked claim raises the question of whether it was ever measured at all.

The layout exists so that each written claim and the file that produced it sit in a fixed, findable relationship. When that link breaks, every other claim in the same README loses some of its presumption of being real.
:::

::: check
Explain why a self-taught project can usually achieve full verification but only partial validation, and why saying so openly is stronger than staying silent.
:::

::: answer
Verification needs only the code and the equations the author wrote down — a self-contained comparison you can run in simulation with nothing from outside. Validation needs an outside reference the author did not control, such as real hardware, flight telemetry or an independent dataset, and most self-taught projects do not have one.

Saying so is stronger than silence, because silence lets a reviewer assume you are claiming both. Naming exactly what was validated and what was only verified answers the question an experienced reviewer was going to ask anyway, and shows the same self-awareness the limitations section is judged on.
:::

::: check
In the first thirty seconds of the ninety-second read, what two things does a reviewer look for? What happens if the opening sentence has no number in it?
:::

::: answer
In roughly the first ten seconds, the title and a one-sentence headline result. In the next twenty or so, the one plot or block of numbers that carries the argument.

If the opening sentence has no number, there is nothing to judge yet. "Performed well" cannot be weighed the way "23 m 1-sigma position error over a 400-trial Monte Carlo" can. The reviewer has no reason yet to keep reading, and a real share of readers stop right there.
:::

::: check
A candidate argues that including a failed tuning attempt in the results makes the project look less competent than showing only the final, working version. Explain why this lesson says the opposite.
:::

::: answer
Showing only the final version fits a real first-try success, but it fits equally well with a cleaned-up story that hides how the result was reached. A reviewer cannot tell which from the polished version.

Including the failed attempt with its own number — mean NEES of 41.2 against a band of about 5.6 to 6.4 in the example — is hard-to-fake evidence that a real diagnosis happened. A specific test detected the problem, and it was fixed for a stated reason. That is much closer to what senior engineering judgment looks like than an unbroken success story, and an experienced reviewer reads it that way.
:::

## Summary

| Part | What it answers |
| --- | --- |
| Problem | What requirement was this built against? |
| Model | What does the project simulate or estimate, and at what fidelity? |
| Assumptions | What does the model simplify away, named one by one? |
| Verification | Was the code built right against its own equations? |
| Validation | Are those equations right about the real system? |
| Results | What actually happened when it ran, with units and worst case? |
| Limitations | Where does the result stop being trustworthy? |
| Ninety-second read | Title and a one-sentence result with a number, then one plot, then a visible limitation — in that order |

The next lesson takes the verification section and builds the toolkit behind it: known-answer cases, conservation checks, convergence studies and cross-comparisons that turn "it ran" into a claim a doubtful reader can check.

::: context cep Circular error probable
**Circular error probable**, or CEP, is a way to say how accurate landings (or shots, or drops) are. Draw a circle around the target exactly big enough to hold half of all the landing points. Its radius is the CEP. "A 10 m CEP" means half the landings hit within 10 m of the target — and, equally important, half land farther out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="80" r="50" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="124" y1="80" x2="136" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="74" x2="130" y2="86" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="80" x2="180" y2="80" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g fill="#1f2a44">
    <circle cx="112" cy="66" r="4"/><circle cx="148" cy="96" r="4"/><circle cx="118" cy="104" r="4"/><circle cx="150" cy="62" r="4"/><circle cx="104" cy="88" r="4"/>
  </g>
  <g fill="#b4232c">
    <circle cx="192" cy="50" r="4"/><circle cx="70" cy="62" r="4"/><circle cx="162" cy="140" r="4"/><circle cx="84" cy="135" r="4"/><circle cx="196" cy="108" r="4"/>
  </g>
  <text x="155" y="74" font-size="11" fill="#1d6fd1" text-anchor="middle">CEP</text>
  <text x="230" y="60" font-size="12" fill="#1f2a44">5 of 10 inside</text>
  <text x="230" y="80" font-size="12" fill="#b4232c">5 of 10 outside</text>
  <text x="230" y="100" font-size="11" fill="#6c7a93">+ marks the target</text>
</svg>
```
:::

::: context fidelity What "fidelity" means
**Fidelity** comes from the Latin for "faithfulness." A high-fidelity model stays faithful to more of reality: a solid, spinning vehicle with changing mass and real air, instead of a single dot in empty space. Higher fidelity is not automatically better. It costs time to build and run, and it adds more places for bugs to hide. Engineers pick the lowest fidelity that still answers the question — and then say, in the assumptions, what they left out.
:::

::: context j2-drag J2 and drag
Earth is not a perfect ball. It bulges at the equator, a little like a squashed orange, and that bulge tugs on satellites and slowly swings their orbits around. Engineers call the biggest part of this effect **J2** (said "jay two"). **Drag** is the thin upper atmosphere rubbing against a low satellite and slowly pulling it down.

A "two-body" model ignores both and treats Earth as a perfect point of mass. That is fine for short spans — but only if you say so, which is exactly what the assumptions section is for.
:::

::: context verify-validate Right thing, thing right
Software engineers have long summed up the difference in two short questions. Verification: "Are we building the product right?" Validation: "Are we building the right product?" The phrasing is usually credited to software engineer Barry Boehm.

A space example shows why both matter. A simulation can solve its equations perfectly — fully verified — and still predict the wrong landing spot if those equations left out wind. Verification can never catch that, because the code does exactly what the equations say. Only a comparison with the outside world can.
:::

::: context monte-carlo Why it is called Monte Carlo
Monte Carlo is a district of Monaco famous for its casino. In the 1940s, scientists including Stanislaw Ulam and John von Neumann, working on problems too messy to solve with pen and paper, began answering them by running many random trials and counting the outcomes — like rolling dice over and over. The code name stuck.

In GNC, a Monte Carlo run flies the same simulation hundreds or thousands of times, each with slightly different random winds, sensor errors and starting conditions, then reports the spread of results.
:::

::: context pinning-and-ci Pinning and continuous integration
Code almost always leans on outside libraries, and those libraries change over time. **Pinning** means writing down the exact version of each one, such as `numpy==1.26.4`, so a stranger installs the same versions you used.

**Continuous integration**, or CI, is a service that automatically reruns your tests every time you change the code, so a break shows up at once instead of months later. Both get a full lesson later in this module, on reproducibility.
:::

::: context inverted-pyramid The inverted pyramid
News reporters have written this way for well over a century: the most important facts first, then supporting detail, then background. A reader who stops after one paragraph still gets the story. A README works the same way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="20,15 340,15 180,185" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="20,15 340,15 302.4,55 57.6,55" fill="#1d6fd1"/>
  <polygon points="57.6,55 302.4,55 264.7,95 95.3,95" fill="#8fb8f0"/>
  <line x1="95.3" y1="95" x2="264.7" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="142.4" y1="145" x2="217.6" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="39" font-size="11" fill="#fff" text-anchor="middle">problem + headline result, with a number</text>
  <text x="180" y="79" font-size="12" fill="#1f2a44" text-anchor="middle">the one plot</text>
  <text x="180" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">model, assumptions,</text>
  <text x="180" y="131" font-size="11" fill="#1f2a44" text-anchor="middle">checks, limits</text>
  <line x1="190" y1="162" x2="260" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <text x="264" y="174" font-size="11" fill="#6c7a93">install steps</text>
</svg>
```
:::

::: context gauss-newton What Gauss-Newton does
Orbit determination means working out an orbit from measurements, such as distances from ground stations. **Gauss-Newton** is a method for the best fit: guess the orbit, see how far the predicted measurements miss the real ones, nudge the guess to shrink the misses, and repeat until the nudges stop mattering. It is named after mathematicians Carl Friedrich Gauss and Isaac Newton. "Batch" means it uses all the measurements at once rather than one at a time. Anchor project D, later in this module, builds one.
:::

::: context nees-band How far off 41.2 really is
NEES, said "neez," stands for normalized estimation error squared. For a healthy 6-state filter, its average over 300 runs should fall in the narrow band from 5.61 to 6.40. The failed tuning scored 41.2 — not a near miss, but far off the scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="335" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="59.3" y="48" width="5.5" height="24" fill="#8fb8f0" stroke="#1d6fd1"/>
  <g stroke="#1f2a44"><line x1="20" y1="56" x2="20" y2="64"/><line x1="90" y1="56" x2="90" y2="64"/><line x1="160" y1="56" x2="160" y2="64"/><line x1="230" y1="56" x2="230" y2="64"/><line x1="300" y1="56" x2="300" y2="64"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="20" y="80">0</text><text x="90" y="80">10</text><text x="160" y="80">20</text><text x="230" y="80">30</text><text x="300" y="80">40</text></g>
  <circle cx="62.5" cy="60" r="4" fill="#1d6fd1"/>
  <circle cx="308.4" cy="60" r="5" fill="#b4232c"/>
  <text x="24" y="36" font-size="11" fill="#1d6fd1">band 5.61–6.40, retuned 6.07</text>
  <text x="308" y="100" font-size="11" fill="#b4232c" text-anchor="middle">first try 41.2</text>
</svg>
```

Lesson 6, on the quaternion filter, explains where the band comes from.
:::
