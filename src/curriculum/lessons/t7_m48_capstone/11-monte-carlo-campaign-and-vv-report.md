---
id: l11-monte-carlo-campaign-and-vv-report
title: The Monte Carlo campaign and the V&V report
minutes: 26
covers:
  - 'Ten thousand dispersed cases in CI, with per-case seeding and bit-exact replay'
  - 'The written V&V report: requirements, evidence, margin plots, failure analysis and known limitations'
---

Picture a science fair. You built a paper airplane and claim it lands on a target. One good throw proves nothing — you might have been lucky. So you throw it three hundred times: some throws a little harder, some a little softer, some into a breeze. And, before the first throw, you write on a card exactly what counts as a "good landing". If you waited until afterwards, you would be tempted to move the line to wherever most of the planes happened to land.

That is a **Monte Carlo campaign**: run the whole system many times, each time with its uncertain inputs randomly scattered — **dispersed** — and count how often it meets a success rule you fixed in advance. Then write down, honestly, what you found. That written account is the **V&V report** (verification and validation): the document that lets someone who never saw the project check every claim.

Every earlier lesson in this module built or joined one piece of the landing stack and checked it on its own terms. This lesson runs all of it together. It uses the verification module's own tools rather than inventing new rules for the occasion: the same Clopper–Pearson reliability formula, the same habit of declaring what "failure" means before the data exists, and the same per-case seeding. Then it reports what the campaign found — including the part every report is tempted to soften: how many cases failed, and why.

## Why ten thousand, and why this lesson runs three hundred

Real programs run their tests automatically every time someone changes the code. That machinery is called **[[continuous integration|ci]]**, or CI. It usually runs in tiers:

- on every **push** (every code change sent to the shared repository), a small, fixed-seed batch that finishes in minutes;
- every **night**, the full campaign;
- at every **release**, everything, plus the assembled report.

Ten thousand cases is the *nightly* figure. The number has no magic of its own. It is what a full, flight-like simulation can afford once a day — and, as you will see below, it is also enough to back a strong reliability claim.

::: example Pricing this module's own campaign
The closed-loop simulation this lesson runs combines navigation, guidance, control and their measured error behavior, exactly as the earlier lessons built them. It costs about $61.5\,\mathrm{ms}$ (milliseconds) per case on one ordinary computer core. Ten thousand cases cost

$$
10{,}000 \times 61.5\,\mathrm{ms} = 615{,}000\,\mathrm{ms} = 615\,\mathrm s \approx 10.3\ \text{minutes}.
$$

That fits easily in any overnight window, on a single core.

Be honest about what that price is for. This is the module's own teaching-level simulation, built so its numbers can be checked, not a full flight-fidelity model. A full six-degree-of-freedom simulation costs far more per case — the verification module's worked example used $42\,\mathrm s$. At that price ten thousand cases take $10{,}000 \times 42\,\mathrm s = 420{,}000\,\mathrm s \approx 117$ core-hours, which is why real campaigns spread across many cores: on $64$ cores it is under two hours.

This lesson runs $300$ cases instead of $10{,}000$, so that you can reproduce every number here in well under a minute. Every method used to read those $300$ cases is exactly the method a real $10{,}000$-case campaign would use on its larger result.
:::

Why is ten thousand a good nightly size? Recall the **zero-failure rule** from the verification module: if $n$ cases all pass, you can claim, with $95\%$ confidence, that the true failure probability is below $1 - 0.05^{1/n}$, which is about $3/n$ (the "rule of three"). For $n = 10{,}000$ that is about $0.03\%$ — a reliability of about $99.97\%$. To back this module's $99.87\%$ landing requirement with zero failures, you would need $n = \ln 0.05 / \ln 0.9987 \approx 2303$ cases. Ten thousand clears that with room to spare. Three hundred does not come close — one more reason this lesson treats its own campaign as a demonstration of method.

## Declaring a failed case before running one

The rule from the verification module: a case is scored a failure if *any one* of a fixed, exactly defined list of conditions is broken. The list is written down before the campaign runs, and never adjusted afterwards to match what the data showed. This lesson's campaign fixed the following list before its $300$ cases were generated.

::: key This campaign's declared failure criteria
A case fails if touchdown vertical speed exceeds $4.0\,\mathrm{m/s}$, **or** touchdown lateral speed exceeds $3.0\,\mathrm{m/s}$, **or** lateral miss distance exceeds $7.5\,\mathrm m$, **or** propellant remaining falls below $150\,\mathrm{kg}$, **or** the navigation-consistency monitor from the FDIR lesson trips more than $40$ times during descent, **or** the vehicle runs out of propellant before touchdown. A case passes only if every condition holds.
:::

Notice the word **or**. A landing that hits the pad dead center but arrives at $5\,\mathrm{m/s}$ still fails. A **composite** criterion — many conditions joined by "or" — is how you stop one good-looking number from hiding a bad one.

## Per-case seeding and bit-exact replay

Each case needs random numbers: its dispersed starting state, its sensor errors, its wind, whether a fault occurs. Computers make "random" numbers with a recipe that starts from a whole number called a **[[seed|seed]]**. Same seed, same sequence, every time.

The pattern the simulation module built goes one step further. Each case gets its own **case seed**. That seed is split, with NumPy's `SeedSequence(case_seed).spawn(n)`, into $n$ independent sub-streams — one per model. Why split? Suppose the sensor model is later changed to draw fifty numbers instead of three. With one shared stream, every model after it would get different numbers, and the whole case would change. With separate sub-streams, the wind model never notices.

::: example Seeding one case, and replaying it
```python
import numpy as np

def draw_case(case_seed, sensor_draws=3):
    # One seed per case, split into one independent stream per model.
    mass_ss, sensor_ss, wind_ss = np.random.SeedSequence(case_seed).spawn(3)
    mass = np.random.default_rng(mass_ss).normal(31_600.0, 150.0)
    noise = np.random.default_rng(sensor_ss).normal(0.0, 3.0, sensor_draws)
    wind = np.random.default_rng(wind_ss).normal(0.0, 4.0)
    return mass, noise, wind

a = draw_case(2_000_042)
b = draw_case(2_000_042)                   # same seed, any machine, any day
c = draw_case(2_000_042, sensor_draws=50)  # sensor model now draws more
print(a[0] == b[0], np.array_equal(a[1], b[1]), a[2] == b[2])  # True True True
print(a[0] == c[0], a[2] == c[2])                               # True True
```

Read the two printed lines. The first says re-running case $2{,}000{,}042$ gives exactly the same mass, sensor noise and wind. The second says that even after the sensor model changed how many numbers it draws, the mass and wind for that case did not move.
:::

This is what makes **[[bit-exact replay|bit-exact]]** possible: re-running case seed $2{,}000{,}042$ on any machine, at any later date, reproduces that case bit for bit. Nothing about it depends on the wall-clock time, on how threads were scheduled, or on which cases ran before it. So every one of the $32$ touchdown-speed failures and $14$ navigation-consistency failures below is a specific seed an engineer could re-run tonight and step through in full.

## The campaign, run and reported

::: example Three hundred dispersed cases
The cases were dispersed in mass, thrust, initial condition, sensor noise and wind, and some suffered a dispersed **[[GNSS dropout|gnss-dropout]]** — a stretch of descent with no satellite-navigation fixes. Scoring every case against the declared criteria gives:

| Result | Count |
| --- | --- |
| Passed | $261$ |
| Failed | $39$ |
| — failed on touchdown vertical speed | $32$ |
| — failed on navigation consistency | $14$ |
| — failed on touchdown lateral speed | $1$ |

Some failing cases broke more than one rule, so the reason counts ($32 + 14 + 1 = 47$) add up to more than $39$. That is expected with an "or" criterion; always report both.

The miss distances themselves are tight. The median miss, called the **[[CEP|cep]]** (circular error probable — half the landings fall inside it), is $0.161\,\mathrm m$. The $95$th percentile by **nearest rank** — sort the $300$ misses from smallest to largest and take the $\lceil 0.95 \times 300 \rceil = 285$th — is $0.530\,\mathrm m$. The $99$th (the $297$th) is $1.01\,\mathrm m$. None is anywhere near the $7.5\,\mathrm m$ miss limit, which never failed a single case. Every failure came from touchdown speed or navigation consistency, not from missing the pad.
:::

Now turn the count into a reliability claim. The verification module's **Clopper–Pearson** bound answers: "Given $k$ failures in $n$ trials, what is the largest failure probability $p$ that is still believable at $95\%$ confidence?" It is the $p_U$ for which seeing $k$ or fewer failures would have only a $5\%$ chance:

$$
P(X \le k \mid n, p_U) = \sum_{i=0}^{k} \binom{n}{i} p_U^{\,i} (1 - p_U)^{n-i} = 0.05 .
$$

Read $\binom{n}{i}$ as "n choose i", the number of ways to pick which $i$ of the $n$ cases failed. When $k = 0$ the sum has one term, $(1 - p_U)^n = 0.05$, which gives the zero-failure rule above. For any $k$, the solution can be read from the beta distribution, which a statistics library does in one line:

```python
from scipy.stats import beta

def cp_upper(k, n, conf=0.95):
    """One-sided Clopper-Pearson upper bound on the failure probability."""
    return 1.0 if k == n else beta.ppf(conf, k + 1, n - k)

print(round(cp_upper(0, 300), 4))    # 0.0099  (zero failures: about 3/n)
print(round(cp_upper(39, 300), 3))   # 0.166   (this campaign)
```

With $k = 39$ and $n = 300$ the upper bound is $16.6\%$. So the defensible claim is a reliability of **at least $83.4\%$** at $95\%$ confidence. Sanity check: the raw failure rate is $39/300 = 13\%$, and the bound should sit a bit above that, because $300$ cases cannot pin the rate down exactly. It does.

That is far short of the $99.87\%$ target the error-budgeting lesson set out to meet. Reporting the shortfall plainly — rather than narrowing the campaign until it disappears — is the entire point of running a campaign.

::: example What is driving the touchdown-speed failures
First try the simple check: a **[[correlation coefficient|correlation]]** between touchdown speed and each dispersed input — ignition altitude, ignition velocity, propellant load, specific impulse, thrust level. Nothing stands out. Every coefficient is below $0.12$ in size, so no single dispersed input explains the spread.

Then split the cases a different way: with a GNSS dropout, and without. Dropout cases average $4.24\,\mathrm{m/s}$ at touchdown — above the $4.0\,\mathrm{m/s}$ limit on average. Cases with continuous GNSS average $2.81\,\mathrm{m/s}$. And **every** dropout case is also a navigation-consistency failure.

So the dropout is not two separate problems. It is one cause with two visible symptoms. A check that only ever compares the outcome against one smoothly varying input at a time could never find it, because the driver is an on-or-off event, not a continuous number.
:::

## What this result does to the error budget

The error-budgeting lesson allocated a one-sigma landing-accuracy budget of $3.33\,\mathrm m$, split across navigation, guidance, control and site knowledge. Against that budget this campaign looks like a triumph: a $95$th-percentile miss of $0.53\,\mathrm m$ leaves enormous margin.

On its own, that comparison is badly misleading. The budget answered one question — how far from the pad — and this campaign's failures never came from that question. Touchdown speed never got a budget, because the requirement the budget was built from never named one. Yet touchdown speed is where the real failures live. A program that read only the miss-distance numbers and declared the vehicle verified would have audited the one metric it was never at risk on, and missed the one it actually failed.

::: warning Huge margin on one metric can hide a failing mission
Do not let a comfortable percentile on the metric your budget happened to name stand in for "the vehicle is ready". This campaign is the clearest example the module can offer of the trap the verification module warned about with composite criteria: score only the visible metric, and a real failure mode — here $32$ touchdown-speed failures in $300$ cases — hides in full view of a report that looks clean.
:::

## The written report, section by section

A verification report must let an engineer who has never seen the project trace every claim back to a plot or a test. Asserting a conclusion is not enough. Built from what this module has produced:

- **System description.** The four-module split and the rate architecture from the first three lessons: one diagram, the interface table, the nested rates.
- **Requirements and verification matrix.** The $10\,\mathrm m$ at $99.87\%$ landing requirement and its one-sigma split across navigation, guidance, control and site knowledge. Each line points to the lesson and number that verifies it — or, honestly, fails to.
- **Navigation performance.** The filter's NEES figures (normalized estimation error squared — a check that the filter's claimed uncertainty matches its real error) and the correlated-error touchdown table from the navigation lesson, with the planar simplification and the calibrated-gyro-bias assumption labeled as exactly that: assumptions, not findings.
- **Guidance performance.** Re-solve timing (cold and warm starts), the deadline-policy cost table, and the measured gap between the turn rate guidance implied and what the vehicle can deliver.
- **Control performance.** The **[[margin plots|margin-plot]]**: gain and phase margin against flight time across the burn, showing the schedule holds them steady; the notch's measured depth and phase cost; and the windup comparison showing which anti-windup scheme recovers from the mode-transition step.
- **Monte Carlo results.** This lesson's table: $39$ of $300$ failed, at least $83.4\%$ reliability at $95\%$ confidence, the CEP and percentiles, none rounded up or softened.
- **Failure analysis and sensitivity drivers.** GNSS dropout, found above as the dominant on-or-off driver, and the next step it implies: make dropouts rarer or harden the response to one — not re-run the campaign with a friendlier criterion.
- **Known limitations.** Below, and written first.

::: key Known limitations: the most valuable section
**Known limitations**: what the simulation does not model, what could not be validated, and what would have to be tested on hardware. Write it first and honestly — it is what separates an engineering result from a demo.

For this campaign: it ran $300$ cases, not the $10{,}000$ a flight program runs nightly, so its confidence bound is weaker than a flight claim needs. Its vehicle dynamics are planar, not full six-degree-of-freedom. Its navigation and control error models are calibrated surrogates drawn from the module's smaller, higher-fidelity studies, rather than the full coupled filter and actuator dynamics re-run in every case — a deliberate, stated trade against compute cost, not a hidden shortcut. Its convex re-solve uses a general-purpose teaching solver, not a flight-like embedded solver for its second-order cone program (SOCP). And nothing here has been checked against hardware: the engine's real throttle response, real sensor behavior in the exhaust plume, and real structural modes would all have to be tested on the vehicle.
:::

None of those limitations was discovered after the fact. Each was a decision, made and stated at the point the module made it. That is the only way a reader can judge how much of the module's confidence to trust.

Why write this section *first*? Because a limitations section drafted last, after pages of results, tends to shrink to match the confident tone already set. Written first, it has to stand on its own. It is also the section an auditing engineer needs earliest: it tells them how much weight every other section's numbers can bear — how much is proven, how much is measured, and how much is a stated assumption standing in for a study the module did not reach. In other words, it tells them where **[[verification ends and validation begins|v-and-v]]**.

## Check yourself

::: check
The zero-failure rule says $n$ passing cases bound the failure probability by about $3/n$ at $95\%$ confidence. How many passing cases, with no failures, would a campaign need to claim a failure probability below $0.1\%$? And what does $10{,}000$ passing cases buy?
:::

::: answer
Set $3/n = 0.001$, so $n \approx 3000$. The exact form gives the same answer: $n = \ln 0.05 / \ln 0.999 \approx 2994$. With $10{,}000$ passing cases the bound is $1 - 0.05^{1/10000} \approx 0.0300\%$, so the claim is a reliability of about $99.97\%$ at $95\%$ confidence. One failure among those cases would weaken the claim, and the general Clopper–Pearson formula would then be needed.
:::

::: check
A reviewer asks why this campaign reports its $83.4\%$ reliability at all, when it falls so far short of $99.87\%$. Why is reporting it right, rather than a sign the campaign should be re-run with looser criteria until it passes?
:::

::: answer
The criteria were declared before the campaign ran precisely so a result like this could not be quietly adjusted away. Loosening them after seeing the outcome is "pick the answer, then find a rule that produces it" — the failure the verification module warns against by name. Reporting an honest shortfall, with its drivers identified, lets the program fix the actual problem — here, how the stack handles a GNSS dropout — instead of hiding it behind a redefined criterion.
:::

::: check
Every correlation between touchdown speed and a single dispersed input was below $0.12$, yet GNSS dropout came out as a clear, dominant driver. How can both be true?
:::

::: answer
A correlation coefficient measures how well a *smoothly varying* input predicts the outcome across the whole sample. GNSS dropout here is an on-or-off event — present in some cases and absent in others — and no correlation was computed against it. Splitting the cases into two groups, dropout and no dropout, and comparing the groups directly ($4.24$ against $2.81\,\mathrm{m/s}$) exposes a driver the correlations were never in a position to find. That is why the lesson ran both checks instead of stopping at the first.
:::

::: check
A teammate stores one random generator for the whole campaign and lets every case draw from it in turn. Case $117$ fails. What goes wrong when she tries to replay it, and how does per-case seeding fix it?
:::

::: answer
With one shared generator, case $117$'s random numbers depend on how many numbers cases $1$ to $116$ consumed. To replay it she would have to re-run all $116$ earlier cases first, in the same order, and any change to any model's number of draws would silently give case $117$ different inputs. With per-case seeding, case $117$'s numbers come only from its own seed, split into one sub-stream per model. She can re-run that one case, alone, on any machine, and get the identical run bit for bit — then step through every sensor sample, guidance re-solve and control command to see *why* it failed.
:::

::: check
Name the sections of the V&V report in this lesson, and say which one is written first and why an auditor wants it early.
:::

::: answer
System description; requirements and verification matrix; navigation, guidance and control performance (with margin plots); Monte Carlo results; failure analysis and sensitivity drivers; known limitations. Known limitations is written first, so it is not softened to match the confident tone of the results written before it. An auditor wants it early because it says, before any number is read, what the simulation leaves out, what could not be validated and what still needs hardware testing — and so how much weight each later number can bear.
:::

## Summary

| Idea | In one line |
| --- | --- |
| CI tiers | Small fixed-seed batch on every push, full $10{,}000$-case campaign nightly, everything plus the report at release |
| Campaign cost | This module's sim: about $61.5\,\mathrm{ms}$ per case, so $10{,}000$ cases $\approx 10.3\,\mathrm{min}$; a full 6-DoF sim costs far more |
| Zero-failure rule | $p < 1 - 0.05^{1/n} \approx 3/n$ at $95\%$; $10{,}000$ clean cases $\Rightarrow$ about $99.97\%$ |
| Failure criteria | Declared before running; a case fails if **any** one condition is broken |
| Per-case seeding | `SeedSequence(case_seed).spawn(n)`, one sub-stream per model — any case replays bit for bit |
| Result, $n = 300$ | $39$ failed ($32$ touchdown speed, $14$ navigation consistency, $1$ lateral speed); reliability $\ge 83.4\%$ at $95\%$ (Clopper–Pearson) |
| Miss distance | CEP $0.161\,\mathrm m$, $95$th percentile $0.530\,\mathrm m$, $99$th $1.01\,\mathrm m$ — never what failed |
| Dominant driver | GNSS dropout: one on-or-off cause, two symptoms |
| Error-budget lesson | A budget scoped to miss distance said nothing about the metric that actually failed |
| Report | System, requirements matrix, subsystem performance with margin plots, Monte Carlo, failure analysis, known limitations — the last written first |

This module opened by splitting a landing GNC stack into four modules and an interface table. It closes with those same modules flown together, dispersed, scored against a rule fixed before anyone saw the results, and reported with their real shortfall stated plainly. The next module, GNC interview preparation, turns this report and the work behind it into talks you can give and defend under hard questioning.

::: context ci Robots that test every change
Continuous integration means a server builds the code and runs its tests automatically every time anyone changes it, and flags the change if anything breaks. Tools like GitHub Actions and Jenkins do this. The idea is to catch a problem within minutes of the change that caused it, while the author still remembers what they did — instead of weeks later, when a dozen other changes have piled on top.
:::

::: context seed Where "random" numbers come from
A computer cannot flip a real coin. It runs a formula that turns one number into the next, producing a sequence that looks random but is fully decided by where it started. That starting number is the seed. For a simulation this is a gift, not a flaw: keep the seed, and you can replay exactly the same "random" run whenever you like.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="10" width="120" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">case seed 2,000,042</text>
  <line x1="180" y1="44" x2="60" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="44" x2="180" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="44" x2="300" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="15" y="96" width="90" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="135" y="96" width="90" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="255" y="96" width="90" height="30" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="60" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">mass stream</text>
  <text x="180" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">sensor stream</text>
  <text x="300" y="115" font-size="12" text-anchor="middle" fill="#1f2a44">wind stream</text>
  <text x="180" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">spawn: each model draws from its own stream</text>
</svg>
```

One seed per case, split into one stream per model: a change in how much one model draws cannot disturb the others.
:::

::: context bit-exact Same bits, not just close
"Bit-exact" means every stored number in the replay matches the original down to the last binary digit — not merely to a few decimal places. That needs more than a seed. The same compiled code, the same compiler settings, and a fixed order of arithmetic all matter, because floating-point addition gives slightly different answers if you change the order of the numbers being added. Multithreaded code that adds results in whatever order threads finish can quietly break replay.
:::

::: context gnss-dropout Why satellite navigation drops out
GNSS — the family of systems that includes GPS — relies on faint radio signals from satellites about $20{,}000\,\mathrm{km}$ up. A descending booster can lose them for many reasons: its own body blocking the antenna's view as it turns, its exhaust plume, reflections off the ground near the pad, or interference. During a dropout the filter coasts on the IMU alone, and its error grows until fixes return. That is the mechanism behind this campaign's two symptoms.
:::

::: context cep A term borrowed from artillery
Circular error probable began as a way to rate the accuracy of artillery and bombs: the radius of a circle, centered on the aim point, that holds half the hits. It is the median miss distance. Here is where this campaign's numbers sit against its $7.5\,\mathrm m$ limit, on a line drawn to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="65" x2="30" y2="75"/><line x1="110" y1="65" x2="110" y2="75"/>
    <line x1="190" y1="65" x2="190" y2="75"/><line x1="270" y1="65" x2="270" y2="75"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="90">0</text><text x="110" y="90">2 m</text><text x="190" y="90">4 m</text><text x="270" y="90">6 m</text>
  </g>
  <line x1="36.4" y1="58" x2="36.4" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="51.2" y1="50" x2="51.2" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="70.4" y1="42" x2="70.4" y2="70" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="76" y="38" font-size="11" fill="#1d6fd1">CEP 0.16, p95 0.53, p99 1.01 m</text>
  <line x1="330" y1="40" x2="330" y2="70" stroke="#b4232c" stroke-width="2.5"/>
  <text x="326" y="30" font-size="11" text-anchor="end" fill="#b4232c">limit 7.5 m</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">miss distance, 40 px per metre</text>
</svg>
```

All three percentiles crowd into the first metre-and-a-bit; the limit is far off to the right.
:::

::: context correlation What a correlation coefficient measures
The correlation coefficient, usually written $r$, runs from $-1$ to $+1$. It says how well a straight line fits a scatter of points: $+1$ means one quantity rises exactly in step with the other, $0$ means no straight-line relation. An on-or-off event is better studied by splitting the cases into groups, as the example did.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="170" x2="60" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="54" y="174">0</text><text x="54" y="114">2</text><text x="54" y="54">4</text>
  </g>
  <text x="14" y="16" font-size="11" fill="#1f2a44">touchdown speed (m/s)</text>
  <rect x="100" y="85.7" width="70" height="84.3" fill="#8fb8f0"/>
  <rect x="220" y="42.8" width="70" height="127.2" fill="#f2b880"/>
  <line x1="60" y1="50" x2="330" y2="50" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="326" y="44" font-size="11" text-anchor="end" fill="#b4232c">limit 4.0</text>
  <text x="135" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">2.81</text>
  <text x="255" y="37" font-size="12" text-anchor="middle" fill="#1f2a44">4.24</text>
  <text x="135" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">GNSS continuous</text>
  <text x="255" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">GNSS dropout</text>
</svg>
```

The dropout group's average sits above the limit; the other group's sits well below it.
:::

::: context margin-plot Margins as a curve, not a number
A stability margin checked only at one moment of flight says little, because mass, dynamic pressure and fill level all change during the burn. A margin plot freezes the vehicle at many instants — "frozen-time" analysis — computes gain and phase margin at each, and draws them against flight time, often as a band covering all the dispersed cases. The requirement is a horizontal line; the plot shows at a glance whether every case stays above it for the whole flight.
:::

::: context v-and-v Two different questions
Verification asks "did we build it right?" — does the software meet its written requirements, as shown by tests and analysis. Validation asks "did we build the right thing?" — do the model and the requirements match the real world and the real mission. A simulation campaign is strong verification. It is only as much validation as the simulation's match to reality, which is exactly what the known-limitations section spells out.
:::
