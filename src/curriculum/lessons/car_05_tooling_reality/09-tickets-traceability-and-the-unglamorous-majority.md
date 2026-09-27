---
id: l09-tickets-traceability-and-the-unglamorous-majority
title: "Tickets, traceability, and the unglamorous majority of the work"
minutes: 19
covers:
  - continuous integration for rocket and simulation software
---

Picture a big group project at school. Most of the time does not go into the brilliant idea. It goes into finding out why the slides someone edited last night now crash, redoing a calculation a teammate did weeks ago so you can trust it, remembering *why* a paragraph says what it says, and writing notes clear enough that the next person — often you, a month later — can pick up where you left off.

Engineering in this field is the same. Most working days are not spent deriving a new control law. They are spent finding out why a **build** went red overnight, reproducing a result someone reported three months ago so it can be trusted again, tracing a behavior back to the **ticket** and **requirement** that justify it, and writing down what was done clearly enough that the next reader can rebuild it without guessing.

None of this is a distraction from the real work. It *is* most of the real work. This lesson covers the four pieces of it that show up every day: continuous integration, regression suites, traceability, and reproducing a result.

## Continuous integration: a machine checks every change first

A **[[build|build-word]]** is the process of turning source code into working programs and running their checks. **Continuous integration**, or **CI**, is an automated system that builds the codebase and runs some or all of its tests *every time a change is proposed*, instead of waiting for a person to remember to do it.

Think of a spell-checker that underlines a typo the moment you type it, versus a teacher who finds it two weeks later when grading. CI is the spell-checker. Paired with a build system that knows the dependency graph — from the infrastructure lesson — every proposed change is checked against exactly the tests it could affect, automatically, within minutes. Without it, a defect survives until someone happens to run the right test by hand, which might be days or weeks later, long after everyone has forgotten the change that caused it.

This matters more here than in a lot of software because of what a missed defect costs. In flight software the cost is immediate and obvious. In simulation software it is just as real, only quieter. A simulation with a hidden bug does not crash. It produces a believable number, the number becomes the basis for a design decision, and by the time anyone finds the bug, real engineering choices may already sit on top of it. Both cases repeat a lesson from earlier in this module — a plausible-looking result is not evidence that it is correct — now applied to a whole test suite instead of one function.

### Why a red build is urgent

When every test passes, the build is **green**. When at least one fails, it is **[[red|red-green]]**.

Suppose the build goes red and people keep **merging** — adding their changes into the shared code — on top of it. After three more changes land, nobody can tell which change caused which failure. The whole value of testing every change is being able to point at *one* recent, known change and say "that one". That value is lost the moment more than one unexamined change sits on top of a known-broken build. So most serious engineering teams treat a red build as the team's most urgent open problem, not one more item in a backlog.

::: key
Continuous integration runs the test suite automatically on every proposed change, catching a defect within minutes instead of relying on someone eventually running the right test by hand. A red build is urgent specifically because attributing a failure to its cause depends on fixing it before further changes obscure which one was responsible.
:::

### From unit test to hardware in the loop

For rocket software, CI is the bottom of a ladder. Each rung is slower and more expensive than the one below, and closer to the real vehicle. The details differ between companies, but the usual shape is:

1. **Unit tests** — small checks of one function at a time, run in seconds on every change.
2. **Simulation and regression tests** — the flight code runs inside a simulation of the vehicle on ordinary computers (often called **software in the loop**), and results are compared with recorded ones.
3. **[[Hardware in the loop|hardware-in-the-loop]]**, or **HIL** (said "H-I-L" or "hill") — the *real* flight computer, running the real flight software, is wired to a simulation that feeds it fake sensor signals in real time and reads back its commands. The computer cannot tell it is not flying.
4. **Vehicle-level tests** — the software on the assembled vehicle, such as during engine test firings on the ground.

The fast rungs run on every change. The slower rungs run on a schedule, or before a release. A defect caught on rung 1 costs minutes; the same defect found on rung 4 can cost days and a test article.

## What a regression test claims — and what it does not

A **regression** is when something that used to work stops working — the code "goes backward". A **regression test** checks for exactly that. Its claim is narrower than it sounds, and the difference matters.

It does **not** claim "this code is correct". It claims "this specific, recorded behavior, at these specific inputs, has not silently changed". The recorded outputs it compares against are called **[[golden values|golden-values]]**.

Those are different claims. If the golden values were wrong when they were recorded, a regression test built from them will happily keep confirming the wrong answer forever. Its job is spotting drift from a recorded baseline, not checking that the baseline was right. Verification and validation, from the lesson on reading someone else's simulation, establish that the baseline deserves trust. Once it does, the regression suite makes sure nobody moves away from it without that move being deliberate and reviewed.

::: example A subtle "cleanup" a regression test catches
A **gain schedule** picks a control gain — how hard the controller reacts — based on the current altitude. This one uses a small table and **[[linearly interpolates|interpolation]]** between its points, meaning it draws a straight line between neighboring table entries and reads off the value in between:

```python
import numpy as np
TABLE_ALT = np.array([0, 2000, 5000, 10000, 20000])
TABLE_GAIN = np.array([0.80, 0.95, 1.20, 1.05, 0.70])

def gain_v1(alt_m):
    return float(np.interp(alt_m, TABLE_ALT, TABLE_GAIN))

test_altitudes = [0, 1000, 3500, 7500, 15000, 20000]
golden = {alt: round(gain_v1(alt), 6) for alt in test_altitudes}
# {0: 0.8, 1000: 0.875, 3500: 1.075, 7500: 1.125, 15000: 0.875, 20000: 0.7}
```

**Checking one golden value by hand.** At 1,000 m we are halfway from 0 m (gain 0.80) to 2,000 m (gain 0.95). Halfway between the gains is $0.80 + \tfrac{1}{2}(0.95 - 0.80) = 0.875$. That matches the recorded value.

A later "cleanup" replaces the interpolation with a snap to the nearest table point. It looks harmless, and it passes a quick glance at the two functions. The regression test then runs the new version against the golden values:

```python
def gain_v2(alt_m):
    idx = int(np.argmin(np.abs(TABLE_ALT - alt_m)))
    return float(TABLE_GAIN[idx])

for alt in test_altitudes:
    got = gain_v2(alt)
    status = "PASS" if abs(got - golden[alt]) < 1e-9 else "FAIL"
    print(f"alt={alt:>8.1f} m  golden={golden[alt]:.6f}  got={got:.6f}  [{status}]")
```

```text
alt=     0.0 m  golden=0.800000  got=0.800000  [PASS]
alt=  1000.0 m  golden=0.875000  got=0.800000  [FAIL]
alt=  3500.0 m  golden=1.075000  got=0.950000  [FAIL]
alt=  7500.0 m  golden=1.125000  got=1.200000  [FAIL]
alt= 15000.0 m  golden=0.875000  got=1.050000  [FAIL]
alt= 20000.0 m  golden=0.700000  got=0.700000  [PASS]
```

**Reading the result.** Four of six cases fail. The two that pass, 0 m and 20,000 m, sit exactly *on* table entries, where interpolating and snapping must agree. Every altitude *between* table points — which is most of the real flight envelope — is now quietly wrong. At 1,000 m, for instance, the new code gives 0.800 instead of 0.875, a gain about 9% too low.

**Sanity check.** Rerun the same test against the original, unchanged `gain_v1`, and all six pass. That proves the test is responding to the change, not to some unrelated flakiness.

A reviewer skimming the difference between the two versions, or a suite that only checked round, on-the-table altitudes, would never have caught this. A suite built on purpose to include in-between altitudes catches it at once.
:::

This is why a regression suite is only as good as its chosen test points. It is the same lesson as choosing boundary and sign cases in the first lesson of this module: a suite that only checks the easy, round-number cases will pass straight through a defect that lives in the cases nobody thought to check.

## Traceability: why an analysis nobody can reproduce is not evidence

A **[[ticket|ticket-word]]** is a recorded, specific claim: what was observed, under what conditions, and what was expected instead. It is the unit that a fix, a test, and eventually a requirement all point back to. A **requirement** is a written rule the vehicle or software must meet, such as "land within 10 m of the target".

**[[Traceability|traceability]]** is the set of links between them, running both ways:

- *backward*, from a piece of code or a test to the ticket or requirement that justified it;
- *forward*, from a requirement to the specific tests that show it is met.

This matters most when an analysis is offered as evidence for a decision: that a design meets a requirement, that a fix solves an observed problem, that a dispersion campaign supports flight readiness. An analysis nobody but its author can reproduce is not evidence in any lasting sense, however careful that person believes they were. If the inputs, the exact code version, the settings and — whenever randomness is involved, as in dispersion campaigns — the **[[seed|seed]]** were not recorded, nobody can check the claim later. That includes its own author, once enough time has passed to forget the details. "I ran it and it looked fine" is not a recorded, reproducible result. It is closer to a rumor with a confident tone.

::: example What "reproducible" actually requires
A random-number generator with no seed gives a different answer every time it runs, even with identical code, because nothing pins down which sequence of random values it uses. Here the same one-line program is run twice (the `run A` and `run B` labels mark the two outputs):

```text
$ python3 -c "import numpy as np; print(np.random.default_rng().integers(0,1_000_000,4))"
run A: [577604 157224 700588 421039]

$ python3 -c "import numpy as np; print(np.random.default_rng().integers(0,1_000_000,4))"
run B: [  9756 341218 853867  57405]
```

Same code, two different results. Neither is wrong, but neither can be reproduced, and a colleague told only "I got roughly these numbers" has no way to check either run. Now give the generator a seed, the number 20260922:

```text
$ python3 -c "import numpy as np; print(np.random.default_rng(20260922).integers(0,1_000_000,4))"
run A: [713397 991821 897099 869218]

$ python3 -c "import numpy as np; print(np.random.default_rng(20260922).integers(0,1_000_000,4))"
run B: [713397 991821 897099 869218]
```

**What changed.** With the seed fixed and written down, two independent runs — in two completely separate processes — give identical output, every time.

**Sanity check.** Try it yourself: with the same seed and NumPy's default generator, you should see the same four numbers. If you do, you have just reproduced someone else's result.

To reproduce a colleague's result you need exactly the pieces that made the second version checkable: the same code (or a recorded version identifier for it), the same settings, and — whenever randomness is involved — the same seed. All of it written down *when the result was produced*, not rebuilt from memory afterward.
:::

::: warning "It's in my head" is not a substitute for a written record
A result that only its author can explain, because the inputs and settings were never written down, is not lasting evidence. It is a claim that expires the moment its author forgets the details or leaves the team. Writing the record down at the time — not after being asked for it — is the whole difference between an analysis and a rumor.
:::

## Check yourself

::: check
Explain what a "red" continuous integration build means and why merging further changes on top of a known-red build is specifically harmful, not only generally sloppy.
:::

::: answer
A red build means the automated test suite found at least one failure in the current state of the codebase. Merging more changes on top of it is specifically harmful because it destroys the ability to trace the failure to its cause. Once more than one unexamined change sits on a known-broken build, nobody can tell which of them introduced the problem. That defeats the whole purpose of testing every change: quickly pinning a new failure on one recent, identifiable change.
:::

::: check
State precisely what a passing regression test claims, and explain why that claim is narrower than "this code is correct."
:::

::: answer
A passing regression test claims that a specific, previously recorded behavior at specific inputs has not changed since the baseline was captured. It does not claim the baseline was correct. If the golden values were wrong when recorded, a regression test built from them will keep confirming the wrong answer indefinitely, because its job is detecting drift from a recorded value, not checking that the recorded value was right. Establishing that the baseline deserves trust is a separate task, handled by verification and validation.
:::

::: check
In the gain-schedule example, explain exactly which test cases failed and which passed, and what that specific pattern reveals about where this class of bug hides.
:::

::: answer
The cases at 0 m and 20,000 m passed because those altitudes sit exactly on table points, where linear interpolation and nearest-point snapping must give the same value. The four cases at 1,000, 3,500, 7,500 and 15,000 m — all strictly between table points — failed, because that is exactly where the two methods differ. So this kind of bug hides in the "in-between" cases, and a suite that only checks convenient, round, on-the-table values would never catch it.
:::

::: check
Define traceability and explain why "an analysis nobody can reproduce is not evidence" follows directly from it.
:::

::: answer
Traceability is the ability to connect a piece of code, a test, or a result back to the ticket or requirement that justified it, and forward from a requirement to the tests that show it is met. An analysis that cannot be reproduced breaks this chain at its base. If nobody — including its own author, later — can rerun it and get the same answer, then a requirement's claimed satisfaction traces back to nothing but an unverifiable statement. That is not something traceability, or an engineering decision built on it, can rest on.
:::

::: check
Using the seeded-versus-unseeded example, list specifically what would need to be recorded in a ticket or lab notebook entry for a colleague to actually reproduce a stated numeric result.
:::

::: answer
At minimum: the exact code or a recorded version identifier for it, the configuration or parameters used, and — whenever randomness is involved — the specific seed, all recorded when the result was produced. The unseeded runs show that without a recorded seed, even identical code gives a different answer every time, so "the same code" alone is not enough. The seed is the missing piece that turns "I got roughly this number once" into "run this, and you will get exactly this number".
:::

::: check
A team's CI runs unit tests on every change, but hardware-in-the-loop tests only once a week. Explain what each rung catches and why it makes sense to run them at different rates.
:::

::: answer
Unit tests check individual functions in seconds, so running them on every change catches most defects within minutes and pins each failure on one change. Hardware-in-the-loop runs the real flight software on the real flight computer against a real-time simulation; it catches problems only the real hardware shows, such as timing on the actual processor or how the computer talks to its sensors and actuators. It is slow, needs scarce equipment, and cannot keep up with every change, so it runs on a schedule or before a release. Fast, cheap checks run often; slow, expensive, more realistic checks run less often but still before anything flies.
:::

## Summary

| Term | What it means |
| --- | --- |
| Continuous integration | Automated build and test on every proposed change, catching defects within minutes |
| Red build | A failing build state, treated as urgent because delay destroys attribution to a specific cause |
| Testing ladder | Unit tests → simulation (software in the loop) → hardware in the loop → vehicle tests |
| Regression test | Confirms a specific recorded behavior has not drifted; does not itself prove the baseline was correct |
| Golden values | The recorded, trusted outputs a regression test compares against |
| Ticket | A recorded, specific claim that a fix, test, and requirement can be traced back to |
| Traceability | The connection, in both directions, between code or a result and the requirement it satisfies |
| Reproducibility | Same code, same configuration, same seed, recorded at the time — required for a result to count as evidence |

The next lesson looks at the human side of this same process: version control at scale, and what a reviewer of flight code is actually checking for when your change reaches them.

::: context build-word What "the build" means
For a compiled language like C++, a **build** first translates every source file into machine instructions and links them into programs. Then it runs the tests. People say "the build" to mean that whole process — and its current result. "I broke the build" means your change made either the compiling or the tests fail. A large codebase may have thousands of build targets, which is why the build system from the infrastructure lesson only rebuilds the ones a change can reach.
:::

::: context red-green Red, green, and the CI pipeline
The colors come from traffic lights: green means go ahead, red means stop. Most CI tools show each change's result with exactly those colors.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="8" y="40" width="70" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="43" y="62">change</text>
    <rect x="98" y="40" width="70" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="133" y="62">build</text>
    <rect x="188" y="40" width="70" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="223" y="62">tests</text>
    <rect x="280" y="10" width="72" height="34" rx="6" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="316" y="31" fill="#ffffff">green: merge</text>
    <rect x="280" y="80" width="72" height="34" rx="6" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="316" y="101" fill="#ffffff">red: fix now</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#1f2a44">
    <line x1="78" y1="58" x2="92" y2="58"/><polygon points="98,58 90,54 90,62"/>
    <line x1="168" y1="58" x2="182" y2="58"/><polygon points="188,58 180,54 180,62"/>
    <line x1="258" y1="52" x2="274" y2="32"/><polygon points="279,26 270,30 277,35"/>
    <line x1="258" y1="64" x2="274" y2="88"/><polygon points="279,94 271,89 278,85"/>
  </g>
</svg>
```

Blue here stands in for green, since this picture uses a fixed palette. A change only joins the shared code once it comes out the top path.
:::

::: context hardware-in-the-loop Fooling a flight computer on a bench
In a **hardware-in-the-loop** rig, the flight computer sits on a lab bench. Instead of real sensors, it is wired to a fast simulation computer that pretends to be the vehicle and the world.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="12" y="40" width="130" height="56" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="77" y="64" font-weight="700">real flight</text>
    <text x="77" y="80" font-weight="700">computer</text>
    <rect x="218" y="40" width="130" height="56" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="283" y="64" font-weight="700">real-time</text>
    <text x="283" y="80" font-weight="700">simulation</text>
    <text x="180" y="26">fake sensor signals</text>
    <text x="180" y="124">commands (engine, fins)</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#1f2a44">
    <line x1="218" y1="54" x2="148" y2="54"/><polygon points="142,54 150,50 150,58"/>
    <line x1="142" y1="82" x2="212" y2="82"/><polygon points="218,82 210,78 210,86"/>
  </g>
</svg>
```

The simulation computes where the vehicle would be, sends the sensor readings the computer would see, and takes back its commands — round and round, in real time. Rare situations, such as an engine failing, can be staged safely again and again.
:::

::: context golden-values Golden values again
You met **golden values** in the lesson on languages and the model boundary, where a Python model's outputs were recorded so a C++ version could be checked against them. It is the same idea here, used over time instead of across languages: record trusted outputs once, then check every later version against them. The word comes from jewelry and measurement — a "gold standard" is the reference everything else is compared with.
:::

::: context interpolation Interpolating versus snapping
Blue is the original: straight lines between the table points. The orange steps are the "cleanup", which jumps to the nearest point. The dots are the six golden values. Only the two at the ends lie on both curves.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="345" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="170" x2="50" y2="28" stroke="#6c7a93" stroke-width="1"/>
  <path d="M50.0,126.0 H64.5 V93.0 H100.8 V38.0 H158.8 V71.0 H267.5 V148.0 H340.0" fill="none" stroke="#f2b880" stroke-width="3"/>
  <polyline points="50.0,126.0 79.0,93.0 122.5,38.0 195.0,71.0 340.0,148.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#1f2a44">
    <circle cx="50.0" cy="126.0" r="3.5"/><circle cx="64.5" cy="109.5" r="3.5"/><circle cx="100.8" cy="65.5" r="3.5"/>
    <circle cx="158.8" cy="54.5" r="3.5"/><circle cx="267.5" cy="109.5" r="3.5"/><circle cx="340.0" cy="148.0" r="3.5"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="44" y="130" text-anchor="end">0.8</text>
    <text x="44" y="86" text-anchor="end">1.0</text>
    <text x="44" y="42" text-anchor="end">1.2</text>
    <text x="50" y="186" text-anchor="middle">0</text>
    <text x="195" y="186" text-anchor="middle">10 km</text>
    <text x="340" y="186" text-anchor="middle">20 km</text>
    <text x="220" y="30" fill="#1d6fd1">blue: interpolated (v1)</text>
    <text x="220" y="46">orange: nearest point (v2)</text>
  </g>
</svg>
```

Each test altitude sits exactly halfway between two table points, where `argmin` picks the lower one — so v2's answer there is the lower point's gain.
:::

::: context ticket-word Why it is called a ticket
The word comes from help desks: you "open a ticket" and get a number, like a ticket at a deli counter, so your request cannot be lost. Engineering teams track work the same way in tools such as Jira. Each ticket has a number, a description, who owns it, and its status. A good bug ticket says what you did, what you expected, what happened instead, and the exact version — enough for a stranger to see the problem for themselves.
:::

::: context traceability Following the thread both ways
Traceability is a chain you can walk in either direction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="6" y="30" width="78" height="34" rx="6" fill="#8fb8f0" stroke="#1f2a44"/><text x="45" y="51">requirement</text>
    <rect x="98" y="30" width="72" height="34" rx="6" fill="#ffffff" stroke="#1f2a44"/><text x="134" y="51">ticket</text>
    <rect x="184" y="30" width="72" height="34" rx="6" fill="#ffffff" stroke="#1f2a44"/><text x="220" y="51">code</text>
    <rect x="270" y="30" width="84" height="34" rx="6" fill="#f2b880" stroke="#1f2a44"/><text x="312" y="51">test result</text>
    <text x="180" y="18">forward: is this requirement met? which tests show it?</text>
    <text x="180" y="96">backward: why does this line of code exist?</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="84" y1="47" x2="98" y2="47"/><line x1="170" y1="47" x2="184" y2="47"/><line x1="256" y1="47" x2="270" y2="47"/>
  </g>
</svg>
```

Break any link — a result nobody can rerun, a change with no ticket — and the chain can no longer answer either question.
:::

::: context seed Randomness you can replay
Computers usually make "random" numbers with a **pseudo-random** generator: a formula that turns one starting number, the **seed**, into a long sequence that looks random but is completely determined. Same seed, same sequence, every time. With no seed given, NumPy takes a fresh one from the operating system, so each run differs. For a dispersion campaign, the seed is part of the result: record it, and every one of thousands of cases can be replayed exactly — including the one worst case someone wants to study.
:::
