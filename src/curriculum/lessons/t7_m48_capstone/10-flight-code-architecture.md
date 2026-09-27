---
id: l10-flight-code-architecture
title: One implementation, a C++ core and a Python layer
minutes: 21
covers:
  - C++ flight core with a Python analysis and plotting layer over it, sharing exactly one implementation of the algorithms
---

Imagine your family keeps its birthday list in two places: a paper calendar on the fridge and a list on your phone. On the first day they match. Then your cousin moves her party, and someone fixes the paper copy but not the phone. A month later a new baby is born, and only the phone gets updated. Nobody did anything wrong. But now the two lists disagree, and the next time you check one of them, you do not know which one to believe.

Flight software has the same problem. Every lesson so far in this module has been about one algorithm meeting another. This lesson is about something that sounds like housekeeping: which language the flight code is written in, and how the tools that study it are built. It turns out to be able to hurt a mission just as quietly as any of the joins you have already seen.

The trap is this. A team keeps two copies of the same algorithm — one that flies, and one used to analyze and verify it. They think they have two views of one truth. What they really have is two things that will drift apart, on a timescale set only by how long it takes the next person to edit one copy without noticing the other exists.

## Why a second copy is not a safety net

The flight computer runs a **[[C++|cpp-core]]** program — a fast, compiled language — called the **flight core**. It holds the guidance law, the navigation filter and the control law. Analysts, meanwhile, want to plot trajectories, run sensitivity studies and drive the Monte Carlo campaign. They like **Python**, a slower but far more convenient language for that kind of work.

The natural instinct is to rewrite the guidance law in Python. The reasons are sensible. A Python version is quick to change, easy to plot from, and does not need a C++ build set up on an analyst's laptop. None of that is wrong.

What is wrong is the idea that the Python version is a convenience "on top of" the flight code. It is not on top of anything. It is a second, separately maintained copy of exactly the logic the flight code is supposed to hold. From the day both exist:

- every bug fix has to be made twice;
- every constant has to be typed twice;
- every edge case — what happens when time-to-go reaches zero, say — has to be decided twice, by two people, on two schedules.

Nothing keeps the two in step except discipline, and that discipline has to hold perfectly, forever, through every future change. It will not. They **drift** — slowly grow apart through small, separate edits — usually in the corner cases nobody exercises.

And when they drift, nobody gets an error message. The analysis goes on certifying an algorithm that is not the one flying. The first sign is often a gap between what the analysis predicted and what the vehicle actually did — and the natural reaction is to blame the vehicle, not the second copy.

::: key The one-implementation rule
The C++ flight core is the single implementation of every algorithm in this module. The Python layer calls into it — through a **binding**, not a rewrite — for analysis, plotting and campaign orchestration, and owns none of the algorithms itself. There is exactly one place a guidance law, a filter update or a control law is expressed in code. Everything downstream of it, in any language, runs that same code rather than a second description of it.

On a flashcard: the analysis layer binds the flight core rather than reimplementing it. Two implementations drift silently, and the analysis ends up verifying an algorithm that is not the one flying.
:::

So who does what? The Python layer owns what Python is good at: setting up scenarios, running campaigns, making plots and writing reports. The C++ core owns every algorithm. That split is the whole architecture.

## Binding, not reimplementing

A promise to "keep the copies in sync" is not a mechanism. The mechanism is a **binding layer**: a small amount of glue code that lets Python call a compiled C++ function directly. This module's resource list points to **[[pybind11|pybind11]]**, the standard tool for it.

Here is the key idea, said slowly. When Python calls a bound function, it is not running a second version that happens to give similar numbers. It is running the *same compiled function* — the same machine instructions the flight computer runs — reached from a different caller. The binding only translates the inputs and outputs at the border: a Python array goes in, a C++ vector comes out on the other side, and the answer is translated back.

A picture helps. Think of one kitchen with two doors. The flight computer comes in one door and Python comes in the other, but there is only one cook. Nobody can get a different meal by using the other door.

::: example What the binding looks like
Here is the closed-form ZEM/ZEV guidance law from this module's deadline-policy work. **ZEM**, the zero-effort miss, is how far from the target you would end up if the engine did nothing but gravity acted; **ZEV**, the zero-effort velocity, is the same idea for speed. The law turns those two gaps into an acceleration command. It is written once in C++ using the **[[Eigen|eigen]]** linear-algebra library, with its Python binding in the same file:

```cpp
// capstone_core.cpp: the one implementation, plus its Python binding.
#include <Eigen/Dense>
#include <pybind11/pybind11.h>
#include <pybind11/eigen.h>
#include <algorithm>
namespace py = pybind11;

// Closed-form ZEM/ZEV guidance. The flight computer calls this directly.
Eigen::Vector3d zem_zev_accel(const Eigen::Vector3d& r, const Eigen::Vector3d& v,
                              const Eigen::Vector3d& r_f, const Eigen::Vector3d& v_f,
                              const Eigen::Vector3d& g, double t_go, double t_go_floor) {
    const double t = std::max(t_go, t_go_floor);            // guard the singularity
    const Eigen::Vector3d zem = r_f - (r + v * t + 0.5 * g * t * t);
    const Eigen::Vector3d zev = v_f - (v + g * t);
    return (6.0 / (t * t)) * zem - (2.0 / t) * zev;
}

// The binding: a few lines that hand Python the same compiled function.
PYBIND11_MODULE(capstone_core, m) {
    m.def("zem_zev_accel", &zem_zev_accel,
          py::arg("r"), py::arg("v"), py::arg("r_f"), py::arg("v_f"),
          py::arg("g"), py::arg("t_go"), py::arg("t_go_floor") = 0.5);
}
```

Read it in two parts. The top half is the algorithm: clamp time-to-go to a floor, form the zero-effort miss and zero-effort velocity, and combine them. The bottom half is the whole binding — four lines that tell Python "this name means that compiled function, with these argument names". Nowhere in the binding is the formula typed a second time.

Compiled into a Python module (with `g++ -std=c++17 -shared -fPIC`, plus the Eigen, pybind11 and Python include folders), an analysis script uses it like any Python function:

```python
import numpy as np
import capstone_core  # the compiled C++ module, not a Python copy

a = capstone_core.zem_zev_accel(
    r=np.array([0.0, 0.0, 1000.0]), v=np.zeros(3),
    r_f=np.zeros(3), v_f=np.zeros(3),
    g=np.array([0.0, 0.0, -9.80665]), t_go=20.0)
print(a)  # [ 0.       0.      -5.19335]
```

Sanity check by hand. With $t_{go} = 20\,\mathrm s$: $\mathrm{ZEM}_z = -(1000 - 0.5 \times 9.80665 \times 400) = 961.33\,\mathrm m$ and $\mathrm{ZEV}_z = -(-9.80665 \times 20) = 196.133\,\mathrm{m/s}$. Then $\frac{6}{400}(961.33) - \frac{2}{20}(196.133) = 14.420 - 19.613 = -5.193\,\mathrm{m/s^2}$. It matches the printout, so the numbers crossed the border intact.
:::

## What a second copy actually costs, measured

The risk of two copies is not made up, and it does not need a large or dramatic mistake. One physical constant, rounded a little differently in two places, is enough. And the same kind of one-line slip can be tiny or huge — nothing about how it looks tells you which.

::: example A rounding difference small enough to hide inside every test
Fly this module's reference landing burn twice. The first run uses the **[[standard gravity|standard-gravity]]** constant $g_0 = 9.80665\,\mathrm{m/s^2}$ everywhere. The second is identical except that a second copy of the code rounds it to $g_0 = 9.81\,\mathrm{m/s^2}$ — the kind of rounding a well-meaning engineer makes without a second thought while copying a formula.

How big is that change? Divide the difference by the true value:

$$
\frac{9.81 - 9.80665}{9.80665} = \frac{0.00335}{9.80665} \approx 0.000342 = 0.0342\%.
$$

About three parts in ten thousand. In the module's simulation, the two runs' touchdown states then differ by about $0.23\,\mathrm{cm}$ in position and about $68\,\mathrm{mm/s}$ in vertical speed.

Both numbers would slip inside almost any sensible **[[unit-test tolerance|test-tolerance]]**. That smallness is the danger, not a comfort. A difference too small for any one test to flag is also too small for a reviewer skimming the change to notice. It costs nothing to introduce, and it piles up with every other small difference two separately maintained copies collect over the years.
:::

::: example The same kind of slip, a very different size
Turning a commanded thrust acceleration into a pointing angle uses the `atan2` function, and `atan2` takes its two inputs in a fixed order. In this module's convention the angle from vertical is $\operatorname{atan2}(a_x, a_z)$ — read "a-tan-two of a-x, a-z" — where $a_x$ is the sideways part and $a_z$ the upward part.

At ignition the commanded angle is $-15.12^\circ$. So, for a command of length $a$, $a_x = a\sin(-15.12^\circ)$ and $a_z = a\cos(-15.12^\circ)$.

Now [[swap the two inputs|atan2-swap]] by mistake: $\operatorname{atan2}(a_z, a_x)$. Swapping sine and cosine turns an angle $\theta$ into $90^\circ - \theta$:

$$
90^\circ - (-15.12^\circ) = 105.12^\circ.
$$

The error is $105.12^\circ - (-15.12^\circ) = 120.24^\circ$ — the vehicle would be told to point its thrust below the horizon. The typed line looks almost the same as the correct one, and a second, separately typed copy is free to make exactly this slip.

Put the two examples side by side. Both are one line that differs between two copies of a function, with no intent to change anything. One costs a few tens of millimeters per second. The other points the engine in a direction that has almost nothing to do with where it should point. A reviewer who has learned to relax around "it is only a rounding difference" has learned the wrong lesson from the first example to guard against the second.
:::

The history of spaceflight has a famous case of two pieces of software quietly disagreeing: the **[[Mars Climate Orbiter|mco]]**. No test caught it, because each piece was right by its own rules.

::: warning A binding does not make the one copy correct
The one-implementation rule stops the Python layer from becoming a second, drifting copy. It does nothing to check that the single copy is right in the first place. That is the whole job of the unit tests, integration tests and Monte Carlo campaign this module builds elsewhere. Still, notice the difference. One implementation that is wrong is one bug to find and fix. Two implementations, one of them wrong, is a bug that first has to be noticed as a **[[disagreement|wrong-copy]]** before anyone can even ask which side is right.
:::

::: warning "The Python version is only for plots" is where this starts
Nobody sets out to build two competing copies of a guidance law. It starts with a Python function written to make one plot look right for one meeting. It is kept because it was handy, stretched the next time a similar plot was needed, and one day trusted for a campaign result — without anyone deciding, at any single moment, "we now maintain two implementations". The fix is to decide once, in the structure of the code, that the Python layer never owns an algorithm at all. It should not be a rule re-applied by judgment every time a quick script would be easier to write from scratch.
:::

## How to keep it that way

A rule on a wiki page erodes. A structure holds. A few habits make the one-implementation rule part of the structure:

- **The Python package has no math of its own.** If a Python file contains a guidance, navigation or control formula, that is a bug by definition. Some teams check this in code review with a short list of forbidden patterns.
- **Constants live in one place.** Values like $g_0$ are defined once in the C++ core and read from there by Python through the binding, never retyped.
- **Tests cross the border.** A test calls the bound function from Python and compares it against a hand-worked number, as the example above did. If the binding ever breaks, this test fails first.
- **The simulation, the campaign and the flight computer run the same build.** Then every number the campaign reports is a number about the code that will fly.

## Check yourself

::: check
Explain, in terms of what actually runs, why a pybind11 binding is not merely a faster or handier way of writing the same algorithm twice.
:::

::: answer
A binding contains no second copy of the algorithm at all. It exposes the already-compiled C++ function to a Python caller and converts the inputs and outputs at the border. So calling it from Python runs the very same machine instructions the flight computer runs. Writing the algorithm again in Python, however carefully, makes a second, independent piece of source code that has to be kept correct on its own. A binding has no second source to keep correct, because there is only one implementation for either caller to reach.
:::

::: check
Both divergence examples came from one small, believable, one-line difference between two copies. Why does the lesson treat the small one ($g_0$ rounding) as just as important a warning as the large one (swapped `atan2` inputs), instead of dwelling only on the dramatic one?
:::

::: answer
The pair shows that you cannot predict the *size* of a slip's consequence from how it looks on the page. Both are one harmless-looking line, and reading either line alone does not reveal which kind of damage it will do. A warning built only around the dramatic example would teach "watch out for big, obviously wrong-looking changes". That is the wrong lesson, because the small, easy-to-dismiss difference is the one most likely to survive a casual review — exactly because it looks harmless.
:::

::: check
A team keeps a Python rewrite of the guidance law "only for making plots", and argues it is safe because plots are never used for a flight decision. What is the flaw in that argument, based on how such rewrites grow?
:::

::: answer
A plotting convenience is the usual *starting point* of a drifting second copy, not a safe place where it stays forever. Once a handy Python function that computes guidance exists, it gets reused for the next similar need — a quick sensitivity check, then a small campaign, then a result someone quotes — with no single moment where anyone decided to trust it for something that matters. The risk is not that today's plot is trusted. It is that nothing in the structure stops tomorrow's decision from quietly leaning on the same unchecked function.
:::

::: check
Why does the lesson insist that a binding "does nothing to check that the single copy is right", when the whole point of the lesson is trustworthy flight code?
:::

::: answer
Binding solves one narrow problem: it stops a *second* copy from drifting away from the first. Whether the *one* copy that remains is a correct algorithm is a different question. A single, well-bound copy of a wrong formula is wrong every time it runs. The rule guarantees that when a bug is found, there is exactly one place to fix it and no chance of fixing only one of two disagreeing copies. But proving that one copy right is the job of the unit tests and Monte Carlo verification the rest of the module builds.
:::

::: check
During a Monte Carlo campaign, a team finds that its Python-computed sensitivity analysis disagrees with the C++ core's own logged numbers for the same simulated cases. Under this lesson's architecture, what does that most likely mean, and how would you confirm it?
:::

::: answer
Under the one-implementation architecture, the Python layer calls the bound C++ core and recomputes nothing itself. So a disagreement most likely means that somewhere the analysis layer has broken its own rule and rewritten a piece of logic instead of calling the core — the anti-pattern that tends to creep in through a plotting convenience. To confirm it, search the Python analysis code for any place a guidance, navigation or control calculation is written out in Python instead of obtained by calling the bound core. Then replace that calculation with a call to the single implementation, and check the disagreement disappears.
:::

## Summary

| Idea | In one line |
| --- | --- |
| The rule | Exactly one implementation, in the C++ core; the Python layer calls it through a binding and never rewrites it |
| Mechanism | pybind11 (or similar) exposes compiled C++ functions to Python — the same running code, not a second description of it |
| Who owns what | Python: scenarios, campaigns, plots, reports. C++: every algorithm |
| Small divergence, measured | A $0.034\%$ change in $g_0$ (`9.80665` vs `9.81`) moves touchdown by about $0.23\,\mathrm{cm}$ and $68\,\mathrm{mm/s}$ — small enough to hide in most test tolerances |
| Large divergence, same kind of slip | Swapped `atan2` inputs turn $-15.12^\circ$ into $105.12^\circ$, a $120.24^\circ$ error, from one line |
| What binding does not do | Prove the single implementation correct — that is the rest of the module's verification |
| Where it usually starts | A Python function written "only for a plot", kept, reused, and one day trusted without anyone deciding to trust it |

This architecture is what makes the next lesson's numbers honest. When the Monte Carlo campaign reports a result, it is a result about the one implementation that will actually fly, not about a Python imitation of it. That campaign, and the written report built from it, is where this module closes.

::: context cpp-core Why flight code is written in C++
C++ is **compiled**: a program called a compiler turns the source text into machine instructions ahead of time, so nothing has to be interpreted while the rocket flies. That makes it fast and, just as important, predictable — a flight engineer can bound how long each function takes. It also lets the code avoid grabbing new memory in the middle of a control cycle, a common cause of surprise delays. SpaceX has said publicly that its flight software is largely C++. Python, by contrast, is interpreted line by line, which is wonderful for quick analysis and far too unpredictable for a 100 Hz control loop.
:::

::: context pybind11 One cook, two doors
pybind11 is a free, header-only C++ library. You write a few lines saying which C++ functions Python may see, compile once, and get a module Python can `import`. When Python calls one of those functions, it runs the compiled C++ code directly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="60" width="120" height="50" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="82" font-size="12" text-anchor="middle" fill="#1f2a44">C++ flight core</text>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">one copy of the math</text>
  <rect x="10" y="10" width="100" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">flight computer</text>
  <rect x="250" y="10" width="100" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">Python analysis</text>
  <line x1="80" y1="46" x2="140" y2="58" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="142,59 131,59 136,52" fill="#1d6fd1"/>
  <line x1="280" y1="46" x2="220" y2="58" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="218,59 229,59 224,52" fill="#1d6fd1"/>
  <text x="262" y="72" font-size="11" fill="#6c7a93">via binding</text>
  <line x1="120" y1="140" x2="240" y2="140" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#b4232c">no second Python copy of the math</text>
</svg>
```

Both callers reach the same box. There is no second box to drift.
:::

::: context eigen Eigen and fixed-size vectors
Eigen is a free C++ library for vectors and matrices, and it is the usual choice in flight-adjacent C++. Its fixed-size types, like `Eigen::Vector3d` (three `double` numbers), have their size known when the code is compiled. That lets them live on the stack with no memory allocation at run time, which keeps the timing of each control cycle steady. pybind11 ships a helper, `pybind11/eigen.h`, that converts NumPy arrays to Eigen vectors and back at the border.
:::

::: context standard-gravity A number that is exact by definition
$g_0 = 9.80665\,\mathrm{m/s^2}$ is not measured; it was fixed by international agreement in 1901 as "standard gravity". Real gravity at Earth's surface ranges from about $9.78$ at the equator to $9.83\,\mathrm{m/s^2}$ at the poles. Because $g_0$ is exact, any other value in a program — $9.81$, $9.8$ — is a rounding someone chose, and two copies of the code can easily choose differently. That is exactly why constants should be typed once.
:::

::: context test-tolerance What a test tolerance is
Computers do arithmetic with a small, fixed number of digits, so two correct calculations can differ in their last digits. A unit test therefore asks "are these within some tolerance?" rather than "are these exactly equal?". A touchdown-speed test might accept anything within $0.1\,\mathrm{m/s}$ of the expected value. A $68\,\mathrm{mm/s}$ difference passes that test without a murmur — which is the point of the example.
:::

::: context atan2-swap Picturing the swapped inputs
The angle is measured from vertical. The correct call leans the thrust $15.12^\circ$ to one side of straight up. Swapping the inputs mirrors the arrow across the $45^\circ$ line, so it comes out $105.12^\circ$ from vertical — below the horizon on the other side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="120" x2="180" y2="22" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <line x1="70" y1="120" x2="300" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="186" y="20" font-size="11" fill="#6c7a93">vertical</text>
  <line x1="180" y1="120" x2="159.1" y2="42.8" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="159.1" cy="42.8" r="4" fill="#1d6fd1"/>
  <text x="70" y="50" font-size="12" fill="#1d6fd1">correct: −15.12°</text>
  <line x1="180" y1="120" x2="257.2" y2="140.9" stroke="#b4232c" stroke-width="3"/>
  <circle cx="257.2" cy="140.9" r="4" fill="#b4232c"/>
  <text x="238" y="165" font-size="12" fill="#b4232c">swapped: 105.12°</text>
  <circle cx="180" cy="120" r="4" fill="#1f2a44"/>
  <text x="310" y="124" font-size="11" fill="#6c7a93">horizon</text>
</svg>
```

The two arrows are $120.24^\circ$ apart — about a third of a full turn.
:::

::: context mco Lost to a mismatch between two programs
In September 1999 NASA's Mars Climate Orbiter came in far too low at Mars and was lost. A ground program supplied thruster impulse data in pound-force seconds, while the navigation software that used the data expected newton-seconds — a factor of about $4.45$. Each program was right by its own convention; the fault lived in the gap between them, and small trajectory errors built up over months of cruise. It is not a two-copies bug exactly, but it is the same family: two pieces of software that each pass their own checks and silently disagree.
:::

::: context wrong-copy Which copy is right?
When two copies of an algorithm disagree, the disagreement tells you only that at least one is wrong. Someone must then study both, often by stepping through a case line by line, to find out which. With one copy there is no disagreement to referee: a failing test points straight at the one place to fix. This is also why a question like "did the analysis check the code that flies?" should always have the answer "it ran the code that flies".
:::
